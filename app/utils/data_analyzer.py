import pandas as pd
from app.utils.llm import get_llm

_dataframe = None

import pandas as pd

_dataframe = None


def load_csv(file_path: str):
    df = pd.read_csv(file_path)
    set_dataframe(df)
    return df


def get_dataframe_summary(df: pd.DataFrame):
    return f"Rows: {df.shape[0]}, Columns: {df.shape[1]}"
def set_dataframe(df):
    global _dataframe
    _dataframe = df


def get_dataframe():
    return _dataframe


# ─────────────────────────────────────────────
# 🧠 QUERY UNDERSTANDING
# ─────────────────────────────────────────────

def parse_query(query: str, df: pd.DataFrame):
    q = query.lower()

    columns = df.columns.tolist()

    detected_cols = [c for c in columns if c.lower() in q]

    return {
        "columns": detected_cols,
        "intent": detect_intent(q)
    }


def detect_intent(q):
    if any(k in q for k in ["average", "mean"]):
        return "mean"
    if any(k in q for k in ["sum", "total"]):
        return "sum"
    if any(k in q for k in ["count", "how many"]):
        return "count"
    if any(k in q for k in ["trend", "over time"]):
        return "trend"
    if any(k in q for k in ["distribution", "spread"]):
        return "distribution"
    return "general"


# ─────────────────────────────────────────────
# 📊 CHART ENGINE
# ─────────────────────────────────────────────

def smart_chart(df, parsed):
    cols = parsed["columns"]

    if not cols:
        return None

    col = cols[0]

    # categorical
    if df[col].dtype == "object":
        data = df[col].value_counts().head(6)

        return {
            "type": "bar",
            "labels": data.index.tolist(),
            "values": data.values.tolist(),
            "title": f"{col} Distribution"
        }

    # numeric
    if parsed["intent"] == "trend":
        return {
            "type": "line",
            "labels": list(range(len(df))),
            "values": df[col].tolist(),
            "title": f"{col} Trend"
        }

    return None


# ─────────────────────────────────────────────
# 📊 DATA ENGINE
# ─────────────────────────────────────────────

def compute_result(df, parsed):
    cols = parsed["columns"]

    if not cols:
        return "No matching columns found"

    col = cols[0]

    if parsed["intent"] == "mean":
        return df[col].mean()

    if parsed["intent"] == "sum":
        return df[col].sum()

    if parsed["intent"] == "count":
        return df[col].count()

    return "Analysis complete"


# ─────────────────────────────────────────────
# 🤖 INSIGHT ENGINE
# ─────────────────────────────────────────────

def generate_insight(query, result):
    llm = get_llm()

    prompt = f"""
    User asked: {query}
    Result: {result}

    Explain insight clearly in business terms.
    Suggest one follow-up question.
    """

    return llm.invoke(prompt).content


# ─────────────────────────────────────────────
# 🚀 MAIN ENTRY
# ─────────────────────────────────────────────

def analyze_data(query, df=None):
    if df is None:
        df = _dataframe

    if df is None:
        return {"answer": "No dataset loaded"}

    parsed = parse_query(query, df)

    result = compute_result(df, parsed)

    chart = smart_chart(df, parsed)

    insight = generate_insight(query, result)

    return {
        "answer": insight,
        "result": str(result),
        "chart": chart,
        "suggestions": [
            "Show trend over time",
            "Compare categories",
            "Find top performers"
        ]
    }