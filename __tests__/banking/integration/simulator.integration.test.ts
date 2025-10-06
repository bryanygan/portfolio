import { describe, it, expect, beforeEach } from 'vitest';
import { MasterControl } from '../../../lib/banking/core/MasterControl';
import { Bank } from '../../../lib/banking/core/Bank';

/**
 * Integration tests for the full banking simulator workflow
 * These tests simulate user interactions through the UI
 */
describe('Banking Simulator Integration Tests', () => {
  let bank: Bank;
  let masterControl: MasterControl;

  beforeEach(() => {
    bank = new Bank();
    masterControl = new MasterControl(bank);
  });

  describe('Terminal Input - Single Commands', () => {
    it('should execute create command and show account in output', () => {
      const output = masterControl.start(['create checking 12345678 1.0']);

      expect(output).toHaveLength(1);
      expect(output[0]).toMatch(/Checking 12345678 0\.00 1\.00/);
    });

    it('should execute create and deposit commands sequentially', () => {
      masterControl.start(['create checking 12345678 1.0']);
      const output = masterControl.start(['deposit 12345678 500']);

      expect(output[0]).toMatch(/Checking 12345678 500\.00 1\.00/);
      expect(output[1]).toBe('deposit 12345678 500');
    });

    it('should handle invalid commands by showing them in output', () => {
      const output = masterControl.start(['invalid command here']);

      expect(output).toContain('invalid command here');
    });

    it('should execute withdrawal and update balance', () => {
      masterControl.start(['create savings 87654321 2.5']);
      masterControl.start(['deposit 87654321 1000']);
      const output = masterControl.start(['withdraw 87654321 200']);

      expect(output[0]).toMatch(/Savings 87654321 800\.00 2\.50/);
    });
  });

  describe('Example Scenarios - Batch Execution', () => {
    it('should execute basic operations scenario', () => {
      const commands = [
        'create checking 12345678 1.0',
        'deposit 12345678 1000',
        'create savings 87654321 2.5',
        'transfer 12345678 87654321 500'
      ];

      const output = masterControl.start(commands);

      // Should have 2 accounts with transactions
      expect(output.filter(line => line.includes('Checking'))).toHaveLength(1);
      expect(output.filter(line => line.includes('Savings'))).toHaveLength(1);

      // Checking should have 500, Savings should have 500
      expect(output.find(line => line.includes('Checking'))).toMatch(/500\.00/);
      expect(output.find(line => line.includes('Savings'))).toMatch(/500\.00/);
    });

    it('should execute APR simulation scenario', () => {
      const commands = [
        'create savings 11111111 5.0',
        'deposit 11111111 1000',
        'pass 12'
      ];

      const output = masterControl.start(commands);

      // After 12 months at 5% APR, balance should be > 1000
      const accountLine = output.find(line => line.includes('Savings'));
      expect(accountLine).toBeTruthy();

      // Extract balance (format: "Savings 11111111 BALANCE 5.00")
      const balanceMatch = accountLine!.match(/Savings 11111111 ([\d.]+) 5\.00/);
      expect(balanceMatch).toBeTruthy();
      const balance = parseFloat(balanceMatch![1]);
      expect(balance).toBeGreaterThan(1000);
      expect(balance).toBeLessThan(1100); // Reasonable upper bound
    });

    it('should execute time passage scenario', () => {
      const commands = [
        'create checking 22222222 1.0',
        'deposit 22222222 50',
        'pass 3'
      ];

      const output = masterControl.start(commands);

      // Account with balance < 100 should be charged $25 fee per month
      // After 3 months: 50 - 25 - 25 - 25 = -25 (capped at 0)
      expect(output.filter(line => line.includes('Checking')).length).toBe(0);
      // Account should be removed due to zero balance
    });

    it('should execute CD account scenario', () => {
      const commands = [
        'create cd 33333333 3.0 5000',
        'pass 12',
        'withdraw 33333333 1000'
      ];

      const output = masterControl.start(commands);

      // CD should exist and have balance > 5000 due to APR
      const cdLine = output.find(line => line.includes('Cd'));
      expect(cdLine).toBeTruthy();

      // Should show withdrawal transaction
      expect(output).toContain('withdraw 33333333 1000');

      // Balance should be original + APR - withdrawal
      const balanceMatch = cdLine!.match(/Cd 33333333 ([\d.]+) 3\.00/);
      const balance = parseFloat(balanceMatch![1]);
      expect(balance).toBeGreaterThan(4000); // ~5150 - 1000
      expect(balance).toBeLessThan(5000);
    });

    it('should handle invalid commands scenario', () => {
      const commands = [
        'create checking 44444444 1.0',
        'deposit 44444444 abc',
        'withdraw 99999999 100',
        'transfer 44444444 44444444 100'
      ];

      const output = masterControl.start(commands);

      // Valid create should succeed
      expect(output.find(line => line.includes('Checking'))).toBeTruthy();

      // Invalid commands should appear at the end
      expect(output).toContain('deposit 44444444 abc');
      expect(output).toContain('withdraw 99999999 100');
      expect(output).toContain('transfer 44444444 44444444 100');
    });

    it('should execute complex multi-account scenario', () => {
      const commands = [
        'create checking 55555555 1.5',
        'create savings 66666666 2.0',
        'create cd 77777777 4.0 10000',
        'deposit 55555555 1000',
        'deposit 66666666 2000',
        'transfer 55555555 66666666 300',
        'withdraw 66666666 500',
        'pass 6'
      ];

      const output = masterControl.start(commands);

      // All 3 accounts should exist
      expect(output.filter(line => line.includes('Checking')).length).toBeGreaterThan(0);
      expect(output.filter(line => line.includes('Savings')).length).toBeGreaterThan(0);
      expect(output.filter(line => line.includes('Cd')).length).toBeGreaterThan(0);

      // Should have transaction history for checking and savings
      expect(output).toContain('deposit 55555555 1000');
      expect(output).toContain('deposit 66666666 2000');
      expect(output).toContain('transfer 55555555 66666666 300');
    });
  });

  describe('Account State Management', () => {
    it('should track multiple accounts independently', () => {
      const commands = [
        'create checking 11111111 1.0',
        'create savings 22222222 2.0',
        'create cd 33333333 3.0 5000',
        'deposit 11111111 100',
        'deposit 22222222 200'
      ];

      const output = masterControl.start(commands);

      expect(bank.getAllAccounts().size).toBe(3);
      expect(bank.getAccount('11111111')?.getBalance()).toBe(100);
      expect(bank.getAccount('22222222')?.getBalance()).toBe(200);
      expect(bank.getAccount('33333333')?.getBalance()).toBe(5000);
    });

    it('should remove zero-balance accounts after time passage', () => {
      const commands = [
        'create checking 11111111 1.0',
        'deposit 11111111 20',
        'pass 1'
      ];

      const output = masterControl.start(commands);

      // Account should be removed (20 - 25 fee = 0)
      expect(bank.getAllAccounts().size).toBe(0);
      expect(output.filter(line => line.includes('Checking')).length).toBe(0);
    });

    it('should maintain transaction history per account', () => {
      const commands = [
        'create checking 11111111 1.0',
        'deposit 11111111 100',
        'deposit 11111111 200',
        'withdraw 11111111 50'
      ];

      const output = masterControl.start(commands);

      // Should have account state line + 3 transaction lines
      const accountLines = output.filter(line =>
        line.includes('11111111') || line.includes('deposit') || line.includes('withdraw')
      );
      expect(accountLines.length).toBe(4); // 1 state + 3 transactions
    });
  });

  describe('Error Handling', () => {
    it('should reject duplicate account creation', () => {
      const commands = [
        'create checking 11111111 1.0',
        'create savings 11111111 2.0'
      ];

      const output = masterControl.start(commands);

      // First should succeed, second should be invalid
      expect(output.filter(line => line.includes('Checking')).length).toBe(1);
      expect(output).toContain('create savings 11111111 2.0');
    });

    it('should reject operations on non-existent accounts', () => {
      const commands = [
        'deposit 99999999 1000',
        'withdraw 99999999 500'
      ];

      const output = masterControl.start(commands);

      expect(output).toContain('deposit 99999999 1000');
      expect(output).toContain('withdraw 99999999 500');
      expect(bank.getAllAccounts().size).toBe(0);
    });

    it('should reject invalid APR values', () => {
      const commands = [
        'create checking 11111111 15.0',
        'create savings 22222222 -1.0'
      ];

      const output = masterControl.start(commands);

      expect(output).toContain('create checking 11111111 15.0');
      expect(output).toContain('create savings 22222222 -1.0');
      expect(bank.getAllAccounts().size).toBe(0);
    });

    it('should reject CD withdrawals before 12 months', () => {
      const commands = [
        'create cd 11111111 3.0 5000',
        'withdraw 11111111 1000',
        'pass 12',
        'withdraw 11111111 1000'
      ];

      const output = masterControl.start(commands);

      // First withdrawal should be invalid
      expect(output.filter(line => line.includes('withdraw 11111111 1000')).length).toBe(2);

      // Account should exist with balance reduced by second withdrawal
      const cdLine = output.find(line => line.includes('Cd'));
      expect(cdLine).toBeTruthy();
    });
  });

  describe('Output Formatting', () => {
    it('should format account state correctly', () => {
      const commands = ['create checking 12345678 1.5'];
      const output = masterControl.start(commands);

      expect(output[0]).toMatch(/^Checking 12345678 0\.00 1\.50$/);
    });

    it('should format transactions correctly', () => {
      const commands = [
        'create savings 87654321 2.0',
        'deposit 87654321 1500.50'
      ];

      const output = masterControl.start(commands);

      expect(output[1]).toBe('deposit 87654321 1500.50');
    });

    it('should show invalid commands verbatim', () => {
      const invalidCommand = 'this is not a valid command';
      const output = masterControl.start([invalidCommand]);

      expect(output).toContain(invalidCommand);
    });
  });
});
