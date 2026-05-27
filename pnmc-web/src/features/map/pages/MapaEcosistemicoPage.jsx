import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { getWebText } from '../../../lib/webTexts.js';
import {
  ArrowRight,
  BarChart3,
  CircleHelp,
  Database,
  Download,
  Eye,
  FileDown,
  Filter,
  Info,
  Layers3,
  Loader2,
  Mail,
  MapPin,
  Printer,
  RotateCcw,
  Search,
  X,
  Globe,
  Plus,
} from 'lucide-react';
import L from 'leaflet';
import { GeoJSON, MapContainer, Marker, TileLayer, CircleMarker, Tooltip, Circle, useMap } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import {
  fetchColombiaGeoJson,
  fetchFestivalRecords,
  fetchMarketRecords,
  fetchSchoolRecords,
  fetchNetworkRecords,
  fetchLutierRecords,
} from '../../../services/data/index.js';
import {
  ARCHIPELAGO_NORMALIZED_NAME,
  DEPARTMENT_HIT_AREA_STYLE,
  EMPTY_DEPARTMENT_SUMMARY,
  FESTIVAL_COUNTS_CACHE_KEY,
  MAP_LAYER_CHOROPLETH_STEPS,
  MARKET_COUNTS_CACHE_KEY,
  MARKET_PUBLICATION_POLICY,
  SCHOOL_COUNTS_CACHE_KEY,
  SCHOOL_PUBLICATION_POLICY,
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
  countDistinctValues,
  formatMetricValue,
  getBaseDepartmentCounts,
  getChoroplethStyles,
  getDepartmentDisplayName,
  getDepartmentSelectionValue,
  getFeatureDepartmentName,
  getFeatureDepartmentNormalizedName,
  getFestivalRecordName,
  getSortedDepartmentNames,
  normalizeDepartmentCode,
  normalizeDepartmentName,
  normalizeMunicipalityCode,
  resolveDepartmentNameFromRecord,
  setRuntimeDepartmentCatalog,
} from '../domain/mapDomain.js';
import {
  MapViewportResetter,
  MapZoomControls,
  MapZoomLimiter,
} from '../components/MapInteractionControls.jsx';
import { MAP_LAYERS_CONFIG, MAP_PANEL_IDS } from '../config/mapLayersConfig.js';
import {
  ECOSYSTEM_LAYERS,
  WORLD_COUNTRY_LABELS,
  countryLabelIcon,
} from '../domain/mapLayers.js';

const TOOLBAR_ITEMS = [
  { id: MAP_PANEL_IDS.layers, label: 'Capas', Icon: Layers3 },
  { id: MAP_PANEL_IDS.filters, label: 'Filtros', Icon: Filter },
  { id: MAP_PANEL_IDS.insights, label: 'Modos', Icon: Eye },
  { id: MAP_PANEL_IDS.registration, label: 'Registrar', Icon: Plus },
  { id: MAP_PANEL_IDS.export, label: 'Exportar', Icon: Download },
  { id: MAP_PANEL_IDS.tutorial, label: 'Ayuda', Icon: CircleHelp },
];

const LAYER_ACCENTS = {
  General: '#059669',
  Festivales: '#9333ea',
  'Escuelas de Música': '#0284c7',
  'Mercados Musicales': '#d97706',
  'Redes de Documentación': '#db2777',
  Lutieres: '#0d9488',
};

const SELECTED_DEPARTMENT_STYLE = {
  fillColor: '#00DA5E',
  fillOpacity: 0.86,
  color: 'rgba(41, 18, 66, 0.9)',
  opacity: 1,
  weight: 2.8,
};

const MUTED_DEPARTMENT_STYLE = {
  fillColor: '#d8d3df',
  fillOpacity: 0.48,
  color: 'rgba(41, 18, 66, 0.4)',
  opacity: 1,
  weight: 1.2,
};

const TERRITORIOS_SONOROS_LIST = [
  'Cantos, Pitos y Tambores',
  'Canta y Torbellino',
  'Rajaleña y Cucamba',
  'Marimba',
  'Flautas, Cuerdas y Tambores Sureños',
  'Chirimía',
  'Joropo',
  'Trova y Parranda',
  'Amazonas',
  'Insular',
  'Prácticas de Pueblos Indígenas',
  'Músicas Urbanas, Alternativas e Independientes - MUAI',
  'Comunidades Académicas',
  'Rrom'
];

const PRACTICAS_MUSICALES_LIST = [
  'Expresiones sonoras de pueblos originarios',
  'Músicas de comunidades negras, afrocolombianas, raizales y palenqueras',
  'Músicas campesinas, rurales y de raíz territorial',
  'Músicas populares tradicionales, regionales y patrimoniales',
  'Músicas comunitarias y procesos colectivos de práctica musical',
  'Músicas de frontera, diásporas, migraciones e interculturalidad',
  'Músicas urbanas, alternativas e independientes',
  'Músicas populares de amplia circulación, tropicales, bailables y comerciales',
  'Músicas vocales, corales y de tradición cantada',
  'Músicas sinfónicas, bandas, orquestas y grandes formatos instrumentales',
  'Bandas de marcha, batucadas, comparsas y colectivos sonoros en movimiento',
  'Músicas académicas, de cámara, contemporáneas, experimentales y de vanguardia',
  'Músicas electrónicas, digitales, producción sonora y nuevas tecnologías',
  'Músicas religiosas, rituales, espirituales y devocionales',
  'Músicas para escena, danza, audiovisual e interdisciplinariedad',
  'Prácticas sonoras, arte sonoro, archivo, investigación-creación y paisajes sonoros'
];

const TERRITORIO_MAPPING = {
  'Cantos, Pitos y Tambores': { depts: [], color: '#bae6fd' },
  'Canta y Torbellino': { depts: [], color: '#ddd6fe' },
  'Rajaleña y Cucamba': { depts: [], color: '#fef08a' },
  'Marimba': { depts: [], color: '#d8b4fe' },
  'Flautas, Cuerdas y Tambores Sureños': { depts: [], color: '#c5f2f5' },
  'Chirimía': { depts: [], color: '#a5f3fc' },
  'Joropo': { depts: [], color: '#fde68a' },
  'Trova y Parranda': { depts: [], color: '#fed7aa' },
  'Amazonas': { depts: [], color: '#bbf7d0' },
  'Insular': { depts: [], color: '#fed7aa' },
  'Prácticas de Pueblos Indígenas': { depts: [], color: '#a7f3d0' },
  'Músicas Urbanas, Alternativas e Independientes - MUAI': { depts: [], color: '#cbd5e1' },
  'Comunidades Académicas': { depts: [], color: '#cbd5e1' },
  'Rrom': { depts: [], color: '#fbcfe8' }
};

const PRACTICA_MAPPING = {
  'Expresiones sonoras de pueblos originarios': { depts: [], color: '#a7f3d0' },
  'Músicas de comunidades negras, afrocolombianas, raizales y palenqueras': { depts: [], color: '#d8b4fe' },
  'Músicas campesinas, rurales y de raíz territorial': { depts: [], color: '#fed7aa' },
  'Músicas populares tradicionales, regionales y patrimoniales': { depts: [], color: '#bae6fd' },
  'Músicas comunitarias y procesos colectivos de práctica musical': { depts: [], color: '#fde68a' },
  'Músicas de frontera, diásporas, migraciones e interculturalidad': { depts: [], color: '#c5f2f5' },
  'Músicas urbanas, alternativas e independientes': { depts: [], color: '#cbd5e1' },
  'Músicas populares de amplia circulación, tropicales, bailables y comerciales': { depts: [], color: '#fef08a' },
  'Músicas vocales, corales y de tradición cantada': { depts: [], color: '#bae6fd' },
  'Músicas sinfónicas, bandas, orquestas y grandes formatos instrumentales': { depts: [], color: '#ddd6fe' },
  'Bandas de marcha, batucadas, comparsas y colectivos sonoros en movimiento': { depts: [], color: '#fbcfe8' },
  'Músicas académicas, de cámara, contemporáneas, experimentales y de vanguardia': { depts: [], color: '#cbd5e1' },
  'Músicas electrónicas, digitales, producción sonora y nuevas tecnologías': { depts: [], color: '#a5f3fc' },
  'Músicas religiosas, rituales, espirituales y devocionales': { depts: [], color: '#fbcfe8' },
  'Músicas para escena, danza, audiovisual e interdisciplinariedad': { depts: [], color: '#fde68a' },
  'Prácticas sonoras, arte sonoro, archivo, investigación-creación y paisajes sonoros': { depts: [], color: '#fbcfe8' }
};

const COLOMBIA_DEPARTMENT_CENTROIDS = {
  'antioquia': [6.2442, -75.5812],
  'atlantico': [10.9685, -74.7813],
  'bogota': [4.6097, -74.0817],
  'bolivar': [10.3910, -75.4794],
  'caldas': [5.0689, -75.5174],
  'cauca': [2.4419, -76.6063],
  'cesar': [10.4631, -73.2532],
  'choco': [5.6983, -76.6583],
  'la guajira': [11.5444, -72.9069],
  'meta': [4.1420, -73.6266],
  'narino': [1.2136, -77.2811],
  'valle del cauca': [3.4516, -76.5320],
  'arauca': [7.0903, -70.7616],
  'casanare': [5.3378, -72.3959],
  'cundinamarca': [4.7110, -73.8000],
  'guaviare': [2.5667, -72.6333],
  'huila': [2.5333, -75.6000],
  'norte de santander': [7.9000, -72.5000],
  'putumayo': [1.1500, -76.6500],
  'quindio': [4.5333, -75.6667],
  'risaralda': [5.0689, -75.8000],
  'santander': [7.1254, -73.1198],
  'sucre': [9.3000, -75.4000],
  'tolima': [4.1667, -75.1667],
  'vaupes': [1.2500, -70.5000],
  'vichada': [6.1833, -69.2167],
  'amazonas': [-1.0191, -71.9385],
  'caqueta': [1.6144, -75.6062],
  'guainia': [2.5000, -68.5000],
  'magdalena': [10.4000, -74.2000],
  'san andres': [12.5847, -81.7006],
  'cordoba': [8.7500, -75.8833],
  'boyaca': [5.5500, -73.0000]
};

const cleanTextForMatching = (str) => {
  if (!str) return '';
  return str
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim();
};

const matchesSonorousTerritory = (selectedTerritory, textToCheck) => {
  if (!selectedTerritory || selectedTerritory === 'Todos') return true;
  const selClean = cleanTextForMatching(selectedTerritory);
  const textClean = cleanTextForMatching(textToCheck);
  
  if (textClean.includes(selClean)) return true;

  const keywordsMap = {
    'Cantos, Pitos y Tambores': ['cantos', 'pitos', 'tambores', 'cumbia', 'gaita', 'caribe'],
    'Canta y Torbellino': ['canta', 'torbellino', 'guabina', 'pasillo', 'andina'],
    'Rajaleña y Cucamba': ['rajalena', 'cucamba', 'huila', 'sampedro', 'bambuco'],
    'Marimba': ['marimba', 'currulao', 'pacifico', 'sur', 'cantos tradicionales'],
    'Flautas, Cuerdas y Tambores Sureños': ['flautas', 'cuerdas', 'tambores', 'surenos', 'sur', 'narino'],
    'Chirimía': ['chirimia', 'choco', 'pacifico norte'],
    'Joropo': ['joropo', 'arpa', 'cuatro', 'maracas', 'llano', 'llanera', 'llanero'],
    'Trova y Parranda': ['trova', 'parranda', 'paisa', 'antioquia'],
    'Amazonas': ['amazonas', 'amazonico', 'indigena'],
    'Insular': ['insular', 'san andres', 'reggae', 'calipso', 'providencia'],
    'Prácticas de Pueblos Indígenas': ['indigena', 'indigenas', 'pueblos originarios', 'nasa', 'wayuu'],
    'Músicas Urbanas, Alternativas e Independientes - MUAI': ['urbana', 'urbanas', 'alternativa', 'independiente', 'muai', 'rock', 'hip hop', 'pop', 'rap'],
    'Comunidades Académicas': ['academica', 'academicas', 'universidad', 'conservatorio'],
    'Rrom': ['rrom', 'gitano', 'gitanos']
  };

  const keywords = keywordsMap[selectedTerritory];
  if (!keywords) return false;
  
  return keywords.some(keyword => textClean.includes(cleanTextForMatching(keyword)));
};

const matchesPracticeMusical = (selectedPractice, textToCheck) => {
  if (!selectedPractice || selectedPractice === 'Todas') return true;
  const selClean = cleanTextForMatching(selectedPractice);
  const textClean = cleanTextForMatching(textToCheck);
  
  if (textClean.includes(selClean)) return true;

  const keywordsMap = {
    'Expresiones sonoras de pueblos originarios': ['originarios', 'pueblos', 'indigena', 'indigenas'],
    'Músicas de comunidades negras, afrocolombianas, raizales y palenqueras': ['negras', 'afrocolombianas', 'raizales', 'palenqueras', 'afro', 'raizal', 'palenque'],
    'Músicas campesinas, rurales y de raíz territorial': ['campesina', 'campesino', 'rural', 'carranga', 'carranguera'],
    'Músicas populares tradicionales, regionales y patrimoniales': ['tradicional', 'regional', 'patrimonial', 'tradicionales', 'regionales'],
    'Músicas comunitarias y procesos colectivos de práctica musical': ['comunitaria', 'comunitario', 'colectivo', 'social'],
    'Músicas de frontera, diásporas, migraciones e interculturalidad': ['frontera', 'diaspora', 'migracion', 'intercultural'],
    'Músicas urbanas, alternativas e independientes': ['urbana', 'alternativa', 'independiente', 'rock', 'pop', 'hip hop'],
    'Músicas populares de amplia circulación, tropicales, bailables y comerciales': ['popular', 'tropical', 'bailable', 'comercial', 'salsa', 'merengue'],
    'Músicas vocales, corales y de tradición cantada': ['vocal', 'coral', 'coro', 'canto', 'cantada'],
    'Músicas sinfónicas, bandas, orquestas y grandes formatos instrumentales': ['sinfonica', 'banda', 'orquesta', 'formato'],
    'Bandas de marcha, batucadas, comparsas y colectivos sonoros en movimiento': ['marcha', 'batucada', 'comparsa', 'movimiento'],
    'Músicas académicas, de cámara, contemporáneas, experimentales y de vanguardia': ['academica', 'camara', 'contemporanea', 'experimental', 'vanguardia'],
    'Músicas electrónicas, digitales, producción sonora y nuevas tecnologías': ['electronica', 'digital', 'produccion', 'tecnologia'],
    'Músicas religiosas, rituales, espirituales y devocionales': ['religiosa', 'ritual', 'espiritual', 'devocional', 'sacra'],
    'Músicas para escena, danza, audiovisual e interdisciplinariedad': ['escena', 'danza', 'audiovisual', 'interdisciplinar'],
    'Prácticas sonoras, arte sonoro, archivo, investigación-creación y paisajes sonoros': ['arte sonoro', 'archivo', 'investigacion', 'creacion', 'paisaje']
  };

  const keywords = keywordsMap[selectedPractice];
  if (!keywords) return false;

  return keywords.some(keyword => textClean.includes(cleanTextForMatching(keyword)));
};

const MapEdgeToolbar = ({ activePanel, onTogglePanel, onPrint }) => (
  <div className="absolute right-6 top-6 z-[1200] flex flex-col gap-2">
    <div className="rounded-3xl border border-slate-200 bg-white/95 p-2 shadow-xl backdrop-blur-sm">
      <div className="flex flex-col gap-1.5">
        {TOOLBAR_ITEMS.map(({ id, label, Icon: IconComponent }) => {
          const isActive = activePanel === id;
          const isRegistration = id === MAP_PANEL_IDS.registration;

          return (
            <button
              key={id}
              type="button"
              onClick={() => onTogglePanel(id)}
              className={`group relative flex h-11 w-11 items-center justify-center rounded-xl border transition-all ${
                isActive
                  ? 'border-[#291242] bg-[#291242] text-white shadow-md'
                  : isRegistration
                  ? 'border-emerald-200 bg-emerald-50 text-emerald-600 hover:border-emerald-300 hover:bg-emerald-100 hover:text-emerald-700 shadow-[0_0_10px_rgba(16,185,129,0.1)]'
                  : 'border-transparent bg-white text-slate-600 hover:border-slate-200 hover:bg-slate-50 hover:text-[#291242]'
              }`}
              title={label}
              aria-label={label}
            >
              {React.createElement(IconComponent, { size: 17 })}
              
              {/* Pulsing indicator for registration to invite clicks */}
              {isRegistration && !isActive && (
                <span className="absolute -right-0.5 -top-0.5 flex h-2.5 w-2.5">
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75"></span>
                  <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-emerald-500"></span>
                </span>
              )}

              <span className="pointer-events-none absolute right-[calc(100%+10px)] hidden whitespace-nowrap rounded-lg border border-slate-200 bg-white px-2 py-1 text-[0.52rem] font-bold uppercase tracking-[0.12em] text-slate-500 shadow-sm group-hover:block">
                {label}
              </span>
            </button>
          );
        })}

        <button
          type="button"
          onClick={onPrint}
          className="group relative flex h-11 w-11 items-center justify-center rounded-xl border border-transparent bg-white text-slate-600 transition-all hover:border-slate-200 hover:bg-slate-50 hover:text-[#291242]"
          title="Imprimir"
          aria-label="Imprimir"
        >
          <Printer size={17} />
          <span className="pointer-events-none absolute right-[calc(100%+10px)] hidden whitespace-nowrap rounded-lg border border-slate-200 bg-white px-2 py-1 text-[0.52rem] font-bold uppercase tracking-[0.12em] text-slate-500 shadow-sm group-hover:block">
            Imprimir
          </span>
        </button>
      </div>
    </div>

    {activePanel ? (
      <button
        type="button"
        onClick={() => onTogglePanel(activePanel)}
        className="mx-auto flex h-8 w-8 items-center justify-center rounded-full border border-slate-200 bg-white/95 text-slate-500 shadow-md backdrop-blur-sm hover:text-[#291242]"
        title="Cerrar panel"
        aria-label="Cerrar panel"
      >
        <X size={14} />
      </button>
    ) : null}
  </div>
);

const MapEdgeOverlayPanel = ({ title, subtitle, children, onClose }) => (
  <section className="animate-in fade-in slide-in-from-right-4 duration-200 absolute right-[86px] top-6 z-[1190] w-80 overflow-hidden rounded-3xl border border-slate-200 bg-white/95 shadow-[0_22px_52px_rgba(15,23,42,0.18)] backdrop-blur-sm">
    <header className="flex items-start justify-between gap-4 border-b border-slate-100 px-5 py-4">
      <div>
        <p className="text-[0.5rem] font-bold uppercase tracking-[0.16em] text-slate-400">Geovisor</p>
        <h3 className="mt-2 font-alternate text-[0.98rem] font-bold uppercase leading-none text-[#291242]">{title}</h3>
        {subtitle ? <p className="mt-1.5 text-[0.62rem] leading-relaxed text-slate-500">{subtitle}</p> : null}
      </div>
      <button
        type="button"
        onClick={onClose}
        className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-500 hover:text-[#291242]"
        aria-label="Cerrar panel"
      >
        <X size={14} />
      </button>
    </header>
    <div className="max-h-[calc(100vh-180px)] overflow-y-auto px-5 py-4 custom-scrollbar">
      {children}
    </div>
  </section>
);

const DataCard = ({ label, value, note }) => (
  <article className="rounded-xl border border-slate-200/80 bg-white px-3 py-3 shadow-sm">
    <p className="text-[9px] font-bold uppercase tracking-widest text-slate-400">{label}</p>
    <p className="mt-1 text-xl font-extrabold leading-none text-[#291242]">{formatMetricValue(value)}</p>
    {note ? <p className="mt-1.5 text-[11px] leading-relaxed text-slate-500">{note}</p> : null}
  </article>
);

const formatRecordDetailValue = (value) => {
  if (value === undefined || value === null || value === '') return 'Sin dato';
  if (React.isValidElement(value)) return value;
  if (typeof value === 'number') return formatMetricValue(value);
  return String(value);
};

const RecordCard = ({ eyebrow, title, meta, onClick }) => (
  <button
    type="button"
    onClick={onClick}
    className="block w-full rounded-xl border border-slate-200/80 bg-white px-3 py-3 text-left shadow-sm transition-all hover:-translate-y-0.5 hover:border-[#291242]/30 hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#00DA5E]"
  >
    <p className="text-[9px] font-bold uppercase tracking-widest text-slate-400">{eyebrow}</p>
    <h4 className="mt-1 text-[12px] font-bold leading-snug text-[#291242]">{title || 'Sin nombre visible'}</h4>
    {meta ? <p className="mt-1 text-[11px] leading-relaxed text-slate-500">{meta}</p> : null}
    <p className="mt-2 text-[9px] font-bold uppercase tracking-widest text-slate-400">Ver detalle</p>
  </button>
);



const buildPublicNetworkRecord = (r) => {
  if (!r) return null;
  const fields = r.fields || {};
  return {
    id: String(r.id || ''),
    type: 'Redes de Documentación',
    name: fields.name || 'Red sin nombre',
    centerType: fields.centerType || '',
    municipio: fields.municipio || '',
    municipality: fields.municipio || '',
    departamento: fields.departamento || '',
    department: fields.departamento || '',
    departmentCode: fields.deptCode || '',
    linkedSonorousTerritories: fields['Territorios sonoros'] || '',
    practices: fields['Prácticas musicales'] || '',
    description: fields.descripcion || fields.desc || '',
    contact: fields.contact || '',
    websiteUrl: fields.sitio_web || '',
    lat: fields.latitud || (4.5 + (Math.random() * 5 - 2.5)),
    lng: fields.longitud || (-74.0 + (Math.random() * 5 - 2.5)),
  };
};

const buildPublicLutierRecord = (r) => {
  if (!r) return null;
  const fields = r.fields || {};
  return {
    id: String(r.id || ''),
    type: 'Lutieres',
    name: fields.name || 'Lutier sin nombre',
    oficio: fields.oficio || '',
    municipio: fields.municipio || '',
    municipality: fields.municipio || '',
    departamento: fields.departamento || '',
    department: fields.departamento || '',
    departmentCode: fields.deptCode || '',
    linkedSonorousTerritories: fields['Territorios sonoros'] || '',
    practices: fields['Prácticas musicales'] || '',
    description: fields.descripcion || fields.desc || '',
    contact: fields.contact || '',
    websiteUrl: fields.sitio_web || '',
    lat: fields.latitud || (4.5 + (Math.random() * 5 - 2.5)),
    lng: fields.longitud || (-74.0 + (Math.random() * 5 - 2.5)),
  };
};


const buildSimpleCounts = (records) => {
  return records.reduce((acc, record) => {
    const normalized = normalizeDepartmentName(record.department);
    if (normalized) {
      acc[normalized] = (acc[normalized] || 0) + 1;
    }
    return acc;
  }, {});
};

const TUTORIAL_STEPS = [
  {
    title: "Bienvenido al Geovisor Ecosistémico",
    description: "Este recorrido interactivo te guiará paso a paso para que explores los procesos, infraestructuras y la influencia cultural de la música en Colombia de manera profesional.",
    Icon: Globe
  },
  {
    title: "1. Capas y Registros de Procesos",
    description: "Usa este panel para encender y apagar las capas del ecosistema: Festivales, Escuelas de Música, Mercados, Lutieres y Redes de Documentación.",
    Icon: Layers3
  },
  {
    title: "2. Filtros de Influencia Regional",
    description: "Refina la visualización en el mapa seleccionando prácticas musicales específicas o territorios sonoros (como la Marimba o los Cantos de comunidades negras).",
    Icon: Filter
  },
  {
    title: "3. Modo Cobertura (Densidad)",
    description: "Este modo tiñe los departamentos según la cantidad total de procesos registrados, dándote una lectura rápida y comparativa de la densidad nacional de la capa activa.",
    Icon: BarChart3
  },
  {
    title: "4. Modo Influencia (Puntos y Zonas)",
    description: "Proyecta en el mapa las zonas de influencia directa de las prácticas seleccionadas. Verás círculos en los municipios y departamentos coloreados por predominancia.",
    Icon: MapPin
  },
  {
    title: "5. Visualización: Mapa de Calor",
    description: "El Mapa de Calor proyecta hermosos halos concéntricos desenfocados que se fusionan en tiempo real para reflejar el flujo y la fuerza de la música colombiana.",
    Icon: Eye
  },
  {
    title: "6. Resumen y Registros Recientes",
    description: "En el panel derecho puedes alternar entre las pestañas 'Resumen' para ver estadísticas agregadas y 'Registros Recientes' para explorar la lista de procesos locales.",
    Icon: CircleHelp
  }
];

const MapInteractionManager = ({
  selectedDept,
  geoData,
  initialBounds,
  resetToken,
  visualizationMode,
  influenceDisplayType,
  activeCategory,
}) => {
  const map = useMap();

  const lastZoomedDeptRef = useRef(null);

  // 1. Zoom to selected department bounds
  useEffect(() => {
    if (!selectedDept || !geoData) return;
    if (selectedDept === 'Nacional') {
      lastZoomedDeptRef.current = 'Nacional';
      return;
    }

    if (lastZoomedDeptRef.current === selectedDept) {
      return;
    }

    const normalized = normalizeDepartmentName(selectedDept);
    const feature = geoData.features.find(
      (f) => getFeatureDepartmentNormalizedName(f) === normalized
    );

    if (feature) {
      lastZoomedDeptRef.current = selectedDept;
      const tempLayer = L.geoJSON(feature);
      const bounds = tempLayer.getBounds();
      map.fitBounds(bounds, {
        animate: true,
        duration: 0.55,
        padding: [30, 30],
      });

      // Force Leaflet tile refresh after zoom completes
      const timer = setTimeout(() => {
        map.invalidateSize();
      }, 600);

      return () => clearTimeout(timer);
    }
  }, [map, selectedDept, geoData]);

  // 2. Zoom to national view initial bounds on resetToken change
  useEffect(() => {
    if (!initialBounds) return;

    map.fitBounds(initialBounds, {
      paddingTopLeft: [28, 20],
      paddingBottomRight: [0, 0],
      animate: true,
      duration: 0.55,
    });

    // Force Leaflet tile refresh after zoom completes
    const timer = setTimeout(() => {
      map.invalidateSize();
    }, 600);

    return () => clearTimeout(timer);
  }, [map, initialBounds, resetToken]);

  // 3. Force invalidation on mode/category changes to prevent grey tile glitches
  useEffect(() => {
    const timer = setTimeout(() => {
      map.invalidateSize();
    }, 350);
    return () => clearTimeout(timer);
  }, [map, visualizationMode, influenceDisplayType, activeCategory]);

  return null;
};

const MapaRegistrationCallout = ({ onRegister }) => (
  <div className="absolute bottom-[8.2rem] right-6 z-[1001] w-[20rem] rounded-[1.4rem] border border-slate-200 bg-white/96 p-4 shadow-xl backdrop-blur-sm">
    <div className="flex items-start gap-3">
      <div className="mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-600">
        <Mail size={18} />
      </div>
      <div className="min-w-0">
        <p className="text-[0.6rem] font-black uppercase tracking-[0.18em] text-slate-500">Registra tus procesos</p>
        <p className="mt-1 text-[0.78rem] leading-relaxed text-slate-600">
          Inscribe festivales, mercados, escuelas, redes, lutieres y otros procesos para aparecer en este mapeo ecosistémico.
        </p>
      </div>
    </div>
    <button
      type="button"
      onClick={onRegister}
      className="mt-4 flex w-full items-center justify-center gap-2 rounded-[1rem] bg-[#291242] px-4 py-3 text-[0.68rem] font-bold uppercase tracking-[0.16em] text-white transition hover:bg-[#3b1a61]"
    >
      Registrar procesos
      <ArrowRight size={14} />
    </button>
  </div>
);

const MapaEcosistemicoPage = ({ navigationRequest, onOpenParticipation }) => {
  const [activeCategory, setActiveCategory] = useState('General');
  const [activePanel, setActivePanel] = useState(null);
  const [sidebarTab, setSidebarTab] = useState('resumen');
  const [directoryCategory, setDirectoryCategory] = useState('Todos');
  const [directoryQuery, setDirectoryQuery] = useState('');
  const [directoryLimit, setDirectoryLimit] = useState(12);
  const [selectedDept, setSelectedDept] = useState('Nacional');
  const [hoveredDepartmentCard, setHoveredDepartmentCard] = useState(null);
  const [selectedRecordDetail, setSelectedRecordDetail] = useState(null);
  const [geoData, setGeoData] = useState(null);
  const [festivalCounts, setFestivalCounts] = useState({});
  const [festivalRecords, setFestivalRecords] = useState([]);
  const [schoolCounts, setSchoolCounts] = useState({});
  const [schoolRecords, setSchoolRecords] = useState([]);
  const [marketCounts, setMarketCounts] = useState({});
  const [marketRecords, setMarketRecords] = useState([]);
  const [redesCounts, setRedesCounts] = useState({});
  const [redesRecords, setRedesRecords] = useState([]);
  const [lutieresCounts, setLutieresCounts] = useState({});
  const [lutieresRecords, setLutieresRecords] = useState([]);
  const [schoolLayerReady, setSchoolLayerReady] = useState(false);
  const [marketLayerReady, setMarketLayerReady] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [mapError, setMapError] = useState(null);
  const [mapResetToken, setMapResetToken] = useState(0);
  const [selectedSonorousTerritory, setSelectedSonorousTerritory] = useState('Todos');
  const [selectedPractice, setSelectedPractice] = useState('Todas');
  const [visualizationMode, setVisualizationMode] = useState('cobertura');
  const [activeThematicOption, setActiveThematicOption] = useState('territorio');
  const [influenceDisplayType, setInfluenceDisplayType] = useState('puntos'); // 'puntos' | 'calor'
  const [isTutorialOpen, setIsTutorialOpen] = useState(false);
  const [tutorialStep, setTutorialStep] = useState(0);
  const geoJsonRef = useRef(null);
  const allMunicipalitiesRef = useRef([]);
  const [currentDeptMunicipalities, setCurrentDeptMunicipalities] = useState(null);

  useEffect(() => {
    setDirectoryLimit(12);
  }, [directoryCategory, directoryQuery, selectedDept]);
  // Native SVG renderer is used for perfect pixel-sharp borders and zero-leak event handling.

  const baseDepartmentCounts = useMemo(() => getBaseDepartmentCounts(), []);
  const departmentsList = useMemo(() => ['Nacional', ...getSortedDepartmentNames()], []);
  const activeLayerConfig = useMemo(
    () => MAP_LAYERS_CONFIG.find((layer) => layer.layerKey === activeCategory) || MAP_LAYERS_CONFIG[0],
    [activeCategory]
  );

  const isGeneralLayer = activeCategory === 'General';
  const isFestivalsLayer = activeCategory === 'Festivales';
  const isSchoolsLayer = activeCategory === 'Escuelas de Música';
  const isMarketsLayer = activeCategory === 'Mercados Musicales';
  const isRedesLayer = activeCategory === 'Redes de Documentación';
  const isLutieresLayer = activeCategory === 'Lutieres';
  const selectedNormalized = normalizeDepartmentName(selectedDept);
  const selectedDepartmentDisplayName = selectedDept === 'Nacional' ? 'Nacional' : getDepartmentDisplayName(selectedDept);

  const festivalRecordsByDepartment = useMemo(() => {
    return festivalRecords.reduce((acc, record) => {
      const deptRaw = record?.fields?.dpt ?? record?.fields?.dpto ?? record?.fields?.departamento ?? record?.fields?.department;
      const deptName = Array.isArray(deptRaw) ? deptRaw[0] : (deptRaw || 'Desconocido');
      const normalized = normalizeDepartmentName(resolveDepartmentNameFromRecord(record, deptName));
      if (!normalized || normalized === 'DESCONOCIDO') return acc;

      const genre = record?.fields?.género_musical || record?.fields?.genero_musical || '';
      const desc = record?.fields?.descripción || record?.fields?.descripcion || record?.fields?.desc || '';

      // Apply Filters
      if (selectedSonorousTerritory !== 'Todos') {
        const textToCheck = `${genre} ${desc}`;
        if (!matchesSonorousTerritory(selectedSonorousTerritory, textToCheck)) return acc;
      }
      if (selectedPractice !== 'Todas') {
        const textToCheck = `${genre} ${desc}`;
        if (!matchesPracticeMusical(selectedPractice, textToCheck)) return acc;
      }

      if (!acc[normalized]) acc[normalized] = [];
      acc[normalized].push({
        department: resolveDepartmentNameFromRecord(record, deptName),
        departmentCode: normalizeDepartmentCode(record?.fields?.departmentCode || record?.fields?.DepartmentCode || record?.fields?.dpto_ccdgo),
        municipalityCode: normalizeMunicipalityCode(record?.fields?.municipalityCode || record?.fields?.divipola || record?.fields?.mpio_cdpmp),
        name: getFestivalRecordName(record),
        municipality: record?.fields?.municipio || '',
        description: desc,
        genre: genre,
        month: record?.fields?.mes_de_realización || record?.fields?.mes_de_realizacion || '',
        versions: record?.fields?.versiones || '',
        organizer: record?.fields?.organizador || record?.fields?.organizer || record?.fields?.responsable || record?.fields?.entidad_responsable || '',
        contactEmail: record?.fields?.contacto_email || record?.fields?.email || '',
        contactPhone: record?.fields?.contacto_telefono || record?.fields?.telefono || '',
        websiteUrl: record?.fields?.sitio_web || '',
        coverageLevel: record?.fields?.coverageLevel || record?.fields?.cobertura_nivel || '',
        specificLocation: record?.fields?.ubicacion_especifica || '',
        contact: [record?.fields?.contacto_email || record?.fields?.email || '', record?.fields?.contacto_telefono || record?.fields?.telefono || ''].filter(Boolean).join(' · '),
      });
      return acc;
    }, {});
  }, [festivalRecords, selectedSonorousTerritory, selectedPractice]);

  const schoolRecordsByDepartment = useMemo(() => (
    schoolRecords.reduce((acc, record) => {
      const normalized = normalizeDepartmentName(record?.department);
      if (!normalized || normalized === 'DESCONOCIDO') return acc;

      const sonorous = record?.linkedSonorousTerritories || '';
      const practices = record?.practices || '';
      const desc = record?.description || '';

      // Apply Filters
      if (selectedSonorousTerritory !== 'Todos') {
        const textToCheck = `${sonorous} ${practices} ${desc}`;
        if (!matchesSonorousTerritory(selectedSonorousTerritory, textToCheck)) return acc;
      }
      if (selectedPractice !== 'Todas') {
        const textToCheck = `${practices} ${desc}`;
        if (!matchesPracticeMusical(selectedPractice, textToCheck)) return acc;
      }

      if (!acc[normalized]) acc[normalized] = [];
      acc[normalized].push(record);
      return acc;
    }, {})
  ), [schoolRecords, selectedSonorousTerritory, selectedPractice]);

  const marketRecordsByDepartment = useMemo(() => (
    marketRecords.reduce((acc, record) => {
      const normalized = normalizeDepartmentName(record?.department);
      if (!normalized || normalized === 'DESCONOCIDO') return acc;

      const desc = record?.description || '';
      const linked = record?.linkedFestival || '';

      // Apply Filters
      if (selectedSonorousTerritory !== 'Todos') {
        const textToCheck = `${desc} ${linked}`;
        if (!matchesSonorousTerritory(selectedSonorousTerritory, textToCheck)) return acc;
      }
      if (selectedPractice !== 'Todas') {
        const textToCheck = `${desc}`;
        if (!matchesPracticeMusical(selectedPractice, textToCheck)) return acc;
      }

      if (!acc[normalized]) acc[normalized] = [];
      acc[normalized].push(record);
      return acc;
    }, {})
  ), [marketRecords, selectedSonorousTerritory, selectedPractice]);

  const redesRecordsByDepartment = useMemo(() => (
    redesRecords.reduce((acc, record) => {
      const normalized = normalizeDepartmentName(record?.department);
      if (!normalized || normalized === 'DESCONOCIDO') return acc;

      const sonorous = record?.linkedSonorousTerritories || '';
      const desc = record?.description || '';

      // Apply Filters
      if (selectedSonorousTerritory !== 'Todos') {
        const textToCheck = `${sonorous} ${desc}`;
        if (!matchesSonorousTerritory(selectedSonorousTerritory, textToCheck)) return acc;
      }
      if (selectedPractice !== 'Todas') {
        const textToCheck = `${desc} ${record.centerType}`;
        if (!matchesPracticeMusical(selectedPractice, textToCheck)) return acc;
      }

      if (!acc[normalized]) acc[normalized] = [];
      acc[normalized].push(record);
      return acc;
    }, {})
  ), [redesRecords, selectedSonorousTerritory, selectedPractice]);

  const lutieresRecordsByDepartment = useMemo(() => (
    lutieresRecords.reduce((acc, record) => {
      const normalized = normalizeDepartmentName(record?.department);
      if (!normalized || normalized === 'DESCONOCIDO') return acc;

      const oficio = record?.oficio || '';
      const desc = record?.description || '';

      // Apply Filters
      if (selectedSonorousTerritory !== 'Todos') {
        const textToCheck = `${oficio} ${desc}`;
        if (!matchesSonorousTerritory(selectedSonorousTerritory, textToCheck)) return acc;
      }
      if (selectedPractice !== 'Todas') {
        const textToCheck = `${oficio} ${desc}`;
        if (!matchesPracticeMusical(selectedPractice, textToCheck)) return acc;
      }

      if (!acc[normalized]) acc[normalized] = [];
      acc[normalized].push(record);
      return acc;
    }, {})
  ), [lutieresRecords, selectedSonorousTerritory, selectedPractice]);

  const departmentSummaryByDepartment = useMemo(
    () => buildDepartmentSummaryMap(
      baseDepartmentCounts,
      festivalRecordsByDepartment,
      schoolRecordsByDepartment,
      marketRecordsByDepartment,
      redesRecordsByDepartment,
      lutieresRecordsByDepartment
    ),
    [
      baseDepartmentCounts,
      festivalRecordsByDepartment,
      schoolRecordsByDepartment,
      marketRecordsByDepartment,
      redesRecordsByDepartment,
      lutieresRecordsByDepartment
    ]
  );
  const generalCounts = useMemo(() => (
    Object.entries(departmentSummaryByDepartment).reduce((acc, [departmentName, stats]) => {
      acc[departmentName] = stats.totalRecords;
      return acc;
    }, {})
  ), [departmentSummaryByDepartment]);

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
  const redesAnalytics = useMemo(
    () => buildLayerAnalytics(redesCounts, redesRecords, selectedDept),
    [redesCounts, redesRecords, selectedDept]
  );
  const lutieresAnalytics = useMemo(
    () => buildLayerAnalytics(lutieresCounts, lutieresRecords, selectedDept),
    [lutieresCounts, lutieresRecords, selectedDept]
  );
  const generalAnalytics = useMemo(
    () => buildLayerAnalytics(generalCounts, [], selectedDept),
    [generalCounts, selectedDept]
  );
  const activeAnalytics = isGeneralLayer
    ? generalAnalytics
    : isSchoolsLayer
    ? schoolAnalytics
    : isMarketsLayer
    ? marketAnalytics
    : isRedesLayer
    ? redesAnalytics
    : isLutieresLayer
    ? lutieresAnalytics
    : festivalAnalytics;
  const activeDepartmentCounts = useMemo(() => (
    isGeneralLayer
      ? generalCounts
      : isSchoolsLayer
      ? schoolCounts
      : isMarketsLayer
      ? marketCounts
      : isRedesLayer
      ? redesCounts
      : isLutieresLayer
      ? lutieresCounts
      : festivalCounts
  ), [festivalCounts, generalCounts, isGeneralLayer, isMarketsLayer, isSchoolsLayer, isRedesLayer, redesCounts, isLutieresLayer, lutieresCounts, marketCounts, schoolCounts]);
  const thematicPoints = useMemo(() => {
    const points = [];
    
    // Scan all loaded records from all 5 categories
    const allRecords = [
      ...festivalRecords.map(r => {
        const deptRaw = r?.fields?.dpt ?? r?.fields?.dpto ?? r?.fields?.departamento ?? r?.fields?.department;
        const deptName = Array.isArray(deptRaw) ? deptRaw[0] : (deptRaw || 'Desconocido');
        return {
          ...r,
          id: r.id || `fest-${Math.random()}`,
          category: 'Festivales',
          name: r.fields?.name || r.fields?.nombre || 'Festival',
          department: resolveDepartmentNameFromRecord(r, deptName),
          description: r.fields?.descripción || r.fields?.descripcion || r.fields?.desc || '',
          linkedSonorousTerritories: r.fields?.['Territorios sonoros'] || r.fields?.género_musical || r.fields?.genero_musical || '',
          practices: r.fields?.['Prácticas musicales'] || r.fields?.género_musical || r.fields?.genero_musical || ''
        };
      }),
      ...schoolRecords.map(r => {
        return {
          ...r,
          id: r.id || `school-${Math.random()}`,
          category: 'Escuelas de Música',
          name: r.name || 'Escuela',
          department: r.department || 'Desconocido',
          description: r.description || '',
          linkedSonorousTerritories: r.linkedSonorousTerritories || '',
          practices: r.practices || ''
        };
      }),
      ...marketRecords.map(r => {
        return {
          ...r,
          id: r.id || `market-${Math.random()}`,
          category: 'Mercados Musicales',
          name: r.name || 'Mercado',
          department: r.department || 'Desconocido',
          description: r.description || '',
          linkedSonorousTerritories: r.linkedSonorousTerritories || '',
          practices: r.practices || ''
        };
      }),
      ...redesRecords.map(r => {
        return {
          ...r,
          id: r.id || `net-${Math.random()}`,
          category: 'Redes de Documentación',
          name: r.name || 'Red',
          department: r.department || 'Desconocido',
          description: r.description || '',
          linkedSonorousTerritories: r.linkedSonorousTerritories || '',
          practices: r.practices || ''
        };
      }),
      ...lutieresRecords.map(r => {
        return {
          ...r,
          id: r.id || `lut-${Math.random()}`,
          category: 'Lutieres',
          name: r.name || 'Lutier',
          department: r.department || 'Desconocido',
          description: r.description || '',
          linkedSonorousTerritories: r.linkedSonorousTerritories || '',
          practices: r.practices || ''
        };
      })
    ];

    allRecords.forEach((record, index) => {
      const normalized = normalizeDepartmentName(record.department);
      if (!normalized || normalized === 'DESCONOCIDO') return;

      let centroid = COLOMBIA_DEPARTMENT_CENTROIDS[normalized.toLowerCase()];
      if (!centroid && normalized.includes('SAN ANDRES')) {
        centroid = COLOMBIA_DEPARTMENT_CENTROIDS['san andres'];
      }
      if (!centroid) return;

      // Extract Sonorous Territory
      const sonorous = record.linkedSonorousTerritories || '';
      const desc = record.description || '';
      const practices = record.practices || '';

      let matchColor = null;
      let matchLabel = null;

      if (activeThematicOption === 'territorio') {
        let match = null;
        if (selectedSonorousTerritory !== 'Todos') {
          if (matchesSonorousTerritory(selectedSonorousTerritory, `${sonorous} ${desc}`)) {
            match = selectedSonorousTerritory;
          }
        } else {
          match = TERRITORIOS_SONOROS_LIST.find(t => 
            matchesSonorousTerritory(t, `${sonorous} ${desc}`)
          );
        }
        
        if (match) {
          matchColor = TERRITORIO_MAPPING[match]?.color || '#cbd5e1';
          matchLabel = match;
        }
      } else {
        let match = null;
        if (selectedPractice !== 'Todas') {
          if (matchesPracticeMusical(selectedPractice, `${practices} ${desc}`)) {
            match = selectedPractice;
          }
        } else {
          match = PRACTICAS_MUSICALES_LIST.find(p => 
            matchesPracticeMusical(p, `${practices} ${desc}`)
          );
        }

        if (match) {
          matchColor = PRACTICA_MAPPING[match]?.color || '#cbd5e1';
          matchLabel = match;
        }
      }

      if (matchColor && matchLabel) {
        // Generate a beautiful, organic offset based on index so they cluster dynamically instead of overlapping perfectly
        const angle = (index * 0.72) % (2 * Math.PI);
        const radius = 0.08 + ((index * 0.03) % 0.14);
        const lat = centroid[0] + Math.sin(angle) * radius;
        const lng = centroid[1] + Math.cos(angle) * radius;

        points.push({
          id: `${record.id || index}-${activeThematicOption}`,
          lat,
          lng,
          color: matchColor,
          label: matchLabel,
          recordName: record.name || record.fields?.nombre || 'Proceso Ecosistémico',
          category: record.category || 'Registro',
          department: normalized
        });
      }
    });

    return points;
  }, [festivalRecords, schoolRecords, marketRecords, redesRecords, lutieresRecords, activeThematicOption, selectedSonorousTerritory, selectedPractice]);

  const activeLegendItems = useMemo(() => {
    if (visualizationMode === 'practicas_territorios') {
      if (activeThematicOption === 'territorio') {
        if (selectedSonorousTerritory === 'Todos') {
          const uniqueLabels = [...new Set(thematicPoints.map(p => p.label))].sort();
          return uniqueLabels.map(label => ({
            label,
            color: TERRITORIO_MAPPING[label]?.color || '#cbd5e1'
          }));
        }
        const mapping = TERRITORIO_MAPPING[selectedSonorousTerritory];
        return [
          { label: selectedSonorousTerritory, color: mapping?.color || '#cbd5e1' }
        ];
      } else {
        if (selectedPractice === 'Todas') {
          const uniqueLabels = [...new Set(thematicPoints.map(p => p.label))].sort();
          return uniqueLabels.map(label => ({
            label,
            color: PRACTICA_MAPPING[label]?.color || '#cbd5e1'
          }));
        }
        const mapping = PRACTICA_MAPPING[selectedPractice];
        return [
          { label: selectedPractice, color: mapping?.color || '#cbd5e1' }
        ];
      }
    }
    return MAP_LAYER_CHOROPLETH_STEPS[activeCategory] || MAP_LAYER_CHOROPLETH_STEPS.General;
  }, [activeCategory, visualizationMode, activeThematicOption, selectedSonorousTerritory, selectedPractice, thematicPoints]);

  const selectedFestivalRecords = useMemo(
    () => (selectedDept === 'Nacional' ? [] : (festivalRecordsByDepartment[selectedNormalized] || [])),
    [festivalRecordsByDepartment, selectedDept, selectedNormalized]
  );
  const selectedSchoolRecords = useMemo(
    () => (selectedDept === 'Nacional' ? [] : (schoolRecordsByDepartment[selectedNormalized] || [])),
    [schoolRecordsByDepartment, selectedDept, selectedNormalized]
  );
  const selectedMarketRecords = useMemo(
    () => (selectedDept === 'Nacional' ? [] : (marketRecordsByDepartment[selectedNormalized] || [])),
    [marketRecordsByDepartment, selectedDept, selectedNormalized]
  );
  const selectedRedesRecords = useMemo(
    () => (selectedDept === 'Nacional' ? [] : (redesRecordsByDepartment[selectedNormalized] || [])),
    [redesRecordsByDepartment, selectedDept, selectedNormalized]
  );
  const selectedLutieresRecords = useMemo(
    () => (selectedDept === 'Nacional' ? [] : (lutieresRecordsByDepartment[selectedNormalized] || [])),
    [lutieresRecordsByDepartment, selectedDept, selectedNormalized]
  );


  const activeMunicipalityCounts = useMemo(() => {
    if (selectedDept === 'Nacional') return {};
    
    const records = isGeneralLayer
      ? [
          ...selectedFestivalRecords,
          ...selectedSchoolRecords,
          ...selectedMarketRecords,
          ...selectedRedesRecords,
          ...selectedLutieresRecords,
        ]
      : isSchoolsLayer
      ? selectedSchoolRecords
      : isMarketsLayer
      ? selectedMarketRecords
      : isRedesLayer
      ? selectedRedesRecords
      : isLutieresLayer
      ? selectedLutieresRecords
      : selectedFestivalRecords;

    const counts = {};
    records.forEach((record) => {
      const munName = (
        record.municipality ||
        record.municipio ||
        record?.fields?.municipio ||
        ''
      ).toLowerCase().trim();
      
      const munCode = record.municipalityCode || record?.fields?.municipalityCode || '';
      
      if (munCode) {
        counts[munCode] = (counts[munCode] || 0) + 1;
      }
      if (munName) {
        counts[munName] = (counts[munName] || 0) + 1;
      }
    });
    return counts;
  }, [
    selectedDept,
    isGeneralLayer,
    isSchoolsLayer,
    isMarketsLayer,
    isRedesLayer,
    isLutieresLayer,
    selectedFestivalRecords,
    selectedSchoolRecords,
    selectedMarketRecords,
    selectedRedesRecords,
    selectedLutieresRecords,
  ]);
  const focusedDepartmentStats = useMemo(
    () => (selectedDept === 'Nacional' ? null : (departmentSummaryByDepartment[selectedNormalized] || EMPTY_DEPARTMENT_SUMMARY)),
    [departmentSummaryByDepartment, selectedDept, selectedNormalized]
  );
  const schoolCapacityTotals = useMemo(
    () => buildSchoolCapacityTotals(selectedDept === 'Nacional' ? schoolRecords : selectedSchoolRecords),
    [schoolRecords, selectedDept, selectedSchoolRecords]
  );
  const marketCapacityTotals = useMemo(
    () => buildMarketTotals(selectedDept === 'Nacional' ? marketRecords : selectedMarketRecords),
    [marketRecords, selectedDept, selectedMarketRecords]
  );

  const territorialPulse = useMemo(() => {
    if (selectedDept === 'Nacional') {
      const summary = {
        totalRecords: Object.values(departmentSummaryByDepartment).reduce((sum, s) => sum + (s.totalRecords || 0), 0),
        festivalCount: Object.values(departmentSummaryByDepartment).reduce((sum, s) => sum + (s.festivalCount || 0), 0),
        schoolCount: Object.values(departmentSummaryByDepartment).reduce((sum, s) => sum + (s.schoolCount || 0), 0),
        marketCount: Object.values(departmentSummaryByDepartment).reduce((sum, s) => sum + (s.marketCount || 0), 0),
        redesCount: Object.values(departmentSummaryByDepartment).reduce((sum, s) => sum + (s.redesCount || 0), 0),
        lutierCount: Object.values(departmentSummaryByDepartment).reduce((sum, s) => sum + (s.lutierCount || 0), 0),
      };
      
      const activeDepts = Object.values(departmentSummaryByDepartment).filter(s => s.totalRecords > 0).length;

      return {
        totalRecords: summary.totalRecords,
        impactedCount: activeDepts,
        impactedLabel: 'Departamentos impactados',
        layerItems: [
          { key: 'festivals', label: 'Festivales', value: summary.festivalCount, color: LAYER_ACCENTS.Festivales },
          { key: 'schools', label: 'Escuelas', value: summary.schoolCount, color: LAYER_ACCENTS['Escuelas de Música'] },
          { key: 'markets', label: 'Mercados', value: summary.marketCount, color: LAYER_ACCENTS['Mercados Musicales'] },
          { key: 'redes', label: 'Redes Doc.', value: summary.redesCount, color: LAYER_ACCENTS['Redes de Documentación'] },
          { key: 'lutieres', label: 'Lutieres', value: summary.lutierCount, color: LAYER_ACCENTS.Lutieres },
        ],
      };
    } else {
      const summary = focusedDepartmentStats || EMPTY_DEPARTMENT_SUMMARY;
      const municipalitiesWithRecords = new Set([
        ...(selectedFestivalRecords || []).map(item => item.municipality),
        ...(selectedSchoolRecords || []).map(item => item.municipality),
        ...(selectedMarketRecords || []).map(item => item.municipio || item.municipality),
        ...(selectedRedesRecords || []).map(item => item.municipio || item.municipality),
        ...(selectedLutieresRecords || []).map(item => item.municipio || item.municipality)
      ].filter(Boolean));

      return {
        totalRecords: summary.totalRecords,
        impactedCount: municipalitiesWithRecords.size,
        impactedLabel: 'Municipios impactados',
        layerItems: [
          { key: 'festivals', label: 'Festivales', value: summary.festivalCount, color: LAYER_ACCENTS.Festivales },
          { key: 'schools', label: 'Escuelas', value: summary.schoolCount, color: LAYER_ACCENTS['Escuelas de Música'] },
          { key: 'markets', label: 'Mercados', value: summary.marketCount, color: LAYER_ACCENTS['Mercados Musicales'] },
          { key: 'redes', label: 'Redes Doc.', value: summary.redesCount, color: LAYER_ACCENTS['Redes de Documentación'] },
          { key: 'lutieres', label: 'Lutieres', value: summary.lutierCount, color: LAYER_ACCENTS.Lutieres },
        ],
      };
    }
  }, [
    selectedDept,
    departmentSummaryByDepartment,
    focusedDepartmentStats,
    selectedFestivalRecords,
    selectedSchoolRecords,
    selectedMarketRecords,
    selectedRedesRecords,
    selectedLutieresRecords
  ]);

  const technicalDepartmentRows = useMemo(() => {
    return Object.keys(baseDepartmentCounts)
      .map((departmentKey) => {
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
          totalMarketProjects: marketTotals.totalProjects,
          totalMarketBuyers: marketTotals.totalBuyers,
          municipalities: countDistinctValues(festivals, (item) => item.municipality),
        };
      })
      .sort((left, right) => {
        const sortKey = isGeneralLayer
          ? 'totalRecords'
          : isSchoolsLayer
          ? 'schoolCount'
          : isMarketsLayer
          ? 'marketCount'
          : 'festivalCount';
        const delta = (right[sortKey] || 0) - (left[sortKey] || 0);
        return delta || left.departmentLabel.localeCompare(right.departmentLabel, 'es-CO');
      });
  }, [
    baseDepartmentCounts,
    departmentSummaryByDepartment,
    festivalRecordsByDepartment,
    isGeneralLayer,
    isMarketsLayer,
    isSchoolsLayer,
    marketRecordsByDepartment,
    schoolRecordsByDepartment,
  ]);

  const summaryCards = useMemo(() => {
    const isDept = selectedDept !== 'Nacional' && focusedDepartmentStats;
    const summary = isDept ? focusedDepartmentStats : EMPTY_DEPARTMENT_SUMMARY;

    if (isGeneralLayer) {
      return [
        { 
          label: 'Formación Musical', 
          value: isDept ? summary.totalStudents : schoolCapacityTotals.totalStudents, 
          note: `${formatMetricValue(isDept ? summary.schoolCount : schoolRecords.length)} escuelas, ${formatMetricValue(isDept ? summary.totalTeachers : schoolCapacityTotals.totalTeachers)} docentes y ${formatMetricValue(isDept ? summary.totalInstruments : schoolCapacityTotals.totalInstruments)} instrumentos registrados.` 
        },
        {
          label: 'Festivales y Encuentros',
          value: isDept ? summary.festivalCount : festivalRecords.length,
          note: 'Celebraciones y circuitos de circulación de música en vivo.'
        },
        { 
          label: 'Proyectos en Mercados', 
          value: isDept ? summary.totalMarketProjects : marketCapacityTotals.totalProjects, 
          note: `Conexión profesional con ${formatMetricValue(isDept ? summary.totalMarketBuyers : marketCapacityTotals.totalBuyers)} compradores registrados.` 
        },
        { 
          label: 'Centros de Documentación', 
          value: isDept ? summary.redesCount : redesRecords.length, 
          note: 'Archivos históricos y redes de memoria musical activas.' 
        },
        { 
          label: 'Talleres de Lutería', 
          value: isDept ? summary.lutierCount : lutieresRecords.length, 
          note: 'Constructores tradicionales y saberes locales del oficio.' 
        },
      ];
    }

    if (isSchoolsLayer) {
      return [
        { label: 'Escuelas visibles', value: isDept ? summary.schoolCount : schoolRecords.length, note: `${activeAnalytics.activeDepartments} departamentos con registros.` },
        { label: 'Estudiantes', value: isDept ? summary.totalStudents : schoolCapacityTotals.totalStudents, note: 'Suma nacional o territorial visible.' },
        { label: 'Docentes', value: isDept ? summary.totalTeachers : schoolCapacityTotals.totalTeachers, note: 'Capacidad pedagógica reportada.' },
        { label: 'Instrumentos', value: isDept ? summary.totalInstruments : schoolCapacityTotals.totalInstruments, note: 'Dotación registrada.' },
        { label: 'Con internet', value: schoolCapacityTotals.withInternet, note: 'Escuelas con conectividad declarada.' },
      ];
    }

    if (isMarketsLayer) {
      return [
        { label: 'Mercados visibles', value: isDept ? summary.marketCount : marketRecords.length, note: `${activeAnalytics.activeDepartments} departamentos con registros.` },
        { label: 'Proyectos', value: isDept ? summary.totalMarketProjects : marketCapacityTotals.totalProjects, note: 'Promedio o suma reportada por mercado.' },
        { label: 'Bookers', value: isDept ? summary.totalMarketBuyers : marketCapacityTotals.totalBuyers, note: 'Capacidad de conexión profesional.' },
        { label: 'Convocatorias', value: marketCapacityTotals.openCalls, note: 'Mercados con convocatoria abierta.' },
        { label: 'Con festival', value: marketCapacityTotals.linkedToFestival, note: 'Relación con circuitos festivaleros.' },
      ];
    }

    if (isFestivalsLayer) {
      const allFestivals = isDept ? (festivalRecordsByDepartment[selectedNormalized] || []) : Object.values(festivalRecordsByDepartment).flat();
      return [
        { label: 'Festivales visibles', value: isDept ? summary.festivalCount : festivalAnalytics.totalRecords, note: `${activeAnalytics.activeDepartments} departamentos con presencia.` },
        { label: 'Municipios', value: countDistinctValues(allFestivals, (item) => item.municipality), note: 'Municipios con registros reportados.' },
        { label: 'Meses', value: countDistinctValues(allFestivals, (item) => item.month), note: 'Distribución temporal disponible.' },
        { label: 'Géneros', value: countDistinctValues(allFestivals, (item) => item.genre), note: 'Lectura temática visible.' },
        { label: 'Cobertura', value: `${activeAnalytics.coverage}%`, note: 'Departamentos con presencia festivalera.' },
      ];
    }

    if (isRedesLayer) {
      const allRedes = isDept ? (redesRecordsByDepartment[selectedNormalized] || []) : redesRecords;
      return [
        { label: 'Redes integradas', value: isDept ? summary.redesCount : redesRecords.length, note: `${activeAnalytics.activeDepartments} departamentos con presencia.` },
        { label: 'Municipios', value: countDistinctValues(allRedes, (item) => item.municipality), note: 'Cobertura municipal.' },
        { label: 'Cobertura', value: `${activeAnalytics.coverage}%`, note: 'Departamentos activos.' },
      ];
    }

    if (isLutieresLayer) {
      const allLutieres = isDept ? (lutieresRecordsByDepartment[selectedNormalized] || []) : lutieresRecords;
      return [
        { label: 'Lutieres registrados', value: isDept ? summary.lutierCount : lutieresRecords.length, note: `${activeAnalytics.activeDepartments} departamentos con presencia.` },
        { label: 'Municipios', value: countDistinctValues(allLutieres, (item) => item.municipality), note: 'Cobertura municipal.' },
        { label: 'Cobertura', value: `${activeAnalytics.coverage}%`, note: 'Departamentos activos.' },
      ];
    }

    return [
      { label: 'Registros integrados', value: generalAnalytics.totalRecords, note: 'Escuelas, festivales, mercados, redes y lutieres visibles.' },
      { label: 'Cobertura', value: `${generalAnalytics.coverage}%`, note: `${generalAnalytics.activeDepartments} departamentos activos.` },
      { label: 'Estudiantes', value: schoolCapacityTotals.totalStudents, note: 'Capacidad formativa declarada.' },
      { label: 'Proyectos', value: marketCapacityTotals.totalProjects, note: 'Actividad reportada por mercados.' },
      { label: 'Redes de Documentación', value: redesRecords.length, note: 'Centros de investigación integrados.' },
      { label: 'Lutieres', value: lutieresRecords.length, note: 'Constructores y reparadores registrados.' },
    ];
  }, [
    activeAnalytics,
    festivalAnalytics.totalRecords,
    festivalRecordsByDepartment,
    focusedDepartmentStats,
    generalAnalytics,
    isGeneralLayer,
    isFestivalsLayer,
    isMarketsLayer,
    isSchoolsLayer,
    isRedesLayer,
    isLutieresLayer,
    marketCapacityTotals,
    marketRecords.length,
    festivalRecords.length,
    redesRecords,
    lutieresRecords,
    schoolCapacityTotals,
    schoolRecords.length,
    selectedDept,
    selectedNormalized,
    redesRecordsByDepartment,
    lutieresRecordsByDepartment,
  ]);

  const visibleRecords = useMemo(() => {
    if (selectedDept === 'Nacional') return [];
    return [
      ...selectedFestivalRecords.slice(0, 8).map((item) => ({
        type: 'Festival',
        name: item.name,
        meta: [item.municipality, item.month, item.genre].filter(Boolean).join(' · '),
        record: { ...item, department: selectedNormalized },
      })),
      ...selectedSchoolRecords.slice(0, 8).map((item) => ({
        type: 'Escuela',
        name: item.name,
        meta: [item.municipality, item.status, `${formatMetricValue(item.students)} estudiantes`].filter(Boolean).join(' · '),
        record: item,
      })),
      ...selectedMarketRecords.slice(0, 8).map((item) => ({
        type: 'Mercado',
        name: item.name,
        meta: [item.municipality, item.periodicity, item.openCall === 'Sí' ? 'Convocatoria abierta' : ''].filter(Boolean).join(' · '),
        record: item,
      })),
      ...selectedRedesRecords.slice(0, 8).map((item) => ({
        type: 'Redes de Documentación',
        name: item.name,
        meta: [item.municipality, item.centerType].filter(Boolean).join(' · '),
        record: item,
      })),
      ...selectedLutieresRecords.slice(0, 8).map((item) => ({
        type: 'Lutieres',
        name: item.name,
        meta: [item.municipality, item.oficio].filter(Boolean).join(' · '),
        record: item,
      })),
    ];
  }, [
    selectedDept,
    selectedFestivalRecords,
    selectedMarketRecords,
    selectedNormalized,
    selectedSchoolRecords,
    selectedRedesRecords,
    selectedLutieresRecords,
  ]);

  const directoryCounts = useMemo(() => {
    const isDept = selectedDept !== 'Nacional';
    const deptNorm = selectedNormalized || '';
    
    const countFestivals = isDept
      ? ((festivalRecordsByDepartment || {})[deptNorm] || []).length
      : Object.values(festivalRecordsByDepartment || {}).flat().length;
      
    const countSchools = isDept
      ? ((schoolRecordsByDepartment || {})[deptNorm] || []).length
      : Object.values(schoolRecordsByDepartment || {}).flat().length;
      
    const countMarkets = isDept
      ? ((marketRecordsByDepartment || {})[deptNorm] || []).length
      : Object.values(marketRecordsByDepartment || {}).flat().length;
      
    const countRedes = isDept
      ? ((redesRecordsByDepartment || {})[deptNorm] || []).length
      : Object.values(redesRecordsByDepartment || {}).flat().length;
      
    const countLutieres = isDept
      ? ((lutieresRecordsByDepartment || {})[deptNorm] || []).length
      : Object.values(lutieresRecordsByDepartment || {}).flat().length;

    return {
      Todos: countFestivals + countSchools + countMarkets + countRedes + countLutieres,
      Festivales: countFestivals,
      Escuelas: countSchools,
      Mercados: countMarkets,
      Redes: countRedes,
      Lutieres: countLutieres,
    };
  }, [
    selectedDept,
    selectedNormalized,
    festivalRecordsByDepartment,
    schoolRecordsByDepartment,
    marketRecordsByDepartment,
    redesRecordsByDepartment,
    lutieresRecordsByDepartment,
  ]);

  const directoryRecords = useMemo(() => {
    const isDept = selectedDept !== 'Nacional';
    const deptNorm = selectedNormalized || '';
    
    const festivals = isDept
      ? ((festivalRecordsByDepartment || {})[deptNorm] || [])
      : Object.entries(festivalRecordsByDepartment || {}).flatMap(([deptKey, list]) =>
          (list || []).map(item => ({ ...item, department: item.department || getDepartmentDisplayName(deptKey) }))
        );
        
    const schools = isDept
      ? ((schoolRecordsByDepartment || {})[deptNorm] || [])
      : Object.values(schoolRecordsByDepartment || {}).flat();
      
    const markets = isDept
      ? ((marketRecordsByDepartment || {})[deptNorm] || [])
      : Object.values(marketRecordsByDepartment || {}).flat();
      
    const redes = isDept
      ? ((redesRecordsByDepartment || {})[deptNorm] || [])
      : Object.values(redesRecordsByDepartment || {}).flat();
      
    const lutieres = isDept
      ? ((lutieresRecordsByDepartment || {})[deptNorm] || [])
      : Object.values(lutieresRecordsByDepartment || {}).flat();

    const all = [];

    if (directoryCategory === 'Todos' || directoryCategory === 'Festivales') {
      (festivals || []).forEach(item => {
        if (!item) return;
        all.push({
          id: item.id || `fest-${item.name || 'sin-nombre'}-${item.municipality || 'sin-municipio'}`,
          type: 'Festival',
          name: item.name || 'Festival sin nombre',
          meta: [item.municipality, item.month, item.genre].filter(Boolean).join(' · ') || 'Sin datos de ubicación',
          department: item.department,
          color: LAYER_ACCENTS.Festivales,
          record: { ...item, type: 'Festival' }
        });
      });
    }
    
    if (directoryCategory === 'Todos' || directoryCategory === 'Escuelas') {
      (schools || []).forEach(item => {
        if (!item) return;
        all.push({
          id: item.id || `school-${item.name || 'sin-nombre'}-${item.municipality || 'sin-municipio'}`,
          type: 'Escuela',
          name: item.name || 'Escuela sin nombre',
          meta: [item.municipality, item.status, item.students ? `${formatMetricValue(item.students)} estudiantes` : ''].filter(Boolean).join(' · ') || 'Sin datos de ubicación',
          department: item.department,
          color: LAYER_ACCENTS['Escuelas de Música'],
          record: { ...item, type: 'Escuela' }
        });
      });
    }
    
    if (directoryCategory === 'Todos' || directoryCategory === 'Mercados') {
      (markets || []).forEach(item => {
        if (!item) return;
        all.push({
          id: item.id || `market-${item.name || 'sin-nombre'}-${item.municipality || 'sin-municipio'}`,
          type: 'Mercado',
          name: item.name || 'Mercado sin nombre',
          meta: [item.municipality, item.periodicity, item.openCall === 'Sí' ? 'Convocatoria abierta' : ''].filter(Boolean).join(' · ') || 'Sin datos de ubicación',
          department: item.department,
          color: LAYER_ACCENTS['Mercados Musicales'],
          record: { ...item, type: 'Mercado' }
        });
      });
    }
    
    if (directoryCategory === 'Todos' || directoryCategory === 'Redes') {
      (redes || []).forEach(item => {
        if (!item) return;
        all.push({
          id: item.id || `redes-${item.name || 'sin-nombre'}-${item.municipality || 'sin-municipio'}`,
          type: 'Redes de Documentación',
          name: item.name || 'Red de Documentación sin nombre',
          meta: [item.municipality, item.centerType].filter(Boolean).join(' · ') || 'Sin datos de ubicación',
          department: item.department,
          color: LAYER_ACCENTS['Redes de Documentación'],
          record: { ...item, type: 'Redes de Documentación' }
        });
      });
    }
    
    if (directoryCategory === 'Todos' || directoryCategory === 'Lutieres') {
      (lutieres || []).forEach(item => {
        if (!item) return;
        all.push({
          id: item.id || `lutier-${item.name || 'sin-nombre'}-${item.municipality || 'sin-municipio'}`,
          type: 'Lutieres',
          name: item.name || 'Lutier sin nombre',
          meta: [item.municipality, item.oficio].filter(Boolean).join(' · ') || 'Sin datos de ubicación',
          department: item.department,
          color: LAYER_ACCENTS.Lutieres,
          record: { ...item, type: 'Lutieres' }
        });
      });
    }

    return all.sort((a, b) => {
      const nameA = String(a.name || '').trim();
      const nameB = String(b.name || '').trim();
      return nameA.localeCompare(nameB);
    });
  }, [
    selectedDept,
    selectedNormalized,
    directoryCategory,
    festivalRecordsByDepartment,
    schoolRecordsByDepartment,
    marketRecordsByDepartment,
    redesRecordsByDepartment,
    lutieresRecordsByDepartment,
  ]);

  const filteredDirectoryRecords = useMemo(() => {
    if (!directoryQuery) return directoryRecords;
    const query = directoryQuery.toLowerCase().trim();
    return directoryRecords.filter(item => {
      if (!item) return false;
      const nameMatch = item.name?.toLowerCase().includes(query);
      const metaMatch = item.meta?.toLowerCase().includes(query);
      const deptMatch = item.department?.toLowerCase().includes(query);
      return nameMatch || metaMatch || deptMatch;
    });
  }, [directoryRecords, directoryQuery]);

  const selectedRecordDetailContent = useMemo(() => {
    if (!selectedRecordDetail) return { highlights: [], sections: [] };
    const record = selectedRecordDetail.record || {};

    const isValidField = (val) => {
      if (val === undefined || val === null || val === '') return false;
      const str = String(val).trim().toLowerCase();
      return str !== 'sin dato' && str !== 'sin datos' && str !== 'no aplica' && str !== 'n/a';
    };

    if (selectedRecordDetail.type === 'Festival') {
      const associatedMarketLink = record.associatedMarket || record.mercadoAsociado ? (
        <span className="inline-flex items-center rounded-md bg-emerald-50 px-2 py-1 text-xs font-bold text-emerald-700 ring-1 ring-inset ring-emerald-600/10">
          {record.associatedMarket || record.mercadoAsociado}
        </span>
      ) : null;

      const itemsCirculacion = [
        { label: 'Zona Geográfica', value: record.zone || record.zona },
        { label: 'Ubicación Específica', value: record.specificLocation },
        { label: 'Nivel de Cobertura', value: record.coverageLevel },
        { label: 'Mes de Realización', value: record.month },
        { label: 'Prácticas Musicales', value: record.genre || record.practices },
        { label: 'Mercado Asociado', value: associatedMarketLink },
        { label: 'Financiación', value: record.funding || 'Pública y recursos PNMC' },
      ].filter(item => item.value && isValidField(React.isValidElement(item.value) ? 'valid' : item.value));

      const itemsContacto = [
        { label: 'Sitio Web Oficial', value: record.websiteUrl },
        { label: 'Correo de Contacto', value: record.contactEmail },
        { label: 'Teléfono de Contacto', value: record.contactPhone },
      ].filter(item => isValidField(item.value));

      return {
        highlights: [],
        sections: [
          { title: 'Lectura General', body: record.description || 'No hay descripción pública disponible para este festival.' },
          { title: 'Circulación e Impacto', items: itemsCirculacion },
          { title: 'Contacto y Canales', items: itemsContacto },
        ],
      };
    }

    if (selectedRecordDetail.type === 'Escuela') {
      const itemsOrganizacion = [
        { label: 'Estudiantes Activos', value: record.students },
        { label: 'Docentes Vinculados', value: record.teachers },
        { label: 'Instrumentos Disponibles', value: record.instruments },
      ].filter(item => isValidField(item.value));

      const operacionItems = [
        { label: 'Estado de Operación', value: record.status },
        { label: 'Tipo de Escuela', value: record.schoolType },
        { label: 'Categoría', value: record.category },
        { label: 'Director o Coordinador', value: record.directorName },
        { label: 'Zona Geográfica', value: record.zone || record.zona },
        { label: 'Sede de Trabajo', value: record.workSite },
      ].filter(item => isValidField(item.value));

      const institucionalItems = [
        { label: 'Creada Legalmente', value: record.legalCreation },
        { label: 'Personería Jurídica', value: record.legalPersonhood },
        { label: 'Naturaleza Jurídica', value: record.nature },
        { label: 'Depende de Entidad', value: record.dependsOnEntity },
        { label: 'Entidad de la que Depende', value: record.parentEntity },
      ].filter(item => isValidField(item.value));

      const capacidadesItems = [
        { label: 'Formatos / Agrupaciones', value: record.groups },
        { label: 'Disponibilidad de Internet', value: record.hasInternet },
        { label: 'Prácticas Musicales', value: record.practices },
        { label: 'Talleres Independientes', value: record.workshops },
        { label: 'Organización Comunitaria', value: record.communityOrganization },
      ].filter(item => isValidField(item.value));

      const contactoItems = [
        { label: 'Celular del Director', value: record.directorContact },
        { label: 'Correo de la Escuela', value: record.contactEmail },
      ].filter(item => isValidField(item.value));

      return {
        highlights: [],
        sections: [
          { title: 'Capacidad Operativa', items: itemsOrganizacion },
          { title: 'Operación Formativa', items: operacionItems },
          { title: 'Estructura Institucional', items: institucionalItems },
          { title: 'Capacidades y Prácticas', items: capacidadesItems },
          { title: 'Contacto y Canales', items: contactoItems },
        ],
      };
    }

    if (selectedRecordDetail.type === 'Mercado') {
      const festivalLink = record.festivalName || record.festivalAsociado ? (
        <span className="inline-flex items-center rounded-md bg-purple-50 px-2 py-1 text-xs font-bold text-purple-700 ring-1 ring-inset ring-purple-600/10">
          {record.festivalName || record.festivalAsociado}
        </span>
      ) : null;

      const itemsOrganizacion = [
        { label: 'Proyectos Promedio', value: record.averageProjectsLabel || record.averageProjects },
        { label: 'Compradores / Bookers', value: record.averageBuyersLabel || record.averageBuyers },
        { label: 'Convocatoria Abierta', value: record.openCall },
      ].filter(item => isValidField(item.value));

      const operacionItems = [
        { label: 'Zona Geográfica', value: record.zone || record.zona },
        { label: 'Nivel de Cobertura', value: record.coverageLevel },
        { label: 'Ubicación Específica', value: record.specificLocation },
        { label: 'Entidad Responsable', value: record.responsibleEntity },
        { label: 'Tipo de Organización', value: record.organizationType },
        { label: 'Periodicidad del Mercado', value: record.periodicity },
        { label: 'Año de Creación', value: record.createdYear },
        { label: 'Versiones Realizadas', value: record.versions },
        { label: 'Fecha Edición 2026', value: record.editionDate2026 },
      ].filter(item => isValidField(item.value));

      const comercialItems = [
        { label: 'Modelo de Curaduría', value: record.curationModel },
        { label: 'Espacios para Compradores', value: record.buyerSpaces },
        { label: 'Estrategias de Bookers', value: record.buyerStrategies },
        { label: 'Preacuerdos Comerciales', value: record.preAgreements },
        { label: 'Mecanismos de Circulación', value: record.circulationMechanisms },
      ].filter(item => isValidField(item.value));

      const articulacionItems = [
        { label: 'Vinculado a Festival', value: record.linkedFestival },
        { label: 'Festival Asociado', value: festivalLink },
        { label: 'Fechas del Festival', value: record.festivalDates },
        { label: 'Versiones del Festival', value: record.festivalVersions },
        { label: 'Fuentes de Financiación', value: record.fundingSources },
        { label: 'Participación Pública (%)', value: record.publicBudgetShare },
        { label: 'Articulaciones Públicas', value: record.publicArticulations },
        { label: 'Redes de Aliados', value: record.partnerNetworks },
        { label: 'Conexión con el PNMC', value: record.pnmcConnections },
      ].filter(item => item.value && isValidField(React.isValidElement(item.value) ? 'valid' : item.value));

      return {
        highlights: [],
        sections: [
          { title: 'Lectura General', body: record.description || 'No hay descripción pública disponible para este mercado.' },
          { title: 'Capacidad y Convocatoria', items: itemsOrganizacion },
          { title: 'Operación del Mercado', items: operacionItems },
          { title: 'Dinámicas de Comercialización', items: comercialItems },
          { title: 'Articulación e Impacto', items: articulacionItems },
        ],
      };
    }

    if (selectedRecordDetail.type === 'Redes de Documentación') {
      const items = [
        { label: 'Tipo de Centro o Red', value: record.centerType },
        { label: 'Ubicación', value: [record.municipio, record.departamento].filter(Boolean).join(', ') },
        { label: 'Territorios Vinculados', value: record.linkedSonorousTerritories },
        { label: 'Prácticas Musicales', value: record.practices },
        { label: 'Datos de Contacto', value: record.contact },
      ].filter(item => isValidField(item.value));

      return {
        highlights: [],
        sections: [
          { title: 'Sobre el Centro o Red', body: record.description || 'Centro de investigación y documentación dedicado a conservar y difundir la memoria y prácticas sonoras del país.' },
          { title: 'Articulación Técnica', items },
        ],
      };
    }

    if (selectedRecordDetail.type === 'Lutieres') {
      const items = [
        { label: 'Oficio / Especialidad', value: record.oficio },
        { label: 'Ubicación', value: [record.municipio, record.departamento].filter(Boolean).join(', ') },
        { label: 'Territorio Sonoro', value: record.linkedSonorousTerritories },
        { label: 'Prácticas Relacionadas', value: record.practices },
        { label: 'Datos de Contacto', value: record.contact },
      ].filter(item => isValidField(item.value));

      return {
        highlights: [],
        sections: [
          { title: 'Trayectoria y Saberes', body: record.description || 'Lutier y constructor tradicional dedicado a la preservación del patrimonio musical colombiano.' },
          { title: 'Caracterización de Oficio', items },
        ],
      };
    }

    return { highlights: [], sections: [] };
  }, [selectedRecordDetail]);

  const headerMetadata = useMemo(() => {
    if (!selectedRecordDetail) return '';
    const record = selectedRecordDetail.record || {};
    const type = selectedRecordDetail.type;
    const location = [record.municipality || record.municipio, record.department || record.departamento].filter(Boolean).join(', ');

    if (type === 'Festival') {
      return [
        record.versions ? `${record.versions} ediciones` : null,
        record.organizer ? `Organiza: ${record.organizer}` : null,
        location
      ].filter(Boolean).join('  ·  ');
    }
    if (type === 'Escuela') {
      return [
        record.students ? `${formatMetricValue(record.students)} estudiantes` : null,
        record.teachers ? `${formatMetricValue(record.teachers)} docentes` : null,
        location
      ].filter(Boolean).join('  ·  ');
    }
    if (type === 'Mercado') {
      return [
        record.periodicity ? `${record.periodicity}` : null,
        record.marketMode || record.modalidad ? `Modo: ${record.marketMode || record.modalidad}` : null,
        location
      ].filter(Boolean).join('  ·  ');
    }
    if (type === 'Redes de Documentación') {
      return [
        record.centerType ? `${record.centerType}` : null,
        location
      ].filter(Boolean).join('  ·  ');
    }
    if (type === 'Lutieres') {
      return [
        record.oficio ? `${record.oficio}` : null,
        location
      ].filter(Boolean).join('  ·  ');
    }
    return selectedRecordDetail.meta || location;
  }, [selectedRecordDetail]);

  const colombiaBounds = useMemo(() => {
    if (!geoData) return null;
    const nationalFeatures = geoData.features.filter(
      (feature) => getFeatureDepartmentNormalizedName(feature) !== ARCHIPELAGO_NORMALIZED_NAME
    );
    return L.geoJSON({
      ...geoData,
      features: nationalFeatures.length > 0 ? nationalFeatures : geoData.features,
    }).getBounds();
  }, [geoData]);

  const paddedColombiaBounds = useMemo(() => {
    return colombiaBounds ? colombiaBounds.pad(-0.065) : null;
  }, [colombiaBounds]);

  const archipelagoFeature = useMemo(
    () => geoData?.features?.find(
      (feature) => getFeatureDepartmentNormalizedName(feature) === ARCHIPELAGO_NORMALIZED_NAME
    ) || null,
    [geoData]
  );
  const enlargedArchipelagoFeature = useMemo(
    () => buildScaledFeature(archipelagoFeature),
    [archipelagoFeature]
  );
  const archipelagoSummary = departmentSummaryByDepartment[ARCHIPELAGO_NORMALIZED_NAME] || EMPTY_DEPARTMENT_SUMMARY;
  const archipelagoCount = activeDepartmentCounts[ARCHIPELAGO_NORMALIZED_NAME] || 0;
  const hasSelectedDepartment = selectedDept !== 'Nacional';
  const archipelagoIsSelected = selectedNormalized === ARCHIPELAGO_NORMALIZED_NAME;
  const archipelagoVisualStyle = useMemo(() => {
    if (hasSelectedDepartment && archipelagoIsSelected) {
      return {
        ...SELECTED_DEPARTMENT_STYLE,
        fillOpacity: 0.9,
        weight: 3,
      };
    }

    if (hasSelectedDepartment) {
      return {
        ...MUTED_DEPARTMENT_STYLE,
        fillOpacity: 0.42,
      };
    }

    if (visualizationMode === 'practicas_territorios') {
      return {
        fillColor: '#f8fafc',
        fillOpacity: 0.35,
        color: 'rgba(203, 213, 225, 0.45)',
        weight: 1.2,
        opacity: 0.5,
      };
    }

    const baseStyle = getChoroplethStyles(archipelagoCount, archipelagoIsSelected, activeCategory);
    return {
      ...baseStyle,
      fillOpacity: Math.max(baseStyle.fillOpacity, 0.78),
      weight: Math.max(baseStyle.weight, 2.1),
      color: baseStyle.color,
    };
  }, [activeCategory, archipelagoCount, archipelagoIsSelected, hasSelectedDepartment, visualizationMode]);

  const activeInfoNote = isGeneralLayer
    ? 'La capa General integra escuelas, festivales y mercados visibles por departamento para ofrecer una lectura sintética del ecosistema musical.'
    : isSchoolsLayer
    ? `La capa de Escuelas publica ${SCHOOL_PUBLICATION_POLICY.public.length} campos territoriales e institucionales y reserva información sensible.`
    : isMarketsLayer
    ? `La capa de Mercados publica ${MARKET_PUBLICATION_POLICY.public.length} campos territoriales y programáticos y reserva campos sensibles.`
    : 'La base de datos del mapa está en construcción y consolidación permanente con registros territoriales del ecosistema musical.';

  const fetchMapData = useCallback(async () => {
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
      allMunicipalitiesRef.current = nextMunicipalityGeoJson?.features || [];
      setGeoData(departmentGeoJson);
      setFestivalCounts(baseDepartmentCounts);
      setSchoolCounts(baseDepartmentCounts);
      setMarketCounts(baseDepartmentCounts);
      setRedesCounts(baseDepartmentCounts);
      setLutieresCounts(baseDepartmentCounts);
      setSchoolLayerReady(false);
      setMarketLayerReady(false);

      const cachedFestivalCounts = window.localStorage.getItem(FESTIVAL_COUNTS_CACHE_KEY);
      const cachedSchoolCounts = window.localStorage.getItem(SCHOOL_COUNTS_CACHE_KEY);
      const cachedMarketCounts = window.localStorage.getItem(MARKET_COUNTS_CACHE_KEY);

      if (cachedFestivalCounts) setFestivalCounts({ ...baseDepartmentCounts, ...JSON.parse(cachedFestivalCounts) });
      if (cachedSchoolCounts) setSchoolCounts({ ...baseDepartmentCounts, ...JSON.parse(cachedSchoolCounts) });
      if (cachedMarketCounts) setMarketCounts({ ...baseDepartmentCounts, ...JSON.parse(cachedMarketCounts) });

      const [festivalDataResult, schoolDataResult, marketDataResult, networkDataResult, lutierDataResult] = await Promise.allSettled([
        fetchFestivalRecords(),
        fetchSchoolRecords(),
        fetchMarketRecords(),
        fetchNetworkRecords(),
        fetchLutierRecords(),
      ]);

      if (festivalDataResult.status === 'fulfilled') {
        const records = festivalDataResult.value.records || [];
        const counts = { ...baseDepartmentCounts, ...buildFestivalCounts(records) };
        setFestivalRecords(records);
        setFestivalCounts(counts);
        window.localStorage.setItem(FESTIVAL_COUNTS_CACHE_KEY, JSON.stringify(counts));
      }

      if (schoolDataResult.status === 'fulfilled') {
        const records = (schoolDataResult.value.records || []).map(buildPublicSchoolRecord).filter(Boolean);
        const counts = { ...baseDepartmentCounts, ...buildSchoolCounts(records) };
        setSchoolRecords(records);
        setSchoolCounts(counts);
        setSchoolLayerReady(true);
        window.localStorage.setItem(SCHOOL_COUNTS_CACHE_KEY, JSON.stringify(counts));
      }

      if (marketDataResult.status === 'fulfilled') {
        const records = (marketDataResult.value.records || []).map(buildPublicMarketRecord).filter(Boolean);
        const counts = { ...baseDepartmentCounts, ...buildMarketCounts(records) };
        setMarketRecords(records);
        setMarketCounts(counts);
        setMarketLayerReady(true);
        window.localStorage.setItem(MARKET_COUNTS_CACHE_KEY, JSON.stringify(counts));
      }

      if (networkDataResult.status === 'fulfilled') {
        const records = (networkDataResult.value.records || []).map(buildPublicNetworkRecord).filter(Boolean);
        const counts = { ...baseDepartmentCounts, ...buildSimpleCounts(records) };
        setRedesRecords(records);
        setRedesCounts(counts);
      }

      if (lutierDataResult.status === 'fulfilled') {
        const records = (lutierDataResult.value.records || []).map(buildPublicLutierRecord).filter(Boolean);
        const counts = { ...baseDepartmentCounts, ...buildSimpleCounts(records) };
        setLutieresRecords(records);
        setLutieresCounts(counts);
      }
    } catch (error) {
      console.error('Fallo crítico en el mapa v3:', error);
      setMapError(error.message);
    } finally {
      setIsLoading(false);
    }
  }, [baseDepartmentCounts]);

  useEffect(() => {
    fetchMapData();
  }, [fetchMapData]);

  useEffect(() => {
    if (selectedDept === 'Nacional') {
      setCurrentDeptMunicipalities(null);
    } else {
      const filtered = allMunicipalitiesRef.current.filter((f) => {
        const deptName = normalizeDepartmentName(f.properties?.departmentName);
        return deptName === selectedNormalized;
      });
      setCurrentDeptMunicipalities({
        type: 'FeatureCollection',
        features: filtered,
      });
    }
  }, [selectedDept, selectedNormalized]);

  useEffect(() => {
    const originalBodyOverflow = document.body.style.overflow;
    const originalHtmlOverflow = document.documentElement.style.overflow;
    document.body.style.overflow = 'hidden';
    document.documentElement.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = originalBodyOverflow;
      document.documentElement.style.overflow = originalHtmlOverflow;
    };
  }, []);

  useEffect(() => {
    if (geoJsonRef.current) geoJsonRef.current.setStyle(getStyle);
  });

  useEffect(() => {
    setHoveredDepartmentCard(null);
  }, [activeCategory]);

  useEffect(() => {
    setSelectedRecordDetail(null);
  }, [selectedDept, activeCategory]);

  useEffect(() => {
    if (!navigationRequest?.requestId) return;
    const nextLayer = ECOSYSTEM_LAYERS.some((layer) => layer.key === navigationRequest.targetLayer)
      ? navigationRequest.targetLayer
      : 'General';
    setActiveCategory(nextLayer);
    setSelectedDept('Nacional');
    setSidebarTab('resumen');
    setMapResetToken((current) => current + 1);
  }, [navigationRequest]);

  const getStyle = useCallback((feature) => {
    const departmentName = getFeatureDepartmentNormalizedName(feature);
    if (departmentName === ARCHIPELAGO_NORMALIZED_NAME) {
      return {
        fillColor: 'transparent',
        fillOpacity: 0,
        color: 'transparent',
        weight: 0,
        opacity: 0,
      };
    }
    const count = activeDepartmentCounts[departmentName] || 0;
    const isSelectedDepartment = selectedDept !== 'Nacional' && selectedNormalized === departmentName;

    if (isSelectedDepartment) {
      return {
        ...SELECTED_DEPARTMENT_STYLE,
        fillColor: 'transparent',
        fillOpacity: 0,
      };
    }

    if (selectedDept !== 'Nacional') {
      return MUTED_DEPARTMENT_STYLE;
    }

    if (visualizationMode === 'practicas_territorios') {
      if (influenceDisplayType === 'calor') {
        return {
          fillColor: '#f8fafc',
          fillOpacity: 0.25,
          color: 'rgba(203, 213, 225, 0.35)',
          weight: 1.0,
          opacity: 0.4,
        };
      }

      const deptPoints = thematicPoints.filter(p => p.department === departmentName);
      if (deptPoints.length > 0) {
        // Calculate the dominant color by counting frequencies to resolve tie issues!
        const colorCounts = {};
        deptPoints.forEach(p => {
          if (p.color) {
            colorCounts[p.color] = (colorCounts[p.color] || 0) + 1;
          }
        });

        let maxCount = 0;
        let dominantColor = null;
        let isTie = false;

        Object.entries(colorCounts).forEach(([color, count]) => {
          if (count > maxCount) {
            maxCount = count;
            dominantColor = color;
            isTie = false;
          } else if (count === maxCount) {
            isTie = true;
          }
        });

        // Only paint the department if there is a strict predominating category (no ties!)
        if (!isTie && dominantColor) {
          const densityPct = Math.min(1.0, deptPoints.length / 8);
          return {
            fillColor: dominantColor,
            fillOpacity: 0.08 + (densityPct * 0.42),
            color: dominantColor,
            weight: 1.5,
            opacity: 0.7,
          };
        }
      }

      return {
        fillColor: '#f8fafc',
        fillOpacity: 0.25,
        color: 'rgba(203, 213, 225, 0.35)',
        weight: 1.0,
        opacity: 0.4,
      };
    }

    return getChoroplethStyles(count, true, activeCategory);
  }, [activeCategory, activeDepartmentCounts, selectedDept, selectedNormalized, visualizationMode, thematicPoints, influenceDisplayType]);

  const getMunicipalityStyle = useCallback((feature) => {
    const munCode = feature.properties?.municipalityCode;
    const munName = (feature.properties?.municipalityName || '').toLowerCase().trim();
    
    const count = (activeMunicipalityCounts[munCode] || 0) + (activeMunicipalityCounts[munName] || 0);
    
    const style = getChoroplethStyles(count, true, activeCategory);
    
    style.weight = count > 0 ? 1.0 : 0.6;
    style.color = count > 0 ? 'rgba(41, 18, 66, 0.7)' : 'rgba(41, 18, 66, 0.2)';
    
    return style;
  }, [activeMunicipalityCounts, activeCategory]);

  const handleDepartmentDrilldown = useCallback((departmentName) => {
    const nextSelectedDept = getDepartmentSelectionValue(departmentName);
    const nextNormalized = normalizeDepartmentName(nextSelectedDept);

    if (selectedDept !== 'Nacional' && nextNormalized === selectedNormalized) {
      setSelectedDept('Nacional');
      setHoveredDepartmentCard(null);
      setMapResetToken((current) => current + 1);
    } else {
      setSelectedDept(nextSelectedDept);
    }

    setSidebarTab('resumen');
  }, [selectedDept, selectedNormalized]);

  const handleReturnToNationalView = useCallback(() => {
    setSelectedDept('Nacional');
    setSidebarTab('resumen');
    setHoveredDepartmentCard(null);
    setMapResetToken((current) => current + 1);
  }, []);

  const handleCloseTutorial = useCallback(() => {
    setIsTutorialOpen(false);
    setActivePanel(null);
    
    // Reset filters and drilldown states to a clean default slate upon exit
    setVisualizationMode('cobertura');
    setInfluenceDisplayType('puntos');
    setActiveCategory('General');
    setSelectedDept('Nacional');
    setSelectedSonorousTerritory('Todos');
    setSelectedPractice('Todas');
    setHoveredDepartmentCard(null);
    setSelectedRecordDetail(null);

    const todayStr = new Date().toISOString().split('T')[0];
    localStorage.setItem('pnmc_last_tutorial_date', todayStr);
  }, [
    setVisualizationMode,
    setInfluenceDisplayType,
    setActiveCategory,
    setSelectedDept,
    setSelectedSonorousTerritory,
    setSelectedPractice,
    setHoveredDepartmentCard,
    setSelectedRecordDetail
  ]);

  const handleGoToStep = useCallback((step) => {
    setTutorialStep(step);
    
    // Clean slate resets for visual harmony between steps
    setActiveCategory('General');
    setSelectedDept('Nacional');
    setSelectedSonorousTerritory('Todos');
    setSelectedPractice('Todas');
    setHoveredDepartmentCard(null);
    setSelectedRecordDetail(null);

    if (step === 0) {
      setVisualizationMode('cobertura');
      setInfluenceDisplayType('puntos');
      setActivePanel(null);
    } else if (step === 1) {
      setActivePanel(MAP_PANEL_IDS.layers);
    } else if (step === 2) {
      setActivePanel(MAP_PANEL_IDS.filters);
    } else if (step === 3) {
      setActivePanel(MAP_PANEL_IDS.insights);
      setVisualizationMode('cobertura');
    } else if (step === 4) {
      setActivePanel(MAP_PANEL_IDS.insights);
      setVisualizationMode('practicas_territorios');
      setInfluenceDisplayType('puntos');
    } else if (step === 5) {
      setActivePanel(MAP_PANEL_IDS.insights);
      setVisualizationMode('practicas_territorios');
      setInfluenceDisplayType('calor');
    } else if (step === 6) {
      setActivePanel(null);
      setSidebarTab('resumen');
    } else {
      setActivePanel(null);
    }
  }, [
    setVisualizationMode,
    setInfluenceDisplayType,
    setSidebarTab,
    setActiveCategory,
    setSelectedDept,
    setSelectedSonorousTerritory,
    setSelectedPractice,
    setHoveredDepartmentCard,
    setSelectedRecordDetail
  ]);

  useEffect(() => {
    // Open tutorial automatically if first time today!
    const lastShowDate = localStorage.getItem('pnmc_last_tutorial_date');
    const todayStr = new Date().toISOString().split('T')[0];
    if (lastShowDate !== todayStr) {
      setTutorialStep(0);
      setIsTutorialOpen(true);
      setVisualizationMode('cobertura');
      setInfluenceDisplayType('puntos');
    }
  }, [setVisualizationMode, setInfluenceDisplayType]);

  const handleTogglePanel = useCallback((panelId) => {
    if (panelId === MAP_PANEL_IDS.tutorial) {
      setTutorialStep(0);
      setIsTutorialOpen(true);
      setActivePanel(null);
      setVisualizationMode('cobertura');
      setInfluenceDisplayType('puntos');
      setActiveCategory('General');
      setSelectedDept('Nacional');
      setSelectedSonorousTerritory('Todos');
      setSelectedPractice('Todas');
      setHoveredDepartmentCard(null);
      setSelectedRecordDetail(null);
    } else {
      setActivePanel((current) => (current === panelId ? null : panelId));
    }
  }, [
    setVisualizationMode,
    setInfluenceDisplayType,
    setActiveCategory,
    setSelectedDept,
    setSelectedSonorousTerritory,
    setSelectedPractice,
    setHoveredDepartmentCard,
    setSelectedRecordDetail
  ]);

  const handleExportLayerCsv = useCallback(() => {
    const rows = Object.entries(activeDepartmentCounts || {})
      .map(([departmentName, count]) => ({
        department: getDepartmentDisplayName(departmentName),
        count: Number(count || 0),
      }))
      .sort((left, right) => right.count - left.count);
    const csv = [
      ['layer', 'department', 'count'],
      ...rows.map((row) => [activeCategory, row.department, String(row.count)]),
    ]
      .map((line) => line.map((value) => `"${String(value).replace(/"/g, '""')}"`).join(','))
      .join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `mapa-ecosistemico-${activeLayerConfig.id}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }, [activeCategory, activeDepartmentCounts, activeLayerConfig.id]);


  return (
    <div className="relative h-screen w-screen select-none overflow-hidden bg-slate-50 pt-20 text-left font-sans text-slate-900">
      <div className="relative flex h-[calc(100vh-5rem)] w-full overflow-hidden">
        <main className="relative h-full flex-1 bg-slate-100/40" id="mapa-workspace">
          {isLoading ? (
            <div className="absolute inset-0 z-10 flex flex-col items-center justify-center gap-4 text-[#291242]">
              <Loader2 className="animate-spin" size={32} />
              <span className="text-[0.6rem] uppercase tracking-widest font-bold">Preparando cartografía de Colombia...</span>
            </div>
          ) : geoData && paddedColombiaBounds ? (
            <div
              className={`h-full w-full transition-all duration-500 ${
                isTutorialOpen
                  ? ((tutorialStep === 3 || tutorialStep === 4 || tutorialStep === 5) ? '' : 'filter blur-[3.5px] opacity-65 pointer-events-none')
                  : ''
              }`}
            >
              <MapContainer
                className="map-edge-canvas"
                center={[4.5709, -74.2973]}
                zoom={5.5}
                style={{ height: '100%', width: '100%', background: 'transparent', zIndex: 1 }}
                zoomControl={false}
                attributionControl={false}
              >
                <TileLayer
                  url="https://{s}.basemaps.cartocdn.com/light_nolabels/{z}/{x}/{y}{r}.png"
                  subdomains="abcd"
                  opacity={0.55}
                  maxZoom={19}
                  keepBuffer={4}
                  updateWhenIdle={false}
                  className="map-basemap-washed"
                />
                {WORLD_COUNTRY_LABELS.filter((country) => country.name !== 'Colombia').map((country) => (
                  <Marker
                    key={country.name}
                    position={country.position}
                    icon={countryLabelIcon(country.name)}
                    interactive={false}
                  />
                ))}
                <MapInteractionManager
                  selectedDept={selectedDept}
                  geoData={geoData}
                  initialBounds={paddedColombiaBounds}
                  resetToken={mapResetToken}
                  visualizationMode={visualizationMode}
                  influenceDisplayType={influenceDisplayType}
                  activeCategory={activeCategory}
                />

                <MapZoomControls initialBounds={paddedColombiaBounds} />
                <GeoJSON
                  key={`base-layer-${activeCategory}-${visualizationMode}-${influenceDisplayType}-${activeAnalytics.totalRecords}-${activeAnalytics.activeDepartments}`}
                  ref={geoJsonRef}
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
                <GeoJSON
                  key={`hit-layer-${activeCategory}-${visualizationMode}-${influenceDisplayType}-${activeAnalytics.totalRecords}-${activeAnalytics.activeDepartments}`}
                  data={geoData}
                  filter={(feature) => getFeatureDepartmentNormalizedName(feature) !== ARCHIPELAGO_NORMALIZED_NAME}
                  style={() => DEPARTMENT_HIT_AREA_STYLE}
                  onEachFeature={(feature, layer) => {
                    const deptName = getFeatureDepartmentName(feature);
                    const normalized = getFeatureDepartmentNormalizedName(feature);
                    const departmentStats = departmentSummaryByDepartment[normalized] || EMPTY_DEPARTMENT_SUMMARY;
                    layer.on({
                      mouseover: () => setHoveredDepartmentCard({ deptName, stats: departmentStats }),
                      mouseout: () => setHoveredDepartmentCard(null),
                      click: () => {
                        handleDepartmentDrilldown(deptName);
                      },
                    });
                  }}
                />
                {selectedDept !== 'Nacional' && currentDeptMunicipalities && (
                  <GeoJSON
                    key={`municipalities-${selectedDept}-${activeCategory}-${visualizationMode}-${influenceDisplayType}-${activeMunicipalityCounts ? 'ready' : 'loading'}`}
                    data={currentDeptMunicipalities}
                    style={getMunicipalityStyle}
                    onEachFeature={(feature, layer) => {
                      const munName = feature.properties?.municipalityName || 'Municipio';
                      const munCode = feature.properties?.municipalityCode;
                      const nameKey = munName.toLowerCase().trim();
                      const count = (activeMunicipalityCounts[munCode] || 0) + (activeMunicipalityCounts[nameKey] || 0);

                      const tooltipContent = `<div class="municipality-tooltip">
                        <p class="tooltip-title">${munName}</p>
                        <p class="tooltip-value">${count} ${count === 1 ? 'proceso' : 'procesos'} registrado${count === 1 ? '' : 's'}</p>
                      </div>`;

                      layer.bindTooltip(tooltipContent, {
                        sticky: true,
                        direction: 'auto',
                        className: 'custom-municipality-tooltip',
                      });
                    }}
                  />
                )}
                {enlargedArchipelagoFeature && (
                  <GeoJSON
                    key={`archipelago-${activeCategory}-${visualizationMode}-${influenceDisplayType}-${archipelagoCount}-${archipelagoIsSelected ? 'selected' : 'base'}`}
                    data={enlargedArchipelagoFeature}
                    style={() => archipelagoVisualStyle}
                    onEachFeature={(_, layer) => {
                      layer.bindTooltip('<span class="archipelago-label-line">Archipiélago de San Andrés,</span><span class="archipelago-label-line">Providencia y Santa Catalina</span>', {
                        permanent: true,
                        direction: 'right',
                        className: 'archipelago-label',
                        opacity: 1,
                        offset: [18, 0],
                      });
                      layer.on({
                        mouseover: () => setHoveredDepartmentCard({
                          deptName: 'Archipiélago de San Andrés, Providencia y Santa Catalina',
                          stats: archipelagoSummary,
                        }),
                        mouseout: () => setHoveredDepartmentCard(null),
                        click: () => {
                          handleDepartmentDrilldown('San Andrés y Providencia');
                        },
                      });
                    }}
                  />
                )}
                {/* SVG Gaussian Blur Filter for high-fidelity Heatmap blobs */}
                <style>{`
                  .glow-marker-calor-halo {
                    filter: blur(28px);
                    pointer-events: none;
                  }
                  .glow-marker-calor-core {
                    filter: blur(10px);
                    pointer-events: none;
                  }
                `}</style>

                {visualizationMode === 'practicas_territorios' && influenceDisplayType === 'puntos' && thematicPoints.map((point) => (
                  <CircleMarker
                    key={point.id}
                    center={[point.lat, point.lng]}
                    radius={8}
                    pathOptions={{
                      fillColor: point.color,
                      fillOpacity: 0.65,
                      color: '#291242',
                      weight: 1.2,
                    }}
                  >
                    <Tooltip sticky direction="top" className="custom-municipality-tooltip">
                      <div className="municipality-tooltip">
                        <p class="tooltip-title">{point.recordName}</p>
                        <p class="tooltip-value">{point.category} · <span className="font-bold text-[9px]" style={{ color: point.color }}>{point.label}</span></p>
                      </div>
                    </Tooltip>
                  </CircleMarker>
                ))}

                {visualizationMode === 'practicas_territorios' && influenceDisplayType === 'calor' && thematicPoints.map((point, index) => (
                  <React.Fragment key={`heat-${point.id || index}`}>
                    {/* Outer glowing halo */}
                    <Circle
                      interactive={false}
                      center={[point.lat, point.lng]}
                      radius={85000}
                      pathOptions={{
                        fillColor: point.color,
                        fillOpacity: 0.28,
                        color: 'transparent',
                        weight: 0,
                        className: 'glow-marker-calor-halo'
                      }}
                    />
                    {/* Inner intense glowing core */}
                    <Circle
                      interactive={false}
                      center={[point.lat, point.lng]}
                      radius={38000}
                      pathOptions={{
                        fillColor: point.color,
                        fillOpacity: 0.55,
                        color: 'transparent',
                        weight: 0,
                        className: 'glow-marker-calor-core'
                      }}
                    />
                  </React.Fragment>
                ))}
              </MapContainer>
            </div>
          ) : (
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="max-w-md rounded-2xl border border-slate-200 bg-white p-6 text-center shadow-sm">
                <p className="text-[11px] font-bold uppercase tracking-widest text-slate-500">No fue posible cargar la cartografía.</p>
                {mapError ? <p className="mt-3 text-sm text-slate-500">{mapError}</p> : null}
              </div>
            </div>
          )}

          <section className={`pointer-events-none absolute left-6 top-6 z-[401] w-[340px] rounded-2xl border bg-white/95 px-4 py-3 shadow-md backdrop-blur-md animate-in fade-in duration-200 transition-all duration-500 ${
            isTutorialOpen ? 'filter blur-[3.5px] opacity-45 pointer-events-none' : ''
          } ${
            hoveredDepartmentCard ? 'border-slate-200/80 border-solid' : 'border-dashed border-slate-300'
          }`}>
            {hoveredDepartmentCard ? (
              <div className="flex items-start gap-2">
                <MapPin size={15} className="mt-0.5 flex-shrink-0 text-[#291242]" />
                <div className="min-w-0">
                  <p className="truncate text-[12px] font-extrabold uppercase text-[#291242]">{hoveredDepartmentCard.deptName}</p>
                  <p className="mt-1 text-[11px] leading-relaxed text-slate-500">
                    {formatMetricValue(hoveredDepartmentCard.stats.totalRecords)} registros · {formatMetricValue(hoveredDepartmentCard.stats.schoolCount)} escuelas · {formatMetricValue(hoveredDepartmentCard.stats.festivalCount)} festivales · {formatMetricValue(hoveredDepartmentCard.stats.marketCount)} mercados
                  </p>
                </div>
              </div>
            ) : (
              <div className="flex items-start gap-2">
                <Info size={15} className="mt-0.5 flex-shrink-0 text-slate-400" />
                <p className="text-[11px] leading-relaxed text-slate-500">
                  Pasa el cursor sobre un departamento para ver su ficha técnica rápida. Haz clic para fijar el análisis en este panel.
                </p>
              </div>
            )}
          </section>

          <section className={`pointer-events-auto absolute bottom-6 left-6 z-[401] w-[240px] rounded-2xl border border-slate-200/80 bg-white/95 p-3 shadow-md backdrop-blur-md transition-all duration-500 ${
            isTutorialOpen ? 'filter blur-[3.5px] opacity-45 pointer-events-none' : ''
          }`}>
            <p className="text-[9px] font-bold uppercase tracking-widest text-slate-400">Leyenda de Colores</p>
            <div className="mt-2 max-h-[175px] overflow-y-auto pr-1 space-y-1.5 scrollbar-thin scrollbar-thumb-slate-300">
              {visualizationMode === 'practicas_territorios' ? (
                <>
                  {activeLegendItems.map((item) => (
                    <div key={item.label} className="flex items-center gap-2">
                      <span className="h-2.5 w-2.5 rounded-full flex-shrink-0 border border-slate-300" style={{ backgroundColor: item.color }} />
                      <span className="text-[9px] font-semibold uppercase tracking-wider text-slate-600 truncate" title={item.label}>{item.label}</span>
                    </div>
                  ))}
                  <div className="flex items-center gap-2 pt-1 border-t border-slate-100">
                    <span className="h-2.5 w-2.5 rounded bg-[#e2e8f0]/40 border border-slate-200" />
                    <span className="text-[9px] font-bold uppercase tracking-widest text-slate-400">Fuera de influencia</span>
                  </div>
                </>
              ) : (
                <>
                  {activeLegendItems.slice().reverse().map((item) => (
                    <div key={item.label} className="flex items-center gap-2">
                      <span className="h-2.5 w-2.5 rounded" style={{ backgroundColor: item.color }} />
                      <span className="text-[10px] font-bold uppercase tracking-widest text-slate-500">{item.label}</span>
                    </div>
                  ))}
                  <div className="flex items-center gap-2">
                    <span className="h-2.5 w-2.5 rounded bg-[#1f1633]" />
                    <span className="text-[10px] font-bold uppercase tracking-widest text-slate-500">Sin cobertura</span>
                  </div>
                </>
              )}
            </div>
          </section>

          <MapEdgeToolbar
            activePanel={activePanel}
            onTogglePanel={handleTogglePanel}
            onPrint={() => window.print()}
          />

          {activePanel === MAP_PANEL_IDS.layers && (
            <MapEdgeOverlayPanel
              title="Capas"
              subtitle="Activa una dimensión del ecosistema para enfocar la lectura del mapa."
              onClose={() => setActivePanel(null)}
            >
              <div className="space-y-2">
                {MAP_LAYERS_CONFIG.map((layer) => (
                  <button
                    key={layer.id}
                    type="button"
                    onClick={() => setActiveCategory(layer.layerKey)}
                    className={`w-full rounded-xl border px-3 py-3 text-left transition-all ${
                      activeCategory === layer.layerKey
                        ? 'border-[#291242] bg-[#291242] text-white'
                        : 'border-slate-200 bg-white text-slate-700 hover:border-slate-300'
                    }`}
                  >
                    <div className="flex items-center justify-between gap-3">
                      <p className="text-[10px] font-bold uppercase tracking-widest">{layer.label}</p>
                      <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: layer.color }} />
                    </div>
                    <p className={`mt-1.5 text-[11px] leading-relaxed ${activeCategory === layer.layerKey ? 'text-slate-200' : 'text-slate-500'}`}>
                      {layer.description}
                    </p>
                  </button>
                ))}
              </div>
            </MapEdgeOverlayPanel>
          )}

          {activePanel === MAP_PANEL_IDS.filters && (
            <MapEdgeOverlayPanel title="Filtros" subtitle="Refina la lectura territorial." onClose={() => setActivePanel(null)}>
              <div className="space-y-4">
                <label className="block">
                  <span className="text-[9px] font-bold uppercase tracking-widest text-slate-400">Departamento</span>
                  <select
                    value={selectedDept}
                    onChange={(event) => setSelectedDept(event.target.value)}
                    className="mt-1.5 h-10 w-full rounded-xl border border-slate-200 bg-white px-3 text-[11px] font-bold uppercase text-[#291242] outline-none focus:border-[#291242]"
                  >
                    {departmentsList.map((department) => (
                      <option key={department} value={department}>{department}</option>
                    ))}
                  </select>
                </label>

                <label className="block">
                  <span className="text-[9px] font-bold uppercase tracking-widest text-slate-400">Territorio Sonoro</span>
                  <select
                    value={selectedSonorousTerritory}
                    onChange={(event) => setSelectedSonorousTerritory(event.target.value)}
                    className="mt-1.5 h-10 w-full rounded-xl border border-slate-200 bg-white px-3 text-[11px] font-bold uppercase text-[#291242] outline-none focus:border-[#291242]"
                  >
                    <option value="Todos">Todos</option>
                    {TERRITORIOS_SONOROS_LIST.map((opt) => (
                      <option key={opt} value={opt}>{opt}</option>
                    ))}
                  </select>
                </label>

                <label className="block">
                  <span className="text-[9px] font-bold uppercase tracking-widest text-slate-400">Práctica / Género</span>
                  <select
                    value={selectedPractice}
                    onChange={(event) => setSelectedPractice(event.target.value)}
                    className="mt-1.5 h-10 w-full rounded-xl border border-slate-200 bg-white px-3 text-[11px] font-bold uppercase text-[#291242] outline-none focus:border-[#291242]"
                  >
                    <option value="Todas">Todas</option>
                    {PRACTICAS_MUSICALES_LIST.map((opt) => (
                      <option key={opt} value={opt}>{opt}</option>
                    ))}
                  </select>
                </label>

                <button
                  type="button"
                  onClick={handleReturnToNationalView}
                  className="flex h-10 w-full items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white text-[10px] font-bold uppercase tracking-widest text-slate-600 hover:text-[#291242]"
                >
                  <RotateCcw size={14} />
                  Vista nacional
                </button>
              </div>
            </MapEdgeOverlayPanel>
          )}

          {activePanel === MAP_PANEL_IDS.insights && (
            <MapEdgeOverlayPanel
              title="Modos de visualización"
              subtitle="Elige cómo deseas proyectar la cartografía del ecosistema."
              onClose={() => setActivePanel(null)}
            >
              <div className="space-y-4">
                {/* Mode Selectors */}
                <div className="space-y-2">
                  <button
                    type="button"
                    onClick={() => {
                      setVisualizationMode('cobertura');
                    }}
                    className={`w-full rounded-xl border px-3 py-3 text-left transition-all ${
                      visualizationMode === 'cobertura'
                        ? 'border-[#291242] bg-[#291242] text-white shadow-sm'
                        : 'border-slate-200 bg-white text-slate-700 hover:border-slate-300'
                    }`}
                  >
                    <p className="text-[10px] font-bold uppercase tracking-widest">Modo Cobertura (Densidad)</p>
                    <p className={`mt-1.5 text-[11px] leading-relaxed ${visualizationMode === 'cobertura' ? 'text-slate-200' : 'text-slate-500'}`}>
                      Muestra la distribución de procesos mediante un degradado coroplético tradicional.
                    </p>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setVisualizationMode('practicas_territorios');
                      setSelectedSonorousTerritory('Todos');
                      setSelectedPractice('Todas');
                    }}
                    className={`w-full rounded-xl border px-3 py-3 text-left transition-all ${
                      visualizationMode === 'practicas_territorios'
                        ? 'border-[#291242] bg-[#291242] text-white shadow-sm'
                        : 'border-slate-200 bg-white text-slate-700 hover:border-slate-300'
                    }`}
                  >
                    <p className="text-[10px] font-bold uppercase tracking-widest">Modo de Prácticas y Territorios (Influencia)</p>
                    <p className={`mt-1.5 text-[11px] leading-relaxed ${visualizationMode === 'practicas_territorios' ? 'text-slate-200' : 'text-slate-500'}`}>
                      Proyecta regiones específicas de influencia y saberes a través de manchas de color.
                    </p>
                  </button>
                </div>

                {/* Suboptions for Thematic Mode */}
                {visualizationMode === 'practicas_territorios' && (
                  <div className="rounded-2xl border border-slate-100 bg-slate-50/50 p-3.5 space-y-4 animate-in fade-in duration-200">
                    <div className="flex rounded-xl bg-slate-100 p-1">
                      <button
                        type="button"
                        onClick={() => setActiveThematicOption('territorio')}
                        className={`flex-1 rounded-lg py-1.5 text-center text-[9px] font-bold uppercase tracking-wider transition-all ${
                          activeThematicOption === 'territorio'
                            ? 'bg-white text-[#291242] shadow-sm'
                            : 'text-slate-500 hover:text-[#291242]'
                        }`}
                      >
                        Territorio Sonoro
                      </button>
                      <button
                        type="button"
                        onClick={() => setActiveThematicOption('practica')}
                        className={`flex-1 rounded-lg py-1.5 text-center text-[9px] font-bold uppercase tracking-wider transition-all ${
                          activeThematicOption === 'practica'
                            ? 'bg-white text-[#291242] shadow-sm'
                            : 'text-slate-500 hover:text-[#291242]'
                        }`}
                      >
                        Práctica / Género
                      </button>
                    </div>

                    <div className="space-y-1">
                      <span className="text-[9px] font-bold uppercase tracking-widest text-slate-400">Tipo de Visualización</span>
                      <div className="flex rounded-xl bg-slate-200/60 p-1 mt-1">
                        <button
                          type="button"
                          onClick={() => setInfluenceDisplayType('puntos')}
                          className={`flex-1 rounded-lg py-1.5 text-center text-[8.5px] font-bold uppercase tracking-wider transition-all ${
                            influenceDisplayType === 'puntos'
                              ? 'bg-white text-[#291242] shadow-sm'
                              : 'text-slate-500 hover:text-[#291242]'
                          }`}
                        >
                          Puntos y Zonas
                        </button>
                        <button
                          type="button"
                          onClick={() => setInfluenceDisplayType('calor')}
                          className={`flex-1 rounded-lg py-1.5 text-center text-[8.5px] font-bold uppercase tracking-wider transition-all ${
                            influenceDisplayType === 'calor'
                              ? 'bg-white text-[#291242] shadow-sm'
                              : 'text-slate-500 hover:text-[#291242]'
                          }`}
                        >
                          Mapa de Calor
                        </button>
                      </div>
                    </div>

                    {activeThematicOption === 'territorio' ? (
                      <label className="block">
                        <span className="text-[9px] font-bold uppercase tracking-widest text-slate-400">Seleccionar Territorio</span>
                        <select
                          value={selectedSonorousTerritory}
                          onChange={(event) => setSelectedSonorousTerritory(event.target.value)}
                          className="mt-1.5 h-10 w-full rounded-xl border border-slate-200 bg-white px-3 text-[11px] font-bold uppercase text-[#291242] outline-none focus:border-[#291242]"
                        >
                          <option value="Todos">Ver Todos los Territorios</option>
                          {TERRITORIOS_SONOROS_LIST.map((opt) => (
                            <option key={opt} value={opt}>{opt}</option>
                          ))}
                        </select>
                      </label>
                    ) : (
                      <label className="block">
                        <span className="text-[9px] font-bold uppercase tracking-widest text-slate-400">Seleccionar Práctica</span>
                        <select
                          value={selectedPractice}
                          onChange={(event) => setSelectedPractice(event.target.value)}
                          className="mt-1.5 h-10 w-full rounded-xl border border-slate-200 bg-white px-3 text-[11px] font-bold uppercase text-[#291242] outline-none focus:border-[#291242]"
                        >
                          <option value="Todas">Ver Todas las Prácticas</option>
                          {PRACTICAS_MUSICALES_LIST.map((opt) => (
                            <option key={opt} value={opt}>{opt}</option>
                          ))}
                        </select>
                      </label>
                    )}
                  </div>
                )}
              </div>
            </MapEdgeOverlayPanel>
          )}

          {activePanel === MAP_PANEL_IDS.export && (
            <MapEdgeOverlayPanel title="Exportar" subtitle="Acciones rápidas para reporte." onClose={() => setActivePanel(null)}>
              <div className="space-y-2">
                <button
                  type="button"
                  onClick={handleExportLayerCsv}
                  className="flex w-full items-center justify-center gap-2 rounded-xl bg-[#291242] px-4 py-3 text-[10px] font-bold uppercase tracking-widest text-white hover:bg-[#3b1a5c]"
                >
                  <FileDown size={14} />
                  Exportar CSV
                </button>
                <button
                  type="button"
                  onClick={() => window.print()}
                  className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-[10px] font-bold uppercase tracking-widest text-slate-600 hover:text-[#291242]"
                >
                  Imprimir visualización
                </button>
              </div>
            </MapEdgeOverlayPanel>
          )}

          {activePanel === MAP_PANEL_IDS.registration && (
            <MapEdgeOverlayPanel
              title="Registrar procesos"
              subtitle="Participa en la construcción de la cartografía interactiva de la música colombiana."
              onClose={() => setActivePanel(null)}
            >
              <div className="space-y-4 text-left">
                <div className="flex items-center justify-center rounded-2xl bg-emerald-50 p-6 text-emerald-600 border border-emerald-100 shadow-[0_0_15px_rgba(16,185,129,0.06)] animate-in zoom-in duration-300">
                  <Mail size={32} className="animate-pulse" />
                </div>
                <div className="space-y-2">
                  <p className="text-[9px] font-bold uppercase tracking-widest text-slate-400">¿Cómo funciona?</p>
                  <p className="text-[11px] leading-relaxed text-slate-500">
                    El Plan Nacional de Música para la Convivencia (PNMC) invita a todos los agentes musicales del país (festivales, escuelas de música, mercados, redes y lutieres) a ser visibles.
                  </p>
                  <p className="text-[11px] leading-relaxed text-slate-500">
                    Inscribe tu proceso en el sistema oficial para enriquecer este mapeo ecosistémico y fortalecer la circulación y gobernanza musical.
                  </p>
                </div>
                
                <button
                  type="button"
                  onClick={() => {
                    setActivePanel(null);
                    onOpenParticipation();
                  }}
                  className="flex w-full items-center justify-center gap-2 rounded-xl bg-emerald-600 px-4 py-3 text-[10px] font-bold uppercase tracking-widest text-white transition hover:bg-emerald-700 shadow-md focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2"
                >
                  Registrar procesos
                  <ArrowRight size={14} />
                </button>
              </div>
            </MapEdgeOverlayPanel>
          )}

          {isTutorialOpen && (
            <div
              className={
                tutorialStep === 0
                  ? "fixed inset-0 z-[9999] flex items-center justify-center bg-slate-950/40 backdrop-blur-[1.5px] animate-in fade-in duration-300 pointer-events-auto"
                  : "fixed inset-x-0 bottom-10 z-[9999] flex items-center justify-center pointer-events-none animate-in slide-in-from-bottom-5 duration-300"
              }
            >
              <div
                className={
                  tutorialStep === 0
                    ? "relative w-[380px] rounded-3xl border border-slate-100 bg-white/95 p-6 shadow-2xl backdrop-blur-md animate-in zoom-in-95 duration-300 pointer-events-auto"
                    : "relative w-[440px] rounded-3xl border border-slate-200 bg-white/95 p-5 shadow-2xl backdrop-blur-md pointer-events-auto"
                }
              >
                
                {/* Step indicator */}
                <div className="flex items-center justify-between">
                  <span className="rounded-full bg-slate-100 px-3 py-1 text-[9px] font-bold uppercase tracking-wider text-slate-500">
                    Tutorial · Paso {tutorialStep + 1} de {TUTORIAL_STEPS.length}
                  </span>
                  <button
                    type="button"
                    onClick={handleCloseTutorial}
                    className="rounded-full p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition-colors"
                  >
                    <X size={14} />
                  </button>
                </div>

                {/* Dynamic Step Content */}
                <div className="mt-5 space-y-3">
                  <div className="flex items-center gap-3">
                    <div className="flex h-9 w-9 items-center justify-center rounded-2xl bg-[#291242]/5 text-[#291242]">
                      {React.createElement(TUTORIAL_STEPS[tutorialStep].Icon, { size: 18 })}
                    </div>
                    <h3 className="text-sm font-extrabold uppercase tracking-wide text-[#291242]">
                      {TUTORIAL_STEPS[tutorialStep].title}
                    </h3>
                  </div>
                  <p className="text-[11.5px] leading-relaxed text-slate-600">
                    {tutorialStep === 0 ? getWebText('map_description') : TUTORIAL_STEPS[tutorialStep].description}
                  </p>
                </div>

                {/* Step Progress Dots */}
                <div className="mt-6 flex items-center justify-between border-t border-slate-100 pt-4">
                  <div className="flex gap-1.5">
                    {TUTORIAL_STEPS.map((_, i) => (
                      <span
                        key={i}
                        className={`h-1.5 rounded-full transition-all duration-300 ${
                          i === tutorialStep ? 'w-4 bg-[#291242]' : 'w-1.5 bg-slate-200'
                        }`}
                      />
                    ))}
                  </div>

                  <div className="flex gap-2">
                    {tutorialStep > 0 && (
                      <button
                        type="button"
                        onClick={() => handleGoToStep(tutorialStep - 1)}
                        className="rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-[9px] font-bold uppercase tracking-wider text-slate-600 hover:text-[#291242] transition-colors"
                      >
                        Atrás
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={
                        tutorialStep < TUTORIAL_STEPS.length - 1
                          ? () => handleGoToStep(tutorialStep + 1)
                          : handleCloseTutorial
                      }
                      className="rounded-xl bg-[#291242] px-4 py-1.5 text-[9px] font-bold uppercase tracking-wider text-white shadow-md shadow-[#291242]/20 hover:bg-[#3d1b61] transition-all"
                    >
                      {tutorialStep < TUTORIAL_STEPS.length - 1 ? 'Siguiente' : 'Finalizar'}
                    </button>
                  </div>
                </div>

              </div>
            </div>
          )}
        </main>

        <aside
          className={`relative z-[1000] flex h-full w-[380px] flex-shrink-0 flex-col border-l border-slate-200 bg-white shadow-xl transition-all duration-500 ${
            isTutorialOpen
              ? (tutorialStep === 6
                  ? 'ring-4 ring-[#291242]/20 z-[9998]'
                  : 'filter blur-[3.5px] opacity-45 pointer-events-none')
              : ''
          }`}
        >
          <header className="flex-shrink-0 border-b border-slate-100 px-5 py-4">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="text-[9px] font-bold uppercase tracking-widest text-slate-400">Territorio activo</p>
                <h2 className="mt-1 truncate text-xl font-extrabold uppercase leading-tight text-[#291242]">
                  {selectedDepartmentDisplayName}
                </h2>
              </div>
              {selectedDept !== 'Nacional' ? (
                <button
                  type="button"
                  onClick={handleReturnToNationalView}
                  className="flex h-9 flex-shrink-0 items-center gap-1.5 rounded-xl bg-[#291242] px-3.5 text-[9px] font-extrabold uppercase tracking-widest text-white shadow-md shadow-[#291242]/20 hover:bg-[#3d1b61] active:scale-95 transition-all cursor-pointer"
                >
                  <RotateCcw size={13} className="text-white" />
                  Nacional
                </button>
              ) : null}
            </div>

            <div className="mt-4 rounded-2xl border border-slate-200/80 bg-slate-50 px-3 py-3">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <p className="text-[9px] font-bold uppercase tracking-widest text-slate-400">Procesos registrados</p>
                  <p className="mt-1 text-2xl font-extrabold leading-none text-[#291242]">{formatMetricValue(territorialPulse.totalRecords)}</p>
                </div>
                <div>
                  <p className="text-[9px] font-bold uppercase tracking-widest text-slate-400">{territorialPulse.impactedLabel}</p>
                  <p className="mt-1 text-2xl font-extrabold leading-none text-[#291242]">{formatMetricValue(territorialPulse.impactedCount)}</p>
                </div>
              </div>
              <div className="mt-3 border-t border-slate-200/80 pt-3">
                <p className="text-[9px] font-bold uppercase tracking-widest text-slate-400">Capas territoriales</p>
                <div className="mt-2 grid grid-cols-3 gap-x-2 gap-y-3">
                  {territorialPulse.layerItems.map((item) => (
                    <div key={item.key} className="min-w-0">
                      <div className="flex items-center gap-1.5">
                        <span className="h-2 w-2 rounded-full flex-shrink-0" style={{ backgroundColor: item.color }} />
                        <span className="truncate text-[9px] font-bold uppercase tracking-[0.12em] text-slate-400">{item.label}</span>
                      </div>
                      <p className="mt-1 text-sm font-extrabold text-[#291242]">{formatMetricValue(item.value)}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="mt-4 grid grid-cols-3 rounded-xl bg-slate-100 p-1">
              {[
                { id: 'resumen', label: 'Resumen' },
                { id: 'registros', label: 'Recientes' },
                { id: 'directorio', label: 'Directorio' },
              ].map((tab) => (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setSidebarTab(tab.id)}
                  className={`h-9 rounded-lg text-[9px] font-bold uppercase tracking-wider transition-all ${
                    sidebarTab === tab.id
                      ? 'bg-white text-[#291242] shadow-sm'
                      : 'text-slate-500 hover:text-[#291242]'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>
          </header>

          <div className="flex-1 overflow-y-auto bg-slate-50/50 px-5 py-4 custom-scrollbar">
            {sidebarTab === 'resumen' && (
              <div className="space-y-3">
                {summaryCards.map((card) => (
                  <DataCard key={card.label} {...card} />
                ))}
                <article className="rounded-xl border border-slate-200/80 bg-white px-3 py-3 shadow-sm">
                  <p className="text-[9px] font-bold uppercase tracking-widest text-slate-400">Nota de capa</p>
                  <p className="mt-2 text-[12px] leading-relaxed text-slate-600">{activeInfoNote}</p>
                  <div className="mt-3 flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-slate-400">
                    <Database size={13} />
                    {schoolLayerReady && marketLayerReady ? 'Datos sincronizados' : 'Sincronizando capas'}
                  </div>
                </article>
              </div>
            )}

            {sidebarTab === 'registros' && (
              selectedDept === 'Nacional' ? (
                <div className="space-y-2">
                  <div className="mb-3 flex items-center gap-2 text-slate-400">
                    <Search size={14} />
                    <p className="text-[9px] font-bold uppercase tracking-widest">Ranking nacional por presencia</p>
                  </div>
                  {technicalDepartmentRows.slice(0, 14).map((row, index) => {
                    const metricValue = isGeneralLayer
                      ? row.totalRecords
                      : isSchoolsLayer
                      ? row.schoolCount
                      : isMarketsLayer
                      ? row.marketCount
                      : row.festivalCount;

                    return (
                      <button
                        key={row.departmentKey}
                        type="button"
                        onClick={() => handleDepartmentDrilldown(row.departmentKey)}
                        className="flex w-full items-center justify-between gap-3 rounded-xl border border-slate-200/80 bg-white px-3 py-2.5 text-left shadow-sm hover:border-slate-300"
                      >
                        <span className="flex min-w-0 items-center gap-2">
                          <span className="flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-lg bg-slate-100 text-[10px] font-extrabold text-[#291242]">
                            {index + 1}
                          </span>
                          <span className="truncate text-[12px] font-bold uppercase text-[#291242]">{row.departmentLabel}</span>
                        </span>
                        <span className="text-[12px] font-extrabold text-slate-500">{formatMetricValue(metricValue)}</span>
                      </button>
                    );
                  })}
                </div>
              ) : (
                <div className="space-y-2">
                  {visibleRecords.length > 0 ? visibleRecords.map((record, index) => (
                    <RecordCard
                      key={`${record.type}-${record.name}-${index}`}
                      eyebrow={record.type}
                      title={record.name}
                      meta={record.meta}
                      onClick={() => setSelectedRecordDetail(record)}
                    />
                  )) : (
                    <div className="rounded-xl border border-dashed border-slate-300 bg-white px-4 py-6 text-center">
                      <p className="text-[11px] font-bold uppercase tracking-widest text-slate-400">Sin registros locales visibles</p>
                    </div>
                  )}
                </div>
              )
            )}

            {sidebarTab === 'directorio' && (
              <div className="space-y-4">
                {/* Scroll horizontal de píldoras de categorías */}
                <div className="flex gap-2 overflow-x-auto pb-2.5 thin-horizontal-scrollbar">
                  {[
                    { id: 'Todos', label: 'Todos', color: '#059669', bgActive: 'bg-emerald-50 text-emerald-700 ring-emerald-600/20' },
                    { id: 'Festivales', label: 'Festivales', color: '#9333ea', bgActive: 'bg-purple-50 text-purple-700 ring-purple-600/20' },
                    { id: 'Escuelas', label: 'Escuelas', color: '#0284c7', bgActive: 'bg-sky-50 text-sky-700 ring-sky-600/20' },
                    { id: 'Mercados', label: 'Mercados', color: '#d97706', bgActive: 'bg-amber-50 text-amber-700 ring-amber-600/20' },
                    { id: 'Redes', label: 'Redes Doc.', color: '#db2777', bgActive: 'bg-pink-50 text-pink-700 ring-pink-600/20' },
                    { id: 'Lutieres', label: 'Lutieres', color: '#0d9488', bgActive: 'bg-teal-50 text-teal-700 ring-teal-600/20' },
                  ].map((pill) => {
                    const isActive = directoryCategory === pill.id;
                    const count = directoryCounts[pill.id] || 0;
                    return (
                      <button
                        key={pill.id}
                        type="button"
                        onClick={() => setDirectoryCategory(pill.id)}
                        className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-[9px] font-extrabold uppercase tracking-wider ring-1 ring-inset transition-all flex-shrink-0 ${
                          isActive
                            ? `${pill.bgActive} shadow-sm`
                            : 'bg-white text-slate-500 ring-slate-200 hover:text-[#291242] hover:bg-slate-50'
                        }`}
                      >
                        <span className="h-1.5 w-1.5 rounded-full" style={{ backgroundColor: pill.color }} />
                        {pill.label}
                        <span className={`ml-0.5 rounded-md px-1 py-0.5 text-[8px] font-bold ${isActive ? 'bg-white/60' : 'bg-slate-100 text-slate-600'}`}>
                          {count}
                        </span>
                      </button>
                    );
                  })}
                </div>

                {/* Buscador inteligente */}
                <div className="relative rounded-xl shadow-sm">
                  <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 text-slate-400">
                    <Search size={13} />
                  </div>
                  <input
                    type="text"
                    value={directoryQuery}
                    onChange={(e) => setDirectoryQuery(e.target.value)}
                    placeholder={`Buscar en ${directoryCategory === 'Todos' ? 'todo el directorio' : directoryCategory.toLowerCase()}...`}
                    className="block w-full rounded-xl border border-slate-200/80 bg-white py-2.5 pl-9 pr-8 text-xs text-[#291242] placeholder-slate-400 focus:border-slate-300 focus:outline-none focus:ring-1 focus:ring-slate-300 transition-all font-semibold"
                  />
                  {directoryQuery && (
                    <button
                      type="button"
                      onClick={() => setDirectoryQuery('')}
                      className="absolute inset-y-0 right-0 flex items-center pr-3 text-slate-400 hover:text-slate-600"
                    >
                      <X size={13} />
                    </button>
                  )}
                </div>

                {/* Listado de tarjetas de registros */}
                <div className="space-y-2">
                  {filteredDirectoryRecords.slice(0, directoryLimit).length > 0 ? (
                    filteredDirectoryRecords.slice(0, directoryLimit).map((item, idx) => (
                      <button
                        key={`${item.type}-${item.name}-${idx}`}
                        type="button"
                        onClick={() => {
                          setSelectedRecordDetail(item);
                        }}
                        className="group relative flex w-full flex-col items-start rounded-2xl border border-slate-200/80 bg-white p-3.5 text-left shadow-sm transition-all duration-300 hover:-translate-y-[1.5px] hover:border-slate-300 hover:shadow-md"
                      >
                        <span className="flex w-full items-center justify-between gap-2">
                          <span
                            className="inline-flex items-center rounded px-1.5 py-0.5 text-[8px] font-extrabold uppercase tracking-wider"
                            style={{
                              backgroundColor: `${item.color}15`,
                              color: item.color,
                            }}
                          >
                            {item.type}
                          </span>
                          {selectedDept === 'Nacional' && item.department && (
                            <span className="text-[9px] font-extrabold uppercase tracking-wide text-slate-400">
                              {item.department}
                            </span>
                          )}
                        </span>
                        <h4 className="mt-2 text-[11px] font-bold text-[#291242] leading-snug group-hover:text-[#4f267a] transition-all">
                          {item.name}
                        </h4>
                        <p className="mt-1 text-[9px] font-semibold text-slate-500 line-clamp-2 leading-relaxed">
                          {item.meta}
                        </p>
                      </button>
                    ))
                  ) : (
                    <div className="rounded-2xl border border-dashed border-slate-300 bg-white px-4 py-8 text-center shadow-sm">
                      <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">
                        Sin registros encontrados
                      </p>
                      <p className="mt-1 text-[9px] leading-relaxed text-slate-500">
                        Intenta cambiando la categoría o ajustando los términos de búsqueda.
                      </p>
                    </div>
                  )}
                </div>

                {/* Botón de carga progresiva */}
                {filteredDirectoryRecords.length > directoryLimit && (
                  <button
                    type="button"
                    onClick={() => setDirectoryLimit((prev) => prev + 12)}
                    className="mt-2 flex w-full items-center justify-center gap-1.5 rounded-xl border border-slate-200 bg-white py-2.5 text-[9px] font-bold uppercase tracking-wider text-slate-500 hover:bg-slate-50 hover:text-[#291242] transition-all shadow-sm"
                  >
                    Ver más registros ({filteredDirectoryRecords.length - directoryLimit} restantes)
                  </button>
                )}
              </div>
            )}
          </div>


        </aside>
      </div>

      {selectedRecordDetail ? (
        <div className="fixed inset-0 z-[3200] flex items-center justify-center bg-[#0f172a]/50 p-4 backdrop-blur-sm">
          <section className="w-[min(92vw,680px)] overflow-hidden rounded-[2.5rem] border border-white/20 bg-white/95 backdrop-blur-xl shadow-2xl">
            <header className="relative overflow-hidden bg-gradient-to-br from-[#291242] to-[#361757] px-8 py-8 text-white">
              <div className="relative flex items-start justify-between gap-5">
                <div className="min-w-0 flex-1">
                  <p className="text-[0.52rem] font-bold uppercase tracking-[0.25em] text-[#8BF784]">
                    Detalle de {selectedRecordDetail.type}
                  </p>
                  {selectedRecordDetail.type === 'Festival' ? (
                    <>
                      <h3 className="mt-3 font-alternate text-[1.4rem] font-bold uppercase leading-tight text-white tracking-wide">
                        {selectedRecordDetail.name || 'Festival sin nombre visible'}
                        {(() => {
                          const record = selectedRecordDetail.record || {};
                          const loc = [record.municipality || record.municipio, record.department || record.departamento].filter(Boolean).join(', ');
                          return loc ? ` (${loc})` : '';
                        })()}
                      </h3>
                      {selectedRecordDetail.record?.organizer && (
                        <p className="mt-2.5 text-[0.82rem] font-semibold text-slate-200">
                          Organiza: {selectedRecordDetail.record.organizer}
                        </p>
                      )}
                      {selectedRecordDetail.record?.versions && (
                        <p className="mt-1 text-[0.76rem] font-medium text-slate-300">
                          {selectedRecordDetail.record.versions} ediciones
                        </p>
                      )}
                    </>
                  ) : (
                    <>
                      <h3 className="mt-3 font-alternate text-[1.4rem] font-bold uppercase leading-tight text-white tracking-wide">
                        {selectedRecordDetail.name || 'Registro sin nombre visible'}
                      </h3>
                      {headerMetadata ? (
                        <p className="mt-3.5 text-[0.78rem] font-medium leading-relaxed text-slate-300">
                          {headerMetadata}
                        </p>
                      ) : null}
                    </>
                  )}
                </div>
                <button
                  type="button"
                  onClick={() => setSelectedRecordDetail(null)}
                  className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full border border-white/15 bg-white/10 text-white hover:bg-white/15 transition-all"
                  aria-label="Cerrar detalle de registro"
                >
                  <X size={16} />
                </button>
              </div>
            </header>

            <div className="max-h-[min(68vh,620px)] overflow-y-auto bg-transparent px-6 py-5 custom-scrollbar">
              <div className="space-y-5">
                {selectedRecordDetailContent.sections.map((section) => (
                  <section key={section.title} className="border-b border-slate-100 pb-5 last:border-b-0 last:pb-0">
                    <p className="text-[0.55rem] font-bold uppercase tracking-[0.18em] text-slate-400">{section.title}</p>
                    {section.body ? (
                      <p className="mt-3 text-[0.82rem] leading-relaxed text-slate-600">{section.body}</p>
                    ) : null}
                    {section.items?.length ? (
                      <dl className="mt-4 divide-y divide-slate-100">
                        {section.items.map((item) => (
                          <div key={item.label} className="grid grid-cols-[minmax(110px,0.72fr)_minmax(0,1fr)] gap-4 py-2.5">
                            <dt className="text-[0.58rem] font-bold uppercase tracking-[0.14em] text-slate-400">{item.label}</dt>
                            <dd className="text-[0.76rem] font-semibold leading-snug text-[#291242]">{formatRecordDetailValue(item.value)}</dd>
                          </div>
                        ))}
                      </dl>
                    ) : null}
                  </section>
                ))}
              </div>
              {(selectedRecordDetail.record?.contact || selectedRecordDetail.record?.websiteUrl) && (
                <div className="mt-6 flex justify-end gap-2 border-t border-slate-100 px-6 py-4 bg-slate-50/50">
                  {selectedRecordDetail.record?.websiteUrl && (
                    <a
                      href={selectedRecordDetail.record.websiteUrl.startsWith('http') ? selectedRecordDetail.record.websiteUrl : `https://${selectedRecordDetail.record.websiteUrl}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center justify-center gap-2 rounded-2xl bg-white border border-slate-200 px-5 py-3 text-xs font-bold uppercase tracking-wider text-[#291242] shadow-sm transition-all hover:bg-slate-50"
                    >
                      <Globe size={14} />
                      Visita la web oficial
                    </a>
                  )}
                  {selectedRecordDetail.record?.contact && (
                    <a
                      href={selectedRecordDetail.record.contact.includes('@') ? `mailto:${selectedRecordDetail.record.contact.split('·')[0].trim()}` : `tel:${selectedRecordDetail.record.contact.split('·')[1]?.replace(/\D+/g, '') || selectedRecordDetail.record.contact.replace(/\D+/g, '')}`}
                      className="inline-flex items-center justify-center gap-2 rounded-2xl bg-[#291242] px-5 py-3 text-xs font-bold uppercase tracking-wider text-white shadow-md transition-all hover:bg-[#3d1a62]"
                    >
                      <Mail size={14} />
                      Contactar Entidad
                    </a>
                  )}
                </div>
              )}
            </div>
          </section>
        </div>
      ) : null}
    </div>
  );
};

export { MapaEcosistemicoPage };
