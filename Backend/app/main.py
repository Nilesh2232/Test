from pathlib import Path

from fastapi import FastAPI, Request
from fastapi.responses import HTMLResponse
from fastapi.staticfiles import StaticFiles
from fastapi.templating import Jinja2Templates

from app.config import settings
from app.database import init_db
from app.routers import api_router

# Backend/app/main.py -> project root
PROJECT_ROOT = Path(__file__).resolve().parent.parent.parent
FRONTEND_DIR = PROJECT_ROOT / "Frontend"

app = FastAPI(title=settings.app_name)
app.include_router(api_router)
app.mount("/static", StaticFiles(directory=FRONTEND_DIR / "static"), name="static")

templates = Jinja2Templates(directory=str(FRONTEND_DIR / "templates"))


@app.on_event("startup")
def on_startup():
    init_db()


@app.get("/", response_class=HTMLResponse)
def home(request: Request):
    return templates.TemplateResponse("index.html", {"request": request})


@app.get("/tickets/new", response_class=HTMLResponse)
def new_ticket_page(request: Request):
    return templates.TemplateResponse("create.html", {"request": request})


@app.get("/tickets/{ticket_id}", response_class=HTMLResponse)
def ticket_detail_page(request: Request, ticket_id: str):
    return templates.TemplateResponse(
        "detail.html", {"request": request, "ticket_id": ticket_id}
    )
