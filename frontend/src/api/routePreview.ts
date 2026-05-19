export interface RoutePreviewResult {
  polyline: [number, number][];
  distance_miles: number;
  duration_hours: number;
  legs: Array<{ distance_miles: number; duration_hours: number }>;
}

export async function fetchRoutePreview(
  waypoints: Array<{ lat: number; lon: number }>,
): Promise<RoutePreviewResult> {
  const coordStr = waypoints.map((w) => `${w.lon},${w.lat}`).join(";");
  const url = `https://router.project-osrm.org/route/v1/driving/${coordStr}`;
  const params = new URLSearchParams({
    overview: "full",
    geometries: "geojson",
    steps: "false",
  });

  const res = await fetch(`${url}?${params}`);
  const data = await res.json();

  if (data.code !== "Ok" || !data.routes?.[0]) {
    throw new Error(data.message ?? "Could not load route");
  }

  const route = data.routes[0];
  const coords: [number, number][] = route.geometry.coordinates.map(
    ([lon, lat]: [number, number]) => [lat, lon],
  );

  return {
    polyline: coords,
    distance_miles: route.distance / 1609.34,
    duration_hours: route.duration / 3600,
    legs: (route.legs ?? []).map(
      (leg: { distance: number; duration: number }) => ({
        distance_miles: leg.distance / 1609.34,
        duration_hours: leg.duration / 3600,
      }),
    ),
  };
}
