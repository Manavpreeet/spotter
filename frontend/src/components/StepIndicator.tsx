interface Props {
  current: 1 | 2;
}

const STEPS = [
  { n: 1, label: "Enter trip" },
  { n: 2, label: "View results" },
] as const;

export function StepIndicator({ current }: Props) {
  return (
    <nav className="step-indicator" aria-label="Progress">
      {STEPS.map((step, i) => (
        <div key={step.n} className="step-indicator-item">
          <span
            className={`step-dot ${current >= step.n ? "done" : ""} ${current === step.n ? "active" : ""}`}
            aria-current={current === step.n ? "step" : undefined}
          >
            {current > step.n ? "✓" : step.n}
          </span>
          <span className={`step-label ${current === step.n ? "active" : ""}`}>{step.label}</span>
          {i < STEPS.length - 1 && <span className="step-connector" aria-hidden />}
        </div>
      ))}
    </nav>
  );
}
