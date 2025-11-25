import os
from dotenv import load_dotenv
import json
from openai import AsyncOpenAI

load_dotenv()
A4F_API_KEY = os.getenv("A4F_API_KEY", "ddc-a4f-3c8834bd413a4c0ab7155573a5e77704ddc-a4f-3c8834bd413a4c0ab7155573a5e77704")
A4F_BASE_URL = "https://api.a4f.co/v1"
A4F_MODEL = os.getenv("A4F_MODEL", "provider-1/chatgpt-4o-latest")

# Initialize A4F client using OpenAI SDK
client = AsyncOpenAI(
    api_key=A4F_API_KEY,
    base_url=A4F_BASE_URL
)

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
    """Summarize research data and generate structured summary using A4F API"""
    raw_json = json.dumps(raw_data, indent=2)[:20000]
    prompt = HEAVY_PROMPT_TEMPLATE.format(company=company, raw_json=raw_json)
    
    try:
        response = await client.chat.completions.create(
            model=A4F_MODEL,
            messages=[
                {"role": "user", "content": prompt}
            ],
            temperature=0.7,
            max_tokens=4000
        )
        
        content = response.choices[0].message.content
        
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
        error_msg = f"Error calling A4F API: {str(e)}"
        print(error_msg)
        return {"error": error_msg, "raw_data": raw_data}

async def generate_account_plan(company_name: str, research_summary):
    """Generate account plan using A4F API following strategic account planning best practices"""
    
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
        response = await client.chat.completions.create(
            model=A4F_MODEL,
            messages=[
                {"role": "user", "content": prompt}
            ],
            temperature=0.7,
            max_tokens=4000
        )
        
        return response.choices[0].message.content
    except Exception as e:
        error_msg = str(e)
        return f"Error generating account plan: {error_msg}"

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
        response = await client.chat.completions.create(
            model=A4F_MODEL,
            messages=[
                {"role": "user", "content": prompt}
            ],
            temperature=0.7,
            max_tokens=2000
        )
        
        return response.choices[0].message.content
    except Exception as e:
        error_msg = str(e)
        return f"I apologize, but I encountered an error: {error_msg}. Please try again."
