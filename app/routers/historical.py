from fastapi import APIRouter
from app.services.historical_data import get_historical_financial_data, get_annual_financials

router = APIRouter(prefix="/historical", tags=["Historical"])

@router.get("/financials")
async def get_historical_financials(company: str, years: int = 10):
    """Get historical financial data for a company"""
    data = get_historical_financial_data(company, years)
    if data:
        return {"status": "success", "data": data}
    else:
        # Try annual financials as fallback
        annual_data = get_annual_financials(company)
        if annual_data:
            return {"status": "success", "data": annual_data}
        return {"status": "error", "message": "Could not fetch historical data"}


