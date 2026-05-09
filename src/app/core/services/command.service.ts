import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { AuthHeadersService } from './auth-headers.service';

export interface DeviceCommand {
  deviceId: number;
  command: string;
  parameters?: any;
}

export interface CommandResponse {
  success: boolean;
  message: string;
  data?: any;
  comandoId?: number;
}

@Injectable({
  providedIn: 'root'
})
export class CommandService {
  private apiUrl = `${environment.apiUrl}/api/device/command`;

  constructor(
    private http: HttpClient,
    private authHeaders: AuthHeadersService
  ) {}

  private getHeaders(): HttpHeaders {
    return this.authHeaders.getAuthHeaders();
  }

  sendCommand(command: DeviceCommand): Observable<CommandResponse> {
    console.log('📡 Enviando comando al dispositivo:', command);
    return this.http.post<CommandResponse>(this.apiUrl, command, { headers: this.getHeaders() });
  }

  // Comandos específicos para control de ESP32
  setDeviceMode(deviceId: number, mode: 'manual' | 'automatico'): Observable<CommandResponse> {
    return this.sendCommand({
      deviceId,
      command: 'SET_MODE',
      parameters: { mode }
    });
  }

  toggleLamp(deviceId: number, state: boolean): Observable<CommandResponse> {
    return this.sendCommand({
      deviceId,
      command: 'TOGGLE_LAMP',
      parameters: { state }
    });
  }

  setManualLamp(deviceId: number, state: boolean): Observable<CommandResponse> {
    return this.sendCommand({
      deviceId,
      command: 'SET_MANUAL_LAMP',
      parameters: { state }
    });
  }
}