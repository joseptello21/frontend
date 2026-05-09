//rol.service.ts

import { Injectable } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Observable, map, throwError, catchError } from 'rxjs';

import { environment } from '../../../environments/environment';
import { Rol, PaginatedRolResponse } from '../models/rol.model';
import { AuthHeadersService } from './auth-headers.service';

@Injectable({
    providedIn: 'root'
})
export class RolService {

    private apiUrl = `${environment.apiUrl}/roles/`;

    constructor(
        private http: HttpClient,
        private authHeaders: AuthHeadersService
    ) { }

    listar(): Observable<Rol[]> {
        const headers = this.authHeaders.getAuthHeaders();

        console.log('HEADERS EN RolService:', headers.get('Authorization'));

        return this.http.get<PaginatedRolResponse | Rol[]>(
            this.apiUrl,
            { headers }
        ).pipe(
            map(response => Array.isArray(response) ? response : response.results),
            catchError(this.handleError)
        );
    }

    crear(rol: Partial<Rol>): Observable<Rol> {
        return this.http.post<Rol>(
            this.apiUrl,
            rol,
            { headers: this.authHeaders.getAuthHeaders() }
        ).pipe(
            catchError(this.handleError)
        );
    }

    actualizar(id: number, rol: Partial<Rol>): Observable<Rol> {
        return this.http.put<Rol>(
            `${this.apiUrl}${id}/`,
            rol,
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
        console.error('Error en RolService:', error);
        return throwError(() => error);
    }
}