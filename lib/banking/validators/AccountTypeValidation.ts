export class AccountTypeValidation {
  static isValidAccountType(accountType: string): boolean {
    const lowerType = accountType.toLowerCase();
    return lowerType === 'savings' || lowerType === 'checking' || lowerType === 'cd';
  }
}
