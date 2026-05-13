//rol.service.ts

import { Injectable } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Observable, map, throwError, catchError } from 'rxjs';

import { environment } from '../../../environments/environment';
import { Rol, BackendRol, PaginatedRolResponse, LegacyPaginatedRolResponse } from '../models/rol.model';
import { AuthHeadersService } from './auth-headers.service';

@Injectable({
    providedIn: 'root'
})
export class RolService {

    private apiUrl = `${environment.apiUrl}/api/roles/`;

    constructor(
        private http: HttpClient,
        private authHeaders: AuthHeadersService
    ) { }

    listar(): Observable<Rol[]> {
        const headers = this.authHeaders.getAuthHeaders();

        console.log('HEADERS EN RolService:', headers.get('Authorization'));

        return this.http.get<PaginatedRolResponse | LegacyPaginatedRolResponse | Rol[]>(
            this.apiUrl,
            { headers }
        ).pipe(
            map(response => {
                // Handle backend response format: { value: [...], Count: N }
                if ('value' in response && Array.isArray(response.value)) {
                    return response.value.map((backendRol: BackendRol) => ({
                        idrol: backendRol.id_rol,
                        nombre: backendRol.nombre_rol,
                        descripcion: '',
                        estado: 'ACTIVO'
                    } as Rol));
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

    crear(rol: Partial<Rol>): Observable<Rol> {
        // Convert frontend model to backend format
        const backendRol = {
            nombre_rol: rol.nombre,
            descripcion: rol.descripcion || '',
            estado: rol.estado || 'ACTIVO'
        };

        return this.http.post<BackendRol | Rol>(
            this.apiUrl,
            backendRol,
            { headers: this.authHeaders.getAuthHeaders() }
        ).pipe(
            map(response => {
                // If backend returns BackendRol format
                if ('id_rol' in response) {
                    return {
                        idrol: (response as BackendRol).id_rol,
                        nombre: (response as BackendRol).nombre_rol,
                        descripcion: rol.descripcion || '',
                        estado: rol.estado || 'ACTIVO'
                    } as Rol;
                }
                // If backend returns Rol format directly
                return response as Rol;
            }),
            catchError(this.handleError)
        );
    }

    actualizar(id: number, rol: Partial<Rol>): Observable<Rol> {
        const backendRol = {
            nombre_rol: rol.nombre,
            descripcion: rol.descripcion || '',
            estado: rol.estado || 'ACTIVO'
        };

        return this.http.put<BackendRol | Rol>(
            `${this.apiUrl}${id}/`,
            backendRol,
            { headers: this.authHeaders.getAuthHeaders() }
        ).pipe(
            map(response => {
                if ('id_rol' in response) {
                    return {
                        idrol: (response as BackendRol).id_rol,
                        nombre: (response as BackendRol).nombre_rol,
                        descripcion: rol.descripcion || '',
                        estado: rol.estado || 'ACTIVO'
                    } as Rol;
                }
                return response as Rol;
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
        console.error('Error en RolService:', error);
        return throwError(() => error);
    }
}