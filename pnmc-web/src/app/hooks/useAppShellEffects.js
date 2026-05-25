import { useEffect, useState } from 'react';
import { preloadCriticalRoutes } from '../appRoutePreload.js';

const useAppShellEffects = (activePage, selectedArticle = null, selectedAgendaEventId = null, selectedEditorialResourceId = null) => {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'instant' });
    const animationFrameId = window.requestAnimationFrame(() => setScrolled(false));
    return () => window.cancelAnimationFrame(animationFrameId);
  }, [activePage, selectedArticle, selectedAgendaEventId, selectedEditorialResourceId]);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', handleScroll, { passive: true });
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

  return { scrolled };
};

export { useAppShellEffects };
