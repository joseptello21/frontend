import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './register.component.html',
  styleUrl: './register.component.css'
})
export class RegisterComponent {
  name = '';
  email = '';
  password = '';
  confirmPassword = '';
  loading = false;
  errorMessage = '';
  successMessage = '';

  constructor(
    private authService: AuthService,
    private router: Router
  ) {}

  register(): void {
    this.errorMessage = '';
    this.successMessage = '';

    const name = this.name.trim();
    const email = this.email.trim();
    const password = this.password;
    const confirmPassword = this.confirmPassword;

    if (!name || !email || !password || !confirmPassword) {
      this.errorMessage = 'Complete todos los campos para registrarse.';
      return;
    }

    if (password !== confirmPassword) {
      this.errorMessage = 'Las contraseñas no coinciden.';
      return;
    }

    this.loading = true;

    this.authService.register(name, email, password).subscribe({
      next: (response) => {
        this.loading = false;
        if (response?.success) {
          this.successMessage = response.message || 'Registro exitoso. Ya puedes iniciar sesión.';
          setTimeout(() => this.router.navigate(['/login']), 1200);
        } else {
          this.errorMessage = response?.message || 'No fue posible completar el registro.';
        }
      },
      error: (error) => {
        console.error('Register error:', error);
        this.loading = false;
        this.errorMessage = 'Error de conexión. Intente nuevamente.';
      }
    });
  }
}
