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
  updateCounter: number; // Forces re-render when bank state changes
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
      updateCounter: 0
    };
  });

  // Get all accounts as an array
  // Use updateCounter to ensure we re-compute when bank state changes
  const accounts = useMemo(() => {
    return Array.from(state.bank.getAllAccounts().values());
  }, [state.bank, state.updateCounter]);

  // Execute a single command
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
          updateCounter: prev.updateCounter + 1
        };
      } catch (error) {
        console.error('Error executing command:', error);
        return {
          ...prev,
          isProcessing: false
        };
      }
    });
  }, []);

  // Execute multiple commands (for scenarios)
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
          updateCounter: prev.updateCounter + 1
        };
      } catch (error) {
        console.error('Error executing batch:', error);
        return {
          ...prev,
          isProcessing: false
        };
      }
    });
  }, []);

  // Reset the entire banking system
  const reset = useCallback(() => {
    const newBank = new Bank();
    setState({
      bank: newBank,
      masterControl: new MasterControl(newBank),
      commandHistory: [],
      output: [],
      isProcessing: false,
      updateCounter: 0
    });
  }, []);

  // Get account by ID
  const getAccount = useCallback((accountId: string): Account | undefined => {
    return state.bank.getAccount(accountId);
  }, [state.bank]);

  // Get invalid commands from last execution
  const getInvalidCommands = useCallback((): string[] => {
    return state.masterControl.getInvalidCommands();
  }, [state.masterControl]);

  // Parse output to separate account states and transactions
  const parsedOutput = useMemo(() => {
    const accountOutputs: Map<string, {
      state: string;
      transactions: string[];
    }> = new Map();

    const invalidCommands: string[] = [];
    let currentAccountId: string | null = null;

    state.output.forEach(line => {
      // Check if it's an account state line (starts with account type)
      if (line.match(/^(Checking|Savings|Cd)\s+\d{8}/)) {
        const parts = line.split(' ');
        currentAccountId = parts[1];
        accountOutputs.set(currentAccountId, {
          state: line,
          transactions: []
        });
      }
      // Check if it's a transaction line (command)
      else if (currentAccountId && line.match(/^(create|deposit|withdraw|transfer|pass)/)) {
        const accountOutput = accountOutputs.get(currentAccountId);
        if (accountOutput) {
          accountOutput.transactions.push(line);
        }
      }
      // Otherwise it's an invalid command
      else if (line.trim()) {
        invalidCommands.push(line);
      }
    });

    return {
      accountOutputs,
      invalidCommands
    };
  }, [state.output]);

  return {
    // State
    bank: state.bank,
    commandHistory: state.commandHistory,
    output: state.output,
    isProcessing: state.isProcessing,
    accounts,
    parsedOutput,

    // Actions
    executeCommand,
    executeBatch,
    reset,
    getAccount,
    getInvalidCommands
  };
}
