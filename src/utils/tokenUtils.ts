const DECIMALS = 18;

export function formatTokenAmount(amount: bigint): string {
  const stringAmount = amount.toString().padStart(DECIMALS + 1, '0');
  const integerPart = stringAmount.slice(0, -DECIMALS) || '0';
  const fractionalPart = stringAmount.slice(-DECIMALS).replace(/0+$/, '');
  return `${integerPart}${fractionalPart ? '.' + fractionalPart : ''}`;
}

export function parseTokenAmount(amount: string): bigint | null {
  try {
    // Replace comma with dot if present
    const normalizedAmount = amount.replace(',', '.');
    const [integerPart, fractionalPart = ''] = normalizedAmount.split('.');
    const paddedFractionalPart = fractionalPart.padEnd(DECIMALS, '0');
    return BigInt(integerPart + paddedFractionalPart);
  } catch {
    return null;
  }
}