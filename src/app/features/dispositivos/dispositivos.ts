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

import { Device } from '../../core/models/device.model';
import { DeviceService } from '../../core/services/device.service';
import { TelemetryService, SolarTelemetry } from '../../core/services/telemetry.service';
import { CommandService } from '../../core/services/command.service';

type ViewMode = 'grid' | 'table';

@Component({
  selector: 'app-dispositivos',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './dispositivos.html',
  styleUrl: './dispositivos.css',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class Dispositivos implements OnInit, OnDestroy {

  dispositivos: Device[] = [];
  dispositivosFiltrados: Device[] = [];
  telemetrias: SolarTelemetry[] = [];
  telemetriaPorPanel: Map<string, SolarTelemetry> = new Map();
  manualTelemetryOverrides: Map<string, SolarTelemetry> = new Map();

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
  private updateIntervalId: any;

  constructor(
    private deviceService: DeviceService,
    private telemetryService: TelemetryService,
    private commandService: CommandService,
    private cdr: ChangeDetectorRef,
    private location: Location,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.cargarDispositivos(true);
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
        console.log('📊 Dispositivos - Telemetria recibida:', telemetrias);
        this.telemetrias = telemetrias || [];

        const fetchedMap = new Map<string, SolarTelemetry>();
        this.telemetrias.forEach((item) => {
          const key = item.panelId?.toString();
          if (key) {
            console.log(`🔗 Mapping panelId ${key}:`, item);
            fetchedMap.set(key, item);
          }
        });

        this.manualTelemetryOverrides.forEach((override, panelId) => {
          fetchedMap.set(panelId, override);
        });

        this.telemetriaPorPanel = fetchedMap;
        this.aplicarFiltros();
      },
      error: (error) => {
        console.error('❌ Error cargando telemetría de dispositivos:', error);
      }
    });
  }

  private obtenerLlavesDispositivo(dispositivo: Device): string[] {
    return [
      dispositivo.id?.toString(),
      dispositivo.device_id?.toString(),
      dispositivo.id_device?.toString()
    ].filter(Boolean) as string[];
  }

  buscarTelemetriaDispositivo(dispositivo: Device): SolarTelemetry | undefined {
    const llaves = this.obtenerLlavesDispositivo(dispositivo);
    return llaves.map(llave => this.telemetriaPorPanel.get(llave)).find(Boolean);
  }

  private obtenerIdentificadorDispositivo(dispositivo: Device): string | undefined {
    return dispositivo.id?.toString() || dispositivo.device_id?.toString() || dispositivo.id_device?.toString();
  }

  private getSyntheticDispositivos(): Device[] {
    if (!this.telemetrias?.length) {
      return [];
    }

    const existingIds = new Set(
      this.dispositivos
        .map(device => this.obtenerIdentificadorDispositivo(device))
        .filter(Boolean) as string[]
    );

    return this.telemetrias
      .map(telemetria => telemetria.panelId)
      .filter((id): id is number | string => id != null)
      .map(id => id.toString())
      .filter(id => !existingIds.has(id))
      .map(id => {
        const telemetry = this.telemetriaPorPanel.get(id);
        return {
          id: Number(id) || 0,
          id_device: Number(id) || undefined,
          device_id: `panel-solar-${id}`,
          name: `Panel Solar ${id}`,
          location: `Panel Solar`,
          status: telemetry?.lamp ? 'activo' : 'inactivo',
          mode: telemetry?.autoMode ? 'automatico' : 'manual',
          last_seen: telemetry?.timestamp ?? undefined,
          isSynthetic: true,
        } as Device & { isSynthetic: boolean };
      });
  }

  private obtenerDispositivosCompletos(): Device[] {
    return [...this.dispositivos, ...this.getSyntheticDispositivos()];
  }

  isManualMode(dispositivo: Device): boolean {
    return this.normalizarTexto(dispositivo.mode) === 'manual';
  }

  setDeviceMode(dispositivo: Device, modo: 'manual' | 'automatico'): void {
    dispositivo.mode = modo;

    const deviceId = this.obtenerIdentificadorDispositivo(dispositivo);
    if (deviceId) {
      this.commandService.setDeviceMode(Number(deviceId), modo).subscribe({
        next: (response) => {
          console.log('✅ Comando de modo enviado:', response);
          this.successMessage = `Modo cambiado a ${modo} exitosamente`;
          setTimeout(() => this.successMessage = '', 3000);

          // Actualizar telemetría local
          const telemetry = this.buscarTelemetriaDispositivo(dispositivo);
          if (telemetry) {
            const updatedTelemetry: SolarTelemetry = {
              ...telemetry,
              manualStatus: modo === 'manual',
              autoMode: modo === 'automatico',
              timestamp: new Date().toISOString()
            };
            this.updateTelemetryForDevice(dispositivo, updatedTelemetry);

            const key = this.obtenerIdentificadorDispositivo(dispositivo);
            if (key) {
              if (modo === 'manual') {
                this.manualTelemetryOverrides.set(key, updatedTelemetry);
              } else {
                this.manualTelemetryOverrides.delete(key);
              }
            }
          }
        },
        error: (error) => {
          console.error('❌ Error enviando comando de modo:', error);
          this.errorMessage = 'Error al cambiar modo del dispositivo';
          setTimeout(() => this.errorMessage = '', 3000);
          // Revertir cambio en caso de error
          dispositivo.mode = modo === 'manual' ? 'automatico' : 'manual';
        }
      });
    }

    this.aplicarFiltros();
    this.cdr.markForCheck();
  }

  toggleDeviceLamp(dispositivo: Device): void {
    if (!this.isManualMode(dispositivo)) {
      this.setDeviceMode(dispositivo, 'manual');
      return;
    }

    const telemetry = this.buscarTelemetriaDispositivo(dispositivo);
    const newState = !(telemetry?.lamp ?? false);

    const deviceId = this.obtenerIdentificadorDispositivo(dispositivo);
    if (deviceId) {
      this.commandService.setManualLamp(Number(deviceId), newState).subscribe({
        next: (response) => {
          console.log('✅ Comando de lámpara enviado:', response);

          // Actualizar telemetría local inmediatamente
          const updatedTelemetry: SolarTelemetry = {
            ...telemetry,
            lamp: newState,
            manualStatus: true,
            autoMode: false,
            timestamp: new Date().toISOString()
          };

          this.updateTelemetryForDevice(dispositivo, updatedTelemetry);

          const key = this.obtenerIdentificadorDispositivo(dispositivo);
          if (key) {
            this.manualTelemetryOverrides.set(key, updatedTelemetry);
          }

          dispositivo.status = newState ? 'activo' : 'inactivo';

          this.successMessage = `Lámpara ${newState ? 'encendida' : 'apagada'} exitosamente`;
          setTimeout(() => this.successMessage = '', 3000);
        },
        error: (error) => {
          console.error('❌ Error enviando comando de lámpara:', error);
          this.errorMessage = 'Error al controlar la lámpara';
          setTimeout(() => this.errorMessage = '', 3000);
        }
      });
    }

    this.cdr.markForCheck();
  }

  getManualLampLabel(dispositivo: Device): string {
    const telemetry = this.buscarTelemetriaDispositivo(dispositivo);
    if (!telemetry) {
      return 'Control manual';
    }
    return telemetry.lamp ? 'Apagar lámpara' : 'Encender lámpara';
  }

  private updateTelemetryForDevice(dispositivo: Device, telemetry: SolarTelemetry): void {
    const key = this.obtenerIdentificadorDispositivo(dispositivo);
    if (key) {
      this.telemetriaPorPanel.set(key, telemetry);
    }

    this.telemetrias = [
      telemetry,
      ...this.telemetrias.filter(item => item.id !== telemetry.id)
    ];
  }

  get totalDevicesCount(): number {
    return this.obtenerDispositivosCompletos().length;
  }

  private getDispositivosParaMostrar(): Device[] {
    return this.obtenerDispositivosCompletos();
  }

  obtenerFechaTelemetria(dispositivo: Device): string {
    const telemetry = this.buscarTelemetriaDispositivo(dispositivo);
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
    const dispositivos = this.getDispositivosParaMostrar();

    this.dispositivosFiltrados = dispositivos.filter(dispositivo => {
      const coincideBusqueda = !termino || [
        dispositivo.name,
        dispositivo.location,
        dispositivo.status,
        dispositivo.mode,
        dispositivo.device_id,
        dispositivo.id_device?.toString(),
        dispositivo.id?.toString()
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
      status: this.convertirEstadoBackend(dispositivo.status),
      mode: this.convertirModoBackend(dispositivo.mode)
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

  volverAlDashboard(): void {
    this.router.navigate(['/dashboard']);
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
      mode: 'automatico'
    };
  }

  convertirEstadoBackend(estado?: string): string {
    const valor = this.normalizarTexto(estado);

    if (valor === 'inactivo' || valor === 'mantenimiento') {
      return 'inactivo';
    }

    return 'activo';
  }

  convertirModoBackend(modo?: string): string {
    const valor = this.normalizarTexto(modo);

    if (valor === 'manual' || valor === 'debug' || valor === 'test') {
      return 'manual';
    }

    return 'automatico';
  }

  etiquetaModo(modo?: string): string {
    const valor = this.normalizarTexto(modo);

    if (valor === 'manual') {
      return 'Manual';
    }

    if (valor === 'automatico') {
      return 'Automático';
    }

    return modo || 'Automático';
  }

  trackByDeviceId(index: number, dispositivo: Device): string | number {
    return dispositivo.id ?? dispositivo.id_device ?? dispositivo.device_id ?? 0;
  }

  totalOnline(): number {
    return this.obtenerDispositivosCompletos().filter(d => d.status === 'activo').length;
  }

  totalOffline(): number {
    return this.obtenerDispositivosCompletos().filter(d =>
      d.status === 'inactivo' ||
      d.status === 'mantenimiento'
    ).length;
  }

  porcentajeOnline(): number {
    const dispositivos = this.obtenerDispositivosCompletos();
    if (dispositivos.length === 0) {
      return 0;
    }

    return Math.round((this.totalOnline() / dispositivos.length) * 100);
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