# Requisitos de CVForge

Versión 0.8 · 17 de octubre de 2026 · Decisiones de producto consolidadas por el usuario. Implementación autorizada por fases; F1 está aprobada con el alcance de cierre fijado por el usuario; véase [registro F1](F1_VALIDATION.md). F2 está aprobada e integrada en main. F3 tiene biblioteca/persistencia/recuperación aprobadas por el usuario e integradas en main mediante merge commit; F4 tiene el editor principal de datos personales, educación y experiencia aprobado por el usuario e integrado en main mediante merge commit desde `f4-core-editor`. Véanse [aceptación F2](f2/VALIDATION.md), [validación F3](f3/VALIDATION.md) y [validación F4](f4/VALIDATION.md). F5 está aprobada por el usuario e integrada en main mediante merge commit desde `f5-mvp-sections-languages`, con validación en [f5/VALIDATION.md](f5/VALIDATION.md). F6 aprobada por el usuario e integrada en main mediante merge commit desde `f6-structured-import`. Véanse [alcance](f6/IMPORT.md) y [validación](f6/VALIDATION.md). F7 no iniciada.

## Base y alcance de la especificación

La investigación de [research](research/) está terminada y es evidencia histórica. Las decisiones finales del usuario prevalecen sobre las propuestas de esa investigación y de la versión 0.1. [AGENTS.md](../AGENTS.md) contiene las instrucciones actuales; este documento, [ARCHITECTURE.md](ARCHITECTURE.md), [DATA_MODEL.md](DATA_MODEL.md) y [ROADMAP.md](ROADMAP.md) son la especificación vigente.

Convenciones comunes a los cuatro documentos:

- **[H] Hecho observado:** respaldado por la investigación, dentro del corpus y recorrido probados.
- **[D] Decisión del producto propio:** las decisiones finales de perfil, guardado, PDF, idiomas, importación, diseños y MVP están aprobadas por el usuario. Las elecciones técnicas todavía propuestas se identifican como tales; ninguna describe la implementación interna de Europass.
- **[P] Pendiente:** decisión del producto o validación técnica que todavía debe resolverse.

**Todos los requisitos siguientes son [D].** La investigación no demuestra que nuestra aplicación los cumpla: la aceptación del producto completo sigue pendiente; la evidencia acotada de F1/F2 está registrada por fase. Una propuesta histórica incompatible con estas decisiones no es un requisito vigente.

## Hechos que sustentan el producto

| Base | Hecho observado [H] | Fuente principal |
| --- | --- | --- |
| H01 | El editor separa información personal, educación, experiencia, habilidades e idiomas; los formularios tienen acciones de confirmar y cancelar. | [01](research/01-editor-inicial.md), [02](research/02-informacion-personal.md), [03](research/03-educacion.md), [04](research/04-experiencia.md), [05](research/05-habilidades.md), [06](research/06-idiomas.md) |
| H02 | Se probaron 14 tipos adicionales, varias entradas, varias secciones personalizadas y su ciclo de exportación/importación. No todas las entradas requieren un título: en recomendaciones es obligatoria la descripción. | [15](research/15-inventario-secciones-adicionales.md), [16](research/16-ciclo-secciones-pdf.md), [18](research/18-multiples-orden-y-visibilidad.md) |
| H03 | Se conservó una reordenación manual. La opción Hide probada en una sección vacía pidió retirarla; no demuestra una visibilidad reversible independiente. | [11](research/11-menus-orden-visibilidad.md), [18](research/18-multiples-orden-y-visibilidad.md) |
| H04 | Los dos PDF del usuario contienen datos XML recuperables. Se modificó una copia y se recuperó el cambio tras exportar e importar. No son formularios PDF rellenables. | [13](research/13-criterios-pdf-editable.md), [21](research/21-importacion-generica-ocr-y-compatibilidad.md) |
| H05 | El selector de idioma cambió etiquetas, sin traducir los textos libres en la prueba controlada. El PDF inglés contiene cambios manuales del usuario. | [23](research/23-cierre-investigacion-y-criterios.md), [28](research/28-mejoras-necesarias-y-aceptacion.md) |
| H06 | Fechas parciales o imposibles se descartaron en algunas pruebas; hubo títulos con espacios aceptados. Se comprobaron fecha final sin inicial, periodos y estados Ongoing. | [17](research/17-fechas-y-validaciones.md) |
| H07 | Foto, firma gráfica, negrita, cursiva, viñetas y enlaces se recuperaron en pruebas concretas. | [19](research/19-fotografia-firma-y-texto-enriquecido.md) |
| H08 | Se observaron Classic, Modern, Progress, Timeline, Accent y Elegant. La misma información produjo distinta paginación; no se observó una plantilla llamada Simple. | [08](research/08-plantillas.md), [20](research/20-plantillas-paginacion-y-rendimiento.md), [25](research/25-comparativa-visual-formatos-pdf.md) |
| H09 | La compatibilidad estructurada depende de los datos adjuntos y su interpretación. Los PDF genéricos/escaneados probados fueron rechazados. Las 25 variantes adicionales son controles, no 25 generadores independientes. | [21](research/21-importacion-generica-ocr-y-compatibilidad.md), [26](research/26-compatibilidad-ampliada-pdf.md) |
| H10 | La recarga recuperó contenido confirmado; no se recuperó la edición sin confirmar. El reinicio no ofreció reanudación. El flujo estándar Download → Finish se comprobó; Save and exit del beta permaneció deshabilitado. | [22](research/22-borradores-salida-y-persistencia.md), [24](research/24-save-and-exit-y-editor-estandar.md) |
| H11 | La simulación de tiempo no demostró el TTL real. El usuario descartó esperar 48 horas y priorizó archivos locales reeditables. | [23](research/23-cierre-investigacion-y-criterios.md), [27](research/27-caducidad-real-48-horas.md), [29](research/29-simulacion-caducidad-y-recuperacion.md) |

Las ampliaciones y pruebas corregidas prevalecen sobre dudas históricas de capturas anteriores. [28 — Mejoras y aceptación](research/28-mejoras-necesarias-y-aceptacion.md) es la principal síntesis funcional de partida.

## Objetivos del producto [D]

1. Crear y gestionar CV propios con edición ágil, archivos locales y funcionamiento sin servicios de Europass.
2. Generar PDF profesionales del mismo tipo funcional: texto seleccionable, enlaces, fotografía, secciones, columnas y paginación cuidada, mediante diseños originales.
3. Reabrir PDF Europass compatibles y PDF propios para modificar los datos y generar una nueva salida.
4. Mantener una trayectoria completa en un perfil maestro y producir distintos CV adaptados sin que editar uno cambie los demás.
5. Traducir realmente un CV entre español e inglés, protegiendo nombres propios y revisando términos sensibles. Conservar originales y traducciones sensibles aprobadas en el proyecto completo.
6. Ampliar después la entrada de datos a PDF genéricos y escaneados mediante revisión asistida.

El producto es un creador de CV: la importación de un PDF genérico recuperará contenido para generar un documento nuevo. La edición libre de cualquier página conservando exactamente su maquetación queda fuera del alcance inicial. No se exige generar XML Europass ni que Europass reimporte nuestros PDF.

## Alcance de las entregas [D]

**MVP:** aplicación local; un perfil maestro y múltiples CV independientes; ocho áreas: datos personales, educación, experiencia, habilidades, idiomas, certificaciones, proyectos y secciones personalizadas. Incluye foto, texto enriquecido básico, ES/EN con traducción real y revisión, dos plantillas originales, biblioteca durable automática, importación estructurada Europass, PDF y `.cvproj` completo. La arquitectura de escritorio y Linux como entorno inicial de validación se mantienen como propuesta técnica para F1.

Las plantillas propuestas se denominan **Simple** —una columna— y **Lateral** —dos columnas—. Son nombres y diseños nuestros, no plantillas observadas ni reproducciones de sus recursos.

**Versión 1 completa:** añade los otros once tipos de sección, firma gráfica, importación asistida de PDF de texto, OCR local de escaneados/mixtos y una matriz ampliada de compatibilidad. Estos bloques son obligatorios para esa versión, aunque se entreguen después del MVP.

## Funcionalidades obligatorias del MVP [D]

| ID | Requisito | Criterio verificable |
| --- | --- | --- |
| FR-01 | Biblioteca local y perfil maestro. Crear, nombrar, duplicar, abrir y eliminar CV con confirmación; seleccionar contenido del perfil para crear un CV independiente. | Editar una copia no altera el origen ni el perfil. Se puede trabajar sin cuenta ni conexión. |
| FR-02 | Biblioteca local guardada automáticamente. Distinguir borrador de formulario, CV confirmado y exportación. Confirmar valida y persiste sin pedir archivo; Cancelar descarta el borrador. | Editar no exige guardar un `.cvproj` cada vez. Tras cancelar vuelve el último valor confirmado; tras reiniciar permanece lo confirmado. Salir resuelve borradores y espera escrituras. Un fallo de disco nunca muestra «guardado». |
| FR-03 | Editar datos personales, educación y experiencia, con contactos/enlaces repetibles, fechas y descripciones. | Se conservan fechas de distinta precisión y fechas finales sin inicial. No se pierden campos opcionales al editar uno distinto. No se impone una fecha inventada ni una estructura obligatoria de nombre y apellidos. |
| FR-04 | Habilidades libres agrupables y lenguas maternas/extranjeras. | Cada idioma extranjero conserva por separado comprensión oral, lectura, interacción oral, expresión oral y escritura, con valores A1–C2 o sin evaluar. Puede guardarse solo una dimensión. Quitar de un grupo y eliminar una habilidad son acciones diferentes; eliminar un grupo conserva sus habilidades sin agrupar. |
| FR-05 | Certificaciones, proyectos y secciones personalizadas con múltiples entradas. | Se distinguen nombre de sección y título de entrada. Las URL se añaden individualmente y se validan. Se admite texto enriquecido semántico sin ejecutar HTML importado. |
| FR-06 | Orden y visibilidad explícitos. Reordenar secciones y entradas con controles accesibles; contraer, ocultar del PDF y eliminar son acciones distintas. | El orden manual persiste aunque no sea cronológico. Ocultar conserva datos y puede revertirse. Eliminar pide confirmación y permite recuperar una versión anterior. |
| FR-07 | Cambiar el idioma del CV traduce su contenido, además de etiquetas. Proponer traducciones, revisar lo necesario y confirmar; permitir duplicar antes. Clasificar campos A/B/C según la política lingüística siguiente. | Antes de aplicar existe una revisión recuperable. La narrativa cambia al idioma destino; personas, empresas, instituciones y contactos se mantienen. Una titulación requiere decisión revisable, con original, traducción o traducción + original. Cancelar/fallar no cambia el CV ni su idioma. |
| FR-08 | Importar PDF Europass con datos compatibles y XML independiente. Buscar adjuntos por contenido y reconocer namespaces/estructura, sin depender de su nombre ni de la plantilla. | Fixtures sintéticos reproducen la estructura investigada: ocho educaciones, tres experiencias, dieciocho habilidades, dos grupos e idiomas, contactos/foto/enlaces propios. Una modificación aislada conserva el resto. Los originales privados solo se usan en comprobaciones manuales autorizadas, fuera de Git/tests automatizados. |
| FR-09 | Una entrada Abrir/Importar detecta `.cvproj`, PDF propio con datos de exportación, PDF Europass compatible y PDF normal. Revisión proporcional al resultado, con detalles técnicos secundarios. | `.cvproj` recupera el proyecto; PDF propio, solo su versión exportada; Europass usa sus datos compatibles. El PDF normal anuncia la ruta asistida/OCR posterior. Las ambigüedades no se ocultan. Importar crea copia por defecto y nunca modifica el perfil automáticamente. |
| FR-10 | Dos plantillas originales y vista previa del PDF efectivamente generado. Ajustar tamaño, color, formato de fechas, foto y numeración. | La vista y el archivo exportado corresponden a la misma revisión/configuración. Textos largos, columnas, enlaces y caracteres con diacríticos se mantienen legibles. Un ajuste visual no modifica datos del CV. |
| FR-11 | Exportar → PDF produce un PDF profesional normal. Puede llevar un modelo estructurado mínimo de esa exportación. `.cvproj` es el formato portable completo para backup, transferencia y continuación del trabajo. | El PDF recupera solo valores/semántica visibles y configuración necesaria; no incluye datos personales no representados. `.cvproj` recupera también contenido oculto, decisiones lingüísticas, traducciones sensibles aprobadas, activos y revisiones necesarias. Perder el adjunto del PDF no afecta a su validez ni al backup `.cvproj`. |
| FR-12 | Versiones recuperables en la biblioteca y `.cvproj`. Puntos de recuperación antes de aplicar una traducción completa, importar o restaurar; copia de biblioteca. | Restaurar crea una nueva revisión. El punto previo a traducción se conserva hasta su eliminación explícita y viaja en el proyecto completo del CV. La copia de biblioteca incluye perfil y CV. No se exige recuperar historial desde PDF. |

### Reglas transversales de edición y guardado [D]

- Los campos se validan según su tipo; no se exige un título genérico a todas las entradas. Los campos requeridos se explican en el formulario. Un título obligatorio solo con espacios no es válido.
- Fechas: año, mes o día explícitos; calendario correcto; no convertir una fecha parcial en el día 1. Un periodo inequívocamente invertido bloquea confirmar; una fecha incompleta no se descarta en silencio. Véase [DATA_MODEL.md](DATA_MODEL.md).
- Un borrador puede conservarse localmente para recuperar un cierre inesperado, pero no participa en el PDF ni se confunde con una confirmación. Cancelar elimina ese borrador.
- Confirmar actualiza la vista solo tras la transacción durable. Los mensajes diferencian «cambios sin confirmar», «guardando», «guardado localmente», «error de guardado» y «PDF de una revisión anterior».
- Guardar y salir guarda en la biblioteca, sin obligar a exportar ni registrarse. Exportar genera otro archivo; no sustituye el guardado local.
- Cambiar idioma del CV inicia traducción real, revisión y confirmación; cambiar solo el idioma de interfaz no altera contenido. La operación se aplica atómicamente sobre una revisión base y nunca empareja automáticamente dos CV importados.
- Una entrada importada incompleta se conserva y se señala; la aplicación ofrece corregirla o excluirla del PDF antes de exportar. Nunca rellena datos personales o fechas por deducción silenciosa.

### Biblioteca automática y proyecto completo [D]

La biblioteca local persiste cambios y borradores recuperables sin pedir destinos de archivo en cada edición. Confirmar es una decisión de edición, no «guardar como». `.cvproj` es una acción de portabilidad/backup y no un requisito para que un cambio confirmado sobreviva al cierre.

El proyecto de un CV contiene su contenido completo, configuración y definición/versiones de plantilla necesarias, orden/visibilidad, activos, decisiones de idioma, traducciones sensibles aprobadas y revisiones/puntos de recuperación necesarios. Una copia de biblioteca puede incluir además perfil y otros CV, con alcance declarado. La recuperación no depende de rutas privadas o servicios de Europass.

### Regla de minimización del PDF [D, decisión final]

Hay una exportación normal **Exportar → PDF**. No se crean categorías de «PDF completo» y «PDF para compartir». El documento puede incorporar datos estructurados propios, pero ese modelo se genera exclusivamente a partir de lo que representa esa exportación.

Permitido: tipos de sección/campo, valores mostrados, orden visible, precisión de fechas representada, idioma mostrado, plantilla/versión, configuración visual necesaria y activos efectivamente usados. Si se muestra traducción + original, ambos textos pueden figurar; si solo se muestra traducción, su original privado queda fuera.

Prohibido: secciones/campos ocultos, entradas excluidas, perfil maestro, otros CV, historial, borradores, traducciones alternativas, versiones lingüísticas completas no mostradas, originales de importación o cualquier información privada ajena a la salida. Ni nombres privados de biblioteca, procedencia, EXIF ni partes recortadas de una foto deben filtrarse al modelo adjunto. Un formato de fecha que solo muestra el año no autoriza a adjuntar día/mes omitidos.

El PDF no contiene un `.cvproj` completo: usa un contrato reducido de exportación separado. Si una herramienta elimina ese modelo, el PDF sigue siendo válido y la futura ruta de extracción asistida/OCR puede tratarlo como PDF normal. `.cvproj` sigue siendo el backup fiable. No se exige igualdad de proyecto completo al reimportar un PDF.

### Política lingüística y cambio completo de idioma [D]

| Clase | Tratamiento | Persistencia |
| --- | --- | --- |
| A — Narrativa traducible | Sobre mí, responsabilidades, descripciones, proyectos y textos personalizados: generar traducción automática, permitir corrección y confirmar el nuevo contenido. Proteger nombres/identificadores también cuando aparecen dentro de una narración. | Texto activo en el idioma actual; propuestas temporales. No se conserva un mapa perpetuo de todas las traducciones narrativas. La revisión previa permite recuperar el estado anterior. |
| B — No traducible automáticamente | Personas, empresas, instituciones, marcas, emails, teléfonos, URL, identificadores y términos técnicos protegidos se mantienen literalmente. «Universidad Carlos III de Madrid» permanece igual. | Valor literal; no inventar equivalentes ni guardar falsas variantes traducidas. |
| C — Traducción sensible | Titulaciones, certificaciones, cursos, asignaturas, cargos y terminología ambigua: proponer sin convertirlo en una equivalencia oficial; corregir y aprobar o conservar el original explícitamente. | Original y traducciones aprobadas con idioma/contexto y revisión, reutilizables en `.cvproj`. Mostrar solo original, solo traducción o traducción + original. |

Flujo: CV español → opcionalmente duplicar → elegir English → generar propuestas → revisar campos sensibles y cambios necesarios → crear/fijar revisión recuperable del estado previo → confirmar contenido e idioma de forma atómica → CV inglés. Una traducción incompleta o fallida no se presenta como un CV completamente traducido; cualquier mezcla aceptada se hace explícita en la revisión.

La instrucción final de F5 permite cerrar el contrato, plan revisable y flujo manual aunque no haya proveedor automático definitivo. F5 no instala un motor ni descarga pesos: introduce traducciones reales revisadas manualmente, con checkpoint, protección B y memoria C. Conservar A explícitamente mantiene su idioma real. La selección/validación del motor automático sigue siendo pendiente de producto antes de aceptar FR-07/NF-01 para el MVP; no bloquea el resto de F5.

El motor de traducción local y su empaquetado siguen pendientes para la integración de producto; por decisión final del usuario, no son criterio de cierre F1. La traducción automática forma parte del MVP, no queda relegada a una mejora opcional. No se enviará contenido a servicios externos de forma implícita.

## Funcionalidades obligatorias de la versión 1 completa [D]

| ID | Requisito | Criterio verificable |
| --- | --- | --- |
| FR-13 | Completar los once tipos restantes: conferencias/seminarios, obras creativas, permisos de conducir, aficiones, premios, redes/asociaciones, publicaciones, recomendaciones, actividad social/política, voluntariado y declaración final/firma. | Cada tipo mantiene su semántica, repetibilidad y campos del inventario. Los permisos tienen validez individual. Las recomendaciones admiten descripción sin contacto. La firma es una imagen, no una firma criptográfica. |
| FR-14 | Importación asistida de PDF de texto sin datos estructurados. | Mostrar texto y página de procedencia, proponer agrupaciones, permitir corregir o dejar datos sin clasificar y confirmar el resultado. No prometer recuperar la plantilla original. |
| FR-15 | OCR local de páginas escaneadas o mixtas. | Elegir idiomas de reconocimiento, revisar texto junto a la página, marcar incertidumbre, cancelar y observar progreso. El resultado se confirma antes de crear un CV; no se etiqueta como extracción exacta. |
| FR-16 | Ampliar y publicar la matriz real de compatibilidad. | Probar las seis salidas de plantilla investigadas, adjuntos múltiples/renombrados, XML UTF-8/UTF-16, namespaces, texto en columnas y casos erróneos. Registrar recuperado, parcial, asistido o rechazado; no afirmar «cualquier PDF». |

En el MVP, tipos todavía no editables se conservan como información no mapeada y se identifican como pendientes. No se eliminan al abrir ni se exportan como si se hubieran recuperado íntegramente. La compatibilidad completa de esos tipos exige FR-13.

## Funcionalidades deseables [D]

| ID | Función | Condición |
| --- | --- | --- |
| DE-01 | Ampliar memorias sensibles, sugerencias terminológicas y motores de traducción. | La traducción real ES/EN ya es obligatoria en FR-07; estas ampliaciones no sustituyen la revisión ni convierten propuestas en equivalencias oficiales. |
| DE-02 | Más plantillas originales y ajuste guiado de longitud. | Se conserva todo el contenido; no se promete «dos páginas» ocultando texto o reduciendo indefinidamente la letra. |
| DE-03 | Ordenación cronológica sugerida y actualización asistida desde el perfil. | Vista previa del cambio, aceptación explícita y posibilidad de deshacer; orden manual estable. |
| DE-04 | Windows/macOS, aplicación web o sincronización entre equipos. | Dependen de demanda y validación propia. No añaden una cuenta obligatoria al uso local. |
| DE-05 | Abrir PDF cifrados con una contraseña conocida por el usuario. | Hasta que se implemente, se comunica claramente la limitación. No se intenta eludir el cifrado. |
| DE-06 | Catálogos opcionales de habilidades/ocupaciones y más idiomas. | Texto libre siempre disponible; comprobar licencias y evitar depender de servicios de Europass. |

## Requisitos no funcionales [D]

| ID | Requisito y aceptación propuesta |
| --- | --- |
| NF-01 Autonomía | Con red desactivada desde el arranque y recursos locales instalados: abrir, editar, traducir ES/EN, confirmar, cerrar, reabrir, previsualizar, importar y exportar los formatos del MVP. Sin caducidad temporal del contenido local. El motor/modelo de traducción deberá validarse antes de aceptar este requisito del MVP; no es criterio de cierre F1. |
| NF-02 Durabilidad | Transacciones atómicas; conflictos de revisión detectados; error de escritura visible. Probar cierre forzado, disco lleno y restauración de copia. Una confirmación reconocida debe sobrevivir al reinicio; el borrador se ofrece aparte. |
| NF-03 PDF | A4 inicial, texto seleccionable, enlaces activos, fuentes con licencia y glifos verificados. Títulos unidos al inicio del contenido, sin recortes/solapes ni página vacía artificial. La columna lateral debe mantener lectura comprensible al extraer texto y usar tecnología de asistencia. Comprobar también un lector externo al visor propio. |
| NF-04 Accesibilidad | Formularios y reordenación utilizables con teclado; etiquetas, foco y errores anunciables; contraste verificable. Comprobar etiquetado y orden de lectura del PDF. No declarar conformidad PDF/UA por activar una opción del motor. |
| NF-05 Rendimiento | Objetivos iniciales, todavía no medidos: arranque en frío p95 ≤3 s; respuesta al escribir p95 ≤100 ms; confirmación durable p95 ≤300 ms; preview de CV de hasta 3 páginas p95 ≤2 s tras espera de edición de 400 ms; exportación de 10 páginas p95 ≤5 s; importación estructurada de 3 páginas p95 ≤3 s. Traducción y OCR tienen progreso/cancelación y presupuesto propio por medir, sin bloquear la edición. |
| NF-06 Privacidad | Contenido, traducción y OCR locales; sin telemetría de CV ni cargas automáticas. Los mensajes técnicos omiten datos personales. Los recursos importados no ejecutan código y el exportador no accede a recursos remotos. |
| NF-07 Robustez | Para importar un CV: entrada limitada inicialmente a 50 MiB; paquete expandido a 100 MiB/1.000 ficheros; XML/JSON de control a 10 MiB y profundidad 128. Las copias de workspace usan límites propios configurables, calculados y declarados antes de escribir/restaurar, sin aplicarles el tamaño de un solo CV. Rechazar límites excedidos con explicación, sin truncar. Probar archivos corruptos, cifrados y adjuntos ambiguos. Límites revisables con evidencia. |
| NF-08 Evolución | Formatos, modelo y plantillas versionados; migraciones con recuperación; un formato futuro desconocido nunca se guarda destructivamente como si fuera compatible. |
| NF-09 Independencia | Código, plantillas, estilos, iconos y recursos propios o con licencia compatible. Los PDF del usuario son entradas privadas de prueba; no se redistribuyen como recursos de la aplicación. |

El equipo de referencia propuesto para NF-05 es Linux de escritorio con 4 núcleos, 8 GiB de RAM y SSD, biblioteca de 100 CV y corpus identificado. Antes de aceptar resultados se fijarán CPU, sistema, resolución y versiones concretas, distinguiendo caché fría/caliente. Estas cifras son objetivos nuestros, no tiempos demostrados ni extrapolaciones de Europass.

## Comportamientos que conservar y mejorar [D]

| Conservar por su utilidad | Mejorar o decidir de otra forma |
| --- | --- |
| Formularios por sección, Confirmar/Cancelar y resumen de entradas. | Estado local durable, recuperación explícita y salida sin registro ni expiración. |
| Entradas repetibles, enlaces, descripciones, idiomas por destreza. | No descartar fechas inválidas; admitir precisión explícita y errores útiles. |
| Separación de contenido y opciones de presentación. | Preview del mismo PDF que se exporta y ajustes restaurados al importar. |
| Documento legible con semántica recuperable. | PDF limitado a su salida visible; `.cvproj` completo y biblioteca automática para continuidad fiable. |
| Variación de diseño y orden manual. | Dos diseños originales iniciales; ocultar, contraer y eliminar separados. |
| Idioma del documento seleccionable. | Traducción real con revisión previa recuperable, nombres protegidos y memoria de términos sensibles. |
| Importación de datos estructurados. | Ruta asistida para texto genérico y OCR, con revisión y límites de compatibilidad explícitos. |

## Límites y decisiones pendientes [P]

La investigación no determina qué stack usa Europass, la causa del botón deshabilitado, el TTL remoto real ni la compatibilidad universal con versiones antiguas. Tampoco valida todavía nuestro motor PDF, su accesibilidad o el rendimiento propuesto. Ninguno exige reabrir la investigación o esperar 48 horas para especificar el producto.

Las decisiones de perfil, biblioteca automática, `.cvproj` completo, PDF limitado a su exportación, traducción real A/B/C, importación inteligente, diseños propios y MVP están cerradas por el usuario. F0 queda completada a nivel de decisiones de producto.

F1 ha validado empaquetado, persistencia, composición y adjuntos PDF con minimización efectiva y lectura en el corpus de prueba. Por decisión final del usuario, la traducción no es criterio necesario de su cierre y no se desarrolla más en F1; sigue siendo requisito de producto en las fases posteriores. Las dependencias/versiones y sus límites validados constan en el registro F1; no se exige volver a aprobar las decisiones de producto ya cerradas. F2 ha integrado en main el dominio y el contrato `.cvproj` inicial, con alcance y límites en [f2/VALIDATION.md](f2/VALIDATION.md). F3 tiene biblioteca durable, borradores, historial y copia/restauración [aprobados e integrados en main](f3/VALIDATION.md). F4 tiene el editor principal [aprobado por el usuario e integrado en main](f4/VALIDATION.md). F5 completa las áreas y el workflow manual/revisable, aprobados por el usuario e integrados en main; [alcance real](f5/IMPLEMENTATION.md). F6 está aprobada e integrada en main; [validación](f6/VALIDATION.md). No se declara terminado el MVP ni se inicia F7.
