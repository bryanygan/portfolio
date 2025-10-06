import { Account } from './Account';
import { CertificateOfDeposit } from './CertificateOfDeposit';
import { TransactionLogger } from '../utils/TransactionLogger';

export class Bank {
  private accounts: Map<string, Account> = new Map();
  private transactionLogger: TransactionLogger;

  constructor() {
    this.transactionLogger = new TransactionLogger();
  }

  addAccount(account: Account): void {
    if (this.accounts.has(account.getAccountID())) {
      throw new Error(`Account with ID ${account.getAccountID()} already exists`);
    }
    this.accounts.set(account.getAccountID(), account);
  }

  getAccount(accountID: string): Account | undefined {
    return this.accounts.get(accountID);
  }

  getAllAccounts(): Map<string, Account> {
    return this.accounts;
  }

  depositByID(accountID: string, amount: number): void {
    const account = this.getAccount(accountID);
    if (account) {
      account.deposit(amount);
    }
  }

  withdrawByID(accountID: string, amount: number): void {
    const account = this.getAccount(accountID);
    if (account) {
      account.withdraw(amount);
    }
  }

  removeAccount(accountID: string): void {
    this.accounts.delete(accountID);
    this.transactionLogger.removeTransactionsForAccount(accountID);
  }

  processPassTime(months: number): void {
    for (let i = 0; i < months; i++) {
      // Remove zero balance accounts at the start of the month
      const toRemove: string[] = [];
      this.accounts.forEach((account, id) => {
        if (account.isZeroBalance()) {
          toRemove.push(id);
        }
      });
      toRemove.forEach(id => this.accounts.delete(id));

      // Apply fees and APR to remaining accounts
      this.accounts.forEach(account => {
        account.deductMinimumBalanceFee();
        account.accrueMonthlyApr();

        // Increment month counter for CD accounts
        if (account instanceof CertificateOfDeposit) {
          account.incrementMonths();
        }
      });
    }

    // Remove any accounts that became zero balance after the last month's processing
    const toRemove: string[] = [];
    this.accounts.forEach((account, id) => {
      if (account.isZeroBalance()) {
        toRemove.push(id);
      }
    });
    toRemove.forEach(id => this.accounts.delete(id));
  }

  getNumberOfAccounts(): number {
    return this.accounts.size;
  }

  clear(): void {
    this.accounts.clear();
  }
}
