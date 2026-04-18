import { Bank } from '../core/Bank';
import { AccountType, type TransferCommand } from '../types';

export class TransferCommandValidator {
  validate(transferCommand: TransferCommand, bank: Bank): boolean {
    const { fromId, toId, amount } = transferCommand;

    if (fromId === toId) {
      return false;
    }

    const fromAccount = bank.getAccount(fromId);
    const toAccount = bank.getAccount(toId);

    if (!fromAccount || !toAccount) {
      return false;
    }

    if (fromAccount.getType() === AccountType.Cd || toAccount.getType() === AccountType.Cd) {
      return false;
    }

    if (!Number.isFinite(amount) || amount <= 0) {
      return false;
    }

    if (fromAccount.getType() === AccountType.Savings && amount > 1000) {
      return false;
    }

    if (toAccount.getType() === AccountType.Checking && amount > 400) {
      return false;
    }

    if (toAccount.getType() === AccountType.Savings && amount > 2500) {
      return false;
    }

    // Reject if the source can't cover the transfer. Without this the processor
    // silently moves only the available balance and logs the requested amount,
    // so the transaction log is inconsistent with reality.
    if (amount > fromAccount.getBalance()) {
      return false;
    }

    return true;
  }
}
