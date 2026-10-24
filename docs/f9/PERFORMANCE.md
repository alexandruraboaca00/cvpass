# F9 — Rendimiento del producto

La aceptación usa los objetivos NF-05 anteriores al benchmark. No se cambian
umbrales para convertir una medición lenta en PASS. Resultado final: **FAIL NF-05** en Confirmar; las demás métricas con
presupuesto previo cumplen en este equipo. Se completaron las 20 repeticiones.

## Método fijado

`scripts/f9-performance.mjs`, ejecutado solo, tras build/empaquetado y dentro de
`unshare --user --map-current-user --keep-caps --net`, con loopback levantado
exclusivamente para CDP de Playwright. Después de preparar la interfaz, setpriv
retira las capacidades; controlador y main verifican CapEff=0. La medición final
usa Xvfb/Openbox, X11, render software y diagnóstico pw:browser conservado. AppImage con sandbox Chromium activo,
`APPIMAGE_EXTRACT_AND_RUN=1` y AppImageLauncher desactivado para conservar la ruta
del artefacto. No hay procesos de tests/build concurrentes.

Corpus determinista: `tests/f9-fixtures.ts`, IDs/reloj fijos y 100 CV que alternan
pequeño, medio con ocho áreas/foto, largo de 48 párrafos, 42 habilidades/dos grupos,
varios idiomas con niveles parciales y varias secciones personalizadas. El proyecto
semilla tiene hash en `results.json`. No contiene información privada.

SQLite/WAL viven en SSD ext4, en un directorio F9 fuera del checkout. `/tmp` es
tmpfs en este equipo y solo almacena evidencia; no se usa para simular el disco
del usuario en la medición. Cada repetición copia una biblioteca cerrada a una
carpeta nueva, inicia otro proceso/perfil y empieza con 100 CV. La importación
añade un CV; las previews/exportaciones posteriores tienen 101.

- Arranque: proceso nuevo → biblioteca con 100 tarjetas renderizada. Incluye
  extracción del runtime AppImage; no es una medición solo de `BrowserWindow`.
  No se vacía la caché del SO: «frío» significa proceso/perfil nuevos.
- Biblioteca: respuesta IPC de listar; el arranque mide además su representación.
- Abrir CV: selección GUI del CV medio → apertura confirmada por IPC.
- Confirmar: petición IPC durable tras flush del borrador, sin tiempo de tecleo
  ni espera humana. No se usa un mock; espera el commit SQLite FULL/WAL.
- Importar: PDF estructurado sintético de tres páginas, análisis y confirmación
  medidos por separado y sumados. Excluye el tiempo humano de revisión.
- Preview: PDF.js realmente listo, no solo PDF generado. Se registran los tiempos
  con y sin los 400 ms de debounce ya definidos; el tiempo sin debounce se compara con
  NF-05. Se comprueba que el CV medio tiene como máximo tres páginas.
- Exportar: bytes ya previsualizados → escritura real fsync/rename → ExportRecord
  durable; diálogo nativo con destino controlado, sin tiempo de selección humana.
  Esta métrica nueva no tenía umbral previo.
- Exportación larga: 192 párrafos y al menos diez páginas, generación completa
  más escritura/recibo; 20 repeticiones por plantilla con revisión fija. Se compara
  con los 5 s previos, sin reutilizar una generación ya lista.
- Tecleo: evento input → siguiente requestAnimationFrame con el campo actualizado,
  33 muestras; no mide el tiempo humano entre pulsaciones.

El p95 es nearest-rank `ceil(0,95 × n)`, sin eliminar valores extremos. Se conservan
todas las muestras y los mínimos/máximos. Veinte muestras son aceptación inicial,
no una promesa estadística para todos los equipos.


## Resultado final — 24/10/2026

Equipo: Intel Core i5-13420H, 12 CPU lógicas, 16 450 170 880 bytes de RAM
reportada por el SO (15,32 GiB), SSD NVMe WD PC SN740/ext4, Arch Linux, kernel
7.2.11-arch1-1. Runtime: Electron 44.7.2, Node 24.21.0, Chromium
152.0.7977.149; driver Node 26.12.0. Viewport medido 1180×860, DPR 1,
Xvfb/Openbox y render software. No se extrapolan estas cifras al equipo propuesto
de 4 núcleos/8 GiB ni a otras distribuciones. Controlador y main con CapEff=0,
solo loopback y cero rutas, sandbox Chromium activo.

Artefacto: SHA-256 de RELEASE; `results.json` registra además el hash y el commit
`d69b7b7` del controlador. Todas las instancias de esta repetición terminan con
código 0. Se conserva el diagnóstico pw:browser; no hay tests/builds concurrentes.

| Operación | n | p95 ms | Objetivo ms | Resultado |
| --- | ---: | ---: | ---: | --- |
| Arranque AppImage → 100 CV visibles | 20 | 2594.1 | 3000 | PASS |
| Listar biblioteca (IPC) | 20 | 136.8 | — | Medido, sin umbral previo |
| Seleccionar/abrir CV medio | 20 | 2173.0 | — | Medido, sin umbral previo |
| Confirmar durable | 20 | 471.1 | 300 | FAIL |
| Importar: análisis | 20 | 649.1 | — | Medido, sin umbral previo |
| Importar: confirmar | 20 | 510.3 | — | Medido, sin umbral previo |
| Importar: total técnico | 20 | 1163.6 | 3000 | PASS |
| Preview Simple tras debounce | 20 | 1163.0 | 2000 | PASS |
| Preview Lateral tras debounce | 20 | 1091.0 | 2000 | PASS |
| Preview Simple incluido debounce | 20 | 1563.0 | — | Medido, sin umbral previo |
| Preview Lateral incluido debounce | 20 | 1491.0 | — | Medido, sin umbral previo |
| Exportar Simple desde preview | 20 | 78.6 | — | Medido, sin umbral previo |
| Exportar Lateral desde preview | 20 | 60.4 | — | Medido, sin umbral previo |
| Generar/exportar Simple, 19 páginas | 20 | 1063.4 | 5000 | PASS |
| Generar/exportar Lateral, 22 páginas | 20 | 1771.1 | 5000 | PASS |
| Input → siguiente frame | 33 | 16.0 | 100 | PASS |

El documento medio genera dos páginas Simple (48 090–48 316 bytes) y una Lateral
(47 931–48 151 bytes). El largo genera siempre 19 páginas Simple/117 647 bytes
y 22 páginas Lateral/130 220 bytes. Cada exportación verifica el SHA-256 exacto
de la generación previsualizada o recién generada; ningún hash difiere.

Confirmar excede en aproximadamente 171 ms los 300 ms. No se resta coste de
escritura ni se sustituye por una actualización optimista. La confirmación medida
excluye flush ya completado y render React: es un límite inferior del clic GUI,
por lo que tampoco puede afirmarse que ese recorrido cumpla 300 ms.
**AC-09 = FAIL**, aunque arranque/offline y los demás presupuestos pasen.

Las métricas nuevas sin umbral no reciben PASS numérico: listar/exportar desde
preview son ágiles en este equipo; abrir CV medio p95 2,17 s tiene demora perceptible
y merece optimización, sin inventar ahora una frontera de aceptación. La biblioteca
de 100 CV funciona, pero esto no es una declaración de rapidez definitiva.

Una pasada anterior del mismo cierre se interrumpió al cerrarse la segunda
instancia; no se utilizó para p95. La causa no quedó establecida y no se afirma
una corrección de crash sin evidencia. La repetición nueva conserva logs de salida
y completa 20/20 sin reproducir el cierre. El primer benchmark del día 23 y las
pruebas exploratorias quedan fuera de la tabla final: no exigían aún el mismo
aislamiento sin capacidades ni el mismo entorno de pantalla.

## Investigación y cambios

La prueba inicial con 100 CV detectó validación/reconstrucción repetida de toda la
biblioteca en lecturas ordinarias y en el tránsito main/worker. Se añadieron caches
de snapshots ya validados con `generation` y `PRAGMA data_version`, copia aislada
por consumidor y revalidación ante escritura externa. Los commits siguen validando
la entrada completa y manteniendo transacciones/restricciones; un fallo no publica
un cache nuevo. Tests cubren mutación del llamante y corrupción externa incluso
sin incrementar generación.

Se evita además volver a guardar exactamente el mismo formulario justo antes de
Confirmar y repetir validaciones puras que ya cubre el parser de proyecto. No se
reduce synchronous=FULL ni se desactiva integridad para mejorar cifras.

Las pruebas exploratorias de cinco repeticiones del ejecutable desempaquetado
mostraron una mejora de Confirmar de aproximadamente 880 a 651 ms p95, todavía por
encima de 300 ms. No se comparan esas cifras como si fueran la aceptación de la
AppImage: el target anterior era pequeño y el harness aún no exigía sandbox.
La aceptación final utiliza el CV medio, sandbox activo y el artefacto identificado
en [RELEASE](RELEASE.md).

La estrategia F3 todavía valida/escribe metadata global al confirmar. Cambiarla
por persistencia diferencial requiere revisar cuidadosamente los contratos y no
queda demostrada por las mejoras de cache. El p95 final de Confirmar falla y se registra como bloqueo, sin declarar
cumplido NF-05. La biblioteca de 100 CV es funcional pero la lista no tiene
buscador/virtualización; seleccionar elementos lejanos requiere desplazamiento.

## Evidencia

- `/tmp/cvforge-f9/performance-final-release/results.json`: equipo/versiones, corpus,
  muestras, p95, presupuestos y digest de cada PDF.
- `/tmp/cvforge-f9/performance-final-release.log`: progreso de las repeticiones.
- `100-cv-library.png`: biblioteca y documento medio durante la prueba.
- Los tests AppImage comprueban también seleccionar el CV número 100, confirmar,
  volver por teclado, reiniciar y conservar el resto.

Las métricas sin presupuesto previo quedan medidas; no se les asigna un PASS
contra límites inventados. Las muestras crudas siguen disponibles fuera de Git.


## Repetir la medición

Construir primero la AppImage. En un escritorio de pruebas, ejecutar el comando
con 20 repeticiones y un directorio de datos en SSD fuera del repositorio:

```sh
CVFORGE_F9_PERF_REPETITIONS=20 \
CVFORGE_F9_PERF_DATA=/ruta/SSD/cvforge-benchmark \
unshare --user --map-current-user --keep-caps --net sh -c \
'ip link set lo up && exec setpriv --bounding-set=-all --inh-caps=-all --ambient-caps=-all "$@"' \
cvforge-f9 node scripts/f9-performance.mjs
```

Para aislar el teclado se usa Xvfb con un gestor de ventanas y X11. La evidencia
local incluye `virtual-session.sh` y versiones de herramientas; la AppImage no
depende de ellas. El proceso devuelve 1 si algún presupuesto falla, después de
guardar todas las muestras. El runner puede completar todas las muestras y devolver 1 por un presupuesto
incumplido; eso es un FAIL de aceptación, no una aprobación del MVP.
