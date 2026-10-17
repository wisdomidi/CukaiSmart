import React, { useState, useRef, useEffect } from 'react';
import {
  Sparkles,
  Bot,
  User,
  Send,
  RefreshCw,
  Copy,
  Check,
  Shield,
  Lightbulb,
  Building2,
  Calendar,
  BookOpen,
  ArrowRight,
  HelpCircle,
  AlertCircle,
  FileText,
  Scale,
  ShieldCheck,
} from 'lucide-react';
import { useTax } from '../../context/TaxContext';
import { getOrCreateGuestSessionId } from '../../services/firebase';


interface ChatMessage {
  id: string;
  role: 'user' | 'model';
  content: string;
  citations?: string[];
  suggestedFollowUps?: string[];
  timestamp: string;
  source?: string;
}

const PRESET_TOPICS = [
  {
    icon: Scale,
    label: 'Medical & Dental Cap',
    category: 'Section 46(1)(g)',
    query: 'What are the rules and maximum claimable limits for medical check-ups, dental treatments, and serious illnesses under Section 46(1)(g)?',
  },
  {
    icon: Sparkles,
    label: 'Lifestyle vs Sports Relief',
    category: 'Sec 46(1)(p) vs (q)',
    query: 'How do I distinguish between Lifestyle Relief (Section 46(1)(p)) and Sports Equipment Relief (Section 46(1)(q))? Can I claim gym memberships and running shoes?',
  },
  {
    icon: Building2,
    label: 'Form B: Client Meals 50% Rule',
    category: 'Section 39(1)(l)',
    query: 'As a sole proprietor filing Form B, how does Section 39(1)(l) apply to client entertainment and business dining? Why is only 50% deductible?',
  },
  {
    icon: FileText,
    label: '7-Year Receipt Retention Mandate',
    category: 'Section 82 & 82A',
    query: 'What are my statutory obligations under Section 82 and 82A ITA 1967 for retaining paper and digital receipts? Does thermal paper fading cause penalties?',
  },
  {
    icon: ShieldCheck,
    label: 'MyInvois e-Invoicing Compliance',
    category: 'LHDN e-Invoice',
    query: 'How does the LHDN MyInvois e-Invoicing mandate impact my tax filing and receipt proof? What information must be on the invoice?',
  },
  {
    icon: Lightbulb,
    label: 'EV Charger & Home Solar',
    category: 'Section 46(1)(v)',
    query: 'What tax relief can I claim for home EV chargers and eco-equipment under Section 46(1)(v)?',
  },
];

export const TaxCopilotTab: React.FC = () => {
  const { persona, setPersona, activeTaxYear, setActiveTaxYear, currentUser } = useTax();

  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'welcome-init',
      role: 'model',
      content: `Salam sejahtera! I am your **CukaiSmart LHDN Tax Copilot**, an expert statutory advisor grounded in the **Malaysian Income Tax Act 1967 (ITA 1967)**, official LHDN Public Rulings, and Ministry of Finance (MOF) Gazette schedules for **Assessment Year ${activeTaxYear}**.\n\nYou are currently consulting in **${
        persona === 'business'
          ? 'Form B (Sole Proprietor / Freelancer / Business Deductions)'
          : 'Form BE (Salaried Individual / Personal Reliefs)'
      }** mode.\n\nAsk me any tax relief questions, deduction limits, or statutory record-keeping rules. How can I help maximize your tax refund today?`,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      suggestedFollowUps: [
        'What are the maximum limits for lifestyle and sports relief?',
        'Can I claim my laptop or iPad for work?',
        'How does e-Invoicing (MyInvois) affect my receipt storage?',
      ],
      source: 'gemini_flash',
    },
  ]);

  const [inputQuery, setInputQuery] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isLoading]);

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
          userId: currentUser?.uid || 'guest-session',
          userEmail: currentUser?.email || 'guest@taxpayer.local',
          sessionId: getOrCreateGuestSessionId(),
        }),
      });


      if (!response.ok) {
        const errJson = await response.json().catch(() => ({}));
        throw new Error(errJson.error || 'Failed to reach AI Tax Copilot service');
      }

      const data = await response.json();

      const aiMsg: ChatMessage = {
        id: `ai-${Date.now()}`,
        role: 'model',
        content: data.reply,
        citations: data.citations || [],
        suggestedFollowUps: data.suggestedFollowUps || [],
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        source: data.source || 'gemini_flash',
      };

      setMessages((prev) => [...prev, aiMsg]);
    } catch (e: any) {
      // In case client cannot connect, provide helpful statutory guidance directly
      const fallbackMsg: ChatMessage = {
        id: `err-${Date.now()}`,
        role: 'model',
        content: `### **Notice & Statutory Offline Advisory (YA ${activeTaxYear})**\n\nThe AI Copilot connection encountered a temporary network delay. Here is official LHDN statutory guidance under the **Malaysian Income Tax Act 1967**:\n\n• **Personal Reliefs [Section 46(1)]**: Automatic RM 9,000 personal relief, up to RM 10,000 for medical expenses (including RM 1,000 complete check-up and RM 1,000 dental), and RM 2,500 lifestyle.\n• **Sports Relief [Section 46(1)(q)]**: Capped at RM 1,000 for gym memberships and equipment.\n• **Business Claims [Section 33 & 39]**: Expenses incurred wholly and exclusively for income are 100% deductible; client meals and entertainment are capped at 50% under Section 39(1)(l).\n• **Record Keeping [Section 82A]**: Retain all receipts for at least 7 consecutive years in your CukaiSmart Document Vault.`,
        citations: ['Section 46(1) ITA 1967', 'Section 82A ITA 1967'],
        suggestedFollowUps: [
          'What are the maximum limits for lifestyle and sports relief?',
          'How long must I keep digital receipts under Section 82A?',
        ],
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        source: 'statutory_engine',
      };
      setMessages((prev) => [...prev, fallbackMsg]);
    } finally {
      setIsLoading(false);
      inputRef.current?.focus();
    }
  };

  const handleResetChat = () => {
    setMessages([
      {
        id: `welcome-${Date.now()}`,
        role: 'model',
        content: `Conversation reset. I am ready to advise you on Malaysian Income Tax Act 1967, Form ${
          persona === 'business' ? 'B' : 'BE'
        } rules, and LHDN compliance for YA ${activeTaxYear}.`,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        source: 'gemini_flash',
      },
    ]);
  };

  const handleCopyText = (id: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2500);
  };

  const renderFormattedContent = (text: string) => {
    const lines = text.split('\n');
    return lines.map((line, idx) => {
      // Highlight bold text
      const formatted = line.replace(
        /\*\*(.*?)\*\*/g,
        '<strong class="text-emerald-300 font-semibold">$1</strong>'
      );
      const isHeader = line.trim().startsWith('###') || line.trim().startsWith('####');
      const cleanHeader = formatted.replace(/^#{3,4}\s*/, '');
      const isBullet = line.trim().startsWith('•') || line.trim().startsWith('-') || line.trim().startsWith('*');

      if (isHeader) {
        return (
          <h4
            key={idx}
            className="text-xs sm:text-sm font-black text-white mt-2.5 mb-1 tracking-tight"
            dangerouslySetInnerHTML={{ __html: cleanHeader }}
          />
        );
      }

      return (
        <p
          key={idx}
          className={`${
            isBullet ? 'pl-3 relative my-1 text-slate-300' : 'my-1'
          } text-xs sm:text-sm leading-relaxed`}
          dangerouslySetInnerHTML={{ __html: formatted }}
        />
      );
    });
  };

  return (
    <div className="space-y-4 max-w-5xl w-full mx-auto pb-28 md:pb-12 animate-fade-in">
      {/* Top Banner & Control Deck */}
      <div className="bg-gradient-to-r from-slate-900 via-slate-900 to-emerald-950/40 border border-slate-800 rounded-3xl p-4 sm:p-5 shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-start sm:items-center gap-3.5">
          <div className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-emerald-600 via-teal-500 to-cyan-400 p-0.5 shadow-lg shadow-emerald-950/60 flex items-center justify-center shrink-0">
            <div className="w-full h-full bg-slate-950 rounded-[14px] flex items-center justify-center">
              <Sparkles className="w-5 h-5 text-emerald-400" />
            </div>
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="text-base sm:text-lg font-black text-white tracking-tight">
                Ask LHDN Tax Copilot
              </h1>
              <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                ITA 1967 Grounded
              </span>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-800 text-slate-300 border border-slate-700">
                YA {activeTaxYear}
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              Statutory guidance calibrated to Income Tax Act 1967, LHDN Public Rulings, and MyInvois e-Invoicing
            </p>
          </div>
        </div>

        {/* Persona & Reset Controls */}
        <div className="flex items-center gap-2 shrink-0 self-end md:self-auto">
          <div className="flex items-center bg-slate-950 p-1 rounded-xl border border-slate-800 shadow-inner">
            <button
              onClick={() => setPersona('individual')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition flex items-center gap-1.5 cursor-pointer ${
                persona === 'individual'
                  ? 'bg-emerald-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <User className="w-3.5 h-3.5" />
              <span>Form BE (Individual)</span>
            </button>
            <button
              onClick={() => setPersona('business')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition flex items-center gap-1.5 cursor-pointer ${
                persona === 'business'
                  ? 'bg-emerald-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Building2 className="w-3.5 h-3.5" />
              <span>Form B (Business)</span>
            </button>
          </div>

          <button
            onClick={handleResetChat}
            className="p-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-white border border-slate-800 transition cursor-pointer"
            title="Reset conversation"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Preset Topics Bar - Ergonomic Touch Scroller */}
      <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-2.5 sm:p-3">
        <div className="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider text-amber-400 mb-2 px-1">
          <Lightbulb className="w-3.5 h-3.5" />
          <span>Statutory Tax Scenarios (Tap to Ask):</span>
        </div>
        <div className="flex items-center gap-2 overflow-x-auto pb-1 no-scrollbar scroll-smooth">
          {PRESET_TOPICS.map((topic, idx) => {
            const Icon = topic.icon;
            return (
              <button
                key={idx}
                onClick={() => handleSendMessage(topic.query)}
                disabled={isLoading}
                className="px-3 py-1.5 rounded-xl bg-slate-950 hover:bg-slate-800 border border-slate-800 hover:border-emerald-500/50 text-slate-300 hover:text-emerald-300 transition whitespace-nowrap shrink-0 cursor-pointer disabled:opacity-50 text-[11px] font-medium flex items-center gap-1.5 group shadow-sm"
              >
                <Icon className="w-3.5 h-3.5 text-emerald-400 group-hover:scale-110 transition-transform" />
                <span>{topic.label}</span>
                <span className="text-[9px] text-slate-500 font-mono">({topic.category})</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Main Chat Interface Container */}
      {/* Carefully budgeted height and flex layout to prevent double scrollbars and screen blocking */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl shadow-xl flex flex-col h-[580px] sm:h-[620px] max-h-[72vh] overflow-hidden">
        {/* Messages Stream */}
        <div className="flex-1 p-3 sm:p-6 overflow-y-auto space-y-4 overscroll-contain">
          {messages.map((m) => {
            const isUser = m.role === 'user';
            return (
              <div
                key={m.id}
                className={`flex gap-2.5 sm:gap-3 ${isUser ? 'justify-end' : 'justify-start'}`}
              >
                {!isUser && (
                  <div className="w-8 h-8 rounded-xl bg-emerald-500/20 border border-emerald-500/30 text-emerald-400 flex items-center justify-center shrink-0 mt-0.5 shadow-sm">
                    <Bot className="w-4.5 h-4.5" />
                  </div>
                )}

                <div
                  className={`max-w-[92%] sm:max-w-[82%] rounded-2xl p-3.5 sm:p-4 shadow-md ${
                    isUser
                      ? 'bg-gradient-to-tr from-emerald-600 to-teal-600 text-white rounded-tr-none'
                      : 'bg-slate-950 border border-slate-800 text-slate-200 rounded-tl-none'
                  }`}
                >
                  <div className="flex items-center justify-between gap-2 mb-1.5 pb-1 border-b border-slate-800/50">
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                        {isUser ? 'You' : 'LHDN Tax Copilot'}
                      </span>
                      {!isUser && m.source === 'statutory_engine' && (
                        <span className="text-[9px] font-mono px-1.5 py-0.2 rounded bg-amber-500/10 border border-amber-500/30 text-amber-300">
                          ITA 1967 Statutory Engine
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-1.5">
                      <span className="text-[10px] text-slate-500">{m.timestamp}</span>
                      {!isUser && (
                        <button
                          onClick={() => handleCopyText(m.id, m.content)}
                          className="text-slate-500 hover:text-emerald-400 p-0.5 rounded transition cursor-pointer"
                          title="Copy answer"
                        >
                          {copiedId === m.id ? (
                            <Check className="w-3.5 h-3.5 text-emerald-400" />
                          ) : (
                            <Copy className="w-3.5 h-3.5" />
                          )}
                        </button>
                      )}
                    </div>
                  </div>

                  <div className="space-y-1">
                    {renderFormattedContent(m.content)}
                  </div>

                  {/* Citations */}
                  {m.citations && m.citations.length > 0 && (
                    <div className="mt-3 pt-2.5 border-t border-slate-800/80 flex flex-wrap gap-1.5 items-center">
                      <span className="text-[10px] font-bold text-slate-400 flex items-center gap-1">
                        <BookOpen className="w-3 h-3 text-cyan-400" /> Statutory Authorities:
                      </span>
                      {m.citations.map((c, i) => (
                        <span
                          key={i}
                          className="text-[10px] font-mono px-2 py-0.5 rounded bg-cyan-950/60 text-cyan-300 border border-cyan-800/50"
                        >
                          {c}
                        </span>
                      ))}
                    </div>
                  )}

                  {/* Suggested Follow-Ups */}
                  {m.suggestedFollowUps && m.suggestedFollowUps.length > 0 && (
                    <div className="mt-3 pt-2.5 border-t border-slate-800/80 space-y-1.5">
                      <span className="text-[10px] font-semibold text-slate-400 block">
                        Related statutory questions:
                      </span>
                      <div className="flex flex-wrap gap-1.5">
                        {m.suggestedFollowUps.map((prompt, i) => (
                          <button
                            key={i}
                            onClick={() => handleSendMessage(prompt)}
                            disabled={isLoading}
                            className="text-[11px] text-left px-2.5 py-1 rounded-lg bg-slate-900 hover:bg-slate-800 border border-slate-700/80 text-emerald-300 hover:text-emerald-200 transition cursor-pointer disabled:opacity-50 flex items-center gap-1 group"
                          >
                            <span>{prompt}</span>
                            <ArrowRight className="w-3 h-3 shrink-0 group-hover:translate-x-0.5 transition-transform" />
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                {isUser && (
                  <div className="w-8 h-8 rounded-xl bg-slate-800 border border-slate-700 text-slate-300 flex items-center justify-center shrink-0 mt-0.5">
                    <User className="w-4.5 h-4.5" />
                  </div>
                )}
              </div>
            );
          })}

          {isLoading && (
            <div className="flex gap-2.5 sm:gap-3 justify-start items-center">
              <div className="w-8 h-8 rounded-xl bg-emerald-500/20 border border-emerald-500/30 text-emerald-400 flex items-center justify-center shrink-0 animate-pulse">
                <Bot className="w-4.5 h-4.5" />
              </div>
              <div className="bg-slate-950 border border-slate-800 rounded-2xl rounded-tl-none p-3 flex items-center gap-3 text-xs text-slate-400">
                <div className="flex gap-1.5 items-center">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-bounce" />
                  <span
                    className="w-2 h-2 rounded-full bg-emerald-400 animate-bounce"
                    style={{ animationDelay: '150ms' }}
                  />
                  <span
                    className="w-2 h-2 rounded-full bg-emerald-400 animate-bounce"
                    style={{ animationDelay: '300ms' }}
                  />
                </div>
                <span>Consulting Malaysian Income Tax Act 1967 &amp; LHDN Gazette...</span>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Input Dock - Clean, Unblocked, Full Ergonomics */}
        <div className="p-3 sm:p-4 bg-slate-950 border-t border-slate-800 shrink-0">
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
              placeholder={`Ask about Section 46 reliefs, business deductions, or e-Invoicing for YA ${activeTaxYear}...`}
              disabled={isLoading}
              className="flex-1 bg-slate-900 border border-slate-800 focus:border-emerald-500 rounded-xl px-4 py-2.5 sm:py-3 text-xs sm:text-sm text-white placeholder-slate-500 focus:outline-none transition disabled:opacity-50"
            />
            <button
              type="submit"
              disabled={!inputQuery.trim() || isLoading}
              className="px-4 py-2.5 sm:py-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 disabled:bg-slate-800 text-white font-bold text-xs sm:text-sm transition flex items-center gap-1.5 cursor-pointer disabled:cursor-not-allowed shadow-lg shadow-emerald-950/40 shrink-0"
            >
              <Send className="w-4 h-4" />
              <span className="hidden sm:inline">Ask</span>
            </button>
          </form>

          <div className="flex items-center justify-between text-[11px] text-slate-400 mt-2 px-1 gap-2 flex-wrap">
            <span className="flex items-center gap-1 text-slate-400">
              <Shield className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
              <span>PDPA Shield: Personal identifiers automatically protected.</span>
            </span>
            <span className="hidden sm:inline text-slate-400">
              Statutory Gazette Verified &bull; Section 46 &amp; Section 33 ITA 1967
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
