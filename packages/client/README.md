# @glyf-data/client

Load a [glyf](https://github.com/glyf-data/glyf) `bundle.json` and resolve its
chart and dashboard artifacts. It refuses a `bundle_version` it does not know.
[`@glyf-data/embed`](https://www.npmjs.com/package/@glyf-data/embed) and
[`@glyf-data/react`](https://www.npmjs.com/package/@glyf-data/react) are built
on it; use it directly when you draw charts yourself.

```bash
npm install @glyf-data/client
```

```ts
import { GlyfClient } from "@glyf-data/client";

const client = await GlyfClient.load({ bundleUrl: "/glyf/bundle.json" });
const spec = await client.fetchArtifactJson("spend_by_model", "vega");
```

- [Documentation](https://github.com/glyf-data/glyf-js/blob/main/docs/client.md)
