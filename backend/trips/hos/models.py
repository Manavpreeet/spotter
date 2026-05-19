from dataclasses import dataclass, field
from datetime import datetime
from enum import Enum


class DutyStatus(str, Enum):
    OFF_DUTY = "OFF_DUTY"
    SLEEPER_BERTH = "SLEEPER_BERTH"
    DRIVING = "DRIVING"
    ON_DUTY_NOT_DRIVING = "ON_DUTY_NOT_DRIVING"


@dataclass
class Segment:
    status: DutyStatus
    start: datetime
    end: datetime
    location: str
    remark: str = ""
    miles: float = 0.0

    @property
    def duration_hours(self) -> float:
        return (self.end - self.start).total_seconds() / 3600.0


@dataclass
class RouteLeg:
    """One drivable leg with precomputed distance and duration."""

    from_label: str
    to_label: str
    miles: float
    duration_hours: float


@dataclass
class SchedulerState:
    segments: list[Segment] = field(default_factory=list)
    warnings: list[str] = field(default_factory=list)
    # Rolling on-duty hours per calendar date (ISO date string -> hours)
    daily_on_duty: dict[str, float] = field(default_factory=dict)
    miles_since_fuel: float = 0.0
    trip_miles_driven: float = 0.0

    # Current shift clocks
    shift_start: datetime | None = None
    driving_in_shift_hours: float = 0.0
    driving_since_break_hours: float = 0.0
    window_elapsed_hours: float = 0.0

    @property
    def clock(self) -> datetime:
        if self.segments:
            return self.segments[-1].end
        raise RuntimeError("Scheduler has no segments yet")
