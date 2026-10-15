# 10 — Exportación y descarga

## 1. Hechos observados

Prueba activa aislada con REA, 15 de octubre de 2026. Se crea cv-prueba-autonoma, se guardan nombre Persona y apellido Ficticia REA, se abre preview y se pulsa Download; se espera 20 segundos capturando eventos de red y descarga. Evidencia: ev_4053ac29095a9d6db8b424a364a3d6622c1eb4854974c4ca6affa67dd9f21a08.

REA registra un evento download-cancelled con nombre sugerido cv-prueba-autonoma.pdf y URL blob del origen Europa. El proveedor REA cancela las descargas como parte de su manejo de eventos; se comprobó ese comportamiento en el código local del proveedor, no en código de Europass. Por ello el evento confirma que se inició una descarga propuesta de PDF, no un fallo de Europass ni un archivo guardado en disco.

En la secuencia se observa un PUT al recurso del CV con respuesta 200 y una petición de preparación de descarga con respuesta 200. Hubo una petición anterior abortada. Se retuvieron únicamente metadatos: no se solicitaron cuerpos de peticiones/respuestas ni valores de cabeceras, ni se inspeccionó el documento descargable. La ruta de preparación contiene xml, pero ese nombre no demuestra el formato entregado al usuario; el nombre sugerido por el navegador termina en .pdf.

No se observó un selector de formatos antes de esa descarga ni diálogo para elegir nombre. El nombre propuesto coincide con Name del CV en esta prueba. Save and exit estaba deshabilitado con Login disponible; no se probó una cuenta autenticada.

## 2. Inferencias

El flujo ensayado permite iniciar una descarga desde preview sin completar todas las secciones. El PDF propuesto parece usar el nombre del CV. La respuesta 200 de actualización es evidencia de comunicación con servidor, pero no prueba conservación duradera ni contenido completo del PDF.

Para nuestra aplicación conviene separar confirmación de formularios, generación de preview y exportación. Debe verificarse el éxito del archivo final, no solo el clic o una respuesta HTTP.

## 3. Cuestiones pendientes

Validar integridad, extensión/formato efectivo, contenido y accesibilidad de un archivo guardado; otras opciones de exportación si existen; paginación, imágenes y enlaces; validaciones de Name; errores de generación, reintentos y comportamiento autenticado. No se han copiado archivos o recursos propietarios al proyecto.

## Actualización: archivo descargado e inspeccionado

La prueba posterior de importación del PDF del usuario utilizó un instrumento Playwright propio mediante REA capture_process_scenario, sin la cancelación automática de descargas de capture_browser_scenario. Evidencia: `ev_f082a2b4dddb80c0490a2c75572eed5e59eccc11e43de20744fc87c670ec9d97`.

Se guardó una descarga completa en /tmp y pdfinfo confirmó PDF 1.7 de tres páginas A4. El archivo conserva attachment.xml y fotografía idéntica. La comparación del árbol XML solo encontró diferente el identificador del perfil, mientras las fechas visibles cambiaron de formato. Así se resuelve para este caso la duda sobre un archivo efectivamente descargado; no se certifican todos los formatos o contenidos posibles. El ciclo con modificación de contenido confirmada sigue pendiente. Detalle en [12-importacion-pdf-local.md](12-importacion-pdf-local.md).
