import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  ArrowLeft,
  ArrowRight,
  ArrowUpRight,
  Bookmark,
  ChevronLeft,
  ChevronRight,
  Download,
  Eye,
  FileType,
  Globe,
  Grid3X3,
  Heart,
  Landmark,
  Loader2,
  Map as MapIcon,
  Music2,
  Play,
  Plus,
  Search,
  Share2,
  Sparkles,
  Target,
  Users,
  Users2,
  Building2,
  Boxes,
  Zap,
  UserCircle2,
  X,
  DownloadCloud,
  MessageCircle,
} from 'lucide-react';
import { MEDIA_LIBRARY } from '../../content/domain/mediaLibrary.js';
import {
  METRIC_FORMATTER,
  scrollToElementWithOffset,
} from '../../map/domain/mapDomain.js';
import {
  GALLERY_WALL_FADE_IN_MS,
  GALLERY_WALL_FADE_OUT_MS,
  GALLERY_WALL_LAYOUT_PATTERNS,
  GALLERY_WALL_SLOT_COUNT,
  GALLERY_WALL_SWAP_INTERVAL_MS,
  buildGalleryDownloadName,
} from '../domain/galleryWall.js';
import {
  ContentWrapper,
  PageHero,
  SectionHeader,
  Tag,
} from '../../shared/components/PagePrimitives.jsx';
import { useGalleryAlbums } from '../../../hooks/data/index.js';
import { Button, EmptyState, ErrorState, LoadingState } from '../../../components/ui/index.js';

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


export { GaleriaPage, SobreElPnmcPage };
