import React from 'react';
import govLogo from '../../assets/branding/logo-gov-co.png';
import colombiaFooterLogo from '../../assets/branding/gov-co-footer.png';

export const AppFooter = () => (
  <footer className="bg-[#291242] text-white pt-20 pb-12 border-t border-white/5 font-nunito relative">
    <div className="max-w-[100rem] mx-auto px-6 lg:px-8">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12 lg:gap-0">
        <div className="space-y-8 flex flex-col items-center lg:items-start lg:pr-8">
          <div className="flex items-center gap-6">
            <div className="w-[10rem]">
              <img src={govLogo} className="w-full h-auto object-contain" alt="GOV.CO" />
            </div>
            <div className="border-l border-white/20 pl-6">
              <img src={colombiaFooterLogo} className="w-[4.25rem] h-auto object-contain" alt="Colombia" />
            </div>
          </div>
        </div>
        <div className="space-y-6 text-left lg:px-8 lg:border-l lg:border-white/20">
          <div className="pl-4">
            <h4 className="font-alternate text-sm font-bold uppercase tracking-widest text-white mb-4">Ministerio de las Culturas, <br /> las Artes y los Saberes</h4>
            <div className="space-y-4 text-[0.7rem] text-slate-300 font-light leading-relaxed">
              <p>Dirección: Calle 9 No. 8 - 31 Bogotá</p>
              <p>Horario de atención: 8:00 a.m. a 5:00 p.m. jornada continua.</p>
              <p>Teléfono: +57 (601) 3424100</p>
              <p>Línea gratuita: 018000 938081</p>
              <div className="flex flex-wrap gap-x-4 gap-y-2 pt-2 text-[0.62rem] font-alternate uppercase tracking-[0.18em] text-white/80">
                {['YouTube', 'Instagram', 'Facebook', 'X', 'WhatsApp', 'TikTok'].map((item) => (
                  <span key={item} className="hover:text-[#00DA5E] transition-colors cursor-pointer">{item}</span>
                ))}
              </div>
            </div>
          </div>
        </div>
        <div className="space-y-6 text-left lg:px-8 lg:border-l lg:border-white/20">
          <div className="pl-4">
            <h4 className="font-alternate text-sm font-bold uppercase tracking-widest text-white mb-4">Contacto Correspondencia</h4>
            <div className="space-y-4 text-[0.7rem] text-slate-300 font-light leading-relaxed">
              <p>Dirección: Calle 9 No. 8 - 31 Bogotá</p>
              <p>Lunes a viernes de 8:00 a.m. a 4:00 p.m. jornada continua</p>
              <div>
                <p>Correo:</p>
                <p className="text-white underline cursor-pointer">servicioalciudadano@mincultura.gov.co</p>
                <p>(Los correos que se reciban después de las 5:00 p. m., se radicarán el siguiente día hábil)</p>
              </div>
              <div>
                <p className="font-bold text-white">Registro de denuncias de corrupción:</p>
                <p className="text-white underline cursor-pointer">soytransparente@mincultura.gov.co</p>
              </div>
              <div>
                <p className="font-bold text-white">Notificaciones judiciales:</p>
                <p className="text-white underline cursor-pointer">notificaciones@mincultura.gov.co</p>
              </div>
            </div>
          </div>
        </div>
        <div className="grid grid-cols-1 gap-10 text-left lg:px-8 lg:border-l lg:border-white/20">
          <div className="pl-4">
            <h4 className="font-alternate text-sm font-bold uppercase tracking-widest text-white mb-4">Servicios a la Ciudadanía</h4>
            <ul className="space-y-2 text-[0.7rem] text-slate-300 font-light">
              {['PQRSD', 'Preguntas Frecuentes', 'Glosario', 'Trámites y servicios'].map((item) => (
                <li key={item} className="hover:text-[#00DA5E] underline cursor-pointer transition-colors">{item}</li>
              ))}
            </ul>
          </div>
          <div className="pl-4">
            <h4 className="font-alternate text-sm font-bold uppercase tracking-widest text-white mb-4">Acerca del sitio</h4>
            <ul className="space-y-2 text-[0.7rem] text-slate-300 font-light">
              {['Políticas', 'Política de privacidad y protección de datos', 'Mapa del sitio', 'Términos y condiciones', 'Accesibilidad'].map((item) => (
                <li key={item} className="hover:text-[#00DA5E] underline cursor-pointer transition-colors">{item}</li>
              ))}
            </ul>
          </div>
        </div>
      </div>
      <div className="mt-20 pt-8 border-t border-white/5 flex flex-col md:flex-row justify-between items-center gap-4 text-[0.6rem] text-slate-400 font-alternate uppercase tracking-[0.2em]">
        <p>Copyright © {new Date().getFullYear()}</p>
        <div className="flex items-center gap-2">
          <span className="text-[#00DA5E] font-bold">Colombia - Potencia de la Vida</span>
          <div className="w-1.5 h-1.5 rounded-full bg-[#00DA5E] animate-pulse"></div>
        </div>
      </div>
    </div>
  </footer>
);

export default AppFooter;
