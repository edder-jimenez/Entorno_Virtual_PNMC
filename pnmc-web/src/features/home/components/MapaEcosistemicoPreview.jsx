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
import { RANDOM_GALLERY_IMAGES } from '../../content/domain/mediaLibrary.js';

const countDistinctDepartments = (records = [], keys = []) => {
  const values = new Set();
  records.forEach((record) => {
    const source = record?.fields || record || {};
    const match = keys
      .map((key) => source?.[key])
      .find((value) => typeof value === 'string' && value.trim());

    if (match) {
      values.add(match.trim().toLowerCase());
    }
  });
  return values.size;
};

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
      departments: mapData?.festivalCounts
        ? Object.values(mapData.festivalCounts).filter((value) => Number(value) > 0).length
        : 0,
      img: RANDOM_GALLERY_IMAGES[6],
      targetLayer: 'Festivales',
    },
    {
      name: 'Mercados',
      count: mapData?.marketRecords?.length ?? null,
      departments: countDistinctDepartments(mapData?.marketRecords, ['department', 'departmentName']),
      img: RANDOM_GALLERY_IMAGES[7],
      targetLayer: 'Mercados Musicales',
    },
    {
      name: 'Escuelas',
      count: mapData?.schoolRecords?.length ?? null,
      departments: countDistinctDepartments(mapData?.schoolRecords, ['department', 'departmentName']),
      img: RANDOM_GALLERY_IMAGES[8],
      targetLayer: 'Escuelas de Música',
    },
    {
      name: 'Redes Doc.',
      count: mapData?.redesRecords?.length ?? 0,
      departments: countDistinctDepartments(mapData?.redesRecords, ['departmentName', 'departamento']),
      img: RANDOM_GALLERY_IMAGES[9],
      targetLayer: 'Redes de Documentación',
    },
    {
      name: 'Lutieres',
      count: mapData?.luthierRecords?.length ?? 0,
      departments: countDistinctDepartments(mapData?.luthierRecords, ['departmentName', 'departamento']),
      img: RANDOM_GALLERY_IMAGES[10],
      targetLayer: 'Lutieres',
    },
  ];

  return (
    <ContentWrapper className="bg-white" id="mapa-home">
      <SectionHeader backgroundText="MAPA" foregroundText="Mapa Ecosistémico" compact />
      <div className="mt-2 mb-6 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <p className="max-w-2xl text-[0.8rem] leading-relaxed text-slate-500">El mapeo sigue creciendo y ahora abre una puerta directa para que organizaciones, festivales, mercados, redes, lutieres y otros procesos del país registren su información y aparezcan en esta lectura pública del ecosistema musical colombiano.</p>
        <Button
          type="button"
          onClick={onOpenParticipation}
          variant="primary"
          className="px-8 py-4 text-[0.68rem] self-start lg:self-auto"
          icon={ArrowRight}
        >
          Registra tus procesos
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
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
          {previewCards.map((cat) => (
            <div
              key={cat.name}
              onClick={() => onNavigateToMapLayer(cat.targetLayer)}
              className="group relative aspect-video md:aspect-auto md:h-[220px] lg:h-[260px] overflow-hidden cursor-pointer bg-slate-900 border-b border-white/5 sm:border-b-0 sm:border-r"
            >
              <img
                src={cat.img}
                alt=""
                className="absolute inset-0 w-full h-full object-cover transition-all duration-1000 grayscale-[40%] brightness-95 opacity-80 group-hover:grayscale-0 group-hover:brightness-100 group-hover:opacity-100 group-hover:scale-105"
              />
              <div className="absolute inset-0 bg-[#291242]/20 group-hover:opacity-0 transition-opacity duration-700"></div>
              <div className="absolute inset-0 bg-gradient-to-t from-[#291242] via-transparent to-transparent group-hover:from-[#291242]/90 transition-all"></div>
              <div className="relative h-full p-6 flex flex-col justify-end text-left">
                <span className="text-[0.55rem] font-bold text-[#8BF784] uppercase font-alternate tracking-[0.18em] mb-1 opacity-0 group-hover:opacity-100 transition-all translate-y-2 group-hover:translate-y-0 duration-500">
                  Presencia activa en {formatMetricValue(cat.departments || 0)} departamentos
                </span>
                <h4 className="font-gregor text-white text-2xl lg:text-3xl font-bold uppercase leading-none mb-1 group-hover:text-[#8BF784] transition-colors">{cat.name}</h4>
                <div className="flex items-center justify-between border-t border-white/10 mt-3 pt-3">
                  <span className="text-white font-bold text-[0.45rem] uppercase font-alternate tracking-widest bg-white/10 px-1.5 py-0.5 rounded-md">
                    {cat.count === null ? 'Vista integrada' : `${formatMetricValue(cat.count)} registros`}
                  </span>
                  <ArrowUpRight size={14} className="text-[#8BF784] opacity-0 group-hover:opacity-100 transition-all" />
                </div>
              </div>
            </div>
          ))}
          <div className="bg-[#291242] p-8 md:p-10 flex flex-col items-start justify-center gap-6 relative group overflow-hidden aspect-video md:aspect-auto md:h-[220px] lg:h-[260px]">
            <div className="absolute inset-0 bg-[#00DA5E]/5 opacity-0 group-hover:opacity-100 transition-opacity duration-700"></div>
            <div className="relative z-10 flex flex-col gap-2">
              <h4 className="font-alternate text-white text-2xl lg:text-3xl font-bold uppercase tracking-widest leading-[1.1]">Explora el Mapa Ecosistémico</h4>
              <p className="text-[0.65rem] text-[#8BF784] uppercase tracking-[0.25em] font-alternate">Base de datos nacional</p>
            </div>
            <Button onClick={() => onNavigateToMapLayer('General')} variant="primary" className="px-8 py-3.5 text-[0.7rem] relative z-10 shadow-lg hover:scale-105 active:scale-95 transition-transform" icon={ArrowRight}>Acceder al Mapa</Button>
          </div>
        </div>
      </div>
    </ContentWrapper>
  );
};
