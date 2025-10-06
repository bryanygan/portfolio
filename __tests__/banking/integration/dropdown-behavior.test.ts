import { describe, it, expect } from 'vitest';
import { MasterControl } from '../../../lib/banking/core/MasterControl';
import { Bank } from '../../../lib/banking/core/Bank';

/**
 * Tests to verify dropdown behavior with multiple accounts
 * Each account should maintain its own transaction history independently
 */
describe('Account Dropdown Behavior', () => {
  it('should maintain separate transaction histories for different accounts', () => {
    const bank = new Bank();
    const masterControl = new MasterControl(bank);

    const commands = [
      'create checking 11111111 1.0',
      'create savings 22222222 2.0',
      'deposit 11111111 500',
      'deposit 11111111 300',
      'deposit 22222222 1000',
      'withdraw 11111111 100'
    ];

    const output = masterControl.start(commands);

    // Parse output to get transaction histories
    const accountOutputs: Map<string, string[]> = new Map();
    let currentAccountId: string | null = null;

    output.forEach(line => {
      if (line.match(/^(Checking|Savings|Cd)\s+\d{8}/)) {
        const parts = line.split(' ');
        currentAccountId = parts[1];
        accountOutputs.set(currentAccountId, []);
      } else if (currentAccountId && line.match(/^(create|deposit|withdraw|transfer|pass)/)) {
        accountOutputs.get(currentAccountId)?.push(line);
      }
    });

    // Checking account should have 3 transactions
    const checkingTransactions = accountOutputs.get('11111111') || [];
    expect(checkingTransactions).toHaveLength(3);
    expect(checkingTransactions).toContain('deposit 11111111 500');
    expect(checkingTransactions).toContain('deposit 11111111 300');
    expect(checkingTransactions).toContain('withdraw 11111111 100');

    // Savings account should have 1 transaction
    const savingsTransactions = accountOutputs.get('22222222') || [];
    expect(savingsTransactions).toHaveLength(1);
    expect(savingsTransactions).toContain('deposit 22222222 1000');
  });

  it('should handle complex multi-account scenario with transfers', () => {
    const bank = new Bank();
    const masterControl = new MasterControl(bank);

    const commands = [
      'create checking 11111111 1.0',
      'create savings 22222222 2.0',
      'create cd 33333333 3.0 5000',
      'deposit 11111111 1000',
      'deposit 22222222 2000',
      'transfer 11111111 22222222 300',
      'withdraw 22222222 500'
    ];

    const output = masterControl.start(commands);

    // Parse output
    const accountOutputs: Map<string, string[]> = new Map();
    let currentAccountId: string | null = null;

    output.forEach(line => {
      if (line.match(/^(Checking|Savings|Cd)\s+\d{8}/)) {
        const parts = line.split(' ');
        currentAccountId = parts[1];
        accountOutputs.set(currentAccountId, []);
      } else if (currentAccountId && line.match(/^(create|deposit|withdraw|transfer|pass)/)) {
        accountOutputs.get(currentAccountId)?.push(line);
      }
    });

    // Verify checking transactions
    const checkingTx = accountOutputs.get('11111111') || [];
    expect(checkingTx).toContain('deposit 11111111 1000');
    expect(checkingTx).toContain('transfer 11111111 22222222 300');

    // Verify savings transactions (receives transfer and has withdrawal)
    const savingsTx = accountOutputs.get('22222222') || [];
    expect(savingsTx).toContain('deposit 22222222 2000');
    expect(savingsTx).toContain('transfer 11111111 22222222 300');
    expect(savingsTx).toContain('withdraw 22222222 500');

    // Verify CD has only create transaction
    const cdTx = accountOutputs.get('33333333') || [];
    expect(cdTx).toHaveLength(0); // CD created with initial balance, no transactions
  });

  it('should handle account removal and maintain histories for remaining accounts', () => {
    const bank = new Bank();
    const masterControl = new MasterControl(bank);

    const commands = [
      'create checking 11111111 1.0',
      'create savings 22222222 2.0',
      'deposit 11111111 20',
      'deposit 22222222 1000',
      'pass 1' // Checking will be removed (20 - 25 fee = 0)
    ];

    const output = masterControl.start(commands);

    // Checking account should be removed
    expect(bank.getAccount('11111111')).toBeUndefined();

    // Savings account should still exist
    expect(bank.getAccount('22222222')).toBeDefined();

    // Parse output
    const accountOutputs: Map<string, string[]> = new Map();
    let currentAccountId: string | null = null;

    output.forEach(line => {
      if (line.match(/^(Checking|Savings|Cd)\s+\d{8}/)) {
        const parts = line.split(' ');
        currentAccountId = parts[1];
        accountOutputs.set(currentAccountId, []);
      } else if (currentAccountId && line.match(/^(create|deposit|withdraw|transfer|pass)/)) {
        accountOutputs.get(currentAccountId)?.push(line);
      }
    });

    // Only savings should be in output
    expect(accountOutputs.has('11111111')).toBe(false);
    expect(accountOutputs.has('22222222')).toBe(true);

    const savingsTx = accountOutputs.get('22222222') || [];
    expect(savingsTx).toContain('deposit 22222222 1000');
  });

  it('should correctly group transactions after time passage', () => {
    const bank = new Bank();
    const masterControl = new MasterControl(bank);

    const commands = [
      'create checking 11111111 1.0',
      'deposit 11111111 1000',
      'withdraw 11111111 200',
      'pass 6',
      'deposit 11111111 500'
    ];

    const output = masterControl.start(commands);

    // Parse output
    const accountOutputs: Map<string, string[]> = new Map();
    let currentAccountId: string | null = null;

    output.forEach(line => {
      if (line.match(/^(Checking|Savings|Cd)\s+\d{8}/)) {
        const parts = line.split(' ');
        currentAccountId = parts[1];
        accountOutputs.set(currentAccountId, []);
      } else if (currentAccountId && line.match(/^(create|deposit|withdraw|transfer|pass)/)) {
        accountOutputs.get(currentAccountId)?.push(line);
      }
    });

    const transactions = accountOutputs.get('11111111') || [];

    // Should have account-specific transactions (pass is not logged per account)
    expect(transactions).toContain('deposit 11111111 1000');
    expect(transactions).toContain('withdraw 11111111 200');
    expect(transactions).toContain('deposit 11111111 500');
    expect(transactions).toHaveLength(3);
  });

  it('should maintain correct balances after multiple operations per account', () => {
    const bank = new Bank();
    const masterControl = new MasterControl(bank);

    const commands = [
      'create checking 11111111 1.5',
      'create savings 22222222 2.0',
      'deposit 11111111 1000',
      'deposit 11111111 500',
      'deposit 22222222 2000',
      'withdraw 11111111 300',
      'transfer 22222222 11111111 400'
    ];

    masterControl.start(commands);

    // Verify balances
    const checking = bank.getAccount('11111111');
    const savings = bank.getAccount('22222222');

    expect(checking?.getBalance()).toBe(1600); // 1000 + 500 - 300 + 400
    expect(savings?.getBalance()).toBe(1600);  // 2000 - 400
  });
});
