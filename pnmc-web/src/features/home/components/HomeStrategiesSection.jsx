import React, { useState, useEffect, useMemo } from 'react';
import { ChevronLeft, ChevronRight, Tag as TagIcon } from 'lucide-react';
import { Tag } from '../../shared/components/PagePrimitives.jsx';
import { ContentWrapper } from '../../shared/components/PagePrimitives.jsx';
import { RANDOM_GALLERY_IMAGES } from '../../content/domain/mediaLibrary.js';
import { getWebText } from '../../../lib/webTexts.js';

// The expanded strategies dataset with semantic mappings to components
const STRATEGIES_DATA = [
  {
    id: 'celebra-la-musica',
    tag: 'Estrategia de Circulación',
    title: 'Celebra la Música',
    desc: 'Activa escenarios, programación y redes territoriales para que los procesos musicales circulen, se conecten y ganen visibilidad.',
    img: RANDOM_GALLERY_IMAGES[2],
    navigatePath: 'estrategia-circulacion',
    componentId: 'comp-c2-3',
    bgGlow: 'bg-[#6100D7]/20'
  },
  {
    id: 'territorios-sonoros',
    tag: 'Estrategia de Investigación',
    title: 'Territorios Sonoros',
    desc: 'Impulsa procesos de investigación, cartografía y documentación para reconocer, interpretar y proyectar la diversidad sonora del país.',
    img: RANDOM_GALLERY_IMAGES[4],
    navigatePath: 'estrategia-investigacion',
    componentId: 'comp-c2-4',
    bgGlow: 'bg-[#00DA5E]/5'
  },
  {
    id: 'congreso-nacional',
    tag: 'Estrategia de Gobernanza y Participación',
    title: '8vo Congreso Nacional de Música',
    desc: 'Espacio de diálogo académico, social e institucional para consolidar las políticas del sector y fortalecer la gobernanza musical en el país.',
    img: RANDOM_GALLERY_IMAGES[6],
    navigatePath: 'comp-c3-1',
    componentId: 'comp-c3-1',
    bgGlow: 'bg-[#6100D7]/15'
  },
  {
    id: 'tempos-memorias',
    tag: 'Estrategia de Formación',
    title: 'Tempos de Memorias',
    desc: 'Laboratorio formativo enfocado en la cualificación de saberes tradicionales, lutería, pedagogía y preservación de patrimonios sonoros locales.',
    img: RANDOM_GALLERY_IMAGES[8],
    navigatePath: 'comp-c2-1',
    componentId: 'comp-c2-1',
    bgGlow: 'bg-[#00DA5E]/10'
  },
  {
    id: 'voces-saberes',
    tag: 'Estrategia de Investigación',
    title: 'Voces y Saberes',
    desc: 'Proceso nacional de documentación y registro para catalogar las expresiones orales y la memoria viva de nuestros cantautores y sabedores.',
    img: RANDOM_GALLERY_IMAGES[10],
    navigatePath: 'comp-c2-4',
    componentId: 'comp-c2-4',
    bgGlow: 'bg-[#6100D7]/15'
  },
  {
    id: 'red-jazz',
    tag: 'Estrategia de Circulación',
    title: 'Red Nacional de Jazz',
    desc: 'Plataforma de circulación colaborativa que conecta festivales, clubes y músicos de jazz en circuitos nacionales y de intercambio.',
    img: RANDOM_GALLERY_IMAGES[12],
    navigatePath: 'comp-c2-3',
    componentId: 'comp-c2-3',
    bgGlow: 'bg-[#00DA5E]/5'
  },
  {
    id: 'mercados-musicales',
    tag: 'Estrategia de Circulación',
    title: 'Mercados Musicales de Colombia',
    desc: 'Fortalece el encuentro entre programadores, directores y agrupaciones nacionales para dinamizar la circulación nacional e internacional.',
    img: RANDOM_GALLERY_IMAGES[1],
    navigatePath: 'comp-c2-3',
    componentId: 'comp-c2-3',
    bgGlow: 'bg-[#6100D7]/15'
  },
  {
    id: 'mesas-participacion',
    tag: 'Estrategia de Gobernanza y Circulación',
    title: 'Mesas de Participación',
    desc: 'Nodos comunitarios de concertación que articulan el tejido asociativo y las veedurías locales del Plan Nacional de Música.',
    img: RANDOM_GALLERY_IMAGES[3],
    navigatePath: 'comp-c3-1',
    componentId: 'comp-c3-1',
    bgGlow: 'bg-[#00DA5E]/10'
  }
];

export const HomeStrategiesSection = ({ onNavigate }) => {
  const [startIndex, setStartIndex] = useState(0);
  const [transitionEnabled, setTransitionEnabled] = useState(true);
  const [timerKey, setTimerKey] = useState(0);
  const [isPaused, setIsPaused] = useState(false);

  const strategiesData = useMemo(() => {
    const keysMap = {
      'celebra-la-musica': 'celebra',
      'territorios-sonoros': 'territorios',
      'congreso-nacional': 'congreso',
      'tempos-memorias': 'tempos',
      'voces-saberes': 'voces',
      'red-jazz': 'jazz',
      'mercados-musicales': 'mercados',
      'mesas-participacion': 'mesas'
    };
    return STRATEGIES_DATA.map(card => {
      const shortKey = keysMap[card.id];
      if (shortKey) {
        return {
          ...card,
          tag: getWebText(`strat_${shortKey}_tag`) || card.tag,
          title: getWebText(`strat_${shortKey}_title`) || card.title,
          desc: getWebText(`strat_${shortKey}_desc`) || card.desc
        };
      }
      return card;
    });
  }, []);

  const totalCards = strategiesData.length;

  // Clone the first 3 cards and append them at the end for a seamless infinite loop showing 3 cards always
  const extendedCards = [...strategiesData, ...strategiesData.slice(0, 3)];

  // Force re-enabling transition classes after an instant non-animated jump/reset
  useEffect(() => {
    if (!transitionEnabled) {
      const raf = requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          setTransitionEnabled(true);
        });
      });
      return () => cancelAnimationFrame(raf);
    }
  }, [transitionEnabled]);

  // Auto-scroll loop resetting timer on user interaction (via timerKey dependency)
  useEffect(() => {
    if (isPaused) return;
    const interval = setInterval(() => {
      setStartIndex((prev) => {
        if (prev >= totalCards) {
          setTransitionEnabled(false);
          setTimeout(() => {
            setTransitionEnabled(true);
            setStartIndex(1);
          }, 20);
          return 0;
        }
        return prev + 1;
      });
    }, 6000);
    return () => clearInterval(interval);
  }, [isPaused, timerKey, totalCards]);

  const handlePrev = () => {
    setTimerKey((prev) => prev + 1);
    if (!transitionEnabled) return;
    setStartIndex((prev) => {
      if (prev === 0) {
        setTransitionEnabled(false);
        setTimeout(() => {
          setTransitionEnabled(true);
          setStartIndex(totalCards - 1);
        }, 20);
        return totalCards;
      }
      return prev - 1;
    });
  };

  const handleNext = () => {
    setTimerKey((prev) => prev + 1);
    if (!transitionEnabled) return;
    setStartIndex((prev) => {
      if (prev >= totalCards) {
        setTransitionEnabled(false);
        setTimeout(() => {
          setTransitionEnabled(true);
          setStartIndex(1);
        }, 20);
        return 0;
      }
      return prev + 1;
    });
  };

  const handleTransitionEnd = () => {
    if (startIndex >= totalCards) {
      setTransitionEnabled(false);
      setStartIndex(0);
    }
  };

  return (
    <ContentWrapper className="bg-white">
      {/* Slider Header Area with navigation */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6 mb-8 text-left">
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <span className="h-1.5 w-1.5 rounded-full bg-[#00DA5E] animate-pulse"></span>
            <span className="text-[0.62rem] font-black uppercase tracking-[0.24em] text-[#00DA5E]">{getWebText('home_strat_tag') || 'Procesos destacados'}</span>
          </div>
          <h2 className="font-alternate text-3xl lg:text-4xl font-bold uppercase text-[#291242] leading-none tracking-tight">{getWebText('home_strat_title') || 'Rutas de Acción Territorial'}</h2>
          <p className="text-slate-500 font-nunito text-xs sm:text-sm leading-relaxed max-w-2xl">
            {getWebText('home_strat_desc') || 'Conoce los marcos operativos y pedagógicos que impulsan la formación, investigación, circulación y gobernanza musical en todas las regiones de Colombia.'}
          </p>
        </div>

        {/* Carousel controls matching Agenda/Gallery pagination style */}
        <div className="flex items-center gap-3.5 self-stretch md:self-end justify-between md:justify-end shrink-0 pt-2">
          <div className="flex items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={handlePrev}
              className="w-11 h-11 flex items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-400 hover:text-[#291242] hover:border-[#00DA5E] transition-all shadow-sm cursor-pointer"
              aria-label="Proceso anterior"
            >
              <ChevronLeft size={20} />
            </button>

            <button
              type="button"
              onClick={handleNext}
              className="w-11 h-11 flex items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-400 hover:text-[#291242] hover:border-[#00DA5E] transition-all shadow-sm cursor-pointer"
              aria-label="Siguiente proceso"
            >
              <ChevronRight size={20} />
            </button>
          </div>
        </div>
      </div>

      {/* Slider Card Stage */}
      <div 
        className="overflow-hidden w-full px-1 py-2"
        onMouseEnter={() => setIsPaused(true)}
        onMouseLeave={() => setIsPaused(false)}
      >
        <div 
          className={`flex -mx-2 md:-mx-3 ${transitionEnabled ? 'transition-transform duration-700 ease-[cubic-bezier(0.22,1,0.36,1)]' : ''}`}
          style={{ 
            transform: `translateX(-${startIndex * 33.333333}%)` 
          }}
          onTransitionEnd={handleTransitionEnd}
        >
          {extendedCards.map((card, idx) => (
            <div 
              key={`${card.id}-clone-${idx}`} 
              className="px-2 md:px-3 w-1/3 shrink-0"
            >
              <div
                onClick={() => onNavigate(card.navigatePath)}
                className="rounded-[2rem] group transition-all border border-slate-100 flex flex-col justify-end min-h-[280px] md:min-h-[320px] shadow-sm cursor-pointer text-left relative overflow-hidden isolate"
                style={{ WebkitMaskImage: '-webkit-radial-gradient(white, black)' }}
              >
                {/* Rounded Inherit applied to children guarantees perfect Safari clip without leaking corners */}
                <img 
                  src={card.img} 
                  alt={card.title} 
                  className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-[1.03] rounded-[inherit]" 
                />
                
                {/* Frosted vignette wrapper */}
                <div className="absolute inset-0 bg-gradient-to-t from-[#291242]/95 via-[#291242]/45 to-transparent transition-all duration-500 group-hover:from-[#291242]/98 group-hover:via-[#291242]/55 group-hover:to-transparent rounded-[inherit]"></div>
                
                {/* Intermediate clipping container fully isolates hardware-accelerated blur to prevent corner bleed on Safari */}
                <div 
                  className="absolute inset-0 overflow-hidden rounded-[inherit] pointer-events-none z-0"
                  style={{ WebkitMaskImage: '-webkit-radial-gradient(white, black)' }}
                >
                  <div className={`absolute -right-20 -top-20 w-60 h-60 ${card.bgGlow} rounded-full blur-[80px] transition-all duration-[750ms] group-hover:scale-125`}></div>
                </div>

                {/* Top left metadata button tag */}
                <div className="absolute top-4 left-4 md:top-5 md:left-5 z-10">
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      onNavigate(card.componentId);
                    }}
                    className="cursor-pointer focus:outline-none"
                  >
                    <Tag text={card.tag} className="bg-[#291242]/90 border border-white/5 text-white hover:border-[#00DA5E] hover:text-[#00DA5E] transition-all backdrop-blur-sm text-[9px] py-1 px-2.5" />
                  </button>
                </div>

                {/* Content body with responsive height expandable detail panel */}
                <div className="relative z-10 m-4 md:m-5">
                  <h3 className="px-1.5 font-gregor text-lg sm:text-xl md:text-2xl text-white font-bold uppercase leading-none tracking-tight transition-all duration-300 group-hover:opacity-0 group-hover:-translate-y-2">
                    {card.title}
                  </h3>
                  
                  <div className="mt-3 max-h-0 overflow-hidden rounded-[1.5rem] border border-transparent bg-transparent p-0 opacity-0 transition-all duration-500 group-hover:max-h-56 group-hover:border-white/10 group-hover:bg-[#291242]/90 group-hover:p-5 group-hover:opacity-100 group-hover:backdrop-blur-md">
                    <div className="w-8 h-0.5 bg-[#00DA5E] mb-3"></div>
                    <h3 className="font-gregor text-base sm:text-lg md:text-xl text-white font-bold uppercase leading-none tracking-tight">
                      {card.title}
                    </h3>
                    <p className="text-[0.7rem] sm:text-[0.75rem] md:text-[0.8rem] text-white/80 font-nunito leading-relaxed mt-2">
                      {card.desc}
                    </p>
                    <div className="mt-4 text-[0.62rem] md:text-[0.68rem] font-bold text-[#00DA5E] flex items-center gap-1.5 uppercase font-alternate tracking-wider transition-colors group-hover:text-[#8BF784]">
                      Explorar Estrategia <ChevronRight size={13} className="transform group-hover:translate-x-1 transition-transform" />
                    </div>
                  </div>
                </div>

              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Progress indicator dots representing the total number of processes */}
      <div className="flex items-center justify-center gap-2 mt-8">
        {strategiesData.map((_, index) => {
          const isSelected = startIndex % totalCards === index;
          return (
            <button
              key={index}
              type="button"
              onClick={() => {
                setTimerKey((prev) => prev + 1);
                setStartIndex(index);
              }}
              className={`h-1.5 rounded-full transition-all duration-300 cursor-pointer ${
                isSelected 
                  ? 'w-6 bg-[#00DA5E] opacity-100 shadow-[0_0_8px_rgba(0,218,94,0.5)]' 
                  : 'w-1.5 bg-slate-200 hover:bg-slate-350 opacity-60 hover:opacity-100'
              }`}
              aria-label={`Ir al proceso ${index + 1}`}
            />
          );
        })}
      </div>
    </ContentWrapper>
  );
};
