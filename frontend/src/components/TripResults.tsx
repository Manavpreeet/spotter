import { useState } from "react";
import type { PlanTripResponse } from "../types";
import { downloadTripJson } from "../utils/exportTrip";
import { DailyLogSheet } from "./DailyLogSheet";
import { RouteInstructions } from "./RouteInstructions";
import { TripMap } from "./TripMap";

interface Props {
  data: PlanTripResponse;
  onNewTrip?: () => void;
}

type Tab = "map" | "instructions" | "logs" | "timeline";

const TABS: { id: Tab; label: string; icon: string; short: string }[] = [
  { id: "map", label: "Map", icon: "🗺", short: "Route" },
  { id: "instructions", label: "Steps", icon: "📋", short: "Steps" },
  { id: "logs", label: "Logs", icon: "📄", short: "Logs" },
  { id: "timeline", label: "Timeline", icon: "⏱", short: "Time" },
];

export function TripResults({ data, onNewTrip }: Props) {
  const [tab, setTab] = useState<Tab>("map");
  const [logIndex, setLogIndex] = useState(0);

  const stats = [
    { label: "Total miles", value: `${data.route.total_miles}`, unit: "mi", icon: "📏" },
    { label: "Drive time", value: `~${Math.round(data.route.duration_hours)}`, unit: "hr", icon: "🕐" },
    { label: "Log days", value: String(data.route.estimated_days), unit: "days", icon: "📅" },
    { label: "Stops", value: String(data.stops.length), unit: "", icon: "📍" },
  ];

  const instructionCount = data.route_instructions?.length ?? 0;

  return (
    <div className="results">
      <header className="results-header">
        <div>
          <p className="results-eyebrow">Trip summary</p>
          <p className="results-summary-text">{data.summary}</p>
        </div>
        <div className="results-toolbar no-print">
          {onNewTrip && (
            <button type="button" className="btn-ghost btn-sm" onClick={onNewTrip}>
              New trip
            </button>
          )}
          <button type="button" className="btn-secondary btn-sm" onClick={() => downloadTripJson(data)}>
            Download JSON
          </button>
        </div>
      </header>

      <div className="stats-row">
        {stats.map((s) => (
          <div key={s.label} className="stat-card card">
            <span className="stat-icon" aria-hidden>
              {s.icon}
            </span>
            <span className="stat-label">{s.label}</span>
            <span className="stat-value">
              {s.value}
              {s.unit && <small> {s.unit}</small>}
            </span>
          </div>
        ))}
      </div>

      {(data.warnings.length > 0 || data.timezone) && (
        <div className="summary-banner card">
          {data.timezone && (
            <p className="summary-meta">
              <span className="summary-meta-icon" aria-hidden>
                🌐
              </span>
              Home terminal timezone: <strong>{data.timezone}</strong>
            </p>
          )}
          {data.warnings.length > 0 && (
            <ul className="warnings">
              {data.warnings.map((w, i) => (
                <li key={i}>{w}</li>
              ))}
            </ul>
          )}
        </div>
      )}

      <div className="tabs card">
        <div className="tab-list" role="tablist" aria-label="Trip results">
          {TABS.map(({ id, label, icon, short }) => {
            const count =
              id === "instructions"
                ? instructionCount
                : id === "logs"
                  ? data.daily_logs.length
                  : null;
            return (
              <button
                key={id}
                type="button"
                role="tab"
                aria-selected={tab === id}
                className={`tab-btn ${tab === id ? "active" : ""}`}
                onClick={() => setTab(id)}
              >
                <span className="tab-icon" aria-hidden>
                  {icon}
                </span>
                <span className="tab-text-full">{label}</span>
                <span className="tab-text-short">{short}</span>
                {count != null && count > 0 && <span className="tab-badge">{count}</span>}
              </button>
            );
          })}
        </div>

        <div className="tab-panel" role="tabpanel">
          {tab === "map" && <TripMap data={data} />}

          {tab === "instructions" && (
            <RouteInstructions instructions={data.route_instructions ?? []} />
          )}

          {tab === "logs" && (
            <div className="logs-tab">
              {data.daily_logs.length > 1 && (
                <div className="log-day-pills" role="tablist" aria-label="Select log day">
                  {data.daily_logs.map((log, i) => (
                    <button
                      key={log.date}
                      type="button"
                      role="tab"
                      aria-selected={logIndex === i}
                      className={`log-day-pill ${logIndex === i ? "active" : ""}`}
                      onClick={() => setLogIndex(i)}
                    >
                      Day {i + 1}
                      <span className="log-day-date">{log.header.date_display ?? log.date}</span>
                    </button>
                  ))}
                </div>
              )}
              <div className="log-nav">
                <button
                  type="button"
                  className="log-nav-btn"
                  disabled={logIndex === 0}
                  onClick={() => setLogIndex((i) => i - 1)}
                  aria-label="Previous day"
                >
                  ←
                </button>
                <span className="log-nav-label">
                  Day {logIndex + 1} of {data.daily_logs.length}
                </span>
                <button
                  type="button"
                  className="log-nav-btn"
                  disabled={logIndex >= data.daily_logs.length - 1}
                  onClick={() => setLogIndex((i) => i + 1)}
                  aria-label="Next day"
                >
                  →
                </button>
              </div>
              <DailyLogSheet log={data.daily_logs[logIndex]} index={logIndex} />
            </div>
          )}

          {tab === "timeline" && (
            <ul className="timeline">
              {data.segments.map((seg, i) => (
                <li key={i} className={`timeline-item status-${seg.status}`}>
                  <span className="timeline-time">
                    {new Date(seg.start).toLocaleString(undefined, {
                      month: "short",
                      day: "numeric",
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </span>
                  <span className="timeline-status">{seg.status.replace(/_/g, " ")}</span>
                  <span className="timeline-loc">{seg.location}</span>
                  {seg.miles > 0 && <span className="timeline-miles">{seg.miles} mi</span>}
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}
