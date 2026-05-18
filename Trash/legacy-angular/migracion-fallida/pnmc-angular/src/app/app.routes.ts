import { Routes } from '@angular/router';
import { adminAuthGuard } from './core/auth/admin-auth.guard';

export const routes: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('./features/home/home-page.component').then((m) => m.HomePageComponent),
  },
  {
    path: 'pnmc',
    loadComponent: () =>
      import('./features/content/pnmc-page.component').then((m) => m.PnmcPageComponent),
  },
  {
    path: 'ejes',
    loadComponent: () =>
      import('./features/content/ejes-page.component').then((m) => m.EjesPageComponent),
  },
  {
    path: 'ejes/componentes/:componentId',
    loadComponent: () =>
      import('./features/content/component-detail-page.component').then((m) => m.ComponentDetailPageComponent),
  },
  {
    path: 'estrategia/circulacion',
    data: { section: 'circulacion' },
    loadComponent: () =>
      import('./features/content/strategy-page.component').then((m) => m.StrategyPageComponent),
  },
  {
    path: 'estrategia/investigacion',
    data: { section: 'investigacion' },
    loadComponent: () =>
      import('./features/content/strategy-page.component').then((m) => m.StrategyPageComponent),
  },
  {
    path: 'noticias',
    loadComponent: () =>
      import('./features/news/news-page.component').then((m) => m.NewsPageComponent),
  },
  {
    path: 'agenda',
    loadComponent: () =>
      import('./features/agenda/agenda-page.component').then((m) => m.AgendaPageComponent),
  },
  {
    path: 'editorial',
    loadComponent: () =>
      import('./features/editorial/editorial-page.component').then((m) => m.EditorialPageComponent),
  },
  {
    path: 'mapa',
    loadComponent: () =>
      import('./features/map/map-page.component').then((m) => m.MapPageComponent),
  },
  {
    path: 'participacion',
    loadComponent: () =>
      import('./features/participation/participation-page.component').then((m) => m.ParticipationPageComponent),
  },
  {
    path: 'mapa/participa',
    loadComponent: () =>
      import('./features/participation/participation-page.component').then((m) => m.ParticipationPageComponent),
  },
  {
    path: 'modulos',
    loadComponent: () =>
      import('./features/catalogs/catalogs-page.component').then((m) => m.CatalogsPageComponent),
  },
  {
    path: 'galeria',
    loadComponent: () =>
      import('./features/gallery/gallery-page.component').then((m) => m.GalleryPageComponent),
  },
  {
    path: 'admin/login',
    loadComponent: () =>
      import('./features/admin/admin-login-page.component').then((m) => m.AdminLoginPageComponent),
  },
  {
    path: 'admin',
    canActivate: [adminAuthGuard],
    loadComponent: () =>
      import('./features/admin/admin-dashboard-page.component').then((m) => m.AdminDashboardPageComponent),
  },
  {
    path: 'home',
    redirectTo: '',
  },
  {
    path: '**',
    loadComponent: () =>
      import('./features/home/not-found-page.component').then((m) => m.NotFoundPageComponent),
  },
];
