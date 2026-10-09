# Arquitectura y flujos de HydroGuard Admin Web

## 1. Propósito y alcance

HydroGuard Admin Web es la aplicación Angular utilizada por el único Administrador de cada organización. Su responsabilidad es preparar la estructura operativa y supervisar lo que ocurre con los dispositivos, las mediciones, los tratamientos y los incidentes. No reemplaza la aplicación móvil del Operario ni ejecuta directamente una dosificación, una liberación o una parada de emergencia.

La solución admite dos segmentos organizacionales: producción textil e hidroponía. Ambos comparten el mismo modelo técnico y se aíslan mediante `organizationId`; cambian los nombres visibles, la clasificación del grupo, los rangos y las reglas operativas.

El frontend actualmente trabaja contra una API mock compatible con la ruta `/api/v1`. Este mock permite validar los contratos y flujos antes de disponer del backend real.

## 2. Actores y responsabilidades

### Administrador

Es el usuario directo de esta aplicación. Existe uno por organización y puede:

- Registrar la empresa y su cuenta administrativa.
- Iniciar y cerrar sesión.
- Crear y desactivar cuentas de Operario.
- Crear grupos, reservorios y dispositivos.
- Vincular un dispositivo con un reservorio.
- Crear perfiles de Operario y asignar unidades operativas disponibles.
- Generar, revocar y reemplazar códigos de primer acceso.
- Consultar configuraciones publicadas por los Operarios.
- Supervisar telemetría, tratamientos, alertas, incidentes y trazabilidad.
- Generar un reporte CSV sencillo.

No puede aprobar tratamientos, liberar agua, activar una emergencia ni restablecer el proceso desde la web.

### Operario

Interviene indirectamente en la web porque el Administrador crea su cuenta, perfil y asignaciones. Su canal operativo será la aplicación móvil Flutter. El Operario:

- Pertenece a un solo grupo.
- Puede administrar uno o más pares reservorio-dispositivo de ese grupo.
- Completa la configuración operativa desde la aplicación móvil.
- Aprueba una sola vez la estrategia seleccionada al comenzar un tratamiento.
- Confirma la liberación cuando el modo es manual.
- Puede ordenar una parada de emergencia y solicitar el restablecimiento permitido.

Estas acciones móviles todavía no se ejecutan desde este repositorio; sus efectos se representan mediante los datos de Treatment y Monitoring del mock.

### Dispositivo y simulador

El ESP32 físico o el simulador Wokwi produce mediciones de pH y temperatura y recibe las actuaciones ordenadas por el backend. En el producto integral, una actuación representa dosificación o control térmico real. En el prototipo académico, un LED indica que la actuación está ocurriendo mientras una persona realiza la corrección sustitutiva.

### Laptop como capa Edge

La laptop alojará un HydroGuard Edge Agent con el siguiente flujo previsto:

```text
ESP32 o Wokwi → HydroGuard Edge Agent en laptop → HTTPS/REST → backend en la nube
```

El agente Edge recibirá mediciones y heartbeat, usará la credencial técnica del dispositivo, reenviará la información y consultará comandos pendientes. No decidirá la conformidad del agua: Treatment es responsable de esa decisión. Edge y firmware quedan fuera del código actual del frontend.

### Backend o mock API

Es la autoridad de los datos y reglas. El frontend nunca debe inferir que una dosificación terminó ni que el agua puede liberarse. Durante el desarrollo, `mock-api/server.mjs` simula esta responsabilidad mediante `db.json`. En producción, el backend real reemplazará el mock sin modificar las páginas si conserva los contratos.

## 3. Vista general de arquitectura

```text
┌────────────────────────────────────────────────────────────┐
│ Navegador del Administrador                                │
│ Angular + Angular Material + Router                        │
│                                                            │
│ IAM │ Configuration │ Telemetry │ Treatment │ Monitoring   │
└───────────────────────────┬────────────────────────────────┘
                            │ Axios / HTTPS / JSON
                            │ Authorization + X-Correlation-Id
                            ▼
┌────────────────────────────────────────────────────────────┐
│ API /api/v1                                                │
│ Mock Node.js actualmente / backend real posteriormente     │
└──────────┬───────────────┬───────────────┬─────────────────┘
           │               │               │
           ▼               ▼               ▼
      Persistencia     Servicios de     Edge Agent
      por contexto     notificación     en laptop
      futura           futuros          futuro
```

La aplicación es una SPA. Angular controla las rutas después de cargar `index.html`. Vercel entrega los archivos estáticos y reenvía `/api/*` hacia el mock de Render. La última regla de `vercel.json` devuelve `index.html` para que una actualización directa de `/users` o `/treatments` siga siendo interpretada por Angular Router.

## 4. Arquitectura interna del frontend

Cada bounded context conserva cuatro capas:

```text
presentation → application → domain
                       ↑
                infrastructure
```

- **Presentation:** páginas, componentes, formularios, navegación y traducción de estados.
- **Application:** casos de uso y estado de consultas. Coordina una intención del usuario.
- **Domain:** modelos y puertos. Define el vocabulario estable sin depender de Angular, Axios o del mock.
- **Infrastructure:** DTO, mappers, almacenamiento y repositorios Axios que implementan los puertos.

La inyección configurada en `app.config.ts` conecta cada puerto abstracto con su repositorio concreto. Una página invoca un caso de uso; el caso de uso depende del puerto; el adaptador Axios llama a `/api/v1`; y el resultado vuelve transformado hacia la presentación.

## 5. Bounded contexts implementados

### 5.1 Identity and Access Management

Gestiona el registro conjunto de organización y Administrador, autenticación, cuentas de Operario y códigos de primer acceso. La sesión contiene `token`, `organizationId`, rol y vencimiento opcional. La web rechaza una sesión cuyo rol no sea `ADMINISTRATOR`.

El token se conserva en `sessionStorage`, por lo que cerrar la pestaña elimina la sesión local. Axios lo añade como `Authorization: Bearer <token>` en cada solicitud protegida.

### 5.2 Device and Operational Configuration

Administra la estructura organizacional y operativa:

```text
Organización
└── Grupo
    ├── Perfiles de Operario
    └── Reservorios
        └── un Dispositivo
            └── cero o un Operario responsable
```

También incorpora temporalmente la parte administrativa de Device Identity and Access: al registrar un dispositivo se entrega una credencial técnica una sola vez y posteriormente puede revocarse. No se muestra de nuevo el secreto.

### 5.3 IoT Telemetry and Device Integration

Presenta disponibilidad, última comunicación, última medición e historial de pH y temperatura. Distingue datos del dispositivo físico y del simulador. Es de solo lectura para el Administrador y no determina conformidad.

### 5.4 Water Quality Treatment and Release

Explica las decisiones del tratamiento sin permitir control administrativo. La vista global filtra procesos; el detalle presenta configuración, medición inicial y actual, estrategia, aprobación, ciclos, elegibilidad de liberación, fallo, emergencia y cronología.

La máquina de estados contractual es:

```text
NOT_STARTED → MEASURING → EVALUATING
                           ├── READY → RELEASING → COMPLETED
                           └── PENDING_CORRECTION_APPROVAL
                               → CORRECTING → WAITING → REEVALUATING
                                  ├── CORRECTING (otro ciclo ya aprobado)
                                  ├── READY
                                  ├── FAILED
                                  └── EMERGENCY
```

El Operario aprueba la estrategia una sola vez. Después, el backend puede continuar ciclos automáticamente hasta `READY`, `FAILED` o `EMERGENCY`. Una liberación manual solo puede confirmarse cuando el backend indique que el agua está lista.

### 5.5 Operational Monitoring and Traceability

Consolida el estado de los dispositivos, alertas, incidentes, trazabilidad y reportes. Para mantener el proyecto académico simple:

- Una alerta puede pasar de `ACTIVE` a `ACKNOWLEDGED`; `RESOLVED` queda representado en el contrato.
- Un incidente se registra manualmente y solo utiliza `OPEN → CLOSED`.
- Cerrar un incidente genera un evento de trazabilidad.
- El reporte se genera y descarga inmediatamente en CSV.
- No existen responsables de incidentes, comentarios, SLA, escalamiento ni reapertura.

## 6. Flujo administrativo completo

### 6.1 Registro e ingreso

1. El Administrador registra organización, segmento, RUC, teléfono, nombre, correo y contraseña.
2. La API crea organización y Administrador como una unidad.
3. El Administrador inicia sesión.
4. El frontend guarda la sesión y el guard habilita el layout administrativo.
5. La API deriva la organización del token; las páginas no envían un `organizationId` confiable elegido por el navegador.

### 6.2 Preparación de la unidad operativa

1. Crear un grupo.
2. Crear uno o más reservorios dentro del grupo.
3. Registrar cada dispositivo y copiar la credencial mostrada una sola vez.
4. Vincular un dispositivo libre con un reservorio libre.
5. Verificar que la unidad esté activa y disponible para asignación.

Un reservorio tiene un dispositivo y un dispositivo tiene como máximo un reservorio activo.

### 6.3 Incorporación del Operario

1. Crear la cuenta con identificador y contraseña definitiva.
2. Crear el Perfil de Operario seleccionando su único grupo.
3. Asignar uno o más pares reservorio-dispositivo disponibles del mismo grupo.
4. Generar el código de primer acceso cuando el perfil ya esté completo.
5. Copiar y enviar externamente código, identificador y contraseña.
6. El futuro flujo móvil consume el código una sola vez y activa el perfil.

### 6.4 Desvinculación y reasignación

1. Cerrar la asignación existente desde el perfil anterior.
2. El par queda sin responsable, pero conserva el historial.
3. Abrir el perfil del nuevo Operario.
4. Agregar manualmente el par disponible.

No existe transferencia automática ni responsabilidad compartida.

### 6.5 Supervisión

1. Telemetry muestra disponibilidad y mediciones.
2. Treatment muestra la decisión y el progreso del proceso.
3. Monitoring muestra alertas e incidentes y correlaciona los eventos.
4. El Administrador puede atender una alerta, registrar o cerrar un incidente y descargar trazabilidad.
5. Las acciones operativas permanecen en la aplicación móvil.

## 7. Dependencias entre contextos

| Origen        | Dependencia conceptual | Uso                                                                |
| :------------ | :--------------------- | :----------------------------------------------------------------- |
| IAM           | Organización y cuenta  | Proporciona sesión, rol y aislamiento.                             |
| Configuration | IAM                    | Asocia perfiles con cuentas de Operario.                           |
| Configuration | Device Identity        | Registra, activa y revoca la identidad técnica.                    |
| Telemetry     | Configuration          | Identifica dispositivo, entorno y reservorio.                      |
| Treatment     | Configuration          | Usa la versión de rangos, estrategia, espera, ciclos y liberación. |
| Treatment     | Telemetry              | Evalúa mediciones y confirma actuaciones.                          |
| Monitoring    | Todos                  | Construye alertas, incidentes, vistas y trazabilidad.              |

En el frontend estas dependencias son de información, no importaciones entre adaptadores. Cada contexto consulta su propio contrato. Los enlaces entre páginas utilizan identificadores como `deviceId` o `processId`.

## 8. Seguridad y aislamiento

- Solo `ADMINISTRATOR` entra al layout web.
- El token vive en `sessionStorage`; nunca se guarda una contraseña.
- Axios envía token y `X-Correlation-Id`.
- La API debe obtener `organizationId` desde la sesión.
- El mock filtra todos los recursos por organización.
- Las bajas son lógicas cuando existe trazabilidad.
- La credencial de dispositivo se entrega una sola vez.
- El mock es demostrativo: no debe considerarse seguro ni utilizarse con datos reales.

## 9. Despliegue académico

- **Vercel:** compila Angular y publica `dist/hydroguard-admin-web-frontend/browser`.
- **Render:** ejecuta `npm run mock:api` usando el Blueprint `render.yaml`.
- **Proxy:** Vercel reenvía `/api/*` hacia Render para mantener el mismo contrato relativo utilizado localmente.
- **Persistencia:** el plan gratuito de Render utiliza almacenamiento efímero; un reinicio restaura la semilla incluida en el despliegue.

En producción, Render y `db.json` deben reemplazarse por los servicios backend y bases de datos reales. El contrato `/api/v1` y los puertos del frontend permiten hacerlo sin cambiar las páginas.

## 10. Qué está implementado y qué no

Actualmente están implementados el frontend administrativo, el mock contractual, el aislamiento simulado, las consultas de telemetría, la supervisión de Treatment y el Monitoring simple.

Permanecen fuera de este repositorio:

- Aplicación Flutter del Operario.
- Backend productivo y sus bases de datos.
- Motor ejecutable de Treatment.
- HydroGuard Edge Agent en la laptop.
- Firmware ESP32 y simulación Wokwi integrada.
- Firebase Cloud Messaging.
- Dosificación, actuación térmica y válvula reales.

La guía manual indica cómo probar solamente las capacidades disponibles y evita presentar los datos mock como procesos físicos ejecutados.
