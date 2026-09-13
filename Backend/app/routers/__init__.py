from fastapi import APIRouter

from app.routers import tickets

api_router = APIRouter()
api_router.include_router(tickets.router)
