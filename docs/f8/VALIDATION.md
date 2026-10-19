# F8 — Validación de Lateral y ciclo portable

19 de octubre de 2026. Rama `f8-lateral-portable-cycle`, base main/origin/main
`78032712f74ecfeb868e1a91b3b4ccbb4f47dda3`.

**F8 = APROBADA técnicamente**, pendiente de revisión/aprobación del usuario y
merge. No se fusiona la rama. F9 no iniciada; no es aceptación global del MVP.
[Diseño](LATERAL_TEMPLATE.md), [portabilidad/privacidad/registro](PORTABLE_EXPORT.md).

## Prerrequisitos y alcance

Se leyeron completos AGENTS, REQUIREMENTS, ARCHITECTURE, DATA_MODEL, ROADMAP,
f7/SIMPLE_TEMPLATE, f7/VALIDATION y ui/LAYOUT_REVIEW actuales. Main estaba limpio,
HEAD era exactamente el solicitado y origin se comprobó con fetch. Antes de crear
la rama: F1 3/3, F2–F7 151/151, UI 20/20, siete casos PDF y TypeScript/build PASS.
Evidencia inicial: `/tmp/cvforge-f8/baseline`.

Sin cambios de dominio, codec `.cvproj`/payload v1, TranslationProvider,
importación Europass, HTML/CSS/fuentes de Simple ni recursos históricos. SQLite
avanza a v3 únicamente para recibos privados; los contratos de contenido F3 no
se amplían. No se usan ni versionan PDF personales/reales de aceptación F6.

## Matriz de criterios F8

PASS se refiere a los datos sintéticos y entorno Linux probados. No es una
promesa de layout óptimo, compatibilidad universal ni PDF/UA.

| # | Criterio | Estado | Evidencia |
| --- | --- | --- | --- |
| 1 | Selector Simple/Lateral | PASS | UI F8, labels ES/EN y selección por versión; Confirmar/Cancelar. |
| 2 | Selección tras reinicio | PASS | Procesos Electron distintos y nueva conexión SQLite, incluido ejecutable Linux. |
| 3 | Plantilla no altera contenido | PASS | SHA-256 lógico excluyendo solo presentación/revisión/updatedAt, en aplicación y UI. |
| 4 | Simple intacta | PASS | 12 tests F7, dos UI, siete PDF y comparación con referencia anterior a F8. |
| 5 | Lateral de una página | PASS | minimal, small, medium y english-no-photo; inspector PDF.js/PDFium. |
| 6 | Lateral multipágina | PASS | custom 3, skills 5, languages 4, large 8 y oversized 7 páginas. |
| 7 | Foto | PASS | PNG recortado real desde asset F3; SHA-256/bytes conservados al importar y reabrir. |
| 8 | Habilidades/grupos | PASS | 82 habilidades/dos grupos en corpus y ciclo portable; comparación completa, no solo cantidades. |
| 9 | Idiomas | PASS | Maternos sin C2 y cinco CEFR independientes; ciclo con Listening B1 y otros cuatro null. |
| 10 | URL extensa | PASS | URL de más de 500 caracteres, anotaciones activas y rectángulos dentro de márgenes. |
| 11 | ES/EN/RO | PASS | Glifos extraídos por PDF.js/PDFium/Poppler; etiquetas EN y Ongoing sin traducir nombres. |
| 12 | Sin overflow | PASS | Medición DOM antes de imprimir y cajas de texto/anotaciones del PDF final. |
| 13 | Sin solapar columnas | PASS | Límites separados por gutter; capturas de páginas iniciales/intermedias/finales. |
| 14 | Lectura razonable | PASS | Items PDF.js por columna/página, Poppler raw/layout y PDFium; límites geométricos documentados. |
| 15 | Enlaces activos | PASS | URI de enlaces cortos/largos/enriquecidos y mailto; regresión F7 e inspección de anotaciones. |
| 16 | Bytes preview/export Simple | PASS | SHA-256 de getData() y archivo realmente escrito, también en paquete Linux. |
| 17 | Bytes preview/export Lateral | PASS | Misma prueba UI F8; cambio de zoom/ancho no regenera el archivo. |
| 18 | Generación antigua descartada | PASS | Regresión F7: final antiguo ignorando abort, revisión nueva y escrituras durante render. |
| 19 | ExportRecord durable | PASS | Siete tests F8 de recibos/migración/fallos; reapertura SQLite y registro UI tras reinicio. |
| 20 | PDF → biblioteca vacía | PASS | Revisión/cancelación/confirmación, nueva instancia A/B y proyección exactamente igual para ambas plantillas. |
| 21 | .cvproj → biblioteca vacía | PASS | Proyecto completo en C, comparación de todos los campos normalizando solo IDs, historia y cada blob. |
| 22 | Foto sobrevive ciclo | PASS | Asset normalizado en PDF; original con metadato privado conservado únicamente en proyecto completo. |
| 23 | Orden sobrevive ciclo | PASS | Comparación de proyección y órdenes de secciones, entradas, dos grupos y tres personalizadas. |
| 24 | Visibilidad según política | PASS | PDF reconstruye solo incluidos; .cvproj recupera ocultos/valores/inclusión originales. |
| 25 | Presentación sobrevive | PASS | Plantilla/versión, densidad, acento, numeración, guía y fechas representadas; detalles del tope de precisión en PORTABLE_EXPORT. |
| 26 | Sin sección oculta | PASS | PRIVATE_HIDDEN_SECTION ausente en payload completo extraído. |
| 27 | Sin entrada oculta | PASS | PRIVATE_HIDDEN_ENTRY ausente, conservado en .cvproj. |
| 28 | Sin historia | PASS | Checkpoint PRIVATE_HISTORY_NAME recuperable solo desde proyecto/biblioteca. |
| 29 | Sin borrador | PASS | PRIVATE_DRAFT permanece recuperable en A, ausente del PDF. |
| 30 | Sin perfil/otros CV | PASS | PRIVATE_PROFILE_ONLY/PRIVATE_OTHER_CV ausentes; B no crea perfil ni otros CV. |
| 31 | Sin procedencia/no mapeados/fuentes | PASS | Centinelas, bytes/hash de PDF fuente sintético y metadatos originales excluidos; .cvproj sí conserva el asset. |
| 32 | Sin variantes no mostradas | PASS | Traducción ES visible, original EN y alternativa RO privados fuera; no se inventa aprobación al importar. |
| 33 | Offline completo | PASS | Namespace de red: solo loopback CDP, sin rutas externas y ENETUNREACH; cero solicitudes remotas. |

Adicionalmente, retirar el adjunto de small-Simple y small-Lateral deja un PDF
válido, sin adjuntos y detectable como normal. PDF.js conserva texto/geometría,
enlaces y páginas; el raster PNG de Poppler tiene SHA-256 idéntico al original.
Versiones futuras de plantilla/contendor/payload, hashes corruptos y formatos no
compatibles producen errores controlados, sin crear medio CV ni reescribir datos.

## Tests, regresiones y paquete

| Bloque | Resultado |
| --- | --- |
| F1 | PASS 3/3; paquete F1 existente crea/reabre/PDF sin red. |
| F2 | PASS 30/30. |
| F3 | PASS 39/39; SQLite actual v3, migraciones/rollback/integridad. |
| F4 | PASS 13/13 + 4 UI. |
| F5 | PASS 32/32 + 5 UI. |
| F6 | PASS 25/25 + 4 UI; Europass sintético y formatos propios. |
| F7 | PASS 12/12 + 2 UI y siete PDF. |
| F8 | PASS 12/12 + 3 UI; 26 PDF/corpus, ciclos y privacidad reales. |
| Pulido visual | PASS 5 UI; incluye 1180×880, 1366×768, 1440×900 y 820×700. |
| TypeScript/build | PASS en bloques y cierre. |
| Linux | PASS, tres flujos UI del ejecutable real sin red, recursos/worker y reapertura. |

**163 tests raíz F2–F8 + 3 F1 + 23 UI = 189 pruebas distintas.** Las repeticiones
sobre paquete/offline no se cuentan como tests nuevos; corpus PDF y lectores
independientes se registran aparte. La suite UI completa final pasa 23/23 sin
skips, flaky ni errores; 50 informes de errores/solicitudes vacíos. El paquete
repite 3/3. Sus 90 archivos de producción/renderer/recursos coinciden con la última
compilación; app.asar permanece igual antes/después de usar la aplicación.

El ejecutable vive en `out/f8/linux-unpacked/cvforge`; el output f7 sigue siendo la
configuración histórica por defecto y se usa override explícito para F8. No se
valida AppImage/instalador ni otras plataformas. Los flags de automatización son
del harness, no del lanzamiento normal. Se controla el resultado del diálogo
nativo, escribiendo y verificando archivos reales; no se amplía la automatización
inestable de popups/portales ya documentada en F7.

## Privacidad y proyecto completo

`tests/f8-cycle-electron.ts` crea una biblioteca A con perfil y otro CV, ocultos,
valores personales excluidos, términos C con aprobación visible ES y variante RO,
original EN privado, checkpoint, borrador recuperable, procedencia/no mapeado y
un PDF fuente sintético válido como asset source. El original de foto contiene
metadato privado y píxeles fuera del recorte. Solo se exporta el confirmado.

Se extrae el único adjunto de cada PDF generado y se guarda su JSON completo.
Se compara exactamente con ExportProjection y se buscan 15 marcadores textuales
privados más el hash del PDF fuente, tanto en JSON como en bytes de imágenes.
Ninguno aparece. Solo hay PNG normalizado/foto usada, campos/variantes impresos,
orden, fechas representadas, idioma y configuración efectiva/template v1.

B revisa, cancela sin cambios, vuelve a revisar/confirma y reabre el PDF como un
único CV independiente. Proyección completa idéntica, assets y cinco CEFR iguales,
dos grupos y tres personalizadas. No recupera originales/aprobaciones privadas.
El ciclo Simple usa documentLocale es; Lateral usa en, manteniendo la variante ES
expresamente seleccionada y los nombres oficiales; el renderer no traduce.

C importa `.cvproj` de A y reabre: CV completo igual con IDs nuevos, ocultos,
memoria sensible, original, importación privada, foto original, fuentes, cada blob
y checkpoints. A conserva el borrador pendiente y su recibo durable tras reabrir.
Las tres bibliotecas pasan integrity_check y foreign_key_check para ambas plantillas.
Las copias de workspace permanecen cubiertas por F3/F6. Recibos operativos no se
incorporan al contrato portable v1; sí al backup SQLite.

## Lectores y revisión visual

- PDF.js 6.4.299: texto, capas/selección, páginas, estructura, enlaces y payload.
- Poppler: extracción raw/layout, cajas y rasterizados; PDF sin payload visualmente idéntico.
- PDFium 156.0.8076.0 mediante pypdfium2 5.14.0: 26/26, texto y marcadores completos.
- Google Chrome/PDFium Linux 153.0.8010.52: abre small (1), custom (3), skills (5),
  large (8), comprueba páginas/navegación a última y captura primera/última.

pypdfium2 es herramienta diagnóstica aislada en `/tmp/cvforge-f8/pdfium-tools`, no
dependencia ni recurso de la aplicación. Su descarga inicial no procesa CV ni
introduce una necesidad de red para el producto. Lectores/texto/generación y las
bibliotecas del corpus funcionan con recursos instalados localmente.

Se inspeccionaron proporciones, foto, jerarquía, alineación, espacio y continuidad:
small de una página, custom de tres, skills cargado y páginas intermedias de large/
oversized. Sin cortes ni columnas superpuestas en el corpus. La lateral puede
quedar vacía en continuaciones y se mantiene el ancho del cuerpo. Esto produce
espacio libre, especialmente al mantener juntas entradas cortas; no se oculta
contenido para forzar menos páginas. Galería local con imágenes ampliables.

Poppler layout conserva columnas por espacios y puede mezclar bloques al aplanarlo
por filas. No se equipara a lectura semántica. PDF.js/PDFium/raw permiten seguir
columnas por página; PDFium puede anteponer el contador marginal. No se declara
PDF/UA ni accesibilidad universal por tener etiquetas.

## Rendimiento inicial

Muestras únicas de la pasada offline, mismo equipo/recursos, sin p95 F9. El driver
mide desde snapshot/proyección preparados hasta PDF final; el servicio UI incluye
captura de biblioteca, imágenes, PDF, IPC, debounce y primera página PDF.js.
No se comparan tiempos fríos/calientes como un benchmark concluyente.

| Caso | Plantilla | Páginas | Bytes | Snapshot → PDF |
| --- | --- | ---: | ---: | ---: |
| Pequeño | Simple | 1 | 35 362 | 506 ms |
| Pequeño | Lateral | 1 | 35 629 | 541 ms |
| 48 párrafos | Simple | 6 | 69 364 | 578 ms |
| 48 párrafos | Lateral | 8 | 75 393 | 683 ms |

| UI, varias personalizadas | Páginas | Bytes | Snapshot → PDF | Hasta preview |
| --- | ---: | ---: | ---: | ---: |
| Simple | 3 | 59 869 | 830 ms | 1 536 ms |
| Lateral | 3 | 60 864 | 839 ms | 1 555 ms |

El corpus F8 usa párrafos distintos de los del driver F7; el large histórico F7
sigue ocupando cinco páginas y pasa su comparación de bytes. Las seis páginas
de Simple aquí pertenecen a otro texto, no a un cambio de ese fixture.

No se observa una regresión enorme del renderer en estas muestras. Lateral usa
más páginas en texto largo por su columna principal más estrecha. No se promete
el p95 ni escalabilidad de biblioteca de 100 CV. Zoom es estado visual y no cambia
los bytes ni el contenido del CV.

## Evidencia y reproducción

Todo el material es sintético y queda fuera de Git, bajo `/tmp/cvforge-f8`:

- `baseline`: base exacta, tests/UI/PDF antes de programar.
- `closure-tests.log`, `closure-typecheck.log`: última compilación y 163/163.
- `final-f1/offline-proof.json`: F1 3/3 sin red, creación/reapertura.
- `final-offline`: tests/UI 23/23, 24 casos de primera matriz final, siete PDF F7,
  identidad de Simple y network-proof.json; sin interfaces externas ni rutas.
- `closure-private`: ampliación a 26 casos (EN sin foto añadido), 16 centinelas,
  dos ciclos reforzados sin red, PDF/payload extraídos, `.cvproj`, bibliotecas A/B/C,
  metrics.json, inspection.json, pdfium-inspection.json, portable-cycles.json y
  external-reader.json/capturas. Los ciclos comparan valores completos, no cantidades solamente.
- `visual/index.html`: galería Poppler de documentos de una/tres páginas y cargados.
- `final-package`: 3/3 del ejecutable Linux offline, proof.json y source-parity.json.

```sh
npm test
npm run typecheck
npm run validate:f8:offline
CVFORGE_F8_OUTPUT=/tmp/cvforge-f8/render npm run validate:f8:pdf
/tmp/cvforge-f8/pdfium-tools/bin/python scripts/f8-pdfium-check.py /tmp/cvforge-f8/render
CVFORGE_F8_OUTPUT=/tmp/cvforge-f8/render npm run validate:f8:reader
npm run package:linux -- --config.directories.output=out/f8
npm run validate:f8:package
```

Electron, namespaces y lectores gráficos requieren permisos del entorno. El
comparador de Simple espera la referencia generada antes de F8 en `baseline/pdf`;
no altera el PDF. Entre renders independientes solo varían CreationDate/ModDate;
los siete casos conservan todos los demás bytes. La igualdad SHA-256 completa
se prueba entre preview y archivo para una misma generación.

## Incidencias y límites

Se corrigió en Lateral el caso mínimo solo con nombre, la conservación de entradas
cortas y la continuidad de ordinales de lista. Los primeros intentos detectaron
errores de fixtures/harness: IDs de enlace duplicados al clonar, reloj sintético
mezclado con reloj real, inicialización de una biblioteca ya existente y orden de
mapas UUID al comparar copias. Se corrigieron sin relajar la comparación de datos.
Un error de limpieza ocultó temporalmente el diagnóstico de inicialización; se
conservan esos logs y las pasadas posteriores completas. El selector recibió un
nombre accesible explícito, verificado por UI.

Persisten las deudas anteriores de Vite/VA-API y herramientas de desarrollo;
no se actualizan dependencias ni se silencian avisos. No hay fallo arquitectónico
abierto de los criterios F8 ni fuga detectada. Quedan fuera PDF/UA completo,
reconciliación de archivos sin recibo tras crash, diseño óptimo de paginación,
aceptación p95/100 CV de F9, automatización nativa exhaustiva y otras plataformas.
El proveedor automático de traducción continúa pendiente; el contrato y el flujo
manual/offline F5 no cambian. No se añaden diseños, OCR, PDF genérico ni áreas V1.

Los commits separados de composición, portabilidad/registro, pruebas/lectores y
documentación se enumeran con `git log main..HEAD --oneline`. La rama espera la
aprobación del usuario antes de fusionarse y antes de comenzar F9.
