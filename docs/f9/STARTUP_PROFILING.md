# F9 — Corrección del arranque y perfilado

25/10/2026. **Aceptación técnica PASS; no fusionar, no publicar main ni iniciar F10.**
Código de producto `4ed92317ac4709cd88e89833016648b9b690d384`; candidata 0.1.0. [Datos numéricos](evidence/startup-profiling.json), [aceptación oficial](evidence/startup-acceptance.json).

## Qué se pudo demostrar

No se pudo atribuir el incremento aproximado de 870 ms a un único commit.
La AppImage anterior `6b984f6e…443d8c` era idéntica en la medición aceptable de
2944,7 ms y en la fallida de 3462,3 ms. El primer 2594,1 ms corresponde a una
candidata anterior al cierre GUI/perfil. No es correcto presentar una diferencia
entre esas mediciones como una bisección causal controlada.

Se localizaron costes concretos en el camino crítico: tres transportes/clones del
workspace completo para preparar/listar la biblioteca ya validada, recorridos de
seguridad repetidos sobre los mismos datos, canonicalización de todas las
versiones aunque no se comparasen, módulos pesados de UI cargados sin usar y
carga de 123 módulos transitivos del worker. Ventana y almacenamiento se cargaban
secuencialmente. Son costes reales medidos; no se atribuye toda la variación del
runtime/SO a una función concreta.

Comparación diagnóstica: cinco procesos nuevos por punto, intercalados, mismo
corpus/SSD y Electron, sin AppImage; no sustituye el benchmark de aceptación.
HEAD solo tenía instrumentación, sin optimizaciones.

| Punto | Mediana ms | Rango ms |
| --- | ---: | --- |
| main | 9329.5 | 8318.5–11399.3 |
| before-cache | 2056.1 | 2005.4–2638.7 |
| cache | 2081.1 | 1805.3–2828.4 |
| profile-gui | 2106.0 | 1709.4–2714.6 |
| head | 1777.7 | 1741.4–2546.0 |

`29a9260` añadió la validación local memoizada con otra comprobación de árbol
por entidad después de comprobar el proyecto completo: 339 de 3040 muestras CPU
quedaban en ese recorrido duplicado. Se conserva la memoria exacta que corrigió
Confirmar; no se revierte. `452d709`/`4407f77` añaden perfil/GUI sin montar sus
formularios al arrancar; no mostraron un salto reproducible de 870 ms.
`97778ea` añade diagnóstico de Confirmar bajo flag; `bb69f52`, `d367aae` y
`c4203da` no explican ese salto por funcionalidad de startup.

## Perfil CPU y cambios

Cinco aperturas directas del motor, inspector Node, módulos previamente
importados: 3470,3 → 1769,1 ms; diagnóstico, no p95. Antes, `assertDataTree`
aparecía en 906/3040 muestras, JSON en 748 y canonicalización en 296; son
categorías inclusivas y no se suman. 299 muestras correspondían al recorrido
final redundante del JSON ya construido y 339 al árbol por entidad.

- Índice de biblioteca por un puerto opcional: solo nombres/IDs/revisión/idioma,
  estado de borrador y recuperación. No se transportan todos los CvDocument,
  assets o historial a main/renderer para listar. `editor.start()` baja de
  100–139 ms a aproximadamente 3–6 ms en el diagnóstico del cambio aislado.
- Se mantiene la validación completa del worker antes de exponer metadata,
  incluidos bytes, referencias e integridad. `data_version` obliga a revalidar
  tras cambios externos; las respuestas públicas son copias independientes.
- JSON sigue rechazando claves duplicadas/peligrosas, UTF-8 inválido, límites,
  números no finitos y cero negativo. El parser construye objetos simples y
  arrays densos; no necesita otro recorrido de descriptores después de construirlos.
- El proyecto comprueba su grafo completo antes de las transformaciones. Se
  conserva cada schema/invariante de entidad sin volver a recorrer cada subárbol.
  Los textos canónicos se calculan cuando dos snapshots reclaman la misma versión;
  siguen rechazándose historias divergentes, incluso con caché y claves reordenadas.
- El snapshot privado validado del motor no escapa. Solo se clona cuando un
  consumidor pide un snapshot completo; no para abrir el índice.
- PDF.js y Tiptap se cargan bajo demanda con estado de carga/error y reintento.
  Cancelar un padre desmonta el loader; una resolución tardía no modifica el borrador.
  El código ligero compartido permanece eager; no se montan formularios en biblioteca.
- Ventana/renderer cargan a la vez que SQLite. La ventana permanece oculta hasta
  terminar inicialización y carga; una barrera IPC impide operar antes de estar
  listos los servicios. No se adelanta la disponibilidad del producto.
- El worker se agrupa en 271 kB en su misma URL. `better-sqlite3` permanece externo;
  el directorio relativo que protege rutas no cambia. Se usa Vite ya instalado
  como compilador Node, sin servidor ni dependencias nuevas.

No cambian FULL/WAL, commit/fsync, revisión, borrador resuelto, CAS, formatos,
plantillas, PDF ni política de distribución. La caché conserva valores exactos,
no confianza por ID/revisión. Las nuevas pruebas comprueban corrupción externa,
mutaciones, JSON hostil e historias divergentes.

## Etapas monotónicas

`process.hrtime.bigint()` para controlador/main/worker; Performance API para
renderer. Solo se guardan números y nombres estáticos, sin contenido del CV.
La instrumentación es opt-in; la aceptación oficial no tiene flags de trazado.
Medianas de cinco arranques AppImage instrumentados con extracción, en ms:

| Etapa | ms | Significado |
| --- | ---: | --- |
| A | 750.4 | Lanzamiento/runtime hasta inicio Node estimado por uptime. |
| B | 54.7 + 76.1 | Inicialización hasta JS y espera posterior de app.whenReady; aproximación a Electron nativo. |
| C | 142.0 / 129.4 | Módulos main / creación e imports del worker. |
| D | 34.0 | Crear BrowserWindow. |
| E | 293.9 | Inicio de navegación → primera señal de preload; incluye arranque del renderer. |
| F | 418.6 | Carga de renderer hasta loadFile resuelto. |
| G | 563.2 | Apertura completa, imports del worker, integridad y validación; migraciones ya aplicadas 0.44. |
| H | 1.45 | Leer cabecera Workspace. |
| I | 2.06 | Decodificar MasterProfile; no se monta su editor. |
| J | 122.0 | Decodificar 100 CV y perfil, incluido I, dentro del worker. |
| K | 4.24 | Hashes de assets; configuración/metadata se lee dentro de G/H/J. |
| L | 9.90 | Entrega de metadata → commit React de la biblioteca. |
| M | 616.0 | First Contentful Paint desde inicio de navegación. |
| N | 1772.6 | Tiempo total diagnóstico hasta las 100 tarjetas del marcador original. |

Son spans solapados y relojes relativos: no se suman. F corre durante G; I está
en J, la validación completa (274.8 ms) y C-worker
están en G. A/B separan aproximadamente runtime e inicialización nativa, no son
una traza del exec del kernel. El diagnóstico registró 42 statements/PRAGMA:
40 de apertura y dos lecturas de índice. No hay migraciones pesadas repetidas.

## Aceptación y FUSE

El script oficial permanece sin cambios desde antes de este trabajo: SHA-256
`5441ee4ed607620c896aae372154a8d205cf35a9d31f0c27982afde09e4806b2`. Mismo corpus
`83ae157d013de8c0423655186059076407449db8217d08659e892016b4577380`, 100 CV,
equipo/SSD, procesos/perfiles nuevos, 20 muestras, nearest rank y ningún descarte.
Inicio antes de electron.launch; fin al ver biblioteca y la tarjeta 100 adjunta.
No se mueve trabajo obligatorio detrás de ese marcador.

Método histórico: AppImage extract-and-run dentro del namespace offline, sin
vaciar las cachés SO/runtime. «Frío» significa proceso/perfil nuevo, no caché fría
de SO. Las cinco ejecuciones diagnósticas preceden a la aceptación; se conservan
sus muestras, incluida la primera lenta de 3145,4 ms. No se mezclan con las 20
muestras oficiales. No se declara una garantía de primer arranque con caché SO fría.

Oficial: p50 1764.1, p90 1824.7,
p95 **1844.4 ≤3000**, máximo 1875.5 ms.
Confirmar durable p95 **228.4 ≤300**, máximo
235.7 ms. Todos los presupuestos previos PASS.
Abrir CV p95 2819.1 ms: informativo, cola más lenta que los
1700,5 ms anteriores; no se añade un umbral ni otra fase de optimización.
La primera apertura sigue materializando snapshots completos cuando se necesitan.

Además se ejecutó FUSE normal **sin APPIMAGE_EXTRACT_AND_RUN**, fuera del
namespace que impide montar: 20 procesos/perfiles nuevos, mismo corpus y marcador.
Cada main comprobó montaje FUSE real y sandbox activo. Diagnóstico normal:
p50 2253.5, p90 2332.5, p95 2339.4,
máximo 2367.9 ms, con trazas ligeras. No se mezclan estos datos con el
benchmark oficial. Crear/cerrar/reabrir sin switch userData también pasa con FUSE.

## Cierre de regresión

216 tests distintos, 33 casos PDF, dos muestras privadas, TypeScript/build,
AppImage independiente del checkout, offline y privacidad PASS. [Prueba completa](evidence/startup-validation.json).
Se corrigió un fallo del comprobador auxiliar de reapertura: pulsaba el CV y
consultaba inmediatamente el título sin esperar el IPC. Ahora espera el mismo
título visible, sin cambiar el criterio. Las 216 pruebas ya pasadas se verificaron
contra el SHA idéntico antes de repetir desde cero ese recorrido y completar
PDF/privacidad. `resumedAfterPackage=true`; no se omitió ningún fallo.
Los dos intentos intermedios fallidos y la regresión 3462,3 ms permanecen en
[PERFORMANCE](PERFORMANCE.md). No hay merge/push ni F10.
