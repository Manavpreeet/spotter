/** Major US freight hubs with coordinates for instant route preview */
export const TRIP_LOCATIONS = [
  { value: "Chicago, IL", label: "Chicago, IL", region: "Midwest", lat: 41.8781, lon: -87.6298 },
  { value: "Dallas, TX", label: "Dallas, TX", region: "South", lat: 32.7767, lon: -96.797 },
  { value: "Denver, CO", label: "Denver, CO", region: "West", lat: 39.7392, lon: -104.9903 },
  { value: "Los Angeles, CA", label: "Los Angeles, CA", region: "West", lat: 34.0522, lon: -118.2437 },
  { value: "Atlanta, GA", label: "Atlanta, GA", region: "South", lat: 33.749, lon: -84.388 },
  { value: "Houston, TX", label: "Houston, TX", region: "South", lat: 29.7604, lon: -95.3698 },
  { value: "Indianapolis, IN", label: "Indianapolis, IN", region: "Midwest", lat: 39.7684, lon: -86.1581 },
  { value: "Kansas City, MO", label: "Kansas City, MO", region: "Midwest", lat: 39.0997, lon: -94.5786 },
  { value: "Las Vegas, NV", label: "Las Vegas, NV", region: "West", lat: 36.1699, lon: -115.1398 },
  { value: "Memphis, TN", label: "Memphis, TN", region: "South", lat: 35.1495, lon: -90.049 },
  { value: "Miami, FL", label: "Miami, FL", region: "South", lat: 25.7617, lon: -80.1918 },
  { value: "Milwaukee, WI", label: "Milwaukee, WI", region: "Midwest", lat: 43.0389, lon: -87.9065 },
  { value: "Minneapolis, MN", label: "Minneapolis, MN", region: "Midwest", lat: 44.9778, lon: -93.265 },
  { value: "Nashville, TN", label: "Nashville, TN", region: "South", lat: 36.1627, lon: -86.7816 },
  { value: "New York, NY", label: "New York, NY", region: "Northeast", lat: 40.7128, lon: -74.006 },
  { value: "Omaha, NE", label: "Omaha, NE", region: "Midwest", lat: 41.2565, lon: -95.9345 },
  { value: "Philadelphia, PA", label: "Philadelphia, PA", region: "Northeast", lat: 39.9526, lon: -75.1652 },
  { value: "Phoenix, AZ", label: "Phoenix, AZ", region: "West", lat: 33.4484, lon: -112.074 },
  { value: "Portland, OR", label: "Portland, OR", region: "West", lat: 45.5152, lon: -122.6784 },
  { value: "Salt Lake City, UT", label: "Salt Lake City, UT", region: "West", lat: 40.7608, lon: -111.891 },
  { value: "San Antonio, TX", label: "San Antonio, TX", region: "South", lat: 29.4241, lon: -98.4936 },
  { value: "Seattle, WA", label: "Seattle, WA", region: "West", lat: 47.6062, lon: -122.3321 },
  { value: "St. Louis, MO", label: "St. Louis, MO", region: "Midwest", lat: 38.627, lon: -90.1994 },
] as const;

export const MAX_CYCLE_HOURS = 70;

export type TripLocation = (typeof TRIP_LOCATIONS)[number];

export function getLocation(value: string): TripLocation | undefined {
  const trimmed = value.trim();
  return TRIP_LOCATIONS.find(
    (l) =>
      l.value === trimmed ||
      l.label.toLowerCase() === trimmed.toLowerCase(),
  );
}
