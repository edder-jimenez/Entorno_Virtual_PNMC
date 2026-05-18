import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  Activity,
  AlertCircle,
  ArrowLeft,
  ArrowRight,
  ArrowUpRight,
  BarChart3,
  Bookmark,
  Building2,
  Boxes,
  Calendar,
  CheckCircle2,
  Clock,
  Compass,
  Database,
  Download,
  DownloadCloud,
  Eye,
  File,
  FileAudio,
  FileVideo,
  Filter,
  Grid3X3,
  Hash,
  Headphones,
  Info,
  LayoutGrid,
  Library,
  Lightbulb,
  List,
  Loader2,
  Map as MapWide,
  MapPin,
  MessageCircle,
  Mic2,
  MonitorPlay,
  MousePointer2,
  PartyPopper,
  PieChart,
  Play,
  Quote,
  Send,
  Sparkles,
  Star,
  Type,
  User,
  UserCircle2,
  Users,
  XCircle,
  Zap,
} from 'lucide-react';
import L from 'leaflet';
import { GeoJSON, MapContainer, Marker, TileLayer } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import {
  fetchColombiaGeoJson,
  fetchFestivalRecords,
  fetchMarketRecords,
  fetchSchoolRecords,
} from '../../../services/data/index.js';
import { sanitizeHtml } from '../../../lib/sanitizeHtml.js';
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
  getSortedDepartmentNames,
  normalizeDepartmentCode,
  normalizeDepartmentName,
  normalizeMunicipalityCode,
  resolveDepartmentNameFromRecord,
  scrollToElementWithOffset,
  setRuntimeDepartmentCatalog,
} from '../domain/mapDomain.js';
import {
  MapTrackpadGestureHandler,
  MapViewportResetter,
  MapZoomControls,
  MapZoomLimiter,
} from '../components/MapInteractionControls.jsx';
import { MapDepartmentDetailPanel } from '../components/MapDepartmentDetailPanel.jsx';
import { MapDepartmentSectionCard } from '../components/MapDepartmentSectionCard.jsx';
import { MapDepartmentSectionContent } from '../components/MapDepartmentSectionContent.jsx';
import { DepartmentPillCard, LayerStatusStrip } from '../components/MapSummaryPanels.jsx';
import { MapTechnicalOverviewPanel } from '../components/MapTechnicalOverviewPanel.jsx';
import { MapTechnicalDataTablesPanel } from '../components/MapTechnicalDataTablesPanel.jsx';
import {
  ECOSYSTEM_LAYERS,
  WORLD_COUNTRY_LABELS,
  countryLabelIcon,
} from '../domain/mapLayers.js';
import {
  ContentWrapper,
  PageHero,
  SectionHeader,
  Tag,
} from '../../shared/components/PagePrimitives.jsx';
import { Button, EmptyState, ErrorState, LoadingState } from '../../../components/ui/index.js';

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
  const mapViewportHeight = 'clamp(640px, 78vh, 1080px)';
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
  const hasCoverageLayer = isGeneralLayer || isFestivalsLayer || isSchoolsLayer || isMarketsLayer;

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
  const uncoveredDepartmentPills = useMemo(() => (
    hasCoverageLayer
      ? activeAnalytics.uncoveredDepartments.map((name) => ({
        key: name,
        label: getDepartmentDisplayName(name),
        value: name,
      }))
      : []
  ), [activeAnalytics.uncoveredDepartments, hasCoverageLayer]);
  const topCoverageDepartmentPills = useMemo(() => (
    hasCoverageLayer
      ? activeAnalytics.topDepartments.slice(0, 8).map((item) => ({
        key: item.name,
        label: `${getDepartmentDisplayName(item.name)} · ${formatMetricValue(item.count)}`,
        value: item.name,
      }))
      : []
  ), [activeAnalytics.topDepartments, hasCoverageLayer]);

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
        <LayerStatusStrip
          layerStatusCards={layerStatusCards}
          activeCategory={activeCategory}
          onSelectLayer={setActiveCategory}
        />

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
                          __html: sanitizeHtml(activePopupMarkupBuilder({
                            deptName: activeEmbeddedGeneralCard.deptName,
                            stats: activeEmbeddedGeneralCard.stats,
                            embedded: true,
                          })),
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

            <DepartmentPillCard
              title="Vacíos de Cobertura"
              items={uncoveredDepartmentPills}
              emptyMessage={hasCoverageLayer ? 'Todos los departamentos cuentan con cobertura.' : 'Esperando estructura de datos.'}
              onSelect={(departmentName) => handleDepartmentDrilldown(departmentName, activeCategory)}
            />

            <DepartmentPillCard
              title="Departamentos con más Cobertura"
              items={topCoverageDepartmentPills}
              emptyMessage="Aún no hay lectura suficiente para destacar coberturas."
              onSelect={(departmentName) => handleDepartmentDrilldown(departmentName, activeCategory)}
            />
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
                    <div className="w-full mx-auto bg-[#eef2f6] rounded-[2.8rem] relative overflow-hidden" style={{ height: mapViewportHeight }}>
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
                        maxBoundsViscosity={0.82}
                        style={{ height: '100%', width: '100%', background: 'transparent', zIndex: 1 }}
                        scrollWheelZoom={false}
                        dragging={true}
                        doubleClickZoom={true}
                          boxZoom={false}
                          keyboard={true}
                        touchZoom={true}
                          zoomSnap={0.25}
                          zoomDelta={0.25}
                          inertia={true}
                          inertiaDeceleration={2600}
                          inertiaMaxSpeed={1400}
                          zoomAnimation={true}
                          markerZoomAnimation={true}
                          bounceAtZoomLimits={false}
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
                        <div className="pointer-events-none select-none absolute top-6 right-6 flex flex-col gap-3 z-20">
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
                        <div className="pointer-events-none select-none absolute top-6 right-6 flex items-center gap-4 bg-white/96 backdrop-blur-sm px-5 py-4 rounded-[1.8rem] border border-slate-200 shadow-lg z-20">
                          <div className="flex flex-col">
                            <span className="text-[0.65rem] font-bold text-[#291242] uppercase font-alternate">{activeLayerConfig.shortLabel}</span>
                            <span className="text-[0.52rem] text-slate-500 font-bold uppercase">{activeMapCountLabel}</span>
                          </div>
                        </div>
                      )}

                      <div className="pointer-events-none select-none absolute bottom-6 left-6 z-20 max-w-[210px] bg-white/96 backdrop-blur-sm rounded-[1.6rem] border border-slate-200 shadow-lg px-4 py-3.5">
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

                      <div className="pointer-events-none select-none absolute bottom-6 left-1/2 -translate-x-1/2 z-20 rounded-full border border-slate-200 bg-white/96 px-4 py-2 shadow-lg">
                        <p className="text-[0.52rem] font-bold uppercase tracking-[0.14em] text-slate-500">
                          Rueda: zoom · touchpad: desplazamiento suave · doble clic: acercar
                        </p>
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
                  <MapTechnicalOverviewPanel
                    technicalViewTitle={technicalViewTitle}
                    technicalViewDescription={technicalViewDescription}
                    technicalSummaryCards={technicalSummaryCards}
                    technicalConsultationSections={technicalConsultationSections}
                    technicalSignalCards={technicalSignalCards}
                    selectedDepartmentDisplayName={selectedDepartmentDisplayName}
                    activeLayerConfig={activeLayerConfig}
                    activeInfoNote={activeInfoNote}
                    formatMetricValue={formatMetricValue}
                  />

                  <MapTechnicalDataTablesPanel
                    selectedDept={selectedDept}
                    formatMetricValue={formatMetricValue}
                    filteredTechnicalDepartmentRows={filteredTechnicalDepartmentRows}
                    technicalDepartmentQuery={technicalDepartmentQuery}
                    setTechnicalDepartmentQuery={setTechnicalDepartmentQuery}
                    technicalMatrixSortKey={technicalMatrixSortKey}
                    setTechnicalMatrixSortKey={setTechnicalMatrixSortKey}
                    technicalMatrixSortOptions={technicalMatrixSortOptions}
                    technicalMatrixSortDirection={technicalMatrixSortDirection}
                    setTechnicalMatrixSortDirection={setTechnicalMatrixSortDirection}
                    technicalDepartmentColumns={technicalDepartmentColumns}
                    handleDepartmentDrilldown={handleDepartmentDrilldown}
                    activeCategory={activeCategory}
                    formatDataCellValue={formatDataCellValue}
                    isGeneralLayer={isGeneralLayer}
                    technicalRecordsTitle={technicalRecordsTitle}
                    filteredTechnicalRecordRows={filteredTechnicalRecordRows}
                    technicalRecordRows={technicalRecordRows}
                    technicalRecordQuery={technicalRecordQuery}
                    setTechnicalRecordQuery={setTechnicalRecordQuery}
                    technicalRecordSortKey={technicalRecordSortKey}
                    setTechnicalRecordSortKey={setTechnicalRecordSortKey}
                    technicalRecordSortOptions={technicalRecordSortOptions}
                    technicalRecordSortDirection={technicalRecordSortDirection}
                    setTechnicalRecordSortDirection={setTechnicalRecordSortDirection}
                    technicalRecordFocusOptions={technicalRecordFocusOptions}
                    technicalRecordFocus={technicalRecordFocus}
                    setTechnicalRecordFocus={setTechnicalRecordFocus}
                    technicalRecordColumns={technicalRecordColumns}
                  />
                </div>
              )}
            </div>

            <div ref={departmentDetailRef} className="bg-white rounded-[3rem] p-8 border border-slate-200">
              <MapDepartmentDetailPanel
                selectedDept={selectedDept}
                selectedDepartmentDisplayName={selectedDepartmentDisplayName}
                handleReturnToNationalView={handleReturnToNationalView}
                formatMetricValue={formatMetricValue}
                selectedFestivalCount={selectedFestivalRecords.length}
                selectedSchoolCount={selectedSchoolRecords.length}
                selectedMarketCount={selectedMarketRecords.length}
              >
                {departmentDrilldownSections.map((section) => {
                    const isExpanded = expandedDepartmentSection === section.key;

                    return (
                      <MapDepartmentSectionCard
                        key={section.key}
                        section={section}
                        isExpanded={isExpanded}
                        onToggle={() => setExpandedDepartmentSection(isExpanded ? '' : section.key)}
                        formatMetricValue={formatMetricValue}
                      >
                            <MapDepartmentSectionContent
                              sectionKey={section.key}
                              selectedNormalized={selectedNormalized}
                              formatMetricValue={formatMetricValue}
                              selectedFestivalRecords={selectedFestivalRecords}
                              expandedFestivalRecordId={expandedFestivalRecordId}
                              setExpandedFestivalRecordId={setExpandedFestivalRecordId}
                              selectedSchoolRecords={selectedSchoolRecords}
                              selectedSchoolCapacity={selectedSchoolCapacity}
                              expandedSchoolRecordId={expandedSchoolRecordId}
                              setExpandedSchoolRecordId={setExpandedSchoolRecordId}
                              selectedMarketRecords={selectedMarketRecords}
                              selectedMarketCapacity={selectedMarketCapacity}
                              expandedMarketRecordId={expandedMarketRecordId}
                              setExpandedMarketRecordId={setExpandedMarketRecordId}
                            />
                      </MapDepartmentSectionCard>
                    );
                  })}
              </MapDepartmentDetailPanel>
            </div>
          </div>
        </div>

      </ContentWrapper>
    </div>
  );
};


export { MapaEcosistemicoPage };
