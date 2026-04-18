import { CommandParser } from '../utils/CommandParser';
import { Bank } from '../core/Bank';
import { AccountType } from '../types';
import { CertificateOfDeposit } from '../core/CertificateOfDeposit';
import { parseMoney } from '../utils/NumericParsing';

export class WithdrawCommandValidator {
  validate(command: string, bank: Bank): boolean {
    const parts = CommandParser.parseCommand(command);

    if (!parts || parts.length !== 3 || parts[0].toLowerCase() !== 'withdraw') {
      return false;
    }

    const accountId = parts[1];
    const amountStr = parts[2];

    if (!/^\d{8}$/.test(accountId)) {
      return false;
    }

    const account = bank.getAccount(accountId);
    if (!account) {
      return false;
    }

    // Strictly positive, finite, up to 2 decimal places.
    const amount = parseMoney(amountStr);
    if (amount === null || amount <= 0) {
      return false;
    }

    // CD accounts are locked for 12 months and must be withdrawn in full.
    if (account instanceof CertificateOfDeposit) {
      if (!account.canWithdraw()) return false;
      if (amount < account.getBalance()) return false;
    }

    // Savings accounts can only withdraw up to $1000 per request.
    if (account.getType() === AccountType.Savings && amount > 1000) {
      return false;
    }

    // Reject if the account doesn't have enough to cover the request. Letting
    // this through would silently short-fill and log a misleading amount.
    if (amount > account.getBalance()) {
      return false;
    }

    return true;
  }
}
