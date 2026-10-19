# F8 — PDF visible, proyecto completo y registros privados

## Política vigente

Solo hay una exportación normal **Exportar PDF**. No existen modos PDF completo/
compartir. Las propuestas históricas de esas categorías quedaron sustituidas por
la minimización ya aprobada; no se reescribe evidencia de research para aparentar
otra observación. `.cvproj` v1 sigue siendo el formato fiable de proyecto completo.

El pipeline construye el payload exclusivamente desde ExportProjection: la
proyección visible de RenderSnapshot. No recibe CvDocument/biblioteca como datos
a serializar. Resuelve inclusión, orden, variantes sensibles, fechas y recorte de
foto antes de adjuntarlo. TemplateRef/configuración efectiva permiten reconstruir
la composición; no hay IDs de biblioteca/perfil ni nombres privados de biblioteca.

El transporte conserva `cvforge-pdf-data` v1 con hash/longitud de
`cvforge-export-payload` v1. Los hashes verifican integridad, no autoría ni que las
páginas no se hayan editado externamente. La revisión de importación permanece.
No cambia `.cvproj`, ni el modelo de dominio v1, ni el codec/payload F2/F6.

## Permitido y excluido

Solo valores/semántica visibles, orden, idioma, partes de fecha representadas,
plantilla/versión/configuración efectiva e imagen realmente usada. Si se imprime
solo traducción, el original privado no viaja; ambas solo si se imprimen ambas.
Una fecha mostrada como año no recupera mes/día. El normalizador F7 materializa
recorte y PNG sin metadatos privados, sin píxeles fuera del encuadre.

Quedan fuera perfil, otros CV, ocultos, alternativas lingüísticas, memoria sensible
privada, historia, borradores, procedencia, datos no mapeados, originales/PDF
Europass fuente, rutas y datos del sistema. Los recursos privados siguen en la
biblioteca/backup, sin pasar al posprocesador. Se extrae por completo el único
adjunto generado, se compara con la proyección y se buscan centinelas en JSON y
en los bytes de las imágenes. El fallo de cualquiera bloquea la aceptación.

## Ciclo PDF independiente

Archivo → detección por contenido/adjuntos → hash/versión/validación → adaptación
F6 → propuesta revisable → Cancelar o Confirmar → nuevo CV transaccional con
assets/procedencia/checkpoint → cerrar → nueva instancia → abrir.

Para `simple`/1 y `lateral`/1 el adaptador recupera la definición propia y los
recursos locales verificados de la aplicación. Ya no usa el fallback core para
esas versiones. Versiones futuras conocidas se rechazan con
`PDF_TEMPLATE_VERSION_UNSUPPORTED`; fuentes no soportadas, con
`PDF_FONT_UNSUPPORTED`. Otros diseños siguen conservándose como configuración de
origen informada, sin afirmar render compatible ni sustituirlos silenciosamente.

Los datos reconstruidos son solo la distribución visible, con IDs locales nuevos.
Las cinco dimensiones CEFR permanecen independientes y nullable, las lenguas
maternas no se convierten en C2, los grupos conservan pertenencia/orden y las
personalizadas conservan nombre de sección distinto del título de entrada.

Una traducción C visible reimportada no crea una aprobación ni inventa su original.
La foto normalizada se convierte en asset local con hash/bytes/referencia. La
precisión máxima de UI se establece en día sobre fechas que YA están reducidas:
no añade partes omitidas. El formato no promete reconstruir ese tope privado ni
la visibilidad de datos que nunca se exportaron. La presentación efectiva y una
nueva ExportProjection deben coincidir con la versión distribuida.

El PDF importado se conserva como origen privado por la política F6. No se
adjunta ese origen a exportaciones posteriores; la nueva proyección vuelve a
excluir registros/originales. Sin payload compatible se informa PDF normal no
importable estructuradamente en esta fase. No hay OCR ni heurísticas de layout.
Retirar el adjunto debe dejar páginas/texto/enlaces válidos; `.cvproj` sigue disponible.

## Proyecto completo

La GUI añade **Exportar proyecto (.cvproj)**, reutilizando exportCvproj, codec F2 y
escritura atómica existente. Usa diálogo local con confirmación de sobrescritura.
Exige revisión vigente y formularios/borradores resueltos: no acepta implícitamente
perder un borrador. Cancelar el diálogo no modifica datos ni produce un archivo.

`.cvproj` CV recupera ocultos, originales/memoria/aprobaciones, ajustes, assets
originales y checkpoints necesarios. Los tests comparan todos los campos del CV
tras normalizar exclusivamente IDs, usando las listas de orden para mapas. Se
comprueban además historia y bytes de cada recurso. Importar crea copia; no cambia
perfil ni otros CV. Workspace mantiene el flujo F3/F6 de biblioteca vacía o
sustitución explícita con backup previo; formato, hashes, rutas y límites no cambian.

Los recibos operativos de exportación pertenecen a la instalación y no se añaden
al contrato portable v1 ni a la copia materializada de un CV. El backup SQLite sí
los contiene. `.cvproj` no transporta rutas de destino ni promete el inventario de
archivos exportados desde otra instalación; conserva el proyecto editable.

## ExportRecord durable

Contrato privado de aplicación `ExportRecordSchema` v1/`ExportRecordRepository`;
adaptador SQLite dentro del mismo worker. Sin dependencia SQL en dominio/renderer.

| Campo | Propósito |
| --- | --- |
| id, cvId, revision | Identidad del recibo y estado del que procede. |
| templateRef, rendererVersion, engineVersion | Plantilla/versión y motor reales. |
| presentation | Configuración efectiva; sin mapas de campos privados. |
| projectionDigest, compositionDigest | Huella de salida visible y composición congelada. |
| exportedAt, sha256, byteLength, pageCount | Fecha UTC y archivo final verificado. |
| structuralPolicy | `visible-export-v1`; una política PDF normal. |

No duplica texto, fotos, fuentes, proyectos, procedencia ni rutas. La GUI permite
consultar el registro del CV mediante IPC específico, también tras reiniciar.

SQLite migra v2 → v3 explícitamente, con backup consistente previo. Tabla `exports`
STRICT: PK, FK diferida al CV y restricciones básicas; índice CV/fecha. Los commits
F3 sustituyen entidades en una transacción: la FK diferida conserva recibos durante
esas sustituciones. Eliminar un CV elimina sus recibos locales en esa transacción;
no elimina los archivos ya exportados. Cambiar de workspace elimina recibos del
workspace sustituido. Restaurar una revisión ordinaria conserva el registro.

Añadir recibos no incrementa la revisión del CV ni la generación de contenido;
no se pierden al confirmar otra edición. El snapshot de biblioteca/project codec
no se amplía con esta tabla. La API SQLite backup incluye la tabla automáticamente.

Se escribe primero el archivo capturado y se comprueba SHA-256/longitud; después
se confirma el recibo SQLite. Cancelación/fallo de archivo no crean recibos. No se
simula una transacción distribuida entre archivo y SQLite: si el segundo paso
falla, `EXPORT_FILE_WRITTEN_RECORD_FAILED` indica que el PDF existe pero su registro
no pudo guardarse. La UI lo explica y no anuncia éxito normal. Un crash entre
ambos pasos puede dejar archivo sin recibo, nunca un recibo que anuncie una escritura
no efectuada. Reconciliación automática de destinos no forma parte de F8.

Punto pendiente de revisión en F9: **Crash/reconciliation between successful PDF file write and durable ExportRecord**. Se registra la deuda; F9 no se inicia y este merge no cambia el comportamiento.

Los errores no registran contenido personal ni rutas por defecto. Los fixtures y
los directorios A/B/C, PDF y payload extraídos son sintéticos; nada privado entra
en Git. [Matriz, evidencia y límites](VALIDATION.md).
