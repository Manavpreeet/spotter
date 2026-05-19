import type { PlanTripRequest, PlanTripResponse } from "../types";

export const API_BASE = import.meta.env.VITE_API_URL ?? "/api";

export async function planTrip(payload: PlanTripRequest): Promise<PlanTripResponse> {
  const res = await fetch(`${API_BASE}/plan-trip/`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.error ?? "Failed to plan trip");
  }
  return data as PlanTripResponse;
}
