"""Simple TTL cache for external API calls."""

from __future__ import annotations

import hashlib
import json
import time
from functools import wraps
from typing import Any, Callable

_STORE: dict[str, tuple[float, Any]] = {}
_DEFAULT_TTL = 3600  # 1 hour


def _key(prefix: str, *args: Any) -> str:
    raw = json.dumps([prefix, *args], sort_keys=True, default=str)
    return hashlib.sha256(raw.encode()).hexdigest()


def cached(ttl: int = _DEFAULT_TTL, prefix: str = ""):
    def decorator(fn: Callable):
        @wraps(fn)
        def wrapper(*args, **kwargs):
            k = _key(prefix or fn.__name__, args, tuple(sorted(kwargs.items())))
            now = time.time()
            if k in _STORE:
                expires, value = _STORE[k]
                if now < expires:
                    return value
            value = fn(*args, **kwargs)
            _STORE[k] = (now + ttl, value)
            return value

        return wrapper

    return decorator


def clear_cache() -> None:
    _STORE.clear()
