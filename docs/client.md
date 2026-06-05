# @glyf/client

`@glyf/client` is the low-level package for loading and resolving Glyf artifact
bundles.

## Install

```bash
npm install @glyf/client
```

## Load a Bundle

```ts
import { GlyfClient } from "@glyf/client";

const client = await GlyfClient.load({
  bundleUrl: "/glyf/product_analytics/bundle.json",
});
```

## List Charts and Dashboards

```ts
const charts = client.listCharts();
const dashboards = client.listDashboards();
```

Each chart entry includes the chart name and the chart spec from `bundle.json`.

## Resolve Chart Artifacts

```ts
const svgUrl = client.chartArtifactUrl("activation_by_plan", "svg");
const pngUrl = client.chartArtifactUrl("activation_by_plan", "png");
const metadataUrl = client.chartArtifactUrl("activation_by_plan", "metadata");
```

The client resolves artifact paths relative to the bundle URL. This works for
absolute URLs and app-local public paths.

```ts
client.chartArtifactUrl("activation_by_plan", "svg");
// /glyf/product_analytics/charts/activation_by_plan.svg
```

## Fetch Chart Metadata

```ts
const metadata = await client.chartMetadata("activation_by_plan");
```

Metadata comes from the exported chart JSON file. In public exports, internal
normalized data and Vega spec paths are removed.

## Authenticated Requests

Pass headers or credentials when the bundle is served behind an authenticated
endpoint:

```ts
const client = await GlyfClient.load({
  bundleUrl: "https://analytics.company.com/glyf/product/bundle.json",
  headers: {
    Authorization: `Bearer ${token}`,
  },
});
```

The client does not implement authentication itself. The host app decides how
users authenticate and which bundle URL they are allowed to load.
