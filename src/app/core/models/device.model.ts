// src/app/core/models/device.model.ts

export interface Device {
  id: number;
  zone_name?: string;
  farm_name?: string;
  created_at?: string;
  updated_at?: string;

  device_id: string;
  id_device?: number;
  name: string;
  device_type: string;
  firmware_version?: string;
  ip_address?: string | null;
  mac_address?: string;
  status: string;
  last_seen?: string | null;
  active: boolean;
  zone: number;

  nombre?: string;
  location?: string;
  ubicacion?: string;
  estado?: string;
  mode?: string;
  modo?: string;
}

export interface PaginatedDeviceResponse {
  count: number;
  next: string | null;
  previous: string | null;
  results: Device[];
}