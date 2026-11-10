import React, { useRef, useState, useEffect } from 'react';
import {
  Plus,
  Download,
  Printer,
  RotateCcw,
  FileSpreadsheet,
  RefreshCw,
  Lock,
  LogOut,
  ShieldCheck,
  Sun,
  Moon,
  Database,
  Upload,
  ChevronDown,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { useTheme } from '../context/ThemeContext';
import { TextureButton } from './ui/texture-button';

interface NavbarProps {
  onOpenRecordPayment?: () => void;
  onOpenAddShare: () => void;
  onExportCSV: () => void;
  onExportJSON?: () => void;
  onImportJSON?: (file: File) => void;
  onPrint: () => void;
  onResetData: () => void;
  isSheetConnected: boolean;
  isSyncing: boolean;
  sheetTitle?: string;
  onOpenSyncModal: () => void;
  isCloudLive?: boolean;
}

export const Navbar: React.FC<NavbarProps> = ({
  onOpenRecordPayment,
  onOpenAddShare,
  onExportCSV,
  onExportJSON,
  onImportJSON,
  onPrint,
  onResetData,
  isSheetConnected,
  isSyncing,
  sheetTitle,
  onOpenSyncModal,
  isCloudLive = false,
}) => {
  const { isAdmin, logout, openLoginModal } = useAuth();
  const { language, setLanguage, t } = useLanguage();
  const { theme, setTheme } = useTheme();
  const jsonInputRef = useRef<HTMLInputElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const [isDropdownOpen, setIsDropdownOpen] = useState<boolean>(false);

  // Close dropdown on click outside or escape key
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false);
      }
    };
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setIsDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, []);

  return (
    <header className="bg-slate-900/95 backdrop-blur-md border-b border-slate-800 text-white sticky top-0 z-30 shadow-lg shadow-slate-950/20">
      <div className="w-full px-3 sm:px-6 lg:px-8 xl:px-10 py-2.5 sm:py-3">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-2.5 sm:gap-4">
          {/* Logo, Society Title & Header Quick Controls */}
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center space-x-2.5 sm:space-x-3 min-w-0">
              <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-xl bg-white p-1 flex items-center justify-center shadow-md shadow-emerald-950/50 ring-2 ring-emerald-500/30 overflow-hidden shrink-0">
                <img
                  src="/logo.png"
                  alt="Progressive Association Society Logo"
                  className="w-full h-full object-contain"
                />
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-1.5 sm:gap-2 flex-wrap">
                  <h1 className="font-bold text-sm sm:text-lg tracking-tight text-white truncate">
                    {t('societyName')}
                  </h1>
                  <span className="hidden sm:inline-block px-2 py-0.5 text-[10px] font-semibold bg-emerald-500/20 text-emerald-300 rounded-full border border-emerald-500/30">
                    {t('fundPortal')}
                  </span>
                  <span
                    className={`inline-flex items-center gap-1 px-1.5 sm:px-2 py-0.5 text-[10px] font-medium rounded-full border transition-colors ${
                      isCloudLive
                        ? 'bg-emerald-950/60 text-emerald-300 border-emerald-500/40 shadow-xs shadow-emerald-950'
                        : 'bg-amber-950/60 text-amber-300 border-amber-500/40'
                    }`}
                    title={
                      isCloudLive
                        ? 'Connected to Google Firebase Cloud: Live real-time sync active'
                        : 'Connecting to Google Firebase Cloud…'
                    }
                  >
                    <span
                      className={`w-1.5 h-1.5 rounded-full ${
                        isCloudLive ? 'bg-emerald-400 animate-pulse motion-reduce:animate-none' : 'bg-amber-400'
                      }`}
                    />
                    <span>
                      {isCloudLive
                        ? language === 'bn'
                          ? 'লাইভ'
                          : 'Live'
                        : language === 'bn'
                        ? 'কানেক্টিং…'
                        : 'Connecting…'}
                    </span>
                  </span>
                </div>
                <p className="text-[10px] sm:text-xs text-slate-400 font-medium tracking-wide truncate">
                  {t('portalSubtitle')}
                </p>
              </div>
            </div>

            {/* Mobile Header Quick Bar: Language, Theme, Admin */}
            <div className="flex md:hidden items-center gap-1.5 shrink-0">
              {/* Language Switch */}
              <div className="flex items-center bg-slate-800/90 p-0.5 rounded-xl border border-slate-700/80 shadow-2xs">
                <button
                  type="button"
                  onClick={() => setLanguage('en')}
                  className={`px-1.5 py-1 rounded-lg text-[11px] font-bold transition-colors duration-150 cursor-pointer ${
                    language === 'en'
                      ? 'bg-emerald-600 text-white shadow-xs'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  EN
                </button>
                <button
                  type="button"
                  onClick={() => setLanguage('bn')}
                  className={`px-1.5 py-1 rounded-lg text-[11px] font-bold transition-colors duration-150 cursor-pointer ${
                    language === 'bn'
                      ? 'bg-emerald-600 text-white shadow-xs'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  বাং
                </button>
              </div>

              {/* Theme Toggle */}
              <div className="flex items-center bg-slate-800/90 p-0.5 rounded-xl border border-slate-700/80 shadow-2xs">
                <button
                  type="button"
                  onClick={() => setTheme(theme === 'forest-dark' ? 'forest-light' : 'forest-dark')}
                  className="p-1 rounded-lg text-slate-300 hover:text-white transition-colors cursor-pointer"
                  title="Toggle theme"
                  aria-label="Toggle theme"
                >
                  {theme === 'forest-dark' ? <Sun className="w-3.5 h-3.5 text-amber-400" /> : <Moon className="w-3.5 h-3.5 text-teal-300" />}
                </button>
              </div>

              {/* Admin Menu Trigger on Mobile */}
              <button
                type="button"
                onClick={() => setIsDropdownOpen((prev) => !prev)}
                className={`px-2 py-1 rounded-xl border text-[11px] font-bold flex items-center gap-1 cursor-pointer transition-colors shadow-2xs ${
                  isAdmin
                    ? 'bg-emerald-950/90 border-emerald-500/50 text-emerald-300'
                    : 'bg-slate-800 border-slate-700 text-slate-300 hover:text-white'
                }`}
                title={language === 'bn' ? 'এডমিন মেন্যু ও টুলস' : 'Admin Menu & Tools'}
                aria-expanded={isDropdownOpen}
                aria-haspopup="true"
              >
                {isAdmin ? (
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                ) : (
                  <Lock className="w-3.5 h-3.5 text-amber-400" />
                )}
                <span>{isAdmin ? (language === 'bn' ? 'এডমিন' : 'Admin') : (language === 'bn' ? 'এডমিন' : 'Admin')}</span>
                <ChevronDown className={`w-3 h-3 text-slate-400 transition-transform duration-150 ${isDropdownOpen ? 'rotate-180' : ''}`} />
              </button>
            </div>
          </div>

          {/* Action Buttons Strip - Horizontal swipe on Mobile, Flex on Desktop */}
          <div className="flex items-center overflow-x-auto md:overflow-visible [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden flex-nowrap md:flex-wrap gap-1.5 sm:gap-2 pb-0.5 md:pb-0">
            {/* Desktop-only Language & Theme Controls */}
            <div className="hidden md:flex items-center bg-slate-800/90 p-0.5 rounded-xl border border-slate-700/80 shadow-2xs shrink-0">
              <button
                type="button"
                onClick={() => setLanguage('en')}
                className={`px-2 py-1 rounded-lg text-xs font-bold transition-colors duration-150 cursor-pointer focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:outline-none active:scale-95 disabled:opacity-50 ${
                  language === 'en'
                    ? 'bg-emerald-600 text-white shadow-xs'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
                title="Switch to English"
              >
                EN
              </button>
              <button
                type="button"
                onClick={() => setLanguage('bn')}
                className={`px-2 py-1 rounded-lg text-xs font-bold transition-colors duration-150 cursor-pointer focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:outline-none active:scale-95 disabled:opacity-50 ${
                  language === 'bn'
                    ? 'bg-emerald-600 text-white shadow-xs'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
                title="বাংলা ভাষায় পরিবর্তন করুন"
              >
                বাংলা
              </button>
            </div>

            <div className="hidden md:flex items-center bg-slate-800/90 p-0.5 rounded-xl border border-slate-700/80 shadow-2xs shrink-0">
              <button
                type="button"
                onClick={() => setTheme('forest-light')}
                className={`p-1.5 rounded-lg transition-colors duration-150 cursor-pointer focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:outline-none active:scale-95 disabled:opacity-50 ${
                  theme === 'forest-light'
                    ? 'bg-amber-600 text-white shadow-xs'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
                title={language === 'bn' ? 'লাইট থিম' : 'Light Theme'}
                aria-label={language === 'bn' ? 'লাইট থিম' : 'Light Theme'}
              >
                <Sun className="w-3.5 h-3.5" />
              </button>
              <button
                type="button"
                onClick={() => setTheme('forest-dark')}
                className={`p-1.5 rounded-lg transition-colors duration-150 cursor-pointer focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:outline-none active:scale-95 disabled:opacity-50 ${
                  theme === 'forest-dark'
                    ? 'bg-teal-600 text-white shadow-xs'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
                title={language === 'bn' ? 'ডার্ক থিম' : 'Dark Theme'}
                aria-label={language === 'bn' ? 'ডার্ক থিম' : 'Dark Theme'}
              >
                <Moon className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* Primary Action: Add Share */}
            <div className="shrink-0">
              <TextureButton
                variant="primary"
                size="sm"
                onClick={onOpenAddShare}
                className="whitespace-nowrap px-3 py-1.5 text-xs"
                title="Add a new share or member"
              >
                <Plus className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                <span>{t('addShare')}</span>
              </TextureButton>
            </div>

            {/* Google Sheet Sync Button */}
            <div className="shrink-0">
              <TextureButton
                variant={isSheetConnected ? "emerald" : "minimal"}
                size="sm"
                onClick={onOpenSyncModal}
                className="whitespace-nowrap px-2.5 py-1.5 text-xs"
                title={
                  isSheetConnected
                    ? `Connected to Google Sheet: ${sheetTitle || 'Live'}. Click to manage sync.`
                    : 'Connect Google Sheet for two-way synchronization'
                }
              >
                {isSyncing ? (
                  <RefreshCw className="w-3.5 h-3.5 text-emerald-400 animate-spin shrink-0" />
                ) : (
                  <FileSpreadsheet className={`w-3.5 h-3.5 shrink-0 ${isSheetConnected ? 'text-white' : 'text-emerald-500'}`} />
                )}
                <span>{isSheetConnected ? t('sheetSynced') : t('syncSheet')}</span>
                {isSheetConnected && (
                  <span className="w-2 h-2 rounded-full bg-emerald-300 animate-pulse motion-reduce:animate-none ml-0.5" />
                )}
              </TextureButton>
            </div>

            {/* Admin Tools Dropdown Button */}
            <div className="relative shrink-0" ref={dropdownRef}>
              <TextureButton
                variant={isAdmin ? "emerald" : "minimal"}
                size="sm"
                onClick={() => setIsDropdownOpen((prev) => !prev)}
                className="whitespace-nowrap px-3 py-1.5 text-xs font-bold"
                aria-expanded={isDropdownOpen}
                aria-haspopup="true"
                title={language === 'bn' ? 'এডমিন টুলস ও সেটিংস' : 'Admin Tools & Settings'}
              >
                {isAdmin ? (
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-200 shrink-0" />
                ) : (
                  <Lock className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                )}
                <span>{isAdmin ? (language === 'bn' ? 'এডমিন' : 'Admin') : (language === 'bn' ? 'এডমিন' : 'Admin')}</span>
                <ChevronDown
                  className={`w-3 h-3 text-slate-400 transition-transform duration-150 ${
                    isDropdownOpen ? 'rotate-180 text-white' : ''
                  }`}
                />
              </TextureButton>

              {/* Hidden file input for JSON Restore */}
              <input
                type="file"
                ref={jsonInputRef}
                accept=".json"
                className="hidden"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file && onImportJSON) {
                    onImportJSON(file);
                    e.target.value = '';
                  }
                }}
              />

              {/* Dropdown Menu */}
              {isDropdownOpen && (
                <div className="fixed sm:absolute right-3 sm:right-0 top-16 sm:top-full mt-2 w-[calc(100vw-24px)] sm:w-80 max-w-sm bg-slate-900 border border-slate-700/80 rounded-2xl shadow-2xl shadow-slate-950/80 p-2.5 z-50 text-xs">
                  {/* Admin Status & Auth Header */}
                  <div className="p-2.5 bg-slate-800/80 rounded-xl border border-slate-700/60 mb-2 flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2 min-w-0">
                      <div
                        className={`w-2.5 h-2.5 rounded-full shrink-0 ${
                          isAdmin ? 'bg-emerald-400 animate-pulse motion-reduce:animate-none' : 'bg-amber-400'
                        }`}
                      />
                      <span className="font-bold text-white block text-xs truncate">
                        {isAdmin
                          ? language === 'bn'
                            ? 'এডমিন মোড সক্রিয়'
                            : 'Admin Mode Active'
                          : language === 'bn'
                          ? 'ভিউয়ার মোড (লকড)'
                          : 'Viewer Mode (Locked)'}
                      </span>
                    </div>

                    {isAdmin ? (
                      <button
                        type="button"
                        onClick={() => {
                          logout();
                          setIsDropdownOpen(false);
                        }}
                        className="px-2.5 py-1.5 rounded-lg bg-rose-950/60 hover:bg-rose-900/70 text-rose-300 border border-rose-800/60 text-[11px] font-semibold flex items-center gap-1.5 cursor-pointer transition-colors shrink-0"
                      >
                        <LogOut className="w-3 h-3" />
                        <span>{language === 'bn' ? 'লগআউট' : 'Logout'}</span>
                      </button>
                    ) : (
                      <button
                        type="button"
                        onClick={() => {
                          openLoginModal();
                          setIsDropdownOpen(false);
                        }}
                        className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-[11px] flex items-center gap-1.5 cursor-pointer transition-colors shadow-2xs shrink-0"
                      >
                        <Lock className="w-3 h-3 text-white" />
                        <span>{language === 'bn' ? 'লগইন' : 'Login'}</span>
                      </button>
                    )}
                  </div>

                  {/* Group: Reports & Export */}
                  <div className="px-2 pt-1 pb-1 text-[10px] font-semibold text-slate-400">
                    {language === 'bn' ? 'রিপোর্ট ও এক্সপোর্ট' : 'Reports & Export'}
                  </div>
                  <div className="space-y-1 mb-2">
                    {/* Export CSV */}
                    <button
                      type="button"
                      onClick={() => {
                        onExportCSV();
                        setIsDropdownOpen(false);
                      }}
                      className="w-full px-2.5 py-2 rounded-xl text-left hover:bg-slate-800/90 flex items-center gap-2.5 text-slate-200 hover:text-white transition-colors cursor-pointer"
                    >
                      <div className="w-7 h-7 rounded-lg bg-blue-950/70 text-blue-400 border border-blue-800/50 flex items-center justify-center shrink-0">
                        <Download className="w-3.5 h-3.5" />
                      </div>
                      <span className="font-semibold text-xs text-slate-200">
                        {language === 'bn' ? 'এক্সেল / CSV এক্সপোর্ট' : 'Export CSV / Excel'}
                      </span>
                    </button>

                    {/* Print Dashboard */}
                    <button
                      type="button"
                      onClick={() => {
                        onPrint();
                        setIsDropdownOpen(false);
                      }}
                      className="w-full px-2.5 py-2 rounded-xl text-left hover:bg-slate-800/90 flex items-center gap-2.5 text-slate-200 hover:text-white transition-colors cursor-pointer"
                    >
                      <div className="w-7 h-7 rounded-lg bg-amber-950/70 text-amber-400 border border-amber-800/50 flex items-center justify-center shrink-0">
                        <Printer className="w-3.5 h-3.5" />
                      </div>
                      <span className="font-semibold text-xs text-slate-200">
                        {language === 'bn' ? 'ড্যাশবোর্ড প্রিন্ট / PDF' : 'Print Dashboard / PDF'}
                      </span>
                    </button>
                  </div>

                  {/* Group: Backup & Restore */}
                  <div className="px-2 pt-1 pb-1 text-[10px] font-semibold text-slate-400">
                    {language === 'bn' ? 'ডাটা ব্যাকআপ ও রিস্টোর' : 'Backup & Disaster Recovery'}
                  </div>
                  <div className="space-y-1 mb-2">
                    {/* Backup JSON */}
                    {onExportJSON && (
                      <button
                        type="button"
                        onClick={() => {
                          onExportJSON();
                          setIsDropdownOpen(false);
                        }}
                        className="w-full px-2.5 py-2 rounded-xl text-left hover:bg-slate-800/90 flex items-center gap-2.5 text-slate-200 hover:text-white transition-colors cursor-pointer"
                      >
                        <div className="w-7 h-7 rounded-lg bg-teal-950/70 text-teal-400 border border-teal-800/50 flex items-center justify-center shrink-0">
                          <Database className="w-3.5 h-3.5" />
                        </div>
                        <span className="font-semibold text-xs text-slate-200">
                          {language === 'bn' ? 'অফলাইন ব্যাকআপ (JSON)' : 'Offline JSON Backup'}
                        </span>
                      </button>
                    )}

                    {/* Restore JSON */}
                    {onImportJSON && (
                      <button
                        type="button"
                        onClick={() => {
                          jsonInputRef.current?.click();
                          setIsDropdownOpen(false);
                        }}
                        className="w-full px-2.5 py-2 rounded-xl text-left hover:bg-slate-800/90 flex items-center gap-2.5 text-slate-200 hover:text-white transition-colors cursor-pointer"
                      >
                        <div className="w-7 h-7 rounded-lg bg-teal-950/70 text-teal-400 border border-teal-800/50 flex items-center justify-center shrink-0">
                          <Upload className="w-3.5 h-3.5" />
                        </div>
                        <span className="font-semibold text-xs text-slate-200">
                          {language === 'bn' ? 'ব্যাকআপ রিস্টোর (JSON)' : 'Restore from JSON'}
                        </span>
                      </button>
                    )}
                  </div>

                  {/* Danger Zone: Reset Data */}
                  <div className="border-t border-slate-800/80 pt-1.5 mt-1">
                    <button
                      type="button"
                      onClick={() => {
                        onResetData();
                        setIsDropdownOpen(false);
                      }}
                      className="w-full px-2.5 py-2 rounded-xl text-left hover:bg-rose-950/40 flex items-center gap-2.5 text-rose-300 hover:text-rose-200 transition-colors cursor-pointer"
                    >
                      <div className="w-7 h-7 rounded-lg bg-rose-950/70 text-rose-400 border border-rose-800/50 flex items-center justify-center shrink-0">
                        <RotateCcw className="w-3.5 h-3.5" />
                      </div>
                      <span className="font-semibold text-xs text-rose-300">
                        {language === 'bn' ? 'অরিজিনাল এক্সেলে রিসেট' : 'Reset to Original Data'}
                      </span>
                    </button>
                  </div>

                  {/* System Developer Credit */}
                  <div className="border-t border-slate-800/80 pt-2 pb-0.5 mt-1 text-center text-[10px] text-slate-400">
                    <span>Developed by{' '}</span>
                    <a
                      href="https://www.facebook.com/adu77"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="font-bold text-emerald-400 hover:text-emerald-300 underline underline-offset-2 transition-colors cursor-pointer"
                    >
                      Adnan Taher
                    </a>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </header>
  );
};
