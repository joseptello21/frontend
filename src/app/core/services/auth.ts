import { Injectable, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { Observable, tap, catchError, of } from 'rxjs';
import { environment } from '../../../environments/environment';

export interface LoginResponse {
  success: boolean;
  message?: string;
  token?: string;
  user?: {
    id: number;
    email: string;
  };
  data?: {
    token: string;
    user: {
      id: number;
      email: string;
    };
  };
}

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  private apiUrl = environment.apiUrl;
  
  // Signal para estado reactivo
  isAuthenticated = signal<boolean>(this.hasToken());
  currentUser = signal<any>(this.getUserFromToken());

  constructor(private http: HttpClient, private router: Router) {}

  login(email: string, password: string): Observable<LoginResponse> {
    return this.http.post<LoginResponse>(`${this.apiUrl}/auth/login`, { email, password })
      .pipe(
        tap(response => {
          const token = response.token || response.data?.token;
          const user = response.user || response.data?.user;

          if (response.success && token) {
            this.setToken(token);
            this.isAuthenticated.set(true);

            if (user) {
              this.setUser(user);
              this.currentUser.set(user);
            } else {
              const decoded = this.decodeToken(token);
              if (decoded?.id && decoded?.email) {
                this.setUser(decoded);
                this.currentUser.set(decoded);
              }
            }
          }
        }),
        catchError(error => {
          console.error('Login error:', error);
          return of({ success: false, message: 'Error de conexión' });
        })
      );
  }

  register(email: string, password: string, nombre?: string): Observable<any> {
    return this.http.post(`${this.apiUrl}/auth/register`, { email, password, nombre });
  }

  forgotPassword(email: string): Observable<any> {
    return this.http.post(`${this.apiUrl}/auth/forgot-password`, { email })
      .pipe(
        catchError(error => {
          console.error('Forgot password error:', error);
          return of({ success: false, message: 'No se pudo enviar la solicitud de recuperación' });
        })
      );
  }

  logout(): void {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    this.isAuthenticated.set(false);
    this.currentUser.set(null);
    this.router.navigate(['/login']);
  }

  getToken(): string | null {
    return localStorage.getItem('token');
  }

  private setToken(token: string): void {
    localStorage.setItem('token', token);
  }

  private setUser(user: any): void {
    localStorage.setItem('user', JSON.stringify(user));
  }

  private hasToken(): boolean {
    return !!localStorage.getItem('token');
  }

  private getUserFromToken(): any {
    const userStr = localStorage.getItem('user');
    return userStr ? JSON.parse(userStr) : null;
  }

  private decodeToken(token: string): any {
    try {
      const parts = token.split('.');
      if (parts.length !== 3) {
        return null;
      }
      const payload = parts[1].replace(/-/g, '+').replace(/_/g, '/');
      const decoded = JSON.parse(atob(payload));
      return decoded;
    } catch (error) {
      return null;
    }
  }
}
