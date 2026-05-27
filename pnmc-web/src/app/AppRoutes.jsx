import React, { Suspense, lazy } from 'react';
import { Navigate, Route, Routes } from 'react-router-dom';
import { ejesDataGlobal } from '../features/content/domain/ejesData.js';
import { PAGE_IDS, PAGE_PATHS } from '../services/navigation/routes.js';

const HOME_CONTENT_IMPORT = () => import('../features/home/pages/HomeContent.jsx');
const GALLERY_PAGES_IMPORT = () => import('../features/gallery/pages/GaleriaPage.jsx');
const EJES_PAGE_IMPORT = () => import('../features/content/pages/EjesPage.jsx');
const COMPONENT_PAGES_IMPORT = () => import('../features/content/pages/ComponentPages.jsx');
const EDITORIAL_PAGE_IMPORT = () => import('../features/editorial/pages/EditorialPage.jsx');
const MAPA_ECOSISTEMICO_PAGE_IMPORT = () => import('../features/map/pages/MapaEcosistemicoPage.jsx');
const AGENDA_PAGE_IMPORT = () => import('../features/agenda/pages/AgendaPage.jsx');
const NOTICIAS_PAGE_IMPORT = () => import('../features/news/pages/NoticiasPage.jsx');
const STRATEGY_SUBPAGE_IMPORT = () => import('../features/content/pages/StrategySubPage.jsx');
const ADMIN_SHELL_PAGE_IMPORT = () => import('../features/admin/pages/AdminShellPage.jsx');

const HomeContent = lazy(() => HOME_CONTENT_IMPORT().then((module) => ({ default: module.HomeContent })));
const SobreElPnmcPage = lazy(() => GALLERY_PAGES_IMPORT().then((module) => ({ default: module.SobreElPnmcPage })));
const EjesPage = lazy(() => EJES_PAGE_IMPORT().then((module) => ({ default: module.EjesPage })));
const ComponentRoutePage = lazy(() => COMPONENT_PAGES_IMPORT().then((module) => ({ default: module.ComponentRoutePage })));
const UnknownRoutePage = lazy(() => COMPONENT_PAGES_IMPORT().then((module) => ({ default: module.UnknownRoutePage })));
const EditorialPage = lazy(() => EDITORIAL_PAGE_IMPORT().then((module) => ({ default: module.EditorialPage })));
const GaleriaPage = lazy(() => GALLERY_PAGES_IMPORT().then((module) => ({ default: module.GaleriaPage })));
const MapaEcosistemicoPage = lazy(() => MAPA_ECOSISTEMICO_PAGE_IMPORT().then((module) => ({ default: module.MapaEcosistemicoPage })));
const AgendaPage = lazy(() => AGENDA_PAGE_IMPORT().then((module) => ({ default: module.AgendaPage })));
const NoticiasPage = lazy(() => NOTICIAS_PAGE_IMPORT().then((module) => ({ default: module.NoticiasPage })));
const StrategySubPage = lazy(() => STRATEGY_SUBPAGE_IMPORT().then((module) => ({ default: module.StrategySubPage })));
const AdminShellPage = lazy(() => ADMIN_SHELL_PAGE_IMPORT().then((module) => ({ default: module.AdminShellPage })));

const ROUTE_FALLBACK = (
  <div
    className="min-h-[60vh] flex flex-col items-center justify-center gap-4 text-[#291242] animate-fade-in"
    aria-live="polite"
    aria-busy="true"
  >
    <div className="relative flex h-12 w-12 items-center justify-center">
      <div className="absolute inset-0 rounded-full border-4 border-slate-100" />
      <div className="absolute inset-0 rounded-full border-4 border-t-[#291242] border-r-[#00DA5E] animate-spin" />
    </div>
    <span className="text-[0.62rem] font-black uppercase tracking-[0.22em] text-[#291242]/70 font-alternate">
      Consolidando contenidos...
    </span>
  </div>
);

const withSuspense = (element) => (
  <Suspense fallback={ROUTE_FALLBACK}>
    {element}
  </Suspense>
);

const AppRoutes = ({
  setActivePage,
  handlePageChange,
  handleNavigateComponent,
  handleNavigateToArticle,
  handleNavigateToAgendaEvent,
  handleNavigateToEditorialResource,
  handleNavigateToMapLayer,
  handleOpenMapParticipation,
  selectedArticle,
  selectedAgendaEventId,
  selectedEditorialResourceId,
  mapaNavigationRequest,
}) => {
  return (
    <Routes>
      <Route
        path={PAGE_PATHS[PAGE_IDS.home]}
        element={withSuspense(
          <HomeContent
            setPage={handlePageChange}
            onNavigateToArticle={handleNavigateToArticle}
            onNavigateToAgendaEvent={handleNavigateToAgendaEvent}
            onNavigateToMapLayer={handleNavigateToMapLayer}
            onOpenMapParticipation={handleOpenMapParticipation}
          />
        )}
      />
      <Route
        path={PAGE_PATHS[PAGE_IDS.pnmc]}
        element={withSuspense(
          <SobreElPnmcPage
            onBack={() => setActivePage(PAGE_IDS.home)}
            onNavigate={handlePageChange}
          />
        )}
      />
      <Route
        path={PAGE_PATHS[PAGE_IDS.ejes]}
        element={withSuspense(
          <EjesPage
            onBack={() => setActivePage(PAGE_IDS.home)}
            onNavigateComponent={handleNavigateComponent}
          />
        )}
      />
      <Route
        path="/ejes/componentes/:componentId"
        element={withSuspense(
          <ComponentRoutePage
            onBack={() => setActivePage(PAGE_IDS.ejes)}
            onNavigate={handlePageChange}
            onNavigateToEditorialResource={handleNavigateToEditorialResource}
            ejesData={ejesDataGlobal}
          />
        )}
      />
      <Route
        path={PAGE_PATHS[PAGE_IDS.editorial]}
        element={withSuspense(
          <EditorialPage
            key={`editorial-${selectedEditorialResourceId || 'base'}`}
            onBack={() => setActivePage(PAGE_IDS.home)}
            initialExpandedResourceId={selectedEditorialResourceId}
          />
        )}
      />
      <Route
        path={PAGE_PATHS[PAGE_IDS.galeria]}
        element={withSuspense(<GaleriaPage onBack={() => setActivePage(PAGE_IDS.home)} />)}
      />
      <Route
        path={PAGE_PATHS[PAGE_IDS.mapa]}
        element={withSuspense(
          <MapaEcosistemicoPage
            onBack={() => setActivePage(PAGE_IDS.home)}
            navigationRequest={mapaNavigationRequest}
            onOpenParticipation={handleOpenMapParticipation}
          />
        )}
      />
      <Route
        path={PAGE_PATHS[PAGE_IDS.mapaParticipa]}
        element={<Navigate to={PAGE_PATHS[PAGE_IDS.colaboradores]} replace />}
      />
      <Route
        path={`${PAGE_PATHS[PAGE_IDS.admin]}/*`}
        element={withSuspense(<AdminShellPage />)}
      />
      <Route
        path={PAGE_PATHS[PAGE_IDS.colaboradores]}
        element={withSuspense(<AdminShellPage initialPortal="external" />)}
      />
      <Route
        path={PAGE_PATHS[PAGE_IDS.agenda]}
        element={withSuspense(
          <AgendaPage
            onBack={() => handlePageChange(PAGE_IDS.home)}
            initialOpenEventId={selectedAgendaEventId}
          />
        )}
      />
      <Route
        path={PAGE_PATHS[PAGE_IDS.noticias]}
        element={withSuspense(
          <NoticiasPage
            onBack={() => setActivePage(PAGE_IDS.home)}
            initialSelectedArticle={selectedArticle}
          />
        )}
      />
      <Route
        path={PAGE_PATHS[PAGE_IDS.estrategiaCirculacion]}
        element={withSuspense(
          <StrategySubPage
            title="Celebra la Música"
            context="Estrategia de Circulación"
            onBack={() => setActivePage(PAGE_IDS.home)}
            onNavigate={handlePageChange}
          />
        )}
      />
      <Route
        path={PAGE_PATHS[PAGE_IDS.estrategiaInvestigacion]}
        element={withSuspense(
          <StrategySubPage
            title="Territorios Sonoros"
            context="Estrategia de Investigación"
            onBack={() => setActivePage(PAGE_IDS.home)}
            onNavigate={handlePageChange}
          />
        )}
      />
      <Route path="/home" element={<Navigate to={PAGE_PATHS[PAGE_IDS.home]} replace />} />
      <Route
        path="*"
        element={withSuspense(<UnknownRoutePage onGoHome={() => setActivePage(PAGE_IDS.home)} />)}
      />
    </Routes>
  );
};

export { AppRoutes };
