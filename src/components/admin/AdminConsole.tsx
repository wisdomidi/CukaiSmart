import React, { useState, useEffect } from 'react';
import {
  ShieldCheck,
  ArrowLeft,
  Database,
  Trash2,
  RefreshCw,
  Cpu,
  Server,
  KeyRound,
  FileCheck2,
  AlertTriangle,
  CheckCircle2,
  Activity,
  Layers,
  Search,
  Code,
  ShieldAlert,
  Clock,
  HelpCircle,
  Info,
  Users,
  Coins,
  DollarSign,
  Zap,
  MessageSquarePlus,
  Star,

  Sliders,
  Sparkles,
  Lock,
  Unlock,
  UserCheck,
  UserX,
  PlusCircle,
  Eye,
  LogOut,
  BarChart3,
  Check,
  X,
  FileText,
  SlidersHorizontal,
  Gauge,
  AlertOctagon,
  DownloadCloud,
  Edit3,
  TrendingUp,
  TrendingDown,
  Save,
  Radio,
  FileSpreadsheet,
  Menu,
  ChevronRight,
} from 'lucide-react';

import { useTax } from '../../context/TaxContext';
import { formatCurrency } from '../../utils/taxEngine';
import {
  ReceiptRecord,
  AdminUserRecord,
  AIScanLog,
  AIUsageAccounting,
  GoogleFreeTierUsage,
  LHDNRegulationItem,
} from '../../types/tax';
import {
  isUserAdmin,
  ADMIN_EMAILS,
  fetchAdminUserDirectory,
  fetchAIScanLogs,
  updateUserQuotaOrStatus,
  fetchGoogleFreeTierStats,
  updateCircuitBreakerSettings,
  simulateUsageLevel,
  fetchServerAIAuditLogs,
  updateRemoteLhdnReliefs,
  fetchUserFeedbacksFromCloud,
  fetchCrashLogsFromCloud,
} from '../../services/firebase';
import { useFreeTierUsageMonitoring } from '../../hooks/useFreeTierUsageMonitoring';
import { SolutionVsHumanCostModal } from '../analytics/SolutionVsHumanCostModal';

interface AdminConsoleProps {
  onExit?: () => void;
}

export const AdminConsole: React.FC<AdminConsoleProps> = ({ onExit }) => {
  const {
    currentUser,
    loginWithGoogle,
    loginWithEmail,
    logout,
    receipts,
    deleteReceipt,
    clearDemoReceipts,
    resetAllData,
    activeTaxYear,
    personalReliefs,
    businessCategories,
    lastLHDNSyncTime,
    syncWithLHDN,
  } = useTax();

  // Authentication & Gate State
  const [adminEmail, setAdminEmail] = useState('');
  const [adminPassword, setAdminPassword] = useState('');
  const [authError, setAuthError] = useState('');
  const [isAuthSubmitting, setIsAuthSubmitting] = useState(false);

  // Active Tab
  const [activeTab, setActiveTab] = useState<
    'overview' | 'users' | 'user_feedback' | 'ai_telemetry' | 'crash_logs' | 'lhdn_regulations' | 'compliance_auditor' | 'database'
  >('overview');

  // User Feedbacks State
  const [userFeedbackList, setUserFeedbackList] = useState<import('../../types/tax').UserFeedbackRecord[]>([]);
  const [isLoadingFeedbacks, setIsLoadingFeedbacks] = useState(false);

  // System Crash Logs State
  const [crashLogsList, setCrashLogsList] = useState<import('../../types/tax').CrashLogRecord[]>([]);
  const [isLoadingCrashLogs, setIsLoadingCrashLogs] = useState(false);



  // Database Operations State
  const [isPurging, setIsPurging] = useState(false);
  const [purgeStatusMessage, setPurgeStatusMessage] = useState<string | null>(null);
  const [isSyncingGazette, setIsSyncingGazette] = useState(false);
  const [selectedRecordJson, setSelectedRecordJson] = useState<any | null>(null);
  const [adminSearch, setAdminSearch] = useState('');

  // User Directory State
  const [usersDirectory, setUsersDirectory] = useState<AdminUserRecord[]>([]);
  const [isLoadingUsers, setIsLoadingUsers] = useState(false);
  const [userSearch, setUserSearch] = useState('');
  const [usersCurrentPage, setUsersCurrentPage] = useState(1);
  const [usersPerPage, setUsersPerPage] = useState(10);
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);



  // AI Telemetry & Audit Logs State
  const [aiScanLogs, setAiScanLogs] = useState<AIScanLog[]>([]);
  const [isLoadingLogs, setIsLoadingLogs] = useState(false);
  const [selectedLogForReview, setSelectedLogForReview] = useState<AIScanLog | null>(null);
  const [auditFilter, setAuditFilter] = useState<'all' | 'compliant' | 'warning' | 'flagged'>('all');
  const [docTypeFilter, setDocTypeFilter] = useState<string>('all');
  const [userIdAuditFilter, setUserIdAuditFilter] = useState<string>('');
  const [abuseFilterOnly, setAbuseFilterOnly] = useState<boolean>(false);

  // Determine if user has administrator authorization directly from role
  const isAdminAuthorized = isUserAdmin(currentUser);

  // Google Gemini Free Tier FinOps Monitoring Hook (triggers toasts at 50%, 70%, 90%)
  const {
    usage: freeTierUsage,
    toasts: usageToasts,
    dismissToast,
    simulateAndNotify,
    refreshUsage: refreshFreeTierUsage,
  } = useFreeTierUsageMonitoring({ enabled: isAdminAuthorized });
  const [isUpdatingCircuitBreaker, setIsUpdatingCircuitBreaker] = useState(false);
  const [circuitBreakerFeedback, setCircuitBreakerFeedback] = useState<string | null>(null);
  const [isCostRoiOpen, setIsCostRoiOpen] = useState(false);

  // LHDN Regulations Management State
  const [lhdnRegulations, setLhdnRegulations] = useState<LHDNRegulationItem[]>(() => {
    return personalReliefs.map((r) => ({
      id: r.id,
      title: r.name,
      category: r.category,
      statutorySection: r.section,
      maxLimit: r.maxLimit,
      description: r.description,
      isActive: true,
      lastUpdatedYear: 2026,
      eligibleItems: r.eligibleItems || [],
      ineligibleItems: r.ineligibleItems || [],
    }));
  });
  const [isSavingRegulations, setIsSavingRegulations] = useState(false);
  const [regulationsStatusMsg, setRegulationsStatusMsg] = useState<string | null>(null);
  const [editingReliefItem, setEditingReliefItem] = useState<LHDNRegulationItem | null>(null);
  const [editLimitValue, setEditLimitValue] = useState<number>(0);
  const [editTitleValue, setEditTitleValue] = useState<string>('');
  const [editSectionValue, setEditSectionValue] = useState<string>('');
  const [editDescValue, setEditDescValue] = useState<string>('');
  const [isAddingReliefModal, setIsAddingReliefModal] = useState(false);
  const [newRelief, setNewRelief] = useState<Partial<LHDNRegulationItem>>({
    id: '',
    title: '',
    category: 'lifestyle',
    statutorySection: 'Sec 46(1) ITA 1967',
    maxLimit: 2000,
    description: '',
    isActive: true,
    lastUpdatedYear: 2026,
  });

  // Load Directory, AI Logs, Free Usage Stats & Live Regulations
  const refreshAdminData = async () => {
    if (!isAdminAuthorized) return;

    // 1. Load Free Tier Sentinel Stats
    try {
      await refreshFreeTierUsage();
    } catch (err) {
      console.warn('Could not fetch free tier stats', err);
    }

    // 2. Load User Directory
    setIsLoadingUsers(true);
    try {
      const cloudUsers = await fetchAdminUserDirectory();
      if (cloudUsers && cloudUsers.length > 0) {
        setUsersDirectory(cloudUsers);
      } else {
        const currentEmail = currentUser?.email || 'admin@cukaismart.my';
        const totalClaimed = receipts.reduce((acc, r) => acc + (r.claimableAmount || 0), 0);
        setUsersDirectory([
          {
            uid: currentUser?.uid || 'admin-master-uid',
            email: currentEmail,
            displayName: currentUser?.displayName || 'Chief Tax Administrator',
            persona: 'individual',
            role: 'admin',
            documentsCount: receipts.length,
            totalClaimedAmount: totalClaimed,
            aiScansUsed: Math.max(1, receipts.length),
            aiScansLimit: 100,
            status: 'active',
            createdAt: '2026-01-01T00:00:00Z',
            lastActive: new Date().toISOString(),
          },
        ]);
      }
    } catch (err) {
      console.warn('Notice: Could not load user directory from cloud', err);
    } finally {
      setIsLoadingUsers(false);
    }

    // 3. Load AI Audit Logs (Merging Server-side logs and Firestore logs)
    setIsLoadingLogs(true);
    try {
      const serverLogs = await fetchServerAIAuditLogs({ limit: 100 });
      const firestoreLogs = await fetchAIScanLogs(50);

      // Deduplicate by ID
      const mergedMap = new Map<string, AIScanLog>();
      (serverLogs || []).forEach((l: any) => mergedMap.set(l.id, l));
      (firestoreLogs || []).forEach((l: any) => {
        if (!mergedMap.has(l.id)) {
          mergedMap.set(l.id, {
            ...l,
            documentType: l.documentType || 'Official Tax Invoice',
            abuseFlag: Boolean(l.abuseFlag),
          });
        }
      });

      if (mergedMap.size > 0) {
        const sorted = Array.from(mergedMap.values()).sort(
          (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
        );
        setAiScanLogs(sorted);
      } else {
        // Fallback baseline synthesized from current receipts if no standalone logs yet
        const fallbackLogs: AIScanLog[] = receipts.map((r, i) => ({
          id: `ailog-${r.id}`,
          timestamp: r.createdAt || new Date().toISOString(),
          userId: currentUser?.uid || 'user-1',
          userEmail: currentUser?.email || 'taxpayer@example.com',
          documentType: r.totalAmount > 1000 ? 'High-Value Tax Invoice' : 'Cash Receipt',
          merchantName: r.merchantName,
          ssmNumber: r.ssmNumber,
          category: r.categoryName,
          statutorySection: r.statutorySection,
          claimableAmount: r.claimableAmount,
          totalAmount: r.totalAmount,
          isTaxDeductible: true,
          confidenceScore: r.aiConfidence || 95,
          auditStatus: r.lhdnValidation.auditStatus,
          aiModel: 'gemini-3.8-flash',
          latencyMs: 1350 + i * 40,
          inputTokens: 1450,
          outputTokens: 380,
          abuseFlag: false,
          isAccurateByLHDN: r.lhdnValidation.auditStatus !== 'flagged',
          ruleCheckNote: `Matched ${r.statutorySection} under Budget 2026 statutory limits.`,
          adminVerifiedStatus: 'verified',
        }));
        setAiScanLogs(fallbackLogs);
      }
    } catch (err) {
      console.warn('Notice: Could not load AI logs', err);
    } finally {
      setIsLoadingLogs(false);
    }

    // 4. Load User Feedbacks from Firestore
    setIsLoadingFeedbacks(true);
    try {
      const cloudFeedbacks = await fetchUserFeedbacksFromCloud();
      setUserFeedbackList(cloudFeedbacks);
    } catch (err) {
      console.warn('Notice: Could not load user feedbacks', err);
    } finally {
      setIsLoadingFeedbacks(false);
    }

    // 5. Load System Component Crash Logs from Firestore
    setIsLoadingCrashLogs(true);
    try {
      const cloudCrashes = await fetchCrashLogsFromCloud();
      setCrashLogsList(cloudCrashes);
    } catch (err) {
      console.warn('Notice: Could not load crash logs', err);
    } finally {
      setIsLoadingCrashLogs(false);
    }
  };



  useEffect(() => {
    if (isAdminAuthorized) {
      refreshAdminData();
      const interval = setInterval(refreshAdminData, 15000); // 15s live polling
      return () => clearInterval(interval);
    }
  }, [isAdminAuthorized, currentUser, receipts.length]);

  // Sync regulations with TaxContext's personalReliefs if regulations list is empty
  useEffect(() => {
    if (personalReliefs.length > 0 && lhdnRegulations.length === 0) {
      setLhdnRegulations(
        personalReliefs.map((r) => ({
          id: r.id,
          title: r.name,
          category: r.category,
          statutorySection: r.section,
          maxLimit: r.maxLimit,
          description: r.description,
          isActive: true,
          lastUpdatedYear: 2026,
          eligibleItems: r.eligibleItems || [],
          ineligibleItems: r.ineligibleItems || [],
        }))
      );
    }
  }, [personalReliefs]);

  // Aggregate Metrics Calculations
  const totalVaultReceipts = receipts.length;
  const totalClaimedValue = receipts.reduce((acc, r) => acc + (r.claimableAmount || 0), 0);
  const totalGrossValue = receipts.reduce((acc, r) => acc + (r.totalAmount || 0), 0);

  // Explicit Real-Time Metrics
  const totalDocumentScansCount = aiScanLogs.filter(
    (l) => l.actionType !== 'copilot_chat' && !l.documentType?.includes('Copilot')
  ).length || Math.max(receipts.length, freeTierUsage.requestsToday);

  const totalCopilotInquiriesCount = aiScanLogs.filter(
    (l) => l.actionType === 'copilot_chat' || l.documentType?.includes('Copilot') || l.category?.includes('Copilot')
  ).length;

  const totalActiveUsersCount = usersDirectory.filter((u) => u.status === 'active').length || usersDirectory.length;
  const totalIndividualUsersCount = usersDirectory.filter((u) => u.persona === 'individual').length;
  const totalBusinessUsersCount = usersDirectory.filter((u) => u.persona === 'business').length;



  // AI Usage Accounting
  const totalAIScansCount = Math.max(aiScanLogs.length, receipts.length, freeTierUsage.requestsToday);
  const estimatedInputTokens = totalAIScansCount * 1250;
  const estimatedOutputTokens = totalAIScansCount * 380;
  const estimatedCostUsd = Number(
    ((estimatedInputTokens / 1_000_000) * 0.15 + (estimatedOutputTokens / 1_000_000) * 0.6).toFixed(4)
  );
  const estimatedCostMyr = Number((estimatedCostUsd * 4.45).toFixed(2));
  const avgLatencyMs =
    aiScanLogs.length > 0
      ? Math.round(aiScanLogs.reduce((sum, l) => sum + (l.latencyMs || 1400), 0) / aiScanLogs.length)
      : 1380;
  const compliantLogsCount = aiScanLogs.filter((l) => l.auditStatus !== 'flagged').length;
  const aiAccuracyRate =
    aiScanLogs.length > 0 ? Math.round((compliantLogsCount / aiScanLogs.length) * 100) : 98;

  // Handle Google Admin Login
  const handleGoogleAdminLogin = async () => {
    try {
      setIsAuthSubmitting(true);
      setAuthError('');
      const user = await loginWithGoogle();
      if (!isUserAdmin(user)) {
        // Role is regular user: redirect to main taxpayer application
        if (onExit) {
          onExit();
        }
        return;
      }
    } catch (err: any) {
      setAuthError(err?.message || 'Google authentication interrupted.');
    } finally {
      setIsAuthSubmitting(false);
    }
  };

  // Handle Email Admin Login
  const handleEmailAdminLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setIsAuthSubmitting(true);
      setAuthError('');
      const user = await loginWithEmail(adminEmail, adminPassword);
      if (!isUserAdmin(user)) {
        // Role is regular user: redirect to main taxpayer application
        if (onExit) {
          onExit();
        }
        return;
      }
    } catch (err: any) {
      setAuthError(err?.message || 'Authentication failed. Please verify admin credentials.');
    } finally {
      setIsAuthSubmitting(false);
    }
  };

  const handleAdminLogout = async () => {
    sessionStorage.removeItem('cukaismart_admin_unlocked');
    if (currentUser) {
      await logout();
    }
    if (onExit) {
      onExit();
    }
  };

  // User Management Handlers
  const handleToggleUserStatus = async (user: AdminUserRecord) => {
    const newStatus = user.status === 'active' ? 'suspended' : 'active';
    try {
      await updateUserQuotaOrStatus(user.uid, { status: newStatus });
      setUsersDirectory((prev) =>
        prev.map((u) => (u.uid === user.uid ? { ...u, status: newStatus } : u))
      );
    } catch (err) {
      console.error('Error toggling user status', err);
    }
  };

  const handleAdjustUserQuota = async (user: AdminUserRecord, delta: number) => {
    const newLimit = Math.max(5, user.aiScansLimit + delta);
    try {
      await updateUserQuotaOrStatus(user.uid, { aiScansLimit: newLimit });
      setUsersDirectory((prev) =>
        prev.map((u) => (u.uid === user.uid ? { ...u, aiScansLimit: newLimit } : u))
      );
    } catch (err) {
      console.error('Error adjusting quota', err);
    }
  };

  // Free Tier Circuit Breaker & Simulation Controls
  const handleToggleAutoThrottle = async () => {
    setIsUpdatingCircuitBreaker(true);
    try {
      const updated = await updateCircuitBreakerSettings({
        autoThrottleEnabled: !freeTierUsage.autoThrottleEnabled,
      });
      await refreshFreeTierUsage();
      setCircuitBreakerFeedback(
        updated.autoThrottleEnabled
          ? 'Zero-Bill Hard Circuit Breaker is ACTIVE. API calls will halt before incurring billing.'
          : 'Auto-throttling disabled. Note: Usage past free tier will be allowed.'
      );
      setTimeout(() => setCircuitBreakerFeedback(null), 4000);
    } catch (err: any) {
      setCircuitBreakerFeedback('Failed to update circuit breaker settings.');
    } finally {
      setIsUpdatingCircuitBreaker(false);
    }
  };

  const handleSimulateThreshold = async (pct: number) => {
    setIsUpdatingCircuitBreaker(true);
    try {
      await simulateAndNotify(pct);
      setCircuitBreakerFeedback(`Simulated free usage set to ${pct}%. Threshold check and toast evaluation executed.`);
      setTimeout(() => setCircuitBreakerFeedback(null), 5000);
    } catch (err) {
      setCircuitBreakerFeedback('Error simulating usage level.');
    } finally {
      setIsUpdatingCircuitBreaker(false);
    }
  };

  const handleResetFreeUsageCounter = async () => {
    setIsUpdatingCircuitBreaker(true);
    try {
      await simulateAndNotify(0);
      setCircuitBreakerFeedback("Today's usage counter reset to 0. Circuit breaker cleared.");
      setTimeout(() => setCircuitBreakerFeedback(null), 4000);
    } catch (err) {
      setCircuitBreakerFeedback('Error resetting usage counter.');
    } finally {
      setIsUpdatingCircuitBreaker(false);
    }
  };

  // LHDN Regulations Management Handlers
  const handleStartEditRelief = (item: LHDNRegulationItem) => {
    setEditingReliefItem(item);
    setEditLimitValue(item.maxLimit);
    setEditTitleValue(item.title);
    setEditSectionValue(item.statutorySection);
    setEditDescValue(item.description);
  };

  const handleSaveReliefEdit = async () => {
    if (!editingReliefItem) return;
    setIsSavingRegulations(true);
    try {
      const updatedList = lhdnRegulations.map((r) =>
        r.id === editingReliefItem.id
          ? {
              ...r,
              maxLimit: Number(editLimitValue),
              title: editTitleValue.trim() || r.title,
              statutorySection: editSectionValue.trim() || r.statutorySection,
              description: editDescValue.trim() || r.description,
            }
          : r
      );
      setLhdnRegulations(updatedList);
      await updateRemoteLhdnReliefs(updatedList);
      setRegulationsStatusMsg(`Successfully updated "${editingReliefItem.title}" to RM ${Number(editLimitValue).toLocaleString()}. Broadcasted to AI scanner.`);
      setEditingReliefItem(null);
      setTimeout(() => setRegulationsStatusMsg(null), 4000);
    } catch (err: any) {
      setRegulationsStatusMsg(`Error saving relief: ${err?.message || 'Server error'}`);
    } finally {
      setIsSavingRegulations(false);
    }
  };

  const handleToggleReliefActive = async (id: string) => {
    const updatedList = lhdnRegulations.map((r) => (r.id === id ? { ...r, isActive: !r.isActive } : r));
    setLhdnRegulations(updatedList);
    try {
      await updateRemoteLhdnReliefs(updatedList);
    } catch (e) {
      console.warn('Could not broadcast active toggle', e);
    }
  };

  const handleAddNewRelief = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newRelief.title || !newRelief.statutorySection) return;
    setIsSavingRegulations(true);
    try {
      const item: LHDNRegulationItem = {
        id: newRelief.id?.trim() || `relief-${Date.now()}`,
        title: newRelief.title.trim(),
        category: newRelief.category || 'lifestyle',
        statutorySection: newRelief.statutorySection.trim(),
        maxLimit: Number(newRelief.maxLimit) || 1000,
        description: newRelief.description || 'Statutory tax relief under Income Tax Act 1967.',
        isActive: true,
        lastUpdatedYear: 2026,
      };
      const updatedList = [...lhdnRegulations, item];
      setLhdnRegulations(updatedList);
      await updateRemoteLhdnReliefs(updatedList);
      setIsAddingReliefModal(false);
      setNewRelief({
        id: '',
        title: '',
        category: 'lifestyle',
        statutorySection: 'Sec 46(1) ITA 1967',
        maxLimit: 2000,
        description: '',
        isActive: true,
        lastUpdatedYear: 2026,
      });
      setRegulationsStatusMsg(`New category "${item.title}" added and activated in AI scanner.`);
      setTimeout(() => setRegulationsStatusMsg(null), 4000);
    } catch (err: any) {
      setRegulationsStatusMsg(`Error adding relief category: ${err?.message || 'Server error'}`);
    } finally {
      setIsSavingRegulations(false);
    }
  };

  const handleSyncWithRemoteGazette = async () => {
    setIsSyncingGazette(true);
    setRegulationsStatusMsg(null);
    try {
      const syncResult = await syncWithLHDN();
      const liveRes = await fetch('/api/lhdn/sync-reliefs');
      if (liveRes.ok) {
        const liveData = await liveRes.json();
        if (liveData.reliefs && Array.isArray(liveData.reliefs)) {
          setLhdnRegulations(liveData.reliefs);
        }
      }
      setRegulationsStatusMsg(
        `Synchronized with Official Gazette (YA ${syncResult.totalReliefs || 13} categories refreshed). AI scanner updated.`
      );
      setTimeout(() => setRegulationsStatusMsg(null), 5000);
    } catch (err: any) {
      setRegulationsStatusMsg('Notice: Gazette synchronization failed. Check connectivity.');
    } finally {
      setIsSyncingGazette(false);
    }
  };

  // Nuclear Database Purge Handlers
  const handleNuclearPurge = async () => {
    if (
      !window.confirm(
        'WARNING: You are about to initiate a NUCLEAR PURGE. This will permanently delete all receipts from Cloud Firestore and reset local storage. Proceed?'
      )
    ) {
      return;
    }
    setIsPurging(true);
    setPurgeStatusMessage('Executing nuclear purge across Cloud Firestore collections...');
    try {
      await clearDemoReceipts();
      setPurgeStatusMessage('SUCCESS: Nuclear purge completed. Vault is completely empty.');
      setTimeout(() => setPurgeStatusMessage(null), 5000);
    } catch (e: any) {
      setPurgeStatusMessage(`ERROR during purge: ${e?.message || 'Firestore timeout'}`);
    } finally {
      setIsPurging(false);
    }
  };

  const handleFullSystemReset = async () => {
    if (!window.confirm('RESET PLATFORM: This will wipe all user settings, brackets, and receipts. Continue?')) {
      return;
    }
    setIsPurging(true);
    setPurgeStatusMessage('Resetting system to factory defaults...');
    try {
      await resetAllData();
      setPurgeStatusMessage('SUCCESS: Factory reset complete. Local & Cloud state re-initialized.');
      setTimeout(() => setPurgeStatusMessage(null), 5000);
    } catch (e: any) {
      setPurgeStatusMessage(`ERROR during system reset: ${e?.message || 'Failed'}`);
    } finally {
      setIsPurging(false);
    }
  };

  const handleVerifyScanLog = (logId: string, status: 'verified' | 'flagged') => {
    setAiScanLogs((prev) =>
      prev.map((log) => (log.id === logId ? { ...log, adminVerifiedStatus: status } : log))
    );
  };

  // Filters
  const filteredUsers = usersDirectory.filter((u) => {
    const q = userSearch.toLowerCase();
    return (
      u.email.toLowerCase().includes(q) ||
      u.displayName.toLowerCase().includes(q) ||
      u.uid.toLowerCase().includes(q)
    );
  });

  const filteredAILogs = aiScanLogs.filter((log) => {
    if (auditFilter === 'compliant' && log.auditStatus === 'flagged') return false;
    if (auditFilter === 'warning' && log.auditStatus !== 'warning') return false;
    if (auditFilter === 'flagged' && log.auditStatus !== 'flagged') return false;
    if (docTypeFilter !== 'all' && log.documentType !== docTypeFilter) return false;
    if (userIdAuditFilter) {
      const q = userIdAuditFilter.toLowerCase();
      if (!log.userId.toLowerCase().includes(q) && !log.userEmail.toLowerCase().includes(q)) return false;
    }
    if (abuseFilterOnly && !log.abuseFlag && log.riskScore !== 'HIGH' && log.auditStatus !== 'flagged') return false;
    return true;
  });

  const uniqueDocTypes = Array.from(
    new Set(aiScanLogs.map((l) => l.documentType || 'Official Tax Invoice'))
  );

  const filteredAdminReceipts = receipts.filter((r) => {
    const q = adminSearch.toLowerCase();
    return (
      r.merchantName.toLowerCase().includes(q) ||
      r.categoryName.toLowerCase().includes(q) ||
      r.ssmNumber.toLowerCase().includes(q) ||
      r.id.toLowerCase().includes(q)
    );
  });

  // =========================================================================
  // RENDER: ADMINISTRATOR ACCESS GATE (IF UNAUTHORIZED)
  // =========================================================================
  if (!isAdminAuthorized) {
    return (
      <div className="max-w-xl mx-auto py-12 px-4 animate-fade-in text-slate-100">
        <div className="p-6 sm:p-8 rounded-3xl bg-slate-900 border border-slate-800 shadow-2xl text-center space-y-6">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-amber-500 to-rose-500 p-0.5 mx-auto shadow-lg shadow-amber-500/20">
            <div className="w-full h-full bg-slate-950 rounded-[14px] flex items-center justify-center">
              <Lock className="w-7 h-7 text-amber-400" />
            </div>
          </div>

          <div>
            <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-rose-500/10 border border-rose-500/30 text-rose-400 text-[11px] font-bold mb-2">
              <ShieldAlert className="w-3.5 h-3.5" />
              <span>Restricted Platform Governance</span>
            </div>
            <h2 className="text-xl sm:text-2xl font-black text-white tracking-tight">
              Admin Access Gate
            </h2>
            <p className="text-xs sm:text-sm text-slate-400 mt-1 leading-relaxed">
              Guest users and general taxpayers cannot access platform telemetry, user account controls, FinOps budgets, or nuclear purge utilities. Please authenticate with administrator credentials.
            </p>
          </div>

          {authError && (
            <div className="p-3.5 rounded-xl bg-rose-950/70 border border-rose-500/40 text-rose-300 text-xs font-medium leading-relaxed">
              {authError}
            </div>
          )}

          {/* Option 1: One-Click Admin Google Sign-In */}
          <div className="space-y-3">
            <button
              onClick={handleGoogleAdminLogin}
              disabled={isAuthSubmitting}
              className="w-full py-2.5 px-4 rounded-xl bg-white hover:bg-slate-100 text-slate-950 font-bold text-xs flex items-center justify-center gap-2 transition active:scale-95 shadow-lg cursor-pointer disabled:opacity-50"
            >
              <svg className="w-4 h-4" viewBox="0 0 24 24">
                <path
                  fill="#4285F4"
                  d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.8-2.4 3.65v3.05h3.88c2.27-2.09 3.66-5.17 3.66-9.14z"
                />
                <path
                  fill="#34A853"
                  d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.25v3.15C3.26 21.36 7.34 24 12 24z"
                />
                <path
                  fill="#FBBC05"
                  d="M5.28 14.27c-.25-.72-.38-1.49-.38-2.27s.13-1.55.38-2.27V6.58H1.25C.45 8.18 0 9.99 0 12s.45 3.82 1.25 5.42l4.03-3.15z"
                />
                <path
                  fill="#EA4335"
                  d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.34 0 3.26 2.64 1.25 6.58l4.03 3.15c.95-2.83 3.6-4.98 6.72-4.98z"
                />
              </svg>
              <span>{isAuthSubmitting ? 'Verifying...' : 'Sign In with Authorized Google Admin'}</span>
            </button>

            <div className="relative flex py-1 items-center">
              <div className="flex-grow border-t border-slate-800"></div>
              <span className="flex-shrink mx-2 text-[10px] text-slate-500 uppercase tracking-wider font-semibold">Or with Admin Email</span>
              <div className="flex-grow border-t border-slate-800"></div>
            </div>

            {/* Email / Password Sign In */}
            <form onSubmit={handleEmailAdminLogin} className="space-y-3">
              <div>
                <label className="block text-[11px] font-semibold text-slate-300 mb-1">
                  Admin Email
                </label>
                <input
                  type="email"
                  placeholder="admin@example.com"
                  value={adminEmail}
                  onChange={(e) => setAdminEmail(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white placeholder-slate-600 focus:outline-none focus:border-emerald-500"
                  required
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-300 mb-1">
                  Password
                </label>
                <input
                  type="password"
                  placeholder="Enter admin password"
                  value={adminPassword}
                  onChange={(e) => setAdminPassword(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white placeholder-slate-600 focus:outline-none focus:border-emerald-500"
                  required
                />
              </div>

              <button
                type="submit"
                disabled={isAuthSubmitting}
                className="w-full py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-lg transition active:scale-95 cursor-pointer disabled:opacity-50"
              >
                {isAuthSubmitting ? 'Authenticating...' : 'Log In as Administrator'}
              </button>
            </form>
          </div>

          <div className="pt-3 border-t border-slate-800/80 text-[11px] text-slate-400 space-y-1">
            <p>
              <strong>Access Policy:</strong>{' '}
              <span className="text-slate-300">Authorized administrator accounts only.</span>
            </p>
            <p className="text-slate-500 text-[10px]">
              Role-based redirection active. Upon successful login, administrators are routed directly to this management console; standard accounts are routed to the taxpayer dashboard.
            </p>
          </div>

          {onExit && (
            <div className="pt-2">
              <button
                type="button"
                onClick={onExit}
                className="w-full py-2.5 px-4 rounded-xl bg-slate-800/80 hover:bg-slate-800 text-slate-300 hover:text-white text-xs font-semibold border border-slate-700/80 transition flex items-center justify-center gap-2 cursor-pointer"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>Return to CukaiSmart Main App</span>
              </button>
            </div>
          )}
        </div>
      </div>
    );
  }

  // =========================================================================
  // RENDER: FULL PRODUCTION ADMINISTRATOR MANAGEMENT CONSOLE (SIDEBAR LAYOUT)
  // =========================================================================
  const navTabTitleMap: Record<string, string> = {
    overview: 'Overview & Metrics',
    users: 'User Accounts & Activity Directory',
    ai_telemetry: 'AI Audit Trail & Free Tier Sentinel',
    lhdn_regulations: 'LHDN Regulations & Live Gazette Sync',
    compliance_auditor: 'AI Accuracy Auditor & Benchmarks',
    database: 'Database Explorer & Operations',
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col md:flex-row relative font-sans animate-fade-in">
      {/* Toast Notifications for Free Tier Thresholds */}
      {usageToasts.length > 0 && (
        <div className="fixed top-6 right-6 z-50 flex flex-col gap-3 max-w-sm w-full pointer-events-auto animate-fade-in">
          {usageToasts.map((toast) => (
            <div
              key={toast.id}
              className={`p-4 rounded-2xl border shadow-2xl backdrop-blur-md flex items-start gap-3 transition-all ${
                toast.level === 'critical'
                  ? 'bg-rose-950/95 border-rose-500/80 text-rose-100 shadow-rose-950/70 animate-pulse'
                  : toast.level === 'warning'
                  ? 'bg-amber-950/95 border-amber-500/80 text-amber-100 shadow-amber-950/70'
                  : 'bg-slate-900/95 border-yellow-500/70 text-yellow-100 shadow-yellow-950/60'
              }`}
            >
              <div
                className={`p-2 rounded-xl shrink-0 mt-0.5 ${
                  toast.level === 'critical'
                    ? 'bg-rose-500/20 text-rose-400'
                    : toast.level === 'warning'
                    ? 'bg-amber-500/20 text-amber-400'
                    : 'bg-yellow-500/20 text-yellow-400'
                }`}
              >
                <AlertOctagon className="w-5 h-5" />
              </div>
              <div className="flex-1 space-y-1">
                <div className="flex items-center justify-between">
                  <span className="font-black text-xs uppercase tracking-wide">
                    {toast.title}
                  </span>
                  <button
                    onClick={() => dismissToast(toast.id)}
                    className="text-slate-400 hover:text-white p-0.5 cursor-pointer"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
                <p className="text-[11px] leading-relaxed text-slate-200">
                  {toast.message}
                </p>
                <div className="flex items-center gap-2 pt-1.5">
                  <button
                    onClick={() => {
                      setActiveTab('ai_telemetry');
                      dismissToast(toast.id);
                    }}
                    className="px-2.5 py-1 rounded-lg bg-white/20 hover:bg-white/30 text-[10px] font-bold text-white transition cursor-pointer"
                  >
                    View Sentinel
                  </button>
                  <button
                    onClick={() => dismissToast(toast.id)}
                    className="text-[10px] text-slate-400 hover:text-slate-200 cursor-pointer"
                  >
                    Dismiss
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ========================================================= */}
      {/* MOBILE SIDEBAR DRAWER OVERLAY */}
      {/* ========================================================= */}
      {isMobileSidebarOpen && (
        <div
          className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-40 md:hidden"
          onClick={() => setIsMobileSidebarOpen(false)}
        />
      )}

      {/* ========================================================= */}
      {/* SIDEBAR NAVIGATION (DESKTOP FIXED + MOBILE SLIDE-OVER)    */}
      {/* ========================================================= */}
      <aside
        className={`w-64 bg-slate-900 border-r border-slate-800 flex flex-col justify-between shrink-0 fixed md:sticky top-0 h-screen z-50 transition-transform duration-300 ease-in-out ${
          isMobileSidebarOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'
        }`}
      >
        <div className="p-4 space-y-6 overflow-y-auto">
          {/* Sidebar Brand Header */}
          <div className="flex items-center justify-between pb-4 border-b border-slate-800">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-emerald-500 to-cyan-500 p-0.5 shadow-lg shadow-emerald-500/20">
                <div className="w-full h-full bg-slate-950 rounded-[10px] flex items-center justify-center">
                  <ShieldCheck className="w-5 h-5 text-emerald-400" />
                </div>
              </div>
              <div>
                <h1 className="text-sm font-black text-white tracking-tight">CukaiSmart Ops</h1>
                <span className="text-[10px] text-emerald-400 font-mono font-semibold block">
                  Admin Governance
                </span>
              </div>
            </div>

            <button
              onClick={() => setIsMobileSidebarOpen(false)}
              className="md:hidden text-slate-400 hover:text-white p-1"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* System Free Tier Health Mini Gauge */}
          <div className="p-3 rounded-xl bg-slate-950/80 border border-slate-800 space-y-2">
            <div className="flex items-center justify-between text-[11px]">
              <span className="text-slate-400 font-medium">Free Tier Guardrail</span>
              <span className="font-mono font-bold text-emerald-400">{freeTierUsage.dailyPercentage}%</span>
            </div>
            <div className="h-1.5 w-full bg-slate-800 rounded-full overflow-hidden">
              <div
                className={`h-full rounded-full transition-all ${
                  freeTierUsage.dailyPercentage >= 90
                    ? 'bg-rose-500'
                    : freeTierUsage.dailyPercentage >= 70
                    ? 'bg-amber-500'
                    : 'bg-emerald-500'
                }`}
                style={{ width: `${Math.min(100, freeTierUsage.dailyPercentage)}%` }}
              />
            </div>
            <p className="text-[10px] text-slate-400 font-mono">
              {freeTierUsage.requestsToday} / {freeTierUsage.requestsDailyLimit} RPD · <strong className="text-emerald-300">$0.00 Cost</strong>
            </p>
          </div>

          {/* Navigation Groups */}
          <nav className="space-y-5 text-xs">
            {/* Group 1: Analytics & Sentinel */}
            <div>
              <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider px-2 block mb-1.5">
                Analytics &amp; Intelligence
              </span>
              <div className="space-y-1">
                <button
                  onClick={() => {
                    setActiveTab('overview');
                    setIsMobileSidebarOpen(false);
                  }}
                  className={`w-full flex items-center justify-between px-3 py-2 rounded-xl font-bold transition cursor-pointer ${
                    activeTab === 'overview'
                      ? 'bg-emerald-600 text-white shadow-md'
                      : 'text-slate-400 hover:text-white hover:bg-slate-800/80'
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <BarChart3 className="w-4 h-4" />
                    <span>Overview &amp; Metrics</span>
                  </div>
                  {activeTab === 'overview' && <ChevronRight className="w-3.5 h-3.5" />}
                </button>

                <button
                  onClick={() => {
                    setActiveTab('ai_telemetry');
                    setIsMobileSidebarOpen(false);
                  }}
                  className={`w-full flex items-center justify-between px-3 py-2 rounded-xl font-bold transition cursor-pointer ${
                    activeTab === 'ai_telemetry'
                      ? 'bg-emerald-600 text-white shadow-md'
                      : 'text-slate-400 hover:text-white hover:bg-slate-800/80'
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <Zap className="w-4 h-4 text-cyan-400" />
                    <span>AI Audit &amp; Sentinel</span>
                  </div>
                  {freeTierUsage.dailyPercentage >= 50 && (
                    <span className="w-2 h-2 rounded-full bg-amber-400 animate-ping" />
                  )}
                </button>

                <button
                  onClick={() => {
                    setActiveTab('compliance_auditor');
                    setIsMobileSidebarOpen(false);
                  }}
                  className={`w-full flex items-center justify-between px-3 py-2 rounded-xl font-bold transition cursor-pointer ${
                    activeTab === 'compliance_auditor'
                      ? 'bg-emerald-600 text-white shadow-md'
                      : 'text-slate-400 hover:text-white hover:bg-slate-800/80'
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <ShieldCheck className="w-4 h-4 text-emerald-400" />
                    <span>AI Accuracy Auditor</span>
                  </div>
                </button>

                <button
                  onClick={() => {
                    setActiveTab('crash_logs');
                    setIsMobileSidebarOpen(false);
                  }}
                  className={`w-full flex items-center justify-between px-3 py-2 rounded-xl font-bold transition cursor-pointer ${
                    activeTab === 'crash_logs'
                      ? 'bg-emerald-600 text-white shadow-md'
                      : 'text-slate-400 hover:text-white hover:bg-slate-800/80'
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <AlertOctagon className="w-4 h-4 text-rose-400" />
                    <span>UI Crash Logs</span>
                  </div>
                  {crashLogsList.length > 0 && (
                    <span className="px-2 py-0.5 rounded-full bg-rose-500/20 text-[10px] font-mono font-bold text-rose-300 border border-rose-500/30">
                      {crashLogsList.length}
                    </span>
                  )}
                </button>
              </div>
            </div>


            {/* Group 2: User Governance */}
            <div>
              <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider px-2 block mb-1.5">
                User Governance
              </span>
              <div className="space-y-1">
                <button
                  onClick={() => {
                    setActiveTab('users');
                    setIsMobileSidebarOpen(false);
                  }}
                  className={`w-full flex items-center justify-between px-3 py-2 rounded-xl font-bold transition cursor-pointer ${
                    activeTab === 'users'
                      ? 'bg-emerald-600 text-white shadow-md'
                      : 'text-slate-400 hover:text-white hover:bg-slate-800/80'
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <Users className="w-4 h-4 text-amber-400" />
                    <span>User Directory</span>
                  </div>
                  <span className="px-2 py-0.5 rounded-full bg-slate-950 text-[10px] font-mono font-bold text-slate-300">
                    {usersDirectory.length}
                  </span>
                </button>

                <button
                  onClick={() => {
                    setActiveTab('user_feedback');
                    setIsMobileSidebarOpen(false);
                  }}
                  className={`w-full flex items-center justify-between px-3 py-2 rounded-xl font-bold transition cursor-pointer ${
                    activeTab === 'user_feedback'
                      ? 'bg-emerald-600 text-white shadow-md'
                      : 'text-slate-400 hover:text-white hover:bg-slate-800/80'
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <MessageSquarePlus className="w-4 h-4 text-emerald-400" />
                    <span>User Feedback</span>
                  </div>
                  {userFeedbackList.length > 0 && (
                    <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-[10px] font-mono font-bold text-emerald-300 border border-emerald-500/30">
                      {userFeedbackList.length}
                    </span>
                  )}
                </button>
              </div>
            </div>


            {/* Group 3: Tax Gazette & Rules */}
            <div>
              <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider px-2 block mb-1.5">
                Statutory Compliance
              </span>
              <div className="space-y-1">
                <button
                  onClick={() => {
                    setActiveTab('lhdn_regulations');
                    setIsMobileSidebarOpen(false);
                  }}
                  className={`w-full flex items-center justify-between px-3 py-2 rounded-xl font-bold transition cursor-pointer ${
                    activeTab === 'lhdn_regulations'
                      ? 'bg-emerald-600 text-white shadow-md'
                      : 'text-slate-400 hover:text-white hover:bg-slate-800/80'
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <FileSpreadsheet className="w-4 h-4 text-indigo-400" />
                    <span>LHDN Gazette Rules</span>
                  </div>
                  <span className="px-2 py-0.5 rounded-full bg-slate-950 text-[10px] font-mono font-bold text-slate-300">
                    {lhdnRegulations.length}
                  </span>
                </button>
              </div>
            </div>

            {/* Group 4: Storage & Maintenance */}
            <div>
              <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider px-2 block mb-1.5">
                Storage &amp; Operations
              </span>
              <div className="space-y-1">
                <button
                  onClick={() => {
                    setActiveTab('database');
                    setIsMobileSidebarOpen(false);
                  }}
                  className={`w-full flex items-center justify-between px-3 py-2 rounded-xl font-bold transition cursor-pointer ${
                    activeTab === 'database'
                      ? 'bg-emerald-600 text-white shadow-md'
                      : 'text-slate-400 hover:text-white hover:bg-slate-800/80'
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <Database className="w-4 h-4 text-rose-400" />
                    <span>Database Maintenance</span>
                  </div>
                </button>
              </div>
            </div>
          </nav>
        </div>

        {/* Sidebar Footer Account Card */}
        <div className="p-4 border-t border-slate-800 space-y-3 bg-slate-950/60">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 flex items-center justify-center font-bold text-xs shrink-0">
              {(currentUser?.email || 'A')[0].toUpperCase()}
            </div>
            <div className="min-w-0 flex-1">
              <span className="font-bold text-xs text-white block truncate">
                {currentUser?.email || 'Administrator'}
              </span>
              <span className="text-[10px] text-slate-400 block">Master Operational Role</span>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-1 pt-1">
            <button
              onClick={refreshAdminData}
              className="py-1.5 px-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white text-[10px] font-semibold transition flex items-center justify-center gap-1 cursor-pointer"
              title="Refresh All Operations Data"
            >
              <RefreshCw className="w-3 h-3" />
              <span>Refresh</span>
            </button>

            <button
              onClick={handleAdminLogout}
              className="py-1.5 px-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white text-[10px] font-semibold transition flex items-center justify-center gap-1 cursor-pointer"
              title="Lock Admin Console"
            >
              <LogOut className="w-3 h-3" />
              <span>Lock</span>
            </button>

            {onExit && (
              <button
                onClick={onExit}
                className="py-1.5 px-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white text-[10px] font-semibold transition flex items-center justify-center gap-1 cursor-pointer"
                title="Return to Main App"
              >
                <ArrowLeft className="w-3 h-3" />
                <span>Exit</span>
              </button>
            )}
          </div>
        </div>
      </aside>

      {/* ========================================================= */}
      {/* MAIN CONTENT CANVAS                                       */}
      {/* ========================================================= */}
      <div className="flex-1 min-w-0 flex flex-col min-h-screen bg-slate-950">
        {/* Sticky Header Bar */}
        <header className="sticky top-0 z-30 bg-slate-900/90 backdrop-blur-md border-b border-slate-800 px-4 sm:px-6 py-3.5 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setIsMobileSidebarOpen(true)}
              className="md:hidden text-slate-400 hover:text-white p-1 rounded-lg bg-slate-800 cursor-pointer"
            >
              <Menu className="w-5 h-5" />
            </button>

            <div>
              <div className="flex items-center gap-2 text-[11px] text-slate-400 font-mono">
                <span>Operations</span>
                <span>/</span>
                <span className="text-emerald-400 font-semibold">{navTabTitleMap[activeTab]}</span>
              </div>
              <h2 className="text-base sm:text-lg font-black text-white tracking-tight">
                {navTabTitleMap[activeTab]}
              </h2>
            </div>
          </div>

          {/* Action Header Bar */}
          <div className="flex items-center gap-2">
            {freeTierUsage.circuitBreakerActive && (
              <span className="hidden sm:inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-rose-500/20 border border-rose-500/40 text-rose-300 text-xs font-bold">
                <AlertOctagon className="w-3.5 h-3.5 text-rose-400" />
                <span>Circuit Breaker Active</span>
              </span>
            )}

            <button
              onClick={handleNuclearPurge}
              disabled={isPurging}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs shadow-md transition active:scale-95 disabled:opacity-50 cursor-pointer"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">{isPurging ? 'Purging...' : 'Nuclear Claim Purge'}</span>
            </button>
          </div>
        </header>

        {/* Content Body Canvas */}
        <main className="p-4 sm:p-6 space-y-6 flex-1 overflow-y-auto max-w-7xl">
          {purgeStatusMessage && (
            <div
              className={`p-4 rounded-xl text-xs font-semibold border flex items-center gap-2 ${
                purgeStatusMessage.includes('SUCCESS')
                  ? 'bg-emerald-950/60 border-emerald-500/40 text-emerald-300'
                  : purgeStatusMessage.includes('ERROR')
                  ? 'bg-rose-950/60 border-rose-500/40 text-rose-300'
                  : 'bg-cyan-950/60 border-cyan-500/40 text-cyan-300'
              }`}
            >
              <Activity className="w-4 h-4 shrink-0" />
              <span>{purgeStatusMessage}</span>
            </div>
          )}

          {/* Proactive Free Tier Alert Banner */}
          {freeTierUsage.alertLevel !== 'safe' && (
            <div
              className={`p-4 sm:p-5 rounded-2xl border shadow-lg flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 transition-all animate-fade-in ${
                freeTierUsage.alertLevel === 'critical_90' || freeTierUsage.alertLevel === 'exceeded_100'
                  ? 'bg-rose-950/80 border-rose-500/60 text-rose-200'
                  : freeTierUsage.alertLevel === 'warning_70'
                  ? 'bg-amber-950/80 border-amber-500/60 text-amber-200'
                  : 'bg-yellow-950/70 border-yellow-500/50 text-yellow-200'
              }`}
            >
              <div className="flex items-start gap-3">
                <div
                  className={`p-2 rounded-xl shrink-0 ${
                    freeTierUsage.alertLevel === 'critical_90' || freeTierUsage.alertLevel === 'exceeded_100'
                      ? 'bg-rose-500/20 text-rose-400'
                      : 'bg-amber-500/20 text-amber-400'
                  }`}
                >
                  <AlertTriangle className="w-6 h-6 animate-pulse" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-black text-sm uppercase tracking-wide">
                      {freeTierUsage.alertLevel === 'critical_90'
                        ? '🚨 90% Free Tier Threshold Alert - Emergency Circuit Breaker Armed'
                        : freeTierUsage.alertLevel === 'warning_70'
                        ? '⚠️ 70% Free Tier Usage Warning - Rate Optimization Active'
                        : 'ℹ️ 50% Free Tier Usage Notice - Operating Comfortably'}
                    </span>
                    <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-black/40">
                      {freeTierUsage.requestsToday} / {freeTierUsage.requestsDailyLimit} RPD ({freeTierUsage.dailyPercentage}%)
                    </span>
                  </div>
                  <p className="text-xs mt-1 text-slate-300 leading-relaxed">
                    {freeTierUsage.alertLevel === 'critical_90'
                      ? `Usage has reached ${freeTierUsage.dailyPercentage}% of Google's free daily allocation. The automatic Circuit Breaker will trip at ${freeTierUsage.circuitBreakerThresholdPercent}% to guarantee $0.00 cloud billing.`
                      : freeTierUsage.alertLevel === 'warning_70'
                      ? `Platform has consumed ${freeTierUsage.dailyPercentage}% of daily free tier calls. FinOps deduplication and cache policies are actively preserving remaining quota.`
                      : `Platform has processed ${freeTierUsage.dailyPercentage}% of today's free scans. System is completely healthy and cost-free.`}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2 self-stretch sm:self-auto shrink-0">
                <button
                  onClick={() => setActiveTab('ai_telemetry')}
                  className="px-3 py-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-xs font-bold text-white transition cursor-pointer"
                >
                  Inspect Sentinel
                </button>
                <button
                  onClick={handleResetFreeUsageCounter}
                  className="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-xs font-bold text-white transition cursor-pointer"
                >
                  Reset Counter
                </button>
              </div>
            </div>
          )}


      {/* ============================================================== */}
      {/* TAB 1: OVERVIEW & KEY PERFORMANCE INDICATORS */}
      {/* ============================================================== */}
      {activeTab === 'overview' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3.5">
            {/* 1. Total Active Users */}
            <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800">
              <div className="flex items-center justify-between text-slate-400 mb-1">
                <span className="text-xs font-medium">Total Active Users</span>
                <Users className="w-4 h-4 text-emerald-400" />
              </div>
              <p className="text-2xl font-black text-white font-mono">
                {totalActiveUsersCount} Users
              </p>
              <div className="flex items-center gap-1 mt-1 text-[11px] text-slate-400">
                <span className="text-emerald-400 font-semibold">{totalIndividualUsersCount} Indiv</span>
                <span>/</span>
                <span className="text-cyan-400 font-semibold">{totalBusinessUsersCount} Biz</span>
              </div>
            </div>

            {/* 2. Total Documents Scanned */}
            <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800">
              <div className="flex items-center justify-between text-slate-400 mb-1">
                <span className="text-xs font-medium">Total Documents Scanned</span>
                <Zap className="w-4 h-4 text-cyan-400" />
              </div>
              <p className="text-2xl font-black text-cyan-300 font-mono">
                {totalDocumentScansCount} Scans
              </p>
              <div className="flex items-center gap-1.5 mt-1 text-[11px] text-cyan-400">
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>Aggregated from Firestore</span>
              </div>
            </div>

            {/* 3. Total Copilot Inquiries */}
            <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800">
              <div className="flex items-center justify-between text-slate-400 mb-1">
                <span className="text-xs font-medium">Total Copilot Inquiries</span>
                <Sparkles className="w-4 h-4 text-indigo-400" />
              </div>
              <p className="text-2xl font-black text-indigo-300 font-mono">
                {totalCopilotInquiriesCount} Inquiries
              </p>
              <div className="flex items-center gap-1.5 mt-1 text-[11px] text-indigo-400">
                <span>LHDN Statutory Engine</span>
              </div>
            </div>

            {/* 4. Vault Storage Count */}
            <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800">
              <div className="flex items-center justify-between text-slate-400 mb-1">
                <span className="text-xs font-medium">Vault Storage Count</span>
                <Layers className="w-4 h-4 text-emerald-400" />
              </div>
              <p className="text-2xl font-black text-white font-mono">
                {totalVaultReceipts} Receipts
              </p>
              <div className="flex items-center gap-1.5 mt-1 text-[11px] text-slate-400">
                <span>Gross: {formatCurrency(totalGrossValue)}</span>
              </div>
            </div>

            {/* 5. Google Free Tier Health */}
            <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800">
              <div className="flex items-center justify-between text-slate-400 mb-1">
                <span className="text-xs font-medium">Google Free Tier Health</span>
                <Gauge className="w-4 h-4 text-emerald-400" />
              </div>
              <p className="text-2xl font-black text-emerald-400 font-mono">
                {freeTierUsage.dailyPercentage}% Used
              </p>
              <div className="flex items-center gap-1.5 mt-1 text-[11px] text-emerald-400">
                <span>{freeTierUsage.requestsToday} / {freeTierUsage.requestsDailyLimit} RPD</span>
                <span className="text-slate-500">•</span>
                <span className="text-emerald-300 font-bold">$0.00</span>
              </div>
            </div>
          </div>



          {/* Quick Free Tier Usage Sentinel Widget */}
          <div className="p-5 sm:p-6 rounded-2xl bg-slate-900 border border-slate-800 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h3 className="text-base font-bold text-white flex items-center gap-2">
                  <Gauge className="w-5 h-5 text-emerald-400" />
                  <span>Google Gemini Free Usage Sentinel &amp; FinOps Guardrail</span>
                </h3>
                <p className="text-xs text-slate-400">
                  Guarantees the application operates strictly within Google's free usage tier (1,500 RPD, 15 RPM). Automatic circuit breaker trips at 95% to ensure $0.00 cloud expenses.
                </p>
              </div>

              <div className="flex items-center gap-2">
                <span
                  className={`px-3 py-1 rounded-full text-xs font-bold border ${
                    freeTierUsage.alertLevel === 'critical_90'
                      ? 'bg-rose-500/10 border-rose-500/30 text-rose-400'
                      : freeTierUsage.alertLevel === 'warning_70'
                      ? 'bg-amber-500/10 border-amber-500/30 text-amber-400'
                      : freeTierUsage.alertLevel === 'caution_50'
                      ? 'bg-yellow-500/10 border-yellow-500/30 text-yellow-400'
                      : 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400'
                  }`}
                >
                  Status: {freeTierUsage.alertLevel.toUpperCase()}
                </span>
              </div>
            </div>

            {/* Daily Usage Progress Bar */}
            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs font-semibold">
                <span className="text-slate-300">Daily Free Quota Consumption</span>
                <span className="font-mono text-emerald-400">
                  {freeTierUsage.requestsToday} of {freeTierUsage.requestsDailyLimit} Requests ({freeTierUsage.dailyPercentage}%)
                </span>
              </div>
              <div className="h-3 w-full bg-slate-950 rounded-full overflow-hidden p-0.5 border border-slate-800">
                <div
                  className={`h-full rounded-full transition-all duration-500 ${
                    freeTierUsage.dailyPercentage >= 90
                      ? 'bg-rose-500'
                      : freeTierUsage.dailyPercentage >= 70
                      ? 'bg-amber-500'
                      : freeTierUsage.dailyPercentage >= 50
                      ? 'bg-yellow-500'
                      : 'bg-emerald-500'
                  }`}
                  style={{ width: `${Math.min(100, Math.max(3, freeTierUsage.dailyPercentage))}%` }}
                />
              </div>

              {/* Threshold Marker Labels */}
              <div className="flex items-center justify-between text-[10px] text-slate-500 pt-1 font-mono">
                <span>0 calls (0%)</span>
                <span className="text-yellow-400/80">50% Notice (750 calls)</span>
                <span className="text-amber-400/80">70% Warning (1,050 calls)</span>
                <span className="text-rose-400 font-bold">90% Critical Alert (1,350 calls)</span>
                <span>1,500 RPD (100%)</span>
              </div>
            </div>

            {/* Circuit Breaker & Simulation Controls */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 pt-2">
              <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-between">
                <div>
                  <span className="text-xs font-bold text-white block">Zero-Bill Hard Circuit Breaker</span>
                  <span className="text-[11px] text-slate-400">Halts API calls if quota reaches {freeTierUsage.circuitBreakerThresholdPercent}%</span>
                </div>
                <button
                  onClick={handleToggleAutoThrottle}
                  disabled={isUpdatingCircuitBreaker}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer ${
                    freeTierUsage.autoThrottleEnabled
                      ? 'bg-emerald-600 text-white'
                      : 'bg-slate-800 text-slate-400 hover:text-white'
                  }`}
                >
                  {freeTierUsage.autoThrottleEnabled ? 'Enabled' : 'Disabled'}
                </button>
              </div>

              <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 flex flex-col justify-between">
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-xs font-bold text-white">Rate Per Minute (RPM)</span>
                  <span className="text-xs font-mono text-cyan-400">{freeTierUsage.requestsMinute} / {freeTierUsage.requestsMinuteLimit} RPM</span>
                </div>
                <div className="h-1.5 w-full bg-slate-800 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-cyan-400 rounded-full"
                    style={{ width: `${Math.min(100, (freeTierUsage.requestsMinute / freeTierUsage.requestsMinuteLimit) * 100)}%` }}
                  />
                </div>
              </div>

              <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-between">
                <div>
                  <span className="text-xs font-bold text-white block">Threshold Alert Diagnostics</span>
                  <span className="text-[11px] text-slate-400">Validate 50%, 70%, 90% alerts</span>
                </div>
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => handleSimulateThreshold(50)}
                    className="px-2 py-1 rounded bg-yellow-950 border border-yellow-500/40 text-yellow-300 text-[10px] font-bold hover:bg-yellow-900 cursor-pointer"
                    title="Simulate 50% usage"
                  >
                    50%
                  </button>
                  <button
                    onClick={() => handleSimulateThreshold(70)}
                    className="px-2 py-1 rounded bg-amber-950 border border-amber-500/40 text-amber-300 text-[10px] font-bold hover:bg-amber-900 cursor-pointer"
                    title="Simulate 70% usage"
                  >
                    70%
                  </button>
                  <button
                    onClick={() => handleSimulateThreshold(90)}
                    className="px-2 py-1 rounded bg-rose-950 border border-rose-500/40 text-rose-300 text-[10px] font-bold hover:bg-rose-900 cursor-pointer"
                    title="Simulate 90% usage"
                  >
                    90%
                  </button>
                  <button
                    onClick={handleResetFreeUsageCounter}
                    className="px-2 py-1 rounded bg-slate-800 text-slate-300 text-[10px] font-bold hover:bg-slate-700 cursor-pointer"
                    title="Reset to 0"
                  >
                    0%
                  </button>
                </div>
              </div>
            </div>

            {circuitBreakerFeedback && (
              <div className="p-3 rounded-xl bg-cyan-950/70 border border-cyan-500/40 text-cyan-300 text-xs font-medium">
                {circuitBreakerFeedback}
              </div>
            )}
          </div>

          {/* Industry Standard Architecture Briefing */}
          <div className="p-5 sm:p-6 rounded-2xl bg-gradient-to-r from-slate-900 via-indigo-950/20 to-slate-900 border border-indigo-500/30 space-y-4">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-indigo-500/20 text-indigo-400 border border-indigo-500/30 flex items-center justify-center shrink-0">
                <Info className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-white">
                  Industry Standard Architecture: Tax &amp; Document AI Platforms
                </h3>
                <p className="text-xs text-slate-400">
                  Benchmarked against Intuit TurboTax, Expensify, Taxfix, and LHDN MyInvois standards
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-3 text-xs">
              <div className="p-3.5 rounded-xl bg-slate-950/80 border border-slate-800 space-y-1">
                <span className="font-bold text-emerald-400">1. Frictionless Guest Preview</span>
                <p className="text-slate-300 text-[11px] leading-relaxed">
                  Guests scan receipts freely to calculate tax savings immediately. Account creation is required only when saving to the 7-year cloud vault.
                </p>
              </div>

              <div className="p-3.5 rounded-xl bg-slate-950/80 border border-slate-800 space-y-1">
                <span className="font-bold text-cyan-400">2. Deterministic Rule Engine</span>
                <p className="text-slate-300 text-[11px] leading-relaxed">
                  AI extracts structured fields (SSM, date, items); a deterministic engine validates against the official LHDN Gazette to prevent hallucinations.
                </p>
              </div>

              <div className="p-3.5 rounded-xl bg-slate-950/80 border border-slate-800 space-y-1">
                <span className="font-bold text-amber-400">3. Section 82A 7-Year Vault</span>
                <p className="text-slate-300 text-[11px] leading-relaxed">
                  Under Section 82A ITA 1967, YA {activeTaxYear} documents are cryptographically sealed with SHA-256 hashes and retained until 31 Dec {activeTaxYear + 7}.
                </p>
              </div>

              <div className="p-3.5 rounded-xl bg-slate-950/80 border border-slate-800 space-y-1">
                <span className="font-bold text-rose-400">4. Admin Governance &amp; FinOps</span>
                <p className="text-slate-300 text-[11px] leading-relaxed">
                  Admins monitor user quotas, token costs, AI accuracy, and maintain a human-in-the-loop review queue for flagged claims.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* TAB 2: AI AUDIT TRAIL, TELEMETRY & FREE TIER SENTINEL */}
      {/* ============================================================== */}
      {activeTab === 'ai_telemetry' && (
        <div className="space-y-6">
          {/* Top FinOps Overview Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
            <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800">
              <span className="text-xs text-slate-400 font-medium">Model Deployment</span>
              <p className="text-xl font-black text-indigo-300 font-mono mt-1">gemini-3.8-flash</p>
              <p className="text-[11px] text-slate-500 mt-1">Multimodal Vision &amp; PDF OCR</p>
            </div>

            <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800">
              <span className="text-xs text-slate-400 font-medium">Estimated Token Traffic</span>
              <p className="text-xl font-black text-white font-mono mt-1">
                {(estimatedInputTokens + estimatedOutputTokens).toLocaleString()} Tokens
              </p>
              <p className="text-[11px] text-slate-400 mt-1">
                In: {estimatedInputTokens.toLocaleString()} | Out: {estimatedOutputTokens.toLocaleString()}
              </p>
            </div>

            <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800">
              <span className="text-xs text-slate-400 font-medium">Google Free Tier Savings</span>
              <p className="text-xl font-black text-emerald-400 font-mono mt-1">$0.00 Billed</p>
              <p className="text-[11px] text-emerald-400/90 mt-1">
                Saved ~${freeTierUsage.estimatedCostSavedUsd} USD via Free Tier
              </p>
            </div>

            <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800">
              <span className="text-xs text-slate-400 font-medium">Average Latency</span>
              <p className="text-xl font-black text-cyan-400 font-mono mt-1">{avgLatencyMs} ms</p>
              <p className="text-[11px] text-slate-400 mt-1">Sub-1.5s real-time extraction</p>
            </div>
          </div>

          {/* Solution Cost vs Human Cost Enterprise ROI Card */}
          <div className="p-5 sm:p-6 rounded-2xl bg-gradient-to-r from-teal-950/40 via-slate-900 to-emerald-950/40 border border-teal-500/30 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex items-start gap-3">
              <div className="p-2.5 rounded-xl bg-teal-500/20 text-teal-400 border border-teal-500/30 shrink-0">
                <TrendingDown className="w-5 h-5" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold uppercase tracking-wider text-teal-400">
                    FinOps Economic Intelligence
                  </span>
                  <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                    99.98% Cheaper Than Manual
                  </span>
                </div>
                <h4 className="text-base font-bold text-white mt-0.5">
                  Solution Cost vs. Human Bookkeeping Cost Comparison
                </h4>
                <p className="text-xs text-slate-300 mt-1 max-w-2xl leading-relaxed">
                  Every document processed by CukaiSmart costs $0.00 under Google Free Tier vs. ~RM 9.00 (12 mins) of manual human bookkeeping labor at RM 45/hr. Compare throughput, error rates, and ROI across organization volumes.
                </p>
              </div>
            </div>

            <button
              onClick={() => setIsCostRoiOpen(true)}
              className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-teal-600 to-emerald-600 hover:from-teal-500 hover:to-emerald-500 text-white font-bold text-xs shadow-md transition flex items-center gap-1.5 shrink-0 self-stretch sm:self-auto justify-center cursor-pointer"
            >
              <TrendingDown className="w-3.5 h-3.5" />
              <span>Launch FinOps ROI Engine</span>
            </button>
          </div>

          {/* AI API CALLS AUDIT TRAIL TABLE */}
          <div className="p-5 sm:p-6 rounded-2xl bg-slate-900 border border-slate-800 space-y-4">
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-slate-800 pb-4">
              <div>
                <h3 className="text-base font-bold text-white flex items-center gap-2">
                  <Activity className="w-5 h-5 text-emerald-400" />
                  <span>AI API Calls Audit Trail &amp; System Abuse Monitor</span>
                </h3>
                <p className="text-xs text-slate-400">
                  Logs every individual AI scan invocation, capturing document type, timestamp, user ID, tokens, latency, and automated abuse detection signals.
                </p>
              </div>

              {/* Filters */}
              <div className="flex flex-wrap items-center gap-2 text-xs">
                {/* Document Type Filter */}
                <select
                  value={docTypeFilter}
                  onChange={(e) => setDocTypeFilter(e.target.value)}
                  className="px-2.5 py-1.5 rounded-lg bg-slate-950 border border-slate-800 text-slate-200 focus:outline-none cursor-pointer"
                >
                  <option value="all">All Document Types</option>
                  {uniqueDocTypes.map((dt) => (
                    <option key={dt} value={dt}>
                      {dt}
                    </option>
                  ))}
                </select>

                {/* User ID search */}
                <div className="relative">
                  <Search className="w-3.5 h-3.5 text-slate-500 absolute left-2.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    placeholder="Filter user ID / email..."
                    value={userIdAuditFilter}
                    onChange={(e) => setUserIdAuditFilter(e.target.value)}
                    className="pl-8 pr-2.5 py-1.5 rounded-lg bg-slate-950 border border-slate-800 text-white placeholder-slate-500 focus:outline-none w-44"
                  />
                </div>

                {/* Abuse only toggle */}
                <button
                  onClick={() => setAbuseFilterOnly(!abuseFilterOnly)}
                  className={`px-3 py-1.5 rounded-lg font-bold border transition cursor-pointer ${
                    abuseFilterOnly
                      ? 'bg-rose-950 border-rose-500/50 text-rose-300'
                      : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-white'
                  }`}
                >
                  {abuseFilterOnly ? 'Abuse Flags Only' : 'Show All'}
                </button>
              </div>
            </div>

            {filteredAILogs.length === 0 ? (
              <div className="p-8 text-center rounded-xl bg-slate-950 border border-slate-800 text-slate-400 space-y-2">
                <CheckCircle2 className="w-8 h-8 text-emerald-400 mx-auto" />
                <p className="text-sm font-bold text-white">No AI API Calls Match the Filters</p>
                <p className="text-xs text-slate-500">
                  As taxpayers and guests scan receipts, every call with document type, user ID, and timestamp is tracked here.
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="border-b border-slate-800 text-slate-400">
                      <th className="py-2.5 px-3">Timestamp</th>
                      <th className="py-2.5 px-3">Document Type</th>
                      <th className="py-2.5 px-3">User ID &amp; Email</th>
                      <th className="py-2.5 px-3">Merchant / Claim</th>
                      <th className="py-2.5 px-3 text-right">Claimable (RM)</th>
                      <th className="py-2.5 px-3 text-center">Tokens / Latency</th>
                      <th className="py-2.5 px-3 text-center">Abuse Monitor</th>
                      <th className="py-2.5 px-3 text-center">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/80">
                    {filteredAILogs.map((log) => (
                      <tr key={log.id} className="hover:bg-slate-950/60 transition">
                        {/* Timestamp */}
                        <td className="py-3 px-3 font-mono text-[11px] text-slate-400">
                          <div>
                            <span className="text-white">
                              {new Date(log.timestamp).toLocaleTimeString([], {
                                hour: '2-digit',
                                minute: '2-digit',
                                second: '2-digit',
                              })}
                            </span>
                            <p className="text-[10px] text-slate-500">
                              {new Date(log.timestamp).toISOString().split('T')[0]}
                            </p>
                          </div>
                        </td>

                        {/* Document Type */}
                        <td className="py-3 px-3">
                          <span
                            className={`px-2 py-0.5 rounded text-[10px] font-bold inline-block ${
                              log.documentType.includes('Invoice')
                                ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/30'
                                : log.documentType.includes('Medical')
                                ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                                : log.documentType.includes('Non-Tax') || log.documentType.includes('Disallowed')
                                ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                                : 'bg-indigo-500/20 text-indigo-300 border border-indigo-500/30'
                            }`}
                          >
                            {log.documentType}
                          </span>
                        </td>

                        {/* User ID & Email */}
                        <td className="py-3 px-3">
                          <span className="font-bold text-white block truncate max-w-[150px]">
                            {log.userEmail || 'guest@taxpayer.local'}
                          </span>
                          <span className="font-mono text-[10px] text-slate-500 truncate max-w-[150px] block">
                            UID: {log.userId}
                          </span>
                        </td>

                        {/* Merchant / Category */}
                        <td className="py-3 px-3">
                          <span className="font-semibold text-white block">{log.merchantName}</span>
                          <span className="text-[10px] text-slate-400 block truncate max-w-[160px]">
                            {log.category} ({log.statutorySection})
                          </span>
                        </td>

                        {/* Amount */}
                        <td className="py-3 px-3 text-right font-mono">
                          <span className="font-bold text-emerald-400 block">
                            {formatCurrency(log.claimableAmount)}
                          </span>
                          <span className="text-[10px] text-slate-500 block">
                            Gross: {formatCurrency(log.totalAmount)}
                          </span>
                        </td>

                        {/* Tokens & Latency */}
                        <td className="py-3 px-3 text-center font-mono text-[11px]">
                          <span className="text-cyan-300">{log.latencyMs}ms</span>
                          <p className="text-[10px] text-slate-500">
                            ~{(log.inputTokens || 1200) + (log.outputTokens || 350)} tok
                          </p>
                        </td>

                        {/* Abuse Status */}
                        <td className="py-3 px-3 text-center">
                          {log.abuseFlag || log.riskScore === 'HIGH' ? (
                            <span
                              className="px-2 py-0.5 rounded text-[10px] font-bold bg-rose-500/20 border border-rose-500/40 text-rose-300 cursor-help"
                              title={log.abuseReason || 'High frequency or suspicious activity'}
                            >
                              Flagged Abuse
                            </span>
                          ) : log.auditStatus === 'warning' ? (
                            <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-500/20 border border-amber-500/40 text-amber-300">
                              Warning
                            </span>
                          ) : (
                            <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-500/10 text-emerald-400">
                              Clean
                            </span>
                          )}
                        </td>

                        {/* Actions */}
                        <td className="py-3 px-3 text-center">
                          <div className="flex items-center justify-center gap-1.5">
                            <button
                              onClick={() => setSelectedRecordJson(log)}
                              className="px-2 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 text-[10px] font-semibold transition cursor-pointer"
                            >
                              Inspect
                            </button>
                            <button
                              onClick={() => handleVerifyScanLog(log.id, log.adminVerifiedStatus === 'flagged' ? 'verified' : 'flagged')}
                              className={`p-1 rounded text-[10px] transition cursor-pointer ${
                                log.adminVerifiedStatus === 'flagged'
                                  ? 'bg-rose-900 text-rose-200'
                                  : 'bg-slate-800 text-slate-400 hover:text-white'
                              }`}
                              title="Toggle admin flag"
                            >
                              <ShieldAlert className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* TAB 3: LHDN REGULATIONS & LIVE GAZETTE SYNCHRONIZER (NEW TAB)   */}
      {/* ============================================================== */}
      {activeTab === 'lhdn_regulations' && (
        <div className="space-y-6">
          <div className="p-5 sm:p-6 rounded-2xl bg-slate-900 border border-slate-800 space-y-4">
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-slate-800 pb-4">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-[11px] font-bold">
                    Official Gazette Engine
                  </span>
                  <span className="text-xs text-slate-400">
                    Last Live Sync: {lastLHDNSyncTime ? new Date(lastLHDNSyncTime).toLocaleTimeString() : 'Current'}
                  </span>
                </div>
                <h3 className="text-base font-bold text-white flex items-center gap-2">
                  <FileSpreadsheet className="w-5 h-5 text-emerald-400" />
                  <span>LHDN Statutory Regulations &amp; Live AI Scanner Synchronizer</span>
                </h3>
                <p className="text-xs text-slate-400">
                  Allows administrators to manually adjust statutory relief limits, add new categories, and sync with remote Ministry of Finance / LHDN gazettes. All changes are immediately broadcast to the Google Gemini AI scanner prompt.
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <button
                  onClick={handleSyncWithRemoteGazette}
                  disabled={isSyncingGazette}
                  className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white font-bold text-xs shadow-md transition active:scale-95 disabled:opacity-50 cursor-pointer"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${isSyncingGazette ? 'animate-spin' : ''}`} />
                  <span>{isSyncingGazette ? 'Syncing Gazette...' : 'Sync Remote Gazette'}</span>
                </button>
                <button
                  onClick={() => setIsAddingReliefModal(true)}
                  className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-md transition active:scale-95 cursor-pointer"
                >
                  <PlusCircle className="w-3.5 h-3.5" />
                  <span>Add New Relief Category</span>
                </button>
              </div>
            </div>

            {regulationsStatusMsg && (
              <div className="p-3.5 rounded-xl bg-emerald-950/80 border border-emerald-500/40 text-emerald-300 text-xs font-semibold flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 shrink-0" />
                <span>{regulationsStatusMsg}</span>
              </div>
            )}

            {/* Active AI Scanner Prompt Broadcast Summary */}
            <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0">
                  <Sparkles className="w-4 h-4" />
                </div>
                <div>
                  <span className="font-bold text-white block">
                    AI Scanner Active Rules Engine: {lhdnRegulations.filter((r) => r.isActive).length} Statutory Categories
                  </span>
                  <span className="text-slate-400 text-[11px]">
                    Total Maximum Statutory Shield: RM{' '}
                    {lhdnRegulations
                      .filter((r) => r.isActive)
                      .reduce((sum, r) => sum + r.maxLimit, 0)
                      .toLocaleString()}{' '}
                    • Synchronized with Gemini 3.8 Flash
                  </span>
                </div>
              </div>
              <span className="px-2.5 py-1 rounded bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 font-mono text-[11px] font-bold">
                100% In-Sync With Scanner
              </span>
            </div>

            {/* Regulations Grid Table */}
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-slate-800 text-slate-400">
                    <th className="py-2.5 px-3">Category ID</th>
                    <th className="py-2.5 px-3">Relief Title</th>
                    <th className="py-2.5 px-3">Statutory Section</th>
                    <th className="py-2.5 px-3 text-right">Max Statutory Limit (RM)</th>
                    <th className="py-2.5 px-3 text-center">Status</th>
                    <th className="py-2.5 px-3 text-center">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/80">
                  {lhdnRegulations.map((reg) => (
                    <tr key={reg.id} className="hover:bg-slate-950/60 transition">
                      <td className="py-3 px-3 font-mono text-[11px] text-slate-400">{reg.id}</td>
                      <td className="py-3 px-3">
                        <span className="font-bold text-white block">{reg.title}</span>
                        <p className="text-[11px] text-slate-400 line-clamp-1">{reg.description}</p>
                      </td>
                      <td className="py-3 px-3 font-mono text-cyan-300">{reg.statutorySection}</td>
                      <td className="py-3 px-3 text-right font-mono font-bold text-emerald-400 text-sm">
                        RM {reg.maxLimit.toLocaleString()}
                      </td>
                      <td className="py-3 px-3 text-center">
                        <button
                          onClick={() => handleToggleReliefActive(reg.id)}
                          className={`px-2 py-0.5 rounded text-[10px] font-bold transition cursor-pointer ${
                            reg.isActive
                              ? 'bg-emerald-500/20 text-emerald-300'
                              : 'bg-slate-800 text-slate-500'
                          }`}
                        >
                          {reg.isActive ? 'Active' : 'Disabled'}
                        </button>
                      </td>
                      <td className="py-3 px-3 text-center">
                        <button
                          onClick={() => handleStartEditRelief(reg)}
                          className="flex items-center gap-1 mx-auto px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold transition cursor-pointer"
                        >
                          <Edit3 className="w-3.5 h-3.5 text-amber-400" />
                          <span>Edit Limit</span>
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* TAB 4: USER ACCOUNTS & ACTIVITY DIRECTORY (WITH PAGINATION)    */}
      {/* ============================================================== */}
      {activeTab === 'users' && (() => {
        const totalUserPages = Math.ceil(filteredUsers.length / usersPerPage) || 1;
        const safeUserPage = Math.min(usersCurrentPage, totalUserPages);
        const paginatedUsers = filteredUsers.slice((safeUserPage - 1) * usersPerPage, safeUserPage * usersPerPage);

        return (
          <div className="p-5 sm:p-6 rounded-2xl bg-slate-900 border border-slate-800 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-4">
              <div>
                <h3 className="text-base font-bold text-white flex items-center gap-2">
                  <Users className="w-4 h-4 text-emerald-400" />
                  <span>User Accounts &amp; Activity Directory</span>
                </h3>
                <p className="text-xs text-slate-400">
                  Manage registered taxpayer accounts, inspect activity, adjust AI scan quotas, and toggle access status.
                </p>
              </div>

              <div className="flex items-center gap-2">
                <div className="relative">
                  <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    placeholder="Search user email, name, UID..."
                    value={userSearch}
                    onChange={(e) => {
                      setUserSearch(e.target.value);
                      setUsersCurrentPage(1);
                    }}
                    className="pl-8 pr-3 py-1.5 rounded-lg bg-slate-950 border border-slate-800 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500 w-full sm:w-64"
                  />
                </div>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-slate-800 text-slate-400">
                    <th className="py-2.5 px-3">User ID &amp; Email</th>
                    <th className="py-2.5 px-3">Account Type</th>
                    <th className="py-2.5 px-3">Sign-Up Date</th>
                    <th className="py-2.5 px-3">Role</th>
                    <th className="py-2.5 px-3 text-right">Documents</th>
                    <th className="py-2.5 px-3 text-right">Deductions Claimed</th>
                    <th className="py-2.5 px-3 text-center">AI Scan Quota</th>
                    <th className="py-2.5 px-3 text-center">Status</th>
                    <th className="py-2.5 px-3 text-center">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/80">
                  {paginatedUsers.length === 0 ? (
                    <tr>
                      <td colSpan={9} className="py-8 text-center text-slate-400">
                        No registered users found matching search criteria.
                      </td>
                    </tr>
                  ) : (
                    paginatedUsers.map((u) => (
                      <tr key={u.uid} className="hover:bg-slate-950/60 transition">
                        <td className="py-3 px-3">
                          <div>
                            <span className="font-bold text-white block">{u.email}</span>
                            <span className="text-[10px] text-slate-500 font-mono truncate max-w-[160px] block">
                              ID: {u.uid}
                            </span>
                          </div>
                        </td>
                        <td className="py-3 px-3">
                          <span
                            className={`px-2 py-0.5 rounded text-[10px] font-bold capitalize ${
                              u.persona === 'business'
                                ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/30'
                                : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                            }`}
                          >
                            {u.persona === 'business' ? 'Business (Form B)' : 'Individual (Form BE)'}
                          </span>
                        </td>
                        <td className="py-3 px-3 text-slate-400 font-mono text-[11px]">
                          {u.createdAt ? new Date(u.createdAt).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) : '01 Jan 2026'}
                        </td>
                        <td className="py-3 px-3">
                          <span
                            className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                              u.role === 'admin'
                                ? 'bg-amber-500/20 text-amber-300'
                                : 'bg-slate-800 text-slate-300'
                            }`}
                          >
                            {u.role}
                          </span>
                        </td>
                        <td className="py-3 px-3 text-right font-mono font-bold text-white">
                          {u.documentsCount}
                        </td>
                        <td className="py-3 px-3 text-right font-mono font-bold text-emerald-400">
                          {formatCurrency(u.totalClaimedAmount)}
                        </td>
                        <td className="py-3 px-3 text-center font-mono">
                          <div className="flex items-center justify-center gap-1">
                            <button
                              onClick={() => handleAdjustUserQuota(u, -5)}
                              className="px-1.5 py-0.5 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 cursor-pointer"
                              title="Decrease quota"
                            >
                              -
                            </button>
                            <span>{u.aiScansLimit}</span>
                            <button
                              onClick={() => handleAdjustUserQuota(u, 10)}
                              className="px-1.5 py-0.5 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 cursor-pointer"
                              title="Increase quota"
                            >
                              +
                            </button>
                          </div>
                        </td>
                        <td className="py-3 px-3 text-center">
                          <span
                            className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                              u.status === 'active'
                                ? 'bg-emerald-500/20 text-emerald-300'
                                : 'bg-rose-500/20 text-rose-300'
                            }`}
                          >
                            {u.status}
                          </span>
                        </td>
                        <td className="py-3 px-3 text-center">
                          <button
                            onClick={() => handleToggleUserStatus(u)}
                            className="px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 text-[11px] font-semibold transition cursor-pointer"
                          >
                            {u.status === 'active' ? 'Suspend' : 'Activate'}
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            {/* Pagination Control Bar */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-3 border-t border-slate-800/80 text-xs text-slate-400">
              <div className="flex items-center gap-2">
                <span>Per page:</span>
                <select
                  value={usersPerPage}
                  onChange={(e) => {
                    setUsersPerPage(Number(e.target.value));
                    setUsersCurrentPage(1);
                  }}
                  className="px-2 py-1 rounded-lg bg-slate-950 border border-slate-800 text-white focus:outline-none cursor-pointer"
                >
                  <option value={5}>5</option>
                  <option value={10}>10</option>
                  <option value={20}>20</option>
                  <option value={50}>50</option>
                </select>
                <span className="text-slate-500">
                  Showing {filteredUsers.length === 0 ? 0 : (safeUserPage - 1) * usersPerPage + 1} to{' '}
                  {Math.min(safeUserPage * usersPerPage, filteredUsers.length)} of {filteredUsers.length} users
                </span>
              </div>

              <div className="flex items-center gap-1.5">
                <button
                  onClick={() => setUsersCurrentPage((p) => Math.max(1, p - 1))}
                  disabled={safeUserPage <= 1}
                  className="px-3 py-1.5 rounded-lg bg-slate-950 border border-slate-800 font-medium hover:bg-slate-800 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer transition"
                >
                  Previous
                </button>

                {Array.from({ length: totalUserPages }, (_, i) => i + 1).map((pg) => (
                  <button
                    key={pg}
                    onClick={() => setUsersCurrentPage(pg)}
                    className={`px-3 py-1.5 rounded-lg font-mono font-bold transition cursor-pointer ${
                      pg === safeUserPage
                        ? 'bg-emerald-600 text-white shadow-sm'
                        : 'bg-slate-950 border border-slate-800 text-slate-400 hover:bg-slate-800 hover:text-white'
                    }`}
                  >
                    {pg}
                  </button>
                ))}

                <button
                  onClick={() => setUsersCurrentPage((p) => Math.min(totalUserPages, p + 1))}
                  disabled={safeUserPage >= totalUserPages}
                  className="px-3 py-1.5 rounded-lg bg-slate-950 border border-slate-800 font-medium hover:bg-slate-800 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer transition"
                >
                  Next
                </button>
              </div>
            </div>
          </div>
        );
      })()}

      {/* ============================================================== */}
      {/* TAB: USER FEEDBACK DIRECTORY & IDEAS */}
      {/* ============================================================== */}
      {activeTab === 'user_feedback' && (
        <div className="p-5 sm:p-6 rounded-2xl bg-slate-900 border border-slate-800 space-y-4 animate-fade-in">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-4">
            <div>
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <MessageSquarePlus className="w-5 h-5 text-emerald-400" />
                <span>User Feedback, Feature Ideas &amp; Bug Reports</span>
              </h3>
              <p className="text-xs text-slate-400">
                Real-time feedback submitted by taxpayers (Individual &amp; Business) directly from the application.
              </p>
            </div>

            <button
              onClick={refreshAdminData}
              className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 font-bold text-xs flex items-center gap-1.5 transition cursor-pointer"
            >
              <RefreshCw className="w-3.5 h-3.5 text-emerald-400" />
              <span>Refresh Feedbacks</span>
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-slate-800 text-slate-400">
                  <th className="py-2.5 px-3">Date</th>
                  <th className="py-2.5 px-3">Taxpayer Email</th>
                  <th className="py-2.5 px-3">Type</th>
                  <th className="py-2.5 px-3">Category</th>
                  <th className="py-2.5 px-3 text-center">Rating</th>
                  <th className="py-2.5 px-3">Feedback Message</th>
                  <th className="py-2.5 px-3 text-center">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/80">
                {userFeedbackList.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-8 text-center text-slate-400">
                      No user feedback submitted yet. Taxpayers can click "Feedback" in the top navigation bar to submit ideas!
                    </td>
                  </tr>
                ) : (
                  userFeedbackList.map((fb) => (
                    <tr key={fb.id} className="hover:bg-slate-950/60 transition">
                      <td className="py-3 px-3 font-mono text-slate-400 text-[11px] whitespace-nowrap">
                        {new Date(fb.createdAt).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}
                      </td>
                      <td className="py-3 px-3 font-bold text-white">
                        {fb.userEmail || 'anonymous@cukaismart.local'}
                      </td>
                      <td className="py-3 px-3">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                          fb.type === 'bug_report'
                            ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                            : fb.type === 'feature_request'
                            ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                            : 'bg-indigo-500/20 text-indigo-300 border border-indigo-500/30'
                        }`}>
                          {fb.type.replace('_', ' ')}
                        </span>
                      </td>
                      <td className="py-3 px-3 capitalize text-slate-300 font-medium">
                        {fb.category}
                      </td>
                      <td className="py-3 px-3 text-center font-mono font-bold text-amber-400">
                        {fb.rating} ★
                      </td>
                      <td className="py-3 px-3 text-slate-200 max-w-xs leading-relaxed">
                        {fb.message}
                      </td>
                      <td className="py-3 px-3 text-center">
                        <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 text-[10px] font-bold border border-emerald-500/30">
                          {fb.status}
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* TAB: COMPONENT CRASH LOGS & UI REMOTE DEBUGGER */}
      {/* ============================================================== */}
      {activeTab === 'crash_logs' && (
        <div className="p-5 sm:p-6 rounded-2xl bg-slate-900 border border-slate-800 space-y-4 animate-fade-in">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-4">
            <div>
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <AlertOctagon className="w-5 h-5 text-rose-400" />
                <span>Component Crash Logs &amp; Remote Error Debugger</span>
              </h3>
              <p className="text-xs text-slate-400">
                Captured in real-time by ErrorBoundary from client browsers to allow remote debugging of UI anomalies.
              </p>
            </div>

            <button
              onClick={refreshAdminData}
              className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 font-bold text-xs flex items-center gap-1.5 transition cursor-pointer"
            >
              <RefreshCw className="w-3.5 h-3.5 text-rose-400" />
              <span>Refresh Crash Logs</span>
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-slate-800 text-slate-400">
                  <th className="py-2.5 px-3">Date / Time</th>
                  <th className="py-2.5 px-3">Error Name</th>
                  <th className="py-2.5 px-3">Error Message</th>
                  <th className="py-2.5 px-3">User &amp; Route</th>
                  <th className="py-2.5 px-3 font-mono">Component Stack</th>
                  <th className="py-2.5 px-3 text-center">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/80">
                {crashLogsList.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-8 text-center text-slate-400">
                      Zero UI crashes logged! The application frontend is operating with 100% stability.
                    </td>
                  </tr>
                ) : (
                  crashLogsList.map((log) => (
                    <tr key={log.id} className="hover:bg-slate-950/60 transition">
                      <td className="py-3 px-3 font-mono text-slate-400 text-[11px] whitespace-nowrap">
                        {new Date(log.createdAt).toLocaleString('en-GB', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })}
                      </td>
                      <td className="py-3 px-3 font-bold text-rose-400 font-mono">
                        {log.errorName || 'Error'}
                      </td>
                      <td className="py-3 px-3 text-white max-w-xs font-mono text-[11px]">
                        {log.errorMessage}
                      </td>
                      <td className="py-3 px-3">
                        <span className="font-bold text-slate-200 block">{log.userEmail || 'anonymous'}</span>
                        <span className="text-[10px] text-slate-500 font-mono block truncate max-w-[140px]">{log.url}</span>
                      </td>
                      <td className="py-3 px-3 font-mono text-[10px] text-slate-400 max-w-xs truncate">
                        {log.componentStack ? log.componentStack.substring(0, 100) + '...' : 'N/A'}
                      </td>
                      <td className="py-3 px-3 text-center">
                        <span className="px-2 py-0.5 rounded-full bg-rose-500/20 text-rose-300 text-[10px] font-bold border border-rose-500/30 uppercase">
                          {log.resolvedStatus || 'unresolved'}
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}




      {/* ============================================================== */}
      {/* TAB 5: AI ACCURACY & LHDN COMPLIANCE BENCHMARK AUDITOR */}
      {/* ============================================================== */}
      {activeTab === 'compliance_auditor' && (
        <div className="p-5 sm:p-6 rounded-2xl bg-slate-900 border border-slate-800 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-4">
            <div>
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-emerald-400" />
                <span>AI Accuracy &amp; LHDN Statutory Benchmark Auditor</span>
              </h3>
              <p className="text-xs text-slate-400">
                Monitors whether Gemini AI extractions accurately align with Budget 2026 gazette limits and flags discrepancies.
              </p>
            </div>

            <div className="flex items-center gap-2">
              <select
                value={auditFilter}
                onChange={(e) => setAuditFilter(e.target.value as any)}
                className="px-3 py-1.5 rounded-lg bg-slate-950 border border-slate-800 text-xs text-slate-200 focus:outline-none cursor-pointer"
              >
                <option value="all">All AI Logs ({aiScanLogs.length})</option>
                <option value="compliant">Compliant Scans Only</option>
                <option value="warning">Audit Warnings</option>
                <option value="flagged">Flagged / Disallowed</option>
              </select>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-slate-800 text-slate-400">
                  <th className="py-2.5 px-3">Timestamp</th>
                  <th className="py-2.5 px-3">Merchant</th>
                  <th className="py-2.5 px-3">Extracted Category &amp; Section</th>
                  <th className="py-2.5 px-3 text-right">Claimable (RM)</th>
                  <th className="py-2.5 px-3 text-center">AI Confidence</th>
                  <th className="py-2.5 px-3">LHDN Gazette Validation</th>
                  <th className="py-2.5 px-3 text-center">Admin QA Verification</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/80">
                {filteredAILogs.map((log) => (
                  <tr key={log.id} className="hover:bg-slate-950/60 transition">
                    <td className="py-3 px-3 text-[11px] text-slate-400 font-mono">
                      {new Date(log.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </td>
                    <td className="py-3 px-3">
                      <span className="font-bold text-white">{log.merchantName}</span>
                      <p className="text-[10px] text-slate-500 font-mono">{log.userEmail}</p>
                    </td>
                    <td className="py-3 px-3">
                      <div>
                        <span className="text-white font-medium">{log.category}</span>
                        <p className="text-[10px] text-emerald-400 font-mono">{log.statutorySection}</p>
                      </div>
                    </td>
                    <td className="py-3 px-3 text-right font-mono font-bold text-emerald-400">
                      {formatCurrency(log.claimableAmount)}
                    </td>
                    <td className="py-3 px-3 text-center font-mono">
                      <span
                        className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                          log.confidenceScore >= 90
                            ? 'bg-emerald-500/20 text-emerald-300'
                            : 'bg-amber-500/20 text-amber-300'
                        }`}
                      >
                        {log.confidenceScore}%
                      </span>
                    </td>
                    <td className="py-3 px-3 text-[11px] text-slate-300">
                      <div className="flex items-center gap-1.5">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                        <span className="truncate max-w-xs">{log.ruleCheckNote}</span>
                      </div>
                    </td>
                    <td className="py-3 px-3 text-center">
                      <div className="flex items-center justify-center gap-1.5">
                        <button
                          onClick={() => handleVerifyScanLog(log.id, 'verified')}
                          className={`px-2 py-1 rounded text-[10px] font-bold transition cursor-pointer ${
                            log.adminVerifiedStatus === 'verified'
                              ? 'bg-emerald-600 text-white'
                              : 'bg-slate-800 hover:bg-slate-700 text-emerald-400'
                          }`}
                        >
                          Verified
                        </button>
                        <button
                          onClick={() => handleVerifyScanLog(log.id, 'flagged')}
                          className={`px-2 py-1 rounded text-[10px] font-bold transition cursor-pointer ${
                            log.adminVerifiedStatus === 'flagged'
                              ? 'bg-rose-600 text-white'
                              : 'bg-slate-800 hover:bg-slate-700 text-rose-400'
                          }`}
                        >
                          Flag
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* TAB 6: DATABASE EXPLORER & NUCLEAR MAINTENANCE */}
      {/* ============================================================== */}
      {activeTab === 'database' && (
        <div className="space-y-6">
          <div className="p-5 sm:p-6 rounded-2xl bg-gradient-to-r from-slate-900 via-emerald-950/20 to-slate-900 border border-emerald-500/30 space-y-3">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 flex items-center justify-center shrink-0">
                <Info className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-white">System Data Transparency &amp; Statutory Retention Rules</h3>
                <p className="text-[11px] text-slate-400">Official technical explanation of statutory dates, live data integrity, and purge operations</p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 pt-2 text-xs">
              <div className="p-3.5 rounded-xl bg-slate-950/80 border border-slate-800 space-y-1.5">
                <div className="flex items-center gap-1.5 font-bold text-amber-400">
                  <Clock className="w-4 h-4" />
                  <span>Why the Year 2033 Appears</span>
                </div>
                <p className="text-slate-300 text-[11px] leading-relaxed">
                  Under <strong>Section 82A Income Tax Act 1967</strong>, all taxpayers are legally required to preserve tax documents for <strong>7 statutory years</strong>. For Assessment Year (YA) {activeTaxYear}, documents must be kept until <strong>31 December {activeTaxYear + 7}</strong>. This is the <em>legal audit retention expiry</em>, not the document transaction date.
                </p>
              </div>

              <div className="p-3.5 rounded-xl bg-slate-950/80 border border-slate-800 space-y-1.5">
                <div className="flex items-center gap-1.5 font-bold text-emerald-400">
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Live Cloud Records, 100% Production Data</span>
                </div>
                <p className="text-slate-300 text-[11px] leading-relaxed">
                  Every document in your Vault is a <strong>real receipt or invoice</strong> uploaded or captured by the taxpayer, analyzed by Google Gemini AI, and stored in your Cloud Firestore database. CukaiSmart operates exclusively on live user-submitted documents in production.
                </p>
              </div>

              <div className="p-3.5 rounded-xl bg-slate-950/80 border border-slate-800 space-y-1.5">
                <div className="flex items-center gap-1.5 font-bold text-rose-400">
                  <Trash2 className="w-4 h-4" />
                  <span>1-Click Nuclear Purge</span>
                </div>
                <p className="text-slate-300 text-[11px] leading-relaxed">
                  Clicking <strong>Execute Purge</strong> deletes every document from your Cloud Firestore collection (<code>/users/{currentUser?.uid || 'guest'}/receipts</code>), wipes local browser storage, and resets all relief progress bars to RM 0.00.
                </p>
              </div>
            </div>
          </div>

          {/* Admin Operations & Nuclear Toolkit */}
          <div className="p-5 sm:p-6 rounded-2xl bg-slate-900 border border-slate-800 space-y-4">
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <KeyRound className="w-4 h-4 text-amber-400" />
              <span>Database Lifecycle &amp; Maintenance Operations</span>
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5">
              <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 flex flex-col justify-between space-y-3">
                <div>
                  <div className="flex items-center gap-2 text-rose-400 text-xs font-bold mb-1">
                    <Trash2 className="w-4 h-4" />
                    <span>Nuclear Claim Purge</span>
                  </div>
                  <p className="text-xs text-slate-300 leading-relaxed">
                    Permanently wipes all documents from your user collection in Cloud Firestore and resets relief progress bars to 0%.
                  </p>
                </div>
                <button
                  onClick={handleNuclearPurge}
                  disabled={isPurging}
                  className="w-full py-2 rounded-lg bg-rose-950/60 hover:bg-rose-900 border border-rose-500/40 text-rose-300 font-bold text-xs transition cursor-pointer"
                >
                  Execute Purge
                </button>
              </div>

              <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 flex flex-col justify-between space-y-3">
                <div>
                  <div className="flex items-center gap-2 text-amber-400 text-xs font-bold mb-1">
                    <RefreshCw className="w-4 h-4" />
                    <span>Factory Reset</span>
                  </div>
                  <p className="text-xs text-slate-300 leading-relaxed">
                    Clears all custom brackets, salary inputs, local browser storage, and wipes receipts back to initial zero state.
                  </p>
                </div>
                <button
                  onClick={handleFullSystemReset}
                  disabled={isPurging}
                  className="w-full py-2 rounded-lg bg-amber-950/60 hover:bg-amber-900 border border-amber-500/40 text-amber-300 font-bold text-xs transition cursor-pointer"
                >
                  Reset System
                </button>
              </div>

              <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 flex flex-col justify-between space-y-3">
                <div>
                  <div className="flex items-center gap-2 text-emerald-400 text-xs font-bold mb-1">
                    <RefreshCw className="w-4 h-4" />
                    <span>LHDN Gazette Sync</span>
                  </div>
                  <p className="text-xs text-slate-300 leading-relaxed">
                    Syncs latest Budget statutory limits with official Ministry of Finance gazette definitions.
                  </p>
                </div>
                <button
                  onClick={handleSyncWithRemoteGazette}
                  disabled={isSyncingGazette}
                  className="w-full py-2 rounded-lg bg-emerald-950/60 hover:bg-emerald-900 border border-emerald-500/40 text-emerald-300 font-bold text-xs transition cursor-pointer"
                >
                  Sync Official Gazette
                </button>
              </div>
            </div>
          </div>

          {/* Cloud Firestore Collection Explorer Table */}
          <div className="p-5 sm:p-6 rounded-2xl bg-slate-900 border border-slate-800 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-3">
              <div>
                <h3 className="text-base font-bold text-white flex items-center gap-2">
                  <Database className="w-4 h-4 text-emerald-400" />
                  <span>Live Firestore Collection Explorer: `/users/{currentUser?.uid || 'guest'}/receipts`</span>
                </h3>
                <p className="text-xs text-slate-400">
                  Direct live inspection of documents sealed in your Cloud Firestore collection.
                </p>
              </div>

              <div className="flex items-center gap-2">
                <div className="relative">
                  <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    placeholder="Search merchant, SSM..."
                    value={adminSearch}
                    onChange={(e) => setAdminSearch(e.target.value)}
                    className="pl-8 pr-3 py-1.5 rounded-lg bg-slate-950 border border-slate-800 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500"
                  />
                </div>
              </div>
            </div>

            {receipts.length === 0 ? (
              <div className="p-8 text-center rounded-xl bg-slate-950 border border-slate-800 text-slate-400 space-y-2">
                <CheckCircle2 className="w-8 h-8 text-emerald-400 mx-auto" />
                <p className="text-sm font-bold text-white">Cloud Firestore Collection is 100% Empty</p>
                <p className="text-xs text-slate-500">
                  No documents exist in the database. When users upload receipts, live documents will appear here in real time.
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="border-b border-slate-800 text-slate-400">
                      <th className="py-2.5 px-3">Document ID</th>
                      <th className="py-2.5 px-3">Merchant</th>
                      <th className="py-2.5 px-3">Date</th>
                      <th className="py-2.5 px-3">Category</th>
                      <th className="py-2.5 px-3 text-right">Claimable (RM)</th>
                      <th className="py-2.5 px-3">Status</th>
                      <th className="py-2.5 px-3 text-center">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/80 font-mono">
                    {filteredAdminReceipts.map((r) => (
                      <tr key={r.id} className="hover:bg-slate-950/60 transition">
                        <td className="py-2.5 px-3 text-slate-400 truncate max-w-[120px]">{r.id}</td>
                        <td className="py-2.5 px-3 font-sans font-bold text-white">{r.merchantName}</td>
                        <td className="py-2.5 px-3 text-slate-300">{r.date}</td>
                        <td className="py-2.5 px-3 font-sans text-slate-300">{r.categoryName}</td>
                        <td className="py-2.5 px-3 text-right font-bold text-emerald-400">
                          {formatCurrency(r.claimableAmount)}
                        </td>
                        <td className="py-2.5 px-3">
                          <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-500/20 text-emerald-300">
                            {r.lhdnValidation.auditStatus}
                          </span>
                        </td>
                        <td className="py-2.5 px-3 text-center font-sans">
                          <div className="flex items-center justify-center gap-1.5">
                            <button
                              onClick={() => setSelectedRecordJson(r)}
                              className="px-2 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 text-[11px] transition cursor-pointer"
                            >
                              Inspect JSON
                            </button>
                            <button
                              onClick={() => deleteReceipt(r.id)}
                              className="p-1 rounded bg-rose-950/50 hover:bg-rose-900/80 text-rose-300 text-[11px] transition cursor-pointer"
                              title="Delete from Firestore"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}
        </main>
      </div>

      {/* Edit Relief Limit Modal */}

      {editingReliefItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-fade-in">
          <div className="w-full max-w-lg rounded-2xl bg-slate-900 border border-slate-800 p-6 shadow-2xl relative space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h4 className="text-sm font-bold text-white flex items-center gap-2">
                <Edit3 className="w-4 h-4 text-amber-400" />
                <span>Edit LHDN Statutory Relief: {editingReliefItem.title}</span>
              </h4>
              <button
                onClick={() => setEditingReliefItem(null)}
                className="text-xs text-slate-400 hover:text-white cursor-pointer"
              >
                Cancel
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-300 font-semibold mb-1">Relief Title</label>
                <input
                  type="text"
                  value={editTitleValue}
                  onChange={(e) => setEditTitleValue(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white focus:outline-none focus:border-amber-500"
                />
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">Statutory Section (ITA 1967)</label>
                <input
                  type="text"
                  value={editSectionValue}
                  onChange={(e) => setEditSectionValue(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white font-mono focus:outline-none focus:border-amber-500"
                />
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">Maximum Statutory Cap (RM)</label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 font-bold text-slate-400">RM</span>
                  <input
                    type="number"
                    value={editLimitValue}
                    onChange={(e) => setEditLimitValue(Number(e.target.value))}
                    className="w-full pl-10 pr-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-emerald-400 font-mono font-bold text-sm focus:outline-none focus:border-emerald-500"
                  />
                </div>
                <p className="text-[10px] text-slate-500 mt-1">
                  Adjusting this limit updates the Gemini AI scanner's system prompt and taxpayer utilization meters.
                </p>
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">Description &amp; Guidelines</label>
                <textarea
                  rows={3}
                  value={editDescValue}
                  onChange={(e) => setEditDescValue(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white focus:outline-none focus:border-amber-500"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-800">
              <button
                onClick={() => setEditingReliefItem(null)}
                className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 text-xs font-semibold cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveReliefEdit}
                disabled={isSavingRegulations}
                className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs transition cursor-pointer flex items-center gap-1.5"
              >
                <Save className="w-3.5 h-3.5" />
                <span>{isSavingRegulations ? 'Broadcasting...' : 'Save & Update Scanner'}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add New Relief Category Modal */}
      {isAddingReliefModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-fade-in">
          <form
            onSubmit={handleAddNewRelief}
            className="w-full max-w-lg rounded-2xl bg-slate-900 border border-slate-800 p-6 shadow-2xl relative space-y-4"
          >
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h4 className="text-sm font-bold text-white flex items-center gap-2">
                <PlusCircle className="w-4 h-4 text-emerald-400" />
                <span>Add New LHDN Relief Category</span>
              </h4>
              <button
                type="button"
                onClick={() => setIsAddingReliefModal(false)}
                className="text-xs text-slate-400 hover:text-white cursor-pointer"
              >
                Cancel
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-300 font-semibold mb-1">Unique Identifier (ID)</label>
                <input
                  type="text"
                  placeholder="e.g. relief-first-home-interest"
                  value={newRelief.id || ''}
                  onChange={(e) => setNewRelief({ ...newRelief, id: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white font-mono focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">Relief Title</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. First Home Housing Loan Interest Relief"
                  value={newRelief.title || ''}
                  onChange={(e) => setNewRelief({ ...newRelief, title: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Category Type</label>
                  <select
                    value={newRelief.category || 'lifestyle'}
                    onChange={(e) => setNewRelief({ ...newRelief, category: e.target.value as any })}
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white focus:outline-none cursor-pointer"
                  >
                    <option value="lifestyle">Lifestyle</option>
                    <option value="medical">Medical</option>
                    <option value="sports">Sports</option>
                    <option value="education">Education</option>
                    <option value="family">Family &amp; Child</option>
                    <option value="retirement">Retirement &amp; EPF</option>
                    <option value="green">Environmental &amp; EV</option>
                  </select>
                </div>

                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Max Limit (RM)</label>
                  <input
                    type="number"
                    required
                    value={newRelief.maxLimit || 1000}
                    onChange={(e) => setNewRelief({ ...newRelief, maxLimit: Number(e.target.value) })}
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-emerald-400 font-mono font-bold focus:outline-none focus:border-emerald-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">Statutory Section</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Sec 46(1)(w) ITA 1967"
                  value={newRelief.statutorySection || ''}
                  onChange={(e) => setNewRelief({ ...newRelief, statutorySection: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white font-mono focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">Description</label>
                <textarea
                  rows={2}
                  placeholder="Details on claimable expenses..."
                  value={newRelief.description || ''}
                  onChange={(e) => setNewRelief({ ...newRelief, description: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white focus:outline-none focus:border-emerald-500"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-800">
              <button
                type="button"
                onClick={() => setIsAddingReliefModal(false)}
                className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 text-xs font-semibold cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSavingRegulations}
                className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs transition cursor-pointer"
              >
                {isSavingRegulations ? 'Adding...' : 'Add & Broadcast'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* JSON Inspector Modal */}
      {selectedRecordJson && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-fade-in">
          <div className="w-full max-w-2xl rounded-2xl bg-slate-900 border border-slate-800 p-6 shadow-2xl relative max-h-[85vh] flex flex-col">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3 mb-3">
              <h4 className="text-sm font-bold text-white flex items-center gap-2">
                <Code className="w-4 h-4 text-cyan-400" />
                <span>
                  Forensic JSON Metadata: {selectedRecordJson.merchantName || selectedRecordJson.id}
                </span>
              </h4>
              <button
                onClick={() => setSelectedRecordJson(null)}
                className="text-xs text-slate-400 hover:text-white cursor-pointer"
              >
                Close
              </button>
            </div>
            <pre className="p-4 rounded-xl bg-slate-950 border border-slate-800 font-mono text-xs text-emerald-300 overflow-auto flex-1">
              {JSON.stringify(selectedRecordJson, null, 2)}
            </pre>
          </div>
        </div>
      )}

      {/* FinOps Solution Cost vs Human Cost Modal */}
      <SolutionVsHumanCostModal
        isOpen={isCostRoiOpen}
        onClose={() => setIsCostRoiOpen(false)}
      />
    </div>
  );
};
