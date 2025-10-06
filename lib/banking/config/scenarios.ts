export interface Scenario {
  id: string;
  title: string;
  description: string;
  commands: string[];
  expectedOutcome: string;
}

export const EXAMPLE_SCENARIOS: Scenario[] = [
  {
    id: 'basic-operations',
    title: 'Basic Banking Operations',
    description: 'Create accounts, deposit money, and transfer between accounts',
    commands: [
      'create checking 12345678 1.0',
      'deposit 12345678 1000',
      'create savings 87654321 2.5',
      'transfer 12345678 87654321 500'
    ],
    expectedOutcome: 'Checking account has $500, Savings account has $500'
  },
  {
    id: 'apr-accrual',
    title: 'APR Interest Accrual',
    description: 'See how interest compounds monthly on savings',
    commands: [
      'create savings 11111111 6.0',
      'deposit 11111111 1000',
      'pass 12'
    ],
    expectedOutcome: 'After 12 months, balance grows to ~$1061.68 with 6% APR'
  },
  {
    id: 'cd-account',
    title: 'Certificate of Deposit',
    description: 'CD account with high APR and withdrawal restrictions',
    commands: [
      'create cd 22222222 4.5 5000',
      'pass 12',
      'withdraw 22222222 1000'
    ],
    expectedOutcome: 'CD grows with quarterly compounding, can withdraw after 12 months'
  },
  {
    id: 'minimum-balance-fee',
    title: 'Minimum Balance Fees',
    description: 'Accounts under $100 are charged $25 monthly fee',
    commands: [
      'create checking 33333333 1.0',
      'deposit 33333333 75',
      'pass 1'
    ],
    expectedOutcome: '$75 - $25 fee = $50, then APR applied'
  },
  {
    id: 'account-closure',
    title: 'Zero Balance Account Closure',
    description: 'Accounts with $0 are automatically closed',
    commands: [
      'create checking 44444444 1.0',
      'deposit 44444444 20',
      'pass 1'
    ],
    expectedOutcome: 'Account closed due to $0 balance after fee'
  },
  {
    id: 'complex-scenario',
    title: 'Complete Banking Flow',
    description: 'Multiple accounts with deposits, transfers, and time passage',
    commands: [
      'create checking 10000001 1.0',
      'create savings 10000002 3.5',
      'deposit 10000001 2000',
      'deposit 10000002 1500',
      'transfer 10000001 10000002 400',
      'withdraw 10000002 200',
      'pass 3'
    ],
    expectedOutcome: 'Complex multi-account scenario with full transaction history'
  }
];

export const COMMAND_TEMPLATES = [
  {
    command: 'create',
    templates: [
      'create checking [8-digit-id] [apr]',
      'create savings [8-digit-id] [apr]',
      'create cd [8-digit-id] [apr] [balance]'
    ],
    examples: [
      'create checking 12345678 1.0',
      'create savings 87654321 2.5',
      'create cd 11111111 4.5 5000'
    ]
  },
  {
    command: 'deposit',
    templates: ['deposit [account-id] [amount]'],
    examples: ['deposit 12345678 500', 'deposit 87654321 1000']
  },
  {
    command: 'withdraw',
    templates: ['withdraw [account-id] [amount]'],
    examples: ['withdraw 12345678 300', 'withdraw 87654321 500']
  },
  {
    command: 'transfer',
    templates: ['transfer [from-id] [to-id] [amount]'],
    examples: ['transfer 12345678 87654321 200']
  },
  {
    command: 'pass',
    templates: ['pass [months]'],
    examples: ['pass 1', 'pass 12', 'pass 60']
  }
];

export const ACCOUNT_TYPE_INFO = {
  checking: {
    name: 'Checking Account',
    icon: '💳',
    color: 'blue',
    depositLimit: 1000,
    withdrawLimit: null,
    transferInLimit: 400,
    transferOutLimit: null,
    description: 'Standard checking account with flexible access'
  },
  savings: {
    name: 'Savings Account',
    icon: '💰',
    color: 'green',
    depositLimit: 2500,
    withdrawLimit: 1000,
    transferInLimit: 2500,
    transferOutLimit: 1000,
    description: 'Higher APR with withdrawal limits'
  },
  cd: {
    name: 'Certificate of Deposit',
    icon: '🔒',
    color: 'purple',
    depositLimit: 0, // Cannot deposit to CD
    withdrawLimit: null,
    transferInLimit: 0, // Cannot transfer to CD
    transferOutLimit: 0, // Cannot transfer from CD
    minBalance: 1000,
    maxBalance: 10000,
    withdrawalLockMonths: 12,
    description: 'Locked deposit with highest APR, quarterly compounding'
  }
};
