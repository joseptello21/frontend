import {
  Component,
  OnInit,
  ChangeDetectionStrategy,
  ChangeDetectorRef
} from '@angular/core';
import { CommonModule, Location } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { finalize } from 'rxjs';

import { SensorService, Sensor, CreateSensor } from '../../core/services/sensor.service';

@Component({
  selector: 'app-sensores',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './sensores.html',
  styleUrl: './sensores.css',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class Sensores implements OnInit {

  sensores: Sensor[] = [];
  sensoresFiltrados: Sensor[] = [];

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

  constructor(
    private sensorService: SensorService,
    private cdr: ChangeDetectorRef,
    private location: Location
  ) {}

  ngOnInit(): void {
    this.cargarSensores();
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
        this.sensoresFiltrados = [...sensores];
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
        this.sensoresFiltrados = [...sensores];
      },
      error: (error) => {
        console.error('Error refreshing sensores:', error);
      }
    });
  }

  buscar(event: Event): void {
    const input = event.target as HTMLInputElement;
    this.searchTerm = input.value.toLowerCase().trim();

    this.sensoresFiltrados = this.sensores.filter(sensor =>
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
}