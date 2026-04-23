import { useCallback, useMemo } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { getPageIdFromPath, getPathForPageId } from '../services/navigation/routes.js';

export const useAppNavigation = () => {
  const navigate = useNavigate();
  const location = useLocation();

  const activePage = useMemo(
    () => getPageIdFromPath(location.pathname),
    [location.pathname],
  );

  const setActivePage = useCallback((pageId, options = {}) => {
    const nextPath = getPathForPageId(pageId);
    const shouldReplace = options.replace ?? false;

    if (nextPath !== location.pathname || shouldReplace) {
      navigate(nextPath, { replace: shouldReplace, state: options.state });
    }
  }, [location.pathname, navigate]);

  return {
    activePage,
    pathname: location.pathname,
    locationState: location.state,
    setActivePage,
  };
};
