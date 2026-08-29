import tiktoken
from typing import List
from app.models.schemas import ChatMessage


def get_encoding(model: str = "gpt-4o-mini") -> tiktoken.Encoding:
    try:
        return tiktoken.encoding_for_model(model)
    except KeyError:
        return tiktoken.get_encoding("cl100k_base")


def count_tokens(text: str, model: str = "gpt-4o-mini") -> int:
    encoding = get_encoding(model)
    return len(encoding.encode(text))


def count_message_tokens(messages: List[ChatMessage], model: str = "gpt-4o-mini") -> int:
    encoding = get_encoding(model)
    total = 0
    for msg in messages:
        total += 4
        total += len(encoding.encode(msg.role))
        total += len(encoding.encode(msg.content))
    total += 2
    return total


def count_chat_request_tokens(
    system_prompt: str,
    conversation_history: List[ChatMessage],
    user_message: str,
    model: str = "gpt-4o-mini"
) -> int:
    total = count_tokens(system_prompt, model)
    total += count_message_tokens(conversation_history, model)
    total += count_tokens(user_message, model)
    return total