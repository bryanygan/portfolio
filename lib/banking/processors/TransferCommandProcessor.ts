import { Bank } from '../core/Bank';
import { TransactionLogger } from '../utils/TransactionLogger';
import { CommandParser } from '../utils/CommandParser';

export class TransferCommandProcessor {
  private transactionLogger: TransactionLogger;

  constructor(transactionLogger: TransactionLogger) {
    this.transactionLogger = transactionLogger;
  }

  execute(command: string, bank: Bank): void {
    const parts = CommandParser.parseCommand(command);

    if (!parts || parts.length !== 4) {
      throw new Error('Invalid transfer command format');
    }

    const fromId = parts[1];
    const toId = parts[2];
    const amount = parseFloat(parts[3]);

    const fromAccount = bank.getAccount(fromId);
    const toAccount = bank.getAccount(toId);

    if (!fromAccount || !toAccount) {
      throw new Error('One or both accounts do not exist');
    }

    // Withdraw from source account
    const actualWithdrawn = fromAccount.withdraw(amount);

    // Deposit to destination account
    toAccount.deposit(actualWithdrawn);

    // Log the transaction for both accounts
    this.transactionLogger.logTransactionRaw(fromId, command);
    this.transactionLogger.logTransactionRaw(toId, command);
  }
}
