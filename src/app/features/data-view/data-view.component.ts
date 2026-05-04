// src/app/features/data-view/data-view.component.ts

import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { StorageService } from '../../core/services/storage.service';
import { Usuario } from '../../core/models/usuario.model';
import { Rol } from '../../core/models/rol.model';
import { Recurso } from '../../core/models/recurso.model';
import { DeviceService } from '../../core/services/device.service';
import { LuminariaService } from '../../core/services/luminaria.service';
import { SensorService } from '../../core/services/sensor.service';
import { BateriaService } from '../../core/services/bateria.service';
import { UsuarioService } from '../../core/services/usuario.service';

@Component({
  selector: 'app-data-view',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './data-view.component.html',
  styleUrl: './data-view.component.css'
})
export class DataViewComponent implements OnInit {

  usuario: Usuario | null = null;
  roles: Rol[] = [];
  recursos: Recurso[] = [];

  dispositivos: any[] = [];
  luminarias: any[] = [];
  sensores: any[] = [];
  baterias: any[] = [];
  usuarios: any[] = [];

  constructor(
    private storageService: StorageService,
    private deviceService: DeviceService,
    private luminariaService: LuminariaService,
    private sensorService: SensorService,
    private bateriaService: BateriaService,
    private usuarioService: UsuarioService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.usuario = this.storageService.getUsuario();
    this.roles = this.storageService.getRoles();
    this.recursos = this.storageService.getRecursos();

    this.loadData();
  }

  private loadData(): void {
    // Datos de ejemplo para mostrar la estructura de las tablas
    this.dispositivos = [
      { id: 1, nombre: 'Sensor Temperatura 1', tipo: 'Temperatura', estado: 'activo', ultima_conexion: '2024-01-15 10:30:00' },
      { id: 2, nombre: 'Sensor Humedad 1', tipo: 'Humedad', estado: 'activo', ultima_conexion: '2024-01-15 10:25:00' },
      { id: 3, nombre: 'Controlador LED 1', tipo: 'Controlador', estado: 'inactivo', ultima_conexion: '2024-01-14 18:45:00' }
    ];

    this.luminarias = [
      { id_luminaria: 1, tipo_luminaria: 'LED', potencia_watts: 50, estado: 'activo', id_zona: 1 },
      { id_luminaria: 2, tipo_luminaria: 'Fluorescente', potencia_watts: 75, estado: 'activo', id_zona: 2 },
      { id_luminaria: 3, tipo_luminaria: 'LED', potencia_watts: 30, estado: 'inactivo', id_zona: 1 }
    ];

    this.sensores = [
      { id_sensor: 1, tipo_sensor: 'Temperatura', descripcion: 'Sensor de temperatura ambiente', unidad_medida: '°C', id_dispositivo: 1 },
      { id_sensor: 2, tipo_sensor: 'Humedad', descripcion: 'Sensor de humedad relativa', unidad_medida: '%', id_dispositivo: 2 },
      { id_sensor: 3, tipo_sensor: 'Luminosidad', descripcion: 'Sensor de luz ambiente', unidad_medida: 'lux', id_dispositivo: 1 }
    ];

    this.baterias = [
      { id_bateria: 1, capacidad_ah: 100, voltaje: 12, estado: 'activo', id_panel: 1 },
      { id_bateria: 2, capacidad_ah: 150, voltaje: 24, estado: 'activo', id_panel: 2 },
      { id_bateria: 3, capacidad_ah: 80, voltaje: 12, estado: 'inactivo', id_panel: 1 }
    ];

    this.usuarios = [
      { idusuarios: 1, username: 'admin', email: 'admin@demo.com', estado: 'activo' },
      { idusuarios: 2, username: 'demo', email: 'demo@demo.com', estado: 'activo' },
      { idusuarios: 3, username: 'user1', email: 'user1@demo.com', estado: 'inactivo' }
    ];

    // También intentar cargar datos reales del backend
    this.loadRealData();
  }

  private loadRealData(): void {
    // Cargar dispositivos
    this.deviceService.listar().subscribe({
      next: (data: any) => {
        if (data && data.length > 0) {
          this.dispositivos = data;
        }
      },
      error: (err: any) => console.log('Using example data for devices')
    });

    // Cargar luminarias
    this.luminariaService.getAll().subscribe({
      next: (data: any) => {
        if (data && data.length > 0) {
          this.luminarias = data;
        }
      },
      error: (err: any) => console.log('Using example data for luminarias')
    });

    // Cargar sensores
    this.sensorService.getAll().subscribe({
      next: (data: any) => {
        if (data && data.length > 0) {
          this.sensores = data;
        }
      },
      error: (err: any) => console.log('Using example data for sensores')
    });

    // Cargar baterías
    this.bateriaService.getAll().subscribe({
      next: (data: any) => {
        if (data && data.length > 0) {
          this.baterias = data;
        }
      },
      error: (err: any) => console.log('Using example data for baterias')
    });

    // Cargar usuarios
    this.usuarioService.listar().subscribe({
      next: (data: any) => {
        if (data && data.length > 0) {
          this.usuarios = data;
        }
      },
      error: (err: any) => console.log('Using example data for usuarios')
    });
  }

  volverAlDashboard(): void {
    this.router.navigate(['/dashboard']);
  }
}