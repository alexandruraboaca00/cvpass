# Roadmap de implementación

Versión 0.1 · 15 de octubre de 2026 · Plan propuesto, pendiente de aprobación. **No autoriza programar ni describe trabajo ya implementado.**

## Alcance y criterio de avance [D]

Todas las fases son decisiones nuestras [D], derivadas de [REQUIREMENTS.md](REQUIREMENTS.md), [ARCHITECTURE.md](ARCHITECTURE.md) y [DATA_MODEL.md](DATA_MODEL.md). La evidencia funcional principal está en [23 — Cierre](research/23-cierre-investigacion-y-criterios.md) y [28 — Mejoras](research/28-mejoras-necesarias-y-aceptacion.md), con los límites posteriores de [29](research/29-simulacion-caducidad-y-recuperacion.md).

La fase de investigación ha terminado. No hay esperas de 48 horas ni acciones manuales pendientes en Europass. Las comprobaciones siguientes se harán sobre nuestra aplicación cuando se autorice construirla; las pruebas hechas en Europass no las sustituyen.

Cada fase debe entregar un resultado revisable y superar su criterio antes de ampliar alcance. Se fija entonces la versión de dependencias utilizada y se conserva la evidencia de aceptación. No se asignan fechas sin estimar sobre los primeros resultados.

**Corte de MVP: F0 a F9.** Ocho áreas —datos personales, educación, experiencia, habilidades, idiomas, certificaciones, proyectos y personalizadas—; dos plantillas propias —Simple/Lateral—; interfaz/etiquetas ES/EN; traducción manual por campo; importación estructurada; proyecto portable, PDF reeditable y PDF para compartir; biblioteca durable offline.

**Versión 1 completa: añade F10a, F10b, F10c, F11, F12 y F13.** Completa once tipos de sección, firma gráfica, PDF de texto y OCR. No son condiciones ocultas para dar por terminado el MVP ni funciones que se puedan declarar completas antes de ejecutarlas.

## F0 — Aprobar el alcance y las decisiones

**Entrada:** estos cuatro documentos. **Salida:** especificación acordada y autorización explícita para programar.

- Resolver escritorio local/Linux primero, stack y alternativa de plataforma si procede.
- Aprobar independencia perfil/CV, alcance del MVP y fases posteriores.
- Aprobar `.cvproj`, alcance de los datos adjuntos, modo de PDF predeterminado y alternativa para compartir.
- Aceptar diseños propios y calidad funcional como objetivo, sin exigir copia exacta de las plantillas de Europass.

**Aceptación:** decisiones registradas en estos documentos, discrepancias resueltas y autorización de implementación. Hasta entonces solo documentación.

## F1 — Validar las decisiones técnicas críticas

**Depende de:** F0. **Salida:** prueba técnica mínima y decisión de continuar o revisar el stack.

- Empaquetar Electron con React/TypeScript y el módulo SQLite en worker; crear, confirmar y reabrir una entidad con imagen.
- Generar un PDF propio de una y dos columnas con textos largos, enlaces y glifos de español/inglés/rumano. Mostrar los mismos bytes mediante PDF.js.
- Adjuntar un paquete mínimo con pdf-lib y recuperarlo en una ejecución nueva; comparar páginas, texto, enlaces, fuentes y etiquetado antes/después. Evaluar qpdf si falla.
- Probar reglas de corte y lectura; fijar las versiones estables y el método de empaquetado. Registrar el tamaño del ejecutable y una primera medición.

**Aceptación:** el ejecutable empaquetado funciona sin red y supera el ciclo. Un defecto de lectura, pérdida de enlaces/etiquetas o fallo del módulo nativo bloquea la decisión afectada: se cambia el adaptador/motor antes de extenderlo. Esta fase no da por validado el producto completo.

## F2 — Dominio, invariantes y formato versionado

**Depende de:** F1. **Salida:** modelo independiente de UI/SQLite y contrato portable inicial.

- Implementar IDs, entidades, orden, inclusión, fechas parciales/periodos, árbol enriquecido y variantes lingüísticas.
- Definir el manifiesto `.cvproj`, versiones, política `cv/workspace` y política del paquete distribuible en PDF.
- Validar referencias, límites, activos y migraciones con datos propios pequeños.

**Aceptación:** fechas de año/mes/día y fecha final sola no se convierten a valores inventados; periodo invertido y título blanco producen errores concretos; cinco niveles CEFR parciales y traducciones desactualizadas se conservan. Un manifiesto futuro incompatible o hash incorrecto no se guarda con pérdida. Las pruebas verifican estos contratos y migraciones, no detalles internos de la implementación.

## F3 — Biblioteca, persistencia y recuperación

**Depende de:** F2. **Salida:** biblioteca local con perfil, CV, borradores, revisiones y copias.

- Crear/duplicar/eliminar CV; copiar contenido del perfil de forma independiente.
- Transacciones de confirmación con revisión esperada, historial y activos; borrador separado y Cancelar.
- Guardar y salir, recuperación tras cierre inesperado y copia/restauración lógica de workspace.

**Aceptación:** confirmar y reiniciar conserva el dato; cancelar conserva el anterior; un borrador recuperado requiere aceptación; una revisión antigua no sobrescribe una nueva. Probar fallo de escritura y cierre forzado sin mostrar éxito falso. Restaurar la copia en una biblioteca vacía recupera perfil, CV y activos anunciados.

## F4 — Editor de datos personales, educación y experiencia

**Depende de:** F3. **Salida:** editor inicial con resúmenes y los tres formularios principales.

- Campos obligatorios/optativos explícitos, contactos/enlaces repetibles, ubicación, periodos/Ongoing y texto enriquecido.
- Foto, selección de campos personales y validación sin descarte silencioso.
- Menús diferenciados de sección/entrada; reordenar por controles de teclado, ocultar, contraer y eliminar.

**Aceptación:** ejecutar Confirmar/Cancelar con un email ficticio; editar una sola educación conserva otras entradas/campos; un cambio de fecha inválido sigue visible hasta corregir/cancelar. Ocultar conserva la entrada, contraer no cambia su inclusión y reordenar persiste tras reinicio.

## F5 — Completar las ocho áreas y los idiomas del MVP

**Depende de:** F4. **Salida:** habilidades/grupos, lenguas, certificaciones, proyectos y personalizadas, más revisión manual de traducciones.

- Habilidades libres, asignación a grupos, renombrado y separación entre desagrupar/eliminar.
- Varias lenguas maternas y cinco dimensiones CEFR independientes.
- Varias entradas por sección, varias secciones personalizadas y modales anidados que respeten Cancelar del padre.
- Interfaz/etiquetas ES/EN, originales y traducciones por campo, revisión del plan de cambio de idioma.

**Aceptación:** idioma con solo comprensión oral B1 se conserva; dos grupos y dos secciones personalizadas mantienen orden/IDs; cancelar el formulario padre no confirma el modal hijo. Cambiar a inglés no modifica un certificado original, usa solo variantes revisadas y señala las que quedaron desactualizadas.

## F6 — Importación estructurada y revisión

**Depende de:** F5. **Salida:** importador de formatos propios y subconjunto Europass del MVP, con informes y conservación privada del origen.

- Enumerar adjuntos y detectar datos por contenido; XML independiente UTF-8/UTF-16 y namespaces/contextos.
- Adaptadores hacia el dominio, activos, listas y correspondencias explícitas; no descartar campos desconocidos.
- Revisar propuestas, escoger entre candidatos y confirmar un CV nuevo. Añadir al perfil es otra acción.

**Aceptación:** ambos PDF del usuario recuperan el contenido soportado del caso AC-01. Adjuntos renombrados/múltiples, XML inválido y datos incompletos dan resultados explicables. Si hay un tipo aún no editable, aparece como parcial y queda conservado; no se exporta como recuperación íntegra. Cancelar la importación no cambia la biblioteca. No se atribuye al selector de idioma la traducción manual del PDF inglés.

## F7 — Primera plantilla original y preview real

**Depende de:** F6 y contrato PDF de F1. **Salida:** plantilla Simple de una columna y visor del PDF generado.

- Resolver variantes, campos visibles, fechas y ajustes desde una instantánea congelada.
- Componer con fuentes locales, enlaces activos, foto, listas y numeración.
- Controlar cortes y estados del visor; descartar generaciones obsoletas sin bloquear la escritura.

**Aceptación:** títulos unidos al primer contenido, ninguna línea fuera de margen y textos largos íntegros. Un documento de 48 párrafos propios conserva los 48. Cambiar ajustes no cambia contenido; exportar los mismos bytes vistos conserva páginas y enlaces. Medir el primer conjunto de tiempos, todavía sin declarar el MVP.

## F8 — Segunda plantilla y ciclo portable completo

**Depende de:** F7. **Salida:** Lateral, PDF reeditable/para compartir y proyectos/copias portables.

- Composición de dos columnas con orden de lectura comprobado.
- Paquete de un CV con datos ocultos/variantes según la política aprobada; resumen de exportación y salida sin paquete.
- Reapertura independiente de la biblioteca de origen; registro de revisión exportada y controles de versiones/activos.

**Aceptación:** ambas plantillas superan AC-02 y AC-07; foto, orden, visibilidad y ajustes sobreviven en una biblioteca vacía. El PDF para compartir no contiene `.cvproj` ni otro adjunto de proyecto. El paquete editable contiene el CV, pero no el perfil completo, los borradores, el historial o los PDF originales. Se comprueba lectura/etiquetado después del posprocesado.

## F9 — Aceptación y entrega del MVP

**Depende de:** F0–F8. **Salida:** versión empaquetada usable para el flujo prioritario del usuario.

- Ejecutar AC-01 a AC-10 y todos los requisitos FR-01 a FR-12 / NF-01 a NF-09 aplicables al MVP.
- Arrancar sin red, importar un PDF conocido, editar un campo, confirmar, cerrar, reabrir, generar ambos PDF y volver a importar el editable en una biblioteca vacía.
- Medir p95 con equipo, corpus y repeticiones identificados; comprobar teclado/foco y textos de errores.
- Publicar la matriz de compatibilidad real y las limitaciones del MVP, sin redistribuir los CV privados como datos de ejemplo.

**Aceptación:** no hay pérdida de contenido soportado ni errores de guardado ocultos; los objetivos no alcanzados se corrigen o se revisan explícitamente antes de declarar aceptado el MVP. Ningún bloque de la versión 1 se declara terminado por estar previsto.

## F10a — Secciones adicionales con periodos

**Depende de:** F9. **Salida:** conferencias/seminarios, obras creativas, redes/asociaciones, actividad social/política y voluntariado.

**Aceptación:** cada tipo permite dos entradas con campos propios, periodos válidos y enlaces; orden, traducciones, ocultación y exportación/reapertura se conservan en ambas plantillas. No se introduce Ongoing en una importación que no lo traiga.

## F10b — Publicaciones, premios y aficiones

**Depende de:** F9; puede desarrollarse independiente de F10a. **Salida:** los tres tipos con su editor/importador/renderizado.

**Aceptación:** dos entradas por tipo sobreviven al ciclo. Referencia bibliográfica libre y datos desglosados se conservan sin sincronización automática; premio mantiene entidad/fecha; aficiones conserva descripción y enlaces. Los campos antes no mapeados se pueden incorporar mediante revisión, sin duplicaciones silenciosas.

## F10c — Recomendaciones, permisos y declaración final

**Depende de:** F9. **Salida:** los tres tipos restantes y firma gráfica.

**Aceptación:** recomendación sin contacto, tres permisos —B, A1 y personalizado— con validez individual y declaración con firma sobreviven al ciclo. Cancelar las fechas de un permiso no confirma cambios del padre. Una fila vacía no se convierte en permiso, y una declaración vacía no genera una página. La firma permanece agrupada y distinguida de la foto.

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
- Ciclo de todos los tipos, ambas plantillas, foto/firma, traducciones, accesibilidad, recuperación y rendimiento en la versión empaquetada.

**Aceptación:** AC-11 a AC-14, FR-13 a FR-16 y requisitos anteriores siguen pasando. Se informa de contraseña/formato/límite no admitidos con salida útil. No se declara compatibilidad universal ni se exige esperar una caducidad remota de Europass.

## Casos de aceptación transversales [D]

| Caso | Procedimiento y resultado observable | Primera puerta |
| --- | --- | --- |
| AC-01 Muestras Europass | Abrir los dos PDF privados originales. Comparar ocho educaciones, tres experiencias, dieciocho habilidades/dos grupos, dos lenguas maternas y una extranjera con sus cinco niveles B2, más contactos/enlaces/foto presentes. Cambiar un campo y verificar conservación del resto. Comparar valores, no solo cantidades. | F6; cierre F9 |
| AC-02 Reapertura propia | Exportar con cada plantilla, abrir en biblioteca vacía sin red y comparar contenido, fechas, traducciones, grupos, orden, inclusión, activos y ajustes; ignorar solo IDs/metadatos regenerados. | F8 |
| AC-03 Confirmar/Cancelar | Confirmar email ficticio A; editar B; Cancelar. Resumen, revisión y PDF conservan A. Confirmar después B lo conserva tras reinicio. Cancelar no deja un borrador recuperable. | F4 |
| AC-04 Cierre inesperado | Interrumpir con un borrador; al abrir se ofrece recuperar/descartar sobre la revisión correcta. La última confirmación sigue disponible y el borrador no se exporta como confirmado. | F3 |
| AC-05 Idiomas | Original oficial + traducción inglesa revisada; cambiar etiquetas, elegir original/traducción/ambos, editar original. Se muestra el plan; el original permanece y la traducción pasa a revisión sin borrarse. | F5; PDF F8 |
| AC-06 Perfil independiente | Crear dos CV desde el perfil; editar uno y luego el perfil. Ningún otro documento cambia sin selección/revisión explícita. | F3–F5 |
| AC-07 PDF legible | Texto largo, listas, URL extensa, glifos y foto en ambas plantillas: sin omisión/solape, enlaces activos, lectura lógica, título unido al contenido y comprobación de etiquetas. Preview corresponde al archivo final; comprobar además un lector externo. | F7–F9 |
| AC-08 Copia recuperable | Guardar copia completa de workspace; restaurar en biblioteca vacía; recuperar perfil, CV, activos y los estados que declare el manifiesto. Inyectar un fallo de escritura y comprobar que no se anuncia éxito. | F3; cierre F9 |
| AC-09 Rendimiento/offline | Equipo de NF-05, 100 CV y corpus identificado; p95 de arranque, respuesta, confirmación, importación, preview y exportación. Desconectar antes de iniciar y completar todo el ciclo del MVP. | F9 |
| AC-10 Límites y privacidad | Adjuntos ambiguos, datos desconocidos, XML inválido, paquete mal formado, exceso de tamaño y formato futuro tienen informe útil. Inspeccionar PDF editable/para compartir y confirmar el alcance exacto de cada modo. | F6–F9 |
| AC-11 Todos los tipos | Dos entradas de cada familia repetible, varias secciones custom, permisos con validez y cierre con firma; editar, ordenar, ocultar, exportar y reabrir sin pérdida. | F10a–F10c; cierre F13 |
| AC-12 Texto genérico | PDF propio de una/dos columnas sin datos de CV adjuntos; corregir propuestas, conservar referencias y fragmentos pendientes; confirmar un CV nuevo. | F11 |
| AC-13 OCR/mixto | Página escaneada y página con texto/imagen; elegir idioma, corregir errores, evitar duplicados y cancelar una ejecución. Todo local, sin prometer exactitud automática. | F12 |
| AC-14 Matriz ampliada | Registrar por archivo generador/origen, versión observada, presencia de datos, resultado y campos no recuperados. La aceptación del propio programa se distingue de lo que aceptó Europass. | F13 |

Los PDF originales del usuario permanecen intactos y privados. Los casos automatizables usarán datos sintéticos propios; las rutas temporales y guiones de investigación no son dependencias de producción. Los artefactos de REA que ya no estén disponibles no impiden crear controles equivalentes con contenido propio.

## Trazabilidad mínima [D]

| Requisitos | Fases responsables |
| --- | --- |
| FR-01, FR-02, FR-12 | F2–F4; aceptación F9 |
| FR-03, FR-06 | F4; ciclo PDF F8–F9 |
| FR-04, FR-05, FR-07 | F5; ciclo PDF F8–F9 |
| FR-08, FR-09 | F6; ampliación F10/F13 |
| FR-10, FR-11 | F1, F7, F8; aceptación F9 |
| FR-13 | F10a, F10b, F10c |
| FR-14, FR-15, FR-16 | F11, F12, F13 respectivamente |
| NF-01, NF-02, NF-08 | F1–F3, F6, F8–F9; regresión F13 |
| NF-03, NF-04 | F1, F4–F5, F7–F9; regresión F13 |
| NF-05 | Base F1/F7; aceptación F9; ampliación F12–F13 |
| NF-06, NF-07, NF-09 | Transversales desde F1; aceptación F9/F13 |

## Ampliaciones posteriores, sin compromiso de MVP [D/P]

Traducción automática revisable, nuevos diseños, ajuste de extensión, catálogos y ordenación sugerida, actualizaciones asistidas desde el perfil, apertura con contraseña conocida, más plataformas y sincronización opcional. Cada bloque necesita alcance/aceptación propio y no debe introducir dependencia remota para editar, guardar o exportar un CV local.

## Decisiones que siguen pendientes [P]

F0 requiere aprobación del usuario. F1 debe resolver adecuación real de Electron/SQLite, composición Chromium y adjuntos, con accesibilidad y empaquetado. Más adelante se amplía compatibilidad con muestras reales y se miden OCR/rendimiento. Son decisiones de construcción del producto propio; no tareas pendientes de observar Europass.
