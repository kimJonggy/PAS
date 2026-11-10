import React, { useState } from 'react';
import { ShareRecord, MonthKey, ALL_MONTHS, SocietySummary } from '../types';
import { formatTaka, getPenaltyStage, isMonthPast } from '../utils/calculations';
import { CalculationBreakdownModal } from './CalculationBreakdownModal';
import {
  Receipt,
  CreditCard,
  ChevronRight,
  AlertTriangle,
  CheckCircle,
  Clock,
  Trash2,
  SlidersHorizontal,
  ChevronLeft,
  Calendar,
  Layers,
  Calculator,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';

interface MasterLedgerTableProps {
  shares: ShareRecord[];
  summary: SocietySummary;
  onOpenPaymentForShare: (share: ShareRecord, month?: MonthKey) => void;
  onOpenReceiptForShare: (share: ShareRecord, month?: MonthKey) => void;
  onSelectMember: (memberName: string) => void;
  onDeleteShare?: (shareId: string) => void;
  // Month Configuration & Display Props
  allConfiguredMonths: string[];
  activeMonths: string[];
  currentMonth: string;
  onOpenMonthSettings: () => void;
}

export const MasterLedgerTable: React.FC<MasterLedgerTableProps> = ({
  shares,
  summary,
  onOpenPaymentForShare,
  onOpenReceiptForShare,
  onSelectMember,
  onDeleteShare,
  allConfiguredMonths,
  activeMonths,
  currentMonth,
  onOpenMonthSettings,
}) => {
  const { requireAdmin } = useAuth();
  const { t } = useLanguage();
  const [shareToDelete, setShareToDelete] = useState<ShareRecord | null>(null);
  const [breakdownShare, setBreakdownShare] = useState<ShareRecord | null>(null);

  const currentPenaltyStage = getPenaltyStage();

  // Determine if months exceed 4 to apply horizontal scrolling specifically to the months section
  const isMonthScrollActive = activeMonths.length > 4;
  const isCurrentMonthOnly = activeMonths.length === 1 && activeMonths[0] === currentMonth;

  return (
    <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/90 dark:border-slate-800 shadow-xs overflow-hidden">
      {/* Table toolbar / header info */}
      <div className="px-5 py-3.5 border-b border-slate-200 dark:border-slate-800 bg-slate-50/80 dark:bg-slate-900/90 flex flex-col md:flex-row md:items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div>
            <h2 className="text-base font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
              <span>{t('ledgerTitle')}</span>
              <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                {shares.length} {t('records')}
              </span>
            </h2>
          </div>
        </div>

        {/* Setting Button & Month Visibility Status */}
        <div className="flex items-center flex-wrap gap-2">
          {/* Active Penalty Stage Badge */}
          <div
            className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-xl text-xs font-bold border cursor-pointer hover:opacity-90 shadow-2xs ${
              currentPenaltyStage.stage === 1
                ? 'bg-emerald-50 dark:bg-emerald-950/60 border-emerald-300 dark:border-emerald-700 text-emerald-900 dark:text-emerald-300'
                : currentPenaltyStage.stage === 2
                ? 'bg-amber-50 dark:bg-amber-950/60 border-amber-300 dark:border-amber-700 text-amber-900 dark:text-amber-300'
                : 'bg-rose-50 dark:bg-rose-950/60 border-rose-300 dark:border-rose-700 text-rose-900 dark:text-rose-300'
            }`}
            title={`${currentPenaltyStage.description} — Click on any Due/Fee cell in the table to see the full calculation breakdown.`}
          >
            <span
              className={`w-2 h-2 rounded-full ${
                currentPenaltyStage.stage === 1
                  ? 'bg-emerald-500'
                  : currentPenaltyStage.stage === 2
                  ? 'bg-amber-500'
                  : 'bg-rose-500 animate-pulse motion-reduce:animate-none'
              }`}
            />
            <span>{currentPenaltyStage.badge}</span>
          </div>

          {isCurrentMonthOnly ? (
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl bg-amber-50 dark:bg-amber-950/60 border border-amber-300 dark:border-amber-700 text-amber-900 dark:text-amber-300 text-xs font-bold">
              <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse motion-reduce:animate-none" />
              <span>{t('currentMonth')}: <strong>{currentMonth}</strong></span>
            </div>
          ) : (
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-300 text-xs font-semibold">
              <Calendar className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
              <span>Active: {activeMonths.join(', ')}</span>
            </div>
          )}

          {/* Month Configuration Button */}
          <button
            type="button"
            onClick={() => {
              requireAdmin(() => {
                onOpenMonthSettings();
              }, 'configure ledger months and display settings');
            }}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 border border-slate-300 dark:border-slate-700 hover:border-slate-400 text-xs font-bold shadow-2xs transition-colors duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 cursor-pointer print:hidden"
            title="Configure billing months: Add, remove, hide, or focus on current month"
          >
            <SlidersHorizontal className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
            <span>{t('monthSettings')}</span>
            {isMonthScrollActive && (
              <span className="px-1.5 py-0.2 rounded bg-emerald-100 dark:bg-emerald-900/60 text-emerald-800 dark:text-emerald-300 text-[10px]">
                Scroll
              </span>
            )}
          </button>
        </div>
      </div>

      {/* Mobile Horizontal Swipe Affordance Bar */}
      <div className="md:hidden px-3.5 py-2 bg-emerald-50/90 dark:bg-emerald-950/60 border-b border-emerald-200/60 dark:border-emerald-800/60 flex items-center justify-between text-[11px] text-emerald-950 dark:text-emerald-200 print:hidden">
        <span className="flex items-center gap-1.5 font-medium">
          <ChevronRight className="w-3.5 h-3.5 text-emerald-700 dark:text-emerald-400 shrink-0" />
          <span>সব মাসের হিসাব দেখতে ডানে সোয়াইপ করুন</span>
        </span>
        <span className="text-[10px] font-bold text-emerald-800 dark:text-emerald-300 bg-white dark:bg-slate-900 px-2 py-0.5 rounded border border-emerald-300 dark:border-emerald-700">
          স্ক্রোল
        </span>
      </div>

      {/* Main Table Container */}
      <div className="overflow-x-auto print:overflow-visible overscroll-x-contain [scrollbar-width:thin] [-webkit-overflow-scrolling:touch]">
        <table className="w-full text-left text-xs border-collapse">
          {/* Multi-tier Table Head */}
          <thead className="bg-slate-100 dark:bg-slate-800/80 text-slate-700 dark:text-slate-300 border-b border-slate-300 dark:border-slate-700 font-semibold select-none">
            {/* Top row */}
            <tr>
              <th rowSpan={2} className="px-2 py-2.5 border-r border-slate-300 dark:border-slate-700 w-10 text-center bg-slate-100 dark:bg-slate-800 sticky left-0 z-10">
                {t('colSl')}
              </th>
              <th rowSpan={2} className="px-2.5 py-2.5 border-r-2 border-slate-300 dark:border-slate-700 min-w-[120px] sm:min-w-[130px] lg:min-w-[160px] sticky left-10 z-10 bg-slate-100 dark:bg-slate-800">
                {t('colMemberName')}
              </th>
              <th rowSpan={2} className="px-2 py-2.5 border-r border-slate-300 dark:border-slate-700 text-center min-w-[70px] bg-slate-100 dark:bg-slate-800">
                {t('colShareId')}
              </th>
              <th rowSpan={2} className="px-2 py-2.5 border-r-2 border-slate-300 dark:border-slate-700 text-right min-w-[75px] bg-slate-50 dark:bg-slate-800/70">
                {t('colAdmissionFee')}
              </th>

              {/* Month Columns Groups - Only displays activeMonths */}
              {activeMonths.map((m) => {
                const isCurrent = m === currentMonth;
                return (
                  <th
                    key={m}
                    colSpan={2}
                    className={`px-1.5 py-1.5 text-center font-bold transition-colors ${
                      isCurrent
                        ? 'bg-emerald-600 text-white border-r-2 border-emerald-700'
                        : 'bg-slate-200/80 dark:bg-slate-800 text-slate-800 dark:text-slate-200 border-r-2 border-slate-300 dark:border-slate-700'
                    }`}
                  >
                    <div className="flex items-center justify-center gap-1">
                      <span>{m}</span>
                      {isCurrent && (
                        <span className="text-[9px] px-1 py-0.2 rounded bg-white/20 text-white font-semibold">
                          {t('currentMonth')}
                        </span>
                      )}
                    </div>
                  </th>
                );
              })}

              <th rowSpan={2} className="px-2 py-2.5 border-r border-slate-300 dark:border-slate-700 text-right min-w-[80px] bg-emerald-50/70 dark:bg-emerald-950/40 text-emerald-900 dark:text-emerald-300 font-bold">
                {t('colTotalDeposit')}
              </th>
              <th rowSpan={2} className="px-1.5 py-2.5 border-r border-slate-300 dark:border-slate-700 text-center min-w-[50px] bg-amber-50/40 dark:bg-amber-950/30 text-slate-700 dark:text-slate-300">
                {t('colDueMths')}
              </th>
              <th rowSpan={2} className="px-2 py-2.5 border-r border-slate-300 dark:border-slate-700 text-right min-w-[75px] bg-amber-50/70 dark:bg-amber-950/40 text-amber-900 dark:text-amber-200 font-semibold">
                {t('colDueAmount')}
              </th>
              <th rowSpan={2} className="px-1.5 py-2.5 border-r border-slate-300 dark:border-slate-700 text-right min-w-[65px] bg-rose-50/50 dark:bg-rose-950/30 text-rose-900 dark:text-rose-300 font-semibold">
                {t('colLateFeeFine')}
              </th>
              <th rowSpan={2} className="px-2 py-2.5 border-r border-slate-300 dark:border-slate-700 text-right min-w-[75px] bg-rose-100/70 dark:bg-rose-950/50 text-rose-950 dark:text-rose-200 font-bold">
                {t('colTotalDue')}
              </th>
              <th rowSpan={2} className="px-1.5 py-2.5 border-r border-slate-300 dark:border-slate-700 text-center min-w-[60px] bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                {t('colLateFeePaid')}
              </th>
              <th rowSpan={2} className="px-2 py-2.5 text-center min-w-[80px] bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 print:hidden">
                {t('colActions')}
              </th>
            </tr>

            {/* Sub-row for Date & Amount */}
            <tr className="border-t border-slate-200 dark:border-slate-700 text-xs text-slate-600 dark:text-slate-300 bg-slate-50 dark:bg-slate-800/80">
              {activeMonths.map((m) => {
                const isCurrent = m === currentMonth;
                return (
                  <React.Fragment key={`${m}-sub`}>
                    <th
                      className={`px-2 py-1.5 border-r border-slate-200/60 dark:border-slate-700 text-center font-medium w-16 ${
                        isCurrent ? 'bg-emerald-50/80 dark:bg-emerald-950/50 text-emerald-950 dark:text-emerald-200 font-semibold' : 'bg-slate-50 dark:bg-slate-800/60'
                      }`}
                    >
                      {t('colDate')}
                    </th>
                    <th
                      className={`px-2 py-1.5 border-r-2 ${
                        isCurrent ? 'border-emerald-500/50 bg-emerald-50/80 dark:bg-emerald-950/50 text-emerald-950 dark:text-emerald-200 font-semibold' : 'border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/60'
                      } text-right font-medium w-16`}
                    >
                      {t('colAmount')}
                    </th>
                  </React.Fragment>
                );
              })}
            </tr>
          </thead>

          {/* Table Body */}
          <tbody className="divide-y divide-slate-200 text-slate-800 font-mono">
            {shares.map((share, idx) => {
              const hasDue = share.dueMonths > 0;
              const isClosed = share.isClosed;

              return (
                <tr
                  key={`${share.id}-${idx}`}
                  className={`transition-colors ${
                    isClosed
                      ? 'row-closed bg-slate-100/60 text-slate-500'
                      : hasDue
                      ? 'row-has-due bg-amber-50/40 text-slate-900 hover:bg-amber-100/40'
                      : 'bg-white hover:bg-slate-50/70'
                  }`}
                >
                  {/* SL */}
                  <td
                    className={`px-2 py-2 border-r border-slate-200 text-center font-sans sticky left-0 z-10 ${
                      isClosed
                        ? 'bg-slate-100 text-slate-400'
                        : hasDue
                        ? 'bg-amber-50 text-amber-900 font-bold'
                        : 'bg-white text-slate-500'
                    }`}
                  >
                    {share.sl || '-'}
                  </td>

                  {/* Member Name */}
                  <td
                    className={`px-3 py-2 border-r-2 border-slate-300 font-sans font-bold text-sm sticky left-10 z-10 ${
                      isClosed
                        ? 'bg-slate-100 text-slate-400'
                        : hasDue
                        ? 'bg-amber-50 text-slate-950 font-bold'
                        : 'bg-white text-slate-900'
                    }`}
                  >
                    <div className="flex items-center justify-between gap-1 group">
                      <button
                        onClick={() => !isClosed && onSelectMember(share.memberName)}
                        className={`text-left hover:text-emerald-700 transition-colors truncate max-w-[170px] ${
                          isClosed ? 'text-slate-400 italic font-normal' : 'text-slate-900 font-bold'
                        }`}
                        title={share.memberName}
                      >
                        {share.memberName || '—'}
                      </button>
                      {!isClosed && (
                        <button
                          onClick={() => onSelectMember(share.memberName)}
                          className="opacity-0 group-hover:opacity-100 text-slate-400 hover:text-emerald-600 p-0.5"
                          title="View member profile"
                        >
                          <ChevronRight className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  </td>

                  {/* Share ID */}
                  <td className="px-3 py-2.5 border-r border-slate-200 text-center">
                    <span
                      className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-bold ${
                        isClosed
                          ? 'bg-slate-200 text-slate-600'
                          : hasDue
                          ? 'bg-amber-100 text-amber-900 border border-amber-400/90 shadow-2xs font-extrabold ring-1 ring-amber-300/40'
                          : 'bg-slate-100 text-slate-700'
                      }`}
                    >
                      {hasDue && <span className="w-1.5 h-1.5 rounded-full bg-amber-500 shrink-0" />}
                      <span>{share.id}</span>
                    </span>
                  </td>

                  {/* Admission Fee */}
                  <td className="px-3 py-2.5 border-r-2 border-slate-300 text-right font-medium">
                    {share.admissionFee.toLocaleString('en-IN')}
                  </td>

                  {/* Monthly Payments (Dynamically rendered based on activeMonths) */}
                  {activeMonths.map((m) => {
                    const pay = share.months?.[m] || { status: 'upcoming', amount: 2800 };
                    const isCurrentMonth = m === currentMonth;
                    const monthDividerClass = isCurrentMonth ? 'border-r-2 border-emerald-400/80' : 'border-r-2 border-slate-300';

                    if (isClosed) {
                      return (
                        <React.Fragment key={m}>
                          <td className="px-2 py-2 border-r border-slate-200/60 text-center text-slate-400">-</td>
                          <td className={`px-2 py-2 ${monthDividerClass} text-right text-slate-400`}>-</td>
                        </React.Fragment>
                      );
                    }

                    const isPaid = pay.status === 'paid';
                    const isPast = isMonthPast(m, currentMonth);
                    const isCurrentPastDeadline = m === currentMonth && new Date().getDate() > 15;
                    const isDue = !isPaid && (pay.status === 'due' || isPast || isCurrentPastDeadline);

                    if (isPaid) {
                      return (
                        <React.Fragment key={m}>
                          <td className={`px-2 py-2 border-r border-slate-200/60 text-center text-slate-600 text-xs font-mono ${
                            isCurrentMonth ? 'bg-emerald-50/25' : ''
                          }`}>
                            {pay.date || '-'}
                          </td>
                          <td className={`px-2 py-2 ${monthDividerClass} text-right font-medium text-emerald-800 ${
                            isCurrentMonth ? 'bg-emerald-50/50 font-bold' : 'bg-emerald-50/20'
                          }`}>
                            <button
                              onClick={() => onOpenReceiptForShare(share, m)}
                              className="hover:underline hover:text-emerald-600 cursor-pointer font-semibold"
                              title={`Click to View Receipt or Edit / Void Payment for ${share.id} (${m})`}
                            >
                              {pay.amount.toLocaleString('en-IN')}
                            </button>
                          </td>
                        </React.Fragment>
                      );
                    } else if (isDue) {
                      return (
                        <React.Fragment key={m}>
                          <td className="px-2 py-2 border-r border-slate-200/60 text-center text-rose-600 font-semibold bg-rose-50/60 font-sans text-xs">
                            Due
                          </td>
                          <td className={`px-2 py-2 ${monthDividerClass} text-right bg-rose-50/60 font-semibold text-rose-700`}>
                            <button
                              onClick={() => onOpenPaymentForShare(share, m)}
                              className="px-2 py-0.5 rounded bg-rose-100 hover:bg-rose-200 text-rose-800 text-xs font-sans font-bold inline-flex items-center gap-0.5 cursor-pointer"
                              title={`Record payment for ${share.id} (${m})`}
                            >
                              <span>{pay.amount ? pay.amount.toLocaleString('en-IN') : '2,800'}</span>
                            </button>
                          </td>
                        </React.Fragment>
                      );
                    } else {
                      // Upcoming or Current Unpaid
                      return (
                        <React.Fragment key={m}>
                          <td className={`px-2 py-2 border-r border-slate-200/60 text-center text-slate-400 ${
                            isCurrentMonth ? 'bg-emerald-50/25' : ''
                          }`}>
                            {isCurrentMonth ? (
                              <span className="inline-block px-1.5 py-0.5 rounded text-[10px] font-semibold bg-emerald-100/70 text-emerald-800 border border-emerald-300">
                                Current
                              </span>
                            ) : (
                              '-'
                            )}
                          </td>
                          <td className={`px-2 py-2 ${monthDividerClass} text-right text-slate-400 ${
                            isCurrentMonth ? 'bg-emerald-50/25' : ''
                          }`}>
                            <button
                              onClick={() => onOpenPaymentForShare(share, m)}
                              className={`hover:underline cursor-pointer ${
                                isCurrentMonth
                                  ? 'font-extrabold text-emerald-800 hover:text-emerald-950'
                                  : 'text-slate-400 hover:text-slate-700'
                              }`}
                              title={
                                isCurrentMonth
                                  ? `Record ${m} installment for ${share.id}`
                                  : `Advance payment for ${share.id} (${m})`
                              }
                            >
                              {isCurrentMonth ? '2,800' : '-'}
                            </button>
                          </td>
                        </React.Fragment>
                      );
                    }
                  })}

                  {/* Total Deposit */}
                  <td className="px-2.5 py-2 border-r border-slate-200 text-right font-bold text-emerald-700 bg-emerald-50/30">
                    {share.totalDeposit.toLocaleString('en-IN')}
                  </td>

                  {/* Due Months */}
                  <td className="px-2 py-2 border-r border-slate-200 text-center">
                    {share.dueMonths > 0 ? (
                      <span className="inline-block px-1.5 py-0.5 rounded-full bg-amber-100 text-amber-900 font-bold text-xs">
                        {share.dueMonths}
                      </span>
                    ) : (
                      <span className="text-slate-400">-</span>
                    )}
                  </td>

                  {/* Due Amount */}
                  <td className="px-2.5 py-2 border-r border-slate-200 text-right font-medium text-amber-900 bg-amber-50/30">
                    {share.dueAmount > 0 ? (
                      <button
                        type="button"
                        onClick={() => setBreakdownShare(share)}
                        className="hover:underline font-mono font-bold text-amber-900 inline-flex items-center gap-1 cursor-pointer group"
                        title="Click to view total due & late fee breakdown"
                      >
                        <span>{share.dueAmount.toLocaleString('en-IN')}</span>
                        <Calculator className="w-3 h-3 text-amber-600 opacity-60 group-hover:opacity-100 transition-opacity" />
                      </button>
                    ) : (
                      '-'
                    )}
                  </td>

                  {/* Late Fee */}
                  <td className="px-2 py-2 border-r border-slate-200 text-right text-rose-700">
                    {share.lateFee > 0 ? (
                      <button
                        type="button"
                        onClick={() => setBreakdownShare(share)}
                        className="hover:underline font-mono font-bold text-rose-700 inline-flex items-center gap-1 cursor-pointer group"
                        title="Click to view total due & late fee breakdown"
                      >
                        <span>
                          {Number(share.lateFee.toFixed(2)).toLocaleString('en-IN', {
                            maximumFractionDigits: 2,
                          })}
                        </span>
                        <Calculator className="w-3 h-3 text-rose-500 opacity-60 group-hover:opacity-100 transition-opacity" />
                      </button>
                    ) : (
                      '-'
                    )}
                  </td>

                  {/* Total Due */}
                  <td className="px-2.5 py-2 border-r border-slate-200 text-right font-bold text-rose-800 bg-rose-50/40">
                    {share.totalDue > 0 ? (
                      <button
                        type="button"
                        onClick={() => setBreakdownShare(share)}
                        className="hover:underline font-mono font-extrabold text-rose-700 inline-flex items-center gap-1 cursor-pointer group"
                        title="Click to view total due & late fee breakdown"
                      >
                        <span>
                          {Number(share.totalDue.toFixed(2)).toLocaleString('en-IN', {
                            maximumFractionDigits: 2,
                          })}
                        </span>
                        <Calculator className="w-3 h-3 text-rose-600 opacity-70 group-hover:opacity-100 transition-opacity" />
                      </button>
                    ) : (
                      <span className="text-slate-400">-</span>
                    )}
                  </td>

                  {/* Late Fee Paid */}
                  <td className="px-2 py-2 border-r border-slate-200 text-center text-slate-600">
                    {share.lateFeePaid > 0 ? share.lateFeePaid.toLocaleString('en-IN') : '-'}
                  </td>

                  {/* Actions */}
                  <td className="px-2 py-2 text-center font-sans print:hidden">
                    <div className="flex items-center justify-center gap-1.5">
                      <button
                        onClick={() => onOpenPaymentForShare(share)}
                        className="px-2.5 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold shadow-2xs transition-colors duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 cursor-pointer"
                        title="Record payment or dues"
                      >
                        {t('payBtn')}
                      </button>
                      <button
                        onClick={() => onOpenReceiptForShare(share, (currentMonth as MonthKey) || (activeMonths[0] as MonthKey) || 'Nov-26')}
                        className="p-1 rounded-lg text-slate-500 hover:text-emerald-700 hover:bg-emerald-50 transition-colors cursor-pointer"
                        title="View Official Money Receipt"
                      >
                        <Receipt className="w-4 h-4" />
                      </button>
                      {onDeleteShare && !isClosed && (
                        <button
                          onClick={() => setShareToDelete(share)}
                          className="p-1 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
                          title="Delete share from register"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>

          {/* Grand Total Row matching the original Excel spreadsheet - Frozen at Bottom */}
          <tfoot className="sticky bottom-0 z-20 bg-slate-900 text-white font-mono font-bold shadow-md border-t-2 border-slate-700">
            <tr className="bg-slate-900">
              <td colSpan={2} className="px-3 py-3 border-r border-slate-800 text-left font-sans font-bold text-amber-400 text-xs sticky left-0 z-30 bg-slate-900">
                {t('grandTotal')}
              </td>
              <td className="px-3 py-3 border-r border-slate-800 text-center font-sans text-xs text-slate-300 bg-slate-900">
                {summary.totalShareIds} IDs
              </td>
              <td className="px-3 py-3 border-r-2 border-slate-700 text-right text-emerald-300 bg-slate-900">
                {summary.totalAdmissionCollected.toLocaleString('en-IN')}
              </td>

              {/* Monthly totals for visible activeMonths */}
              {activeMonths.map((m) => {
                const isCurrent = m === currentMonth;
                const stat = summary.monthStats?.[m] || { paidShares: 0, paidAmount: 0 };
                return (
                  <React.Fragment key={`${m}-total`}>
                    <td className={`px-2 py-2 border-r border-slate-800/80 text-center text-slate-400 text-[11px] ${
                      isCurrent ? 'bg-emerald-950/70 text-emerald-300 font-semibold' : ''
                    }`}>
                      {stat.paidShares > 0 ? `${stat.paidShares} Paid` : '—'}
                    </td>
                    <td className={`px-2 py-2 border-r-2 ${
                      isCurrent ? 'border-emerald-600 bg-emerald-950/70' : 'border-slate-700'
                    } text-right text-emerald-300 text-[11px]`}>
                      {stat.paidAmount > 0 ? stat.paidAmount.toLocaleString('en-IN') : '—'}
                    </td>
                  </React.Fragment>
                );
              })}

              {/* Grand Total Deposit (All months & admission combined exact calculation) */}
              <td className="px-3 py-3 border-r border-slate-800 text-right text-sm text-emerald-400 font-extrabold bg-emerald-950/40">
                {summary.totalBankDeposit.toLocaleString('en-IN')}
              </td>

              {/* Total Due Months */}
              <td className="px-2 py-3 border-r border-slate-800 text-center text-amber-400 text-xs">
                {summary.totalDueMonths}
              </td>

              {/* Total Due Amount */}
              <td className="px-3 py-3 border-r border-slate-800 text-right text-amber-300 text-xs">
                {summary.totalDuePrincipal.toLocaleString('en-IN')}
              </td>

              {/* Total Late Fee */}
              <td className="px-2 py-3 border-r border-slate-800 text-right text-rose-300 text-xs">
                {summary.totalLateFeeDue.toLocaleString('en-IN')}
              </td>

              {/* Total Due with Late Fee */}
              <td className="px-3 py-3 border-r border-slate-800 text-right text-rose-400 font-extrabold bg-rose-950/40 text-sm">
                {summary.totalOutstandingDue.toLocaleString('en-IN')}
              </td>

              {/* Late Fee Paid */}
              <td className="px-2 py-3 border-r border-slate-800 text-center text-slate-400 text-xs">
                {summary.totalLateFeeCollected > 0 ? summary.totalLateFeeCollected.toLocaleString('en-IN') : '-'}
              </td>

              <td className="px-3 py-3 text-center text-slate-400 font-sans text-xs print:hidden">
                Active {summary.totalActiveShares}
              </td>
            </tr>
          </tfoot>
        </table>
      </div>

      {/* Official Signatures & Seal (Visible on print / PDF only) */}
      <div className="hidden print:grid grid-cols-3 gap-8 pt-8 pb-3 mt-6 text-center text-xs text-slate-800 border-t border-slate-300 page-break-inside-avoid">
        <div>
          <div className="border-t border-slate-400 w-3/4 mx-auto pt-1 font-bold text-slate-900">
            Prepared By
          </div>
          <div className="text-[10px] text-slate-600">Accountant / হিসাবরক্ষক</div>
        </div>
        <div>
          <div className="border-t border-slate-400 w-3/4 mx-auto pt-1 font-bold text-slate-900">
            Verified By
          </div>
          <div className="text-[10px] text-slate-600">General Secretary / সাধারণ সম্পাদক</div>
        </div>
        <div>
          <div className="border-t border-slate-400 w-3/4 mx-auto pt-1 font-bold text-slate-900">
            Approved By
          </div>
          <div className="text-[10px] text-slate-600">President & Trustee / সভাপতি</div>
        </div>
      </div>

      {/* Delete Share Confirmation Dialog */}
      {shareToDelete && (
        <div className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-slate-950/75">
          <div className="relative w-full max-w-md bg-white rounded-2xl shadow-2xl border border-slate-300 p-6 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 rounded-full bg-rose-100 text-rose-700 flex items-center justify-center shrink-0">
                <Trash2 className="w-5 h-5" />
              </div>
              <div>
                <h4 className="font-bold text-slate-900 text-base">Delete Share from Register?</h4>
                <p className="text-xs text-slate-500">
                  {shareToDelete.id} &bull; {shareToDelete.memberName}
                </p>
              </div>
            </div>

            <p className="text-xs text-slate-600 leading-relaxed mb-6">
              Are you sure you want to delete share <strong>{shareToDelete.id}</strong> ({shareToDelete.memberName})? This will permanently remove the share from the society register.
              <span className="block text-slate-500 mt-1">
                আপনি কি নিশ্চিত যে এই শেয়ার এন্ট্রিটি পুরোপুরি মুছে ফেলতে চান?
              </span>
            </p>

            <div className="flex items-center justify-end gap-2.5">
              <button
                type="button"
                onClick={() => setShareToDelete(null)}
                className="px-4 py-2 rounded-lg border border-slate-300 hover:bg-slate-100 text-slate-700 font-medium text-xs transition-colors cursor-pointer"
              >
                Cancel (বাতিল)
              </button>
              <button
                type="button"
                onClick={() => {
                  if (onDeleteShare && shareToDelete) {
                    onDeleteShare(shareToDelete.id);
                  }
                  setShareToDelete(null);
                }}
                className="px-4 py-2 rounded-lg bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs shadow-xs transition-colors cursor-pointer"
              >
                Yes, Delete Share (হ্যাঁ, মুছুন)
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Due & Late Fee Calculation Breakdown Modal */}
      <CalculationBreakdownModal
        isOpen={!!breakdownShare}
        onClose={() => setBreakdownShare(null)}
        share={breakdownShare}
        currentMonth={currentMonth}
        onOpenPaymentForShare={onOpenPaymentForShare}
      />
    </div>
  );
};
