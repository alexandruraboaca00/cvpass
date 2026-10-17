# F5 — Áreas del MVP e idiomas

17 de octubre de 2026. Implementación en `f5-mvp-sections-languages`, sobre
`main = a43e7f86a5af17a9b532a2c711c89dc0de4ce479`, merge F4 aprobado. No se fusiona
sin aprobación del usuario ni se inicia F6. [VALIDATION.md](VALIDATION.md) registra
la ejecución y conclusión de cierre: F5 aprobada técnicamente, con aceptación
para fusionar pendiente del usuario. Este documento describe el alcance real.

## Capas y contratos

El dominio continúa sin dependencias de UI, Electron, SQLite, archivos o red.
`skills.ts` implementa operaciones de pertenencia/orden por copia;
`translation.ts` construye, valida y aplica un plan lingüístico;
`protected-text.ts` permite clasificar expresamente fragmentos B dentro de A.
Se reutilizan fechas, entidades, aprobaciones C y proyección de exportación F2.

`CoreEditorService` amplía las sesiones F4: entrada individual, habilidades con
grupos, nombre de personalizada y plan lingüístico. Main verifica el objetivo,
revisión y alcance de la copia; rechaza modificar otros campos desde un formulario.
Las aprobaciones existentes son inmutables y las nuevas se limitan a los tipos de
campo editables. Una aprobación puede quedar obsoleta dentro del mismo borrador,
sin que eso la elimine. Todos los candidatos confirmados pasan validación F2.

Preload solo añade operaciones concretas: idioma de interfaz, duplicado y
lista/restauración de checkpoints lingüísticos. No expone SQL, rutas, Node,
archivos arbitrarios, invocación IPC general ni acceso a proveedores remotos.
Se conservan aislamiento, CSP, bloqueo de navegación y logs sin contenido F4.

SQLite conserva esquema F3 v2; dominio, `.cvproj` y payload PDF conservan v1.
La única extensión de persistencia es un argumento optativo `beforeTranslation`
en `confirmDraft`: candidato, incremento de revisión, checkpoint fijado, recursos
y retirada del borrador se confirman en la misma transacción. No se duplica
SQLite ni se crea otra biblioteca para los nuevos formularios.

`cvforge-core@2` declara las siete clases de sección, además de la cabecera
personal. Sigue siendo una referencia de editor, sin diseño/renderer PDF final.
La versión 1 se conserva para historia y proyectos anteriores. Solo se cambia
una referencia `cvforge-core@1` al añadir áreas que no soportaba; no se sobrescribe
su definición ni se cambia una plantilla importada ajena de forma implícita.

## Formularios y biblioteca

La biblioteca abre documentos reales y permite crear/duplicar un CV. El perfil
y los demás CV permanecen independientes. No hay datos de demostración cargados
por producción. Todos los formularios usan copia temporal, autosave F3 de
500 ms/máximo 2 s y flush. Confirmar valida y reconoce el guardado durable;
Cancelar descarta la sesión y su recuperación. Fechas inválidas siguen escritas.

Los modales hijos se montan mediante portal fuera del `<form>` padre. Su submit
no se propaga. Confirmar hijo solo mezcla su copia en el borrador padre;
Cancelar padre descarta también grupos, habilidades o aprobaciones del hijo.
No se llama a `confirmEntity` desde un modal hijo. El trabajo de un hijo aún no
confirmado permanece en memoria; la recuperación durable contiene el último
estado entregado al padre. No se promete recuperar una edición parcial de ese
submodal tras un crash.

El cierre sigue esperando la operación activa, los cambios React pendientes,
el flush y SQLite. Se reconocen borradores F4 anteriores y sobres F5. Un plan
recuperado se ofrece para revisar, nunca se aplica automáticamente.

### Habilidades y grupos

Texto libre con ID estable y clasificación A/B/C; B es el valor inicial para
evitar traducir automáticamente nombres técnicos. Grupos con ID/nombre y
`groupOrder`; cada habilidad aparece una sola vez en `skillIds` de un grupo o
`ungroupedSkillIds`. `entryOrder` continúa siendo null para esta sección.

Se pueden crear/editar/eliminar habilidades, renombrar/ordenar grupos, mover,
desagrupar y ordenar habilidades dentro de una lista. Los botones Subir/Bajar
son utilizables con Enter/Espacio. Eliminar grupo pide confirmación y mueve sus
habilidades al final de Sin agrupar, conservando el orden relativo. No las borra.
La confirmación del padre persiste el conjunto sin reconstruir IDs.

### Idiomas

Varias lenguas maternas y extranjeras. Se introduce código BCP 47 o nombre de
respaldo; al menos uno debe existir. Un idioma materno carece de `proficiency`:
no equivale a C2. Los extranjeros mantienen exactamente `listening`, `reading`,
`spokenInteraction`, `spokenProduction`, `writing`; cada valor es A1–C2 o null.
No existe un nivel global ni se rellenan dimensiones no evaluadas.

### Certificaciones, proyectos y personalizadas

- Certificación: título obligatorio con clasificación controlable, emisor B,
  fecha de expedición parcial, modalidad, descripción enriquecida y enlaces.
  Se propone C inicialmente; el usuario puede elegir B para un nombre literal.
- Proyecto: título A/B/C, periodo con precisión F2/fin solo/Actualmente,
  descripción semántica y enlaces individuales validados.
- Personalizada: nombre de sección propio, ID/orden/inclusión independientes y
  múltiples entradas con título, periodo, descripción, enlaces, orden e inclusión.
  Varias personalizadas coexisten; nombre de sección y título de entrada son
  campos diferentes. Crear/renombrar una sección usa también Confirmar/Cancelar.

Los formularios principales conservan los campos F4 y añaden clasificación y
revisión C donde el dominio lo permite, incluidas materias, área, tesis y cargos.
No se altera el subconjunto semántico de Tiptap ni el almacenamiento de foto F3.

## Idioma de interfaz

Catálogo ES/EN local en `src/ui/messages.ts`, interpolación de parámetros y
contexto React `i18n.tsx`. Las claves son mensajes fuente españoles; el contenido
del CV nunca pasa por ese catálogo. Los tests comprueban cobertura estática,
mapas de etiquetas y correspondencia de parámetros entre ambos idiomas.

Para estos dos idiomas se concreta el i18next propuesto como un catálogo propio
sin dependencias adicionales. No se implementa internacionalización universal.
`workspace.settings.uiLocale` conserva la elección tras reiniciar. Cambiarla no
cambia revisión, `documentLocale` ni datos del CV. Son válidas interfaz ES/CV EN
e interfaz EN/CV ES; el idioma del selector no se deduce del contenido.

## Clasificación y revisión A/B/C

- Cambiar clasificación A/B/C conserva el idioma conocido de la fuente; no traduce ni relocaliza ese texto por cambiar su tratamiento.
- A tiene un único texto/árbol activo y su idioma real. El plan permite traducir
  o conservar explícitamente texto e idioma de origen. Las propuestas no se
  convierten en un mapa permanente de versiones narrativas.
- B conserva literalmente nombres/personas/instituciones/empresas, contactos,
  URL e identificadores tipados. Los nombres B conocidos se protegen también
  dentro de A con límites de palabra; un código como `es` no protege sílabas.
  El usuario puede marcar otros términos dentro de cada narrativa. Se guardan
  spans UTF-16 F2, no HTML. Si el texto editado invalida posiciones, se requiere
  revisarlas expresamente, retirar la protección o cancelar; no hay reparación
  silenciosa. Esto no es reconocimiento universal automático de entidades.
- C conserva original, idioma/revisión y contexto. La UI permite proponer/editar,
  aprobar y elegir original, traducción o traducción + original. El último modo
  muestra primero la traducción. Cambiar fuente/contexto conserva aprobaciones
  previas y señala la selección obsoleta. Seleccionar original puede conservar
  una aprobación válida asociada para seguir detectando cambios de fuente.

La reutilización exige fuente/revisión, contexto y destino coincidentes, según
F2; no empareja por posición o por un título parecido. Una propuesta no se
presenta como equivalencia oficial. Los originales desconocidos de un PDF se
conservan sin inventarlos; revisar su importación corresponde a F6.

Los valores comunes que F2 tipa como cadenas literales —ubicación, denominación
de idioma, modalidad de origen, etiquetas de contacto/enlace y metadatos— se
enumeran entre los conservados. No se adivina su traducción. Pueden editarse
expresamente en sus formularios. Las URL de marcas de enlace permanecen intactas
al traducir el texto enriquecido; solo se cambian sus nodos de texto.

## Plan de cambio del documento

1. Opcionalmente duplicar como documento independiente.
2. Congelar CV/revisión y construir el plan ES→EN o EN→ES. Sigue el orden manual
   de secciones, grupos y entradas, incluyendo contenido oculto identificado
   como contenido del proyecto, sin hacerlo visible en una exportación.
3. Mostrar narrativas editables, literales conservados y C reutilizadas,
   ausentes, obsoletas o con original desconocido.
4. Revisar A y decidir cada C pendiente: aprobar, reutilizar, conservar original
   o conservar lo visible importado. Una narrativa conservada mantiene su
   `current.locale`; no se etiqueta falsamente como traducida.
5. Confirmar sobre la base vigente. F3 fija un checkpoint `beforeTranslation`
   completo y pinned y aplica contenido/idioma/memoria en una transacción.
   Cancelar, validación fallida o conflicto no cambia el CV ni crea ese checkpoint.

El plan vive en `FormDraft.values.languagePlan`, con ID de operación del borrador.
No se añade una tabla de operaciones o historial de todas las propuestas. El
checkpoint queda asociado por CV y número de revisión previo; la confirmación
crea el número siguiente. La UI permite restaurarlo como nueva revisión, con
checkpoint adicional del estado sustituido. La historia fijada no se rota.

El plan preserva estructura enriquecida, marcas, enlaces y spans, recalculando
sus posiciones a partir de fragmentos B que permanecieron literalmente iguales.
El host reconstruye y compara el plan inmutable desde su base: no permite que
el renderer cambie originales, rutas, campos B u otros documentos desde él.

## Estado real de traducción automática

`src/application/translation-provider.ts` define `TranslationProvider`, solicitudes
por fragmento y propuestas temporales. Solo entrega A que el usuario decidió
traducir, sin sus partes protegidas, y C pendientes. No entrega CV completo,
memoria, organización de contexto, IDs de biblioteca, fotos o rutas. Valida IDs,
respuestas, cancelación y errores sin propagar contenido del proveedor.

**F5 no instala ni integra un motor automático de producción.** El flujo manual
traduce efectivamente el contenido introducido y funciona sin proveedor, también
offline. Los proveedores sintéticos de tests no se anuncian como motor real.
No se descargaron modelos, añadieron APIs cloud ni se reutilizaron los pesos
exploratorios F1 como recurso de producto.

Elegir motor local, licencia/distribución de pesos, calidad ES/EN, memoria,
latencia, progreso/cancelación del worker y empaquetado sigue pendiente de
producto antes de aceptar la traducción automática del MVP. Por decisión final
del usuario, no bloquea el contrato/workflow y el cierre de F5. FR-07/NF-01
automáticos no se declaran aceptados para el MVP por estas pruebas manuales.

## Inclusión, orden, privacidad y accesibilidad

Ocultar conserva contenido e historia; mostrar revierte inclusión. Contraer usa
solo un Set React y no cambia dominio, revisión o payload. Todas las áreas tienen
acciones de sección y entrada diferenciadas, orden por teclado y eliminación
explícita con estado anterior recuperable. Las listas de habilidades conservan
su modelo de orden específico.

Las decisiones y memoria C, ocultos y checkpoints se conservan en `.cvproj`
completo F2/F3, sin ampliar su versión. `ExportProjection` sigue resolviendo solo
lo visible: una traducción sola no adjunta su original, historia o memoria.
El renderer no genera un PDF final en esta fase; F1 sigue probándose aparte y
plantillas/preview/importadores no se implementan aquí.

Se usan labels asociados —select y etiqueta son hermanos—, nombres de botones,
errores vinculados, foco nativo de diálogos, Escape y controles de teclado.
El catálogo local no carga recursos remotos. No se afirma conformidad completa
de accesibilidad ni certificación con lector de pantalla.

## Deuda y límites

- Motor automático definitivo pendiente, según la excepción de alcance indicada.
- Recuperación del padre reconocida; la edición parcial de un hijo abierto no
  se guarda hasta confirmar ese hijo. No hay versionado complejo de propuestas.
- Revisar traducciones es responsabilidad del usuario; no se verifica una
  equivalencia académica ni se identifica universalmente cada nombre dentro de A.
- Catálogo de dos idiomas con pruebas de cobertura; más idiomas/plurales,
  tipado exhaustivo de claves y accesibilidad completa quedan para evolución.
- Se conservan límites PNG, rendimiento de biblioteca completa/100 CV,
  recuperación manual de SQLite corrupto, plataformas y avisos Vite/VA-API.
  Poppler y redistribución ONNX siguen registrados en sus fases; no se resolvieron.
- Sin importador Europass/PDF genérico/OCR, nuevas áreas V1, plantillas o preview
  finales, sincronización, cloud ni F6. No se añaden dependencias o assets de
  Europass; las dependencias directas y licencias anteriores se conservan.
