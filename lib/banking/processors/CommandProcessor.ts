import { Bank } from '../core/Bank';
import { TransactionLogger } from '../utils/TransactionLogger';
import { CommandParser } from '../utils/CommandParser';
import { CreateCommandProcessor } from './CreateCommandProcessor';
import { DepositCommandProcessor } from './DepositCommandProcessor';
import { WithdrawCommandProcessor } from './WithdrawCommandProcessor';
import { TransferCommandProcessor } from './TransferCommandProcessor';
import { PassCommandProcessor } from './PassCommandProcessor';

export class CommandProcessor {
  private bank: Bank;
  private transactionLogger: TransactionLogger;
  private createProcessor: CreateCommandProcessor;
  private depositProcessor: DepositCommandProcessor;
  private withdrawProcessor: WithdrawCommandProcessor;
  private transferProcessor: TransferCommandProcessor;
  private passProcessor: PassCommandProcessor;

  constructor(bank: Bank, transactionLogger: TransactionLogger) {
    this.bank = bank;
    this.transactionLogger = transactionLogger;
    this.createProcessor = new CreateCommandProcessor(bank);
    this.depositProcessor = new DepositCommandProcessor(bank);
    this.withdrawProcessor = new WithdrawCommandProcessor(bank);
    this.transferProcessor = new TransferCommandProcessor(transactionLogger);
    this.passProcessor = new PassCommandProcessor(bank);
  }

  processCommand(command: string): void {
    const parts = CommandParser.parseCommand(command);

    if (!parts || parts.length < 1) {
      throw new Error('Invalid command');
    }

    const commandType = parts[0].toLowerCase();

    switch (commandType) {
      case 'create':
        this.createProcessor.execute(command);
        break;

      case 'deposit':
        this.depositProcessor.execute(command);
        this.transactionLogger.logTransaction(parts[1], command);
        break;

      case 'withdraw':
        this.withdrawProcessor.execute(command);
        this.transactionLogger.logTransaction(parts[1], command);
        break;

      case 'transfer':
        this.transferProcessor.execute(command, this.bank);
        // Transfer processor handles transaction logging internally
        break;

      case 'pass':
        this.passProcessor.execute(command);
        break;

      default:
        throw new Error(`Unknown command type: ${commandType}`);
    }
  }

  getBank(): Bank {
    return this.bank;
  }
}
