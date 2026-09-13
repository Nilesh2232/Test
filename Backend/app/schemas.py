from datetime import datetime
from typing import Literal, Optional

from pydantic import BaseModel, EmailStr, Field


TicketStatus = Literal["Open", "In Progress", "Closed"]


class TicketCreate(BaseModel):
    customer_name: str = Field(..., min_length=1, max_length=255)
    customer_email: EmailStr
    subject: str = Field(..., min_length=1, max_length=500)
    description: str = Field(..., min_length=1)


class TicketUpdate(BaseModel):
    status: Optional[TicketStatus] = None
    notes: Optional[str] = Field(None, min_length=1)


class NoteOut(BaseModel):
    id: int
    note_text: str
    created_at: datetime

    model_config = {"from_attributes": True}


class TicketListItem(BaseModel):
    ticket_id: str
    customer_name: str
    subject: str
    status: str
    created_at: datetime

    model_config = {"from_attributes": True}


class TicketCreateResponse(BaseModel):
    ticket_id: str
    created_at: datetime


class TicketDetail(BaseModel):
    ticket_id: str
    customer_name: str
    customer_email: str
    subject: str
    description: str
    status: str
    created_at: datetime
    updated_at: datetime
    notes: list[NoteOut] = []

    model_config = {"from_attributes": True}


class TicketUpdateResponse(BaseModel):
    success: bool = True
    updated_at: datetime
