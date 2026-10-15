# Inspección activa autónoma con REA

**Estado consolidado posterior:** [23-cierre-investigacion-y-criterios.md](23-cierre-investigacion-y-criterios.md) reúne la cobertura actual y los límites restantes. Los informes 17–22 completan validaciones, múltiples entradas, imágenes, plantillas, PDF genéricos/OCR, reedición del PDF real y recuperación tras recarga. Las notas iniciales siguientes conservan su alcance histórico.

## Entorno y procedimiento

Pruebas del 15 de octubre de 2026 autorizadas por el usuario. REA ejecutó las acciones declaradas: clics, escritura ficticia, selección de opciones, guardado, cancelación, navegación y solicitud de descarga. No se implementó la aplicación ni se copiaron scripts, plantillas, imágenes o recursos de Europass al repositorio.

Se usa capture_browser_scenario en modo launch con /opt/google/chrome/chrome, headless, perfil temporal nuevo, viewport 913 × 1200, idioma en-US, zona UTC y service workers bloqueados. Cada escenario empieza sin el CV ni la sesión del usuario. Los resultados usados informan cleanup terminated-owned-process: REA cierra únicamente el navegador que crea. No se ha ejecutado ningún escenario connect sobre el target original de 9222.

Ruta reproducida: URL del editor compacto → Start from scratch → Try the new CV builder (beta). Se esperan la carga inicial y los controles; se expanden las tarjetas antes de usar sus botones. En escenarios posteriores se aceptan únicamente cookies esenciales desde la UI. Son diferencias de entorno respecto al navegador original y pueden afectar los resultados.

La limitación de navegación de connect sigue existiendo, pero deja de impedir la investigación: launch permite empezar cada prueba en un perfil aislado y recrear el estado con acciones. Las peticiones de intervención manual de notas anteriores describen la fase previa, no una necesidad permanente.

## 1. Hechos observados

| Prueba | Resultado y evidencia |
| --- | --- |
| Lanzamiento aislado | Pantalla de elección entre perfil, inicio vacío y carga de CV. ev_802fb4a8c641fccea67f1b47ce32b1306ebec18ef5af0b6696571f521a19ff41. |
| Entrada al beta | Editor compacto con cinco secciones y controles de preview. ev_3e58274cca89194ce13db96c914f8eb76b275b43daf798eff48b6735bd0a06e4. |
| Guardado laboral | Entrada de texto libre y empleador aparecen en resumen tras Save. ev_d98aa2fb8e0953d9af478893ee4a8f2d3822bc3c49a6ba8e172331c7281569ac. |
| Opcionales laborales | Se abren sector, departamento, correo, web y enlace; Ongoing deshabilita fin. ev_c99f31452881f44f672c959fe90f6465121f4bc5ae4bf9fc6d8e2daa7f577b8d. |
| Cancelación completa | Correo ficticio visible → Cancel → reapertura con correo vacío y nombre conservado. ev_0b06a5123e9154c32b94a017f806b3f3f6c00f9e64fc6234d5ce15e4e80a34de. |
| Menús | Sección y entrada laboral tienen opciones distintas. ev_4162c01bf8299f5c89a6ca4bc4a90200f54fb8dd21890ff1e1c8b6db698de075. |
| Reordenación y retirada | Move up cambia el orden de secciones; retirada de sección poblada abre confirmación con número de registros. No se confirma esa retirada. ev_00717ea427abb991df2538ed34b5282a4487309b1db07dd26ed53f8d6e5afd33. |
| Preview | Abre ajustes y representación del contenido, manteniendo URL. ev_47a7000b1f1b11e5f703fbf988500c24ca2ed0c935196264893d0fe1d5214346. |
| Plantilla y color | Selección Classic y Dark green; cambia la selección y se regenera el contenido accesible de preview. ev_25a821ddea3ed13665b4b83ac4c6335b9973fe933075f3dcc94d4ff305bc2da5. |
| Descarga | Clic Download produce descarga propuesta cv-prueba-autonoma.pdf; REA la cancela por diseño. ev_4053ac29095a9d6db8b424a364a3d6622c1eb4854974c4ca6affa67dd9f21a08. |
| Recarga | Aparece aviso de borrador automático de últimas 48 horas. ev_3d15f70e2f2e253af014e7a4fc145fcf8435d28cfab5e2645de887ad265712b4. |
| Reanudación | Tras pulsar retomar y elegir beta, aparecen campos vacíos y Discrepancies found; no se recuperan los valores esperados en la captura. ev_4d6ee3af7c0270d50b79335e5b83436e3fce7a0bfc7b7f0e61baa0da98fb9c03. |

Los primeros intentos tuvieron timeouts de carga o clics interceptados. No se contabilizan como pruebas de funciones que no llegaron a ejecutarse. Se corrigió la secuencia añadiendo espera y expansión explícita. Las comprobaciones posteriores satisfactorias tienen evidencias distintas.

## 2. Inferencias

Hay al menos tres niveles funcionales que conviene investigar por separado: borrador de formulario, contenido confirmado en el editor y borrador recuperable del CV. La cancelación prueba la separación de los dos primeros para el correo ensayado; el aviso de borrador no prueba recuperación correcta de todo el CV.

La ausencia de controles en una captura de accesibilidad puede depender de expansión, viewport o del estado de renderizado. Las pruebas activas no deben basarse solo en encontrar texto: también necesitan comprobar que la acción se completó y su resultado.

## 3. Cuestiones pendientes

- Repetir recuperación con espera suficiente, valores conocidos y verificación antes de recargar; investigar Discrepancies found sin afirmar persistencia completa.
- Terminar tipos y validaciones de fecha/enlace de Other, detalles de Skills y varias lenguas.
- Probar varias entradas laborales y criterio de orden de entradas con fechas deliberadamente discriminantes.
- Comparar menús de otros tipos; no extrapolar el menú laboral a todos.
- Comprobar retorno Back to edit, efecto de cada ajuste, visibilidad en preview y salida con cambios pendientes.
- La descarga iniciada está confirmada; integridad y contenido de un PDF guardado en disco no se han verificado.

## Receta ejecutable de investigación

scenarios/preview-descarga.json contiene argumentos propios de capture_browser_scenario para reproducir desde cero nombre ficticio, preview y solicitud de descarga. No es código de producto ni contiene recursos de Europass. El navegador temporal se cierra al terminar, por lo que la receta recrea cada vez el estado. Los selectores se basan en la UI observada y pueden requerir adaptación si cambia el sitio.

## Ampliación: importación de archivos y descarga completa

La investigación del PDF local aportado por el usuario añadió un instrumento propio Playwright ejecutado mediante REA capture_process_scenario. Este permite seleccionar un archivo local y guardar una descarga de prueba en /tmp, operaciones que el contrato limitado de capture_browser_scenario no ofrece o cancela por diseño. No es necesario pedir al usuario los clics de carga: el instrumento crea y cierra su propio navegador sin tocar la pestaña original.

Se completó la importación del PDF y una reexportación real sin editar su contenido. Se verificaron datos y fotografía del XML, y se probó el rechazo de un PDF derivado sin adjuntos. El intento de confirmar un título modificado quedó sin resolver y no se presenta como éxito. Véanse [12-importacion-pdf-local.md](12-importacion-pdf-local.md) y [13-criterios-pdf-editable.md](13-criterios-pdf-editable.md).
