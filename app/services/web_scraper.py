async def scrape_company_info(company: str):
    results = {}

    url = f"https://www.google.com/search?q={company}+company+overview"
    
    async with aiohttp.ClientSession() as session:
        async with session.get(url, headers={"User-Agent": "Mozilla/5.0"}) as r:
            html = await r.text()
            soup = BeautifulSoup(html, "lxml")

            div = soup.find("div", class_="BNeawe")

            if div:
                results["overview"] = div.text
            else:
                results["overview"] = "No overview found."

    return results
