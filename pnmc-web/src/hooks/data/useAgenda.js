import { useCallback, useEffect, useRef } from 'react';
import { fetchAgendaRecords } from '../../services/data/index.js';
import { useAsyncResource } from './useAsyncResource.js';

export const useAgenda = ({
  params = {},
  lockedTag = null,
  filterRecord,
  mapRecord,
  sortItems,
  deps = [],
  enabled = true,
} = {}) => {
  const paramsKey = JSON.stringify(params || {});
  const filterRecordRef = useRef(filterRecord);
  const mapRecordRef = useRef(mapRecord);
  const sortItemsRef = useRef(sortItems);

  useEffect(() => {
    filterRecordRef.current = filterRecord;
  }, [filterRecord]);

  useEffect(() => {
    mapRecordRef.current = mapRecord;
  }, [mapRecord]);

  useEffect(() => {
    sortItemsRef.current = sortItems;
  }, [sortItems]);

  const loader = useCallback(async () => {
    const parsedParams = paramsKey ? JSON.parse(paramsKey) : {};
    const payload = await fetchAgendaRecords(parsedParams);
    const rawRecords = payload?.records || [];

    const filtered = rawRecords.filter((record) => (
      typeof filterRecordRef.current === 'function'
        ? filterRecordRef.current(record, lockedTag)
        : true
    ));

    const mapped = typeof mapRecordRef.current === 'function'
      ? filtered.map(mapRecordRef.current).filter(Boolean)
      : filtered;

    if (typeof sortItemsRef.current === 'function') {
      return [...mapped].sort(sortItemsRef.current);
    }

    return mapped;
  }, [lockedTag, paramsKey]);

  const resource = useAsyncResource({
    loader,
    deps: [lockedTag, paramsKey, ...deps],
    enabled,
    initialData: [],
  });

  return {
    ...resource,
    items: resource.data || [],
  };
};

export default useAgenda;
