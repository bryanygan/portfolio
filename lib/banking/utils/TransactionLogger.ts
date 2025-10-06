export class TransactionLogger {
  private transactionsByAccount: Map<string, string[]> = new Map();

  logTransaction(accountID: string, command: string): void {
    if (!this.transactionsByAccount.has(accountID)) {
      this.transactionsByAccount.set(accountID, []);
    }
    this.transactionsByAccount.get(accountID)!.push(command);
  }

  logTransactionRaw(accountID: string, rawCommand: string): void {
    this.logTransaction(accountID, rawCommand);
  }

  getTransactions(accountID: string): string[] {
    return this.transactionsByAccount.get(accountID) || [];
  }

  removeTransactionsForAccount(accountID: string): void {
    this.transactionsByAccount.delete(accountID);
  }

  generateOutput(accountState: string): string[] {
    const accountID = accountState.split(' ')[1];
    const transactions = this.getTransactions(accountID);
    return [accountState, ...transactions];
  }

  clear(): void {
    this.transactionsByAccount.clear();
  }
}
