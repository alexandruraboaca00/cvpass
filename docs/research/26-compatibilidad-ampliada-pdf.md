# 26 — Compatibilidad ampliada de PDF

Fecha: 15 de octubre de 2026. Se probaron 25 archivos nuevos: 17 controles sintéticos, una plantilla pública de la UE, un PDF del editor estándar y seis exportaciones del mismo CV real con distintas plantillas. Son variantes controladas, no 25 generadores independientes. Se añaden a los dos PDF aportados y a los controles genérico/escaneado/corrupto/grande del [informe 21](21-importacion-generica-ocr-y-compatibilidad.md).

## 1. Hechos observados

### Matriz de importación en Europass

«Aceptado» significa que Save conduce al editor. En los controles con XML compatible se expandieron secciones y se verificó la presencia de un certificado, proyecto y sección personalizada del fixture. No significa que exista ya un importador propio.

| Control | Característica diferenciadora | Resultado observado |
| --- | --- | --- |
| texto-14 | Texto, PDF 1.4, sin adjuntos | Rechazado: no compatible con Europass. |
| texto-20 | Texto, cabecera PDF 2.0, sin adjuntos | Rechazado. |
| unicode-17 | Texto Unicode y fuente incrustada; acentos, rumano y griego | Rechazado. La extracción local conserva texto Unicode. |
| dos-columnas | Texto en dos columnas, sin XML | Rechazado. |
| letter-rotado | Papel Letter y rotación de 90°, sin XML | Rechazado. |
| a4-apaisado | Página A4 horizontal, sin XML | Rechazado. |
| formulario | AcroForm con un campo de correo ficticio | Rechazado. Un formulario PDF no equivale a un modelo de CV. |
| con-clave | PDF de texto que exige contraseña, sin XML | Rechazado con mensaje genérico. |
| restricciones | Abre sin contraseña; permiso de copia restringido, sin XML | Rechazado. |
| xml-europass | Diseño genérico, PDF 1.4 y XML Europass compatible | Aceptado; recupera secciones ausentes de las páginas visibles. |
| xml-renombrado | Mismo XML con nombre datos-cv.xml | Aceptado; el nombre attachment.xml no fue obligatorio en este control. |
| varios-adjuntos | XML compatible acompañado de TXT y otro XML no relacionado | Aceptado; recupera las secciones del XML de CV. |
| xml-no-compatible | attachment.xml bien formado con estructura ajena a Europass | Rechazado con mensaje de CV no compatible. |
| xml-20 | Cabecera PDF 2.0 y XML compatible | Aceptado. No valida todas las características posibles de PDF 2.0. |
| xml-con-clave | XML compatible dentro de PDF que exige contraseña | Rechazado con mensaje genérico; no apareció una solicitud de contraseña. |
| xml-restricciones | XML compatible; apertura sin contraseña y copia restringida | Aceptado. Solo se probó esta combinación de permisos en un archivo ficticio propio. |
| xml-utf16 | Datos equivalentes, XML codificado UTF-16 con BOM y declaración correspondiente | Rechazado. El XML extraído sí se analiza localmente y su árbol coincide con el original UTF-8. |
| plantilla-publica-eeas | Plantilla visual Europass publicada por EEAS; dos páginas, PDF 1.7, sin adjuntos | Rechazado. La apariencia o procedencia pública no basta para reabrirlo como CV. |
| estandar | PDF recién generado mediante Download en el editor estándar | Aceptado en el beta. |
| real-classic, real-modern, real-progress, real-timeline, real-accent, real-elegant | Seis salidas del CV español sin cambios de contenido | Seis aceptadas; cada una restituye su plantilla correspondiente. |

Balance de estos controles: 12 aceptados y 13 rechazados. No es una tasa de compatibilidad sobre los CV de uso real: el corpus fue construido para aislar características.

### Qué se recupera y qué se está probando

Los PDF genéricos con XML muestran en sus páginas solo un CV ficticio mínimo. Tras importarlos aparecen proyectos, certificados y la sección personalizada contenidos en el adjunto, aunque no figuraban en el texto visible de esas páginas. La importación observada utiliza datos recuperables y no reconstruye exclusivamente el aspecto del PDF.

La comparación entre texto-20 y xml-20, y entre texto-14 y xml-europass, separa versión del contenedor y presencia de datos. El rechazo de los controles sin XML no demuestra por sí solo que fallen por columnas, orientación, Unicode o formularios.

Los dos controles que exigen contraseña se abren y permiten extraer texto localmente al proporcionar su contraseña ficticia conocida. Esto verifica los fixtures; no demuestra que Europass ofrezca ese recorrido.

La primera tanda alcanzó el límite de tiempo y tuvo dos fallos de carga de la pantalla inicial. No se trataron esos fallos como rechazos de archivo. Los casos afectados, el XML ajeno y los controles positivos se repitieron con resultados completos. El XML ajeno mostró un error explícito en la repetición; la espera sin mensaje del primer intento no se clasifica como bloqueo permanente.

### Evidencia y procedencia

- Tanda parcial: `ev_13954dae4ba21a1482e7448d5523c3cfe249e14de347391f53585572a698f4d7`, salida por timeout; solo se usan sus etapas terminadas.
- Variantes XML y seis reimportaciones: `ev_87ea65c23310cc507c31c9dac03a97551795f2e4c7eb4a67ca720eb147a263ac`, salida 0.
- Repeticiones y editor estándar: `ev_8aa7a20b20acd2705ffbbdb460fa880ab533128b7a165befc74a9d46e7b7b337`, salida 0.
- Guiones [38](scenarios/38-compatibilidad-ampliada.mjs), [39](scenarios/39-compatibilidad-xml-y-plantillas.mjs), [40](scenarios/40-compatibilidad-reintentos.mjs) y generador propio [PdfCompatibilityFixtures.java](scenarios/PdfCompatibilityFixtures.java), con Apache PDFBox 3.0.3 ya instalado.
- Metadatos, hashes y resultados: [metricas-seguimiento.json](scenarios/metricas-seguimiento.json) y [evidencias-seguimiento.json](scenarios/evidencias-seguimiento.json). Los PDF permanecen en `/tmp/europass-seguimiento/corpus/` y no se redistribuyen en el proyecto.

La [plantilla pública de EEAS](https://www.eeas.europa.eu/sites/default/files/documents/2025/Europass-cv-en%20template_0.pdf) se descargó como muestra documental y se inspeccionó como archivo; no se usa como recurso de nuestra aplicación. La [FAQ oficial](https://europass.europa.eu/en/faq?page=2) indica compatibilidad con antiguos CV Europass online en PDF/XML y distingue los PDF derivados de formatos editables offline. Nuestra prueba de esa plantilla sin adjuntos no comprueba la importación de un CV online histórico con datos incrustados.

## 2. Inferencias y mejoras propuestas

Conviene detectar capacidades del documento, en lugar de decidir por nombre, marca, extensión o versión PDF: datos estructurados compatibles; texto seleccionable sin modelo; imagen/escaneado; contenido mixto; archivo protegido o no legible. La compatibilidad con namespaces, codificaciones y adjuntos debe tener pruebas propias.

El importador propuesto debería ofrecer recuperación estructurada cuando sea posible y extracción/OCR con revisión cuando no lo sea. También debería explicar qué recupera, conservar el archivo original e informar de campos sin correspondencia.

El control de XML y aspecto diferentes demuestra por qué es útil revisar juntos documento y datos recuperados. No se puede asumir que un PDF modificado por una herramienta externa mantenga sus adjuntos sincronizados.

## 3. Cuestiones pendientes

- Muestras genuinas de distintas generaciones históricas de Europass online con datos incrustados. Modificar la cabecera o un fixture actual no sustituye esas muestras.
- Corpus de distintos generadores con tablas, fuentes sin mapas Unicode, documentos mixtos, escaneos complejos y otros idiomas.
- Conformidad PDF/A, PDF/UA, XFA, firmas digitales y características avanzadas de PDF 2.0: no validadas. No se declara soporte ni incompatibilidad de categorías no probadas.
- Combinaciones adicionales de cifrado, permisos y codificación; un único control no establece una regla universal.
- Compatibilidad real de nuestra herramienta: queda por implementar y validar contra este corpus y muestras adicionales.
