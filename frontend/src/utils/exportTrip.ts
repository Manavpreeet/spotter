import type { PlanTripResponse } from "../types";

export function downloadTripJson(data: PlanTripResponse, filename = "spotter-trip.json") {
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

const PRINT_STYLES = `
  body { font-family: Arial, Helvetica, sans-serif; padding: 16px; color: #111; }
  .fmcsa-log-print { max-width: 900px; margin: 0 auto; }
  .fmcsa-log-title-row { display: flex; justify-content: space-between; align-items: center; border-bottom: 2px solid #111; padding-bottom: 8px; margin-bottom: 12px; }
  .fmcsa-badge { font-size: 11px; border: 1px solid #333; padding: 2px 8px; }
  .fmcsa-meta-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 8px 16px; font-size: 13px; margin-bottom: 12px; }
  .fmcsa-span-2 { grid-column: span 2; }
  .fmcsa-label { display: block; font-size: 10px; text-transform: uppercase; color: #444; }
  .fmcsa-grid { width: 100%; height: auto; }
  .row-label, .hour-label { fill: #222; font-size: 11px; }
  .grid-line, .tick-minor { stroke: #ccc; }
  .tick-major { stroke: #666; }
  .duty-line { stroke: #111; stroke-width: 2; }
  .duty-connector { stroke: #111; stroke-width: 1.5; }
  .fmcsa-remarks, .fmcsa-recap { margin-top: 16px; font-size: 13px; }
  .recap-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 8px; }
  .fmcsa-cert { margin-top: 24px; font-size: 12px; border-top: 1px solid #333; padding-top: 12px; }
`;

export function printLogSheet(elementId: string) {
  const el = document.getElementById(elementId);
  if (!el) return;
  const content = el.querySelector(".fmcsa-log-print");
  if (!content) return;
  const win = window.open("", "_blank");
  if (!win) return;
  win.document.write(`
    <!DOCTYPE html><html><head><title>Daily Log — FMCSA</title>
    <style>${PRINT_STYLES}</style>
    </head><body>${content.outerHTML}</body></html>
  `);
  win.document.close();
  win.focus();
  setTimeout(() => win.print(), 250);
}
