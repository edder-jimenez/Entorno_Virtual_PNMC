import React, { useCallback, useState, useEffect, useMemo, useRef } from 'react'; 
import { Navigate, Route, Routes, useParams } from 'react-router-dom';
import {  
  Menu, X, Search, Globe, Accessibility, ArrowRight,  
  BookOpen, ArrowUpRight, ChevronRight, History, CalendarDays, 
  Map as MapIcon, Music2, Users2, Building2, ExternalLink, Library, LayoutGrid, Share2, 
  Mic2, Radio, Disc, Scale, Award, Gavel, ArrowLeft, ShieldCheck, Landmark, 
  Target, FileText, CheckCircle2, UserCircle2, FileCode, Users, Play, ChevronDown, ChevronUp, Heart, Plus, Filter, Headphones, MonitorPlay, FileType, Calendar, User, Hash, XCircle, ChevronLeft, ArrowUp, Star, MapPin,
MessageCircle, Send, Clock, Info, PartyPopper, MousePointer2, BarChart3, PieChart, Activity, Download, Database, Map as MapWide,
Grid3X3, List, Eye, Bookmark, SortAsc, DownloadCloud, FileAudio, FileVideo, File, Loader2, AlertCircle, Quote, Sparkles, Compass, Lightbulb, Zap, Boxes, Calendar as CalendarIcon, Type
} from 'lucide-react'; 
import L from 'leaflet';
import { MapContainer, GeoJSON, Marker, TileLayer } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import {
  MAP_PARTICIPATION_WORKBOOK_FILE_NAME,
  persistMapParticipationWorkbook,
} from '../lib/mapParticipationWorkbookClient.js';
import {
  fetchColombiaGeoJson,
  fetchDivipolaGrouped,
  fetchFestivalRecords,
  fetchMarketRecords,
  fetchSchoolRecords,
} from '../services/data/index.js';
import {
  HOME_HERO_IMAGES,
  MEDIA_LIBRARY,
  buildAgendaItemFromRecord,
  buildNewsItemFromRecord,
} from '../features/content/domain/mediaLibrary.js';
import {
  ARCHIPELAGO_NORMALIZED_NAME,
  DEPARTMENT_HIT_AREA_STYLE,
  EMPTY_DEPARTMENT_SUMMARY,
  FESTIVAL_COUNTS_CACHE_KEY,
  MAP_LAYER_CHOROPLETH_STEPS,
  MARKET_COUNTS_CACHE_KEY,
  MARKET_PUBLICATION_POLICY,
  METRIC_FORMATTER,
  SCHOOL_COUNTS_CACHE_KEY,
  SCHOOL_PUBLICATION_POLICY,
  buildDepartmentPopupMarkup,
  buildDepartmentSummaryMap,
  buildFestivalCounts,
  buildLayerAnalytics,
  buildMarketCounts,
  buildMarketTotals,
  buildPublicMarketRecord,
  buildPublicSchoolRecord,
  buildScaledFeature,
  buildSchoolCounts,
  buildSchoolCapacityTotals,
  buildSearchIndexValue,
  compareTechnicalValues,
  countDistinctValues,
  formatDataCellValue,
  formatMetricValue,
  getBaseDepartmentCounts,
  getChoroplethStyles,
  getDepartmentDisplayName,
  getDepartmentSelectionValue,
  getFeatureDepartmentName,
  getFeatureDepartmentNormalizedName,
  getFestivalRecordName,
  getRuntimeDivipolaByDepartment,
  getSortedDepartmentNames,
  municipalityExistsInList,
  normalizeDepartmentCode,
  normalizeDepartmentName,
  normalizeMunicipalityCode,
  resolveDepartmentNameFromRecord,
  scrollToElementWithOffset,
  setRuntimeDepartmentCatalog,
  setRuntimeDivipolaByDepartment,
  sumNumericValues,
} from '../features/map/domain/mapDomain.js';
import {
  MapTrackpadGestureHandler,
  MapViewportResetter,
  MapZoomControls,
  MapZoomLimiter,
} from '../features/map/components/MapInteractionControls.jsx';
import {
  ECOSYSTEM_LAYERS,
  WORLD_COUNTRY_LABELS,
  countryLabelIcon,
} from '../features/map/domain/mapLayers.js';
import {
  MAP_PARTICIPATION_ACTOR_OPTIONS,
  MAP_PARTICIPATION_DRAFT_STORAGE_KEY,
  MAP_PARTICIPATION_FIELDSETS,
  MAP_PARTICIPATION_IDENTITY_COPY,
  MAP_PARTICIPATION_IDENTIFICATION_TYPE_OPTIONS,
  MAP_PARTICIPATION_MARKET_CURRENT_YEAR_OPTIONS,
  MAP_PARTICIPATION_MONTH_OPTIONS,
  MAP_PARTICIPATION_QUEUE_STORAGE_KEY,
  MAP_PARTICIPATION_ROLE_OPTIONS,
  MAP_PARTICIPATION_SCOPE_OPTIONS,
  buildMapParticipationReference,
  createMapParticipationFormState,
  getMapParticipationFieldErrorMessage,
  getMapParticipationMunicipalities,
  hasMapParticipationValue,
} from '../features/participation/domain/participationFormConfig.js';
import {
  GALLERY_WALL_FADE_IN_MS,
  GALLERY_WALL_FADE_OUT_MS,
  GALLERY_WALL_LAYOUT_PATTERNS,
  GALLERY_WALL_SLOT_COUNT,
  GALLERY_WALL_SWAP_INTERVAL_MS,
  buildGalleryDownloadName,
} from '../features/gallery/domain/galleryWall.js';
import { AgendaPage } from '../features/agenda/pages/AgendaPage.jsx';
import { EditorialPage } from '../features/editorial/pages/EditorialPage.jsx';
import { NoticiasPage } from '../features/news/pages/NoticiasPage.jsx';
import {
  ContentWrapper,
  PageHero,
  SectionHeader,
  Tag,
} from '../features/shared/components/PagePrimitives.jsx';
import { useAppNavigation } from '../hooks/useAppNavigation.js';
import { useAgenda, useGalleryAlbums, useMapData, useNews } from '../hooks/data/index.js';
import { Button, EmptyState, ErrorState, LoadingState } from '../components/ui/index.js';
import { AppFooter } from '../components/layout/AppFooter.jsx';
import { AppNavigation } from '../components/layout/AppNavigation.jsx';
import { NAVIGATION_LINKS, PAGE_IDS, PAGE_PATHS, toComponentPageId } from '../services/navigation/routes.js';

const GaleriaPage = ({ onBack }) => {
  const [albumViewState, setAlbumViewState] = useState({
    isOpen: false,
    albumId: null,
  });
  const [wallSlots, setWallSlots] = useState([]);
  const [wallAnimatingIndex, setWallAnimatingIndex] = useState(null);
  const wallSwapTimeoutRef = useRef(null);
  const wallFadeTimeoutRef = useRef(null);
  const wallLastAnimatedIndexRef = useRef(-1);
  const [lightboxState, setLightboxState] = useState({
    items: [],
    index: null,
    contextTitle: '',
  });

  const {
    albums,
    isLoading,
    isError,
    retry,
  } = useGalleryAlbums();

  const sortedAlbums = useMemo(
    () => [...albums].sort((left, right) => left.title.localeCompare(right.title, 'es')),
    [albums],
  );

  const displayedAlbums = useMemo(() => {
    const featured = sortedAlbums.filter((album) => album.featured);
    const regular = sortedAlbums.filter((album) => !album.featured);
    return [...featured, ...regular];
  }, [sortedAlbums]);

  const albumsById = useMemo(
    () => Object.fromEntries(sortedAlbums.map((album) => [album.id, album])),
    [sortedAlbums],
  );

  const featuredAlbums = useMemo(() => {
    const explicitFeatured = sortedAlbums.filter((album) => album.featured);
    return (explicitFeatured.length > 0 ? explicitFeatured : sortedAlbums).slice(0, 3);
  }, [sortedAlbums]);

  const getAlbumCover = useCallback(
    (album) => album?.cover || album?.photos?.[0]?.src || MEDIA_LIBRARY.fieldworkWide,
    [],
  );

  const allPhotos = useMemo(() => {
    return sortedAlbums.flatMap((album) => {
      return (album.photos || []).map((photo, photoIndex) => ({
        ...photo,
        id: photo.id || `${album.id}-photo-${photoIndex + 1}`,
        albumId: album.id,
        albumTitle: album.title,
        albumCover: getAlbumCover(album),
        sectionTitle: photo.sectionTitle || 'General',
      }));
    });
  }, [getAlbumCover, sortedAlbums]);

  const pickRandomPhoto = useCallback((photos, excludedPhotoId = null, excludedPhotoIds = []) => {
    if (!Array.isArray(photos) || photos.length === 0) return null;

    if (photos.length === 1) return photos[0];

    let nextPhoto = photos[Math.floor(Math.random() * photos.length)] || null;
    if (!excludedPhotoId && excludedPhotoIds.length === 0) return nextPhoto;

    let attempts = 0;
    while ((nextPhoto?.id === excludedPhotoId || excludedPhotoIds.includes(nextPhoto?.id)) && attempts < 20) {
      nextPhoto = photos[Math.floor(Math.random() * photos.length)] || null;
      attempts += 1;
    }

    return nextPhoto;
  }, []);

  const heroImage = useMemo(
    () => featuredAlbums[0]?.cover || MEDIA_LIBRARY.fieldworkWide,
    [featuredAlbums]
  );

  const activeAlbumView = useMemo(
    () => (albumViewState.albumId ? albumsById[albumViewState.albumId] || null : null),
    [albumViewState.albumId, albumsById],
  );

  const albumSectionsForDisplay = useMemo(() => {
    if (!activeAlbumView) return [];

    const sections = (activeAlbumView.sections || []).filter((section) => (section.photos || []).length > 0);

    if (sections.length <= 1) {
      const section = sections[0];
      const photos = (section?.photos || activeAlbumView.photos || []).map((photo, photoIndex) => ({
        ...photo,
        id: photo.id || `${activeAlbumView.id}-photo-${photoIndex + 1}`,
        albumId: activeAlbumView.id,
        albumTitle: activeAlbumView.title,
        sectionTitle: photo.sectionTitle || section?.title || 'General',
      }));

      return [{
        id: section?.id || `${activeAlbumView.id}-section-general`,
        title: section?.title || 'General',
        photos,
      }];
    }

    return sections.map((section) => ({
      id: section.id,
      title: section.title,
      photos: (section.photos || []).map((photo, photoIndex) => ({
        ...photo,
        id: photo.id || `${activeAlbumView.id}-${section.id}-${photoIndex + 1}`,
        albumId: activeAlbumView.id,
        albumTitle: activeAlbumView.title,
        sectionTitle: photo.sectionTitle || section.title,
      })),
    }));
  }, [activeAlbumView]);

  const albumHasMultipleSections = albumSectionsForDisplay.length > 1;

  const openAlbumView = useCallback((albumId) => {
    if (!albumId) return;
    setAlbumViewState({
      isOpen: true,
      albumId,
    });
  }, []);

  const closeAlbumView = useCallback(() => {
    setAlbumViewState({
      isOpen: false,
      albumId: null,
    });
  }, []);

  const openLightbox = useCallback((items, index, contextTitle = '') => {
    if (!Array.isArray(items) || !items[index]) return;
    setLightboxState({
      items,
      index,
      contextTitle,
    });
  }, []);

  const closeLightbox = useCallback(() => {
    setLightboxState({
      items: [],
      index: null,
      contextTitle: '',
    });
  }, []);

  const showPreviousPhoto = useCallback(() => {
    setLightboxState((currentState) => {
      if (currentState.index === null || currentState.items.length === 0) return currentState;
      const nextIndex = currentState.index === 0 ? currentState.items.length - 1 : currentState.index - 1;
      return { ...currentState, index: nextIndex };
    });
  }, []);

  const showNextPhoto = useCallback(() => {
    setLightboxState((currentState) => {
      if (currentState.index === null || currentState.items.length === 0) return currentState;
      const nextIndex = currentState.index === currentState.items.length - 1 ? 0 : currentState.index + 1;
      return { ...currentState, index: nextIndex };
    });
  }, []);

  const activeLightboxPhoto = lightboxState.index !== null
    ? lightboxState.items[lightboxState.index] || null
    : null;

  const activeLightboxAlbum = useMemo(
    () => (activeLightboxPhoto?.albumId ? albumsById[activeLightboxPhoto.albumId] || null : null),
    [activeLightboxPhoto?.albumId, albumsById],
  );

  const openActiveLightboxAlbum = () => {
    if (!activeLightboxPhoto?.albumId) return;
    closeLightbox();
    openAlbumView(activeLightboxPhoto.albumId);
  };

  const openLightboxFromWall = useCallback((photo) => {
    if (!photo) return;
    const photoIndex = allPhotos.findIndex((item) => item.id === photo.id);
    openLightbox(allPhotos, photoIndex >= 0 ? photoIndex : 0, 'Vista General');
  }, [allPhotos, openLightbox]);

  useEffect(() => {
    if (allPhotos.length === 0) {
      window.requestAnimationFrame(() => {
        setWallSlots([]);
        setWallAnimatingIndex(null);
      });
      return undefined;
    }

    window.requestAnimationFrame(() => {
      const slotCount = GALLERY_WALL_SLOT_COUNT;
      const remainingPhotos = [...allPhotos];
      const nextSlots = [];

      while (nextSlots.length < slotCount && remainingPhotos.length > 0) {
        const nextIndex = Math.floor(Math.random() * remainingPhotos.length);
        const [nextPhoto] = remainingPhotos.splice(nextIndex, 1);
        if (nextPhoto) nextSlots.push(nextPhoto);
      }

      while (nextSlots.length < slotCount) {
        const fallbackPhoto = pickRandomPhoto(allPhotos);
        if (!fallbackPhoto) break;
        nextSlots.push(fallbackPhoto);
      }

      setWallSlots(nextSlots);
      setWallAnimatingIndex(null);
      wallLastAnimatedIndexRef.current = -1;
    });

    return undefined;
  }, [allPhotos, pickRandomPhoto]);

  useEffect(() => {
    if (allPhotos.length === 0 || wallSlots.length === 0) return undefined;

    const intervalId = window.setInterval(() => {
      let slotIndex = Math.floor(Math.random() * wallSlots.length);
      let attempts = 0;
      while (slotIndex === wallLastAnimatedIndexRef.current && attempts < 10) {
        slotIndex = Math.floor(Math.random() * wallSlots.length);
        attempts += 1;
      }

      wallLastAnimatedIndexRef.current = slotIndex;
      setWallAnimatingIndex(slotIndex);

      if (wallSwapTimeoutRef.current) window.clearTimeout(wallSwapTimeoutRef.current);
      if (wallFadeTimeoutRef.current) window.clearTimeout(wallFadeTimeoutRef.current);

      wallSwapTimeoutRef.current = window.setTimeout(() => {
        setWallSlots((currentSlots) => {
          if (!currentSlots.length) return currentSlots;
          const currentSlotPhoto = currentSlots[slotIndex];
          const occupiedPhotoIds = currentSlots
            .filter((_, currentIndex) => currentIndex !== slotIndex)
            .map((photo) => photo?.id)
            .filter(Boolean);
          const nextPhoto = pickRandomPhoto(allPhotos, currentSlotPhoto?.id || null, occupiedPhotoIds);
          if (!nextPhoto) return currentSlots;

          const nextSlots = [...currentSlots];
          nextSlots[slotIndex] = nextPhoto;
          return nextSlots;
        });

        wallFadeTimeoutRef.current = window.setTimeout(() => {
          setWallAnimatingIndex((currentIndex) => (
            currentIndex === slotIndex ? null : currentIndex
          ));
        }, GALLERY_WALL_FADE_IN_MS);
      }, GALLERY_WALL_FADE_OUT_MS);
    }, GALLERY_WALL_SWAP_INTERVAL_MS);

    return () => {
      window.clearInterval(intervalId);
      if (wallSwapTimeoutRef.current) window.clearTimeout(wallSwapTimeoutRef.current);
      if (wallFadeTimeoutRef.current) window.clearTimeout(wallFadeTimeoutRef.current);
    };
  }, [allPhotos, pickRandomPhoto, wallSlots.length]);

  useEffect(() => {
    if (lightboxState.index === null || lightboxState.items.length === 0) return undefined;

    const handleKeyDown = (event) => {
      if (event.key === 'Escape') {
        closeLightbox();
      } else if (event.key === 'ArrowLeft') {
        showPreviousPhoto();
      } else if (event.key === 'ArrowRight') {
        showNextPhoto();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [closeLightbox, lightboxState.index, lightboxState.items.length, showNextPhoto, showPreviousPhoto]);

  useEffect(() => {
    if (!albumViewState.isOpen || lightboxState.index !== null) return undefined;

    const handleEscape = (event) => {
      if (event.key === 'Escape') closeAlbumView();
    };

    window.addEventListener('keydown', handleEscape);
    return () => window.removeEventListener('keydown', handleEscape);
  }, [albumViewState.isOpen, closeAlbumView, lightboxState.index]);

  useEffect(() => {
    const shouldLockScroll = albumViewState.isOpen || lightboxState.index !== null;
    if (!shouldLockScroll) return undefined;

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [albumViewState.isOpen, lightboxState.index]);

  return (
    <div className="bg-white min-h-screen text-left">
      <PageHero
        tag="Galería"
        title="Archivo"
        titleAccent="Fotográfico"
        description="Una pared viva de imágenes y un índice completo de colecciones para explorar cada proceso visual."
        bgImage={heroImage}
        onBack={onBack}
      />

      <div className="max-w-[100rem] mx-auto px-6 lg:px-8 py-16 space-y-10">
        {isLoading && albums.length === 0 && (
          <LoadingState
            title="Cargando galería..."
            description="Estamos preparando los álbumes y sus imágenes."
          />
        )}

        {isError && albums.length === 0 && (
          <ErrorState
            title="No pudimos cargar la galería"
            description="Intenta de nuevo en unos segundos."
            onRetry={retry}
          />
        )}

        {!isLoading && !isError && albums.length === 0 && (
          <EmptyState
            title="No hay álbumes disponibles"
            description="No encontramos contenido cargado para esta sección."
          />
        )}

        {!isLoading && albums.length > 0 && (
          <>
            <section className="rounded-[2.8rem] border border-slate-100 bg-white overflow-hidden">
              <div className="p-4 lg:p-6">
                <div className="rounded-[1.8rem] border border-slate-100 bg-slate-100 overflow-hidden">
                  {wallSlots.length > 0 ? (
                    <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 auto-rows-[11.2rem] md:auto-rows-[12.8rem] xl:auto-rows-[14rem] gap-0 grid-flow-dense">
                      {wallSlots.map((photo, index) => (
                        <button
                          key={`wall-slot-${index}-${photo.id}`}
                          type="button"
                          onClick={() => openLightboxFromWall(photo)}
                          className={`group relative overflow-hidden rounded-none text-left ${GALLERY_WALL_LAYOUT_PATTERNS[index % GALLERY_WALL_LAYOUT_PATTERNS.length]}`}
                        >
                          <img
                            src={photo.src}
                            alt={photo.alt || photo.title}
                            className={`absolute inset-0 h-full w-full object-cover transition-all duration-[1450ms] ease-in-out ${wallAnimatingIndex === index ? 'opacity-25 scale-[1.04]' : 'opacity-100 scale-100'}`}
                          />
                          <div className="absolute inset-0 bg-gradient-to-t from-[#291242]/68 via-[#291242]/10 to-transparent" />
                          <div className="absolute inset-x-0 bottom-0 p-2.5 flex justify-end">
                            <span className="inline-flex max-w-[72%] truncate items-center rounded-sm border border-white/30 bg-black/35 px-2 py-[3px] text-[0.38rem] font-bold uppercase tracking-[0.12em] text-white/90 backdrop-blur-[1px]">
                              {photo.albumTitle}
                            </span>
                          </div>
                        </button>
                      ))}
                    </div>
                  ) : (
                    <EmptyState
                      title="No hay imágenes para la pared visual"
                      description="Carga álbumes para visualizar la pared viva."
                    />
                  )}
                </div>
              </div>
            </section>

            <section className="rounded-[2.2rem] border border-slate-100 bg-white p-4 lg:p-5">
              <div className="mb-3">
                <h3 className="font-alternate text-[0.82rem] font-bold uppercase tracking-[0.12em] text-[#291242]">
                  Colecciones
                </h3>
              </div>
              <div className="overflow-x-auto pb-1 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
                <div className="flex w-max gap-4">
                  {displayedAlbums.map((album) => (
                    <button
                      key={`gallery-album-${album.id}`}
                      type="button"
                      onClick={() => openAlbumView(album.id)}
                      className={`group relative h-[12rem] shrink-0 overflow-hidden rounded-[1.25rem] border border-slate-200 text-left transition-all hover:border-[#291242]/35 ${
                        album.featured ? 'w-[20rem]' : 'w-[16.5rem]'
                      }`}
                    >
                      <img
                        src={getAlbumCover(album)}
                        alt={album.title}
                        className="absolute inset-0 h-full w-full object-cover transition-transform duration-700 group-hover:scale-105"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-[#12081f]/88 via-[#12081f]/34 to-transparent" />
                      <div className="relative h-full p-4 lg:p-5 flex flex-col justify-end gap-2">
                        {album.featured && (
                          <span className="inline-flex w-fit rounded-full border border-white/25 bg-white/10 px-2.5 py-1 text-[0.45rem] font-bold uppercase tracking-[0.18em] text-[#8BF784]">
                            Destacado
                          </span>
                        )}
                        <div className="font-alternate text-[0.82rem] font-bold uppercase leading-tight text-white">{album.title}</div>
                        <div className="text-[0.54rem] font-bold uppercase tracking-[0.14em] text-white/75">
                          {METRIC_FORMATTER.format(album.photoCount || 0)} fotos
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            </section>
          </>
        )}
      </div>

      {albumViewState.isOpen && activeAlbumView && (
        <div className="fixed inset-0 z-[115] bg-[linear-gradient(180deg,rgba(248,250,252,0.98)_0%,rgba(255,255,255,0.96)_100%)] backdrop-blur-sm">
          <div className="h-full overflow-y-auto">
            <div className="max-w-[102rem] mx-auto px-6 lg:px-8 py-6 lg:py-8">
              <div className="sticky top-4 z-[2] rounded-[1.6rem] border border-slate-200 bg-white/96 px-4 py-4 lg:px-5 lg:py-5 mb-6 shadow-[0_12px_30px_rgba(15,23,42,0.08)]">
                <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,1fr)_13rem] gap-4 lg:gap-5 items-start">
                  <div>
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <button
                        type="button"
                        onClick={closeAlbumView}
                        className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-slate-50 px-3 py-1.5 text-[0.56rem] font-bold uppercase tracking-[0.18em] text-[#291242] transition-colors hover:bg-slate-100"
                      >
                        <ArrowLeft size={14} />
                        Volver
                      </button>
                    </div>

                    <div className="mt-3">
                      <div className="font-alternate text-[1.05rem] lg:text-[1.16rem] font-bold uppercase tracking-[0.08em] text-[#291242] leading-tight">
                        {activeAlbumView.title}
                      </div>
                    </div>

                    <div className="mt-3 flex flex-wrap gap-2">
                      <span className="inline-flex items-center rounded-full border border-slate-200 bg-slate-50 px-3 py-1.5 text-[0.52rem] font-bold uppercase tracking-[0.16em] text-slate-500">
                        {activeAlbumView.location || 'Sin ubicación registrada'}
                      </span>
                      <span className="inline-flex items-center rounded-full border border-slate-200 bg-slate-50 px-3 py-1.5 text-[0.52rem] font-bold uppercase tracking-[0.16em] text-slate-500">
                        {METRIC_FORMATTER.format(activeAlbumView.photoCount || 0)} fotos
                      </span>
                      {activeAlbumView.dateLabel && (
                        <span className="inline-flex items-center rounded-full border border-slate-200 bg-slate-50 px-3 py-1.5 text-[0.52rem] font-bold uppercase tracking-[0.16em] text-slate-500">
                          {activeAlbumView.dateLabel}
                        </span>
                      )}
                      {albumHasMultipleSections && (
                        <span className="inline-flex items-center rounded-full border border-slate-200 bg-slate-50 px-3 py-1.5 text-[0.52rem] font-bold uppercase tracking-[0.16em] text-slate-500">
                          {albumSectionsForDisplay.length} secciones
                        </span>
                      )}
                    </div>

                    {activeAlbumView.description && (
                      <div className="mt-4 rounded-[1rem] border border-slate-200 bg-slate-50 px-4 py-3 text-[0.78rem] text-slate-600 font-nunito leading-relaxed">
                        {activeAlbumView.description}
                      </div>
                    )}
                  </div>

                  <div className="hidden lg:block">
                    <div className="rounded-[1rem] border border-slate-200 overflow-hidden bg-slate-100">
                      <img
                        src={getAlbumCover(activeAlbumView)}
                        alt={activeAlbumView.title}
                        className="h-[10.2rem] w-full object-cover"
                      />
                    </div>
                  </div>
                </div>
              </div>

              {albumSectionsForDisplay.length > 0 ? (
                <div className="space-y-8">
                  {albumSectionsForDisplay.map((section) => (
                    <div key={`album-section-${section.id}`} className={`${albumHasMultipleSections ? 'rounded-[1.35rem] border border-slate-200 bg-white p-3 lg:p-4' : ''}`}>
                      {albumHasMultipleSections && (
                        <div className="mb-3 flex items-center justify-between gap-3">
                          <div className="inline-flex items-center rounded-full border border-slate-200 bg-slate-50 px-3.5 py-1.5 text-[0.56rem] font-bold uppercase tracking-[0.16em] text-slate-500">
                            {section.title}
                          </div>
                          <div className="text-[0.5rem] font-bold uppercase tracking-[0.14em] text-slate-400">
                            {METRIC_FORMATTER.format(section.photos.length)} fotos
                          </div>
                        </div>
                      )}
                      <div className="columns-1 md:columns-2 xl:columns-3 gap-4 [column-fill:_balance]">
                        {section.photos.map((photo, photoIndex) => (
                          <button
                            key={`album-view-photo-${section.id}-${photo.id}-${photoIndex}`}
                            type="button"
                            onClick={() => openLightbox(
                              section.photos,
                              photoIndex,
                              `${activeAlbumView.title}${albumHasMultipleSections ? ` · ${section.title}` : ''}`,
                            )}
                            className="group relative mb-4 block w-full overflow-hidden rounded-[1.1rem] border border-slate-200 bg-white shadow-[0_6px_18px_rgba(15,23,42,0.06)]"
                          >
                            <img
                              src={photo.src}
                              alt={photo.alt || photo.title}
                              className="h-auto w-full object-cover transition-transform duration-700 group-hover:scale-[1.02]"
                            />
                            <div className="absolute inset-0 bg-gradient-to-t from-[#12081f]/45 via-transparent to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
                            <div className="absolute inset-x-0 bottom-0 p-3 opacity-0 transition-opacity duration-300 group-hover:opacity-100">
                              <div className="inline-flex items-center rounded-sm border border-white/30 bg-black/35 px-2 py-[3px] text-[0.38rem] font-bold uppercase tracking-[0.12em] text-white/95">
                                Ver imagen
                              </div>
                            </div>
                          </button>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="rounded-[1.6rem] border border-slate-200 bg-white p-8">
                  <EmptyState
                    title="No hay imágenes para esta selección"
                    description="Este álbum todavía no tiene imágenes disponibles."
                  />
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {activeLightboxPhoto && (
        <div className="fixed inset-0 z-[120] bg-[#12081f]/92 backdrop-blur-sm flex items-center justify-center p-4 lg:p-8">
          <button
            type="button"
            onClick={closeLightbox}
            className="absolute inset-0"
            aria-label="Cerrar visualizador"
          />

          <div className="relative z-[1] w-full max-w-[94rem] flex items-center gap-3 lg:gap-6">
            {lightboxState.items.length > 1 && (
              <button
                type="button"
                onClick={showPreviousPhoto}
                className="hidden lg:inline-flex h-12 w-12 shrink-0 items-center justify-center rounded-full border border-white/10 bg-white/10 text-white transition-colors hover:bg-white/20"
                aria-label="Foto anterior"
              >
                <ChevronLeft size={22} />
              </button>
            )}

            <div className="relative flex-1 rounded-[2rem] overflow-hidden bg-black shadow-2xl">
              <div className="absolute top-4 right-4 z-[1] flex items-center gap-2">
                {lightboxState.items.length > 1 && (
                  <div className="rounded-full border border-white/10 bg-black/35 px-3 py-1.5 text-[0.6rem] font-bold uppercase tracking-[0.18em] text-white/80">
                    {lightboxState.index + 1} / {lightboxState.items.length}
                  </div>
                )}
                <a
                  href={activeLightboxPhoto.src}
                  download={buildGalleryDownloadName(activeLightboxPhoto, lightboxState.index)}
                  className="inline-flex h-11 w-11 items-center justify-center rounded-full border border-white/10 bg-black/35 text-white transition-colors hover:bg-black/50"
                  aria-label="Descargar imagen"
                >
                  <DownloadCloud size={18} />
                </a>
                <button
                  type="button"
                  onClick={closeLightbox}
                  className="inline-flex h-11 w-11 items-center justify-center rounded-full border border-white/10 bg-black/35 text-white transition-colors hover:bg-black/50"
                  aria-label="Cerrar"
                >
                  <X size={20} />
                </button>
              </div>

              <div className="bg-black flex items-center justify-center max-h-[82vh] min-h-[26rem]">
                <img
                  src={activeLightboxPhoto.src}
                  alt={activeLightboxPhoto.alt || activeLightboxPhoto.title}
                  className="max-h-[82vh] w-auto max-w-full object-contain"
                />
              </div>

              <div className="bg-black/88 px-5 lg:px-6 py-4 grid grid-cols-1 lg:grid-cols-[minmax(0,1fr)_14rem] gap-4">
                <div>
                  <div className="text-white font-alternate text-[1rem] font-bold uppercase leading-tight">{activeLightboxPhoto.title}</div>
                  <div className="mt-1 text-[0.72rem] text-white/65 font-nunito leading-relaxed">
                    {lightboxState.contextTitle || activeLightboxPhoto.albumTitle || 'Galería'}
                    {activeLightboxPhoto.sectionTitle ? ` · ${activeLightboxPhoto.sectionTitle}` : ''}
                  </div>
                </div>
                <div className="rounded-[1rem] border border-white/10 bg-white/5 p-3">
                  <div className="text-[0.5rem] font-bold uppercase tracking-[0.2em] text-white/50">Álbum</div>
                  <button
                    type="button"
                    onClick={openActiveLightboxAlbum}
                    className="mt-2 text-left font-alternate text-[0.72rem] font-bold uppercase leading-tight text-white hover:text-[#8BF784] transition-colors"
                  >
                    {activeLightboxAlbum?.title || activeLightboxPhoto.albumTitle || 'Álbum'}
                  </button>
                </div>
              </div>
            </div>

            {lightboxState.items.length > 1 && (
              <button
                type="button"
                onClick={showNextPhoto}
                className="hidden lg:inline-flex h-12 w-12 shrink-0 items-center justify-center rounded-full border border-white/10 bg-white/10 text-white transition-colors hover:bg-white/20"
                aria-label="Foto siguiente"
              >
                <ChevronRight size={22} />
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

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

  const historyStages = [ 
    { id: 0, year: '2003-2006', title: 'Creación e Institucionalización', desc: 'La aprobación del CONPES 3409 de 2006 formalizó el PNMC y consolidó las Escuelas Municipales de Música (EMM) como espacios centrales para la formación musical colectiva. Este periodo estableció los cimientos del programa: acceso, democratización, convivencia y fortalecimiento de las músicas locales. Se amplió la dotación instrumental, se fortalecieron los equipos territoriales y se empezó a articular una red nacional de formación basada en la práctica comunitaria.', img: "https://images.unsplash.com/photo-1774558396253-be05d7a37d82?q=80&w=1470&auto=format&fit=crop" }, 
    { id: 1, year: '2007-2014', title: 'Territorialización y saberes', desc: 'Durante esta etapa se profundizó en la institucionalización territorial, con énfasis en la formación de formadores, la cualificación de músicos en ejercicio y el impulso a las músicas tradicionales. Se promovió la descentralización, se consolidaron procesos comunitarios sostenidos y se promovió el reconocimiento de músicos empíricos y sabedores. Este periodo marcó un avance significativo en la diversidad musical, al visibilizar prácticas propias de cada región y promover su circulación.', img: "https://images.unsplash.com/photo-1774558396253-be05d7a37d82?q=80&w=1470&auto=format&fit=crop" }, 
    { id: 2, year: '2015-2018', title: 'Profesionalización y SIMUS', desc: 'En estos años se desarrollaron las líneas estratégicas de Musicalización de la Ciudadanía y Estructuración del Campo Profesional de la Música, orientadas a fortalecer la formación integral y la profesionalización del sector. Se creó el Sistema de Información de la Música (SIMUS), herramienta clave para la toma de decisiones y la caracterización del ecosistema musical. Además, se implementaron nuevas estrategias de circulación y se amplió la presencia del PNMC en festivales, mercados y espacios de movilidad artística.', img: "https://images.unsplash.com/photo-1774558396253-be05d7a37d82?q=80&w=1470&auto=format&fit=crop" }, 
    { id: 3, year: '2018-2022', title: 'Evaluación y Consolidación', desc: 'El Departamento Nacional de Planeación (DNP) realizó una evaluación integral del PNMC, destacando su impacto en la formación musical, el fortalecimiento del tejido social y la dignificación del trabajo artístico. A partir de esta evaluación se identificaron retos y oportunidades, como mejorar la articulación interinstitucional, fortalecer SIMUS, ampliar la presencia del PNMC en educación superior, incentivar economías creativas en los territorios y mejorar las condiciones laborales de los músicos y formadores.', img: "https://images.unsplash.com/photo-1774558396280-c14b21198674?q=80&w=1470&auto=format&fit=crop" }, 
    { id: 4, year: '2023-2025', title: 'Actualización y Proyección 2035', desc: 'En un ejercicio nacional sin precedentes, el Ministerio de las Culturas abrió espacios de participación a través de 34 Encuentros Territoriales, mesas sectoriales, la Mesa Nacional Vinculante y el VII Congreso Nacional de Música. Estas iniciativas permitieron recoger las necesidades, visiones y apuestas del sector musical en todo el país y dieron origen al PNMC 2025-2035, “Huellas y apuestas de la diversidad sonora”. Este nuevo Plan articula la música con la vida, el diálogo intercultural, la bioculturalidad, la equidad, la sostenibilidad y la gobernanza participativa, proyectando un ecosistema musical diverso, justo y sostenible para la próxima década.', img: "https://images.unsplash.com/photo-1774558396253-be05d7a37d82?q=80&w=1470&auto=format&fit=crop" } 
  ]; 
  const normativeStages = [
    {
      id: 0,
      year: '1997',
      title: 'Ley 397 de 1997',
      desc: 'La Ley General de Cultura establece los principios, objetivos y mecanismos para proteger, fomentar y difundir la cultura en Colombia. Reconoce la diversidad cultural como fundamento de la identidad nacional y define la cultura como derecho. En su estructura se incluyen disposiciones para el fomento de las artes, la formación artística y la protección del patrimonio cultural, elementos esenciales para el desarrollo del PNMC. Actualizada por la Ley 1185 de 2008.',
      img: 'https://images.unsplash.com/photo-1774557482533-76b2ed54afce?q=80&w=1015&auto=format&fit=crop',
    },
    {
      id: 1,
      year: '2006',
      title: 'CONPES 3409 de 2006',
      desc: 'Este documento aprobó la política del Plan Nacional de Música para la Convivencia, institucionalizando las Escuelas Municipales de Música y definiendo estrategias para mejorar la formación musical, la dotación instrumental y la gestión cultural en los territorios. Fue la base técnica y financiera que permitió consolidar el PNMC como política pública estable.',
      img: 'https://images.unsplash.com/photo-1774558396253-be05d7a37d82?q=80&w=1470&auto=format&fit=crop',
    },
    {
      id: 2,
      year: '2011',
      title: 'Ley 1493 de 2011',
      desc: 'La Ley de Espectáculos Públicos regula la organización de espectáculos públicos de las artes escénicas y promueve la circulación artística en condiciones más equitativas. Aunque su alcance es más amplio que la música, ha tenido un impacto directo en la infraestructura cultural y en la movilidad de artistas y agrupaciones musicales en el país, facilitando escenarios más dignos y accesibles.',
      img: 'https://images.unsplash.com/photo-1774558396280-c14b21198674?q=80&w=1470&auto=format&fit=crop',
    },
    {
      id: 3,
      year: '2018',
      title: 'Decreto 2120 de 2018',
      desc: 'Este decreto reglamenta la organización, funcionamiento y articulación de los subsistemas que integran el Sistema Nacional de Cultura. Para el PNMC es clave porque define los espacios de participación ciudadana, la gobernanza territorial y las responsabilidades institucionales en procesos formativos y comunitarios, incluyendo los vinculados a las músicas del país.',
      img: 'https://images.unsplash.com/photo-1774558396253-be05d7a37d82?q=80&w=1470&auto=format&fit=crop',
    },
    {
      id: 4,
      year: '2024-2038',
      title: 'Plan Nacional de Cultura',
      desc: 'El nuevo PNC establece la visión cultural del país para los próximos 14 años. Define la cultura como eje del cuidado de la vida, la diversidad y la paz, y orienta las políticas del Ministerio de las Culturas, las Artes y los Saberes. El PNMC 2025-2035 se enmarca plenamente en esta estrategia, en sus componentes institucional y subsectorial, articulando lineamientos de diversidad sonora, ecosistemas culturales, gobernanza y sostenibilidad.',
      img: 'https://images.unsplash.com/photo-1774558396250-1571cdddc61c?q=80&w=687&auto=format&fit=crop',
    },
    {
      id: 6,
      year: '2025',
      title: 'Ley 2555 de 2025',
      desc: 'La Ley Artes al Aula convierte la educación artística en un mandato para todas las instituciones educativas oficiales del país. Reconoce las artes, incluida la música, como un derecho cultural fundamental y exige su incorporación transversal en los procesos pedagógicos, fortaleciendo competencias creativas, socioemocionales y ciudadanas. Impulsa la formación docente en pedagogías artísticas, promueve la articulación entre escuela, comunidad y territorio, y orienta la implementación desde el SINEFAC, facilitando la coordinación entre los sectores de educación y cultura.',
      img: 'https://images.unsplash.com/photo-1774558396280-c14b21198674?q=80&w=1470&auto=format&fit=crop',
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
	            <div className="relative w-full max-w-md min-h-[360px] lg:min-h-[400px] flex items-center justify-center group">
	              <div className="absolute inset-0 bg-[#291242] rounded-[3rem] rotate-4 group-hover:rotate-1 transition-transform duration-700 shadow-2xl opacity-10"></div>
	              <div className="absolute inset-0 bg-[#291242] rounded-[3rem] shadow-2xl overflow-hidden flex flex-col p-10 lg:p-12 text-left justify-center">
	                <div className="absolute top-0 left-0 w-full h-1.5 bg-[#00DA5E]"></div>
	                <div className="mb-6 w-14 h-14 rounded-full bg-white/5 flex items-center justify-center text-[#00DA5E] ring-1 ring-white/10 shadow-inner">
	                  <Target size={36} strokeWidth={1} />
	                </div>
	                <h3 className="font-alternate text-base font-bold uppercase tracking-[0.28em] text-[#00DA5E] mb-4">Objetivo General</h3>
	                <p className="font-nunito text-base lg:text-[1.05rem] text-white font-light leading-relaxed italic max-w-md">
	                  Consolidar la equidad de condiciones y oportunidades en el campo musical, promoviendo la participación y el ejercicio pleno de los derechos culturales.
	                </p>
	                <div className="mt-6 flex gap-2">
	                  <div className="w-1.5 h-1.5 rounded-full bg-[#00DA5E]/40"></div>
	                  <div className="w-1.5 h-1.5 rounded-full bg-[#00DA5E]"></div>
	                  <div className="w-1.5 h-1.5 rounded-full bg-[#00DA5E]/40"></div>
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
	                  <span className="font-alternate text-[3rem] leading-[0.75] text-[#00DA5E]/45">“</span>
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
            <h2 className="font-gregor text-5xl font-bold uppercase leading-none tracking-tight mb-6">Enfoques del <br/> Sistema</h2>
            <p className="text-slate-400 font-nunito font-light text-sm leading-relaxed">Consideramos las particularidades sociales y geográficas para garantizar un acceso equitativo a la cultura.</p>
          </div>
          <div className="lg:w-2/3 grid grid-cols-1 md:grid-cols-3 gap-6">
            {[
              { t: "Biocultural", d: "Relación música-entorno natural. Integración de saberes ancestrales y preservación sonora ambiental.", icon: Globe },
              { t: "Poblacional", d: "Equidad para infancia, mujeres, diversidades de género, pueblos étnicos y personas con capacidades diversas.", icon: Users2 },
              { t: "Territorial", d: "Estrategias diferenciadas según geografía, infraestructura local y financiamiento por contextos.", icon: MapIcon }
            ].map((enf, i) => (
              <div key={i} className="bg-white/5 p-8 rounded-[2.5rem] border border-white/10 hover:bg-white/10 transition-all">
                <enf.icon size={32} className="text-[#8BF784] mb-4" />
                <h4 className="font-alternate text-lg font-bold uppercase mb-2">{enf.t}</h4>
                <p className="text-[0.7rem] text-slate-300 font-nunito leading-relaxed">{enf.d}</p>
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
                <h3 className="font-gregor text-4xl lg:text-5xl text-[#291242] font-bold uppercase leading-none tracking-tight">
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
                  <ul className="space-y-2.5">
                    {act.list.map((li, idx) => (
                      <li key={idx} className="flex items-center gap-3 text-[0.68rem] font-bold text-slate-500 bg-slate-50/70 p-3.5 rounded-2xl border border-transparent hover:border-[#8BF784]/20 hover:text-[#291242] transition-all">
                        <div className="w-1.5 h-1.5 rounded-full bg-[#8BF784]" />
                        {li}
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
        <div className="mb-8 lg:mb-12 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6 lg:gap-10">
          <div className="flex-1 min-w-0 space-y-6">
            <SectionHeader backgroundText="EVOLUCIÓN" foregroundText="Hitos del PNMC" verticalContext="HITOS" />
            <p className="max-w-4xl text-3xl lg:text-4xl text-[#291242] font-bold font-nunito leading-tight tracking-tight">Desde hace más de medio siglo, Colombia ha construido una política musical que reconoce la música como un derecho cultural y puente de convivencia.</p>
          </div>
          <div className="lg:w-[25rem] flex justify-end">
            <p className="max-w-3xl text-right text-base lg:text-[1.05rem] text-slate-500 font-nunito leading-relaxed">El PNMC, creado en 2003, es el resultado de una trayectoria que inició con Colcultura en 1968, garantizando hoy que todas las personas puedan vivir plenamente la música como experiencia y bien común.</p>
          </div>
        </div>
        <div className="space-y-8 mb-20">
          <div className="flex flex-col lg:flex-row h-auto lg:h-[400px] gap-2.5 w-full"> 
            {historyStages.map((stage) => ( 
              <div key={stage.id} onClick={() => setActiveStage(stage.id)} className={`relative overflow-hidden transition-all duration-700 cursor-pointer group rounded-[1.5rem] border border-slate-100 min-h-[150px] lg:min-h-0 ${activeStage === stage.id ? 'flex-[6] bg-slate-900 shadow-xl' : 'flex-1 bg-white hover:bg-slate-50'}`}> 
                <div className={`absolute inset-0 transition-opacity duration-1000 ${activeStage === stage.id ? 'opacity-20' : 'opacity-0'}`}><img src={stage.img} className="w-full h-full object-cover" alt="" /></div> 
                <div className={`absolute inset-0 p-6 flex flex-col justify-end transition-all duration-700 ${activeStage === stage.id ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-6 pointer-events-none'}`}> 
                  <span className="text-[#8BF784] font-alternate text-sm font-bold mb-1 tracking-widest">{stage.year}</span> 
                  <h3 className="font-alternate text-xl text-white uppercase leading-none mb-2">{stage.title}</h3> 
                  <p className="font-nunito text-[0.78rem] text-slate-300 font-light max-w-xl leading-relaxed">{stage.desc}</p> 
                </div> 
                <div className={`absolute inset-0 flex items-center justify-center transition-opacity duration-500 ${activeStage === stage.id ? 'opacity-0' : 'opacity-100'}`}>
                  <div className="rotate-[-90deg] flex items-center justify-center w-full translate-x-8 lg:translate-x-10 opacity-30">
                    <span className="font-gregor text-6xl lg:text-[7.5rem] font-bold uppercase tracking-tighter text-[#8BF784]">
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
        <div className="mb-8 lg:mb-12 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6 lg:gap-10">
          <div className="flex-1 min-w-0 space-y-6">
            <SectionHeader backgroundText="MARCO" foregroundText="Marco Normativo" verticalContext="BASE LEGAL" />
            <p className="max-w-4xl text-3xl lg:text-4xl text-[#291242] font-bold font-nunito leading-tight tracking-tight">El PNMC se sustenta en una trayectoria normativa que ha consolidado la cultura y la música como derechos, políticas públicas y herramientas de transformación territorial.</p>
          </div>
          <div className="lg:w-[25rem] flex justify-end">
            <p className="max-w-3xl text-right text-base lg:text-[1.05rem] text-slate-500 font-nunito leading-relaxed">Este marco articula leyes, decretos, documentos de política y planes nacionales que orientan la formación, la circulación, la participación y la gobernanza cultural en Colombia.</p>
          </div>
        </div>
        <div className="flex flex-col lg:flex-row h-auto lg:h-[400px] gap-2.5 w-full mt-6">
          {normativeStages.map((stage) => (
            <div key={stage.id} onClick={() => setActiveNormativeStage(stage.id)} className={`relative overflow-hidden transition-all duration-700 cursor-pointer group rounded-[1.5rem] border border-slate-100 min-h-[150px] lg:min-h-0 ${activeNormativeStage === stage.id ? 'flex-[6] bg-slate-900 shadow-xl' : 'flex-1 bg-white hover:bg-slate-50'}`}>
              <div className={`absolute inset-0 transition-opacity duration-1000 ${activeNormativeStage === stage.id ? 'opacity-20' : 'opacity-0'}`}><img src={stage.img} className="w-full h-full object-cover" alt="" /></div>
              <div className={`absolute inset-0 p-6 flex flex-col justify-end transition-all duration-700 ${activeNormativeStage === stage.id ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-6 pointer-events-none'}`}>
                <span className="text-[#8BF784] font-alternate text-sm font-bold mb-1 tracking-widest">{stage.year}</span>
                <h3 className="font-alternate text-xl text-white uppercase leading-none mb-2">{stage.title}</h3>
                <p className="font-nunito text-[0.78rem] text-slate-300 font-light max-w-xl leading-relaxed">{stage.desc}</p>
              </div>
              <div className={`absolute inset-0 flex items-center justify-center transition-opacity duration-500 ${activeNormativeStage === stage.id ? 'opacity-0' : 'opacity-100'}`}>
                <div className="rotate-[-90deg] flex items-center justify-center w-full translate-x-8 lg:translate-x-10 opacity-30">
                  <span className="font-gregor text-5xl lg:text-[6.5rem] font-bold uppercase tracking-tighter text-[#8BF784]">
                    {stage.year.split('-')[0]}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </ContentWrapper>

      <ContentWrapper className="bg-slate-50/50" id="pnmc-equipo">
        <div className="mb-8 lg:mb-12 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6 lg:gap-10">
          <div className="flex-1 min-w-0 space-y-6">
            <SectionHeader backgroundText="EQUIPO" foregroundText="Equipo de Trabajo" verticalContext="CONTACTO" />
            <p className="max-w-4xl text-3xl lg:text-4xl text-[#291242] font-bold font-nunito leading-tight tracking-tight">El PNMC se construye y acompaña desde un equipo técnico que articula componentes, seguimiento institucional y trabajo con los territorios.</p>
          </div>
          <div className="lg:w-[25rem] flex justify-end">
            <p className="max-w-3xl text-right text-base lg:text-[1.05rem] text-slate-500 font-nunito leading-relaxed">Aquí puedes identificar los referentes del plan por coordinación y componente, con sus canales de contacto institucional.</p>
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
                <div className="grid grid-cols-1 xl:grid-cols-2 gap-0">
                  {workTeam.slice(2).map((member) => (
                    <div key={member.role} className="border-b border-slate-100 xl:nth-[2n+1]:border-r border-slate-100 py-6 xl:pr-8">
                      <div className="grid grid-cols-[88px_minmax(0,1fr)] gap-5 items-stretch">
                        <div className="w-20 h-24 rounded-[1.4rem] border border-slate-100 bg-slate-50 flex items-center justify-center text-slate-300 overflow-hidden">
                          <UserCircle2 size={28} strokeWidth={1.5} />
                        </div>
                        <div className="min-w-0 min-h-24 flex flex-col justify-between">
                          <div className="space-y-2">
                            <h4 className="font-alternate text-base text-[#291242] font-bold uppercase leading-tight">
                              {member.name || 'Por definir'}
                            </h4>
                            <p className="mt-2 font-nunito text-sm text-slate-500 leading-relaxed">
                              {member.role.replace('Líder Componente: ', '')}
                            </p>
                          </div>
                          <p className="font-nunito text-sm text-slate-600 leading-relaxed break-all">
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

const ComponentSubPage = ({ component, onBack, onNavigate, onNavigateToEditorialResource }) => {
  const relatedEditorialResources = component.id === 'c2-3'
    ? [
        { id: 'PNMC-ED-103', title: 'Producción y Gestión de Eventos Musicales', meta: 'Producción y Emprendimiento • Caja de herramientas' },
        { id: 'PNMC-ED-104', title: 'Orientaciones para procesos de producción y circulación', meta: 'Producción y Emprendimiento • Documento técnico' },
      ]
    : [
        { id: 'PNMC-ED-110', title: 'La música cuenta 2016', meta: 'Información • Boletín estadístico' },
        { id: 'PNMC-ED-001', title: 'Módulos de capacitación para instrumentistas y directores de banda', meta: 'Formación • Libro' },
      ];
  const actionLines = component.id === 'c2-3'
    ? [
        'Dinamización de espacios para la circulación musical',
        'Territorios Sonoros: turismo cultural y músicas regionales',
        'Estrategia integral de circulación musical',
        'Fomento de redes y circulación colectiva',
      ]
    : ['Fortalecimiento institucional', 'Capacitación técnica', 'Sostenibilidad regional'];
  const expectedImpact = component.id === 'c2-3'
    ? 'Mayor visibilización y movilidad de músicos, músicas y proyectos en circuitos locales, nacionales e internacionales, junto con el fortalecimiento de festivales, mercados, redes colaborativas y espacios de programación que amplían las oportunidades de circulación y profesionalización del sector.'
    : 'Incremento en la participación ciudadana y profesionalización de los actores vinculados a esta área específica.';

  return (
    <div className="bg-white min-h-screen text-left pb-20">
      <PageHero 
        title={component.name}
        titleTone="split-lines"
        description={component.details} 
        bgImage="https://images.unsplash.com/photo-1774558396253-be05d7a37d82?q=80&w=1470&auto=format&fit=crop" 
        onBack={onBack} 
      />
      <ContentWrapper>
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-16">
          <div className="lg:col-span-8 space-y-12">
            <div className="space-y-6">
              <SectionHeader backgroundText="COMPONENTE" foregroundText="Descripción del Componente" compact />
              <div className="font-nunito text-lg text-slate-600 leading-relaxed font-light space-y-4">
                {component.fullText.map((p, i) => <p key={i}>{p}</p>)}
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8 pt-8">
                <div className="bg-slate-50 p-8 rounded-[2rem] border border-slate-100">
                  <h4 className="font-alternate text-[#291242] text-xl uppercase font-bold mb-4">Líneas de Acción</h4>
                  <ul className="space-y-3">
                    {actionLines.map(l => (
                      <li key={l} className="flex items-center gap-3 text-sm text-slate-500 font-nunito">
                        <CheckCircle2 size={16} className="text-[#00DA5E]" /> {l}
                      </li>
                    ))}
                  </ul>
                </div>
                <div className="bg-slate-50 p-8 rounded-[2rem] border border-slate-100">
                  <h4 className="font-alternate text-[#291242] text-xl uppercase font-bold mb-4">Impacto Esperado</h4>
                  <div className="flex items-start gap-3 text-sm text-slate-500 font-nunito leading-relaxed">
                    <CheckCircle2 size={16} className="text-[#00DA5E] mt-0.5 shrink-0" />
                    <p>{expectedImpact}</p>
                  </div>
                </div>
              </div>

            </div>
          </div>
          <aside className="lg:col-span-4 space-y-8">
            {component.id === 'c2-3' ? (
              <>
                <div className="bg-slate-50 border border-slate-100 rounded-[2.5rem] p-10 space-y-6">
                   <h4 className="font-alternate text-sm font-bold uppercase tracking-[0.3em] text-slate-400">Recursos Relacionados</h4>
                   <div className="space-y-4">
                     {relatedEditorialResources.map((resource) => (
                       <div
                         key={resource.id}
                         onClick={() => onNavigateToEditorialResource?.(resource.id)}
                         className="flex items-center gap-4 bg-white p-4 rounded-xl border border-slate-100 group cursor-pointer hover:border-[#00DA5E] transition-all"
                       >
                          <div className="w-10 h-10 bg-slate-50 rounded-lg flex items-center justify-center text-[#291242] group-hover:bg-[#00DA5E] transition-colors"><FileText size={18}/></div>
                          <div className="flex flex-col">
                            <span className="text-[0.7rem] font-bold text-[#291242] uppercase font-alternate">{resource.title}</span>
                            <span className="text-[0.55rem] text-slate-400 uppercase tracking-widest">{resource.meta}</span>
                          </div>
                       </div>
                     ))}
                   </div>
                </div>

                <div
                  onClick={() => onNavigate?.('estrategia-circulacion')}
                  className="relative overflow-hidden rounded-[2.5rem] border border-slate-100 min-h-[280px] cursor-pointer group"
                >
                  <img
                    src="https://images.unsplash.com/photo-1774558396280-c14b21198674?q=80&w=1470&auto=format&fit=crop"
                    alt=""
                    className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-[1.03]"
                  />
                  <div className="absolute inset-0 bg-[#291242]/55"></div>
                  <div className="absolute inset-0 bg-gradient-to-t from-[#291242]/96 via-[#291242]/78 to-[#291242]/28"></div>
                  <div className="relative z-10 h-full min-h-[280px] p-8 flex flex-col justify-center">
                    <span className="text-[0.68rem] font-bold uppercase tracking-[0.28em] text-[#8BF784]">Estrategia Relacionada</span>
                    <h3 className="font-gregor text-3xl text-white font-bold uppercase leading-none tracking-tighter mt-4">Celebra la Música</h3>
                    <p className="mt-5 text-[0.9rem] text-slate-200 font-nunito leading-relaxed">
                      Estrategia de circulación que promueve escenarios, programación y articulaciones territoriales para visibilizar los procesos musicales del país y ampliar sus oportunidades de encuentro con los públicos.
                    </p>
                    <div className="mt-8 flex items-center gap-3 text-[0.72rem] font-bold uppercase tracking-widest text-[#8BF784] font-alternate">
                      Explorar la estrategia <ArrowRight size={16} />
                    </div>
                  </div>
                </div>

                <div
                  className="relative overflow-hidden rounded-[2.5rem] border border-slate-100 min-h-[280px] group"
                >
                  <img
                    src="https://images.unsplash.com/photo-1774558396253-be05d7a37d82?q=80&w=1470&auto=format&fit=crop"
                    alt=""
                    className="absolute inset-0 w-full h-full object-cover"
                  />
                  <div className="absolute inset-0 bg-[#291242]/50"></div>
                  <div className="absolute inset-0 bg-gradient-to-t from-[#291242]/94 via-[#291242]/76 to-[#291242]/24"></div>
                  <div className="relative z-10 h-full min-h-[280px] p-8 flex flex-col justify-center">
                    <span className="text-[0.68rem] font-bold uppercase tracking-[0.28em] text-[#8BF784]">Estrategia relacionada</span>
                    <h3 className="font-gregor text-3xl text-white font-bold uppercase leading-none tracking-tighter mt-4">Mercados Musicales</h3>
                    <p className="mt-5 text-[0.9rem] text-slate-200 font-nunito leading-relaxed">
                      Espacios de intercambio, conexión profesional y visibilización que fortalecen las redes del ecosistema musical y abren oportunidades de circulación para artistas, gestores y proyectos.
                    </p>
                    <div className="mt-8 flex items-center gap-3 text-[0.72rem] font-bold uppercase tracking-widest text-[#8BF784] font-alternate">
                      Explorar Estrategia <ArrowRight size={16} />
                    </div>
                  </div>
                </div>
              </>
            ) : (
              <div className="bg-slate-50 border border-slate-100 rounded-[2.5rem] p-10 space-y-6">
                 <h4 className="font-alternate text-sm font-bold uppercase tracking-[0.3em] text-slate-400">Recursos Relacionados</h4>
                 <div className="space-y-4">
                   {relatedEditorialResources.map((resource) => (
                     <div
                       key={resource.id}
                       onClick={() => onNavigateToEditorialResource?.(resource.id)}
                       className="flex items-center gap-4 bg-white p-4 rounded-xl border border-slate-100 group cursor-pointer hover:border-[#00DA5E] transition-all"
                     >
                        <div className="w-10 h-10 bg-slate-50 rounded-lg flex items-center justify-center text-[#291242] group-hover:bg-[#00DA5E] transition-colors"><FileText size={18}/></div>
                        <div className="flex flex-col">
                          <span className="text-[0.7rem] font-bold text-[#291242] uppercase font-alternate">{resource.title}</span>
                          <span className="text-[0.55rem] text-slate-400 uppercase tracking-widest">{resource.meta}</span>
                        </div>
                     </div>
                   ))}
                 </div>
              </div>
            )}
            <div className="bg-[#8BF784] rounded-[2.5rem] p-10 text-[#291242]">
              <h4 className="font-alternate text-2xl uppercase font-bold mb-4 leading-tight">¿Tienes dudas sobre este componente?</h4>
              <p className="text-sm font-nunito mb-8 leading-relaxed">Contáctanos para recibir asesoría técnica especializada sobre los procesos de este componente.</p>
              <Button variant="secondary" className="w-full">Contactar Componente</Button>
            </div>
          </aside>
        </div>
      </ContentWrapper>
    </div>
  );
};

const strategyPageContent = {
  'Celebra la Música': {
    heroDescription: 'Una estrategia nacional que articula territorios, agentes e instituciones para visibilizar la diversidad sonora de Colombia.',
    sectionTitle: 'La celebración de la música',
    intro: 'Como parte del Plan Nacional de Música para la Convivencia del Ministerio de las Culturas del Gobierno de Colombia, Celebra la Música busca que el sonido y la creatividad lleguen a todos los rincones del país, para que cada territorio haga oír su voz.',
    mission: 'Su propósito es conectar a artistas, comunidades e instituciones para fortalecer los procesos de formación, creación y circulación musical. Promueve la música como un derecho, un espacio de encuentro y una oportunidad para construir memoria, dignificar el trabajo artístico y enriquecer la vida cultural del país.',
    editionTag: '14ª Edición',
    editionYear: '2025',
    editionTitle: 'Celebra la Música 2025',
    editionIntro: 'En 2025, Celebra la Música se renueva para convertirse en un gran proceso nacional que promueve la circulación musical en el país y que no será solo una jornada conmemorativa, sino un movimiento que, durante 29 días, unirá a los 32 departamentos de Colombia en torno a la diversidad sonora, el trabajo colaborativo y el reconocimiento de la música como un derecho y un bien común.',
    editionVision: 'Esta edición se articula con el Plan Nacional de Cultura 2024-2038 y el Plan Nacional de Música para la Convivencia 2025-2035, impulsando espacios de formación, creación, circulación y memoria. Busca fortalecer las redes entre artistas, gestores, festivales, escuelas y comunidades, para dignificar a todos los músicos, las músicas y dignificar el trabajo musical en los territorios.',
    editionClosing: 'Celebra la Música 2025 es una apuesta por hacer de la música un camino para la convivencia, la paz y la vida.',
    tracks: [
      {
        title: 'Músicas para la vida',
        subtitle: 'Categoría 01',
        desc: 'Procesos de formación y escuelas comunitarias, municipales, Batuta, CLANES, Artes para la Paz.',
        icon: Music2
      },
      {
        title: 'Cultura festiva',
        subtitle: 'Categoría 02',
        desc: 'Festivales y celebraciones como nodos de memoria, encuentro y circulación.',
        icon: PartyPopper
      },
      {
        title: 'Circuitos sonoros',
        subtitle: 'Categoría 03',
        desc: 'Mercados musicales y culturales, festivales y espacios de música en vivo como nodos de economía, encuentro y circulación.',
        icon: Radio
      }
    ],
    stats: [
      { value: '1.311', label: 'Artistas' },
      { value: '174', label: 'Aliados' },
      { value: '12', label: 'Departamentos' },
      { value: '45', label: 'Municipios y Veredas' }
    ],
    foundations: [
      {
        title: 'Proceso de asociatividad',
        desc: 'Trabajo colaborativo entre artistas, gestores, mercados, festivales, escuelas y entidades. Redes territoriales que descentralizan y fortalecen el ecosistema.',
        icon: Users2
      },
      {
        title: 'Acciones de fortalecimiento y cualificación',
        desc: 'Talleres, laboratorios, conferencias y procesos formativos que dignifican los oficios musicales, aportan a la profesionalización y generan capacidades locales.',
        icon: Lightbulb
      },
      {
        title: 'Estrategias de comunicación y divulgación',
        desc: 'Articulación de medios comunitarios, plataformas digitales y narrativas locales como aliados para la visibilización y posicionamiento de la diversidad sonora.',
        icon: MessageCircle
      },
      {
        title: 'Gestión de conocimiento y memoria',
        desc: 'Articula procesos de cartografía, caracterización y sistematización para reconocer, documentar y analizar las dinámicas musicales de los territorios, fortaleciendo la incidencia y la toma de decisiones en el ecosistema musical.',
        icon: FileText
      },
      {
        title: 'Sostenibilidad',
        desc: 'En lo económico, social, laboral, cultural y ambiental, promueve pago justo, autogestión, condiciones dignas, permanencia de las tradiciones y prácticas responsables orientadas al cuidado de la vida.',
        icon: ShieldCheck
      },
      {
        title: 'Participación y enfoques diferenciales',
        desc: 'Garantiza la inclusión de mujeres, diversidades de género, comunidades étnicas, juventudes, adultos mayores y personas con discapacidad en todos los procesos.',
        icon: Heart
      }
    ],
    toolkit: {
      title: 'Caja de Herramientas',
      intro: 'Descarga recursos gráficos, plantillas y elementos de identidad visual para promocionar Celebra la Música 2025 en tu territorio.',
      resources: [
        {
          title: 'Plantilla Post vertical',
          desc: 'Plantillas optimizadas para redes sociales en formato vertical. Perfectas para Instagram Stories y Facebook.',
          icon: FileType,
        },
        {
          title: 'Plantilla Historias',
          desc: 'Diseños especialmente creados para Stories de Instagram y Facebook. Formatos dinámicos y atractivos.',
          icon: LayoutGrid,
        },
        {
          title: 'Formatos',
          desc: 'Documentos y formatos oficiales para la gestión y organización de eventos de Celebra la Música 2025.',
          icon: FileText,
        },
        {
          title: 'Logos Celebra la Música',
          desc: 'Logotipos oficiales de Celebra la Música 2025 en diferentes formatos y versiones para todos los usos.',
          icon: Sparkles,
        },
        {
          title: 'Tipografía Nunito',
          desc: 'Familia tipográfica oficial Nunito Sans en todas sus variantes y pesos para mantener la coherencia visual.',
          icon: Type,
        },
        {
          title: 'Cortinilla Culturas',
          desc: 'Elementos audiovisuales y cortinillas para uso en videos y contenido multimedia del evento.',
          icon: MonitorPlay,
        },
        {
          title: 'Otras Aplicaciones',
          desc: 'Aplicaciones adicionales de la identidad visual en diferentes soportes y materiales promocionales.',
          icon: Boxes,
        },
        {
          title: 'Logo Culturas',
          desc: 'Logotipo oficial del Ministerio de las Culturas, las Artes y los Saberes en diferentes versiones.',
          icon: Landmark,
        },
        {
          title: 'Logo PNMC',
          desc: 'Logotipo del Plan Nacional de Música para la Convivencia en sus diferentes aplicaciones y formatos.',
          icon: Music2,
        },
      ],
      terms: 'Estos recursos están disponibles para uso institucional y promocional de Celebra la Música 2025. Al descargar, aceptas utilizarlos respetando la identidad visual oficial y con fines relacionados al evento. No está permitido el uso comercial sin autorización previa.',
    },
    gallery: [
      'https://images.unsplash.com/photo-1774558396253-be05d7a37d82?q=80&w=1470&auto=format&fit=crop',
      'https://images.unsplash.com/photo-1774558396280-c14b21198674?q=80&w=1470&auto=format&fit=crop',
      'https://images.unsplash.com/photo-1774558396253-be05d7a37d82?q=80&w=1470&auto=format&fit=crop'
    ]
  }
};

const strategyRelatedComponentsMap = {
  'Celebra la Música': [
    { id: 'c2-3', name: 'Circulación' },
  ],
  'Territorios Sonoros': [
    { id: 'c2-4', name: 'Memoria, investigación y documentación' },
  ],
};

const StrategySubPage = ({ title, context, onBack, onNavigate }) => {
  const strategyContent = strategyPageContent[title];
  const agendaSectionRef = useRef(null);
  const relatedComponents = strategyRelatedComponentsMap[title] || [];
  const [isToolkitExpanded, setIsToolkitExpanded] = useState(false);

  const scrollToStrategyAgenda = () => {
    scrollToElementWithOffset(agendaSectionRef.current);
  };

  if (strategyContent) {
    return (
      <div className="bg-white min-h-screen text-left pb-20">
        <PageHero
          tag="Estrategia"
          title={title}
          titleAccent="PNMC"
          description={strategyContent.heroDescription}
          bgImage="https://images.unsplash.com/photo-1774558396280-c14b21198674?q=80&w=1470&auto=format&fit=crop"
          onBack={onBack}
          childrenPosition="bottom-right"
          children={relatedComponents.length > 0 ? (
            <div className="flex flex-col items-end gap-3 text-right">
                <div className="flex flex-wrap justify-end gap-3">
                {relatedComponents.map((component) => (
                  <button
                    key={component.id}
                    type="button"
                    onClick={() => onNavigate?.(`comp-${component.id}`)}
                    className="px-3 py-2 rounded-2xl bg-white/8 border border-white/10 text-white text-[0.65rem] font-bold uppercase tracking-[0.12em] hover:border-[#8BF784] hover:text-[#8BF784] transition-all"
                  >
                    {component.name}
                  </button>
                ))}
                </div>
                <span className="text-[0.55rem] font-bold uppercase tracking-[0.24em] text-slate-300">Componentes relacionados</span>
            </div>
          ) : null}
        />

        <ContentWrapper>
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-16 items-start">
            <div className="lg:col-span-8 space-y-12">
              <div className="space-y-6">
                <SectionHeader backgroundText="CELEBRA" foregroundText={strategyContent.sectionTitle} compact />
                <p className="font-nunito text-2xl text-[#291242] leading-tight tracking-tight">{strategyContent.intro}</p>
                <p className="font-nunito text-lg text-slate-600 leading-relaxed font-light">{strategyContent.mission}</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                {strategyContent.gallery.map((image, index) => (
                  <div key={index} className="rounded-[2rem] overflow-hidden border border-slate-100 bg-slate-50 aspect-[4/5]">
                    <img src={image} alt="" className="w-full h-full object-cover" />
                  </div>
                ))}
              </div>

            </div>

            <aside className="lg:col-span-4 space-y-8">
              <div className="bg-[#291242] rounded-[2.5rem] p-10 text-white">
                <div className="flex items-end justify-between gap-4 pb-6 border-b border-white/10">
                  <div>
                    <span className="text-[0.6rem] font-bold uppercase tracking-[0.3em] text-[#8BF784]">{strategyContent.editionTag}</span>
                    <h4 className="font-gregor text-5xl font-bold uppercase leading-none mt-3">{strategyContent.editionYear}</h4>
                  </div>
                  <CalendarDays size={34} className="text-[#8BF784]" />
                </div>
                <div className="pt-6 space-y-4">
                  <h5 className="font-alternate text-2xl font-bold uppercase leading-tight">{strategyContent.editionTitle}</h5>
                  <p className="text-sm text-slate-300 font-nunito leading-relaxed">{strategyContent.editionIntro}</p>
                  <Button variant="primary" className="w-full mt-4" icon={ArrowRight} onClick={scrollToStrategyAgenda}>Descubre la programación completa</Button>
                </div>
              </div>

              <div className="bg-slate-50 border border-slate-100 rounded-[2.5rem] p-8">
                <h4 className="font-alternate text-sm font-bold uppercase tracking-[0.3em] text-slate-400 mb-6">Indicadores clave</h4>
                <div className="grid grid-cols-2 gap-4">
                  {strategyContent.stats.map((item) => (
                    <div key={item.label} className="bg-white rounded-[1.5rem] p-5 border border-slate-100">
                      <span className="font-gregor text-4xl text-[#291242] font-bold leading-none">{item.value}</span>
                      <span className="block mt-2 text-[0.6rem] font-bold uppercase tracking-[0.2em] text-slate-400">{item.label}</span>
                    </div>
                  ))}
                </div>
              </div>
            </aside>
          </div>
        </ContentWrapper>

        <ContentWrapper className="bg-slate-50/50">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-16 items-start">
            <div className="lg:col-span-5 space-y-6">
              <Tag text="Edición 2025" className="bg-[#291242] text-white" />
              <SectionHeader backgroundText="2025" foregroundText="De qué se trata" compact />
              <p className="font-nunito text-lg text-slate-600 leading-relaxed font-light">{strategyContent.editionVision}</p>
              <p className="font-nunito text-lg text-[#291242] leading-relaxed">{strategyContent.editionClosing}</p>
            </div>
            <div className="lg:col-span-7 grid grid-cols-1 md:grid-cols-3 gap-6">
              {strategyContent.tracks.map((track, index) => (
                <div key={index} className="bg-white rounded-[2.5rem] border border-slate-100 p-8 shadow-sm">
                  <div className="w-14 h-14 rounded-[1.2rem] bg-slate-50 flex items-center justify-center text-[#291242] mb-6">
                    <track.icon size={26} />
                  </div>
                  <span className="text-[0.55rem] font-bold uppercase tracking-[0.25em] text-[#00DA5E]">{track.subtitle}</span>
                  <h4 className="font-alternate text-xl text-[#291242] font-bold uppercase mt-3 mb-3 leading-tight">{track.title}</h4>
                  <p className="text-sm text-slate-500 font-nunito leading-relaxed">{track.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </ContentWrapper>

        <ContentWrapper>
          <SectionHeader backgroundText="FUNDAMENTOS" foregroundText="Fundamentos Transversales" verticalContext="BASES" />
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
            {strategyContent.foundations.map((foundation, index) => (
              <div key={index} className="group bg-white rounded-[2.3rem] border border-slate-100 p-8 hover:shadow-xl transition-all duration-500">
                <div className="w-14 h-14 rounded-[1.2rem] bg-slate-50 flex items-center justify-center text-[#291242] group-hover:bg-[#8BF784] transition-colors mb-6">
                  <foundation.icon size={24} />
                </div>
                <h4 className="font-alternate text-lg text-[#291242] font-bold uppercase mb-4 leading-tight">{foundation.title}</h4>
                <p className="text-sm text-slate-500 font-nunito leading-relaxed">{foundation.desc}</p>
              </div>
            ))}
          </div>
        </ContentWrapper>

        {strategyContent.toolkit && (
          <ContentWrapper className="bg-slate-50/50">
            <div className="space-y-5">
              <button
                type="button"
                onClick={() => setIsToolkitExpanded((prev) => !prev)}
                className={`w-full rounded-[2.75rem] bg-[#291242] text-left text-white transition-all duration-300 hover:bg-[#341754] ${
                  isToolkitExpanded ? 'px-8 py-5 lg:px-10 lg:py-5' : 'px-8 py-8 lg:px-10 lg:py-9'
                }`}
              >
                <div className={`flex gap-6 lg:items-center lg:justify-between ${isToolkitExpanded ? 'flex-row items-center' : 'flex-col lg:flex-row'}`}>
                  <div className={isToolkitExpanded ? '' : 'max-w-3xl space-y-4'}>
                    <span className="inline-flex items-center rounded-full border border-white/10 bg-white/5 px-4 py-2 font-alternate text-[0.6rem] font-bold uppercase tracking-[0.28em] text-[#8BF784]">
                      Recursos de apoyo
                    </span>
                    {!isToolkitExpanded && (
                      <div className="space-y-3">
                        <h3 className="font-gregor text-4xl lg:text-5xl text-white font-bold uppercase leading-none tracking-tighter">
                          {strategyContent.toolkit.title}
                        </h3>
                        <p className="font-nunito text-base lg:text-lg leading-relaxed text-slate-300">
                          {strategyContent.toolkit.intro}
                        </p>
                      </div>
                    )}
                  </div>
                  <div className="flex items-center justify-between gap-6 lg:justify-end">
                    <span className="font-alternate text-[0.65rem] font-bold uppercase tracking-[0.24em] text-[#8BF784]">
                      {isToolkitExpanded ? 'Cerrar sección' : 'Descarga aquí'}
                    </span>
                    <div className="flex h-14 w-14 items-center justify-center rounded-[1.2rem] border border-white/10 bg-white/5 text-[#8BF784]">
                      {isToolkitExpanded ? <ChevronUp size={22} /> : <ChevronDown size={22} />}
                    </div>
                  </div>
                </div>
              </button>

              <div
                className={`overflow-hidden transition-all duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] ${
                  isToolkitExpanded ? 'max-h-[2600px] translate-y-0 opacity-100' : 'max-h-0 -translate-y-3 opacity-0 pointer-events-none'
                }`}
              >
                <div className="rounded-[2.75rem] border border-slate-100 bg-white overflow-hidden">
                  <div className="grid grid-cols-1 xl:grid-cols-12">
                    <div className="xl:col-span-4 bg-[#291242] text-white p-10 lg:p-12 flex flex-col justify-between gap-8">
                      <div className="space-y-4">
                        <h3 className="font-gregor text-5xl text-white font-bold uppercase leading-none tracking-tighter">
                          {strategyContent.toolkit.title}
                        </h3>
                        <p className="font-nunito text-base leading-relaxed text-slate-300">
                          {strategyContent.toolkit.intro}
                        </p>
                      </div>
                      <div className="rounded-[2rem] border border-white/10 bg-white/5 p-6">
                        <span className="mb-3 block font-alternate text-[0.58rem] font-bold uppercase tracking-[0.26em] text-[#8BF784]">
                          Términos de uso
                        </span>
                        <p className="font-nunito text-sm leading-relaxed text-slate-300">
                          {strategyContent.toolkit.terms}
                        </p>
                      </div>
                    </div>
                    <div className="xl:col-span-8 p-6 lg:p-8">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {strategyContent.toolkit.resources.map((resource) => (
                          <div key={resource.title} className="group rounded-[2rem] border border-slate-100 bg-slate-50/70 p-6 transition-all duration-300 hover:bg-white hover:shadow-lg">
                            <div className="flex items-start justify-between gap-4">
                              <div className="w-12 h-12 rounded-[1rem] bg-white border border-slate-100 flex items-center justify-center text-[#291242] shrink-0">
                                <resource.icon size={22} />
                              </div>
                              <button
                                type="button"
                                className="shrink-0 font-alternate text-[0.58rem] font-bold uppercase tracking-[0.24em] text-[#291242] transition-colors hover:text-[#00DA5E]"
                              >
                                Explorar archivos
                              </button>
                            </div>
                            <div className="mt-5 space-y-3">
                              <h4 className="font-alternate text-lg text-[#291242] font-bold uppercase leading-tight">
                                {resource.title}
                              </h4>
                              <p className="font-nunito text-sm leading-relaxed text-slate-500">
                                {resource.desc}
                              </p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </ContentWrapper>
        )}

        <ContentWrapper className="bg-slate-50/40">
          <div ref={agendaSectionRef}>
            <AgendaExplorer
              lockedTag="#CelebraLaMúsica"
              title="Agenda Celebra la Música"
              bottomBanner={
                <div
                  onClick={() => onNavigate?.('agenda')}
                  className="bg-[#291242] text-white px-7 py-6 cursor-pointer group/banner transition-all duration-500 flex items-center justify-between gap-6 border border-white/5 rounded-[2.5rem] mt-8 hover:shadow-2xl hover:shadow-[#291242]/20 hover:-translate-y-1"
                >
                  <div className="flex flex-col gap-2">
                    <span className="font-alternate text-[0.65rem] font-bold uppercase tracking-[0.28em] text-[#8BF784]">Programación completa</span>
                    <span className="font-alternate text-xl lg:text-2xl font-bold uppercase leading-tight text-white">Explora toda la agenda del PNMC</span>
                    <span className="font-nunito text-[0.85rem] text-slate-300 leading-relaxed">Consulta la agenda general con toda la programación disponible del Plan Nacional de Música.</span>
                  </div>
                  <div className="bg-[#00DA5E] text-[#291242] p-3 rounded-xl transition-transform duration-500 group-hover/banner:translate-x-1 group-hover/banner:bg-white">
                    <ChevronRight size={18} strokeWidth={3} />
                  </div>
                </div>
              }
            />
          </div>
        </ContentWrapper>
      </div>
    );
  }

  return (
    <div className="bg-white min-h-screen text-left pb-20">
      <PageHero 
        tag={context} 
        title={title} 
        titleAccent="PNMC" 
        description={`Implementación estratégica para el fortalecimiento de ${title.toLowerCase()} en el territorio nacional.`} 
        bgImage="https://images.unsplash.com/photo-1774558396280-c14b21198674?q=80&w=1470&auto=format&fit=crop" 
        onBack={onBack} 
      />
      <ContentWrapper>
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-16">
          <div className="lg:col-span-8 space-y-12">
            <div className="space-y-6">
              <SectionHeader backgroundText="ESTRATEGIA" foregroundText="Ejes de Implementación" compact />
              <p className="font-nunito text-lg text-slate-600 leading-relaxed font-light">
                Esta estrategia se integra como un pilar fundamental en la arquitectura del PNMC 2025-2035, permitiendo una articulación orgánica entre los saberes locales y las políticas nacionales.
              </p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8 pt-8">
                <div className="bg-slate-50 p-8 rounded-[2rem] border border-slate-100">
                  <h4 className="font-alternate text-[#291242] text-xl uppercase font-bold mb-4">Alcance Territorial</h4>
                  <p className="text-sm text-slate-500 font-nunito leading-relaxed">Despliegue operativo en las microrregiones priorizadas, asegurando la pertinencia cultural y el diálogo entre comunidades.</p>
                </div>
                <div className="bg-[#291242] p-8 rounded-[2rem] text-white">
                  <h4 className="font-alternate text-[#8BF784] text-xl uppercase font-bold mb-4">Metas 2026</h4>
                  <ul className="space-y-3">
                    {['Consolidación de nodos regionales', 'Digitalización de acervos', 'Encuentros de saberes'].map(l => (
                      <li key={l} className="flex items-center gap-3 text-sm text-slate-300 font-nunito">
                        <CheckCircle2 size={16} className="text-[#00DA5E]" /> {l}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          </div>
          <aside className="lg:col-span-4 space-y-8">
            <div className="bg-[#00DA5E] rounded-[2.5rem] p-10 text-[#291242]">
              <h4 className="font-alternate text-2xl uppercase font-bold mb-4 leading-tight">Documentación de Estrategia</h4>
              <p className="text-sm font-nunito mb-8 leading-relaxed">Accede a los marcos técnicos y conceptuales que rigen esta línea de acción estratégica.</p>
              <Button variant="secondary" className="w-full" icon={Download}>Descargar Dossier</Button>
            </div>
          </aside>
        </div>
      </ContentWrapper>
    </div>
  );
};

const AxisSection = ({ eje, onNavigateComponent }) => {
  const [expandedIndex, setExpandedIndex] = useState(0);
  return (
    <div className="py-12 md:py-24 border-b border-slate-100 last:border-0">
      <ContentWrapper className="!py-0">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-20 items-center mb-12">
          <div className="lg:col-span-5 space-y-6">
            <div className="flex items-center gap-4"><span className="font-gregor text-6xl text-[#8BF784] font-bold leading-none">{eje.id}</span><div className="h-px flex-1 bg-slate-100"></div></div>
            <h3 className="font-alternate text-4xl lg:text-5xl text-[#291242] font-bold uppercase leading-none tracking-tight">{eje.title}</h3>
            <div className="space-y-6">
              {eje.axisExplain.map((paragraph, idx) => (
                <p key={idx} className="font-nunito text-slate-600 font-light text-base leading-relaxed">{paragraph}</p>
              ))}
            </div>
          </div>
          <div className="lg:col-span-7">
            <div className="relative rounded-[2.5rem] overflow-hidden bg-slate-100 shadow-2xl group border-8 border-slate-50 flex flex-col">
              <div className="relative aspect-video w-full overflow-hidden">
                <img src={eje.videoImg} className="w-full h-full object-cover grayscale opacity-60 group-hover:grayscale-0 transition-all duration-1000" alt="" />
                <div className="absolute inset-0 flex items-center justify-center">
                  <button className="w-20 h-20 bg-[#8BF784] text-[#291242] rounded-full flex items-center justify-center shadow-2xl hover:scale-110 active:scale-95 transition-all">
                    <Play size={32} fill="currentColor" />
                  </button>
                </div>
              </div>
              {eje.purpose && (
                <div className="bg-[#291242] p-8 relative overflow-hidden group/purpose border-t border-white/5">
                  <div className="relative z-10">
                    <div className="flex items-center gap-3 text-[#00DA5E] mb-3">
                      <Target size={20} />
                      <span className="font-alternate font-bold uppercase tracking-widest text-xs">Propósito del Eje</span>
                    </div>
                    <p className="text-white/80 font-nunito text-lg font-light leading-relaxed italic">
                      {eje.purpose}
                    </p>
                  </div>
                  <div className="absolute -right-10 -bottom-10 w-40 h-40 bg-white/5 rounded-full blur-2xl group-hover/purpose:scale-125 transition-transform duration-1000"></div>
                </div>
              )}
            </div>
          </div>
        </div>
        <div className="bg-slate-50/70 p-4 md:p-8 rounded-[2.5rem] border border-slate-100">
          <div className="mb-6 px-4"><span className="text-[0.55rem] font-bold text-slate-400 uppercase tracking-[0.3em] font-alternate block">Estructura Interna</span><h4 className="font-alternate text-lg text-[#291242] font-bold uppercase tracking-widest">Componentes del Eje {eje.id}</h4></div>
          <div className="flex flex-col gap-3">
            {eje.components.map((comp, index) => {
              const isExpanded = expandedIndex === index;
              return (
                <div key={comp.id} onClick={() => setExpandedIndex(index)} className={`relative transition-all duration-700 ease-[cubic-bezier(0.4,0,0.2,1)] cursor-pointer overflow-hidden rounded-[1.8rem] border ${isExpanded ? 'bg-white border-[#8BF784] shadow-lg' : 'bg-slate-200/50 border-transparent hover:bg-slate-200'}`}>
                  <div className={`flex items-center gap-5 px-6 py-5 md:px-8 md:py-6 transition-all duration-500 ${isExpanded ? 'border-b border-slate-100' : ''}`}>
                    <span className={`font-gregor text-2xl font-bold leading-none transition-all duration-500 ${isExpanded ? 'text-[#8BF784]' : 'text-slate-300'}`}>0{index + 1}</span>
                    <span className={`font-alternate text-[0.72rem] md:text-[0.8rem] uppercase tracking-[0.22em] font-bold transition-colors duration-500 ${isExpanded ? 'text-[#291242]' : 'text-slate-500'}`}>
                      {comp.name}
                    </span>
                  </div>
                  <div className={`overflow-hidden transition-all duration-700 ${isExpanded ? 'max-h-[420px] opacity-100' : 'max-h-0 opacity-0 pointer-events-none'}`}>
                    <div className="p-8 md:p-10 flex flex-col">
                      <Tag text={`Componente 0${index + 1}`} className="bg-[#291242] text-white mb-4 self-start" />
                      <h5 
                        onClick={(e) => { e.stopPropagation(); onNavigateComponent(comp.id); }} 
                        className="font-alternate text-2xl lg:text-3xl text-[#291242] font-bold uppercase leading-tight md:leading-tight mb-4 hover:text-[#00DA5E] cursor-pointer transition-colors duration-300"
                      >
                        {comp.name}
                      </h5>
                      <p className="font-nunito text-slate-600 text-sm leading-relaxed font-light line-clamp-3">{comp.details}</p>
                      <button 
                        onClick={(e) => { e.stopPropagation(); onNavigateComponent(comp.id); }} 
                        className="mt-8 flex items-center gap-2 text-[0.6rem] font-bold text-[#291242] uppercase font-alternate tracking-widest group/btn transition-all duration-300 hover:gap-4 hover:text-[#00DA5E]"
                      >
                        Explorar componente 
                        <ArrowUpRight size={12} className="transition-transform duration-300 group-hover/btn:translate-x-1 group-hover/btn:-translate-y-1" />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

      </ContentWrapper>
    </div>
  );
};

/* ==========================================================================
 * 06. ESTRUCTURA PROGRAMÁTICA, EJES Y COMPONENTES
 * ========================================================================== */

const ejesDataGlobal = [
  { 
    id: "01", 
    title: "MÚSICA PARA LA VIDA, EL DIÁLOGO INTERCULTURAL Y LA DIVERSIDAD BIOCULTURAL", 
    axisExplain: [
      "Este eje promueve el acceso, la apropiación y la práctica musical como derechos culturales fundamentales, entendiendo la música y lo sonoro como bienes comunes que fortalecen identidades, cohesión social y equidad en el país.",
      "Desde una perspectiva de diversidad cultural y biocultural, este eje impulsa procesos que reconocen la música como herramienta para el diálogo intercultural, la construcción de paz y la participación ciudadana."
    ],
    purpose: "Establecer la música como vehículo de inclusión, identidad y reconciliación, garantizando que todas las personas, sin distinción, puedan vivirla plenamente como parte de su vida, su territorio y su comunidad.",
    videoImg: "https://images.unsplash.com/photo-1774558396253-be05d7a37d82?q=80&w=1470&auto=format&fit=crop", 
    components: [
      { 
        id: "c1-1", 
        name: "Apropiación de la música y de los derechos culturales", 
        details: "Este componente busca fortalecer el vínculo de la ciudadanía con la música como derecho cultural y bien común.",
        fullText: [
          "Este componente busca fortalecer el vínculo de la ciudadanía con la música como derecho cultural y bien común. Promueve el acceso equitativo, la participación activa y el disfrute de la música en espacios comunitarios, educativos y culturales.",
          "Impulsa la valoración y práctica de la diversidad musical del país como motor de desarrollo social, fortalecimiento del tejido comunitario y construcción de ciudadanía."
        ]
      }, 
      { 
        id: "c1-2", 
        name: "Enfoque poblacional y cultura de paz", 
        details: "Promueve la inclusión de poblaciones históricamente excluidas en el ecosistema musical.",
        fullText: [
          "Promueve la inclusión de poblaciones históricamente excluidas en el ecosistema musical, reconociendo sus particularidades culturales y garantizando su acceso equitativo a procesos asociados a la música.",
          "Desde un enfoque de derechos y bioculturalidad, posiciona la música como medio para la reconciliación, la memoria histórica y la reconstrucción del tejido social.",
          "Incluye la participación de grupos étnicos, comunidades en situación de vulnerabilidad y otros colectivos poblacionales, así como el desarrollo de programas de formación musical en centros penitenciarios, donde la música se convierte en herramienta de resocialización, expresión creativa y desarrollo personal."
        ]
      }
    ] 
  },
  { 
    id: "02", 
    title: "FORTALECIMIENTO DE LAS PRÁCTICAS, EXPRESIONES Y OFICIOS DE LA MÚSICA", 
    axisExplain: [
      "Este eje busca fortalecer de manera integral el campo musical en Colombia, garantizando mejores condiciones para la formación, la creación, la producción, la investigación, la dotación y la circulación musical en el país.",
      "Se destaca la importancia de la memoria, la identidad y la diversidad cultural como bases para la producción artística y para la construcción del presente y el futuro del sector musical."
    ],
    purpose: "Dignificar y reconocer profesionalmente los oficios y saberes vinculados a la música, promover la equidad de oportunidades y asegurar la sostenibilidad de las diversas expresiones sonoras del territorio.",
    videoImg: "https://images.unsplash.com/photo-1774558396280-c14b21198674?q=80&w=1470&auto=format&fit=crop", 
    components: [
      { 
        id: "c2-1", 
        name: "Formación", 
        details: "Este componente impulsa procesos de cualificación para músicos, sabedores, pedagogos y otros oficios.",
        fullText: [
          "Este componente impulsa procesos de cualificación para músicos, sabedores, pedagogos, licenciados, formadores, investigadores, gestores y otros oficios del ecosistema musical. Busca consolidar la educación y formación musical como un pilar del desarrollo cultural y social del país, articulando acciones con el sistema educativo, el SINEFAC y las Escuelas Municipales y Comunitarias de Música.",
          "Promueve la estructuración y certificación de la oferta formativa, el fortalecimiento de la formación especializada en producción, gestión y ejecución musical, y la protección y transmisión de saberes tradicionales. Incorpora una perspectiva psicosocial y comunitaria que reconoce la música como herramienta para la creatividad, la cohesión social y la construcción de identidades individuales y colectivas."
        ]
      }, 
      { 
        id: "c2-2", 
        name: "Creación y producción", 
        details: "Fortalece las condiciones necesarias para la composición, experimentación y grabación musical.",
        fullText: [
          "Este componente fortalece las condiciones necesarias para la composición, interpretación, experimentación, grabación y producción musical en el país. Promueve estímulos, laboratorios y herramientas técnicas para desarrollar nuevas obras, integrar saberes tradicionales, potenciar la innovación y ampliar la diversidad sonora del territorio.",
          "Su objetivo es facilitar procesos creativos sostenibles y ampliar las posibilidades de expresión y producción de los agentes del sector musical."
        ]
      }, 
      { 
        id: "c2-3", 
        name: "Circulación", 
        details: "Componente orientado a la movilidad, visibilización y articulación de músicos, músicas, festivales, mercados y circuitos culturales en escenarios locales, nacionales e internacionales.",
        fullText: [
          "La circulación es un pilar fundamental para el fortalecimiento del ecosistema musical en Colombia, ya que permite la movilidad y visibilización de las músicas y los músicos en distintos escenarios locales, nacionales e internacionales. Este componente busca consolidar redes de colaboración, potenciar festivales y mercados musicales, e integrar a los artistas en diversos circuitos culturales, facilitando el acceso a oportunidades de difusión y profesionalización.",
          "Las acciones particulares de este componente incluyen la dinamización de espacios para la circulación musical, promoviendo la programación en escenarios convencionales y no convencionales y articulando esfuerzos con el CNA, la Red Nacional de Teatros y Escenarios Públicos y Patrimoniales, el programa Salas Concertadas, Espacios Vivos y otras estrategias territoriales para activar espacios urbanos y rurales con vocación de música en vivo.",
          "También impulsa Territorios Sonoros de Colombia como una estrategia de alcance nacional que articula la circulación musical con el turismo cultural y comunitario. Esta línea fortalece festivales, procesos de lutería y experiencias de formación de públicos, y dialoga con la implementación de los territorios creativos, bioculturales y de los saberes como instrumentos clave de gestión territorial y desarrollo local.",
          "De igual forma, plantea una estrategia integral de circulación musical en el marco del Sistema Nacional de Circulación de las Culturas, las Artes y los Saberes, en consonancia con los lineamientos del artículo 189 de la Ley 2294 de 2023, proyectando la movilidad de músicos, obras, productos y servicios en contextos locales, regionales, nacionales e internacionales.",
          "Finalmente, propone el fomento de redes y circulación colectiva mediante el fortalecimiento de redes de prácticas musicales, encuentros, circuitos colaborativos y plataformas de intercambio que faciliten la movilidad de artistas, agrupaciones y proyectos, optimicen recursos, fortalezcan economías a escala y contribuyan a descentralizar la circulación musical."
        ]
      }, 
      { 
        id: "c2-4", 
        name: "Memoria, investigación y documentación", 
        details: "Impulsa la preservación, investigación y difusión del patrimonio sonoro del país.",
        fullText: [
          "Este componente impulsa la preservación, investigación y difusión del patrimonio sonoro del país. Articula el conocimiento académico con los saberes comunitarios y ancestrales para documentar repertorios, prácticas y trayectorias musicales.",
          "Busca fortalecer la memoria musical como elemento esencial para la apropiación cultural, la revitalización de expresiones locales y la transmisión intergeneracional de saberes."
        ]
      }, 
      { 
        id: "c2-5", 
        name: "Información y comunicación", 
        details: "Fortalece la recopilación y divulgación de datos del sector musical nacional.",
        fullText: [
          "El acceso a información clara, actualizada y estructurada es clave para la toma de decisiones y el diseño de políticas públicas pertinentes. Este componente fortalece la recopilación, sistematización y divulgación de datos del sector musical, promoviendo herramientas como el SIMUS y estrategias de comunicación que permitan a gestores, instituciones, investigadores y ciudadanía comprender y usar la información del ecosistema musical."
        ]
      }, 
      { 
        id: "c2-6", 
        name: "Dotación e infraestructura", 
        details: "Garantiza el acceso a instrumentos, herramientas técnicas y espacios adecuados.",
        fullText: [
          "Este componente garantiza el acceso a instrumentos, herramientas técnicas y espacios adecuados para la formación, creación y circulación musical.",
          "Promueve la dotación de instrumentos en centros de formación, el mejoramiento de infraestructura en Escuelas Municipales y Comunitarias de Música, y la adecuación de espacios para prácticas, ensayos, grabaciones y presentaciones, asegurando condiciones dignas y equitativas en los territorios."
        ]
      }
    ] 
  },
  { 
    id: "03", 
    title: "GOBERNANZA MUSICAL E INTEGRACIÓN CULTURAL E INTERSECTORIAL", 
    axisExplain: [
      "Este eje promueve el fortalecimiento de los mecanismos de organización, participación y articulación del sector musical con y desde el Estado.",
      "Consolidando una gobernanza efectiva que garantice la sostenibilidad cultural del ecosistema musical en Colombia."
    ],
    purpose: "Consolidar una gobernanza sólida y una articulación intersectorial amplia que potencie la capacidad de la música para incidir en la transformación social, la construcción de paz y la reducción de desigualdades.",
    videoImg: "https://images.unsplash.com/photo-1774558396253-be05d7a37d82?q=80&w=1470&auto=format&fit=crop", 
    components: [
      { 
        id: "c3-1", 
        name: "Participación ciudadana, intersectorialidad y articulación territorial", 
        details: "Fortalece la participación activa del sector musical en las políticas públicas.",
        fullText: [
          "Este componente busca fortalecer la participación activa del sector musical en la formulación y ejecución de políticas públicas, promoviendo espacios de diálogo, concertación y decisión colectiva como los Comités Departamentales de Música y los Planes Departamentales de Desarrollo Musical.",
          "Además, impulsa la creación de asociaciones, redes y plataformas colaborativas que consolidan el tejido organizativo local y dinamizan los procesos musicales en los territorios. También fomenta la articulación con otros sectores estratégicos como educación, economía, medio ambiente y tecnología, promoviendo coordinaciones mixtas entre Estado y sociedad civil para garantizar políticas inclusivas, sostenibles y que reflejen las necesidades y aspiraciones de las comunidades."
        ]
      }, 
      { 
        id: "c3-2", 
        name: "Sostenibilidad, condiciones laborales y economías de la música", 
        details: "Se centra en mejorar las condiciones laborales y económicas de los actores del ecosistema.",
        fullText: [
          "Este componente se centra en mejorar las condiciones laborales y económicas de los actores del ecosistema musical, promoviendo la formalización, la seguridad social, la dignificación del trabajo y el fortalecimiento de capacidades en gestión, producción y emprendimiento.",
          "Busca consolidar economías musicales territoriales a través de procesos de producción, circulación y comercialización que respondan a las dinámicas locales, fomentando modelos sostenibles que involucren al Estado, la sociedad civil y la empresa privada. Su objetivo es garantizar que la música sea cultural, social y económicamente viable, contribuyendo a la autonomía del sector, la reducción de desigualdades y la resiliencia de un ecosistema diverso."
        ]
      }
    ] 
  }
];

const EjesPage = ({ onBack, onNavigateComponent }) => {
  return (
    <div className="bg-white min-h-screen pb-20 text-left">
      <PageHero tag="Ejes" title="Ejes de" titleAccent="Transformación" description="Explora las dimensiones fundamentales del PNMC." bgImage="https://images.unsplash.com/photo-1774558396253-be05d7a37d82?q=80&w=1470&auto=format&fit=crop" onBack={onBack} />
      {ejesDataGlobal.map((eje, index) => (
        <div 
          key={eje.id} 
          id={
            index === 0 
              ? 'musica-para-la-vida' 
              : index === 1 
              ? 'oficios-y-practicas' 
              : 'gobernanza'
          }
          className="scroll-mt-24"
        >
          <AxisSection eje={eje} onNavigateComponent={onNavigateComponent} />
        </div>
      ))}
    </div>
  );
};

const MapaParticipaPage = ({ onBack }) => {
  const participationSectionRef = useRef(null);
  const [participationForm, setParticipationForm] = useState(() => {
    if (typeof window === 'undefined') return createMapParticipationFormState();

    try {
      const storedDraft = window.localStorage.getItem(MAP_PARTICIPATION_DRAFT_STORAGE_KEY);

      if (!storedDraft) return createMapParticipationFormState();

      const parsedDraft = JSON.parse(storedDraft);
      const normalizedDraft = parsedDraft?.actorType === 'school'
        ? {
            ...parsedDraft,
            actorType: 'individual',
          }
        : parsedDraft;
      const migratedIndividualDraft = normalizedDraft?.actorType === 'individual' && normalizedDraft.actorName && !normalizedDraft.individualFirstName && !normalizedDraft.individualLastName
        ? {
            ...normalizedDraft,
            individualFirstName: normalizedDraft.actorName,
          }
        : normalizedDraft;
      const migratedDraft = migratedIndividualDraft?.actorType === 'market' && Array.isArray(migratedIndividualDraft.marketHabitualMonths) === false
        ? {
            ...migratedIndividualDraft,
            marketHabitualMonths: migratedIndividualDraft.marketHabitualMonth
              ? [migratedIndividualDraft.marketHabitualMonth]
              : [],
          }
        : migratedIndividualDraft;
      const migratedFestivalDraft = migratedDraft?.actorType === 'festival' && Array.isArray(migratedDraft.festivalHabitualMonths) === false
        ? {
            ...migratedDraft,
            festivalHabitualMonths: migratedDraft.festivalMonth
              ? [migratedDraft.festivalMonth]
              : [],
          }
        : migratedDraft;

      return {
        ...createMapParticipationFormState(),
        ...migratedFestivalDraft,
      };
    } catch (error) {
      console.warn('No se pudo recuperar el borrador del formulario de participación:', error);
      return createMapParticipationFormState();
    }
  });
  const [participationErrors, setParticipationErrors] = useState({});
  const [lastParticipationSubmission, setLastParticipationSubmission] = useState(null);
  const [participationWorkbookFeedback, setParticipationWorkbookFeedback] = useState(null);
  const [isPersistingParticipation, setIsPersistingParticipation] = useState(false);

  const participationMunicipalities = useMemo(
    () => getMapParticipationMunicipalities(participationForm.department),
    [participationForm.department]
  );
  const activeParticipationActor = useMemo(
    () => MAP_PARTICIPATION_ACTOR_OPTIONS.find((option) => option.key === participationForm.actorType) || MAP_PARTICIPATION_ACTOR_OPTIONS[0],
    [participationForm.actorType]
  );
  const activeParticipationFields = useMemo(
    () => MAP_PARTICIPATION_FIELDSETS[participationForm.actorType] || [],
    [participationForm.actorType]
  );
  const activeParticipationIdentity = useMemo(
    () => MAP_PARTICIPATION_IDENTITY_COPY[participationForm.actorType] || MAP_PARTICIPATION_IDENTITY_COPY.organization,
    [participationForm.actorType]
  );
  const activeParticipationRoleOptions = useMemo(
    () => MAP_PARTICIPATION_ROLE_OPTIONS[participationForm.actorType] || MAP_PARTICIPATION_ROLE_OPTIONS.default,
    [participationForm.actorType]
  );
  const isIndividualParticipation = participationForm.actorType === 'individual';
  const isFestivalParticipation = participationForm.actorType === 'festival';
  const isMarketParticipation = participationForm.actorType === 'market';
  const resolvedParticipationActorName = useMemo(() => {
    if (!isIndividualParticipation) return participationForm.actorName.trim();
    return [participationForm.individualFirstName, participationForm.individualLastName]
      .map((value) => value.trim())
      .filter(Boolean)
      .join(' ');
  }, [isIndividualParticipation, participationForm.actorName, participationForm.individualFirstName, participationForm.individualLastName]);
  const festivalUsesMultiMonthSelection = ['Semestral', 'Trimestral'].includes(participationForm.festivalFrequency);
  const festivalUsesDateRange = Number(participationForm.festivalDurationDays) > 1;
  const marketUsesMultiMonthSelection = ['Semestral', 'Trimestral'].includes(participationForm.marketFrequency);

  const handleParticipationFieldChange = useCallback((field, value) => {
    setParticipationForm((current) => {
      const nextValue = typeof value === 'function' ? value(current[field]) : value;
      const nextForm = {
        ...current,
        [field]: nextValue,
      };

      if (field === 'actorType') {
        nextForm.roles = [];
      }

      if (field === 'department') {
        const nextMunicipalities = getMapParticipationMunicipalities(nextValue);

        if (!municipalityExistsInList(current.municipality, nextMunicipalities)) {
          nextForm.municipality = '';
        }
      }

      if (field === 'hasArtisticName' && !nextValue) {
        nextForm.artisticName = '';
      }

      if (field === 'linkedFestival' && nextValue !== 'Sí') {
        nextForm.linkedFestivalName = '';
      }

      if (field === 'festivalFrequency') {
        if (!['Semestral', 'Trimestral'].includes(nextValue)) {
          nextForm.festivalHabitualMonths = current.festivalHabitualMonths?.[0] ? [current.festivalHabitualMonths[0]] : [];
        }
      }

      if (field === 'festivalVenueMode') {
        if (nextValue === 'Varias ciudades o municipios') {
          nextForm.festivalAdditionalLocations = current.festivalAdditionalLocations?.length
            ? current.festivalAdditionalLocations
            : [{ department: '', municipality: '' }];
        } else {
          nextForm.festivalAdditionalLocations = [];
        }
      }

      if (field === 'festivalDurationDays') {
        if (Number(nextValue) > 1) {
          nextForm.festivalThisYearDate = '';
        } else {
          nextForm.festivalThisYearStartDate = '';
          nextForm.festivalThisYearEndDate = '';
        }
      }

      if (field === 'festivalThisYearStatus') {
        if (!['Ya se realizó', 'Se va a realizar'].includes(nextValue)) {
          nextForm.festivalThisYearDate = '';
          nextForm.festivalThisYearStartDate = '';
          nextForm.festivalThisYearEndDate = '';
        }

        if (nextValue !== 'Se va a realizar') {
          nextForm.festivalCurrentOpenCall = '';
          nextForm.festivalOpenCallDeadline = '';
        }
      }

      if (field === 'openCall' && nextValue !== 'Sí') {
        nextForm.festivalCurrentOpenCall = '';
        nextForm.festivalOpenCallDeadline = '';
      }

      if (field === 'festivalCurrentOpenCall' && nextValue !== 'Sí') {
        nextForm.festivalOpenCallDeadline = '';
      }

      if (field === 'marketThisYearStatus') {
        if (nextValue !== 'Se va a realizar') {
          nextForm.marketThisYearMonth = '';
        }

        if (nextValue !== 'Ya se realizó') {
          nextForm.marketThisYearDate = '';
        }
      }

      if (field === 'marketFrequency') {
        if (!['Semestral', 'Trimestral'].includes(nextValue)) {
          nextForm.marketHabitualMonths = current.marketHabitualMonths?.[0] ? [current.marketHabitualMonths[0]] : [];
        }
      }

      if (field === 'marketThisYearStatus' && nextValue === 'Está por confirmar') {
        nextForm.marketThisYearMonth = '';
      }

      return nextForm;
    });

    setParticipationErrors((current) => {
      const hasDependentErrorHandling = [
        'actorType',
        'department',
        'hasArtisticName',
        'linkedFestival',
        'festivalFrequency',
        'festivalDurationDays',
        'festivalVenueMode',
        'festivalThisYearStatus',
        'openCall',
        'festivalCurrentOpenCall',
        'marketThisYearStatus',
        'marketFrequency',
      ].includes(field);

      if (!current[field] && !hasDependentErrorHandling) return current;

      const nextErrors = { ...current };
      delete nextErrors[field];

      if (field === 'department') {
        delete nextErrors.municipality;
      }

      if (field === 'actorType') {
        delete nextErrors.actorName;
        delete nextErrors.individualFirstName;
        delete nextErrors.individualLastName;
        delete nextErrors.identificationType;
        delete nextErrors.identificationNumber;
        delete nextErrors.contactName;
        delete nextErrors.contactRole;
        delete nextErrors.responsibleEntity;
        delete nextErrors.territoryScope;
        delete nextErrors.roles;
        delete nextErrors.artisticName;
        delete nextErrors.festivalHabitualMonths;
        delete nextErrors.festivalDurationDays;
        delete nextErrors.festivalThisYearDate;
        delete nextErrors.festivalThisYearStartDate;
        delete nextErrors.festivalThisYearEndDate;
        delete nextErrors.festivalAdditionalLocations;
        delete nextErrors.festivalCurrentOpenCall;
        delete nextErrors.festivalOpenCallDeadline;
        delete nextErrors.linkedFestivalName;
        delete nextErrors.marketHabitualMonths;
        delete nextErrors.marketThisYearMonth;
        delete nextErrors.marketThisYearDate;
      }

      if (field === 'hasArtisticName' && !value) {
        delete nextErrors.artisticName;
      }

      if (field === 'linkedFestival' && value !== 'Sí') {
        delete nextErrors.linkedFestivalName;
      }

      if (field === 'festivalFrequency') {
        delete nextErrors.festivalHabitualMonths;
      }

      if (field === 'festivalDurationDays') {
        delete nextErrors.festivalThisYearDate;
        delete nextErrors.festivalThisYearStartDate;
        delete nextErrors.festivalThisYearEndDate;
      }

      if (field === 'festivalVenueMode') {
        delete nextErrors.festivalAdditionalLocations;
      }

      if (field === 'festivalThisYearStatus') {
        delete nextErrors.festivalThisYearDate;
        delete nextErrors.festivalThisYearStartDate;
        delete nextErrors.festivalThisYearEndDate;
        delete nextErrors.festivalCurrentOpenCall;
        delete nextErrors.festivalOpenCallDeadline;
      }

      if (field === 'openCall') {
        delete nextErrors.festivalCurrentOpenCall;
        delete nextErrors.festivalOpenCallDeadline;
      }

      if (field === 'festivalCurrentOpenCall') {
        delete nextErrors.festivalOpenCallDeadline;
      }

      if (field === 'marketThisYearStatus') {
        delete nextErrors.marketThisYearMonth;
        delete nextErrors.marketThisYearDate;
      }

      if (field === 'marketFrequency') {
        delete nextErrors.marketHabitualMonths;
      }

      return nextErrors;
    });
  }, []);

  const addFestivalLocation = useCallback(() => {
    setParticipationForm((current) => ({
      ...current,
      festivalAdditionalLocations: [
        ...(current.festivalAdditionalLocations || []),
        { department: '', municipality: '' },
      ],
    }));

    setParticipationErrors((current) => {
      if (!current.festivalAdditionalLocations) return current;
      const nextErrors = { ...current };
      delete nextErrors.festivalAdditionalLocations;
      return nextErrors;
    });
  }, []);

  const updateFestivalLocation = useCallback((index, field, value) => {
    setParticipationForm((current) => {
      const nextLocations = [...(current.festivalAdditionalLocations || [])];
      const currentLocation = nextLocations[index] || { department: '', municipality: '' };
      const nextLocation = {
        ...currentLocation,
        [field]: value,
      };

      if (field === 'department') {
        const municipalities = getMapParticipationMunicipalities(value);

        if (!municipalityExistsInList(currentLocation.municipality, municipalities)) {
          nextLocation.municipality = '';
        }
      }

      nextLocations[index] = nextLocation;

      return {
        ...current,
        festivalAdditionalLocations: nextLocations,
      };
    });

    setParticipationErrors((current) => {
      if (!current.festivalAdditionalLocations) return current;
      const nextErrors = { ...current };
      delete nextErrors.festivalAdditionalLocations;
      return nextErrors;
    });
  }, []);

  const removeFestivalLocation = useCallback((index) => {
    setParticipationForm((current) => ({
      ...current,
      festivalAdditionalLocations: (current.festivalAdditionalLocations || []).filter((_, itemIndex) => itemIndex !== index),
    }));

    setParticipationErrors((current) => {
      if (!current.festivalAdditionalLocations) return current;
      const nextErrors = { ...current };
      delete nextErrors.festivalAdditionalLocations;
      return nextErrors;
    });
  }, []);

  const toggleParticipationRole = useCallback((role) => {
    setParticipationForm((current) => ({
      ...current,
      roles: current.roles.includes(role)
        ? current.roles.filter((item) => item !== role)
        : [...current.roles, role],
    }));

    setParticipationErrors((current) => {
      if (!current.roles) return current;
      const nextErrors = { ...current };
      delete nextErrors.roles;
      return nextErrors;
    });
  }, []);

  const resetParticipationForm = useCallback(() => {
    setParticipationForm(createMapParticipationFormState());
    setParticipationErrors({});
    setParticipationWorkbookFeedback(null);

    if (typeof window !== 'undefined') {
      window.localStorage.removeItem(MAP_PARTICIPATION_DRAFT_STORAGE_KEY);
    }
  }, []);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    try {
      window.localStorage.setItem(MAP_PARTICIPATION_DRAFT_STORAGE_KEY, JSON.stringify(participationForm));
    } catch (error) {
      console.warn('No se pudo guardar el borrador del formulario de participación:', error);
    }
  }, [participationForm]);

  const handleParticipationSubmit = useCallback(async (event) => {
    event.preventDefault();
    setParticipationWorkbookFeedback(null);

    const nextErrors = {};
    const activeRequiredFields = activeParticipationFields.filter((field) => hasMapParticipationValue(participationForm[field.key]) === false);

    activeRequiredFields.forEach((field) => {
      nextErrors[field.key] = getMapParticipationFieldErrorMessage(field);
    });

    if (isIndividualParticipation) {
      if (!participationForm.individualFirstName.trim()) nextErrors.individualFirstName = 'Escribe los nombres.';
      if (!participationForm.individualLastName.trim()) nextErrors.individualLastName = 'Escribe los apellidos.';
    } else if (!participationForm.actorName.trim()) {
      nextErrors.actorName = activeParticipationIdentity.actorNameError;
    }
    if (activeParticipationIdentity.showIdentificationFields && !participationForm.identificationType) {
      nextErrors.identificationType = 'Selecciona el tipo de identificación.';
    }
    if (activeParticipationIdentity.showIdentificationFields && !participationForm.identificationNumber.trim()) {
      nextErrors.identificationNumber = 'Escribe el número de identificación.';
    }
    if (isIndividualParticipation && participationForm.hasArtisticName && !participationForm.artisticName.trim()) {
      nextErrors.artisticName = 'Escribe el nombre artístico.';
    }
    if (activeParticipationIdentity.showResponsibleEntity && !participationForm.responsibleEntity.trim()) {
      nextErrors.responsibleEntity = 'Completa este campo.';
    }
    if (activeParticipationIdentity.showContactFields && !participationForm.contactName.trim()) {
      nextErrors.contactName = 'Indica una persona de contacto.';
    }
    if (activeParticipationIdentity.showContactFields && !participationForm.contactRole.trim()) {
      nextErrors.contactRole = 'Completa este campo.';
    }
    if (!participationForm.email.trim()) {
      nextErrors.email = 'Escribe un correo de contacto.';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(participationForm.email.trim())) {
      nextErrors.email = 'Escribe un correo válido.';
    }
    if (!participationForm.phone.trim()) {
      nextErrors.phone = 'Escribe un teléfono o celular.';
    }
    if (!participationForm.department) nextErrors.department = 'Selecciona un departamento.';
    if (!participationForm.municipality) nextErrors.municipality = 'Selecciona un municipio o ciudad.';
    if (activeParticipationIdentity.showTerritoryScope && !participationForm.territoryScope) {
      nextErrors.territoryScope = 'Selecciona el alcance territorial.';
    }
    if (activeParticipationIdentity.showRoleSection !== false && participationForm.roles.length === 0) {
      nextErrors.roles = 'Selecciona al menos una función dentro del ecosistema.';
    }
    if (isFestivalParticipation && !participationForm.festivalDurationDays) {
      nextErrors.festivalDurationDays = 'Indica cuántos días dura el festival.';
    }
    if (isFestivalParticipation && participationForm.festivalFrequency && participationForm.festivalHabitualMonths.length === 0) {
      nextErrors.festivalHabitualMonths = festivalUsesMultiMonthSelection
        ? 'Selecciona los meses en los que habitualmente se realiza.'
        : 'Selecciona el mes en el que habitualmente se realiza.';
    }
    if (isFestivalParticipation && participationForm.festivalVenueMode === 'Varias ciudades o municipios') {
      const additionalLocations = participationForm.festivalAdditionalLocations || [];
      const hasCompleteAdditionalLocation = additionalLocations.some((location) => location.department && location.municipality);
      const hasIncompleteAdditionalLocation = additionalLocations.some((location) => (location.department && !location.municipality) || (!location.department && location.municipality));

      if (!hasCompleteAdditionalLocation || hasIncompleteAdditionalLocation) {
        nextErrors.festivalAdditionalLocations = 'Agrega al menos una sede adicional completa con departamento y municipio.';
      }
    }
    if (isFestivalParticipation && ['Ya se realizó', 'Se va a realizar'].includes(participationForm.festivalThisYearStatus)) {
      if (festivalUsesDateRange) {
        if (!participationForm.festivalThisYearStartDate) nextErrors.festivalThisYearStartDate = 'Selecciona la fecha de inicio.';
        if (!participationForm.festivalThisYearEndDate) nextErrors.festivalThisYearEndDate = 'Selecciona la fecha de finalización.';
      } else if (!participationForm.festivalThisYearDate) {
        nextErrors.festivalThisYearDate = 'Selecciona la fecha.';
      }
    }
    if (isFestivalParticipation && participationForm.openCall === 'Sí' && participationForm.festivalThisYearStatus === 'Se va a realizar' && !participationForm.festivalCurrentOpenCall) {
      nextErrors.festivalCurrentOpenCall = 'Indica si actualmente tienen convocatoria abierta.';
    }
    if (isFestivalParticipation && participationForm.openCall === 'Sí' && participationForm.festivalThisYearStatus === 'Se va a realizar' && participationForm.festivalCurrentOpenCall === 'Sí' && !participationForm.festivalOpenCallDeadline) {
      nextErrors.festivalOpenCallDeadline = 'Selecciona la fecha exacta de cierre.';
    }
    if (isMarketParticipation && participationForm.marketFrequency && participationForm.marketHabitualMonths.length === 0) {
      nextErrors.marketHabitualMonths = marketUsesMultiMonthSelection
        ? 'Selecciona los meses en los que habitualmente se realiza.'
        : 'Selecciona el mes en el que habitualmente se realiza.';
    }
    if (isMarketParticipation && participationForm.linkedFestival === 'Sí' && !participationForm.linkedFestivalName.trim()) {
      nextErrors.linkedFestivalName = 'Escribe el festival con el que se articula.';
    }
    if (isMarketParticipation && participationForm.marketThisYearStatus === 'Se va a realizar' && !participationForm.marketThisYearMonth) {
      nextErrors.marketThisYearMonth = 'Selecciona el mes.';
    }
    if (isMarketParticipation && participationForm.marketThisYearStatus === 'Ya se realizó' && !participationForm.marketThisYearDate) {
      nextErrors.marketThisYearDate = 'Selecciona la fecha exacta.';
    }
    if (!participationForm.musicalFields.trim()) nextErrors.musicalFields = 'Completa este campo.';
    if (!participationForm.description.trim()) nextErrors.description = 'Describe brevemente el proceso o iniciativa.';
    if (!participationForm.contribution.trim()) nextErrors.contribution = 'Cuéntanos qué aporta tu proceso al ecosistema musical.';
    if (!isMarketParticipation && !participationForm.needs.trim()) nextErrors.needs = 'Completa este campo.';
    if (!participationForm.consent) nextErrors.consent = 'Debes autorizar el tratamiento de la información para continuar.';

    if (Object.keys(nextErrors).length > 0) {
      setParticipationErrors(nextErrors);
      window.requestAnimationFrame(() => {
        window.requestAnimationFrame(() => {
          scrollToElementWithOffset(participationSectionRef.current);
        });
      });
      return;
    }

    const reference = buildMapParticipationReference();
    const submissionPayload = {
      ...participationForm,
      actorName: resolvedParticipationActorName,
      reference,
      submittedAt: new Date().toISOString(),
      actorTypeLabel: activeParticipationActor.label,
    };
    let nextQueue = [submissionPayload];

    if (typeof window !== 'undefined') {
      try {
        const storedQueue = JSON.parse(window.localStorage.getItem(MAP_PARTICIPATION_QUEUE_STORAGE_KEY) || '[]');
        nextQueue = [submissionPayload, ...storedQueue].slice(0, 500);
      } catch (error) {
        console.warn('No se pudo leer la cola local de participación:', error);
      }
    }

    setIsPersistingParticipation(true);

    try {
      const workbookResult = await persistMapParticipationWorkbook({
        submissionPayload,
        queuedRecords: nextQueue,
      });

      if (typeof window !== 'undefined') {
        try {
          window.localStorage.setItem(MAP_PARTICIPATION_QUEUE_STORAGE_KEY, JSON.stringify(nextQueue));
          window.localStorage.removeItem(MAP_PARTICIPATION_DRAFT_STORAGE_KEY);
        } catch (error) {
          console.warn('No se pudo guardar la ficha de participación:', error);
        }
      }

      setLastParticipationSubmission({
        reference,
        actorName: resolvedParticipationActorName,
        actorTypeLabel: activeParticipationActor.label,
        department: participationForm.department,
        municipality: participationForm.municipality,
        workbookMessage: workbookResult.message,
        workbookFileName: workbookResult.fileName,
      });
      setParticipationWorkbookFeedback({
        type: 'success',
        message: workbookResult.message,
      });
      setParticipationErrors({});
      setParticipationForm(createMapParticipationFormState());

      window.requestAnimationFrame(() => {
        window.requestAnimationFrame(() => {
          scrollToElementWithOffset(participationSectionRef.current);
        });
      });
    } catch (error) {
      setParticipationWorkbookFeedback({
        type: 'error',
        message: error instanceof Error ? error.message : 'No se pudo guardar la ficha en el archivo Excel.',
      });
    } finally {
      setIsPersistingParticipation(false);
    }
  }, [activeParticipationActor.label, activeParticipationFields, activeParticipationIdentity, festivalUsesDateRange, festivalUsesMultiMonthSelection, isFestivalParticipation, isIndividualParticipation, isMarketParticipation, marketUsesMultiMonthSelection, participationForm, resolvedParticipationActorName]);

  const participationInputClassName = 'mt-3 w-full rounded-[1.15rem] border border-slate-200 bg-white px-4 py-3 text-[0.78rem] text-[#291242] outline-none transition-all focus:border-[#00DA5E]';
  const participationTextAreaClassName = `${participationInputClassName} min-h-[128px] resize-y`;
  const participationErrorClassName = 'mt-2 text-[0.68rem] text-rose-500';
  const ActiveParticipationIcon = activeParticipationActor.icon;
  const renderParticipationField = (field) => {
    const fieldId = `map-participation-${field.key}`;
    const fieldValue = participationForm[field.key] ?? '';

    return (
      <label key={field.key} htmlFor={fieldId} className={field.type === 'textarea' ? 'xl:col-span-2' : ''}>
        <span className="text-[0.56rem] font-bold uppercase tracking-[0.18em] text-slate-400">{field.label}</span>
        {field.type === 'select' ? (
          <select
            id={fieldId}
            value={fieldValue}
            onChange={(event) => handleParticipationFieldChange(field.key, event.target.value)}
            className={participationInputClassName}
          >
            <option value="">Selecciona una opción</option>
            {field.options.map((option) => (
              <option key={option} value={option}>{option}</option>
            ))}
          </select>
        ) : field.type === 'textarea' ? (
          <textarea
            id={fieldId}
            rows={field.rows || 4}
            value={fieldValue}
            onChange={(event) => handleParticipationFieldChange(field.key, event.target.value)}
            className={participationTextAreaClassName}
          />
        ) : (
          <input
            id={fieldId}
            type={field.type || 'text'}
            min={field.min}
            max={field.max}
            value={fieldValue}
            onChange={(event) => handleParticipationFieldChange(field.key, event.target.value)}
            className={participationInputClassName}
          />
        )}
        {participationErrors[field.key] && <p className={participationErrorClassName}>{participationErrors[field.key]}</p>}
      </label>
    );
  };
  const renderParticipationSpecificSection = () => {
    if (isIndividualParticipation) {
      const profileField = activeParticipationFields.find((field) => field.key === 'individualProfile');
      const trajectoryField = activeParticipationFields.find((field) => field.key === 'trajectoryYears');
      const linkedProcessesField = activeParticipationFields.find((field) => field.key === 'linkedProcesses');

      return (
        <div>
          <p className="text-[0.56rem] font-bold uppercase tracking-[0.18em] text-slate-400">3. Información específica del registro individual</p>
          <div className="mt-4 grid grid-cols-1 gap-4 xl:grid-cols-2">
            {profileField && renderParticipationField(profileField)}

            <div className="rounded-[1.3rem] border border-slate-200 bg-white px-4 py-4 xl:col-span-2">
              <span className="text-[0.56rem] font-bold uppercase tracking-[0.18em] text-slate-400">¿Tiene un nombre artístico diferente a su nombre real?</span>
              <div className="mt-4 flex flex-wrap gap-2">
                {[
                  { label: 'Sí', value: true },
                  { label: 'No', value: false },
                ].map((option) => (
                  <button
                    key={option.label}
                    type="button"
                    onClick={() => handleParticipationFieldChange('hasArtisticName', option.value)}
                    className={`rounded-full px-4 py-2 text-[0.56rem] font-bold uppercase tracking-[0.14em] transition-all ${participationForm.hasArtisticName === option.value ? 'border border-[#291242] bg-[#291242] text-white' : 'border border-slate-200 bg-slate-50 text-slate-500 hover:border-[#8BF784] hover:text-[#291242]'}`}
                  >
                    {option.label}
                  </button>
                ))}
              </div>
            </div>

            {participationForm.hasArtisticName && (
              <label htmlFor="map-participation-artistic-name" className="xl:col-span-2">
                <span className="text-[0.56rem] font-bold uppercase tracking-[0.18em] text-slate-400">Nombre artístico</span>
                <input
                  id="map-participation-artistic-name"
                  type="text"
                  value={participationForm.artisticName}
                  onChange={(event) => handleParticipationFieldChange('artisticName', event.target.value)}
                  className={participationInputClassName}
                  placeholder="Escribe el nombre artístico"
                />
                {participationErrors.artisticName && <p className={participationErrorClassName}>{participationErrors.artisticName}</p>}
              </label>
            )}

            {trajectoryField && renderParticipationField(trajectoryField)}
            {linkedProcessesField && renderParticipationField(linkedProcessesField)}

            <label htmlFor="map-participation-musical-fields" className="xl:col-span-2">
              <span className="text-[0.56rem] font-bold uppercase tracking-[0.18em] text-slate-400">Áreas, prácticas o énfasis de trabajo musical</span>
              <textarea
                id="map-participation-musical-fields"
                rows={4}
                value={participationForm.musicalFields}
                onChange={(event) => handleParticipationFieldChange('musicalFields', event.target.value)}
                className={participationTextAreaClassName}
              />
              {participationErrors.musicalFields && <p className={participationErrorClassName}>{participationErrors.musicalFields}</p>}
            </label>
          </div>
        </div>
      );
    }

    if (isFestivalParticipation) {
      const festivalDurationField = activeParticipationFields.find((field) => field.key === 'festivalDurationDays');
      const festivalSettingField = activeParticipationFields.find((field) => field.key === 'festivalSetting');
      const festivalVenueModeField = activeParticipationFields.find((field) => field.key === 'festivalVenueMode');
      const festivalFrequencyField = activeParticipationFields.find((field) => field.key === 'festivalFrequency');
      const festivalVersionsField = activeParticipationFields.find((field) => field.key === 'festivalVersions');
      const festivalTicketingField = activeParticipationFields.find((field) => field.key === 'festivalTicketing');
      const openCallField = activeParticipationFields.find((field) => field.key === 'openCall');
      const festivalThisYearStatusField = activeParticipationFields.find((field) => field.key === 'festivalThisYearStatus');
      const festivalDateLabel = participationForm.festivalThisYearStatus === 'Ya se realizó'
        ? 'Fecha exacta en la que se realizó'
        : 'Fecha exacta en la que se realizará';
      const festivalStartDateLabel = participationForm.festivalThisYearStatus === 'Ya se realizó'
        ? 'Fecha de inicio en la que se realizó'
        : 'Fecha de inicio programada';
      const festivalEndDateLabel = participationForm.festivalThisYearStatus === 'Ya se realizó'
        ? 'Fecha de finalización en la que se realizó'
        : 'Fecha de finalización programada';

      return (
        <div>
          <p className="text-[0.56rem] font-bold uppercase tracking-[0.18em] text-slate-400">4. Información específica del festival</p>
          <div className="mt-4 grid grid-cols-1 gap-4 xl:grid-cols-2">
            {festivalDurationField && renderParticipationField(festivalDurationField)}
            {festivalSettingField && renderParticipationField(festivalSettingField)}
            {festivalVenueModeField && renderParticipationField(festivalVenueModeField)}
            {festivalFrequencyField && renderParticipationField(festivalFrequencyField)}
            {festivalVersionsField && renderParticipationField(festivalVersionsField)}
            {festivalTicketingField && renderParticipationField(festivalTicketingField)}

            {participationForm.festivalVenueMode === 'Varias ciudades o municipios' && (
              <div className="xl:col-span-2 rounded-[1.3rem] border border-slate-200 bg-white px-4 py-4">
                <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                  <div>
                    <span className="text-[0.56rem] font-bold uppercase tracking-[0.18em] text-slate-400">Sedes adicionales del festival</span>
                    <p className="mt-2 max-w-2xl text-[0.72rem] leading-relaxed text-slate-500">La ubicación principal ya quedó registrada arriba. Agrega aquí las otras ciudades o municipios donde también se realiza el festival.</p>
                  </div>
                  <button
                    type="button"
                    onClick={addFestivalLocation}
                    className="inline-flex items-center justify-center rounded-full border border-slate-200 bg-slate-50 px-4 py-2 text-[0.52rem] font-bold uppercase tracking-[0.16em] text-[#291242] transition-all hover:border-[#8BF784] hover:text-[#00DA5E]"
                  >
                    Agregar sede
                  </button>
                </div>

                <div className="mt-4 space-y-4">
                  {(participationForm.festivalAdditionalLocations || []).map((location, index) => {
                    const locationMunicipalities = getMapParticipationMunicipalities(location.department);

                    return (
                      <div key={`festival-location-${index}`} className="grid grid-cols-1 gap-4 rounded-[1.2rem] border border-slate-200 bg-slate-50/70 px-4 py-4 xl:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_auto] xl:items-end">
                        <label htmlFor={`map-participation-festival-location-department-${index}`}>
                          <span className="text-[0.56rem] font-bold uppercase tracking-[0.18em] text-slate-400">Departamento</span>
                          <select
                            id={`map-participation-festival-location-department-${index}`}
                            value={location.department}
                            onChange={(event) => updateFestivalLocation(index, 'department', event.target.value)}
                            className={participationInputClassName}
                          >
                            <option value="">Selecciona un departamento</option>
                            {getSortedDepartmentNames().map((department) => (
                              <option key={department} value={department}>{department}</option>
                            ))}
                          </select>
                        </label>

                        <label htmlFor={`map-participation-festival-location-municipality-${index}`}>
                          <span className="text-[0.56rem] font-bold uppercase tracking-[0.18em] text-slate-400">Municipio o ciudad</span>
                          <select
                            id={`map-participation-festival-location-municipality-${index}`}
                            value={location.municipality}
                            onChange={(event) => updateFestivalLocation(index, 'municipality', event.target.value)}
                            disabled={!location.department}
                            className={`${participationInputClassName} disabled:cursor-not-allowed disabled:bg-slate-100`}
                          >
                            <option value="">{location.department ? 'Selecciona un municipio' : 'Selecciona primero el departamento'}</option>
                            {locationMunicipalities.map((municipality) => (
                              <option key={municipality} value={municipality}>{municipality}</option>
                            ))}
                          </select>
                        </label>

                        <button
                          type="button"
                          onClick={() => removeFestivalLocation(index)}
                          className="inline-flex items-center justify-center rounded-full border border-slate-200 bg-white px-4 py-3 text-[0.5rem] font-bold uppercase tracking-[0.16em] text-slate-500 transition-all hover:border-rose-200 hover:text-rose-500"
                        >
                          Quitar
                        </button>
                      </div>
                    );
                  })}
                </div>

                {participationErrors.festivalAdditionalLocations && <p className={participationErrorClassName}>{participationErrors.festivalAdditionalLocations}</p>}
              </div>
            )}

            {participationForm.festivalFrequency && (
              festivalUsesMultiMonthSelection ? (
                <div className="xl:col-span-2 rounded-[1.3rem] border border-slate-200 bg-white px-4 py-4">
                  <span className="text-[0.56rem] font-bold uppercase tracking-[0.18em] text-slate-400">Meses en los que habitualmente se realiza</span>
                  <div className="mt-4 flex flex-wrap gap-2">
                    {MAP_PARTICIPATION_MONTH_OPTIONS.map((month) => {
                      const isSelected = participationForm.festivalHabitualMonths.includes(month);

                      return (
                        <button
                          key={month}
                          type="button"
                          onClick={() => handleParticipationFieldChange('festivalHabitualMonths', (current = []) => (
                            current.includes(month)
                              ? current.filter((item) => item !== month)
                              : [...current, month]
                          ))}
                          className={`rounded-full px-4 py-2 text-[0.56rem] font-bold uppercase tracking-[0.14em] transition-all ${isSelected ? 'border border-[#291242] bg-[#291242] text-white' : 'border border-slate-200 bg-slate-50 text-slate-500 hover:border-[#8BF784] hover:text-[#291242]'}`}
                        >
                          {month}
                        </button>
                      );
                    })}
                  </div>
                  {participationErrors.festivalHabitualMonths && <p className={participationErrorClassName}>{participationErrors.festivalHabitualMonths}</p>}
                </div>
              ) : (
                <label htmlFor="map-participation-festival-habitual-month">
                  <span className="text-[0.56rem] font-bold uppercase tracking-[0.18em] text-slate-400">Mes en el que habitualmente se realiza</span>
                  <select
                    id="map-participation-festival-habitual-month"
                    value={participationForm.festivalHabitualMonths[0] || ''}
                    onChange={(event) => handleParticipationFieldChange('festivalHabitualMonths', event.target.value ? [event.target.value] : [])}
                    className={participationInputClassName}
                  >
                    <option value="">Selecciona un mes</option>
                    {MAP_PARTICIPATION_MONTH_OPTIONS.map((month) => (
                      <option key={month} value={month}>{month}</option>
                    ))}
                  </select>
                  {participationErrors.festivalHabitualMonths && <p className={participationErrorClassName}>{participationErrors.festivalHabitualMonths}</p>}
                </label>
              )
            )}

            {openCallField && renderParticipationField(openCallField)}
            {festivalThisYearStatusField && renderParticipationField(festivalThisYearStatusField)}

            {participationForm.openCall === 'Sí' && participationForm.festivalThisYearStatus === 'Se va a realizar' && (
              <>
                <label htmlFor="map-participation-festival-current-open-call">
                  <span className="text-[0.56rem] font-bold uppercase tracking-[0.18em] text-slate-400">¿Actualmente tienen convocatoria abierta?</span>
                  <select
                    id="map-participation-festival-current-open-call"
                    value={participationForm.festivalCurrentOpenCall}
                    onChange={(event) => handleParticipationFieldChange('festivalCurrentOpenCall', event.target.value)}
                    className={participationInputClassName}
                  >
                    <option value="">Selecciona una opción</option>
                    <option value="Sí">Sí</option>
                    <option value="No">No</option>
                  </select>
                  {participationErrors.festivalCurrentOpenCall && <p className={participationErrorClassName}>{participationErrors.festivalCurrentOpenCall}</p>}
                </label>

                {participationForm.festivalCurrentOpenCall === 'Sí' && (
                  <label htmlFor="map-participation-festival-open-call-deadline">
                    <span className="text-[0.56rem] font-bold uppercase tracking-[0.18em] text-slate-400">¿Hasta qué fecha estará abierta?</span>
                    <input
                      id="map-participation-festival-open-call-deadline"
                      type="date"
                      value={participationForm.festivalOpenCallDeadline}
                      onChange={(event) => handleParticipationFieldChange('festivalOpenCallDeadline', event.target.value)}
                      className={participationInputClassName}
                    />
                    {participationErrors.festivalOpenCallDeadline && <p className={participationErrorClassName}>{participationErrors.festivalOpenCallDeadline}</p>}
                  </label>
                )}
              </>
            )}

            {['Ya se realizó', 'Se va a realizar'].includes(participationForm.festivalThisYearStatus) && (
              festivalUsesDateRange ? (
                <>
                  <label htmlFor="map-participation-festival-this-year-start-date">
                    <span className="text-[0.56rem] font-bold uppercase tracking-[0.18em] text-slate-400">{festivalStartDateLabel}</span>
                    <input
                      id="map-participation-festival-this-year-start-date"
                      type="date"
                      value={participationForm.festivalThisYearStartDate}
                      onChange={(event) => handleParticipationFieldChange('festivalThisYearStartDate', event.target.value)}
                      className={participationInputClassName}
                    />
                    {participationErrors.festivalThisYearStartDate && <p className={participationErrorClassName}>{participationErrors.festivalThisYearStartDate}</p>}
                  </label>

                  <label htmlFor="map-participation-festival-this-year-end-date">
                    <span className="text-[0.56rem] font-bold uppercase tracking-[0.18em] text-slate-400">{festivalEndDateLabel}</span>
                    <input
                      id="map-participation-festival-this-year-end-date"
                      type="date"
                      value={participationForm.festivalThisYearEndDate}
                      onChange={(event) => handleParticipationFieldChange('festivalThisYearEndDate', event.target.value)}
                      className={participationInputClassName}
                    />
                    {participationErrors.festivalThisYearEndDate && <p className={participationErrorClassName}>{participationErrors.festivalThisYearEndDate}</p>}
                  </label>
                </>
              ) : (
                <label htmlFor="map-participation-festival-this-year-date">
                  <span className="text-[0.56rem] font-bold uppercase tracking-[0.18em] text-slate-400">{festivalDateLabel}</span>
                  <input
                    id="map-participation-festival-this-year-date"
                    type="date"
                    value={participationForm.festivalThisYearDate}
                    onChange={(event) => handleParticipationFieldChange('festivalThisYearDate', event.target.value)}
                    className={participationInputClassName}
                  />
                  {participationErrors.festivalThisYearDate && <p className={participationErrorClassName}>{participationErrors.festivalThisYearDate}</p>}
                </label>
              )
            )}

            <label htmlFor="map-participation-musical-fields" className="xl:col-span-2">
              <span className="text-[0.56rem] font-bold uppercase tracking-[0.18em] text-slate-400">Enfoques, géneros o líneas curatoriales del festival</span>
              <textarea
                id="map-participation-musical-fields"
                rows={4}
                value={participationForm.musicalFields}
                onChange={(event) => handleParticipationFieldChange('musicalFields', event.target.value)}
                className={participationTextAreaClassName}
              />
              {participationErrors.musicalFields && <p className={participationErrorClassName}>{participationErrors.musicalFields}</p>}
            </label>
          </div>
        </div>
      );
    }

    if (isMarketParticipation) {
      const marketFrequencyField = activeParticipationFields.find((field) => field.key === 'marketFrequency');
      const marketEditionsCountField = activeParticipationFields.find((field) => field.key === 'marketEditionsCount');
      const averageBuyersField = activeParticipationFields.find((field) => field.key === 'averageBuyers');
      const linkedFestivalField = activeParticipationFields.find((field) => field.key === 'linkedFestival');
      const marketThisYearStatusField = activeParticipationFields.find((field) => field.key === 'marketThisYearStatus');

      return (
        <div>
          <p className="text-[0.56rem] font-bold uppercase tracking-[0.18em] text-slate-400">3. Información específica del mercado</p>
          <div className="mt-4 grid grid-cols-1 gap-4 xl:grid-cols-2">
            {marketFrequencyField && renderParticipationField(marketFrequencyField)}
            {marketEditionsCountField && renderParticipationField(marketEditionsCountField)}
            {averageBuyersField && renderParticipationField(averageBuyersField)}

            {participationForm.marketFrequency && (
              marketUsesMultiMonthSelection ? (
                <div className="xl:col-span-2 rounded-[1.3rem] border border-slate-200 bg-white px-4 py-4">
                  <span className="text-[0.56rem] font-bold uppercase tracking-[0.18em] text-slate-400">Meses en los que habitualmente se realiza</span>
                  <div className="mt-4 flex flex-wrap gap-2">
                    {MAP_PARTICIPATION_MONTH_OPTIONS.map((month) => {
                      const isSelected = participationForm.marketHabitualMonths.includes(month);

                      return (
                        <button
                          key={month}
                          type="button"
                          onClick={() => handleParticipationFieldChange('marketHabitualMonths', (current = []) => (
                            current.includes(month)
                              ? current.filter((item) => item !== month)
                              : [...current, month]
                          ))}
                          className={`rounded-full px-4 py-2 text-[0.56rem] font-bold uppercase tracking-[0.14em] transition-all ${isSelected ? 'border border-[#291242] bg-[#291242] text-white' : 'border border-slate-200 bg-slate-50 text-slate-500 hover:border-[#8BF784] hover:text-[#291242]'}`}
                        >
                          {month}
                        </button>
                      );
                    })}
                  </div>
                  {participationErrors.marketHabitualMonths && <p className={participationErrorClassName}>{participationErrors.marketHabitualMonths}</p>}
                </div>
              ) : (
                <label htmlFor="map-participation-market-habitual-month">
                  <span className="text-[0.56rem] font-bold uppercase tracking-[0.18em] text-slate-400">Mes en el que habitualmente se realiza</span>
                  <select
                    id="map-participation-market-habitual-month"
                    value={participationForm.marketHabitualMonths[0] || ''}
                    onChange={(event) => handleParticipationFieldChange('marketHabitualMonths', event.target.value ? [event.target.value] : [])}
                    className={participationInputClassName}
                  >
                    <option value="">Selecciona un mes</option>
                    {MAP_PARTICIPATION_MONTH_OPTIONS.map((month) => (
                      <option key={month} value={month}>{month}</option>
                    ))}
                  </select>
                  {participationErrors.marketHabitualMonths && <p className={participationErrorClassName}>{participationErrors.marketHabitualMonths}</p>}
                </label>
              )
            )}

            {linkedFestivalField && renderParticipationField(linkedFestivalField)}

            {participationForm.linkedFestival === 'Sí' && (
              <label htmlFor="map-participation-linked-festival-name">
                <span className="text-[0.56rem] font-bold uppercase tracking-[0.18em] text-slate-400">En caso de haber respondido sí, ¿con cuál festival se articula?</span>
                <input
                  id="map-participation-linked-festival-name"
                  type="text"
                  value={participationForm.linkedFestivalName}
                  onChange={(event) => handleParticipationFieldChange('linkedFestivalName', event.target.value)}
                  className={participationInputClassName}
                  placeholder="Escribe el nombre del festival"
                />
                {participationErrors.linkedFestivalName && <p className={participationErrorClassName}>{participationErrors.linkedFestivalName}</p>}
              </label>
            )}

            {marketThisYearStatusField && renderParticipationField(marketThisYearStatusField)}

            {participationForm.marketThisYearStatus === 'Se va a realizar' && (
              <label htmlFor="map-participation-market-this-year-month">
                <span className="text-[0.56rem] font-bold uppercase tracking-[0.18em] text-slate-400">¿En qué mes se va a realizar?</span>
                <select
                  id="map-participation-market-this-year-month"
                  value={participationForm.marketThisYearMonth}
                  onChange={(event) => handleParticipationFieldChange('marketThisYearMonth', event.target.value)}
                  className={participationInputClassName}
                >
                  <option value="">Selecciona un mes</option>
                  {MAP_PARTICIPATION_MONTH_OPTIONS.map((month) => (
                    <option key={month} value={month}>{month}</option>
                  ))}
                </select>
                {participationErrors.marketThisYearMonth && <p className={participationErrorClassName}>{participationErrors.marketThisYearMonth}</p>}
              </label>
            )}

            {participationForm.marketThisYearStatus === 'Ya se realizó' && (
              <label htmlFor="map-participation-market-this-year-date">
                <span className="text-[0.56rem] font-bold uppercase tracking-[0.18em] text-slate-400">Fecha exacta en la que se realizó</span>
                <input
                  id="map-participation-market-this-year-date"
                  type="date"
                  value={participationForm.marketThisYearDate}
                  onChange={(event) => handleParticipationFieldChange('marketThisYearDate', event.target.value)}
                  className={participationInputClassName}
                />
                {participationErrors.marketThisYearDate && <p className={participationErrorClassName}>{participationErrors.marketThisYearDate}</p>}
              </label>
            )}

            <label htmlFor="map-participation-musical-fields" className="xl:col-span-2">
              <span className="text-[0.56rem] font-bold uppercase tracking-[0.18em] text-slate-400">Enfoques, géneros o líneas del mercado</span>
              <textarea
                id="map-participation-musical-fields"
                rows={4}
                value={participationForm.musicalFields}
                onChange={(event) => handleParticipationFieldChange('musicalFields', event.target.value)}
                className={participationTextAreaClassName}
              />
              {participationErrors.musicalFields && <p className={participationErrorClassName}>{participationErrors.musicalFields}</p>}
            </label>
          </div>
        </div>
      );
    }

    return (
      <div>
        <p className="text-[0.56rem] font-bold uppercase tracking-[0.18em] text-slate-400">4. Información específica del tipo de actor</p>
        <div className="mt-4 grid grid-cols-1 gap-4 xl:grid-cols-2">
          {activeParticipationFields.map((field) => renderParticipationField(field))}
          <label htmlFor="map-participation-musical-fields" className="xl:col-span-2">
            <span className="text-[0.56rem] font-bold uppercase tracking-[0.18em] text-slate-400">Prácticas, géneros o líneas de trabajo</span>
            <input
              id="map-participation-musical-fields"
              type="text"
              value={participationForm.musicalFields}
              onChange={(event) => handleParticipationFieldChange('musicalFields', event.target.value)}
              className={participationInputClassName}
            />
            {participationErrors.musicalFields && <p className={participationErrorClassName}>{participationErrors.musicalFields}</p>}
          </label>
        </div>
      </div>
    );
  };
  const renderParticipationRolesSection = () => {
    if (activeParticipationIdentity.showRoleSection === false) return null;

    return (
      <div>
        <p className="text-[0.56rem] font-bold uppercase tracking-[0.18em] text-slate-400">
          {isIndividualParticipation ? '4. Seleccione sus principales funciones dentro del ecosistema musical' : '3. Función dentro del ecosistema musical'}
        </p>
        <div className="mt-4 flex flex-wrap gap-2">
          {activeParticipationRoleOptions.map((role) => (
            <button
              key={role}
              type="button"
              onClick={() => toggleParticipationRole(role)}
              className={`rounded-full px-4 py-2 text-[0.56rem] font-bold uppercase tracking-[0.14em] transition-all ${participationForm.roles.includes(role) ? 'border border-[#291242] bg-[#291242] text-white' : 'border border-slate-200 bg-white text-slate-500 hover:border-[#8BF784] hover:text-[#291242]'}`}
            >
              {role}
            </button>
          ))}
        </div>
        {participationErrors.roles && <p className={participationErrorClassName}>{participationErrors.roles}</p>}
      </div>
    );
  };
  const renderParticipationNarrativeSection = () => {
    if (isMarketParticipation) {
      return (
        <div>
          <p className="text-[0.56rem] font-bold uppercase tracking-[0.18em] text-slate-400">4. Descripción y aporte del mercado</p>
          <div className="mt-4 grid grid-cols-1 gap-4">
            <label htmlFor="map-participation-description">
              <span className="text-[0.56rem] font-bold uppercase tracking-[0.18em] text-slate-400">Descripción breve del mercado</span>
              <textarea
                id="map-participation-description"
                rows={4}
                value={participationForm.description}
                onChange={(event) => handleParticipationFieldChange('description', event.target.value)}
                className={participationTextAreaClassName}
              />
              {participationErrors.description && <p className={participationErrorClassName}>{participationErrors.description}</p>}
            </label>

            <label htmlFor="map-participation-contribution">
              <span className="text-[0.56rem] font-bold uppercase tracking-[0.18em] text-slate-400">¿Qué aporta este mercado al ecosistema musical?</span>
              <textarea
                id="map-participation-contribution"
                rows={4}
                value={participationForm.contribution}
                onChange={(event) => handleParticipationFieldChange('contribution', event.target.value)}
                className={participationTextAreaClassName}
              />
              {participationErrors.contribution && <p className={participationErrorClassName}>{participationErrors.contribution}</p>}
            </label>
          </div>
        </div>
      );
    }

    return (
      <div>
        <p className="text-[0.56rem] font-bold uppercase tracking-[0.18em] text-slate-400">
          {isIndividualParticipation ? '5. Trayectoria, aportes y proyección' : '5. Aportes y necesidades'}
        </p>
        <div className="mt-4 grid grid-cols-1 gap-4">
          <label htmlFor="map-participation-description">
            <span className="text-[0.56rem] font-bold uppercase tracking-[0.18em] text-slate-400">
              {isIndividualParticipation ? 'Cuéntenos brevemente sobre su trayectoria o recorrido en la música' : 'Descripción breve del proceso'}
            </span>
            <textarea
              id="map-participation-description"
              rows={4}
              value={participationForm.description}
              onChange={(event) => handleParticipationFieldChange('description', event.target.value)}
              className={participationTextAreaClassName}
            />
            {participationErrors.description && <p className={participationErrorClassName}>{participationErrors.description}</p>}
          </label>

          <label htmlFor="map-participation-contribution">
            <span className="text-[0.56rem] font-bold uppercase tracking-[0.18em] text-slate-400">
              {isIndividualParticipation ? '¿Cómo aporta su trabajo al ecosistema musical de su territorio o sector?' : 'Aporte al ecosistema musical del territorio'}
            </span>
            <textarea
              id="map-participation-contribution"
              rows={4}
              value={participationForm.contribution}
              onChange={(event) => handleParticipationFieldChange('contribution', event.target.value)}
              className={participationTextAreaClassName}
            />
            {participationErrors.contribution && <p className={participationErrorClassName}>{participationErrors.contribution}</p>}
          </label>

          <label htmlFor="map-participation-needs">
            <span className="text-[0.56rem] font-bold uppercase tracking-[0.18em] text-slate-400">
              {isIndividualParticipation ? '¿Qué apoyos, redes, oportunidades o conexiones le interesaría fortalecer?' : 'Necesidades, alianzas o expectativas frente al mapeo'}
            </span>
            <textarea
              id="map-participation-needs"
              rows={4}
              value={participationForm.needs}
              onChange={(event) => handleParticipationFieldChange('needs', event.target.value)}
              className={participationTextAreaClassName}
            />
            {participationErrors.needs && <p className={participationErrorClassName}>{participationErrors.needs}</p>}
          </label>
        </div>
      </div>
    );
  };

  return (
    <div className="bg-slate-50 min-h-screen text-left relative overflow-x-hidden">
      <PageHero
        tag="Participación Abierta"
        title="Haz Parte del"
        titleAccent="Mapeo"
        description="Registra tu proceso dentro del ecosistema musical colombiano y comparte la información básica que ayudará a fortalecer la lectura territorial, la caracterización y la visibilidad del sector."
        bgImage="https://images.unsplash.com/photo-1774558396280-c14b21198674?q=80&w=1470&auto=format&fit=crop"
        onBack={onBack}
      />

      <ContentWrapper className="!py-8" id="mapa-dashboard">
        <div ref={participationSectionRef} className="overflow-hidden rounded-[3rem] border border-slate-200 bg-white shadow-sm">
          <div className="grid grid-cols-1 xl:grid-cols-[0.68fr_1.72fr]">
            <div className="relative overflow-hidden bg-[#291242] px-7 py-8 text-white xl:px-8 xl:py-9">
              <div className="absolute -right-16 top-10 h-48 w-48 rounded-full bg-white/5 blur-3xl" />
              <div className="absolute -left-10 bottom-0 h-44 w-44 rounded-full bg-[#00DA5E]/15 blur-3xl" />
              <div className="relative">
                <span className="inline-flex rounded-full border border-white/10 bg-white/8 px-4 py-2 text-[0.55rem] font-bold uppercase tracking-[0.24em] text-[#8BF784]">Participación abierta</span>
                <h3 className="mt-6 font-alternate text-3xl font-bold uppercase leading-none">Haz parte del mapeo del ecosistema musical colombiano</h3>
                <p className="mt-5 max-w-md text-[0.84rem] leading-relaxed text-slate-300">Comparte la información básica de tu proceso para fortalecer la lectura territorial del sector musical. La ficha recoge tipología, función, territorio, capacidades y aportes, siguiendo la lógica de caracterización que ya usa el mapa ecosistémico.</p>

                <div className="mt-8 rounded-[2rem] border border-white/10 bg-white/8 px-5 py-5">
                  <p className="text-[0.54rem] font-bold uppercase tracking-[0.2em] text-[#8BF784]">Antes de empezar</p>
                  <div className="mt-4 space-y-4">
                    {[
                      'Ten a mano los datos básicos de contacto y ubicación del registro.',
                      'Selecciona el actor principal desde el que quieres aparecer dentro del mapeo.',
                      'Al completar el formulario, la información queda lista para revisión y consolidación.',
                    ].map((item, index) => (
                      <div key={item} className="flex items-start gap-3">
                        <span className="mt-0.5 inline-flex h-6 min-w-6 items-center justify-center rounded-full border border-white/10 bg-white/10 px-2 text-[0.46rem] font-bold uppercase tracking-[0.16em] text-[#8BF784]">
                          0{index + 1}
                        </span>
                        <p className="text-[0.76rem] leading-relaxed text-slate-300">{item}</p>
                      </div>
                    ))}
                  </div>
                </div>

                {lastParticipationSubmission && (
                  <div className="mt-8 rounded-[2rem] border border-[#8BF784]/30 bg-[#00DA5E]/10 px-5 py-5">
                    <div className="flex items-start gap-3">
                      <CheckCircle2 size={20} className="mt-0.5 text-[#8BF784] shrink-0" />
                      <div>
                        <p className="text-[0.54rem] font-bold uppercase tracking-[0.2em] text-[#8BF784]">Última ficha registrada</p>
                        <p className="mt-3 text-[0.9rem] font-bold text-white">{lastParticipationSubmission.actorName}</p>
                        <p className="mt-1 text-[0.75rem] text-slate-300">{lastParticipationSubmission.actorTypeLabel} · {lastParticipationSubmission.municipality}, {lastParticipationSubmission.department}</p>
                        <p className="mt-3 text-[0.68rem] uppercase tracking-[0.18em] text-white/70">Referencia {lastParticipationSubmission.reference}</p>
                        {lastParticipationSubmission.workbookMessage && (
                          <p className="mt-3 text-[0.72rem] leading-relaxed text-slate-200">{lastParticipationSubmission.workbookMessage}</p>
                        )}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>

            <div className="bg-slate-50/80 px-6 py-8 xl:px-10 xl:py-10">
              <div className="flex items-start justify-between gap-4 border-b border-slate-200 pb-6">
                <div>
                  <p className="text-[0.54rem] font-bold uppercase tracking-[0.22em] text-slate-400">Subapartado del mapa ecosistémico</p>
                  <h4 className="mt-3 font-alternate text-2xl font-bold uppercase text-[#291242]">Formulario de participación</h4>
                  <p className="mt-3 max-w-2xl text-[0.78rem] leading-relaxed text-slate-500">Selecciona el tipo de actor y diligencia la ficha con la información mínima para visibilizar tu proceso dentro del mapeo y caracterización del ecosistema musical colombiano.</p>
                </div>
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-[1rem] border border-slate-200 bg-white text-[#291242]">
                  <FileText size={18} />
                </div>
              </div>

              <form onSubmit={handleParticipationSubmit} className="mt-8 space-y-8">
                <div>
                  <p className="text-[0.56rem] font-bold uppercase tracking-[0.18em] text-slate-400">1. Selecciona el tipo de actor</p>
                  <div className="mt-4 space-y-4">
                    <div className="relative overflow-hidden rounded-[2.3rem] border border-[#291242]/10 bg-[#291242] px-6 py-6 text-white shadow-sm">
                      <div className="absolute -right-10 top-0 h-32 w-32 rounded-full bg-[#8BF784]/18 blur-3xl" />
                      <div className="absolute -left-10 bottom-0 h-32 w-32 rounded-full bg-white/8 blur-3xl" />
                      <div className="relative grid grid-cols-1 gap-5 lg:grid-cols-[minmax(0,1.08fr)_minmax(0,0.92fr)] lg:items-start">
                        <div className="flex items-start gap-4">
                          <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-[1.2rem] border border-white/10 bg-white/10 text-[#8BF784]">
                            <ActiveParticipationIcon size={22} />
                          </div>
                          <div>
                            <div className="flex flex-wrap items-center gap-3">
                              <p className="text-[0.52rem] font-bold uppercase tracking-[0.22em] text-[#8BF784]">Selección activa</p>
                              <span className="rounded-full border border-white/10 bg-white/10 px-3 py-1.5 text-[0.48rem] font-bold uppercase tracking-[0.18em] text-white/80">
                                {activeParticipationActor.shortLabel}
                              </span>
                            </div>
                            <h5 className="mt-3 font-alternate text-[1.4rem] font-bold uppercase leading-tight text-white">{activeParticipationActor.label}</h5>
                            <p className="mt-4 max-w-[19rem] text-[0.78rem] leading-relaxed text-slate-300">{activeParticipationActor.description}</p>
                          </div>
                        </div>

                        <div className="rounded-[1.8rem] border border-white/10 bg-white/8 px-5 py-5">
                          <p className="text-[0.5rem] font-bold uppercase tracking-[0.18em] text-[#8BF784]">Cómo usar esta selección</p>
                          <p className="mt-3 text-[0.74rem] leading-relaxed text-slate-300">Elige la opción que mejor represente el registro principal. Si una misma iniciativa cumple varios roles, prioriza la figura desde la que quieres aparecer dentro del mapeo.</p>
                        </div>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3">
                      {MAP_PARTICIPATION_ACTOR_OPTIONS.map((option, index) => {
                        const Icon = option.icon;
                        const isActive = participationForm.actorType === option.key;

                        return (
                          <button
                            key={option.key}
                            type="button"
                            onClick={() => handleParticipationFieldChange('actorType', option.key)}
                            className={`group relative overflow-hidden rounded-[1.9rem] border px-4 py-4 text-left transition-all duration-300 ${isActive ? 'border-[#8BF784] bg-[#f8fff9] shadow-[0_16px_40px_rgba(0,0,0,0.06)]' : 'border-slate-200 bg-white hover:-translate-y-0.5 hover:border-slate-300 hover:bg-slate-50'}`}
                          >
                            <div className={`absolute inset-x-0 top-0 h-1 transition-all ${isActive ? 'bg-[#00DA5E]' : 'bg-transparent group-hover:bg-slate-200'}`} />
                            <div className="relative">
                              <div className="flex items-start justify-between gap-3">
                                <div className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-[1rem] transition-all ${isActive ? 'bg-[#291242] text-[#8BF784]' : 'bg-slate-100 text-[#291242] group-hover:bg-slate-200'}`}>
                                  <Icon size={18} />
                                </div>
                                <div className="flex items-center gap-2">
                                  <span className={`rounded-full px-2.5 py-1 text-[0.46rem] font-bold uppercase tracking-[0.16em] ${isActive ? 'bg-[#291242] text-white' : 'bg-slate-100 text-slate-500'}`}>
                                    {isActive ? 'Activo' : `0${index + 1}`}
                                  </span>
                                  {isActive && <CheckCircle2 size={16} className="text-[#00DA5E]" />}
                                </div>
                              </div>

                              <div className="mt-4">
                                <p className="font-alternate text-[0.95rem] font-bold uppercase tracking-[0.08em] text-[#291242]">{option.label}</p>
                                <p className="mt-2 text-[0.72rem] leading-relaxed text-slate-500">{option.description}</p>
                              </div>

                              <div className="mt-4 flex items-center justify-between border-t border-slate-100 pt-3">
                                <span className="text-[0.48rem] font-bold uppercase tracking-[0.18em] text-slate-400">{option.shortLabel}</span>
                                <span className={`text-[0.52rem] font-bold uppercase tracking-[0.16em] transition-colors ${isActive ? 'text-[#00DA5E]' : 'text-[#291242] group-hover:text-[#00DA5E]'}`}>
                                  {isActive ? 'Seleccionado' : 'Seleccionar'}
                                </span>
                              </div>
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </div>

                <div>
                  <p className="text-[0.56rem] font-bold uppercase tracking-[0.18em] text-slate-400">2. Identificación y territorio</p>
                  <div className="mt-4 grid grid-cols-1 gap-4 xl:grid-cols-2">
                    {isIndividualParticipation ? (
                      <>
                        <label htmlFor="map-participation-first-name">
                          <span className="text-[0.56rem] font-bold uppercase tracking-[0.18em] text-slate-400">{activeParticipationIdentity.firstNameLabel}</span>
                          <input
                            id="map-participation-first-name"
                            type="text"
                            value={participationForm.individualFirstName}
                            onChange={(event) => handleParticipationFieldChange('individualFirstName', event.target.value)}
                            className={participationInputClassName}
                            placeholder="Escribe los nombres"
                          />
                          {participationErrors.individualFirstName && <p className={participationErrorClassName}>{participationErrors.individualFirstName}</p>}
                        </label>

                        <label htmlFor="map-participation-last-name">
                          <span className="text-[0.56rem] font-bold uppercase tracking-[0.18em] text-slate-400">{activeParticipationIdentity.lastNameLabel}</span>
                          <input
                            id="map-participation-last-name"
                            type="text"
                            value={participationForm.individualLastName}
                            onChange={(event) => handleParticipationFieldChange('individualLastName', event.target.value)}
                            className={participationInputClassName}
                            placeholder="Escribe los apellidos"
                          />
                          {participationErrors.individualLastName && <p className={participationErrorClassName}>{participationErrors.individualLastName}</p>}
                        </label>
                      </>
                    ) : (
                      <label htmlFor="map-participation-actor-name" className="xl:col-span-2">
                        <span className="text-[0.56rem] font-bold uppercase tracking-[0.18em] text-slate-400">{activeParticipationIdentity.actorNameLabel}</span>
                        <input
                          id="map-participation-actor-name"
                          type="text"
                          value={participationForm.actorName}
                          onChange={(event) => handleParticipationFieldChange('actorName', event.target.value)}
                          className={participationInputClassName}
                          placeholder={activeParticipationIdentity.actorNamePlaceholder}
                        />
                        {participationErrors.actorName && <p className={participationErrorClassName}>{participationErrors.actorName}</p>}
                      </label>
                    )}

                    {activeParticipationIdentity.showIdentificationFields && (
                      <>
                        <label htmlFor="map-participation-identification-type">
                          <span className="text-[0.56rem] font-bold uppercase tracking-[0.18em] text-slate-400">{activeParticipationIdentity.identificationTypeLabel}</span>
                          <select
                            id="map-participation-identification-type"
                            value={participationForm.identificationType}
                            onChange={(event) => handleParticipationFieldChange('identificationType', event.target.value)}
                            className={participationInputClassName}
                          >
                            <option value="">Selecciona una opción</option>
                            {MAP_PARTICIPATION_IDENTIFICATION_TYPE_OPTIONS.map((option) => (
                              <option key={option} value={option}>{option}</option>
                            ))}
                          </select>
                          {participationErrors.identificationType && <p className={participationErrorClassName}>{participationErrors.identificationType}</p>}
                        </label>

                        <label htmlFor="map-participation-identification-number">
                          <span className="text-[0.56rem] font-bold uppercase tracking-[0.18em] text-slate-400">{activeParticipationIdentity.identificationNumberLabel}</span>
                          <input
                            id="map-participation-identification-number"
                            type="text"
                            value={participationForm.identificationNumber}
                            onChange={(event) => handleParticipationFieldChange('identificationNumber', event.target.value)}
                            className={participationInputClassName}
                            placeholder="Escribe el número de identificación"
                          />
                          {participationErrors.identificationNumber && <p className={participationErrorClassName}>{participationErrors.identificationNumber}</p>}
                        </label>
                      </>
                    )}

                    {activeParticipationIdentity.showResponsibleEntity && (
                      <label htmlFor="map-participation-responsible-entity">
                        <span className="text-[0.56rem] font-bold uppercase tracking-[0.18em] text-slate-400">{activeParticipationIdentity.responsibleEntityLabel}</span>
                        <input
                          id="map-participation-responsible-entity"
                          type="text"
                          value={participationForm.responsibleEntity}
                          onChange={(event) => handleParticipationFieldChange('responsibleEntity', event.target.value)}
                          className={participationInputClassName}
                          placeholder={activeParticipationIdentity.responsibleEntityPlaceholder}
                        />
                        {participationErrors.responsibleEntity && <p className={participationErrorClassName}>{participationErrors.responsibleEntity}</p>}
                      </label>
                    )}

                    {activeParticipationIdentity.showContactFields && (
                      <>
                        <label htmlFor="map-participation-contact-name">
                          <span className="text-[0.56rem] font-bold uppercase tracking-[0.18em] text-slate-400">{activeParticipationIdentity.contactNameLabel}</span>
                          <input
                            id="map-participation-contact-name"
                            type="text"
                            value={participationForm.contactName}
                            onChange={(event) => handleParticipationFieldChange('contactName', event.target.value)}
                            className={participationInputClassName}
                          />
                          {participationErrors.contactName && <p className={participationErrorClassName}>{participationErrors.contactName}</p>}
                        </label>

                        <label htmlFor="map-participation-contact-role">
                          <span className="text-[0.56rem] font-bold uppercase tracking-[0.18em] text-slate-400">{activeParticipationIdentity.contactRoleLabel}</span>
                          <input
                            id="map-participation-contact-role"
                            type="text"
                            value={participationForm.contactRole}
                            onChange={(event) => handleParticipationFieldChange('contactRole', event.target.value)}
                            className={participationInputClassName}
                          />
                          {participationErrors.contactRole && <p className={participationErrorClassName}>{participationErrors.contactRole}</p>}
                        </label>
                      </>
                    )}

                    <label htmlFor="map-participation-email">
                      <span className="text-[0.56rem] font-bold uppercase tracking-[0.18em] text-slate-400">Correo electrónico</span>
                      <input
                        id="map-participation-email"
                        type="email"
                        value={participationForm.email}
                        onChange={(event) => handleParticipationFieldChange('email', event.target.value)}
                        className={participationInputClassName}
                      />
                      {participationErrors.email && <p className={participationErrorClassName}>{participationErrors.email}</p>}
                    </label>

                    <label htmlFor="map-participation-phone">
                      <span className="text-[0.56rem] font-bold uppercase tracking-[0.18em] text-slate-400">Teléfono o celular</span>
                      <input
                        id="map-participation-phone"
                        type="text"
                        value={participationForm.phone}
                        onChange={(event) => handleParticipationFieldChange('phone', event.target.value)}
                        className={participationInputClassName}
                      />
                      {participationErrors.phone && <p className={participationErrorClassName}>{participationErrors.phone}</p>}
                    </label>

                    <label htmlFor="map-participation-department">
                      <span className="text-[0.56rem] font-bold uppercase tracking-[0.18em] text-slate-400">Departamento</span>
                      <select
                        id="map-participation-department"
                        value={participationForm.department}
                        onChange={(event) => handleParticipationFieldChange('department', event.target.value)}
                        className={participationInputClassName}
                      >
                        <option value="">Selecciona un departamento</option>
                        {getSortedDepartmentNames().map((department) => (
                          <option key={department} value={department}>{department}</option>
                        ))}
                      </select>
                      {participationErrors.department && <p className={participationErrorClassName}>{participationErrors.department}</p>}
                    </label>

                    <label htmlFor="map-participation-municipality">
                      <span className="text-[0.56rem] font-bold uppercase tracking-[0.18em] text-slate-400">Municipio o ciudad</span>
                      <select
                        id="map-participation-municipality"
                        value={participationForm.municipality}
                        onChange={(event) => handleParticipationFieldChange('municipality', event.target.value)}
                        disabled={!participationForm.department}
                        className={`${participationInputClassName} disabled:cursor-not-allowed disabled:bg-slate-100`}
                      >
                        <option value="">{participationForm.department ? 'Selecciona un municipio' : 'Selecciona primero el departamento'}</option>
                        {participationMunicipalities.map((municipality) => (
                          <option key={municipality} value={municipality}>{municipality}</option>
                        ))}
                      </select>
                      {participationErrors.municipality && <p className={participationErrorClassName}>{participationErrors.municipality}</p>}
                    </label>

                    {activeParticipationIdentity.showTerritoryScope && (
                      <label htmlFor="map-participation-scope">
                        <span className="text-[0.56rem] font-bold uppercase tracking-[0.18em] text-slate-400">Alcance territorial</span>
                        <select
                          id="map-participation-scope"
                          value={participationForm.territoryScope}
                          onChange={(event) => handleParticipationFieldChange('territoryScope', event.target.value)}
                          className={participationInputClassName}
                        >
                          <option value="">Selecciona una escala</option>
                          {MAP_PARTICIPATION_SCOPE_OPTIONS.map((scope) => (
                            <option key={scope} value={scope}>{scope}</option>
                          ))}
                        </select>
                        {participationErrors.territoryScope && <p className={participationErrorClassName}>{participationErrors.territoryScope}</p>}
                      </label>
                    )}

                    {activeParticipationIdentity.showWebsite && (
                      <>
                        <label htmlFor="map-participation-website">
                          <span className="text-[0.56rem] font-bold uppercase tracking-[0.18em] text-slate-400">{activeParticipationIdentity.websiteLabel || 'Sitio web o red principal'}</span>
                          <input
                            id="map-participation-website"
                            type="url"
                            value={participationForm.website}
                            onChange={(event) => handleParticipationFieldChange('website', event.target.value)}
                            className={participationInputClassName}
                          />
                        </label>

                        {activeParticipationIdentity.showSocialFields && (
                          <>
                            <label htmlFor="map-participation-facebook">
                              <span className="text-[0.56rem] font-bold uppercase tracking-[0.18em] text-slate-400">Facebook (opcional)</span>
                              <input
                                id="map-participation-facebook"
                                type="url"
                                value={participationForm.facebookUrl}
                                onChange={(event) => handleParticipationFieldChange('facebookUrl', event.target.value)}
                                className={participationInputClassName}
                              />
                            </label>

                            <label htmlFor="map-participation-instagram">
                              <span className="text-[0.56rem] font-bold uppercase tracking-[0.18em] text-slate-400">Instagram (opcional)</span>
                              <input
                                id="map-participation-instagram"
                                type="url"
                                value={participationForm.instagramUrl}
                                onChange={(event) => handleParticipationFieldChange('instagramUrl', event.target.value)}
                                className={participationInputClassName}
                              />
                            </label>
                          </>
                        )}
                      </>
                    )}
                  </div>
                </div>

                {isIndividualParticipation ? (
                  <>
                    {renderParticipationSpecificSection()}
                    {renderParticipationRolesSection()}
                    {renderParticipationNarrativeSection()}
                  </>
                ) : (
                  <>
                    {renderParticipationRolesSection()}
                    {renderParticipationSpecificSection()}
                    {renderParticipationNarrativeSection()}
                  </>
                )}

                <div className="rounded-[1.8rem] border border-slate-200 bg-white px-5 py-5">
                  <label htmlFor="map-participation-consent" className="flex items-start gap-3 cursor-pointer">
                    <input
                      id="map-participation-consent"
                      type="checkbox"
                      checked={participationForm.consent}
                      onChange={(event) => handleParticipationFieldChange('consent', event.target.checked)}
                      className="mt-1 h-4 w-4 rounded border-slate-300 text-[#291242] focus:ring-[#00DA5E]"
                    />
                    <span className="text-[0.78rem] leading-relaxed text-slate-500">Autorizo el tratamiento de esta información para fines de caracterización, análisis territorial y contacto relacionado con el mapa ecosistémico del PNMC.</span>
                  </label>
                  {participationErrors.consent && <p className={participationErrorClassName}>{participationErrors.consent}</p>}
                </div>

                {participationWorkbookFeedback && (
                  <div className={`rounded-[1.6rem] border px-5 py-4 ${participationWorkbookFeedback.type === 'success' ? 'border-emerald-200 bg-emerald-50' : 'border-rose-200 bg-rose-50'}`}>
                    <p className={`text-[0.74rem] leading-relaxed ${participationWorkbookFeedback.type === 'success' ? 'text-emerald-800' : 'text-rose-700'}`}>
                      {participationWorkbookFeedback.message}
                    </p>
                  </div>
                )}

                <div className="flex flex-col gap-4 border-t border-slate-200 pt-6 lg:flex-row lg:items-center lg:justify-between">
                  <p className="max-w-2xl text-[0.72rem] leading-relaxed text-slate-500">Mientras diligencias la ficha, el formulario guarda un borrador local en este navegador. Al registrar, la información se envía automáticamente a la base <span className="font-bold text-[#291242]">{MAP_PARTICIPATION_WORKBOOK_FILE_NAME}</span> del proyecto cuando la web está corriendo en el servidor local.</p>
                  <div className="flex flex-col gap-3 sm:flex-row">
                    <Button type="button" onClick={resetParticipationForm} variant="outlineDark" className="px-6 py-3 text-[0.66rem]">Limpiar ficha</Button>
                    <Button type="submit" variant="secondary" className="px-7 py-3 text-[0.66rem]" icon={isPersistingParticipation ? Loader2 : Send} disabled={isPersistingParticipation}>
                      {isPersistingParticipation ? 'Guardando...' : 'Registrar información'}
                    </Button>
                  </div>
                </div>
              </form>
            </div>
          </div>
        </div>
      </ContentWrapper>
    </div>
  );
};

const MapaEcosistemicoPage = ({ onBack, navigationRequest, onOpenParticipation }) => {
  const [activeCategory, setActiveCategory] = useState('General');
  const [activeView, setActiveView] = useState('map');
  const [selectedDept, setselectedDept] = useState('Nacional');
  const [geoData, setGeoData] = useState(null);
  const [festivalCounts, setFestivalCounts] = useState({});
  const [festivalRecords, setFestivalRecords] = useState([]);
  const [schoolCounts, setSchoolCounts] = useState({});
  const [schoolRecords, setSchoolRecords] = useState([]);
  const [marketCounts, setMarketCounts] = useState({});
  const [marketRecords, setMarketRecords] = useState([]);
  const [schoolLayerReady, setSchoolLayerReady] = useState(false);
  const [marketLayerReady, setMarketLayerReady] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [mapError, setMapError] = useState(null);
  const geoJsonRef = useRef(null);
  const mapWorkspaceRef = useRef(null);
  const departmentDetailRef = useRef(null);
  const [expandedDepartmentSection, setExpandedDepartmentSection] = useState('Festivales');
  const [expandedFestivalRecordId, setExpandedFestivalRecordId] = useState(null);
  const [expandedSchoolRecordId, setExpandedSchoolRecordId] = useState(null);
  const [expandedMarketRecordId, setExpandedMarketRecordId] = useState(null);
  const [hoveredDepartmentCard, setHoveredDepartmentCard] = useState(null);
  const [mapResetToken, setMapResetToken] = useState(0);
  const [technicalDepartmentQuery, setTechnicalDepartmentQuery] = useState('');
  const [technicalRecordQuery, setTechnicalRecordQuery] = useState('');
  const [technicalMatrixSortKey, setTechnicalMatrixSortKey] = useState('default');
  const [technicalMatrixSortDirection, setTechnicalMatrixSortDirection] = useState('desc');
  const [technicalRecordSortKey, setTechnicalRecordSortKey] = useState('default');
  const [technicalRecordSortDirection, setTechnicalRecordSortDirection] = useState('desc');
  const [technicalRecordFocus, setTechnicalRecordFocus] = useState('all');
  const mapSvgRenderer = useMemo(() => L.svg(), []);

  const baseDepartmentCounts = getBaseDepartmentCounts();
  const departmentsList = ['Nacional', ...getSortedDepartmentNames()];

  const festivalAnalytics = useMemo(
    () => buildLayerAnalytics(festivalCounts, festivalRecords, selectedDept),
    [festivalCounts, festivalRecords, selectedDept]
  );
  const schoolAnalytics = useMemo(
    () => buildLayerAnalytics(schoolCounts, schoolRecords, selectedDept),
    [schoolCounts, schoolRecords, selectedDept]
  );
  const marketAnalytics = useMemo(
    () => buildLayerAnalytics(marketCounts, marketRecords, selectedDept),
    [marketCounts, marketRecords, selectedDept]
  );
  const emptyAnalytics = useMemo(
    () => buildLayerAnalytics(baseDepartmentCounts, [], selectedDept),
    [baseDepartmentCounts, selectedDept]
  );
  const schoolCapacityTotals = useMemo(
    () => buildSchoolCapacityTotals(schoolRecords),
    [schoolRecords]
  );
  const marketCapacityTotals = useMemo(
    () => buildMarketTotals(marketRecords),
    [marketRecords]
  );

  const colombiaBounds = useMemo(() => {
    if (!geoData) return null;
    const selectedNormalized = normalizeDepartmentName(selectedDept);
    const archipelagoFeature = geoData.features.find(
      (feature) => getFeatureDepartmentNormalizedName(feature) === ARCHIPELAGO_NORMALIZED_NAME
    );
    const filteredFeatures = geoData.features.filter((feature) => {
      const featureName = getFeatureDepartmentNormalizedName(feature);
      if (selectedDept !== 'Nacional') {
        return featureName === selectedNormalized;
      }
      return featureName !== 'SAN ANDRES Y PROVIDENCIA';
    });

    const featureCollection = {
      ...geoData,
      features: selectedNormalized === ARCHIPELAGO_NORMALIZED_NAME && archipelagoFeature
        ? [buildScaledFeature(archipelagoFeature)]
        : (filteredFeatures.length > 0 ? filteredFeatures : geoData.features),
    };

    return L.geoJSON(featureCollection).getBounds();
  }, [geoData, selectedDept]);

  const activeLayerConfig = useMemo(() => {
    return ECOSYSTEM_LAYERS.find((layer) => layer.key === activeCategory) || ECOSYSTEM_LAYERS[0];
  }, [activeCategory]);

  const isGeneralLayer = activeCategory === 'General';
  const isFestivalsLayer = activeCategory === 'Festivales';
  const isSchoolsLayer = activeCategory === 'Escuelas de Música';
  const isMarketsLayer = activeCategory === 'Mercados Musicales';

  const festivalRecordsByDepartment = useMemo(() => {
    return festivalRecords.reduce((acc, record) => {
      const deptRaw = record?.fields?.dpt ?? record?.fields?.dpto ?? record?.fields?.departamento ?? record?.fields?.department;
      const deptName = Array.isArray(deptRaw) ? deptRaw[0] : (deptRaw || 'Desconocido');
      const resolvedDepartmentName = resolveDepartmentNameFromRecord(record, deptName);
      const normalized = normalizeDepartmentName(resolvedDepartmentName);

      if (!normalized || normalized === 'DESCONOCIDO') return acc;

      if (!acc[normalized]) acc[normalized] = [];
      acc[normalized].push({
        departmentCode: normalizeDepartmentCode(
          record?.fields?.departmentCode
          || record?.fields?.DepartmentCode
          || record?.fields?.dpto_ccdgo
        ),
        municipalityCode: normalizeMunicipalityCode(
          record?.fields?.municipalityCode
          || record?.fields?.divipola
          || record?.fields?.mpio_cdpmp
        ),
        name: getFestivalRecordName(record),
        municipality: record?.fields?.municipio || '',
        description: record?.fields?.descripción || record?.fields?.descripcion || '',
        genre: record?.fields?.género_musical || record?.fields?.genero_musical || '',
        month: record?.fields?.mes_de_realización || record?.fields?.mes_de_realizacion || '',
        versions: record?.fields?.versiones || '',
      });
      return acc;
    }, {});
  }, [festivalRecords]);

  const schoolRecordsByDepartment = useMemo(() => {
    return schoolRecords.reduce((acc, record) => {
      const normalized = normalizeDepartmentName(record?.department);

      if (!normalized || normalized === 'DESCONOCIDO') return acc;

      if (!acc[normalized]) acc[normalized] = [];
      acc[normalized].push(record);
      return acc;
    }, {});
  }, [schoolRecords]);

  const marketRecordsByDepartment = useMemo(() => {
    return marketRecords.reduce((acc, record) => {
      const normalized = normalizeDepartmentName(record?.department);

      if (!normalized || normalized === 'DESCONOCIDO') return acc;

      if (!acc[normalized]) acc[normalized] = [];
      acc[normalized].push(record);
      return acc;
    }, {});
  }, [marketRecords]);

  const departmentSummaryByDepartment = useMemo(
    () => buildDepartmentSummaryMap(baseDepartmentCounts, festivalRecordsByDepartment, schoolRecordsByDepartment, marketRecordsByDepartment),
    [baseDepartmentCounts, festivalRecordsByDepartment, marketRecordsByDepartment, schoolRecordsByDepartment]
  );
  const generalCounts = useMemo(() => (
    Object.entries(departmentSummaryByDepartment).reduce((acc, [departmentName, stats]) => {
      acc[departmentName] = stats.totalRecords;
      return acc;
    }, {})
  ), [departmentSummaryByDepartment]);
  const generalAnalytics = useMemo(
    () => buildLayerAnalytics(generalCounts, [], selectedDept),
    [generalCounts, selectedDept]
  );
  const activeAnalytics = isGeneralLayer
    ? generalAnalytics
    : (isSchoolsLayer ? schoolAnalytics : (isFestivalsLayer ? festivalAnalytics : (isMarketsLayer ? marketAnalytics : emptyAnalytics)));

  const activeDepartmentCounts = useMemo(() => (
    isGeneralLayer
      ? generalCounts
      : isSchoolsLayer
      ? schoolCounts
      : isFestivalsLayer
      ? festivalCounts
      : isMarketsLayer
      ? marketCounts
      : baseDepartmentCounts
  ), [baseDepartmentCounts, festivalCounts, generalCounts, isFestivalsLayer, isGeneralLayer, isMarketsLayer, isSchoolsLayer, marketCounts, schoolCounts]);
  const activeLegendItems = useMemo(
    () => MAP_LAYER_CHOROPLETH_STEPS[activeCategory] || MAP_LAYER_CHOROPLETH_STEPS.General,
    [activeCategory]
  );
  const activePopupMarkupBuilder = useCallback(({ deptName, stats, embedded = false }) => {
    return buildDepartmentPopupMarkup({
      deptName,
      activeCategory,
      stats,
      embedded,
    });
  }, [activeCategory]);
  const activeMapCountLabel = isGeneralLayer
    ? `${formatMetricValue(activeAnalytics.totalRecords)} procesos mapeados`
    : ((isSchoolsLayer || isFestivalsLayer || isMarketsLayer) ? `${formatMetricValue(activeAnalytics.totalRecords)} registros` : 'Capa en preparación');
  const generalMapSummaryCards = useMemo(() => ([
    {
      key: 'schools',
      label: 'Escuelas',
      value: selectedDept === 'Nacional' ? schoolAnalytics.totalRecords : schoolAnalytics.selectedCount,
      icon: Library,
    },
    {
      key: 'festivals',
      label: 'Festivales',
      value: selectedDept === 'Nacional' ? festivalAnalytics.totalRecords : festivalAnalytics.selectedCount,
      icon: PartyPopper,
    },
    {
      key: 'markets',
      label: 'Mercados',
      value: selectedDept === 'Nacional' ? marketAnalytics.totalRecords : marketAnalytics.selectedCount,
      icon: Building2,
    },
  ]), [
    festivalAnalytics.selectedCount,
    festivalAnalytics.totalRecords,
    marketAnalytics.selectedCount,
    marketAnalytics.totalRecords,
    schoolAnalytics.selectedCount,
    schoolAnalytics.totalRecords,
    selectedDept,
  ]);
  const activeRankingLabel = isGeneralLayer ? 'Registros' : (isSchoolsLayer ? 'Escuelas' : (isFestivalsLayer ? 'Festivales' : 'Mercados'));
  const activeInfoNote = isGeneralLayer
    ? 'La capa General integra escuelas, festivales y mercados visibles por departamento para ofrecer una lectura sintética del ecosistema musical.'
    : isSchoolsLayer
    ? `La capa de Escuelas publica ${SCHOOL_PUBLICATION_POLICY.public.length} campos territoriales e institucionales, y reserva ${SCHOOL_PUBLICATION_POLICY.private.length} campos internos como contactos, dirección exacta, observaciones y trazas administrativas.`
    : isMarketsLayer
    ? `La capa de Mercados publica ${MARKET_PUBLICATION_POLICY.public.length} campos territoriales y programáticos, y reserva ${MARKET_PUBLICATION_POLICY.private.length} campos sensibles o innecesarios para la lectura pública, como NIT e identificación legal detallada.`
    : 'La base de datos del mapa está en construcción y consolidación permanente. Aquí se integran progresivamente los datos recopilados durante la actualización del Plan, los encuentros territoriales y otros ejercicios de caracterización adelantados por el PNMC.';
  const layerStatusCards = useMemo(() => {
    return ECOSYSTEM_LAYERS.map((layer) => {
      if (layer.key === 'General') {
        return {
          ...layer,
          status: 'Activo',
          metric: formatMetricValue(generalAnalytics.totalRecords),
          footnote: `Presencia en ${generalAnalytics.activeDepartments} departamentos`,
          ready: true,
        };
      }

      if (layer.key === 'Festivales') {
        return {
          ...layer,
          status: 'Activo',
          metric: formatMetricValue(festivalAnalytics.totalRecords),
          footnote: `Registros en ${festivalAnalytics.activeDepartments} departamentos`,
          ready: true,
        };
      }

      if (layer.key === 'Escuelas de Música') {
        return {
          ...layer,
          status: schoolLayerReady ? 'Activo' : 'Sincronizando',
          metric: formatMetricValue(schoolAnalytics.totalRecords),
          footnote: schoolLayerReady
            ? `Registros en ${schoolAnalytics.activeDepartments} departamentos`
            : 'Sincronizando la capa desde backend SQL',
          ready: schoolLayerReady,
        };
      }

      if (layer.key === 'Mercados Musicales') {
        return {
          ...layer,
          status: marketLayerReady ? 'Activo' : 'Sincronizando',
          metric: formatMetricValue(marketAnalytics.totalRecords),
          footnote: marketLayerReady
            ? `Registros en ${marketAnalytics.activeDepartments} departamentos`
            : 'Sincronizando la capa desde backend SQL',
          ready: marketLayerReady,
        };
      }

      return {
        ...layer,
        metric: 'Próx.',
        footnote: 'Esperando estructura de base de datos',
        ready: false,
      };
    });
  }, [festivalAnalytics, generalAnalytics, marketAnalytics, marketLayerReady, schoolAnalytics, schoolLayerReady]);
  const selectedNormalized = normalizeDepartmentName(selectedDept);
  const selectedDepartmentDisplayName = selectedDept === 'Nacional'
    ? 'Nacional'
    : getDepartmentDisplayName(selectedDept);
  const selectedFestivalRecords = useMemo(() => (
    selectedDept === 'Nacional' ? [] : (festivalRecordsByDepartment[selectedNormalized] || [])
  ), [festivalRecordsByDepartment, selectedDept, selectedNormalized]);
  const selectedSchoolRecords = useMemo(() => (
    selectedDept === 'Nacional' ? [] : (schoolRecordsByDepartment[selectedNormalized] || [])
  ), [schoolRecordsByDepartment, selectedDept, selectedNormalized]);
  const selectedMarketRecords = useMemo(() => (
    selectedDept === 'Nacional' ? [] : (marketRecordsByDepartment[selectedNormalized] || [])
  ), [marketRecordsByDepartment, selectedDept, selectedNormalized]);
  const selectedSchoolCapacity = useMemo(
    () => buildSchoolCapacityTotals(selectedSchoolRecords),
    [selectedSchoolRecords]
  );
  const selectedMarketCapacity = useMemo(
    () => buildMarketTotals(selectedMarketRecords),
    [selectedMarketRecords]
  );
  const scopedDepartmentNames = useMemo(() => {
    if (selectedDept === 'Nacional') return Object.keys(baseDepartmentCounts);
    return selectedNormalized ? [selectedNormalized] : [];
  }, [baseDepartmentCounts, selectedDept, selectedNormalized]);
  const allFestivalRecordItems = useMemo(() => (
    Object.entries(festivalRecordsByDepartment).flatMap(([department, items]) => (
      items.map((item, index) => ({
        id: `${department}-festival-${index}`,
        department,
        ...item,
      }))
    ))
  ), [festivalRecordsByDepartment]);
  const visibleFestivalRecordItems = useMemo(
    () => (selectedDept === 'Nacional'
      ? allFestivalRecordItems
      : allFestivalRecordItems.filter((item) => normalizeDepartmentName(item.department) === selectedNormalized)),
    [allFestivalRecordItems, selectedDept, selectedNormalized]
  );
  const visibleSchoolRecordItems = useMemo(
    () => (selectedDept === 'Nacional' ? schoolRecords : selectedSchoolRecords),
    [schoolRecords, selectedDept, selectedSchoolRecords]
  );
  const visibleMarketRecordItems = useMemo(
    () => (selectedDept === 'Nacional' ? marketRecords : selectedMarketRecords),
    [marketRecords, selectedDept, selectedMarketRecords]
  );
  const technicalSummaryCards = useMemo(() => {
    if (isGeneralLayer) {
      const stats = selectedDept === 'Nacional'
        ? {
          totalRecords: generalAnalytics.totalRecords,
          festivalCount: festivalAnalytics.totalRecords,
          schoolCount: schoolAnalytics.totalRecords,
          marketCount: marketAnalytics.totalRecords,
        }
        : (departmentSummaryByDepartment[selectedNormalized] || EMPTY_DEPARTMENT_SUMMARY);

      return [
        { label: 'Registros', value: stats.totalRecords },
        { label: 'Festivales', value: stats.festivalCount },
        { label: 'Escuelas', value: stats.schoolCount },
        { label: 'Mercados', value: stats.marketCount },
      ];
    }

    if (isSchoolsLayer) {
      const totals = selectedDept === 'Nacional' ? schoolCapacityTotals : selectedSchoolCapacity;
      const records = selectedDept === 'Nacional' ? schoolRecords : selectedSchoolRecords;

      return [
        { label: 'Escuelas', value: records.length },
        { label: 'Estudiantes', value: totals.totalStudents },
        { label: 'Docentes', value: totals.totalTeachers },
        { label: 'Con internet', value: totals.withInternet },
      ];
    }

    if (isMarketsLayer) {
      const totals = selectedDept === 'Nacional' ? marketCapacityTotals : selectedMarketCapacity;
      const records = selectedDept === 'Nacional' ? marketRecords : selectedMarketRecords;

      return [
        { label: 'Mercados', value: records.length },
        { label: 'Proyectos', value: totals.totalProjects },
        { label: 'Bookers', value: totals.totalBuyers },
        { label: 'Convocatorias', value: totals.openCalls },
      ];
    }

    return [
      { label: 'Festivales', value: visibleFestivalRecordItems.length },
      { label: 'Municipios', value: countDistinctValues(visibleFestivalRecordItems, (item) => item.municipality) },
      { label: 'Meses', value: countDistinctValues(visibleFestivalRecordItems, (item) => item.month) },
      { label: 'Géneros', value: countDistinctValues(visibleFestivalRecordItems, (item) => item.genre) },
    ];
  }, [
    departmentSummaryByDepartment,
    festivalAnalytics.totalRecords,
    generalAnalytics.totalRecords,
    isGeneralLayer,
    isMarketsLayer,
    isSchoolsLayer,
    marketAnalytics.totalRecords,
    marketCapacityTotals,
    marketRecords,
    schoolAnalytics.totalRecords,
    schoolCapacityTotals,
    schoolRecords,
    selectedDept,
    selectedMarketCapacity,
    selectedMarketRecords,
    selectedNormalized,
    selectedSchoolCapacity,
    selectedSchoolRecords,
    visibleFestivalRecordItems,
  ]);
  const technicalMatrixSortOptions = useMemo(() => {
    if (isGeneralLayer) {
      return [
        { key: 'totalRecords', label: 'Total de registros' },
        { key: 'festivalCount', label: 'Festivales' },
        { key: 'schoolCount', label: 'Escuelas' },
        { key: 'marketCount', label: 'Mercados' },
      ];
    }

    if (isSchoolsLayer) {
      return [
        { key: 'schoolCount', label: 'Escuelas' },
        { key: 'totalStudents', label: 'Estudiantes' },
        { key: 'totalTeachers', label: 'Docentes' },
        { key: 'withInternet', label: 'Con internet' },
      ];
    }

    if (isMarketsLayer) {
      return [
        { key: 'marketCount', label: 'Mercados' },
        { key: 'totalMarketProjects', label: 'Proyectos' },
        { key: 'totalMarketBuyers', label: 'Bookers' },
        { key: 'marketOpenCalls', label: 'Convocatorias' },
      ];
    }

    return [
      { key: 'festivalCount', label: 'Festivales' },
      { key: 'festivalMunicipalities', label: 'Municipios' },
      { key: 'festivalGenres', label: 'Géneros' },
      { key: 'festivalMonths', label: 'Meses' },
    ];
  }, [isGeneralLayer, isMarketsLayer, isSchoolsLayer]);
  const technicalDepartmentColumns = useMemo(() => {
    if (isGeneralLayer) {
      return [
        { key: 'departmentLabel', label: 'Departamento' },
        { key: 'totalRecords', label: 'Total' },
        { key: 'festivalCount', label: 'Festivales' },
        { key: 'schoolCount', label: 'Escuelas' },
        { key: 'marketCount', label: 'Mercados' },
        { key: 'totalStudents', label: 'Estudiantes' },
        { key: 'totalTeachers', label: 'Docentes' },
        { key: 'totalMarketProjects', label: 'Proyectos' },
        { key: 'totalMarketBuyers', label: 'Bookers' },
      ];
    }

    if (isSchoolsLayer) {
      return [
        { key: 'departmentLabel', label: 'Departamento' },
        { key: 'schoolCount', label: 'Escuelas' },
        { key: 'totalStudents', label: 'Estudiantes' },
        { key: 'totalTeachers', label: 'Docentes' },
        { key: 'totalInstruments', label: 'Instrumentos' },
        { key: 'totalGroups', label: 'Agrupaciones' },
        { key: 'withInternet', label: 'Internet' },
        { key: 'activeSchools', label: 'Activas' },
      ];
    }

    if (isMarketsLayer) {
      return [
        { key: 'departmentLabel', label: 'Departamento' },
        { key: 'marketCount', label: 'Mercados' },
        { key: 'marketMunicipalities', label: 'Ciudades' },
        { key: 'totalMarketProjects', label: 'Proyectos' },
        { key: 'totalMarketBuyers', label: 'Bookers' },
        { key: 'marketOpenCalls', label: 'Convocatorias' },
        { key: 'marketLinkedFestival', label: 'Con festival' },
      ];
    }

    return [
      { key: 'departmentLabel', label: 'Departamento' },
      { key: 'festivalCount', label: 'Festivales' },
      { key: 'festivalMunicipalities', label: 'Municipios' },
      { key: 'festivalMonths', label: 'Meses' },
      { key: 'festivalGenres', label: 'Géneros' },
      { key: 'festivalShare', label: '% del total' },
    ];
  }, [isGeneralLayer, isMarketsLayer, isSchoolsLayer]);
  const technicalDepartmentRows = useMemo(() => {
    const rows = scopedDepartmentNames.map((departmentKey) => {
      const summary = departmentSummaryByDepartment[departmentKey] || EMPTY_DEPARTMENT_SUMMARY;
      const festivals = festivalRecordsByDepartment[departmentKey] || [];
      const schools = schoolRecordsByDepartment[departmentKey] || [];
      const markets = marketRecordsByDepartment[departmentKey] || [];
      const schoolTotals = buildSchoolCapacityTotals(schools);
      const marketTotals = buildMarketTotals(markets);

      return {
        departmentKey,
        departmentLabel: getDepartmentDisplayName(departmentKey),
        totalRecords: summary.totalRecords,
        festivalCount: festivals.length,
        schoolCount: schools.length,
        marketCount: markets.length,
        totalStudents: schoolTotals.totalStudents,
        totalTeachers: schoolTotals.totalTeachers,
        totalInstruments: schoolTotals.totalInstruments,
        totalGroups: schoolTotals.totalGroups,
        withInternet: schoolTotals.withInternet,
        activeSchools: schoolTotals.active,
        totalMarketProjects: marketTotals.totalProjects,
        totalMarketBuyers: marketTotals.totalBuyers,
        marketOpenCalls: marketTotals.openCalls,
        marketLinkedFestival: marketTotals.linkedToFestival,
        marketMunicipalities: countDistinctValues(markets, (item) => item.municipality),
        festivalMunicipalities: countDistinctValues(festivals, (item) => item.municipality),
        festivalMonths: countDistinctValues(festivals, (item) => item.month),
        festivalGenres: countDistinctValues(festivals, (item) => item.genre),
        festivalShare: festivalAnalytics.totalRecords > 0 ? Math.round((festivals.length / festivalAnalytics.totalRecords) * 100) : 0,
      };
    });

    const sortKey = isGeneralLayer
      ? 'totalRecords'
      : isSchoolsLayer
      ? 'schoolCount'
      : isMarketsLayer
      ? 'marketCount'
      : 'festivalCount';

    return rows.sort((a, b) => {
      const metricDelta = (b[sortKey] || 0) - (a[sortKey] || 0);
      if (metricDelta !== 0) return metricDelta;
      return a.departmentLabel.localeCompare(b.departmentLabel);
    });
  }, [
    departmentSummaryByDepartment,
    festivalAnalytics.totalRecords,
    festivalRecordsByDepartment,
    isGeneralLayer,
    isMarketsLayer,
    isSchoolsLayer,
    marketRecordsByDepartment,
    schoolRecordsByDepartment,
    scopedDepartmentNames,
  ]);
  const filteredTechnicalDepartmentRows = useMemo(() => {
    const normalizedQuery = normalizeDepartmentName(technicalDepartmentQuery);
    const targetSortKey = technicalMatrixSortKey === 'default'
      ? (technicalMatrixSortOptions[0]?.key || 'departmentLabel')
      : technicalMatrixSortKey;
    const filteredRows = technicalDepartmentRows.filter((row) => {
      if (!normalizedQuery) return true;
      return buildSearchIndexValue([row.departmentLabel]).includes(normalizedQuery);
    });

    return filteredRows.sort((leftRow, rightRow) => {
      const metricComparison = compareTechnicalValues(leftRow[targetSortKey], rightRow[targetSortKey], technicalMatrixSortDirection);
      if (metricComparison !== 0) return metricComparison;
      return leftRow.departmentLabel.localeCompare(rightRow.departmentLabel, 'es-CO');
    });
  }, [technicalDepartmentQuery, technicalDepartmentRows, technicalMatrixSortDirection, technicalMatrixSortKey, technicalMatrixSortOptions]);
  const technicalSignalCards = useMemo(() => {
    const topDepartment = technicalDepartmentRows[0];

    if (isGeneralLayer) {
      return [
        { label: 'Cobertura', value: `${activeAnalytics.coverage}%`, note: `${activeAnalytics.activeDepartments} departamentos` },
        { label: 'Mayor presencia', value: topDepartment ? topDepartment.departmentLabel : '—', note: topDepartment ? `${formatMetricValue(topDepartment.totalRecords)} registros` : 'Sin lectura' },
        { label: 'Promedio territorial', value: activeAnalytics.activeDepartments > 0 ? formatMetricValue(activeAnalytics.totalRecords / activeAnalytics.activeDepartments) : '0', note: 'Registros por depto. activo' },
        { label: 'Vacíos', value: formatMetricValue(activeAnalytics.uncoveredDepartments.length), note: 'Departamentos sin cobertura' },
      ];
    }

    if (isSchoolsLayer) {
      return [
        { label: 'Cobertura', value: `${activeAnalytics.coverage}%`, note: `${activeAnalytics.activeDepartments} departamentos` },
        { label: 'Mayor red', value: topDepartment ? topDepartment.departmentLabel : '—', note: topDepartment ? `${formatMetricValue(topDepartment.schoolCount)} escuelas` : 'Sin lectura' },
        { label: 'Promedio estudiantes', value: schoolRecords.length > 0 ? formatMetricValue(schoolCapacityTotals.totalStudents / schoolRecords.length) : '0', note: 'Por escuela visible' },
        { label: 'Con internet', value: schoolRecords.length > 0 ? `${Math.round((schoolCapacityTotals.withInternet / schoolRecords.length) * 100)}%` : '0%', note: `${formatMetricValue(schoolCapacityTotals.withInternet)} escuelas` },
      ];
    }

    if (isMarketsLayer) {
      return [
        { label: 'Cobertura', value: `${activeAnalytics.coverage}%`, note: `${activeAnalytics.activeDepartments} departamentos` },
        { label: 'Mayor actividad', value: topDepartment ? topDepartment.departmentLabel : '—', note: topDepartment ? `${formatMetricValue(topDepartment.marketCount)} mercados` : 'Sin lectura' },
        { label: 'Promedio proyectos', value: marketCapacityTotals.totalMarkets > 0 ? formatMetricValue(marketCapacityTotals.averageProjectsPerMarket) : '0', note: 'Por mercado visible' },
        { label: 'Convocatoria abierta', value: marketCapacityTotals.totalMarkets > 0 ? `${Math.round((marketCapacityTotals.openCalls / marketCapacityTotals.totalMarkets) * 100)}%` : '0%', note: `${formatMetricValue(marketCapacityTotals.openCalls)} mercados` },
      ];
    }

    return [
      { label: 'Cobertura', value: `${activeAnalytics.coverage}%`, note: `${activeAnalytics.activeDepartments} departamentos` },
      { label: 'Mayor actividad', value: topDepartment ? topDepartment.departmentLabel : '—', note: topDepartment ? `${formatMetricValue(topDepartment.festivalCount)} festivales` : 'Sin lectura' },
      { label: 'Municipios visibles', value: formatMetricValue(countDistinctValues(visibleFestivalRecordItems, (item) => `${item.department}-${item.municipality}`)), note: 'Con presencia festivalera' },
      { label: 'Géneros reportados', value: formatMetricValue(countDistinctValues(visibleFestivalRecordItems, (item) => item.genre)), note: 'Lectura temática disponible' },
    ];
  }, [
    activeAnalytics,
    isGeneralLayer,
    isMarketsLayer,
    isSchoolsLayer,
    marketCapacityTotals,
    schoolCapacityTotals,
    schoolRecords.length,
    technicalDepartmentRows,
    visibleFestivalRecordItems,
  ]);
  const technicalRecordFocusOptions = useMemo(() => {
    if (isSchoolsLayer) {
      return [
        { key: 'all', label: 'Todas' },
        { key: 'active', label: 'Activas' },
        { key: 'internet', label: 'Con internet' },
        { key: 'community', label: 'Comunitarias' },
      ];
    }

    if (isMarketsLayer) {
      return [
        { key: 'all', label: 'Todos' },
        { key: 'openCall', label: 'Con convocatoria' },
        { key: 'linkedFestival', label: 'Con festival' },
        { key: 'publicFunding', label: 'Con recursos públicos' },
      ];
    }

    return [
      { key: 'all', label: 'Todos' },
      { key: 'withMunicipality', label: 'Con municipio' },
      { key: 'withMonth', label: 'Con mes' },
      { key: 'withGenre', label: 'Con género' },
    ];
  }, [isMarketsLayer, isSchoolsLayer]);
  const technicalRecordSortOptions = useMemo(() => {
    if (isSchoolsLayer) {
      return [
        { key: 'name', label: 'Nombre' },
        { key: 'students', label: 'Estudiantes' },
        { key: 'teachers', label: 'Docentes' },
        { key: 'municipality', label: 'Municipio' },
      ];
    }

    if (isMarketsLayer) {
      return [
        { key: 'name', label: 'Nombre' },
        { key: 'municipality', label: 'Ciudad' },
        { key: 'averageProjects', label: 'Proyectos' },
        { key: 'averageBuyers', label: 'Bookers' },
      ];
    }

    return [
      { key: 'name', label: 'Nombre' },
      { key: 'municipality', label: 'Municipio' },
      { key: 'month', label: 'Mes' },
      { key: 'genre', label: 'Género' },
    ];
  }, [isMarketsLayer, isSchoolsLayer]);
  const technicalRecordColumns = useMemo(() => {
    if (isSchoolsLayer) {
      return [
        { key: 'name', label: 'Escuela' },
        { key: 'departmentLabel', label: 'Departamento' },
        { key: 'municipality', label: 'Municipio' },
        { key: 'status', label: 'Estado' },
        { key: 'schoolType', label: 'Tipo' },
        { key: 'students', label: 'Estudiantes' },
        { key: 'teachers', label: 'Docentes' },
        { key: 'instruments', label: 'Instrumentos' },
      ];
    }

    if (isMarketsLayer) {
      return [
        { key: 'name', label: 'Mercado' },
        { key: 'departmentLabel', label: 'Departamento' },
        { key: 'municipality', label: 'Ciudad' },
        { key: 'periodicity', label: 'Periodicidad' },
        { key: 'responsibleEntity', label: 'Entidad responsable' },
        { key: 'averageProjectsLabel', label: 'Proyectos' },
        { key: 'averageBuyersLabel', label: 'Bookers' },
        { key: 'openCall', label: 'Convocatoria' },
      ];
    }

    return [
      { key: 'name', label: 'Festival' },
      { key: 'departmentLabel', label: 'Departamento' },
      { key: 'municipality', label: 'Municipio' },
      { key: 'month', label: 'Mes' },
      { key: 'genre', label: 'Género' },
      { key: 'versions', label: 'Versiones' },
    ];
  }, [isMarketsLayer, isSchoolsLayer]);
  const technicalRecordRows = useMemo(() => {
    if (isSchoolsLayer) {
      return visibleSchoolRecordItems.map((item, index) => ({
        id: item.id || `${item.department}-school-${index}`,
        name: item.name,
        departmentLabel: getDepartmentDisplayName(item.department),
        municipality: item.municipality,
        status: item.status,
        schoolType: item.schoolType,
        students: item.students,
        teachers: item.teachers,
        instruments: item.instruments,
        hasInternet: item.hasInternet,
        communityOrganization: item.communityOrganization,
      }));
    }

    if (isMarketsLayer) {
      return visibleMarketRecordItems.map((item, index) => ({
        id: item.id || `${item.department}-market-${index}`,
        name: item.name,
        departmentLabel: getDepartmentDisplayName(item.department),
        municipality: item.municipality,
        periodicity: item.periodicity,
        responsibleEntity: item.responsibleEntity,
        averageProjects: item.averageProjects,
        averageProjectsLabel: item.averageProjectsLabel || formatMetricValue(item.averageProjects),
        averageBuyers: item.averageBuyers,
        averageBuyersLabel: item.averageBuyersLabel || formatMetricValue(item.averageBuyers),
        openCall: item.openCall,
        linkedFestival: item.linkedFestival,
        publicBudgetShare: item.publicBudgetShare,
      }));
    }

    return visibleFestivalRecordItems.map((item) => ({
      id: item.id,
      name: item.name,
      departmentLabel: getDepartmentDisplayName(item.department),
      municipality: item.municipality,
      month: item.month,
      genre: item.genre,
      versions: item.versions,
    }));
  }, [isMarketsLayer, isSchoolsLayer, visibleFestivalRecordItems, visibleMarketRecordItems, visibleSchoolRecordItems]);
  const filteredTechnicalRecordRows = useMemo(() => {
    const normalizedQuery = normalizeDepartmentName(technicalRecordQuery);
    const targetSortKey = technicalRecordSortKey === 'default'
      ? (technicalRecordSortOptions[0]?.key || 'name')
      : technicalRecordSortKey;
    const filteredRows = technicalRecordRows.filter((row) => {
      const matchesQuery = !normalizedQuery || buildSearchIndexValue(Object.values(row)).includes(normalizedQuery);

      if (!matchesQuery) return false;

      if (isSchoolsLayer) {
        if (technicalRecordFocus === 'active') return row.status === 'Activa';
        if (technicalRecordFocus === 'internet') return row.hasInternet === 'Sí';
        if (technicalRecordFocus === 'community') return row.communityOrganization === 'Sí';
        return true;
      }

      if (isMarketsLayer) {
        if (technicalRecordFocus === 'openCall') return row.openCall === 'Sí';
        if (technicalRecordFocus === 'linkedFestival') return row.linkedFestival === 'Sí';
        if (technicalRecordFocus === 'publicFunding') return buildSearchIndexValue([row.publicBudgetShare]).includes('PUBLIC');
        return true;
      }

      if (technicalRecordFocus === 'withMunicipality') return Boolean(row.municipality);
      if (technicalRecordFocus === 'withMonth') return Boolean(row.month);
      if (technicalRecordFocus === 'withGenre') return Boolean(row.genre);
      return true;
    });

    return filteredRows.sort((leftRow, rightRow) => {
      const metricComparison = compareTechnicalValues(leftRow[targetSortKey], rightRow[targetSortKey], technicalRecordSortDirection);
      if (metricComparison !== 0) return metricComparison;
      return String(leftRow.name || '').localeCompare(String(rightRow.name || ''), 'es-CO');
    });
  }, [
    isMarketsLayer,
    isSchoolsLayer,
    technicalRecordFocus,
    technicalRecordQuery,
    technicalRecordRows,
    technicalRecordSortDirection,
    technicalRecordSortKey,
    technicalRecordSortOptions,
  ]);
  const technicalViewTitle = isGeneralLayer
    ? 'Consulta integrada por departamento'
    : isSchoolsLayer
    ? 'Consulta técnica de escuelas'
    : isMarketsLayer
    ? 'Consulta técnica de mercados'
    : 'Consulta técnica de festivales';
  const technicalViewDescription = isGeneralLayer
    ? 'Una lectura tabular para contrastar rápidamente la presencia de festivales, escuelas y mercados por territorio.'
    : isSchoolsLayer
    ? 'Una matriz especializada para revisar capacidad formativa, operación y cobertura territorial de las escuelas visibles.'
    : isMarketsLayer
    ? 'Una lectura de datos para revisar intensidad territorial, capacidad de conexión y operación pública de los mercados.'
    : 'Una matriz especializada para revisar distribución territorial, municipios y variación temática de los festivales visibles.';
  const technicalConsultationSections = useMemo(() => {
    const sortOption = technicalMatrixSortOptions.find((option) => option.key === technicalMatrixSortKey) || technicalMatrixSortOptions[0];
    const recordSortOption = technicalRecordSortOptions.find((option) => option.key === technicalRecordSortKey) || technicalRecordSortOptions[0];
    const activeFocusOption = technicalRecordFocusOptions.find((option) => option.key === technicalRecordFocus);
    const topDepartment = technicalDepartmentRows[0];
    const sortDirectionLabel = technicalMatrixSortDirection === 'desc' ? 'Descendente' : 'Ascendente';
    const recordDirectionLabel = technicalRecordSortDirection === 'desc' ? 'Descendente' : 'Ascendente';

    if (isGeneralLayer) {
      return [
        { label: 'Unidad de análisis', value: 'Departamento', note: 'Cruce integrado entre capas visibles del ecosistema.' },
        { label: 'Territorio activo', value: selectedDepartmentDisplayName, note: selectedDept === 'Nacional' ? 'Consulta nacional completa.' : 'Lectura acotada al territorio seleccionado.' },
        { label: 'Orden de matriz', value: sortOption?.label || 'Total de registros', note: sortDirectionLabel },
        { label: 'Filas visibles', value: `${formatMetricValue(filteredTechnicalDepartmentRows.length)} filas`, note: technicalDepartmentQuery ? `Búsqueda: ${technicalDepartmentQuery}` : 'Sin búsqueda territorial aplicada.' },
        { label: 'Mayor cobertura', value: topDepartment?.departmentLabel || 'Sin lectura', note: topDepartment ? `${formatMetricValue(topDepartment.totalRecords)} registros integrados.` : 'Esperando registros visibles.' },
        { label: 'Detalle territorial', value: 'Clic en departamento', note: 'Abre el desglose inferior de festivales, escuelas y mercados.' },
      ];
    }

    if (isSchoolsLayer) {
      return [
        { label: 'Unidad de análisis', value: 'Escuelas', note: 'Lectura pública de capacidad formativa y operación territorial.' },
        { label: 'Territorio activo', value: selectedDepartmentDisplayName, note: selectedDept === 'Nacional' ? 'Consulta nacional completa.' : 'Lectura acotada al territorio seleccionado.' },
        { label: 'Orden de matriz', value: sortOption?.label || 'Escuelas', note: sortDirectionLabel },
        { label: 'Orden de registros', value: recordSortOption?.label || 'Nombre', note: recordDirectionLabel },
        { label: 'Filtro de registros', value: activeFocusOption?.label || 'Todas', note: `${formatMetricValue(filteredTechnicalRecordRows.length)} registros visibles.` },
        { label: 'Detalle territorial', value: 'Clic en departamento', note: 'Abre el listado de escuelas visibles en el bloque inferior.' },
      ];
    }

    if (isMarketsLayer) {
      return [
        { label: 'Unidad de análisis', value: 'Mercados', note: 'Lectura pública de circulación, operación y conexión sectorial.' },
        { label: 'Territorio activo', value: selectedDepartmentDisplayName, note: selectedDept === 'Nacional' ? 'Consulta nacional completa.' : 'Lectura acotada al territorio seleccionado.' },
        { label: 'Orden de matriz', value: sortOption?.label || 'Mercados', note: sortDirectionLabel },
        { label: 'Orden de registros', value: recordSortOption?.label || 'Nombre', note: recordDirectionLabel },
        { label: 'Filtro de registros', value: activeFocusOption?.label || 'Todos', note: `${formatMetricValue(filteredTechnicalRecordRows.length)} registros visibles.` },
        { label: 'Detalle territorial', value: 'Clic en departamento', note: 'Abre el listado de mercados visibles en el bloque inferior.' },
      ];
    }

    return [
      { label: 'Unidad de análisis', value: 'Festivales', note: 'Lectura pública de presencia, municipios, meses y géneros.' },
      { label: 'Territorio activo', value: selectedDepartmentDisplayName, note: selectedDept === 'Nacional' ? 'Consulta nacional completa.' : 'Lectura acotada al territorio seleccionado.' },
      { label: 'Orden de matriz', value: sortOption?.label || 'Festivales', note: sortDirectionLabel },
      { label: 'Orden de registros', value: recordSortOption?.label || 'Nombre', note: recordDirectionLabel },
      { label: 'Filtro de registros', value: activeFocusOption?.label || 'Todos', note: `${formatMetricValue(filteredTechnicalRecordRows.length)} registros visibles.` },
      { label: 'Detalle territorial', value: 'Clic en departamento', note: 'Abre el listado de festivales visibles en el bloque inferior.' },
    ];
  }, [
    filteredTechnicalDepartmentRows.length,
    filteredTechnicalRecordRows.length,
    isGeneralLayer,
    isMarketsLayer,
    isSchoolsLayer,
    selectedDepartmentDisplayName,
    selectedDept,
    technicalDepartmentQuery,
    technicalDepartmentRows,
    technicalMatrixSortDirection,
    technicalMatrixSortKey,
    technicalMatrixSortOptions,
    technicalRecordFocus,
    technicalRecordFocusOptions,
    technicalRecordSortDirection,
    technicalRecordSortKey,
    technicalRecordSortOptions,
  ]);
  const technicalRecordsTitle = isSchoolsLayer
    ? 'Escuelas visibles'
    : isMarketsLayer
    ? 'Mercados visibles'
    : 'Festivales visibles';
  const activeEmbeddedGeneralCard = useMemo(() => hoveredDepartmentCard, [hoveredDepartmentCard]);
  const departmentDrilldownSections = useMemo(() => ([
    {
      key: 'Festivales',
      label: 'Festivales',
      count: selectedFestivalRecords.length,
      accent: 'text-[#14532d]',
      description: 'Registros de circulación y festivales destacados en este territorio.',
    },
    {
      key: 'Escuelas de Música',
      label: 'Escuelas de Música',
      count: selectedSchoolRecords.length,
      accent: 'text-[#14532d]',
      description: 'Procesos formativos y escuelas visibles en la capa pública del ecosistema.',
    },
    {
      key: 'Mercados Musicales',
      label: 'Mercados Musicales',
      count: selectedMarketRecords.length,
      accent: 'text-[#14532d]',
      description: 'Nodos de circulación, negocios y articulación sectorial visibles en este territorio.',
    },
  ]), [selectedFestivalRecords.length, selectedMarketRecords.length, selectedSchoolRecords.length]);

  const handleDepartmentDrilldown = useCallback((departmentName, preferredSection = activeCategory) => {
    const nextSelectedDept = getDepartmentSelectionValue(departmentName);
    setselectedDept(nextSelectedDept);
    setExpandedDepartmentSection(
      preferredSection === 'Escuelas de Música'
        ? 'Escuelas de Música'
        : preferredSection === 'Mercados Musicales'
        ? 'Mercados Musicales'
        : 'Festivales'
    );
    setExpandedFestivalRecordId(null);
    setExpandedSchoolRecordId(null);
    setExpandedMarketRecordId(null);

    window.requestAnimationFrame(() => {
      window.requestAnimationFrame(() => {
        scrollToElementWithOffset(departmentDetailRef.current);
      });
    });
  }, [activeCategory]);

  const handleReturnToNationalView = useCallback(() => {
    setselectedDept('Nacional');
    setExpandedDepartmentSection(
      activeCategory === 'Escuelas de Música'
        ? 'Escuelas de Música'
        : activeCategory === 'Mercados Musicales'
        ? 'Mercados Musicales'
        : 'Festivales'
    );
    setExpandedFestivalRecordId(null);
    setExpandedSchoolRecordId(null);
    setExpandedMarketRecordId(null);
    setHoveredDepartmentCard(null);
    setMapResetToken((current) => current + 1);

    window.requestAnimationFrame(() => {
      window.requestAnimationFrame(() => {
        scrollToElementWithOffset(mapWorkspaceRef.current);
      });
    });
  }, [activeCategory]);

  const archipelagoCount = activeDepartmentCounts[ARCHIPELAGO_NORMALIZED_NAME] || 0;
  const archipelagoSummary = departmentSummaryByDepartment[ARCHIPELAGO_NORMALIZED_NAME] || EMPTY_DEPARTMENT_SUMMARY;
  const archipelagoFeature = useMemo(
    () => geoData?.features?.find(
      (feature) => getFeatureDepartmentNormalizedName(feature) === ARCHIPELAGO_NORMALIZED_NAME
    ) || null,
    [geoData]
  );
  const archipelagoIsSelected = selectedDept === 'Nacional' || selectedNormalized === ARCHIPELAGO_NORMALIZED_NAME;
  const enlargedArchipelagoFeature = useMemo(
    () => buildScaledFeature(archipelagoFeature),
    [archipelagoFeature]
  );
  const archipelagoVisualStyle = useMemo(() => {
    const baseStyle = getChoroplethStyles(
      isGeneralLayer || isFestivalsLayer || isSchoolsLayer || isMarketsLayer ? archipelagoCount : 0,
      archipelagoIsSelected,
      activeCategory
    );

    return {
      ...baseStyle,
      fillOpacity: Math.max(baseStyle.fillOpacity, 0.78),
      weight: Math.max(baseStyle.weight, archipelagoIsSelected ? 2.8 : 2.1),
      color: archipelagoIsSelected ? '#0f172a' : baseStyle.color,
    };
  }, [activeCategory, archipelagoCount, archipelagoIsSelected, isFestivalsLayer, isGeneralLayer, isMarketsLayer, isSchoolsLayer]);

  const fetchMapData = async () => {
    setIsLoading(true);
    setMapError(null);
    try {
      const geoPayload = await fetchColombiaGeoJson();
      const departmentGeoJson = geoPayload?.type === 'FeatureCollection'
        ? geoPayload
        : { type: 'FeatureCollection', features: [] };
      const nextMunicipalityGeoJson = geoPayload?.municipalities?.type === 'FeatureCollection'
        ? geoPayload.municipalities
        : { type: 'FeatureCollection', features: [] };

      setRuntimeDepartmentCatalog(departmentGeoJson.features || []);
      setGeoData({
        ...departmentGeoJson,
        municipalities: nextMunicipalityGeoJson,
      });

      const baseCounts = getBaseDepartmentCounts();
      setFestivalCounts(baseCounts);
      setSchoolCounts(baseCounts);
      setMarketCounts(baseCounts);
      setSchoolLayerReady(false);
      setMarketLayerReady(false);

      const cachedCounts = window.localStorage.getItem(FESTIVAL_COUNTS_CACHE_KEY);
      if (cachedCounts) {
        try {
          const parsedCache = JSON.parse(cachedCounts);
          setFestivalCounts({ ...baseCounts, ...parsedCache });
        } catch (cacheError) {
          console.warn('No se pudo leer la caché local del mapa:', cacheError);
        }
      }

      const cachedSchoolCounts = window.localStorage.getItem(SCHOOL_COUNTS_CACHE_KEY);
      if (cachedSchoolCounts) {
        try {
          const parsedCache = JSON.parse(cachedSchoolCounts);
          setSchoolCounts({ ...baseCounts, ...parsedCache });
        } catch (cacheError) {
          console.warn('No se pudo leer la caché local de escuelas:', cacheError);
        }
      }

      const cachedMarketCounts = window.localStorage.getItem(MARKET_COUNTS_CACHE_KEY);
      if (cachedMarketCounts) {
        try {
          const parsedCache = JSON.parse(cachedMarketCounts);
          setMarketCounts({ ...baseCounts, ...parsedCache });
        } catch (cacheError) {
          console.warn('No se pudo leer la caché local de mercados:', cacheError);
        }
      }

      const [festivalDataResult, schoolDataResult, marketDataResult] = await Promise.allSettled([
        fetchFestivalRecords(),
        fetchSchoolRecords(),
        fetchMarketRecords(),
      ]);

      if (festivalDataResult.status === 'fulfilled') {
        const counts = {
          ...baseCounts,
          ...buildFestivalCounts(festivalDataResult.value.records),
        };

        setFestivalRecords(festivalDataResult.value.records || []);
        setFestivalCounts(counts);
        window.localStorage.setItem(FESTIVAL_COUNTS_CACHE_KEY, JSON.stringify(counts));
      } else {
        console.warn('No se pudo sincronizar la capa de festivales:', festivalDataResult.reason);
      }

      if (schoolDataResult.status === 'fulfilled') {
        const publicSchoolRecords = (schoolDataResult.value.records || [])
          .map(buildPublicSchoolRecord)
          .filter(Boolean);
        const counts = {
          ...baseCounts,
          ...buildSchoolCounts(publicSchoolRecords),
        };

        setSchoolRecords(publicSchoolRecords);
        setSchoolCounts(counts);
        setSchoolLayerReady(true);
        window.localStorage.setItem(SCHOOL_COUNTS_CACHE_KEY, JSON.stringify(counts));
      } else {
        console.warn('No se pudo sincronizar la capa de escuelas:', schoolDataResult.reason);
      }

      if (marketDataResult.status === 'fulfilled') {
        const publicMarketRecords = (marketDataResult.value.records || [])
          .map(buildPublicMarketRecord)
          .filter(Boolean);
        const counts = {
          ...baseCounts,
          ...buildMarketCounts(publicMarketRecords),
        };

        setMarketRecords(publicMarketRecords);
        setMarketCounts(counts);
        setMarketLayerReady(true);
        window.localStorage.setItem(MARKET_COUNTS_CACHE_KEY, JSON.stringify(counts));
      } else {
        console.warn('No se pudo sincronizar la capa de mercados:', marketDataResult.reason);
      }
    } catch (err) {
      console.error("Fallo crítico en el mapa:", err);
      setMapError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchMapData();
  }, []);

  const getStyle = useCallback((feature) => {
    const deptNameInGeo = getFeatureDepartmentNormalizedName(feature);
    if (deptNameInGeo === ARCHIPELAGO_NORMALIZED_NAME) {
      return {
        fillColor: 'transparent',
        fillOpacity: 0,
        color: 'transparent',
        weight: 0,
        opacity: 0,
      };
    }
    const count = activeDepartmentCounts[deptNameInGeo] || 0;
    const selectedNormalized = normalizeDepartmentName(selectedDept);
    const isSelected = selectedDept === 'Nacional' || selectedNormalized === deptNameInGeo;
    return getChoroplethStyles(
      isGeneralLayer || isFestivalsLayer || isSchoolsLayer || isMarketsLayer ? count : 0,
      isSelected,
      activeCategory
    );
  }, [activeCategory, activeDepartmentCounts, isFestivalsLayer, isGeneralLayer, isMarketsLayer, isSchoolsLayer, selectedDept]);

  useEffect(() => {
    if (geoJsonRef.current) {
      geoJsonRef.current.setStyle(getStyle);
    }
  }, [getStyle, geoData]);

  useEffect(() => {
    setHoveredDepartmentCard(null);
  }, [activeCategory]);

  useEffect(() => {
    setTechnicalDepartmentQuery('');
    setTechnicalRecordQuery('');
    setTechnicalMatrixSortDirection('desc');
    setTechnicalRecordSortDirection('desc');
    setTechnicalRecordFocus('all');
    setTechnicalMatrixSortKey(
      activeCategory === 'General'
        ? 'totalRecords'
        : activeCategory === 'Escuelas de Música'
        ? 'schoolCount'
        : activeCategory === 'Mercados Musicales'
        ? 'marketCount'
        : 'festivalCount'
    );
    setTechnicalRecordSortKey(
      activeCategory === 'Escuelas de Música'
        ? 'students'
        : activeCategory === 'Mercados Musicales'
        ? 'averageProjects'
        : 'name'
      );
  }, [activeCategory]);

  useEffect(() => {
    if (!navigationRequest?.requestId) return;

    const nextLayer = ECOSYSTEM_LAYERS.some((layer) => layer.key === navigationRequest.targetLayer)
      ? navigationRequest.targetLayer
      : 'General';

    setActiveView(navigationRequest.targetView || 'map');
    setActiveCategory(nextLayer);
    setselectedDept('Nacional');
    setExpandedDepartmentSection(
      nextLayer === 'Escuelas de Música'
        ? 'Escuelas de Música'
        : nextLayer === 'Mercados Musicales'
        ? 'Mercados Musicales'
        : 'Festivales'
    );
    setExpandedFestivalRecordId(null);
    setExpandedSchoolRecordId(null);
    setExpandedMarketRecordId(null);
    setHoveredDepartmentCard(null);
    setMapResetToken((current) => current + 1);

    if (navigationRequest.scrollToWorkspace !== false) {
      window.requestAnimationFrame(() => {
        window.requestAnimationFrame(() => {
          scrollToElementWithOffset(mapWorkspaceRef.current);
        });
      });
    }
  }, [navigationRequest]);

  return (
    <div className="bg-slate-50 min-h-screen text-left relative overflow-x-hidden">
      <PageHero 
        tag="Mapa Ecosistémico" 
        title="Mapa" 
        titleAccent="Ecosistémico" 
        description="Un tablero territorial para leer el ecosistema musical de Colombia por capas. Ya integra festivales, escuelas de música y mercados musicales, y deja preparada la expansión hacia nuevas capas del ecosistema." 
        bgImage="https://images.unsplash.com/photo-1774558396280-c14b21198674?q=80&w=1470&auto=format&fit=crop" 
        onBack={onBack} 
      />

      <ContentWrapper className="!py-8">
        <div className="mb-8 overflow-hidden rounded-[2.2rem] border border-slate-200 bg-white">
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 divide-y md:divide-y-0 md:divide-x divide-slate-100">
            {layerStatusCards.map((layer) => (
              <button
                key={layer.key}
                onClick={() => setActiveCategory(layer.key)}
                title={layer.description}
                className={`min-h-[86px] text-left px-4 py-3.5 transition-all duration-500 ${
                  activeCategory === layer.key
                    ? 'bg-[#f8fff9] border-[#8BF784]/40 shadow-[inset_0_0_0_1px_rgba(0,218,94,0.12)]'
                    : 'bg-white hover:bg-slate-50/80'
                }`}
              >
                <div className="flex items-center justify-between gap-3">
                  <div className="min-w-0">
                    <h4 className="font-alternate text-[0.82rem] xl:text-[0.88rem] text-[#291242] font-bold uppercase leading-tight tracking-[0.06em] line-clamp-1">{layer.key}</h4>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="font-alternate text-[1.35rem] xl:text-[1.5rem] text-[#291242] font-bold leading-none">{layer.metric}</p>
                    <p className="mt-1 text-[0.46rem] font-bold uppercase tracking-[0.14em] text-slate-400">Registros</p>
                  </div>
                </div>
              </button>
            ))}
          </div>
        </div>

        <div className="mb-8 flex justify-end px-1">
          <p className="max-w-md text-right text-[0.58rem] font-medium leading-relaxed text-slate-400">
            La lectura puede verse de forma general o filtrarse por capa. Al activar <span className="font-bold text-slate-500">Escuelas de Música</span> o <span className="font-bold text-slate-500">Festivales</span>, el mapa muestra información más específica.
          </p>
        </div>

        <div id="mapa-workspace" ref={mapWorkspaceRef} className="grid grid-cols-1 lg:grid-cols-[minmax(0,1.3fr)_minmax(0,4fr)] gap-3 items-start scroll-mt-28">
          <aside className="space-y-3 sticky top-28">
            <div className="bg-[#291242] rounded-[2.5rem] p-6 text-white relative overflow-hidden">
              <div className="relative space-y-5">
                <div className="flex items-center justify-between gap-4">
                  <div>
                    <p className="text-[0.6rem] uppercase tracking-[0.3em] text-[#8BF784] font-bold">Mapa Ecosistémico</p>
                    <h3 className="font-alternate text-2xl text-white font-bold uppercase leading-none mt-3">Ecosistema Musical</h3>
                  </div>
                  <div className="w-12 h-12 rounded-[1.2rem] bg-white/10 flex items-center justify-center border border-white/10 flex-shrink-0">
                    <Compass size={22} className="text-[#8BF784]" />
                  </div>
                </div>
                <p className="text-[0.78rem] text-slate-300 leading-relaxed">Una lectura territorial del sector musical en Colombia para reconocer coberturas, presencias y vacíos a partir de los mapeos y ejercicios impulsados por el Plan Nacional de Música para la Convivencia.</p>
                <div className="flex flex-col items-start gap-3">
                  <Button type="button" onClick={onOpenParticipation} variant="primary" className="px-5 py-3 text-[0.66rem]" icon={ArrowRight}>Haz parte de este mapeo</Button>
                  <p className="text-[0.58rem] leading-relaxed text-slate-300">Abierto para organizaciones, festivales, mercados, registros individuales, colectivos y espacios que quieran visibilizar su trabajo en el ecosistema musical colombiano.</p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-[2.5rem] p-6 border border-slate-200">
              <div className="flex items-start justify-between gap-4 pb-5 border-b border-slate-100">
                <div>
                  <p className="text-[0.52rem] font-bold uppercase tracking-[0.28em] text-slate-400">Lectura activa</p>
                  <h4 className="font-alternate text-lg uppercase tracking-[0.12em] text-[#291242] font-bold mt-3">Territorio y filtro</h4>
                </div>
                <div className="w-10 h-10 rounded-[1rem] bg-slate-50 border border-slate-100 flex items-center justify-center text-[#291242] flex-shrink-0">
                  <Filter size={16} />
                </div>
              </div>
              <div className="mt-6 space-y-6">
                <div className="-mx-6 overflow-hidden border-y border-slate-100 bg-slate-50/70">
                  <div className="min-h-[248px]">
                    {activeEmbeddedGeneralCard ? (
                      <div
                        className="territorial-hover-card h-full"
                        dangerouslySetInnerHTML={{
                          __html: activePopupMarkupBuilder({
                            deptName: activeEmbeddedGeneralCard.deptName,
                            stats: activeEmbeddedGeneralCard.stats,
                            embedded: true,
                          }),
                        }}
                      />
                    ) : (
                      <div className="h-full min-h-[248px] flex flex-col">
                        <div className="bg-[#291242] px-4 py-4">
                          <div className="flex items-stretch justify-between gap-4 min-h-[76px]">
                            <div className="min-w-0 flex items-end">
                              <div className="text-[0.98rem] font-bold uppercase tracking-[0.1em] leading-tight text-white">
                                Lectura territorial
                              </div>
                            </div>
                            <div className="flex-shrink-0 flex flex-col items-end justify-center text-right">
                              <div className="text-[0.8rem] font-bold leading-none text-white">Vista</div>
                              <div className="mt-1 text-[0.46rem] font-bold uppercase tracking-[0.18em] text-slate-300">{activeLayerConfig.shortLabel}</div>
                            </div>
                          </div>
                        </div>
                        <div className="flex-1 bg-white px-4 py-4 flex items-center">
                          <div>
                            <p className="text-[0.52rem] font-bold uppercase tracking-[0.2em] text-slate-400">Cómo funciona</p>
                            <p className="mt-3 text-[0.75rem] leading-relaxed text-slate-500">
                              {isGeneralLayer
                                ? 'Al situar el puntero sobre un departamento verás una vista previa integrada de sus registros. Si haces clic sobre el territorio, podrás consultar el detalle particular del departamento en el bloque inferior.'
                                : isSchoolsLayer
                                ? 'Al situar el puntero sobre un departamento verás una vista previa de escuelas, estudiantes y docentes del territorio. Si haces clic, podrás consultar el detalle particular del departamento en el bloque inferior.'
                                : isFestivalsLayer
                                ? 'Al situar el puntero sobre un departamento verás una vista previa de sus festivales visibles. Si haces clic, podrás consultar el detalle particular del departamento en el bloque inferior.'
                                : 'Al situar el puntero sobre un departamento verás una vista previa de sus mercados visibles, sus proyectos y su capacidad de conexión. Si haces clic, podrás consultar el detalle particular del departamento en el bloque inferior.'}
                            </p>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
                <div className="rounded-[1.6rem] bg-slate-50 border border-slate-100 px-4 py-4">
                  <span className="text-[0.5rem] font-bold uppercase tracking-[0.18em] text-slate-400">Capa activa</span>
                  <div className="mt-3 flex items-center justify-between gap-3">
                    <span className="font-alternate text-[0.92rem] uppercase text-[#291242] font-bold">{activeLayerConfig.key}</span>
                    <span className={`px-2.5 py-1 rounded-full text-[0.46rem] font-bold uppercase tracking-[0.16em] ${activeLayerConfig.status === 'Activo' ? 'bg-emerald-50 text-[#14532d]' : 'bg-slate-100 text-slate-500'}`}>{activeLayerConfig.status}</span>
                  </div>
                  <p className="mt-3 text-[0.72rem] leading-relaxed text-slate-500">Puedes seleccionar la capa de información desde el bloque superior o desde estos accesos rápidos para concentrar la lectura territorial del mapa.</p>
                  <div className="mt-4 flex flex-wrap gap-2">
                    {[
                      { key: 'General', label: 'General' },
                      { key: 'Festivales', label: 'Festivales' },
                      { key: 'Escuelas de Música', label: 'Escuelas' },
                      { key: 'Mercados Musicales', label: 'Mercados' },
                    ].map((layer) => (
                      <button
                        key={layer.key}
                        type="button"
                        onClick={() => setActiveCategory(layer.key)}
                        className={`px-3 py-2 rounded-full text-[0.5rem] font-bold uppercase tracking-[0.14em] transition-all ${
                          activeCategory === layer.key
                            ? 'bg-[#291242] text-white border border-[#291242]'
                            : 'bg-white text-slate-500 border border-slate-200 hover:border-[#8BF784] hover:text-[#291242]'
                        }`}
                      >
                        {layer.label}
                      </button>
                    ))}
                  </div>
                </div>
                <div className="space-y-3">
                  <label className="text-[0.58rem] font-bold text-slate-400 uppercase tracking-[0.18em] px-1">Territorio</label>
                  <select value={selectedDept} onChange={(e) => setselectedDept(e.target.value)} className="w-full bg-white border border-slate-200 rounded-xl px-4 py-3 text-[0.7rem] font-alternate uppercase outline-none focus:border-[#00DA5E] text-[#291242]">
                    {departmentsList.map(d => <option key={d} value={d}>{d}</option>)}
                  </select>
                </div>
                <div className="pt-6 border-t border-slate-100">
                  <div className="rounded-[1.6rem] border border-dashed border-slate-200 px-4 py-4">
                    <div className="flex items-center justify-between gap-3">
                      <span className="text-[0.54rem] font-bold uppercase tracking-[0.18em] text-slate-400">Próximos filtros</span>
                      <span className="text-[0.46rem] font-bold uppercase tracking-[0.16em] text-[#14532d]">En preparación</span>
                    </div>
                    <div className="mt-3 flex flex-wrap gap-2">
                      {['Periodo', 'Tipología', 'Mercados', 'Procesos comunitarios'].map((item) => (
                        <span key={item} className="px-3 py-2 rounded-full bg-slate-50 border border-slate-100 text-[0.52rem] font-bold uppercase tracking-[0.14em] text-slate-500">
                          {item}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
                <button onClick={fetchMapData} className="w-full flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-[#291242] text-white text-[0.6rem] font-bold uppercase hover:bg-[#6100D7] transition-all"><Database size={14}/> Actualizar lectura</button>
              </div>
            </div>

            <div className="bg-white rounded-[2.5rem] p-6 border border-slate-200">
              <h4 className="font-alternate text-[#291242] text-xs font-bold uppercase tracking-[0.2em] mb-6">Vacíos de Cobertura</h4>
              <div className="flex flex-wrap gap-2">
                {(isGeneralLayer || isFestivalsLayer || isSchoolsLayer || isMarketsLayer) && activeAnalytics.uncoveredDepartments.length > 0 ? activeAnalytics.uncoveredDepartments.map((name) => (
                  <button
                    key={name}
                    type="button"
                    onClick={() => handleDepartmentDrilldown(name, activeCategory)}
                    className="px-3 py-2 rounded-full bg-slate-100 text-[0.52rem] font-bold uppercase tracking-[0.18em] text-slate-500 transition-all hover:bg-slate-200 hover:text-[#291242]"
                  >
                    {getDepartmentDisplayName(name)}
                  </button>
                )) : (
                  <p className="text-[0.8rem] text-slate-500 leading-relaxed">{isGeneralLayer || isFestivalsLayer || isSchoolsLayer || isMarketsLayer ? 'Todos los departamentos cuentan con cobertura.' : 'Esperando estructura de datos.'}</p>
                )}
              </div>
            </div>

            <div className="bg-white rounded-[2.5rem] p-6 border border-slate-200">
              <h4 className="font-alternate text-[#291242] text-xs font-bold uppercase tracking-[0.2em] mb-6">Departamentos con más Cobertura</h4>
              <div className="flex flex-wrap gap-2">
                {(isGeneralLayer || isFestivalsLayer || isSchoolsLayer || isMarketsLayer) && activeAnalytics.topDepartments.length > 0 ? activeAnalytics.topDepartments.slice(0, 8).map((item) => (
                  <button
                    key={item.name}
                    type="button"
                    onClick={() => handleDepartmentDrilldown(item.name, activeCategory)}
                    className="px-3 py-2 rounded-full bg-slate-100 text-[0.52rem] font-bold uppercase tracking-[0.18em] text-slate-500 transition-all hover:bg-slate-200 hover:text-[#291242]"
                  >
                    {getDepartmentDisplayName(item.name)} · {formatMetricValue(item.count)}
                  </button>
                )) : (
                  <p className="text-[0.8rem] text-slate-500 leading-relaxed">Aún no hay lectura suficiente para destacar coberturas.</p>
                )}
              </div>
            </div>
          </aside>

          <div className="space-y-3">
            <div className={`bg-white rounded-[3rem] p-10 border border-slate-200 ${activeView === 'map' ? 'min-h-[1320px]' : activeView === 'grid' ? 'min-h-[1080px]' : 'min-h-[980px]'}`}>
              <div className="flex flex-col md:flex-row md:items-center justify-between items-start gap-6 mb-10">
                <div>
                  <h3 className="font-alternate text-2xl font-bold uppercase text-[#291242] leading-none">Ecosistema Musical en Colombia</h3>
                  <p className="text-[0.78rem] text-slate-500 mt-3 font-medium leading-relaxed max-w-2xl">Explora una lectura territorial de la presencia musical en el país, identificando coberturas, concentraciones y zonas que requieren mayor fortalecimiento dentro del ecosistema cultural.</p>
                </div>
                <div className="flex bg-slate-100 p-1.5 rounded-2xl">
                  {[
                    { key: 'map', label: 'Mapa interactivo', icon: MapWide },
                    { key: 'grid', label: 'Dashboard', icon: BarChart3 },
                    { key: 'data', label: 'Consulta técnica', icon: Database },
                  ].map((view) => {
                    const Icon = view.icon;

                    return (
                      <button
                        key={view.key}
                        type="button"
                        onClick={() => setActiveView(view.key)}
                        className={`w-11 h-11 rounded-xl flex items-center justify-center transition-all ${activeView === view.key ? 'bg-white text-[#291242] shadow-sm' : 'text-slate-500 hover:text-[#291242]'}`}
                        title={view.label}
                        aria-label={view.label}
                      >
                        <Icon size={16} />
                      </button>
                    );
                  })}
                </div>
              </div>

              {activeView === 'map' ? (
                <div className="space-y-8">
                  <div>
                    <div className="w-full min-h-[1080px] mx-auto bg-[#eef2f6] rounded-[2.8rem] relative overflow-hidden">
                      {isLoading ? (
                        <div className="absolute inset-0 flex flex-col items-center justify-center text-[#291242] gap-4">
                          <Loader2 className="animate-spin" size={32} />
                          <span className="text-[0.6rem] uppercase tracking-widest font-bold">Preparando cartografía de Colombia...</span>
                        </div>
                      ) : geoData && colombiaBounds ? (
                        <MapContainer
                        bounds={colombiaBounds.pad(-0.065)}
                        boundsOptions={{ paddingTopLeft: [28, 20], paddingBottomRight: [0, 0] }}
                        maxBounds={colombiaBounds.pad(0.03)}
                        maxBoundsViscosity={1}
                        style={{ height: '1080px', width: '100%', background: 'transparent', zIndex: 1 }}
                        scrollWheelZoom={false}
                        dragging={true}
                        doubleClickZoom={false}
                          boxZoom={false}
                          keyboard={false}
                        touchZoom={true}
                          zoomSnap={0.1}
                          zoomControl={false}
                          attributionControl={false}
                        >
                          <TileLayer
                            url="https://{s}.basemaps.cartocdn.com/light_nolabels/{z}/{x}/{y}{r}.png"
                            subdomains="abcd"
                            opacity={0.45}
                          />
                          {WORLD_COUNTRY_LABELS.filter((country) => country.name !== 'Colombia').map((country) => (
                            <Marker
                              key={country.name}
                              position={country.position}
                              icon={countryLabelIcon(country.name)}
                              interactive={false}
                            />
                          ))}
                          <MapZoomLimiter initialBounds={colombiaBounds.pad(-0.065)} />
                          <MapViewportResetter initialBounds={colombiaBounds.pad(-0.065)} resetToken={mapResetToken} />
                          <MapTrackpadGestureHandler />
                          <MapZoomControls initialBounds={colombiaBounds.pad(-0.065)} />
                          {geoData && (
                            <GeoJSON 
                              key={`${activeCategory}-${selectedDept}-${activeAnalytics.totalRecords}-${activeAnalytics.activeDepartments}`}
                              ref={geoJsonRef}
                              renderer={mapSvgRenderer}
                              interactive={false}
                              data={geoData} 
                              style={getStyle}
                              onEachFeature={(feature, layer) => {
                              const deptName = getFeatureDepartmentName(feature);
                              const normalized = getFeatureDepartmentNormalizedName(feature);

                              if (normalized !== ARCHIPELAGO_NORMALIZED_NAME) {
                                layer.bindTooltip(deptName, {
                                  permanent: true,
                                  direction: 'center',
                                  className: 'department-label',
                                  opacity: 1,
                                });
                              }
                            }}
                          />
                          )}
                          {geoData && (
                            <GeoJSON
                              key={`department-hit-${activeCategory}-${selectedDept}-${activeAnalytics.totalRecords}-${activeAnalytics.activeDepartments}`}
                              renderer={mapSvgRenderer}
                              data={geoData}
                              filter={(feature) => getFeatureDepartmentNormalizedName(feature) !== ARCHIPELAGO_NORMALIZED_NAME}
                              style={() => DEPARTMENT_HIT_AREA_STYLE}
                              onEachFeature={(feature, layer) => {
                                const deptName = getFeatureDepartmentName(feature);
                                const normalized = getFeatureDepartmentNormalizedName(feature);
                                const departmentStats = departmentSummaryByDepartment[normalized] || EMPTY_DEPARTMENT_SUMMARY;
                                const handleDepartmentSelection = () => {
                                  handleDepartmentDrilldown(deptName, activeCategory);
                                };

                                layer.on({
                                  mouseover: () => {
                                    setHoveredDepartmentCard({ deptName, stats: departmentStats });
                                  },
                                  mouseout: () => {
                                    setHoveredDepartmentCard(null);
                                  },
                                  click: handleDepartmentSelection,
                                });
                              }}
                            />
                          )}
                          {enlargedArchipelagoFeature && (
                            <GeoJSON
                              key={`archipelago-${activeCategory}-${archipelagoCount}-${archipelagoIsSelected ? 'selected' : 'base'}`}
                              renderer={mapSvgRenderer}
                              data={enlargedArchipelagoFeature}
                              style={() => archipelagoVisualStyle}
                              onEachFeature={(_, layer) => {
                                const handleArchipelagoSelection = () => {
                                  handleDepartmentDrilldown('San Andrés y Providencia', activeCategory);
                                };

                                layer.bindTooltip('<span class="archipelago-label-line">Archipiélago de San Andrés,</span><span class="archipelago-label-line">Providencia y Santa Catalina</span>', {
                                  permanent: true,
                                  direction: 'right',
                                  className: 'archipelago-label',
                                  opacity: 1,
                                  offset: [18, 0],
                                });

                                layer.on({
                                  mouseover: () => {
                                    setHoveredDepartmentCard({
                                      deptName: 'Archipiélago de San Andrés, Providencia y Santa Catalina',
                                      stats: archipelagoSummary,
                                    });
                                  },
                                  mouseout: () => {
                                    setHoveredDepartmentCard(null);
                                  },
                                  click: handleArchipelagoSelection,
                                });
                              }}
                            />
                          )}
                        </MapContainer>
                      ) : (
                        <div className="absolute inset-0 flex items-center justify-center">
                          <div className="px-8 text-center">
                            <p className="text-sm font-bold uppercase tracking-[0.18em] text-slate-500">No fue posible cargar la cartografía de Colombia.</p>
                            {mapError && <p className="mt-3 text-[0.78rem] text-slate-400">{mapError}</p>}
                          </div>
                        </div>
                      )}

                      {isGeneralLayer ? (
                        <div className="absolute top-6 right-6 flex flex-col gap-3 z-20">
                          {generalMapSummaryCards.map((item) => {
                            const Icon = item.icon;

                            return (
                              <div key={item.key} className="min-w-[180px] bg-white/96 backdrop-blur-sm px-4 py-3.5 rounded-[1.6rem] border border-slate-200 shadow-lg">
                                <div className="flex items-start justify-between gap-4">
                                  <div className="min-w-0">
                                    <span className="text-[0.62rem] font-bold text-[#291242] uppercase font-alternate">{item.label}</span>
                                    <div className="mt-2 font-alternate text-[1.45rem] leading-none font-bold text-[#291242]">
                                      {formatMetricValue(item.value)}
                                    </div>
                                    <span className="mt-1 block text-[0.52rem] text-slate-500 font-bold uppercase tracking-[0.12em]">Registros</span>
                                  </div>
                                  <div className="w-10 h-10 rounded-[1rem] bg-slate-50 border border-slate-100 flex items-center justify-center text-[#291242] flex-shrink-0">
                                    <Icon size={16} />
                                  </div>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      ) : (
                        <div className="absolute top-6 right-6 flex items-center gap-4 bg-white/96 backdrop-blur-sm px-5 py-4 rounded-[1.8rem] border border-slate-200 shadow-lg z-20">
                          <div className="flex flex-col">
                            <span className="text-[0.65rem] font-bold text-[#291242] uppercase font-alternate">{activeLayerConfig.shortLabel}</span>
                            <span className="text-[0.52rem] text-slate-500 font-bold uppercase">{activeMapCountLabel}</span>
                          </div>
                        </div>
                      )}

                      <div className="absolute bottom-6 left-6 z-20 max-w-[210px] bg-white/96 backdrop-blur-sm rounded-[1.6rem] border border-slate-200 shadow-lg px-4 py-3.5">
                        <h4 className="font-alternate text-[#291242] text-[0.72rem] font-bold uppercase tracking-[0.18em] mb-4 flex items-center justify-between gap-4">
                          Niveles de Cobertura
                          <PieChart size={16} className="text-slate-300 flex-shrink-0" />
                        </h4>
                        <div className="space-y-2">
                          {activeLegendItems.slice().reverse().map((item) => (
                            <div key={item.label} className="flex items-center gap-2.5">
                              <div className="w-3 h-3 rounded" style={{ backgroundColor: item.color }}></div>
                              <span className="text-[0.55rem] font-bold text-slate-500 uppercase leading-none">{item.label}</span>
                            </div>
                          ))}
                          <div className="flex items-center gap-2.5">
                            <div className="w-3 h-3 rounded bg-[#1f1633]"></div>
                            <span className="text-[0.55rem] font-bold text-slate-500 uppercase leading-none">Sin cobertura</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="flex flex-wrap items-center justify-between gap-6 pt-6 border-t border-slate-100">
                     <div className="flex items-center gap-3"><Info size={16} className="text-[#00DA5E]"/><p className="text-[0.7rem] text-slate-500 font-medium leading-relaxed">{activeInfoNote}</p></div>
                     <button onClick={fetchMapData} className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#291242] text-white text-[0.6rem] font-bold uppercase hover:bg-[#6100D7] transition-all"><Database size={14}/> Actualizar</button>
                  </div>
                </div>
              ) : activeView === 'grid' ? (
                <div className="space-y-8">
                  <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
                    <div className="xl:col-span-2 bg-slate-50 rounded-[2.5rem] p-8 border border-slate-200">
                      <div className="flex items-center justify-between gap-4 mb-8">
                        <div>
                          <p className="text-[0.52rem] font-bold uppercase tracking-[0.3em] text-slate-400">Ranking territorial</p>
                          <h4 className="font-alternate text-xl font-bold uppercase text-[#291242] mt-3">
                            {isGeneralLayer
                              ? 'Departamentos con mayor lectura integrada'
                              : isSchoolsLayer
                              ? 'Departamentos con mayor red de escuelas'
                              : isMarketsLayer
                              ? 'Departamentos con mayor actividad de mercados'
                              : 'Departamentos con mayor actividad festivalera'}
                          </h4>
                        </div>
                        <div className="w-11 h-11 rounded-2xl bg-white border border-slate-200 flex items-center justify-center text-[#291242]">
                          <BarChart3 size={18} />
                        </div>
                      </div>
                      <div className="space-y-4">
                        {activeAnalytics.topDepartments.length > 0 ? activeAnalytics.topDepartments.map((item, i) => (
                          <button
                            key={item.name}
                            type="button"
                            onClick={() => handleDepartmentDrilldown(item.name, activeCategory)}
                            className="w-full text-left bg-white rounded-[1.8rem] p-5 border border-slate-100 transition-all hover:-translate-y-0.5 hover:border-slate-200"
                          >
                            <div className="flex items-center justify-between gap-4 mb-4">
                              <div className="flex items-center gap-4">
                                <span className="w-10 h-10 rounded-2xl bg-[#8BF784]/20 text-[#291242] border border-[#8BF784]/40 flex items-center justify-center text-sm font-bold">{i + 1}</span>
                                <div>
                                  <p className="font-alternate text-base font-bold uppercase text-[#291242]">{getDepartmentDisplayName(item.name)}</p>
                                  <p className="text-[0.6rem] text-slate-400 font-bold uppercase tracking-[0.18em]">{Math.round((item.count / Math.max(activeAnalytics.totalRecords || 1, 1)) * 100)}% del total</p>
                                </div>
                              </div>
                              <div className="text-right">
                                <p className="font-alternate text-2xl font-bold text-[#291242] leading-none">{formatMetricValue(item.count)}</p>
                                <p className="text-[0.5rem] uppercase tracking-[0.18em] font-bold text-slate-400">{activeRankingLabel}</p>
                              </div>
                            </div>
                            <div className="h-2.5 rounded-full bg-slate-100 overflow-hidden">
                              <div className="h-full rounded-full bg-[#00DA5E]" style={{ width: `${Math.max((item.count / Math.max(activeAnalytics.topDepartments[0]?.count || 1, 1)) * 100, 8)}%` }} />
                            </div>
                          </button>
                        )) : (
                          <div className="bg-white rounded-[1.8rem] p-6 border border-slate-100">
                            <p className="text-[0.78rem] text-slate-500 leading-relaxed">Esta capa aún no cuenta con suficiente información visible para construir el ranking territorial.</p>
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="space-y-6">
                      <div className="bg-[#291242] rounded-[2.5rem] p-7 text-white">
                        <p className="text-[0.5rem] font-bold uppercase tracking-[0.28em] text-[#8BF784]">Lectura rápida</p>
                        <h4 className="font-alternate text-xl font-bold uppercase mt-4">
                          {isGeneralLayer
                            ? 'Estado integrado del ecosistema'
                            : isSchoolsLayer
                            ? 'Estado de la red de escuelas'
                            : isMarketsLayer
                            ? 'Estado de la red de mercados'
                            : 'Estado del ecosistema festivalero'}
                        </h4>
                        <div className="space-y-5 mt-6">
                          <div>
                            <div className="flex items-center justify-between text-[0.55rem] uppercase tracking-[0.18em] font-bold text-slate-300 mb-2">
                              <span>Cobertura</span>
                              <span>{isGeneralLayer || isFestivalsLayer || isSchoolsLayer || isMarketsLayer ? `${activeAnalytics.coverage}%` : 'Próx.'}</span>
                            </div>
                            <div className="h-2.5 rounded-full bg-white/10 overflow-hidden">
                              <div className="h-full rounded-full bg-[#8BF784]" style={{ width: `${isGeneralLayer || isFestivalsLayer || isSchoolsLayer || isMarketsLayer ? activeAnalytics.coverage : 18}%` }} />
                            </div>
                          </div>
                          {isGeneralLayer && (
                            <div className="grid grid-cols-2 gap-3">
                              <div className="rounded-[1.3rem] border border-white/10 bg-white/5 px-4 py-3">
                                <p className="text-[0.5rem] font-bold uppercase tracking-[0.18em] text-slate-300">Festivales</p>
                                <p className="font-alternate text-2xl font-bold mt-2">{formatMetricValue(festivalAnalytics.totalRecords)}</p>
                              </div>
                              <div className="rounded-[1.3rem] border border-white/10 bg-white/5 px-4 py-3">
                                <p className="text-[0.5rem] font-bold uppercase tracking-[0.18em] text-slate-300">Escuelas</p>
                                <p className="font-alternate text-2xl font-bold mt-2">{formatMetricValue(schoolAnalytics.totalRecords)}</p>
                              </div>
                              <div className="rounded-[1.3rem] border border-white/10 bg-white/5 px-4 py-3">
                                <p className="text-[0.5rem] font-bold uppercase tracking-[0.18em] text-slate-300">Estudiantes</p>
                                <p className="font-alternate text-2xl font-bold mt-2">{formatMetricValue(schoolCapacityTotals.totalStudents)}</p>
                              </div>
                              <div className="rounded-[1.3rem] border border-white/10 bg-white/5 px-4 py-3">
                                <p className="text-[0.5rem] font-bold uppercase tracking-[0.18em] text-slate-300">Mercados</p>
                                <p className="font-alternate text-2xl font-bold mt-2">{formatMetricValue(marketAnalytics.totalRecords)}</p>
                              </div>
                            </div>
                          )}
                          {isSchoolsLayer && (
                            <div className="grid grid-cols-2 gap-3">
                              <div className="rounded-[1.3rem] border border-white/10 bg-white/5 px-4 py-3">
                                <p className="text-[0.5rem] font-bold uppercase tracking-[0.18em] text-slate-300">Activas</p>
                                <p className="font-alternate text-2xl font-bold mt-2">{formatMetricValue(schoolCapacityTotals.active)}</p>
                              </div>
                              <div className="rounded-[1.3rem] border border-white/10 bg-white/5 px-4 py-3">
                                <p className="text-[0.5rem] font-bold uppercase tracking-[0.18em] text-slate-300">Con internet</p>
                                <p className="font-alternate text-2xl font-bold mt-2">{formatMetricValue(schoolCapacityTotals.withInternet)}</p>
                              </div>
                              <div className="rounded-[1.3rem] border border-white/10 bg-white/5 px-4 py-3">
                                <p className="text-[0.5rem] font-bold uppercase tracking-[0.18em] text-slate-300">En pausa</p>
                                <p className="font-alternate text-2xl font-bold mt-2">{formatMetricValue(schoolCapacityTotals.paused)}</p>
                              </div>
                              <div className="rounded-[1.3rem] border border-white/10 bg-white/5 px-4 py-3">
                                <p className="text-[0.5rem] font-bold uppercase tracking-[0.18em] text-slate-300">Base comunitaria</p>
                                <p className="font-alternate text-2xl font-bold mt-2">{formatMetricValue(schoolCapacityTotals.withCommunityOrganization)}</p>
                              </div>
                            </div>
                          )}
                          {isMarketsLayer && (
                            <div className="grid grid-cols-2 gap-3">
                              <div className="rounded-[1.3rem] border border-white/10 bg-white/5 px-4 py-3">
                                <p className="text-[0.5rem] font-bold uppercase tracking-[0.18em] text-slate-300">Mercados</p>
                                <p className="font-alternate text-2xl font-bold mt-2">{formatMetricValue(marketAnalytics.totalRecords)}</p>
                              </div>
                              <div className="rounded-[1.3rem] border border-white/10 bg-white/5 px-4 py-3">
                                <p className="text-[0.5rem] font-bold uppercase tracking-[0.18em] text-slate-300">Proyectos</p>
                                <p className="font-alternate text-2xl font-bold mt-2">{formatMetricValue(marketCapacityTotals.totalProjects)}</p>
                              </div>
                              <div className="rounded-[1.3rem] border border-white/10 bg-white/5 px-4 py-3">
                                <p className="text-[0.5rem] font-bold uppercase tracking-[0.18em] text-slate-300">Bookers</p>
                                <p className="font-alternate text-2xl font-bold mt-2">{formatMetricValue(marketCapacityTotals.totalBuyers)}</p>
                              </div>
                              <div className="rounded-[1.3rem] border border-white/10 bg-white/5 px-4 py-3">
                                <p className="text-[0.5rem] font-bold uppercase tracking-[0.18em] text-slate-300">Convocatoria</p>
                                <p className="font-alternate text-2xl font-bold mt-2">{formatMetricValue(marketCapacityTotals.openCalls)}</p>
                              </div>
                            </div>
                          )}
                        </div>
                      </div>

                      <div className="bg-white rounded-[2.5rem] p-7 border border-slate-200">
                        {isGeneralLayer ? (
                          <>
                            <p className="text-[0.5rem] font-bold uppercase tracking-[0.28em] text-slate-400">Detalle agregado</p>
                            <div className="mt-5 grid grid-cols-2 gap-3">
                              {[
                                { label: 'Festivales', value: festivalAnalytics.totalRecords },
                                { label: 'Escuelas', value: schoolAnalytics.totalRecords },
                                { label: 'Instrumentos', value: schoolCapacityTotals.totalInstruments },
                                { label: 'Mercados', value: marketAnalytics.totalRecords },
                              ].map((item) => (
                                <div key={item.label} className="rounded-2xl bg-slate-50 border border-slate-100 px-4 py-4">
                                  <p className="text-[0.52rem] font-bold uppercase tracking-[0.18em] text-slate-400">{item.label}</p>
                                  <p className="font-alternate text-2xl font-bold text-[#291242] mt-3 leading-none">{formatMetricValue(item.value)}</p>
                                </div>
                              ))}
                            </div>
                          </>
                        ) : isSchoolsLayer ? (
                          <>
                            <p className="text-[0.5rem] font-bold uppercase tracking-[0.28em] text-slate-400">Capacidad reportada</p>
                            <div className="mt-5 grid grid-cols-2 gap-3">
                              {[
                                { label: 'Estudiantes', value: schoolCapacityTotals.totalStudents },
                                { label: 'Docentes', value: schoolCapacityTotals.totalTeachers },
                                { label: 'Instrumentos', value: schoolCapacityTotals.totalInstruments },
                                { label: 'Agrupaciones', value: schoolCapacityTotals.totalGroups },
                              ].map((item) => (
                                <div key={item.label} className="rounded-2xl bg-slate-50 border border-slate-100 px-4 py-4">
                                  <p className="text-[0.52rem] font-bold uppercase tracking-[0.18em] text-slate-400">{item.label}</p>
                                  <p className="font-alternate text-2xl font-bold text-[#291242] mt-3 leading-none">{formatMetricValue(item.value)}</p>
                                </div>
                              ))}
                            </div>
                          </>
                        ) : isMarketsLayer ? (
                          <>
                            <p className="text-[0.5rem] font-bold uppercase tracking-[0.28em] text-slate-400">Capacidad reportada</p>
                            <div className="mt-5 grid grid-cols-2 gap-3">
                              {[
                                { label: 'Promedio proyectos', value: marketCapacityTotals.averageProjectsPerMarket },
                                { label: 'Promedio compradores', value: marketCapacityTotals.averageBuyersPerMarket },
                                { label: 'Con festival', value: marketCapacityTotals.linkedToFestival },
                                { label: 'Con convocatoria', value: marketCapacityTotals.openCalls },
                              ].map((item) => (
                                <div key={item.label} className="rounded-2xl bg-slate-50 border border-slate-100 px-4 py-4">
                                  <p className="text-[0.52rem] font-bold uppercase tracking-[0.18em] text-slate-400">{item.label}</p>
                                  <p className="font-alternate text-2xl font-bold text-[#291242] mt-3 leading-none">{formatMetricValue(item.value)}</p>
                                </div>
                              ))}
                            </div>
                          </>
                        ) : (
                          <>
                            <p className="text-[0.5rem] font-bold uppercase tracking-[0.28em] text-slate-400">Próximas capas</p>
                            <div className="mt-5 space-y-3">
                              {['Escuelas de música', 'Mercados musicales'].map((item) => (
                                <div key={item} className="flex items-center gap-3 px-4 py-2.5 rounded-2xl bg-slate-50 border border-slate-100">
                                  <div className="w-2.5 h-2.5 rounded-full bg-[#00DA5E]" />
                                  <span className="text-[0.65rem] font-bold uppercase tracking-[0.14em] text-[#291242]">{item}</span>
                                </div>
                              ))}
                            </div>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="space-y-8">
                  <div id="mapa-consulta" className="grid grid-cols-1 xl:grid-cols-[minmax(0,1.7fr)_minmax(340px,0.9fr)] gap-6 scroll-mt-28">
                    <div className="bg-slate-50 rounded-[2.5rem] p-8 border border-slate-200">
                      <div className="flex flex-col md:flex-row md:items-start justify-between gap-6">
                        <div>
                          <p className="text-[0.52rem] font-bold uppercase tracking-[0.3em] text-slate-400">Consulta especializada</p>
                          <h4 className="font-alternate text-xl font-bold uppercase text-[#291242] mt-3">{technicalViewTitle}</h4>
                          <p className="mt-4 text-[0.78rem] text-slate-500 leading-relaxed max-w-2xl">{technicalViewDescription}</p>
                        </div>
                        <div className="w-12 h-12 rounded-[1.1rem] bg-white border border-slate-200 flex items-center justify-center text-[#291242] flex-shrink-0">
                          <Database size={18} />
                        </div>
                      </div>
	                      <div className="mt-8 overflow-hidden rounded-[1.6rem] border border-slate-200 bg-white">
	                        <div className="overflow-x-auto">
	                          <table className="min-w-full text-left">
	                            <thead className="bg-slate-50">
	                              <tr className="border-b border-slate-200">
	                                <th className="px-4 py-3 text-[0.5rem] font-bold uppercase tracking-[0.18em] text-slate-400">Indicador</th>
	                                <th className="px-4 py-3 text-[0.5rem] font-bold uppercase tracking-[0.18em] text-slate-400">Lectura</th>
	                                <th className="px-4 py-3 text-[0.5rem] font-bold uppercase tracking-[0.18em] text-slate-400">Detalle</th>
	                              </tr>
	                            </thead>
	                            <tbody>
	                              {technicalSummaryCards.map((item) => (
	                                <tr key={item.label} className="border-b border-slate-100">
	                                  <td className="px-4 py-3 text-[0.56rem] font-bold uppercase tracking-[0.16em] text-slate-400 whitespace-nowrap">{item.label}</td>
	                                  <td className="px-4 py-3 font-alternate text-[1.05rem] font-bold uppercase text-[#291242] whitespace-nowrap">{formatMetricValue(item.value)}</td>
	                                  <td className="px-4 py-3 text-[0.68rem] text-slate-500 leading-relaxed">Métrica principal de la capa activa.</td>
	                                </tr>
	                              ))}
	                              <tr>
	                                <td colSpan={3} className="bg-slate-50 px-4 py-2 text-[0.48rem] font-bold uppercase tracking-[0.2em] text-slate-400">Contexto de consulta</td>
	                              </tr>
	                              {technicalConsultationSections.map((item) => (
	                                <tr key={item.label} className="border-t border-slate-100">
	                                  <td className="px-4 py-3 text-[0.56rem] font-bold uppercase tracking-[0.16em] text-slate-400 whitespace-nowrap">{item.label}</td>
	                                  <td className="px-4 py-3 font-alternate text-[1.05rem] font-bold uppercase text-[#291242] whitespace-nowrap">{item.value}</td>
	                                  <td className="px-4 py-3 text-[0.68rem] text-slate-500 leading-relaxed">{item.note}</td>
	                                </tr>
	                              ))}
	                            </tbody>
	                          </table>
	                        </div>
	                      </div>
	                    </div>

                    <div className="bg-white rounded-[2.5rem] p-7 border border-slate-200">
                      <p className="text-[0.5rem] font-bold uppercase tracking-[0.28em] text-slate-400">Señales automáticas</p>
                      <div className="mt-5 space-y-4">
                        <div className="grid grid-cols-2 gap-3">
                          {technicalSignalCards.map((item) => (
                            <div key={item.label} className="rounded-2xl bg-slate-50 border border-slate-100 px-4 py-4">
                              <p className="text-[0.5rem] font-bold uppercase tracking-[0.18em] text-slate-400">{item.label}</p>
                              <p className="font-alternate text-[1.1rem] font-bold uppercase text-[#291242] mt-3 leading-tight">{item.value}</p>
                              <p className="mt-2 text-[0.64rem] text-slate-500 leading-relaxed">{item.note}</p>
                            </div>
                          ))}
                        </div>
                        <div className="rounded-2xl bg-slate-50 border border-slate-100 px-4 py-4">
                          <div className="grid grid-cols-2 gap-3">
                            <div>
                              <p className="text-[0.52rem] font-bold uppercase tracking-[0.18em] text-slate-400">Territorio</p>
                              <p className="font-alternate text-lg font-bold uppercase text-[#291242] mt-3">{selectedDepartmentDisplayName}</p>
                            </div>
                            <div>
                              <p className="text-[0.52rem] font-bold uppercase tracking-[0.18em] text-slate-400">Capa</p>
                              <p className="font-alternate text-lg font-bold uppercase text-[#291242] mt-3">{activeLayerConfig.key}</p>
                            </div>
                          </div>
                        </div>
                        <div className="rounded-2xl bg-slate-50 border border-slate-100 px-4 py-4">
                          <p className="text-[0.52rem] font-bold uppercase tracking-[0.18em] text-slate-400">Cómo usarla</p>
                          <p className="mt-3 text-[0.74rem] text-slate-500 leading-relaxed">
                            Esta vista organiza la información en tablas técnicas. Puedes buscar, ordenar y filtrar registros; además, al hacer clic sobre un territorio, abrir directamente su detalle territorial en el bloque inferior.
                          </p>
                        </div>
                        <div className="rounded-2xl bg-slate-50 border border-slate-100 px-4 py-4">
                          <p className="text-[0.52rem] font-bold uppercase tracking-[0.18em] text-slate-400">Campos visibles</p>
                          <p className="mt-3 text-[0.74rem] text-slate-500 leading-relaxed">{activeInfoNote}</p>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="bg-white rounded-[2.5rem] p-7 border border-slate-200">
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
                      <div>
                        <p className="text-[0.5rem] font-bold uppercase tracking-[0.28em] text-slate-400">Matriz territorial</p>
                        <h4 className="font-alternate text-xl font-bold uppercase text-[#291242] mt-3">Lectura por departamento</h4>
                      </div>
                      <span className="px-3 py-2 rounded-full bg-slate-50 border border-slate-200 text-[0.52rem] font-bold uppercase tracking-[0.16em] text-slate-500">
                        {selectedDept === 'Nacional' ? `${formatMetricValue(filteredTechnicalDepartmentRows.length)} filas` : 'Territorio filtrado'}
                      </span>
                    </div>
                    <div className="grid grid-cols-1 xl:grid-cols-[minmax(0,1.4fr)_minmax(0,0.9fr)_auto] gap-3 mb-6">
                      <label className="relative block">
                        <Search size={14} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" />
                        <input
                          type="text"
                          value={technicalDepartmentQuery}
                          onChange={(e) => setTechnicalDepartmentQuery(e.target.value)}
                          placeholder="Buscar departamento"
                          className="w-full rounded-2xl border border-slate-200 bg-slate-50 pl-11 pr-4 py-3 text-[0.72rem] text-[#291242] outline-none focus:border-[#8BF784]"
                        />
                      </label>
                      <div className="relative">
                        <SortAsc size={14} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" />
                        <select
                          value={technicalMatrixSortKey}
                          onChange={(e) => setTechnicalMatrixSortKey(e.target.value)}
                          className="w-full rounded-2xl border border-slate-200 bg-slate-50 pl-11 pr-10 py-3 text-[0.72rem] text-[#291242] outline-none focus:border-[#8BF784]"
                        >
                          {technicalMatrixSortOptions.map((option) => (
                            <option key={option.key} value={option.key}>{option.label}</option>
                          ))}
                        </select>
                      </div>
                      <button
                        type="button"
                        onClick={() => setTechnicalMatrixSortDirection((current) => current === 'desc' ? 'asc' : 'desc')}
                        className="inline-flex items-center justify-center gap-2 px-4 py-3 rounded-2xl border border-slate-200 bg-slate-50 text-[#291242] text-[0.58rem] font-bold uppercase tracking-[0.16em] hover:border-[#8BF784] transition-all"
                      >
                        <ArrowUp size={14} className={technicalMatrixSortDirection === 'asc' ? 'rotate-180 transition-transform' : 'transition-transform'} />
                        {technicalMatrixSortDirection === 'desc' ? 'Desc' : 'Asc'}
                      </button>
                    </div>
                    <div className="overflow-x-auto">
                      <table className="min-w-full text-left">
                        <thead>
                          <tr className="border-b border-slate-200">
                            {technicalDepartmentColumns.map((column) => (
                              <th key={column.key} className="px-4 py-3 text-[0.5rem] font-bold uppercase tracking-[0.18em] text-slate-400 whitespace-nowrap">
                                {column.label}
                              </th>
                            ))}
                          </tr>
                        </thead>
                        <tbody>
                          {filteredTechnicalDepartmentRows.map((row) => (
                            <tr key={row.departmentKey} className="border-b border-slate-100 last:border-b-0">
                              {technicalDepartmentColumns.map((column, index) => (
                                <td key={column.key} className={`px-4 py-3.5 text-[0.74rem] text-slate-500 whitespace-nowrap ${index === 0 ? 'font-bold text-[#291242]' : ''}`}>
                                  {index === 0 ? (
                                    <button
                                      type="button"
                                      onClick={() => handleDepartmentDrilldown(row.departmentKey, activeCategory)}
                                      className="font-alternate text-[0.84rem] font-bold uppercase tracking-[0.06em] text-[#291242] hover:text-[#00DA5E] transition-colors"
                                    >
                                      {row.departmentLabel}
                                    </button>
                                  ) : (
                                    formatDataCellValue(row[column.key])
                                  )}
                                </td>
                              ))}
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                    {filteredTechnicalDepartmentRows.length === 0 && (
                      <div className="mt-4 rounded-[1.8rem] border border-dashed border-slate-200 bg-slate-50 px-5 py-6">
                        <p className="text-[0.78rem] text-slate-500 leading-relaxed">No hay departamentos que coincidan con la búsqueda actual.</p>
                      </div>
                    )}
                  </div>

                  {!isGeneralLayer && (
                    <div className="bg-white rounded-[2.5rem] p-7 border border-slate-200">
                      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
                        <div>
                          <p className="text-[0.5rem] font-bold uppercase tracking-[0.28em] text-slate-400">Registros visibles</p>
                          <h4 className="font-alternate text-xl font-bold uppercase text-[#291242] mt-3">{technicalRecordsTitle}</h4>
                        </div>
                        <span className="px-3 py-2 rounded-full bg-slate-50 border border-slate-200 text-[0.52rem] font-bold uppercase tracking-[0.16em] text-slate-500">
                          {formatMetricValue(filteredTechnicalRecordRows.length)} / {formatMetricValue(technicalRecordRows.length)} registros
                        </span>
                      </div>
                      <div className="space-y-4 mb-6">
                        <div className="grid grid-cols-1 xl:grid-cols-[minmax(0,1.4fr)_minmax(0,0.9fr)_auto] gap-3">
                          <label className="relative block">
                            <Search size={14} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" />
                            <input
                              type="text"
                              value={technicalRecordQuery}
                              onChange={(e) => setTechnicalRecordQuery(e.target.value)}
                              placeholder="Buscar por nombre, territorio o dato visible"
                              className="w-full rounded-2xl border border-slate-200 bg-slate-50 pl-11 pr-4 py-3 text-[0.72rem] text-[#291242] outline-none focus:border-[#8BF784]"
                            />
                          </label>
                          <div className="relative">
                            <SortAsc size={14} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" />
                            <select
                              value={technicalRecordSortKey}
                              onChange={(e) => setTechnicalRecordSortKey(e.target.value)}
                              className="w-full rounded-2xl border border-slate-200 bg-slate-50 pl-11 pr-10 py-3 text-[0.72rem] text-[#291242] outline-none focus:border-[#8BF784]"
                            >
                              {technicalRecordSortOptions.map((option) => (
                                <option key={option.key} value={option.key}>{option.label}</option>
                              ))}
                            </select>
                          </div>
                          <button
                            type="button"
                            onClick={() => setTechnicalRecordSortDirection((current) => current === 'desc' ? 'asc' : 'desc')}
                            className="inline-flex items-center justify-center gap-2 px-4 py-3 rounded-2xl border border-slate-200 bg-slate-50 text-[#291242] text-[0.58rem] font-bold uppercase tracking-[0.16em] hover:border-[#8BF784] transition-all"
                          >
                            <ArrowUp size={14} className={technicalRecordSortDirection === 'asc' ? 'rotate-180 transition-transform' : 'transition-transform'} />
                            {technicalRecordSortDirection === 'desc' ? 'Desc' : 'Asc'}
                          </button>
                        </div>
                        <div className="flex flex-wrap gap-2">
                          {technicalRecordFocusOptions.map((option) => (
                            <button
                              key={option.key}
                              type="button"
                              onClick={() => setTechnicalRecordFocus(option.key)}
                              className={`px-3 py-2 rounded-full text-[0.5rem] font-bold uppercase tracking-[0.14em] transition-all ${
                                technicalRecordFocus === option.key
                                  ? 'bg-[#291242] text-white border border-[#291242]'
                                  : 'bg-slate-50 text-slate-500 border border-slate-200 hover:border-[#8BF784] hover:text-[#291242]'
                              }`}
                            >
                              {option.label}
                            </button>
                          ))}
                        </div>
                      </div>
                      <div className="overflow-x-auto">
                        <table className="min-w-full text-left">
                          <thead>
                            <tr className="border-b border-slate-200">
                              {technicalRecordColumns.map((column) => (
                                <th key={column.key} className="px-4 py-3 text-[0.5rem] font-bold uppercase tracking-[0.18em] text-slate-400 whitespace-nowrap">
                                  {column.label}
                                </th>
                              ))}
                            </tr>
                          </thead>
                          <tbody>
                            {filteredTechnicalRecordRows.map((row) => (
                              <tr key={row.id} className="border-b border-slate-100 last:border-b-0">
                                {technicalRecordColumns.map((column, index) => (
                                  <td key={column.key} className={`px-4 py-3.5 text-[0.74rem] text-slate-500 whitespace-nowrap ${index === 0 ? 'font-medium text-[#291242]' : ''}`}>
                                    {formatDataCellValue(row[column.key])}
                                  </td>
                                ))}
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                      {filteredTechnicalRecordRows.length === 0 && (
                        <div className="mt-4 rounded-[1.8rem] border border-dashed border-slate-200 bg-slate-50 px-5 py-6">
                          <p className="text-[0.78rem] text-slate-500 leading-relaxed">No hay registros visibles que coincidan con los filtros aplicados.</p>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}
            </div>

            <div ref={departmentDetailRef} className="bg-white rounded-[3rem] p-8 border border-slate-200">
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
                          value: selectedFestivalRecords.length,
                          tone: 'text-[#291242]',
                          accent: '#291242',
                        },
                        {
                          label: 'Escuelas',
                          value: selectedSchoolRecords.length,
                          tone: 'text-[#14532d]',
                          accent: '#00DA5E',
                        },
                        {
                          label: 'Mercados',
                          value: selectedMarketRecords.length,
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
                  {departmentDrilldownSections.map((section) => {
                    const isExpanded = expandedDepartmentSection === section.key;

                    return (
                      <div
                        key={section.key}
                        className={`rounded-[2.2rem] border transition-all duration-500 overflow-hidden ${isExpanded ? 'border-[#8BF784] bg-slate-50/70 shadow-sm' : 'border-slate-200 bg-white'}`}
                      >
                        <button
                          type="button"
                          onClick={() => setExpandedDepartmentSection(isExpanded ? '' : section.key)}
                          className="w-full flex items-center justify-between gap-5 px-6 py-5 text-left"
                        >
                          <div>
                            <p className={`text-[0.56rem] font-bold uppercase tracking-[0.22em] ${section.accent}`}>{section.label}</p>
                            <p className="text-[0.78rem] text-slate-500 mt-2 leading-relaxed">{section.description}</p>
                          </div>
                          <div className="flex items-center gap-4 shrink-0">
                            <div className="text-right">
                              <p className="font-alternate text-2xl font-bold text-[#291242] leading-none">{formatMetricValue(section.count)}</p>
                              <p className="text-[0.5rem] font-bold uppercase tracking-[0.18em] text-slate-400">{section.pending ? 'Próx.' : 'Registros'}</p>
                            </div>
                            {isExpanded ? <ChevronUp size={18} className="text-[#00DA5E]" /> : <ChevronDown size={18} className="text-slate-300" />}
                          </div>
                        </button>

                        <div className={`overflow-hidden transition-all duration-700 ease-in-out ${isExpanded ? 'max-h-[3200px] opacity-100' : 'max-h-0 opacity-0 pointer-events-none'}`}>
                          <div className="px-6 pb-6">
                            {section.key === 'Festivales' && (
                              selectedFestivalRecords.length > 0 ? (
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
                              ) : (
                                <div className="rounded-[1.8rem] border border-dashed border-slate-200 bg-white px-5 py-6">
                                  <p className="text-[0.82rem] text-slate-500 leading-relaxed">Este departamento aún no tiene festivales visibles en la capa actual.</p>
                                </div>
                              )
                            )}

                            {section.key === 'Escuelas de Música' && (
                              selectedSchoolRecords.length > 0 ? (
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
                              ) : (
                                <div className="rounded-[1.8rem] border border-dashed border-slate-200 bg-white px-5 py-6">
                                  <p className="text-[0.82rem] text-slate-500 leading-relaxed">Este departamento aún no tiene escuelas visibles en la capa pública.</p>
                                </div>
                              )
                            )}

                            {section.key === 'Mercados Musicales' && (
                              selectedMarketRecords.length > 0 ? (
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
                              ) : (
                                <div className="rounded-[1.8rem] border border-dashed border-slate-200 bg-white px-5 py-6">
                                  <p className="text-[0.82rem] text-slate-500 leading-relaxed">Este departamento aún no tiene mercados visibles en la capa pública.</p>
                                </div>
                              )
                            )}
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

      </ContentWrapper>
    </div>
  );
};

/* ==========================================================================
 * 05. HOME Y MÓDULOS DE PORTADA
 * ========================================================================== */

const HomeContent = ({ setPage, onNavigateToArticle, onNavigateToAgendaEvent, onNavigateToMapLayer, onOpenMapParticipation }) => {
  const scrollTargetRef = useRef(null);
  const [homeHeroBgImage] = useState(
    () => HOME_HERO_IMAGES[Math.floor(Math.random() * HOME_HERO_IMAGES.length)]
  );

  const MediaBanner = () => { 
    const [activeIndex, setActiveIndex] = useState(0); 
    const [progress, setProgress] = useState(0); 
    const slides = [
      {
        url: MEDIA_LIBRARY.performanceWide,
        tag: "Mapa Ecosistémico",
        title: "Participa en el mapeo musical de Colombia",
        desc: "Registra tu proceso, organización, festival, mercado, colectivo, espacio o perfil individual dentro de la lectura territorial del ecosistema musical.",
        cta: "Haz parte de este mapeo",
        action: onOpenMapParticipation,
      },
      {
        url: MEDIA_LIBRARY.homeHero,
        tag: "Celebra la Música",
        title: "Activa la circulación musical en tu territorio",
        desc: "Conoce la estrategia, los recursos y las rutas de participación de Celebra la Música como movimiento nacional de circulación y encuentro.",
        cta: "Explorar estrategia",
        action: () => setPage('estrategia-circulacion'),
      },
      {
        url: MEDIA_LIBRARY.fieldworkWide,
        tag: "Territorios Sonoros",
        title: "Explora turismo cultural y músicas regionales",
        desc: "Descubre cómo esta línea articula circulación, turismo cultural, saberes locales y experiencias territoriales en torno a la música.",
        cta: "Ver territorios sonoros",
        action: () => setPage('estrategia-investigacion'),
      }
    ]; 

    useEffect(() => {
      const interval = setInterval(() => {
        setProgress((currentProgress) => {
          if (currentProgress >= 100) {
            setActiveIndex((currentIndex) => (currentIndex + 1) % slides.length);
            return 0;
          }

          return currentProgress + 1;
        });
      }, 60);

      return () => clearInterval(interval);
    }, [slides.length]);

    return (
      <div className="relative w-full h-full">
        {slides.map((s, i) => {
          const isActive = i === activeIndex;

          return (
          <div
            key={i}
            aria-hidden={!isActive}
            className={`absolute inset-0 transition-all duration-1000 ${isActive ? 'opacity-100 pointer-events-auto z-10' : 'opacity-0 pointer-events-none z-0'}`}
          >
            <img src={s.url} alt={s.title} className="w-full h-full object-cover brightness-[0.5] saturate-[0.7]" />
            <div className="absolute inset-0 bg-[#291242]/58"></div>
            <div className="absolute inset-0 bg-gradient-to-b from-[#291242]/92 via-[#291242]/20 to-[#291242]/92"></div>
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_70%_45%,rgba(139,247,132,0.12),transparent_35%)]"></div>
            <div className="absolute inset-0 max-w-[100rem] mx-auto px-6 lg:px-12 py-8 md:py-10 flex items-end justify-end">
              <div className="max-w-lg pb-10 md:pb-14 text-right flex flex-col items-end">
                <span className="inline-flex rounded-full border border-white/10 bg-white/10 px-3 py-1.5 font-alternate text-[0.55rem] font-bold uppercase tracking-[0.28em] text-[#8BF784]">
                  {s.tag}
                </span>
                <span className="mt-6 block font-alternate text-[0.55rem] font-bold uppercase tracking-[0.3em] text-white/45">
                  0{i + 1} / 03
                </span>
                <h3 className="mt-3 max-w-xl font-gregor text-3xl md:text-4xl text-white font-bold uppercase leading-none tracking-tight">
                  {s.title}
                </h3>
                <p className="mt-4 max-w-md font-nunito text-[0.74rem] md:text-[0.82rem] text-white/70 leading-relaxed">
                  {s.desc}
                </p>
                <div className="mt-6">
                  <Button
                    type="button"
                    onClick={s.action}
                    variant="primary"
                    className="px-7 py-3 text-[0.66rem]"
                    icon={ArrowRight}
                  >
                    {s.cta}
                  </Button>
                </div>
              </div>
            </div>
          </div>
        )})}
        <div className="absolute bottom-8 right-6 lg:right-12 z-20 flex justify-end gap-2.5">
          {slides.map((_, i) => (
            <button
              key={i}
              type="button"
              onClick={() => {
                setActiveIndex(i);
                setProgress(0);
              }}
              className="w-14 h-0.5 bg-white/15 rounded-full overflow-hidden"
              aria-label={`Ir al banner ${i + 1}`}
            >
              <div className="h-full bg-[#8BF784]" style={{ width: i === activeIndex ? `${progress}%` : i < activeIndex ? '100%' : '0%' }}></div>
            </button>
          ))}
        </div>
      </div>
    ); 
  }; 
  
  return (
    <div className="relative"> 
      <section>
        <PageHero 
          tag="PLAN NACIONAL DE MÚSICA PARA LA CONVIVENCIA 2025—2035" 
          title="Huellas y Apuestas de la" 
          titleAccent="Diversidad Sonora" 
          description="Un pacto colectivo que reconoce la música como un derecho cultural y un bien común en todo el territorio nacional." 
          bgImage={homeHeroBgImage}
          bgImageClassName="scale-[1.24] md:scale-[1.16] opacity-30"
          fullScreen={true}
          scrollTargetRef={scrollTargetRef}
        > 
          <Button onClick={() => setPage('pnmc')} variant="primary" icon={ArrowRight}>Sobre el PNMC</Button> 
          <Button onClick={() => setPage('ejes')} variant="ghost">Explorar Ejes</Button> 
        </PageHero> 
      </section>

      <section className="min-h-screen">
        <div className="pt-8 md:pt-12">
          <PNMCPreviewSection onNavigate={setPage} scrollTargetRef={scrollTargetRef} /> 
        </div>
        <div className="relative w-full h-[52svh] md:h-[58svh] bg-[#291242] overflow-hidden border-y border-white/5">
          <MediaBanner />
        </div> 
        <MapaEcosistemicoPreview onNavigate={setPage} onNavigateToMapLayer={onNavigateToMapLayer} onOpenParticipation={onOpenMapParticipation} /> 
        <NoticiasAgendaPreview onNavigate={setPage} onNavigateToArticle={onNavigateToArticle} onNavigateToAgendaEvent={onNavigateToAgendaEvent} /> 

        <div className="w-full bg-[#291242] py-12 relative overflow-hidden border-y border-white/5">
          <div className="max-w-[100rem] mx-auto px-6 lg:px-12 flex flex-col md:flex-row items-center justify-between gap-8 relative z-10">
            <div className="flex flex-col md:flex-row items-center gap-6 text-center md:text-left">
              <Tag text="BOLETÍN" className="bg-white/10 text-[#00DA5E]" />
              <div className="space-y-1">
                <h4 className="font-gregor text-2xl font-bold uppercase leading-none tracking-tight text-white">Recibe las Novedades</h4>
                <p className="font-nunito text-white/40 text-[0.7rem] leading-relaxed">Convocatorias y lanzamientos semanales del PNMC.</p>
              </div>
            </div>
            <div className="flex w-full md:w-auto items-center gap-3">
              <input type="text" placeholder="Email" className="bg-white/5 border border-white/10 rounded-xl py-3 px-6 text-sm font-nunito outline-none text-white w-full md:w-[300px] focus:border-[#00DA5E] transition-all" />
              <Button variant="primary" className="py-3.5 px-10 whitespace-nowrap">Registrarme</Button>
            </div>
          </div>
          <div className="absolute top-1/2 left-0 w-full h-px bg-white/5 -translate-y-1/2"></div>
        </div>

        <HomeStrategiesSection onNavigate={setPage} /> 
        <AppFooter />
      </section>
    </div> 
  );
}; 

const PNMCPreviewSection = ({ onNavigate, scrollTargetRef }) => {
  const navigateToSection = (page, sectionId) => {
    onNavigate(page);
    setTimeout(() => {
      const el = document.getElementById(sectionId);
      scrollToElementWithOffset(el);
    }, 150);
  };

  return (
    <ContentWrapper className="bg-white overflow-hidden">
      <div ref={scrollTargetRef} className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-20 items-start">
        <div className="lg:col-span-7 flex flex-col relative text-left">
          <div className="space-y-8 mb-8">
            <div className="relative group">
              <div 
                className="font-gregor text-[4.5rem] lg:text-[8rem] select-none opacity-5 font-bold leading-none tracking-tight pointer-events-none" 
                style={{ color: '#291242' }} 
              >
                IDENTIDAD
              </div>
              <div className="absolute bottom-0 left-0 z-10 flex items-end gap-4 whitespace-nowrap">
                <h2 className="font-gregor text-3xl lg:text-5xl text-[#291242] font-bold uppercase leading-none">
                  HUELLA Y EVOLUCIÓN
                </h2>
                <div className="w-8 lg:w-12 h-1.5 bg-[#8BF784] rounded-full mb-1 opacity-80 group-hover:w-24 transition-all duration-500"></div>
              </div>
            </div>
            <div className="space-y-6 max-w-2xl relative z-10">
              <p className="text-xl lg:text-2xl text-[#291242] font-light font-nunito leading-snug">
                El <strong className="font-bold">PNMC 2025-2035</strong> es una herramienta para que la música sea motor de vida, paz y justicia social.
              </p>
              <div className="flex gap-5 border-l border-slate-200 pl-6 py-1">
                <p className="text-sm lg:text-base text-slate-500 font-nunito leading-relaxed">
                  Desde hace más de dos décadas, el Plan Nacional de Música para la Convivencia (PNMC) promueve la diversidad cultural de Colombia como un pilar para la paz y la equidad.
                </p>
              </div>
            </div>
          </div>
          <div className="rounded-[2.5rem] overflow-hidden shadow-2xl bg-slate-900 border border-slate-100 relative z-10 aspect-[16/6.5]">
            <img 
              src="https://images.unsplash.com/photo-1774558396280-c14b21198674?q=80&w=1470&auto=format&fit=crop" 
              className="w-full h-full object-cover grayscale brightness-90" 
              alt="Músicos" 
            />
          </div>
        </div>
        <div className="lg:col-span-5 flex flex-col lg:self-center text-left">
          <div className="mb-8">
            <span className="text-slate-400 font-bold text-[0.55rem] uppercase tracking-[0.3em] font-alternate block mb-2">EL PNMC TIENE UNA ESTRUCTURA ESTRATÉGICA</span>
            <h3 className="text-[#291242] font-alternate text-3xl font-bold uppercase leading-none tracking-tight">PLANTEADA EN TRES EJES BASE</h3>
          </div>
          <div className="space-y-4 mb-8">
            {[
              { id: "01", t: "MÚSICA PARA LA VIDA, EL DIÁLOGO INTERCULTURAL Y LA DIVERSIDAD BIOCULTURAL", s: "Apropiación; Enfoque poblacional", target: 'musica-para-la-vida' },
              { id: "02", t: "FORTALECIMIENTO DE LAS PRÁCTICAS, EXPRESIONES Y OFICIOS DE LA MÚSICA", s: "Formación; Creación; Circulación; Memoria", target: 'oficios-y-practicas' },
              { id: "03", t: "GOBERNANZA MUSICAL E INTEGRACIÓN CULTURAL E INTERSECTORIAL", s: "Participación; Sostenibilidad", target: 'gobernanza' }
            ].map(e => (
              <div 
                key={e.id} 
                onClick={() => navigateToSection('ejes', e.target)}
                className="flex items-center gap-6 p-6 rounded-2xl border border-slate-50 bg-white shadow-sm hover:shadow-md hover:border-slate-100 transition-all group cursor-pointer"
              >
                <span className="font-gregor text-4xl text-slate-100 font-bold group-hover:text-[#8BF784] transition-colors leading-none">{e.id}</span>
                <div className="flex-1">
                  <h5 className="font-alternate text-lg text-[#291242] font-bold leading-tight mb-1">{e.t}</h5>
                  <p className="text-[0.65rem] text-slate-400 font-medium">{e.s}</p>
                </div>
                <ChevronRight size={16} className="text-slate-200 group-hover:text-[#291242] group-hover:translate-x-1 transition-all" />
              </div>
            ))}
          </div>
          <button 
            onClick={() => onNavigate('pnmc')}
            className="bg-[#291242] text-white self-start px-8 py-3 rounded-xl font-bold text-[0.7rem] uppercase font-alternate tracking-widest flex items-center gap-3 hover:bg-[#6100D7] transition-all shadow-xl"
          >
            DETALLES DEL PNMC
            <ArrowRight size={14} />
          </button>
        </div> 
      </div> 
    </ContentWrapper> 
  );
};

const MapaEcosistemicoPreview = ({ onNavigateToMapLayer, onOpenParticipation }) => {
  const {
    mapData,
    isLoading: isMapLoading,
    isRefreshing: isMapRefreshing,
    isError: isMapError,
    error: mapError,
    retry: retryMapData,
  } = useMapData({
    getBaseDepartmentCounts,
    buildFestivalCounts,
    buildSchoolCounts,
    buildMarketCounts,
    buildPublicSchoolRecord,
    buildPublicMarketRecord,
  });

  const previewCards = useMemo(() => {
    const festivalCount = mapData?.festivalCounts
      ? sumNumericValues(Object.values(mapData.festivalCounts))
      : null;
    const schoolCount = mapData?.schoolRecords?.length ?? null;
    const marketCount = mapData?.marketRecords?.length ?? null;

    return [
      { name: 'Festivales', count: festivalCount, img: 'https://images.unsplash.com/photo-1774558396253-be05d7a37d82?q=80&w=1470&auto=format&fit=crop', targetLayer: 'Festivales' },
      { name: 'Mercados', count: marketCount, img: 'https://images.unsplash.com/photo-1774558396253-be05d7a37d82?q=80&w=1470&auto=format&fit=crop', targetLayer: 'Mercados Musicales' },
      { name: 'Escuelas', count: schoolCount, img: 'https://images.unsplash.com/photo-1774558396253-be05d7a37d82?q=80&w=1470&auto=format&fit=crop', targetLayer: 'Escuelas de Música' },
      { name: 'Redes', count: 0, img: 'https://images.unsplash.com/photo-1774558396280-c14b21198674?q=80&w=1470&auto=format&fit=crop', targetLayer: 'General' },
    ];
  }, [mapData]);

  return ( 
    <ContentWrapper className="bg-white" id="mapa-home"> 
      <SectionHeader backgroundText="MAPA" foregroundText="Mapa Ecosistémico" verticalContext="ESTRUCTURA" compact /> 
      <div className="mt-2 mb-6 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <p className="max-w-2xl text-[0.8rem] leading-relaxed text-slate-500">El mapeo sigue creciendo y ahora también abre un espacio para que organizaciones, festivales, mercados, registros individuales, colectivos y espacios del país registren su información básica dentro del ecosistema musical colombiano.</p>
        <Button
          type="button"
          onClick={onOpenParticipation}
          variant="primary"
          className="px-8 py-4 text-[0.68rem] self-start lg:self-auto"
          icon={ArrowRight}
        >
          Haz parte de este mapeo
        </Button>
      </div>
      {isMapLoading || isMapRefreshing ? (
        <div className="mb-6">
          <LoadingState
            title="Actualizando capas del mapa..."
            description="Estamos consolidando los datos territoriales más recientes."
          />
        </div>
      ) : null}
      {isMapError ? (
        <div className="mb-6">
          <ErrorState
            title="No pudimos sincronizar el preview del mapa"
            description={mapError?.message || 'Intenta de nuevo para recargar las capas.'}
            onRetry={retryMapData}
          />
        </div>
      ) : null}
      <div className="mt-2 overflow-hidden rounded-[2.5rem] border border-slate-200 bg-white shadow-sm hover:shadow-lg transition-shadow duration-700"> 
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4"> 
          {previewCards.map((cat, i) => ( 
            <div
              key={cat.name}
              onClick={() => onNavigateToMapLayer(cat.targetLayer)}
              className="group relative aspect-square md:aspect-auto md:h-[450px] overflow-hidden cursor-pointer bg-slate-900"
            >
              <img 
                src={cat.img} 
                alt="" 
                className="absolute inset-0 w-full h-full object-cover transition-all duration-1000 grayscale opacity-60 group-hover:grayscale-0 group-hover:opacity-100 group-hover:scale-105" 
              />
              <div className="absolute inset-0 bg-[#8BF784]/15 group-hover:opacity-0 transition-opacity duration-700"></div>
              <div className="absolute inset-0 bg-gradient-to-t from-[#291242] via-transparent to-transparent group-hover:from-[#291242]/90 transition-all"></div>
              <div className="relative h-full p-6 flex flex-col justify-end text-left">
                <span className="text-[0.55rem] font-bold text-[#8BF784] uppercase font-alternate tracking-[0.3em] mb-1 opacity-0 group-hover:opacity-100 transition-all translate-y-2 group-hover:translate-y-0 duration-500">Nodo 0{i + 1}</span>
                <h4 className="font-gregor text-white text-xl lg:text-2xl font-bold uppercase leading-none mb-1 group-hover:text-[#8BF784] transition-colors">{cat.name}</h4>
                <div className="flex items-center justify-between border-t border-white/10 mt-3 pt-3">
                  <span className="text-white font-bold text-[0.45rem] uppercase font-alternate tracking-widest bg-white/10 px-1.5 py-0.5 rounded-md">
                    {cat.count === null ? '—' : formatMetricValue(cat.count)} REGISTROS
                  </span>
                  <ArrowUpRight size={12} className="text-[#8BF784] opacity-0 group-hover:opacity-100 transition-all" />
                </div>
              </div>
            </div> 
          ))} 
        </div> 
        <div className="bg-[#291242] p-8 flex flex-col sm:flex-row items-center justify-between gap-6 border-t border-white/5">
          <div className="flex flex-col gap-1 text-center sm:text-left">
            <h4 className="font-alternate text-white text-xl lg:text-2xl font-bold uppercase tracking-widest leading-none">Explora el Mapa Ecosistémico de Colombia</h4>
            <p className="text-[0.6rem] text-slate-400 uppercase tracking-[0.3em] font-alternate">Base de datos nacional del sector musical</p>
          </div>
	          <div className="flex flex-col gap-3 sm:flex-row">
	            <Button onClick={() => onNavigateToMapLayer('General')} variant="primary" className="px-10 py-4 text-xs" icon={ArrowRight}>Acceder al Mapa</Button>
	          </div>
	        </div> 
	      </div> 
    </ContentWrapper> 
  );
}; 

const NoticiasAgendaPreview = ({ onNavigate, onNavigateToArticle, onNavigateToAgendaEvent }) => {
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
      setActiveNewsGroup(prev => (prev === 0 ? 1 : 0));
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
                    <img src={featuredGroup[0].img} className="w-full h-full object-cover transition-transform duration-1000 group-hover:scale-105" alt=""/>
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
                      <img src={item.img} className="w-full h-full object-cover grayscale group-hover:grayscale-0 transition-all duration-700" alt=""/>
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

const HomeStrategiesSection = ({ onNavigate }) => (
  <ContentWrapper className="bg-white">
    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
      <div 
        onClick={() => onNavigate('estrategia-circulacion')} 
        className="rounded-[3rem] group transition-all border border-slate-100 flex flex-col justify-end min-h-[420px] shadow-sm cursor-pointer text-left relative overflow-hidden"
      >
        <img src="https://images.unsplash.com/photo-1774558396280-c14b21198674?q=80&w=1470&auto=format&fit=crop" alt="" className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-[1.03]" />
        <div className="absolute inset-0 bg-white/28"></div>
        <div className="absolute inset-0 bg-gradient-to-t from-white/72 via-white/36 to-white/0 transition-all duration-500 group-hover:from-white/80 group-hover:via-white/42 group-hover:to-white/0"></div>
        <div className="absolute -right-20 -top-20 w-80 h-80 bg-white/20 rounded-full blur-[100px] transition-all group-hover:scale-125"></div>
        <div className="absolute top-8 left-8 z-10">
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onNavigate('comp-c2-3');
            }}
          >
            <Tag text="Estrategia de Circulación" className="bg-[#291242] text-white" />
          </button>
        </div>
        <div className="relative z-10 m-6 lg:m-8">
          <h3 className="px-1 font-gregor text-4xl lg:text-5xl text-[#291242] font-bold uppercase leading-none tracking-tighter transition-all duration-300 group-hover:opacity-0 group-hover:-translate-y-2">Celebra la Música</h3>
          <div className="mt-4 max-h-0 overflow-hidden rounded-[2.2rem] border border-transparent bg-transparent p-0 opacity-0 transition-all duration-500 group-hover:max-h-48 group-hover:border-white/75 group-hover:bg-white/96 group-hover:p-7 group-hover:opacity-100 group-hover:backdrop-blur-sm lg:group-hover:p-8">
            <div className="w-12 h-1 rounded-full bg-[#291242] mb-5"></div>
            <h3 className="font-gregor text-3xl lg:text-4xl text-[#291242] font-bold uppercase leading-none tracking-tighter">Celebra la Música</h3>
            <p className="text-[0.95rem] text-[#291242]/78 font-nunito leading-relaxed">Activa escenarios, programación y redes territoriales para que los procesos musicales circulen, se conecten y ganen visibilidad.</p>
            <div className="mt-6 text-[0.7rem] font-bold text-[#291242] flex items-center gap-3 uppercase font-alternate tracking-widest">
              Explorar Estrategia <ChevronRight size={16} />
            </div>
          </div>
        </div>
      </div>

      <div 
        onClick={() => onNavigate('estrategia-investigacion')}
        className="rounded-[3rem] text-[#291242] shadow-xl flex flex-col justify-end min-h-[420px] relative overflow-hidden group cursor-pointer"
      >
        <img src="https://images.unsplash.com/photo-1774558396253-be05d7a37d82?q=80&w=1470&auto=format&fit=crop" alt="" className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-[1.03]" />
        <div className="absolute inset-0 bg-white/28"></div>
        <div className="absolute inset-0 bg-gradient-to-t from-white/72 via-white/36 to-white/0 transition-all duration-500 group-hover:from-white/80 group-hover:via-white/42 group-hover:to-white/0"></div>
        <div className="absolute -right-20 -top-20 w-80 h-80 bg-white/20 rounded-full blur-[100px] transition-all group-hover:scale-125"></div>
        <div className="absolute top-8 left-8 z-10">
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onNavigate('comp-c2-4');
            }}
          >
            <Tag text="Estrategia de Investigación" className="bg-[#291242] text-white" />
          </button>
        </div>
        <div className="relative z-10 m-6 lg:m-8">
          <h3 className="px-1 font-gregor text-4xl lg:text-5xl font-bold uppercase leading-none tracking-tighter transition-all duration-300 group-hover:opacity-0 group-hover:-translate-y-2">Territorios Sonoros</h3>
          <div className="mt-4 max-h-0 overflow-hidden rounded-[2.2rem] border border-transparent bg-transparent p-0 opacity-0 transition-all duration-500 group-hover:max-h-48 group-hover:border-white/75 group-hover:bg-white/96 group-hover:p-7 group-hover:opacity-100 group-hover:backdrop-blur-sm lg:group-hover:p-8">
            <div className="w-12 h-1 rounded-full bg-[#291242] mb-5"></div>
            <h3 className="font-gregor text-3xl lg:text-4xl font-bold uppercase leading-none tracking-tighter">Territorios Sonoros</h3>
            <p className="text-[0.95rem] text-[#291242]/78 font-nunito leading-relaxed">Impulsa procesos de investigación, cartografía y documentación para reconocer, interpretar y proyectar la diversidad sonora del país.</p>
            <div className="mt-6 text-[0.7rem] font-bold text-[#291242] flex items-center gap-3 uppercase font-alternate tracking-widest">
              Explorar Estrategia <ChevronRight size={16} />
            </div>
          </div>
        </div>
      </div>
    </div>
  </ContentWrapper>
);

/* ==========================================================================
 * 07. SHELL DE APLICACIÓN
 * ========================================================================== */

const findEjeComponentById = (componentId = '') => {
  if (!componentId) return null;

  for (const eje of ejesDataGlobal) {
    const match = eje.components.find((component) => component.id === componentId);
    if (match) return match;
  }

  return null;
};

const ComponentRoutePage = ({
  onBack,
  onNavigate,
  onNavigateToEditorialResource,
}) => {
  const { componentId = '' } = useParams();
  const foundComponent = useMemo(
    () => findEjeComponentById(componentId),
    [componentId],
  );

  if (!foundComponent) {
    return (
      <div className="bg-white min-h-screen pt-32 px-8 text-left">
        <div className="relative mb-4 lg:mb-6 w-full text-left">
          <h2 className="font-gregor text-[#291242] uppercase tracking-tighter leading-none text-3xl lg:text-5xl">Componente no encontrado</h2>
        </div>
        <p className="text-slate-500 font-light mb-8">
          El componente solicitado no existe o cambió de identificador.
        </p>
        <Button onClick={onBack} variant="secondary">Volver a Ejes</Button>
      </div>
    );
  }

  return (
    <ComponentSubPage
      component={foundComponent}
      onBack={onBack}
      onNavigate={onNavigate}
      onNavigateToEditorialResource={onNavigateToEditorialResource}
    />
  );
};

const UnknownRoutePage = ({ onGoHome }) => (
  <div className="bg-white min-h-screen pt-32 px-8 text-left">
    <div className="relative mb-4 lg:mb-6 w-full text-left">
      <h2 className="font-gregor text-[#291242] uppercase tracking-tighter leading-none text-3xl lg:text-5xl">En Desarrollo</h2>
    </div>
    <p className="text-slate-500 font-light mb-8">Bajo construcción.</p>
    <Button onClick={onGoHome} variant="secondary">Volver al Inicio</Button>
  </div>
);

export default function App() { 
  const { activePage, setActivePage } = useAppNavigation();
  const [, setDivipolaSnapshot] = useState(() => getRuntimeDivipolaByDepartment());
  const [scrolled, setScrolled] = useState(false); 
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [activeNavDropdown, setActiveNavDropdown] = useState(null);
  const [activeEjeMenuId, setActiveEjeMenuId] = useState(ejesDataGlobal[0]?.id || null);
  const [selectedArticle, setSelectedArticle] = useState(null);
  const [selectedAgendaEventId, setSelectedAgendaEventId] = useState(null);
  const [selectedEditorialResourceId, setSelectedEditorialResourceId] = useState(null);
  const [mapaNavigationRequest, setMapaNavigationRequest] = useState(null);

  useEffect(() => {
    let active = true;

    const syncDivipola = async () => {
      try {
        const grouped = await fetchDivipolaGrouped();
        if (!active) return;
        setRuntimeDivipolaByDepartment(grouped);
        setDivipolaSnapshot(grouped);
      } catch (error) {
        console.warn('No se pudo sincronizar DIVIPOLA desde backend:', error);
      }
    };

    syncDivipola();

    return () => {
      active = false;
    };
  }, [setDivipolaSnapshot]);

  const handlePageChange = useCallback((pageId) => {
    setActivePage(pageId);
    setSelectedArticle(null);
    setSelectedAgendaEventId(null);
    setSelectedEditorialResourceId(null);
    setMapaNavigationRequest(null);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [setActivePage]);

  const handleNavigateToArticle = useCallback((article) => {
    setSelectedArticle(article);
    setSelectedAgendaEventId(null);
    setSelectedEditorialResourceId(null);
    setActivePage(PAGE_IDS.noticias);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [setActivePage]);

  const handleNavigateToAgendaEvent = useCallback((eventId) => {
    setSelectedAgendaEventId(eventId);
    setSelectedArticle(null);
    setSelectedEditorialResourceId(null);
    setActivePage(PAGE_IDS.agenda);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [setActivePage]);

  const handleNavigateToEditorialResource = useCallback((resourceId) => {
    setSelectedEditorialResourceId(resourceId);
    setSelectedArticle(null);
    setSelectedAgendaEventId(null);
    setActivePage(PAGE_IDS.editorial);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [setActivePage]);

  const handleNavigateComponent = useCallback((compId) => {
    setActivePage(toComponentPageId(compId));
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [setActivePage]);

  const handleOpenMapParticipation = useCallback(() => {
    handlePageChange(PAGE_IDS.mapaParticipa);
  }, [handlePageChange]);

  const handleNavigateToMapLayer = useCallback((targetLayer = 'General', options = {}) => {
    const {
      targetView = 'map',
      scrollToWorkspace = true,
    } = options;

    setSelectedArticle(null);
    setSelectedAgendaEventId(null);
    setSelectedEditorialResourceId(null);
    setMapaNavigationRequest({
      requestId: Date.now(),
      targetLayer,
      targetView,
      scrollToWorkspace,
    });
    setActivePage(PAGE_IDS.mapa);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [setActivePage]);

  useEffect(() => { window.scrollTo({ top: 0, behavior: 'instant' }); }, [activePage]);
  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const navigationLinks = NAVIGATION_LINKS;
  const primaryNavigationLinks = navigationLinks.filter((link) => ![PAGE_IDS.editorial, PAGE_IDS.mapa].includes(link.id));
  const featuredNavigationLinks = navigationLinks.filter((link) => [PAGE_IDS.mapa, PAGE_IDS.editorial].includes(link.id));
  const ejeNavigationGroups = [
    {
      id: ejesDataGlobal[0]?.id || '01',
      name: 'Música para la vida',
      sectionId: 'musica-para-la-vida',
      components: ejesDataGlobal[0]?.components || [],
    },
    {
      id: ejesDataGlobal[1]?.id || '02',
      name: 'Oficios y prácticas',
      sectionId: 'oficios-y-practicas',
      components: ejesDataGlobal[1]?.components || [],
    },
    {
      id: ejesDataGlobal[2]?.id || '03',
      name: 'Gobernanza',
      sectionId: 'gobernanza',
      components: ejesDataGlobal[2]?.components || [],
    },
  ];

  const handleNavigateToPageSection = useCallback((pageId, sectionId) => {
    setMobileMenuOpen(false);
    setActiveNavDropdown(null);

    if (!sectionId) {
      handlePageChange(pageId);
      return;
    }

    if (activePage !== pageId) {
      handlePageChange(pageId);
      window.setTimeout(() => {
        const targetElement = document.getElementById(sectionId);
        if (targetElement) {
          scrollToElementWithOffset(targetElement);
        }
      }, 220);
      return;
    }

    const targetElement = document.getElementById(sectionId);
    if (targetElement) {
      scrollToElementWithOffset(targetElement);
      return;
    }

    window.setTimeout(() => {
      const delayedTargetElement = document.getElementById(sectionId);
      if (delayedTargetElement) {
        scrollToElementWithOffset(delayedTargetElement);
      }
    }, 120);
  }, [activePage, handlePageChange]);

  const handleNavigateToComponentFromMenu = useCallback((componentId) => {
    setMobileMenuOpen(false);
    setActiveNavDropdown(null);
    handleNavigateComponent(componentId);
  }, [handleNavigateComponent]);

  return ( 
    <> 
      <style>{` 
        @import url('https://fonts.googleapis.com/css2?family=Nunito+Sans:wght@300;400;600;700&family=Oswald:wght@400;600;700&display=swap'); 
        :root {
          --ease-soft: cubic-bezier(0.22, 1, 0.36, 1);
          --type-step-1: 0.75rem;
          --type-step-1-line: 1rem;
          --type-step-2: 0.875rem;
          --type-step-2-line: 1.25rem;
          --type-step-3: 1rem;
          --type-step-3-line: 1.5rem;
          --type-step-4: 1.125rem;
          --type-step-4-line: 1.6rem;
          --type-step-5: 1.25rem;
          --type-step-5-line: 1.75rem;
        }
        .font-gregor { font-family: 'Impact', 'Oswald', sans-serif; } 
        .font-alternate { font-family: 'Oswald', sans-serif; letter-spacing: 0.04em !important; } 
        .font-nunito { font-family: 'Nunito Sans', sans-serif; } 
        html { scroll-behavior: smooth; } 
        body {
          text-rendering: optimizeLegibility;
          -webkit-font-smoothing: antialiased;
          -moz-osx-font-smoothing: grayscale;
        }
        button, a, input, select, textarea {
          transition-timing-function: var(--ease-soft);
        }
        .transition-all,
        .transition-colors,
        .transition-transform,
        .transition-shadow {
          transition-timing-function: var(--ease-soft) !important;
        }
        [class*="text-[0.42rem]"],
        [class*="text-[0.44rem]"],
        [class*="text-[0.45rem]"],
        [class*="text-[0.46rem]"],
        [class*="text-[0.48rem]"],
        [class*="text-[0.5rem]"],
        [class*="text-[0.52rem]"],
        [class*="text-[0.54rem]"],
        [class*="text-[0.55rem]"],
        [class*="text-[0.56rem]"],
        [class*="text-[0.58rem]"],
        [class*="text-[0.6rem]"],
        [class*="text-[0.62rem]"],
        [class*="text-xs"] {
          font-size: var(--type-step-1) !important;
          line-height: var(--type-step-1-line) !important;
        }
        [class*="text-[0.64rem]"],
        [class*="text-[0.65rem]"],
        [class*="text-[0.66rem]"],
        [class*="text-[0.68rem]"],
        [class*="text-[0.7rem]"],
        [class*="text-[0.72rem]"],
        [class*="text-[0.74rem]"],
        [class*="text-[0.75rem]"],
        [class*="text-[0.76rem]"],
        [class*="text-[0.78rem]"],
        [class*="text-sm"] {
          font-size: var(--type-step-2) !important;
          line-height: var(--type-step-2-line) !important;
        }
        [class*="text-[0.8rem]"],
        [class*="text-[0.82rem]"],
        [class*="text-[0.84rem]"],
        [class*="text-[0.85rem]"],
        [class*="text-[0.86rem]"],
        [class*="text-[0.9rem]"],
        [class*="text-[0.92rem]"],
        [class*="text-[0.95rem]"],
        [class*="text-[0.98rem]"],
        [class*="text-base"],
        [class*="text-[1rem]"] {
          font-size: var(--type-step-3) !important;
          line-height: var(--type-step-3-line) !important;
        }
        [class*="text-[1.05rem]"],
        [class*="text-[1.1rem]"],
        [class*="text-lg"] {
          font-size: var(--type-step-4) !important;
          line-height: var(--type-step-4-line) !important;
        }
        [class*="text-[1.2rem]"] {
          font-size: var(--type-step-5) !important;
          line-height: var(--type-step-5-line) !important;
        }
        ::selection { background-color: #00DA5E; color: #291242; } 
        ::-webkit-scrollbar { width: 4px; } 
        ::-webkit-scrollbar-track { background: #fff; } 
        ::-webkit-scrollbar-thumb { background: #cbd5e1; border-radius: 4px; } 
        ::-webkit-scrollbar-thumb:hover { background: #00DA5E; } 
        .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
        .no-scrollbar::-webkit-scrollbar { display: none; }
        .custom-scrollbar::-webkit-scrollbar { width: 6px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: rgba(0,0,0,0.02); border-radius: 10px; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: #291242; border-radius: 10px; border: 2px solid transparent; background-clip: padding-box; }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: #00DA5E; }
        .leaflet-container { border-radius: 2.8rem; font-family: inherit; }
        .leaflet-pane,
        .leaflet-control-container,
        .leaflet-bottom,
        .leaflet-top { z-index: 400 !important; }
        .leaflet-interactive {
          pointer-events: all !important;
        }
        .department-label {
          background: transparent;
          border: none;
          box-shadow: none;
          color: #291242;
          font-family: 'Oswald', sans-serif;
          font-size: 9px;
          font-weight: 800;
          letter-spacing: 0.12em;
          text-transform: uppercase;
          text-shadow: none;
          pointer-events: none !important;
        }
        .department-label:before { display: none; }
        .leaflet-tooltip.archipelago-label {
          background: rgba(255, 255, 255, 0.96);
          border: 1px solid rgba(41, 18, 66, 0.12);
          border-radius: 999px;
          box-shadow: 0 10px 24px rgba(15, 23, 42, 0.12);
          color: #291242;
          font-family: 'Oswald', sans-serif;
          font-size: 10px;
          font-weight: 700;
          letter-spacing: 0.08em;
          text-transform: uppercase;
          padding: 0.35rem 0.7rem;
          line-height: 1.2;
          text-align: left;
          white-space: normal;
          max-width: none;
          pointer-events: none !important;
        }
        .leaflet-tooltip.archipelago-label:before {
          display: none;
        }
        .leaflet-tooltip.archipelago-label .archipelago-label-line {
          display: block;
          white-space: nowrap;
          pointer-events: none !important;
        }
        .country-label-marker {
          background: transparent;
          border: none;
          pointer-events: none !important;
        }
        .country-label-marker span {
          color: rgba(15, 23, 42, 0.68);
          font-family: 'Oswald', sans-serif;
          font-size: 10px;
          font-weight: 700;
          letter-spacing: 0.08em;
          text-transform: uppercase;
          white-space: nowrap;
          text-shadow: none;
          pointer-events: none !important;
        }
        .leaflet-popup-content-wrapper {
          border-radius: 1.2rem;
          box-shadow: 0 18px 36px rgba(15, 23, 42, 0.18);
        }
        .leaflet-popup-content {
          margin: 0;
        }
        .leaflet-popup,
        .leaflet-popup-content-wrapper,
        .leaflet-popup-content,
        .leaflet-popup-tip-container {
          pointer-events: none !important;
        }
        .leaflet-popup-close-button {
          display: none !important;
        }
        .leaflet-popup-tip {
          background: white;
        }
      `}</style> 
      <div className="min-h-screen bg-white font-nunito text-slate-900 overflow-x-hidden">
        <AppNavigation
          scrolled={scrolled}
          mobileMenuOpen={mobileMenuOpen}
          setMobileMenuOpen={setMobileMenuOpen}
          activePage={activePage}
          activeNavDropdown={activeNavDropdown}
          setActiveNavDropdown={setActiveNavDropdown}
          activeEjeMenuId={activeEjeMenuId}
          setActiveEjeMenuId={setActiveEjeMenuId}
          navigationLinks={navigationLinks}
          primaryNavigationLinks={primaryNavigationLinks}
          featuredNavigationLinks={featuredNavigationLinks}
          ejeNavigationGroups={ejeNavigationGroups}
          onPageChange={handlePageChange}
          onNavigateToPageSection={handleNavigateToPageSection}
          onNavigateToComponentFromMenu={handleNavigateToComponentFromMenu}
        />

        <main className="min-h-screen">
          <Routes>
            <Route
              path={PAGE_PATHS[PAGE_IDS.home]}
              element={(
                <HomeContent
                  setPage={handlePageChange}
                  onNavigateToArticle={handleNavigateToArticle}
                  onNavigateToAgendaEvent={handleNavigateToAgendaEvent}
                  onNavigateToMapLayer={handleNavigateToMapLayer}
                  onOpenMapParticipation={handleOpenMapParticipation}
                />
              )}
            />
            <Route
              path={PAGE_PATHS[PAGE_IDS.pnmc]}
              element={(
                <SobreElPnmcPage
                  onBack={() => setActivePage(PAGE_IDS.home)}
                  onNavigate={handlePageChange}
                />
              )}
            />
            <Route
              path={PAGE_PATHS[PAGE_IDS.ejes]}
              element={(
                <EjesPage
                  onBack={() => setActivePage(PAGE_IDS.home)}
                  onNavigateComponent={handleNavigateComponent}
                />
              )}
            />
            <Route
              path="/ejes/componentes/:componentId"
              element={(
                <ComponentRoutePage
                  onBack={() => setActivePage(PAGE_IDS.ejes)}
                  onNavigate={handlePageChange}
                  onNavigateToEditorialResource={handleNavigateToEditorialResource}
                />
              )}
            />
            <Route
              path={PAGE_PATHS[PAGE_IDS.editorial]}
              element={(
                <EditorialPage
                  key={`editorial-${selectedEditorialResourceId || 'base'}`}
                  onBack={() => setActivePage(PAGE_IDS.home)}
                  initialExpandedResourceId={selectedEditorialResourceId}
                />
              )}
            />
            <Route
              path={PAGE_PATHS[PAGE_IDS.galeria]}
              element={<GaleriaPage onBack={() => setActivePage(PAGE_IDS.home)} />}
            />
            <Route
              path={PAGE_PATHS[PAGE_IDS.mapa]}
              element={(
                <MapaEcosistemicoPage
                  onBack={() => setActivePage(PAGE_IDS.home)}
                  navigationRequest={mapaNavigationRequest}
                  onOpenParticipation={handleOpenMapParticipation}
                />
              )}
            />
            <Route
              path={PAGE_PATHS[PAGE_IDS.mapaParticipa]}
              element={<MapaParticipaPage onBack={() => handlePageChange(PAGE_IDS.mapa)} />}
            />
            <Route
              path={PAGE_PATHS[PAGE_IDS.agenda]}
              element={(
                <AgendaPage
                  onBack={() => handlePageChange(PAGE_IDS.home)}
                  initialOpenEventId={selectedAgendaEventId}
                />
              )}
            />
            <Route
              path={PAGE_PATHS[PAGE_IDS.noticias]}
              element={(
                <NoticiasPage
                  onBack={() => setActivePage(PAGE_IDS.home)}
                  initialSelectedArticle={selectedArticle}
                />
              )}
            />
            <Route
              path={PAGE_PATHS[PAGE_IDS.estrategiaCirculacion]}
              element={(
                <StrategySubPage
                  title="Celebra la Música"
                  context="Estrategia de Circulación"
                  onBack={() => setActivePage(PAGE_IDS.home)}
                  onNavigate={handlePageChange}
                />
              )}
            />
            <Route
              path={PAGE_PATHS[PAGE_IDS.estrategiaInvestigacion]}
              element={(
                <StrategySubPage
                  title="Territorios Sonoros"
                  context="Estrategia de Investigación"
                  onBack={() => setActivePage(PAGE_IDS.home)}
                  onNavigate={handlePageChange}
                />
              )}
            />
            <Route path="/home" element={<Navigate to={PAGE_PATHS[PAGE_IDS.home]} replace />} />
            <Route
              path="*"
              element={<UnknownRoutePage onGoHome={() => setActivePage(PAGE_IDS.home)} />}
            />
          </Routes>
        </main>

        {activePage !== PAGE_IDS.estrategiaCirculacion && (
          <button 
            className="fixed bottom-6 right-6 z-[60] flex items-center bg-[#00DA5E] text-[#291242] p-2 rounded-full shadow-2xl hover:scale-105 active:scale-95 transition-all duration-500 border border-white/20 group max-w-[54px] hover:max-w-[280px] overflow-hidden whitespace-nowrap focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#291242] focus-visible:ring-offset-2"
            onClick={() => setActivePage(PAGE_IDS.estrategiaCirculacion)}
            aria-label="Abrir estrategia Celebra la música"
          >
            <div className="w-10 h-10 bg-[#291242] text-[#00DA5E] rounded-full flex items-center justify-center shrink-0">
              <PartyPopper size={18} />
            </div>
            <span className="font-alternate text-[0.65rem] font-bold uppercase tracking-widest px-4 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
              Celebra la música
            </span>
          </button>
        )}

        {activePage !== PAGE_IDS.home && <AppFooter />}
      </div> 
    </> 
  ); 
}
