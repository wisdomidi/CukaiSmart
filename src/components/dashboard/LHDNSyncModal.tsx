import React, { useState } from 'react';
import {
  RefreshCw,
  CheckCircle2,
  ShieldCheck,
  Building2,
  Calendar,
  Sparkles,
  X,
  Database,
  Cloud,
  Layers,
} from 'lucide-react';
import { useTax } from '../../context/TaxContext';

interface LHDNSyncModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const LHDNSyncModal: React.FC<LHDNSyncModalProps> = ({ isOpen, onClose }) => {
  const { syncWithLHDN, lastLHDNSyncTime, isCloudSynced, personalReliefs, currentUser } = useTax();
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncResult, setSyncResult] = useState<{
    updatedCount: number;
    totalReliefs: number;
    syncTimestamp: string;
  } | null>(null);
  const [syncError, setSyncError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSync = async () => {
    setIsSyncing(true);
    setSyncError(null);
    setSyncResult(null);

    try {
      const result = await syncWithLHDN();
      setSyncResult(result);
    } catch (err: any) {
      setSyncError(err?.message || 'Failed to sync with live LHDN service.');
    } finally {
      setIsSyncing(false);
    }
  };

  React.useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  return (
    <div
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/80 backdrop-blur-md"
    >
      <div className="relative w-full max-w-xl bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="px-6 py-5 border-b border-slate-800 flex items-center justify-between bg-slate-950/50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                Sync with LHDN
                <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                  Live Official API
                </span>
              </h3>
              <p className="text-xs text-slate-400">
                Align local tax relief rules with latest Ministry of Finance Budget updates
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white border border-slate-700 text-xs font-semibold transition cursor-pointer shadow-sm"
            title="Close modal (Esc)"
          >
            <X className="w-4 h-4" />
            <span>Close</span>
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 space-y-6">
          {/* Status Box */}
          <div className="bg-slate-950/80 border border-slate-800 rounded-xl p-4 space-y-3">
            <div className="flex items-center justify-between text-xs text-slate-400">
              <span className="flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5 text-emerald-400" />
                Current Active Assessment Year:
              </span>
              <span className="font-bold text-slate-200">YA 2026 / YA 2025</span>
            </div>
            <div className="flex items-center justify-between text-xs text-slate-400">
              <span className="flex items-center gap-1.5">
                <RefreshCw className="w-3.5 h-3.5 text-amber-400" />
                Last Synchronization:
              </span>
              <span className="font-mono text-emerald-400 font-medium">
                {lastLHDNSyncTime
                  ? new Date(lastLHDNSyncTime).toLocaleString('en-MY', {
                      dateStyle: 'medium',
                      timeStyle: 'short',
                    })
                  : 'Never'}
              </span>
            </div>
            <div className="flex items-center justify-between text-xs text-slate-400">
              <span className="flex items-center gap-1.5">
                <Cloud className="w-3.5 h-3.5 text-teal-400" />
                Firestore Storage Sync:
              </span>
              <span className="font-medium text-emerald-400 flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5" />
                {currentUser ? 'Live Cloud Persistence Active' : 'Local Storage Encrypted'}
              </span>
            </div>
          </div>

          {/* Sync Results Alert */}
          {syncResult && (
            <div className="p-4 rounded-xl bg-emerald-950/30 border border-emerald-500/30 flex items-start gap-3">
              <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
              <div className="text-xs text-slate-300 space-y-1">
                <p className="font-bold text-emerald-300">
                  LHDN Tax Relief Constants Synchronized Successfully!
                </p>
                <p>
                  Verified {syncResult.totalReliefs} official tax relief categories against LHDN Gazette 2026. Updated {syncResult.updatedCount} statutory definitions.
                </p>
                <p className="text-[11px] text-slate-400 italic">
                  All relief limits, statutory sections, and descriptions are now persisted directly to Cloud Firestore.
                </p>
              </div>
            </div>
          )}

          {syncError && (
            <div className="p-4 rounded-xl bg-rose-950/30 border border-rose-500/30 text-xs text-rose-300">
              <p className="font-bold">Sync Error</p>
              <p>{syncError}</p>
            </div>
          )}

          {/* Current Tax Relief Definitions Summary */}
          <div>
            <h4 className="text-xs font-semibold text-slate-300 uppercase tracking-wider mb-3 flex items-center gap-1.5">
              <Layers className="w-3.5 h-3.5 text-emerald-400" />
              Active LHDN Relief Constants ({personalReliefs.length} Categories)
            </h4>
            <div className="max-h-48 overflow-y-auto pr-1 space-y-2 custom-scrollbar">
              {personalReliefs.map((relief) => (
                <div
                  key={relief.id}
                  className="p-3 bg-slate-950/60 border border-slate-800/80 rounded-lg flex items-center justify-between text-xs"
                >
                  <div className="space-y-0.5">
                    <p className="font-semibold text-slate-200">{relief.name}</p>
                    <p className="text-[11px] text-slate-400 font-mono">{relief.section}</p>
                  </div>
                  <div className="text-right">
                    <span className="font-bold text-emerald-400">
                      RM {relief.maxLimit.toLocaleString()}
                    </span>
                    <p className="text-[10px] text-slate-500">Statutory Cap</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="px-6 py-4 bg-slate-950/80 border-t border-slate-800 flex items-center justify-between">
          <span className="text-[11px] text-slate-400">
            Source: MOF Budget 2025/2026 & LHDN Gazette
          </span>
          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              className="px-4 py-2 text-xs font-medium text-slate-300 hover:text-white rounded-lg hover:bg-slate-800 transition"
            >
              Close
            </button>
            <button
              onClick={handleSync}
              disabled={isSyncing}
              className="px-4 py-2 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-500 rounded-lg shadow-lg shadow-emerald-950/50 flex items-center gap-2 disabled:opacity-50 transition cursor-pointer"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isSyncing ? 'animate-spin' : ''}`} />
              <span>{isSyncing ? 'Syncing with LHDN...' : 'Run Sync Now'}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
