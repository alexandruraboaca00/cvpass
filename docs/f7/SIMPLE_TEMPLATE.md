# F7 — Simple y preview PDF.js

Implementación en `f7-simple-template-preview`, desde main `7230814`.
El cierre técnico se registra en [VALIDATION.md](VALIDATION.md). F7 está aprobada
e integrada; F8 se autoriza posteriormente en su rama. El alcance histórico de F7
descrito aquí se amplía en [f8/LATERAL_TEMPLATE.md](../f8/LATERAL_TEMPLATE.md), sin
cambiar funcionalmente Simple.

## Base y límites de fase

Se leyeron completos AGENTS, REQUIREMENTS, ARCHITECTURE, DATA_MODEL, ROADMAP,
f6/IMPORT y f6/VALIDATION actuales. Main estaba limpio y sincronizado con origin.
La base pasó F1 3/3, F2–F6 139/139, TypeScript/build y 13 flujos UI F4–F6 sin red.
Evidencia sintética inicial: `/tmp/cvforge-f7-baseline`.

Simple es un diseño original de una columna. F7 incluye su exportación para
validar la identidad preview/archivo solicitada. No implementa Lateral ni el
ciclo portable completo F8. Se mantiene una sola acción **Exportar PDF** y el
contrato mínimo visible ya aprobado, sin modos completo/compartir.

## Instantánea congelada

`RenderSnapshotFactory` lee un estado consistente de la biblioteca confirmada,
comprueba la revisión solicitada y valida las referencias de plantilla/activos.
Copia contenido y bytes necesarios antes de esperar la preparación de imágenes.
Resuelve `ExportProjection` mediante el resolver de dominio existente: idioma,
orden, inclusión, variantes C elegidas, fechas con precisión máxima y ajustes.
No traduce, no consulta TranslationProvider y no utiliza el borrador abierto.

La instantánea privada congelada contiene CV/revisión, fecha de captura,
fingerprint de proyección/motor/recursos, fuentes y proyección visible. Ni esos
identificadores privados ni la instantánea completa se serializan al PDF. El
fingerprint incorpora versión del renderer `simple-1`, Chromium, versión de
recursos y hashes de las cuatro fuentes. Los bytes generados tienen además su
propio SHA-256. No se promete igualdad binaria entre generaciones distintas.

`PresentationService` confirma plantilla Simple y ajustes mediante una revisión
F3. Solo cambia presentación/revisión/fecha de modificación; no reescribe textos,
fechas ni colecciones. Cancelar el formulario de presentación descarta su estado
local. Los nuevos CV usan Simple; un CV anterior conserva su plantilla hasta que
el usuario confirme la selección de Simple. Un recurso incompatible no se
sustituye silenciosamente.

## Diseño y contenido

A4, márgenes de 18 mm y ancho de contenido de 174 mm. Jerarquía de nombre,
secciones y entradas, color de acento configurable y texto oscuro. Densidades de
9,5 / 10,5 / 11,5 pt, interlineado 1,4. Cabecera con datos personales incluidos,
foto opcional y sobre mí; siguen las secciones en su orden confirmado.

Se presentan educación, experiencia, habilidades sin agrupar y grupos, idiomas
maternos y extranjeros, certificaciones, proyectos y varias personalizadas.
Las cinco dimensiones CEFR son independientes; null se etiqueta como sin evaluar,
y una lengua materna no recibe nivel. No se crean bloques para secciones vacías.
Los nombres oficiales y demás campos B se imprimen literalmente. C se resuelve a
original, traducción o ambas, poniendo el original entre paréntesis cuando sigue
a una traducción. El título de documento visible se muestra si existe; el nombre
privado de biblioteca no se utiliza como título ni nombre de archivo.

Las fechas se formatean desde su precisión: año, mes/año o día/mes/año, nunca
completando partes ausentes. El final solo es válido si lo es en el dominio.
Actualmente/Ongoing y etiquetas de plantilla dependen de documentLocale ES/EN,
independientemente del idioma de interfaz.

El serializador consume el árbol semántico permitido: párrafos, saltos, negrita,
cursiva, enlaces y listas ordenadas/no ordenadas. Escapa texto y atributos; no
interpreta HTML almacenado/importado. URLs confirmadas conservan su protocolo;
un valor sin protocolo no se convierte en HTTP. Emails visibles válidos admiten
mailto. Las URLs largas se parten con `overflow-wrap:anywhere`, conservando la
anotación de enlace. No se descargan sus destinos al generar o visualizar.

## Foto y recursos locales

El normalizador Electron verifica el asset real, materializa el recorte y vuelve
a codificar PNG. Solo conserva IHDR/IDAT/IEND: no transporta EXIF/texto/perfiles ni
píxeles fuera del recorte. La foto conserva proporciones con límites de 30 × 38 mm;
si está ausente/excluida no se reserva su espacio. Los assets originales privados
permanecen en el proyecto, separados de la imagen minimizada del PDF.

Liberation Sans **2.1.5**, regular/negrita/cursiva/negrita cursiva, SIL OFL **1.1**.
Los TTF proceden de la instalación local de Liberation, sin modificaciones.
`resources/fonts/manifest.json` fija tamaños/hashes e identidades de recursos;
`OFL.txt` conserva el texto completo de licencia. Las cuatro fuentes y licencia
forman también el cierre de dependencias de plantilla en SQLite y `.cvproj`.
La plantilla no utiliza tipografías, estilos ni recursos gráficos Europass. PDF.js y sus recursos propios usan Apache-2.0.

Se cargan explícitamente las cuatro variantes, incluso para un CV con solo nombre.
Se verifica cobertura cmap y se informa `RENDER_GLYPH_UNSUPPORTED` si falta un
carácter, evitando un reemplazo silencioso por fuentes del equipo. Los glifos
ES/EN/RO requeridos están cubiertos. La numeración usa `@bottom-center` y contadores
CSS con la misma fuente local; no utiliza el pie predeterminado de Chromium.

## Chromium y bytes finales

CV confirmado → RenderSnapshot → HTML/CSS Simple → Chromium aislado → PDF
etiquetado → worker pdf-lib → bytes finales → PDF.js / diálogo de exportación.

La ventana de impresión está oculta, en sesión en memoria propia, sin Node,
con sandbox/contextIsolation, permisos denegados, navegación y ventanas nuevas
bloqueadas. Su esquema `cvforge-render` solo sirve el HTML en memoria de ese trabajo.
CSP deniega scripts y conexiones; solo admite estilos propios y fuentes/imágenes
data. La sesión bloquea protocolos externos. No escribe HTML temporal ni abre
rutas de assets aportadas por el CV.

Tras cargar fuentes/imágenes se mide el ancho y se rechaza desbordamiento
horizontal. `printToPDF` usa A4/CSS, fondos, etiquetado y outline. pdf-lib trabaja
en un worker: establece título visible, idioma y metadatos básicos CVForge, y
adjunta exclusivamente `encodePdfAttachment(ExportProjection)` existente. Su
contrato sigue siendo `cvforge-pdf-data` v1 / `cvforge-export-payload` v1. No lleva
perfil, otros CV, archivos originales importados, borradores ni historial.

Los bytes finales son la única fuente del visor. PDF.js recibe una copia porque
puede transferir su buffer al worker. Se vuelve a calcular SHA-256 sobre
`PDFDocumentProxy.getData()` y se compara con el hash del servicio. Exportar
captura esa generación antes del diálogo y escribe exactamente sus bytes mediante
temporal, fsync y rename. Cancelar el diálogo no guarda ni cambia el CV.

## Paginación y lectura

H1/H2/H3 y metadatos inmediatos evitan separación del primer contenido. Se mantienen
juntas entradas que midan menos del 45 % de la altura útil; las largas pueden
partirse. Párrafos usan widows/orphans 3. Las reglas break-after solo se aplican si hay contenido siguiente dentro del
bloque, evitando encadenar secciones desde un metadato final. No se aplica una prohibición global de
partir entradas largas. Se comprueba integridad de los 48 párrafos y sus finales,
orden, márgenes del texto/anotaciones y ausencia de páginas vacías.

El PDF contiene texto seleccionable y etiquetas/estructura, con enlaces y título.
Se comprueba también Poppler y un lector externo Chrome/PDFium. Esto no demuestra
cumplimiento PDF/UA ni sustituye una auditoría completa de accesibilidad.

## Preview y concurrencia

Panel opcional en el editor; canvas PDF.js, capa de texto seleccionable y enlaces
con foco. Navegación anterior/siguiente, número de páginas y zoom 60–150 %. Estos
valores y la apertura del panel son estado de UI en memoria, ajenos al CV/export.

Se distinguen sin preview, generando, lista, desactualizada y error, con reintento.
Los cambios confirmados disparan un debounce de 400 ms. La preview representa
contenido confirmado aunque haya un formulario sin confirmar. Un cambio de UI no
traduce ni modifica documentLocale.

El servicio asigna tokens antes de esperar; una nueva solicitud aborta la anterior.
La cola de impresión está separada de la cola de escrituras IPC. Abortar destruye
la ventana y termina el worker activo. Antes de publicar se comprueba otra vez
la revisión; incluso un adaptador que ignore abort no puede publicar un resultado
obsoleto. Se prueban además escrituras reales mientras una generación espera.

Los enlaces de la preview solo abren un destino por acción explícita, a través de
un IPC que acepta únicamente URLs de la proyección de la generación vigente y
protocolos HTTP/HTTPS/mailto/tel. No expone acceso general al sistema de archivos.

## Paquete y comandos

`npm start` abre la aplicación compilada; `npm run build` recompila si hace falta.
`npm run package:linux` produce `out/f7/linux-unpacked/cvforge` con Electron 44.7.2.
El paquete incluye runtime compilado, renderer, worker PDF.js, fuentes/licencia y
dependencias productivas. Excluye el código TS de la aplicación, sus tests e investigación, PDF privados,
bases y modelos de traducción. SQLite sigue en el userData externo de Electron.

Verificaciones: `npm test`, `npm run typecheck`, `npm run test:f7:ui`,
`npm run validate:f7:pdf`, `npm run validate:f7:reader`,
`npm run validate:f7:package`, `npm run validate:f7:offline`.

La aceptación adicional de diálogo nativo utiliza GTK/X11 explícito y XTest, sobre la ventana
transient del proceso de prueba y un destino en /tmp. Preselecciona ese directorio
sintético mediante el harness y pulsa Guardar realmente; la regresión habitual controla el
resultado del diálogo para verificar opciones/cancelación y escritura real. La automatización nativa es intermitente según portal/compositor y no forma parte
de la suite repetible. Se puede activar con `CVFORGE_F7_NATIVE_DIALOG=1` al ejecutar
`test:f7:ui`; los pases reales GTK con digest coincidente se registraron como
aceptación adicional. No es una validación exhaustiva de cada portal Linux. Los flags de automatización, incluido
`--no-sandbox`, pertenecen al harness, no se añaden al lanzamiento normal.

## Límites y deuda

Registro de generación/exportación y métricas en memoria; el registro durable de
exportaciones y el ciclo portable completo se reservan a F8. Un PDF Simple vuelve
a pasar por la revisión F6; su adaptador conserva el fallback de plantilla ya
informado, sin prometer todavía la equivalencia completa de presentación F8.

No hay ajuste óptimo global de páginas ni control tipográfico editorial avanzado.
Una entrada larga puede continuar en otra página y quedar espacio al mantener una
entrada corta unida. La cobertura de otros alfabetos requiere recursos compatibles
adicionales. No se declara PDF/UA, accesibilidad completa ni aceptación p95 de F9.
Las mediciones iniciales incluyen un primer render frío y otros calientes; no son
una comparación de rendimiento entre tamaños.

Se mantienen las deudas anteriores documentadas, incluidos avisos Vite/VA-API y
moderados de herramientas de desarrollo. No se amplían importación, OCR,
traducción automática ni otras plataformas.

Referencias primarias: [Electron printToPDF](https://www.electronjs.org/docs/latest/api/web-contents#contentsprinttopdfoptions),
[PDF.js](https://mozilla.github.io/pdf.js/api/),
[cajas de margen Chromium](https://developer.chrome.com/blog/print-margins?hl=en),
[diálogos Electron](https://www.electronjs.org/docs/latest/api/dialog).
