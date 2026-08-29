from pydantic import BaseModel, Field
from typing import List, Optional, Literal
from enum import Enum


class Vertical(str, Enum):
    RETAIL = "retail"
    HEALTHCARE_CLINIC = "healthcare_clinic"
    PROFESSIONAL_SERVICES = "professional_services"


class SubCategory(str, Enum):
    ACCESS_CONTROL = "access_control"
    DATA_BACKUP = "data_backup"
    NETWORK_SECURITY = "network_security"
    EMAIL_PHISHING = "email_phishing"
    INCIDENT_RESPONSE = "incident_response"


class Grade(str, Enum):
    A = "A"
    B = "B"
    C = "C"
    D = "D"
    F = "F"


class NISTFunction(str, Enum):
    IDENTIFY = "Identify"
    PROTECT = "Protect"
    DETECT = "Detect"
    RESPOND = "Respond"
    RECOVER = "Recover"


class ChatMessage(BaseModel):
    role: Literal["user", "assistant", "system"]
    content: str


class ChatRequest(BaseModel):
    message: str
    conversation_history: List[ChatMessage] = Field(default_factory=list)
    vertical: Optional[Vertical] = None
    session_id: str


class SubCategoryScore(BaseModel):
    category: SubCategory
    score: int = Field(ge=0, le=100)
    grade: Grade
    findings: List[str]
    nist_references: List[str]
    cis_references: List[str]


class RemediationAction(BaseModel):
    day: int = Field(ge=1, le=30)
    priority: Literal["Critical", "High", "Medium", "Low"]
    category: SubCategory
    action: str
    nist_function: NISTFunction
    nist_category: str
    cis_control: str
    effort_estimate: str


class ScorecardResponse(BaseModel):
    overall_grade: Grade
    overall_score: int = Field(ge=0, le=100)
    sub_categories: List[SubCategoryScore]
    remediation_plan: List[RemediationAction]
    vertical: Vertical
    interview_complete: bool
    next_question: Optional[str] = None


class ChatResponse(BaseModel):
    response: str
    scorecard: Optional[ScorecardResponse] = None
    interview_complete: bool = False