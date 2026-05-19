import type { GeocodeResult } from "../types";

const API_BASE = import.meta.env.VITE_API_URL ?? "/api";

export async function searchLocations(query: string): Promise<GeocodeResult[]> {
  if (query.trim().length < 2) return [];
  const params = new URLSearchParams({ q: query, limit: "8" });
  const res = await fetch(`${API_BASE}/geocode/search/?${params}`);
  const data = await res.json();
  if (!res.ok) throw new Error(data.error ?? "Search failed");
  return data.results as GeocodeResult[];
}
