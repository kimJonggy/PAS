import React, { useState } from 'react';
import { ShareRecord, MonthKey } from '../types';
import { formatTaka, getPenaltyStage, isMonthPast } from '../utils/calculations';
import { useLanguage } from '../context/LanguageContext';
import { AlertTriangle, Copy, Check, MessageSquare, CreditCard, ExternalLink, ShieldAlert, Clock } from 'lucide-react';
import { TextureButton } from './ui/texture-button';

interface OverdueRemindersViewProps {
  shares: ShareRecord[];
  onOpenPaymentForShare: (share: ShareRecord, month?: MonthKey) => void;
  onClearFullDue: (shareId: string, waiveLateFee: boolean) => void;
}

export const OverdueRemindersView: React.FC<OverdueRemindersViewProps> = ({
  shares,
  onOpenPaymentForShare,
  onClearFullDue,
}) => {
  const { t } = useLanguage();
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const penaltyStage = getPenaltyStage();

  const dueShares = shares.filter((s) => !s.isClosed && s.dueMonths > 0);
  const totalDuePrincipal = dueShares.reduce((sum, s) => sum + s.dueAmount, 0);
  const totalLateFee = dueShares.reduce((sum, s) => sum + s.lateFee, 0);
  const totalOutstanding = totalDuePrincipal + totalLateFee;

  const getWhatsAppNoticeUrl = (share: ShareRecord) => {
    const cleanPhone = (share.phone || '').replace(/[^0-9]/g, '');
    const fullPhone = cleanPhone.startsWith('88')
      ? cleanPhone
      : cleanPhone.startsWith('01')
      ? `88${cleanPhone}`
      : cleanPhone || '8801700000000';

    const text = `আসসালামু আলাইকুম ${share.memberName},
প্রগ্রেসিভ অ্যাসোসিয়েশন সোসাইটি (PAS)-এর মাসিক কিস্তি পরিশোধ সংক্রান্ত নোটিশ:
• শেয়ার আইডি: ${share.id}
• বকেয়া মাস: ${share.dueMonths}টি মাস
• মূল বকেয়া: ${formatTaka(share.dueAmount)} (@ ৳২,৮০০/মাস)
• বিলম্ব ফি / জরিমানা: ${formatTaka(share.lateFee)}
• *সর্বমোট প্রদেয় বকেয়া: ${formatTaka(share.totalDue)}*

নিয়মাবলী:
১. ১–১৫ তারিখ: নিয়মিত কিস্তি (কোনো জরিমানা নেই)
২. ১৬–২০ তারিখ: +১৫০ টাকা বিলম্ব ফি
৩. ২১–মাস শেষ: +১৫% সারচার্জ

অনুগ্রহ করে সমিতির ব্যাংক হিসাবে বা বিকাশ/নগদে বকেয়া পরিশোধ করে জমার রসিদ নিশ্চিত করুন।
ধন্যবাদ,
— প্রগ্রেসিভ অ্যাসোসিয়েশন সোসাইটি`;

    return `https://wa.me/${fullPhone}?text=${encodeURIComponent(text)}`;
  };

  const handleCopyReminder = (share: ShareRecord) => {
    const text = `Assalamu Alaikum ${share.memberName},
This is a payment notice from PROGRESSIVE ASSOCIATION SOCIETY.
According to our ledger for Share ID: ${share.id}:
- Overdue Months: ${share.dueMonths} month(s)
- Principal Due: ${formatTaka(share.dueAmount)} (@ Tk. 2,800/month)
- Late Fee / Penalty (Jorimana): ${formatTaka(share.lateFee)} (Current Stage: ${penaltyStage.name})
- Total Payable: ${formatTaka(share.totalDue)}

Timeline Policy:
• 1st–15th: Regular due (Tk. 2,800/month)
• 16th–20th: +Tk. 150 fine added
• 21st–Month End: +15% surcharge added

Please deposit the due amount into the Society Bank Account or send via bKash/Nagad and confirm your deposit slip with the Treasurer.
Thank you for your active cooperation!
- Executive Committee, Progressive Association Society`;

    navigator.clipboard.writeText(text);
    setCopiedId(share.id);
    setTimeout(() => setCopiedId(null), 2500);
  };

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="bg-amber-500/10 border border-amber-300 dark:border-amber-500/30 rounded-xl p-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-lg bg-amber-500 text-white flex items-center justify-center shrink-0 shadow-sm">
              <ShieldAlert className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100">
                {t('overdueConsoleTitle')}
              </h2>
              <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 mt-0.5">
                Currently <strong>{dueShares.length} shares</strong> have overdue installments requiring payment notice.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="bg-white dark:bg-slate-900 px-4 py-2 rounded-lg border border-amber-200 dark:border-amber-500/40 shadow-xs">
              <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 block">{t('totalDues')}</span>
              <span className="text-xl font-extrabold text-rose-700 dark:text-rose-400 font-mono">
                {formatTaka(totalOutstanding)}
              </span>
            </div>
          </div>
        </div>
      </div>

      {dueShares.length === 0 ? (
        <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-12 text-center">
          <div className="w-14 h-14 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center mx-auto mb-3">
            <Check className="w-7 h-7" />
          </div>
          <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">Zero Outstanding Dues</h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            All member shares have cleared their installments. Collection efficiency is 100%!
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {dueShares.map((share) => (
            <div
              key={share.id}
              className="bg-white dark:bg-slate-900/95 rounded-2xl border-2 border-amber-300/90 dark:border-amber-500/40 shadow-xs hover:shadow-md transition-shadow duration-150 overflow-hidden flex flex-col justify-between"
            >
              <div className="p-5">
                <div className="flex items-start justify-between gap-2 mb-3">
                  <div>
                    <span className="text-xs font-bold px-2 py-0.5 rounded-lg bg-amber-100 dark:bg-amber-950/70 text-amber-900 dark:text-amber-200 border border-amber-300/60 dark:border-amber-700/60 font-mono">
                      {share.id}
                    </span>
                    <h3 className="text-base font-bold text-slate-900 dark:text-slate-100 mt-1.5">{share.memberName}</h3>
                    <p className="text-xs text-slate-500 dark:text-slate-400 font-mono">{share.phone || '+880 1700-000000'}</p>
                  </div>
                  <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-rose-100 dark:bg-rose-950/70 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-800">
                    {share.dueMonths} Mths Overdue
                  </span>
                </div>

                {/* Overdue Calculation Details */}
                <div className="space-y-2 py-3 border-y border-slate-100 dark:border-slate-800 text-xs">
                  <div className="flex justify-between text-slate-600 dark:text-slate-400">
                    <span>{t('missedMonths')}:</span>
                    <span className="font-semibold text-slate-800 dark:text-slate-200">
                      {Object.keys(share.months || {})
                        .filter((m) => {
                          const st = share.months[m]?.status;
                          return st === 'due' || (isMonthPast(m) && st !== 'paid');
                        })
                        .join(', ') || 'N/A'}
                    </span>
                  </div>
                  <div className="flex justify-between text-slate-600 dark:text-slate-400">
                    <span>{t('principal')} ({share.dueMonths}x Tk. 2,800):</span>
                    <span className="font-bold text-slate-800 dark:text-slate-200 font-mono">{formatTaka(share.dueAmount)}</span>
                  </div>
                  <div className="flex justify-between text-slate-600 dark:text-slate-400">
                    <span>{t('lateFeeFine')}:</span>
                    <span className="font-bold text-rose-600 dark:text-rose-400 font-mono">+{formatTaka(share.lateFee)}</span>
                  </div>
                  <div className="flex justify-between pt-1 border-t border-slate-200 dark:border-slate-800 text-sm font-bold">
                    <span className="text-slate-900 dark:text-slate-100">{t('totalOutstanding')}:</span>
                    <span className="text-rose-700 dark:text-rose-400 font-mono text-base">{formatTaka(share.totalDue)}</span>
                  </div>
                </div>

                {/* WhatsApp & SMS template preview */}
                <div className="mt-4 p-3 bg-slate-50/80 dark:bg-slate-950/70 rounded-xl border border-slate-200/80 dark:border-slate-800 text-xs text-slate-600 dark:text-slate-300">
                  <div className="flex items-center justify-between mb-2 font-semibold text-slate-700 dark:text-slate-200">
                    <span className="flex items-center gap-1.5">
                      <MessageSquare className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                      <span>{t('whatsAppNotice')}</span>
                    </span>
                    <div className="flex items-center gap-1.5">
                      <div className="w-auto">
                        <TextureButton
                          variant="emerald"
                          size="sm"
                          asChild
                          className="w-auto"
                        >
                          <a
                            href={getWhatsAppNoticeUrl(share)}
                            target="_blank"
                            rel="noopener noreferrer"
                            title="Send notice directly on WhatsApp"
                          >
                            <MessageSquare className="w-3 h-3 text-white" />
                            <span>WhatsApp পাঠান</span>
                          </a>
                        </TextureButton>
                      </div>
                      <div className="w-auto">
                        <TextureButton
                          variant="minimal"
                          size="sm"
                          onClick={() => handleCopyReminder(share)}
                          className="w-auto"
                          title="Copy text"
                        >
                          {copiedId === share.id ? (
                            <>
                              <Check className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                              <span>Copied!</span>
                            </>
                          ) : (
                            <>
                              <Copy className="w-3.5 h-3.5" />
                              <span>{t('copy')}</span>
                            </>
                          )}
                        </TextureButton>
                      </div>
                    </div>
                  </div>
                  <p className="text-[11px] text-slate-600 dark:text-slate-300 line-clamp-2 leading-relaxed">
                    &ldquo;আসসালামু আলাইকুম {share.memberName}, প্রগ্রেসিভ অ্যাসোসিয়েশন সোসাইটি (PAS)-এর মাসিক কিস্তি পরিশোধ সংক্রান্ত নোটিশ...&rdquo;
                  </p>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="p-4 bg-slate-50/70 dark:bg-slate-950/60 border-t border-slate-100 dark:border-slate-800 flex flex-col sm:flex-row gap-2">
                <div className="flex-1">
                  <TextureButton
                    variant="destructive"
                    size="default"
                    onClick={() => onClearFullDue(share.id, false)}
                  >
                    {t('clearDue')} ({formatTaka(share.totalDue)})
                  </TextureButton>
                </div>
                <div className="flex-initial sm:w-auto">
                  <TextureButton
                    variant="secondary"
                    size="default"
                    onClick={() => onClearFullDue(share.id, true)}
                    title="Clear principal installments and waive late fee fine"
                  >
                    {t('waiveLateFee')}
                  </TextureButton>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
