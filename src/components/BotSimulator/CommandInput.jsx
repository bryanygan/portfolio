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

  const handleSubmit = (e) => {
    e.preventDefault();
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
    <div className="relative bg-gray-800 border-t border-gray-700">
      {/* Command Suggestions */}
      {showSuggestions && filteredCommands.length > 0 && (
        <div className="absolute bottom-full left-0 right-0 bg-gray-800 border border-gray-600 rounded-t-lg shadow-lg max-h-64 overflow-y-auto">
          {filteredCommands.map((command, index) => (
            <div
              key={command.name}
              className={`p-3 cursor-pointer border-b border-gray-700 last:border-b-0 ${
                index === selectedSuggestion ? 'bg-blue-600' : 'hover:bg-gray-700'
              }`}
              onClick={() => insertCommand(command)}
            >
              <div className="font-medium text-white">{command.name}</div>
              <div className="text-sm text-gray-300">{command.description}</div>
              {command.params && (
                <div className="text-xs text-gray-400 mt-1">
                  Example: {command.name} {command.params}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Input Form */}
      <form onSubmit={handleSubmit} className="p-4">
        <div className="flex gap-3 items-end">
          <div className="flex-1 relative">
            <input
              ref={inputRef}
              type="text"
              value={input}
              onChange={handleInputChange}
              onKeyDown={handleKeyDown}
              placeholder="Type a command (start with /) or message..."
              disabled={isProcessing}
              className="w-full bg-gray-700 text-white rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
            />
            
            {/* Command indicator */}
            {input.startsWith('/') && (
              <div className="absolute right-3 top-1/2 transform -translate-y-1/2 text-xs text-gray-400">
                Press Tab to autocomplete
              </div>
            )}
          </div>
          
          <button
            type="submit"
            disabled={!input.trim() || isProcessing}
            className="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white px-6 py-3 rounded-lg font-medium transition-colors flex items-center gap-2"
          >
            {isProcessing ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                Processing...
              </>
            ) : (
              <>
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                </svg>
                Send
              </>
            )}
          </button>
        </div>
        
        {/* Quick Commands */}
        <div className="mt-3 flex flex-wrap gap-2">
          <span className="text-xs text-gray-400">Quick commands:</span>
          {['/help', '/payments', '/wool_details', '/fusion_assist'].map(cmd => (
            <button
              key={cmd}
              type="button"
              onClick={() => setInput(cmd)}
              className="text-xs bg-gray-700 hover:bg-gray-600 text-gray-300 px-2 py-1 rounded transition-colors"
            >
              {cmd}
            </button>
          ))}
        </div>
      </form>
    </div>
  );
};

export default CommandInput;