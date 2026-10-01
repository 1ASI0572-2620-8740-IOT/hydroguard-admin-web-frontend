# Guía de pruebas de BC-02 — Configuración operativa

Esta guía explica cómo probar la aplicación web administrativa y por qué cada resultado importa. BC-02 incorpora grupos, reservorios, dispositivos, vinculación, perfiles de operario, asignaciones con historial y consulta de configuraciones. Se integra con IAM para completar el alta de una cuenta y generar su código de primer acceso.

## 1. Preparar el entorno

Requisitos: Node.js 22, npm 11 y un navegador actualizado. Ejecute los comandos desde la raíz del proyecto.

Si necesita instalar las dependencias:

```powershell
npm install
```

En una primera terminal:

```powershell
npm run mock:api
```

En otra terminal:

```powershell
npm start
```

Abra `http://127.0.0.1:4200/`. El puerto `3000` contiene la API, no la interfaz. `http://127.0.0.1:3000/api/v1/health` debe responder `status: "UP"`.

Si el mock estaba abierto antes de actualizar el código, reinícielo. Al reiniciar se pierden las sesiones en memoria: vuelva a iniciar sesión.

### Cuentas de demostración

| Empresa     | Correo                       | Contraseña local ficticia |
| :---------- | :--------------------------- | :------------------------ |
| Textil      | `admin.textil@hydroguard.pe` | `adminpassword123`        |
| Hidropónica | `admin.hidro@hydroguard.pe`  | `adminpassword123`        |

Las pruebas manuales guardan cambios en `mock-api/db.json`. Utilice nombres y códigos nuevos cada vez, por ejemplo agregando `-02` al repetir una prueba.

Para trabajar sobre una copia descartable en PowerShell, en lugar del primer comando de arranque:

```powershell
New-Item -ItemType Directory -Path tmp -Force | Out-Null
Copy-Item -LiteralPath mock-api/db.json -Destination tmp/bc02-manual-db.json
$env:MOCK_DB_PATH = (Resolve-Path -LiteralPath tmp/bc02-manual-db.json).Path
npm run mock:api
```

Esta variable solo afecta a la terminal en la que se define. Cierre esa terminal al terminar. No copie la base de pruebas sobre la base original.

## 2. Verificación automática reproducible

```powershell
npm run build
npm run verify:bc02
```

Resultado esperado: compilación correcta y un mensaje `BC-02: ... comprobaciones HTTP aprobadas`. El script termina con código `0`; ante una respuesta o condición incorrecta termina con error y muestra qué operación falló.

El script inicia su propio mock en un puerto disponible, utiliza una copia temporal de la base, crea sus datos, ejecuta escenarios positivos y negativos, detiene el servidor y elimina únicamente sus archivos temporales. No necesita que Angular esté abierto ni modifica la base de desarrollo.

Verifica aislamiento empresarial, validaciones, asignaciones indivisibles, dos solicitudes simultáneas compitiendo por un dispositivo, integración con códigos, cierre y reasignación, bajas lógicas, persistencia y versiones. Incluye un proceso activo ficticio en su copia temporal para comprobar que no se puede cerrar una asignación ni desactivar su responsable mientras está operando.

**Por qué:** compilar detecta errores TypeScript y de plantillas; las comprobaciones HTTP detectan reglas que no pueden garantizarse solamente ocultando botones en Angular. Son pruebas de integración del mock, no pruebas unitarias ni evidencia de seguridad del backend productivo.

## 3. Recorrido principal: preparar una unidad operativa

Inicie sesión con el administrador textil. La navegación debe mostrar Operarios, Grupos, Reservorios, Dispositivos y Perfiles, con la sección actual resaltada.

### A. Crear un grupo

1. Abra **Grupos → Crear grupo**.
2. Ingrese nombre `Grupo QA-01`, propósito `Pruebas de tratamiento` y proceso/área `Validación`.
3. Guarde.

**Esperado:** aparece el detalle del grupo, con estado Activo y segmento Textil. Al volver al listado debe aparecer el registro. El segmento no es editable. El grupo recién creado muestra sus integrantes y reservorios vacíos.

**Por qué:** confirma persistencia, navegación y herencia del segmento. Un grupo puede estar vacío mientras se prepara su estructura.

### B. Registrar dos reservorios

1. Desde el detalle del grupo pulse **Registrar reservorio**; el grupo debe quedar seleccionado.
2. Registre `Tanque QA-A`, código `QA-A-01`, tipo Tanque y ubicación `Área QA`.
3. Deje vacía la capacidad.
4. Repita para `Tanque QA-B`, código `QA-B-01`, en el mismo grupo; esta vez indique capacidad `100`.

**Esperado:** ambos están activos, pertenecen al grupo y muestran sus datos. El primero indica capacidad sin especificar. Todavía no tienen dispositivo vinculado.

**Por qué:** valida el vínculo grupo-reservorio, la capacidad opcional y el estado de preparación incompleta.

### C. Registrar y vincular dispositivos

1. Abra **Dispositivos → Registrar dispositivo**.
2. Registre serie `QA-DEVICE-A-01`, alias `Dispositivo QA-A`, modelo `HydroGuard QA`, entorno Simulación y capacidades de pH y temperatura.
3. Guarde y seleccione `Tanque QA-A` en su detalle.
4. Pulse **Vincular reservorio** y confirme.
5. Repita con serie `QA-DEVICE-B-01` y `Tanque QA-B`.

**Esperado:** el alta deja cada dispositivo Activo sin vincular. Tras vincularlo pasa a Activo sin responsable. La disponibilidad inicial indica Sin comunicación registrada; no cambia a En línea por el hecho de registrarlo o vincularlo. El detalle del reservorio permite abrir su dispositivo.

**Por qué:** el estado administrativo y la disponibilidad técnica son independientes. La vinculación prepara el par sin asignar todavía un operario.

## 4. Cuenta → perfil → asignaciones → código

1. Abra **Operarios → Nuevo Operario**.
2. Cree `Operario QA-01`, identificador `qa.operario.01` y contraseña definitiva `operario123`.
3. Al guardar debe abrirse **Crear perfil de operario**, con esa cuenta seleccionada.
4. Seleccione `Grupo QA-01`.
5. Seleccione los dos pares disponibles y pulse **Crear perfil y asignaciones**. Confirme.
6. En el detalle pulse **Código de primer acceso** y después **Generar Código de Primer Acceso**.

**Esperado:** el perfil queda Pendiente de primer acceso, con un grupo y dos asignaciones activas. Ambos dispositivos quedan Activo asignado. IAM muestra los mismos vínculos en el detalle de la cuenta. Se genera un código activo.

**Por qué:** comprueba que las capas de IAM y Configuración se coordinan y que la generación de código depende de un perfil completo. Crear un perfil todavía no significa que el operario haya iniciado sesión.

Si todavía no tiene unidades preparadas al crear la cuenta, puede cancelar la creación del perfil. La cuenta se conserva; desde su detalle, **Completar perfil operativo** permite retomar el flujo sin crear otra cuenta.

El uso del código y la publicación de configuraciones corresponden a Flutter y su backend. Esta entrega permite preparar y consultar el acceso desde Angular.

## 5. Cierre, historial y reasignación manual

1. Abra el perfil `Operario QA-01`.
2. Pulse **Cerrar asignación** para `Tanque QA-A` y confirme.
3. Compruebe que la fila continúa visible como Cerrada, con fecha de cierre.
4. Cree otra cuenta `Operario QA-02`, identificador `qa.operario.02`, y su perfil en el mismo grupo, usando el par QA-A disponible.
5. En el primer perfil cierre también la asignación QA-B.

**Esperado:** cerrar una asignación deja su dispositivo Activo sin responsable, conservando la vinculación con el reservorio. QA-A solo queda asignado al segundo perfil cuando usted lo selecciona manualmente. Al cerrar la última asignación del primer perfil se revoca su código activo.

**Por qué:** una reasignación crea un registro nuevo y conserva la relación anterior; no existe transferencia automática. Un código pendiente deja de ser válido si el perfil pierde todas sus asignaciones.

Para comprobar el reemplazo del código, agregue QA-B nuevamente al primer perfil y genere un código de reemplazo desde IAM. Debe conservarse la asignación cerrada y aparecer una nueva activa.

## 6. Restricciones y pruebas negativas

| Prueba                                                   | Resultado esperado                                                   | Por qué                                                      |
| :------------------------------------------------------- | :------------------------------------------------------------------- | :----------------------------------------------------------- |
| Guardar un grupo con campos vacíos o solo espacios       | Validación; no se crea                                               | Evita registros sin identificación útil.                     |
| Repetir el nombre de un grupo activo en la misma empresa | Conflicto                                                            | Evita duplicados administrativos ambiguos.                   |
| Repetir un código de reservorio                          | Conflicto                                                            | El código identifica el reservorio dentro de la empresa.     |
| Capacidad cero o negativa                                | Validación                                                           | La capacidad opcional, cuando se informa, debe ser positiva. |
| Repetir número de serie de dispositivo                   | Conflicto                                                            | Una serie no representa dos dispositivos.                    |
| Registrar dispositivo sin capacidades                    | Validación                                                           | La ficha necesita declarar al menos una capacidad.           |
| Vincular otro dispositivo a un reservorio ya vinculado   | El reservorio no aparece; una solicitud directa se rechaza con `409` | Existe un dispositivo por reservorio.                        |
| Crear otro perfil para una cuenta que ya tiene uno       | La cuenta no aparece; una solicitud directa se rechaza con `409`     | Un operario tiene un perfil y un grupo.                      |
| Asignar un par que ya tiene responsable                  | No aparece disponible; una solicitud directa se rechaza con `409`    | No se comparten responsables activos.                        |
| Asignar un reservorio de otro grupo                      | No aparece; una solicitud directa se rechaza con `409`               | Todas las asignaciones del perfil pertenecen a su grupo.     |
| Desactivar grupo con reservorios o perfiles activos      | Conflicto y recarga del estado                                       | Evita dejar recursos activos bajo un grupo inactivo.         |
| Retirar vinculación con una asignación activa            | Conflicto                                                            | Primero debe cerrarse la responsabilidad.                    |
| Generar código sin perfil o sin asignaciones             | Rechazo                                                              | El primer acceso necesita un contexto operativo completo.    |
| Pulsar varias veces una acción mientras se envía         | Botón deshabilitado; un envío                                        | Evita operaciones duplicadas desde esa pantalla.             |

Las opciones ocultas no bastan para demostrar una restricción: el script automático envía solicitudes directas para comprobar que el servidor también la impone. Una solicitud rechazada con varios pares no debe guardar parcialmente los pares válidos.

## 7. Desactivaciones lógicas

Pruebe con los recursos QA creados, para conservar los ejemplos originales:

1. Desactive los perfiles QA y confirme. Sus asignaciones activas deben quedar Cerradas y sus códigos pendientes, Revocados. Las cuentas se conservan.
2. En cada dispositivo pulse **Retirar vinculación**. Debe quedar Activo sin vincular.
3. Desactive los dispositivos.
4. Desactive los reservorios.
5. Desactive el grupo.
6. Filtre los listados por Inactivo y abra los detalles.

**Esperado:** los recursos siguen existiendo; no hay borrado físico ni pérdida de asignaciones históricas. Al dar de baja una cuenta desde IAM también se desactiva su perfil, se cierran sus asignaciones y se revocan sus códigos pendientes.

**Por qué:** el orden protege las dependencias. Los registros históricos deben permitir identificar quién tuvo cada dispositivo y cuándo terminó la responsabilidad.

## 8. Configuraciones y versiones

Los datos de demostración incluyen:

| Cuenta                           | Dispositivo          | Resultado                                                |
| :------------------------------- | :------------------- | :------------------------------------------------------- |
| Textil                           | `dev-101`            | Versión 1 publicada vigente y versión 2 en borrador.     |
| Hidropónica                      | `dev-201`            | Versión publicada marcada incompatible, con motivo mock. |
| Cualquiera, dentro de su empresa | Dispositivo nuevo QA | Sin configuración publicada y lista de versiones vacía.  |

Abra el detalle y pulse **Ver configuraciones**. También puede usar `/devices/dev-101/configurations` con la cuenta textil.

**Esperado:** se muestran versión, estado, rangos de pH/temperatura, modo de liberación, fechas y motivos de incompatibilidad. El borrador de versión 2 no reemplaza la versión vigente 1. No hay botones de edición ni publicación para el administrador.

**Por qué:** la web supervisa configuraciones publicadas por el operario. La compatibilidad se presenta según la respuesta del servidor; los valores de los ejemplos son escenarios ficticios y Angular no recalcula esa decisión ni evalúa la conformidad del agua.

## 9. Aislamiento empresarial y sesiones

1. Con la cuenta textil, copie la URL del grupo QA y de un perfil QA.
2. Cierre sesión e ingrese con la cuenta hidropónica.
3. Abra esas URLs.
4. Consulte Grupos y Dispositivos.

**Esperado:** las URLs ajenas muestran recurso no encontrado; los listados contienen solamente recursos hidropónicos. El formulario de grupo hereda Hidropónico y muestra el campo opcional de cultivo/planta.

Pruebe una ruta protegida en una ventana privada sin iniciar sesión: debe ir a `/login`. Reinicie el mock con una sesión abierta y haga una consulta: su token anterior recibirá `401`, la aplicación limpiará la sesión y volverá al acceso.

**Por qué:** `organizationId` procede de la sesión validada por el servidor. Cambiar la URL, un parámetro de consulta o un formulario no concede acceso a otra empresa. Un `403` mantiene la sesión; un `401` la invalida.

## 10. Carga, filtros, desconexión y pantalla móvil

- Busque un nombre y espere la actualización. Cambie el estado, ordene las columnas disponibles y pruebe 5 elementos por página cuando haya suficientes registros. La búsqueda y los filtros vuelven a la primera página.
- Busque un texto inexistente: debe aparecer un estado vacío, no un error.
- Con un listado cargado, detenga el mock y cambie un filtro. Debe mostrarse el error de conexión, conservarse la información anterior y ofrecerse **Reintentar**. Tras arrancar otra vez el mock, deberá iniciar sesión de nuevo porque las sesiones no se persisten.
- Con las herramientas del navegador, use una conexión lenta y cambie rápidamente la búsqueda: debe mostrarse finalmente el resultado de la consulta más reciente.
- Reduzca el ancho a aproximadamente 390 px. La navegación y los formularios deben seguir siendo utilizables. Las tablas amplias permiten desplazamiento dentro de su contenedor.
- Cancele un diálogo de confirmación: no debe enviarse el comando ni cambiar el recurso.

**Por qué:** los estados excepcionales forman parte del flujo real. Conservar información previa permite distinguir una desconexión de una lista realmente vacía; cancelar consultas reemplazadas evita mostrar resultados antiguos sobre filtros nuevos.

## 11. Contratos HTTP implementados

Todas las rutas tienen prefijo `/api/v1` y las operaciones de BC-02 requieren sesión administradora.

| Método y recurso                          | Uso                                                                                    |
| :---------------------------------------- | :------------------------------------------------------------------------------------- |
| `GET /organizations/current`              | Organización y segmento autorizado.                                                    |
| `GET /operational-options`                | Grupos activos, reservorios disponibles para vincular y cuentas elegibles para perfil. |
| `GET /available-pairs?groupId=...`        | Pares activos sin responsable del grupo.                                               |
| `GET/POST /groups`                        | Listar y crear grupos.                                                                 |
| `GET /groups/:id`                         | Grupo, integrantes y reservorios.                                                      |
| `PATCH /groups/:id/status`                | Baja lógica.                                                                           |
| `GET/POST /reservoirs`                    | Listar y registrar reservorios.                                                        |
| `GET /reservoirs/:id`                     | Detalle y dispositivo vinculado.                                                       |
| `PATCH /reservoirs/:id/status`            | Baja lógica.                                                                           |
| `GET/POST /devices`                       | Listar y registrar dispositivos.                                                       |
| `GET /devices/:id`                        | Detalle, vinculación y responsable.                                                    |
| `POST /devices/:id/link`                  | Vinculación exclusiva; cuerpo `{ "reservoirId": "..." }`.                              |
| `POST /devices/:id/unlink`                | Retirar vinculación después de cerrar la asignación.                                   |
| `PATCH /devices/:id/status`               | Baja lógica.                                                                           |
| `GET /devices/:id/configurations`         | Versiones y configuración vigente, en consulta.                                        |
| `GET/POST /operator-profiles`             | Listar y crear perfil con sus primeras asignaciones.                                   |
| `GET /operator-profiles/:id`              | Perfil e historial de asignaciones.                                                    |
| `POST /operator-profiles/:id/assignments` | Agregar pares disponibles.                                                             |
| `POST /assignments/:id/close`             | Cerrar responsabilidad conservando el historial.                                       |
| `PATCH /operator-profiles/:id/status`     | Baja, cierre de asignaciones y revocación de códigos pendientes.                       |

Las bajas reciben `{ "status": "INACTIVE" }`. El alta de perfil recibe `userId`, `groupId` y `reservoirIds` con al menos un par. Agregar asignaciones recibe `reservoirIds`.

Los listados reciben `searchTerm`, `status`, `page` (desde 1), `pageSize` (máximo 100), `sortBy` y `sortDirection`; devuelven `items`, `total`, `page` y `pageSize`. Dispositivos admite además `availability`, `operatingEnvironment`, `configurationStatus` y `unlinked=true`.

Crear grupos, reservorios, dispositivos o perfiles enviando `organizationId` o `segment` se rechaza con `422`: ambos se derivan de la sesión. Los recursos ajenos responden `404`; conflictos de vínculos responden `409`; errores de campos responden `422` con `errors`.

## 12. Por qué la implementación está separada por capas

- `domain`: modelos y puertos sin imports de Angular ni Axios.
- `application`: casos de uso y estado de consultas con cancelación.
- `infrastructure/http`: repositorios Axios, DTO, parámetros y mappers.
- `presentation`: rutas con carga diferida, páginas standalone, formularios tipados y componentes reutilizables.
- `mock-api/configuration`: operaciones separadas por grupos, reservorios, dispositivos y perfiles; el servidor valida las relaciones antes de guardar.

La interfaz llama casos de uso y no accede al JSON. IAM consulta vínculos operativos sin modificar los modelos internos de Configuración. El mock procesa las operaciones de lectura-validación-escritura en secuencia y guarda mediante un archivo temporal, evitando responsables duplicados o pérdida de datos entre solicitudes concurrentes en una misma instancia.

El backend productivo deberá implementar estos contratos y restricciones con autorización y transacciones reales. BC-02 no implementa firmware, telemetría en vivo, operación del tratamiento ni primer acceso móvil.

## 13. Criterio de aceptación

BC-02 queda validado cuando compila, pasa la verificación HTTP, permite completar el recorrido manual, preserva históricos, rechaza relaciones exclusivas inválidas, impide acceder a recursos ajenos y permite navegar y recuperarse de errores desde los tamaños de pantalla previstos.
