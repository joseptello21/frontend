import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { AuthHeadersService } from './auth-headers.service';

export interface Bateria {
  id_bateria: number;
  capacidad_ah: number;
  voltaje: number;
  estado?: string;
  id_panel?: number;
}

export interface CreateBateria {
  capacidad_ah: number;
  voltaje?: number;
  estado?: string;
  id_panel?: number;
}

@Injectable({
  providedIn: 'root',
})
export class BateriaService {
  private apiUrl = `${environment.apiUrl}/baterias`;

  constructor(private http: HttpClient, private authHeaders: AuthHeadersService) {}

  private getHeaders(): HttpHeaders {
    return this.authHeaders.getAuthHeaders();
  }

  getAll(): Observable<Bateria[]> {
    return this.http.get<Bateria[]>(this.apiUrl, { headers: this.getHeaders() });
  }

  getById(id: number): Observable<Bateria> {
    return this.http.get<Bateria>(`${this.apiUrl}/${id}`, { headers: this.getHeaders() });
  }

  create(data: CreateBateria): Observable<Bateria> {
    return this.http.post<Bateria>(this.apiUrl, data, { headers: this.getHeaders() });
  }

  update(id: number, data: CreateBateria): Observable<Bateria> {
    return this.http.put<Bateria>(`${this.apiUrl}/${id}`, data, { headers: this.getHeaders() });
  }

  delete(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`, { headers: this.getHeaders() });
  }

  eliminar(id: number): Observable<void> {
    return this.delete(id);
  }

  actualizar(id: number, data: CreateBateria): Observable<Bateria> {
    return this.update(id, data);
  }
}
