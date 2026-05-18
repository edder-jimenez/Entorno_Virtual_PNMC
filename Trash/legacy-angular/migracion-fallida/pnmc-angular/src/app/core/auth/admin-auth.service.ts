import { Injectable } from '@angular/core';

const ADMIN_API_KEY_STORAGE_KEY = 'pnmc_admin_api_key';

@Injectable({ providedIn: 'root' })
export class AdminAuthService {
  get apiKey(): string {
    if (typeof window === 'undefined') return '';
    return window.sessionStorage.getItem(ADMIN_API_KEY_STORAGE_KEY) ?? '';
  }

  get isAuthenticated(): boolean {
    return this.apiKey.trim().length > 0;
  }

  setApiKey(apiKey: string): void {
    if (typeof window === 'undefined') return;
    const normalized = apiKey.trim();
    if (!normalized) {
      window.sessionStorage.removeItem(ADMIN_API_KEY_STORAGE_KEY);
      return;
    }
    window.sessionStorage.setItem(ADMIN_API_KEY_STORAGE_KEY, normalized);
  }

  clear(): void {
    if (typeof window === 'undefined') return;
    window.sessionStorage.removeItem(ADMIN_API_KEY_STORAGE_KEY);
  }
}
