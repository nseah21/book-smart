from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.database import SessionLocal
from app.models import Meeting, RecurrenceRule, RecurrenceFrequency

router = APIRouter()

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

@router.get("/")
def get_recurring_meetings(db: Session = Depends(get_db)):
    recurring_meetings = db.query(RecurrenceRule).join(Meeting).all()
    
    result = []
    for rule in recurring_meetings:
        result.append({
            "recurrence_id": rule.id,
            "meeting_id": rule.meeting.id,
            "title": rule.meeting.title,
            "description": rule.meeting.description,
            "date": str(rule.meeting.date),
            "start_time": str(rule.meeting.start_time),
            "end_time": str(rule.meeting.end_time),
            "frequency": rule.frequency.value,
            "interval": rule.interval,
            "end_date": str(rule.end_date) if rule.end_date else None,
        })
    
    return {"recurring_meetings": result}

from pydantic import BaseModel
from datetime import date, time
from typing import Optional

class RecurringMeetingRequest(BaseModel):
    title: str
    description: str
    date: date
    start_time: time
    end_time: time
    frequency: RecurrenceFrequency
    interval: int = 1
    end_date: Optional[date] = None

@router.post("/")
def create_recurring_meeting(
    request: RecurringMeetingRequest, db: Session = Depends(get_db)
):
    meeting = Meeting(
        title=request.title,
        description=request.description,
        date=request.date,
        start_time=request.start_time,
        end_time=request.end_time,
    )
    db.add(meeting)
    db.commit()
    db.refresh(meeting)

    recurrence = RecurrenceRule(
        meeting_id=meeting.id,
        frequency=request.frequency,
        interval=request.interval,
        end_date=request.end_date,
    )
    db.add(recurrence)
    db.commit()
    return {"message": "Recurring meeting created", "meeting_id": meeting.id}

