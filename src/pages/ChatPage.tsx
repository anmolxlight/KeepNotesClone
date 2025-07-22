import React, { useState, useRef, useEffect } from 'react';
import { 
  PaperAirplaneIcon, 
  SparklesIcon,
  ExclamationTriangleIcon
} from '@heroicons/react/24/outline';
import { useStore } from '../store/useStore';
import { generateId } from '../utils/helpers';
import { ChatMessage, ChatThread } from '../types';

const ChatPage: React.FC = () => {
  const { 
    chatThreads, 
    addChatThread, 
    updateChatThread,
    notes 
  } = useStore();
  
  const [currentThread, setCurrentThread] = useState<ChatThread | null>(null);
  const [inputMessage, setInputMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Initialize with a default thread
  useEffect(() => {
    if (chatThreads.length === 0) {
      const newThread: ChatThread = {
        id: generateId(),
        title: 'New Chat',
        messages: [
          {
            id: generateId(),
            text: "Hi! I'm your AI assistant. I can help you with your notes, answer questions, and assist with various tasks. How can I help you today?",
            isUser: false,
            timestamp: new Date(),
          }
        ],
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      addChatThread(newThread);
      setCurrentThread(newThread);
    } else {
      setCurrentThread(chatThreads[0]);
    }
  }, [chatThreads, addChatThread]);

  // Scroll to bottom when new messages are added
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [currentThread?.messages]);

  const handleSendMessage = async () => {
    if (!inputMessage.trim() || !currentThread || isLoading) return;

    const userMessage: ChatMessage = {
      id: generateId(),
      text: inputMessage,
      isUser: true,
      timestamp: new Date(),
    };

    // Add user message to thread
    const updatedMessages = [...currentThread.messages, userMessage];
    const updatedThread = {
      ...currentThread,
      messages: updatedMessages,
      updatedAt: new Date(),
    };
    
    updateChatThread(currentThread.id, updatedThread);
    setCurrentThread(updatedThread);
    setInputMessage('');
    setIsLoading(true);

    // Simulate AI response (in a real app, this would call an AI service)
    setTimeout(() => {
      const aiResponse = generateAIResponse(inputMessage);
      const aiMessage: ChatMessage = {
        id: generateId(),
        text: aiResponse,
        isUser: false,
        timestamp: new Date(),
      };

      const finalMessages = [...updatedMessages, aiMessage];
      const finalThread = {
        ...updatedThread,
        messages: finalMessages,
        updatedAt: new Date(),
      };

      updateChatThread(currentThread.id, finalThread);
      setCurrentThread(finalThread);
      setIsLoading(false);
    }, 1000 + Math.random() * 2000); // Simulate network delay
  };

  const generateAIResponse = (userInput: string): string => {
    const input = userInput.toLowerCase();
    
    // Note-related queries
    if (input.includes('note') || input.includes('notes')) {
      const activeNotes = notes.filter(n => !n.isDeleted && !n.isArchived);
      if (input.includes('how many')) {
        return `You currently have ${activeNotes.length} active notes. ${activeNotes.filter(n => n.isPinned).length} of them are pinned.`;
      }
      if (input.includes('create') || input.includes('new')) {
        return "I can help you organize your thoughts! You can create a new note by clicking the + button in the bottom right corner. What would you like your note to be about?";
      }
      if (input.includes('search') || input.includes('find')) {
        return "You can search through your notes using the search bar at the top. Just type keywords from the title, content, or labels you're looking for.";
      }
      return "I can help you manage your notes! You can create, edit, organize with labels, and search through them. What specific help do you need?";
    }
    
    // Label-related queries
    if (input.includes('label') || input.includes('tag')) {
      return "Labels are great for organizing your notes! You can create new labels in the Labels section, and assign them to notes while editing. They help you categorize and find related notes quickly.";
    }
    
    // General help
    if (input.includes('help') || input.includes('how')) {
      return "I'm here to help! This is a Google Keep clone with these features:\n\n• Create and edit notes\n• Organize with colors and labels\n• Search through your content\n• Archive or delete notes\n• AI assistance (that's me!)\n\nWhat would you like to know more about?";
    }
    
    // Greetings
    if (input.includes('hello') || input.includes('hi') || input.includes('hey')) {
      return `Hello! 👋 I'm your AI assistant for managing notes. I can help you organize, search, and make the most of your note-taking experience. How can I assist you today?`;
    }
    
    // Default responses
    const responses = [
      "That's an interesting question! While I'm currently a demo AI, I can help you with note management, organization tips, and general assistance. What would you like to know?",
      "I understand you're asking about that. As your notes assistant, I can help you organize your thoughts, manage your notes, and provide tips for better productivity. How can I help?",
      "Thanks for reaching out! I'm here to help with your note-taking and organization needs. Feel free to ask me about creating notes, using labels, or managing your content.",
      "Great question! I'm designed to help you get the most out of your note-taking experience. Whether it's organizing, searching, or creating new content, I'm here to assist!",
    ];
    
    return responses[Math.floor(Math.random() * responses.length)];
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const formatMessageText = (text: string) => {
    return text.split('\n').map((line, index) => (
      <React.Fragment key={index}>
        {line}
        {index < text.split('\n').length - 1 && <br />}
      </React.Fragment>
    ));
  };

  if (!currentThread) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-keep-primary"></div>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col h-full">
      {/* Header */}
      <div className="bg-keep-surface border-b border-keep-border px-6 py-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-gradient-to-br from-keep-primary to-purple-600 rounded-full flex items-center justify-center">
            <SparklesIcon className="w-6 h-6 text-white" />
          </div>
          <div>
            <h3 className="text-lg font-medium text-keep-text">AI Assistant</h3>
            <p className="text-keep-text-secondary text-sm">
              {isLoading ? 'Thinking...' : 'Ready to help with your notes'}
            </p>
          </div>
        </div>
      </div>

      {/* Beta Notice */}
      <div className="bg-blue-50 border-b border-blue-200 px-6 py-3">
        <div className="flex items-center gap-2 text-blue-800">
          <ExclamationTriangleIcon className="w-4 h-4" />
          <span className="text-sm">
            <strong>Beta Feature:</strong> This AI chat is a demo. Responses are simulated and not connected to a real AI service.
          </span>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-6 py-4 space-y-4">
        {currentThread.messages.map((message) => (
          <div
            key={message.id}
            className={`flex ${message.isUser ? 'justify-end' : 'justify-start'}`}
          >
            <div
              className={`max-w-[80%] px-4 py-3 rounded-lg ${
                message.isUser
                  ? 'bg-keep-primary text-white'
                  : 'bg-keep-surface border border-keep-border text-keep-text'
              }`}
            >
              <div className="text-sm leading-relaxed">
                {formatMessageText(message.text)}
              </div>
              <div
                className={`text-xs mt-2 ${
                  message.isUser ? 'text-blue-100' : 'text-keep-text-secondary'
                }`}
              >
                {message.timestamp.toLocaleTimeString()}
              </div>
            </div>
          </div>
        ))}
        
        {isLoading && (
          <div className="flex justify-start">
            <div className="bg-keep-surface border border-keep-border text-keep-text px-4 py-3 rounded-lg">
              <div className="flex items-center gap-2">
                <div className="flex space-x-1">
                  <div className="w-2 h-2 bg-keep-text-secondary rounded-full animate-bounce"></div>
                  <div className="w-2 h-2 bg-keep-text-secondary rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                  <div className="w-2 h-2 bg-keep-text-secondary rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                </div>
                <span className="text-sm text-keep-text-secondary">AI is thinking...</span>
              </div>
            </div>
          </div>
        )}
        
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="bg-keep-surface border-t border-keep-border p-4">
        <div className="flex gap-3">
          <div className="flex-1 relative">
            <textarea
              value={inputMessage}
              onChange={(e) => setInputMessage(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Ask me anything about your notes..."
              className="w-full px-4 py-3 bg-keep-bg border border-keep-border rounded-lg text-keep-text placeholder-keep-text-secondary focus:outline-none focus:border-keep-primary resize-none"
              rows={1}
              disabled={isLoading}
            />
          </div>
          <button
            onClick={handleSendMessage}
            disabled={!inputMessage.trim() || isLoading}
            className="px-4 py-3 bg-keep-primary text-white rounded-lg hover:bg-opacity-90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            <PaperAirplaneIcon className="w-5 h-5" />
          </button>
        </div>
        
        <div className="mt-2 text-xs text-keep-text-secondary">
          Press Enter to send, Shift+Enter for new line
        </div>
      </div>
    </div>
  );
};

export default ChatPage;