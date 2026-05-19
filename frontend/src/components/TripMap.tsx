import type { PlanTripResponse } from "../types";
import { RouteMap } from "./RouteMap";

const STOP_COLORS: Record<string, string> = {
  start: "#3b9eff",
  pickup: "#22c55e",
  dropoff: "#ef4444",
  fuel: "#f59e0b",
  rest: "#8b5cf6",
  break: "#a78bfa",
  restart: "#ec4899",
};

interface Props {
  data: PlanTripResponse;
}

export function TripMap({ data }: Props) {
  const polyline = data.route.polyline;
  if (!polyline.length) return null;

  const current = data.locations.current;
  const pickup = data.locations.pickup;
  const dropoff = data.locations.dropoff;
  if (!current || !pickup || !dropoff) return null;

  const legPolylines: [number, number][][] = [];
  if (data.route.legs && data.route.legs.length >= 2) {
    const n = polyline.length;
    const mid = Math.floor(n / 2);
    legPolylines.push(polyline.slice(0, mid + 1));
    legPolylines.push(polyline.slice(mid));
  } else {
    legPolylines.push(polyline);
  }

  return (
    <div className="map-wrap">
      <RouteMap
        current={{
          lat: current.lat,
          lon: current.lon,
          label: current.display_name ?? current.label,
        }}
        pickup={{
          lat: pickup.lat,
          lon: pickup.lon,
          label: pickup.display_name ?? pickup.label,
        }}
        dropoff={{
          lat: dropoff.lat,
          lon: dropoff.lon,
          label: dropoff.display_name ?? dropoff.label,
        }}
        polyline={polyline}
        legPolylines={legPolylines.length > 1 ? legPolylines : undefined}
        stops={data.stops}
        hud={{
          totalMiles: data.route.total_miles,
          totalHours: data.route.duration_hours,
          legToPickupMiles: data.route.legs?.[0]?.miles,
          legHaulMiles: data.route.legs?.[1]?.miles ?? data.route.total_miles,
        }}
      />
      <ul className="stop-legend">
        {Object.entries(STOP_COLORS).map(([type, color]) => {
          const has = data.stops.some((s) => s.type === type);
          if (!has && !["start", "pickup", "dropoff"].includes(type)) return null;
          return (
            <li key={type}>
              <span className="legend-dot" style={{ background: color }} /> {type}
            </li>
          );
        })}
      </ul>
      <ul className="stop-list">
        {data.stops
          .filter((s) => !["start", "pickup", "dropoff"].includes(s.type))
          .map((s, i) => (
            <li key={i}>
              <span className="legend-dot" style={{ background: STOP_COLORS[s.type] ?? "#888" }} />
              {s.label}
              {s.time && (
                <span className="stop-time">
                  {new Date(s.time).toLocaleString(undefined, {
                    month: "short",
                    day: "numeric",
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </span>
              )}
            </li>
          ))}
      </ul>
    </div>
  );
}
