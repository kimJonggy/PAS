import React, { useState, useMemo } from 'react';
import { OFFICIAL_TRUST_DEED, AnnexureForm, TrustDeedClause } from '../data/trustDeedData';
import { AnnexureFormModal } from './AnnexureFormModal';
import { useLanguage } from '../context/LanguageContext';
import {
  FileText,
  Search,
  CheckCircle2,
  BookOpen,
  Printer,
  Copy,
  Check,
  ChevronDown,
  ChevronRight,
  Users,
  Award,
  DollarSign,
  AlertTriangle,
  Scale,
  Building,
  Calendar,
  ShieldCheck,
  Info,
  MapPin,
  Clock,
  ExternalLink,
} from 'lucide-react';

interface LandDocumentsViewProps {
  onOpenAddDeed?: () => void;
}

export const LandDocumentsView: React.FC<LandDocumentsViewProps> = () => {
  const { language } = useLanguage();
  const isBn = language === 'bn';

  // Language toggle for reading the deed: defaults to Bengali ('bn')
  const [docLang, setDocLang] = useState<'bn' | 'en'>('bn');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [expandedClauses, setExpandedClauses] = useState<Record<string, boolean>>({
    'clause-1': true,
    'clause-2': true,
    'clause-3': true,
    'clause-4': true,
    'clause-5': true,
    'clause-6': true,
    'clause-7': true,
  });
  const [activeAnnexureModal, setActiveAnnexureModal] = useState<AnnexureForm | null>(null);
  const [copiedSuccess, setCopiedSuccess] = useState<boolean>(false);

  const toggleClause = (id: string) => {
    setExpandedClauses((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const expandAll = () => {
    const all: Record<string, boolean> = {};
    OFFICIAL_TRUST_DEED.clauses.forEach((c) => (all[c.id] = true));
    setExpandedClauses(all);
  };

  const collapseAll = () => {
    setExpandedClauses({});
  };

  const handleCopyText = () => {
    const textToCopy = OFFICIAL_TRUST_DEED.clauses
      .map(
        (c) =>
          `${c.number}: ${docLang === 'bn' ? c.titleBn : c.titleEn}\n${
            docLang === 'bn' ? c.contentBn : c.contentEn
          }`
      )
      .join('\n\n');

    navigator.clipboard.writeText(
      `${docLang === 'bn' ? OFFICIAL_TRUST_DEED.titleBn : OFFICIAL_TRUST_DEED.titleEn}\n${
        docLang === 'bn' ? OFFICIAL_TRUST_DEED.subtitleBn : OFFICIAL_TRUST_DEED.subtitleEn
      }\n\n${textToCopy}`
    );
    setCopiedSuccess(true);
    setTimeout(() => setCopiedSuccess(false), 2500);
  };

  const handlePrintDocument = () => {
    window.print();
  };

  // Filter clauses by search query
  const filteredClauses = useMemo(() => {
    if (!searchQuery.trim()) return OFFICIAL_TRUST_DEED.clauses;
    const q = searchQuery.toLowerCase().trim();
    return OFFICIAL_TRUST_DEED.clauses.filter((c) => {
      const matchTitle = (docLang === 'bn' ? c.titleBn : c.titleEn).toLowerCase().includes(q);
      const matchContent = (docLang === 'bn' ? c.contentBn : c.contentEn).toLowerCase().includes(q);
      const matchSub = c.subClauses?.some(
        (s) =>
          (docLang === 'bn' ? s.titleBn : s.titleEn).toLowerCase().includes(q) ||
          (docLang === 'bn' ? s.contentBn : s.contentEn).toLowerCase().includes(q)
      );
      return matchTitle || matchContent || matchSub;
    });
  }, [searchQuery, docLang]);

  return (
    <div className="space-y-6">
      {/* Top Banner / Document Seal & Official Intro */}
      <div className="bg-gradient-to-br from-slate-950 via-slate-900 to-emerald-950 text-white rounded-3xl p-6 sm:p-8 border border-slate-800 shadow-xl relative overflow-hidden">
        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="space-y-2.5 max-w-2xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-xs font-semibold">
              <Award className="w-3.5 h-3.5" />
              <span>
                {docLang === 'bn' ? 'অফিসিয়াল ট্রাস্ট দলিল ও সংবিধিবদ্ধ বিধিমালা' : 'Official Trust Deed & By-Laws'}
              </span>
            </div>

            <h2 className="text-xl sm:text-3xl font-extrabold text-white tracking-tight">
              {docLang === 'bn' ? OFFICIAL_TRUST_DEED.titleBn : OFFICIAL_TRUST_DEED.titleEn}
            </h2>
            <h3 className={`font-bold text-emerald-400 ${docLang === 'bn' ? 'text-lg sm:text-2xl' : 'text-base sm:text-lg'}`}>
              {docLang === 'bn' ? OFFICIAL_TRUST_DEED.subtitleBn : OFFICIAL_TRUST_DEED.subtitleEn}
            </h3>

            <p className={`text-slate-300 leading-relaxed pt-1 text-left ${docLang === 'bn' ? 'text-sm sm:text-base md:text-lg' : 'text-xs sm:text-sm'}`}>
              {docLang === 'bn' ? OFFICIAL_TRUST_DEED.preambleBn : OFFICIAL_TRUST_DEED.preambleEn}
            </p>
          </div>

          {/* Key Legal Highlights Box */}
          <div className="grid grid-cols-2 gap-3 shrink-0 bg-white/5 p-4 sm:p-5 rounded-2xl border border-white/10 text-xs sm:text-sm">
            <div>
              <span className="text-slate-400 block text-xs font-semibold">
                {docLang === 'bn' ? 'কার্যকর তারিখ' : 'Effective Date'}
              </span>
              <strong className="text-emerald-300 font-mono text-xs sm:text-sm">
                {docLang === 'bn' ? OFFICIAL_TRUST_DEED.effectiveDateBn : OFFICIAL_TRUST_DEED.effectiveDateEn}
              </strong>
            </div>

            <div>
              <span className="text-slate-400 block text-xs font-semibold">
                {docLang === 'bn' ? 'মোট শেয়ার কাঠামো' : 'Total Shares'}
              </span>
              <strong className="text-amber-300 font-mono text-xs sm:text-sm">
                {docLang === 'bn' ? '৩০টি সমান শেয়ার' : '30 Equal Shares'}
              </strong>
            </div>

            <div>
              <span className="text-slate-400 block text-xs font-semibold">
                {docLang === 'bn' ? 'মাসিক কিস্তি' : 'Monthly Installment'}
              </span>
              <strong className="text-white font-mono text-xs sm:text-sm">
                Tk. 2,800
              </strong>
            </div>

            <div>
              <span className="text-slate-400 block text-xs font-semibold">
                {docLang === 'bn' ? 'ভর্তি ফি (অফেরতযোগ্য)' : 'Admission Fee'}
              </span>
              <strong className="text-white font-mono text-xs sm:text-sm">
                Tk. 5,000
              </strong>
            </div>

            <div className="col-span-2 pt-2 border-t border-white/10 text-xs sm:text-sm text-slate-300 flex items-center gap-1.5">
              <MapPin className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
              <span className="truncate">
                {docLang === 'bn' ? OFFICIAL_TRUST_DEED.officeBn : OFFICIAL_TRUST_DEED.officeEn}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Reassuring Notice on Land Acquisition Policy (Clause 4.3) */}
      <div className="p-4 sm:p-5 bg-amber-50/80 border border-amber-300 rounded-2xl flex items-start gap-3.5 shadow-2xs">
        <div className="w-8 h-8 rounded-xl bg-amber-200 text-amber-900 flex items-center justify-center shrink-0 mt-0.5">
          <Info className="w-4 h-4" />
        </div>
        <div className="space-y-1.5">
          <h4 className={`font-bold text-amber-950 ${docLang === 'bn' ? 'text-sm sm:text-lg' : 'text-xs sm:text-sm'}`}>
            {docLang === 'bn'
              ? 'জমি অধিগ্রহণ ও প্রকল্প বাস্তবায়ন নীতি (ধারা ৪.৩ অনুযায়ী)'
              : 'Land Acquisition & Project Execution Policy (Under Clause 4.3)'}
          </h4>
          <p className={`text-amber-900/90 leading-relaxed text-left ${docLang === 'bn' ? 'text-sm sm:text-base' : 'text-xs sm:text-sm'}`}>
            {docLang === 'bn'
              ? 'বর্তমানে সমিতি সদস্য ভর্তি ও মাসিক কিস্তির তহবিল সংগ্রহের প্রাথমিক ধাপে রয়েছে; এখনো কোনো জমি ক্রয় করা হয়নি। ট্রাস্ট দলিলের ধারা ৩.২ অনুযায়ী উপদেষ্টা পরিষদ কর্তৃক উপযুক্ত জমি চিহ্নিতকরণের পর নির্বাহী কমিটির সিদ্ধান্তক্রমে সদস্যদের শেয়ার অনুপাতে জমি ক্রয়ের অর্থ সংগ্রহ ও চূড়ান্ত দলিল রেজিস্ট্রি সম্পাদন করা হইবে।'
              : 'The Association is currently in the initial capital and monthly installment collection phase; no land has been purchased yet. In accordance with Clause 3.2, upon identification of suitable property by the Advisory Panel, land acquisition funds will be pooled and deeds registered proportionately among all valid members.'}
          </p>
        </div>
      </div>

      {/* 4 Core Financial Summary Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {/* Total Capital / Shares */}
        <div className="bg-white rounded-2xl p-4 border border-slate-200/90 shadow-xs hover:shadow-md transition-shadow duration-150">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] font-semibold text-slate-500">
              {docLang === 'bn' ? 'মোট শেয়ার সংখ্যা' : 'Total Shares'}
            </span>
            <div className="w-8 h-8 rounded-xl bg-emerald-100 text-emerald-800 flex items-center justify-center">
              <Users className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl sm:text-3xl font-extrabold text-slate-900 font-mono tracking-tight">
            30 <span className="text-xs font-semibold text-slate-500 font-sans">{docLang === 'bn' ? 'টি শেয়ার' : 'Shares'}</span>
          </p>
          <p className="text-[11px] text-emerald-700 font-medium mt-1">
            {docLang === 'bn' ? 'একক সদস্য সর্বোচ্চ ২০% (১/৫ অংশ)' : 'Max single holding 20%'}
          </p>
        </div>

        {/* Admission Fee */}
        <div className="bg-white rounded-2xl p-4 border border-slate-200/90 shadow-xs hover:shadow-md transition-shadow duration-150">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] font-semibold text-slate-500">
              {docLang === 'bn' ? 'ভর্তি ফি (অফেরতযোগ্য)' : 'Admission Fee'}
            </span>
            <div className="w-8 h-8 rounded-xl bg-blue-100 text-blue-800 flex items-center justify-center">
              <ShieldCheck className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl sm:text-3xl font-extrabold text-slate-900 font-mono tracking-tight">
            Tk. 5,000
          </p>
          <p className="text-[11px] text-blue-700 font-medium mt-1">
            {docLang === 'bn' ? 'এককালীন সদস্যপদ অন্তর্ভুক্তিকরণ' : 'One-time registration fee'}
          </p>
        </div>

        {/* Monthly Installment */}
        <div className="bg-white rounded-2xl p-4 border border-slate-200/90 shadow-xs hover:shadow-md transition-shadow duration-150">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] font-semibold text-slate-500">
              {docLang === 'bn' ? 'মাসিক কিস্তি ও সময়সীমা' : 'Monthly Installment'}
            </span>
            <div className="w-8 h-8 rounded-xl bg-teal-100 text-teal-800 flex items-center justify-center">
              <Calendar className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl sm:text-3xl font-extrabold text-teal-800 font-mono tracking-tight">
            Tk. 2,800
          </p>
          <p className="text-[11px] text-teal-700 font-medium mt-1">
            {docLang === 'bn' ? 'প্রতি মাসের ১২ তারিখের মধ্যে প্রদেয়' : 'Due by 12th of each month'}
          </p>
        </div>

        {/* Late Fee & Refund */}
        <div className="bg-white rounded-2xl p-4 border border-slate-200/90 shadow-xs hover:shadow-md transition-shadow duration-150">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] font-semibold text-slate-500">
              {docLang === 'bn' ? 'জরিমানা ও রিফান্ড নীতি' : 'Late Fee & Refund'}
            </span>
            <div className="w-8 h-8 rounded-xl bg-rose-100 text-rose-800 flex items-center justify-center">
              <AlertTriangle className="w-4 h-4" />
            </div>
          </div>
          <p className="text-base sm:text-lg font-extrabold text-rose-700 tracking-tight leading-tight">
            {docLang === 'bn' ? '+১৫০/- ও ১৫% সারচার্জ' : '+Tk. 150 & 15% Surcharge'}
          </p>
          <p className="text-[11px] text-slate-600 mt-1">
            {docLang === 'bn' ? 'প্রত্যাহারে ৩০% কর্তন, ৭০% রিফান্ড' : 'Resignation: 30% cut, 70% refund'}
          </p>
        </div>
      </div>

      {/* Control Bar: Search & Action Tools */}
      <div className="bg-white rounded-2xl border border-slate-200/90 p-4 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-3">
        {/* Search */}
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={
              docLang === 'bn'
                ? 'দলিলের যেকোনো ধারা, কমিটি বা নিয়মাবলি খুঁজুন...'
                : 'Search clauses, rules, penalties, committees...'
            }
            className="w-full pl-9 pr-4 py-2 border border-slate-300 rounded-xl text-xs sm:text-sm bg-slate-50/50 focus:bg-white focus:ring-2 focus:ring-emerald-500"
          />
        </div>

        {/* Actions */}
        <div className="flex items-center flex-wrap gap-2 text-xs">
          {/* Language Switcher */}
          <div className="flex items-center bg-slate-100 p-0.5 rounded-xl border border-slate-200">
            <button
              onClick={() => setDocLang('bn')}
              className={`px-3 py-1 rounded-lg font-bold transition-colors duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 cursor-pointer ${
                docLang === 'bn'
                  ? 'bg-emerald-600 text-white shadow-2xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              বাংলা দলিল
            </button>
            <button
              onClick={() => setDocLang('en')}
              className={`px-3 py-1 rounded-lg font-bold transition-colors duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 cursor-pointer ${
                docLang === 'en'
                  ? 'bg-emerald-600 text-white shadow-2xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              English Deed
            </button>
          </div>

          <button
            onClick={expandAll}
            className="px-2.5 py-1.5 rounded-lg border border-slate-200 hover:bg-slate-100 text-slate-700 font-semibold cursor-pointer"
          >
            {docLang === 'bn' ? 'সব ধারা খুলুন' : 'Expand All'}
          </button>
          <button
            onClick={collapseAll}
            className="px-2.5 py-1.5 rounded-lg border border-slate-200 hover:bg-slate-100 text-slate-700 font-semibold cursor-pointer"
          >
            {docLang === 'bn' ? 'সব সংকুচিত করুন' : 'Collapse All'}
          </button>

          <button
            onClick={handleCopyText}
            className="p-2 border border-slate-200 hover:bg-slate-100 rounded-lg text-slate-600 hover:text-slate-900 transition-colors cursor-pointer"
            title={docLang === 'bn' ? 'সম্পূর্ণ দলিল কপি করুন' : 'Copy Trust Deed'}
          >
            {copiedSuccess ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
          </button>

          <button
            onClick={handlePrintDocument}
            className="px-3.5 py-1.5 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer shadow-xs"
            title="Print Document"
          >
            <Printer className="w-3.5 h-3.5" />
            <span>{docLang === 'bn' ? 'প্রিন্ট' : 'Print'}</span>
          </button>
        </div>
      </div>

      {/* Main Legal Clauses Cards */}
      <div className="space-y-4">
        {filteredClauses.map((clause) => {
          const isExpanded = !!expandedClauses[clause.id];
          return (
            <div
              key={clause.id}
              className="bg-white rounded-2xl border border-slate-200/90 shadow-xs hover:shadow-md transition-shadow duration-150 overflow-hidden"
            >
              {/* Clause Header */}
              <div
                onClick={() => toggleClause(clause.id)}
                className="p-4 sm:p-5 flex items-center justify-between cursor-pointer select-none bg-slate-50/50 hover:bg-slate-50 transition-colors border-b border-slate-100"
              >
                <div className="flex items-center gap-3.5">
                  <div className="w-9 h-9 rounded-xl bg-slate-900 text-white font-mono font-extrabold text-sm flex items-center justify-center shrink-0 shadow-2xs">
                    {clause.number.replace(/[^0-9]/g, '') || clause.number}
                  </div>
                  <div>
                    <span className="text-xs font-mono font-bold text-emerald-700 block">
                      {clause.number}
                    </span>
                    <h4 className={`font-bold text-slate-900 ${docLang === 'bn' ? 'text-base sm:text-xl' : 'text-sm sm:text-base'}`}>
                      {docLang === 'bn' ? clause.titleBn : clause.titleEn}
                    </h4>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  {clause.keyPoints && (
                    <span className="hidden md:inline-block px-3 py-1 rounded-full bg-emerald-100 text-emerald-800 text-xs font-medium">
                      {clause.keyPoints.length} {docLang === 'bn' ? 'মূল বিষয়' : 'Key Points'}
                    </span>
                  )}
                  <div className="p-1 rounded-lg text-slate-400 hover:text-slate-600">
                    {isExpanded ? <ChevronDown className="w-5 h-5" /> : <ChevronRight className="w-5 h-5" />}
                  </div>
                </div>
              </div>

              {/* Clause Body */}
              {isExpanded && (
                <div className="p-5 sm:p-7 space-y-6 motion-safe:animate-in motion-safe:fade-in duration-150 text-slate-700">
                  {/* Main Paragraph Text */}
                  <div className={`prose prose-slate max-w-none text-left whitespace-pre-line font-sans ${
                    docLang === 'bn'
                      ? 'text-base sm:text-[17px] md:text-lg leading-relaxed sm:leading-loose text-slate-800 font-normal'
                      : 'text-sm sm:text-base leading-relaxed text-slate-700'
                  }`}>
                    {docLang === 'bn' ? clause.contentBn : clause.contentEn}
                  </div>

                  {/* Key Takeaways Cards */}
                  {clause.keyPoints && (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 pt-2">
                      {clause.keyPoints.map((kp, idx) => (
                        <div
                          key={idx}
                          className="p-3.5 bg-emerald-50/60 border border-emerald-200/80 rounded-xl space-y-1.5"
                        >
                          <span className="text-xs font-semibold text-emerald-800 block">
                            {docLang === 'bn' ? kp.labelBn : kp.labelEn}
                          </span>
                          <strong className={`text-slate-900 block leading-snug font-sans font-bold ${
                            docLang === 'bn' ? 'text-sm sm:text-base' : 'text-xs sm:text-sm'
                          }`}>
                            {docLang === 'bn' ? kp.valueBn : kp.valueEn}
                          </strong>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Sub-Clauses & Committee Members */}
                  {clause.subClauses && (
                    <div className="space-y-3.5 pt-3 border-t border-slate-100">
                      {clause.subClauses.map((sub, sIdx) => (
                        <div
                          key={sIdx}
                          className="p-4 sm:p-5 bg-slate-50 border border-slate-200/80 rounded-xl space-y-2.5"
                        >
                          <div className="flex items-center gap-2">
                            <span className="px-2 py-0.5 rounded bg-slate-900 text-white font-mono text-xs font-bold">
                              {sub.number}
                            </span>
                            <h5 className={`font-bold text-slate-900 ${
                              docLang === 'bn' ? 'text-sm sm:text-base md:text-lg' : 'text-xs sm:text-sm'
                            }`}>
                              {docLang === 'bn' ? sub.titleBn : sub.titleEn}
                            </h5>
                          </div>

                          <p className={`whitespace-pre-line text-left ${
                            docLang === 'bn'
                              ? 'text-sm sm:text-base md:text-[17px] leading-relaxed sm:leading-loose text-slate-700'
                              : 'text-xs sm:text-sm leading-relaxed text-slate-600'
                          }`}>
                            {docLang === 'bn' ? sub.contentBn : sub.contentEn}
                          </p>

                          {/* Members list if any */}
                          {sub.members && (
                            <div className="pt-2 flex flex-wrap gap-2">
                              {sub.members.map((m, mIdx) => (
                                <span
                                  key={mIdx}
                                  className="px-3 py-1.5 rounded-lg bg-white border border-slate-200 text-slate-800 text-xs sm:text-sm font-semibold flex items-center gap-1.5 shadow-2xs"
                                >
                                  <Users className="w-3.5 h-3.5 text-emerald-600" />
                                  <span>{m}</span>
                                </span>
                              ))}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Annexures & Statutory Forms Section */}
      <div className="bg-white rounded-2xl border border-slate-200/90 p-6 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-slate-200">
          <div>
            <h3 className="font-bold text-lg sm:text-xl text-slate-900">
              <span className="text-xs font-mono font-semibold text-emerald-700 mr-2">
                Forms &amp; Annexures
              </span>
              {docLang === 'bn' ? 'সংযোজনীসমূহ ও অফিসিয়াল ফরম' : 'Official Annexures & Statutory Forms'}
            </h3>
          </div>
          <p className="text-xs sm:text-sm text-slate-500">
            {docLang === 'bn'
              ? 'নির্ধারিত ফরমগুলো সরাসরি দেখতে বা অফিসিয়াল প্যাডে প্রিন্ট করতে নির্বাচন করুন'
              : 'Select any form to view, fill details, or print on official letterhead'}
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2">
          {OFFICIAL_TRUST_DEED.annexures.map((form) => (
            <div
              key={form.id}
              className="p-5 rounded-2xl border border-slate-200 bg-slate-50/50 hover:bg-white hover:border-emerald-500 hover:shadow-md transition-shadow duration-150 flex flex-col justify-between space-y-4 group"
            >
              <div className="space-y-2">
                <span className="px-2 py-0.5 rounded text-xs font-mono font-bold bg-slate-900 text-white inline-block">
                  {form.code}
                </span>
                <h4 className={`font-bold text-slate-900 group-hover:text-emerald-700 transition-colors ${
                  docLang === 'bn' ? 'text-base sm:text-lg' : 'text-sm sm:text-base'
                }`}>
                  {docLang === 'bn' ? form.titleBn : form.titleEn}
                </h4>
                <p className={`line-clamp-3 leading-relaxed text-left ${
                  docLang === 'bn' ? 'text-sm sm:text-base text-slate-600' : 'text-xs sm:text-sm text-slate-500'
                }`}>
                  {docLang === 'bn' ? form.declarationBn : form.declarationEn}
                </p>
              </div>

              <button
                onClick={() => setActiveAnnexureModal(form)}
                className="w-full py-2.5 px-3 rounded-xl bg-white hover:bg-emerald-600 text-slate-800 hover:text-white border border-slate-300 hover:border-emerald-600 font-bold text-xs sm:text-sm flex items-center justify-center gap-2 shadow-2xs transition-colors duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 cursor-pointer group-hover:bg-emerald-600 group-hover:text-white"
              >
                <FileText className="w-4 h-4" />
                <span>{docLang === 'bn' ? 'ফরম দেখুন ও প্রিন্ট করুন' : 'View & Print Form'}</span>
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Annexure Form Modal (Prints / Previews Annexure A, B, C) */}
      <AnnexureFormModal
        isOpen={!!activeAnnexureModal}
        onClose={() => setActiveAnnexureModal(null)}
        form={activeAnnexureModal}
      />
    </div>
  );
};
