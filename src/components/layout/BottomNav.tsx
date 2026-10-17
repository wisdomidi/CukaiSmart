import {
  LayoutDashboard,
  Camera,
  Archive,
  Calculator,
  Sparkles,
  Cpu,
} from 'lucide-react';
import { useTax } from '../../context/TaxContext';

interface BottomNavProps {
  currentTab: string;
  setCurrentTab: (tab: string) => void;
}

export const BottomNav: React.FC<BottomNavProps> = ({ currentTab, setCurrentTab }) => {
  const tabs = [
    { id: 'home', label: 'Overview', icon: LayoutDashboard },
    { id: 'copilot', label: 'Copilot', icon: Sparkles },
    { id: 'scan', label: 'Check Doc', icon: Camera, highlight: true },
    { id: 'vault', label: 'Vault', icon: Archive },
    { id: 'hub', label: 'FinOps', icon: Cpu },
  ];

  return (
    <div className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-slate-950/95 backdrop-blur-xl border-t border-slate-800/90 pb-safe">
      <div className="flex items-center justify-around h-16 px-1 max-w-lg mx-auto">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = currentTab === tab.id;

          if (tab.highlight) {
            return (
              <button
                key={tab.id}
                onClick={() => setCurrentTab(tab.id)}
                className="flex flex-col items-center justify-center -mt-5 group"
              >
                <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-emerald-600 via-teal-500 to-emerald-400 p-0.5 shadow-lg shadow-emerald-950/80 group-active:scale-95 transition-transform">
                  <div className="w-full h-full bg-slate-900 rounded-[14px] flex items-center justify-center group-hover:bg-slate-800 transition">
                    <Icon className="w-5 h-5 text-emerald-400" />
                  </div>
                </div>
                <span className="text-[10px] font-bold text-emerald-400 mt-1">
                  {tab.label}
                </span>
              </button>
            );
          }

          return (
            <button
              key={tab.id}
              onClick={() => setCurrentTab(tab.id)}
              className={`flex flex-col items-center justify-center w-14 py-1 transition-colors relative ${
                isActive ? 'text-emerald-400' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Icon className="w-4 h-4 mb-0.5" />
              <span className={`text-[10px] truncate max-w-full ${isActive ? 'font-bold' : 'font-medium'}`}>
                {tab.label}
              </span>
              {isActive && (
                <span className="w-1 h-1 rounded-full bg-emerald-400 mt-0.5" />
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
};
