import React, { useState, useEffect } from 'react';
import { ShareRecord, MonthKey, ALL_MONTHS, SocietySummary } from '../types';
import { formatTaka, getCurrentSystemMonthKey } from '../utils/calculations';
import { Calendar, CheckCircle2, AlertCircle, Clock, CreditCard, Receipt, ArrowRight, Edit3 } from 'lucide-react';

interface MonthReconciliationViewProps {
  shares: ShareRecord[];
  summary: SocietySummary;
  currentMonth?: string;
  onOpenPaymentForShare: (share: ShareRecord, month?: MonthKey) => void;
  onOpenReceiptForShare: (share: ShareRecord, month?: MonthKey) => void;
}

export const MonthReconciliationView: React.FC<MonthReconciliationViewProps> = ({
  shares,
  summary,
  currentMonth,
  onOpenPaymentForShare,
  onOpenReceiptForShare,
}) => {
  const [selectedMonth, setSelectedMonth] = useState<MonthKey>(
    () => (currentMonth as MonthKey) || getCurrentSystemMonthKey()
  );

  useEffect(() => {
    if (currentMonth) {
      setSelectedMonth(currentMonth as MonthKey);
    }
  }, [currentMonth]);

  const activeShares = shares.filter((s) => !s.isClosed);
  const paidShares = activeShares.filter((s) => s.months[selectedMonth]?.status === 'paid');
  const dueShares = activeShares.filter((s) => s.months[selectedMonth]?.status === 'due');
  const upcomingShares = activeShares.filter(
    (s) => s.months[selectedMonth]?.status === 'upcoming' || !s.months[selectedMonth]
  );

  const monthStat = summary.monthStats[selectedMonth] || {
    paidShares: paidShares.length,
    paidAmount: paidShares.length * 2800,
    dueShares: dueShares.length,
    dueAmount: dueShares.length * 2800,
  };

  return (
    <div className="space-y-6">
      {/* Month Navigation Pills - Horizontal Swipe on Mobile */}
      <div className="flex items-center gap-2 p-1.5 bg-slate-100 rounded-xl overflow-x-auto [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden flex-nowrap sm:flex-wrap w-full sm:max-w-fit">
        {ALL_MONTHS.map((m) => {
          const stat = summary.monthStats[m];
          const isSelected = selectedMonth === m;
          const isDueMonth = stat.dueShares > 0;

          return (
            <button
              key={m}
              onClick={() => setSelectedMonth(m)}
              className={`shrink-0 whitespace-nowrap px-3.5 sm:px-4 py-2 rounded-lg text-xs sm:text-sm font-semibold transition-colors duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 cursor-pointer flex items-center gap-2 ${
                isSelected
                  ? 'bg-slate-900 text-white shadow-sm'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/70'
              }`}
            >
              <Calendar className="w-4 h-4" />
              <span>Month of {m}</span>
              {stat.dueShares > 0 && (
                <span
                  className={`text-[10px] px-1.5 py-0.2 rounded-full font-bold ${
                    isSelected ? 'bg-rose-500 text-white' : 'bg-rose-100 text-rose-700'
                  }`}
                >
                  {stat.dueShares} Due
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Month Header Banner */}
      <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-xs">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2.5">
              <h2 className="text-xl font-bold text-slate-900">
                Installment Reconciliation: Month of {selectedMonth}
              </h2>
              <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-700">
                Rate: Tk. 2,800 / share
              </span>
            </div>
            <p className="text-xs sm:text-sm text-slate-500 mt-1">
              Bank deposit logs, collection status, and outstanding dues for {selectedMonth}
            </p>
          </div>

          {/* Quick Metrics for Selected Month */}
          <div className="flex items-center gap-3">
            <div className="px-4 py-2 bg-emerald-50 rounded-lg border border-emerald-200 text-left">
              <span className="text-[11px] font-semibold text-emerald-800 block">
                Collected ({monthStat.paidShares} Shares)
              </span>
              <span className="text-lg font-bold text-emerald-700 font-mono">
                {formatTaka(monthStat.paidAmount)}
              </span>
            </div>

            <div className="px-4 py-2 bg-rose-50 rounded-lg border border-rose-200 text-left">
              <span className="text-[11px] font-semibold text-rose-800 block">
                Outstanding ({monthStat.dueShares} Shares)
              </span>
              <span className="text-lg font-bold text-rose-700 font-mono">
                {formatTaka(monthStat.dueAmount)}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Two Column Layout: Due Defaulters on Left/Top, Paid Records on Right */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Due Defaulters Box */}
        <div className="lg:col-span-5 space-y-4">
          <div className="bg-white rounded-xl border border-amber-300 ring-1 ring-amber-200/80 p-5 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <AlertCircle className="w-5 h-5 text-rose-600" />
                <h3 className="font-bold text-slate-900 text-sm">
                  Unpaid / Overdue Shares ({dueShares.length})
                </h3>
              </div>
              <span className="text-xs font-semibold text-rose-700 bg-rose-100 px-2 py-0.5 rounded">
                Total Due: {formatTaka(dueShares.length * 2800)}
              </span>
            </div>

            {dueShares.length === 0 ? (
              <div className="p-6 text-center text-slate-500 bg-slate-50 rounded-lg">
                <CheckCircle2 className="w-8 h-8 text-emerald-500 mx-auto mb-2" />
                <p className="text-xs font-semibold text-slate-700">100% Collection Achieved</p>
                <p className="text-[11px] text-slate-400 mt-0.5">
                  All active shares are cleared for {selectedMonth}
                </p>
              </div>
            ) : (
              <div className="space-y-2.5">
                {dueShares.map((share) => (
                  <div
                    key={share.id}
                    className="p-3 bg-rose-50/50 border border-rose-200 rounded-lg flex items-center justify-between gap-3"
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-xs px-2 py-0.5 rounded bg-rose-100 text-rose-900 font-mono">
                          {share.id}
                        </span>
                        <span className="font-semibold text-slate-900 text-xs sm:text-sm">
                          {share.memberName}
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-500 mt-1">
                        Total Due (incl. late fee): <strong className="text-rose-700">{formatTaka(share.totalDue)}</strong>
                      </p>
                    </div>

                    <button
                      onClick={() => onOpenPaymentForShare(share, selectedMonth)}
                      className="px-3 py-1.5 rounded-md bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold inline-flex items-center gap-1 shadow-xs cursor-pointer"
                    >
                      <CreditCard className="w-3.5 h-3.5" />
                      <span>Collect Tk. 2,800</span>
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Upcoming Info if applicable */}
          {upcomingShares.length > 0 && (
            <div className="bg-slate-50 rounded-xl border border-slate-200 p-4 text-xs text-slate-600">
              <div className="flex items-center gap-2 font-semibold text-slate-700 mb-1">
                <Clock className="w-4 h-4 text-slate-400" />
                <span>Upcoming Installment Period</span>
              </div>
              <p className="text-slate-500 leading-relaxed">
                {upcomingShares.length} shares are scheduled for this cycle. Installments are payable on or before the 15th of the month.
              </p>
            </div>
          )}
        </div>

        {/* Paid Collection Log Table */}
        <div className="lg:col-span-7">
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="px-5 py-3.5 border-b border-slate-200 bg-slate-50 flex items-center justify-between">
              <h3 className="font-bold text-slate-800 text-xs sm:text-sm flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                <span>Deposited Shares ({paidShares.length})</span>
              </h3>
              <span className="text-xs font-semibold text-emerald-700 bg-emerald-100/70 px-2.5 py-0.5 rounded-full font-mono">
                {formatTaka(paidShares.reduce((sum, s) => sum + (s.months[selectedMonth]?.amount || 0), 0))}
              </span>
            </div>

            <div className="overflow-x-auto max-h-[480px]">
              <table className="w-full text-left text-xs border-collapse">
                <thead className="bg-slate-100 text-slate-600 font-semibold sticky top-0 border-b border-slate-200">
                  <tr>
                    <th className="px-3 py-2.5">Share ID</th>
                    <th className="px-3 py-2.5">Member Name</th>
                    <th className="px-3 py-2.5 text-center">Deposit Date</th>
                    <th className="px-3 py-2.5 text-right">Amount</th>
                    <th className="px-3 py-2.5 text-center">Receipt &amp; Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-mono">
                  {paidShares.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="text-center py-8 text-slate-400 font-sans">
                        No payments recorded for {selectedMonth} yet.
                      </td>
                    </tr>
                  ) : (
                    paidShares.map((share) => {
                      const pay = share.months[selectedMonth];
                      return (
                        <tr key={share.id} className="hover:bg-slate-50/70 transition-colors">
                          <td className="px-3 py-2 font-bold text-slate-700">{share.id}</td>
                          <td className="px-3 py-2 font-sans font-medium text-slate-900">
                            {share.memberName}
                          </td>
                          <td className="px-3 py-2 text-center text-slate-600">
                            {pay?.date || '15.09.26'}
                          </td>
                          <td className="px-3 py-2 text-right font-bold text-emerald-700">
                            {formatTaka(pay?.amount || 2800)}
                          </td>
                          <td className="px-3 py-2 text-center font-sans">
                            <div className="flex items-center justify-center gap-2">
                              <button
                                onClick={() => onOpenReceiptForShare(share, selectedMonth)}
                                className="text-xs text-emerald-600 hover:text-emerald-800 font-semibold hover:underline inline-flex items-center gap-1 cursor-pointer"
                                title="View Receipt"
                              >
                                <Receipt className="w-3.5 h-3.5" />
                                <span>Receipt</span>
                              </button>
                              <button
                                onClick={() => onOpenPaymentForShare(share, selectedMonth)}
                                className="text-xs text-slate-500 hover:text-blue-700 font-medium hover:underline inline-flex items-center gap-1 cursor-pointer"
                                title="Edit or Revert / Void this payment entry"
                              >
                                <Edit3 className="w-3.5 h-3.5 text-slate-400" />
                                <span>Edit / Void</span>
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
