import { Injectable } from '@angular/core';
import { HttpClient, HttpErrorResponse, HttpHeaders } from '@angular/common/http';
import { Observable, map, throwError, catchError } from 'rxjs';
import { environment } from '../../../environments/environment';
import { AuthHeadersService } from './auth-headers.service';
import { Usuario } from '../models/usuario.model';

export interface CreateUsuario {
  email: string;
  password: string;
  nombre?: string;
}

export interface UpdateUsuario {
  email?: string;
  password?: string;
  nombre?: string;
}

@Injectable({
  providedIn: 'root',
})
export class UsuarioService {
  private apiUrl = `${environment.apiUrl}/usuarios`;

  constructor(private http: HttpClient, private authHeaders: AuthHeadersService) {}

  private getHeaders(): HttpHeaders {
    return this.authHeaders.getAuthHeaders().set('Content-Type', 'application/json');
  }

  getAll(): Observable<Usuario[]> {
    return this.http.get<{ success: boolean; data: Usuario[] }>(this.apiUrl, { headers: this.getHeaders() })
      .pipe(map(response => response.data || []));
  }

  getById(id: number): Observable<Usuario> {
    return this.http.get<{ success: boolean; data: Usuario }>(`${this.apiUrl}/${id}`, { headers: this.getHeaders() })
      .pipe(map(response => response.data));
  }

  create(data: CreateUsuario): Observable<Usuario> {
    return this.http.post<{ success: boolean; data: Usuario }>(this.apiUrl, data, { headers: this.getHeaders() })
      .pipe(map(response => response.data));
  }

  update(id: number, data: UpdateUsuario): Observable<Usuario> {
    return this.http.put<{ success: boolean; data: Usuario }>(`${this.apiUrl}/${id}`, data, { headers: this.getHeaders() })
      .pipe(map(response => response.data));
  }

  delete(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`, { headers: this.getHeaders() });
  }

  listar(): Observable<Usuario[]> {
    return this.getAll().pipe(
      catchError(this.handleError)
    );
  }

  eliminar(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`, { headers: this.getHeaders() }).pipe(
      catchError(this.handleError)
    );
  }

  private handleError(error: HttpErrorResponse) {
    console.error('Error en UsuarioService:', error);
    return throwError(() => error);
  }
}