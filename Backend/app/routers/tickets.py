from datetime import datetime, timezone

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy import or_
from sqlalchemy.orm import Session, joinedload

from app.database import get_db
from app.models import Note, Ticket
from app.schemas import (
    TicketCreate,
    TicketCreateResponse,
    TicketDetail,
    TicketListItem,
    TicketUpdate,
    TicketUpdateResponse,
)

router = APIRouter(prefix="/api/tickets", tags=["tickets"])

VALID_STATUSES = {"Open", "In Progress", "Closed"}


def generate_ticket_id(db: Session) -> str:
    last = db.query(Ticket).order_by(Ticket.id.desc()).first()
    next_num = (last.id + 1) if last else 1
    return f"TKT-{next_num:03d}"


@router.post("", response_model=TicketCreateResponse, status_code=201)
def create_ticket(payload: TicketCreate, db: Session = Depends(get_db)):
    ticket = Ticket(
        ticket_id=generate_ticket_id(db),
        customer_name=payload.customer_name.strip(),
        customer_email=str(payload.customer_email).strip().lower(),
        subject=payload.subject.strip(),
        description=payload.description.strip(),
        status="Open",
    )
    db.add(ticket)
    db.commit()
    db.refresh(ticket)
    return TicketCreateResponse(ticket_id=ticket.ticket_id, created_at=ticket.created_at)


@router.get("", response_model=list[TicketListItem])
def list_tickets(
    status: str | None = Query(None, description="Filter by status"),
    search: str | None = Query(None, description="Search name, ID, email, description"),
    db: Session = Depends(get_db),
):
    query = db.query(Ticket)

    if status:
        if status not in VALID_STATUSES:
            raise HTTPException(
                status_code=400,
                detail=f"Invalid status. Must be one of: {', '.join(sorted(VALID_STATUSES))}",
            )
        query = query.filter(Ticket.status == status)

    if search:
        term = f"%{search.strip()}%"
        query = query.filter(
            or_(
                Ticket.ticket_id.ilike(term),
                Ticket.customer_name.ilike(term),
                Ticket.customer_email.ilike(term),
                Ticket.subject.ilike(term),
                Ticket.description.ilike(term),
            )
        )

    tickets = query.order_by(Ticket.created_at.desc()).all()
    return tickets


@router.get("/{ticket_id}", response_model=TicketDetail)
def get_ticket(ticket_id: str, db: Session = Depends(get_db)):
    ticket = (
        db.query(Ticket)
        .options(joinedload(Ticket.notes))
        .filter(Ticket.ticket_id == ticket_id)
        .first()
    )
    if not ticket:
        raise HTTPException(status_code=404, detail="Ticket not found")
    return ticket


@router.put("/{ticket_id}", response_model=TicketUpdateResponse)
def update_ticket(ticket_id: str, payload: TicketUpdate, db: Session = Depends(get_db)):
    ticket = db.query(Ticket).filter(Ticket.ticket_id == ticket_id).first()
    if not ticket:
        raise HTTPException(status_code=404, detail="Ticket not found")

    if payload.status is None and payload.notes is None:
        raise HTTPException(status_code=400, detail="Provide status and/or notes to update")

    if payload.status is not None:
        ticket.status = payload.status

    if payload.notes is not None:
        note = Note(ticket_id=ticket.id, note_text=payload.notes.strip())
        db.add(note)

    ticket.updated_at = datetime.now(timezone.utc)
    db.commit()
    db.refresh(ticket)
    return TicketUpdateResponse(success=True, updated_at=ticket.updated_at)
