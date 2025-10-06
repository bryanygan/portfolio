import { describe, it, expect, beforeEach } from 'vitest';
import { Bank } from '@/lib/banking/core/Bank';
import { Checking } from '@/lib/banking/core/Checking';
import { Savings } from '@/lib/banking/core/Savings';
import { CertificateOfDeposit } from '@/lib/banking/core/CertificateOfDeposit';

describe('Bank', () => {
  let bank: Bank;

  beforeEach(() => {
    bank = new Bank();
  });

  describe('Account Management', () => {
    it('adds account successfully', () => {
      const checking = new Checking('12345678', 1.0);
      bank.addAccount(checking);
      expect(bank.getNumberOfAccounts()).toBe(1);
      expect(bank.getAccount('12345678')).toBe(checking);
    });

    it('throws error when adding duplicate account ID', () => {
      const checking1 = new Checking('12345678', 1.0);
      const checking2 = new Checking('12345678', 2.0);
      bank.addAccount(checking1);
      expect(() => bank.addAccount(checking2)).toThrow('Account with ID 12345678 already exists');
    });

    it('returns undefined for non-existent account', () => {
      expect(bank.getAccount('99999999')).toBeUndefined();
    });

    it('removes account successfully', () => {
      const checking = new Checking('12345678', 1.0);
      bank.addAccount(checking);
      bank.removeAccount('12345678');
      expect(bank.getNumberOfAccounts()).toBe(0);
      expect(bank.getAccount('12345678')).toBeUndefined();
    });

    it('adds multiple accounts', () => {
      bank.addAccount(new Checking('11111111', 1.0));
      bank.addAccount(new Savings('22222222', 2.5));
      bank.addAccount(new CertificateOfDeposit('33333333', 4.5, 5000));
      expect(bank.getNumberOfAccounts()).toBe(3);
    });

    it('gets all accounts', () => {
      bank.addAccount(new Checking('11111111', 1.0));
      bank.addAccount(new Savings('22222222', 2.5));
      const accounts = bank.getAllAccounts();
      expect(accounts.size).toBe(2);
      expect(accounts.has('11111111')).toBe(true);
      expect(accounts.has('22222222')).toBe(true);
    });
  });

  describe('Deposit and Withdraw by ID', () => {
    beforeEach(() => {
      bank.addAccount(new Checking('12345678', 1.0));
    });

    it('deposits money by account ID', () => {
      bank.depositByID('12345678', 1000);
      const account = bank.getAccount('12345678');
      expect(account?.getBalance()).toBe(1000);
    });

    it('withdraws money by account ID', () => {
      bank.depositByID('12345678', 1000);
      bank.withdrawByID('12345678', 300);
      const account = bank.getAccount('12345678');
      expect(account?.getBalance()).toBe(700);
    });

    it('handles deposit to non-existent account gracefully', () => {
      expect(() => bank.depositByID('99999999', 100)).not.toThrow();
    });

    it('handles withdraw from non-existent account gracefully', () => {
      expect(() => bank.withdrawByID('99999999', 100)).not.toThrow();
    });
  });

  describe('Time Passage', () => {
    it('removes zero balance accounts after pass time', () => {
      const checking = new Checking('12345678', 1.0);
      bank.addAccount(checking);
      // Account starts with 0 balance
      bank.processPassTime(1);
      expect(bank.getNumberOfAccounts()).toBe(0);
    });

    it('applies minimum balance fee and APR', () => {
      const checking = new Checking('12345678', 1.0);
      bank.addAccount(checking);
      checking.deposit(50);
      bank.processPassTime(1);
      const account = bank.getAccount('12345678');
      // 50 - 25 fee = 25, then 25 * (1 + 0.01/12) = 25.020833...
      expect(account?.getBalance()).toBeCloseTo(25.02, 2);
    });

    it('accrues APR for all accounts', () => {
      const checking = new Checking('11111111', 12.0);
      const savings = new Savings('22222222', 12.0);
      checking.deposit(1000);
      savings.deposit(1000);
      bank.addAccount(checking);
      bank.addAccount(savings);

      bank.processPassTime(1);

      // Both should accrue 1% monthly APR
      expect(checking.getBalance()).toBeCloseTo(1010, 2);
      expect(savings.getBalance()).toBeCloseTo(1010, 2);
    });

    it('increments CD months during pass time', () => {
      const cd = new CertificateOfDeposit('12345678', 4.5, 5000);
      bank.addAccount(cd);
      expect(cd.getMonthsSinceCreation()).toBe(0);

      bank.processPassTime(6);
      expect(cd.getMonthsSinceCreation()).toBe(6);

      bank.processPassTime(6);
      expect(cd.getMonthsSinceCreation()).toBe(12);
    });

    it('processes multiple months correctly', () => {
      const checking = new Checking('12345678', 12.0);
      checking.deposit(1000);
      bank.addAccount(checking);

      bank.processPassTime(12);

      // 12 months at 1% per month (compounded)
      // 1000 * (1.01)^12 = ~1126.83
      expect(checking.getBalance()).toBeGreaterThan(1126);
      expect(checking.getBalance()).toBeLessThan(1127);
    });

    it('removes account that falls to zero due to fees', () => {
      const checking = new Checking('12345678', 1.0);
      checking.deposit(20);
      bank.addAccount(checking);

      bank.processPassTime(1);
      // 20 - 25 fee = 0 (clamped), should be removed
      expect(bank.getNumberOfAccounts()).toBe(0);
    });

    it('keeps account with balance >= 100 without fee', () => {
      const checking = new Checking('12345678', 1.0);
      checking.deposit(100);
      bank.addAccount(checking);

      bank.processPassTime(1);
      // No fee applied, plus APR
      expect(checking.getBalance()).toBeGreaterThan(100);
      expect(bank.getNumberOfAccounts()).toBe(1);
    });
  });

  describe('Complex Scenarios', () => {
    it('handles mixed account types during pass time', () => {
      const checking = new Checking('11111111', 1.0);
      const savings = new Savings('22222222', 2.5);
      const cd = new CertificateOfDeposit('33333333', 4.5, 5000);

      checking.deposit(1000);
      savings.deposit(1000);

      bank.addAccount(checking);
      bank.addAccount(savings);
      bank.addAccount(cd);

      expect(bank.getNumberOfAccounts()).toBe(3);

      bank.processPassTime(1);

      // All accounts should still exist
      expect(bank.getNumberOfAccounts()).toBe(3);

      // CD should have incremented months
      expect(cd.getMonthsSinceCreation()).toBe(1);

      // All should have accrued APR
      expect(checking.getBalance()).toBeGreaterThan(1000);
      expect(savings.getBalance()).toBeGreaterThan(1000);
      expect(cd.getBalance()).toBeGreaterThan(5000);
    });

    it('clears all accounts', () => {
      bank.addAccount(new Checking('11111111', 1.0));
      bank.addAccount(new Savings('22222222', 2.5));
      expect(bank.getNumberOfAccounts()).toBe(2);

      bank.clear();
      expect(bank.getNumberOfAccounts()).toBe(0);
    });
  });
});
