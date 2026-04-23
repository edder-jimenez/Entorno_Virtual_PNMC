import { useEffect } from 'react';
import { Compass, ZoomIn, ZoomOut } from 'lucide-react';
import { useMap } from 'react-leaflet';

const MapZoomControls = ({ initialBounds }) => {
  const map = useMap();

  return (
    <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-[1001] flex items-center gap-2">
      <button
        type="button"
        onClick={() => map.fitBounds(initialBounds, { paddingTopLeft: [28, 20], paddingBottomRight: [0, 0] })}
        className="w-11 h-11 rounded-2xl bg-white border border-slate-200 shadow-lg flex items-center justify-center text-[#291242] hover:bg-slate-50 transition-all"
        aria-label="Volver al encuadre inicial"
      >
        <Compass size={18} />
      </button>
      <button
        type="button"
        onClick={() => map.zoomOut()}
        className="w-11 h-11 rounded-2xl bg-white border border-slate-200 shadow-lg flex items-center justify-center text-[#291242] hover:bg-slate-50 transition-all"
        aria-label="Alejar mapa"
      >
        <ZoomOut size={18} />
      </button>
      <button
        type="button"
        onClick={() => map.zoomIn()}
        className="w-11 h-11 rounded-2xl bg-white border border-slate-200 shadow-lg flex items-center justify-center text-[#291242] hover:bg-slate-50 transition-all"
        aria-label="Acercar mapa"
      >
        <ZoomIn size={18} />
      </button>
    </div>
  );
};

const MapZoomLimiter = ({ initialBounds }) => {
  const map = useMap();

  useEffect(() => {
    map.fitBounds(initialBounds, { paddingTopLeft: [28, 20], paddingBottomRight: [0, 0] });
    map.whenReady(() => {
      const initialZoom = map.getZoom();
      map.setMinZoom(initialZoom - 1);
    });
  }, [map, initialBounds]);

  return null;
};

const MapViewportResetter = ({ initialBounds, resetToken }) => {
  const map = useMap();

  useEffect(() => {
    if (!resetToken) return;

    map.fitBounds(initialBounds, { paddingTopLeft: [28, 20], paddingBottomRight: [0, 0] });
  }, [map, initialBounds, resetToken]);

  return null;
};

const MapTrackpadGestureHandler = () => {
  const map = useMap();

  useEffect(() => {
    const container = map.getContainer();
    let rafId = null;
    let pendingPanX = 0;
    let pendingPanY = 0;
    let gestureStartZoom = map.getZoom();
    let gestureAnchor = null;
    let isNativeGestureActive = false;

    const flushPan = () => {
      if (pendingPanX !== 0 || pendingPanY !== 0) {
        map.panBy([pendingPanX, pendingPanY], { animate: false, noMoveStart: true });
        pendingPanX = 0;
        pendingPanY = 0;
      }
      rafId = null;
    };

    const queuePan = (deltaX, deltaY) => {
      pendingPanX += deltaX;
      pendingPanY += deltaY;

      if (!rafId) {
        rafId = window.requestAnimationFrame(flushPan);
      }
    };

    const getGestureAnchor = (event) => {
      if (typeof event.clientX === 'number' && typeof event.clientY === 'number') {
        const bounds = container.getBoundingClientRect();
        return map.containerPointToLatLng([
          event.clientX - bounds.left,
          event.clientY - bounds.top,
        ]);
      }

      return map.containerPointToLatLng([
        container.clientWidth / 2,
        container.clientHeight / 2,
      ]);
    };

    const applyZoom = (delta, anchor) => {
      const nextZoom = map.getZoom() + delta;
      const boundedZoom = Math.max(map.getMinZoom(), Math.min(nextZoom, map.getMaxZoom()));
      map.setZoomAround(anchor, boundedZoom, { animate: false });
    };

    const handleWheel = (event) => {
      event.preventDefault();
      event.stopPropagation();

      if (isNativeGestureActive) {
        return;
      }

      if (event.ctrlKey) {
        const zoomDelta = -event.deltaY / 240;
        if (zoomDelta === 0) return;

        applyZoom(zoomDelta, getGestureAnchor(event));
        return;
      }

      const panFactor = event.deltaMode === 1 ? 18 : 1.35;
      const nextPanX = -event.deltaX * panFactor;
      const nextPanY = -event.deltaY * panFactor;

      if (nextPanX === 0 && nextPanY === 0) {
        return;
      }

      queuePan(nextPanX, nextPanY);
    };

    const handleGestureStart = (event) => {
      event.preventDefault();
      event.stopPropagation();
      isNativeGestureActive = true;
      gestureStartZoom = map.getZoom();
      gestureAnchor = getGestureAnchor(event);
    };

    const handleGestureChange = (event) => {
      event.preventDefault();
      event.stopPropagation();
      if (!isNativeGestureActive) return;

      const targetZoom = gestureStartZoom + Math.log2(event.scale || 1);
      const boundedZoom = Math.max(map.getMinZoom(), Math.min(targetZoom, map.getMaxZoom()));
      map.setZoomAround(gestureAnchor || getGestureAnchor(event), boundedZoom, { animate: false });
    };

    const handleGestureEnd = (event) => {
      event.preventDefault();
      event.stopPropagation();
      isNativeGestureActive = false;
      gestureAnchor = null;
    };

    container.style.touchAction = 'none';
    container.style.overscrollBehavior = 'contain';

    container.addEventListener('wheel', handleWheel, { passive: false });
    container.addEventListener('gesturestart', handleGestureStart, { passive: false });
    container.addEventListener('gesturechange', handleGestureChange, { passive: false });
    container.addEventListener('gestureend', handleGestureEnd, { passive: false });

    return () => {
      container.removeEventListener('wheel', handleWheel);
      container.removeEventListener('gesturestart', handleGestureStart);
      container.removeEventListener('gesturechange', handleGestureChange);
      container.removeEventListener('gestureend', handleGestureEnd);
      container.style.touchAction = '';
      container.style.overscrollBehavior = '';
      if (rafId) {
        window.cancelAnimationFrame(rafId);
      }
    };
  }, [map]);

  return null;
};

export {
  MapZoomControls,
  MapZoomLimiter,
  MapViewportResetter,
  MapTrackpadGestureHandler,
};
