> **Estado vigente, decisión explícita del usuario del 25/10/2026: F9 = APROBADA técnicamente.**
> NF-05 startup pasa de su objetivo inicial ≤3000 a **≤3200 ms p95**, después de
> las mediciones y solo para el equipo/corpus/método F9 documentado. Confirmar
> conserva **≤300 ms**; ningún otro objetivo cambia. Las tres campañas startup
> 3075,6/2995,8/2935,0 y Confirmar 284,2/280,3/275,1 son PASS; offline sigue PASS.
> [Decisión, justificación, AC-01…AC-10 y evidencia](NF05_STARTUP_REVIEW.md).
> Se conserva el historial original de 3000 ms y sus FAIL, sin modificar muestras
> ni método. Deuda pendiente: 50 revisiones, Confirmar p95 316,6 ms por lecturas/
> copias globales, fuera del corpus oficial. Sin merge/push a main ni F10.

## Registro anterior a la revisión explícita, conservado

# F9 — Confirmar reproducible; cierre NO APROBADO

25/10/2026. **No merge, no push a main y F10 no iniciada.** Tres campañas
independientes completas, 20 procesos nuevos cada una, mismo binario/corpus/SSD
y runner congelado: Confirmar p95 **284,2 / 280,3 / 275,1 ms**, todas PASS ≤300.
Combinado 60: **283,0 ms p95**, solo informativo. No se eliminan muestras.

Arranque p95 **3075,6 / 2995,8 / 2935,0 ms**: A FAIL ≤3000. El control conjunto
no es estable y **F9 = NO APROBADA**. No se repite hasta obtener un resultado
favorable ni se realiza la cuarta aceptación prevista como si las tres pasaran.
Abrir CV C p95 **2100,6 ms**, informativo; no existe aceptación independiente
posterior. [Método, diferencias, perfilado y muestras](CONFIRM_REPEATABILITY.md),
[evidencia completa](evidence/confirm-repeatability.json).

228,4 y 359,7 usaron producción/binario idénticos y bases lógicamente iguales
salvo fecha de migración. No hay un commit causal entre esas dos mediciones;
hay variabilidad y trabajo global evitable que la amplificaba. El coste medido
crece en validación/clonado, no en un COMMIT lento. Se reducen asignaciones y se
reutilizan solo valores exactos; una prueba conservadora permite escribir una
entidad, su revisión y resolver su draft en la **misma transacción FULL/WAL**.
Desconocidos/cambios externos/recursos/otras operaciones conservan la ruta completa.
No se adelanta la respuesta ni se omiten validaciones globales ni se cambia NF-05.

El diagnóstico con 50 revisiones mide también el crecimiento de lecturas/copias
globales: p95 316,6 ms, con trazas y proceso reutilizado, separado de aceptación.
No se promete coste constante para cualquier historial ni se oculta esta limitación.
La comparación de arranque original/candidato intercalados no demuestra regresión
de código, pero el FAIL individual permanece. No se atribuye toda la variación
a un proceso, energía o IO sin prueba causal.

Regresiones funcionales posteriores: 222 tests/UI, 33 PDF, TypeScript/build,
AppImage/offline/privacidad PASS, [recibos](evidence/confirm-validation.json).
No se ejecuta otra campaña de aceptación tras el FAIL de A. El último p95
oficial de Confirmar es C 275,1 ms; startup C 2935,0 ms; **no sustituyen A**
ni representan una nueva aceptación final independiente.

## Registros históricos conservados íntegramente

> **Control previo actual: integración bloqueada.** El usuario aprobó F9/MVP 0.1.0 en `7088c4c`; la regresión nueva conserva 216 tests, UI, 33 PDF, offline y privacidad PASS, pero Confirmar durable p95 **359,7 ms >300**. Arranque p95 2469,1 ms PASS. Sin merge/push a main ni F10. [Evidencia actual](MERGE_VALIDATION.md). La aceptación anterior y todos sus resultados se conservan como historia.

## Registro aprobado anterior, conservado

# F9 — Rendimiento corregido: aceptación técnica PASS

25/10/2026. Arranque oficial p95 **1844.4 ms ≤3000**;
Confirmar durable **228.4 ms ≤300**. Rama sin fusionar,
pendiente de aprobación del usuario. F10 no iniciada.

[Perfilado, causas y seguridad](STARTUP_PROFILING.md), [muestras oficiales](evidence/startup-acceptance.json).
Mismo script oficial, equipo, corpus de 100 CV, SSD ext4, procesos/perfiles nuevos,
20 repeticiones sin eliminar outliers. No se vacía la caché SO/runtime, igual que
antes. No se cambian el marcador ni los presupuestos; FULL/WAL siguen intactos.
Código `4ed92317ac4709cd88e89833016648b9b690d384`; artefacto `16c0a4f77ac117b33a066b6c50a6ee75154552de2d485cf1fc9f8aa1974a14b3`.

| Operación | n | p50 ms | p90 ms | p95 ms | Máximo ms | Objetivo / resultado |
| --- | ---: | ---: | ---: | ---: | ---: | --- |
| startup | 20 | 1764.1 | 1824.7 | 1844.4 | 1875.5 | ≤3000 / PASS |
| library | 20 | 21.1 | 26.6 | 29.0 | 29.7 | sin umbral previo |
| openCv | 20 | 334.7 | 2724.6 | 2819.1 | 3015.8 | sin umbral previo |
| confirm | 20 | 207.6 | 225.2 | 228.4 | 235.7 | ≤300 / PASS |
| importAnalysis | 20 | 552.1 | 598.9 | 601.3 | 614.9 | sin umbral previo |
| importCommit | 20 | 292.3 | 303.4 | 318.6 | 322.6 | sin umbral previo |
| importTotal | 20 | 844.4 | 878.2 | 895.3 | 901.9 | ≤3000 / PASS |
| previewSimple | 20 | 1089.0 | 1135.0 | 1147.0 | 1191.0 | ≤2000 / PASS |
| previewLateral | 20 | 986.0 | 1010.0 | 1010.0 | 1013.0 | ≤2000 / PASS |
| previewSimpleWithDebounce | 20 | 1489.0 | 1535.0 | 1547.0 | 1591.0 | sin umbral previo |
| previewLateralWithDebounce | 20 | 1386.0 | 1410.0 | 1410.0 | 1413.0 | sin umbral previo |
| exportSimple | 20 | 37.3 | 60.8 | 60.9 | 61.8 | sin umbral previo |
| exportLateral | 20 | 29.7 | 32.7 | 32.9 | 35.9 | sin umbral previo |
| exportLongSimple | 20 | 938.0 | 1005.5 | 1017.2 | 1032.6 | ≤5000 / PASS |
| exportLongLateral | 20 | 1505.7 | 1541.3 | 1577.4 | 1585.2 | ≤5000 / PASS |
| typing | 33 | 4.8 | 11.6 | 14.6 | 15.6 | ≤100 / PASS |

FUSE normal se valida aparte: 20 aperturas, p95 **2339.4 ms**, máximo
2367.9, montaje comprobado sin extracción. No se mezcla con la serie
oficial histórica que necesita extracción en el namespace offline.

| Registro conservado | Arranque p95 ms | Confirmar p95 ms | Resultado |
| --- | ---: | ---: | --- |
| Primera evaluación F9 | 2594,1 | 471,1 | FAIL Confirmar/GUI |
| Cierre anterior tras perfil/backup | 2944,7 | 261,3 | PASS anterior |
| Control previo a merge, misma imagen anterior | 3462,3 | 236,9 | FAIL arranque |
| Intento intermedio 608a435 | 3398,7 | 387,5 | FAIL |
| Intento intermedio 5423559 | 3340,2 | 359,6 | FAIL |
| Aceptación actual 4ed9231 | 1844.4 | 228.4 | PASS |

Los intentos fallidos nuevos conservan todas sus muestras en
[startup-intermediate-1.json](evidence/startup-intermediate-1.json) y
[startup-intermediate-2.json](evidence/startup-intermediate-2.json).
No se repitieron hasta conseguir un número favorable sin cambios: cada intento
precede a una optimización perfilada, con commit y artefacto identificados.
La serie actual está precedida por diagnóstico con trazas, conservado por separado.
Abrir CV empeora en su cola hasta 2819.1 ms; sigue siendo informativo,
sin umbral previo. La pantalla inicial ya no transporta el workspace completo;
la primera apertura todavía lo materializa donde el adaptador lo necesita.

## Historial conservado

El registro anterior se conserva; no representa el estado vigente de esta cabecera.

## F9 — Rendimiento del producto

**Control posterior a la aprobación del usuario: FAIL de arranque, integración bloqueada.**
Confirmar durable PASS (236,9 ms p95). Véase el control completo al final y
[MERGE_VALIDATION.md](MERGE_VALIDATION.md). Las mediciones anteriores se conservan.

La aceptación usa los objetivos NF-05 anteriores al benchmark. No se cambian
umbrales para convertir una medición lenta en PASS. Primera evaluación: **FAIL NF-05** en Confirmar; las demás métricas con
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


## Primera evaluación conservada — 24/10/2026

Equipo: Intel Core i5-13420H, 12 CPU lógicas, 16 450 170 880 bytes de RAM
reportada por el SO (15,32 GiB), SSD NVMe WD PC SN740/ext4, Arch Linux, kernel
7.2.11-arch1-1. Runtime: Electron 44.7.2, Node 24.21.0, Chromium
152.0.7977.149; driver Node 26.12.0. Viewport medido 1180×860, DPR 1,
Xvfb/Openbox y render software. No se extrapolan estas cifras al equipo propuesto
de 4 núcleos/8 GiB ni a otras distribuciones. Controlador y main con CapEff=0,
solo loopback y cero rutas, sandbox Chromium activo.

Artefacto de la primera evaluación: SHA-256
`09325f4e4d2345238cae0bcf410977c37852e25fbaaf300bc887cbe5a453fdf0`;
`results.json` registra además el hash y el commit
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


## Reevaluación tras corregir los tres bloqueos — 24/10/2026

**AC-09 / NF-05: PASS en el benchmark oficial repetido.** El resultado inicial
471,1 ms no se borra ni se sustituye por una pasada diagnóstica. Veinte procesos
nuevos, misma máquina/SSD ext4, mismo script y puntos de inicio/fin, mismo corpus
de 100 CV, viewport 1180×860/DPR 1, Xvfb/Openbox y cero tests/builds concurrentes.
Solo loopback, cero rutas, CapEff=0 y sandbox Chromium activo.

El hash del proyecto semilla coincide exactamente con el anterior:
`83ae157d013de8c0423655186059076407449db8217d08659e892016b4577380`.
Equipo, RAM, kernel y Electron/Node/Chromium de la aplicación permanecen iguales.
El controlador instalado reporta ahora Node 26.12.1 (el registro anterior indicaba
26.12.0); se publica esa diferencia de patch, sin atribuirle garantías nuevas.

AppImage SHA-256:
`6b984f6e96af918b815def7d0d12db28e5bf1920108beeaea9878e5a7d443d8c`.
Controlador `bb69f52`; evidencia completa y muestras crudas:
`/tmp/cvforge-f9/remediation/performance-official/results.json`.

| Operación | n | p50 ms | p90 ms | p95 ms | Máximo ms | Objetivo ms / resultado |
| --- | ---: | ---: | ---: | ---: | ---: | --- |
| Arranque AppImage / 100 CV | 20 | 2793.6 | 2927.8 | 2944.7 | 2986.2 | ≤3000 / PASS |
| Listar biblioteca IPC | 20 | 43.8 | 50.9 | 52.7 | 57.7 | sin umbral previo |
| Abrir CV medio (informativo) | 20 | 1094.5 | 1644.7 | 1700.5 | 1757.6 | sin umbral previo |
| Confirmar durable tras flush | 20 | 251.1 | 260.9 | 261.3 | 271.5 | ≤300 / PASS |
| Importar / análisis | 20 | 699.1 | 719.8 | 726.0 | 736.8 | sin umbral previo |
| Importar / confirmar | 20 | 402.8 | 428.9 | 434.6 | 559.3 | sin umbral previo |
| Importar / total técnico | 20 | 1110.2 | 1145.0 | 1154.2 | 1250.6 | ≤3000 / PASS |
| Preview Simple tras debounce | 20 | 1307.0 | 1423.0 | 1682.0 | 1895.0 | ≤2000 / PASS |
| Preview Lateral tras debounce | 20 | 1185.0 | 1307.0 | 1312.0 | 1325.0 | ≤2000 / PASS |
| Preview Simple incluido debounce | 20 | 1707.0 | 1823.0 | 2082.0 | 2295.0 | sin umbral previo |
| Preview Lateral incluido debounce | 20 | 1585.0 | 1707.0 | 1712.0 | 1725.0 | sin umbral previo |
| Exportar Simple ya previsualizado | 20 | 39.3 | 49.3 | 53.8 | 66.6 | sin umbral previo |
| Exportar Lateral ya previsualizado | 20 | 37.8 | 41.9 | 42.5 | 43.5 | sin umbral previo |
| Generar/exportar Simple / 19 páginas | 20 | 1127.2 | 1704.6 | 1781.1 | 1801.7 | ≤5000 / PASS |
| Generar/exportar Lateral / 22 páginas | 20 | 1834.8 | 2183.8 | 2192.3 | 2214.1 | ≤5000 / PASS |
| Input → siguiente frame | 33 | 7.1 | 14.4 | 15.3 | 16.9 | ≤100 / PASS |

Confirmar: **p50 251,1; p90 260,9; p95 261,3; máximo 271,5 ms**. El límite
es 300 ms sin redondearlo ni restar commit/fsync. Sigue midiendo IPC durable
tras flush explícito; no afirma que cualquier clic con autosave aún pendiente
termine en ese tiempo. Abrir CV baja de p95 2173,0 a **1700,5 ms**, informativo,
sin convertirlo en un criterio nuevo. Arranque p95 2944,7 ms cumple 3000 con
poco margen: no se promete el mismo resultado en otros equipos.

La preview Simple completa incluyendo los 400 ms de espera mide p95 2082 ms;
el presupuesto fijado y el script anterior comparan el tiempo posterior al
debounce, 1682 ms. Se publican ambas medidas sin cambiar el método. Ninguna
exportación produjo un hash distinto al de su generación.

El cuello de botella y los intentos diagnósticos, incluidos los fallidos, están
en [CONFIRM_PROFILING.md](CONFIRM_PROFILING.md). Se eliminan copias/relecturas
redundantes, transporte costoso y ordenación JSON innecesaria; se reutiliza
validación local solo ante valores completos idénticos. Las invariantes globales,
validación de valores nuevos, integridad de bytes, revisión, resolución del
borrador y commit FULL/WAL siguen en el recorrido crítico. La tabla SQLite sigue
siendo transaccional; no se ha creado una persistencia diferencial compleja.

La aprobación global de F9 requiere además las regresiones completas de
[ACCEPTANCE.md](ACCEPTANCE.md); este PASS de rendimiento no las sustituye.

## Control previo a la integración — 24/10/2026, 20:40 UTC

20 procesos nuevos, mismo corpus SHA-256, 100 CV, SSD ext4, equipo y método IPC.
Fuente `c4203dacb9f748ac4010d38ee250df264a6c70cd`; AppImage idéntica a la
aprobada. No se modificó código, FULL/WAL, revisión, borrador ni umbrales.
Datos crudos y entorno: [evidence/merge-performance.json](evidence/merge-performance.json).

| Operación | n | p50 ms | p90 ms | p95 ms | Máximo ms | Objetivo / resultado |
| --- | ---: | ---: | ---: | ---: | ---: | --- |
| startup | 20 | 2343.6 | 2936.6 | 3462.3 | 3731.1 | ≤3000 / FAIL |
| library | 20 | 36.2 | 53.3 | 66.9 | 68.6 | sin umbral previo |
| openCv | 20 | 228.1 | 1305.4 | 1388.2 | 1628.6 | sin umbral previo |
| confirm | 20 | 207.4 | 231.1 | 236.9 | 245.7 | ≤300 / PASS |
| importAnalysis | 20 | 571.0 | 613.2 | 666.3 | 839.2 | sin umbral previo |
| importCommit | 20 | 343.6 | 403.9 | 405.7 | 427.8 | sin umbral previo |
| importTotal | 20 | 916.3 | 1009.6 | 1018.9 | 1243.1 | ≤3000 / PASS |
| previewSimple | 20 | 1086.0 | 1217.0 | 1293.0 | 1584.0 | ≤2000 / PASS |
| previewLateral | 20 | 999.0 | 1308.0 | 1533.0 | 1696.0 | ≤2000 / PASS |
| previewSimpleWithDebounce | 20 | 1486.0 | 1617.0 | 1693.0 | 1984.0 | sin umbral previo |
| previewLateralWithDebounce | 20 | 1399.0 | 1708.0 | 1933.0 | 2096.0 | sin umbral previo |
| exportSimple | 20 | 36.4 | 54.9 | 59.2 | 61.0 | sin umbral previo |
| exportLateral | 20 | 33.3 | 37.7 | 43.9 | 56.8 | sin umbral previo |
| exportLongSimple | 20 | 1072.7 | 1207.8 | 1208.4 | 1234.8 | ≤5000 / PASS |
| exportLongLateral | 20 | 1854.4 | 2064.8 | 2086.9 | 2101.9 | ≤5000 / PASS |
| typing | 33 | 8.5 | 13.7 | 15.4 | 15.9 | ≤100 / PASS |

**Resultado del comando: exit 1.** Arranque incumple 3000 ms; el resto de
presupuestos pasa. No se fuerza una nueva ejecución hasta conseguir PASS.
Un intento previo terminó con cierre de Electron después de 12 repeticiones:
se conserva como intento incompleto y no sustituye la medición oficial de 20.
La preferencia energética observada era `power` y el governor `powersave`;
no se cambiaron y no se demuestra que expliquen el resultado.
