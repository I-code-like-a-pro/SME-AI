export interface ParsedSale {
  description: string;
  amount: number;
  quantity?: number;
  item?: string;
}

function extractAmount(text: string): number {
  // Prefer price after "for" or "at": "for $50", "for 50", "at 50"
  const priceMatch = text.match(/(?:for|at)\s+\$?\s*(\d+(?:\.\d{1,2})?)/i);
  if (priceMatch) return parseFloat(priceMatch[1]);

  // Prefer explicit currency: "$50"
  const currencyMatch = text.match(/\$\s*(\d+(?:\.\d{1,2})?)/);
  if (currencyMatch) return parseFloat(currencyMatch[1]);

  // Fall back to last number in the string (often the total)
  const allNumbers = [...text.matchAll(/(\d+(?:\.\d{1,2})?)/g)];
  if (allNumbers.length > 0) {
    return parseFloat(allNumbers[allNumbers.length - 1][1]);
  }

  return 0;
}

export function parseSaleInput(text: string): ParsedSale {
  const normalized = text.trim();
  const amount = extractAmount(normalized);

  const qtyMatch = normalized.match(
    /(\d+)\s+(?:bags?|units?|items?|pieces?|kg|liters?|bottles?)\s+(?:of\s+)?(.+?)(?:\s+for|\s+at|$)/i
  );
  if (qtyMatch) {
    return {
      description: normalized,
      amount,
      quantity: parseInt(qtyMatch[1], 10),
      item: qtyMatch[2].trim(),
    };
  }

  const soldMatch = normalized.match(/sold\s+(.+)/i);
  return {
    description: normalized,
    amount,
    item: soldMatch?.[1],
  };
}
