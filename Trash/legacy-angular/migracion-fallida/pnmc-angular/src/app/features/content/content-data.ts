export interface EjeComponentItem {
  id: string;
  name: string;
  details: string;
  fullText: string[];
}

export interface EjeItem {
  id: string;
  title: string;
  axisExplain: string[];
  purpose: string;
  components: EjeComponentItem[];
}

export interface StrategyContentItem {
  key: 'circulacion' | 'investigacion';
  title: string;
  context: string;
  summary: string;
  highlights: string[];
  relatedComponentIds: string[];
}

export const EJES_DATA: EjeItem[] = [
  {
    id: '01',
    title: 'Música para la vida, el diálogo intercultural y la diversidad biocultural',
    axisExplain: [
      'Promueve el acceso y la práctica musical como derechos culturales fundamentales.',
      'Reconoce la música como herramienta para el diálogo intercultural, la convivencia y la participación.',
    ],
    purpose:
      'Establecer la música como vehículo de inclusión, identidad y reconciliación para todos los territorios.',
    components: [
      {
        id: 'c1-1',
        name: 'Apropiación de la música y de los derechos culturales',
        details:
          'Fortalece el vínculo ciudadano con la música como derecho cultural y bien común.',
        fullText: [
          'Promueve acceso equitativo, participación activa y disfrute de la música en espacios comunitarios, educativos y culturales.',
          'Potencia la diversidad musical como motor de desarrollo social y construcción de ciudadanía.',
        ],
      },
      {
        id: 'c1-2',
        name: 'Enfoque poblacional y cultura de paz',
        details:
          'Impulsa inclusión de poblaciones históricamente excluidas dentro del ecosistema musical.',
        fullText: [
          'Integra enfoque de derechos, memoria histórica y reconstrucción del tejido social.',
          'Incluye trabajo con comunidades étnicas, juventudes y procesos en centros penitenciarios.',
        ],
      },
    ],
  },
  {
    id: '02',
    title: 'Fortalecimiento de las prácticas, expresiones y oficios de la música',
    axisExplain: [
      'Busca mejores condiciones para formación, creación, producción, investigación y circulación.',
      'Reconoce memoria, identidad y diversidad cultural como base del desarrollo musical.',
    ],
    purpose:
      'Dignificar oficios y saberes musicales, promoviendo sostenibilidad y oportunidades en el territorio.',
    components: [
      {
        id: 'c2-1',
        name: 'Formación',
        details: 'Impulsa procesos de cualificación para agentes del ecosistema musical.',
        fullText: [
          'Articula acciones con sistema educativo, SINEFAC y escuelas municipales/comunitarias.',
          'Fortalece oferta formativa y transmisión de saberes tradicionales.',
        ],
      },
      {
        id: 'c2-2',
        name: 'Creación y producción',
        details: 'Fortalece composición, interpretación, experimentación y producción musical.',
        fullText: [
          'Promueve estímulos, laboratorios y herramientas técnicas para ampliar la diversidad sonora.',
          'Facilita procesos creativos sostenibles para artistas y colectivos.',
        ],
      },
      {
        id: 'c2-3',
        name: 'Circulación',
        details:
          'Consolida redes, festivales, mercados y circuitos para movilidad y visibilización musical.',
        fullText: [
          'Activa espacios de música en vivo y articula esfuerzos con redes de teatros y escenarios.',
          'Fortalece circulación local, regional, nacional e internacional con enfoque colaborativo.',
        ],
      },
      {
        id: 'c2-4',
        name: 'Memoria, investigación y documentación',
        details: 'Preserva y documenta patrimonio sonoro, repertorios y prácticas musicales.',
        fullText: [
          'Articula conocimiento académico con saberes comunitarios y ancestrales.',
          'Fortalece transmisión intergeneracional y apropiación cultural.',
        ],
      },
      {
        id: 'c2-5',
        name: 'Información y comunicación',
        details: 'Fortalece recopilación, sistematización y divulgación de datos del sector.',
        fullText: [
          'Aporta herramientas para decisiones de política pública y gestión cultural.',
        ],
      },
      {
        id: 'c2-6',
        name: 'Dotación e infraestructura',
        details: 'Promueve acceso a instrumentos, equipos y espacios adecuados.',
        fullText: [
          'Mejora condiciones para formación, ensayos, grabación y circulación musical en territorios.',
        ],
      },
    ],
  },
  {
    id: '03',
    title: 'Gobernanza musical e integración cultural e intersectorial',
    axisExplain: [
      'Fortalece organización y participación del sector musical con y desde el Estado.',
      'Consolida articulación intersectorial para sostenibilidad cultural.',
    ],
    purpose:
      'Potenciar la capacidad de la música para incidir en transformación social y reducción de desigualdades.',
    components: [
      {
        id: 'c3-1',
        name: 'Participación ciudadana, intersectorialidad y articulación territorial',
        details: 'Consolida espacios de diálogo, concertación y decisión colectiva.',
        fullText: [
          'Impulsa comités territoriales, redes y plataformas colaborativas.',
          'Promueve articulación con educación, economía, medio ambiente y tecnología.',
        ],
      },
      {
        id: 'c3-2',
        name: 'Sostenibilidad, condiciones laborales y economías de la música',
        details: 'Mejora condiciones laborales y fortalece economías musicales territoriales.',
        fullText: [
          'Promueve formalización, dignificación del trabajo y desarrollo de capacidades.',
          'Contribuye a autonomía y resiliencia del ecosistema musical.',
        ],
      },
    ],
  },
];

export const STRATEGIES: StrategyContentItem[] = [
  {
    key: 'circulacion',
    title: 'Celebra la Música',
    context: 'Estrategia de circulación',
    summary:
      'Estrategia nacional para dinamizar la circulación musical, fortalecer redes territoriales y ampliar el acceso de públicos a la diversidad sonora.',
    highlights: [
      'Articulación de festivales, mercados y escenarios de música en vivo.',
      'Conexión entre artistas, gestores, instituciones y comunidades.',
      'Fortalecimiento de procesos de visibilización y movilidad territorial.',
    ],
    relatedComponentIds: ['c2-3'],
  },
  {
    key: 'investigacion',
    title: 'Territorios Sonoros',
    context: 'Estrategia de investigación',
    summary:
      'Estrategia para memoria musical, documentación y análisis de prácticas territoriales para la toma de decisiones.',
    highlights: [
      'Cartografía y caracterización de procesos musicales por territorio.',
      'Sistematización de saberes y experiencias comunitarias.',
      'Uso de evidencia para fortalecer políticas y planificación cultural.',
    ],
    relatedComponentIds: ['c2-4', 'c2-5'],
  },
];

export function findComponentById(componentId: string): EjeComponentItem | null {
  if (!componentId) return null;
  for (const eje of EJES_DATA) {
    const found = eje.components.find((component) => component.id === componentId);
    if (found) return found;
  }
  return null;
}
