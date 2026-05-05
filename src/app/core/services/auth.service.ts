// src/app/core/services/auth.service.ts

import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, tap } from 'rxjs';

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
        const payload = { email: username, password };
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