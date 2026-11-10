import React, { useState, useEffect, useMemo } from 'react';
import { ShareRecord, MonthKey } from '../types';
import { useLanguage } from '../context/LanguageContext';
import { formatTaka, getCurrentSystemMonthKey, formatMonthLabel } from '../utils/calculations';
import {
  X,
  CreditCard,
  Phone,
  MessageCircle,
  Copy,
  Check,
  Search,
  Receipt,
  Share2,
  Calendar,
  AlertTriangle,
  CheckCircle2,
  PieChart,
  Users,
  Clock,
  Sparkles,
  ExternalLink,
  ChevronRight,
} from 'lucide-react';

interface CurrentMonthFloatingTrackerProps {
  shares: ShareRecord[];
  currentMonth?: string;
  onOpenPaymentForShare: (share: ShareRecord, month?: MonthKey) => void;
  onOpenReceiptForShare: (share: ShareRecord, month?: MonthKey) => void;
}

export const CurrentMonthFloatingTracker: React.FC<CurrentMonthFloatingTrackerProps> = ({
  shares,
  currentMonth: propCurrentMonth,
  onOpenPaymentForShare,
  onOpenReceiptForShare,
}) => {
  const { language } = useLanguage();
  const isBn = language === 'bn';

  // Always dynamically resolve the true real-world current calendar month
  const liveSystemMonth = useMemo(() => getCurrentSystemMonthKey(), []);
  const currentMonth = propCurrentMonth || liveSystemMonth;

  const [isOpen, setIsOpen] = useState<boolean>(false);
  const [activeTab, setActiveTab] = useState<'pending' | 'paid' | 'analytics'>('pending');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [copiedBulletin, setCopiedBulletin] = useState<boolean>(false);

  // Active shares (exclude closed accounts)
  const activeShares = useMemo(() => shares.filter((s) => !s.isClosed), [shares]);

  // Keyboard shortcut listener (Alt + M to toggle)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.altKey && (e.key === 'm' || e.key === 'M' || e.key === 'µ')) {
        e.preventDefault();
        setIsOpen((prev) => !prev);
      }
      if (e.key === 'Escape' && isOpen) {
        setIsOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen]);

  // Current month calculation
  const {
    paidShares,
    unpaidShares,
    collectionRate,
    totalCollected,
    totalPending,
    methodStats,
  } = useMemo(() => {
    const paid: ShareRecord[] = [];
    const unpaid: ShareRecord[] = [];
    const methods: Record<string, { count: number; amount: number }> = {
      'Bank Deposit': { count: 0, amount: 0 },
      bKash: { count: 0, amount: 0 },
      Nagad: { count: 0, amount: 0 },
      Cash: { count: 0, amount: 0 },
    };

    activeShares.forEach((s) => {
      const monthData = s.months[currentMonth];
      if (monthData?.status === 'paid') {
        paid.push(s);
        const m = monthData.paymentMethod || 'Bank Deposit';
        if (!methods[m]) methods[m] = { count: 0, amount: 0 };
        methods[m].count += 1;
        methods[m].amount += monthData.amount || 2800;
      } else {
        unpaid.push(s);
      }
    });

    const rate = activeShares.length > 0 ? (paid.length / activeShares.length) * 100 : 0;
    const collected = paid.reduce(
      (sum, s) => sum + (s.months[currentMonth]?.amount || 2800),
      0
    );
    const pending = unpaid.length * 2800;

    return {
      paidShares: paid,
      unpaidShares: unpaid,
      collectionRate: rate,
      totalCollected: collected,
      totalPending: pending,
      methodStats: methods,
    };
  }, [activeShares, currentMonth]);

  // Filtered lists by search query
  const filteredUnpaid = useMemo(() => {
    if (!searchQuery.trim()) return unpaidShares;
    const q = searchQuery.toLowerCase().trim();
    return unpaidShares.filter(
      (s) =>
        s.memberName.toLowerCase().includes(q) ||
        s.id.toLowerCase().includes(q) ||
        (s.phone && s.phone.includes(q))
    );
  }, [unpaidShares, searchQuery]);

  const filteredPaid = useMemo(() => {
    if (!searchQuery.trim()) return paidShares;
    const q = searchQuery.toLowerCase().trim();
    return paidShares.filter(
      (s) =>
        s.memberName.toLowerCase().includes(q) ||
        s.id.toLowerCase().includes(q) ||
        (s.phone && s.phone.includes(q))
    );
  }, [paidShares, searchQuery]);

  // Generate WhatsApp reminder text for a single member
  const getWhatsAppReminderText = (share: ShareRecord) => {
    const monthDisplay = formatMonthLabel(currentMonth, isBn);
    if (isBn) {
      return `আসসালামু আলাইকুম শ্রদ্ধেয় ${share.memberName} ভাই। প্রগ্রেসিভ এসোসিয়েশন সোসাইটির ${monthDisplay} (${currentMonth}) মাসের নিয়মিত কিস্তি (৳২,৮০০) পরিশোধের বিনীত অনুরোধ জানাচ্ছি। শেয়ার আইডি: ${share.id}। ইসলামী ব্যাংক বা বিকাশ/নগদে পরিশোধ করতে পারেন। ধন্যবাদ।`;
    }
    return `Assalamu Alaikum Dear ${share.memberName} Bhai. Friendly reminder to deposit the monthly installment for ${monthDisplay} (${currentMonth}) (Tk. 2,800) for Share ID: ${share.id} with Progressive Association Society. Thank you.`;
  };

  // Open direct WhatsApp chat
  const handleOpenWhatsApp = (share: ShareRecord) => {
    if (!share.phone) return;
    const cleanPhone = share.phone.replace(/[^0-9]/g, '');
    const text = encodeURIComponent(getWhatsAppReminderText(share));
    window.open(`https://wa.me/${cleanPhone}?text=${text}`, '_blank');
  };

  // Copy single reminder message to clipboard
  const handleCopySingleReminder = (share: ShareRecord) => {
    const text = getWhatsAppReminderText(share);
    navigator.clipboard.writeText(text);
    setCopiedId(share.id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  // Generate & Copy full committee WhatsApp bulletin
  const handleCopyBulletin = () => {
    const todayStr = new Date().toLocaleDateString('en-GB');
    const monthDisplay = formatMonthLabel(currentMonth, isBn);
    let bulletin = `━━━━━━━━━━━━━━━━━━━━\n`;
    bulletin += `🏛️ প্রগ্রেসিভ এসোসিয়েশন সোসাইটি\n`;
    bulletin += `📊 চলতি মাসের কালেকশন বুলেটিন — ${monthDisplay} (${currentMonth})\n`;
    bulletin += `📅 তারিখ: ${todayStr}\n`;
    bulletin += `━━━━━━━━━━━━━━━━━━━━\n\n`;
    bulletin += `💰 মোট আদায়: ৳ ${totalCollected.toLocaleString('en-IN')} (${paidShares.length}টি শেয়ার)\n`;
    bulletin += `⏳ বকেয়া বাকি: ৳ ${totalPending.toLocaleString('en-IN')} (${unpaidShares.length}টি শেয়ার)\n`;
    bulletin += `📈 আদায় সম্পন্ন: ${collectionRate.toFixed(1)}%\n\n`;

    if (unpaidShares.length > 0) {
      bulletin += `🔴 চলতি মাসের অপরিশোধিত তালিকা:\n`;
      unpaidShares.forEach((s, idx) => {
        bulletin += `${idx + 1}. ${s.memberName} — ${s.id} (৳ ২,৮০০)\n`;
      });
      bulletin += `\n💡 অনুরোধ: নির্ধারিত সময়ের মধ্যে কিস্তি পরিশোধ করার জন্য অনুরোধ করা হলো।\n`;
    } else {
      bulletin += `🎉 অভিনন্দন! চলতি মাসের শতভাগ (১০০%) কিস্তি আদায় সম্পন্ন হয়েছে!\n`;
    }
    bulletin += `━━━━━━━━━━━━━━━━━━━━`;

    navigator.clipboard.writeText(bulletin);
    setCopiedBulletin(true);
    setTimeout(() => setCopiedBulletin(false), 2500);
  };

  return (
    <>
      {/* ========================================================================= */}
      {/* 1. OBSIDIAN GLASSMORPHISM FLOATING TRIGGER PILL (BOTTOM-LEFT) */}
      {/* ========================================================================= */}
      <aside aria-label="Quick payment tracker" className="fixed bottom-3 left-3 sm:bottom-6 sm:left-6 z-40 select-none print:hidden">
        <button
          type="button"
          onClick={() => setIsOpen(true)}
          className="group relative flex items-center gap-2 px-3 py-2 sm:px-3.5 sm:py-2.5 bg-slate-950 hover:bg-slate-900 border border-emerald-500/40 hover:border-emerald-400 text-white rounded-full shadow-2xl transition-colors duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 cursor-pointer"
          title={
            isBn
              ? `চলতি মাস (${currentMonth}) রিয়েল-টাইম ট্র্যাকার • হটকি [Alt + M]`
              : `Current Month (${currentMonth}) Live Tracker • Hotkey [Alt + M]`
          }
        >
          {/* Animated Green Radar Pulse */}
          <div className="relative flex items-center justify-center">
            <span className="animate-ping motion-reduce:animate-none absolute inline-flex h-3 w-3 rounded-full bg-emerald-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
          </div>

          {/* Month & Real-Time Split Counters */}
          <div className="flex items-center gap-1.5 text-xs font-mono">
            <span className="font-bold text-slate-300 hidden sm:inline-block pr-1 border-r border-slate-700/80">
              {currentMonth}
            </span>

            {/* Paid Counter */}
            <span className="flex items-center gap-1 text-emerald-400 font-bold">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
              <span>{paidShares.length}</span>
              <span className="text-[10px] text-emerald-500/80 font-sans font-medium hidden sm:inline">
                {isBn ? 'পেইড' : 'Paid'}
              </span>
            </span>

            <span className="text-slate-600">/</span>

            {/* Pending Counter */}
            <span className="flex items-center gap-1 text-rose-400 font-bold">
              <span className="w-1.5 h-1.5 rounded-full bg-rose-400 animate-pulse motion-reduce:animate-none"></span>
              <span>{unpaidShares.length}</span>
              <span className="text-[10px] text-rose-400/80 font-sans font-medium hidden sm:inline">
                {isBn ? 'বাকি' : 'Due'}
              </span>
            </span>
          </div>

          {/* Percentage Pill Badge */}
          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold font-mono bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
            {collectionRate.toFixed(0)}%
          </span>

          {/* Micro Progress Bar Glow along bottom edge */}
          <div className="absolute -bottom-px left-3 right-3 h-[2px] bg-slate-800 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-emerald-500 to-teal-400 transition-transform duration-300 origin-left"
              style={{ transform: `scaleX(${collectionRate / 100})` }}
            ></div>
          </div>
        </button>
      </aside>

      {/* ========================================================================= */}
      {/* 2. EXECUTIVE ACTION HUB MODAL (WHEN OPEN) */}
      {/* ========================================================================= */}
      {isOpen && (
        <div
          onClick={(e) => {
            if (e.target === e.currentTarget) setIsOpen(false);
          }}
          className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-slate-950/75 motion-safe:animate-in motion-safe:fade-in duration-200"
        >
          <div className="relative w-full max-w-2xl bg-white rounded-3xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[92vh] motion-safe:animate-in motion-safe:zoom-in-95 duration-200">
            {/* Top Executive Header */}
            <div className="px-4 sm:px-6 py-3.5 sm:py-5 bg-gradient-to-r from-slate-950 via-slate-900 to-slate-950 text-white flex items-center justify-between border-b border-slate-800 shrink-0">
              <div className="flex items-center gap-3.5">
                <div className="w-10 h-10 rounded-2xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 flex items-center justify-center shrink-0">
                  <Calendar className="w-5 h-5" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="font-bold text-sm sm:text-base text-white tracking-tight">
                      {isBn ? 'চলতি মাসের লাইভ ট্র্যাকার' : 'Current Month Live Tracker'}
                    </h3>
                    <span className="px-2 py-0.5 rounded-md bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-[10px] font-mono font-bold flex items-center gap-1.5">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                      <span>{currentMonth} ({formatMonthLabel(currentMonth, isBn)})</span>
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-400">
                    {isBn
                      ? 'রিয়েল-টাইম কিস্তি কালেকশন, তাগাদা ও এক্সিকিউটিভ সামারি'
                      : 'Real-time installment collection, reminder suite & executive summary'}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <span className="hidden sm:inline-block text-[10px] text-slate-400 font-mono px-2 py-1 rounded bg-slate-800 border border-slate-700">
                  Alt + M
                </span>
                <button
                  type="button"
                  onClick={() => setIsOpen(false)}
                  className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-xl transition-colors cursor-pointer"
                  title="Close (Esc)"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Collection Gauge & Stats Ribbon */}
            <div className="bg-slate-50 border-b border-slate-200/90 px-6 py-4 space-y-3 shrink-0">
              <div className="flex items-center justify-between text-xs">
                <div>
                  <span className="text-[10px] font-semibold text-slate-500 block">
                    {isBn ? 'আদায়কৃত তহবিল' : 'Total Collected'}
                  </span>
                  <strong className="text-emerald-700 font-mono font-extrabold text-base sm:text-lg">
                    Tk. {totalCollected.toLocaleString('en-IN')}
                  </strong>
                  <span className="text-[10px] text-slate-500 font-medium ml-1">
                    ({paidShares.length} {isBn ? 'টি শেয়ার' : 'Shares'})
                  </span>
                </div>

                <div className="text-right">
                  <span className="text-[10px] font-semibold text-slate-500 block">
                    {isBn ? 'বকেয়া বাকি' : 'Total Outstanding'}
                  </span>
                  <strong className="text-rose-700 font-mono font-extrabold text-base sm:text-lg">
                    Tk. {totalPending.toLocaleString('en-IN')}
                  </strong>
                  <span className="text-[10px] text-slate-500 font-medium ml-1">
                    ({unpaidShares.length} {isBn ? 'টি শেয়ার' : 'Shares'})
                  </span>
                </div>
              </div>

              {/* Gradient Progress Bar */}
              <div className="space-y-1">
                <div className="h-2.5 w-full bg-slate-200 rounded-full overflow-hidden p-0.5 shadow-inner">
                  <div
                    className="h-full bg-gradient-to-r from-emerald-500 to-teal-500 rounded-full transition-transform duration-300 origin-left shadow-sm"
                    style={{ transform: `scaleX(${collectionRate / 100})` }}
                  ></div>
                </div>
                <div className="flex items-center justify-between text-[11px] font-medium text-slate-500">
                  <span>
                    {isBn ? 'আদায় সম্পন্ন' : 'Completion'}: <strong className="text-slate-800 font-mono">{collectionRate.toFixed(1)}%</strong>
                  </span>
                  <span className="text-emerald-700 font-medium flex items-center gap-1">
                    <CheckCircle2 className="w-3 h-3" />
                    <span>
                      {paidShares.length} / {activeShares.length} {isBn ? 'শেয়ার পরিশোধিত' : 'Shares Paid'}
                    </span>
                  </span>
                </div>
              </div>
            </div>

            {/* Segmented Filter Tabs & Search Bar */}
            <div className="px-4 sm:px-6 pt-3 sm:pt-4 pb-2 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 sm:gap-3 shrink-0">
              {/* Segmented Tabs */}
              <div className="flex items-center p-1 bg-slate-100 rounded-xl border border-slate-200/80 text-xs">
                <button
                  type="button"
                  onClick={() => setActiveTab('pending')}
                  className={`px-3 py-1.5 rounded-lg font-bold flex items-center gap-1.5 transition-colors duration-150 cursor-pointer ${
                    activeTab === 'pending'
                      ? 'bg-rose-600 text-white shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <AlertTriangle className="w-3.5 h-3.5" />
                  <span>{isBn ? 'অপরিশোধিত' : 'Unpaid'}</span>
                  <span className={`px-1.5 py-0.2 rounded-full text-[10px] font-mono ${
                    activeTab === 'pending' ? 'bg-white/20 text-white' : 'bg-rose-100 text-rose-800 font-bold'
                  }`}>
                    {unpaidShares.length}
                  </span>
                </button>

                <button
                  type="button"
                  onClick={() => setActiveTab('paid')}
                  className={`px-3 py-1.5 rounded-lg font-bold flex items-center gap-1.5 transition-colors duration-150 cursor-pointer ${
                    activeTab === 'paid'
                      ? 'bg-emerald-600 text-white shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>{isBn ? 'পরিশোধিত' : 'Paid'}</span>
                  <span className={`px-1.5 py-0.2 rounded-full text-[10px] font-mono ${
                    activeTab === 'paid' ? 'bg-white/20 text-white' : 'bg-emerald-100 text-emerald-800 font-bold'
                  }`}>
                    {paidShares.length}
                  </span>
                </button>

                <button
                  type="button"
                  onClick={() => setActiveTab('analytics')}
                  className={`px-3 py-1.5 rounded-lg font-bold flex items-center gap-1.5 transition-colors duration-150 cursor-pointer ${
                    activeTab === 'analytics'
                      ? 'bg-slate-900 text-white shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <PieChart className="w-3.5 h-3.5" />
                  <span>{isBn ? 'অ্যানালিটিক্স' : 'Channels'}</span>
                </button>
              </div>

              {/* Quick Search */}
              {activeTab !== 'analytics' && (
                <div className="relative flex-1 sm:max-w-xs">
                  <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder={
                      isBn ? 'নাম বা আইডি দিয়ে খুঁজুন...' : 'Search member or PAS-ID...'
                    }
                    className="w-full pl-8 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 shadow-2xs"
                  />
                </div>
              )}
            </div>

            {/* ========================================================================= */}
            {/* TAB CONTENTS (SCROLLABLE LISTS) */}
            {/* ========================================================================= */}
            <div className="p-6 overflow-y-auto flex-1 space-y-3">
              {/* ------------------------------------------------------------- */}
              {/* TAB 1: PENDING / UNPAID MEMBERS (HIGH PRIORITY) */}
              {/* ------------------------------------------------------------- */}
              {activeTab === 'pending' && (
                <div className="space-y-2.5">
                  {filteredUnpaid.length === 0 ? (
                    <div className="p-8 text-center bg-emerald-50/60 rounded-2xl border border-emerald-200">
                      <CheckCircle2 className="w-10 h-10 text-emerald-600 mx-auto mb-2" />
                      <h4 className="font-bold text-slate-800 text-sm">
                        {isBn
                          ? 'অভিনন্দন! কোনো অপরিশোধিত কিস্তি নেই।'
                          : 'All members have paid for this month!'}
                      </h4>
                      <p className="text-xs text-slate-500 mt-1">
                        {isBn
                          ? `চলতি মাসের (${currentMonth}) শতভাগ কিস্তি আদায় সম্পন্ন হয়েছে।`
                          : `100% installments collected for ${currentMonth}.`}
                      </p>
                    </div>
                  ) : (
                    filteredUnpaid.map((share) => (
                      <div
                        key={share.id}
                        className="p-3.5 bg-white rounded-2xl border border-rose-200/80 shadow-xs hover:border-rose-400 hover:shadow-md transition-shadow duration-150 flex flex-col sm:flex-row sm:items-center justify-between gap-3 group"
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          <div className="w-9 h-9 rounded-xl bg-rose-100 text-rose-800 font-bold font-mono text-xs flex items-center justify-center shrink-0">
                            {share.id.replace('PAS-', '')}
                          </div>
                          <div className="min-w-0">
                            <div className="flex items-center gap-2">
                              <h5 className="font-bold text-xs sm:text-sm text-slate-900 truncate">
                                {share.memberName}
                              </h5>
                              <span className="px-1.5 py-0.2 rounded text-[10px] font-mono font-bold bg-rose-100 text-rose-800">
                                {share.id}
                              </span>
                            </div>
                            <p className="text-[11px] text-slate-500 truncate mt-0.5">
                              {share.phone || 'No phone'} &bull;{' '}
                              <strong className="text-rose-700 font-mono">
                                Tk. 2,800 {isBn ? 'বকেয়া' : 'due'}
                              </strong>
                            </p>
                          </div>
                        </div>

                        {/* Action Buttons Suite */}
                        <div className="flex items-center gap-1.5 shrink-0 self-end sm:self-center">
                          {/* 1-Click Collect Payment */}
                          <button
                            type="button"
                            onClick={() => {
                              setIsOpen(false);
                              onOpenPaymentForShare(share, currentMonth as MonthKey);
                            }}
                            className="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center gap-1 shadow-sm transition-colors duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 cursor-pointer"
                            title={isBn ? 'সরাসরি পেমেন্ট এন্ট্রি নিন' : 'Collect Payment'}
                          >
                            <CreditCard className="w-3.5 h-3.5" />
                            <span>{isBn ? 'পেমেন্ট গ্রহণ' : 'Collect'}</span>
                          </button>

                          {/* WhatsApp Reminder Button */}
                          {share.phone && (
                            <button
                              type="button"
                              onClick={() => handleOpenWhatsApp(share)}
                              className="p-1.5 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 transition-colors cursor-pointer"
                              title={isBn ? 'WhatsApp-এ তাগাদা পাঠান' : 'Send WhatsApp Reminder'}
                            >
                              <MessageCircle className="w-4 h-4" />
                            </button>
                          )}

                          {/* Copy Message Text */}
                          <button
                            type="button"
                            onClick={() => handleCopySingleReminder(share)}
                            className="p-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors cursor-pointer"
                            title={isBn ? 'তাগাদা মেসেজ কপি করুন' : 'Copy Reminder Message'}
                          >
                            {copiedId === share.id ? (
                              <Check className="w-4 h-4 text-emerald-600" />
                            ) : (
                              <Copy className="w-4 h-4" />
                            )}
                          </button>

                          {/* Direct Call Link */}
                          {share.phone && (
                            <a
                              href={`tel:${share.phone}`}
                              className="p-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors cursor-pointer"
                              title={isBn ? 'সরাসরি কল দিন' : 'Call Member'}
                            >
                              <Phone className="w-4 h-4" />
                            </a>
                          )}
                        </div>
                      </div>
                    ))
                  )}
                </div>
              )}

              {/* ------------------------------------------------------------- */}
              {/* TAB 2: PAID MEMBERS LIST */}
              {/* ------------------------------------------------------------- */}
              {activeTab === 'paid' && (
                <div className="space-y-2">
                  {filteredPaid.map((share) => {
                    const monthData = share.months[currentMonth];
                    return (
                      <div
                        key={share.id}
                        className="p-3 bg-white rounded-2xl border border-slate-200 hover:border-emerald-300 transition-colors duration-150 flex items-center justify-between gap-3 text-xs"
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          <div className="w-8 h-8 rounded-xl bg-emerald-100 text-emerald-800 font-bold font-mono text-xs flex items-center justify-center shrink-0">
                            <Check className="w-4 h-4 stroke-[3]" />
                          </div>
                          <div className="min-w-0">
                            <div className="flex items-center gap-2">
                              <h5 className="font-bold text-slate-900 truncate">
                                {share.memberName}
                              </h5>
                              <span className="px-1.5 py-0.2 rounded text-[10px] font-mono bg-slate-100 text-slate-700 font-bold">
                                {share.id}
                              </span>
                            </div>
                            <p className="text-[11px] text-slate-500 truncate mt-0.5">
                              {monthData?.date || 'Deposited'} &bull;{' '}
                              <span className="text-emerald-700 font-semibold font-mono">
                                Tk. {monthData?.amount?.toLocaleString('en-IN') || '2,800'}
                              </span>{' '}
                              &bull; {monthData?.paymentMethod || 'Bank Deposit'}
                            </p>
                          </div>
                        </div>

                        {/* View Receipt Button */}
                        <button
                          type="button"
                          onClick={() => {
                            setIsOpen(false);
                            onOpenReceiptForShare(share, currentMonth as MonthKey);
                          }}
                          className="px-2.5 py-1.5 rounded-lg border border-slate-200 hover:bg-slate-100 text-slate-700 font-semibold text-xs flex items-center gap-1 transition-colors cursor-pointer shrink-0"
                          title={isBn ? 'মানি রসিদ দেখুন' : 'View Money Receipt'}
                        >
                          <Receipt className="w-3.5 h-3.5 text-emerald-600" />
                          <span>{isBn ? 'রসিদ' : 'Receipt'}</span>
                        </button>
                      </div>
                    );
                  })}
                </div>
              )}

              {/* ------------------------------------------------------------- */}
              {/* TAB 3: CHANNELS & PAYMENT ANALYTICS */}
              {/* ------------------------------------------------------------- */}
              {activeTab === 'analytics' && (
                <div className="space-y-4">
                  <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-3">
                    <span className="font-semibold text-xs text-slate-700 block">
                      {isBn ? 'পেমেন্ট চ্যানেল ভিত্তিক ব্রেকডাউন' : 'Payment Method Distribution'}
                    </span>

                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                      {Object.entries(methodStats).map(([method, data]) => (
                        <div
                          key={method}
                          className="p-3 bg-white rounded-xl border border-slate-200/80 shadow-2xs space-y-1"
                        >
                          <span className="text-[10px] font-semibold text-slate-500 block truncate">
                            {method}
                          </span>
                          <strong className="text-slate-900 font-mono text-sm block">
                            Tk. {data.amount.toLocaleString('en-IN')}
                          </strong>
                          <span className="text-[10px] text-emerald-700 font-medium block">
                            {data.count} {isBn ? 'টি পেমেন্ট' : 'deposits'}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Society Total Equity Ratio */}
                  <div className="p-4 bg-emerald-50/50 rounded-2xl border border-emerald-200/80 space-y-2 text-xs">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-slate-700">
                        {isBn ? 'চলতি মাসের মোট প্রদেয় ফান্ড' : 'Expected Month Total'}:
                      </span>
                      <strong className="font-mono text-slate-900 text-sm">
                        Tk. {(activeShares.length * 2800).toLocaleString('en-IN')}
                      </strong>
                    </div>
                    <div className="flex items-center justify-between text-emerald-800">
                      <span>{isBn ? 'আদায়কৃত অনুপাত' : 'Realized Ratio'}:</span>
                      <strong className="font-mono text-sm font-bold">
                        {collectionRate.toFixed(1)}%
                      </strong>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* ========================================================================= */}
            {/* BOTTOM EXECUTIVE ACTION BAR (1-CLICK WHATSAPP REPORT) */}
            {/* ========================================================================= */}
            <div className="p-4 bg-slate-900 text-white flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-t border-slate-800 shrink-0">
              <div className="flex items-center gap-2 text-xs text-slate-300">
                <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
                <span>
                  {isBn
                    ? `চলতি মাস: ${currentMonth} (${paidShares.length} পরিশোধিত, ${unpaidShares.length} বাকি)`
                    : `Active: ${currentMonth} (${paidShares.length} paid, ${unpaidShares.length} pending)`}
                </span>
              </div>

              {/* Golden 1-Click WhatsApp Report Generator */}
              <button
                type="button"
                onClick={handleCopyBulletin}
                className="px-4 py-2 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-md transition-colors duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 cursor-pointer"
                title={isBn ? 'কমিটির জন্য আজকের বুলেটিন কপি করুন' : 'Copy WhatsApp Bulletin'}
              >
                {copiedBulletin ? (
                  <>
                    <Check className="w-4 h-4 stroke-[3]" />
                    <span>{isBn ? 'বুলেটিন কপি হয়েছে!' : 'Bulletin Copied!'}</span>
                  </>
                ) : (
                  <>
                    <Share2 className="w-4 h-4" />
                    <span>{isBn ? 'কমিটি WhatsApp বুলেটিন কপি' : 'Copy WhatsApp Bulletin'}</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

