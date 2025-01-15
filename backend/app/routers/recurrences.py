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

@router.post("/")
def create_recurring_meeting(
    title: str,
    description: str,
    date: str,
    start_time: str,
    end_time: str,
    frequency: RecurrenceFrequency,
    interval: int = 1,
    end_date: str = None,
    db: Session = Depends(get_db),
):
    meeting = Meeting(
        title=title,
        description=description,
        date=date,
        start_time=start_time,
        end_time=end_time,
    )
    db.add(meeting)
    db.commit()
    db.refresh(meeting)

    recurrence = RecurrenceRule(
        meeting_id=meeting.id,
        frequency=frequency,
        interval=interval,
        end_date=end_date,
    )
    db.add(recurrence)
    db.commit()
    return {"message": "Recurring meeting created", "meeting_id": meeting.id}
