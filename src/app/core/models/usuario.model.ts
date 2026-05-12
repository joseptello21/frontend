export interface Usuario {
  idusuarios: number;
  username: string;
  email?: string;
  nombre?: string;
  apellido?: string;
  estado: string;

  id_usuario?: number;
  correo?: string;
}

export interface BackendUsuario {
  id_usuario: number;
  correo: string;
  nombre: string;
}

export interface BackendUsuarioResponse {
  success: boolean;
  data: BackendUsuario[];
}

export interface PaginatedUsuarioResponse {
  count: number;
  next: string | null;
  previous: string | null;
  results: Usuario[];
}