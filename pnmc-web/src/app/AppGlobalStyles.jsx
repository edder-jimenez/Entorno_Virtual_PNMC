import React from 'react';

const APP_GLOBAL_STYLES = `
        @import url('https://fonts.googleapis.com/css2?family=Nunito+Sans:wght@300;400;600;700&family=Oswald:wght@400;600;700&display=swap'); 
        :root {
          --ease-soft: cubic-bezier(0.22, 1, 0.36, 1);
          --type-step-1: 0.75rem;
          --type-step-1-line: 1rem;
          --type-step-2: 0.875rem;
          --type-step-2-line: 1.25rem;
          --type-step-3: 1rem;
          --type-step-3-line: 1.5rem;
          --type-step-4: 1.125rem;
          --type-step-4-line: 1.6rem;
          --type-step-5: 1.25rem;
          --type-step-5-line: 1.75rem;
        }
        .font-gregor { font-family: 'Impact', 'Oswald', sans-serif; } 
        .font-alternate { font-family: 'Oswald', sans-serif; letter-spacing: 0.04em !important; } 
        .font-nunito { font-family: 'Nunito Sans', sans-serif; } 
        html { scroll-behavior: smooth; } 
        body {
          text-rendering: optimizeLegibility;
          -webkit-font-smoothing: antialiased;
          -moz-osx-font-smoothing: grayscale;
        }
        button, a, input, select, textarea {
          transition-timing-function: var(--ease-soft);
        }
        .transition-all,
        .transition-colors,
        .transition-transform,
        .transition-shadow {
          transition-timing-function: var(--ease-soft) !important;
        }
        ::selection { background-color: #00DA5E; color: #291242; } 
        ::-webkit-scrollbar { width: 4px; height: 4px; } 
        ::-webkit-scrollbar-track { background: #fff; } 
        ::-webkit-scrollbar-thumb { background: #cbd5e1; border-radius: 4px; } 
        ::-webkit-scrollbar-thumb:hover { background: #00DA5E; } 
        .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
        .no-scrollbar::-webkit-scrollbar { display: none; }
        .custom-scrollbar::-webkit-scrollbar { width: 6px; height: 6px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: rgba(0,0,0,0.02); border-radius: 10px; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: #291242; border-radius: 10px; border: 2px solid transparent; background-clip: padding-box; }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: #00DA5E; }
        .thin-horizontal-scrollbar::-webkit-scrollbar { height: 3px; }
        .thin-horizontal-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .thin-horizontal-scrollbar::-webkit-scrollbar-thumb { background: rgba(41, 18, 66, 0.15); border-radius: 99px; }
        .thin-horizontal-scrollbar::-webkit-scrollbar-thumb:hover { background: #00DA5E; }
        .leaflet-container { border-radius: 2.8rem; font-family: inherit; }
        .leaflet-container.map-canvas {
          border-radius: 1.35rem;
          box-shadow: inset 0 0 0 1px rgba(148, 163, 184, 0.22);
        }
        .leaflet-container.map-edge-canvas {
          border-radius: 0;
          box-shadow: none;
        }
        .leaflet-pane,
        .leaflet-control-container,
        .leaflet-bottom,
        .leaflet-top { z-index: 400 !important; }
        .leaflet-interactive {
          pointer-events: all !important;
        }
        .map-basemap-washed {
          filter: grayscale(100%) contrast(75%) brightness(105%);
        }
        .department-label {
          background: transparent;
          border: none;
          box-shadow: none;
          color: #291242;
          font-family: 'Oswald', sans-serif;
          font-size: 9px;
          font-weight: 800;
          letter-spacing: 0.12em;
          text-transform: uppercase;
          text-shadow: 
            -1.5px -1.5px 0 rgba(255,255,255,0.95),  
             1.5px -1.5px 0 rgba(255,255,255,0.95),
            -1.5px  1.5px 0 rgba(255,255,255,0.95),
             1.5px  1.5px 0 rgba(255,255,255,0.95),
             0      0     4px rgba(255,255,255,1);
          pointer-events: none !important;
        }
        .map-canvas .department-label {
          font-size: 8px;
          letter-spacing: 0.1em;
          color: rgba(41, 18, 66, 0.88);
        }
        .department-label:before { display: none; }
        .leaflet-tooltip.archipelago-label {
          background: rgba(255, 255, 255, 0.96);
          border: 1px solid rgba(41, 18, 66, 0.12);
          border-radius: 999px;
          box-shadow: 0 10px 24px rgba(15, 23, 42, 0.12);
          color: #291242;
          font-family: 'Oswald', sans-serif;
          font-size: 10px;
          font-weight: 700;
          letter-spacing: 0.08em;
          text-transform: uppercase;
          padding: 0.35rem 0.7rem;
          line-height: 1.2;
          text-align: left;
          white-space: normal;
          max-width: none;
          pointer-events: none !important;
        }
        .leaflet-tooltip.archipelago-label:before {
          display: none;
        }
        .leaflet-tooltip.archipelago-label .archipelago-label-line {
          display: block;
          white-space: nowrap;
          pointer-events: none !important;
        }
        .country-label-marker {
          background: transparent;
          border: none;
          pointer-events: none !important;
        }
        .country-label-marker span {
          color: rgba(15, 23, 42, 0.68);
          font-family: 'Oswald', sans-serif;
          font-size: 10px;
          font-weight: 700;
          letter-spacing: 0.08em;
          text-transform: uppercase;
          white-space: nowrap;
          text-shadow: none;
          pointer-events: none !important;
        }
        .leaflet-popup-content-wrapper {
          border-radius: 1.2rem;
          box-shadow: 0 18px 36px rgba(15, 23, 42, 0.18);
        }
        .leaflet-popup-content {
          margin: 0;
        }
        .leaflet-popup,
        .leaflet-popup-content-wrapper,
        .leaflet-popup-content,
        .leaflet-popup-tip-container {
          pointer-events: none !important;
        }
        .leaflet-popup-close-button {
          display: none !important;
        }
        .leaflet-popup-tip {
          background: white;
        }
        .custom-municipality-tooltip {
          background: rgba(255, 255, 255, 0.98) !important;
          border: 1px solid rgba(41, 18, 66, 0.16) !important;
          border-radius: 12px !important;
          box-shadow: 0 8px 20px rgba(15, 23, 42, 0.1) !important;
          color: #291242 !important;
          font-family: 'Oswald', sans-serif !important;
          padding: 8px 12px !important;
          pointer-events: none !important;
        }
        .custom-municipality-tooltip:before {
          display: none !important;
        }
        .custom-municipality-tooltip .tooltip-title {
          font-weight: 800 !important;
          font-size: 11px !important;
          text-transform: uppercase !important;
          letter-spacing: 0.05em !important;
          margin: 0 !important;
          color: #291242 !important;
        }
        .custom-municipality-tooltip .tooltip-value {
          font-size: 9px !important;
          color: #16a34a !important;
          margin-top: 2px !important;
          margin-bottom: 0 !important;
          font-weight: 700 !important;
          text-transform: uppercase !important;
          letter-spacing: 0.04em !important;
        }
`;

const AppGlobalStyles = () => <style>{APP_GLOBAL_STYLES}</style>;

export { AppGlobalStyles };
