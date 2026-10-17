# F6 — Importación estructurada y revisable

Implementación aprobada por el usuario e integrada en main mediante merge commit
desde `f6-structured-import`, sobre base `238dee3`. F7 no se inicia. Resultados en [VALIDATION.md](VALIDATION.md).

## Uso y pipeline

Con dependencias instaladas, `npm run build` y `npm start`. En la biblioteca,
**Importar archivo** → seleccionar archivo → revisar informe/candidato y datos →
**Confirmar importación**. Se abre el nuevo CV. La extensión no determina el formato.
Cambiar el idioma elegido en esta revisión no traduce el texto. La interfaz ES/EN
conserva la independencia de `documentLocale` de F5.

1. El renderer lee únicamente el archivo elegido y envía bytes y nombre base por IPC.
2. Un worker analiza firmas, formato, versión e integridad. Devuelve candidatos y
   propuestas con datos, fechas crudas, correspondencias e incidencias.
3. `StructuredImportService` conserva una sesión temporal en memoria del host.
   La biblioteca, perfil, otros CV y borradores durables siguen sin cambios.
4. El diálogo permite revisar/corregir las ocho áreas mediante los formularios
   existentes. Los hijos de habilidades/traducciones solo modifican la propuesta.
   Se pueden retirar entradas expresamente. Las fechas inválidas siguen escritas;
   no se guardan hasta corregirlas o retirarlas. Los datos no mapeados se muestran
   y requieren aceptación explícita para conservarse solo en el proyecto privado.
5. Confirmar valida el documento completo y el cierre de recursos. Se generan IDs
   propios y se guarda nuevo CV, activos, procedencia y checkpoint inicial en un
   único commit transaccional de la biblioteca SQLite F3.
6. Cancelar/Escape descarta la sesión y sus imágenes preparadas; durante análisis
   termina el worker. No produce recuperación de borrador. El cierre de ventana
   cancela el análisis y espera cualquier confirmación que ya esté en transacción.

Una propuesta no es un `FormDraft` de un CV ya confirmado. Su pérdida por cierre
inesperado no deja medio CV ni una recuperación pendiente. No hay autoguardado de
importaciones antes de Confirmar. El archivo original nunca se modifica.

## Formatos reales

| Entrada | Reconocimiento y alcance |
| --- | --- |
| `.cvproj` v1, modelo v1, scope=cv | Firma ZIP y manifiesto propio; codec F2 único. Contenido completo privado, ocultos, activos e historial. Revisión y creación de copia con IDs nuevos. Las correcciones crean una revisión conservando la instantánea nativa anterior. |
| `.cvproj`, scope=workspace | Resumen de perfil y CV, sin conversión implícita a un CV. Restaurar solo sobre biblioteca vacía o elegir sustitución explícita con copia de seguridad previa. No mezcla ni sobrescribe silenciosamente. |
| PDF CVForge | Catálogo de adjuntos; contenido `cvforge-export-payload` v1. Recupera exclusivamente la proyección exportada. Un sobre opcional `cvforge-pdf-data` v1 añade longitud y SHA-256 de los bytes del payload, sin duplicar su codec. |
| PDF Europass | Enumera todos los adjuntos y analiza sus bytes. Compatible con el XML Candidate/HR-XML 4.0 descrito abajo, cualquiera que sea el nombre del adjunto. |
| XML Europass independiente | Misma adaptación y validación que un adjunto compatible; UTF-8, UTF-16 LE/BE. |
| PDF genérico/sin payload, XML de otro contexto, corruptos o versiones futuras | Resultado explícito; no se genera un CV fingido. No se extrae texto, geometría ni OCR. |

El PDF técnico `cvforge-export-probe` de F1 es anterior al contrato de producto F2;
se identifica como incompatible. No se modifica F1 para cambiar este hecho.
Los tests generan PDF sintéticos con el contrato F2; F6 no implementa el generador,
las plantillas ni el preview final de F7/F8.

La integridad estructural y los hashes de imágenes se validan siempre en un
payload compatible. Un payload v1 directo sin digest de transporte se señala para
revisión. SHA-256 detecta corrupción, **no autentica el autor ni demuestra que las
páginas visibles coincidan con el adjunto**. La revisión no omite esa limitación.

Si hay un solo candidato compatible se elige con motivo `soleCompatible`.
Si todos los compatibles son bytes idénticos y del mismo formato, se usa
`identicalCandidates`. Con contenidos distintos el usuario elige expresamente;
ve nombre, persona, idioma, cantidad de entradas y fragmento del digest. Cambiar
candidato tras abrir la revisión requiere descartar las correcciones expresamente.
Los adjuntos incompatibles mantienen su razón en el informe de candidatos.

## Subconjunto Europass

Se acepta `{http://www.europass.eu/1.0}Candidate`, con DocumentID HR-XML
`schemeVersionID=4.0` y CandidateProfile. Se utilizan URI y rutas reales de
Europass, HR-XML 3, OAGIS 9 y Europass EURES 1.0, sin depender de prefijos XML.
No se afirma validación completa contra XSD ni compatibilidad universal con
cualquier generación de Europass.

| Origen | Destino y límites |
| --- | --- |
| CandidatePerson/PersonName | Nombre, apellidos y nombre para mostrar; si faltan, completar en revisión. |
| Communication | Email, teléfono, web, redes sociales y dirección. ISO alfa-2 de país se capitaliza sin cambiar su identidad. Un enlace sin protocolo se conserva escrito y bloquea Confirmar hasta corrección explícita; no se añade protocolo automáticamente. |
| BirthDate | Fecha de nacimiento parcial/completa sin inventar precisión. BirthPlace no tiene campo en el dominio actual: informe y origen privado. |
| EducationOrganizationAttendance | Título C original, institución B literal, periodo, ubicación, web incluso en otra Communication, campo de estudio, EQF, créditos, clasificación nacional, descripción y enlaces cuando esas rutas están presentes. |
| EmployerHistory/PositionHistory | Múltiples puestos con empresa B literal, título, periodo/CurrentIndicator, ubicación, descripción y enlaces. Información redundante o alternativa sin correspondencia queda informada. |
| Skills/SkillsGroup | Nombres de grupos, habilidades B literales, IDs propios, pertenencia y orden. Un grupo sin título se representa sin agrupar. |
| PrimaryLanguageCode | Varias lenguas maternas sin niveles; códigos ISO lingüísticos se canonicalizan por Intl. No se convierte lengua materna a C2. |
| PersonQualifications/PersonCompetency | Taxonomía language, cinco dimensiones CEFR independientes. Ausentes = null; valores inválidos/duplicados se señalan y no inventan niveles. |
| CourseCertifications/CourseCertification | Título C, emisor B, fecha, modalidad, descripción y enlaces. `Certifications/Certification` (premios) no se confunde con este bloque. |
| Projects/Project | Título, Date/periodo/Ongoing, descripción y enlaces. |
| Cada Others/Other | Nombre de sección distinto de título de entrada; varias secciones y entradas con IDs/órdenes independientes. |
| Attachment con FileType=photo, Instructions=ProfilePicture | Data URI PNG/JPEG, o una capa base64 adicional observada. Bytes verificados y asset de foto F3; nada depende de una ruta temporal. |
| RenderingInformation/Design/SectionsOrder | Orden de los tipos reconocidos. Plantilla, logo, colores y CSS no se copian. |

Cada hoja/atributo significativo no consumido se informa con su ruta y una vista
previa acotada; el archivo original completo se conserva como activo privado.
El HTML de descripciones se convierte con parse5 al árbol enriquecido propio:
párrafos, negrita/cursiva, saltos, listas y enlaces seguros. Etiquetas ejecutables,
recursos remotos y estilos se omiten con aviso de reducción de formato.
El resultado se marca parcial cuando hay información relevante sin correspondencia.
No se afirma que conservar el origen equivalga a disponer de un campo editable.

Los títulos sensibles Europass conservan el original recibido sin inventar una
traducción o aprobación. El PDF propio puede contener solo una traducción visible:
se usa `importedVisible`, con original desconocido y variantes únicamente visibles;
la revisión puede corregirlas sin atribuir un original o aprobación inexistente.
Las instituciones y personas no se traducen. `CandidateProfile@languageCode` es
evidencia del idioma del archivo, nunca de una operación de traducción histórica.

## Dominio, persistencia y privacidad

`ImportRecord`, opcional en CvDocument, tiene `recordVersion=1`, identificador,
formato/adaptador, fecha, nombre base/hash/tamaño/asset de origen, candidato y
motivo, evidencia de idioma, correspondencias e incidencias/resoluciones.
No almacena rutas absolutas. Las correspondencias son procedencia, no referencias
vivas; al copiar se remapean IDs destino y no se enlaza otro CV/perfil.
Una entrada eliminada puede conservar una correspondencia histórica del origen.

SQLite conserva el esquema v2: el documento JSON guarda los registros y los índices
de referencias/activos existentes protegen su cierre. No hace falta otra tabla o
migración. El origen PDF/XML usa rol `source`; se mantiene por CV/checkpoint y se
recoge por la estrategia F3 cuando ya no hay referencias. Los bytes deduplican por
hash. `.cvproj` propio no se anida como archivo de origen: se conservan su hash y
nombre, sus datos completos e historial/activos existentes.

El contenedor `.cvproj` y modelo general siguen v1; la extensión opcional está
versionada por `recordVersion`. Lectores antiguos estrictos rechazan la propiedad
nueva en vez de perderla al guardar. Versiones futuras del registro se rechazan.
Los snapshots viejos sin registro siguen válidos, sin procedencia inventada.

`ExportProjection` conserva su lista permitida y no contiene origen, informe,
no mapeados, historial, borradores ni otros CV. Una revisión de importación
pendiente bloquea exportación. La colección de campos de TranslationProvider
excluye ImportRecord. El origen completo sí pertenece al proyecto privado y su
`.cvproj`; **nunca se incrusta en un PDF posterior** mediante esa proyección.

`LibraryService.addImportedCv` valida recursos y hace un único commit CAS F3;
restricciones, blobs e historial entran en la misma transacción. Una prueba inyecta
fallo después de escribir entidades en SQLite real, comprueba rollback total y
permite reintentar la misma propuesta. No se anuncia éxito antes del commit.
Restaurar workspace reutiliza el flujo F3 con copia previa y guardas de sustitución.

## Seguridad y límites

- XML: sin DTD ni entidades externas, sin resolvedores/red; decodificación fatal,
  coherencia de declaración, 10 MiB, profundidad 64, 100.000 nodos, 100 atributos
  por nodo y rutas acotadas. Errores por códigos sin fragmentos personales en logs.
- Archivo normal: 50 MiB; proyecto workspace: 200 MiB además de límites del codec
  portable. PDF: máximo 100 adjuntos, 10 MiB por adjunto y 100 MiB acumulados.
- Worker: 30 s y heap viejo 512 MiB; Cancelar lo termina. Límites de heap no son
  una garantía de RSS total frente a cualquier archivo hostil. `fetch` del worker
  está deshabilitado; PDF.js recibe bytes, sin URLs y sin pedir páginas/texto,
  JavaScript, XFA, acciones o renderizado. Sus logs se consumen sin publicarlos.
- Assets: validaciones F2/F3 (tipo, dimensiones, tamaño, CRC/hash/píxeles PNG,
  subconjunto PNG RGB/RGBA 8 bits sin entrelazado y JPEG). Selección desde UI también
  pasa por nativeImage. Los formatos de imagen no soportados se informan.
- IPC con lista permitida, remitente validado y cola de mutaciones compartida.
  Cancelar análisis no espera a esa cola. Renderer sin Node/SQLite y navegación/red
  remota bloqueadas. Textos importados se presentan como texto/árbol semántico.
- Todo local, sin CDN/telemetría/APIs externas. Los originales privados y sus
  extracciones quedan fuera de Git, fixtures y documentación pública.

## Dependencias nuevas y deuda

| Paquete | Versión | Licencia | Uso |
| --- | --- | --- | --- |
| pdfjs-dist | 6.4.299 | Apache-2.0 | Catálogo y bytes de adjuntos locales. |
| saxes | 6.0.0 | ISC | XML con namespaces, límites y rechazo DTD. |
| parse5 | 8.0.1 | MIT | HTML hacia árbol propio, sin ejecución. |
| pdf-lib, desarrollo | 1.17.1 | MIT | Generar PDF sintéticos propios. |

Saxes está archivado upstream; mantenimiento/sustitución futuros registrados.
No se copian código, CSS, fuentes, imágenes ni recursos Europass. Los fixtures
se generan con nombres/contactos/textos/imágenes propios. Guiones y documentos
históricos de investigación no son dependencias de aplicación/tests.

Pendientes fuera de F6: otras variantes de XML, importación genérica, OCR,
plantillas/preview finales, firma/autenticidad de payload y coincidencia entre
páginas y adjunto. Se conservan las deudas F1–F5 (PNG, accesibilidad completa,
Vite/VA-API, motor automático definitivo, bibliotecas grandes y reparación de BD)
sin ampliarlas en esta fase. No se implementa F7.
