# 28 — Mejoras necesarias y criterios de aceptación

Fecha: 15 de octubre de 2026. Especificación funcional propuesta a partir de la investigación; no es una implementación ni una arquitectura elegida. Prioridad principal del usuario: generar PDF del mismo tipo funcional sin depender de Europass y poder recuperar CV locales para editarlos.

## 1. Hechos observados que motivan las mejoras

| Evidencia funcional | Consecuencia para el uso |
| --- | --- |
| Los PDF Europass probados incluyen XML de CV; no son formularios PDF rellenables. | Reabrir un CV y editar sus secciones requiere recuperar datos, no habilitar campos sobre la página. |
| Los PDF genéricos y los escaneados no se importaron como CV en Europass. | Hace falta una ruta asistida distinta para documentos sin datos estructurados. |
| Cambiar idioma no tradujo texto libre, títulos ni habilidades en la prueba controlada. El PDF inglés del usuario contiene cambios manuales. | Idioma de interfaz, etiquetas de salida y traducción de contenido necesitan controles diferenciados. |
| Recarga recupera lo confirmado; un formulario sin Save no se recuperó. Reiniciar el navegador no ofreció reanudación. | Deben explicarse borrador, contenido confirmado y archivo guardado, con persistencia local verificable. |
| Save and exit del beta siguió deshabilitado; el estándar permite Download → Finish. | El usuario necesita una salida local clara y estados de botón explicados. |
| Las plantillas producen distinta paginación con iguales datos; hay páginas finales casi vacías. | La calidad del PDF depende también de reglas de cortes y composición. |
| Algunas fechas parciales/imposibles se descartaron al guardar; un título con solo espacios se aceptó. | Validar debe evitar pérdida silenciosa y valores aparentemente completos sin contenido. |

Referencias: [14 — Idiomas](14-idiomas-y-traducciones.md), [17 — Validaciones](17-fechas-y-validaciones.md), [21 — Importación](21-importacion-generica-ocr-y-compatibilidad.md), [24 — Salida](24-save-and-exit-y-editor-estandar.md), [25 — Plantillas](25-comparativa-visual-formatos-pdf.md), [26 — Compatibilidad](26-compatibilidad-ampliada-pdf.md) y [27 — Caducidad](27-caducidad-real-48-horas.md).

## 2. Inferencias convertidas en requisitos propuestos

### Prioridad principal: guardar, reabrir y exportar

| ID | Comportamiento propuesto | Criterio de aceptación para la futura aplicación |
| --- | --- | --- |
| G1 | Proyecto local durable con ubicación y estado de guardado visibles. | Guardar, cerrar aplicación/equipo y reabrir conserva todos los datos y preferencias; un fallo de escritura no muestra «guardado». |
| G2 | Formulario con borrador y Confirmar/Cancelar inequívocos. | Cancelar conserva la última versión confirmada; Confirmar valida y actualiza la vista. Recuperar un borrador nunca sobrescribe silenciosamente lo confirmado. |
| G3 | Guardar y salir guarda el proyecto; exportar genera un PDF aparte. | Después de salir se puede abrir el proyecto; exportar no es la única copia editable ni se confunde con guardar cambios. |
| G4 | PDF propio con datos editables y versión del formato. | Exportar → importar recupera entradas, idiomas, originales/traducciones, orden, visibilidad, foto/firma y presentación. El cambio de un campo no altera otros. |
| G5 | Copias/versiones recuperables. | Se puede deshacer una importación o cambio de idioma y recuperar una versión anterior; guardar no destruye el único original importado. |

La forma técnica del archivo de proyecto, los datos incrustados y la estrategia de escritura se decidirán al diseñar. No se asume que Europass use una implementación concreta.

### Prioridad principal: compatibilidad de importación

| ID | Comportamiento propuesto | Criterio de aceptación |
| --- | --- | --- |
| I1 | Detectar datos estructurados compatibles entre los adjuntos del PDF. | Los dos PDF del usuario y los controles compatibles recuperan datos; el nombre del adjunto y la plantilla visible no son la única señal. |
| I2 | Mostrar un resumen de importación antes de confirmar. | Se informa de entradas recuperadas, campos sin correspondencia y ajustes no soportados. Se conserva el archivo de origen. |
| I3 | PDF de texto sin datos: extracción asistida. | Proponer secciones y campos con referencia a página y texto original, permitiendo corregir y dejar información sin clasificar. No presentarlo como recuperación exacta. |
| I4 | Escaneado o PDF mixto: OCR por página cuando haga falta. | Mostrar texto reconocido y dudas, permitir idioma OCR y corrección; conservar la imagen original como referencia. |
| I5 | PDF con contraseña, mal formado o incompatible: resultado explícito. | Si se admite desbloqueo, pedir la contraseña conocida por el usuario; si no, explicar la limitación. Un XML incompatible debe terminar con un error útil, sin espera indefinida. |
| I6 | Diferenciar contenido visible de datos adjuntos. | Explicar qué fuente se está importando; permitir revisar el PDF junto a los datos. Una edición externa del aspecto no garantiza que sus adjuntos estén actualizados. |

Editar un PDF genérico se plantea como convertir su contenido a un CV revisado y volver a generar el documento. La conservación exacta de cualquier maquetación arbitraria no está demostrada ni forma parte de esta propuesta de creador de CV.

### Prioridad principal: idiomas y contenido original

| ID | Comportamiento propuesto | Criterio de aceptación |
| --- | --- | --- |
| L1 | Separar idioma de interfaz, idioma de etiquetas del CV y variantes del texto. | Cambiar la interfaz o las etiquetas no sobrescribe nombres, títulos, descripciones ni habilidades. |
| L2 | Original con idioma de origen y traducciones opcionales por campo. | Un certificado conserva su título oficial; puede añadir una traducción revisada y elegir si se muestra original, traducción o ambos. |
| L3 | Traducción asistida con comparación antes/después y aceptación por campo. | Cambiar a inglés muestra exactamente qué cambiaría; el usuario acepta, modifica o rechaza cada propuesta. Las traducciones manuales permanecen protegidas. |
| L4 | Habilidades normalizadas y texto libre tratados explícitamente. | Solo las etiquetas con equivalencia conocida cambian automáticamente. Una habilidad personalizada conserva el original hasta revisión. |
| L5 | Traducción desactualizada identificable. | Si cambia el original, la traducción existente se conserva y se marca para revisión; no se sustituye sin avisar. |

### Prioridad principal: PDF y presentación

| ID | Comportamiento propuesto | Criterio de aceptación |
| --- | --- | --- |
| P1 | Plantillas originales de las familias observadas. | Una columna compacta y dos columnas cubren la primera versión; las otras familias pueden añadirse sin cambiar los datos del CV. |
| P2 | Preview y exportación con los mismos criterios de composición. | Igual contenido, tamaño, saltos, foto, enlaces y numeración al comparar preview y PDF de referencia. |
| P3 | Paginación cuidada. | Título unido al primer contenido; bloques cortos de idiomas/firma no partidos; sin texto solapado o fuera de margen. Casos largos y nombres extensos incluidos. |
| P4 | Controles claros de foto, firma, tamaño, color y fechas. | La vista muestra qué se imprimirá; la importación propia conserva ajustes; ocultar no elimina datos sin confirmación. |
| P5 | Texto seleccionable y orden lógico de lectura. | Copiar texto y recorrer con lector de pantalla mantiene un orden comprensible en diseños con columnas; enlaces siguen activos. Verificar PDF etiquetado y fuentes sin sustituir glifos. |

Una opción de ajustar a dos páginas debería ofrecer cambios y explicar su efecto, sin omitir texto ni reducirlo ilimitadamente. Las cifras medidas en Europass no son una garantía para nuestra futura salida.

### Prioridad alta: edición y rendimiento

- Orden manual explícito y estable, independiente de fechas; ordenación cronológica opcional con previsualización y posibilidad de deshacer.
- Separar contraer, ocultar del PDF y eliminar. Ocultar debe conservar contenido y permitir restaurarlo.
- Validación coherente de títulos, URL, límites y fechas; admitir precisión de año/mes solo si el formato la representa de forma explícita.
- Medir arranque, edición, preview, importación, exportación y consumo de memoria con un corpus y equipo identificados. Los tiempos observados de Europass no fijan una promesa propia.
- Verificar el ciclo local completo sin servicios de Europass: abrir, editar, guardar, previsualizar, exportar y reabrir. Cualquier servicio de traducción futuro debe ser una función explícita.

## 3. Cuestiones pendientes antes y durante la construcción

Queda elegir alcance de la primera versión y diseñar modelo/formatos/plantillas originales. No se ha seleccionado stack ni biblioteca PDF; esa elección debe contrastarse con round-trip, paginación, accesibilidad y rendimiento.

La espera de caducidad real se descartó por decisión del usuario; el proyecto prioriza archivos locales descargables y reeditables. Save and exit del beta y una cuenta Europass siguen sin ejecución. Las muestras históricas genuinas y documentos diversos de uso real servirán para ampliar compatibilidad, sin exigir mantener una conexión de investigación abierta. Ninguno de estos límites impide comenzar la primera versión ni requiere copiar una implementación interna de Europass.

La aceptación de un PDF por Europass no demuestra que nuestra aplicación pueda importarlo: todavía no existe un importador propio. Esta tabla define qué deberá validarse cuando se autorice implementar.
