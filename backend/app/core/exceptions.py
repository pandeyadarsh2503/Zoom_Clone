from __future__ import annotations

from fastapi import FastAPI, Request
from fastapi.responses import JSONResponse


class AppException(Exception):
    """
    Base class for all domain-level exceptions.

    Carrying a machine-readable `code` alongside the human-readable `message`
    lets clients handle errors programmatically without parsing strings.
    """

    def __init__(self, code: str, message: str, status_code: int = 400) -> None:
        self.code = code
        self.message = message
        self.status_code = status_code
        super().__init__(message)


class NotFoundException(AppException):
    """Raised when a requested resource does not exist."""

    def __init__(self, resource: str, identifier: str) -> None:
        super().__init__(
            code="NOT_FOUND",
            message=f"{resource} with identifier '{identifier}' was not found.",
            status_code=404,
        )


class ConflictException(AppException):
    """Raised when a unique constraint would be violated."""

    def __init__(self, message: str) -> None:
        super().__init__(code="CONFLICT", message=message, status_code=409)


class UnprocessableException(AppException):
    """Raised when input is syntactically valid but semantically wrong."""

    def __init__(self, message: str) -> None:
        super().__init__(code="UNPROCESSABLE", message=message, status_code=422)


class ForbiddenException(AppException):
    """Raised when the caller lacks permission for the requested action."""

    def __init__(self, message: str = "You do not have permission to perform this action.") -> None:
        super().__init__(code="FORBIDDEN", message=message, status_code=403)


def register_exception_handlers(app: FastAPI) -> None:
    """
    Attach global exception handlers to a FastAPI instance.

    All AppException subclasses produce a consistent JSON envelope:
        { "detail": { "code": "...", "message": "..." } }
    """

    @app.exception_handler(AppException)
    async def _app_exception_handler(request: Request, exc: AppException) -> JSONResponse:
        return JSONResponse(
            status_code=exc.status_code,
            content={"detail": {"code": exc.code, "message": exc.message}},
        )
