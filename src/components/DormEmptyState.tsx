import React from 'react';
import { SearchX, RotateCcw, Building2 } from 'lucide-react';

interface DormEmptyStateProps {
  onReset: () => void;
  searchTerm?: string;
}

export default function DormEmptyState({ onReset, searchTerm }: DormEmptyStateProps) {
  return (
    <div className="bg-white rounded-3xl p-8 sm:p-12 text-center border border-slate-200/80 shadow-xs max-w-lg mx-auto my-6 space-y-5 animate-in fade-in zoom-in-95 duration-200">
      <div className="w-16 h-16 sm:w-20 sm:h-20 bg-blue-50 text-blue-600 rounded-3xl mx-auto flex items-center justify-center shadow-inner">
        <SearchX className="w-8 h-8 sm:w-10 sm:h-10 text-blue-600" />
      </div>

      <div className="space-y-2">
        <h3 className="text-lg sm:text-xl font-bold text-slate-900">
          ไม่พบหอพักที่ตรงกับเงื่อนไข
        </h3>
        {searchTerm ? (
          <p className="text-xs sm:text-sm text-slate-500 max-w-sm mx-auto leading-relaxed">
            ไม่พบหอพักที่ตรงกับคำค้นหา <span className="font-semibold text-slate-800">"{searchTerm}"</span> หรือตัวกรองที่เลือกไว้
          </p>
        ) : (
          <p className="text-xs sm:text-sm text-slate-500 max-w-sm mx-auto leading-relaxed">
            ลองปรับเปลี่ยนคำค้นหา หรือกดปุ่มรีเซ็ตตัวกรองเพื่อดูหอพักทั้งหมดรอบ ม.อุบลฯ
          </p>
        )}
      </div>

      <div className="pt-2">
        <button
          onClick={onReset}
          className="inline-flex items-center gap-2 px-5 py-3 rounded-2xl bg-blue-600 hover:bg-blue-700 active:scale-95 text-white text-xs sm:text-sm font-bold shadow-md shadow-blue-500/20 transition duration-150"
        >
          <RotateCcw className="w-4 h-4" />
          <span>ล้างตัวกรองและดูหอพักทั้งหมด</span>
        </button>
      </div>
    </div>
  );
}
