# ALpha - Enterprise-grade Account Planning Platform

A comprehensive full-stack application for researching and analyzing companies with a beautiful modern UI.

## 🚀 Features

- **Company Research**: Enter a company name to get comprehensive research data
- **Beautiful UI**: Modern React 19 frontend with Tailwind CSS v3 and shadcn/ui components
- **Dark Theme**: Sleek black/slate-based theme throughout
- **Shareable Links**: Generate shareable links for research results
- **Data Storage**: MongoDB backend for storing research history
- **Comprehensive Analysis**: Executive summaries, financial metrics, strategic analysis, and more

## 📋 Tech Stack

### Frontend
- React 19
- Tailwind CSS v3
- shadcn/ui components
- React Router
- Axios

### Backend
- Node.js
- Express.js
- MongoDB with Mongoose

### Python API
- FastAPI
- Web scraping and research tools
- LLM integration for analysis

## 🏗️ Architecture

```
┌─────────────┐      ┌──────────────┐      ┌─────────────┐
│   React     │─────▶│  Node.js     │─────▶│  MongoDB    │
│  Frontend   │      │  Backend     │      │  Database   │
└─────────────┘      └──────────────┘      └─────────────┘
       │                    │
       │                    │
       └────────────────────┼─────────────────┐
                            │                 │
                            ▼                 ▼
                     ┌──────────────┐  ┌──────────────┐
                     │  Python      │  │  External    │
                     │  FastAPI     │  │  APIs        │
                     │  Backend     │  │  (Wikipedia, │
                     └──────────────┘  │   Yahoo, etc)│
                                       └──────────────┘
```

## 📦 Project Structure

```
Alpha-python/
├── app/                    # Python FastAPI backend
│   ├── routers/           # API routes (research, plan)
│   ├── services/          # Business logic
│   │   ├── research_tools.py
│   │   ├── llm_generator.py
│   │   └── web_scraper.py
│   └── main.py           # FastAPI application
├── backend/               # Node.js/Express backend
│   ├── models/           # MongoDB models
│   │   └── Research.js
│   ├── server.js         # Express server
│   └── package.json
├── frontend/             # React frontend
│   ├── src/
│   │   ├── components/   # React components
│   │   │   ├── ui/      # shadcn/ui components
│   │   │   ├── CompanyInput.jsx
│   │   │   └── DataDisplay.jsx
│   │   ├── services/     # API services
│   │   │   └── api.js
│   │   ├── lib/         # Utilities
│   │   │   └── utils.js
│   │   ├── App.jsx      # Main app component
│   │   └── main.jsx     # Entry point
│   └── package.json
├── requirements.txt      # Python dependencies
└── SETUP.md             # Detailed setup instructions
```

## 🚦 Quick Start

### Prerequisites
- Node.js (v18+)
- Python 3.8+
- MongoDB (local or Docker)

### 1. Clone and Setup

```bash
# Install Python dependencies
pip install -r requirements.txt

# Install Node.js backend dependencies
cd backend
npm install

# Install React frontend dependencies
cd ../frontend
npm install
```

### 2. Configure Environment

**Python Backend** (root `.env`):
```
GEMINI_KEY=your_gemini_api_key_here
```

**Node.js Backend** (`backend/.env`):
```
PORT=3001
MONGODB_URI=mongodb://localhost:27017/company-research
```

**React Frontend** (`frontend/.env`):
```
VITE_API_BASE_URL=http://localhost:3001
VITE_PYTHON_API_URL=http://localhost:8000
```

### 3. Start Services


**Terminal 1 - Python API:**
```bash
uvicorn app.main:app --reload --port 8000
```

**Terminal 2 - Node.js Backend:**
```bash
cd backend
npm start
```

**Terminal 3 - React Frontend:**
```bash
cd frontend
npm run dev
```

### 4. Open Application

Navigate to `http://localhost:5173` in your browser.

## 📖 Usage

1. **Search for a Company**: Enter a company name (e.g., "Microsoft", "Apple", "Google")
2. **View Results**: Comprehensive research data will be displayed including:
   - Executive Summary
   - Financial Metrics
   - Company Overview (Wikipedia)
   - Products & Services
   - Strategic Analysis
   - AI & Cloud Strategy
   - Partnerships & Ecosystem
   - Recent News
3. **Share Research**: Click "Copy Link" to get a shareable URL
4. **Access Shared Links**: Anyone with the link can view the research at `/share/:id`

## 🎨 UI Components

The application uses shadcn/ui components for a consistent, beautiful interface:
- Cards for data sections
- Buttons with various styles
- Input fields for search
- Badges for labels
- Responsive grid layouts

## 🔗 API Endpoints

### Python FastAPI
- `GET /research/company?company={name}` - Get company research data

### Node.js Backend
- `POST /api/research` - Save research data
- `GET /api/research/:id` - Get research by ID
- `GET /api/research` - Get all research (history)

## 📝 License
MIT

