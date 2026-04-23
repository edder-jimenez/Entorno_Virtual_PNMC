import { act, renderHook, waitFor } from '@testing-library/react';
import { vi } from 'vitest';
import { useMapData } from './useMapData.js';
import { fetchMapCountsBundle } from '../../services/data/index.js';

vi.mock('../../services/data/index.js', () => ({
  fetchMapCountsBundle: vi.fn(),
}));

describe('useMapData', () => {
  const baseOptions = {
    getBaseDepartmentCounts: vi.fn(() => ({})),
    buildFestivalCounts: vi.fn(() => ({})),
    buildSchoolCounts: vi.fn(() => ({})),
    buildMarketCounts: vi.fn(() => ({})),
    buildPublicSchoolRecord: vi.fn((value) => value),
    buildPublicMarketRecord: vi.fn((value) => value),
  };

  it('expone data consolidada cuando la carga es exitosa', async () => {
    fetchMapCountsBundle.mockResolvedValueOnce({
      geoJson: { type: 'FeatureCollection', features: [] },
      festivalCounts: { CUNDINAMARCA: 2 },
      schoolCounts: { CUNDINAMARCA: 1 },
      marketCounts: { CUNDINAMARCA: 3 },
      festivalRecords: [],
      schoolRecords: [],
      marketRecords: [],
    });

    const { result } = renderHook(() => useMapData(baseOptions));

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(fetchMapCountsBundle).toHaveBeenCalledTimes(1);
    expect(result.current.mapData.festivalCounts.CUNDINAMARCA).toBe(2);
  });

  it('permite reintentar cuando falla', async () => {
    fetchMapCountsBundle
      .mockRejectedValueOnce(new Error('falló'))
      .mockResolvedValueOnce({
        geoJson: { type: 'FeatureCollection', features: [] },
        festivalCounts: {},
        schoolCounts: {},
        marketCounts: {},
        festivalRecords: [],
        schoolRecords: [],
        marketRecords: [],
      });

    const { result } = renderHook(() => useMapData(baseOptions));

    await waitFor(() => expect(result.current.isError).toBe(true));

    await act(async () => {
      await result.current.retry();
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(fetchMapCountsBundle.mock.calls.length).toBeGreaterThanOrEqual(2);
  });
});
