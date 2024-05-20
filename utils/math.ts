// Convert decimal to fraction
export function decimalToFraction(decimal: number): { errMsg?: string; numerator: string; denominator: string } {
  // Check if the absolute value of the decimal is greater than 0
  if (Math.abs(decimal) <= 0)
    return { errMsg: "Decimal value must be greater than 0", numerator: "0", denominator: "0" };

  // Initialize numerator and denominator to 1
  let numerator: number = 1;
  let denominator: number = 1;

  // Convert the decimal to a string for processing
  const strDecimal: string = decimal.toFixed(8); // Set the number of decimal places to handle

  // Split the decimal string into integer and decimal parts
  const [integerPart, decimalPart] = strDecimal.split(".");

  // If the decimal part exists, the denominator is 10 raised to the power of the length of the decimal part,
  // and the numerator is the integer composed of the integer and decimal parts
  if (decimalPart) {
    denominator = Math.pow(10, decimalPart.length);
    numerator = parseInt(integerPart + decimalPart);
  } else {
    // If the decimal part does not exist, the denominator is 1, and the numerator is the integer part
    numerator = parseInt(integerPart);
  }

  // Use the greatest common divisor to simplify the numerator and denominator
  const gcd = (a: number, b: number): number => (b === 0 ? a : gcd(b, a % b));
  const divisor = gcd(numerator, denominator);

  // Convert the numerator and denominator to strings and return
  return {
    numerator: (numerator / divisor).toString(),
    denominator: (denominator / divisor).toString(),
  };
}

// Calculate swap price
export function calculateSwapPrice({
  assetAmount,
  exchangeRateNumerator,
  exchangeRateDenominator,
}: {
  assetAmount: string;
  exchangeRateNumerator: string;
  exchangeRateDenominator: string;
}) {
  const price = (BigInt(assetAmount) * BigInt(exchangeRateNumerator)) / BigInt(exchangeRateDenominator);
  return price.toString();
}

// BigInt calculation
export function bigIntAdd(a: string | number, b: string | number): string {
  const numA = BigInt(a);
  const numB = BigInt(b);
  const sum = numA + numB;
  return sum.toString();
}
export function bigIntSubtract(a: string | number, b: string | number): string {
  const numA = BigInt(a);
  const numB = BigInt(b);
  const diff = numA - numB;
  return diff.toString();
}
export function bigIntMultiply(a: string | number, b: string | number): string {
  const numA = BigInt(a);
  const numB = BigInt(b);
  const product = numA * numB;
  return product.toString();
}
export function bigIntDivide(a: string | number, b: string | number): string {
  const numA = BigInt(a);
  const numB = BigInt(b);
  const product = numA / numB;
  return product.toString();
}
