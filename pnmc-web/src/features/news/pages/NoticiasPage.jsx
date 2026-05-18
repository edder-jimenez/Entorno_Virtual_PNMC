import { useEffect, useMemo, useState } from 'react';
import {
  ArrowLeft,
  ArrowRight,
  ArrowUpRight,
  Calendar,
  FileType,
  Filter,
  Plus,
  Search,
  Share2,
} from 'lucide-react';
import { Button, EmptyState, ErrorState, LoadingState } from '../../../components/ui/index.js';
import { useNews } from '../../../hooks/data/index.js';
import { getNewsDateKeys } from '../../../services/data/index.js';
import {
  NEWS_MONTH_FILTER_OPTIONS,
  splitHeroHeadline,
} from '../../content/domain/contentPresentation.js';
import { buildNewsItemFromRecord } from '../../content/domain/mediaLibrary.js';
import { scrollToElementWithOffset } from '../../map/domain/mapDomain.js';
import { PageHero, Tag } from '../../shared/components/PagePrimitives.jsx';
import { sanitizeHtml } from '../../../lib/sanitizeHtml.js';

const NoticiasPage = ({ onBack, initialSelectedArticle = null }) => {
  const [selectedArticle, setSelectedArticle] = useState(initialSelectedArticle);
  const [newsSearchTerm, setNewsSearchTerm] = useState('');
  const [newsMonthFilter, setNewsMonthFilter] = useState('');
  const [newsExactDateFilter, setNewsExactDateFilter] = useState('');
  const [newsCategoryFilter, setNewsCategoryFilter] = useState('all');
  const [newsSortOrder, setNewsSortOrder] = useState('newest');
  const {
    items: newsData,
    isLoading,
    isRefreshing,
    isError,
    error,
    retry,
  } = useNews({
    mapRecord: buildNewsItemFromRecord,
  });

  const newsListPool = useMemo(() => newsData.slice(3), [newsData]);
  const newsCategoryOptions = useMemo(() => (
    [...new Set(newsListPool.map((item) => item.category).filter(Boolean))]
  ), [newsListPool]);
  const filteredListNews = useMemo(() => (
    [...newsListPool]
      .filter((item) => {
      const normalizedSearch = newsSearchTerm.trim().toLowerCase();
      const searchableText = [item.title, item.desc, item.category]
        .filter(Boolean)
        .join(' ')
        .toLowerCase();
      const matchesSearch = !normalizedSearch || searchableText.includes(normalizedSearch);
      if (!matchesSearch) return false;

      const matchesCategory = newsCategoryFilter === 'all' || item.category === newsCategoryFilter;
      const dateKeys = getNewsDateKeys(item.date);
      const matchesDate = newsExactDateFilter
        ? dateKeys?.dateKey === newsExactDateFilter
        : !newsMonthFilter || dateKeys?.monthKey === newsMonthFilter;

      return matchesCategory && matchesDate;
    })
      .sort((leftItem, rightItem) => {
        const leftDate = getNewsDateKeys(leftItem.date)?.dateKey || '';
        const rightDate = getNewsDateKeys(rightItem.date)?.dateKey || '';

        if (leftDate === rightDate) {
          return leftItem.title.localeCompare(rightItem.title, 'es', { sensitivity: 'base' });
        }

        return newsSortOrder === 'oldest'
          ? leftDate.localeCompare(rightDate)
          : rightDate.localeCompare(leftDate);
      })
  ), [newsListPool, newsSearchTerm, newsCategoryFilter, newsMonthFilter, newsExactDateFilter, newsSortOrder]);
  const compactNewsCards = filteredListNews.slice(0, 3);
  const listedNews = filteredListNews.slice(3);
  const hasActiveNewsFilters = Boolean(
    newsSearchTerm.trim() || newsMonthFilter || newsExactDateFilter || newsCategoryFilter !== 'all' || newsSortOrder !== 'newest'
  );
  const selectedArticleHeroCopy = useMemo(
    () => splitHeroHeadline(selectedArticle?.title || ''),
    [selectedArticle]
  );
  const selectedArticleSafeContent = useMemo(
    () => sanitizeHtml(selectedArticle?.content || ''),
    [selectedArticle?.content]
  );

  useEffect(() => {
    if (selectedArticle) {
      window.scrollTo({ top: 0, behavior: 'instant' });
    }
  }, [selectedArticle]);

  if (selectedArticle) {
    return (
      <div className="bg-white min-h-screen text-left">
        <PageHero 
          tag={selectedArticle.category}
          title={selectedArticleHeroCopy.title}
          titleAccent={selectedArticleHeroCopy.titleAccent}
          description={selectedArticle.desc}
          bgImage={selectedArticle.img}
          onBack={() => setSelectedArticle(null)}
          compactNews={true}
          backOnly={true}
        />
        <div className="max-w-[100rem] mx-auto px-6 lg:px-12 py-16">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-16">
            
            <aside className="hidden lg:block lg:col-span-3">
              <div className="sticky top-28 rounded-[2.2rem] border border-slate-100 bg-slate-50/80 p-6 xl:p-7 space-y-6">
                <div className="space-y-3 pb-5 border-b border-slate-100">
                  <span className="inline-flex items-center rounded-full bg-white px-3 py-1.5 font-alternate text-[0.52rem] font-bold uppercase tracking-[0.22em] text-slate-400 border border-slate-100">
                    Sigue explorando
                  </span>
                  <h4 className="font-alternate text-[1rem] text-[#291242] uppercase tracking-[0.12em] font-bold">Otras historias</h4>
                  <p className="text-[0.78rem] text-slate-500 font-nunito leading-relaxed">
                    Una selección de lecturas relacionadas para continuar el recorrido editorial.
                  </p>
                </div>
                <div className="overflow-hidden">
                  {newsData.filter((item) => item.id !== selectedArticle.id).slice(0, 5).map((item, index, items) => (
                    <article
                      key={item.id}
                      onClick={() => setSelectedArticle(item)}
                      className={`group cursor-pointer px-1 py-4 transition-all duration-500 hover:bg-white/40 ${index < items.length - 1 ? 'border-b border-slate-100' : ''}`}
                    >
                      <div className="grid grid-cols-[5.5rem_minmax(0,1fr)] gap-3 items-center">
                        <div className="aspect-[4/3] rounded-[0.95rem] overflow-hidden bg-slate-100">
                          <div className="relative w-full h-full">
                            <img src={item.img} className="w-full h-full object-cover transition-all duration-700 group-hover:scale-105" alt=""/>
                            <div className="absolute inset-0 bg-[#291242]/0 transition-all duration-700 group-hover:bg-[#291242]/32" />
                          </div>
                        </div>
                        <div className="space-y-1.5 min-w-0">
                          <span className="block text-[0.5rem] font-bold text-[#00DA5E] uppercase tracking-[0.18em]">{item.date}</span>
                          <h5 className="font-alternate text-[0.72rem] text-[#291242] uppercase font-bold leading-tight group-hover:text-[#6100D7] transition-colors line-clamp-3">
                            {item.title}
                          </h5>
                        </div>
                      </div>
                    </article>
                  ))}
                  <div className="border-t border-slate-100 pt-4">
                    <Button variant="outlineDark" className="w-full py-3 text-[0.6rem]" onClick={() => setSelectedArticle(null)}>Ver todas</Button>
                  </div>
                </div>
              </div>
            </aside>

            <div className="col-span-12 lg:col-span-9 space-y-12">
              <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,1fr)_15rem] gap-8 items-start">
                <div className="space-y-5 pb-2">
                  <h1 className="max-w-5xl font-gregor text-3xl sm:text-4xl lg:text-6xl leading-[1.05] uppercase tracking-tighter">
                    <span className="text-[#291242]">{selectedArticleHeroCopy.title}</span>
                    {selectedArticleHeroCopy.titleAccent && (
                      <span className="text-[#00DA5E] italic"> {selectedArticleHeroCopy.titleAccent}</span>
                    )}
                  </h1>
                  <p className="max-w-4xl text-2xl text-[#291242] font-bold leading-snug">
                    {selectedArticle.desc}
                  </p>
                </div>
                <div className="flex flex-col items-end text-right gap-5 pt-2">
                  <div className="flex flex-col items-end">
                    <span className="text-[0.55rem] font-bold text-slate-400 uppercase tracking-widest mb-1">Fecha de publicación</span>
                    <span className="text-sm font-bold text-[#291242] font-alternate">{selectedArticle.date} 2026</span>
                  </div>
                  <div className="flex flex-col items-end">
                    <span className="text-[0.55rem] font-bold text-slate-400 uppercase tracking-widest mb-1">Categoría</span>
                    <span className="text-sm font-bold text-[#00DA5E] font-alternate">{selectedArticle.category}</span>
                  </div>
                </div>
              </div>
              
              <div className="max-w-4xl">
                <div className="space-y-8 text-slate-600 font-nunito text-lg font-light leading-relaxed">
                  {selectedArticle.content ? (
                    <div dangerouslySetInnerHTML={{ __html: selectedArticleSafeContent }} />
                  ) : (
                    <>
                      <p>Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat.</p>
                      <p>Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum.</p>
                      <div className="py-6">
                        <img src={selectedArticle.img} className="w-full h-[400px] object-cover rounded-[3rem] shadow-xl" alt=""/>
                        <span className="text-[0.6rem] text-slate-400 italic mt-4 block text-center">Registro fotográfico — Archivo PNMC 2026</span>
                      </div>
                      <blockquote className="border-l-4 border-[#00DA5E] pl-8 py-4 italic text-2xl text-[#291242] bg-slate-50 rounded-r-[2rem]">
                        "La música no solo es un arte, es una herramienta de transformación social que conecta los territorios más alejados de nuestra geografía y construye puentes de paz."
                      </blockquote>
                      <p>Sed ut perspiciatis unde omnis iste natus error sit voluptatem accusantium doloremque laudantium, totam rem aperiam, eaque ipsa quae ab illo inventore veritatis et quasi architecto beatae vitae dicta sunt explicabo.</p>
                    </>
                  )}
                </div>
              </div>

              <div className="pt-16 border-t border-slate-100 flex flex-col sm:flex-row justify-between items-center gap-8">
                 <button onClick={() => setSelectedArticle(null)} className="flex items-center gap-3 text-xs font-bold text-[#291242] uppercase font-alternate tracking-[0.2em] hover:gap-5 transition-all"><ArrowLeft size={16} className="text-[#00DA5E]"/> Volver al listado de noticias</button>
                 <div className="flex items-center gap-4">
                   <span className="text-[0.6rem] font-bold text-slate-400 uppercase tracking-widest">Compartir:</span>
                   <button className="w-12 h-12 rounded-full border border-slate-100 flex items-center justify-center text-slate-400 hover:bg-[#291242] hover:text-white transition-all shadow-sm"><Share2 size={18}/></button>
                   <button className="w-12 h-12 rounded-full border border-slate-100 flex items-center justify-center text-slate-400 hover:bg-[#291242] hover:text-white transition-all shadow-sm"><Plus size={18}/></button>
                 </div>
              </div>
            </div>

          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-slate-50 min-h-screen text-left overflow-x-hidden">
      <PageHero 
        tag="Noticias" 
        title="Noticias y" 
        titleAccent="Actualidad" 
        description="Crónicas, lanzamientos y reportes del impacto sonoro en los territorios nacionales." 
        bgImage="https://images.unsplash.com/photo-1774558396253-be05d7a37d82?q=80&w=1470&auto=format&fit=crop" 
        onBack={onBack} 
      />

      <div className="max-w-[100rem] mx-auto px-6 lg:px-12 py-24">
          <div id="noticias-destacadas" className="mb-14 scroll-mt-28">
          <div className="flex items-center justify-between mb-10 border-b border-slate-200 pb-6">
            <div className="space-y-1">
              <h2 className="font-gregor text-4xl lg:text-5xl text-[#291242] font-bold uppercase tracking-tighter">Narrativas Sonoras</h2>
              <p className="text-slate-400 font-alternate text-xs uppercase tracking-[0.3em]">Análisis y profundidad del PNMC</p>
            </div>
            {!isLoading && !isError && newsData.length > 0 && (
              <div className="hidden lg:flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => {
                    const targetElement = document.getElementById('noticias-destacadas');
                    if (targetElement) {
                      scrollToElementWithOffset(targetElement, 140);
                    }
                  }}
                  className="px-5 py-3 rounded-full bg-[#291242] text-white font-alternate text-[0.58rem] font-bold uppercase tracking-[0.22em] transition-all hover:bg-[#3a1a5b]"
                >
                  Ir a destacadas
                </button>
                <button
                  type="button"
                  onClick={() => {
                    const targetElement = document.getElementById('noticias-filtros');
                    if (targetElement) {
                      scrollToElementWithOffset(targetElement, 140);
                    }
                  }}
                  className="px-5 py-3 rounded-full border border-slate-200 bg-white text-slate-500 font-alternate text-[0.58rem] font-bold uppercase tracking-[0.22em] transition-all hover:border-[#291242] hover:text-[#291242]"
                >
                  Explorar noticias
                </button>
              </div>
            )}
          </div>

          {isLoading || isRefreshing ? (
            <div className="py-10">
              <LoadingState
                title="Cargando noticias..."
                description="Estamos sincronizando la actualidad del PNMC."
              />
            </div>
          ) : isError ? (
            <div className="py-10">
              <ErrorState
                title="No pudimos cargar las noticias"
                description={error?.message || 'Intenta nuevamente en unos segundos.'}
                onRetry={retry}
              />
            </div>
          ) : newsData.length === 0 ? (
            <div className="py-10">
              <EmptyState
                title="No hay noticias disponibles por ahora"
                description="Vuelve pronto para revisar novedades."
              />
            </div>
          ) : (
            <>
              <div className="overflow-hidden rounded-[3.5rem] border border-slate-100 bg-white shadow-sm">
                <div className="grid grid-cols-1 lg:grid-cols-12">
                <div className="lg:col-span-8">
                  <article onClick={() => setSelectedArticle(newsData[0])} className="group relative h-[520px] rounded-[3.5rem] overflow-hidden shadow-2xl bg-[#291242] cursor-pointer">
                    <img src={newsData[0].img} className="absolute inset-0 w-full h-full object-cover grayscale opacity-50 group-hover:grayscale-0 group-hover:scale-105 transition-all duration-1000" alt=""/>
                    <div className="absolute inset-0 bg-gradient-to-t from-[#291242] via-[#291242]/20 to-transparent"></div>
                    <div className="absolute inset-0 p-12 flex flex-col justify-end">
                      <div className="space-y-5 max-w-2xl">
                        <div className="flex items-center gap-4">
                          <Tag text={newsData[0].category} className="bg-[#00DA5E] text-[#291242]" />
                          <span className="text-white/60 font-alternate text-[0.65rem] font-bold tracking-widest uppercase">{newsData[0].date}</span>
                        </div>
                        <h3 className="font-gregor text-4xl lg:text-6xl text-white font-bold uppercase leading-[0.9] tracking-tighter">
                          {newsData[0].title}
                        </h3>
                        <p className="font-nunito text-slate-300 text-lg font-light leading-relaxed line-clamp-3">
                          {newsData[0].desc}
                        </p>
                        <div className="pt-6">
                          <button className="flex items-center gap-4 text-[#00DA5E] font-alternate text-sm font-bold uppercase tracking-[0.25em] group/btn">
                            Ver historia completa <ArrowRight size={20} className="group-hover/btn:translate-x-2 transition-transform" />
                          </button>
                        </div>
                      </div>
                    </div>
                  </article>
                </div>

                <div className="lg:col-span-4 flex flex-col border-t border-slate-100 lg:border-t-0 lg:border-l border-slate-100">
                  {newsData.slice(1, 3).map((item) => (
                    <article key={item.id} onClick={() => setSelectedArticle(item)} className="group relative flex-1 bg-white p-8 transition-all duration-500 cursor-pointer hover:bg-slate-50 overflow-hidden border border-transparent group-hover:border-[#00DA5E]/45">
                      <div className="h-full flex flex-col justify-between space-y-6">
                        <div className="space-y-4">
                          <div className="flex justify-between items-center">
                            <span className="text-[0.55rem] font-bold text-[#00DA5E] uppercase tracking-[0.25em]">{item.category}</span>
                            <span className="text-slate-300 font-bold text-[0.55rem] tracking-widest">{item.date}</span>
                          </div>
                          <h4 className="font-alternate text-2xl text-[#291242] uppercase font-bold mb-1 group-hover:text-[#6100D7] transition-colors">{item.title}</h4>
                          <p className="font-nunito text-slate-500 text-sm font-light leading-relaxed line-clamp-2">{item.desc}</p>
                        </div>
                        <div className="w-12 h-12 rounded-2xl bg-slate-50 flex items-center justify-center text-slate-300 group-hover:bg-[#291242] group-hover:text-white transition-all self-end">
                          <ArrowUpRight size={20} />
                        </div>
                      </div>
                    </article>
                  ))}
                </div>
                </div>
              </div>

              <div id="noticias-filtros" className="grid grid-cols-1 lg:grid-cols-[25rem_minmax(0,1fr)] gap-8 mt-12 scroll-mt-28">
                <div>
                  <div className="sticky top-28 space-y-12">
                    <div className="bg-white rounded-[2rem] p-6 border border-slate-100 shadow-sm space-y-7">
                      <div className="space-y-1">
                        <h4 className="font-alternate text-[1.05rem] text-[#291242] font-bold uppercase tracking-[0.08em]">Explorar noticias</h4>
                        <p className="text-[0.78rem] text-slate-400 font-nunito leading-relaxed">
                          Busca, ordena y filtra el archivo reciente del PNMC.
                        </p>
                      </div>
                      <div className="space-y-4">
                        <span className="block text-[0.72rem] font-semibold text-[#291242] font-nunito">Búsqueda</span>
                        <div className="relative">
                          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                          <input
                            type="text"
                            value={newsSearchTerm}
                            onChange={(event) => setNewsSearchTerm(event.target.value)}
                            placeholder="Título, tema o categoría..."
                            className="w-full rounded-xl border border-slate-100 bg-slate-50 pl-11 pr-4 py-3 font-nunito text-[0.8rem] text-[#291242] outline-none transition-all focus:border-[#00DA5E] focus:bg-white"
                          />
                        </div>
                      </div>
                      <div className="space-y-4">
                        <span className="block text-[0.72rem] font-semibold text-[#291242] font-nunito">Orden</span>
                        <select
                          value={newsSortOrder}
                          onChange={(event) => setNewsSortOrder(event.target.value)}
                          className="w-full rounded-xl border border-slate-100 bg-slate-50 px-4 py-3 font-nunito text-[0.8rem] font-semibold text-[#291242] outline-none transition-all focus:border-[#00DA5E] focus:bg-white"
                        >
                          <option value="newest">Más recientes</option>
                          <option value="oldest">Más antiguas</option>
                        </select>
                      </div>
                      <div className="space-y-4">
                        <span className="block text-[0.72rem] font-semibold text-[#291242] font-nunito">Fecha</span>
                        <div className="space-y-3">
                          <label className="block space-y-2">
                            <span className="block text-[0.68rem] font-medium text-slate-500 font-nunito">Por mes</span>
                            <select
                              value={newsMonthFilter}
                              onChange={(event) => {
                                setNewsMonthFilter(event.target.value);
                                if (event.target.value) setNewsExactDateFilter('');
                              }}
                              className="w-full rounded-xl border border-slate-100 bg-slate-50 px-4 py-3 font-nunito text-[0.8rem] font-semibold text-[#291242] outline-none transition-all focus:border-[#00DA5E] focus:bg-white"
                            >
                              <option value="">Todos los meses</option>
                              {NEWS_MONTH_FILTER_OPTIONS.map((month) => (
                                <option key={month.value} value={month.value}>{month.label}</option>
                              ))}
                            </select>
                          </label>
                          <label className="block space-y-2">
                            <span className="block text-[0.68rem] font-medium text-slate-500 font-nunito">Fecha exacta</span>
                            <input
                              type="date"
                              value={newsExactDateFilter}
                              onChange={(event) => {
                                setNewsExactDateFilter(event.target.value);
                                if (event.target.value) setNewsMonthFilter('');
                              }}
                              className="w-full rounded-xl border border-slate-100 bg-slate-50 px-4 py-3 font-nunito text-[0.8rem] font-semibold text-[#291242] outline-none transition-all focus:border-[#00DA5E] focus:bg-white"
                            />
                          </label>
                        </div>
                      </div>
                      <div className="space-y-4">
                        <span className="block text-[0.72rem] font-semibold text-[#291242] font-nunito">Categoría</span>
                        <div className="space-y-2">
                          {[
                            { id: 'all', label: 'Todas' },
                            ...newsCategoryOptions.map((category) => ({ id: category, label: category })),
                          ].map((filter) => (
                            <button
                              key={filter.id}
                              onClick={() => setNewsCategoryFilter(filter.id)}
                              className={`w-full flex items-center justify-between rounded-xl px-4 py-3 text-left text-[0.72rem] font-semibold font-nunito transition-all ${
                                newsCategoryFilter === filter.id
                                  ? 'bg-[#291242] text-white'
                                  : 'bg-slate-50 border border-slate-100 text-slate-500 hover:border-[#00DA5E] hover:text-[#291242]'
                              }`}
                            >
                              <span>{filter.label}</span>
                              {newsCategoryFilter === filter.id && <span className="text-[#8BF784]">•</span>}
                            </button>
                          ))}
                        </div>
                      </div>
                      {hasActiveNewsFilters && (
                        <button
                          onClick={() => {
                            setNewsSearchTerm('');
                            setNewsMonthFilter('');
                            setNewsExactDateFilter('');
                            setNewsCategoryFilter('all');
                            setNewsSortOrder('newest');
                          }}
                          className="text-[0.68rem] font-semibold text-[#291242] font-nunito hover:text-[#00DA5E] transition-colors"
                        >
                          Limpiar filtros
                        </button>
                      )}
                    </div>

                    <div className="bg-[#291242] rounded-[2.5rem] p-10 text-white relative overflow-hidden group">
                      <div className="relative z-10 space-y-6">
                        <Tag text="BOLETÍN" className="bg-white/10 text-[#00DA5E]" />
                        <h4 className="font-gregor text-3xl font-bold uppercase leading-none tracking-tight">Recibe las <br/> Novedades</h4>
                        <p className="font-nunito text-white/40 text-xs leading-relaxed">Convocatorias y lanzamientos semanales del PNMC.</p>
                        <input type="text" placeholder="Email" className="w-full bg-white/5 border border-white/10 rounded-xl py-3 px-4 text-sm font-nunito outline-none" />
                        <Button variant="primary" className="w-full py-3 text-[0.6rem]">Registrarme</Button>
                      </div>
                    </div>

                    <div className="space-y-6">
                      <h4 className="font-alternate text-sm font-bold uppercase tracking-[0.3em] text-slate-400 border-b border-slate-100 pb-3">ETIQUETAS</h4>
                      <div className="flex flex-wrap gap-2">
                        {['Paz', 'Luthería', 'Mujeres', 'Regiones', 'Formación', 'Economía'].map(t => (
                          <button key={t} className="px-3 py-1.5 bg-white border border-slate-100 rounded-lg text-[0.55rem] font-bold text-slate-400 uppercase tracking-widest hover:border-[#00DA5E] hover:text-[#291242] transition-all">#{t}</button>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>

                <div className="space-y-8">
                  {filteredListNews.length === 0 ? (
                    <div className="rounded-[2rem] border border-slate-100 bg-white p-10 text-center">
                      <p className="font-alternate text-slate-400 uppercase tracking-widest text-[0.7rem]">No hay noticias para estos filtros.</p>
                    </div>
                  ) : (
                    <>
                      {listedNews.length > 0 && (
                        <div className="rounded-[2.4rem] border border-slate-100 bg-white shadow-sm overflow-hidden">
                          {listedNews.map((item, index) => (
                            <article
                              key={item.id}
                              onClick={() => setSelectedArticle(item)}
                              className={`group cursor-pointer transition-all duration-500 hover:bg-slate-50 ${index < listedNews.length - 1 ? 'border-b border-slate-100' : ''}`}
                            >
                              <div className="grid grid-cols-1 lg:grid-cols-[9.5rem_minmax(0,1fr)_3rem] gap-4 px-5 py-4 lg:px-6 lg:py-5 items-center">
                                <div className="rounded-[1.3rem] bg-slate-50 p-2">
                                  <div className="relative h-28 lg:h-[7.5rem] rounded-[0.95rem] overflow-hidden bg-slate-100 shadow-sm">
                                    <img src={item.img} className="w-full h-full object-cover group-hover:scale-105 transition-all duration-700" alt="" />
                                    <div className="absolute inset-0 bg-[#291242]/0 transition-all duration-700 group-hover:bg-[#291242]/32" />
                                  </div>
                                </div>
                                <div className="min-w-0 space-y-2">
                                  <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
                                    <span className="text-[0.5rem] font-bold text-[#00DA5E] font-alternate uppercase tracking-[0.2em]">{item.category}</span>
                                    <span className="text-[0.5rem] font-bold text-slate-300 uppercase tracking-widest">{item.date}</span>
                                  </div>
                                  <h4 className="font-alternate text-[0.9rem] lg:text-[1rem] text-[#291242] uppercase font-bold leading-tight tracking-[0.04em] group-hover:text-[#6100D7] transition-colors">
                                    {item.title}
                                  </h4>
                                  <p className="max-w-3xl font-nunito text-[0.74rem] text-slate-500 leading-relaxed line-clamp-3">
                                    {item.desc}
                                  </p>
                                </div>
                                <div className="flex items-center justify-end">
                                  <div className="w-9 h-9 rounded-full border border-slate-100 bg-slate-50 flex items-center justify-center text-slate-300 transition-all duration-500 shrink-0 group-hover:border-[#00DA5E]/30 group-hover:bg-[#291242] group-hover:text-white">
                                    <ArrowUpRight size={16} />
                                  </div>
                                </div>
                              </div>
                            </article>
                          ))}
                        </div>
                      )}

                      {compactNewsCards.length > 0 && (
                        <div className="rounded-[2.4rem] border border-slate-100 bg-white shadow-sm overflow-hidden">
                          <div className="grid grid-cols-1 md:grid-cols-3">
                            {compactNewsCards.map((item) => (
                              <article
                                key={item.id}
                                onClick={() => setSelectedArticle(item)}
                                className="group bg-white overflow-hidden transition-all duration-500 cursor-pointer hover:bg-slate-50"
                              >
                                <div className="h-36 overflow-hidden bg-slate-100">
                                  <div className="relative w-full h-full">
                                    <img src={item.img} className="w-full h-full object-cover group-hover:scale-105 transition-all duration-700" alt="" />
                                    <div className="absolute inset-0 bg-[#291242]/0 transition-all duration-700 group-hover:bg-[#291242]/32" />
                                  </div>
                                </div>
                                <div className="p-5 space-y-3">
                                  <div className="flex items-center justify-between gap-3">
                                    <span className="text-[0.52rem] font-bold text-[#00DA5E] uppercase tracking-[0.2em] line-clamp-1">{item.category}</span>
                                    <span className="text-[0.52rem] font-bold text-slate-300 uppercase tracking-widest shrink-0">{item.date}</span>
                                  </div>
                                  <h4 className="font-alternate text-[0.95rem] text-[#291242] uppercase font-bold leading-tight group-hover:text-[#6100D7] transition-colors line-clamp-2">{item.title}</h4>
                                  <p className="font-nunito text-[0.72rem] text-slate-500 leading-relaxed line-clamp-3">{item.desc}</p>
                                </div>
                              </article>
                            ))}
                          </div>
                        </div>
                      )}
                    </>
                  )}
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};


export {
  NoticiasPage,
};
