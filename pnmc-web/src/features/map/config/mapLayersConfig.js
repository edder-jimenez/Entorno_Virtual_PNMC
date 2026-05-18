export const MAP_V2_LAYERS_CONFIG = [
  {
    id: 'general',
    layerKey: 'General',
    label: 'Vista general',
    description: 'Integra festivales, escuelas y mercados en una lectura territorial única.',
    color: '#291242',
    defaultVisible: true,
    iconKey: 'layout-grid',
  },
  {
    id: 'festivales',
    layerKey: 'Festivales',
    label: 'Festivales',
    description: 'Procesos y eventos tipo festival registrados en el ecosistema.',
    color: '#16a34a',
    defaultVisible: true,
    iconKey: 'party',
  },
  {
    id: 'mercados',
    layerKey: 'Mercados Musicales',
    label: 'Mercados',
    description: 'Mercados musicales y espacios de circulación/comercialización.',
    color: '#f59e0b',
    defaultVisible: true,
    iconKey: 'building',
  },
  {
    id: 'escuelas',
    layerKey: 'Escuelas de Música',
    label: 'Escuelas',
    description: 'Escuelas y procesos formativos musicales registrados.',
    color: '#0284c7',
    defaultVisible: true,
    iconKey: 'library',
  },
];

export const MAP_V2_PANEL_IDS = {
  layers: 'layers',
  territory: 'territory',
  filters: 'filters',
  insights: 'insights',
  tutorial: 'tutorial',
  export: 'export',
};
