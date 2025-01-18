export function convertToPesos(
  price: string,
  usdToPesoRate: number = 1235
): number {
  if (!price) return 0;
  let numericString = price
    .replace(/[^0-9.,]/g, '')
    .replace(/\./g, '')
    .replace(',', '.');
  let numericValue = parseFloat(numericString);

  if (isNaN(numericValue)) {
    console.warn(`Invalid price detected: ${price}`);
    return 0;
  }

  return price.includes('USD') ? numericValue * usdToPesoRate : numericValue;
}

export function extractAmbientes(title: string): number | undefined {
  const match = /(\d+)\s+ambiente/.exec(title);
  return match ? parseInt(match[1], 10) : undefined;
}

export function extractM2(title: string): number | undefined {
  const match = /(\d+)\s*m²/.exec(title);
  return match ? parseInt(match[1], 10) : undefined;
}
