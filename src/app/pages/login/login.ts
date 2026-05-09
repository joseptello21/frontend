import { Component, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../../core/services/auth';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './login.html',
  styleUrl: './login.css',
})
export class Login {
  email = '';
  password = '';
  showForgot = false;
  forgotEmail = '';
  error = signal('');
  forgotMessage = signal('');
  forgotError = signal('');
  loading = signal(false);

  constructor(private authService: AuthService, private router: Router) {}

  onSubmit() {
    if (!this.email || !this.password) {
      this.error.set('Por favor complete todos los campos');
      return;
    }

    this.loading.set(true);
    this.error.set('');

    this.authService.login(this.email, this.password).subscribe({
      next: (response) => {
        this.loading.set(false);
        if (response.success) {
          this.router.navigate(['/dashboard']);
        } else {
          this.error.set(response.message || 'Error en el inicio de sesión');
        }
      },
      error: () => {
        this.loading.set(false);
        this.error.set('Error de conexión con el servidor');
      }
    });
  }

  toggleForgotPassword(): void {
    this.showForgot = !this.showForgot;
    this.forgotMessage.set('');
    this.forgotError.set('');
  }

  sendForgotPassword(): void {
    if (!this.forgotEmail) {
      this.forgotError.set('Ingrese su email para continuar');
      return;
    }

    this.loading.set(true);
    this.forgotError.set('');
    this.forgotMessage.set('');

    this.authService.forgotPassword(this.forgotEmail).subscribe({
      next: (response) => {
        this.loading.set(false);
        if (response?.success) {
          this.forgotMessage.set(response.message || 'Revisa tu correo para recuperar tu contraseña');
        } else {
          this.forgotError.set(response?.message || 'No se pudo procesar la solicitud');
        }
      },
      error: () => {
        this.loading.set(false);
        this.forgotError.set('Error de conexión con el servidor');
      }
    });
  }
}
