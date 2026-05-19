import { useId, useState } from "react";

interface Props {
  text: string;
}

export function HintIcon({ text }: Props) {
  const [open, setOpen] = useState(false);
  const tooltipId = useId();

  return (
    <span
      className="hint-wrap"
      onMouseEnter={() => setOpen(true)}
      onMouseLeave={() => setOpen(false)}
      onFocus={() => setOpen(true)}
      onBlur={() => setOpen(false)}
    >
      <button
        type="button"
        className="hint-btn"
        aria-label="More information"
        aria-describedby={open ? tooltipId : undefined}
      >
        ?
      </button>
      {open && (
        <span id={tooltipId} role="tooltip" className="hint-tooltip">
          {text}
        </span>
      )}
    </span>
  );
}
