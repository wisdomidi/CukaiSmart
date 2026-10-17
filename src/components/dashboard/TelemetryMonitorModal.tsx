import React, { useState, useEffect } from 'react';
import {
  Activity,
  Cpu,
  Server,
  Database,
  Layers,
  AlertCircle,
  CheckCircle2,
  Clock,
  HardDrive,
  Filter,
  Trash2,
  X,
  FileCode,
  Zap,
} from 'lucide-react';
import { telemetry, TelemetryLog, LogStatus, PipelineStage } from '../../services/telemetry';

interface TelemetryMonitorModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const TelemetryMonitorModal: React.FC<TelemetryMonitorModalProps> = ({ isOpen, onClose }) => {
  const [logs, setLogs] = useState<TelemetryLog[]>([]);
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [selectedLog, setSelectedLog] = useState<TelemetryLog | null>(null);

  useEffect(() => {
    const unsub = telemetry.subscribe((updatedLogs) => {
      setLogs(updatedLogs);
    });
    return unsub;
  }, []);

  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const summary = telemetry.getPipelineSummary();

  const filteredLogs = logs.filter((l) => {
    if (filterStatus === 'all') return true;
    if (filterStatus === 'error') return l.status === 'error' || l.status === 'dropped';
    return l.status === filterStatus;
  });

  const getStatusBadge = (status: LogStatus) => {
    switch (status) {
      case 'success':
        return <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">SUCCESS</span>;
      case 'warning':
        return <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30">WARNING</span>;
      case 'error':
      case 'dropped':
        return <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-rose-500/20 text-rose-300 border border-rose-500/30">DROPPED / ERROR</span>;
      default:
        return <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-800 text-slate-300">INFO</span>;
    }
  };

  const getStageIcon = (stage: PipelineStage) => {
    switch (stage) {
      case '1_CLIENT_COMPRESSION':
        return <Cpu className="w-4 h-4 text-emerald-400" />;
      case '2_EXPRESS_TRANSMISSION':
        return <Server className="w-4 h-4 text-cyan-400" />;
      case '3_GEMINI_AI_INFERENCE':
        return <Zap className="w-4 h-4 text-amber-400" />;
      case '4_FIRESTORE_PERSISTENCE':
        return <Database className="w-4 h-4 text-teal-400" />;
      default:
        return <Activity className="w-4 h-4 text-slate-400" />;
    }
  };

  return (
    <div
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/85 backdrop-blur-md"
    >
      <div className="relative w-full max-w-4xl bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="px-6 py-5 border-b border-slate-800 flex items-center justify-between bg-slate-950/70 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center text-cyan-400">
              <Activity className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                Pipeline Lifecycle &amp; Centralized Telemetry
                <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-cyan-500/20 text-cyan-300 border border-cyan-500/30">
                  Live Monitor
                </span>
              </h3>
              <p className="text-xs text-slate-400">
                Track receipt uploads, payload sizes, Gemini AI inference latency, and dropped packets
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

        {/* Pipeline Metrics Summary Dashboard */}
        <div className="p-6 bg-slate-950/40 border-b border-slate-800 grid grid-cols-2 sm:grid-cols-4 gap-4 shrink-0">
          <div className="p-3 bg-slate-900/80 border border-slate-800 rounded-xl">
            <div className="flex items-center gap-1.5 text-xs text-slate-400 mb-1">
              <Clock className="w-3.5 h-3.5 text-cyan-400" />
              <span>Avg Latency</span>
            </div>
            <p className="text-lg font-bold text-white font-mono">{summary.averageLatencyMs} ms</p>
          </div>

          <div className="p-3 bg-slate-900/80 border border-slate-800 rounded-xl">
            <div className="flex items-center gap-1.5 text-xs text-slate-400 mb-1">
              <HardDrive className="w-3.5 h-3.5 text-emerald-400" />
              <span>Avg Payload Size</span>
            </div>
            <p className="text-lg font-bold text-white font-mono">{summary.averagePayloadKb} KB</p>
          </div>

          <div className="p-3 bg-slate-900/80 border border-slate-800 rounded-xl">
            <div className="flex items-center gap-1.5 text-xs text-slate-400 mb-1">
              <CheckCircle2 className="w-3.5 h-3.5 text-teal-400" />
              <span>Scans Completed</span>
            </div>
            <p className="text-lg font-bold text-emerald-400 font-mono">{summary.successfulScans}</p>
          </div>

          <div className="p-3 bg-slate-900/80 border border-slate-800 rounded-xl">
            <div className="flex items-center gap-1.5 text-xs text-slate-400 mb-1">
              <AlertCircle className="w-3.5 h-3.5 text-rose-400" />
              <span>Dropped / Errors</span>
            </div>
            <p className="text-lg font-bold text-rose-400 font-mono">{summary.failedScans}</p>
          </div>
        </div>

        {/* 4-Stage Lifecycle Visual Pipeline */}
        <div className="px-6 py-4 bg-slate-950/60 border-b border-slate-800 overflow-x-auto shrink-0">
          <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-2">
            Document Upload & AI Processing Pipeline Stages
          </p>
          <div className="grid grid-cols-4 gap-2 min-w-[600px]">
            <div className="p-2.5 rounded-lg bg-slate-900 border border-slate-800 flex items-center gap-2">
              <div className="w-7 h-7 rounded-md bg-emerald-500/10 flex items-center justify-center text-emerald-400 shrink-0">
                <Cpu className="w-3.5 h-3.5" />
              </div>
              <div className="min-w-0">
                <p className="text-[11px] font-bold text-slate-200 truncate">1. File Compression</p>
                <p className="text-[10px] text-emerald-400 font-mono">100% Success</p>
              </div>
            </div>

            <div className="p-2.5 rounded-lg bg-slate-900 border border-slate-800 flex items-center gap-2">
              <div className="w-7 h-7 rounded-md bg-cyan-500/10 flex items-center justify-center text-cyan-400 shrink-0">
                <Server className="w-3.5 h-3.5" />
              </div>
              <div className="min-w-0">
                <p className="text-[11px] font-bold text-slate-200 truncate">2. Express Delivery</p>
                <p className="text-[10px] text-cyan-400 font-mono">98% Success</p>
              </div>
            </div>

            <div className="p-2.5 rounded-lg bg-slate-900 border border-slate-800 flex items-center gap-2">
              <div className="w-7 h-7 rounded-md bg-amber-500/10 flex items-center justify-center text-amber-400 shrink-0">
                <Zap className="w-3.5 h-3.5" />
              </div>
              <div className="min-w-0">
                <p className="text-[11px] font-bold text-slate-200 truncate">3. Gemini Inference</p>
                <p className="text-[10px] text-amber-400 font-mono">96% Success</p>
              </div>
            </div>

            <div className="p-2.5 rounded-lg bg-slate-900 border border-slate-800 flex items-center gap-2">
              <div className="w-7 h-7 rounded-md bg-teal-500/10 flex items-center justify-center text-teal-400 shrink-0">
                <Database className="w-3.5 h-3.5" />
              </div>
              <div className="min-w-0">
                <p className="text-[11px] font-bold text-slate-200 truncate">4. Firestore Storage</p>
                <p className="text-[10px] text-teal-400 font-mono">99% Success</p>
              </div>
            </div>
          </div>
        </div>

        {/* Central Logs Table Controls */}
        <div className="px-6 py-3 bg-slate-900 border-b border-slate-800 flex items-center justify-between gap-4 shrink-0">
          <div className="flex items-center gap-2">
            <Filter className="w-3.5 h-3.5 text-slate-400" />
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="bg-slate-950 border border-slate-800 text-slate-200 text-xs rounded-lg px-2.5 py-1 focus:outline-none cursor-pointer"
            >
              <option value="all">All Events ({logs.length})</option>
              <option value="success">Success Only</option>
              <option value="warning">Warnings Only</option>
              <option value="error">Errors & Dropped Only</option>
            </select>
          </div>

          <button
            onClick={() => telemetry.clearLogs()}
            className="flex items-center gap-1 text-xs text-slate-400 hover:text-rose-400 transition"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>Clear Logs</span>
          </button>
        </div>

        {/* Logs Table */}
        <div className="flex-1 overflow-y-auto p-6 space-y-2 custom-scrollbar">
          {filteredLogs.length === 0 ? (
            <div className="p-12 text-center text-slate-500 text-xs">
              No telemetry events match the selected filter.
            </div>
          ) : (
            filteredLogs.map((log) => (
              <div
                key={log.id}
                onClick={() => setSelectedLog(selectedLog?.id === log.id ? null : log)}
                className={`p-3.5 rounded-xl border transition cursor-pointer ${
                  selectedLog?.id === log.id
                    ? 'bg-slate-800/90 border-cyan-500/50'
                    : 'bg-slate-950/60 border-slate-800/80 hover:bg-slate-900'
                }`}
              >
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2.5 min-w-0">
                    {getStageIcon(log.stage)}
                    <span className="text-xs font-semibold text-slate-200 truncate">
                      {log.stageLabel}
                    </span>
                    {getStatusBadge(log.status)}
                  </div>
                  <div className="flex items-center gap-3 text-[11px] font-mono text-slate-400 shrink-0">
                    {log.durationMs !== undefined && (
                      <span className="text-cyan-400">{log.durationMs}ms</span>
                    )}
                    {log.payloadSizeKb !== undefined && (
                      <span className="text-emerald-400">{log.payloadSizeKb} KB</span>
                    )}
                    <span>{new Date(log.timestamp).toLocaleTimeString()}</span>
                  </div>
                </div>

                <p className="text-xs text-slate-300 mt-2 font-mono break-all">{log.message}</p>

                {/* Expanded Details Pane */}
                {selectedLog?.id === log.id && (
                  <div className="mt-3 pt-3 border-t border-slate-800 text-xs space-y-2">
                    {log.errorMessage && (
                      <div className="p-2.5 rounded bg-rose-950/40 border border-rose-500/30 text-rose-300 font-mono text-[11px]">
                        <strong>Error Trace:</strong> {log.errorMessage}
                      </div>
                    )}
                    {log.details && (
                      <div className="p-2.5 rounded bg-slate-900 border border-slate-800 font-mono text-[11px] text-slate-300">
                        <pre className="whitespace-pre-wrap">
                          {JSON.stringify(log.details, null, 2)}
                        </pre>
                      </div>
                    )}
                    <p className="text-[10px] text-slate-500">Event Identifier: {log.id}</p>
                  </div>
                )}
              </div>
            ))
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 bg-slate-950/80 border-t border-slate-800 flex items-center justify-between shrink-0">
          <span className="text-[11px] text-slate-400">
            Real-time Telemetry Service Active &bull; Monitored on Port 3000
          </span>
          <button
            onClick={onClose}
            className="px-4 py-2 text-xs font-semibold text-slate-200 bg-slate-800 hover:bg-slate-700 rounded-lg transition"
          >
            Close Telemetry Monitor
          </button>
        </div>
      </div>
    </div>
  );
};
