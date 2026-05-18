import React from 'react';
import { PartyPopper } from 'lucide-react';
import { PAGE_IDS } from '../services/navigation/routes.js';

const AppFloatingStrategyButton = ({ activePage, setActivePage }) => {
  if (activePage === PAGE_IDS.estrategiaCirculacion) {
    return null;
  }

  return (
    <button
      className="fixed bottom-6 right-6 z-[60] flex items-center bg-[#00DA5E] text-[#291242] p-2 rounded-full shadow-2xl hover:scale-105 active:scale-95 transition-all duration-500 border border-white/20 group max-w-[54px] hover:max-w-[280px] overflow-hidden whitespace-nowrap focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#291242] focus-visible:ring-offset-2"
      onClick={() => setActivePage(PAGE_IDS.estrategiaCirculacion)}
      aria-label="Abrir estrategia Celebra la música"
    >
      <div className="w-10 h-10 bg-[#291242] text-[#00DA5E] rounded-full flex items-center justify-center shrink-0">
        <PartyPopper size={18} />
      </div>
      <span className="font-alternate text-[0.65rem] font-bold uppercase tracking-widest px-4 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
        Celebra la música
      </span>
    </button>
  );
};

export { AppFloatingStrategyButton };
