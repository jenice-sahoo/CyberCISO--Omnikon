import pytest
from app.models.schemas import (
    Vertical, SubCategory, Grade, NISTFunction,
    ChatMessage, ChatRequest, ScorecardResponse,
    SubCategoryScore, RemediationAction
)


def test_vertical_enum():
    assert Vertical.RETAIL == "retail"
    assert Vertical.HEALTHCARE_CLINIC == "healthcare_clinic"
    assert Vertical.PROFESSIONAL_SERVICES == "professional_services"


def test_sub_category_enum():
    assert SubCategory.ACCESS_CONTROL == "access_control"
    assert SubCategory.DATA_BACKUP == "data_backup"
    assert SubCategory.NETWORK_SECURITY == "network_security"
    assert SubCategory.EMAIL_PHISHING == "email_phishing"
    assert SubCategory.INCIDENT_RESPONSE == "incident_response"


def test_grade_enum():
    assert Grade.A == "A"
    assert Grade.B == "B"
    assert Grade.C == "C"
    assert Grade.D == "D"
    assert Grade.F == "F"


def test_chat_message():
    msg = ChatMessage(role="user", content="Hello")
    assert msg.role == "user"
    assert msg.content == "Hello"


def test_chat_request():
    req = ChatRequest(
        message="Hello",
        conversation_history=[],
        vertical=Vertical.RETAIL,
        session_id="test_session"
    )
    assert req.message == "Hello"
    assert req.vertical == Vertical.RETAIL


def test_sub_category_score():
    score = SubCategoryScore(
        category=SubCategory.ACCESS_CONTROL,
        score=85,
        grade=Grade.B,
        findings=["MFA enabled", "Role-based access"],
        nist_references=["PR.AC-1"],
        cis_references=["CIS 5.2"]
    )
    assert score.score == 85
    assert score.grade == Grade.B


def test_remediation_action():
    action = RemediationAction(
        day=1,
        priority="Critical",
        category=SubCategory.ACCESS_CONTROL,
        action="Enable MFA",
        nist_function=NISTFunction.PROTECT,
        nist_category="PR.AC: Identity Management",
        cis_control="CIS 5.2: Use Multi-Factor Authentication",
        effort_estimate="2-4 hours"
    )
    assert action.day == 1
    assert action.priority == "Critical"


def test_scorecard_response():
    scorecard = ScorecardResponse(
        overall_grade=Grade.B,
        overall_score=82,
        sub_categories=[],
        remediation_plan=[],
        vertical=Vertical.RETAIL,
        interview_complete=True,
        next_question=None
    )
    assert scorecard.overall_grade == Grade.B
    assert scorecard.interview_complete is True