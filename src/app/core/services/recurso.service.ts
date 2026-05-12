import { Injectable } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Observable, map, throwError, catchError } from 'rxjs';

import { environment } from '../../../environments/environment';
import { Recurso, BackendRecurso, PaginatedRecursoResponse, LegacyPaginatedRecursoResponse } from '../models/recurso.model';
import { AuthHeadersService } from './auth-headers.service';

@Injectable({
  providedIn: 'root'
})
export class RecursoService {

  private apiUrl = `${environment.apiUrl}/api/recursos/`;

  constructor(
    private http: HttpClient,
    private authHeaders: AuthHeadersService
  ) {}

  listar(): Observable<Recurso[]> {
    return this.http.get<PaginatedRecursoResponse | LegacyPaginatedRecursoResponse | Recurso[]>(
      this.apiUrl,
      { headers: this.authHeaders.getAuthHeaders() }
    ).pipe(
      map(response => {
        // Handle backend response format: { value: [...], Count: N }
        if ('value' in response && Array.isArray(response.value)) {
          return response.value.map((backendRecurso: BackendRecurso) => ({
            idRecursos: backendRecurso.id_recurso,
            nombre: backendRecurso.nombre_recurso,
            url_backend: `/api/recursos/${backendRecurso.id_recurso}/`,
            url_frontend: '',
            path: `/api/recursos/${backendRecurso.id_recurso}/`,
            icono: 'fa-solid fa-list',
            orden: backendRecurso.id_recurso,
            estado: backendRecurso.estado || 'ACTIVO'
          } as Recurso));
        }
        // Handle legacy format: { results: [...] }
        if ('results' in response && Array.isArray(response.results)) {
          return response.results;
        }
        // Handle direct array response
        if (Array.isArray(response)) {
          return response;
        }
        return [];
      }),
      catchError(this.handleError)
    );
  }

  crear(recurso: Partial<Recurso>): Observable<Recurso> {
    // Convert frontend model to backend format
    const backendRecurso = {
      nombre_recurso: recurso.nombre,
      descripcion: '',
      estado: recurso.estado || 'ACTIVO'
    };

    return this.http.post<BackendRecurso | Recurso>(
      this.apiUrl,
      backendRecurso,
      { headers: this.authHeaders.getAuthHeaders() }
    ).pipe(
      map(response => {
        // If backend returns BackendRecurso format
        if ('id_recurso' in response) {
          return {
            idRecursos: (response as BackendRecurso).id_recurso,
            nombre: (response as BackendRecurso).nombre_recurso,
            url_backend: `/api/recursos/${(response as BackendRecurso).id_recurso}/`,
            url_frontend: '',
            path: `/api/recursos/${(response as BackendRecurso).id_recurso}/`,
            icono: recurso.icono || 'fa-solid fa-list',
            orden: (response as BackendRecurso).id_recurso,
            estado: (response as BackendRecurso).estado || 'ACTIVO'
          } as Recurso;
        }
        // If backend returns Recurso format directly
        return response as Recurso;
      }),
      catchError(this.handleError)
    );
  }

  actualizar(id: number, recurso: Partial<Recurso>): Observable<Recurso> {
    const backendRecurso = {
      nombre_recurso: recurso.nombre,
      descripcion: '',
      estado: recurso.estado || 'ACTIVO'
    };

    return this.http.put<BackendRecurso | Recurso>(
      `${this.apiUrl}${id}/`,
      backendRecurso,
      { headers: this.authHeaders.getAuthHeaders() }
    ).pipe(
      map(response => {
        if ('id_recurso' in response) {
          return {
            idRecursos: (response as BackendRecurso).id_recurso,
            nombre: (response as BackendRecurso).nombre_recurso,
            url_backend: `/api/recursos/${(response as BackendRecurso).id_recurso}/`,
            url_frontend: '',
            path: `/api/recursos/${(response as BackendRecurso).id_recurso}/`,
            icono: recurso.icono || 'fa-solid fa-list',
            orden: (response as BackendRecurso).id_recurso,
            estado: (response as BackendRecurso).estado || 'ACTIVO'
          } as Recurso;
        }
        return response as Recurso;
      }),
      catchError(this.handleError)
    );
  }

  eliminar(id: number): Observable<void> {
    return this.http.delete<void>(
      `${this.apiUrl}${id}/`,
      { headers: this.authHeaders.getAuthHeaders() }
    ).pipe(
      catchError(this.handleError)
    );
  }

  private handleError(error: HttpErrorResponse) {
    console.error('Error en RecursoService:', error);
    return throwError(() => error);
  }
}