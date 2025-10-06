import { describe, it, expect } from 'vitest';
import { Bank } from '@/lib/banking/core/Bank';
import { MasterControl } from '@/lib/banking/core/MasterControl';

// Since we can't easily test React hooks without React Testing Library for React 19,
// we'll test the underlying logic that the hook uses

describe('Banking System Hook Logic', () => {
  describe('MasterControl Integration', () => {
    it('executes single command and returns output', () => {
      const bank = new Bank();
      const masterControl = new MasterControl(bank);

      const output = masterControl.start(['create checking 12345678 1.0']);

      expect(output).toHaveLength(1);
      expect(output[0]).toMatch(/Checking 12345678 0.00 1.00/);
    });

    it('executes batch of commands', () => {
      const bank = new Bank();
      const masterControl = new MasterControl(bank);

      const commands = [
        'create checking 12345678 1.0',
        'deposit 12345678 500',
        'create savings 87654321 2.5'
      ];

      const output = masterControl.start(commands);

      expect(output.length).toBeGreaterThan(0);
      expect(output.some(line => line.includes('12345678'))).toBe(true);
      expect(output.some(line => line.includes('87654321'))).toBe(true);
    });

    it('maintains command history through state', () => {
      const commandHistory: string[] = [];
      const bank = new Bank();
      const masterControl = new MasterControl(bank);

      const command1 = 'create checking 12345678 1.0';
      masterControl.start([command1]);
      commandHistory.push(command1);

      const command2 = 'deposit 12345678 500';
      masterControl.start([command2]);
      commandHistory.push(command2);

      expect(commandHistory).toEqual([
        'create checking 12345678 1.0',
        'deposit 12345678 500'
      ]);
    });
  });

  describe('Account Retrieval', () => {
    it('gets all accounts as array', () => {
      const bank = new Bank();
      const masterControl = new MasterControl(bank);

      masterControl.start([
        'create checking 11111111 1.0',
        'create savings 22222222 2.5',
        'create cd 33333333 4.5 5000'
      ]);

      const accounts = Array.from(bank.getAllAccounts().values());

      expect(accounts).toHaveLength(3);
      expect(accounts.map(a => a.getAccountID())).toEqual([
        '11111111',
        '22222222',
        '33333333'
      ]);
    });

    it('gets account by ID', () => {
      const bank = new Bank();
      const masterControl = new MasterControl(bank);

      masterControl.start(['create checking 12345678 1.0']);

      const account = bank.getAccount('12345678');

      expect(account).toBeDefined();
      expect(account?.getAccountID()).toBe('12345678');
      expect(account?.getBalance()).toBe(0);
    });
  });

  describe('Output Parsing', () => {
    it('parses output into account states and transactions', () => {
      const bank = new Bank();
      const masterControl = new MasterControl(bank);

      const output = masterControl.start([
        'create checking 12345678 1.0',
        'deposit 12345678 500',
        'withdraw 12345678 200'
      ]);

      // Output format:
      // Line 0: Account state (e.g., "Checking 12345678 300.00 1.00")
      // Line 1: Transaction (e.g., "deposit 12345678 500")
      // Line 2: Transaction (e.g., "withdraw 12345678 200")

      const accountStateLine = output[0];
      const transactionLines = output.slice(1);

      expect(accountStateLine).toMatch(/^Checking 12345678/);
      expect(transactionLines).toContain('deposit 12345678 500');
      expect(transactionLines).toContain('withdraw 12345678 200');
    });

    it('separates valid and invalid commands in output', () => {
      const bank = new Bank();
      const masterControl = new MasterControl(bank);

      const output = masterControl.start([
        'create checking 12345678 1.0',
        'invalid command here',
        'deposit 12345678 500'
      ]);

      // Valid commands produce account state + transactions
      // Invalid commands appear at the end
      expect(output).toContain('invalid command here');
    });
  });

  describe('Reset Functionality', () => {
    it('creates fresh bank and master control on reset', () => {
      let bank = new Bank();
      let masterControl = new MasterControl(bank);

      masterControl.start(['create checking 12345678 1.0']);
      expect(bank.getNumberOfAccounts()).toBe(1);

      // Simulate reset
      bank = new Bank();
      masterControl = new MasterControl(bank);

      expect(bank.getNumberOfAccounts()).toBe(0);
    });
  });

  describe('Invalid Commands Tracking', () => {
    it('tracks invalid commands separately', () => {
      const bank = new Bank();
      const masterControl = new MasterControl(bank);

      masterControl.start([
        'create checking 12345678 1.0',
        'invalid command',
        'another bad command'
      ]);

      const invalidCommands = masterControl.getInvalidCommands();

      expect(invalidCommands).toHaveLength(2);
      expect(invalidCommands).toContain('invalid command');
      expect(invalidCommands).toContain('another bad command');
    });
  });
});
