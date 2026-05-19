export interface TripPreset {
  id: string;
  label: string;
  short: string;
  current_location: string;
  pickup_location: string;
  dropoff_location: string;
  cycleInput: string;
}

export const TRIP_PRESETS: TripPreset[] = [
  {
    id: "chi-den-la",
    label: "Chicago → Denver → Los Angeles",
    short: "3-day haul",
    current_location: "Chicago, IL",
    pickup_location: "Denver, CO",
    dropoff_location: "Los Angeles, CA",
    cycleInput: "25",
  },
  {
    id: "dal-hou-mia",
    label: "Dallas → Houston → Miami",
    short: "Gulf run",
    current_location: "Dallas, TX",
    pickup_location: "Houston, TX",
    dropoff_location: "Miami, FL",
    cycleInput: "12",
  },
  {
    id: "sea-por-sf",
    label: "Seattle → Portland → San Francisco",
    short: "West coast",
    current_location: "Seattle, WA",
    pickup_location: "Portland, OR",
    dropoff_location: "San Francisco, CA",
    cycleInput: "40",
  },
];

export const DEFAULT_PRESET = TRIP_PRESETS[0];
