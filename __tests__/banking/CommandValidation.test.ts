import { describe, it, expect, beforeEach } from 'vitest';
import { Bank } from '@/lib/banking/core/Bank';
import { CommandValidation } from '@/lib/banking/validators/CommandValidation';
import { Checking } from '@/lib/banking/core/Checking';
import { Savings } from '@/lib/banking/core/Savings';
import { CertificateOfDeposit } from '@/lib/banking/core/CertificateOfDeposit';

describe('CommandValidation', () => {
  let bank: Bank;
  let validator: CommandValidation;

  beforeEach(() => {
    bank = new Bank();
    validator = new CommandValidation(bank);
  });

  describe('Create Command Validation', () => {
    it('validates correct checking account creation', () => {
      expect(validator.validateCommand('create checking 12345678 1.0')).toBe(true);
    });

    it('validates correct savings account creation', () => {
      expect(validator.validateCommand('create savings 87654321 2.5')).toBe(true);
    });

    it('validates correct CD account creation', () => {
      expect(validator.validateCommand('create cd 11111111 4.5 5000')).toBe(true);
    });

    it('rejects create with invalid account type', () => {
      expect(validator.validateCommand('create investment 12345678 1.0')).toBe(false);
    });

    it('rejects create with non-8-digit account ID', () => {
      expect(validator.validateCommand('create checking 1234567 1.0')).toBe(false);
      expect(validator.validateCommand('create checking 123456789 1.0')).toBe(false);
    });

    it('rejects create with invalid APR', () => {
      expect(validator.validateCommand('create checking 12345678 -1.0')).toBe(false);
      expect(validator.validateCommand('create checking 12345678 11.0')).toBe(false);
    });

    it('rejects create with APR having more than 2 decimal places', () => {
      expect(validator.validateCommand('create checking 12345678 1.234')).toBe(false);
    });

    it('rejects create for duplicate account ID', () => {
      bank.addAccount(new Checking('12345678', 1.0));
      expect(validator.validateCommand('create checking 12345678 1.0')).toBe(false);
    });

    it('rejects CD with invalid balance', () => {
      expect(validator.validateCommand('create cd 11111111 4.5 500')).toBe(false);
      expect(validator.validateCommand('create cd 11111111 4.5 15000')).toBe(false);
    });

    it('accepts CD with valid balance range', () => {
      expect(validator.validateCommand('create cd 11111111 4.5 1000')).toBe(true);
      expect(validator.validateCommand('create cd 22222222 4.5 10000')).toBe(true);
    });

    it('rejects create with missing parameters', () => {
      expect(validator.validateCommand('create checking 12345678')).toBe(false);
      expect(validator.validateCommand('create cd 12345678 4.5')).toBe(false);
    });
  });

  describe('Deposit Command Validation', () => {
    beforeEach(() => {
      bank.addAccount(new Checking('12345678', 1.0));
      bank.addAccount(new Savings('87654321', 2.5));
      bank.addAccount(new CertificateOfDeposit('11111111', 4.5, 5000));
    });

    it('validates correct deposit to checking', () => {
      expect(validator.validateCommand('deposit 12345678 500')).toBe(true);
    });

    it('validates correct deposit to savings', () => {
      expect(validator.validateCommand('deposit 87654321 1000')).toBe(true);
    });

    it('rejects deposit to non-existent account', () => {
      expect(validator.validateCommand('deposit 99999999 500')).toBe(false);
    });

    it('rejects deposit with negative amount', () => {
      expect(validator.validateCommand('deposit 12345678 -100')).toBe(false);
    });

    it('rejects deposit exceeding checking limit (>$1000)', () => {
      expect(validator.validateCommand('deposit 12345678 1001')).toBe(false);
    });

    it('rejects deposit exceeding savings limit (>$2500)', () => {
      expect(validator.validateCommand('deposit 87654321 2501')).toBe(false);
    });

    it('rejects deposit to CD account', () => {
      expect(validator.validateCommand('deposit 11111111 1000')).toBe(false);
    });

    it('rejects deposit with invalid account ID format', () => {
      expect(validator.validateCommand('deposit 1234567 500')).toBe(false);
    });

    it('rejects deposit with non-numeric amount', () => {
      expect(validator.validateCommand('deposit 12345678 abc')).toBe(false);
    });
  });

  describe('Withdraw Command Validation', () => {
    beforeEach(() => {
      const checking = new Checking('12345678', 1.0);
      const savings = new Savings('87654321', 2.5);
      checking.deposit(1000);
      savings.deposit(1000);
      bank.addAccount(checking);
      bank.addAccount(savings);
    });

    it('validates correct withdraw from checking', () => {
      expect(validator.validateCommand('withdraw 12345678 500')).toBe(true);
    });

    it('validates correct withdraw from savings', () => {
      expect(validator.validateCommand('withdraw 87654321 500')).toBe(true);
    });

    it('rejects withdraw from non-existent account', () => {
      expect(validator.validateCommand('withdraw 99999999 500')).toBe(false);
    });

    it('rejects withdraw with negative amount', () => {
      expect(validator.validateCommand('withdraw 12345678 -100')).toBe(false);
    });

    it('rejects savings withdraw exceeding $1000', () => {
      expect(validator.validateCommand('withdraw 87654321 1001')).toBe(false);
    });

    it('allows withdraw even if exceeds balance (validation passes, execution handles)', () => {
      expect(validator.validateCommand('withdraw 12345678 2000')).toBe(true);
    });
  });

  describe('Transfer Command Validation', () => {
    beforeEach(() => {
      const checking1 = new Checking('11111111', 1.0);
      const checking2 = new Checking('22222222', 1.0);
      const savings = new Savings('33333333', 2.5);
      const cd = new CertificateOfDeposit('44444444', 4.5, 5000);

      checking1.deposit(1000);
      checking2.deposit(1000);
      savings.deposit(1000);

      bank.addAccount(checking1);
      bank.addAccount(checking2);
      bank.addAccount(savings);
      bank.addAccount(cd);
    });

    it('validates correct transfer between checking accounts', () => {
      expect(validator.validateCommand('transfer 11111111 22222222 300')).toBe(true);
    });

    it('validates correct transfer from checking to savings', () => {
      expect(validator.validateCommand('transfer 11111111 33333333 300')).toBe(true);
    });

    it('rejects transfer to same account', () => {
      expect(validator.validateCommand('transfer 11111111 11111111 100')).toBe(false);
    });

    it('rejects transfer from non-existent account', () => {
      expect(validator.validateCommand('transfer 99999999 22222222 100')).toBe(false);
    });

    it('rejects transfer to non-existent account', () => {
      expect(validator.validateCommand('transfer 11111111 99999999 100')).toBe(false);
    });

    it('rejects transfer from CD account', () => {
      expect(validator.validateCommand('transfer 44444444 11111111 100')).toBe(false);
    });

    it('rejects transfer to CD account', () => {
      expect(validator.validateCommand('transfer 11111111 44444444 100')).toBe(false);
    });

    it('rejects transfer from savings exceeding $1000', () => {
      expect(validator.validateCommand('transfer 33333333 11111111 1001')).toBe(false);
    });

    it('rejects transfer to checking exceeding $400', () => {
      expect(validator.validateCommand('transfer 11111111 22222222 401')).toBe(false);
    });

    it('rejects transfer to savings exceeding $2500', () => {
      expect(validator.validateCommand('transfer 11111111 33333333 2501')).toBe(false);
    });

    it('rejects transfer with negative amount', () => {
      expect(validator.validateCommand('transfer 11111111 22222222 -100')).toBe(false);
    });

    it('rejects transfer with zero amount', () => {
      expect(validator.validateCommand('transfer 11111111 22222222 0')).toBe(false);
    });
  });

  describe('Pass Command Validation', () => {
    it('validates correct pass command', () => {
      expect(validator.validateCommand('pass 1')).toBe(true);
      expect(validator.validateCommand('pass 12')).toBe(true);
      expect(validator.validateCommand('pass 60')).toBe(true);
    });

    it('rejects pass with months less than 1', () => {
      expect(validator.validateCommand('pass 0')).toBe(false);
      expect(validator.validateCommand('pass -1')).toBe(false);
    });

    it('rejects pass with months greater than 60', () => {
      expect(validator.validateCommand('pass 61')).toBe(false);
    });

    it('rejects pass with non-integer months', () => {
      expect(validator.validateCommand('pass 1.5')).toBe(false);
      expect(validator.validateCommand('pass abc')).toBe(false);
    });

    it('rejects pass with missing parameter', () => {
      expect(validator.validateCommand('pass')).toBe(false);
    });

    it('rejects pass with too many parameters', () => {
      expect(validator.validateCommand('pass 12 extra')).toBe(false);
    });
  });

  describe('Invalid Commands', () => {
    it('rejects empty command', () => {
      expect(validator.validateCommand('')).toBe(false);
    });

    it('rejects command with only whitespace', () => {
      expect(validator.validateCommand('   ')).toBe(false);
    });

    it('rejects unknown command type', () => {
      expect(validator.validateCommand('delete 12345678')).toBe(false);
      expect(validator.validateCommand('update 12345678 1000')).toBe(false);
    });

    it('rejects command with insufficient parameters', () => {
      expect(validator.validateCommand('create')).toBe(false);
      expect(validator.validateCommand('deposit')).toBe(false);
    });
  });
});
