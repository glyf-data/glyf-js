# Examples

The first example app is:

```text
examples/startup-saas
```

It demonstrates a startup SaaS dashboard UI that consumes a copied Glyf product
analytics bundle from:

```text
examples/startup-saas/public/glyf/product_analytics/bundle.json
```

## Run the Demo

```bash
npm install
npm run dev:demo
```

Open the Vite URL printed in the terminal.

## Build the Demo

```bash
npm run build:demo
```

The built app includes the copied Glyf public artifacts under:

```text
examples/startup-saas/dist/glyf/product_analytics/
```

## Replace the Sample Bundle

From the main Glyf repository, build an example:

```bash
cd ../glyf
uv run glyf build --project-dir examples/product_analytics
```

Then replace the demo public bundle:

```bash
cd ../glyf-js
cp -R ../glyf/examples/product_analytics/target/glyf/site/. \
  examples/startup-saas/public/glyf/product_analytics/
```

The React app does not need to change as long as the chart names remain the
same.
