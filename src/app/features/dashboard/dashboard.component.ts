// src/app/features/dashboard/dashboard.component.ts

import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { StorageService } from '../../core/services/storage.service';
import { Usuario } from '../../core/models/usuario.model';
import { Rol } from '../../core/models/rol.model';
import { Recurso } from '../../core/models/recurso.model';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './dashboard.component.html',
  styleUrl: './dashboard.component.css'
})
export class DashboardComponent implements OnInit {

  usuario: Usuario | null = null;
  roles: Rol[] = [];
  recursos: Recurso[] = [];

  constructor(private storageService: StorageService) {}

  ngOnInit(): void {
    this.usuario = this.storageService.getUsuario();
    this.roles = this.storageService.getRoles();
    this.recursos = this.storageService.getRecursos();
  }
}