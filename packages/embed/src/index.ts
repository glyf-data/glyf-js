// @glyf-data/embed: draw glyf charts live in any page, with no framework.
//
//   const glyf = await createGlyf({ bundleUrl: "/glyf/bundle.json", theme: "dark" });
//   glyf.mount(document.querySelector("#spend"), "spend_by_model");
//   glyf.mountFilters(document.querySelector("#filters"), "insights");
//
// A drawn chart is rendered from the Vega spec the bundle publishes under
// glyf's `export.embed`, so it has tooltips and follows the page's theme and
// filters; without a spec it falls back to the SVG. Tables and KPI tiles are
// the fragments glyf built. Filters apply to every mounted chart whose rows
// carry the field, and a chart that cannot be filtered says so.

import {
  GlyfClient,
  type GlyfChart,
  type GlyfClientOptions,
  type GlyfDashboardFilter,
  type GlyfFilterControl,
} from "@glyf-data/client";
import embed, { type Result } from "vega-embed";

import { hasRows, prepareSpec, specColumns, type ActiveFilter, type GlyfTheme } from "./spec.js";

export { filterExpression, prepareSpec, specColumns, type ActiveFilter, type GlyfTheme } from "./spec.js";
export { GlyfClient } from "@glyf-data/client";

export interface GlyfOptions extends GlyfClientOptions {
  bundleUrl: string;
  theme?: GlyfTheme;
  /** Series colours, in order, for every drawn chart. */
  palette?: string[];
  /** Font for chart labels. */
  font?: string;
}

export interface MountOptions {
  /** Chart height in pixels; the chart's own otherwise. */
  height?: number;
  /** Keep the chart's own title inside the drawing. */
  showTitle?: boolean;
  /** Colours for this chart's series, in the order its legend lists them. */
  palette?: string[];
}

/** What a mounted chart currently shows. */
export type ChartState = "loading" | "ready" | "unfiltered" | "empty" | "error";

export interface ChartHandle {
  readonly name: string;
  readonly state: ChartState;
  /** Draw again, with the current theme and filters. */
  refresh(): Promise<void>;
  destroy(): void;
}

export interface FiltersHandle {
  destroy(): void;
}

type Listener = () => void;

export async function createGlyf(options: GlyfOptions): Promise<Glyf> {
  const client = await GlyfClient.load(options);
  return new Glyf(client, options);
}

export class Glyf {
  readonly client: GlyfClient;
  private theme: GlyfTheme;
  private readonly options: GlyfOptions;
  private readonly filters = new Map<string, string[]>();
  private readonly charts = new Set<MountedChart>();
  private readonly listeners = new Set<Listener>();

  constructor(client: GlyfClient, options: GlyfOptions) {
    this.client = client;
    this.options = options;
    this.theme = options.theme ?? "light";
  }

  get currentTheme(): GlyfTheme {
    return this.theme;
  }

  /** The filters in effect: fields with at least one value kept. */
  get activeFilters(): ActiveFilter[] {
    return [...this.filters.entries()]
      .filter(([, values]) => values.length > 0)
      .map(([field, values]) => ({ field, values }));
  }

  chart(name: string): GlyfChart | undefined {
    return this.client.getChart(name);
  }

  /** A dashboard's filters as the bundle describes them. */
  dashboardFilters(dashboard: string): GlyfDashboardFilter[] {
    return this.client.getDashboard(dashboard)?.filters ?? [];
  }

  setTheme(theme: GlyfTheme): void {
    if (theme === this.theme) return;
    this.theme = theme;
    this.redraw();
  }

  /** Keep only rows whose `field` is one of `values`; an empty list clears it. */
  setFilter(field: string, values: string[]): void {
    this.filters.set(field, [...values]);
    this.redraw();
  }

  clearFilters(): void {
    this.filters.clear();
    this.redraw();
  }

  /** Called whenever the filters or the theme change. Returns an unsubscribe. */
  subscribe(listener: Listener): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  mount(element: HTMLElement, name: string, options: MountOptions = {}): ChartHandle {
    const chart = new MountedChart(this, element, name, options);
    this.charts.add(chart);
    void chart.refresh();
    return {
      name,
      get state() {
        return chart.state;
      },
      refresh: () => chart.refresh(),
      destroy: () => {
        chart.destroy();
        this.charts.delete(chart);
      },
    };
  }

  /** Draw a dashboard's filters as controls that drive every mounted chart. */
  mountFilters(element: HTMLElement, dashboard: string): FiltersHandle {
    const render = () => renderFilters(element, this, this.dashboardFilters(dashboard));
    render();
    const unsubscribe = this.subscribe(render);
    return {
      destroy: () => {
        unsubscribe();
        element.replaceChildren();
      },
    };
  }

  /** @internal */
  specOptions() {
    return {
      theme: this.theme,
      filters: this.activeFilters,
      palette: this.options.palette,
      font: this.options.font,
    };
  }

  private redraw(): void {
    for (const chart of this.charts) void chart.refresh();
    for (const listener of this.listeners) listener();
  }
}

class MountedChart {
  state: ChartState = "loading";
  private view: Result | undefined;
  private spec: Record<string, unknown> | undefined;
  private fragment: string | undefined;
  private destroyed = false;
  private readonly body: HTMLElement;
  private readonly mark: HTMLElement;

  constructor(
    private readonly glyf: Glyf,
    private readonly element: HTMLElement,
    readonly name: string,
    private readonly options: MountOptions,
  ) {
    element.classList.add("glyf-embed");
    element.dataset.glyfChart = name;
    this.body = document.createElement("div");
    this.body.className = "glyf-embed-body";
    this.mark = document.createElement("div");
    this.mark.className = "glyf-embed-mark";
    this.mark.setAttribute("aria-hidden", "true");
    element.replaceChildren(this.body, this.mark);
  }

  async refresh(): Promise<void> {
    const chart = this.glyf.chart(this.name);
    this.element.dataset.glyfTheme = this.glyf.currentTheme;
    try {
      if (!chart) throw new Error(`glyf chart not found: ${this.name}`);
      if (chart.chart_type === "table") await this.drawTable();
      else if (chart.chart_type === "kpi") await this.drawKpi();
      else if (chart.artifacts.vega) await this.drawVega();
      else this.drawPicture();
    } catch (error) {
      if (this.destroyed) return;
      this.setState("error", error instanceof Error ? error.message : String(error));
    }
  }

  destroy(): void {
    this.destroyed = true;
    this.view?.finalize();
    this.element.replaceChildren();
    this.element.classList.remove("glyf-embed");
  }

  private async drawVega(): Promise<void> {
    this.spec ??= await this.glyf.client.fetchArtifactJson(this.name, "vega");
    if (this.destroyed || !this.spec) return;
    const settings = this.glyf.specOptions();
    const prepared = prepareSpec(this.spec, {
      ...settings,
      height: this.options.height,
      showTitle: this.options.showTitle,
      palette: this.options.palette ?? settings.palette,
    });
    this.view?.finalize();
    this.view = await embed(this.body, prepared as never, {
      actions: false,
      renderer: "svg",
    });
    if (this.destroyed) return;
    const columns = specColumns(this.spec);
    const cannot = settings.filters.filter((filter) => !columns.has(filter.field));
    if (settings.filters.length && cannot.length === settings.filters.length) {
      this.setState("unfiltered", "Not filtered");
    } else if (settings.filters.length && !hasRows(this.spec, settings.filters)) {
      this.setState("empty", "No data");
    } else {
      this.setState("ready");
    }
  }

  private drawPicture(): void {
    const src =
      this.glyf.client.chartArtifactUrl(this.name, "svg") ??
      this.glyf.client.chartArtifactUrl(this.name, "png");
    if (!src) throw new Error(`glyf chart ${this.name} has nothing to draw`);
    const image = document.createElement("img");
    image.src = src;
    image.alt = this.glyf.chart(this.name)?.title ?? this.name;
    image.className = "glyf-embed-picture";
    this.body.replaceChildren(image);
    // A picture cannot be redrawn with the filter applied.
    this.setState(this.glyf.activeFilters.length ? "unfiltered" : "ready", "Not filtered");
  }

  private async drawKpi(): Promise<void> {
    // The fragment is glyf's own build output, escaped when it was written.
    this.fragment ??= await this.glyf.client.fetchArtifactText(this.name, "kpi");
    if (this.destroyed) return;
    this.body.innerHTML = this.fragment ?? "";
    // One aggregated number: it cannot be recomputed for a filter.
    this.setState(this.glyf.activeFilters.length ? "unfiltered" : "ready", "Not filtered");
  }

  private async drawTable(): Promise<void> {
    this.fragment ??= await this.glyf.client.fetchArtifactText(this.name, "table");
    if (this.destroyed) return;
    this.body.innerHTML = this.fragment ?? "";
    const filters = this.glyf.activeFilters;
    const table = this.body.querySelector("table");
    if (!table || !filters.length) {
      this.setState("ready");
      return;
    }
    const headers = [...table.querySelectorAll("th[data-column]")].map(
      (th) => (th as HTMLElement).dataset.column ?? "",
    );
    const applicable = filters.filter((filter) => headers.includes(filter.field));
    if (!applicable.length) {
      this.setState("unfiltered", "Not filtered");
      return;
    }
    let shown = 0;
    for (const row of table.querySelectorAll("tbody tr")) {
      const cells = (row as HTMLTableRowElement).cells;
      const keep = applicable.every((filter) =>
        filter.values.includes(cells[headers.indexOf(filter.field)]?.textContent ?? ""),
      );
      (row as HTMLElement).hidden = !keep;
      if (keep) shown += 1;
    }
    this.setState(shown ? "ready" : "empty", "No data");
  }

  private setState(state: ChartState, label = ""): void {
    this.state = state;
    this.element.dataset.glyfState = state;
    this.mark.textContent = state === "ready" || state === "loading" ? "" : label;
  }
}

function renderFilters(
  element: HTMLElement,
  glyf: Glyf,
  filters: GlyfDashboardFilter[],
): void {
  element.classList.add("glyf-embed-filters");
  element.dataset.glyfTheme = glyf.currentTheme;
  const active = new Map(glyf.activeFilters.map((filter) => [filter.field, filter.values]));
  const controls = filters.map((filter) => {
    const kept = active.get(filter.field) ?? [];
    return renderControl(glyf, filter, filter.control ?? "select", kept);
  });
  if (active.size) {
    const clear = document.createElement("button");
    clear.type = "button";
    clear.className = "glyf-embed-clear";
    clear.textContent = "Clear";
    clear.addEventListener("click", () => glyf.clearFilters());
    controls.push(clear);
  }
  element.replaceChildren(...controls);
}

function renderControl(
  glyf: Glyf,
  filter: GlyfDashboardFilter,
  control: GlyfFilterControl,
  kept: string[],
): HTMLElement {
  const box = document.createElement("div");
  box.className = `glyf-embed-filter glyf-embed-filter--${control}`;
  box.classList.toggle("is-set", kept.length > 0);
  box.setAttribute("role", "group");
  box.setAttribute("aria-label", `Filter by ${filter.field}`);
  const label = document.createElement("span");
  label.className = "glyf-embed-filter-field";
  label.textContent = filter.field;
  box.append(label);

  if (control === "select") {
    const select = document.createElement("select");
    select.setAttribute("aria-label", `Filter by ${filter.field}`);
    for (const value of ["", ...filter.values]) {
      const option = document.createElement("option");
      option.value = value;
      option.textContent = value || "All";
      option.selected = value === (kept[0] ?? "");
      select.append(option);
    }
    select.addEventListener("change", () =>
      glyf.setFilter(filter.field, select.value ? [select.value] : []),
    );
    box.append(select);
    return box;
  }

  const values = control === "radio" ? ["", ...filter.values] : filter.values;
  for (const value of values) {
    const button = document.createElement("button");
    button.type = "button";
    button.textContent = value || "All";
    const on = value === "" ? kept.length === 0 : kept.includes(value);
    button.classList.toggle("is-on", on);
    button.setAttribute("aria-pressed", String(on));
    button.addEventListener("click", () => {
      if (control === "radio") {
        glyf.setFilter(filter.field, value ? [value] : []);
      } else {
        glyf.setFilter(
          filter.field,
          on ? kept.filter((item) => item !== value) : [...kept, value],
        );
      }
    });
    box.append(button);
  }
  return box;
}
