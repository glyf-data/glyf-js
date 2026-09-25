# @glyf-data/react

React components over [`@glyf-data/embed`](embed.md). The core draws, filters and
themes; these components mount it and follow their props.

```tsx
import "@glyf-data/embed/style.css";
import { GlyfChart, GlyfFilters, GlyfProvider, useGlyfFilters } from "@glyf-data/react";

export function Insights({ theme }: { theme: "light" | "dark" }) {
  return (
    <GlyfProvider
      bundleUrl="/glyf/clanker_insights/bundle.json"
      theme={theme}
      palette={["#3B6E9C", "#D99A1E", "#4F8A5B"]}
      loading={<p>Loading charts.</p>}
      error={(error) => <p>Charts could not be loaded: {error.message}</p>}
    >
      <GlyfFilters dashboard="insights" />
      <GlyfChart name="spend_by_model" height={280} />
      <GlyfChart name="recent_failures" />
    </GlyfProvider>
  );
}
```

## `GlyfProvider`

Loads the bundle once and shares one `Glyf` instance, with its filters and
theme, with everything inside it. Takes every [`createGlyf`
option](embed.md#api) plus `loading` and `error`. Changing `theme` redraws
the charts; changing `bundleUrl` loads a new bundle.

## `GlyfChart`

| Prop | Meaning |
| --- | --- |
| `name` | The chart, by its `.ggsql` file name. |
| `height` | Pixels; the chart's own otherwise. The width follows the container. |
| `showTitle` | Keep the chart's own title in the drawing. |
| `palette` | Colours for this chart only, such as green, amber and red for outcomes. |
| `className`, `style` | On the wrapping element. |
| `onState` | Called with `ready`, `unfiltered`, `empty` or `error`. |

## `GlyfFilters`

Draws a dashboard's filters (`dashboard="insights"`) as the dashboard YAML sets
them: a select, radio buttons or toggles.

## Hooks

- `useGlyfFilters()`: the active filters, re-rendering when they change.
- `useGlyf()`: the `Glyf` instance, for `setFilter`, `clearFilters`, `setTheme`.
- `useGlyfChart(name)`: the chart's bundle entry, for its title and type.
- `useGlyfClient()`: the underlying `GlyfClient`.
