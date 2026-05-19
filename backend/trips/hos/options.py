"""Extensible trip / HOS scheduling options."""

from dataclasses import dataclass, field


@dataclass
class TripOptions:
    """Pass-through options for scheduler and log builder."""

    use_sleeper_berth: bool = False
    allow_34_hour_restart: bool = False
    carrier_name: str = "Spotter Transport LLC"
    driver_name: str = ""
    co_driver_name: str = ""
    vehicle_number: str = ""
    trailer_number: str = ""
    shipping_document: str = ""
    home_terminal: str = ""
    # Optional: on-duty hours for each of the 7 days before trip (index 0 = yesterday)
    prior_cycle_daily_hours: list[float] | None = None

    def rest_status(self):
        from .models import DutyStatus

        return DutyStatus.SLEEPER_BERTH if self.use_sleeper_berth else DutyStatus.OFF_DUTY
