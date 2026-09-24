import {
  GlyfChart,
  GlyfFilters,
  GlyfProvider,
  useGlyf,
  useGlyfChart,
  useGlyfFilters,
  type GlyfTheme,
} from "@glyf/react";
import { useEffect, useState, type ReactNode } from "react";

// The site glyf built from examples/clanker_insights, copied in by
// `npm run sync:bundle`. Every chart below is drawn from it.
const BUNDLE = "/glyf/clanker_insights/bundle.json";
const DASHBOARD = "insights";

// Steel blue, amber, moss, plum, signal red: machine-shop paint. Red comes
// late so it is not handed to a series that means nothing bad.
const PALETTE = ["#3B6E9C", "#D99A1E", "#4F8A5B", "#8566A8", "#C4432B", "#6F7C76"];
// Outcomes, in legend order: escalated, failed, succeeded.
const OUTCOMES = ["#D99A1E", "#C4432B", "#4F8A5B"];

const NAV = ["Agents", "Runs", "Insights", "Schedules", "Billing", "Settings"];

export function App() {
  const [theme, setTheme] = useState<GlyfTheme>(initialTheme);

  useEffect(() => {
    document.documentElement.dataset.theme = theme;
    try {
      localStorage.setItem("clanker-theme", theme);
    } catch {
      // Private windows refuse storage; the theme still applies.
    }
  }, [theme]);

  return (
    <GlyfProvider
      bundleUrl={BUNDLE}
      theme={theme}
      palette={PALETTE}
      font="Archivo"
      loading={<Status>Loading your workspace's charts.</Status>}
      error={(error) => (
        <Status>
          The charts could not be loaded: {error.message}. Run <code>npm run sync:bundle</code>{" "}
          after building the glyf example.
        </Status>
      )}
    >
      <div className="shell">
        <Rail theme={theme} onTheme={setTheme} />
        <Insights />
      </div>
    </GlyfProvider>
  );
}

function initialTheme(): GlyfTheme {
  try {
    const saved = localStorage.getItem("clanker-theme");
    if (saved === "light" || saved === "dark") return saved;
  } catch {
    // Fall through to the system preference.
  }
  return window.matchMedia?.("(prefers-color-scheme: dark)").matches ? "dark" : "light";
}

function Rail({ theme, onTheme }: { theme: GlyfTheme; onTheme: (theme: GlyfTheme) => void }) {
  return (
    <aside className="rail">
      <a className="plate" href="/" aria-label="Clanker home">
        <Mark />
        <span>Clanker</span>
      </a>

      <div className="workspace">
        <span className="workspace-name">Acme Logistics</span>
        <span className="workspace-plan">Team plan, 5 agents</span>
      </div>

      <nav className="nav" aria-label="Workspace">
        {NAV.map((item) =>
          item === "Insights" ? (
            <a key={item} className="nav-item is-current" href="#top" aria-current="page">
              {item}
            </a>
          ) : (
            <span key={item} className="nav-item" aria-disabled="true" title="Not part of this demo">
              {item}
            </span>
          ),
        )}
      </nav>

      <div className="rail-foot">
        <button
          type="button"
          className="theme-switch"
          onClick={() => onTheme(theme === "dark" ? "light" : "dark")}
          aria-label={`Switch to ${theme === "dark" ? "light" : "dark"} theme`}
        >
          {theme === "dark" ? "Light theme" : "Dark theme"}
        </button>
        <a className="made-with" href="https://glyfdata.com" target="_blank" rel="noreferrer">
          Charts built with glyf
        </a>
      </div>
    </aside>
  );
}

function Insights() {
  return (
    <main className="page" id="top">
      <header className="masthead">
        <p className="period">Six weeks to 20 September 2026</p>
        <h1 className="stamp">427 runs this week. Code Reviewer needs a look.</h1>
        <p className="lede">
          Your five agents ran 2,281 tasks since 10 August, and nine in ten finished on their
          own. Code Reviewer is the exception: a tools deploy on 10 September timed out four of
          its ten runs that day, and its success rate has stayed below 80% since.
        </p>
      </header>

      <div className="toolbar">
        <GlyfFilters dashboard={DASHBOARD} className="filters" />
        <FilterNote />
      </div>

      <section className="instruments" aria-label="This week against last week">
        {["runs_this_week", "success_rate_this_week", "spend_this_week", "median_duration_this_week"].map(
          (name) => (
            <Instrument key={name} name={name} />
          ),
        )}
      </section>

      <Section
        title="Is the work getting done?"
        intro="Share of runs each agent finished without a person stepping in, week by week, and how long those runs took."
      >
        <Panel name="weekly_success_by_agent" span="half" note="Code Reviewer fell to 78% in W37." />
        <Panel name="duration_by_agent" span="half" note="Median, quartiles and the slowest runs." />
        <Panel
          name="daily_runs_by_outcome"
          span="full"
          height={260}
          palette={OUTCOMES}
          note="Escalated runs were handed to a person."
        />
      </Section>

      <Section
        title="Where the money goes"
        intro="Each run costs its model's tokens plus a two-cent platform fee."
      >
        <Panel name="spend_by_model" span="wide" note="clank-ultra is an eighth of the runs and most of the bill." />
        <Panel name="runs_by_trigger" note="What started each run." />
        <Panel name="spend_by_agent" span="half" note="Six weeks, split by model." />
        <Panel name="tokens_vs_cost" span="half" note="Each model sits on its own price line." />
      </Section>

      <Section title="What broke, and when" intro="Failed runs by cause, and the hours your agents are busiest.">
        <Panel name="recent_failures" span="half" />
        <Panel name="runs_by_hour" span="half" note="Weekday by hour, UTC." />
      </Section>

      <footer className="colophon">
        <p>
          This page is a demo of{" "}
          <a href="https://github.com/glyf-data/glyf-js" target="_blank" rel="noreferrer">
            glyf-js
          </a>
          . Every chart is defined as SQL in a dbt project, built by glyf, and drawn here with{" "}
          <code>@glyf/react</code>. The data is synthetic.
        </p>
        <p>
          <a href={`/glyf/clanker_insights/dashboards/${DASHBOARD}.html`}>
            Open the same charts as a glyf dashboard
          </a>
        </p>
      </footer>
    </main>
  );
}

function Instrument({ name }: { name: string }) {
  const chart = useGlyfChart(name);
  return (
    <div className="instrument">
      <h2 className="instrument-label">{chart?.title ?? name}</h2>
      <GlyfChart name={name} />
    </div>
  );
}

function Section({ title, intro, children }: { title: string; intro: string; children: ReactNode }) {
  return (
    <section className="section">
      <header className="section-head">
        <h2>{title}</h2>
        <p>{intro}</p>
      </header>
      <div className="grid">{children}</div>
    </section>
  );
}

function Panel({
  name,
  note,
  span,
  height,
  palette,
}: {
  name: string;
  note?: string;
  span?: "half" | "wide" | "full";
  height?: number;
  palette?: string[];
}) {
  const chart = useGlyfChart(name);
  return (
    <article className={`panel${span ? ` panel--${span}` : ""}`}>
      <header className="panel-head">
        <h3>{chart?.title ?? name}</h3>
        {note ? <p>{note}</p> : null}
      </header>
      <GlyfChart name={name} height={height} palette={palette} className="panel-chart" />
    </article>
  );
}

function FilterNote() {
  const filters = useGlyfFilters();
  const glyf = useGlyf();
  if (!filters.length) {
    return <p className="filter-note">Filter by agent or model. Charts that cannot be filtered are dimmed.</p>;
  }
  return (
    <p className="filter-note is-set">
      Showing {filters.map((filter) => `${filter.field} ${filter.values.join(" or ")}`).join(", and ")}.{" "}
      <button type="button" onClick={() => glyf.clearFilters()}>
        Show everything
      </button>
    </p>
  );
}

function Status({ children }: { children: ReactNode }) {
  return (
    <div className="status" role="status">
      <Mark />
      <p>{children}</p>
    </div>
  );
}

function Mark() {
  return (
    <svg className="mark" viewBox="0 0 32 32" aria-hidden="true">
      <rect width="32" height="32" rx="6" />
      <path d="M9 11h14v10H9z" />
      <circle cx="13" cy="16" r="1.8" />
      <circle cx="19" cy="16" r="1.8" />
    </svg>
  );
}
