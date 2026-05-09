# Especificación de Telemetría Solar - Backend

## Estructura esperada del endpoint `/api/solar/telemetry`

El backend debe enviar un arreglo JSON con objetos de telemetría que cumplan con esta estructura:

### Respuesta esperada:

```json
{
  "data": [
    {
      "id": 1,
      "timestamp": "2026-05-09T03:55:36.235Z",
      "ldr": 450,
      "batteryVoltage": 12.5,
      "lamp": true,
      "autoMode": true,
      "manualStatus": false,
      "panelId": 1,
      "batteryId": 1,
      "luminariaId": 1,
      "energiaGenerada": 850
    }
  ]
}
```

O simplemente un arreglo:

```json
[
  {
    "id": 1,
    "timestamp": "2026-05-09T03:55:36.235Z",
    "ldr": 450,
    "batteryVoltage": 12.5,
    "lamp": true,
    "autoMode": true,
    "manualStatus": false,
    "panelId": 1,
    "batteryId": 1,
    "luminariaId": 1,
    "energiaGenerada": 850
  }
]
```

## Campos requeridos:

| Campo | Tipo | Descripción | Ejemplo |
|-------|------|-------------|---------|
| `id` | number \| string | ID único de la telemetría | 1 |
| `timestamp` | string (ISO 8601) | Fecha y hora de registro | "2026-05-09T03:55:36.235Z" |
| `ldr` | number | Valor del sensor LDR (luminosidad) | 450 |
| `batteryVoltage` | number | Voltaje de la batería en voltios | 12.5 |
| `lamp` | boolean | Estado de la lámpara (true=encendida, false=apagada) | true |
| `autoMode` | boolean | Modo automático activo | true |
| `manualStatus` | boolean | Estado manual (si aplica) | false |
| `panelId` | number \| string | **CRÍTICO**: ID del panel/dispositivo para vincular con dispositivos | 1 |
| `batteryId` | number \| string | **CRÍTICO**: ID de la batería para vincular con baterías | 1 |
| `luminariaId` | number \| string | **CRÍTICO**: ID de la luminaria para vincular con luminarias | 1 |
| `energiaGenerada` | number | Energía generada en watts | 850 |

## Mapeo en el Frontend

La telemetría se conecta con las entidades así:

### Dispositivos
- Búsqueda por: `panelId` = `dispositivo.id` o `dispositivo.device_id`
- Campos mostrados: `ldr`, `batteryVoltage`, `timestamp`

### Sensores
- Búsqueda por: `panelId` = `sensor.id_dispositivo`
- Campos mostrados: `ldr`, `timestamp`

### Baterías
- Búsqueda por: `batteryId` = `bateria.id_bateria`
- Campos mostrados: `batteryVoltage`, `timestamp`

### Luminarias
- Búsqueda por: `luminariaId` = `luminaria.id_luminaria`
- Campos mostrados: `energiaGenerada`, `lamp`, `timestamp`

## Flujo de datos

```
ESP32 → Backend (/api/solar/telemetry) → Frontend (TelemetryService)
  ↓                                          ↓
  Captura valores (LDR, voltaje, etc)     Normaliiza JSON
  Vincula con panelId, batteryId,    →    Mapea en componentes
  luminariaId                              por IDs coincidentes
                                           ↓
                                    Muestra en:
                                    - Dispositivos (LDR, Voltaje)
                                    - Sensores (LDR)
                                    - Baterías (Voltaje)
                                    - Luminarias (Energía, Estado)
```

## Actualización en tiempo real

El frontend realiza `cargarTelemetria()` cada **5 segundos** en los componentes:
- Dispositivos
- Sensores
- Baterías
- Luminarias

Por lo tanto, el backend debe estar listo para responder consultas frecuentes a `/api/solar/telemetry`.

## Ejemplo de implementación en Python (Django)

```python
# models.py
class SolarTelemetry(models.Model):
    id = models.AutoField(primary_key=True)
    timestamp = models.DateTimeField(auto_now_add=True)
    ldr = models.FloatField(null=True, blank=True)
    batteryVoltage = models.FloatField(null=True, blank=True)
    lamp = models.BooleanField(default=False)
    autoMode = models.BooleanField(default=True)
    manualStatus = models.BooleanField(default=False)
    panelId = models.IntegerField(null=True, blank=True)  # device.id
    batteryId = models.IntegerField(null=True, blank=True)  # bateria.id_bateria
    luminariaId = models.IntegerField(null=True, blank=True)  # luminaria.id_luminaria
    energiaGenerada = models.FloatField(null=True, blank=True)

# serializers.py
class SolarTelemetrySerializer(serializers.ModelSerializer):
    class Meta:
        model = SolarTelemetry
        fields = ['id', 'timestamp', 'ldr', 'batteryVoltage', 'lamp', 
                  'autoMode', 'manualStatus', 'panelId', 'batteryId', 
                  'luminariaId', 'energiaGenerada']

# views.py
class SolarTelemetryViewSet(viewsets.ModelViewSet):
    queryset = SolarTelemetry.objects.all().order_by('-timestamp')
    serializer_class = SolarTelemetrySerializer
```

## Notas importantes

1. **El campo `timestamp` debe ser ISO 8601** para que JavaScript lo parseee correctamente
2. **Los IDs deben vincular correctamente** con `dispositivos`, `baterías` y `luminarias`
3. **Envíar los últimos registros** ordenados por `timestamp` descendente
4. **El frontend espera un arreglo** (o un objeto con propiedad `data` que sea un arreglo)
