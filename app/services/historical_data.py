import yfinance as yf
import pandas as pd
from datetime import datetime, timedelta
import requests
from bs4 import BeautifulSoup
import re

HEADERS = {"User-Agent": "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/115.0 Safari/537.36"}

def get_company_ticker(company_name: str):
    """Try to find stock ticker for a company"""
    try:
        # Try searching Yahoo Finance
        search_url = f"https://finance.yahoo.com/quote/{company_name.replace(' ', '%20')}"
        response = requests.get(search_url, headers=HEADERS, timeout=10)
        
        # Try to extract ticker from URL or page
        if 'quote' in response.url:
            ticker_match = re.search(r'/quote/([A-Z]+)', response.url)
            if ticker_match:
                return ticker_match.group(1)
        
        # Common ticker mappings
        ticker_map = {
            'microsoft': 'MSFT',
            'apple': 'AAPL',
            'google': 'GOOGL',
            'alphabet': 'GOOGL',
            'amazon': 'AMZN',
            'meta': 'META',
            'facebook': 'META',
            'tesla': 'TSLA',
            'nvidia': 'NVDA',
            'netflix': 'NFLX',
            'adobe': 'ADBE',
            'salesforce': 'CRM',
            'oracle': 'ORCL',
            'ibm': 'IBM',
            'intel': 'INTC',
            'cisco': 'CSCO',
            'qualcomm': 'QCOM',
        }
        
        company_lower = company_name.lower()
        for key, ticker in ticker_map.items():
            if key in company_lower:
                return ticker
                
        return None
    except Exception as e:
        print(f"Error finding ticker: {e}")
        return None

def get_historical_financial_data(company_name: str, years: int = 10):
    """Get historical financial data for a company"""
    try:
        ticker = get_company_ticker(company_name)
        if not ticker:
            return None
        
        # Get stock data
        stock = yf.Ticker(ticker)
        
        # Get historical data for the specified years
        end_date = datetime.now()
        start_date = end_date - timedelta(days=years * 365)
        
        # Get historical stock prices
        hist = stock.history(start=start_date, end=end_date, interval="1y")
        
        if hist.empty:
            return None
        
        # Get financials
        try:
            financials = stock.financials
            income_stmt = stock.income_stmt
            
            # Prepare data
            data = []
            for idx, row in hist.iterrows():
                year = idx.year
                year_data = {
                    'year': str(year),
                    'revenue': None,
                    'netIncome': None,
                    'marketCap': None,
                }
                
                # Try to get revenue and net income from financials
                if not income_stmt.empty:
                    try:
                        # Get data for the closest year
                        for col in income_stmt.columns:
                            if col.year == year or abs((col.year - year)) <= 1:
                                if 'Total Revenue' in income_stmt.index:
                                    revenue = income_stmt.loc['Total Revenue', col]
                                    if pd.notna(revenue):
                                        year_data['revenue'] = float(revenue)
                                if 'Net Income' in income_stmt.index:
                                    net_income = income_stmt.loc['Net Income', col]
                                    if pd.notna(net_income):
                                        year_data['netIncome'] = float(net_income)
                                break
                    except Exception:
                        pass
                
                # Market cap approximation (price * shares outstanding)
                if 'Close' in row and pd.notna(row['Close']):
                    try:
                        info = stock.info
                        shares_outstanding = info.get('sharesOutstanding', 0)
                        if shares_outstanding:
                            year_data['marketCap'] = float(row['Close']) * shares_outstanding
                    except Exception:
                        pass
                
                data.append(year_data)
            
            return data
        except Exception as e:
            print(f"Error getting financials: {e}")
            # Fallback: just use stock price data
            data = []
            for idx, row in hist.iterrows():
                data.append({
                    'year': str(idx.year),
                    'revenue': None,
                    'netIncome': None,
                    'marketCap': float(row['Close']) * 1e9 if 'Close' in row and pd.notna(row['Close']) else None,
                })
            return data
            
    except Exception as e:
        print(f"Error getting historical data: {e}")
        return None

def get_annual_financials(company_name: str):
    """Get annual financial statements"""
    try:
        ticker = get_company_ticker(company_name)
        if not ticker:
            return None
        
        stock = yf.Ticker(ticker)
        
        # Get financial statements
        income_stmt = stock.income_stmt
        balance_sheet = stock.balance_sheet
        
        if income_stmt.empty:
            return None
        
        # Extract annual data
        annual_data = []
        for col in income_stmt.columns:
            year = col.year
            year_data = {
                'year': str(year),
                'revenue': None,
                'netIncome': None,
                'operatingIncome': None,
                'totalAssets': None,
                'totalEquity': None,
            }
            
            try:
                if 'Total Revenue' in income_stmt.index:
                    revenue = income_stmt.loc['Total Revenue', col]
                    if pd.notna(revenue):
                        year_data['revenue'] = float(revenue)
                
                if 'Net Income' in income_stmt.index:
                    net_income = income_stmt.loc['Net Income', col]
                    if pd.notna(net_income):
                        year_data['netIncome'] = float(net_income)
                
                if 'Operating Income' in income_stmt.index:
                    op_income = income_stmt.loc['Operating Income', col]
                    if pd.notna(op_income):
                        year_data['operatingIncome'] = float(op_income)
            except Exception:
                pass
            
            if not balance_sheet.empty:
                try:
                    if 'Total Assets' in balance_sheet.index:
                        assets = balance_sheet.loc['Total Assets', col]
                        if pd.notna(assets):
                            year_data['totalAssets'] = float(assets)
                    
                    if 'Stockholders Equity' in balance_sheet.index:
                        equity = balance_sheet.loc['Stockholders Equity', col]
                        if pd.notna(equity):
                            year_data['totalEquity'] = float(equity)
                except Exception:
                    pass
            
            annual_data.append(year_data)
        
        return sorted(annual_data, key=lambda x: x['year'])
        
    except Exception as e:
        print(f"Error getting annual financials: {e}")
        return None


