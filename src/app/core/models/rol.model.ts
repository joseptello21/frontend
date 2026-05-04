export interface Rol {
  idrol: number;
  nombre: string;
  descripcion?: string;
  estado: string;
}

export interface PaginatedRolResponse {
  count: number;
  next: string | null;
  previous: string | null;
  results: Rol[];
}