# 17 — Fechas y validaciones comprobadas

## 1. Hechos observados

Pruebas REA del 15 de octubre de 2026 en copias ficticias. Guiones en `scenarios/17-*.mjs`, `20-limite-texto.mjs` y `30-bordes-y-salida.mjs`; metadatos en [evidencias-cierre.json](scenarios/evidencias-cierre.json).

| Evidencia | Cobertura |
| --- | --- |
| `ev_5af5d3c3c75d96db3b5327010f8f2c8817e9e19f32f2ff48493ddfc59307e6e8` | Ongoing, campos de fecha duplicados y recomendación sin contacto. |
| `ev_0710b561f6dbb08b7fe411715fbba25a8481a6b393ba18ff7abd9a004a27b6cc` | Fecha confirmada, periodo invertido, cancelación y periodo válido exportado. |
| `ev_563eb9d5e2125cecda8960c83bfa7596e40c36aef9f6dea088f39fdc601703bd` | Longitud del editor de descripción de Projects. |
| `ev_bd18c0ad7452e2580788f751b83a977a12e16afdc261519db459048988a3184a` | Título vacío/espacios y guardado de fechas parciales o imposibles. |

### Fechas de Projects

El DOM expone dos inputs por fecha. Al escribir únicamente en el primero puede quedar texto visible sin actualizar la fecha del control. La prueba confirmada utilizó el input sin `aria-label`, comprobó la sincronización de ambos y reabrió el formulario después de guardar. Los intentos iniciales sobre el otro input no se consideran evidencia de fechas guardadas.

| Entrada o acción | Resultado |
| --- | --- |
| Inicio 15-06-2025 y fin 01-01-2024, ambos confirmados | Save deshabilitado y mensaje que exige un fin posterior al inicio. |
| Cancelar ese periodo | Al reabrir se conservan las fechas vacías anteriores. |
| Inicio 15-06-2025 y fin 16-06-2025 | Save cierra el formulario; XML exportado contiene 2025-06-15 y 2025-06-16. |
| Activar Ongoing | Los dos inputs de la fecha de fin pasan a disabled. Esa prueba se canceló; no demuestra qué hace con un fin previamente confirmado al exportar. |
| Escribir 2025, guardar y reabrir desde una fecha inicialmente vacía | Save cierra, pero la fecha reaparece vacía. |
| Escribir 02-2025, guardar y reabrir | Mismo resultado: no se conserva como mes/año. |
| Escribir 31-02-2025, guardar y reabrir | Save cierra y la fecha reaparece vacía. |

En estas últimas tres pruebas no se observó un error que impidiera guardar el formulario. No equivalen a soporte de precisión anual/mensual: el texto se pierde. No se probó qué ocurre con una fecha anterior válida sustituida por un texto inválido.

### Otros límites

- Certifications: el título vacío deshabilita Save; tres espacios permiten guardar y cerrar el formulario. Se probó en una entrada ficticia, no se extrapola a todos los títulos.
- Recommendations: se guardó una descripción ficticia sin nombre, email, teléfono ni rol. La entrada de origen aún conservaba su enlace adicional; por tanto, se ha comprobado ausencia de contacto, no una entrada con absolutamente todos los demás campos vacíos.
- Projects: 1.000 y 4.000 caracteres de descripción permiten guardar; 8.000 y 16.000 bloquean Save y muestran `Maximum length breached, n/4000`. La prueba larga posterior usa menos de 4.000 por descripción. No se atribuye este límite a todos los editores sin medirlos.
- Un enlace adicional `esto-no-es-url` deshabilita Add y Save en Certifications; al sustituirlo por una URL válida ambos vuelven a permitir continuar. Ver [18](18-multiples-orden-y-visibilidad.md).

### Seis formatos de salida

Evidencia `ev_a233dc277178dee352b77918983279491c326f2855c12150bea137940b282651`. Se exportaron seis PDF con los mismos valores de fecha; la extracción de texto confirma:

| Selector | Intervalo visible |
| --- | --- |
| dd/MM/yyyy | 15/06/2025 - 16/06/2025 |
| d MMM yyyy | 15 JUN 2025 - 16 JUN 2025 |
| d/M/yyyy | 15/6/2025 - 16/6/2025 |
| d/M/yy | 15/6/25 - 16/6/25 |
| MM/dd/yyyy | 06/15/2025 - 06/16/2025 |
| yyyy/MM/dd | 2025/06/15 - 2025/06/16 |

El formato de presentación no se conserva al reimportar la variante yyyy/MM/dd: vuelve a dd/MM/yyyy. Los valores ISO del intervalo sí se conservan; ver [20](20-plantillas-paginacion-y-rendimiento.md).

## 2. Inferencias y criterios propios

Nuestra herramienta necesita separar fecha, precisión e idioma/formato de presentación. Si admitimos solo año o mes/año, deberán representarse explícitamente; si no los admitimos, debemos conservar el texto y mostrar el error, evitando un descarte silencioso. Los títulos deberían validarse después de recortar espacios.

La UI de fecha, su valor temporal y el dato confirmado son estados distintos. Para las pruebas propias, verificar que un input contiene texto será insuficiente: habrá que comprobar guardado, relectura y exportación.

## 3. Cuestiones pendientes

Los extremos de calendario, años bisiestos, límites de todos los tipos y comportamiento con tecnologías de asistencia no están cubiertos exhaustivamente. Son ampliaciones de validación, no pruebas ya superadas. El periodo con Ongoing y fin preexistente merece un caso de aceptación específico al construir el modelo propio.
