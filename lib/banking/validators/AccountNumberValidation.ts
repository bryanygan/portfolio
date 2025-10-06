export class AccountNumberValidation {
  private existingAccountIds: Set<string> = new Set();

  registerAccountId(accountId: string): void {
    this.existingAccountIds.add(accountId);
  }

  // Returns true if the account number is INVALID (not 8 digits)
  isValidAccountNumber(accountNumber: string): boolean {
    return !/^\d{8}$/.test(accountNumber);
  }

  isUniqueAccountId(accountId: string): boolean {
    return !this.existingAccountIds.has(accountId);
  }

  clear(): void {
    this.existingAccountIds.clear();
  }
}
