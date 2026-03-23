from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import Optional, List
import os
from dotenv import load_dotenv
from rag import ConstructionRAG

load_dotenv()

app = FastAPI(title="Construction Content Generator API")

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Initialize RAG system
rag = ConstructionRAG()

class ReportRequest(BaseModel):
    project_name: str
    project_number: Optional[str] = ""
    date: str
    location: str
    contractor: str
    weather: Optional[str] = ""
    report_type: str
    topic: str
    tone: Optional[str] = "standard"
    length: Optional[str] = "detailed"
    include_safety: Optional[bool] = True
    include_materials: Optional[bool] = True
    include_photos: Optional[bool] = True

class ReportResponse(BaseModel):
    report: str
    success: bool
    message: str

class HistoryMessage(BaseModel):
    role: str  # "user" or "assistant"
    content: str

class ChatRequest(BaseModel):
    message: str
    history: Optional[List[HistoryMessage]] = []

class ChatResponse(BaseModel):
    response: str
    success: bool

@app.get("/")
async def root():
    return {"message": "Construction Content Generator API", "status": "running"}

@app.get("/health")
async def health():
    return {"status": "healthy"}

@app.post("/generate-report", response_model=ReportResponse)
async def generate_report(request: ReportRequest):
    try:
        report = rag.generate_report(
            project_name=request.project_name,
            project_number=request.project_number,
            date=request.date,
            location=request.location,
            contractor=request.contractor,
            weather=request.weather,
            report_type=request.report_type,
            topic=request.topic,
            tone=request.tone,
            length=request.length,
            include_safety=request.include_safety,
            include_materials=request.include_materials,
            include_photos=request.include_photos
        )
        
        return ReportResponse(
            report=report,
            success=True,
            message="Report generated successfully"
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/report-types")
async def get_report_types():
    return {
        "report_types": [
            "Daily Site Report",
            "Safety Inspection Report",
            "Progress Report",
            "Quality Control Report",
            "Material Inspection Report",
            "Equipment Status Report",
            "Incident Report"
        ]
    }

@app.post("/chat", response_model=ChatResponse)
async def chat_with_ai(request: ChatRequest):
    try:
        history = [{"role": m.role, "content": m.content} for m in (request.history or [])]
        response = rag.chat(request.message, history=history)
        return ChatResponse(
            response=response,
            success=True
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
