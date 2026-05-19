"""Resolve IANA timezone from coordinates."""

from __future__ import annotations

from functools import lru_cache
from zoneinfo import ZoneInfo


@lru_cache(maxsize=512)
def timezone_at(lat: float, lon: float) -> ZoneInfo:
    try:
        from timezonefinder import TimezoneFinder

        tf = TimezoneFinder()
        name = tf.timezone_at(lat=lat, lng=lon)
        if name:
            return ZoneInfo(name)
    except Exception:
        pass
    return _fallback_us_timezone(lon)


def _fallback_us_timezone(lon: float) -> ZoneInfo:
    if lon < -115:
        return ZoneInfo("America/Los_Angeles")
    if lon < -100:
        return ZoneInfo("America/Denver")
    if lon < -85:
        return ZoneInfo("America/Chicago")
    return ZoneInfo("America/New_York")
