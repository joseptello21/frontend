// src/app/core/services/auth.service.ts

import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, tap, catchError, of } from 'rxjs';

import { environment } from '../../../environments/environment';
import { AuthResponse } from '../models/auth-response.model';
import { StorageService } from './storage.service';
import { Usuario } from '../models/usuario.model';

export interface LoginResponse {
  success: boolean;
  token: string;
  user?: {
    id: number;
    email: string;
  };
}

@Injectable({
    providedIn: 'root'
})
export class AuthService {

    private apiUrl = environment.apiUrl;

    constructor(
        private http: HttpClient,
        private storageService: StorageService
    ) {}

    login(username: string, password: string): Observable<LoginResponse> {
        const payload = { email: username, username, password };
        console.log('🔐 Attempting login with payload:', payload);
        
        return this.http.post<LoginResponse>(`${this.apiUrl}/auth/login`, payload).pipe(
            tap(response => {
                console.log('✅ Login response:', response);
                if (response.success && response.token) {
                    this.storageService.setToken(response.token);
                    
                    if (response.user) {
                        // Map the backend user response to Usuario model
                        const usuario: Usuario = {
                            idusuarios: response.user.id,
                            username: response.user.email,
                            email: response.user.email,
                            estado: 'activo'
                        };
                        this.storageService.setUsuario(usuario);
                    }
                }
            })
        );
    }

    forgotPassword(email: string): Observable<any> {
        return this.http.post<any>(`${this.apiUrl}/auth/forgot-password`, { email }).pipe(
            catchError(error => {
                console.error('Forgot password request failed:', error);
                return of({ success: false, message: 'No fue posible enviar la solicitud de recuperación.' });
            })
        );
    }

    register(name: string, email: string, password: string): Observable<any> {
        const payload = { nombre: name, email, password };
        return this.http.post<any>(`${this.apiUrl}/auth/register`, payload).pipe(
            catchError(error => {
                console.error('Register request failed:', error);
                return of({ success: false, message: 'No fue posible completar el registro.' });
            })
        );
    }

    logout(): void {
        this.storageService.clear();
    }

    isAuthenticated(): boolean {
        return this.storageService.isAuthenticated();
    }

    currentUser(): Usuario | null {
        return this.storageService.getUsuario();
    }

    isAdmin(): boolean {
        const user = this.currentUser();
        return user?.email === 'admin@gmail.com' || user?.username === 'admin@gmail.com';
    }
}