import { Injectable } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Observable, map, throwError, catchError } from 'rxjs';

import { environment } from '../../../environments/environment';
import { Recurso, PaginatedRecursoResponse } from '../models/recurso.model';
import { AuthHeadersService } from './auth-headers.service';

@Injectable({
  providedIn: 'root'
})
export class RecursoService {

  private apiUrl = `${environment.apiUrl}/recursos/`;

  constructor(
    private http: HttpClient,
    private authHeaders: AuthHeadersService
  ) {}

  listar(): Observable<Recurso[]> {
    return this.http.get<PaginatedRecursoResponse | Recurso[]>(
      this.apiUrl,
      { headers: this.authHeaders.getAuthHeaders() }
    ).pipe(
      map(response => Array.isArray(response) ? response : response.results),
      catchError(this.handleError)
    );
  }

  crear(recurso: Partial<Recurso>): Observable<Recurso> {
    return this.http.post<Recurso>(
      this.apiUrl,
      recurso,
      { headers: this.authHeaders.getAuthHeaders() }
    ).pipe(
      catchError(this.handleError)
    );
  }

  actualizar(id: number, recurso: Partial<Recurso>): Observable<Recurso> {
    return this.http.put<Recurso>(
      `${this.apiUrl}${id}/`,
      recurso,
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
    console.error('Error en RecursoService:', error);
    return throwError(() => error);
  }
}