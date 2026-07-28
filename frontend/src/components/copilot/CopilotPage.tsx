import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useAuth } from '../../context/AuthContext';
import { copilotApi, type CopilotMessage, type CopilotConversation } from '../../lib/api';
import toast from 'react-hot-toast';
import { Send, Plus, Trash2, MessageSquare, Bot, User, Loader2, Sparkles, X, ChevronLeft } from 'lucide-react';

const quickPrompts = [
  "How should I prepare for a technical interview?",
  "Review my resume for ATS optimization",
  "What skills are most in-demand for software engineers?",
  "Help me write a follow-up email after an interview",
  "What salary should I expect for a mid-level React developer?",
  "How to negotiate a job offer?",
];

export default function CopilotPage() {
  const { user } = useAuth();
  const [conversations, setConversations] = useState<CopilotConversation[]>([]);
  const [activeConv, setActiveConv] = useState<string | null>(null);
  const [messages, setMessages] = useState<CopilotMessage[]>([]);
  const [input, setInput] = useState('');
  const [sending, setSending] = useState(false);
  const [loading, setLoading] = useState(true);
  const [showSidebar, setShowSidebar] = useState(true);
  const messagesEnd = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  const scrollToBottom = () => messagesEnd.current?.scrollIntoView({ behavior: 'smooth' });

  const fetchConversations = useCallback(async () => {
    try {
      const convs = await copilotApi.listConversations();
      setConversations(convs);
    } catch { /* silent */ }
    finally { setLoading(false); }
  }, []);

  const fetchMessages = useCallback(async () => {
    if (!activeConv) { setMessages([]); return; }
    try {
      const msgs = await copilotApi.getMessages(activeConv);
      setMessages(msgs);
      setTimeout(scrollToBottom, 100);
    } catch { /* silent */ }
  }, [activeConv]);

  useEffect(() => { fetchConversations(); }, []);
  useEffect(() => { fetchMessages(); }, [activeConv]);

  const handleNewConversation = async () => {
    try {
      const conv = await copilotApi.createConversation({ context_type: 'general', title: 'New chat' });
      setConversations(prev => [conv, ...prev]);
      setActiveConv(conv.id);
      setMessages([]);
      inputRef.current?.focus();
    } catch { toast.error('Failed to create conversation'); }
  };

  const sendMessage = async (content: string) => {
    if (!content.trim() || sending) return;
    setSending(true);

    const userMsg: CopilotMessage = {
      id: 'temp-' + Date.now(),
      conversation_id: activeConv || '',
      role: 'user',
      content: content.trim(),
      created_at: new Date().toISOString(),
    };
    setMessages(prev => [...prev, userMsg]);
    setInput('');

    try {
      let convId = activeConv;
      if (!convId) {
        const conv = await copilotApi.createConversation({ context_type: 'general', title: content.trim().slice(0, 50) });
        convId = conv.id;
        setActiveConv(convId);
        setConversations(prev => [conv, ...prev]);
      }

      const result = await copilotApi.sendMessage(convId, content.trim());
      setMessages(prev => [...prev.filter(m => m.id !== userMsg.id), userMsg, result]);
      setTimeout(scrollToBottom, 100);
    } catch {
      toast.error('Failed to get response');
      setMessages(prev => prev.filter(m => m.id !== userMsg.id));
    } finally { setSending(false); }
  };

  const handleSend = () => sendMessage(input);

  const handleQuickPrompt = (prompt: string) => {
    setInput(prompt);
    sendMessage(prompt);
  };

  const handleDelete = async (convId: string) => {
    try {
      await copilotApi.deleteConversation(convId);
      setConversations(prev => prev.filter(c => c.id !== convId));
      if (activeConv === convId) {
        setActiveConv(null);
        setMessages([]);
      }
      toast.success('Conversation deleted');
    } catch { toast.error('Failed to delete'); }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-[calc(100vh-8rem)]">
        <Loader2 className="w-8 h-8 text-blue-500 animate-spin" />
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="flex h-[calc(100vh-10rem)] bg-zinc-900 rounded-2xl border border-zinc-800 overflow-hidden shadow-2xl">
        {/* Sidebar */}
        <div className={`${showSidebar ? 'w-72' : 'w-0'} border-r border-zinc-800 flex flex-col transition-all duration-300 overflow-hidden shrink-0`}>
          <div className="p-4 border-b border-zinc-800">
            <button
              onClick={handleNewConversation}
              className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-sm font-semibold transition-all shadow-lg shadow-blue-600/20"
            >
              <Plus className="w-4 h-4" /> New Chat
            </button>
          </div>
          <div className="flex-1 overflow-y-auto p-2 space-y-1">
            {conversations.length === 0 ? (
              <p className="text-zinc-600 text-xs text-center py-4">No conversations yet</p>
            ) : (
              conversations.map(conv => (
                <div
                  key={conv.id}
                  onClick={() => setActiveConv(conv.id)}
                  className={`group flex items-center justify-between px-3 py-2.5 rounded-xl cursor-pointer transition-all ${
                    activeConv === conv.id
                      ? 'bg-blue-600/15 border border-blue-500/30 text-blue-300'
                      : 'text-zinc-400 hover:bg-zinc-800 hover:text-zinc-200 border border-transparent'
                  }`}
                >
                  <div className="flex items-center gap-2 min-w-0">
                    <MessageSquare className="w-4 h-4 shrink-0 opacity-50" />
                    <span className="text-sm truncate">{conv.title || 'New chat'}</span>
                  </div>
                  <button
                    onClick={(e) => { e.stopPropagation(); handleDelete(conv.id); }}
                    className="opacity-0 group-hover:opacity-100 text-zinc-600 hover:text-red-400 transition-all p-1"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))
            )}
          </div>
          <div className="p-3 border-t border-zinc-800">
            <div className="flex items-center gap-2 px-3 py-2 bg-zinc-800/50 rounded-xl">
              <div className="w-7 h-7 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
                <Bot className="w-4 h-4 text-white" />
              </div>
              <div>
                <p className="text-xs font-semibold text-zinc-200">TalentIQ Copilot</p>
                <p className="text-[10px] text-zinc-500">Powered by Llama 3.3 70B</p>
              </div>
            </div>
          </div>
        </div>

        {/* Chat Area */}
        <div className="flex-1 flex flex-col min-w-0">
          {/* Header */}
          <div className="flex items-center gap-3 px-4 py-3 border-b border-zinc-800 bg-zinc-900/80 backdrop-blur">
            <button onClick={() => setShowSidebar(!showSidebar)} className="p-1.5 hover:bg-zinc-800 rounded-lg text-zinc-400 hover:text-white transition-colors lg:hidden">
              {showSidebar ? <ChevronLeft className="w-5 h-5" /> : <MessageSquare className="w-5 h-5" />}
            </button>
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
              <Bot className="w-4 h-4 text-white" />
            </div>
            <div>
              <h2 className="text-sm font-semibold text-white">TalentIQ Copilot</h2>
              <p className="text-[10px] text-zinc-500">AI career assistant — ask about jobs, resumes, interviews</p>
            </div>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto px-4 py-6 space-y-6">
            {messages.length === 0 && (
              <div className="flex flex-col items-center justify-center h-full text-center">
                <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-blue-500/20 to-purple-500/20 border border-blue-500/20 flex items-center justify-center mb-6">
                  <Sparkles className="w-10 h-10 text-blue-400" />
                </div>
                <h3 className="text-2xl font-bold text-white mb-2">What can I help with?</h3>
                <p className="text-zinc-400 max-w-md mb-8">
                  I can help with job search strategy, resume improvement, interview preparation, and career advice.
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-w-2xl w-full">
                  {quickPrompts.map((prompt, i) => (
                    <button
                      key={i}
                      onClick={() => handleQuickPrompt(prompt)}
                      className="text-left px-4 py-3 bg-zinc-800/50 border border-zinc-700/50 rounded-xl text-sm text-zinc-300 hover:bg-zinc-800 hover:border-zinc-600 transition-all"
                    >
                      {prompt}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {messages.map((msg) => (
              <div key={msg.id} className={`flex gap-3 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                {msg.role === 'assistant' && (
                  <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center shrink-0 mt-0.5">
                    <Bot className="w-4 h-4 text-white" />
                  </div>
                )}
                <div className={`max-w-[75%] rounded-2xl px-5 py-3.5 ${
                  msg.role === 'user'
                    ? 'bg-blue-600 text-white rounded-br-md'
                    : 'bg-zinc-800 text-zinc-200 border border-zinc-700/50 rounded-bl-md'
                }`}>
                  <p className="text-sm leading-relaxed whitespace-pre-wrap">{msg.content}</p>
                </div>
                {msg.role === 'user' && (
                  <div className="w-8 h-8 rounded-full bg-zinc-700 flex items-center justify-center shrink-0 mt-0.5">
                    <User className="w-4 h-4 text-zinc-300" />
                  </div>
                )}
              </div>
            ))}
            {sending && (
              <div className="flex gap-3">
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center shrink-0">
                  <Bot className="w-4 h-4 text-white" />
                </div>
                <div className="bg-zinc-800 border border-zinc-700/50 rounded-2xl rounded-bl-md px-5 py-3.5">
                  <div className="flex items-center gap-1.5">
                    <div className="w-2 h-2 bg-blue-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                    <div className="w-2 h-2 bg-blue-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                    <div className="w-2 h-2 bg-blue-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                  </div>
                </div>
              </div>
            )}
            <div ref={messagesEnd} />
          </div>

          {/* Input */}
          <div className="px-4 pb-4 pt-2">
            <div className="flex items-end gap-3 bg-zinc-800 border border-zinc-700 rounded-2xl p-3 focus-within:border-blue-500/50 transition-colors">
              <textarea
                ref={inputRef}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    handleSend();
                  }
                }}
                placeholder="Ask about jobs, resume, interviews..."
                className="flex-1 bg-transparent text-sm text-white placeholder-zinc-500 focus:outline-none resize-none min-h-[40px] max-h-[120px]"
                rows={1}
                disabled={sending}
              />
              <button
                onClick={handleSend}
                disabled={sending || !input.trim()}
                className="p-2.5 bg-blue-600 hover:bg-blue-700 disabled:opacity-30 disabled:cursor-not-allowed text-white rounded-xl transition-all shrink-0"
              >
                {sending ? <Loader2 className="w-5 h-5 animate-spin" /> : <Send className="w-5 h-5" />}
              </button>
            </div>
            <p className="text-[10px] text-zinc-600 text-center mt-2">
              TalentIQ Copilot may produce inaccurate information. Verify important details.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
