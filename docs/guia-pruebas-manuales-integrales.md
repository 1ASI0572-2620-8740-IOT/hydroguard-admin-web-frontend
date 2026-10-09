# Guía unificada de pruebas manuales — HydroGuard Admin Web

Esta guía permite probar, paso a paso, todo lo que está implementado actualmente en la aplicación web del Administrador. Está escrita para una persona que no conoce internamente el proyecto y distingue expresamente entre funciones reales del frontend, respuestas simuladas por el mock y funciones todavía pendientes.

## 1. Alcance actual

La aplicación permite probar:

- Registro de una empresa con su único Administrador.
- Inicio y cierre de sesión administrativa.
- Registro, consulta y baja lógica de cuentas de Operario.
- Creación de grupos, reservorios y dispositivos.
- Provisionamiento simulado de identidad técnica y entrega única de credencial.
- Vinculación exclusiva entre dispositivo y reservorio.
- Creación de perfiles de Operario y asignaciones dentro de un grupo.
- Generación, copia, revocación y reemplazo del código de primer acceso.
- Cierre y reasignación manual de responsabilidades con historial.
- Consulta de versiones de configuración.
- Consulta global e histórica de telemetría mock.
- Consulta global y detalle de procesos de tratamiento mock.
- Estado operacional, alertas, incidentes, trazabilidad y exportación CSV.
- Aislamiento de información entre organizaciones.
- Estados de carga, vacío, desconexión y diseño responsive.

No permite ejecutar todavía el ciclo operativo completo del Operario. Las limitaciones se detallan al final.

## 2. Preparación segura del entorno

### 2.1 Requisitos

- Node.js 22.
- npm 11.
- Navegador actualizado.
- Dos terminales abiertas en la raíz del proyecto:

```text
C:\Users\jhect\OneDrive\Documentos\GitHub\IOT\hydroguard-admin-web-frontend
```

Si las dependencias no están instaladas:

```powershell
npm install
```

### 2.2 Crear una base descartable y reiniciar desde el mismo estado

Las operaciones manuales modifican el JSON utilizado por el mock. No ejecute la demostración directamente sobre `mock-api/db.json`. En la primera terminal, ubicada en la raíz del frontend, ejecute exactamente:

```powershell
New-Item -ItemType Directory -Path tmp -Force | Out-Null
Copy-Item -LiteralPath mock-api/db.json -Destination tmp/prueba-manual-integral.json -Force
$env:MOCK_DB_PATH = (Resolve-Path -LiteralPath tmp/prueba-manual-integral.json).Path
npm run mock:api
```

Mantenga esa terminal abierta. `MOCK_DB_PATH` solamente existe en ella.

Antes de abrir Angular, visite `http://127.0.0.1:3000/api/v1/health`. Debe ver una respuesta con estado `UP`. Si el puerto está ocupado, cierre el proceso anterior; no inicie dos mocks sobre bases distintas durante una misma prueba.

Si desea comenzar nuevamente desde cero:

1. Detenga el mock con `Ctrl+C`.
2. Cierre la sesión visible en Angular o borre `sessionStorage` desde las herramientas del navegador.
3. Repita los comandos anteriores. `Copy-Item -Force` reemplaza la copia alterada con la semilla limpia.
4. Inicie sesión nuevamente; los tokens del proceso anterior dejan de ser válidos.

Este reinicio es obligatorio antes de una demostración formal. Así, nombres, códigos, alertas y cantidades coincidirán con los valores esperados de esta guía.

### 2.3 Iniciar Angular

En la segunda terminal:

```powershell
npm start
```

Abra:

- Aplicación: `http://127.0.0.1:4200`.
- Estado de la API: `http://127.0.0.1:3000/api/v1/health`.

El estado de la API debe responder `UP`. El puerto `3000` contiene la API y no la interfaz.

### 2.4 Cuentas de demostración

| Organización | Administrador                | Contraseña         |
| :----------- | :--------------------------- | :----------------- |
| Textil       | `admin.textil@hydroguard.pe` | `adminpassword123` |
| Hidropónica  | `admin.hidro@hydroguard.pe`  | `adminpassword123` |

Existe además el Operario `marcelino.valencia`, contraseña `operadorpassword123`. Se utiliza únicamente para verificar que una cuenta de Operario no puede entrar al panel administrativo; no existe una interfaz web de Operario.

### 2.5 Datos propios de la prueba

Si comenzó con una copia limpia, utilice exactamente estos valores. No improvise nombres durante la demostración, porque las secciones posteriores los reutilizan.

| Recurso                   | Campos y valores exactos                                                                                                                                                                                                                |
| :------------------------ | :-------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Empresa de prueba         | Razón social `Empresa Demostración HydroGuard`; RUC `20999999991`; teléfono `+51911111111`; segmento `Producción textil`; administrador `Ana Demostración`; correo `ana.demo@hydroguard.test`; contraseña y confirmación `DemoAdmin123` |
| Grupo                     | Nombre `Grupo Prueba 01`; propósito `Validación manual integral del flujo administrativo`; proceso o área `Área de demostración`                                                                                                        |
| Reservorio A              | Grupo `Grupo Prueba 01`; nombre `Tanque Prueba A-01`; código `TP-A-01`; tipo `Tanque`; ubicación `Zona A`; capacidad vacía                                                                                                              |
| Reservorio B              | Grupo `Grupo Prueba 01`; nombre `Tanque Prueba B-01`; código `TP-B-01`; tipo `Tanque`; ubicación `Zona B`; capacidad `100`                                                                                                              |
| Dispositivo A             | Serie `HG-TEST-A-01`; alias `Dispositivo Prueba A-01`; modelo `HydroGuard Prototype`; entorno `Prototipo académico`; capacidades `Sensor de pH` y `Sensor de temperatura`                                                               |
| Dispositivo B             | Serie `HG-TEST-B-01`; alias `Dispositivo Prueba B-01`; modelo `HydroGuard Simulator`; entorno `Simulación`; capacidades `Sensor de pH` y `Sensor de temperatura`                                                                        |
| Dispositivo de revocación | Serie `HG-ID-REV-01`; alias `Dispositivo Identidad Revocable`; modelo `HydroGuard Prototype`; entorno `Prototipo académico`; capacidades pH y temperatura                                                                               |
| Operario 1                | Nombre `Operario Prueba Uno`; identificador `operador.prueba.01`; contraseña definitiva `operario123`                                                                                                                                   |
| Operario 2                | Nombre `Operario Prueba Dos`; identificador `operador.prueba.02`; contraseña definitiva `operario123`                                                                                                                                   |
| Incidente 1               | Dispositivo `ESP32-HG-TX-001`; tipo `Incidente de calidad`; descripción `Incidente manual de calidad para la demostración integral.`                                                                                                    |
| Incidente 2               | Dispositivo `ESP32-HG-TX-001`; tipo `Pérdida de monitoreo`; descripción `Pérdida de monitoreo simulada para comprobar el segundo tipo.`                                                                                                 |

### 2.6 Estado inicial que debe observarse

La semilla conserva únicamente datos necesarios para crear el flujo desde cero y, a la vez, demostrar consultas que la interfaz todavía no puede producir por sí sola.

| Área                     | Estado inicial útil                                                                                                                              |
| :----------------------- | :----------------------------------------------------------------------------------------------------------------------------------------------- |
| Organización textil      | 1 Administrador, 1 Operario activo con perfil, 1 Operario inactivo histórico, 1 grupo, 3 reservorios y 3 dispositivos                            |
| Organización hidropónica | 1 Administrador, 2 Operarios que representan acceso usado y acceso pendiente, 1 grupo, 2 reservorios y 2 dispositivos                            |
| Telemetría textil        | `dev-101` físico y en línea; `dev-102` simulado y en línea; `dev-203` físico y fuera de línea                                                    |
| Configuración            | `dev-101` tiene versión publicada y borrador; `dev-201` muestra incompatibilidad; los dispositivos creados durante la prueba no tienen versiones |
| Treatment textil         | 3 procesos: uno listo, uno corrigiendo y uno finalizado; la organización hidropónica conserva aprobación pendiente, espera, fallo y emergencia   |
| Monitoreo textil         | 3 dispositivos, 2 en línea, 2 que requieren atención, 1 alerta activa y 0 incidentes abiertos                                                    |
| Trazabilidad             | `dev-101` contiene un ciclo completo; `dev-102` contiene desviación y alerta; la organización hidropónica tiene retraso y pérdida de monitoreo   |

Si antes de crear algo aparecen `juan.perez` o `francisco.valencia`, el mock no se inició desde la semilla actual. Reinícielo siguiendo 2.2.

### 2.7 Orden obligatorio de la demostración

Siga la guía de arriba hacia abajo y no cambie de cuenta salvo cuando se indique:

1. Entrar al login sin sesión y abrir el registro.
2. Registrar Empresa Demostración HydroGuard y su Administrador.
3. Iniciar sesión como `ana.demo@hydroguard.test`.
4. Crear grupo, reservorios, dispositivos, cuentas, perfiles, asignaciones y códigos desde cero.
5. Probar historial, reasignación, listados y estados vacíos dentro de esa empresa.
6. Cerrar sesión y entrar como Administrador textil únicamente para configuración publicada, telemetría, alertas, incidentes y trazabilidad precargadas.
7. Cambiar al Administrador hidropónico para demostrar aislamiento y casos semilla alternativos.
8. Volver a `ana.demo@hydroguard.test`, probar errores finales y ejecutar las bajas lógicas.

Las organizaciones semilla no sustituyen el recorrido desde cero; solo aportan datos que el frontend actual todavía no puede producir, como mediciones, códigos consumidos y procesos de tratamiento.

## 3. Inicio de la demostración: login sin una cuenta propia

**Propósito:** comenzar como una persona nueva, confirmar que el panel está protegido y llegar al registro sin utilizar todavía ninguna cuenta semilla.

1. Abra una ventana privada del navegador para no reutilizar sesiones anteriores.
2. Entre en `http://127.0.0.1:4200`.
3. Compruebe que la aplicación muestra `/login`, el título **HydroGuard — Panel administrativo** y la opción **Registrar empresa**. El menú lateral no debe aparecer.
4. Pegue directamente `http://127.0.0.1:4200/users`. La aplicación debe devolverlo a `/login` porque todavía no existe una sesión.
5. Presione **Iniciar Sesión** con ambos campos vacíos. Deben aparecer `El correo es obligatorio` y `La contraseña es obligatoria`.
6. Escriba correo `correo-invalido` y contraseña `12345`. Debe mostrarse `Ingrese un correo válido`; el formulario no debe iniciar sesión.
7. Corrija el correo a `ana.demo@hydroguard.test`, mantenga una contraseña incorrecta como `clave-incorrecta` y envíe. Como la cuenta todavía no se ha creado, debe aparecer un error de credenciales y permanecer en `/login`.
8. Seleccione **Registrar empresa**. Debe abrirse `/register`.

No use todavía `admin.textil@hydroguard.pe`: esa cuenta se reserva para la segunda parte de la demostración, cuando se necesiten telemetría y monitoreo precargados.

## 4. Registro de empresa, Administrador y primera sesión

Esta sección crea el punto de partida real del recorrido. La empresa nueva comienza sin grupos, reservorios, dispositivos, Operarios ni datos operacionales.

**Propósito:** validar que una organización y su único Administrador nacen en una operación y quedan aislados de las organizaciones semilla.

1. En `/register`, presione **Registrar empresa** con el formulario vacío. Todos los campos obligatorios deben señalarse y la página debe permanecer en `/register`.
2. Pruebe estos valores inválidos, uno por vez, y luego corríjalos:
   - Razón social `AB`: requiere al menos 3 caracteres.
   - RUC `123`: requiere exactamente 11 dígitos.
   - Teléfono `abc`: solo acepta entre 9 y 15 dígitos, con `+` opcional.
   - Correo `ana.demo`: debe ser un correo válido.
   - Contraseña `1234567`: requiere al menos 8 caracteres.
   - Confirmación `OtraClave123`: debe coincidir con la contraseña.
3. Llene el formulario válido exactamente así:
   - **Nombre o razón social:** `Empresa Demostración HydroGuard`.
   - **RUC:** `20999999991`.
   - **Teléfono empresarial:** `+51911111111`.
   - **Segmento de la empresa:** `Producción textil`.
   - **Nombre completo:** `Ana Demostración`.
   - **Correo electrónico:** `ana.demo@hydroguard.test`.
   - **Contraseña:** `DemoAdmin123`.
   - **Confirmar contraseña:** `DemoAdmin123`.
4. Presione **Registrar empresa** una sola vez y espere a que termine el indicador de carga.

Resultado esperado:

- Empresa y Administrador se crean conjuntamente.
- La aplicación regresa al login con confirmación.
- Las nuevas credenciales permiten iniciar sesión.
- La aplicación vuelve a `/login` y muestra la confirmación de registro.
- No existe una opción para crear un segundo Administrador en esa empresa.

### 4.1 Comprobar duplicidad antes del primer ingreso

1. Desde el login vuelva a **Registrar empresa**.
2. Use razón social `Empresa Duplicada`, RUC `20999999991`, teléfono `+51922222222`, segmento Textil, administrador `Administrador Duplicado`, correo `otro.admin@hydroguard.test` y contraseña/confirmación `DemoAdmin123`.
3. Envíe. El mock debe rechazar el RUC repetido y no debe crear parcialmente otra empresa.
4. Cambie el RUC a `20999999992`, pero use el correo ya registrado `ana.demo@hydroguard.test`. Debe rechazarse el correo repetido.
5. Presione **Volver al ingreso**.

### 4.2 Iniciar sesión por primera vez

1. Escriba correo `ana.demo@hydroguard.test` y contraseña `DemoAdmin123`.
2. Presione **Iniciar Sesión**.
3. Compruebe que llega a `/users` y que aparecen Operarios, Grupos, Reservorios, Dispositivos, Perfiles, Estado operacional, Alertas, Incidentes, Trazabilidad, Telemetría y Tratamientos en el menú lateral.
4. Abra **Operarios**, **Grupos**, **Reservorios**, **Dispositivos** y **Perfiles**. Todos deben mostrar un estado vacío legítimo, no un error.
5. Presione **Cerrar sesión**, use el botón **Atrás** del navegador y compruebe que vuelve al login.
6. Inicie sesión otra vez como `ana.demo@hydroguard.test` con `DemoAdmin123` y mantenga esta sesión para las secciones 5 a 8.

Desde este punto, todo recurso denominado `Prueba` debe quedar dentro de **Empresa Demostración HydroGuard**, no dentro de las organizaciones semilla.

## 5. Preparar una unidad operativa completa

**Propósito:** construir las dependencias que el sistema exige antes de asignar trabajo a un Operario. No cambie el orden: un perfil solo puede elegir pares dispositivo–reservorio ya vinculados.

El orden funcional es:

```text
Grupo → Reservorios → Dispositivos → Vinculación → Cuenta → Perfil → Asignaciones → Código
```

### 5.1 Crear el grupo

1. Abra **Grupos**.
2. Presione **Crear grupo**.
3. Complete:
   - Nombre: `Grupo Prueba 01`.
   - Propósito: `Validación manual integral del flujo administrativo`.
   - Proceso o área: `Área de demostración`.
4. Presione **Crear grupo**.

Resultado esperado:

- Se abre el detalle del grupo.
- Su estado es activo.
- El segmento Textil se hereda de la empresa y no puede sustituirse desde el formulario.
- Integrantes y reservorios están inicialmente vacíos.

Variantes negativas concretas:

- Antes del alta válida, escriba solo espacios en nombre y propósito: deben aparecer errores de campo y no debe crearse nada.
- Después del alta válida, vuelva a **Crear grupo**, repita exactamente `Grupo Prueba 01`, use propósito `Intento duplicado` y proceso `Área de demostración`. El mock debe rechazar el nombre duplicado y debe seguir existiendo un solo grupo con ese nombre.

### 5.2 Crear dos reservorios

1. Desde el grupo presione **Registrar reservorio**, o abra **Reservorios → Registrar reservorio**.
2. Registre el primero:
   - Grupo: `Grupo Prueba 01`.
   - Nombre: `Tanque Prueba A-01`.
   - Código: `TP-A-01`.
   - Tipo: Tanque.
   - Ubicación: `Zona A`.
   - Capacidad: déjela vacía.
3. Registre el segundo:
   - Grupo: `Grupo Prueba 01`.
   - Nombre: `Tanque Prueba B-01`.
   - Código: `TP-B-01`.
   - Tipo: Tanque.
   - Ubicación: `Zona B`.
   - Capacidad: `100`.

Resultado esperado:

- Ambos reservorios están activos y pertenecen al grupo.
- El primero muestra capacidad sin especificar.
- Ninguno tiene todavía un dispositivo vinculado.

Variantes negativas:

- Intente registrar `Tanque Código Duplicado`, en el mismo grupo, ubicación `Zona C`, pero con código `TP-A-01`: debe rechazarse y no debe añadirse una tercera fila.
- Introduzca capacidad `0` y después `-10`: debe mostrarse validación y no crearse el registro.
- Deje **Grupo**, **Nombre**, **Código interno** o **Ubicación** vacío: el formulario no debe enviarse.

### 5.3 Registrar el dispositivo A y guardar su credencial

1. Abra **Dispositivos → Registrar dispositivo**.
2. Complete:
   - Serie: `HG-TEST-A-01`.
   - Alias: `Dispositivo Prueba A-01`.
   - Modelo: `HydroGuard Prototype`.
   - Entorno: Prototipo académico.
   - Capacidades: `Sensor de pH` y `Sensor de temperatura`; quite cualquier otra selección.
3. Presione **Registrar dispositivo**.

Resultado esperado:

- Aparece una pantalla de resultado con identidad técnica activa.
- Se muestra una credencial de activación ficticia.
- La credencial solo aparece en esa respuesta inmediata.

4. Presione **Copiar credencial** y guárdela temporalmente en un bloc de notas de prueba.
5. Presione **Continuar al detalle**.
6. Vuelva al listado y abra nuevamente el dispositivo.

Resultado esperado:

- El detalle muestra el estado de identidad, pero no vuelve a revelar la credencial.
- El dispositivo está activo sin vincular.
- La disponibilidad puede indicar que no existe comunicación; registrarlo no lo pone automáticamente en línea.

### 5.4 Registrar el dispositivo B

Repita el flujo con:

- Serie `HG-TEST-B-01`.
- Alias `Dispositivo Prueba B-01`.
- Modelo `HydroGuard Simulator`.
- Entorno Simulación.
- Capacidades pH y temperatura.

Guarde también su credencial antes de abandonar la pantalla.

Variantes negativas:

- Serie repetida: intente registrar otra vez `HG-TEST-A-01` con alias `Duplicado`, modelo `HydroGuard Prototype` y las dos capacidades. Debe rechazarse sin alterar el dispositivo original.
- Ninguna capacidad seleccionada: abra un alta nueva, desmarque todas las capacidades y envíe. Debe mostrarse la validación y no debe crearse el registro.
- Campos con solo espacios o menos de 3 caracteres: deben bloquearse en serie, alias y modelo.

### 5.5 Vincular cada dispositivo

1. Abra el detalle de `HG-TEST-A-01`.
2. En **Reservorio disponible**, seleccione `Tanque Prueba A-01`.
3. Presione **Vincular reservorio** y confirme.
4. Repita con el dispositivo B y `Tanque Prueba B-01`.

Resultado esperado:

- Cada dispositivo queda vinculado exclusivamente con su reservorio.
- Su estado administrativo indica que todavía no tiene responsable.
- Desde el reservorio puede abrirse el dispositivo correspondiente.
- Un reservorio ocupado deja de aparecer como opción para otro dispositivo.

**Subflujo de cancelación:** antes de confirmar la vinculación de B, seleccione **Cancelar** en el diálogo. El detalle debe seguir mostrando el dispositivo sin vincular. Repita y confirme para continuar.

### 5.6 Revocar una identidad técnica sin afectar el flujo principal

1. Registre un tercer dispositivo con serie `HG-ID-REV-01`.
   - Alias: `Dispositivo Identidad Revocable`.
   - Modelo: `HydroGuard Prototype`.
   - Entorno: Prototipo académico.
   - Capacidades: pH y temperatura.
2. Copie la credencial mostrada.
3. Continúe al detalle.
4. Presione **Revocar identidad técnica** y confirme.

Resultado esperado:

- La identidad cambia a revocada.
- El dispositivo y su historial administrativo permanecen.
- La credencial no vuelve a mostrarse.
- Desaparece la acción para revocar nuevamente.

Esta prueba solo modifica el estado mock. No autentica hardware real ni permite reactivar o rotar la credencial.

## 6. Incorporar al primer Operario

**Propósito:** separar la identidad de acceso, gestionada en IAM, del perfil y las responsabilidades operativas, gestionadas en Configuration.

### 6.1 Crear la cuenta

1. Abra **Operarios → Nuevo Operario**.
2. Antes del alta válida, pruebe y corrija estos valores:
   - Nombre `Op`: requiere al menos 3 caracteres.
   - Identificador `operador prueba`: el espacio no está permitido.
   - Contraseña `12345`: requiere al menos 6 caracteres.
3. Complete:
   - Nombre: `Operario Prueba Uno`.
   - Identificador: `operador.prueba.01`.
   - Contraseña definitiva: `operario123`.
4. Presione **Crear Cuenta de Operario**.

Resultado esperado:

- La cuenta se crea activa.
- La contraseña es definitiva; el Operario no tendrá que cambiarla en el alcance actual.
- La aplicación continúa al paso de creación del perfil.

No cancele ahora el siguiente formulario. Si se cancela accidentalmente, la cuenta se conserva y desde su detalle aparece **Completar perfil operativo**.

### 6.2 Crear perfil y asignaciones

1. Verifique que **Cuenta del operario** ya muestre `Operario Prueba Uno`; si no, selecciónela.
2. Seleccione `Grupo Prueba 01`.
3. Espere a que se carguen los pares y seleccione simultáneamente `Tanque Prueba A-01 · HG-TEST-A-01` y `Tanque Prueba B-01 · HG-TEST-B-01`.
4. Presione **Crear perfil y asignaciones** y seleccione **Cancelar** en el primer diálogo.
5. Compruebe que continúa en el formulario y que ambos pares siguen seleccionables.
6. Presione nuevamente **Crear perfil y asignaciones** y confirme.

Resultado esperado:

- El perfil pertenece a un único grupo.
- Contiene dos asignaciones activas.
- Ambos dispositivos quedan asignados al mismo Operario.
- Los pares dejan de estar disponibles para otros perfiles.
- El perfil queda pendiente de primer acceso.

### 6.3 Comprobar la integración con IAM

1. Desde el perfil seleccione **Ver cuenta**.
2. Revise **Vínculos Operativos**.

Resultado esperado:

- IAM muestra el grupo, perfil y asignaciones en modo de solo lectura.
- La pantalla indica que el Operario está listo para recibir el código.
- La modificación de estos vínculos se hace desde Perfiles, no desde IAM.

Para comprobar la duplicidad sin interrumpir el alta principal:

1. Abra **Operarios → Nuevo Operario**.
2. Use nombre `Operario Duplicado`, identificador `operador.prueba.01` y contraseña `operario123`.
3. Envíe. Debe aparecer un error y debe seguir existiendo una sola cuenta con ese identificador.
4. Presione **Cancelar**, regrese a `Operario Prueba Uno` y continúe con su código.

### 6.4 Generar, revocar y reemplazar el código

1. Presione **Código de Primer Acceso**.
2. Revise que las precondiciones indiquen cuenta activa, perfil existente y al menos una asignación activa.
3. Presione **Generar Código de Primer Acceso**.
4. Copie el código.

Resultado esperado:

- El código queda activo.
- No presenta caducidad temporal en este prototipo.
- Solo puede existir un código activo para ese perfil.

5. Presione **Revocar Código Activo** y confirme.
6. Presione **Generar Código de Reemplazo**.

Resultado esperado:

- El primer código queda revocado.
- Se genera un código nuevo y activo.

No puede probarse su consumo: el primer acceso móvil todavía no está implementado.

**Subflujo de cancelación:** cancele una revocación en el diálogo y compruebe que el código sigue activo. Luego repita y confirme.

## 7. Historial y reasignación manual

### 7.1 Cerrar una responsabilidad

1. Abra **Perfiles**.
2. Abra `Operario Prueba Uno`.
3. En **Asignaciones e historial**, cierre la asignación del tanque A.
4. Confirme la operación.

Resultado esperado:

- La fila permanece visible como cerrada.
- Aparece su fecha de cierre.
- Dispositivo y reservorio continúan vinculados.
- El par A queda sin responsable y disponible.
- El código continúa activo porque el Operario todavía conserva el par B.

### 7.2 Crear el segundo Operario y reasignar A

1. Abra **Operarios → Nuevo Operario**.
2. Escriba nombre `Operario Prueba Dos`, identificador `operador.prueba.02` y contraseña `operario123`.
3. Presione **Crear Cuenta de Operario**.
4. En el formulario de perfil, seleccione `Grupo Prueba 01`.
5. Seleccione únicamente `Tanque Prueba A-01 · HG-TEST-A-01`; el par B no debe aparecer porque continúa asignado al primer Operario.
6. Presione **Crear perfil y asignaciones** y confirme.
7. Desde el perfil recién creado, abra **Código de primer acceso**, revise las precondiciones y genere un código activo para el segundo Operario.

Resultado esperado:

- Se crea una asignación nueva para el segundo Operario.
- El historial del primer Operario no desaparece.
- Nunca existen dos responsables activos para el mismo par.

### 7.3 Cerrar la última asignación del primer Operario

1. Regrese al perfil de `Operario Prueba Uno`.
2. Cierre la asignación B.
3. Abra su código de primer acceso.

Resultado esperado:

- El código de reemplazo se revoca automáticamente.
- El Operario queda sin asignaciones activas.
- El par B queda disponible.

### 7.4 Agregar B al segundo perfil

1. Abra el perfil de `Operario Prueba Dos`.
2. En **Agregar pares del mismo grupo**, seleccione B.
3. Presione **Agregar asignaciones** y confirme.

Resultado esperado: el segundo Operario queda responsable de A y B, mientras todos los registros anteriores permanecen en el historial.

## 8. Consultar configuraciones

Permanezca en la sesión de `ana.demo@hydroguard.test`. Esta sección termina las pruebas que pueden hacerse íntegramente con los recursos creados desde cero.

### 8.1 Dispositivo nuevo sin configuración

1. Abra **Dispositivos**.
2. Busque y abra `HG-TEST-A-01`.
3. Presione **Ver configuraciones**.

Resultado esperado:

- Se indica que no existen borradores ni versiones publicadas.
- El estado de configuración aparece como faltante.
- No se inventan rangos, compatibilidad ni una versión vigente.

No existen acciones web para crear, editar o publicar configuraciones. Esa responsabilidad futura corresponde al Operario móvil.

### 8.2 Listados, búsqueda, orden y paginación

**Propósito:** verificar los controles comunes sin confundir una búsqueda vacía con un fallo.

En **Grupos**, **Reservorios**, **Dispositivos** y **Perfiles**, ejecute el mismo patrón:

1. Escriba una parte inequívoca del recurso creado, por ejemplo `Prueba A-01`, y aplique la búsqueda.
2. Compruebe que solo aparecen coincidencias de la organización textil.
3. Escriba `NO-EXISTE-999`; debe mostrarse un estado vacío, no un error.
4. Limpie el texto, seleccione el filtro de estado **Activo** y aplíquelo.
5. Cambie el orden ascendente/descendente desde el encabezado disponible.
6. Si el listado supera el tamaño de página, cambie entre 5 y 10 elementos y avance/retroceda.
7. Abra un detalle desde el resultado y vuelva al listado; la navegación debe conservar una experiencia coherente, aunque no se garantiza conservar todos los filtros.

En **Operarios**, busque `Operario Prueba`; deben aparecer exactamente las dos cuentas creadas después de completar la sección 7. No deben verse cuentas pertenecientes a Textil San Juan ni Hidroverde Pachacámac.

### 8.3 Telemetría vacía de los dispositivos nuevos

1. Abra **Telemetría** sin cambiar de sesión.
2. Busque `HG-TEST-A-01` y abra **Ver historial**.
3. Compruebe que el dispositivo aparece por estar activo, pero pH y temperatura muestran `—`, la disponibilidad es desconocida y el historial está vacío.
4. Regrese y repita con `HG-TEST-B-01`.

Resultado esperado: registrar dispositivos no crea mediciones, heartbeat, procesos ni alertas ficticias.

### 8.4 Guardar referencias antes de cambiar de empresa

Copie en un bloc de notas las URL del detalle de:

- `Grupo Prueba 01`.
- Perfil de `Operario Prueba Dos`.
- Dispositivo `HG-TEST-A-01`.

Se usarán en la sección 11 para demostrar aislamiento. Después cierre sesión.

## 9. Cambiar a los datos semilla y probar telemetría

**Propósito:** validar consultas de solo lectura, origen de la medición, filtros, orden, paginación y estados sin datos. El botón **Actualizar** repite la consulta; no genera una medición nueva.

### 9.1 Iniciar la segunda fase de la demostración

1. En `/login`, ingrese correo `admin.textil@hydroguard.pe` y contraseña `adminpassword123`.
2. Compruebe que el encabezado identifica a **Textil San Juan S.A.C.** y que ahora sí existen recursos precargados.
3. Abra **Operarios → Marcelino Valencia → Código de Primer Acceso**. El código `HG-9482X1` debe aparecer como utilizado y no debe ofrecer revocación.
4. Abra `Jorge Quispe (Baja)`. La cuenta y perfil deben continuar consultables, su asignación debe estar cerrada y `HG-19Q7R4` debe figurar revocado.
5. Abra **Dispositivos → ESP32-HG-TX-001 → Ver configuraciones**.

Resultado esperado para configuraciones:

- Versión 1 publicada y vigente.
- Versión 2 en borrador.
- Se muestran rangos de pH y temperatura, modo de liberación y fechas.
- El borrador no sustituye a la versión vigente.

Estos son estados semilla porque la web actual no consume códigos ni publica configuraciones.

### 9.2 Resumen textil

1. Abra **Telemetría**.
2. Compruebe los datos precargados:

| Serie             | Entorno             | Disponibilidad | Fuente esperada |
| :---------------- | :------------------ | :------------- | :-------------- |
| `ESP32-HG-TX-001` | Prototipo académico | En línea       | Dispositivo     |
| `ESP32-HG-TX-002` | Simulación          | En línea       | Simulador       |
| `ESP32-HG-TX-003` | Prototipo académico | Fuera de línea | Dispositivo     |

3. Presione **Actualizar mediciones**.

Resultado esperado: la consulta se repite sin duplicar filas.

### 9.3 Búsqueda y filtros

Pruebe por separado y combinados:

- Buscar `ESP32-HG-TX-001`.
- Disponibilidad **En línea**: devuelve los dispositivos precargados 101 y 102.
- Disponibilidad **Fuera de línea**: devuelve el 203.
- Entorno **Simulación**: devuelve únicamente `ESP32-HG-TX-002` dentro de esta organización.
- Texto inexistente: muestra estado vacío, no un error.

Use exactamente `NO-EXISTE-999` para el caso vacío. Después de cada filtro, observe el total mostrado por el paginador y confirme que ninguna fila pertenece a la organización hidropónica.

Para limpiar la consulta, borre el texto, seleccione **Todas** y **Todos los entornos**, y aplique los filtros.

### 9.4 Historial físico

1. Abra el historial de `ESP32-HG-TX-001`.
2. Compruebe serie, reservorio, disponibilidad, último pH, temperatura y total.
3. Ordene por fecha, pH y temperatura.
4. Seleccione tamaño de página 5 y avance a la siguiente página.

Resultado esperado:

- El historial comienza por la medición más reciente.
- Existen más de cinco mediciones.
- Las páginas no repiten filas.
- El origen es dispositivo físico.

### 9.5 Historial simulado

1. Abra `ESP32-HG-TX-002`.
2. Filtre por **Simulador**: aparecen mediciones.
3. Filtre por **Dispositivo físico**: aparece un estado vacío.

### 9.6 Periodo inclusivo

En `dev-101` seleccione:

- Desde: `04/10/2026`.
- Hasta: `04/10/2026`.

Resultado esperado: aparecen cinco mediciones; la fecha final incluye el día completo.

Use un periodo sin datos, por ejemplo `01/01/2000` a `01/01/2000`, para comprobar el estado vacío.

## 10. Procesos de tratamiento

Permanezca con el Administrador textil. Treatment se presenta en modo de solo lectura: el Administrador supervisa y las acciones operativas pertenecen al Operario móvil.

### 10.1 Listado y filtros

1. Abra **Tratamientos**.
2. Compruebe que aparecen exactamente tres procesos textiles:
   - `ESP32-HG-TX-001` listo para liberar, con corrección aprobada y liberación manual pendiente.
   - `ESP32-HG-TX-002` corrigiendo, ciclo `1 / 3` y liberación no elegible.
   - Un proceso histórico de `ESP32-HG-TX-001` finalizado y liberado automáticamente sin correcciones.
3. Busque `ESP32-HG-TX-002`; debe quedar un solo proceso.
4. Limpie la búsqueda y filtre sucesivamente por **Corrigiendo**, **Listo para liberar** y **Finalizado**.
5. Use `NO-EXISTE-999` para comprobar el estado vacío y después limpie los filtros.

Resultado esperado: búsqueda, estado, total y navegación funcionan sin mostrar procesos hidropónicos.

### 10.2 Detalle listo para liberar

1. Abra **Ver detalle** en `trt-tx-ready`.
2. Compruebe:
   - Configuración versión `1`.
   - Rango pH `6.5 – 8.5`.
   - Rango de temperatura `18 – 30 °C`.
   - Estrategia `Corrección manual de pH`.
   - Aprobación `Aprobada`.
   - Ciclo `1 de 3` confirmado.
   - Medición inicial no conforme: pH `8.9`, temperatura `28.1 °C`.
   - Medición actual conforme: pH `7.2`, temperatura `24.6 °C`.
   - Liberación manual pendiente de confirmación.
3. Revise los eventos **Agua no conforme**, **Estrategia aprobada** y **Agua conforme**.
4. Use **Ver telemetría** y regrese al proceso.
5. Use **Ver trazabilidad** y compruebe que se selecciona el mismo dispositivo.

No debe existir ningún botón para aprobar, corregir, liberar, activar emergencia o restablecer desde Angular.

### 10.3 Procesos correctivo e histórico

1. Regrese a **Tratamientos** y abra `trt-tx-correcting`.
2. Compruebe que muestra actuación en ejecución, confirmación técnica pendiente y agua todavía no conforme.
3. Abra el proceso `trt-tx-released`.
4. Compruebe que no tiene ciclos, porque la medición inicial fue conforme, y que la liberación automática aparece autorizada y finalizada.

Estos procesos son datos mock. El motor que evalúa mediciones, selecciona estrategias y ordena actuaciones pertenecerá al backend real.

## 11. Monitoreo, alertas, incidentes y trazabilidad

Monitoring utiliza proyecciones precargadas. Los dispositivos creados durante esta guía no generan automáticamente procesos, alertas ni eventos.

### 11.1 Estado operacional

1. Abra **Estado operacional**.
2. Antes de atender alertas o registrar incidentes, revise los indicadores: `3` dispositivos supervisados, `2` en línea, `2` que requieren atención, `1` alerta activa y `0` incidentes abiertos.
3. Revise la tabla de dispositivos.
4. Presione **Actualizar**.

Resultado esperado:

- Se muestran última medición disponible, estado mock del proceso, disponibilidad y cantidad de alertas.
- Desde un dispositivo puede abrirse su trazabilidad.
- No aparecen controles para iniciar o aprobar un tratamiento.
- `ESP32-HG-TX-001` aparece listo y actualizado; `ESP32-HG-TX-002` está en corrección con una alerta; `ESP32-HG-TX-003` está fuera de línea y desactualizado.

### 11.2 Atender una alerta

1. Abra **Alertas**.
2. En **Buscar**, escriba `ESP32-HG-TX-002`.
3. En **Estado**, seleccione **Activa**; en **Severidad**, seleccione **Alta**; presione **Aplicar filtros**.
4. Debe quedar la alerta `pH 9.1 fuera del rango configurado (6.5–8.5)`.
5. Presione **Marcar atendida** y cancele el primer diálogo. La alerta debe seguir activa.
6. Repita, confirme y espere la recarga.

Resultado esperado:

- Su estado cambia a atendida.
- El botón desaparece para esa alerta.
- Los filtros y la paginación continúan funcionando.

Limpie la búsqueda, seleccione **Atendida** y **Todas** las severidades. Deben aparecer tanto la alerta recién atendida como la alerta media histórica de `ESP32-HG-TX-001`. Seleccionar **Activa + Alta** nuevamente debe producir un estado vacío.

No existe una acción para resolver o reabrir alertas.

### 11.3 Registrar un incidente

1. Abra **Incidentes**.
2. Presione **Registrar incidente** sin seleccionar dispositivo ni escribir descripción. Deben mostrarse errores y no debe cambiar el listado.
3. Seleccione `ESP32-HG-TX-001 · Poza de Acondicionamiento #1`.
4. Seleccione **Incidente de calidad**.
5. Escriba `Corto`. Debe indicarse que la descripción requiere entre 10 y 200 caracteres.
6. Sustituya el texto por `Incidente manual de calidad para la demostración integral.`.
7. Presione **Registrar incidente**.
8. En los filtros, busque `demostración integral`, estado **Abierto** y tipo **Calidad**; presione **Aplicar filtros**.

Resultado esperado:

- Se registra con estado abierto.
- Tiene un identificador de correlación.
- Se crea un evento relacionado para trazabilidad.

Variante: registre para el mismo dispositivo una **Pérdida de monitoreo** con la descripción `Pérdida de monitoreo simulada para comprobar el segundo tipo.`. Luego filtre por tipo **Pérdida de monitoreo** y compruebe que aparece únicamente ese nuevo caso.

Para completar el flujo sencillo:

1. Presione **Cerrar incidente** en el incidente de calidad.
2. Cancele el primer diálogo y compruebe que continúa abierto.
3. Repita la acción y confirme.
4. Filtre por estado **Cerrado** y compruebe que aparece con su historial conservado.
5. Filtre por estado **Abierto** y compruebe que la pérdida de monitoreo continúa pendiente.

El alcance no incluye responsables, comentarios, adjuntos, prioridades ni estados intermedios. Un incidente solo pasa de `ABIERTO` a `CERRADO`.

### 11.4 Consultar trazabilidad

1. Abra **Trazabilidad**.
2. Seleccione `ESP32-HG-TX-001`.
3. Use como fecha inicial `2026-09-26` en el selector de fecha.
4. Use como fecha final la fecha local del día de la prueba; por ejemplo, el 08/10/2026 corresponde a `2026-10-08`.
5. Presione **Consultar**.

Resultado esperado:

- Aparece una línea temporal con mediciones, correcciones, alertas, incidentes y liberaciones mock cuando correspondan.
- Los dos incidentes recién creados aparecen porque la fecha final incluye el día actual.
- Los eventos muestran correlación y ciclo cuando existe.

**Subflujos:**

- Seleccione `ESP32-HG-TX-002` y consulte del `2026-10-03` al `2026-10-03`: deben aparecer la medición fuera de rango y la alerta correlacionada.
- Consulte `ESP32-HG-TX-001` del `2000-01-01` al `2000-01-01`: deben mostrarse `0` eventos y el botón de reporte debe quedar deshabilitado.
- Deje un campo requerido vacío: **Consultar** debe quedar deshabilitado o marcar el formulario como inválido.

### 11.5 Generar y descargar un reporte

1. Vuelva a seleccionar `ESP32-HG-TX-001`, fecha inicial `2026-09-26` y fecha final del día actual; presione **Consultar**.
2. Cuando la línea temporal vuelva a contener eventos, presione **Generar reporte**.
3. Revise el resumen generado.
4. Presione **Exportar CSV**.
5. Compruebe que el navegador descarga un archivo cuyo nombre comienza por `trazabilidad-ESP32-HG-TX-001-`.
6. Abra el CSV y verifique encabezados de fecha, tipo, evento, descripción, actor, ciclo, pH, temperatura y resultado.

Después consulte `01/01/2000` a `01/01/2000`.

Resultado esperado:

- La línea temporal queda vacía.
- No puede generarse un reporte válido sin información suficiente.

## 12. Aislamiento entre empresas

**Propósito:** demostrar que el token determina la organización y que cambiar una URL no permite consultar datos ajenos.

1. Mantenga la sesión textil utilizada en las secciones 9, 10 y 11.
2. Pegue una por una las tres URL de Empresa Demostración HydroGuard guardadas en 8.4: grupo, perfil y dispositivo.

Resultado esperado: los tres recursos aparecen como no encontrados; Textil San Juan no puede consultar datos creados por `ana.demo@hydroguard.test`.

3. Abra `http://127.0.0.1:4200/telemetry/devices/dev-101` y copie esa URL textil.
4. Cierre sesión.
5. Inicie sesión con `admin.hidro@hydroguard.pe` y contraseña `adminpassword123`.
6. Pegue la URL `/telemetry/devices/dev-101` y después cualquiera de las URL de Empresa Demostración.

Resultado esperado:

- Los recursos aparecen como no encontrados.
- No se exponen nombres, mediciones ni asignaciones textiles.
- Los listados solo muestran recursos hidropónicos.

7. Abra **Telemetría** desde el menú.

Resultado esperado:

- `ESP32-HG-HP-001`: prototipo académico, disponibilidad retrasada y fuente dispositivo.
- `ESP32-HG-HP-002`: simulación, fuera de línea y fuente simulador.

8. Abra **Dispositivos**, entre en `ESP32-HG-HP-002` y compruebe que su identidad técnica está revocada. No debe mostrarse ninguna credencial original.
9. Abra `ESP32-HG-HP-001 → Ver configuraciones`. Debe mostrarse la versión publicada como incompatible y la razón semilla relacionada con la capacidad de calentamiento.
10. Abra **Operarios**:

- `Lucía Paredes` representa cuenta activa con primer acceso utilizado.
- `Carlos Mendoza` representa perfil pendiente con código activo `HG-31Z8P9`.

11. Abra **Alertas** y filtre por severidad **Crítica**: debe aparecer la pérdida de monitoreo de `ESP32-HG-HP-002`.
12. Abra **Tratamientos** y compruebe que aparecen exactamente cuatro procesos: aprobación pendiente, espera, fallo y emergencia. Abra la aprobación pendiente y confirme que todavía no existen ciclos; después abra fallo y emergencia y verifique que sus motivos sean distintos y que la liberación permanezca no elegible.
13. Abra **Grupos → Crear grupo**.

Resultado esperado: el segmento se hereda como Hidropónico y el campo opcional cambia a cultivo o tipo de planta.

No modifique ni dé de baja estos datos hidropónicos: son escenarios semilla para identidad revocada, incompatibilidad, retraso, fallo, alerta crítica y acceso pendiente.

## 13. Reglas negativas verificables desde la interfaz

Cierre la sesión hidropónica e inicie nuevamente con `ana.demo@hydroguard.test` y `DemoAdmin123`. Compruebe las condiciones que todavía no se probaron directamente; las filas marcadas durante secciones anteriores sirven como lista de control y no requieren repetir el alta.

| Acción                                                     | Resultado esperado                                                     |
| :--------------------------------------------------------- | :--------------------------------------------------------------------- |
| Enviar formularios obligatorios vacíos                     | Se muestran validaciones y no se envía la operación.                   |
| Repetir grupo, código de reservorio o serie de dispositivo | El servidor rechaza el duplicado.                                      |
| Registrar capacidad igual o menor que cero                 | Validación.                                                            |
| Registrar dispositivo sin capacidades                      | Validación.                                                            |
| Vincular un reservorio ocupado                             | No aparece como opción disponible.                                     |
| Crear otro perfil para la misma cuenta                     | La cuenta no aparece como elegible.                                    |
| Asignar un par ocupado                                     | No aparece como disponible.                                            |
| Generar código sin perfil o asignaciones                   | El botón queda deshabilitado y se muestran precondiciones incompletas. |
| Retirar vinculación con responsable activo                 | Conflicto; primero debe cerrarse la asignación.                        |
| Desactivar grupo con dependencias activas                  | Conflicto.                                                             |
| Cancelar una confirmación                                  | No cambia el recurso.                                                  |

Las opciones ocultas demuestran prevención en la interfaz. Las reglas del servidor ante solicitudes manipuladas se cubren mediante `npm run verify:bc02`.

## 14. Bajas lógicas y conservación del historial

Realice esta sección al final porque desactiva los recursos creados.

1. Mantenga la sesión de `ana.demo@hydroguard.test` abierta desde la sección 12.
2. Abra la cuenta de `Operario Prueba Uno` y presione **Dar de Baja**.
3. Abra la cuenta de `Operario Prueba Dos` y presione **Dar de Baja**.

Resultado esperado:

- Las cuentas permanecen visibles como inactivas.
- Sus perfiles se desactivan.
- Las asignaciones activas se cierran.
- Los códigos pendientes se revocan.
- El historial se conserva.

4. Abra cada dispositivo A y B.
5. Presione **Retirar vinculación**.
6. Desactive ambos dispositivos.
7. Desactive el dispositivo usado para probar revocación de identidad.
8. Desactive los dos reservorios.
9. Desactive `Grupo Prueba 01`.
10. Filtre los listados por estado inactivo.

Resultado esperado:

- Todos los recursos siguen disponibles para consulta histórica.
- No existe borrado físico.
- El orden impide dejar dependencias activas bajo recursos inactivos.

No está implementada la reactivación.

## 15. Errores, sesión y experiencia responsive

### 15.1 Desconexión

1. Mantenga abierto un listado o Telemetría.
2. Detenga el mock con `Ctrl+C`.
3. Cambie un filtro o presione actualizar.

Resultado esperado:

- Aparece un error de conexión.
- Se ofrece **Reintentar** cuando corresponde.
- Una desconexión no se presenta como una lista legítimamente vacía.

4. Inicie nuevamente el mock usando la misma copia.
5. Realice otra consulta.

Resultado esperado: la sesión anterior recibe `401`, se limpia localmente y la aplicación vuelve al login. Inicie sesión otra vez y repita la consulta.

### 15.2 Pantalla pequeña

1. Abra las herramientas de desarrollo del navegador.
2. Use aproximadamente 390 px de ancho.
3. Recorra Operarios, Dispositivos, Perfiles, Telemetría y Monitoreo.

Resultado esperado:

- El menú lateral se abre mediante el botón superior.
- Formularios y acciones siguen siendo accesibles.
- Las tablas amplias permiten desplazamiento horizontal en su contenedor.
- No se pierde la posibilidad de volver o cerrar sesión.

### 15.3 Estados vacíos

Pruebe búsquedas inexistentes en los listados y periodos sin mediciones o eventos.

Resultado esperado: aparece una explicación de estado vacío, distinta de un error de servidor.

## 16. Verificación automática complementaria

La guía principal es manual. Como comprobación adicional puede ejecutar:

```powershell
npm run build
npm run verify:bc02
npm run verify:bc04
npm run verify:bc05
```

Resultados esperados en la rama integrada actual:

- Compilación correcta.
- BC-02: 88 comprobaciones HTTP aprobadas, incluyendo Device Identity.
- BC-04: consultas, estados, detalle y aislamiento de Treatment aprobados.
- BC-05: comprobaciones aprobadas para trazabilidad, incidencias, reportes y reglas de acceso.

## 17. Funciones que todavía no están implementadas

### Aplicación móvil del Operario

- Consumir el código de primer acceso.
- Iniciar sesión desde Flutter.
- Consultar únicamente sus asignaciones.
- Completar y publicar configuraciones.
- Aprobar la estrategia de tratamiento.
- Liberar, detener o restablecer un proceso.

### Dispositivo y Edge

- Ejecución del **HydroGuard Edge Agent en la laptop**. El flujo acordado es `ESP32 o Wokwi → laptop Edge → HTTPS/REST → backend en la nube`.
- Autenticación real mediante la credencial técnica.
- Activación, rotación o reenrolamiento de credenciales.
- Recepción de datos desde ESP32 o Wokwi.
- `POST /edge/v1/telemetry`.
- Detección real de duplicados y validación física de mediciones.
- Cálculo temporal real del heartbeat.

### Telemetry y ejecución real de Treatment

- Actualización automática, WebSocket o streaming.
- Historial de comandos técnicos.
- Motor backend para evaluar conformidad y seleccionar automáticamente una estrategia.
- Dosificación, actuación térmica o LED controlados por el sistema.
- Ciclos automáticos de corrección y reevaluación.
- Autorización real de apertura o cierre de válvula.
- Diferenciación ejecutable entre fallo y emergencia.

### Monitoring y notificaciones

- Generación automática de alertas a partir de telemetría nueva.
- Resolución o reapertura de alertas.
- Reapertura de incidentes cerrados y estados intermedios de investigación.
- Firebase Cloud Messaging y notificaciones push.
- Actualizaciones operativas en tiempo real.

### Administración

- Editar grupos, reservorios o dispositivos ya registrados.
- Reactivar recursos inactivos.
- Recuperar una credencial técnica después de abandonar el alta.
- Crear un segundo Administrador para la misma empresa.
- Persistencia, seguridad y transacciones de un backend productivo.

## 18. Criterio de aceptación global actual

La aplicación web actual se considera validada cuando una persona puede:

1. Registrarse o iniciar sesión como Administrador.
2. Preparar grupo, reservorios, dispositivos e identidades mock.
3. Crear cuentas, perfiles, asignaciones y códigos.
4. Cerrar y reasignar responsabilidades conservando el historial.
5. Consultar configuraciones y telemetría sin inventar datos ausentes.
6. Consultar procesos, estrategias, ciclos, fallos y liberaciones en modo administrativo.
7. Atender alertas, registrar y cerrar incidentes, y exportar trazabilidad.
8. Comprobar el aislamiento entre organizaciones.
9. Ejecutar bajas lógicas respetando dependencias.
10. Recuperarse de errores de red y utilizar la interfaz en pantalla pequeña.

Superar estas pruebas valida el frontend administrativo, incluida la supervisión de Treatment, y sus contratos mock. No demuestra todavía el funcionamiento físico del ESP32, la capa Edge en la laptop, Flutter, el motor backend de Treatment, FCM ni el backend productivo futuro.
