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

import { BateriaService, Bateria } from '../../core/services/bateria.service';

@Component({
  selector: 'app-baterias',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './baterias.html',
  styleUrl: './baterias.css',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class Baterias implements OnInit {

  baterias: Bateria[] = [];
  bateriasFiltradas: Bateria[] = [];

  loading = false;
  refreshing = false;
  deletingId: number | null = null;
  successMessage = '';
  errorMessage = '';
  searchTerm = '';
  saving = false;
  modalVisible = false;
  modoEdicion = false;
  bateriaSeleccionada: Bateria | null = null;
  formData: any = { capacidad_ah: undefined, voltaje: undefined, estado: 'activo', id_panel: undefined };
  viewMode: 'grid' | 'table' = 'table';

  constructor(
    private bateriaService: BateriaService,
    private cdr: ChangeDetectorRef,
    private location: Location,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.cargarBaterias();
  }

  cargarBaterias(): void {
    this.loading = true;
    this.bateriaService.getAll().pipe(
      finalize(() => {
        this.loading = false;
        this.cdr.markForCheck();
      })
    ).subscribe({
      next: (baterias) => {
        this.baterias = baterias;
        this.bateriasFiltradas = [...baterias];
      },
      error: (error) => {
        console.error('Error loading baterias:', error);
      }
    });
  }

  volver(): void {
    this.location.back();
  }

  refrescar(): void {
    this.refreshing = true;
    this.bateriaService.getAll().pipe(
      finalize(() => {
        this.refreshing = false;
        this.cdr.markForCheck();
      })
    ).subscribe({
      next: (baterias) => {
        this.baterias = baterias;
        this.bateriasFiltradas = [...baterias];
      },
      error: (error) => {
        console.error('Error refreshing baterias:', error);
      }
    });
  }

  buscar(event: Event): void {
    const input = event.target as HTMLInputElement;
    this.searchTerm = input.value.toLowerCase().trim();

    this.bateriasFiltradas = this.baterias.filter(bateria =>
      bateria.capacidad_ah?.toString().includes(this.searchTerm) ||
      bateria.voltaje?.toString().includes(this.searchTerm) ||
      bateria.estado?.toLowerCase().includes(this.searchTerm) ||
      bateria.id_panel?.toString().includes(this.searchTerm)
    );

    this.cdr.markForCheck();
  }

  cambiarVista(modo: 'grid' | 'table'): void {
    this.viewMode = modo;
    this.cdr.markForCheck();
  }

  abrirModalCrear(): void {
    this.modoEdicion = false;
    this.bateriaSeleccionada = null;
    this.formData = { capacidad_ah: undefined, voltaje: undefined, estado: 'activo', id_panel: undefined };
    this.errorMessage = '';
    this.successMessage = '';
    this.modalVisible = true;
    this.cdr.markForCheck();
  }

  abrirModalEditar(bateria: Bateria): void {
    this.modoEdicion = true;
    this.bateriaSeleccionada = bateria;

    this.formData = {
      capacidad_ah: bateria.capacidad_ah,
      voltaje: bateria.voltaje,
      estado: bateria.estado || 'activo',
      id_panel: bateria.id_panel
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
    this.bateriaSeleccionada = null;
    this.formData = { capacidad_ah: undefined, voltaje: undefined, estado: 'activo', id_panel: undefined };
    this.errorMessage = '';
    this.cdr.markForCheck();
  }

  guardarBateria(): void {
    this.errorMessage = '';
    this.successMessage = '';

    if (!this.formularioValido()) {
      this.errorMessage = 'Complete el campo obligatorio: capacidad (Ah).';
      this.cdr.markForCheck();
      return;
    }

    this.saving = true;
    this.cdr.markForCheck();

    if (this.modoEdicion && this.bateriaSeleccionada) {
      this.bateriaService.update(this.bateriaSeleccionada.id_bateria, this.formData).pipe(
        finalize(() => {
          this.saving = false;
          this.cdr.markForCheck();
        })
      ).subscribe({
        next: (updated) => {
          this.baterias = this.baterias.map(item => item.id_bateria === updated.id_bateria ? updated : item);
          this.bateriasFiltradas = [...this.baterias];
          this.successMessage = 'Batería actualizada correctamente.';
          this.cerrarModal();
        },
        error: (error) => {
          console.error('Error actualizando batería:', error);
          this.errorMessage = this.obtenerMensajeError(error);
        }
      });
    } else {
      this.bateriaService.create(this.formData).pipe(
        finalize(() => {
          this.saving = false;
          this.cdr.markForCheck();
        })
      ).subscribe({
        next: (record) => {
          this.baterias.push(record);
          this.bateriasFiltradas = [...this.baterias];
          this.successMessage = 'Batería creada correctamente.';
          this.cerrarModal();
        },
        error: (error) => {
          console.error('Error creando batería:', error);
          this.errorMessage = this.obtenerMensajeError(error);
        }
      });
    }
  }

  eliminarBateria(bateria: Bateria): void {
    if (!confirm(`¿Desea eliminar la batería con capacidad ${bateria.capacidad_ah}Ah?`)) {
      return;
    }

    this.deletingId = bateria.id_bateria;
    this.errorMessage = '';
    this.successMessage = '';
    this.cdr.markForCheck();

    this.bateriaService.eliminar(bateria.id_bateria).pipe(
      finalize(() => {
        this.deletingId = null;
        this.cdr.markForCheck();
      })
    ).subscribe({
      next: () => {
        this.baterias = this.baterias.filter(item => item.id_bateria !== bateria.id_bateria);
        this.bateriasFiltradas = [...this.baterias];
        this.successMessage = 'Batería eliminada correctamente.';
      },
      error: (error) => {
        console.error('Error eliminando batería:', error);
        this.errorMessage = this.obtenerMensajeError(error);
      }
    });
  }

  formularioValido(): boolean {
    return !!(this.formData.capacidad_ah && this.formData.capacidad_ah > 0);
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