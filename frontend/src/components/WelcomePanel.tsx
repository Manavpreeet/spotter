interface Props {
  onTryExample?: () => void;
}

const STEPS = [
  {
    icon: "📍",
    title: "Set your route",
    text: "Where you are now, where you pick up, and where you deliver.",
  },
  {
    icon: "⏱",
    title: "Add cycle hours",
    text: "How many of your 70-hour week you have already used (0–70).",
  },
  {
    icon: "📋",
    title: "Get your plan",
    text: "Map, rest stops, step-by-step instructions, and daily log sheets.",
  },
];

export function WelcomePanel({ onTryExample }: Props) {
  return (
    <article className="welcome-panel card">
      <header className="welcome-header">
        <span className="welcome-icon" aria-hidden>
          🚛
        </span>
        <div>
          <h3>Your trip preview appears here</h3>
          <p className="welcome-lead">
            Fill in the form on the left, then click <strong>Plan my trip</strong>. We will build a
            compliant schedule and logs for you.
          </p>
        </div>
      </header>

      <ol className="welcome-steps">
        {STEPS.map((s) => (
          <li key={s.title}>
            <span className="welcome-step-icon" aria-hidden>
              {s.icon}
            </span>
            <div>
              <strong>{s.title}</strong>
              <p>{s.text}</p>
            </div>
          </li>
        ))}
      </ol>

      {onTryExample && (
        <button type="button" className="btn-ghost" onClick={onTryExample}>
          Load example: Chicago → Denver → Los Angeles
        </button>
      )}
    </article>
  );
}
