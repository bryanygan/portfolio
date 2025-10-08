import React from 'react';
import { MdAdd, MdOutlineAccountBalance } from 'react-icons/md';
import { FaDollarSign, FaMoneyBillWave } from 'react-icons/fa';
import { BiTransfer } from 'react-icons/bi';
import { IoTimeOutline } from 'react-icons/io5';

interface TransactionHistoryProps {
  transactions: string[];
  accountId?: string;
}

export function TransactionHistory({ transactions, accountId }: TransactionHistoryProps) {
  if (transactions.length === 0) {
    return (
      <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-6 text-center">
        <svg className="w-12 h-12 mx-auto mb-3 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        </svg>
        <p className="text-gray-500 dark:text-gray-400">No transactions yet</p>
        <p className="text-sm text-gray-400 dark:text-gray-500 mt-1">
          Execute commands to see transaction history
        </p>
      </div>
    );
  }

  const getCommandIcon = (command: string) => {
    if (command.startsWith('create')) return { icon: <MdAdd className="w-5 h-5" />, color: 'text-blue-500', bg: 'bg-blue-100 dark:bg-blue-900/30' };
    if (command.startsWith('deposit')) return { icon: <FaDollarSign className="w-5 h-5" />, color: 'text-green-500', bg: 'bg-green-100 dark:bg-green-900/30' };
    if (command.startsWith('withdraw')) return { icon: <FaMoneyBillWave className="w-5 h-5" />, color: 'text-red-500', bg: 'bg-red-100 dark:bg-red-900/30' };
    if (command.startsWith('transfer')) return { icon: <BiTransfer className="w-5 h-5" />, color: 'text-purple-500', bg: 'bg-purple-100 dark:bg-purple-900/30' };
    if (command.startsWith('pass')) return { icon: <IoTimeOutline className="w-5 h-5" />, color: 'text-yellow-500', bg: 'bg-yellow-100 dark:bg-yellow-900/30' };
    return { icon: <MdOutlineAccountBalance className="w-5 h-5" />, color: 'text-gray-500', bg: 'bg-gray-100 dark:bg-gray-900/30' };
  };

  const getCommandType = (command: string): string => {
    const firstWord = command.split(' ')[0];
    return firstWord.charAt(0).toUpperCase() + firstWord.slice(1);
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg overflow-hidden">
      <div className="px-6 py-4 bg-gray-50 dark:bg-gray-700 border-b border-gray-200 dark:border-gray-600">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
          </svg>
          Transaction History
          {accountId && (
            <span className="text-sm font-mono text-gray-500 dark:text-gray-400">
              • {accountId}
            </span>
          )}
        </h3>
        <p className="text-sm text-gray-600 dark:text-gray-300 mt-1">
          {transactions.length} transaction{transactions.length !== 1 ? 's' : ''}
        </p>
      </div>

      <div className="max-h-96 overflow-y-auto">
        <div className="divide-y divide-gray-200 dark:divide-gray-700">
          {transactions.map((transaction, index) => {
            const { icon, color, bg } = getCommandIcon(transaction);
            const commandType = getCommandType(transaction);

            return (
              <div
                key={index}
                className="px-6 py-4 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors duration-150"
              >
                <div className="flex items-start gap-4">
                  {/* Icon */}
                  <div className={`flex-shrink-0 w-10 h-10 rounded-full ${bg} flex items-center justify-center ${color}`}>
                    <span aria-hidden="true">{icon}</span>
                  </div>

                  {/* Transaction Details */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className={`text-sm font-semibold ${color}`}>
                        {commandType}
                      </span>
                      <span className="text-xs text-gray-500 dark:text-gray-400">
                        #{index + 1}
                      </span>
                    </div>
                    <code className="text-sm text-gray-700 dark:text-gray-300 font-mono break-all">
                      {transaction}
                    </code>
                  </div>

                  {/* Timeline Connector (except for last item) */}
                  {index < transactions.length - 1 && (
                    <div className="absolute left-[2.5rem] mt-12 w-0.5 h-6 bg-gray-200 dark:bg-gray-600" />
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
