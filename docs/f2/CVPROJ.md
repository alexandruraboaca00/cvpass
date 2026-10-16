# `.cvproj` — Contrato inicial F2

`projectFormatVersion = 1`, `domainModelVersion = 1`. Implementación:
`src/domain/project.ts`, `src/adapters/cvproj.ts`, `zip-store.ts`, `json.ts`.
Los identificadores de formato prevalecen sobre extensión/nombre de archivo.

## Contenedor

ZIP estándar **STORE**, sin compresión, cifrado, ZIP64, comentarios, extras,
descriptores de datos, discos múltiples, symlinks o archivos especiales. La
restricción es deliberada para este contrato inicial: no se ejecuta un inflador
sobre archivos ZIP no fiables. Métodos no soportados se rechazan, no se truncan.
Añadir compresión requerirá documentar compatibilidad y límites de expansión.

| Ruta única admitida | Contenido |
| --- | --- |
| `manifest.json` | UTF-8: identificador/versiones, scope, política privada, fecha, creador e inventario con longitud y SHA-256 |
| `snapshot.json` | Unión estricta de proyecto CV o workspace, incluyendo recursos/revisiones de su alcance |
| `assets/<sha256>` | Bytes originales de cada activo necesario, deduplicados por hash |

Manifest:

```json
{
  "format": "cvforge-project",
  "projectFormatVersion": 1,
  "domainModelVersion": 1,
  "scope": "cv",
  "payloadPolicy": "complete-private-project",
  "createdAt": "2026-10-16T12:00:00.000Z",
  "creator": {"name": "CVForge", "appVersion": "0.1.0"},
  "files": [{"path": "snapshot.json", "byteLength": 123, "sha256": "<64 hex>"}]
}
```

El ejemplo ilustra la forma; longitud/hash se calculan realmente al codificar.
El inventario excluye su propio manifiesto para evitar una referencia circular.
No hay un campo opcional que permita añadir biblioteca privada a un payload PDF.
Los hashes verifican integridad, no autoría ni firma.

## Alcances

- **cv:** `cv`, `revisions` de ese propietario, `assetsById` necesarios para estado
  actual/checkpoints, y versiones de `templates` referenciadas con sus recursos.
  No contiene un MasterProfile ni otros CV. La procedencia informativa de perfil
  no se resuelve para recuperar el contenido materializado.
- **workspace:** `workspace` con ID, perfil opcional, mapa/orden de CV e idioma UI;
  revisiones de esos propietarios y recursos completos de ese alcance. Es un
  contrato de datos F2, no una operación de restauración de biblioteca F3.

Se rechazan recursos sin referencia y referencias sin resolver. Un snapshot de
revisión incluye el CV completo y conserva sus dependencias, aunque ya no estén
en el CV actual. No hay recursión de revisiones dentro de revisiones.

## API y recuperación

```ts
const cvData = selectCvData(workspaceData, cvId);
const bytes = encodeCvproj(cvData, createdAt);
const result = decodeCvproj(bytes);
// result.snapshot y result.blobs son copias independientes y validadas.
```

El codec recibe/devuelve bytes; no escribe, reemplaza ni restaura archivos/bases.
La igualdad de round-trip compara todos los datos y bytes del proyecto, no un PDF
ni una identidad binaria del contenedor. Se preservan secciones excluidas,
precisión de fechas, originales/aprobaciones, orden, configuración, definición
exacta de plantilla y checkpoints fijados. Los blobs pueden compartirse por hash,
sin depender de otro CV o perfil mutable.

`detectCvproj` identifica el formato/versiones por manifiesto sin depender de la
extensión. `decodeCvproj` rechaza formatos/versiones no compatibles, corrupción,
hashes/CRC incorrectos y contratos desconocidos. Nunca intenta guardarlos con
campos descartados. El llamante conserva sus bytes originales y recibe el error.

## Límites y validación

| Límite predeterminado | CV | Workspace |
| --- | --- | --- |
| Entrada ZIP | 50 MiB | 200 MiB |
| Suma de entradas | 100 MiB | 500 MiB |
| Ficheros | 1.000 | 10.000 |
| Cada JSON de control | 10 MiB | 10 MiB |
| Profundidad JSON | 128 | 128 |
| Nodos de datos | 200.000 | 200.000 |

Los límites de CV/workspace son independientes y configurables por separado; los
controles generales de profundidad/nodos no se desactivan. El writer calcula el
tamaño antes de crear el ZIP. El reader comprueba tamaños, nombres y coherencia
del directorio/headers locales antes de procesar snapshots/activos. Rechaza
traversal, rutas absolutas, duplicados, solapes/datos añadidos, symlinks y métodos
no admitidos. No extrae a disco. JSON rechaza UTF-8 inválido, claves duplicadas
(incluso escapadas), claves peligrosas, números no finitos y campos desconocidos.

Los bytes de activos se contrastan con tamaño/hash y, para imágenes, dimensiones.
El PNG de proyecto puede conservar metadatos privados; el PNG de ExportPayload
solo admite el resultado normalizado, sin EXIF/chunks de texto. Los recursos de
plantilla llevan licencia/atribución y se transportan como datos, no código.

## Migraciones y evolución

Las versiones de proyecto y dominio son independientes de la versión de app,
plantilla, renderer y payload PDF. No se interpreta una app más nueva con el
mismo formato como un cambio automático del modelo. Formatos/modelos futuros se
rechazan sin degradación.

`migrateProjectSnapshot` es una frontera **explícita**, optativa y sin pasos legacy
preinstalados. Preserva una copia exacta del snapshot de entrada, aplica pasos
únicos estrictamente ascendentes y revalida el resultado. El lector `.cvproj`
no activa migraciones implícitas ni convierte v0. El test v0 es un wrapper
artificial, no evidencia de una versión histórica. El respaldo del contenedor
completo y la integración transaccional se harán antes de usar migraciones en
biblioteca, en su fase; F2 no afirma recuperación durable ante fallos de disco.

Los tipos no soportados de V1/importación no se ignoran: exigen evolución del
contrato y su migración. No se promete abrir un proyecto futuro en lectura
limitada ni guardarlo bajo una versión anterior.
