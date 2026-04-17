from typing import TypeVar

from sqlalchemy import and_, or_

from .utils import is_right_hand_clause_null


AndClauses = TypeVar('AndClauses', bound=list)
OrClauses = TypeVar('OrClauses', bound=list)


class cond_seq:
    def __init__(self, ignore_null_right_hand: bool = True):
        self._need_ignore_null_right_hand = ignore_null_right_hand
        self._and_clauses: list = []
        self._or_clauses: list = []

    def and_(self, clause) -> 'cond_seq':
        if self._need_ignore_null_right_hand and is_right_hand_clause_null(clause):
            return self
        self._and_clauses.append(clause)
        return self

    def or_(self, clause) -> 'cond_seq':
        if self._need_ignore_null_right_hand and is_right_hand_clause_null(clause):
            return self
        self._or_clauses.append(clause)
        return self

    @property
    def clauses(self) -> tuple[AndClauses, OrClauses]:
        return self.and_clauses, self.or_clauses

    @property
    def and_clauses(self) -> AndClauses:
        return and_(*self._and_clauses)

    @property
    def or_clauses(self) -> OrClauses:
        return or_(*self._or_clauses)