# @glyf-data/react

React components for [glyf](https://github.com/glyf-data/glyf) charts, KPI
tiles, tables and filters, built on
[`@glyf-data/embed`](https://www.npmjs.com/package/@glyf-data/embed).

```bash
npm install @glyf-data/react
```

```tsx
import "@glyf-data/embed/style.css";
import { GlyfChart, GlyfFilters, GlyfProvider } from "@glyf-data/react";

export function Insights() {
  return (
    <GlyfProvider bundleUrl="/glyf/bundle.json" theme="dark">
      <GlyfFilters dashboard="insights" />
      <GlyfChart name="spend_by_model" />
    </GlyfProvider>
  );
}
```

- [Documentation](https://github.com/glyf-data/glyf-js/blob/main/docs/react.md)
- [Live demo](https://clanker.glyfdata.com), and [its source](https://github.com/glyf-data/glyf-js/tree/main/examples/clanker-insights)
