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

### 2.2 Crear una base descartable

Las operaciones manuales modifican el JSON utilizado por el mock. Para no alterar `mock-api/db.json`, ejecute en la primera terminal:

```powershell
New-Item -ItemType Directory -Path tmp -Force | Out-Null
Copy-Item -LiteralPath mock-api/db.json -Destination tmp/prueba-manual-integral.json -Force
$env:MOCK_DB_PATH = (Resolve-Path -LiteralPath tmp/prueba-manual-integral.json).Path
npm run mock:api
```

Mantenga esa terminal abierta. `MOCK_DB_PATH` solamente existe en ella.

Si desea comenzar nuevamente desde cero:

1. Detenga el mock con `Ctrl+C`.
2. Repita los comandos anteriores para reemplazar la copia temporal.
3. Inicie sesión nuevamente; las sesiones no sobreviven al reinicio del mock.

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

### 2.5 Datos propios de la prueba

Use un sufijo distinto en cada ejecución. En los ejemplos se utiliza `01`; si los nombres ya existen, cambie a `02`.

| Recurso                     | Valor sugerido                         |
| :-------------------------- | :------------------------------------- |
| Grupo                       | `Grupo Prueba 01`                      |
| Reservorio A                | `Tanque Prueba A-01`, código `TP-A-01` |
| Reservorio B                | `Tanque Prueba B-01`, código `TP-B-01` |
| Dispositivo A               | Serie `HG-TEST-A-01`                   |
| Dispositivo B               | Serie `HG-TEST-B-01`                   |
| Dispositivo para revocación | Serie `HG-ID-REV-01`                   |
| Operario 1                  | `operador.prueba.01`                   |
| Operario 2                  | `operador.prueba.02`                   |

## 3. Seguridad básica y sesión

1. Abra una ventana privada del navegador.
2. Introduzca directamente `http://127.0.0.1:4200/users`.
3. Compruebe que la aplicación redirige a `/login`.
4. Escriba un correo o una contraseña incorrectos.
5. Presione **Iniciar sesión**.

Resultado esperado:

- No se crea una sesión.
- Se muestra un error comprensible.
- No se muestran páginas administrativas.

6. Inicie sesión con `admin.textil@hydroguard.pe`.
7. Compruebe el menú lateral: Operarios, Grupos, Reservorios, Dispositivos, Perfiles, Estado operacional, Alertas, Incidentes, Trazabilidad y Telemetría.
8. Presione **Cerrar sesión**.
9. Intente volver con el botón del navegador.

Resultado esperado: las rutas protegidas vuelven a dirigir al login.

## 4. Registro de empresa y Administrador

Esta prueba verifica el onboarding, pero la empresa nueva no tendrá datos precargados de monitoreo.

1. Desde el login seleccione **Registrar empresa**.
2. Complete todos los campos con datos únicos:
   - Empresa: `Empresa Prueba 01`.
   - RUC: un número no usado de 11 dígitos.
   - Teléfono: un número válido.
   - Segmento: Textil o Hidropónico.
   - Nombre del Administrador.
   - Correo no registrado.
   - Contraseña de al menos 8 caracteres.
   - Confirmación idéntica.
3. Envíe el formulario.

Resultado esperado:

- Empresa y Administrador se crean conjuntamente.
- La aplicación regresa al login con confirmación.
- Las nuevas credenciales permiten iniciar sesión.
- Los listados de la empresa aparecen vacíos.
- No existe una opción para crear un segundo Administrador en esa empresa.

Variantes negativas:

- Contraseñas diferentes: el formulario no se envía.
- Correo inválido: aparece validación.
- RUC distinto de 11 dígitos: aparece validación.
- RUC o correo repetido: el servidor rechaza el registro.

Cierre esa sesión e ingrese con el Administrador textil de demostración para continuar.

## 5. Preparar una unidad operativa completa

El orden funcional es:

```text
Grupo → Reservorios → Dispositivos → Vinculación → Cuenta → Perfil → Asignaciones → Código
```

### 5.1 Crear el grupo

1. Abra **Grupos**.
2. Presione **Crear grupo**.
3. Complete:
   - Nombre: `Grupo Prueba 01`.
   - Propósito: `Validación manual integral`.
   - Proceso o área: `Área de pruebas`.
4. Presione **Crear grupo**.

Resultado esperado:

- Se abre el detalle del grupo.
- Su estado es activo.
- El segmento Textil se hereda de la empresa y no puede sustituirse desde el formulario.
- Integrantes y reservorios están inicialmente vacíos.

Variante negativa: intente crear otro grupo activo con el mismo nombre. Debe rechazarse.

### 5.2 Crear dos reservorios

1. Desde el grupo presione **Registrar reservorio**, o abra **Reservorios → Registrar reservorio**.
2. Registre el primero:
   - Grupo: `Grupo Prueba 01`.
   - Nombre: `Tanque Prueba A-01`.
   - Código: `TP-A-01`.
   - Tipo: Tanque.
   - Ubicación: `Área de pruebas`.
   - Capacidad: déjela vacía.
3. Registre el segundo:
   - Nombre: `Tanque Prueba B-01`.
   - Código: `TP-B-01`.
   - Capacidad: `100`.

Resultado esperado:

- Ambos reservorios están activos y pertenecen al grupo.
- El primero muestra capacidad sin especificar.
- Ninguno tiene todavía un dispositivo vinculado.

Variantes negativas:

- Repita un código: debe rechazarse.
- Introduzca capacidad `0` o negativa: debe mostrarse validación y no crearse el registro.

### 5.3 Registrar el dispositivo A y guardar su credencial

1. Abra **Dispositivos → Registrar dispositivo**.
2. Complete:
   - Serie: `HG-TEST-A-01`.
   - Alias: `Dispositivo Prueba A-01`.
   - Modelo: `HydroGuard Prototype`.
   - Entorno: Prototipo académico.
   - Capacidades: sensor de pH y sensor de temperatura.
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
- Entorno Simulación.
- Capacidades pH y temperatura.

Guarde también su credencial antes de abandonar la pantalla.

Variantes negativas:

- Serie repetida: debe rechazarse.
- Ninguna capacidad seleccionada: el formulario no debe enviarse.

### 5.5 Vincular cada dispositivo

1. Abra el detalle de `HG-TEST-A-01`.
2. Seleccione `Tanque Prueba A-01`.
3. Presione **Vincular reservorio** y confirme.
4. Repita con el dispositivo B y `Tanque Prueba B-01`.

Resultado esperado:

- Cada dispositivo queda vinculado exclusivamente con su reservorio.
- Su estado administrativo indica que todavía no tiene responsable.
- Desde el reservorio puede abrirse el dispositivo correspondiente.
- Un reservorio ocupado deja de aparecer como opción para otro dispositivo.

### 5.6 Revocar una identidad técnica sin afectar el flujo principal

1. Registre un tercer dispositivo con serie `HG-ID-REV-01`.
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

### 6.1 Crear la cuenta

1. Abra **Operarios → Nuevo Operario**.
2. Complete:
   - Nombre: `Operario Prueba 01`.
   - Identificador: `operador.prueba.01`.
   - Contraseña definitiva: `operario123`.
3. Presione **Crear Cuenta de Operario**.

Resultado esperado:

- La cuenta se crea activa.
- La contraseña es definitiva; el Operario no tendrá que cambiarla en el alcance actual.
- La aplicación continúa al paso de creación del perfil.

Variante: si cancela la creación del perfil, la cuenta debe conservarse. Desde su detalle aparecerá **Completar perfil operativo**.

### 6.2 Crear perfil y asignaciones

1. Seleccione la cuenta `Operario Prueba 01`.
2. Seleccione `Grupo Prueba 01`.
3. Seleccione simultáneamente los pares A y B.
4. Presione **Crear perfil y asignaciones** y confirme.

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

### 6.4 Generar, revocar y reemplazar el código

1. Presione **Código de Primer Acceso**.
2. Revise la lista de precondiciones.
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

## 7. Historial y reasignación manual

### 7.1 Cerrar una responsabilidad

1. Abra **Perfiles**.
2. Abra `Operario Prueba 01`.
3. En **Asignaciones e historial**, cierre la asignación del tanque A.
4. Confirme la operación.

Resultado esperado:

- La fila permanece visible como cerrada.
- Aparece su fecha de cierre.
- Dispositivo y reservorio continúan vinculados.
- El par A queda sin responsable y disponible.
- El código continúa activo porque el Operario todavía conserva el par B.

### 7.2 Crear el segundo Operario y reasignar A

1. Cree `Operario Prueba 02` con identificador `operador.prueba.02`.
2. Cree su perfil en `Grupo Prueba 01`.
3. Seleccione el par A liberado.

Resultado esperado:

- Se crea una asignación nueva para el segundo Operario.
- El historial del primer Operario no desaparece.
- Nunca existen dos responsables activos para el mismo par.

### 7.3 Cerrar la última asignación del primer Operario

1. Regrese al perfil de `Operario Prueba 01`.
2. Cierre la asignación B.
3. Abra su código de primer acceso.

Resultado esperado:

- El código de reemplazo se revoca automáticamente.
- El Operario queda sin asignaciones activas.
- El par B queda disponible.

### 7.4 Agregar B al segundo perfil

1. Abra el perfil de `Operario Prueba 02`.
2. En **Agregar pares del mismo grupo**, seleccione B.
3. Presione **Agregar asignaciones** y confirme.

Resultado esperado: el segundo Operario queda responsable de A y B, mientras todos los registros anteriores permanecen en el historial.

## 8. Consultar configuraciones

Los dispositivos recién creados no tienen configuraciones publicadas. Utilice los datos precargados.

### 8.1 Configuración textil

1. Abra **Dispositivos**.
2. Busque y abra `ESP32-HG-TX-001` (`dev-101`).
3. Presione **Ver configuraciones**.

Resultado esperado:

- Versión 1 publicada y vigente.
- Versión 2 en borrador.
- Rangos de pH y temperatura, modo de liberación y fechas.
- El borrador no sustituye a la versión vigente.

### 8.2 Dispositivo sin configuración

Abra las configuraciones de `HG-TEST-A-01`.

Resultado esperado: se indica que no existen borradores ni versiones publicadas.

No existen acciones web para crear, editar o publicar configuraciones. Esa responsabilidad futura corresponde al Operario móvil.

## 9. Telemetría

### 9.1 Resumen textil

1. Abra **Telemetría**.
2. Compruebe los datos precargados:

| Serie             | Entorno             | Disponibilidad | Fuente esperada |
| :---------------- | :------------------ | :------------- | :-------------- |
| `ESP32-HG-TX-001` | Prototipo académico | En línea       | Dispositivo     |
| `ESP32-HG-TX-002` | Simulación          | En línea       | Simulador       |
| `ESP32-HG-TX-003` | Prototipo académico | Fuera de línea | Dispositivo     |

Los dispositivos A, B y el dispositivo revocado también pueden aparecer, pero sin mediciones.

3. Presione **Actualizar mediciones**.

Resultado esperado: la consulta se repite sin duplicar filas.

### 9.2 Búsqueda y filtros

Pruebe por separado y combinados:

- Buscar `ESP32-HG-TX-001`.
- Disponibilidad **En línea**: devuelve los dispositivos precargados 101 y 102.
- Disponibilidad **Fuera de línea**: devuelve el 203.
- Entorno **Simulación**: devuelve el 102 y cualquier dispositivo nuevo creado en simulación.
- Texto inexistente: muestra estado vacío, no un error.

Para limpiar la consulta, borre el texto, seleccione **Todas** y **Todos los entornos**, y aplique los filtros.

### 9.3 Historial físico

1. Abra el historial de `ESP32-HG-TX-001`.
2. Compruebe serie, reservorio, disponibilidad, último pH, temperatura y total.
3. Ordene por fecha, pH y temperatura.
4. Seleccione tamaño de página 5 y avance a la siguiente página.

Resultado esperado:

- El historial comienza por la medición más reciente.
- Existen más de cinco mediciones.
- Las páginas no repiten filas.
- El origen es dispositivo físico.

### 9.4 Historial simulado

1. Abra `ESP32-HG-TX-002`.
2. Filtre por **Simulador**: aparecen mediciones.
3. Filtre por **Dispositivo físico**: aparece un estado vacío.

### 9.5 Periodo inclusivo

En `dev-101` seleccione:

- Desde: `04/10/2026`.
- Hasta: `04/10/2026`.

Resultado esperado: aparecen cinco mediciones; la fecha final incluye el día completo.

Use un periodo sin datos, por ejemplo `01/01/2000` a `01/01/2000`, para comprobar el estado vacío.

### 9.6 Dispositivo nuevo sin mediciones

Busque `HG-TEST-A-01` y abra su historial.

Resultado esperado:

- El dispositivo aparece por estar activo.
- pH y temperatura muestran `—`.
- El historial está vacío.
- No se inventan MAC, firmware, rangos o resultados de validación.

## 10. Monitoreo, alertas, incidentes y trazabilidad

Monitoring utiliza proyecciones precargadas. Los dispositivos creados durante esta guía no generan automáticamente procesos, alertas ni eventos.

### 10.1 Estado operacional

1. Abra **Estado operacional**.
2. Revise los indicadores de dispositivos, conectividad, atención, alertas e incidentes.
3. Revise la tabla de dispositivos.
4. Presione **Actualizar**.

Resultado esperado:

- Se muestran última medición disponible, estado mock del proceso, disponibilidad y cantidad de alertas.
- Desde un dispositivo puede abrirse su trazabilidad.
- No aparecen controles para iniciar o aprobar un tratamiento.

### 10.2 Atender una alerta

1. Abra **Alertas**.
2. Filtre por estado **Activa**.
3. Filtre por severidad alta o crítica.
4. Presione **Marcar atendida** sobre una alerta activa y confirme.

Resultado esperado:

- Su estado cambia a atendida.
- El botón desaparece para esa alerta.
- Los filtros y la paginación continúan funcionando.

No existe una acción para resolver o reabrir alertas.

### 10.3 Registrar un incidente

1. Abra **Incidentes**.
2. Seleccione `ESP32-HG-TX-001`.
3. Seleccione **Incidente de calidad**.
4. Escriba `Incidente manual de prueba integral 01`.
5. Presione **Registrar incidente**.
6. Búsquelo en el listado.

Resultado esperado:

- Se registra con estado abierto.
- Tiene un identificador de correlación.
- Se crea un evento relacionado para trazabilidad.

Variante: registre una **Pérdida de monitoreo** con una descripción diferente.

No existen acciones para cambiar el incidente a en revisión o cerrado.

### 10.4 Consultar trazabilidad

1. Abra **Trazabilidad**.
2. Seleccione `ESP32-HG-TX-001`.
3. Use como fecha inicial `26/09/2026`.
4. Use como fecha final la fecha actual. Si ejecuta esta guía el 08/10/2026, utilice `08/10/2026`.
5. Presione **Consultar**.

Resultado esperado:

- Aparece una línea temporal con mediciones, correcciones, alertas, incidentes y liberaciones mock cuando correspondan.
- El incidente recién creado aparece porque la fecha final incluye el día actual.
- Los eventos muestran correlación y ciclo cuando existe.

### 10.5 Generar y descargar un reporte

1. Con una trazabilidad que contenga eventos, presione **Generar reporte**.
2. Revise el resumen generado.
3. Presione **Exportar CSV**.
4. Compruebe que el navegador descarga el archivo.

Después consulte `01/01/2000` a `01/01/2000`.

Resultado esperado:

- La línea temporal queda vacía.
- No puede generarse un reporte válido sin información suficiente.

## 11. Aislamiento entre empresas

1. Con la sesión textil copie las URL de:
   - `Grupo Prueba 01`.
   - Perfil de `Operario Prueba 02`.
   - `HG-TEST-A-01`.
   - `/telemetry/devices/dev-101`.
2. Cierre sesión.
3. Inicie sesión con `admin.hidro@hydroguard.pe`.
4. Pegue cada URL textil.

Resultado esperado:

- Los recursos aparecen como no encontrados.
- No se exponen nombres, mediciones ni asignaciones textiles.
- Los listados solo muestran recursos hidropónicos.

5. Abra Telemetría.

Resultado esperado:

- `ESP32-HG-HP-001`: prototipo académico, disponibilidad retrasada y fuente dispositivo.
- `ESP32-HG-HP-002`: simulación, fuera de línea y fuente simulador.

6. Abra **Grupos → Crear grupo**.

Resultado esperado: el segmento se hereda como Hidropónico y el campo opcional cambia a cultivo o tipo de planta.

## 12. Reglas negativas verificables desde la interfaz

Compruebe al menos estas condiciones:

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

## 13. Bajas lógicas y conservación del historial

Realice esta sección al final porque desactiva los recursos creados.

1. Inicie nuevamente sesión como Administrador textil.
2. Abra la cuenta de `Operario Prueba 01` y presione **Dar de Baja**.
3. Abra la cuenta de `Operario Prueba 02` y presione **Dar de Baja**.

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

## 14. Errores, sesión y experiencia responsive

### 14.1 Desconexión

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

### 14.2 Pantalla pequeña

1. Abra las herramientas de desarrollo del navegador.
2. Use aproximadamente 390 px de ancho.
3. Recorra Operarios, Dispositivos, Perfiles, Telemetría y Monitoreo.

Resultado esperado:

- El menú lateral se abre mediante el botón superior.
- Formularios y acciones siguen siendo accesibles.
- Las tablas amplias permiten desplazamiento horizontal en su contenedor.
- No se pierde la posibilidad de volver o cerrar sesión.

### 14.3 Estados vacíos

Pruebe búsquedas inexistentes en los listados y periodos sin mediciones o eventos.

Resultado esperado: aparece una explicación de estado vacío, distinta de un error de servidor.

## 15. Verificación automática complementaria

La guía principal es manual. Como comprobación adicional puede ejecutar:

```powershell
npm run build
npm run verify:bc02
```

Resultados esperados en la rama integrada actual:

- Compilación correcta.
- BC-02: 88 comprobaciones HTTP aprobadas, incluyendo Device Identity.

Existe también `npm run verify:bc05`, pero su versión actual utiliza una fecha final fija anterior a los incidentes creados en días posteriores. Puede fallar al correlacionar un incidente nuevo aunque la interfaz y el mock funcionen correctamente. Hasta corregir ese script, valide BC-05 mediante las secciones 10.1 a 10.5 de esta guía.

## 16. Funciones que todavía no están implementadas

### Aplicación móvil del Operario

- Consumir el código de primer acceso.
- Iniciar sesión desde Flutter.
- Consultar únicamente sus asignaciones.
- Completar y publicar configuraciones.
- Aprobar la estrategia de tratamiento.
- Liberar, detener o restablecer un proceso.

### Dispositivo y Edge

- Autenticación real mediante la credencial técnica.
- Activación, rotación o reenrolamiento de credenciales.
- Recepción de datos desde ESP32 o Wokwi.
- `POST /edge/v1/telemetry`.
- Detección real de duplicados y validación física de mediciones.
- Cálculo temporal real del heartbeat.

### Telemetry y Treatment

- Actualización automática, WebSocket o streaming.
- Historial de comandos técnicos.
- Evaluación de conformidad del agua.
- Selección automática real de estrategia.
- Dosificación, actuación térmica o LED controlados por el sistema.
- Ciclos automáticos de corrección y reevaluación.
- Autorización real de apertura o cierre de válvula.
- Diferenciación ejecutable entre fallo y emergencia.

### Monitoring y notificaciones

- Generación automática de alertas a partir de telemetría nueva.
- Resolución o reapertura de alertas.
- Cambio de estado de incidentes.
- Firebase Cloud Messaging y notificaciones push.
- Actualizaciones operativas en tiempo real.

### Administración

- Editar grupos, reservorios o dispositivos ya registrados.
- Reactivar recursos inactivos.
- Recuperar una credencial técnica después de abandonar el alta.
- Crear un segundo Administrador para la misma empresa.
- Persistencia, seguridad y transacciones de un backend productivo.

## 17. Criterio de aceptación global actual

La aplicación web actual se considera validada cuando una persona puede:

1. Registrarse o iniciar sesión como Administrador.
2. Preparar grupo, reservorios, dispositivos e identidades mock.
3. Crear cuentas, perfiles, asignaciones y códigos.
4. Cerrar y reasignar responsabilidades conservando el historial.
5. Consultar configuraciones y telemetría sin inventar datos ausentes.
6. Atender alertas, registrar incidentes y exportar trazabilidad.
7. Comprobar el aislamiento entre organizaciones.
8. Ejecutar bajas lógicas respetando dependencias.
9. Recuperarse de errores de red y utilizar la interfaz en pantalla pequeña.

Superar estas pruebas valida el frontend administrativo y sus contratos mock. No demuestra todavía el funcionamiento del ESP32, Flutter, Treatment, FCM ni el backend productivo futuro.
