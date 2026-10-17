import React, { useState, useRef, useEffect } from 'react';
import {
  X,
  Sparkles,
  Send,
  Bot,
  User,
  Shield,
  BookOpen,
  ArrowRight,
  RefreshCw,
  HelpCircle,
  Lightbulb,
  ExternalLink,
  ChevronRight,
} from 'lucide-react';
import { useTax } from '../../context/TaxContext';

interface ChatMessage {
  id: string;
  role: 'user' | 'model';
  content: string;
  citations?: string[];
  suggestedFollowUps?: string[];
  timestamp: string;
}

const PRESET_QUERIES = [
  {
    label: 'Sports Shoes vs Equipment',
    query: 'Can I claim sports attire, running shoes, and gym memberships under Section 46(1)(q)?',
  },
  {
    label: '50% Client Meals Rule',
    query: 'How does the 50% restriction under Section 39(1)(l) apply to client business entertainment?',
  },
  {
    label: 'EV Charging Equipment',
    query: 'What is the statutory relief limit for EV charging hardware and facilities under Section 46(1)(v)?',
  },
  {
    label: 'Medical Check-up vs Serious Illness',
    query: 'Can I claim dental, complete medical check-up, and autism therapy under Section 46(1)(g)?',
  },
  {
    label: '7-Year Audit Vault Mandate',
    query: 'What does Section 82A ITA 1967 require regarding 7-year receipt retention and e-Invoicing?',
  },
];

interface TaxCopilotModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const TaxCopilotDialog: React.FC<{ onClose: () => void }> = ({ onClose }) => {
  const { persona, activeTaxYear } = useTax();

  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'welcome-1',
      role: 'model',
      content: `Hello! I am your **CukaiSmart LHDN Tax Copilot**, grounded in the Income Tax Act 1967 (ITA 1967), LHDN Public Rulings, and official Gazette schedules for **Assessment Year ${activeTaxYear}**.\n\nYou are currently exploring in **${persona === 'business' ? 'Form B (Business / SME)' : 'Form BE (Individual Taxpayer)'}** mode. How can I assist you with your tax relief claims or audit rules today?`,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      suggestedFollowUps: [
        'What are the maximum limits for lifestyle and sports relief?',
        'Can I claim my laptop or iPad for work?',
        'How does e-Invoicing (MyInvois) affect my receipt storage?',
      ],
    },
  ]);

  const [inputQuery, setInputQuery] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    inputRef.current?.focus();
  }, [messages]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  const handleSendMessage = async (textToSend?: string) => {
    const query = (textToSend || inputQuery).trim();
    if (!query || isLoading) return;

    const userMsg: ChatMessage = {
      id: `usr-${Date.now()}`,
      role: 'user',
      content: query,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    setMessages((prev) => [...prev, userMsg]);
    setInputQuery('');
    setIsLoading(true);

    try {
      const response = await fetch('/api/advisor/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: query,
          history: messages.map((m) => ({ role: m.role, content: m.content })),
          persona,
          activeTaxYear,
        }),
      });

      if (!response.ok) {
        const errJson = await response.json();
        throw new Error(errJson.error || 'Failed to reach AI Tax Copilot');
      }

      const data = await response.json();

      const aiMsg: ChatMessage = {
        id: `ai-${Date.now()}`,
        role: 'model',
        content: data.reply,
        citations: data.citations || [],
        suggestedFollowUps: data.suggestedFollowUps || [],
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };

      setMessages((prev) => [...prev, aiMsg]);
    } catch (e: any) {
      const errorMsg: ChatMessage = {
        id: `err-${Date.now()}`,
        role: 'model',
        content: `**Notice:** ${e?.message || 'Unable to consult LHDN Tax Copilot right now.'}. Please check your connection or try again in a moment.`,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };
      setMessages((prev) => [...prev, errorMsg]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleResetChat = () => {
    setMessages([
      {
        id: `welcome-${Date.now()}`,
        role: 'model',
        content: `Conversation reset. I'm ready to answer any questions on Malaysian Income Tax Act 1967, Form ${persona === 'business' ? 'B' : 'BE'} reliefs, and LHDN compliance for YA ${activeTaxYear}.`,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      },
    ]);
  };

  // Helper to highlight markdown formatting (bolding, lists, and citations)
  const renderMessageContent = (text: string) => {
    const lines = text.split('\n');
    return lines.map((line, idx) => {
      // Bold replacer
      const formatted = line.replace(/\*\*(.*?)\*\*/g, '<strong class="text-emerald-300 font-semibold">$1</strong>');
      const isBullet = line.trim().startsWith('•') || line.trim().startsWith('-');

      return (
        <p
          key={idx}
          className={`${isBullet ? 'pl-3 relative my-1 text-slate-300' : 'my-1.5'} text-xs sm:text-[13px] leading-relaxed`}
          dangerouslySetInnerHTML={{ __html: formatted }}
        />
      );
    });
  };

  return (
    <div
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/80 backdrop-blur-md"
    >
      <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-2xl w-full h-[88vh] flex flex-col shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="px-4 sm:px-6 py-3.5 border-b border-slate-800 flex items-center justify-between bg-gradient-to-r from-slate-900 via-slate-900 to-emerald-950/40 shrink-0">
          <div className="flex items-center gap-2.5 sm:gap-3 min-w-0 pr-2">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-emerald-500 to-teal-400 p-0.5 shadow-md shadow-emerald-950/60 flex items-center justify-center shrink-0">
              <div className="w-full h-full bg-slate-950 rounded-[10px] flex items-center justify-center">
                <Sparkles className="w-4 h-4 text-emerald-400" />
              </div>
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-1.5 sm:gap-2 flex-wrap">
                <h3 className="text-sm sm:text-base font-bold text-white tracking-tight truncate">
                  LHDN Tax Copilot
                </h3>
                <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 shrink-0">
                  YA {activeTaxYear}
                </span>
                <span className="hidden xs:inline-block text-[10px] font-semibold px-2 py-0.5 rounded-full bg-slate-800 text-slate-300 border border-slate-700 shrink-0">
                  {persona === 'business' ? 'Form B' : 'Form BE'}
                </span>
              </div>
              <p className="text-[10px] sm:text-[11px] text-slate-400 truncate">
                Income Tax Act 1967 &amp; Public Rulings
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
            <button
              onClick={handleResetChat}
              className="p-1.5 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 border border-transparent hover:border-slate-700 transition cursor-pointer"
              title="Reset conversation"
            >
              <RefreshCw className="w-4 h-4" />
            </button>
            <button
              onClick={onClose}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs border border-slate-700 transition cursor-pointer shadow-md hover:border-slate-600 active:scale-95"
              title="Close Copilot (Esc)"
              aria-label="Close Copilot"
            >
              <X className="w-4 h-4 text-slate-300" />
              <span>Close</span>
            </button>
          </div>
        </div>

        {/* Preset Prompt Chips Bar */}
        <div className="px-4 py-2 border-b border-slate-800/80 bg-slate-950/60 flex items-center gap-1.5 overflow-x-auto text-[11px]">
          <span className="text-slate-500 font-semibold uppercase text-[10px] shrink-0 pl-1 flex items-center gap-1">
            <Lightbulb className="w-3 h-3 text-amber-400" /> Quick Topics:
          </span>
          {PRESET_QUERIES.map((preset, idx) => (
            <button
              key={idx}
              onClick={() => handleSendMessage(preset.query)}
              disabled={isLoading}
              className="px-2.5 py-1 rounded-full bg-slate-900 border border-slate-800 text-slate-300 hover:text-emerald-300 hover:border-emerald-500/40 hover:bg-slate-800/80 transition whitespace-nowrap shrink-0 cursor-pointer disabled:opacity-50"
            >
              {preset.label}
            </button>
          ))}
        </div>

        {/* Message Stream */}
        <div className="flex-1 p-4 sm:p-5 overflow-y-auto space-y-4 text-slate-200">
          {messages.map((m) => {
            const isUser = m.role === 'user';
            return (
              <div
                key={m.id}
                className={`flex gap-3 ${isUser ? 'justify-end' : 'justify-start'}`}
              >
                {!isUser && (
                  <div className="w-7 h-7 rounded-lg bg-emerald-500/20 border border-emerald-500/30 text-emerald-400 flex items-center justify-center shrink-0 mt-0.5">
                    <Bot className="w-4 h-4" />
                  </div>
                )}

                <div
                  className={`max-w-[85%] rounded-2xl p-3.5 shadow-sm ${
                    isUser
                      ? 'bg-emerald-600 text-white rounded-tr-xs'
                      : 'bg-slate-950/80 border border-slate-800 rounded-tl-xs text-slate-200'
                  }`}
                >
                  <div className="space-y-1">
                    {isUser ? (
                      <p className="text-xs sm:text-[13px] leading-relaxed">{m.content}</p>
                    ) : (
                      renderMessageContent(m.content)
                    )}
                  </div>

                  {/* Statutory Citations Badge */}
                  {!isUser && m.citations && m.citations.length > 0 && (
                    <div className="mt-3 pt-2 border-t border-slate-800/80 flex flex-wrap items-center gap-1.5">
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1">
                        <BookOpen className="w-3 h-3 text-emerald-400" /> Statutory Citations:
                      </span>
                      {m.citations.map((c, idx) => (
                        <span
                          key={idx}
                          className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-500/10 border border-emerald-500/20 text-emerald-300"
                        >
                          {c}
                        </span>
                      ))}
                    </div>
                  )}

                  {/* Suggested Follow-Ups */}
                  {!isUser && m.suggestedFollowUps && m.suggestedFollowUps.length > 0 && (
                    <div className="mt-2.5 pt-2 border-t border-slate-800/60 space-y-1">
                      <span className="text-[10px] text-slate-400 font-semibold block">Suggested Questions:</span>
                      {m.suggestedFollowUps.map((fu, idx) => (
                        <button
                          key={idx}
                          onClick={() => handleSendMessage(fu)}
                          className="w-full text-left text-[11px] text-emerald-400 hover:text-emerald-300 flex items-center gap-1.5 py-0.5 hover:underline transition cursor-pointer"
                        >
                          <ChevronRight className="w-3 h-3 shrink-0" />
                          <span>{fu}</span>
                        </button>
                      ))}
                    </div>
                  )}

                  <div className="text-[9px] text-slate-500 mt-1.5 text-right font-mono">
                    {m.timestamp}
                  </div>
                </div>

                {isUser && (
                  <div className="w-7 h-7 rounded-lg bg-emerald-700 text-white flex items-center justify-center shrink-0 mt-0.5">
                    <User className="w-4 h-4" />
                  </div>
                )}
              </div>
            );
          })}

          {isLoading && (
            <div className="flex gap-3 justify-start">
              <div className="w-7 h-7 rounded-lg bg-emerald-500/20 border border-emerald-500/30 text-emerald-400 flex items-center justify-center shrink-0">
                <Bot className="w-4 h-4" />
              </div>
              <div className="p-3.5 rounded-2xl bg-slate-950/80 border border-slate-800 rounded-tl-xs flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse delay-100" />
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse delay-200" />
                <span className="text-xs text-slate-400 ml-1">Analyzing statutory rules under ITA 1967...</span>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Input Bar */}
        <div className="p-3 sm:p-4 border-t border-slate-800 bg-slate-950">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSendMessage();
            }}
            className="flex items-center gap-2"
          >
            <input
              ref={inputRef}
              type="text"
              value={inputQuery}
              onChange={(e) => setInputQuery(e.target.value)}
              placeholder="Ask anything (e.g. Can I claim my home internet, gym pass, or hospital bill?)"
              className="flex-1 bg-slate-900 border border-slate-800 rounded-xl px-4 py-2.5 text-xs sm:text-sm text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500 transition"
              disabled={isLoading}
            />
            <button
              type="submit"
              disabled={isLoading || !inputQuery.trim()}
              className="p-2.5 sm:px-4 sm:py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 disabled:opacity-40 disabled:cursor-not-allowed text-white font-semibold text-xs transition flex items-center gap-1.5 cursor-pointer shrink-0 shadow-md"
            >
              <Send className="w-4 h-4" />
              <span className="hidden sm:inline">Ask AI</span>
            </button>
          </form>
          <div className="flex items-center justify-between text-[10px] text-slate-400 mt-2 px-1">
            <span className="flex items-center gap-1">
              <Shield className="w-3 h-3 text-emerald-400" /> PDPA Shield Active: Identification data auto-sanitized.
            </span>
            <button
              type="button"
              onClick={onClose}
              className="text-slate-400 hover:text-white font-medium underline cursor-pointer"
            >
              Close Copilot
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export const TaxCopilotModal: React.FC<TaxCopilotModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;
  return <TaxCopilotDialog onClose={onClose} />;
};
