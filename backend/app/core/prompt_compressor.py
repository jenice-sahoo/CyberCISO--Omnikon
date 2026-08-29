from typing import List, Optional, Any
from app.models.schemas import ChatMessage
from app.core.config import get_settings
import logging

logger = logging.getLogger(__name__)

_compressor: Optional[Any] = None


def get_compressor() -> Any:
    global _compressor
    if _compressor is None:
        try:
            from llmlingua import PromptCompressor
            _compressor = PromptCompressor()
        except Exception as e:
            logger.warning(f"PromptCompressor unavailable, compression disabled: {e}")
            _compressor = None
            raise
    if _compressor is None:
        raise RuntimeError("PromptCompressor not available")
    return _compressor


def compress_prompt(
    system_prompt: str,
    conversation_history: List[ChatMessage],
    user_message: str,
    target_budget: Optional[int] = None
) -> str:
    settings = get_settings()
    budget = target_budget or settings.target_token_budget

    messages = [
        {"role": "system", "content": system_prompt},
        *[{"role": msg.role, "content": msg.content} for msg in conversation_history],
        {"role": "user", "content": user_message}
    ]

    try:
        compressed = get_compressor().compress_prompt(
            messages,
            rate=0.5,
            target_token=budget,
            use_sentence_level_filter=True
        )
        compressed_messages = compressed.get("compressed_prompt", messages)
        return "\n\n".join([f"{m['role']}: {m['content']}" for m in compressed_messages])
    except Exception as e:
        logger.warning(f"Compression failed, falling back to truncated prompt: {e}")
        # Fallback: simple truncation - join last N messages to fit budget roughly (4 chars ~ 1 token)
        approx_chars = budget * 4
        full = "\n\n".join([f"{m['role']}: {m['content']}" for m in messages])
        if len(full) > approx_chars:
            return full[-approx_chars:]
        return full
