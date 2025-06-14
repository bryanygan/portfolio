// src/components/BotSimulator/CommandInput.jsx
import { useState, useRef, useEffect } from 'react';

const CommandInput = ({ onCommand, isProcessing }) => {
  const [input, setInput] = useState('');
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [selectedSuggestion, setSelectedSuggestion] = useState(0);
  const inputRef = useRef(null);

  const commands = [
    {
      name: '/fusion_assist',
      description: 'Generate Fusion assist order with card pool',
      params: 'mode:UberEats email:custom@example.com'
    },
    {
      name: '/fusion_order', 
      description: 'Generate Fusion order with email and card pools',
      params: 'custom_email:example@gmail.com'
    },
    {
      name: '/wool_order',
      description: 'Generate Wool order format',
      params: 'custom_email:example@gmail.com'
    },
    {
      name: '/payments',
      description: 'Display payment methods',
      params: ''
    },
    {
      name: '/add_card',
      description: 'Add card to pool (Admin)',
      params: 'number:4111111111111111 cvv:123'
    },
    {
      name: '/add_email',
      description: 'Add email to pool (Admin)', 
      params: 'email:test@example.com top:true'
    },
    {
      name: '/open',
      description: 'Open the channel',
      params: ''
    },
    {
      name: '/close',
      description: 'Close the channel',
      params: ''
    },
    {
      name: '/help',
      description: 'Show available commands',
      params: ''
    }
  ];

  const filteredCommands = commands.filter(cmd => 
    cmd.name.toLowerCase().includes(input.toLowerCase()) && input.startsWith('/')
  );

  const handleSubmit = () => {
    if (!input.trim() || isProcessing) return;

    // Parse command and parameters
    const parts = input.trim().split(' ');
    const command = parts[0];
    const params = {};
    
    // Simple parameter parsing for key:value pairs
    parts.slice(1).forEach(part => {
      const [key, value] = part.split(':');
      if (key && value) {
        params[key] = value;
      }
    });

    onCommand(command, params);
    setInput('');
    setShowSuggestions(false);
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  const handleInputChange = (e) => {
    const value = e.target.value;
    setInput(value);
    setShowSuggestions(value.startsWith('/') && value.length > 1);
    setSelectedSuggestion(0);
  };

  const handleKeyDown = (e) => {
    if (!showSuggestions || filteredCommands.length === 0) return;

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setSelectedSuggestion(prev => 
          prev < filteredCommands.length - 1 ? prev + 1 : 0
        );
        break;
      case 'ArrowUp':
        e.preventDefault();
        setSelectedSuggestion(prev => 
          prev > 0 ? prev - 1 : filteredCommands.length - 1
        );
        break;
      case 'Tab':
      case 'Enter':
        if (e.key === 'Tab') {
          e.preventDefault();
          const selected = filteredCommands[selectedSuggestion];
          if (selected) {
            const fullCommand = selected.params 
              ? `${selected.name} ${selected.params}`
              : selected.name;
            setInput(fullCommand);
            setShowSuggestions(false);
          }
        }
        break;
      case 'Escape':
        setShowSuggestions(false);
        break;
    }
  };

  const insertCommand = (command) => {
    const fullCommand = command.params 
      ? `${command.name} ${command.params}`
      : command.name;
    setInput(fullCommand);
    setShowSuggestions(false);
    inputRef.current?.focus();
  };

  useEffect(() => {
    if (showSuggestions && filteredCommands.length === 0) {
      setShowSuggestions(false);
    }
  }, [showSuggestions, filteredCommands.length]);

  return (
    <div className="relative bg-gray-800 border-t border-gray-700 flex-shrink-0">
      {/* Command Suggestions */}
      {showSuggestions && filteredCommands.length > 0 && (
        <div className="absolute bottom-full left-0 right-0 bg-gray-800 border border-gray-600 rounded-t-lg shadow-lg max-h-48 sm:max-h-64 overflow-y-auto z-10">
          {filteredCommands.map((command, index) => (
            <div
              key={command.name}
              className={`p-2 sm:p-3 cursor-pointer border-b border-gray-700 last:border-b-0 ${
                index === selectedSuggestion ? 'bg-blue-600' : 'hover:bg-gray-700'
              }`}
              onClick={() => insertCommand(command)}
            >
              <div className="font-medium text-white text-sm sm:text-base">{command.name}</div>
              <div className="text-xs sm:text-sm text-gray-300 mt-1">{command.description}</div>
              {command.params && (
                <div className="text-xs text-gray-400 mt-1 truncate">
                  Example: {command.name} {command.params}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Input Form */}
      <div className="p-2 sm:p-4">
        <div className="flex flex-col sm:flex-row gap-2 sm:gap-3 items-stretch sm:items-end">
          <div className="flex-1 relative">
            <input
              ref={inputRef}
              type="text"
              value={input}
              onChange={handleInputChange}
              onKeyDown={(e) => {
                handleKeyDown(e);
                handleKeyPress(e);
              }}
              placeholder="Type a command (start with /) or message..."
              disabled={isProcessing}
              className="w-full bg-gray-700 text-white rounded-lg px-3 sm:px-4 py-2 sm:py-3 text-sm sm:text-base focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
            />
            
            {/* Command indicator */}
            {input.startsWith('/') && (
              <div className="absolute right-2 sm:right-3 top-1/2 transform -translate-y-1/2 text-xs text-gray-400 hidden sm:block">
                Press Tab to autocomplete
              </div>
            )}
          </div>
          
          <button
            type="button"
            disabled={!input.trim() || isProcessing}
            onClick={handleSubmit}
            className="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white px-4 sm:px-6 py-2 sm:py-3 rounded-lg font-medium transition-colors flex items-center justify-center gap-2 text-sm sm:text-base min-w-[80px] sm:min-w-[100px]"
          >
            {isProcessing ? (
              <>
                <div className="w-3 h-3 sm:w-4 sm:h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                <span className="hidden sm:inline">Processing...</span>
              </>
            ) : (
              <>
                <svg className="w-3 h-3 sm:w-4 sm:h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                </svg>
                <span className="hidden sm:inline">Send</span>
              </>
            )}
          </button>
        </div>
        
        {/* Quick Commands */}
        <div className="mt-2 sm:mt-3 flex flex-wrap gap-1 sm:gap-2">
          <span className="text-xs text-gray-400 mb-1 sm:mb-0">Quick commands:</span>
          {['/help', '/payments', '/wool_details', '/fusion_assist'].map(cmd => (
            <button
              key={cmd}
              type="button"
              onClick={() => setInput(cmd)}
              className="text-xs bg-gray-700 hover:bg-gray-600 text-gray-300 px-2 py-1 rounded transition-colors truncate"
            >
              {cmd}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};

export default CommandInput;