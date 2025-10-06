export class CdAccountValidation {
  static validateCdBalance(balance: number): boolean {
    return balance >= 1000 && balance <= 10000;
  }

  static validateApr(apr: number): boolean {
    // APR must be between 0 and 10, with at most 2 decimal places
    return apr >= 0 && apr <= 10 && Math.floor(apr * 100) === apr * 100;
  }
}
