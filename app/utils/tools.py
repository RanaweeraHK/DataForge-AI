"""
Tool definitions for the multi-agent system.
Each tool is a plain callable that agents can invoke.
"""
import math
import re
from app.rag.rag_pipeline import get_vectorstore, query_rag
from app.utils.data_analyzer import get_dataframe, analyze_data


# ── RAG Tool ──────────────────────────────────────────────────────────────────

def rag_search(query: str) -> str:
    """Search the uploaded document and return a grounded answer."""
    vs = get_vectorstore()
    if vs is None:
        return "No document has been uploaded yet. Please upload a PDF first."
    return query_rag(vs, query)


# ── Data Analytics Tool ───────────────────────────────────────────────────────

def data_query(query: str) -> str:
    """Answer a question about the loaded CSV dataset."""
    df = get_dataframe()
    if df is None:
        return "No dataset has been loaded yet. Please upload a CSV first."
    result = analyze_data(query, df)
    return result["answer"]


# ── Calculator Tool ───────────────────────────────────────────────────────────

_SAFE_NAMES = {
    k: v for k, v in vars(math).items() if not k.startswith("_")
}
_SAFE_NAMES.update({"abs": abs, "round": round, "min": min, "max": max, "sum": sum})


def calculator(expression: str) -> str:
    """
    Safely evaluate a mathematical expression.
    Supports standard math functions (sin, cos, sqrt, log, etc.).
    """
    # Strip markdown fences if present
    expression = re.sub(r"```.*?```", "", expression, flags=re.DOTALL).strip()
    try:
        result = eval(expression, {"__builtins__": {}}, _SAFE_NAMES)  # noqa: S307
        return str(result)
    except Exception as e:
        return f"Calculator error: {e}"


# ── Tool registry ─────────────────────────────────────────────────────────────

TOOLS = {
    "rag_search": {
        "fn": rag_search,
        "description": "Search the uploaded PDF document for information.",
    },
    "data_query": {
        "fn": data_query,
        "description": "Analyze the loaded CSV dataset and answer data questions.",
    },
    "calculator": {
        "fn": calculator,
        "description": "Evaluate a mathematical expression and return the result.",
    },
}


def run_tool(name: str, input_text: str) -> str:
    """Dispatch a tool call by name."""
    if name not in TOOLS:
        return f"Unknown tool '{name}'. Available tools: {list(TOOLS.keys())}"
    return TOOLS[name]["fn"](input_text)

