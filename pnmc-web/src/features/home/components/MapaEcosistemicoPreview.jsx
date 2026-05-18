import { ArrowRight, ArrowUpRight } from 'lucide-react';
import { Button, ErrorState, LoadingState } from '../../../components/ui/index.js';
import { useMapData } from '../../../hooks/data/index.js';
import {
  buildFestivalCounts,
  buildMarketCounts,
  buildPublicMarketRecord,
  buildPublicSchoolRecord,
  buildSchoolCounts,
  formatMetricValue,
  getBaseDepartmentCounts,
  sumNumericValues,
} from '../../map/domain/mapDomain.js';
import { ContentWrapper, SectionHeader } from '../../shared/components/PagePrimitives.jsx';

export const MapaEcosistemicoPreview = ({ onNavigateToMapLayer, onOpenParticipation }) => {
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

  const previewCards = [
    {
      name: 'Festivales',
      count: mapData?.festivalCounts
        ? sumNumericValues(Object.values(mapData.festivalCounts))
        : null,
      img: 'https://images.unsplash.com/photo-1774558396253-be05d7a37d82?q=80&w=1470&auto=format&fit=crop',
      targetLayer: 'Festivales',
    },
    {
      name: 'Mercados',
      count: mapData?.marketRecords?.length ?? null,
      img: 'https://images.unsplash.com/photo-1774558396253-be05d7a37d82?q=80&w=1470&auto=format&fit=crop',
      targetLayer: 'Mercados Musicales',
    },
    {
      name: 'Escuelas',
      count: mapData?.schoolRecords?.length ?? null,
      img: 'https://images.unsplash.com/photo-1774558396253-be05d7a37d82?q=80&w=1470&auto=format&fit=crop',
      targetLayer: 'Escuelas de Música',
    },
    {
      name: 'Redes',
      count: 0,
      img: 'https://images.unsplash.com/photo-1774558396280-c14b21198674?q=80&w=1470&auto=format&fit=crop',
      targetLayer: 'General',
    },
  ];

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
