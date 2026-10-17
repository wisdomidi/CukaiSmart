import React, { useState } from 'react';
import { TaxProvider } from './context/TaxContext';
import { Navbar } from './components/layout/Navbar';
import { BottomNav } from './components/layout/BottomNav';
import { OfflineIndicator } from './components/pwa/OfflineIndicator';
import { HomeDashboard } from './components/dashboard/HomeDashboard';
import { ReceiptScanner } from './components/scanner/ReceiptScanner';
import { PaydayOptimizer } from './components/optimizer/PaydayOptimizer';
import { DocumentVault } from './components/vault/DocumentVault';
import { TaxAgentPortal } from './components/agent/TaxAgentPortal';
import { TaxCalculator } from './components/calculator/TaxCalculator';
import { AdminConsole } from './components/admin/AdminConsole';
import { UserProfile } from './components/profile/UserProfile';
import { TaxCopilotTab } from './components/agent/TaxCopilotTab';
import { HubFinOpsTab } from './components/hub/HubFinOpsTab';

import { useTax } from './context/TaxContext';
import { isUserAdmin } from './services/firebase';

type AppTab = 'home' | 'copilot' | 'scan' | 'calculator' | 'optimize' | 'vault' | 'hub' | 'agents' | 'admin' | 'profile';

function MainApp() {
  const { currentUser } = useTax();
  const prevUserRef = React.useRef<any>(null);

  const getInitialTab = (): AppTab => {
    if (typeof window !== 'undefined') {
      const path = window.location.pathname.toLowerCase();
      const hash = window.location.hash.toLowerCase();
      if (path === '/admin' || path.startsWith('/admin') || hash === '#admin') {
        return 'admin';
      }
      if (path === '/copilot' || hash === '#copilot') {
        return 'copilot';
      }
      if (path === '/hub' || hash === '#hub') {
        return 'hub';
      }
    }
    return 'home';
  };

  const [currentTab, setCurrentTab] = useState<AppTab>(getInitialTab);

  const handleTabChange = (tab: string) => {
    if (tab === 'admin') {
      if (window.location.pathname !== '/admin') {
        window.history.pushState(null, '', '/admin');
      }
    } else if (window.location.pathname === '/admin' || window.location.hash === '#admin') {
      window.history.pushState(null, '', '/');
    }
    setCurrentTab(tab as AppTab);
  };

  const [roleNotice, setRoleNotice] = useState<string | null>(null);

  // Role-based redirect on login: admins -> /admin, regular users -> taxpayer dashboard
  React.useEffect(() => {
    if (currentUser && !prevUserRef.current) {
      if (isUserAdmin(currentUser)) {
        handleTabChange('admin');
      } else {
        if (window.location.pathname === '/admin' || currentTab === 'admin') {
          handleTabChange('home');
          setRoleNotice('Admin Console access is restricted to system administrators. Routed to taxpayer dashboard.');
          setTimeout(() => setRoleNotice(null), 5000);
        }
      }
    }
    prevUserRef.current = currentUser;
  }, [currentUser]);

  // Restrict /admin: if a logged-in user is not an admin, return to home
  React.useEffect(() => {
    if (currentTab === 'admin' && currentUser && !isUserAdmin(currentUser)) {
      handleTabChange('home');
      setRoleNotice('Admin Console access is restricted to system administrators. Routed to taxpayer dashboard.');
      setTimeout(() => setRoleNotice(null), 5000);
    }
  }, [currentTab, currentUser]);

  React.useEffect(() => {
    const handleLocationChange = () => {
      const path = window.location.pathname.toLowerCase();
      const hash = window.location.hash.toLowerCase();
      if (path === '/admin' || path.startsWith('/admin') || hash === '#admin') {
        setCurrentTab('admin');
      } else if (currentTab === 'admin') {
        setCurrentTab('home');
      }
    };

    window.addEventListener('popstate', handleLocationChange);
    window.addEventListener('hashchange', handleLocationChange);
    return () => {
      window.removeEventListener('popstate', handleLocationChange);
      window.removeEventListener('hashchange', handleLocationChange);
    };
  }, [currentTab]);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col selection:bg-emerald-500 selection:text-white font-sans antialiased">
      {/* Offline Status Pill */}
      <OfflineIndicator />

      {/* Top Navbar */}
      <Navbar currentTab={currentTab} setCurrentTab={handleTabChange} />

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {roleNotice && (
          <div className="mb-4 p-3.5 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-amber-300 text-xs font-semibold flex items-center justify-between gap-3 animate-fade-in shadow-md">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-amber-400 animate-ping shrink-0" />
              <span>{roleNotice}</span>
            </div>
            <button
              onClick={() => setRoleNotice(null)}
              className="text-amber-400 hover:text-white px-2 py-0.5 rounded-lg text-[11px] font-bold cursor-pointer"
            >
              Dismiss
            </button>
          </div>
        )}

        {currentTab === 'home' && (
          <HomeDashboard
            onNavigateToScan={() => handleTabChange('scan')}
            onNavigateToOptimize={() => handleTabChange('optimize')}
            onNavigateToVault={() => handleTabChange('vault')}
          />
        )}

        {currentTab === 'scan' && (
          <ReceiptScanner
            onScanComplete={() => {}}
            onNavigateToVault={() => handleTabChange('vault')}
          />
        )}

        {currentTab === 'calculator' && (
          <TaxCalculator
            onNavigateToOptimize={() => handleTabChange('optimize')}
            onNavigateToVault={() => handleTabChange('vault')}
          />
        )}

        {currentTab === 'optimize' && <PaydayOptimizer />}

        {currentTab === 'vault' && <DocumentVault />}

        {currentTab === 'copilot' && <TaxCopilotTab />}

        {currentTab === 'hub' && (
          <HubFinOpsTab onNavigateToAdmin={() => handleTabChange('admin')} />
        )}

        {currentTab === 'agents' && <TaxAgentPortal />}

        {currentTab === 'admin' && (
          <AdminConsole onExit={() => handleTabChange('home')} />
        )}

        {currentTab === 'profile' && (
          <UserProfile
            onNavigateToVault={() => handleTabChange('vault')}
            onNavigateToScan={() => handleTabChange('scan')}
          />
        )}
      </main>

      {/* Mobile Fixed Native Bottom Navigation */}
      {currentTab !== 'admin' && (
        <BottomNav currentTab={currentTab} setCurrentTab={handleTabChange} />
      )}
    </div>
  );
}

export default function App() {
  return (
    <TaxProvider>
      <MainApp />
    </TaxProvider>
  );
}
