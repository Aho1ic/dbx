import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const dataGridSource = readFileSync(new URL("../DataGrid.vue", import.meta.url), "utf8");
const tableInfoSource = readFileSync(new URL("../TableInfoView.vue", import.meta.url), "utf8");

describe("independent table-info DDL search", () => {
  it("keeps DDL filtering in the table-info view instead of the data grid", () => {
    expect(dataGridSource).not.toMatch(/filteredDdlContent|showDdl|ddlContent/);
    expect(tableInfoSource).toMatch(/const filteredDdlContent = computed/);
    expect(tableInfoSource).toMatch(/searchQuery\.value/);
  });
});
