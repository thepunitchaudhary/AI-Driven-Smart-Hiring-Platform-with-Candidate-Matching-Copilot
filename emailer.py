import os
import smtplib
from email.message import EmailMessage


def send_email(to_address, subject, body):
    host = os.getenv("SMTP_HOST", "smtp.gmail.com")
    port = int(os.getenv("SMTP_PORT", "587"))
    user = os.getenv("SMTP_USER", "")
    password = os.getenv("SMTP_PASSWORD", "")
    if user == "" or password == "":
        return "not configured"

    message = EmailMessage()
    message["Subject"] = subject
    message["From"] = os.getenv("EMAIL_FROM", "") or user
    message["To"] = to_address
    message.set_content(body)

    try:
        with smtplib.SMTP(host, port, timeout=10) as server:
            server.starttls()
            server.login(user, password)
            server.send_message(message)
        return "sent"
    except Exception as error:
        return "failed: " + str(error)[:100]


def portal_name(role):
    names = {"hr": "HR Manager", "candidate": "Candidate"}
    return names.get(role, role)


def send_approval_email(user):
    link = os.getenv("APP_URL", "http://localhost:5173")
    body = (
        "Hello " + user["name"] + ",\n\n"
        "Good news! Your " + portal_name(user["role"]) + " account on Recruitment Copilot "
        "has been approved by the admin.\n\n"
        "You can now sign in here: " + link + "\n"
        "Choose the " + portal_name(user["role"]) + " portal and use the email and password you signed up with.\n\n"
        "Recruitment Copilot"
    )
    return send_email(user["email"], "Your Recruitment Copilot account is approved", body)


def send_rejection_email(user):
    body = (
        "Hello " + user["name"] + ",\n\n"
        "Your " + portal_name(user["role"]) + " account request on Recruitment Copilot "
        "was not approved by the admin.\n"
        "Please contact the admin if you think this is a mistake.\n\n"
        "Recruitment Copilot"
    )
    return send_email(user["email"], "Your Recruitment Copilot account request", body)


def send_reset_email(user, link):
    body = (
        "Hello " + user["name"] + ",\n\n"
        "We received a request to reset your Recruitment Copilot password.\n\n"
        "Open this link to choose a new password. It works for 30 minutes and only once:\n"
        + link + "\n\n"
        "If you did not ask for this, you can ignore this email. Your password will stay the same.\n\n"
        "Recruitment Copilot"
    )
    return send_email(user["email"], "Reset your Recruitment Copilot password", body)
