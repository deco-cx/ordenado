import React, { useState, useRef, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from './ui/dialog';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { useUIStore, useWorkflowStore } from '../store';
import { Bot, Edit3, Send, Sparkles, Code2, Zap, X } from 'lucide-react';
import { installedApps } from '../data/installedApps';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  actions?: Array<{
    type: 'edit' | 'execute' | 'suggest';
    description: string;
  }>;
}

const AgentChatModal: React.FC = () => {
  const { isAgentChatOpen, agentMode, closeAgentChat, selectedNodeIds } = useUIStore();
  const { nodes } = useWorkflowStore();
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  
  const selectedNodes = nodes.filter(n => selectedNodeIds.has(n.id));
  
  // Initialize with a welcome message when opened
  useEffect(() => {
    if (isAgentChatOpen && messages.length === 0) {
      const selectedTools = selectedNodes.map(n => n.data.title).join(', ');
      
      const welcomeMessage: Message = {
        id: '1',
        role: 'assistant',
        content: agentMode === 'edit' 
          ? `🎨 Hi! I'm your AI workflow editor. I can see you've selected **${selectedNodes.length} tool${selectedNodes.length > 1 ? 's' : ''}** (${selectedTools}). 

I can help you:
• Modify input parameters and configurations
• Add data transformations between tools
• Optimize the workflow structure
• Add error handling and conditional logic

What would you like to change about this part of your workflow?`
          : `🤖 Hello! I'm an AI agent with access to **${selectedNodes.length} tool${selectedNodes.length > 1 ? 's' : ''}** (${selectedTools}).

I can:
• Execute these tools in sequence or parallel
• Transform data between tool calls
• Make decisions based on outputs
• Handle complex multi-step tasks

What task would you like me to help you with using these tools?`,
        timestamp: new Date(),
        actions: agentMode === 'edit' 
          ? [
              { type: 'suggest', description: 'Suggested optimizations available' }
            ]
          : [
              { type: 'execute', description: 'Ready to execute tools' }
            ]
      };
      
      setMessages([welcomeMessage]);
    }
  }, [isAgentChatOpen, agentMode, selectedNodes, messages.length]);
  
  // Auto scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);
  
  const handleSend = async () => {
    if (!input.trim()) return;
    
    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: input,
      timestamp: new Date()
    };
    
    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsTyping(true);
    
    // Simulate AI response
    setTimeout(() => {
      const responses = agentMode === 'edit' 
        ? [
            `I understand you want to ${input}. Let me analyze the selected tools and suggest some improvements...`,
            `Based on your request, I can see that the **${selectedNodes[0]?.data.title}** tool could be optimized by adding input validation. Would you like me to implement this?`,
            `I've identified a pattern where we could combine these tools into a more efficient workflow. Here's what I suggest:\n\n1. Add a transformation step between tools\n2. Implement error handling\n3. Cache intermediate results\n\nShall I proceed with these changes?`
          ]
        : [
            `I'll help you ${input} using the selected tools. Let me break this down into steps...`,
            `To accomplish this task, I'll:\n\n1. First use **${selectedNodes[0]?.data.title}** to gather initial data\n2. Process the results\n3. Pass them to the next tool\n\nStarting execution now...`,
            `✅ Successfully executed the workflow!\n\nHere's what happened:\n• Tool 1 returned 15 items\n• Filtered down to 8 relevant results\n• Final output saved to database\n\nWould you like me to run this again with different parameters?`
          ];
      
      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: responses[Math.floor(Math.random() * responses.length)],
        timestamp: new Date(),
        actions: agentMode === 'edit'
          ? [
              { type: 'edit', description: 'Apply suggested changes' },
              { type: 'suggest', description: 'View alternative approach' }
            ]
          : [
              { type: 'execute', description: 'Run workflow again' },
              { type: 'suggest', description: 'Modify parameters' }
            ]
      };
      
      setMessages(prev => [...prev, assistantMessage]);
      setIsTyping(false);
    }, 1000 + Math.random() * 1000);
  };
  
  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };
  
  return (
    <Dialog open={isAgentChatOpen} onOpenChange={closeAgentChat}>
      <DialogContent className="max-w-2xl h-[600px] flex flex-col p-0">
        <DialogHeader className="px-6 py-4 border-b">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              {agentMode === 'edit' ? (
                <div className="w-10 h-10 rounded-full bg-purple-100 flex items-center justify-center">
                  <Edit3 className="w-5 h-5 text-purple-600" />
                </div>
              ) : (
                <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center">
                  <Bot className="w-5 h-5 text-blue-600" />
                </div>
              )}
              <div>
                <DialogTitle>
                  {agentMode === 'edit' ? 'AI Workflow Editor' : 'AI Agent Assistant'}
                </DialogTitle>
                <DialogDescription className="flex items-center gap-2 mt-1">
                  <Sparkles className="w-3 h-3" />
                  {agentMode === 'edit' 
                    ? `Editing ${selectedNodes.length} selected tool${selectedNodes.length > 1 ? 's' : ''}`
                    : `Agent with ${selectedNodes.length} tool${selectedNodes.length > 1 ? 's' : ''} capability`
                  }
                </DialogDescription>
              </div>
            </div>
            <Button
              variant="ghost"
              size="icon"
              onClick={closeAgentChat}
              className="rounded-full"
            >
              <X className="w-4 h-4" />
            </Button>
          </div>
        </DialogHeader>
        
        <div className="flex-1 overflow-y-auto px-6 py-4 space-y-4">
          {/* Selected tools display */}
          <div className="flex flex-wrap gap-2 pb-2 border-b">
            {selectedNodes.map(node => {
              let app = null;
              if (node.type === 'tool' && node.data.kind === 'tool') {
                const toolData = node.data as any; // Type assertion for tool data
                app = installedApps.find(a => a.id === toolData.ref.appId);
              }
              return (
                <div
                  key={node.id}
                  className="flex items-center gap-2 px-3 py-1 bg-slate-100 rounded-full text-sm"
                >
                  <span>{app?.icon || '💻'}</span>
                  <span className="font-medium">{node.data.title}</span>
                </div>
              );
            })}
          </div>
          
          {/* Messages */}
          {messages.map(message => (
            <div
              key={message.id}
              className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <div className={`max-w-[80%] ${message.role === 'user' ? 'order-2' : 'order-1'}`}>
                <div
                  className={`rounded-lg px-4 py-3 ${
                    message.role === 'user'
                      ? 'bg-blue-600 text-white'
                      : 'bg-slate-100 text-slate-800'
                  }`}
                >
                  <p className="whitespace-pre-wrap">{message.content}</p>
                </div>
                
                {/* Action buttons */}
                {message.actions && (
                  <div className="flex gap-2 mt-2">
                    {message.actions.map((action, idx) => (
                      <Button
                        key={idx}
                        size="sm"
                        variant="outline"
                        className="text-xs"
                        onClick={() => {
                          const actionMessage: Message = {
                            id: Date.now().toString(),
                            role: 'assistant',
                            content: `✨ ${action.description} - This would ${action.type} the workflow in a real implementation.`,
                            timestamp: new Date()
                          };
                          setMessages(prev => [...prev, actionMessage]);
                        }}
                      >
                        {action.type === 'edit' && <Edit3 className="w-3 h-3 mr-1" />}
                        {action.type === 'execute' && <Zap className="w-3 h-3 mr-1" />}
                        {action.type === 'suggest' && <Sparkles className="w-3 h-3 mr-1" />}
                        {action.description}
                      </Button>
                    ))}
                  </div>
                )}
                
                <div className="text-xs text-slate-500 mt-1">
                  {message.timestamp.toLocaleTimeString()}
                </div>
              </div>
            </div>
          ))}
          
          {isTyping && (
            <div className="flex justify-start">
              <div className="bg-slate-100 rounded-lg px-4 py-3">
                <div className="flex gap-1">
                  <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce" />
                  <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce delay-100" />
                  <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce delay-200" />
                </div>
              </div>
            </div>
          )}
          
          <div ref={messagesEndRef} />
        </div>
        
        <div className="px-6 py-4 border-t">
          <div className="flex gap-2">
            <Input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder={
                agentMode === 'edit'
                  ? "Describe how you'd like to modify this workflow..."
                  : "What task would you like me to perform?"
              }
              className="flex-1"
              disabled={isTyping}
            />
            <Button onClick={handleSend} disabled={!input.trim() || isTyping}>
              <Send className="w-4 h-4" />
            </Button>
          </div>
          <div className="flex items-center gap-4 mt-2 text-xs text-slate-500">
            <div className="flex items-center gap-1">
              <Code2 className="w-3 h-3" />
              <span>Context-aware suggestions</span>
            </div>
            <div className="flex items-center gap-1">
              <Zap className="w-3 h-3" />
              <span>Real-time execution</span>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default AgentChatModal; 