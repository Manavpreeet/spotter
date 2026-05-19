import { MAX_CYCLE_HOURS } from "../data/locations";

export interface CycleValidation {
  valid: boolean;
  error: string | null;
  value: number;
  availableHours: number;
  usagePercent: number;
}

export interface TripFormValidation {
  cycle: CycleValidation;
  pickupDropoff: string | null;
  isValid: boolean;
}

export function validateCycleHours(raw: string): CycleValidation {
  const trimmed = raw.trim();

  if (trimmed === "") {
    return {
      valid: false,
      error: "Current cycle used is required",
      value: NaN,
      availableHours: MAX_CYCLE_HOURS,
      usagePercent: 0,
    };
  }

  if (!/^\d+(\.\d)?$/.test(trimmed)) {
    return {
      valid: false,
      error: "Enter a valid number (max one decimal place)",
      value: NaN,
      availableHours: 0,
      usagePercent: 0,
    };
  }

  const value = parseFloat(trimmed);

  if (value < 0) {
    return {
      valid: false,
      error: "Cannot be negative",
      value,
      availableHours: MAX_CYCLE_HOURS,
      usagePercent: 0,
    };
  }

  if (value > MAX_CYCLE_HOURS) {
    return {
      valid: false,
      error: `Cannot exceed ${MAX_CYCLE_HOURS} hours (70 hr / 8 day limit)`,
      value,
      availableHours: 0,
      usagePercent: 100,
    };
  }

  const availableHours = MAX_CYCLE_HOURS - value;
  const usagePercent = Math.round((value / MAX_CYCLE_HOURS) * 100);

  return {
    valid: true,
    error: null,
    value,
    availableHours,
    usagePercent,
  };
}

export function validateTripForm(
  pickup: string,
  dropoff: string,
  cycleRaw: string,
): TripFormValidation {
  const cycle = validateCycleHours(cycleRaw);
  let pickupDropoff: string | null = null;

  if (pickup && dropoff && pickup === dropoff) {
    pickupDropoff = "Pickup and dropoff must be different locations";
  }

  return {
    cycle,
    pickupDropoff,
    isValid: cycle.valid && !pickupDropoff,
  };
}
