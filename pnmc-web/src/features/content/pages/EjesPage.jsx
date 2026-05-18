import React, { useState } from 'react';
import { ArrowUpRight, Play, Target } from 'lucide-react';
import {
  ContentWrapper,
  PageHero,
  Tag,
} from '../../shared/components/PagePrimitives.jsx';
import { ejesDataGlobal } from '../domain/ejesData.js';

const AxisSection = ({ eje, onNavigateComponent }) => {
  const [expandedIndex, setExpandedIndex] = useState(0);

  return (
    <div className="py-12 md:py-24 border-b border-slate-100 last:border-0">
      <ContentWrapper className="!py-0">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-20 items-center mb-12">
          <div className="lg:col-span-5 space-y-6">
            <div className="flex items-center gap-4"><span className="font-gregor text-6xl text-[#8BF784] font-bold leading-none">{eje.id}</span><div className="h-px flex-1 bg-slate-100"></div></div>
            <h3 className="font-alternate text-4xl lg:text-5xl text-[#291242] font-bold uppercase leading-none tracking-tight">{eje.title}</h3>
            <div className="space-y-6">
              {eje.axisExplain.map((paragraph, idx) => (
                <p key={idx} className="font-nunito text-slate-600 font-light text-base leading-relaxed">{paragraph}</p>
              ))}
            </div>
          </div>
          <div className="lg:col-span-7">
            <div className="relative rounded-[2.5rem] overflow-hidden bg-slate-100 shadow-2xl group border-8 border-slate-50 flex flex-col">
              <div className="relative aspect-video w-full overflow-hidden">
                <img src={eje.videoImg} className="w-full h-full object-cover grayscale opacity-60 group-hover:grayscale-0 transition-all duration-1000" alt="" />
                <div className="absolute inset-0 flex items-center justify-center">
                  <button className="w-20 h-20 bg-[#8BF784] text-[#291242] rounded-full flex items-center justify-center shadow-2xl hover:scale-110 active:scale-95 transition-all">
                    <Play size={32} fill="currentColor" />
                  </button>
                </div>
              </div>
              {eje.purpose && (
                <div className="bg-[#291242] p-8 relative overflow-hidden group/purpose border-t border-white/5">
                  <div className="relative z-10">
                    <div className="flex items-center gap-3 text-[#00DA5E] mb-3">
                      <Target size={20} />
                      <span className="font-alternate font-bold uppercase tracking-widest text-xs">Propósito del Eje</span>
                    </div>
                    <p className="text-white/80 font-nunito text-lg font-light leading-relaxed italic">
                      {eje.purpose}
                    </p>
                  </div>
                  <div className="absolute -right-10 -bottom-10 w-40 h-40 bg-white/5 rounded-full blur-2xl group-hover/purpose:scale-125 transition-transform duration-1000"></div>
                </div>
              )}
            </div>
          </div>
        </div>
        <div className="bg-slate-50/70 p-4 md:p-8 rounded-[2.5rem] border border-slate-100">
          <div className="mb-6 px-4"><span className="text-[0.55rem] font-bold text-slate-400 uppercase tracking-[0.3em] font-alternate block">Estructura Interna</span><h4 className="font-alternate text-lg text-[#291242] font-bold uppercase tracking-widest">Componentes del Eje {eje.id}</h4></div>
          <div className="flex flex-col gap-3">
            {eje.components.map((comp, index) => {
              const isExpanded = expandedIndex === index;
              return (
                <div key={comp.id} onClick={() => setExpandedIndex(index)} className={`relative transition-all duration-700 ease-[cubic-bezier(0.4,0,0.2,1)] cursor-pointer overflow-hidden rounded-[1.8rem] border ${isExpanded ? 'bg-white border-[#8BF784] shadow-lg' : 'bg-slate-200/50 border-transparent hover:bg-slate-200'}`}>
                  <div className={`flex items-center gap-5 px-6 py-5 md:px-8 md:py-6 transition-all duration-500 ${isExpanded ? 'border-b border-slate-100' : ''}`}>
                    <span className={`font-gregor text-2xl font-bold leading-none transition-all duration-500 ${isExpanded ? 'text-[#8BF784]' : 'text-slate-300'}`}>0{index + 1}</span>
                    <span className={`font-alternate text-[0.72rem] md:text-[0.8rem] uppercase tracking-[0.22em] font-bold transition-colors duration-500 ${isExpanded ? 'text-[#291242]' : 'text-slate-500'}`}>
                      {comp.name}
                    </span>
                  </div>
                  <div className={`overflow-hidden transition-all duration-700 ${isExpanded ? 'max-h-[420px] opacity-100' : 'max-h-0 opacity-0 pointer-events-none'}`}>
                    <div className="p-8 md:p-10 flex flex-col">
                      <Tag text={`Componente 0${index + 1}`} className="bg-[#291242] text-white mb-4 self-start" />
                      <h5
                        onClick={(event) => {
                          event.stopPropagation();
                          onNavigateComponent(comp.id);
                        }}
                        className="font-alternate text-2xl lg:text-3xl text-[#291242] font-bold uppercase leading-tight md:leading-tight mb-4 hover:text-[#00DA5E] cursor-pointer transition-colors duration-300"
                      >
                        {comp.name}
                      </h5>
                      <p className="font-nunito text-slate-600 text-sm leading-relaxed font-light line-clamp-3">{comp.details}</p>
                      <button
                        onClick={(event) => {
                          event.stopPropagation();
                          onNavigateComponent(comp.id);
                        }}
                        className="mt-8 flex items-center gap-2 text-[0.6rem] font-bold text-[#291242] uppercase font-alternate tracking-widest group/btn transition-all duration-300 hover:gap-4 hover:text-[#00DA5E]"
                      >
                        Explorar componente
                        <ArrowUpRight size={12} className="transition-transform duration-300 group-hover/btn:translate-x-1 group-hover/btn:-translate-y-1" />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </ContentWrapper>
    </div>
  );
};

const EjesPage = ({ onBack, onNavigateComponent }) => {
  return (
    <div className="bg-white min-h-screen pb-20 text-left">
      <PageHero tag="Ejes" title="Ejes de" titleAccent="Transformación" description="Explora las dimensiones fundamentales del PNMC." bgImage="https://images.unsplash.com/photo-1774558396253-be05d7a37d82?q=80&w=1470&auto=format&fit=crop" onBack={onBack} />
      {ejesDataGlobal.map((eje, index) => (
        <div
          key={eje.id}
          id={
            index === 0
              ? 'musica-para-la-vida'
              : index === 1
                ? 'oficios-y-practicas'
                : 'gobernanza'
          }
          className="scroll-mt-24"
        >
          <AxisSection eje={eje} onNavigateComponent={onNavigateComponent} />
        </div>
      ))}
    </div>
  );
};

export { EjesPage };
