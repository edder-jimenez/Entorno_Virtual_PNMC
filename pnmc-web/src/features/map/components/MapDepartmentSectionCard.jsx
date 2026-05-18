import React from 'react';
import { ChevronDown, ChevronUp } from 'lucide-react';

const MapDepartmentSectionCard = ({
  section,
  isExpanded,
  onToggle,
  formatMetricValue,
  children,
}) => {
  return (
    <div
      className={`rounded-[2.2rem] border transition-all duration-500 overflow-hidden ${isExpanded ? 'border-[#8BF784] bg-slate-50/70 shadow-sm' : 'border-slate-200 bg-white'}`}
    >
      <button
        type="button"
        onClick={onToggle}
        className="w-full flex items-center justify-between gap-5 px-6 py-5 text-left"
      >
        <div>
          <p className={`text-[0.56rem] font-bold uppercase tracking-[0.22em] ${section.accent}`}>{section.label}</p>
          <p className="text-[0.78rem] text-slate-500 mt-2 leading-relaxed">{section.description}</p>
        </div>
        <div className="flex items-center gap-4 shrink-0">
          <div className="text-right">
            <p className="font-alternate text-2xl font-bold text-[#291242] leading-none">{formatMetricValue(section.count)}</p>
            <p className="text-[0.5rem] font-bold uppercase tracking-[0.18em] text-slate-400">{section.pending ? 'Próx.' : 'Registros'}</p>
          </div>
          {isExpanded ? <ChevronUp size={18} className="text-[#00DA5E]" /> : <ChevronDown size={18} className="text-slate-300" />}
        </div>
      </button>

      <div className={`overflow-hidden transition-all duration-700 ease-in-out ${isExpanded ? 'max-h-[3200px] opacity-100' : 'max-h-0 opacity-0 pointer-events-none'}`}>
        <div className="px-6 pb-6">{children}</div>
      </div>
    </div>
  );
};

export { MapDepartmentSectionCard };
