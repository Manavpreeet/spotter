import { searchLocations } from "../api/geocode";
import { getLocation } from "../data/locations";

export interface ResolvedLocation {
  lat: number;
  lon: number;
  label: string;
}

const cache = new Map<string, ResolvedLocation>();

/** Resolve a location string to coordinates (presets first, then geocode API). */
export async function resolveLocation(value: string): Promise<ResolvedLocation | null> {
  const trimmed = value.trim();
  if (!trimmed) return null;

  const preset = getLocation(trimmed);
  if (preset) {
    return { lat: preset.lat, lon: preset.lon, label: preset.label };
  }

  if (cache.has(trimmed)) {
    return cache.get(trimmed)!;
  }

  try {
    const results = await searchLocations(trimmed);
    const match =
      results.find((r) => r.value === trimmed || r.label === trimmed) ?? results[0];
    if (!match) return null;

    const resolved: ResolvedLocation = {
      lat: match.lat,
      lon: match.lon,
      label: match.label,
    };
    cache.set(trimmed, resolved);
    return resolved;
  } catch {
    return null;
  }
}
