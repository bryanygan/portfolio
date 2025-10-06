import { Bank } from '../core/Bank';
import { CommandParser } from '../utils/CommandParser';

export class WithdrawCommandProcessor {
  private bank: Bank;

  constructor(bank: Bank) {
    this.bank = bank;
  }

  execute(command: string): void {
    const parts = CommandParser.parseCommand(command);

    if (!parts || parts.length < 3) {
      throw new Error('Invalid withdraw command format');
    }

    const accountId = parts[1];
    const amount = parseFloat(parts[2]);

    const account = this.bank.getAccount(accountId);
    if (!account) {
      throw new Error(`Account does not exist: ${accountId}`);
    }

    this.bank.withdrawByID(accountId, amount);
  }
}
