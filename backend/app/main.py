from fastapi import FastAPI
from app.routers import (
    meetings,
    participants,
    recurrences,
    tasks,
    categories,
    reminders,
    notifications,
    summarizer,
    signup,
    login,
)
from fastapi.middleware.cors import CORSMiddleware

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "https://booksmart.nseah.dev",
        "https://www.booksmart.nseah.dev",
        "https://whale-app-cehwa.ondigitalocean.app",
        "https://www.whale-app-cehwa.ondigitalocean.app",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/")
async def root():
    return {"message": "Hello World"}


app.include_router(meetings.router, prefix="/meetings", tags=["Meetings"])
app.include_router(participants.router, prefix="/participants", tags=["Participants"])
app.include_router(
    recurrences.router, prefix="/recurrences", tags=["Recurring Meetings"]
)
app.include_router(tasks.router, prefix="/tasks", tags=["Task"])
app.include_router(categories.router, prefix="/categories", tags=["Categories"])
app.include_router(reminders.router, prefix="/reminders", tags=["Reminders"])
app.include_router(
    notifications.router, prefix="/notifications", tags=["Notifications"]
)
app.include_router(summarizer.router, prefix="/summarizer", tags=["Summarizer"])
app.include_router(signup.router, prefix="/signup", tags=["Signup"])
app.include_router(login.router, prefix="/login", tags=["Login"])
