// src/app/features/data-view/data-view.component.ts

import { Component, OnInit, OnDestroy } from '@angular/core';
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
import { TelemetryService, SolarTelemetry } from '../../core/services/telemetry.service';

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
  telemetrias: SolarTelemetry[] = [];
  latestTelemetry: SolarTelemetry | null = null;
  private updateIntervalId: any;
  formattedTimestamps: Map<any, string> = new Map();

  constructor(
    private storageService: StorageService,
    private deviceService: DeviceService,
    private luminariaService: LuminariaService,
    private sensorService: SensorService,
    private bateriaService: BateriaService,
    private usuarioService: UsuarioService,
    private telemetryService: TelemetryService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.usuario = this.storageService.getUsuario();
    this.roles = this.storageService.getRoles();
    this.recursos = this.storageService.getRecursos();

    this.loadData();
    
    // Actualizar timestamps cada segundo
    this.updateIntervalId = setInterval(() => {
      this.updateFormattedTimestamps();
    }, 1000);
  }

  ngOnDestroy(): void {
    if (this.updateIntervalId) {
      clearInterval(this.updateIntervalId);
    }
  }

  private loadData(): void {
    // Datos de ejemplo para mostrar la estructura de las tablas
    this.dispositivos = [
      { id: 1, nombre: 'Panel Solar Principal', tipo: 'Panel Solar', estado: 'activo', ultima_conexion: '2024-01-15 10:30:00' }
    ];

    this.luminarias = [
      { id_luminaria: 1, tipo_luminaria: 'LED', potencia_watts: 50, estado: 'activo', id_zona: 1 }
    ];

    this.sensores = [
      { id_sensor: 1, tipo_sensor: 'Fotoresistor', descripcion: 'Sensor de luminosidad del panel', unidad_medida: 'lux', id_dispositivo: 1 }
    ];

    this.baterias = [
      { id_bateria: 1, capacidad_ah: 100, voltaje: 12, estado: 'activo', id_panel: 1 }
    ];

    this.usuarios = [
      { idusuarios: 1, username: 'admin', email: 'admin@demo.com', estado: 'activo' },
      { idusuarios: 2, username: 'demo', email: 'demo@demo.com', estado: 'activo' },
      { idusuarios: 3, username: 'user1', email: 'user1@demo.com', estado: 'inactivo' }
    ];

    // También intentar cargar datos reales del backend
    this.loadRealData();
  }

  private normalizeArrayResponse<T>(data: any, keys: string[]): T[] {
    if (Array.isArray(data)) {
      return data;
    }
    for (const key of keys) {
      if (Array.isArray(data?.[key])) {
        return data[key];
      }
    }
    return [];
  }

  private mapDeviceToDisplay(device: any) {
    return {
      ...device,
      nombre: device.nombre || device.name || device.device_id || device.id || 'N/A',
      tipo: device.tipo || device.device_type || device.tipo_dispositivo || 'N/A',
      estado: device.estado || device.status || (device.active === true ? 'activo' : device.active === false ? 'inactivo' : 'Desconocido'),
      ultima_conexion: device.ultima_conexion || device.last_seen || device.updated_at || device.created_at || 'N/A'
    };
  }

  private loadRealData(): void {
    // Cargar dispositivos
    this.deviceService.listar().subscribe({
      next: (data: any) => {
        const dispositivos = this.normalizeArrayResponse<any>(data, ['devices', 'dispositivos', 'items', 'data']);
        if (dispositivos.length > 0) {
          this.dispositivos = dispositivos.map(device => this.mapDeviceToDisplay(device));
        }
      },
      error: (err: any) => console.log('Using example data for devices', err)
    });

    // Cargar luminarias
    this.luminariaService.getAll().subscribe({
      next: (data: any) => {
        const luminarias = this.normalizeArrayResponse<any>(data, ['luminarias', 'items', 'data']);
        if (luminarias.length > 0) {
          this.luminarias = luminarias;
        }
      },
      error: (err: any) => console.log('Using example data for luminarias', err)
    });

    // Cargar sensores
    this.sensorService.getAll().subscribe({
      next: (data: any) => {
        const sensores = this.normalizeArrayResponse<any>(data, ['sensores', 'sensors', 'items', 'data']);
        if (sensores.length > 0) {
          this.sensores = sensores;
        }
      },
      error: (err: any) => console.log('Using example data for sensores', err)
    });

    // Cargar baterías
    this.bateriaService.getAll().subscribe({
      next: (data: any) => {
        const baterias = this.normalizeArrayResponse<any>(data, ['baterias', 'items', 'data']);
        if (baterias.length > 0) {
          this.baterias = baterias;
        }
      },
      error: (err: any) => console.log('Using example data for baterias', err)
    });

    // Cargar telemetría solar
    this.telemetryService.getAll().subscribe({
      next: (data: any) => {
        const telemetrias = this.normalizeArrayResponse<any>(data, ['telemetrias', 'telemetria', 'items', 'data']);
        if (telemetrias.length > 0) {
          this.telemetrias = telemetrias
            .map((item: any) => this.mapTelemetryToDisplay(item))
            .sort((a, b) => (b.timestamp || '').localeCompare(a.timestamp || ''));
          this.latestTelemetry = this.getLatestTelemetryFromList(this.telemetrias);
          if (this.latestTelemetry) {
            this.updateDeviceViewsFromTelemetry(this.latestTelemetry);
          }
        }
      },
      error: (err: any) => console.log('Using example data for telemetría solar', err)
    });

    // Cargar usuarios
    this.usuarioService.listar().subscribe({
      next: (data: any) => {
        const usuarios = this.normalizeArrayResponse<any>(data, ['usuarios', 'users', 'items', 'data']);
        if (usuarios.length > 0) {
          this.usuarios = usuarios;
        }
      },
      error: (err: any) => console.log('Using example data for usuarios', err)
    });
  }

  private mapTelemetryToDisplay(telemetry: any): any {
    return {
      id: telemetry.id ?? telemetry.id_telemetria ?? telemetry.telemetry_id ?? 'N/A',
      timestamp: telemetry.timestamp || telemetry.fecha_registro || telemetry.fecha || telemetry.created_at || telemetry.updated_at || 'N/A',
      ldr: telemetry.ldr ?? telemetry.ldrValue ?? telemetry.ldr_value ?? telemetry.lux ?? telemetry.luminancia ?? null,
      batteryVoltage: telemetry.batteryVoltage ?? telemetry.battery_voltage ?? telemetry.voltaje ?? telemetry.bat ?? null,
      lamp: telemetry.lamp ?? telemetry.lampState ?? telemetry.lamp_state ?? telemetry.lamp_status ?? telemetry.lampara ?? false,
      autoMode: telemetry.autoMode ?? telemetry.auto_mode ?? telemetry.is_auto ?? telemetry.auto ?? false,
      manualStatus: telemetry.manualStatus ?? telemetry.manual_status ?? false,
      panelId: telemetry.panelId ?? telemetry.id_panel ?? telemetry.panel_id ?? 'N/A',
      batteryId: telemetry.batteryId ?? telemetry.id_bateria ?? telemetry.battery_id ?? 'N/A',
      luminariaId: telemetry.luminariaId ?? telemetry.id_luminaria ?? telemetry.luminaria_id ?? 'N/A',
      energiaGenerada: telemetry.energiaGenerada ?? telemetry.energia_generada ?? telemetry.energyGenerated ?? telemetry.energy ?? null,
    };
  }

  private getLatestTelemetryFromList(telemetrias: SolarTelemetry[]): SolarTelemetry | null {
    if (telemetrias.length === 0) {
      return null;
    }
    return telemetrias[0];
  }

  getPanelState(): string {
    if (!this.latestTelemetry) {
      return 'Desconocido';
    }
    return this.latestTelemetry.panelId !== 'N/A' ? 'Activo' : 'Inactivo';
  }

  getBatteryState(): string {
    if (!this.latestTelemetry) {
      return 'Desconocido';
    }
    return this.latestTelemetry.batteryVoltage != null && this.latestTelemetry.batteryVoltage > 0 ? 'Activo' : 'Inactivo';
  }

  getSensorState(): string {
    if (!this.latestTelemetry) {
      return 'Desconocido';
    }
    return this.latestTelemetry.ldr != null ? 'Activo' : 'Inactivo';
  }

  getLuminariaState(): string {
    if (!this.latestTelemetry) {
      return 'Desconocido';
    }
    return this.latestTelemetry.lamp ? 'Encendida' : 'Apagada';
  }

  private updateDeviceViewsFromTelemetry(telemetry: SolarTelemetry): void {
    if (telemetry.panelId && telemetry.panelId !== 'N/A') {
      this.dispositivos = [
        {
          id: telemetry.panelId,
          nombre: 'Panel Solar',
          tipo: 'Panel Solar',
          estado: 'activo',
          ultima_conexion: telemetry.timestamp || 'N/A'
        }
      ];
    }

    if (telemetry.ldr != null) {
      this.sensores = [
        {
          id_sensor: 1,
          tipo_sensor: 'Fotoresistor',
          descripcion: 'Sensor de luminosidad del panel',
          unidad_medida: 'lux',
          id_dispositivo: telemetry.panelId || 'N/A'
        }
      ];
    }

    if (telemetry.batteryVoltage != null) {
      this.baterias = [
        {
          id_bateria: telemetry.batteryId || 'N/A',
          capacidad_ah: null,
          voltaje: telemetry.batteryVoltage,
          estado: this.getBatteryState().toLowerCase(),
          id_panel: telemetry.panelId || 'N/A'
        }
      ];
    }

    if (telemetry.lamp != null) {
      this.luminarias = [
        {
          id_luminaria: telemetry.luminariaId || 'N/A',
          tipo_luminaria: 'LED',
          potencia_watts: telemetry.energiaGenerada != null ? telemetry.energiaGenerada : 0,
          estado: telemetry.lamp ? 'activo' : 'inactivo',
          id_zona: 1
        }
      ];
    }
  }

  formatTimestamp(timestamp: any): string {
    if (!timestamp || timestamp === 'N/A') {
      return 'Nunca';
    }

    try {
      const date = new Date(timestamp);
      if (isNaN(date.getTime())) {
        return 'Fecha inválida';
      }

      const day = date.getDate().toString().padStart(2, '0');
      const month = (date.getMonth() + 1).toString().padStart(2, '0');
      const year = date.getFullYear();
      const hours = date.getHours().toString().padStart(2, '0');
      const minutes = date.getMinutes().toString().padStart(2, '0');
      const seconds = date.getSeconds().toString().padStart(2, '0');

      return `${day}/${month}/${year} ${hours}:${minutes}:${seconds}`;
    } catch (error) {
      return 'Fecha inválida';
    }
  }

  getTimeAgoDisplay(timestamp: any): string {
    if (!timestamp || timestamp === 'N/A') {
      return 'Nunca';
    }

    try {
      const date = new Date(timestamp);
      if (isNaN(date.getTime())) {
        return 'Fecha inválida';
      }

      const now = new Date();
      const diffMs = now.getTime() - date.getTime();
      const diffSeconds = Math.floor(diffMs / 1000);
      const diffMinutes = Math.floor(diffSeconds / 60);
      const diffHours = Math.floor(diffMinutes / 60);
      const diffDays = Math.floor(diffHours / 24);

      if (diffSeconds < 60) {
        return `hace ${diffSeconds} segundo${diffSeconds !== 1 ? 's' : ''}`;
      } else if (diffMinutes < 60) {
        return `hace ${diffMinutes} minuto${diffMinutes !== 1 ? 's' : ''}`;
      } else if (diffHours < 24) {
        return `hace ${diffHours} hora${diffHours !== 1 ? 's' : ''}`;
      } else {
        return `hace ${diffDays} día${diffDays !== 1 ? 's' : ''}`;
      }
    } catch (error) {
      return 'Fecha inválida';
    }
  }

  getFormattedLatestTime(): string {
    if (!this.latestTelemetry || !this.latestTelemetry.timestamp) {
      return 'Nunca';
    }
    return this.formatTimestamp(this.latestTelemetry.timestamp);
  }

  updateFormattedTimestamps(): void {
    // Actualizar timestamps formateados para todas las telemetrías
    this.telemetrias.forEach(item => {
      if (item.timestamp) {
        this.formattedTimestamps.set(item, this.formatTimestamp(item.timestamp));
      }
    });
  }

  volverAlDashboard(): void {
    this.router.navigate(['/dashboard']);
  }
}