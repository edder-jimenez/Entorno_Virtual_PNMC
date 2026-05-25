import React from 'react';
import { ArrowUpRight, ChevronDown, ChevronRight, Menu, X } from 'lucide-react';
import pnmcBlancoLogo from '../../assets/branding/pnmc-blanco.png';

const isEjesRelatedPage = (activePage = '') => activePage === 'ejes' || activePage.startsWith('comp-');

export const AppNavigation = ({
  scrolled,
  forceSolid = false,
  mobileMenuOpen,
  setMobileMenuOpen,
  activePage,
  activeNavDropdown,
  setActiveNavDropdown,
  activeEjeMenuId,
  setActiveEjeMenuId,
  navigationLinks,
  primaryNavigationLinks,
  featuredNavigationLinks,
  ejeNavigationGroups,
  onPageChange,
  onNavigateToPageSection,
  onNavigateToComponentFromMenu,
}) => {
  const isActiveLink = (linkId) => {
    if (linkId === 'ejes') return isEjesRelatedPage(activePage);
    return activePage === linkId;
  };

  return (
    <nav
      className={`fixed w-full z-[3000] transition-all duration-300 px-6 lg:px-12 ${
        forceSolid || scrolled || mobileMenuOpen
          ? 'py-4 bg-[#291242]/95 backdrop-blur-md shadow-lg border-b border-white/5'
          : 'py-8 bg-transparent'
      }`}
      aria-label="Navegación principal"
    >
      <div className="max-w-[100rem] mx-auto flex justify-between items-center h-12">
        <div className="flex items-center gap-10 min-w-0">
          <button
            type="button"
            className="flex items-center gap-4 cursor-pointer shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#00DA5E] focus-visible:ring-offset-2 focus-visible:ring-offset-[#291242] rounded-lg"
            onClick={() => onPageChange('home')}
            aria-label="Ir al inicio"
          >
            <img src={pnmcBlancoLogo} className="h-10 sm:h-12 md:h-14 lg:h-16 w-auto object-contain transition-all" alt="PNMC" />
          </button>

          <div className="hidden lg:flex items-center gap-8">
            {primaryNavigationLinks.map((link) => {
              const hasEjesMenu = link.id === 'ejes';
              const activeEjeGroup = ejeNavigationGroups.find((group) => group.id === activeEjeMenuId) || ejeNavigationGroups[0];

              return (
                <div
                  key={link.id}
                  className="relative"
                  onMouseEnter={() => {
                    if (!hasEjesMenu) return;
                    setActiveNavDropdown(link.id);
                    setActiveEjeMenuId(ejeNavigationGroups[0]?.id || null);
                  }}
                  onMouseLeave={() => setActiveNavDropdown((currentDropdown) => (currentDropdown === link.id ? null : currentDropdown))}
                >
                  <button
                    type="button"
                    onClick={() => onPageChange(link.id)}
                    className={hasEjesMenu
                      ? `inline-flex items-center gap-2 text-[0.7rem] font-bold uppercase font-alternate tracking-widest transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#00DA5E] focus-visible:ring-offset-2 focus-visible:ring-offset-[#291242] rounded-md ${
                          isActiveLink(link.id) || activeNavDropdown === link.id
                            ? 'text-[#00DA5E]'
                            : 'text-white/72 hover:text-[#00DA5E]'
                        }`
                      : `text-[0.7rem] font-bold uppercase font-alternate transition-all tracking-widest focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#00DA5E] focus-visible:ring-offset-2 focus-visible:ring-offset-[#291242] rounded-md ${
                          isActiveLink(link.id) ? 'text-[#00DA5E]' : 'text-white/68 hover:text-[#00DA5E]'
                        }`}
                    aria-expanded={hasEjesMenu ? activeNavDropdown === link.id : undefined}
                  >
                    {link.name}
                    {hasEjesMenu && <ChevronDown size={13} className={`transition-transform ${activeNavDropdown === link.id ? 'rotate-180' : ''}`} />}
                  </button>

                  {hasEjesMenu && activeNavDropdown === link.id && (
                    <div className="absolute left-0 top-full w-[min(66rem,calc(100vw-4rem))] pt-5">
                      <div className="overflow-hidden rounded-[2.5rem] border border-slate-200/80 bg-white/95 shadow-2xl backdrop-blur-xl p-2">
                        <div className="grid grid-cols-[18rem_minmax(0,1fr)] gap-2">
                          <div className="bg-slate-50/70 rounded-[2rem] p-3 space-y-1">
                            {ejeNavigationGroups.map((group) => {
                              const isActiveGroup = activeEjeGroup?.id === group.id;
                              return (
                                <button
                                  key={group.id}
                                  type="button"
                                  onMouseEnter={() => setActiveEjeMenuId(group.id)}
                                  onFocus={() => setActiveEjeMenuId(group.id)}
                                  onClick={() => onNavigateToPageSection(link.id, group.sectionId)}
                                  className={`flex w-full items-center justify-between gap-4 rounded-2xl px-5 py-4 text-left text-[0.65rem] font-bold uppercase tracking-[0.18em] transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#00DA5E] focus-visible:ring-offset-2 ${
                                    isActiveGroup
                                      ? 'bg-[#00DA5E] text-[#291242] shadow-sm'
                                      : 'text-slate-500 hover:bg-white hover:text-[#291242] hover:shadow-sm'
                                  }`}
                                >
                                  <span>{group.name}</span>
                                  <ChevronRight size={14} className={`shrink-0 transition-transform ${isActiveGroup ? 'translate-x-1' : ''}`} />
                                </button>
                              );
                            })}
                          </div>

                          <div className="p-6 pl-4 flex flex-col justify-center">
                            <div className="pb-5">
                              <div className="text-[0.65rem] font-bold uppercase tracking-[0.2em] text-slate-400">Componentes del eje</div>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
                              {(activeEjeGroup?.components || []).map((component) => (
                                <button
                                  key={component.id}
                                  type="button"
                                  onClick={() => onNavigateToComponentFromMenu(component.id)}
                                  className="group flex min-h-[4.5rem] w-full items-center justify-between gap-4 rounded-[1.25rem] border border-slate-100 bg-white px-5 py-3 text-left text-[0.65rem] font-bold tracking-[0.05em] text-slate-600 shadow-sm transition-all hover:-translate-y-0.5 hover:border-[#00DA5E]/50 hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#00DA5E] focus-visible:ring-offset-2"
                                >
                                  <span className="line-clamp-2 leading-relaxed group-hover:text-[#291242]">{component.name}</span>
                                  <div className="flex items-center justify-center w-7 h-7 rounded-full bg-slate-50 group-hover:bg-[#00DA5E]/10 shrink-0 transition-colors">
                                    <ArrowUpRight size={14} className="text-slate-400 group-hover:text-[#00DA5E] transition-colors" />
                                  </div>
                                </button>
                              ))}
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        <div className="hidden lg:flex items-center gap-3">
          {featuredNavigationLinks.map((link) => (
            <button
              key={link.id}
              type="button"
              onClick={() => onPageChange(link.id)}
              className={`px-5 py-3 rounded-xl text-[0.72rem] font-bold uppercase font-alternate tracking-widest transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#00DA5E] focus-visible:ring-offset-2 focus-visible:ring-offset-[#291242] ${
                link.id === 'mapa'
                  ? isActiveLink(link.id)
                    ? 'bg-[#8BF784] text-[#291242] shadow-sm'
                    : 'bg-[#00DA5E] text-[#291242] hover:bg-[#8BF784] shadow-sm'
                  : isActiveLink(link.id)
                    ? 'bg-white text-[#291242]'
                    : 'border border-white/25 text-white hover:border-white/40 hover:bg-white/10'
              }`}
            >
              {link.name}
            </button>
          ))}
        </div>

        <button
          type="button"
          className="lg:hidden text-white cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#00DA5E] focus-visible:ring-offset-2 focus-visible:ring-offset-[#291242] rounded-md"
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          aria-expanded={mobileMenuOpen}
          aria-label="Abrir menú móvil"
        >
          {mobileMenuOpen ? <X size={28} /> : <Menu size={28} />}
        </button>
      </div>

      {mobileMenuOpen && (
        <div className="lg:hidden absolute top-full left-0 w-full bg-[#291242] border-t border-white/10 p-8 flex flex-col gap-6 shadow-2xl animate-in slide-in-from-top duration-300">
          {navigationLinks.map((link) => (
            <button
              key={link.id}
              type="button"
              onClick={() => {
                onPageChange(link.id);
                setMobileMenuOpen(false);
              }}
              className={`text-[0.9rem] font-bold uppercase font-alternate text-left tracking-widest focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#00DA5E] focus-visible:ring-offset-2 focus-visible:ring-offset-[#291242] rounded-md ${
                isActiveLink(link.id) ? 'text-[#00DA5E]' : 'text-white/60 hover:text-[#00DA5E]'
              }`}
            >
              {link.name}
            </button>
          ))}
        </div>
      )}
    </nav>
  );
};

export default AppNavigation;
