# @glyf/embed

The framework-free core. It mounts glyf charts into elements you give it and
keeps them in step with one set of filters and one theme.

```ts
import "@glyf/embed/style.css";
import { createGlyf } from "@glyf/embed";

const glyf = await createGlyf({
  bundleUrl: "/glyf/clanker_insights/bundle.json",
  theme: "light",
  palette: ["#3B6E9C", "#D99A1E", "#4F8A5B"],
  font: "Archivo",
});

const chart = glyf.mount(document.querySelector("#spend")!, "spend_by_model", { height: 280 });
glyf.mountFilters(document.querySelector("#filters")!, "insights");
```

## What each chart becomes

| Chart | Drawn as | Filters |
| --- | --- | --- |
| line, bar, area, scatter, pie, histogram, boxplot, heatmap | Vega, from `charts/<name>.vega.json`, with tooltips and the chart's own interactions | Applied to the rows in the spec |
| the same, without a published spec | The SVG glyf rendered | Cannot apply: dimmed, "Not filtered" |
| table | glyf's `<table>` fragment | Rows that do not match are hidden |
| kpi | glyf's tile fragment | Cannot apply: one aggregated number |

Specs are published only when the glyf project sets `export.embed: true`.
They carry the rows the chart was drawn from; set `export.row_data: minimal`
to publish only the columns each chart encodes.

A filter applies to every mounted chart whose rows carry its field. A chart
none of the active filters can reach is dimmed and says "Not filtered", and one
the filters empty says "No data", so a chart never looks filtered when it is
not. `chart.state` and the element's `data-glyf-state` attribute say which.

## API

`createGlyf(options)` loads the bundle and returns a `Glyf`.

| Option | Meaning |
| --- | --- |
| `bundleUrl` | Where `bundle.json` is. Artifacts resolve against it. |
| `theme` | `"light"` (default) or `"dark"`. Axis, legend and title colours. The background is left to your page. |
| `palette` | Series colours, in order. |
| `font` | Font for chart labels. |
| `headers`, `credentials`, `fetcher` | Passed to every fetch, for a bundle behind auth. |

`Glyf`:

| Member | Does |
| --- | --- |
| `mount(element, name, { height, showTitle, palette })` | Draws a chart; returns a handle with `state`, `refresh()` and `destroy()`. The chart's title is left out unless `showTitle`, since your card has one. |
| `mountFilters(element, dashboard)` | Draws a dashboard's filters as its YAML sets them: `select`, `radio` or `toggle`. |
| `setFilter(field, values)` | Keeps rows whose `field` is one of `values`; `[]` clears it. |
| `clearFilters()`, `activeFilters` | |
| `setTheme(theme)` | Redraws every chart. |
| `subscribe(listener)` | Called when filters or the theme change. |

## Styling

`@glyf/embed/style.css` styles the tiles, tables, filters and marks from CSS
variables. Set them on any ancestor to restyle:

```css
.insights {
  --glyf-text: #1b2220;
  --glyf-muted: #66716c;
  --glyf-border: #cfd5d0;
  --glyf-surface: #e9ece8;
  --glyf-accent: #1b2220;
  --glyf-accent-soft: #f2c230;
  --glyf-up: #2f7a45;
  --glyf-down: #c4432b;
}
```

## Fragments

Table and KPI fragments are inserted as HTML. They are glyf's build output,
escaped when glyf wrote them; load bundles only from a build you trust, as you
would any script.
