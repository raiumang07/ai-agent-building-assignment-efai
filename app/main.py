from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.routers import research, plan, chat, historical

app = FastAPI(title="Company Research Assistant")

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",  # Vite dev server
        "http://localhost:3000",  # Alternative React dev server
        "http://127.0.0.1:5173",
        "http://127.0.0.1:3000",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(research.router)
app.include_router(plan.router)
app.include_router(chat.router)
app.include_router(historical.router)
