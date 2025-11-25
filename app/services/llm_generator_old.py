import os
from dotenv import load_dotenv
import json
from langchain_google_genai import ChatGoogleGenerativeAI
from langchain_core.messages import HumanMessage, AIMessage

load_dotenv()
GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")
# Optional: Google Cloud project ID (e.g., projects/707248373048 or 707248373048)
GEMINI_PROJECT_ID = os.getenv("GEMINI_PROJECT_ID")
# Allow model to be configured via environment variable
# Latest models: gemini-2.5-flash, gemini-2.5-flash-lite, gemini-2.5-pro, gemini-3-pro
GEMINI_MODEL = os.getenv("GEMINI_MODEL")

# List of models to try in order of preference (based on available models from API)
MODEL_PRIORITY = [
    "gemini-2.0-flash",  # Fast and widely available
    "gemini-flash-latest",  # Latest flash model
    "gemini-2.5-flash",  # Latest 2.5 flash
    "gemini-pro-latest",  # Latest pro model
    "gemini-2.0-flash-lite",  # Lightweight option
    "gemini-2.5-flash-lite",  # Lightweight 2.5
    # Fallback options
    "gemini-1.5-flash",
    "gemini-1.5-pro-latest",
    "gemini-pro",
]

# Initialize Gemini model with fallback
def get_llm(model_name=None):
    """Get LLM instance, trying multiple models if needed"""
    models_to_try = []
    
    # Add user-specified model first if provided
    if model_name:
        models_to_try.append(model_name)
    if GEMINI_MODEL and GEMINI_MODEL not in models_to_try:
        models_to_try.append(GEMINI_MODEL)
    
    # Add priority models
    models_to_try.extend([m for m in MODEL_PRIORITY if m not in models_to_try])
    
    last_error = None
    for model in models_to_try:
        try:
            # Try with standard model name (without models/ prefix for langchain)
            model_name_clean = model.replace("models/", "") if model.startswith("models/") else model
            
            llm_instance = ChatGoogleGenerativeAI(
                model=model_name_clean,
                google_api_key=GEMINI_API_KEY,
                temperature=0.7,
                max_output_tokens=4000
            )
            print(f"✓ Initialized Gemini model: {model_name_clean}")
            return llm_instance, model_name_clean
        except Exception as e:
            last_error = e
            error_str = str(e)
            if "404" in error_str or "not found" in error_str.lower():
                print(f"✗ Model {model} not available (404)")
            else:
                print(f"✗ Failed to initialize {model}: {error_str[:100]}")
            continue
    
    # If all fail, raise the last error
    raise Exception(f"Failed to initialize any Gemini model. Last error: {last_error}")

# Initialize LLM lazily - will try models when first used
llm = None
active_model = None

def ensure_llm_initialized():
    """Ensure LLM is initialized, try to initialize if not"""
    global llm, active_model
    if llm is None:
        try:
            llm, active_model = get_llm(GEMINI_MODEL)
            print(f"Using Gemini model: {active_model}")
        except Exception as e:
            print(f"Warning: Could not initialize LLM: {e}")
            print("LLM features will not work until a valid model is configured.")
            llm = None
            active_model = None
    return llm is not None

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

async def summarize_research_with_numbers(company: str, raw_data: dict):
    """Summarize research data and generate structured summary"""
    if not ensure_llm_initialized():
        return {"error": "LLM not initialized. Please check GEMINI_API_KEY and model configuration."}
    
    raw_json = json.dumps(raw_data, indent=2)[:20000]
    prompt = HEAVY_PROMPT_TEMPLATE.format(company=company, raw_json=raw_json)
    
    try:
        response = await llm.ainvoke([HumanMessage(content=prompt)])
        content = response.content
        
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
            # If LLM returned plain text, wrap it
            print(f"JSON parsing error: {e}")
            return {"raw_text": content, "error": "Failed to parse as JSON"}
    except Exception as e:
        # Handle API errors
        error_msg = f"Error calling Gemini API: {str(e)}"
        print(error_msg)
        return {"error": error_msg, "raw_data": raw_data}

async def generate_account_plan(company_name: str, research_summary):
    """Generate account plan using Gemini following strategic account planning best practices"""
    global llm, active_model
    
    if not ensure_llm_initialized():
        return "Error: LLM not initialized. Please check GEMINI_API_KEY and model configuration in your .env file."
    
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
        response = await llm.ainvoke([HumanMessage(content=prompt)])
        return response.content
    except Exception as e:
        error_msg = str(e)
        # Try to reinitialize with a different model if we get a 404
        if "404" in error_msg or "not found" in error_msg.lower():
            try:
                print(f"Model {active_model} not available, trying alternative models...")
                # Reset and try again
                llm = None
                active_model = None
                if ensure_llm_initialized():
                    # Retry once with new model
                    response = await llm.ainvoke([HumanMessage(content=prompt)])
                    return response.content
                else:
                    return f"Error generating account plan: Could not find any available Gemini model. Please check your API key and available models."
            except Exception as retry_error:
                return f"Error generating account plan: {error_msg}. Tried alternative models but failed: {str(retry_error)}"
        return f"Error generating account plan: {error_msg}"

async def chat_with_research(company_name: str, research_data: dict, question: str):
    """Interactive chat that uses research data to answer questions"""
    global llm, active_model
    
    if not ensure_llm_initialized():
        return "I apologize, but the AI service is not available. Please check the backend configuration."
    
    research_summary = json.dumps(research_data, indent=2)[:10000]
    
    prompt = f"""You are an AI research assistant helping analyze {company_name}. 

Research Data Available:
{research_summary}

User Question: {question}

Provide a helpful, accurate answer based on the research data. If you find conflicting information, mention it. If you need more information, suggest what to investigate further. Be conversational and helpful.
"""
    
    try:
        response = await llm.ainvoke([HumanMessage(content=prompt)])
        return response.content
    except Exception as e:
        error_msg = str(e)
        # Try to reinitialize with a different model if we get a 404
        if "404" in error_msg or "not found" in error_msg.lower():
            try:
                print(f"Model {active_model} not available, trying alternative models...")
                # Reset and try again
                llm = None
                active_model = None
                if ensure_llm_initialized():
                    # Retry once with new model
                    response = await llm.ainvoke([HumanMessage(content=prompt)])
                    return response.content
            except Exception:
                pass
        return f"I apologize, but I encountered an error: {error_msg}. Please try again."
