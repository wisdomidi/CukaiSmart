import React, { createContext, useContext, useState, useEffect } from 'react';
import { User } from 'firebase/auth';
import {
  Persona,
  RegionalAuthority,
  TaxBracket,
  TaxRelief,
  BusinessDeductionCategory,
  ReceiptRecord,
  TaxAgentVerification,
} from '../types/tax';
import {
  REGIONAL_PROFILES,
  INITIAL_PERSONAL_RELIEFS,
  INITIAL_BUSINESS_CATEGORIES,
} from '../utils/taxEngine';
import { calculateReliefSummary } from '../constants/lhdnReliefs';
import { INITIAL_RECEIPTS } from '../utils/seedData';
import {
  auth,
  onAuthChange,
  signInWithGoogle,
  signInWithEmail,
  signUpWithEmail,
  signInAsGuest,
  logoutUser,
  subscribeToReceipts,
  saveReceiptToCloud,
  deleteReceiptFromCloud,
  saveUserProfileToCloud,
  subscribeToUserSettings,
  saveUserSettingsToCloud,
  clearAllUserReceiptsFromCloud,
} from '../services/firebase';

interface TaxContextType {
  currentUser: User | null;
  isAuthLoading: boolean;
  loginWithGoogle: () => Promise<User>;
  loginWithEmail: (email: string, pass: string) => Promise<User>;
  registerWithEmail: (email: string, pass: string) => Promise<User>;
  continueAsGuest: () => Promise<User>;
  logout: () => Promise<void>;
  isCloudSynced: boolean;
  persona: Persona;
  setPersona: (p: Persona) => void;
  activeTaxYear: number;
  setActiveTaxYear: (y: number) => void;
  regionalAuthority: RegionalAuthority;
  setRegionalAuthority: (r: RegionalAuthority) => void;
  receipts: ReceiptRecord[];
  addReceipt: (r: ReceiptRecord) => void;
  deleteReceipt: (id: string) => void;
  updateReceipt: (id: string, updated: Partial<ReceiptRecord>) => void;
  personalReliefs: TaxRelief[];
  reliefSummary: ReturnType<typeof calculateReliefSummary>;
  updatePersonalRelief: (id: string, amount: number) => void;
  businessCategories: BusinessDeductionCategory[];
  updateBusinessCategory: (id: string, amount: number) => void;
  customBrackets: TaxBracket[];
  updateCustomBracket: (bracketId: string, rate: number) => void;
  resetCustomBrackets: () => void;
  taxAgentSession: TaxAgentVerification;
  setTaxAgentSession: (v: TaxAgentVerification) => void;
  monthlyIncome: number;
  setMonthlyIncome: (m: number) => void;
  monthlySavingsBudget: number;
  setMonthlySavingsBudget: (b: number) => void;
  lastLHDNSyncTime: string | null;
  syncWithLHDN: () => Promise<{ updatedCount: number; totalReliefs: number; syncTimestamp: string }>;
  clearAllReceipts: () => Promise<void>;
  clearDemoReceipts: () => Promise<void>;
  resetAllData: () => Promise<void>;
}

const TaxContext = createContext<TaxContextType | null>(null);

const STORAGE_KEYS = {
  PERSONA: 'cukaismart_persona_v1',
  TAX_YEAR: 'cukaismart_tax_year_v1',
  REGION: 'cukaismart_region_v1',
  RECEIPTS: 'cukaismart_receipts_v1',
  RELIEFS: 'cukaismart_reliefs_v1',
  BIZ_CATS: 'cukaismart_biz_cats_v1',
  AGENT: 'cukaismart_agent_session_v1',
  INCOME: 'cukaismart_monthly_income_v1',
  BUDGET: 'cukaismart_savings_budget_v1',
  CUSTOM_BRACKETS: 'cukaismart_custom_brackets_v1',
};

export const TaxProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Firebase Auth state
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [isAuthLoading, setIsAuthLoading] = useState(true);
  const [isCloudSynced, setIsCloudSynced] = useState(false);

  // Persona: 'individual' vs 'business'
  const [persona, setPersonaState] = useState<Persona>(() => {
    return (localStorage.getItem(STORAGE_KEYS.PERSONA) as Persona) || 'individual';
  });

  const [activeTaxYear, setActiveTaxYearState] = useState<number>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.TAX_YEAR);
    return saved ? Number(saved) : 2026;
  });

  const [regionalAuthority, setRegionalAuthorityState] = useState<RegionalAuthority>(() => {
    return (localStorage.getItem(STORAGE_KEYS.REGION) as RegionalAuthority) || 'MY';
  });

  // Receipts
  const [receipts, setReceipts] = useState<ReceiptRecord[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.RECEIPTS);
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        console.error('Failed to parse saved receipts', e);
      }
    }
    return [];
  });

  // Base personal reliefs definition with claimedAmount set to 0 by default
  const [personalReliefs, setPersonalReliefs] = useState<TaxRelief[]>(() => {
    return INITIAL_PERSONAL_RELIEFS.map((r) => ({ ...r, claimedAmount: 0 }));
  });

  // Base business categories definition with claimedAmount set to 0 by default
  const [businessCategories, setBusinessCategories] = useState<BusinessDeductionCategory[]>(() => {
    return INITIAL_BUSINESS_CATEGORIES.map((b) => ({ ...b, claimedAmount: 0 }));
  });

  // Dynamic / Custom Tax Brackets
  const [customBrackets, setCustomBrackets] = useState<TaxBracket[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.CUSTOM_BRACKETS);
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        console.error(e);
      }
    }
    return REGIONAL_PROFILES[regionalAuthority]?.brackets || REGIONAL_PROFILES.MY.brackets;
  });

  // Tax Agent Session
  const [taxAgentSession, setTaxAgentSessionState] = useState<TaxAgentVerification>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.AGENT);
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        console.error(e);
      }
    }
    return {
      isVerified: false,
      licenseNumber: '',
      agentName: '',
      firmName: '',
      firmSSM: '',
    };
  });

  // Monthly income & savings budget for Payday Optimizer
  const [monthlyIncome, setMonthlyIncomeState] = useState<number>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.INCOME);
    return saved ? Number(saved) : 9500;
  });

  const [monthlySavingsBudget, setMonthlySavingsBudgetState] = useState<number>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.BUDGET);
    return saved ? Number(saved) : 1200;
  });

  // Listen to Firebase Auth state and sync cloud data
  useEffect(() => {
    let unsubReceipts: (() => void) | undefined;
    let unsubSettings: (() => void) | undefined;

    const unsubscribe = onAuthChange((user) => {
      setCurrentUser(user);
      setIsAuthLoading(false);

      if (user) {
        setIsCloudSynced(true);

        // Subscribe to real-time user settings in Firestore
        unsubSettings = subscribeToUserSettings(user.uid, (settingsData) => {
          if (!settingsData) return;
          if (settingsData.persona) setPersonaState(settingsData.persona);
          if (settingsData.activeTaxYear) setActiveTaxYearState(settingsData.activeTaxYear);
          if (settingsData.regionalAuthority) setRegionalAuthorityState(settingsData.regionalAuthority);
          if (settingsData.monthlyIncome !== undefined) setMonthlyIncomeState(settingsData.monthlyIncome);
          if (settingsData.monthlySavingsBudget !== undefined) setMonthlySavingsBudgetState(settingsData.monthlySavingsBudget);
          if (settingsData.personalReliefs && Array.isArray(settingsData.personalReliefs)) {
            setPersonalReliefs(settingsData.personalReliefs);
          }
          if (settingsData.businessCategories && Array.isArray(settingsData.businessCategories)) {
            setBusinessCategories(settingsData.businessCategories);
          }
          if (settingsData.customBrackets && Array.isArray(settingsData.customBrackets)) {
            setCustomBrackets(settingsData.customBrackets);
          }
          if (settingsData.taxAgentSession) setTaxAgentSessionState(settingsData.taxAgentSession);
        });

        // Subscribe to real-time receipts in Firestore
        unsubReceipts = subscribeToReceipts(user.uid, (cloudReceipts) => {
          setReceipts(cloudReceipts || []);
        });
      } else {
        setIsCloudSynced(false);
      }
    });

    return () => {
      unsubscribe();
      if (unsubReceipts) unsubReceipts();
      if (unsubSettings) unsubSettings();
    };
  }, []);

  // Keep brackets in sync when regional profile changes
  useEffect(() => {
    const profile = REGIONAL_PROFILES[regionalAuthority];
    if (profile) {
      setCustomBrackets(profile.brackets);
    }
  }, [regionalAuthority]);

  // Helper to persist user settings to cloud & local storage
  const persistSettings = (updates: Record<string, any>) => {
    if (currentUser) {
      saveUserSettingsToCloud(currentUser.uid, updates);
    }
  };

  // Save changes to localStorage for offline cache & Cloud Firestore
  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.PERSONA, persona);
    persistSettings({ persona });
  }, [persona, currentUser]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.TAX_YEAR, String(activeTaxYear));
    persistSettings({ activeTaxYear });
  }, [activeTaxYear, currentUser]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.REGION, regionalAuthority);
    persistSettings({ regionalAuthority });
  }, [regionalAuthority, currentUser]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.RECEIPTS, JSON.stringify(receipts));

    // Dynamic sync: recalculate personal relief claimed totals from actual saved receipts in active tax year
    setPersonalReliefs((prev) => {
      return prev.map((relief) => {
        const matchingReceipts = receipts.filter(
          (r) =>
            r.persona === 'individual' &&
            r.taxYear === activeTaxYear &&
            r.categoryId === relief.id
        );
        const totalClaimedForCat = matchingReceipts.reduce(
          (sum, r) => sum + (r.claimableAmount ?? 0),
          0
        );
        return { ...relief, claimedAmount: totalClaimedForCat };
      });
    });

    // Dynamic sync: recalculate business category claimed totals from actual saved receipts in active tax year
    setBusinessCategories((prev) => {
      return prev.map((cat) => {
        const matchingReceipts = receipts.filter(
          (r) =>
            r.persona === 'business' &&
            r.taxYear === activeTaxYear &&
            r.categoryId === cat.id
        );
        const totalClaimedForCat = matchingReceipts.reduce(
          (sum, r) => sum + (r.claimableAmount ?? 0),
          0
        );
        return { ...cat, claimedAmount: totalClaimedForCat };
      });
    });
  }, [receipts, activeTaxYear]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.RELIEFS, JSON.stringify(personalReliefs));
    persistSettings({ personalReliefs });
  }, [personalReliefs, currentUser]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.BIZ_CATS, JSON.stringify(businessCategories));
    persistSettings({ businessCategories });
  }, [businessCategories, currentUser]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.AGENT, JSON.stringify(taxAgentSession));
    persistSettings({ taxAgentSession });
  }, [taxAgentSession, currentUser]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.INCOME, String(monthlyIncome));
    persistSettings({ monthlyIncome });
  }, [monthlyIncome, currentUser]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.BUDGET, String(monthlySavingsBudget));
    persistSettings({ monthlySavingsBudget });
  }, [monthlySavingsBudget, currentUser]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.CUSTOM_BRACKETS, JSON.stringify(customBrackets));
    persistSettings({ customBrackets });
  }, [customBrackets, currentUser]);

  const setPersona = (p: Persona) => {
    setPersonaState(p);
    if (currentUser) saveUserSettingsToCloud(currentUser.uid, { persona: p });
  };

  const setActiveTaxYear = (y: number) => {
    setActiveTaxYearState(y);
    if (currentUser) saveUserSettingsToCloud(currentUser.uid, { activeTaxYear: y });
  };

  const setRegionalAuthority = (r: RegionalAuthority) => {
    setRegionalAuthorityState(r);
    if (currentUser) saveUserSettingsToCloud(currentUser.uid, { regionalAuthority: r });
  };

  const addReceipt = (newReceipt: ReceiptRecord) => {
    setReceipts((prev) => [newReceipt, ...prev]);

    // Save to Firestore if user logged in
    if (currentUser) {
      saveReceiptToCloud(currentUser.uid, newReceipt);
    }

    // Automatically update relief/business claimed amount
    if (newReceipt.persona === 'individual' && newReceipt.categoryId) {
      setPersonalReliefs((prev) => {
        const updated = prev.map((relief) => {
          if (relief.id === newReceipt.categoryId) {
            return {
              ...relief,
              claimedAmount: relief.claimedAmount + newReceipt.claimableAmount,
            };
          }
          return relief;
        });
        if (currentUser) {
          saveUserSettingsToCloud(currentUser.uid, { personalReliefs: updated });
        }
        return updated;
      });
    } else if (newReceipt.persona === 'business' && newReceipt.categoryId) {
      setBusinessCategories((prev) => {
        const updated = prev.map((cat) => {
          if (cat.id === newReceipt.categoryId) {
            return {
              ...cat,
              claimedAmount: cat.claimedAmount + newReceipt.claimableAmount,
            };
          }
          return cat;
        });
        if (currentUser) {
          saveUserSettingsToCloud(currentUser.uid, { businessCategories: updated });
        }
        return updated;
      });
    }
  };

  const deleteReceipt = (id: string) => {
    const toDelete = receipts.find((r) => r.id === id);
    if (toDelete) {
      if (toDelete.persona === 'individual' && toDelete.categoryId) {
        setPersonalReliefs((prev) => {
          const updated = prev.map((relief) =>
            relief.id === toDelete.categoryId
              ? { ...relief, claimedAmount: Math.max(0, relief.claimedAmount - toDelete.claimableAmount) }
              : relief
          );
          if (currentUser) {
            saveUserSettingsToCloud(currentUser.uid, { personalReliefs: updated });
          }
          return updated;
        });
      } else if (toDelete.persona === 'business' && toDelete.categoryId) {
        setBusinessCategories((prev) => {
          const updated = prev.map((cat) =>
            cat.id === toDelete.categoryId
              ? { ...cat, claimedAmount: Math.max(0, cat.claimedAmount - toDelete.claimableAmount) }
              : cat
          );
          if (currentUser) {
            saveUserSettingsToCloud(currentUser.uid, { businessCategories: updated });
          }
          return updated;
        });
      }
    }
    setReceipts((prev) => prev.filter((r) => r.id !== id));

    // Delete from Firestore
    const uid = currentUser?.uid || auth.currentUser?.uid;
    if (uid) {
      deleteReceiptFromCloud(uid, id);
    }
  };

  const updateReceipt = (id: string, updated: Partial<ReceiptRecord>) => {
    setReceipts((prev) => {
      const updatedList = prev.map((r) => (r.id === id ? { ...r, ...updated } : r));
      const modified = updatedList.find((r) => r.id === id);
      if (modified && currentUser) {
        saveReceiptToCloud(currentUser.uid, modified);
      }
      return updatedList;
    });
  };

  const updatePersonalRelief = (id: string, amount: number) => {
    setPersonalReliefs((prev) => {
      const updated = prev.map((r) => (r.id === id ? { ...r, claimedAmount: amount } : r));
      if (currentUser) {
        saveUserSettingsToCloud(currentUser.uid, { personalReliefs: updated });
      }
      return updated;
    });
  };

  const updateBusinessCategory = (id: string, amount: number) => {
    setBusinessCategories((prev) => {
      const updated = prev.map((cat) => (cat.id === id ? { ...cat, claimedAmount: amount } : cat));
      if (currentUser) {
        saveUserSettingsToCloud(currentUser.uid, { businessCategories: updated });
      }
      return updated;
    });
  };

  const updateCustomBracket = (bracketId: string, rate: number) => {
    setCustomBrackets((prev) => {
      const updated = prev.map((b) => (b.id === bracketId ? { ...b, rate } : b));
      if (currentUser) {
        saveUserSettingsToCloud(currentUser.uid, { customBrackets: updated });
      }
      return updated;
    });
  };

  const resetCustomBrackets = () => {
    const profile = REGIONAL_PROFILES[regionalAuthority];
    if (profile) {
      const brackets = profile.brackets;
      setCustomBrackets(brackets);
      if (currentUser) {
        saveUserSettingsToCloud(currentUser.uid, { customBrackets: brackets });
      }
    }
  };

  const setTaxAgentSession = (v: TaxAgentVerification) => {
    setTaxAgentSessionState(v);
    if (currentUser) {
      saveUserSettingsToCloud(currentUser.uid, { taxAgentSession: v });
    }
  };

  const setMonthlyIncome = (m: number) => {
    setMonthlyIncomeState(m);
    if (currentUser) {
      saveUserSettingsToCloud(currentUser.uid, { monthlyIncome: m });
    }
  };

  const setMonthlySavingsBudget = (b: number) => {
    setMonthlySavingsBudgetState(b);
    if (currentUser) {
      saveUserSettingsToCloud(currentUser.uid, { monthlySavingsBudget: b });
    }
  };



  const clearDemoReceipts = async () => {
    // 1. Immediately zero in-memory state
    setReceipts([]);

    // 2. Clear relevant local storage keys
    localStorage.removeItem(STORAGE_KEYS.RECEIPTS);
    localStorage.removeItem(STORAGE_KEYS.RELIEFS);
    localStorage.removeItem(STORAGE_KEYS.BIZ_CATS);
    localStorage.removeItem('cukaismart_receipts');
    localStorage.removeItem('cukaismart_receipts_v1');

    // 3. Explicitly zero out all claimed amounts
    const zeroReliefs = INITIAL_PERSONAL_RELIEFS.map((r) => ({ ...r, claimedAmount: 0 }));
    const zeroBizCats = INITIAL_BUSINESS_CATEGORIES.map((b) => ({ ...b, claimedAmount: 0 }));
    setPersonalReliefs(zeroReliefs);
    setBusinessCategories(zeroBizCats);

    // 4. Purge from Cloud Firestore if authenticated
    const uid = currentUser?.uid || auth.currentUser?.uid;
    if (uid) {
      try {
        await clearAllUserReceiptsFromCloud(uid);
        await saveUserSettingsToCloud(uid, {
          personalReliefs: zeroReliefs,
          businessCategories: zeroBizCats,
        });
        console.log(`[TaxContext] All receipts purged from Cloud Firestore for UID: ${uid}`);
      } catch (e) {
        console.error('[TaxContext] Error clearing receipts from Cloud Firestore:', e);
        throw e;
      }
    }
  };

  // Last LHDN Sync timestamp
  const [lastLHDNSyncTime, setLastLHDNSyncTime] = useState<string | null>(() => {
    return localStorage.getItem('cukaismart_lhdn_sync_time') || new Date().toISOString();
  });

  const syncWithLHDN = async () => {
    try {
      console.log('[TaxContext] Fetching live official tax relief definitions from /api/lhdn/sync-reliefs...');
      const res = await fetch('/api/lhdn/sync-reliefs');
      if (!res.ok) throw new Error(`Server returned HTTP ${res.status}`);
      const data = await res.json();

      let updatedCount = 0;
      if (data.reliefs && Array.isArray(data.reliefs)) {
        setPersonalReliefs((prev) => {
          const updatedList = prev.map((localRelief) => {
            const officialMatch = data.reliefs.find((r: any) => r.id === localRelief.id);
            if (officialMatch && (officialMatch.maxLimit !== localRelief.maxLimit || officialMatch.statutorySection !== localRelief.section)) {
              updatedCount++;
              return {
                ...localRelief,
                maxLimit: officialMatch.maxLimit,
                section: officialMatch.statutorySection,
                description: officialMatch.description,
              };
            }
            return localRelief;
          });
          return updatedList;
        });
      }

      const syncTime = new Date().toISOString();
      setLastLHDNSyncTime(syncTime);
      localStorage.setItem('cukaismart_lhdn_sync_time', syncTime);

      if (currentUser) {
        saveUserSettingsToCloud(currentUser.uid, {
          lastLHDNSyncTime: syncTime,
          personalReliefs,
        });
      }

      return {
        updatedCount,
        totalReliefs: data.totalReliefs || 13,
        syncTimestamp: syncTime,
      };
    } catch (e) {
      console.error('[TaxContext] Error syncing with live LHDN API:', e);
      throw e;
    }
  };

  const resetAllData = async () => {
    setReceipts([]);
    localStorage.clear();

    const zeroReliefs = INITIAL_PERSONAL_RELIEFS.map((r) => ({ ...r, claimedAmount: 0 }));
    const zeroBizCats = INITIAL_BUSINESS_CATEGORIES.map((b) => ({ ...b, claimedAmount: 0 }));
    setPersonalReliefs(zeroReliefs);
    setBusinessCategories(zeroBizCats);
    setPersonaState('individual');
    setActiveTaxYearState(2026);
    setRegionalAuthorityState('MY');
    setCustomBrackets(REGIONAL_PROFILES.MY.brackets);
    setMonthlyIncomeState(0);
    setMonthlySavingsBudgetState(0);

    const uid = currentUser?.uid || auth.currentUser?.uid;
    if (uid) {
      try {
        await clearAllUserReceiptsFromCloud(uid);
        await saveUserSettingsToCloud(uid, {
          persona: 'individual',
          activeTaxYear: 2026,
          regionalAuthority: 'MY',
          personalReliefs: zeroReliefs,
          businessCategories: zeroBizCats,
          customBrackets: REGIONAL_PROFILES.MY.brackets,
          monthlyIncome: 0,
          monthlySavingsBudget: 0,
        });
      } catch (e) {
        console.error('[TaxContext] Error resetting user data in Cloud Firestore:', e);
        throw e;
      }
    }
  };

  const loginWithGoogle = async () => {
    const u = await signInWithGoogle();
    return u;
  };

  const loginWithEmail = async (email: string, pass: string) => {
    const u = await signInWithEmail(email, pass);
    return u;
  };

  const registerWithEmail = async (email: string, pass: string) => {
    const u = await signUpWithEmail(email, pass);
    return u;
  };

  const continueAsGuest = async () => {
    const u = await signInAsGuest();
    return u;
  };

  const logout = async () => {
    await logoutUser();
  };

  const reliefSummary = calculateReliefSummary(personalReliefs);

  return (
    <TaxContext.Provider
      value={{
        currentUser,
        isAuthLoading,
        loginWithGoogle,
        loginWithEmail,
        registerWithEmail,
        continueAsGuest,
        logout,
        isCloudSynced,
        persona,
        setPersona,
        activeTaxYear,
        setActiveTaxYear,
        regionalAuthority,
        setRegionalAuthority,
        receipts,
        addReceipt,
        deleteReceipt,
        updateReceipt,
        personalReliefs,
        reliefSummary,
        updatePersonalRelief,
        businessCategories,
        updateBusinessCategory,
        customBrackets,
        updateCustomBracket,
        resetCustomBrackets,
        taxAgentSession,
        setTaxAgentSession,
        monthlyIncome,
        setMonthlyIncome,
        monthlySavingsBudget,
        setMonthlySavingsBudget,
        lastLHDNSyncTime,
        syncWithLHDN,
        clearAllReceipts: clearDemoReceipts,
        clearDemoReceipts,
        resetAllData,
      }}
    >
      {children}
    </TaxContext.Provider>
  );
};

export function useTax() {
  const context = useContext(TaxContext);
  if (!context) {
    throw new Error('useTax must be used within a TaxProvider');
  }
  return context;
}
