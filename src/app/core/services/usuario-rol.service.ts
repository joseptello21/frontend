import { Injectable } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Observable, map, throwError, catchError } from 'rxjs';

import { environment } from '../../../environments/environment';
import { UsuarioRol, BackendUsuarioRol, PaginatedUsuarioRolResponse, LegacyPaginatedUsuarioRolResponse } from '../models/usuario-rol.model';
import { AuthHeadersService } from './auth-headers.service';

@Injectable({
  providedIn: 'root'
})
export class UsuarioRolService {

  private apiUrl = `${environment.apiUrl}/api/usuarios-roles/`;

  constructor(
    private http: HttpClient,
    private authHeaders: AuthHeadersService
  ) {}

  listar(): Observable<UsuarioRol[]> {
    return this.http.get<PaginatedUsuarioRolResponse | LegacyPaginatedUsuarioRolResponse | UsuarioRol[]>(
      this.apiUrl,
      { headers: this.authHeaders.getAuthHeaders() }
    ).pipe(
      map(response => {
        // Handle backend response format: { value: [...], Count: N }
        if ('value' in response && Array.isArray(response.value)) {
          return response.value.map((backendUR: BackendUsuarioRol) => ({
            id: 0, // Backend doesn't return ID in list
            usuario: backendUR.id_usuario,
            rol: backendUR.id_rol
          } as UsuarioRol));
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

  crear(data: Partial<UsuarioRol>): Observable<UsuarioRol> {
    // Convert frontend model to backend format
    const backendData = {
      id_usuario: data.usuario,
      id_rol: data.rol
    };

    return this.http.post<BackendUsuarioRol | UsuarioRol>(
      this.apiUrl,
      backendData,
      { headers: this.authHeaders.getAuthHeaders() }
    ).pipe(
      map(response => {
        // If backend returns BackendUsuarioRol format
        if ('id_usuario' in response) {
          return {
            id: 0,
            usuario: (response as BackendUsuarioRol).id_usuario,
            rol: (response as BackendUsuarioRol).id_rol
          } as UsuarioRol;
        }
        // If backend returns UsuarioRol format directly
        return response as UsuarioRol;
      }),
      catchError(this.handleError)
    );
  }

  eliminar(id: number): Observable<any> {
    return this.http.delete<any>(
      `${this.apiUrl}${id}/`,
      { headers: this.authHeaders.getAuthHeaders() }
    ).pipe(
      catchError(this.handleError)
    );
  }

  private handleError(error: HttpErrorResponse) {
    console.error('Error en UsuarioRolService:', error);
    return throwError(() => error);
  }
}