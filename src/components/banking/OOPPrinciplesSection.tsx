import React from 'react';

export function OOPPrinciplesSection() {
  const principles = [
    {
      title: 'Encapsulation',
      icon: '🔒',
      color: 'blue',
      description: 'Account balance and internal state are private fields, accessed only through controlled public methods that enforce business rules and validation.',
      example: `class Account {
  protected balance: number;
  protected APR: number;

  deposit(amount: number): boolean {
    if (amount > 0) {
      this.balance += amount;
      return true;
    }
    return false;
  }

  getBalance(): number {
    return this.balance;
  }
}`,
      benefits: ['Prevents direct manipulation of sensitive data', 'Enforces validation rules', 'Hides implementation details']
    },
    {
      title: 'Inheritance',
      icon: '🌳',
      color: 'green',
      description: 'Checking, Savings, and CD accounts extend the base Account class, inheriting common functionality while adding type-specific behavior.',
      example: `abstract class Account {
  protected accountID: string;
  protected balance: number;

  accrueMonthlyApr(): void {
    const monthlyRate = (this.APR / 100) / 12;
    this.balance += this.balance * monthlyRate;
  }
}

class CertificateOfDeposit extends Account {
  // Override for quarterly compounding
  accrueMonthlyApr(): void {
    const monthlyRate = (this.APR / 100) / 12;
    for (let i = 0; i < 4; i++) {
      this.balance += this.balance * (monthlyRate / 4);
    }
  }
}`,
      benefits: ['Code reuse across account types', 'Consistent interface', 'Easy to add new account types']
    },
    {
      title: 'Polymorphism',
      icon: '🎭',
      color: 'purple',
      description: 'Bank stores accounts as the base Account type, allowing method calls to dynamically dispatch to the correct subclass implementation at runtime.',
      example: `class Bank {
  private accounts: Map<string, Account>;

  processPassTime(months: number): void {
    this.accounts.forEach(account => {
      // Calls the correct subclass method
      account.accrueMonthlyApr();
      account.deductMinimumBalanceFee();

      // CD compounding happens automatically!
    });
  }
}`,
      benefits: ['Write generic code that works with any account type', 'Runtime flexibility', 'Extensible design']
    },
    {
      title: 'Abstraction',
      icon: '🎨',
      color: 'orange',
      description: 'Complex command validation logic is abstracted into separate validator classes, each responsible for validating one command type.',
      example: `class CommandValidation {
  private validators: Map<string, Validator>;

  validateCommand(command: string): boolean {
    const type = this.getCommandType(command);
    const validator = this.validators.get(type);

    return validator?.validate(command) ?? false;
  }
}

class DepositCommandValidator {
  validate(command: string): boolean {
    // Complex validation logic hidden here
    return this.checkFormat(command) &&
           this.checkLimits(command) &&
           this.checkAccountExists(command);
  }
}`,
      benefits: ['Simplifies complex operations', 'Hides implementation details', 'Easier to maintain and test']
    }
  ];

  const getColorClasses = (color: string) => {
    const colors: Record<string, { bg: string, border: string, text: string }> = {
      blue: { bg: 'bg-blue-50 dark:bg-blue-900/20', border: 'border-blue-200 dark:border-blue-800', text: 'text-blue-600 dark:text-blue-400' },
      green: { bg: 'bg-green-50 dark:bg-green-900/20', border: 'border-green-200 dark:border-green-800', text: 'text-green-600 dark:text-green-400' },
      purple: { bg: 'bg-purple-50 dark:bg-purple-900/20', border: 'border-purple-200 dark:border-purple-800', text: 'text-purple-600 dark:text-purple-400' },
      orange: { bg: 'bg-orange-50 dark:bg-orange-900/20', border: 'border-orange-200 dark:border-orange-800', text: 'text-orange-600 dark:text-orange-400' }
    };
    return colors[color] || colors.blue;
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl p-8 shadow-lg">
      <div className="mb-8">
        <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-3">Object-Oriented Programming Principles</h2>
        <p className="text-gray-600 dark:text-gray-400 text-lg">
          This banking system demonstrates the four pillars of OOP through practical implementation
        </p>
      </div>

      <div className="space-y-8">
        {principles.map((principle, i) => {
          const colors = getColorClasses(principle.color);

          return (
            <div key={i} className={`${colors.bg} border ${colors.border} rounded-xl p-6`}>
              <div className="flex items-start gap-4 mb-4">
                <span className="text-4xl">{principle.icon}</span>
                <div className="flex-1">
                  <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                    {principle.title}
                  </h3>
                  <p className="text-gray-700 dark:text-gray-300 leading-relaxed">
                    {principle.description}
                  </p>
                </div>
              </div>

              {/* Code Example */}
              <div className="mb-4">
                <div className="flex items-center gap-2 mb-2">
                  <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
                  </svg>
                  <span className="text-sm font-semibold text-gray-600 dark:text-gray-400">Code Example</span>
                </div>
                <pre className="bg-gray-900 dark:bg-gray-950 p-4 rounded-lg overflow-x-auto">
                  <code className="text-sm text-emerald-400 font-mono">{principle.example}</code>
                </pre>
              </div>

              {/* Benefits */}
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <span className="text-sm font-semibold text-gray-600 dark:text-gray-400">Benefits</span>
                </div>
                <ul className="space-y-1">
                  {principle.benefits.map((benefit, j) => (
                    <li key={j} className="flex items-start gap-2 text-sm text-gray-700 dark:text-gray-300">
                      <span className={`mt-1 ${colors.text}`}>•</span>
                      <span>{benefit}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
