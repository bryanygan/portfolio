import { Bank } from './Bank';
import { CommandValidation } from '../validators/CommandValidation';
import { CommandProcessor } from '../processors/CommandProcessor';
import { TransactionLogger } from '../utils/TransactionLogger';
import { CertificateOfDeposit } from './CertificateOfDeposit';

interface AccountSnapshot {
  balance: number;
  months?: number;
}

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

    for (const command of commands) {
      if (!this.commandValidation.validateCommand(command)) {
        this.invalidCommands.push(command);
        continue;
      }

      // Snapshot participating state so a processor exception doesn't leave
      // accounts in a half-updated state (e.g. a transfer that debited the
      // source but failed before crediting the destination).
      const snapshot = this.snapshotBalances();
      try {
        this.commandProcessor.processCommand(command);
      } catch (error) {
        this.restoreBalances(snapshot);
        // Validation should have caught everything reachable from user input;
        // any throw here is a bug we want visibility into, not silent failure.
        console.error('[banking] processor threw for valid command:', command, error);
        this.invalidCommands.push(command);
      }
    }

    // Generate output for all remaining accounts.
    const accounts = this.bank.getAllAccounts();
    accounts.forEach((account) => {
      output.push(account.toString());
      output.push(...this.transactionLogger.getTransactions(account.getAccountID()));
    });

    output.push(...this.invalidCommands);
    return output;
  }

  getInvalidCommands(): string[] {
    // Defensive copy so external callers can't mutate the internal list.
    return [...this.invalidCommands];
  }

  getBank(): Bank {
    return this.bank;
  }

  private snapshotBalances(): Map<string, AccountSnapshot> {
    const snapshot = new Map<string, AccountSnapshot>();
    this.bank.getAllAccounts().forEach((account, id) => {
      const entry: AccountSnapshot = { balance: account.getBalance() };
      if (account instanceof CertificateOfDeposit) {
        entry.months = account.getMonthsSinceCreation();
      }
      snapshot.set(id, entry);
    });
    return snapshot;
  }

  private restoreBalances(snapshot: Map<string, AccountSnapshot>): void {
    snapshot.forEach((entry, id) => {
      const account = this.bank.getAccount(id);
      if (!account) return;
      account.setBalance(entry.balance);
      if (account instanceof CertificateOfDeposit && entry.months !== undefined) {
        account.setMonthsSinceCreation(entry.months);
      }
    });
  }
}
