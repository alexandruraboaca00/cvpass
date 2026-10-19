# Modelo de datos de CVForge

Versión 0.8 · 19 de octubre de 2026 · Especificación conceptual y concreciones F2/F3/F5/F6/F7/F8. El dominio MVP y el contrato portable inicial están implementados; correspondencias y límites en [f2/IMPLEMENTATION.md](f2/IMPLEMENTATION.md). La biblioteca, revisiones, activos y borradores son durables en F3; [esquema y límites](f3/PERSISTENCE.md). La importación estructurada F6 se concreta en [f6/IMPORT.md](f6/IMPORT.md); inventario V1 e importadores genéricos siguen siendo especificación.

## Convenciones y principios [D]

**Todo el modelo es una decisión de diseño nuestra [D].** Perfil materializado, biblioteca automática, `.cvproj` completo, PDF limitado a su exportación y política lingüística A/B/C son decisiones finales del usuario; su estructura conceptual se concreta aquí. Los nombres XML Europass solo pertenecen al adaptador. Hechos y límites: [REQUIREMENTS.md](REQUIREMENTS.md); almacenamiento/adaptadores: [ARCHITECTURE.md](ARCHITECTURE.md).

- Identificadores opacos estables —UUID propuestos—, independientes de títulos, fechas y posiciones.
- Metadatos de tiempo en UTC; fechas de trayectoria como fechas de calendario, sin convertirlas a instantes UTC.
- Colecciones con mapa por ID y una lista de IDs para el orden; ninguna segunda propiedad `position` que pueda contradecirla.
- Contenido y presentación separados. Los CV son instantáneas materializadas independientes del perfil maestro.
- Narrativa: texto activo y recuperación por revisiones. Términos sensibles: original y traducciones aprobadas reutilizables. Literales: valor protegido. El idioma de una etiqueta no prueba el de un texto libre.
- El modelo completo privado y `ExportProjection`/`ExportPayload` son contratos separados. El segundo no es una serialización del primero.
- Valores ausentes explícitos, con semántica por campo; evitar cadenas vacías para representar fechas, niveles o referencias inexistentes.
- Los datos desconocidos se preservan y se explican. Conservar el archivo de origen no permite afirmar que un campo ya se haya importado funcionalmente.

## Entidades y propiedad del contenido [D]

| Entidad | Función | Propietario/relación |
| --- | --- | --- |
| `Workspace` | Biblioteca, configuración, perfil y CV. | Una instalación local; exportable como copia lógica. |
| `MasterProfile` | Trayectoria completa y variantes reutilizables. | Un perfil activo en el MVP. |
| `CvDocument` | Contenido seleccionado y presentación de un CV. | Independiente del perfil y de otros CV. |
| `Section` / `Entry` | Organización y contenido tipado. | Pertenecen a un único perfil o CV; copiar genera IDs nuevos. |
| `Asset` | Imagen o archivo original almacenado por hash. | Reutilizable por referencia dentro de la biblioteca. |
| `FormDraft` | Edición temporal recuperable. | Separado de las revisiones confirmadas. |
| `Revision` | Estado confirmado recuperable. | Historial de un perfil o CV. |
| `TranslationOperation` | Propuestas temporales y revisión sobre una revisión base. | No modifica el CV hasta aplicar atómicamente con checkpoint previo. |
| `SensitiveTranslationMemory` | Traducciones sensibles aprobadas y contexto. | Biblioteca/proyecto privado; copiar entre perfil y CV requiere transferencia explícita. |
| `ExportProjection` / `ExportPayload` | Contenido efectivamente representado en una exportación. | Sin referencias a contenido privado excluido. |
| `TemplateDefinition` | Diseño original y capacidades. | Recurso de la aplicación, versionado. |
| `ImportRecord` / `ImportProposal` | Origen, correspondencias y revisión. | Sin cambios sobre un CV hasta confirmar. |
| `ExportRecord` | Archivo producido y estado del que procede. | Vinculado a revisión y composición concretas. |

Un `CvDocument` nunca necesita resolver un `MasterEntryId` para mostrar o exportar su contenido. Una referencia al perfil es procedencia opcional, no una clave de la que dependa la integridad del CV.

## Workspace y perfil maestro [D]

| Entidad/campo | Contenido |
| --- | --- |
| `Workspace.id` | Identidad de la biblioteca; se remapea al restaurar como copia si hay colisiones. |
| `Workspace.profileId`, `cvIds` | Perfil y CV de la biblioteca. |
| `Workspace.settings` | Idioma de interfaz, preferencias de recuperación/historial y últimos destinos locales. Estas rutas no se distribuyen en PDF. |
| `MasterProfile.id`, `revision`, `createdAt`, `updatedAt` | Identidad y control de versiones. |
| `MasterProfile.personalInformation` | Datos personales completos de origen. |
| `MasterProfile.sectionsById`, `sectionOrder` | Secciones y entradas de la trayectoria. No implican inclusión en un CV concreto. |
| `MasterProfile.sensitiveTranslationMemory` | Aprobaciones contextualizadas propias del perfil; se materializan al transferir contenido a un CV, nunca se referencian como datos vivos. |
| `MasterProfile.sourceRefs` | Importaciones o versiones de procedencia opcionales. |

Copiar al CV materializa los datos elegidos y añade una procedencia con `profileId`, `profileEntryId` y `profileRevision`. Editar el perfil no modifica CV existentes. Copiar desde un CV al perfil requiere selección/revisión explícita; no se deduplican personas, títulos o certificados por coincidencia textual.

## CV [D]

| Campo de `CvDocument` | Tipo/semántica |
| --- | --- |
| `id`, `revision`, `createdAt`, `updatedAt` | Identidad propia y revisión de confirmación. |
| `name` | Nombre privado para la biblioteca; distinto del nombre de la persona y del título visible del PDF. |
| `documentTitle` | Título visible opcional, traducible cuando corresponda. |
| `personalInformation` | Copia completa de los datos seleccionados para este CV. |
| `sectionsById`, `sectionOrder` | Secciones propiedad del CV y orden explícito. Información personal se presenta como cabecera aparte. |
| `documentLocale` | Idioma confirmado del CV, inicialmente `es` o `en`; cambia junto con el contenido al aplicar traducción, no antes. |
| `languagePolicy` | Clasificación A/B/C, fragmentos protegidos y decisiones de presentación de campos sensibles. |
| `sensitiveTranslationMemory` | Aprobaciones reutilizables propias del CV, materializadas al copiar del perfil; sin dependencia de una memoria externa mutable. |
| `presentation` | Plantilla, versión y ajustes de renderización. |
| `sourceRefs`, `unmappedDataRefs` | Procedencia y elementos no recuperados completamente. No se ocultan al revisar/exportar. |
| `validationIssues` | Resultados derivados, no una segunda copia editable de los datos. Se recalculan al migrar/abrir. |

Al duplicar/importar como copia se regeneran IDs locales y se remapean todas las referencias de forma consistente. Se mantienen hashes de activos y procedencia. Las traducciones y referencias internas no se emparejan por índice de lista.

## Datos personales y valores comunes [D]

### Información personal

| Campo | Representación propuesta |
| --- | --- |
| Nombre de presentación | Cadena obligatoria para crear un CV nuevo; se admiten nombres de una sola parte. |
| Nombre, apellidos y otros nombres | Campos opcionales separados cuando el usuario o el origen los suministran. No se reconstruyen automáticamente a partir de una cadena. |
| Titular profesional / sobre mí | `ContentField<string>` y `ContentField<RichTextDoc>` opcionales. La narrativa es A; un cargo ambiguo puede ser C. |
| Email, teléfono, dirección, web, redes | Listas de elementos con ID, etiqueta/tipo y valor. Teléfono conserva prefijo y número como texto; no como número entero. |
| Dirección | Líneas, localidad, región, código postal y país opcionales. Mantener el texto original cuando no pueda descomponerse con certeza. |
| Foto | Referencia a `Asset`, recorte/encuadre y ajuste visible independientes del archivo. |
| Nacimiento, nacionalidad, género, identificación y permisos | Opcionales y seleccionables para cada CV; solo se muestran si se eligen. Datos del origen sin soporte de UI permanecen identificados como no mapeados. |

El nombre de presentación obligatorio es nuestra regla para CV nuevos, distinta de exigir nombre y apellidos por separado. Una importación incompleta no descarta el documento: se conserva y se pide revisar lo necesario antes de exportar.

### Identificadores lingüísticos y geográficos

Idiomas mediante etiquetas BCP 47 cuando sean conocidas; `und` para idioma de contenido indeterminado. Países mediante código normalizado cuando sea fiable, más etiqueta original de respaldo. No inferir una traducción de un nombre de empresa por el país, ni asignar el idioma del documento a todos sus campos sin revisión.

### Campos lingüísticos `ContentField<T>`

La unión discriminada siguiente sustituye el mapa universal de traducciones por idioma de la versión 0.1. `T` es texto o `RichTextDoc`; los valores identificadores/contactos mantienen sus tipos propios y política B.

| Variante | Contenido persistente | Invariantes |
| --- | --- | --- |
| A — `NarrativeField<T>` | `current.value`, `current.locale`, revisión del campo y fragmentos protegidos cuando proceda. | Confirmar traducción sustituye el texto activo después de fijar la revisión anterior. No hay mapa permanente de todas las narrativas por idioma. |
| B — `LiteralField<T>` | Valor literal, idioma conocido/`und` y protección de entidad/término. | Traducir el CV no cambia el valor. Puede editarse expresamente como dato, no mediante el traductor automático. |
| C — `SensitiveField<T>` | Original/idioma/revisión cuando se conocen; traducciones aprobadas contextualizadas; idioma de salida y `displayMode`. | Una propuesta no es una aprobación ni una equivalencia oficial. Los originales conocidos se conservan en el proyecto. |

En C, `displayMode` es `original`, `translation` o `translationAndOriginal`: este último imprime **traducción + original**, en ese orden. Si falta una traducción aprobada, el usuario debe aprobar una propuesta, corregirla o elegir conservar el original explícitamente; no se declara traducido un término pendiente. Nombres de empresas/instituciones pertenecen a B, incluso cuando acompañan un título C.

Una aprobación sensible contiene valor destino, idioma destino, revisión/huella del original, contexto —tipo de campo, institución/ámbito cuando importe—, fecha y procedencia de aprobación. Cambiar el original/contexto deja sus aprobaciones pendientes de revisión, conservándolas. El texto coincidente por sí solo no demuestra equivalencia reutilizable.

Las propuestas narrativas/sensibles viven en `TranslationOperation` hasta confirmar o cancelar. Tras confirmar, A conserva solo texto activo; C incorpora las aprobaciones elegidas a la memoria privada. Las revisiones sirven para recuperación, no para construir por defecto una colección perpetua de narrativas traducidas.

### Traducción completa y recuperación

| Campo de `TranslationOperation` | Semántica |
| --- | --- |
| `id`, `cvId`, `baseRevision` | Operación propia y control de concurrencia. |
| `sourceLocale`, `targetLocale` | Idioma actual y destino; ES/EN en MVP. |
| `fieldPlan` | IDs/rutas estables, clase A/B/C, propuestas, correcciones, decisiones y fragmentos B protegidos dentro de narrativas. |
| `status` | Preparando, generando, revisando, aplicado, cancelado o fallido; el estado temporal no se confunde con el CV confirmado. |
| `preTranslationRevisionId` | Checkpoint recuperable completo fijado antes de aplicar; obligatorio para una operación aplicada. |
| `appliedRevisionId` | Nueva revisión con contenido, idioma, presentaciones sensibles y aprobaciones aceptadas. |

La transacción comprueba `baseRevision`, fija el checkpoint y confirma todo el resultado. Si hay conflicto, error o cancelación, permanece el CV anterior. Duplicar antes crea otro CV independiente y permite traducirlo sin modificar la versión española.

Los checkpoints necesarios se incluyen en `.cvproj` y quedan fuera del PDF. Su limpieza es explícita; la rotación ordinaria de historial no los elimina. Los modelos/credenciales del proveedor no son datos del CV ni se empaquetan con él.

### Reimportar una versión lingüística visible

Si el PDF solo muestra una traducción C, `ExportPayload` no contiene su original ni aprobaciones privadas. El CV reconstruido conserva `importedVisibleVariants` —valores/idiomas/roles mostrados— y un original desconocido, sin inventarlo ni añadir una entrada a la memoria de traducciones aprobadas. Esa representación permite editar/reproducir lo visible. Para afirmar un original oficial o reutilizar una equivalencia, hará falta aportarlo y revisarlo.

Si se mostraron traducción + original, se recuperan ambos textos como tales; el historial y las aprobaciones no visibles siguen sin recuperarse. Abrir `.cvproj` sí restaura originales, decisiones y memoria sensibles completas. Una importación no obliga a reconstruir datos que nunca se exportaron.

### Fechas y periodos

| Tipo | Campos e invariantes |
| --- | --- |
| `PartialDate` | `precision: year / month / day`; `year`; `month` solo si corresponde; `day` solo con precisión día. Calendario validado. |
| `Period` | `start: PartialDate o null`, `end: PartialDate o null`, `ongoing: boolean`. Se permite solo fecha final. |
| `FormDraft.rawDateInputs` | Texto/selectores todavía incompletos o inválidos. No se convierte silenciosamente en una fecha nula. |

No se añade día 1 a un año o mes ni se transforma una fecha a UTC. Para comparar periodos se calcula el intervalo de fechas posibles: se bloquea cuando la última fecha posible del final es anterior a la primera fecha posible del inicio. Cuando la precisión no permite resolver el orden, se mantiene esa precisión y se explica la ambigüedad.

Un periodo confirmado con `ongoing=true` no tiene fecha final. El formulario puede recordar temporalmente el final previo al activar Ongoing para permitir deshacer dentro del borrador. Si una importación trae ambos valores contradictorios, se conserva el origen y se solicita resolver el conflicto; no se elimina uno sin indicarlo.

### Texto enriquecido y enlaces

`RichTextDoc` es un árbol propio con documento, párrafos, texto, salto de línea, listas ordenadas/no ordenadas y elementos de lista; marcas de negrita, cursiva y enlace. Conserva estructura, no CSS arbitrario. Las URL/contactos tienen IDs propios y validación por tipo.

El adaptador interpreta las listas según su semántica observada, no únicamente por `<ol>`/`<ul>`: el editor investigado llegó a representar viñetas con atributos dentro de `<ol>`. Se admiten protocolos necesarios de forma explícita; el texto/HTML importado no introduce scripts ni recursos remotos de impresión. Fuente: [19](research/19-fotografia-firma-y-texto-enriquecido.md) y [20](research/20-plantillas-paginacion-y-rendimiento.md).

## Secciones, entradas, orden y visibilidad [D]

| Entidad/campo | Semántica |
| --- | --- |
| `Section.id`, `kind` | Identidad y discriminante del tipo. Puede haber varias secciones `custom`. |
| `Section.title` | Clave de etiqueta estándar o nombre personalizado A/C según contexto. No sustituye el título de cada entrada. |
| `Section.entriesById`, `entryOrder` | Entradas y su orden manual estable. |
| `CvSection.included` | Si forma parte de la salida; ocultar no borra. El perfil maestro no necesita este estado de selección de un CV. |
| `Entry.id`, `kind`, `fields` | Unión discriminada de campos tipados; `kind` determina las invariantes. |
| `CvEntry.included` | Inclusión individual cuando se selecciona contenido para el CV. |
| `Entry.sourceRef` | Procedencia opcional de perfil/importación. |
| `Entry.createdAt`, `updatedAt` | Metadatos; nunca determinan automáticamente el orden visible. |
| `EditorViewState.collapsedSectionIds` | Contraer solo afecta a la sesión/interfaz; no equivale a ocultar del PDF. |

Cada ID de orden aparece exactamente una vez y pertenece al contenedor. Reordenar cambia exclusivamente la lista de IDs. Eliminar referencia el historial para recuperación; ocultar solo cambia `included`. Secciones vacías pueden existir durante edición, pero no generan bloques vacíos en el PDF. Estas reglas de visibilidad son nuestras; no se atribuyen al Hide observado.

## Tipos de entrada principales [D]

| Tipo | Datos mínimos y opcionales | Reglas |
| --- | --- | --- |
| `education` | Título C; organización B; periodo; localización; EQF; web/dirección; campo de estudio/asignaturas C; nota; tesis; materias/competencias; clasificación nacional; tipo/cantidad de créditos; validez; enlaces. | Título no blanco. No inventar equivalencias de títulos/EQF/créditos. Fecha final sin inicial permitida. Clasificar narrativa y términos oficiales por significado. |
| `work` | Puesto A o C si ambiguo; empleador B; periodo; localización; responsabilidades A con fragmentos B protegidos; sector; departamento; contacto/web; enlaces. | Puesto libre admitido. Los cargos ambiguos requieren revisión sensible; empleador y marcas mantienen nombre oficial. |
| `skill` | Etiqueta A/B/C según término; grupo opcional; referencia de catálogo opcional con sistema, ID y versión. | Texto libre siempre disponible. Proteger tecnologías/marcas; revisar términos ambiguos. El catálogo no autoriza sustituir una etiqueta personalizada. |
| `nativeLanguage` | Código de idioma o denominación libre de respaldo. | Varias lenguas maternas. No confundir idioma nativo con nivel C2 de una lengua extranjera. |
| `foreignLanguage` | Código/denominación y cinco destrezas independientes. | Cada destreza es A1, A2, B1, B2, C1, C2 o `null`; no hay nivel global obligatorio. |

Los grupos de habilidades tienen `id`, nombre traducible y orden propio. En el MVP una habilidad pertenece a un grupo o queda sin agrupar. El orden de habilidades se mantiene por grupo; al moverla se actualiza su pertenencia y orden en una única operación. La vista sin agrupar tiene su propia lista. Estas listas contienen cada habilidad una sola vez y sustituyen el `entryOrder` genérico para esta sección, evitando dos órdenes contradictorios. Eliminar un grupo mueve sus habilidades al final de la lista sin agrupar, conservando su orden relativo; eliminar una habilidad es otra operación.

La sección de idiomas conserva el orden de entradas y sus tipos nativo/extranjero; la plantilla puede presentarlos en dos grupos manteniendo el orden relativo dentro de cada uno. Las cinco claves CEFR son `listening`, `reading`, `spokenInteraction`, `spokenProduction` y `writing`. La leyenda CEFR es un ajuste visual, no otro valor de nivel.

## Inventario de los 14 tipos adicionales [D]

El inventario proviene de [15](research/15-inventario-secciones-adicionales.md), [16](research/16-ciclo-secciones-pdf.md), [18](research/18-multiples-orden-y-visibilidad.md) y [19](research/19-fotografia-firma-y-texto-enriquecido.md). La siguiente estructura y las reglas para nuevas entradas son nuestras. Los opcionales permanecen opcionales; una importación incompleta se señala sin destruirla.

| Tipo / fase | Campo requerido propuesto | Otros datos tipados |
| --- | --- | --- |
| Certificaciones / MVP | Título | Emisor, fecha de expedición, descripción enriquecida, modalidad de aprendizaje y enlaces. Modalidad admite valor conocido o texto de origen no reconocido. |
| Proyectos / MVP | Título | Periodo/Ongoing, descripción y enlaces. |
| Personalizada —Other— / MVP | Nombre de sección y título de entrada | Periodo/Ongoing, descripción y enlaces. Varias secciones con nombres distintos; cada una con varias entradas. |
| Conferencias/seminarios / V1 | Título | Localización, inicio/final, descripción y enlaces; Ongoing no se exige por no haberse observado en este formulario. |
| Obras creativas / V1 | Título | Periodo/Ongoing, descripción y enlaces. |
| Permisos de conducir / V1 | Categoría o denominación personalizada por permiso | Catálogo AM, A1, A2, A, B1, B, BE, C1, C1E, C, CE, D1, D1E, D, DE; validez inicial/final opcional por permiso. Rechazar filas vacías al confirmar. |
| Aficiones / V1 | Título | Descripción y enlaces. |
| Premios / V1 | Título | Entidad otorgante, fecha, descripción y enlaces. |
| Redes/asociaciones / V1 | Título | Localización, periodo/Ongoing, descripción y enlaces. |
| Publicaciones / V1 | Título | Referencia bibliográfica libre, año, URL, autores como texto de origen, revista/congreso, volumen/número/páginas, editor, descripción y enlaces. |
| Recomendaciones / V1 | Descripción | Nombre, email, teléfono/prefijo, cargo y enlaces opcionales. No forzar un título o contacto. |
| Actividad social/política / V1 | Título | Localización, periodo/Ongoing, descripción y enlaces. |
| Voluntariado / V1 | Título | Localización, periodo/Ongoing, descripción y enlaces. |
| Declaración final / V1 | Ninguno si permanece vacía en edición | Texto de declaración, lugar, fecha y activo de firma opcional. Un bloque totalmente vacío no se imprime. Es un bloque único por CV en esta propuesta. |

La referencia bibliográfica y los campos desglosados no se sincronizan automáticamente: no se observó tal relación. Un campo XML denominado DOI/Link no demuestra que deba normalizarse como DOI; se conserva su valor y significado de origen.

Las doce familias repetibles del inventario —todas salvo declaración final y el conjunto de permisos— usan entradas independientes. El conjunto de permisos contiene elementos con ID y validez propia. La decisión de un único bloque final y de eliminar filas vacías es nuestra. No convertir todos estos tipos a una estructura universal `title + description` que pierda semántica.

## Activos y procedencia [D]

| Entidad/campo | Semántica |
| --- | --- |
| `Asset.id`, `sha256`, `mediaType`, `byteLength` | Identidad/deduplicación y comprobación de integridad. |
| `Asset.bytes`, dimensiones | BLOB o entrada del paquete; dimensiones verificadas para imágenes. Nunca depender de una URL temporal. |
| `Asset.role` | Foto, firma o archivo original; el rol no se deduce solo del MIME o del nombre XML. |
| `ImagePlacement` | Referencia al activo, recorte, orientación y visibilidad de esa imagen en el CV. |
| `SourceArtifact` | Archivo original inmutable, hash, tipo, nombre de origen y fecha de incorporación. La ruta absoluta solo pertenece a configuración privada si hace falta. |
| `SourceRef` | Artefacto/perfil, adaptador y versión; ruta semántica XML o página/fragmento del PDF. |
| `UnmappedDatum` | Ruta/contexto, valor original, motivo y estado de resolución; puede referenciar el artefacto íntegro. |

Normalizar una imagen no reemplaza el original privado. `.cvproj` puede conservarlo y su transformación. El PDF y su payload solo usan la representación recortada/enmascarada realmente mostrada, sin píxeles excluidos ni EXIF privado. Foto y firma son roles separados aunque el XML comparta un `FileType`. Una firma gráfica no añade autenticación criptográfica.

## Importación, revisión y datos parciales [D]

| Campo | Contenido |
| --- | --- |
| `ImportRecord.id`, `sourceArtifactId` | Operación y origen inmutable. |
| `detectedFormat`, `adapterVersion` | `.cvproj` completo, payload de PDF propio, familia XML Europass, texto genérico u OCR; versión del adaptador al dominio. |
| `candidateSources` | Adjuntos o rutas alternativas detectadas y cuál se eligió. |
| `fieldMappings` | Campo destino, fragmento/página/ruta de origen y transformación aplicada. |
| `issues` | Errores, ambigüedades, campos desconocidos y ajustes no recuperados. |
| `status` | Propuesta, pendiente de revisión, aceptada, cancelada o fallida. |
| `targetCvId`, `acceptedAt` | Se fijan al confirmar la operación. |

Una misma entrada Abrir/Importar detecta estas rutas; los detalles técnicos quedan en el informe, sin exigir elegir parser. Se distingue recuperación de proyecto completo, versión PDF representada, recuperación estructurada Europass, parcial y reconstrucción asistida. El OCR puede estimar confianza por fragmento; no se inventa una puntuación comparable para XML exacto. Los elementos no clasificados siguen accesibles.

Antes de exportar un resultado parcial se exige resolver o excluir explícitamente esos elementos. El proyecto privado conserva origen/registro; el PDF no incluye datos no representados, ni siquiera resúmenes de exclusiones que revelen qué contenido personal se descartó.

## Plantillas y configuraciones [D]

| Entidad/campo | Contenido |
| --- | --- |
| `TemplateDefinition.id`, `version` | Diseño original y versión inmutable. `simple` y `lateral` son las dos propuestas iniciales. |
| `rendererContractVersion` | Versión del contrato que consume el renderizador. |
| `capabilities` | Tipos, foto/firma, columnas y ajustes admitidos. Una limitación de plantilla debe comunicarse. |
| `resourceRefs` | Fuentes/recursos propios o con licencia, hashes y atribuciones cuando correspondan. |
| `PresentationSettings.templateRef` | ID y versión exacta solicitada. |
| `density`, `accentColor`, `fontFamily` | Preset compacto/normal/amplio, color validado y fuente local disponible. No CSS libre importado. |
| `page`, `numbering` | A4 vertical inicial y numeración; márgenes/control de cortes definidos por plantilla. |
| `dateFormat`, `showCefrGuide` | Presentación de fechas y leyenda. El formato no inventa partes ausentes de una fecha. |
| `personalFieldVisibility`, `photoPlacement`, `signaturePlacement` | Selección/encuadre visual; la firma se habilita con la fase que la soporta. |
| `section/entry.included`, `languagePolicy` | Orden/visibilidad y decisiones de idioma pertenecen al CV; el PDF solo recibe la selección resuelta. |

La configuración de interfaz —panel contraído, zoom del visor, ventana— se almacena aparte. No forma parte de la semántica del PDF. La configuración de plantilla propia no importa logos, fuentes o estilos de Europass.

## Borradores, revisiones y versiones [D]

| Concepto | Datos y comportamiento |
| --- | --- |
| `FormDraft` | ID, entidad/ruta objetivo, revisión base, valores temporales, texto de fechas inválidas, activos temporales y fecha de recuperación. Nunca se exporta como contenido confirmado. |
| `Revision` | ID, entidad, número creciente, instantánea confirmada, causa, fecha y retención ordinaria/fijada. Checkpoint antes de traducción completa, incluido en `.cvproj`. Restaurar crea otra revisión. |
| `ExportRecord` | Registro privado: CV/revisión, plantilla/configuración, digest de proyección/composición, fecha y hash del PDF final. Ruta local opcional; no se copia al payload. |
| `RenderSnapshot` | Estado privado congelado y `ExportProjection` derivada, versiones de recursos/motor y composición. Solo la proyección puede alimentar el payload. |
| `ExportProjection` | Secciones/campos/valores e imágenes representados, orden visible y configuración efectiva, sin referencias privadas. |
| `ExportPayload` | Serialización validada y versionada de la proyección efectivamente compuesta. Ningún campo opcional permite añadir el proyecto privado. |

Se versionan por separado:

- `appVersion`: aplicación que creó/leyó el archivo.
- `storageSchemaVersion`: estructura física de la biblioteca SQLite.
- `domainModelVersion`: significado y estructura del modelo de CV/perfil.
- `projectFormatVersion`: manifiesto y contenedor portable.
- `pdfPayloadFormatVersion`: contrato reducido de esa exportación; independiente de `.cvproj` y del modelo privado.
- `templateVersion` y `rendererVersion`: composición visual solicitada.
- `revision`: cambios de una entidad; no sustituye versiones de formato.

Las migraciones preservan una copia recuperable, validan invariantes y registran origen/destino. Un formato futuro incompatible se abre como no compatible o en lectura limitada; no se guarda perdiendo campos. Las versiones de modelo, contenedor y renderizador no tienen por qué avanzar a la vez.

## Formato portable y reapertura de PDF [D]

### Paquete `.cvproj`

| Elemento lógico | Contenido |
| --- | --- |
| `manifest.json` | Identificador propio de formato, versiones, `scope`, `payloadPolicy`, fecha, creador y listado de ficheros con tamaño/hash. |
| `snapshot.json` | CV completo o workspace, según `scope`: datos ocultos/excluidos, orden/visibilidad, estado lingüístico y memoria sensible incluidos. UTF-8 validado. |
| `assets/<hash>` | Bytes de los activos referenciados, sin rutas externas. |
| Plantilla/recursos | Definición declarativa validada, versión y recursos necesarios, con licencias; no ejecutar código arbitrario importado. Si el motor no soporta la versión, conservarla y señalarlo sin reescritura destructiva. |
| Revisiones/memorias | Historial necesario para continuar y checkpoints fijados, especialmente pretraducción; originales y traducciones sensibles aprobadas/contexto. |
| Registros privados | Orígenes/datos no mapeados y borradores declarados cuando forman parte del proyecto. Incluir todas las dependencias de lo que se promete recuperar. |

`scope` distingue proyecto completo de un CV y backup completo de workspace; `payloadPolicy` declara el alcance privado correspondiente. No existe una política `.cvproj` distribuible dentro del PDF. El identificador de formato prima sobre extensión/nombre. Se rechazan rutas absolutas, ascensos de directorio, enlaces simbólicos, duplicados ambiguos, hashes incorrectos y límites de expansión excedidos. Los hashes verifican integridad, no autoría.

### Contrato independiente del PDF: solo esa exportación

La exportación normal **Exportar → PDF** puede adjuntar un `ExportPayload` con identificador propio de formato —distinto de `.cvproj`— y `pdfPayloadFormatVersion`. Su codificación concreta se valida en F1. Se construye por lista permitida desde `ExportProjection`, no recortando un proyecto serializado.

| Contenido admitido | Restricción |
| --- | --- |
| Secciones/entradas/campos | Solo los representados; tipo y orden visibles. IDs nuevos limitados a esta exportación, sin IDs de perfil/biblioteca. |
| Valores lingüísticos | Únicamente textos mostrados, idioma y rol semántico si es necesario. Traducción + original transporta ambos; traducción sola no transporta el original. |
| Fechas/periodos | Partes y precisión efectivamente representadas; si solo se muestra año, no adjuntar día/mes de la fecha privada completa. |
| Activos | Representación efectivamente usada y normalizada, con recortes/máscaras materializados y sin EXIF privado; no originales no mostrados. |
| Plantilla/configuración | ID/versión y opciones efectivas necesarias para reconstruir la presentación; sin mapas de secciones/campos ocultos. |
| Integridad | Versión del contrato y hashes de la proyección/activos distribuidos; nunca de una instantánea privada más amplia. |

Quedan fuera secciones/campos ocultos, contenido excluido, perfil maestro, otros CV, historial, borradores, traducciones alternativas, versiones lingüísticas no mostradas, memorias sensibles privadas, originales de importación, datos no resueltos, procedencia, rutas, nombres privados de biblioteca y credenciales. No hay referencias a esos elementos ni resúmenes privados de lo omitido.

Esta restricción es una decisión final, no una opción de exportación. El PDF se abre normalmente en lectores comunes. Su payload es una ayuda para recuperar esa versión; una herramienta puede retirarlo sin invalidar el documento ni comprometer el backup fiable `.cvproj`.

### Reapertura y criterios de equivalencia

Abrir `.cvproj` → validar/migrar → recuperar proyecto completo de su alcance. Abrir PDF → localizar/validar payload → recuperar versión representada → crear CV independiente. Si no hay payload compatible, buscar información Europass y, en su ausencia, tratar como PDF normal para la ruta asistida/OCR posterior. Si falta la plantilla exacta, conservar datos/configuración e informar antes de sustituir el diseño.

La equivalencia de `.cvproj` compara el proyecto completo: campos ocultos, fechas privadas con su precisión, memoria sensible/aprobaciones, decisiones, orden/visibilidad, activos, plantilla y revisiones/checkpoints necesarios. La equivalencia de PDF compara exclusivamente `ExportProjection`: valores y variantes mostrados, fechas representadas, grupos/orden visibles, activos usados y presentación. No exige recuperar historia, originales lingüísticos no impresos, datos excluidos ni revisiones desde PDF. IDs locales pueden regenerarse; no se exige igualdad binaria entre versiones de Chromium.

Un hash del payload no demuestra correspondencia si otra herramienta editó solo las páginas; la revisión permite comparar ambas fuentes. El hash del PDF final se guarda en `ExportRecord` privado después de generar el archivo, no dentro de su manifiesto. Si desaparece el payload, se conserva un PDF válido y se usa la ruta de PDF normal, sin presentarlo como corrupción del proyecto.

### Copias de workspace

La copia completa de workspace recupera perfil, CV, activos, decisiones, memorias y revisiones/puntos necesarios, incluyendo las dependencias que declare. Se valida en una biblioteca vacía. Restaurar sobre una biblioteca existente permite copia nueva o sustitución respaldada, sin fusionar por nombre. La operación es transaccional.

## Invariantes para la validación futura [D]

1. Ningún CV exportable depende de contenido mutable del perfil maestro o de otro CV.
2. Toda referencia de activo necesaria se resuelve; todo orden corresponde a sus IDs, sin duplicados.
3. Ocultar y contraer nunca eliminan datos. El borrador nunca se filtra a una exportación.
4. Las cinco destrezas CEFR y la precisión de fecha se conservan por separado.
5. A conserva texto activo y recuperación previa; B no cambia por traducción; C conserva original conocido y aprobaciones privadas revisables. No se fabrican originales al importar un PDF.
6. Confirmar contenido, historial y referencias de activos es atómico; Cancelar no crea una revisión confirmada.
7. Un formato o dato no soportado se comunica y preserva en el ámbito privado adecuado; no desaparece por guardar.
8. `.cvproj` permite recuperar completamente el proyecto de su alcance. El PDF solo permite reconstruir lo representado en esa exportación, sin depender de Europass ni añadir información privada no mostrada.
9. Toda traducción completa aplicada referencia un checkpoint previo recuperable; copiar/editar/traducir un CV no modifica el perfil ni otros CV.

## Concreción implementada en F2

El modelo de código y la especificación no se equiparan por nombre de tipo.
[f2/IMPLEMENTATION.md](f2/IMPLEMENTATION.md) registra sus correspondencias y límites:
assets con metadatos/bytes separados, estado sensible derivado, copias por IDs,
workspace como dato portable, revisiones sin persistencia y plantillas declarativas.
[CVPROJ.md](f2/CVPROJ.md) fija el ZIP STORE y manifiesto v1, scopes CV/workspace,
límites y migración explícita sin compatibilidad legacy inventada. Al cierre de F2, los campos de importación F6 quedaban fuera; su concreción actual
se describe al final de este documento. Los tipos V1 aún desconocidos se rechazan,
nunca se eliminan al abrir y volver a guardar. [Aceptación F2](f2/VALIDATION.md).

## Concreción implementada en F3

El esquema físico SQLite v2 conserva el modelo de dominio v1 y `.cvproj` v1.
Workspace, perfil, CV, snapshots históricos, recursos y borradores se guardan en
transacciones detrás de puertos de aplicación. Sections/Entries/configuración/
idioma/orden/visibilidad/memoria sensible se validan en sus snapshots; no tienen
otra copia editable normalizada con reglas duplicadas.

FormDraft es un contrato de aplicación: baseSnapshot validada, revisión base,
versión del borrador, ruta descriptiva, valores JSON temporales, rawDateInputs y
dependencias explícitas. La ruta no ejecuta accesos dinámicos. La aceptación de
recuperación devuelve esos valores; confirmar exige un candidato de dominio
válido sobre la revisión vigente. Una base vieja no se aplica automáticamente.

No se amplía el formato portable F2 para guardar borradores: su exclusión requiere
resolverlos o aceptarla expresamente. Los backups SQLite sí incluyen ese trabajo.
En el contrato inicial F3, SourceArtifact/importadores F6 y campos V1 quedaban
fuera; la extensión actual F6 se describe abajo. Claves desconocidas se rechazan. [Validación F3](f3/VALIDATION.md).

## Concreción implementada en F5

Se conserva el contrato F2 v1. Los nuevos formularios utilizan sus tipos existentes,
las cinco destrezas CEFR sin nivel global, grupos con listas únicas y varias
personalizadas. `collapsed` continúa fuera del contenido. Clasificación A/B/C,
spans UTF-16 y aprobaciones contextualizadas mantienen sus formatos. Una
selección de original puede conservar una aprobación válida asociada para
detectar posteriormente una edición de fuente, sin mostrar esa traducción.

La operación conceptual `TranslationOperation` se concreta como borrador F3:
`FormDraft.id`, baseSnapshot/revision y `values.languagePlan`. Sus propuestas son
privadas y temporales, excluidas de `.cvproj`/PDF. El checkpoint previo queda
identificado por CV/número de revisión y causa beforeTranslation; aplicar crea
el número siguiente. No hay tabla nueva ni registro perpetuo de propuestas.

A traducida sustituye texto e idioma activos; A conservada expresamente mantiene
su texto e idioma original y hace explícita la mezcla en el plan. B se conserva;
C conserva fuente y memoria, con aprobación exacta o decisión explícita. No se
inventa un original desconocido. El proveedor solo recibe fragmentos traducibles,
y F5 no instala un motor automático de producto.
[Correspondencias y límites F5](f5/IMPLEMENTATION.md).

## Concreción implementada en F6

`ImportDraft`/`ImportAnalysis`/`ImportView` son contratos de aplicación transitorios:
permiten valores obligatorios aún vacíos y fechas crudas inválidas para revisión.
No se persisten como entidades ni borradores de la biblioteca. Confirmar exige un
CvDocument válido; Cancelar no deja CV, assets ni recuperación parcial.

CvDocument incorpora `importRecords?`, privado y opcional, con `recordVersion=1`.
Concreta los nombres conceptuales de la tabla anterior: `source` contiene nombre
base, hash, tamaño y `assetId`; `candidate` identifica contenido/adjunto y elección;
`mappings` conserva rutas de origen/destino y `issues` registra vistas previas,
razones y resolución. El archivo íntegro PDF/XML es Asset de rol `source`, con
bytes deduplicados. No se añade una entidad SourceArtifact ni tabla SQL separada.
Los datos no mapeados quedan en el informe y el origen completo, no como campos
editables inventados. Los estados de análisis/cancelación viven en la sesión;
solo el registro aceptado viaja con el CV y sus checkpoints.

La extensión tiene versión propia; `.cvproj`/dominio general v1 y SQLite v2 se
conservan. Lectores antiguos estrictos rechazan la propiedad nueva en lugar de
perderla silenciosamente. Todo origen requerido queda en el cierre de assets de
CV/revisiones/`.cvproj`. ExportProjection y el plan lingüístico excluyen el registro
completo. Las correspondencias históricas no exigen que un campo eliminado siga
existiendo y remapean sus IDs al copiar.

PDF propio recupera solo proyección visible; `importedVisible` permite corregir
sus variantes sin inventar original o memoria sensible. Europass usa la evidencia
lingüística recibida, instituciones literales, fechas parciales y CEFR nullable;
ninguna adaptación realiza traducción automática. [Alcance y validación](f6/IMPORT.md).


## Concreción F7 — Composición sin cambiar el modelo portable

RenderSnapshot se implementa como contrato privado de aplicación: CV/revisión,
fecha, hashes de proyección/composición, versiones de renderer/motor/recursos,
fuentes y ExportProjection congelada. El payload solo recibe esta última.
PdfGeneration contiene el artefacto final, hash y métricas de la sesión; el
registro durable ExportRecord sigue pendiente de la fase del ciclo portable.

Simple v1 declara capacidades para las siete clases de sección y utiliza recursos
con identidad/hash inmutables (cuatro fuentes y licencia). Se conservan mediante
los assets/templates existentes de SQLite/cvproj, sin migración nueva. Presentation
se confirma como revisión normal, sin cambiar datos ni aumentar precisión de fechas.
Zoom, página actual y apertura del visor no se añaden al contenido exportable.
[Implementación y validación](f7/SIMPLE_TEMPLATE.md).

## Concreción F8 — Exportación durable y recuperación de la distribución

El modelo privado/portable v1 no cambia. TemplateDefinition lateral/1 declara
twoColumn y comparte los recursos locales F7; PresentationSettings ya admite su
selección versionada. El renderer lateral-1 pertenece al mismo puerto de impresión.
Las fechas y variantes siguen resolviéndose en ExportProjection antes de paginar.

ExportRecord conceptual se concreta en un contrato privado de aplicación v1 y
una tabla SQLite v3, fuera del contenido exportable del CV. Incluye CV/revisión,
plantilla/renderer/Chromium, configuración efectiva, huellas de proyección y
composición, fecha UTC, SHA-256/longitud/páginas finales y política visible-export-v1.
No guarda ruta ni duplica contenido. El recibo describe una generación fija y no
se actualiza al editar. No viaja en PDF ni se añade a .cvproj v1; el backup SQLite
sí lo conserva. Eliminación de CV retira sus recibos, sin borrar archivos externos.

Reimportar PDF propio v1 conserva la proyección representada y recursos propios
de Simple/Lateral v1, con nuevos IDs. Los ocultos no se reconstruyen y la máxima
precisión editable no inventa partes omitidas. Las variantes C importadas siguen
sin aprobación/original fabricados. .cvproj conserva datos privados y checkpoints
según su contrato previo. [Detalle y límites](f8/PORTABLE_EXPORT.md).
