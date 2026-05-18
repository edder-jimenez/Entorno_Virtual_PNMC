import React, { useRef, useState } from 'react';
import {
  ArrowRight,
  Boxes,
  CalendarDays,
  ChevronDown,
  ChevronRight,
  ChevronUp,
  Download,
  FileText,
  FileType,
  Heart,
  Landmark,
  LayoutGrid,
  Lightbulb,
  MessageCircle,
  MonitorPlay,
  Music2,
  PartyPopper,
  Radio,
  ShieldCheck,
  Sparkles,
  Type,
  Users2,
} from 'lucide-react';
import { AgendaExplorer } from '../../agenda/pages/AgendaPage.jsx';
import { scrollToElementWithOffset } from '../../map/domain/mapDomain.js';
import {
  ContentWrapper,
  PageHero,
  SectionHeader,
  Tag,
} from '../../shared/components/PagePrimitives.jsx';
import { Button } from '../../../components/ui/index.js';

const strategyPageContent = {
  'Celebra la Música': {
    heroDescription: 'Una estrategia nacional que articula territorios, agentes e instituciones para visibilizar la diversidad sonora de Colombia.',
    sectionTitle: 'La celebración de la música',
    intro: 'Como parte del Plan Nacional de Música para la Convivencia del Ministerio de las Culturas del Gobierno de Colombia, Celebra la Música busca que el sonido y la creatividad lleguen a todos los rincones del país, para que cada territorio haga oír su voz.',
    mission: 'Su propósito es conectar a artistas, comunidades e instituciones para fortalecer los procesos de formación, creación y circulación musical. Promueve la música como un derecho, un espacio de encuentro y una oportunidad para construir memoria, dignificar el trabajo artístico y enriquecer la vida cultural del país.',
    editionTag: '14ª Edición',
    editionYear: '2025',
    editionTitle: 'Celebra la Música 2025',
    editionIntro: 'En 2025, Celebra la Música se renueva para convertirse en un gran proceso nacional que promueve la circulación musical en el país y que no será solo una jornada conmemorativa, sino un movimiento que, durante 29 días, unirá a los 32 departamentos de Colombia en torno a la diversidad sonora, el trabajo colaborativo y el reconocimiento de la música como un derecho y un bien común.',
    editionVision: 'Esta edición se articula con el Plan Nacional de Cultura 2024-2038 y el Plan Nacional de Música para la Convivencia 2025-2035, impulsando espacios de formación, creación, circulación y memoria. Busca fortalecer las redes entre artistas, gestores, festivales, escuelas y comunidades, para dignificar a todos los músicos, las músicas y dignificar el trabajo musical en los territorios.',
    editionClosing: 'Celebra la Música 2025 es una apuesta por hacer de la música un camino para la convivencia, la paz y la vida.',
    tracks: [
      {
        title: 'Músicas para la vida',
        subtitle: 'Categoría 01',
        desc: 'Procesos de formación y escuelas comunitarias, municipales, Batuta, CLANES, Artes para la Paz.',
        icon: Music2
      },
      {
        title: 'Cultura festiva',
        subtitle: 'Categoría 02',
        desc: 'Festivales y celebraciones como nodos de memoria, encuentro y circulación.',
        icon: PartyPopper
      },
      {
        title: 'Circuitos sonoros',
        subtitle: 'Categoría 03',
        desc: 'Mercados musicales y culturales, festivales y espacios de música en vivo como nodos de economía, encuentro y circulación.',
        icon: Radio
      }
    ],
    stats: [
      { value: '1.311', label: 'Artistas' },
      { value: '174', label: 'Aliados' },
      { value: '12', label: 'Departamentos' },
      { value: '45', label: 'Municipios y Veredas' }
    ],
    foundations: [
      {
        title: 'Proceso de asociatividad',
        desc: 'Trabajo colaborativo entre artistas, gestores, mercados, festivales, escuelas y entidades. Redes territoriales que descentralizan y fortalecen el ecosistema.',
        icon: Users2
      },
      {
        title: 'Acciones de fortalecimiento y cualificación',
        desc: 'Talleres, laboratorios, conferencias y procesos formativos que dignifican los oficios musicales, aportan a la profesionalización y generan capacidades locales.',
        icon: Lightbulb
      },
      {
        title: 'Estrategias de comunicación y divulgación',
        desc: 'Articulación de medios comunitarios, plataformas digitales y narrativas locales como aliados para la visibilización y posicionamiento de la diversidad sonora.',
        icon: MessageCircle
      },
      {
        title: 'Gestión de conocimiento y memoria',
        desc: 'Articula procesos de cartografía, caracterización y sistematización para reconocer, documentar y analizar las dinámicas musicales de los territorios, fortaleciendo la incidencia y la toma de decisiones en el ecosistema musical.',
        icon: FileText
      },
      {
        title: 'Sostenibilidad',
        desc: 'En lo económico, social, laboral, cultural y ambiental, promueve pago justo, autogestión, condiciones dignas, permanencia de las tradiciones y prácticas responsables orientadas al cuidado de la vida.',
        icon: ShieldCheck
      },
      {
        title: 'Participación y enfoques diferenciales',
        desc: 'Garantiza la inclusión de mujeres, diversidades de género, comunidades étnicas, juventudes, adultos mayores y personas con discapacidad en todos los procesos.',
        icon: Heart
      }
    ],
    toolkit: {
      title: 'Caja de Herramientas',
      intro: 'Descarga recursos gráficos, plantillas y elementos de identidad visual para promocionar Celebra la Música 2025 en tu territorio.',
      resources: [
        {
          title: 'Plantilla Post vertical',
          desc: 'Plantillas optimizadas para redes sociales en formato vertical. Perfectas para Instagram Stories y Facebook.',
          icon: FileType,
        },
        {
          title: 'Plantilla Historias',
          desc: 'Diseños especialmente creados para Stories de Instagram y Facebook. Formatos dinámicos y atractivos.',
          icon: LayoutGrid,
        },
        {
          title: 'Formatos',
          desc: 'Documentos y formatos oficiales para la gestión y organización de eventos de Celebra la Música 2025.',
          icon: FileText,
        },
        {
          title: 'Logos Celebra la Música',
          desc: 'Logotipos oficiales de Celebra la Música 2025 en diferentes formatos y versiones para todos los usos.',
          icon: Sparkles,
        },
        {
          title: 'Tipografía Nunito',
          desc: 'Familia tipográfica oficial Nunito Sans en todas sus variantes y pesos para mantener la coherencia visual.',
          icon: Type,
        },
        {
          title: 'Cortinilla Culturas',
          desc: 'Elementos audiovisuales y cortinillas para uso en videos y contenido multimedia del evento.',
          icon: MonitorPlay,
        },
        {
          title: 'Otras Aplicaciones',
          desc: 'Aplicaciones adicionales de la identidad visual en diferentes soportes y materiales promocionales.',
          icon: Boxes,
        },
        {
          title: 'Logo Culturas',
          desc: 'Logotipo oficial del Ministerio de las Culturas, las Artes y los Saberes en diferentes versiones.',
          icon: Landmark,
        },
        {
          title: 'Logo PNMC',
          desc: 'Logotipo del Plan Nacional de Música para la Convivencia en sus diferentes aplicaciones y formatos.',
          icon: Music2,
        },
      ],
      terms: 'Estos recursos están disponibles para uso institucional y promocional de Celebra la Música 2025. Al descargar, aceptas utilizarlos respetando la identidad visual oficial y con fines relacionados al evento. No está permitido el uso comercial sin autorización previa.',
    },
    gallery: [
      'https://images.unsplash.com/photo-1774558396253-be05d7a37d82?q=80&w=1470&auto=format&fit=crop',
      'https://images.unsplash.com/photo-1774558396280-c14b21198674?q=80&w=1470&auto=format&fit=crop',
      'https://images.unsplash.com/photo-1774558396253-be05d7a37d82?q=80&w=1470&auto=format&fit=crop'
    ]
  }
};

const strategyRelatedComponentsMap = {
  'Celebra la Música': [
    { id: 'c2-3', name: 'Circulación' },
  ],
  'Territorios Sonoros': [
    { id: 'c2-4', name: 'Memoria, investigación y documentación' },
  ],
};

const StrategySubPage = ({ title, context, onBack, onNavigate }) => {
  const strategyContent = strategyPageContent[title];
  const agendaSectionRef = useRef(null);
  const relatedComponents = strategyRelatedComponentsMap[title] || [];
  const [isToolkitExpanded, setIsToolkitExpanded] = useState(false);

  const scrollToStrategyAgenda = () => {
    scrollToElementWithOffset(agendaSectionRef.current);
  };

  if (strategyContent) {
    return (
      <div className="bg-white min-h-screen text-left pb-20">
        <PageHero
          tag="Estrategia"
          title={title}
          titleAccent="PNMC"
          description={strategyContent.heroDescription}
          bgImage="https://images.unsplash.com/photo-1774558396280-c14b21198674?q=80&w=1470&auto=format&fit=crop"
          onBack={onBack}
          childrenPosition="bottom-right"
          children={relatedComponents.length > 0 ? (
            <div className="flex flex-col items-end gap-3 text-right">
                <div className="flex flex-wrap justify-end gap-3">
                {relatedComponents.map((component) => (
                  <button
                    key={component.id}
                    type="button"
                    onClick={() => onNavigate?.(`comp-${component.id}`)}
                    className="px-3 py-2 rounded-2xl bg-white/8 border border-white/10 text-white text-[0.65rem] font-bold uppercase tracking-[0.12em] hover:border-[#8BF784] hover:text-[#8BF784] transition-all"
                  >
                    {component.name}
                  </button>
                ))}
                </div>
                <span className="text-[0.55rem] font-bold uppercase tracking-[0.24em] text-slate-300">Componentes relacionados</span>
            </div>
          ) : null}
        />

        <ContentWrapper>
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-16 items-start">
            <div className="lg:col-span-8 space-y-12">
              <div className="space-y-6">
                <SectionHeader backgroundText="CELEBRA" foregroundText={strategyContent.sectionTitle} compact />
                <p className="font-nunito text-2xl text-[#291242] leading-tight tracking-tight">{strategyContent.intro}</p>
                <p className="font-nunito text-lg text-slate-600 leading-relaxed font-light">{strategyContent.mission}</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                {strategyContent.gallery.map((image, index) => (
                  <div key={index} className="rounded-[2rem] overflow-hidden border border-slate-100 bg-slate-50 aspect-[4/5]">
                    <img src={image} alt="" className="w-full h-full object-cover" />
                  </div>
                ))}
              </div>

            </div>

            <aside className="lg:col-span-4 space-y-8">
              <div className="bg-[#291242] rounded-[2.5rem] p-10 text-white">
                <div className="flex items-end justify-between gap-4 pb-6 border-b border-white/10">
                  <div>
                    <span className="text-[0.6rem] font-bold uppercase tracking-[0.3em] text-[#8BF784]">{strategyContent.editionTag}</span>
                    <h4 className="font-gregor text-5xl font-bold uppercase leading-none mt-3">{strategyContent.editionYear}</h4>
                  </div>
                  <CalendarDays size={34} className="text-[#8BF784]" />
                </div>
                <div className="pt-6 space-y-4">
                  <h5 className="font-alternate text-2xl font-bold uppercase leading-tight">{strategyContent.editionTitle}</h5>
                  <p className="text-sm text-slate-300 font-nunito leading-relaxed">{strategyContent.editionIntro}</p>
                  <Button variant="primary" className="w-full mt-4" icon={ArrowRight} onClick={scrollToStrategyAgenda}>Descubre la programación completa</Button>
                </div>
              </div>

              <div className="bg-slate-50 border border-slate-100 rounded-[2.5rem] p-8">
                <h4 className="font-alternate text-sm font-bold uppercase tracking-[0.3em] text-slate-400 mb-6">Indicadores clave</h4>
                <div className="grid grid-cols-2 gap-4">
                  {strategyContent.stats.map((item) => (
                    <div key={item.label} className="bg-white rounded-[1.5rem] p-5 border border-slate-100">
                      <span className="font-gregor text-4xl text-[#291242] font-bold leading-none">{item.value}</span>
                      <span className="block mt-2 text-[0.6rem] font-bold uppercase tracking-[0.2em] text-slate-400">{item.label}</span>
                    </div>
                  ))}
                </div>
              </div>
            </aside>
          </div>
        </ContentWrapper>

        <ContentWrapper className="bg-slate-50/50">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-16 items-start">
            <div className="lg:col-span-5 space-y-6">
              <Tag text="Edición 2025" className="bg-[#291242] text-white" />
              <SectionHeader backgroundText="2025" foregroundText="De qué se trata" compact />
              <p className="font-nunito text-lg text-slate-600 leading-relaxed font-light">{strategyContent.editionVision}</p>
              <p className="font-nunito text-lg text-[#291242] leading-relaxed">{strategyContent.editionClosing}</p>
            </div>
            <div className="lg:col-span-7 grid grid-cols-1 md:grid-cols-3 gap-6">
              {strategyContent.tracks.map((track, index) => (
                <div key={index} className="bg-white rounded-[2.5rem] border border-slate-100 p-8 shadow-sm">
                  <div className="w-14 h-14 rounded-[1.2rem] bg-slate-50 flex items-center justify-center text-[#291242] mb-6">
                    <track.icon size={26} />
                  </div>
                  <span className="text-[0.55rem] font-bold uppercase tracking-[0.25em] text-[#00DA5E]">{track.subtitle}</span>
                  <h4 className="font-alternate text-xl text-[#291242] font-bold uppercase mt-3 mb-3 leading-tight">{track.title}</h4>
                  <p className="text-sm text-slate-500 font-nunito leading-relaxed">{track.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </ContentWrapper>

        <ContentWrapper>
          <SectionHeader backgroundText="FUNDAMENTOS" foregroundText="Fundamentos Transversales" verticalContext="BASES" />
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
            {strategyContent.foundations.map((foundation, index) => (
              <div key={index} className="group bg-white rounded-[2.3rem] border border-slate-100 p-8 hover:shadow-xl transition-all duration-500">
                <div className="w-14 h-14 rounded-[1.2rem] bg-slate-50 flex items-center justify-center text-[#291242] group-hover:bg-[#8BF784] transition-colors mb-6">
                  <foundation.icon size={24} />
                </div>
                <h4 className="font-alternate text-lg text-[#291242] font-bold uppercase mb-4 leading-tight">{foundation.title}</h4>
                <p className="text-sm text-slate-500 font-nunito leading-relaxed">{foundation.desc}</p>
              </div>
            ))}
          </div>
        </ContentWrapper>

        {strategyContent.toolkit && (
          <ContentWrapper className="bg-slate-50/50">
            <div className="space-y-5">
              <button
                type="button"
                onClick={() => setIsToolkitExpanded((prev) => !prev)}
                className={`w-full rounded-[2.75rem] bg-[#291242] text-left text-white transition-all duration-300 hover:bg-[#341754] ${
                  isToolkitExpanded ? 'px-8 py-5 lg:px-10 lg:py-5' : 'px-8 py-8 lg:px-10 lg:py-9'
                }`}
              >
                <div className={`flex gap-6 lg:items-center lg:justify-between ${isToolkitExpanded ? 'flex-row items-center' : 'flex-col lg:flex-row'}`}>
                  <div className={isToolkitExpanded ? '' : 'max-w-3xl space-y-4'}>
                    <span className="inline-flex items-center rounded-full border border-white/10 bg-white/5 px-4 py-2 font-alternate text-[0.6rem] font-bold uppercase tracking-[0.28em] text-[#8BF784]">
                      Recursos de apoyo
                    </span>
                    {!isToolkitExpanded && (
                      <div className="space-y-3">
                        <h3 className="font-gregor text-4xl lg:text-5xl text-white font-bold uppercase leading-none tracking-tighter">
                          {strategyContent.toolkit.title}
                        </h3>
                        <p className="font-nunito text-base lg:text-lg leading-relaxed text-slate-300">
                          {strategyContent.toolkit.intro}
                        </p>
                      </div>
                    )}
                  </div>
                  <div className="flex items-center justify-between gap-6 lg:justify-end">
                    <span className="font-alternate text-[0.65rem] font-bold uppercase tracking-[0.24em] text-[#8BF784]">
                      {isToolkitExpanded ? 'Cerrar sección' : 'Descarga aquí'}
                    </span>
                    <div className="flex h-14 w-14 items-center justify-center rounded-[1.2rem] border border-white/10 bg-white/5 text-[#8BF784]">
                      {isToolkitExpanded ? <ChevronUp size={22} /> : <ChevronDown size={22} />}
                    </div>
                  </div>
                </div>
              </button>

              <div
                className={`overflow-hidden transition-all duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] ${
                  isToolkitExpanded ? 'max-h-[2600px] translate-y-0 opacity-100' : 'max-h-0 -translate-y-3 opacity-0 pointer-events-none'
                }`}
              >
                <div className="rounded-[2.75rem] border border-slate-100 bg-white overflow-hidden">
                  <div className="grid grid-cols-1 xl:grid-cols-12">
                    <div className="xl:col-span-4 bg-[#291242] text-white p-10 lg:p-12 flex flex-col justify-between gap-8">
                      <div className="space-y-4">
                        <h3 className="font-gregor text-5xl text-white font-bold uppercase leading-none tracking-tighter">
                          {strategyContent.toolkit.title}
                        </h3>
                        <p className="font-nunito text-base leading-relaxed text-slate-300">
                          {strategyContent.toolkit.intro}
                        </p>
                      </div>
                      <div className="rounded-[2rem] border border-white/10 bg-white/5 p-6">
                        <span className="mb-3 block font-alternate text-[0.58rem] font-bold uppercase tracking-[0.26em] text-[#8BF784]">
                          Términos de uso
                        </span>
                        <p className="font-nunito text-sm leading-relaxed text-slate-300">
                          {strategyContent.toolkit.terms}
                        </p>
                      </div>
                    </div>
                    <div className="xl:col-span-8 p-6 lg:p-8">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {strategyContent.toolkit.resources.map((resource) => (
                          <div key={resource.title} className="group rounded-[2rem] border border-slate-100 bg-slate-50/70 p-6 transition-all duration-300 hover:bg-white hover:shadow-lg">
                            <div className="flex items-start justify-between gap-4">
                              <div className="w-12 h-12 rounded-[1rem] bg-white border border-slate-100 flex items-center justify-center text-[#291242] shrink-0">
                                <resource.icon size={22} />
                              </div>
                              <button
                                type="button"
                                className="shrink-0 font-alternate text-[0.58rem] font-bold uppercase tracking-[0.24em] text-[#291242] transition-colors hover:text-[#00DA5E]"
                              >
                                Explorar archivos
                              </button>
                            </div>
                            <div className="mt-5 space-y-3">
                              <h4 className="font-alternate text-lg text-[#291242] font-bold uppercase leading-tight">
                                {resource.title}
                              </h4>
                              <p className="font-nunito text-sm leading-relaxed text-slate-500">
                                {resource.desc}
                              </p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </ContentWrapper>
        )}

        <ContentWrapper className="bg-slate-50/40">
          <div ref={agendaSectionRef}>
            <AgendaExplorer
              lockedTag="#CelebraLaMúsica"
              title="Agenda Celebra la Música"
              bottomBanner={
                <div
                  onClick={() => onNavigate?.('agenda')}
                  className="bg-[#291242] text-white px-7 py-6 cursor-pointer group/banner transition-all duration-500 flex items-center justify-between gap-6 border border-white/5 rounded-[2.5rem] mt-8 hover:shadow-2xl hover:shadow-[#291242]/20 hover:-translate-y-1"
                >
                  <div className="flex flex-col gap-2">
                    <span className="font-alternate text-[0.65rem] font-bold uppercase tracking-[0.28em] text-[#8BF784]">Programación completa</span>
                    <span className="font-alternate text-xl lg:text-2xl font-bold uppercase leading-tight text-white">Explora toda la agenda del PNMC</span>
                    <span className="font-nunito text-[0.85rem] text-slate-300 leading-relaxed">Consulta la agenda general con toda la programación disponible del Plan Nacional de Música.</span>
                  </div>
                  <div className="bg-[#00DA5E] text-[#291242] p-3 rounded-xl transition-transform duration-500 group-hover/banner:translate-x-1 group-hover/banner:bg-white">
                    <ChevronRight size={18} strokeWidth={3} />
                  </div>
                </div>
              }
            />
          </div>
        </ContentWrapper>
      </div>
    );
  }

  return (
    <div className="bg-white min-h-screen text-left pb-20">
      <PageHero 
        tag={context} 
        title={title} 
        titleAccent="PNMC" 
        description={`Implementación estratégica para el fortalecimiento de ${title.toLowerCase()} en el territorio nacional.`} 
        bgImage="https://images.unsplash.com/photo-1774558396280-c14b21198674?q=80&w=1470&auto=format&fit=crop" 
        onBack={onBack} 
      />
      <ContentWrapper>
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-16">
          <div className="lg:col-span-8 space-y-12">
            <div className="space-y-6">
              <SectionHeader backgroundText="ESTRATEGIA" foregroundText="Ejes de Implementación" compact />
              <p className="font-nunito text-lg text-slate-600 leading-relaxed font-light">
                Esta estrategia se integra como un pilar fundamental en la arquitectura del PNMC 2025-2035, permitiendo una articulación orgánica entre los saberes locales y las políticas nacionales.
              </p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8 pt-8">
                <div className="bg-slate-50 p-8 rounded-[2rem] border border-slate-100">
                  <h4 className="font-alternate text-[#291242] text-xl uppercase font-bold mb-4">Alcance Territorial</h4>
                  <p className="text-sm text-slate-500 font-nunito leading-relaxed">Despliegue operativo en las microrregiones priorizadas, asegurando la pertinencia cultural y el diálogo entre comunidades.</p>
                </div>
                <div className="bg-[#291242] p-8 rounded-[2rem] text-white">
                  <h4 className="font-alternate text-[#8BF784] text-xl uppercase font-bold mb-4">Metas 2026</h4>
                  <ul className="space-y-3">
                    {['Consolidación de nodos regionales', 'Digitalización de acervos', 'Encuentros de saberes'].map(l => (
                      <li key={l} className="flex items-center gap-3 text-sm text-slate-300 font-nunito">
                        <CheckCircle2 size={16} className="text-[#00DA5E]" /> {l}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          </div>
          <aside className="lg:col-span-4 space-y-8">
            <div className="bg-[#00DA5E] rounded-[2.5rem] p-10 text-[#291242]">
              <h4 className="font-alternate text-2xl uppercase font-bold mb-4 leading-tight">Documentación de Estrategia</h4>
              <p className="text-sm font-nunito mb-8 leading-relaxed">Accede a los marcos técnicos y conceptuales que rigen esta línea de acción estratégica.</p>
              <Button variant="secondary" className="w-full" icon={Download}>Descargar Dossier</Button>
            </div>
          </aside>
        </div>
      </ContentWrapper>
    </div>
  );
};


export { StrategySubPage };
