import type { RouteInstruction } from "../types";

const TYPE_ICONS: Record<string, string> = {
  leg: "🛣",
  pickup: "📦",
  dropoff: "📍",
  fuel: "⛽",
  rest: "🛏",
  break: "☕",
  restart: "🔄",
  driving: "🚛",
  cycle: "⏸",
  event: "•",
};

interface Props {
  instructions: RouteInstruction[];
}

export function RouteInstructions({ instructions }: Props) {
  if (!instructions.length) {
    return (
      <p className="empty-tab-message">No step-by-step instructions for this trip.</p>
    );
  }

  return (
    <ol className="route-instructions">
      {instructions.map((item) => (
        <li key={`${item.step}-${item.type}-${item.title}`} className={`instr-${item.type}`}>
          <span className="instr-icon" aria-hidden>
            {TYPE_ICONS[item.type] ?? "•"}
          </span>
          <div className="instr-body">
            <strong>
              {item.step}. {item.title}
            </strong>
            <p>{item.detail}</p>
            {item.miles != null && item.miles > 0 && (
              <span className="instr-meta">{item.miles} mi</span>
            )}
          </div>
        </li>
      ))}
    </ol>
  );
}
