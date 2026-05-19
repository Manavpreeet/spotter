import { useEffect, useRef, useState } from "react";
import { searchLocations } from "../api/geocode";
import { TRIP_LOCATIONS } from "../data/locations";

interface Props {
  id: string;
  label: React.ReactNode;
  value: string;
  onChange: (value: string) => void;
  invalid?: boolean;
  onBlur?: () => void;
}

export function LocationAutocomplete({ id, label, value, onChange, invalid, onBlur }: Props) {
  const [open, setOpen] = useState(false);
  const [suggestions, setSuggestions] = useState<{ value: string; label: string }[]>([]);
  const [loading, setLoading] = useState(false);
  const wrapRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const q = value.trim();
    if (q.length < 2) {
      setSuggestions(
        TRIP_LOCATIONS.slice(0, 6).map((l) => ({ value: l.value, label: l.label })),
      );
      return;
    }
    const t = setTimeout(async () => {
      setLoading(true);
      try {
        const remote = await searchLocations(q);
        const merged = [
          ...TRIP_LOCATIONS.filter((l) =>
            l.label.toLowerCase().includes(q.toLowerCase()),
          ).map((l) => ({ value: l.value, label: l.label })),
          ...remote.map((r) => ({ value: r.value, label: r.label })),
        ];
        const seen = new Set<string>();
        setSuggestions(
          merged.filter((m) => {
            if (seen.has(m.value)) return false;
            seen.add(m.value);
            return true;
          }).slice(0, 8),
        );
      } catch {
        setSuggestions(
          TRIP_LOCATIONS.filter((l) => l.label.toLowerCase().includes(q.toLowerCase())).map(
            (l) => ({ value: l.value, label: l.label }),
          ),
        );
      } finally {
        setLoading(false);
      }
    }, 300);
    return () => clearTimeout(t);
  }, [value]);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  return (
    <label className="field autocomplete-field" htmlFor={id}>
      {label}
      <div className="autocomplete-wrap" ref={wrapRef}>
        <input
          id={id}
          type="text"
          className={`field-control ${invalid ? "invalid" : ""}`}
          value={value}
          onChange={(e) => {
            onChange(e.target.value);
            setOpen(true);
          }}
          onFocus={() => setOpen(true)}
          onBlur={() => {
            setTimeout(() => {
              setOpen(false);
              onBlur?.();
            }, 150);
          }}
          autoComplete="off"
          placeholder="City, State or address"
        />
        {open && suggestions.length > 0 && (
          <ul className="autocomplete-list" role="listbox">
            {loading && <li className="autocomplete-loading">Searching…</li>}
            {suggestions.map((s) => (
              <li key={s.value}>
                <button
                  type="button"
                  role="option"
                  onMouseDown={(e) => e.preventDefault()}
                  onClick={() => {
                    onChange(s.value);
                    setOpen(false);
                  }}
                >
                  {s.label}
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </label>
  );
}
