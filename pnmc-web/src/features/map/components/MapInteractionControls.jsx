import { useEffect } from 'react';
import { Compass, ZoomIn, ZoomOut } from 'lucide-react';
import { useMap } from 'react-leaflet';

const MapZoomControls = ({ initialBounds }) => {
  const map = useMap();
  const handleResetView = () => {
    map.fitBounds(initialBounds, {
      paddingTopLeft: [28, 20],
      paddingBottomRight: [0, 0],
      animate: true,
      duration: 0.45,
    });
  };

  return (
    <div className="absolute bottom-6 right-6 z-[1001] flex items-center gap-2">
      <button
        type="button"
        onClick={handleResetView}
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
    map.fitBounds(initialBounds, { paddingTopLeft: [28, 20], paddingBottomRight: [0, 0], animate: false });
    map.whenReady(() => {
      const initialZoom = map.getZoom();
      map.setMinZoom(initialZoom - 1.5);
      map.setMaxZoom(Math.max(initialZoom + 4.8, map.getMaxZoom()));
    });
  }, [map, initialBounds]);

  return null;
};

const MapViewportResetter = ({ initialBounds, resetToken }) => {
  const map = useMap();

  useEffect(() => {
    if (!resetToken) return;

    map.fitBounds(initialBounds, {
      paddingTopLeft: [28, 20],
      paddingBottomRight: [0, 0],
      animate: true,
      duration: 0.45,
    });
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
    let pendingZoomDelta = 0;
    let gestureStartZoom = map.getZoom();
    let gestureAnchor = null;
    let isNativeGestureActive = false;
    let lastWheelTs = 0;

    const flushWheel = () => {
      if (pendingZoomDelta !== 0) {
        const anchor = gestureAnchor || map.containerPointToLatLng([
          container.clientWidth / 2,
          container.clientHeight / 2,
        ]);
        const nextZoom = map.getZoom() + pendingZoomDelta;
        const boundedZoom = Math.max(map.getMinZoom(), Math.min(nextZoom, map.getMaxZoom()));
        map.setZoomAround(anchor, boundedZoom, { animate: false });
        pendingZoomDelta = 0;
        gestureAnchor = null;
      }

      if (pendingPanX !== 0 || pendingPanY !== 0) {
        map.panBy([pendingPanX, pendingPanY], { animate: false, noMoveStart: true });
        pendingPanX = 0;
        pendingPanY = 0;
      }
      rafId = null;
    };

    const queuePan = (deltaX, deltaY, eventTs) => {
      pendingPanX += deltaX;
      pendingPanY += deltaY;
      lastWheelTs = eventTs;

      if (!rafId) {
        rafId = window.requestAnimationFrame(flushWheel);
      }
    };

    const queueZoom = (deltaZoom, anchor, eventTs) => {
      pendingZoomDelta += deltaZoom;
      gestureAnchor = anchor;
      lastWheelTs = eventTs;

      if (!rafId) {
        rafId = window.requestAnimationFrame(flushWheel);
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

    const handleWheel = (event) => {
      event.preventDefault();
      event.stopPropagation();

      if (isNativeGestureActive) {
        return;
      }

      const now = performance.now();
      if (event.ctrlKey) {
        const zoomDelta = -event.deltaY / 320;
        if (zoomDelta === 0) return;
        queueZoom(zoomDelta, getGestureAnchor(event), now);
        return;
      }

      const absDeltaX = Math.abs(event.deltaX);
      const absDeltaY = Math.abs(event.deltaY);
      const isMouseWheel = event.deltaMode === 1 || (absDeltaY > 20 && absDeltaX < absDeltaY * 0.45);
      const isTrackpadLike = event.deltaMode === 0 && !isMouseWheel;

      if (isMouseWheel) {
        const zoomStep = event.deltaMode === 1 ? 0.24 : 0.11;
        const direction = event.deltaY > 0 ? -1 : 1;
        queueZoom(direction * zoomStep, getGestureAnchor(event), now);
        return;
      }

      if (isTrackpadLike) {
        const panFactor = event.shiftKey ? 1.5 : 1.25;
        const nextPanX = -event.deltaX * panFactor;
        const nextPanY = -event.deltaY * panFactor;
        if (nextPanX === 0 && nextPanY === 0) return;
        queuePan(nextPanX, nextPanY, now);
        return;
      }

      if (now - lastWheelTs < 12) {
        return;
      }
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

    container.style.touchAction = 'pan-x pan-y pinch-zoom';
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
