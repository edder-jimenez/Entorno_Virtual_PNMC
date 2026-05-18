import { useEffect, useMemo, useState } from 'react';
import { ArrowRight } from 'lucide-react';
import { Button } from '../../../components/ui/index.js';
import { MEDIA_LIBRARY } from '../../content/domain/mediaLibrary.js';

export const HomeMediaBanner = ({
  onOpenMapParticipation,
  onNavigateToCirculation,
  onNavigateToInvestigacion,
}) => {
  const [activeIndex, setActiveIndex] = useState(0);
  const [progress, setProgress] = useState(0);

  const slides = useMemo(() => ([
    {
      url: MEDIA_LIBRARY.performanceWide,
      tag: 'Mapa Ecosistémico',
      title: 'Participa en el mapeo musical de Colombia',
      desc: 'Registra tu proceso, organización, festival, mercado, colectivo, espacio o perfil individual dentro de la lectura territorial del ecosistema musical.',
      cta: 'Haz parte de este mapeo',
      action: onOpenMapParticipation,
    },
    {
      url: MEDIA_LIBRARY.homeHero,
      tag: 'Celebra la Música',
      title: 'Activa la circulación musical en tu territorio',
      desc: 'Conoce la estrategia, los recursos y las rutas de participación de Celebra la Música como movimiento nacional de circulación y encuentro.',
      cta: 'Explorar estrategia',
      action: onNavigateToCirculation,
    },
    {
      url: MEDIA_LIBRARY.fieldworkWide,
      tag: 'Territorios Sonoros',
      title: 'Explora turismo cultural y músicas regionales',
      desc: 'Descubre cómo esta línea articula circulación, turismo cultural, saberes locales y experiencias territoriales en torno a la música.',
      cta: 'Ver territorios sonoros',
      action: onNavigateToInvestigacion,
    },
  ]), [onNavigateToCirculation, onNavigateToInvestigacion, onOpenMapParticipation]);

  useEffect(() => {
    const interval = setInterval(() => {
      setProgress((currentProgress) => {
        if (currentProgress >= 100) {
          setActiveIndex((currentIndex) => (currentIndex + 1) % slides.length);
          return 0;
        }

        return currentProgress + 1;
      });
    }, 60);

    return () => clearInterval(interval);
  }, [slides.length]);

  return (
    <div className="relative w-full h-full">
      {slides.map((s, i) => {
        const isActive = i === activeIndex;

        return (
          <div
            key={i}
            aria-hidden={!isActive}
            className={`absolute inset-0 transition-all duration-1000 ${isActive ? 'opacity-100 pointer-events-auto z-10' : 'opacity-0 pointer-events-none z-0'}`}
          >
            <img src={s.url} alt={s.title} className="w-full h-full object-cover brightness-[0.5] saturate-[0.7]" />
            <div className="absolute inset-0 bg-[#291242]/58"></div>
            <div className="absolute inset-0 bg-gradient-to-b from-[#291242]/92 via-[#291242]/20 to-[#291242]/92"></div>
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_70%_45%,rgba(139,247,132,0.12),transparent_35%)]"></div>
            <div className="absolute inset-0 max-w-[100rem] mx-auto px-6 lg:px-12 py-8 md:py-10 flex items-end justify-end">
              <div className="max-w-lg pb-10 md:pb-14 text-right flex flex-col items-end">
                <span className="inline-flex rounded-full border border-white/10 bg-white/10 px-3 py-1.5 font-alternate text-[0.55rem] font-bold uppercase tracking-[0.28em] text-[#8BF784]">
                  {s.tag}
                </span>
                <span className="mt-6 block font-alternate text-[0.55rem] font-bold uppercase tracking-[0.3em] text-white/45">
                  0{i + 1} / 03
                </span>
                <h3 className="mt-3 max-w-xl font-gregor text-3xl md:text-4xl text-white font-bold uppercase leading-none tracking-tight">
                  {s.title}
                </h3>
                <p className="mt-4 max-w-md font-nunito text-[0.74rem] md:text-[0.82rem] text-white/70 leading-relaxed">
                  {s.desc}
                </p>
                <div className="mt-6">
                  <Button
                    type="button"
                    onClick={s.action}
                    variant="primary"
                    className="px-7 py-3 text-[0.66rem]"
                    icon={ArrowRight}
                  >
                    {s.cta}
                  </Button>
                </div>
              </div>
            </div>
          </div>
        );
      })}
      <div className="absolute bottom-8 right-6 lg:right-12 z-20 flex justify-end gap-2.5">
        {slides.map((_, i) => (
          <button
            key={i}
            type="button"
            onClick={() => {
              setActiveIndex(i);
              setProgress(0);
            }}
            className="w-14 h-0.5 bg-white/15 rounded-full overflow-hidden"
            aria-label={`Ir al banner ${i + 1}`}
          >
            <div className="h-full bg-[#8BF784]" style={{ width: i === activeIndex ? `${progress}%` : i < activeIndex ? '100%' : '0%' }}></div>
          </button>
        ))}
      </div>
    </div>
  );
};
