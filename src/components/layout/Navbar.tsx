import React, { useState, useRef, useEffect } from 'react';
import {
  FileCheck2,
  Building2,
  User,
  Sparkles,
  Camera,
  Archive,
  Calculator,
  RefreshCw,
  Activity,
  Calendar,
  Cloud,
  Cpu,
  Lock,
  TrendingDown,
  ChevronDown,
  Menu,
  X,
  Users,
  ShieldCheck,
  Zap,
  ArrowLeft,
  MessageSquarePlus,
} from 'lucide-react';
import { useTax } from '../../context/TaxContext';
import { isUserAdmin } from '../../services/firebase';
import { AuthModal } from '../auth/AuthModal';
import { PWAInstallButton } from '../pwa/PWAInstallButton';
import { LHDNSyncModal } from '../dashboard/LHDNSyncModal';
import { TelemetryMonitorModal } from '../dashboard/TelemetryMonitorModal';
import { CompetitionArchitectureModal } from '../showcase/CompetitionArchitectureModal';
import { TaxCopilotModal } from '../agent/TaxCopilotModal';
import { SolutionVsHumanCostModal } from '../analytics/SolutionVsHumanCostModal';
import { UserFeedbackModal } from '../feedback/UserFeedbackModal';


interface NavbarProps {
  currentTab: string;
  setCurrentTab: (tab: string) => void;
}

export const Navbar: React.FC<NavbarProps> = ({ currentTab, setCurrentTab }) => {
  const {
    persona,
    setPersona,
    activeTaxYear,
    setActiveTaxYear,
    currentUser,
  } = useTax();

  // Modals state
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [isLhdnSyncOpen, setIsLhdnSyncOpen] = useState(false);
  const [isTelemetryOpen, setIsTelemetryOpen] = useState(false);
  const [isArchitectureOpen, setIsArchitectureOpen] = useState(false);
  const [isCopilotOpen, setIsCopilotOpen] = useState(false);
  const [isCostRoiOpen, setIsCostRoiOpen] = useState(false);
  const [isUserFeedbackOpen, setIsUserFeedbackOpen] = useState(false);

  // Mobile Menu state

  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const taxYears = [2026, 2025];

  // Navigation Items (Includes 8 core taxpayer and governance modules)
  const navItems = [
    { id: 'home', label: 'Overview', icon: FileCheck2 },
    { id: 'copilot', label: 'Ask Copilot', icon: Sparkles },
    { id: 'scan', label: 'Check Document', icon: Camera },
    { id: 'calculator', label: 'Tax Calculator', icon: Calculator },
    { id: 'optimize', label: 'Relief Maximizer', icon: Zap },
    { id: 'vault', label: 'Claimable Vault', icon: Archive },
    { id: 'hub', label: 'Hub & FinOps', icon: Cpu },
    { id: 'agents', label: 'Agent Portal', icon: Users },
  ];

  // Close mobile drawer on escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setIsMobileMenuOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, []);

  const isAdmin = isUserAdmin(currentUser);

  return (
    <header className="sticky top-0 z-40 w-full border-b border-slate-800/80 bg-slate-950/95 backdrop-blur-xl transition-all">
      {/* Top Bar: Brand, Persona, Global Controls, Hub Dropdown & Actions */}
      <div className="max-w-7xl w-full mx-auto px-3 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-15 gap-2 sm:gap-4">
          {/* Left: Brand Logo & Wordmark */}
          <div className="flex items-center gap-3 shrink-0">
            <div
              onClick={() => setCurrentTab('home')}
              className="flex items-center gap-2.5 cursor-pointer group select-none"
            >
              <div className="w-8.5 h-8.5 rounded-xl bg-gradient-to-tr from-emerald-600 via-teal-500 to-cyan-400 p-0.5 shadow-md shadow-emerald-950/60 flex items-center justify-center transition-transform group-hover:scale-105">
                <div className="w-full h-full bg-slate-950 rounded-[10px] flex items-center justify-center">
                  <FileCheck2 className="w-4.5 h-4.5 text-emerald-400" />
                </div>
              </div>
              <div className="flex flex-col">
                <span className="text-base sm:text-lg font-black tracking-tight text-white group-hover:text-emerald-300 transition-colors whitespace-nowrap leading-tight">
                  CukaiSmart
                </span>
                <span className="text-[9px] font-mono font-bold text-emerald-400/80 -mt-0.5 tracking-wider hidden sm:inline">
                  Malaysia Tax Relief Optimiser
                </span>
              </div>
            </div>

            {/* Persona Switcher (Individual / Business Form B) */}
            <div className="hidden sm:flex items-center bg-slate-900/90 p-0.5 rounded-xl border border-slate-800 shadow-inner ml-1">
              <button
                onClick={() => setPersona('individual')}
                className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold transition-all flex items-center gap-1 cursor-pointer ${
                  persona === 'individual'
                    ? 'bg-emerald-600 text-white shadow-sm'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
                title="Form BE: Individual Personal Reliefs"
              >
                <User className="w-3 h-3" />
                <span>Individual</span>
              </button>
              <button
                onClick={() => setPersona('business')}
                className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold transition-all flex items-center gap-1 cursor-pointer ${
                  persona === 'business'
                    ? 'bg-emerald-600 text-white shadow-sm'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
                title="Form B: SME / Sole Proprietor Business Deductions"
              >
                <Building2 className="w-3 h-3" />
                <span>Business</span>
              </button>
            </div>
          </div>

          {/* Right: Tax Year, Hub Dropdown, Copilot, Profile, Hamburger */}
          <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
            {/* Tax Year Selector */}
            <div className="flex items-center gap-1 bg-slate-900 border border-slate-800 rounded-lg px-2 py-1 text-xs">
              <Calendar className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
              <select
                value={activeTaxYear}
                onChange={(e) => setActiveTaxYear(Number(e.target.value))}
                className="bg-transparent text-slate-200 font-semibold focus:outline-none cursor-pointer text-xs"
                title="Tax Assessment Year"
              >
                {taxYears.map((year) => (
                  <option key={year} value={year} className="bg-slate-900 text-slate-200">
                    YA {year}
                  </option>
                ))}
              </select>
            </div>

            {/* Direct Hub & FinOps Tab Button */}
            <button
              onClick={() => setCurrentTab('hub')}
              className={`flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-lg border text-xs font-semibold transition cursor-pointer ${
                currentTab === 'hub'
                  ? 'bg-cyan-500/20 border-cyan-400 text-cyan-300 font-bold shadow-sm'
                  : 'bg-slate-900 border-slate-800 text-slate-300 hover:bg-slate-800 hover:text-white'
              }`}
              title="Platform Infrastructure & Tax ROI Hub"
            >
              <Cpu className="w-3.5 h-3.5 text-cyan-400" />
              <span className="hidden sm:inline">Tax Hub</span>
            </button>

            {/* Direct Ask LHDN Tax Copilot Tab Button */}
            <button
              onClick={() => setCurrentTab('copilot')}
              className={`flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer shadow-md ${
                currentTab === 'copilot'
                  ? 'bg-gradient-to-r from-emerald-500 to-teal-400 text-slate-950 font-black shadow-emerald-950/80 ring-2 ring-emerald-400/50'
                  : 'bg-gradient-to-r from-emerald-600 to-teal-500 hover:from-emerald-500 hover:to-teal-400 text-white shadow-emerald-950/50'
              }`}
              title="Ask LHDN Tax Copilot"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Ask Copilot</span>
            </button>

            {/* Feedback Modal Trigger Button */}
            <button
              onClick={() => setIsUserFeedbackOpen(true)}
              className="flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-800 text-slate-300 hover:bg-slate-800 hover:text-white text-xs font-semibold transition cursor-pointer"
              title="Give App Feedback / Request Features"
            >
              <MessageSquarePlus className="w-3.5 h-3.5 text-emerald-400" />
              <span className="hidden lg:inline">Feedback</span>
            </button>


            {/* Account / Taxpayer Profile Button */}
            <button
              onClick={() => {
                if (currentUser) {
                  setCurrentTab('profile');
                } else {
                  setIsAuthModalOpen(true);
                }
              }}
              className={`flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-lg text-xs font-semibold border transition cursor-pointer ${
                currentUser
                  ? currentTab === 'profile'
                    ? 'bg-emerald-500/25 border-emerald-400 text-white shadow-sm'
                    : 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300 hover:bg-emerald-500/20'
                  : 'bg-slate-900 border-slate-800 text-slate-300 hover:bg-slate-800 hover:text-white'
              }`}
              title={currentUser ? `Taxpayer: ${currentUser.email}` : 'Sign in'}
            >
              <User className="w-3.5 h-3.5 text-emerald-400" />
              <span className="hidden md:inline">
                {currentUser ? (currentUser.displayName || currentUser.email?.split('@')[0]) : 'Sign In'}
              </span>
            </button>

            <PWAInstallButton compact />

            {/* Mobile Menu Hamburger Button */}
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="md:hidden p-2 rounded-lg bg-slate-900 border border-slate-800 text-slate-300 hover:text-white hover:bg-slate-800 transition cursor-pointer ml-0.5"
              title="Toggle mobile menu"
            >
              {isMobileMenuOpen ? <X className="w-4 h-4" /> : <Menu className="w-4 h-4" />}
            </button>
          </div>
        </div>
      </div>

      {/* Row 2: Ultra-Clean Dedicated Horizontal Navigation Bar */}
      {/* Ensures ALL tabs are visible, responsive, never clipped or pushed out of screen */}
      <div className="border-t border-slate-800/80 bg-slate-950/70 overflow-x-auto no-scrollbar scroll-smooth">
        <div className="max-w-7xl w-full mx-auto px-3 sm:px-6 lg:px-8">
          {currentTab === 'admin' ? (
            <div className="flex items-center justify-between py-1.5 gap-2">
              <div className="flex items-center gap-2 text-xs">
                <span className="flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-amber-500/15 border border-amber-500/40 text-amber-300 font-bold">
                  <ShieldCheck className="w-3.5 h-3.5" />
                  <span>Secure Admin Session (/admin)</span>
                </span>
                <span className="text-slate-400 hidden sm:inline text-[11px]">
                  Restricted platform operations &amp; FinOps sentinel
                </span>
              </div>
              <button
                onClick={() => setCurrentTab('home')}
                className="px-3 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold border border-slate-700 transition flex items-center gap-1.5 cursor-pointer"
              >
                <ArrowLeft className="w-3 h-3" />
                <span>Exit to Main App</span>
              </button>
            </div>
          ) : (
            <nav className="flex items-center gap-1 sm:gap-2 py-1.5 overflow-x-auto no-scrollbar whitespace-nowrap">
              {navItems.map((item) => {
                const Icon = item.icon;
                const isActive = currentTab === item.id;

                return (
                  <button
                    key={item.id}
                    onClick={() => {
                      setCurrentTab(item.id);
                      setIsMobileMenuOpen(false);
                    }}
                    className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all flex items-center gap-1.5 whitespace-nowrap shrink-0 cursor-pointer ${
                      isActive
                        ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 shadow-sm font-bold'
                        : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/80'
                    }`}
                  >
                    <Icon className={`w-3.5 h-3.5 shrink-0 ${isActive ? 'text-emerald-400' : 'text-slate-400'}`} />
                    <span>{item.label}</span>
                  </button>
                );
              })}
            </nav>
          )}
        </div>
      </div>

      {/* Mobile Drawer Dropdown Menu (Opens on Mobile Hamburger) */}
      {isMobileMenuOpen && (
        <div className="md:hidden border-t border-slate-800 bg-slate-900/95 backdrop-blur-xl p-4 space-y-4 animate-in slide-in-from-top-2 duration-150">
          {/* Mobile Persona Switch */}
          <div className="flex items-center justify-between p-2 rounded-xl bg-slate-950 border border-slate-800">
            <span className="text-xs text-slate-400 font-medium">Taxpayer Persona:</span>
            <div className="flex items-center gap-1">
              <button
                onClick={() => setPersona('individual')}
                className={`px-3 py-1 rounded-lg text-xs font-semibold transition ${
                  persona === 'individual' ? 'bg-emerald-600 text-white' : 'text-slate-400'
                }`}
              >
                Individual
              </button>
              <button
                onClick={() => setPersona('business')}
                className={`px-3 py-1 rounded-lg text-xs font-semibold transition ${
                  persona === 'business' ? 'bg-emerald-600 text-white' : 'text-slate-400'
                }`}
              >
                Business
              </button>
            </div>
          </div>

          {/* Quick Navigation Cards */}
          <div className="grid grid-cols-2 gap-2 text-xs">
            <button
              onClick={() => {
                setCurrentTab('copilot');
                setIsMobileMenuOpen(false);
              }}
              className="p-3 rounded-xl bg-slate-950 border border-slate-800 text-left flex items-center gap-2 hover:border-emerald-500/40 text-slate-200 cursor-pointer"
            >
              <Sparkles className="w-4 h-4 text-emerald-400 shrink-0" />
              <div>
                <span className="font-bold block text-white">Ask Copilot</span>
                <span className="text-[10px] text-slate-400">ITA 1967 Advisor</span>
              </div>
            </button>

            <button
              onClick={() => {
                setCurrentTab('hub');
                setIsMobileMenuOpen(false);
              }}
              className="p-3 rounded-xl bg-slate-950 border border-slate-800 text-left flex items-center gap-2 hover:border-cyan-500/40 text-slate-200 cursor-pointer"
            >
              <Cpu className="w-4 h-4 text-cyan-400 shrink-0" />
              <div>
                <span className="font-bold block text-white">Hub &amp; FinOps</span>
                <span className="text-[10px] text-slate-400">ROI &amp; Architecture</span>
              </div>
            </button>
          </div>
        </div>
      )}

      {/* Floating Application Modals */}
      <AuthModal
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
        onNavigateToVault={() => setCurrentTab('vault')}
        onNavigateToScan={() => setCurrentTab('scan')}
      />

      <LHDNSyncModal
        isOpen={isLhdnSyncOpen}
        onClose={() => setIsLhdnSyncOpen(false)}
      />

      <TelemetryMonitorModal
        isOpen={isTelemetryOpen}
        onClose={() => setIsTelemetryOpen(false)}
      />

      <CompetitionArchitectureModal
        isOpen={isArchitectureOpen}
        onClose={() => setIsArchitectureOpen(false)}
      />

      <TaxCopilotModal
        isOpen={isCopilotOpen}
        onClose={() => setIsCopilotOpen(false)}
      />

      <SolutionVsHumanCostModal
        isOpen={isCostRoiOpen}
        onClose={() => setIsCostRoiOpen(false)}
      />

      <UserFeedbackModal
        isOpen={isUserFeedbackOpen}
        onClose={() => setIsUserFeedbackOpen(false)}
      />
    </header>

  );
};
