from fastapi import APIRouter, HTTPException, Depends
from typing import List
from app.models.schemas import (
    ChatRequest, ChatResponse, ChatMessage, ScorecardResponse, Vertical
)
from app.core.config import get_settings
from app.core.token_counter import count_chat_request_tokens
from app.core.prompt_compressor import compress_prompt
from app.core.openai_client import get_groq_client
from app.prompts.system_prompt import get_system_prompt
import json
import re
import logging


def strip_thinking(text: str) -> str:
    # Remove <think>...</think> blocks from reasoning models (qwen3 etc.)
    text = re.sub(r"<think>.*?</think>\s*", "", text, flags=re.DOTALL)
    text = re.sub(r"<thinking>.*?</thinking>\s*", "", text, flags=re.DOTALL)
    return text.strip()

router = APIRouter()
logger = logging.getLogger(__name__)
settings = get_settings()


def get_groq_client_instance():
    return get_groq_client()


def build_messages(
    system_prompt: str,
    conversation_history: List[ChatMessage],
    user_message: str
) -> List[dict]:
    messages = [{"role": "system", "content": system_prompt}]
    for msg in conversation_history:
        messages.append({"role": msg.role, "content": msg.content})
    messages.append({"role": "user", "content": user_message})
    return messages


def try_parse_scorecard(content: str) -> ScorecardResponse | None:
    # Strip markdown fences like ```json ... ``` that reasoning models add
    raw = content.strip()
    if raw.startswith("```"):
        raw = re.sub(r"^```(?:json)?\s*", "", raw)
        raw = re.sub(r"\s*```$", "", raw)
        raw = raw.strip()
    # Also try to extract JSON object if extra text surrounds it
    if not raw.startswith("{"):
        m = re.search(r"\{.*\}", raw, flags=re.DOTALL)
        if m:
            raw = m.group(0)
    try:
        data = json.loads(raw)
        return ScorecardResponse(**data)
    except (json.JSONDecodeError, ValueError):
        return None


@router.post("/chat", response_model=ChatResponse)
async def chat(request: ChatRequest) -> ChatResponse:
    vertical = request.vertical
    system_prompt = get_system_prompt(vertical)

    # Hard internal limit: count user turns (history + current)
    user_turns = sum(1 for m in request.conversation_history if m.role == "user") + 1
    # subtract the initial "I want an assessment for X" synthetic turn if present
    if request.conversation_history and "I want an assessment for" in request.conversation_history[0].content:
        user_turns -= 1
    force_scorecard = user_turns >= settings.interview_max_turns
    if force_scorecard:
        system_prompt += "\n\n## OVERRIDE: MAX QUESTIONS REACHED — You MUST now output ONLY the JSON scorecard defined in OUTPUT REQUIREMENTS. Do NOT ask another question. Set interview_complete=true."
        logger.info(f"Force scorecard: user_turns={user_turns} >= {settings.interview_max_turns}")

    token_count = count_chat_request_tokens(
        system_prompt,
        request.conversation_history,
        request.message,
        settings.groq_model
    )

    logger.info(f"Token count: {token_count}, threshold: {settings.token_threshold}")

    if token_count > settings.token_threshold:
        logger.info("Compressing prompt...")
        compressed_prompt = compress_prompt(
            system_prompt,
            request.conversation_history,
            request.message,
            settings.target_token_budget
        )
        messages = [{"role": "user", "content": compressed_prompt}]
    else:
        messages = build_messages(system_prompt, request.conversation_history, request.message)

    try:
        groq_client = get_groq_client_instance()
        # When forcing scorecard, request JSON mode so model cannot return another question
        want_json = force_scorecard or token_count > settings.token_threshold
        response = await groq_client.chat_completion(
            messages=messages,
            model=settings.groq_model,
            max_tokens=settings.groq_max_tokens,
            temperature=0.3,
            response_format={"type": "json_object"} if want_json else None
        )
    except Exception as e:
        logger.error(f"Groq error: {str(e)}")
        raise HTTPException(status_code=503, detail=f"AI service unavailable: {str(e)}")

    assistant_content = strip_thinking(response["choices"][0]["message"]["content"] or "")

    scorecard = try_parse_scorecard(assistant_content)
    if scorecard:
        return ChatResponse(
            response="",
            scorecard=scorecard,
            interview_complete=True
        )

    # Fallback: if we forced scorecard but model still returned a question, generate mock scorecard
    if force_scorecard:
        logger.warning("Force-scorecard fallback: model returned question instead of JSON, generating mock scorecard")
        try:
            from app.core.openai_client import MockGroqClient
            mock = MockGroqClient()
            # _generate_mock_scorecard returns Groq-style dict with JSON string
            fb = mock._generate_mock_scorecard(vertical or Vertical.RETAIL)
            fb_content = strip_thinking(fb["choices"][0]["message"]["content"] or "")
            fb_scorecard = try_parse_scorecard(fb_content)
            if fb_scorecard:
                return ChatResponse(response="", scorecard=fb_scorecard, interview_complete=True)
        except Exception as fe:
            logger.error(f"Fallback mock failed: {fe}")

    return ChatResponse(
        response=assistant_content,
        scorecard=None,
        interview_complete=False
    )


@router.get("/health")
async def health_check():
    return {"status": "healthy", "service": "cyberciso-backend"}