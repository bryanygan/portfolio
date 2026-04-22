// Banking System Type Definitions

export enum AccountType {
  Checking = 'Checking',
  Savings = 'Savings',
  Cd = 'Cd'
}

export interface TransferCommand {
  fromId: string;
  toId: string;
  amount: number;
  raw: string;
}
