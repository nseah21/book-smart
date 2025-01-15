from datetime import date, time
from sqlalchemy.orm import Session
from app.database import SessionLocal, engine
from app.models import Base, Meeting, Participant, RecurrenceRule, RecurrenceFrequency

# Ensure tables are created
Base.metadata.create_all(bind=engine)


def seed_data():
    session = SessionLocal()

    session.query(Meeting).delete()
    session.query(Participant).delete()
    session.commit()

    participants = [
        Participant(name="Alice Johnson", email="alice@example.com"),
        Participant(name="Bob Smith", email="bob@example.com"),
        Participant(name="Charlie Lee", email="charlie@example.com"),
        Participant(name="Diana Brown", email="diana@example.com"),
    ]
    session.add_all(participants)
    session.commit()

    # Create sample meetings
    meeting1 = Meeting(
        title="Project Kickoff",
        description="Initial project meeting to discuss goals and timelines.",
        date=date(2025, 1, 16),
        start_time=time(10, 0),
        end_time=time(11, 30),
        participants=[participants[0], participants[1]],
    )

    meeting2 = Meeting(
        title="Design Review",
        description="Review of the new app design.",
        date=date(2025, 1, 17),
        start_time=time(14, 0),
        end_time=time(15, 0),
        participants=[participants[2], participants[3]],
    )

    meeting3 = Meeting(
        title="Weekly Standup",
        description="Weekly sync meeting for the team.",
        date=date(2025, 1, 18),
        start_time=time(9, 0),
        end_time=time(9, 30),
        participants=[participants[0], participants[2], participants[3]],
    )

    session.add_all([meeting1, meeting2, meeting3])
    session.commit()
    
    # Make the meeting recurring
    recurrence = RecurrenceRule(
        meeting_id=meeting3.id,
        frequency=RecurrenceFrequency.WEEKLY,
        interval=1,
        end_date=date(2025, 3, 16),
    )
    session.add(recurrence)
    session.commit()
    
    print("Database seeded successfully!")
    session.close()


if __name__ == "__main__":
    seed_data()
