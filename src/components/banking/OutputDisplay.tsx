import React from 'react';

interface OutputDisplayProps {
  output: string[];
}

export function OutputDisplay({ output }: OutputDisplayProps) {
  if (output.length === 0) {
    return (
      <div className="bg-gray-900 rounded-lg p-8 font-mono text-sm">
        <div className="text-center text-gray-500">
          <svg className="w-16 h-16 mx-auto mb-4 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
          </svg>
          <p className="text-lg mb-2">No output yet</p>
          <p className="text-sm">Execute commands to see banking system output</p>
        </div>
      </div>
    );
  }

  const isAccountStateLine = (line: string): boolean => {
    return /^(Checking|Savings|Cd)\s+\d{8}/.test(line);
  };

  const isTransactionLine = (line: string): boolean => {
    return /^(create|deposit|withdraw|transfer|pass)/.test(line);
  };

  const formatLine = (line: string, index: number) => {
    if (isAccountStateLine(line)) {
      return (
        <div key={index} className="flex items-start gap-3 mb-4">
          <div className="flex-shrink-0 w-2 h-2 mt-2 rounded-full bg-emerald-400" />
          <div>
            <div className="text-emerald-400 font-semibold mb-1">Account State:</div>
            <div className="text-gray-100 bg-gray-800 rounded px-3 py-2">
              {line}
            </div>
          </div>
        </div>
      );
    }

    if (isTransactionLine(line)) {
      return (
        <div key={index} className="flex items-start gap-3 mb-2 ml-5">
          <div className="flex-shrink-0 w-1.5 h-1.5 mt-2 rounded-full bg-cyan-400" />
          <div className="text-cyan-400 text-sm">
            {line}
          </div>
        </div>
      );
    }

    // Invalid command
    return (
      <div key={index} className="flex items-start gap-3 mb-3">
        <div className="flex-shrink-0 w-2 h-2 mt-2 rounded-full bg-red-400" />
        <div>
          <div className="text-red-400 font-semibold mb-1">Invalid Command:</div>
          <div className="text-gray-300 bg-red-900/20 border border-red-800 rounded px-3 py-2">
            {line}
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="bg-gray-900 rounded-lg shadow-2xl overflow-hidden">
      {/* Header */}
      <div className="px-6 py-4 bg-gray-800 border-b border-gray-700 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="flex gap-2">
            <div className="w-3 h-3 rounded-full bg-red-500" />
            <div className="w-3 h-3 rounded-full bg-yellow-500" />
            <div className="w-3 h-3 rounded-full bg-green-500" />
          </div>
          <span className="text-gray-400 font-mono text-sm">banking-system-output</span>
        </div>
        <div className="flex items-center gap-2 text-xs text-gray-500">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
          <span>{output.length} lines</span>
        </div>
      </div>

      {/* Output Content */}
      <div className="p-6 max-h-[600px] overflow-y-auto font-mono text-sm">
        <div className="space-y-1">
          {output.map((line, index) => formatLine(line, index))}
        </div>
      </div>

      {/* Footer */}
      <div className="px-6 py-3 bg-gray-800 border-t border-gray-700">
        <div className="flex items-center justify-between text-xs text-gray-500">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-emerald-400" />
              <span>Account State</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-cyan-400" />
              <span>Transaction</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-red-400" />
              <span>Invalid</span>
            </div>
          </div>
          <div>
            Read-only output
          </div>
        </div>
      </div>
    </div>
  );
}
