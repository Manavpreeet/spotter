import type { TripOptions } from "../types";
import { HintIcon } from "./HintIcon";

interface Props {
  options: TripOptions;
  onChange: (options: TripOptions) => void;
}

export function TripOptionsPanel({ options, onChange }: Props) {
  const set = <K extends keyof TripOptions>(key: K, value: TripOptions[K]) => {
    onChange({ ...options, [key]: value });
  };

  return (
    <details className="trip-options-panel">
      <summary>Driver &amp; vehicle details</summary>
      <div className="options-grid">
        <label className="checkbox-row">
          <input
            type="checkbox"
            checked={!!options.use_sleeper_berth}
            onChange={(e) => set("use_sleeper_berth", e.target.checked)}
          />
          Use sleeper berth for 10-hour resets
          <HintIcon text="When enabled, long rest periods are logged in the sleeper berth row instead of off duty." />
        </label>
        <label className="checkbox-row">
          <input
            type="checkbox"
            checked={!!options.allow_34_hour_restart}
            onChange={(e) => set("allow_34_hour_restart", e.target.checked)}
          />
          Allow 34-hour restart
          <HintIcon text="Applies a 34-hour off-duty restart when near the 70-hour/8-day limit or before trip if cycle is nearly full." />
        </label>
        <label>
          Carrier name
          <input
            className="field-control"
            value={options.carrier_name ?? ""}
            onChange={(e) => set("carrier_name", e.target.value)}
          />
        </label>
        <label>
          Driver name
          <input
            className="field-control"
            value={options.driver_name ?? ""}
            onChange={(e) => set("driver_name", e.target.value)}
          />
        </label>
        <label>
          Co-driver
          <input
            className="field-control"
            value={options.co_driver_name ?? ""}
            onChange={(e) => set("co_driver_name", e.target.value)}
          />
        </label>
        <label>
          Vehicle / tractor #
          <input
            className="field-control"
            value={options.vehicle_number ?? ""}
            onChange={(e) => set("vehicle_number", e.target.value)}
          />
        </label>
        <label>
          Trailer #
          <input
            className="field-control"
            value={options.trailer_number ?? ""}
            onChange={(e) => set("trailer_number", e.target.value)}
          />
        </label>
        <label>
          Shipping document
          <input
            className="field-control"
            value={options.shipping_document ?? ""}
            onChange={(e) => set("shipping_document", e.target.value)}
          />
        </label>
        <label>
          Home terminal
          <input
            className="field-control"
            value={options.home_terminal ?? ""}
            onChange={(e) => set("home_terminal", e.target.value)}
            placeholder="Defaults to current location"
          />
        </label>
      </div>
    </details>
  );
}
