const preloadCriticalRoutes = () => {
  return Promise.allSettled([
    import('../features/home/pages/HomeContent.jsx'),
    import('../features/agenda/pages/AgendaPage.jsx'),
    import('../features/news/pages/NoticiasPage.jsx'),
    import('../features/editorial/pages/EditorialPage.jsx'),
  ]);
};

export { preloadCriticalRoutes };
