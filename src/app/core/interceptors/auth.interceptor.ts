// src/app/core/interceptors/auth.interceptor.ts

import { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { StorageService } from '../services/storage.service';

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const storageService = inject(StorageService);
  const token = storageService.getToken();

  // URLs públicas que no necesitan token
  const publicUrls = ['/auth/login', '/auth/register', '/login/', '/register/'];
  const isPublicUrl = publicUrls.some(url => req.url.includes(url));

  // Si es una URL pública o no hay token, pasar la solicitud sin modificar
  if (isPublicUrl || !token) {
    return next(req);
  }

  const requestConToken = req.clone({
    setHeaders: {
      Authorization: `Bearer ${token}`
    }
  });

  return next(requestConToken);
};