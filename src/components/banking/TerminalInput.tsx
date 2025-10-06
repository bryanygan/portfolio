import React, { useState, useRef, useEffect, type KeyboardEvent } from 'react';
import { COMMAND_TEMPLATES } from '../../../lib/banking/config/scenarios';

interface TerminalInputProps {
  onExecute: (command: string) => void;
  history: string[];
  disabled?: boolean;
}

export function TerminalInput({ onExecute, history, disabled = false }: TerminalInputProps) {
  const [input, setInput] = useState('');
  const [historyIndex, setHistoryIndex] = useState(-1);
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [selectedSuggestionIndex, setSelectedSuggestionIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  // Generate command suggestions based on input
  const generateSuggestions = (value: string): string[] => {
    if (!value.trim()) return [];

    const lowerValue = value.toLowerCase();
    const allSuggestions: string[] = [];

    COMMAND_TEMPLATES.forEach(template => {
      // Check if command name matches
      if (template.command.startsWith(lowerValue)) {
        // Add all examples for this command
        allSuggestions.push(...template.examples);
      }
      // Check if any example starts with the input
      else {
        template.examples.forEach(example => {
          if (example.toLowerCase().startsWith(lowerValue)) {
            allSuggestions.push(example);
          }
        });
      }
    });

    return allSuggestions.slice(0, 5); // Limit to 5 suggestions
  };

  const handleInputChange = (value: string) => {
    setInput(value);
    const newSuggestions = generateSuggestions(value);
    setSuggestions(newSuggestions);
    setSelectedSuggestionIndex(0);
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    // Enter - execute command or select suggestion
    if (e.key === 'Enter') {
      e.preventDefault();
      if (suggestions.length > 0 && selectedSuggestionIndex >= 0) {
        const selected = suggestions[selectedSuggestionIndex];
        setInput(selected);
        setSuggestions([]);
        return;
      }
      if (input.trim()) {
        onExecute(input.trim());
        setInput('');
        setHistoryIndex(-1);
        setSuggestions([]);
      }
    }
    // Arrow Up - navigate command history or suggestions
    else if (e.key === 'ArrowUp') {
      e.preventDefault();
      if (suggestions.length > 0) {
        setSelectedSuggestionIndex(prev =>
          prev > 0 ? prev - 1 : suggestions.length - 1
        );
      } else if (history.length > 0) {
        const newIndex = historyIndex < history.length - 1 ? historyIndex + 1 : historyIndex;
        setHistoryIndex(newIndex);
        setInput(history[history.length - 1 - newIndex]);
        setSuggestions([]);
      }
    }
    // Arrow Down - navigate command history or suggestions
    else if (e.key === 'ArrowDown') {
      e.preventDefault();
      if (suggestions.length > 0) {
        setSelectedSuggestionIndex(prev =>
          prev < suggestions.length - 1 ? prev + 1 : 0
        );
      } else if (historyIndex > 0) {
        const newIndex = historyIndex - 1;
        setHistoryIndex(newIndex);
        setInput(history[history.length - 1 - newIndex]);
      } else if (historyIndex === 0) {
        setHistoryIndex(-1);
        setInput('');
      }
    }
    // Tab - autocomplete first suggestion
    else if (e.key === 'Tab') {
      e.preventDefault();
      if (suggestions.length > 0) {
        setInput(suggestions[0]);
        setSuggestions([]);
      }
    }
    // Escape - clear suggestions
    else if (e.key === 'Escape') {
      setSuggestions([]);
      setSelectedSuggestionIndex(0);
    }
  };

  const handleSuggestionClick = (suggestion: string) => {
    setInput(suggestion);
    setSuggestions([]);
    inputRef.current?.focus();
  };

  return (
    <div className="relative">
      {/* Terminal Container */}
      <div className="bg-gray-900 rounded-lg p-4 font-mono text-sm shadow-xl">
        {/* Terminal Header */}
        <div className="flex items-center gap-2 mb-3 text-emerald-400">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 9l3 3-3 3m5 0h3M5 20h14a2 2 0 002-2V6a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
          <span className="text-xs uppercase tracking-wide">Banking Terminal</span>
        </div>

        {/* Command Input */}
        <div className="flex items-center gap-2">
          <span className="text-cyan-400 font-bold">$</span>
          <input
            ref={inputRef}
            type="text"
            value={input}
            onChange={(e) => handleInputChange(e.target.value)}
            onKeyDown={handleKeyDown}
            disabled={disabled}
            className="flex-1 bg-transparent text-gray-100 outline-none placeholder-gray-500 disabled:opacity-50"
            placeholder="Type a command... (e.g., create checking 12345678 1.0)"
            autoComplete="off"
            spellCheck="false"
          />
          {disabled && (
            <span className="text-yellow-400 text-xs">Processing...</span>
          )}
        </div>

        {/* Command History (last 5 commands) */}
        {history.length > 0 && (
          <div className="mt-3 pt-3 border-t border-gray-700">
            <div className="text-xs text-gray-500 mb-1">Recent Commands:</div>
            <div className="space-y-1 max-h-24 overflow-y-auto">
              {history.slice(-5).reverse().map((cmd, i) => (
                <div key={i} className="flex gap-2 text-xs">
                  <span className="text-cyan-400 opacity-50">$</span>
                  <span className="text-gray-400">{cmd}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Autocomplete Suggestions */}
      {suggestions.length > 0 && (
        <div className="absolute z-20 w-full mt-1 bg-gray-800 rounded-lg shadow-2xl border border-gray-700 overflow-hidden">
          {suggestions.map((suggestion, i) => (
            <button
              key={i}
              onClick={() => handleSuggestionClick(suggestion)}
              className={`
                w-full text-left px-4 py-2 text-sm font-mono
                transition-colors duration-150
                ${i === selectedSuggestionIndex
                  ? 'bg-blue-600 text-white'
                  : 'text-gray-300 hover:bg-gray-700'
                }
              `}
            >
              <div className="flex items-center gap-2">
                <svg className="w-3 h-3 opacity-50" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
                </svg>
                <span>{suggestion}</span>
              </div>
            </button>
          ))}
          <div className="px-4 py-2 text-xs text-gray-500 bg-gray-900 border-t border-gray-700">
            Use ↑↓ to navigate, Enter to select, Tab to autocomplete
          </div>
        </div>
      )}
    </div>
  );
}
