import { Fragment, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { getWebText } from '../../../lib/webTexts.js';
import { createPortal } from 'react-dom';
import {
  AlertCircle,
  ArrowUpRight,
  BookOpen,
  Building2,
  Calendar,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
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
  X,
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
              <p className="text-[0.82rem] text-slate-600 font-nunito leading-relaxed whitespace-pre-line break-words">{item.value}</p>
            </div>
          ))}
        </div>
      )}
      {children}
    </div>
  );
};

const EditorialDetailModal = ({ item, onClose }) => {
  useEffect(() => {
    // Bloquear el scroll del fondo cuando el modal se abre
    const originalStyle = window.getComputedStyle(document.body).overflow;
    document.body.style.overflow = 'hidden';

    // Cerrar con Escape
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);

    return () => {
      // Restaurar el scroll original al cerrar
      document.body.style.overflow = originalStyle;
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [onClose]);

  if (!item) return null;

  const summaryParagraphs = (item.summary || item.coverText || 'Sin resumen disponible para este registro.')
    .split('\n')
    .filter(Boolean);
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

  return createPortal(
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 sm:p-6 lg:p-12 overflow-hidden bg-[#291242]/80 backdrop-blur-sm transition-opacity" onClick={onClose}>
      <div 
        className="relative bg-slate-50 w-full max-w-6xl max-h-full rounded-3xl shadow-2xl overflow-hidden flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="absolute top-6 right-6 z-20">
          <button 
            onClick={onClose}
            className="p-2 bg-white hover:bg-slate-100 text-slate-400 hover:text-[#291242] rounded-full shadow-sm transition-colors"
          >
            <X size={20} />
          </button>
        </div>
        <div className="overflow-y-auto p-6 lg:p-10 hide-scrollbar">
           <div className="grid grid-cols-1 xl:grid-cols-[minmax(0,1fr)_20rem] gap-8">
              <div className="space-y-6">
                <div className="space-y-4">
                  <div className="flex items-center gap-3">
                    <Tag text={item.section || 'Acervo PNMC'} className="bg-[#291242] text-white px-3 py-1.5" />
                    <div className="h-px flex-1 bg-slate-200"></div>
                  </div>
                  <h3 className="font-alternate text-2xl lg:text-3xl text-[#291242] font-bold tracking-tight leading-tight">{item.title}</h3>
                  <h5 className="font-alternate text-lg text-slate-400 font-bold tracking-tight mt-6">Resumen y contenido</h5>
                  <div className="space-y-3">
                    {summaryParagraphs.map((paragraph, index) => (
                      <p key={`${item.id}-modal-paragraph-${index}`} className="font-nunito text-slate-600 text-[0.9rem] leading-relaxed">{paragraph}</p>
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
                  <div className="aspect-[4/5] bg-slate-100 relative overflow-hidden">
                    <div className="absolute inset-0 bg-gradient-to-br from-slate-200 to-slate-100 flex items-center justify-center">
                      <Library className="text-slate-300" size={48} />
                    </div>
                    {item.thumbnail && (
                      <img 
                        src={item.thumbnail} 
                        alt={item.title} 
                        className="absolute inset-0 w-full h-full object-cover z-10 bg-transparent" 
                        onError={(e) => { e.target.style.opacity = '0'; }}
                      />
                    )}
                  </div>
                  <div className="p-6 space-y-4">
                    <div className="space-y-3">
                      <div>
                        <span className="text-[0.55rem] font-bold text-slate-400 tracking-[0.08em] block mb-1">Referencia</span>
                        <span className="text-[0.75rem] font-bold text-[#291242] font-alternate">{item.id}</span>
                      </div>
                      <div className="pt-3 border-t border-slate-50">
                        <span className="text-[0.55rem] font-bold text-slate-400 tracking-[0.08em] block mb-1">Autoría visible</span>
                        <span className="text-[0.8rem] text-slate-600 font-nunito leading-relaxed">{item.displayAuthor}</span>
                      </div>
                      <div className="pt-3 border-t border-slate-50">
                        <span className="text-[0.55rem] font-bold text-slate-400 tracking-[0.08em] block mb-1">Soporte principal</span>
                        <span className="text-[0.75rem] font-bold text-[#291242] font-alternate">{item.publicationType || 'Consulta editorial'}{item.year ? ` • ${item.year}` : ''}</span>
                      </div>
                    </div>

                    {item.keywords?.length > 0 && (
                      <div className="pt-3 border-t border-slate-50 space-y-2">
                        <span className="text-[0.55rem] font-bold text-slate-400 uppercase tracking-widest block">Palabras clave</span>
                        <div className="flex flex-wrap gap-1.5">
                          {item.keywords.map((keyword) => (
                            <span key={keyword} className="text-[0.6rem] font-bold text-[#00DA5E] uppercase tracking-widest">#{keyword}</span>
                          ))}
                        </div>
                      </div>
                    )}

                    {item.coverText && (
                      <div className="pt-3 border-t border-slate-50">
                        <div className="rounded-2xl bg-slate-50 px-4 py-4 space-y-2">
                          <div className="flex items-center gap-2 text-slate-300">
                            <Quote size={14} />
                            <span className="text-[0.55rem] font-bold uppercase tracking-[0.2em]">Texto de portada</span>
                          </div>
                          <p className="text-[0.75rem] text-slate-500 font-nunito leading-relaxed whitespace-pre-line">{item.coverText}</p>
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {item.url ? (
                  <Button
                    variant="secondary"
                    className="w-full py-4 text-xs"
                    icon={ExternalLink}
                    onClick={() => window.open(item.url, '_blank', 'noopener,noreferrer')}
                  >
                    Abrir recurso en nueva pestaña
                  </Button>
                ) : (
                  <div className="rounded-2xl border border-slate-100 bg-white px-5 py-4">
                    <div className="text-[0.5rem] font-bold uppercase tracking-[0.2em] text-slate-400">Consulta</div>
                    <div className="mt-2 text-[0.75rem] text-slate-600 font-nunito leading-relaxed">
                      {item.location || 'Registro sin enlace directo. Consulta institucional.'}
                    </div>
                  </div>
                )}
              </div>
           </div>
        </div>
      </div>
    </div>,
    document.body
  );
};

const EditorialPage = ({ onBack, initialExpandedResourceId = null }) => {
  const [selectedMosaicItem, setSelectedMosaicItem] = useState(null);
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
  const [currentPage, setCurrentPage] = useState(1);
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
    setCurrentPage(1);
  }, [searchTerm, advancedTitleSearch, advancedAuthorSearch, advancedKeywordSearch, selectedYearFilter, activeTab, selectedKeyword, editorialSortOrder]);

  const ITEMS_PER_PAGE = 24;
  const totalPages = Math.ceil(filteredResources.length / ITEMS_PER_PAGE);
  
  const paginatedResources = useMemo(() => {
    const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
    return filteredResources.slice(startIndex, startIndex + ITEMS_PER_PAGE);
  }, [filteredResources, currentPage]);

  useEffect(() => {
    if (!pendingScrollResourceId || viewMode !== 'table' || expandedId !== pendingScrollResourceId) return;

    // Disparar el scroll casi de inmediato (50ms) para que el movimiento de la cámara
    // ocurra simultáneamente con la transición CSS (duration-400), logrando un efecto fluido
    const timerId = setTimeout(() => {
      const targetElement = resourceRowRefs.current[pendingScrollResourceId];
      if (targetElement) {
        scrollToElementWithOffset(targetElement, 140);
      }
      setPendingScrollResourceId(null);
    }, 50);

    return () => clearTimeout(timerId);
  }, [pendingScrollResourceId, viewMode, expandedId, filteredResources.length]);

  const currentCategoryLabel = categories.find((category) => category.id === activeTab)?.label || 'Todo el Acervo';

  return (
    <div className="bg-white min-h-screen text-left">
      <PageHero
        tag="Editorial"
        title="Editorial"
        description={getWebText('editorial_description')}
        bgImage="https://images.unsplash.com/photo-1774558396253-be05d7a37d82?q=80&w=1470&auto=format&fit=crop"
        onBack={onBack}
      />

      <div className="max-w-[100rem] mx-auto">
        <div className="grid grid-cols-1 lg:grid-cols-[22rem_minmax(0,1fr)] gap-0">
          <aside id="editorial-filtros" className="bg-slate-50/50 border-r border-slate-100 p-8 lg:p-10 space-y-10 lg:sticky lg:top-20 lg:h-[calc(100vh-5rem)] overflow-y-auto self-start">
            {/* Buscador Integrado */}
            <div className="space-y-3">
              <h4 className="font-alternate text-xs font-bold uppercase tracking-[0.25em] text-slate-500 mb-4">Buscador</h4>
              <div className="relative group flex items-stretch shadow-sm rounded-2xl border border-slate-200 bg-white overflow-hidden focus-within:border-[#00DA5E] focus-within:ring-2 focus-within:ring-[#00DA5E]/20 transition-all">
                <div className="hidden sm:flex pl-4 items-center text-slate-400">
                  <Search size={16} />
                </div>
                <input
                  type="text"
                  placeholder="Buscar en el catálogo..."
                  value={searchTerm}
                  onChange={(event) => setSearchTerm(event.target.value)}
                  className="w-full bg-transparent text-[#291242] text-[0.8rem] pl-4 sm:pl-2 pr-2 py-3.5 outline-none font-nunito placeholder:text-slate-400"
                />
                <button
                  type="button"
                  onClick={() => setShowAdvancedSearch(!showAdvancedSearch)}
                  className={`px-4 flex items-center justify-center gap-2 border-l border-slate-100 font-alternate text-[0.55rem] font-bold uppercase tracking-widest transition-colors ${showAdvancedSearch ? 'bg-slate-50 text-[#00DA5E]' : 'bg-white text-slate-400 hover:bg-slate-50 hover:text-[#291242]'}`}
                >
                  <List size={14} />
                </button>
              </div>

              {/* Advanced Search Panel (Stacked for sidebar) */}
              <div className={`overflow-hidden transition-all duration-500 ease-in-out ${showAdvancedSearch ? 'max-h-[500px] opacity-100' : 'max-h-0 opacity-0'}`}>
                <div className="bg-white border border-slate-200 rounded-2xl p-5 mt-2 shadow-sm space-y-4">
                  <h5 className="font-alternate text-[0.6rem] font-bold uppercase tracking-[0.2em] text-[#291242]">Búsqueda Avanzada</h5>
                  
                  <div className="space-y-3.5">
                    <div className="space-y-1.5">
                      <label className="text-[0.55rem] font-bold uppercase tracking-widest text-slate-400">Título</label>
                      <input
                        type="text"
                        placeholder="Ej. Memorias..."
                        value={advancedTitleSearch}
                        onChange={(event) => setAdvancedTitleSearch(event.target.value)}
                        className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-[0.75rem] text-[#291242] outline-none transition-all focus:border-[#00DA5E]"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-[0.55rem] font-bold uppercase tracking-widest text-slate-400">Autoría</label>
                      <input
                        type="text"
                        placeholder="Ej. Lucho Bermúdez..."
                        value={advancedAuthorSearch}
                        onChange={(event) => setAdvancedAuthorSearch(event.target.value)}
                        className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-[0.75rem] text-[#291242] outline-none transition-all focus:border-[#00DA5E]"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-[0.55rem] font-bold uppercase tracking-widest text-slate-400">Palabra clave</label>
                      <input
                        type="text"
                        placeholder="Ej. Tradición..."
                        value={advancedKeywordSearch}
                        onChange={(event) => setAdvancedKeywordSearch(event.target.value)}
                        className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-[0.75rem] text-[#291242] outline-none transition-all focus:border-[#00DA5E]"
                      />
                    </div>
                  </div>
                  
                  <div className="pt-2 flex justify-end">
                    <button
                      onClick={() => {
                        setAdvancedTitleSearch('');
                        setAdvancedAuthorSearch('');
                        setAdvancedKeywordSearch('');
                      }}
                      className="text-[0.55rem] font-bold text-slate-400 hover:text-slate-600 transition-colors uppercase tracking-widest bg-slate-50 px-3 py-1.5 rounded-lg"
                    >
                      Limpiar
                    </button>
                  </div>
                </div>
              </div>
            </div>
            <div className="space-y-6">
              <h4 className="font-alternate text-xs font-bold uppercase tracking-[0.25em] text-slate-500 border-b border-slate-200 pb-4">Colecciones</h4>
              <nav className="space-y-1.5">
                {categories.map((category) => (
                  <button
                    key={category.id}
                    onClick={() => {
                      setActiveTab(category.id);
                      setSelectedKeyword('');
                    }}
                    className={`w-full flex items-center justify-between px-4 py-3.5 rounded-2xl transition-all group ${activeTab === category.id ? 'bg-white shadow-md text-[#291242] border border-slate-100' : 'text-slate-500 hover:bg-slate-100 border border-transparent'}`}
                  >
                    <div className="flex items-center gap-4">
                      <div className={`transition-colors ${activeTab === category.id ? 'text-[#00DA5E]' : 'text-slate-400 group-hover:text-slate-600'}`}>
                        <category.icon size={18} />
                      </div>
                      <span className="font-alternate text-[0.72rem] font-bold uppercase tracking-widest text-left">{category.label}</span>
                    </div>
                    <span className={`text-[0.55rem] font-bold uppercase tracking-[0.18em] px-2 py-1 rounded-md ${activeTab === category.id ? 'bg-slate-50 text-[#00DA5E]' : 'bg-slate-100 text-slate-400'}`}>
                      {category.id === 'all' ? resources.length : resources.filter((resource) => resource.section === category.id).length}
                    </span>
                  </button>
                ))}
              </nav>
            </div>

            {availableYears.length > 0 && (
              <div className="space-y-6">
                <h4 className="font-alternate text-xs font-bold uppercase tracking-[0.25em] text-slate-500 border-b border-slate-200 pb-4">Año de Publicación</h4>
                <div className="relative">
                  <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                  <select
                    value={selectedYearFilter}
                    onChange={(event) => setSelectedYearFilter(event.target.value)}
                    className="w-full rounded-2xl border border-slate-200 bg-white pl-11 pr-10 py-3.5 text-[0.72rem] font-bold uppercase tracking-[0.12em] text-[#291242] outline-none transition-all focus:border-[#00DA5E] appearance-none shadow-sm cursor-pointer"
                  >
                    <option value="">Cualquier año</option>
                    {availableYears.map((year) => (
                      <option key={year} value={String(year)}>
                        {year}
                      </option>
                    ))}
                  </select>
                  <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" size={16} />
                </div>
              </div>
            )}

            {popularKeywords.length > 0 && (
              <div className="space-y-6">
                <h4 className="font-alternate text-xs font-bold uppercase tracking-[0.25em] text-slate-500 border-b border-slate-200 pb-4">Filtro Temático</h4>
                <div className="flex flex-wrap gap-2">
                  {popularKeywords.map((keyword) => {
                    const isActiveKeyword = selectedKeyword === keyword;
                    return (
                      <button
                        key={keyword}
                        onClick={() => setSelectedKeyword(isActiveKeyword ? '' : keyword)}
                        className={`px-3 py-2 rounded-xl text-[0.58rem] font-bold uppercase tracking-widest transition-all ${isActiveKeyword ? 'bg-[#291242] text-white shadow-md' : 'bg-white border border-slate-200 text-slate-500 hover:border-[#00DA5E] hover:text-[#291242] shadow-sm'}`}
                      >
                        #{keyword}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
          </aside>

          <main id="editorial-catalogo" className="min-w-0 p-8 lg:p-12 scroll-mt-28 bg-white/50">
            <div className="mb-8">
              <SectionHeader backgroundText="CATÁLOGO" foregroundText={currentCategoryLabel} compact />
              <p className="text-slate-500 font-nunito text-[0.85rem] max-w-3xl mt-2 leading-relaxed">
                {isLoadingResources
                  ? 'Cargando el catálogo editorial...'
                  : `Explora la base de datos bibliográfica del PNMC. La vista detallada muestra la ficha catalográfica, clasificación institucional, disponibilidad física o digital y metadatos asociados.`}
              </p>
            </div>

            <div className="flex flex-col md:flex-row items-end justify-between border-b border-slate-100 pb-5 mb-8 gap-4">
              <div className="flex items-center gap-3 text-slate-500 font-nunito text-[0.85rem]">
                 <span className="font-alternate text-[1.6rem] font-bold text-[#00DA5E] leading-none">{filteredResources.length}</span> 
                 <span className="uppercase tracking-[0.2em] text-[0.55rem] font-bold text-slate-400 mt-1">resultados encontrados</span>
              </div>
              
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2">
                  <span className="text-[0.5rem] font-bold uppercase tracking-[0.15em] text-slate-400">Ordenar por</span>
                  <div className="flex items-center hover:bg-slate-50 rounded-lg px-2 py-1.5 transition-colors cursor-pointer group relative">
                    <select
                      value={editorialSortOrder}
                      onChange={(event) => setEditorialSortOrder(event.target.value)}
                      className="bg-transparent text-[0.62rem] font-bold uppercase tracking-[0.1em] text-[#291242] outline-none pr-6 cursor-pointer border-none appearance-none z-10"
                    >
                      <option value="az">A-Z</option>
                      <option value="za">Z-A</option>
                    </select>
                    <ChevronDown size={14} className="text-slate-400 absolute right-2 pointer-events-none group-hover:text-[#291242]" />
                  </div>
                </div>

                <div className="w-px h-6 bg-slate-200"></div>

                <div className="flex gap-1 bg-slate-50 p-1 rounded-xl">
                  <button
                    onClick={() => { setViewMode('mosaic'); setExpandedId(null); }}
                    className={`w-9 h-8 flex items-center justify-center rounded-lg transition-all ${viewMode === 'mosaic' ? 'bg-[#291242] text-white shadow-sm' : 'text-slate-400 hover:text-[#291242] hover:bg-white'}`}
                    aria-label="Vista mosaico"
                  >
                    <Grid3X3 size={15} />
                  </button>
                  <button
                    onClick={() => { setViewMode('table'); setExpandedId(null); }}
                    className={`w-9 h-8 flex items-center justify-center rounded-lg transition-all ${viewMode === 'table' ? 'bg-[#291242] text-white shadow-sm' : 'text-slate-400 hover:text-[#291242] hover:bg-white'}`}
                    aria-label="Vista lista"
                  >
                    <List size={15} />
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
                {paginatedResources.map((item) => (
                  <div
                    key={item.id}
                    onMouseEnter={() => setHoveredId(item.id)}
                    onMouseLeave={() => setHoveredId(null)}
                    onClick={() => setSelectedMosaicItem(item)}
                    className="group relative flex flex-col h-full cursor-pointer overflow-hidden bg-white rounded-[2rem] border border-slate-100 transition-all duration-500 shadow-sm hover:shadow-xl hover:-translate-y-1"
                  >
                    <div className="relative h-64 shrink-0 overflow-hidden bg-slate-100">
                      <div className="absolute inset-0 bg-gradient-to-br from-slate-200 to-slate-100 flex items-center justify-center">
                        <Library className="text-slate-300" size={48} />
                      </div>
                      {item.thumbnail && (
                        <img
                          src={item.thumbnail}
                          className="absolute inset-0 w-full h-full object-cover object-top transition-all duration-1000 group-hover:scale-105 z-10 bg-transparent"
                          alt={item.title}
                          onError={(e) => { e.target.style.opacity = '0'; }}
                        />
                      )}
                      <div className="absolute inset-0 bg-gradient-to-t from-[#291242]/92 via-[#291242]/24 to-transparent opacity-70 group-hover:opacity-30 transition-opacity"></div>
                      <div className={`absolute inset-0 transition-all duration-500 ${hoveredId === item.id ? 'bg-[#291242]' : 'bg-[#291242]/0'}`}></div>

                      <div className="absolute top-5 right-5 left-12 flex justify-end z-30">
                        <span className="bg-[#8BF784] text-[#291242] text-[0.55rem] font-bold px-3 py-1.5 rounded-xl tracking-widest shadow-lg text-right max-w-full">
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

                    <div className="relative flex flex-col flex-1 bg-white p-7">
                      <div className="space-y-3 mb-6">
                        <span className="inline-block text-[0.55rem] font-bold text-[#00DA5E] tracking-widest uppercase">{item.section || 'Acervo PNMC'}</span>
                        <h3 className="font-alternate text-[1.45rem] text-[#291242] font-bold leading-[1.1] text-balance group-hover:text-[#6100D7] transition-colors line-clamp-4">{item.title}</h3>
                        <div className="flex items-start gap-2 pt-1">
                          <UserCircle2 size={16} className="text-slate-300 shrink-0 mt-0.5" />
                          <p className="font-nunito text-[0.75rem] text-slate-500 font-bold leading-relaxed line-clamp-3">
                            {item.displayAuthor}
                          </p>
                        </div>
                      </div>
                      <div className="mt-auto pt-5 border-t border-slate-50 flex items-center justify-between gap-4">
                        <div className="flex gap-2 flex-wrap overflow-hidden">
                          {(item.keywords || []).slice(0, 2).map((keyword) => (
                            <span key={keyword} className="text-[0.5rem] font-bold text-slate-400 tracking-[0.06em]">#{keyword}</span>
                          ))}
                        </div>
                        <button
                          onClick={(event) => {
                            event.stopPropagation();
                            setSelectedMosaicItem(item);
                          }}
                          className="text-[#291242] text-[0.6rem] font-bold tracking-widest uppercase flex items-center gap-2 group/more shrink-0"
                        >
                          Ver Detalle <ArrowUpRight size={15} className="group-hover/more:translate-x-1 group-hover/more:-translate-y-1 transition-transform text-[#00DA5E]" />
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
                    <tr className="text-slate-400 text-[0.65rem] font-bold tracking-[0.1em] uppercase">
                      <th className="px-6 py-4 min-w-[24rem]">Recurso</th>
                      <th className="px-6 py-4 w-64 text-center">Categoría</th>
                      <th className="px-6 py-4 w-64 text-center">Autoría</th>
                      <th className="px-6 py-4 w-28 text-center">Año</th>
                      <th className="px-6 py-4 w-14 text-center"></th>
                    </tr>
                  </thead>
                  <tbody>
                    {paginatedResources.map((item) => {
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
                        <Fragment key={item.id}>
                          <tr
                            ref={(element) => {
                              resourceRowRefs.current[item.id] = element;
                            }}
                            onClick={() => {
                              const isExpanding = expandedId !== item.id;
                              setExpandedId(isExpanding ? item.id : null);
                              if (isExpanding) {
                                setPendingScrollResourceId(item.id);
                              }
                            }}
                            className={`group cursor-pointer transition-all duration-500 shadow-sm border-l-4 ${expandedId === item.id ? 'bg-slate-50 border-[#00DA5E]' : 'bg-white hover:bg-slate-50 border-transparent'}`}
                          >
                            <td className="px-6 py-5 first:rounded-l-2xl">
                              <div className="flex items-center gap-5">
                                <div className="w-12 h-16 rounded-md overflow-hidden bg-slate-100 flex-shrink-0 relative shadow-sm border border-slate-200">
                                  <div className="absolute inset-0 bg-slate-100 flex items-center justify-center">
                                    <Library size={18} className="text-slate-300" />
                                  </div>
                                  {item.thumbnail && (
                                    <img 
                                      src={item.thumbnail} 
                                      className="absolute inset-0 w-full h-full object-cover z-10 bg-transparent" 
                                      alt="" 
                                      onError={(e) => { e.target.style.opacity = '0'; }}
                                    />
                                  )}
                                </div>
                                <span className={`block font-nunito text-[0.9rem] font-semibold leading-snug tracking-[0.02em] transition-colors line-clamp-2 ${expandedId === item.id ? 'text-[#00DA5E]' : 'text-[#291242] group-hover:text-[#00DA5E]'}`}>{item.title}</span>
                              </div>
                            </td>
                            <td className="px-6 py-5 text-center">
                          <span className="inline-flex max-w-[14rem] items-center justify-center rounded-lg bg-slate-100 px-4 py-2 text-center font-nunito text-[0.65rem] font-semibold leading-tight tracking-[0.04em] text-[#291242] break-words">{categoryLabel}</span>
                            </td>
                            <td className="px-6 py-5 text-center">
                              <span className="text-[0.75rem] text-slate-500 font-medium line-clamp-2">{item.displayAuthor}</span>
                            </td>
                            <td className="px-6 py-5 text-center">
                              <span className="text-[0.75rem] font-bold text-slate-400">{item.year || '—'}</span>
                            </td>
                            <td className="px-6 py-5 last:rounded-r-2xl text-center">
                              <div className="flex items-center justify-center">
                                {expandedId === item.id ? <ChevronUp size={18} className="text-[#00DA5E]" /> : <ChevronDown size={18} className="text-slate-300" />}
                              </div>
                            </td>
                          </tr>
                          {expandedId === item.id && (
                            <tr className="bg-transparent overflow-hidden">
                              <td colSpan="5" className="p-0">
                                <div className={`overflow-hidden transition-all duration-500 ease-in-out ${expandedId === item.id ? 'max-h-[2200px] opacity-100' : 'max-h-0 opacity-0'}`}>
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
                                            <div className="aspect-[4/5] bg-slate-100 relative overflow-hidden">
                                              <div className="absolute inset-0 bg-gradient-to-br from-slate-200 to-slate-100 flex items-center justify-center">
                                                <Library className="text-slate-300" size={40} />
                                              </div>
                                              {item.thumbnail && (
                                                <img 
                                                  src={item.thumbnail} 
                                                  alt={item.title} 
                                                  className="absolute inset-0 w-full h-full object-cover z-10 bg-transparent" 
                                                  onError={(e) => { e.target.style.opacity = '0'; }}
                                                />
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
                        </Fragment>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}

            {totalPages > 1 && (
              <div className="mt-12 flex items-center justify-center gap-3">
                <button
                  onClick={() => {
                    setCurrentPage(p => Math.max(1, p - 1));
                    setExpandedId(null);
                    document.getElementById('editorial-catalogo')?.scrollIntoView({ behavior: 'smooth' });
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
                    setExpandedId(null);
                    document.getElementById('editorial-catalogo')?.scrollIntoView({ behavior: 'smooth' });
                  }}
                  disabled={currentPage === totalPages}
                  className="w-11 h-11 flex items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-400 hover:text-[#291242] hover:border-[#00DA5E] disabled:opacity-50 disabled:hover:border-slate-200 disabled:hover:text-slate-400 transition-all shadow-sm"
                >
                  <ChevronRight size={20} />
                </button>
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

      {selectedMosaicItem && (
        <EditorialDetailModal 
          item={selectedMosaicItem} 
          onClose={() => setSelectedMosaicItem(null)} 
        />
      )}
    </div>
  );
};

export {
  EditorialPage,
};
