import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { AuthService } from './auth';

export interface Alerta {
  id_alerta: number;
  tipo_alerta: string;
  descripcion: string;
  fecha_alerta: string;
}

@Injectable({
  providedIn: 'root',
})
export class AlertaService {
  private apiUrl = `${environment.apiUrl}/alertas`;

  constructor(private http: HttpClient, private authService: AuthService) {}

  private getHeaders(): HttpHeaders {
    const token = this.authService.getToken();
    return new HttpHeaders({
      'Content-Type': 'application/json',
      'Authorization': token ? `Bearer ${token}` : ''
    });
  }

  getAll(): Observable<Alerta[]> {
    return this.http.get<Alerta[]>(this.apiUrl, { headers: this.getHeaders() });
  }
}
