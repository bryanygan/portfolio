import { Bank } from '../core/Bank';
import { AccountType, type TransferCommand } from '../types';

export class TransferCommandValidator {
  validate(transferCommand: TransferCommand, bank: Bank): boolean {
    const { fromId, toId, amount } = transferCommand;

    // Cannot transfer to same account
    if (fromId === toId) {
      return false;
    }

    // Check if both accounts exist
    const fromAccount = bank.getAccount(fromId);
    const toAccount = bank.getAccount(toId);

    if (!fromAccount || !toAccount) {
      return false;
    }

    // CD accounts cannot transfer
    if (fromAccount.getType() === AccountType.Cd || toAccount.getType() === AccountType.Cd) {
      return false;
    }

    // Amount must be positive
    if (amount <= 0) {
      return false;
    }

    // Savings can only transfer out up to $1000
    if (fromAccount.getType() === AccountType.Savings && amount > 1000) {
      return false;
    }

    // Checking can only receive up to $400 in transfers
    if (toAccount.getType() === AccountType.Checking && amount > 400) {
      return false;
    }

    // Savings can only receive up to $2500 in transfers
    if (toAccount.getType() === AccountType.Savings && amount > 2500) {
      return false;
    }

    return true;
  }
}
