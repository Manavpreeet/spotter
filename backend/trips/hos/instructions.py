"""
Human-readable route & HOS instructions from scheduled segments.
"""

from __future__ import annotations

from datetime import datetime
from typing import Any

from .models import DutyStatus, RouteLeg, Segment


def _fmt_time(dt: datetime) -> str:
    return dt.strftime("%b %d, %I:%M %p")


def _fmt_duration(hours: float) -> str:
    h = int(hours)
    m = int(round((hours - h) * 60))
    return f"{h}h {m}m" if m else f"{h}h"


def build_route_instructions(
    segments: list[Segment],
    legs: list[RouteLeg],
) -> list[dict[str, Any]]:
    instructions: list[dict[str, Any]] = []

    for i, leg in enumerate(legs, 1):
        instructions.append(
            {
                "step": i,
                "order": i * 1000,
                "type": "leg",
                "title": f"Route leg {i}: {leg.from_label} → {leg.to_label}",
                "detail": f"{leg.miles:.0f} mi · est. {_fmt_duration(leg.duration_hours)} at highway speed",
                "from": leg.from_label,
                "to": leg.to_label,
                "miles": round(leg.miles, 1),
            }
        )

    base = len(legs) * 1000
    for seg in segments:
        kind = "event"
        title = seg.remark or seg.status.value.replace("_", " ").title()

        if seg.status == DutyStatus.ON_DUTY_NOT_DRIVING:
            if "Pickup" in seg.remark:
                kind = "pickup"
            elif "Dropoff" in seg.remark:
                kind = "dropoff"
            elif "Fueling" in seg.remark:
                kind = "fuel"
        elif seg.status == DutyStatus.SLEEPER_BERTH:
            kind = "rest"
            title = f"Sleeper berth — {_fmt_duration(seg.duration_hours)}"
        elif seg.status == DutyStatus.OFF_DUTY:
            if seg.duration_hours >= 9:
                kind = "rest"
                title = f"10-hour off-duty reset — {_fmt_duration(seg.duration_hours)}"
            elif "break" in (seg.remark or "").lower():
                kind = "break"
                title = "30-minute rest break (FMCSA)"
            elif "70/8" in (seg.remark or ""):
                kind = "cycle"
                title = "Off duty — 70/8 cycle recovery"
            elif "34" in (seg.remark or ""):
                kind = "restart"
                title = "34-hour restart"
        elif seg.status == DutyStatus.DRIVING:
            kind = "driving"
            title = seg.remark or f"Driving — {seg.miles:.1f} mi"

        order = int(seg.start.timestamp())
        instructions.append(
            {
                "step": 0,
                "order": order,
                "type": kind,
                "title": title,
                "detail": f"{_fmt_time(seg.start)} – {_fmt_time(seg.end)} · {seg.location}",
                "start": seg.start.isoformat(),
                "end": seg.end.isoformat(),
                "location": seg.location,
                "duration_hours": round(seg.duration_hours, 2),
                "miles": round(seg.miles, 2),
            }
        )

    instructions.sort(key=lambda x: x["order"])
    for n, item in enumerate(instructions, 1):
        item["step"] = n
        item.pop("order", None)

    return instructions


def build_trip_summary_text(
    segments: list[Segment],
    legs: list[RouteLeg],
    total_miles: float,
    estimated_days: int,
) -> str:
    drive_h = sum(s.duration_hours for s in segments if s.status == DutyStatus.DRIVING)
    return (
        f"{total_miles:.0f} total mi · {_fmt_duration(drive_h)} driving · "
        f"{estimated_days} log day(s) · {len(legs)} route leg(s)"
    )
