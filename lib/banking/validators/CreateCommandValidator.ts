import { CommandParser } from '../utils/CommandParser';
import { Bank } from '../core/Bank';
import { AccountTypeValidation } from './AccountTypeValidation';
import { CdAccountValidation } from './CdAccountValidation';

export class CreateCommandValidator {
  validate(command: string, bank: Bank): boolean {
    const parts = CommandParser.parseCommand(command);

    if (!parts || parts.length < 4 || parts[0].toLowerCase() !== 'create') {
      return false;
    }

    const accountType = parts[1].toLowerCase();
    const accountId = parts[2];
    const aprStr = parts[3];

    // Validate account type
    if (!AccountTypeValidation.isValidAccountType(accountType)) {
      return false;
    }

    // Validate account ID (must be 8 digits)
    if (!/^\d{8}$/.test(accountId)) {
      return false;
    }

    // Check if account already exists in the bank
    if (bank.getAccount(accountId)) {
      return false;
    }

    // Parse and validate APR
    const apr = parseFloat(aprStr);
    if (isNaN(apr) || apr < 0 || apr > 10) {
      return false;
    }

    // Validate APR has at most 2 decimal places
    if (Math.floor(apr * 100) !== apr * 100) {
      return false;
    }

    // For checking and savings, should be exactly 4 parts
    if ((accountType === 'checking' || accountType === 'savings') && parts.length !== 4) {
      return false;
    }

    // For CD, need exactly 5 parts and validate balance
    if (accountType === 'cd') {
      if (parts.length !== 5) {
        return false;
      }

      const balanceStr = parts[4];
      const balance = parseFloat(balanceStr);

      if (isNaN(balance)) {
        return false;
      }

      if (!CdAccountValidation.validateCdBalance(balance)) {
        return false;
      }

      if (!CdAccountValidation.validateApr(apr)) {
        return false;
      }
    }

    return true;
  }
}
