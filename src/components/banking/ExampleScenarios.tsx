import React, { useState } from 'react';
import { EXAMPLE_SCENARIOS, type Scenario } from '../../../lib/banking/config/scenarios';

interface ExampleScenariosProps {
  onLoadScenario: (commands: string[]) => void;
  disabled?: boolean;
}

export function ExampleScenarios({ onLoadScenario, disabled = false }: ExampleScenariosProps) {
  const [expandedScenario, setExpandedScenario] = useState<string | null>(null);

  const toggleScenario = (scenarioId: string) => {
    setExpandedScenario(prev => prev === scenarioId ? null : scenarioId);
  };

  const handleLoadScenario = (scenario: Scenario) => {
    onLoadScenario(scenario.commands);
    setExpandedScenario(null);
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg overflow-hidden">
      <div className="px-6 py-4 bg-gradient-to-r from-blue-500 to-purple-500">
        <h3 className="text-lg font-semibold text-white flex items-center gap-2">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 10l-2 1m0 0l-2-1m2 1v2.5M20 7l-2 1m2-1l-2-1m2 1v2.5M14 4l-2-1-2 1M4 7l2-1M4 7l2 1M4 7v2.5M12 21l-2-1m2 1l2-1m-2 1v-2.5M6 18l-2-1v-2.5M18 18l2-1v-2.5" />
          </svg>
          Example Scenarios
        </h3>
        <p className="text-sm text-blue-100 mt-1">
          Pre-built demos to explore banking features
        </p>
      </div>

      <div className="divide-y divide-gray-200 dark:divide-gray-700">
        {EXAMPLE_SCENARIOS.map((scenario) => {
          const isExpanded = expandedScenario === scenario.id;

          return (
            <div key={scenario.id} className="transition-colors duration-150">
              {/* Scenario Header */}
              <button
                onClick={() => toggleScenario(scenario.id)}
                className="w-full px-6 py-4 text-left hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors duration-150"
                disabled={disabled}
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <h4 className="font-semibold text-gray-900 dark:text-white mb-1">
                      {scenario.title}
                    </h4>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      {scenario.description}
                    </p>
                    <div className="mt-2 flex items-center gap-2 text-xs text-gray-500 dark:text-gray-500">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 20l4-16m2 16l4-16M6 9h14M4 15h14" />
                      </svg>
                      <span>{scenario.commands.length} commands</span>
                    </div>
                  </div>
                  <svg
                    className={`w-5 h-5 text-gray-400 transition-transform duration-200 flex-shrink-0 ${
                      isExpanded ? 'transform rotate-180' : ''
                    }`}
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </div>
              </button>

              {/* Expanded Content */}
              {isExpanded && (
                <div className="px-6 pb-4 bg-gray-50 dark:bg-gray-900/50">
                  <div className="space-y-3">
                    {/* Commands List */}
                    <div className="bg-gray-900 dark:bg-gray-950 rounded-lg p-4">
                      <div className="text-xs text-gray-400 mb-2 uppercase tracking-wide">Commands:</div>
                      <div className="space-y-1 font-mono text-sm">
                        {scenario.commands.map((cmd, idx) => (
                          <div key={idx} className="flex gap-2 text-emerald-400">
                            <span className="text-cyan-400">$</span>
                            <span>{cmd}</span>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Expected Outcome */}
                    <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4 border border-blue-200 dark:border-blue-800">
                      <div className="text-xs text-blue-700 dark:text-blue-400 mb-1 font-semibold uppercase tracking-wide">
                        Expected Outcome:
                      </div>
                      <p className="text-sm text-blue-900 dark:text-blue-300">
                        {scenario.expectedOutcome}
                      </p>
                    </div>

                    {/* Run Button */}
                    <button
                      onClick={() => handleLoadScenario(scenario)}
                      disabled={disabled}
                      className="w-full bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600 text-white font-semibold py-3 px-4 rounded-lg transition-all duration-200 transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none flex items-center justify-center gap-2"
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      Run This Scenario
                    </button>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
