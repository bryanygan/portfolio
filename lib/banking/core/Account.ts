import { AccountType } from '../types';

export abstract class Account {
  protected accountID: string;
  protected balance: number;
  protected APR: number;
  protected type: AccountType;

  protected constructor(accountID: string, APR: number) {
    this.accountID = accountID;
    this.balance = 0;
    this.APR = APR;
    this.type = AccountType.Checking; // Will be overridden by subclasses
  }

  getAccountID(): string {
    return this.accountID;
  }

  getBalance(): number {
    return this.balance;
  }

  setBalance(newBalance: number): void {
    this.balance = Math.max(0, newBalance);
  }

  getAPR(): number {
    return this.APR;
  }

  getType(): AccountType {
    return this.type;
  }

  deposit(amount: number): boolean {
    if (amount > 0) {
      this.balance += amount;
      return true;
    }
    return false;
  }

  withdraw(amount: number): number {
    if (amount <= 0) {
      throw new Error('Negative amount not allowed');
    }

    const withdrawn = Math.min(amount, this.balance);
    this.setBalance(this.balance - withdrawn);
    return withdrawn;
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
      const newBalance = this.balance + (this.balance * monthlyRate);
      this.setBalance(newBalance);
    }
  }

  toString(): string {
    return `${this.type} ${this.accountID} ${this.balance.toFixed(2)} ${this.APR.toFixed(2)}`;
  }
}
