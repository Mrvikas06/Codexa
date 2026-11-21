import uuid
from app.services.retrieval.bm25 import BM25Index, tokenize_code


def test_tokenize_code():
    tokens = tokenize_code("def validateJwtToken(user_id: str):")
    assert "def" in tokens
    assert "validate" in tokens
    assert "jwt" in tokens
    assert "token" in tokens
    assert "user" in tokens
    assert "id" in tokens


def test_bm25_index_and_search():
    index = BM25Index()
    doc1_id = uuid.uuid4()
    doc2_id = uuid.uuid4()
    doc3_id = uuid.uuid4()

    documents = [
        (doc1_id, "def authenticate_user(token):\n    return verify(token)"),
        (doc2_id, "def connect_database(url):\n    return create_engine(url)"),
        (doc3_id, "def calculate_statistics(numbers):\n    return sum(numbers)"),
    ]

    index.index_documents(documents)
    assert len(index.doc_ids) == 3

    # Search query targeting doc1
    results = index.search("verify token authenticate", top_k=2)
    assert len(results) >= 1
    assert results[0][0] == doc1_id
    assert results[0][1] > 0.0

    # Search query targeting doc2
    results_db = index.search("database engine connect", top_k=2)
    assert len(results_db) >= 1
    assert results_db[0][0] == doc2_id
