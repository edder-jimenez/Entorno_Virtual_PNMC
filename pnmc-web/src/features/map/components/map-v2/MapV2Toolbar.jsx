import React from 'react';
import { Layers3, SlidersHorizontal, BarChart3, CircleHelp, Download, Printer, X } from 'lucide-react';
import { MAP_V2_PANEL_IDS } from '../../config/mapLayersConfig.js';

const TOOLBAR_ITEMS = [
  { id: MAP_V2_PANEL_IDS.layers, label: 'Capas', Icon: Layers3 },
  { id: MAP_V2_PANEL_IDS.filters, label: 'Filtros', Icon: SlidersHorizontal },
  { id: MAP_V2_PANEL_IDS.insights, label: 'Resumen', Icon: BarChart3 },
  { id: MAP_V2_PANEL_IDS.tutorial, label: 'Tutorial', Icon: CircleHelp },
  { id: MAP_V2_PANEL_IDS.export, label: 'Exportar', Icon: Download },
];

const MapV2Toolbar = ({ activePanel, onTogglePanel, onPrint }) => {
  return (
    <div className="absolute left-4 top-[88px] z-[1200] flex flex-col gap-2">
      <div className="rounded-3xl border border-slate-200 bg-white/95 p-2 shadow-xl backdrop-blur-sm">
        <div className="flex flex-col gap-1.5">
          {TOOLBAR_ITEMS.map((item) => {
            const isActive = activePanel === item.id;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => onTogglePanel(item.id)}
                className={`group relative flex h-11 w-11 items-center justify-center rounded-xl border transition-all ${
                  isActive
                    ? 'border-[#291242] bg-[#291242] text-white'
                    : 'border-transparent bg-white text-slate-600 hover:border-slate-200 hover:bg-slate-50 hover:text-[#291242]'
                }`}
                title={item.label}
                aria-label={item.label}
              >
                <item.Icon size={17} />
                <span className="pointer-events-none absolute left-[calc(100%+10px)] hidden whitespace-nowrap rounded-lg border border-slate-200 bg-white px-2 py-1 text-[0.52rem] font-bold uppercase tracking-[0.12em] text-slate-500 shadow-sm group-hover:block">
                  {item.label}
                </span>
              </button>
            );
          })}

          <button
            type="button"
            onClick={onPrint}
            className="group relative flex h-11 w-11 items-center justify-center rounded-xl border border-transparent bg-white text-slate-600 transition-all hover:border-slate-200 hover:bg-slate-50 hover:text-[#291242]"
            title="Imprimir"
            aria-label="Imprimir"
          >
            <Printer size={17} />
            <span className="pointer-events-none absolute left-[calc(100%+10px)] hidden whitespace-nowrap rounded-lg border border-slate-200 bg-white px-2 py-1 text-[0.52rem] font-bold uppercase tracking-[0.12em] text-slate-500 shadow-sm group-hover:block">
              Imprimir
            </span>
          </button>
        </div>
      </div>

      {activePanel ? (
        <button
          type="button"
          onClick={() => onTogglePanel(activePanel)}
          className="mx-auto flex h-8 w-8 items-center justify-center rounded-full border border-slate-200 bg-white/95 text-slate-500 shadow-md backdrop-blur-sm hover:text-[#291242]"
          title="Cerrar panel"
          aria-label="Cerrar panel"
        >
          <X size={14} />
        </button>
      ) : null}
    </div>
  );
};

export { MapV2Toolbar };
