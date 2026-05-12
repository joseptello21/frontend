import {
  Component,
  OnInit,
  ChangeDetectionStrategy,
  ChangeDetectorRef
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { finalize, forkJoin, of, switchMap, tap, catchError } from 'rxjs';

import { Rol } from '../../core/models/rol.model';
import { Recurso } from '../../core/models/recurso.model';
import { Usuario } from '../../core/models/usuario.model';
import { UsuarioRol } from '../../core/models/usuario-rol.model';
import { RolRecurso } from '../../core/models/rol-recurso.model';

import { RolService } from '../../core/services/rol.service';
import { RecursoService } from '../../core/services/recurso.service';
import { UsuarioService } from '../../core/services/usuario.service';
import { UsuarioRolService } from '../../core/services/usuario-rol.service';
import { RolRecursoService } from '../../core/services/rol-recurso.service';

type TabVista = 'roles' | 'recursos' | 'usuariosRoles' | 'permisos';
type EstadoFiltro = 'TODOS' | 'ACTIVO' | 'INACTIVO';

@Component({
  selector: 'app-roles',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './roles.html',
  styleUrl: './roles.css',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class RolesComponent implements OnInit {

  // Variable para controlar si se deben inicializar roles base
  private inicializarRolesBase = true;

  tabActiva: TabVista = 'roles';

  roles: Rol[] = [];
  recursos: Recurso[] = [];
  usuarios: Usuario[] = [];
  usuariosRoles: UsuarioRol[] = [];
  rolesRecursos: RolRecurso[] = [];

  rolesFiltrados: Rol[] = [];
  recursosFiltrados: Recurso[] = [];
  usuariosFiltrados: Usuario[] = [];

  loading = false;
  refreshing = false;
  saving = false;

  deletingRolId: number | null = null;
  deletingRecursoId: number | null = null;
  processingRelationKey: string | null = null;

  errorMessage = '';
  successMessage = '';

  searchRoles = '';
  searchRecursos = '';
  searchUsuarios = '';

  filtroEstadoRoles: EstadoFiltro = 'TODOS';
  filtroEstadoRecursos: EstadoFiltro = 'TODOS';
  filtroEstadoUsuarios: EstadoFiltro = 'TODOS';

  modalRolVisible = false;
  modalRecursoVisible = false;

  modoEdicionRol = false;
  modoEdicionRecurso = false;

  rolSeleccionado: Rol | null = null;
  recursoSeleccionado: Recurso | null = null;

  rolForm: Partial<Rol> = this.obtenerRolInicial();
  recursoForm: Partial<Recurso> = this.obtenerRecursoInicial();

  constructor(
    private rolService: RolService,
    private recursoService: RecursoService,
    private usuarioService: UsuarioService,
    private usuarioRolService: UsuarioRolService,
    private rolRecursoService: RolRecursoService,
    private cdr: ChangeDetectorRef
  ) { }

  ngOnInit(): void {
    this.cargarDatos(true);
  }

  cargarDatos(primeraCarga = false): void {
    this.limpiarMensajes();

    if (primeraCarga) {
      this.loading = true;
    } else {
      this.refreshing = true;
    }

    this.cdr.markForCheck();

    forkJoin({
      roles: this.rolService.listar(),
      recursos: this.recursoService.listar(),
      usuarios: this.usuarioService.listar(),
      usuariosRoles: this.usuarioRolService.listar(),
      rolesRecursos: this.rolRecursoService.listar()
    })
      .pipe(
        finalize(() => {
          this.loading = false;
          this.refreshing = false;
          this.cdr.markForCheck();
        })
      )
      .subscribe({
        next: (data) => {
          this.roles = data.roles ?? [];
          this.recursos = data.recursos ?? [];
          this.usuarios = data.usuarios ?? [];
          this.usuariosRoles = data.usuariosRoles ?? [];
          this.rolesRecursos = data.rolesRecursos ?? [];

          // Inicializar roles base si es primera carga y no hay roles
          if (this.inicializarRolesBase && this.roles.length === 0) {
            this.crearRolesBase();
          }

          this.aplicarFiltros();

          if (primeraCarga) {
            this.configurarRecursosYRolesIniciales();
          }
        },
        error: (error) => {
          console.error('Error cargando datos:', error);
          this.errorMessage = this.obtenerMensajeError(error);
        }
      });
  }

  crearRolesBase(): void {
    const rolesBase = [
      {
        nombre: 'Operador',
        descripcion: 'Rol para operar y controlar los dispositivos. Acceso a control manual de lámparas, cambio de modo automático/manual, y envío de comandos.',
        estado: 'ACTIVO'
      },
      {
        nombre: 'Monitor',
        descripcion: 'Rol para monitorear datos en tiempo real. Solo visualización de telemetría, datos de sensores, batería y luminarias. Sin permisos de control.',
        estado: 'ACTIVO'
      }
    ];

    rolesBase.forEach(rol => {
      this.rolService.crear(rol).subscribe({
        next: (rolCreado) => {
          if (!this.roles.some(r => this.normalizarTexto(r.nombre) === this.normalizarTexto(rolCreado.nombre))) {
            this.roles = [rolCreado, ...this.roles];
            console.log(`✅ Rol "${rolCreado.nombre}" creado exitosamente`);
          }
        },
        error: (error) => {
          console.warn(`⚠️ No se pudo crear rol base: ${error.message}`);
        }
      });
    });
  }

  private configurarRecursosYRolesIniciales(): void {
    const rolesRequeridos: Partial<Rol>[] = [
      { nombre: 'Admin', descripcion: 'Rol con todos los permisos del sistema.', estado: 'ACTIVO' },
      { nombre: 'Operador', descripcion: 'Rol para operar y controlar dispositivos.', estado: 'ACTIVO' },
      { nombre: 'Monitor', descripcion: 'Rol para monitorear datos en tiempo real.', estado: 'ACTIVO' }
    ];

    const recursosRequeridos: Partial<Recurso>[] = [
      { nombre: 'Usuarios', url_backend: '/api/usuarios/', url_frontend: '/usuarios', path: '/api/usuarios/', icono: 'fa-solid fa-users', orden: 1, estado: 'ACTIVO' },
      { nombre: 'Roles', url_backend: '/api/roles/', url_frontend: '/roles', path: '/api/roles/', icono: 'fa-solid fa-shield-alt', orden: 2, estado: 'ACTIVO' },
      { nombre: 'Recursos', url_backend: '/api/recursos/', url_frontend: '/roles', path: '/api/recursos/', icono: 'fa-solid fa-list', orden: 3, estado: 'ACTIVO' },
      { nombre: 'Dashboard', url_backend: '/api/dashboard/', url_frontend: '/dashboard', path: '/api/dashboard/', icono: 'fa-solid fa-chart-line', orden: 4, estado: 'ACTIVO' },
      { nombre: 'Dispositivos', url_backend: '/api/dispositivos/', url_frontend: '/dispositivos', path: '/api/dispositivos/', icono: 'fa-solid fa-microchip', orden: 5, estado: 'ACTIVO' },
      { nombre: 'Luminarias', url_backend: '/api/luminarias/', url_frontend: '/luminarias', path: '/api/luminarias/', icono: 'fa-solid fa-lightbulb', orden: 6, estado: 'ACTIVO' },
      { nombre: 'Sensores', url_backend: '/api/sensores/', url_frontend: '/sensores', path: '/api/sensores/', icono: 'fa-solid fa-gauge', orden: 7, estado: 'ACTIVO' },
      { nombre: 'Baterías', url_backend: '/api/baterias/', url_frontend: '/baterias', path: '/api/baterias/', icono: 'fa-solid fa-battery-half', orden: 8, estado: 'ACTIVO' }
    ];

    const usuarioJose = this.usuarios.find(usuario => {
      const username = usuario.username?.toLowerCase() || '';
      const nombre = usuario.nombre?.toLowerCase() || '';
      const apellido = usuario.apellido?.toLowerCase() || '';
      const email = usuario.email?.toLowerCase() || '';
      return username.includes('jose') || nombre.includes('jose') || apellido.includes('jose') || email.includes('jose');
    });

    const rolesACrear = rolesRequeridos.filter(rol =>
      !this.roles.some(existing => this.normalizarTexto(existing.nombre) === this.normalizarTexto(rol.nombre))
    );

    const recursosACrear = recursosRequeridos.filter(recurso =>
      !this.recursos.some(existing => this.normalizarTexto(existing.nombre) === this.normalizarTexto(recurso.nombre))
    );

    const crearRoles$ = rolesACrear.length
      ? forkJoin(rolesACrear.map(rol => this.rolService.crear(rol))).pipe(catchError(() => of([] as Rol[])))
      : of([] as Rol[]);

    const crearRecursos$ = recursosACrear.length
      ? forkJoin(recursosACrear.map(recurso => this.recursoService.crear(recurso))).pipe(catchError(() => of([] as Recurso[])))
      : of([] as Recurso[]);

    forkJoin({ roles: crearRoles$, recursos: crearRecursos$ })
      .pipe(
        tap(({ roles, recursos }) => {
          if (roles.length) {
            this.roles = [...roles, ...this.roles];
          }
          if (recursos.length) {
            this.recursos = [...recursos, ...this.recursos];
          }
        }),
        switchMap(() => this.asignarRecursosAlRolAdmin(recursosRequeridos.map(r => r.nombre!))),
        switchMap(() => this.asignarRolAdminAJose(usuarioJose)),
        catchError(error => {
          console.warn('No se pudo completar la configuración inicial de recursos y roles:', error);
          return of(null);
        })
      )
      .subscribe(() => {
        this.aplicarFiltros();
      });
  }

  private asignarRecursosAlRolAdmin(nombresRecursos: string[]) {
    const rolAdmin = this.roles.find(rol => this.normalizarTexto(rol.nombre) === 'admin');
    if (!rolAdmin) {
      return of(null);
    }

    const recursosParaAsignar = this.recursos.filter(recurso =>
      nombresRecursos.includes(this.normalizarTexto(recurso.nombre))
    );

    const relacionesFaltantes = recursosParaAsignar.filter(recurso =>
      !this.rolesRecursos.some(relacion => relacion.rol === rolAdmin.idrol && relacion.recurso === recurso.idRecursos)
    );

    if (relacionesFaltantes.length === 0) {
      return of(null);
    }

    const crearRelaciones$ = forkJoin(
      relacionesFaltantes.map(recurso =>
        this.rolRecursoService.crear({ rol: rolAdmin.idrol, recurso: recurso.idRecursos })
      )
    ).pipe(catchError(() => of([] as RolRecurso[])));

    return crearRelaciones$.pipe(
      tap(relaciones => {
        if (relaciones.length) {
          this.rolesRecursos = [...relaciones, ...this.rolesRecursos];
        }
      })
    );
  }

  private asignarRolAdminAJose(usuarioJose?: Usuario) {
    if (!usuarioJose) {
      return of(null);
    }

    const rolAdmin = this.roles.find(rol => this.normalizarTexto(rol.nombre) === 'admin');
    if (!rolAdmin) {
      return of(null);
    }

    const relacionExistente = this.usuariosRoles.find(relacion =>
      relacion.usuario === usuarioJose.idusuarios && relacion.rol === rolAdmin.idrol
    );

    if (relacionExistente) {
      return of(null);
    }

    return this.usuarioRolService.crear({ usuario: usuarioJose.idusuarios, rol: rolAdmin.idrol }).pipe(
      tap(relacion => {
        this.usuariosRoles = [relacion, ...this.usuariosRoles];
        this.successMessage = `Se asignó el rol Admin al usuario ${usuarioJose.username || usuarioJose.nombre || 'Jose'}.`;
      }),
      catchError(error => {
        console.warn('No se pudo asignar el rol Admin a José:', error);
        return of(null);
      })
    );
  }

  cambiarTab(tab: TabVista): void {
    this.tabActiva = tab;
    this.limpiarMensajes();
    this.cdr.markForCheck();
  }

  aplicarFiltros(): void {
    const terminoRoles = this.searchRoles.toLowerCase().trim();
    const terminoRecursos = this.searchRecursos.toLowerCase().trim();
    const terminoUsuarios = this.searchUsuarios.toLowerCase().trim();

    this.rolesFiltrados = this.roles.filter(rol => {
      const coincideBusqueda = !terminoRoles || [
        rol.nombre,
        rol.descripcion,
        rol.estado
      ].filter(Boolean).join(' ').toLowerCase().includes(terminoRoles);

      const coincideEstado =
        this.filtroEstadoRoles === 'TODOS' ||
        this.normalizarTexto(rol.estado) === this.normalizarTexto(this.filtroEstadoRoles);

      return coincideBusqueda && coincideEstado;
    });

    this.recursosFiltrados = this.recursos.filter(recurso => {
      const coincideBusqueda = !terminoRecursos || [
        recurso.nombre,
        recurso.path,
        recurso.url_backend,
        recurso.url_frontend,
        recurso.icono,
        recurso.estado
      ].filter(Boolean).join(' ').toLowerCase().includes(terminoRecursos);

      const coincideEstado =
        this.filtroEstadoRecursos === 'TODOS' ||
        this.normalizarTexto(recurso.estado) === this.normalizarTexto(this.filtroEstadoRecursos);

      return coincideBusqueda && coincideEstado;
    });

    this.usuariosFiltrados = this.usuarios.filter(usuario => {
      const coincideBusqueda = !terminoUsuarios || [
        usuario.username,
        usuario.email,
        usuario.nombre,
        usuario.apellido,
        usuario.estado
      ].filter(Boolean).join(' ').toLowerCase().includes(terminoUsuarios);

      const coincideEstado =
        this.filtroEstadoUsuarios === 'TODOS' ||
        this.normalizarTexto(usuario.estado) === this.normalizarTexto(this.filtroEstadoUsuarios);

      return coincideBusqueda && coincideEstado;
    });

    this.cdr.markForCheck();
  }

  buscarRoles(event: Event): void {
    this.searchRoles = (event.target as HTMLInputElement).value;
    this.aplicarFiltros();
  }

  buscarRecursos(event: Event): void {
    this.searchRecursos = (event.target as HTMLInputElement).value;
    this.aplicarFiltros();
  }

  buscarUsuarios(event: Event): void {
    this.searchUsuarios = (event.target as HTMLInputElement).value;
    this.aplicarFiltros();
  }

  cambiarFiltroRoles(estado: EstadoFiltro): void {
    this.filtroEstadoRoles = estado;
    this.aplicarFiltros();
  }

  cambiarFiltroRecursos(estado: EstadoFiltro): void {
    this.filtroEstadoRecursos = estado;
    this.aplicarFiltros();
  }

  cambiarFiltroUsuarios(estado: EstadoFiltro): void {
    this.filtroEstadoUsuarios = estado;
    this.aplicarFiltros();
  }

  limpiarFiltroRoles(): void {
    this.searchRoles = '';
    this.filtroEstadoRoles = 'TODOS';
    this.aplicarFiltros();
  }

  limpiarFiltroRecursos(): void {
    this.searchRecursos = '';
    this.filtroEstadoRecursos = 'TODOS';
    this.aplicarFiltros();
  }

  limpiarFiltroUsuarios(): void {
    this.searchUsuarios = '';
    this.filtroEstadoUsuarios = 'TODOS';
    this.aplicarFiltros();
  }

  abrirModalCrearRol(): void {
    this.modoEdicionRol = false;
    this.rolSeleccionado = null;
    this.rolForm = this.obtenerRolInicial();
    this.modalRolVisible = true;
    this.limpiarMensajes();
    this.cdr.markForCheck();
  }

  abrirModalEditarRol(rol: Rol): void {
    this.modoEdicionRol = true;
    this.rolSeleccionado = rol;
    this.rolForm = { ...rol };
    this.modalRolVisible = true;
    this.limpiarMensajes();
    this.cdr.markForCheck();
  }

  cerrarModalRol(): void {
    if (this.saving) return;

    this.modalRolVisible = false;
    this.rolSeleccionado = null;
    this.rolForm = this.obtenerRolInicial();
    this.errorMessage = '';
    this.cdr.markForCheck();
  }

  guardarRol(): void {
    this.errorMessage = '';

    if (!this.rolForm.nombre?.trim()) {
      this.errorMessage = 'El nombre del rol es obligatorio.';
      this.cdr.markForCheck();
      return;
    }

    this.saving = true;
    this.cdr.markForCheck();

    const request = this.modoEdicionRol && this.rolSeleccionado
      ? this.rolService.actualizar(this.rolSeleccionado.idrol, this.rolForm)
      : this.rolService.crear(this.rolForm);

    request
      .pipe(
        finalize(() => {
          this.saving = false;
          this.cdr.markForCheck();
        })
      )
      .subscribe({
        next: (rolGuardado) => {
          if (this.modoEdicionRol && this.rolSeleccionado) {
            this.roles = this.roles.map(rol =>
              rol.idrol === this.rolSeleccionado?.idrol ? rolGuardado : rol
            );

            this.successMessage = 'Rol actualizado correctamente.';
          } else {
            this.roles = [rolGuardado, ...this.roles];
            this.successMessage = 'Rol creado correctamente.';
          }

          this.aplicarFiltros();

          this.modalRolVisible = false;
          this.rolSeleccionado = null;
          this.rolForm = this.obtenerRolInicial();
        },
        error: (error) => {
          this.errorMessage = this.obtenerMensajeError(error);
        }
      });
  }

  eliminarRol(rol: Rol): void {
    const confirmar = confirm(`¿Desea eliminar el rol "${rol.nombre}"?`);

    if (!confirmar) return;

    this.deletingRolId = rol.idrol;
    this.limpiarMensajes();
    this.cdr.markForCheck();

    this.rolService.eliminar(rol.idrol)
      .pipe(
        finalize(() => {
          this.deletingRolId = null;
          this.cdr.markForCheck();
        })
      )
      .subscribe({
        next: () => {
          this.roles = this.roles.filter(item => item.idrol !== rol.idrol);
          this.usuariosRoles = this.usuariosRoles.filter(item => item.rol !== rol.idrol);
          this.rolesRecursos = this.rolesRecursos.filter(item => item.rol !== rol.idrol);
          this.aplicarFiltros();
          this.successMessage = 'Rol eliminado correctamente.';
        },
        error: (error) => {
          this.errorMessage = this.obtenerMensajeError(error);
        }
      });
  }

  abrirModalCrearRecurso(): void {
    this.modoEdicionRecurso = false;
    this.recursoSeleccionado = null;
    this.recursoForm = this.obtenerRecursoInicial();
    this.modalRecursoVisible = true;
    this.limpiarMensajes();
    this.cdr.markForCheck();
  }

  abrirModalEditarRecurso(recurso: Recurso): void {
    this.modoEdicionRecurso = true;
    this.recursoSeleccionado = recurso;
    this.recursoForm = { ...recurso };
    this.modalRecursoVisible = true;
    this.limpiarMensajes();
    this.cdr.markForCheck();
  }

  cerrarModalRecurso(): void {
    if (this.saving) return;

    this.modalRecursoVisible = false;
    this.recursoSeleccionado = null;
    this.recursoForm = this.obtenerRecursoInicial();
    this.errorMessage = '';
    this.cdr.markForCheck();
  }

  guardarRecurso(): void {
    this.errorMessage = '';

    if (
      !this.recursoForm.nombre?.trim() ||
      !this.recursoForm.url_frontend?.trim() ||
      !this.recursoForm.url_backend?.trim()
    ) {
      this.errorMessage = 'El nombre, la URL backend y la URL frontend son obligatorios.';
      this.cdr.markForCheck();
      return;
    }

    this.saving = true;
    this.cdr.markForCheck();

    const payload: Partial<Recurso> = {
      ...this.recursoForm,
      path: this.recursoForm.url_backend || this.recursoForm.path || '',
      orden: Number(this.recursoForm.orden || 1)
    };

    const request = this.modoEdicionRecurso && this.recursoSeleccionado
      ? this.recursoService.actualizar(this.recursoSeleccionado.idRecursos, payload)
      : this.recursoService.crear(payload);

    request
      .pipe(
        finalize(() => {
          this.saving = false;
          this.cdr.markForCheck();
        })
      )
      .subscribe({
        next: (recursoGuardado) => {
          if (this.modoEdicionRecurso && this.recursoSeleccionado) {
            this.recursos = this.recursos.map(recurso =>
              recurso.idRecursos === this.recursoSeleccionado?.idRecursos ? recursoGuardado : recurso
            );

            this.successMessage = 'Recurso actualizado correctamente.';
          } else {
            this.recursos = [recursoGuardado, ...this.recursos];
            this.successMessage = 'Recurso creado correctamente.';
          }

          this.aplicarFiltros();

          this.modalRecursoVisible = false;
          this.recursoSeleccionado = null;
          this.recursoForm = this.obtenerRecursoInicial();
        },
        error: (error) => {
          this.errorMessage = this.obtenerMensajeError(error);
        }
      });
  }

  eliminarRecurso(recurso: Recurso): void {
    const confirmar = confirm(`¿Desea eliminar el recurso "${recurso.nombre}"?`);

    if (!confirmar) return;

    this.deletingRecursoId = recurso.idRecursos;
    this.limpiarMensajes();
    this.cdr.markForCheck();

    this.recursoService.eliminar(recurso.idRecursos)
      .pipe(
        finalize(() => {
          this.deletingRecursoId = null;
          this.cdr.markForCheck();
        })
      )
      .subscribe({
        next: () => {
          this.recursos = this.recursos.filter(item => item.idRecursos !== recurso.idRecursos);
          this.rolesRecursos = this.rolesRecursos.filter(item => item.recurso !== recurso.idRecursos);
          this.aplicarFiltros();
          this.successMessage = 'Recurso eliminado correctamente.';
        },
        error: (error) => {
          this.errorMessage = this.obtenerMensajeError(error);
        }
      });
  }

  toggleRolUsuario(usuario: Usuario, rol: Rol, event: Event): void {
    const checked = (event.target as HTMLInputElement).checked;
    const key = `usuario-${usuario.idusuarios}-rol-${rol.idrol}`;
    const relacionExistente = this.usuariosRoles.find(item =>
      item.usuario === usuario.idusuarios && item.rol === rol.idrol
    );

    this.processingRelationKey = key;
    this.limpiarMensajes();
    this.cdr.markForCheck();

    if (checked) {
      if (relacionExistente) {
        this.processingRelationKey = null;
        return;
      }

      this.usuarioRolService.crear({
        usuario: usuario.idusuarios,
        rol: rol.idrol
      })
        .pipe(
          finalize(() => {
            this.processingRelationKey = null;
            this.cdr.markForCheck();
          })
        )
        .subscribe({
          next: (relacion) => {
            this.usuariosRoles = [relacion, ...this.usuariosRoles];
            this.successMessage = 'Rol asignado correctamente.';
          },
          error: (error) => {
            this.errorMessage = this.obtenerMensajeError(error);
            this.cdr.markForCheck();
          }
        });

      return;
    }

    if (!relacionExistente) {
      this.processingRelationKey = null;
      return;
    }

    this.usuarioRolService.eliminar(relacionExistente.id)
      .pipe(
        finalize(() => {
          this.processingRelationKey = null;
          this.cdr.markForCheck();
        })
      )
      .subscribe({
        next: () => {
          this.usuariosRoles = this.usuariosRoles.filter(item => item.id !== relacionExistente.id);
          this.successMessage = 'Rol removido correctamente.';
        },
        error: (error) => {
          this.errorMessage = this.obtenerMensajeError(error);
        }
      });
  }

  toggleRecursoRol(rol: Rol, recurso: Recurso, event: Event): void {
    const checked = (event.target as HTMLInputElement).checked;
    const key = `rol-${rol.idrol}-recurso-${recurso.idRecursos}`;
    const relacionExistente = this.rolesRecursos.find(item =>
      item.rol === rol.idrol && item.recurso === recurso.idRecursos
    );

    this.processingRelationKey = key;
    this.limpiarMensajes();
    this.cdr.markForCheck();

    if (checked) {
      if (relacionExistente) {
        this.processingRelationKey = null;
        return;
      }

      this.rolRecursoService.crear({
        rol: rol.idrol,
        recurso: recurso.idRecursos
      })
        .pipe(
          finalize(() => {
            this.processingRelationKey = null;
            this.cdr.markForCheck();
          })
        )
        .subscribe({
          next: (relacion) => {
            this.rolesRecursos = [relacion, ...this.rolesRecursos];
            this.successMessage = 'Recurso asignado correctamente.';
          },
          error: (error) => {
            this.errorMessage = this.obtenerMensajeError(error);
          }
        });

      return;
    }

    if (!relacionExistente) {
      this.processingRelationKey = null;
      return;
    }

    this.rolRecursoService.eliminar(relacionExistente.id)
      .pipe(
        finalize(() => {
          this.processingRelationKey = null;
          this.cdr.markForCheck();
        })
      )
      .subscribe({
        next: () => {
          this.rolesRecursos = this.rolesRecursos.filter(item => item.id !== relacionExistente.id);
          this.successMessage = 'Recurso removido correctamente.';
        },
        error: (error) => {
          this.errorMessage = this.obtenerMensajeError(error);
        }
      });
  }

  usuarioTieneRol(usuarioId: number, rolId: number): boolean {
    return this.usuariosRoles.some(item => item.usuario === usuarioId && item.rol === rolId);
  }

  rolTieneRecurso(rolId: number, recursoId: number): boolean {
    return this.rolesRecursos.some(item => item.rol === rolId && item.recurso === recursoId);
  }

  relacionProcesando(key: string): boolean {
    return this.processingRelationKey === key;
  }

  obtenerNombreUsuario(id: number): string {
    const usuario = this.usuarios.find(item => item.idusuarios === id);

    if (!usuario) return 'Usuario no identificado';

    const nombreCompleto = `${usuario.nombre || ''} ${usuario.apellido || ''}`.trim();

    return nombreCompleto || usuario.username;
  }

  obtenerNombreRol(id: number): string {
    return this.roles.find(item => item.idrol === id)?.nombre || 'Rol no identificado';
  }

  obtenerNombreRecurso(id: number): string {
    return this.recursos.find(item => item.idRecursos === id)?.nombre || 'Recurso no identificado';
  }

  obtenerRolesDelUsuario(usuarioId: number): UsuarioRol[] {
    return this.usuariosRoles.filter(item => item.usuario === usuarioId);
  }

  obtenerRecursosDelRol(rolId: number): RolRecurso[] {
    return this.rolesRecursos.filter(item => item.rol === rolId);
  }

  obtenerUsuariosDelRol(rolId: number): number {
    return this.usuariosRoles.filter(item => item.rol === rolId).length;
  }

  obtenerInicialUsuario(usuario: Usuario): string {
    const base = usuario.nombre?.trim() || usuario.username || 'U';
    return base.charAt(0).toUpperCase();
  }

  obtenerIconoRecurso(recurso: Recurso): string {
    return recurso.icono || 'fa-solid fa-window-maximize';
  }

  estaActivo(estado?: string): boolean {
    return this.normalizarTexto(estado) === 'activo';
  }

  totalRolesActivos(): number {
    return this.roles.filter(rol => this.estaActivo(rol.estado)).length;
  }

  totalRecursosActivos(): number {
    return this.recursos.filter(recurso => this.estaActivo(recurso.estado)).length;
  }

  totalUsuariosConRol(): number {
    const ids = new Set(this.usuariosRoles.map(item => item.usuario));
    return ids.size;
  }

  promedioPermisosPorRol(): number {
    if (this.roles.length === 0) return 0;
    return Math.round(this.rolesRecursos.length / this.roles.length);
  }

  trackByRol(index: number, rol: Rol): number {
    return rol.idrol;
  }

  trackByRecurso(index: number, recurso: Recurso): number {
    return recurso.idRecursos;
  }

  trackByUsuario(index: number, usuario: Usuario): number {
    return usuario.idusuarios;
  }

  trackByRelacion(index: number, relacion: UsuarioRol | RolRecurso): number {
    return relacion.id;
  }

  obtenerRolInicial(): Partial<Rol> {
    return {
      nombre: '',
      descripcion: '',
      estado: 'ACTIVO'
    };
  }

  obtenerRecursoInicial(): Partial<Recurso> {
    return {
      nombre: '',
      url_backend: '',
      url_frontend: '',
      path: '',
      icono: '',
      orden: 1,
      recurso_padre: null,
      estado: 'ACTIVO'
    };
  }

  limpiarMensajes(): void {
    this.errorMessage = '';
    this.successMessage = '';
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

    return 'Ocurrió un error al procesar la solicitud.';
  }

  obtenerTipoRol(rol: Rol | null): 'operador' | 'monitor' | 'admin' | 'custom' {
    if (!rol || !rol.nombre) return 'custom';

    const nombre = rol.nombre.toLowerCase().trim();

    if (nombre === 'operador') return 'operador';
    if (nombre === 'monitor') return 'monitor';
    if (nombre === 'admin') return 'admin';

    return 'custom';
  }

  tienePermisosOperador(rol: Rol | null): boolean {
    return this.obtenerTipoRol(rol) === 'operador' || this.obtenerTipoRol(rol) === 'admin';
  }

  tienePermisosMonitor(rol: Rol | null): boolean {
    return this.obtenerTipoRol(rol) === 'monitor' || this.obtenerTipoRol(rol) === 'admin';
  }

  obtenerPermisosPorRol(rol: Rol): { lectura: boolean; escritura: boolean; control: boolean } {
    const tipo = this.obtenerTipoRol(rol);

    return {
      lectura: true, // Todos pueden leer
      escritura: tipo === 'admin',
      control: tipo === 'operador' || tipo === 'admin'
    };
  }
}