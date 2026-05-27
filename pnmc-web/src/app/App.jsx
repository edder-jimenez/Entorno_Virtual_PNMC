import React, { useCallback, useState } from 'react';
import 'leaflet/dist/leaflet.css';
import { useLocation } from 'react-router-dom';
import {
  scrollToElementWithOffset,
} from '../features/map/domain/mapDomain.js';
import { ejesDataGlobal } from '../features/content/domain/ejesData.js';
import { useAppNavigation } from '../hooks/useAppNavigation.js';
import { AppFooter } from '../components/layout/AppFooter.jsx';
import { AppNavigation } from '../components/layout/AppNavigation.jsx';
import { AppErrorBoundary } from '../components/system/AppErrorBoundary.jsx';
import { AppGlobalStyles } from './AppGlobalStyles.jsx';
import { AppFloatingStrategyButton } from './AppFloatingStrategyButton.jsx';
import { AppRoutes } from './AppRoutes.jsx';
import { useDivipolaSync } from './hooks/useDivipolaSync.js';
import { useAppContentNavigation } from './hooks/useAppContentNavigation.js';
import { useAppShellEffects } from './hooks/useAppShellEffects.js';
import { NAVIGATION_LINKS, PAGE_IDS, PAGE_PATHS } from '../services/navigation/routes.js';


export default function App() { 
  const { activePage, setActivePage } = useAppNavigation();
  const location = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [activeNavDropdown, setActiveNavDropdown] = useState(null);
  const [activeEjeMenuId, setActiveEjeMenuId] = useState(ejesDataGlobal[0]?.id || null);
  const {
    selectedArticle,
    selectedAgendaEventId,
    selectedEditorialResourceId,
    mapaNavigationRequest,
    handlePageChange,
    handleNavigateToArticle,
    handleNavigateToAgendaEvent,
    handleNavigateToEditorialResource,
    handleNavigateComponent,
    handleNavigateToMapLayer,
    handleOpenMapParticipation,
  } = useAppContentNavigation(setActivePage);

  const { scrolled } = useAppShellEffects(
    activePage,
    selectedArticle,
    selectedAgendaEventId,
    selectedEditorialResourceId
  );

  useDivipolaSync();

  const navigationLinks = NAVIGATION_LINKS;
  const normalizedPathname = location.pathname.replace(/\/$/, '') || '/';
  const isAdminRoute = normalizedPathname === PAGE_PATHS[PAGE_IDS.admin]
    || normalizedPathname.startsWith(`${PAGE_PATHS[PAGE_IDS.admin]}/`);
  const isCollaboratorRoute = normalizedPathname === PAGE_PATHS[PAGE_IDS.colaboradores]
    || normalizedPathname.startsWith(`${PAGE_PATHS[PAGE_IDS.colaboradores]}/`);
  const isImmersiveMapRoute = normalizedPathname === PAGE_PATHS[PAGE_IDS.mapa];
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
      <div className="min-h-screen bg-white font-nunito text-slate-900">
        {!isAdminRoute && !isCollaboratorRoute && (
          <AppNavigation
            scrolled={scrolled}
            forceSolid={isImmersiveMapRoute}
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
        )}

        <main key={activePage} className="min-h-screen animate-page-entrance">
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

        {!isAdminRoute && !isCollaboratorRoute && !isImmersiveMapRoute && (
          <AppFloatingStrategyButton
            activePage={activePage}
            setActivePage={setActivePage}
          />
        )}

        {activePage !== PAGE_IDS.home && !isAdminRoute && !isCollaboratorRoute && !isImmersiveMapRoute && <AppFooter />}
      </div> 
    </>
    </AppErrorBoundary>
  ); 
}
