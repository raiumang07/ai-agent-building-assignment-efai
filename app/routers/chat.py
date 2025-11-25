from fastapi import APIRouter, Body
from app.services.llm_generator import chat_with_research

router = APIRouter(prefix="/api", tags=["Chat"])

@router.post("/chat")
async def chat(payload: dict = Body(...)):
    company = payload.get("company")
    research = payload.get("research")
    question = payload.get("question")
    
    if not company or not research or not question:
        return {"error": "company, research, and question are required"}
    
    response = await chat_with_research(company, research, question)
    return {"response": response}


