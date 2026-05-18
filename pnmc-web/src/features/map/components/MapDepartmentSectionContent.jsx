import React from 'react';
import { ChevronDown, ChevronUp } from 'lucide-react';

const EmptyDepartmentLayerState = ({ message }) => (
  <div className="rounded-[1.8rem] border border-dashed border-slate-200 bg-white px-5 py-6">
    <p className="text-[0.82rem] text-slate-500 leading-relaxed">{message}</p>
  </div>
);

const MapDepartmentSectionContent = ({
  sectionKey,
  selectedNormalized,
  formatMetricValue,
  selectedFestivalRecords,
  expandedFestivalRecordId,
  setExpandedFestivalRecordId,
  selectedSchoolRecords,
  selectedSchoolCapacity,
  expandedSchoolRecordId,
  setExpandedSchoolRecordId,
  selectedMarketRecords,
  selectedMarketCapacity,
  expandedMarketRecordId,
  setExpandedMarketRecordId,
}) => {
  if (sectionKey === 'Festivales') {
    if (selectedFestivalRecords.length === 0) {
      return (
        <EmptyDepartmentLayerState message="Este departamento aún no tiene festivales visibles en la capa actual." />
      );
    }

    return (
      <div className="space-y-3">
        {selectedFestivalRecords.map((item, index) => {
          const recordId = `${selectedNormalized}-festival-${index}`;
          const isItemExpanded = expandedFestivalRecordId === recordId;
          const festivalPrimaryFacts = [
            { label: 'Municipio', value: item.municipality },
            { label: 'Género', value: item.genre },
            { label: 'Mes', value: item.month },
          ].filter((detail) => detail.value);
          const festivalQuickFacts = [
            { label: 'Género musical', value: item.genre },
            { label: 'Versiones', value: item.versions },
            { label: 'Mes de realización', value: item.month },
          ].filter((detail) => detail.value);

          return (
            <div key={recordId} className={`rounded-[1.7rem] border transition-all duration-300 ${isItemExpanded ? 'border-[#8BF784] bg-white shadow-sm' : 'border-slate-200 bg-white'}`}>
              <button
                type="button"
                onClick={() => setExpandedFestivalRecordId(isItemExpanded ? null : recordId)}
                className="w-full flex items-center justify-between gap-4 px-5 py-4 text-left"
              >
                <div>
                  <p className="font-alternate text-sm font-bold uppercase tracking-[0.08em] text-[#291242]">{item.name}</p>
                  <p className="text-[0.64rem] text-slate-400 font-bold uppercase tracking-[0.18em] mt-2">
                    {[item.municipality, item.genre, item.month ? `Mes ${item.month}` : ''].filter(Boolean).join(' • ') || 'Registro visible en esta capa'}
                  </p>
                </div>
                {isItemExpanded ? <ChevronUp size={16} className="text-[#00DA5E] shrink-0" /> : <ChevronDown size={16} className="text-slate-300 shrink-0" />}
              </button>
              <div className={`overflow-hidden transition-all duration-500 ${isItemExpanded ? 'max-h-[900px] opacity-100' : 'max-h-0 opacity-0'}`}>
                <div className="px-5 pb-5">
                  <div className="overflow-hidden rounded-[2rem] border border-slate-100 bg-slate-50">
                    <div className="grid grid-cols-1 xl:grid-cols-[minmax(0,1.45fr)_minmax(280px,0.85fr)]">
                      <div className="bg-white p-6 lg:p-7 space-y-6">
                        {festivalPrimaryFacts.length > 0 && (
                          <div className="flex flex-wrap gap-2">
                            {festivalPrimaryFacts.map((detail) => (
                              <span key={detail.label} className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-slate-50 px-3 py-2 text-[0.58rem] font-bold uppercase tracking-[0.14em] text-slate-500">
                                <span className="text-[#00DA5E]">{detail.label}</span>
                                <span className="text-[#291242]">{detail.value}</span>
                              </span>
                            ))}
                          </div>
                        )}

                        {item.description ? (
                          <div className="rounded-[1.6rem] border-l-4 border-[#00DA5E] bg-slate-50 px-5 py-5">
                            <p className="text-[0.52rem] font-bold uppercase tracking-[0.22em] text-slate-400">Lectura del festival</p>
                            <p className="mt-3 text-[0.86rem] leading-relaxed text-[#291242] font-medium">{item.description}</p>
                          </div>
                        ) : (
                          <p className="text-[0.82rem] leading-relaxed text-slate-500">Este festival aún no tiene una descripción pública asociada.</p>
                        )}
                      </div>

                      <aside className="bg-[#291242] p-6 text-white">
                        <p className="text-[0.54rem] font-bold uppercase tracking-[0.24em] text-[#8BF784]">Lectura rápida</p>
                        <div className="mt-6 space-y-4">
                          {festivalQuickFacts.length > 0 ? (
                            festivalQuickFacts.map((detail) => (
                              <div key={detail.label} className="border-b border-white/10 pb-4 last:border-b-0 last:pb-0">
                                <p className="text-[0.52rem] font-bold uppercase tracking-[0.18em] text-slate-400">{detail.label}</p>
                                <p className="mt-2 font-alternate text-lg font-bold uppercase leading-tight text-white">{detail.value}</p>
                              </div>
                            ))
                          ) : (
                            <p className="text-[0.78rem] leading-relaxed text-slate-300">Este registro aún no tiene indicadores rápidos visibles.</p>
                          )}
                        </div>
                      </aside>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    );
  }

  if (sectionKey === 'Escuelas de Música') {
    if (selectedSchoolRecords.length === 0) {
      return (
        <EmptyDepartmentLayerState message="Este departamento aún no tiene escuelas visibles en la capa pública." />
      );
    }

    return (
      <div className="space-y-5">
        <div className="grid grid-cols-2 xl:grid-cols-4 gap-3">
          {[
            { label: 'Estudiantes', value: selectedSchoolCapacity.totalStudents },
            { label: 'Docentes', value: selectedSchoolCapacity.totalTeachers },
            { label: 'Instrumentos', value: selectedSchoolCapacity.totalInstruments },
            { label: 'Agrupaciones', value: selectedSchoolCapacity.totalGroups },
          ].map((item) => (
            <div key={item.label} className="rounded-2xl bg-white border border-slate-100 px-4 py-4">
              <p className="text-[0.52rem] font-bold uppercase tracking-[0.18em] text-slate-400">{item.label}</p>
              <p className="font-alternate text-2xl font-bold text-[#291242] mt-3 leading-none">{formatMetricValue(item.value)}</p>
            </div>
          ))}
        </div>

        <div className="space-y-3">
          {selectedSchoolRecords.map((item, index) => {
            const recordId = item.id || `${selectedNormalized}-school-${index}`;
            const isItemExpanded = expandedSchoolRecordId === recordId;
            const schoolPrimaryFacts = [
              { label: 'Municipio', value: item.municipality },
              { label: 'Tipo', value: item.schoolType },
              { label: 'Estado', value: item.status },
              { label: 'Categoría', value: item.category },
            ].filter((detail) => detail.value);
            const schoolQuickFacts = [
              { label: 'Estudiantes', value: formatMetricValue(item.students) },
              { label: 'Docentes', value: formatMetricValue(item.teachers) },
              { label: 'Instrumentos', value: formatMetricValue(item.instruments) },
              { label: 'Agrupaciones', value: formatMetricValue(item.groups) },
            ];
            const schoolOperationItems = [
              { label: 'Naturaleza', value: item.nature },
              { label: 'Sede de trabajo', value: item.workSite },
              { label: 'Entidad de referencia', value: item.parentEntity },
              { label: 'Acceso a internet', value: item.hasInternet },
              { label: 'Organización comunitaria', value: item.communityOrganization },
            ].filter((detail) => detail.value);
            const schoolInstitutionalItems = [
              { label: 'Creación legal', value: item.legalCreation },
              { label: 'Personería jurídica', value: item.legalPersonhood },
              { label: 'Talleres', value: item.workshops },
            ].filter((detail) => detail.value);

            return (
              <div key={recordId} className={`rounded-[1.7rem] border transition-all duration-300 ${isItemExpanded ? 'border-[#8BF784] bg-white shadow-sm' : 'border-slate-200 bg-white'}`}>
                <button
                  type="button"
                  onClick={() => setExpandedSchoolRecordId(isItemExpanded ? null : recordId)}
                  className="w-full flex items-center justify-between gap-4 px-5 py-4 text-left"
                >
                  <div>
                    <p className="font-alternate text-sm font-bold uppercase tracking-[0.08em] text-[#291242]">{item.name}</p>
                    <p className="text-[0.64rem] text-slate-400 font-bold uppercase tracking-[0.18em] mt-2">
                      {[item.municipality, item.schoolType, item.status].filter(Boolean).join(' • ') || 'Escuela visible en la capa pública'}
                    </p>
                  </div>
                  {isItemExpanded ? <ChevronUp size={16} className="text-[#00DA5E] shrink-0" /> : <ChevronDown size={16} className="text-slate-300 shrink-0" />}
                </button>
                <div className={`overflow-hidden transition-all duration-500 ${isItemExpanded ? 'max-h-[1500px] opacity-100' : 'max-h-0 opacity-0'}`}>
                  <div className="px-5 pb-5">
                    <div className="overflow-hidden rounded-[2rem] border border-slate-100 bg-slate-50">
                      <div className="grid grid-cols-1 xl:grid-cols-[minmax(0,1.45fr)_minmax(280px,0.85fr)]">
                        <div className="bg-white p-6 lg:p-7 space-y-6">
                          {schoolPrimaryFacts.length > 0 && (
                            <div className="flex flex-wrap gap-2">
                              {schoolPrimaryFacts.map((detail) => (
                                <span key={detail.label} className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-slate-50 px-3 py-2 text-[0.58rem] font-bold uppercase tracking-[0.14em] text-slate-500">
                                  <span className="text-[#00DA5E]">{detail.label}</span>
                                  <span className="text-[#291242]">{detail.value}</span>
                                </span>
                              ))}
                            </div>
                          )}

                          {item.practices && (
                            <div className="rounded-[1.6rem] border-l-4 border-[#00DA5E] bg-slate-50 px-5 py-5">
                              <p className="text-[0.52rem] font-bold uppercase tracking-[0.22em] text-slate-400">Prácticas musicales</p>
                              <p className="mt-3 text-[0.86rem] leading-relaxed text-[#291242] font-medium">{item.practices}</p>
                            </div>
                          )}

                          {(schoolOperationItems.length > 0 || schoolInstitutionalItems.length > 0) && (
                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
                              {schoolOperationItems.length > 0 && (
                                <div className="space-y-4">
                                  <p className="text-[0.56rem] font-bold uppercase tracking-[0.24em] text-slate-400">Operación de la escuela</p>
                                  <div className="space-y-4">
                                    {schoolOperationItems.map((detail) => (
                                      <div key={detail.label}>
                                        <p className="text-[0.52rem] font-bold uppercase tracking-[0.18em] text-slate-400">{detail.label}</p>
                                        <p className="mt-1.5 text-[0.78rem] leading-relaxed text-slate-600">{detail.value}</p>
                                      </div>
                                    ))}
                                  </div>
                                </div>
                              )}

                              {schoolInstitutionalItems.length > 0 && (
                                <div className="space-y-4">
                                  <p className="text-[0.56rem] font-bold uppercase tracking-[0.24em] text-slate-400">Soporte institucional</p>
                                  <div className="space-y-4">
                                    {schoolInstitutionalItems.map((detail) => (
                                      <div key={detail.label}>
                                        <p className="text-[0.52rem] font-bold uppercase tracking-[0.18em] text-slate-400">{detail.label}</p>
                                        <p className="mt-1.5 text-[0.78rem] leading-relaxed text-slate-600">{detail.value}</p>
                                      </div>
                                    ))}
                                  </div>
                                </div>
                              )}
                            </div>
                          )}
                        </div>

                        <aside className="bg-[#291242] p-6 text-white">
                          <p className="text-[0.54rem] font-bold uppercase tracking-[0.24em] text-[#8BF784]">Lectura rápida</p>
                          <div className="mt-6 space-y-4">
                            {schoolQuickFacts.map((detail) => (
                              <div key={detail.label} className="border-b border-white/10 pb-4 last:border-b-0 last:pb-0">
                                <p className="text-[0.52rem] font-bold uppercase tracking-[0.18em] text-slate-400">{detail.label}</p>
                                <p className="mt-2 font-alternate text-lg font-bold uppercase leading-tight text-white">{detail.value}</p>
                              </div>
                            ))}
                          </div>
                        </aside>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  }

  if (sectionKey === 'Mercados Musicales') {
    if (selectedMarketRecords.length === 0) {
      return (
        <EmptyDepartmentLayerState message="Este departamento aún no tiene mercados visibles en la capa pública." />
      );
    }

    return (
      <div className="space-y-5">
        <div className="grid grid-cols-2 xl:grid-cols-4 gap-3">
          {[
            { label: 'Proyectos', value: selectedMarketCapacity.totalProjects },
            { label: 'Bookers', value: selectedMarketCapacity.totalBuyers },
            { label: 'Convocatorias', value: selectedMarketCapacity.openCalls },
            { label: 'Con festival', value: selectedMarketCapacity.linkedToFestival },
          ].map((item) => (
            <div key={item.label} className="rounded-2xl bg-white border border-slate-100 px-4 py-4">
              <p className="text-[0.52rem] font-bold uppercase tracking-[0.18em] text-slate-400">{item.label}</p>
              <p className="font-alternate text-2xl font-bold text-[#291242] mt-3 leading-none">{formatMetricValue(item.value)}</p>
            </div>
          ))}
        </div>

        <div className="space-y-3">
          {selectedMarketRecords.map((item, index) => {
            const recordId = item.id || `${selectedNormalized}-market-${index}`;
            const isItemExpanded = expandedMarketRecordId === recordId;
            const marketPrimaryFacts = [
              { label: 'Ciudad', value: item.municipality },
              { label: 'Periodicidad', value: item.periodicity },
              { label: 'Edición 2026', value: item.editionDate2026 },
              { label: 'Entidad responsable', value: item.responsibleEntity },
            ].filter((detail) => detail.value);
            const marketQuickFacts = [
              { label: 'Proyectos por edición', value: item.averageProjectsLabel },
              { label: 'Bookers por edición', value: item.averageBuyersLabel },
              { label: 'Convocatoria abierta', value: item.openCall },
              { label: 'Con festival', value: item.linkedFestival },
              { label: 'Versiones', value: item.versions },
              { label: 'Año de creación', value: item.createdYear },
            ].filter((detail) => detail.value);
            const marketOperationItems = [
              { label: 'Tipo de organización', value: item.organizationType },
              { label: 'Constitución legal', value: item.legalFormalStatus },
              { label: 'Recursos públicos', value: item.publicBudgetShare },
              { label: 'Fuentes de financiación', value: item.fundingSources },
              { label: 'Curaduría y selección', value: item.curationModel },
              { label: 'Estrategias para atraer compradores', value: item.buyerStrategies },
              { label: 'Espacios de procedencia de compradores', value: item.buyerSpaces },
              { label: 'Compromisos previos', value: item.preAgreements },
            ].filter((detail) => detail.value);
            const marketCirculationItems = [
              { label: 'Festival asociado', value: [item.festivalName, item.festivalDates].filter(Boolean).join(' • ') },
              { label: 'Mecanismos de circulación', value: item.circulationMechanisms },
              { label: 'Articulación pública', value: item.publicArticulations },
              { label: 'Redes y organizaciones', value: item.partnerNetworks },
              { label: 'Vínculos desde la estrategia PNMC', value: item.pnmcConnectionsDetail || item.pnmcConnections },
              { label: 'Colaboraciones posibles', value: item.collaborationPotential },
            ].filter((detail) => detail.value);
            const marketLeadText = item.territorialImpact || item.collaborationPotential || item.circulationMechanisms;

            return (
              <div key={recordId} className={`rounded-[1.7rem] border transition-all duration-300 ${isItemExpanded ? 'border-[#8BF784] bg-white shadow-sm' : 'border-slate-200 bg-white'}`}>
                <button
                  type="button"
                  onClick={() => setExpandedMarketRecordId(isItemExpanded ? null : recordId)}
                  className="w-full flex items-center justify-between gap-4 px-5 py-4 text-left"
                >
                  <div>
                    <p className="font-alternate text-sm font-bold uppercase tracking-[0.08em] text-[#291242]">{item.name}</p>
                    <p className="text-[0.64rem] text-slate-400 font-bold uppercase tracking-[0.18em] mt-2">
                      {[item.municipality, item.periodicity, item.responsibleEntity].filter(Boolean).join(' • ') || 'Mercado visible en la capa pública'}
                    </p>
                  </div>
                  {isItemExpanded ? <ChevronUp size={16} className="text-[#00DA5E] shrink-0" /> : <ChevronDown size={16} className="text-slate-300 shrink-0" />}
                </button>
                <div className={`overflow-hidden transition-all duration-500 ${isItemExpanded ? 'max-h-[1800px] opacity-100' : 'max-h-0 opacity-0'}`}>
                  <div className="px-5 pb-5">
                    <div className="overflow-hidden rounded-[2rem] border border-slate-100 bg-slate-50">
                      <div className="grid grid-cols-1 xl:grid-cols-[minmax(0,1.45fr)_minmax(280px,0.85fr)]">
                        <div className="bg-white p-6 lg:p-7 space-y-6">
                          {marketPrimaryFacts.length > 0 && (
                            <div className="flex flex-wrap gap-2">
                              {marketPrimaryFacts.map((detail) => (
                                <span key={detail.label} className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-slate-50 px-3 py-2 text-[0.58rem] font-bold uppercase tracking-[0.14em] text-slate-500">
                                  <span className="text-[#00DA5E]">{detail.label}</span>
                                  <span className="text-[#291242]">{detail.value}</span>
                                </span>
                              ))}
                            </div>
                          )}

                          {marketLeadText && (
                            <div className="rounded-[1.6rem] border-l-4 border-[#00DA5E] bg-slate-50 px-5 py-5">
                              <p className="text-[0.52rem] font-bold uppercase tracking-[0.22em] text-slate-400">Lectura territorial</p>
                              <p className="mt-3 text-[0.86rem] leading-relaxed text-[#291242] font-medium">{marketLeadText}</p>
                            </div>
                          )}

                          {(marketOperationItems.length > 0 || marketCirculationItems.length > 0) && (
                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
                              {marketOperationItems.length > 0 && (
                                <div className="space-y-4">
                                  <p className="text-[0.56rem] font-bold uppercase tracking-[0.24em] text-slate-400">Operación del mercado</p>
                                  <div className="space-y-4">
                                    {marketOperationItems.map((detail) => (
                                      <div key={detail.label}>
                                        <p className="text-[0.52rem] font-bold uppercase tracking-[0.18em] text-slate-400">{detail.label}</p>
                                        <p className="mt-1.5 text-[0.78rem] leading-relaxed text-slate-600">{detail.value}</p>
                                      </div>
                                    ))}
                                  </div>
                                </div>
                              )}

                              {marketCirculationItems.length > 0 && (
                                <div className="space-y-4">
                                  <p className="text-[0.56rem] font-bold uppercase tracking-[0.24em] text-slate-400">Circulación y redes</p>
                                  <div className="space-y-4">
                                    {marketCirculationItems.map((detail) => (
                                      <div key={detail.label}>
                                        <p className="text-[0.52rem] font-bold uppercase tracking-[0.18em] text-slate-400">{detail.label}</p>
                                        <p className="mt-1.5 text-[0.78rem] leading-relaxed text-slate-600">{detail.value}</p>
                                      </div>
                                    ))}
                                  </div>
                                </div>
                              )}
                            </div>
                          )}
                        </div>

                        <aside className="bg-[#291242] p-6 text-white">
                          <p className="text-[0.54rem] font-bold uppercase tracking-[0.24em] text-[#8BF784]">Lectura rápida</p>
                          <div className="mt-6 space-y-4">
                            {marketQuickFacts.length > 0 ? (
                              marketQuickFacts.map((detail) => (
                                <div key={detail.label} className="border-b border-white/10 pb-4 last:border-b-0 last:pb-0">
                                  <p className="text-[0.52rem] font-bold uppercase tracking-[0.18em] text-slate-400">{detail.label}</p>
                                  <p className="mt-2 font-alternate text-lg font-bold uppercase leading-tight text-white">{detail.value}</p>
                                </div>
                              ))
                            ) : (
                              <p className="text-[0.78rem] leading-relaxed text-slate-300">Este registro aún no tiene indicadores rápidos visibles.</p>
                            )}
                          </div>
                        </aside>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  }

  return null;
};

export { MapDepartmentSectionContent };
