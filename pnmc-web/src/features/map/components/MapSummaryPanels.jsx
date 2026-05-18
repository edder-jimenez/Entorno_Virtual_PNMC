import React from 'react';

const LayerStatusStrip = ({ layerStatusCards, activeCategory, onSelectLayer }) => {
  return (
    <div className="mb-8 overflow-hidden rounded-[2.2rem] border border-slate-200 bg-white">
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 divide-y md:divide-y-0 md:divide-x divide-slate-100">
        {layerStatusCards.map((layer) => (
          <button
            key={layer.key}
            onClick={() => onSelectLayer(layer.key)}
            title={layer.description}
            className={`min-h-[86px] text-left px-4 py-3.5 transition-all duration-500 ${
              activeCategory === layer.key
                ? 'bg-[#f8fff9] border-[#8BF784]/40 shadow-[inset_0_0_0_1px_rgba(0,218,94,0.12)]'
                : 'bg-white hover:bg-slate-50/80'
            }`}
          >
            <div className="flex items-center justify-between gap-3">
              <div className="min-w-0">
                <h4 className="font-alternate text-[0.82rem] xl:text-[0.88rem] text-[#291242] font-bold uppercase leading-tight tracking-[0.06em] line-clamp-1">{layer.key}</h4>
              </div>
              <div className="text-right shrink-0">
                <p className="font-alternate text-[1.35rem] xl:text-[1.5rem] text-[#291242] font-bold leading-none">{layer.metric}</p>
                <p className="mt-1 text-[0.46rem] font-bold uppercase tracking-[0.14em] text-slate-400">Registros</p>
              </div>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
};

const DepartmentPillCard = ({ title, items, emptyMessage, onSelect }) => {
  return (
    <div className="bg-white rounded-[2.5rem] p-6 border border-slate-200">
      <h4 className="font-alternate text-[#291242] text-xs font-bold uppercase tracking-[0.2em] mb-6">{title}</h4>
      <div className="flex flex-wrap gap-2">
        {items.length > 0 ? items.map((item) => (
          <button
            key={item.key}
            type="button"
            onClick={() => onSelect(item.value)}
            className="px-3 py-2 rounded-full bg-slate-100 text-[0.52rem] font-bold uppercase tracking-[0.18em] text-slate-500 transition-all hover:bg-slate-200 hover:text-[#291242]"
          >
            {item.label}
          </button>
        )) : (
          <p className="text-[0.8rem] text-slate-500 leading-relaxed">{emptyMessage}</p>
        )}
      </div>
    </div>
  );
};

export { DepartmentPillCard, LayerStatusStrip };
