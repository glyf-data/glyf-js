// Copy the clanker_insights site that glyf built into this app's public folder.
//
//   cd ../glyf/examples/clanker_insights && dbt seed && dbt build && glyf build
//   npm run sync:bundle
//
// GLYF_SITE overrides where the site is read from.
import { cpSync, existsSync, rmSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const here = dirname(fileURLToPath(import.meta.url));
const source = resolve(
  process.env.GLYF_SITE ??
    resolve(here, "../../../../glyf/examples/clanker_insights/target/glyf/site"),
);
const target = resolve(here, "../public/glyf/clanker_insights");

if (!existsSync(resolve(source, "bundle.json"))) {
  console.error(`No glyf site at ${source}. Build the clanker_insights example first, or set GLYF_SITE.`);
  process.exit(1);
}
rmSync(target, { recursive: true, force: true });
cpSync(source, target, { recursive: true });
console.log(`Copied ${source} to ${target}`);
