import { fireEvent, render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { afterEach, beforeEach, vi } from 'vitest';
import App from './App.jsx';

beforeEach(() => {
  vi.stubGlobal('fetch', vi.fn(async (url) => {
    const text = String(url || '');

    if (text.includes('/api/v1/map/geojson/departments')) {
      return {
        ok: true,
        status: 200,
        json: async () => ({ type: 'FeatureCollection', features: [] }),
      };
    }

    if (text.includes('/api/v1/divipola/grouped')) {
      return { ok: true, status: 200, json: async () => ({}) };
    }

    if (text.includes('/api/v1/editorial/resources')) {
      return { ok: true, status: 200, json: async () => ({ items: [], total: 0, limit: 500, offset: 0 }) };
    }

    if (text.includes('/api/v1/gallery/albums')) {
      return { ok: true, status: 200, json: async () => ({ items: [] }) };
    }

    if (
      text.includes('/api/v1/agenda/events')
      || text.includes('/api/v1/news/articles')
      || text.includes('/api/v1/festivals')
      || text.includes('/api/v1/music-schools')
      || text.includes('/api/v1/music-markets')
    ) {
      return { ok: true, status: 200, json: async () => ({ items: [], total: 0, limit: 100, offset: 0 }) };
    }

    if (text.includes('/api/map-participation')) {
      return { ok: true, status: 200, json: async () => ({ message: 'ok', fileName: 'file.xlsx', reference: 'ref-1', status: 'accepted' }) };
    }

    return { ok: false, status: 404, json: async () => ({}) };
  }));
});

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('App routing', () => {
  it('cambia la vista al navegar desde la barra principal', async () => {
    render(
      <MemoryRouter initialEntries={['/agenda']}>
        <App />
      </MemoryRouter>,
    );

    expect(await screen.findByText((content) => content.includes('Eventos PNMC'))).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'Sobre el PNMC' }));
    expect(await screen.findByText((content) => content.includes('Objetivos de Eje'))).toBeInTheDocument();
  });

  it('en componente no muestra PNMC 2026 en el hero', async () => {
    render(
      <MemoryRouter initialEntries={['/ejes/componentes/c2-3']}>
        <App />
      </MemoryRouter>,
    );

    const heading = await screen.findByRole('heading', { name: /Circulación/i });
    expect(heading.className).not.toContain('line-clamp-2');
    expect(screen.queryByText(/PNMC 2026/i)).not.toBeInTheDocument();
  });
});
