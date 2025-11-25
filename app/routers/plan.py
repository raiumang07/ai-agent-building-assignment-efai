from fastapi import APIRouter, Body
from app.services.llm_generator import generate_account_plan

router = APIRouter(prefix="/plan", tags=["Plan"])

@router.post("/generate")
async def gen_plan(payload: dict = Body(...)):
    company = payload.get("company")
    research = payload.get("research") 
    if not company or not research:
        return {"error": "company and research required"}
    plan = await generate_account_plan(company, research)
    return {"company": company, "account_plan": plan}
