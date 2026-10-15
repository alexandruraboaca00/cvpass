# 13 — Criterios para PDF propio, importación y reedición

**Estado actual:** [23-cierre-investigacion-y-criterios.md](23-cierre-investigacion-y-criterios.md) actualiza los requisitos y su evidencia. [21](21-importacion-generica-ocr-y-compatibilidad.md) cierra también la reedición del PDF real que las notas siguientes todavía registraban como pendiente. Continúa sin implementación de la aplicación.

**Evidencia posterior:** [16-ciclo-secciones-pdf.md](16-ciclo-secciones-pdf.md) confirma el ciclo completo con 14 tipos adicionales y reedición de una certificación ficticia importada. Detecta cambios de orden y omisión de contenedores vacíos al reimportar. La antigua prueba del título educativo del PDF real permanece pendiente; no debe confundirse con el ciclo ficticio ya conseguido.

Documento de investigación basado en 12-importacion-pdf-local.md. No es una implementación ni una atribución del diseño interno de Europass.

## 1. Hechos observados que condicionan el producto

- El ejemplo contiene datos editables en XML adjunto, además de texto y dibujo PDF.
- Se han recuperado estructura de educación, trabajo, capacidades agrupadas, idiomas, fotografía y ajustes de diseño.
- La importación y reexportación sin editar conserva el XML salvo identificador, pero cambia el formato de fechas visibles.
- La ordenación del ejemplo no sigue una cronología universal.
- Hay fechas únicas, periodos cerrados y formación en curso.
- El PDF no está etiquetado como accesible y separa una parte de idiomas en una tercera página casi vacía.
- La edición de un título importado llega al campo, pero Save no ha producido una confirmación comprobada en esta prueba.

## 2. Propuesta e inferencias para nuestra aplicación

### Prioridad de compatibilidad

| Entrada | Tratamiento propuesto | Grado de incertidumbre |
| --- | --- | --- |
| PDF Europass con datos adjuntos | Detectar adjunto, identificar versión y mapear datos localmente. Conservar originales y campos desconocidos para evitar pérdidas silenciosas. | Un archivo comprobado; otras versiones pendientes. |
| PDF exportado por nuestra herramienta | Incluir datos propios versionados que permitan recuperar la edición y mantener un proyecto local independiente. | Requisito de diseño, todavía sin implementar. |
| PDF sin datos adjuntos | Importación asistida: texto/estructura candidata, revisión de campos y advertencias sobre pérdidas. | No prometer recuperación automática fiel del diseño. |
| PDF escaneado | Evaluar reconocimiento de texto en una fase separada. | Fuera de la evidencia actual. |

El recorrido propuesto es archivo local → datos del CV → edición local → motor de maquetación propio → PDF nuevo con sus datos de reedición. El funcionamiento habitual no debería requerir Europass. La capacidad offline y el tiempo de exportación deberán probarse en nuestra aplicación cuando exista.

### Requisitos para el modelo mínimo

Identidad y contactos; secciones y entradas con orden conservado; fechas de inicio/fin opcionales y estado en curso; descripciones estructuradas; grupos de habilidades; lenguas maternas y cinco dimensiones por otra lengua; fotografía del usuario; configuración de plantilla, color, texto, logo propio/ausente, numeración y formato de fecha. Separar valor de fecha de presentación. No confundir ausencia de un campo con cadena vacía o valor por defecto.

Los títulos de plantillas y marcadores de formato del archivo son datos de compatibilidad, no instrucciones para copiar recursos. La maquetación y los componentes deben ser propios. No se han extraído logos, fuentes o código de Europass para usarlos en la aplicación.

### Pruebas de aceptación prioritarias

La comparación de un segundo PDF y los requisitos de conservación del idioma original y traducciones revisables se documentan en [14-idiomas-y-traducciones.md](14-idiomas-y-traducciones.md). El cambio de idioma de salida deberá conservar todos los datos y permitir recuperar tanto los originales como sus traducciones al reimportar un PDF propio.

| Prueba | Resultado exigido para nuestra implementación futura |
| --- | --- |
| Importar el ejemplo | Recuperar cantidades, valores, pertenencia a grupos, orden y foto; informar de cualquier dato no representable. |
| Editar una entrada | Cambiar un único valor, confirmar y recuperar el resto sin diferencias semánticas imprevistas. |
| Cancelar | Restaurar el contenido confirmado sin introducir el borrador en el PDF. |
| Exportar/reimportar PDF propio | Recuperar todos los datos editables y las preferencias conocidas, sin visitar Europass. |
| Exportar texto | Texto seleccionable y extraíble, acentos y enlaces correctos. |
| Maquetación larga | Títulos unidos al contenido, viudas/huérfanas controladas y bloque de idioma unido a sus niveles cuando quepa. |
| Presentación | Márgenes, jerarquías, color, fotografía y numeración consistentes; no se exige identidad binaria del archivo. |
| Sin datos estructurados | Explicar límites y pedir revisión de la extracción, en vez de inventar campos. |
| Rendimiento | Medir importación, respuesta al escribir, preview y exportación con documentos pequeños y largos en un entorno conocido. Umbrales todavía por acordar. |

Es conveniente preservar los datos desconocidos del formato importado y advertir si no pueden mostrarse/exportarse. Un adjunto con HTML no debe ejecutarse como instrucciones: el futuro tratamiento deberá interpretar únicamente formato permitido. Son decisiones propuestas para evitar pérdida de datos, no componentes ya construidos.

## 3. Cuestiones pendientes antes de fijar arquitectura

Completar el ciclo con una modificación realmente confirmada; reunir más de una versión de PDF Europass; definir cuánta fidelidad visual se requiere frente a mejoras de paginación; acordar alcance de PDF genérico y objetivos de latencia; evaluar motores propios con una prueba posterior explícitamente autorizada de implementación. La investigación actual no demuestra que un motor concreto sea adecuado.
