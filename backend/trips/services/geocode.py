"""
Geocoding via OpenStreetMap ecosystem (online, no API key).

Primary: Photon (https://photon.komoot.io)
Fallback: Nominatim (https://nominatim.openstreetmap.org)
"""

from __future__ import annotations

import requests

from trips.services.cache import cached

PHOTON_URL = "https://photon.komoot.io/api/"
NOMINATIM_URL = "https://nominatim.openstreetmap.org/search"
USER_AGENT = "SpotterHOS/1.0"


class GeocodeError(Exception):
    pass


def _parse_photon(item: dict, query: str) -> dict:
    coords = item["geometry"]["coordinates"]
    props = item.get("properties", {})
    name = props.get("name", query)
    parts = [props.get("city"), props.get("state"), props.get("country")]
    display = ", ".join(p for p in [name, *parts] if p)
    return {
        "lat": float(coords[1]),
        "lon": float(coords[0]),
        "display_name": display or query,
        "label": query,
    }


@cached(ttl=86400, prefix="geocode")
def _geocode_photon_single(query: str) -> dict:
    resp = requests.get(
        PHOTON_URL,
        params={"q": query, "limit": 1, "lang": "en"},
        headers={"User-Agent": USER_AGENT},
        timeout=15,
    )
    resp.raise_for_status()
    features = resp.json().get("features", [])
    if not features:
        raise GeocodeError(f"Could not geocode: {query}")
    return _parse_photon(features[0], query)


def search_addresses(query: str, limit: int = 8) -> list[dict]:
    """Autocomplete search — returns list of {label, display_name, lat, lon}."""
    if len(query.strip()) < 2:
        return []
    resp = requests.get(
        PHOTON_URL,
        params={"q": query, "limit": limit, "lang": "en"},
        headers={"User-Agent": USER_AGENT},
        timeout=10,
    )
    resp.raise_for_status()
    results = []
    for item in resp.json().get("features", []):
        parsed = _parse_photon(item, query)
        results.append(
            {
                "value": parsed["display_name"],
                "label": parsed["display_name"],
                "lat": parsed["lat"],
                "lon": parsed["lon"],
            }
        )
    return results


def geocode_address(query: str) -> dict:
    """Return lat, lon, display_name for a free-text address."""
    errors: list[str] = []
    try:
        return _geocode_photon_single(query)
    except Exception as e:
        errors.append(str(e))
    try:
        return _geocode_nominatim(query)
    except Exception as e:
        errors.append(str(e))
    raise GeocodeError("; ".join(errors) or f"Could not geocode: {query}")


def _geocode_nominatim(query: str) -> dict:
    resp = requests.get(
        NOMINATIM_URL,
        params={"q": query, "format": "json", "limit": 1, "addressdetails": 1},
        headers={"User-Agent": USER_AGENT},
        timeout=15,
    )
    resp.raise_for_status()
    data = resp.json()
    if not data:
        raise GeocodeError(f"Could not geocode: {query}")
    item = data[0]
    return {
        "lat": float(item["lat"]),
        "lon": float(item["lon"]),
        "display_name": item.get("display_name", query),
        "label": query,
    }
