import React from 'react';

const MapV2KpiCards = ({ items = [] }) => {
  if (!items.length) return null;

  return (
    <div className="pointer-events-none absolute right-4 top-[88px] z-[1180] hidden grid-cols-1 gap-2 xl:grid">
      {items.map((item) => {
        const Icon = item.icon;
        return (
          <article key={item.key} className="min-w-[220px] rounded-2xl border border-slate-200 bg-white/92 px-3.5 py-3 shadow-lg backdrop-blur-sm">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="text-[0.5rem] font-bold uppercase tracking-[0.16em] text-slate-400">{item.label}</p>
                <p className="mt-1.5 font-alternate text-[1.1rem] leading-none font-bold text-[#291242]">{item.value}</p>
                <p className="mt-1 text-[0.5rem] uppercase tracking-[0.12em] text-slate-500">{item.note}</p>
              </div>
              {Icon ? (
                <div className="flex h-8 w-8 items-center justify-center rounded-lg border border-slate-100 bg-slate-50 text-[#291242]">
                  <Icon size={14} />
                </div>
              ) : null}
            </div>
          </article>
        );
      })}
    </div>
  );
};

export { MapV2KpiCards };
