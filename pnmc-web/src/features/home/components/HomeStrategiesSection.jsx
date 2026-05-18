import { ChevronRight } from 'lucide-react';
import { Tag } from '../../shared/components/PagePrimitives.jsx';
import { ContentWrapper } from '../../shared/components/PagePrimitives.jsx';

export const HomeStrategiesSection = ({ onNavigate }) => (
  <ContentWrapper className="bg-white">
    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
      <div
        onClick={() => onNavigate('estrategia-circulacion')}
        className="rounded-[3rem] group transition-all border border-slate-100 flex flex-col justify-end min-h-[420px] shadow-sm cursor-pointer text-left relative overflow-hidden"
      >
        <img src="https://images.unsplash.com/photo-1774558396280-c14b21198674?q=80&w=1470&auto=format&fit=crop" alt="" className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-[1.03]" />
        <div className="absolute inset-0 bg-white/28"></div>
        <div className="absolute inset-0 bg-gradient-to-t from-white/72 via-white/36 to-white/0 transition-all duration-500 group-hover:from-white/80 group-hover:via-white/42 group-hover:to-white/0"></div>
        <div className="absolute -right-20 -top-20 w-80 h-80 bg-white/20 rounded-full blur-[100px] transition-all group-hover:scale-125"></div>
        <div className="absolute top-8 left-8 z-10">
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onNavigate('comp-c2-3');
            }}
          >
            <Tag text="Estrategia de Circulación" className="bg-[#291242] text-white" />
          </button>
        </div>
        <div className="relative z-10 m-6 lg:m-8">
          <h3 className="px-1 font-gregor text-4xl lg:text-5xl text-[#291242] font-bold uppercase leading-none tracking-tighter transition-all duration-300 group-hover:opacity-0 group-hover:-translate-y-2">Celebra la Música</h3>
          <div className="mt-4 max-h-0 overflow-hidden rounded-[2.2rem] border border-transparent bg-transparent p-0 opacity-0 transition-all duration-500 group-hover:max-h-48 group-hover:border-white/75 group-hover:bg-white/96 group-hover:p-7 group-hover:opacity-100 group-hover:backdrop-blur-sm lg:group-hover:p-8">
            <div className="w-12 h-1 rounded-full bg-[#291242] mb-5"></div>
            <h3 className="font-gregor text-3xl lg:text-4xl text-[#291242] font-bold uppercase leading-none tracking-tighter">Celebra la Música</h3>
            <p className="text-[0.95rem] text-[#291242]/78 font-nunito leading-relaxed">Activa escenarios, programación y redes territoriales para que los procesos musicales circulen, se conecten y ganen visibilidad.</p>
            <div className="mt-6 text-[0.7rem] font-bold text-[#291242] flex items-center gap-3 uppercase font-alternate tracking-widest">
              Explorar Estrategia <ChevronRight size={16} />
            </div>
          </div>
        </div>
      </div>

      <div
        onClick={() => onNavigate('estrategia-investigacion')}
        className="rounded-[3rem] text-[#291242] shadow-xl flex flex-col justify-end min-h-[420px] relative overflow-hidden group cursor-pointer"
      >
        <img src="https://images.unsplash.com/photo-1774558396253-be05d7a37d82?q=80&w=1470&auto=format&fit=crop" alt="" className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-[1.03]" />
        <div className="absolute inset-0 bg-white/28"></div>
        <div className="absolute inset-0 bg-gradient-to-t from-white/72 via-white/36 to-white/0 transition-all duration-500 group-hover:from-white/80 group-hover:via-white/42 group-hover:to-white/0"></div>
        <div className="absolute -right-20 -top-20 w-80 h-80 bg-white/20 rounded-full blur-[100px] transition-all group-hover:scale-125"></div>
        <div className="absolute top-8 left-8 z-10">
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onNavigate('comp-c2-4');
            }}
          >
            <Tag text="Estrategia de Investigación" className="bg-[#291242] text-white" />
          </button>
        </div>
        <div className="relative z-10 m-6 lg:m-8">
          <h3 className="px-1 font-gregor text-4xl lg:text-5xl font-bold uppercase leading-none tracking-tighter transition-all duration-300 group-hover:opacity-0 group-hover:-translate-y-2">Territorios Sonoros</h3>
          <div className="mt-4 max-h-0 overflow-hidden rounded-[2.2rem] border border-transparent bg-transparent p-0 opacity-0 transition-all duration-500 group-hover:max-h-48 group-hover:border-white/75 group-hover:bg-white/96 group-hover:p-7 group-hover:opacity-100 group-hover:backdrop-blur-sm lg:group-hover:p-8">
            <div className="w-12 h-1 rounded-full bg-[#291242] mb-5"></div>
            <h3 className="font-gregor text-3xl lg:text-4xl font-bold uppercase leading-none tracking-tighter">Territorios Sonoros</h3>
            <p className="text-[0.95rem] text-[#291242]/78 font-nunito leading-relaxed">Impulsa procesos de investigación, cartografía y documentación para reconocer, interpretar y proyectar la diversidad sonora del país.</p>
            <div className="mt-6 text-[0.7rem] font-bold text-[#291242] flex items-center gap-3 uppercase font-alternate tracking-widest">
              Explorar Estrategia <ChevronRight size={16} />
            </div>
          </div>
        </div>
      </div>
    </div>
  </ContentWrapper>
);
