# Guía de desarrollo de aplicaciones frontend — HydroGuard

## 1. Propósito

Esta guía organiza el desarrollo frontend de HydroGuard en dos aplicaciones independientes según el rol y el contexto de uso:

- **Aplicación móvil para el Operario:** desarrollada con Flutter y Dart, utilizando el patrón BLoC. Está orientada a la intervención directa sobre el dispositivo y el proceso de tratamiento.
- **Aplicación web para el Administrador:** desarrollada con Angular y TypeScript, organizada con DDD por bounded context. Está orientada a la administración, configuración base y supervisión global.

Las aplicaciones consumen los mismos contratos del backend, pero no ofrecen las mismas funciones. La separación evita que el Operario reciba herramientas administrativas innecesarias y que el Administrador ejecute accidentalmente acciones operativas sobre un dispositivo.

### Estado de esta guía

Revisión de alineación realizada el **21 de octubre de 2026** contra ambos frontends, el Mock API y la arquitectura vigente del informe:

- La aplicación web administrativa y sus cinco módulos funcionales están implementados.
- Device Identity and Access se presenta dentro del flujo administrativo de Dispositivos, aunque conserva su límite de dominio y sus datos propios.
- El Mock API implementa los contratos web actuales bajo `/api/v1`.
- La aplicación móvil Flutter cuenta con base Material 3, navegación protegida, DDD por bounded context, BLoC por feature y consumo HTTP de los contratos mock de Operario.
- `db.json` es una fixture interna del mock. Flutter y Angular solo pueden depender de respuestas HTTP, nunca de sus colecciones internas.
- Cuando esta guía distingue **implementado** y **requerido para Flutter**, esa distinción tiene prioridad sobre ejemplos históricos o estructuras propuestas anteriormente.

## 2. Modelo operativo y flujo completo de incorporación

HydroGuard es una plataforma multiempresa. Cada empresa registra un único Administrador, quien prepara toda su estructura operativa desde la aplicación web antes de entregar acceso a un Operario. El Operario recibe externamente su identificador, su contraseña definitiva y un código de primer acceso. La aplicación móvil valida los tres datos en una única operación, activa el perfil e inicia la primera sesión; después el Operario completa la configuración operativa de los reservorios y dispositivos que ya le fueron asignados.

La aplicación web ofrece un registro público de empresa. En una única operación se registran el nombre, RUC, teléfono y único segmento de la empresa, junto con el nombre, correo y contraseña definitiva de su Administrador. Pueden registrarse varias empresas, pero cada una conserva exactamente un Administrador. El correo es el identificador de acceso y debe ser único porque el inicio de sesión no solicita un código de empresa. El formulario no permite seleccionar roles.

El backend debe crear empresa y Administrador dentro de una misma transacción, rechazar un RUC o correo duplicado y asociar ambos mediante `organizationId`. Tras autenticarse, el `organizationId` se obtiene de la sesión; no se acepta como autoridad un valor enviado por el cliente. El RUC y el teléfono solo se capturan durante el registro en este alcance y todavía no se reutilizan en otras pantallas.

### Estructura y cardinalidades

```text
Organización
└── Grupo de trabajo
    ├── Perfil de Operario
    │   └── Operario
    └── uno o varios Reservorios
        └── un Dispositivo por reservorio
            └── cero o un Operario responsable
```

| Relación | Regla acordada |
|:--|:--|
| Organización → Administrador | Cada organización tiene exactamente un Administrador. |
| Organización → grupos | La organización puede tener uno o varios grupos. |
| Grupo → Operarios | Un grupo puede tener uno o varios Operarios. |
| Operario → grupo | Cada Operario pertenece a un solo grupo. |
| Grupo → reservorios | Un grupo tiene uno o varios reservorios. |
| Reservorio → dispositivo | Cada reservorio tiene exactamente un dispositivo activo. |
| Dispositivo → reservorio | Cada dispositivo está vinculado a un solo reservorio. |
| Operario → dispositivos | Un Operario puede manejar uno o varios dispositivos dentro de su grupo. |
| Dispositivo → Operario | Un dispositivo tiene como máximo un Operario responsable; nunca se comparte. |

El término **reservorio** representa el contenedor controlado. Según el segmento, la interfaz podrá mostrar “fosa”, “tanque” o “reservorio”, pero el contrato conservará un identificador general `reservoirId` y un tipo de reservorio.

### Diferencia entre perfil y configuración

- **Perfil de Operario:** registro administrativo creado antes del primer acceso. Contiene la cuenta, el grupo y las asignaciones de reservorio-dispositivo.
- **Configuración operativa:** reglas que el Operario completa desde Flutter para cada par reservorio-dispositivo: rangos, estrategia, dosis o intensidad, espera, límite de ciclos y modo de liberación.

El Perfil de Operario puede contener varias asignaciones cuando la misma persona gestiona más de un reservorio. Cada asignación conserva su propia configuración versionada para evitar que un cambio en un reservorio altere otro proceso.

### Flujo del Administrador en la aplicación web

1. **Crear el grupo de trabajo.** Registra nombre, propósito, segmento y, para hidroponía, el tipo de planta o cultivo cuando corresponda.
2. **Registrar el reservorio.** Define nombre, código interno, tipo, ubicación y grupo. La capacidad es opcional mientras no se utilice para calcular dosis.
3. **Registrar, activar y provisionar el dispositivo.** Registra número de serie, alias, modelo, entorno y capacidades. El backend crea su identidad técnica vinculada con la organización, lo deja en `ACTIVE_UNLINKED` y devuelve la credencial una sola vez. El Administrador debe copiarla antes de continuar; la disponibilidad `ONLINE` u `OFFLINE` se controla por separado.
4. **Vincular dispositivo y reservorio.** El sistema rechaza la operación si alguno ya posee una vinculación activa. El dispositivo pasa a `ACTIVE_UNASSIGNED`.
5. **Comprobar la unidad operativa.** El Administrador verifica que el reservorio y su dispositivo estén activos antes de crear el perfil.
6. **Crear la cuenta del Operario.** El Administrador define nombre, identificador de acceso y la contraseña definitiva. El Operario no tendrá que cambiarla durante este alcance.
7. **Crear el Perfil de Operario.** Selecciona el único grupo al que pertenecerá la persona y agrega uno o varios pares reservorio-dispositivo disponibles de ese grupo.
8. **Generar el código de primer acceso.** El sistema crea un código único asociado a la cuenta y al perfil completo.
9. **Entregar el acceso externamente.** El sistema no envía invitaciones durante este alcance; el Administrador comunica el código, el identificador y la contraseña definitiva por el medio que considere apropiado. El código permite el primer ingreso directo y las credenciales se utilizan en accesos posteriores.
10. **Supervisar la activación.** El perfil permanece `PENDING_FIRST_ACCESS` hasta que el Operario use el código.

El Administrador no puede generar el código si falta la cuenta, el grupo, al menos un reservorio o su dispositivo vinculado. Tampoco puede asignar al perfil un dispositivo que ya tenga otro responsable.

### Primer acceso del Operario en Flutter

1. El Operario abre “Ingresar con código”.
2. Introduce el identificador, la contraseña definitiva y el código recibidos del Administrador.
3. El backend autentica las credenciales humanas y valida que el código pertenezca a esa misma cuenta y organización, esté `ACTIVE` y que el perfil continúe completo.
4. La aplicación muestra la organización, grupo y los reservorios-dispositivos asignados para que el Operario compruebe el contexto.
5. Al confirmar, una operación transaccional marca el código como `USED`, activa el perfil y devuelve una sesión con rol `OPERATOR`.
6. La app muestra todos sus reservorios; no se solicita cambio de contraseña.
7. El Operario selecciona cada reservorio y completa su configuración operativa.
8. Hasta publicar una configuración válida, puede consultar el dispositivo, pero no iniciar un proceso de tratamiento.

Para simplificar el prototipo, el código no vence por tiempo. Sigue siendo de un solo uso y el Administrador puede revocarlo o generar otro mientras no haya sido utilizado. Los accesos posteriores se realizan únicamente con el identificador y la contraseña definitiva creada por el Administrador. El código no sustituye a la contraseña ni funciona por sí solo como credencial suficiente.

### Desvinculación y reasignación

- Desvincular un reservorio-dispositivo cierra la asignación vigente y lo deja `UNASSIGNED`.
- No existe transferencia automática entre Operarios.
- Para reasignarlo, el Administrador abre el perfil del nuevo Operario y agrega manualmente el par disponible.
- La asignación anterior permanece en el historial y no se sobrescribe.
- La ausencia, suplencia o delegación temporal queda fuera del alcance.
- Usuarios, grupos, reservorios, dispositivos y perfiles se desactivan mediante eliminación lógica; no se borran si tienen trazabilidad.

### Visibilidad dentro del grupo

El Operario puede ver los nombres de los demás integrantes de su grupo y qué reservorio tiene asignado cada uno. No puede consultar detalles operativos, configuración, mediciones ni ejecutar comandos sobre dispositivos ajenos.

### Separación por aplicación

| Aspecto | Aplicación móvil del Operario | Aplicación web del Administrador |
|:--|:--|:--|
| Usuario | Operario de un grupo con uno o más reservorios-dispositivos asignados. | Único Administrador de su empresa, sin dispositivo propio. |
| Propósito | Completar configuraciones y operar directamente sus reservorios. | Preparar grupos, cuentas, reservorios, dispositivos, perfiles y supervisar el sistema. |
| Tecnología | Flutter y Dart. | Angular y TypeScript. |
| Patrón principal | BLoC por feature. | DDD frontend por bounded context. |
| Comunicación HTTP | `package:http` versión `^1.6.0`, encapsulado en un cliente compartido y datasources tipados. | Axios con interceptores. |
| Alcance de datos | Sus asignaciones y la identificación básica de los integrantes del grupo. | Todos los usuarios, grupos, reservorios, dispositivos, procesos e incidentes de su empresa. |
| Acciones críticas | Configurar, aprobar una vez el tratamiento, liberar manualmente, emergencia y restablecimiento. | Registrar y provisionar dispositivos, vincular, asignar, revocar identidad, generar código y supervisar. |
| Presentación | Uso rápido en campo, selector de reservorio y prioridad operativa. | Tablas, filtros, formularios administrativos y vistas comparativas. |

No se implementará una interfaz única que cambie completamente según el rol. Cada aplicación tendrá su propio repositorio o proyecto, navegación, despliegue y ciclo de entrega.

## 3. Alcance del sprint

### Incluido

- Estructura inicial de ambas aplicaciones.
- Funciones frontend relacionadas con los seis bounded contexts. Device Identity and Access se expone dentro del flujo de Dispositivos, no como un menú o feature principal independiente.
- Separación estricta entre las capacidades del Operario y del Administrador.
- Material Design como lenguaje visual común.
- Angular Material para la aplicación web.
- Widgets Material de Flutter para la aplicación móvil.
- Integración desacoplada con API mediante `package:http ^1.6.0` en Flutter y Axios en Angular.
- Backend mock contractual mediante `mock-api/server.mjs` y `db.json`.
- Estados de carga, contenido vacío, error, desconexión y falta de permisos.
- Propuesta inicial de pantallas y navegación, pendiente de observaciones antes de formalizar diseños en Figma.

### Excluido

- Landing page, porque ya fue desarrollada.
- Pruebas unitarias durante este sprint.
- Backend productivo, Edge API, firmware y simulación Wokwi.
- Implementación de reglas de dosificación, conformidad o autorización dentro de las aplicaciones.
- Diseño visual definitivo en Figma.

## 4. Principios funcionales compartidos

1. El backend es la autoridad sobre estado, ciclos, dosificación, fallos y liberación.
2. Las aplicaciones muestran decisiones del dominio; no intentan reproducirlas localmente.
3. Cada acción remota debe indicar progreso, aceptación, rechazo o fallo.
4. Un comando aceptado no equivale a una actuación completada.
5. Las acciones críticas no admiten doble envío.
6. La válvula se presenta cerrada salvo cuando exista una liberación autorizada.
7. Una actuación confirmada no significa que el agua sea conforme; se debe esperar la reevaluación.
8. Los términos visibles deben coincidir con el Ubiquitous Language del README.
9. Las dos aplicaciones deben distinguir `PRODUCTO_INTEGRAL`, `SIMULACION` y `PROTOTIPO_ACADEMICO`.
10. La intervención manual se describe únicamente como sustitución demostrativa del prototipo académico.
11. Treatment selecciona la estrategia; el Operario la aprueba una sola vez antes del primer ciclo y los ciclos posteriores continúan automáticamente hasta `READY` o `FAILED`.
12. Ninguna actuación se ordena en `PENDING_CORRECTION_APPROVAL` y el Operario nunca puede liberar agua que el backend no haya marcado `READY`.
13. Los dispositivos usan HTTPS/REST con un **HydroGuard Edge Agent ejecutado en la laptop**; MQTT queda fuera del alcance actual.
14. FCM transporta notificaciones móviles, pero la alerta persistida por Monitoring sigue siendo la fuente de verdad.

### Capa Edge académica acordada

El flujo de demostración será `ESP32 o Wokwi → HydroGuard Edge Agent en la laptop → HTTPS/REST → backend en la nube`. El agente recibe mediciones y heartbeat, se autentica con la credencial técnica del dispositivo, los reenvía al backend y consulta comandos pendientes para devolver su confirmación. No evalúa conformidad ni decide tratamientos: esas reglas pertenecen al backend. Para este alcance no se añaden MQTT, colas locales avanzadas, sincronización bidireccional en tiempo real ni una interfaz administrativa propia para Edge.

Esta decisión no agrega una pantalla a Angular. Mientras no exista el agente ni el backend real, Telemetry y Treatment utilizan los datos contractuales del mock.

## 5. Contratos compartidos entre aplicaciones

Aunque Dart y TypeScript requieren modelos propios, ambas aplicaciones deben conservar los mismos nombres de campos, enumeraciones y significados.

### Identificadores mínimos

- `userId`
- `operatorId`
- `groupId`
- `reservoirId`
- `deviceId`
- `operatorProfileId`
- `assignmentId`
- `firstAccessCodeId`
- `configurationId`
- `configurationVersion`
- `processId`
- `cycleNumber`
- `measurementId`
- `commandId`
- `correlationId`
- `alertId`
- `incidentId`
- `reportId`

### Enumeraciones compartidas

```text
UserRole:
  OPERATOR | ADMINISTRATOR

OperatingEnvironment:
  INTEGRAL_PRODUCT | SIMULATION | ACADEMIC_PROTOTYPE

TreatmentState:
  NOT_STARTED | MEASURING | EVALUATING | PENDING_CORRECTION_APPROVAL | CORRECTING | WAITING |
  REEVALUATING | READY | RELEASING | FAILED | EMERGENCY | COMPLETED

MonitoringProcessState:
  READING | CORRECTION | WAITING | READY | FAILURE | RELEASED

DeviceIdentityStatus:
  PENDING | ACTIVE | REVOKED

CommandStatus:
  PENDING | ACCEPTED | RUNNING | COMPLETED | REJECTED | FAILED

ReleaseMode:
  MANUAL | AUTOMATIC

DeviceAvailability:
  ONLINE | DELAYED | OFFLINE | UNKNOWN

DeviceLifecycleStatus:
  ACTIVE_UNLINKED | ACTIVE_UNASSIGNED | ACTIVE_ASSIGNED | MAINTENANCE | INACTIVE

DeviceCapability:
  PH_SENSOR | TEMPERATURE_SENSOR | DOSING | HEATING | COOLING | RELEASE_VALVE

ConfigurationVersionStatus:
  DRAFT | PUBLISHED

ConfigurationCompatibilityStatus:
  MISSING | COMPATIBLE | INCOMPATIBLE

OperatorProfileStatus:
  PENDING_FIRST_ACCESS | ACTIVE | INACTIVE

FirstAccessCodeStatus:
  ACTIVE | USED | REVOKED

AssignmentStatus:
  ACTIVE | CLOSED

ApprovalStatus:
  NOT_REQUIRED | PENDING | APPROVED

ReleaseEligibility:
  NOT_ELIGIBLE | PENDING_CONFIRMATION | AUTHORIZED

AlertStatus:
  ACTIVE | ACKNOWLEDGED | RESOLVED

IncidentStatus:
  OPEN | CLOSED
```

`TreatmentState` representa la máquina de estados completa. `MonitoringProcessState` es una proyección resumida utilizada por el dashboard y no puede emplearse para habilitar acciones de Treatment. Las traducciones se aplican únicamente en la capa de presentación. Los valores enviados a la API deben permanecer estables.

Los nombres `PH_SENSOR`, `TEMPERATURE_SENSOR`, `DOSING`, `HEATING`, `COOLING` y `RELEASE_VALVE` son los valores contractuales utilizados actualmente por Angular y el Mock API. Las expresiones conceptuales del informe —medición de pH, medición de temperatura, dosificación física, actuación térmica y control de flujo— no constituyen valores alternativos de la API.

## 6. Backend mock con `db.json`

### Objetivo

El mock permite construir navegación, formularios, estados y consumo HTTP antes de disponer del backend real. Se utilizará `mock-api/server.mjs` sobre un archivo `db.json`; el servidor expondrá el mismo contrato `/api/v1` que consumirá el frontend con el backend real.

### Estructura actual

```text
mock-api/
├── db.json
├── server.mjs
├── configuration/
├── telemetry/
├── treatment/
└── monitoring/
```

### Colecciones mínimas de `db.json`

```json
{
  organizations: [],
  users: [],
  groups: [],
  reservoirs: [],
  devices: [],
  deviceIdentities: [],
  operatorProfiles: [],
  deviceAssignments: [],
  firstAccessCodes: [],
  configurations: [],
  measurements: [],
  processes: [],
  actuations: [],
  alerts: [],
  incidents: [],
  traceabilityEntries: [],
  treatmentProcesses: [],
  reports: []
}
```

`processes` es actualmente la proyección resumida que consume el dashboard de Monitoring. `treatmentProcesses` contiene el detalle contractual que exponen `/api/v1/treatments` y `/api/v1/treatments/{processId}`. Esta duplicación es propia del mock actual: la app móvil debe consumir el contrato HTTP de Treatment y nunca intentar combinar ambas colecciones.

### Relaciones simuladas

- `groups.id` identifica el único grupo de cada Operario.
- `reservoirs.groupId` vincula el reservorio con su grupo.
- `devices.reservoirId` vincula de manera exclusiva un dispositivo con un reservorio.
- `deviceIdentities.deviceId` vincula el estado técnico con el dispositivo sin mezclar credenciales con el inventario.
- `operatorProfiles.userId` y `operatorProfiles.groupId` vinculan la cuenta con su único grupo.
- `deviceAssignments.operatorProfileId` vincula uno o varios pares reservorio-dispositivo con el Operario responsable.
- Una restricción del mock debe impedir dos asignaciones activas con el mismo `deviceId` o `reservoirId`.
- `firstAccessCodes.operatorProfileId` vincula el código único con el perfil completo.
- `configurations.deviceId` vincula configuración y dispositivo.
- `measurements.deviceId` vincula mediciones y dispositivo.
- `processes.deviceId` vincula el proceso vigente.
- `actuations.processId` y `actuations.cycleNumber` identifican la actuación.
- Alertas, incidentes y trazabilidad utilizan `deviceId`, `processId` y `correlationId` cuando corresponda.

### Reglas del mock

- Todos los identificadores deben ser cadenas para evitar diferencias entre Dart y TypeScript.
- Las fechas se expresan en UTC e ISO 8601.
- Las contraseñas incluidas son exclusivamente ficticias.
- El mock nunca conserva la credencial original del dispositivo. Solo devuelve una credencial ficticia en la respuesta de alta y guarda un hash no utilizable como fixture.
- El mock de autenticación puede validar usuarios y códigos falsos, pero no representa seguridad real. Los códigos generados por el mock siguen el formato `HG-` más seis caracteres hexadecimales y se guardan en texto legible solo para la demostración.
- El código de primer acceso no vence en el prototipo, pero solo puede cambiar de `ACTIVE` a `USED` o `REVOKED`.
- El backend real debe guardar un hash del código y ejecutar el consumo, la activación del perfil y la creación de la sesión en una sola transacción.
- El servidor mock reproduce validaciones y transiciones mínimas para probar el frontend, pero no sustituye las reglas definitivas ni las pruebas del backend real. Los escenarios de `db.json` son fixtures de desarrollo.
- Los comandos críticos pueden simularse actualizando el recurso correspondiente, pero la aplicación no debe asumir que podrá hacerlo directamente en producción.
- No se codificarán URLs de localhost dentro de widgets o componentes; cada aplicación utilizará configuración de entorno.

### Escenarios iniciales de datos

El `db.json` debe contener, como mínimo:

- Un grupo con un Operario y otro grupo con varios Operarios.
- Un Operario con un reservorio-dispositivo y otro con varias asignaciones dentro del mismo grupo.
- Un Administrador sin dispositivo.
- Un perfil pendiente de primer acceso, uno activo y uno desactivado.
- Un código activo, uno utilizado y uno revocado.
- Un reservorio-dispositivo sin responsable después de una desvinculación.
- Un dispositivo en línea y otro sin comunicación.
- Una identidad activa y una revocada; el alta debe mostrar una credencial únicamente en su respuesta inmediata.
- Configuración publicada y una configuración en borrador.
- Mediciones conformes y no conformes.
- Un proceso en corrección, otro en espera y otro en estado listo.
- Un proceso pendiente de aprobación y otro que ya continúa automáticamente después de haber sido aprobado.
- Actuación completada, rechazada y fallida.
- Alerta activa, atendida y resuelta.
- Incidente con trazabilidad completa.
- Reporte disponible y solicitud de reporte pendiente.

## 7. Autenticación y autorización entre aplicaciones

- La app móvil solo acepta una sesión con rol `OPERATOR`.
- La app web solo acepta una sesión con rol `ADMINISTRATOR`.
- El Administrador crea las cuentas de Operario con contraseña definitiva; los Operarios no se autorregistran.
- El registro público crea una empresa nueva junto con su único Administrador. No permite agregar otro Administrador a una empresa existente.
- El Administrador inicia sesión con correo y contraseña; el correo es único entre empresas.
- El backend limita cada operación al `organizationId` de la sesión autenticada.
- El primer acceso móvil envía identificador, contraseña definitiva y código único; no solicita cambio de contraseña.
- El backend debe comprobar que credenciales, código, cuenta, organización y perfil correspondan entre sí antes de crear la sesión.
- El código no caduca por tiempo, pero es de un solo uso y puede ser revocado antes de utilizarse.
- Después del primer acceso, el Operario ingresa con el identificador y la contraseña definitiva entregados por el Administrador.
- Si el usuario intenta ingresar en la aplicación incorrecta, se cierra la sesión iniciada y se informa qué canal le corresponde.
- El token se conserva en memoria y en almacenamiento seguro o de sesión según la plataforma.
- Flutter utilizará almacenamiento seguro cuando se incorpore persistencia real de credenciales.
- Angular podrá usar `sessionStorage` para el token durante el prototipo; no se almacenarán contraseñas.
- Las restricciones de la interfaz no sustituyen la autorización del backend.

## 8. Aplicación móvil del Operario — Flutter con BLoC

### Arquitectura general

```text
lib/
├── app/
│   ├── app.dart
│   ├── router/
│   └── theme/
├── core/
│   ├── auth/
│   ├── config/
│   ├── errors/
│   ├── http/
│   └── widgets/
├── features/
│   ├── identity_access/
│   ├── device_configuration/
│   ├── telemetry/
│   ├── treatment_release/
│   └── monitoring_traceability/
└── main.dart
```

Cada feature debe separar:

```text
feature/
├── data/
│   ├── datasources/
│   ├── dto/
│   ├── mappers/
│   └── repositories/
├── domain/
│   ├── entities/
│   ├── repositories/
│   └── usecases/
└── presentation/
    ├── bloc/
    ├── pages/
    └── widgets/
```

La UI emite eventos BLoC, el BLoC ejecuta un caso de uso y el repositorio utiliza un datasource remoto tipado. Ese datasource delega la comunicación a un único cliente basado en `package:http`. Los widgets, BLoC, casos de uso y repositorios no utilizan directamente `http.Client` ni conocen la estructura de `db.json`.

Flujo técnico estándar de una operación móvil:

1. El widget valida únicamente formato y campos obligatorios, y emite un evento al BLoC.
2. El BLoC evita envíos duplicados, cambia a estado de carga y ejecuta un caso de uso.
3. El caso de uso aplica la intención de la operación y llama a la interfaz del repositorio.
4. La implementación del repositorio delega la solicitud al datasource del bounded context.
5. El datasource construye el endpoint y el DTO, y usa `HydroGuardHttpClient`.
6. `HydroGuardHttpClient` agrega autenticación, `Content-Type`, correlación, tiempo de espera y codificación JSON; luego ejecuta la solicitud con un `http.Client` inyectado.
7. El datasource convierte la respuesta en DTO; el repositorio la transforma en entidad de dominio.
8. El BLoC publica éxito, vacío, falta de permisos, desconexión o error y la vista se actualiza sin inferir reglas del backend.

Las reglas de autorización, conformidad, transición de procesos y acciones permitidas continúan siendo responsabilidad del backend. La aplicación representa `allowedActions` y estados recibidos; no los recalcula.

### Navegación móvil

- Inicio.
- Mis reservorios.
- Mi grupo.
- Proceso.
- Alertas.
- Historial.
- Configuración.
- Perfil y cierre de sesión.

La pantalla inicial muestra un selector cuando existe más de un reservorio asignado. Después de seleccionar uno, prioriza el estado de su proceso, última medición, actuación vigente y emergencia. Las acciones frecuentes deben poder ejecutarse con una mano y no depender de tablas anchas.

### M-BC-01 — Identity and Access Management

**Función:** efectuar el primer acceso con las credenciales definitivas y el código emitido por el Administrador, autenticar posteriormente al Operario y mantener una sesión limitada a su perfil y asignaciones.

**Acciones:**

- Iniciar la primera sesión mediante identificador, contraseña definitiva y código único.
- Mostrar grupo, reservorios y dispositivos antes de confirmar el primer acceso.
- Continuar a la aplicación sin solicitar cambio de contraseña.
- Iniciar las sesiones posteriores con el identificador y la contraseña definitiva.
- Cerrar sesión.
- Restaurar la sesión válida.
- Consultar datos básicos del perfil.
- Consultar los nombres de los integrantes del mismo grupo y sus reservorios asignados, sin acceso a información operativa ajena.
- Informar cuando el perfil no tenga asignaciones activas.
- Rechazar en la app móvil cuentas con rol de Administrador.

**Pantallas y BLoC:**

- `FirstAccessPage` con `FirstAccessBloc`.
- `LoginPage` con `AuthenticationBloc` para accesos posteriores.
- `OperatorProfilePage` con `OperatorProfileBloc`.
- `GroupMembersPage` con `GroupMembersBloc`.
- Estados: `initial`, `submitting`, `authenticated`, `unauthenticated`, `forbidden` y `failure`.

**No incluye:** autorregistro, creación de cuentas, asignación de roles ni administración de otras personas.

**Contrato requerido antes de integrar esta pantalla:**

```text
POST /api/v1/authentication/operator-first-access
Body: { identifier, password, code }
Response: { id, identifier, organizationId, token, role: OPERATOR, expiresAt? }
```

La operación consume el código, activa el perfil y crea la sesión de forma atómica en el Mock API. El backend real deberá conservar la misma regla con transacción, hash y persistencia segura.

### M-BC-02 — Device and Operational Configuration

**Función:** permitir que el Operario complete y mantenga la configuración de cada reservorio-dispositivo incluido en su perfil.

**Acciones:**

- Seleccionar una asignación cuando gestione varios reservorios dentro de su grupo.
- Consultar grupo, reservorio, dispositivo, entorno, capacidades y versión vigente.
- Editar rangos de pH y temperatura.
- Configurar sustancia o acción, dosis o intensidad y estrategia térmica.
- Configurar tiempo de espera y límite de ciclos.
- Elegir modo de liberación manual o automático.
- Revisar un resumen y publicar la nueva versión.
- Impedir cambios sobre la versión utilizada por un proceso activo.
- Mostrar incompatibilidades entre estrategia y capacidades.

**Pantallas y BLoC:**

- `ConfigurationSummaryPage` con `ConfigurationDetailsBloc`.
- `ConfigurationEditPage` con `ConfigurationFormBloc`.
- Formulario dividido en pasos cortos y aptos para móvil.

**Validaciones de presentación:** pH entre 0 y 14, temperatura entre 0 °C y 100 °C, límites coherentes, espera y ciclos positivos, y datos de estrategia completos.

**No incluye:** registrar dispositivos, reasignar Operarios ni crear perfiles base globales.

### M-BC-03 — IoT Telemetry and Device Integration

**Función:** presentar al Operario el estado técnico y las mediciones de cada dispositivo que tenga asignado.

**Acciones:**

- Seleccionar uno de sus reservorios-dispositivos sin mezclar datos entre asignaciones.
- Consultar pH, temperatura, unidad y fecha de la última medición.
- Identificar dato vigente, retrasado o inexistente.
- Consultar disponibilidad y última comunicación.
- Mostrar entorno y capacidades.
- Consultar historial reciente por periodo.
- Mostrar el resultado técnico de actuaciones y válvula.
- Actualizar mediante polling mientras no exista SSE o WebSocket.

**Pantallas y BLoC:**

- `DeviceOverviewPage` con `DeviceStatusBloc`.
- `TelemetryPage` con `TelemetryBloc`.
- `CommandStatusPage` con `CommandExecutionBloc`.

**Comportamiento:** el polling se detiene cuando la app queda en segundo plano. Una ausencia de datos se muestra como “Sin medición reciente”, nunca como cero.

**No incluye:** registrar mediciones manualmente ni clasificar el agua desde la app.

### M-BC-04 — Water Quality Treatment and Release

**Función:** permitir la intervención operativa directa y segura sobre el proceso del reservorio seleccionado.

**Acciones:**

- Iniciar un proceso si el reservorio seleccionado posee configuración publicada y dispositivo disponible.
- Consultar estado, ciclo, máximo de ciclos y espera restante.
- Revisar la estrategia seleccionada por Treatment y aprobarla una sola vez en `PENDING_CORRECTION_APPROVAL`.
- Observar la continuación automática de los ciclos posteriores sin repetir la aprobación.
- Ver la actuación correctiva ordenada y su estado técnico.
- Confirmar la liberación únicamente cuando el modo sea manual y el proceso esté `READY`.
- Observar la liberación automática sin convertirla en una acción manual.
- Activar la parada de emergencia desde cualquier estado activo.
- Solicitar restablecimiento después de atender un fallo o emergencia.
- Mostrar la sustitución manual solo en el prototipo académico.

**Pantallas y BLoC:**

- `TreatmentProcessPage` con `TreatmentProcessBloc`.
- `CorrectionApprovalSheet` con `CorrectionApprovalBloc`.
- `ManualReleaseSheet` con `ReleaseCommandBloc`.
- `EmergencyStopDialog` con `EmergencyCommandBloc`.
- `ResetProcessPage` con `ResetProcessBloc`.

**Eventos BLoC principales:**

- `TreatmentStarted`
- `TreatmentRefreshed`
- `CorrectionApprovalRequested`
- `ManualReleaseRequested`
- `EmergencyStopRequested`
- `ProcessResetRequested`

**Reglas de interfaz:**

- No incrementar ciclos localmente.
- No cambiar a `READY` cuando termina visualmente un contador.
- No mostrar la dosificación normal como tarea manual del Operario.
- En `ACADEMIC_PROTOTYPE`, explicar que el LED representa la orden mientras el equipo realiza la corrección sustitutiva.
- Deshabilitar una acción hasta recibir el resultado del comando anterior.

### M-BC-05 — Operational Monitoring and Traceability

**Función:** permitir al Operario atender alertas y revisar la historia de sus reservorios-dispositivos.

**Acciones:**

- Consultar alertas activas, atendidas y resueltas de sus dispositivos asignados.
- Filtrar por severidad, estado y periodo.
- Ver la causa, proceso, ciclo y medición relacionados.
- Marcar una alerta como atendida cuando el contrato lo permita.
- Consultar la línea temporal de mediciones, actuaciones, ciclos y liberaciones.
- Consultar reportes disponibles de su dispositivo, sin administrar reportes globales.

**Pantallas y BLoC:**

- `AlertsPage` y `AlertDetailPage` con `OperatorAlertsBloc`.
- `DeviceHistoryPage` con `TraceabilityBloc`.
- `AvailableReportsPage` con `OperatorReportsBloc`.

**No incluye:** registrar incidentes administrativos, consultar datos operativos de otros integrantes del grupo ni generar reportes globales.

## 9. Aplicación web del Administrador — Angular con DDD por bounded context

### Arquitectura general

```text
src/app/
├── core/
│   ├── http/
│   └── layout/
├── shared/
│   ├── presentation/
│   └── utils/
├── iam/
├── device-configuration/
├── telemetry/
├── water-quality-treatment/
├── operational-monitoring/
├── app.config.ts
└── app.routes.ts
```

Estructura interna por contexto:

```text
bounded-context/
├── domain/
│   ├── models/
│   └── ports/
├── application/
│   ├── use-cases/
│   └── state/
├── infrastructure/
│   ├── http/
│   └── storage/        # solo cuando el contexto lo requiere
└── presentation/
    ├── pages/
    ├── components/
    └── routes.ts
```

Los componentes usan casos de uso; los casos de uso dependen de puertos; y los adaptadores Axios implementan esos puertos. Ningún contexto accede al adaptador interno de otro. Los dashboards compuestos consumen fachadas de aplicación o vistas preparadas.

### Navegación web

- Registro de empresa y acceso administrativo: `/register` y `/login`.
- Operarios, detalle y códigos de primer acceso: `/users`.
- Grupos, reservorios, dispositivos, perfiles y asignaciones: `/groups`, `/reservoirs`, `/devices` y `/operator-profiles`.
- Configuraciones publicadas o en borrador: `/devices/:deviceId/configurations`.
- Estado operacional, alertas, incidentes y trazabilidad: `/monitoring` y sus rutas hijas.
- Telemetría global y detalle por dispositivo: `/telemetry`.
- Listado y detalle de tratamientos: `/treatments`.
- Cierre de sesión desde el layout lateral.

No existe actualmente una ruta independiente de “Resumen global”, una página de perfil del Administrador ni una página web de comandos del dispositivo. No deben documentarse como implementadas.

### W-BC-01 — Identity and Access Management

**Función:** registrar una empresa con su único Administrador, autenticarlo y permitirle crear, activar y desactivar las cuentas de Operario y sus códigos de primer acceso dentro de esa empresa.

**Acciones:**

- Registrar una empresa con nombre, RUC, teléfono y un único segmento, junto con su Administrador.
- Rechazar un RUC o correo ya registrado y evitar administradores adicionales en una empresa existente.
- Iniciar sesión con correo y contraseña y cerrar la sesión.
- Listar, buscar y filtrar usuarios.
- Crear la cuenta de un Operario con identificador y contraseña definitiva.
- Consultar estado activo o inactivo.
- Generar el código únicamente después de comprobar que el perfil, grupo y al menos un reservorio-dispositivo estén completos.
- Consultar si el código está activo, utilizado o revocado.
- Revocar un código sin utilizar y generar su reemplazo.
- Desactivar una cuenta mediante eliminación lógica.
- Consultar el vínculo entre Operario, grupo y asignaciones sin modificar esos datos desde IAM.
- Rechazar en la web administrativa una sesión exclusiva de Operario.

**Rutas y componentes:**

- `/login` — `AdminLoginPage`.
- `/register` — `AdministratorRegisterPage`, disponible para registrar una empresa nueva y su Administrador.
- `/users` — `UsersPage` y `UsersTable`.
- `/users/new` — `OperatorCreatePage`.
- `/users/:userId` — `UserDetailPage`.
- `/users/:userId/first-access` — `FirstAccessCodePage`.

### W-BC-02 — Device and Operational Configuration

**Función:** administrar grupos, reservorios, dispositivos y perfiles de Operario, y supervisar las configuraciones que cada Operario publica desde Flutter.

La web integra aquí las capacidades administrativas de Device Identity and Access: al registrar un dispositivo muestra la credencial una sola vez, consulta el estado de identidad y permite revocarla. No se crea otro módulo de navegación ni se expone el hash o el secreto en consultas posteriores.

**Acciones:**

- Crear grupos con nombre, propósito, segmento y tipo de cultivo o proceso.
- Registrar reservorios dentro de un grupo.
- Registrar y activar dispositivos con número de serie, modelo, entorno y capacidades.
- Vincular exactamente un dispositivo con cada reservorio.
- Listar pares reservorio-dispositivo asignados y sin responsable.
- Crear el Perfil de Operario y asociarlo con un único grupo.
- Agregar uno o varios pares disponibles del mismo grupo al Perfil de Operario.
- Impedir que un dispositivo o reservorio tenga dos responsables activos.
- Desvincular una asignación y dejar el par sin responsable.
- Reasignar manualmente un par disponible desde el perfil del nuevo Operario.
- Consultar la configuración vigente y su versión.
- Detectar dispositivos sin configuración o con configuración incompatible.
- Consultar borradores y versiones publicadas.
- No modificar silenciosamente una configuración operativa activa del Operario.
- Desactivar grupos, reservorios, dispositivos y perfiles mediante eliminación lógica.

**Rutas y componentes:**

- `/groups` — `WorkGroupsPage`.
- `/groups/new` — `WorkGroupCreatePage`.
- `/groups/:groupId` — `WorkGroupDetailPage` con Operarios y reservorios.
- `/reservoirs/new` — `ReservoirCreatePage`.
- `/reservoirs` — `ReservoirsPage`.
- `/reservoirs/:reservoirId` — `ReservoirDetailPage`.
- `/devices` — `DevicesPage`.
- `/devices/new` — `DeviceCreatePage`.
- `/devices/:deviceId` — `DeviceDetailPage`.
- `/operator-profiles` — `OperatorProfilesPage`.
- `/operator-profiles/new` — `OperatorProfileCreatePage`.
- `/operator-profiles/:profileId` — `OperatorProfileDetailPage` y `AssignmentManager`.
- `/devices/:deviceId/configurations` — `ConfigurationVersionsPage`.

La creación completa del Operario se presenta como un flujo guiado de la aplicación web: cuenta y contraseña definitiva → Perfil de Operario → grupo → reservorio-dispositivo → código. La interfaz coordina los casos de uso de IAM y Configuration, pero no mezcla sus modelos internos ni escribe directamente en sus bases de datos.

### W-BC-03 — IoT Telemetry and Device Integration

**Función:** supervisar la disponibilidad y telemetría de todos los dispositivos sin ejecutar acciones operativas propias del Operario.

**Acciones:**

- Consultar última medición por dispositivo.
- Filtrar por disponibilidad, segmento y entorno.
- Identificar dispositivos en línea, retrasados o fuera de línea.
- Consultar historial de pH y temperatura por dispositivo y periodo.
- Consultar resultados técnicos de comandos.
- Comparar estados mediante tarjetas y tablas, sin recalcular conformidad.

**Rutas y componentes:**

- `/telemetry` — `TelemetryOverviewPage`.
- `/telemetry/devices/:deviceId` — `DeviceTelemetryDetailPage`.

La consulta separada de comandos del dispositivo permanece como capacidad futura del contrato; no existe actualmente una ruta ni una página `DeviceCommandsPage` en Angular.

**Restricción:** el Administrador puede observar la actuación y la válvula, pero la pantalla no presenta botones de inicio, liberación manual o emergencia.

### W-BC-04 — Water Quality Treatment and Release

**Función:** permitir la supervisión global de los procesos y explicar las decisiones tomadas por el sistema.

**Acciones:**

- Listar procesos por dispositivo, estado, segmento y periodo.
- Consultar proceso activo, ciclo, configuración y actuación.
- Ver la medición que originó una corrección.
- Ver la reevaluación que habilitó una liberación.
- Consultar fallos, emergencias y restablecimientos.
- Ver autorizaciones de liberación y resultado de válvula.
- Navegar hacia alertas, incidentes y trazabilidad relacionados.

**Rutas y componentes:**

- `/treatments` — `TreatmentProcessesPage`, con búsqueda y filtro por estado.
- `/treatments/:processId` — `TreatmentProcessDetailPage`, con configuración, mediciones, estrategia, aprobación, ciclos, liberación y cronología de decisiones.

**Restricción:** esta aplicación presenta información de supervisión. Las acciones operativas directas corresponden a la app móvil del Operario.

### W-BC-05 — Operational Monitoring and Traceability

**Función:** centralizar alertas, incidentes, trazabilidad y reportes de todos los dispositivos.

**Acciones:**

- Listar y filtrar alertas globales.
- Consultar alertas críticas y pérdida de monitoreo.
- Consultar incidentes, registrar uno desde una alerta y cerrarlo cuando termine la atención.
- Relacionar visualmente medición, actuación, ciclo, alerta y liberación usando la proyección recibida.
- Generar y descargar un reporte CSV sencillo por dispositivo y periodo.
- Acceder desde un incidente al proceso y dispositivo correspondientes.

**Rutas y componentes:**

- `/monitoring` — `MonitoringDashboardPage`.
- `/monitoring/alerts` — `OperationalAlertsPage`.
- `/monitoring/incidents` — `QualityIncidentsPage`.
- `/monitoring/traceability` — `TraceabilityPage`, que también genera y descarga el reporte CSV.

El ciclo de incidente se mantiene deliberadamente simple: `OPEN → CLOSED`. No se incluyen asignación de responsables, comentarios, estados de investigación, escalamiento, reapertura ni reglas automáticas de SLA.

## 10. Experiencia visual propuesta

### Flutter

- Navegación inferior para Inicio, Proceso, Alertas e Historial.
- Configuración y perfil dentro de un menú secundario.
- Tarjetas grandes para pH, temperatura, estado y ciclo.
- Botón de emergencia visible durante procesos activos, pero protegido por confirmación.
- Bottom sheets para liberación manual y acciones breves.
- Textos operativos cortos y estados legibles sin depender solo del color.

### Angular

- Sidenav responsive con navegación administrativa.
- Tablas con ordenamiento, filtros y paginación.
- Formularios con Reactive Forms.
- Diálogos de confirmación para asignaciones y cambios de rol.
- Tarjetas de resumen para disponibilidad, procesos y alertas.
- Breadcrumbs para mantener contexto al navegar entre dispositivo, proceso e incidente.

## 11. Integración HTTP

### Flutter con `package:http ^1.6.0`

Dependencia obligatoria en `pubspec.yaml`:

```yaml
dependencies:
  http: ^1.6.0
```

`package:http` será el único cliente de transporte de la aplicación móvil. Es suficiente para el alcance REST actual y evita incorporar capas adicionales. Como no ofrece interceptores, la configuración transversal se resolverá una sola vez en infraestructura, no en cada feature.

- Crear un `HydroGuardHttpClient` compartido que reciba por inyección un `http.Client`, la `baseUrl`, el proveedor de sesión y un generador de `X-Correlation-Id`.
- Exponer en ese cliente operaciones internas para `GET`, `POST`, `PUT`, `PATCH` y `DELETE`, con `Uri` construido de forma segura y `queryParameters` explícitos.
- Centralizar los encabezados `Accept`, `Content-Type`, `Authorization`, `X-Correlation-Id` y versión de la aplicación.
- Aplicar un tiempo de espera configurable con `Future.timeout` y convertir excepciones de red, formato y timeout en fallos propios.
- Mapear centralmente `400`, `401`, `403`, `404`, `409`, `422` y `5xx`; el cliente no debe devolver mensajes técnicos directamente a la UI.
- Mantener un datasource remoto por bounded context, por ejemplo `IamRemoteDataSource`, `ConfigurationRemoteDataSource`, `TelemetryRemoteDataSource`, `TreatmentRemoteDataSource` y `MonitoringRemoteDataSource`.
- Mantener DTO tipados y separados de las entidades. Puede utilizarse `json_serializable` para reducir código repetitivo, pero no es obligatorio para usar `package:http`.
- Hacer que los repositorios dependan de los datasources y realicen el mapeo DTO-entidad; ningún repositorio debe construir solicitudes HTTP por su cuenta.
- Inyectar `http.Client` para permitir sustitución controlada en pruebas futuras y cerrar el cliente únicamente al finalizar su ciclo de vida.
- Detener temporizadores y polling cuando la aplicación pase a segundo plano. Las respuestas atrasadas deben descartarse si ya no corresponden al reservorio o a la pantalla activa.
- Usar el mismo contrato `/api/v1` con el mock y con el backend real; solo cambia la `baseUrl` por ambiente.

Estructura mínima esperada:

```text
lib/core/http/
├── hydroguard_http_client.dart
├── api_failure.dart
├── api_response_decoder.dart
└── correlation_id_generator.dart

lib/features/<feature>/data/
├── datasources/<feature>_remote_datasource.dart
├── dto/
└── repositories/<feature>_repository_impl.dart
```

### Angular con Axios

- Una instancia Axios común configurada mediante `environment`.
- Interceptor de autenticación y `X-Correlation-Id`.
- Tratamiento uniforme de `401`, `403`, `404`, `409`, `422` y `5xx`.
- Cancelación de búsquedas o consultas reemplazadas.
- Adaptadores Axios fuera de los componentes.

### Política de errores compartida

- `401`: cerrar sesión y volver al login.
- `403`: mantener sesión y mostrar acceso denegado.
- `404`: indicar que el recurso ya no existe.
- `409`: recargar el estado y explicar el conflicto.
- `422`: asociar errores a campos o datos enviados.
- Error de red: conservar información anterior y permitir reintento.

## 12. Endpoints de consulta y comando requeridos

El backend real aún debe completar varios contratos. El mock debe anticipar estas necesidades sin presentarlas como implementación definitiva.

| Contexto | App móvil del Operario | App web del Administrador |
|:--|:--|:--|
| IAM | Primer acceso con identificador, contraseña definitiva y código; login posterior con credenciales definitivas y perfil actual. | Registro de empresa y su único Administrador, login, cuentas de Operario, códigos, revocación y eliminación lógica. |
| Device Identity | Sin capacidades administrativas. | Integrado en Dispositivos: entrega única de credencial, consulta de estado y revocación. |
| Configuration | Grupo propio, miembros visibles, asignaciones, configuración por reservorio-dispositivo y publicación. | Grupos, reservorios, dispositivos, perfiles, vinculación, asignación, desvinculación y versiones. |
| Telemetry | Última medición, historial, disponibilidad y comandos de cada dispositivo propio. | Resumen global, detalle por dispositivo y filtros. |
| Treatment | Proceso activo, aprobación única de estrategia, liberación manual, emergencia y restablecimiento. | Listado global y detalle de procesos en modo consulta, implementados contra el contrato mock. |
| Monitoring | Alertas e historial del dispositivo asignado. | Estado operacional, alertas, ciclo simple de incidentes, trazabilidad y reporte CSV, implementados contra el contrato mock. |

### Contratos ya verificados en la web y el Mock API

- La autenticación administrativa devuelve `id`, `identifier`, `organizationId`, `token`, `role` y `expiresAt` opcional.
- El registro conjunto de empresa y Administrador, la sesión administrativa, las cuentas de Operario y los códigos de primer acceso ya cuentan con rutas mock.
- Usuarios, grupos, reservorios, dispositivos y perfiles tienen consultas paginadas o de detalle según la necesidad de la web.
- El Mock API valida un grupo por perfil, vinculaciones exclusivas y un responsable activo por par reservorio-dispositivo.
- El código solo se genera cuando la cuenta está activa, el perfil está `PENDING_FIRST_ACCESS` y existe una asignación activa completa.
- El alta de dispositivo responde `{ device, activationCredential }`; `activationCredential` se muestra una vez y no forma parte de `DeviceDto`.
- `DeviceDto` incluye `identityStatus`; la revocación utiliza `POST /api/v1/device-identities/{deviceId}/revoke`.
- Telemetry expone resumen global, detalle, última medición e historial sin exigir turbidez.
- Treatment expone listados y detalles de solo lectura para el Administrador.
- Monitoring expone estado, alertas, incidentes, trazabilidad y generación inmediata de reportes.

### Contratos móviles implementados en el Mock API

- `POST /api/v1/authentication/operator-first-access` consume el código y devuelve sesión `OPERATOR`.
- `POST /api/v1/authentication/sign-in` y `sign-out` son compartidos por rol; Flutter rechaza cualquier sesión que no sea `OPERATOR`.
- `GET /api/v1/operator/context` proyecta perfil, grupo, miembros y asignaciones desde el token.
- `GET|PUT /api/v1/operator/assignments/{id}/configuration` y `POST .../publish` administran el borrador y publicación por asignación.
- `GET /api/v1/operator/devices/{id}/telemetry` devuelve disponibilidad, última lectura e historial.
- `GET /api/v1/operator/treatments` y `POST /api/v1/operator/treatments/{id}/commands` exponen estados y `allowedActions`.
- `GET /api/v1/operator/alerts`, `PATCH .../{id}/acknowledge` y `GET /api/v1/operator/devices/{id}/history` cubren Monitoring móvil.

Todas las rutas `/operator` validan la sesión y vuelven a comprobar que el recurso pertenezca a una asignación activa. Siguen pendientes del backend real las garantías productivas —transacciones, hash, almacenamiento seguro, renovación de sesión, idempotencia y persistencia durable— y FCM.

## 13. Estados de presentación

Ambas aplicaciones deben distinguir:

- `initial`
- `loading`
- `refreshing`
- `success`
- `empty`
- `forbidden`
- `notFound`
- `offline`
- `failure`

Para comandos deben utilizarse estados separados:

- `ready`
- `submitting`
- `accepted`
- `completed`
- `rejected`
- `failed`

## 14. Orden general de desarrollo

### P-01 — Preparación compartida

- Congelar las enumeraciones y DTO compartidos indicados en esta guía.
- Implementar en el Mock API el primer acceso, la sesión `OPERATOR` y las consultas limitadas por asignación.
- Completar el contrato de configuración operativa y los comandos de Treatment requeridos por Flutter.
- Preparar fixtures móviles sin acceder a `db.json` desde la aplicación.
- Definir variables de entorno para Flutter.

### P-02 — Base Flutter

- Crear proyecto, tema y navegación; agregar `http: ^1.6.0`, configurar `HydroGuardHttpClient`, serialización y variables por ambiente.
- Incorporar BLoC y estructura por feature.
- Implementar repositorios y fallos compartidos sin reglas de negocio en widgets o BLoC.

### P-03 — Acceso y contexto del Operario

- Implementar primer acceso, login posterior, restauración y cierre de sesión.
- Mostrar perfil, grupo, miembros visibles y asignaciones propias.
- Bloquear sesiones cuyo rol no sea `OPERATOR`.

### P-04 — Configuración por rol

- Flutter: selector de reservorio y configuración operativa de cada asignación.
- Mantener Angular como referencia de la estructura ya creada; no duplicar sus capacidades administrativas en Flutter.

### P-05 — Telemetría y tratamiento

- Flutter: telemetría propia y acciones operativas.
- Validar que `allowedActions` gobierne aprobación, liberación, emergencia y restablecimiento.

### P-06 — Monitoreo y trazabilidad

- Flutter: alertas e historial del dispositivo.
- Registrar el token FCM cuando exista sesión y eliminarlo o invalidarlo al cerrar sesión.

### P-07 — Refinamiento

- Revisar navegación, textos, responsive y estados excepcionales.
- Recoger observaciones de uso.
- Trasladar a Figma únicamente los flujos aprobados si el equipo decide formalizarlos.

## 15. Criterio de finalización del sprint

Una funcionalidad se considera completada cuando:

- Está implementada en la aplicación correspondiente al rol.
- No expone acciones reservadas a la otra aplicación.
- Utiliza el patrón definido: BLoC en Flutter o DDD por contexto en Angular.
- Consume un repositorio o puerto; la UI nunca accede directamente a `http.Client`, Axios o `db.json`.
- Puede funcionar con el mock sin cambiar componentes o widgets.
- Incluye carga, vacío, desconexión, error y falta de permisos.
- Impide dobles envíos y confirma acciones críticas.
- Mantiene los valores contractuales definidos en esta guía y el significado de dominio establecido en el README.
- Funciona en los tamaños de pantalla previstos para su aplicación.
- Documenta el recurso mock o endpoint utilizado.

Las pruebas unitarias y la landing page permanecen fuera del sprint actual.

## 16. Decisiones cerradas y pendientes

### Decisiones cerradas

- La web utiliza Angular 21.2, TypeScript 5.9, Angular Material, Axios 1.20, Node.js 22 y npm 11.
- La web administrativa se despliega en Vercel y el Mock API académico en Render.
- Las aplicaciones consumen rutas relativas `/api/v1`; no codifican URLs del mock en componentes o widgets.
- Flutter utilizará BLoC por feature y `package:http ^1.6.0` mediante un cliente compartido; los DTO permanecerán separados de las entidades y podrán usar `json_serializable`.
- Administrador y Operario utilizan aplicaciones independientes.
- El primer acceso requiere identificador, contraseña definitiva y código; no obliga a cambiar la contraseña.
- La comunicación del dispositivo y Edge utiliza HTTPS/REST; MQTT queda fuera del alcance.
- Treatment decide conformidad y acciones permitidas; las aplicaciones no reproducen esas reglas.
- FCM será el transporte de notificaciones móviles y Monitoring conservará la alerta como fuente de verdad.

### Decisiones pendientes para integración productiva

- Versión estable exacta de Flutter/Dart y versiones compatibles de `flutter_bloc`, `json_serializable`, `build_runner` y almacenamiento seguro. La versión HTTP queda fijada en `http: ^1.6.0`.
- Repositorio definitivo, identificador de paquete y estrategia de distribución de la aplicación móvil.
- URL, autenticación definitiva y especificación OpenAPI del backend real.
- Intervalo de polling y criterio definitivo de medición vigente; hasta entonces deben ser configurables.
- Evaluación posterior de SSE o WebSocket; no son requisito para el primer incremento móvil.
- Estrategia final de persistencia y renovación de sesión en Flutter.
- Configuración de proyecto Firebase y ciclo de registro/invalidez de tokens FCM.
- Biblioteca de gráficos, solo si aporta valor frente a tarjetas y listas.
- Diseños que deberán formalizarse en Figma después de validar los flujos funcionales.
