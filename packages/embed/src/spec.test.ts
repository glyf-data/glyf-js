import { describe, expect, it } from "vitest";

import { applicableFilters, filterExpression, hasRows, prepareSpec } from "./spec.js";

const spec = {
  $schema: "https://vega.github.io/schema/vega-lite/v6.4.1.json",
  title: { text: "Spend by model" },
  width: 800,
  height: 400,
  config: { axis: { labelFontSize: 11 } },
  data: { name: "rows" },
  datasets: {
    rows: [
      { week: "W37", model: "clank-mini", agent: "Support Triage", spend: 10 },
      { week: "W37", model: "clank-pro", agent: "Code Reviewer", spend: 30 },
      { week: "W38", model: "clank-ultra", agent: "Code Reviewer", spend: 90 },
    ],
  },
  mark: "area",
};

describe("prepareSpec", () => {
  it("fits the container, drops the title and keeps the chart's own config", () => {
    const prepared = prepareSpec(spec, { theme: "dark", filters: [] });

    expect(prepared.width).toBe("container");
    expect(prepared.title).toBeUndefined();
    expect(prepared.background).toBeNull();
    const axis = (prepared.config as Record<string, Record<string, unknown>>).axis;
    expect(axis.labelFontSize).toBe(11);
    expect(axis.labelColor).toBe("#e4e4e7");
    expect(spec.width).toBe(800);
  });

  it("applies the host's palette, font and height", () => {
    const prepared = prepareSpec(spec, {
      theme: "light",
      filters: [],
      palette: ["#111", "#222"],
      font: "Inter",
      height: 240,
      showTitle: true,
    });

    const config = prepared.config as Record<string, Record<string, unknown>>;
    expect(config.range.category).toEqual(["#111", "#222"]);
    expect(config.axis.labelFont).toBe("Inter");
    expect(prepared.height).toBe(240);
    expect(prepared.title).toEqual({ text: "Spend by model" });
  });

  it("filters only on fields the rows carry", () => {
    const prepared = prepareSpec(spec, {
      theme: "light",
      filters: [
        { field: "model", values: ["clank-pro", "clank-ultra"] },
        { field: "region", values: ["EU"] },
      ],
    });

    expect(prepared.transform).toEqual([
      {
        filter:
          '(toString(datum["model"]) == "clank-pro" || toString(datum["model"]) == "clank-ultra")',
      },
    ]);
  });
});

describe("filters", () => {
  it("joins fields with AND and values with OR", () => {
    expect(
      filterExpression([
        { field: "agent", values: ["Code Reviewer"] },
        { field: "model", values: ["clank-pro", "clank-ultra"] },
      ]),
    ).toBe(
      '(toString(datum["agent"]) == "Code Reviewer") && ' +
        '(toString(datum["model"]) == "clank-pro" || toString(datum["model"]) == "clank-ultra")',
    );
  });

  it("ignores a filter with no values and one the rows cannot see", () => {
    expect(
      applicableFilters(spec, [
        { field: "model", values: [] },
        { field: "region", values: ["EU"] },
      ]),
    ).toEqual([]);
  });

  it("says whether any row survives", () => {
    expect(hasRows(spec, [{ field: "agent", values: ["Code Reviewer"] }])).toBe(true);
    expect(
      hasRows(spec, [
        { field: "agent", values: ["Support Triage"] },
        { field: "model", values: ["clank-ultra"] },
      ]),
    ).toBe(false);
  });
});
