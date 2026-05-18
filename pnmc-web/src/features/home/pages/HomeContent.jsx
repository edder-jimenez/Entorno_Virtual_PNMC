import { useRef, useState } from 'react';
import { ArrowRight } from 'lucide-react';
import { Button } from '../../../components/ui/index.js';
import { AppFooter } from '../../../components/layout/AppFooter.jsx';
import { HOME_HERO_IMAGES } from '../../content/domain/mediaLibrary.js';
import { HomeMediaBanner } from '../components/HomeMediaBanner.jsx';
import { HomeStrategiesSection } from '../components/HomeStrategiesSection.jsx';
import { MapaEcosistemicoPreview } from '../components/MapaEcosistemicoPreview.jsx';
import { NoticiasAgendaPreview } from '../components/NoticiasAgendaPreview.jsx';
import { PNMCPreviewSection } from '../components/PNMCPreviewSection.jsx';
import { PageHero, Tag } from '../../shared/components/PagePrimitives.jsx';

export const HomeContent = ({
  setPage,
  onNavigateToArticle,
  onNavigateToAgendaEvent,
  onNavigateToMapLayer,
  onOpenMapParticipation,
}) => {
  const scrollTargetRef = useRef(null);
  const [homeHeroBgImage] = useState(
    () => HOME_HERO_IMAGES[Math.floor(Math.random() * HOME_HERO_IMAGES.length)]
  );

  return (
    <div className="relative">
      <section>
        <PageHero
          tag="PLAN NACIONAL DE MÚSICA PARA LA CONVIVENCIA 2025—2035"
          title="Huellas y Apuestas de la"
          titleAccent="Diversidad Sonora"
          description="Un pacto colectivo que reconoce la música como un derecho cultural y un bien común en todo el territorio nacional."
          bgImage={homeHeroBgImage}
          bgImageClassName="scale-[1.24] md:scale-[1.16] opacity-30"
          fullScreen={true}
          scrollTargetRef={scrollTargetRef}
        >
          <Button onClick={() => setPage('pnmc')} variant="primary" icon={ArrowRight}>Sobre el PNMC</Button>
          <Button onClick={() => setPage('ejes')} variant="ghost">Explorar Ejes</Button>
        </PageHero>
      </section>

      <section className="min-h-screen">
        <div className="pt-8 md:pt-12">
          <PNMCPreviewSection onNavigate={setPage} scrollTargetRef={scrollTargetRef} />
        </div>
        <div className="relative w-full h-[52svh] md:h-[58svh] bg-[#291242] overflow-hidden border-y border-white/5">
          <HomeMediaBanner
            onOpenMapParticipation={onOpenMapParticipation}
            onNavigateToCirculation={() => setPage('estrategia-circulacion')}
            onNavigateToInvestigacion={() => setPage('estrategia-investigacion')}
          />
        </div>
        <MapaEcosistemicoPreview onNavigate={setPage} onNavigateToMapLayer={onNavigateToMapLayer} onOpenParticipation={onOpenMapParticipation} />
        <NoticiasAgendaPreview onNavigate={setPage} onNavigateToArticle={onNavigateToArticle} onNavigateToAgendaEvent={onNavigateToAgendaEvent} />

        <div className="w-full bg-[#291242] py-12 relative overflow-hidden border-y border-white/5">
          <div className="max-w-[100rem] mx-auto px-6 lg:px-12 flex flex-col md:flex-row items-center justify-between gap-8 relative z-10">
            <div className="flex flex-col md:flex-row items-center gap-6 text-center md:text-left">
              <Tag text="BOLETÍN" className="bg-white/10 text-[#00DA5E]" />
              <div className="space-y-1">
                <h4 className="font-gregor text-2xl font-bold uppercase leading-none tracking-tight text-white">Recibe las Novedades</h4>
                <p className="font-nunito text-white/40 text-[0.7rem] leading-relaxed">Convocatorias y lanzamientos semanales del PNMC.</p>
              </div>
            </div>
            <div className="flex w-full md:w-auto items-center gap-3">
              <input type="text" placeholder="Email" className="bg-white/5 border border-white/10 rounded-xl py-3 px-6 text-sm font-nunito outline-none text-white w-full md:w-[300px] focus:border-[#00DA5E] transition-all" />
              <Button variant="primary" className="py-3.5 px-10 whitespace-nowrap">Registrarme</Button>
            </div>
          </div>
          <div className="absolute top-1/2 left-0 w-full h-px bg-white/5 -translate-y-1/2"></div>
        </div>

        <HomeStrategiesSection onNavigate={setPage} />
        <AppFooter />
      </section>
    </div>
  );
};
