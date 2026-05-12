export interface UsuarioRol {
  id: number;
  usuario: number;
  rol: number;
}

export interface BackendUsuarioRol {
  id_usuario: number;
  id_rol: number;
}

export interface PaginatedUsuarioRolResponse {
  value: BackendUsuarioRol[];
  Count: number;
}

export interface LegacyPaginatedUsuarioRolResponse {
  count: number;
  next: string | null;
  previous: string | null;
  results: UsuarioRol[];
}