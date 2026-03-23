from fastapi import FastAPI

app = FastAPI(title="AI Data Analyst")

@app.get("/")
def home():
    return {"message": "AI Data Analyst API is running"}