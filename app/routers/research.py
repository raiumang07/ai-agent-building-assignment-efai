from fastapi import APIRouter
from app.services.research_tools import (
    fetch_wikipedia_detailed,
    fetch_yahoo_finance_data,  # NEW: Reliable yfinance method
    ddg_instant_answers,
    scrape_company_website,
    fetch_news_rss
)
from app.services.llm_generator import summarize_research_with_numbers

router = APIRouter(prefix="/research", tags=["Research"])

@router.get("/company")
async def get_company_info(company: str):
    # 1) Wikipedia
    wiki = fetch_wikipedia_detailed(company)

    # 2) Yahoo Finance using yfinance library (RELIABLE)
    yahoo_fin = fetch_yahoo_finance_data(company)

    # 3) DuckDuckGo instant financial answers (short snippets)
    ddg = ddg_instant_answers(company)

    # 4) Company Website scraping
    website = scrape_company_website(company)

    # 5) News RSS (Google News)
    news = fetch_news_rss(company)

    raw = {
        "wikipedia": wiki,
        "yahoo_finance": yahoo_fin,
        "ddg": ddg,
        "website": website,
        "news": news
    }

    # 6) Summarize + numeric analysis with LLM
    summary = await summarize_research_with_numbers(company, raw)

    return {
        "status": "success",
        "raw_data": raw,
        "analysis": summary
    }
