import React from 'react';
import { X } from 'lucide-react';

const MapV2OverlayPanel = ({ title, subtitle, children, onClose }) => {
  return (
    <section className="absolute left-[84px] top-[88px] z-[1190] w-[min(92vw,420px)] max-h-[calc(100%-6.5rem)] overflow-hidden rounded-3xl border border-slate-200 bg-white/95 shadow-[0_22px_52px_rgba(15,23,42,0.18)] backdrop-blur-sm">
      <header className="flex items-start justify-between gap-4 border-b border-slate-100 px-5 py-4">
        <div>
          <p className="text-[0.5rem] font-bold uppercase tracking-[0.16em] text-slate-400">Geovisor V2</p>
          <h3 className="mt-2 font-alternate text-[0.98rem] font-bold uppercase text-[#291242] leading-none">{title}</h3>
          {subtitle ? <p className="mt-1.5 text-[0.62rem] leading-relaxed text-slate-500">{subtitle}</p> : null}
        </div>
        <button
          type="button"
          onClick={onClose}
          className="flex h-8 w-8 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-500 hover:text-[#291242]"
          aria-label="Cerrar panel"
        >
          <X size={14} />
        </button>
      </header>

      <div className="max-h-[calc(100vh-330px)] overflow-y-auto px-5 py-4 custom-scrollbar">{children}</div>
    </section>
  );
};

export { MapV2OverlayPanel };
