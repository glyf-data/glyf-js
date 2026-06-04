export type GlyfBundleMode = "local_artifact" | "public_site" | string;

export interface GlyfSecurity {
  public_export?: boolean;
  browser_visible_data?: string;
  internal_artifacts_included?: boolean;
  internal_artifacts?: string[];
}

export interface GlyfChartArtifacts {
  metadata?: string | null;
  png?: string | null;
  svg?: string | null;
  compiled_sql?: string | null;
  data?: string | null;
  vega?: string | null;
}

export interface GlyfChart {
  title?: string | null;
  chart_type?: string | null;
  fields?: {
    x?: string | null;
    y?: string | null;
  };
  artifacts: GlyfChartArtifacts;
  interactions?: string[];
}

export interface GlyfDashboard {
  title?: string | null;
  description?: string | null;
  path?: string | null;
  theme?: string | null;
  chart_theme?: string | null;
  tags?: string[];
  charts?: string[];
  filters?: Array<Record<string, unknown>>;
  source?: string | null;
}

export interface GlyfBundle {
  bundle_version: string;
  glyf_version?: string;
  project?: string;
  mode: GlyfBundleMode;
  generated_at?: string | null;
  paths?: Record<string, unknown>;
  security?: GlyfSecurity;
  charts: Record<string, GlyfChart>;
  dashboards: Record<string, GlyfDashboard>;
}

export interface GlyfClientOptions {
  headers?: HeadersInit;
  credentials?: RequestCredentials;
  fetcher?: typeof fetch;
}

export interface GlyfClientLoadOptions extends GlyfClientOptions {
  bundleUrl: string;
}

export type GlyfArtifactKind = keyof GlyfChartArtifacts;

export class GlyfClient {
  readonly bundle: GlyfBundle;
  readonly bundleUrl: string;
  private readonly options: GlyfClientOptions;

  constructor(bundle: GlyfBundle, bundleUrl: string, options: GlyfClientOptions = {}) {
    this.bundle = bundle;
    this.bundleUrl = bundleUrl;
    this.options = options;
  }

  static async load(options: GlyfClientLoadOptions): Promise<GlyfClient> {
    const bundle = await loadGlyfBundle(options.bundleUrl, options);
    return new GlyfClient(bundle, options.bundleUrl, options);
  }

  listCharts(): Array<{ name: string; chart: GlyfChart }> {
    return Object.entries(this.bundle.charts).map(([name, chart]) => ({ name, chart }));
  }

  listDashboards(): Array<{ name: string; dashboard: GlyfDashboard }> {
    return Object.entries(this.bundle.dashboards).map(([name, dashboard]) => ({
      name,
      dashboard,
    }));
  }

  getChart(name: string): GlyfChart | undefined {
    return this.bundle.charts[name];
  }

  requireChart(name: string): GlyfChart {
    const chart = this.getChart(name);
    if (!chart) {
      throw new Error(`Glyf chart not found: ${name}`);
    }
    return chart;
  }

  getDashboard(name: string): GlyfDashboard | undefined {
    return this.bundle.dashboards[name];
  }

  chartArtifactUrl(name: string, kind: GlyfArtifactKind = "svg"): string | undefined {
    const chart = this.getChart(name);
    const artifact = chart?.artifacts?.[kind];
    if (!artifact) {
      return undefined;
    }
    return resolveBundleUrl(this.bundleUrl, artifact);
  }

  dashboardUrl(name: string): string | undefined {
    const dashboard = this.getDashboard(name);
    if (!dashboard?.path) {
      return undefined;
    }
    return resolveBundleUrl(this.bundleUrl, dashboard.path);
  }

  async chartMetadata(name: string): Promise<Record<string, unknown> | undefined> {
    const url = this.chartArtifactUrl(name, "metadata");
    if (!url) {
      return undefined;
    }
    const response = await request(url, this.options);
    return response.json() as Promise<Record<string, unknown>>;
  }
}

export async function loadGlyfBundle(
  bundleUrl: string,
  options: GlyfClientOptions = {},
): Promise<GlyfBundle> {
  const response = await request(bundleUrl, options);
  const bundle = (await response.json()) as GlyfBundle;
  validateBundle(bundle, bundleUrl);
  return bundle;
}

export function resolveBundleUrl(bundleUrl: string, artifactPath: string): string {
  const baseHref =
    typeof globalThis.location?.href === "string"
      ? globalThis.location.href
      : "http://localhost/";
  const absoluteBundleUrl = new URL(bundleUrl, baseHref);
  return new URL(artifactPath, absoluteBundleUrl).toString();
}

function validateBundle(bundle: GlyfBundle, bundleUrl: string): void {
  if (!bundle || typeof bundle !== "object") {
    throw new Error(`Invalid Glyf bundle at ${bundleUrl}`);
  }
  if (!bundle.bundle_version) {
    throw new Error(`Glyf bundle is missing bundle_version: ${bundleUrl}`);
  }
  if (!bundle.charts || typeof bundle.charts !== "object") {
    throw new Error(`Glyf bundle is missing charts: ${bundleUrl}`);
  }
  if (!bundle.dashboards || typeof bundle.dashboards !== "object") {
    throw new Error(`Glyf bundle is missing dashboards: ${bundleUrl}`);
  }
}

async function request(url: string, options: GlyfClientOptions): Promise<Response> {
  const fetcher = options.fetcher ?? fetch;
  const response = await fetcher(url, {
    headers: options.headers,
    credentials: options.credentials,
  });
  if (!response.ok) {
    throw new Error(`Failed to load Glyf artifact ${url}: ${response.status}`);
  }
  return response;
}
