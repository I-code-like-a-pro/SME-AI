import { describe, it, expect } from "vitest";
import { parseSaleInput } from "./parse-sale";

/**
 * Tests for the natural-language sale parser.
 *
 * Notes on approach (this is the pattern to copy for other modules):
 * - We only test the PUBLIC API (`parseSaleInput`). `extractAmount` and
 *   `wordsToDigits` are private implementation details — testing through the
 *   public surface means we can refactor the internals freely without rewriting
 *   tests, as long as behaviour stays the same.
 * - Each test follows Arrange / Act / Assert.
 * - The "current behaviour" block at the bottom is a *characterization* suite:
 *   it pins down quirks that exist today so a future refactor can't change them
 *   by accident. When you fix a quirk, you update its test on purpose.
 */
describe("parseSaleInput", () => {
  describe("quantity + unit sales", () => {
    it("parses quantity, item, and amount from a full sentence", () => {
      const result = parseSaleInput("sold 10 bags of rice for 50");
      expect(result).toEqual({
        description: "sold 10 bags of rice for 50",
        amount: 50,
        quantity: 10,
        item: "rice",
      });
    });

    it("keeps the original wording in `description` even when numbers were spoken", () => {
      const result = parseSaleInput("sold ten bags of rice for fifty");
      // Spoken numbers are converted for parsing (amount/quantity become digits)
      // but the human-readable description preserves what the trader actually said.
      expect(result).toEqual({
        description: "sold ten bags of rice for fifty",
        amount: 50,
        quantity: 10,
        item: "rice",
      });
    });

    it("handles other units (bottles) and the 'of' connector", () => {
      const result = parseSaleInput("2 bottles of oil for 1500");
      expect(result).toEqual({
        description: "2 bottles of oil for 1500",
        amount: 1500,
        quantity: 2,
        item: "oil",
      });
    });
  });

  describe("amount detection", () => {
    it("reads the price after 'for'", () => {
      expect(parseSaleInput("bread for 200").amount).toBe(200);
    });

    it("reads the price after 'at'", () => {
      expect(parseSaleInput("milk at 20").amount).toBe(20);
    });

    it("supports decimal amounts", () => {
      expect(parseSaleInput("milk for 3.50").amount).toBe(3.5);
    });

    it("falls back to the last number when there is no price cue", () => {
      expect(parseSaleInput("gave 3 loaves 250").amount).toBe(250);
    });

    it("converts spoken numbers into the amount", () => {
      expect(parseSaleInput("garri for one hundred").amount).toBe(100);
      expect(parseSaleInput("rice for two thousand").amount).toBe(2000);
    });
  });

  describe("no-unit sales", () => {
    it("captures the item after 'sold' when no unit is present", () => {
      const result = parseSaleInput("sold some rice");
      expect(result.amount).toBe(0);
      expect(result.item).toBe("some rice");
      expect(result.quantity).toBeUndefined();
    });

    it("does not set quantity when the word is not a known unit", () => {
      // "loaves" is not in the unit list, so no quantity is extracted.
      expect(parseSaleInput("gave 3 loaves 250").quantity).toBeUndefined();
    });
  });

  describe("empty / malformed input", () => {
    it("returns amount 0 for an empty string", () => {
      const result = parseSaleInput("");
      expect(result.amount).toBe(0);
      expect(result.description).toBe("");
    });

    it("returns amount 0 for whitespace only", () => {
      expect(parseSaleInput("   ").amount).toBe(0);
    });

    it("returns amount 0 when there is no number at all", () => {
      const result = parseSaleInput("hello");
      expect(result.amount).toBe(0);
      expect(result.quantity).toBeUndefined();
    });
  });

  describe("current behaviour (characterization — documents quirks to fix later)", () => {
    it("still resolves the amount even though a leading '$' is stripped", () => {
      // The '$' is removed during normalization, but the numeric fallback
      // still recovers the amount. If you later add real currency handling,
      // change this test on purpose.
      expect(parseSaleInput("$50").amount).toBe(50);
    });
  });
});
