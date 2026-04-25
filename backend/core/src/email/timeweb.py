from .base import BaseEmailSenderEngine


class TimewebEmailSenderEngine(BaseEmailSenderEngine):
    def __init__(self, login: str, pwd: str):
        super().__init__('smtp.timeweb.ru', 465, login, pwd)
