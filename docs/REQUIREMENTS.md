# Requisitos iniciales del producto

Versión 0.1 · 15 de octubre de 2026 · Propuesta pendiente de aprobación. Este documento especifica el producto; no autoriza su implementación.

## Base y alcance de la especificación

Se han leído los informes `00` a `29` de [research](research/), su documentación de escenarios y las instrucciones de [AGENTS.md](research/AGENTS.md). No existe un `AGENTS.md` en la raíz: el archivo fue trasladado a investigación. Su referencia a una fase de investigación se considera histórica; la instrucción actual del usuario cierra esa fase y permite redactar la especificación, manteniendo la prohibición de implementar.

Convenciones comunes a los cuatro documentos:

- **[H] Hecho observado:** respaldado por la investigación, dentro del corpus y recorrido probados.
- **[D] Decisión de diseño nuestra:** propuesta para el producto propio, aunque esté motivada por un hallazgo. No describe la implementación interna de Europass ni implica aprobación del usuario.
- **[P] Pendiente:** decisión del producto o validación técnica que todavía debe resolverse.

**Todos los requisitos siguientes son [D].** Los resultados de investigación justifican su elección, pero no demuestran que nuestra aplicación los cumpla: todavía no existe. [ARCHITECTURE.md](ARCHITECTURE.md), [DATA_MODEL.md](DATA_MODEL.md) y [ROADMAP.md](ROADMAP.md) desarrollan esta misma propuesta.

## Hechos que sustentan el producto

| Base | Hecho observado [H] | Fuente principal |
| --- | --- | --- |
| H01 | El editor separa información personal, educación, experiencia, habilidades e idiomas; los formularios tienen acciones de confirmar y cancelar. | [01](research/01-editor-inicial.md), [02](research/02-informacion-personal.md), [03](research/03-educacion.md), [04](research/04-experiencia.md), [05](research/05-habilidades.md), [06](research/06-idiomas.md) |
| H02 | Se probaron 14 tipos adicionales, varias entradas, varias secciones personalizadas y su ciclo de exportación/importación. No todas las entradas requieren un título: en recomendaciones es obligatoria la descripción. | [15](research/15-inventario-secciones-adicionales.md), [16](research/16-ciclo-secciones-pdf.md), [18](research/18-multiples-orden-y-visibilidad.md) |
| H03 | Se conservó una reordenación manual. La opción Hide probada en una sección vacía pidió retirarla; no demuestra una visibilidad reversible independiente. | [11](research/11-menus-orden-visibilidad.md), [18](research/18-multiples-orden-y-visibilidad.md) |
| H04 | Los dos PDF del usuario contienen datos XML recuperables. Se modificó una copia y se recuperó el cambio tras exportar e importar. No son formularios PDF rellenables. | [12](research/12-importacion-pdf-local.md), [13](research/13-criterios-pdf-editable.md), [21](research/21-importacion-generica-ocr-y-compatibilidad.md) |
| H05 | El selector de idioma cambió etiquetas, sin traducir los textos libres en la prueba controlada. El PDF inglés contiene cambios manuales del usuario. | [14](research/14-idiomas-y-traducciones.md) |
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
5. Conservar el contenido original y permitir traducciones revisadas por campo, especialmente nombres oficiales de certificados, titulaciones y organizaciones.
6. Ampliar después la entrada de datos a PDF genéricos y escaneados mediante revisión asistida.

El producto es un creador de CV: la importación de un PDF genérico recuperará contenido para generar un documento nuevo. La edición libre de cualquier página conservando exactamente su maquetación queda fuera del alcance inicial. No se exige generar XML Europass ni que Europass reimporte nuestros PDF.

## Alcance de las entregas [D]

**MVP:** aplicación de escritorio local, inicialmente para Linux si se aprueba; un perfil maestro y múltiples CV independientes; ocho áreas: datos personales, educación, experiencia, habilidades, idiomas, certificaciones, proyectos y secciones personalizadas. Incluye foto, texto enriquecido básico, interfaz/etiquetas en español e inglés, traducciones manuales, dos plantillas originales, importación estructurada de las muestras Europass, proyecto portable y PDF propio reeditable.

Las plantillas propuestas se denominan **Simple** —una columna— y **Lateral** —dos columnas—. Son nombres y diseños nuestros, no plantillas observadas ni reproducciones de sus recursos.

**Versión 1 completa:** añade los otros once tipos de sección, firma gráfica, importación asistida de PDF de texto, OCR local de escaneados/mixtos y una matriz ampliada de compatibilidad. Estos bloques son obligatorios para esa versión, aunque se entreguen después del MVP.

## Funcionalidades obligatorias del MVP [D]

| ID | Requisito | Criterio verificable |
| --- | --- | --- |
| FR-01 | Biblioteca local y perfil maestro. Crear, nombrar, duplicar, abrir y eliminar CV con confirmación; seleccionar contenido del perfil para crear un CV independiente. | Editar una copia no altera el origen ni el perfil. Se puede trabajar sin cuenta ni conexión. |
| FR-02 | Distinguir borrador de formulario, CV confirmado y archivo exportado. Confirmar valida y guarda localmente; Cancelar descarta el borrador. Guardar y salir espera la escritura. | Tras cancelar vuelve el último valor confirmado. Tras reiniciar permanece lo confirmado. Si hay borrador al salir, se ofrecen Confirmar, Descartar o Continuar editando. Un fallo de disco nunca muestra «guardado». |
| FR-03 | Editar datos personales, educación y experiencia, con contactos/enlaces repetibles, fechas y descripciones. | Se conservan fechas de distinta precisión y fechas finales sin inicial. No se pierden campos opcionales al editar uno distinto. No se impone una fecha inventada ni una estructura obligatoria de nombre y apellidos. |
| FR-04 | Habilidades libres agrupables y lenguas maternas/extranjeras. | Cada idioma extranjero conserva por separado comprensión oral, lectura, interacción oral, expresión oral y escritura, con valores A1–C2 o sin evaluar. Puede guardarse solo una dimensión. Quitar de un grupo y eliminar una habilidad son acciones diferentes; eliminar un grupo conserva sus habilidades sin agrupar. |
| FR-05 | Certificaciones, proyectos y secciones personalizadas con múltiples entradas. | Se distinguen nombre de sección y título de entrada. Las URL se añaden individualmente y se validan. Se admite texto enriquecido semántico sin ejecutar HTML importado. |
| FR-06 | Orden y visibilidad explícitos. Reordenar secciones y entradas con controles accesibles; contraer, ocultar del PDF y eliminar son acciones distintas. | El orden manual persiste aunque no sea cronológico. Ocultar conserva datos y puede revertirse. Eliminar pide confirmación y permite recuperar una versión anterior. |
| FR-07 | Separar idioma de interfaz, idioma de etiquetas del CV y variantes del contenido. Original y traducciones manuales por campo; selección original/traducción/ambos. | Cambiar a inglés muestra qué etiquetas y variantes revisadas se usarán, sin sobrescribir originales. Un certificado mantiene su título oficial. Cambiar el original marca traducciones anteriores para revisión. |
| FR-08 | Importar PDF Europass con datos compatibles y XML independiente. Buscar adjuntos por contenido y reconocer namespaces/estructura, sin depender de su nombre ni de la plantilla. | Los dos PDF aportados recuperan sus ocho educaciones, tres experiencias, dieciocho habilidades, dos grupos y datos de idiomas, además de contactos/foto/enlaces presentes. Una modificación aislada no cambia otros campos. |
| FR-09 | Importación transaccional con revisión y procedencia. Mostrar datos recuperados, ambiguos, no soportados y diferencias entre datos adjuntos y aspecto del PDF. | No se modifica ningún CV antes de aceptar. Importar crea una copia por defecto; añadir al perfil requiere una acción aparte. Se conserva el origen y lo no mapeado en el proyecto privado; una importación parcial se identifica y no se presenta como recuperación completa. |
| FR-10 | Dos plantillas originales y vista previa del PDF efectivamente generado. Ajustar tamaño, color, formato de fechas, foto y numeración. | La vista y el archivo exportado corresponden a la misma revisión/configuración. Textos largos, columnas, enlaces y caracteres con diacríticos se mantienen legibles. Un ajuste visual no modifica datos del CV. |
| FR-11 | Guardar proyectos portables y exportar PDF reeditable o PDF para compartir. Abrir los formatos propios sin perfil maestro previo. | Proyecto/PDF reeditable → nueva biblioteca vacía → edición recupera datos, variantes, orden, visibilidad, activos y ajustes. El PDF para compartir no incluye el proyecto adjunto. Se explica qué información adicional contiene el editable. |
| FR-12 | Versiones y copias recuperables. Historial de confirmaciones y puntos de recuperación para importaciones/restauraciones. Exportación de copia de la biblioteca. | Restaurar crea una nueva revisión, sin destruir el estado anterior. Una copia de biblioteca recupera perfil y CV en una instalación vacía. El archivo original importado nunca se sobrescribe. |

### Reglas transversales de edición y guardado [D]

- Los campos se validan según su tipo; no se exige un título genérico a todas las entradas. Los campos requeridos se explican en el formulario. Un título obligatorio solo con espacios no es válido.
- Fechas: año, mes o día explícitos; calendario correcto; no convertir una fecha parcial en el día 1. Un periodo inequívocamente invertido bloquea confirmar; una fecha incompleta no se descarta en silencio. Véase [DATA_MODEL.md](DATA_MODEL.md).
- Un borrador puede conservarse localmente para recuperar un cierre inesperado, pero no participa en el PDF ni se confunde con una confirmación. Cancelar elimina ese borrador.
- Confirmar actualiza la vista solo tras la transacción durable. Los mensajes diferencian «cambios sin confirmar», «guardando», «guardado localmente», «error de guardado» y «PDF de una revisión anterior».
- Guardar y salir guarda en la biblioteca, sin obligar a exportar ni registrarse. Exportar genera otro archivo; no sustituye el guardado local.
- Las traducciones se revisan manualmente en el MVP. El cambio de idioma por sí solo no llama a un traductor ni empareja automáticamente dos CV importados.
- Una entrada importada incompleta se conserva y se señala; la aplicación ofrece corregirla o excluirla del PDF antes de exportar. Nunca rellena datos personales o fechas por deducción silenciosa.

### Contenido del PDF reeditable [D, requiere aprobación]

La propuesta incluye una instantánea completa **del CV seleccionado**, con sus secciones ocultas, originales, traducciones y ajustes. Esto permite recuperar su visibilidad y variantes sin depender de la base local. No incluye el perfil maestro completo, otros CV, historial, borradores, rutas del equipo ni archivos originales de importación.

Antes de exportar se resume este alcance y se permite elegir el PDF para compartir, sin datos del proyecto. Los datos adjuntos no están cifrados por defecto. La decisión sobre el modo predeterminado debe aprobarse antes de implementarlo; se propone el reeditable por la prioridad expresada de volver a editar archivos locales.

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
| DE-01 | Traducción automática opcional con comparación y aceptación por campo. | Nunca reemplaza originales ni traducciones manuales sin aprobación; cualquier salida de datos del equipo es explícita. |
| DE-02 | Más plantillas originales y ajuste guiado de longitud. | Se conserva todo el contenido; no se promete «dos páginas» ocultando texto o reduciendo indefinidamente la letra. |
| DE-03 | Ordenación cronológica sugerida y actualización asistida desde el perfil. | Vista previa del cambio, aceptación explícita y posibilidad de deshacer; orden manual estable. |
| DE-04 | Windows/macOS, aplicación web o sincronización entre equipos. | Dependen de demanda y validación propia. No añaden una cuenta obligatoria al uso local. |
| DE-05 | Abrir PDF cifrados con una contraseña conocida por el usuario. | Hasta que se implemente, se comunica claramente la limitación. No se intenta eludir el cifrado. |
| DE-06 | Catálogos opcionales de habilidades/ocupaciones y más idiomas. | Texto libre siempre disponible; comprobar licencias y evitar depender de servicios de Europass. |

## Requisitos no funcionales [D]

| ID | Requisito y aceptación propuesta |
| --- | --- |
| NF-01 Autonomía | Con red desactivada desde el arranque: abrir, editar, confirmar, cerrar, reabrir, previsualizar, importar y exportar los formatos del MVP. Sin caducidad temporal del contenido local. |
| NF-02 Durabilidad | Transacciones atómicas; conflictos de revisión detectados; error de escritura visible. Probar cierre forzado, disco lleno y restauración de copia. Una confirmación reconocida debe sobrevivir al reinicio; el borrador se ofrece aparte. |
| NF-03 PDF | A4 inicial, texto seleccionable, enlaces activos, fuentes con licencia y glifos verificados. Títulos unidos al inicio del contenido, sin recortes/solapes ni página vacía artificial. La columna lateral debe mantener lectura comprensible al extraer texto y usar tecnología de asistencia. Comprobar también un lector externo al visor propio. |
| NF-04 Accesibilidad | Formularios y reordenación utilizables con teclado; etiquetas, foco y errores anunciables; contraste verificable. Comprobar etiquetado y orden de lectura del PDF. No declarar conformidad PDF/UA por activar una opción del motor. |
| NF-05 Rendimiento | Objetivos iniciales, todavía no medidos: arranque en frío p95 ≤3 s; respuesta al escribir p95 ≤100 ms; confirmación durable p95 ≤300 ms; preview de CV de hasta 3 páginas p95 ≤2 s tras espera de edición de 400 ms; exportación de 10 páginas p95 ≤5 s; importación estructurada de 3 páginas p95 ≤3 s. OCR tiene progreso y cancelación, sin este límite. |
| NF-06 Privacidad | Contenido y OCR locales; sin telemetría de CV ni cargas automáticas. Los mensajes técnicos omiten datos personales. Los recursos importados no ejecutan código y el exportador no accede a recursos remotos. |
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
| Documento legible con datos reeditables adjuntos. | Formato propio documentado, sin depender del XML o del servidor de Europass. |
| Variación de diseño y orden manual. | Dos diseños originales iniciales; ocultar, contraer y eliminar separados. |
| Idioma de etiquetas seleccionable. | Original y traducciones revisadas independientes; nada de sustitución parcial silenciosa. |
| Importación de datos estructurados. | Ruta asistida para texto genérico y OCR, con revisión y límites de compatibilidad explícitos. |

## Límites y decisiones pendientes [P]

La investigación no determina qué stack usa Europass, la causa del botón deshabilitado, el TTL remoto real ni la compatibilidad universal con versiones antiguas. Tampoco valida todavía nuestro motor PDF, su accesibilidad o el rendimiento propuesto. Ninguno exige reabrir la investigación o esperar 48 horas para especificar el producto.

Antes de programar deben aprobarse conjuntamente:

1. Aplicación de escritorio local con Linux primero, frente a priorizar navegador u otro sistema.
2. Alcance del MVP de ocho áreas, dos plantillas y ES/EN; once tipos, PDF genérico y OCR en fases posteriores obligatorias de la versión 1.
3. Perfil maestro y CV independientes, con cambios transferidos solo de forma explícita.
4. Formato `.cvproj`, PDF reeditable con todo el CV —incluido lo oculto y sus traducciones— y alternativa para compartir; sin obligación de exportar XML Europass.
5. Stack y validación técnica propuestos en [ARCHITECTURE.md](ARCHITECTURE.md), con calidad funcional del PDF y diseños propios como criterio de fidelidad.
