import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { environment } from '../../../environments/environment';
import { AuthHeadersService } from './auth-headers.service';

export interface Luminaria {
  id_luminaria: number;
  tipo_luminaria?: string;
  potencia_watts?: number;
  estado?: string;
  id_zona?: number;
}

export interface CreateLuminaria {
  tipo_luminaria?: string;
  potencia_watts?: number;
  estado?: string;
  id_zona?: number;
}

@Injectable({
  providedIn: 'root',
})
export class LuminariaService {
  private apiUrl = `${environment.apiUrl}/luminarias`;

  constructor(private http: HttpClient, private authHeaders: AuthHeadersService) {}

  private getHeaders(): HttpHeaders {
    return this.authHeaders.getAuthHeaders();
  }

  getAll(): Observable<Luminaria[]> {
    return this.http.get<any>(this.apiUrl, { headers: this.getHeaders() }).pipe(
      map(response => {
        if (Array.isArray(response)) {
          return response;
        }
        return response.data || response.luminarias || response.items || [];
      })
    );
  }

  private preparePayload(data: CreateLuminaria) {
    return {
      tipo_luminaria: data.tipo_luminaria,
      potencia_watts: data.potencia_watts,
      estado: data.estado,
      id_zona: data.id_zona
    };
  }

  create(data: CreateLuminaria): Observable<Luminaria> {
    return this.http.post<{ success: boolean; data: Luminaria }>(this.apiUrl, this.preparePayload(data), { headers: this.getHeaders() })
      .pipe(map(response => response.data));
  }

  update(id: number, data: CreateLuminaria): Observable<Luminaria> {
    return this.http.put<{ success: boolean; data: Luminaria }>(`${this.apiUrl}/${id}`, this.preparePayload(data), { headers: this.getHeaders() })
      .pipe(map(response => response.data));
  }

  getById(id: number): Observable<Luminaria> {
    return this.http.get<{ success: boolean; data: Luminaria }>(`${this.apiUrl}/${id}`, { headers: this.getHeaders() })
      .pipe(map(response => response.data));
  }

  delete(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`, { headers: this.getHeaders() });
  }

  eliminar(id: number): Observable<void> {
    return this.delete(id);
  }

  actualizar(id: number, data: CreateLuminaria): Observable<Luminaria> {
    return this.update(id, data);
  }
}
