# F8 — Plantilla Lateral

Implementación en `f8-lateral-portable-cycle`, desde main/origin/main limpio
`78032712f74ecfeb868e1a91b3b4ccbb4f47dda3`. No es aceptación global F9.
[Validación](VALIDATION.md), [portabilidad y registros](PORTABLE_EXPORT.md).

## Diseño y selección

Lateral v1 es un diseño propio: A4, márgenes de 18 mm, cabecera de nombre/titular,
columna lateral de 52 mm, separación de 8 mm y cuerpo principal de 114 mm.
La lateral tiene superficie clara y una línea de acento. Foto/contactos/demás
campos personales, habilidades e idiomas van en esa columna; sobre mí y las
otras secciones van en la principal. Cada columna conserva el orden relativo
confirmado. El orden completo del dominio permanece intacto y viaja en el payload:
la distribución entre columnas es una regla de presentación de esta plantilla.

Cuando no existe ningún contenido lateral, no se reserva un hueco de foto ni una
banda vacía: el cuerpo dispone del ancho útil. Un CV solo con nombre es válido y
ocupa una página. Cuando una columna termina antes, su espacio no se rellena
copiando contenido ni alterando la anchura de la otra en páginas posteriores.

Presentación ofrece exclusivamente Simple y Lateral v1. Confirmar conserva los
ajustes comunes: densidad, acento, precisión máxima de fechas, numeración y guía
CEFR. Cancelar no cambia la selección. El selector conserva labels, controles y
pie común de la UI pulida. Elección/ajustes se confirman como revisión F3 y
sobreviven a SQLite/reinicio. Tests comparan SHA-256 lógico de todo el contenido
excluyendo únicamente presentación, revisión y fecha de modificación.

## Mismo pipeline y recursos

CV confirmado → RenderSnapshot congelado → ExportProjection visible resuelta →
Simple/Lateral → ventana Chromium aislada → posprocesado/adjunto mínimo → bytes
finales → PDF.js / archivo.

ExportProjection es la transformación explícita equivalente al
DistributionSnapshot solicitado: solo contenido y recursos representados. El
render no traduce ni toca fechas, memoria, historial o dominio. Los snapshots
resuelven variantes originales/traducción/ambas y conservan la precisión mostrada.
Lateral reutiliza el serializador semántico escapado de Simple, sin modificar el
HTML/CSS de Simple; añade su composición y estilos propios en otro módulo.

No hay otro motor ni preview HTML. Se conserva invalidación por revisión,
AbortSignal/token y descarte de resultados antiguos, independiente de escrituras.
Cambiar plantilla invalida el artefacto previo. Exportar captura artefacto y
metadatos antes del diálogo; una generación posterior tampoco cambia su recibo.
PDF.js verifica SHA-256 de getData(); el archivo debe tener exactamente ese hash.

Versiones: `lateral`/1, renderer `lateral-1`; Simple conserva `simple`/1 y
`simple-1`. El registro contiene además la versión real de Chromium. El adaptador
rechaza plantilla/versión desconocida o motor distinto del snapshot. No se admite
CSS, código, fuentes o rutas suministradas por el documento como motor ejecutable.

Los mismos cinco recursos F7: Liberation Sans 2.1.5, cuatro variantes TTF y texto
OFL-1.1. Hashes/tamaños del manifiesto se verifican, sin fallback de fuentes del
equipo ni red. Se prueba ES/EN/RO; otras coberturas no se prometen. No se añaden
fuentes, iconos, geometría ni recursos Europass. Sin dependencias productivas nuevas.

## Paginación medida

Tras esperar fuentes/imágenes locales, Lateral distribuye nodos en páginas y
columnas con altura medida. Las páginas no dependen de clipping CSS para ocultar
exceso. Se mantienen juntas las entradas cortas y los items que caben enteros;
los bloques largos pueden continuar. Las cadenas de título/metadatos se trasladan
con su primer contenido. No se duplica texto para fabricar encabezados continuados.

El fragmentador conserva elementos semánticos, marcas, enlaces y texto completo.
Si un párrafo supera una página, busca el mayor prefijo medido, prefiere límites
de palabra y no divide pares surrogate; el resto continúa. Las listas conservan
su ordinal al continuar. Se comparan los textos completos de las dos colas antes
y después de componer; se comprueban desbordamientos y límites. Un bloque que no
pueda colocarse o más de 200 páginas produce error controlado, sin modificar el CV.

Se prioriza integridad: puede quedar espacio libre al mover una entrada corta;
una biblioteca con muchas habilidades/idiomas puede dejar páginas con cuerpo
principal vacío. No se redistribuye contenido entre columnas para optimizar el
número de páginas ni se reduce arbitrariamente la letra. No es el trabajo p95 F9.

## Lectura y accesibilidad observadas

El DOM de cada página dispone cabecera (primera página), columna lateral y columna
principal, con texto seleccionable, títulos, listas y anotaciones de enlaces.
PDF.js/PDFium y Poppler en orden de contenido se comprueban, además de la apertura
real en Chrome/PDFium Linux. La secuencia útil es por página y columna; no se
promete terminar toda la lateral de todas las páginas antes del cuerpo principal.

Poppler `-layout` preserva las posiciones de ambas columnas mediante espacios.
Al consumirlo como una sola cadena/por filas puede intercalar fragmentos de
bloques distintos; no es un serializador semántico del CV. `-raw`, los items de
PDF.js y el texto de PDFium permiten verificar contenido y continuidad. PDFium
puede entregar el contador de página antes de la cabecera en su secuencia cruda.
No se confunde ese contador marginal con pérdida del nombre/contenido.

Se comprueba que todas las páginas tienen estructura etiquetada tras pdf-lib,
metadatos básicos, glifos, enlaces y texto. No se declara PDF/UA, auditoría completa
con lectores de pantalla ni orden universal de copia en cualquier herramienta.
La API de texto de PDFium no ofrece análisis de layout por sí sola:
[documentación primaria](https://pypdfium2.readthedocs.io/en/stable/_modules/pypdfium2/_helpers/textpage.html).

## Evidencia visual y límites

Corpus sintético de pequeño, medio, largo, habilidades, idiomas, foto, URL extensa,
variantes sensibles, ocultos y varias personalizadas; añade nombre solo y párrafo
mayor que una página/lista larga. Se genera con ambas plantillas. Referencias,
PDF, capturas Poppler, texto independiente y capturas del lector externo quedan
fuera de Git, en `/tmp/cvforge-f8`; rutas concretas en VALIDATION.md.

No se incorporan otros diseños, OCR, extracción genérica, traducción automática,
aceptación global/p95 ni F9. Persisten las deudas anteriores Vite/VA-API, popups
nativos, accesibilidad completa y plataformas no validadas.
