import { useEffect, useRef } from 'react';

const ChatInterface = ({ messages, isTyping }) => {
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isTyping]);

  const formatTimestamp = (date) => {
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const MessageBubble = ({ message }) => {
    const isBot = message.type === 'bot';
    
    return (
      <div className={`flex gap-3 p-3 hover:bg-gray-750 ${isBot ? '' : 'bg-gray-800/30'}`}>
        {/* Avatar */}
        <div className="flex-shrink-0">
          <div className={`w-10 h-10 rounded-full flex items-center justify-center text-white font-semibold ${
            isBot ? 'bg-blue-600' : 'bg-green-600'
          }`}>
            {isBot ? '🤖' : '👤'}
          </div>
        </div>
        
        {/* Message Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <span className="font-semibold text-white">
              {isBot ? 'ZR Eats Bot' : 'You'}
            </span>
            {isBot && (
              <span className="bg-blue-600 text-white text-xs px-1.5 py-0.5 rounded font-medium">
                BOT
              </span>
            )}
            <span className="text-gray-400 text-xs">
              {formatTimestamp(message.timestamp)}
            </span>
          </div>
          
          {/* Message Text */}
          <div className="text-gray-100 whitespace-pre-wrap break-words">
            {message.content}
          </div>
          
          {/* Embed */}
          {message.embed && (
            <div className="mt-3 border-l-4 border-blue-500 bg-gray-800 rounded p-4 max-w-lg">
              {message.embed.title && (
                <h3 className="font-semibold text-white mb-2" style={{ color: message.embed.color }}>
                  {message.embed.title}
                </h3>
              )}
              {message.embed.description && (
                <p className="text-gray-300 text-sm mb-3">
                  {message.embed.description}
                </p>
              )}
              {message.embed.fields && message.embed.fields.map((field, index) => (
                <div key={index} className="mb-2">
                  {field.name && (
                    <div className="font-semibold text-white text-sm mb-1">
                      {field.name}
                    </div>
                  )}
                  <div className="text-gray-300 text-sm">
                    {field.value}
                  </div>
                </div>
              ))}
              {message.embed.footer && (
                <div className="text-gray-400 text-xs mt-3 pt-2 border-t border-gray-700">
                  {message.embed.footer}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    );
  };

  const TypingIndicator = () => (
    <div className="flex gap-3 p-3">
      <div className="flex-shrink-0">
        <div className="w-10 h-10 rounded-full bg-blue-600 flex items-center justify-center text-white font-semibold">
          🤖
        </div>
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-1">
          <span className="font-semibold text-white">ZR Eats Bot</span>
          <span className="bg-blue-600 text-white text-xs px-1.5 py-0.5 rounded font-medium">
            BOT
          </span>
        </div>
        <div className="flex items-center gap-1 text-gray-400">
          <div className="flex gap-1">
            <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
            <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
            <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
          </div>
          <span className="text-sm ml-2">is typing...</span>
        </div>
      </div>
    </div>
  );

  return (
    <div className="flex-1 overflow-y-auto bg-gray-900 scrollbar-thin scrollbar-track-gray-800 scrollbar-thumb-gray-600">
      <div className="min-h-full">
        {messages.map((message) => (
          <MessageBubble key={message.id} message={message} />
        ))}
        {isTyping && <TypingIndicator />}
        <div ref={messagesEndRef} />
      </div>
    </div>
  );
};

export default ChatInterface;