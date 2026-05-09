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

import { LuminariaService, Luminaria, CreateLuminaria } from '../../core/services/luminaria.service';
import { TelemetryService, SolarTelemetry } from '../../core/services/telemetry.service';

@Component({
  selector: 'app-luminarias',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './luminarias.html',
  styleUrl: './luminarias.css',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class Luminarias implements OnInit, OnDestroy {

  luminarias: Luminaria[] = [];
  luminariasFiltradas: Luminaria[] = [];
  telemetrias: SolarTelemetry[] = [];
  telemetriaPorLuminaria: Map<string, SolarTelemetry> = new Map();

  loading = false;
  refreshing = false;
  deletingId: number | null = null;
  successMessage = '';
  errorMessage = '';
  searchTerm = '';
  saving = false;

  modalVisible = false;
  modoEdicion = false;
  luminariaSeleccionada: Luminaria | null = null;
  formData: CreateLuminaria = { tipo_luminaria: '', potencia_watts: undefined, estado: 'activo', id_zona: undefined };
  viewMode: 'grid' | 'table' = 'table';
  private updateIntervalId: any;

  constructor(
    private luminariaService: LuminariaService,
    private telemetryService: TelemetryService,
    private cdr: ChangeDetectorRef,
    private location: Location,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.cargarLuminarias();
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
        this.telemetrias = telemetrias || [];
        this.telemetriaPorLuminaria.clear();
        this.telemetrias.forEach((item) => {
          const key = item.luminariaId?.toString();
          if (key) {
            this.telemetriaPorLuminaria.set(key, item);
          }
        });
        this.cdr.markForCheck();
      },
      error: (error) => {
        console.error('Error cargando telemetría de luminarias:', error);
      }
    });
  }

  private obtenerLlavesLuminaria(luminaria: Luminaria): string[] {
    return [
      luminaria.id_luminaria?.toString()
    ].filter(Boolean) as string[];
  }

  buscarTelemetriaLuminaria(luminaria: Luminaria): SolarTelemetry | undefined {
    const llaves = this.obtenerLlavesLuminaria(luminaria);
    return llaves.map(llave => this.telemetriaPorLuminaria.get(llave)).find(Boolean);
  }

  obtenerFechaTelemetria(luminaria: Luminaria): string {
    const telemetry = this.buscarTelemetriaLuminaria(luminaria);
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

  cargarLuminarias(): void {
    this.loading = true;
    this.luminariaService.getAll().pipe(
      finalize(() => {
        this.loading = false;
        this.cdr.markForCheck();
      })
    ).subscribe({
      next: (luminarias) => {
        this.luminarias = luminarias;
        this.luminariasFiltradas = [...luminarias];
      },
      error: (error) => {
        console.error('Error loading luminarias:', error);
      }
    });
  }

  volver(): void {
    this.location.back();
  }

  refrescar(): void {
    this.refreshing = true;
    this.luminariaService.getAll().pipe(
      finalize(() => {
        this.refreshing = false;
        this.cdr.markForCheck();
      })
    ).subscribe({
      next: (luminarias) => {
        this.luminarias = luminarias;
        this.luminariasFiltradas = [...luminarias];
        this.cargarTelemetria();
      },
      error: (error) => {
        console.error('Error refreshing luminarias:', error);
      }
    });
  }

  buscar(event: Event): void {
    const input = event.target as HTMLInputElement;
    this.searchTerm = input.value.toLowerCase().trim();

    this.luminariasFiltradas = this.luminarias.filter(luminaria =>
      luminaria.tipo_luminaria?.toLowerCase().includes(this.searchTerm) ||
      luminaria.estado?.toLowerCase().includes(this.searchTerm) ||
      luminaria.id_zona?.toString().includes(this.searchTerm)
    );

    this.cdr.markForCheck();
  }

  cambiarVista(modo: 'grid' | 'table'): void {
    this.viewMode = modo;
    this.cdr.markForCheck();
  }

  abrirModalCrear(): void {
    this.modoEdicion = false;
    this.luminariaSeleccionada = null;
    this.formData = { tipo_luminaria: '', potencia_watts: undefined, estado: 'activo', id_zona: undefined };
    this.errorMessage = '';
    this.successMessage = '';
    this.modalVisible = true;
    this.cdr.markForCheck();
  }

  abrirModalEditar(luminaria: Luminaria): void {
    this.modoEdicion = true;
    this.luminariaSeleccionada = luminaria;
    this.formData = { ...luminaria };
    this.errorMessage = '';
    this.successMessage = '';
    this.modalVisible = true;
    this.cdr.markForCheck();
  }

  cerrarModal(): void {
    this.modalVisible = false;
    this.luminariaSeleccionada = null;
    this.formData = {};
    this.errorMessage = '';
    this.cdr.markForCheck();
  }

  guardarLuminaria(): void {
    if (!this.formData.tipo_luminaria) {
      this.errorMessage = 'El tipo de luminaria es obligatorio.';
      return;
    }

    const payload: CreateLuminaria = {
      tipo_luminaria: this.formData.tipo_luminaria,
      potencia_watts: this.formData.potencia_watts,
      estado: this.formData.estado || 'activo',
      id_zona: this.formData.id_zona
    };

    if (this.modoEdicion && this.luminariaSeleccionada) {
      this.luminariaService.update(this.luminariaSeleccionada.id_luminaria, payload).pipe(
        finalize(() => this.cdr.markForCheck())
      ).subscribe({
        next: (updated) => {
          this.luminarias = this.luminarias.map(item => item.id_luminaria === updated.id_luminaria ? updated : item);
          this.luminariasFiltradas = [...this.luminarias];
          this.successMessage = 'Luminaria actualizada correctamente.';
          this.cerrarModal();
        },
        error: (error) => {
          console.error('Error actualizando luminaria:', error);
          this.errorMessage = 'No se pudo actualizar la luminaria.';
        }
      });
    } else {
      this.luminariaService.create(payload).pipe(
        finalize(() => this.cdr.markForCheck())
      ).subscribe({
        next: (created) => {
          this.luminarias.push(created);
          this.luminariasFiltradas = [...this.luminarias];
          this.successMessage = 'Luminaria creada correctamente.';
          this.cerrarModal();
        },
        error: (error) => {
          console.error('Error creando luminaria:', error);
          this.errorMessage = 'No se pudo crear la luminaria.';
        }
      });
    }
  }

  eliminarLuminaria(luminaria: Luminaria): void {
    const confirmar = confirm(`¿Desea eliminar la luminaria "${luminaria.tipo_luminaria}"?`);

    if (!confirmar) {
      return;
    }

    this.deletingId = luminaria.id_luminaria;
    this.cdr.markForCheck();

    this.luminariaService.eliminar(luminaria.id_luminaria).pipe(
      finalize(() => {
        this.deletingId = null;
        this.cdr.markForCheck();
      })
    ).subscribe({
      next: () => {
        this.luminarias = this.luminarias.filter(item => item.id_luminaria !== luminaria.id_luminaria);
        this.luminariasFiltradas = [...this.luminarias];
      },
      error: (error) => {
        console.error('Error deleting luminaria:', error);
        alert('Error al eliminar la luminaria');
      }
    });
  }

  formularioValido(): boolean {
    return !!(this.formData.tipo_luminaria?.trim());
  }

  volverAlDashboard(): void {
    this.router.navigate(['/dashboard']);
  }
}