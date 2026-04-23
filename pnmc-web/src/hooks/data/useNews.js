import { useCallback, useEffect, useRef } from 'react';
import { fetchNewsRecords } from '../../services/data/index.js';
import { useAsyncResource } from './useAsyncResource.js';

export const useNews = ({
  params = {},
  mapRecord,
  sortItems,
  deps = [],
  enabled = true,
} = {}) => {
  const paramsKey = JSON.stringify(params || {});
  const mapRecordRef = useRef(mapRecord);
  const sortItemsRef = useRef(sortItems);

  useEffect(() => {
    mapRecordRef.current = mapRecord;
  }, [mapRecord]);

  useEffect(() => {
    sortItemsRef.current = sortItems;
  }, [sortItems]);

  const loader = useCallback(async () => {
    const parsedParams = paramsKey ? JSON.parse(paramsKey) : {};
    const payload = await fetchNewsRecords(parsedParams);
    const records = payload?.records || [];
    const mapped = typeof mapRecordRef.current === 'function'
      ? records.map(mapRecordRef.current).filter(Boolean)
      : records;

    if (typeof sortItemsRef.current === 'function') {
      return [...mapped].sort(sortItemsRef.current);
    }

    return mapped;
  }, [paramsKey]);

  const resource = useAsyncResource({
    loader,
    deps: [paramsKey, ...deps],
    enabled,
    initialData: [],
  });

  return {
    ...resource,
    items: resource.data || [],
  };
};

export default useNews;
