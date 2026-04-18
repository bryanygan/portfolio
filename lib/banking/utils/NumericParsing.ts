/**
 * Strict numeric parsing helpers used by banking validators.
 *
 * `parseFloat` quietly accepts inputs that should be rejected from a command
 * line (e.g. "1e3", "+100", "100abc", "Infinity"). These helpers require a
 * canonical decimal string and reject anything that isn't a finite number.
 */

const MONEY_PATTERN = /^\d+(\.\d+)?$/;
const MONEY_AT_MOST_2DP = /^\d+(\.\d{1,2})?$/;

export function parseMoney(input: string): number | null {
  if (typeof input !== 'string' || !MONEY_PATTERN.test(input)) {
    return null;
  }
  const value = Number(input);
  return Number.isFinite(value) ? value : null;
}

export function parseApr(input: string): number | null {
  if (typeof input !== 'string' || !MONEY_AT_MOST_2DP.test(input)) {
    return null;
  }
  const value = Number(input);
  return Number.isFinite(value) ? value : null;
}

export function hasAtMostTwoDecimals(input: string): boolean {
  return typeof input === 'string' && MONEY_AT_MOST_2DP.test(input);
}

/**
 * Round a dollar amount to the nearest cent. Used to keep balances free of
 * IEEE-754 drift across deposits, withdrawals, fees, and APR accrual.
 */
export function roundCents(value: number): number {
  return Math.round(value * 100) / 100;
}
