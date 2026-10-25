> **Integración definitiva del MVP 0.1.0 aprobada por el usuario:** F9 se integra
> en `main` mediante merge commit, sin squash ni reescribir historia. Las campañas
> A/B/C y NF-05 vigente (startup ≤3200, Confirmar ≤300) no cambian ni se repiten.
> Se conserva la deuda de 50 revisiones/316,6 ms y todo el historial siguiente.
> Regresión post-merge obligatoria antes de push. **F10 no iniciada; sin tag ni
> GitHub Release.** Las referencias siguientes a «pendiente de aprobación» o
> «sin fusionar» describen el estado histórico anterior a esta integración.

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

# F9 — Método congelado para investigar Confirmar durable

25/10/2026. **F9 NO APROBADA. No merge/push a main ni F10.** Este método se fija
antes de modificar código de producto; no sustituye NF-05 ni mueve marcadores.

## Identidad inicial y comparaciones conservadas

- HEAD inicial `136c2460fd76dd375a85bf889e7535452cf1a477`; código de producción
  idéntico al `4ed9231` que obtuvo 228,4 ms y al `7088c4c` que obtuvo 359,7 ms.
- AppImage 0.1.0 x86_64: 159760475 bytes, SHA-256
  `16c0a4f77ac117b33a066b6c50a6ee75154552de2d485cf1fc9f8aa1974a14b3`.
- Runner oficial `scripts/f9-performance.mjs`, SHA-256
  `5441ee4ed607620c896aae372154a8d205cf35a9d31f0c27982afde09e4806b2`.
  No cambia durante la investigación. Los scripts adicionales son observadores
  o diagnósticos explícitamente separados.
- Campaña 228,4: `/tmp/cvforge-f9-startup/acceptance/results.json`, datos en
  `~/.local/share/CVForge-F9-Acceptance/startup-acceptance/`.
- Campaña 359,7: `/tmp/cvforge-f9-integration/performance/results.json`, datos en
  `~/.local/share/CVForge-F9-Acceptance/integration/performance/`.
- Corpus `f9Workspace(100)` y recursos Simple locales; proyecto semilla SHA-256
  `83ae157d013de8c0423655186059076407449db8217d08659e892016b4577380`.
  Cien CV alternan seis casos: pequeño, medio, largo de 48 párrafos, habilidades,
  idiomas y personalizadas. El perfil hace 101 entidades. JSON de los CV suma
  1909756 bytes UTF-8: mínimo 11167 y máximo 35811. El CV medio medido tiene
  11167 bytes, revisión 1, siete secciones/diez entradas más datos personales.

[Comparación de bases retenidas](evidence/confirm-database-comparison.json):
ambas bases tienen 3866624 bytes/944 páginas de 4096, 101 entidades, seis assets y
seis blobs, una plantilla, cero revisiones/borradores/exports. Difieren los bytes
físicos y el digest global porque `schema_migrations.applied_at` es distinto;
ninguna otra columna lógica cambia. La base cerrada no conserva WAL. Su cabecera
indica formato WAL (2/2); `journal_mode` desde el observador Python immutable no
representa la configuración de la conexión escritora y no se usa como tal.
Al abrir, el worker ejecuta `journal_mode=WAL`, `synchronous=FULL`, claves foráneas
y timeout 5000; la conexión única del adaptador posee el escritor.

## Preparación y frontera exacta de cada muestra

Cada campaña completa tiene **20 muestras**, cada una en proceso y perfil nuevos.
La base semilla se crea/cierra una vez por campaña y se copia a `run-*` antes de
cada lanzamiento. No se recicla la DB de la muestra anterior. El directorio nuevo
está en SSD ext4 fuera del checkout, bajo
`~/.local/share/CVForge-F9-Acceptance/repeatability/`.

Orden del runner, sin modificar: arrancar hasta biblioteca/100 tarjetas → listar
→ seleccionar CV medio en GUI → abrirlo por IPC → abrir formulario personal →
modificar únicamente `personalInformation.displayName` a `F9 benchmark <n>` →
stage → flush durable del borrador → empezar medición de Confirmar.
La longitud cambia un byte para índices de dos dígitos, igual que antes.

**Inicio:** `performance.now()` del renderer inmediatamente antes de
`await window.cvforge.confirm(f)` después de stage/flush completos.
**Fin:** respuesta de esa promesa disponible en renderer y comprobada `ok`.
Main solo responde después de revisión, resolución del borrador, validación,
transacción/COMMIT FULL/WAL correctos y construcción de su respuesta. Transporte
preload/IPC de ida/vuelta está dentro. Tecleo, preparación anterior, debounce y
trabajo UI posterior no se descuentan del intervalo ni se añaden retroactivamente.

Después de Confirmar se importan datos y se generan/exportan ambas plantillas.
La primera repetición también mide exportaciones largas; ocurre **después** de
su Confirmar y nunca modifica la base de la siguiente muestra. Aun así puede
calentar caché/CPU y se registra; no se reordena para mejorar la cifra.

## Entorno, caché y observación

Mismo i5-13420H/12 CPU lógicas, 16 GiB, SSD ext4, Arch Linux/kernel 7.2.11,
Electron 44.7.2/Node 24.21.0/Chromium 152.0.7977.149, driver Node 26.12.1.
Ventana 1180×860 y pixel ratio 1. Xvfb/Openbox/X11 software, namespace de red con
solo loopback/CDP, cero rutas externas y capacidades cero, sandbox Chromium activo.
AppImage extract-and-run, método histórico necesario en ese namespace; no se
confunde con FUSE normal ni con ejecutar Electron directamente.

No se vacían cachés SO/runtime: «frío» significa proceso/perfil nuevo. La caché
privada validada del worker se prepara al abrir; begin/stage/flush preparan su
estado antes de cronometrar. No se reconstruyen caches manualmente ni se aumenta
el periodo de calentamiento. No se cambia energía ni se matan procesos ajenos.

Las campañas históricas no conservaron series de CPU/IO/frecuencia ni una traza
interna de cada Confirmar: no se inventan retrospectivamente. Las nuevas series
registrarán CPU/memoria/IO/carga, frecuencia/EPP, procesos relevantes y actividad
WAL con observación externa ligera. No habrá otros tests/build simultáneos.
Se registra su coste. El sondeo no ejecuta checkpoints ni abre conexiones de
escritura. Las trazas internas opt-in A–J y el formulario real se miden en campañas
diagnósticas separadas; no se comparan sin etiquetar con aceptación sin trazas.

## Plan de decisión fijado

Comparar primero bases, historial, WAL y muestras rápidas/lentas del binario
sin modificar. Medir complejidad, checkpoint/commit y ruido antes de optimizar.
Cualquier modificación necesitará regresiones de durabilidad/rollback/aislamiento.

Cierre: **tres campañas completas independientes de 20 muestras**, identificadas
A/B/C, mismo método congelado y un mismo binario. Nearest rank
`ceil(p*n)`, sin exclusiones; p50/p90/p95/máximo por campaña y p95 combinado de
60 solo informativo. Las tres deben cumplir Confirmar ≤300 ms, buscando margen
cerca de 250 si es sencillo. No se acepta una de tres ni se repite hasta obtener
un resultado favorable. Startup ≤3000 en las mismas campañas; Abrir CV solo
informativo. Si alguna falla, se conserva el FAIL; solo una corrección medida y
revisable puede justificar otro conjunto final.

Solo tras estabilidad: AC-01…AC-10, F1–F9/UI/33 PDF, TypeScript/build, AppImage,
offline/privacidad. Los valores anteriores (471,1; 261,3; 236,9; 228,4; 359,7 ms y
startup 2594/3462,3/1844,4/2469,1) se conservan íntegros.

## Diagnóstico previo y correcciones medidas (no aceptación)

El binario original, sin cambios, dio otra campaña con trazas: Confirmar p95
350,0 ms FAIL (20 procesos). En su muestra rápida/lenta: renderer 251,7/366,3 ms;
validación global 111,9/167,8; clon de lectura 17,6/26,1; captura de envío
15,0/25,0; cuerpo SQLite 26,7/38,6; BEGIN+COMMIT durable 12,8/9,6 ms. Hay variación
reproducible con el mismo binario; no un cambio de código entre 228,4 y 359,7.
La causa física de la diferencia histórica no puede reconstruirse sin telemetría
histórica. El coste confirmado está en trabajo global/asignaciones CPU que
amplifican esa variación, no en un fsync extraordinario en la muestra lenta.

CPU inspector separado, Node 26 y copia SSD con diez ediciones: guardián de datos
719/2673 muestras inclusivas; recorridos unique/checkOwner 217; clonado también
relevante. Es un diagnóstico algorítmico directo, no Electron ni aceptación.
Prueba intercalada de guardias sobre el mismo objeto: se reduce coste sin aceptar
getters, símbolos, ciclos, arrays dispersos, prototipos, -0 ni excesos de límites.

`2fa3f0b`: menos asignaciones de descriptores, resumen privado de IDs solo tras
aprobar valores exactos y reutilización de JSON ya validado; las comprobaciones
globales siguen en cada llamada. 182 tests PASS. Diagnóstico cinco procesos:
Confirmar p95 226,2; startup p95/máximo 4852,2 FAIL, primera ejecución del nuevo
artefacto. Se conserva, no se descarta ni se confunde con aceptación de 20.

`81165df`: vía SQL conservadora solo tras demostrar que cambia una entidad,
se añade exactamente su checkpoint anterior y se resuelve un borrador, con todo
lo demás byte-equivalente. El worker comprueba generación/data_version bajo
BEGIN IMMEDIATE; si el caché es desconocido, cambian recursos/orden/otros datos o
no hay prueba exacta, usa la transacción completa. No cambia puertos, formato ni
schema. Validación global y verificación de assets completas preceden a ambas
rutas. COMMIT FULL/WAL, revisión/borrador y cache antes del ACK permanecen.
186 tests PASS; adicionales prueban una sola fila de entidad, perfil independiente,
rollback/reintento sin revisión duplicada y rechazo del caché externo obsoleto.

Diagnóstico cinco procesos: Confirmar p95 147,6, máximo 147,6 ms; startup
p95/máximo 3132,5 FAIL, primer lanzamiento, otros cuatro entre 1684,6 y 1796,2.
No es aceptación ni se borra ese primer dato. El contador real registra siete
filas cambiadas por confirmación, 24 frames nuevos en el ejemplo, sin checkpoint
solicitado. El fichero WAL puede conservar su tamaño preasignado: tamaño físico
no equivale a frames activos. La antigua ruta reescribía los 100 CV e índices.

Se mantienen lecturas/validación de la biblioteca completa necesarias por el
contrato vigente y las invariantes globales. Las escrituras de la confirmación
ordinaria dejan de ser proporcionales a todos los CV/historial/assets. No se
rediseña toda la persistencia ni se omiten revisiones para lograr el benchmark.

[Todos los diagnósticos y muestras](evidence/confirm-initial-diagnostics.json).
La instrumentación opt-in añade BEGIN y COMMIT separados, escrituras por tipo,
filas cambiadas y cabeceras WAL antes/después; no registra contenido/IDs. Las
etapas anidadas no se suman. No se afirma aislar syscalls fsync del tiempo de
COMMIT. El crecimiento progresivo con 50 revisiones se medirá aparte con el
mismo baseline/recursos y un proceso reutilizado; no reemplaza las campañas frías.

### Observador definitivo

La versión inicial sondeaba todos los procesos cada segundo: p95 de coste 39,9 ms
por tick; queda etiquetada como diagnóstico, no aceptación. Se midió el coste y
se corrigió el observador, no la aplicación: sistema/frecuencia cada segundo,
censo de procesos cada diez segundos y WAL/SHM cada 100 ms; ninguna conexión
SQLite ni checkpoint. En el diagnóstico final su coste fue p50 0,37/p95 1,75 ms,
máximo 20,9 ms (censo), CPU propia 0,55 s en 72,7 s, aproximadamente 0,76 % de
un núcleo. Se publica el coste sin descontarlo de las mediciones. **Las tres
campañas finales usarán esta misma versión 2, sin trazas internas**, procesos
nuevos, un mismo artefacto y todos los demás puntos congelados arriba.

`scripts/f9-campaign-summary.mjs` comprueba identidad de runner/binario/corpus/
equipo/método y 20 muestras en cada serie, calcula percentiles sin filtrar y
rechaza una campaña individual FAIL aunque el combinado dé PASS. Después de
A/B/C estables se repetirá una cuarta aceptación oficial completa, sin mezclar
sus 20 muestras con las 60, antes de la regresión final.

## Resultado de las tres campañas congeladas — 25/10/2026

**Confirmar reproducible PASS; F9 NO APROBADA por arranque A.** No se reemplaza
ninguna campaña ni se ejecuta la cuarta aceptación prevista después de fallar
la condición conjunta fijada. [Muestras completas y entorno](evidence/confirm-repeatability.json).
Mismo HEAD `7e4c8e9`, runner/corpus congelados y AppImage `6f07c841…ec707f3`.
Las trazas internas están desactivadas; el observador externo V2 es el mismo.

| Campaña | n | Confirmar p50 | p90 | p95 | máximo | startup p95 | Resultado |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | --- |
| A | 20 | 246,0 | 284,1 | 284,2 | 286,0 | 3075,6 | Confirmar PASS; startup FAIL |
| B | 20 | 126,4 | 278,1 | 280,3 | 281,1 | 2995,8 | PASS |
| C | 20 | 246,3 | 275,1 | 275,1 | 278,9 | 2935,0 | PASS |

Milisegundos, nearest-rank, sin exclusiones. Combinado de 60 Confirmar:
p50 236,0; p90 279,8; **p95 283,0**; máximo 286,0. Es informativo y no
compensa el FAIL individual de arranque. La mejora diagnóstica de 133–148 ms
no se presenta como aceptación: el entorno real deja bastante menos margen.
El margen de A es 15,8 ms; B/C 19,7/24,9 ms. Las tres cumplen el límite
formal, pero no se consigue consistentemente el objetivo práctico deseable de
250 ms ni se promete estabilidad universal.
La campaña C mide Abrir CV p95 2100,6 ms, sin umbral; no se selecciona el
mejor valor de A/B/C ni se declara una aceptación final independiente.

CPU total mediana A/B/C: 28,8/27,1/27,2 % de doce CPU lógicas; carga 1 máxima
4,63/5,10/4,51. EPP `power` y governor `powersave` se conservan. Los procesos
observados incluyen CVForge y aplicaciones del escritorio; no se matan ni se
cambia la energía. El censo no demuestra una causa física única. Coste CPU
del observador: 1,25/1,03/1,12 % de **un** núcleo; no se resta del intervalo.
Se conservan memoria, IO, frecuencias, PSI y coste por tick en evidencia local
`/tmp/cvforge-f9-repeatability/final-{A,B,C}/environment.ndjson`.

### Arranque comparado, sin atribuciones retrospectivas

Tras completar las tres campañas, cinco pares original/candidato intercalados,
con trazas y el mismo corpus: original 2867,3–3139,7 ms; candidato
2732,5–2961,9 ms. [Etapas numéricas](evidence/confirm-startup-comparison.json).
No es aceptación ni una sustitución de A. No demuestra una regresión de código
en el candidato. En el primer par, hasta el primer marcador Node transcurren
1537,7/1225,4 ms; validación 497,8/428,9 ms; decodificar entidades
171,1/190,3 ms; migraciones ya aplicadas 0,85/0,84 ms. Son spans parcialmente
solapados. Hay coste y variación antes de JavaScript y dentro de CVForge.
No hay datos suficientes para culpar exclusivamente a energía, un proceso
ajeno, IO o el runtime. El FAIL 3075,6 sigue siendo FAIL frente a 3000.

### Historial creciente y formulario real

[Diagnóstico separado](evidence/confirm-history-profile.json): misma AppImage
y base cerrada oficial, un proceso, 50 confirmaciones consecutivas con trazas.
Cien CV en todo momento, revisiones 0→50, cero drafts tras cada respuesta;
formulario GUI adicional produce revisión 51. Cada muestra comprueba la base
con conexión readonly corta **fuera** del intervalo, sin checkpoint explícito.

Primeras diez: p50 220,7/p95 302,6; últimas diez: p50 258,9/p95 322,1 ms.
Todas: p50 258,9/p90 309,3/p95 316,6/máximo 322,1. No se usa esa serie
con trazas/proceso reutilizado como benchmark oficial ni se oculta su coste.
Cada Confirmar sigue escribiendo siete filas, con independencia del historial;
las lecturas, copias, prueba exacta y validación global crecen con el grafo.
No se ha eliminado toda complejidad proporcional al historial/workspace. Es
una limitación real del contrato actual, no un bug cuadrático demostrado, ni
una promesa de NF-05 para cualquier historial. La preparación previa aún puede
usar la transacción completa y provocar checkpoints fuera de Confirmar.

| Etapa ms | Rápida: 9 revisiones | Lenta: 45 revisiones |
| --- | ---: | ---: |
| renderer → recepción IPC | 1,42 | 2,37 |
| candidato/validación local | 6,43 | 5,85 |
| copia lectura / copia envío | 17,00 / 15,10 | 36,84 / 31,94 |
| serialización worker | 2,73 | 5,14 |
| validación global | 61,11 | 115,67 |
| BEGIN | 0,14 | 0,23 |
| cuerpo transacción (incluye prueba exacta) | 8,46 | 14,76 |
| COMMIT durable | 3,72 | 4,54 |
| actualizar caché | 0,003 | 0,005 |
| retorno IPC disponible | 1,18 | 2,21 |
| total renderer | 158,90 | 322,10 |

Son spans anidados, no se suman. El historial difiere: no es comparación de
CPU pura. El par rápido/lento original con **igual** estado inicial está arriba.
En las 50 confirmaciones: vía acotada 50/50, siete filas 50/50, WAL reiniciado
25 veces porque ya estaba completamente checkpointed antes de BEGIN; ningún
avance nBackfill dentro del Confirmar observado. COMMIT p95 5,27 ms.
No se desactiva autocheckpoint ni se pretende aislar syscalls fsync. El formulario
GUI mide preparación antes de IPC 8,1 ms y trabajo posterior 21,0 ms, separados
del marcador oficial sin moverlo.

La candidata se reconstruyó dos veces, byte-idéntica: **159764395 bytes**,
SHA-256 `6f07c8418392f00e98104b041885d20a1b1aa50653e9ce9dc6512451eec707f3`.
Sin cambios de esquema, FULL/WAL, dominio persistido, formato, plantillas ni PDF.
El estado global y las regresiones finales constan en [ACCEPTANCE](ACCEPTANCE.md).
