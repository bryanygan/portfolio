import React from 'react';

export function ArchitectureDiagram() {
  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl p-8 shadow-lg">
      <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-6">System Architecture</h2>

      <div className="relative">
        {/* UML Class Diagram */}
        <div className="mb-8 bg-gray-50 dark:bg-gray-900 rounded-lg p-6 border border-gray-200 dark:border-gray-700">
          <h3 className="font-bold text-xl text-gray-900 dark:text-white mb-4">UML Class Diagram</h3>
          <div className="flex justify-center">
            <img
              src="/assets/images/banking-system/banking_system_UML_transparent.png"
              alt="Banking System UML Class Diagram showing relationships between Account hierarchy, Bank repository, MasterControl, validators, and processors"
              className="max-w-full h-auto rounded-lg"
            />
          </div>
        </div>

        {/* Component Flow Diagram */}
        <div className="mb-8">
          <h3 className="font-bold text-xl text-gray-900 dark:text-white mb-4">Component Flow</h3>
          <pre className="text-xs md:text-sm font-mono bg-gray-900 dark:bg-gray-950 text-emerald-400 p-6 rounded-lg overflow-x-auto">
{`┌─────────────────────────────────────────────────────────────────┐
│                        MasterControl                            │
│          (Orchestrates command processing pipeline)             │
└────────────────┬────────────────────────────────────────────────┘
                 │
         ┌───────┴────────┬──────────────┬─────────────┐
         │                │              │             │
    ┌────▼─────┐    ┌─────▼─────┐  ┌─────▼──┐  ┌───────▼──────┐
    │ Command  │    │  Command  │  │  Bank  │  │ Transaction  │
    │Validation│    │ Processor │  │(Repo)  │  │    Logger    │
    └──────────┘    └───────────┘  └───┬────┘  └──────────────┘
                                       │
                             ┌─────────┼──────────┐
                             │         │          │
                        ┌────▼───┐ ┌───▼────┐ ┌───▼───┐
                        │Checking│ │Savings │ │  CD   │
                        │Account │ │Account │ │Account│
                        └────────┘ └────────┘ └───────┘`}
          </pre>
        </div>

        {/* Component Descriptions */}
        <div className="mt-8 grid md:grid-cols-2 gap-4">
          <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-5">
            <div className="flex items-center gap-2 mb-3">
              <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
              <h3 className="font-bold text-lg text-gray-900 dark:text-white">MasterControl</h3>
            </div>
            <p className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed">
              Central coordinator that processes command lists, validates each command through validators,
              executes valid commands via processors, and generates formatted output with account states
              and transaction history.
            </p>
          </div>

          <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-5">
            <div className="flex items-center gap-2 mb-3">
              <div className="w-3 h-3 bg-green-500 rounded-full"></div>
              <h3 className="font-bold text-lg text-gray-900 dark:text-white">Command Pattern</h3>
            </div>
            <p className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed">
              Separation of command validation and execution allows for extensibility, maintainability,
              and adherence to the Single Responsibility Principle. Each validator and processor handles
              one specific command type.
            </p>
          </div>

          <div className="bg-purple-50 dark:bg-purple-900/20 border border-purple-200 dark:border-purple-800 rounded-lg p-5">
            <div className="flex items-center gap-2 mb-3">
              <div className="w-3 h-3 bg-purple-500 rounded-full"></div>
              <h3 className="font-bold text-lg text-gray-900 dark:text-white">Bank (Repository)</h3>
            </div>
            <p className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed">
              Manages account storage using a Map data structure for O(1) lookups by account ID,
              handles time passage logic including APR accrual and fee deductions, and enforces
              business rules like zero-balance removal.
            </p>
          </div>

          <div className="bg-orange-50 dark:bg-orange-900/20 border border-orange-200 dark:border-orange-800 rounded-lg p-5">
            <div className="flex items-center gap-2 mb-3">
              <div className="w-3 h-3 bg-orange-500 rounded-full"></div>
              <h3 className="font-bold text-lg text-gray-900 dark:text-white">Account Hierarchy</h3>
            </div>
            <p className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed">
              Polymorphic design with an abstract Account base class and specialized subclasses
              (Checking, Savings, CD) that inherit common behavior while implementing type-specific
              features like CD's quarterly APR compounding.
            </p>
          </div>
        </div>

        {/* Data Flow */}
        <div className="mt-8 bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-900/10 dark:to-purple-900/10 rounded-lg p-6 border border-blue-200 dark:border-blue-800">
          <h3 className="font-bold text-lg text-gray-900 dark:text-white mb-4 flex items-center gap-2">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
            Command Processing Flow
          </h3>
          <ol className="space-y-2 text-sm text-gray-700 dark:text-gray-300">
            <li className="flex items-start gap-3">
              <span className="flex-shrink-0 w-6 h-6 bg-blue-500 text-white rounded-full flex items-center justify-center text-xs font-bold">1</span>
              <span>User submits command string (e.g., "create checking 12345678 1.5")</span>
            </li>
            <li className="flex items-start gap-3">
              <span className="flex-shrink-0 w-6 h-6 bg-blue-500 text-white rounded-full flex items-center justify-center text-xs font-bold">2</span>
              <span>CommandValidation parses and validates command syntax and business rules</span>
            </li>
            <li className="flex items-start gap-3">
              <span className="flex-shrink-0 w-6 h-6 bg-blue-500 text-white rounded-full flex items-center justify-center text-xs font-bold">3</span>
              <span>If valid, CommandProcessor executes the operation on the Bank</span>
            </li>
            <li className="flex items-start gap-3">
              <span className="flex-shrink-0 w-6 h-6 bg-blue-500 text-white rounded-full flex items-center justify-center text-xs font-bold">4</span>
              <span>TransactionLogger records the command for audit trail</span>
            </li>
            <li className="flex items-start gap-3">
              <span className="flex-shrink-0 w-6 h-6 bg-blue-500 text-white rounded-full flex items-center justify-center text-xs font-bold">5</span>
              <span>MasterControl generates formatted output with account states and transactions</span>
            </li>
          </ol>
        </div>
      </div>
    </div>
  );
}
