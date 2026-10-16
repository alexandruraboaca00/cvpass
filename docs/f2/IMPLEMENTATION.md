# F2 — Dominio implementado

**Estado: implementación y revisión terminadas en `f2-domain-model`; ver
[VALIDATION.md](VALIDATION.md) para aceptación.** F1 cerrada e intacta. F3 no iniciada.
La fusión de la rama requiere aprobación del usuario.

## Estructura y límites

| Módulo | Responsabilidad real |
| --- | --- |
| `src/domain/primitives.ts` | UUID, fechas UTC, locales BCP 47, errores con ruta, datos JSON acotados y orden consistente |
| `dates.ts` | Año/mes/día, calendario, periodos abiertos/final solo/ongoing y ambigüedad por precisión |
| `content.ts`, `language.ts` | Texto semántico, clases A/B/C, spans protegidos, aprobaciones sensibles, estado de revisión y variantes visibles |
| `model.ts` | MasterProfile, CvDocument, Section/Entry MVP, contactos, activos, plantilla y presentación, validación de propiedad/IDs/órdenes |
| `operations.ts` | Creación de perfil/CV materializado, selección explícita de secciones, remapeo por ID, orden y visibilidad reversibles |
| `revisions.ts` | Snapshot recuperable, checkpoint fijado antes de traducción y restauración que produce una revisión nueva |
| `assets.ts`, `project.ts` | Referencias, recursos, workspace como dato portable y cierre exacto de dependencias de un CV o workspace |
| `export.ts` | ExportProjection y ExportPayload separados, construidos por lista permitida y solo desde lo incluido |
| `src/adapters/json.ts` | JSON UTF-8 estricto, sin claves duplicadas, prototipos peligrosos ni correcciones silenciosas |
| `zip-store.ts`, `cvproj.ts` | Codec portable ZIP versionado en memoria, validación de contenedor, inventario, integridad y límites |
| `asset-bytes.ts` | Bytes/hash/dimensiones de activos y verificación del PNG preparado para exportar |
| `migrations.ts` | Migración explícita optativa, copia exacta de entrada y validación del resultado; ningún legacy habilitado por defecto |

El dominio importa solo sus módulos y Zod. No conoce Electron, React, SQLite,
PDF.js, fflate, Node, sistema de archivos ni proveedores de traducción. Los
adaptadores de bytes usan Node/fflate; no escriben archivos ni acceden a la red.
`DomainContext` inyecta generación de IDs y reloj; el dominio no necesita conocer
el runtime que los proporcione.

## Modelo e invariantes

- Perfil y CV tienen contenido propio. Crear un CV selecciona secciones de un
  perfil y materializa los datos personales y las secciones elegidas. Copia
  profunda y nuevos IDs de CV, contactos, secciones, entradas, grupos, spans,
  campos sensibles y aprobaciones. Una colisión con un ID origen se rechaza.
  La procedencia de perfil solo conserva IDs/revisión informativos: no se consulta
  el perfil para editar, abrir o exportar ese CV. Ningún cambio se propaga.
- Datos personales como cabecera aparte; secciones de educación, trabajo,
  habilidades, idiomas, certificaciones, proyectos y personalizadas. Entradas
  mediante unión discriminada con campos por tipo. Añadir V1 requiere un nuevo
  tipo/validación y evolución explícita del contrato, no reutilizar un objeto
  genérico que pierda semántica.
- Mapas con clave = ID, IDs de objetos propios únicos y órdenes que son
  permutaciones exactas. Referencias de catálogo/plantilla/procedencia no se
  confunden con IDs propios. Las habilidades tienen listas por grupo y sin
  agrupar, sin un segundo `entryOrder` contradictorio. CEFR conserva sus cinco
  dimensiones independientes, incluso un único B1 oral.
- Fechas parciales sin convertir a UTC ni rellenar día/mes. Se rechaza un periodo
  inequívocamente invertido. Si los intervalos posibles se solapan, se conserva
  la precisión y `periodOrder` devuelve `ambiguous`. Ongoing excluye fecha final.
- Visibilidad de sección/entrada no borra datos. La selección de campos personales
  y sus contactos/direcciones se valida por ID. Contraer es un estado de UI futuro,
  no otra inclusión persistida en este modelo.
- Texto enriquecido propio: párrafos, saltos, negrita, cursiva, enlaces y listas
  ordenadas/no ordenadas. No almacena HTML/CSS ejecutable. Protocolos permitidos
  explícitos; no se cargan recursos remotos al resolver contenido.

## Idiomas y recuperación

A guarda un único valor/idioma activo y revisión, sin mapa de traducciones. Los
spans B usan índices **UTF-16**, con final exclusivo, sobre la cadena simple o el
texto enriquecido aplanado por `richText`; se validan texto, límites y solapes.
B mantiene el literal, idioma conocido/`und` y motivo de protección.

C conserva original/idioma/revisión, contexto, decisión y aprobación seleccionada.
La memoria contiene las aprobaciones con fuente/contexto, destino, fecha y
procedencia. Su estado es derivado (`pending`, `original`, `approved`, `stale`,
`imported`), evitando un booleano almacenado que pueda quedar desincronizado.
Cambiar original/contexto conserva las aprobaciones y las identifica obsoletas;
no se pueden proyectar como traducción válida hasta revisarlas. Traducción +
original produce ese orden. Al materializar se transfiere únicamente memoria
correspondiente a los campos/contextos seleccionados.

El helper de reconstrucción desde valores visibles no es un importador PDF.
Una traducción visible sola tiene original desconocido y ninguna aprobación
inventada. Si se ven ambos roles, conserva ambos textos/idiomas en ese orden,
sin afirmar que haya recuperado una aprobación oficial o su historial.

`checkpoint` hace una copia independiente; `beforeTranslation` exige retención
`pinned`. Restaurar produce otra revisión del mismo CV, sin alterar el actual ni
el checkpoint. Dos estados distintos no pueden declarar el mismo número de
revisión. No hay rotación automática, borrado de puntos fijados ni escritura de
historial a SQLite en F2; su integración transaccional corresponde a F3/F5.

## Proyecto privado y salida visible

[CVPROJ.md](CVPROJ.md) define el formato inicial implementado. Tanto CV como
workspace pueden serializarse/deserializarse con sus assets y revisiones. Un
proyecto de CV excluye perfil, otros CV, sus blobs y cualquier dato fuera de su
cierre de dependencias. El proyecto conserva sus secciones ocultas, imágenes
originales, aprobaciones y checkpoints, incluidos activos de estados anteriores.
No se admite configuración con caches, borradores temporales, credenciales o rutas
locales de la aplicación.

La proyección PDF es otro contrato. Filtra secciones/entradas/campos personales
excluidos, resuelve únicamente las variantes lingüísticas impresas, reduce fechas
a la precisión elegida y elimina IDs/procedencia/historial/memoria/nombre privado.
Las imágenes requieren un `ImagePreparation` explícito; si falta, falla en vez de
copiar el original. El adaptador de payload verifica el PNG normalizado, sin
chunks de EXIF/texto, su hash y dimensiones. La preparación/crop real se integra
con el motor de render en F7/F8; F2 no implementa ese motor ni altera F1.

## Concreciones y límites frente al modelo conceptual

- Asset separa metadatos de `Map<SHA-256, Uint8Array>` en el adaptador. El ZIP tiene
  bytes reales, no rutas ni enlaces temporales. La igualdad de hashes permite
  deduplicar bytes, conservando IDs y roles de cada referencia.
- TemplateDefinition es declarativa: ID/versión, contrato de render, disposición,
  capacidades y recursos/licencias. No incluye CSS ejecutable ni plantillas
  finales; no se promete un renderizador F7 que aún no existe.
- La selección inicial de creación copia todos los datos personales del perfil
  junto con las secciones elegidas; la visibilidad posterior es independiente.
  Selección/revisión de campos y transferencias adicionales se integrarán con
  la biblioteca/editor en fases posteriores, sin sincronización automática.
- Texto enriquecido MVP admite listas con párrafos; anidamiento arbitrario de
  listas no se admite en v1. C se usa para campos de texto; la narrativa enriquecida
  tiene clase A con spans protegidos. No se anuncian variantes genéricas no soportadas.
- Workspace es exclusivamente una instantánea portable con perfil, CV, orden e
  idioma de UI. Guardado automático, borradores, fallos de disco, recuperación tras
  cierre, concurrencia de ventanas y restauración sobre biblioteca son F3.
- SourceArtifact, registros de importación y datos no mapeados del importador F6
  aún no forman parte del contrato v1. Si aparecen claves o tipos no soportados,
  se rechaza el archivo íntegro; no se abre y reescribe eliminándolos en silencio.
- La infraestructura de migración no implica compatibilidad con v0: solo hay v1
  publicada por esta rama. Las pruebas de transformación v0 son sintéticas y
  explícitas; las versiones desconocidas/futuras siguen rechazadas por el lector.

## Dependencias y deuda reconocida

Zod 4.6.7 y fflate 0.8.3: MIT; TypeScript 7.0.2: Apache-2.0;
`@types/node` 26.6.5: MIT. Versiones fijadas en el lockfile raíz, independiente
del spike F1. Auditoría F2: cero vulnerabilidades.

Quedan para sus fases la integración durable/atómica, UI, importadores, motores y
render final. El PNG inicial admite RGB/RGBA de 8 bits sin entrelazado; otros PNG
se rechazan explícitamente. JPEG verifica integridad y dimensiones por cabecera,
no es un decodificador completo. Nuevas representaciones/formatos necesitan
validación y evolución de contrato, sin normalizar valores inválidos en silencio.
Las incidencias de Poppler, VA-API, avisos de desarrollo y pesos ONNX siguen en
F1; no se convirtieron en trabajo de esta fase.
