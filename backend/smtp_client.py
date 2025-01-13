import os
import smtplib
import ssl
from email.message import EmailMessage
from dotenv import load_dotenv

load_dotenv()

# Define email sender and receiver
email_sender = "samteepee298@gmail.com"
app_password = os.environ.get("APP_PASSWORD")
email_receiver = "giansenrockz@gmail.com"

# Set the subject and body of the email
subject = "Check out this funny cat video!"
body = """
I've just watched a video about an orange cat on YouTube: https://youtu.be/5siqfFnLSdw?si=GVM7DIQNmbhzfOpR
"""

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
    print("Success!")
