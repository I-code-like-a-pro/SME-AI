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
 const allNumbers = Array.from(text.matchAll(/(\d+(?:\.\d{1,2})?)/g));
  if (allNumbers.length > 0) {
    return parseFloat(allNumbers[allNumbers.length - 1][1]);
  }

  return 0;
}

export function parseSaleInput(text: string): ParsedSale {
  const normalized = text.trim();
  const converted = wordsToDigits(normalized);
  // use converted text for parsing so spoken numbers like "five" -> "5"
  const textToParse = converted;
  const amount = extractAmount(textToParse);

  const qtyMatch = textToParse.match(
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

  const soldMatch = textToParse.match(/sold\s+(.+)/i);
  return {
    description: textToParse,
    amount,
    item: soldMatch?.[1],
  };
}

// Convert common English number words into digits for parsing.
function wordsToDigits(input: string): string {
  const SMALL: Record<string, number> = {
    zero: 0,
    one: 1,
    two: 2,
    three: 3,
    four: 4,
    five: 5,
    six: 6,
    seven: 7,
    eight: 8,
    nine: 9,
    ten: 10,
    eleven: 11,
    twelve: 12,
    thirteen: 13,
    fourteen: 14,
    fifteen: 15,
    sixteen: 16,
    seventeen: 17,
    eighteen: 18,
    nineteen: 19,
  };
  const TENS: Record<string, number> = {
    twenty: 20,
    thirty: 30,
    forty: 40,
    fifty: 50,
    sixty: 60,
    seventy: 70,
    eighty: 80,
    ninety: 90,
  };

  const SCALE: Record<string, number> = {
    hundred: 100,
    thousand: 1000,
    million: 1000000,
  };

  const tokens = input.toLowerCase().split(/[^a-z0-9]+/);
  let resultParts: (string | number)[] = [];
  let current = 0;
  let inNumber = false;

  function flushCurrent() {
    if (inNumber) {
      resultParts.push(current);
      current = 0;
      inNumber = false;
    }
  }

  for (let i = 0; i < tokens.length; i++) {
    const t = tokens[i];
    if (!t) continue;
    if (SMALL.hasOwnProperty(t)) {
      current += SMALL[t];
      inNumber = true;
      continue;
    }
    if (TENS.hasOwnProperty(t)) {
      current += TENS[t];
      inNumber = true;
      continue;
    }
    if (t === "and") {
      continue;
    }
    if (SCALE.hasOwnProperty(t)) {
      if (!inNumber) current = 1;
      current = current * SCALE[t];
      inNumber = true;
      continue;
    }
    // not a number word
    flushCurrent();
    resultParts.push(t);
  }
  flushCurrent();

  // Rebuild string: replace numeric parts with digits
  // We need to reconstruct in original order, so iterate tokens again
  const out: string[] = [];
  let rp = 0;
  for (let i = 0; i < tokens.length; i++) {
    const t = tokens[i];
    if (!t) continue;
    const part = resultParts[rp];
    if (typeof part === "number") {
      out.push(String(part));
      rp++;
    } else if (typeof part === "string") {
      out.push(part);
      rp++;
    }
  }

  // Fallback: if reconstruction failed, return original input
  const reconstructed = out.join(" ");
  return reconstructed.trim() || input;
}
