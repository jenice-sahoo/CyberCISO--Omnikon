from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field
from typing import List, Optional, Literal, Dict, Any
from enum import Enum
import os
import json
import re
import urllib.request
import urllib.error


# ============================================================
# CONFIG
# ============================================================

GROQ_API_KEY = os.environ.get("GROQ_API_KEY", "").strip()

GROQ_MODEL = os.environ.get(
    "GROQ_MODEL",
    "llama-3.3-70b-versatile"
)

GROQ_URL = (
    "https://api.groq.com/openai/v1/chat/completions"
)

MIN_CORE_QUESTIONS = 15
MAX_ADAPTIVE_QUESTIONS = 4
MAX_TOTAL_QUESTIONS = (
    MIN_CORE_QUESTIONS +
    MAX_ADAPTIVE_QUESTIONS
)


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
    conversation_history: List[ChatMessage] = Field(
        default_factory=list
    )
    vertical: Optional[Vertical] = None
    session_id: str


class ChatResponse(BaseModel):
    response: str
    scorecard: Optional[dict] = None
    interview_complete: bool = False


# ============================================================
# QUESTION STRUCTURE
# ============================================================

def make_question(
    question_id: str,
    domain: str,
    text: str,
    adaptive: bool = False
) -> dict:

    return {
        "id": question_id,
        "domain": domain,
        "text": text,
        "adaptive": adaptive
    }


# ============================================================
# CORE QUESTIONS
# 15 QUESTIONS PER BUSINESS TYPE
# ============================================================

CORE_QUESTIONS: Dict[str, List[dict]] = {

    # ========================================================
    # RETAIL
    # ========================================================

    "retail": [

        make_question(
            "retail_org_size",
            "organization",
            "How many employees access your point-of-sale systems, inventory systems, or other important business systems?"
        ),

        make_question(
            "retail_sensitive_data",
            "organization",
            "What sensitive information does your business handle, such as payment card data, customer information, employee information, or supplier information?"
        ),

        make_question(
            "retail_critical_systems",
            "organization",
            "Which systems are most critical to keeping your business operating, such as point-of-sale, inventory, accounting, e-commerce, or cloud systems?"
        ),

        make_question(
            "retail_mfa",
            "access_control",
            "Do you use multi-factor authentication (MFA) for administrative accounts, remote access, and important cloud services?"
        ),

        make_question(
            "retail_account_lifecycle",
            "access_control",
            "How are employee accounts created, changed, and removed when someone joins, changes roles, or leaves the company?"
        ),

        make_question(
            "retail_privileged",
            "access_control",
            "Do administrators use separate privileged accounts, and are privileged permissions reviewed regularly?"
        ),

        make_question(
            "retail_backup",
            "data_backup",
            "How frequently is critical business data backed up, and where are those backups stored?"
        ),

        make_question(
            "retail_restore",
            "data_backup",
            "When was the last time you successfully restored important business data from a backup?"
        ),

        make_question(
            "retail_network",
            "network_security",
            "Is your payment-processing or point-of-sale environment separated from guest Wi-Fi and other less-trusted devices?"
        ),

        make_question(
            "retail_endpoint",
            "network_security",
            "How are company laptops, desktops, POS devices, and other endpoints protected against malware and unauthorized software?"
        ),

        make_question(
            "retail_patching",
            "network_security",
            "How do you keep operating systems, POS software, routers, and other important systems patched and up to date?"
        ),

        make_question(
            "retail_training",
            "email_phishing",
            "Do employees receive security awareness training covering phishing, passwords, and handling customer information?"
        ),

        make_question(
            "retail_phishing",
            "email_phishing",
            "Have you conducted a phishing simulation or other practical security-awareness test during the last 12 months?"
        ),

        make_question(
            "retail_ir_plan",
            "incident_response",
            "Do you have a written incident response plan covering ransomware, data breaches, or payment-system compromise?"
        ),

        make_question(
            "retail_ir_test",
            "incident_response",
            "Has your incident response plan been tested or rehearsed with the people who would actually respond to an incident?"
        ),
    ],

    # ========================================================
    # HEALTHCARE
    # ========================================================

    "healthcare_clinic": [

        make_question(
            "health_org_size",
            "organization",
            "How many staff members access your electronic health records (EHR) system?"
        ),

        make_question(
            "health_sensitive_data",
            "organization",
            "What types of patient or other sensitive information does your clinic handle, store, or transmit?"
        ),

        make_question(
            "health_critical_systems",
            "organization",
            "Which systems are most critical to patient care and clinic operations, such as EHR, scheduling, billing, laboratory, imaging, or medical-device systems?"
        ),

        make_question(
            "health_mfa",
            "access_control",
            "Do you use multi-factor authentication (MFA) for administrative accounts, remote access, and important cloud or healthcare systems?"
        ),

        make_question(
            "health_role_access",
            "access_control",
            "Is access to patient information restricted by job role so staff only receive the access they need?"
        ),

        make_question(
            "health_account_lifecycle",
            "access_control",
            "How are staff accounts created, changed, and removed when employees join, change roles, or leave the clinic?"
        ),

        make_question(
            "health_backup",
            "data_backup",
            "How frequently are EHR and other critical clinical systems backed up, and are those backups protected from unauthorized access?"
        ),

        make_question(
            "health_restore",
            "data_backup",
            "When was the last time your clinic successfully restored patient or operational data from a backup?"
        ),

        make_question(
            "health_network",
            "network_security",
            "Are clinical systems and medical devices separated from guest Wi-Fi and other less-trusted networks?"
        ),

        make_question(
            "health_devices",
            "network_security",
            "How are connected medical devices inventoried, protected, monitored, and kept up to date?"
        ),

        make_question(
            "health_patching",
            "network_security",
            "How do you manage security patches and updates for servers, workstations, network equipment, and medical devices where supported?"
        ),

        make_question(
            "health_training",
            "email_phishing",
            "Do staff receive security and privacy awareness training covering phishing, passwords, patient information, and safe handling of sensitive data?"
        ),

        make_question(
            "health_phishing",
            "email_phishing",
            "Have you tested staff resistance to phishing or social engineering during the last 12 months?"
        ),

        make_question(
            "health_ir_plan",
            "incident_response",
            "Do you have a documented process for responding to a cybersecurity incident or suspected patient-data breach?"
        ),

        make_question(
            "health_ir_test",
            "incident_response",
            "Has that incident-response process been tested or rehearsed with the people responsible for responding?"
        ),
    ],

    # ========================================================
    # PROFESSIONAL SERVICES
    # ========================================================

    "professional_services": [

        make_question(
            "pro_org_size",
            "organization",
            "How many team members access client confidential data on a regular basis?"
        ),

        make_question(
            "pro_sensitive_data",
            "organization",
            "What sensitive information do you handle for clients or your own business, such as confidential documents, financial information, intellectual property, or personal data?"
        ),

        make_question(
            "pro_critical_systems",
            "organization",
            "Which systems are most critical to delivering your services, such as Microsoft 365, Google Workspace, CRM, accounting, project management, or file-sharing platforms?"
        ),

        make_question(
            "pro_mfa",
            "access_control",
            "Do you enforce multi-factor authentication (MFA) for cloud services, administrative accounts, remote access, and other important systems?"
        ),

        make_question(
            "pro_account_lifecycle",
            "access_control",
            "How are employee and contractor accounts created, changed, and removed when someone joins, changes roles, or leaves?"
        ),

        make_question(
            "pro_privileged",
            "access_control",
            "Do administrators use separate privileged accounts, and are privileged permissions reviewed periodically?"
        ),

        make_question(
            "pro_backup",
            "data_backup",
            "How frequently are critical client and business files backed up, and are backups stored separately from your primary systems?"
        ),

        make_question(
            "pro_restore",
            "data_backup",
            "When was the last time you successfully restored an important client or business file from a backup?"
        ),

        make_question(
            "pro_remote",
            "network_security",
            "How is access to your company network and cloud services protected when employees work remotely or from unmanaged networks?"
        ),

        make_question(
            "pro_endpoint",
            "network_security",
            "How are employee laptops and other endpoints protected against malware, unauthorized software, and loss or theft?"
        ),

        make_question(
            "pro_patching",
            "network_security",
            "How do you ensure operating systems, applications, network devices, and cloud services are kept up to date?"
        ),

        make_question(
            "pro_training",
            "email_phishing",
            "Do employees receive security awareness training covering phishing, passwords, confidential client information, and secure file sharing?"
        ),

        make_question(
            "pro_phishing",
            "email_phishing",
            "Have you conducted a phishing simulation or other practical social-engineering test during the last 12 months?"
        ),

        make_question(
            "pro_ir_plan",
            "incident_response",
            "Do you have a written incident response plan for ransomware, account compromise, or exposure of client data?"
        ),

        make_question(
            "pro_ir_test",
            "incident_response",
            "Has your incident response plan been tested or rehearsed with the people responsible for responding?"
        ),
    ],
}


# ============================================================
# ADAPTIVE FOLLOW-UP QUESTIONS
# ============================================================

ADAPTIVE_QUESTIONS: Dict[str, List[dict]] = {

    "retail": [

        make_question(
            "retail_followup_admin",
            "access_control",
            "Which accounts currently have administrative access to your POS, inventory, payment, or other critical systems?",
            True
        ),

        make_question(
            "retail_followup_shared",
            "access_control",
            "Are any administrative or important system accounts shared between employees, or does each person have a unique account?",
            True
        ),

        make_question(
            "retail_followup_mfa_gap",
            "access_control",
            "Are there any important systems or remote-access methods where MFA is not currently enforced?",
            True
        ),

        make_question(
            "retail_followup_restore",
            "data_backup",
            "How often do you test restoring data from your backups, and what happened during the most recent restore test?",
            True
        ),

        make_question(
            "retail_followup_backup_isolation",
            "data_backup",
            "Are any backup copies isolated or otherwise protected so ransomware affecting production systems cannot also encrypt or delete the backups?",
            True
        ),

        make_question(
            "retail_followup_network",
            "network_security",
            "What devices or systems can communicate directly with the payment-processing or POS network?",
            True
        ),

        make_question(
            "retail_followup_patching",
            "network_security",
            "Are there any POS devices, routers, servers, or other critical systems that are currently behind on security patches?",
            True
        ),

        make_question(
            "retail_followup_phishing",
            "email_phishing",
            "What were the results of your most recent phishing or security-awareness test, and what did you do for employees who struggled?",
            True
        ),

        make_question(
            "retail_followup_ir",
            "incident_response",
            "If your POS or customer-data systems were compromised tonight, who would lead the response and who would you contact first?",
            True
        ),

        make_question(
            "retail_followup_vendor",
            "third_party",
            "Do any vendors or service providers have access to your POS, payment, inventory, or customer systems, and how do you assess their security?",
            True
        ),
    ],

    "healthcare_clinic": [

        make_question(
            "health_followup_admin",
            "access_control",
            "Which staff or vendor accounts have administrative access to your EHR or other systems containing patient information?",
            True
        ),

        make_question(
            "health_followup_shared",
            "access_control",
            "Are any EHR, workstation, or administrative accounts shared between staff, or does each person have a unique account?",
            True
        ),

        make_question(
            "health_followup_role",
            "access_control",
            "When was the last time you reviewed staff access to patient information, and what happens when someone changes roles?",
            True
        ),

        make_question(
            "health_followup_restore",
            "data_backup",
            "How often do you test restoring EHR or other critical data from backup, and when was the last successful restore?",
            True
        ),

        make_question(
            "health_followup_backup_isolation",
            "data_backup",
            "Are backup copies isolated from the systems they protect so ransomware or an administrator compromise cannot easily destroy them?",
            True
        ),

        make_question(
            "health_followup_devices",
            "network_security",
            "Are there any medical devices or connected clinical systems that cannot currently receive security updates or are not centrally monitored?",
            True
        ),

        make_question(
            "health_followup_network",
            "network_security",
            "Can guest devices, personal devices, or general office systems communicate directly with clinical or medical-device networks?",
            True
        ),

        make_question(
            "health_followup_phishing",
            "email_phishing",
            "What happened during your most recent phishing or social-engineering test, and were additional controls or training introduced afterward?",
            True
        ),

        make_question(
            "health_followup_ir",
            "incident_response",
            "If patient information were exposed today, who would coordinate the response and how would you handle investigation, containment, and required notifications?",
            True
        ),

        make_question(
            "health_followup_vendor",
            "third_party",
            "Which vendors can access patient information or clinical systems, and how do you verify their security and privacy responsibilities?",
            True
        ),
    ],

    "professional_services": [

        make_question(
            "pro_followup_admin",
            "access_control",
            "Which accounts have administrative access to Microsoft 365, Google Workspace, CRM, finance, or other critical cloud systems?",
            True
        ),

        make_question(
            "pro_followup_shared",
            "access_control",
            "Are any administrative or client-data accounts shared between employees, or does each person use a unique account?",
            True
        ),

        make_question(
            "pro_followup_review",
            "access_control",
            "When was the last time you reviewed user and privileged access to client data, and how are unnecessary permissions removed?",
            True
        ),

        make_question(
            "pro_followup_restore",
            "data_backup",
            "How often do you test restoring client or business data from backup, and when was the last successful restore?",
            True
        ),

        make_question(
            "pro_followup_ransomware",
            "data_backup",
            "Are backup copies protected from ransomware or accidental deletion in your primary cloud or file-sharing environment?",
            True
        ),

        make_question(
            "pro_followup_remote",
            "network_security",
            "How do you control access when employees connect to company systems from home, public Wi-Fi, or unmanaged devices?",
            True
        ),

        make_question(
            "pro_followup_patching",
            "network_security",
            "Are there any employee devices, servers, or applications that are currently known to be missing important security updates?",
            True
        ),

        make_question(
            "pro_followup_phishing",
            "email_phishing",
            "What happened during your most recent phishing simulation or social-engineering test, and how did you respond to the results?",
            True
        ),

        make_question(
            "pro_followup_ir",
            "incident_response",
            "If confidential client data were exposed today, who would lead the response and how would you communicate with affected clients?",
            True
        ),

        make_question(
            "pro_followup_vendor",
            "third_party",
            "Which vendors or contractors can access confidential client information, and how do you evaluate their security before granting access?",
            True
        ),
    ],
}


# ============================================================
# SCORECARD INFORMATION
# ============================================================

CATEGORY_INFO = {

    "access_control": {
        "name": "Access Control",
        "nist": ["PR.AA"],
        "cis": ["CIS 5", "CIS 6"],
    },

    "data_backup": {
        "name": "Data Backup",
        "nist": ["PR.DS", "RC.RP"],
        "cis": ["CIS 11"],
    },

    "network_security": {
        "name": "Network Security",
        "nist": ["PR.IR"],
        "cis": ["CIS 12", "CIS 13"],
    },

    "email_phishing": {
        "name": "Email / Phishing Readiness",
        "nist": ["PR.AT"],
        "cis": ["CIS 14"],
    },

    "incident_response": {
        "name": "Incident Response",
        "nist": ["RS.MA", "RS.CO", "RS.MI"],
        "cis": ["CIS 17"],
    },
}


# ============================================================
# HELPERS
# ============================================================

def normalize(text: str) -> str:
    return re.sub(
        r"\s+",
        " ",
        text.strip().lower()
    )


def clean_json_text(text: str) -> str:

    text = text.strip()

    if text.startswith("```"):

        text = re.sub(
            r"^```(?:json)?\s*",
            "",
            text,
            flags=re.IGNORECASE
        )

        text = re.sub(
            r"\s*```$",
            "",
            text
        )

    return text.strip()


def parse_json(text: str) -> Optional[dict]:

    cleaned = clean_json_text(text)

    try:

        parsed = json.loads(cleaned)

        if isinstance(parsed, dict):
            return parsed

    except Exception:
        pass

    match = re.search(
        r"\{[\s\S]*\}",
        cleaned
    )

    if match:

        try:

            parsed = json.loads(
                match.group(0)
            )

            if isinstance(parsed, dict):
                return parsed

        except Exception:
            pass

    return None


def clamp_score(value: Any) -> int:

    try:

        value = float(value)

    except (
        TypeError,
        ValueError
    ):

        value = 50

    return max(
        0,
        min(
            100,
            int(round(value))
        )
    )


def grade(score: int) -> str:

    if score >= 90:
        return "A"

    if score >= 80:
        return "B"

    if score >= 70:
        return "C"

    if score >= 60:
        return "D"

    return "F"


# ============================================================
# GROQ
# ============================================================

def call_groq(
    system_prompt: str,
    user_prompt: str,
    temperature: float = 0.2,
    max_tokens: int = 1500
) -> Optional[dict]:

    if not GROQ_API_KEY:
        return None

    payload = {

        "model":
            GROQ_MODEL,

        "messages": [

            {
                "role":
                    "system",

                "content":
                    system_prompt,
            },

            {
                "role":
                    "user",

                "content":
                    user_prompt,
            },
        ],

        "temperature":
            temperature,

        "max_tokens":
            max_tokens,

        "response_format": {
            "type":
                "json_object"
        },
    }

    request = urllib.request.Request(

        GROQ_URL,

        data=json.dumps(
            payload
        ).encode("utf-8"),

        headers={
            "Content-Type":
                "application/json",

            "Authorization":
                f"Bearer {GROQ_API_KEY}",
        },

        method="POST"
    )

    try:

        with urllib.request.urlopen(
            request,
            timeout=30
        ) as response:

            raw = (
                response
                .read()
                .decode("utf-8")
            )

        data = json.loads(raw)

        content = (
            data
            .get("choices", [{}])[0]
            .get("message", {})
            .get("content", "")
        )

        if not content:
            return None

        return parse_json(
            content
        )

    except Exception:

        return None


# ============================================================
# QUESTION LOOKUP
# ============================================================

def all_questions(
    vertical: str
) -> List[dict]:

    return (
        CORE_QUESTIONS.get(
            vertical,
            CORE_QUESTIONS["retail"]
        )
        +
        ADAPTIVE_QUESTIONS.get(
            vertical,
            ADAPTIVE_QUESTIONS["retail"]
        )
    )


def question_map(
    vertical: str
) -> Dict[str, dict]:

    return {

        normalize(
            item["text"]
        ):
            item

        for item in all_questions(
            vertical
        )
    }


# ============================================================
# EXTRACT ANSWERED QUESTIONS
# ============================================================

def get_question_answer_pairs(
    history: List[ChatMessage],
    current_message: str,
    vertical: str
) -> List[dict]:

    messages = list(history)

    messages.append(
        ChatMessage(
            role="user",
            content=current_message
        )
    )

    known = question_map(
        vertical
    )

    pairs = []

    pending = None

    for message in messages:

        content = message.content.strip()

        if not content:
            continue

        if message.role == "assistant":

            match = known.get(
                normalize(content)
            )

            if match:

                pending = match

        elif message.role == "user":

            if pending:

                pairs.append({

                    "question":
                        pending["text"],

                    "answer":
                        content,

                    "question_id":
                        pending["id"],

                    "domain":
                        pending["domain"],

                    "adaptive":
                        pending["adaptive"],
                })

                pending = None

    return pairs


# ============================================================
# QUESTIONS ALREADY ASKED
# ============================================================

def get_asked_questions(
    history: List[ChatMessage],
    vertical: str
) -> set:

    known = question_map(
        vertical
    )

    asked = set()

    for message in history:

        if message.role != "assistant":
            continue

        normalized = normalize(
            message.content
        )

        if normalized in known:

            asked.add(normalized)

    return asked


# ============================================================
# ADAPTIVE RISK DETECTION
# ============================================================

RISK_TERMS = [

    "no",
    "none",
    "never",
    "not",
    "don't",
    "do not",
    "unknown",
    "unsure",
    "not sure",
    "sometimes",
    "rarely",
    "shared",
    "manual",
    "haven't",
    "have not",
    "not tested",
    "never tested",
    "not enforced",
    "not monitored",
    "not reviewed",
    "not encrypted",
    "flat network",
    "no plan",
    "don't have",
    "do not have",
]


def answer_has_risk(
    answer: str
) -> bool:

    text = normalize(
        answer
    )

    return any(
        term in text
        for term in RISK_TERMS
    )


# ============================================================
# FIND ADAPTIVE FOLLOW-UP
# ============================================================

def find_followup(
    vertical: str,
    domain: str,
    asked: set
) -> Optional[dict]:

    candidates = [

        item

        for item in ADAPTIVE_QUESTIONS.get(
            vertical,
            ADAPTIVE_QUESTIONS["retail"]
        )

        if normalize(
            item["text"]
        ) not in asked
    ]

    same_domain = [

        item

        for item in candidates

        if item["domain"] == domain
    ]

    if same_domain:
        return same_domain[0]

    return (
        candidates[0]
        if candidates
        else None
    )


# ============================================================
# SELECT NEXT QUESTION
# ============================================================

def select_next_question(
    vertical: str,
    pairs: List[dict],
    asked: set,
    adaptive_count: int
) -> Optional[dict]:

    core = CORE_QUESTIONS.get(
        vertical,
        CORE_QUESTIONS["retail"]
    )

    # --------------------------------------------------------
    # Always finish the core assessment first.
    # --------------------------------------------------------

    unanswered_core = [

        item

        for item in core

        if normalize(
            item["text"]
        ) not in asked
    ]

    # --------------------------------------------------------
    # If the previous answer showed risk, ask an adaptive
    # follow-up before moving on.
    # --------------------------------------------------------

    if pairs:

        last = pairs[-1]

        if (
            answer_has_risk(
                last["answer"]
            )
            and
            adaptive_count <
            MAX_ADAPTIVE_QUESTIONS
        ):

            followup = find_followup(

                vertical,

                last["domain"],

                asked
            )

            if followup:

                return followup

    # --------------------------------------------------------
    # If there are still core questions, continue.
    # --------------------------------------------------------

    if unanswered_core:

        return unanswered_core[0]

    # --------------------------------------------------------
    # Core questions are complete.
    #
    # Ask additional follow-ups only if the AI believes
    # they are useful.
    # --------------------------------------------------------

    if (
        adaptive_count >=
        MAX_ADAPTIVE_QUESTIONS
    ):

        return None

    adaptive_candidates = [

        item

        for item in ADAPTIVE_QUESTIONS.get(
            vertical,
            ADAPTIVE_QUESTIONS["retail"]
        )

        if normalize(
            item["text"]
        ) not in asked
    ]

    if not adaptive_candidates:
        return None

    transcript = "\n\n".join(

        f'Q: {pair["question"]}\n'
        f'A: {pair["answer"]}'

        for pair in pairs
    )

    candidate_text = "\n".join(

        f'{item["id"]} | '
        f'{item["domain"]} | '
        f'{item["text"]}'

        for item in adaptive_candidates
    )

    system_prompt = """
You are the adaptive cybersecurity assessment controller.

Determine whether the organization needs another targeted
follow-up question after completing the core assessment.

Return JSON only.

If a meaningful unresolved weakness exists:

{
  "ask_followup": true,
  "question_id": "candidate id"
}

If the evidence is sufficient:

{
  "ask_followup": false,
  "question_id": ""
}

Rules:

- Only select from the supplied candidates.
- Never invent a question.
- Never repeat a question.
- Prefer a follow-up when evidence is incomplete,
  contradictory, weak, untested, or risky.
- Do not ask unnecessary questions.
- Do not request passwords, API keys, credentials,
  secrets, or other sensitive authentication material.
"""

    user_prompt = f"""
Business vertical:
{vertical}

Assessment transcript:

{transcript}

Remaining follow-up candidates:

{candidate_text}
"""

    result = call_groq(

        system_prompt,

        user_prompt,

        temperature=0.1,

        max_tokens=500
    )

    if result:

        should_ask = (
            result.get(
                "ask_followup",
                False
            )
            is True
        )

        if should_ask:

            selected_id = str(
                result.get(
                    "question_id",
                    ""
                )
            ).strip()

            for item in adaptive_candidates:

                if (
                    item["id"]
                    ==
                    selected_id
                ):

                    return item

    return None


# ============================================================
# FALLBACK DOMAIN SCORING
# ============================================================

def fallback_domain_score(
    pairs: List[dict],
    domain: str
) -> int:

    relevant = [

        pair

        for pair in pairs

        if pair["domain"] == domain
    ]

    if not relevant:
        return 50

    total = 0

    for pair in relevant:

        answer = normalize(
            pair["answer"]
        )

        if any(
            phrase in answer
            for phrase in [
                "no",
                "never",
                "none",
                "not tested",
                "not enforced",
                "don't",
                "do not",
                "shared",
            ]
        ):

            total += 30

        elif any(
            phrase in answer
            for phrase in [
                "yes",
                "implemented",
                "enforced",
                "tested",
                "regularly",
                "daily",
                "unique",
                "segmented",
                "isolated",
                "documented",
                "reviewed",
                "monitored",
            ]
        ):

            total += 85

        else:

            total += 55

    return clamp_score(
        total / len(relevant)
    )


# ============================================================
# FALLBACK SCORECARD
# ============================================================

def fallback_scorecard(
    vertical: str,
    pairs: List[dict]
) -> dict:

    categories = [

        "access_control",
        "data_backup",
        "network_security",
        "email_phishing",
        "incident_response",
    ]

    sub_categories = []

    for category in categories:

        score = fallback_domain_score(
            pairs,
            category
        )

        info = CATEGORY_INFO[
            category
        ]

        if score < 60:

            finding = (
                f"{info['name']} has "
                "significant control gaps "
                "based on the assessment evidence."
            )

        elif score < 80:

            finding = (
                f"{info['name']} has partial "
                "controls or validation gaps."
            )

        else:

            finding = (
                f"{info['name']} appears "
                "reasonably mature based "
                "on the available evidence."
            )

        sub_categories.append({

            "category":
                category,

            "score":
                score,

            "grade":
                grade(score),

            "findings":
                [finding],

            "nist_references":
                info["nist"],

            "cis_references":
                info["cis"],
        })

    overall = clamp_score(

        sum(
            item["score"]
            for item in sub_categories
        )
        /
        len(sub_categories)
    )

    remediation_plan = []

    priority_map = {
        "access_control":
            "Strengthen MFA, privileged access, and account lifecycle controls.",

        "data_backup":
            "Improve backup isolation and regularly test restoration.",

        "network_security":
            "Improve segmentation, endpoint protection, and patch management.",

        "email_phishing":
            "Strengthen security awareness and phishing testing.",

        "incident_response":
            "Document and rehearse the incident response process.",
    }

    day = 1

    for item in sorted(
        sub_categories,
        key=lambda x: x["score"]
    ):

        if item["score"] >= 80:
            continue

        category = item[
            "category"
        ]

        info = CATEGORY_INFO[
            category
        ]

        remediation_plan.append({

            "day":
                day,

            "priority":
                (
                    "Critical"
                    if item["score"] < 50
                    else
                    "High"
                    if item["score"] < 70
                    else
                    "Medium"
                ),

            "category":
                category,

            "action":
                priority_map[
                    category
                ],

            "nist_function":
                (
                    "Respond"
                    if category ==
                    "incident_response"
                    else
                    "Protect"
                ),

            "nist_category":
                info["nist"][0],

            "cis_control":
                info["cis"][0],

            "effort_estimate":
                "4-8 hours",
        })

        day += 7

    return {

        "overall_grade":
            grade(overall),

        "overall_score":
            overall,

        "sub_categories":
            sub_categories,

        "remediation_plan":
            remediation_plan,

        "vertical":
            vertical,

        "interview_complete":
            True,

        "next_question":
            None,
    }


# ============================================================
# AI SCORECARD
# ============================================================

def build_scorecard(
    vertical: str,
    pairs: List[dict]
) -> dict:

    evidence = "\n\n".join(

        f'Question: {pair["question"]}\n'
        f'Answer: {pair["answer"]}'

        for pair in pairs
    )

    system_prompt = """
You are the cybersecurity maturity scoring engine for CyberCISO.

Evaluate ONLY the evidence provided.

Do not invent facts.

Score these five categories from 0 to 100:

1. access_control
2. data_backup
3. network_security
4. email_phishing
5. incident_response

Scoring guidance:

90-100 = strong, consistently implemented and tested
80-89 = good controls with minor gaps
70-79 = reasonable controls but meaningful weaknesses
60-69 = partial implementation
40-59 = weak controls
0-39 = major or missing controls

Important:

- A claimed control is not automatically mature.
- Testing, review, monitoring, and consistency should improve
  maturity when evidence exists.
- Missing evidence should be scored conservatively.
- Never assume a company has a control that was not mentioned.
- Findings must be supported by the assessment.
- Remediation must directly address identified weaknesses.
- Overall score must be the average of the five category scores.
- Return JSON only.
"""

    user_prompt = f"""
Business vertical:
{vertical}

Assessment evidence:

{evidence}

Return exactly:

{{
  "sub_categories": [
    {{
      "category": "access_control",
      "score": 0,
      "findings": [],
      "nist_references": [],
      "cis_references": []
    }},
    {{
      "category": "data_backup",
      "score": 0,
      "findings": [],
      "nist_references": [],
      "cis_references": []
    }},
    {{
      "category": "network_security",
      "score": 0,
      "findings": [],
      "nist_references": [],
      "cis_references": []
    }},
    {{
      "category": "email_phishing",
      "score": 0,
      "findings": [],
      "nist_references": [],
      "cis_references": []
    }},
    {{
      "category": "incident_response",
      "score": 0,
      "findings": [],
      "nist_references": [],
      "cis_references": []
    }}
  ],
  "remediation_plan": [
    {{
      "day": 1,
      "priority": "High",
      "category": "access_control",
      "action": "Specific action supported by the evidence",
      "nist_function": "Protect",
      "nist_category": "PR.AA",
      "cis_control": "CIS 5",
      "effort_estimate": "4-8 hours"
    }}
  ]
}}
"""

    result = call_groq(

        system_prompt,

        user_prompt,

        temperature=0.1,

        max_tokens=3500
    )

    if not result:

        return fallback_scorecard(
            vertical,
            pairs
        )

    categories = [

        "access_control",
        "data_backup",
        "network_security",
        "email_phishing",
        "incident_response",
    ]

    category_map = {}

    raw_categories = result.get(
        "sub_categories",
        []
    )

    if isinstance(
        raw_categories,
        list
    ):

        for item in raw_categories:

            if not isinstance(
                item,
                dict
            ):
                continue

            category = str(
                item.get(
                    "category",
                    ""
                )
            ).strip()

            if category not in categories:
                continue

            score = clamp_score(
                item.get(
                    "score",
                    50
                )
            )

            findings = item.get(
                "findings",
                []
            )

            if not isinstance(
                findings,
                list
            ):

                findings = [
                    str(findings)
                ]

            findings = [

                str(value).strip()

                for value in findings[:4]

                if str(value).strip()
            ]

            if not findings:

                findings = [
                    "Evidence for this domain was limited."
                ]

            info = CATEGORY_INFO[
                category
            ]

            category_map[
                category
            ] = {

                "category":
                    category,

                "score":
                    score,

                "grade":
                    grade(score),

                "findings":
                    findings,

                "nist_references":
                    item.get(
                        "nist_references",
                        info["nist"]
                    ),

                "cis_references":
                    item.get(
                        "cis_references",
                        info["cis"]
                    ),
            }

    # --------------------------------------------------------
    # Fill missing categories safely.
    # --------------------------------------------------------

    for category in categories:

        if category in category_map:
            continue

        score = fallback_domain_score(
            pairs,
            category
        )

        info = CATEGORY_INFO[
            category
        ]

        category_map[
            category
        ] = {

            "category":
                category,

            "score":
                score,

            "grade":
                grade(score),

            "findings": [
                "Evidence for this domain was limited."
            ],

            "nist_references":
                info["nist"],

            "cis_references":
                info["cis"],
        }

    sub_categories = [

        category_map[
            category
        ]

        for category in categories
    ]

    overall = clamp_score(

        sum(
            item["score"]
            for item in sub_categories
        )
        /
        len(sub_categories)
    )

    # --------------------------------------------------------
    # Remediation plan
    # --------------------------------------------------------

    remediation_plan = []

    raw_plan = result.get(
        "remediation_plan",
        []
    )

    if isinstance(
        raw_plan,
        list
    ):

        for index, item in enumerate(
            raw_plan[:8]
        ):

            if not isinstance(
                item,
                dict
            ):
                continue

            category = str(
                item.get(
                    "category",
                    ""
                )
            ).strip()

            if category not in categories:
                continue

            action = str(
                item.get(
                    "action",
                    ""
                )
            ).strip()

            if not action:
                continue

            info = CATEGORY_INFO[
                category
            ]

            try:

                day = int(
                    item.get(
                        "day",
                        (index + 1) * 7
                    )
                )

            except Exception:

                day = (
                    index + 1
                ) * 7

            remediation_plan.append({

                "day":
                    max(1, day),

                "priority":
                    str(
                        item.get(
                            "priority",
                            "High"
                        )
                    ),

                "category":
                    category,

                "action":
                    action,

                "nist_function":
                    str(
                        item.get(
                            "nist_function",
                            (
                                "Respond"
                                if category ==
                                "incident_response"
                                else
                                "Protect"
                            )
                        )
                    ),

                "nist_category":
                    str(
                        item.get(
                            "nist_category",
                            info["nist"][0]
                        )
                    ),

                "cis_control":
                    str(
                        item.get(
                            "cis_control",
                            info["cis"][0]
                        )
                    ),

                "effort_estimate":
                    str(
                        item.get(
                            "effort_estimate",
                            "4-8 hours"
                        )
                    ),
            })

    return {

        "overall_grade":
            grade(overall),

        "overall_score":
            overall,

        "sub_categories":
            sub_categories,

        "remediation_plan":
            remediation_plan,

        "vertical":
            vertical,

        "interview_complete":
            True,

        "next_question":
            None,
    }


# ============================================================
# FASTAPI
# ============================================================

app = FastAPI(

    title="CyberCISO API",

    version="2.0.0"
)

# Explicit Vercel Python runtime entrypoint
handler = app


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
# HEALTH
# ============================================================

@app.get("/")
async def root():

    return {

        "message":
            "CyberCISO API",

        "version":
            "2.0.0"
    }


@app.get("/api/index")
async def api_index():

    return {

        "status":
            "healthy",

        "service":
            "cyberciso-backend",

        "adaptive_assessment":
            True,

        "groq_configured":
            bool(
                GROQ_API_KEY
            ),
    }


@app.get("/api/v1/health")
@app.get("/health")
async def health():

    return {

        "status":
            "healthy",

        "service":
            "cyberciso-backend",

        "adaptive_assessment":
            True,

        "groq_configured":
            bool(
                GROQ_API_KEY
            ),
    }


# ============================================================
# CHAT
# ============================================================

@app.post(
    "/api/index",
    response_model=ChatResponse
)
@app.post(
    "/api/v1/chat",
    response_model=ChatResponse
)
@app.post(
    "/v1/chat",
    response_model=ChatResponse
)
async def chat(
    req: ChatRequest
):

    vertical = (
        req.vertical
        or
        Vertical.RETAIL
    )

    vertical_key = (

        vertical.value

        if hasattr(
            vertical,
            "value"
        )

        else str(
            vertical
        )
    )

    # --------------------------------------------------------
    # Reconstruct the assessment from the conversation.
    # --------------------------------------------------------

    pairs = get_question_answer_pairs(

        req.conversation_history,

        req.message,

        vertical_key
    )

    asked = get_asked_questions(

        req.conversation_history,

        vertical_key
    )

    # The current user answer belongs to the question that
    # was already in conversation_history.
    #
    # Therefore the current question is now also considered
    # answered when deciding what comes next.

    for pair in pairs:

        asked.add(
            normalize(
                pair["question"]
            )
        )

    core_count = sum(

        1

        for pair in pairs

        if not pair["adaptive"]
    )

    adaptive_count = sum(

        1

        for pair in pairs

        if pair["adaptive"]
    )

    # --------------------------------------------------------
    # SAFETY: maximum assessment length.
    # --------------------------------------------------------

    if len(pairs) >= MAX_TOTAL_QUESTIONS:

        scorecard = build_scorecard(

            vertical_key,

            pairs
        )

        return ChatResponse(

            response="",

            scorecard=scorecard,

            interview_complete=True
        )

    # --------------------------------------------------------
    # If all 15 core questions are complete, decide whether
    # additional adaptive investigation is useful.
    # --------------------------------------------------------

    if core_count >= MIN_CORE_QUESTIONS:

        next_question = select_next_question(

            vertical_key,

            pairs,

            asked,

            adaptive_count
        )

        if next_question:

            return ChatResponse(

                response=next_question["text"],

                interview_complete=False
            )

        scorecard = build_scorecard(

            vertical_key,

            pairs
        )

        return ChatResponse(

            response="",

            scorecard=scorecard,

            interview_complete=True
        )

    # --------------------------------------------------------
    # Core questions remain.
    #
    # The selector may insert an adaptive follow-up when
    # the latest answer shows meaningful risk.
    # --------------------------------------------------------

    next_question = select_next_question(

        vertical_key,

        pairs,

        asked,

        adaptive_count
    )

    # --------------------------------------------------------
    # Final safety fallback.
    # --------------------------------------------------------

    if not next_question:

        scorecard = build_scorecard(

            vertical_key,

            pairs
        )

        return ChatResponse(

            response="",

            scorecard=scorecard,

            interview_complete=True
        )

    return ChatResponse(

        response=next_question["text"],

        interview_complete=False
    )
