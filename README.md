## Problem Statement
Develop a cost-effective digital PA system for administrators to efficiently arrange and schedule meetings and automate tasks such as sending follow-up tasks to themselves or others, sending reminders, generating summaries of email threads, and arranging meetings.

## Instructions for running locally
Start the Next server
```
> cd frontend
> npm i
> npm run dev
```
Run and seed the backend
```
> cd backend
> chmod +x run.sh
> ./run.sh
```

If you encounter issues, delete the `data/` folder in `backend/app/` and run `./run.sh` again

## Features
- AI-powered "bot" that summarises long email threads
    - Emails can be provided as text or as an exported PDF
    - Users can add special instructions to customise the output 
- Retrieval-Augmented Generation (RAG) for email summary
    - Provides greater context to the bot which can return nuanced responses with insight across many email threads 
- Self-hosted SMTP client 
    - Cost-effective
    - Immediate notifications to meeting participants
    - Uses a free Gmail server for sending emails
- Supercharged calendar
    - Provides a comprehensive UI and dynamic layout for everyone's needs
    - Supports recurring events, color classification, automatic email notifications, and scheduled reminders (coming soon)  

## What's next
- AI-powered virtual assistant
- Chat rooms for remote meetings
