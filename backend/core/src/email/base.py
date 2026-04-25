import smtplib
from email.mime.multipart import MIMEMultipart
from core.src.repos.abc import AbcEmailSenderEngine

import aiosmtplib

from .builders import (
    build_welcome_email,
    build_verification_code_email,
    build_text_email,
)
from .errors import EmailError


class BaseEmailSenderEngine(AbcEmailSenderEngine):
    def __init__(self, host: str, port: int, login: str, pwd: str):
        self._host = host
        self._port = port
        self._login = login
        self._pwd = pwd

    async def asend_welcome_email(self, to: str, redirect_link: str):
        message = build_welcome_email(self._login, to, redirect_link)
        await self.asend(to, message)

    async def asend_verification_code(self, to: str, code: str):
        message = build_verification_code_email(self._login, to, code)
        await self.asend(to, message)

    async def asend_text(self, to: str, text: str, subject: str | None = None):
        message = build_text_email(self._login, to, text, subject)
        await self.asend(to, message)

    def send_text(self, to: str, text: str):
        message = build_text_email(self._login, to, text)
        self.send(to, message.as_string())

    def send_verification_code(self, to: str, code: str):
        message = build_verification_code_email(self._login, to, code)
        self.send(to, message.as_string())

    def send_welcome_email(self, to: str, redirect_link: str):
        message = build_welcome_email(self._login, to, redirect_link)
        self.send(to, message.as_string())

    async def asend(self, to: str, message: MIMEMultipart):
        try:
            if self._port == 465:
                await aiosmtplib.send(
                    message,
                    hostname=self._host,
                    port=self._port,
                    username=self._login,
                    password=self._pwd,
                    use_tls=True,
                )
            elif self._port == 587:
                await aiosmtplib.send(
                    message,
                    hostname=self._host,
                    port=self._port,
                    username=self._login,
                    password=self._pwd,
                    start_tls=True,
                )
            else:
                await aiosmtplib.send(
                    message,
                    hostname=self._host,
                    port=self._port,
                    username=self._login,
                    password=self._pwd,
                )
        except Exception as e:
            raise EmailError(f'Error while sending email to {to}: {e}')

    def send(self, to: str, message: str):
        try:
            if self._port == 465:
                client = smtplib.SMTP_SSL(self._host, self._port)
            else:
                client = smtplib.SMTP(self._host, self._port)
                client.ehlo()
                if self._port == 587:
                    client.starttls()

            client.login(self._login, self._pwd)
            client.sendmail(self._login, to, message)
            client.quit()
        except Exception as e:
            raise EmailError(f'Error while sending email to {to}: {e}')
