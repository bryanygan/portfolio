// Banking System Type Definitions

export enum AccountType {
  Checking = 'Checking',
  Savings = 'Savings',
  Cd = 'Cd'
}

export interface AccountData {
  accountID: string;
  balance: number;
  APR: number;
  type: AccountType;
}

export interface Command {
  raw: string;
  type: 'create' | 'deposit' | 'withdraw' | 'transfer' | 'pass';
  params: string[];
}

export interface BankingState {
  accounts: Map<string, any>; // Will be Account type once imported
  transactions: Map<string, string[]>;
  invalidCommands: string[];
}

export interface OutputLine {
  type: 'account' | 'transaction' | 'invalid';
  content: string;
}

export interface TransferCommand {
  fromId: string;
  toId: string;
  amount: number;
  raw: string;
}
