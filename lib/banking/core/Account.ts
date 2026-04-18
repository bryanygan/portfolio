import { AccountType } from '../types';
import { roundCents } from '../utils/NumericParsing';

export abstract class Account {
  protected accountID: string;
  protected balance: number;
  protected APR: number;
  protected type: AccountType;

  protected constructor(accountID: string, APR: number, type: AccountType) {
    this.accountID = accountID;
    this.balance = 0;
    this.APR = APR;
    this.type = type;
  }

  getAccountID(): string {
    return this.accountID;
  }

  getBalance(): number {
    return this.balance;
  }

  setBalance(newBalance: number): void {
    // Clamp at zero (fees can't push a balance negative) and always snap to
    // whole cents to avoid accumulating IEEE-754 drift.
    this.balance = Math.max(0, roundCents(newBalance));
  }

  getAPR(): number {
    return this.APR;
  }

  getType(): AccountType {
    return this.type;
  }

  deposit(amount: number): boolean {
    if (amount > 0) {
      this.setBalance(this.balance + amount);
      return true;
    }
    return false;
  }

  withdraw(amount: number): number {
    if (amount <= 0) {
      throw new Error('Amount must be positive');
    }

    // Partial fulfillment is intentional: fees can legitimately drain below
    // the requested amount. Command handlers validate sufficient funds up
    // front so they never hit this path.
    const withdrawn = Math.min(amount, this.balance);
    this.setBalance(this.balance - withdrawn);
    return roundCents(withdrawn);
  }

  isZeroBalance(): boolean {
    return this.balance === 0;
  }

  deductMinimumBalanceFee(): void {
    if (this.balance < 100) {
      this.setBalance(this.balance - 25);
    }
  }

  accrueMonthlyApr(): void {
    if (this.balance > 0) {
      const monthlyRate = (this.APR / 100) / 12;
      this.setBalance(this.balance + this.balance * monthlyRate);
    }
  }

  toString(): string {
    return `${this.type} ${this.accountID} ${this.balance.toFixed(2)} ${this.APR.toFixed(2)}`;
  }
}
