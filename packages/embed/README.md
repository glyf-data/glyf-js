# @glyf-data/embed

Draw [glyf](https://github.com/glyf-data/glyf) charts live in any web page,
with no framework: interactive charts, KPI tiles, tables and filter controls,
from the `bundle.json` a glyf build writes.

```bash
npm install @glyf-data/embed
```

```ts
import "@glyf-data/embed/style.css";
import { createGlyf } from "@glyf-data/embed";

const glyf = await createGlyf({ bundleUrl: "/glyf/bundle.json", theme: "dark" });
glyf.mountFilters(document.querySelector("#filters")!, "insights");
glyf.mount(document.querySelector("#spend")!, "spend_by_model");
```

Charts are drawn from the Vega specs glyf publishes when the project sets
`export.embed: true` in `glyf.yml`.

- [Documentation](https://github.com/glyf-data/glyf-js/blob/main/docs/embed.md)
- [Live demo](https://clanker.glyfdata.com)
- React: [`@glyf-data/react`](https://www.npmjs.com/package/@glyf-data/react)
