from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.database import SessionLocal
from app.models import Meeting, Task
from app.smtp_client import send_email
from typing import List

router = APIRouter()


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


@router.post("/notify-meeting")
def notify_meeting(meeting_id: int, db: Session = Depends(get_db)):
    # Fetch the meeting and its participants
    meeting = db.query(Meeting).filter(Meeting.id == meeting_id).first()
    if not meeting:
        raise HTTPException(status_code=404, detail="Meeting not found")

    participants = meeting.participants
    if not participants:
        return {"message": "No participants to notify"}

    # Prepare email details
    subject = f"Reminder: {meeting.title}"
    body = f"""
Hi,

You are invited to the meeting "{meeting.title}".

Details:
- Description: {meeting.description}
- Date: {meeting.date}
- Time: {meeting.start_time} to {meeting.end_time}

Please let us know if you have any questions.

Regards,
Admin
    """
    recipient_emails = [participant.email for participant in participants]

    # Send email to participants
    try:
        send_email(subject, body, recipient_emails)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to send emails: {str(e)}")

    return {"message": "Notification sent to participants"}


@router.post("/notify-task")
def notify_task(task_id: int, db: Session = Depends(get_db)):
    # Fetch the task and its participants
    task = db.query(Task).filter(Task.id == task_id).first()
    if not task:
        raise HTTPException(status_code=404, detail="Task not found")

    participants = task.participants
    if not participants:
        return {"message": "No participants to notify"}

    # Prepare email details
    subject = f"Task Reminder: {task.title}"
    body = f"""
Hi,

You have been assigned to the task "{task.title}".

Details:
- Description: {task.description}
- Due Date: {task.due_date}

Please ensure the task is completed by the due date. Let us know if you have any questions.

Regards,
Admin
    """
    recipient_emails = [participant.email for participant in participants]

    # Send email to participants
    try:
        send_email(subject, body, recipient_emails)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to send emails: {str(e)}")

    return {"message": "Notification sent to participants"}
