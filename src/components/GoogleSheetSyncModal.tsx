import React, { useState, useRef } from 'react';
import { User as FirebaseUser } from 'firebase/auth';
import { SheetMetadata, extractSpreadsheetId } from '../services/googleSheets';
import { useLanguage } from '../context/LanguageContext';
import {
  X,
  FileSpreadsheet,
  RefreshCw,
  UploadCloud,
  DownloadCloud,
  ExternalLink,
  CheckCircle2,
  AlertTriangle,
  LogOut,
  Plus,
  Link,
  ShieldCheck,
  ClipboardPaste,
} from 'lucide-react';

interface GoogleSheetSyncModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser: FirebaseUser | null;
  connectedSheet: SheetMetadata | null;
  isSyncing: boolean;
  autoSyncEnabled: boolean;
  lastSyncedAt: Date | null;
  onSignIn: () => Promise<void>;
  onSignOut: () => Promise<void>;
  onLinkExistingSheet: (sheetIdOrUrl: string) => Promise<void>;
  onCreateNewSheet: () => Promise<void>;
  onPullFromSheet: () => Promise<void>;
  onPushToSheet: () => Promise<void>;
  onToggleAutoSync: (enabled: boolean) => void;
  onDisconnectSheet: () => void;
}

export const GoogleSheetSyncModal: React.FC<GoogleSheetSyncModalProps> = ({
  isOpen,
  onClose,
  currentUser,
  connectedSheet,
  isSyncing,
  autoSyncEnabled,
  lastSyncedAt,
  onSignIn,
  onSignOut,
  onLinkExistingSheet,
  onCreateNewSheet,
  onPullFromSheet,
  onPushToSheet,
  onToggleAutoSync,
  onDisconnectSheet,
}) => {
  const { language } = useLanguage();
  const isBn = language === 'bn';

  const [sheetInput, setSheetInput] = useState<string>('');
  const [isLinking, setIsLinking] = useState<boolean>(false);
  const [isCreating, setIsCreating] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Destructive confirmation state
  const [confirmAction, setConfirmAction] = useState<'pull' | 'push' | null>(null);

  if (!isOpen) return null;

  const handlePasteFromClipboard = async () => {
    try {
      if (navigator.clipboard && navigator.clipboard.readText) {
        const text = await navigator.clipboard.readText();
        if (text) {
          setSheetInput(text.trim());
          setErrorMsg(null);
          return;
        }
      }
    } catch {
      // If permission is denied or blocked, focus input so user can press Ctrl+V
    }
    inputRef.current?.focus();
    inputRef.current?.select();
  };

  const handleLinkSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!sheetInput.trim()) return;
    setErrorMsg(null);
    setIsLinking(true);
    try {
      if (!currentUser) {
        await onSignIn();
      }
      await onLinkExistingSheet(sheetInput.trim());
      setSheetInput('');
    } catch (err: any) {
      setErrorMsg(err?.message || 'Failed to connect to Google Sheet.');
    } finally {
      setIsLinking(false);
    }
  };

  const handleCreateNew = async () => {
    setErrorMsg(null);
    setIsCreating(true);
    try {
      if (!currentUser) {
        await onSignIn();
      }
      await onCreateNewSheet();
    } catch (err: any) {
      setErrorMsg(err?.message || 'Failed to create Google Sheet.');
    } finally {
      setIsCreating(false);
    }
  };

  const handleExecuteConfirmedAction = async () => {
    const action = confirmAction;
    setConfirmAction(null);
    setErrorMsg(null);

    try {
      if (action === 'push') {
        await onPushToSheet();
      } else if (action === 'pull') {
        await onPullFromSheet();
      }
    } catch (err: any) {
      setErrorMsg(err?.message || `Failed to ${action} Google Sheet.`);
    }
  };

  return (
    <div
      onClick={(e) => {
        if (e.target === e.currentTarget && !confirmAction) onClose();
      }}
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/75"
    >
      <div className="relative w-full max-w-xl max-h-[92vh] flex flex-col bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden">
        {/* Header */}
        <div className="shrink-0 px-6 py-4 border-b border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/90 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-emerald-600 text-white flex items-center justify-center shadow-xs">
              <FileSpreadsheet className="w-4 h-4" />
            </div>
            <h3 className="font-bold text-slate-900 dark:text-slate-100 text-sm sm:text-base">
              {isBn ? 'গুগল শিট সিঙ্ক' : 'Google Sheets Sync'}
            </h3>
          </div>
          <button
            onClick={onClose}
            aria-label="Close sync modal"
            className="p-1.5 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-4">
          {errorMsg && (
            <div className="p-3 bg-rose-50 dark:bg-rose-950/60 border border-rose-200 dark:border-rose-800 rounded-xl flex items-start gap-2.5 text-xs text-rose-800 dark:text-rose-200">
              <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* Section 1: Google Account */}
          <div className="p-3.5 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200 dark:border-slate-700 flex items-center justify-between gap-3">
            {currentUser ? (
              <div className="flex items-center gap-2.5 min-w-0">
                {currentUser.photoURL ? (
                  <img
                    src={currentUser.photoURL}
                    alt={currentUser.displayName || 'Google User'}
                    className="w-8 h-8 rounded-full border border-slate-300 dark:border-slate-600 shrink-0"
                  />
                ) : (
                  <div className="w-8 h-8 rounded-full bg-emerald-600 text-white font-bold text-xs flex items-center justify-center shrink-0">
                    {currentUser.displayName?.[0] || 'G'}
                  </div>
                )}
                <div className="min-w-0">
                  <span className="font-bold text-slate-900 dark:text-slate-100 text-xs block truncate">
                    {currentUser.displayName || currentUser.email}
                  </span>
                  <span className="text-[10px] text-emerald-700 dark:text-emerald-400 font-semibold flex items-center gap-1">
                    <CheckCircle2 className="w-3 h-3 text-emerald-600 dark:text-emerald-400" />
                    {isBn ? 'কানেক্টেড' : 'Connected'}
                  </span>
                </div>
              </div>
            ) : (
              <div className="flex items-center gap-2 text-xs text-slate-600 dark:text-slate-300">
                <span className="w-2 h-2 rounded-full bg-slate-400 shrink-0" />
                <span className="font-medium">{isBn ? 'গুগল অ্যাকাউন্ট সাইন ইন করা নেই' : 'Google Account not connected'}</span>
              </div>
            )}

            <div>
              {currentUser ? (
                <button
                  type="button"
                  onClick={onSignOut}
                  className="px-2.5 py-1.5 rounded-lg border border-slate-300 dark:border-slate-600 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 text-xs font-medium inline-flex items-center gap-1.5 cursor-pointer transition-colors"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  <span>{isBn ? 'সাইন আউট' : 'Sign out'}</span>
                </button>
              ) : (
                <button
                  type="button"
                  onClick={onSignIn}
                  className="px-3 py-1.5 rounded-lg bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 hover:border-slate-400 dark:hover:border-slate-500 text-slate-800 dark:text-slate-100 font-semibold text-xs shadow-2xs inline-flex items-center gap-2 cursor-pointer transition-colors"
                >
                  <svg className="w-3.5 h-3.5 shrink-0" viewBox="0 0 48 48" aria-hidden="true">
                    <path
                      fill="#EA4335"
                      d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"
                    />
                    <path
                      fill="#4285F4"
                      d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"
                    />
                    <path
                      fill="#FBBC05"
                      d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"
                    />
                    <path
                      fill="#34A853"
                      d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"
                    />
                  </svg>
                  <span>{isBn ? 'সাইন ইন' : 'Sign in'}</span>
                </button>
              )}
            </div>
          </div>

          {/* Section 2: Connected Sheet Status or Connection Options */}
          {connectedSheet ? (
            <div className="space-y-3.5">
              <div className="p-3.5 bg-emerald-50/70 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/60 rounded-xl">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="min-w-0">
                    <div className="flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse motion-reduce:animate-none" />
                      <span className="text-xs font-semibold text-emerald-800 dark:text-emerald-300">
                        {isBn ? 'সংযুক্ত গুগল শিট' : 'Active Google Sheet'}
                      </span>
                    </div>
                    <h4 className="font-bold text-slate-900 dark:text-slate-100 text-sm mt-0.5 truncate">
                      {connectedSheet.title}
                    </h4>
                    <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5 truncate max-w-sm">
                      ID: <span className="font-mono">{connectedSheet.id}</span>
                    </p>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <a
                      href={connectedSheet.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold shadow-2xs inline-flex items-center gap-1.5 cursor-pointer transition-colors"
                    >
                      <span>{isBn ? 'শিট খুলুন' : 'Open Sheet'}</span>
                      <ExternalLink className="w-3 h-3" />
                    </a>
                    <button
                      type="button"
                      onClick={onDisconnectSheet}
                      className="px-2.5 py-1.5 rounded-lg border border-slate-300 dark:border-slate-600 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 text-xs font-medium cursor-pointer transition-colors"
                      title="Unlink this spreadsheet"
                    >
                      {isBn ? 'আনলিংক' : 'Unlink'}
                    </button>
                  </div>
                </div>

                {/* Last synced status */}
                <div className="mt-2.5 pt-2.5 border-t border-emerald-200/60 dark:border-emerald-800/60 flex items-center justify-between text-xs text-slate-600 dark:text-slate-400">
                  <span className="inline-flex items-center gap-1.5 text-[11px]">
                    <CheckCircle2 className="w-3 h-3 text-emerald-600 dark:text-emerald-400" />
                    <span>
                      {lastSyncedAt
                        ? `${isBn ? 'সর্বশেষ সিঙ্ক' : 'Last synced'}: ${lastSyncedAt.toLocaleTimeString()}`
                        : (isBn ? 'সিঙ্কের জন্য প্রস্তুত' : 'Ready to sync')}
                    </span>
                  </span>
                  {isSyncing && (
                    <span className="inline-flex items-center gap-1 text-emerald-700 dark:text-emerald-400 font-semibold text-[11px] animate-pulse">
                      <RefreshCw className="w-3 h-3 animate-spin" />
                      <span>{isBn ? 'সিঙ্ক হচ্ছে…' : 'Syncing…'}</span>
                    </span>
                  )}
                </div>
              </div>

              {/* Two-Way Action Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {/* Pull Action Card */}
                <div className="p-3.5 bg-white dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl shadow-2xs flex flex-col justify-between space-y-2">
                  <div>
                    <div className="flex items-center gap-1.5 font-bold text-slate-900 dark:text-slate-100 text-xs">
                      <DownloadCloud className="w-4 h-4 text-blue-600 dark:text-blue-400 shrink-0" />
                      <span>{isBn ? 'শিট থেকে আনুন' : 'Pull from Sheet'}</span>
                    </div>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">
                      {isBn ? 'গুগল শিটের পরিবর্তন ড্যাশবোর্ডে লোড করবে।' : 'Import changes edited in the Google Sheet.'}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setConfirmAction('pull')}
                    disabled={isSyncing}
                    className="w-full mt-1 py-1.5 px-3 rounded-lg bg-blue-50 dark:bg-blue-950/60 hover:bg-blue-100 dark:hover:bg-blue-900/60 text-blue-700 dark:text-blue-300 font-bold text-xs border border-blue-200 dark:border-blue-800 transition-colors cursor-pointer disabled:opacity-50"
                  >
                    {isBn ? 'ডাটা পুল করুন' : 'Pull Data'}
                  </button>
                </div>

                {/* Push Action Card */}
                <div className="p-3.5 bg-white dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl shadow-2xs flex flex-col justify-between space-y-2">
                  <div>
                    <div className="flex items-center gap-1.5 font-bold text-slate-900 dark:text-slate-100 text-xs">
                      <UploadCloud className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
                      <span>{isBn ? 'শিটে পাঠান' : 'Push to Sheet'}</span>
                    </div>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">
                      {isBn ? 'ড্যাশবোর্ডের পেমেন্ট রেকর্ড গুগল শিটে পাঠাবে।' : 'Upload dashboard records to Google Sheet.'}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setConfirmAction('push')}
                    disabled={isSyncing}
                    className="w-full mt-1 py-1.5 px-3 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-2xs transition-colors cursor-pointer disabled:opacity-50"
                  >
                    {isBn ? 'ডাটা পুশ করুন' : 'Push Data'}
                  </button>
                </div>
              </div>

              {/* Auto-Sync Toggle */}
              <div className="p-3 bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-xl flex items-center justify-between">
                <div>
                  <span className="font-semibold text-slate-800 dark:text-slate-200 text-xs block">
                    {isBn ? 'অটো-সিঙ্ক (Auto-Sync)' : 'Auto-Sync on Update'}
                  </span>
                  <span className="text-[11px] text-slate-500 dark:text-slate-400">
                    {isBn ? 'পেমেন্ট রেকর্ড আপডেট হলে স্বয়ংক্রিয়ভাবে শিটে সিঙ্ক হবে' : 'Automatically sync to Google Sheet when payments update'}
                  </span>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={autoSyncEnabled}
                    onChange={(e) => onToggleAutoSync(e.target.checked)}
                    className="sr-only peer"
                  />
                  <div className="w-9 h-5 bg-slate-200 dark:bg-slate-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-transform duration-150 peer-checked:bg-emerald-600"></div>
                </label>
              </div>
            </div>
          ) : (
            /* When No Sheet is Connected */
            <div className="space-y-3.5">
              {/* Option A: Create New Sheet */}
              <div className="p-4 bg-white dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl shadow-2xs flex items-center justify-between gap-3">
                <div className="space-y-0.5 min-w-0">
                  <h4 className="font-bold text-slate-900 dark:text-slate-100 text-xs sm:text-sm flex items-center gap-1.5">
                    <Plus className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
                    <span>{isBn ? 'নতুন গুগল শিট তৈরি করুন' : 'Create New Google Sheet'}</span>
                  </h4>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400">
                    {isBn
                      ? 'আপনার গুগল ড্রাইভে নতুন রেজিস্টার শিট তৈরি করবে।'
                      : 'Creates a formatted register in your Google Drive.'}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={handleCreateNew}
                  disabled={isCreating}
                  className="px-3.5 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-2xs transition-colors cursor-pointer disabled:opacity-50 shrink-0"
                >
                  {isCreating
                    ? (isBn ? 'তৈরি হচ্ছে…' : 'Creating…')
                    : (isBn ? 'তৈরি করুন' : 'Create Sheet')}
                </button>
              </div>

              {/* Divider */}
              <div className="relative flex items-center justify-center">
                <div className="border-t border-slate-200 dark:border-slate-700 w-full" />
                <span className="bg-white dark:bg-slate-900 px-2.5 text-xs font-semibold text-slate-400 absolute">
                  {isBn ? 'অথবা' : 'or'}
                </span>
              </div>

              {/* Option B: Link Existing Sheet */}
              <div className="p-4 bg-white dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl shadow-2xs space-y-2">
                <div>
                  <h4 className="font-bold text-slate-900 dark:text-slate-100 text-xs sm:text-sm flex items-center gap-1.5">
                    <Link className="w-4 h-4 text-blue-600 dark:text-blue-400 shrink-0" />
                    <span>{isBn ? 'বিদ্যমান গুগল শিট লিংক করুন' : 'Link Existing Google Sheet'}</span>
                  </h4>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                    {isBn
                      ? 'গুগল শিটের লিংক পেস্ট করুন:'
                      : 'Paste your Google Sheet URL:'}
                  </p>
                </div>
                <form onSubmit={handleLinkSubmit} className="space-y-2">
                  <div className="flex gap-2">
                    <div className="relative flex-1">
                      <input
                        ref={inputRef}
                        type="text"
                        value={sheetInput}
                        onChange={(e) => setSheetInput(e.target.value)}
                        placeholder="https://docs.google.com/spreadsheets/d/..."
                        className="w-full px-3 py-2 pr-16 border border-slate-300 dark:border-slate-700 rounded-lg text-xs font-mono focus:outline-emerald-500 bg-white dark:bg-slate-950 text-slate-900 dark:text-slate-100"
                      />
                      <button
                        type="button"
                        onClick={handlePasteFromClipboard}
                        className="absolute right-1.5 top-1/2 -translate-y-1/2 px-2 py-1 rounded-md bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-[11px] font-semibold flex items-center gap-1 border border-slate-200 dark:border-slate-700 cursor-pointer transition-colors"
                        title={isBn ? 'ক্লিপবোর্ড থেকে পেস্ট করুন' : 'Paste from clipboard'}
                      >
                        <ClipboardPaste className="w-3 h-3 text-blue-600 dark:text-blue-400" />
                        <span>{isBn ? 'পেস্ট' : 'Paste'}</span>
                      </button>
                    </div>
                    <button
                      type="submit"
                      disabled={isLinking || !sheetInput.trim()}
                      className="px-4 py-2 rounded-lg bg-slate-900 dark:bg-emerald-600 hover:bg-slate-800 dark:hover:bg-emerald-500 text-white font-bold text-xs transition-colors cursor-pointer disabled:opacity-50 shrink-0"
                    >
                      {isLinking
                        ? (isBn ? 'সংযোগ হচ্ছে…' : 'Connecting…')
                        : (isBn ? 'কানেক্ট' : 'Connect')}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="shrink-0 px-6 py-3.5 bg-slate-50 dark:bg-slate-900/90 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
          <span className="flex items-center gap-1.5 text-[11px]">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
            <span>{isBn ? 'নিরাপদ গুগল ক্লাউড সংযোগ' : 'Encrypted Google Cloud Connection'}</span>
          </span>
          <button
            type="button"
            onClick={onClose}
            className="px-3.5 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 hover:bg-slate-200 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 font-medium text-xs cursor-pointer transition-colors"
          >
            {isBn ? 'বন্ধ করুন' : 'Close'}
          </button>
        </div>
      </div>

      {/* Mandatory User Confirmation Dialog for Mutating Workspace Operations */}
      {confirmAction && (
        <div className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-slate-950/75">
          <div className="relative w-full max-w-md bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-300 dark:border-slate-700 p-6 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center gap-3 mb-3">
              <div
                className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${
                  confirmAction === 'push'
                    ? 'bg-emerald-100 dark:bg-emerald-950/70 text-emerald-700 dark:text-emerald-300'
                    : 'bg-blue-100 dark:bg-blue-950/70 text-blue-700 dark:text-blue-300'
                }`}
              >
                {confirmAction === 'push' ? (
                  <UploadCloud className="w-5 h-5" />
                ) : (
                  <DownloadCloud className="w-5 h-5" />
                )}
              </div>
              <div>
                <h4 className="font-bold text-slate-900 dark:text-slate-100 text-base">
                  {confirmAction === 'push'
                    ? 'Update Google Sheet Data?'
                    : 'Update Dashboard from Google Sheet?'}
                </h4>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  {confirmAction === 'push'
                    ? 'Confirm synchronization to Google Drive'
                    : 'Confirm reading spreadsheet updates'}
                </p>
              </div>
            </div>

            <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed mb-6">
              {confirmAction === 'push'
                ? `Are you sure you want to push current dashboard records into "${connectedSheet?.title}"? This will overwrite the values in your Google Sheet with the latest dashboard payments and dues.`
                : `Are you sure you want to pull and apply the latest values from "${connectedSheet?.title}"? This will update local dashboard records with any changes made directly in the spreadsheet.`}
            </p>

            <div className="flex items-center justify-end gap-2.5">
              <button
                type="button"
                onClick={() => setConfirmAction(null)}
                className="px-4 py-2 rounded-lg border border-slate-300 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 font-medium text-xs transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleExecuteConfirmedAction}
                className={`px-4 py-2 rounded-lg text-white font-bold text-xs shadow-xs transition-colors cursor-pointer ${
                  confirmAction === 'push'
                    ? 'bg-emerald-600 hover:bg-emerald-500'
                    : 'bg-blue-600 hover:bg-blue-500'
                }`}
              >
                Confirm &amp; Proceed
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
