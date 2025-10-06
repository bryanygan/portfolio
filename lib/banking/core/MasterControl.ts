import { Bank } from './Bank';
import { CommandValidation } from '../validators/CommandValidation';
import { CommandProcessor } from '../processors/CommandProcessor';
import { TransactionLogger } from '../utils/TransactionLogger';

export class MasterControl {
  private bank: Bank;
  private commandValidation: CommandValidation;
  private commandProcessor: CommandProcessor;
  private transactionLogger: TransactionLogger;
  private invalidCommands: string[] = [];

  constructor(bank: Bank) {
    this.bank = bank;
    this.transactionLogger = new TransactionLogger();
    this.commandValidation = new CommandValidation(bank);
    this.commandProcessor = new CommandProcessor(bank, this.transactionLogger);
  }

  start(commands: string[]): string[] {
    const output: string[] = [];
    this.invalidCommands = [];

    // Process all commands
    for (const command of commands) {
      if (this.commandValidation.validateCommand(command)) {
        try {
          this.commandProcessor.processCommand(command);
        } catch (error) {
          // If processing fails, treat as invalid
          this.invalidCommands.push(command);
        }
      } else {
        this.invalidCommands.push(command);
      }
    }

    // Generate output for all remaining accounts
    const accounts = this.bank.getAllAccounts();
    accounts.forEach((account) => {
      const accountState = account.toString();
      const transactions = this.transactionLogger.getTransactions(account.getAccountID());
      output.push(accountState);
      output.push(...transactions);
    });

    // Append invalid commands at the end
    output.push(...this.invalidCommands);

    return output;
  }

  getInvalidCommands(): string[] {
    return this.invalidCommands;
  }

  getBank(): Bank {
    return this.bank;
  }
}
