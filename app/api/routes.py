import os
import shutil
from fastapi import APIRouter, UploadFile, File, HTTPException
from pydantic import BaseModel
from app.agents.simple_chat import chat_with_llm, chat_with_history, get_history, clear_history
from app.rag.rag_pipeline import create_vectorstore, query_rag, get_vectorstore
from app.utils.data_analyzer import load_csv, analyze_data, get_dataframe, get_dataframe_summary
from app.agents.multi_agent import run_query
from app.ml.trainer import train_model, SUPPORTED_MODELS

router = APIRouter()

# ── Chat ──────────────────────────────────────────────────────────────────────

class ChatRequest(BaseModel):
    query: str
    session_id: str = "default"

@router.post("/chat")
def chat(req: ChatRequest):
    response = chat_with_history(req.query, req.session_id)
    return {"response": response}

@router.get("/chat")
def chat_get(query: str, session_id: str = "default"):
    response = chat_with_history(query, session_id)
    return {"response": response}

# ── RAG ───────────────────────────────────────────────────────────────────────

@router.post("/upload")
async def upload(file: UploadFile = File(...)):
    os.makedirs("data", exist_ok=True)
    dest = f"data/{file.filename}"
    with open(dest, "wb") as f:
        shutil.copyfileobj(file.file, f)
    create_vectorstore(dest)
    return {"message": f"Document '{file.filename}' processed successfully"}

@router.get("/rag")
def rag(query: str):
    vs = get_vectorstore()
    if vs is None:
        raise HTTPException(status_code=400, detail="Upload a document first via POST /upload")
    response = query_rag(vs, query)
    return {"response": response}

# ── Chat History ──────────────────────────────────────────────────────────────

@router.get("/chat/history")
def chat_history(session_id: str = "default"):
    return {"history": get_history(session_id)}

@router.delete("/chat/history")
def delete_chat_history(session_id: str = "default"):
    clear_history(session_id)
    return {"message": f"History cleared for session '{session_id}'"}

# ── Data Analytics ────────────────────────────────────────────────────────────

@router.post("/upload_csv")
async def upload_csv(file: UploadFile = File(...)):
    if not file.filename.endswith(".csv"):
        raise HTTPException(status_code=400, detail="Only CSV files are supported")
    os.makedirs("data", exist_ok=True)
    dest = f"data/{file.filename}"
    with open(dest, "wb") as f:
        shutil.copyfileobj(file.file, f)
    df = load_csv(dest)
    summary = get_dataframe_summary(df)
    return {
        "message": f"CSV '{file.filename}' loaded successfully",
        "shape": {"rows": df.shape[0], "columns": df.shape[1]},
        "columns": list(df.columns),
        "summary": summary,
    }

@router.get("/analyze")
def analyze(query: str):
    df = get_dataframe()
    if df is None:
        raise HTTPException(status_code=400, detail="Upload CSV first")

    result = analyze_data(query, df)

    return result   # already supports chart

@router.get("/data/summary")
def data_summary():
    df = get_dataframe()
    if df is None:
        raise HTTPException(status_code=400, detail="No dataset loaded")
    return {
        "shape": {"rows": df.shape[0], "columns": df.shape[1]},
        "columns": list(df.columns),
        "dtypes": df.dtypes.astype(str).to_dict(),
        "summary": get_dataframe_summary(df),
    }

# ── Multi-Agent Query ─────────────────────────────────────────────────────────

class QueryRequest(BaseModel):
    query: str

@router.post("/query")
def multi_agent_query(req: QueryRequest):
    """Route the query through the multi-agent LangGraph pipeline."""
    result = run_query(req.query)
    return result

@router.get("/query")
def multi_agent_query_get(query: str):
    """GET version for easy browser/curl testing."""
    result = run_query(query)
    return result

# ── ML Training ───────────────────────────────────────────────────────────────

class TrainRequest(BaseModel):
    target_column: str
    model_name: str = "random_forest_classifier"
    test_size: float = 0.2
    experiment_name: str = "ai-data-analyst"

@router.post("/train")
def train(req: TrainRequest):
    """Train a scikit-learn model on the loaded CSV and track with MLflow."""
    result = train_model(
        target_column=req.target_column,
        model_name=req.model_name,
        test_size=req.test_size,
        experiment_name=req.experiment_name,
    )
    if "error" in result:
        raise HTTPException(status_code=400, detail=result["error"])
    return result

@router.get("/train/models")
def list_models():
    """List supported ML models."""
    return {"models": list(SUPPORTED_MODELS.keys())}