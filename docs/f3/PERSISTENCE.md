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
