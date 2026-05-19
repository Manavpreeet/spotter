import type { PlanTripRequest, PlanTripResponse } from "../types";

export const API_BASE = import.meta.env.VITE_API_URL ?? "/api";

const PLAN_TRIP_TIMEOUT_MS = 120_000;

export async function planTrip(payload: PlanTripRequest): Promise<PlanTripResponse> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), PLAN_TRIP_TIMEOUT_MS);

  try {
    const res = await fetch(`${API_BASE}/plan-trip/`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
      signal: controller.signal,
    });
    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.error ?? `Request failed (${res.status})`);
    }
    return data as PlanTripResponse;
  } catch (e) {
    if (e instanceof Error && e.name === "AbortError") {
      throw new Error(
        "The server took too long to respond. On Render free tier, wait 30 seconds and try again, or redeploy after the latest backend fix.",
      );
    }
    if (e instanceof TypeError) {
      throw new Error(
        `Cannot reach the API at ${API_BASE}. Check VITE_API_URL on Vercel and CORS on Render.`,
      );
    }
    throw e;
  } finally {
    clearTimeout(timeoutId);
  }
}
