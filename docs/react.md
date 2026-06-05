# @glyf/react

`@glyf/react` provides React components and hooks for rendering charts from a
Glyf bundle.

## Install

```bash
npm install @glyf/client @glyf/react
```

## Provider

Wrap the analytics area with `GlyfProvider`:

```tsx
import { GlyfProvider } from "@glyf/react";

export function App() {
  return (
    <GlyfProvider bundleUrl="/glyf/product_analytics/bundle.json">
      <AnalyticsPanel />
    </GlyfProvider>
  );
}
```

`GlyfProvider` loads `bundle.json` once and exposes a `GlyfClient` to child
components.

## Chart Component

Render a chart by name:

```tsx
import { GlyfChart } from "@glyf/react";

export function AnalyticsPanel() {
  return <GlyfChart name="activation_by_plan" />;
}
```

By default, `GlyfChart` prefers the exported SVG artifact and falls back to PNG.

```tsx
<GlyfChart
  name="activation_by_plan"
  artifact="png"
  showTitle={false}
  className="chart-card"
  imageClassName="chart-image"
/>
```

## Hooks

Use `useGlyfClient` when you need direct access to the client:

```tsx
import { useGlyfClient } from "@glyf/react";

export function ChartCount() {
  const client = useGlyfClient();
  return <span>{client.listCharts().length} charts</span>;
}
```

Use `useGlyfChart` to read one chart definition from the bundle:

```tsx
import { useGlyfChart } from "@glyf/react";

export function ChartTitle() {
  const chart = useGlyfChart("activation_by_plan");
  return <h2>{chart?.title}</h2>;
}
```

## Loading and Error States

```tsx
<GlyfProvider
  bundleUrl="/glyf/product_analytics/bundle.json"
  loading={<div>Loading analytics...</div>}
  error={(error) => <div>{error.message}</div>}
>
  <AnalyticsPanel />
</GlyfProvider>
```

## Current Limitations

The current implementation renders exported SVG/PNG images. It does not yet
render Vega specs, apply runtime filters, or execute SQL in the browser.
