import React, { useState } from 'react';
import { useBankingSystem } from '../../hooks/useBankingSystem';
import { TerminalInput } from './TerminalInput';
import { AccountCard } from './AccountCard';
import { TransactionHistory } from './TransactionHistory';
import { ExampleScenarios } from './ExampleScenarios';
import { OutputDisplay } from './OutputDisplay';

export function BankingSimulator() {
  const banking = useBankingSystem();
  const [selectedAccountId, setSelectedAccountId] = useState<string | null>(null);
  const [activeView, setActiveView] = useState<'accounts' | 'output'>('accounts');

  const selectedAccountTransactions = selectedAccountId
    ? banking.parsedOutput.accountOutputs.get(selectedAccountId)?.transactions || []
    : [];

  const handleReset = () => {
    if (confirm('Are you sure you want to reset the banking system? All accounts and history will be cleared.')) {
      banking.reset();
      setSelectedAccountId(null);
    }
  };

  return (
    <div className="w-full max-w-7xl mx-auto p-4 space-y-6">
      {/* Header with Controls */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-white dark:bg-gray-800 rounded-lg p-6 shadow-lg">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-1">
            Banking System Simulator
          </h2>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Interactive command-driven banking system
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={handleReset}
            disabled={banking.isProcessing}
            className="px-4 py-2 bg-red-500 hover:bg-red-600 text-white rounded-lg font-medium transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
            Reset
          </button>
          <div className="text-sm text-gray-600 dark:text-gray-400">
            {banking.accounts.length} account{banking.accounts.length !== 1 ? 's' : ''}
          </div>
        </div>
      </div>

      {/* Main Grid Layout */}
      <div className="grid lg:grid-cols-2 gap-6">
        {/* Left Column - Input & Scenarios */}
        <div className="space-y-6">
          <TerminalInput
            onExecute={banking.executeCommand}
            history={banking.commandHistory}
            disabled={banking.isProcessing}
          />

          <ExampleScenarios
            onLoadScenario={banking.executeBatch}
            disabled={banking.isProcessing}
          />
        </div>

        {/* Right Column - Accounts & Transactions */}
        <div className="space-y-6">
          {/* View Toggle */}
          <div className="flex gap-2 bg-gray-200 dark:bg-gray-700 p-1 rounded-lg">
            <button
              onClick={() => setActiveView('accounts')}
              className={`flex-1 py-2 px-4 rounded-md font-medium transition-colors duration-200 ${
                activeView === 'accounts'
                  ? 'bg-white dark:bg-gray-800 text-gray-900 dark:text-white shadow'
                  : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
              }`}
            >
              Accounts ({banking.accounts.length})
            </button>
            <button
              onClick={() => setActiveView('output')}
              className={`flex-1 py-2 px-4 rounded-md font-medium transition-colors duration-200 ${
                activeView === 'output'
                  ? 'bg-white dark:bg-gray-800 text-gray-900 dark:text-white shadow'
                  : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
              }`}
            >
              Output ({banking.output.length} lines)
            </button>
          </div>

          {/* Accounts View */}
          {activeView === 'accounts' && (
            <div className="space-y-4">
              {banking.accounts.length === 0 ? (
                <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-12 text-center">
                  <svg className="w-16 h-16 mx-auto mb-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
                  </svg>
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                    No Accounts Yet
                  </h3>
                  <p className="text-gray-600 dark:text-gray-400 mb-4">
                    Create your first account using the terminal or try an example scenario
                  </p>
                  <code className="text-sm bg-gray-900 text-emerald-400 px-3 py-1 rounded">
                    create checking 12345678 1.0
                  </code>
                </div>
              ) : (
                <>
                  <div className="grid gap-4">
                    {banking.accounts.map((account) => (
                      <AccountCard
                        key={account.getAccountID()}
                        account={account}
                        onClick={() => setSelectedAccountId(account.getAccountID())}
                        selected={selectedAccountId === account.getAccountID()}
                      />
                    ))}
                  </div>

                  {/* Transaction History for Selected Account */}
                  {selectedAccountId && (
                    <div className="mt-6">
                      <TransactionHistory
                        transactions={selectedAccountTransactions}
                        accountId={selectedAccountId}
                      />
                    </div>
                  )}
                </>
              )}
            </div>
          )}

          {/* Output View */}
          {activeView === 'output' && (
            <OutputDisplay output={banking.output} />
          )}
        </div>
      </div>

      {/* Invalid Commands Display */}
      {banking.parsedOutput.invalidCommands.length > 0 && (
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-6">
          <div className="flex items-start gap-3">
            <svg className="w-6 h-6 text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
            <div className="flex-1">
              <h3 className="text-lg font-semibold text-red-900 dark:text-red-200 mb-2">
                Invalid Commands Detected
              </h3>
              <p className="text-sm text-red-800 dark:text-red-300 mb-3">
                The following commands were rejected due to validation errors:
              </p>
              <div className="space-y-2">
                {banking.parsedOutput.invalidCommands.map((cmd, idx) => (
                  <div key={idx} className="bg-red-900/10 dark:bg-red-950/50 rounded px-3 py-2 font-mono text-sm text-red-900 dark:text-red-200">
                    {cmd}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Stats Footer */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-gray-800 rounded-lg p-4 shadow">
          <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
            {banking.accounts.length}
          </div>
          <div className="text-sm text-gray-600 dark:text-gray-400">Total Accounts</div>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-lg p-4 shadow">
          <div className="text-2xl font-bold text-green-600 dark:text-green-400">
            {banking.commandHistory.length}
          </div>
          <div className="text-sm text-gray-600 dark:text-gray-400">Commands Executed</div>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-lg p-4 shadow">
          <div className="text-2xl font-bold text-purple-600 dark:text-purple-400">
            ${banking.accounts.reduce((sum, acc) => sum + acc.getBalance(), 0).toFixed(2)}
          </div>
          <div className="text-sm text-gray-600 dark:text-gray-400">Total Balance</div>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-lg p-4 shadow">
          <div className="text-2xl font-bold text-orange-600 dark:text-orange-400">
            {banking.parsedOutput.invalidCommands.length}
          </div>
          <div className="text-sm text-gray-600 dark:text-gray-400">Invalid Commands</div>
        </div>
      </div>
    </div>
  );
}
