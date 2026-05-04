// src/app/core/guards/auth.guard.ts

import { inject } from '@angular/core';
import { CanActivateFn, Router, ActivatedRouteSnapshot } from '@angular/router';

import { AuthService } from '../services/auth.service';
import { MenuService } from '../services/menu.service';

export const authGuard: CanActivateFn = (
  route: ActivatedRouteSnapshot
) => {
  const authService = inject(AuthService);
  const menuService = inject(MenuService);
  const router = inject(Router);

  if (!authService.isAuthenticated()) {
    router.navigate(['/login']);
    return false;
  }

  const path = route.routeConfig?.path;

  if (!path || path === 'dashboard') {
    return true;
  }

  const fullPath = `/${path}`;

  if (!menuService.hasAccess(fullPath)) {
    router.navigate(['/dashboard']);
    return false;
  }

  return true;
};