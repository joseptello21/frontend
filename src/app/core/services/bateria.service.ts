import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable, map } from 'rxjs';
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

  private normalizeResponse<T>(response: any): T {
    if (response && typeof response === 'object') {
      return response.data || response || response.result || response.results;
    }
    return response;
  }

  getAll(): Observable<Bateria[]> {
    return this.http.get<any>(this.apiUrl, { headers: this.getHeaders() }).pipe(
      map(response => this.normalizeResponse<Bateria[]>(response) || [])
    );
  }

  getById(id: number): Observable<Bateria> {
    return this.http.get<any>(`${this.apiUrl}/${id}`, { headers: this.getHeaders() }).pipe(
      map(response => this.normalizeResponse<Bateria>(response))
    );
  }

  create(data: CreateBateria): Observable<Bateria> {
    return this.http.post<any>(this.apiUrl, data, { headers: this.getHeaders() }).pipe(
      map(response => this.normalizeResponse<Bateria>(response))
    );
  }

  update(id: number, data: CreateBateria): Observable<Bateria> {
    return this.http.put<any>(`${this.apiUrl}/${id}`, data, { headers: this.getHeaders() }).pipe(
      map(response => this.normalizeResponse<Bateria>(response))
    );
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
