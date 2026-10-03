# Guía de pruebas — Operational Monitoring and Traceability (BC-05)

## Inicio local

En dos terminales, desde la raíz del frontend:

```powershell
npm run mock:api
npm start
```

Abra `http://localhost:4200` e ingrese con una cuenta administradora de demostración:

| Organización | Usuario                      | Contraseña         |
| ------------ | ---------------------------- | ------------------ |
| Textil       | `admin.textil@hydroguard.pe` | `adminpassword123` |
| Hidropónica  | `admin.hidro@hydroguard.pe`  | `adminpassword123` |

## Verificación automática

```powershell
npm run build -- --configuration development
npm run verify:bc05
```

La verificación crea una copia temporal de la base mock y comprueba autenticación administrativa, aislamiento entre organizaciones, resumen operacional, filtros de alertas, atención de alertas, registro de incidentes, correlación de eventos, generación de reportes y rechazo de reportes sin datos. La base de desarrollo no se modifica.

## Recorrido funcional

1. Abra **Estado operacional** y compruebe indicadores, última medición, estado del proceso, disponibilidad y alertas por dispositivo.
2. Abra **Alertas**, filtre por severidad y marque una alerta activa como atendida.
3. Abra **Incidentes**, registre una condición de calidad o pérdida de monitoreo y búsquela en el historial.
4. Abra **Trazabilidad**, seleccione un dispositivo y un periodo. Compruebe que cada medición, corrección y liberación comparte su correlación y ciclo cuando corresponde.
5. Genere el reporte y expórtelo como CSV. Un periodo sin eventos debe mostrar un error de información insuficiente.
6. Cierre sesión, ingrese con la otra organización y confirme que no aparecen dispositivos, alertas ni incidentes de la primera.

## Contratos HTTP

Todas las rutas requieren una sesión administradora y usan el prefijo `/api/v1`.

| Método y recurso                           | Uso                                                     |
| ------------------------------------------ | ------------------------------------------------------- |
| `GET /monitoring/overview`                 | Indicadores, vistas de dispositivo y alertas recientes. |
| `GET /monitoring/alerts`                   | Alertas paginadas por estado, severidad y búsqueda.     |
| `PATCH /monitoring/alerts/:id/status`      | Marca una alerta activa como atendida.                  |
| `GET /monitoring/incidents`                | Incidentes paginados por tipo, estado y búsqueda.       |
| `POST /monitoring/incidents`               | Registra un incidente vinculado con su correlación.     |
| `GET /monitoring/devices/:id/traceability` | Línea temporal correlacionada dentro de un periodo.     |
| `POST /monitoring/reports/generate`        | Genera el consolidado exportable del periodo.           |

Los recursos de otra organización responden `404`; una sesión de operario recibe `403`; datos inválidos reciben `422`.
