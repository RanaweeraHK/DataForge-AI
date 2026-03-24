from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.api.routes import router
from app.mcp.mcp_server import mcp_app

app = FastAPI(
    title="DataForge AI",
    description="Multi-agent AI system with RAG, Data Analytics, ML tracking, and MCP.",
    version="1.0.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",   # React (Docker / prod)
        "http://localhost:5173",   # Vite dev server
        "http://127.0.0.1:5173",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(router)
app.mount("/mcp", mcp_app)

@app.get("/health")
def health():
    return {"status": "ok", "service": "dataforge-ai"}