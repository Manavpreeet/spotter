export interface GridSegment {
  status: string;
  row: number;
  start_minute: number;
  end_minute: number;
}

export interface LogHeader {
  from: string;
  to: string;
  total_miles_driving: number;
  carrier_name: string;
  home_terminal: string;
  driver_name?: string;
  co_driver_name?: string;
  vehicle_number?: string;
  trailer_number?: string;
  shipping_document?: string;
  date_display?: string;
}

export interface DailyLog {
  date: string;
  header: LogHeader;
  grid_segments: GridSegment[];
  row_totals: {
    off_duty: number;
    sleeper_berth: number;
    driving: number;
    on_duty_not_driving: number;
  };
  row_labels: string[];
  remarks: string[];
  recap: {
    on_duty_today: number;
    seven_day_total: number;
    available_tomorrow: number;
    eight_day_total: number;
  };
}

export interface TripStop {
  type: string;
  lat: number;
  lon: number;
  label: string;
  time?: string;
  duration_hours?: number;
}

export interface RouteInstruction {
  step: number;
  type: string;
  title: string;
  detail: string;
  start?: string;
  end?: string;
  location?: string;
  miles?: number;
  duration_hours?: number;
  from?: string;
  to?: string;
}

export interface TripOptions {
  use_sleeper_berth?: boolean;
  allow_34_hour_restart?: boolean;
  carrier_name?: string;
  driver_name?: string;
  co_driver_name?: string;
  vehicle_number?: string;
  trailer_number?: string;
  shipping_document?: string;
  home_terminal?: string;
  prior_cycle_daily_hours?: number[];
}

export interface PlanTripResponse {
  route: {
    total_miles: number;
    duration_hours: number;
    polyline: [number, number][];
    estimated_days: number;
    legs?: Array<{
      from: string;
      to: string;
      miles: number;
      duration_hours: number;
    }>;
  };
  locations: Record<string, { lat: number; lon: number; label: string; display_name: string }>;
  stops: TripStop[];
  route_instructions: RouteInstruction[];
  segments: Array<{
    status: string;
    start: string;
    end: string;
    location: string;
    remark: string;
    miles: number;
  }>;
  daily_logs: DailyLog[];
  warnings: string[];
  summary: string;
  timezone?: string;
  options_applied?: Record<string, boolean>;
}

export interface PlanTripRequest {
  current_location: string;
  pickup_location: string;
  dropoff_location: string;
  current_cycle_used_hours: number;
  options?: TripOptions;
}

export interface GeocodeResult {
  value: string;
  label: string;
  lat: number;
  lon: number;
}
