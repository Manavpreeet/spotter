import { useEffect, useState } from "react";
import { fetchRoutePreview } from "../api/routePreview";
import { resolveLocation, type ResolvedLocation } from "../utils/resolveLocation";

export interface PreviewLocations {
  current: ResolvedLocation | null;
  pickup: ResolvedLocation | null;
  dropoff: ResolvedLocation | null;
}

export function useRoutePreview(
  currentValue: string,
  pickupValue: string,
  dropoffValue: string,
  enabled: boolean,
) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [locations, setLocations] = useState<PreviewLocations>({
    current: null,
    pickup: null,
    dropoff: null,
  });
  const [route, setRoute] = useState<{
    polyline: [number, number][];
    distance_miles: number;
    duration_hours: number;
    legPolylines: [number, number][][];
    legs: Array<{ distance_miles: number; duration_hours: number }>;
  } | null>(null);

  useEffect(() => {
    if (!enabled) {
      setRoute(null);
      setLocations({ current: null, pickup: null, dropoff: null });
      setError(null);
      setLoading(false);
      return;
    }

    let cancelled = false;

    const timer = setTimeout(async () => {
      setLoading(true);
      setError(null);
      setRoute(null);

      try {
        const [current, pickup, dropoff] = await Promise.all([
          resolveLocation(currentValue),
          resolveLocation(pickupValue),
          resolveLocation(dropoffValue),
        ]);

        if (cancelled) return;

        setLocations({ current, pickup, dropoff });

        if (!current || !pickup || !dropoff) {
          setError("Could not find one or more locations. Pick a city from the list or try “City, State”.");
          return;
        }

        const sameStart =
          Math.abs(current.lat - pickup.lat) < 0.01 &&
          Math.abs(current.lon - pickup.lon) < 0.01;

        let approachLine: [number, number][] = [];
        let approachLeg = { distance_miles: 0, duration_hours: 0 };

        if (!sameStart) {
          const approach = await fetchRoutePreview([
            { lat: current.lat, lon: current.lon },
            { lat: pickup.lat, lon: pickup.lon },
          ]);
          if (cancelled) return;
          approachLine = approach.polyline;
          approachLeg = {
            distance_miles: approach.distance_miles,
            duration_hours: approach.duration_hours,
          };
        }

        const haul = await fetchRoutePreview([
          { lat: pickup.lat, lon: pickup.lon },
          { lat: dropoff.lat, lon: dropoff.lon },
        ]);

        if (cancelled) return;

        const legPolylines: [number, number][][] = sameStart
          ? [haul.polyline]
          : [approachLine, haul.polyline];

        const polyline = sameStart
          ? haul.polyline
          : [...approachLine, ...haul.polyline.slice(1)];

        const legs = sameStart
          ? haul.legs
          : [
              approachLeg,
              {
                distance_miles: haul.distance_miles,
                duration_hours: haul.duration_hours,
              },
            ];

        setRoute({
          polyline,
          distance_miles: approachLeg.distance_miles + haul.distance_miles,
          duration_hours: approachLeg.duration_hours + haul.duration_hours,
          legPolylines,
          legs,
        });
      } catch (e) {
        if (!cancelled) {
          setError(e instanceof Error ? e.message : "Route unavailable");
          setRoute(null);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }, 450);

    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [currentValue, pickupValue, dropoffValue, enabled]);

  return { loading, error, route, locations };
}
