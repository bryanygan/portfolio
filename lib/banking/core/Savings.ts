import { Account } from './Account';
import { AccountType } from '../types';

export class Savings extends Account {
  constructor(accountID: string, APR: number) {
    super(accountID, APR);
    this.type = AccountType.Savings;
  }
}
