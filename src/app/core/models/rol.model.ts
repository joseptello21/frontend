export interface Rol {
  idrol: number;
  nombre: string;
  descripcion?: string;
  estado: string;
}

export interface BackendRol {
  id_rol: number;
  nombre_rol: string;
}

export interface PaginatedRolResponse {
  value: BackendRol[];
  Count: number;
}

export interface LegacyPaginatedRolResponse {
  count: number;
  next: string | null;
  previous: string | null;
  results: Rol[];
}