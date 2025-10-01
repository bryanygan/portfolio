import { useState, useRef, useEffect } from 'react';
import ChatInterface from './ChatInterface';
import CommandInput from './CommandInput';

const BotSimulator = () => {
  const [messages, setMessages] = useState([
    {
      id: 1,
      type: 'bot',
      content: 'Welcome to the ZR Eats Bot Simulator! 🤖\nTry commands like `/fusion_assist`, `/wool_order`, or `/payments`',
      timestamp: new Date(),
    }
  ]);
  const [isTyping, setIsTyping] = useState(false);
  const [pools, setPools] = useState({
    cards: ['3856273926573829,123', '3948374615728453,456'],
    emails: {
      main: ['user1@example.com', 'user2@example.com'],
      pump_20off25: ['pump1@20off.com', 'pump2@20off.com'],
      pump_25off: ['pump1@25off.com']
    }
  });

  const simulateCommand = async (command, params = {}) => {
    // Format the full command with parameters for display
    let fullCommand = command;
    if (Object.keys(params).length > 0) {
      const paramString = Object.entries(params)
        .map(([key, value]) => `${key}:${value}`)
        .join(' ');
      fullCommand = `${command} ${paramString}`;
    }

    // Add user message with full command
    const userMessage = {
      id: Date.now(),
      type: 'user',
      content: fullCommand,
      timestamp: new Date(),
    };
    setMessages(prev => [...prev, userMessage]);

    // Show typing indicator
    setIsTyping(true);
    
    // Simulate processing delay
    await new Promise(resolve => setTimeout(resolve, 1000 + Math.random() * 1000));
    
    try {
      const response = await fetch('/api/bot-simulate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ command, params, pools })
      });
      
      const result = await response.json();
      
      // Add bot response
      const botMessage = {
        id: Date.now() + 1,
        type: 'bot',
        content: result.response,
        embed: result.embed,
        timestamp: new Date(),
      };
      
      setMessages(prev => [...prev, botMessage]);
      
      // Update pools if changed
      if (result.updatedPools) {
        setPools(result.updatedPools);
      }
      
    } catch (error) {
      const errorMessage = {
        id: Date.now() + 1,
        type: 'bot',
        content: '❌ Error processing command. Please try again.',
        timestamp: new Date(),
      };
      setMessages(prev => [...prev, errorMessage]);
    }
    
    setIsTyping(false);
  };

  return (
    <div className="w-full max-w-7xl mx-auto p-2 sm:p-4">
      <div className="bg-gray-800 rounded-lg shadow-2xl overflow-hidden h-[80vh] max-h-[800px] flex flex-col">
        {/* Header */}
        <div className="bg-gray-900 p-3 sm:p-4 border-b border-gray-700 flex-shrink-0">
          <div className="flex items-center gap-2 sm:gap-3">
            <div className="w-8 h-8 sm:w-10 sm:h-10 bg-blue-600 rounded-full flex items-center justify-center text-lg sm:text-xl">
              🤖
            </div>
            <div className="min-w-0 flex-1">
              <h2 className="text-white font-semibold text-sm sm:text-base md:text-lg truncate">
                ZR Eats Bot Simulator
              </h2>
              <p className="text-gray-400 text-xs sm:text-sm truncate">
                Interactive Discord Bot Demo
              </p>
            </div>
          </div>
        </div>

        {/* Chat Area - Fixed Height */}
        <div className="flex flex-col lg:flex-row flex-1 min-h-0 overflow-hidden">
          {/* Main Chat */}
          <div className="flex-1 flex flex-col min-h-0 overflow-hidden">
            <ChatInterface messages={messages} isTyping={isTyping} />
            <CommandInput onCommand={simulateCommand} />
          </div>
          
          {/* Sidebar - Pool Status */}
          <div className="w-full lg:w-56 xl:w-64 bg-gray-750 border-t lg:border-t-0 lg:border-l border-gray-700 p-3 sm:p-4 flex-shrink-0 lg:max-h-full lg:overflow-y-auto">
            <h3 className="text-white font-semibold mb-2 sm:mb-3 text-sm sm:text-base">
              Pool Status
            </h3>
            <div className="space-y-2 sm:space-y-3">
              <div>
                <p className="text-gray-400 text-xs sm:text-sm">
                  Cards: {pools.cards.length}
                </p>
                <div className="bg-gray-800 rounded p-2 text-xs text-gray-300 mt-1 overflow-hidden">
                  {pools.cards.slice(0, 2).map((card, i) => (
                    <div key={i} className="font-bold truncate">
                      ****{card.split(',')[0].slice(-4)}
                    </div>
                  ))}
                  {pools.cards.length > 2 && (
                    <div className="text-gray-500">
                      +{pools.cards.length - 2} more
                    </div>
                  )}
                </div>
              </div>
              <div>
                <p className="text-gray-400 text-xs sm:text-sm">
                  Email Pools:
                </p>
                <div className="bg-gray-800 rounded p-2 text-xs text-gray-300 mt-1 overflow-hidden space-y-1">
                  {Object.entries(pools.emails).map(([poolName, emailArray]) => (
                    <div key={poolName}>
                      <div className="text-gray-400 font-semibold">
                        {poolName}: {emailArray.length}
                      </div>
                      {emailArray.slice(0, 1).map((email, i) => (
                        <div key={i} className="truncate text-gray-300 ml-2" title={email}>
                          {email}
                        </div>
                      ))}
                      {emailArray.length > 1 && (
                        <div className="text-gray-500 ml-2">
                          +{emailArray.length - 1} more
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BotSimulator;