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
import { GlyfProvider, GlyfChart } from "@glyf/react";

export function AnalyticsPanel() {
  return (
    <GlyfProvider bundleUrl="/glyf/product_analytics/bundle.json">
      <GlyfChart name="activation_by_plan" />
    </GlyfProvider>
  );
}
```

## Package Split

- `@glyf/client` loads `bundle.json`, validates the basic shape, lists charts
  and dashboards, and resolves artifact URLs.
- `@glyf/react` provides React components and hooks built on top of
  `@glyf/client`.
- `@glyf/example-startup-saas` demonstrates how a product app can consume a
  copied Glyf bundle from its `public/` folder.

## Current Rendering Mode

The first version renders exported SVG/PNG chart artifacts directly through an
image element.

This keeps the public embed path simple:

- no Vega runtime required
- no normalized data exposed by default
- no BI server required
- works with plain static hosting

Future modes can add Vega rendering, filter-aware artifacts, signed URLs, and
cloud-mediated access control.
