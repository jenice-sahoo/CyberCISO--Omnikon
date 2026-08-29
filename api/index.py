from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field
from typing import List, Optional, Literal
from enum import Enum

# Standalone - no backend import, so Vercel lambda never fails on missing backend/**

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

def mock_scorecard(vertical: Vertical):
    return {
        "overall_grade": "C",
        "overall_score": 72,
        "sub_categories": [
            {"category": "access_control", "score": 70, "grade": "C", "findings": ["MFA not enforced on all admin accounts"], "nist_references": ["PR.AC-1"], "cis_references": ["CIS 5.2"]},
            {"category": "data_backup", "score": 75, "grade": "C", "findings": ["Backups not tested quarterly"], "nist_references": ["PR.IP-4"], "cis_references": ["CIS 11.2"]},
            {"category": "network_security", "score": 65, "grade": "D", "findings": ["Guest Wi-Fi not segmented"], "nist_references": ["PR.AC-5"], "cis_references": ["CIS 12.1"]},
            {"category": "email_phishing", "score": 80, "grade": "B", "findings": ["No phishing simulation"], "nist_references": ["PR.AT-1"], "cis_references": ["CIS 14.1"]},
            {"category": "incident_response", "score": 70, "grade": "C", "findings": ["No tabletop exercises"], "nist_references": ["RS.RP-1"], "cis_references": ["CIS 17.1"]},
        ],
        "remediation_plan": [
            {"day": 1, "priority": "Critical", "category": "access_control", "action": "Enable MFA on all admin accounts", "nist_function": "Protect", "nist_category": "PR.AC", "cis_control": "CIS 5.2", "effort_estimate": "2-4 hours"},
            {"day": 3, "priority": "Critical", "category": "network_security", "action": "Segment guest Wi-Fi", "nist_function": "Protect", "nist_category": "PR.AC", "cis_control": "CIS 12.1", "effort_estimate": "4-8 hours"},
            {"day": 7, "priority": "High", "category": "data_backup", "action": "Configure offsite backup + test restore", "nist_function": "Recover", "nist_category": "RC.RP", "cis_control": "CIS 11.3", "effort_estimate": "1-2 days"},
            {"day": 14, "priority": "High", "category": "email_phishing", "action": "Run phishing simulation", "nist_function": "Protect", "nist_category": "PR.AT", "cis_control": "CIS 14.1", "effort_estimate": "4-6 hours"},
            {"day": 21, "priority": "Medium", "category": "incident_response", "action": "Document incident response plan", "nist_function": "Respond", "nist_category": "RS.RP", "cis_control": "CIS 17.1", "effort_estimate": "1-2 days"},
            {"day": 30, "priority": "Medium", "category": "incident_response", "action": "Tabletop exercise", "nist_function": "Respond", "nist_category": "RS.RP", "cis_control": "CIS 17.2", "effort_estimate": "2-3 hours"},
        ],
        "vertical": vertical.value if hasattr(vertical, 'value') else vertical,
        "interview_complete": True,
        "next_question": None
    }

app = FastAPI(title="CyberCISO API", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/")
async def root():
    return {"message": "CyberCISO API", "version": "1.0.0"}

@app.get("/api/index")
async def api_index():
    return {"status": "healthy", "service": "cyberciso-backend"}

@app.get("/api/v1/health")
@app.get("/health")
async def health():
    return {"status": "healthy", "service": "cyberciso-backend"}

@app.post("/api/index", response_model=ChatResponse)
@app.post("/api/v1/chat", response_model=ChatResponse)
@app.post("/v1/chat", response_model=ChatResponse)
async def chat(req: ChatRequest):
    vertical = req.vertical or Vertical.RETAIL
    # count user turns in history + current
    user_turns = sum(1 for m in req.conversation_history if m.role == "user") + 1
    if req.conversation_history and "I want an assessment for" in req.conversation_history[0].content:
        user_turns -= 1

    MAX_TURNS = 6
    if user_turns >= MAX_TURNS:
        return ChatResponse(response="", scorecard=mock_scorecard(vertical), interview_complete=True)

    # optional Groq call - if key present try, else mock; never crash
    groq_key = None
    try:
        import os
        groq_key = os.getenv("GROQ_API_KEY")
        if not groq_key:
            from dotenv import load_dotenv
            load_dotenv()
            groq_key = os.getenv("GROQ_API_KEY")
    except: pass

    if groq_key and groq_key != "your_groq_api_key_here":
        try:
            from groq import AsyncGroq
            client = AsyncGroq(
                api_key=groq_key,
                timeout=5.0,
                max_retries=0
            )            
            # Explicit system prompt that forbids CoT leakage
            system_prompt = (
                f"You are a Virtual CISO for a {vertical.value} small business. "
                f"Ask exactly ONE short, simple cybersecurity question per turn. "
                f"Use the previous conversation to choose the most relevant next question. "
                f"NEVER repeat a question that has already been asked. "
                f"Do not ask the same question using slightly different wording. "
                f"Cover a different cybersecurity area when possible. "
                f"Do not explain your reasoning. "
                f"Do not output XML tags, <think>, <thinking>, or chain-of-thought. "
                f"Output only the question."
            )
            msgs = [{"role": "system", "content": system_prompt}]
            for m in req.conversation_history:
                msgs.append({"role": m.role, "content": m.content})
            msgs.append({"role": "user", "content": req.message})
            want_json = False

            model_name = os.getenv("GROQ_MODEL", "llama-3.1-8b-instant")

            kwargs = {
                "model": model_name,
                "messages": msgs,
                "max_tokens": 128,
                "temperature": 0.2
            }

            if model_name.startswith("qwen/"):
                kwargs["reasoning_format"] = "hidden"

            res = await client.chat.completions.create(**kwargs)
            content = (res.choices[0].message.content or "").strip()

            # Prevent the AI from repeating an already-asked question
            previous_questions = [
                m.content.strip()
                for m in req.conversation_history
                if m.role == "assistant"
            ]

            previous_questions_lower = {q.lower() for q in previous_questions}
            # Robustly strip reasoning / CoT blocks from various models (Groq Llama, Gemma, Qwen, DeepSeek)
            # Covers: <think>...</think>, <thinking>...</thinking>, <thought>...</thought>, "thinking"/"response" delimiters
            import re
            # 1) Remove paired XML-like thinking blocks (case-insensitive, dotall)
            content = re.sub(r"<think>.*?</think>\s*", "", content, flags=re.DOTALL | re.IGNORECASE)
            content = re.sub(r"<thinking>.*?</thinking>\s*", "", content, flags=re.DOTALL | re.IGNORECASE)
            content = re.sub(r"<thought>.*?</thought>\s*", "", content, flags=re.DOTALL | re.IGNORECASE)
            # 2) Remove any stray opening/closing tags that survived (unpaired or malformed)
            content = re.sub(r"</?think[^>]*>", "", content, flags=re.IGNORECASE)
            content = re.sub(r"</?thinking[^>]*>", "", content, flags=re.IGNORECASE)
            content = re.sub(r"</?thought[^>]*>", "", content, flags=re.IGNORECASE)
            content = re.sub(r"</?answer[^>]*>", "", content, flags=re.IGNORECASE)
            # 3) Gemma-style "thinking ... response" delimiter: drop everything up to last standalone "response" line
            _frac = content.split("\n")
            _last = 0
            for _n, _ln in enumerate(_frac):
                _t = _ln.strip().lower()
                if _t == "response" or _t == "</thinking>" or _t == "<answer>" or _t.startswith("<answer>"):
                    _last = _n + 1
            if _last:
                content = "\n".join(_frac[_last:]).strip()
            content = content.strip()
            # Check for duplicate question after cleaning
            if content.lower() in previous_questions_lower:
                retry_msgs = msgs + [{
                    "role": "system",
                    "content": (
                        "You already asked this question. "
                        "Generate a completely different cybersecurity question. "
                        "Do not repeat or rephrase any previous question. "
                        "Output ONLY one short question."
                    )
                }]

                retry_kwargs = {
                    "model": model_name,
                    "messages": retry_msgs,
                    "max_tokens": 128,
                    "temperature": 0.4
                }

                if model_name.startswith("qwen/"):
                    retry_kwargs["reasoning_format"] = "hidden"

                retry_res = await client.chat.completions.create(**retry_kwargs)
                content = (retry_res.choices[0].message.content or "").strip()
            # try scorecard parse
            import json
            raw = content
            if raw.startswith("```"):
                raw = re.sub(r"^```(?:json)?\s*", "", raw)
                raw = re.sub(r"\s*```$", "", raw)
            if raw.startswith("{"):
                try:
                    data = json.loads(raw)
                    if "overall_grade" in data:
                        return ChatResponse(response="", scorecard=data, interview_complete=True)
                except: pass
            return ChatResponse(response=content, interview_complete=False)
        except Exception as e:
            # fall through to mock
            print(f"Groq failed, using mock: {e}")

    # Mock flow - no Groq or Groq failed
    v = vertical.value
    qs = MOCK_QUESTIONS.get(v, MOCK_QUESTIONS["retail"])
    # If all mock questions have been answered, finish the assessment
    if user_turns >= len(qs):
    return ChatResponse(
            response="",
            scorecard=mock_scorecard(vertical),
            interview_complete=True
        )

    # Ask the next question
    idx = user_turns
    return ChatResponse(
        response=qs[idx],
        interview_complete=False
    )
