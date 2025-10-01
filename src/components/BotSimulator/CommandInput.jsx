// src/components/BotSimulator/CommandInput.jsx
import { useState, useRef, useEffect } from 'react';

const CommandInput = ({ onCommand, isProcessing }) => {
  const [input, setInput] = useState('');
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [selectedSuggestion, setSelectedSuggestion] = useState(0);
  const [selectedFile, setSelectedFile] = useState(null);
  const inputRef = useRef(null);
  const fileInputRef = useRef(null);

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
      name: '/wool_details',
      description: 'Show parsed Wool order details',
      params: ''
    },
    {
      name: '/pump_order',
      description: 'Generate Pump order with pump pool email',
      params: 'pool:pump_20off25 custom_email:test@pump.com card_number:1234567890123456 card_cvv:123'
    },
    {
      name: '/reorder',
      description: 'Format a reorder command with email only (Admin)',
      params: 'email:user@example.com'
    },
    {
      name: '/z',
      description: 'Parse order information and display breakdown (Admin)',
      params: 'order_text:"CART ITEMS: • Item (x1) - $5.00" vip:true service_fee:6.00'
    },
    {
      name: '/vcc',
      description: 'Pull a card from the pool in order format (Admin)',
      params: ''
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
      params: 'email:test@example.com pool:main top:true'
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
      name: '/break',
      description: 'Put the channel on hold',
      params: ''
    },
    {
      name: '/help',
      description: 'Show available commands',
      params: ''
    },
    {
      name: '/bulk_cards',
      description: 'Add multiple cards from TXT or CSV file (Admin)',
      params: 'file:bulk_cards_sample.txt',
      requiresFile: true,
      acceptedFiles: '.txt,.csv'
    },
    {
      name: '/bulk_emails_main',
      description: 'Add multiple emails to main pool from TXT file (Admin)',
      params: 'file:bulk_emails_main_sample.txt',
      requiresFile: true,
      acceptedFiles: '.txt'
    },
    {
      name: '/bulk_emails_pump20',
      description: 'Add multiple emails to pump_20off25 pool from TXT file (Admin)',
      params: 'file:bulk_emails_pump20_sample.txt',
      requiresFile: true,
      acceptedFiles: '.txt'
    },
    {
      name: '/bulk_emails_pump25',
      description: 'Add multiple emails to pump_25off pool from TXT file (Admin)',
      params: 'file:bulk_emails_pump25_sample.txt',
      requiresFile: true,
      acceptedFiles: '.txt'
    },
    {
      name: '/remove_bulk_cards',
      description: 'Remove multiple cards from pool using TXT file (Admin)',
      params: 'file:bulk_cards_sample.txt',
      requiresFile: true,
      acceptedFiles: '.txt'
    },
    {
      name: '/remove_bulk_emails',
      description: 'Remove multiple emails from pools using TXT file (Admin)',
      params: 'file:bulk_emails_main_sample.txt pool:main',
      requiresFile: true,
      acceptedFiles: '.txt'
    }
  ];

  const filteredCommands = commands.filter(cmd => 
    cmd.name.toLowerCase().includes(input.toLowerCase()) && input.startsWith('/')
  );

  const handleFileChange = (event) => {
    const file = event.target.files[0];
    if (file) {
      setSelectedFile(file);
    }
  };

  const readFileContent = (file) => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => resolve(e.target.result);
      reader.onerror = (e) => reject(e);
      reader.readAsText(file);
    });
  };

  const isBulkCommand = (command) => {
    return command.startsWith('/bulk_') || command.startsWith('/remove_bulk_');
  };

  const useSampleFile = async (filename) => {
    try {
      const response = await fetch(`/sample-data/${filename}`);
      if (!response.ok) {
        throw new Error(`Failed to load ${filename}`);
      }
      const content = await response.text();

      // Create a fake file object
      const fakeFile = {
        name: filename,
        size: content.length,
        content: content
      };

      setSelectedFile(fakeFile);
    } catch (error) {
      alert('Error loading sample file: ' + error.message);
    }
  };

  const handleSubmit = async () => {
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

    // Handle file upload for bulk commands
    if (isBulkCommand(command)) {
      if (!selectedFile) {
        alert('Please select a file for bulk operations.');
        return;
      }

      try {
        let fileContent;
        if (selectedFile.content) {
          // This is a sample file that already has content
          fileContent = selectedFile.content;
        } else {
          // This is a real uploaded file
          fileContent = await readFileContent(selectedFile);
        }

        params.file = {
          name: selectedFile.name,
          content: fileContent,
          size: selectedFile.size
        };
      } catch (error) {
        alert('Error reading file: ' + error.message);
        return;
      }
    }

    onCommand(command, params);
    setInput('');
    setSelectedFile(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
    setShowSuggestions(false);
  };

  const handleKeyPress = async (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      await handleSubmit();
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
        {/* File Upload for Bulk Commands */}
        {isBulkCommand(input.split(' ')[0]) && (
          <div className="mb-3 p-3 bg-gray-700 rounded-lg border border-gray-600">
            <div className="flex items-center gap-2 mb-2">
              <span className="text-sm text-gray-300">📁 File Upload Required:</span>
              <span className="text-xs text-gray-400">
                {(() => {
                  const cmd = commands.find(c => c.name === input.split(' ')[0]);
                  return cmd?.acceptedFiles || '.txt';
                })()} files
              </span>
            </div>
            <input
              ref={fileInputRef}
              type="file"
              accept={(() => {
                const cmd = commands.find(c => c.name === input.split(' ')[0]);
                return cmd?.acceptedFiles || '.txt';
              })()}
              onChange={handleFileChange}
              className="w-full text-sm text-gray-300 file:mr-4 file:py-2 file:px-4 file:rounded file:border-0 file:text-sm file:font-medium file:bg-blue-600 file:text-white hover:file:bg-blue-700 file:cursor-pointer"
            />
            {selectedFile && (
              <div className="mt-2 text-xs text-green-400">
                ✅ Selected: {selectedFile.name} ({(selectedFile.size / 1024).toFixed(1)} KB)
                {selectedFile.content && <span className="ml-2 text-yellow-400">(Sample File)</span>}
              </div>
            )}
            <div className="mt-2 space-y-2">
              <div className="text-xs text-gray-400">
                💡 Quick options:
              </div>
              <div className="flex flex-wrap gap-2">
                {(() => {
                  const cmd = input.split(' ')[0];
                  const buttons = [];

                  if (cmd === '/bulk_cards' || cmd === '/remove_bulk_cards') {
                    buttons.push(
                      <button key="txt" onClick={() => useSampleFile('bulk_cards_sample.txt')} className="text-xs bg-blue-600 hover:bg-blue-700 text-white px-2 py-1 rounded">Use Sample TXT</button>,
                      <button key="csv" onClick={() => useSampleFile('bulk_cards_sample.csv')} className="text-xs bg-green-600 hover:bg-green-700 text-white px-2 py-1 rounded">Use Sample CSV</button>
                    );
                  } else if (cmd === '/bulk_emails_main' || (cmd === '/remove_bulk_emails' && !input.includes('pool:'))) {
                    buttons.push(
                      <button key="main" onClick={() => useSampleFile('bulk_emails_main_sample.txt')} className="text-xs bg-blue-600 hover:bg-blue-700 text-white px-2 py-1 rounded">Use Sample Emails</button>
                    );
                  } else if (cmd === '/bulk_emails_pump20') {
                    buttons.push(
                      <button key="pump20" onClick={() => useSampleFile('bulk_emails_pump20_sample.txt')} className="text-xs bg-purple-600 hover:bg-purple-700 text-white px-2 py-1 rounded">Use Sample Pump20</button>
                    );
                  } else if (cmd === '/bulk_emails_pump25') {
                    buttons.push(
                      <button key="pump25" onClick={() => useSampleFile('bulk_emails_pump25_sample.txt')} className="text-xs bg-indigo-600 hover:bg-indigo-700 text-white px-2 py-1 rounded">Use Sample Pump25</button>
                    );
                  }

                  return buttons;
                })()}
              </div>
              <div className="text-xs text-gray-500">
                Or download:
                <a href="/sample-data/bulk_cards_sample.txt" download className="text-blue-400 hover:underline">Cards (TXT)</a> |
                <a href="/sample-data/bulk_cards_sample.csv" download className="text-blue-400 hover:underline">Cards (CSV)</a> |
                <a href="/sample-data/bulk_emails_main_sample.txt" download className="text-blue-400 hover:underline">Emails</a>
              </div>
            </div>
          </div>
        )}

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
            disabled={!input.trim() || isProcessing || (isBulkCommand(input.split(' ')[0]) && !selectedFile)}
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
          {['/help', '/payments', '/wool_details', '/fusion_assist', '/pump_order', '/vcc'].map(cmd => (
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