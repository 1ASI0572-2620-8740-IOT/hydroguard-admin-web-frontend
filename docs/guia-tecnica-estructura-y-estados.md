# Guía técnica de estructura, archivos y estados

## 1. Tecnologías y reglas básicas

- Angular y TypeScript para la SPA administrativa.
- Angular Material para controles y navegación.
- Axios para HTTP.
- Signals para estado local de sesión y consultas.
- CSS, sin SCSS.
- Node.js para la API mock.
- JSON como persistencia demostrativa.
- DDD frontend: `domain`, `application`, `infrastructure` y `presentation` por bounded context.

La dirección de dependencias buscada es:

```text
presentation → application → domain ← infrastructure
```

El dominio no importa Angular, Axios ni archivos del mock. Los componentes no llaman a Axios ni leen `db.json`.

## 2. Archivos de la raíz

| Archivo             | Responsabilidad                                                                               |
| :------------------ | :-------------------------------------------------------------------------------------------- |
| `angular.json`      | Configuración de compilación, assets, CSS, presupuesto y reemplazo del entorno de desarrollo. |
| `package.json`      | Scripts, dependencias y versiones compatibles de Node/npm.                                    |
| `package-lock.json` | Resolución exacta de dependencias. Debe conservarse en Git.                                   |
| `proxy.conf.json`   | En desarrollo reenvía `/api` hacia `127.0.0.1:3000`.                                          |
| `vercel.json`       | Compila y publica Angular, reenvía `/api` a Render y configura el fallback SPA.               |
| `render.yaml`       | Blueprint del Web Service que ejecuta la API mock.                                            |
| `tsconfig.json`     | Opciones TypeScript compartidas.                                                              |
| `tsconfig.app.json` | Opciones TypeScript específicas de la aplicación.                                             |
| `.gitignore`        | Excluye dependencias, caché, compilados, archivos temporales e IDE.                           |
| `README.md`         | Instalación, ejecución y resumen del repositorio.                                             |

## 3. `src`: aplicación Angular

### 3.1 Entrada y configuración global

- `src/main.ts`: inicia Angular con el componente raíz y `appConfig`.
- `src/index.html`: documento host de la SPA.
- `src/styles.css`: estilos globales y tema visual compartido.
- `src/app/app.ts`: componente raíz.
- `src/app/app.html`: contiene el punto de montaje del Router.
- `src/app/app.config.ts`: registra Router, HTTP, animaciones, diálogo y proveedores de cada contexto.
- `src/app/app.routes.ts`: define rutas públicas, guard administrativo, layout y lazy loading.

### 3.2 `src/environments`

- `environment.ts`: configuración de producción. Usa `apiUrl: '/api'`.
- `environment.development.ts`: configuración local; también usa `/api`, resuelto por `proxy.conf.json`.

Mantener una ruta relativa evita insertar el dominio del backend en los componentes. En Vercel, `vercel.json` reenvía esa ruta; localmente lo hace el proxy de Angular.

### 3.3 `src/app/core`

Contiene infraestructura transversal que no pertenece a un bounded context.

- `core/http/api-client.ts`: crea la única instancia Axios, establece tiempo de espera, `Content-Type`, token y `X-Correlation-Id`; convierte errores HTTP en `AppHttpError`.
- `core/layout/admin-layout/*`: shell autenticado, barra superior, menú lateral responsive y cierre de sesión.

`AppHttpError.statusCode` utiliza `0` para desconexión y conserva códigos como `401`, `403`, `404`, `409`, `422` y `5xx` para que las páginas muestren mensajes coherentes.

### 3.4 `src/app/shared`

Elementos reutilizables que no contienen reglas de un contexto:

- `presentation/confirmation-dialog`: confirmación para acciones críticas.
- `utils/error-message.ts`: transforma errores conocidos en mensajes para la interfaz.

## 4. Estructura interna de un bounded context

### `domain/models`

Modelos, tipos y estados utilizados por el contexto. Los campos suelen ser `readonly` para evitar mutaciones accidentales.

### `domain/ports`

Clases abstractas que describen operaciones disponibles. Ejemplo: `TreatmentRepository.list()` y `detail()`. Son tokens de inyección y no conocen Axios.

### `application/use-cases`

Una clase por intención: listar, obtener detalle, crear, cerrar o revocar. La página no coordina directamente peticiones complejas.

### `application/state`

Mantiene `data`, carga y error mediante Signals. Las consultas cancelan la solicitud anterior con `AbortController` al refrescar o abandonar la página.

### `infrastructure/http`

Implementa los puertos con Axios. Cuando un contrato difiere del modelo del dominio, utiliza DTO y mapper.

### `presentation`

Contiene páginas, componentes, pipes, validadores, CSS y rutas lazy. Los códigos del backend se traducen aquí; no se cambian los valores enviados por la API.

### Archivo `*.providers.ts`

Vincula el puerto con la implementación Axios. `app.config.ts` agrega estos proveedores al iniciar la aplicación.

## 5. Bounded contexts y archivos importantes

### 5.1 `src/app/iam`

- `admin-session.store.ts`: restaura, valida, expone y elimina la sesión administrativa.
- `admin-auth.guard.ts`: bloquea rutas protegidas y redirige al login.
- `session-storage.repository.ts`: persiste únicamente la sesión en `sessionStorage`.
- `iam-axios.repository.ts`: implementa registro, login, cuentas y códigos.
- `iam-api.dto.ts` y `iam-api.mapper.ts`: frontera entre JSON y dominio.
- `presentation/routes.ts`: `/users`, alta, detalle y primer acceso.

Estados principales:

| Tipo                    | Valores                                      |
| :---------------------- | :------------------------------------------- |
| `UserRole`              | `ADMINISTRATOR`, `OPERATOR`                  |
| `AccountStatus`         | `ACTIVE`, `INACTIVE`                         |
| `FirstAccessCodeStatus` | `ACTIVE`, `USED`, `REVOKED`                  |
| `OperatorProfileStatus` | `PENDING_FIRST_ACCESS`, `ACTIVE`, `INACTIVE` |

Variables de sesión relevantes:

- `id`: usuario autenticado.
- `identifier`: correo del Administrador.
- `organizationId`: empresa desde la que se limita toda consulta.
- `token`: credencial HTTP simulada o real.
- `role`: debe ser `ADMINISTRATOR`.
- `expiresAt`: expiración opcional.

### 5.2 `src/app/device-configuration`

- `domain/models/device.ts`: dispositivo, identidad, disponibilidad y capacidades.
- `domain/models/assignment.ts`: pares disponibles e historial de responsabilidad.
- `domain/models/configuration-version.ts`: versiones operativas publicadas o borradores.
- `infrastructure/http/configuration-api.mapper.ts`: normaliza respuestas del contrato.
- `presentation/components/assignment-manager`: agrega y cierra asignaciones.
- `presentation/routes.ts`: grupos, reservorios, dispositivos y perfiles.

Estados principales:

| Tipo                    | Valores                                                                              |
| :---------------------- | :----------------------------------------------------------------------------------- |
| `OrganizationSegment`   | `TEXTILE`, `HYDROPONIC`                                                              |
| `ResourceStatus`        | `ACTIVE`, `INACTIVE`                                                                 |
| `ReservoirType`         | `SUMP`, `TANK`, `RESERVOIR`                                                          |
| `OperatingEnvironment`  | `INTEGRAL_PRODUCT`, `SIMULATION`, `ACADEMIC_PROTOTYPE`                               |
| `DeviceLifecycleStatus` | `ACTIVE_UNLINKED`, `ACTIVE_UNASSIGNED`, `ACTIVE_ASSIGNED`, `MAINTENANCE`, `INACTIVE` |
| `DeviceAvailability`    | `ONLINE`, `DELAYED`, `OFFLINE`, `UNKNOWN`                                            |
| `DeviceIdentityStatus`  | `PENDING`, `ACTIVE`, `REVOKED`                                                       |
| `ConfigurationStatus`   | `MISSING`, `COMPATIBLE`, `INCOMPATIBLE`                                              |
| Asignación              | `ACTIVE`, `CLOSED`                                                                   |
| Versión                 | `DRAFT`, `PUBLISHED`                                                                 |

Capacidades de dispositivo:

```text
PH_SENSOR | TEMPERATURE_SENSOR | DOSING | HEATING | COOLING | RELEASE_VALVE
```

Campos estructurales importantes:

- `groupId`: grupo al que pertenece el reservorio o perfil.
- `reservoirId`: contenedor vinculado.
- `deviceId`: dispositivo vinculado.
- `operatorProfileId`: responsable administrativo.
- `configurationVersion`: versión aplicada al proceso.
- `activationCredential`: secreto entregado solo en el alta.

### 5.3 `src/app/telemetry`

- `water-measurement.ts`: modelos de medición y snapshot del dispositivo.
- `telemetry.repository.ts`: consultas por dispositivo, fechas, origen y disponibilidad.
- `telemetry-axios.repository.ts`: llamadas a `/v1/telemetry`.
- `telemetry-overview`: tabla global y filtros.
- `device-telemetry-detail`: última medición e historial.

Estados y variables:

| Tipo                    | Valores o significado                     |
| :---------------------- | :---------------------------------------- |
| `MeasurementSource`     | `DEVICE`, `SIMULATOR`                     |
| `TelemetryAvailability` | `ONLINE`, `DELAYED`, `OFFLINE`, `UNKNOWN` |
| `ph`                    | Valor de pH.                              |
| `temperature`           | Temperatura en grados Celsius.            |
| `recordedAt`            | Fecha ISO de medición.                    |
| `lastCommunicationAt`   | Último contacto conocido.                 |

### 5.4 `src/app/water-quality-treatment`

- `treatment.ts`: estados y proyecciones completas del proceso.
- `treatment.repository.ts`: listado y detalle.
- `treatment-axios.repository.ts`: endpoints `/v1/treatments`.
- `treatment-query-state.ts`: carga cancelable y errores.
- `treatment-processes`: búsqueda, filtro y paginación.
- `treatment-process-detail`: configuración, ciclos, decisiones y enlaces.
- `treatment-label.pipe.ts`: traducción de códigos a español.

Estados del proceso:

```text
NOT_STARTED
MEASURING
EVALUATING
PENDING_CORRECTION_APPROVAL
CORRECTING
WAITING
REEVALUATING
READY
RELEASING
FAILED
EMERGENCY
COMPLETED
```

Estados relacionados:

| Tipo                 | Valores                                              |
| :------------------- | :--------------------------------------------------- |
| `ApprovalStatus`     | `NOT_REQUIRED`, `PENDING`, `APPROVED`                |
| `ReleaseMode`        | `MANUAL`, `AUTOMATIC`                                |
| `ReleaseEligibility` | `NOT_ELIGIBLE`, `PENDING_CONFIRMATION`, `AUTHORIZED` |
| Estado de ciclo      | `PENDING`, `EXECUTING`, `CONFIRMED`, `FAILED`        |
| `TreatmentOutcome`   | `INFO`, `SUCCESS`, `WARNING`, `FAILURE`              |

Variables esenciales:

- `currentCycle` y `maximumCycles`: avance y límite absoluto.
- `strategy`: decisión correctiva seleccionada por Treatment.
- `approvalStatus`: aprobación única del Operario.
- `waitingMinutes`: intervalo antes de reevaluar.
- `releaseEligibility`: si el backend permite liberar.
- `failureReason` y `emergencyReason`: causas independientes.
- `events`: cronología de decisiones del proceso.

### 5.5 `src/app/operational-monitoring`

- `monitoring.ts`: alertas, incidentes, estado operacional, trazabilidad y reportes.
- `monitoring.repository.ts`: puerto de consulta y comandos simples.
- `monitoring-axios.repository.ts`: llamadas HTTP.
- `monitoring-dashboard`: resumen y dispositivos que requieren atención.
- `operational-alerts`: filtros y atención de alertas.
- `quality-incidents`: registro y cierre simple.
- `traceability`: línea temporal y exportación CSV.

Estados principales:

| Tipo                | Valores                                 |
| :------------------ | :-------------------------------------- |
| `AlertSeverity`     | `LOW`, `MEDIUM`, `HIGH`, `CRITICAL`     |
| `AlertStatus`       | `ACTIVE`, `ACKNOWLEDGED`, `RESOLVED`    |
| `IncidentType`      | `QUALITY_INCIDENT`, `MONITORING_LOSS`   |
| `IncidentStatus`    | `OPEN`, `CLOSED`                        |
| `StatusView`        | `UPDATED`, `OUTDATED`                   |
| Resultado de evento | `INFO`, `SUCCESS`, `WARNING`, `FAILURE` |

`correlationId` conecta medición, alerta, ciclo, incidente y liberación. `cycleId` identifica un ciclo cuando aplica. El cierre de un incidente establece `closedAt` y agrega el evento `INCIDENT_CLOSED`.

## 6. Estado de presentación

`QueryState<T>` utilizado por Configuration distingue:

```text
initial | loading | refreshing | success | offline | forbidden | notFound | failure
```

- `data`: último resultado válido o `null`.
- `status`: estado explícito de la consulta.
- `error`: texto que puede mostrarse.
- `loading`: signal calculado para carga inicial o actualización.

Telemetry, Treatment y Monitoring usan variantes más pequeñas con `data`, `loading` y `error`. Todas cancelan la petición reemplazada. Los formularios mantienen además estados locales como envío, confirmación y resultado.

Las colecciones paginadas comparten normalmente:

- `items`: filas actuales.
- `total`: cantidad global.
- `page`: página basada en uno.
- `pageSize`: tamaño solicitado.
- `searchTerm`, `status`, `sortBy` y `sortDirection`: parámetros opcionales.

## 7. `mock-api`

### Archivos principales

- `server.mjs`: servidor HTTP, CORS, autenticación simulada, sesión, cola de escritura y rutas IAM.
- `db.json`: semilla y almacenamiento mutable durante la ejecución.
- `configuration/*.mjs`: grupos, reservorios, dispositivos, perfiles y helpers.
- `telemetry/routes.mjs`: resumen, última lectura e historial.
- `treatment/routes.mjs`: listado y detalle de procesos.
- `monitoring/routes.mjs`: resumen, alertas, incidentes, trazabilidad y reporte.

`PORT` lo asigna Render o utiliza `3000`. `HOST` utiliza `127.0.0.1` localmente y `0.0.0.0` en Render. `MOCK_DB_PATH` permite probar sobre una copia descartable sin alterar la semilla.

Las escrituras se serializan mediante `requestQueue` para evitar que dos solicitudes modifiquen simultáneamente el archivo. Esto ayuda al mock, pero no sustituye transacciones ni una base de datos productiva.

## 8. `scripts`

- `verify-bc02.mjs`: verifica Configuration, Device Identity administrativo, aislamiento e historial.
- `verify-bc04.mjs`: verifica Treatment, estados, detalle y aislamiento.
- `verify-bc05.mjs`: verifica Monitoring, alertas, incidentes, trazabilidad y reportes.

Cada script copia la semilla a un directorio temporal, inicia el mock en un puerto libre, ejecuta solicitudes HTTP y elimina la copia. Por eso no altera `mock-api/db.json`.

## 9. Carpetas generadas que no pertenecen al código fuente

- `node_modules`: dependencias instaladas; se reconstruye con `npm ci`.
- `.angular`: caché de Angular; se regenera al compilar.
- `dist`: salida de `npm run build`.
- `tmp`: copias de base usadas por pruebas manuales.

Todas están ignoradas por Git. `.angular`, `dist` y `tmp` pueden eliminarse al limpiar el proyecto. `node_modules` puede conservarse para evitar reinstalar dependencias y nunca debe subirse.

## 10. Recorrido recomendado para comprender el código

1. Leer `app.routes.ts` para conocer navegación y lazy loading.
2. Leer `app.config.ts` para identificar qué implementación satisface cada puerto.
3. Elegir un contexto y comenzar por `domain/models`.
4. Revisar el puerto y un caso de uso.
5. Seguir hacia el repositorio Axios.
6. Revisar la página que invoca el caso de uso.
7. Localizar el endpoint equivalente dentro de `mock-api`.
8. Ejecutar el script `verify:bcXX` correspondiente.

Este recorrido permite entender una funcionalidad completa sin mezclar las reglas del dominio con detalles visuales o de transporte.
