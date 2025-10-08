import React, { useMemo } from 'react';
import type { Account } from '../../../lib/banking/core/Account';
import { AccountType } from '../../../lib/banking/types';
import { FaRegCreditCard, FaPiggyBank, FaLock, FaDollarSign } from 'react-icons/fa';

interface AccountCardProps {
  account: Account;
  onClick?: () => void;
  selected?: boolean;
}

const AccountCardComponent = ({ account, onClick, selected = false }: AccountCardProps) => {
  // Memoize account data extraction to avoid recalculating on every render
  const accountData = useMemo(() => ({
    type: account.getType(),
    balance: account.getBalance(),
    apr: account.getAPR(),
    id: account.getAccountID()
  }), [account]);

  // Get styling based on account type
  const styles = useMemo(() => {
    const accountType = accountData.type;
    switch (accountType) {
      case AccountType.Checking:
        return {
          gradient: 'from-blue-500 to-blue-600',
          icon: <FaRegCreditCard className="w-6 h-6" />,
          name: 'Checking'
        };
      case AccountType.Savings:
        return {
          gradient: 'from-green-500 to-green-600',
          icon: <FaPiggyBank className="w-6 h-6" />,
          name: 'Savings'
        };
      case AccountType.Cd:
        return {
          gradient: 'from-purple-500 to-purple-600',
          icon: <FaLock className="w-6 h-6" />,
          name: 'Certificate of Deposit'
        };
      default:
        return {
          gradient: 'from-gray-500 to-gray-600',
          icon: <FaDollarSign className="w-6 h-6" />,
          name: 'Account'
        };
    }
  }, [accountData.type]);

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
            <span aria-label={styles.name}>{styles.icon}</span>
            <span className="text-sm font-medium opacity-90">{styles.name}</span>
          </div>
          <div className="text-3xl font-bold" aria-label={`Balance: $${accountData.balance.toFixed(2)}`}>
            ${accountData.balance.toFixed(2)}
          </div>
        </div>
        <div className="flex flex-col items-end gap-2">
          <div className="text-right">
            <div className="text-xs opacity-75">APR</div>
            <div className="text-lg font-semibold">{accountData.apr.toFixed(2)}%</div>
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
      <div className="text-sm opacity-90 font-mono" aria-label={`Account ID: ${accountData.id}`}>
        ID: {accountData.id}
      </div>

      {/* Decorative Elements */}
      <div className="absolute top-0 right-0 w-32 h-32 bg-white opacity-5 rounded-full -mr-16 -mt-16" />
      <div className="absolute bottom-0 left-0 w-24 h-24 bg-white opacity-5 rounded-full -ml-12 -mb-12" />
    </div>
  );
};

// Memoize component to prevent re-renders when props haven't changed
export const AccountCard = React.memo(AccountCardComponent, (prevProps, nextProps) => {
  // Custom comparison function - only re-render if account data or selection state changes
  return (
    prevProps.account.getAccountID() === nextProps.account.getAccountID() &&
    prevProps.account.getBalance() === nextProps.account.getBalance() &&
    prevProps.account.getAPR() === nextProps.account.getAPR() &&
    prevProps.selected === nextProps.selected
  );
});
