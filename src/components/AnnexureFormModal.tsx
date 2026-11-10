import React, { useState } from 'react';
import { AnnexureForm } from '../data/trustDeedData';
import { useLanguage } from '../context/LanguageContext';
import { X, Printer, Download, Check, FileText } from 'lucide-react';

interface AnnexureFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  form: AnnexureForm | null;
}

export const AnnexureFormModal: React.FC<AnnexureFormModalProps> = ({
  isOpen,
  onClose,
  form,
}) => {
  const { language } = useLanguage();
  const [formData, setFormData] = useState<Record<string, string>>({});

  if (!isOpen || !form) return null;

  const handlePrint = () => {
    window.print();
  };

  const isBn = language === 'bn';

  return (
    <div
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
      className="fixed inset-0 z-60 flex items-center justify-center p-3 sm:p-4 bg-slate-950/75 motion-safe:animate-in motion-safe:fade-in duration-150"
    >
      <div className="relative w-full max-w-2xl bg-white rounded-2xl shadow-2xl border border-slate-300 overflow-hidden flex flex-col max-h-[92vh]">
        {/* Top Header */}
        <div className="px-5 py-4 bg-slate-900 text-white flex items-center justify-between border-b border-slate-800 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 flex items-center justify-center shrink-0">
              <FileText className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-bold text-sm sm:text-base text-white">
                <span className="font-mono text-emerald-400 mr-2 text-xs font-semibold">{form.code}</span>
                {isBn ? form.titleBn : form.titleEn}
              </h3>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold flex items-center gap-1.5 shadow-sm transition-colors duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400 cursor-pointer"
              title="Print Form"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>{isBn ? 'প্রিন্ট' : 'Print'}</span>
            </button>
            <button
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Printable Official Form Document */}
        <div className="p-6 sm:p-8 overflow-y-auto space-y-6 text-xs sm:text-sm text-slate-800 bg-white">
          {/* Organization Letterhead Header */}
          <div className="text-center pb-4 border-b-2 border-slate-900">
            <h2 className="font-extrabold text-base sm:text-lg text-slate-900 tracking-tight">
              প্রগ্রেসিভ এসোসিয়েশন সোসাইটি
            </h2>
            <p className="text-xs font-medium text-slate-600">
              Progressive Association Society &bull; ঢাকা, বাংলাদেশ
            </p>
            <p className="text-[11px] text-slate-500 mt-0.5">
              প্রধান কার্যালয়: বাড়ি নং: XXX, গোলাপবাগ, ঢাকা-১২১২
            </p>

            <div className="mt-3 inline-block px-4 py-1 bg-slate-900 text-white font-bold text-xs rounded-full">
              {form.code}: {isBn ? form.titleBn : form.titleEn}
            </div>
          </div>

          {/* Recipient and Subject */}
          <div className="space-y-1.5 text-xs sm:text-sm">
            <p className="text-slate-500">তারিখ / Date: {new Date().toLocaleDateString('en-GB')}</p>
            <p className="font-bold text-slate-800">বরাবর / To:</p>
            <p className="text-slate-700">নির্বাহী কমিটি (Executive Committee)</p>
            <p className="text-slate-700">প্রগ্রেসিভ কোঅপারেটিভ সোসাইটি / প্রগ্রেসিভ এসোসিয়েশন সোসাইটি</p>
            <p className="text-slate-700">ঢাকা, বাংলাদেশ।</p>
            <p className="pt-2 font-bold text-slate-900 text-sm sm:text-base">
              বিষয়: <span className="underline">{isBn ? form.subjectBn : form.subjectEn}</span>
            </p>
          </div>

          {/* Solemn Declaration */}
          <div className="p-4 sm:p-5 bg-slate-50 border border-slate-200 rounded-xl text-sm sm:text-base leading-relaxed text-slate-700 text-left">
            {isBn ? form.declarationBn : form.declarationEn}
          </div>

          {/* Form Fields */}
          <div className="space-y-3 pt-2">
            <span className="font-semibold text-xs sm:text-sm text-slate-700 block pb-1 border-b border-slate-200">
              {isBn ? 'সদস্যের তথ্য ও বিবরণী' : 'Particulars & Information'}
            </span>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              {form.fields.map((f, i) => (
                <div key={i} className={f.type === 'textarea' ? 'sm:col-span-2' : ''}>
                  <label className="block text-xs sm:text-sm font-bold text-slate-700 mb-1">
                    {isBn ? f.labelBn : f.labelEn}
                    {f.required && <span className="text-rose-500 ml-0.5">*</span>}
                  </label>
                  {f.type === 'textarea' ? (
                    <textarea
                      rows={2}
                      value={formData[f.labelEn] || ''}
                      onChange={(e) =>
                        setFormData({ ...formData, [f.labelEn]: e.target.value })
                      }
                      placeholder="..."
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs sm:text-sm"
                    />
                  ) : (
                    <input
                      type={f.type}
                      value={formData[f.labelEn] || ''}
                      onChange={(e) =>
                        setFormData({ ...formData, [f.labelEn]: e.target.value })
                      }
                      placeholder="..."
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs sm:text-sm"
                    />
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Signatures Area */}
          <div className="pt-8 grid grid-cols-2 gap-8 text-center text-xs">
            <div>
              <div className="border-b border-slate-400 border-dashed h-12 flex items-end justify-center pb-1">
                <span className="text-slate-400 italic text-[11px]">স্বাক্ষর ও তারিখ</span>
              </div>
              <p className="font-bold text-slate-800 mt-1">আবেদনকারী / সদস্যের স্বাক্ষর</p>
            </div>

            <div>
              <div className="border-b border-slate-400 border-dashed h-12 flex items-end justify-center pb-1">
                <span className="text-slate-400 italic text-[11px]">অনুমোদন ও সিল</span>
              </div>
              <p className="font-bold text-slate-800 mt-1">অনুমোদনকারী (নির্বাহী কমিটি)</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

