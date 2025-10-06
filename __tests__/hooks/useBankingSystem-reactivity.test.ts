import { describe, it, expect } from 'vitest';
import { Bank } from '../../lib/banking/core/Bank';
import { MasterControl } from '../../lib/banking/core/MasterControl';

/**
 * Tests to verify that the accounts array updates correctly
 * when commands are executed
 */
describe('useBankingSystem Reactivity', () => {
  it('should update accounts array after creating an account', () => {
    const bank = new Bank();
    const masterControl = new MasterControl(bank);

    // Initially no accounts
    let accounts = Array.from(bank.getAllAccounts().values());
    expect(accounts.length).toBe(0);

    // Execute create command
    masterControl.start(['create checking 12345678 1.0']);

    // Accounts should now include the new account
    accounts = Array.from(bank.getAllAccounts().values());
    expect(accounts.length).toBe(1);
    expect(accounts[0].getAccountID()).toBe('12345678');
  });

  it('should update accounts array after multiple commands', () => {
    const bank = new Bank();
    const masterControl = new MasterControl(bank);

    // Execute multiple create commands
    masterControl.start([
      'create checking 11111111 1.0',
      'create savings 22222222 2.0',
      'create cd 33333333 3.0 5000'
    ]);

    // Should have all 3 accounts
    const accounts = Array.from(bank.getAllAccounts().values());
    expect(accounts.length).toBe(3);

    const accountIds = accounts.map(acc => acc.getAccountID()).sort();
    expect(accountIds).toEqual(['11111111', '22222222', '33333333']);
  });

  it('should update accounts array after account removal (time passage)', () => {
    const bank = new Bank();
    const masterControl = new MasterControl(bank);

    // Create account with low balance that will be removed
    masterControl.start([
      'create checking 11111111 1.0',
      'deposit 11111111 20',
      'pass 1' // Fee of $25 will bring balance to 0, removing account
    ]);

    // Account should be removed
    const accounts = Array.from(bank.getAllAccounts().values());
    expect(accounts.length).toBe(0);
  });

  it('should reflect balance changes in accounts array', () => {
    const bank = new Bank();
    const masterControl = new MasterControl(bank);

    // Create and deposit
    masterControl.start([
      'create savings 11111111 2.0',
      'deposit 11111111 1000'
    ]);

    let accounts = Array.from(bank.getAllAccounts().values());
    expect(accounts[0].getBalance()).toBe(1000);

    // Withdraw
    masterControl.start(['withdraw 11111111 500']);

    accounts = Array.from(bank.getAllAccounts().values());
    expect(accounts[0].getBalance()).toBe(500);
  });

  it('should update when using batch execution', () => {
    const bank = new Bank();
    const masterControl = new MasterControl(bank);

    // Batch execution
    const output = masterControl.start([
      'create checking 11111111 1.0',
      'deposit 11111111 500',
      'create savings 22222222 2.0',
      'deposit 22222222 1000'
    ]);

    const accounts = Array.from(bank.getAllAccounts().values());
    expect(accounts.length).toBe(2);
    expect(output.length).toBeGreaterThan(0);
  });
});
