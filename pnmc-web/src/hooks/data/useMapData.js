import { useCallback } from 'react';
import { fetchMapCountsBundle } from '../../services/data/index.js';
import { useAsyncResource } from './useAsyncResource.js';

export const useMapData = ({
  buildFestivalCounts,
  buildSchoolCounts,
  buildMarketCounts,
  buildPublicSchoolRecord,
  buildPublicMarketRecord,
  getBaseDepartmentCounts,
  enabled = true,
  deps = [],
} = {}) => {
  const loader = useCallback(async () => fetchMapCountsBundle({
    getBaseDepartmentCounts,
    buildFestivalCounts,
    buildSchoolCounts,
    buildMarketCounts,
    buildPublicSchoolRecord,
    buildPublicMarketRecord,
  }), [
    buildFestivalCounts,
    buildMarketCounts,
    buildPublicMarketRecord,
    buildPublicSchoolRecord,
    buildSchoolCounts,
    getBaseDepartmentCounts,
  ]);

  const resource = useAsyncResource({
    loader,
    deps,
    enabled,
  });

  return {
    ...resource,
    mapData: resource.data,
  };
};

export default useMapData;
