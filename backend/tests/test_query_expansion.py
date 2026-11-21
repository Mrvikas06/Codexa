from app.services.retrieval.query import expand_query, extract_keywords


def test_expand_query():
    q = "auth db config"
    expanded = expand_query(q)
    assert "auth" in expanded
    assert "authentication" in expanded
    assert "database" in expanded
    assert "configuration" in expanded


def test_extract_keywords():
    q = "Where is the authentication service implemented in this repository?"
    keywords = extract_keywords(q)
    assert "authentication" in keywords
    assert "service" in keywords
    assert "implemented" in keywords
    assert "repository" in keywords
    assert "where" not in keywords
    assert "the" not in keywords
    assert "in" not in keywords
