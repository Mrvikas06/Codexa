from app.ml.datasets.reranker_dataset import mine_hard_negatives


def test_mine_hard_negatives():
    query = "validate token expiration in authentication service"
    positive_code = "def validate_token(token):\n    payload = decode(token)\n    return payload['exp'] > now()"

    corpus = [
        "def create_token(user_id):\n    return encode({'sub': user_id, 'exp': now() + 3600})",  # Hard negative (shares token, exp)
        "def hash_password(password):\n    return bcrypt.hash(password)",                         # Mild negative
        "def calculate_fibonacci(n):\n    return n if n <= 1 else fib(n-1) + fib(n-2)",           # Distant negative
        positive_code,                                                                            # Positive (must not be in mined negatives)
    ]

    mined = mine_hard_negatives(query, positive_code, corpus, top_k=2)

    assert len(mined) == 2
    assert positive_code not in mined
    # The token creation function has highest lexical overlap
    assert "create_token" in mined[0]
