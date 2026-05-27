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
import { getWebText } from '../../../lib/webTexts.js';

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
          tag={getWebText('home_tag')}
          title={getWebText('home_title')}
          titleAccent={getWebText('home_title_accent')}
          description={getWebText('home_description')}
          bgImage={homeHeroBgImage}
          bgImageClassName="scale-[1.24] md:scale-[1.16] opacity-30"
          fullScreen={true}
          scrollTargetRef={scrollTargetRef}
        >
          <Button onClick={() => setPage('pnmc')} variant="primary" icon={ArrowRight}>{getWebText('home_btn_about')}</Button>
          <Button onClick={() => setPage('ejes')} variant="ghost">{getWebText('home_btn_ejes')}</Button>
        </PageHero>
      </section>

      <section className="min-h-screen">
        <div className="pt-8 md:pt-12">
          <PNMCPreviewSection onNavigate={setPage} scrollTargetRef={scrollTargetRef} />
        </div>

        <HomeStrategiesSection onNavigate={setPage} />

        <div className="relative w-full h-auto min-h-[460px] md:h-[58svh] bg-[#291242] overflow-hidden border-y border-white/5">
          <HomeMediaBanner
            onOpenMapParticipation={onOpenMapParticipation}
            onNavigateToCirculation={() => setPage('estrategia-circulacion')}
            onNavigateToInvestigacion={() => setPage('estrategia-investigacion')}
          />
        </div>

        <MapaEcosistemicoPreview onNavigate={setPage} onNavigateToMapLayer={onNavigateToMapLayer} onOpenParticipation={onOpenMapParticipation} />

        <div className="w-full bg-[#291242] py-20 lg:py-24 relative overflow-hidden border-y border-white/5">
          <div className="max-w-[100rem] mx-auto px-6 lg:px-12 flex flex-col lg:flex-row items-center justify-between gap-8 relative z-10">
            <div className="flex flex-col sm:flex-row items-center gap-4 sm:gap-6 text-center sm:text-left shrink-0">
              <Tag text="BOLETÍN" className="bg-white/10 text-[#00DA5E]" />
              <div className="space-y-0.5">
                <h4 className="font-gregor text-xl lg:text-2xl font-bold uppercase leading-none tracking-tight text-white">
                  {getWebText('home_bulletin_title') || 'Recibe las Novedades'}
                </h4>
                <p className="font-nunito text-white/50 text-[0.7rem] leading-relaxed">
                  {getWebText('home_bulletin_desc') || 'Convocatorias y lanzamientos semanales del PNMC.'}
                </p>
              </div>
            </div>
            
            <div className="flex flex-col sm:flex-row w-full lg:w-auto items-stretch sm:items-center gap-3 flex-1 justify-center max-w-xl">
              <input 
                type="email" 
                placeholder={getWebText('home_bulletin_placeholder') || 'Ingresa tu correo'} 
                className="bg-white/5 border border-white/15 rounded-xl py-3 px-5 text-xs font-nunito outline-none text-white w-full sm:w-[280px] focus:border-[#00DA5E] focus:bg-white/10 transition-all placeholder:text-white/30" 
              />
              <Button variant="primary" className="py-3 px-8 text-xs font-bold tracking-widest whitespace-nowrap">
                {getWebText('home_bulletin_btn') || 'Registrarme'}
              </Button>
            </div>

            {/* Social media call-to-action */}
            <div className="flex items-center gap-4 border-t lg:border-t-0 lg:border-l border-white/10 pt-6 lg:pt-0 lg:pl-8 w-full lg:w-auto justify-center lg:justify-end shrink-0">
              <div className="text-center lg:text-left space-y-0.5">
                <h5 className="font-alternate text-[0.65rem] font-bold uppercase tracking-[0.2em] text-[#00DA5E]">
                  {getWebText('home_social_title') || 'Conéctate con el Plan'}
                </h5>
                <p className="text-[0.62rem] text-white/40 font-nunito tracking-wide">
                  {getWebText('home_social_desc') || 'Síguenos en nuestras redes oficiales'}
                </p>
              </div>
              <div className="flex items-center gap-2">
                <a href="https://instagram.com" target="_blank" rel="noopener noreferrer" className="w-10 h-10 rounded-xl bg-white/5 border border-white/10 hover:border-[#00DA5E] hover:text-[#00DA5E] transition-all flex items-center justify-center text-white/70 hover:shadow-[0_0_15px_rgba(0,218,94,0.25)]" aria-label="Síguenos en Instagram">
                  <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <rect width="20" height="20" x="2" y="2" rx="5" ry="5"/>
                    <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"/>
                    <line x1="17.5" x2="17.51" y1="6.5" y2="6.5"/>
                  </svg>
                </a>
                <a href="https://facebook.com" target="_blank" rel="noopener noreferrer" className="w-10 h-10 rounded-xl bg-white/5 border border-white/10 hover:border-[#00DA5E] hover:text-[#00DA5E] transition-all flex items-center justify-center text-white/70 hover:shadow-[0_0_15px_rgba(0,218,94,0.25)]" aria-label="Síguenos en Facebook">
                  <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z"/>
                  </svg>
                </a>
                <a href="https://youtube.com" target="_blank" rel="noopener noreferrer" className="w-10 h-10 rounded-xl bg-white/5 border border-white/15 hover:border-[#00DA5E] hover:text-[#00DA5E] transition-all flex items-center justify-center text-white/70 hover:shadow-[0_0_15px_rgba(0,218,94,0.25)]" aria-label="Síguenos en YouTube">
                  <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M2.5 17a24.12 24.12 0 0 1 0-10 2 2 0 0 1 1.4-1.4 49.56 49.56 0 0 1 16.2 0A2 2 0 0 1 21.5 7a24.12 24.12 0 0 1 0 10 2 2 0 0 1-1.4 1.4 49.55 49.55 0 0 1-16.2 0A2 2 0 0 1 2.5 17z"/>
                    <polygon points="10 15 15 12 10 9"/>
                  </svg>
                </a>
              </div>
            </div>
          </div>
          <div className="absolute top-1/2 left-0 w-full h-px bg-white/5 -translate-y-1/2 pointer-events-none opacity-50"></div>
        </div>

        <NoticiasAgendaPreview onNavigate={setPage} onNavigateToArticle={onNavigateToArticle} onNavigateToAgendaEvent={onNavigateToAgendaEvent} />

        <AppFooter />
      </section>
    </div>
  );
};
