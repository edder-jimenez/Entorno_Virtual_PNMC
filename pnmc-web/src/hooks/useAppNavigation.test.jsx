import { fireEvent, render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { useAppNavigation } from './useAppNavigation.js';

const Probe = () => {
  const { activePage, pathname, setActivePage } = useAppNavigation();

  return (
    <div>
      <span data-testid="active">{activePage}</span>
      <span data-testid="path">{pathname}</span>
      <button type="button" onClick={() => setActivePage('pnmc')}>go-pnmc</button>
      <button type="button" onClick={() => setActivePage('agenda')}>go-agenda</button>
    </div>
  );
};

describe('useAppNavigation', () => {
  it('deriva activePage desde pathname inicial', () => {
    render(
      <MemoryRouter initialEntries={['/agenda']}>
        <Probe />
      </MemoryRouter>,
    );

    expect(screen.getByTestId('active')).toHaveTextContent('agenda');
    expect(screen.getByTestId('path')).toHaveTextContent('/agenda');
  });

  it('actualiza pathname y activePage al navegar', () => {
    render(
      <MemoryRouter initialEntries={['/']}>
        <Probe />
      </MemoryRouter>,
    );

    fireEvent.click(screen.getByText('go-pnmc'));
    expect(screen.getByTestId('active')).toHaveTextContent('pnmc');
    expect(screen.getByTestId('path')).toHaveTextContent('/pnmc');

    fireEvent.click(screen.getByText('go-agenda'));
    expect(screen.getByTestId('active')).toHaveTextContent('agenda');
    expect(screen.getByTestId('path')).toHaveTextContent('/agenda');
  });
});
