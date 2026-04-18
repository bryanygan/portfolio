import { useState, useCallback, useMemo } from 'react';
import { Bank } from '../../lib/banking/core/Bank';
import { MasterControl } from '../../lib/banking/core/MasterControl';
import { Account } from '../../lib/banking/core/Account';

export interface BankingSystemState {
  bank: Bank;
  masterControl: MasterControl;
  commandHistory: string[];
  output: string[];
  isProcessing: boolean;
  error: string | null;
  // Monotonic tick bumped on every successful mutation. Consumers depend on
  // this instead of output-as-a-proxy so derived state refreshes reliably.
  version: number;
}

export function useBankingSystem() {
  const [state, setState] = useState<BankingSystemState>(() => {
    const bank = new Bank();
    return {
      bank,
      masterControl: new MasterControl(bank),
      commandHistory: [],
      output: [],
      isProcessing: false,
      error: null,
      version: 0
    };
  });

  const accounts = useMemo(() => {
    return Array.from(state.bank.getAllAccounts().values());
    // `version` changes on every mutation of the (mutable) bank; use it as
    // the invalidation key instead of `state.output`.
  }, [state.bank, state.version]);

  const executeCommand = useCallback((command: string) => {
    if (!command.trim()) return;

    setState(prev => {
      try {
        const newOutput = prev.masterControl.start([command]);
        return {
          ...prev,
          commandHistory: [...prev.commandHistory, command],
          output: newOutput,
          isProcessing: false,
          error: null,
          version: prev.version + 1
        };
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
        console.error('Error executing command:', error);
        return {
          ...prev,
          isProcessing: false,
          error: errorMessage
        };
      }
    });
  }, []);

  const executeBatch = useCallback((commands: string[]) => {
    if (commands.length === 0) return;

    setState(prev => {
      try {
        const newOutput = prev.masterControl.start(commands);
        return {
          ...prev,
          commandHistory: [...prev.commandHistory, ...commands],
          output: newOutput,
          isProcessing: false,
          error: null,
          version: prev.version + 1
        };
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred executing batch';
        console.error('Error executing batch:', error);
        return {
          ...prev,
          isProcessing: false,
          error: errorMessage
        };
      }
    });
  }, []);

  const reset = useCallback(() => {
    const newBank = new Bank();
    setState(prev => ({
      bank: newBank,
      masterControl: new MasterControl(newBank),
      commandHistory: [],
      output: [],
      isProcessing: false,
      error: null,
      version: prev.version + 1
    }));
  }, []);

  const getAccount = useCallback((accountId: string): Account | undefined => {
    return state.bank.getAccount(accountId);
  }, [state.bank]);

  const getInvalidCommands = useCallback((): string[] => {
    return state.masterControl.getInvalidCommands();
  }, [state.masterControl]);

  const parsedOutput = useMemo(() => {
    const accountOutputs: Map<string, {
      state: string;
      transactions: string[];
    }> = new Map();

    const invalidCommands: string[] = [];
    let currentAccountId: string | null = null;

    const accountStateRegex = /^(Checking|Savings|Cd)\s+\d{8}/;
    const transactionRegex = /^(create|deposit|withdraw|transfer|pass)/;

    state.output.forEach(line => {
      if (accountStateRegex.test(line)) {
        const parts = line.split(' ');
        currentAccountId = parts[1];
        accountOutputs.set(currentAccountId, {
          state: line,
          transactions: []
        });
      } else if (currentAccountId && transactionRegex.test(line)) {
        const accountOutput = accountOutputs.get(currentAccountId);
        if (accountOutput) {
          accountOutput.transactions.push(line);
        }
      } else if (line.trim()) {
        invalidCommands.push(line);
      }
    });

    return {
      accountOutputs,
      invalidCommands
    };
  }, [state.output]);

  return {
    bank: state.bank,
    commandHistory: state.commandHistory,
    output: state.output,
    isProcessing: state.isProcessing,
    error: state.error,
    version: state.version,
    accounts,
    parsedOutput,
    executeCommand,
    executeBatch,
    reset,
    getAccount,
    getInvalidCommands
  };
}
