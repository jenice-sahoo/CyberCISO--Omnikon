import pytest
from app.core.token_counter import count_tokens, count_message_tokens, count_chat_request_tokens
from app.models.schemas import ChatMessage


def test_count_tokens():
    text = "Hello, world!"
    count = count_tokens(text)
    assert count > 0
    assert isinstance(count, int)


def test_count_message_tokens():
    messages = [
        ChatMessage(role="user", content="Hello"),
        ChatMessage(role="assistant", content="Hi there!"),
    ]
    count = count_message_tokens(messages)
    assert count > 0


def test_count_chat_request_tokens():
    system_prompt = "You are a helpful assistant."
    conversation_history = [
        ChatMessage(role="user", content="Hello"),
        ChatMessage(role="assistant", content="Hi there!"),
    ]
    user_message = "How are you?"

    count = count_chat_request_tokens(system_prompt, conversation_history, user_message)
    assert count > 0