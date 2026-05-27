import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { getWebText } from '../../../lib/webTexts.js';
import {
  ArrowLeft,
  ArrowRight,
  ChevronLeft,
  ChevronRight,
  Download,
  Grid3X3,
  LayoutList,
  MapPin,
  Calendar,
  Images,
  Search,
  X,
  ZoomIn,
  FolderOpen,
  Layers,
  Globe,
  Zap,
  Users,
  Users2,
  Building2,
  Landmark,
  Music2,
  MapIcon as MapIcon,
  Target,
  Boxes,
  UserCircle2,
  MessageCircle,
} from 'lucide-react';
import { MEDIA_LIBRARY, RANDOM_GALLERY_IMAGES } from '../../content/domain/mediaLibrary.js';
import { scrollToElementWithOffset } from '../../map/domain/mapDomain.js';
import { ContentWrapper, PageHero, SectionHeader, Tag } from '../../shared/components/PagePrimitives.jsx';
import { useGalleryAlbums } from '../../../hooks/data/index.js';
import { EmptyState, ErrorState, LoadingState } from '../../../components/ui/index.js';

// ─── Sub-Components ───────────────────────────────────────────────────────────

const buildGalleryDownloadName = (photo, index) => {
  const extensionMatch = String(photo?.src || '').match(/\.([a-zA-Z0-9]+)(?:\?.*)?$/);
  const extension = extensionMatch?.[1] || 'jpg';
  const titleToken = String(photo?.title || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '') || `imagen-${index + 1}`;

  return `pnmc-galeria-${titleToken}.${extension}`;
};

const AlbumCard = ({ album, onClick, featured = false, cover }) => {
  return (
    <button
      type="button"
      onClick={() => onClick(album.id)}
      className={`group relative overflow-hidden rounded-[1.6rem] text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#00DA5E] focus-visible:ring-offset-2 ${featured ? 'h-[22rem] md:h-[26rem]' : 'h-[18rem]'}`}
    >
      {/* Background Image */}
      <img
        src={cover}
        alt={album.title}
        className="absolute inset-0 h-full w-full object-cover transition-transform duration-700 ease-out group-hover:scale-105"
      />

      {/* Dark gradient overlay */}
      <div className="absolute inset-0 bg-gradient-to-t from-[#0d0820]/92 via-[#0d0820]/35 to-transparent transition-opacity duration-300" />
      <div className="absolute inset-0 bg-[#291242]/0 group-hover:bg-[#291242]/20 transition-all duration-500" />

      {/* Top badges */}
      <div className="absolute top-4 left-4 flex items-center gap-2">
        {album.featured && (
          <span className="inline-flex items-center rounded-full bg-[#00DA5E] px-2.5 py-1 text-[0.45rem] font-bold uppercase tracking-[0.2em] text-[#0d0820]">
            Destacado
          </span>
        )}
        {album.category && (
          <span className="inline-flex items-center rounded-full border border-white/20 bg-black/30 px-2.5 py-1 text-[0.42rem] font-bold uppercase tracking-[0.18em] text-white/90 backdrop-blur-sm">
            {album.category}
          </span>
        )}
      </div>

      {/* Hover action */}
      <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300">
        <span className="inline-flex items-center gap-2 rounded-full border border-white/30 bg-white/10 px-4 py-2 text-[0.58rem] font-bold uppercase tracking-widest text-white backdrop-blur-md">
          <FolderOpen size={13} />
          {getWebText('gallery_explore_all') || "Explorar álbum"}
        </span>
      </div>

      {/* Bottom info */}
      <div className="absolute inset-x-0 bottom-0 p-4 lg:p-5">
        <h3 className="font-alternate text-[0.9rem] lg:text-[1rem] font-bold uppercase leading-tight text-white tracking-wide mb-2">
          {album.title}
        </h3>
        <div className="flex flex-wrap items-center gap-3">
          {album.location && (
            <span className="flex items-center gap-1 text-[0.48rem] font-bold uppercase tracking-[0.14em] text-white/65">
              <MapPin size={9} />
              {album.location}
            </span>
          )}
          {album.dateLabel && (
            <span className="flex items-center gap-1 text-[0.48rem] font-bold uppercase tracking-[0.14em] text-white/65">
              <Calendar size={9} />
              {album.dateLabel}
            </span>
          )}
          <span className="flex items-center gap-1 text-[0.48rem] font-bold uppercase tracking-[0.14em] text-[#8BF784]">
            <Images size={9} />
            {album.photoCount || 0} fotos
          </span>
        </div>
      </div>
    </button>
  );
};

const PhotoThumbnail = ({ photo, index, onClick, isActive = false }) => {
  const isVideo = photo.src.toLowerCase().endsWith('.mp4') || photo.type === 'video';

  return (
    <button
      type="button"
      onClick={() => onClick(index)}
      className={`relative flex-shrink-0 h-16 w-24 overflow-hidden rounded-lg transition-all duration-200 ${isActive ? 'ring-2 ring-[#00DA5E] opacity-100 scale-100' : 'opacity-50 hover:opacity-80 scale-95 hover:scale-100'}`}
    >
      {isVideo ? (
        <video src={photo.src} muted preload="metadata" className="h-full w-full object-cover" />
      ) : (
        <img src={photo.src} alt={photo.title || ''} className="h-full w-full object-cover" />
      )}
      {isVideo && (
        <div className="absolute inset-0 bg-black/25 flex items-center justify-center">
          <svg className="w-4 h-4 fill-white" viewBox="0 0 24 24">
            <polygon points="5 3 19 12 5 21 5 3"/>
          </svg>
        </div>
      )}
    </button>
  );
};

// ─── Main GaleriaPage ─────────────────────────────────────────────────────────

const GaleriaPage = ({ onBack }) => {
  const [activeAlbumId, setActiveAlbumId] = useState(null);
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [albumSearch, setAlbumSearch] = useState('');
  const [viewLayout, setViewLayout] = useState('grid'); // 'grid' | 'list'
  const [lightbox, setLightbox] = useState({ items: [], index: null, contextTitle: '' });
  const [visiblePhotosCount, setVisiblePhotosCount] = useState(24);
  const thumbnailStripRef = useRef(null);

  const { albums, error, isLoading, isError, retry } = useGalleryAlbums();

  // ── Derived data ─────────────────────────────────────────────────────────

  const sortedAlbums = useMemo(
    () => [...albums].sort((a, b) => {
      if (a.featured && !b.featured) return -1;
      if (!a.featured && b.featured) return 1;
      return a.title.localeCompare(b.title, 'es');
    }),
    [albums],
  );

  const categories = useMemo(() => {
    const cats = [...new Set(sortedAlbums.map((a) => a.category).filter(Boolean))];
    return cats;
  }, [sortedAlbums]);

  const filteredAlbums = useMemo(() => {
    return sortedAlbums.filter((album) => {
      const matchCat = categoryFilter === 'all' || album.category === categoryFilter;
      const q = albumSearch.trim().toLowerCase();
      const matchSearch = !q || album.title.toLowerCase().includes(q) || (album.location || '').toLowerCase().includes(q);
      return matchCat && matchSearch;
    });
  }, [sortedAlbums, categoryFilter, albumSearch]);

  const featuredAlbums = useMemo(() => {
    const expl = sortedAlbums.filter((a) => a.featured);
    return (expl.length > 0 ? expl : sortedAlbums).slice(0, 4);
  }, [sortedAlbums]);

  const heroImage = useMemo(
    () => featuredAlbums[0]?.cover || MEDIA_LIBRARY.fieldworkWide,
    [featuredAlbums],
  );

  const getAlbumCover = useCallback(
    (album) => album?.cover || album?.photos?.[0]?.src || MEDIA_LIBRARY.fieldworkWide,
    [],
  );

  const activeAlbum = useMemo(
    () => (activeAlbumId ? sortedAlbums.find((a) => a.id === activeAlbumId) || null : null),
    [activeAlbumId, sortedAlbums],
  );


  const activeAlbumSections = useMemo(() => {
    if (!activeAlbum) return [];
    const sects = (activeAlbum.sections || []).filter((s) => s.photos?.length > 0);
    if (sects.length === 0) {
      return [{ id: 'general', title: 'General', photos: activeAlbum.photos || [] }];
    }
    return sects;
  }, [activeAlbum]);

  const hasMultipleSections = activeAlbumSections.length > 1;

  // Lightbox helpers
  const activeLightboxPhoto = lightbox.index !== null ? lightbox.items[lightbox.index] || null : null;
  const isLightboxVideo = activeLightboxPhoto ? (activeLightboxPhoto.src.toLowerCase().endsWith('.mp4') || activeLightboxPhoto.type === 'video') : false;

  const openAlbum = useCallback((albumId) => {
    setActiveAlbumId(albumId);
    setVisiblePhotosCount(24);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, []);

  const closeAlbum = useCallback(() => {
    setActiveAlbumId(null);
    setVisiblePhotosCount(24);
  }, []);

  const openLightbox = useCallback((items, index, contextTitle = '') => {
    if (!items?.[index]) return;
    setLightbox({ items, index, contextTitle });
  }, []);

  const closeLightbox = useCallback(() => setLightbox({ items: [], index: null, contextTitle: '' }), []);

  const prevPhoto = useCallback(() => {
    setLightbox((s) => {
      if (s.index === null) return s;
      return { ...s, index: s.index === 0 ? s.items.length - 1 : s.index - 1 };
    });
  }, []);

  const nextPhoto = useCallback(() => {
    setLightbox((s) => {
      if (s.index === null) return s;
      return { ...s, index: s.index === s.items.length - 1 ? 0 : s.index + 1 };
    });
  }, []);

  // ── Scroll thumbnail into view when lightbox navigates ────────────────────
  useEffect(() => {
    if (lightbox.index === null || !thumbnailStripRef.current) return;
    const thumbEl = thumbnailStripRef.current.children[lightbox.index];
    if (thumbEl) {
      thumbEl.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' });
    }
  }, [lightbox.index]);

  // ── Keyboard navigation ───────────────────────────────────────────────────
  useEffect(() => {
    if (lightbox.index === null) return undefined;
    const handle = (e) => {
      if (e.key === 'Escape') closeLightbox();
      else if (e.key === 'ArrowLeft') prevPhoto();
      else if (e.key === 'ArrowRight') nextPhoto();
    };
    window.addEventListener('keydown', handle);
    return () => window.removeEventListener('keydown', handle);
  }, [lightbox.index, closeLightbox, prevPhoto, nextPhoto]);

  useEffect(() => {
    if (activeAlbumId && lightbox.index === null) {
      const handle = (e) => { if (e.key === 'Escape') closeAlbum(); };
      window.addEventListener('keydown', handle);
      return () => window.removeEventListener('keydown', handle);
    }
    return undefined;
  }, [activeAlbumId, lightbox.index, closeAlbum]);

  // ── Body scroll lock ──────────────────────────────────────────────────────
  useEffect(() => {
    const locked = !!activeAlbumId || lightbox.index !== null;
    if (!locked) return undefined;
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = prev; };
  }, [activeAlbumId, lightbox.index]);

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <div className="bg-[#f8f7fb] min-h-screen text-left">
      <PageHero
        tag={getWebText('nav_galeria') || "Galería"}
        title={getWebText('gallery_hero_title') || "Álbumes y Memorias"}
        titleAccent=""
        description={getWebText('gallery_description')}
        bgImage={heroImage}
        onBack={onBack}
      />

      <div className="max-w-[100rem] mx-auto px-6 lg:px-10 py-14 space-y-14">

        {/* ── Loading / Error / Empty ─────────────────────────────────────── */}
        {isLoading && albums.length === 0 && (
          <LoadingState 
            title={getWebText('gallery_loading_title') || "Cargando galería…"} 
            description={getWebText('gallery_loading_desc') || "Preparando álbumes e imágenes."} 
          />
        )}
        {isError && albums.length === 0 && (
          <ErrorState
            title="No pudimos cargar la galería"
            description={error?.message || 'Intenta de nuevo en unos segundos.'}
            onRetry={retry}
          />
        )}
        {!isLoading && !isError && albums.length === 0 && (
          <EmptyState title="No hay álbumes disponibles" description="Aún no se ha cargado contenido visual para esta sección." />
        )}

        {!isLoading && albums.length > 0 && (
          <>
            {/* ── Featured Editorial Showcase ───────────────────────────── */}
            {featuredAlbums.length > 0 && (
              <section>
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center gap-3">
                    <div className="w-1 h-6 rounded-full bg-[#00DA5E]" />
                    <h2 className="font-alternate text-[0.75rem] font-bold uppercase tracking-[0.22em] text-[#291242]">
                      Colecciones Destacadas
                    </h2>
                  </div>
                </div>

                {featuredAlbums.length === 1 && (
                  <div className="grid grid-cols-1">
                    <AlbumCard album={featuredAlbums[0]} onClick={openAlbum} featured cover={getAlbumCover(featuredAlbums[0])} />
                  </div>
                )}

                {featuredAlbums.length === 2 && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {featuredAlbums.map((album) => (
                      <AlbumCard key={album.id} album={album} onClick={openAlbum} featured cover={getAlbumCover(album)} />
                    ))}
                  </div>
                )}

                {featuredAlbums.length === 3 && (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    <div className="md:col-span-2 lg:col-span-2">
                      <AlbumCard album={featuredAlbums[0]} onClick={openAlbum} featured cover={getAlbumCover(featuredAlbums[0])} />
                    </div>
                    <div className="flex flex-col gap-4">
                      {featuredAlbums.slice(1).map((album) => (
                        <AlbumCard key={album.id} album={album} onClick={openAlbum} cover={getAlbumCover(album)} />
                      ))}
                    </div>
                  </div>
                )}

                {featuredAlbums.length >= 4 && (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-12 gap-4">
                    {/* Main large */}
                    <div className="lg:col-span-7">
                      <AlbumCard album={featuredAlbums[0]} onClick={openAlbum} featured cover={getAlbumCover(featuredAlbums[0])} />
                    </div>
                    {/* Side stack */}
                    <div className="lg:col-span-5 flex flex-col gap-4">
                      {featuredAlbums.slice(1, 4).map((album) => (
                        <AlbumCard key={album.id} album={album} onClick={openAlbum} cover={getAlbumCover(album)} />
                      ))}
                    </div>
                  </div>
                )}
              </section>
            )}

            {/* ── Divider ───────────────────────────────────────────────── */}
            <div className="flex items-center gap-4">
              <div className="flex-1 h-px bg-slate-200" />
              <span className="text-[0.52rem] font-bold uppercase tracking-[0.24em] text-slate-400">
                {getWebText('gallery_collection_title') || "Todas las colecciones"}
              </span>
              <div className="flex-1 h-px bg-slate-200" />
            </div>

            {/* ── Filter + Search bar ───────────────────────────────────── */}
            <section>
              <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4 mb-8">
                {/* Category pills */}
                <div className="flex flex-wrap items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setCategoryFilter('all')}
                    className={`rounded-full px-4 py-2 text-[0.56rem] font-bold uppercase tracking-[0.18em] transition-all ${categoryFilter === 'all' ? 'bg-[#291242] text-white shadow-sm' : 'border border-slate-200 bg-white text-slate-500 hover:border-[#291242]/30 hover:text-[#291242]'}`}
                  >
                    {getWebText('gallery_filter_all_cats') || "Todos los álbumes"} ({sortedAlbums.length})
                  </button>
                  {categories.map((cat) => {
                    const count = sortedAlbums.filter((a) => a.category === cat).length;
                    return (
                      <button
                        key={cat}
                        type="button"
                        onClick={() => setCategoryFilter(cat)}
                        className={`rounded-full px-4 py-2 text-[0.56rem] font-bold uppercase tracking-[0.18em] transition-all ${categoryFilter === cat ? 'bg-[#291242] text-white shadow-sm' : 'border border-slate-200 bg-white text-slate-500 hover:border-[#291242]/30 hover:text-[#291242]'}`}
                      >
                        {cat} ({count})
                      </button>
                    );
                  })}
                </div>

                {/* Right side: search + layout toggle */}
                <div className="flex items-center gap-3 shrink-0">
                  <div className="relative">
                    <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input
                      type="text"
                      placeholder={getWebText('gallery_search_placeholder') || "Buscar álbum…"}
                      value={albumSearch}
                      onChange={(e) => setAlbumSearch(e.target.value)}
                      className="rounded-full border border-slate-200 bg-white pl-8 pr-4 py-2 text-[0.62rem] font-nunito text-slate-700 outline-none w-44 focus:border-[#00DA5E] focus:w-52 transition-all placeholder:text-slate-400"
                    />
                  </div>
                  <div className="flex items-center rounded-full border border-slate-200 bg-white overflow-hidden">
                    <button
                      type="button"
                      onClick={() => setViewLayout('grid')}
                      className={`p-2.5 transition-colors ${viewLayout === 'grid' ? 'bg-[#291242] text-white' : 'text-slate-400 hover:text-[#291242]'}`}
                      aria-label="Vista en cuadrícula"
                    >
                      <Grid3X3 size={13} />
                    </button>
                    <button
                      type="button"
                      onClick={() => setViewLayout('list')}
                      className={`p-2.5 transition-colors ${viewLayout === 'list' ? 'bg-[#291242] text-white' : 'text-slate-400 hover:text-[#291242]'}`}
                      aria-label="Vista en lista"
                    >
                      <LayoutList size={13} />
                    </button>
                  </div>
                </div>
              </div>

              {filteredAlbums.length === 0 && (
                <div className="rounded-[1.6rem] border border-slate-100 bg-white p-12 text-center">
                  <p className="text-slate-400 font-nunito text-sm">No se encontraron álbumes con esos criterios.</p>
                </div>
              )}

              {/* Grid layout */}
              {viewLayout === 'grid' && filteredAlbums.length > 0 && (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
                  {filteredAlbums.map((album) => (
                    <AlbumCard key={album.id} album={album} onClick={openAlbum} cover={getAlbumCover(album)} />
                  ))}
                </div>
              )}

              {/* List layout */}
              {viewLayout === 'list' && filteredAlbums.length > 0 && (
                <div className="flex flex-col gap-3">
                  {filteredAlbums.map((album) => (
                    <button
                      key={album.id}
                      type="button"
                      onClick={() => openAlbum(album.id)}
                      className="group flex items-center gap-5 rounded-[1.2rem] border border-slate-200 bg-white hover:border-[#291242]/30 hover:shadow-sm transition-all overflow-hidden text-left px-4 py-3 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#00DA5E]"
                    >
                      <div className="relative h-16 w-24 shrink-0 overflow-hidden rounded-[0.8rem]">
                        <img src={getAlbumCover(album)} alt={album.title} className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-alternate text-[0.82rem] font-bold uppercase leading-tight text-[#291242] truncate">{album.title}</p>
                        <div className="mt-1.5 flex flex-wrap items-center gap-3">
                          {album.category && (
                            <span className="text-[0.48rem] font-bold uppercase tracking-[0.14em] text-[#291242]/50">{album.category}</span>
                          )}
                          {album.location && (
                            <span className="flex items-center gap-1 text-[0.46rem] font-bold uppercase tracking-[0.12em] text-slate-400">
                              <MapPin size={8} />{album.location}
                            </span>
                          )}
                          {album.dateLabel && (
                            <span className="flex items-center gap-1 text-[0.46rem] font-bold uppercase tracking-[0.12em] text-slate-400">
                              <Calendar size={8} />{album.dateLabel}
                            </span>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-3 shrink-0">
                        <span className="flex items-center gap-1 text-[0.5rem] font-bold uppercase tracking-[0.14em] text-[#00DA5E]">
                          <Images size={10} />{album.photoCount || 0}
                        </span>
                        <ArrowRight size={14} className="text-slate-300 group-hover:text-[#291242] group-hover:translate-x-1 transition-all" />
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </section>
          </>
        )}
      </div>

      {/* ═══════════════════════════════════════════════════════════════════════
           ALBUM VIEW OVERLAY
      ════════════════════════════════════════════════════════════════════════ */}
      {activeAlbumId && activeAlbum && (
        <div className="fixed inset-0 z-[3500] bg-[#f8f7fb] flex flex-col">

          {/* Album header — fixed at top of overlay */}
          <div className="flex-shrink-0 bg-white border-b border-slate-100 shadow-sm">
            <div className="max-w-[100rem] mx-auto px-6 lg:px-10 py-4 flex items-center gap-5">
              {/* Back button */}
              <button
                type="button"
                onClick={closeAlbum}
                className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-slate-50 hover:bg-slate-100 px-3.5 py-2 text-[0.56rem] font-bold uppercase tracking-[0.18em] text-[#291242] transition-all shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#00DA5E]"
              >
                <ArrowLeft size={13} />
                Volver
              </button>

              {/* Album cover thumbnail */}
              <div className="hidden md:block h-12 w-16 shrink-0 overflow-hidden rounded-lg border border-slate-100">
                <img src={getAlbumCover(activeAlbum)} alt={activeAlbum.title} className="h-full w-full object-cover" />
              </div>

              {/* Album info */}
              <div className="flex-1 min-w-0">
                <h2 className="font-alternate text-[0.95rem] font-bold uppercase leading-none tracking-wide text-[#291242] truncate">
                  {activeAlbum.title}
                </h2>
                <div className="mt-1.5 flex flex-wrap items-center gap-3">
                  {activeAlbum.category && (
                    <span className="inline-flex items-center rounded-full bg-[#291242]/8 px-2.5 py-0.5 text-[0.45rem] font-bold uppercase tracking-[0.16em] text-[#291242]/70">
                      {activeAlbum.category}
                    </span>
                  )}
                  {activeAlbum.location && (
                    <span className="flex items-center gap-1 text-[0.46rem] font-bold uppercase tracking-[0.13em] text-slate-400">
                      <MapPin size={9} />{activeAlbum.location}
                    </span>
                  )}
                  {activeAlbum.dateLabel && (
                    <span className="flex items-center gap-1 text-[0.46rem] font-bold uppercase tracking-[0.13em] text-slate-400">
                      <Calendar size={9} />{activeAlbum.dateLabel}
                    </span>
                  )}
                  <span className="flex items-center gap-1 text-[0.46rem] font-bold uppercase tracking-[0.13em] text-[#00DA5E]">
                    <Images size={9} />{activeAlbum.photoCount || 0} fotos
                  </span>
                  {hasMultipleSections && (
                    <span className="flex items-center gap-1 text-[0.46rem] font-bold uppercase tracking-[0.13em] text-slate-400">
                      <Layers size={9} />{activeAlbumSections.length} secciones
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* Album description */}
            {activeAlbum.description && (
              <div className="max-w-[100rem] mx-auto px-6 lg:px-10 pb-4">
                <p className="font-nunito text-[0.72rem] text-slate-500 leading-relaxed max-w-3xl border-l-2 border-[#8BF784] pl-3">
                  {activeAlbum.description}
                </p>
              </div>
            )}
          </div>

          {/* Album content — scrollable area */}
          <div className="flex-1 overflow-y-auto">
          <div className="max-w-[100rem] mx-auto px-6 lg:px-10 py-8 space-y-10">
            {activeAlbumSections.length > 0 ? (
              activeAlbumSections.map((section) => (
                <div key={section.id}>
                  {hasMultipleSections && (
                    <div className="flex items-center gap-4 mb-5">
                      <div className="w-1 h-5 rounded-full bg-[#00DA5E]" />
                      <h3 className="font-alternate text-[0.72rem] font-bold uppercase tracking-[0.2em] text-[#291242]">
                        {section.title}
                      </h3>
                      <span className="text-[0.48rem] font-bold uppercase tracking-[0.14em] text-slate-400">
                        {section.photos.length} fotos
                      </span>
                    </div>
                  )}

                  {/* Masonry photo grid */}
                  <div className="columns-1 sm:columns-2 lg:columns-3 xl:columns-4 gap-4 [column-fill:balance]">
                    {section.photos.slice(0, visiblePhotosCount).map((photo, pIdx) => {
                      const isVideo = photo.src.toLowerCase().endsWith('.mp4') || photo.type === 'video';

                      return (
                        <button
                          key={`${section.id}-${photo.id}-${pIdx}`}
                          type="button"
                          onClick={() => openLightbox(section.photos, pIdx, `${activeAlbum.title}${hasMultipleSections ? ` · ${section.title}` : ''}`)}
                          className="group relative mb-4 inline-block w-full break-inside-avoid overflow-hidden rounded-[1.1rem] border border-slate-200/60 bg-white shadow-sm hover:shadow-lg transition-shadow duration-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#00DA5E]"
                        >
                          {isVideo ? (
                            <div className="relative aspect-video w-full overflow-hidden bg-slate-900 shrink-0">
                              <video
                                src={photo.src}
                                muted
                                playsInline
                                preload="metadata"
                                className="h-full w-full object-cover opacity-80"
                              />
                              <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                                <div className="rounded-full bg-white/20 border border-white/40 p-3.5 backdrop-blur-md text-white shadow-lg">
                                  <svg className="w-5 h-5 fill-current" viewBox="0 0 24 24">
                                    <polygon points="5 3 19 12 5 21 5 3"/>
                                  </svg>
                                </div>
                              </div>
                              <div className="absolute bottom-3 left-3 pointer-events-none">
                                <span className="inline-flex items-center rounded-md bg-black/55 px-2 py-0.5 text-[0.45rem] font-bold uppercase tracking-widest text-[#8BF784] backdrop-blur-sm border border-white/5">
                                  Video
                                </span>
                              </div>
                            </div>
                          ) : (
                            <img
                              src={photo.src}
                              alt={photo.alt || photo.title || ''}
                              className="h-auto w-full object-cover transition-transform duration-500 group-hover:scale-[1.02] [transform:translateZ(0)] [-webkit-backface-visibility:hidden] [backface-visibility:hidden]"
                            />
                          )}
                          {/* Hover overlay */}
                          <div className="absolute inset-0 bg-[#291242]/0 group-hover:bg-[#291242]/55 transition-all duration-300 flex items-center justify-center">
                            <div className="opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex flex-col items-center gap-2">
                              <div className="rounded-full bg-white/15 border border-white/30 p-3 backdrop-blur-sm">
                                <ZoomIn size={18} className="text-white" />
                              </div>
                              <p className="text-white text-[0.52rem] font-bold uppercase tracking-[0.14em] text-center max-w-[80%] leading-tight">
                                {photo.title || (isVideo ? "Ver Video" : "Ampliar Foto")}
                              </p>
                            </div>
                          </div>
                          {/* Download button (top-right, visible on hover) */}
                          <a
                            href={photo.src}
                            download={buildGalleryDownloadName(photo, pIdx)}
                            onClick={(e) => e.stopPropagation()}
                            className="absolute top-2.5 right-2.5 opacity-0 group-hover:opacity-100 transition-opacity duration-200 inline-flex h-8 w-8 items-center justify-center rounded-full bg-black/40 border border-white/20 text-white hover:bg-black/60 backdrop-blur-sm"
                            aria-label={isVideo ? "Descargar video" : "Descargar foto"}
                          >
                            <Download size={13} />
                          </a>
                        </button>
                      );
                    })}
                  </div>

                  {/* Progressive batch load button */}
                  {visiblePhotosCount < section.photos.length && (
                    <div className="pt-10 pb-6 flex flex-col items-center justify-center gap-4">
                      <div className="text-[0.62rem] font-bold text-slate-400 uppercase tracking-widest font-alternate">
                        Mostrando {visiblePhotosCount} de {section.photos.length} archivos
                      </div>
                      <button
                        type="button"
                        onClick={() => setVisiblePhotosCount((prev) => prev + 24)}
                        className="inline-flex items-center gap-2.5 px-7 py-3.5 rounded-full border border-slate-200 bg-white hover:border-[#291242]/30 hover:bg-[#291242]/5 text-[0.62rem] font-bold text-[#291242] uppercase font-alternate tracking-widest transition-all cursor-pointer shadow-sm hover:scale-105 active:scale-95"
                      >
                        Cargar más fotos
                      </button>
                    </div>
                  )}
                </div>
              ))
            ) : (
              <div className="rounded-[1.6rem] border border-slate-200 bg-white p-12">
                <EmptyState title="Álbum sin imágenes" description="Este álbum aún no tiene fotos cargadas." />
              </div>
            )}
          </div>
          </div>
        </div>
      )}

      {/* ═══════════════════════════════════════════════════════════════════════
           LIGHTBOX OVERLAY (Premium Full-Screen)
      ════════════════════════════════════════════════════════════════════════ */}
      {activeLightboxPhoto && (
        <div className="fixed inset-0 z-[4000] flex flex-col bg-[#0a0510] select-none">

          {/* Top bar */}
          <div className="relative z-[2] flex items-center justify-between gap-4 px-5 py-3 bg-gradient-to-b from-black/60 to-transparent pointer-events-none">
            <div className="pointer-events-auto flex items-center gap-3">
              <button
                type="button"
                onClick={closeLightbox}
                className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-white/15 bg-black/35 text-white hover:bg-white/15 transition-colors backdrop-blur-md"
                aria-label="Cerrar"
              >
                <X size={16} />
              </button>
              {lightbox.contextTitle && (
                <span className="text-[0.52rem] font-bold uppercase tracking-[0.2em] text-white/55">
                  {lightbox.contextTitle}
                </span>
              )}
            </div>
            <div className="pointer-events-auto flex items-center gap-2">
              <span className="rounded-full border border-white/15 bg-black/35 px-3 py-1.5 text-[0.52rem] font-bold uppercase tracking-[0.2em] text-white/70 backdrop-blur-md">
                {lightbox.index + 1} / {lightbox.items.length}
              </span>
              <a
                href={activeLightboxPhoto.src}
                download={buildGalleryDownloadName(activeLightboxPhoto, lightbox.index)}
                className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-white/15 bg-black/35 text-white hover:bg-white/15 transition-colors backdrop-blur-md"
                aria-label={isLightboxVideo ? "Descargar video" : "Descargar imagen"}
              >
                <Download size={15} />
              </a>
            </div>
          </div>

          {/* Main image area */}
          <div className="relative flex-1 flex items-center justify-center min-h-0">
            {/* Backdrop */}
            <button
              type="button"
              className="absolute inset-0 cursor-default"
              onClick={closeLightbox}
              aria-label="Cerrar visualizador"
            />

            {/* Prev */}
            {lightbox.items.length > 1 && (
              <button
                type="button"
                onClick={prevPhoto}
                className="absolute left-3 lg:left-6 z-[1] inline-flex h-11 w-11 items-center justify-center rounded-full border border-white/15 bg-black/40 text-white hover:bg-white/20 transition-colors backdrop-blur-md"
                aria-label="Foto anterior"
              >
                <ChevronLeft size={20} />
              </button>
            )}

            {/* Media (Image or Video) */}
            <div className={`relative z-[1] max-h-[calc(100vh-13rem)] max-w-[92vw] flex items-center justify-center ${isLightboxVideo ? 'pointer-events-auto' : 'pointer-events-none'}`}>
              {isLightboxVideo ? (
                <video
                  src={activeLightboxPhoto.src}
                  controls
                  autoPlay
                  className="max-h-[calc(100vh-13rem)] max-w-[92vw] w-auto h-auto rounded-lg shadow-2xl bg-black"
                />
              ) : (
                <img
                  src={activeLightboxPhoto.src}
                  alt={activeLightboxPhoto.alt || activeLightboxPhoto.title || ''}
                  className="max-h-[calc(100vh-13rem)] max-w-[92vw] w-auto h-auto object-contain rounded-lg shadow-2xl"
                />
              )}
            </div>

            {/* Next */}
            {lightbox.items.length > 1 && (
              <button
                type="button"
                onClick={nextPhoto}
                className="absolute right-3 lg:right-6 z-[1] inline-flex h-11 w-11 items-center justify-center rounded-full border border-white/15 bg-black/40 text-white hover:bg-white/20 transition-colors backdrop-blur-md"
                aria-label="Foto siguiente"
              >
                <ChevronRight size={20} />
              </button>
            )}
          </div>

          {/* Bottom panel */}
          <div className="relative z-[2] bg-gradient-to-t from-black/80 to-transparent">
            {/* Photo info */}
            <div className="flex items-end justify-between gap-4 px-5 py-3">
              <div className="min-w-0">
                {activeLightboxPhoto.title && (
                  <p className="font-alternate text-[0.82rem] font-bold uppercase leading-tight text-white truncate">
                    {activeLightboxPhoto.title}
                  </p>
                )}
                {activeLightboxPhoto.description && (
                  <p className="mt-0.5 font-nunito text-[0.65rem] text-white/55 leading-relaxed line-clamp-1">
                    {activeLightboxPhoto.description}
                  </p>
                )}
              </div>
            </div>

            {/* Thumbnails strip */}
            {lightbox.items.length > 1 && (
              <div
                ref={thumbnailStripRef}
                className="flex items-center gap-2 overflow-x-auto px-5 pb-4 pt-1 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
              >
                {lightbox.items.map((photo, idx) => (
                  <PhotoThumbnail
                    key={`thumb-${photo.id || idx}`}
                    photo={photo}
                    index={idx}
                    onClick={(i) => setLightbox((s) => ({ ...s, index: i }))}
                    isActive={idx === lightbox.index}
                  />
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

// ─── SobreElPnmcPage (preserved as-is) ───────────────────────────────────────

const SobreElPnmcPage = ({ onBack, onNavigate }) => { 
  const [activeStage, setActiveStage] = useState(4); 
  const [activeNormativeStage, setActiveNormativeStage] = useState(4);
  const workTeam = [
    { role: 'Coordinación Grupo de Música', name: 'Jorge Enrique Sossa Santos', email: 'jsossa@mincultura.gov.co' },
    { role: 'Apoyo a la coordinación', name: 'Dora Carolina Rojas Rivera', email: 'drojas@mincultura.gov.co' },
    { role: 'Líder Componente: Formación', name: 'Diego Rodríguez', email: 'drodriguezc@mincultura.gov.co' },
    { role: 'Líder Componente: Investigación', name: 'Raúl Hernán Daza', email: 'rdaza@mincultura.gov.co' },
    { role: 'Líder Componente: Circulación', name: 'Carolina Ruiz Barragán', email: 'druizb@mincultura.gov.co' },
    { role: 'Líder Componente: Dotación', name: 'Guadalupe Gil', email: 'ggil@mincultura.gov.co' },
    { role: 'Líder Componente: Creación', name: 'Isabel Durán', email: 'iduranp@mincultura.gov.co' },
    { role: 'Líder Componente: Gobernanza', name: '', email: '' },
    { role: 'Líder Componente: Información', name: 'Yazmín López', email: 'ylopez@mincultura.gov.co' },
    { role: 'Líder Componente: Comunicación', name: 'Shirley Giomar Gómez', email: 'sgomezc@mincultura.gov.co' },
  ];

  const navigateToSection = (page, sectionId) => {
    onNavigate(page);
    setTimeout(() => {
      const el = document.getElementById(sectionId);
      scrollToElementWithOffset(el);
    }, 150);
  };

  const timelineEvents = [ 
    { id: 0, year: '2003-2006', title: 'Creación e Institucionalización', desc: 'La aprobación del CONPES 3409 de 2006 formalizó el PNMC y consolidó las Escuelas Municipales de Música (EMM) como espacios centrales para la formación musical colectiva. Este periodo estableció los cimientos del programa: acceso, democratización, convivencia y fortalecimiento de las músicas locales. Se amplió la dotación instrumental, se fortalecieron los equipos territoriales y se empezó a articular una red nacional de formación basada en la práctica comunitaria.', img: RANDOM_GALLERY_IMAGES[11] }, 
    { id: 1, year: '2007-2014', title: 'Territorialización y saberes', desc: 'Durante esta etapa se profundizó en la institucionalización territorial, con énfasis en la formación de formadores, la cualificación de músicos en ejercicio y el impulso a las músicas tradicionales. Se promovió la descentralización, se consolidaron procesos comunitarios sostenidos y se promovió el reconocimiento de músicos empíricos y sabedores. Este periodo marcó un avance significativo en la diversidad musical, al visibilizar prácticas propias de cada región y promover su circulación.', img: RANDOM_GALLERY_IMAGES[12] }, 
    { id: 2, year: '2015-2018', title: 'Profesionalización y SIMUS', desc: 'En estos años se desarrollaron las líneas estratégicas de Musicalización de la Ciudadanía y Estructuración del Campo Profesional de la Música, orientadas a fortalecer la formación integral y la profesionalización del sector. Se creó el Sistema de Información de la Música (SIMUS), herramienta clave para la toma de decisiones y la caracterización del ecosistema musical. Además, se implementaron nuevas estrategias de circulación y se amplió la presencia del PNMC en festivales, mercados y espacios de movilidad artística.', img: RANDOM_GALLERY_IMAGES[13] }, 
    { id: 3, year: '2018-2022', title: 'Evaluación y Consolidación', desc: 'El Departamento Nacional de Planeación (DNP) realizó una evaluación integral del PNMC, destacando su impacto en la formación musical, el fortalecimiento del tejido social y la dignificación del trabajo artístico. A partir de esta evaluación se identificaron retos y oportunidades, como mejorar la articulación interinstitucional, fortalecer SIMUS, ampliar la presencia del PNMC en educación superior, incentivar economías creativas en los territorios y mejorar las condiciones laborales de los músicos y formadores.', img: RANDOM_GALLERY_IMAGES[14] }, 
    { id: 4, year: '2023-2025', title: 'Actualización y Proyección 2035', desc: 'En un ejercicio nacional sin precedentes, el Ministerio de las Culturas abrió espacios de participación a través de 34 Encuentros Territoriales, mesas sectoriales, la Mesa Nacional Vinculante y el VII Congreso Nacional de Música. Estas iniciativas permitieron recoger las necesidades, visiones y apuestas del sector musical en todo el país y dieron origen al PNMC 2025-2035, "Huellas y apuestas de la diversidad sonora". Este nuevo Plan articula la música con la vida, el diálogo intercultural, la bioculturalidad, la equidad, la sostenibilidad y la gobernanza participativa, proyectando un ecosistema musical diverso, justo y sostenible para la próxima década.', img: RANDOM_GALLERY_IMAGES[15] } 
  ]; 

  const normativeStages = [
    {
      id: 0,
      year: '1997',
      title: 'Ley 397 de 1997',
      desc: 'La Ley General de Cultura establece los principios, objetivos y mecanismos para proteger, fomentar y difundir la cultura en Colombia. Reconoce la diversidad cultural como fundamento de la identidad nacional y define la cultura como derecho. En su estructura se incluyen disposiciones para el fomento de las artes, la formación artística y la protección del patrimonio cultural, elementos esenciales para el desarrollo del PNMC. Actualizada por la Ley 1185 de 2008.',
      img: RANDOM_GALLERY_IMAGES[16],
    },
    {
      id: 1,
      year: '2006',
      title: 'CONPES 3409 de 2006',
      desc: 'Este documento aprobó la política del Plan Nacional de Música para la Convivencia, institucionalizando las Escuelas Municipales de Música y definiendo estrategias para mejorar la formación musical, la dotación instrumental y la gestión cultural en los territorios. Fue la base técnica y financiera que permitió consolidar el PNMC como política pública estable.',
      img: RANDOM_GALLERY_IMAGES[17],
    },
    {
      id: 2,
      year: '2011',
      title: 'Ley 1493 de 2011',
      desc: 'La Ley de Espectáculos Públicos regula la organización de espectáculos públicos de las artes escénicas y promueve la circulación artística en condiciones más equitativas. Aunque su alcance es más amplio que la música, ha tenido un impacto directo en la infraestructura cultural y en la movilidad de artistas y agrupaciones musicales en el país, facilitando escenarios más dignos y accesibles.',
      img: RANDOM_GALLERY_IMAGES[18],
    },
    {
      id: 3,
      year: '2018',
      title: 'Decreto 2120 de 2018',
      desc: 'Este decreto reglamenta la organización, funcionamiento y articulación de los subsistemas que integran el Sistema Nacional de Cultura. Para el PNMC es clave porque define los espacios de participación ciudadana, la gobernanza territorial y las responsabilidades institucionales en procesos formativos y comunitarios, incluyendo los vinculados a las músicas del país.',
      img: RANDOM_GALLERY_IMAGES[0],
    },
    {
      id: 4,
      year: '2024-2038',
      title: 'Plan Nacional de Cultura',
      desc: 'El nuevo PNC establece la visión cultural del país para los próximos 14 años. Define la cultura como eje del cuidado de la vida, la diversidad y la paz, y orienta las políticas del Ministerio de las Culturas, las Artes y los Saberes. El PNMC 2025-2035 se enmarca plenamente en esta estrategia, en sus componentes institucional y subsectorial, articulando lineamientos de diversidad sonora, ecosistemas culturales, gobernanza y sostenibilidad.',
      img: RANDOM_GALLERY_IMAGES[1],
    },
    {
      id: 6,
      year: '2025',
      title: 'Ley 2555 de 2025',
      desc: 'La Ley Artes al Aula convierte la educación artística en un mandato para todas las instituciones educativas oficiales del país. Reconoce las artes, incluida la música, como un derecho cultural fundamental y exige su incorporación transversal en los procesos pedagógicos, fortaleciendo competencias creativas, socioemocionales y ciudadanas. Impulsa la formación docente en pedagogías artísticas, promueve la articulación entre escuela, comunidad y territorio, y orienta la implementación desde el SINEFAC, facilitando la coordinación entre los sectores de educación y cultura.',
      img: RANDOM_GALLERY_IMAGES[3],
    },
  ];

  return ( 
    <div className="bg-white min-h-screen text-left"> 
      <PageHero 
        tag="Sobre el PNMC" 
        title="Sobre el" 
        titleAccent="PNMC" 
        description="Reconocemos la música como una expresión transformadora para el cuidado de la vida." 
        bgImage="https://images.unsplash.com/photo-1774558396280-c14b21198674?q=80&w=1470&auto=format&fit=crop" 
        onBack={onBack} 
      /> 
      
      <ContentWrapper className="bg-slate-50/50" id="pnmc-presentacion"> 
	        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-14 items-start">
	          <div className="lg:col-span-7 space-y-8">
	            <SectionHeader backgroundText="POLÍTICA" foregroundText="Presentación" verticalContext="CARTA" compact />
	            <div className="max-w-3xl space-y-5 text-base lg:text-[1.05rem] text-slate-700 leading-relaxed font-nunito">
	              <div className="space-y-5">
	                <p>La música nos conecta y nos permite expresar quiénes somos. En Colombia, nuestra diversidad sonora fortalece los vínculos comunitarios y refleja la riqueza cultural de cada región. Desde hace 20 años, el <strong>Plan Nacional de Música para la Convivencia (PNMC)</strong> protege y proyecta nuestra pluralidad musical.</p>
	                <p>Entendemos la música como un derecho cultural y una herramienta fundamental para la equidad y la construcción de paz. Nuestra nueva hoja de ruta, <strong>"Huellas y apuestas de la diversidad sonora"</strong>, nace de un proceso participativo sin precedentes en todo el país. Es una política renovada, inclusiva y descentralizada para los retos del futuro.</p>
	              </div>
	            </div>
	          </div>
	          <div className="lg:col-span-5 flex items-start justify-center">
	            <div className="w-full max-w-md rounded-[3rem] bg-[#f9f8fa] p-10 lg:p-12 text-left relative overflow-hidden border border-[#291242]/5 group hover:border-[#00DA5E]/30 hover:shadow-lg transition-all duration-500">
	              {/* Marca de agua de comillas */}
	              <div className="absolute -top-6 -left-2 text-[12rem] font-gregor leading-none text-[#291242]/[0.03] select-none pointer-events-none">
	                "
	              </div>
	              
	              <div className="relative z-10 flex flex-col h-full justify-between space-y-8">
	                <div className="flex flex-col space-y-6">
	                  <span className="inline-flex w-fit items-center rounded-full bg-[#291242] px-4 py-1.5 text-[0.55rem] font-bold uppercase tracking-[0.25em] text-white font-alternate shadow-sm">
	                    Apuesta Base
	                  </span>
	                  
	                  <p className="font-nunito text-[1.15rem] lg:text-[1.25rem] text-[#291242] font-semibold leading-relaxed italic relative z-10">
	                    Consolidar la equidad de condiciones y oportunidades en el campo musical, promoviendo la participación y el ejercicio pleno de los derechos culturales.
	                  </p>
	                </div>
	                
	                <div className="flex items-center justify-between border-t border-slate-200/60 pt-6">
	                  <div>
	                    <h3 className="font-alternate text-sm font-bold uppercase tracking-[0.2em] text-[#00DA5E]">Objetivo General</h3>
	                    <span className="text-slate-400 text-[0.65rem] uppercase tracking-widest font-alternate mt-1.5 block font-semibold">Plan Nacional de Música</span>
	                  </div>
	                </div>
	              </div>
	            </div>
	          </div>
	          <div className="lg:col-span-12 lg:-mt-4">
	            <div className="rounded-[2.2rem] border border-slate-100 bg-white shadow-sm w-full overflow-hidden">
	              <div className="px-8 py-4 lg:px-10 lg:py-5 border-b border-slate-100">
	                <span className="inline-flex w-fit items-center rounded-full bg-[#291242] px-4 py-1.5 font-alternate text-[0.55rem] font-bold uppercase tracking-[0.24em] text-white">
	                  Construcción Colectiva
	                </span>
	              </div>
	              <div className="relative overflow-hidden bg-[linear-gradient(180deg,rgba(0,218,94,0.06),rgba(255,255,255,0)_72%)] px-8 py-8 lg:px-10 lg:py-10">
	                <div className="absolute left-0 top-0 h-full w-1.5 bg-[#00DA5E]"></div>
	                <div className="flex gap-4 lg:gap-6">
	                  <span className="font-alternate text-[3rem] leading-[0.75] text-[#00DA5E]/45">"</span>
	                  <p className="font-nunito text-[1.02rem] lg:text-[1.18rem] leading-relaxed text-[#291242] max-w-4xl">
	                    El PNMC 2025–2035, Huellas y apuestas de la diversidad sonora, nace de un proceso participativo sin precedentes, recogiendo voces a través de encuentros territoriales en todo el país.
	                  </p>
	                </div>
	              </div>
	            </div>
	          </div>
        </div>
      </ContentWrapper>

      <ContentWrapper id="pnmc-objetivos">
        <SectionHeader backgroundText="ESTRATEGIA" foregroundText="Objetivos de Eje" verticalContext="EJES" />
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {[
            { id: "MÚSICA PARA LA VIDA, EL DIÁLOGO INTERCULTURAL Y LA DIVERSIDAD BIOCULTURAL", icon: Zap, title: "Formación y Cuidado", desc: "Promover procesos de formación y práctica musical que fortalezcan la relación ética, sensible y sostenible entre las personas y sus territorios, como medio para el cuidado biocultural y la paz.", target: 'musica-para-la-vida' },
            { id: "FORTALECIMIENTO DE LAS PRÁCTICAS, EXPRESIONES Y OFICIOS DE LA MÚSICA", icon: Boxes, title: "Desarrollo Integral", desc: "Cualificar procesos de creación, producción y circulación. Fomentar la formalización de oficios y saberes para lograr el reconocimiento profesional y la equidad en todas las regiones.", target: 'oficios-y-practicas' },
            { id: "GOBERNANZA MUSICAL E INTEGRACIÓN CULTURAL E INTERSECTORIAL", icon: Landmark, title: "Gobernanza y Gestión", desc: "Impulsar la legitimidad y articulación de los mecanismos de organización del sector con el Estado, orientada a la sostenibilidad cultural y la dignificación de los oficios musicales.", target: 'gobernanza' }
          ].map((eje, i) => (
            <div key={i} className="group p-10 rounded-[3rem] bg-white border border-slate-100 hover:border-[#8BF784] hover:shadow-2xl transition-all duration-500 relative flex flex-col">
              <div className="w-12 h-12 rounded-2xl bg-slate-50 flex items-center justify-center text-[#291242] group-hover:bg-[#8BF784] transition-all mb-8">
                <eje.icon size={24} />
              </div>
              <span className="text-[0.5rem] font-bold text-slate-300 uppercase tracking-[0.2em] mb-4 block leading-tight border-l border-slate-100 pl-4">{eje.id}</span>
              <h4 className="font-alternate text-2xl text-[#291242] uppercase font-bold mb-4">{eje.title}</h4>
              <p className="text-sm text-slate-500 font-nunito leading-relaxed font-light flex-grow">{eje.desc}</p>
              <div className="mt-8 pt-6 border-t border-slate-50">
                  <button onClick={() => navigateToSection('ejes', eje.target)} className="flex items-center gap-2 text-[0.6rem] font-bold text-[#00DA5E] uppercase tracking-widest hover:gap-4 transition-all">Explorar eje <ArrowRight size={12}/></button>
              </div>
            </div>
          ))}
        </div>
      </ContentWrapper>

      <ContentWrapper className="bg-[#291242] text-white">
        <div className="flex flex-col lg:flex-row gap-12 lg:gap-20 items-center">
          <div className="lg:w-1/3">
            <Tag text="TRANSVERSALIDAD" className="bg-white/10 text-[#00DA5E] mb-6" />
            <h2 className="font-gregor text-5xl font-bold uppercase leading-none tracking-tight mb-6">Enfoques del <br/>Sistema</h2>
            <p className="text-slate-400 font-nunito font-light text-sm leading-relaxed">Consideramos las particularidades sociales y geográficas para garantizar un acceso equitativo a la cultura.</p>
          </div>
          <div className="lg:w-2/3 grid grid-cols-1 md:grid-cols-3 gap-6">
            {[
              { t: "Biocultural", d: "Relación música-entorno natural. Integración de saberes ancestrales y preservación sonora ambiental.", icon: Globe },
              { t: "Poblacional", d: "Equidad para infancia, mujeres, diversidades de género, pueblos étnicos y personas con capacidades diversas.", icon: Users2 },
              { t: "Territorial", d: "Estrategias diferenciadas según geografía, infraestructura local y financiamiento por contextos.", icon: MapIcon }
            ].map((enf, i) => (
              <div key={i} className="bg-[#533075]/70 p-8 rounded-[2.5rem] border border-white/10 hover:bg-[#533075] transition-all shadow-md">
                <enf.icon size={32} className="text-[#8BF784] mb-4" />
                <h4 className="font-alternate text-lg font-bold uppercase mb-2 text-white">{enf.t}</h4>
                <p className="text-[0.7rem] text-white/95 font-nunito leading-relaxed">{enf.d}</p>
              </div>
            ))}
          </div>
        </div>
      </ContentWrapper>

      <ContentWrapper id="pnmc-actores">
        <SectionHeader backgroundText="ECOSISTEMA" foregroundText="Actores del Plan" verticalContext="AGENTES" compact />
        <div className="rounded-[3rem] border border-slate-100 bg-white overflow-hidden shadow-sm">
          <div className="grid grid-cols-1 xl:grid-cols-[0.9fr_2.1fr]">
            <div className="bg-slate-50/70 p-8 md:p-10 border-b xl:border-b-0 xl:border-r border-slate-100">
              <div className="sticky top-28 space-y-5">
                <span className="inline-flex items-center rounded-full bg-[#291242] px-4 py-2 font-alternate text-[0.58rem] font-bold uppercase tracking-[0.28em] text-[#8BF784]">
                  Ecosistema humano
                </span>
                <h3 className="font-gregor text-4xl lg:text-5xl text-[#291242] font-bold uppercase leading-[1.1] text-balance tracking-tight">
                  Tres capas de articulación
                </h3>
                <p className="font-nunito text-sm text-slate-500 leading-relaxed">
                  El plan conecta sector musical, institucionalidad y sociedad civil en una misma arquitectura de colaboración para la formación, circulación, sostenibilidad y gobernanza de la música.
                </p>
              </div>
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-3">
              {[
                { title: "Agentes Sectoriales", list: ["Creadores y compositores", "Intérpretes y agrupaciones", "Docentes y formadores", "Investigadores", "Productores y técnicos", "Gestores y promotores", "Constructores de instrumentos"], icon: Music2 },
                { title: "Agentes Institucionales", list: ["Gobiernos locales", "Escuelas de Música", "Casas de la Cultura", "Ministerios nacionales", "Aliados del Estado", "Cooperación Ibermúsicas"], icon: Building2 },
                { title: "Sociedad Civil", list: ["Asociaciones de músicos", "Organizaciones sin ánimo de lucro", "Asociaciones de padres", "Cabildos indígenas", "Consejos afrodescendientes"], icon: Users }
              ].map((act, i) => (
                <div key={i} className={`group p-8 md:p-10 transition-all duration-500 ${i < 2 ? 'border-b lg:border-b-0 lg:border-r border-slate-100' : ''}`}>
                  <div className="flex items-center gap-4 mb-8">
                    <div className="w-14 h-14 rounded-[1.3rem] bg-slate-50 border border-slate-100 flex items-center justify-center text-[#291242] group-hover:bg-[#8BF784] transition-colors duration-500">
                      <act.icon size={26} strokeWidth={1.5} />
                    </div>
                    <div>
                      <h4 className="font-alternate text-lg text-[#291242] font-bold uppercase leading-tight">{act.title}</h4>
                      <div className="w-10 h-1 bg-[#8BF784] rounded-full mt-3 opacity-50"></div>
                    </div>
                  </div>
                  <ul className="relative flex flex-col before:absolute before:left-[11px] before:top-2 before:bottom-2 before:w-[2px] before:bg-gradient-to-b before:from-transparent before:via-slate-200/70 before:to-transparent space-y-2">
                    {act.list.map((li, idx) => (
                      <li
                        key={idx}
                        className="relative flex items-center gap-4 text-[0.75rem] font-bold text-slate-500 py-1.5 px-1 hover:text-[#291242] transition-all cursor-pointer group"
                      >
                        <div className="relative w-6 h-6 flex items-center justify-center shrink-0">
                           {/* Nodo hueco por defecto, se llena y brilla en hover */}
                           <div className="absolute w-2 h-2 rounded-full border-[1.5px] border-slate-300 bg-white group-hover:border-[#00DA5E] group-hover:bg-[#00DA5E] transition-colors duration-300 z-10" />
                           {/* Halo de luz sutil en hover */}
                           <div className="absolute inset-0 rounded-full bg-[#00DA5E]/15 scale-0 group-hover:scale-100 transition-transform duration-500 ease-out z-0" />
                        </div>
                        <span className="flex-1 group-hover:translate-x-1.5 transition-transform duration-300 ease-out">{li}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </div>
        </div>
      </ContentWrapper>

      <ContentWrapper className="bg-slate-50/50" id="pnmc-hitos">
        <div className="mb-8 lg:mb-12 flex flex-col lg:flex-row lg:items-end lg:justify-between gap-8 lg:gap-14">
          <div className="flex-1 min-w-0 space-y-6">
            <SectionHeader backgroundText="EVOLUCIÓN" foregroundText="Hitos del PNMC" verticalContext="HITOS" />
            <p className="max-w-3xl text-2xl lg:text-3xl text-[#291242] font-bold font-nunito leading-snug tracking-tight">Desde hace más de medio siglo, Colombia ha construido una política musical que reconoce la música como un derecho cultural y puente de convivencia.</p>
          </div>
          <div className="lg:w-[28rem] flex-shrink-0">
            <p className="text-left text-[0.95rem] lg:text-base text-slate-500 font-nunito leading-relaxed border-l-2 border-[#00DA5E]/30 pl-5 py-1">El PNMC, creado en 2003, es el resultado de una trayectoria que inició con Colcultura en 1968, garantizando hoy que todas las personas puedan vivir plenamente la música como experiencia y bien común.</p>
          </div>
        </div>
        <div className="space-y-8 mb-20">
          <div className="flex flex-col lg:flex-row h-auto lg:h-[400px] gap-2.5 w-full"> 
            {timelineEvents.map((stage) => ( 
              <div key={stage.id} onClick={() => setActiveStage(stage.id)} className={`relative overflow-hidden transition-all duration-700 cursor-pointer group rounded-[1.5rem] border min-h-[150px] lg:min-h-0 ${activeStage === stage.id ? 'flex-[6] bg-slate-900 shadow-xl border-transparent' : 'flex-1 bg-white border-[#E6DAE5] hover:border-[#00DA5E]/50 hover:bg-[#00DA5E]/5 hover:shadow-sm'}`}> 
                <div className={`absolute inset-0 transition-all duration-1000 ${activeStage === stage.id ? 'opacity-[0.22]' : 'opacity-10 group-hover:opacity-25'}`}>
                  <img src={stage.img} className="w-full h-full object-cover grayscale-[40%] brightness-95" alt="" />
                  <div className={`absolute inset-0 bg-[#291242]/30 transition-opacity duration-1000 ${activeStage === stage.id ? 'opacity-0' : 'opacity-100'}`} />
                </div> 
                <div className={`absolute inset-0 p-6 flex flex-col justify-end transition-all duration-700 ${activeStage === stage.id ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-6 pointer-events-none'}`}> 
                  <span className="text-[#8BF784] font-alternate text-sm font-bold mb-1 tracking-widest">{stage.year}</span> 
                  <h3 className="font-alternate text-2xl lg:text-3xl font-extrabold text-white uppercase leading-none mb-3 drop-shadow-md">{stage.title}</h3> 
                  <p className="font-nunito text-[0.85rem] text-slate-300 font-light max-w-xl leading-relaxed">{stage.desc}</p> 
                </div> 
                <div className={`absolute inset-0 flex items-center justify-center transition-opacity duration-500 ${activeStage === stage.id ? 'opacity-0' : 'opacity-100'}`}>
                  <div className="rotate-[-90deg] flex items-center justify-center w-full translate-x-8 lg:translate-x-10 opacity-40">
                    <span className="font-gregor text-6xl lg:text-[6rem] font-bold uppercase tracking-tighter text-[#00DA5E]">
                      {stage.year.split('-')[0]}
                    </span>
                  </div>
                </div> 
              </div> 
            ))} 
          </div>
        </div> 
      </ContentWrapper> 

      <ContentWrapper id="pnmc-marco">
        <div className="mb-8 lg:mb-12 flex flex-col lg:flex-row lg:items-end lg:justify-between gap-8 lg:gap-14">
          <div className="flex-1 min-w-0 space-y-6">
            <SectionHeader backgroundText="MARCO" foregroundText="Marco Normativo" verticalContext="BASE LEGAL" />
            <p className="max-w-3xl text-2xl lg:text-3xl text-[#291242] font-bold font-nunito leading-snug tracking-tight">El PNMC se sustenta en una trayectoria normativa que ha consolidado la cultura y la música como derechos, políticas públicas y herramientas de transformación territorial.</p>
          </div>
          <div className="lg:w-[28rem] flex-shrink-0">
            <p className="text-left text-[0.95rem] lg:text-base text-slate-500 font-nunito leading-relaxed border-l-2 border-[#00DA5E]/30 pl-5 py-1">Este marco articula leyes, decretos, documentos de política y planes nacionales que orientan la formación, la circulación, la participación y la gobernanza cultural en Colombia.</p>
          </div>
        </div>
        <div className="flex flex-col lg:flex-row h-auto lg:h-[400px] gap-2.5 w-full mt-6">
          {normativeStages.map((stage) => (
            <div key={stage.id} onClick={() => setActiveNormativeStage(stage.id)} className={`relative overflow-hidden transition-all duration-700 cursor-pointer group rounded-[1.5rem] border min-h-[150px] lg:min-h-0 ${activeNormativeStage === stage.id ? 'flex-[6] bg-slate-900 shadow-xl border-transparent' : 'flex-1 bg-white border-[#E6DAE5] hover:border-[#00DA5E]/50 hover:bg-[#00DA5E]/5 hover:shadow-sm'}`}>
              <div className={`absolute inset-0 transition-all duration-1000 ${activeNormativeStage === stage.id ? 'opacity-[0.22]' : 'opacity-10 group-hover:opacity-25'}`}>
                <img src={stage.img} className="w-full h-full object-cover grayscale-[40%] brightness-95" alt="" />
                <div className={`absolute inset-0 bg-[#291242]/30 transition-opacity duration-1000 ${activeNormativeStage === stage.id ? 'opacity-0' : 'opacity-100'}`} />
              </div>
              <div className={`absolute inset-0 p-6 flex flex-col justify-end transition-all duration-700 ${activeNormativeStage === stage.id ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-6 pointer-events-none'}`}>
                <span className="text-[#8BF784] font-alternate text-sm font-bold mb-1 tracking-widest">{stage.year}</span>
                <h3 className="font-alternate text-2xl lg:text-3xl font-extrabold text-white uppercase leading-none mb-3 drop-shadow-md">{stage.title}</h3>
                <p className="font-nunito text-[0.85rem] text-slate-300 font-light max-w-xl leading-relaxed">{stage.desc}</p>
              </div>
              <div className={`absolute inset-0 flex items-center justify-center transition-opacity duration-500 ${activeNormativeStage === stage.id ? 'opacity-0' : 'opacity-100'}`}>
                <div className="rotate-[-90deg] flex items-center justify-center w-full translate-x-8 lg:translate-x-10 opacity-40">
                  <span className="font-gregor text-5xl lg:text-[5.5rem] font-bold uppercase tracking-tighter text-[#00DA5E]">
                    {stage.year.split('-')[0]}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </ContentWrapper>

      <ContentWrapper className="bg-slate-50/50" id="pnmc-equipo">
        <div className="mb-8 lg:mb-12 flex flex-col lg:flex-row lg:items-end lg:justify-between gap-8 lg:gap-14">
          <div className="flex-1 min-w-0 space-y-6">
            <SectionHeader backgroundText="EQUIPO" foregroundText="Equipo de Trabajo" verticalContext="CONTACTO" />
            <p className="max-w-3xl text-2xl lg:text-3xl text-[#291242] font-bold font-nunito leading-snug tracking-tight">El PNMC se construye y acompaña desde un equipo técnico que articula componentes, seguimiento institucional y trabajo con los territorios.</p>
          </div>
          <div className="lg:w-[28rem] flex-shrink-0">
            <p className="text-left text-[0.95rem] lg:text-base text-slate-500 font-nunito leading-relaxed border-l-2 border-[#00DA5E]/30 pl-5 py-1">Aquí puedes identificar los referentes del plan por coordinación y componente, con sus canales de contacto institucional.</p>
          </div>
        </div>
        <div className="rounded-[2.8rem] border border-slate-100 bg-white shadow-sm overflow-hidden">
          <div className="grid grid-cols-1 xl:grid-cols-[0.7fr_1.7fr] items-stretch overflow-hidden">
            <div className="bg-[#291242] text-white border-b xl:border-b-0 xl:border-r border-white/10 flex flex-col">
              <div className="h-full px-8 md:px-10 lg:pl-12 lg:pr-8 flex flex-col">
                <div className="py-6 border-b border-white/10">
                  <span className="font-alternate text-[0.62rem] font-bold uppercase tracking-[0.28em] text-[#8BF784]">
                    Coordinación General
                  </span>
                </div>
                <div className="divide-y divide-white/10 flex-1 flex flex-col justify-center">
                  {workTeam.slice(0, 2).map((member) => (
                    <div key={member.role} className="py-7 md:py-8">
                      <div className="flex items-start gap-5">
                        <div className="w-20 h-24 rounded-[1.5rem] border border-white/10 bg-white/5 flex items-center justify-center text-white/40 shrink-0 overflow-hidden">
                          <UserCircle2 size={30} strokeWidth={1.5} />
                        </div>
                        <div className="min-w-0">
                          <span className="block text-[0.54rem] font-bold uppercase tracking-[0.22em] text-white/45 font-alternate mb-3">
                            {member.role}
                          </span>
                          <h4 className="font-gregor text-[1.9rem] md:text-[2.35rem] text-white uppercase leading-none tracking-tight mb-4">
                            {member.name}
                          </h4>
                          <div className="flex items-start gap-3 text-sm text-slate-200 font-nunito">
                            <MessageCircle size={16} className="text-[#00DA5E] mt-0.5 shrink-0" />
                            <span>{member.email}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="bg-white">
              <div className="h-full px-8 md:px-10 lg:px-12">
                <div className="py-6 border-b border-slate-100 bg-white">
                  <span className="font-alternate text-[0.62rem] font-bold uppercase tracking-[0.28em] text-[#291242]">
                    Liderazgos por componente
                  </span>
                </div>
                <div className="grid grid-cols-1 xl:grid-cols-2 gap-4 xl:gap-5 py-6 xl:py-8">
                  {workTeam.slice(2).map((member) => (
                    <div key={member.role} className="group rounded-[1.5rem] border border-slate-100 bg-slate-50/50 p-5 transition-all hover:-translate-y-1 hover:border-[#00DA5E]/30 hover:bg-white hover:shadow-md">
                      <div className="flex flex-row items-center gap-5">
                        <div className="w-[4.5rem] h-[4.5rem] shrink-0 rounded-2xl border border-slate-200/60 bg-white flex items-center justify-center text-slate-300 shadow-sm transition-transform group-hover:scale-105">
                          <UserCircle2 size={28} strokeWidth={1.5} className="group-hover:text-[#00DA5E] transition-colors" />
                        </div>
                        <div className="min-w-0 flex-1 flex flex-col justify-center space-y-1">
                          <h4 className="font-alternate text-[0.9rem] text-[#291242] font-bold uppercase leading-tight group-hover:text-[#00DA5E] transition-colors">
                            {member.name || 'Por definir'}
                          </h4>
                          <p className="font-nunito text-[0.8rem] text-slate-500 leading-snug">
                            {member.role.replace('Líder Componente: ', '')}
                          </p>
                          <p className="font-nunito text-[0.75rem] font-light text-slate-400 mt-1 truncate">
                            {member.email || 'Correo pendiente'}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </ContentWrapper>
    </div> 
  ); 
}; 


export { GaleriaPage, SobreElPnmcPage };
