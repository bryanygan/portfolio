import React from 'react';
import type { Account } from '../../../lib/banking/core/Account';
import { AccountType } from '../../../lib/banking/types';

interface AccountCardProps {
  account: Account;
  onClick?: () => void;
  selected?: boolean;
}

export function AccountCard({ account, onClick, selected = false }: AccountCardProps) {
  const accountType = account.getType();
  const balance = account.getBalance();
  const apr = account.getAPR();
  const accountId = account.getAccountID();

  // Get styling based on account type
  const getStyles = () => {
    switch (accountType) {
      case AccountType.Checking:
        return {
          gradient: 'from-blue-500 to-blue-600',
          icon: '💳',
          name: 'Checking'
        };
      case AccountType.Savings:
        return {
          gradient: 'from-green-500 to-green-600',
          icon: '💰',
          name: 'Savings'
        };
      case AccountType.Cd:
        return {
          gradient: 'from-purple-500 to-purple-600',
          icon: '🔒',
          name: 'Certificate of Deposit'
        };
      default:
        return {
          gradient: 'from-gray-500 to-gray-600',
          icon: '💵',
          name: 'Account'
        };
    }
  };

  const styles = getStyles();

  return (
    <div
      onClick={onClick}
      className={`
        relative bg-gradient-to-br ${styles.gradient}
        rounded-xl p-6 text-white shadow-lg
        transform transition-all duration-200
        ${onClick ? 'cursor-pointer hover:scale-105 hover:shadow-xl' : ''}
        ${selected ? 'ring-4 ring-white ring-opacity-50 scale-105' : ''}
      `}
    >
      {/* Card Header */}
      <div className="flex items-start justify-between mb-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-2xl" aria-label={styles.name}>{styles.icon}</span>
            <span className="text-sm font-medium opacity-90">{styles.name}</span>
          </div>
          <div className="text-3xl font-bold" aria-label={`Balance: $${balance.toFixed(2)}`}>
            ${balance.toFixed(2)}
          </div>
        </div>
        <div className="flex flex-col items-end gap-2">
          <div className="text-right">
            <div className="text-xs opacity-75">APR</div>
            <div className="text-lg font-semibold">{apr.toFixed(2)}%</div>
          </div>
          {onClick && (
            <svg
              className={`w-5 h-5 transition-transform duration-300 ${selected ? 'rotate-180' : ''}`}
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          )}
        </div>
      </div>

      {/* Account ID */}
      <div className="text-sm opacity-90 font-mono" aria-label={`Account ID: ${accountId}`}>
        ID: {accountId}
      </div>

      {/* Decorative Elements */}
      <div className="absolute top-0 right-0 w-32 h-32 bg-white opacity-5 rounded-full -mr-16 -mt-16" />
      <div className="absolute bottom-0 left-0 w-24 h-24 bg-white opacity-5 rounded-full -ml-12 -mb-12" />
    </div>
  );
}
