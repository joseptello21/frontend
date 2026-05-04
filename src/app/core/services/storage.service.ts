// src/app/core/services/storage.service.ts

import { Injectable } from '@angular/core';
import { Usuario } from '../models/usuario.model';
import { Rol } from '../models/rol.model';
import { Recurso } from '../models/recurso.model';

@Injectable({
  providedIn: 'root'
})
export class StorageService {

  private readonly TOKEN_KEY = 'access_token';
  private readonly REFRESH_KEY = 'refresh_token';
  private readonly USER_KEY = 'usuario';
  private readonly ROLES_KEY = 'roles';
  private readonly RECURSOS_KEY = 'recursos';

  setToken(token: string): void {
    localStorage.setItem(this.TOKEN_KEY, token);
  }

  getToken(): string | null {
    return localStorage.getItem(this.TOKEN_KEY);
  }

  setRefreshToken(token: string): void {
    localStorage.setItem(this.REFRESH_KEY, token);
  }

  getRefreshToken(): string | null {
    return localStorage.getItem(this.REFRESH_KEY);
  }

  setUsuario(usuario: Usuario): void {
    localStorage.setItem(this.USER_KEY, JSON.stringify(usuario));
  }

  getUsuario(): Usuario | null {
    const data = localStorage.getItem(this.USER_KEY);
    return data ? JSON.parse(data) : null;
  }

  setRoles(roles: Rol[]): void {
    localStorage.setItem(this.ROLES_KEY, JSON.stringify(roles));
  }

  getRoles(): Rol[] {
    const data = localStorage.getItem(this.ROLES_KEY);
    return data ? JSON.parse(data) : [];
  }

  setRecursos(recursos: Recurso[]): void {
    localStorage.setItem(this.RECURSOS_KEY, JSON.stringify(recursos));
  }

  getRecursos(): Recurso[] {
    const data = localStorage.getItem(this.RECURSOS_KEY);
    return data ? JSON.parse(data) : [];
  }

  clear(): void {
    localStorage.clear();
  }

  isAuthenticated(): boolean {
    return !!this.getToken();
  }
}