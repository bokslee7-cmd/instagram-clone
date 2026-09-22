"""커서 페이지네이션 헬퍼 (backend.md 6절).

피드/탐색/게시물목록/댓글/알림은 커서 기반, 팔로워/팔로잉은 오프셋 기반을 쓴다.
커서는 프런트에서 불투명 문자열로만 다루므로 별도 난독화 없이 사람이 읽을 수
있는 형태로 인코딩한다.
"""


def encode_id_cursor(last_id: int) -> str:
    return str(last_id)


def decode_id_cursor(cursor: str | None) -> int | None:
    if cursor is None:
        return None
    try:
        return int(cursor)
    except ValueError:
        return None


def encode_explore_cursor(like_count: int, post_id: int) -> str:
    return f"{like_count}:{post_id}"


def decode_explore_cursor(cursor: str | None) -> tuple[int, int] | None:
    if cursor is None:
        return None
    try:
        like_count_str, id_str = cursor.split(":")
        return int(like_count_str), int(id_str)
    except (ValueError, AttributeError):
        return None
