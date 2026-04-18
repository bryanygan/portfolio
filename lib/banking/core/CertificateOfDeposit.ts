import { Account } from './Account';
import { AccountType } from '../types';

export class CertificateOfDeposit extends Account {
  private monthsSinceCreation: number = 0;

  constructor(accountID: string, APR: number, initialBalance: number) {
    super(accountID, APR, AccountType.Cd);
    this.setBalance(initialBalance);
  }

  incrementMonths(): void {
    this.monthsSinceCreation++;
  }

  getMonthsSinceCreation(): number {
    return this.monthsSinceCreation;
  }

  setMonthsSinceCreation(months: number): void {
    this.monthsSinceCreation = months;
  }

  canWithdraw(): boolean {
    return this.monthsSinceCreation >= 12;
  }

  // CD accounts compound the monthly rate four times (quarterly within the
  // month). Snap to whole cents after each step to avoid float drift.
  accrueMonthlyApr(): void {
    if (this.balance > 0) {
      const monthlyRate = (this.APR / 100) / 12;
      for (let i = 0; i < 4; i++) {
        this.setBalance(this.balance + this.balance * (monthlyRate / 4));
      }
    }
  }
}
