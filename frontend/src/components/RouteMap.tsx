import { MapContainer, Marker, Polyline, TileLayer } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { MapFitBounds } from "./MapFitBounds";

function makeIcon(type: "current" | "pickup" | "dropoff") {
  const sizes = { current: 28, pickup: 26, dropoff: 30 } as const;
  const s = sizes[type];
  const markup: Record<typeof type, string> = {
    current: '<div class="ets-marker ets-marker-current"><span class="ets-arrow">▲</span></div>',
    pickup: '<div class="ets-marker ets-marker-pickup">P</div>',
    dropoff: '<div class="ets-marker ets-marker-dropoff">▼</div>',
  };
  return L.divIcon({
    className: "ets-marker-wrap",
    html: markup[type],
    iconSize: [s, s],
    iconAnchor: [s / 2, s / 2],
  });
}

export interface MapStop {
  type: string;
  lat: number;
  lon: number;
  label: string;
}

const STOP_MARKER_COLORS: Record<string, string> = {
  fuel: "#f59e0b",
  rest: "#8b5cf6",
  break: "#a78bfa",
  restart: "#ec4899",
};

export interface RouteMapProps {
  current: { lat: number; lon: number; label: string };
  pickup: { lat: number; lon: number; label: string };
  dropoff: { lat: number; lon: number; label: string };
  polyline: [number, number][];
  legPolylines?: [number, number][][];
  stops?: MapStop[];
  className?: string;
  hud?: {
    totalMiles: number;
    totalHours: number;
    legToPickupMiles?: number;
    legHaulMiles?: number;
  };
}

function makeStopIcon(type: string) {
  const color = STOP_MARKER_COLORS[type] ?? "#94a3b8";
  const letter = type === "fuel" ? "F" : type === "break" ? "B" : type === "restart" ? "R" : "•";
  return L.divIcon({
    className: "ets-marker-wrap",
    html: `<div class="ets-marker ets-marker-stop" style="background:${color}">${letter}</div>`,
    iconSize: [20, 20],
    iconAnchor: [10, 10],
  });
}

export function RouteMap({
  current,
  pickup,
  dropoff,
  polyline,
  legPolylines,
  stops = [],
  className = "",
  hud,
}: RouteMapProps) {
  const allPoints: [number, number][] = [
    [current.lat, current.lon],
    [pickup.lat, pickup.lon],
    [dropoff.lat, dropoff.lon],
  ];

  const center = polyline.length
    ? polyline[Math.floor(polyline.length / 2)]
    : [pickup.lat, pickup.lon];

  const approachLine = legPolylines?.[0];
  const haulLine = legPolylines?.[1] ?? polyline;
  const sameStart =
    Math.abs(current.lat - pickup.lat) < 0.01 &&
    Math.abs(current.lon - pickup.lon) < 0.01;

  return (
    <div className={`route-map-container ${className}`}>
      {hud && (
        <div className="route-hud">
          <div className="route-hud-title">Trip navigation</div>
          <div className="route-hud-row">
            <span className="route-hud-label">Total distance</span>
            <span className="route-hud-value">{Math.round(hud.totalMiles)} mi</span>
          </div>
          <div className="route-hud-row">
            <span className="route-hud-label">Est. drive time</span>
            <span className="route-hud-value">{formatDuration(hud.totalHours)}</span>
          </div>
          {hud.legToPickupMiles != null && hud.legToPickupMiles > 1 && !sameStart && (
            <div className="route-hud-row sub">
              <span className="route-hud-label">→ Pickup</span>
              <span>{Math.round(hud.legToPickupMiles)} mi</span>
            </div>
          )}
          {hud.legHaulMiles != null && (
            <div className="route-hud-row sub">
              <span className="route-hud-label">Pickup → Dropoff</span>
              <span className="route-hud-haul">{Math.round(hud.legHaulMiles)} mi</span>
            </div>
          )}
        </div>
      )}

      <div className="route-legend-bar">
        <span>
          <i className="legend-line approach" /> Deadhead to pickup
        </span>
        <span>
          <i className="legend-line haul" /> Loaded route
        </span>
      </div>

      <MapContainer
        center={center as [number, number]}
        zoom={5}
        scrollWheelZoom
        className="route-map-leaflet"
      >
        <TileLayer
          attribution="&copy; OSM &copy; CARTO"
          url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
        />
        <MapFitBounds positions={polyline.length ? polyline : allPoints} />

        {!sameStart && approachLine && approachLine.length > 1 && (
          <>
            <Polyline
              positions={approachLine}
              pathOptions={{ color: "#fbbf24", weight: 10, opacity: 0.2 }}
            />
            <Polyline
              positions={approachLine}
              pathOptions={{
                color: "#fbbf24",
                weight: 3,
                opacity: 0.85,
                dashArray: "14 10",
              }}
            />
          </>
        )}

        {haulLine.length > 1 && (
          <>
            <Polyline
              positions={haulLine}
              pathOptions={{ color: "#ff2222", weight: 12, opacity: 0.25 }}
            />
            <Polyline
              positions={haulLine}
              pathOptions={{ color: "#ff4444", weight: 6, opacity: 0.95 }}
            />
          </>
        )}

        <Marker position={[current.lat, current.lon]} icon={makeIcon("current")} />
        <Marker position={[pickup.lat, pickup.lon]} icon={makeIcon("pickup")} />
        <Marker position={[dropoff.lat, dropoff.lon]} icon={makeIcon("dropoff")} />
        {stops
          .filter((s) => !["start", "pickup", "dropoff"].includes(s.type))
          .map((s, i) => (
            <Marker
              key={`${s.type}-${i}-${s.lat}`}
              position={[s.lat, s.lon]}
              icon={makeStopIcon(s.type)}
              title={s.label}
            />
          ))}
      </MapContainer>
    </div>
  );
}

function formatDuration(hours: number): string {
  const h = Math.floor(hours);
  const m = Math.round((hours - h) * 60);
  return `${h} h ${m} min`;
}
