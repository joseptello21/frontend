import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { environment } from '../../../environments/environment';
import { AuthHeadersService } from './auth-headers.service';

export interface SolarTelemetry {
  id?: number | string;
  timestamp?: string;
  ldr?: number;
  batteryVoltage?: number;
  lamp?: boolean;
  autoMode?: boolean;
  manualStatus?: boolean;
  panelId?: number | string;
  batteryId?: number | string;
}

@Injectable({
  providedIn: 'root'
})
export class TelemetryService {
  private apiUrl = `${environment.apiUrl}/solar/telemetry`;

  constructor(private http: HttpClient, private authHeaders: AuthHeadersService) {}

  private getHeaders(): HttpHeaders {
    return this.authHeaders.getAuthHeaders();
  }

  getAll(): Observable<SolarTelemetry[]> {
    return this.http.get<any>(this.apiUrl, { headers: this.getHeaders() }).pipe(
      map(response => {
        if (Array.isArray(response)) {
          return response;
        }
        return response.data || response.telemetrias || response.items || response || [];
      })
    );
  }
}
