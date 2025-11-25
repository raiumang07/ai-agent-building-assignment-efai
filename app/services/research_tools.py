import requests
from bs4 import BeautifulSoup
import feedparser
import wikipedia
import re
from urllib.parse import urlencode, quote_plus, urljoin

HEADERS = {"User-Agent": "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/115.0 Safari/537.36"}

# -------------------------
# Wikipedia detailed extract
# -------------------------
def fetch_wikipedia_detailed(company: str):
    try:
        wikipedia.set_lang("en")
        page = wikipedia.page(company, auto_suggest=True)
        summary = wikipedia.summary(company, sentences=15)  # Increased from 6 to 15
        content = page.content[:15000]  # Increased from 6000 to 15000
        info = {
            "title": page.title,
            "summary": summary,
            "content_snippet": content,
            "url": page.url
        }
        # attempt to pull infobox numeric fields from page html (fallback)
        try:
            html = requests.get(page.url, headers=HEADERS, timeout=10).text
            soup = BeautifulSoup(html, "lxml")
            # find infobox rows
            infobox = soup.find("table", {"class": re.compile("infobox")})
            if infobox:
                rows = {}
                for tr in infobox.find_all("tr"):
                    th = tr.find("th")
                    td = tr.find("td")
                    if th and td:
                        key = th.text.strip()
                        val = " ".join(td.text.split())
                        rows[key] = val
                info["infobox"] = rows
                
                # Try to get logo from infobox
                try:
                    logo_img = infobox.find("img")
                    if logo_img and logo_img.get("src"):
                        logo_url = logo_img.get("src")
                        if logo_url.startswith("//"):
                            logo_url = "https:" + logo_url
                        elif logo_url.startswith("/"):
                            logo_url = "https://en.wikipedia.org" + logo_url
                        info["logo_url"] = logo_url
                except Exception:
                    pass
                    
        except Exception:
            pass
        
        # Also try Wikipedia API for logo
        try:
            api_url = f"https://en.wikipedia.org/api/rest_v1/page/summary/{company.replace(' ', '_')}"
            api_response = requests.get(api_url, headers=HEADERS, timeout=10).json()
            if api_response.get("thumbnail") and api_response["thumbnail"].get("source"):
                info["logo_url"] = api_response["thumbnail"]["source"]
        except Exception:
            pass

        return info
    except Exception:
        return {"error": "No wikipedia page / extract found"}

# -------------------------
# DuckDuckGo instant answers (simple)
# -------------------------
def ddg_instant_answers(company: str):
    try:
        # Using DuckDuckGo JSON Instant Answer API
        url = "https://api.duckduckgo.com/"
        params = {"q": f"{company} annual revenue", "format": "json", "no_html": 1, "skip_disambig": 1}
        r = requests.get(url, params=params, headers=HEADERS, timeout=8).json()
        return {
            "Abstract": r.get("Abstract"),
            "AbstractText": r.get("AbstractText"),
            "RelatedTopics": r.get("RelatedTopics", [])[:6]
        }
    except Exception:
        return None

# -------------------------
# Find Yahoo Finance URL via DuckDuckGo HTML search
# -------------------------
def find_yahoo_finance_url(company: str):
    try:
        query = quote_plus(f"{company} site:finance.yahoo.com")
        search_url = f"https://duckduckgo.com/html/?q={query}"
        r = requests.get(search_url, headers=HEADERS, timeout=8)
        soup = BeautifulSoup(r.text, "lxml")
        a = soup.select_one("a.result__a")
        if a:
            link = a.get("href")
            # duckduckgo intermediate link may include uddg param; try to extract direct url
            # often link is like '/l/?kh=-1&uddg=https%3A%2F%2Ffinance.yahoo.com%2Fquote%2FMSFT'
            if link.startswith("/l/?"):
                # extract uddg param
                m = re.search(r"uddg=(https%3A%2F%2F[^&]+)", link)
                if m:
                    return requests.utils.unquote(m.group(1))
            # sometimes direct
            return link
        return None
    except Exception:
        return None

# -------------------------
# Scrape Yahoo Finance numeric values
# -------------------------
def scrape_yahoo_financials(yahoo_url: str):
    try:
        r = requests.get(yahoo_url, headers=HEADERS, timeout=10)
        html = r.text
        soup = BeautifulSoup(html, "lxml")

        result = {}

        # Market summary table (key-value pairs)
        try:
            # find tables and rows
            for table in soup.select("section[data-test='qsp-statistics'] table, div#quote-summary table"):
                for tr in table.select("tr"):
                    tds = [td.get_text(separator=" ", strip=True) for td in tr.select("td")]
                    if len(tds) == 2:
                        k, v = tds
                        result[k] = v
        except Exception:
            pass

        # Try common labels:
        # Market Cap, PE Ratio (TTM), EPS (TTM), Revenue (TTM) may appear in summary panels
        # Search whole page text for patterns
        text = soup.get_text(" ", strip=True)

        def find_stat(label):
            m = re.search(rf"{re.escape(label)}\s*[:\n]?\s*([$\d\.,MBTK\-+% ]+)", text, re.IGNORECASE)
            if m:
                return m.group(1).strip()
            return None

        for label in ["Market Cap", "PE Ratio (TTM)", "PE Ratio", "EPS (TTM)", "EPS", "Trailing P/E", "P/E (TTM)"]:
            val = find_stat(label)
            if val:
                result[label] = val

        # Try to find Revenue / Net Income / Profit Margin lines in "Financials" area
        # Revenue is often shown via "Total Revenue" or "Revenue (TTM)"
        revenue = find_stat("Revenue")
        if revenue:
            result["Revenue"] = revenue

        # Employees (common in Yahoo profile)
        emp = find_stat("Full Time Employees")
        if emp:
            result["Employees"] = emp
        else:
            # sometimes 'Employees' only
            emp2 = find_stat("Employees")
            if emp2:
                result["Employees"] = emp2

        # Try to extract raw numbers for assets/equity from Financials page link
        # If there's a 'Financials' link, try to navigate
        # Try to find link to /financials or /balance-sheet
        try:
            bs_link = None
            for a in soup.find_all("a", href=True):
                href = a["href"]
                if "/financials" in href or "/balance-sheet" in href:
                    bs_link = urljoin("https://finance.yahoo.com", href)
                    break
            if bs_link:
                r2 = requests.get(bs_link, headers=HEADERS, timeout=8).text
                s2 = BeautifulSoup(r2, "lxml")
                # find first few numeric rows
                for tr in s2.select("div#Main table tr")[:10]:
                    tds = [td.get_text(separator=" ", strip=True) for td in tr.select("td")]
                    if len(tds) >= 2:
                        result[tds[0]] = tds[1]
        except Exception:
            pass

        # Quick clean: keep common fields
        cleaned = {}
        for k in ["Market Cap", "PE Ratio (TTM)", "PE Ratio", "EPS (TTM)", "EPS", "Revenue", "Net Income", "Profit Margin", "Employees"]:
            if k in result:
                cleaned[k] = result[k]
        # also include everything else scraped
        cleaned.update(result)

        return cleaned
    except Exception as e:
        return {"error": f"Yahoo scrape failed: {str(e)}"}

# -------------------------
# Company website scraping (basic)
# -------------------------
def scrape_company_website(company: str):
    try:
        # find official site via DuckDuckGo
        query = quote_plus(f"{company} official website")
        search_url = f"https://duckduckgo.com/html/?q={query}"
        r = requests.get(search_url, headers=HEADERS, timeout=8)
        soup = BeautifulSoup(r.text, "lxml")
        a = soup.select_one("a.result__a")
        if not a:
            return None
        link = a.get("href")
        if link.startswith("/l/?"):
            m = re.search(r"uddg=(https%3A%2F%2F[^&]+)", link)
            if m:
                site = requests.utils.unquote(m.group(1))
            else:
                site = link
        else:
            site = link

        # fetch site and simple data
        try:
            r2 = requests.get(site, headers=HEADERS, timeout=8)
            s2 = BeautifulSoup(r2.text, "lxml")
            title = s2.title.string if s2.title else None
            description_tag = s2.find("meta", attrs={"name": "description"})
            desc = description_tag["content"] if description_tag else None
            # tech detection
            tech = []
            for script in s2.find_all("script"):
                src = script.get("src", "")
                if "react" in src.lower():
                    tech.append("React")
                if "next" in src.lower():
                    tech.append("Next.js")
            # basic about page snippet
            about = None
            about_tag = s2.find(lambda t: t.name in ["a", "link"] and "about" in (t.get("href","") + t.get("text","")).lower())
            if about_tag and about_tag.get("href"):
                about_url = urljoin(site, about_tag["href"])
                try:
                    r3 = requests.get(about_url, headers=HEADERS, timeout=6)
                    s3 = BeautifulSoup(r3.text, "lxml")
                    about = " ".join([p.text for p in s3.find_all("p")[:6]])
                except:
                    about = None

            return {
                "site": site,
                "title": title,
                "description": desc,
                "about_snippet": about,
                "tech": list(set(tech))
            }
        except Exception:
            return {"site": site}
    except Exception:
        return None

# -------------------------
# News via Google News RSS
# -------------------------
def fetch_news_rss(company: str, limit: int = 10):
    try:
        url = f"https://news.google.com/rss/search?q={quote_plus(company)}"
        feed = feedparser.parse(url)
        items = []
        for e in feed.entries[:limit]:
            items.append({"title": getattr(e, "title", None), "link": getattr(e, "link", None), "published": getattr(e, "published", None)})
        return items
    except Exception:
        return []
