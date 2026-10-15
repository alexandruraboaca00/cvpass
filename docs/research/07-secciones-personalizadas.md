# 07 — Add new section y secciones adicionales

## Estado de cobertura y siguiente investigación

**Actualización:** la inspección activa posterior ya cubre el formulario inicial y los campos desplegables de los 14 tipos. Consultar [15-inventario-secciones-adicionales.md](15-inventario-secciones-adicionales.md), con evidencias REA, diferencias de controles y límites. Las notas siguientes describen la cobertura anterior; siguen pendientes guardado, exportación y persistencia por tipo.

Revisión posterior: están identificados los 14 tipos del catálogo, pero **no están inspeccionados sus 14 formularios**. Solo Other tiene una inspección parcial de campos y editor Content. Las siguientes acciones manuales descritas en las notas históricas no son solicitudes vigentes: el usuario ha autorizado inspección activa autónoma.

Prioridad acordada de investigación: comparar los campos de cada tipo, sus opcionales desplegables, requisitos visibles, fechas, enlaces, repetición y guardado. Empezar por Certifications, Projects y Publications; continuar con Conferences and seminars, Honours and awards, Networks and memberships, Volunteering, Social and political activities, Creative works, Recommendations, Driving Licence, Hobbies and interests, Closing statement y completar Other. No deducir campos a partir del nombre del tipo.

Un intento posterior de abrir el catálogo en una sesión aislada con REA no produjo un resultado utilizable para inventariar nuevos formularios. Por tanto, no se añaden campos supuestos ni se amplía la cobertura observada. Sigue pendiente la inspección activa de esos tipos.

## Alcance y evidencia

Inspección pasiva con REA el 15 de octubre de 2026, después de la apertura manual por el usuario. Sin clics, navegación, recarga, extracción de código o recursos ni implementación desde el agente.

- URL: `https://europa.eu/europass/eportfolio/screen/cv-editor/compact-cv-editor?lang=en`.
- Target: `68B34A488D82A1D2E5B69A232F7EDA8D`.
- E1 — DOM y accesibilidad: `ev_1ed57c9a4f490601c82adf32ba21f311a243e4cb9f2990f654dd7d0938b496b3`; 09:52:03.672–09:52:04.803 UTC.
- E2 — Captura visual: `ev_62e30d365467cd6835e1d0c9305bdb511b70934b0c2d20f8b469c4d804b65358`; 09:52:09.514 UTC; viewport 913 × 937. Imagen consultada sin incorporarla al repositorio.

Los dos registros corresponden a instantes distintos: en E1 no se exponen opciones de lista en accesibilidad; en E2 la lista se ve desplegada. No se atribuye a REA la acción de desplegarla. Las opciones siguientes proceden de la imagen.

## 1. Hechos observados

Add new section abre un modal Add new Section sobre el editor con fondo atenuado. Tiene encabezado y cierre, campo Section type y pie con Cancel/Add. En E1, Cancel y Close dialog están habilitados y Add deshabilitado. En E2, el tipo sigue mostrando Select y la lista está abierta. [E1, E2]

El catálogo visual muestra, en este orden, catorce tipos además del placeholder Select:

| Orden | Opción |
| --- | --- |
| 1 | Certifications |
| 2 | Conferences and seminars |
| 3 | Creative works |
| 4 | Driving Licence |
| 5 | Hobbies and interests |
| 6 | Honours and awards |
| 7 | Networks and memberships |
| 8 | Projects |
| 9 | Publications |
| 10 | Recommendations |
| 11 | Social and political activities |
| 12 | Volunteering |
| 13 | Other |
| 14 | Closing statement |

En esta lista no aparecen las cinco secciones principales ya presentes: Personal Information, Education & Training, Work experience, Skills y Language Skills. Esta es una observación del catálogo en este estado, no una regla demostrada de filtrado. [E2]

No se ve todavía campo de título personalizado, descripción o formulario de entrada. No se ha elegido ninguna opción ni añadido una sección. No se observa mensaje de validación en el modal. [E1, E2]

## 2. Inferencias

- El flujo parece empezar seleccionando un tipo antes de habilitar Add; no se ha comprobado esa transición.
- Other es un candidato para contenido personalizado, pero su nombre no demuestra libertad de título, campos o formato.
- Los nombres del catálogo sugieren formularios especializados y un posible bloque final para Closing statement. No se han observado sus campos, ubicación o restricciones.
- Para una aplicación propia, se perfila un catálogo de tipos adicionales separado de la lista de secciones ya representadas. No se infiere un esquema interno ni un componente único para todos los tipos.

## 3. Cuestiones pendientes

- Seleccionar Other para determinar si aparecen nuevos campos antes de confirmar.
- Observar la creación de una sección y su formulario, posición, acciones, repetición y visibilidad.
- Comparar algunos tipos especializados sin extrapolar un formulario a todo el catálogo.
- Determinar si se admiten varias secciones del mismo tipo y si el catálogo cambia tras añadir una.
- Validar Cancel/cierre, guardado, eliminación, orden y representación en preview/exportación.

Siguiente acción manual: seleccionar Other y dejar el modal abierto sin pulsar Add para inspeccionar posibles campos adicionales.

## Tipo Other seleccionado

Inspección pasiva posterior a la selección manual; sin interacción desde REA ni implementación.

- E3 — DOM y accesibilidad: `ev_2229594329d4a6b4f1842dd22acbfce4d9619db0e29f020fc59e9b6df0239960`; 15 de octubre de 2026, 09:53:09.703–09:53:10.846 UTC.
- E4 — Captura visual: `ev_44c5d95e847dbc9ab1473e6ef2bbf98de6460f0d34d667c17d44de5c312aeb25`; 09:53:17.438 UTC. Imagen consultada sin incorporarla al repositorio.

### 1. Hechos observados

Section type muestra Other. El mismo modal añade debajo un campo Section title, de texto de una línea, vacío y con placeholder Title. Está marcado `(required)`, tiene borde rojo y un mensaje que solicita un título no vacío. Accesibilidad lo denomina Insert a title for this section y le asigna foco, pero declara required false e invalid false: hay discrepancia con la validación visual, como en formularios anteriores. [E3, E4]

Cancel y el cierre del diálogo están habilitados; Add sigue deshabilitado. No se muestran descripción, fechas, entradas repetibles u otros campos en el modal. No se ha creado todavía una sección en esta captura. No se registraron peticiones ni conexiones WebSocket en el segundo observado. [E3, E4]

### 2. Inferencias

- Other permite solicitar una sección con título elegido por el usuario. Todavía no demuestra la personalización del contenido o del esquema de campos.
- El error de título y Add deshabilitado son compatibles con requerir un título antes de crear la sección; no se han validado longitud, duplicados o espacios.
- La creación de la sección parece una operación distinta de rellenar su contenido, puesto que este modal solo expone tipo y título. El siguiente estado permitirá comprobarlo.

### 3. Cuestiones pendientes

- Escribir un título ficticio, añadir la sección e inspeccionar formulario, ubicación y acciones resultantes.
- Verificar validaciones de título y si puede renombrarse después.
- Determinar cómo se guarda o cancela el contenido, si hay varias entradas y qué aparece en vista previa/exportación.

Siguiente acción manual: escribir Seccion de prueba en Section title y pulsar Add; dejar abierto el estado resultante sin rellenar ni guardar su contenido.

## Sección Other creada: formulario inicial

Inspección pasiva posterior a la creación manual; sin interacción desde REA ni implementación.

- E5 — DOM y accesibilidad: `ev_7285ea847001ecf728df2c7f067bdc7cedeb12d0b234ac2845f668386aacc89b`; 15 de octubre de 2026, 09:53:57.781–09:53:58.921 UTC.
- E6 — Captura visual: `ev_791bf1316b53980e2e6def4b5f6025bccdbd85db0f5162fc370ae6b756255968`; 09:54:03.943 UTC. Imagen consultada sin incorporarla al repositorio.

### 1. Hechos observados

El modal ya no está expuesto. Hay una nueva tarjeta expandida, después de Language Skills, titulada **seccion de prueba**, en minúsculas tal como aparece. No se ha demostrado una conversión automática de mayúsculas: no se observó el texto exacto que escribió el usuario. [E5, E6]

La tarjeta contiene un formulario integrado con:

| Elemento | Estado observado |
| --- | --- |
| Title | Texto de una línea vacío, placeholder Title of the custom section; marca required y error de obligatoriedad. |
| Date | Botón de información adicional; nombre accesible Select the date. No abierto. |
| Content | Botón de información adicional; nombre accesible Write here the description. No abierto. |
| Link to file or video | Botón de información adicional; nombre accesible Add a link to a video. No abierto. |
| Cancel | Habilitado. |
| Save | Deshabilitado. |

El título de sección ya existe en la cabecera, mientras Title del formulario sigue vacío: son dos valores distintos en esta pantalla. El textbox se anuncia como Insert a title for this section y required false/invalid false pese al error visual, repitiendo la discrepancia de accesibilidad observada en otros formularios. [E5, E6]

Skip optional fields está expuesto en accesibilidad, aunque no se distingue en el viewport. El chevrón de cabecera indica sección expandida. No hay fecha, contenido o enlace editables todavía; solo sus botones para añadirlos. No se observa menú de tres puntos en la tarjeta mientras este formulario está abierto. [E5, E6]

### 2. Inferencias

- El flujo distingue crear una sección con nombre propio y rellenar un contenido con título independiente. La estructura es compatible con una sección que contiene entradas, pero la cardinalidad múltiple todavía no está demostrada.
- Date, Content y Link sugieren ampliación progresiva de la entrada. No se conocen sus tipos efectivos, formatos o repetición.
- Save deshabilitado con Title vacío y error es compatible con exigir ese título antes de confirmar. No se ha probado si es la única condición.
- El patrón de título requerido, detalles opcionales y Save/Cancel es similar al de educación y experiencia; no implica un constructor arbitrario de campos ni componentes internos idénticos.

### 3. Cuestiones pendientes

- Abrir Content para identificar el editor y sus herramientas.
- Abrir Date y Link por separado para determinar campos, formatos y validaciones.
- Guardar una entrada ficticia y comprobar resumen, menús de sección/entrada y posibilidad de varias entradas.
- Comprobar si Cancel abandona solo la entrada o también elimina la sección recién creada.
- Verificar posición, renombrado, visibilidad y exportación.

Siguiente acción manual: pulsar únicamente Content y dejar el formulario abierto, sin guardar todavía.

## Content desplegado

Inspección pasiva tras la acción manual del usuario; sin interacción desde REA ni implementación.

- E7 — DOM y accesibilidad: `ev_f55ae2196a850a0de716a29c3115f14b441e73a3574681d078b30b569b5dc3b3`; 15 de octubre de 2026, 09:54:49.519–09:54:50.683 UTC.
- E8 — Captura visual: `ev_c00a0485bb8497af32d08c2d693cf2a51c3c0447d95318b0863e4f38abac8337`; 09:54:57.222 UTC. Imagen consultada sin incorporarla al repositorio.

### 1. Hechos observados

Content aparece como editor de texto con formato integrado entre Title y los botones de información adicional. Muestra la ayuda Write here the content; accesibilidad lo identifica como región Write here the description y expone contenido editable sin texto introducido. El botón para añadir Content ya no aparece entre los opcionales; permanecen Date y Link to file or video. [E7, E8]

La barra expone negrita, cursiva, subrayado, subíndice, superíndice, menú de alineación, lista numerada, viñetas, reducir/aumentar sangría, enlace, limpiar formato, eliminar texto, deshacer y rehacer. Es el mismo conjunto de funciones y nombres accesibles observado en el editor de responsabilidades de experiencia laboral. No se ha probado su ejecución. [E7, E8; 04-experiencia.md]

La esquina inferior del área tiene un tirador visual de tamaño. No hay marca visible de obligatoriedad ni error de Content. Title sigue vacío con error y Save deshabilitado; Cancel habilitado. No se ve un control separado para retirar el campo Content del formulario. [E7, E8]

### 2. Inferencias

- El botón opcional parece revelar el editor dentro del formulario sin abrir un modal. La posición sugiere que los opcionales se insertan en la estructura de campos y no solo al final.
- La coincidencia con responsabilidades refuerza un patrón reutilizable de editor con formato para nuestra aplicación. No demuestra identidad de componente, biblioteca ni formato interno de Europass.
- Content podría ser opcional aunque esté desplegado; la validación del título impide concluir qué sucede al guardar contenido vacío.

### 3. Cuestiones pendientes

- Abrir Date y Link para completar el inventario de campos de esta entrada.
- Comprobar límites, enlaces, formato, retirada de campos opcionales y diferencias entre limpiar formato y eliminar texto.
- Guardar un título y contenido ficticios conocidos para verificar su representación en el resumen y exportación.

Siguiente acción manual: pulsar únicamente Date y dejar el formulario abierto, sin guardar.
