import {
  Component,
  OnInit,
  ChangeDetectionStrategy,
  ChangeDetectorRef
} from '@angular/core';
import { CommonModule, Location } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { finalize } from 'rxjs';

import { LuminariaService, Luminaria, CreateLuminaria } from '../../core/services/luminaria.service';

@Component({
  selector: 'app-luminarias',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './luminarias.html',
  styleUrl: './luminarias.css',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class Luminarias implements OnInit {

  luminarias: Luminaria[] = [];
  luminariasFiltradas: Luminaria[] = [];

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

  constructor(
    private luminariaService: LuminariaService,
    private cdr: ChangeDetectorRef,
    private location: Location,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.cargarLuminarias();
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
        this.luminarias = luminarias.map(item => this.normalizeLuminaria(item));
        this.luminariasFiltradas = [...this.luminarias];
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
    this.formData = { tipo_luminaria: '', potencia_watts: undefined, estado: 'activo', id_zona: undefined };
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
      const luminariaId = this.getLuminariaId(this.luminariaSeleccionada);
      if (luminariaId === null) {
        this.errorMessage = 'No se identificó el ID de la luminaria para actualizar.';
        return;
      }

      this.luminariaService.update(luminariaId, payload).pipe(
        finalize(() => this.cdr.markForCheck())
      ).subscribe({
        next: (updated) => {
          const normalized = this.normalizeLuminaria(updated);
          this.luminarias = this.luminarias.map(item => this.getLuminariaId(item) === this.getLuminariaId(normalized) ? normalized : item);
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