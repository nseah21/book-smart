from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.database import SessionLocal
from app.models import Participant
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
def create_participant(name: str, email: str, db: Session = Depends(get_db)):
    participant = Participant(name=name, email=email)
    db.add(participant)
    db.commit()
    db.refresh(participant)
    return {
        "message": "Participant created successfully",
        "participant_id": participant.id,
    }


@router.get("/", response_model=List[dict])
def get_participants(db: Session = Depends(get_db)):
    participants = db.query(Participant).all()
    return [{"id": p.id, "name": p.name, "email": p.email} for p in participants]


@router.get("/{participant_id}", response_model=dict)
def get_participant(participant_id: int, db: Session = Depends(get_db)):
    participant = db.query(Participant).filter(Participant.id == participant_id).first()
    if not participant:
        raise HTTPException(status_code=404, detail="Participant not found")
    return {"id": participant.id, "name": participant.name, "email": participant.email}


@router.delete("/{participant_id}", response_model=dict)
def delete_participant(participant_id: int, db: Session = Depends(get_db)):
    participant = db.query(Participant).filter(Participant.id == participant_id).first()
    if not participant:
        raise HTTPException(status_code=404, detail="Participant not found")
    db.delete(participant)
    db.commit()
    return {"message": "Participant deleted successfully"}
