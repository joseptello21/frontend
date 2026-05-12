import { Injectable } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Observable, map, throwError, catchError } from 'rxjs';

import { environment } from '../../../environments/environment';
import { RolRecurso, BackendRolRecurso, PaginatedRolRecursoResponse, LegacyPaginatedRolRecursoResponse } from '../models/rol-recurso.model';
import { AuthHeadersService } from './auth-headers.service';

@Injectable({
  providedIn: 'root'
})
export class RolRecursoService {

  private apiUrl = `${environment.apiUrl}/api/roles-recursos/`;

  constructor(
    private http: HttpClient,
    private authHeaders: AuthHeadersService
  ) {}

  listar(): Observable<RolRecurso[]> {
    return this.http.get<PaginatedRolRecursoResponse | LegacyPaginatedRolRecursoResponse | RolRecurso[]>(
      this.apiUrl,
      { headers: this.authHeaders.getAuthHeaders() }
    ).pipe(
      map(response => {
        // Handle backend response format: { value: [...], Count: N }
        if ('value' in response && Array.isArray(response.value)) {
          return response.value.map((backendRR: BackendRolRecurso) => ({
            id: 0, // Backend doesn't return ID in list
            rol: backendRR.id_rol,
            recurso: backendRR.id_recurso
          } as RolRecurso));
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

  crear(data: Partial<RolRecurso>): Observable<RolRecurso> {
    // Convert frontend model to backend format
    const backendData = {
      id_rol: data.rol,
      id_recurso: data.recurso
    };

    return this.http.post<BackendRolRecurso | RolRecurso>(
      this.apiUrl,
      backendData,
      { headers: this.authHeaders.getAuthHeaders() }
    ).pipe(
      map(response => {
        // If backend returns BackendRolRecurso format
        if ('id_rol' in response) {
          return {
            id: 0,
            rol: (response as BackendRolRecurso).id_rol,
            recurso: (response as BackendRolRecurso).id_recurso
          } as RolRecurso;
        }
        // If backend returns RolRecurso format directly
        return response as RolRecurso;
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
    console.error('Error en RolRecursoService:', error);
    return throwError(() => error);
  }
}