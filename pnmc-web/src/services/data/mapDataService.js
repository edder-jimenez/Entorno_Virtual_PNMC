import {
  fetchFestivalRecords,
  fetchMarketRecords,
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

  const [festivalDataResult, schoolDataResult, marketDataResult] = await Promise.allSettled([
    fetchFestivalRecords(),
    fetchSchoolRecords(),
    fetchMarketRecords(),
  ]);

  const festivalRecords = festivalDataResult.status === 'fulfilled' ? (festivalDataResult.value.records || []) : [];
  const schoolRecords = schoolDataResult.status === 'fulfilled'
    ? (schoolDataResult.value.records || []).map(buildPublicSchoolRecord).filter(Boolean)
    : [];
  const marketRecords = marketDataResult.status === 'fulfilled'
    ? (marketDataResult.value.records || []).map(buildPublicMarketRecord).filter(Boolean)
    : [];

  return {
    geoJson,
    baseCounts,
    festivalResultStatus: festivalDataResult.status,
    schoolResultStatus: schoolDataResult.status,
    marketResultStatus: marketDataResult.status,
    festivalRecords,
    schoolRecords,
    marketRecords,
    festivalCounts: { ...baseCounts, ...buildFestivalCounts(festivalRecords) },
    schoolCounts: { ...baseCounts, ...buildSchoolCounts(schoolRecords) },
    marketCounts: { ...baseCounts, ...buildMarketCounts(marketRecords) },
  };
};
