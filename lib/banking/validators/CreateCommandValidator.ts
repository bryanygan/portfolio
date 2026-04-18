import { CommandParser } from '../utils/CommandParser';
import { Bank } from '../core/Bank';
import { AccountTypeValidation } from './AccountTypeValidation';
import { CdAccountValidation } from './CdAccountValidation';
import { parseApr, parseMoney, hasAtMostTwoDecimals } from '../utils/NumericParsing';

export class CreateCommandValidator {
  validate(command: string, bank: Bank): boolean {
    const parts = CommandParser.parseCommand(command);

    if (!parts || parts.length < 4 || parts[0].toLowerCase() !== 'create') {
      return false;
    }

    const accountType = parts[1].toLowerCase();
    const accountId = parts[2];
    const aprStr = parts[3];

    if (!AccountTypeValidation.isValidAccountType(accountType)) {
      return false;
    }

    if (!/^\d{8}$/.test(accountId)) {
      return false;
    }

    if (bank.getAccount(accountId)) {
      return false;
    }

    const apr = parseApr(aprStr);
    if (apr === null || apr < 0 || apr > 10) {
      return false;
    }

    // Decimal-places rule is enforced against the string form so legitimate
    // values like "2.3" aren't rejected due to float representation.
    if (!hasAtMostTwoDecimals(aprStr)) {
      return false;
    }

    if ((accountType === 'checking' || accountType === 'savings') && parts.length !== 4) {
      return false;
    }

    if (accountType === 'cd') {
      if (parts.length !== 5) {
        return false;
      }

      const balanceStr = parts[4];
      const balance = parseMoney(balanceStr);
      if (balance === null) {
        return false;
      }

      if (!CdAccountValidation.validateCdBalance(balance)) {
        return false;
      }

      if (!CdAccountValidation.validateApr(apr, aprStr)) {
        return false;
      }
    }

    return true;
  }
}
