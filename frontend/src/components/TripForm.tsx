import { useEffect, useMemo, useState, type FormEvent, type ReactNode } from "react";
import { FIELD_HINTS } from "../data/hints";
import { MAX_CYCLE_HOURS } from "../data/locations";
import { DEFAULT_PRESET, TRIP_PRESETS, type TripPreset } from "../data/presets";
import type { TripOptions } from "../types";
import { validateTripForm } from "../utils/validation";
import { HintIcon } from "./HintIcon";
import { LocationAutocomplete } from "./LocationAutocomplete";
import { TripOptionsPanel } from "./TripOptionsPanel";

export interface TripFormValues {
  current_location: string;
  pickup_location: string;
  dropoff_location: string;
  current_cycle_used_hours: number;
  options: TripOptions;
}

export interface TripLocations {
  current: string;
  pickup: string;
  dropoff: string;
}

interface Props {
  loading: boolean;
  onSubmit: (values: TripFormValues) => void;
  onLocationsChange?: (locations: TripLocations) => void;
  /** Increment to load the default example trip */
  loadExampleSignal?: number;
}

const defaultOptions: TripOptions = {
  carrier_name: "Spotter Transport LLC",
  use_sleeper_berth: false,
  allow_34_hour_restart: false,
};

function FieldLabel({
  icon,
  iconClass,
  children,
  hint,
}: {
  icon: string;
  iconClass?: string;
  children: ReactNode;
  hint: string;
}) {
  return (
    <span className="field-label">
      <span className={`field-icon ${iconClass ?? ""}`} aria-hidden>
        {icon}
      </span>
      {children}
      <HintIcon text={hint} />
    </span>
  );
}

function applyPreset(preset: TripPreset) {
  return {
    current: preset.current_location,
    pickup: preset.pickup_location,
    dropoff: preset.dropoff_location,
    cycle: preset.cycleInput,
  };
}

export function TripForm({ loading, onSubmit, onLocationsChange, loadExampleSignal }: Props) {
  const [currentLocation, setCurrentLocation] = useState(DEFAULT_PRESET.current_location);
  const [pickup, setPickup] = useState(DEFAULT_PRESET.pickup_location);
  const [dropoff, setDropoff] = useState(DEFAULT_PRESET.dropoff_location);
  const [cycleInput, setCycleInput] = useState(DEFAULT_PRESET.cycleInput);
  const [options, setOptions] = useState<TripOptions>(defaultOptions);
  const [touched, setTouched] = useState({ cycle: false, pickup: false, dropoff: false });
  const [submitAttempted, setSubmitAttempted] = useState(false);
  const [showRules, setShowRules] = useState(false);

  useEffect(() => {
    if (loadExampleSignal && loadExampleSignal > 0) {
      const p = DEFAULT_PRESET;
      setCurrentLocation(p.current_location);
      setPickup(p.pickup_location);
      setDropoff(p.dropoff_location);
      setCycleInput(p.cycleInput);
      setSubmitAttempted(false);
      setTouched({ cycle: false, pickup: false, dropoff: false });
    }
  }, [loadExampleSignal]);

  useEffect(() => {
    onLocationsChange?.({ current: currentLocation, pickup, dropoff });
  }, [currentLocation, pickup, dropoff, onLocationsChange]);

  const validation = useMemo(
    () => validateTripForm(pickup, dropoff, cycleInput),
    [pickup, dropoff, cycleInput],
  );

  const showCycleError = (touched.cycle || submitAttempted) && validation.cycle.error;
  const showRouteError =
    (touched.pickup || touched.dropoff || submitAttempted) && validation.pickupDropoff;

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    setSubmitAttempted(true);
    if (!validation.isValid) return;
    onSubmit({
      current_location: currentLocation,
      pickup_location: pickup,
      dropoff_location: dropoff,
      current_cycle_used_hours: validation.cycle.value,
      options,
    });
  };

  const loadPreset = (preset: TripPreset) => {
    const v = applyPreset(preset);
    setCurrentLocation(v.current);
    setPickup(v.pickup);
    setDropoff(v.dropoff);
    setCycleInput(v.cycle);
    setSubmitAttempted(false);
  };

  const cycleMeterClass =
    validation.cycle.usagePercent >= 90
      ? "critical"
      : validation.cycle.usagePercent >= 70
        ? "warning"
        : "ok";

  const routeReady = pickup && dropoff && pickup !== dropoff;

  return (
    <form className="trip-form card" onSubmit={handleSubmit} noValidate>
      <div className="form-header">
        <h2>Plan your trip</h2>
        <p className="muted">Three stops · 70 hr / 8 day · Takes about 10 seconds</p>
      </div>

      <div className="preset-row">
        <span className="preset-label">Quick start</span>
        <div className="preset-chips" role="group" aria-label="Example trips">
          {TRIP_PRESETS.map((p) => (
            <button
              key={p.id}
              type="button"
              className="preset-chip"
              onClick={() => loadPreset(p)}
              title={p.label}
            >
              {p.short}
            </button>
          ))}
        </div>
      </div>

      <div className="route-flow" aria-hidden={!routeReady}>
        <div className="route-flow-node start">
          <span className="route-flow-dot" />
          <span className="route-flow-name">You</span>
        </div>
        <div className={`route-flow-line ${routeReady ? "active" : ""}`} />
        <div className="route-flow-node pickup">
          <span className="route-flow-dot" />
          <span className="route-flow-name">Pickup</span>
        </div>
        <div className={`route-flow-line ${routeReady ? "active" : ""}`} />
        <div className="route-flow-node dropoff">
          <span className="route-flow-dot" />
          <span className="route-flow-name">Dropoff</span>
        </div>
      </div>

      <fieldset className="form-fieldset">
        <legend className="sr-only">Trip locations</legend>

        <LocationAutocomplete
          id="current-loc"
          label={
            <FieldLabel icon="◎" hint={FIELD_HINTS.current}>
              1. Where are you now?
            </FieldLabel>
          }
          value={currentLocation}
          onChange={setCurrentLocation}
        />

        <LocationAutocomplete
          id="pickup-loc"
          label={
            <FieldLabel icon="↑" iconClass="pickup" hint={FIELD_HINTS.pickup}>
              2. Pickup location
            </FieldLabel>
          }
          value={pickup}
          onChange={(v) => {
            setPickup(v);
            setTouched((t) => ({ ...t, pickup: true }));
          }}
          invalid={!!showRouteError}
          onBlur={() => setTouched((t) => ({ ...t, pickup: true }))}
        />

        <LocationAutocomplete
          id="dropoff-loc"
          label={
            <FieldLabel icon="↓" iconClass="dropoff" hint={FIELD_HINTS.dropoff}>
              3. Dropoff location
            </FieldLabel>
          }
          value={dropoff}
          onChange={(v) => {
            setDropoff(v);
            setTouched((t) => ({ ...t, dropoff: true }));
          }}
          invalid={!!showRouteError}
          onBlur={() => setTouched((t) => ({ ...t, dropoff: true }))}
        />
      </fieldset>

      {showRouteError && (
        <p className="field-error" role="alert">
          {validation.pickupDropoff}
        </p>
      )}

      <div className="field cycle-field">
        <label htmlFor="cycle-hours">
          <FieldLabel icon="⏱" iconClass="cycle" hint={FIELD_HINTS.cycle}>
            4. Hours used this week (0–70)
          </FieldLabel>
        </label>
        <input
          id="cycle-hours"
          type="text"
          inputMode="decimal"
          placeholder="e.g. 25"
          value={cycleInput}
          onChange={(e) => setCycleInput(e.target.value)}
          onBlur={() => setTouched((t) => ({ ...t, cycle: true }))}
          className={`field-control ${showCycleError ? "invalid" : ""}`}
          aria-invalid={!!showCycleError}
          aria-describedby="cycle-help"
        />
        <p id="cycle-help" className="field-hint">
          On-duty hours already used in your rolling 8-day cycle.
        </p>
        {showCycleError && (
          <p className="field-error" role="alert">
            {validation.cycle.error}
          </p>
        )}
        <div className="cycle-meter-wrap">
          <div className="cycle-meter-labels">
            <span>{validation.cycle.valid ? `${validation.cycle.value} hr used` : "Enter hours"}</span>
            <span>
              {validation.cycle.valid
                ? `${validation.cycle.availableHours} hr left`
                : `Max ${MAX_CYCLE_HOURS} hr`}
            </span>
          </div>
          <div className="cycle-meter-track" role="progressbar" aria-valuenow={validation.cycle.valid ? validation.cycle.value : 0} aria-valuemin={0} aria-valuemax={MAX_CYCLE_HOURS}>
            <div
              className={`cycle-meter-fill ${cycleMeterClass}`}
              style={{
                width: `${validation.cycle.valid ? validation.cycle.usagePercent : 0}%`,
              }}
            />
          </div>
        </div>
      </div>

      <button
        type="button"
        className="rules-toggle"
        onClick={() => setShowRules((v) => !v)}
        aria-expanded={showRules}
      >
        {showRules ? "Hide" : "What rules are included?"}
        <span className="rules-toggle-icon" aria-hidden>
          {showRules ? "▲" : "▼"}
        </span>
      </button>
      {showRules && (
        <div className="hos-pills" id="hos-rules">
          <span className="pill">11 hr drive</span>
          <span className="pill">14 hr window</span>
          <span className="pill">30 min break</span>
          <span className="pill">10 hr rest</span>
          <span className="pill">Fuel every 1,000 mi</span>
        </div>
      )}

      <TripOptionsPanel options={options} onChange={setOptions} />

      <div className="form-submit-wrap">
        <button type="submit" className="btn-primary" disabled={loading || !validation.isValid}>
          {loading ? (
            <>
              <span className="spinner" aria-hidden />
              Planning…
            </>
          ) : (
            "Plan my trip"
          )}
        </button>
        {!validation.isValid && submitAttempted && (
          <p className="form-submit-hint" role="status">
            Fix the highlighted fields above to continue.
          </p>
        )}
      </div>
    </form>
  );
}
