# 25 — Comparación visual de las plantillas y sus PDF

Fecha: 15 de octubre de 2026. REA, exportaciones reales y análisis local con Poppler/XML. Los PDF y renders permanecen en `/tmp`; no se incorporan plantillas, fuentes, logos ni imágenes de Europass al proyecto.

## 1. Hechos observados

### Catálogo y condiciones de comparación

El selector actual del beta contiene exactamente seis opciones: **Classic, Modern, Progress, Timeline, Accent y Elegant**. No se observó **Simple**. Se inspeccionaron tanto el texto de las opciones como sus valores; no se deduce que Simple sea un alias de otra plantilla.

Se importó el PDF español aportado por el usuario en un contexto aislado y se descargó una copia en cada plantilla. Se mantuvieron DarkGreen, Medium y numeración activada. El contenido no se editó. El XML de las seis salidas conserva el mismo hash de CandidateProfile al excluir CandidateProfileID: `9b4539b3b1a6199306163ba325995a5958d42ae1734e8c1819002167bea88a41`. Esta comprobación establece igualdad de datos incrustados; no garantiza que todo campo tenga idéntica representación visible.

Evidencia REA: `ev_33dfb078d49b3893a7891ce2f4b078984547ed1cfe126df62500ef267b1a55a5`. Guion: [37](scenarios/37-plantillas-cv-real.mjs). Metadatos derivados en [metricas-seguimiento.json](scenarios/metricas-seguimiento.json).

| Plantilla | Valor observado / XML | Estructura visible de la primera página | Páginas del CV real | Páginas del control largo anterior |
| --- | --- | --- | ---: | ---: |
| Classic | dynamic-cv-1 / DynamicTemplate1 | Banda de cabecera coloreada con foto y contacto; cuerpo de una columna; entradas compactas con título, organización y periodo en línea. | 2 | 4 |
| Modern | dynamic-cv-2 / DynamicTemplate2 | Dos columnas: foto, capacidades e idiomas a la izquierda; identidad, educación y experiencia a la derecha. Fechas junto al título. | 2 | 6 |
| Progress | cv-formal / Template1 | Banda de cabecera coloreada; una columna de contenido. Periodo/ubicación antes del título, títulos destacados y separadores. | 2 | 5 |
| Timeline | cv-semi-formal / Template2 | Columna lateral coloreada de identidad/contacto; contenido a la derecha con línea vertical y puntos para las entradas. | 2 | 5 |
| Accent | cv-3 / Template3 | Marco coloreado; cabecera con foto/contacto; una columna. Organización destacada, fechas entre corchetes y líneas bajo las secciones. | 3 | 5 |
| Elegant | cv-4 / Template4 | Columna estrecha para títulos de sección y fechas; contenido principal a la derecha. Cabecera de texto y contactos. | 3 | 5 |

Las cifras de las dos últimas columnas corresponden a documentos distintos: el CV real y el control ficticio de 48 párrafos del [informe 20](20-plantillas-paginacion-y-rendimiento.md). No son un límite fijo de páginas por plantilla.

### Paginación, foto y lectura

- Accent y Elegant producen una tercera página casi vacía con parte del bloque de idiomas. La extracción por espacios cuenta 17 palabras en esa última página en ambos casos. Se comprobó visualmente el render, no solo el contador.
- El control largo anterior conserva sus 48 marcadores en las seis plantillas, aunque detectó títulos separados del contenido y últimas páginas muy poco ocupadas. Conservar texto no implica una buena paginación.
- En Modern, capacidades e idiomas aparecen antes en la columna lateral aunque el cuerpo principal empieza por educación. La composición visible puede diferir del orden lineal de secciones del editor.
- En el render de la primera página de Elegant no se ve la foto que sí aparece en las otras cinco. Su XML conserva la foto y `pdfimages -list` también enumera un objeto de imagen 250×250. No se ha establecido la causa de esta diferencia ni se generaliza a todas las configuraciones de Elegant.
- Los seis archivos permiten extraer texto. Todos son PDF 1.7, A4 de 595×842 puntos, sin formulario AcroForm y con un XML adjunto. `pdfinfo` informa Tagged: no en los seis.
- Se localizaron los ocho títulos de formación, tres puestos y 18 habilidades del XML en el texto de las seis salidas. En Modern, la extracción con `-layout` intercala columnas y rompe algunas coincidencias de títulos largos; la extracción normal y `-raw` recuperan todas esas coincidencias. No se clasificó ese efecto como pérdida de contenido.
- Las seis salidas se reimportaron en el beta, restituyendo el valor de plantilla correspondiente y 16 menús de entrada en cada caso. Evidencia: `ev_87ea65c23310cc507c31c9dac03a97551795f2e4c7eb4a67ca720eb147a263ac`. Esta cifra de controles no sustituye una validación semántica de cada campo.
- Los recursos tipográficos enumerados incluyen fuentes base PDF y, según plantilla, Open Sans o DM Sans. Un recurso enumerado no prueba su uso en cada texto. No se han extraído ni reutilizado fuentes para el producto.
- Las seis descargas finalizaron sin fallo. Los tiempos de recepción medidos fueron aproximadamente 1,3–3,7 segundos después de esperas explícitas de preparación; no constituyen un benchmark del editor.

Los renders observados se guardaron temporalmente en `/tmp/europass-seguimiento/plantillas/<nombre>/pagina-1.png`; las últimas páginas de Accent/Elegant también se inspeccionaron. Las copias exportadas están en `/tmp/europass-cierre-investigacion/real-<nombre>.pdf`.

### Qué significa «formato de PDF» en estas pruebas

Son tres aspectos independientes:

1. **Diseño:** Classic, Modern, etc.; decide columnas, densidad, jerarquía y cortes.
2. **Contenedor:** versión PDF, tamaño/orientación, cifrado, formularios y adjuntos.
3. **Editabilidad del CV:** datos estructurados recuperables o únicamente representación visual/texto/imagen.

Cambiar de plantilla altera el primer aspecto y conserva los datos incrustados en esta comparación. Un PDF genérico con el mismo aspecto no adquiere por ello esos datos.

## 2. Inferencias y mejoras propuestas

Las familias de diseño útiles para una aplicación propia son: una columna compacta, dos columnas con resumen lateral, cabecera destacada, cronología vertical, marco/acento y fechas en columna. Pueden construirse con diseño y recursos originales. No se necesita reproducir decoración o marca propietaria para obtener el mismo tipo funcional de documento.

La elección debería mostrar miniaturas propias y páginas estimadas con el contenido real, permitiendo comparar antes de exportar. Un diseño sencillo de una columna podría llamarse Simple en nuestra aplicación; sería una elección propia, no una plantilla observada de Europass.

El motor debería mantener juntos el título y su primer contenido, evitar dividir bloques cortos de idiomas y ajustar espaciado/tamaño mediante opciones explícitas. Foto, firma y campos deberían tener reglas visibles por plantilla. El orden lógico de lectura merece una comprobación independiente del aspecto, especialmente con columnas.

## 3. Cuestiones pendientes

- Presencia de una opción llamada Simple en otra versión, idioma o cuenta: no demostrada en el catálogo actual.
- Causa de la foto no visible en el render de Elegant y comportamiento en otros lectores.
- Todas las combinaciones de color, tamaño, idioma y campos; scripts complejos, nombres muy largos, RTL y CJK.
- Accesibilidad efectiva: la ausencia de etiquetas es un dato; no sustituye pruebas con lector de pantalla y selección/orden de texto.
- Identidad visual exacta entre preview y todos los lectores PDF. No se promete compatibilidad universal ni conservación exacta de una maquetación externa.
