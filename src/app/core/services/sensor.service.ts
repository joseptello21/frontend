import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { environment } from '../../../environments/environment';
import { AuthHeadersService } from './auth-headers.service';

export interface Sensor {
  id_sensor: number;
  tipo_sensor: string;
  descripcion?: string;
  id_dispositivo?: number;
  unidad_medida?: string;
}

export interface CreateSensor {
  tipo_sensor: string;
  descripcion?: string;
  id_dispositivo?: number;
  unidad_medida?: string;
}

export interface UpdateSensor {
  tipo_sensor?: string;
  descripcion?: string;
  id_dispositivo?: number;
  unidad_medida?: string;
}

@Injectable({
  providedIn: 'root',
})
export class SensorService {
  private apiUrl = `${environment.apiUrl}/sensores`;

  constructor(private http: HttpClient, private authHeaders: AuthHeadersService) {}

  private getHeaders(): HttpHeaders {
    return this.authHeaders.getAuthHeaders();
  }

  getAll(): Observable<Sensor[]> {
    return this.http.get<{ success: boolean; data: Sensor[] }>(this.apiUrl, { headers: this.getHeaders() })
      .pipe(map(response => response.data || []));
  }

  getById(id: number): Observable<Sensor> {
    return this.http.get<{ success: boolean; data: Sensor }>(`${this.apiUrl}/${id}`, { headers: this.getHeaders() })
      .pipe(map(response => response.data));
  }

  create(data: CreateSensor): Observable<Sensor> {
    return this.http.post<{ success: boolean; data: Sensor }>(this.apiUrl, data, { headers: this.getHeaders() })
      .pipe(map(response => response.data));
  }

  update(id: number, data: UpdateSensor): Observable<Sensor> {
    return this.http.put<{ success: boolean; data: Sensor }>(`${this.apiUrl}/${id}`, data, { headers: this.getHeaders() })
      .pipe(map(response => response.data));
  }

  delete(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`, { headers: this.getHeaders() });
  }

  eliminar(id: number): Observable<void> {
    return this.delete(id);
  }

  actualizar(id: number, data: UpdateSensor): Observable<Sensor> {
    return this.update(id, data);
  }
}
