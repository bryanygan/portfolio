import { describe, it, expect, beforeEach } from 'vitest';
import { MasterControl } from '@/lib/banking/core/MasterControl';
import { Bank } from '@/lib/banking/core/Bank';

describe('MasterControl Integration Tests', () => {
  let masterControl: MasterControl;
  let bank: Bank;

  beforeEach(() => {
    bank = new Bank();
    masterControl = new MasterControl(bank);
  });

  describe('Create Commands', () => {
    it('creates and displays checking account', () => {
      const output = masterControl.start(['create checking 12345678 1.0']);
      expect(output[0]).toMatch(/Checking 12345678 0.00 1.00/);
    });

    it('creates and displays savings account', () => {
      const output = masterControl.start(['create savings 87654321 2.5']);
      expect(output[0]).toMatch(/Savings 87654321 0.00 2.50/);
    });

    it('creates and displays CD account', () => {
      const output = masterControl.start(['create cd 11111111 4.5 5000']);
      expect(output[0]).toMatch(/Cd 11111111 5000.00 4.50/);
    });

    it('logs invalid create command', () => {
      const output = masterControl.start(['creat checking 12345678 1.0']);
      expect(output[0]).toBe('creat checking 12345678 1.0');
    });
  });

  describe('Deposit Commands', () => {
    it('processes deposit and shows in output', () => {
      const commands = [
        'create checking 12345678 1.0',
        'deposit 12345678 500'
      ];
      const output = masterControl.start(commands);

      expect(output[0]).toMatch(/Checking 12345678 500.00 1.00/);
      expect(output[1]).toBe('deposit 12345678 500');
    });

    it('processes multiple deposits', () => {
      const commands = [
        'create savings 12345678 2.5',
        'deposit 12345678 1000',
        'deposit 12345678 500'
      ];
      const output = masterControl.start(commands);

      expect(output[0]).toMatch(/Savings 12345678 1500.00 2.50/);
      expect(output[1]).toBe('deposit 12345678 1000');
      expect(output[2]).toBe('deposit 12345678 500');
    });

    it('rejects deposit to non-existent account', () => {
      const output = masterControl.start(['deposit 99999999 500']);
      expect(output[0]).toBe('deposit 99999999 500');
    });
  });

  describe('Withdraw Commands', () => {
    it('processes withdraw and updates balance', () => {
      const commands = [
        'create checking 12345678 1.0',
        'deposit 12345678 1000',
        'withdraw 12345678 300'
      ];
      const output = masterControl.start(commands);

      expect(output[0]).toMatch(/Checking 12345678 700.00 1.00/);
      expect(output).toContain('withdraw 12345678 300');
    });

    it('handles withdraw exceeding balance', () => {
      const commands = [
        'create checking 12345678 1.0',
        'deposit 12345678 100',
        'withdraw 12345678 200'
      ];
      const output = masterControl.start(commands);

      // Should withdraw all available (100), leaving 0
      expect(output[0]).toMatch(/Checking 12345678 0.00 1.00/);
    });
  });

  describe('Transfer Commands', () => {
    it('transfers money between accounts', () => {
      const commands = [
        'create checking 11111111 1.0',
        'create savings 22222222 2.5',
        'deposit 11111111 1000',
        'transfer 11111111 22222222 300'
      ];
      const output = masterControl.start(commands);

      // Find the checking account line
      const checkingLine = output.find(line => line.startsWith('Checking 11111111'));
      expect(checkingLine).toMatch(/700.00/);

      // Find the savings account line
      const savingsLine = output.find(line => line.startsWith('Savings 22222222'));
      expect(savingsLine).toMatch(/300.00/);

      // Both accounts should show the transfer command
      expect(output).toContain('transfer 11111111 22222222 300');
    });

    it('logs transfer in both accounts', () => {
      const commands = [
        'create checking 11111111 1.0',
        'create checking 22222222 1.0',
        'deposit 11111111 1000',
        'transfer 11111111 22222222 200'
      ];
      const output = masterControl.start(commands);

      // Count how many times the transfer appears in output
      const transferCount = output.filter(line =>
        line === 'transfer 11111111 22222222 200'
      ).length;
      expect(transferCount).toBe(2); // Once for each account
    });
  });

  describe('Pass Time Commands', () => {
    it('accrues APR after passing time', () => {
      const commands = [
        'create savings 12345678 6.0',
        'deposit 12345678 1000',
        'pass 1'
      ];
      const output = masterControl.start(commands);

      // 1000 * (1 + 0.06/12) = 1005
      expect(output[0]).toMatch(/Savings 12345678 1005.00 6.00/);
    });

    it('removes zero balance accounts after pass time', () => {
      const commands = [
        'create checking 12345678 1.0',
        'pass 1'
      ];
      const output = masterControl.start(commands);

      // Account starts with $0, should be removed
      expect(output.length).toBe(0);
    });

    it('applies minimum balance fee', () => {
      const commands = [
        'create checking 12345678 1.0',
        'deposit 12345678 50',
        'pass 1'
      ];
      const output = masterControl.start(commands);

      // 50 - 25 fee = 25, then APR
      const balance = parseFloat(output[0].split(' ')[2]);
      expect(balance).toBeCloseTo(25.02, 1);
    });

    it('processes multiple months correctly', () => {
      const commands = [
        'create savings 12345678 6.0',
        'deposit 12345678 1000',
        'pass 12'
      ];
      const output = masterControl.start(commands);

      // After 12 months at 0.5% per month: ~1061.68
      const balance = parseFloat(output[0].split(' ')[2]);
      expect(balance).toBeGreaterThan(1061);
      expect(balance).toBeLessThan(1062);
    });
  });

  describe('Complex Scenarios', () => {
    it('handles complete banking flow', () => {
      const commands = [
        'create checking 11111111 1.0',
        'create savings 22222222 2.5',
        'deposit 11111111 1000',
        'deposit 22222222 500',
        'transfer 11111111 22222222 200',
        'withdraw 22222222 100',
        'pass 1'
      ];
      const output = masterControl.start(commands);

      // Checking: 1000 - 200 = 800, then APR
      const checkingLine = output.find(line => line.startsWith('Checking'));
      expect(checkingLine).toBeTruthy();

      // Savings: 500 + 200 - 100 = 600, then APR
      const savingsLine = output.find(line => line.startsWith('Savings'));
      expect(savingsLine).toBeTruthy();
    });

    it('handles mix of valid and invalid commands', () => {
      const commands = [
        'create checking 12345678 1.0',
        'deposit 12345678 500',
        'creat savings 87654321 2.5',  // Invalid (typo)
        'deposit 99999999 100',         // Invalid (no account)
        'withdraw 12345678 200'
      ];
      const output = masterControl.start(commands);

      // Should have account output + transactions + 2 invalid commands
      expect(output[0]).toMatch(/Checking 12345678 300.00/);
      expect(output).toContain('creat savings 87654321 2.5');
      expect(output).toContain('deposit 99999999 100');
    });

    it('handles CD account restrictions', () => {
      const commands = [
        'create cd 12345678 4.5 5000',
        'deposit 12345678 1000',  // Invalid - can't deposit to CD
        'pass 12'
      ];
      const output = masterControl.start(commands);

      // CD should still have original balance + APR growth
      const cdLine = output.find(line => line.startsWith('Cd'));
      const balance = parseFloat(cdLine!.split(' ')[2]);
      expect(balance).toBeGreaterThan(5000);

      // Deposit should be in invalid commands
      expect(output).toContain('deposit 12345678 1000');
    });

    it('processes sample test case from requirements', () => {
      const commands = [
        'create checking 12345678 1.0',
        'deposit 12345678 500',
        'create savings 87654321 2.5',
        'transfer 12345678 87654321 200',
        'pass 1',
        'withdraw 87654321 50'
      ];
      const output = masterControl.start(commands);

      // Checking: 500 - 200 = 300, then APR 300 * 1.01/12 ≈ 300.25
      const checkingLine = output.find(line => line.startsWith('Checking'));
      expect(checkingLine).toMatch(/12345678/);

      // Savings: 200 - 50 = 150, then APR 150 * 1.025/12 ≈ 150.31
      const savingsLine = output.find(line => line.startsWith('Savings'));
      expect(savingsLine).toMatch(/87654321/);

      // Check transaction order in output
      const savingsSection = output.slice(
        output.findIndex(line => line.startsWith('Savings'))
      );
      expect(savingsSection).toContain('transfer 12345678 87654321 200');
      expect(savingsSection).toContain('withdraw 87654321 50');
    });
  });

  describe('Edge Cases', () => {
    it('handles empty command list', () => {
      const output = masterControl.start([]);
      expect(output.length).toBe(0);
    });

    it('handles all invalid commands', () => {
      const commands = [
        'invalid command',
        'another bad one',
        'create investment 12345678 1.0'
      ];
      const output = masterControl.start(commands);

      expect(output).toEqual(commands);
    });

    it('preserves account order in output', () => {
      const commands = [
        'create checking 11111111 1.0',
        'create savings 22222222 2.5',
        'create cd 33333333 4.5 5000',
        'deposit 11111111 100',
        'deposit 22222222 200'
      ];
      const output = masterControl.start(commands);

      const checkingIndex = output.findIndex(line => line.startsWith('Checking'));
      const savingsIndex = output.findIndex(line => line.startsWith('Savings'));
      const cdIndex = output.findIndex(line => line.startsWith('Cd'));

      expect(checkingIndex).toBeLessThan(savingsIndex);
      expect(savingsIndex).toBeLessThan(cdIndex);
    });

    it('handles account removal during pass time', () => {
      const commands = [
        'create checking 11111111 1.0',
        'create checking 22222222 1.0',
        'deposit 11111111 100',
        // 22222222 has $0
        'pass 1'
      ];
      const output = masterControl.start(commands);

      // Only account 11111111 should remain
      const checkingCount = output.filter(line => line.startsWith('Checking')).length;
      expect(checkingCount).toBe(1);
      expect(output[0]).toMatch(/11111111/);
    });
  });
});
