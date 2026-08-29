from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field
from typing import List, Optional, Literal
from enum import Enum
import re


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
# QUESTION -> CATEGORY MAPPING
# ============================================================

QUESTION_CATEGORIES = {
    "retail": [
        "access_control",
        "access_control",
        "data_backup",
        "network_security",
        "email_phishing",
        "incident_response",
    ],

    "healthcare_clinic": [
        "access_control",
        "access_control",
        "data_backup",
        "network_security",
        "network_security",
        "incident_response",
    ],

    "professional_services": [
        "access_control",
        "access_control",
        "data_backup",
        "network_security",
        "email_phishing",
        "incident_response",
    ],
}


# ============================================================
# CATEGORY INFORMATION
# ============================================================

CATEGORY_INFO = {
    "access_control": {
        "name": "Access Control",
        "nist_references": ["PR.AC-1"],
        "cis_references": ["CIS 5.2"],
    },

    "data_backup": {
        "name": "Data Backup",
        "nist_references": ["PR.IP-4"],
        "cis_references": ["CIS 11.2"],
    },

    "network_security": {
        "name": "Network Security",
        "nist_references": ["PR.AC-5"],
        "cis_references": ["CIS 12.1"],
    },

    "email_phishing": {
        "name": "Email / Phishing Readiness",
        "nist_references": ["PR.AT-1"],
        "cis_references": ["CIS 14.1"],
    },

    "incident_response": {
        "name": "Incident Response",
        "nist_references": ["RS.RP-1"],
        "cis_references": ["CIS 17.1"],
    },
}


# ============================================================
# GRADE CALCULATION
# ============================================================

def get_grade(score):
    score = float(score)

    if score >= 90:
        return "A"
    elif score >= 80:
        return "B"
    elif score >= 70:
        return "C"
    elif score >= 60:
        return "D"
    else:
        return "F"


# ============================================================
# ANSWER SCORING HELPERS
# ============================================================

def normalize_answer(answer):
    return re.sub(r"\s+", " ", answer.strip().lower())


def score_yes_no_answer(answer):
    """
    Scores security yes/no answers based on the actual response.

    Strong positive answer -> 100
    Partial/uncertain answer -> 50
    Negative answer -> 0
    """

    text = normalize_answer(answer)

    negative_patterns = [
        r"\bno\b",
        r"\bnot\b",
        r"\bnever\b",
        r"\bnone\b",
        r"\bdon't\b",
        r"\bdo not\b",
        r"\bdoesn't\b",
        r"\bdoes not\b",
        r"\bwithout\b",
        r"\bnot yet\b",
        r"\bwe haven'?t\b",
        r"\bwe have not\b",
    ]

    positive_patterns = [
        r"\byes\b",
        r"\ball\b",
        r"\balways\b",
        r"\beveryone\b",
        r"\bevery account\b",
        r"\bevery user\b",
        r"\benforced\b",
        r"\bimplemented\b",
        r"\bfully\b",
        r"\bwe do\b",
        r"\bwe have\b",
        r"\bwe use\b",
        r"\bwe conduct\b",
        r"\bwe maintain\b",
    ]

    partial_patterns = [
        r"\bsome\b",
        r"\bmost\b",
        r"\bpartially\b",
        r"\bpartial\b",
        r"\boccasionally\b",
        r"\bsometimes\b",
        r"\bnot all\b",
        r"\bexcept\b",
        r"\bdepends\b",
        r"\bin progress\b",
        r"\bplanning\b",
        r"\bworking on\b",
    ]

    for pattern in partial_patterns:
        if re.search(pattern, text):
            return 50

    for pattern in negative_patterns:
        if re.search(pattern, text):
            return 0

    for pattern in positive_patterns:
        if re.search(pattern, text):
            return 100

    # If the user gives a meaningful but ambiguous answer,
    # give partial credit instead of assuming it is secure.
    return 50


def score_backup_answer(answer):
    """
    Scores backup frequency and quality.
    """

    text = normalize_answer(answer)

    if any(
        phrase in text
        for phrase in [
            "multiple times a day",
            "multiple times daily",
            "several times a day",
            "continuous",
            "real time",
            "real-time",
        ]
    ):
        return 100

    if "daily" in text or "every day" in text:
        return 95

    if "weekly" in text or "every week" in text:
        return 70

    if "biweekly" in text or "every two weeks" in text:
        return 60

    if "monthly" in text or "every month" in text:
        return 40

    if "quarterly" in text or "every quarter" in text:
        return 25

    if "never" in text or "don't" in text or "do not" in text:
        return 0

    # If they mention testing restores, award additional credit.
    base_score = 50

    if "test" in text and ("restore" in text or "restoration" in text):
        base_score += 20

    if "offsite" in text or "off-site" in text:
        base_score += 10

    return min(base_score, 100)


def score_count_answer(answer):
    """
    The employee-count questions are primarily informational.

    We use them as a small risk-complexity factor rather than
    allowing employee count to dominate the security score.
    """

    text = normalize_answer(answer)

    numbers = re.findall(r"\b\d+\b", text)

    if not numbers:
        return 50

    try:
        count = int(numbers[0])
    except ValueError:
        return 50

    if count <= 5:
        return 90
    elif count <= 15:
        return 80
    elif count <= 30:
        return 70
    elif count <= 75:
        return 60
    elif count <= 150:
        return 50
    else:
        return 40


def score_medical_device_answer(answer):
    """
    Scores healthcare medical-device security responses.
    """

    text = normalize_answer(answer)

    strong_terms = [
        "segmented",
        "network segmentation",
        "isolated",
        "firewall",
        "monitoring",
        "patched",
        "patch management",
        "endpoint protection",
        "access control",
        "mfa",
        "multi-factor",
        "inventory",
    ]

    negative_terms = [
        "not secured",
        "no security",
        "unknown",
        "don't know",
        "do not know",
        "not sure",
        "none",
        "never",
    ]

    partial_terms = [
        "some",
        "most",
        "partially",
        "occasionally",
        "manual",
        "in progress",
    ]

    if any(term in text for term in negative_terms):
        return 0

    strong_count = sum(
        1 for term in strong_terms if term in text
    )

    if strong_count >= 4:
        return 100

    if strong_count >= 2:
        return 80

    if any(term in text for term in partial_terms):
        return 50

    if strong_count == 1:
        return 60

    return 50


def score_answer(question, answer):
    """
    Main scoring function.

    The score is based on the user's actual answer to the
    actual assessment question.
    """

    question_text = normalize_answer(question)
    answer_text = normalize_answer(answer)

    if not answer_text:
        return 0

    # Employee/staff count questions
    if "how many employees" in question_text:
        return score_count_answer(answer)

    if "how many staff members" in question_text:
        return score_count_answer(answer)

    if "how many team members" in question_text:
        return score_count_answer(answer)

    # Backup questions
    if "how frequently" in question_text and "back up" in question_text:
        return score_backup_answer(answer)

    if "backups encrypted" in question_text:
        score = score_yes_no_answer(answer)

        if "test" in answer_text and (
            "restore" in answer_text or
            "restoration" in answer_text
        ):
            score = min(score + 20, 100)

        if "quarterly" in answer_text:
            score = min(score + 10, 100)

        if "encrypted" in answer_text:
            score = min(score + 10, 100)

        return score

    # Healthcare medical devices
    if "medical devices" in question_text:
        return score_medical_device_answer(answer)

    # All remaining security questions
    return score_yes_no_answer(answer)


# ============================================================
# FINDINGS
# ============================================================

def generate_finding(category, score, answer, vertical):
    """
    Generates findings from the actual category score and
    actual answer.
    """

    answer_text = normalize_answer(answer)

    if category == "access_control":

        if score < 40:
            return "Access controls are insufficient and require immediate improvement."

        if score < 70:
            return "Access controls appear to be only partially implemented or consistently enforced."

        if "mfa" in answer_text and score < 90:
            return "MFA or administrative access protections are not consistently enforced."

        return "Access controls appear to be reasonably implemented based on the assessment response."

    if category == "data_backup":

        if score < 40:
            return "Critical business data is not being backed up frequently enough."

        if score < 70:
            return "Backup frequency or restoration testing should be improved."

        if score < 90:
            return "Backups exist, but additional testing or resilience improvements are recommended."

        return "Backup practices appear strong based on the assessment response."

    if category == "network_security":

        if score < 40:
            return "Network segmentation or connected-system security controls appear insufficient."

        if score < 70:
            return "Network security controls are partially implemented and should be strengthened."

        return "Network security controls appear reasonably implemented."

    if category == "email_phishing":

        if score < 40:
            return "Phishing awareness controls appear insufficient or absent."

        if score < 70:
            return "Phishing awareness training or testing should be strengthened."

        if score < 90:
            return "Phishing readiness exists but should be tested more regularly."

        return "Email and phishing readiness appears strong based on the assessment response."

    if category == "incident_response":

        if score < 40:
            return "No sufficiently mature incident response capability was identified."

        if score < 70:
            return "Incident response planning exists but requires additional documentation or testing."

        if score < 90:
            return "Incident response capability appears established but should be exercised regularly."

        return "Incident response preparation appears strong."

    return "Additional security review is recommended."


# ============================================================
# REMEDIATION PLAN
# ============================================================

def generate_remediation(category, score, day_start):
    """
    Generates remediation actions only when the category
    actually needs improvement.
    """

    if score >= 90:
        return None

    if category == "access_control":

        if score < 40:
            priority = "Critical"
            action = (
                "Implement MFA for administrative and remote access, "
                "review privileged accounts, and remove unnecessary access."
            )
            effort = "1-2 days"
        else:
            priority = "High"
            action = (
                "Review access permissions and ensure MFA is consistently "
                "enforced for administrative and remote access."
            )
            effort = "4-8 hours"

        return {
            "day": day_start,
            "priority": priority,
            "category": category,
            "action": action,
            "nist_function": "Protect",
            "nist_category": "PR.AC",
            "cis_control": "CIS 5.2",
            "effort_estimate": effort,
        }

    if category == "data_backup":

        if score < 40:
            priority = "Critical"
            action = (
                "Implement reliable automated backups, maintain an offsite "
                "copy, and perform a documented restore test."
            )
            effort = "1-2 days"
        else:
            priority = "High"
            action = (
                "Increase backup frequency and schedule regular restore "
                "testing to verify recoverability."
            )
            effort = "4-8 hours"

        return {
            "day": day_start,
            "priority": priority,
            "category": category,
            "action": action,
            "nist_function": "Recover",
            "nist_category": "RC.RP",
            "cis_control": "CIS 11.3",
            "effort_estimate": effort,
        }

    if category == "network_security":

        if score < 40:
            priority = "Critical"
            action = (
                "Implement network segmentation and isolate sensitive "
                "systems from untrusted or guest devices."
            )
            effort = "1-2 days"
        else:
            priority = "High"
            action = (
                "Review network segmentation and strengthen isolation "
                "between sensitive and untrusted systems."
            )
            effort = "4-8 hours"

        return {
            "day": day_start,
            "priority": priority,
            "category": category,
            "action": action,
            "nist_function": "Protect",
            "nist_category": "PR.AC",
            "cis_control": "CIS 12.1",
            "effort_estimate": effort,
        }

    if category == "email_phishing":

        if score < 40:
            priority = "Critical"
            action = (
                "Launch security awareness training and establish "
                "regular phishing simulations for staff."
            )
            effort = "1-2 days"
        else:
            priority = "High"
            action = (
                "Run a phishing simulation and refresh security awareness "
                "training for employees."
            )
            effort = "4-6 hours"

        return {
            "day": day_start,
            "priority": priority,
            "category": category,
            "action": action,
            "nist_function": "Protect",
            "nist_category": "PR.AT",
            "cis_control": "CIS 14.1",
            "effort_estimate": effort,
        }

    if category == "incident_response":

        if score < 40:
            priority = "Critical"
            action = (
                "Create and document an incident response plan covering "
                "identification, containment, recovery, and notification."
            )
            effort = "1-2 days"
        else:
            priority = "High"
            action = (
                "Update the incident response plan and conduct a tabletop "
                "exercise with key personnel."
            )
            effort = "4-8 hours"

        return {
            "day": day_start,
            "priority": priority,
            "category": category,
            "action": action,
            "nist_function": "Respond",
            "nist_category": "RS.RP",
            "cis_control": "CIS 17.1",
            "effort_estimate": effort,
        }

    return None


# ============================================================
# ANSWER EXTRACTION
# ============================================================

def extract_answers(conversation_history, current_message):
    """
    Reconstructs question -> answer pairs from the conversation.

    The frontend sends the conversation history plus the current
    user message. This function combines both so the final answer
    is included when calculating the score.
    """

    messages = []

    for message in conversation_history:
        if message.role in ["assistant", "user"]:
            messages.append({
                "role": message.role,
                "content": message.content.strip()
            })

    # Add the current user answer if it isn't already present.
    current = current_message.strip()

    if current:
        if not messages or not (
            messages[-1]["role"] == "user"
            and messages[-1]["content"] == current
        ):
            messages.append({
                "role": "user",
                "content": current
            })

    answers = []

    current_question = None

    for message in messages:

        if message["role"] == "assistant":

            text = message["content"].strip()

            if text:
                current_question = text

        elif message["role"] == "user":

            if current_question:

                answers.append({
                    "question": current_question,
                    "answer": message["content"].strip()
                })

                current_question = None

    return answers


# ============================================================
# BUILD REAL SCORECARD
# ============================================================

def calculate_scorecard(vertical, conversation_history, current_message):
    """
    Calculates the complete scorecard from the user's actual
    assessment answers.
    """

    vertical_key = (
        vertical.value
        if hasattr(vertical, "value")
        else str(vertical)
    )

    questions = MOCK_QUESTIONS.get(
        vertical_key,
        MOCK_QUESTIONS["retail"]
    )

    categories = QUESTION_CATEGORIES.get(
        vertical_key,
        QUESTION_CATEGORIES["retail"]
    )

    answer_pairs = extract_answers(
        conversation_history,
        current_message
    )

    # --------------------------------------------------------
    # Match answers to the official assessment questions.
    # --------------------------------------------------------

    matched_answers = []

    for question in questions:

        best_answer = None

        # Exact question match first
        for pair in answer_pairs:
            if normalize_answer(pair["question"]) == normalize_answer(question):
                best_answer = pair["answer"]
                break

        # Fallback: match by question order/content
        if best_answer is None:
            for pair in answer_pairs:

                q1 = normalize_answer(pair["question"])
                q2 = normalize_answer(question)

                if (
                    q1 in q2
                    or q2 in q1
                ):
                    best_answer = pair["answer"]
                    break

        if best_answer is None:
            best_answer = ""

        matched_answers.append({
            "question": question,
            "answer": best_answer,
        })

    # --------------------------------------------------------
    # Score each category.
    # --------------------------------------------------------

    category_scores = {
        "access_control": [],
        "data_backup": [],
        "network_security": [],
        "email_phishing": [],
        "incident_response": [],
    }

    for index, item in enumerate(matched_answers):

        category = categories[index]

        score = score_answer(
            item["question"],
            item["answer"]
        )

        category_scores[category].append(score)

    # --------------------------------------------------------
    # Build category results.
    # --------------------------------------------------------

    sub_categories = []

    for category in [
        "access_control",
        "data_backup",
        "network_security",
        "email_phishing",
        "incident_response",
    ]:

        scores = category_scores[category]

        if scores:
            category_score = round(
                sum(scores) / len(scores)
            )
        else:
            category_score = 0

        category_score = max(
            0,
            min(100, category_score)
        )

        category_answers = []

        for index, question in enumerate(questions):

            if categories[index] == category:
                category_answers.append(
                    matched_answers[index]
                )

        representative_answer = ""

        for item in category_answers:
            if item["answer"]:
                representative_answer = item["answer"]
                break

        finding = generate_finding(
            category,
            category_score,
            representative_answer,
            vertical_key
        )

        sub_categories.append({
            "category": category,
            "score": category_score,
            "grade": get_grade(category_score),
            "findings": [finding],
            "nist_references": CATEGORY_INFO[category]["nist_references"],
            "cis_references": CATEGORY_INFO[category]["cis_references"],
        })

    # --------------------------------------------------------
    # Overall score.
    #
    # All five categories are equally weighted.
    # --------------------------------------------------------

    overall_score = round(
        sum(
            category["score"]
            for category in sub_categories
        ) / len(sub_categories)
    )

    overall_score = max(
        0,
        min(100, overall_score)
    )

    overall_grade = get_grade(overall_score)

    # --------------------------------------------------------
    # Generate remediation plan based ONLY on weak categories.
    # --------------------------------------------------------

    remediation_plan = []

    day_schedule = [1, 3, 7, 14, 21]

    schedule_index = 0

    # Critical/weak categories first
    sorted_categories = sorted(
        sub_categories,
        key=lambda item: item["score"]
    )

    for category in sorted_categories:

        score = category["score"]

        if score >= 90:
            continue

        day = day_schedule[
            min(
                schedule_index,
                len(day_schedule) - 1
            )
        ]

        remediation = generate_remediation(
            category["category"],
            score,
            day
        )

        if remediation:
            remediation_plan.append(remediation)
            schedule_index += 1

    # --------------------------------------------------------
    # Final scorecard.
    # --------------------------------------------------------

    return {
        "overall_grade": overall_grade,
        "overall_score": overall_score,
        "sub_categories": sub_categories,
        "remediation_plan": remediation_plan,
        "vertical": vertical_key,
        "interview_complete": True,
        "next_question": None,
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
    # 1. Determine selected business vertical
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
    # 2. Find every question already displayed
    # --------------------------------------------------------

    already_asked = set()

    for message in req.conversation_history:

        if message.role != "assistant":
            continue

        text = message.content.strip()

        if not text:
            continue

        already_asked.add(
            text.lower()
        )

    # --------------------------------------------------------
    # 3. Find first unused question
    # --------------------------------------------------------

    next_question = None

    for question in questions:

        if question.lower() not in already_asked:
            next_question = question
            break

    # --------------------------------------------------------
    # 4. If all questions have been asked,
    #    calculate the REAL scorecard.
    # --------------------------------------------------------

    if next_question is None:

        scorecard = calculate_scorecard(
            vertical=vertical,
            conversation_history=req.conversation_history,
            current_message=req.message,
        )

        return ChatResponse(
            response="",
            scorecard=scorecard,
            interview_complete=True
        )

    # --------------------------------------------------------
    # 5. Return next unused question
    # --------------------------------------------------------

    return ChatResponse(
        response=next_question,
        interview_complete=False
    )
