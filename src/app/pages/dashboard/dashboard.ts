import { Component, computed, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../../core/services/auth';
import { UsuarioService, CreateUsuario } from '../../core/services/usuario.service';
import { Usuario } from '../../core/models/usuario.model';
import { DeviceService, CreateDevice } from '../../core/services/device.service';
import { Device } from '../../core/models/device.model';
import { SensorService, Sensor, CreateSensor } from '../../core/services/sensor.service';
import { AlertaService, Alerta } from '../../core/services/alerta.service';
import { LuminariaService, Luminaria, CreateLuminaria } from '../../core/services/luminaria.service';
import { BateriaService, Bateria, CreateBateria } from '../../core/services/bateria.service';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './dashboard.html',
  styleUrl: './dashboard.css',
})
export class Dashboard implements OnInit {
  user = computed(() => this.authService.currentUser());

  stats = signal([
    { label: 'Usuarios', value: '0', icon: '👥' },
    { label: 'Dispositivos', value: '0', icon: '📱' },
    { label: 'Sensores', value: '0', icon: '📊' },
    { label: 'Alertas', value: '0', icon: '⚠️' },
    { label: 'Luminarias', value: '0', icon: '💡' },
    { label: 'Baterías', value: '0', icon: '🔋' },
  ]);

  usuarios = signal<Usuario[]>([]);
  dispositivos = signal<Device[]>([]);
  sensores = signal<Sensor[]>([]);
  alertas = signal<Alerta[]>([]);
  luminarias = signal<Luminaria[]>([]);
  baterias = signal<Bateria[]>([]);

  showUsuarioForm = signal(false);
  showDeviceForm = signal(false);
  showSensorForm = signal(false);
  showLuminariaForm = signal(false);
  showBateriaForm = signal(false);

  usuarioForm: CreateUsuario = { email: '', password: '', nombre: '' };
  deviceForm: CreateDevice = { name: '', location: '', status: 'activo', mode: 'automatico' };
  sensorForm: CreateSensor = { tipo_sensor: '', descripcion: '', id_dispositivo: undefined, unidad_medida: '' };
  luminariaForm: CreateLuminaria = { tipo_luminaria: '', potencia_watts: undefined, estado: '', id_zona: undefined };
  bateriaForm: CreateBateria = { capacidad_ah: 0, voltaje: 0, estado: '', id_panel: undefined };

  editingUsuarioId: number | null = null;
  editingDeviceId: number | null = null;
  editingSensorId: number | null = null;

  message = '';

  // Métodos computados para métricas del sistema
  dispositivosActivos = computed(() => {
    return this.dispositivos().filter(d => d.status === 'activo' || d.estado === 'activo').length;
  });

  dispositivosInactivos = computed(() => {
    return this.dispositivos().filter(d => d.status === 'inactivo' || d.estado === 'inactivo').length;
  });

  sensoresPorTipo = computed(() => {
    const tipos = new Set(this.sensores().map(s => s.tipo_sensor));
    return Array.from(tipos);
  });

  luminariasActivas = computed(() => {
    return this.luminarias().filter(l => l.estado === 'activo').length;
  });

  potenciaTotalLuminarias = computed(() => {
    return this.luminarias().reduce((total, l) => total + (l.potencia_watts || 0), 0);
  });

  bateriasActivas = computed(() => {
    return this.baterias().filter(b => b.estado === 'activo').length;
  });

  capacidadTotalBaterias = computed(() => {
    return this.baterias().reduce((total, b) => total + (b.capacidad_ah || 0), 0);
  });

  actividadesRecientes = computed(() => {
    const activities = [];

    // Agregar actividades basadas en datos reales
    const dispositivos = this.dispositivos();
    const sensores = this.sensores();
    const luminarias = this.luminarias();
    const baterias = this.baterias();
    const alertas = this.alertas();

    // Sistema iniciado
    activities.push({
      id: 'system-start',
      type: 'info',
      icon: '🚀',
      iconClass: 'fa-solid fa-rocket',
      message: 'Sistema iniciado correctamente',
      time: 'Hace 5 min'
    });

    // Nuevos registros recientes
    if (dispositivos.length > 0) {
      activities.push({
        id: 'new-device',
        type: 'success',
        icon: '📱',
        iconClass: 'fa-solid fa-mobile-screen-button',
        message: `Nuevo dispositivo registrado: ${dispositivos[dispositivos.length - 1]?.name || 'Dispositivo'}`,
        time: 'Hace 1 hora'
      });
    }

    if (sensores.length > 0) {
      activities.push({
        id: 'new-sensor',
        type: 'success',
        icon: '📊',
        iconClass: 'fa-solid fa-chart-line',
        message: `Nuevo sensor configurado: ${sensores[sensores.length - 1]?.tipo_sensor || 'Sensor'}`,
        time: 'Hace 2 horas'
      });
    }

    // Alertas activas
    if (alertas.length > 0) {
      activities.push({
        id: 'active-alert',
        type: 'warning',
        icon: '⚠️',
        iconClass: 'fa-solid fa-triangle-exclamation',
        message: `${alertas.length} alerta(s) registrada(s) en el sistema`,
        time: 'Hace 30 min'
      });
    }

    // Estado de baterías
    const bateriasBajas = baterias.filter(b => (b.capacidad_ah || 0) < 50);
    if (bateriasBajas.length > 0) {
      activities.push({
        id: 'low-battery',
        type: 'warning',
        icon: '🔋',
        iconClass: 'fa-solid fa-battery-quarter',
        message: `${bateriasBajas.length} batería(s) con capacidad baja`,
        time: 'Hace 3 horas'
      });
    }

    // Luminarias activas
    if (luminarias.length > 0) {
      activities.push({
        id: 'lighting-status',
        type: 'info',
        icon: '💡',
        iconClass: 'fa-solid fa-lightbulb',
        message: `${this.luminariasActivas()} de ${luminarias.length} luminarias activas`,
        time: 'Hace 4 horas'
      });
    }

    return activities.slice(0, 6); // Mostrar máximo 6 actividades
  });

  constructor(
    private authService: AuthService,
    private usuarioService: UsuarioService,
    private deviceService: DeviceService,
    private sensorService: SensorService,
    private alertaService: AlertaService,
    private luminariaService: LuminariaService,
    private bateriaService: BateriaService
  ) {}

  ngOnInit() {
    this.refreshAll();
  }

  refreshAll() {
    this.loadUsuarios();
    this.loadDevices();
    this.loadSensors();
    this.loadAlertas();
    this.loadLuminarias();
    this.loadBaterias();
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

  loadUsuarios() {
    this.usuarioService.getAll().subscribe({
      next: (data) => {
        const usuarios = this.normalizeArrayResponse<Usuario>(data, ['usuarios', 'users']);
        this.usuarios.set(usuarios);
        this.updateStat('Usuarios', usuarios.length.toString());
      },
      error: (err) => {
        console.error('Error loading usuarios:', err);
        this.updateStat('Usuarios', 'Error');
      },
    });
  }

  loadDevices() {
    this.deviceService.getAll().subscribe({
      next: (data) => {
        const devices = this.normalizeArrayResponse<Device>(data, ['devices', 'dispositivos', 'items', 'data']);
        this.dispositivos.set(devices);
        this.updateStat('Dispositivos', devices.length.toString());
      },
      error: (err) => {
        console.error('Error loading devices:', err);
        this.updateStat('Dispositivos', 'Error');
      },
    });
  }

  loadSensors() {
    this.sensorService.getAll().subscribe({
      next: (data) => {
        const sensors = this.normalizeArrayResponse<Sensor>(data, ['sensores', 'sensors', 'items', 'data']);
        this.sensores.set(sensors);
        this.updateStat('Sensores', sensors.length.toString());
      },
      error: (err) => {
        console.error('Error loading sensors:', err);
        this.updateStat('Sensores', 'Error');
      },
    });
  }

  loadAlertas() {
    this.alertaService.getAll().subscribe({
      next: (data) => {
        const alertas = this.normalizeArrayResponse<Alerta>(data, ['alertas', 'alerts']);
        this.alertas.set(alertas);
        this.updateStat('Alertas', alertas.length.toString());
      },
      error: (err) => {
        console.error('Error loading alertas:', err);
        this.updateStat('Alertas', 'Error');
      },
    });
  }

  loadLuminarias() {
    this.luminariaService.getAll().subscribe({
      next: (data) => {
        const luminarias = this.normalizeArrayResponse<Luminaria>(data, ['luminarias', 'luminaria', 'items', 'data']);
        this.luminarias.set(luminarias);
        this.updateStat('Luminarias', luminarias.length.toString());
      },
      error: (err) => {
        console.error('Error loading luminarias:', err);
        this.updateStat('Luminarias', 'Error');
      },
    });
  }

  loadBaterias() {
    this.bateriaService.getAll().subscribe({
      next: (data) => {
        const baterias = this.normalizeArrayResponse<Bateria>(data, ['baterias', 'bateria', 'items', 'data']);
        this.baterias.set(baterias);
        this.updateStat('Baterías', baterias.length.toString());
      },
      error: (err) => {
        console.error('Error loading baterias:', err);
        this.updateStat('Baterías', 'Error');
      },
    });
  }

  updateStat(label: string, value: string) {
    this.stats.update((items) =>
      items.map((item) => (item.label === label ? { ...item, value } : item))
    );
  }

  startUsuarioCreate() {
    this.editingUsuarioId = null;
    this.usuarioForm = { email: '', password: '', nombre: '' };
    this.showUsuarioForm.set(true);
  }

  startDeviceCreate() {
    this.editingDeviceId = null;
    this.deviceForm = { name: '', location: '', status: 'activo', mode: 'automatico' };
    this.showDeviceForm.set(true);
  }

  startSensorCreate() {
    this.editingSensorId = null;
    this.sensorForm = { tipo_sensor: '', descripcion: '', id_dispositivo: undefined, unidad_medida: '' };
    this.showSensorForm.set(true);
  }

  startLuminariaCreate() {
    this.luminariaForm = { tipo_luminaria: '', potencia_watts: undefined, estado: '', id_zona: undefined };
    this.showLuminariaForm.set(true);
  }

  startBateriaCreate() {
    this.bateriaForm = { capacidad_ah: 0, voltaje: 0, estado: '', id_panel: undefined };
    this.showBateriaForm.set(true);
  }

  editUsuario(usuario: Usuario) {
    this.editingUsuarioId = usuario.idusuarios;
    this.usuarioForm = {
      email: usuario.email ?? '',
      password: '',
      nombre: usuario.nombre || '',
    };
    this.showUsuarioForm.set(true);
  }

  cancelUsuario() {
    this.showUsuarioForm.set(false);
    this.editingUsuarioId = null;
    this.usuarioForm = { email: '', password: '', nombre: '' };
  }

  saveUsuario() {
    const form = this.usuarioForm;
    if (this.editingUsuarioId !== null) {
      this.usuarioService.update(this.editingUsuarioId, { email: form.email, password: form.password || undefined, nombre: form.nombre }).subscribe({
        next: () => {
          this.loadUsuarios();
          this.cancelUsuario();
          this.message = 'Usuario actualizado correctamente.';
        },
        error: () => this.message = 'No se pudo actualizar el usuario.',
      });
    } else {
      this.usuarioService.create(form).subscribe({
        next: () => {
          this.loadUsuarios();
          this.cancelUsuario();
          this.message = 'Usuario creado correctamente.';
        },
        error: () => this.message = 'No se pudo crear el usuario.',
      });
    }
  }

  deleteUsuario(id: number) {
    if (!confirm('¿Eliminar este usuario?')) {
      return;
    }
    this.usuarioService.delete(id).subscribe({
      next: () => {
        this.loadUsuarios();
        this.message = 'Usuario eliminado.';
      },
      error: () => this.message = 'No se pudo eliminar el usuario.',
    });
  }

  saveDevice() {
    const form = this.deviceForm;
    if (this.editingDeviceId !== null) {
      this.deviceService.update(this.editingDeviceId, form).subscribe({
        next: () => {
          this.loadDevices();
          this.showDeviceForm.set(false);
          this.message = 'Dispositivo actualizado correctamente.';
        },
        error: () => this.message = 'No se pudo actualizar el dispositivo.',
      });
    } else {
      this.deviceService.create(form).subscribe({
        next: () => {
          this.loadDevices();
          this.showDeviceForm.set(false);
          this.message = 'Dispositivo creado correctamente.';
        },
        error: (error) => this.message = `Error creando dispositivo: ${error.error?.message || error.message || 'Desconocido'}`,
      });
    }
  }

  getDeviceId(device: Device): number | null {
    return device.id ?? device.id_device ?? null;
  }

  editDevice(device: Device) {
    this.editingDeviceId = this.getDeviceId(device);
    this.deviceForm = {
      name: device.name ?? device.nombre ?? '',
      location: device.location ?? device.ubicacion ?? '',
      status: (device.status ?? device.estado ?? 'activo') as 'activo' | 'inactivo',
      mode: (device.mode ?? device.modo ?? 'automatico') as 'automatico' | 'manual',
    };
    this.showDeviceForm.set(true);
  }

  deleteDevice(id: number) {
    if (!confirm('¿Eliminar este dispositivo?')) {
      return;
    }
    this.deviceService.delete(id).subscribe({
      next: () => {
        this.loadDevices();
        this.message = 'Dispositivo eliminado.';
      },
      error: () => this.message = 'No se pudo eliminar el dispositivo.',
    });
  }

  saveSensor() {
    const form = this.sensorForm;
    if (this.editingSensorId !== null) {
      this.sensorService.update(this.editingSensorId, form).subscribe({
        next: () => {
          this.loadSensors();
          this.showSensorForm.set(false);
          this.message = 'Sensor actualizado correctamente.';
        },
        error: () => this.message = 'No se pudo actualizar el sensor.',
      });
    } else {
      this.sensorService.create(form).subscribe({
        next: () => {
          this.loadSensors();
          this.showSensorForm.set(false);
          this.message = 'Sensor creado correctamente.';
        },
        error: (error) => this.message = `Error creando sensor: ${error.error?.message || error.message || 'Desconocido'}`,
      });
    }
  }

  editSensor(sensor: Sensor) {
    this.editingSensorId = sensor.id_sensor ?? null;
    this.sensorForm = {
      tipo_sensor: sensor.tipo_sensor,
      descripcion: sensor.descripcion || '',
      id_dispositivo: sensor.id_dispositivo,
      unidad_medida: sensor.unidad_medida || '',
    };
    this.showSensorForm.set(true);
  }

  deleteSensor(id: number) {
    if (!confirm('¿Eliminar este sensor?')) {
      return;
    }
    this.sensorService.delete(id).subscribe({
      next: () => {
        this.loadSensors();
        this.message = 'Sensor eliminado.';
      },
      error: () => this.message = 'No se pudo eliminar el sensor.',
    });
  }

  saveLuminaria() {
    this.luminariaService.create(this.luminariaForm).subscribe({
      next: () => {
        this.loadLuminarias();
        this.showLuminariaForm.set(false);
        this.message = 'Luminaria creada correctamente.';
      },
      error: (error) => this.message = `Error creando luminaria: ${error.error?.message || error.message || 'Desconocido'}`,
    });
  }

  saveBateria() {
    this.bateriaService.create(this.bateriaForm).subscribe({
      next: () => {
        this.loadBaterias();
        this.showBateriaForm.set(false);
        this.message = 'Batería creada correctamente.';
      },
      error: (error) => this.message = `Error creando batería: ${error.error?.message || error.message || 'Desconocido'}`,
    });
  }

  cancelAction() {
    this.showUsuarioForm.set(false);
    this.showDeviceForm.set(false);
    this.showSensorForm.set(false);
    this.showLuminariaForm.set(false);
    this.showBateriaForm.set(false);
    this.editingUsuarioId = null;
    this.editingDeviceId = null;
    this.editingSensorId = null;
  }

  logout() {
    this.authService.logout();
  }
}
