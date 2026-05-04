import { Injectable } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Observable, map, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';

import { environment } from '../../../environments/environment';
import { UsuarioRol, PaginatedUsuarioRolResponse } from '../models/usuario-rol.model';
import { AuthHeadersService } from './auth-headers.service';

@Injectable({
  providedIn: 'root'
})
export class UsuarioRolService {

  private apiUrl = `${environment.apiUrl}/usuarios-roles/`;

  constructor(
    private http: HttpClient,
    private authHeaders: AuthHeadersService
  ) {}

  listar(): Observable<UsuarioRol[]> {
    return this.http.get<PaginatedUsuarioRolResponse | UsuarioRol[]>(
      this.apiUrl,
      { headers: this.authHeaders.getAuthHeaders() }
    ).pipe(
      map(response => Array.isArray(response) ? response : response.results),
      catchError(this.handleError)
    );
  }

  crear(data: Partial<UsuarioRol>): Observable<UsuarioRol> {
    return this.http.post<UsuarioRol>(
      this.apiUrl,
      data,
      { headers: this.authHeaders.getAuthHeaders() }
    ).pipe(
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
    console.error('Error en UsuarioRolService:', error);
    return throwError(() => error);
  }
}