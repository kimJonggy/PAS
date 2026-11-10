import React, { useState, useEffect } from 'react';
import { ShareRecord, MonthKey, ALL_MONTHS } from '../types';
import { formatTaka } from '../utils/calculations';
import { CalculationBreakdownModal } from './CalculationBreakdownModal';
import {
  X,
  User,
  ShieldCheck,
  AlertCircle,
  Phone,
  Receipt,
  CreditCard,
  Trash2,
  Printer,
  Calendar,
  MapPin,
  FileText,
  Edit2,
  Save,
  CheckCircle2,
  Clock,
  Calculator,
  MessageSquare,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { TextureButton } from './ui/texture-button';

interface MemberDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  memberName: string | null;
  shares: ShareRecord[];
  onOpenPaymentForShare: (share: ShareRecord, month?: MonthKey) => void;
  onOpenReceiptForShare: (share: ShareRecord, month?: MonthKey) => void;
  onDeleteShare?: (shareId: string) => void;
  onUpdateMemberDetails?: (payload: {
    oldName: string;
    newName: string;
    phone: string;
    address: string;
    nid: string;
  }) => void;
}

const DEFAULT_LOCATIONS = [
  'Sector 7, Uttara, Dhaka-1230',
  'Mirpur DOHS, Road 4, Dhaka-1216',
  'Bashundhara R/A, Block C, Dhaka-1229',
  'Dhanmondi R/A, Road 27, Dhaka-1209',
  'Banani, Road 11, Dhaka-1213',
  'Gulshan-2, Circle 2, Dhaka-1212',
  'Mohammadpur, Salimullah Road, Dhaka-1207',
  'Khilgaon, Taltola, Dhaka-1219',
];

export const MemberDetailModal: React.FC<MemberDetailModalProps> = ({
  isOpen,
  onClose,
  memberName,
  shares = [],
  onOpenPaymentForShare,
  onOpenReceiptForShare,
  onDeleteShare,
  onUpdateMemberDetails,
}) => {
  const { requireAdmin } = useAuth();
  const [shareToDelete, setShareToDelete] = useState<ShareRecord | null>(null);
  const [isEditingKyc, setIsEditingKyc] = useState<boolean>(false);
  const [activeShareFilter, setActiveShareFilter] = useState<string>('all');

  const memberShares = React.useMemo(() => {
    if (!memberName || !Array.isArray(shares)) return [];
    return shares.filter((s) => (s?.memberName || '').trim() === memberName.trim());
  }, [shares, memberName]);

  const totalAdmission = memberShares.reduce((sum, s) => sum + (s?.admissionFee || 0), 0);
  const totalDeposited = memberShares.reduce((sum, s) => sum + (s?.totalDeposit || 0), 0);
  const totalDue = memberShares.reduce((sum, s) => sum + (s?.totalDue || 0), 0);
  const totalPrincipalDue = memberShares.reduce((sum, s) => sum + (s?.dueAmount || 0), 0);
  const totalLateFee = memberShares.reduce((sum, s) => sum + (s?.lateFee || 0), 0);
  const totalDueMonths = memberShares.reduce((sum, s) => sum + (s?.dueMonths || 0), 0);
  const [showBreakdownModal, setShowBreakdownModal] = useState<boolean>(false);

  // Derive KYC info with realistic defaults
  const phone = memberShares.find((s) => s?.phone)?.phone || '+880 1711-000000';
  const address = memberShares.find((s) => s?.address)?.address || DEFAULT_LOCATIONS[0];
  const nid = memberShares.find((s) => s?.nid)?.nid || '1985269345678';

  const getMemberWhatsAppUrl = () => {
    const cleanPhone = (phone || '').replace(/[^0-9]/g, '');
    const fullPhone = cleanPhone.startsWith('88')
      ? cleanPhone
      : cleanPhone.startsWith('01')
      ? `88${cleanPhone}`
      : cleanPhone || '8801700000000';

    const text = `আসসালামু আলাইকুম ${memberName},
প্রগ্রেসিভ অ্যাসোসিয়েশন সোসাইটি (PAS)-এর সদস্য হিসাব বিবরণী:
• বকেয়া পরিমাণ: ${formatTaka(totalDue)} (${totalDueMonths}টি মাস)
• মূল বকেয়া: ${formatTaka(totalPrincipalDue)}
• বিলম্ব জরিমানা: ${formatTaka(totalLateFee)}

দয়া করে সমিতির ব্যাংক হিসাবে বা বিকাশ/নগদে বকেয়া পরিশোধ করে জমার রসিদ নিশ্চিত করুন।
ধন্যবাদ,
— প্রগ্রেসিভ অ্যাসোসিয়েশন সোসাইটি`;

    return `https://wa.me/${fullPhone}?text=${encodeURIComponent(text)}`;
  };

  // State for inline KYC editing
  const [kycForm, setKycForm] = useState({
    name: memberName || '',
    phone: phone,
    address: address,
    nid: nid,
  });

  useEffect(() => {
    if (memberName) {
      setKycForm({
        name: memberName,
        phone: phone,
        address: address,
        nid: nid,
      });
      setIsEditingKyc(false);
      setActiveShareFilter('all');
    }
  }, [memberName, phone, address, nid]);

  if (!isOpen || !memberName) return null;

  const handleStartEdit = () => {
    requireAdmin(() => {
      setKycForm({
        name: memberName,
        phone: phone,
        address: address,
        nid: nid,
      });
      setIsEditingKyc(true);
    }, 'edit member KYC details');
  };

  const handleSaveKyc = (e: React.FormEvent) => {
    e.preventDefault();
    if (!onUpdateMemberDetails) return;
    onUpdateMemberDetails({
      oldName: memberName,
      newName: kycForm.name.trim() || memberName,
      phone: kycForm.phone.trim(),
      address: kycForm.address.trim(),
      nid: kycForm.nid.trim(),
    });
    setIsEditingKyc(false);
  };

  const handlePrint = () => {
    window.print();
  };

  // Filter shares for installment table
  const displayedShares =
    activeShareFilter === 'all'
      ? memberShares
      : memberShares.filter((s) => s?.id === activeShareFilter);

  return (
    <div
      onClick={(e) => {
        if (e.target === e.currentTarget && !shareToDelete) onClose();
      }}
      className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 md:p-6 bg-slate-950/75 print:static print:p-0 print:bg-white print:overflow-visible print:block print-modal"
    >
      <div className="relative w-full max-w-4xl max-h-[92vh] flex flex-col bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden print:m-0 print:border-none print:shadow-none print:max-w-none print:w-full print:max-h-none print:block">
        
        {/* Top Control Bar (Hidden on print) */}
        <div className="shrink-0 flex items-center justify-between px-5 sm:px-6 py-3 border-b border-slate-200 bg-slate-900 text-white print:hidden">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-white p-0.5 flex items-center justify-center shrink-0">
              <img src="/logo.png" alt="PAS Logo" className="w-full h-full object-contain" />
            </div>
            <div>
              <span className="text-xs font-semibold text-emerald-400">
                Member Portfolio
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {!isEditingKyc && onUpdateMemberDetails && (
              <div className="w-auto">
                <TextureButton
                  variant="secondary"
                  size="sm"
                  onClick={handleStartEdit}
                  className="w-auto"
                  title="Edit member KYC information"
                >
                  <Edit2 className="w-3.5 h-3.5 text-blue-400" />
                  <span>Edit KYC</span>
                </TextureButton>
              </div>
            )}

            <div className="w-auto">
              <TextureButton
                variant="emerald"
                size="sm"
                onClick={handlePrint}
                className="w-auto"
                title="Print Member Statement"
              >
                <Printer className="w-3.5 h-3.5" />
                <span>Print Statement</span>
              </TextureButton>
            </div>

            <div className="w-auto ml-1">
              <TextureButton
                variant="icon"
                size="icon"
                onClick={onClose}
                aria-label="Close modal"
                className="w-8 h-8"
              >
                <X className="w-4 h-4 text-slate-400 group-hover:text-white" />
              </TextureButton>
            </div>
          </div>
        </div>

        {/* The Printable Portfolio Sheet Container */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 md:p-7 font-sans print:p-2 print:overflow-visible bg-white text-slate-900" id="printable-member-portfolio">
          
          {/* Header */}
          <div className="border-b border-slate-200 pb-4 mb-5">
            <div className="flex flex-col sm:flex-row items-center sm:items-start justify-between gap-3">
              <div className="flex items-center gap-3.5 text-center sm:text-left">
                <div className="w-14 h-14 rounded-xl bg-white p-1 ring-1 ring-slate-200 flex items-center justify-center shrink-0 shadow-xs">
                  <img src="/logo.png" alt="Progressive Association Society" className="w-full h-full object-contain" />
                </div>
                <div>
                  <h1 className="text-lg sm:text-xl font-extrabold tracking-tight text-slate-950">
                    PROGRESSIVE ASSOCIATION SOCIETY
                  </h1>
                  <p className="text-xs text-slate-500">
                    Reg: PAS/DH/2026/049 &bull; 234/5 Sipahibag Bazar, Khilgaon, Dhaka-1214
                  </p>
                </div>
              </div>

              <div className="text-center sm:text-right shrink-0">
                <span className="inline-block px-3 py-1 bg-slate-900 text-white font-bold text-xs rounded">
                  Member Account Statement
                </span>
                <p className="text-[11px] font-mono text-slate-400 mt-1">
                  Date: {new Date().toLocaleDateString('en-GB')}
                </p>
              </div>
            </div>
          </div>

          {/* Member KYC Profile Card */}
          <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 mb-5">
            {isEditingKyc ? (
              <form onSubmit={handleSaveKyc} className="space-y-3">
                <div className="flex items-center justify-between border-b border-slate-200 pb-2">
                  <div className="flex items-center gap-2">
                    <User className="w-4 h-4 text-emerald-600" />
                    <h3 className="font-bold text-xs text-slate-900">Edit KYC Information</h3>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                      Full Legal Name
                    </label>
                    <input
                      type="text"
                      required
                      value={kycForm.name}
                      onChange={(e) => setKycForm({ ...kycForm, name: e.target.value })}
                      className="w-full px-3 py-1.5 border border-slate-300 rounded-lg text-xs font-semibold focus:ring-2 focus:ring-emerald-500 bg-white"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                      Phone Number
                    </label>
                    <input
                      type="text"
                      required
                      value={kycForm.phone}
                      onChange={(e) => setKycForm({ ...kycForm, phone: e.target.value })}
                      className="w-full px-3 py-1.5 border border-slate-300 rounded-lg text-xs font-mono focus:ring-2 focus:ring-emerald-500 bg-white"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                      National ID (NID)
                    </label>
                    <input
                      type="text"
                      required
                      value={kycForm.nid}
                      onChange={(e) => setKycForm({ ...kycForm, nid: e.target.value })}
                      className="w-full px-3 py-1.5 border border-slate-300 rounded-lg text-xs font-mono focus:ring-2 focus:ring-emerald-500 bg-white"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                      Address
                    </label>
                    <input
                      type="text"
                      required
                      value={kycForm.address}
                      onChange={(e) => setKycForm({ ...kycForm, address: e.target.value })}
                      className="w-full px-3 py-1.5 border border-slate-300 rounded-lg text-xs focus:ring-2 focus:ring-emerald-500 bg-white"
                    />
                  </div>
                </div>

                <div className="flex items-center justify-end gap-2 pt-1">
                  <button
                    type="button"
                    onClick={() => setIsEditingKyc(false)}
                    className="px-3 py-1 rounded-lg border border-slate-300 text-slate-700 text-xs font-semibold hover:bg-slate-100 cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold cursor-pointer"
                  >
                    <Save className="w-3.5 h-3.5" />
                    <span>Save</span>
                  </button>
                </div>
              </form>
            ) : (
              <div>
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-200/80 pb-3 mb-3">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-emerald-700 text-white flex items-center justify-center font-bold text-lg shadow-xs shrink-0">
                      {(memberName || 'P').charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <h2 className="text-lg font-bold text-slate-900 tracking-tight">
                          {memberName}
                        </h2>
                        <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">
                          {memberShares.length} {memberShares.length > 1 ? 'Shares' : 'Share'}
                        </span>
                        {totalDue === 0 ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                            <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                            Clean
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold bg-rose-50 text-rose-700 border border-rose-200">
                            <AlertCircle className="w-3 h-3 text-rose-600" />
                            Due ({totalDueMonths} mo)
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-1.5 flex-wrap">
                    {memberShares.map((s) => (
                      <span
                        key={s.id}
                        className="px-2 py-0.5 rounded bg-white border border-slate-300 text-slate-900 font-mono font-bold text-xs"
                      >
                        {s.id}
                      </span>
                    ))}
                  </div>
                </div>

                {/* KYC Metadata Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-2.5 text-xs">
                  <div className="bg-white p-2.5 rounded-lg border border-slate-200">
                    <span className="text-[10px] font-semibold text-slate-500 block mb-0.5 flex items-center gap-1">
                      <Phone className="w-3 h-3 text-slate-400" />
                      Phone
                    </span>
                    <span className="font-mono font-bold text-slate-900">{phone}</span>
                  </div>

                  <div className="bg-white p-2.5 rounded-lg border border-slate-200">
                    <span className="text-[10px] font-semibold text-slate-500 block mb-0.5 flex items-center gap-1">
                      <FileText className="w-3 h-3 text-slate-400" />
                      NID
                    </span>
                    <span className="font-mono font-bold text-slate-900">{nid}</span>
                  </div>

                  <div className="bg-white p-2.5 rounded-lg border border-slate-200 md:col-span-2">
                    <span className="text-[10px] font-semibold text-slate-500 block mb-0.5 flex items-center gap-1">
                      <MapPin className="w-3 h-3 text-slate-400" />
                      Address
                    </span>
                    <span className="font-medium text-slate-800 text-xs block truncate" title={address}>
                      {address}
                    </span>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* KPI Summary Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-5">
            <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200">
              <span className="text-[11px] font-semibold text-slate-500 block">
                Admission Fee
              </span>
              <span className="text-xl font-extrabold text-slate-900 font-mono mt-1 block">
                {formatTaka(totalAdmission)}
              </span>
            </div>

            <div className="p-3.5 bg-emerald-50 rounded-xl border border-emerald-200">
              <span className="text-[11px] font-semibold text-emerald-800 block">
                Total Deposited
              </span>
              <span className="text-xl font-extrabold text-emerald-700 font-mono mt-1 block">
                {formatTaka(totalDeposited)}
              </span>
            </div>

            <div
              className={`p-3.5 rounded-xl border flex flex-col justify-between ${
                totalDue > 0
                  ? 'bg-rose-50 border-rose-200 text-rose-900'
                  : 'bg-slate-50 border-slate-200 text-slate-900'
              }`}
            >
              <div>
                <span className="text-[11px] font-semibold block opacity-80">
                  Balance Due
                </span>
                <span
                  className={`text-xl font-extrabold font-mono mt-1 block ${
                    totalDue > 0 ? 'text-rose-700' : 'text-slate-700'
                  }`}
                >
                  {formatTaka(totalDue)}
                </span>
                {totalDue > 0 && (
                  <span className="text-[10px] text-slate-600 block mt-0.5">
                    Principal: {formatTaka(totalPrincipalDue)} + Fee: +{formatTaka(totalLateFee)}
                  </span>
                )}
              </div>

              {totalDue > 0 && (
                <div className="mt-2 flex flex-col sm:flex-row gap-1.5 print:hidden">
                  <button
                    type="button"
                    onClick={() => setShowBreakdownModal(true)}
                    className="py-1 px-2 rounded-md bg-white hover:bg-rose-100 border border-rose-300 text-rose-800 text-[11px] font-bold inline-flex items-center justify-center gap-1 shadow-2xs transition-colors cursor-pointer"
                  >
                    <Calculator className="w-3.5 h-3.5 text-rose-600" />
                    <span>View Breakdown</span>
                  </button>
                  <a
                    href={getMemberWhatsAppUrl()}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="py-1 px-2 rounded-md bg-emerald-600 hover:bg-emerald-500 text-white text-[11px] font-bold inline-flex items-center justify-center gap-1 shadow-2xs transition-colors cursor-pointer text-center"
                    title="Send due reminder directly via WhatsApp"
                  >
                    <MessageSquare className="w-3.5 h-3.5" />
                    <span>WhatsApp নোটিশ</span>
                  </a>
                </div>
              )}
            </div>
          </div>

          {/* Section: Vertical Installment Schedule */}
          <div className="mb-5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-2.5">
              <h3 className="font-bold text-sm text-slate-950 tracking-tight flex items-center gap-1.5">
                <Calendar className="w-4 h-4 text-emerald-600" />
                Installments
              </h3>

              {/* Share Selector Tabs (if member has multiple shares) */}
              {memberShares.length > 1 && (
                <div className="flex items-center gap-1 bg-slate-100 p-0.5 rounded-lg border border-slate-200 print:hidden">
                  <button
                    type="button"
                    onClick={() => setActiveShareFilter('all')}
                    className={`px-2 py-0.5 rounded text-xs font-bold transition-colors duration-150 cursor-pointer ${
                      activeShareFilter === 'all'
                        ? 'bg-white text-slate-900 shadow-2xs'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    All ({memberShares.length})
                  </button>
                  {memberShares.map((s) => (
                    <button
                      key={s.id}
                      type="button"
                      onClick={() => setActiveShareFilter(s.id)}
                      className={`px-2 py-0.5 rounded text-xs font-bold transition-colors duration-150 cursor-pointer ${
                        activeShareFilter === s.id
                          ? 'bg-emerald-600 text-white shadow-2xs'
                          : 'text-slate-600 hover:text-slate-900'
                      }`}
                    >
                      {s.id}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Vertical Installment Ledger Table (WITHOUT Target Amount column) */}
            <div className="border border-slate-200 rounded-xl overflow-hidden">
              <table className="w-full text-left text-xs border-collapse">
                <thead className="bg-slate-100 text-slate-700 font-bold border-b border-slate-200 text-[11px]">
                  <tr>
                    <th className="px-3.5 py-2.5">Month</th>
                    <th className="px-3.5 py-2.5">Share ID</th>
                    <th className="px-3.5 py-2.5 text-center">Status</th>
                    <th className="px-3.5 py-2.5 text-center">Date</th>
                    <th className="px-3.5 py-2.5">Method</th>
                    <th className="px-3.5 py-2.5 text-right">Amount</th>
                    <th className="px-3.5 py-2.5 text-center print:hidden">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-mono">
                  {ALL_MONTHS.flatMap((month) => {
                    return displayedShares.map((share) => {
                      const payment = share?.months?.[month];
                      const isPaid = payment?.status === 'paid';
                      const isDue = payment?.status === 'due';
                      const isUpcoming = !isPaid && !isDue;

                      return (
                        <tr
                          key={`${share.id}-${month}`}
                          className={`hover:bg-slate-50 transition-colors ${isUpcoming ? 'print:hidden' : ''}`}
                        >
                          {/* Month */}
                          <td className="px-3.5 py-2.5 font-sans font-bold text-slate-900">
                            {month}
                          </td>

                          {/* Share ID */}
                          <td className="px-3.5 py-2.5 font-bold text-slate-800">
                            <span className="px-1.5 py-0.5 rounded bg-slate-100 border border-slate-200 text-slate-800 font-mono text-[11px]">
                              {share.id}
                            </span>
                          </td>

                          {/* Status Badge */}
                          <td className="px-3.5 py-2.5 text-center">
                            {isPaid ? (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full font-bold text-[10px] bg-emerald-100 text-emerald-800 border border-emerald-300">
                                <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                                PAID
                              </span>
                            ) : isDue ? (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full font-bold text-[10px] bg-rose-100 text-rose-800 border border-rose-300">
                                <AlertCircle className="w-3 h-3 text-rose-600" />
                                DUE
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full font-semibold text-[10px] bg-slate-100 text-slate-500 border border-slate-200">
                                <Clock className="w-3 h-3 text-slate-400" />
                                Upcoming
                              </span>
                            )}
                          </td>

                          {/* Payment Date */}
                          <td className="px-3.5 py-2.5 text-center text-slate-700">
                            {isPaid ? payment?.date || '15.09.26' : '—'}
                          </td>

                          {/* Payment Method */}
                          <td className="px-3.5 py-2.5 font-sans text-slate-600">
                            {isPaid ? payment?.paymentMethod || 'Bank Deposit' : '—'}
                          </td>

                          {/* Paid Amount */}
                          <td className="px-3.5 py-2.5 text-right font-bold">
                            {isPaid ? (
                              <span className="text-emerald-700 font-mono">
                                {formatTaka(payment?.amount || 2800)}
                              </span>
                            ) : isDue ? (
                              <span className="text-rose-600 text-xs">
                                Overdue
                              </span>
                            ) : (
                              <span className="text-slate-400 text-xs">&bull;</span>
                            )}
                          </td>

                          {/* Action Buttons (Hidden on print) */}
                          <td className="px-3.5 py-2.5 text-center font-sans print:hidden">
                            <div className="flex items-center justify-center gap-1.5">
                              {isPaid ? (
                                <button
                                  type="button"
                                  onClick={() => onOpenReceiptForShare(share, month)}
                                  className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-slate-100 hover:bg-emerald-50 hover:text-emerald-800 text-slate-700 font-bold text-[11px] border border-slate-300 transition-colors cursor-pointer"
                                  title="Receipt"
                                >
                                  <Receipt className="w-3 h-3 text-emerald-600" />
                                  <span>Receipt</span>
                                </button>
                              ) : (
                                <button
                                  type="button"
                                  onClick={() => onOpenPaymentForShare(share, month)}
                                  className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-white font-bold text-[11px] transition-colors cursor-pointer ${
                                    isDue
                                      ? 'bg-rose-600 hover:bg-rose-500 shadow-xs'
                                      : 'bg-emerald-600 hover:bg-emerald-500'
                                  }`}
                                  title="Pay"
                                >
                                  <CreditCard className="w-3 h-3" />
                                  <span>Pay</span>
                                </button>
                              )}
                            </div>
                          </td>
                        </tr>
                      );
                    });
                  })}
                </tbody>

                {/* Vertical Schedule Total Footer */}
                <tfoot className="bg-slate-100 border-t-2 border-slate-200 font-mono text-xs font-bold text-slate-900">
                  <tr>
                    <td colSpan={2} className="px-3.5 py-2.5 font-sans font-bold">
                      Total ({displayedShares.length} Share{displayedShares.length > 1 ? 's' : ''})
                    </td>
                    <td colSpan={3} className="px-3.5 py-2.5 text-slate-500 font-sans text-right font-medium">
                      Admission: {formatTaka(displayedShares.reduce((sum, s) => sum + (s?.admissionFee || 0), 0))}
                    </td>
                    <td className="px-3.5 py-2.5 text-right text-emerald-800 font-black">
                      {formatTaka(displayedShares.reduce((sum, s) => sum + (s?.totalDeposit || 0), 0))}
                    </td>
                    <td className="px-3.5 py-2.5 print:hidden"></td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>

          {/* Official Signatures & Seal (Prominent in Print) */}
          <div className="pt-8 border-t border-slate-200 grid grid-cols-3 gap-6 text-center text-xs">
            <div>
              <div className="w-28 border-b border-slate-400 mx-auto mb-1"></div>
              <p className="font-bold text-slate-800">Member</p>
            </div>
            <div>
              <div className="w-28 border-b border-slate-400 mx-auto mb-1"></div>
              <p className="font-bold text-slate-800">Treasurer</p>
            </div>
            <div>
              <div className="w-28 border-b border-slate-400 mx-auto mb-1"></div>
              <p className="font-bold text-slate-800">President / Secretary</p>
            </div>
          </div>
        </div>

        {/* Modal Footer (Hidden on Print) */}
        <div className="shrink-0 px-6 py-3 bg-slate-50 border-t border-slate-200 flex items-center justify-between print:hidden">
          <p className="text-xs text-slate-500 flex items-center gap-1.5">
            <ShieldCheck className="w-4 h-4 text-emerald-600" />
            <span>Progressive Association Society</span>
          </p>
          <div className="w-auto">
            <TextureButton
              variant="secondary"
              size="sm"
              onClick={onClose}
              className="w-auto"
            >
              Close
            </TextureButton>
          </div>
        </div>
      </div>

      {/* Delete Share Confirmation Dialog */}
      {shareToDelete && (
        <div className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-slate-950/75">
          <div className="relative w-full max-w-md bg-white rounded-2xl shadow-2xl border border-slate-300 p-6 motion-safe:animate-in motion-safe:fade-in motion-safe:zoom-in-95 duration-150">
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
              Are you sure you want to delete share <strong>{shareToDelete.id}</strong> ({shareToDelete.memberName})?
            </p>

            <div className="flex items-center justify-end gap-2.5">
              <button
                type="button"
                onClick={() => setShareToDelete(null)}
                className="px-4 py-2 rounded-lg border border-slate-300 hover:bg-slate-100 text-slate-700 font-medium text-xs transition-colors cursor-pointer"
              >
                Cancel
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
                Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Due & Late Fee Calculation Breakdown Modal */}
      <CalculationBreakdownModal
        isOpen={showBreakdownModal}
        onClose={() => setShowBreakdownModal(false)}
        share={memberShares.find((s) => s.dueMonths > 0) || memberShares[0] || null}
        onOpenPaymentForShare={onOpenPaymentForShare}
      />
    </div>
  );
};
