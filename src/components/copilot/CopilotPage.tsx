import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useAuth } from '../../context/AuthContext';
import { copilotApi, type CopilotMessage, type CopilotConversation } from '../../lib/api';
import toast from 'react-hot-toast';
import { Send, Plus, Trash2, MessageSquare, Bot, User, Loader2 } from 'lucide-react';

interface Props {}

export default function CopilotPage(_props: Props) {
  const { user } = useAuth();
  const [conversations, setConversations] = useState<CopilotConversation[]>([]);
  const [activeConv, setActiveConv] = useState<string | null>(null);
  const [messages, setMessages] = useState<CopilotMessage[]>([]);
  const [input, setInput] = useState('');
  const [sending, setSending] = useState(false);
  const [loading, setLoading] = useState(true);
  const messagesEnd = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => messagesEnd.current?.scrollIntoView({ behavior: 'smooth' });

  const fetchConversations = useCallback(async () => {
    try {
      const convs = await copilotApi.listConversations();
      setConversations(convs);
      if (convs.length > 0 && !activeConv) {
        setActiveConv(convs[0].id);
      }
    } catch { toast.error('Failed to load conversations'); }
    finally { setLoading(false); }
  }, [activeConv]);

  const fetchMessages = useCallback(async () => {
    if (!activeConv) return;
    try {
      const msgs = await copilotApi.getMessages(activeConv);
      setMessages(msgs);
      setTimeout(scrollToBottom, 100);
    } catch {}
  }, [activeConv]);

  useEffect(() => { fetchConversations(); }, []);
  useEffect(() => { fetchMessages(); }, [activeConv]);

  const handleNewConversation = async () => {
    try {
      const conv = await copilotApi.createConversation({ context_type: 'general', title: 'New chat' });
      setConversations(prev => [conv, ...prev]);
      setActiveConv(conv.id);
      setMessages([]);
    } catch { toast.error('Failed to create conversation'); }
  };

  const handleSend = async () => {
    if (!input.trim() || sending) return;
    const content = input.trim();
    setInput('');
    setSending(true);

    const userMsg: CopilotMessage = { id: 'temp', conversation_id: activeConv || '', role: 'user', content, created_at: new Date().toISOString() };
    setMessages(prev => [...prev, userMsg]);

    try {
      if (!activeConv) {
        const conv = await copilotApi.createConversation({ context_type: 'general', title: content.slice(0, 50) });
        setActiveConv(conv.id);
        setConversations(prev => [conv, ...prev]);
      }

      const result = await copilotApi.sendMessage(activeConv || '', content);
      setMessages(prev => [...prev.slice(0, -1), userMsg, result]);
      setTimeout(scrollToBottom, 100);
    } catch { toast.error('Failed to send message'); }
    finally { setSending(false); }
  };

  const handleDelete = async (convId: string) => {
    try {
      await copilotApi.deleteConversation(convId);
      setConversations(prev => prev.filter(c => c.id !== convId));
      if (activeConv === convId) {
        setActiveConv(conversations.find(c => c.id !== convId)?.id || null);
      }
    } catch { toast.error('Failed to delete'); }
  };

  if (loading) return <div className="flex items-center justify-center h-64"><Loader2 className="w-8 h-8 text-blue-500 animate-spin" /></div>;

  return (
    <div className="flex h-[calc(100vh-8rem)] bg-zinc-900 rounded-xl border border-zinc-800 overflow-hidden">
      <div className="w-64 border-r border-zinc-800 flex flex-col">
        <div className="p-3 border-b border-zinc-800">
          <button onClick={handleNewConversation} className="w-full flex items-center justify-center gap-2 px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm transition-colors">
            <Plus className="w-4 h-4" /> New Chat
          </button>
        </div>
        <div className="flex-1 overflow-y-auto">
          {conversations.map(conv => (
            <div key={conv.id}
              onClick={() => setActiveConv(conv.id)}
              className={`flex items-center justify-between px-3 py-2.5 cursor-pointer border-b border-zinc-800/50 hover:bg-zinc-800/50 transition-colors ${activeConv === conv.id ? 'bg-zinc-800' : ''}`}>
              <div className="flex items-center gap-2 min-w-0">
                <MessageSquare className="w-4 h-4 text-zinc-500 shrink-0" />
                <span className="text-sm text-zinc-300 truncate">{conv.title || 'Chat'}</span>
              </div>
              <button onClick={(e) => { e.stopPropagation(); handleDelete(conv.id); }}
                className="text-zinc-600 hover:text-red-400 transition-colors">
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>
          ))}
        </div>
      </div>

      <div className="flex-1 flex flex-col">
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {messages.length === 0 && (
            <div className="flex flex-col items-center justify-center h-full text-center">
              <Bot className="w-16 h-16 text-blue-500/30 mb-4" />
              <h3 className="text-xl font-semibold text-white mb-2">TalentIQ Copilot</h3>
              <p className="text-zinc-400 max-w-md">Ask me about job search, resume tips, interview prep, or career advice.</p>
            </div>
          )}
          {messages.map((msg) => (
            <div key={msg.id} className={`flex gap-3 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
              {msg.role === 'assistant' && (
                <div className="w-8 h-8 rounded-full bg-blue-600/20 flex items-center justify-center shrink-0">
                  <Bot className="w-4 h-4 text-blue-400" />
                </div>
              )}
              <div className={`max-w-[70%] rounded-xl px-4 py-3 ${
                msg.role === 'user'
                  ? 'bg-blue-600 text-white'
                  : 'bg-zinc-800 text-zinc-200 border border-zinc-700'
              }`}>
                <p className="text-sm whitespace-pre-wrap">{msg.content}</p>
              </div>
              {msg.role === 'user' && (
                <div className="w-8 h-8 rounded-full bg-zinc-700 flex items-center justify-center shrink-0">
                  <User className="w-4 h-4 text-zinc-300" />
                </div>
              )}
            </div>
          ))}
          <div ref={messagesEnd} />
        </div>

        <div className="p-4 border-t border-zinc-800">
          <div className="flex gap-2">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && handleSend()}
              placeholder="Ask about jobs, resume, interviews..."
              className="flex-1 bg-zinc-800 border border-zinc-700 rounded-xl px-4 py-3 text-sm text-white placeholder-zinc-500 focus:outline-none focus:border-blue-500"
              disabled={sending}
            />
            <button
              onClick={handleSend}
              disabled={sending || !input.trim()}
              className="px-4 py-3 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-xl transition-colors"
            >
              {sending ? <Loader2 className="w-5 h-5 animate-spin" /> : <Send className="w-5 h-5" />}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
