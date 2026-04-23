import React from 'react';

export const Tabs = ({
  options = [],
  value,
  onChange,
  className = '',
  ariaLabel = 'Pestañas',
}) => (
  <div className={`inline-flex flex-wrap gap-2 rounded-2xl border border-slate-200 bg-white p-2 ${className}`.trim()} role="tablist" aria-label={ariaLabel}>
    {options.map((option) => {
      const isActive = option.value === value;
      return (
        <button
          key={option.value}
          type="button"
          role="tab"
          aria-selected={isActive}
          onClick={() => onChange?.(option.value)}
          className={[
            'rounded-xl px-4 py-2 text-[0.7rem] font-bold uppercase tracking-[0.12em] transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#00DA5E] focus-visible:ring-offset-2',
            isActive
              ? 'bg-[#291242] text-white shadow-sm'
              : 'text-slate-500 hover:bg-slate-100 hover:text-[#291242]',
          ].join(' ')}
        >
          {option.label}
        </button>
      );
    })}
  </div>
);

export default Tabs;
