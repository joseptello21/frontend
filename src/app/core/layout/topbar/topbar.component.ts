// src/app/core/layout/topbar/topbar.component.ts

import { Component, OnInit, OnDestroy } from '@angular/core';
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
  styleUrls: ['./topbar.component.css']
})
export class TopbarComponent implements OnInit, OnDestroy {

  usuario: Usuario | null = null;
  currentTime: string = '';
  currentDate: string = '';
  private intervalId: any;

  constructor(
    private storageService: StorageService,
    private authService: AuthService,
    private router: Router
  ) {
    this.usuario = this.storageService.getUsuario();
  }

  ngOnInit(): void {
    this.updateClock();
    this.intervalId = setInterval(() => this.updateClock(), 1000);
  }

  ngOnDestroy(): void {
    if (this.intervalId) {
      clearInterval(this.intervalId);
    }
  }

  private updateClock(): void {
    const now = new Date();
    
    // Formato de hora: HH:mm:ss
    this.currentTime = now.toLocaleTimeString('es-ES', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: false
    });
    
    // Formato de fecha: día, DD de mes de YYYY
    this.currentDate = now.toLocaleDateString('es-ES', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  }

  logout(): void {
    this.authService.logout();
    this.router.navigate(['/login']);
  }
}
