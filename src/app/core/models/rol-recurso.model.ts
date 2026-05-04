export interface RolRecurso {
  id: number;
  rol: number;
  recurso: number;
}

export interface PaginatedRolRecursoResponse {
  count: number;
  next: string | null;
  previous: string | null;
  results: RolRecurso[];
}