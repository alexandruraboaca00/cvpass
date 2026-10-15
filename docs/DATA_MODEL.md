# Modelo de datos propuesto

Versión 0.1 · 15 de octubre de 2026 · Especificación conceptual, pendiente de aprobación. No es un esquema implementado.

## Convenciones y principios [D]

**Todo el modelo es una decisión de diseño nuestra [D].** Los nombres del XML Europass solo aparecen como referencias del adaptador de importación. No se asume que este sea su modelo interno. Hechos y límites se recogen en [REQUIREMENTS.md](REQUIREMENTS.md); el almacenamiento físico y los adaptadores se describen en [ARCHITECTURE.md](ARCHITECTURE.md).

- Identificadores opacos estables —UUID propuestos—, independientes de títulos, fechas y posiciones.
- Metadatos de tiempo en UTC; fechas de trayectoria como fechas de calendario, sin convertirlas a instantes UTC.
- Colecciones con mapa por ID y una lista de IDs para el orden; ninguna segunda propiedad `position` que pueda contradecirla.
- Contenido y presentación separados. Los CV son instantáneas materializadas independientes del perfil maestro.
- Originales y traducciones no se sustituyen entre sí. El idioma de una etiqueta no prueba el idioma de un texto libre.
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
| `documentLocale` | Idioma de etiquetas y convenciones de salida, inicialmente `es` o `en`. |
| `contentPolicy` | Política predeterminada original/traducción/ambos y excepciones por campo estable. |
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
| Titular profesional / sobre mí | `LocalizedField<string>` y `LocalizedField<RichTextDoc>` opcionales. |
| Email, teléfono, dirección, web, redes | Listas de elementos con ID, etiqueta/tipo y valor. Teléfono conserva prefijo y número como texto; no como número entero. |
| Dirección | Líneas, localidad, región, código postal y país opcionales. Mantener el texto original cuando no pueda descomponerse con certeza. |
| Foto | Referencia a `Asset`, recorte/encuadre y ajuste visible independientes del archivo. |
| Nacimiento, nacionalidad, género, identificación y permisos | Opcionales y seleccionables para cada CV; solo se muestran si se eligen. Datos del origen sin soporte de UI permanecen identificados como no mapeados. |

El nombre de presentación obligatorio es nuestra regla para CV nuevos, distinta de exigir nombre y apellidos por separado. Una importación incompleta no descarta el documento: se conserva y se pide revisar lo necesario antes de exportar.

### Identificadores lingüísticos y geográficos

Idiomas mediante etiquetas BCP 47 cuando sean conocidas; `und` para idioma de contenido indeterminado. Países mediante código normalizado cuando sea fiable, más etiqueta original de respaldo. No inferir una traducción de un nombre de empresa por el país, ni asignar el idioma del documento a todos sus campos sin revisión.

### `LocalizedField<T>`

| Campo | Semántica |
| --- | --- |
| `original.value` | Texto o árbol enriquecido original, íntegro. |
| `original.locale` | Idioma conocido o `und`. |
| `original.revision` | Revisión del original, independiente de la revisión del CV. |
| `translations[locale].value` | Variante del mismo tipo `T`, nunca un reemplazo del original. |
| `translations[locale].status` | `draft` o `reviewed`; la obsolescencia se calcula comparando revisiones. |
| `translations[locale].basedOnOriginalRevision` | Original sobre el que se revisó la traducción. |
| `translations[locale].origin` | Manual, importada o servicio opcional futuro; no implica fiabilidad automática. |
| `translations[locale].reviewedAt` | Fecha de revisión si existe. |

Una traducción queda desactualizada si no corresponde a la revisión actual del original. Se conserva, se marca y no se usa automáticamente como revisada. La revisión debe considerar el texto actual; renombrar el original no borra el trabajo anterior.

La política de salida por campo puede ser `original`, `translation` o `both`. Nombres oficiales y entidades usan original por defecto. Si falta una traducción revisada, se conserva el original y se muestra esa circunstancia en la revisión de idioma. Cambiar idioma de etiquetas modifica configuración, no todas las cadenas del modelo.

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
| `Section.title` | Clave de etiqueta estándar o nombre personalizado traducible. No sustituye el título de cada entrada. |
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
| `education` | Título traducible; organización; periodo; localización; EQF; web/dirección; campo de estudio; nota; tesis; materias/competencias; clasificación nacional; tipo/cantidad de créditos; validez; enlaces. | Título no blanco en nueva entrada confirmada. EQF/créditos se guardan sin inventar equivalencias. Fecha final sin inicial permitida. |
| `work` | Puesto traducible; empleador; periodo; localización; responsabilidades enriquecidas; sector; departamento; contacto/web de organización; enlaces. | Puesto libre admitido sin elegir de catálogo. Empleador y marcas conservan su nombre oficial. |
| `skill` | Etiqueta traducible; grupo opcional; referencia de catálogo opcional con sistema, ID y versión. | El texto libre siempre existe. Una referencia de catálogo no autoriza a traducir una etiqueta personalizada. |
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

Normalizar una imagen no exige reemplazar el original privado. El CV referencia el activo usado al renderizar; la exportación incluye ese activo y su transformación. Foto y firma son roles separados aunque el XML de origen comparta un `FileType`. Una firma gráfica no añade autenticación criptográfica.

## Importación, revisión y datos parciales [D]

| Campo | Contenido |
| --- | --- |
| `ImportRecord.id`, `sourceArtifactId` | Operación y origen inmutable. |
| `detectedFormat`, `adapterVersion` | Paquete propio, familia XML compatible, texto genérico u OCR; versión del traductor al dominio. |
| `candidateSources` | Adjuntos o rutas alternativas detectadas y cuál se eligió. |
| `fieldMappings` | Campo destino, fragmento/página/ruta de origen y transformación aplicada. |
| `issues` | Errores, ambigüedades, campos desconocidos y ajustes no recuperados. |
| `status` | Propuesta, pendiente de revisión, aceptada, cancelada o fallida. |
| `targetCvId`, `acceptedAt` | Se fijan al confirmar la operación. |

El OCR puede aportar confianza estimada por fragmento; no se inventa una puntuación comparable para XML exacto. El resultado distingue recuperación estructurada, recuperación parcial y reconstrucción asistida. Los elementos no clasificados siguen disponibles en la revisión.

Antes de exportar un resultado parcial se exige resolverlos o excluirlos explícitamente de esa salida. El proyecto privado conserva el origen y el registro de exclusión. El PDF reeditable no transporta blobs opacos del archivo original para insinuar una compatibilidad que no tiene.

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
| `section/entry.included`, `contentPolicy` | Orden/visibilidad y variantes pertenecen al CV, aunque el renderizador los consuma. |

La configuración de interfaz —panel contraído, zoom del visor, ventana— se almacena aparte. No forma parte de la semántica del PDF. La configuración de plantilla propia no importa logos, fuentes o estilos de Europass.

## Borradores, revisiones y versiones [D]

| Concepto | Datos y comportamiento |
| --- | --- |
| `FormDraft` | ID, entidad/ruta objetivo, revisión base, valores temporales, texto de fechas inválidas, activos temporales y fecha de recuperación. Nunca se exporta como contenido confirmado. |
| `Revision` | ID, entidad, número creciente, instantánea confirmada, causa y fecha. Restaurar crea otra revisión; no reescribe la historia. |
| `ExportRecord` | CV/revisión, plantilla/configuración, digest de composición, modo de exportación, fecha y hash del archivo final. Ruta local privada opcional. |
| `RenderSnapshot` | CV congelado, contenido resuelto, activos, versiones de fuentes/plantilla/motor y composición. Estado derivado, reproducible dentro de las versiones disponibles. |

Se versionan por separado:

- `appVersion`: aplicación que creó/leyó el archivo.
- `storageSchemaVersion`: estructura física de la biblioteca SQLite.
- `domainModelVersion`: significado y estructura del modelo de CV/perfil.
- `projectFormatVersion`: manifiesto y contenedor portable.
- `templateVersion` y `rendererVersion`: composición visual solicitada.
- `revision`: cambios de una entidad; no sustituye versiones de formato.

Las migraciones preservan una copia recuperable, validan invariantes y registran origen/destino. Un formato futuro incompatible se abre como no compatible o en lectura limitada; no se guarda perdiendo campos. Las versiones de modelo, contenedor y renderizador no tienen por qué avanzar a la vez.

## Formato portable y reapertura de PDF [D]

### Paquete `.cvproj`

| Elemento lógico | Contenido |
| --- | --- |
| `manifest.json` | Identificador propio de formato, versiones, `scope`, `payloadPolicy`, fecha, creador y listado de ficheros con tamaño/hash. |
| `snapshot.json` | Un CV completo o instantánea lógica de workspace, según `scope`. UTF-8, validado antes de aplicar. |
| `assets/<hash>` | Bytes de los activos referenciados, sin rutas externas. |
| Registros privados opcionales | Orígenes, datos no mapeados, historial/borradores según alcance y opciones. Su presencia se declara. |

`payloadPolicy` distingue proyecto privado, copia de workspace y distribución editable. Es independiente de `CvDocument.contentPolicy`, que elige variantes lingüísticas. El identificador propio de formato y la validación tienen prioridad sobre extensión/nombre. Se rechazan rutas absolutas, ascensos de directorio, enlaces simbólicos, duplicados ambiguos, hashes incorrectos y límites de expansión excedidos. Las verificaciones de hash detectan alteración de contenido, no identifican al autor.

### Política de distribución del PDF reeditable

El PDF adjunta un paquete `scope=cv`, `payloadPolicy=editable-distribution` con:

- Todos los datos confirmados propiedad de ese CV, incluidas secciones/entradas ocultas y variantes originales/traducidas.
- Orden, inclusión, política de idioma, configuración y referencias versionadas de plantilla.
- Foto/firma efectivamente asociadas al CV y demás activos necesarios para reabrirlo.
- Versiones del formato/modelo y revisión exportada, sin depender de la base local.

Quedan fuera: perfil maestro, otros CV, historial, borradores, archivos originales de importación, datos opacos no resueltos, rutas absolutas y credenciales. Las referencias privadas al perfil/artefactos se eliminan o se reducen a procedencia no resoluble que no afecte a la apertura. Las exclusiones de importación aceptadas se resumen sin copiar su contenido opaco; se retiran las referencias que no tendrían destino en el paquete. No se incluyen secretos para poder descifrar el propio documento.

**Esta política incluye datos no impresos y requiere aprobación.** El exportador ofrece resumen de alcance y PDF para compartir sin paquete. El propio nombre de una sección oculta no vuelve privado un adjunto; no hay cifrado por defecto en el formato propuesto.

### Reapertura y criterios de equivalencia

Abrir PDF → localizar/validar paquete → comprobar versiones/activos → migrar si hace falta → proponer CV nuevo → confirmar. Si la plantilla exacta no está disponible, se conservan los datos y se informa antes de sustituir el diseño. El PDF original sigue siendo la referencia visual.

Se compara equivalencia semántica de campos, fechas/precisión, traducciones/estados, niveles CEFR, enlaces, grupos, orden, inclusión, ajustes y hashes de activos. Pueden cambiar IDs locales, metadatos de importación y fecha de exportación. No se exige igualdad binaria de PDF entre versiones de Chromium.

Un hash del paquete no demuestra que sus datos correspondan al texto visible si otra herramienta editó solo las páginas. La revisión de importación permite comparar ambas fuentes. El hash del PDF completo se guarda en `ExportRecord` después de generar el archivo, no dentro de su propio manifiesto.

### Copias de workspace

La restauración recupera perfil, CV, activos y lo que el manifiesto declare sobre historial/borradores. Se valida en una biblioteca vacía. Restaurar sobre una biblioteca existente requiere escoger copia nueva o sustitución respaldada; no se fusiona por coincidencia de nombres. La operación es transaccional y conserva una salida recuperable si falla.

## Invariantes para la validación futura [D]

1. Ningún CV exportable depende de contenido mutable del perfil maestro o de otro CV.
2. Toda referencia de activo necesaria se resuelve; todo orden corresponde a sus IDs, sin duplicados.
3. Ocultar y contraer nunca eliminan datos. El borrador nunca se filtra a una exportación.
4. Las cinco destrezas CEFR y la precisión de fecha se conservan por separado.
5. Ninguna traducción reemplaza el original; una traducción desactualizada conserva su texto y su estado explicable.
6. Confirmar contenido, historial y referencias de activos es atómico; Cancelar no crea una revisión confirmada.
7. Un formato o dato no soportado se comunica y preserva en el ámbito privado adecuado; no desaparece por guardar.
8. Reabrir el PDF propio en una biblioteca vacía recupera el CV completo definido por su política, sin acceso a Europass ni al archivo original.
