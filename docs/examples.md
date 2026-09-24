# The Clanker demo

`examples/clanker-insights` is a customer-facing analytics page for Clanker, a
made-up platform where companies run AI agents. It shows one customer
workspace, Glyf Data, what its five agents did over six weeks: runs,
success, run time, spend by model and agent, and failures. Every chart comes
from glyf.

The charts are defined in the glyf repository, in
`examples/clanker_insights`: synthetic seeds, dbt models, 13 `.ggsql` charts
and the dashboard whose filters the page reuses.

## Run it

```bash
npm install
npm run dev:demo
```

## Rebuild the charts

```bash
cd ../glyf/examples/clanker_insights
uv run dbt seed --profiles-dir . && uv run dbt build --profiles-dir .
uv run glyf build
cd ../../../glyf-js/examples/clanker-insights
npm run sync:bundle      # copies target/glyf/site into public/glyf/clanker_insights
```

The page does not change as long as the chart names stay the same.

## Live

[clanker.glyfdata.com](https://clanker.glyfdata.com)

## Deploy

```bash
npm run deploy:demo      # builds, then deploys the Worker glyf-clanker-demo to clanker.glyfdata.com
```

Each company demo is its own Worker on its own `glyfdata.com` subdomain: copy
`wrangler.jsonc`, change `name` and the `routes` pattern, and deploy. Cloudflare
creates the DNS record and certificate. Keep to one level under
`glyfdata.com`; the free certificate does not cover `a.b.glyfdata.com`.
