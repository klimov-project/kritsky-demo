from pathlib import Path
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from email.utils import make_msgid

def build_text_email(sender: str, receiver: str, text: str, subject: str | None = None) -> MIMEMultipart:
    if subject is None:
        subject = ""
    msg = MIMEMultipart("alternative")
    msg["Subject"] = subject
    msg["From"] = sender
    msg["To"] = receiver

    msg.attach(MIMEText(text, "plain"))
    return msg

def build_welcome_email(sender: str, receiver: str, link: str) -> MIMEMultipart:
    msg = MIMEMultipart("alternative")
    msg["Subject"] = "Подтверждение регистрации"
    msg["From"] = sender
    msg["To"] = receiver

    path = Path(__file__).parent.parent / 'html_templates' / 'redirect_template.html'
    with open(path, "r") as file:
        html_template = file.read()
    html = (
        html_template
        .replace("{{ redirect_link }}", link)
        .replace("{{ btn_label }}", "Завершить регистрацию")
        .replace(
            "{{ text }}",
            "Спасибо, что пользуетесь нашим сервисом! Перейдите по ссылке ниже, чтобы завершить регистрацию:"
        )
    )
    msg.attach(MIMEText(html, "html"))
    return msg


def build_verification_code_email(sender: str, receiver: str, code: str) -> MIMEMultipart:
    msg = MIMEMultipart("alternative")
    msg["Subject"] = "Код подтверждения"
    msg["From"] = sender
    msg["To"] = receiver
    msg["Message-ID"] = make_msgid(domain=sender.split("@")[-1])

    path = Path(__file__).parent.parent / 'html_templates' / 'code_template.html'
    with open(path, "r") as file:
        html_template = file.read()
    html = (
        html_template
        .replace("{{ code }}", code)
        .replace("{{ text }}", "Ваш код подтверждения:")
    )
    msg.attach(MIMEText(html, "html"))
    return msg

