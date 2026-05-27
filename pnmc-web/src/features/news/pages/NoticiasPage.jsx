import { useEffect, useMemo, useState, useRef } from 'react';
import { getWebText } from '../../../lib/webTexts.js';
import {
  ArrowLeft,
  ArrowRight,
  ArrowUpRight,
  Calendar,
  ChevronDown,
  Clock,
  Filter,
  Mail,
  Plus,
  Search,
  Share2,
  Bookmark,
  CheckCircle2,
  LayoutGrid,
  List,
} from 'lucide-react';
import { Button, EmptyState, ErrorState, LoadingState } from '../../../components/ui/index.js';
import { useNews } from '../../../hooks/data/index.js';
import { getNewsDateKeys } from '../../../services/data/index.js';
import {
  NEWS_MONTH_FILTER_OPTIONS,
  splitHeroHeadline,
} from '../../content/domain/contentPresentation.js';
import { buildNewsItemFromRecord } from '../../content/domain/mediaLibrary.js';
import { PageHero, Tag } from '../../shared/components/PagePrimitives.jsx';
import { sanitizeHtml } from '../../../lib/sanitizeHtml.js';

// Estimador dinámico de lectura (200 palabras por minuto)
const calculateReadingTime = (content = '') => {
  const wordsPerMinute = 200;
  const wordCount = content.trim().split(/\s+/).length;
  return Math.max(1, Math.ceil(wordCount / wordsPerMinute));
};

const NoticiasPage = ({ onBack, initialSelectedArticle = null }) => {
  const [selectedArticle, setSelectedArticle] = useState(initialSelectedArticle);
  const [newsSearchTerm, setNewsSearchTerm] = useState('');
  const [newsMonthFilter, setNewsMonthFilter] = useState('');
  const [newsExactDateFilter, setNewsExactDateFilter] = useState('');
  const [newsCategoryFilter, setNewsCategoryFilter] = useState('all');
  const [newsSortOrder, setNewsSortOrder] = useState('newest');
  const [newsTerritoryFilter] = useState('');

  // Nuevos Estados Interactivos de la Propuesta final
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [subscriberEmail, setSubscriberEmail] = useState('');
  const [subscriptionError, setSubscriptionError] = useState('');
  const [readingProgress, setReadingProgress] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [viewLayout, setViewLayout] = useState('grid');

  const handleSelectArticle = (article) => {
    setSelectedArticle(article);
    setReadingProgress(0);
  };

  // Paginación y filtros sincronizados en los manejadores de eventos correspondientes para evitar cascading renders.

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

  // Noticias destacadas (las 3 primeras historias de la base de datos)
  const featuredPrimary = useMemo(() => newsData[0] || null, [newsData]);
  const featuredSecondary = useMemo(() => newsData.slice(1, 3), [newsData]);

  // Pool de noticias para explorar (excluyendo las destacadas para evitar redundancia)
  const newsListPool = useMemo(() => newsData.slice(3), [newsData]);

  // Categorías dinámicas disponibles en el pool de exploración
  const newsCategoryOptions = useMemo(() => (
    [...new Set(newsListPool.map((item) => item.category).filter(Boolean))]
  ), [newsListPool]);

  // Filtrado y ordenamiento de noticias
  const filteredListNews = useMemo(() => (
    [...newsListPool]
      .filter((item) => {
        const normalizedSearch = newsSearchTerm.trim().toLowerCase();
        const searchableText = [item.title, item.desc, item.category, item.content]
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

        // Búsqueda inteligente por mención de departamento / territorio en el texto de la noticia
        const matchesTerritory = !newsTerritoryFilter || searchableText.includes(newsTerritoryFilter.toLowerCase());

        return matchesCategory && matchesDate && matchesTerritory;
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
  ), [newsListPool, newsSearchTerm, newsCategoryFilter, newsMonthFilter, newsExactDateFilter, newsSortOrder, newsTerritoryFilter]);

  const ITEMS_PER_PAGE = 6;
  
  const totalPages = useMemo(() => {
    return Math.max(1, Math.ceil(filteredListNews.length / ITEMS_PER_PAGE));
  }, [filteredListNews]);

  const paginatedNews = useMemo(() => {
    const safePage = Math.min(currentPage, totalPages);
    const startIndex = (safePage - 1) * ITEMS_PER_PAGE;
    return filteredListNews.slice(startIndex, startIndex + ITEMS_PER_PAGE);
  }, [filteredListNews, currentPage, totalPages]);

  const selectedArticleHeroCopy = useMemo(
    () => splitHeroHeadline(selectedArticle?.title || ''),
    [selectedArticle]
  );

  const selectedArticleSafeContent = useMemo(
    () => sanitizeHtml(selectedArticle?.content || ''),
    [selectedArticle?.content]
  );

  // Efecto para volver al inicio del documento al seleccionar una noticia
  useEffect(() => {
    if (selectedArticle) {
      window.scrollTo({ top: 0, behavior: 'instant' });
    }
  }, [selectedArticle]);

  // Efecto para rastrear el porcentaje de lectura en scroll en la noticia detallada
  useEffect(() => {
    if (!selectedArticle) return;
    const handleScroll = () => {
      const scrollHeight = document.documentElement.scrollHeight;
      const clientHeight = document.documentElement.clientHeight;
      const totalHeight = scrollHeight - clientHeight;
      if (totalHeight > 0) {
        const progress = (window.scrollY / totalHeight) * 100;
        setReadingProgress(progress);
      }
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, [selectedArticle]);

  // Ref para omitir la ejecución del scroll en el primer renderizado de la página
  const isFirstRender = useRef(true);

  // Efecto para reubicar la vista en la parte superior de la sección de noticias al cambiar de página
  useEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false;
      return;
    }
    const element = document.getElementById('news-feed-section');
    if (element) {
      const yOffset = -100; // Margen para compensar el header sticky
      const y = element.getBoundingClientRect().top + window.scrollY + yOffset;
      window.scrollTo({ top: y, behavior: 'smooth' });
    }
  }, [currentPage]);

  // Gestor del envío del boletín
  const handleSubscribeSubmit = (e) => {
    e.preventDefault();
    if (!subscriberEmail || !subscriberEmail.includes('@')) {
      setSubscriptionError('Por favor, ingresa una dirección de correo válida.');
      return;
    }
    setSubscriptionError('');
    setIsSubscribed(true);
  };

  // VISTA 1: Lector de Artículos Ultra-Premium (Detalle)
  if (selectedArticle) {
    return (
      <div className="bg-white min-h-screen text-left relative">
        {/* Barra de progreso de lectura (Fixed Reading progress) */}
        <div
          className="fixed top-0 left-0 right-0 h-1.5 bg-[#00DA5E] z-[3300] origin-left transition-transform duration-100 ease-out"
          style={{ transform: `scaleX(${readingProgress / 100})` }}
        />

        <PageHero
          tag={selectedArticle.category}
          title={selectedArticleHeroCopy.title}
          titleAccent={selectedArticleHeroCopy.titleAccent}
          description={selectedArticle.desc}
          bgImage={selectedArticle.img}
          onBack={() => handleSelectArticle(null)}
          compactNews={true}
          backOnly={true}
        />

        <div className="max-w-[96rem] mx-auto px-6 lg:px-12 py-16">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-16">
            
            {/* Lector Principal Editorial */}
            <div className="col-span-12 lg:col-span-8 space-y-10">
              <div className="space-y-4 pb-8 border-b border-slate-100">
                <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-slate-400 font-alternate text-xs font-bold uppercase tracking-widest">
                  <span className="text-[#00DA5E]">{selectedArticle.category}</span>
                  <span className="h-1.5 w-1.5 rounded-full bg-slate-300" />
                  <span>Publicado: {selectedArticle.date} 2026</span>
                  <span className="h-1.5 w-1.5 rounded-full bg-slate-300" />
                  <span className="flex items-center gap-1.5 text-[#291242]">
                    <Clock size={13} />
                    {calculateReadingTime(selectedArticle.content || selectedArticle.desc)} min de lectura
                  </span>
                </div>
                <h1 className="font-gregor text-4xl sm:text-5xl lg:text-7xl leading-[1.02] uppercase tracking-tighter max-w-5xl text-[#291242]">
                  {selectedArticleHeroCopy.title}
                  {selectedArticleHeroCopy.titleAccent && (
                    <span className="text-[#00DA5E] italic"> {selectedArticleHeroCopy.titleAccent}</span>
                  )}
                </h1>
                <p className="text-xl sm:text-2xl text-[#291242] font-semibold leading-relaxed max-w-4xl pt-2">
                  {selectedArticle.desc}
                </p>
              </div>

              {/* Contenido Editorial con Drop Cap */}
              <div className="max-w-4xl">
                <div className="prose prose-slate max-w-none text-[#291242] font-nunito text-[1.12rem] font-light leading-relaxed space-y-6 first-letter:text-6xl first-letter:font-bold first-letter:text-[#291242] first-letter:float-left first-letter:mr-3 first-letter:mt-1 first-letter:font-alternate">
                  {selectedArticle.content ? (
                    <div dangerouslySetInnerHTML={{ __html: selectedArticleSafeContent }} />
                  ) : (
                    <>
                      <p>
                        A lo largo de los territorios colombianos, el sonido de los vientos, cuerdas y percusiones dibuja
                        historias profundas que van más allá del arte sonoro. El Programa Nacional de Música para la Convivencia
                        (PNMC) ha impulsado en este ciclo una serie de transformaciones estructurales con el fin de robustecer
                        a las comunidades musicales. Esta crónica documenta la vibración social que acontece en las regiones,
                        donde las escuelas, lutieres y festivales tejen una red indestructible de paz y resistencia artística.
                      </p>
                      <p>
                        La descentralización cultural permite que procesos locales antes invisibilizados escalen hacia escenarios
                        de impacto nacional. El acceso a recursos y la consolidación de redes de apoyo mutuo actúan como
                        catalizadores que redefinen las prácticas musicales heredadas, aportando técnicas contemporáneas sin
                        comprometer la memoria e identidad tradicional que late en el origen de cada acorde.
                      </p>
                      <div className="py-6 my-4">
                        <img
                          src={selectedArticle.img}
                          className="w-full max-h-[500px] object-cover rounded-[2.5rem] shadow-lg border border-slate-100"
                          alt=""
                        />
                        <span className="text-xs text-slate-400 italic mt-3 block text-center">
                          Fotografía Editorial — Archivo de Memoria del PNMC 2026
                        </span>
                      </div>
                      <blockquote className="border-l-4 border-[#00DA5E] pl-8 py-6 my-8 italic text-xl sm:text-2xl text-[#291242] bg-slate-50 rounded-r-[2.5rem] leading-snug font-medium">
                        "La música no solo es expresión estética, es un vehículo indestructible de memoria histórica y
                        reparación social en los rincones más lejanos de nuestra geografía."
                      </blockquote>
                      <p>
                        A medida que avanzamos en la consolidación del mapa ecosistémico, se hace evidente que cada escuela y
                        festival se constituye en un faro pedagógico. La lutería de tradición y la documentación rigurosa
                        salvaguardan técnicas ancestrales de afinación y construcción de instrumentos, preservando un saber
                        organológico invaluable para las siguientes generaciones de músicos colombianos.
                      </p>
                    </>
                  )}
                </div>
              </div>

              {/* Botón de retorno y compartir */}
              <div className="pt-10 border-t border-slate-100 flex flex-col sm:flex-row justify-between items-center gap-6">
                <button
                  onClick={() => handleSelectArticle(null)}
                  className="flex items-center gap-2.5 text-xs font-bold text-[#291242] uppercase font-alternate tracking-[0.2em] hover:gap-4 transition-all"
                >
                  <ArrowLeft size={16} className="text-[#00DA5E]" />
                  Volver a noticias
                </button>
                <div className="flex items-center gap-4">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Compartir artículo:</span>
                  <button className="w-11 h-11 rounded-full border border-slate-200 flex items-center justify-center text-slate-500 hover:bg-[#291242] hover:text-white transition-all shadow-sm hover:scale-105 active:scale-95 cursor-pointer">
                    <Share2 size={16} />
                  </button>
                  <button className="w-11 h-11 rounded-full border border-slate-200 flex items-center justify-center text-slate-500 hover:bg-[#291242] hover:text-white transition-all shadow-sm hover:scale-105 active:scale-95 cursor-pointer">
                    <Bookmark size={16} />
                  </button>
                </div>
              </div>
            </div>

            {/* Sidebar Lateral de Noticias Relacionadas */}
            <aside className="col-span-12 lg:col-span-4">
              <div className="sticky top-28 rounded-[2.5rem] border border-slate-100 bg-slate-50/80 p-8 space-y-8 backdrop-blur-md">
                <div className="space-y-2 pb-5 border-b border-slate-200/80">
                  <span className="inline-flex items-center rounded-full bg-white px-3 py-1 text-[8px] font-extrabold uppercase tracking-widest text-slate-400 border border-slate-150">
                    LECTURAS RECOMENDADAS
                  </span>
                  <h4 className="font-alternate text-lg text-[#291242] uppercase tracking-wider font-bold">Historias Relacionadas</h4>
                  <p className="text-xs text-slate-500 font-nunito leading-relaxed">
                    Crónicas y crónicas complementarias elegidas para expandir tu navegación editorial.
                  </p>
                </div>
                <div className="space-y-6">
                  {newsData.filter((item) => item.id !== selectedArticle.id).slice(0, 4).map((item) => (
                    <article
                      key={item.id}
                      onClick={() => handleSelectArticle(item)}
                      className="group cursor-pointer flex gap-4 items-center transition-all duration-300 hover:-translate-y-0.5"
                    >
                      <div className="w-20 h-16 rounded-2xl overflow-hidden bg-slate-100 shrink-0 shadow-sm relative">
                        <img src={item.img} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" alt="" />
                        <div className="absolute inset-0 bg-[#291242]/0 transition-all duration-500 group-hover:bg-[#291242]/20" />
                      </div>
                      <div className="min-w-0 space-y-1">
                        <span className="block text-[8px] font-bold text-[#00DA5E] uppercase tracking-widest">{item.category} · {item.date}</span>
                        <h5 className="font-alternate text-xs text-[#291242] uppercase font-bold leading-tight group-hover:text-[#6100D7] transition-colors line-clamp-2">
                          {item.title}
                        </h5>
                      </div>
                    </article>
                  ))}
                </div>
                <div className="pt-4 border-t border-slate-200/80">
                  <Button variant="outlineDark" className="w-full py-3.5 text-[9px] font-bold uppercase tracking-widest rounded-2xl" onClick={() => handleSelectArticle(null)}>
                    Explorar todo el archivo
                  </Button>
                </div>
              </div>
            </aside>
            
          </div>
        </div>
      </div>
    );
  }

  // VISTA 2: Portal de Noticias Premium (Mosaico & Buscador)
  return (
    <div className="bg-slate-50 min-h-screen text-left overflow-x-hidden relative">
      <PageHero
        tag="NOTICIAS"
        title="Portal Editorial y"
        titleAccent="Novedades"
        description={getWebText('news_description')}
        bgImage="https://images.unsplash.com/photo-1774558396253-be05d7a37d82?q=80&w=1470&auto=format&fit=crop"
        onBack={onBack}
        compactNews={true}
      />

      <div className="max-w-[96rem] mx-auto px-6 lg:px-12 py-10 space-y-12">
        
        {/* Cargador e Indicador de Estado */}
        {isLoading || isRefreshing ? (
          <div className="py-20 bg-white rounded-[3rem] border border-slate-100 shadow-sm">
            <LoadingState
              title="Sincronizando actualidad del PNMC..."
              description="Conectando con la biblioteca editorial del Programa Nacional de Música para la Convivencia."
            />
          </div>
        ) : isError ? (
          <div className="py-20 bg-white rounded-[3rem] border border-slate-100 shadow-sm">
            <ErrorState
              title="No logramos cargar el portal de noticias"
              description={error?.message || 'Revisa tu conexión o vuelve a intentar en unos instantes.'}
              onRetry={retry}
            />
          </div>
        ) : newsData.length === 0 ? (
          <div className="py-20 bg-white rounded-[3rem] border border-slate-100 shadow-sm">
            <EmptyState
              title="Archivo de actualidad vacío"
              description="Vuelve pronto para consultar las nuevas crónicas del PNMC."
            />
          </div>
        ) : (
          <>
            {/* SECCIÓN 1: Parrilla Asimétrica Premium de Destacadas & Boletín Integrado */}
            <section className="space-y-6 text-left">
              <div className="border-b border-slate-200 pb-4">
                <span className="text-[#00DA5E] font-bold text-[10px] tracking-widest uppercase font-alternate">
                  Foco Informativo
                </span>
                <h2 className="font-gregor text-3xl sm:text-4xl lg:text-5xl font-extrabold uppercase leading-none tracking-tight text-[#291242] mt-1">
                  Narrativas Destacadas
                </h2>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-stretch">
                {/* Noticia Principal Destacada (Left - 5 cols) */}
                {featuredPrimary && (
                  <div className="lg:col-span-5 h-full">
                    <article
                      onClick={() => handleSelectArticle(featuredPrimary)}
                      className="group relative flex flex-col justify-end h-full min-h-[400px] rounded-[2rem] overflow-hidden shadow-xl bg-[#291242] cursor-pointer transition-all duration-500 hover:shadow-2xl"
                    >
                      <img
                        src={featuredPrimary.img}
                        className="absolute inset-0 w-full h-full object-cover grayscale-[40%] brightness-95 opacity-80 group-hover:grayscale-0 group-hover:brightness-100 group-hover:opacity-100 group-hover:scale-105 transition-all duration-[1000ms] ease-out"
                        alt=""
                      />
                      <div className="absolute inset-0 bg-[#291242]/20 group-hover:opacity-0 transition-opacity duration-1000" />
                      <div className="absolute inset-0 bg-gradient-to-t from-[#291242] via-[#291242]/35 to-transparent" />
                      <div className="relative z-10 p-6 lg:p-8 space-y-4">
                        <div className="flex items-center gap-3">
                          <span className="inline-flex items-center rounded-full bg-[#00DA5E] px-2.5 py-0.5 text-[8px] font-extrabold uppercase tracking-widest text-[#291242]">
                            {featuredPrimary.category}
                          </span>
                          <span className="text-white/70 font-semibold text-[9px] tracking-widest uppercase font-alternate">
                            {featuredPrimary.date}
                          </span>
                          <span className="flex items-center gap-1 text-white/70 font-semibold text-[9px] tracking-widest uppercase font-alternate">
                            <Clock size={10} />
                            {calculateReadingTime(featuredPrimary.content || featuredPrimary.desc)} MIN
                          </span>
                        </div>
                        <h3 className="font-gregor text-xl sm:text-2xl lg:text-3xl text-white font-extrabold uppercase leading-tight tracking-tight max-w-2xl">
                          {featuredPrimary.title}
                        </h3>
                        <p className="font-nunito text-slate-200 text-xs font-light leading-relaxed max-w-xl line-clamp-2">
                          {featuredPrimary.desc}
                        </p>
                        <div className="pt-2">
                          <span className="inline-flex items-center gap-1.5 text-[#00DA5E] font-bold uppercase tracking-[0.2em] text-[10px] hover:gap-3 transition-all">
                            Leer historia completa
                            <ArrowRight size={13} className="group-hover:translate-x-1 transition-transform" />
                          </span>
                        </div>
                      </div>
                    </article>
                  </div>
                )}

                {/* Noticias Secundarias Destacadas (Center - 4 cols) */}
                <div className="lg:col-span-4 flex flex-col gap-5 h-full justify-between">
                  {featuredSecondary.map((item) => (
                    <article
                      key={item.id}
                      onClick={() => handleSelectArticle(item)}
                      className="group relative flex-1 flex flex-col justify-between bg-white rounded-[2rem] p-5 border border-slate-100 shadow-sm hover:shadow-md transition-all duration-300 cursor-pointer overflow-hidden min-h-[190px]"
                    >
                      <div className="space-y-3">
                        <div className="flex justify-between items-center">
                          <span className="text-[9px] font-extrabold text-[#00DA5E] uppercase tracking-widest">{item.category}</span>
                          <span className="font-bold text-[8px] tracking-widest" style={{ color: '#8FA2B4' }}>{item.date}</span>
                        </div>
                        <h4 className="font-alternate text-sm lg:text-base text-[#291242] uppercase font-bold leading-snug tracking-wide group-hover:text-[#6100D7] transition-colors line-clamp-2">
                          {item.title}
                        </h4>
                        <p className="font-nunito text-slate-500 text-xs font-light leading-relaxed line-clamp-2">
                          {item.desc}
                        </p>
                      </div>
                      <div className="flex justify-between items-center pt-3 mt-3 border-t border-slate-50">
                        <span className="flex items-center gap-1 text-slate-400 font-semibold text-[8px] tracking-widest uppercase">
                          <Clock size={10} />
                          {calculateReadingTime(item.content || item.desc)} MIN
                        </span>
                        <div className="w-8 h-8 rounded-xl bg-slate-50 flex items-center justify-center text-slate-400 group-hover:bg-[#291242] group-hover:text-white transition-all">
                          <ArrowUpRight size={14} className="group-hover:rotate-45 transition-transform" />
                        </div>
                      </div>
                    </article>
                  ))}
                </div>

                {/* Boletín Informativo Ecosistémico (Right - 3 cols) */}
                <div className="lg:col-span-3 h-full">
                  <div className="rounded-[2rem] bg-gradient-to-br from-[#291242] via-[#361757] to-[#4c227a] p-6 text-white h-full flex flex-col justify-between relative overflow-hidden shadow-xl border border-white/5 min-h-[350px]">
                    <div className="absolute top-0 right-0 w-48 h-48 bg-white/5 rounded-full blur-2xl pointer-events-none" />
                    <div className="absolute bottom-0 left-0 w-48 h-48 bg-[#00DA5E]/5 rounded-full blur-2xl pointer-events-none" />
                    
                    <div className="relative z-10 space-y-4 flex-1 flex flex-col justify-between h-full">
                      <div className="space-y-3">
                        <div className="flex items-center justify-between">
                          <span className="inline-flex items-center rounded-full bg-white/10 px-2.5 py-0.5 text-[8px] font-extrabold uppercase tracking-widest text-[#00DA5E] border border-white/5 font-alternate">
                            Boletín
                          </span>
                          <Mail size={14} className="text-[#00DA5E]" />
                        </div>
                        <h3 className="font-gregor text-xl lg:text-2xl font-extrabold uppercase leading-none tracking-tight">
                          Únete al Ecosistema
                        </h3>
                        <p className="font-nunito text-white/70 text-xs leading-relaxed">
                          Recibe convocatorias, crónicas exclusivas y las últimas novedades del PNMC en los territorios.
                        </p>
                      </div>
                      
                      <div className="space-y-4 pt-4 border-t border-white/10 mt-auto">
                        {isSubscribed ? (
                          <div className="text-center space-y-2 py-2 animate-in fade-in zoom-in-95 duration-500">
                            <div className="inline-flex items-center justify-center w-10 h-10 rounded-full bg-[#00DA5E] text-[#291242] mx-auto shadow-md">
                              <CheckCircle2 size={18} />
                            </div>
                            <h4 className="font-alternate text-xs font-bold uppercase tracking-wider text-white">
                              ¡Suscrito!
                            </h4>
                            <p className="font-nunito text-white/60 text-[10px] leading-relaxed max-w-[180px] mx-auto">
                              Pronto recibirás nuestras novedades sonoras.
                            </p>
                          </div>
                        ) : (
                          <form onSubmit={handleSubscribeSubmit} className="space-y-3 text-left">
                            <div className="space-y-2">
                              <input
                                type="email"
                                required
                                value={subscriberEmail}
                                onChange={(e) => {
                                  setSubscriberEmail(e.target.value);
                                  setSubscriptionError('');
                                }}
                                placeholder="Tu correo..."
                                className="w-full bg-white/5 border border-white/15 rounded-xl py-2.5 px-3.5 text-xs font-nunito text-white placeholder-white/40 outline-none transition-all focus:border-[#00DA5E] focus:bg-white/10"
                              />
                              <button
                                type="submit"
                                className="w-full bg-[#00DA5E] hover:bg-[#8BF784] text-[#291242] font-alternate text-[9px] font-extrabold uppercase tracking-widest rounded-xl py-3 shadow-md active:scale-95 transition-all cursor-pointer"
                              >
                                Registrarme
                              </button>
                            </div>
                            {subscriptionError && (
                              <p className="text-[#ff5555] text-[10px] font-semibold pl-1">
                                {subscriptionError}
                              </p>
                            )}
                            <p className="font-nunito text-white/30 text-[8px] leading-relaxed text-center">
                              * No compartiremos tu dirección con terceros.
                            </p>
                          </form>
                        )}

                        {/* Redes Sociales del Plan Nacional de Música (Custom SVGs) */}
                        <div className="pt-3 border-t border-white/10 space-y-2">
                          <span className="block text-[8px] font-extrabold uppercase tracking-widest text-[#00DA5E] text-center font-alternate">
                            Sigue nuestras redes
                          </span>
                          <div className="flex items-center justify-center gap-3">
                            <a
                              href="https://instagram.com"
                              target="_blank"
                              rel="noreferrer"
                              className="w-8 h-8 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center text-white hover:bg-[#00DA5E] hover:text-[#291242] hover:scale-105 active:scale-95 transition-all shadow-sm"
                              title="Instagram"
                            >
                              <svg className="w-[13px] h-[13px]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <rect width="20" height="20" x="2" y="2" rx="5" ry="5"/>
                                <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"/>
                                <line x1="17.5" x2="17.51" y1="6.5" y2="6.5"/>
                              </svg>
                            </a>
                            <a
                              href="https://facebook.com"
                              target="_blank"
                              rel="noreferrer"
                              className="w-8 h-8 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center text-white hover:bg-[#00DA5E] hover:text-[#291242] hover:scale-105 active:scale-95 transition-all shadow-sm"
                              title="Facebook"
                            >
                              <svg className="w-[13px] h-[13px]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z"/>
                              </svg>
                            </a>
                            <a
                              href="https://twitter.com"
                              target="_blank"
                              rel="noreferrer"
                              className="w-8 h-8 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center text-white hover:bg-[#00DA5E] hover:text-[#291242] hover:scale-105 active:scale-95 transition-all shadow-sm"
                              title="Twitter / X"
                            >
                              <svg className="w-[13px] h-[13px]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <path d="M22 4s-.7 2.1-2 3.4c1.6 10-9.4 17.3-18 11.6 2.2.1 4.4-.6 6-2C3 15.5.5 9.6 3 5c2.2 2.6 5.6 4.1 9 4-.9-4.2 4-6.6 7-3.8 1.1 0 3-1.2 3-1.2z"/>
                              </svg>
                            </a>
                            <a
                              href="https://youtube.com"
                              target="_blank"
                              rel="noreferrer"
                              className="w-8 h-8 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center text-white hover:bg-[#00DA5E] hover:text-[#291242] hover:scale-105 active:scale-95 transition-all shadow-sm"
                              title="YouTube"
                            >
                              <svg className="w-[13px] h-[13px]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <path d="M2.5 17a24.12 24.12 0 0 1 0-10 2 2 0 0 1 1.4-1.4 49.56 49.56 0 0 1 16.2 0A2 2 0 0 1 21.5 7a24.12 24.12 0 0 1 0 10 2 2 0 0 1-1.4 1.4 49.55 49.55 0 0 1-16.2 0A2 2 0 0 1 2.5 17z"/>
                                <polygon points="10 15 15 12 10 9"/>
                              </svg>
                            </a>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </section>

            {/* Única Barra de control: categorías, buscador, ordenación y diseño */}
            <div id="news-feed-section" className="flex flex-col xl:flex-row items-start xl:items-center justify-between border-b border-slate-200/60 pb-6 mb-10 gap-6 w-full scroll-mt-28">
              
              {/* Lado Izquierdo: Categorías */}
              <div className="flex items-center gap-1.5 overflow-x-auto scrollbar-none pl-1 pr-1 w-full xl:w-auto">
                {[
                  { id: 'all', label: 'Todas las noticias', count: newsListPool.length },
                  ...newsCategoryOptions.map(cat => ({
                    id: cat,
                    label: cat,
                    count: newsListPool.filter(item => item.category === cat).length
                  }))
                ].map((filter) => (
                  <button
                    key={filter.id}
                    onClick={() => {
                      setNewsCategoryFilter(filter.id);
                      setCurrentPage(1);
                    }}
                    className={`flex-shrink-0 flex items-center gap-2 rounded-full px-4 py-2 text-[0.65rem] font-extrabold uppercase tracking-widest transition-all active:scale-95 cursor-pointer ${
                      newsCategoryFilter === filter.id
                        ? 'bg-[#291242] text-white shadow-md'
                        : 'bg-transparent text-slate-500 hover:bg-slate-100 hover:text-[#291242]'
                    }`}
                  >
                    <span>{filter.label}</span>
                    <span className={`inline-flex items-center justify-center h-4.5 min-w-[1.125rem] px-1.5 rounded-full text-[8px] font-bold ${
                      newsCategoryFilter === filter.id ? 'bg-[#00DA5E] text-[#291242]' : 'bg-slate-100 text-slate-400'
                    }`}>
                      {filter.count}
                    </span>
                  </button>
                ))}
              </div>

              {/* Lado Derecho: Buscador, Ordenar por y Conmutador de Diseño */}
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between xl:justify-end gap-5 shrink-0 w-full xl:w-auto pt-4 xl:pt-0 border-t border-slate-100 xl:border-none">
                
                {/* Pequeño Buscador */}
                <div className="relative w-full sm:w-56 shrink-0 shadow-sm rounded-2xl border border-slate-200 bg-white overflow-hidden focus-within:border-[#00DA5E] focus-within:ring-2 focus-within:ring-[#00DA5E]/20 transition-all">
                  <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={14} />
                  <input
                    type="text"
                    value={newsSearchTerm}
                    onChange={(e) => {
                      setNewsSearchTerm(e.target.value);
                      setCurrentPage(1);
                    }}
                    placeholder="Buscar por título o tema..."
                    className="w-full bg-transparent pl-10 pr-10 py-2.5 text-[0.75rem] font-nunito text-[#291242] outline-none placeholder:text-slate-400"
                  />
                  {newsSearchTerm && (
                    <button
                      onClick={() => {
                        setNewsSearchTerm('');
                        setCurrentPage(1);
                      }}
                      className="absolute right-4 top-1/2 -translate-y-1/2 text-[10px] text-slate-455 hover:text-slate-655 font-bold"
                    >
                      Limpiar
                    </button>
                  )}
                </div>

                <div className="hidden sm:block w-px h-5 bg-slate-200 shrink-0"></div>

                <div className="flex items-center gap-2">
                  <span className="text-[0.55rem] font-bold uppercase tracking-[0.15em] text-slate-400">Ordenar por</span>
                  <div className="flex items-center hover:bg-slate-50 rounded-lg px-2.5 py-1.5 transition-colors cursor-pointer group relative">
                    <select
                      value={newsSortOrder}
                      onChange={(event) => {
                        setNewsSortOrder(event.target.value);
                        setCurrentPage(1);
                      }}
                      className="bg-transparent text-[0.65rem] font-bold uppercase tracking-[0.1em] text-[#291242] outline-none pr-6 cursor-pointer border-none appearance-none z-10 font-alternate font-bold"
                    >
                      <option value="newest">Recientes</option>
                      <option value="oldest">Antiguas</option>
                    </select>
                    <ChevronDown size={14} className="text-slate-400 absolute right-2.5 pointer-events-none group-hover:text-[#291242]" />
                  </div>
                </div>

                <div className="w-px h-6 bg-slate-200"></div>

                <div className="flex gap-1 bg-slate-50 p-1 rounded-xl">
                  <button
                    onClick={() => setViewLayout('grid')}
                    className={`w-9 h-8 flex items-center justify-center rounded-lg transition-all ${viewLayout === 'grid' ? 'bg-[#291242] text-white shadow-sm' : 'text-slate-400 hover:text-[#291242] hover:bg-white'}`}
                    aria-label="Vista cuadrícula"
                  >
                    <LayoutGrid size={15} />
                  </button>
                  <button
                    onClick={() => setViewLayout('list')}
                    className={`w-9 h-8 flex items-center justify-center rounded-lg transition-all ${viewLayout === 'list' ? 'bg-[#291242] text-white shadow-sm' : 'text-slate-400 hover:text-[#291242] hover:bg-white'}`}
                    aria-label="Vista lista"
                  >
                    <List size={15} />
                  </button>
                </div>
              </div>
            </div>

            {/* SECCIÓN 4: Rejilla o Lista de Muro de Noticias (Feed) */}
            <section className="space-y-12">
              {filteredListNews.length === 0 ? (
                <div className="py-20 bg-white rounded-[2.5rem] border border-slate-100 p-10 text-center shadow-sm max-w-lg mx-auto">
                  <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-slate-50 text-slate-400 mb-4 border border-slate-100">
                    <Search size={20} />
                  </div>
                  <p className="font-alternate text-[#291242] font-bold uppercase tracking-wider text-xs">
                    Ninguna noticia coincide con tus filtros
                  </p>
                  <p className="font-nunito text-slate-500 text-xs mt-1.5 leading-relaxed">
                    Prueba a buscar otro término o limpia los filtros seleccionados para continuar explorando el archivo.
                  </p>
                  <button
                    onClick={() => {
                      setNewsSearchTerm('');
                      setNewsMonthFilter('');
                      setNewsExactDateFilter('');
                      setNewsCategoryFilter('all');
                      setNewsSortOrder('newest');
                      setCurrentPage(1);
                    }}
                    className="mt-5 inline-flex items-center rounded-xl bg-slate-100 px-4 py-2 text-xs font-bold uppercase tracking-wider text-slate-600 hover:bg-[#291242] hover:text-white transition-all cursor-pointer"
                  >
                    Restablecer filtros
                  </button>
                </div>
              ) : viewLayout === 'grid' ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                  {paginatedNews.map((item) => (
                    <article
                      key={item.id}
                      onClick={() => handleSelectArticle(item)}
                      className="group bg-transparent overflow-hidden hover:-translate-y-2 transition-transform duration-500 cursor-pointer flex flex-col justify-between"
                    >
                      <div className="space-y-4">
                        <div className="h-56 overflow-hidden bg-slate-100 relative rounded-3xl shadow-sm group-hover:shadow-lg transition-shadow duration-500">
                          <img
                            src={item.img}
                            className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                            alt=""
                          />
                          <div className="absolute inset-0 bg-[#291242]/0 transition-all duration-500 group-hover:bg-[#291242]/20" />
                        </div>
                        <div className="px-6 space-y-3">
                          <div className="flex items-center justify-between gap-3 text-[10px] font-bold uppercase tracking-widest font-alternate text-slate-400">
                            <span className="text-[#00DA5E]">{item.category}</span>
                            <span style={{ color: '#8FA2B4' }}>{item.date}</span>
                          </div>
                          <h4 className="font-alternate text-base lg:text-lg text-[#291242] uppercase font-bold leading-snug group-hover:text-[#6100D7] transition-colors line-clamp-2">
                            {item.title}
                          </h4>
                          <p className="font-nunito text-[0.8rem] text-slate-500 leading-relaxed font-light line-clamp-3">
                            {item.desc}
                          </p>
                        </div>
                      </div>
                      <div className="px-6 pb-2 pt-4 flex justify-between items-center mt-4 border-t border-slate-200/50">
                        <span className="flex items-center gap-1.5 text-slate-400 font-semibold text-[9px] tracking-widest uppercase">
                          <Clock size={11} />
                          {calculateReadingTime(item.content || item.desc)} min de lectura
                        </span>
                        <span className="text-[10px] font-extrabold text-[#291242] uppercase tracking-wider group-hover:-translate-y-0.5 group-hover:translate-x-0.5 transition-transform inline-flex items-center gap-1">
                          Leer más
                          <ArrowUpRight size={14} className="text-[#00DA5E]" />
                        </span>
                      </div>
                    </article>
                  ))}
                </div>
              ) : (
                <div className="flex flex-col gap-6">
                  {paginatedNews.map((item) => (
                    <article
                      key={item.id}
                      onClick={() => handleSelectArticle(item)}
                      className="group bg-transparent overflow-hidden hover:-translate-y-1 transition-transform duration-500 cursor-pointer flex flex-col md:flex-row items-stretch gap-8"
                    >
                      <div className="md:w-1/3 min-h-[200px] md:min-h-auto relative overflow-hidden bg-slate-100 shrink-0 rounded-3xl shadow-sm group-hover:shadow-lg transition-shadow duration-500">
                        <img
                          src={item.img}
                          className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                          alt=""
                        />
                        <div className="absolute inset-0 bg-[#291242]/0 transition-all duration-500 group-hover:bg-[#291242]/20" />
                      </div>
                      <div className="flex-1 p-8 flex flex-col justify-between space-y-4">
                        <div className="space-y-3">
                          <div className="flex items-center gap-3 text-[10px] font-bold uppercase tracking-widest font-alternate text-slate-400">
                            <span className="text-[#00DA5E]">{item.category}</span>
                            <span className="h-1 w-1 rounded-full bg-slate-300" />
                            <span style={{ color: '#8FA2B4' }}>{item.date}</span>
                            <span className="h-1 w-1 rounded-full bg-slate-300" />
                            <span className="flex items-center gap-1">
                              <Clock size={11} />
                              {calculateReadingTime(item.content || item.desc)} min de lectura
                            </span>
                          </div>
                          <h4 className="font-alternate text-xl text-[#291242] uppercase font-bold leading-snug group-hover:text-[#6100D7] transition-colors line-clamp-2">
                            {item.title}
                          </h4>
                          <p className="font-nunito text-xs text-slate-500 leading-relaxed font-light line-clamp-3">
                            {item.desc}
                          </p>
                        </div>
                        <div className="pt-2 flex justify-between items-center border-t border-slate-200/50">
                          <span className="text-[10px] font-extrabold text-[#291242] uppercase tracking-wider group-hover:-translate-y-0.5 group-hover:translate-x-0.5 transition-transform inline-flex items-center gap-1.5">
                            Leer historia completa
                            <ArrowUpRight size={14} className="text-[#00DA5E]" />
                          </span>
                        </div>
                      </div>
                    </article>
                  ))}
                </div>
              )}
            </section>

            {/* SECCIÓN 5: Barra de Paginación Numérica Premium */}
            {filteredListNews.length > ITEMS_PER_PAGE && (
              <div className="pt-6 flex flex-col sm:flex-row items-center justify-between gap-4 border-t border-slate-200/60 mt-12">
                <span className="font-nunito text-xs text-slate-400 font-medium">
                  Mostrando {Math.min(filteredListNews.length, (currentPage - 1) * ITEMS_PER_PAGE + 1)}-
                  {Math.min(filteredListNews.length, currentPage * ITEMS_PER_PAGE)} de {filteredListNews.length} crónicas
                </span>
                <div className="flex items-center gap-2">
                  <button
                    disabled={currentPage === 1}
                    onClick={(e) => {
                      e.stopPropagation();
                      setCurrentPage((prev) => Math.max(1, prev - 1));
                    }}
                    className={`flex items-center justify-center px-4 py-2.5 rounded-xl text-[10px] font-extrabold uppercase tracking-widest transition-all active:scale-95 cursor-pointer border ${
                      currentPage === 1
                        ? 'border-slate-200 text-slate-300 bg-slate-100/50 cursor-not-allowed'
                        : 'border-slate-200 text-slate-600 bg-white hover:border-[#291242] hover:text-[#291242]'
                    }`}
                  >
                    Anterior
                  </button>
                  {Array.from({ length: totalPages }, (_, index) => {
                    const pageNumber = index + 1;
                    return (
                      <button
                        key={pageNumber}
                        onClick={(e) => {
                          e.stopPropagation();
                          setCurrentPage(pageNumber);
                        }}
                        className={`w-10 h-10 rounded-xl flex items-center justify-center text-xs font-extrabold transition-all active:scale-95 cursor-pointer ${
                          currentPage === pageNumber
                            ? 'bg-[#291242] text-white shadow-md'
                            : 'bg-white border border-slate-200 text-slate-500 hover:border-[#291242] hover:text-[#291242]'
                        }`}
                      >
                        {pageNumber}
                      </button>
                    );
                  })}
                  <button
                    disabled={currentPage === totalPages}
                    onClick={(e) => {
                      e.stopPropagation();
                      setCurrentPage((prev) => Math.min(totalPages, prev + 1));
                    }}
                    className={`flex items-center justify-center px-4 py-2.5 rounded-xl text-[10px] font-extrabold uppercase tracking-widest transition-all active:scale-95 cursor-pointer border ${
                      currentPage === totalPages
                        ? 'border-slate-200 text-slate-300 bg-slate-100/50 cursor-not-allowed'
                        : 'border-slate-200 text-slate-600 bg-white hover:border-[#291242] hover:text-[#291242]'
                    }`}
                  >
                    Siguiente
                  </button>
                </div>
              </div>
            )}


          </>
        )}
      </div>
    </div>
  );
};

export {
  NoticiasPage,
};
