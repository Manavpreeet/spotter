import type { DailyLog, GridSegment } from "../types";
import { printLogSheet } from "../utils/exportTrip";

const GRID_LEFT = 100;
const GRID_TOP = 200;
const GRID_WIDTH = 500;
const ROW_HEIGHT = 20;
const ROWS = 4;

interface Props {
  log: DailyLog;
  index: number;
}

function minuteToX(minute: number): number {
  return GRID_LEFT + (minute / (24 * 60)) * GRID_WIDTH;
}

function rowToY(row: number): number {
  return GRID_TOP + row * ROW_HEIGHT + ROW_HEIGHT / 2;
}

function buildConnectors(segments: GridSegment[]) {
  const sorted = [...segments].sort((a, b) => a.start_minute - b.start_minute);
  const connectors: Array<{ x: number; y1: number; y2: number }> = [];
  for (let i = 1; i < sorted.length; i++) {
    const prev = sorted[i - 1];
    const curr = sorted[i];
    if (prev.row !== curr.row && prev.end_minute === curr.start_minute) {
      connectors.push({
        x: minuteToX(curr.start_minute),
        y1: rowToY(prev.row),
        y2: rowToY(curr.row),
      });
    }
  }
  return connectors;
}

export function DailyLogSheet({ log, index }: Props) {
  const connectors = buildConnectors(log.grid_segments);
  const printId = `log-sheet-${log.date}-${index}`;

  return (
    <article className="log-sheet card fmcsa-log" id={printId}>
      <div className="log-sheet-toolbar no-print">
        <button type="button" className="btn-secondary" onClick={() => printLogSheet(printId)}>
          Print / PDF
        </button>
      </div>

      <div className="fmcsa-log-print">
        <header className="fmcsa-log-title-row">
          <h3>
            Driver&apos;s Daily Log (24 hours) — Day {index + 1}
          </h3>
          <span className="fmcsa-badge">U.S. DOT — 7 Form</span>
        </header>

        <div className="fmcsa-meta-grid">
          <div>
            <span className="fmcsa-label">Date</span>
            <span>{log.header.date_display ?? log.date}</span>
          </div>
          <div>
            <span className="fmcsa-label">From</span>
            <span>{log.header.from}</span>
          </div>
          <div>
            <span className="fmcsa-label">To</span>
            <span>{log.header.to}</span>
          </div>
          <div>
            <span className="fmcsa-label">Miles driving today</span>
            <span>{log.header.total_miles_driving}</span>
          </div>
          <div className="fmcsa-span-2">
            <span className="fmcsa-label">Name of carrier</span>
            <span>{log.header.carrier_name}</span>
          </div>
          <div>
            <span className="fmcsa-label">Home terminal</span>
            <span>{log.header.home_terminal}</span>
          </div>
          {log.header.driver_name && (
            <div>
              <span className="fmcsa-label">Driver</span>
              <span>{log.header.driver_name}</span>
            </div>
          )}
          {log.header.vehicle_number && (
            <div>
              <span className="fmcsa-label">Vehicle</span>
              <span>{log.header.vehicle_number}</span>
            </div>
          )}
          {log.header.trailer_number && (
            <div>
              <span className="fmcsa-label">Trailer</span>
              <span>{log.header.trailer_number}</span>
            </div>
          )}
        </div>

        <svg
          className="log-grid-svg fmcsa-grid"
          viewBox="0 0 640 360"
          role="img"
          aria-label={`HOS grid for ${log.date}`}
        >
          <rect x={GRID_LEFT - 4} y={GRID_TOP - 20} width={GRID_WIDTH + 8} height={ROWS * ROW_HEIGHT + 28} fill="#fafafa" stroke="#333" strokeWidth={1} />

          {[0, 6, 12, 18, 24].map((h) => (
            <text key={h} x={minuteToX(h * 60)} y={GRID_TOP - 8} textAnchor="middle" className="hour-label">
              {h === 0 ? "Mid" : h === 12 ? "Noon" : h === 24 ? "Mid" : h}
            </text>
          ))}

          {log.row_labels.map((label, row) => {
            const y = GRID_TOP + row * ROW_HEIGHT;
            return (
              <g key={label}>
                <text x={8} y={y + 14} className="row-label">
                  {label}
                </text>
                <line x1={GRID_LEFT} y1={y + ROW_HEIGHT} x2={GRID_LEFT + GRID_WIDTH} y2={y + ROW_HEIGHT} className="grid-line" />
              </g>
            );
          })}

          {Array.from({ length: 25 }, (_, h) => (
            <line
              key={h}
              x1={minuteToX(h * 60)}
              y1={GRID_TOP}
              x2={minuteToX(h * 60)}
              y2={GRID_TOP + ROWS * ROW_HEIGHT}
              className={h % 6 === 0 ? "tick-major" : "tick-minor"}
            />
          ))}

          {log.grid_segments.map((seg, i) => (
            <line
              key={i}
              x1={minuteToX(seg.start_minute)}
              y1={rowToY(seg.row)}
              x2={minuteToX(seg.end_minute)}
              y2={rowToY(seg.row)}
              className={`duty-line row-${seg.row}`}
            />
          ))}

          {connectors.map((c, i) => (
            <line key={i} x1={c.x} y1={c.y1} x2={c.x} y2={c.y2} className="duty-connector" />
          ))}

          <text x={GRID_LEFT + GRID_WIDTH + 8} y={GRID_TOP + 8} className="totals-head">
            Total
          </text>
          {Object.values(log.row_totals).map((h, row) => (
            <text key={row} x={GRID_LEFT + GRID_WIDTH + 8} y={rowToY(row) + 4} className="totals-val">
              {h.toFixed(1)}
            </text>
          ))}
        </svg>

        <section className="remarks fmcsa-remarks">
          <h4>Remarks</h4>
          <p className="fmcsa-remarks-hint">
            Enter name of place you reported and where released from work and when and where each change of duty occurred.
          </p>
          <ul>
            {log.remarks.map((r, i) => (
              <li key={i}>{r}</li>
            ))}
          </ul>
          {log.header.shipping_document && (
            <p>
              <strong>Shipping:</strong> {log.header.shipping_document}
            </p>
          )}
        </section>

        <section className="recap fmcsa-recap">
          <h4>70 hr / 8 day recap</h4>
          <div className="recap-grid">
            <div>
              <span>On duty today</span>
              <strong>{log.recap.on_duty_today} h</strong>
            </div>
            <div>
              <span>7-day total (A)</span>
              <strong>{log.recap.seven_day_total} h</strong>
            </div>
            <div>
              <span>Available tomorrow (B)</span>
              <strong>{log.recap.available_tomorrow} h</strong>
            </div>
            <div>
              <span>8-day total (C)</span>
              <strong>{log.recap.eight_day_total} h</strong>
            </div>
          </div>
          <p className="fmcsa-recap-note">
            34 consecutive hours off duty restarts your 60/70-hour clock (optional per carrier policy).
          </p>
        </section>

        <footer className="fmcsa-cert">
          I certify that these entries are true and correct — {log.header.driver_name || "Driver"} ___________________
        </footer>
      </div>
    </article>
  );
}
