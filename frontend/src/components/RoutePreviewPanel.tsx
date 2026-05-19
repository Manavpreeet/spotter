import { FIELD_HINTS } from "../data/hints";
import { useRoutePreview } from "../hooks/useRoutePreview";
import { HintIcon } from "./HintIcon";
import { MapPreviewLoader } from "./MapPreviewLoader";
import { RouteMap } from "./RouteMap";

interface Props {
  current: string;
  pickup: string;
  dropoff: string;
  routeValid: boolean;
}

export function RoutePreviewPanel({ current, pickup, dropoff, routeValid }: Props) {
  const { loading, error, route, locations } = useRoutePreview(
    current,
    pickup,
    dropoff,
    routeValid,
  );

  if (!routeValid) {
    return (
      <div className="route-preview card route-preview-hint">
        <p className="route-preview-placeholder">
          Choose different pickup and dropoff locations to see the map.
        </p>
      </div>
    );
  }

  if (loading) {
    return <MapPreviewLoader />;
  }

  const currentLoc = locations.current;
  const pickupLoc = locations.pickup;
  const dropoffLoc = locations.dropoff;

  if (error || !currentLoc || !pickupLoc || !dropoffLoc || !route) {
    return (
      <div className="route-preview card">
        <div className="route-preview-header">
          <h3>Route preview</h3>
        </div>
        {error ? (
          <p className="field-error" role="alert">
            {error}
          </p>
        ) : (
          <MapPreviewLoader
            message="Waiting for locations…"
            submessage="Enter or select all three stops in the form"
          />
        )}
      </div>
    );
  }

  const mapKey = `${current}|${pickup}|${dropoff}|${route.polyline.length}`;

  return (
    <div className="route-preview card">
      <div className="route-preview-header">
        <div>
          <h3>Live route preview</h3>
          <p className="route-preview-sub">
            {currentLoc.label} → {pickupLoc.label} → {dropoffLoc.label}
          </p>
        </div>
        <HintIcon text={FIELD_HINTS.routePreview} />
      </div>

      <RouteMap
        key={mapKey}
        current={{
          lat: currentLoc.lat,
          lon: currentLoc.lon,
          label: currentLoc.label,
        }}
        pickup={{
          lat: pickupLoc.lat,
          lon: pickupLoc.lon,
          label: pickupLoc.label,
        }}
        dropoff={{
          lat: dropoffLoc.lat,
          lon: dropoffLoc.lon,
          label: dropoffLoc.label,
        }}
        polyline={route.polyline}
        legPolylines={route.legPolylines}
        hud={{
          totalMiles: route.distance_miles,
          totalHours: route.duration_hours,
          legToPickupMiles: route.legs[0]?.distance_miles,
          legHaulMiles: route.legs[1]?.distance_miles ?? route.distance_miles,
        }}
      />
    </div>
  );
}
