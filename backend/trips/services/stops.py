"""Build map stops with positions along route polyline."""

from __future__ import annotations

from trips.hos.models import DutyStatus, SchedulerState
from trips.services.polyline import point_at_fraction, point_at_miles


def build_trip_stops(
    state: SchedulerState,
    current: dict,
    pickup: dict,
    dropoff: dict,
    polyline: list[list[float]],
    total_miles: float,
) -> list[dict]:
    if not state.segments:
        return []

    trip_start = state.segments[0].start
    trip_end = state.segments[-1].end
    total_seconds = max(1.0, (trip_end - trip_start).total_seconds())

    stops: list[dict] = [
        {
            "type": "start",
            "lat": current["lat"],
            "lon": current["lon"],
            "label": current.get("label", "Current"),
            "time": trip_start.isoformat(),
        },
        {
            "type": "pickup",
            "lat": pickup["lat"],
            "lon": pickup["lon"],
            "label": pickup.get("label", "Pickup"),
        },
    ]

    cumulative_miles = 0.0
    for seg in state.segments:
        stop_type = _classify_segment(seg)
        if stop_type and stop_type not in ("pickup", "dropoff", "start"):
            time_fraction = (seg.start - trip_start).total_seconds() / total_seconds
            if stop_type == "fuel":
                lat, lon = point_at_miles(polyline, cumulative_miles, total_miles)
            else:
                lat, lon = point_at_fraction(polyline, time_fraction)

            stops.append(
                {
                    "type": stop_type,
                    "lat": lat,
                    "lon": lon,
                    "label": (seg.remark or stop_type)[:100],
                    "time": seg.start.isoformat(),
                    "duration_hours": round(seg.duration_hours, 2),
                }
            )

        if seg.status == DutyStatus.DRIVING:
            cumulative_miles += seg.miles

    stops.append(
        {
            "type": "dropoff",
            "lat": dropoff["lat"],
            "lon": dropoff["lon"],
            "label": dropoff.get("label", "Dropoff"),
            "time": trip_end.isoformat(),
        }
    )
    return stops


def _classify_segment(seg) -> str | None:
    remark = seg.remark or ""
    if seg.status == DutyStatus.ON_DUTY_NOT_DRIVING:
        if "Pickup" in remark:
            return "pickup"
        if "Dropoff" in remark:
            return "dropoff"
        if "Fueling" in remark:
            return "fuel"
    if seg.status == DutyStatus.DRIVING:
        return None
    if "34-hour" in remark:
        return "restart"
    if "break" in remark.lower():
        return "break"
    if seg.duration_hours >= 9 or seg.status == DutyStatus.SLEEPER_BERTH:
        return "rest"
    if seg.status == DutyStatus.OFF_DUTY and seg.duration_hours >= 1:
        return "rest"
    return None
