from fastapi import APIRouter, UploadFile, File, Form, HTTPException
from typing import Optional
from app.email_summariser import summarize_and_update, load_file, text_to_documents
from pydantic import BaseModel

router = APIRouter()


class SummarizerRequest(BaseModel):
    text: Optional[str] = None
    user_id: str
    user_instructions: Optional[str] = ""


@router.post("/")
async def summarize(
    text: Optional[str] = Form(None),
    file: Optional[UploadFile] = File(None),
    user_id: str = Form(...),
    user_instructions: str = Form(""),
):
    if not text and not file:
        raise HTTPException(
            status_code=400, detail="Either text or a PDF file must be provided."
        )

    docs = []
    if text:
        docs = text_to_documents(text)
    elif file:
        if file.content_type != "application/pdf":
            raise HTTPException(status_code=400, detail="Only PDF files are supported.")
        docs = load_file(await file.read())

    # Generate summary
    try:
        summary = summarize_and_update(user_id, docs, user_instructions)
    except Exception as e:
        raise HTTPException(
            status_code=500, detail=f"Failed to generate summary: {str(e)}"
        )
    print(f"Summary: {summary.content}")
    return {"summary": summary.content}
