"""
MCP (Model Context Protocol) Server
Exposes tools as a lightweight FastAPI sub-application that can be mounted
on the main app or run standalone.
"""
from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
from app.utils.tools import rag_search, data_query, calculator, TOOLS
from app.agents.multi_agent import run_query

mcp_app = FastAPI(title="AI Data Analyst — MCP Server", version="1.0.0")


# ── Request / Response models ─────────────────────────────────────────────────

class ToolRequest(BaseModel):
    input: str


class QueryRequest(BaseModel):
    query: str


# ── Tool endpoints ────────────────────────────────────────────────────────────

@mcp_app.get("/tools")
def list_tools():
    """List all available MCP tools."""
    return {
        name: {"description": meta["description"]}
        for name, meta in TOOLS.items()
    }


@mcp_app.post("/tools/search_docs")
def search_docs(req: ToolRequest):
    """Search the uploaded PDF document."""
    result = rag_search(req.input)
    return {"tool": "search_docs", "result": result}


@mcp_app.post("/tools/query_data")
def query_data(req: ToolRequest):
    """Query the loaded CSV dataset."""
    result = data_query(req.input)
    return {"tool": "query_data", "result": result}


@mcp_app.post("/tools/calculate")
def calculate(req: ToolRequest):
    """Evaluate a mathematical expression."""
    result = calculator(req.input)
    return {"tool": "calculate", "result": result}


@mcp_app.post("/tools/run_analysis")
def run_analysis(req: QueryRequest):
    """Run the full multi-agent pipeline on a query."""
    result = run_query(req.query)
    return {"tool": "run_analysis", "result": result}


# ── Health ────────────────────────────────────────────────────────────────────

@mcp_app.get("/health")
def health():
    return {"status": "ok", "service": "mcp"}

