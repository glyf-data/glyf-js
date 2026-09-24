# glyf-js

Put [glyf](https://github.com/glyf-data/glyf) charts inside your own product:
live, themed and filterable, from the static site a glyf build writes.

The charts are defined as SQL in a dbt project, and `glyf build` renders them
and writes a site with a `bundle.json` manifest. glyf-js reads that manifest and
draws the charts in the browser. There is no server and no query at runtime.

```text
dbt project + .ggsql charts --glyf build--> target/glyf/site/bundle.json --glyf-js--> your app
```

**See it:** [Clanker Insights](examples/clanker-insights), a customer-facing
analytics page for a made-up AI agent platform, drawn entirely with
`@glyf/react`.

## Packages

| Package | What it does |
| --- | --- |
| [`@glyf/embed`](docs/embed.md) | The core, with no framework. Mounts a chart into any element: interactive charts from the bundle's Vega specs, KPI tiles, tables, and filter controls that drive them. Light and dark themes, your palette and font. |
| [`@glyf/react`](docs/react.md) | React components over `@glyf/embed`: `GlyfProvider`, `GlyfChart`, `GlyfFilters`, `useGlyfFilters`. |
| [`@glyf/client`](docs/client.md) | Loads and checks `bundle.json`, and resolves artifact URLs. Both of the above use it. |

The packages are not on npm yet; they build from this repository.

## Quick start

In the glyf project, publish the Vega specs so charts can be drawn live:

```yaml title="glyf.yml"
export:
  embed: true
```

Build it, and serve `target/glyf/site/` beside your app. Then:

```tsx
import "@glyf/embed/style.css";
import { GlyfChart, GlyfFilters, GlyfProvider } from "@glyf/react";

export function Insights() {
  return (
    <GlyfProvider bundleUrl="/glyf/bundle.json" theme="dark">
      <GlyfFilters dashboard="insights" />
      <GlyfChart name="spend_by_model" />
      <GlyfChart name="runs_this_week" />
    </GlyfProvider>
  );
}
```

Without React:

```ts
import "@glyf/embed/style.css";
import { createGlyf } from "@glyf/embed";

const glyf = await createGlyf({ bundleUrl: "/glyf/bundle.json", theme: "dark" });
glyf.mountFilters(document.querySelector("#filters")!, "insights");
glyf.mount(document.querySelector("#spend")!, "spend_by_model");
```

## The contract

`bundle.json` is the interface between glyf and glyf-js, versioned by
`bundle_version`. glyf publishes its JSON Schema at
[glyfdata.com/schema/bundle.v1.schema.json](https://glyfdata.com/schema/bundle.v1.schema.json);
`contract/` holds a copy, and CI checks the copy against the published schema
and checks the demo's real bundle against it. A client refuses a
`bundle_version` it does not know rather than guess.

## Develop

```bash
npm install
npm run build        # every package and the demo
npm test             # unit tests and the contract test
npm run dev:demo     # the Clanker demo on a local Vite server
```

## Docs

- [Overview](docs/overview.md)
- [@glyf/embed](docs/embed.md)
- [@glyf/react](docs/react.md)
- [@glyf/client](docs/client.md)
- [The Clanker demo](docs/examples.md)
- [Vite and Next.js](docs/vite-next.md)
