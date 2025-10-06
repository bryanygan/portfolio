import { CommandParser } from '../utils/CommandParser';
import { Bank } from '../core/Bank';
import { AccountType } from '../types';

export class DepositCommandValidator {
  validate(command: string, bank: Bank): boolean {
    const parts = CommandParser.parseCommand(command);

    if (!parts || parts.length !== 3 || parts[0].toLowerCase() !== 'deposit') {
      return false;
    }

    const accountId = parts[1];
    const amountStr = parts[2];

    // Check if account ID is 8 digits
    if (!/^\d{8}$/.test(accountId)) {
      return false;
    }

    // Check if account exists
    const account = bank.getAccount(accountId);
    if (!account) {
      return false;
    }

    // Parse and validate amount
    const amount = parseFloat(amountStr);
    if (isNaN(amount) || amount < 0) {
      return false;
    }

    // Check deposit limits based on account type
    if (account.getType() === AccountType.Savings && amount > 2500) {
      return false;
    }

    if (account.getType() === AccountType.Checking && amount > 1000) {
      return false;
    }

    // Cannot deposit to CD account
    if (account.getType() === AccountType.Cd) {
      return false;
    }

    return true;
  }
}
