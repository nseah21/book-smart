# BookSmart 📚🤓

Booksmart is your **ultimate productivity companion** -- an all-in-one platform that simplifies meeting scheduling, task management, and email organization. With a sleek calendar supporting month, week, and day views, recurring events, and instant email notifications for attendees, Booksmart ensures you're always on top of your schedule. Plus, its **AI-powered** email summarizer transforms lengthy threads into concise, customizable summaries, making inbox management effortless!

## Chosen problem statement

Develop a cost-effective digital PA system for administrators to efficiently arrange and schedule meetings and automate tasks such as sending follow-up tasks to themselves or others, sending reminders, generating summaries of email threads, and arranging meetings (Singapore Book Council)

## Test our app here

🚀 https://booksmart.nseah.dev 🚀

## Features

- 🤖 **AI-powered "bot" that summarises long email threads**
  - Emails can be provided as text or as an exported PDF
  - Users can add special instructions to customise the output
- 🧠 **Retrieval-Augmented Generation (RAG) for email summary**
  - Provides greater context to the bot which can return nuanced responses with insight across many email threads
- 📧 **Self-hosted SMTP client**
  - Cost-effective
  - Immediate notifications to event participants
  - Uses a free Gmail server for sending emails
- 📅 **Supercharged calendar** 
  - Provides a comprehensive UI and dynamic layout for everyone's needs
  - Supports recurring events, color classification, automatic email notifications, and scheduled reminders (coming soon)

## What's next

- AI-powered virtual assistant
- Chat rooms for remote meetings

## Technical implementation

- Frontend: Next.js (later migrated to Vite for ease of deployment)
- Backend: FastAPI server + SQLite database
- AI: GPT-4 + ChromaDB as the vector store
- Deployment: DigitalOcean App Platform

## Instructions for running locally

**Start the Next server**

```
> cd frontend
> npm i
> npm run dev
```

**Add a `.env` file in `backend/` with the following values:**

```
APP_PASSWORD=<password-for-your-mail-server>
EMAIL_SENDER=<email-address-of-your-mail-server>
OPENAI_API_KEY=
```

**Run and seed the backend**

```
> cd backend
> chmod +x run.sh
> ./run.sh
```

If you encounter issues, delete the `data/` folder in `backend/app/` and run `./run.sh` again
