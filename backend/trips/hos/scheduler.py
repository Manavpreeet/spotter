"""
HOS duty scheduler for property-carrying drivers (70/8, 11/14, 30-min break).
"""

from __future__ import annotations

from datetime import datetime, timedelta

from .constants import (
    BREAK_AFTER_DRIVING_HOURS,
    BREAK_DURATION_MINUTES,
    CYCLE_ROLLING_DAYS,
    DROPOFF_DURATION_HOURS,
    FUEL_INTERVAL_MILES,
    FUEL_STOP_HOURS,
    MAX_CYCLE_ON_DUTY_HOURS,
    MAX_DRIVING_HOURS,
    MAX_WINDOW_HOURS,
    MIN_OFF_DUTY_HOURS,
    PICKUP_DURATION_HOURS,
    RESTART_34_HOURS,
)
from .models import DutyStatus, RouteLeg, SchedulerState, Segment
from .options import TripOptions


def _on_duty_status(status: DutyStatus) -> bool:
    return status in (DutyStatus.DRIVING, DutyStatus.ON_DUTY_NOT_DRIVING)


def _record_on_duty(state: SchedulerState, start: datetime, end: datetime) -> None:
    """Split on-duty time across calendar days for accurate recap."""
    if end <= start:
        return
    cursor = start
    while cursor < end:
        day_end = datetime.combine(
            cursor.date() + timedelta(days=1),
            datetime.min.time(),
            tzinfo=cursor.tzinfo,
        )
        chunk_end = min(end, day_end)
        hours = (chunk_end - cursor).total_seconds() / 3600.0
        day = cursor.date().isoformat()
        state.daily_on_duty[day] = state.daily_on_duty.get(day, 0.0) + hours
        cursor = chunk_end


def _rolling_cycle_hours(state: SchedulerState, as_of: datetime) -> float:
    total = 0.0
    for i in range(CYCLE_ROLLING_DAYS):
        d = (as_of.date() - timedelta(days=i)).isoformat()
        total += state.daily_on_duty.get(d, 0.0)
    return total


def _add_segment(
    state: SchedulerState,
    status: DutyStatus,
    start: datetime,
    duration_hours: float,
    location: str,
    remark: str = "",
    miles: float = 0.0,
) -> datetime:
    end = start + timedelta(hours=duration_hours)
    seg = Segment(
        status=status,
        start=start,
        end=end,
        location=location,
        remark=remark,
        miles=miles,
    )
    state.segments.append(seg)
    if _on_duty_status(status):
        _record_on_duty(state, start, end)
    return end


def _start_new_shift(state: SchedulerState, t: datetime, location: str) -> datetime:
    state.shift_start = t
    state.driving_in_shift_hours = 0.0
    state.driving_since_break_hours = 0.0
    state.window_elapsed_hours = 0.0
    return t


def _long_rest(
    state: SchedulerState,
    t: datetime,
    location: str,
    hours: float,
    remark: str,
    options: TripOptions,
) -> datetime:
    status = options.rest_status() if hours >= MIN_OFF_DUTY_HOURS else DutyStatus.OFF_DUTY
    if hours >= MIN_OFF_DUTY_HOURS and not options.use_sleeper_berth:
        status = DutyStatus.OFF_DUTY
    elif hours >= MIN_OFF_DUTY_HOURS:
        status = DutyStatus.SLEEPER_BERTH
    return _add_segment(state, status, t, hours, location, remark=remark)


def _ten_hour_reset(state: SchedulerState, t: datetime, location: str, options: TripOptions) -> datetime:
    t = _long_rest(
        state,
        t,
        location,
        MIN_OFF_DUTY_HOURS,
        f"10-hour reset at {location}",
        options,
    )
    return _start_new_shift(state, t, location)


def _maybe_break(state: SchedulerState, t: datetime, location: str) -> datetime:
    if state.driving_since_break_hours >= BREAK_AFTER_DRIVING_HOURS:
        t = _add_segment(
            state,
            DutyStatus.OFF_DUTY,
            t,
            BREAK_DURATION_MINUTES / 60.0,
            location,
            remark="30-minute break after 8 hours driving",
        )
        state.driving_since_break_hours = 0.0
    return t


def _need_reset(state: SchedulerState) -> bool:
    return (
        state.driving_in_shift_hours >= MAX_DRIVING_HOURS
        or state.window_elapsed_hours >= MAX_WINDOW_HOURS
    )


def _can_drive(state: SchedulerState, t: datetime) -> bool:
    if _rolling_cycle_hours(state, t) >= MAX_CYCLE_ON_DUTY_HOURS:
        return False
    if state.shift_start is None:
        return True
    if _need_reset(state):
        return False
    return state.driving_in_shift_hours < MAX_DRIVING_HOURS


def _ensure_shift(
    state: SchedulerState, t: datetime, location: str, options: TripOptions
) -> datetime:
    if state.shift_start is None:
        return _start_new_shift(state, t, location)
    if _need_reset(state):
        return _ten_hour_reset(state, t, location, options)
    return t


def _ensure_cycle_capacity(
    state: SchedulerState, t: datetime, location: str, options: TripOptions
) -> datetime:
    while _rolling_cycle_hours(state, t) >= MAX_CYCLE_ON_DUTY_HOURS:
        if options.allow_34_hour_restart:
            state.warnings.append("70/8 limit: applying 34-hour restart.")
            t = _long_rest(
                state,
                t,
                location,
                RESTART_34_HOURS,
                "34-hour restart — cycle reset",
                options,
            )
            state.daily_on_duty.clear()
            return t
        state.warnings.append(
            "70-hour/8-day limit reached; inserting 10-hour off-duty periods."
        )
        t = _ten_hour_reset(state, t, location, options)
    return t


def _drive_chunk(
    state: SchedulerState,
    t: datetime,
    location: str,
    miles: float,
    hours: float,
    options: TripOptions,
) -> tuple[datetime, float, float]:
    t = _ensure_shift(state, t, location, options)
    t = _ensure_cycle_capacity(state, t, location, options)
    t = _maybe_break(state, t, location)

    if not _can_drive(state, t):
        t = _ten_hour_reset(state, t, location, options)
        t = _maybe_break(state, t, location)

    remaining_drive_h = MAX_DRIVING_HOURS - state.driving_in_shift_hours
    remaining_window_h = MAX_WINDOW_HOURS - state.window_elapsed_hours
    remaining_break_h = BREAK_AFTER_DRIVING_HOURS - state.driving_since_break_hours

    chunk_h = min(hours, remaining_drive_h, remaining_window_h, remaining_break_h)
    if chunk_h <= 0:
        t = _ten_hour_reset(state, t, location, options)
        remaining_drive_h = MAX_DRIVING_HOURS
        remaining_window_h = MAX_WINDOW_HOURS
        remaining_break_h = BREAK_AFTER_DRIVING_HOURS
        chunk_h = min(hours, remaining_drive_h, remaining_window_h, remaining_break_h)

    ratio = chunk_h / hours if hours > 0 else 1.0
    chunk_miles = miles * ratio

    t = _add_segment(
        state,
        DutyStatus.DRIVING,
        t,
        chunk_h,
        location,
        remark=f"Driving — {chunk_miles:.1f} mi",
        miles=chunk_miles,
    )
    state.driving_in_shift_hours += chunk_h
    state.driving_since_break_hours += chunk_h
    state.window_elapsed_hours += chunk_h
    state.miles_since_fuel += chunk_miles
    state.trip_miles_driven += chunk_miles

    return t, chunk_miles, chunk_h


def _drive_leg(
    state: SchedulerState,
    t: datetime,
    leg: RouteLeg,
    options: TripOptions,
) -> datetime:
    miles_left = leg.miles
    hours_left = leg.duration_hours
    location = leg.from_label

    while miles_left > 0.01 and hours_left > 0.001:
        if state.miles_since_fuel >= FUEL_INTERVAL_MILES:
            t = _ensure_shift(state, t, location, options)
            t = _add_segment(
                state,
                DutyStatus.ON_DUTY_NOT_DRIVING,
                t,
                FUEL_STOP_HOURS,
                location,
                remark=f"Fueling — every {FUEL_INTERVAL_MILES:.0f} mi",
            )
            state.window_elapsed_hours += FUEL_STOP_HOURS
            state.miles_since_fuel = 0.0

        t, drove_mi, drove_h = _drive_chunk(
            state, t, location, miles_left, hours_left, options
        )
        miles_left -= drove_mi
        hours_left -= drove_h
        location = leg.to_label if miles_left < leg.miles * 0.5 else leg.from_label

    return t


def seed_prior_cycle(
    state: SchedulerState,
    cycle_used_hours: float,
    start: datetime,
    options: TripOptions,
) -> None:
    if options.prior_cycle_daily_hours:
        hours_list = options.prior_cycle_daily_hours[:7]
        for i, hrs in enumerate(hours_list, 1):
            d = (start.date() - timedelta(days=i)).isoformat()
            state.daily_on_duty[d] = state.daily_on_duty.get(d, 0.0) + float(hrs)
        return
    if cycle_used_hours <= 0:
        return
    per_day = cycle_used_hours / 7.0
    for i in range(1, 8):
        d = (start.date() - timedelta(days=i)).isoformat()
        state.daily_on_duty[d] = state.daily_on_duty.get(d, 0.0) + per_day


def schedule_trip(
    legs: list[RouteLeg],
    *,
    trip_start: datetime,
    cycle_used_hours: float = 0.0,
    pickup_label: str,
    dropoff_label: str,
    options: TripOptions | None = None,
) -> SchedulerState:
    opts = options or TripOptions()
    state = SchedulerState()
    seed_prior_cycle(state, cycle_used_hours, trip_start, opts)

    t = trip_start
    state.shift_start = None

    if (
        opts.allow_34_hour_restart
        and cycle_used_hours >= MAX_CYCLE_ON_DUTY_HOURS - 10
    ):
        t = _long_rest(
            state,
            t,
            pickup_label,
            RESTART_34_HOURS,
            "34-hour restart before trip",
            opts,
        )
        state.daily_on_duty.clear()

    if len(legs) >= 1:
        t = _drive_leg(state, t, legs[0], opts)

    t = _add_segment(
        state,
        DutyStatus.ON_DUTY_NOT_DRIVING,
        t,
        PICKUP_DURATION_HOURS,
        pickup_label,
        remark=f"Pickup — {pickup_label}",
    )
    state.window_elapsed_hours += PICKUP_DURATION_HOURS

    if len(legs) >= 2:
        t = _drive_leg(state, t, legs[1], opts)

    t = _add_segment(
        state,
        DutyStatus.ON_DUTY_NOT_DRIVING,
        t,
        DROPOFF_DURATION_HOURS,
        dropoff_label,
        remark=f"Dropoff — {dropoff_label}",
    )
    state.window_elapsed_hours += DROPOFF_DURATION_HOURS

    return state
