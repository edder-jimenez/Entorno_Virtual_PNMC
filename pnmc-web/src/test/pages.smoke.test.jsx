import { describe, it, expect } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { AgendaPage } from '../features/agenda/pages/AgendaPage.jsx';
import { NoticiasPage } from '../features/news/pages/NoticiasPage.jsx';
import { EditorialPage } from '../features/editorial/pages/EditorialPage.jsx';

describe('Segmented pages smoke', () => {
  it('renders Agenda page shell', () => {
    render(<AgendaPage onBack={() => {}} />);
    expect(screen.getByText(/Agenda y/i)).toBeInTheDocument();
  });

  it('renders Noticias page shell', () => {
    render(<NoticiasPage onBack={() => {}} />);
    expect(screen.getByText(/Portal Editorial y/i)).toBeInTheDocument();
  });

  it('renders Editorial page shell', async () => {
    render(<EditorialPage onBack={() => {}} />);
    expect(screen.getByRole('heading', { name: /^Editorial$/i })).toBeInTheDocument();
    await waitFor(() => {
      expect(screen.queryByText(/Cargando el catálogo editorial/i)).not.toBeInTheDocument();
    });
  });
});
