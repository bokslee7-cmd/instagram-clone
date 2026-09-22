from fastapi import HTTPException

DEFAULT_ERROR_CODES: dict[int, str] = {
    401: "UNAUTHORIZED",
    403: "FORBIDDEN",
    404: "NOT_FOUND",
    409: "CONFLICT",
    422: "VALIDATION_ERROR",
}


class AppError(HTTPException):
    """backend.md 7절 에러 응답 표준({"detail", "error_code"})을 위한 예외.

    일반 HTTPException을 raise해도 main.py의 예외 핸들러가 상태 코드 기반
    기본 error_code를 채워주지만, 구체적인 코드(USER_NOT_FOUND 등)가 필요하면
    이 클래스를 사용한다.
    """

    def __init__(self, status_code: int, detail: str, error_code: str) -> None:
        super().__init__(status_code=status_code, detail=detail)
        self.error_code = error_code


def default_error_code(status_code: int) -> str:
    return DEFAULT_ERROR_CODES.get(status_code, "ERROR")
