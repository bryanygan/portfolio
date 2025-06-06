import { useEffect, useRef, useState } from 'react';

const ChatInterface = ({ messages, isTyping }) => {
  const containerRef = useRef(null);
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    const container = containerRef.current;
    if (container) {
      container.scrollTop = container.scrollHeight;
    }
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isTyping]);

  const formatTimestamp = (date) => {
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  // Component for code blocks with copy functionality
  const CodeBlock = ({ children, inline = false }) => {
    const [showCopy, setShowCopy] = useState(false);
    const [copied, setCopied] = useState(false);

    const handleCopy = async () => {
      try {
        await navigator.clipboard.writeText(children);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      } catch (err) {
        console.error('Failed to copy text: ', err);
      }
    };

    if (inline) {
      return (
        <code className="bg-gray-900 text-gray-100 px-1.5 py-0.5 rounded text-sm font-mono">
          {children}
        </code>
      );
    }

    return (
      <div 
        className="relative group"
        onMouseEnter={() => setShowCopy(true)}
        onMouseLeave={() => setShowCopy(false)}
      >
        <pre className="bg-gray-900 text-gray-100 p-3 rounded border border-gray-700 overflow-x-auto">
          <code className="font-mono text-sm whitespace-pre">
            {children}
          </code>
        </pre>
        {showCopy && (
          <button
            onClick={handleCopy}
            className="absolute top-2 right-2 bg-gray-700 hover:bg-gray-600 text-white p-1.5 rounded text-xs transition-colors flex items-center gap-1"
          >
            {copied ? (
              <>
                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                Copied!
              </>
            ) : (
              <>
                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                </svg>
                Copy
              </>
            )}
          </button>
        )}
      </div>
    );
  };

  // Function to parse text and identify code blocks
  const parseMessageContent = (content) => {
    const parts = [];
    const codeBlockRegex = /```\n?([\s\S]*?)\n?```/g;
    
    let lastIndex = 0;
    let match;

    // Reset regex lastIndex to avoid issues with global regex
    codeBlockRegex.lastIndex = 0;

    // First, handle code blocks
    while ((match = codeBlockRegex.exec(content)) !== null) {
      // Add text before code block
      if (match.index > lastIndex) {
        const beforeText = content.slice(lastIndex, match.index);
        parts.push(...parseInlineCode(beforeText));
      }
      
      // Add code block (trim any leading/trailing whitespace)
      parts.push({
        type: 'codeblock',
        content: match[1].trim(),
        key: `codeblock-${match.index}`
      });
      
      lastIndex = match.index + match[0].length;
    }
    
    // Add remaining text
    if (lastIndex < content.length) {
      const remainingText = content.slice(lastIndex);
      parts.push(...parseInlineCode(remainingText));
    }
    
    return parts;
  };

  // Function to parse inline code within text
  const parseInlineCode = (text) => {
    const parts = [];
    const inlineCodeRegex = /`([^`]+)`/g;
    let lastIndex = 0;
    let match;

    // Reset regex lastIndex
    inlineCodeRegex.lastIndex = 0;

    while ((match = inlineCodeRegex.exec(text)) !== null) {
      // Add text before inline code
      if (match.index > lastIndex) {
        const textPart = text.slice(lastIndex, match.index);
        if (textPart) {
          parts.push({
            type: 'text',
            content: textPart,
            key: `text-${lastIndex}-${Math.random()}`
          });
        }
      }
      
      // Add inline code
      parts.push({
        type: 'inlinecode',
        content: match[1],
        key: `inline-${match.index}-${Math.random()}`
      });
      
      lastIndex = match.index + match[0].length;
    }
    
    // Add remaining text
    if (lastIndex < text.length) {
      const remainingText = text.slice(lastIndex);
      if (remainingText) {
        parts.push({
          type: 'text',
          content: remainingText,
          key: `text-${lastIndex}-${Math.random()}`
        });
      }
    }

    // If no inline code was found, return the original text
    if (parts.length === 0 && text) {
      parts.push({
        type: 'text',
        content: text,
        key: `text-${Math.random()}`
      });
    }
    
    return parts;
  };

  // Alternative parsing approach - more robust
  const parseContent = (content) => {
    if (!content) return [];

    // First, split by triple backticks to handle code blocks
    const parts = content.split(/(```[\s\S]*?```)/g);
    const result = [];

    parts.forEach((part, index) => {
      if (part.startsWith('```') && part.endsWith('```')) {
        // This is a code block - remove the backticks and add as code block
        const codeContent = part.slice(3, -3).trim();
        if (codeContent) {
          result.push({
            type: 'codeblock',
            content: codeContent,
            key: `codeblock-${index}`
          });
        }
      } else if (part) {
        // This is regular text - check for inline code
        const inlineParts = part.split(/(`[^`]+`)/g);
        inlineParts.forEach((inlinePart, inlineIndex) => {
          if (inlinePart.startsWith('`') && inlinePart.endsWith('`') && inlinePart.length > 2) {
            // This is inline code
            const inlineContent = inlinePart.slice(1, -1);
            result.push({
              type: 'inlinecode',
              content: inlineContent,
              key: `inline-${index}-${inlineIndex}`
            });
          } else if (inlinePart) {
            // This is regular text
            result.push({
              type: 'text',
              content: inlinePart,
              key: `text-${index}-${inlineIndex}`
            });
          }
        });
      }
    });

    return result;
  };

  // Updated render function
  const renderContent = (content) => {
    const parts = parseContent(content);
    
    return parts.map((part) => {
      switch (part.type) {
        case 'codeblock':
          return <CodeBlock key={part.key}>{part.content}</CodeBlock>;
        case 'inlinecode':
          return <CodeBlock key={part.key} inline>{part.content}</CodeBlock>;
        case 'text':
          return <span key={part.key} className="whitespace-pre-wrap">{part.content}</span>;
        default:
          return null;
      }
    });
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
          
          {/* Message Text with formatted code */}
          <div className="text-gray-100 break-words">
            {renderContent(message.content)}
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
                <div className="text-gray-300 text-sm mb-3">
                  {renderContent(message.embed.description)}
                </div>
              )}
              {message.embed.fields && message.embed.fields.map((field, index) => (
                <div key={index} className="mb-3 last:mb-0">
                  {field.name && (
                    <div className="font-semibold text-white text-sm mb-1">
                      {field.name}
                    </div>
                  )}
                  <div className="text-gray-300 text-sm">
                    {renderContent(field.value)}
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
    <div
      ref={containerRef}
      className="flex-1 overflow-y-auto bg-gray-900 scrollbar-thin scrollbar-track-gray-800 scrollbar-thumb-gray-600"
    >
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