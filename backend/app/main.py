from fastapi import FastAPI
from app.routers import meetings, participants, recurrences, tasks, categories, reminders

app = FastAPI()


@app.get("/")
async def root():
    return {"message": "Hello World"}


app.include_router(meetings.router, prefix="/meetings", tags=["Meetings"])
app.include_router(participants.router, prefix="/participants", tags=["Participants"])
app.include_router(recurrences.router, prefix="/recurrences", tags=["Recurring Meetings"])
app.include_router(tasks.router, prefix="/tasks", tags=["Task"])
app.include_router(categories.router, prefix="/categories", tags=["Categories"])
app.include_router(reminders.router, prefix="/reminders", tags=["Reminders"])
