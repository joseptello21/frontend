import { Component, OnInit, ChangeDetectionStrategy, ChangeDetectorRef } from '@angular/core';
import { CommonModule, Location } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { finalize } from 'rxjs';

import { Usuario } from '../../core/models/usuario.model';
import { UsuarioService } from '../../core/services/usuario.service';

type ViewMode = 'grid' | 'table';

@Component({
  selector: 'app-usuarios',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './usuarios.html',
  styleUrl: './usuarios.css',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class UsuariosComponent implements OnInit {

  usuarios: Usuario[] = [];
  usuariosFiltrados: Usuario[] = [];

  loading = false;
  refreshing = false;
  deletingId: number | null = null;
  successMessage = '';
  errorMessage = '';
  searchTerm = '';
  saving = false;
  modalVisible = false;
  modoEdicion = false;
  usuarioSeleccionado: Usuario | null = null;
  formData: any = { nombre: '', email: '', password: '' };
  viewMode: 'grid' | 'table' = 'table';

  constructor(
    private usuarioService: UsuarioService,
    private location: Location,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.cargarUsuarios();
  }

  cargarUsuarios(): void {
    this.loading = true;
    this.errorMessage = '';

    this.usuarioService.listar().pipe(
      finalize(() => {
        this.loading = false;
        this.cdr.markForCheck();
      })
    ).subscribe({
      next: (data) => {
        this.usuarios = data.map(usuario => ({
          ...usuario,
          username: usuario.username || usuario.correo || '',
          email: usuario.email || usuario.correo || '',
          apellido: usuario.apellido || (usuario.nombre ? usuario.nombre.split(' ').slice(1).join(' ') : ''),
          nombre: usuario.nombre || ''
        }));
        this.usuariosFiltrados = [...this.usuarios];
      },
      error: () => {
        this.errorMessage = 'No fue posible cargar los usuarios.';
      }
    });
  }

  refrescar(): void {
    this.refreshing = true;
    this.usuarioService.listar().pipe(
      finalize(() => {
        this.refreshing = false;
        this.cdr.markForCheck();
      })
    ).subscribe({
      next: (data) => {
        this.usuarios = data.map(usuario => ({
          ...usuario,
          username: usuario.username || usuario.correo || '',
          email: usuario.email || usuario.correo || '',
          apellido: usuario.apellido || (usuario.nombre ? usuario.nombre.split(' ').slice(1).join(' ') : ''),
          nombre: usuario.nombre || ''
        }));
        this.usuariosFiltrados = [...this.usuarios];
      },
      error: () => {
        this.errorMessage = 'No fue posible refrescar los usuarios.';
      }
    });
  }

  buscar(event: Event): void {
    const input = event.target as HTMLInputElement;
    this.searchTerm = input.value.toLowerCase().trim();

    this.usuariosFiltrados = this.usuarios.filter(usuario =>
      usuario.nombre?.toLowerCase().includes(this.searchTerm) ||
      usuario.email?.toLowerCase().includes(this.searchTerm) ||
      usuario.username?.toLowerCase().includes(this.searchTerm)
    );

    this.cdr.markForCheck();
  }

  cambiarVista(modo: 'grid' | 'table'): void {
    this.viewMode = modo;
    this.cdr.markForCheck();
  }

  abrirModalCrear(): void {
    this.modoEdicion = false;
    this.usuarioSeleccionado = null;
    this.formData = { nombre: '', email: '', password: '' };
    this.errorMessage = '';
    this.successMessage = '';
    this.modalVisible = true;
    this.cdr.markForCheck();
  }

  abrirModalEditar(usuario: Usuario): void {
    this.modoEdicion = true;
    this.usuarioSeleccionado = usuario;

    this.formData = {
      nombre: usuario.nombre || '',
      email: usuario.email || usuario.correo || ''
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
    this.usuarioSeleccionado = null;
    this.formData = { nombre: '', email: '', password: '' };
    this.errorMessage = '';
    this.cdr.markForCheck();
  }

  guardarUsuario(): void {
    this.errorMessage = '';
    this.successMessage = '';

    if (!this.formularioValido()) {
      this.errorMessage = 'Complete los campos obligatorios: nombre y email.';
      this.cdr.markForCheck();
      return;
    }

    this.saving = true;
    this.cdr.markForCheck();

    if (this.modoEdicion && this.usuarioSeleccionado) {
      this.usuarioService.update(this.usuarioSeleccionado.idusuarios, {
        nombre: this.formData.nombre,
        email: this.formData.email
      }).pipe(
        finalize(() => {
          this.saving = false;
          this.cdr.markForCheck();
        })
      ).subscribe({
        next: (updated) => {
          this.usuarios = this.usuarios.map(item => item.idusuarios === updated.idusuarios ? {
            ...updated,
            username: updated.username || updated.correo || '',
            email: updated.email || updated.correo || '',
            apellido: updated.apellido || (updated.nombre ? updated.nombre.split(' ').slice(1).join(' ') : ''),
            nombre: updated.nombre || ''
          } : item);
          this.usuariosFiltrados = [...this.usuarios];
          this.successMessage = 'Usuario actualizado correctamente.';
          this.cerrarModal();
        },
        error: (error) => {
          console.error('Error actualizando usuario:', error);
          this.errorMessage = this.obtenerMensajeError(error);
        }
      });
    } else {
      this.usuarioService.create({
        nombre: this.formData.nombre,
        email: this.formData.email,
        password: this.formData.password
      }).pipe(
        finalize(() => {
          this.saving = false;
          this.cdr.markForCheck();
        })
      ).subscribe({
        next: (record) => {
          const nuevoUsuario = {
            ...record,
            username: record.username || record.correo || '',
            email: record.email || record.correo || '',
            apellido: record.apellido || (record.nombre ? record.nombre.split(' ').slice(1).join(' ') : ''),
            nombre: record.nombre || ''
          };
          this.usuarios.push(nuevoUsuario);
          this.usuariosFiltrados = [...this.usuarios];
          this.successMessage = 'Usuario creado correctamente.';
          this.cerrarModal();
        },
        error: (error) => {
          console.error('Error creando usuario:', error);
          this.errorMessage = this.obtenerMensajeError(error);
        }
      });
    }
  }

  volver(): void {
    this.location.back();
  }

  eliminar(usuario: Usuario): void {
    if (this.deletingId !== null) {
      return;
    }

    const confirmar = confirm(`¿Desea eliminar el usuario ${usuario.correo || usuario.username}?`);

    if (!confirmar) {
      return;
    }

    this.deletingId = usuario.idusuarios;
    this.errorMessage = '';
    this.cdr.markForCheck();

    this.usuarioService.eliminar(usuario.idusuarios).pipe(
      finalize(() => {
        this.deletingId = null;
        this.cdr.markForCheck();
      })
    ).subscribe({
      next: () => {
        this.usuarios = this.usuarios.filter(item => item.idusuarios !== usuario.idusuarios);
        this.usuariosFiltrados = [...this.usuarios];
        this.successMessage = 'Usuario eliminado correctamente.';
      },
      error: (error) => {
        console.error('Error eliminando usuario:', error);
        this.errorMessage = this.obtenerMensajeError(error);
      }
    });
  }

  formularioValido(): boolean {
    if (this.modoEdicion) {
      return !!(this.formData.nombre?.trim() && this.formData.email?.trim());
    } else {
      return !!(this.formData.nombre?.trim() && this.formData.email?.trim() && this.formData.password?.trim());
    }
  }

  obtenerMensajeError(error: any): string {
    if (error?.error?.message) {
      return error.error.message;
    }
    if (error?.message) {
      return error.message;
    }
    if (typeof error === 'string') {
      return error;
    }
    return 'Ocurrió un error inesperado.';
  }
}