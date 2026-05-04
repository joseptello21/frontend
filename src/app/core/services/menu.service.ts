// src/app/core/services/menu.service.ts

import { Injectable } from '@angular/core';
import { Recurso } from '../models/recurso.model';
import { StorageService } from './storage.service';

export interface MenuItem {
  id: number;
  nombre: string;
  path: string;
  icono?: string;
  orden: number;
  padre: number | null;
  estado: string;
  items: MenuItem[];
}

@Injectable({
  providedIn: 'root'
})
export class MenuService {

  constructor(private storageService: StorageService) {}

  getMenu(): MenuItem[] {
    // For demo purposes, return static menu items
    // In production, this should come from the backend
    const menu = [
      {
        id: 1,
        nombre: 'Dashboard',
        path: '/dashboard',
        icono: 'fa-solid fa-chart-line',
        orden: 1,
        padre: null,
        estado: 'activo',
        items: []
      },
      {
        id: 2,
        nombre: 'Dispositivos',
        path: '/dispositivos',
        icono: 'fa-solid fa-microchip',
        orden: 2,
        padre: null,
        estado: 'activo',
        items: []
      },
      {
        id: 3,
        nombre: 'Luminarias',
        path: '/luminarias',
        icono: 'fa-solid fa-lightbulb',
        orden: 3,
        padre: null,
        estado: 'activo',
        items: []
      },
      {
        id: 4,
        nombre: 'Sensores',
        path: '/sensores',
        icono: 'fa-solid fa-gauge',
        orden: 4,
        padre: null,
        estado: 'activo',
        items: []
      },
      {
        id: 5,
        nombre: 'Baterías',
        path: '/baterias',
        icono: 'fa-solid fa-battery-half',
        orden: 5,
        padre: null,
        estado: 'activo',
        items: []
      },
      {
        id: 6,
        nombre: 'Administración',
        path: '#',
        icono: 'fa-solid fa-cogs',
        orden: 6,
        padre: null,
        estado: 'activo',
        items: [
          {
            id: 7,
            nombre: 'Usuarios',
            path: '/usuarios',
            icono: 'fa-solid fa-users',
            orden: 1,
            padre: 6,
            estado: 'activo',
            items: []
          },
          {
            id: 8,
            nombre: 'Roles',
            path: '/roles',
            icono: 'fa-solid fa-shield-alt',
            orden: 2,
            padre: 6,
            estado: 'activo',
            items: []
          }
        ]
      }
    ];

    console.log('Menu loaded:', menu);
    return menu;
  }

  private construirArbol(recursos: Recurso[]): MenuItem[] {
    const mapa = new Map<number, MenuItem>();
    const raiz: MenuItem[] = [];

    recursos.forEach(recurso => {
      mapa.set(recurso.idRecursos, {
        id: recurso.idRecursos,
        nombre: recurso.nombre,
        path: this.normalizarRutaFrontend(recurso.url_frontend || recurso.path || '#'),
        icono: recurso.icono || 'fa-solid fa-circle',
        orden: recurso.orden,
        padre: recurso.recurso_padre || null,
        estado: recurso.estado,
        items: []
      });
    });

    mapa.forEach(item => {
      if (item.padre) {
        const padre = mapa.get(item.padre);

        if (padre) {
          padre.items.push(item);
        }
      } else {
        raiz.push(item);
      }
    });

    raiz.sort((a, b) => a.orden - b.orden);

    raiz.forEach(item => {
      item.items.sort((a, b) => a.orden - b.orden);
    });

    return raiz;
  }

  hasAccess(path: string): boolean {
    const rutaNormalizada = this.normalizarRutaFrontend(path);

    const recursos = this.storageService
      .getRecursos()
      .filter(recurso => this.estaActivo(recurso.estado));

    return recursos.some(recurso => {
      const rutaFrontend = this.normalizarRutaFrontend(
        recurso.url_frontend || recurso.path || ''
      );

      return rutaFrontend === rutaNormalizada;
    });
  }

  private estaActivo(estado: string): boolean {
    return estado?.toLowerCase() === 'activo' || estado === '1';
  }

  private normalizarRutaFrontend(ruta: string): string {
    if (!ruta || ruta === '#') {
      return '#';
    }

    let rutaNormalizada = ruta.trim();

    if (!rutaNormalizada.startsWith('/')) {
      rutaNormalizada = `/${rutaNormalizada}`;
    }

    if (rutaNormalizada.length > 1 && rutaNormalizada.endsWith('/')) {
      rutaNormalizada = rutaNormalizada.slice(0, -1);
    }

    return rutaNormalizada;
  }
}