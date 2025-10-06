import { Bank } from '../core/Bank';
import { CommandParser } from '../utils/CommandParser';
import { CreateCommandValidator } from './CreateCommandValidator';
import { DepositCommandValidator } from './DepositCommandValidator';
import { WithdrawCommandValidator } from './WithdrawCommandValidator';
import { TransferCommandValidator } from './TransferCommandValidator';
import { PassCommandValidator } from './PassCommandValidator';
import type { TransferCommand } from '../types';

export class CommandValidation {
  private bank: Bank;
  private createValidator: CreateCommandValidator;
  private depositValidator: DepositCommandValidator;
  private withdrawValidator: WithdrawCommandValidator;
  private transferValidator: TransferCommandValidator;
  private passValidator: PassCommandValidator;

  constructor(bank: Bank) {
    this.bank = bank;
    this.createValidator = new CreateCommandValidator();
    this.depositValidator = new DepositCommandValidator();
    this.withdrawValidator = new WithdrawCommandValidator();
    this.transferValidator = new TransferCommandValidator();
    this.passValidator = new PassCommandValidator();
  }

  validateCommand(command: string): boolean {
    const parts = CommandParser.parseCommand(command);

    if (!parts || parts.length < 2) {
      return false;
    }

    const commandType = parts[0].toLowerCase();

    switch (commandType) {
      case 'create':
        return this.createValidator.validate(command, this.bank);

      case 'deposit':
        return this.depositValidator.validate(command, this.bank);

      case 'withdraw':
        return this.withdrawValidator.validate(command, this.bank);

      case 'transfer':
        return this.validateTransferCommand(command);

      case 'pass':
        return this.passValidator.validate(command);

      default:
        return false;
    }
  }

  private validateTransferCommand(command: string): boolean {
    const parts = CommandParser.parseCommand(command);

    if (!parts || parts.length !== 4) {
      return false;
    }

    const fromId = parts[1];
    const toId = parts[2];

    try {
      const amount = parseFloat(parts[3]);

      if (isNaN(amount)) {
        return false;
      }

      const transferCommand: TransferCommand = {
        fromId,
        toId,
        amount,
        raw: command
      };

      return this.transferValidator.validate(transferCommand, this.bank);
    } catch {
      return false;
    }
  }
}
