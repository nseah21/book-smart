from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.database import SessionLocal
from app.models import Meeting, Participant
from typing import List

router = APIRouter()


# Dependency to get DB session
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


@router.post("/", response_model=dict)
def create_meeting(
    title: str,
    description: str,
    date: str,
    start_time: str,
    end_time: str,
    participant_ids: List[int],
    db: Session = Depends(get_db),
):
    participants = (
        db.query(Participant).filter(Participant.id.in_(participant_ids)).all()
    )
    if len(participants) != len(participant_ids):
        raise HTTPException(
            status_code=404, detail="One or more participants not found"
        )

    meeting = Meeting(
        title=title,
        description=description,
        date=date,
        start_time=start_time,
        end_time=end_time,
        participants=participants,
    )
    db.add(meeting)
    db.commit()
    db.refresh(meeting)
    return {"message": "Meeting created successfully", "meeting_id": meeting.id}


@router.get("/", response_model=List[dict])
def get_meetings(db: Session = Depends(get_db)):
    meetings = db.query(Meeting).all()
    return [
        {
            "id": m.id,
            "title": m.title,
            "description": m.description,
            "date": str(m.date),
            "start_time": str(m.start_time),
            "end_time": str(m.end_time),
        }
        for m in meetings
    ]


@router.get("/{meeting_id}", response_model=dict)
def get_meeting(meeting_id: int, db: Session = Depends(get_db)):
    meeting = db.query(Meeting).filter(Meeting.id == meeting_id).first()
    if not meeting:
        raise HTTPException(status_code=404, detail="Meeting not found")
    return {
        "id": meeting.id,
        "title": meeting.title,
        "description": meeting.description,
        "date": str(meeting.date),
        "start_time": str(meeting.start_time),
        "end_time": str(meeting.end_time),
        "participants": [
            {"id": p.id, "name": p.name, "email": p.email} for p in meeting.participants
        ],
    }


@router.delete("/{meeting_id}", response_model=dict)
def delete_meeting(meeting_id: int, db: Session = Depends(get_db)):
    meeting = db.query(Meeting).filter(Meeting.id == meeting_id).first()
    if not meeting:
        raise HTTPException(status_code=404, detail="Meeting not found")
    db.delete(meeting)
    db.commit()
    return {"message": "Meeting deleted successfully"}
