from collections.abc import Sequence
from sqlalchemy.sql.elements import BindParameter, Null


def is_right_hand_clause_null(clause):
    flag = False
    if isinstance(clause.right, Null):
        flag = True
    elif isinstance(clause.right, BindParameter) and is_empty(clause.right.value):
        flag = True
    return flag


def is_empty(seq: Sequence) -> bool:
    if isinstance(seq, Sequence) and len(seq) == 0:
        return True
    return False
