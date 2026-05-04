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

export interface PaginatedRecursoResponse {
  count: number;
  next: string | null;
  previous: string | null;
  results: Recurso[];
}