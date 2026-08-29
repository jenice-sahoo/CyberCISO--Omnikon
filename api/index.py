from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field
from typing import List, Optional, Literal
from enum import Enum


# ============================================================
# MODELS
# ============================================================

class Vertical(str, Enum):
    RETAIL = "retail"
    HEALTHCARE_CLINIC = "healthcare_clinic"
    PROFESSIONAL_SERVICES = "professional_services"


class ChatMessage(BaseModel):
    role: Literal["user", "assistant", "system"]
    content: str


class ChatRequest(BaseModel):
    message: str
    conversation_history: List[ChatMessage] = Field(default_factory=list)
    vertical: Optional[Vertical] = None
    session_id: str


class ChatResponse(BaseModel):
    response: str
    scorecard: Optional[dict] = None
    interview_complete: bool = False


# ============================================================
# ASSESSMENT QUESTION BANK
# ============================================================

MOCK_QUESTIONS = {
    "retail": [
        "How many employees access your point-of-sale systems and inventory databases?",
        "Do you use multi-factor authentication (MFA) for all remote access and administrative accounts?",
        "How frequently do you back up critical business data?",
        "Do you have a guest Wi-Fi network separated from your payment processing network?",
        "Have you conducted phishing awareness training in the last 12 months?",
        "Do you have an incident response plan for a data breach?",
    ],

    "healthcare_clinic": [
        "How many staff members access your electronic health records (EHR) system?",
        "Is access to patient data restricted by role (e.g., front desk vs. clinicians vs. billing)?",
        "Are EHR backups encrypted and tested for restoration at least quarterly?",
        "Do you have a business associate agreement (BAA) with all vendors who access PHI?",
        "How do you secure medical devices connected to your network?",
        "Do you have a HIPAA breach notification procedure documented and tested?",
    ],

    "professional_services": [
        "How many team members access client confidential data on a regular basis?",
        "Do you enforce MFA on all cloud services (Microsoft 365, Google Workspace, CRM)?",
        "Are client deliverables backed up with version control and offsite replication?",
        "Do you use email encryption or secure file transfer for sensitive client documents?",
        "Have you simulated a phishing attack against your staff in the last year?",
        "Do you have a written incident response plan for client data exposure?",
    ],
}


# ============================================================
# CURRENT SCORECARD
# NOTE: We will replace this with real scoring next.
# ============================================================

def mock_scorecard(vertical: Vertical):
    return {
        "overall_grade": "C",
        "overall_score": 72,

        "sub_categories": [
            {
                "category": "access_control",
                "score": 70,
                "grade": "C",
                "findings": [
                    "MFA not enforced on all admin accounts"
                ],
                "nist_references": ["PR.AC-1"],
                "cis_references": ["CIS 5.2"]
            },
            {
                "category": "data_backup",
                "score": 75,
                "grade": "C",
                "findings": [
                    "Backups not tested quarterly"
                ],
                "nist_references": ["PR.IP-4"],
                "cis_references": ["CIS 11.2"]
            },
            {
                "category": "network_security",
                "score": 65,
                "grade": "D",
                "findings": [
                    "Guest Wi-Fi not segmented"
                ],
                "nist_references": ["PR.AC-5"],
                "cis_references": ["CIS 12.1"]
            },
            {
                "category": "email_phishing",
                "score": 80,
                "grade": "B",
                "findings": [
                    "No phishing simulation"
                ],
                "nist_references": ["PR.AT-1"],
                "cis_references": ["CIS 14.1"]
            },
            {
                "category": "incident_response",
                "score": 70,
                "grade": "C",
                "findings": [
                    "No tabletop exercises"
                ],
                "nist_references": ["RS.RP-1"],
                "cis_references": ["CIS 17.1"]
            }
        ],

        "remediation_plan": [
            {
                "day": 1,
                "priority": "Critical",
                "category": "access_control",
                "action": "Enable MFA on all admin accounts",
                "nist_function": "Protect",
                "nist_category": "PR.AC",
                "cis_control": "CIS 5.2",
                "effort_estimate": "2-4 hours"
            },
            {
                "day": 3,
                "priority": "Critical",
                "category": "network_security",
                "action": "Segment guest Wi-Fi",
                "nist_function": "Protect",
                "nist_category": "PR.AC",
                "cis_control": "CIS 12.1",
                "effort_estimate": "4-8 hours"
            },
            {
                "day": 7,
                "priority": "High",
                "category": "data_backup",
                "action": "Configure offsite backup + test restore",
                "nist_function": "Recover",
                "nist_category": "RC.RP",
                "cis_control": "CIS 11.3",
                "effort_estimate": "1-2 days"
            },
            {
                "day": 14,
                "priority": "High",
                "category": "email_phishing",
                "action": "Run phishing simulation",
                "nist_function": "Protect",
                "nist_category": "PR.AT",
                "cis_control": "CIS 14.1",
                "effort_estimate": "4-6 hours"
            },
            {
                "day": 21,
                "priority": "Medium",
                "category": "incident_response",
                "action": "Document incident response plan",
                "nist_function": "Respond",
                "nist_category": "RS.RP",
                "cis_control": "CIS 17.1",
                "effort_estimate": "1-2 days"
            },
            {
                "day": 30,
                "priority": "Medium",
                "category": "incident_response",
                "action": "Tabletop exercise",
                "nist_function": "Respond",
                "nist_category": "RS.RP",
                "cis_control": "CIS 17.2",
                "effort_estimate": "2-3 hours"
            }
        ],

        "vertical": (
            vertical.value
            if hasattr(vertical, "value")
            else vertical
        ),

        "interview_complete": True,
        "next_question": None
    }


# ============================================================
# FASTAPI
# ============================================================

app = FastAPI(
    title="CyberCISO API",
    version="1.0.0"
)


# ============================================================
# CORS
# ============================================================

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# ============================================================
# BASIC ROUTES
# ============================================================

@app.get("/")
async def root():
    return {
        "message": "CyberCISO API",
        "version": "1.0.0"
    }


@app.get("/api/index")
async def api_index():
    return {
        "status": "healthy",
        "service": "cyberciso-backend"
    }


@app.get("/api/v1/health")
@app.get("/health")
async def health():
    return {
        "status": "healthy",
        "service": "cyberciso-backend"
    }


# ============================================================
# ASSESSMENT CHAT
# ============================================================

@app.post("/api/index", response_model=ChatResponse)
@app.post("/api/v1/chat", response_model=ChatResponse)
@app.post("/v1/chat", response_model=ChatResponse)
async def chat(req: ChatRequest):

    # --------------------------------------------------------
    # 1. Determine the selected business vertical
    # --------------------------------------------------------

    vertical = req.vertical or Vertical.RETAIL

    vertical_key = (
        vertical.value
        if hasattr(vertical, "value")
        else vertical
    )

    questions = MOCK_QUESTIONS.get(
        vertical_key,
        MOCK_QUESTIONS["retail"]
    )

    # --------------------------------------------------------
    # 2. Find every question that has already been displayed
    # --------------------------------------------------------

    already_asked = set()

    for message in req.conversation_history:

        if message.role != "assistant":
            continue

        text = message.content.strip()

        if not text:
            continue

        already_asked.add(text.lower())

    # --------------------------------------------------------
    # 3. Find the first unused question
    # --------------------------------------------------------

    next_question = None

    for question in questions:

        if question.lower() not in already_asked:
            next_question = question
            break

    # --------------------------------------------------------
    # 4. If there are no unused questions, finish assessment
    # --------------------------------------------------------

    if next_question is None:

        return ChatResponse(
            response="",
            scorecard=mock_scorecard(vertical),
            interview_complete=True
        )

    # --------------------------------------------------------
    # 5. Return the next unused question
    # --------------------------------------------------------

    return ChatResponse(
        response=next_question,
        interview_complete=False
    )
