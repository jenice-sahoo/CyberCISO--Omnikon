import json
import httpx
from groq import AsyncGroq
from groq import RateLimitError, APITimeoutError, APIError
from typing import List, Optional, Dict, Any
from tenacity import retry, stop_after_attempt, wait_exponential, retry_if_exception_type
from app.models.schemas import ChatMessage, ScorecardResponse, Vertical
from app.core.config import get_settings


class MockGroqClient:
    def __init__(self):
        self.mock_responses = {
            "initial": "Welcome! I'm your Virtual CISO. To get started, please tell me which vertical best describes your business: retail, healthcare clinic, or professional services?",
            "retail_q1": "Thanks for choosing retail. How many employees access your point-of-sale systems and inventory databases?",
            "retail_q2": "Do you use multi-factor authentication (MFA) for all remote access and administrative accounts?",
            "retail_q3": "How frequently do you back up critical business data (customer records, financials, inventory)?",
            "retail_q4": "Do you have a guest Wi-Fi network separated from your payment processing network?",
            "retail_q5": "Have you conducted phishing awareness training for employees in the last 12 months?",
            "retail_q6": "Do you have an incident response plan for a data breach or ransomware attack?",
            "healthcare_q1": "Thanks for choosing healthcare clinic. How many staff members access electronic health records (EHR) systems?",
            "healthcare_q2": "Is access to patient data restricted by role (e.g., front desk vs. clinicians vs. billing)?",
            "healthcare_q3": "Are EHR backups encrypted and tested for restoration at least quarterly?",
            "healthcare_q4": "Do you have a business associate agreement (BAA) with all vendors who access PHI?",
            "healthcare_q5": "How do you secure medical devices connected to your network (e.g., IoT monitors, imaging equipment)?",
            "healthcare_q6": "Do you have a HIPAA breach notification procedure documented and tested?",
            "professional_q1": "Thanks for choosing professional services. How many team members access client confidential data?",
            "professional_q2": "Do you enforce MFA on all cloud services (Microsoft 365, Google Workspace, CRM, file sharing)?",
            "professional_q3": "Are client deliverables and intellectual property backed up with version control and offsite replication?",
            "professional_q4": "Do you use email encryption or secure file transfer for sending sensitive client documents?",
            "professional_q5": "Have you simulated a phishing attack against your staff in the last year?",
            "professional_q6": "Do you have a written incident response plan for client data exposure?",
        }

    async def chat_completion(
        self,
        messages: List[Dict[str, str]],
        model: str,
        max_tokens: int,
        temperature: float,
        response_format: Optional[Dict[str, Any]] = None
    ) -> Dict[str, Any]:
        last_user_msg = ""
        for msg in reversed(messages):
            if msg["role"] == "user":
                last_user_msg = msg["content"].lower()
                break

        vertical = None
        for v in Vertical:
            if v.value in last_user_msg:
                vertical = v
                break

        if "vertical" in last_user_msg or "retail" in last_user_msg or "healthcare" in last_user_msg or "professional" in last_user_msg:
            if vertical:
                key = f"{vertical.value}_q1"
            else:
                key = "initial"
        elif "employee" in last_user_msg or "staff" in last_user_msg or "team member" in last_user_msg:
            if vertical == Vertical.RETAIL:
                key = "retail_q2"
            elif vertical == Vertical.HEALTHCARE_CLINIC:
                key = "healthcare_q2"
            else:
                key = "professional_q2"
        elif "mfa" in last_user_msg or "multi-factor" in last_user_msg or "authentication" in last_user_msg:
            if vertical == Vertical.RETAIL:
                key = "retail_q3"
            elif vertical == Vertical.HEALTHCARE_CLINIC:
                key = "healthcare_q3"
            else:
                key = "professional_q3"
        elif "backup" in last_user_msg or "back up" in last_user_msg:
            if vertical == Vertical.RETAIL:
                key = "retail_q4"
            elif vertical == Vertical.HEALTHCARE_CLINIC:
                key = "healthcare_q4"
            else:
                key = "professional_q4"
        elif "wi-fi" in last_user_msg or "wifi" in last_user_msg or "network" in last_user_msg or "device" in last_user_msg:
            if vertical == Vertical.RETAIL:
                key = "retail_q5"
            elif vertical == Vertical.HEALTHCARE_CLINIC:
                key = "healthcare_q5"
            else:
                key = "professional_q5"
        elif "phishing" in last_user_msg or "training" in last_user_msg or "simulated" in last_user_msg:
            if vertical == Vertical.RETAIL:
                key = "retail_q6"
            elif vertical == Vertical.HEALTHCARE_CLINIC:
                key = "healthcare_q6"
            else:
                key = "professional_q6"
        elif "incident" in last_user_msg or "breach" in last_user_msg or "ransomware" in last_user_msg or "response plan" in last_user_msg or "procedure" in last_user_msg:
            key = "final"
        else:
            key = "initial"

        if key == "final" or key not in self.mock_responses:
            return self._generate_mock_scorecard(vertical or Vertical.RETAIL)

        return {
            "choices": [{
                "message": {
                    "role": "assistant",
                    "content": self.mock_responses[key]
                }
            }]
        }

    def _generate_mock_scorecard(self, vertical: Vertical) -> Dict[str, Any]:
        scorecard = ScorecardResponse(
            overall_grade="C",
            overall_score=72,
            sub_categories=[
                {
                    "category": "access_control",
                    "score": 70,
                    "grade": "C",
                    "findings": ["MFA not enforced on all admin accounts", "Shared credentials detected for POS/EHR access"],
                    "nist_references": ["PR.AC-1", "PR.AC-7"],
                    "cis_references": ["CIS 5.2", "CIS 6.3"]
                },
                {
                    "category": "data_backup",
                    "score": 75,
                    "grade": "C",
                    "findings": ["Backups occur daily but restoration not tested quarterly", "No offsite/immutable backup copy"],
                    "nist_references": ["PR.IP-4", "RC.RP-1"],
                    "cis_references": ["CIS 11.2", "CIS 11.3"]
                },
                {
                    "category": "network_security",
                    "score": 65,
                    "grade": "D",
                    "findings": ["Guest Wi-Fi not segmented from payment/patient data network", "No network monitoring/IDS in place"],
                    "nist_references": ["PR.AC-5", "DE.CM-1"],
                    "cis_references": ["CIS 12.1", "CIS 13.1"]
                },
                {
                    "category": "email_phishing",
                    "score": 80,
                    "grade": "B",
                    "findings": ["Basic spam filtering in place", "No phishing simulation program"],
                    "nist_references": ["PR.AT-1", "DE.CM-4"],
                    "cis_references": ["CIS 14.1", "CIS 9.1"]
                },
                {
                    "category": "incident_response",
                    "score": 70,
                    "grade": "C",
                    "findings": ["Informal response process only", "No tabletop exercises conducted"],
                    "nist_references": ["RS.RP-1", "RS.CO-2"],
                    "cis_references": ["CIS 17.1", "CIS 17.2"]
                }
            ],
            remediation_plan=[
                {
                    "day": 1,
                    "priority": "Critical",
                    "category": "access_control",
                    "action": "Enable MFA on all administrative accounts and remote access VPN",
                    "nist_function": "Protect",
                    "nist_category": "PR.AC: Identity Management, Authentication and Access Control",
                    "cis_control": "CIS 5.2: Use Multi-Factor Authentication",
                    "effort_estimate": "2-4 hours"
                },
                {
                    "day": 3,
                    "priority": "Critical",
                    "category": "network_security",
                    "action": "Segment guest Wi-Fi from business-critical networks (payment/patient data)",
                    "nist_function": "Protect",
                    "nist_category": "PR.AC: Identity Management, Authentication and Access Control",
                    "cis_control": "CIS 12.1: Network Segmentation",
                    "effort_estimate": "4-8 hours"
                },
                {
                    "day": 7,
                    "priority": "High",
                    "category": "data_backup",
                    "action": "Configure immutable offsite backup copy; schedule quarterly restoration tests",
                    "nist_function": "Recover",
                    "nist_category": "RC.RP: Recovery Planning",
                    "cis_control": "CIS 11.3: Test Data Recovery",
                    "effort_estimate": "1-2 days"
                },
                {
                    "day": 14,
                    "priority": "High",
                    "category": "email_phishing",
                    "action": "Deploy phishing simulation platform; run first campaign with all staff",
                    "nist_function": "Protect",
                    "nist_category": "PR.AT: Awareness and Training",
                    "cis_control": "CIS 14.1: Security Awareness Training",
                    "effort_estimate": "4-6 hours"
                },
                {
                    "day": 21,
                    "priority": "Medium",
                    "category": "incident_response",
                    "action": "Document formal incident response plan with roles, communication tree, and escalation paths",
                    "nist_function": "Respond",
                    "nist_category": "RS.RP: Response Planning",
                    "cis_control": "CIS 17.1: Incident Response Plan",
                    "effort_estimate": "1-2 days"
                },
                {
                    "day": 30,
                    "priority": "Medium",
                    "category": "incident_response",
                    "action": "Conduct tabletop exercise simulating ransomware/data breach scenario",
                    "nist_function": "Respond",
                    "nist_category": "RS.RP: Response Planning",
                    "cis_control": "CIS 17.2: Incident Response Training",
                    "effort_estimate": "2-3 hours"
                }
            ],
            vertical=vertical,
            interview_complete=True,
            next_question=None
        )
        return {"choices": [{"message": {"role": "assistant", "content": scorecard.model_dump_json()}}]}


class GroqClient:
    def __init__(self):
        self.settings = get_settings()
        self.use_mock = not self.settings.groq_api_key or self.settings.groq_api_key == "your_groq_api_key_here"
        if not self.use_mock:
            self.client = AsyncGroq(api_key=self.settings.groq_api_key)
        self.mock_client = MockGroqClient()

    @retry(
        wait=wait_exponential(multiplier=1, min=2, max=10),
        stop=stop_after_attempt(3),
        retry=retry_if_exception_type((RateLimitError, APITimeoutError, httpx.TimeoutException))
    )
    async def chat_completion(
        self,
        messages: List[Dict[str, str]],
        model: Optional[str] = None,
        max_tokens: Optional[int] = None,
        temperature: float = 0.3,
        response_format: Optional[Dict[str, Any]] = None
    ) -> Dict[str, Any]:
        if self.use_mock:
            return await self.mock_client.chat_completion(
                messages, model or self.settings.groq_model,
                max_tokens or self.settings.groq_max_tokens,
                temperature, response_format
            )

        try:
            kwargs = {
                "model": model or self.settings.groq_model,
                "messages": messages,
                "max_tokens": max_tokens or self.settings.groq_max_tokens,
                "temperature": temperature,
            }
            if response_format:
                kwargs["response_format"] = response_format

            response = await self.client.chat.completions.create(**kwargs)
            return {
                "choices": [{
                    "message": {
                        "role": response.choices[0].message.role,
                        "content": response.choices[0].message.content
                    }
                }]
            }
        except RateLimitError:
            raise
        except APITimeoutError:
            raise
        except APIError as e:
            raise Exception(f"Groq API error: {str(e)}")
        except httpx.TimeoutException:
            raise
        except Exception as e:
            raise Exception(f"Unexpected error calling Groq: {str(e)}")


_groq_client: Optional[GroqClient] = None


def get_groq_client() -> GroqClient:
    global _groq_client
    if _groq_client is None:
        _groq_client = GroqClient()
    return _groq_client