import { Account } from './Account';
import { AccountType } from '../types';

export class CertificateOfDeposit extends Account {
  private monthsSinceCreation: number = 0;

  constructor(accountID: string, APR: number, initialBalance: number) {
    super(accountID, APR);
    this.type = AccountType.Cd;
    this.balance = initialBalance;
  }

  incrementMonths(): void {
    this.monthsSinceCreation++;
  }

  getMonthsSinceCreation(): number {
    return this.monthsSinceCreation;
  }

  canWithdraw(): boolean {
    return this.monthsSinceCreation >= 12;
  }

  // Override to apply APR 4 times per month for CD accounts
  accrueMonthlyApr(): void {
    if (this.balance > 0) {
      const monthlyRate = (this.APR / 100) / 12;
      // Apply APR 4 times for CD accounts (compounded quarterly within the month)
      for (let i = 0; i < 4; i++) {
        this.balance = this.balance + (this.balance * (monthlyRate / 4));
      }
    }
  }
}
