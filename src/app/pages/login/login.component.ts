// src/app/pages/login/login.component.ts

import { Component, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';

import { AuthService } from '../../core/services/auth.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './login.component.html',
  styleUrl: './login.component.css'
})
export class LoginComponent {

  username = '';
  password = '';

  loading = false;
  errorMessage = '';

  constructor(
    private authService: AuthService,
    private router: Router,
    private cdr: ChangeDetectorRef
  ) {}

  login(): void {
    if (this.loading) {
      return;
    }

    this.errorMessage = '';

    const username = this.username.trim();
    const password = this.password.trim();

    if (!username || !password) {
      this.errorMessage = 'Por favor ingrese usuario y contraseña.';
      this.cdr.detectChanges();
      return;
    }

    this.loading = true;
    this.cdr.detectChanges();

    this.authService.login(username, password).subscribe({
      next: () => {
        this.loading = false;
        this.errorMessage = '';
        this.cdr.detectChanges();

        this.router.navigate(['/dashboard']);
      },
      error: (error) => {
        console.error('Error en login:', error);

        this.loading = false;
        this.errorMessage = this.obtenerMensajeError(error);

        this.cdr.detectChanges();
      }
    });
  }

  private obtenerMensajeError(error: any): string {
    if (error.status === 0) {
      return 'No fue posible conectarse con el servidor. Verifique que el backend esté encendido.';
    }

    if (error.status === 400 || error.status === 401) {
      if (error.error?.non_field_errors?.length > 0) {
        return error.error.non_field_errors[0];
      }

      if (error.error?.detail) {
        return error.error.detail;
      }

      return 'Usuario o contraseña incorrectos.';
    }

    if (error.status === 403) {
      return 'Su usuario no tiene permisos para acceder al sistema.';
    }

    if (error.status === 500) {
      return 'Error interno del servidor. Revise la consola de Django.';
    }

    return 'Ocurrió un error al iniciar sesión. Intente nuevamente.';
  }
}