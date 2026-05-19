"""
Build FMCSA-style daily log JSON from duty segments.
"""

from __future__ import annotations

from datetime import date, datetime, time, timedelta
from typing import Any

from .constants import CYCLE_ROLLING_DAYS, MAX_CYCLE_ON_DUTY_HOURS
from .models import DutyStatus, SchedulerState, Segment
from .options import TripOptions

STATUS_TO_ROW = {
    DutyStatus.OFF_DUTY: 0,
    DutyStatus.SLEEPER_BERTH: 1,
    DutyStatus.DRIVING: 2,
    DutyStatus.ON_DUTY_NOT_DRIVING: 3,
}

ROW_LABELS = ["Off Duty", "Sleeper Berth", "Driving", "On Duty (not driving)"]


def _minutes_since_midnight(dt: datetime) -> int:
    return dt.hour * 60 + dt.minute


def _clip_segment_to_day(seg: Segment, day: date) -> Segment | None:
    day_start = datetime.combine(day, time.min, tzinfo=seg.start.tzinfo)
    day_end = day_start + timedelta(days=1)
    start = max(seg.start, day_start)
    end = min(seg.end, day_end)
    if start >= end:
        return None
    miles = seg.miles
    if seg.status == DutyStatus.DRIVING and seg.duration_hours > 0:
        ratio = (end - start).total_seconds() / (seg.end - seg.start).total_seconds()
        miles = seg.miles * ratio
    return Segment(
        status=seg.status,
        start=start,
        end=end,
        location=seg.location,
        remark=seg.remark,
        miles=miles if seg.status == DutyStatus.DRIVING else 0.0,
    )


def _format_remark(seg: Segment) -> str:
    t = seg.start.strftime("%H%M")
    status_label = seg.status.value.replace("_", " ").title()
    loc = seg.location[:60] if seg.location else "Unknown"
    return f"{t} — {loc} — {status_label}"


def build_daily_logs(
    state: SchedulerState,
    *,
    from_label: str,
    to_label: str,
    options: TripOptions | None = None,
) -> list[dict[str, Any]]:
    opts = options or TripOptions()
    if not state.segments:
        return []

    first_day = state.segments[0].start.date()
    last_day = state.segments[-1].end.date()
    logs: list[dict[str, Any]] = []
    home = opts.home_terminal or from_label

    day = first_day
    while day <= last_day:
        day_segments: list[Segment] = []
        for seg in state.segments:
            clipped = _clip_segment_to_day(seg, day)
            if clipped:
                day_segments.append(clipped)

        if not day_segments:
            day += timedelta(days=1)
            continue

        grid_segments: list[dict] = []
        remarks: list[str] = []
        miles_today = 0.0
        prev_status: DutyStatus | None = None

        for seg in day_segments:
            start_min = _minutes_since_midnight(seg.start)
            end_min = _minutes_since_midnight(seg.end)
            if end_min <= start_min:
                end_min = 24 * 60
            if seg.status == DutyStatus.DRIVING:
                miles_today += seg.miles
            if prev_status != seg.status:
                remarks.append(_format_remark(seg))
            prev_status = seg.status
            grid_segments.append(
                {
                    "status": seg.status.value,
                    "row": STATUS_TO_ROW[seg.status],
                    "start_minute": start_min,
                    "end_minute": end_min,
                }
            )

        grid_segments.sort(key=lambda g: g["start_minute"])
        filled = _fill_off_duty_gaps(grid_segments)
        row_totals = [0.0, 0.0, 0.0, 0.0]
        for g in filled:
            h = (g["end_minute"] - g["start_minute"]) / 60.0
            row_totals[g["row"]] += h

        on_duty_today = row_totals[2] + row_totals[3]
        tz = state.segments[0].start.tzinfo
        as_of = datetime.combine(day, time(23, 59), tzinfo=tz)
        seven_day = _sum_on_duty_days(state, as_of, 7)
        eight_day = _sum_on_duty_days(state, as_of, 8)

        logs.append(
            {
                "date": day.isoformat(),
                "header": {
                    "from": from_label,
                    "to": to_label,
                    "total_miles_driving": round(miles_today, 1),
                    "carrier_name": opts.carrier_name,
                    "home_terminal": home,
                    "driver_name": opts.driver_name,
                    "co_driver_name": opts.co_driver_name,
                    "vehicle_number": opts.vehicle_number,
                    "trailer_number": opts.trailer_number,
                    "shipping_document": opts.shipping_document,
                    "date_display": day.strftime("%m/%d/%Y"),
                },
                "grid_segments": filled,
                "row_totals": {
                    "off_duty": round(row_totals[0], 2),
                    "sleeper_berth": round(row_totals[1], 2),
                    "driving": round(row_totals[2], 2),
                    "on_duty_not_driving": round(row_totals[3], 2),
                },
                "row_labels": ROW_LABELS,
                "remarks": remarks,
                "recap": {
                    "on_duty_today": round(on_duty_today, 2),
                    "seven_day_total": round(seven_day, 2),
                    "available_tomorrow": round(max(0, MAX_CYCLE_ON_DUTY_HOURS - seven_day), 2),
                    "eight_day_total": round(eight_day, 2),
                },
            }
        )
        day += timedelta(days=1)

    return logs


def _sum_on_duty_days(state: SchedulerState, as_of: datetime, days: int) -> float:
    total = 0.0
    for i in range(days):
        d = (as_of.date() - timedelta(days=i)).isoformat()
        total += state.daily_on_duty.get(d, 0.0)
    return total


def _fill_off_duty_gaps(grid_segments: list[dict]) -> list[dict]:
    if not grid_segments:
        return [
            {
                "status": DutyStatus.OFF_DUTY.value,
                "row": 0,
                "start_minute": 0,
                "end_minute": 24 * 60,
            }
        ]
    filled: list[dict] = []
    cursor = 0
    for g in sorted(grid_segments, key=lambda x: x["start_minute"]):
        if g["start_minute"] > cursor:
            filled.append(
                {
                    "status": DutyStatus.OFF_DUTY.value,
                    "row": 0,
                    "start_minute": cursor,
                    "end_minute": g["start_minute"],
                }
            )
        filled.append(g)
        cursor = max(cursor, g["end_minute"])
    if cursor < 24 * 60:
        filled.append(
            {
                "status": DutyStatus.OFF_DUTY.value,
                "row": 0,
                "start_minute": cursor,
                "end_minute": 24 * 60,
            }
        )
    return filled
