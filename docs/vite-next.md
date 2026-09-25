# Vite and Next.js Usage

The package model is intentionally simple: build Glyf artifacts outside the app,
publish or copy them into a static location, then point `GlyfProvider` at
`bundle.json`.

## Vite

For Vite, copy the exported Glyf site into `public/`:

```text
public/glyf/product_analytics/
  bundle.json
  charts/
  dashboards/
  compiled/
  assets/
```

Use an app-local bundle URL:

```tsx
<GlyfProvider bundleUrl="/glyf/product_analytics/bundle.json">
  <GlyfChart name="activation_by_plan" />
</GlyfProvider>
```

Vite serves `public/` files from the app root, so the bundle URL resolves to:

```text
http://localhost:5173/glyf/product_analytics/bundle.json
```

## Next.js

For Next.js, copy the exported Glyf site into `public/`:

```text
public/glyf/product_analytics/
  bundle.json
  charts/
  dashboards/
  compiled/
  assets/
```

Render from a client component:

```tsx
"use client";

import { GlyfProvider, GlyfChart } from "@glyf-data/react";

export function AnalyticsPanel() {
  return (
    <GlyfProvider bundleUrl="/glyf/product_analytics/bundle.json">
      <GlyfChart name="activation_by_plan" />
    </GlyfProvider>
  );
}
```

## CDN or Object Storage

If the bundle is hosted outside the app:

```tsx
<GlyfProvider bundleUrl="https://cdn.company.com/glyf/product/bundle.json">
  <GlyfChart name="activation_by_plan" />
</GlyfProvider>
```

For private bundles, have the app backend issue a scoped URL or pass auth
headers:

```tsx
<GlyfProvider
  bundleUrl="https://analytics.company.com/glyf/product/bundle.json"
  headers={{ Authorization: `Bearer ${token}` }}
>
  <GlyfChart name="activation_by_plan" />
</GlyfProvider>
```

The browser can inspect any data or artifact it receives. Do access control
before returning the bundle or chart artifact.
