import { Usuario } from './usuario.model';
import { Rol } from './rol.model';
import { Recurso } from './recurso.model';

export interface AuthResponse {
  access: string;
  refresh?: string;
  usuario: Usuario;
  roles: Rol[];
  recursos: Recurso[];
}