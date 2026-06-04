# Glyf JS

Experimental JavaScript packages for consuming Glyf artifact bundles.

The Python/Rust `glyf` CLI remains the artifact producer:

```bash
dbt build
glyf build
```

That produces a public artifact site:

```text
target/glyf/site/
  bundle.json
  charts/
  dashboards/
  compiled/
  assets/
```

This workspace consumes that bundle:

```tsx
import { GlyfProvider, GlyfChart } from "@glyf/react";

export function Analytics() {
  return (
    <GlyfProvider bundleUrl="/glyf/product_analytics/bundle.json">
      <GlyfChart name="activation_by_plan" />
    </GlyfProvider>
  );
}
```

## Packages

- `@glyf/client`: loads `bundle.json`, resolves chart/dashboard artifact URLs, and fetches chart metadata.
- `@glyf/react`: React provider and components built on top of `@glyf/client`.
- `@glyf/example-startup-saas`: demo app that loads a copied product analytics bundle from `public/glyf/product_analytics`.

## Local Demo

```bash
npm install
npm run dev:demo
```

The demo loads:

```text
examples/startup-saas/public/glyf/product_analytics/bundle.json
```

This is the same shape a real app would load from Cloudflare Pages, R2, S3,
CloudFront, or an internal static file service.

## Documentation Boundary

Keep artifact generation docs in the main Glyf documentation:

- how `glyf build` and `glyf export` produce `bundle.json`
- how to publish `target/glyf/site` to S3, R2, Cloudflare Pages, or an app public folder
- a short embedded analytics quickstart using `@glyf/react`

Keep JavaScript package docs in this repository:

- `@glyf/client` API
- `@glyf/react` components and hooks
- example React applications
- framework-specific notes for Vite, Next.js, Remix, and similar app stacks

## License

MIT
