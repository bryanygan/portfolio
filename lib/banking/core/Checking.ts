import { Account } from './Account';
import { AccountType } from '../types';

export class Checking extends Account {
  constructor(accountID: string, APR: number) {
    super(accountID, APR);
    this.type = AccountType.Checking;
  }
}
