import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  ArrowUpRight,
  Calendar as CalendarIcon,
  Filter,
  List,
  MapPin,
  Plus,
} from 'lucide-react';
import { Button, EmptyState, ErrorState, LoadingState } from '../../../components/ui/index.js';
import { useAgenda } from '../../../hooks/data/index.js';
import { agendaRecordHasTag } from '../../../services/data/index.js';
import { buildAgendaItemFromRecord } from '../../content/domain/mediaLibrary.js';
import { buildAgendaEventIcs } from '../domain/agendaIcs.js';
import {
  getDepartmentSelectionValue,
  getSortedDepartmentNames,
  normalizeDepartmentName,
  normalizeMunicipalityName,
  scrollToElementWithOffset,
} from '../../map/domain/mapDomain.js';
import { getMapParticipationMunicipalities } from '../../participation/domain/participationFormConfig.js';
import { PageHero, SectionHeader } from '../../shared/components/PagePrimitives.jsx';

const AgendaExplorer = ({ initialOpenEventId = null, lockedTag = null, title = 'Eventos PNMC', bottomBanner = null }) => {
  const [openIndex, setOpenIndex] = useState(-1);
  const [dateMode, setDateMode] = useState('exact');
  const [viewMode, setViewMode] = useState('list');
  const [selectedDept, setselectedDept] = useState('');
  const [selectedMunicipality, setSelectedMunicipality] = useState('');
  const agendaItemRefs = useRef({});
  const sortAgendaItems = useCallback((leftItem, rightItem) => {
    if (leftItem.dateObj.getTime() !== rightItem.dateObj.getTime()) {
      return leftItem.dateObj - rightItem.dateObj;
    }
    return leftItem.timeValue - rightItem.timeValue;
  }, []);

  const {
    items: agendaItems,
    isLoading,
    isRefreshing,
    isError,
    error,
    retry,
  } = useAgenda({
    lockedTag,
    filterRecord: agendaRecordHasTag,
    mapRecord: buildAgendaItemFromRecord,
    sortItems: sortAgendaItems,
  });
  
  const departments = getSortedDepartmentNames();
  const cities = selectedDept ? getMapParticipationMunicipalities(selectedDept) : [];
  const filteredAgendaItems = useMemo(() => {
    const selectedDepartmentNormalized = normalizeDepartmentName(getDepartmentSelectionValue(selectedDept));
    const selectedMunicipalityNormalized = normalizeMunicipalityName(selectedMunicipality);

    if (!selectedDepartmentNormalized && !selectedMunicipalityNormalized) {
      return agendaItems;
    }

    return agendaItems.filter((item) => {
      const locationTokens = String(item?.l || '')
        .split(',')
        .map((token) => token.trim())
        .filter(Boolean);
      const itemMunicipality = item?.municipality || locationTokens[0] || '';
      const itemDepartment = item?.department || locationTokens[1] || '';

      const matchesDepartment = !selectedDepartmentNormalized
        || normalizeDepartmentName(itemDepartment) === selectedDepartmentNormalized;
      const matchesMunicipality = !selectedMunicipalityNormalized
        || normalizeMunicipalityName(itemMunicipality) === selectedMunicipalityNormalized;

      return matchesDepartment && matchesMunicipality;
    });
  }, [agendaItems, selectedDept, selectedMunicipality]);

  useEffect(() => {
    if (!initialOpenEventId || filteredAgendaItems.length === 0) return;
    const targetIndex = filteredAgendaItems.findIndex(item => item.id === initialOpenEventId);
    if (targetIndex !== -1) {
      requestAnimationFrame(() => {
        setViewMode('list');
        setOpenIndex(targetIndex);
        const targetElement = agendaItemRefs.current[initialOpenEventId];
        if (targetElement) {
          scrollToElementWithOffset(targetElement, 140);
        }
      });
    }
  }, [initialOpenEventId, filteredAgendaItems]);

  const handleAddToCalendar = (item) => {
    const icsContent = buildAgendaEventIcs(item);
    const blob = new Blob([icsContent], { type: 'text/calendar;charset=utf-8' });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    const safeTitle = (item.t || 'evento-pnmc').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');

    link.href = url;
    link.download = `${safeTitle || 'evento-pnmc'}.ics`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);
  };

  return (
    <>
      <div className="grid grid-cols-1 lg:grid-cols-[25rem_minmax(0,1fr)] gap-0">
          <aside className="bg-[#291242] border-r border-white/10 rounded-[2.5rem] overflow-hidden px-10 pt-6 pb-10 min-h-screen text-white flex flex-col justify-start">
            <div className="w-full self-start space-y-12">
              <div className="border-b border-white/10 pb-5 flex justify-between items-center">
                <h4 className="font-alternate text-sm font-bold uppercase tracking-[0.3em] text-slate-200">Filtros</h4>
                <Filter size={18} className="text-[#8BF784]"/>
              </div>
              
              <div className="space-y-8">
                {lockedTag && (
                  <div className="space-y-3">
                    <label className="text-[0.6rem] font-bold text-slate-400 uppercase tracking-widest px-1">Filtro fijo</label>
                    <div className="px-4 py-4 bg-white/10 border border-white/10 rounded-xl">
                      <span className="text-[0.7rem] font-bold uppercase tracking-widest text-[#8BF784]">{lockedTag}</span>
                      <p className="text-[0.65rem] text-slate-300 font-nunito mt-2 leading-relaxed">Este criterio está aplicado de forma permanente en esta sección.</p>
                    </div>
                  </div>
                )}
                <div className="space-y-6">
                  <div className="flex bg-white/5 p-1.5 rounded-xl border border-white/10">
                    <button 
                      onClick={() => setDateMode('exact')}
                      className={`flex-1 py-3 text-[0.65rem] font-bold uppercase tracking-widest rounded-lg transition-all ${dateMode === 'exact' ? 'bg-[#00DA5E] text-[#291242]' : 'text-slate-400 hover:text-white'}`}
                    >Fecha Exacta</button>
                    <button 
                      onClick={() => setDateMode('month')}
                      className={`flex-1 py-3 text-[0.65rem] font-bold uppercase tracking-widest rounded-lg transition-all ${dateMode === 'month' ? 'bg-[#00DA5E] text-[#291242]' : 'text-slate-400 hover:text-white'}`}
                    >Por Mes</button>
                  </div>
                  
                  <div className="space-y-3">
                    <label className="text-[0.6rem] font-bold text-slate-400 uppercase tracking-[0.4em] px-1">
                      {dateMode === 'exact' ? 'Seleccionar día' : 'Seleccionar mes'}
                    </label>
                    {dateMode === 'exact' ? (
                      <input type="date" className="w-full bg-white/5 border border-white/10 rounded-xl py-3.5 px-4 text-[0.8rem] font-nunito focus:ring-1 focus:ring-[#8BF784]/30 transition-all outline-none text-white"/>
                    ) : (
                      <select className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3.5 text-[0.75rem] font-alternate uppercase appearance-none cursor-pointer focus:border-[#8BF784] outline-none">
                        <option className="bg-[#291242]">Enero 2026</option>
                        <option className="bg-[#291242]">Febrero 2026</option>
                        <option className="bg-[#291242]">Marzo 2026</option>
                        <option className="bg-[#291242]">Abril 2026</option>
                      </select>
                    )}
                  </div>
                </div>

                <div className="space-y-8">
                  <div className="space-y-3">
                    <label className="text-[0.6rem] font-bold text-slate-400 uppercase tracking-widest px-1">Tipo de actividad</label>
                    <div className="grid grid-cols-1 gap-2.5">
                      {['Todos', 'Institucional', 'Formación', 'Festival', 'Taller'].map(cat => (
                        <label key={cat} className="flex items-center gap-4 px-4 py-3 bg-white/5 border border-white/10 rounded-xl cursor-pointer hover:bg-white/10 transition-colors group">
                          <input type="radio" name="cat" className="w-4 h-4 accent-[#00DA5E]" />
                          <span className="text-[0.75rem] font-alternate uppercase tracking-widest text-slate-300 group-hover:text-white">{cat}</span>
                        </label>
                      ))}
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div className="space-y-2.5">
                      <label className="text-[0.6rem] font-bold text-slate-400 uppercase tracking-widest px-1">Departamento</label>
                      <select 
                        value={selectedDept}
                        onChange={(e) => {
                          setselectedDept(e.target.value);
                          setSelectedMunicipality('');
                        }}
                        className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-[0.75rem] font-alternate uppercase appearance-none cursor-pointer focus:border-[#8BF784] outline-none"
                      >
                        <option value="" className="bg-[#291242]">Todos los departamentos</option>
                        {departments.map(dept => (
                          <option key={dept} value={dept} className="bg-[#291242] text-white">{dept}</option>
                        ))}
                      </select>
                    </div>

                    <div className="space-y-2.5">
                      <label className="text-[0.6rem] font-bold text-slate-400 uppercase tracking-widest px-1">Ciudad o Municipio</label>
                      <select 
                        value={selectedMunicipality}
                        onChange={(event) => setSelectedMunicipality(event.target.value)}
                        disabled={!selectedDept || cities.length === 0}
                        className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-[0.75rem] font-alternate uppercase appearance-none cursor-pointer focus:border-[#8BF784] outline-none disabled:opacity-30 disabled:cursor-not-allowed"
                      >
                        <option value="" className="bg-[#291242]">
                          {!selectedDept
                            ? 'Selecciona primero departamento'
                            : cities.length > 0
                            ? 'Todos los municipios'
                            : 'Sin municipios disponibles'}
                        </option>
                        {cities.map(city => (
                          <option key={city} value={city} className="bg-[#291242] text-white">{city}</option>
                        ))}
                      </select>
                    </div>
                  </div>
                </div>
              </div>

              <button onClick={() => {
                setDateMode('exact');
                setselectedDept('');
                setSelectedMunicipality('');
              }} className="w-full bg-white/10 hover:bg-[#8BF784] hover:text-[#291242] text-white rounded-2xl py-4 text-[0.75rem] font-bold uppercase font-alternate tracking-widest transition-all">Limpiar Filtros</button>
            </div>
          </aside>

          <div className="min-w-0 p-8 lg:p-12 xl:p-14">
            <div className="flex flex-col sm:flex-row justify-between items-end gap-6 mb-8">
              <SectionHeader backgroundText="PROGRAMA" foregroundText={title} verticalContext="AGENDA" compact />
              <div className="flex bg-slate-50 border border-slate-100 p-1.5 rounded-xl">
                  <button 
                    onClick={() => {
                      setViewMode('list');
                      setOpenIndex(-1);
                    }}
                    className={`p-2.5 rounded-lg transition-all ${viewMode === 'list' ? 'bg-[#00DA5E] text-[#291242] shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}
                  >
                    <List size={18} />
                  </button>
                  <button 
                    onClick={() => {
                      setViewMode('calendar');
                      setOpenIndex(-1);
                    }}
                    className={`p-2.5 rounded-lg transition-all ${viewMode === 'calendar' ? 'bg-[#00DA5E] text-[#291242] shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}
                  >
                    <CalendarIcon size={18} />
                  </button>
              </div>
            </div>
            
            <div className="space-y-0 border-t border-slate-100">
              {isLoading || isRefreshing ? (
                <div className="py-10">
                  <LoadingState
                    title="Cargando agenda..."
                    description="Estamos sincronizando eventos territoriales."
                  />
                </div>
              ) : isError ? (
                <div className="py-10">
                  <ErrorState
                    title="No pudimos cargar la agenda"
                    description={error?.message || 'Intenta nuevamente en unos segundos.'}
                    onRetry={retry}
                  />
                </div>
              ) : filteredAgendaItems.length === 0 ? (
                <div className="py-10">
                  <EmptyState
                    title="No hay eventos programados para este filtro"
                    description="Prueba con otro criterio o vuelve más tarde."
                  />
                </div>
              ) : viewMode === 'list' ? (
                filteredAgendaItems.map((item, idx) => (
                  <div 
                    key={item.id} 
                    ref={(el) => {
                      if (el) agendaItemRefs.current[item.id] = el;
                    }}
                    className={`border-b border-slate-100 transition-all duration-700 overflow-hidden ${openIndex === idx ? 'bg-slate-50' : 'bg-transparent'}`}
                  >
                    <button 
                      onClick={() => setOpenIndex(openIndex === idx ? -1 : idx)}
                      className="w-full grid grid-cols-12 gap-8 p-8 items-center text-left group"
                    >
                      <div className="col-span-4 h-44 rounded-xl overflow-hidden shadow-lg relative">
                        <img src={item.img} className="w-full h-full object-cover transition-all duration-1000 group-hover:scale-110" alt=""/>
                        <div className="absolute inset-0 bg-[#291242]/0 transition-all duration-700 group-hover:bg-[#291242]/32" />
                        <div className="absolute top-3 left-3">
                          <span className="text-[0.55rem] font-bold px-2.5 py-1 rounded bg-[#00DA5E] text-[#291242] uppercase tracking-widest">
                            {item.cat}
                          </span>
                        </div>
                      </div>
                      
                      <div className="col-span-5">
                        <h3 className="font-alternate text-2xl lg:text-3xl uppercase text-[#291242] leading-tight mb-3 tracking-tight">
                          {item.t}
                        </h3>
                        <p className="font-nunito text-slate-500 text-[0.8rem] line-clamp-2 leading-relaxed max-w-md">
                          {item.desc}
                        </p>
                        <div className="mt-4 flex items-center gap-2 text-slate-400 font-bold text-[0.55rem] uppercase tracking-widest">
                          <MapPin size={10} className="text-[#00DA5E]" /> {item.l}
                        </div>
                      </div>

                      <div className="col-span-3 text-right flex flex-col justify-center items-end border-l border-slate-100 pl-8">
                        <div className="font-gregor text-4xl lg:text-5xl text-[#291242] font-bold leading-none tracking-tighter mb-1">
                          {item.d}/{item.m}
                        </div>
                        <div className="flex flex-col items-end">
                          <span className="text-slate-400 font-bold text-[0.6rem] uppercase tracking-[0.2em] mb-0.5">Año {item.y}</span>
                          <span className="text-[#00DA5E] font-bold text-[0.65rem] uppercase tracking-widest">{item.time}</span>
                        </div>
                      </div>
                    </button>

                    <div className={`transition-all duration-1000 ease-in-out ${openIndex === idx ? 'max-h-[800px] opacity-100' : 'max-h-0 opacity-0 pointer-events-none'}`}>
                      <div className="px-8 pb-10 grid grid-cols-12 gap-8">
                        <div className="col-span-4 flex flex-col gap-3 pt-6">
                          <Button variant="secondary" className="px-10 py-4 text-[0.65rem]" icon={ArrowUpRight}>Más información</Button>
                          <Button variant="outlineDark" className="px-10 py-4 text-[0.65rem]" icon={Plus} onClick={() => handleAddToCalendar(item)}>Añadir a mi Calendario</Button>
                        </div>
                        <div className="col-span-8 flex flex-col lg:flex-row justify-between items-start gap-10 pt-6 border-t border-slate-200">
                          <div className="space-y-5 flex-1">
                            <div className="flex flex-col">
                              <span className="text-[0.5rem] font-bold text-slate-400 uppercase tracking-[0.3em] mb-1.5">Detalles del Evento</span>
                              <p className="font-nunito text-slate-600 text-[0.85rem] leading-relaxed">
                                {item.desc}
                              </p>
                            </div>
                            <div className="grid grid-cols-2 gap-6">
                              <div className="flex flex-col">
                                <span className="text-[0.45rem] font-bold text-slate-400 uppercase tracking-widest mb-0.5">Lugar</span>
                                <span className="text-xs font-bold text-[#291242] flex items-center gap-2 tracking-wide uppercase font-alternate">{item.exactLocation || item.l}, Colombia</span>
                              </div>
                              <div className="flex flex-col">
                                <span className="text-[0.45rem] font-bold text-slate-400 uppercase tracking-widest mb-0.5">Organización</span>
                                <span className="text-xs font-bold text-[#291242] flex items-center gap-2 tracking-wide uppercase font-alternate">{item.organizer}</span>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-8 pt-8">
                  {filteredAgendaItems.map((item, idx) => {
                    const isCardOpen = openIndex === idx;

                    return (
                      <div
                        key={item.id}
                        onClick={() => setOpenIndex(isCardOpen ? -1 : idx)}
                        className={`bg-white rounded-[2rem] border border-slate-100 shadow-sm overflow-hidden group hover:shadow-xl transition-all duration-500 cursor-pointer ${isCardOpen ? 'shadow-xl border-[#8BF784]' : ''}`}
                      >
                        <div className="h-48 relative overflow-hidden">
                          <img src={item.img} className="w-full h-full object-cover transition-all duration-700" alt=""/>
                          <div className={`absolute inset-0 transition-all duration-500 ${isCardOpen ? 'bg-[#291242]/12' : 'bg-[#291242]/0 group-hover:bg-[#291242]/32'}`} />
                          <div className="absolute top-4 left-4">
                            <span className="text-[0.5rem] font-bold px-3 py-1.5 rounded-lg bg-[#00DA5E] text-[#291242] uppercase tracking-widest">
                              {item.cat}
                            </span>
                          </div>
                          <div className="absolute bottom-4 right-4 bg-white/90 backdrop-blur-md px-4 py-2 rounded-2xl flex flex-col items-center">
                            <span className="font-gregor text-2xl text-[#291242] font-bold leading-none">{item.d}</span>
                            <span className="text-[0.55rem] font-bold uppercase text-slate-500">{item.m}</span>
                            <span className="text-[0.45rem] font-bold text-[#291242]/40 tracking-widest -mt-0.5">{item.y}</span>
                          </div>
                        </div>
                        <div className="relative p-8">
                          <div className={`space-y-4 transition-opacity duration-500 ${isCardOpen ? 'opacity-0 pointer-events-none' : 'opacity-100'}`}>
                            <h4 className="font-alternate text-xl text-[#291242] uppercase font-bold leading-tight line-clamp-2">{item.t}</h4>
                            <div className="flex items-center gap-2 text-slate-400 font-bold text-[0.55rem] uppercase tracking-widest">
                              <MapPin size={12} className="text-[#00DA5E]" /> {item.l}
                            </div>
                            <p className="text-[0.75rem] text-slate-500 font-nunito line-clamp-3 leading-relaxed">
                              {item.desc}
                            </p>
                            <div className="pt-4 border-t border-slate-50 flex items-center justify-between">
                              <span className="text-[#291242] font-bold text-[0.6rem] uppercase font-alternate">{item.time}</span>
                              <button className="text-[#00DA5E] group-hover:translate-x-1 transition-transform"><ArrowUpRight size={18}/></button>
                            </div>
                          </div>

                          <div className={`absolute inset-8 overflow-hidden rounded-[1.4rem] bg-white transition-opacity duration-500 ${isCardOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}>
                            <div className="flex min-h-full flex-col justify-between gap-4 px-1 py-1">
                              <p className="font-nunito text-[0.76rem] leading-relaxed text-slate-600 line-clamp-5">
                                {item.desc}
                              </p>
                              <div className="grid grid-cols-2 gap-2">
                                <Button
                                  variant="secondary"
                                  className="w-full px-2 py-2 text-[0.44rem] leading-tight tracking-[0.08em]"
                                  icon={ArrowUpRight}
                                  onClick={(event) => {
                                    event.stopPropagation();
                                    if (item.link && item.link !== '#') window.open(item.link, '_blank', 'noopener,noreferrer');
                                  }}
                                >
                                  Más información
                                </Button>
                                <Button
                                  variant="outlineDark"
                                  className="w-full px-2 py-2 text-[0.44rem] leading-tight tracking-[0.08em]"
                                  icon={Plus}
                                  onClick={(event) => {
                                    event.stopPropagation();
                                    handleAddToCalendar(item);
                                  }}
                                >
                                  Añadir calendario
                                </Button>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </div>
      {bottomBanner}
    </>
  );
};

/* ==========================================================================
 * 04. PÁGINAS Y MÓDULOS PRINCIPALES
 * ========================================================================== */

const AgendaPage = ({ onBack, initialOpenEventId = null }) => {
  return (
    <div className="bg-white min-h-screen text-left">
      <PageHero 
        tag="Agenda" 
        title="Agenda y" 
        titleAccent="Eventos" 
        description="Explora los próximos eventos, talleres y encuentros territoriales del Plan Nacional de Música." 
        bgImage="https://images.unsplash.com/photo-1774558396280-c14b21198674?q=80&w=1470&auto=format&fit=crop" 
        onBack={onBack} 
      />
      
      <div id="agenda-explorador" className="max-w-[100rem] mx-auto px-6 lg:px-8 py-16 scroll-mt-28">
        <AgendaExplorer initialOpenEventId={initialOpenEventId} />
      </div>
    </div>
  );
};

export {
  AgendaPage,
  AgendaExplorer,
};
