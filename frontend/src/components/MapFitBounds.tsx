import { useEffect } from "react";
import { useMap } from "react-leaflet";
import L from "leaflet";

interface Props {
  positions: [number, number][];
}

export function MapFitBounds({ positions }: Props) {
  const map = useMap();

  const boundsKey =
    positions.length > 0
      ? positions.map((p) => `${p[0].toFixed(4)},${p[1].toFixed(4)}`).join("|")
      : "";

  useEffect(() => {
    if (positions.length < 2) return;
    const bounds = L.latLngBounds(positions);
    map.fitBounds(bounds, { padding: [48, 48], maxZoom: 8 });
  }, [map, boundsKey, positions]);

  return null;
}
