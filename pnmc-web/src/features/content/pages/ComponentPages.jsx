import React, { useMemo } from 'react';
import { useParams } from 'react-router-dom';
import { ArrowRight, CheckCircle2, FileText } from 'lucide-react';
import {
  ContentWrapper,
  PageHero,
  SectionHeader,
} from '../../shared/components/PagePrimitives.jsx';
import { Button } from '../../../components/ui/index.js';
import { getWebText } from '../../../lib/webTexts.js';

const ComponentSubPage = ({ component, onBack, onNavigate, onNavigateToEditorialResource }) => {
  const relatedEditorialResources = component.id === 'c2-3'
    ? [
        { id: 'PNMC-ED-103', title: 'Producción y Gestión de Eventos Musicales', meta: 'Producción y Emprendimiento • Caja de herramientas' },
        { id: 'PNMC-ED-104', title: 'Orientaciones para procesos de producción y circulación', meta: 'Producción y Emprendimiento • Documento técnico' },
      ]
    : [
        { id: 'PNMC-ED-110', title: 'La música cuenta 2016', meta: 'Información • Boletín estadístico' },
        { id: 'PNMC-ED-001', title: 'Módulos de capacitación para instrumentistas y directores de banda', meta: 'Formación • Libro' },
      ];
  const actionLines = component.id === 'c2-3'
    ? [
        'Dinamización de espacios para la circulación musical',
        'Territorios Sonoros: turismo cultural y músicas regionales',
        'Estrategia integral de circulación musical',
        'Fomento de redes y circulación colectiva',
      ]
    : ['Fortalecimiento institucional', 'Capacitación técnica', 'Sostenibilidad regional'];
  const expectedImpact = component.id === 'c2-3'
    ? 'Mayor visibilización y movilidad de músicos, músicas y proyectos en circuitos locales, nacionales e internacionales, junto con el fortalecimiento de festivales, mercados, redes colaborativas y espacios de programación que amplían las oportunidades de circulación y profesionalización del sector.'
    : 'Incremento en la participación ciudadana y profesionalización de los actores vinculados a esta área específica.';

  return (
    <div className="bg-white min-h-screen text-left pb-20 font-nunito">
      <PageHero 
        title={component.name}
        titleTone="split-lines"
        description={component.details} 
        bgImage="https://images.unsplash.com/photo-1774558396253-be05d7a37d82?q=80&w=1470&auto=format&fit=crop" 
        onBack={onBack} 
      />
      <ContentWrapper>
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-16">
          <div className="lg:col-span-8 space-y-12">
            <div className="space-y-6">
              <SectionHeader backgroundText="COMPONENTE" foregroundText="Descripción del Componente" compact />
              <div className="font-nunito text-[1.05rem] text-slate-700 leading-loose font-light space-y-6 max-w-3xl">
                {component.fullText.map((p, i) => <p key={i}>{p}</p>)}
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8 pt-8">
                <div className="bg-slate-50 p-8 rounded-[2rem] border border-slate-100">
                  <h4 className="font-alternate text-[#291242] text-xl uppercase font-bold mb-4">Líneas de Acción</h4>
                  <ul className="space-y-3">
                    {actionLines.map(l => (
                      <li key={l} className="flex items-center gap-3 text-sm text-slate-500 font-nunito">
                        <CheckCircle2 size={16} className="text-[#00DA5E]" /> {l}
                      </li>
                    ))}
                  </ul>
                </div>
                <div className="bg-slate-50 p-8 rounded-[2rem] border border-slate-100">
                  <h4 className="font-alternate text-[#291242] text-xl uppercase font-bold mb-4">Impacto Esperado</h4>
                  <div className="flex items-start gap-3 text-sm text-slate-500 font-nunito leading-relaxed">
                     <CheckCircle2 size={16} className="text-[#00DA5E] mt-0.5 shrink-0" />
                     <p>{expectedImpact}</p>
                  </div>
                </div>
              </div>

            </div>
          </div>
          <aside className="lg:col-span-4 space-y-8 lg:sticky lg:top-28 self-start">
            {component.id === 'c2-3' ? (
              <>
                <div className="bg-slate-50 border border-slate-100 rounded-[2.5rem] p-10 space-y-6">
                   <h4 className="font-alternate text-sm font-bold uppercase tracking-[0.3em] text-slate-400">Recursos Relacionados</h4>
                   <div className="space-y-4">
                     {relatedEditorialResources.map((resource) => (
                       <div
                         key={resource.id}
                         onClick={() => onNavigateToEditorialResource?.(resource.id)}
                         className="flex items-center gap-4 bg-white p-4 rounded-xl border border-slate-100 group cursor-pointer hover:border-[#00DA5E] transition-all"
                       >
                          <div className="w-10 h-10 bg-slate-50 rounded-lg flex items-center justify-center text-[#291242] group-hover:bg-[#00DA5E] transition-colors"><FileText size={18}/></div>
                          <div className="flex flex-col">
                            <span className="text-[0.7rem] font-bold text-[#291242] uppercase font-alternate">{resource.title}</span>
                            <span className="text-[0.55rem] text-slate-400 uppercase tracking-widest">{resource.meta}</span>
                          </div>
                       </div>
                     ))}
                   </div>
                </div>

                <div
                  onClick={() => onNavigate?.('estrategia-circulacion')}
                  className="relative overflow-hidden rounded-[2.5rem] border border-slate-100 min-h-[280px] cursor-pointer group"
                >
                  <img
                    src="https://images.unsplash.com/photo-1774558396280-c14b21198674?q=80&w=1470&auto=format&fit=crop"
                    alt=""
                    className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-[1.03]"
                  />
                  <div className="absolute inset-0 bg-[#291242]/55"></div>
                  <div className="absolute inset-0 bg-gradient-to-t from-[#291242]/96 via-[#291242]/78 to-[#291242]/28"></div>
                  <div className="relative z-10 h-full min-h-[280px] p-8 flex flex-col justify-center">
                    <span className="text-[0.68rem] font-bold uppercase tracking-[0.28em] text-[#8BF784]">Estrategia Relacionada</span>
                    <h3 className="font-gregor text-3xl text-white font-bold uppercase leading-none tracking-tighter mt-4">Celebra la Música</h3>
                    <p className="mt-5 text-[0.9rem] text-slate-200 font-nunito leading-relaxed">
                      Estrategia de circulación que promueve escenarios, programación y articulaciones territoriales para visibilizar los procesos musicales del país y ampliar sus oportunidades de encuentro con los públicos.
                    </p>
                    <div className="mt-8 flex items-center gap-3 text-[0.72rem] font-bold uppercase tracking-widest text-[#8BF784] font-alternate">
                      Explorar la estrategia <ArrowRight size={16} />
                    </div>
                  </div>
                </div>

                <div
                  className="relative overflow-hidden rounded-[2.5rem] border border-slate-100 min-h-[280px] group"
                >
                  <img
                    src="https://images.unsplash.com/photo-1774558396253-be05d7a37d82?q=80&w=1470&auto=format&fit=crop"
                    alt=""
                    className="absolute inset-0 w-full h-full object-cover"
                  />
                  <div className="absolute inset-0 bg-[#291242]/50"></div>
                  <div className="absolute inset-0 bg-gradient-to-t from-[#291242]/94 via-[#291242]/76 to-[#291242]/24"></div>
                  <div className="relative z-10 h-full min-h-[280px] p-8 flex flex-col justify-center">
                    <span className="text-[0.68rem] font-bold uppercase tracking-[0.28em] text-[#8BF784]">estrategia relacionada</span>
                    <h3 className="font-gregor text-3xl text-white font-bold uppercase leading-none tracking-tighter mt-4">Mercados Musicales</h3>
                    <p className="mt-5 text-[0.9rem] text-slate-200 font-nunito leading-relaxed">
                      Espacios de intercambio, conexión profesional y visibilización que fortalecen las redes del ecosistema musical y abren oportunidades de circulación para artistas, gestores y proyectos.
                    </p>
                    <div className="mt-8 flex items-center gap-3 text-[0.72rem] font-bold uppercase tracking-widest text-[#8BF784] font-alternate">
                      Explorar Estrategia <ArrowRight size={16} />
                    </div>
                  </div>
                </div>
              </>
            ) : (
              <div className="bg-slate-50 border border-slate-100 rounded-[2.5rem] p-10 space-y-6">
                 <h4 className="font-alternate text-sm font-bold uppercase tracking-[0.3em] text-slate-400">Recursos Relacionados</h4>
                 <div className="space-y-4">
                   {relatedEditorialResources.map((resource) => (
                     <div
                       key={resource.id}
                       onClick={() => onNavigateToEditorialResource?.(resource.id)}
                       className="flex items-center gap-4 bg-white p-4 rounded-xl border border-slate-100 group cursor-pointer hover:border-[#00DA5E] transition-all"
                     >
                        <div className="w-10 h-10 bg-slate-50 rounded-lg flex items-center justify-center text-[#291242] group-hover:bg-[#00DA5E] transition-colors"><FileText size={18}/></div>
                        <div className="flex flex-col">
                          <span className="text-[0.7rem] font-bold text-[#291242] uppercase font-alternate">{resource.title}</span>
                          <span className="text-[0.55rem] text-slate-400 uppercase tracking-widest">{resource.meta}</span>
                        </div>
                     </div>
                   ))}
                 </div>
              </div>
            )}
            <div className="bg-[#8BF784] rounded-[2.5rem] p-10 text-[#291242]">
              <h4 className="font-alternate text-2xl uppercase font-bold mb-4 leading-tight">¿Tienes dudas sobre este componente?</h4>
              <p className="text-sm font-nunito mb-8 leading-relaxed">Contáctanos para recibir asesoría técnica especializada sobre los procesos de este componente.</p>
              <Button variant="secondary" className="w-full">Contactar Componente</Button>
            </div>
          </aside>
        </div>
      </ContentWrapper>
    </div>
  );
};

const findEjeComponentById = (ejesData = [], componentId = '') => {
  if (!componentId) return null;

  for (const eje of ejesData) {
    const match = eje.components.find((component) => component.id === componentId);
    if (match) return match;
  }

  return null;
};

const ComponentRoutePage = ({
  onBack,
  onNavigate,
  onNavigateToEditorialResource,
  ejesData = [],
}) => {
  const { componentId = '' } = useParams();
  const cmsComponent = useMemo(
    () => {
      const baseComp = findEjeComponentById(ejesData, componentId);
      if (!baseComp) return null;
      // comp.id is like 'c1-1', 'c2-3', 'c3-2'
      const match = baseComp.id.match(/^c(\d+)-(\d+)$/);
      if (match) {
        const ejeNum = match[1].padStart(2, '0');
        const compNum = match[2];
        const cmsTitle = getWebText(`eje${ejeNum}_c${compNum}_title`);
        const cmsDesc = getWebText(`eje${ejeNum}_c${compNum}_desc`);
        return {
          ...baseComp,
          name: cmsTitle || baseComp.name,
          details: cmsDesc || baseComp.details,
          fullText: cmsDesc ? [cmsDesc] : baseComp.fullText,
        };
      }
      return baseComp;
    },
    [componentId, ejesData]
  );

  if (!cmsComponent) {
    return (
      <div className="bg-white min-h-screen pt-32 px-8 text-left font-nunito">
        <div className="relative mb-4 lg:mb-6 w-full text-left">
          <h2 className="font-gregor text-[#291242] uppercase tracking-tighter leading-[1.1] text-3xl lg:text-5xl text-balance">Componente no encontrado</h2>
        </div>
        <p className="text-slate-500 font-light mb-8">
          El componente solicitado no existe o cambió de identificador.
        </p>
        <Button onClick={onBack} variant="secondary">Volver a Ejes</Button>
      </div>
    );
  }

  return (
    <ComponentSubPage
      component={cmsComponent}
      onBack={onBack}
      onNavigate={onNavigate}
      onNavigateToEditorialResource={onNavigateToEditorialResource}
    />
  );
};

const UnknownRoutePage = ({ onGoHome }) => (
  <div className="bg-white min-h-screen pt-32 px-8 text-left font-nunito">
    <div className="relative mb-4 lg:mb-6 w-full text-left">
      <h2 className="font-gregor text-[#291242] uppercase tracking-tighter leading-[1.1] text-3xl lg:text-5xl text-balance">En Desarrollo</h2>
    </div>
    <p className="text-slate-500 font-light mb-8">Bajo construcción.</p>
    <Button onClick={onGoHome} variant="secondary">Volver al Inicio</Button>
  </div>
);

export {
  ComponentRoutePage,
  ComponentSubPage,
  UnknownRoutePage,
};
