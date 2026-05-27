import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { getWebText } from '../../../lib/webTexts.js';
import {
  ArrowUpRight,
  Calendar as CalendarIcon,
  ChevronLeft,
  ChevronRight,
  Clock,
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
  const [currentPage, setCurrentPage] = useState(1);
  const [dateMode, setDateMode] = useState('exact');
  const [viewMode, setViewMode] = useState('list');
  const [selectedDept, setselectedDept] = useState('');
  const [selectedMunicipality, setSelectedMunicipality] = useState('');
  const [selectedExactDate, setSelectedExactDate] = useState('');
  const [selectedMonthFilter, setSelectedMonthFilter] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('Todos');
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

  // Dynamically extract unique months and years from actual event dateObj values
  const uniqueMonths = useMemo(() => {
    const months = agendaItems.map(item => {
      if (!item.dateObj) return null;
      const year = item.dateObj.getFullYear();
      const monthIndex = item.dateObj.getMonth();
      const label = item.dateObj.toLocaleDateString('es-ES', { month: 'long', year: 'numeric' });
      const value = `${year}-${String(monthIndex + 1).padStart(2, '0')}`;
      return { value, label };
    }).filter(Boolean);

    // Filter unique by value
    return Array.from(new Map(months.map(m => [m.value, m])).values())
      .sort((a, b) => a.value.localeCompare(b.value));
  }, [agendaItems]);

  // Dynamically extract categories present in current event data
  const activityCategories = useMemo(() => {
    const cats = [...new Set(agendaItems.map(item => item.cat).filter(Boolean))];
    return ['Todos', ...cats];
  }, [agendaItems]);

  const filteredAgendaItems = useMemo(() => {
    const selectedDepartmentNormalized = normalizeDepartmentName(getDepartmentSelectionValue(selectedDept));
    const selectedMunicipalityNormalized = normalizeMunicipalityName(selectedMunicipality);

    return agendaItems.filter((item) => {
      // 1. Filter by location
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

      if (!matchesDepartment || !matchesMunicipality) return false;

      // 2. Filter by activity type
      const matchesCategory = selectedCategory === 'Todos' || item.cat === selectedCategory;
      if (!matchesCategory) return false;

      // 3. Filter by date / month selection
      if (dateMode === 'exact') {
        if (!selectedExactDate) return true;
        const filterDateObj = new Date(selectedExactDate + 'T00:00:00');
        return item.dateObj && 
               item.dateObj.getFullYear() === filterDateObj.getFullYear() &&
               item.dateObj.getMonth() === filterDateObj.getMonth() &&
               item.dateObj.getDate() === filterDateObj.getDate();
      } else {
        if (dateMode === 'month' && selectedMonthFilter) {
          const itemYear = item.dateObj.getFullYear();
          const itemMonthIndex = item.dateObj.getMonth();
          const itemMonthStr = `${itemYear}-${String(itemMonthIndex + 1).padStart(2, '0')}`;
          if (itemMonthStr !== selectedMonthFilter) return false;
        }

        return true;
      }
    });
  }, [agendaItems, selectedDept, selectedMunicipality, selectedExactDate, selectedMonthFilter, selectedCategory, dateMode]);

  useEffect(() => {
    const timeoutId = window.setTimeout(() => setCurrentPage(1), 0);
    return () => window.clearTimeout(timeoutId);
  }, [selectedDept, selectedMunicipality, selectedExactDate, selectedMonthFilter, selectedCategory, dateMode]);

  const ITEMS_PER_PAGE = 12;
  const totalPages = Math.ceil(filteredAgendaItems.length / ITEMS_PER_PAGE);

  const paginatedAgendaItems = useMemo(() => {
    const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
    return filteredAgendaItems.slice(startIndex, startIndex + ITEMS_PER_PAGE);
  }, [filteredAgendaItems, currentPage]);

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
          <aside id="agenda-filtros" className="bg-slate-50/50 border-r border-slate-100 p-8 lg:p-10 space-y-10 lg:sticky lg:top-20 lg:h-[calc(100vh-5rem)] overflow-y-auto self-start custom-scrollbar">
            <div className="w-full space-y-10">
              <div className="border-b border-slate-200 pb-5 flex justify-between items-center">
                <h4 className="font-alternate text-xs font-bold uppercase tracking-[0.25em] text-slate-500">
                  {getWebText('agenda_filter_title') || 'Filtros'}
                </h4>
                <Filter size={16} className="text-[#00DA5E]"/>
              </div>
              
              <div className="space-y-8">
                {lockedTag && (
                  <div className="space-y-3">
                    <label className="text-[0.6rem] font-bold text-slate-400 uppercase tracking-widest px-1">
                      {getWebText('agenda_filter_fixed') || 'Filtro fijo'}
                    </label>
                    <div className="px-4 py-4 bg-white border border-slate-200 rounded-xl shadow-sm">
                      <span className="text-[0.7rem] font-bold uppercase tracking-widest text-[#00DA5E]">{lockedTag}</span>
                      <p className="text-[0.65rem] text-slate-500 font-nunito mt-2 leading-relaxed">
                        {getWebText('agenda_filter_fixed_note') || 'Este criterio está aplicado de forma permanente en esta sección.'}
                      </p>
                    </div>
                  </div>
                )}
                <div className="space-y-6">
                  <div className="flex bg-white p-1 rounded-xl border border-slate-200 shadow-sm">
                    <button 
                      onClick={() => setDateMode('exact')}
                      className={`flex-1 py-2.5 text-[0.6rem] font-bold uppercase tracking-widest rounded-lg transition-all ${dateMode === 'exact' ? 'bg-[#291242] text-white shadow-sm' : 'text-slate-400 hover:text-[#291242] hover:bg-slate-50'}`}
                    >
                      {getWebText('agenda_filter_date_exact') || 'Fecha Exacta'}
                    </button>
                    <button 
                      onClick={() => setDateMode('month')}
                      className={`flex-1 py-2.5 text-[0.6rem] font-bold uppercase tracking-widest rounded-lg transition-all ${dateMode === 'month' ? 'bg-[#291242] text-white shadow-sm' : 'text-slate-400 hover:text-[#291242] hover:bg-slate-50'}`}
                    >
                      {getWebText('agenda_filter_date_month') || 'Por Mes'}
                    </button>
                  </div>
                  
                  <div className="space-y-3">
                    <label className="text-[0.6rem] font-bold text-slate-400 uppercase tracking-[0.2em] px-1">
                      {dateMode === 'exact' 
                        ? (getWebText('agenda_filter_day_label') || 'Seleccionar día') 
                        : (getWebText('agenda_filter_month_label') || 'Seleccionar mes')}
                    </label>
                    {dateMode === 'exact' ? (
                      <input 
                        type="date" 
                        value={selectedExactDate}
                        onChange={(e) => setSelectedExactDate(e.target.value)}
                        className="w-full bg-white border border-slate-200 rounded-xl py-3 px-4 text-[0.75rem] font-nunito focus:ring-2 focus:ring-[#00DA5E]/20 focus:border-[#00DA5E] transition-all outline-none text-[#291242] shadow-sm"
                      />
                    ) : (
                      <select 
                        value={selectedMonthFilter}
                        onChange={(e) => setSelectedMonthFilter(e.target.value)}
                        className="w-full bg-white border border-slate-200 rounded-xl px-4 py-3 text-[0.7rem] font-alternate uppercase appearance-none cursor-pointer focus:border-[#00DA5E] focus:ring-2 focus:ring-[#00DA5E]/20 outline-none text-[#291242] shadow-sm"
                      >
                        <option value="">{getWebText('agenda_filter_all_months') || 'Todos los meses'}</option>
                        {uniqueMonths.map((m) => (
                          <option key={m.value} value={m.value}>
                            {m.label}
                          </option>
                        ))}
                      </select>
                    )}
                  </div>
                </div>

                <div className="space-y-8">
                  <div className="space-y-3">
                    <label className="text-[0.6rem] font-bold text-slate-400 uppercase tracking-widest px-1">
                      {getWebText('agenda_filter_activity_type') || 'Tipo de actividad'}
                    </label>
                    <div className="grid grid-cols-1 gap-2.5">
                      {activityCategories.map(cat => (
                        <label key={cat} className="flex items-center gap-4 px-4 py-3 bg-white border border-slate-200 rounded-xl cursor-pointer hover:border-[#00DA5E] transition-colors group shadow-sm">
                          <input 
                            type="radio" 
                            name="cat" 
                            checked={selectedCategory === cat}
                            onChange={() => setSelectedCategory(cat)}
                            className="w-4 h-4 accent-[#00DA5E]" 
                          />
                          <span className="text-[0.7rem] font-alternate uppercase tracking-widest text-[#291242] group-hover:text-[#00DA5E] transition-colors">{cat}</span>
                        </label>
                      ))}
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div className="space-y-2.5">
                      <label className="text-[0.6rem] font-bold text-slate-400 uppercase tracking-widest px-1">
                        {getWebText('agenda_filter_department_label') || 'Departamento'}
                      </label>
                      <select 
                        value={selectedDept}
                        onChange={(e) => {
                          setselectedDept(e.target.value);
                          setSelectedMunicipality('');
                        }}
                        className="w-full bg-white border border-slate-200 rounded-xl px-4 py-3 text-[0.7rem] font-alternate uppercase appearance-none cursor-pointer focus:border-[#00DA5E] focus:ring-2 focus:ring-[#00DA5E]/20 outline-none text-[#291242] shadow-sm"
                      >
                        <option value="">{getWebText('agenda_filter_all_departments') || 'Todos los departamentos'}</option>
                        {departments.map(dept => (
                          <option key={dept} value={dept}>{dept}</option>
                        ))}
                      </select>
                    </div>

                    <div className="space-y-2.5">
                      <label className="text-[0.6rem] font-bold text-slate-400 uppercase tracking-widest px-1">
                        {getWebText('agenda_filter_city_label') || 'Ciudad o Municipio'}
                      </label>
                      <select 
                        value={selectedMunicipality}
                        onChange={(event) => setSelectedMunicipality(event.target.value)}
                        disabled={!selectedDept || cities.length === 0}
                        className="w-full bg-white border border-slate-200 rounded-xl px-4 py-3 text-[0.7rem] font-alternate uppercase appearance-none cursor-pointer focus:border-[#00DA5E] focus:ring-2 focus:ring-[#00DA5E]/20 outline-none disabled:opacity-50 disabled:cursor-not-allowed disabled:bg-slate-50 text-[#291242] shadow-sm"
                      >
                        <option value="">
                          {!selectedDept
                            ? (getWebText('agenda_filter_city_select_dept') || 'Selecciona primero departamento')
                            : cities.length > 0
                            ? (getWebText('agenda_filter_city_all_mun') || 'Todos los municipios')
                            : (getWebText('agenda_filter_city_no_mun') || 'Sin municipios disponibles')}
                        </option>
                        {cities.map(city => (
                          <option key={city} value={city}>{city}</option>
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
                setSelectedExactDate('');
                setSelectedMonthFilter('');
                setSelectedCategory('Todos');
              }} className="w-full bg-white border border-slate-200 hover:border-[#00DA5E] hover:text-[#00DA5E] text-slate-500 rounded-xl py-3.5 text-[0.7rem] font-bold uppercase font-alternate tracking-widest transition-all shadow-sm">
                {getWebText('agenda_filter_clear_btn') || 'Limpiar Filtros'}
              </button>
            </div>
          </aside>

          <div className="min-w-0 p-8 lg:p-12 xl:p-14">
            <div id="agenda-lista-eventos" className="flex flex-col sm:flex-row justify-between items-end gap-6 mb-8 scroll-mt-32">
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
            
            <div className="space-y-0 border-t border-slate-100 min-h-[calc(100vh-20rem)]">
              {isLoading || isRefreshing ? (
                <div className="py-10">
                  <LoadingState
                    title={getWebText('agenda_loading_title') || 'Cargando agenda...'}
                    description={getWebText('agenda_loading_desc') || 'Estamos sincronizando eventos territoriales.'}
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
                    title={getWebText('agenda_empty_title') || 'No hay eventos programados para este filtro'}
                    description={getWebText('agenda_empty_desc') || 'Prueba con otro criterio o vuelve más tarde.'}
                  />
                </div>
              ) : viewMode === 'list' ? (
                paginatedAgendaItems.map((item, idx) => (
                  <div 
                    key={item.id} 
                    ref={(el) => {
                      if (el) agendaItemRefs.current[item.id] = el;
                    }}
                    className={`border-b border-slate-100 transition-all duration-700 overflow-hidden border-l-4 ${openIndex === idx ? 'bg-slate-50 border-l-[#00DA5E]' : 'bg-transparent border-l-transparent hover:border-l-[#00DA5E]/50'}`}
                  >
                    <button 
                      onClick={() => setOpenIndex(openIndex === idx ? -1 : idx)}
                      className="w-full grid grid-cols-12 gap-6 px-5 py-5 items-center text-left group"
                    >
                      <div className="col-span-4 h-32 rounded-xl overflow-hidden shadow-sm relative">
                        <img src={item.img} className="w-full h-full object-cover transition-all duration-1000 group-hover:scale-110" alt=""/>
                        <div className="absolute inset-0 bg-[#291242]/0 transition-all duration-700 group-hover:bg-[#291242]/32" />
                        <div className="absolute top-2.5 left-2.5">
                          <span className="text-[0.5rem] font-bold px-2 py-1 rounded bg-[#00DA5E] text-[#291242] uppercase tracking-widest">
                            {item.cat}
                          </span>
                        </div>
                      </div>
                      
                      <div className="col-span-5">
                        <h3 className="font-alternate text-xl lg:text-2xl uppercase text-[#291242] leading-tight mb-2 tracking-tight">
                          {item.t}
                        </h3>
                        <p className="font-nunito text-slate-500 text-[0.75rem] line-clamp-2 leading-relaxed max-w-sm">
                          {item.desc}
                        </p>
                        <div className="mt-3 flex items-center gap-2 text-slate-400 font-bold text-[0.55rem] uppercase tracking-widest">
                          <MapPin size={10} className="text-[#00DA5E]" /> {item.l}
                        </div>
                      </div>

                      <div className="col-span-3 flex items-center justify-end border-l border-slate-100 pl-6 group-hover:border-[#00DA5E] transition-colors">
                        <div className="flex flex-col items-end mr-4">
                          <span className="text-slate-400 font-bold text-[0.5rem] uppercase tracking-[0.2em] mb-1">Año {item.y}</span>
                          <span className="text-[#00DA5E] font-bold text-[0.6rem] uppercase tracking-widest">{item.time}</span>
                        </div>
                        <div className="flex flex-col items-center justify-center bg-slate-50 group-hover:bg-[#00DA5E] rounded-xl w-20 h-24 transition-colors shadow-sm">
                          <span className="text-[0.6rem] font-bold uppercase tracking-widest text-slate-400 group-hover:text-[#291242]">
                            {item.dateObj ? item.dateObj.toLocaleDateString('es-ES', { month: 'short' }).replace('.', '') : `Mes ${item.m}`}
                          </span>
                          <span className="font-alternate text-4xl lg:text-5xl text-[#291242] font-bold leading-[1.1] mt-0.5 -mb-0.5 text-balance">
                            {String(item.d).padStart(2, '0')}
                          </span>
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
                  {paginatedAgendaItems.map((item, idx) => {
                    const isCardOpen = openIndex === idx;

                    return (
                      <div
                        key={item.id}
                        onClick={() => setOpenIndex(isCardOpen ? -1 : idx)}
                        className={`relative flex flex-col h-full bg-white rounded-[2rem] border border-slate-100 shadow-sm overflow-hidden group hover:shadow-xl transition-all duration-500 cursor-pointer ${isCardOpen ? 'shadow-xl border-[#8BF784]' : ''}`}
                      >
                        <div className="h-48 relative overflow-hidden">
                          <img src={item.img} className="w-full h-full object-cover transition-all duration-700" alt=""/>
                          <div className={`absolute inset-0 transition-all duration-500 ${isCardOpen ? 'bg-[#291242]/12' : 'bg-[#291242]/0 group-hover:bg-[#291242]/32'}`} />
                          <div className="absolute top-4 left-4">
                            <span className="text-[0.5rem] font-bold px-3 py-1.5 rounded-lg bg-[#00DA5E] text-[#291242] uppercase tracking-widest">
                              {item.cat}
                            </span>
                          </div>
                          <div className="absolute bottom-4 right-4 bg-white/95 backdrop-blur-md px-4 py-3 rounded-[1.2rem] flex flex-col items-center shadow-lg border border-white">
                            <span className="text-[0.55rem] font-bold uppercase tracking-widest text-[#00DA5E]">
                              {item.dateObj ? item.dateObj.toLocaleDateString('es-ES', { month: 'short' }).replace('.', '') : item.m}
                            </span>
                            <span className="font-alternate text-4xl text-[#291242] font-bold leading-[1.1] mt-1 -mb-1 text-balance">
                              {String(item.d).padStart(2, '0')}
                            </span>
                            <span className="text-[0.45rem] font-bold text-slate-400 tracking-[0.2em] mt-1.5">{item.y}</span>
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
                        </div>

                        {/* Vista de detalle que cubre toda la tarjeta */}
                        <div className={`absolute inset-0 z-20 bg-white p-8 transition-all duration-500 flex flex-col ${isCardOpen ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8 pointer-events-none'}`}>
                          <div className="flex-1 overflow-y-auto custom-scrollbar pr-2 mb-4 space-y-4">
                            <div className="flex items-start justify-between gap-4">
                              <h4 className="font-alternate text-xl text-[#291242] uppercase font-bold leading-tight">{item.t}</h4>
                              <div className="flex flex-col items-center shrink-0 border border-slate-100 bg-slate-50 rounded-xl px-3 py-1.5">
                                <span className="text-[0.45rem] font-bold uppercase tracking-widest text-[#00DA5E]">{item.dateObj ? item.dateObj.toLocaleDateString('es-ES', { month: 'short' }).replace('.', '') : item.m}</span>
                                <span className="font-alternate text-2xl text-[#291242] font-bold leading-none my-0.5">{String(item.d).padStart(2, '0')}</span>
                              </div>
                            </div>
                            <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-slate-400 font-bold text-[0.6rem] uppercase tracking-widest">
                              <span className="flex items-center gap-1.5"><MapPin size={13} className="text-[#00DA5E]" /> {item.l}</span>
                              <span className="flex items-center gap-1.5"><Clock size={13} className="text-[#00DA5E]" /> {item.time}</span>
                            </div>
                            <p className="font-nunito text-[0.85rem] leading-relaxed text-slate-600 mt-2">
                              {item.desc}
                            </p>
                          </div>
                          <div className="flex flex-col gap-2 shrink-0 pt-4 border-t border-slate-100">
                            <Button
                              variant="secondary"
                              className="w-full justify-center py-3.5 text-[0.65rem] tracking-[0.15em]"
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
                              className="w-full justify-center py-3.5 text-[0.65rem] tracking-[0.15em]"
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
                    );
                  })}
                </div>
              )}
            </div>

            {totalPages > 1 && (
              <div className="mt-12 flex items-center justify-center gap-3">
                <button
                  onClick={() => {
                    setCurrentPage(p => Math.max(1, p - 1));
                    setOpenIndex(-1);
                    scrollToElementWithOffset(document.getElementById('agenda-lista-eventos'), 112);
                  }}
                  disabled={currentPage === 1}
                  className="w-11 h-11 flex items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-400 hover:text-[#291242] hover:border-[#00DA5E] disabled:opacity-50 disabled:hover:border-slate-200 disabled:hover:text-slate-400 transition-all shadow-sm"
                >
                  <ChevronLeft size={20} />
                </button>
                
                <div className="flex items-center justify-center bg-white border border-slate-200 rounded-xl px-5 h-11 shadow-sm text-[0.65rem] font-bold text-slate-500 font-nunito tracking-widest uppercase">
                  Página <span className="text-[#291242] text-[0.8rem] mx-2">{currentPage}</span> de {totalPages}
                </div>

                <button
                  onClick={() => {
                    setCurrentPage(p => Math.min(totalPages, p + 1));
                    setOpenIndex(-1);
                    scrollToElementWithOffset(document.getElementById('agenda-lista-eventos'), 112);
                  }}
                  disabled={currentPage === totalPages}
                  className="w-11 h-11 flex items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-400 hover:text-[#291242] hover:border-[#00DA5E] disabled:opacity-50 disabled:hover:border-slate-200 disabled:hover:text-slate-400 transition-all shadow-sm"
                >
                  <ChevronRight size={20} />
                </button>
              </div>
            )}
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
        description={getWebText('agenda_description')} 
        bgImage="https://images.unsplash.com/photo-1774558396280-c14b21198674?q=80&w=1470&auto=format&fit=crop" 
        onBack={onBack} 
      />
      
      <div id="agenda-explorador" className="max-w-[100rem] mx-auto scroll-mt-28">
        <AgendaExplorer initialOpenEventId={initialOpenEventId} />
      </div>
    </div>
  );
};

export {
  AgendaPage,
  AgendaExplorer,
};
