import { Send, MessageCircle, User, Bot, Loader } from "lucide-react";
import React, { useState, useRef, useEffect } from 'react';
import { chatServiceChatWithDocument, chatServiceGetDocumentInfo } from '@/lib/sdk';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
// Clean layout without cards for OpenAI-style design
import { ScrollArea } from '@/components/ui/scroll-area';

import { useToast } from '@/hooks/use-toast';

interface Message {
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

interface ChatWidgetProps {
  documentId: string;
  documentTitle: string;
}

export default function ChatWidget({ documentId, documentTitle }: ChatWidgetProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [documentInfo, setDocumentInfo] = useState<any>(null);
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  // Fetch document info on mount
  useEffect(() => {
    const fetchDocumentInfo = async () => {
      try {
        const response = await chatServiceGetDocumentInfo({
          body: { document_id: documentId },
        });
        setDocumentInfo(response.data);
      } catch (error) {
        console.error('Error fetching document info:', error);
      }
    };

    fetchDocumentInfo();
  }, [documentId]);

  // Auto-scroll to bottom when new messages are added
  useEffect(() => {
    if (scrollAreaRef.current) {
      scrollAreaRef.current.scrollTop = scrollAreaRef.current.scrollHeight;
    }
  }, [messages]);

  // Add welcome message when component mounts
  useEffect(() => {
    setMessages([
      {
        role: 'assistant',
        content: `Welcome! I've analyzed "${documentTitle}" and I'm ready to help you explore its content. Ask me any questions about the document and I'll provide detailed answers with page references.`,
        timestamp: new Date(),
      },
    ]);
  }, [documentTitle]);

  const handleSendMessage = async () => {
    if (!inputValue.trim() || isLoading) return;

    const userMessage: Message = {
      role: 'user',
      content: inputValue.trim(),
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, userMessage]);
    setInputValue('');
    setIsLoading(true);

    try {
      // Prepare messages for API call
      const apiMessages = [...messages, userMessage].map(msg => ({
        role: msg.role,
        content: msg.content,
      }));

      const response = await chatServiceChatWithDocument({
        body: {
          messages: apiMessages,
          document_id: documentId,
        },
      });

      if (response.data) {
        const assistantMessage: Message = {
          role: 'assistant',
          content: response.data,
          timestamp: new Date(),
        };
        setMessages(prev => [...prev, assistantMessage]);
      } else {
        throw new Error('No response received');
      }
    } catch (error) {
      console.error('Chat error:', error);
      toast({
        title: "Chat error",
        description: "Failed to get a response. Please try again.",
        variant: "destructive",
      });
      
      const errorMessage: Message = {
        role: 'assistant',
        content: 'I apologize, but I encountered an error processing your question. Please try again.',
        timestamp: new Date(),
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
      // Focus back on input
      inputRef.current?.focus();
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  return (
    <div className="h-full flex flex-col bg-gray-900">
      {/* Header - Modern dark theme with gradient */}
      <div className="border-b border-gray-700 px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-r from-purple-500 to-orange-500 flex items-center justify-center">
              <MessageCircle className="w-4 h-4 text-white" />
            </div>
            <h2 className="text-lg font-medium text-white">AI Assistant</h2>
          </div>
        </div>
        {documentInfo && (
          <p className="text-sm text-gray-400 mt-2">
            {documentInfo.chunk_count} sections analyzed • Ready to help
          </p>
        )}
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-hidden">
        <ScrollArea className="h-full px-6 py-4" ref={scrollAreaRef}>
          <div className="space-y-6">
            {messages.map((message, index) => (
              <div key={index} className="space-y-2">
                <div className="flex items-center space-x-2">
                  {message.role === 'assistant' ? (
                    <>
                      <div className="w-6 h-6 rounded-full bg-gradient-to-r from-purple-500 to-orange-500 flex items-center justify-center">
                        <span className="text-white text-xs font-medium">AI</span>
                      </div>
                      <span className="text-sm font-medium text-white">Assistant</span>
                    </>
                  ) : (
                    <>
                      <div className="w-6 h-6 rounded-full bg-gray-600 flex items-center justify-center">
                        <User className="w-3 h-3 text-white" />
                      </div>
                      <span className="text-sm font-medium text-white">You</span>
                    </>
                  )}
                </div>
                <div className="ml-8">
                  <div className={`rounded-lg px-4 py-3 ${
                    message.role === 'assistant' 
                      ? 'bg-gray-800 border border-gray-700' 
                      : 'bg-gray-700 border border-gray-600'
                  }`}>
                    <p className="text-white leading-relaxed whitespace-pre-wrap text-sm">{message.content}</p>
                  </div>
                </div>
              </div>
            ))}
            
            {isLoading && (
              <div className="space-y-2">
                <div className="flex items-center space-x-2">
                  <div className="w-6 h-6 rounded-full bg-gradient-to-r from-purple-500 to-orange-500 flex items-center justify-center">
                    <span className="text-white text-xs font-medium">AI</span>
                  </div>
                  <span className="text-sm font-medium text-white">Assistant</span>
                </div>
                <div className="ml-8">
                  <div className="bg-gray-800 border border-gray-700 rounded-lg px-4 py-3">
                    <div className="flex items-center space-x-2">
                      <div className="w-4 h-4 border-2 border-purple-500 border-t-transparent rounded-full animate-spin"></div>
                      <span className="text-sm text-gray-200">Analyzing document...</span>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </ScrollArea>
      </div>

      {/* Input - Modern dark theme */}
      <div className="border-t border-gray-700 p-6">
        <div className="space-y-3">
          <div className="relative">
            <Input
              ref={inputRef}
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Ask a question about this document..."
              disabled={isLoading}
              className="pr-12 py-3 text-sm bg-gray-800 border-gray-600 text-white placeholder-gray-400 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            />
            <Button
              onClick={handleSendMessage}
              disabled={!inputValue.trim() || isLoading}
              size="sm"
              className="absolute right-2 top-1/2 transform -translate-y-1/2 h-8 w-8 p-0 bg-gradient-to-r from-purple-500 to-orange-500 hover:from-purple-600 hover:to-orange-600 border-0"
            >
              {isLoading ? (
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
              ) : (
                <Send className="w-4 h-4" />
              )}
            </Button>
          </div>
          <p className="text-xs text-gray-400">
            AI responses include page references from your document
          </p>
        </div>
      </div>
    </div>
  );
}