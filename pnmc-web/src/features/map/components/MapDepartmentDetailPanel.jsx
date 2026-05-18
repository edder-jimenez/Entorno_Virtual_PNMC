import React from 'react';
import { MapPin, X } from 'lucide-react';

const MapDepartmentDetailPanel = ({
  selectedDept,
  selectedDepartmentDisplayName,
  handleReturnToNationalView,
  formatMetricValue,
  selectedFestivalCount,
  selectedSchoolCount,
  selectedMarketCount,
  children,
}) => {
  return (
    <>
      <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-6 mb-8">
        <div>
          <p className="text-[0.52rem] font-bold uppercase tracking-[0.3em] text-slate-400">Detalle territorial</p>
          <h3 className="font-alternate text-2xl font-bold uppercase text-[#291242] leading-none mt-3">
            {selectedDept === 'Nacional' ? 'Explora un departamento' : selectedDepartmentDisplayName}
          </h3>
          <p className="text-[0.8rem] text-slate-500 mt-3 font-medium leading-relaxed max-w-2xl">
            {selectedDept === 'Nacional'
              ? 'Haz clic sobre un departamento en el mapa o en el dashboard para abrir su lectura detallada. Esta pieza reemplaza la necesidad de crear 32 páginas independientes y queda lista para recibir nuevas capas.'
              : 'Revisa aquí los registros visibles del departamento y despliega cada elemento para consultar su detalle público.'}
          </p>
        </div>

        {selectedDept !== 'Nacional' && (
          <div className="flex justify-end">
            <button
              onClick={handleReturnToNationalView}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-slate-200 bg-slate-50 text-[#291242] text-[0.58rem] font-bold uppercase tracking-[0.18em] hover:border-[#8BF784] hover:bg-[#f8fff9] transition-all"
              aria-label="Volver a vista nacional"
            >
              <X size={14} />
              Volver a vista nacional
            </button>
          </div>
        )}
      </div>

      {selectedDept === 'Nacional' ? (
        <div className="rounded-[2.4rem] border border-dashed border-slate-200 bg-slate-50 px-8 py-12 text-center">
          <MapPin size={24} className="mx-auto text-[#00DA5E]" />
          <p className="mt-4 font-alternate text-lg uppercase text-[#291242]">Selecciona un territorio</p>
          <p className="mt-3 text-[0.82rem] text-slate-500 leading-relaxed max-w-xl mx-auto">
            Al elegir un departamento desde el mapa, el filtro lateral o el ranking, aquí se desplegarán sus festivales, escuelas, mercados y las siguientes capas del ecosistema.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          <div className="overflow-hidden rounded-[2.4rem] border border-slate-200 bg-slate-50">
            <div className="grid grid-cols-1 md:grid-cols-3 divide-y md:divide-y-0 md:divide-x divide-slate-200">
              {[
                {
                  label: 'Festivales',
                  value: selectedFestivalCount,
                  tone: 'text-[#291242]',
                  accent: '#291242',
                },
                {
                  label: 'Escuelas',
                  value: selectedSchoolCount,
                  tone: 'text-[#14532d]',
                  accent: '#00DA5E',
                },
                {
                  label: 'Mercados',
                  value: selectedMarketCount,
                  tone: 'text-[#291242]',
                  accent: '#291242',
                },
              ].map((item) => (
                <div key={item.label} className="px-6 py-5 bg-white/70">
                  <div className="flex items-center gap-2 text-[0.52rem] font-bold uppercase tracking-[0.2em] text-slate-400">
                    <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: item.accent }} />
                    {item.label}
                  </div>
                  <div className="mt-4 flex items-end justify-between gap-4">
                    <p className={`font-alternate text-[2rem] leading-none font-bold ${item.tone}`}>{formatMetricValue(item.value)}</p>
                    <p className="text-[0.58rem] font-bold uppercase tracking-[0.16em] text-slate-400 whitespace-nowrap">
                      {item.value === 1 ? 'Registro visible' : 'Registros visibles'}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {children}
        </div>
      )}
    </>
  );
};

export { MapDepartmentDetailPanel };
