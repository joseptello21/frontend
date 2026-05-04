import {
  Component,
  OnInit,
  ChangeDetectionStrategy,
  ChangeDetectorRef
} from '@angular/core';
import { CommonModule, Location } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { finalize } from 'rxjs';

import { Device } from '../../core/models/device.model';
import { DeviceService } from '../../core/services/device.service';

type ViewMode = 'grid' | 'table';

@Component({
  selector: 'app-dispositivos',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './dispositivos.html',
  styleUrl: './dispositivos.css',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class Dispositivos implements OnInit {

  dispositivos: Device[] = [];
  dispositivosFiltrados: Device[] = [];

  loading = false;
  refreshing = false;
  saving = false;
  deletingId: number | null = null;

  errorMessage = '';
  successMessage = '';

  searchTerm = '';
  filtroEstado = 'TODOS';
  viewMode: ViewMode = 'grid';

  modalVisible = false;
  modoEdicion = false;

  dispositivoSeleccionado: Device | null = null;

  dispositivoForm: Partial<Device> = this.obtenerFormularioInicial();

  constructor(
    private deviceService: DeviceService,
    private cdr: ChangeDetectorRef,
    private location: Location
  ) {}

  ngOnInit(): void {
    this.cargarDispositivos(true);
  }

  cargarDispositivos(primeraCarga = false): void {
    this.errorMessage = '';

    if (primeraCarga) {
      this.loading = true;
    } else {
      this.refreshing = true;
    }

    this.cdr.markForCheck();

    this.deviceService.listar()
      .pipe(
        finalize(() => {
          this.loading = false;
          this.refreshing = false;
          this.cdr.markForCheck();
        })
      )
      .subscribe({
        next: (data) => {
          this.dispositivos = data ?? [];
          this.aplicarFiltros();
        },
        error: (error) => {
          this.errorMessage = this.obtenerMensajeError(error);
        }
      });
  }

  aplicarFiltros(): void {
    const termino = this.searchTerm.toLowerCase().trim();

    this.dispositivosFiltrados = this.dispositivos.filter(dispositivo => {
      const coincideBusqueda = !termino || [
        dispositivo.name,
        dispositivo.location,
        dispositivo.status,
        dispositivo.mode,
        dispositivo.id.toString()
      ]
        .filter(Boolean)
        .join(' ')
        .toLowerCase()
        .includes(termino);

      const coincideEstado =
        this.filtroEstado === 'TODOS' ||
        this.normalizarTexto(dispositivo.status) === this.normalizarTexto(this.filtroEstado);

      return coincideBusqueda && coincideEstado;
    });

    this.cdr.markForCheck();
  }

  buscar(event: Event): void {
    const input = event.target as HTMLInputElement;
    this.searchTerm = input.value;
    this.aplicarFiltros();
  }

  cambiarFiltroEstado(estado: string): void {
    this.filtroEstado = estado;
    this.aplicarFiltros();
  }

  cambiarVista(modo: ViewMode): void {
    this.viewMode = modo;
    this.cdr.markForCheck();
  }

  limpiarFiltros(): void {
    this.searchTerm = '';
    this.filtroEstado = 'TODOS';
    this.aplicarFiltros();
  }

  abrirModalCrear(): void {
    this.modoEdicion = false;
    this.dispositivoSeleccionado = null;
    this.dispositivoForm = this.obtenerFormularioInicial();
    this.errorMessage = '';
    this.successMessage = '';
    this.modalVisible = true;
    this.cdr.markForCheck();
  }

  abrirModalEditar(dispositivo: Device): void {
    this.modoEdicion = true;
    this.dispositivoSeleccionado = dispositivo;

    this.dispositivoForm = {
      name: dispositivo.name || '',
      location: dispositivo.location || '',
      status: dispositivo.status || 'activo',
      mode: dispositivo.mode || 'normal'
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
    this.dispositivoSeleccionado = null;
    this.dispositivoForm = this.obtenerFormularioInicial();
    this.errorMessage = '';
    this.cdr.markForCheck();
  }

  guardarDispositivo(): void {
    this.errorMessage = '';
    this.successMessage = '';

    if (!this.formularioValido()) {
      this.errorMessage = 'Complete los campos obligatorios: identificador, nombre, tipo y zona.';
      this.cdr.markForCheck();
      return;
    }

    this.saving = true;
    this.cdr.markForCheck();

    if (this.modoEdicion && this.dispositivoSeleccionado) {
      this.actualizarDispositivo();
      return;
    }

    this.crearDispositivo();
  }

  private crearDispositivo(): void {
    this.deviceService.crear(this.dispositivoForm)
      .pipe(
        finalize(() => {
          this.saving = false;
          this.cdr.markForCheck();
        })
      )
      .subscribe({
        next: (nuevoDispositivo) => {
          this.dispositivos = [nuevoDispositivo, ...this.dispositivos];
          this.aplicarFiltros();
          this.successMessage = 'Dispositivo creado correctamente.';
          this.modalVisible = false;
          this.dispositivoForm = this.obtenerFormularioInicial();
        },
        error: (error) => {
          this.errorMessage = this.obtenerMensajeError(error);
        }
      });
  }

  private actualizarDispositivo(): void {
    if (!this.dispositivoSeleccionado) {
      return;
    }

    const id = this.dispositivoSeleccionado.id;

    this.deviceService.actualizar(id, this.dispositivoForm)
      .pipe(
        finalize(() => {
          this.saving = false;
          this.cdr.markForCheck();
        })
      )
      .subscribe({
        next: (dispositivoActualizado) => {
          this.dispositivos = this.dispositivos.map(dispositivo =>
            dispositivo.id === id ? dispositivoActualizado : dispositivo
          );

          this.aplicarFiltros();
          this.successMessage = 'Dispositivo actualizado correctamente.';
          this.modalVisible = false;
          this.dispositivoSeleccionado = null;
          this.dispositivoForm = this.obtenerFormularioInicial();
        },
        error: (error) => {
          this.errorMessage = this.obtenerMensajeError(error);
        }
      });
  }

  eliminarDispositivo(dispositivo: Device): void {
    const confirmar = confirm(`¿Desea eliminar el dispositivo "${dispositivo.name}"?`);

    if (!confirmar) {
      return;
    }

    this.deletingId = dispositivo.id;
    this.errorMessage = '';
    this.successMessage = '';
    this.cdr.markForCheck();

    this.deviceService.eliminar(dispositivo.id)
      .pipe(
        finalize(() => {
          this.deletingId = null;
          this.cdr.markForCheck();
        })
      )
      .subscribe({
        next: () => {
          this.dispositivos = this.dispositivos.filter(item => item.id !== dispositivo.id);
          this.aplicarFiltros();
          this.successMessage = 'Dispositivo eliminado correctamente.';
        },
        error: (error) => {
          this.errorMessage = this.obtenerMensajeError(error);
        }
      });
  }

  volver(): void {
    this.location.back();
  }

  refrescar(): void {
    this.cargarDispositivos(false);
  }

  formularioValido(): boolean {
    return !!(
      this.dispositivoForm.name &&
      this.dispositivoForm.status
    );
  }

  obtenerFormularioInicial(): Partial<Device> {
    return {
      name: '',
      location: '',
      status: 'activo',
      mode: 'normal'
    };
  }

  trackByDeviceId(index: number, dispositivo: Device): number {
    return dispositivo.id;
  }

  totalOnline(): number {
    return this.dispositivos.filter(d => d.status === 'activo').length;
  }

  totalOffline(): number {
    return this.dispositivos.filter(d =>
      d.status === 'inactivo' ||
      d.status === 'mantenimiento'
    ).length;
  }

  porcentajeOnline(): number {
    if (this.dispositivos.length === 0) {
      return 0;
    }

    return Math.round((this.totalOnline() / this.dispositivos.length) * 100);
  }

  estaOnline(dispositivo: Device): boolean {
    return dispositivo.status === 'activo';
  }

  estaActivo(estado?: string): boolean {
    const estadoNormalizado = this.normalizarTexto(estado);

    return estadoNormalizado === 'activo' ||
      estadoNormalizado === 'active' ||
      estadoNormalizado === 'online' ||
      estadoNormalizado === '1';
  }

  etiquetaEstado(estado?: string): string {
    const valor = this.normalizarTexto(estado);

    if (valor === 'online') {
      return 'Online';
    }

    if (valor === 'offline') {
      return 'Offline';
    }

    if (valor === 'maintenance') {
      return 'Mantenimiento';
    }

    if (valor === 'activo' || valor === 'active') {
      return 'Activo';
    }

    return estado || 'Sin estado';
  }

  private normalizarTexto(valor?: string | null): string {
    return (valor || '').toLowerCase().trim();
  }

  private obtenerMensajeError(error: any): string {
    if (error.status === 0) {
      return 'No fue posible conectarse con el servidor.';
    }

    if (error.status === 400 && error.error) {
      const errores = error.error;

      if (typeof errores === 'string') {
        return errores;
      }

      const primeraClave = Object.keys(errores)[0];

      if (primeraClave && Array.isArray(errores[primeraClave])) {
        return errores[primeraClave][0];
      }
    }

    if (error.status === 401) {
      return 'Su sesión no es válida. Inicie sesión nuevamente.';
    }

    if (error.status === 403) {
      return 'No tiene permisos para realizar esta acción.';
    }

    if (error.status === 404) {
      return 'El recurso solicitado no fue encontrado.';
    }

    return 'Ocurrió un error al procesar la solicitud.';
  }
}