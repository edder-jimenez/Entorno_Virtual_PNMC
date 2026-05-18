import { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { AdminAuthService } from '../auth/admin-auth.service';

export const adminApiKeyInterceptor: HttpInterceptorFn = (req, next) => {
  if (!req.url.includes('/api/v1/admin/')) {
    return next(req);
  }

  const auth = inject(AdminAuthService);
  const apiKey = auth.apiKey;
  if (!apiKey) {
    return next(req);
  }

  return next(
    req.clone({
      setHeaders: {
        'X-Admin-Api-Key': apiKey,
      },
    }),
  );
};
