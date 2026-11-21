import pytest
from app.core.exceptions import ValidationError
from app.core.security import sanitize_input_query


def test_sanitize_input_query_valid():
    q = "where is jwt authentication implemented?"
    res = sanitize_input_query(q)
    assert res == q


def test_sanitize_input_query_empty():
    with pytest.raises(ValidationError):
        sanitize_input_query("   ")


def test_sanitize_input_query_traversal():
    with pytest.raises(ValidationError):
        sanitize_input_query("check file ../../etc/passwd")


def test_sanitize_input_query_sql_injection():
    with pytest.raises(ValidationError):
        sanitize_input_query("test' UNION SELECT * FROM users--")
