"""Polyline helpers for stop placement along a route."""

from __future__ import annotations


def point_at_fraction(polyline: list[list[float]], fraction: float) -> tuple[float, float]:
    """Return [lat, lon] at fraction 0..1 along polyline."""
    if not polyline:
        return 0.0, 0.0
    if fraction <= 0:
        return polyline[0][0], polyline[0][1]
    if fraction >= 1:
        return polyline[-1][0], polyline[-1][1]
    idx = int(fraction * (len(polyline) - 1))
    return polyline[idx][0], polyline[idx][1]


def point_at_miles(
    polyline: list[list[float]],
    miles_along: float,
    total_miles: float,
) -> tuple[float, float]:
    if total_miles <= 0:
        return point_at_fraction(polyline, 0.5)
    return point_at_fraction(polyline, min(1.0, max(0.0, miles_along / total_miles)))
