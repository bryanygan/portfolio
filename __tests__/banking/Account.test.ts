import { describe, it, expect, beforeEach } from 'vitest';
import { Checking } from '@/lib/banking/core/Checking';
import { Savings } from '@/lib/banking/core/Savings';
import { CertificateOfDeposit } from '@/lib/banking/core/CertificateOfDeposit';
import { AccountType } from '@/lib/banking/types';

describe('Account Classes', () => {
  describe('Checking Account', () => {
    let checking: Checking;

    beforeEach(() => {
      checking = new Checking('12345678', 1.0);
    });

    it('creates checking account with correct initial values', () => {
      expect(checking.getAccountID()).toBe('12345678');
      expect(checking.getBalance()).toBe(0);
      expect(checking.getAPR()).toBe(1.0);
      expect(checking.getType()).toBe(AccountType.Checking);
    });

    it('deposits money successfully', () => {
      const result = checking.deposit(500);
      expect(result).toBe(true);
      expect(checking.getBalance()).toBe(500);
    });

    it('rejects negative deposit', () => {
      const result = checking.deposit(-100);
      expect(result).toBe(false);
      expect(checking.getBalance()).toBe(0);
    });

    it('withdraws money successfully', () => {
      checking.deposit(1000);
      const withdrawn = checking.withdraw(300);
      expect(withdrawn).toBe(300);
      expect(checking.getBalance()).toBe(700);
    });

    it('withdraws all available balance if amount exceeds balance', () => {
      checking.deposit(100);
      const withdrawn = checking.withdraw(200);
      expect(withdrawn).toBe(100);
      expect(checking.getBalance()).toBe(0);
    });

    it('throws error on negative withdrawal', () => {
      expect(() => checking.withdraw(-50)).toThrow('Negative amount not allowed');
    });

    it('accrues APR correctly', () => {
      checking.deposit(1000);
      checking.accrueMonthlyApr();
      // 1000 * (1 + 0.01/12) = 1000.833...
      expect(checking.getBalance()).toBeCloseTo(1000.833, 2);
    });

    it('deducts minimum balance fee when balance < 100', () => {
      checking.deposit(50);
      checking.deductMinimumBalanceFee();
      expect(checking.getBalance()).toBe(25);
    });

    it('does not deduct fee when balance >= 100', () => {
      checking.deposit(100);
      checking.deductMinimumBalanceFee();
      expect(checking.getBalance()).toBe(100);
    });

    it('identifies zero balance correctly', () => {
      expect(checking.isZeroBalance()).toBe(true);
      checking.deposit(100);
      expect(checking.isZeroBalance()).toBe(false);
    });

    it('formats toString correctly', () => {
      checking.deposit(500.5);
      expect(checking.toString()).toBe('Checking 12345678 500.50 1.00');
    });
  });

  describe('Savings Account', () => {
    let savings: Savings;

    beforeEach(() => {
      savings = new Savings('87654321', 2.5);
    });

    it('creates savings account with correct type', () => {
      expect(savings.getType()).toBe(AccountType.Savings);
      expect(savings.getAPR()).toBe(2.5);
    });

    it('accrues APR correctly with higher rate', () => {
      savings.deposit(1000);
      savings.accrueMonthlyApr();
      // 1000 * (1 + 0.025/12) = 1002.083...
      expect(savings.getBalance()).toBeCloseTo(1002.083, 2);
    });
  });

  describe('Certificate of Deposit', () => {
    let cd: CertificateOfDeposit;

    beforeEach(() => {
      cd = new CertificateOfDeposit('11111111', 4.5, 5000);
    });

    it('creates CD with initial balance', () => {
      expect(cd.getAccountID()).toBe('11111111');
      expect(cd.getBalance()).toBe(5000);
      expect(cd.getAPR()).toBe(4.5);
      expect(cd.getType()).toBe(AccountType.Cd);
    });

    it('starts with 0 months since creation', () => {
      expect(cd.getMonthsSinceCreation()).toBe(0);
    });

    it('cannot withdraw before 12 months', () => {
      expect(cd.canWithdraw()).toBe(false);
    });

    it('can withdraw after 12 months', () => {
      for (let i = 0; i < 12; i++) {
        cd.incrementMonths();
      }
      expect(cd.canWithdraw()).toBe(true);
    });

    it('increments months correctly', () => {
      cd.incrementMonths();
      expect(cd.getMonthsSinceCreation()).toBe(1);
      cd.incrementMonths();
      expect(cd.getMonthsSinceCreation()).toBe(2);
    });

    it('accrues APR 4 times per month', () => {
      const initialBalance = cd.getBalance();
      cd.accrueMonthlyApr();
      // CD compounds quarterly within the month
      // 5000 * (1 + (0.045/12)/4)^4
      const monthlyRate = (4.5 / 100) / 12;
      const expectedBalance = 5000 * Math.pow(1 + monthlyRate / 4, 4);
      expect(cd.getBalance()).toBeCloseTo(expectedBalance, 2);
      expect(cd.getBalance()).toBeGreaterThan(initialBalance);
    });

    it('does not accrue APR if balance is 0', () => {
      cd.setBalance(0);
      cd.accrueMonthlyApr();
      expect(cd.getBalance()).toBe(0);
    });
  });

  describe('Account Edge Cases', () => {
    it('prevents negative balance through setBalance', () => {
      const checking = new Checking('12345678', 1.0);
      checking.setBalance(-100);
      expect(checking.getBalance()).toBe(0);
    });

    it('handles fee that would make balance negative', () => {
      const checking = new Checking('12345678', 1.0);
      checking.deposit(10);
      checking.deductMinimumBalanceFee();
      expect(checking.getBalance()).toBe(0); // 10 - 25 = -15, but clamped to 0
    });
  });
});
