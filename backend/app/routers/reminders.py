from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.database import SessionLocal
from app.models import Reminder, Task, Meeting, Participant
from datetime import datetime
from typing import List

router = APIRouter()

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

@router.post("/", response_model=dict)
def create_reminder(
    message: str,
    reminder_time: str,
    task_id: int = None,
    meeting_id: int = None,
    participant_ids: List[int] = None,
    db: Session = Depends(get_db),
):
    if not task_id and not meeting_id:
        raise HTTPException(status_code=400, detail="Either task_id or meeting_id must be provided.")
    if task_id and meeting_id:
        raise HTTPException(status_code=400, detail="Only one of task_id or meeting_id can be provided.")

    # Validate task or meeting
    task = db.query(Task).filter(Task.id == task_id).first() if task_id else None
    meeting = db.query(Meeting).filter(Meeting.id == meeting_id).first() if meeting_id else None

    if task_id and not task:
        raise HTTPException(status_code=404, detail="Task not found")
    if meeting_id and not meeting:
        raise HTTPException(status_code=404, detail="Meeting not found")

    # Validate participants
    participants = db.query(Participant).filter(Participant.id.in_(participant_ids)).all() if participant_ids else []
    if len(participants) != len(participant_ids):
        raise HTTPException(status_code=404, detail="One or more participants not found")

    reminder = Reminder(
        message=message,
        reminder_time=datetime.strptime(reminder_time, "%Y-%m-%d %H:%M:%S"),
        task=task,
        meeting=meeting,
        participants=participants
    )

    db.add(reminder)
    db.commit()
    db.refresh(reminder)
    return {"message": "Reminder created successfully", "reminder_id": reminder.id}

@router.get("/", response_model=List[dict])
def get_reminders(db: Session = Depends(get_db)):
    reminders = db.query(Reminder).all()
    return [
        {
            "id": reminder.id,
            "message": reminder.message,
            "reminder_time": str(reminder.reminder_time),
            "task_id": reminder.task_id,
            "meeting_id": reminder.meeting_id,
            "participants": [{"id": p.id, "name": p.name, "email": p.email} for p in reminder.participants],
        }
        for reminder in reminders
    ]
