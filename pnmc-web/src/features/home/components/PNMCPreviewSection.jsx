import { ArrowRight, ChevronRight } from 'lucide-react';
import { Button } from '../../../components/ui/index.js';
import { scrollToElementWithOffset } from '../../map/domain/mapDomain.js';
import { ContentWrapper } from '../../shared/components/PagePrimitives.jsx';
import { RANDOM_GALLERY_IMAGES } from '../../content/domain/mediaLibrary.js';
import { getWebText } from '../../../lib/webTexts.js';

export const PNMCPreviewSection = ({ onNavigate, scrollTargetRef }) => {
  const navigateToSection = (page, sectionId) => {
    onNavigate(page);
    setTimeout(() => {
      const el = document.getElementById(sectionId);
      scrollToElementWithOffset(el);
    }, 150);
  };

  return (
    <ContentWrapper className="bg-white overflow-hidden">
      <div ref={scrollTargetRef} className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-20 items-start">
        <div className="lg:col-span-7 flex flex-col relative text-left">
          <div className="space-y-8 mb-8">
            <div className="relative group">
              <div
                className="font-gregor text-[4.5rem] lg:text-[8rem] select-none opacity-50 font-bold leading-none tracking-tight pointer-events-none uppercase"
                style={{ color: '#E6DAE5' }}
              >
                {getWebText('home_about_bg_word') || 'IDENTIDAD'}
              </div>
              <div className="absolute bottom-0 left-0 z-10 flex items-end gap-4 whitespace-nowrap">
                <h2 className="font-gregor text-3xl lg:text-5xl text-[#291242] font-bold uppercase leading-none">
                  {getWebText('home_about_title') || 'HUELLA Y EVOLUCIÓN'}
                </h2>
                <div className="w-8 lg:w-12 h-1.5 bg-[#8BF784] rounded-full mb-1 opacity-80 group-hover:w-24 transition-all duration-500"></div>
              </div>
            </div>
            <div className="space-y-6 max-w-2xl relative z-10">
              <p className="text-xl lg:text-2xl text-[#291242] font-light font-nunito leading-snug">
                {getWebText('home_about_quote') || 'El PNMC 2025-2035 es una herramienta para que la música sea motor de vida, paz y justicia social.'}
              </p>
              <div className="flex gap-5 border-l border-slate-200 pl-6 py-1">
                <p className="text-sm lg:text-base text-slate-500 font-nunito leading-relaxed">
                  {getWebText('home_about_desc') || 'Desde hace más de dos décadas, el Plan Nacional de Música para la Convivencia (PNMC) promueve la diversidad cultural de Colombia como un pilar para la paz y la equidad.'}
                </p>
              </div>
            </div>
          </div>
          <div className="rounded-[2.5rem] overflow-hidden shadow-2xl bg-slate-900 border border-slate-100 relative z-10 aspect-[16/6.5]">
            <img
              src={RANDOM_GALLERY_IMAGES[5]}
              className="w-full h-full object-cover grayscale brightness-90"
              alt="Músicos"
            />
          </div>
        </div>
        <div className="lg:col-span-5 flex flex-col lg:self-center text-left">
          <div className="mb-8">
            <span className="text-slate-400 font-bold text-[0.55rem] uppercase tracking-[0.3em] font-alternate block mb-2">
              {getWebText('home_ejes_tag') || 'EL PNMC TIENE UNA ESTRUCTURA ESTRATÉGICA'}
            </span>
            <h3 className="text-[#291242] font-alternate text-3xl font-bold uppercase leading-none tracking-tight">
              {getWebText('home_ejes_title') || 'PLANTEADA EN TRES EJES BASE'}
            </h3>
          </div>
          <div className="space-y-4 mb-8">
            {[
              { id: '01', t: 'MÚSICA PARA LA VIDA, EL DIÁLOGO INTERCULTURAL Y LA DIVERSIDAD BIOCULTURAL', s: 'Apropiación; Enfoque poblacional', target: 'musica-para-la-vida' },
              { id: '02', t: 'FORTALECIMIENTO DE LAS PRÁCTICAS, EXPRESIONES Y OFICIOS DE LA MÚSICA', s: 'Formación; Creación; Circulación; Memoria', target: 'oficios-y-practicas' },
              { id: '03', t: 'GOBERNANZA MUSICAL E INTEGRACIÓN CULTURAL E INTERSECTORIAL', s: 'Participación; Sostenibilidad', target: 'gobernanza' },
            ].map((e) => (
              <div
                key={e.id}
                onClick={() => navigateToSection('ejes', e.target)}
                className="flex items-center gap-6 p-6 rounded-2xl border border-slate-50 bg-white shadow-sm hover:shadow-md hover:border-slate-100 transition-all group cursor-pointer"
              >
                <span className="font-gregor text-4xl text-slate-100 font-bold group-hover:text-[#8BF784] transition-colors leading-none">{e.id}</span>
                <div className="flex-1">
                  <h5 className="font-alternate text-lg text-[#291242] font-bold leading-tight mb-1">
                    {getWebText(`eje${e.id}_title`) || e.t}
                  </h5>
                  <p className="text-[0.65rem] text-slate-400 font-medium">
                    {e.id === '01' ? `${getWebText('eje01_c1_title') || 'Apropiación'} ; ${getWebText('eje01_c2_title') || 'Enfoque poblacional'}` :
                     e.id === '02' ? `${getWebText('eje02_c1_title') || 'Formación'} ; ${getWebText('eje02_c2_title') || 'Creación'}` :
                     `${getWebText('eje03_c1_title') || 'Participación'} ; ${getWebText('eje03_c2_title') || 'Sostenibilidad'}`}
                  </p>
                </div>
                <ChevronRight size={16} className="text-slate-200 group-hover:text-[#291242] group-hover:translate-x-1 transition-all" />
              </div>
            ))}
          </div>
          <button
            onClick={() => onNavigate('pnmc')}
            className="bg-[#291242] text-white self-start px-8 py-3 rounded-xl font-bold text-[0.7rem] uppercase font-alternate tracking-widest flex items-center gap-3 hover:bg-[#6100D7] transition-all shadow-xl cursor-pointer"
          >
            DETALLES DEL PNMC
            <ArrowRight size={14} />
          </button>
        </div>
      </div>
    </ContentWrapper>
  );
};
