export function formatCurrency(amount: number, currency: string = 'NT$'): string {
  const rounded = Math.round(amount * 100) / 100;
  return `${currency} ${rounded.toLocaleString()}`;
}

export function formatNumber(amount: number): string {
  const rounded = Math.round(amount * 100) / 100;
  return rounded.toLocaleString();
}
