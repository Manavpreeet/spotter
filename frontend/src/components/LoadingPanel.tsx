import { useEffect, useState } from "react";

const STEPS = [
  "Finding addresses on the map",
  "Calculating driving route",
  "Applying HOS rules (11/14/70-8)",
  "Building daily log sheets",
];

export function LoadingPanel() {
  const [activeStep, setActiveStep] = useState(0);

  useEffect(() => {
    const id = setInterval(() => {
      setActiveStep((s) => (s < STEPS.length - 1 ? s + 1 : s));
    }, 1400);
    return () => clearInterval(id);
  }, []);

  return (
    <div className="loading-panel card" role="status" aria-live="polite" aria-busy="true">
      <div className="loading-ring" aria-hidden />
      <h3 className="loading-title">Planning your trip…</h3>
      <p className="loading-sub">This usually takes a few seconds.</p>
      <ul className="loading-steps">
        {STEPS.map((label, i) => (
          <li key={label} className={i <= activeStep ? "active" : ""}>
            <span className="loading-step-icon">{i < activeStep ? "✓" : i === activeStep ? "…" : ""}</span>
            {label}
          </li>
        ))}
      </ul>
    </div>
  );
}
