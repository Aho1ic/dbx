import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const dataGridSource = readFileSync(new URL("../DataGrid.vue", import.meta.url), "utf8");

describe("DataGrid native clipboard regions", () => {
  it("keeps table info in its independent tab instead of a grid drawer", () => {
    expect(dataGridSource).not.toContain("showTableInfo");
    expect(dataGridSource).not.toContain("data-table-info-drawer");
  });

  it("keeps transposed field-name text selection out of grid copy shortcuts", () => {
    expect(dataGridSource).toMatch(/<div\b(?=[^>]*\bdata-native-clipboard)(?=[^>]*class="sticky left-0)[^>]*>/);
  });
});
