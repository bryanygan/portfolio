import React from 'react';
import { HiLightningBolt } from 'react-icons/hi';
import { BsDatabase } from 'react-icons/bs';
import { FaIndustry } from 'react-icons/fa';
import { GiTargetShot } from 'react-icons/gi';
import { AiOutlineFileText } from 'react-icons/ai';

export function DesignPatternsSection() {
  const patterns = [
    {
      name: 'Command Pattern',
      icon: <HiLightningBolt className="w-12 h-12" />,
      description: 'Encapsulates each banking operation (create, deposit, withdraw, transfer, pass) as a separate command object with validation and execution logic.',
      problem: 'Need to support multiple operations with different validation rules and execution logic',
      solution: 'Separate validators and processors for each command type',
      example: `// CommandValidation coordinates validators
class CommandValidation {
  validateCommand(command: string): boolean {
    const type = this.getType(command);
    switch (type) {
      case 'create':
        return this.createValidator.validate(command);
      case 'deposit':
        return this.depositValidator.validate(command);
      // ... other commands
    }
  }
}

// Each command has its own validator
class DepositCommandValidator {
  validate(command: string): boolean {
    return this.checkFormat(command) &&
           this.checkLimits(command) &&
           this.checkAccountExists(command);
  }
}`,
      benefits: ['Easy to add new commands', 'Single responsibility per validator', 'Testable in isolation']
    },
    {
      name: 'Repository Pattern',
      icon: <BsDatabase className="w-12 h-12" />,
      description: 'Bank class acts as a repository, abstracting account storage and providing a clean interface for account management operations.',
      problem: 'Need centralized account storage with efficient lookups and lifecycle management',
      solution: 'Bank repository with Map-based storage for O(1) access',
      example: `class Bank {
  private accounts: Map<string, Account>;

  addAccount(account: Account): void {
    this.accounts.set(account.getAccountID(), account);
  }

  getAccount(id: string): Account | undefined {
    return this.accounts.get(id);
  }

  getAllAccounts(): Map<string, Account> {
    return this.accounts;
  }

  removeAccount(id: string): void {
    this.accounts.delete(id);
  }
}`,
      benefits: ['Centralized data access', 'Consistent interface', 'Easy to swap storage implementation']
    },
    {
      name: 'Factory Method (Implicit)',
      icon: <FaIndustry className="w-12 h-12" />,
      description: 'Account creation is handled through processors that instantiate the correct account subclass based on the command type parameter.',
      problem: 'Need to create different account types (Checking, Savings, CD) based on runtime input',
      solution: 'Processor determines type and creates appropriate instance',
      example: `class CreateCommandProcessor {
  execute(command: string): void {
    const [_, type, id, apr, balance] = command.split(' ');

    let account: Account;
    switch (type.toLowerCase()) {
      case 'checking':
        account = new Checking(id, parseFloat(apr));
        break;
      case 'savings':
        account = new Savings(id, parseFloat(apr));
        break;
      case 'cd':
        account = new CertificateOfDeposit(
          id,
          parseFloat(apr),
          parseFloat(balance)
        );
        break;
    }

    this.bank.addAccount(account);
  }
}`,
      benefits: ['Decouples creation from usage', 'Type-safe instantiation', 'Easy to add new account types']
    },
    {
      name: 'Strategy Pattern',
      icon: <GiTargetShot className="w-12 h-12" />,
      description: 'Different validation strategies for each command type, allowing runtime selection of the appropriate validation algorithm.',
      problem: 'Each command type has unique validation rules that differ significantly',
      solution: 'Separate validator classes implementing command-specific validation logic',
      example: `// Different strategies for different commands
class WithdrawCommandValidator {
  validate(command: string, bank: Bank): boolean {
    // Strategy 1: Check withdrawal limits
    if (account.type === 'Savings') {
      return amount <= 1000; // Savings limit
    }
    return true; // Checking has no limit
  }
}

class TransferCommandValidator {
  validate(command: string, bank: Bank): boolean {
    // Strategy 2: Check both accounts
    return fromAccount.exists() &&
           toAccount.exists() &&
           fromAccount.id !== toAccount.id;
  }
}`,
      benefits: ['Flexible validation rules', 'Easy to modify strategies', 'Clear separation of concerns']
    },
    {
      name: 'Template Method (Implicit)',
      icon: <AiOutlineFileText className="w-12 h-12" />,
      description: 'Account base class defines the skeleton of time passage operations, with subclasses overriding specific steps like APR compounding.',
      problem: 'All accounts accrue APR but CD accounts need quarterly compounding',
      solution: 'Base class provides template, subclasses override specific methods',
      example: `abstract class Account {
  // Template method - same for all accounts
  accrueMonthlyApr(): void {
    if (this.balance > 0) {
      const monthlyRate = (this.APR / 100) / 12;
      this.balance += this.balance * monthlyRate;
    }
  }
}

class CertificateOfDeposit extends Account {
  // Override to compound quarterly
  accrueMonthlyApr(): void {
    if (this.balance > 0) {
      const monthlyRate = (this.APR / 100) / 12;
      // Compound 4 times (quarterly)
      for (let i = 0; i < 4; i++) {
        this.balance += this.balance * (monthlyRate / 4);
      }
    }
  }
}`,
      benefits: ['Code reuse with customization', 'Consistent algorithm structure', 'Polymorphic behavior']
    }
  ];

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl p-8 shadow-lg">
      <div className="mb-8">
        <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-3">Design Patterns</h2>
        <p className="text-gray-600 dark:text-gray-400 text-lg">
          Industry-standard software design patterns applied to real-world banking operations
        </p>
      </div>

      <div className="space-y-8">
        {patterns.map((pattern, i) => (
          <div
            key={i}
            className="bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900/50 dark:to-gray-800/50 border border-gray-200 dark:border-gray-700 rounded-xl p-6"
          >
            {/* Header */}
            <div className="flex items-start gap-4 mb-4">
              <div className="text-gray-700 dark:text-gray-300 mt-1">{pattern.icon}</div>
              <div className="flex-1">
                <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                  {pattern.name}
                </h3>
                <p className="text-gray-700 dark:text-gray-300 leading-relaxed">
                  {pattern.description}
                </p>
              </div>
            </div>

            {/* Problem & Solution */}
            <div className="grid md:grid-cols-2 gap-4 mb-4">
              <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
                <div className="flex items-center gap-2 mb-2">
                  <svg className="w-4 h-4 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                  </svg>
                  <span className="font-semibold text-sm text-gray-900 dark:text-white">Problem</span>
                </div>
                <p className="text-sm text-gray-700 dark:text-gray-300">{pattern.problem}</p>
              </div>

              <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-4">
                <div className="flex items-center gap-2 mb-2">
                  <svg className="w-4 h-4 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <span className="font-semibold text-sm text-gray-900 dark:text-white">Solution</span>
                </div>
                <p className="text-sm text-gray-700 dark:text-gray-300">{pattern.solution}</p>
              </div>
            </div>

            {/* Code Example */}
            <div className="mb-4">
              <div className="flex items-center gap-2 mb-2">
                <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
                </svg>
                <span className="text-sm font-semibold text-gray-600 dark:text-gray-400">Implementation</span>
              </div>
              <pre className="bg-gray-900 dark:bg-gray-950 p-4 rounded-lg overflow-x-auto">
                <code className="text-sm text-emerald-400 font-mono">{pattern.example}</code>
              </pre>
            </div>

            {/* Benefits */}
            <div>
              <div className="flex items-center gap-2 mb-2">
                <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
                <span className="text-sm font-semibold text-gray-600 dark:text-gray-400">Benefits</span>
              </div>
              <div className="flex flex-wrap gap-2">
                {pattern.benefits.map((benefit, j) => (
                  <span
                    key={j}
                    className="px-3 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300 rounded-full text-xs font-medium"
                  >
                    {benefit}
                  </span>
                ))}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
