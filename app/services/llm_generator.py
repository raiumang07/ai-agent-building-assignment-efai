import os
from dotenv import load_dotenv
import json

load_dotenv()

# API Configuration - supports both A4F and Gemini with fallback
USE_A4F = os.getenv("USE_A4F", "true").lower() == "true"
USE_GEMINI_FALLBACK = os.getenv("USE_GEMINI_FALLBACK", "true").lower() == "true"

# A4F Configuration
A4F_API_KEY = os.getenv("A4F_API_KEY", "ddc-a4f-3c8834bd413a4c0ab7155573a5e77704ddc-a4f-3c8834bd413a4c0ab7155573a5e77704")
A4F_BASE_URL = "https://api.a4f.co/v1"
# Correct A4F model format: provider/model-name
# Popular models: openai/gpt-4o, openai/gpt-4o-mini, anthropic/claude-3-5-sonnet, google/gemini-2.0-flash
A4F_MODEL = os.getenv("A4F_MODEL", "openai/gpt-4o-mini")

# Gemini Fallback Configuration  
GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")
GEMINI_MODEL = os.getenv("GEMINI_MODEL", "gemini-2.0-flash")

# Initialize clients
a4f_client = None
gemini_llm = None

if USE_A4F:
    try:
        from openai import AsyncOpenAI
        a4f_client = AsyncOpenAI(
            api_key=A4F_API_KEY,
            base_url=A4F_BASE_URL
        )
        print(f"✓ A4F client initialized with model: {A4F_MODEL}")
    except Exception as e:
        print(f"✗ Failed to initialize A4F client: {e}")
        a4f_client = None

if USE_GEMINI_FALLBACK and GEMINI_API_KEY:
    try:
        from langchain_google_genai import ChatGoogleGenerativeAI
        gemini_llm = ChatGoogleGenerativeAI(
            model=GEMINI_MODEL,
            google_api_key=GEMINI_API_KEY,
            temperature=0.7,
            max_output_tokens=4000
        )
        print(f"✓ Gemini fallback initialized with model: {GEMINI_MODEL}")
    except Exception as e:
        print(f"✗ Failed to initialize Gemini fallback: {e}")
        gemini_llm = None

HEAVY_PROMPT_TEMPLATE = """
You are an expert research analyst. Produce a Level-3 deep analysis for the company: {company}.

Raw data (JSON):
{raw_json}

Produce a structured JSON object with these sections:
- executive_summary: string
- numeric_table: object where keys are numeric metrics. Include ALL available metrics from the following list:
  * Market Cap
  * Revenue (TTM)
  * Revenue Growth %
  * Net Income
  * Profit Margin
  * EPS
  * PE Ratio
  * Cloud Revenue (if available)
  * R&D Spend
  * Cash on hand
  * Debt
  * Employees
  * Annual Revenues (from Wikipedia)
  * Operating Income
  * Assets
  * Equity
  * Azure Market Share (if available)
  * AI Revenue Share (if available)
  * Cloud Growth Rate (if available)
- products_services: string
- financial_summary: string
- strategic_analysis: string (includes SWOT)
- ai_cloud_strategy: string
- partnerships_ecosystem: string
- news_summary: string (3 latest headlines with one-line summary each)
- subsidiaries: array of strings (from Wikipedia infobox if available)

Make sure numeric_table fields are normalized (use values found, prefer Yahoo -> Wikipedia -> DuckDuckGo). If a numeric value is not available, put null. When you present numbers, keep currency units (USD) where present. Return only JSON.
"""

async def call_llm_with_fallback(prompt: str, use_json_mode: bool = False):
    """Call LLM with automatic fallback from A4F to Gemini"""
    
    # Try A4F first
    if a4f_client:
        try:
            print(f"Attempting A4F API with model: {A4F_MODEL}")
            response = await a4f_client.chat.completions.create(
                model=A4F_MODEL,
                messages=[{"role": "user", "content": prompt}],
                temperature=0.7,
                max_tokens=4000
            )
            print("✓ A4F API call successful")
            return response.choices[0].message.content
        except Exception as e:
            error_msg = str(e)
            print(f"✗ A4F API failed: {error_msg}")
            
            # If it's a model not found error, try to suggest alternatives
            if "404" in error_msg or "not_found" in error_msg.lower():
                print(f"Model '{A4F_MODEL}' not found. Try: openai/gpt-4o-mini, openai/gpt-4o, anthropic/claude-3-5-sonnet, or google/gemini-2.0-flash")
            
            # Fall through to Gemini fallback
    
    # Try Gemini fallback
    if gemini_llm:
        try:
            print(f"Falling back to Gemini with model: {GEMINI_MODEL}")
            from langchain_core.messages import HumanMessage
            response = await gemini_llm.ainvoke([HumanMessage(content=prompt)])
            print("✓ Gemini API call successful")
            return response.content
        except Exception as e:
            print(f"✗ Gemini API also failed: {str(e)}")
            raise Exception(f"Both A4F and Gemini APIs failed. A4F: {error_msg if 'error_msg' in locals() else 'N/A'}, Gemini: {str(e)}")
    
    # No API available
    raise Exception("No API client available. Please configure A4F_API_KEY or GEMINI_API_KEY in your .env file")

async def summarize_research_with_numbers(company: str, raw_data: dict):
    """Summarize research data and generate structured summary"""
    raw_json = json.dumps(raw_data, indent=2)[:20000]
    prompt = HEAVY_PROMPT_TEMPLATE.format(company=company, raw_json=raw_json)
    
    try:
        content = await call_llm_with_fallback(prompt)
        
        # Try to parse as JSON
        try:
            # Sometimes LLM wraps JSON in markdown code blocks
            if "```json" in content:
                content = content.split("```json")[1].split("```")[0].strip()
            elif "```" in content:
                content = content.split("```")[1].split("```")[0].strip()
            
            parsed = json.loads(content)
            return parsed
        except json.JSONDecodeError as e:
            print(f"JSON parsing error: {e}")
            return {"raw_text": content, "error": "Failed to parse as JSON"}
    except Exception as e:
        error_msg = f"Error calling LLM API: {str(e)}"
        print(error_msg)
        return {"error": error_msg, "raw_data": raw_data}

async def generate_account_plan(company_name: str, research_summary):
    """Generate account plan using available API with fallback"""
    
    prompt = f"""You are an expert strategic account planner. Create a comprehensive, enterprise-grade Account Plan for {company_name} following industry best practices.

Research Data Available:
{json.dumps(research_summary, indent=2)[:15000]}

Create a detailed Account Plan in markdown format with the following sections:

## 1. Executive Summary
Provide a high-level overview of the account, its strategic importance, and key opportunities.

## 2. Account Overview & Research
- Company background and current state
- Financial health and performance metrics
- Market position and competitive landscape
- Key business units and divisions

## 3. Customer Focus: Goals, Pressures, Initiatives & Obstacles (GPIO)
Identify and document:
- **Goals**: What are the customer's primary business objectives?
- **Pressures**: What external/internal pressures are they facing?
- **Initiatives**: What strategic initiatives are they pursuing?
- **Obstacles**: What challenges are blocking their success?

## 4. Target Selection & Sweet Spots
- Identify the "sweet spot" divisions/business units where you can uniquely deliver value
- Areas of mutual value creation
- Prioritized opportunities to target
- Opportunities to forgo (not aligned with mutual value)

## 5. People & Influence Mapping
- Key decision makers and their roles
- Influence network and relationships
- Power structures and political dynamics
- Champions, influencers, blockers, and gatekeepers
- Relationship gaps and how to bridge them

## 6. Whitespace Opportunities
- Untapped potential for cross-sell and up-sell
- New areas where your solutions can add value
- Revenue expansion opportunities within existing relationships
- Specific whitespace areas to target

## 7. Trust Building Strategy
- How to position as a "trusted advisor" (not just a vendor)
- Relationship-building activities
- Value delivery approach
- Customer problem-solving framework

## 8. Strategies & Activities
- Long-term strategic approach
- Key activities to execute
- Collaboration opportunities
- Team engagement plan

## 9. Action Items & Next Steps
- Specific, actionable items with owners
- Timeline and milestones
- Immediate next steps (next 30/60/90 days)
- Regular review cadence

## 10. Success Metrics & KPIs
- Key performance indicators to track
- Revenue targets and growth metrics
- Relationship health indicators
- Whitespace conversion metrics

## 11. Risks & Mitigation
- Potential risks to the account relationship
- Competitive threats
- Internal challenges
- Mitigation strategies

## 12. Account Team & Resources
- Recommended team structure
- Resource allocation
- Executive sponsorship needs
- Support requirements

**Important Guidelines:**
- Focus on becoming a trusted advisor, not just closing deals
- Emphasize mutual value creation
- Be specific and actionable
- Use insights from the research data provided
- Think long-term relationship building
- Identify whitespace opportunities
- Make it collaborative and team-oriented

Format the output as clean markdown with clear section headers. Make it professional, strategic, and immediately actionable for the sales team.
"""
    
    try:
        return await call_llm_with_fallback(prompt)
    except Exception as e:
        return f"Error generating account plan: {str(e)}"

async def chat_with_research(company_name: str, research_data: dict, question: str):
    """Interactive chat that uses research data to answer questions"""
    
    research_summary = json.dumps(research_data, indent=2)[:10000]
    
    prompt = f"""You are an AI research assistant helping analyze {company_name}. 

Research Data Available:
{research_summary}

User Question: {question}

Provide a helpful, accurate answer based on the research data. If you find conflicting information, mention it. If you need more information, suggest what to investigate further. Be conversational and helpful.
"""
    
    try:
        return await call_llm_with_fallback(prompt)
    except Exception as e:
        return f"I apologize, but I encountered an error: {str(e)}. Please try again."
