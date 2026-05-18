import { useCallback, useEffect, useMemo, useState } from 'react';
import { ArrowRight, ArrowUpRight, CalendarDays, ChevronRight, MapPin } from 'lucide-react';
import { Button, EmptyState, ErrorState, LoadingState } from '../../../components/ui/index.js';
import { useAgenda, useNews } from '../../../hooks/data/index.js';
import { buildAgendaItemFromRecord, buildNewsItemFromRecord } from '../../content/domain/mediaLibrary.js';
import { ContentWrapper, SectionHeader } from '../../shared/components/PagePrimitives.jsx';

export const NoticiasAgendaPreview = ({ onNavigate, onNavigateToArticle, onNavigateToAgendaEvent }) => {
  const [activeTab, setActiveTab] = useState(0);
  const [activeNewsGroup, setActiveNewsGroup] = useState(0);
  const previewAgendaParams = useMemo(() => ({ maxRecords: 6 }), []);
  const previewNewsParams = useMemo(() => ({ maxRecords: 10 }), []);

  const mapPreviewAgendaRecord = useCallback((record) => {
    const agendaItem = buildAgendaItemFromRecord(record);

    return {
      id: agendaItem.id,
      d: agendaItem.d,
      month: agendaItem.m,
      t: agendaItem.t,
      l: agendaItem.l,
      cat: agendaItem.cat,
      desc: agendaItem.desc,
      dateObj: agendaItem.dateObj,
      timeValue: agendaItem.timeValue,
    };
  }, []);

  const sortPreviewAgendaItems = useCallback((leftItem, rightItem) => {
    if (leftItem.dateObj.getTime() !== rightItem.dateObj.getTime()) {
      return leftItem.dateObj - rightItem.dateObj;
    }
    return leftItem.timeValue - rightItem.timeValue;
  }, []);

  const agendaPreview = useAgenda({
    params: previewAgendaParams,
    mapRecord: mapPreviewAgendaRecord,
    sortItems: sortPreviewAgendaItems,
  });

  const newsPreviewResource = useNews({
    params: previewNewsParams,
    mapRecord: buildNewsItemFromRecord,
  });

  const agendaItems = agendaPreview.items;
  const newsPreview = newsPreviewResource.items;
  const isLoading = agendaPreview.isLoading || newsPreviewResource.isLoading;
  const isRefreshing = agendaPreview.isRefreshing || newsPreviewResource.isRefreshing;
  const hasError = agendaPreview.isError || newsPreviewResource.isError;
  const previewError = agendaPreview.error || newsPreviewResource.error;
  const handleRetryPreview = () => {
    agendaPreview.retry();
    newsPreviewResource.retry();
  };

  useEffect(() => {
    const timer = setInterval(() => {
      setActiveNewsGroup((prev) => (prev === 0 ? 1 : 0));
    }, 30000);
    return () => clearInterval(timer);
  }, []);

  const featuredGroup = activeNewsGroup === 0 ? newsPreview.slice(0, 3) : newsPreview.slice(3, 6);

  return (
    <ContentWrapper className="bg-white border-y border-slate-100">
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-stretch">
        <div className="lg:col-span-8 flex flex-col text-left">
          <SectionHeader backgroundText="NOTICIAS" foregroundText="Actualidad" verticalContext="NEWS" compact />
          {isLoading || isRefreshing ? (
            <LoadingState
              title="Cargando noticias y agenda..."
              description="Preparamos un resumen con la información más reciente."
            />
          ) : hasError ? (
            <ErrorState
              title="No pudimos cargar la portada informativa"
              description={previewError?.message || 'Intenta recargar en unos segundos.'}
              onRetry={handleRetryPreview}
            />
          ) : (
            <>
              <div className="grid grid-cols-12 gap-5 mb-8">
                {featuredGroup.length > 0 && (
                  <>
                    <article
                      onClick={() => onNavigateToArticle(featuredGroup[0])}
                      className="col-span-12 group cursor-pointer bg-slate-50 rounded-3xl overflow-hidden border border-slate-100 flex flex-col lg:flex-row h-auto lg:h-[320px] transition-all duration-700 hover:shadow-2xl"
                    >
                      <div className="lg:w-7/12 h-[220px] lg:h-full overflow-hidden">
                        <img src={featuredGroup[0].img} className="w-full h-full object-cover transition-transform duration-1000 group-hover:scale-105" alt="" />
                      </div>
                      <div className="lg:w-5/12 p-8 flex flex-col justify-center text-left bg-white relative text-slate-800">
                        <div className="absolute top-0 left-0 w-1.5 h-full bg-[#00DA5E]"></div>
                        <span className="text-[0.55rem] text-[#00DA5E] font-bold uppercase tracking-[0.2em]">{featuredGroup[0].date} • {featuredGroup[0].category}</span>
                        <h4 className="font-alternate text-2xl text-[#291242] font-bold uppercase mt-3 leading-none tracking-tight">{featuredGroup[0].title}</h4>
                        <p className="text-[0.75rem] text-slate-500 font-nunito mt-4 line-clamp-3 leading-relaxed">{featuredGroup[0].desc}</p>
                        <div className="mt-6 flex items-center gap-2 text-[0.6rem] font-bold text-[#291242] uppercase font-alternate tracking-widest group-hover:text-[#00DA5E]">Leer más <ArrowUpRight size={14} /></div>
                      </div>
                    </article>

                    {featuredGroup.slice(1, 3).map((item, idx) => (
                      <article key={idx} onClick={() => onNavigateToArticle(item)} className="col-span-12 md:col-span-6 group cursor-pointer bg-white rounded-3xl overflow-hidden border border-slate-100 flex h-[170px] transition-all duration-500 hover:shadow-lg">
                        <div className="w-1/3 h-full overflow-hidden">
                          <img src={item.img} className="w-full h-full object-cover grayscale group-hover:grayscale-0 transition-all duration-700" alt="" />
                        </div>
                        <div className="w-2/3 p-5 text-left flex flex-col justify-center relative bg-white">
                          <span className="text-[0.45rem] font-bold text-[#00DA5E] uppercase tracking-widest">{item.date}</span>
                          <h4 className="font-alternate text-[0.9rem] text-[#291242] font-bold uppercase mt-1 leading-tight group-hover:text-[#6100D7] line-clamp-2">{item.title}</h4>
                          <p className="text-[0.65rem] text-slate-500 font-nunito mt-2 line-clamp-2 leading-relaxed">{item.desc}</p>
                          <div className="mt-2 flex items-center gap-1.5 text-[0.55rem] font-bold text-[#291242] uppercase font-alternate tracking-widest group-hover:text-[#00DA5E]">Leer más <ArrowUpRight size={12} /></div>
                        </div>
                      </article>
                    ))}
                  </>
                )}
              </div>
              <div className="flex justify-start">
                <Button
                  type="button"
                  onClick={() => onNavigate('noticias')}
                  variant="outlineDark"
                  className="px-8 py-3 text-[0.65rem]"
                  icon={ArrowRight}
                >
                  Explorar todas las noticias
                </Button>
              </div>
            </>
          )}
        </div>

        <aside className="lg:col-span-4 flex flex-col lg:self-center text-left">
          <div className="bg-slate-50 rounded-[2.5rem] border border-slate-200 h-[660px] flex flex-col relative overflow-hidden group/agenda shadow-inner">
            <div className="p-6 flex items-center justify-between border-b border-slate-200 bg-white shadow-sm relative z-10">
              <h3 className="font-alternate text-xl text-[#291242] font-bold uppercase tracking-tight">Agenda <span className="text-[#00DA5E] italic text-sm">Prográmate</span></h3>
              <div className="w-10 h-10 bg-[#291242] rounded-xl flex items-center justify-center text-white shadow-lg"><CalendarDays size={18} /></div>
            </div>
            <div className="flex-1 overflow-y-auto relative bg-white/20 custom-scrollbar">
              {isLoading || isRefreshing ? (
                <div className="h-full p-4">
                  <LoadingState
                    title="Cargando agenda..."
                    description="Actualizando eventos destacados."
                  />
                </div>
              ) : hasError ? (
                <div className="h-full p-4">
                  <ErrorState
                    title="No pudimos cargar la agenda"
                    description={previewError?.message || 'Intenta nuevamente.'}
                    onRetry={handleRetryPreview}
                  />
                </div>
              ) : agendaItems.length === 0 ? (
                <div className="h-full p-4">
                  <EmptyState
                    title="No hay eventos destacados"
                    description="Vuelve pronto para revisar nuevas fechas."
                  />
                </div>
              ) : (
                <div className="p-2 space-y-1 relative">
                  {agendaItems.map((e, idx) => (
                    <div
                      key={e.id || idx}
                      onClick={() => onNavigateToAgendaEvent(e.id)}
                      onMouseEnter={() => setActiveTab(idx)}
                      className={`group relative min-h-[124px] p-5 rounded-[1.8rem] border transition-all duration-300 cursor-pointer ${activeTab === idx ? 'bg-white border-slate-200 shadow-md z-10' : 'bg-transparent border-transparent hover:bg-white/60'}`}
                    >
                      <div className="relative z-10 flex items-start gap-4 h-full">
                        <div className={`flex flex-col items-center justify-center min-w-[3.5rem] h-14 rounded-2xl transition-colors duration-300 ${activeTab === idx ? 'bg-[#291242] text-white' : 'bg-slate-200 text-slate-500 group-hover:bg-slate-300'}`}>
                          <span className="text-xl font-bold leading-none">{e.d}</span>
                          <span className="text-[0.55rem] font-bold uppercase tracking-tighter">{e.month}</span>
                        </div>
                        <div className="flex-1 min-w-0 text-left">
                          <h5 className={`font-alternate text-[0.9rem] uppercase font-bold leading-tight line-clamp-2 transition-colors duration-300 ${activeTab === idx ? 'text-[#291242]' : 'text-slate-700'}`}>{e.t}</h5>
                          <div className="flex flex-wrap items-center gap-2 mt-1">
                            <div className="flex items-center gap-1 min-w-0">
                              <MapPin size={12} className={`transition-colors duration-300 ${activeTab === idx ? 'text-[#00DA5E]' : 'text-slate-500'}`} />
                              <span className={`text-[0.65rem] uppercase font-bold tracking-widest truncate transition-colors duration-300 ${activeTab === idx ? 'text-[#291242]/70' : 'text-slate-500'}`}>{e.l}</span>
                            </div>
                            <span className="text-slate-300">•</span>
                            <span className={`text-[0.65rem] uppercase font-bold tracking-widest truncate transition-colors duration-300 ${activeTab === idx ? 'text-[#291242]/70' : 'text-slate-500'}`}>{e.cat}</span>
                          </div>
                          <div className="mt-2 overflow-hidden">
                            <p className="text-[0.7rem] font-nunito leading-relaxed text-slate-600 line-clamp-2 transition-all duration-300">
                              {e.desc}
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
            <div
              onClick={() => onNavigate('agenda')}
              className="bg-[#291242] text-white p-6 cursor-pointer group/banner transition-all duration-500 hover:bg-[#6100D7] flex items-center justify-between mt-auto border-t border-white/5 relative z-20 rounded-b-[2.5rem]"
            >
              <span className="font-alternate text-xs font-bold uppercase tracking-[0.2em]">Ver Calendario Completo</span>
              <div className="bg-[#00DA5E] text-[#291242] p-2 rounded-lg transition-transform duration-500 group-hover/banner:translate-x-1 group-hover/banner:bg-white">
                <ChevronRight size={16} strokeWidth={3} />
              </div>
            </div>
          </div>
        </aside>
      </div>
    </ContentWrapper>
  );
};
