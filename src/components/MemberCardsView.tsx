import React, { useMemo, useState } from 'react';
import { ShareRecord, MonthKey, ALL_MONTHS } from '../types';
import { formatTaka, getPenaltyStage } from '../utils/calculations';
import { useLanguage } from '../context/LanguageContext';
import { CalculationBreakdownModal } from './CalculationBreakdownModal';
import {
  User,
  ShieldCheck,
  AlertCircle,
  Phone,
  ArrowUpRight,
  CheckCircle2,
  Clock,
  Check,
  Calculator,
} from 'lucide-react';

interface MemberCardsViewProps {
  shares: ShareRecord[];
  onOpenPaymentForShare: (share: ShareRecord, month?: MonthKey) => void;
  onOpenReceiptForShare: (share: ShareRecord, month?: MonthKey) => void;
  onSelectMember: (memberName: string) => void;
}

interface GroupedMember {
  name: string;
  phone?: string;
  shares: ShareRecord[];
  totalAdmission: number;
  totalDeposited: number;
  totalDue: number;
  totalPrincipalDue: number;
  totalLateFee: number;
  dueMonthsCount: number;
  isAllPaid: boolean;
}

export const MemberCardsView: React.FC<MemberCardsViewProps> = ({
  shares,
  onOpenPaymentForShare,
  onOpenReceiptForShare,
  onSelectMember,
}) => {
  const { t } = useLanguage();
  const [breakdownShare, setBreakdownShare] = useState<ShareRecord | null>(null);
  const currentPenaltyStage = getPenaltyStage();

  const groupedMembers = useMemo(() => {
    const map = new Map<string, GroupedMember>();

    for (const s of shares) {
      if (s.isClosed) continue;
      const key = s.memberName || 'Unknown Member';
      if (!map.has(key)) {
        map.set(key, {
          name: key,
          phone: s.phone,
          shares: [],
          totalAdmission: 0,
          totalDeposited: 0,
          totalDue: 0,
          totalPrincipalDue: 0,
          totalLateFee: 0,
          dueMonthsCount: 0,
          isAllPaid: true,
        });
      }

      const m = map.get(key)!;
      m.shares.push(s);
      m.totalAdmission += s.admissionFee;
      m.totalDeposited += s.totalDeposit;
      m.totalDue += s.totalDue;
      m.totalPrincipalDue += s.dueAmount;
      m.totalLateFee += s.lateFee;
      m.dueMonthsCount += s.dueMonths;
      if (s.dueMonths > 0) {
        m.isAllPaid = false;
      }
    }

    const getMinPas = (m: GroupedMember): number => {
      let min = 999999;
      for (const s of m.shares) {
        const match = s.id.match(/PAS-(\d+)/i);
        if (match) {
          const num = parseInt(match[1], 10);
          if (num < min) min = num;
        }
      }
      return min;
    };

    return Array.from(map.values())
      .map((m) => {
        // Sort shares within each card by PAS number ascending
        m.shares.sort((a, b) => {
          const numA = parseInt(a.id.match(/PAS-(\d+)/i)?.[1] || '0', 10);
          const numB = parseInt(b.id.match(/PAS-(\d+)/i)?.[1] || '0', 10);
          return numA - numB;
        });
        return m;
      })
      .sort((a, b) => getMinPas(a) - getMinPas(b));
  }, [shares]);

  return (
    <>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {groupedMembers.map((member, idx) => (
          <div
            key={member.name}
            className={`bg-white dark:bg-slate-900/95 rounded-2xl border transition-shadow duration-150 overflow-hidden flex flex-col justify-between shadow-xs hover:shadow-md ${
              !member.isAllPaid
                ? 'border-amber-300 dark:border-amber-500/40 ring-1 ring-amber-200/80 dark:ring-amber-500/20'
                : 'border-slate-200/90 dark:border-slate-800'
            }`}
          >
            {/* Card Top / Header */}
            <div className="p-5">
              <div className="flex items-start justify-between gap-3 mb-3">
                <div className="flex items-center gap-3">
                  <div
                    className={`w-11 h-11 rounded-2xl flex items-center justify-center font-bold text-sm shadow-2xs ${
                      !member.isAllPaid
                        ? 'bg-amber-100 dark:bg-amber-950/70 text-amber-900 dark:text-amber-200 border border-amber-200 dark:border-amber-700/60'
                        : 'bg-emerald-100 dark:bg-emerald-950/70 text-emerald-900 dark:text-emerald-200 border border-emerald-200 dark:border-emerald-700/60'
                    }`}
                  >
                    {member.name
                      .split(' ')
                      .map((n) => n[0])
                      .filter(Boolean)
                      .slice(0, 2)
                      .join('')
                      .toUpperCase() || 'M'}
                  </div>
                  <div>
                    <div className="flex items-center gap-1.5">
                      <span className="text-[11px] font-mono font-bold text-slate-400 dark:text-slate-500">
                        #{(idx + 1).toString().padStart(2, '0')}
                      </span>
                      <h3
                        onClick={() => onSelectMember(member.name)}
                        className="font-bold text-slate-900 dark:text-slate-100 text-base hover:text-emerald-700 dark:hover:text-emerald-400 cursor-pointer transition-colors"
                      >
                        {member.name}
                      </h3>
                    </div>
                    <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                      {member.phone && (
                        <span className="inline-flex items-center gap-1 font-mono">
                          <Phone className="w-3 h-3 text-slate-400" />
                          {member.phone}
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Status badge */}
                {member.isAllPaid ? (
                  <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-emerald-50 dark:bg-emerald-950/70 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
                    <CheckCircle2 className="w-3.5 h-3.5" /> {t('upToDate')}
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-rose-50 dark:bg-rose-950/70 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-800 animate-pulse motion-reduce:animate-none">
                    <AlertCircle className="w-3.5 h-3.5" /> {t('overdue')}
                  </span>
                )}
              </div>

              {/* Share Badges */}
              <div className="flex flex-wrap gap-1.5 my-3">
                {member.shares.map((s) => (
                  <span
                    key={s.id}
                    className={`text-xs px-2.5 py-0.5 rounded-lg font-mono font-medium ${
                      s.dueMonths > 0
                        ? 'bg-rose-100 dark:bg-rose-950/70 text-rose-900 dark:text-rose-200 border border-rose-200 dark:border-rose-800 font-bold'
                        : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700'
                    }`}
                  >
                    {s.id} {s.dueMonths > 0 && `(${s.dueMonths}m)`}
                  </span>
                ))}
                <span className="text-xs text-slate-400 dark:text-slate-400 self-center ml-1">
                  ({member.shares.length} {member.shares.length > 1 ? 'shares' : 'share'})
                </span>
              </div>

              {/* Financial Summary Box with Detailed Breakdown */}
              <div className="p-3.5 bg-slate-50/80 dark:bg-slate-950/70 rounded-xl border border-slate-200/80 dark:border-slate-800 text-xs mt-3 space-y-2">
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <span className="text-slate-500 dark:text-slate-400 block text-[11px] font-medium">{t('totalFundDeposited')}</span>
                    <span className="text-base font-extrabold text-emerald-700 dark:text-emerald-400 font-mono">
                      {formatTaka(member.totalDeposited)}
                    </span>
                  </div>
                  <div className="text-right">
                    <span className="text-slate-500 dark:text-slate-400 block text-[11px] font-medium">{t('totalOutstandingDues')}</span>
                    <span
                      className={`text-base font-extrabold font-mono ${
                        member.totalDue > 0 ? 'text-rose-600 dark:text-rose-400' : 'text-slate-400 dark:text-slate-400'
                      }`}
                    >
                      {formatTaka(member.totalDue)}
                    </span>
                  </div>
                </div>

                {/* Due Breakdown if member has overdue installments */}
                {member.totalDue > 0 && (
                  <div className="pt-2 border-t border-slate-200/80 dark:border-slate-800">
                    <div className="flex items-center justify-between text-[11px] mb-2 text-slate-600 dark:text-slate-300">
                      <span>
                        {t('principalDue')}: <strong className="text-slate-800 dark:text-slate-200 font-mono">{formatTaka(member.totalPrincipalDue)}</strong>
                      </span>
                      <span>
                        {t('lateFeeFine')}: <strong className="text-rose-700 dark:text-rose-400 font-mono">+{formatTaka(member.totalLateFee)}</strong>
                      </span>
                    </div>

                    <button
                      type="button"
                      onClick={() =>
                        setBreakdownShare(
                          member.shares.find((s) => s.dueMonths > 0) || member.shares[0]
                        )
                      }
                      className="w-full py-1.5 px-2.5 rounded-lg bg-amber-50 dark:bg-amber-950/40 hover:bg-amber-100 dark:hover:bg-amber-900/50 border border-amber-300 dark:border-amber-700/60 text-amber-900 dark:text-amber-200 font-bold text-xs inline-flex items-center justify-center gap-1.5 shadow-2xs transition-colors duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-500 cursor-pointer"
                      title="View step-by-step compounding fee calculation breakdown"
                    >
                      <Calculator className="w-3.5 h-3.5 text-amber-700 dark:text-amber-400" />
                      <span>{t('calculationBreakdown')}</span>
                    </button>
                  </div>
                )}
              </div>

              {/* Month-by-month mini timeline */}
              <div className="mt-3.5 pt-3 border-t border-slate-100 dark:border-slate-800">
                <span className="text-[10px] font-semibold text-slate-400 dark:text-slate-400 block mb-2">
                  {t('installmentTimeline')}
                </span>
                <div className="grid grid-cols-5 gap-1.5 text-center text-xs">
                  {ALL_MONTHS.map((m) => {
                    const isAnyDue = member.shares.some((s) => s.months[m]?.status === 'due');
                    const isAllPaid = member.shares.every((s) => s.months[m]?.status === 'paid');

                    return (
                      <div
                        key={m}
                        className={`p-1.5 rounded-lg text-[11px] font-mono border ${
                          isAnyDue
                            ? 'bg-rose-50 dark:bg-rose-950/60 text-rose-700 dark:text-rose-300 border-rose-300 dark:border-rose-800 font-bold'
                            : isAllPaid
                            ? 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800'
                            : 'bg-slate-50 dark:bg-slate-900/70 text-slate-400 dark:text-slate-400 border-slate-200 dark:border-slate-800'
                        }`}
                      >
                        <div className="text-[9px] font-sans font-medium text-slate-400 dark:text-slate-400">
                          {m.replace('-26', '')}
                        </div>
                        <div className="mt-0.5 flex items-center justify-center min-h-[16px]">
                          {isAnyDue ? (
                            <span className="text-[10px] font-bold text-rose-700 dark:text-rose-400">DUE</span>
                          ) : isAllPaid ? (
                            <Check className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400 stroke-[3]" />
                          ) : (
                            <span className="text-slate-400 dark:text-slate-400">&bull;</span>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Card Footer Actions */}
            <div className="p-4 bg-slate-50/70 dark:bg-slate-950/60 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between gap-2">
              <button
                onClick={() => onSelectMember(member.name)}
                className="text-xs font-semibold text-slate-600 dark:text-slate-300 hover:text-emerald-700 dark:hover:text-emerald-400 transition-colors inline-flex items-center gap-1 cursor-pointer"
              >
                <span>{t('fullLedger')}</span>
                <ArrowUpRight className="w-3.5 h-3.5" />
              </button>

              <div className="flex items-center gap-1.5">
                <button
                  onClick={() => onOpenPaymentForShare(member.shares[0])}
                  className="px-3.5 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold shadow-2xs transition-colors duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 cursor-pointer"
                >
                  {t('postPayment')}
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Due & Late Fee Calculation Breakdown Modal */}
      <CalculationBreakdownModal
        isOpen={!!breakdownShare}
        onClose={() => setBreakdownShare(null)}
        share={breakdownShare}
        onOpenPaymentForShare={onOpenPaymentForShare}
      />
    </>
  );
};
