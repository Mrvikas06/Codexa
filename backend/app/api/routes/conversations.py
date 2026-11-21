from typing import List, Optional
import uuid
from fastapi import APIRouter, HTTPException, status
from sqlalchemy import func, select
from sqlalchemy.orm import selectinload

from app.api.dependencies import DBSession
from app.api.schemas.conversation import (
    ConversationDetailResponse,
    ConversationResponse,
    CreateConversationRequest,
    CreateMessageRequest,
    EvidenceReferenceResponse,
    MessageResponse,
)
from app.models.conversation import ClaimConfidence, Conversation, EvidenceReference, Message, MessageRole
from app.models.repository import Repository
from app.services.embedding import EmbeddingService
from app.services.generation.evidence import EvidenceCandidate
from app.services.generation.generator import AnswerGenerator
from app.services.reranker import RerankerService
from app.services.retrieval.hybrid import HybridRetrievalPipeline

router = APIRouter(prefix="/conversations", tags=["Conversations & Grounded Generation"])

_pipeline = None
_generator = None


def get_generator_and_pipeline():
    global _pipeline, _generator
    if _pipeline is None:
        emb_service = EmbeddingService()
        rerank_service = RerankerService()
        _pipeline = HybridRetrievalPipeline(emb_service, rerank_service)
    if _generator is None:
        _generator = AnswerGenerator()
    return _pipeline, _generator


@router.post("", response_model=ConversationResponse, status_code=status.HTTP_201_CREATED)
async def create_conversation(req: CreateConversationRequest, db: DBSession) -> ConversationResponse:
    repo = await db.get(Repository, req.repository_id)
    if not repo:
        raise HTTPException(status_code=404, detail="Repository not found")

    conversation = Conversation(
        workspace_id=repo.workspace_id,
        repository_id=repo.id,
        title=req.title or "New Investigation",
    )
    db.add(conversation)
    await db.commit()
    await db.refresh(conversation)

    return ConversationResponse(
        id=conversation.id,
        workspace_id=conversation.workspace_id,
        repository_id=conversation.repository_id,
        title=conversation.title,
        created_at=conversation.created_at,
        updated_at=conversation.updated_at,
        message_count=0,
    )


@router.get("", response_model=List[ConversationResponse])
async def list_conversations(
    db: DBSession,
    repository_id: Optional[uuid.UUID] = None,
) -> List[ConversationResponse]:
    stmt = select(Conversation).where(Conversation.deleted_at.is_(None))
    if repository_id:
        stmt = stmt.where(Conversation.repository_id == repository_id)
    stmt = stmt.order_by(Conversation.created_at.desc())

    result = await db.execute(stmt)
    conversations = result.scalars().all()

    resp = []
    for conv in conversations:
        count_stmt = select(func.count(Message.id)).where(Message.conversation_id == conv.id)
        count_res = await db.execute(count_stmt)
        msg_count = count_res.scalar_one_or_none() or 0

        resp.append(
            ConversationResponse(
                id=conv.id,
                workspace_id=conv.workspace_id,
                repository_id=conv.repository_id,
                title=conv.title,
                created_at=conv.created_at,
                updated_at=conv.updated_at,
                message_count=msg_count,
            )
        )
    return resp


@router.get("/{conversation_id}", response_model=ConversationDetailResponse)
async def get_conversation(conversation_id: uuid.UUID, db: DBSession) -> ConversationDetailResponse:
    stmt = (
        select(Conversation)
        .options(
            selectinload(Conversation.messages).selectinload(Message.evidence_references)
        )
        .where(Conversation.id == conversation_id, Conversation.deleted_at.is_(None))
    )
    result = await db.execute(stmt)
    conv = result.scalar_one_or_none()
    if not conv:
        raise HTTPException(status_code=404, detail="Conversation not found")

    messages_resp = []
    for msg in conv.messages:
        ev_list = [
            EvidenceReferenceResponse(
                id=ev.id,
                file_id=ev.file_id,
                file_path=ev.file_path,
                start_line=ev.start_line,
                end_line=ev.end_line,
                content=ev.content,
                relevance_score=ev.relevance_score,
                relevance_explanation=ev.relevance_explanation,
                confidence=ev.confidence.value,
                is_verified=ev.is_verified,
            )
            for ev in msg.evidence_references
        ]
        messages_resp.append(
            MessageResponse(
                id=msg.id,
                conversation_id=msg.conversation_id,
                role=msg.role.value,
                content=msg.content,
                evidence_count=msg.evidence_count,
                extra_metadata=msg.extra_metadata,
                created_at=msg.created_at,
                evidence_references=ev_list,
            )
        )

    return ConversationDetailResponse(
        id=conv.id,
        workspace_id=conv.workspace_id,
        repository_id=conv.repository_id,
        title=conv.title,
        created_at=conv.created_at,
        updated_at=conv.updated_at,
        messages=messages_resp,
    )


@router.post("/{conversation_id}/messages", response_model=MessageResponse)
async def send_message(
    conversation_id: uuid.UUID,
    req: CreateMessageRequest,
    db: DBSession,
) -> MessageResponse:
    conv = await db.get(Conversation, conversation_id)
    if not conv or conv.deleted_at is not None:
        raise HTTPException(status_code=404, detail="Conversation not found")

    # 1. Record User Message
    user_msg = Message(
        conversation_id=conv.id,
        role=MessageRole.USER,
        content=req.content,
        evidence_count=0,
    )
    db.add(user_msg)
    await db.flush()

    # 2. Retrieve Grounded Candidates via Hybrid Pipeline
    pipeline, generator = get_generator_and_pipeline()
    hybrid_results = await pipeline.retrieve(
        session=db,
        query=req.content,
        repository_id=conv.repository_id,
        top_k=5,
    )
    candidates = [EvidenceCandidate.from_hybrid_result(r) for r in hybrid_results]

    # 3. Generate Evidence-Grounded Answer & Validate Citations
    answer = await generator.generate_answer(
        session=db,
        repository_id=conv.repository_id,
        query=req.content,
        candidates=candidates,
    )

    # 4. Record Assistant Message
    asst_msg = Message(
        conversation_id=conv.id,
        role=MessageRole.ASSISTANT,
        content=answer.formatted_answer,
        evidence_count=len(answer.citations),
        extra_metadata={
            "investigation_steps": answer.investigation_steps,
            "summary": answer.summary,
            "findings": answer.findings,
            "code_path": answer.code_path,
            "confidence": answer.confidence,
            "is_verified": answer.is_verified,
            "evidence_cards": answer.evidence_cards,
        },
    )
    db.add(asst_msg)
    await db.flush()

    # 5. Persist Evidence References
    ev_responses = []
    cand_code_map = {c.file_path: c.content for c in candidates}

    for cit in answer.citations:
        file_id_val = uuid.UUID(cit["file_id"]) if cit.get("file_id") else None
        ev = EvidenceReference(
            message_id=asst_msg.id,
            file_id=file_id_val,
            file_path=cit["file_path"],
            start_line=cit["start_line"] or 1,
            end_line=cit["end_line"] or 1,
            content=cand_code_map.get(cit["file_path"], "Referenced code block"),
            relevance_score=0.95,
            relevance_explanation=f"Cited evidence for query '{req.content}'",
            confidence=ClaimConfidence.VERIFIED_FACT if cit["is_valid"] else ClaimConfidence.UNKNOWN,
            is_verified=cit["is_valid"],
        )
        db.add(ev)
        await db.flush()

        ev_responses.append(
            EvidenceReferenceResponse(
                id=ev.id,
                file_id=ev.file_id,
                file_path=ev.file_path,
                start_line=ev.start_line,
                end_line=ev.end_line,
                content=ev.content,
                relevance_score=ev.relevance_score,
                relevance_explanation=ev.relevance_explanation,
                confidence=ev.confidence.value,
                is_verified=ev.is_verified,
            )
        )

    await db.commit()

    return MessageResponse(
        id=asst_msg.id,
        conversation_id=asst_msg.conversation_id,
        role=asst_msg.role.value,
        content=asst_msg.content,
        evidence_count=asst_msg.evidence_count,
        extra_metadata=asst_msg.extra_metadata,
        created_at=asst_msg.created_at,
        evidence_references=ev_responses,
    )
