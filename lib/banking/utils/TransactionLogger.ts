export class TransactionLogger {
  private transactionsByAccount: Map<string, string[]> = new Map();

  logTransaction(accountID: string, command: string): void {
    if (!this.transactionsByAccount.has(accountID)) {
      this.transactionsByAccount.set(accountID, []);
    }
    this.transactionsByAccount.get(accountID)!.push(command);
  }

  getTransactions(accountID: string): string[] {
    const transactions = this.transactionsByAccount.get(accountID);
    // Defensive copy so callers can't mutate the logger's internal array.
    return transactions ? [...transactions] : [];
  }

  removeTransactionsForAccount(accountID: string): void {
    this.transactionsByAccount.delete(accountID);
  }

  clear(): void {
    this.transactionsByAccount.clear();
  }
}
