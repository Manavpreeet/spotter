"""
Plan a full trip: geocode -> route -> HOS schedule -> daily logs.
"""

from __future__ import annotations

from concurrent.futures import ThreadPoolExecutor
from datetime import datetime

from trips.hos import RouteLeg, build_daily_logs, schedule_trip
from trips.hos.constants import DEFAULT_AVG_SPEED_MPH
from trips.hos.instructions import build_route_instructions, build_trip_summary_text
from trips.hos.options import TripOptions
from trips.services.geocode import GeocodeError, geocode_address
from trips.services.routing import RoutingError, leg_duration_hours, route_waypoints
from trips.services.stops import build_trip_stops
from trips.services.timezone import timezone_at


def _trip_options_from_dict(data: dict | None) -> TripOptions:
    if not data:
        return TripOptions()
    prior = data.get("prior_cycle_daily_hours")
    if prior is not None:
        prior = [float(x) for x in prior[:7]]
    return TripOptions(
        use_sleeper_berth=bool(data.get("use_sleeper_berth", False)),
        allow_34_hour_restart=bool(data.get("allow_34_hour_restart", False)),
        carrier_name=data.get("carrier_name") or "Spotter Transport LLC",
        driver_name=data.get("driver_name") or "",
        co_driver_name=data.get("co_driver_name") or "",
        vehicle_number=data.get("vehicle_number") or "",
        trailer_number=data.get("trailer_number") or "",
        shipping_document=data.get("shipping_document") or "",
        home_terminal=data.get("home_terminal") or "",
        prior_cycle_daily_hours=prior,
    )


def plan_trip(
    current_location: str,
    pickup_location: str,
    dropoff_location: str,
    current_cycle_used_hours: float,
    *,
    trip_start: datetime | None = None,
    options: dict | None = None,
) -> dict:
    opts = _trip_options_from_dict(options)

    with ThreadPoolExecutor(max_workers=3) as pool:
        f_current = pool.submit(geocode_address, current_location)
        f_pickup = pool.submit(geocode_address, pickup_location)
        f_dropoff = pool.submit(geocode_address, dropoff_location)
        current = f_current.result()
        pickup = f_pickup.result()
        dropoff = f_dropoff.result()

    waypoints = [
        (current["lon"], current["lat"]),
        (pickup["lon"], pickup["lat"]),
        (dropoff["lon"], dropoff["lat"]),
    ]
    route = route_waypoints(waypoints)

    tz = timezone_at(current["lat"], current["lon"])
    if trip_start is None:
        trip_start = datetime.now(tz).replace(hour=6, minute=0, second=0, microsecond=0)
    elif trip_start.tzinfo is None:
        trip_start = trip_start.replace(tzinfo=tz)

    legs_data = route["legs"]
    hos_legs: list[RouteLeg] = []
    if len(legs_data) >= 2:
        hos_legs = [
            RouteLeg(
                from_label=current["display_name"],
                to_label=pickup["display_name"],
                miles=legs_data[0]["distance_miles"],
                duration_hours=leg_duration_hours(
                    legs_data[0]["distance_miles"], legs_data[0]["duration_hours"]
                ),
            ),
            RouteLeg(
                from_label=pickup["display_name"],
                to_label=dropoff["display_name"],
                miles=legs_data[1]["distance_miles"],
                duration_hours=leg_duration_hours(
                    legs_data[1]["distance_miles"], legs_data[1]["duration_hours"]
                ),
            ),
        ]
    else:
        hos_legs = [
            RouteLeg(
                from_label=current["display_name"],
                to_label=dropoff["display_name"],
                miles=route["distance_miles"],
                duration_hours=leg_duration_hours(
                    route["distance_miles"], route["duration_hours"]
                ),
            )
        ]

    if not opts.home_terminal:
        opts.home_terminal = current.get("label", current_location)

    state = schedule_trip(
        hos_legs,
        trip_start=trip_start,
        cycle_used_hours=current_cycle_used_hours,
        pickup_label=pickup["display_name"],
        dropoff_label=dropoff["display_name"],
        options=opts,
    )

    daily_logs = build_daily_logs(
        state,
        from_label=current.get("label", current_location),
        to_label=dropoff.get("label", dropoff_location),
        options=opts,
    )

    total_miles = route["distance_miles"]
    stops = build_trip_stops(state, current, pickup, dropoff, route["polyline"], total_miles)
    instructions = build_route_instructions(state.segments, hos_legs)

    return {
        "route": {
            "total_miles": round(total_miles, 1),
            "duration_hours": round(route["duration_hours"], 2),
            "polyline": route["polyline"],
            "estimated_days": len(daily_logs),
            "legs": [
                {
                    "from": leg.from_label,
                    "to": leg.to_label,
                    "miles": round(leg.miles, 1),
                    "duration_hours": round(leg.duration_hours, 2),
                }
                for leg in hos_legs
            ],
        },
        "locations": {
            "current": current,
            "pickup": pickup,
            "dropoff": dropoff,
        },
        "stops": stops,
        "route_instructions": instructions,
        "segments": [
            {
                "status": s.status.value,
                "start": s.start.isoformat(),
                "end": s.end.isoformat(),
                "location": s.location,
                "remark": s.remark,
                "miles": round(s.miles, 2),
            }
            for s in state.segments
        ],
        "daily_logs": daily_logs,
        "warnings": state.warnings,
        "summary": build_trip_summary_text(
            state.segments, hos_legs, total_miles, len(daily_logs)
        ),
        "timezone": str(tz),
        "options_applied": {
            "use_sleeper_berth": opts.use_sleeper_berth,
            "allow_34_hour_restart": opts.allow_34_hour_restart,
        },
    }


__all__ = ["plan_trip", "GeocodeError", "RoutingError"]
