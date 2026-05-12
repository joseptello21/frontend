export interface Recurso {
  idRecursos: number;
  nombre: string;
  url_backend?: string | null;
  url_frontend?: string | null;
  path: string;
  icono?: string | null;
  orden: number;
  recurso_padre?: number | null;
  estado: string;
}

export interface BackendRecurso {
  id_recurso: number;
  nombre_recurso: string;
  descripcion?: string | null;
  estado: string;
}

export interface PaginatedRecursoResponse {
  value: BackendRecurso[];
  Count: number;
}

export interface LegacyPaginatedRecursoResponse {
  count: number;
  next: string | null;
  previous: string | null;
  results: Recurso[];
}