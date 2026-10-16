# F1 — Cierre de validación técnica

**16 de octubre de 2026 · F1 = APROBADA. F2 no iniciada.**

Alcance fijado por la última instrucción del usuario: cierre de lectura/paginación,
privacidad, licencias directas y operación sin red. La traducción **no es condición
de F1**; las pruebas exploratorias previas se conservan como evidencia histórica,
sin desarrollarla ni ejecutarla en este cierre. `.cvproj` sigue pospuesto a F2.
Esto acepta una prueba técnica aislada, no declara implementado el producto.

## Criterios y evidencia

| Criterio | Estado | Evidencia |
| --- | --- | --- |
| Electron empaquetado para Linux | PASS | Directorio ejecutable de electron-builder, ejecutado dos veces sin red; `packaged: true` |
| SQLite en worker, escritura y reapertura | PASS | Transacción WAL/FULL con texto e imagen en proceso inicial; nuevo proceso recupera fila/hash e `integrity_check: ok` |
| PDF de una columna y varias páginas | PASS | Simple: 9 páginas; 48 bloques completos, listas y párrafo largo de 150 segmentos |
| PDF de dos columnas y varias páginas | PASS | Lateral: 7 páginas; mismo contenido y orden lógico de extracción del flujo |
| Texto largo, saltos y cortes | PASS | Párrafo cruza páginas; texto íntegro; salto explícito a página final; cajas de texto dentro de márgenes; títulos P01–P48 unidos al comienzo de su párrafo |
| Enlaces clicables | PASS | Anotaciones URI preservadas; capa real de anotaciones PDF.js renderizada y enlaces activados con `.click()`, interceptando navegación sin acceso remoto |
| Imagen y caracteres ES/EN/RO | PASS | PNG azul 2×2 visible; cuatro píxeles coinciden con el recorte; glifos y texto completos recuperados por PDF.js y Poppler |
| Fuentes locales | PASS | Liberation Sans Regular/Bold 2.1.5 incluidas; Poppler confirma solo esas fuentes, incrustadas, subconjuntos y Unicode |
| PDF.js muestra el archivo exportado | PASS | SHA-256 del buffer recibido por el visor igual al archivo; render de todas las páginas, no solo la primera |
| Adjuntar payload conserva el PDF | PASS | Píxeles, texto, enlaces, estilos de fuentes y estructura de etiquetas iguales antes/después en todas las páginas |
| Privacidad y extracción del payload | PASS | Un único JSON, igualdad exacta con lista permitida; extracción independiente con PDF.js y `pdfdetach`; inspección de objetos descomprimidos y control negativo de filtración |
| PDF sin payload y retirada del adjunto | PASS | Variante generada sin adjunto y variante con adjunto retirado; cero adjuntos y ausencia de bytes del payload; PDF.js/Poppler las abren con contenido visual idéntico |
| Funcionamiento sin red | PASS | Namespace Linux sin rutas ni interfaces externas desde antes de arrancar; conexión IP externa falla; arranque, escritura, cierre/reapertura, generación, visor y extracción pasan |
| Licencias directas | PASS | Doce paquetes MIT/Apache-2.0, textos/hashes comprobados; fuentes OFL-1.1 con licencia incluida |
| Tests, TypeScript, build y logs | PASS | 3/3 tests, 0 FAIL; `tsc` y Vite pasan; paquete reconstruido y probado; sin error funcional en logs |

No quedan FAIL ni pendientes dentro de los criterios de cierre fijados. La
traducción futura, F2 y las validaciones del producto de fases posteriores no
se marcan como realizadas por aprobar esta prueba.

Evidencia verificable: [resultados finales](validation/f1-closure.json),
[licencias](F1_LICENSES.md), [inventario con hashes](validation/f1-direct-licenses.json).
El archivo [f1-measurements.json](validation/f1-measurements.json) conserva la
medición preliminar del 15 de octubre, no sustituye al resultado final.
`docs/f1/TECHNICAL_SPIKE.md` no existe; el código y sus instrucciones están en
[spikes/f1](../spikes/f1/README.md).

## Lectura, paginación y comparación visual

Se usa exclusivamente contenido sintético propio. Cada composición incluye 48
bloques numerados, un párrafo continuo de 150 segmentos, tres viñetas, URL extensa,
imagen, fecha reducida al año, texto sensible visible en inglés y glifos ES/EN/RO.
El último bloque fuerza un salto de página. Se espera que Simple y Lateral tengan
distinto número de páginas: 9 y 7 respectivamente; no se intenta imitar Europass.

Se renderizaron todas las páginas de tres variantes de cada composición:
`plain` (nunca tuvo payload), `exported` (con payload) y `stripped` (retirado).
PDF.js compara el hash de cada bitmap, texto/posiciones, fuentes, anotaciones y
árbol de etiquetas. Los tres resultados son iguales página por página. Además,
Poppler 26.08.0 (`pdftoppm -r 72 -png`) renderiza todas esas variantes y produce
PNG idénticos dentro de cada composición. `pdftotext -raw` conserva contenido y
orden, `pdfinfo` confirma PDF válido/etiquetado y `pdffonts` confirma incrustación.

Se revisaron visualmente las 16 páginas únicas mediante hojas de contacto y
páginas individuales, incluyendo los glifos y la continuidad del texto largo.
No se observaron omisiones, solapes, imágenes cortadas o cambios de composición
al adjuntar o retirar el payload. Hay espacios en blanco normales al mantener
un título con su contenido y al forzar el salto final; no se rellenan con datos.

**Diferencias relevantes:** la extracción geométrica predeterminada de
`pdftotext` puede intercalar columnas de Lateral. La extracción `-raw` y PDF.js
conservan el flujo lógico; no se pierde ni altera contenido al posprocesar el PDF.
No bloquea esta prueba de lectura, pero una importación genérica posterior no
puede asumir que cualquier extractor reconstruirá columnas automáticamente.
Entre PDF.js y Poppler puede variar el suavizado de bordes; no se observó cambio
de texto, distribución o saltos. Esta comprobación no certifica PDF/UA ni sustituye
una prueba del futuro editor con tecnologías de asistencia.

## Contenido exacto del payload y privacidad

Extracciones literales del adjunto, con datos sintéticos propios:
[Simple](validation/f1-payload-simple.json) y
[Lateral](validation/f1-payload-lateral.json). Se comparan también con la extracción
independiente de Poppler, sin interpretar el PDF como proyecto completo.

| Campo JSON | Contenido permitido y observado |
| --- | --- |
| `format` | `cvforge-export-probe`, identificador de la sonda, distinto de `.cvproj` |
| `pdfPayloadFormatVersion` | `1`, versión del contrato mínimo de prueba |
| `layout` | `simple` o `lateral` |
| `title` | `CV sintético F1`, título impreso |
| `glyphs` | Línea impresa con español, inglés y rumano |
| `year` | `2020`, sin día/mes de la fecha privada completa |
| `photo` | Base64 del PNG recortado azul 2×2, sin píxeles rojos ni chunks EXIF/texto |
| `sensitiveVisible` | `Reviewed synthetic qualification`, únicamente el valor impreso |
| `link` | Etiqueta y URI impresas de example.org |
| `paragraphs` | Los 48 párrafos visibles P01–P48 |
| `longText` | Los 150 segmentos visibles L001–L150 del párrafo largo |
| `list` | Las tres viñetas impresas |
| `breakHeading`, `end` | Textos impresos del bloque final |

Se inyectan marcadores privados distintos en la fixture para **datos ocultos,
historial, idioma alternativo, borrador, datos externos, ruta local, información
del sistema, otro documento y título original no mostrado**. Ninguno aparece en
el payload, texto visible, diccionarios u objetos/streams descomprimidos del PDF.
Se buscan también representaciones hexadecimales y UTF-16, la fecha completa y
prefijos de rutas locales. La igualdad del JSON con la proyección por lista
permitida descarta claves adicionales. Un test negativo introduce una filtración
en un stream comprimido y verifica que la auditoría la rechaza.

La imagen PDF contiene exactamente 2×2 píxeles azules, no el original 4×2. El PNG
del payload no tiene EXIF ni campos de texto. Los datos de medición del equipo
permanecen en informes externos al PDF. Los metadatos PDF normales (título visible,
productor Chromium/pdf-lib y fechas de creación/modificación) se documentan por
separado: no forman parte del payload ni transportan rutas, CPU, biblioteca o CV
privados. La visita al enlace se intercepta en el test; no descarga datos externos.

La retirada elimina la entrada de adjunto y sus objetos/stream, no solo su nombre.
Se vuelve a abrir y se verifica que tampoco quedan bytes del formato de payload
en streams sin referencia. Esta función está limitada a la fixture con un único
adjunto plano; no es un importador/limpiador PDF general de F2/F6.

## Prueba exacta sin red

Se ejecutó el paquete final dentro de un namespace creado con util-linux 2.42.4:

```bash
CVFORGE_F1_OUTPUT=/tmp/cvforge-f1-closure-final-20261016 \
  unshare --user --map-current-user --net node spikes/f1/offline-check.cjs
```

El runner comprueba **antes de iniciar Electron** que `/proc/net/route` no tiene
rutas y que no hay interfaces activas (`interfaces: []`; el loopback del namespace no
está activado). Una conexión TCP a `1.1.1.1:443`
falla con `ENETUNREACH`. Esto impide el acceso exterior en toda la aplicación,
no solo un bloqueo de fetch/HTTP en el renderer. Se mantiene la sesión gráfica
local mediante su socket Unix, sin cortar la red del host.

En ese mismo aislamiento se arrancan dos procesos independientes:

1. `--closure --create`: arranque con perfil nuevo; SQLite escribe/confirma una
   fila e imagen; genera los PDF, muestra cada página y recupera payload.
2. `--closure`: después de que el primero salga, reabre SQLite y los seis PDF
   guardados, muestra todas las páginas y extrae de nuevo los adjuntos.
3. Se ejecuta la suite completa de cierre dentro del namespace, con los tres
   tests, incluida lectura y render externo con Poppler.

Todos los procesos salen con código 0. Las ventanas registran cero peticiones
HTTP/HTTPS/WS/FTP. UI, worker PDF.js y fuentes se cargan desde el paquete; no hay
CDN ni instalación automática de recursos durante el flujo. Se usa `--closure`
para no ejecutar las sondas previas de traducción. El namespace y los resultados
están registrados en `f1-closure.json`; no se deshabilitó el sandbox de Electron.

## Build, paquete Linux, licencias y logs

- TypeScript 7.0.2: `npm run typecheck --prefix spikes/f1`, PASS. Se añadieron los
  tipos de React y se retiró una opción obsoleta no admitida por PDF.js 6.
- Vite 8.3.4: build PASS. electron-builder 26.15.3 recompila better-sqlite3 13.0.3
  para Electron 44.7.2 y produce un directorio Linux x64 ejecutable.
- Se acepta ese directorio con todos sus recursos como formato de validación F1;
  un instalador/AppImage del producto no es necesario para probar la viabilidad
  del stack. No se presenta como un instalador ya validado.
- Tamaño del directorio: **1.005.090.218 bytes** (incluye recursos de la exploración
  previa de traducción, que no se ejecutan). SHA-256 del ASAR e inputs en evidencia.
- Suite de cierre: **3 tests PASS, 0 FAIL, 0 omitidos**. La tercera prueba renderiza
  todas las páginas con Poppler; las otras verifican privacidad y recuperación.
- `npm audit --omit=dev`: 0 vulnerabilidades. Auditoría completa: ocho moderadas
  de herramientas de desarrollo. [Detalle de licencias y avisos](F1_LICENSES.md).
- Logs: aviso Vite por tamaño del bundle (~654 kB JS y worker PDF ~1,26 MB), y
  diagnóstico VA-API del equipo (`vaInitialize failed`). No afectan al render
  comprobado; no se ocultan ni se desactiva seguridad para silenciarlos. Sin
  errores de SQLite, PDF.js, fuentes, payload o dependencias remotas en este flujo.

Las incidencias técnicas anteriores de carga diferida de PDF.js y bibliotecas
nativas ASAR se resolvieron en la ejecución preliminar. No hizo falta qpdf: no
hubo pérdida de páginas, enlaces, texto o etiquetas con pdf-lib en el corpus.

## Decisión de cierre y límites

**F1 = APROBADA** para Electron/React/TypeScript + SQLite en worker + composición
Chromium + PDF.js + payload mínimo con pdf-lib, en Linux x64 y con el corpus
sintético descrito. La traducción conserva únicamente su evidencia preliminar y
no condiciona este cierre por decisión expresa del usuario. Los pesos ONNX no se
publican; sus avisos de redistribución siguen registrados para una futura entrega.

Se puede cerrar F1 con commit de la prueba, tests y evidencia documental.
No se inician F2 ni funcionalidades de producto, no se implementa `.cvproj`, y
no se convierten las pruebas de una fixture en garantías universales sobre PDF.
