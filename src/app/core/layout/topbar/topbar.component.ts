// src/app/core/layout/topbar/topbar.component.ts

import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';

import { StorageService } from '../../services/storage.service';
import { AuthService } from '../../services/auth.service';
import { Usuario } from '../../models/usuario.model';

@Component({
  selector: 'app-topbar',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './topbar.component.html',
  styleUrl: './topbar.component.css'
})
export class TopbarComponent {

  usuario: Usuario | null = null;

  constructor(
    private storageService: StorageService,
    private authService: AuthService,
    private router: Router
  ) {
    this.usuario = this.storageService.getUsuario();
  }

  logout(): void {
    this.authService.logout();
    this.router.navigate(['/login']);
  }
}