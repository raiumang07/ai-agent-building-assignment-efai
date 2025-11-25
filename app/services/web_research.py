import requests
from bs4 import BeautifulSoup
import feedparser

# -----------------------------
# 1. Wikipedia Full Extract
# -----------------------------
def get_wikipedia(company):
    url = f"https://en.wikipedia.org/api/rest_v1/page/summary/{company}"
    r = requests.get(url).json()
    return {
        "title": r.get("title"),
        "description": r.get("description"),
        "extract": r.get("extract")
    }

# -----------------------------
# 2. DuckDuckGo Search (FREE)
# -----------------------------
def ddg_search(query):
    url = f"https://ddg-api.herokuapp.com/search?query={query}"
    r = requests.get(url).json()
    return r[:5] if isinstance(r, list) else None

# -----------------------------
# 3. Website Scraping
# -----------------------------
def scrape_website(url):
    try:
        html = requests.get(url, timeout=10).text
        soup = BeautifulSoup(html, "html.parser")

        text_blocks = " ".join([p.text for p in soup.find_all("p")[:20]])

        tech_stack = []
        scripts = soup.find_all("script")
        for s in scripts:
            src = s.get("src", "")
            if "react" in src: tech_stack.append("React")
            if "next" in src: tech_stack.append("Next.js")
            if "vue" in src: tech_stack.append("Vue.js")
            if "gtag" in src: tech_stack.append("Google Analytics")
            if "bootstrap" in src: tech_stack.append("Bootstrap")

        return {
            "text_snippet": text_blocks[:1000],
            "tech_stack": list(set(tech_stack))
        }
    except:
        return None

# -----------------------------
# 4. Google News RSS (FREE)
# -----------------------------
def get_news(company):
    url = f"https://news.google.com/rss/search?q={company}"
    feed = feedparser.parse(url)
    return [
        {"title": e.title, "link": e.link}
        for e in feed.entries[:10]
    ]

# -----------------------------
# 5. Yahoo Finance Snapshot (FREE scrape)
# -----------------------------
def get_financials(symbol):
    url = f"https://finance.yahoo.com/quote/{symbol}"
    html = requests.get(url).text
    soup = BeautifulSoup(html, "html.parser")

    info = {}
    for row in soup.select("table tr"):
        cols = row.select("td")
        if len(cols) == 2:
            info[cols[0].text] = cols[1].text

    return info
