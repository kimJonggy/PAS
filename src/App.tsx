import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { ShareRecord, MonthKey, SocietySummary } from './types';
import { INITIAL_SHARES } from './data/initialData';
import {
  calculateShareRecord,
  calculateSocietySummary,
  formatTaka,
  getCurrentSystemMonthKey,
  syncShareRecordWithCalendar,
} from './utils/calculations';
import { Navbar } from './components/Navbar';
import { SummaryCards } from './components/SummaryCards';
import { MasterLedgerTable } from './components/MasterLedgerTable';
import { MemberCardsView } from './components/MemberCardsView';
import { MonthReconciliationView } from './components/MonthReconciliationView';
import { OverdueRemindersView } from './components/OverdueRemindersView';
import { MembersDirectoryView } from './components/MembersDirectoryView';
import { LandDocumentsView } from './components/LandDocumentsView';
import { MoneyReceiptModal } from './components/MoneyReceiptModal';
import { RecordPaymentModal } from './components/RecordPaymentModal';
import { AddMemberModal } from './components/AddMemberModal';
import { CurrentMonthFloatingTracker } from './components/CurrentMonthFloatingTracker';
import { MemberDetailModal } from './components/MemberDetailModal';
import { GoogleSheetSyncModal } from './components/GoogleSheetSyncModal';
import { AdminLoginModal } from './components/AdminLoginModal';
import { MonthSettingsModal } from './components/MonthSettingsModal';
import { useAuth } from './context/AuthContext';
import { useLanguage } from './context/LanguageContext';
import { initAuth, googleSignIn, getAccessToken, logout } from './services/googleAuth';
import {
  subscribeToSocietyData,
  saveSocietyDataToCloud,
} from './services/firestoreSync';
import {
  SheetMetadata,
  fetchSpreadsheetMetadata,
  createGoogleSpreadsheet,
  pushToGoogleSheet,
  applySheetStyling,
  pullFromGoogleSheet,
  extractSpreadsheetId,
} from './services/googleSheets';
import { User as FirebaseUser } from 'firebase/auth';
import {
  Table,
  Users,
  CalendarDays,
  AlertTriangle,
  Search,
  Filter,
  CheckCircle2,
  FileSpreadsheet,
  Contact,
  Scale,
  Landmark,
  X,
} from 'lucide-react';

const STORAGE_KEY = 'pas_fund_shares_data_v1';
const SHEET_ID_KEY = 'pas_google_sheet_id_v1';
const AUTO_SYNC_KEY = 'pas_google_sheet_autosync_v1';

export default function App() {
  const { t, language } = useLanguage();
  const [shares, setShares] = useState<ShareRecord[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed: ShareRecord[] = JSON.parse(saved);
        return parsed.map((s) => {
          if (s.id === 'PAS-17' && (s.memberName === 'Member PAS-17' || !s.memberName)) {
            return syncShareRecordWithCalendar({
              ...s,
              memberName: 'Md Rabby Sharder',
              sl: '',
              phone: s.phone === '+880 1719-012349' ? '+880 1718-901238' : s.phone || '+880 1718-901238',
            });
          }
          return syncShareRecordWithCalendar(s);
        });
      }
    } catch (e) {
      console.error('Failed to parse saved shares:', e);
    }
    return INITIAL_SHARES.map((s) => syncShareRecordWithCalendar(s));
  });

  const [activeTab, setActiveTab] = useState<'ledger' | 'cards' | 'months' | 'defaulters' | 'members' | 'deeds'>('ledger');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'overdue' | 'paid' | 'closed'>('all');

  // Modals state
  const [isRecordPaymentOpen, setIsRecordPaymentOpen] = useState<boolean>(false);
  const [selectedShareForPayment, setSelectedShareForPayment] = useState<ShareRecord | null>(null);
  const [selectedMonthForPayment, setSelectedMonthForPayment] = useState<MonthKey | undefined>(undefined);

  const [isReceiptOpen, setIsReceiptOpen] = useState<boolean>(false);
  const [selectedShareForReceipt, setSelectedShareForReceipt] = useState<ShareRecord | null>(null);
  const [selectedMonthForReceipt, setSelectedMonthForReceipt] = useState<MonthKey>('Oct-26');

  const [isAddShareOpen, setIsAddShareOpen] = useState<boolean>(false);
  const [isResetConfirmOpen, setIsResetConfirmOpen] = useState<boolean>(false);
  const [selectedMemberForDetail, setSelectedMemberForDetail] = useState<string | null>(null);

  // Month Configuration & Display State
  const [isMonthSettingsOpen, setIsMonthSettingsOpen] = useState<boolean>(false);
  const [allConfiguredMonths, setAllConfiguredMonths] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem('pas_configured_months_v1');
      if (saved) return JSON.parse(saved);
    } catch (e) {}
    return ['Aug-26', 'Sep-26', 'Oct-26', 'Nov-26', 'Dec-26'];
  });

  const [activeMonths, setActiveMonths] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem('pas_active_display_months_v1');
      if (saved) return JSON.parse(saved);
    } catch (e) {}
    return ['Aug-26', 'Sep-26', 'Oct-26', 'Nov-26', 'Dec-26'];
  });

  const [currentMonth, setCurrentMonth] = useState<string>(() => {
    return getCurrentSystemMonthKey();
  });

  // Automatically keep current billing month synced with real-world calendar
  useEffect(() => {
    const live = getCurrentSystemMonthKey();
    setCurrentMonth(live);
    try {
      localStorage.setItem('pas_current_month_v1', live);
    } catch (e) {}

    // Ensure live month is included in configured and active months
    setAllConfiguredMonths((prev) => (prev.includes(live) ? prev : [...prev, live]));
    setActiveMonths((prev) => (prev.includes(live) ? prev : [...prev, live]));
    setShares((prev) => prev.map((s) => syncShareRecordWithCalendar(s, new Date().getDate(), live)));

    const checkMonthRollover = () => {
      const currentLive = getCurrentSystemMonthKey();
      setCurrentMonth((prev) => {
        if (prev !== currentLive) {
          try {
            localStorage.setItem('pas_current_month_v1', currentLive);
          } catch (e) {}
          setAllConfiguredMonths((p) => (p.includes(currentLive) ? p : [...p, currentLive]));
          setActiveMonths((p) => (p.includes(currentLive) ? p : [...p, currentLive]));
          setShares((sprev) => sprev.map((s) => syncShareRecordWithCalendar(s, new Date().getDate(), currentLive)));
          return currentLive;
        }
        return prev;
      });
    };

    window.addEventListener('focus', checkMonthRollover);
    const interval = setInterval(checkMonthRollover, 60000);
    return () => {
      window.removeEventListener('focus', checkMonthRollover);
      clearInterval(interval);
    };
  }, []);

  // Google Sheets Live Sync State
  const [isSyncModalOpen, setIsSyncModalOpen] = useState<boolean>(false);
  const [currentUser, setCurrentUser] = useState<FirebaseUser | null>(null);
  const [connectedSheet, setConnectedSheet] = useState<SheetMetadata | null>(null);
  const [isCloudLive, setIsCloudLive] = useState<boolean>(false);
  const [isSyncing, setIsSyncing] = useState<boolean>(false);
  const [autoSyncEnabled, setAutoSyncEnabled] = useState<boolean>(() => {
    try {
      return localStorage.getItem(AUTO_SYNC_KEY) === 'true';
    } catch {
      return true;
    }
  });
  const [lastSyncedAt, setLastSyncedAt] = useState<Date | null>(null);

  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Sync to localStorage
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(shares));
    } catch (e) {
      console.error('Failed to save to localStorage:', e);
    }
  }, [shares]);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage(null);
    }, 3500);
  };

  // Overall society summary
  const summary: SocietySummary = useMemo(() => {
    return calculateSocietySummary(shares, new Date().getDate(), currentMonth);
  }, [shares, currentMonth]);

  const overdueSharesCount = useMemo(() => {
    return shares.filter((s) => !s.isClosed && s.dueMonths > 0).length;
  }, [shares]);

  // Filtered shares
  const filteredShares = useMemo(() => {
    return shares.filter((s) => {
      // Status filter
      if (statusFilter === 'overdue' && (s.dueMonths === 0 || s.isClosed)) return false;
      if (statusFilter === 'paid' && (s.dueMonths > 0 || s.isClosed)) return false;
      if (statusFilter === 'closed' && !s.isClosed) return false;

      // Search query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const matchesName = s.memberName.toLowerCase().includes(q);
        const matchesId = s.id.toLowerCase().includes(q);
        const matchesPhone = s.phone ? s.phone.toLowerCase().includes(q) : false;
        return matchesName || matchesId || matchesPhone;
      }

      return true;
    });
  }, [shares, statusFilter, searchQuery]);

  const { requireAdmin } = useAuth();

  // Initialize Google Auth Listener
  useEffect(() => {
    const unsubscribe = initAuth(
      (user, token) => {
        setCurrentUser(user);
        // If a sheet ID is saved in localStorage, load its metadata
        const savedSheetId = localStorage.getItem(SHEET_ID_KEY);
        if (savedSheetId) {
          fetchSpreadsheetMetadata(savedSheetId, token)
            .then((meta) => {
              setConnectedSheet(meta);
              setLastSyncedAt(new Date());
            })
            .catch((err) => {
              console.warn('Could not verify saved spreadsheet:', err);
            });
        }
      },
      () => {
        setCurrentUser(null);
      }
    );

    return () => unsubscribe();
  }, []);

  // Migration: Ensure PAS-17 is mapped to Md Rabby Sharder across local state & cloud
  useEffect(() => {
    setShares((prev) => {
      const hasOldPlaceholder = prev.some(
        (s) => s.id === 'PAS-17' && (s.memberName === 'Member PAS-17' || !s.memberName)
      );
      if (!hasOldPlaceholder) return prev;

      const updated = prev.map((s) => {
        if (s.id === 'PAS-17' && (s.memberName === 'Member PAS-17' || !s.memberName)) {
          return syncShareRecordWithCalendar({
            ...s,
            memberName: 'Md Rabby Sharder',
            sl: '',
            phone: s.phone === '+880 1719-012349' ? '+880 1718-901238' : s.phone || '+880 1718-901238',
          });
        }
        return s;
      });

      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
      } catch (e) {}
      saveSocietyDataToCloud({ shares: updated }).catch(console.warn);
      return updated;
    });
  }, []);

  // Connect to Google Cloud Firestore Real-time synchronization
  useEffect(() => {
    const unsubscribe = subscribeToSocietyData(
      (cloudData) => {
        setIsCloudLive(true);
        if (cloudData.shares && Array.isArray(cloudData.shares) && cloudData.shares.length > 0) {
          const normalizedShares = cloudData.shares.map((s) => {
            if (s.id === 'PAS-17' && (s.memberName === 'Member PAS-17' || !s.memberName)) {
              return syncShareRecordWithCalendar({
                ...s,
                memberName: 'Md Rabby Sharder',
                sl: '',
                phone: s.phone === '+880 1719-012349' ? '+880 1718-901238' : s.phone || '+880 1718-901238',
              });
            }
            return syncShareRecordWithCalendar(s);
          });
          setShares(normalizedShares);
          try {
            localStorage.setItem(STORAGE_KEY, JSON.stringify(normalizedShares));
          } catch (e) {}
        }
        if (cloudData.allConfiguredMonths && cloudData.allConfiguredMonths.length > 0) {
          setAllConfiguredMonths(cloudData.allConfiguredMonths);
          try {
            localStorage.setItem('pas_configured_months_v1', JSON.stringify(cloudData.allConfiguredMonths));
          } catch (e) {}
        }
        if (cloudData.activeMonths && cloudData.activeMonths.length > 0) {
          setActiveMonths(cloudData.activeMonths);
          try {
            localStorage.setItem('pas_active_display_months_v1', JSON.stringify(cloudData.activeMonths));
          } catch (e) {}
        }
      },
      (err) => {
        console.warn('[Firestore] Connection warning, continuing in local mode:', err);
        setIsCloudLive(false);
      }
    );

    return () => unsubscribe();
  }, []);

  // Toggle body class when a modal is open so print stylesheet isolates the modal perfectly
  useEffect(() => {
    if (isReceiptOpen || !!selectedMemberForDetail) {
      document.body.classList.add('print-modal-active');
    } else {
      document.body.classList.remove('print-modal-active');
    }
    return () => {
      document.body.classList.remove('print-modal-active');
    };
  }, [isReceiptOpen, selectedMemberForDetail]);

  // Auto-sync trigger on local changes: pushes to Firestore Cloud immediately & Google Sheets if linked
  const triggerAutoSyncIfEnabled = useCallback(
    async (updatedShares: ShareRecord[], newAllMonths?: string[], newActiveMonths?: string[]) => {
      // 1. Instantly save to Cloud Firestore (so all members across Bangladesh see changes within 1 second)
      try {
        await saveSocietyDataToCloud({
          shares: updatedShares,
          allConfiguredMonths: newAllMonths || allConfiguredMonths,
          activeMonths: newActiveMonths || activeMonths,
          currentMonth,
        });
      } catch (cloudErr) {
        console.warn('[Firestore] Auto-save to cloud failed:', cloudErr);
      }

      // 2. Push to Google Sheet if admin has connected a spreadsheet
      if (!autoSyncEnabled || !connectedSheet) return;
      try {
        const token = await getAccessToken();
        if (!token) return;
        setIsSyncing(true);
        const newSummary = calculateSocietySummary(updatedShares);
        await pushToGoogleSheet(
          connectedSheet.id,
          connectedSheet.sheetName,
          updatedShares,
          newSummary,
          token
        );
        setLastSyncedAt(new Date());
      } catch (err) {
        console.warn('Auto-sync to Google Sheet failed:', err);
      } finally {
        setIsSyncing(false);
      }
    },
    [autoSyncEnabled, connectedSheet, allConfiguredMonths, activeMonths, currentMonth]
  );

  // Routing Handlers
  const handleOpenPaymentForShare = (share: ShareRecord, month?: MonthKey) => {
    requireAdmin(() => {
      setSelectedShareForPayment(share);
      if (month) {
        setSelectedMonthForPayment(month);
      } else if (share.dueMonths > 0) {
        const firstDue = (['Aug-26', 'Sep-26', 'Oct-26', 'Nov-26', 'Dec-26'] as MonthKey[]).find(
          (m) => share.months[m]?.status === 'due'
        );
        setSelectedMonthForPayment(firstDue || 'Sep-26');
      } else {
        const firstUpcoming = (['Aug-26', 'Sep-26', 'Oct-26', 'Nov-26', 'Dec-26'] as MonthKey[]).find(
          (m) => share.months[m]?.status === 'upcoming'
        );
        setSelectedMonthForPayment(firstUpcoming || 'Nov-26');
      }
      setIsRecordPaymentOpen(true);
    }, 'record or edit payment entries');
  };

  const handleOpenReceiptForShare = (share: ShareRecord, month?: MonthKey) => {
    let targetMonth = month || currentMonth;
    if (share.months[targetMonth]?.status !== 'paid') {
      const lastPaid = (['Dec-26', 'Nov-26', 'Oct-26', 'Sep-26', 'Aug-26'] as MonthKey[]).find(
        (m) => share.months[m]?.status === 'paid'
      );
      if (lastPaid) targetMonth = lastPaid;
    }
    setSelectedShareForReceipt(share);
    setSelectedMonthForReceipt(targetMonth);
    setIsReceiptOpen(true);
  };

  // Google Auth Handlers
  const handleGoogleSignIn = async () => {
    try {
      const res = await googleSignIn();
      if (res) {
        setCurrentUser(res.user);
        showToast(`Signed in with Google as ${res.user.email}`);

        // Try restoring saved sheet if present
        const savedSheetId = localStorage.getItem(SHEET_ID_KEY);
        if (savedSheetId) {
          const meta = await fetchSpreadsheetMetadata(savedSheetId, res.accessToken);
          setConnectedSheet(meta);
          setLastSyncedAt(new Date());
        }
      }
    } catch (err: any) {
      showToast(err?.message ? `Google Sign-in: ${err.message}` : 'Google Sign-in: Authentication cancelled');
    }
  };

  const handleGoogleSignOut = async () => {
    try {
      await logout();
      setCurrentUser(null);
      showToast('Signed out of Google account.');
    } catch (err: any) {
      showToast(`Sign out error: ${err?.message}`);
    }
  };

  // Google Sheets Management
  const handleLinkExistingSheet = async (input: string) => {
    const token = await getAccessToken();
    if (!token) throw new Error('Please sign in with Google first.');

    const id = extractSpreadsheetId(input);
    if (!id) throw new Error('Please enter a valid Google Sheet URL or ID.');

    const meta = await fetchSpreadsheetMetadata(id, token);
    setConnectedSheet(meta);
    localStorage.setItem(SHEET_ID_KEY, meta.id);
    setLastSyncedAt(new Date());
    showToast(`Linked with Google Sheet: "${meta.title}"!`);
  };

  const handleCreateNewSheet = async () => {
    const token = await getAccessToken();
    if (!token) throw new Error('Please sign in with Google first.');

    const meta = await createGoogleSpreadsheet(
      'Progressive Association Society - Member Ledger (2026-27)',
      shares,
      summary,
      token
    );

    setConnectedSheet(meta);
    localStorage.setItem(SHEET_ID_KEY, meta.id);
    setLastSyncedAt(new Date());
    showToast(`Created & linked new Google Sheet: "${meta.title}"!`);
  };

  const handlePushToSheet = async () => {
    if (!connectedSheet) throw new Error('No Google Sheet linked.');
    const token = await getAccessToken();
    if (!token) throw new Error('Please sign in with Google first.');

    setIsSyncing(true);
    try {
      await pushToGoogleSheet(connectedSheet.id, connectedSheet.sheetName, shares, summary, token);
      try {
        await applySheetStyling(connectedSheet.id, connectedSheet.sheetId, shares, token);
      } catch (styleErr) {
        console.warn('Styling update warning:', styleErr);
      }
      setLastSyncedAt(new Date());
      showToast(`Successfully pushed ${shares.length} shares to "${connectedSheet.title}"!`);
    } finally {
      setIsSyncing(false);
    }
  };

  const handlePullFromSheet = async () => {
    if (!connectedSheet) throw new Error('No Google Sheet linked.');
    const token = await getAccessToken();
    if (!token) throw new Error('Please sign in with Google first.');

    setIsSyncing(true);
    try {
      const importedShares = await pullFromGoogleSheet(
        connectedSheet.id,
        connectedSheet.sheetName,
        token
      );
      setShares(importedShares);
      setLastSyncedAt(new Date());
      showToast(`Updated ${importedShares.length} shares from Google Sheet!`);
    } finally {
      setIsSyncing(false);
    }
  };

  const handleToggleAutoSync = (enabled: boolean) => {
    setAutoSyncEnabled(enabled);
    localStorage.setItem(AUTO_SYNC_KEY, enabled.toString());
    showToast(enabled ? 'Automatic Google Sheet sync enabled.' : 'Auto-sync paused.');
  };

  const handleDisconnectSheet = () => {
    localStorage.removeItem(SHEET_ID_KEY);
    setConnectedSheet(null);
    showToast('Google Sheet unlinked from dashboard.');
  };

  // Payment Handlers
  const handleSavePayment = ({
    shareId,
    month,
    months,
    amount,
    lateFeeAmount,
    date,
    paymentMethod,
    includeLateFee,
    notes,
  }: {
    shareId: string;
    month?: MonthKey;
    months?: MonthKey[];
    amount: number;
    lateFeeAmount?: number;
    date: string;
    paymentMethod: string;
    includeLateFee: boolean;
    notes?: string;
  }) => {
    const targetMonths: MonthKey[] = months && months.length > 0
      ? months
      : month
      ? [month]
      : ['Oct-26'];

    const updated = shares.map((s) => {
      if (s.id !== shareId) return s;

      const updatedMonths = { ...s.months };

      for (const m of targetMonths) {
        updatedMonths[m] = {
          status: 'paid' as const,
          date,
          amount: 2800,
          paymentMethod,
          notes,
        };
      }

      const lateFeeToAdd = includeLateFee
        ? (lateFeeAmount !== undefined ? lateFeeAmount : s.lateFee)
        : 0;

      const updatedShare: ShareRecord = {
        ...s,
        months: updatedMonths,
        lateFeePaid: s.lateFeePaid + lateFeeToAdd,
      };

      return calculateShareRecord(updatedShare);
    });

    setShares(updated);
    showToast(
      `Payment of Tk. ${amount.toLocaleString('en-IN')} recorded for ${shareId} (${targetMonths.join(', ')})!`
    );
    triggerAutoSyncIfEnabled(updated);
  };

  const executeClearFullDue = (shareId: string, waiveLateFee: boolean) => {
    const today = new Date();
    const dd = String(today.getDate()).padStart(2, '0');
    const mm = String(today.getMonth() + 1).padStart(2, '0');
    const yy = String(today.getFullYear()).slice(-2);
    const todayFormatted = `${dd}.${mm}.${yy}`;

    const updated = shares.map((s) => {
      if (s.id !== shareId) return s;

      const updatedMonths = { ...s.months };
      for (const m of Object.keys(updatedMonths)) {
        if (updatedMonths[m]?.status === 'due') {
          updatedMonths[m] = {
            status: 'paid',
            date: todayFormatted,
            amount: 2800,
            paymentMethod: 'Bank Deposit',
          };
        }
      }

      const lateFeePaid = waiveLateFee ? 0 : s.lateFee;

      return calculateShareRecord({
        ...s,
        months: updatedMonths,
        lateFeePaid,
      });
    });

    setShares(updated);
    showToast(
      waiveLateFee
        ? `Full dues cleared for ${shareId} with late fee waived.`
        : `Full dues & late fee cleared for ${shareId}.`
    );
    triggerAutoSyncIfEnabled(updated);
  };

  const handleClearFullDue = (shareId: string, waiveLateFee: boolean) => {
    requireAdmin(() => {
      executeClearFullDue(shareId, waiveLateFee);
    }, 'clear outstanding dues');
  };

  const handleAddShare = (newShare: ShareRecord) => {
    requireAdmin(() => {
      const updated = [...shares, newShare];
      setShares(updated);
      showToast(`Share ${newShare.id} registered successfully for ${newShare.memberName}!`);
      triggerAutoSyncIfEnabled(updated);
    }, 'add a new share');
  };

  const handleRevertPayment = (
    shareId: string,
    month: MonthKey,
    targetStatus?: 'due' | 'upcoming'
  ) => {
    requireAdmin(() => {
      // Intelligently determine if month is in the past (< currentMonth) or upcoming (>= currentMonth)
      const allChronological = [...allConfiguredMonths];
      const curIdx = allChronological.indexOf(currentMonth);
      const targetIdx = allChronological.indexOf(month);
      const isPast = curIdx !== -1 && targetIdx !== -1 ? targetIdx < curIdx : false;

      const defaultStatus: 'due' | 'upcoming' =
        targetStatus || (isPast ? 'due' : 'upcoming');

      const updated = shares.map((s) => {
        if (s.id !== shareId) return s;

        const updatedMonths = {
          ...s.months,
          [month]: {
            status: defaultStatus,
            amount: 2800,
          },
        };

        return calculateShareRecord({
          ...s,
          months: updatedMonths,
          lateFeePaid: Math.max(0, (s.lateFeePaid || 0) - 280),
        });
      });

      setShares(updated);
      showToast(
        defaultStatus === 'due'
          ? `Payment for ${shareId} (${month}) reverted to Overdue (Due).`
          : `Payment entry for ${shareId} (${month}) has been deleted.`
      );
      triggerAutoSyncIfEnabled(updated);
    }, 'delete or revert payment entry');
  };

  const handleDeleteShare = (shareId: string) => {
    requireAdmin(() => {
      const updated = shares.filter((s) => s.id !== shareId);
      setShares(updated);
      showToast(`Share ${shareId} deleted from register.`);
      triggerAutoSyncIfEnabled(updated);
    }, 'delete share from register');
  };

  const handleUpdateMemberDetails = ({
    oldName,
    newName,
    phone,
    address,
    nid,
  }: {
    oldName: string;
    newName: string;
    phone: string;
    address: string;
    nid: string;
  }) => {
    requireAdmin(() => {
      const trimmedOld = oldName.trim();
      const trimmedNew = newName.trim() || trimmedOld;

      const updated = shares.map((s) => {
        if (s.memberName?.trim() === trimmedOld) {
          return {
            ...s,
            memberName: trimmedNew,
            phone: phone.trim(),
            address: address.trim(),
            nid: nid.trim(),
          };
        }
        return s;
      });

      setShares(updated);
      showToast(`Updated member directory profile for "${trimmedNew}"!`);
      triggerAutoSyncIfEnabled(updated);
    }, 'edit member directory profile');
  };

  // Month Configuration Handlers
  const handleToggleMonthVisibility = (month: string) => {
    setActiveMonths((prev) => {
      if (prev.includes(month)) {
        if (prev.length <= 1) {
          showToast('At least one month must remain visible on the table.');
          return prev;
        }
        return prev.filter((m) => m !== month);
      } else {
        return allConfiguredMonths.filter((m) => m === month || prev.includes(m));
      }
    });
  };

  const handleShowOnlyCurrentMonth = (month: string) => {
    setActiveMonths([month]);
    showToast(`Display focused on current month "${month}". Other months hidden.`);
  };

  const handleShowAllMonths = () => {
    setActiveMonths([...allConfiguredMonths]);
    showToast('Displaying all configured months.');
  };

  const handleAddMonth = (monthKey: string) => {
    requireAdmin(() => {
      if (allConfiguredMonths.includes(monthKey)) return;

      const nextMonths = [...allConfiguredMonths, monthKey];
      setAllConfiguredMonths(nextMonths);
      setActiveMonths([...activeMonths, monthKey]);

      // Initialize the month across all shares as 'upcoming'
      const updated = shares.map((s) => {
        if (s.months[monthKey]) return s;
        return calculateShareRecord({
          ...s,
          months: {
            ...s.months,
            [monthKey]: {
              status: 'upcoming',
              amount: 2800,
            },
          },
        });
      });

      setShares(updated);
      showToast(`Added new billing month "${monthKey}" to the society register!`);
      triggerAutoSyncIfEnabled(updated);
    }, `add month "${monthKey}"`);
  };

  const handleRemoveMonth = (monthKey: string) => {
    requireAdmin(() => {
      const nextMonths = allConfiguredMonths.filter((m) => m !== monthKey);
      setAllConfiguredMonths(nextMonths);
      setActiveMonths((prev) => prev.filter((m) => m !== monthKey));
      if (currentMonth === monthKey && nextMonths.length > 0) {
        setCurrentMonth(nextMonths[0]);
      }

      // Remove the month key from all shares
      const updated = shares.map((s) => {
        const copyMonths = { ...s.months };
        delete copyMonths[monthKey];
        return calculateShareRecord({
          ...s,
          months: copyMonths,
        });
      });

      setShares(updated);
      showToast(`Removed month "${monthKey}" from register.`);
      triggerAutoSyncIfEnabled(updated);
    }, `remove month "${monthKey}"`);
  };

  const handleChangeCurrentMonth = (monthKey: string) => {
    setCurrentMonth(monthKey);
    showToast(`Active focused billing month set to "${monthKey}".`);
  };

  const handleConfirmReset = () => {
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch (e) {
      console.error(e);
    }
    setShares(INITIAL_SHARES);
    saveSocietyDataToCloud({ shares: INITIAL_SHARES }).catch(console.warn);
    setIsResetConfirmOpen(false);
    showToast('Data reset back to original Progressive Association Society Excel ledger.');
  };

  const handleExportCSV = () => {
    const escapeCsv = (val: unknown): string => {
      if (val === undefined || val === null) return '';
      const str = String(val);
      if (str.includes(',') || str.includes('"') || str.includes('\n') || str.includes('\r')) {
        return `"${str.replace(/"/g, '""')}"`;
      }
      return str;
    };

    // Organized, self-describing column headers (Row 1)
    const monthHeaders = activeMonths.flatMap((m) => [`${m} Date`, `${m} Amount (Tk)`]);
    const headers = [
      'SL',
      'Member Name',
      'Share ID',
      'Phone Number',
      'Admission Fee (Tk)',
      ...monthHeaders,
      'Total Deposit (Tk)',
      'Due Months',
      'Due Principal (Tk)',
      'Late Fee (Tk)',
      'Total Due (Tk)',
      'Late Fee Paid (Tk)',
      'Account Status',
    ];

    const rows: (string | number)[][] = [];

    // Data rows (Row 2 to N+1)
    for (const s of shares) {
      const monthCols: (string | number)[] = [];
      for (const m of activeMonths) {
        const monthData = s.months[m];
        if (monthData?.status === 'paid') {
          monthCols.push(monthData.date || 'Paid');
          monthCols.push(monthData.amount);
        } else if (monthData?.status === 'due') {
          monthCols.push('Due');
          monthCols.push(0);
        } else {
          monthCols.push('Upcoming');
          monthCols.push(0);
        }
      }

      rows.push([
        s.sl || '',
        s.memberName,
        s.id,
        s.phone || '',
        s.admissionFee,
        ...monthCols,
        s.totalDeposit,
        s.dueMonths,
        s.dueAmount,
        s.lateFee,
        s.totalDue,
        s.lateFeePaid,
        s.isClosed ? 'Closed' : s.dueMonths > 0 ? 'Overdue' : 'Active',
      ]);
    }

    // Grand total summary row matching the exact rectangular column structure
    const totalMonthCols: (string | number)[] = [];
    for (const m of activeMonths) {
      const stat = summary.monthStats?.[m];
      totalMonthCols.push(stat?.paidShares ? `${stat.paidShares} Paid` : '0 Paid');
      totalMonthCols.push(stat?.paidAmount || 0);
    }

    const grandTotalRow: (string | number)[] = [
      '',
      'GRAND TOTAL',
      `${summary.totalActiveShares} Active Shares`,
      '',
      summary.totalAdmissionCollected,
      ...totalMonthCols,
      summary.totalBankDeposit,
      summary.totalDueMonths,
      summary.totalDuePrincipal,
      summary.totalLateFeeDue,
      summary.totalOutstandingDue,
      summary.totalLateFeeCollected,
      `Active: ${summary.totalActiveShares} | Due Months: ${summary.totalDueMonths}`,
    ];

    // Build standard CSV with UTF-8 Byte Order Mark (BOM) for Excel
    const allLines = [
      headers.map(escapeCsv).join(','),
      ...rows.map((r) => r.map(escapeCsv).join(',')),
      grandTotalRow.map(escapeCsv).join(','),
    ];
    const csvContent = '\uFEFF' + allLines.join('\r\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `PAS_Fund_Collection_Ledger_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handlePrint = () => {
    if (activeTab !== 'ledger') {
      setActiveTab('ledger');
      setTimeout(() => {
        window.print();
      }, 150);
    } else {
      window.print();
    }
  };

  const handleExportJSON = () => {
    const backup = {
      society: 'Progressive Association Society',
      version: '1.0',
      exportTimestamp: new Date().toISOString(),
      totalShares: shares.length,
      shares,
    };
    const blob = new Blob([JSON.stringify(backup, null, 2)], { type: 'application/json;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `PAS_Society_Backup_${new Date().toISOString().slice(0, 10)}.json`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showToast('Offline JSON backup exported successfully!');
  };

  const handleImportJSON = (file: File) => {
    requireAdmin(() => {
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const content = e.target?.result as string;
          const parsed = JSON.parse(content);
          if (!parsed.shares || !Array.isArray(parsed.shares)) {
            throw new Error('Invalid JSON backup file: shares data missing.');
          }
          const restoredShares = parsed.shares.map((s: ShareRecord) =>
            calculateShareRecord(s, new Date().getDate(), currentMonth)
          );
          setShares(restoredShares);
          localStorage.setItem(STORAGE_KEY, JSON.stringify(restoredShares));
          saveSocietyDataToCloud({ shares: restoredShares }).catch(console.warn);
          showToast(`Successfully restored ${restoredShares.length} shares from JSON backup!`);
        } catch (err: any) {
          alert('Failed to import JSON backup: ' + (err?.message || 'Unknown error'));
        }
      };
      reader.readAsText(file);
    }, 'restore data from JSON backup');
  };

  return (
    <div className="min-h-screen bg-slate-100/70 text-slate-900 font-sans antialiased selection:bg-emerald-500 selection:text-white">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-5 right-5 z-50 bg-slate-900 text-white px-4 py-3 rounded-xl shadow-xl flex items-center gap-2.5 border border-slate-700 animate-in fade-in slide-in-from-bottom-3 duration-200 motion-reduce:animate-none">
          <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
          <span className="text-xs sm:text-sm font-medium">{toastMessage}</span>
          <button
            onClick={() => setToastMessage(null)}
            className="ml-2 text-slate-400 hover:text-white"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Main Navbar */}
      <Navbar
        onOpenRecordPayment={() => handleOpenPaymentForShare(shares[0])}
        onOpenAddShare={() => requireAdmin(() => setIsAddShareOpen(true), 'add a new share')}
        onExportCSV={() => requireAdmin(handleExportCSV, 'export ledger to CSV')}
        onExportJSON={() => requireAdmin(handleExportJSON, 'export JSON backup')}
        onImportJSON={handleImportJSON}
        onPrint={handlePrint}
        onResetData={() => requireAdmin(() => setIsResetConfirmOpen(true), 'reset ledger data')}
        isSheetConnected={!!connectedSheet}
        isSyncing={isSyncing}
        sheetTitle={connectedSheet?.title}
        onOpenSyncModal={() => requireAdmin(() => setIsSyncModalOpen(true), 'sync with Google Sheets')}
        isCloudLive={isCloudLive}
      />

      {/* Main Container */}
      <main className="w-full px-3 sm:px-6 lg:px-8 xl:px-10 py-3.5 sm:py-6 space-y-4 sm:space-y-6">
        {/* Official Printable Statement Letterhead (Visible on print / PDF only) */}
        <div className="hidden print:block mb-4 pb-3 border-b-2 border-slate-800 font-sans">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-xl font-black text-slate-900 tracking-tight">
                Progressive Association Society
              </h1>
              <p className="text-xs font-semibold text-slate-700 mt-1">
                Official Share & Installment Ledger Statement (কেন্দ্রীয় হিসাব ও কিস্তি লেজার)
              </p>
              <p className="text-[10px] text-slate-500">
                Estd 2026, Registered Co-operative Society, 5-Year Land Investment Project
              </p>
            </div>
            <div className="text-right text-[10px] text-slate-700 space-y-0.5">
              <div>Print Date: <span className="font-mono font-bold">{new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}</span></div>
              <div>Billing Months: <span className="font-mono font-bold">{activeMonths.join(', ')}</span></div>
              <div>Report Type: <strong className="text-emerald-800 font-bold">Verified Society Master Ledger</strong></div>
            </div>
          </div>
        </div>

        {/* KPI Summary Cards */}
        <SummaryCards
          summary={summary}
          onFilterOverdue={() => {
            setActiveTab('defaulters');
          }}
          onFilterAll={() => {
            setStatusFilter('all');
            setActiveTab('ledger');
          }}
        />

        {/* View Switcher & Filter Bar */}
        <div className="bg-white rounded-xl border border-slate-200 p-2 sm:p-3 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-2.5 sm:gap-3 print:hidden">
          {/* Segmented View Tabs - Horizontal Swipe on Mobile */}
          <div className="flex items-center overflow-x-auto [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden flex-nowrap sm:flex-wrap gap-1 bg-slate-100/90 p-1 rounded-xl border border-slate-200/80 shadow-2xs w-full md:w-auto shrink-0">
            <button
              onClick={() => setActiveTab('ledger')}
              className={`shrink-0 whitespace-nowrap px-3 sm:px-3.5 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-colors duration-150 cursor-pointer focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:outline-none active:scale-95 ${
                activeTab === 'ledger'
                  ? 'bg-emerald-600 text-white shadow-xs ring-1 ring-emerald-700/40'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-white/60'
              }`}
            >
              <FileSpreadsheet className={`w-3.5 h-3.5 ${activeTab === 'ledger' ? 'text-white' : 'text-emerald-600'}`} />
              <span>{t('tabMasterLedger')}</span>
            </button>

            <button
              onClick={() => setActiveTab('cards')}
              className={`shrink-0 whitespace-nowrap px-3 sm:px-3.5 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-colors duration-150 cursor-pointer focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:outline-none active:scale-95 ${
                activeTab === 'cards'
                  ? 'bg-blue-600 text-white shadow-xs ring-1 ring-blue-700/40'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-white/60'
              }`}
            >
              <Users className={`w-3.5 h-3.5 ${activeTab === 'cards' ? 'text-white' : 'text-blue-600'}`} />
              <span>{t('tabMemberCards')}</span>
            </button>

            <button
              onClick={() => setActiveTab('months')}
              className={`shrink-0 whitespace-nowrap px-3 sm:px-3.5 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-colors duration-150 cursor-pointer focus-visible:ring-2 focus-visible:ring-teal-500 focus-visible:outline-none active:scale-95 ${
                activeTab === 'months'
                  ? 'bg-teal-600 text-white shadow-xs ring-1 ring-teal-700/40'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-white/60'
              }`}
            >
              <CalendarDays className={`w-3.5 h-3.5 ${activeTab === 'months' ? 'text-white' : 'text-teal-600'}`} />
              <span>{t('tabMonthBreakdown')}</span>
            </button>

            <button
              onClick={() => setActiveTab('defaulters')}
              className={`shrink-0 whitespace-nowrap px-3 sm:px-3.5 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-colors duration-150 cursor-pointer focus-visible:ring-2 focus-visible:ring-rose-500 focus-visible:outline-none active:scale-95 ${
                activeTab === 'defaulters'
                  ? 'bg-rose-600 text-white shadow-xs ring-1 ring-rose-700/40'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-white/60'
              }`}
            >
              <AlertTriangle className={`w-3.5 h-3.5 ${activeTab === 'defaulters' ? 'text-white' : 'text-rose-600'}`} />
              <span>{t('tabOverdue')}</span>
              <span className={`px-1.5 py-0.2 rounded-full text-[10px] font-mono font-bold ${
                activeTab === 'defaulters' ? 'bg-rose-800 text-white' : 'bg-rose-100 text-rose-700'
              }`}>
                {overdueSharesCount > 0 ? `${overdueSharesCount}` : '0'}
              </span>
            </button>

            <button
              onClick={() => setActiveTab('members')}
              className={`shrink-0 whitespace-nowrap px-3 sm:px-3.5 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-colors duration-150 cursor-pointer focus-visible:ring-2 focus-visible:ring-slate-500 focus-visible:outline-none active:scale-95 ${
                activeTab === 'members'
                  ? 'bg-slate-900 text-white shadow-xs ring-1 ring-slate-950'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-white/60'
              }`}
            >
              <Contact className={`w-3.5 h-3.5 ${activeTab === 'members' ? 'text-emerald-400' : 'text-slate-700'}`} />
              <span>{t('tabMembersDirectory')}</span>
            </button>

            <button
              onClick={() => setActiveTab('deeds')}
              className={`shrink-0 whitespace-nowrap px-3 sm:px-3.5 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-colors duration-150 cursor-pointer focus-visible:ring-2 focus-visible:ring-amber-500 focus-visible:outline-none active:scale-95 ${
                activeTab === 'deeds'
                  ? 'bg-amber-600 text-white shadow-xs ring-1 ring-amber-700/40'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-white/60'
              }`}
            >
              <Scale className={`w-3.5 h-3.5 ${activeTab === 'deeds' ? 'text-white' : 'text-amber-600'}`} />
              <span>{t('tabLandDeeds')}</span>
              <span className={`px-1.5 py-0.2 rounded-full text-[10px] font-mono font-bold ${
                activeTab === 'deeds' ? 'bg-amber-800 text-white' : 'bg-amber-100 text-amber-800'
              }`}>
                {language === 'bn' ? 'অফিসিয়াল' : 'Official'}
              </span>
            </button>
          </div>

          {/* Search & Status Filters */}
          {(activeTab === 'ledger' || activeTab === 'cards') && (
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 w-full md:w-auto">
              {/* Status chips */}
              <div className="flex items-center gap-1 text-xs overflow-x-auto [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden flex-nowrap shrink-0">
                <button
                  onClick={() => setStatusFilter('all')}
                  className={`shrink-0 px-2.5 py-1 rounded-lg font-bold cursor-pointer transition-colors duration-150 ${
                    statusFilter === 'all'
                      ? 'bg-slate-900 text-white shadow-2xs'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  {t('filterAll')} ({shares.length})
                </button>
                <button
                  onClick={() => setStatusFilter('overdue')}
                  className={`shrink-0 px-2.5 py-1 rounded-lg font-bold cursor-pointer transition-colors duration-150 ${
                    statusFilter === 'overdue'
                      ? 'bg-rose-600 text-white shadow-2xs'
                      : 'bg-rose-50 text-rose-700 hover:bg-rose-100'
                  }`}
                >
                  {t('filterDue')} ({shares.filter((s) => !s.isClosed && s.dueMonths > 0).length})
                </button>
                <button
                  onClick={() => setStatusFilter('paid')}
                  className={`shrink-0 px-2.5 py-1 rounded-lg font-bold cursor-pointer transition-colors duration-150 ${
                    statusFilter === 'paid'
                      ? 'bg-emerald-600 text-white shadow-2xs'
                      : 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100'
                  }`}
                >
                  {t('filterPaid')} ({shares.filter((s) => !s.isClosed && s.dueMonths === 0).length})
                </button>
                <button
                  onClick={() => setStatusFilter('closed')}
                  className={`shrink-0 px-2.5 py-1 rounded-lg font-bold cursor-pointer transition-colors duration-150 ${
                    statusFilter === 'closed'
                      ? 'bg-slate-700 text-white shadow-2xs'
                      : 'bg-slate-100 text-slate-500 hover:bg-slate-200'
                  }`}
                >
                  {t('filterClosed')} ({shares.filter((s) => s.isClosed).length})
                </button>
              </div>

              {/* Search input */}
              <div className="relative flex-1 sm:w-48 md:w-56">
                <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-slate-400" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder={t('searchPlaceholder')}
                  className="w-full pl-8 pr-7 py-1.5 text-xs rounded-xl border border-slate-300 focus:outline-emerald-500 focus:ring-2 focus:ring-emerald-500/20 bg-white shadow-2xs"
                />
                {searchQuery && (
                  <button
                    onClick={() => setSearchQuery('')}
                    className="absolute right-2.5 top-2 text-slate-400 hover:text-slate-600 cursor-pointer"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Tab View Content */}
        {activeTab === 'ledger' && (
          <MasterLedgerTable
            shares={filteredShares}
            summary={summary}
            onOpenPaymentForShare={handleOpenPaymentForShare}
            onOpenReceiptForShare={handleOpenReceiptForShare}
            onSelectMember={(name) => {
              setSelectedMemberForDetail(name);
            }}
            onDeleteShare={handleDeleteShare}
            allConfiguredMonths={allConfiguredMonths}
            activeMonths={activeMonths}
            currentMonth={currentMonth}
            onOpenMonthSettings={() => setIsMonthSettingsOpen(true)}
          />
        )}

        {activeTab === 'cards' && (
          <MemberCardsView
            shares={filteredShares}
            onOpenPaymentForShare={handleOpenPaymentForShare}
            onOpenReceiptForShare={handleOpenReceiptForShare}
            onSelectMember={(name) => {
              setSelectedMemberForDetail(name);
            }}
          />
        )}

        {activeTab === 'months' && (
          <MonthReconciliationView
            shares={shares}
            summary={summary}
            currentMonth={currentMonth}
            onOpenPaymentForShare={handleOpenPaymentForShare}
            onOpenReceiptForShare={handleOpenReceiptForShare}
          />
        )}

        {activeTab === 'defaulters' && (
          <OverdueRemindersView
            shares={shares}
            onOpenPaymentForShare={handleOpenPaymentForShare}
            onClearFullDue={handleClearFullDue}
          />
        )}

        {activeTab === 'members' && (
          <MembersDirectoryView
            shares={shares}
            onSelectMember={(name) => {
              setSelectedMemberForDetail(name);
            }}
            onOpenPaymentForShare={handleOpenPaymentForShare}
            onOpenReceiptForShare={handleOpenReceiptForShare}
            onUpdateMemberDetails={handleUpdateMemberDetails}
          />
        )}

        {activeTab === 'deeds' && (
          <LandDocumentsView />
        )}
      </main>

      {/* Official System Footer with Developer Credit */}
      <footer className="w-full border-t border-slate-200/90 dark:border-slate-800 bg-white/95 dark:bg-slate-900/95 py-4 px-4 sm:px-8 text-center text-xs text-slate-500 dark:text-slate-400 print:hidden mt-8">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-2 max-w-7xl mx-auto">
          <span className="font-semibold text-slate-700 dark:text-slate-300">
            Progressive Association Society (PAS) © 2026
          </span>
          <div className="flex items-center gap-1.5">
            <span>Developed by</span>
            <a
              href="https://www.facebook.com/adu77"
              target="_blank"
              rel="noopener noreferrer"
              className="font-bold text-emerald-600 dark:text-emerald-400 hover:text-emerald-500 dark:hover:text-emerald-300 underline underline-offset-2 transition-colors cursor-pointer"
            >
              Adnan Taher
            </a>
          </div>
        </div>
      </footer>

      {/* Record Payment Modal */}
      <RecordPaymentModal
        isOpen={isRecordPaymentOpen}
        onClose={() => setIsRecordPaymentOpen(false)}
        shares={shares}
        initialShare={selectedShareForPayment}
        initialMonth={selectedMonthForPayment}
        currentMonth={currentMonth}
        onSavePayment={handleSavePayment}
        onRevertPayment={handleRevertPayment}
      />

      {/* Official Money Receipt Modal */}
      <MoneyReceiptModal
        isOpen={isReceiptOpen}
        onClose={() => setIsReceiptOpen(false)}
        share={selectedShareForReceipt}
        month={selectedMonthForReceipt}
        onVoidPayment={(shareId, month, status) => handleRevertPayment(shareId, month, status)}
        onEditPayment={(share, month) => handleOpenPaymentForShare(share, month)}
      />

      {/* Add Share Modal */}
      <AddMemberModal
        isOpen={isAddShareOpen}
        onClose={() => setIsAddShareOpen(false)}
        shares={shares}
        onAddShare={handleAddShare}
      />

      {/* Member Details Portfolio Modal */}
      <MemberDetailModal
        isOpen={!!selectedMemberForDetail}
        onClose={() => setSelectedMemberForDetail(null)}
        memberName={selectedMemberForDetail}
        shares={shares}
        onOpenPaymentForShare={(share, month) => {
          setSelectedMemberForDetail(null);
          handleOpenPaymentForShare(share, month);
        }}
        onOpenReceiptForShare={(share, month) => {
          handleOpenReceiptForShare(share, month);
        }}
        onDeleteShare={handleDeleteShare}
        onUpdateMemberDetails={handleUpdateMemberDetails}
      />

      {/* Reset Confirmation Modal */}
      {isResetConfirmOpen && (
        <div
          onClick={(e) => {
            if (e.target === e.currentTarget) setIsResetConfirmOpen(false);
          }}
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/75"
        >
          <div className="relative w-full max-w-md bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden p-6 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-full bg-rose-100 text-rose-700 flex items-center justify-center shrink-0">
                <AlertTriangle className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-bold text-slate-900 text-base">Reset Ledger Data?</h3>
                <p className="text-xs text-slate-500">Restore original Excel spreadsheet values</p>
              </div>
            </div>
            <p className="text-xs text-slate-600 leading-relaxed mb-6">
              This will restore the entire society register back to the original Excel dashboard values (30 active shares, Tk. 3,95,200 deposited, Tk. 17,640 due).
            </p>
            <div className="flex items-center justify-end gap-2.5">
              <button
                type="button"
                onClick={() => setIsResetConfirmOpen(false)}
                className="px-4 py-2 rounded-lg border border-slate-300 hover:bg-slate-100 text-slate-700 font-medium text-xs transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmReset}
                className="px-4 py-2 rounded-lg bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs shadow-xs transition-colors cursor-pointer"
              >
                Yes, Reset Data
              </button>
            </div>
          </div>
        </div>
      )}
      {/* Google Sheet Live Two-Way Sync Modal */}
      <GoogleSheetSyncModal
        isOpen={isSyncModalOpen}
        onClose={() => setIsSyncModalOpen(false)}
        currentUser={currentUser}
        connectedSheet={connectedSheet}
        isSyncing={isSyncing}
        autoSyncEnabled={autoSyncEnabled}
        lastSyncedAt={lastSyncedAt}
        onSignIn={handleGoogleSignIn}
        onSignOut={handleGoogleSignOut}
        onLinkExistingSheet={handleLinkExistingSheet}
        onCreateNewSheet={handleCreateNewSheet}
        onPullFromSheet={handlePullFromSheet}
        onPushToSheet={handlePushToSheet}
        onToggleAutoSync={handleToggleAutoSync}
        onDisconnectSheet={handleDisconnectSheet}
      />

      {/* Admin Login Modal */}
      <AdminLoginModal />

      {/* Month Display & Settings Modal */}
      <MonthSettingsModal
        isOpen={isMonthSettingsOpen}
        onClose={() => setIsMonthSettingsOpen(false)}
        allConfiguredMonths={allConfiguredMonths}
        activeMonths={activeMonths}
        currentMonth={currentMonth}
        onToggleMonthVisibility={handleToggleMonthVisibility}
        onShowOnlyCurrentMonth={handleShowOnlyCurrentMonth}
        onShowAllMonths={handleShowAllMonths}
        onAddMonth={handleAddMonth}
        onRemoveMonth={handleRemoveMonth}
        onChangeCurrentMonth={handleChangeCurrentMonth}
      />

      {/* Real-Time Executive Current Month Action Hub (Bottom-Left Floating Pill) */}
      <CurrentMonthFloatingTracker
        shares={shares}
        currentMonth={currentMonth}
        onOpenPaymentForShare={handleOpenPaymentForShare}
        onOpenReceiptForShare={handleOpenReceiptForShare}
      />
    </div>
  );
}
