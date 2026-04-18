import { hasAtMostTwoDecimals } from '../utils/NumericParsing';

export class CdAccountValidation {
  static validateCdBalance(balance: number): boolean {
    return Number.isFinite(balance) && balance >= 1000 && balance <= 10000;
  }

  /**
   * APR must be between 0 and 10 inclusive, with at most two decimal places.
   * The decimal-places rule is checked against the raw string to avoid false
   * negatives caused by binary floating-point representation of values like
   * "2.3" (where `2.3 * 100 === 229.99999999999997`).
   */
  static validateApr(apr: number, aprStr: string): boolean {
    if (!Number.isFinite(apr) || apr < 0 || apr > 10) return false;
    return hasAtMostTwoDecimals(aprStr);
  }
}
