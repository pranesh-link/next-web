import { formatCurrency, formatMonthLabel, formatDate } from "../formatters";

describe("formatCurrency", () => {
  it("should format a positive whole number as INR with two fraction digits", () => {
    expect(formatCurrency(1234)).toMatch(/₹\s?1,234\.00/);
  });

  it("should format zero as ₹0.00", () => {
    expect(formatCurrency(0)).toMatch(/₹\s?0\.00/);
  });

  it("should format negative numbers with a leading minus sign", () => {
    const result = formatCurrency(-500);
    expect(result).toMatch(/-/);
    expect(result).toMatch(/500/);
  });

  it("should use the Indian grouping for very large numbers", () => {
    // en-IN groups as lakhs/crores: 1,23,45,678
    const result = formatCurrency(12345678);
    expect(result).toMatch(/1,23,45,678/);
  });

  it("should respect maximumFractionDigits and round to two decimals", () => {
    const result = formatCurrency(99.999);
    expect(result).toMatch(/100\.00/);
  });
});

describe("formatMonthLabel", () => {
  it("should format YYYY-MM as 'Month YYYY'", () => {
    expect(formatMonthLabel("2026-01")).toBe("January 2026");
  });

  it("should handle December correctly (month index)", () => {
    expect(formatMonthLabel("2025-12")).toBe("December 2025");
  });
});

describe("formatDate", () => {
  it("should format a Date instance as 'DD Mon YYYY'", () => {
    // en-IN typically renders "15 Mar 2026"
    const result = formatDate(new Date(2026, 2, 15));
    expect(result).toMatch(/15\s+Mar\s+2026/);
  });

  it("should accept an ISO date string", () => {
    const result = formatDate("2026-03-15T00:00:00.000Z");
    expect(result).toMatch(/Mar/);
    expect(result).toMatch(/2026/);
  });

  it("should return 'Invalid Date' for an unparseable string", () => {
    expect(formatDate("not-a-date")).toMatch(/Invalid Date/i);
  });
});
