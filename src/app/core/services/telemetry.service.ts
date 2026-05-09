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
  luminariaId?: number | string;
  energiaGenerada?: number;
}

@Injectable({
  providedIn: 'root'
})
export class TelemetryService {
  private apiUrl = `${environment.apiUrl}/api/solar/telemetry`;

  constructor(private http: HttpClient, private authHeaders: AuthHeadersService) {}

  private getHeaders(): HttpHeaders {
    return this.authHeaders.getAuthHeaders();
  }

  getAll(): Observable<SolarTelemetry[]> {
    console.log('📡 Fetching telemetry from:', this.apiUrl);
    return this.http.get<any>(this.apiUrl).pipe(
      map(response => {
        console.log('✅ Telemetry response:', response);
        if (Array.isArray(response)) {
          console.log('📦 Response is array, returning:', response);
          return response;
        }
        const data = response.data || response.telemetrias || response.items || [];
        console.log('📦 Extracted data:', data);
        return data;
      })
    );
  }
}
