import { useCallback, useState } from 'react';
import { PAGE_IDS, toComponentPageId } from '../../services/navigation/routes.js';

const useAppContentNavigation = (setActivePage) => {
  const [selectedArticle, setSelectedArticle] = useState(null);
  const [selectedAgendaEventId, setSelectedAgendaEventId] = useState(null);
  const [selectedEditorialResourceId, setSelectedEditorialResourceId] = useState(null);
  const [mapaNavigationRequest, setMapaNavigationRequest] = useState(null);

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

  const handleNavigateComponent = useCallback((componentId) => {
    setActivePage(toComponentPageId(componentId));
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [setActivePage]);

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

  const handleOpenMapParticipation = useCallback(() => {
    handlePageChange(PAGE_IDS.colaboradores);
  }, [handlePageChange]);

  return {
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
  };
};

export { useAppContentNavigation };
