import { Injectable } from '@angular/core';
import { HttpHeaders } from '@angular/common/http';
import { StorageService } from './storage.service';

@Injectable({
  providedIn: 'root'
})
export class AuthHeadersService {

  constructor(private storageService: StorageService) {}

  getAuthHeaders(): HttpHeaders {
    const token = this.storageService.getToken();

    console.log('TOKEN OBTENIDO DESDE AuthHeadersService:', token);

    if (!token) {
      console.warn('No hay token en localStorage.');
      return new HttpHeaders();
    }

    const headers = new HttpHeaders({
      Authorization: `Bearer ${token}`
    });

    console.log('HEADER AUTHORIZATION ENVIADO:', headers.get('Authorization'));

    return headers;
  }
}