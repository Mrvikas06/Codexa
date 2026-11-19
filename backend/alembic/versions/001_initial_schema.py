"""001_initial_schema

Revision ID: 001_initial
Revises: 
Create Date: 2026-11-19 22:45:00.000000

"""
from typing import Sequence, Union
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

revision: str = "001_initial"
down_revision: Union[str, None] = None
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # 1. users
    op.create_table(
        "users",
        sa.Column("id", sa.CHAR(36), primary_key=True),
        sa.Column("email", sa.String(255), nullable=False, unique=True),
        sa.Column("username", sa.String(100), nullable=False, unique=True),
        sa.Column("hashed_password", sa.String(255), nullable=False),
        sa.Column("is_active", sa.Boolean(), nullable=False, server_default=sa.true()),
        sa.Column("is_superuser", sa.Boolean(), nullable=False, server_default=sa.false()),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.Column("deleted_at", sa.DateTime(timezone=True), nullable=True),
    )
    op.create_index("ix_users_email", "users", ["email"])
    op.create_index("ix_users_username", "users", ["username"])

    # 2. workspaces
    op.create_table(
        "workspaces",
        sa.Column("id", sa.CHAR(36), primary_key=True),
        sa.Column("name", sa.String(100), nullable=False),
        sa.Column("description", sa.Text(), nullable=True),
        sa.Column("owner_id", sa.CHAR(36), sa.ForeignKey("users.id", ondelete="CASCADE"), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.Column("deleted_at", sa.DateTime(timezone=True), nullable=True),
    )
    op.create_index("ix_workspaces_owner_id", "workspaces", ["owner_id"])

    # 3. repositories
    op.create_table(
        "repositories",
        sa.Column("id", sa.CHAR(36), primary_key=True),
        sa.Column("workspace_id", sa.CHAR(36), sa.ForeignKey("workspaces.id", ondelete="CASCADE"), nullable=False),
        sa.Column("name", sa.String(200), nullable=False),
        sa.Column("url", sa.String(500), nullable=True),
        sa.Column("description", sa.Text(), nullable=True),
        sa.Column("default_branch", sa.String(100), server_default="main", nullable=False),
        sa.Column("clone_path", sa.String(500), nullable=True),
        sa.Column("status", sa.String(50), server_default="pending", nullable=False),
        sa.Column("total_files", sa.Integer(), server_default="0", nullable=False),
        sa.Column("total_functions", sa.Integer(), server_default="0", nullable=False),
        sa.Column("total_classes", sa.Integer(), server_default="0", nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.Column("deleted_at", sa.DateTime(timezone=True), nullable=True),
    )
    op.create_index("ix_repositories_workspace_id", "repositories", ["workspace_id"])
    op.create_index("ix_repositories_status", "repositories", ["status"])

    # 4. repository_versions
    op.create_table(
        "repository_versions",
        sa.Column("id", sa.CHAR(36), primary_key=True),
        sa.Column("repository_id", sa.CHAR(36), sa.ForeignKey("repositories.id", ondelete="CASCADE"), nullable=False),
        sa.Column("commit_hash", sa.String(64), nullable=False),
        sa.Column("branch", sa.String(100), server_default="main", nullable=False),
        sa.Column("indexed_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("is_current", sa.Boolean(), server_default=sa.true(), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
    )
    op.create_index("ix_repository_versions_repo_id", "repository_versions", ["repository_id"])
    op.create_index("ix_repository_versions_commit", "repository_versions", ["commit_hash"])

    # 5. files
    op.create_table(
        "files",
        sa.Column("id", sa.CHAR(36), primary_key=True),
        sa.Column("repository_id", sa.CHAR(36), sa.ForeignKey("repositories.id", ondelete="CASCADE"), nullable=False),
        sa.Column("version_id", sa.CHAR(36), sa.ForeignKey("repository_versions.id", ondelete="SET NULL"), nullable=True),
        sa.Column("path", sa.String(1000), nullable=False),
        sa.Column("filename", sa.String(255), nullable=False),
        sa.Column("extension", sa.String(50), server_default="", nullable=False),
        sa.Column("language", sa.String(50), server_default="unknown", nullable=False),
        sa.Column("size_bytes", sa.Integer(), server_default="0", nullable=False),
        sa.Column("content_hash", sa.String(64), nullable=False),
        sa.Column("line_count", sa.Integer(), server_default="0", nullable=False),
        sa.Column("is_binary", sa.Boolean(), server_default=sa.false(), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
    )
    op.create_index("ix_files_repo_id", "files", ["repository_id"])
    op.create_index("ix_files_version_id", "files", ["version_id"])
    op.create_index("ix_files_path", "files", ["path"])
    op.create_index("ix_files_language", "files", ["language"])
    op.create_index("ix_files_content_hash", "files", ["content_hash"])

    # 6. symbols
    op.create_table(
        "symbols",
        sa.Column("id", sa.CHAR(36), primary_key=True),
        sa.Column("file_id", sa.CHAR(36), sa.ForeignKey("files.id", ondelete="CASCADE"), nullable=False),
        sa.Column("name", sa.String(255), nullable=False),
        sa.Column("symbol_type", sa.String(50), nullable=False),
        sa.Column("start_line", sa.Integer(), nullable=False),
        sa.Column("end_line", sa.Integer(), nullable=False),
        sa.Column("signature", sa.Text(), nullable=True),
        sa.Column("docstring", sa.Text(), nullable=True),
        sa.Column("parent_symbol_id", sa.CHAR(36), sa.ForeignKey("symbols.id", ondelete="SET NULL"), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
    )
    op.create_index("ix_symbols_file_id", "symbols", ["file_id"])
    op.create_index("ix_symbols_name", "symbols", ["name"])
    op.create_index("ix_symbols_type", "symbols", ["symbol_type"])

    # 7. dependencies
    op.create_table(
        "dependencies",
        sa.Column("id", sa.CHAR(36), primary_key=True),
        sa.Column("source_symbol_id", sa.CHAR(36), sa.ForeignKey("symbols.id", ondelete="CASCADE"), nullable=False),
        sa.Column("target_symbol_id", sa.CHAR(36), sa.ForeignKey("symbols.id", ondelete="CASCADE"), nullable=False),
        sa.Column("dependency_type", sa.String(50), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
    )
    op.create_index("ix_dependencies_source", "dependencies", ["source_symbol_id"])
    op.create_index("ix_dependencies_target", "dependencies", ["target_symbol_id"])

    # 8. code_chunks
    op.create_table(
        "code_chunks",
        sa.Column("id", sa.CHAR(36), primary_key=True),
        sa.Column("file_id", sa.CHAR(36), sa.ForeignKey("files.id", ondelete="CASCADE"), nullable=False),
        sa.Column("symbol_id", sa.CHAR(36), sa.ForeignKey("symbols.id", ondelete="SET NULL"), nullable=True),
        sa.Column("chunk_type", sa.String(50), nullable=False),
        sa.Column("content", sa.Text(), nullable=False),
        sa.Column("content_hash", sa.String(64), nullable=False),
        sa.Column("start_line", sa.Integer(), nullable=False),
        sa.Column("end_line", sa.Integer(), nullable=False),
        sa.Column("language", sa.String(50), nullable=False),
        sa.Column("token_count", sa.Integer(), server_default="0", nullable=False),
        sa.Column("extra_metadata", sa.JSON(), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
    )
    op.create_index("ix_code_chunks_file_id", "code_chunks", ["file_id"])
    op.create_index("ix_code_chunks_symbol_id", "code_chunks", ["symbol_id"])
    op.create_index("ix_code_chunks_content_hash", "code_chunks", ["content_hash"])

    # 9. model_versions
    op.create_table(
        "model_versions",
        sa.Column("id", sa.CHAR(36), primary_key=True),
        sa.Column("name", sa.String(100), nullable=False),
        sa.Column("model_type", sa.String(50), nullable=False),
        sa.Column("version", sa.String(50), nullable=False),
        sa.Column("architecture", sa.JSON(), nullable=False),
        sa.Column("param_count", sa.Integer(), server_default="0", nullable=False),
        sa.Column("vocab_size", sa.Integer(), server_default="16000", nullable=False),
        sa.Column("checkpoint_path", sa.String(500), nullable=True),
        sa.Column("status", sa.String(50), server_default="ready", nullable=False),
        sa.Column("metrics", sa.JSON(), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
    )
    op.create_index("ix_model_versions_type", "model_versions", ["model_type"])

    # 10. embeddings
    op.create_table(
        "embeddings",
        sa.Column("id", sa.CHAR(36), primary_key=True),
        sa.Column("chunk_id", sa.CHAR(36), sa.ForeignKey("code_chunks.id", ondelete="CASCADE"), nullable=False),
        sa.Column("model_version_id", sa.CHAR(36), sa.ForeignKey("model_versions.id", ondelete="CASCADE"), nullable=False),
        sa.Column("vector", sa.JSON(), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
    )
    op.create_index("ix_embeddings_chunk_id", "embeddings", ["chunk_id"])
    op.create_index("ix_embeddings_model_version_id", "embeddings", ["model_version_id"])

    # 11. training_runs
    op.create_table(
        "training_runs",
        sa.Column("id", sa.CHAR(36), primary_key=True),
        sa.Column("model_version_id", sa.CHAR(36), sa.ForeignKey("model_versions.id", ondelete="CASCADE"), nullable=False),
        sa.Column("dataset_name", sa.String(200), nullable=False),
        sa.Column("config", sa.JSON(), nullable=False),
        sa.Column("status", sa.String(50), server_default="pending", nullable=False),
        sa.Column("current_epoch", sa.Integer(), server_default="0", nullable=False),
        sa.Column("total_epochs", sa.Integer(), server_default="0", nullable=False),
        sa.Column("current_step", sa.Integer(), server_default="0", nullable=False),
        sa.Column("total_steps", sa.Integer(), server_default="0", nullable=False),
        sa.Column("train_loss", sa.Float(), nullable=True),
        sa.Column("val_loss", sa.Float(), nullable=True),
        sa.Column("learning_rate", sa.Float(), nullable=True),
        sa.Column("gpu_memory_mb", sa.Float(), nullable=True),
        sa.Column("error_message", sa.Text(), nullable=True),
        sa.Column("started_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("completed_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
    )

    # 12. evaluation_runs
    op.create_table(
        "evaluation_runs",
        sa.Column("id", sa.CHAR(36), primary_key=True),
        sa.Column("model_version_id", sa.CHAR(36), sa.ForeignKey("model_versions.id", ondelete="CASCADE"), nullable=False),
        sa.Column("dataset_name", sa.String(200), nullable=False),
        sa.Column("status", sa.String(50), server_default="pending", nullable=False),
        sa.Column("metrics", sa.JSON(), nullable=False),
        sa.Column("error_message", sa.Text(), nullable=True),
        sa.Column("started_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("completed_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
    )

    # 13. conversations
    op.create_table(
        "conversations",
        sa.Column("id", sa.CHAR(36), primary_key=True),
        sa.Column("workspace_id", sa.CHAR(36), sa.ForeignKey("workspaces.id", ondelete="CASCADE"), nullable=False),
        sa.Column("repository_id", sa.CHAR(36), sa.ForeignKey("repositories.id", ondelete="CASCADE"), nullable=False),
        sa.Column("title", sa.String(255), server_default="New Investigation", nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.Column("deleted_at", sa.DateTime(timezone=True), nullable=True),
    )
    op.create_index("ix_conversations_workspace_id", "conversations", ["workspace_id"])
    op.create_index("ix_conversations_repository_id", "conversations", ["repository_id"])

    # 14. messages
    op.create_table(
        "messages",
        sa.Column("id", sa.CHAR(36), primary_key=True),
        sa.Column("conversation_id", sa.CHAR(36), sa.ForeignKey("conversations.id", ondelete="CASCADE"), nullable=False),
        sa.Column("role", sa.String(50), nullable=False),
        sa.Column("content", sa.Text(), nullable=False),
        sa.Column("evidence_count", sa.Integer(), server_default="0", nullable=False),
        sa.Column("extra_metadata", sa.JSON(), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
    )
    op.create_index("ix_messages_conversation_id", "messages", ["conversation_id"])

    # 15. evidence_references
    op.create_table(
        "evidence_references",
        sa.Column("id", sa.CHAR(36), primary_key=True),
        sa.Column("message_id", sa.CHAR(36), sa.ForeignKey("messages.id", ondelete="CASCADE"), nullable=False),
        sa.Column("file_id", sa.CHAR(36), sa.ForeignKey("files.id", ondelete="SET NULL"), nullable=True),
        sa.Column("file_path", sa.String(1000), nullable=False),
        sa.Column("start_line", sa.Integer(), nullable=False),
        sa.Column("end_line", sa.Integer(), nullable=False),
        sa.Column("content", sa.Text(), nullable=False),
        sa.Column("relevance_score", sa.Float(), server_default="0.0", nullable=False),
        sa.Column("relevance_explanation", sa.Text(), nullable=False),
        sa.Column("confidence", sa.String(50), server_default="verified_fact", nullable=False),
        sa.Column("is_verified", sa.Boolean(), server_default=sa.true(), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
    )
    op.create_index("ix_evidence_msg_id", "evidence_references", ["message_id"])

    # 16. indexing_jobs
    op.create_table(
        "indexing_jobs",
        sa.Column("id", sa.CHAR(36), primary_key=True),
        sa.Column("repository_id", sa.CHAR(36), sa.ForeignKey("repositories.id", ondelete="CASCADE"), nullable=False),
        sa.Column("version_id", sa.CHAR(36), sa.ForeignKey("repository_versions.id", ondelete="SET NULL"), nullable=True),
        sa.Column("job_type", sa.String(50), server_default="full", nullable=False),
        sa.Column("status", sa.String(50), server_default="pending", nullable=False),
        sa.Column("total_files", sa.Integer(), server_default="0", nullable=False),
        sa.Column("processed_files", sa.Integer(), server_default="0", nullable=False),
        sa.Column("failed_files", sa.Integer(), server_default="0", nullable=False),
        sa.Column("current_file", sa.Text(), nullable=True),
        sa.Column("error_message", sa.Text(), nullable=True),
        sa.Column("started_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("completed_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
    )
    op.create_index("ix_indexing_jobs_repo_id", "indexing_jobs", ["repository_id"])
    op.create_index("ix_indexing_jobs_status", "indexing_jobs", ["status"])


def downgrade() -> None:
    op.drop_table("indexing_jobs")
    op.drop_table("evidence_references")
    op.drop_table("messages")
    op.drop_table("conversations")
    op.drop_table("evaluation_runs")
    op.drop_table("training_runs")
    op.drop_table("embeddings")
    op.drop_table("model_versions")
    op.drop_table("code_chunks")
    op.drop_table("dependencies")
    op.drop_table("symbols")
    op.drop_table("files")
    op.drop_table("repository_versions")
    op.drop_table("repositories")
    op.drop_table("workspaces")
    op.drop_table("users")
