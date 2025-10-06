import React from 'react';

export function TestCoverageSection() {
  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl p-8 shadow-lg">
      <div className="mb-8">
        <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-3">Test Coverage & Quality Assurance</h2>
        <p className="text-gray-600 dark:text-gray-400 text-lg">
          Comprehensive test suite ensuring reliability and correctness
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid md:grid-cols-4 gap-4 mb-8">
        <div className="bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 border border-green-200 dark:border-green-800 rounded-lg p-6 text-center">
          <div className="text-4xl font-bold text-green-600 dark:text-green-400 mb-2">151</div>
          <div className="text-sm font-semibold text-gray-700 dark:text-gray-300">Total Tests</div>
          <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">All Passing ✓</div>
        </div>

        <div className="bg-gradient-to-br from-blue-50 to-cyan-50 dark:from-blue-900/20 dark:to-cyan-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-6 text-center">
          <div className="text-4xl font-bold text-blue-600 dark:text-blue-400 mb-2">8</div>
          <div className="text-sm font-semibold text-gray-700 dark:text-gray-300">Test Suites</div>
          <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">Comprehensive Coverage</div>
        </div>

        <div className="bg-gradient-to-br from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20 border border-purple-200 dark:border-purple-800 rounded-lg p-6 text-center">
          <div className="text-4xl font-bold text-purple-600 dark:text-purple-400 mb-2">TDD</div>
          <div className="text-sm font-semibold text-gray-700 dark:text-gray-300">Methodology</div>
          <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">Test-Driven Development</div>
        </div>

        <div className="bg-gradient-to-br from-orange-50 to-amber-50 dark:from-orange-900/20 dark:to-amber-900/20 border border-orange-200 dark:border-orange-800 rounded-lg p-6 text-center">
          <div className="text-4xl font-bold text-orange-600 dark:text-orange-400 mb-2">100%</div>
          <div className="text-sm font-semibold text-gray-700 dark:text-gray-300">Pass Rate</div>
          <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">Zero Failures</div>
        </div>
      </div>

      {/* Test Breakdown */}
      <div className="mb-8 bg-gray-50 dark:bg-gray-900/50 rounded-lg p-6">
        <h3 className="font-bold text-xl text-gray-900 dark:text-white mb-4">Test Suite Breakdown</h3>
        <div className="grid md:grid-cols-2 gap-4">
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-700 dark:text-gray-300">Core Banking Logic</span>
              <span className="font-mono text-sm font-bold text-green-600 dark:text-green-400">112 tests</span>
            </div>
            <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
              <div className="bg-green-500 h-2 rounded-full" style={{ width: '74%' }}></div>
            </div>
          </div>

          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-700 dark:text-gray-300">Integration Tests</span>
              <span className="font-mono text-sm font-bold text-blue-600 dark:text-blue-400">25 tests</span>
            </div>
            <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
              <div className="bg-blue-500 h-2 rounded-full" style={{ width: '17%' }}></div>
            </div>
          </div>

          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-700 dark:text-gray-300">Hook Logic Tests</span>
              <span className="font-mono text-sm font-bold text-purple-600 dark:text-purple-400">9 tests</span>
            </div>
            <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
              <div className="bg-purple-500 h-2 rounded-full" style={{ width: '6%' }}></div>
            </div>
          </div>

          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-700 dark:text-gray-300">Reactivity Tests</span>
              <span className="font-mono text-sm font-bold text-orange-600 dark:text-orange-400">5 tests</span>
            </div>
            <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
              <div className="bg-orange-500 h-2 rounded-full" style={{ width: '3%' }}></div>
            </div>
          </div>
        </div>
      </div>

      {/* Example Test Cases */}
      <div className="space-y-6">
        <h3 className="font-bold text-xl text-gray-900 dark:text-white">Example Test Cases</h3>

        {/* Test Case 1: APR */}
        <div className="border-l-4 border-green-500 pl-4">
          <h4 className="font-semibold text-lg text-gray-900 dark:text-white mb-2">APR Accrual Calculation</h4>
          <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
            Verifies that annual percentage rate is correctly calculated and applied monthly
          </p>
          <pre className="bg-gray-900 dark:bg-gray-950 p-4 rounded-lg overflow-x-auto text-sm">
            <code className="text-emerald-400 font-mono">{`it('accrues APR correctly over time', () => {
  const bank = new Bank();
  const mc = new MasterControl(bank);

  const commands = [
    'create savings 12345678 6.0',
    'deposit 12345678 1000',
    'pass 1'
  ];

  const output = mc.start(commands);

  // Expected: 1000 * (1 + 0.06/12) = 1005.00
  expect(output[0]).toMatch(/Savings 12345678 1005\\.00 6\\.00/);
});`}</code>
          </pre>
        </div>

        {/* Test Case 2: Fees */}
        <div className="border-l-4 border-blue-500 pl-4">
          <h4 className="font-semibold text-lg text-gray-900 dark:text-white mb-2">Minimum Balance Fee</h4>
          <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
            Tests that accounts with balance below $100 are charged a $25 monthly fee
          </p>
          <pre className="bg-gray-900 dark:bg-gray-950 p-4 rounded-lg overflow-x-auto text-sm">
            <code className="text-emerald-400 font-mono">{`it('deducts minimum balance fee correctly', () => {
  const bank = new Bank();
  const mc = new MasterControl(bank);

  const commands = [
    'create checking 12345678 1.0',
    'deposit 12345678 50',
    'pass 1'
  ];

  const output = mc.start(commands);

  // Expected: 50 - 25 = 25.00
  expect(output[0]).toMatch(/Checking 12345678 25\\.00/);
});`}</code>
          </pre>
        </div>

        {/* Test Case 3: CD Compounding */}
        <div className="border-l-4 border-purple-500 pl-4">
          <h4 className="font-semibold text-lg text-gray-900 dark:text-white mb-2">CD Quarterly Compounding</h4>
          <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
            Validates that Certificate of Deposit accounts compound interest quarterly instead of monthly
          </p>
          <pre className="bg-gray-900 dark:bg-gray-950 p-4 rounded-lg overflow-x-auto text-sm">
            <code className="text-emerald-400 font-mono">{`it('applies quarterly compounding for CD accounts', () => {
  const bank = new Bank();
  const mc = new MasterControl(bank);

  const commands = [
    'create cd 12345678 4.0 10000',
    'pass 1'
  ];

  const output = mc.start(commands);

  // CD compounds 4 times in a month
  const expected = 10000 * Math.pow(1 + 0.04/12/4, 4);
  expect(output[0]).toMatch(/Cd 12345678 10033\\.36/);
});`}</code>
          </pre>
        </div>
      </div>

      {/* Testing Approach */}
      <div className="mt-8 bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-900/10 dark:to-purple-900/10 rounded-lg p-6 border border-blue-200 dark:border-blue-800">
        <h3 className="font-bold text-lg text-gray-900 dark:text-white mb-4">Testing Approach</h3>
        <div className="grid md:grid-cols-2 gap-4 text-sm text-gray-700 dark:text-gray-300">
          <div>
            <h4 className="font-semibold mb-2">Unit Tests</h4>
            <ul className="space-y-1">
              <li className="flex gap-2"><span className="text-green-500">✓</span> Individual class methods</li>
              <li className="flex gap-2"><span className="text-green-500">✓</span> Edge case handling</li>
              <li className="flex gap-2"><span className="text-green-500">✓</span> Error conditions</li>
            </ul>
          </div>
          <div>
            <h4 className="font-semibold mb-2">Integration Tests</h4>
            <ul className="space-y-1">
              <li className="flex gap-2"><span className="text-blue-500">✓</span> End-to-end workflows</li>
              <li className="flex gap-2"><span className="text-blue-500">✓</span> Multi-account scenarios</li>
              <li className="flex gap-2"><span className="text-blue-500">✓</span> Command processing pipeline</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
