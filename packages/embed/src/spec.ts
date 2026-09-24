// Pure functions over a glyf chart's Vega-Lite spec: themed, sized to its
// container, and filtered. Nothing here touches the DOM, so it is tested
// without a browser.

export type GlyfTheme = "light" | "dark";

/** A filter as the page holds it: the field and the values it keeps. */
export interface ActiveFilter {
  field: string;
  values: string[];
}

// The same colours glyf's own dashboards use, so an embedded chart matches
// the dashboard it came from. The background is left to the host page.
const THEMES: Record<GlyfTheme, Record<string, Record<string, unknown>>> = {
  dark: {
    view: { stroke: "#3f3f46", fill: null },
    axis: {
      labelColor: "#e4e4e7",
      titleColor: "#e4e4e7",
      domainColor: "#71717a",
      tickColor: "#71717a",
      gridColor: "#27272a",
    },
    legend: { labelColor: "#e4e4e7", titleColor: "#e4e4e7" },
    title: { color: "#f4f4f5", subtitleColor: "#a1a1aa" },
  },
  light: {
    view: { stroke: "#e4e4e7", fill: null },
    axis: {
      labelColor: "#27272a",
      titleColor: "#27272a",
      domainColor: "#a1a1aa",
      tickColor: "#a1a1aa",
      gridColor: "#e4e4e7",
    },
    legend: { labelColor: "#27272a", titleColor: "#27272a" },
    title: { color: "#09090b", subtitleColor: "#52525b" },
  },
};

export interface PrepareOptions {
  theme: GlyfTheme;
  filters: ActiveFilter[];
  /** Keep the spec's own title. Off by default: the host card has one. */
  showTitle?: boolean;
  /** Colours for series, in order: the host's brand palette. */
  palette?: string[];
  /** Font for every label, when the host uses its own. */
  font?: string;
  /** Height in pixels; the spec's own height otherwise. */
  height?: number;
}

type Spec = Record<string, unknown>;

/**
 * The spec ready to draw: a copy, themed, as wide as its container, and
 * filtered to the rows the page's filters keep.
 */
export function prepareSpec(spec: Spec, options: PrepareOptions): Spec {
  const prepared = structuredClone(spec) as Spec;
  const config = { ...((prepared.config as Spec | undefined) ?? {}) };
  for (const [key, values] of Object.entries(THEMES[options.theme])) {
    config[key] = { ...((config[key] as Spec | undefined) ?? {}), ...values };
  }
  if (options.palette?.length) {
    config.range = { ...((config.range as Spec | undefined) ?? {}), category: options.palette };
  }
  if (options.font) {
    config.font = options.font;
    for (const key of ["axis", "legend"]) {
      config[key] = { ...(config[key] as Spec), labelFont: options.font, titleFont: options.font };
    }
    config.title = { ...(config.title as Spec), font: options.font, subtitleFont: options.font };
  }
  prepared.config = config;
  prepared.background = null;
  prepared.width = "container";
  prepared.autosize = { type: "fit-x", contains: "padding" };
  if (options.height) {
    prepared.height = options.height;
  }
  if (!options.showTitle) {
    delete prepared.title;
  }
  const applicable = applicableFilters(prepared, options.filters);
  if (applicable.length) {
    const transform = (prepared.transform as unknown[] | undefined) ?? [];
    prepared.transform = [{ filter: filterExpression(applicable) }, ...transform];
  }
  return prepared;
}

/** The columns the spec's inline rows carry: what a filter can see. */
export function specColumns(spec: Spec): Set<string> {
  const datasets = (spec.datasets as Record<string, unknown> | undefined) ?? {};
  for (const rows of Object.values(datasets)) {
    if (Array.isArray(rows) && rows.length && rows[0] && typeof rows[0] === "object") {
      return new Set(Object.keys(rows[0] as object));
    }
  }
  return new Set();
}

/** The filters whose field this chart's rows carry. */
export function applicableFilters(spec: Spec, filters: ActiveFilter[]): ActiveFilter[] {
  const columns = specColumns(spec);
  return filters.filter((filter) => filter.values.length > 0 && columns.has(filter.field));
}

/**
 * A Vega expression keeping a row when, for every filter, its field equals one
 * of the filter's values. `indexOf` is not in every Vega build, so it is an OR
 * of equalities.
 */
export function filterExpression(filters: ActiveFilter[]): string {
  return filters
    .map((filter) => {
      const field = `toString(datum[${JSON.stringify(filter.field)}])`;
      return `(${filter.values.map((value) => `${field} == ${JSON.stringify(value)}`).join(" || ")})`;
    })
    .join(" && ");
}

/** Whether any inline row survives the filters: Vega draws an empty chart silently. */
export function hasRows(spec: Spec, filters: ActiveFilter[]): boolean {
  const applicable = applicableFilters(spec, filters);
  const datasets = (spec.datasets as Record<string, unknown> | undefined) ?? {};
  return Object.values(datasets).some(
    (rows) =>
      Array.isArray(rows) &&
      rows.some((row) =>
        applicable.every((filter) => filter.values.includes(String((row as Spec)[filter.field]))),
      ),
  );
}
