import { CommonModule } from '@angular/common';
import { Component, HostListener, inject } from '@angular/core';
import { NavigationEnd, Router } from '@angular/router';
import { RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { filter } from 'rxjs';
import { EJES_DATA } from './features/content/content-data';

@Component({
  selector: 'app-root',
  imports: [CommonModule, RouterOutlet, RouterLink, RouterLinkActive],
  templateUrl: './app.html',
  styleUrl: './app.css',
})
export class App {
  private readonly router = inject(Router);
  protected readonly title = 'PNMC';
  protected readonly currentYear = new Date().getFullYear();
  mobileMenuOpen = false;
  scrolled = false;
  ejesMenuOpen = false;
  activeEjeMenuId = EJES_DATA[0]?.id ?? '';
  readonly ejeGroups = EJES_DATA.map((eje, index) => ({
    id: eje.id,
    name: index === 0 ? 'Música para la vida' : index === 1 ? 'Oficios y prácticas' : 'Gobernanza',
    sectionId: index === 0 ? 'musica-para-la-vida' : index === 1 ? 'oficios-y-practicas' : 'gobernanza',
    components: eje.components,
  }));

  constructor() {
    this.router.events
      .pipe(filter((event): event is NavigationEnd => event instanceof NavigationEnd))
      .subscribe(() => {
        this.mobileMenuOpen = false;
        this.ejesMenuOpen = false;
        window.scrollTo({ top: 0, behavior: 'auto' });
      });
  }

  @HostListener('window:scroll')
  onWindowScroll(): void {
    this.scrolled = window.scrollY > 20;
  }

  toggleMobileMenu(): void {
    this.mobileMenuOpen = !this.mobileMenuOpen;
  }

  openEjesMenu(): void {
    this.ejesMenuOpen = true;
  }

  closeEjesMenu(): void {
    this.ejesMenuOpen = false;
  }

  setActiveEjeGroup(id: string): void {
    this.activeEjeMenuId = id;
  }

  get activeEjeGroup() {
    return this.ejeGroups.find((group) => group.id === this.activeEjeMenuId) ?? this.ejeGroups[0];
  }
}
