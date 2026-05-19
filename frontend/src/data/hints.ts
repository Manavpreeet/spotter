export const FIELD_HINTS = {
  current:
    "Where the driver is right now. The route preview shows travel from here to pickup, then the main haul to dropoff.",
  pickup:
    "Where freight is loaded. Adds 1 hour on-duty (not driving) at this stop per assessment rules.",
  dropoff:
    "Final delivery location. Adds 1 hour on-duty at dropoff. Must differ from pickup.",
  cycle:
    "On-duty hours already counted in your rolling 8-day window (driving + on-duty not driving). Max 70 before you must rest off the 70/8 clock.",
  routePreview:
    "Live route preview (Euro Truck Simulator style). Gold dashed line = deadhead to pickup; red glow = loaded miles pickup → dropoff.",
} as const;
