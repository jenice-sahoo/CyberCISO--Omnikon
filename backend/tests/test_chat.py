import pytest
from unittest.mock import AsyncMock, patch
from fastapi.testclient import TestClient
from app.main import app
from app.models.schemas import ChatRequest, Vertical


client = TestClient(app)


def test_health_check():
    response = client.get("/api/v1/health")
    assert response.status_code == 200
    assert response.json()["status"] == "healthy"


def test_root():
    response = client.get("/")
    assert response.status_code == 200
    assert response.json()["message"] == "CyberCISO API"


@patch('app.api.chat.get_groq_client_instance')
def test_chat_endpoint_mock_mode(mock_get_client):
    mock_client = AsyncMock()
    mock_client.chat_completion.return_value = {
        "choices": [{
            "message": {
                "role": "assistant",
                "content": "Welcome! Please select your vertical: retail, healthcare clinic, or professional services?"
            }
        }]
    }
    mock_get_client.return_value = mock_client

    request = ChatRequest(
        message="Hello",
        conversation_history=[],
        vertical=None,
        session_id="test_session"
    )

    response = client.post("/api/v1/chat", json=request.model_dump())
    assert response.status_code == 200
    data = response.json()
    assert "response" in data
    assert data["interview_complete"] is False


@patch('app.api.chat.get_groq_client_instance')
def test_chat_endpoint_with_scorecard(mock_get_client):
    mock_client = AsyncMock()
    mock_client.chat_completion.return_value = {
        "choices": [{
            "message": {
                "role": "assistant",
                "content": '{"overall_grade": "B", "overall_score": 82, "sub_categories": [{"category": "access_control", "score": 85, "grade": "B", "findings": ["test"], "nist_references": ["PR.AC-1"], "cis_references": ["CIS 5.2"]}], "remediation_plan": [{"day": 1, "priority": "Critical", "category": "access_control", "action": "Enable MFA", "nist_function": "Protect", "nist_category": "PR.AC", "cis_control": "CIS 5.2", "effort_estimate": "2-4 hours"}], "vertical": "retail", "interview_complete": true, "next_question": null}'
            }
        }]
    }
    mock_get_client.return_value = mock_client

    request = ChatRequest(
        message="We have MFA and backups",
        conversation_history=[],
        vertical=Vertical.RETAIL,
        session_id="test_session"
    )

    response = client.post("/api/v1/chat", json=request.model_dump())
    assert response.status_code == 200
    data = response.json()
    assert data["interview_complete"] is True
    assert data["scorecard"] is not None
    assert data["scorecard"]["overall_grade"] == "B"