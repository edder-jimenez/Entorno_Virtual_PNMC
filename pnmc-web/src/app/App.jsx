import React, { useCallback, useState, useEffect } from 'react';
import 'leaflet/dist/leaflet.css';
import { useLocation } from 'react-router-dom';
import {
  fetchDivipolaGrouped,
} from '../services/data/index.js';
import {
  getRuntimeDivipolaByDepartment,
  scrollToElementWithOffset,
  setRuntimeDivipolaByDepartment,
} from '../features/map/domain/mapDomain.js';
import { ejesDataGlobal } from '../features/content/domain/ejesData.js';
import { useAppNavigation } from '../hooks/useAppNavigation.js';
import { AppFooter } from '../components/layout/AppFooter.jsx';
import { AppNavigation } from '../components/layout/AppNavigation.jsx';
import { AppErrorBoundary } from '../components/system/AppErrorBoundary.jsx';
import { AppGlobalStyles } from './AppGlobalStyles.jsx';
import { AppFloatingStrategyButton } from './AppFloatingStrategyButton.jsx';
import { AppRoutes } from './AppRoutes.jsx';
import { preloadCriticalRoutes } from './appRoutePreload.js';
import { NAVIGATION_LINKS, PAGE_IDS, toComponentPageId } from '../services/navigation/routes.js';


export default function App() { 
  const { activePage, setActivePage } = useAppNavigation();
  const location = useLocation();
  const [, setDivipolaSnapshot] = useState(() => getRuntimeDivipolaByDepartment());
  const [scrolled, setScrolled] = useState(false); 
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [activeNavDropdown, setActiveNavDropdown] = useState(null);
  const [activeEjeMenuId, setActiveEjeMenuId] = useState(ejesDataGlobal[0]?.id || null);
  const [selectedArticle, setSelectedArticle] = useState(null);
  const [selectedAgendaEventId, setSelectedAgendaEventId] = useState(null);
  const [selectedEditorialResourceId, setSelectedEditorialResourceId] = useState(null);
  const [mapaNavigationRequest, setMapaNavigationRequest] = useState(null);

  useEffect(() => {
    let active = true;

    const syncDivipola = async () => {
      try {
        const grouped = await fetchDivipolaGrouped();
        if (!active) return;
        setRuntimeDivipolaByDepartment(grouped);
        setDivipolaSnapshot(grouped);
      } catch (error) {
        console.warn('No se pudo sincronizar DIVIPOLA desde backend:', error);
      }
    };

    syncDivipola();

    return () => {
      active = false;
    };
  }, [setDivipolaSnapshot]);

  const handlePageChange = useCallback((pageId) => {
    setActivePage(pageId);
    setSelectedArticle(null);
    setSelectedAgendaEventId(null);
    setSelectedEditorialResourceId(null);
    setMapaNavigationRequest(null);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [setActivePage]);

  const handleNavigateToArticle = useCallback((article) => {
    setSelectedArticle(article);
    setSelectedAgendaEventId(null);
    setSelectedEditorialResourceId(null);
    setActivePage(PAGE_IDS.noticias);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [setActivePage]);

  const handleNavigateToAgendaEvent = useCallback((eventId) => {
    setSelectedAgendaEventId(eventId);
    setSelectedArticle(null);
    setSelectedEditorialResourceId(null);
    setActivePage(PAGE_IDS.agenda);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [setActivePage]);

  const handleNavigateToEditorialResource = useCallback((resourceId) => {
    setSelectedEditorialResourceId(resourceId);
    setSelectedArticle(null);
    setSelectedAgendaEventId(null);
    setActivePage(PAGE_IDS.editorial);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [setActivePage]);

  const handleNavigateComponent = useCallback((compId) => {
    setActivePage(toComponentPageId(compId));
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [setActivePage]);

  const handleOpenMapParticipation = useCallback(() => {
    handlePageChange(PAGE_IDS.mapaParticipa);
  }, [handlePageChange]);

  const handleNavigateToMapLayer = useCallback((targetLayer = 'General', options = {}) => {
    const {
      targetView = 'map',
      scrollToWorkspace = true,
    } = options;

    setSelectedArticle(null);
    setSelectedAgendaEventId(null);
    setSelectedEditorialResourceId(null);
    setMapaNavigationRequest({
      requestId: Date.now(),
      targetLayer,
      targetView,
      scrollToWorkspace,
    });
    setActivePage(PAGE_IDS.mapa);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [setActivePage]);

  useEffect(() => { window.scrollTo({ top: 0, behavior: 'instant' }); }, [activePage]);
  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);
  useEffect(() => {
    let cancelled = false;
    let idleCallbackId = null;
    let timeoutId = null;

    const runPreload = () => {
      if (cancelled) return;
      preloadCriticalRoutes().catch((error) => {
        console.warn('No se pudo completar la precarga de rutas críticas:', error);
      });
    };

    if (typeof window !== 'undefined' && typeof window.requestIdleCallback === 'function') {
      idleCallbackId = window.requestIdleCallback(() => {
        runPreload();
      }, { timeout: 1500 });
    } else if (typeof window !== 'undefined') {
      timeoutId = window.setTimeout(runPreload, 1200);
    }

    return () => {
      cancelled = true;
      if (
        idleCallbackId !== null
        && typeof window !== 'undefined'
        && typeof window.cancelIdleCallback === 'function'
      ) {
        window.cancelIdleCallback(idleCallbackId);
      }
      if (timeoutId !== null && typeof window !== 'undefined') {
        window.clearTimeout(timeoutId);
      }
    };
  }, []);

  const navigationLinks = NAVIGATION_LINKS;
  const isMapV2Route = location.pathname.includes('/mapa-v2');
  const primaryNavigationLinks = navigationLinks.filter((link) => ![PAGE_IDS.editorial, PAGE_IDS.mapa].includes(link.id));
  const featuredNavigationLinks = navigationLinks.filter((link) => [PAGE_IDS.mapa, PAGE_IDS.editorial].includes(link.id));
  const ejeNavigationGroups = [
    {
      id: ejesDataGlobal[0]?.id || '01',
      name: 'Música para la vida',
      sectionId: 'musica-para-la-vida',
      components: ejesDataGlobal[0]?.components || [],
    },
    {
      id: ejesDataGlobal[1]?.id || '02',
      name: 'Oficios y prácticas',
      sectionId: 'oficios-y-practicas',
      components: ejesDataGlobal[1]?.components || [],
    },
    {
      id: ejesDataGlobal[2]?.id || '03',
      name: 'Gobernanza',
      sectionId: 'gobernanza',
      components: ejesDataGlobal[2]?.components || [],
    },
  ];

  const handleNavigateToPageSection = useCallback((pageId, sectionId) => {
    setMobileMenuOpen(false);
    setActiveNavDropdown(null);

    if (!sectionId) {
      handlePageChange(pageId);
      return;
    }

    if (activePage !== pageId) {
      handlePageChange(pageId);
      window.setTimeout(() => {
        const targetElement = document.getElementById(sectionId);
        if (targetElement) {
          scrollToElementWithOffset(targetElement);
        }
      }, 220);
      return;
    }

    const targetElement = document.getElementById(sectionId);
    if (targetElement) {
      scrollToElementWithOffset(targetElement);
      return;
    }

    window.setTimeout(() => {
      const delayedTargetElement = document.getElementById(sectionId);
      if (delayedTargetElement) {
        scrollToElementWithOffset(delayedTargetElement);
      }
    }, 120);
  }, [activePage, handlePageChange]);

  const handleNavigateToComponentFromMenu = useCallback((componentId) => {
    setMobileMenuOpen(false);
    setActiveNavDropdown(null);
    handleNavigateComponent(componentId);
  }, [handleNavigateComponent]);

  return (
    <AppErrorBoundary>
    <>
      <AppGlobalStyles /> 
      <div className="min-h-screen bg-white font-nunito text-slate-900 overflow-x-hidden">
        <AppNavigation
          scrolled={scrolled}
          forceSolid={isMapV2Route}
          mobileMenuOpen={mobileMenuOpen}
          setMobileMenuOpen={setMobileMenuOpen}
          activePage={activePage}
          activeNavDropdown={activeNavDropdown}
          setActiveNavDropdown={setActiveNavDropdown}
          activeEjeMenuId={activeEjeMenuId}
          setActiveEjeMenuId={setActiveEjeMenuId}
          navigationLinks={navigationLinks}
          primaryNavigationLinks={primaryNavigationLinks}
          featuredNavigationLinks={featuredNavigationLinks}
          ejeNavigationGroups={ejeNavigationGroups}
          onPageChange={handlePageChange}
          onNavigateToPageSection={handleNavigateToPageSection}
          onNavigateToComponentFromMenu={handleNavigateToComponentFromMenu}
        />

        <main className="min-h-screen">
          <AppRoutes
            setActivePage={setActivePage}
            handlePageChange={handlePageChange}
            handleNavigateComponent={handleNavigateComponent}
            handleNavigateToArticle={handleNavigateToArticle}
            handleNavigateToAgendaEvent={handleNavigateToAgendaEvent}
            handleNavigateToEditorialResource={handleNavigateToEditorialResource}
            handleNavigateToMapLayer={handleNavigateToMapLayer}
            handleOpenMapParticipation={handleOpenMapParticipation}
            selectedArticle={selectedArticle}
            selectedAgendaEventId={selectedAgendaEventId}
            selectedEditorialResourceId={selectedEditorialResourceId}
            mapaNavigationRequest={mapaNavigationRequest}
          />
        </main>

        {!isMapV2Route && (
          <AppFloatingStrategyButton
            activePage={activePage}
            setActivePage={setActivePage}
          />
        )}

        {activePage !== PAGE_IDS.home && !isMapV2Route && <AppFooter />}
      </div> 
    </>
    </AppErrorBoundary>
  ); 
}
