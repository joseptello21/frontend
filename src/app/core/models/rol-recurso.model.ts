export interface RolRecurso {
  id: number;
  rol: number;
  recurso: number;
}

export interface BackendRolRecurso {
  id_rol: number;
  id_recurso: number;
}

export interface PaginatedRolRecursoResponse {
  value: BackendRolRecurso[];
  Count: number;
}

export interface LegacyPaginatedRolRecursoResponse {
  count: number;
  next: string | null;
  previous: string | null;
  results: RolRecurso[];
}