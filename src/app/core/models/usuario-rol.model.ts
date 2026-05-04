export interface UsuarioRol {
  id: number;
  usuario: number;
  rol: number;
}

export interface PaginatedUsuarioRolResponse {
  count: number;
  next: string | null;
  previous: string | null;
  results: UsuarioRol[];
}