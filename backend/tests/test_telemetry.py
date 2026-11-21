from app.core.telemetry import TelemetryRecorder


def test_telemetry_record_event():
    recorder = TelemetryRecorder("test.telemetry")
    event = recorder.record_event(
        event_name="search_query_executed",
        category="retrieval",
        properties={"query": "auth middleware", "results": 5},
        duration_ms=42.5,
    )
    assert event["event"] == "search_query_executed"
    assert event["category"] == "retrieval"
    assert event["duration_ms"] == 42.5
    assert event["properties"]["results"] == 5


def test_telemetry_record_error():
    recorder = TelemetryRecorder("test.telemetry")
    err = recorder.record_error(
        error_name="IndexNotFoundError",
        message="Repository index missing",
        trace_context={"repo_id": "test-123"},
    )
    assert err["event"] == "error"
    assert err["error_name"] == "IndexNotFoundError"
    assert err["context"]["repo_id"] == "test-123"
