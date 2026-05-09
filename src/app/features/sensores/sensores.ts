import {
  Component,
  OnInit,
  OnDestroy,
  ChangeDetectionStrategy,
  ChangeDetectorRef
} from '@angular/core';
import { CommonModule, Location } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { finalize } from 'rxjs';

import { SensorService, Sensor, CreateSensor } from '../../core/services/sensor.service';
import { TelemetryService, SolarTelemetry } from '../../core/services/telemetry.service';

@Component({
  selector: 'app-sensores',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './sensores.html',
  styleUrl: './sensores.css',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class Sensores implements OnInit, OnDestroy {

  sensores: Sensor[] = [];
  sensoresFiltrados: Sensor[] = [];
  telemetrias: SolarTelemetry[] = [];
  telemetriaPorDispositivo: Map<string, SolarTelemetry> = new Map();

  loading = false;
  refreshing = false;
  deletingId: number | null = null;
  successMessage = '';
  errorMessage = '';
  searchTerm = '';
  saving = false;
  modalVisible = false;
  modoEdicion = false;
  sensorSeleccionado: Sensor | null = null;
  formData: CreateSensor = { tipo_sensor: '', descripcion: '', unidad_medida: '', id_dispositivo: undefined };
  viewMode: 'grid' | 'table' = 'table';
  private updateIntervalId: any;

  constructor(
    private sensorService: SensorService,
    private telemetryService: TelemetryService,
    private cdr: ChangeDetectorRef,
    private location: Location,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.cargarSensores();
    this.cargarTelemetria();
    
    // Actualizar telemetría cada 5 segundos
    this.updateIntervalId = setInterval(() => {
      this.cargarTelemetria();
      this.cdr.markForCheck();
    }, 5000);
  }

  ngOnDestroy(): void {
    if (this.updateIntervalId) {
      clearInterval(this.updateIntervalId);
    }
  }

  cargarTelemetria(): void {
    this.telemetryService.getAll().pipe(
      finalize(() => this.cdr.markForCheck())
    ).subscribe({
      next: (telemetrias) => {
        console.log('📊 Sensores - Telemetria recibida:', telemetrias);
        this.telemetrias = telemetrias || [];

        // Agrupar telemetrías por panelId y tomar la más reciente
        this.telemetriaPorDispositivo.clear();
        const groupedByPanel = new Map<string, SolarTelemetry[]>();

        this.telemetrias.forEach((item) => {
          const key = item.panelId?.toString();
          if (key) {
            if (!groupedByPanel.has(key)) {
              groupedByPanel.set(key, []);
            }
            groupedByPanel.get(key)!.push(item);
          }
        });

        // Para cada panel/dispositivo, seleccionar la telemetría más reciente (última hora)
        groupedByPanel.forEach((telemetries, panelId) => {
          const sortedTelemetries = telemetries.sort((a, b) => {
            const timeA = a.timestamp ? new Date(a.timestamp).getTime() : 0;
            const timeB = b.timestamp ? new Date(b.timestamp).getTime() : 0;
            return timeB - timeA; // Más reciente primero
          });

          // Solo tomar telemetrías de la última hora
          const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
          const recentTelemetries = sortedTelemetries.filter(t =>
            t.timestamp && new Date(t.timestamp) > oneHourAgo
          );

          if (recentTelemetries.length > 0) {
            console.log(`🔗 Mapping panelId ${panelId} with latest telemetry:`, recentTelemetries[0]);
            this.telemetriaPorDispositivo.set(panelId, recentTelemetries[0]);
          }
        });

        this.sensoresFiltrados = this.getSensoresParaMostrar();
        this.cdr.markForCheck();
      },
      error: (error) => {
        console.error('❌ Error cargando telemetría de sensores:', error);
      }
    });
  }

  private obtenerLlavesSensor(sensor: Sensor): string[] {
    return [
      sensor.id_dispositivo?.toString(),
      sensor.id_sensor?.toString()
    ].filter(Boolean) as string[];
  }

  buscarTelemetriaSensor(sensor: Sensor): SolarTelemetry | undefined {
    const llaves = this.obtenerLlavesSensor(sensor);
    return llaves.map(llave => this.telemetriaPorDispositivo.get(llave)).find(Boolean);
  }

  private getSyntheticSensores(): Sensor[] {
    if (!this.telemetrias?.length) {
      return [];
    }

    const existingIds = new Set(
      this.sensores
        .map(sensor => sensor.id_dispositivo?.toString())
        .filter(Boolean) as string[]
    );

    return this.telemetrias
      .map(item => item.panelId)
      .filter((id): id is number | string => id != null)
      .map(id => id.toString())
      .filter(id => !existingIds.has(id))
      .map(id => ({
        id_sensor: Number(id) || 0,
        tipo_sensor: 'Fotoresistor IoT',
        descripcion: `Sensor del dispositivo ${id}`,
        unidad_medida: 'lux',
        id_dispositivo: Number(id) || 0,
        isSynthetic: true,
      } as Sensor & { isSynthetic: boolean }));
  }

  private getSensoresParaMostrar(): Sensor[] {
    return [...this.sensores, ...this.getSyntheticSensores()];
  }

  obtenerFechaTelemetria(sensor: Sensor): string {
    const telemetry = this.buscarTelemetriaSensor(sensor);
    return telemetry?.timestamp ? this.formatTimestamp(telemetry.timestamp) : 'N/A';
  }

  formatTimestamp(timestamp: string | undefined): string {
    if (!timestamp) {
      return 'N/A';
    }
    const date = new Date(timestamp);
    if (isNaN(date.getTime())) {
      return 'N/A';
    }
    const day = date.getDate().toString().padStart(2, '0');
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const year = date.getFullYear();
    const hours = date.getHours().toString().padStart(2, '0');
    const minutes = date.getMinutes().toString().padStart(2, '0');
    const seconds = date.getSeconds().toString().padStart(2, '0');
    return `${day}/${month}/${year} ${hours}:${minutes}:${seconds}`;
  }

  cargarSensores(): void {
    this.loading = true;
    this.sensorService.getAll().pipe(
      finalize(() => {
        this.loading = false;
        this.cdr.markForCheck();
      })
    ).subscribe({
      next: (sensores) => {
        this.sensores = sensores;
        this.sensoresFiltrados = this.getSensoresParaMostrar();
      },
      error: (error) => {
        console.error('Error loading sensores:', error);
      }
    });
  }

  volver(): void {
    this.location.back();
  }

  refrescar(): void {
    this.refreshing = true;
    this.sensorService.getAll().pipe(
      finalize(() => {
        this.refreshing = false;
        this.cdr.markForCheck();
      })
    ).subscribe({
      next: (sensores) => {
        this.sensores = sensores;
        this.sensoresFiltrados = this.getSensoresParaMostrar();
        this.cargarTelemetria();
      },
      error: (error) => {
        console.error('Error refreshing sensores:', error);
      }
    });
  }

  buscar(event: Event): void {
    const input = event.target as HTMLInputElement;
    this.searchTerm = input.value.toLowerCase().trim();

    this.sensoresFiltrados = this.getSensoresParaMostrar().filter(sensor =>
      sensor.tipo_sensor?.toLowerCase().includes(this.searchTerm) ||
      sensor.descripcion?.toLowerCase().includes(this.searchTerm) ||
      sensor.unidad_medida?.toLowerCase().includes(this.searchTerm) ||
      sensor.id_dispositivo?.toString().includes(this.searchTerm)
    );

    this.cdr.markForCheck();
  }

  cambiarVista(modo: 'grid' | 'table'): void {
    this.viewMode = modo;
    this.cdr.markForCheck();
  }

  abrirModalCrear(): void {
    this.modoEdicion = false;
    this.sensorSeleccionado = null;
    this.formData = { tipo_sensor: '', descripcion: '', unidad_medida: '', id_dispositivo: undefined };
    this.errorMessage = '';
    this.successMessage = '';
    this.modalVisible = true;
    this.cdr.markForCheck();
  }

  abrirModalEditar(sensor: Sensor): void {
    this.modoEdicion = true;
    this.sensorSeleccionado = sensor;

    this.formData = {
      tipo_sensor: sensor.tipo_sensor || '',
      descripcion: sensor.descripcion || '',
      unidad_medida: sensor.unidad_medida || '',
      id_dispositivo: sensor.id_dispositivo
    };

    this.errorMessage = '';
    this.successMessage = '';
    this.modalVisible = true;
    this.cdr.markForCheck();
  }

  cerrarModal(): void {
    if (this.saving) {
      return;
    }

    this.modalVisible = false;
    this.sensorSeleccionado = null;
    this.formData = { tipo_sensor: '', descripcion: '', unidad_medida: '', id_dispositivo: undefined };
    this.errorMessage = '';
    this.cdr.markForCheck();
  }

  guardarSensor(): void {
    this.errorMessage = '';
    this.successMessage = '';

    if (!this.formularioValido()) {
      this.errorMessage = 'Complete el campo obligatorio: tipo de sensor.';
      this.cdr.markForCheck();
      return;
    }

    this.saving = true;
    this.cdr.markForCheck();

    if (this.modoEdicion && this.sensorSeleccionado) {
      this.sensorService.update(this.sensorSeleccionado.id_sensor, this.formData).pipe(
        finalize(() => {
          this.saving = false;
          this.cdr.markForCheck();
        })
      ).subscribe({
        next: (updated) => {
          this.sensores = this.sensores.map(item => item.id_sensor === updated.id_sensor ? updated : item);
          this.sensoresFiltrados = [...this.sensores];
          this.successMessage = 'Sensor actualizado correctamente.';
          this.cerrarModal();
        },
        error: (error) => {
          console.error('Error actualizando sensor:', error);
          this.errorMessage = this.obtenerMensajeError(error);
        }
      });
    } else {
      this.sensorService.create(this.formData).pipe(
        finalize(() => {
          this.saving = false;
          this.cdr.markForCheck();
        })
      ).subscribe({
        next: (record) => {
          this.sensores.push(record);
          this.sensoresFiltrados = [...this.sensores];
          this.successMessage = 'Sensor creado correctamente.';
          this.cerrarModal();
        },
        error: (error) => {
          console.error('Error creando sensor:', error);
          this.errorMessage = this.obtenerMensajeError(error);
        }
      });
    }
  }

  eliminarSensor(sensor: Sensor): void {
    if (!confirm(`¿Desea eliminar el sensor "${sensor.tipo_sensor}"?`)) {
      return;
    }

    this.deletingId = sensor.id_sensor;
    this.errorMessage = '';
    this.successMessage = '';
    this.cdr.markForCheck();

    this.sensorService.eliminar(sensor.id_sensor).pipe(
      finalize(() => {
        this.deletingId = null;
        this.cdr.markForCheck();
      })
    ).subscribe({
      next: () => {
        this.sensores = this.sensores.filter(item => item.id_sensor !== sensor.id_sensor);
        this.sensoresFiltrados = [...this.sensores];
        this.successMessage = 'Sensor eliminado correctamente.';
      },
      error: (error) => {
        console.error('Error eliminando sensor:', error);
        this.errorMessage = this.obtenerMensajeError(error);
      }
    });
  }

  formularioValido(): boolean {
    return !!(this.formData.tipo_sensor && this.formData.tipo_sensor.trim());
  }

  private obtenerMensajeError(error: any): string {
    if (error.status === 0) {
      return 'No fue posible conectarse con el servidor. Verifique que el backend esté encendido.';
    }

    if (error.status === 400) {
      if (error.error?.non_field_errors?.length > 0) {
        return error.error.non_field_errors[0];
      }

      if (error.error?.detail) {
        return error.error.detail;
      }

      return 'Datos inválidos. Verifique la información ingresada.';
    }

    if (error.status === 500) {
      return 'Error interno del servidor. Revise la consola del backend.';
    }

    return 'Ocurrió un error. Intente nuevamente.';
  }

  volverAlDashboard(): void {
    this.router.navigate(['/dashboard']);
  }
}