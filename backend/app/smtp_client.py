import os
import smtplib
import ssl
from email.message import EmailMessage
from dotenv import load_dotenv

load_dotenv()


# Define reusable email-sending function
def send_email(subject: str, body: str, recipients: list):
    email_sender = os.environ.get("EMAIL_SENDER")
    app_password = os.environ.get("APP_PASSWORD")

    if not email_sender or not app_password:
        raise ValueError("Email sender or app password is not configured properly.")

    for email_receiver in recipients:
        em = EmailMessage()
        em["From"] = email_sender
        em["To"] = email_receiver
        em["Subject"] = subject
        em.set_content(body)

        # Add SSL (layer of security)
        context = ssl.create_default_context()

        # Log in and send the email
        with smtplib.SMTP_SSL("smtp.gmail.com", 465, context=context) as smtp:
            smtp.login(email_sender, app_password)
            smtp.sendmail(email_sender, email_receiver, em.as_string())
            print(f"Email sent to {email_receiver}")
