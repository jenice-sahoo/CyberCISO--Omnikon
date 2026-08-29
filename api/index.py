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
# CONFIGURATION
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
# QUESTION HELPERS
# ============================================================

def core_question(
    qid: str,
    domain: str,
    phase: str,
    text: str
) -> dict:
    return {
        "id": qid,
        "domain": domain,
        "phase": phase,
        "text": text,
        "adaptive": False,
    }


def adaptive_question(
    qid: str,
    domain: str,
    phase: str,
    text: str
) -> dict:
    return {
        "id": qid,
        "domain": domain,
        "phase": phase,
        "text": text,
        "adaptive": True,
    }


# ============================================================
# CORE QUESTIONS
#
# EXACTLY 15 CORE QUESTIONS PER VERTICAL
# ============================================================

CORE_QUESTIONS: Dict[str, List[dict]] = {

    # ========================================================
    # RETAIL
    # ========================================================

    "retail": [

        core_question(
            "retail_org_size",
            "organization",
            "Organization",
            "How many employees access your point-of-sale systems and inventory databases?"
        ),

        core_question(
            "retail_data",
            "organization",
            "Organization",
            "What sensitive or regulated information does your business handle, such as payment card data, customer information, employee data, or supplier information?"
        ),

        core_question(
            "retail_critical",
            "organization",
            "Organization",
            "Which systems are most critical to keeping your business operating, such as point-of-sale, inventory, accounting, e-commerce, or cloud systems?"
        ),

        core_question(
            "retail_mfa",
            "access_control",
            "Identity & Access",
            "Do you use multi-factor authentication (MFA) for administrative accounts, remote access, and important cloud services?"
        ),

        core_question(
            "retail_lifecycle",
            "access_control",
            "Identity & Access",
            "How are employee accounts created, changed, and removed when someone joins, changes roles, or leaves the company?"
        ),

        core_question(
            "retail_privileged",
            "access_control",
            "Identity & Access",
            "Do administrators use separate privileged accounts, and are privileged permissions reviewed regularly?"
        ),

        core_question(
            "retail_backup",
            "data_backup",
            "Data",
            "How frequently is critical business data backed up, and where are those backups stored?"
        ),

        core_question(
            "retail_restore",
            "data_backup",
            "Data",
            "When was the last time you successfully restored important business data from a backup?"
        ),

        core_question(
            "retail_segment",
            "network_security",
            "Infrastructure",
            "Is your payment-processing or point-of-sale environment separated from guest Wi-Fi and other less-trusted devices?"
        ),

        core_question(
            "retail_endpoint",
            "network_security",
            "Infrastructure",
            "How are company laptops, desktops, POS devices, and other endpoints protected against malware and unauthorized software?"
        ),

        core_question(
            "retail_patch",
            "network_security",
            "Infrastructure",
            "How do you keep operating systems, POS software, routers, and other important systems patched and up to date?"
        ),

        core_question(
            "retail_training",
            "email_phishing",
            "People",
            "Do employees receive security awareness training, including guidance on phishing, passwords, and handling customer information?"
        ),

        core_question(
            "retail_phishing",
            "email_phishing",
            "People",
            "Have you conducted a phishing simulation or other practical test of employee security awareness in the last 12 months?"
        ),

        core_question(
            "retail_ir",
            "incident_response",
            "Response",
            "Do you have a written incident response plan covering what to do if you experience ransomware, a data breach, or a payment-system compromise?"
        ),

        core_question(
            "retail_ir_test",
            "incident_response",
            "Response",
            "Has your incident response plan been tested or rehearsed with the people who would actually respond to an incident?"
        ),
    ],

    # ========================================================
    # HEALTHCARE
    # ========================================================

    "healthcare_clinic": [

        core_question(
            "health_org_size",
            "organization",
            "Organization",
            "How many staff members access your electronic health records (EHR) system?"
        ),

        core_question(
            "health_data",
            "organization",
            "Organization",
            "What types of patient or other sensitive information does your clinic handle, store, or transmit?"
        ),

        core_question(
            "health_critical",
            "organization",
            "Organization",
            "Which systems are most critical to patient care and clinic operations, such as your EHR, scheduling, billing, laboratory, imaging, or medical-device systems?"
        ),

        core_question(
            "health_mfa",
            "access_control",
            "Identity & Access",
            "Do you use multi-factor authentication (MFA) for administrative accounts, remote access, and important cloud or healthcare systems?"
        ),

        core_question(
            "health_role",
            "access_control",
            "Identity & Access",
            "Is access to patient information restricted by job role so that staff only receive the access they need?"
        ),

        core_question(
            "health_lifecycle",
            "access_control",
            "Identity & Access",
            "How are staff accounts created, changed, and removed when employees join, change roles, or leave the clinic?"
        ),

        core_question(
            "health_backup",
            "data_backup",
            "Data",
            "How frequently are EHR and other critical clinical systems backed up, and are the backups protected from unauthorized access?"
        ),

        core_question(
            "health_restore",
            "data_backup",
            "Data",
            "When was the last time your clinic successfully restored patient or operational data from a backup?"
        ),

        core_question(
            "health_network",
            "network_security",
            "Infrastructure",
            "Are clinical systems and medical devices separated from guest Wi-Fi and other less-trusted networks?"
        ),

        core_question(
            "health_devices",
            "network_security",
            "Infrastructure",
            "How are connected medical devices inventoried, protected, monitored, and kept up to date?"
        ),

        core_question(
            "health_patch",
            "network_security",
            "Infrastructure",
            "How do you manage security patches and updates for servers, workstations, network equipment, and medical devices where supported?"
        ),

        core_question(
            "health_training",
            "email_phishing",
            "People",
            "Do staff receive security and privacy awareness training covering phishing, passwords, patient information, and safe handling of sensitive data?"
        ),

        core_question(
            "health_phishing",
            "email_phishing",
            "People",
            "Have you tested staff resistance to phishing or social engineering during the last 12 months?"
        ),

        core_question(
            "health_ir",
            "incident_response",
            "Response",
            "Do you have a documented process for responding to a cybersecurity incident or suspected HIPAA breach?"
        ),

        core_question(
            "health_ir_test",
            "incident_response",
            "Response",
            "Has that incident or breach response process been tested or rehearsed with the people responsible for responding?"
        ),
    ],

    # ========================================================
    # PROFESSIONAL SERVICES
    # ========================================================

    "professional_services": [

        core_question(
            "pro_org_size",
            "organization",
            "Organization",
            "How many team members access client confidential data on a regular basis?"
        ),

        core_question(
            "pro_data",
            "organization",
            "Organization",
            "What sensitive information do you handle for clients or your own business, such as confidential documents, financial information, intellectual property, or personal data?"
        ),

        core_question(
            "pro_critical",
            "organization",
            "Organization",
            "Which systems are most critical to delivering your services, such as Microsoft 365, Google Workspace, CRM, accounting, project management, or file-sharing platforms?"
        ),

        core_question(
            "pro_mfa",
            "access_control",
            "Identity & Access",
            "Do you enforce multi-factor authentication (MFA) for cloud services, administrative accounts, remote access, and other important systems?"
        ),

        core_question(
            "pro_lifecycle",
            "access_control",
            "Identity & Access",
            "How are employee and contractor accounts created, changed, and removed when someone joins, changes roles, or leaves?"
        ),

        core_question(
            "pro_privileged",
            "access_control",
            "Identity & Access",
            "Do administrators use separate privileged accounts, and are privileged permissions reviewed periodically?"
        ),

        core_question(
            "pro_backup",
            "data_backup",
            "Data",
            "How frequently are critical client and business files backed up, and are backups stored separately from your primary systems?"
        ),

        core_question(
            "pro_restore",
            "data_backup",
            "Data",
            "When was the last time you successfully restored an important client or business file from a backup?"
        ),

        core_question(
            "pro_network",
            "network_security",
            "Infrastructure",
            "How is access to your company network and cloud services protected when employees work remotely or from unmanaged networks?"
        ),

        core_question(
            "pro_endpoint",
            "network_security",
            "Infrastructure",
            "How are employee laptops and other endpoints protected against malware, unauthorized software, and loss or theft?"
        ),

        core_question(
            "pro_patch",
            "network_security",
            "Infrastructure",
            "How do you ensure operating systems, applications, network devices, and cloud services are kept up to date?"
        ),

        core_question(
            "pro_training",
            "email_phishing",
            "People",
            "Do employees receive security awareness training covering phishing, passwords, confidential client information, and secure file sharing?"
        ),

        core_question(
            "pro_phishing",
            "email_phishing",
            "People",
            "Have you conducted a phishing simulation or other practical social-engineering test during the last 12 months?"
        ),

        core_question(
            "pro_ir",
            "incident_response",
            "Response",
            "Do you have a written incident response plan for situations such as ransomware, account compromise, or exposure of client data?"
        ),

        core_question(
            "pro_ir_test",
            "incident_response",
            "Response",
            "Has your incident response plan been tested or rehearsed with the people responsible for responding?"
        ),
    ],
}


# ============================================================
# ADAPTIVE FOLLOW-UP QUESTIONS
# ============================================================

ADAPTIVE_QUESTIONS: Dict[str, List[dict]] = {

    # ========================================================
    # RETAIL FOLLOW-UPS
    # ========================================================

    "retail": [

        adaptive_question(
            "ret_mfa_admin",
            "access_control",
            "Identity & Access",
            "Which accounts currently have administrative access to your POS, inventory, payment, or other critical systems?"
        ),

        adaptive_question(
            "ret_mfa_shared",
            "access_control",
            "Identity & Access",
            "Are any administrative or important system accounts shared between employees, or does each person have a unique account?"
        ),

        adaptive_question(
            "ret_mfa_scope",
            "access_control",
            "Identity & Access",
            "Are there any important systems or remote-access methods where MFA is not currently enforced?"
        ),

        adaptive_question(
            "ret_backup_test",
            "data_backup",
            "Data",
            "How often do you test restoring data from your backups, and what happened during the most recent restore test?"
        ),

        adaptive_question(
            "ret_backup_offline",
            "data_backup",
            "Data",
            "Are any backup copies isolated or otherwise protected so that ransomware affecting production systems cannot also encrypt or delete the backups?"
        ),

        adaptive_question(
            "ret_network_flat",
            "network_security",
            "Infrastructure",
            "What devices or systems can communicate directly with the payment-processing or POS network?"
        ),

        adaptive_question(
            "ret_patch_gap",
            "network_security",
            "Infrastructure",
            "Are there any POS devices, routers, servers, or other critical systems that are currently behind on security patches?"
        ),

        adaptive_question(
            "ret_phish_result",
            "email_phishing",
            "People",
            "What were the results of your most recent phishing or security-awareness test, and what did you do for employees who struggled?"
        ),

        adaptive_question(
            "ret_ir_contact",
            "incident_response",
            "Response",
            "If your POS or customer-data systems were compromised tonight, who would be responsible for leading the response and who would you contact first?"
        ),

        adaptive_question(
            "ret_vendor",
            "third_party",
            "Third Parties",
            "Do any vendors or service providers have access to your POS, payment, inventory, or customer systems, and how do you assess their security?"
        ),
    ],

    # ========================================================
    # HEALTHCARE FOLLOW-UPS
    # ========================================================

    "healthcare_clinic": [

        adaptive_question(
            "health_mfa_admin",
            "access_control",
            "Identity & Access",
            "Which staff or vendor accounts have administrative access to your EHR or other systems containing patient information?"
        ),

        adaptive_question(
            "health_shared",
            "access_control",
            "Identity & Access",
            "Are any EHR, workstation, or administrative accounts shared between staff, or does each person have a unique account?"
        ),

        adaptive_question(
            "health_role_gap",
            "access_control",
            "Identity & Access",
            "When was the last time you reviewed staff access to patient information, and what happens when someone changes roles?"
        ),

        adaptive_question(
            "health_backup_test",
            "data_backup",
            "Data",
            "How often do you test restoring EHR or other critical data from backup, and when was the last successful restore?"
        ),

        adaptive_question(
            "health_backup_isolation",
            "data_backup",
            "Data",
            "Are backup copies isolated from the systems they protect so that ransomware or an administrator compromise cannot easily destroy them?"
        ),

        adaptive_question(
            "health_device_gap",
            "network_security",
            "Infrastructure",
            "Are there any medical devices or connected clinical systems that cannot currently receive security updates or are not centrally monitored?"
        ),

        adaptive_question(
            "health_network_gap",
            "network_security",
            "Infrastructure",
            "Can guest devices, personal devices, or general office systems communicate directly with clinical or medical-device networks?"
        ),

        adaptive_question(
            "health_phish_result",
            "email_phishing",
            "People",
            "What happened during your most recent phishing or social-engineering test, and were additional controls or training introduced afterward?"
        ),

        adaptive_question(
            "health_ir_breach",
            "incident_response",
            "Response",
            "If patient information were exposed today, who would coordinate the response and how would you handle investigation, containment, and required notifications?"
        ),

        adaptive_question(
            "health_vendor",
            "third_party",
            "Third Parties",
            "Which vendors can access patient information or clinical systems, and how do you verify that their security and privacy responsibilities are documented?"
        ),
    ],

    # ========================================================
    # PROFESSIONAL SERVICES FOLLOW-UPS
    # ========================================================

    "professional_services": [

        adaptive_question(
            "pro_mfa_admin",
            "access_control",
            "Identity & Access",
            "Which accounts have administrative access to Microsoft 365, Google Workspace, CRM, finance, or other critical cloud systems?"
        ),

        adaptive_question(
            "pro_shared",
            "access_control",
            "Identity & Access",
            "Are any administrative or client-data accounts shared between employees, or does each person use a unique account?"
        ),

        adaptive_question(
            "pro_access_review",
            "access_control",
            "Identity & Access",
            "When was the last time you reviewed user and privileged access to client data, and how are unnecessary permissions removed?"
        ),

        adaptive_question(
            "pro_backup_test",
            "data_backup",
            "Data",
            "How often do you test restoring client or business data from backup, and when was the last successful restore?"
        ),

        adaptive_question(
            "pro_backup_ransom",
            "data_backup",
            "Data",
            "Are backup copies protected from ransomware or accidental deletion in your primary cloud or file-sharing environment?"
        ),

        adaptive_question(
            "pro_remote",
            "network_security",
            "Infrastructure",
            "How do you control access when employees connect to company systems from home, public Wi-Fi, or unmanaged devices?"
        ),

        adaptive_question(
            "pro_patch_gap",
            "network_security",
            "Infrastructure",
            "Are there any employee devices, servers, or applications that are currently known to be missing important security updates?"
        ),

        adaptive_question(
            "pro_phish_result",
            "email_phishing",
            "People",
            "What happened during your most recent phishing simulation or social-engineering test, and how did you respond to the results?"
        ),

        adaptive_question(
            "pro_ir_client",
            "incident_response",
            "Response",
            "If confidential client data were exposed today, who would lead the response and how would you communicate with affected clients?"
        ),

        adaptive_question(
            "pro_vendor",
            "third_party",
            "Third Parties",
            "Which vendors or contractors can access confidential client information, and how do you evaluate their security before granting access?"
        ),
    ],
}


# ============================================================
# SCORECARD METADATA
# ============================================================

CATEGORY_INFO = {

    "access_control": {
        "name": "Access Control",
        "nist_references": [
            "PR.AA"
        ],
        "cis_references": [
            "CIS 5",
            "CIS 6"
        ],
    },

    "data_backup": {
        "name": "Data Backup",
        "nist_references": [
            "PR.DS",
            "RC.RP"
        ],
        "cis_references": [
            "CIS 11"
        ],
    },

    "network_security": {
        "name": "Network Security",
        "nist_references": [
            "PR.IR"
        ],
        "cis_references": [
            "CIS 12",
            "CIS 13"
        ],
    },

    "email_phishing": {
        "name": "Email / Phishing Readiness",
        "nist_references": [
            "PR.AT"
        ],
        "cis_references": [
            "CIS 14"
        ],
    },

    "incident_response": {
        "name": "Incident Response",
        "nist_references": [
            "RS.MA",
            "RS.CO",
            "RS.MI"
        ],
        "cis_references": [
            "CIS 17"
        ],
    },
}


# ============================================================
# TEXT HELPERS
# ============================================================

def normalize(text: str) -> str:
    return re.sub(
        r"\s+",
        " ",
        text.strip().lower()
    )


def clean_model_text(text: str) -> str:

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


def parse_json_response(
    text: str
) -> Optional[dict]:

    cleaned = clean_model_text(text)

    try:

        value = json.loads(cleaned)

        if isinstance(value, dict):
            return value

    except Exception:
        pass

    match = re.search(
        r"\{[\s\S]*\}",
        cleaned
    )

    if match:

        try:

            value = json.loads(
                match.group(0)
            )

            if isinstance(value, dict):
                return value

        except Exception:
            pass

    return None


# ============================================================
# QUESTION LOOKUP
# ============================================================

def get_all_questions(
    vertical_key: str
) -> List[dict]:

    return (
        CORE_QUESTIONS.get(
            vertical_key,
            CORE_QUESTIONS["retail"]
        )
        +
        ADAPTIVE_QUESTIONS.get(
            vertical_key,
            ADAPTIVE_QUESTIONS["retail"]
        )
    )


def get_question_by_text(
    vertical_key: str,
    text: str
) -> Optional[dict]:

    target = normalize(text)

    for item in get_all_questions(
        vertical_key
    ):

        if normalize(
            item["text"]
        ) == target:

            return item

    return None


# ============================================================
# EXTRACT QUESTION / ANSWER PAIRS
# ============================================================

def extract_question_answer_pairs(
    history: List[ChatMessage],
    current_message: str,
    vertical_key: str
) -> List[dict]:

    messages = list(history)

    if current_message.strip():

        messages.append(
            ChatMessage(
                role="user",
                content=current_message.strip()
            )
        )

    pairs = []

    pending_question = None

    known_questions = {
        normalize(item["text"]): item
        for item in get_all_questions(
            vertical_key
        )
    }

    for message in messages:

        content = message.content.strip()

        if not content:
            continue

        if message.role == "assistant":

            normalized = normalize(
                content
            )

            known = known_questions.get(
                normalized
            )

            if known:
                pending_question = (
                    known["text"]
                )

        elif message.role == "user":

            if pending_question:

                pairs.append(
                    {
                        "question":
                            pending_question,

                        "answer":
                            content,

                        "question_meta":
                            get_question_by_text(
                                vertical_key,
                                pending_question
                            ),
                    }
                )

                pending_question = None

    return pairs


# ============================================================
# GET QUESTIONS ALREADY ASKED
# ============================================================

def get_asked_question_texts(
    history: List[ChatMessage],
    vertical_key: str
) -> set:

    known_questions = {
        normalize(item["text"])
        for item in get_all_questions(
            vertical_key
        )
    }

    asked = set()

    for message in history:

        if message.role != "assistant":
            continue

        normalized = normalize(
            message.content
        )

        if normalized in known_questions:

            asked.add(normalized)

    return asked


# ============================================================
# GROQ JSON CALL
# ============================================================

def call_groq_json(
    system_prompt: str,
    user_prompt: str,
    temperature: float = 0.2,
    max_tokens: int = 1200
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

        method="POST",
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

        body = json.loads(raw)

        content = (
            body
            .get("choices", [{}])[0]
            .get("message", {})
            .get("content", "")
        )

        if not content:
            return None

        return parse_json_response(
            content
        )

    except (
        urllib.error.HTTPError,
        urllib.error.URLError,
        TimeoutError,
        json.JSONDecodeError,
        KeyError,
        IndexError,
        TypeError,
    ):

        return None


# ============================================================
# DETERMINISTIC ADAPTIVE FALLBACK
# ============================================================

def deterministic_followup(
    vertical_key: str,
    pairs: List[dict],
    asked: set
) -> Optional[dict]:

    if not pairs:
        return None

    last = pairs[-1]

    answer = normalize(
        last["answer"]
    )

    meta = (
        last.get(
            "question_meta"
        )
        or {}
    )

    domain = meta.get(
        "domain",
        ""
    )

    risk_terms = [

        "no",
        "not",
        "never",
        "none",

        "don't",
        "do not",

        "unknown",
        "not sure",
        "unsure",

        "sometimes",
        "rarely",

        "monthly",

        "shared",

        "manual",

        "haven't",
        "have not",

        "not tested",
        "never tested",
    ]

    needs_followup = any(
        term in answer
        for term in risk_terms
    )

    if not needs_followup:
        return None

    candidates = [

        item

        for item in ADAPTIVE_QUESTIONS.get(
            vertical_key,
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

    if candidates:
        return candidates[0]

    return None


# ============================================================
# AI ADAPTIVE QUESTION SELECTOR
# ============================================================

def choose_next_question(
    vertical_key: str,
    pairs: List[dict],
    asked: set,
    adaptive_count: int
) -> Optional[dict]:

    core = CORE_QUESTIONS.get(
        vertical_key,
        CORE_QUESTIONS["retail"]
    )

    adaptive = ADAPTIVE_QUESTIONS.get(
        vertical_key,
        ADAPTIVE_QUESTIONS["retail"]
    )

    unasked_core = [

        item

        for item in core

        if normalize(
            item["text"]
        ) not in asked
    ]

    unasked_adaptive = [

        item

        for item in adaptive

        if normalize(
            item["text"]
        ) not in asked
    ]

    if (
        not unasked_core
        and
        not unasked_adaptive
    ):
        return None

    if (
        adaptive_count
        >= MAX_ADAPTIVE_QUESTIONS
    ):

        if unasked_core:
            return unasked_core[0]

        return None

    suggested_followup = (
        deterministic_followup(
            vertical_key,
            pairs,
            asked
        )
    )

    last_question = (
        pairs[-1]["question"]
        if pairs
        else ""
    )

    last_answer = (
        pairs[-1]["answer"]
        if pairs
        else ""
    )

    candidate_pool = (
        unasked_core
        +
        unasked_adaptive
    )

    candidate_text = "\n".join(

        f'{item["id"]} | '
        f'{item["domain"]} | '
        f'{item["phase"]} | '
        f'{item["text"]}'

        for item in candidate_pool
    )

    transcript = "\n\n".join(

        f'Q: {pair["question"]}\n'
        f'A: {pair["answer"]}'

        for pair in pairs[-12:]
    )

    suggested_text = (

        suggested_followup["text"]

        if suggested_followup

        else "none"
    )

    system_prompt = """
You are the adaptive interview controller for CyberCISO.

Your job is to choose exactly ONE next cybersecurity assessment
question from the candidate list supplied by the application.

Rules:

1. Return JSON only.

2. The selected question MUST be copied exactly from
   the candidate list.

3. Never invent a question.

4. Never repeat a question already asked.

5. If the latest answer reveals a weakness, uncertainty,
   missing control, shared account, lack of testing, or other
   meaningful risk, prefer a relevant adaptive follow-up.

6. If the latest answer is strong and no clarification is needed,
   continue with the most useful unanswered core question.

7. Cover these areas broadly:
   organization,
   access control,
   data backup,
   network security,
   people/email,
   incident response,
   and third parties where relevant.

8. Do not ask for passwords, API keys, secrets, or credentials.

9. Keep questions practical for small and medium organizations.

10. A maximum of four adaptive follow-up questions may be asked.

11. Do not end the assessment while core questions remain.

12. Prefer depth when an answer exposes a security weakness.

13. Prefer breadth when the latest answer is strong.
"""

    user_prompt = f"""
Business vertical:
{vertical_key}

Core questions answered:
{
    len([
        p
        for p in pairs
        if not (
            p.get("question_meta")
            or {}
        ).get("adaptive")
    ])
}

Adaptive follow-ups answered:
{adaptive_count}

Latest question:
{last_question}

Latest answer:
{last_answer}

Recent assessment:
{transcript}

Deterministic fallback suggestion:
{suggested_text}

Candidate questions:
{candidate_text}

Return exactly:

{{
  "question_id": "one candidate id",
  "question": "the exact candidate question text",
  "reason": "one short sentence"
}}
"""

    result = call_groq_json(

        system_prompt,

        user_prompt,

        temperature=0.1,

        max_tokens=500
    )

    if result:

        selected_id = str(
            result.get(
                "question_id",
                ""
            )
        ).strip()

        selected_question = str(
            result.get(
                "question",
                ""
            )
        ).strip()

        for item in candidate_pool:

            if (
                item["id"]
                ==
                selected_id
            ):

                return item

            if (
                normalize(
                    item["text"]
                )
                ==
                normalize(
                    selected_question
                )
            ):

                return item

    if suggested_followup:
        return suggested_followup

    if unasked_core:
        return unasked_core[0]

    if unasked_adaptive:
        return unasked_adaptive[0]

    return None


# ============================================================
# SCORECARD GRADE
# ============================================================

def grade_for_score(
    score: int
) -> str:

    if score >= 90:
        return "A"

    if score >= 80:
        return "B"

    if score >= 70:
        return "C"

    if score >= 60:
        return "D"

    return "F"


def clamp_score(
    value: Any
) -> int:

    try:

        number = int(
            round(
                float(value)
            )
        )

    except (
        TypeError,
        ValueError
    ):

        return 50

    return max(
        0,
        min(
            100,
            number
        )
    )


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

        if (
            pair
            .get("question_meta")
            or {}
        ).get("domain")
        ==
        domain
    ]

    if not relevant:
        return 50

    total = 0
    count = 0

    strong_terms = [

        "yes",
        "always",
        "enforced",
        "tested",
        "regularly",
        "quarterly",
        "daily",
        "unique",
        "segmented",
        "isolated",
        "documented",
        "reviewed",
        "monitored",
        "encrypted",
        "mfa",
    ]

    weak_terms = [

        "no",
        "never",
        "none",
        "don't",
        "do not",
        "not sure",
        "unknown",
        "shared",
        "not tested",
        "not encrypted",
        "flat network",
        "monthly",
        "rarely",
    ]

    for pair in relevant:

        text = normalize(
            pair["answer"]
        )

        strong_hits = sum(

            1

            for term in strong_terms

            if term in text
        )

        weak_hits = sum(

            1

            for term in weak_terms

            if term in text
        )

        if weak_hits > strong_hits:

            score = 30

        elif strong_hits > 0:

            score = 80

        else:

            score = 55

        total += score
        count += 1

    return clamp_score(
        total / count
    )


# ============================================================
# FALLBACK SCORECARD
# ============================================================

def fallback_scorecard(
    vertical_key: str,
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
                f"{info['name']} shows "
                "significant gaps based "
                "on the assessment evidence."
            )

        elif score < 80:

            finding = (
                f"{info['name']} has partial "
                "controls or testing gaps "
                "that should be strengthened."
            )

        else:

            finding = (
                f"{info['name']} appears "
                "reasonably mature based "
                "on the evidence provided."
            )

        sub_categories.append({

            "category":
                category,

            "score":
                score,

            "grade":
                grade_for_score(score),

            "findings":
                [finding],

            "nist_references":
                info[
                    "nist_references"
                ],

            "cis_references":
                info[
                    "cis_references"
                ],
        })

    overall_score = clamp_score(

        sum(
            item["score"]
            for item in sub_categories
        )
        /
        len(sub_categories)
    )

    remediation_plan = []

    day = 1

    for item in sorted(

        sub_categories,

        key=lambda x:
            x["score"]
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

            "priority": (

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

            "action": (
                f"Strengthen "
                f"{info['name']} controls "
                "and validate them with "
                "documented testing."
            ),

            "nist_function": (

                "Respond"

                if category ==
                "incident_response"

                else

                "Protect"
            ),

            "nist_category":
                info[
                    "nist_references"
                ][0],

            "cis_control":
                info[
                    "cis_references"
                ][0],

            "effort_estimate":
                "4-8 hours",
        })

        day += 7

    return {

        "overall_grade":
            grade_for_score(
                overall_score
            ),

        "overall_score":
            overall_score,

        "sub_categories":
            sub_categories,

        "remediation_plan":
            remediation_plan,

        "vertical":
            vertical_key,

        "interview_complete":
            True,

        "next_question":
            None,
    }


# ============================================================
# AI SCORECARD
# ============================================================

def build_scorecard(
    vertical_key: str,
    pairs: List[dict]
) -> dict:

    categories = [

        "access_control",

        "data_backup",

        "network_security",

        "email_phishing",

        "incident_response",
    ]

    evidence = "\n\n".join(

        f'Question: {pair["question"]}\n'
        f'Answer: {pair["answer"]}'

        for pair in pairs
    )

    system_prompt = """
You are the cybersecurity maturity scoring engine for CyberCISO.

Evaluate ONLY the evidence contained in the supplied assessment.

Rules:

1. Do not invent controls, policies, technologies,
   tests, certifications, or facts.

2. If evidence is missing or ambiguous,
   score conservatively.

3. Strong scores require evidence of actual implementation.

4. Where appropriate, strong maturity also requires evidence
   of review, monitoring, or testing.

5. Weak scores should reflect missing, inconsistent,
   shared, untested, or explicitly absent controls.

6. Score these five domains from 0 to 100:
   access_control,
   data_backup,
   network_security,
   email_phishing,
   incident_response.

7. Overall score MUST be the arithmetic mean of the
   five domain scores.

8. Findings must describe weaknesses actually evidenced
   by the transcript.

9. Do not make unsupported legal or compliance claims.

10. Remediation actions must directly address identified
    weaknesses.

11. Return JSON only.
"""

    user_prompt = f"""
Business vertical:
{vertical_key}

Assessment evidence:

{evidence}

Return exactly this structure:

{{
  "overall_score": 0,
  "overall_grade": "A",

  "sub_categories": [

    {{
      "category": "access_control",
      "score": 0,
      "grade": "A",
      "findings": ["..."],
      "nist_references": ["..."],
      "cis_references": ["..."]
    }},

    {{
      "category": "data_backup",
      "score": 0,
      "grade": "A",
      "findings": ["..."],
      "nist_references": ["..."],
      "cis_references": ["..."]
    }},

    {{
      "category": "network_security",
      "score": 0,
      "grade": "A",
      "findings": ["..."],
      "nist_references": ["..."],
      "cis_references": ["..."]
    }},

    {{
      "category": "email_phishing",
      "score": 0,
      "grade": "A",
      "findings": ["..."],
      "nist_references": ["..."],
      "cis_references": ["..."]
    }},

    {{
      "category": "incident_response",
      "score": 0,
      "grade": "A",
      "findings": ["..."],
      "nist_references": ["..."],
      "cis_references": ["..."]
    }}

  ],

  "remediation_plan": [

    {{
      "day": 1,
      "priority": "High",
      "category": "access_control",
      "action": "...",
      "nist_function": "Protect",
      "nist_category": "PR.AA",
      "cis_control": "CIS 5",
      "effort_estimate": "4-8 hours"
    }}

  ]
}}

Only include remediation actions that are supported
by weaknesses in the assessment evidence.
"""

    result = call_groq_json(

        system_prompt,

        user_prompt,

        temperature=0.1,

        max_tokens=3500
    )

    if not result:

        return fallback_scorecard(
            vertical_key,
            pairs
        )

    try:

        raw_categories = result.get(
            "sub_categories",
            []
        )

        category_map = {}

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

            clean_findings = [

                str(value)

                for value in findings[:3]

                if str(value).strip()
            ]

            if not clean_findings:

                clean_findings = [
                    "Evidence for this domain was limited."
                ]

            category_map[
                category
            ] = {

                "category":
                    category,

                "score":
                    score,

                "grade":
                    grade_for_score(
                        score
                    ),

                "findings":
                    clean_findings,

                "nist_references":
                    item.get(
                        "nist_references",
                        CATEGORY_INFO[
                            category
                        ][
                            "nist_references"
                        ]
                    ),

                "cis_references":
                    item.get(
                        "cis_references",
                        CATEGORY_INFO[
                            category
                        ][
                            "cis_references"
                        ]
                    ),
            }

        for category in categories:

            if category in category_map:
                continue

            score = fallback_domain_score(
                pairs,
                category
            )

            category_map[
                category
            ] = {

                "category":
                    category,

                "score":
                    score,

                "grade":
                    grade_for_score(
                        score
                    ),

                "findings": [
                    "Evidence for this domain was limited."
                ],

                "nist_references":
                    CATEGORY_INFO[
                        category
                    ][
                        "nist_references"
                    ],

                "cis_references":
                    CATEGORY_INFO[
                        category
                    ][
                        "cis_references"
                    ],
            }

        sub_categories = [

            category_map[
                category
            ]

            for category in categories
        ]

        overall_score = clamp_score(

            sum(
                item["score"]
                for item in sub_categories
            )
            /
            len(sub_categories)
        )

        raw_plan = result.get(
            "remediation_plan",
            []
        )

        remediation_plan = []

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

                try:

                    day = int(
                        item.get(
                            "day",
                            (index + 1) * 7
                        )
                    )

                except (
                    TypeError,
                    ValueError
                ):

                    day = (
                        index + 1
                    ) * 7

                remediation_plan.append({

                    "day":
                        max(
                            1,
                            day
                        ),

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
                                "Protect"
                            )
                        ),

                    "nist_category":
                        str(
                            item.get(
                                "nist_category",
                                CATEGORY_INFO[
                                    category
                                ][
                                    "nist_references"
                                ][0]
                            )
                        ),

                    "cis_control":
                        str(
                            item.get(
                                "cis_control",
                                CATEGORY_INFO[
                                    category
                                ][
                                    "cis_references"
                                ][0]
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
                grade_for_score(
                    overall_score
                ),

            "overall_score":
                overall_score,

            "sub_categories":
                sub_categories,

            "remediation_plan":
                remediation_plan,

            "vertical":
                vertical_key,

            "interview_complete":
                True,

            "next_question":
                None,
        }

    except Exception:

        return fallback_scorecard(
            vertical_key,
            pairs
        )


# ============================================================
# QUESTION COUNTS
# ============================================================

def count_question_types(
    pairs: List[dict]
) -> tuple[int, int]:

    core_count = 0
    adaptive_count = 0

    for pair in pairs:

        meta = (
            pair.get(
                "question_meta"
            )
            or {}
        )

        if meta.get(
            "adaptive"
        ):

            adaptive_count += 1

        else:

            core_count += 1

    return (
        core_count,
        adaptive_count
    )


# ============================================================
# FASTAPI APP
# ============================================================

app = FastAPI(

    title="CyberCISO API",

    version="2.0.0"
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
# HEALTH ROUTES
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
# CHAT / ADAPTIVE ASSESSMENT
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
    # Reconstruct the complete assessment including the
    # current answer.
    # --------------------------------------------------------

    pairs = extract_question_answer_pairs(

        req.conversation_history,

        req.message,

        vertical_key
    )

    # --------------------------------------------------------
    # Questions already asked.
    # --------------------------------------------------------

    asked = get_asked_question_texts(

        req.conversation_history,

        vertical_key
    )

    # --------------------------------------------------------
    # Count core and adaptive questions.
    # --------------------------------------------------------

    core_count, adaptive_count = (
        count_question_types(
            pairs
        )
    )

    # --------------------------------------------------------
    # MAXIMUM REACHED
    # --------------------------------------------------------

    if (
        core_count >= MIN_CORE_QUESTIONS
        and
        adaptive_count >= MAX_ADAPTIVE_QUESTIONS
    ):

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
    # CORE QUESTIONS COMPLETE
    #
    # Let Groq decide whether the company has an unresolved
    # weakness worth investigating further.
    # --------------------------------------------------------

    if core_count >= MIN_CORE_QUESTIONS:

        adaptive_candidates = [

            item

            for item in ADAPTIVE_QUESTIONS.get(
                vertical_key,
                ADAPTIVE_QUESTIONS["retail"]
            )

            if normalize(
                item["text"]
            ) not in asked
        ]

        # No follow-up questions remain.
        if not adaptive_candidates:

            scorecard = build_scorecard(

                vertical_key,

                pairs
            )

            return ChatResponse(

                response="",

                scorecard=scorecard,

                interview_complete=True
            )

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
You are the final adaptive checkpoint for CyberCISO.

Decide whether the assessment has an important unresolved
cybersecurity weakness that deserves one more follow-up.

Return JSON only.

If more investigation is useful:

{
  "ask_followup": true,
  "question_id": "candidate id",
  "question": "exact candidate question"
}

If the evidence is sufficient:

{
  "ask_followup": false,
  "question_id": "",
  "question": ""
}

Never invent a question.
Only select from the candidate list.
"""

        user_prompt = f"""
Business vertical:
{vertical_key}

Assessment transcript:

{transcript}

Remaining adaptive questions:

{candidate_text}
"""

        decision = call_groq_json(

            system_prompt,

            user_prompt,

            temperature=0.1,

            max_tokens=500
        )

        if decision:

            ask_followup = (
                decision.get(
                    "ask_followup",
                    False
                )
                is True
            )

            if ask_followup:

                selected_id = str(
                    decision.get(
                        "question_id",
                        ""
                    )
                ).strip()

                selected_question = str(
                    decision.get(
                        "question",
                        ""
                    )
                ).strip()

                for item in adaptive_candidates:

                    if (
                        item["id"]
                        ==
                        selected_id
                    ):

                        return ChatResponse(

                            response:
                                item["text"],

                            interview_complete:
                                False
                        )

                    if (
                        normalize(
                            item["text"]
                        )
                        ==
                        normalize(
                            selected_question
                        )
                    ):

                        return ChatResponse(

                            response:
                                item["text"],

                            interview_complete:
                                False
                        )

        # No more useful follow-up.
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
    # CORE QUESTIONS STILL REMAIN.
    #
    # The adaptive engine chooses the next question.
    # --------------------------------------------------------

    next_question = choose_next_question(

        vertical_key,

        pairs,

        asked,

        adaptive_count
    )

    # --------------------------------------------------------
    # SAFETY FALLBACK
    # --------------------------------------------------------

    if next_question is None:

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
    # RETURN THE NEXT QUESTION
    # --------------------------------------------------------

    return ChatResponse(

        response:
            next_question["text"],

        interview_complete:
            False
    )
