import { Bank } from '../core/Bank';
import { Checking } from '../core/Checking';
import { Savings } from '../core/Savings';
import { CertificateOfDeposit } from '../core/CertificateOfDeposit';
import { CommandParser } from '../utils/CommandParser';

export class CreateCommandProcessor {
  private bank: Bank;

  constructor(bank: Bank) {
    this.bank = bank;
  }

  execute(command: string): void {
    const parts = CommandParser.parseCommand(command);

    if (!parts || parts.length < 4) {
      throw new Error('Invalid create command format');
    }

    const accountType = parts[1].toLowerCase();
    const accountId = parts[2];
    const apr = parseFloat(parts[3]);

    switch (accountType) {
      case 'checking':
        const checking = new Checking(accountId, apr);
        this.bank.addAccount(checking);
        break;

      case 'savings':
        const savings = new Savings(accountId, apr);
        this.bank.addAccount(savings);
        break;

      case 'cd':
        if (parts.length !== 5) {
          throw new Error('CD account requires initial balance');
        }
        const initialBalance = parseFloat(parts[4]);
        const cd = new CertificateOfDeposit(accountId, apr, initialBalance);
        this.bank.addAccount(cd);
        break;

      default:
        throw new Error(`Invalid account type: ${accountType}`);
    }
  }
}
