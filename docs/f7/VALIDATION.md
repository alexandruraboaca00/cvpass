# F7 — Validación de Simple y preview

18 de octubre de 2026. Rama `f7-simple-template-preview`, base main/origin/main
`7230814`. **F7 = APROBADA** técnicamente y por el usuario; integrada en main mediante merge commit. No se inicia F8. No se declara terminado el MVP.

## Prerrequisitos

Los siete documentos actuales solicitados se leyeron completos. Main estaba limpio
y sincronizado antes de crear la rama. La base pasó F1 3/3, F2–F6 139/139,
TypeScript/build y los 13 flujos de UI anteriores sin red. Evidencia inicial:
`/tmp/cvforge-f7-baseline`.

## Matriz de aceptación

PASS se refiere al corpus sintético ejecutado, no a una garantía de maquetación
óptima para cualquier documento posible. Las pruebas y el inspector se versionan;
PDF, capturas y bibliotecas temporales se conservan únicamente fuera de Git.

| # | Criterio | Estado | Evidencia |
| --- | --- | --- | --- |
| 1 | CV pequeño de una página | PASS | Driver Chromium `small.pdf`, una página; inspector y lector externo. |
| 2 | CV de varias páginas | PASS | `large.pdf`, 48 párrafos y ocho áreas; cinco páginas tras corregir encadenamiento. |
| 3 | 48 párrafos completos | PASS | Un PARAGRAPH_01…48 y END_01…48 por párrafo, ordenados en PDF.js y Poppler. |
| 4 | Título unido al primer contenido | PASS | Reglas locales de corte, entradas cortas unidas, inspector por página y revisión visual. Se evita propagar break-after desde el último hijo. |
| 5 | Contenido dentro de márgenes | PASS | Medición DOM previa; cajas de texto y anotaciones dentro de límites, revisión Poppler/PDFium. Numeración en margen reservada. |
| 6 | URL extensa sin desbordamiento | PASS | URL de más de 400 caracteres, varias líneas en página 4, destino completo conservado. |
| 7 | Enlaces activos | PASS | Anotaciones URI de URL corta/larga, enlace enriquecido y mailto; rectángulos dentro del área útil. |
| 8 | Foto | PASS | Recorte real de imagen 4×2 roja/azul a 2×2 azul; bitmap sin píxeles rojos ni metadato privado; imagen visible proporcionada. |
| 9 | Listas y enriquecido | PASS | Listas ordenadas 1/2 y viñetas, negrita/cursiva, salto explícito y enlace; HTML escapado desde AST. |
| 10 | ES/EN/RO | PASS | á é í ó ú ñ ¿ ¡ ă â î ș ț en extracción y vista; solo fuentes Liberation incrustadas con ToUnicode. |
| 11 | Sección oculta | PASS | `hidden.pdf` excluye proyectos; el CV de origen conserva los datos. |
| 12 | Entrada oculta | PASS | Experiencia excluida ausente del PDF/payload; no se modifica el CV al paginar. |
| 13 | Sección vacía | PASS | Personalizada sintética vacía con marcador no genera bloque ni dato exportado. |
| 14 | Orden manual | PASS | Proyectos → personalizada → educación → experiencia → habilidades → idiomas → certificaciones en lectura real del PDF. |
| 15 | Original/traducción/ambos | PASS | PDFs separados para original y traducción, y caso ambas; extracción/payload solo contienen las variantes seleccionadas. |
| 16 | Etiquetas según documentLocale | PASS | Caso EN con Work experience/Ongoing; fechas mantienen precisión; la interfaz es independiente. |
| 17 | Contenido B intacto | PASS | Instituto/Compañía Sintéticos y TypeScript permanecen literales; render no llama al proveedor. |
| 18 | Ajustes sin modificar contenido | PASS | Comparación profunda antes/después excluyendo presentación/revisión/updatedAt, SQLite y UI. |
| 19 | Preview del PDF exportable | PASS | PDF.js consume bytes finales con payload, sin una preview HTML paralela. |
| 20 | Hash preview/export | PASS | SHA-256 de getData() de PDF.js y archivo elegido en diálogo nativo coinciden; se prueba también cancelación y escritura controlada. |
| 21 | Generación obsoleta descartada | PASS | Promesas controladas: la antigua termina después de la nueva e ignora abort; no puede publicar. Escritura real de CV durante generación también termina. |
| 22 | Error sin cambiar CV | PASS | Error del adaptador conserva LibraryRecord completo; reintento válido. UI informa plantilla anterior incompatible y permite seleccionar Simple. |
| 23 | Configuración tras reapertura | PASS | Dos procesos Electron reales, densidad espaciosa/numeración conservadas; contenido y foto preservados; round-trip cvproj con fuentes. |
| 24 | Offline | PASS | Repetición final: 15 UI + 151 tests + 7 PDF; solo loopback, sin ruta externa, ENETUNREACH y cero peticiones HTTP/HTTPS. |

## Tests y regresiones

| Fase/comprobación | Resultado más reciente |
| --- | --- |
| F1 | PASS 3/3, paquete F1 existente crea/reabre sin red; no se modifica su código. |
| F2 | PASS 30/30. |
| F3 | PASS 39/39. |
| F4 | PASS 13/13 + 4 flujos UI offline. |
| F5 | PASS 32/32 + 5 flujos UI offline. |
| F6 | PASS 25/25 + 4 flujos UI offline. |
| F7 | PASS 12/12 + 2 flujos UI y 7 casos PDF finales; UI repetida sobre el paquete Linux. |
| TypeScript | PASS, `npm run typecheck`. |
| Build | PASS, `npm run build`. |
| Paquete Linux | PASS, paquete final Linux x64 en namespace sin red, recursos/worker y cierre/reapertura. |

Los 151 tests raíz incluyen F2–F7. F1 añade tres y la UI quince: **169 pruebas
distintas**, sin contar como nuevas sus repeticiones sobre el paquete/offline ni
los siete casos del driver PDF. `.cvproj`, payload propio, Europass sintético,
biblioteca, revisiones, borradores, assets e independencia lingüística permanecen
cubiertos. No se han usado los PDF privados F6 como fixtures ni para esta fase.

Ejecuciones locales: `npm test`, `npm run typecheck`, `npm run build`,
`npm run validate:f7:pdf`, `npm run validate:f7:reader`,
`npm run validate:f7:offline`, `npm run package:linux`,
`npm run validate:f7:package`. Para F1 se usó `offline-check.cjs` existente dentro
de `unshare --user --map-current-user --net`, con salida sintética nueva.

## Evidencia local

- `/tmp/cvforge-f7-final-tests.log`: 151/151 tras corregir cortes y enlaces.
- `/tmp/cvforge-f7-final-typecheck.log`, `/tmp/cvforge-f7-final-build.log` y `/tmp/cvforge-f7-final-package.log`.
- `/tmp/cvforge-f7-f1-regression/offline-proof.json`: creación/reapertura F1 y 3/3 sin interfaces/rutas externas; `/tmp/cvforge-f7-f1-offline.log`.
- `/tmp/cvforge-f7-render/`: siete PDF, proyecciones sintéticas, metrics.json, inspection.json, texto y capturas Poppler/PDFium.
- `/tmp/cvforge-f7-offline-results/`: informes por fase, peticiones/errores de renderer y network-proof.json; log `/tmp/cvforge-f7-offline.log`.
- `/tmp/cvforge-f7-package-check/`: inventario/digest de app.asar, UI del ejecutable real, métricas y comprobación de que el paquete no se modifica al usarlo; log `/tmp/cvforge-f7-package-acceptance.log`.

La aceptación GTK adicional anterior a los últimos ajustes de cortes/enlaces queda
en `/tmp/cvforge-f7-native-acceptance-proof.json`; la implementación de diálogo/
escritura no cambió. La suite final usa el selector controlado y verifica los bytes
actuales del paquete final. No se presenta la automatización nativa como estable.

Estos temporales no son archivos de producto ni deben añadirse al repositorio.

## Offline y paquete

`f7-offline-check.mjs` se relanza con `unshare --user --map-current-user
--keep-caps --net`, conservando el UID del usuario y aislando la red. Solo
activa loopback para CDP; comprueba que no hay otras interfaces ni rutas y que una
conexión TCP externa falla ENETUNREACH. Ejecuta F4–F7 UI, los 151 tests reales y
el driver/inspector PDF. Los harnesses comprueban cero peticiones HTTP/HTTPS y
cero errores de renderer, sin usar fixtures personales.

La aceptación del ejecutable Linux tiene su propio namespace equivalente,
conservando el UID del usuario mediante --map-current-user/--keep-caps. Usa
`out/f7/linux-unpacked/cvforge`, no `electron .`; verifica recursos/licencias,
worker PDF.js y ausencia del TS/tests/investigación de la aplicación y documentos privados. Prueba
creación, render, resultado del selector controlado, escritura real con igualdad de bytes y cierre/reapertura. El SHA-256
de app.asar se compara antes/después; los 90 archivos de runtime/renderer/recursos
se comparan también con la última compilación (`source-parity.json`), todos iguales. El estado de biblioteca vive en userData
temporal externo, eliminado al terminar.

El diálogo real se valida con GTK/X11 explícito y destino sintético preseleccionado
por el harness. XTest solo pulsa Guardar sobre su ventana transient, esperando a
que sea operativa. Los pases reales GTK en desarrollo y paquete guardaron bytes con hash coincidente.
La automatización de ventanas nativas resultó intermitente según portal/compositor;
se mantiene como aceptación adicional opcional, activable con
`CVFORGE_F7_NATIVE_DIALOG=1`, fuera de la suite repetible. Esta última controla
devolución/cancelación del selector y comprueba contrato, opciones, escritura
real, digest y reapertura. No se ha cambiado el diálogo de la aplicación para
acomodar el test. No se declara cobertura exhaustiva de todos los
portales/compositores Linux.

## Lector externo y accesibilidad

Google Chrome/PDFium **153.0.8010.52**, separado de Electron/Chromium
**152.0.7977.149** y del PDF.js integrado. Abre ambos PDF, verifica cantidad de
páginas y navega a la última. Se inspeccionan capturas y rasterizados independientes
Poppler: foto, listas, URL extensa y glifos. La última repetición externa se hace
sobre los bytes de la composición final.

PDF.js y Poppler extraen el texto completo en orden de una columna. Hay etiquetas,
árbol de estructura por página, título visible, Lang ES/EN, texto seleccionable y
anotaciones de enlaces, sin JavaScript. No se observan diferencias de contenido,
paginación o recorte entre lectores; sí el suavizado habitual de texto al cambiar
rasterizador/zoom. No se declara cumplimiento PDF/UA ni auditoría completa de
lectores de pantalla.

## Rendimiento inicial

Muestras del paquete final, sin red, en preview-metrics.json. El tiempo hasta
preview incluye debounce de 400 ms, snapshot, PDF, IPC y primera página PDF.js.
Son muestras únicas iniciales, con otras verificaciones en curso, sin p95 ni
umbral de aceptación F9. No se usan para afirmar que un CV grande sea más rápido.

| Documento UI sintético | Páginas | Bytes PDF | Snapshot → PDF | Hasta preview |
| --- | ---: | ---: | ---: | ---: |
| Pequeño, nombre visible | 1 | 11 152 | 1 424 ms | 2 226 ms |
| Grande, 48 párrafos largos + áreas MVP | 6 | 65 346 | 1 335 ms | 2 308 ms |

El corpus de inspección de glifos/listas/URL tiene párrafos de otro tamaño: su
caso pequeño ocupa 1 página/43 113 bytes y el de 48 párrafos 5 páginas/93 107 bytes.
Sus medidas snapshot → PDF se registran aparte en metrics.json (3 022/1 219 ms en
la muestra de referencia, primer render frío frente al siguiente caliente).

## Privacidad y recursos

La proyección extraída del adjunto coincide exactamente con la proyección visible
esperada en los siete casos. No contiene los marcadores de perfil/otro CV/historial
ni el metadato original de foto. `translation-only` no lleva el original; `year-only`
no lleva día/mes privados. El recorte solo conserva píxeles azules, no el original
rojo/azul. Los identificadores de snapshot/CV y nombres privados de biblioteca
permanecen fuera del payload.

| Recurso/dependencia relevante | Versión | Licencia | Uso |
| --- | --- | --- | --- |
| Liberation Sans, cuatro variantes | 2.1.5 | SIL OFL 1.1 | Tipografía local de todo el PDF, incluidos contadores. |
| pdfjs-dist | 6.4.299 | Apache-2.0 | Preview/worker y lectura técnica; ya utilizado previamente. |
| pdf-lib | 1.17.1 | MIT | Posprocesado/adjunto visible en worker; pasa a dependencia productiva. |
| Electron | 44.7.2 | MIT y avisos de terceros de Chromium | Motor local ya validado; licencias del runtime empaquetadas. |
| electron-builder | 26.15.3 | MIT | Herramienta de desarrollo para paquete Linux, versión ya utilizada en F1. |

`npm audit --omit=dev` devuelve cero vulnerabilidades productivas. La instalación
de electron-builder informa ocho moderadas de desarrollo y avisos de paquetes
transitivos obsoletos; no se aplica una actualización forzada ajena a esta fase.
No se incorporan recursos, CSS, geometría, iconos o fuentes Europass.

## Problemas corregidos y deuda

Se corrigieron la foto pequeña por tamaño intrínseco del fixture, la carga de
fuentes no utilizadas en un CV mínimo, una fuente del sistema en el pie y el
encadenamiento de bloques al aplicar break-after al último metadato de una entrada.
La corrección de cortes reduce seis páginas a cinco en el mismo corpus sin omisiones.
También se normalizan solo URLs con protocolo ya confirmado al comparar destinos
de enlaces: una barra final o la normalización de host/puerto de Chromium no debe
hacer rechazar un enlace válido. No se añade HTTP a valores sin protocolo.
La automatización del diálogo GTK nativo es una limitación del harness: no debe
confundirse un selector que espera interacción con un fallo de escritura. Queda
fuera de la suite repetible, conservando sus pases reales y la incidencia. Un intento
Wayland del harness anterior agotó el clic de Crear CV, aunque el log mostró una
única creación terminada y cierre del modal, sin errores de renderer. La ejecución
final fija X11 solo para automatización; el lanzamiento normal no se modifica.
Se conserva el intento en `/tmp/cvforge-f7-offline-wayland-attempt.log` y el log de
creación en `/tmp/cvforge-f7-wayland-create.log`, sin ocultar la incidencia.

Persisten avisos de Vite/VA-API; hubo diagnósticos D-Bus en intentos de aislamiento anteriores;
no se ocultan y no provocan errores de renderer ni pérdida de contenido. La
composición prioriza integridad sobre ajuste óptimo; son posibles espacios libres
al mantener una entrada corta unida. Faltan PDF/UA, otros alfabetos, p95 F9 y
registro durable de exportaciones/ciclo completo F8. El motor de traducción y
otras deudas anteriores permanecen fuera del alcance.


## Commits y estado

Se mantienen commits separados para recursos/snapshot, motor Simple, numeración
con fuente local, visor/exportación, correcciones de cortes/enlaces y validación
offline/paquete. `git log main..HEAD --oneline` enumera el trabajo completo. El
commit de cierre incorpora este informe y el estado real del roadmap. La aprobación posterior del usuario autoriza el merge de F7 en main, conservando
el límite de fase con dos padres. La comprobación previa al merge pasó F1 3/3,
F2–F7 151/151, los 15 flujos UI y 7 casos PDF sin red, TypeScript/build,
empaquetado y dos flujos del ejecutable Linux sin red; PDFium abrió los
documentos pequeño y multipágina. Evidencia local: `/tmp/cvforge-f7-merge/pre`. No hay trabajo F8 ni archivos privados versionados.
