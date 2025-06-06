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
    emails: ['user1@example.com', 'user2@example.com']
  });

  const simulateCommand = async (command, params = {}) => {
    // Add user message
    const userMessage = {
      id: Date.now(),
      type: 'user',
      content: command,
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
    <div className="max-w-6xl mx-auto p-4">
      <div className="bg-gray-800 rounded-lg shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="bg-gray-900 p-4 border-b border-gray-700">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-600 rounded-full flex items-center justify-center">
              🤖
            </div>
            <div>
              <h2 className="text-white font-semibold">ZR Eats Bot Simulator</h2>
              <p className="text-gray-400 text-sm">Interactive Discord Bot Demo</p>
            </div>
          </div>
        </div>

        {/* Chat Area */}
        <div className="flex">
          {/* Main Chat */}
          <div className="flex-1 flex flex-col h-[700px]">
            <ChatInterface messages={messages} isTyping={isTyping} />
            <CommandInput onCommand={simulateCommand} />
          </div>
          
          {/* Sidebar - Pool Status */}
          <div className="w-64 bg-gray-750 border-l border-gray-700 p-4">
            <h3 className="text-white font-semibold mb-3">Pool Status</h3>
            <div className="space-y-3">
              <div>
                <p className="text-gray-400 text-sm">Cards: {pools.cards.length}</p>
                <div className="bg-gray-800 rounded p-2 text-xs text-gray-300">
                  {pools.cards.slice(0, 2).map((card, i) => (
                    <div key={i} className="font-bold">
                      {card.split(',')[0].slice(-4)}
                    </div>
                  ))}
                  {pools.cards.length > 2 && <div>+{pools.cards.length - 2} more</div>}
                </div>
              </div>
              <div>
                <p className="text-gray-400 text-sm">Emails: {pools.emails.length}</p>
                <div className="bg-gray-800 rounded p-2 text-xs text-gray-300">
                  {pools.emails.slice(0, 2).map((email, i) => (
                    <div key={i}>{email}</div>
                  ))}
                  {pools.emails.length > 2 && <div>+{pools.emails.length - 2} more</div>}
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