import React, { useState } from 'react';
import { ShareRecord, MonthKey } from '../types';
import { formatTaka, takaInWords, getCurrentSystemMonthKey } from '../utils/calculations';
import { Printer, X, ShieldCheck, Trash2, Edit3, AlertTriangle } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { TextureButton } from './ui/texture-button';

function formatReceiptDate(rawDate?: string): string {
  if (!rawDate) return '15/09/2026';
  if (rawDate.includes('.')) return rawDate.split('.').join('/');
  if (rawDate.includes('-')) {
    const parts = rawDate.split('-');
    if (parts.length === 3) {
      return `${parts[2]}/${parts[1]}/${parts[0]}`;
    }
  }
  return rawDate;
}

interface MoneyReceiptModalProps {
  isOpen: boolean;
  onClose: () => void;
  share: ShareRecord | null;
  month?: MonthKey;
  onVoidPayment?: (shareId: string, month: MonthKey, targetStatus: 'due' | 'upcoming') => void;
  onEditPayment?: (share: ShareRecord, month: MonthKey) => void;
}

export const MoneyReceiptModal: React.FC<MoneyReceiptModalProps> = ({
  isOpen,
  onClose,
  share,
  month = getCurrentSystemMonthKey(),
  onVoidPayment,
  onEditPayment,
}) => {
  const { requireAdmin } = useAuth();
  const [showConfirmVoid, setShowConfirmVoid] = useState<boolean>(false);

  if (!isOpen || !share) return null;

  const payment = share.months[month] || {
    status: 'paid',
    amount: 2800,
    date: '15.09.26',
    paymentMethod: 'Bank Deposit',
  };

  const amount = payment.amount || 2800;
  const words = takaInWords(amount);
  const receiptNo = `PAS-${month.replace('-', '')}-${share.id.replace('PAS-', '')}`;
  const paymentDate = formatReceiptDate(payment.date);

  const handlePrint = () => {
    window.print();
  };

  const handleConfirmVoid = (targetStatus: 'due' | 'upcoming') => {
    if (onVoidPayment) {
      onVoidPayment(share.id, month, targetStatus);
    }
    setShowConfirmVoid(false);
    onClose();
  };

  return (
    <div
      onClick={(e) => {
        if (e.target === e.currentTarget && !showConfirmVoid) onClose();
      }}
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/75 print:static print:p-0 print:bg-white print:overflow-visible print:block print-modal"
    >
      <div className="relative w-full max-w-2xl max-h-[92vh] flex flex-col bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden print:m-0 print:border-none print:shadow-none print:max-w-none print:w-full print:max-h-none print:block">
        {/* Top Control Bar (Hidden when printing) */}
        <div className="shrink-0 flex flex-wrap items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50 gap-2 print:hidden">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse motion-reduce:animate-none" />
            <h3 className="font-bold text-slate-800 text-sm">Official Money Receipt</h3>
          </div>
          <div className="flex items-center flex-wrap gap-2">
            {onEditPayment && (
              <div className="w-auto">
                <TextureButton
                  variant="secondary"
                  size="sm"
                  onClick={() => {
                    requireAdmin(() => {
                      onEditPayment(share, month);
                      onClose();
                    }, 'edit payment entry');
                  }}
                  className="w-auto"
                  title="Edit payment amount, date or notes"
                >
                  <Edit3 className="w-3.5 h-3.5 text-blue-600" />
                  <span>Edit Entry (এডিট করুন)</span>
                </TextureButton>
              </div>
            )}

            {onVoidPayment && (
              <div className="w-auto">
                <TextureButton
                  variant="destructive"
                  size="sm"
                  onClick={() => requireAdmin(() => setShowConfirmVoid(true), 'void/delete payment entry')}
                  className="w-auto"
                  title="Void and delete this accidental installment entry (ভুল এন্ট্রি মুছুন)"
                >
                  <Trash2 className="w-3.5 h-3.5 text-rose-600" />
                  <span>Void Entry (ভুল এন্ট্রি মুছুন)</span>
                </TextureButton>
              </div>
            )}

            <div className="w-auto">
              <TextureButton
                variant="emerald"
                size="sm"
                onClick={handlePrint}
                className="w-auto"
              >
                <Printer className="w-3.5 h-3.5" />
                <span>Print Receipt</span>
              </TextureButton>
            </div>

            <div className="w-auto">
              <TextureButton
                variant="icon"
                size="icon"
                onClick={onClose}
                aria-label="Close receipt"
                className="w-8 h-8"
              >
                <X className="w-4 h-4 text-slate-400 group-hover:text-slate-800" />
              </TextureButton>
            </div>
          </div>
        </div>

        {/* The Printable Receipt Container */}
        <div className="flex-1 overflow-y-auto p-6 sm:p-10 font-sans print:p-4 print:overflow-visible text-slate-900 bg-white relative" id="printable-receipt">
          {/* Subtle Official Seal Watermark (Visible on print & screen) */}
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-[0.04] print:opacity-[0.06] select-none">
            <div className="w-80 h-80 rounded-full border-[12px] border-emerald-950 flex flex-col items-center justify-center text-center p-6 rotate-[-15deg]">
              <span className="text-xl font-extrabold text-emerald-950">
                Progressive Association Society
              </span>
              <span className="text-3xl font-black my-2 text-emerald-950">★ PAS ★</span>
              <span className="text-sm font-bold text-emerald-950">
                Official Receipt Seal
              </span>
            </div>
          </div>
          {/* Header */}
          <div className="text-center pb-6 border-b-2 border-slate-900">
            <div className="flex justify-center mb-2.5">
              <img
                src="/logo.png"
                alt="Progressive Association Society"
                className="w-16 h-16 object-contain"
              />
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-950">
              PROGRESSIVE ASSOCIATION SOCIETY
            </h1>
            <p className="text-xs text-slate-600 font-semibold mt-1">
              Govt. Registered Multipurpose Cooperative Society &bull; Reg No: PAS/DH/2026/049
            </p>
            <p className="text-xs text-slate-500 mt-0.5">
              Registered Office: 234/5 Sipahibag Bazar, Khilgaon, Dhaka-1214
            </p>
            <div className="mt-3 inline-block px-4 py-1 bg-slate-900 text-white font-bold text-xs rounded">
              Money Receipt (Member Copy)
            </div>
          </div>

          {/* Receipt Info Line */}
          <div className="grid grid-cols-2 gap-4 py-4 text-xs border-b border-slate-200">
            <div>
              <span className="text-slate-500 font-sans font-medium">Receipt No: </span>
              <strong className="text-slate-900 font-mono">{receiptNo}</strong>
            </div>
            <div className="text-right">
              <span className="text-slate-500 font-sans font-medium">Issue Date: </span>
              <strong className="text-slate-900 font-mono">{paymentDate}</strong>
            </div>
          </div>

          {/* Body Statement */}
          <div className="py-6 space-y-4 text-sm leading-relaxed">
            <div className="flex flex-col sm:flex-row sm:items-baseline gap-2">
              <span className="text-slate-600 font-medium whitespace-nowrap min-w-[170px]">
                Received with thanks from:
              </span>
              <div className="flex-1 font-bold text-slate-950 text-base border-b border-dotted border-slate-400 pb-0.5">
                {share.memberName || 'Member of Progressive Association Society'}
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="flex items-baseline gap-2">
                <span className="text-slate-600 font-medium whitespace-nowrap">Share ID No:</span>
                <span className="font-mono font-bold text-slate-900 bg-slate-100 px-2 py-0.5 rounded border border-slate-200">
                  {share.id}
                </span>
              </div>
              <div className="flex items-baseline gap-2">
                <span className="text-slate-600 font-medium whitespace-nowrap">Payment Method:</span>
                <span className="font-semibold text-slate-900">
                  {payment.paymentMethod || 'Bank Deposit'}
                </span>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row sm:items-baseline gap-2">
              <span className="text-slate-600 font-medium whitespace-nowrap min-w-[170px]">
                On account of:
              </span>
              <div className="flex-1 font-medium text-slate-900 border-b border-dotted border-slate-400 pb-0.5">
                Monthly Installment for <strong>{month}</strong> (Regular Monthly Subscription)
              </div>
            </div>

            <div className="flex flex-col sm:flex-row sm:items-baseline gap-2">
              <span className="text-slate-600 font-medium whitespace-nowrap min-w-[170px]">
                Amount in Words:
              </span>
              <div className="flex-1 font-semibold italic text-slate-900 border-b border-dotted border-slate-400 pb-0.5">
                {words}
              </div>
            </div>
          </div>

          {/* Amount Box & Society Seal */}
          <div className="my-6 p-4 bg-slate-50 border-2 border-slate-300 rounded-xl flex items-center justify-between">
            <div>
              <span className="text-xs text-slate-500 font-semibold block">
                Total Amount Received
              </span>
              <span className="text-2xl sm:text-3xl font-extrabold text-emerald-800 font-mono tracking-tight">
                {formatTaka(amount)}
              </span>
            </div>
            <div className="text-right">
              <div className="w-20 h-20 rounded-full border-2 border-dashed border-emerald-600 flex flex-col items-center justify-center text-emerald-700 text-[10px] font-bold rotate-[-6deg]">
                <ShieldCheck className="w-5 h-5 mb-0.5" />
                <span>PA Society</span>
                <span>Verified</span>
              </div>
            </div>
          </div>

          {/* Signatures & Official Seal */}
          <div className="pt-12 grid grid-cols-3 gap-6 text-center text-xs font-medium text-slate-700 items-end">
            {/* 1. Depositor / Member */}
            <div>
              <div className="border-t border-slate-900 pt-2 font-bold text-slate-950 font-serif">
                {share.memberName || 'Member'}
              </div>
              <p className="text-[11px] text-slate-500 font-sans mt-0.5">Depositor / Member (জমাকারীর স্বাক্ষর)</p>
            </div>

            {/* 2. Official Seal */}
            <div className="flex flex-col items-center">
              <div className="w-16 h-16 rounded-full border-2 border-dashed border-emerald-700/80 print:border-slate-800 flex flex-col items-center justify-center text-emerald-800 print:text-slate-800 text-[8px] font-bold rotate-[-4deg] bg-emerald-50/50 print:bg-transparent shadow-2xs">
                <ShieldCheck className="w-4 h-4 mb-0.5" />
                <span>OFFICIAL SEAL</span>
                <span>PAS DHAKA</span>
              </div>
              <p className="text-[10px] text-slate-400 font-sans mt-1">Official Seal (সমিতির সিল)</p>
            </div>

            {/* 3. Treasurer / Officer */}
            <div>
              <div className="border-t border-slate-900 pt-2 font-bold text-slate-950 font-serif">
                General Secretary / Treasurer
              </div>
              <p className="text-[11px] text-slate-500 font-sans mt-0.5">Authorized Signature (কোষাধ্যক্ষ)</p>
            </div>
          </div>

          <div className="mt-8 pt-4 border-t border-slate-200 text-center text-[10px] text-slate-400">
            * This is a computer generated official acknowledgement receipt for fund collection FY 2026-27.
          </div>
        </div>
      </div>

      {/* Confirmation Dialog to Void/Delete Payment */}
      {showConfirmVoid && (
        <div className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-slate-950/80">
          <div className="relative w-full max-w-md bg-white rounded-2xl shadow-2xl border border-slate-300 p-6 animate-in fade-in zoom-in-95 duration-150 motion-reduce:animate-none">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 rounded-full bg-rose-100 text-rose-700 flex items-center justify-center shrink-0">
                <AlertTriangle className="w-5 h-5" />
              </div>
              <div>
                <h4 className="font-bold text-slate-900 text-base">Void &amp; Delete Payment?</h4>
                <p className="text-xs text-slate-500">
                  {share.id} &bull; {month} &bull; {formatTaka(amount)}
                </p>
              </div>
            </div>

            <p className="text-xs text-slate-600 leading-relaxed mb-4">
              How would you like to revert this payment for <strong>{share.memberName}</strong> ({share.id}) for <strong>{month}</strong>?
            </p>

            <div className="space-y-2 mb-6">
              <button
                type="button"
                onClick={() => handleConfirmVoid('due')}
                className="w-full text-left p-3 rounded-xl border border-amber-300 bg-amber-50/70 hover:bg-amber-100 transition-colors cursor-pointer"
              >
                <span className="font-bold text-amber-900 text-xs block">
                  Mark as Overdue (বকেয়া রাখুন - Due + Late Fine)
                </span>
                <span className="text-[11px] text-slate-600 block mt-0.5">
                  Restores installment as overdue with applicable late fee calculation.
                </span>
              </button>

              <button
                type="button"
                onClick={() => handleConfirmVoid('upcoming')}
                className="w-full text-left p-3 rounded-xl border border-slate-300 bg-slate-50 hover:bg-slate-100 transition-colors cursor-pointer"
              >
                <span className="font-bold text-slate-900 text-xs block">
                  Completely Delete / Reset (সম্পূর্ণ মুছে ফেলুন - Unpaid)
                </span>
                <span className="text-[11px] text-slate-600 block mt-0.5">
                  Clears the payment record completely, marking it as unpaid/upcoming.
                </span>
              </button>
            </div>

            <div className="flex items-center justify-end">
              <button
                type="button"
                onClick={() => setShowConfirmVoid(false)}
                className="px-4 py-2 rounded-lg border border-slate-300 hover:bg-slate-100 text-slate-700 font-medium text-xs transition-colors cursor-pointer"
              >
                Cancel (বাতিল)
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
