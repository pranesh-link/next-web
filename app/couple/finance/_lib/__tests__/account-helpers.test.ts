import { typeIcon, typeLabel } from "../account-helpers";

describe("typeIcon", () => {
  it.each([
    ["SAVINGS_ACCOUNT", "🏦"],
    ["CREDIT_ACCOUNT", "🏧"],
    ["CREDIT_CARD", "💳"],
    ["RECURRING_DEPOSIT", "🔄"],
    ["FIXED_DEPOSIT", "🔒"],
  ])("should map %s to %s", (type, icon) => {
    expect(typeIcon(type)).toBe(icon);
  });

  it("should fall back to 💰 for unknown types", () => {
    expect(typeIcon("MUTUAL_FUND")).toBe("💰");
  });

  it("should fall back to 💰 for empty string", () => {
    expect(typeIcon("")).toBe("💰");
  });
});

describe("typeLabel", () => {
  it.each([
    ["SAVINGS_ACCOUNT", "Savings Account"],
    ["CREDIT_ACCOUNT", "Credit Account"],
    ["CREDIT_CARD", "Credit Card"],
    ["RECURRING_DEPOSIT", "Recurring Deposit"],
    ["FIXED_DEPOSIT", "Fixed Deposit"],
  ])("should map %s to %s", (type, label) => {
    expect(typeLabel(type)).toBe(label);
  });

  it("should return the raw type as fallback for unknown values", () => {
    expect(typeLabel("CRYPTO_WALLET")).toBe("CRYPTO_WALLET");
  });

  it("should return empty string for empty input", () => {
    expect(typeLabel("")).toBe("");
  });
});
