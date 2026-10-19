# Roadmap de implementación

Versión 0.8 · 19 de octubre de 2026 · Decisiones de producto consolidadas e implementación autorizada por fases. **Fase actual: F8 aprobada por el usuario e integrada en main mediante merge commit desde `f8-lateral-portable-cycle`, con base `7803271`. F1–F7 y el pulido visual están aprobados e integrados. F9 no iniciada.** F1–F7 permanecen aprobadas e integradas en main; la base previa a F6 es `238dee3`. Véanse [importación F6](f6/IMPORT.md) y [validación F6](f6/VALIDATION.md).

## Alcance y criterio de avance [D]

Las fases concretan las decisiones finales del usuario [D], descritas en [REQUIREMENTS.md](REQUIREMENTS.md), [ARCHITECTURE.md](ARCHITECTURE.md) y [DATA_MODEL.md](DATA_MODEL.md). La evidencia histórica principal está en [23 — Cierre](research/23-cierre-investigacion-y-criterios.md), [28 — Mejoras](research/28-mejoras-necesarias-y-aceptacion.md) y [29](research/29-simulacion-caducidad-y-recuperacion.md). Las propuestas históricas incompatibles no prevalecen sobre esta especificación.

La investigación ha terminado y la implementación está autorizada. No hay esperas de 48 horas ni acciones manuales pendientes en Europass. Las comprobaciones siguientes se harán sobre nuestra aplicación; las pruebas de Europass no las sustituyen. La orden vigente aprueba F8 y autoriza su integración mediante merge commit; no autoriza comenzar F9. F1 permanece cerrada y F1–F7 integradas.

Cada fase debe entregar un resultado revisable y superar su criterio antes de ampliar alcance. Se fija entonces la versión de dependencias utilizada y se conserva la evidencia de aceptación. No se asignan fechas sin estimar sobre los primeros resultados.

**Corte de MVP: F0 a F9.** Ocho áreas —datos personales, educación, experiencia, habilidades, idiomas, certificaciones, proyectos y personalizadas—; dos plantillas propias —Simple/Lateral—; ES/EN con traducción real, clases A/B/C y revisión; biblioteca automática durable local; importación inteligente estructurada; `.cvproj` completo y una exportación PDF normal limitada a lo representado.

**Versión 1 completa: añade F10a, F10b, F10c, F11, F12 y F13.** Completa once tipos de sección, firma gráfica, PDF de texto y OCR. No son condiciones ocultas para dar por terminado el MVP ni funciones que se puedan declarar completas antes de ejecutarlas.

## F0 — Decisiones de producto consolidadas

**Estado:** completada a nivel de decisiones de producto por el usuario. **Salida:** los cuatro documentos actuales y [AGENTS.md](../AGENTS.md) como base de trabajo.

- Perfil maestro y CV materializados independientes; transferencias explícitas.
- Biblioteca automática y `.cvproj` completo como backup/transferencia/continuidad.
- PDF normal con semántica exclusiva de esa exportación y sin contenido privado adicional.
- Traducción real A/B/C, revisión recuperable previa y duplicación opcional.
- Importación inteligente, diseños propios y MVP de ocho áreas/dos plantillas/ES-EN; genéricos/OCR posteriores.

**Aceptación:** decisiones registradas coherentemente; los detalles técnicos de stack/motores se validan en F1. No se requiere otra aprobación de las decisiones de producto ya cerradas. La consolidación está terminada; F1 se ha validado y cerrado sin iniciar F2.

## F1 — Validar las decisiones técnicas críticas

**Estado: APROBADA — 16 de octubre de 2026.** Evidencia y límites: [F1_VALIDATION.md](F1_VALIDATION.md). F2 no iniciada.

**Depende de:** F0. **Salida:** prueba técnica mínima y decisión de continuar o revisar el stack.

Por decisión final del usuario para este cierre, la traducción no forma parte de los criterios necesarios de F1. Las pruebas ES/EN anteriores se conservan como exploración técnica; no se desarrolla más traducción en esta fase. Esta excepción no elimina su alcance de producto en fases posteriores.

- Empaquetar Electron con React/TypeScript y el módulo SQLite en worker; crear, confirmar y reabrir una entidad con imagen.
- Generar un PDF propio de una y dos columnas con textos largos, enlaces y glifos de español/inglés/rumano. Mostrar los mismos bytes mediante PDF.js.
- Adjuntar un `ExportPayload` mínimo, distinto de `.cvproj`, y recuperarlo en una ejecución nueva; comparar páginas, texto, enlaces, fuentes/etiquetas antes/después. Probar marcadores privados en secciones ocultas/traducciones alternativas y verificar su ausencia; comprobar fecha reducida y foto recortada. Evaluar qpdf si falla.
- Exploración previa ES/EN conservada; selección y validaciones adicionales de traducción quedan fuera del cierre F1 por la decisión anterior.
- Probar reglas de corte y lectura; fijar las versiones estables y el método de empaquetado. Registrar el tamaño del ejecutable y una primera medición.

**Aceptación:** ejecutable empaquetado sin red con recursos instalados; persistencia, lectura/paginación, PDF minimizado con/sin payload y licencias directas superados sobre datos sintéticos. Pérdida de lectura/enlaces/etiquetas, filtración de datos o fallo SQLite bloquean la decisión afectada: se revisa motor/adaptador antes de F2. No se declara implementado el producto completo.

## F2 — Dominio, invariantes y formato versionado

**Estado: APROBADA por el usuario e integrada en `main` desde `f2-domain-model` mediante merge commit — 16 de octubre de 2026.** 30 tests F2, TypeScript/build y regresión F1 pasan. Contrato `.cvproj` inicial `cv/workspace` implementado en memoria. [Evidencia y límites](f2/VALIDATION.md). La persistencia de F3 conserva estos contratos.

**Depende de:** F1. **Salida:** modelo independiente de UI/SQLite y contrato portable inicial.

- Implementar IDs, entidades, orden, inclusión, fechas parciales/periodos y texto enriquecido; narrativa activa A, literales B y sensibles C con memoria aprobada.
- Definir `.cvproj` completo `cv/workspace`, revisiones necesarias y contratos separados `ExportProjection`/`ExportPayload` mínimos.
- Validar referencias, límites, activos y migraciones con datos propios pequeños.

**Aceptación:** fechas parciales/final sola sin invenciones; errores concretos de periodo/título; CEFR parcial conservado; memoria sensible obsoleta identificable. Importar una traducción visible sola no inventa original ni aprobación. No hay mapa permanente de narrativas por idioma; payload sin referencias privadas. Un formato futuro/hash incorrecto no causa guardado con pérdida. Pruebas de contratos y migraciones, sin reflejar detalles internos.

## F3 — Biblioteca, persistencia y recuperación

**Estado: APROBADA por el usuario e integrada en main desde `f3-persistence-library` mediante merge commit — 16 de octubre de 2026.** SQLite real en worker, esquema/migraciones explícitas, biblioteca independiente, borradores recuperables, checkpoints durables, activos por hash y copias/restauración `.cvproj` CV/workspace sin ampliar v1. 39 tests F3 + 30 F2, TypeScript/build y regresión F1 3/3 pasan. Dos procesos reales de Electron, SIGKILL, SQLITE_FULL, migración fallida y red deshabilitada probados. [Evidencia](f3/VALIDATION.md), [decisiones/límites](f3/PERSISTENCE.md). El editor F4 también queda integrado en main.

**Depende de:** F2. **Salida:** biblioteca automática con perfil, CV, borradores, revisiones/checkpoints y copias `.cvproj`.

- Crear/duplicar/eliminar CV; copiar contenido del perfil de forma independiente.
- Confirmación automática en biblioteca con revisión esperada, historial/activos, borrador separado y Cancelar; sin guardar archivos manualmente cada edición.
- Guardar y salir, recuperación tras cierre inesperado, fijación de revisión previa a traducción y copia/restauración completa `.cvproj` de CV/workspace.

**Aceptación:** confirmar/reiniciar conserva sin exportar archivos; Cancelar conserva lo anterior; recuperar borrador requiere aceptación; revisión antigua no sobrescribe nueva. Fallos no muestran éxito falso. `.cvproj` recupera ocultos, plantillas/ajustes, activos, memoria sensible y checkpoints; el de workspace recupera también perfil/biblioteca. La limpieza ordinaria no borra el punto pretraducción fijado.

## F4 — Editor de datos personales, educación y experiencia

**Estado: APROBADA por el usuario e integrada en main desde `f4-core-editor` mediante merge commit — 16 de octubre de 2026.** React/Electron conectados a dominio/SQLite reales, formularios separados, Confirmar/Cancelar, foto, fechas parciales, texto enriquecido limitado, inclusión/contraer y orden por teclado. 13 tests F4 de aplicación/codec + 4 flujos de UI real, repetidos sin red; F1 3/3, F2 30/30, F3 39/39 y TypeScript/build pasan. [Implementación/límites](f4/EDITOR.md), [evidencia](f4/VALIDATION.md). Al cerrar F4 todavía no se había iniciado F5; su estado actual figura a continuación.

**Depende de:** F3. **Salida:** editor inicial con resúmenes y los tres formularios principales.

- Campos obligatorios/optativos explícitos, contactos/enlaces repetibles, ubicación, periodos/Ongoing y texto enriquecido.
- Foto, selección de campos personales y validación sin descarte silencioso.
- Menús diferenciados de sección/entrada; reordenar por controles de teclado, ocultar, contraer y eliminar.

**Aceptación:** ejecutar Confirmar/Cancelar con un email ficticio; editar una sola educación conserva otras entradas/campos; un cambio de fecha inválido sigue visible hasta corregir/cancelar. Ocultar conserva la entrada, contraer no cambia su inclusión y reordenar persiste tras reinicio.

## F5 — Completar las ocho áreas y los idiomas del MVP

**Estado: APROBADA por el usuario e integrada en main mediante merge commit desde `f5-mvp-sections-languages` — 17 de octubre de 2026.** 32 tests F5 y 82 F2–F4, TypeScript/build, 9 flujos reales UI y los mismos flujos + 32 tests F5 sin red pasan en el control previo al merge. Incluye una corrección acotada de pérdida de protección B durante una actualización tardía del formulario personal, reproducida antes/después. F1 regenerada offline 3/3, sin cambios. Interfaz ES/EN, ocho áreas, fuente B/C y checkpoint/manual durables validados. Motor automático de producción pendiente según la instrucción final del usuario. [Implementación](f5/IMPLEMENTATION.md), [criterios/evidencia](f5/VALIDATION.md). F6 se inició por autorización posterior en su rama independiente.

**Depende de:** F4. **Salida:** habilidades/grupos, lenguas, certificaciones, proyectos y personalizadas, interfaz ES/EN y plan de cambio del contenido con revisión A/B/C. Por la instrucción final del usuario, el contrato TranslationProvider y el flujo manual funcionan sin motor automático definitivo; su selección no bloquea F5 ni autoriza cloud/modelos grandes.

- Habilidades libres, asignación a grupos, renombrado y separación entre desagrupar/eliminar.
- Varias lenguas maternas y cinco dimensiones CEFR independientes.
- Varias entradas por sección, varias secciones personalizadas y modales anidados que respeten Cancelar del padre.
- Interfaz ES/EN independiente del idioma del CV; propuestas A automáticas cuando exista un proveedor autorizado y corrección/entrada manual disponible sin él. Mantener B y revisar C, permitiendo corregir/reutilizar aprobaciones sensibles y señalar las obsoletas. A conservada expresamente mantiene su idioma real.
- Duplicar antes opcionalmente; checkpoint previo y aplicación atómica de contenido/idioma; Cancelar y conflictos sin cambios parciales.

**Aceptación:** CEFR Listening B1 con otras cuatro dimensiones null, dos grupos/custom con IDs/orden propios y Cancelar padre sin confirmar hijo. Un plan ES→EN permite introducir/revisar narrativa inglesa real, conserva literalmente instituciones/nombres, revisa C y elige original/traducción/ambos con reutilización y obsolescencia. Checkpoint previo y transacción; Cancelar/fallar no cambia contenido/idioma. Reapertura/restauración y copia inglesa independiente; UI ES/CV EN y UI EN/CV ES. La integración/calidad/distribución del motor automático queda pendiente de producto antes del cierre del MVP y no se declara validada por el flujo manual F5.

## F6 — Importación estructurada y revisión

**Estado: APROBADA por el usuario e integrada en main mediante merge commit desde `f6-structured-import`.** 25 tests F6 + 114 F2–F5, F1 offline 3/3, TypeScript/build y 13 flujos UI sin red pasan. Ambas muestras privadas recuperan valores del contenido MVP y sobreviven a reapertura, con cinco URLs revisadas expresamente por archivo; se informa recuperación parcial y origen privado para campos/diseño no mapeados. [Implementación](f6/IMPORT.md), [validación y límites](f6/VALIDATION.md). La integración parte de main `238dee3`. F7 no estaba iniciada al cerrar F6.

**Depende de:** F5. **Salida:** importador de formatos propios y subconjunto Europass del MVP, con informes y conservación privada del origen.

- Enumerar adjuntos y detectar datos por contenido; XML independiente UTF-8/UTF-16 y namespaces/contextos.
- Adaptadores hacia el dominio, activos, listas y correspondencias explícitas; no descartar campos desconocidos.
- Una entrada Abrir/Importar detecta `.cvproj` completo, PDF propio de exportación y Europass estructurado; PDF normal informa de ruta asistida/OCR pendiente. Revisar incidencias/candidatos y confirmar copia; añadir al perfil es otra acción.

**Aceptación:** fixtures sintéticos con estructura de las muestras documentadas superan AC-01; cualquier comprobación manual autorizada con originales privados permanece fuera de Git/tests automáticos. Adjuntos ambiguos, XML inválido y tipos no soportados tienen informe explícito. `.cvproj` y PDF tienen alcances de recuperación distintos. Cancelar no cambia la biblioteca. No se atribuyen los cambios manuales históricos al selector de idioma.

## F7 — Primera plantilla original y preview real

**Estado: APROBADA por el usuario e integrada en `main` mediante merge commit desde `f7-simple-template-preview`.** Simple original, snapshot congelado y preview/exportación de los mismos bytes validados. F1 3/3, F2–F7 151/151, 15 flujos UI sin red, 7 casos PDF, TypeScript/build y paquete Linux pasan. La aceptación GTK real pasó como comprobación adicional; su automatización depende del backend y no se presenta como estable. [Implementación](f7/SIMPLE_TEMPLATE.md), [validación y límites](f7/VALIDATION.md). Al cerrar F7 todavía no se había iniciado F8; su estado actual figura a continuación.

**Depende de:** F6 y contrato PDF de F1. **Salida:** plantilla Simple de una columna y visor del PDF generado.

- Resolver campos/variantes efectivamente mostrados, fechas y ajustes en `ExportProjection` desde una instantánea privada congelada; no serializar esta última al PDF.
- Componer con fuentes locales, enlaces activos, foto, listas y numeración.
- Controlar cortes y estados del visor; descartar generaciones obsoletas sin bloquear la escritura.

**Aceptación:** títulos unidos al primer contenido, ninguna línea fuera de margen y textos largos íntegros. Un documento de 48 párrafos propios conserva los 48. Cambiar ajustes no cambia contenido; exportar los mismos bytes vistos conserva páginas y enlaces. Medir el primer conjunto de tiempos, todavía sin declarar el MVP.

## F8 — Segunda plantilla y ciclo portable completo

**Estado: APROBADA por el usuario e integrada en `main` mediante merge commit desde `f8-lateral-portable-cycle`.** Lateral/selector, proyección mínima, ciclos PDF/`.cvproj` y recibos SQLite v3 validados: F1 3/3, F2–F8 163/163, UI 23/23, 26 PDF/corpus, TypeScript/build, paquete Linux 3/3 y offline PASS. [Criterios y límites](f8/VALIDATION.md). No se declara F9 ni aceptación global del MVP.

**Depende de:** F7. **Salida:** Lateral, Exportar → PDF normal y `.cvproj` completo.

- Composición de dos columnas con orden de lectura comprobado.
- Payload PDF exclusivo de lo representado: sin ocultos, alternativas lingüísticas, originales no impresos, historia, borradores o importaciones. Recortes de imágenes y precisión de fecha también minimizados.
- Reapertura de PDF como versión exportada y de `.cvproj` como proyecto completo; registros privados separados y validación de versiones/activos.

**Aceptación:** ambas plantillas superan AC-02/AC-07 y minimización AC-10. Reimportar PDF conserva solo la proyección visible; `.cvproj` recupera proyecto, ocultos, memoria sensible y checkpoints. Retirar el payload deja un PDF válido y detectable como normal; el backup `.cvproj` sigue disponible. Verificar lectura/etiquetado tras posprocesar; no se ofrecen dos categorías de PDF.

## F9 — Aceptación y entrega del MVP

**Estado: NO INICIADA.** Punto pendiente de revisión en F9: **Crash/reconciliation between successful PDF file write and durable ExportRecord**. Deuda conocida de F8; no se implementa reconciliación en este merge.

**Depende de:** F0–F8. **Salida:** versión empaquetada usable para el flujo prioritario del usuario.

- Ejecutar AC-01 a AC-10 y todos los requisitos FR-01 a FR-12 / NF-01 a NF-09 aplicables al MVP.
- Arrancar sin red, importar un fixture conocido, editar/confirmar sin guardar archivo, cerrar/reabrir, traducir ES/EN con revisión, generar PDF y `.cvproj`; reabrir cada uno en una biblioteca vacía y verificar su alcance.
- Medir p95 con equipo, corpus y repeticiones identificados; comprobar teclado/foco y textos de errores.
- Publicar la matriz de compatibilidad real y las limitaciones del MVP, sin redistribuir los CV privados como datos de ejemplo.

**Aceptación:** no hay pérdida de contenido soportado ni errores de guardado ocultos; los objetivos no alcanzados se corrigen o se revisan explícitamente antes de declarar aceptado el MVP. Ningún bloque de la versión 1 se declara terminado por estar previsto.

## F10a — Secciones adicionales con periodos

**Depende de:** F9. **Salida:** conferencias/seminarios, obras creativas, redes/asociaciones, actividad social/política y voluntariado.

**Aceptación:** cada tipo permite dos entradas, periodos válidos y enlaces. En ambas plantillas, el PDF recupera orden/valores/variantes mostrados; `.cvproj` recupera también ocultos y decisiones privadas. No se introduce Ongoing en una importación que no lo traiga.

## F10b — Publicaciones, premios y aficiones

**Depende de:** F9; puede desarrollarse independiente de F10a. **Salida:** los tres tipos con su editor/importador/renderizado.

**Aceptación:** dos entradas por tipo sobreviven al ciclo con el alcance de cada formato: proyección representada en PDF, proyecto completo en `.cvproj`. Referencia bibliográfica libre y datos desglosados son independientes; premio mantiene entidad/fecha; aficiones conserva descripción/enlaces. Los campos antes no mapeados se incorporan mediante revisión, sin duplicaciones silenciosas.

## F10c — Recomendaciones, permisos y declaración final

**Depende de:** F9. **Salida:** los tres tipos restantes y firma gráfica.

**Aceptación:** recomendación sin contacto, tres permisos —B, A1 y personalizado— con validez individual y cierre con firma se recuperan del PDF cuando se muestran, y completamente de `.cvproj`. Cancelar fechas no confirma cambios del padre. Una fila vacía no es un permiso y un cierre vacío no genera página. Firma agrupada y distinguida de foto; en PDF solo activos/valores representados.

## F11 — Importación asistida de PDF de texto

**Depende de:** F9; aceptación completa sobre F10a–F10c. **Salida:** revisión de fragmentos y conversión a datos del dominio.

- Mostrar documento y texto por página; proponer campos/secciones conservando referencia al original.
- Permitir corregir, rechazar y mantener fragmentos sin clasificar. Tratar lectura en columnas y texto Unicode.
- Separar claramente reconstrucción asistida de recuperación estructurada.

**Aceptación:** un PDF sin adjuntos de CV se convierte después de revisión sin inventar fechas/nombres ni prometer la plantilla original. Los fragmentos dudosos permanecen accesibles; cancelar no crea un CV. Un PDF sin texto útil propone OCR en vez de crear un CV aparentemente vacío y completo.

## F12 — OCR local y documentos mixtos

**Depende de:** F11. **Salida:** reconocimiento por página con idiomas disponibles localmente.

- Convertir páginas necesarias a imagen, ejecutar OCR en worker y mostrar progreso/cancelación.
- Revisar texto y página juntos, marcar incertidumbre y evitar duplicar el texto de páginas mixtas.
- Medir Tesseract.js frente a alternativa nativa si rendimiento/distribución lo requieren.

**Aceptación:** ejemplos propios escaneados en español/inglés y con diacríticos producen propuestas revisables; errores de acentos se pueden corregir antes de confirmar. Arranque/OCR sin red con recursos de idioma instalados. Cancelar conserva el estado anterior. No se usa una confianza estimada como prueba de exactitud.

## F13 — Compatibilidad ampliada y aceptación de versión 1

**Depende de:** F10a–F10c, F11 y F12. **Salida:** versión 1 con cobertura declarada y verificable.

- Matriz FR-16: variantes con datos compatibles, seis salidas investigadas, XML/codificaciones/adjuntos y casos rechazados, sin confundir encabezado PDF con estructura de CV.
- Corpus de distintos generadores disponible con autorización, distinguiéndolo de controles artificiales. Los formatos históricos sin muestra continúan como no verificados.
- Ciclos separados de todos los tipos/ambas plantillas: PDF de la proyección visible y `.cvproj` completo, con foto/firma, decisiones lingüísticas, accesibilidad, recuperación y rendimiento.

**Aceptación:** AC-11 a AC-14, FR-13 a FR-16 y requisitos anteriores siguen pasando. Se informa de contraseña/formato/límite no admitidos con salida útil. No se declara compatibilidad universal ni se exige esperar una caducidad remota de Europass.

## Casos de aceptación transversales [D]

| Caso | Procedimiento y resultado observable | Primera puerta |
| --- | --- | --- |
| AC-01 Estructura Europass | Fixtures sintéticos compatibles que reproduzcan ocho educaciones, tres experiencias, dieciocho habilidades/dos grupos, dos lenguas maternas y una extranjera/cinco B2, con contactos/enlaces/foto propios. Cambiar un campo y comparar valores del resto. Muestras privadas solo para comprobación manual autorizada, fuera de Git y tests automatizados. | F6; cierre F9 |
| AC-02 Reapertura con alcance | Para ambas plantillas, PDF → biblioteca vacía recupera solo valores/semántica representados y presentación. `.cvproj` → biblioteca vacía recupera todo el CV, incluidos ocultos, originales/memoria sensible, plantilla, activos y revisiones necesarias. No exigir historial ni versiones no impresas al PDF. | F8 |
| AC-03 Confirmar/Cancelar | Confirmar email ficticio A; editar B; Cancelar. Resumen, revisión y PDF conservan A. Confirmar después B lo conserva tras reinicio. Cancelar no deja un borrador recuperable. | F4 |
| AC-04 Cierre inesperado | Interrumpir con un borrador; al abrir se ofrece recuperar/descartar sobre la revisión correcta. La última confirmación sigue disponible y el borrador no se exporta como confirmado. | F3 |
| AC-05 Idiomas | Narrativa española A → English realmente traducida; institución B intacta; titulación C con propuesta/corrección/aprobación y modos original, traducción, traducción + original. Checkpoint previo recuperable, duplicado independiente, conflicto/cancelación sin mutación. `.cvproj` retiene memoria aprobada; PDF solo las variantes impresas; A no crea memoria perpetua de idiomas. | Exploración F1; dominio F2; contrato/manual F5; motor de producto pendiente; salida F8 |
| AC-06 Perfil independiente | Crear dos CV desde el perfil; editar uno y luego el perfil. Ningún otro documento cambia sin selección/revisión explícita. | F3–F5 |
| AC-07 PDF legible | Texto largo, listas, URL extensa, glifos y foto en ambas plantillas: sin omisión/solape, enlaces activos, lectura lógica, título unido al contenido y comprobación de etiquetas. Preview corresponde al archivo final; comprobar además un lector externo. | F7–F9 |
| AC-08 Copia recuperable | `.cvproj` completo de workspace → biblioteca vacía: perfil, CV, configuración/plantillas, activos, memoria sensible y checkpoints/historial necesarios. Inyectar fallo de escritura sin éxito falso; recuperar el estado previo a traducción. | F3; cierre F9 |
| AC-09 Rendimiento/offline | Equipo NF-05, 100 CV y corpus sintético; medir p95 de operaciones ordinarias y presupuesto separado de traducción. Desconectar antes de iniciar, con recursos instalados, y completar todo el ciclo, incluida traducción ES/EN. | F9 |
| AC-10 Límites y privacidad | Errores/ambigüedades tienen informe útil. Insertar marcadores privados en ocultos, alternativas lingüísticas, historia y fuentes: ninguno aparece en payload/activos. Probar fecha mostrada solo como año, imagen recortada/sin EXIF, C solo traducción y C traducción + original. Retirar payload sin invalidar PDF; `.cvproj` sigue recuperando el completo. | Prueba F1; F6–F9 |
| AC-11 Todos los tipos | Dos entradas por familia repetible, varias custom, permisos/validez y cierre/firma; editar, ordenar y ocultar. PDF conserva únicamente la proyección representada; `.cvproj` recupera también ocultos, decisiones privadas y revisiones necesarias. | F10a–F10c; cierre F13 |
| AC-12 Texto genérico | PDF propio de una/dos columnas sin datos de CV adjuntos; corregir propuestas, conservar referencias y fragmentos pendientes; confirmar un CV nuevo. | F11 |
| AC-13 OCR/mixto | Página escaneada y página con texto/imagen; elegir idioma, corregir errores, evitar duplicados y cancelar una ejecución. Todo local, sin prometer exactitud automática. | F12 |
| AC-14 Matriz ampliada | Registrar por archivo generador/origen, versión observada, presencia de datos, resultado y campos no recuperados. La aceptación del propio programa se distingue de lo que aceptó Europass. | F13 |

Los PDF originales permanecen intactos y privados. Todos los tests usan datos sintéticos propios; las comprobaciones manuales autorizadas de compatibilidad con documentos reales son independientes y no los incorporan al repositorio. Las rutas/guiones/artefactos de REA no son dependencias de producción ni de la suite automatizada.

## Trazabilidad mínima [D]

| Requisitos | Fases responsables |
| --- | --- |
| FR-01, FR-02, FR-12 | F2–F4; aceptación F9 |
| FR-03, FR-06 | F4; ciclo PDF F8–F9 |
| FR-04, FR-05 | F5; ciclo PDF F8–F9 |
| FR-07 | Exploración F1, modelo/checkpoint F2–F3, contrato/revisión/manual F5 y motor pendiente de producto, límites PDF F8 y aceptación F9 |
| FR-08, FR-09 | F6; ampliación F10/F13 |
| FR-10, FR-11 | F1, F7, F8; aceptación F9 |
| FR-13 | F10a, F10b, F10c |
| FR-14, FR-15, FR-16 | F11, F12, F13 respectivamente |
| NF-01, NF-02, NF-08 | F1–F3, F6, F8–F9; regresión F13 |
| NF-03, NF-04 | F1, F4–F5, F7–F9; regresión F13 |
| NF-05 | Base F1/F7; aceptación F9; ampliación F12–F13 |
| NF-06, NF-07, NF-09 | Transversales desde F1; aceptación F9/F13 |

## Ampliaciones posteriores, sin compromiso de MVP [D/P]

Nuevos motores/memorias de traducción, diseños, ajuste de extensión, catálogos/ordenación sugerida, actualización asistida desde el perfil, contraseña conocida, más plataformas y sincronización opcional. La traducción automática ES/EN con revisión ya pertenece al MVP. Ninguna ampliación introduce una dependencia remota implícita para trabajar localmente.

## Decisiones que siguen pendientes [P]

F0 está cerrada por las decisiones finales del usuario. F1 está aprobada con versiones, mediciones y límites en [F1_VALIDATION.md](F1_VALIDATION.md). La traducción queda fuera de sus criterios de cierre por instrucción final del usuario; no se presenta como validada para el producto. F2 está aprobada e integrada en `main` con los límites del contrato inicial en [f2/VALIDATION.md](f2/VALIDATION.md). F3 está aprobada por el usuario e integrada en main [con evidencia propia](f3/VALIDATION.md). F4 está [aprobada por el usuario e integrada en main](f4/VALIDATION.md). F5 está aprobada por el usuario e integrada en main con el alcance manual/contrato autorizado; véase [validación F5](f5/VALIDATION.md). El motor automático definitivo permanece pendiente. F6 está aprobada por el usuario e integrada en main mediante merge commit; véase [validación F6](f6/VALIDATION.md). F7 está aprobada por el usuario e integrada en main mediante merge commit. [Validación F7](f7/VALIDATION.md). F8 está aprobada por el usuario e integrada en main mediante merge commit; [estado real](f8/VALIDATION.md). F9 no iniciada.
