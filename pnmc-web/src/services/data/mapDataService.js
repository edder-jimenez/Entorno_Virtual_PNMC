import {
  fetchFestivalRecords,
  fetchLutierRecords,
  fetchMarketRecords,
  fetchNetworkRecords,
  fetchSchoolRecords,
} from './backendDataService.js';
import { fetchColombiaGeoJson } from './catalogService.js';

export const fetchMapCountsBundle = async ({
  getBaseDepartmentCounts,
  buildFestivalCounts,
  buildSchoolCounts,
  buildMarketCounts,
  buildPublicSchoolRecord,
  buildPublicMarketRecord,
}) => {
  const geoJson = await fetchColombiaGeoJson();
  const baseCounts = getBaseDepartmentCounts();

  const [festivalDataResult, schoolDataResult, marketDataResult, networkDataResult, lutierDataResult] = await Promise.allSettled([
    fetchFestivalRecords(),
    fetchSchoolRecords(),
    fetchMarketRecords(),
    fetchNetworkRecords(),
    fetchLutierRecords(),
  ]);

  const festivalRecords = festivalDataResult.status === 'fulfilled' ? (festivalDataResult.value.records || []) : [];
  const schoolRecords = schoolDataResult.status === 'fulfilled'
    ? (schoolDataResult.value.records || []).map(buildPublicSchoolRecord).filter(Boolean)
    : [];
  const marketRecords = marketDataResult.status === 'fulfilled'
    ? (marketDataResult.value.records || []).map(buildPublicMarketRecord).filter(Boolean)
    : [];
  const redesRecords = networkDataResult.status === 'fulfilled'
    ? (networkDataResult.value.records || [])
    : [];
  const luthierRecords = lutierDataResult.status === 'fulfilled'
    ? (lutierDataResult.value.records || [])
    : [];

  return {
    geoJson,
    baseCounts,
    festivalResultStatus: festivalDataResult.status,
    schoolResultStatus: schoolDataResult.status,
    marketResultStatus: marketDataResult.status,
    networkResultStatus: networkDataResult.status,
    lutierResultStatus: lutierDataResult.status,
    festivalRecords,
    schoolRecords,
    marketRecords,
    redesRecords,
    luthierRecords,
    festivalCounts: { ...baseCounts, ...buildFestivalCounts(festivalRecords) },
    schoolCounts: { ...baseCounts, ...buildSchoolCounts(schoolRecords) },
    marketCounts: { ...baseCounts, ...buildMarketCounts(marketRecords) },
  };
};
