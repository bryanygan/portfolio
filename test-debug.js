import { MasterControl } from './lib/banking/core/MasterControl.js';
import { Bank } from './lib/banking/core/Bank.js';

const bank = new Bank();
const mc = new MasterControl(bank);
const output = mc.start(['create savings 12345678 12.0', 'deposit 12345678 1000', 'pass 1']);
console.log('Output:', output);
