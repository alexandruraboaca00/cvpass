# F3 — Validación de persistencia y biblioteca

**16 de octubre de 2026 · F3 = APROBADA por el usuario e integrada en main** desde
`f3-persistence-library` mediante merge commit. F4 no iniciada.

## Matriz de aceptación

| Criterio | Estado | Evidencia real |
| --- | --- | --- |
| Fronteras dominio/aplicación/repositorio/SQLite | PASS | Tests de importaciones; dominio F2 intacto; host userData y cliente de worker sin SQL para renderer |
| SQLite versionado y durable | PASS | v1/v2, application_id, ledger SHA-256, WAL/FULL/FK, tablas STRICT, claves/índices y COMMIT previo al reconocimiento |
| Workspace/perfil y varios CV independientes | PASS | Crear, confirmar, listar, abrir, renombrar, duplicar y eliminar; modificaciones bidireccionales sin propagación |
| Secciones/entradas/configuración/plantilla/idioma | PASS | Round-trip exacto del fixture completo F2, orden manual e inclusión, fechas parciales/ongoing y cinco dimensiones CEFR |
| Traducciones sensibles | PASS | Original, decisiones, traducción + original, aprobaciones remapeadas en copias y persistencia/reapertura exactas |
| Cerrar → nueva instancia → abrir → comparar | PASS | SQLite worker nuevo; dos procesos Node distintos y dos procesos Electron reales con igualdad de digest del contenido y blobs |
| Borrador separado y recuperación explícita | PASS | Inputs inválidos preservados, accept/discard, base obsoleta bloqueada, Cancelar sin revisión confirmada y no exportación implícita |
| Autoguardado/flush/salida | PASS | 100 ediciones agrupadas en una escritura, guardado por temporizador sin flush explícito, errores sin estado saved y cierre con decisión de borradores |
| Checkpoints/restauración | PASS | Guardar → checkpoint → cambiar → cerrar → abrir → restaurar como revisión nueva; checkpoint anterior y estado sustituido permanecen |
| Retención | PASS | Prune ordinario no elimina pinned; eliminar pinned o CV con historia fijada exige aceptación explícita |
| Assets | PASS | PNG sintético, metadatos/bytes/dimensiones, BLOB por hash; referencias actuales/históricas/de borrador; último propietario y recogida atómica |
| Eliminar CV/sección/entrada/revisión/asset | PASS | Órdenes y grupos consistentes, snapshots recuperables, borradores protegidos, activo compartido conservado y FK sin violaciones |
| Concurrencia/transacciones | PASS | Revisión obsoleta y generación antigua rechazadas; dos workers no sobrescriben cambios nuevos; SIGKILL dentro de una transacción revierte todo |
| Fallo de escritura | PASS | SQLITE_FULL real con max_page_count, sin saved, biblioteca/generación intactas e integrity_check ok tras reabrir |
| Migraciones | PASS | Base v1 real con datos/WAL → v2 y backup; fallo DDL revierte esquema/datos/ledger; reintento correcto; versión futura/checksum alterado rechazados |
| Datos inválidos/corrupción | PASS | ID/recurso inválido, JSON/modelo desconocido, blob alterado y base corrupta rechazados; no normalización destructiva ni fechas inventadas |
| `.cvproj` CV y workspace | PASS | Formato v1 intacto; copia CV remapea identidades; workspace vacío recupera exactamente proyecto, ocultos, memoria, plantillas, historial y activos |
| Archivo `.cvproj` real y sustitución | PASS | Exportación temporal/fsync/publicación atómica; importación desde archivo → persistir → cerrar → reabrir → comparar. Sustitución respaldada antes del COMMIT |
| Privacidad del PDF | PASS | Proyección/payload F2 desde estado confirmado excluyen marcadores ocultos, borrador, historia, nombre privado y otros documentos |
| Local/sin red | PASS | Namespace creado antes de Node/Electron, sin interfaces/rutas, conexión de control ENETUNREACH; 39 tests F3 y flujo Electron completo |
| Tests F2 + F3 | PASS | npm test: 69/69, 0 omitidos; test:f2: 30/30; test:f3 offline: 39/39 |
| TypeScript/build | PASS | tsc --noEmit y build con declaraciones, exit 0 |
| Regresión F1 | PASS | Nueva ejecución del paquete cerrado sin red: crear/reabrir, PDF/payload/SQLite y 3/3 tests; fuentes/evidencia/ASAR intactos |

No hay FAIL arquitectónicos detectados en el alcance probado. El usuario aprobó
F3 y su integración; no se declara terminado el MVP ni se inicia F4.
Evidencia automática resumida: [validation.json](validation.json).
Esquema, decisiones y deuda: [PERSISTENCE.md](PERSISTENCE.md).

## Integración aprobada

El merge conserva como primer padre el cierre F2
`a1880e1e2e7de86d856c537ec5e43abcb136d155` y como segundo el cierre F3
`9a1eed486cbfa88976f814b028604f6ef49b27ea`. El código aprobado se integra intacto;
los cambios adicionales registran exclusivamente el estado de aprobación e integración.
`validation.json` conserva la evidencia previa a la fusión: `merged: false` y
`userApprovalToMerge: pending` describen ese momento de validación.

## Procedimiento reproducible

Desde main limpio y sincronizado `a1880e1`, antes de crear la rama se ejecutaron
F2 30/30 y F1 3/3. Tras cada bloque se ejecutaron tests, TypeScript y regresión F1.
Al cierre se ejecutó:

```bash
npm test
npm run test:f2
npm run typecheck
npm run build
unshare --user --map-current-user --net node scripts/f3-offline-check.mjs
CVFORGE_F1_OUTPUT=/tmp/cvforge-f3-f1-regression-final \
  unshare --user --map-current-user --net node spikes/f1/offline-check.cjs
```

Los procesos gráficos finales se ejecutaron con aprobación fuera del sandbox de
archivos, conservando la red deshabilitada mediante unshare. No se cambió F1.
El script offline comprueba `/proc/net/route`, interfaces y una conexión TCP a
1.1.1.1:443 rechazada con ENETUNREACH antes de iniciar npm o Electron. Después
ejecuta los 39 tests F3 y dos procesos Electron. No necesita CDN ni recursos remotos.

El harness copia solo el runtime Linux existente en un directorio técnico en
`/tmp`, con otra aplicación sin renderer. No copia el app.asar de F1, sus modelos
ni su lógica; comprueba su hash antes/después. En Electron 44.7.2 / Node 24.21.0
se usa el mismo adaptador de producción F3: crear biblioteca sintética, checkpoint,
renombrar, autoguardar borrador, cerrar; otro proceso compara el digest, recupera/
descarta el borrador, restaura el checkpoint, exporta/importa `.cvproj` y vuelve a
abrir la copia. SQLite 3.53.4: integrity_check ok, foreign_key_check vacío.

Las pruebas de crash usan procesos reales y SIGKILL tras escritura reconocida o
dentro del BEGIN IMMEDIATE. SQLITE_FULL se produce realmente limitando páginas de
SQLite antes de insertar un recurso sintético grande; no es un mock del repositorio.
La migración fallida inyecta un paso SQL defectuoso solo en la entrada interna de
tests. Ni SQL arbitrario ni inyección de fallos forman parte del protocolo del worker.

## Incidencias y límites observados

- Primer intento F1 con el sandbox de archivos: dconf no pudo escribir en `/run`,
  el proceso GPU cayó y faltaron informes de cierre. Los tests lo rechazaron (1/3);
  no se contó como PASS. La repetición aprobada fuera del sandbox, aún sin red,
  completó los dos procesos y los 3 tests. No es una modificación/regresión de código
  F1. El harness F3 también completó el flujo bajo el entorno restringido; sus
  diagnósticos gráficos se conservaron y se confirmó otra vez fuera de él.
- La protección inicial de ubicación rechazaba `/tmp` por un marcador .git ajeno.
  Se acotó al repositorio real, con prueba de ruta directa y padre simbólico.
- El reloj de un fixture F2 era posterior al reloj real del test. Los tests F3
  inyectan un reloj sintético posterior; otra prueba verifica el rechazo explícito
  de un reloj que retrocede. No se cambió una invariante para hacerlo pasar.
- El sistema de archivos de `/tmp` es distinto del workspace: el harness usa copia
  de runtime en vez de hardlinks entre ambos. La publicación atómica `.cvproj` usa
  un temporal en el mismo directorio destino, con pruebas de fallo y no reemplazo.
- No hay editor/preload final, instalador F3, recuperación automática de SQLite
  corrupto ni medición p95/100 CV. `.cvproj` v1 no incluye borradores; se exige
  resolverlos o aceptar su exclusión, y el backup SQLite conserva ese estado.
- Poppler geométrico, VA-API, avisos de desarrollo del spike y decisión de pesos
  ONNX siguen registrados en F1 y no se convirtieron en trabajo de F3.

Todos los datos son sintéticos. No se versionan bases, proyectos, PDF, perfiles
Electron ni logs de ejecución. Los errores del worker son códigos sin consultas,
contenido o rutas. Auditoría de dependencias raíz: cero vulnerabilidades; nuevas
dependencias directas MIT, versiones exactas en el lockfile.
