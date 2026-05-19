import { useCallback, useRef, useState } from "react";
import { planTrip } from "./api/client";
import { LoadingPanel } from "./components/LoadingPanel";
import { RoutePreviewPanel } from "./components/RoutePreviewPanel";
import { StepIndicator } from "./components/StepIndicator";
import { TripForm, type TripFormValues, type TripLocations } from "./components/TripForm";
import { TripResults } from "./components/TripResults";
import type { PlanTripResponse } from "./types";
import "./App.css";

const defaultLocations: TripLocations = {
  current: "Chicago, IL",
  pickup: "Denver, CO",
  dropoff: "Los Angeles, CA",
};

function App() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<PlanTripResponse | null>(null);
  const [locations, setLocations] = useState<TripLocations>(defaultLocations);
  const contentRef = useRef<HTMLElement>(null);

  const handleLocationsChange = useCallback((loc: TripLocations) => {
    setLocations(loc);
  }, []);

  const handleSubmit = async (values: TripFormValues) => {
    setLoading(true);
    setError(null);
    try {
      const data = await planTrip(values);
      setResult(data);
      requestAnimationFrame(() => {
        contentRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
      });
    } catch (e) {
      setResult(null);
      setError(e instanceof Error ? e.message : "Unknown error");
    } finally {
      setLoading(false);
    }
  };

  const handleNewTrip = () => {
    setResult(null);
    setError(null);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const routeValid = locations.pickup !== locations.dropoff;
  const step = result ? 2 : 1;

  return (
    <div className="app">
      <a href="#main-content" className="skip-link">
        Skip to content
      </a>
      <div className="app-bg" aria-hidden />

      <header className="site-header">
        <div className="site-header-inner">
          <div className="brand">
            <span className="brand-mark">S</span>
            <span className="brand-name">spotter</span>
            <span className="brand-dot">ai</span>
          </div>
          <span className="status-pill">
            <span className="status-dot" />
            HOS Planner
          </span>
        </div>
      </header>

      <section className={`hero ${result ? "hero-compact" : ""}`}>
        <div className="hero-inner">
          <StepIndicator current={step} />
          {!result && (
            <>
              <h1>
                Plan your haul &amp; <span className="gradient-text">daily logs</span>
              </h1>
              <p className="tagline">
                Enter three stops and your cycle hours. We handle routes, rest breaks, fuel stops,
                and FMCSA-style log grids.
              </p>
            </>
          )}
          {result && (
            <div className="hero-results-bar">
              <h1 className="hero-results-title">Your trip is ready</h1>
              <button type="button" className="btn-ghost btn-sm" onClick={handleNewTrip}>
                ← Plan another trip
              </button>
            </div>
          )}
        </div>
      </section>

      <main id="main-content" className="main" ref={contentRef}>
        <aside className="sidebar">
          <TripForm
            loading={loading}
            onSubmit={handleSubmit}
            onLocationsChange={handleLocationsChange}
          />
        </aside>

        <section className="content" aria-live="polite">
          {loading && <LoadingPanel />}

          {error && !loading && (
            <div className="error-banner card" role="alert">
              <span className="error-icon" aria-hidden>
                ⚠
              </span>
              <div>
                <strong>Could not plan this trip</strong>
                <p>{error}</p>
                <p className="error-tip">Try simpler city names like &quot;Denver, CO&quot; or check that the API is running.</p>
              </div>
            </div>
          )}

          {!loading && !result && !error && (
            <RoutePreviewPanel
              current={locations.current}
              pickup={locations.pickup}
              dropoff={locations.dropoff}
              routeValid={routeValid}
            />
          )}

          {result && !loading && (
            <div className="results-enter">
              <TripResults data={result} onNewTrip={handleNewTrip} />
            </div>
          )}
        </section>
      </main>

      <footer className="footer">
        <p>Maps © OpenStreetMap · Routing OSRM · Not a certified ELD — for planning only</p>
      </footer>
    </div>
  );
}

export default App;
