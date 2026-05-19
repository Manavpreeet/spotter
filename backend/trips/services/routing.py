"""
Driving routes via OSRM public demo server.
https://project-osrm.org/
"""

from __future__ import annotations

import requests

from trips.hos.constants import DEFAULT_AVG_SPEED_MPH

OSRM_ROUTE_URL = "https://router.project-osrm.org/route/v1/driving"


class RoutingError(Exception):
    pass


def route_waypoints(waypoints: list[tuple[float, float]]) -> dict:
    """
    waypoints: [(lon, lat), ...] in visit order.
    Returns distance_miles, duration_hours, polyline coordinates [lat, lon], legs.
    """
    if len(waypoints) < 2:
        raise RoutingError("At least two waypoints required")

    coord_str = ";".join(f"{lon},{lat}" for lon, lat in waypoints)
    url = f"{OSRM_ROUTE_URL}/{coord_str}"
    params = {"overview": "full", "geometries": "geojson", "steps": "false"}
    resp = requests.get(url, params=params, timeout=30)
    resp.raise_for_status()
    data = resp.json()
    if data.get("code") != "Ok" or not data.get("routes"):
        raise RoutingError(data.get("message", "Routing failed"))

    route = data["routes"][0]
    distance_miles = route["distance"] / 1609.34
    duration_hours = route["duration"] / 3600.0

    coords = route["geometry"]["coordinates"]
    polyline = [[lat, lon] for lon, lat in coords]

    legs = []
    for leg in route.get("legs", []):
        legs.append(
            {
                "distance_miles": leg["distance"] / 1609.34,
                "duration_hours": leg["duration"] / 3600.0,
            }
        )

    return {
        "distance_miles": distance_miles,
        "duration_hours": duration_hours,
        "polyline": polyline,
        "legs": legs,
    }


def leg_duration_hours(miles: float, duration_hours: float | None = None) -> float:
    if duration_hours and duration_hours > 0:
        return duration_hours
    return miles / DEFAULT_AVG_SPEED_MPH
