// The contract with glyf: bundle.json as glyf's JSON Schema describes it.
//
// contract/bundle.v1.schema.json is a copy of glyf's
// schemas/bundle.v1.schema.json (served at glyfdata.com/schema/). The demo's
// bundle is real glyf output, so if glyf changes the bundle in a way this
// schema does not allow, or this client stops reading it, this fails.
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

import Ajv2020 from "ajv/dist/2020.js";
import { describe, expect, it } from "vitest";

import { SUPPORTED_BUNDLE_VERSIONS } from "../packages/client/src/index.js";

const root = resolve(import.meta.dirname, "..");
const schema = JSON.parse(readFileSync(resolve(root, "contract/bundle.v1.schema.json"), "utf8"));
const bundle = JSON.parse(
  readFileSync(
    resolve(root, "examples/clanker-insights/public/glyf/clanker_insights/bundle.json"),
    "utf8",
  ),
);

describe("bundle contract", () => {
  it("the demo bundle is valid against glyf's schema", () => {
    const validate = new Ajv2020({ allErrors: true, strict: false }).compile(schema);
    expect(validate(bundle), JSON.stringify(validate.errors, null, 2)).toBe(true);
  });

  it("this client reads the version glyf writes", () => {
    expect(SUPPORTED_BUNDLE_VERSIONS).toContain(bundle.bundle_version);
  });

  it("the demo publishes a Vega spec for every drawn chart", () => {
    expect(bundle.security.embedded_specs).toBe(true);
    for (const [name, chart] of Object.entries<Record<string, any>>(bundle.charts)) {
      const drawn = !["table", "kpi"].includes(chart.chart_type);
      expect(Boolean(chart.artifacts.vega), name).toBe(drawn);
    }
  });

  it("every sourced filter has its values", () => {
    for (const dashboard of Object.values<Record<string, any>>(bundle.dashboards)) {
      for (const filter of dashboard.filters) expect(filter.values.length, filter.field).toBeGreaterThan(0);
    }
  });
});
