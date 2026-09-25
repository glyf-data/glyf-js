# Glyf JS Overview

`glyf-js` contains JavaScript packages for consuming Glyf artifact bundles from
application code.

Glyf CLI is still the artifact producer:

```bash
dbt build
glyf build
```

That produces:

```text
target/glyf/site/
  bundle.json
  charts/
  dashboards/
  compiled/
  assets/
```

`glyf-js` is the browser/app consumer:

```tsx
import { GlyfProvider, GlyfChart } from "@glyf-data/react";

export function AnalyticsPanel() {
  return (
    <GlyfProvider bundleUrl="/glyf/product_analytics/bundle.json">
      <GlyfChart name="activation_by_plan" />
    </GlyfProvider>
  );
}
```

## Package Split

- `@glyf-data/client` loads `bundle.json`, refuses a `bundle_version` it does not
  know, lists charts and dashboards, and resolves artifact URLs.
- `@glyf-data/embed` draws charts into any element: Vega from the bundle's
  published specs, KPI tiles, tables, and filter controls that drive them.
- `@glyf-data/react` mounts `@glyf-data/embed` from React components and hooks.
- `@glyf-data/example-clanker-insights` is a customer-facing page built with them.

## Rendering

A drawn chart is rendered live with Vega when the glyf project publishes its
spec (`export.embed: true`), so it has tooltips and follows the page's theme,
palette and filters. Without a spec it falls back to the SVG glyf rendered.
Tables and KPI tiles are the HTML fragments glyf built.

Everything is static files: no BI server, no query at runtime, any static
host. A published spec carries the chart's rows; use `export.row_data: minimal`
to publish only the columns each chart encodes, or a per-customer build when
each customer should see only their own rows.
