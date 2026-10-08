# Guía de pruebas manuales — IoT Telemetry and Device Integration (BC-03)

Esta guía cubre únicamente las capacidades disponibles actualmente en la aplicación web administrativa: consulta global, última medición, disponibilidad informada e historial de pH y temperatura. No presupone ingestión real, ejecución de comandos ni actualización en tiempo real.

## 1. Preparar un entorno descartable

Requisitos: Node.js 22, npm 11 y un navegador actualizado. Ejecute los comandos desde la raíz del frontend.

En la primera terminal:

```powershell
New-Item -ItemType Directory -Path tmp -Force | Out-Null
Copy-Item -LiteralPath mock-api/db.json -Destination tmp/bc03-manual-db.json
$env:MOCK_DB_PATH = (Resolve-Path -LiteralPath tmp/bc03-manual-db.json).Path
npm run mock:api
```

En una segunda terminal:

```powershell
npm start
```

Compruebe antes de continuar:

- Aplicación: `http://127.0.0.1:4200`.
- API mock: `http://127.0.0.1:3000/api/v1/health` debe responder con estado `UP`.
- El puerto `3000` corresponde a la API; no muestra la interfaz Angular.

Las cuentas disponibles son:

| Organización | Correo                       | Contraseña         |
| :----------- | :--------------------------- | :----------------- |
| Textil       | `admin.textil@hydroguard.pe` | `adminpassword123` |
| Hidropónica  | `admin.hidro@hydroguard.pe`  | `adminpassword123` |

La copia de `db.json` evita modificar los datos originales. La variable `MOCK_DB_PATH` solo se aplica a la terminal donde se inicia el mock.

## 2. Acceso y navegación

1. Sin iniciar sesión, abra `http://127.0.0.1:4200/telemetry`.
2. Compruebe que la aplicación redirige a `/login`.
3. Inicie sesión con el administrador textil.
4. En el menú lateral seleccione **Telemetría**.

Resultado esperado:

- Se abre `/telemetry`.
- El menú resalta Telemetría.
- Se muestran solamente dispositivos de la organización textil.
- La interfaz presenta datos registrados; no afirma que exista una conexión en tiempo real.

## 3. Supervisión general

Con la organización textil deben aparecer estos dispositivos precargados:

| Dispositivo       | Entorno             | Disponibilidad | Origen de la última medición |
| :---------------- | :------------------ | :------------- | :--------------------------- |
| `ESP32-HG-TX-001` | Prototipo académico | En línea       | Dispositivo                  |
| `ESP32-HG-TX-002` | Simulación          | En línea       | Simulador                    |
| `ESP32-HG-TX-003` | Prototipo académico | Fuera de línea | Dispositivo                  |

Compruebe para cada fila:

- Serie y alias, cuando exista.
- Entorno de operación.
- Disponibilidad informada.
- Última comunicación.
- Último pH y temperatura.
- Fuente de la medición.
- Botón **Ver historial**.

Presione **Actualizar mediciones**. La consulta debe repetirse sin duplicar filas ni perder los filtros seleccionados.

## 4. Búsqueda y filtros del resumen

### 4.1 Buscar por serie

1. Escriba `ESP32-HG-TX-001`.
2. Presione **Aplicar filtros**.

Esperado: se muestra únicamente ese dispositivo.

También puede buscar por alias o modelo. Una búsqueda inexistente debe mostrar un estado vacío, no un error.

### 4.2 Filtrar por disponibilidad

1. Limpie la búsqueda.
2. Seleccione **En línea**.

Esperado: aparecen `dev-101` y `dev-102`.

Seleccione **Fuera de línea**.

Esperado: aparece `dev-203`.

La disponibilidad se recibe del mock. Angular no calcula por sí mismo el vencimiento del heartbeat.

### 4.3 Filtrar por entorno

Seleccione **Simulación**.

Esperado: aparece `ESP32-HG-TX-002`.

Seleccione **Prototipo académico**.

Esperado: aparecen `ESP32-HG-TX-001` y `ESP32-HG-TX-003`, salvo que mantenga otro filtro activo.

### 4.4 Combinar filtros

Combine disponibilidad **En línea** y entorno **Simulación**.

Esperado: aparece únicamente `ESP32-HG-TX-002`.

Los filtros se combinan; no se reemplazan entre sí. Para recuperar todo, seleccione las opciones **Todas** y **Todos los entornos**, limpie la búsqueda y aplique nuevamente.

## 5. Historial de un dispositivo físico

1. Localice `ESP32-HG-TX-001`.
2. Presione **Ver historial**.
3. Compruebe la ruta `/telemetry/devices/dev-101`.

Resultado esperado:

- Encabezado con serie, alias o modelo, entorno y reservorio.
- Disponibilidad **En línea**.
- Tarjetas con último pH, última temperatura y total de mediciones.
- Tabla ordenada inicialmente desde la medición más reciente.
- Todas las mediciones de este dispositivo tienen origen **Dispositivo físico**.

Ordene la tabla por fecha, pH y temperatura. La consulta debe respetar el orden seleccionado.

## 6. Historial de un dispositivo simulado

1. Regrese a Telemetría.
2. Abra `ESP32-HG-TX-002`.
3. Seleccione origen **Simulador**.

Esperado: se muestran sus mediciones simuladas.

Cambie el origen a **Dispositivo físico**.

Esperado: aparece el estado vacío porque el conjunto mock de ese dispositivo solo contiene mediciones del simulador.

Esta variante verifica la representación de ambos orígenes sin simular que Angular recibe directamente datos de Wokwi o del ESP32.

## 7. Filtros por periodo

En el detalle de `dev-101`:

1. Seleccione `04/10/2026` como fecha **Desde**.
2. Seleccione `04/10/2026` como fecha **Hasta**.

Esperado: aparecen las cinco mediciones registradas durante ese día. La fecha final incluye el día completo.

Después seleccione desde `08/10/2026` hasta `08/10/2026`.

Esperado: se muestra un historial vacío porque el mock no contiene mediciones para ese día.

Finalmente limpie ambas fechas para recuperar el historial completo.

## 8. Paginación

El dispositivo `dev-101` contiene más de cinco mediciones.

1. Seleccione un tamaño de página de 5.
2. Avance a la segunda página.
3. Regrese a la primera.

Esperado:

- No se repiten mediciones entre páginas.
- El total permanece estable.
- Cambiar un filtro vuelve a la primera página.

## 9. Dispositivo sin mediciones

Esta variante integra Configuration con la proyección de Telemetry sin generar datos falsos.

1. Desde **Dispositivos**, registre un dispositivo nuevo con una serie irrepetible.
2. Regrese a **Telemetría**.
3. Búsquelo por serie.
4. Abra su historial.

Esperado:

- El dispositivo aparece porque está activo en la organización.
- La última medición muestra `—`.
- El detalle indica que no existen mediciones.
- No se inventan pH, temperatura, MAC, firmware ni rangos objetivo.

No es posible agregar una medición desde Angular en esta entrega.

## 10. Aislamiento entre organizaciones

1. Con la cuenta textil copie la URL `/telemetry/devices/dev-101`.
2. Cierre sesión.
3. Inicie sesión con el administrador hidropónico.
4. Abra `/telemetry`.

Esperado: aparecen únicamente `ESP32-HG-HP-001` y `ESP32-HG-HP-002`.

5. Pegue la URL textil `/telemetry/devices/dev-101`.

Esperado: se muestra un error de recurso no encontrado y no se revelan mediciones textiles.

También puede comprobar las variantes hidropónicas:

- `dev-201`: prototipo académico, disponibilidad retrasada y origen dispositivo.
- `dev-202`: simulación, fuera de línea y origen simulador.

## 11. Error de conexión y recuperación

1. Mantenga abierta la página de Telemetría.
2. Detenga la terminal del mock.
3. Cambie un filtro o presione **Actualizar mediciones**.

Esperado: aparece un error de conexión con opción de reintento; la aplicación no presenta una lista vacía como si fuera un resultado válido.

4. Inicie nuevamente el mock con la misma copia de base.
5. Vuelva a iniciar sesión, porque las sesiones mock se mantienen en memoria.
6. Abra Telemetría y repita la consulta.

Esperado: la información vuelve a cargarse.

## 12. Pantalla pequeña y navegación

1. Reduzca el navegador a aproximadamente 390 px de ancho.
2. Abra el menú lateral.
3. Entre en Telemetría y después en un historial.
4. Pruebe filtros y paginación.

Esperado:

- El menú puede abrirse y cerrarse.
- Los filtros siguen siendo utilizables.
- La tabla permite desplazamiento horizontal dentro de su contenedor.
- El botón para volver al resumen permanece accesible.

## 13. Capacidades que no deben probarse todavía

Esta entrega no implementa:

- Recepción de mediciones desde ESP32 o Wokwi.
- `POST /edge/v1/telemetry`.
- Actualización automática o en tiempo real.
- Cálculo real de heartbeat.
- Validación física o idempotencia de las mediciones.
- Evaluación de conformidad del agua.
- Selección o aprobación de estrategias de tratamiento.
- Comandos de dosificación, LED, válvula o nueva medición.
- Historial de comandos técnicos.
- Alertas generadas automáticamente a partir de una nueva medición.

Estas responsabilidades corresponden al futuro backend, Edge, Treatment y Monitoring. El frontend actual queda preparado para reemplazar el mock por respuestas HTTP compatibles.

## 14. Criterio de aceptación actual

BC-03 queda listo para integración frontend cuando:

- Compila correctamente.
- El resumen muestra solo dispositivos de la organización autenticada.
- La búsqueda, filtros y paginación funcionan.
- El detalle presenta última medición e historial.
- Los periodos incluyen por completo la fecha final.
- Los dispositivos sin mediciones muestran un estado vacío honesto.
- No se presentan datos técnicos inventados ni decisiones de Treatment.
- Los errores de red permiten reintentar.
- La interfaz funciona en escritorio y pantalla móvil.
