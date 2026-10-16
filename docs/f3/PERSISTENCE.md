# F3 — Persistencia y biblioteca local

Estado inicial: implementación en `f3-persistence-library`; aceptación pendiente.
Base aprobada: `a1880e1` en main. No se inicia F4.

## Arquitectura

`src/domain` conserva sus contratos F2. `src/application` define el puerto
`LibraryRepository`, biblioteca, borradores y coordinación. El adaptador
`src/adapters/sqlite` usa better-sqlite3 13.0.3 en un worker dedicado; solamente
el host de confianza lo instancia. No se ofrece SQL ni rutas de almacenamiento
al renderer. Los errores del worker contienen un código, sin contenido, consultas,
rutas o stacks nativos.

La instancia SQLite usa WAL, synchronous FULL y foreign_keys ON. Cada escritura
compuesta usa BEGIN IMMEDIATE y compara una generación global esperada. Las
revisiones de entidades permiten además detectar edición obsoleta. El éxito solo
se devuelve después del COMMIT; cerrar espera las solicitudes anteriores.

## Esquema y migraciones

- v1: workspace, entidades confirmadas, revisiones, plantillas, activos, blobs y
  sus tablas de referencias. Secciones/entradas, fechas, orden, visibilidad,
  configuración y memoria sensible están en instantáneas JSON del modelo v1.
- v2: borradores separados y referencias de activos/plantillas de borrador.
- Identidad `application_id = 0x43564647`, `PRAGMA user_version = 2` y ledger con
  versión, nombre, SHA-256 del paso y fecha. Versiones futuras, formatos ajenos y
  ledger modificado se rechazan. No hay compatibilidad inventada con el spike F1.
- Antes de migrar una biblioteca existente se usa la API de backup SQLite en
  `migrations/`. Una excepción revierte datos, DDL, versiones y ledger; la copia
  previa permanece. No se copia solo el archivo principal de una base WAL.

Las tablas STRICT protegen tipos, IDs, versión, revisiones no negativas,
perfil único, JSON válido, longitudes de blobs y claves foráneas. La validación
de dominio sigue siendo la fuente de reglas complejas. Al abrir se comprueban
integrity_check, foreign_key_check, modelos, recursos, hashes y correspondencia
entre instantáneas e índices de referencias.

## Ubicación y activos

El host usará `app.getPath('userData')/library/library.sqlite3`. Los tests usan
directorios sintéticos en `/tmp`. Directorios privados 0700, base/copias 0600.
Se rechazan rutas dentro del repositorio y archivos/directorios de almacenamiento
que sean enlaces simbólicos. Ningún CV contiene una ruta de blob.

Los bytes son BLOB por SHA-256, compartidos por metadatos de Asset con IDs propios.
Se verifican bytes/dimensiones con el adaptador F2. Referencias del contenido
actual, checkpoints, plantillas y borradores conservan esos recursos. La limpieza
en la misma transacción retira únicamente los recursos que ya no tienen ninguna
referencia. No existe una lectura de archivos arbitrarios para resolver assets.

## Límite de esta entrega

No hay editor, formularios finales, traductor, importador Europass ni nuevos
contratos PDF. `.cvproj` conserva su formato F2; la integración y sus validaciones
se registrarán al completar esta fase. Las incidencias aplazadas de F1 permanecen
fuera del alcance.

## Confirmación, borradores e historial

Confirmar comprueba la revisión base, valida el candidato completo, conserva el
estado anterior, incrementa revisión y actualiza contenido/recursos en la misma
transacción. El perfil y los CV siguen siendo copias materializadas independientes.
La generación de biblioteca detecta también cambios concurrentes entre workers.

Un FormDraft tiene valores JSON sin confirmar, entradas de fecha crudas, base
validada, revisión base, versión propia y dependencias explícitas. Una fecha
inválida puede recuperarse literalmente, pero no confirmarse como fecha válida.
Al arrancar se enumeran borradores; acceptRecovery exige una base vigente y
devuelve datos al formulario sin confirmar. Descartar borra el borrador; confirmar
lo retira junto a la nueva revisión atómica. Las bases obsoletas se conservan para
inspección y se rechaza su aplicación automática.

DraftAutosaver agrupa edición con debounce de 500 ms y máximo 2 s; flush espera
la escritura durable. Un error conserva el trabajo pendiente y estado error.
Guardar y salir exige elegir conservar para recuperar o descartar, y espera los
flush. No se guarda cada tecla ni se considera confirmado un borrador recuperado.

La restauración conserva además un checkpoint fijado del estado sustituido y
produce una revisión creciente. beforeTranslation siempre es pinned. La limpieza
ordinaria es explícita (por defecto propone conservar 50); no borra pinned. Eliminar
un pinned exige allowPinned. No hay rotación destructiva implícita de historial.

## Eliminación y portabilidad

- Sección/entrada: confirmación explícita, actualización de órdenes/grupos y
  snapshot anterior recuperable; nunca se oculta una eliminación como visibilidad.
- CV: eliminación definitiva confirmada de contenido e historial propios. Si hay
  borradores o checkpoints pinned, exige aceptar expresamente cada pérdida. No hay
  papelera oculta ni borrado de bytes compartidos con otro documento/perfil.
- Asset: no puede borrarse mientras actual, historial, plantilla o borrador lo
  referencien. Al eliminar la última referencia se recogen metadatos/bytes dentro
  de la misma transacción. Subir recursos innecesarios o corruptos falla.
- Revisión: eliminación explícita; suprimir una pinned requiere aceptación extra.

`.cvproj` v1 no cambia. Exportar obtiene una instantánea consistente del alcance
CV o workspace, con cierre exacto de dependencias e historial. Los borradores no
pertenecen al contrato F2: si hay alguno pertinente, exportar bloquea hasta
resolverlo o aceptar expresamente su exclusión. Los backups físicos SQLite sí
incluyen borradores. Importar CV crea copia con nuevos IDs de contenido/aprobación/
historial; los recursos inmutables se comparten por identidad/hash. Un conflicto de
metadatos de recurso o definición de plantilla se comunica y no se fusiona.

Restaurar workspace en biblioteca vacía conserva exactamente el proyecto. Sustituir
una biblioteca exige confirmación y crea primero un backup SQLite consistente,
incluidos sus borradores; si falla el backup no se aplica la sustitución. Una
generación concurrente impide sobrescribir cambios posteriores a la lectura base.

`LibraryProjectFiles` conecta esos casos de uso con archivos reales elegidos por
el host. Importa con lectura acotada y sin seguir un enlace simbólico de archivo;
el codec detecta el contenido, no el nombre. Exporta mediante un temporal 0600 en
el directorio destino, fsync, publicación atómica y fsync del directorio. Un destino
existente solo se sustituye con overwrite explícito. Un error no se anuncia como
exportación completada y no modifica el estado confirmado de la biblioteca.

## Límites operativos y deuda

- La unidad de concurrencia SQLite es la biblioteca completa. Un conflicto de
  generación devuelve error aunque afecte a otro CV; no hay fusión silenciosa ni
  reintento que descarte ediciones. Una futura UI debe recargar y resolverlo.
- Se guardan instantáneas por entidad/revisión; una transacción recompone tablas
  de metadatos y referencias. Los BLOB existentes no se reescriben. La lectura y
  validación recorren la biblioteca; optimización incremental y p95 con 100 CV
  corresponden a la aceptación F9, todavía no medidos.
- Borradores y checkpoints se conservan hasta resolución/limpieza explícita. La
  limpieza lógica de blobs no implica borrado forense de páginas libres, WAL,
  backups o almacenamiento físico; no hay cifrado de biblioteca en esta fase.
- Un reloj anterior al estado importado produce error; no se fabrican fechas.
- Las migraciones existentes son exactamente v1 → v2 del almacenamiento F3. No
  migran la base del spike F1 ni formatos futuros. SQLite corrupto se rechaza;
  recuperar exige cerrar conexiones, preservar el archivo afectado y restaurar
  una copia comprobada. No se afirma reparar bases dañadas automáticamente.
- Linux x64 es la plataforma probada. El host y los puertos están disponibles;
  preload/IPC público, diálogos finales y la integración de UI pertenecen a sus
  fases. El harness Electron no sustituye un instalador de producto.

Referencias técnicas: [transacciones y backup de better-sqlite3](https://github.com/WiseLibs/better-sqlite3/blob/master/docs/api.md),
[WAL de SQLite](https://www.sqlite.org/wal.html), [PRAGMA](https://www.sqlite.org/pragma.html),
[userData de Electron](https://www.electronjs.org/docs/latest/api/app#appgetpathname).

Dependencias directas nuevas: better-sqlite3 13.0.3 (MIT, misma versión que F1),
`@types/better-sqlite3` 9.6.0 (MIT, desarrollo). Las dependencias anteriores de F2
conservan versiones. El lockfile fija la resolución; no hay una dependencia de
producción de `spikes/f1` ni del harness sintético.
