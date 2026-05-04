import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { environment } from '../../../environments/environment';
import { AuthHeadersService } from './auth-headers.service';
import { Device } from '../models/device.model';

export interface CreateDevice {
  name?: string;
  location?: string;
  status?: string;
  mode?: string;
  nombre?: string;
  ubicacion?: string;
  estado?: string;
  modo?: string;
}

export type UpdateDevice = CreateDevice;

@Injectable({
  providedIn: 'root',
})
export class DeviceService {
  private apiUrl = `${environment.apiUrl}/devices`;

  constructor(private http: HttpClient, private authHeaders: AuthHeadersService) {}

  private getHeaders(): HttpHeaders {
    return this.authHeaders.getAuthHeaders();
  }

  getAll(): Observable<Device[]> {
    return this.http.get<{ devices: Device[] }>(this.apiUrl, { headers: this.getHeaders() })
      .pipe(map(response => response.devices || []));
  }

  getById(id: number): Observable<{ device: Device }> {
    return this.http.get<{ device: Device }>(`${this.apiUrl}/${id}`, { headers: this.getHeaders() });
  }

  private preparePayload(data: CreateDevice | UpdateDevice) {
    return {
      ...data,
      nombre: data.nombre ?? data.name,
      ubicacion: data.ubicacion ?? data.location,
      estado: data.estado ?? data.status,
      modo: data.modo ?? data.mode,
    };
  }

  create(data: CreateDevice): Observable<Device> {
    return this.http.post<{ device: Device }>(this.apiUrl, this.preparePayload(data), { headers: this.getHeaders() })
      .pipe(map(response => response.device));
  }

  update(id: number, data: UpdateDevice): Observable<Device> {
    return this.http.put<{ device: Device }>(`${this.apiUrl}/${id}`, this.preparePayload(data), { headers: this.getHeaders() })
      .pipe(map(response => response.device));
  }

  delete(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`, { headers: this.getHeaders() });
  }

  listar(): Observable<Device[]> {
    return this.getAll();
  }

  crear(data: CreateDevice): Observable<Device> {
    return this.create(data);
  }

  actualizar(id: number, data: UpdateDevice): Observable<Device> {
    return this.update(id, data);
  }

  eliminar(id: number): Observable<void> {
    return this.delete(id);
  }
}