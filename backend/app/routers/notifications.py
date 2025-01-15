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
    subject = f"You're Invited: {meeting.title}"
    body = f"""
Hi there,

I hope this message finds you well! You’re invited to join the meeting "{meeting.title}", and we'd love to have you there.

Here are the details:
- Description: {meeting.description or "No description provided"}
- Date: {meeting.date}
- Time: {meeting.start_time} to {meeting.end_time}

Feel free to reach out if you have any questions or need further details. Looking forward to your participation!

Warm regards,  
The Team 
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
    subject = f"Task Assigned: {task.title}"
    body = f"""
Hi there,

You’ve been assigned to the task "{task.title}", and we’re counting on you to get it done!

Here’s what you need to know:
- Description: {task.description or "No description provided"}
- Due Date: {task.due_date}

Let us know if you have any questions or if there’s anything you need to complete the task. We’re here to help!

Best regards,  
The Team 
    """
    recipient_emails = [participant.email for participant in participants]

    # Send email to participants
    try:
        send_email(subject, body, recipient_emails)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to send emails: {str(e)}")

    return {"message": "Notification sent to participants"}