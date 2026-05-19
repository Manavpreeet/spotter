from datetime import datetime
from zoneinfo import ZoneInfo

from django.test import SimpleTestCase

from trips.hos import RouteLeg, build_daily_logs, schedule_trip
from trips.hos.constants import FUEL_INTERVAL_MILES, MAX_CYCLE_ON_DUTY_HOURS
from trips.hos.instructions import build_route_instructions
from trips.hos.models import DutyStatus
from trips.hos.options import TripOptions


class SchedulerTests(SimpleTestCase):
    def test_short_trip_single_day(self):
        tz = ZoneInfo("America/Chicago")
        start = datetime(2026, 5, 16, 6, 0, tzinfo=tz)
        legs = [
            RouteLeg("Chicago, IL", "Milwaukee, WI", miles=90, duration_hours=1.6),
            RouteLeg("Milwaukee, WI", "Madison, WI", miles=80, duration_hours=1.5),
        ]
        state = schedule_trip(
            legs,
            trip_start=start,
            cycle_used_hours=10,
            pickup_label="Milwaukee, WI",
            dropoff_label="Madison, WI",
        )
        self.assertTrue(any(s.status == DutyStatus.DRIVING for s in state.segments))
        self.assertTrue(
            any(s.status == DutyStatus.ON_DUTY_NOT_DRIVING for s in state.segments)
        )
        logs = build_daily_logs(state, from_label="Chicago", to_label="Madison")
        self.assertGreaterEqual(len(logs), 1)
        total_row_hours = sum(logs[0]["row_totals"].values())
        self.assertAlmostEqual(total_row_hours, 24.0, delta=0.5)

    def test_long_trip_needs_rest(self):
        tz = ZoneInfo("America/Chicago")
        start = datetime(2026, 5, 16, 6, 0, tzinfo=tz)
        legs = [
            RouteLeg("A", "B", miles=50, duration_hours=1.0),
            RouteLeg("B", "C", miles=1200, duration_hours=22.0),
        ]
        state = schedule_trip(
            legs,
            trip_start=start,
            cycle_used_hours=0,
            pickup_label="B",
            dropoff_label="C",
        )
        off_long = [
            s
            for s in state.segments
            if s.status in (DutyStatus.OFF_DUTY, DutyStatus.SLEEPER_BERTH)
            and s.duration_hours >= 9
        ]
        self.assertGreater(len(off_long), 0)
        logs = build_daily_logs(state, from_label="A", to_label="C")
        self.assertGreater(len(logs), 1)

    def test_fuel_stops_on_long_haul(self):
        tz = ZoneInfo("America/Chicago")
        start = datetime(2026, 5, 16, 6, 0, tzinfo=tz)
        legs = [RouteLeg("A", "B", miles=50, duration_hours=1.0), RouteLeg("B", "C", miles=2500, duration_hours=50.0)]
        state = schedule_trip(
            legs,
            trip_start=start,
            cycle_used_hours=0,
            pickup_label="B",
            dropoff_label="C",
        )
        fuel = [s for s in state.segments if "Fueling" in (s.remark or "")]
        self.assertGreaterEqual(len(fuel), 2)

    def test_sleeper_berth_option(self):
        tz = ZoneInfo("America/Chicago")
        start = datetime(2026, 5, 16, 6, 0, tzinfo=tz)
        legs = [RouteLeg("A", "B", miles=50, duration_hours=1.0), RouteLeg("B", "C", miles=1200, duration_hours=22.0)]
        opts = TripOptions(use_sleeper_berth=True)
        state = schedule_trip(
            legs,
            trip_start=start,
            cycle_used_hours=0,
            pickup_label="B",
            dropoff_label="C",
            options=opts,
        )
        sleeper = [s for s in state.segments if s.status == DutyStatus.SLEEPER_BERTH]
        self.assertGreater(len(sleeper), 0)

    def test_route_instructions_chronological(self):
        tz = ZoneInfo("America/Chicago")
        start = datetime(2026, 5, 16, 6, 0, tzinfo=tz)
        legs = [RouteLeg("Chicago", "Denver", miles=1000, duration_hours=18.0)]
        state = schedule_trip(
            legs,
            trip_start=start,
            cycle_used_hours=5,
            pickup_label="Chicago",
            dropoff_label="Denver",
        )
        instructions = build_route_instructions(state.segments, legs)
        self.assertGreater(len(instructions), 0)
        steps = [i["step"] for i in instructions]
        self.assertEqual(steps, sorted(steps))

    def test_prior_cycle_daily_hours(self):
        tz = ZoneInfo("America/Chicago")
        start = datetime(2026, 5, 16, 6, 0, tzinfo=tz)
        opts = TripOptions(prior_cycle_daily_hours=[10, 10, 10, 10, 10, 10, 10])
        state = schedule_trip(
            [RouteLeg("A", "B", miles=100, duration_hours=2.0)],
            trip_start=start,
            cycle_used_hours=70,
            pickup_label="A",
            dropoff_label="B",
            options=opts,
        )
        total_prior = sum(
            state.daily_on_duty.get((start.date() - __import__("datetime").timedelta(days=i)).isoformat(), 0)
            for i in range(1, 8)
        )
        self.assertAlmostEqual(total_prior, 70.0, delta=0.1)
