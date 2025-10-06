import { Bank } from '../core/Bank';
import { CommandParser } from '../utils/CommandParser';

export class PassCommandProcessor {
  private bank: Bank;

  constructor(bank: Bank) {
    this.bank = bank;
  }

  execute(command: string): void {
    const parts = CommandParser.parseCommand(command);

    if (!parts || parts.length !== 2) {
      throw new Error('Invalid pass command format');
    }

    const months = parseInt(parts[1], 10);

    if (isNaN(months) || months < 1 || months > 60) {
      throw new Error('Invalid number of months');
    }

    this.bank.processPassTime(months);
  }
}
