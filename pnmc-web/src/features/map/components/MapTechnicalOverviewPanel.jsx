import React from 'react';
import { Database } from 'lucide-react';

const MapTechnicalOverviewPanel = ({
  technicalViewTitle,
  technicalViewDescription,
  technicalSummaryCards,
  technicalConsultationSections,
  technicalSignalCards,
  selectedDepartmentDisplayName,
  activeLayerConfig,
  activeInfoNote,
  formatMetricValue,
}) => {
  return (
    <div id="mapa-consulta" className="grid grid-cols-1 xl:grid-cols-[minmax(0,1.7fr)_minmax(340px,0.9fr)] gap-6 scroll-mt-28">
      <div className="bg-slate-50 rounded-[2.5rem] p-8 border border-slate-200">
        <div className="flex flex-col md:flex-row md:items-start justify-between gap-6">
          <div>
            <p className="text-[0.52rem] font-bold uppercase tracking-[0.3em] text-slate-400">Consulta especializada</p>
            <h4 className="font-alternate text-xl font-bold uppercase text-[#291242] mt-3">{technicalViewTitle}</h4>
            <p className="mt-4 text-[0.78rem] text-slate-500 leading-relaxed max-w-2xl">{technicalViewDescription}</p>
          </div>
          <div className="w-12 h-12 rounded-[1.1rem] bg-white border border-slate-200 flex items-center justify-center text-[#291242] flex-shrink-0">
            <Database size={18} />
          </div>
        </div>
        <div className="mt-8 overflow-hidden rounded-[1.6rem] border border-slate-200 bg-white">
          <div className="overflow-x-auto">
            <table className="min-w-full text-left">
              <thead className="bg-slate-50">
                <tr className="border-b border-slate-200">
                  <th className="px-4 py-3 text-[0.5rem] font-bold uppercase tracking-[0.18em] text-slate-400">Indicador</th>
                  <th className="px-4 py-3 text-[0.5rem] font-bold uppercase tracking-[0.18em] text-slate-400">Lectura</th>
                  <th className="px-4 py-3 text-[0.5rem] font-bold uppercase tracking-[0.18em] text-slate-400">Detalle</th>
                </tr>
              </thead>
              <tbody>
                {technicalSummaryCards.map((item) => (
                  <tr key={item.label} className="border-b border-slate-100">
                    <td className="px-4 py-3 text-[0.56rem] font-bold uppercase tracking-[0.16em] text-slate-400 whitespace-nowrap">{item.label}</td>
                    <td className="px-4 py-3 font-alternate text-[1.05rem] font-bold uppercase text-[#291242] whitespace-nowrap">{formatMetricValue(item.value)}</td>
                    <td className="px-4 py-3 text-[0.68rem] text-slate-500 leading-relaxed">Métrica principal de la capa activa.</td>
                  </tr>
                ))}
                <tr>
                  <td colSpan={3} className="bg-slate-50 px-4 py-2 text-[0.48rem] font-bold uppercase tracking-[0.2em] text-slate-400">Contexto de consulta</td>
                </tr>
                {technicalConsultationSections.map((item) => (
                  <tr key={item.label} className="border-t border-slate-100">
                    <td className="px-4 py-3 text-[0.56rem] font-bold uppercase tracking-[0.16em] text-slate-400 whitespace-nowrap">{item.label}</td>
                    <td className="px-4 py-3 font-alternate text-[1.05rem] font-bold uppercase text-[#291242] whitespace-nowrap">{item.value}</td>
                    <td className="px-4 py-3 text-[0.68rem] text-slate-500 leading-relaxed">{item.note}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-[2.5rem] p-7 border border-slate-200">
        <p className="text-[0.5rem] font-bold uppercase tracking-[0.28em] text-slate-400">Señales automáticas</p>
        <div className="mt-5 space-y-4">
          <div className="grid grid-cols-2 gap-3">
            {technicalSignalCards.map((item) => (
              <div key={item.label} className="rounded-2xl bg-slate-50 border border-slate-100 px-4 py-4">
                <p className="text-[0.5rem] font-bold uppercase tracking-[0.18em] text-slate-400">{item.label}</p>
                <p className="font-alternate text-[1.1rem] font-bold uppercase text-[#291242] mt-3 leading-tight">{item.value}</p>
                <p className="mt-2 text-[0.64rem] text-slate-500 leading-relaxed">{item.note}</p>
              </div>
            ))}
          </div>
          <div className="rounded-2xl bg-slate-50 border border-slate-100 px-4 py-4">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <p className="text-[0.52rem] font-bold uppercase tracking-[0.18em] text-slate-400">Territorio</p>
                <p className="font-alternate text-lg font-bold uppercase text-[#291242] mt-3">{selectedDepartmentDisplayName}</p>
              </div>
              <div>
                <p className="text-[0.52rem] font-bold uppercase tracking-[0.18em] text-slate-400">Capa</p>
                <p className="font-alternate text-lg font-bold uppercase text-[#291242] mt-3">{activeLayerConfig.key}</p>
              </div>
            </div>
          </div>
          <div className="rounded-2xl bg-slate-50 border border-slate-100 px-4 py-4">
            <p className="text-[0.52rem] font-bold uppercase tracking-[0.18em] text-slate-400">Cómo usarla</p>
            <p className="mt-3 text-[0.74rem] text-slate-500 leading-relaxed">
              Esta vista organiza la información en tablas técnicas. Puedes buscar, ordenar y filtrar registros; además, al hacer clic sobre un territorio, abrir directamente su detalle territorial en el bloque inferior.
            </p>
          </div>
          <div className="rounded-2xl bg-slate-50 border border-slate-100 px-4 py-4">
            <p className="text-[0.52rem] font-bold uppercase tracking-[0.18em] text-slate-400">Campos visibles</p>
            <p className="mt-3 text-[0.74rem] text-slate-500 leading-relaxed">{activeInfoNote}</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export { MapTechnicalOverviewPanel };
