import { initializeApp, getApps, getApp } from 'firebase/app';
import {
  getFirestore,
  doc,
  getDocFromServer,
  collection,
  getDocs,
  onSnapshot,
  setDoc,
  deleteDoc,
  query,
  orderBy,
  limit,
} from 'firebase/firestore';
import {
  getAuth,
  signInWithPopup,
  GoogleAuthProvider,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signInAnonymously,
  signOut,
  onAuthStateChanged,
  User,
} from 'firebase/auth';
import firebaseConfigData from '../../firebase-applet-config.json';
import { ReceiptRecord } from '../types/tax';

export const firebaseConfig = {
  projectId: firebaseConfigData.projectId,
  appId: firebaseConfigData.appId,
  apiKey: firebaseConfigData.apiKey,
  authDomain: firebaseConfigData.authDomain,
  firestoreDatabaseId: firebaseConfigData.firestoreDatabaseId,
  storageBucket: firebaseConfigData.storageBucket,
  messagingSenderId: firebaseConfigData.messagingSenderId,
};

// Initialize App
export const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();

// Initialize Auth
export const auth = getAuth(app);

// Initialize Firestore with custom databaseId
export const db = getFirestore(app, firebaseConfig.firestoreDatabaseId);

// Test live Firestore connectivity on boot (SKILL.md constraint)
export async function testFirestoreConnection(): Promise<boolean> {
  try {
    await getDocFromServer(doc(db, 'test', 'connection'));
    console.log('[CukaiSmart Firebase] Connected to Cloud Firestore successfully.');
    return true;
  } catch (error) {
    if (error instanceof Error && error.message.includes('the client is offline')) {
      console.warn('[CukaiSmart Firebase] Client offline or verifying network.');
    }
    return false;
  }
}
testFirestoreConnection();

// Google Auth Provider
const googleProvider = new GoogleAuthProvider();
googleProvider.setCustomParameters({ prompt: 'select_account' });

export const signInWithGoogle = async () => {
  try {
    const result = await signInWithPopup(auth, googleProvider);
    return result.user;
  } catch (error) {
    console.error('Google Sign-In Error:', error);
    throw error;
  }
};

export const signInWithEmail = async (email: string, pass: string) => {
  const result = await signInWithEmailAndPassword(auth, email, pass);
  return result.user;
};

export const signUpWithEmail = async (email: string, pass: string) => {
  const result = await createUserWithEmailAndPassword(auth, email, pass);
  return result.user;
};

export const signInAsGuest = async () => {
  const result = await signInAnonymously(auth);
  return result.user;
};

export const logoutUser = async () => {
  await signOut(auth);
};

export const onAuthChange = (callback: (user: User | null) => void) => {
  return onAuthStateChanged(auth, callback);
};

// =========================================================================
// FIRESTORE 7-YEAR AUDIT VAULT REPOSITORY (PER-USER TENANCY)
// =========================================================================

export const subscribeToReceipts = (
  userId: string,
  onUpdate: (receipts: ReceiptRecord[]) => void
) => {
  console.log(`[CukaiSmart Firebase] Subscribing to receipts vault for user: ${userId}`);
  const receiptsRef = collection(db, 'users', userId, 'receipts');
  const q = query(receiptsRef, orderBy('createdAt', 'desc'));

  return onSnapshot(
    q,
    (snapshot) => {
      const records: ReceiptRecord[] = [];
      snapshot.forEach((docSnap) => {
        records.push(docSnap.data() as ReceiptRecord);
      });
      console.log(`[CukaiSmart Firebase] Real-time sync: Fetched ${records.length} receipts from Firestore for user: ${userId}`);
      onUpdate(records);
    },
    (error) => {
      console.warn('[CukaiSmart Firebase] Firestore receipts subscription warning:', error.message);
    }
  );
};

export const saveReceiptToCloud = async (userId: string, receipt: ReceiptRecord) => {
  const startTime = Date.now();
  console.log(`[CukaiSmart Firebase] Initiating saveReceiptToCloud for Receipt ID: ${receipt.id}, Merchant: ${receipt.merchantName}, Amount: RM ${receipt.totalAmount}`);

  try {
    // Measure image payload size
    let imageUrlToSave = receipt.imageUrl;
    if (imageUrlToSave && imageUrlToSave.length > 800 * 1024) {
      console.warn(
        `[CukaiSmart Firebase] Warning: Receipt image size is large (${Math.round(
          imageUrlToSave.length / 1024
        )} KB). Truncating heavy data URL preview to avoid Firestore 1MB document limit.`
      );
      // Keep metadata intact, truncate data URL if above 800KB
      imageUrlToSave = imageUrlToSave.slice(0, 100 * 1024) + '...[truncated_for_storage]';
    }

    const receiptRef = doc(db, 'users', userId, 'receipts', receipt.id);
    const payload = {
      ...receipt,
      imageUrl: imageUrlToSave,
      userId,
      updatedAt: new Date().toISOString(),
    };

    await setDoc(receiptRef, payload);
    const elapsed = Date.now() - startTime;
    console.log(`[CukaiSmart Firebase] SUCCESS: Receipt ${receipt.id} persisted to Cloud Firestore in ${elapsed}ms.`);
  } catch (err: any) {
    console.error(`[CukaiSmart Firebase] ERROR persisting receipt ${receipt.id} to Firestore:`, err?.message || err);
    throw err;
  }
};

export const deleteReceiptFromCloud = async (userId: string, receiptId: string) => {
  console.log(`[CukaiSmart Firebase] Deleting receipt ${receiptId} from Firestore for user: ${userId}`);
  try {
    const receiptRef = doc(db, 'users', userId, 'receipts', receiptId);
    await deleteDoc(receiptRef);
    console.log(`[CukaiSmart Firebase] SUCCESS: Deleted receipt ${receiptId} from Firestore.`);
  } catch (err: any) {
    console.error(`[CukaiSmart Firebase] ERROR deleting receipt ${receiptId}:`, err?.message || err);
  }
};

export const clearAllUserReceiptsFromCloud = async (userId: string) => {
  console.log(`[CukaiSmart Firebase] Purging all receipts from Firestore for user: ${userId}`);
  try {
    const receiptsRef = collection(db, 'users', userId, 'receipts');
    const snapshot = await getDocs(receiptsRef);
    const deletePromises = snapshot.docs.map((docSnap) => deleteDoc(docSnap.ref));
    await Promise.all(deletePromises);
    console.log(`[CukaiSmart Firebase] Successfully deleted all ${snapshot.docs.length} receipts for user: ${userId}`);
  } catch (err: any) {
    console.error('[CukaiSmart Firebase] Error purging all receipts from Firestore:', err?.message || err);
    throw err;
  }
};

export const saveUserProfileToCloud = async (
  userId: string,
  profile: {
    email?: string;
    displayName?: string;
    persona: string;
    activeTaxYear: number;
    annualIncome?: number;
  }
) => {
  console.log(`[CukaiSmart Firebase] Saving user profile for UID: ${userId}`);
  try {
    const userRef = doc(db, 'users', userId);
    await setDoc(
      userRef,
      {
        userId,
        ...profile,
        updatedAt: new Date().toISOString(),
      },
      { merge: true }
    );
    console.log(`[CukaiSmart Firebase] User profile updated successfully in Firestore.`);
  } catch (err: any) {
    console.error(`[CukaiSmart Firebase] ERROR updating user profile:`, err?.message || err);
  }
};

export const subscribeToUserSettings = (
  userId: string,
  onUpdate: (settingsData: any) => void
) => {
  console.log(`[CukaiSmart Firebase] Subscribing to user settings for UID: ${userId}`);
  const userRef = doc(db, 'users', userId);
  return onSnapshot(
    userRef,
    (docSnap) => {
      if (docSnap.exists()) {
        console.log(`[CukaiSmart Firebase] User settings synced from Firestore.`);
        onUpdate(docSnap.data());
      }
    },
    (error) => {
      console.warn('[CukaiSmart Firebase] Firestore settings subscription notice:', error.message);
    }
  );
};

export const saveUserSettingsToCloud = async (
  userId: string,
  settings: Record<string, any>
) => {
  try {
    const userRef = doc(db, 'users', userId);
    await setDoc(
      userRef,
      {
        ...settings,
        updatedAt: new Date().toISOString(),
      },
      { merge: true }
    );
  } catch (err: any) {
    console.error('[CukaiSmart Firebase] Error saving user settings to cloud:', err?.message || err);
  }
};

// =========================================================================
// ADMIN & GOVERNANCE OBSERVABILITY UTILITIES
// =========================================================================

export const ADMIN_EMAILS = ['oweezyidi@gmail.com', 'admin@cukaismart.my'];

export const isUserAdmin = (user: User | null): boolean => {
  if (!user || !user.email) return false;
  const emailLower = user.email.toLowerCase().trim();
  return ADMIN_EMAILS.some((adm) => adm.toLowerCase() === emailLower) || emailLower.endsWith('@cukaismart.admin');
};

/**
 * Log AI scan telemetry and compliance evaluation to Firestore for admin monitoring
 */
export const recordAIScanLog = async (log: any) => {
  try {
    const logId = log.id || `ailog-${Date.now()}`;
    const logRef = doc(db, 'system_ai_logs', logId);
    await setDoc(logRef, {
      ...log,
      id: logId,
      createdAt: new Date().toISOString(),
    });
  } catch (e: any) {
    console.warn('[CukaiSmart Firebase] Notice: Could not record AI scan log:', e?.message || e);
  }
};

/**
 * Fetch recent AI scan logs for admin quality auditing
 */
export const fetchAIScanLogs = async (limitCount = 50): Promise<any[]> => {
  try {
    const logsRef = collection(db, 'system_ai_logs');
    const q = query(logsRef, orderBy('createdAt', 'desc'), limit(limitCount));
    const snap = await getDocs(q);
    const logs: any[] = [];
    snap.forEach((d) => logs.push(d.data()));
    return logs;
  } catch (e: any) {
    console.warn('[CukaiSmart Firebase] Notice: Falling back on local scan logs:', e?.message || e);
    return [];
  }
};

/**
 * Fetch all registered users for the admin directory
 */
export const fetchAdminUserDirectory = async (): Promise<any[]> => {
  try {
    const usersRef = collection(db, 'users');
    const snap = await getDocs(usersRef);
    const users: any[] = [];
    snap.forEach((d) => {
      const data = d.data();
      users.push({
        uid: d.id,
        email: data.email || 'guest-user@cukaismart.local',
        displayName: data.displayName || data.email?.split('@')[0] || 'Taxpayer',
        persona: data.persona || 'individual',
        role: ADMIN_EMAILS.includes(data.email) ? 'admin' : (data.role || 'user'),
        documentsCount: data.documentsCount || 0,
        totalClaimedAmount: data.totalClaimedAmount || 0,
        aiScansUsed: data.aiScansUsed || 1,
        aiScansLimit: data.aiScansLimit || 25,
        status: data.status || 'active',
        createdAt: data.createdAt || data.updatedAt || new Date().toISOString(),
        lastActive: data.updatedAt || new Date().toISOString(),
      });
    });
    return users;
  } catch (e: any) {
    console.warn('[CukaiSmart Firebase] Error fetching users directory:', e?.message || e);
    return [];
  }
};

/**
 * Update user status (e.g., active/suspended) or quota
 */
export const updateUserQuotaOrStatus = async (
  userId: string,
  updates: Record<string, any>
): Promise<void> => {
  try {
    const userRef = doc(db, 'users', userId);
    await setDoc(userRef, { ...updates, updatedAt: new Date().toISOString() }, { merge: true });
  } catch (e: any) {
    console.error('[CukaiSmart Firebase] Error updating user quota/status:', e);
    throw e;
  }
};

/**
 * Fetch Google Free Tier Usage Stats & Sentinel Status from Express Backend
 */
export const fetchGoogleFreeTierStats = async () => {
  try {
    const res = await fetch('/api/admin/free-usage-stats');
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return await res.json();
  } catch (err) {
    console.warn('[CukaiSmart] Could not fetch server free tier stats:', err);
    return null;
  }
};

/**
 * Update Google Free Tier Circuit Breaker configuration
 */
export const updateCircuitBreakerSettings = async (settings: {
  autoThrottleEnabled?: boolean;
  circuitBreakerThresholdPercent?: number;
  resetTodayCounter?: boolean;
}) => {
  const res = await fetch('/api/admin/circuit-breaker', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(settings),
  });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return await res.json();
};

/**
 * Simulate free tier percentage for testing alerts (50%, 70%, 90%)
 */
export const simulateUsageLevel = async (targetPercentage: number) => {
  const res = await fetch('/api/admin/simulate-usage', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ targetPercentage }),
  });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return await res.json();
};

/**
 * Fetch comprehensive server-side AI API audit trail
 */
export const fetchServerAIAuditLogs = async (options: {
  limit?: number;
  documentType?: string;
  userId?: string;
  abuseOnly?: boolean;
} = {}) => {
  try {
    const queryParams = new URLSearchParams();
    if (options.limit) queryParams.set('limit', String(options.limit));
    if (options.documentType) queryParams.set('documentType', options.documentType);
    if (options.userId) queryParams.set('userId', options.userId);
    if (options.abuseOnly) queryParams.set('abuseOnly', 'true');

    const res = await fetch(`/api/admin/ai-audit-trail?${queryParams.toString()}`);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();
    return data.logs || [];
  } catch (err) {
    console.warn('[CukaiSmart] Could not fetch server audit trail:', err);
    return [];
  }
};

/**
 * Push updated LHDN regulations and caps to server AI scanner engine
 */
export const updateRemoteLhdnReliefs = async (reliefs: any[]) => {
  const res = await fetch('/api/lhdn/update-reliefs', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ reliefs }),
  });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return await res.json();
};

// =========================================================================
// FIRESTORE GUEST SESSION TRACKING & DAILY THRESHOLDS (3 SCANS, 5 QUERIES)
// =========================================================================
export const GUEST_DAILY_SCAN_LIMIT = 3;
export const GUEST_DAILY_COPILOT_LIMIT = 5;

export const getOrCreateGuestSessionId = (): string => {
  let sessionId = localStorage.getItem('cukaismart_guest_session_id');
  if (!sessionId) {
    sessionId = `guest-session-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
    localStorage.setItem('cukaismart_guest_session_id', sessionId);
  }
  return sessionId;
};

export const checkAndIncrementGuestQuotaFirestore = async (
  sessionId: string,
  actionType: 'scan' | 'copilot_query'
): Promise<{ allowed: boolean; remaining: number; limit: number; currentCount: number; reason?: string }> => {
  const today = new Date().toISOString().split('T')[0];
  const limit = actionType === 'scan' ? GUEST_DAILY_SCAN_LIMIT : GUEST_DAILY_COPILOT_LIMIT;

  try {
    const sessionRef = doc(db, 'guest_sessions', sessionId);
    const snap = await getDocFromServer(sessionRef);

    let scanCount = 0;
    let copilotQueryCount = 0;

    if (snap.exists()) {
      const data = snap.data();
      if (data.date === today) {
        scanCount = data.scanCount || 0;
        copilotQueryCount = data.copilotQueryCount || 0;
      }
    }

    const currentCount = actionType === 'scan' ? scanCount : copilotQueryCount;

    if (currentCount >= limit) {
      return {
        allowed: false,
        remaining: 0,
        limit,
        currentCount,
        reason: `Guest daily threshold reached (${limit} ${actionType === 'scan' ? 'document scans' : 'Copilot queries'} per day). Sign in or register to unlock full access.`,
      };
    }

    const newScanCount = actionType === 'scan' ? scanCount + 1 : scanCount;
    const newCopilotCount = actionType === 'copilot_query' ? copilotQueryCount + 1 : copilotQueryCount;

    await setDoc(
      sessionRef,
      {
        sessionId,
        date: today,
        scanCount: newScanCount,
        copilotQueryCount: newCopilotCount,
        lastActive: new Date().toISOString(),
      },
      { merge: true }
    );

    const updatedCount = actionType === 'scan' ? newScanCount : newCopilotCount;
    return {
      allowed: true,
      remaining: limit - updatedCount,
      limit,
      currentCount: updatedCount,
    };
  } catch (err) {
    console.warn('[Guest Quota] Firestore guest session check warning:', err);
    return { allowed: true, remaining: limit - 1, limit, currentCount: 1 };
  }
};

// =========================================================================
// USER FEEDBACK SYSTEM FIRESTORE INTEGRATION
// =========================================================================
export const saveUserFeedbackToCloud = async (
  feedbackData: Omit<import('../types/tax').UserFeedbackRecord, 'id' | 'createdAt' | 'status'>
): Promise<string> => {
  const id = `feedback-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
  const fullRecord: import('../types/tax').UserFeedbackRecord = {
    ...feedbackData,
    id,
    createdAt: new Date().toISOString(),
    status: 'new',
  };

  try {
    const feedbackRef = doc(db, 'user_feedbacks', id);
    await setDoc(feedbackRef, fullRecord);
  } catch (err) {
    console.warn('[Feedback] Could not save feedback to Firestore, saving to local storage fallback:', err);
  }

  // Local storage fallback for admin / user persistence
  try {
    const existing = JSON.parse(localStorage.getItem('cukaismart_user_feedbacks_v1') || '[]');
    existing.unshift(fullRecord);
    localStorage.setItem('cukaismart_user_feedbacks_v1', JSON.stringify(existing));
  } catch (e) {
    console.error('Failed to write feedback to localStorage fallback', e);
  }

  return id;
};

export const fetchUserFeedbacksFromCloud = async (): Promise<import('../types/tax').UserFeedbackRecord[]> => {
  try {
    const colRef = collection(db, 'user_feedbacks');
    const snap = await getDocs(query(colRef, limit(50)));
    const list: import('../types/tax').UserFeedbackRecord[] = [];
    snap.forEach((doc) => {
      list.push(doc.data() as import('../types/tax').UserFeedbackRecord);
    });
    if (list.length > 0) {
      return list.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    }
  } catch (err) {
    console.warn('[Feedback] Could not fetch feedbacks from Firestore, reading local fallback:', err);
  }

  try {
    const local = JSON.parse(localStorage.getItem('cukaismart_user_feedbacks_v1') || '[]');
    return local;
  } catch (e) {
    return [];
  }
};

// =========================================================================
// SYSTEM CRASH & COMPONENT-LEVEL ERROR LOGGING TO FIRESTORE
// =========================================================================
export const saveCrashLogToCloud = async (
  errorData: Omit<import('../types/tax').CrashLogRecord, 'id' | 'createdAt' | 'resolvedStatus'>
): Promise<string> => {
  const id = `crash-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
  const crashRecord: import('../types/tax').CrashLogRecord = {
    ...errorData,
    id,
    createdAt: new Date().toISOString(),
    resolvedStatus: 'unresolved',
  };

  try {
    const crashRef = doc(db, 'system_crash_logs', id);
    await setDoc(crashRef, crashRecord);
    console.log('[ErrorBoundary] Component crash details successfully saved to Firestore system_crash_logs');
  } catch (err) {
    console.warn('[ErrorBoundary] Could not save crash to Firestore, saving to local fallback:', err);
  }

  // Local storage fallback for admin inspection
  try {
    const existing = JSON.parse(localStorage.getItem('cukaismart_system_crash_logs_v1') || '[]');
    existing.unshift(crashRecord);
    localStorage.setItem('cukaismart_system_crash_logs_v1', JSON.stringify(existing.slice(0, 50)));
  } catch (e) {
    console.error('Failed to write crash log to localStorage fallback', e);
  }

  return id;
};

export const fetchCrashLogsFromCloud = async (): Promise<import('../types/tax').CrashLogRecord[]> => {
  try {
    const colRef = collection(db, 'system_crash_logs');
    const snap = await getDocs(query(colRef, limit(50)));
    const list: import('../types/tax').CrashLogRecord[] = [];
    snap.forEach((doc) => {
      list.push(doc.data() as import('../types/tax').CrashLogRecord);
    });
    if (list.length > 0) {
      return list.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    }
  } catch (err) {
    console.warn('[ErrorBoundary] Could not fetch crash logs from Firestore, reading local fallback:', err);
  }

  try {
    const local = JSON.parse(localStorage.getItem('cukaismart_system_crash_logs_v1') || '[]');
    return local;
  } catch (e) {
    return [];
  }
};




