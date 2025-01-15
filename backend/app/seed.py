from app.database import SessionLocal
from app.models import Base, Task, Meeting, Participant, Category, RecurrenceRule, RecurrenceFrequency
from app.database import engine
from datetime import datetime, date, time

# Ensure tables are created
Base.metadata.create_all(bind=engine)

def seed_data():
    session = SessionLocal()

    # Clear existing data (optional)
    session.query(RecurrenceRule).delete()
    session.query(Task).delete()
    session.query(Meeting).delete()
    session.query(Participant).delete()
    session.query(Category).delete()
    session.commit()

    # Add participants
    alice = Participant(name="Alice Johnson", email="alice@example.com")
    bob = Participant(name="Bob Smith", email="bob@example.com")
    charlie = Participant(name="Charlie Lee", email="charlie@example.com")
    session.add_all([alice, bob, charlie])
    session.commit()

    # Add categories
    work = Category(name="Work")
    personal = Category(name="Personal")
    urgent = Category(name="Urgent")
    session.add_all([work, personal, urgent])
    session.commit()

    # Add tasks
    task1 = Task(
        title="Complete Project Proposal",
        description="Write and submit the project proposal document.",
        due_date=date(2025, 1, 30),
        color="#FF5733",
        categories=[work, urgent]
    )
    task2 = Task(
        title="Buy Groceries",
        description="Purchase groceries for the week.",
        due_date=date(2025, 1, 27),
        color="#33FF57",
        categories=[personal]
    )
    session.add_all([task1, task2])
    session.commit()

    # Add meetings
    meeting1 = Meeting(
        title="Team Sync",
        description="Weekly team sync to discuss project updates.",
        date=date(2025, 1, 25),
        start_time=time(10, 0, 0),
        end_time=time(11, 0, 0),
        color="#FF33A1",
        participants=[alice, bob],
        categories=[work]
    )
    meeting2 = Meeting(
        title="Client Presentation",
        description="Present the project proposal to the client.",
        date=date(2025, 1, 28),
        start_time=time(14, 0, 0),
        end_time=time(15, 30, 0),
        color="#3357FF",
        participants=[alice, charlie],
        categories=[work, urgent]
    )
    session.add_all([meeting1, meeting2])
    session.commit()

    # Add recurring meetings
    recurring_meeting = Meeting(
        title="Weekly Standup",
        description="Weekly team standup to discuss progress and blockers.",
        date=date(2025, 1, 20),
        start_time=time(9, 0, 0),
        end_time=time(9, 30, 0),
        color="#FFA500",
        participants=[alice, bob],
        categories=[work]
    )
    session.add(recurring_meeting)
    session.commit()

    recurrence_rule = RecurrenceRule(
        meeting_id=recurring_meeting.id,
        frequency=RecurrenceFrequency.WEEKLY,
        interval=1,
        end_date=date(2025, 3, 31)  # Recurs weekly until this date
    )
    session.add(recurrence_rule)
    session.commit()

    print("Database seeded successfully!")

if __name__ == "__main__":
    seed_data()
