from collections import defaultdict
from langchain_core.messages import HumanMessage, AIMessage, SystemMessage
from app.utils.llm import get_llm

# In-memory chat history: session_id -> list of messages
_chat_histories: dict[str, list] = defaultdict(list)

SYSTEM_PROMPT = (
    "You are an expert AI Data Analyst assistant. "
    "You help users analyze data, answer questions about documents, "
    "and provide clear, concise insights."
)


def chat_with_llm(user_input: str) -> str:
    """Simple stateless chat."""
    llm = get_llm()
    response = llm.invoke(user_input)
    return response.content


def chat_with_history(user_input: str, session_id: str = "default") -> str:
    """Context-aware chat with per-session memory."""
    llm = get_llm()
    history = _chat_histories[session_id]

    if not history:
        history.append(SystemMessage(content=SYSTEM_PROMPT))

    history.append(HumanMessage(content=user_input))
    response = llm.invoke(history)
    history.append(AIMessage(content=response.content))

    # Keep last 20 messages (+ system) to avoid context overflow
    if len(history) > 21:
        _chat_histories[session_id] = [history[0]] + history[-20:]

    return response.content


def clear_history(session_id: str = "default") -> None:
    """Clear chat history for a session."""
    _chat_histories.pop(session_id, None)


def get_history(session_id: str = "default") -> list[dict]:
    """Return chat history as list of dicts for the frontend."""
    return [
        {"role": type(m).__name__.replace("Message", "").lower(), "content": m.content}
        for m in _chat_histories.get(session_id, [])
        if not isinstance(m, SystemMessage)
    ]