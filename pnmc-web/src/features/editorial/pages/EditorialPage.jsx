import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  AlertCircle,
  ArrowUpRight,
  BookOpen,
  Building2,
  Calendar,
  ChevronDown,
  ChevronUp,
  Database,
  Disc,
  Download,
  ExternalLink,
  FileVideo,
  Grid3X3,
  Info,
  Landmark,
  Library,
  List,
  Loader2,
  Music2,
  Quote,
  Search,
  SortAsc,
  UserCircle2,
} from 'lucide-react';
import { Button, EmptyState, ErrorState, LoadingState } from '../../../components/ui/index.js';
import { fetchEditorialCatalog } from '../../../services/data/index.js';
import {
  extractEditorialYears,
  getEditorialSectionIcon,
} from '../../content/domain/contentPresentation.js';
import { scrollToElementWithOffset } from '../../map/domain/mapDomain.js';
import { PageHero, SectionHeader, Tag } from '../../shared/components/PagePrimitives.jsx';

const EditorialDetailCard = ({ title, items = [], children }) => {
  if (!items.length && !children) return null;

  return (
    <div className="bg-white border border-slate-100 rounded-[1.75rem] p-5 shadow-sm space-y-4">
      <div className="flex items-center gap-3">
        <div className="w-2 h-2 rounded-full bg-[#00DA5E]"></div>
        <h6 className="font-alternate text-[0.72rem] font-bold tracking-[0.08em] text-[#291242]">{title}</h6>
      </div>
      {items.length > 0 && (
        <div className="space-y-3">
          {items.map((item) => (
            <div key={`${title}-${item.label}`} className="space-y-1">
              <span className="text-[0.55rem] font-bold tracking-[0.08em] text-slate-400">{item.label}</span>
              <p className="text-[0.82rem] text-slate-600 font-nunito leading-relaxed whitespace-pre-line">{item.value}</p>
            </div>
          ))}
        </div>
      )}
      {children}
    </div>
  );
};

const EditorialPage = ({ onBack, initialExpandedResourceId = null }) => {
  const [activeTab, setActiveTab] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [advancedTitleSearch, setAdvancedTitleSearch] = useState('');
  const [advancedAuthorSearch, setAdvancedAuthorSearch] = useState('');
  const [advancedKeywordSearch, setAdvancedKeywordSearch] = useState('');
  const [selectedYearFilter, setSelectedYearFilter] = useState('');
  const [showAdvancedSearch, setShowAdvancedSearch] = useState(false);
  const [editorialSortOrder, setEditorialSortOrder] = useState('az');
  const [selectedKeyword, setSelectedKeyword] = useState('');
  const [hoveredId, setHoveredId] = useState(null);
  const [viewMode, setViewMode] = useState(initialExpandedResourceId ? 'table' : 'mosaic');
  const [expandedId, setExpandedId] = useState(initialExpandedResourceId);
  const [resources, setResources] = useState([]);
  const [isLoadingResources, setIsLoadingResources] = useState(true);
  const [loadError, setLoadError] = useState(null);
  const [pendingScrollResourceId, setPendingScrollResourceId] = useState(initialExpandedResourceId);
  const resourceRowRefs = useRef({});

  const loadCatalog = useCallback(async () => {
    try {
      setIsLoadingResources(true);
      setLoadError(null);
      const payload = await fetchEditorialCatalog();
      setResources(Array.isArray(payload?.items) ? payload.items : []);
    } catch (error) {
      setLoadError(error instanceof Error ? error.message : 'No fue posible cargar el catálogo editorial.');
    } finally {
      setIsLoadingResources(false);
    }
  }, []);

  useEffect(() => {
    loadCatalog();
  }, [loadCatalog]);

  useEffect(() => {
    if (!initialExpandedResourceId) return;
    setViewMode('table');
    setExpandedId(initialExpandedResourceId);
    setPendingScrollResourceId(initialExpandedResourceId);
  }, [initialExpandedResourceId]);

  const categories = useMemo(() => {
    const uniqueSections = [...new Set(
      resources
        .map((resource) => resource.section)
        .filter(Boolean)
    )];

    return [
      { id: 'all', label: 'Todo el Acervo', icon: Library },
      ...uniqueSections.map((section) => ({
        id: section,
        label: section,
        icon: getEditorialSectionIcon(section),
      })),
    ];
  }, [resources]);

  useEffect(() => {
    if (!categories.some((category) => category.id === activeTab)) {
      setActiveTab('all');
    }
  }, [categories, activeTab]);

  const sectionScopedResources = useMemo(() => (
    activeTab === 'all'
      ? resources
      : resources.filter((resource) => resource.section === activeTab)
  ), [resources, activeTab]);

  const popularKeywords = useMemo(() => {
    const counts = new Map();
    sectionScopedResources.forEach((resource) => {
      resource.keywords?.forEach((keyword) => {
        counts.set(keyword, (counts.get(keyword) || 0) + 1);
      });
    });

    return [...counts.entries()]
      .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0], 'es'))
      .slice(0, 8)
      .map(([keyword]) => keyword);
  }, [sectionScopedResources]);

  const availableYears = useMemo(() => (
    [...new Set(
      sectionScopedResources.flatMap((resource) => extractEditorialYears(resource.year))
    )].sort((left, right) => right - left)
  ), [sectionScopedResources]);

  const filteredResources = useMemo(() => {
    const normalizedSearch = searchTerm.trim().toLowerCase();
    const normalizedAdvancedTitle = advancedTitleSearch.trim().toLowerCase();
    const normalizedAdvancedAuthor = advancedAuthorSearch.trim().toLowerCase();
    const normalizedAdvancedKeyword = advancedKeywordSearch.trim().toLowerCase();
    const normalizedKeyword = selectedKeyword.trim().toLowerCase();

    const matchingResources = sectionScopedResources.filter((resource) => {
      const matchesKeyword = !normalizedKeyword
        || resource.keywords?.some((keyword) => keyword.toLowerCase() === normalizedKeyword);

      if (!matchesKeyword) return false;

      const resourceYears = extractEditorialYears(resource.year).map(String);
      const matchesYear = !selectedYearFilter || resourceYears.includes(selectedYearFilter);
      if (!matchesYear) return false;

      const matchesAdvancedTitle = !normalizedAdvancedTitle
        || (resource.title || '').toLowerCase().includes(normalizedAdvancedTitle);
      if (!matchesAdvancedTitle) return false;

      const authorSearchableText = [
        resource.displayAuthor,
        resource.author,
        resource.corporateAuthor,
        resource.credits,
      ]
        .filter(Boolean)
        .join(' ')
        .toLowerCase();

      const matchesAdvancedAuthor = !normalizedAdvancedAuthor
        || authorSearchableText.includes(normalizedAdvancedAuthor);
      if (!matchesAdvancedAuthor) return false;

      const keywordSearchableText = [
        resource.section,
        resource.sectionPath,
        resource.practice,
        resource.category,
        resource.subcategory,
        ...(resource.keywords || []),
      ]
        .filter(Boolean)
        .join(' ')
        .toLowerCase();

      const matchesAdvancedKeyword = !normalizedAdvancedKeyword
        || keywordSearchableText.includes(normalizedAdvancedKeyword);
      if (!matchesAdvancedKeyword) return false;

      if (!normalizedSearch) return true;

      const searchableText = [
        resource.id,
        resource.title,
        resource.year,
        resource.section,
        resource.sectionPath,
        resource.publicationType,
        resource.practice,
        resource.category,
        resource.subcategory,
        resource.author,
        resource.corporateAuthor,
        resource.credits,
        resource.regionalScope,
        resource.location,
        resource.summary,
        resource.additionalFields,
        ...(resource.keywords || []),
      ]
        .filter(Boolean)
        .join(' ')
        .toLowerCase();

      return searchableText.includes(normalizedSearch);
    });

    return [...matchingResources].sort((left, right) => {
      const leftTitle = left.title || left.id || '';
      const rightTitle = right.title || right.id || '';
      const comparison = leftTitle.localeCompare(rightTitle, 'es', { sensitivity: 'base' });
      return editorialSortOrder === 'za' ? comparison * -1 : comparison;
    });
  }, [
    sectionScopedResources,
    searchTerm,
    advancedTitleSearch,
    advancedAuthorSearch,
    advancedKeywordSearch,
    selectedKeyword,
    selectedYearFilter,
    editorialSortOrder,
  ]);

  useEffect(() => {
    if (!pendingScrollResourceId || viewMode !== 'table' || expandedId !== pendingScrollResourceId) return;

    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        const targetElement = resourceRowRefs.current[pendingScrollResourceId];
        if (targetElement) {
          scrollToElementWithOffset(targetElement, 140);
        }
        setPendingScrollResourceId(null);
      });
    });
  }, [pendingScrollResourceId, viewMode, expandedId, filteredResources.length]);

  const openResourceDetail = (resourceId) => {
    setViewMode('table');
    setExpandedId(resourceId);
    setPendingScrollResourceId(resourceId);
  };

  const currentCategoryLabel = categories.find((category) => category.id === activeTab)?.label || 'Todo el Acervo';
  const resourcesWithThumbnails = resources.filter((resource) => resource.thumbnail).length;

  return (
    <div className="bg-white min-h-screen text-left">
      <PageHero
        tag="Editorial"
        title="Editorial"
        description={resources.length
          ? `Catálogo bibliográfico del PNMC con ${resources.length} registros, miniaturas y metadatos listos para consulta pública.`
          : 'Catálogo bibliográfico del PNMC con metadatos, miniaturas y rutas de consulta para investigadores, formadores y agentes del sector musical.'}
        bgImage="https://images.unsplash.com/photo-1774558396253-be05d7a37d82?q=80&w=1470&auto=format&fit=crop"
        onBack={onBack}
      />

      <div className="max-w-[100rem] mx-auto">
        <div className="grid grid-cols-1 lg:grid-cols-[25rem_minmax(0,1fr)] gap-0">
          <aside id="editorial-buscador" className="bg-slate-50 border-r border-slate-100 p-10 space-y-12 min-h-screen scroll-mt-28">
            <div className="space-y-6">
              <h4 className="font-alternate text-sm font-bold uppercase tracking-[0.3em] text-slate-400">Buscador General</h4>
              <div className="relative group">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                <input
                  type="text"
                  placeholder="Buscar título, autoría o palabra clave..."
                  value={searchTerm}
                  onChange={(event) => setSearchTerm(event.target.value)}
                  className="w-full bg-white border border-slate-200 text-[#291242] text-sm pl-12 pr-4 py-4 rounded-2xl outline-none focus:border-[#00DA5E] transition-all shadow-sm"
                />
              </div>
              <div className="rounded-[1.6rem] border border-slate-200 bg-white p-4 shadow-sm space-y-4">
                <button
                  type="button"
                  onClick={() => setShowAdvancedSearch((currentState) => !currentState)}
                  className="w-full flex items-center justify-between gap-4 text-left"
                >
                  <div className="space-y-1">
                    <h5 className="font-alternate text-[0.7rem] font-bold uppercase tracking-[0.22em] text-[#291242]">Buscador Avanzado</h5>
                    <p className="text-[0.72rem] text-slate-400 font-nunito leading-relaxed">
                      Afina por campos específicos del catálogo editorial.
                    </p>
                  </div>
                  <div className="shrink-0 text-slate-400">
                    {showAdvancedSearch ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
                  </div>
                </button>

                {showAdvancedSearch && (
                  <div className="space-y-3 pt-1">
                    <input
                      type="text"
                      placeholder="Buscar por título..."
                      value={advancedTitleSearch}
                      onChange={(event) => setAdvancedTitleSearch(event.target.value)}
                      className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-[0.78rem] text-[#291242] outline-none transition-all focus:border-[#00DA5E]"
                    />
                    <input
                      type="text"
                      placeholder="Buscar por autoría..."
                      value={advancedAuthorSearch}
                      onChange={(event) => setAdvancedAuthorSearch(event.target.value)}
                      className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-[0.78rem] text-[#291242] outline-none transition-all focus:border-[#00DA5E]"
                    />
                    <input
                      type="text"
                      placeholder="Buscar por tema o palabra clave..."
                      value={advancedKeywordSearch}
                      onChange={(event) => setAdvancedKeywordSearch(event.target.value)}
                      className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-[0.78rem] text-[#291242] outline-none transition-all focus:border-[#00DA5E]"
                    />
                  </div>
                )}
              </div>
              <div className="rounded-[1.6rem] border border-slate-200 bg-white p-4 shadow-sm space-y-3">
                <div className="flex items-center gap-3 text-slate-400">
                  <SortAsc size={16} />
                  <span className="font-alternate text-[0.62rem] font-bold uppercase tracking-[0.24em]">Orden alfabético</span>
                </div>
                <select
                  value={editorialSortOrder}
                  onChange={(event) => setEditorialSortOrder(event.target.value)}
                  className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-[0.72rem] font-bold uppercase tracking-[0.12em] text-[#291242] outline-none transition-all focus:border-[#00DA5E]"
                >
                  <option value="az">Título A-Z</option>
                  <option value="za">Título Z-A</option>
                </select>
              </div>
            </div>

            {availableYears.length > 0 && (
              <div className="space-y-8">
                <h4 className="font-alternate text-sm font-bold uppercase tracking-[0.3em] text-slate-400">Años</h4>
                <div className="rounded-[1.6rem] border border-slate-200 bg-white p-4 shadow-sm space-y-3">
                  <select
                    value={selectedYearFilter}
                    onChange={(event) => setSelectedYearFilter(event.target.value)}
                    className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-[0.72rem] font-bold uppercase tracking-[0.12em] text-[#291242] outline-none transition-all focus:border-[#00DA5E]"
                  >
                    <option value="">Todos los años</option>
                    {availableYears.map((year) => (
                      <option key={year} value={String(year)}>
                        {year}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            )}

            <div className="space-y-8">
              <h4 className="font-alternate text-sm font-bold uppercase tracking-[0.3em] text-slate-400">Secciones del Catálogo</h4>
              <nav className="space-y-2">
                {categories.map((category) => (
                  <button
                    key={category.id}
                    onClick={() => {
                      setActiveTab(category.id);
                      setSelectedKeyword('');
                    }}
                    className={`w-full flex items-center justify-between p-4 rounded-2xl transition-all group ${activeTab === category.id ? 'bg-white shadow-lg text-[#291242]' : 'text-slate-400 hover:bg-white/50 hover:text-slate-600'}`}
                  >
                    <div className="flex items-center gap-4">
                      <div className={`p-2 rounded-xl transition-colors ${activeTab === category.id ? 'bg-[#8BF784]' : 'bg-slate-100 group-hover:bg-slate-200'}`}>
                        <category.icon size={18} />
                      </div>
                      <span className="font-alternate text-[0.75rem] font-bold uppercase tracking-widest text-left">{category.label}</span>
                    </div>
                    <span className={`text-[0.55rem] font-bold uppercase tracking-[0.18em] ${activeTab === category.id ? 'text-[#00DA5E]' : 'text-slate-300'}`}>
                      {category.id === 'all' ? resources.length : resources.filter((resource) => resource.section === category.id).length}
                    </span>
                  </button>
                ))}
              </nav>
            </div>

            {popularKeywords.length > 0 && (
              <div className="space-y-8">
                <h4 className="font-alternate text-sm font-bold uppercase tracking-[0.3em] text-slate-400">Temas Frecuentes</h4>
                <div className="flex flex-wrap gap-2">
                  {popularKeywords.map((keyword) => {
                    const isActiveKeyword = selectedKeyword === keyword;
                    return (
                      <button
                        key={keyword}
                        onClick={() => setSelectedKeyword(isActiveKeyword ? '' : keyword)}
                        className={`px-4 py-2 rounded-xl text-[0.6rem] font-bold uppercase tracking-widest transition-all ${isActiveKeyword ? 'bg-[#291242] text-white border border-[#291242]' : 'bg-white border border-slate-100 text-slate-400 hover:border-[#00DA5E] hover:text-[#291242]'}`}
                      >
                        #{keyword}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            <div className="bg-[#291242] rounded-[2.5rem] p-8 text-white space-y-6 shadow-xl relative overflow-hidden">
              <div className="relative z-10 space-y-5">
                <Database className="text-[#8BF784]" size={24} />
                <div className="space-y-2">
                  <h5 className="font-alternate text-lg font-bold uppercase tracking-widest leading-tight">Base Editorial Activa</h5>
                  <p className="text-[0.68rem] text-slate-300 leading-relaxed">
                    Base de datos que recopila los metadatos bibliográficos y las miniaturas del material producido por el Plan Nacional de Música para la Convivencia desde sus inicios.
                  </p>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  {[
                    { label: 'Recursos', value: resources.length || '—' },
                    { label: 'Categorías', value: Math.max(categories.length - 1, 0) || '—' },
                  ].map((stat) => (
                    <div key={stat.label} className="rounded-2xl border border-white/10 bg-white/5 px-4 py-4 min-h-[5.5rem] flex flex-col items-center justify-center text-center backdrop-blur-sm">
                      <div className="font-alternate text-xl leading-none font-bold uppercase text-white">{stat.value}</div>
                      <div className="mt-2 text-[0.52rem] leading-tight font-bold uppercase tracking-[0.2em] text-slate-400">{stat.label}</div>
                    </div>
                  ))}
                </div>
                <div className="rounded-2xl border border-white/10 bg-white/5 px-5 py-5 text-center backdrop-blur-sm">
                  <div className="text-[0.5rem] font-bold uppercase tracking-[0.22em] text-slate-400">Producción editorial del plan</div>
                  <div className="mt-2 font-alternate text-2xl leading-none font-bold uppercase text-white">{resources.length || '—'}</div>
                  <div className="mt-2 text-[0.68rem] text-slate-300 leading-relaxed">
                    Fichas catalogadas del acervo editorial del PNMC, con {resourcesWithThumbnails || 0} miniaturas listas para consulta visual en la web.
                  </div>
                </div>
              </div>
              <div className="absolute -right-10 -bottom-10 w-40 h-40 bg-white/5 rounded-full blur-2xl"></div>
            </div>
          </aside>

          <main id="editorial-catalogo" className="min-w-0 p-8 lg:p-16 scroll-mt-28">
            <div className="mb-12 flex flex-col sm:flex-row items-end justify-between gap-6">
              <div>
                <SectionHeader backgroundText="CATÁLOGO" foregroundText={currentCategoryLabel} verticalContext="RECURSOS" compact />
                <p className="text-slate-400 font-nunito text-sm max-w-2xl">
                  {isLoadingResources
                    ? 'Cargando el catálogo editorial...'
                    : `Explora ${filteredResources.length} registros ${activeTab === 'all' ? 'del acervo completo' : `de ${currentCategoryLabel}`}. La vista detallada muestra ficha bibliográfica, clasificación, disponibilidad y palabras clave.`}
                </p>
              </div>
              <div className="flex items-center gap-4">
                <div className="flex bg-slate-50 border border-slate-100 p-1.5 rounded-xl">
                  <button
                    onClick={() => { setViewMode('mosaic'); setExpandedId(null); }}
                    className={`p-2 rounded-lg transition-all ${viewMode === 'mosaic' ? 'bg-[#00DA5E] text-[#291242] shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}
                    aria-label="Vista mosaico"
                  >
                    <Grid3X3 size={18} />
                  </button>
                  <button
                    onClick={() => { setViewMode('table'); setExpandedId(null); }}
                    className={`p-2 rounded-lg transition-all ${viewMode === 'table' ? 'bg-[#00DA5E] text-[#291242] shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}
                    aria-label="Vista lista"
                  >
                    <List size={18} />
                  </button>
                </div>
              </div>
            </div>

            {loadError ? (
              <div className="rounded-[2rem] border border-red-100 bg-red-50 p-8 text-left space-y-5">
                <div className="flex items-start gap-4">
                  <AlertCircle className="text-red-400 shrink-0 mt-1" size={20} />
                  <div className="space-y-2">
                    <h4 className="font-alternate text-xl font-bold uppercase text-[#291242]">No fue posible cargar Editorial</h4>
                    <p className="text-sm text-slate-500 font-nunito leading-relaxed">{loadError}</p>
                  </div>
                </div>
                <Button variant="outlineDark" className="mt-2" onClick={loadCatalog}>Reintentar carga</Button>
              </div>
            ) : isLoadingResources ? (
              <div className="rounded-[2rem] border border-slate-100 bg-slate-50 p-10 flex items-center justify-center gap-4 text-slate-400">
                <Loader2 className="animate-spin" size={20} />
                <span className="text-sm font-bold uppercase tracking-[0.2em] font-alternate">Sincronizando catálogo editorial</span>
              </div>
            ) : filteredResources.length === 0 ? (
              <div className="rounded-[2rem] border border-slate-100 bg-slate-50 p-10 text-center space-y-4">
                <h4 className="font-alternate text-xl font-bold uppercase text-[#291242]">No encontramos resultados</h4>
                <p className="text-sm text-slate-500 font-nunito max-w-xl mx-auto">
                  Ajusta la búsqueda, cambia la sección activa o limpia el filtro por palabra clave para explorar nuevamente el catálogo.
                </p>
                <div className="flex items-center justify-center gap-3">
                  <Button
                    variant="outlineDark"
                    onClick={() => {
                      setSearchTerm('');
                      setAdvancedTitleSearch('');
                      setAdvancedAuthorSearch('');
                      setAdvancedKeywordSearch('');
                      setSelectedYearFilter('');
                    }}
                  >
                    Limpiar búsqueda
                  </Button>
                  {selectedKeyword && <Button variant="secondary" onClick={() => setSelectedKeyword('')}>Quitar tema</Button>}
                </div>
              </div>
            ) : viewMode === 'mosaic' ? (
              <div className="overflow-hidden rounded-[3rem] border border-slate-100 bg-slate-100 shadow-sm">
                <div className="grid auto-rows-fr grid-cols-1 gap-px md:grid-cols-2 xl:grid-cols-3">
                {filteredResources.map((item) => (
                  <div
                    key={item.id}
                    onMouseEnter={() => setHoveredId(item.id)}
                    onMouseLeave={() => setHoveredId(null)}
                    onClick={() => openResourceDetail(item.id)}
                    className="group relative grid h-[520px] cursor-pointer grid-rows-[17rem_minmax(0,1fr)] overflow-hidden bg-white transition-all duration-700 hover:bg-slate-50/70"
                  >
                    <div className="relative h-full overflow-hidden bg-slate-100">
                      {item.thumbnail ? (
                        <img
                          src={item.thumbnail}
                          className="w-full h-full object-cover object-top transition-all duration-1000 group-hover:scale-105"
                          alt={item.title}
                        />
                      ) : (
                        <div className="w-full h-full bg-gradient-to-br from-slate-200 to-slate-100 flex items-center justify-center">
                          <Library className="text-slate-300" size={48} />
                        </div>
                      )}
                      <div className="absolute inset-0 bg-gradient-to-t from-[#291242]/92 via-[#291242]/24 to-transparent opacity-70 group-hover:opacity-30 transition-opacity"></div>
                      <div className={`absolute inset-0 transition-all duration-500 ${hoveredId === item.id ? 'bg-[#291242]' : 'bg-[#291242]/0'}`}></div>

                      <div className="absolute top-6 right-6">
                        <span className="bg-[#8BF784] text-[#291242] text-[0.46rem] font-bold px-3 py-1 rounded-lg tracking-[0.04em] shadow-lg">
                          {item.publicationType || 'Ficha'}
                        </span>
                      </div>

                      <div className={`absolute inset-0 p-7 flex flex-col justify-center items-center text-center bg-[#291242] transition-all duration-500 ${hoveredId === item.id ? 'opacity-100' : 'opacity-0'}`}>
                        <p className="font-nunito text-[0.74rem] text-slate-100 leading-relaxed line-clamp-7">
                          {item.summary || item.coverText || 'Consulta la ficha detallada para ver los metadatos de este recurso editorial.'}
                        </p>
                      </div>

                      <div className={`absolute bottom-6 left-8 right-8 flex justify-end items-center text-white/85 gap-4 transition-opacity duration-300 ${hoveredId === item.id ? 'opacity-0' : 'opacity-100'}`}>
                        <span className="text-[0.5rem] font-bold tracking-[0.08em] shrink-0">{item.year || 'Sin fecha'}</span>
                      </div>
                    </div>

                    <div className="relative grid grid-rows-[minmax(0,1fr)_auto] bg-white p-7 min-h-0">
                      <div className="space-y-3 min-h-0 overflow-hidden">
                        <span className="text-[0.5rem] font-bold text-[#00DA5E] tracking-[0.08em]">{item.section || 'Acervo PNMC'}</span>
                        <h3 className="font-alternate text-[1.38rem] text-[#291242] font-bold mb-1 leading-[0.98] group-hover:text-[#6100D7] transition-colors line-clamp-2">{item.title}</h3>
                        <div className="flex items-start gap-2">
                          <UserCircle2 size={12} className="text-slate-300 shrink-0 mt-0.5" />
                          <p className="font-nunito text-[0.62rem] text-slate-500 font-bold tracking-[0.04em] leading-relaxed line-clamp-2">
                            {item.displayAuthor}
                          </p>
                        </div>
                      </div>
                      <div className="pt-5 border-t border-slate-50 flex min-h-[4rem] items-center justify-between gap-4">
                        <div className="flex gap-2 flex-wrap overflow-hidden">
                          {(item.keywords || []).slice(0, 2).map((keyword) => (
                            <span key={keyword} className="text-[0.42rem] font-bold text-slate-400 tracking-[0.06em]">#{keyword}</span>
                          ))}
                        </div>
                        <button
                          onClick={(event) => {
                            event.stopPropagation();
                            openResourceDetail(item.id);
                          }}
                          className="text-[#291242] text-[0.56rem] font-bold tracking-[0.08em] flex items-center gap-2 group/more shrink-0"
                        >
                          Ver Detalle <ArrowUpRight size={14} className="group-hover/more:translate-x-1 group-hover/more:-translate-y-1 transition-transform text-[#00DA5E]" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
                </div>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-separate border-spacing-y-3">
                  <thead>
                    <tr className="text-slate-400 text-[0.6rem] font-bold tracking-[0.08em]">
                      <th className="px-6 py-4 min-w-[24rem]">Recurso</th>
                      <th className="px-6 py-4 w-52 text-center">Categoría</th>
                      <th className="px-6 py-4 w-52 text-center">Autoría</th>
                      <th className="px-6 py-4 w-24 text-center">Año</th>
                      <th className="px-6 py-4 w-12 text-center"></th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredResources.map((item) => {
                      const summaryParagraphs = (item.summary || item.coverText || 'Sin resumen disponible para este registro.')
                        .split('\n')
                        .filter(Boolean);
                      const categoryLabel = item.category || item.section || 'Sin categoría';
                      const classificationItems = [
                        { label: 'Sección principal', value: item.section },
                        { label: 'Ruta de sección', value: item.sectionPath },
                        { label: 'Práctica musical', value: item.practice },
                        { label: 'Categoría', value: item.category },
                        { label: 'Subcategoría', value: item.subcategory },
                        { label: 'Ámbito regional', value: item.regionalScope },
                      ].filter((detail) => detail.value);
                      const bibliographicItems = [
                        { label: 'Año o rango', value: item.year },
                        { label: 'Tipo de publicación', value: item.publicationType },
                        { label: 'Autor', value: item.author },
                        { label: 'Autor corporativo', value: item.corporateAuthor },
                        { label: 'Créditos adicionales', value: item.credits },
                        { label: 'ISBN', value: item.isbn },
                        { label: 'ISMN', value: item.ismn },
                        { label: 'Tamaño o formato', value: item.formatSize },
                        { label: 'Páginas', value: item.pages },
                        { label: 'Duración', value: item.duration },
                      ].filter((detail) => detail.value);
                      const availabilityItems = [
                        { label: 'Ubicación de la publicación', value: item.location },
                        { label: 'URL', value: item.url },
                      ].filter((detail) => detail.value);

                      return (
                        <React.Fragment key={item.id}>
                          <tr
                            ref={(element) => {
                              resourceRowRefs.current[item.id] = element;
                            }}
                            onClick={() => setExpandedId(expandedId === item.id ? null : item.id)}
                            className={`group cursor-pointer transition-all duration-500 shadow-sm border-l-4 ${expandedId === item.id ? 'bg-slate-50 border-[#00DA5E]' : 'bg-white hover:bg-slate-50 border-transparent'}`}
                          >
                            <td className="px-6 py-4 first:rounded-l-2xl">
                              <div className="flex items-center gap-4">
                                <div className="w-10 h-10 rounded-lg overflow-hidden bg-slate-100 flex-shrink-0">
                                  {item.thumbnail ? (
                                    <img src={item.thumbnail} className="w-full h-full object-cover" alt="" />
                                  ) : (
                                    <div className="w-full h-full bg-slate-100 flex items-center justify-center">
                                      <Library size={14} className="text-slate-300" />
                                    </div>
                                  )}
                                </div>
                                <span className={`block font-nunito text-[0.84rem] font-semibold leading-snug tracking-[0.02em] transition-colors line-clamp-2 ${expandedId === item.id ? 'text-[#00DA5E]' : 'text-[#291242] group-hover:text-[#00DA5E]'}`}>{item.title}</span>
                              </div>
                            </td>
                            <td className="px-6 py-4 text-center">
                              <span className="inline-flex max-w-[12rem] items-center justify-center rounded-lg bg-slate-100 px-3.5 py-1.5 font-nunito text-[0.56rem] font-semibold leading-tight tracking-[0.04em] text-[#291242]">{categoryLabel}</span>
                            </td>
                            <td className="px-6 py-4 text-center">
                              <span className="text-[0.7rem] text-slate-400 font-medium">{item.displayAuthor}</span>
                            </td>
                            <td className="px-6 py-4 text-center">
                              <span className="text-[0.7rem] font-bold text-slate-400">{item.year || '—'}</span>
                            </td>
                            <td className="px-6 py-4 last:rounded-r-2xl text-center">
                              <div className="flex items-center justify-center">
                                {expandedId === item.id ? <ChevronUp size={18} className="text-[#00DA5E]" /> : <ChevronDown size={18} className="text-slate-300" />}
                              </div>
                            </td>
                          </tr>
                          {expandedId === item.id && (
                            <tr className="bg-transparent overflow-hidden">
                              <td colSpan="5" className="p-0">
                                <div className={`overflow-hidden transition-all duration-700 ease-in-out ${expandedId === item.id ? 'max-h-[2200px] opacity-100' : 'max-h-0 opacity-0'}`}>
                                  <div className="px-4 py-1 bg-slate-50 border-x border-b border-slate-100 mx-2 mb-3 rounded-b-2xl">
                                    <div className="bg-white/60 backdrop-blur-sm rounded-xl p-6 space-y-6">
                                      <div className="grid grid-cols-1 xl:grid-cols-[minmax(0,1fr)_18rem] gap-8">
                                        <div className="space-y-6">
                                          <div className="space-y-4">
                                            <div className="flex items-center gap-3">
                                              <Tag text={item.section || 'Acervo PNMC'} className="bg-[#291242] text-white px-3 py-1.5" />
                                              <div className="h-px flex-1 bg-slate-100"></div>
                                            </div>
                                            <h5 className="font-alternate text-xl text-[#291242] font-bold tracking-tight">Resumen y contenido</h5>
                                            <div className="space-y-3">
                                              {summaryParagraphs.map((paragraph, index) => (
                                                <p key={`${item.id}-paragraph-${index}`} className="font-nunito text-slate-600 text-[0.85rem] leading-relaxed">{paragraph}</p>
                                              ))}
                                            </div>
                                          </div>

                                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                            <EditorialDetailCard title="Clasificación Editorial" items={classificationItems} />
                                            <EditorialDetailCard title="Ficha Bibliográfica" items={bibliographicItems} />
                                          </div>

                                          <div className="space-y-4">
                                            <EditorialDetailCard title="Disponibilidad y Consulta" items={availabilityItems} />
                                            <EditorialDetailCard title="Notas Complementarias" items={item.additionalFields ? [{ label: 'Información adicional', value: item.additionalFields }] : []} />
                                          </div>
                                        </div>

                                        <div className="space-y-4">
                                          <div className="bg-white rounded-[1.75rem] border border-slate-100 overflow-hidden shadow-sm">
                                            <div className="aspect-[4/5] bg-slate-100">
                                              {item.thumbnail ? (
                                                <img src={item.thumbnail} alt={item.title} className="w-full h-full object-cover" />
                                              ) : (
                                                <div className="w-full h-full bg-gradient-to-br from-slate-200 to-slate-100 flex items-center justify-center">
                                                  <Library className="text-slate-300" size={40} />
                                                </div>
                                              )}
                                            </div>
                                            <div className="p-5 space-y-4">
                                              <div className="space-y-3">
                                                <div>
                                                  <span className="text-[0.5rem] font-bold text-slate-400 tracking-[0.08em] block mb-1">Referencia</span>
                                                  <span className="text-[0.72rem] font-bold text-[#291242] font-alternate">{item.id}</span>
                                                </div>
                                                <div className="pt-3 border-t border-slate-50">
                                                  <span className="text-[0.5rem] font-bold text-slate-400 tracking-[0.08em] block mb-1">Autoría visible</span>
                                                  <span className="text-[0.78rem] text-slate-600 font-nunito leading-relaxed">{item.displayAuthor}</span>
                                                </div>
                                                <div className="pt-3 border-t border-slate-50">
                                                  <span className="text-[0.5rem] font-bold text-slate-400 tracking-[0.08em] block mb-1">Soporte principal</span>
                                                  <span className="text-[0.72rem] font-bold text-[#291242] font-alternate">{item.publicationType || 'Consulta editorial'}{item.year ? ` • ${item.year}` : ''}</span>
                                                </div>
                                              </div>

                                              {item.keywords?.length > 0 && (
                                                <div className="pt-3 border-t border-slate-50 space-y-2">
                                                  <span className="text-[0.5rem] font-bold text-slate-400 uppercase tracking-widest block">Palabras clave</span>
                                                  <div className="flex flex-wrap gap-1.5">
                                                    {item.keywords.map((keyword) => (
                                                      <span key={keyword} className="text-[0.58rem] font-bold text-[#00DA5E] uppercase tracking-widest">#{keyword}</span>
                                                    ))}
                                                  </div>
                                                </div>
                                              )}

                                              {item.coverText && (
                                                <div className="pt-3 border-t border-slate-50">
                                                  <div className="rounded-2xl bg-slate-50 px-4 py-4 space-y-2">
                                                    <div className="flex items-center gap-2 text-slate-300">
                                                      <Quote size={14} />
                                                      <span className="text-[0.5rem] font-bold uppercase tracking-[0.2em]">Texto de portada</span>
                                                    </div>
                                                    <p className="text-[0.72rem] text-slate-500 font-nunito leading-relaxed whitespace-pre-line">{item.coverText}</p>
                                                  </div>
                                                </div>
                                              )}
                                            </div>
                                          </div>

                                          {item.url ? (
                                            <Button
                                              variant="secondary"
                                              className="w-full py-3 text-[0.6rem]"
                                              icon={ExternalLink}
                                              onClick={() => window.open(item.url, '_blank', 'noopener,noreferrer')}
                                            >
                                              Abrir recurso
                                            </Button>
                                          ) : (
                                            <div className="rounded-2xl border border-slate-100 bg-white px-5 py-4">
                                              <div className="text-[0.5rem] font-bold uppercase tracking-[0.2em] text-slate-400">Consulta</div>
                                              <div className="mt-2 text-[0.75rem] text-slate-600 font-nunito leading-relaxed">
                                                {item.location || 'Registro sin enlace directo. Consulta la disponibilidad institucional asociada.'}
                                              </div>
                                            </div>
                                          )}
                                        </div>
                                      </div>
                                    </div>
                                  </div>
                                </div>
                              </td>
                            </tr>
                          )}
                        </React.Fragment>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}

            {!isLoadingResources && !loadError && filteredResources.length > 0 && (
              <div className="mt-20 pt-10 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-6">
                <p className="text-[0.62rem] font-bold text-slate-300 uppercase tracking-[0.3em]">
                  Mostrando {filteredResources.length} de {resources.length} registros del catálogo editorial
                </p>
                <div className="flex flex-wrap items-center justify-end gap-2 text-[0.6rem] font-bold uppercase tracking-[0.18em] text-slate-400">
                  {selectedKeyword && <span className="px-3 py-2 rounded-xl bg-slate-50 border border-slate-100">Tema: {selectedKeyword}</span>}
                  {selectedYearFilter && <span className="px-3 py-2 rounded-xl bg-slate-50 border border-slate-100">Año: {selectedYearFilter}</span>}
                  {(searchTerm || advancedTitleSearch || advancedAuthorSearch || advancedKeywordSearch) && (
                    <span className="px-3 py-2 rounded-xl bg-slate-50 border border-slate-100">Búsqueda activa</span>
                  )}
                </div>
              </div>
            )}
          </main>
        </div>
      </div>
    </div>
  );
};

export {
  EditorialPage,
};
