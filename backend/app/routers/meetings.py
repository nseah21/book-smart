from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.database import SessionLocal
from app.models import Meeting, Participant, Category
from typing import List
from datetime import datetime

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
    category_ids: List[int] = None,
    color: str = None,
    db: Session = Depends(get_db),
):
    try:
        date_obj = datetime.strptime(date, "%Y-%m-%d").date()
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid date format. Use YYYY-MM-DD.")

    # Validate participants
    participants = db.query(Participant).filter(Participant.id.in_(participant_ids)).all()
    if len(participants) != len(participant_ids):
        raise HTTPException(
            status_code=404, detail="One or more participants not found"
        )

    # Create the meeting
    meeting = Meeting(
        title=title,
        description=description,
        date=date_obj,
        start_time=start_time,
        end_time=end_time,
        color=color,
        participants=participants,
    )

    # Assign categories if provided
    if category_ids:
        categories = db.query(Category).filter(Category.id.in_(category_ids)).all()
        if len(categories) != len(category_ids):
            raise HTTPException(status_code=404, detail="One or more categories not found")
        meeting.categories = categories

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
            "color": m.color,
            "categories": [{"id": c.id, "name": c.name} for c in m.categories],
            "participants": [
                {"id": p.id, "name": p.name, "email": p.email} for p in m.participants
            ],
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
        "color": meeting.color,
        "categories": [{"id": c.id, "name": c.name} for c in meeting.categories],
        "participants": [
            {"id": p.id, "name": p.name, "email": p.email} for p in meeting.participants
        ],
    }


@router.put("/{meeting_id}", response_model=dict)
def update_meeting(
    meeting_id: int,
    title: str = None,
    description: str = None,
    date: str = None,
    start_time: str = None,
    end_time: str = None,
    color: str = None,
    category_ids: List[int] = None,
    participant_ids: List[int] = None,
    db: Session = Depends(get_db),
):
    meeting = db.query(Meeting).filter(Meeting.id == meeting_id).first()
    if not meeting:
        raise HTTPException(status_code=404, detail="Meeting not found")

    # Update meeting details
    if title:
        meeting.title = title
    if description:
        meeting.description = description
    if date:
        try:
            meeting.date = datetime.strptime(date, "%Y-%m-%d").date()
        except ValueError:
            raise HTTPException(status_code=400, detail="Invalid date format. Use YYYY-MM-DD.")
    if start_time:
        meeting.start_time = start_time
    if end_time:
        meeting.end_time = end_time
    if color:
        meeting.color = color

    # Update categories
    if category_ids is not None:
        categories = db.query(Category).filter(Category.id.in_(category_ids)).all()
        if len(categories) != len(category_ids):
            raise HTTPException(status_code=404, detail="One or more categories not found")
        meeting.categories = categories

    # Update participants
    if participant_ids is not None:
        participants = db.query(Participant).filter(Participant.id.in_(participant_ids)).all()
        if len(participants) != len(participant_ids):
            raise HTTPException(status_code=404, detail="One or more participants not found")
        meeting.participants = participants

    db.commit()
    return {"message": "Meeting updated successfully"}


@router.delete("/{meeting_id}", response_model=dict)
def delete_meeting(meeting_id: int, db: Session = Depends(get_db)):
    meeting = db.query(Meeting).filter(Meeting.id == meeting_id).first()
    if not meeting:
        raise HTTPException(status_code=404, detail="Meeting not found")
    db.delete(meeting)
    db.commit()
    return {"message": "Meeting deleted successfully"}
