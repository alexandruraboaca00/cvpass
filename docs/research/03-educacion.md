# 03 — Añadir una entrada de Education & Training

## Alcance y evidencia

Inspección pasiva con REA el 15 de octubre de 2026. No se ha escrito, hecho clic, abierto listas, desplegado calendarios, cambiado interruptores ni desplazado la página. No se han obtenido fuentes de scripts ni copiado código o recursos. No se ha implementado nada.

- URL: `https://europa.eu/europass/eportfolio/screen/cv-editor/compact-cv-editor?lang=en`.
- Target: `68B34A488D82A1D2E5B69A232F7EDA8D`.
- E1 — DOM y accesibilidad: `ev_67cb3a9803baa84ece0ecaab855f3b156cbe4012159dfcde2887063f33493441`; ventana de 09:22:05.559 a 09:22:07.263 UTC, con observación configurada de 1.5 segundos.
- E2 — Captura visual: `ev_42f347aa2e0916aa996010e42bb25994f880b0df1e60cb66768fdb1bcb1bcb42`; 09:22:14.879 UTC. Viewport de 913 × 937 píxeles, consultado sin guardar la imagen como recurso.

El viewport muestra el formulario completo de la tarjeta de educación, desde su encabezado hasta Cancel/Save, y parte de la sección siguiente. E1 no informa de truncamiento del DOM ni de accesibilidad. Los metadatos de otros orígenes están filtrados y la red no incluye actividad anterior a la conexión.

## 1. Hechos observados

### Organización

El formulario está dentro de la tarjeta Education & Training, en la página del editor; no aparece como diálogo modal. La cabecera tiene un chevrón hacia arriba y la expansión accesible de la sección es verdadera. Los campos están distribuidos en una columna, salvo City y Country, que comparten fila. Después aparecen las fechas, Ongoing, los botones de información adicional y el pie de acciones a la derecha. [E1, E2]

### Todos los campos visibles

| Campo | Tipo y estado observado | Obligatoriedad observada |
| --- | --- | --- |
| Title of qualification awarded | Texto de una línea, vacío, placeholder Title of the qualification; tiene el foco accesible. | Marcado `(required)` y error visible de obligatoriedad. |
| Organisation providing education and training | Texto de una línea, vacío, placeholder Name of the Organisation. | Sin marca visual de obligatorio. |
| Level in EQF | Selector cerrado, muestra Select. | Sin marca visual de obligatorio. |
| City | Texto de una línea, vacío, ejemplo e.g. Paris. | Sin marca visual de obligatorio. |
| Country | Selector cerrado, sin país mostrado. | Sin marca visual de obligatorio. |
| Start date | Entrada de fecha vacía, placeholder DD-MM-YYYY y botón de calendario. | Sin marca visual de obligatorio. |
| End date | Entrada de fecha vacía, placeholder DD-MM-YYYY y botón de calendario. | Sin marca visual de obligatorio. |
| Ongoing | Interruptor desactivado; accesibilidad switch con checked false. | No hay marca de obligatoriedad; no se ha probado su efecto. |

La ausencia de marca solo permite identificar campos aparentemente opcionales; no demuestra sus reglas reales. Los textbox expuestos declaran required false e invalid false, incluido el título, pese a la etiqueta y al error visibles. [E1, E2]

### Fechas y listas

Las dos fechas presentan orden día-mes-año separado por guiones. Cada una tiene un botón accesible Choose date. También se exponen nombres accesibles genéricos `ecl.date-picker.aria-label` y DD-MM-YYYY: esta duplicación no demuestra fechas adicionales. No se ha abierto ningún calendario ni comprobado precisión parcial, formato aceptado o validación de rangos. [E1, E2]

Este formato de entrada difiere del ejemplo global de presentación `23/04/2019` observado previamente en el editor. La coexistencia está observada; no se ha probado cómo se transforma una fecha introducida a su presentación en el CV.

Los selectores EQF y Country están cerrados. El inventario accesible contiene agrupaciones de países European Union, Europass y Non European Union. Son metadatos expuestos por el control, no evidencia de una lista desplegada en pantalla. Las opciones EQF no ofrecen etiquetas útiles en la captura, salvo Select; no se atribuyen niveles concretos ni se presupone un catálogo completo. [E1]

### Información adicional añadible

Bajo Select additional information to fill in aparecen once botones con signo más. No son campos ya abiertos. [E1, E2]

| Botón visible | Qué se conoce del campo resultante |
| --- | --- |
| Website | No abierto; tipo y validación pendientes. |
| Address details | No abierto; composición pendiente. |
| Field of study | No abierto; texto libre o catálogo sin determinar. |
| Final grade | No abierto; formato sin determinar. |
| Thesis | No abierto; tipo y extensión sin determinar. |
| Main subject / Occupational skills covered | No abierto; tipo de editor sin determinar. |
| National classification | No abierto; texto o lista sin determinar. |
| Type of credits | No abierto; opciones sin determinar. |
| Number of credits | No abierto; tipo numérico y límites sin determinar. |
| Valid until | No abierto; su nombre no demuestra todavía un selector de fecha. |
| Link to file or video | No abierto; accesibilidad lo denomina Add a link to a video. No demuestra carga de archivos. |

No se observa un botón para duplicar la entrada ni una lista de múltiples entradas dentro de este formulario. Los botones de información adicional indican campos añadibles, pero no prueban que puedan repetirse. [E1, E2]

### Botones, navegación y validación

- Cancel está habilitado y Save deshabilitado. No se ha ejecutado ninguna acción ni observado su transición. [E1, E2]
- Se expone un enlace Skip optional fields en accesibilidad, aunque no se distingue en el viewport. Su destino y efecto no están comprobados. [E1]
- Hay un mensaje rojo This field is mandatory bajo el título vacío. No se conoce qué evento lo activó. No se observan otros errores en el formulario visible. [E1, E2]
- Los controles de calendario, selectores, interruptor y botones de información adicional están expuestos como operables; sus efectos no se han probado. El interruptor tiene nombre accesible genérico eUI slide toggle, con Ongoing como texto separado. [E1]

### Orden, estado y guardado

El formulario permanece en Education & Training, situada después de Personal Information y antes de Work experience. No se ven controles de reordenación de entradas o secciones en esta tarjeta mientras se edita. Las fechas no demuestran por sí mismas una ordenación cronológica automática. [E1, E2]

No aparece indicador visible de borrador, cambios pendientes, guardando o guardado. La acción Save es explícita, pero no se ha observado confirmación ni persistencia. No hubo peticiones ni conexiones WebSocket registradas en la breve ventana pasiva; esto no descarta guardado previo, diferido o local. [E1, E2]

### Diferencias respecto a Personal Information

Comparación con las capturas de datos personales documentadas en [02-informacion-personal.md](02-informacion-personal.md), especialmente Estado antes de guardar y Prueba de cancelación observada.

| Aspecto | Personal Information observado | Educación observada |
| --- | --- | --- |
| Contenido principal | Nombre, apellido, contactos, dirección y fotografía. | Título, organización, EQF, ubicación y periodo. |
| Obligatoriedad visible | Nombre y apellido. | Título de la cualificación. |
| Periodo | Las fechas no estaban abiertas como campos básicos en la captura comparada. | Inicio, fin y Ongoing presentes desde este estado. |
| Añadibles | Datos biográficos y de contacto adicionales. | Datos académicos, créditos, tesis y enlaces. |
| Repetición explícita | Botones Add para correo, teléfono y dirección. | No hay un equivalente visible para repetir los campos básicos dentro de esta entrada. |
| Edición | Formulario dentro de la sección; la fotografía tenía un diálogo separado. | Formulario dentro de la sección, sin diálogo modal observado. |
| Acciones y ayudas | Save/Cancel, Skip optional fields, error de campo requerido. | Mismo conjunto de patrones visible; Save deshabilitado en este estado. |
| Accesibilidad de validación | Required/invalid no reflejaban las marcas y errores visuales. | Se repite la discrepancia en el título requerido. |

## 2. Inferencias

- La distribución sugiere una entrada académica con un núcleo breve y detalles adicionales que el usuario incorpora según necesidad. No se ha observado el modelo interno ni cómo queda una entrada guardada.
- Save deshabilitado y el título vacío con error son compatibles con impedir la confirmación hasta completar el título. No se ha probado que esa sea la única condición.
- Ongoing probablemente representa formación en curso y podría modificar la necesidad o disponibilidad de End date. Ese comportamiento no se ha observado.
- Save/Cancel, campos añadibles y el enlace para saltar opcionales sugieren un patrón común con Personal Information. La semántica de guardado y cancelación de educación requiere una prueba propia.
- Como candidatos funcionales para una aplicación propia aparecen formularios de entrada con periodo, selector de nivel, ubicación, campos opcionales progresivos y validación antes de confirmar. No se toma todavía una decisión de arquitectura o implementación.

## 3. Cuestiones pendientes

- Completar el título y comprobar cuándo se habilita Save, límites de texto y errores adicionales.
- Determinar obligatoriedad real de organización, ubicación, nivel y fechas.
- Inspeccionar catálogos EQF y Country, búsqueda, selección y estados vacíos.
- Abrir calendarios y comprobar entrada manual, años/meses sin día, fechas imposibles, futuras o fin anterior al inicio.
- Activar Ongoing y observar su efecto en End date y en la representación del periodo.
- Abrir cada detalle adicional para conocer tipos, validación, eliminación y repetición.
- Comprobar el destino de Skip optional fields y el uso del teclado.
- Guardar una entrada ficticia y observar resumen, periodo, acciones, posibilidad de añadir otra entrada y ordenación.
- Probar cancelación con un valor temporal conocido y visible, incluyendo reapertura para verificar el descarte.
- Determinar persistencia, guardado automático, mensajes y relación con vista previa/exportación.

La inspección establece la estructura del formulario inicial y sus controles expuestos. Los comportamientos de fechas, campos adicionales y confirmación siguen sin validar.

## Entrada guardada

Inspección pasiva posterior al guardado comunicado por el usuario, el 15 de octubre de 2026. No se ha presenciado el clic de Save ni interactuado con la página. No se ha implementado nada.

- E3 — DOM y accesibilidad: `ev_b2725aa85d81d9202b9658945594e9c2ae15b4d92b071f4504f16813a6ebfe5f`; ventana de 09:25:43.161 a 09:25:45.310 UTC, con observación configurada de 2 segundos.
- E4 — Captura visual: `ev_2dfd0392526382d67dd05392d7b14a0ef470a8df314f6584d7d800b7af54c356`; 09:25:50.206 UTC. Viewport actual consultado sin guardar la imagen como recurso.
- Misma URL y target que E1. E3 no informa de truncamiento; la red solo cubre la ventana posterior a la conexión y los metadatos están sujetos al filtro de origen.

### 1. Hechos observados

**Representación de la entrada.** Education & Training permanece expandida y contiene una entrada con título en negrita, organización y una línea de periodo y ubicación. El título se expone como encabezado accesible de nivel 3. [E3, E4]

| Dato resumido | Valor observado |
| --- | --- |
| Cualificación | Grado de prueba |
| Organización | Institucion de preba |
| Inicio | 01/10/2020 |
| Fin | 03/10/2024 |
| Ciudad | Madrid |
| País | Spain |

Se conservan las grafías ficticias tal como aparecen. Las fechas se presentan con barras y un guion de intervalo entre ambas; una separación vertical distingue la ubicación. El formulario anterior usaba placeholders DD-MM-YYYY. Esto demuestra dos presentaciones distintas entre entrada y resumen, pero no el formato exacto que escribió el usuario ni la representación interna. [E1–E4]

No se muestran nivel EQF ni detalles adicionales en el resumen actual. No puede distinguirse si están vacíos, no fueron añadidos o se omiten del resumen. No aparece el texto Ongoing en esta entrada. [E3, E4]

**Comparación con el formulario.** Los campos académicos editables, las fechas de entrada, el interruptor Ongoing, los botones de detalles adicionales, Save/Cancel y el error del título ya no están expuestos como formulario abierto. En su lugar se presenta el contenido estático descrito. No se observa un mensaje explícito de éxito, guardado o cambios pendientes. [E1–E4]

**Acciones de sección y entrada.** Hay dos botones distintos Actions, ambos cerrados: uno en la cabecera de la sección y otro junto al título de la entrada. Visualmente son menús de tres puntos verticales. No se han abierto. No hay botones explícitos de editar, eliminar, duplicar o reordenar expuestos en el estado actual. Tampoco se ve un asa de arrastre. El menú de sección y el de entrada no deben confundirse. [E3, E4]

**Varias entradas.** Se observa una sola entrada. El botón Add Education & Training que existía en el estado vacío no aparece ahora como acción directa en la tarjeta ni en la accesibilidad recogida. El menú de sección sigue cerrado: no se conoce si contiene una opción para añadir otra entrada. La capacidad de múltiples entradas todavía no queda demostrada por esta pantalla. [E3, E4]

**Orden.** Con una sola entrada no es posible establecer un orden entre registros ni detectar ordenación cronológica automática. La línea con inicio y fin describe el periodo de esta entrada; no demuestra una regla de ordenación. No se ha probado reordenación manual. [E3, E4]

**Guardado y persistencia.** Durante la ventana de 2 segundos no se registraron peticiones ni conexiones WebSocket. La captura empezó después del guardado; no recupera sus peticiones ni establece si existe persistencia local o remota. La incorporación visible al resumen no demuestra recuperación tras recarga o nueva sesión. [E3]

**Comparación con Personal Information.** En ambos casos, tras el guardado comunicado por el usuario el formulario deja de estar expuesto y aparece un resumen estático con los valores. Educación añade título académico, organización, periodo, ubicación y un menú propio de la entrada. En Personal Information se observó un nombre resumido y My personal information. Coincide el resultado general de edición a resumen; no se han comparado las operaciones internas ni observado los dos clics de guardado. Véase [02-informacion-personal.md](02-informacion-personal.md), Comportamiento al guardar.

### 2. Inferencias

- El menú propio de la entrada sugiere operaciones sobre ese registro, mientras el menú de cabecera sugiere operaciones sobre la sección. Atribuirles editar, eliminar, añadir o reordenar exige observar sus opciones.
- La agrupación visual es compatible con una colección de entradas académicas, pero una única entrada no confirma esa cardinalidad. Conviene mantener la posibilidad en nuestra propuesta sin presentarla como hecho de Europass.
- El patrón candidato común es editar con Save/Cancel y, al confirmar, representar el contenido en un resumen. La validez, cancelación y persistencia de educación siguen pendientes de pruebas propias.

#### Propuesta mínima de datos para nuestra aplicación

Es una propuesta conceptual solicitada para representar lo observado, no una reconstrucción del esquema propietario ni una implementación. El mínimo para la tarjeta actual es título, organización, fecha inicial/final y ubicación. El formulario observado añade nivel EQF y estado en curso.

| Elemento propuesto | Finalidad y fundamento |
| --- | --- |
| Sección con colección de entradas | Permite representar una entrada ahora y ampliar a varias. La cardinalidad múltiple es una decisión de diseño provisional. |
| Identificador propio por entrada | Identifica el registro al editar o eliminar; decisión de diseño, no dato interno observado. |
| Título de cualificación | Obligatorio según la UI del formulario; encabezado del resumen. |
| Organización, ciudad y país | Datos del formulario y del resumen; inicialmente opcionales según sus marcas visibles. |
| Fecha de inicio y fecha de fin | Valores de fecha separados de su formato de presentación. Precisión parcial y reglas pendientes. |
| En curso | Booleano correspondiente al interruptor Ongoing; relación con fecha final pendiente de validar. |
| Nivel EQF opcional | Control básico observado; catálogo y valor normalizado pendientes. |
| Detalles adicionales opcionales | Reservar conceptualmente los once grupos observados, sin fijar todavía tipos o cardinalidades que no se han inspeccionado. No son necesarios para representar esta tarjeta concreta. |

Mantener un orden estable en la colección evita imponer una ordenación cronológica no demostrada. Un borrador separado de las entradas confirmadas sería una opción coherente para Save/Cancel; no hay evidencia del mecanismo interno de Europass. No es necesario guardar el texto del periodo ya formateado: puede derivarse de sus datos y del formato global, como decisión propia.

### 3. Cuestiones pendientes

- Abrir los dos menús en una fase autorizada y registrar sus opciones por separado.
- Verificar cómo se añade una segunda entrada y si existe algún límite.
- Crear entradas con fechas deliberadamente fuera de orden para distinguir orden de creación, cronología y orden manual.
- Comprobar edición, eliminación, confirmaciones, duplicación y reordenación si se ofrecen.
- Reabrir esta entrada para identificar datos completos, valores omitidos del resumen y formato recuperado de las fechas.
- Observar guardado/cancelación en educación durante la interacción, no solo sus estados finales.
- Determinar persistencia tras recarga, efecto en vista previa/exportación y tipos de los detalles adicionales antes de definir un esquema definitivo.

Resultado: la entrada guardada se resume con cualificación, organización, periodo y ubicación. Las capacidades de múltiples entradas, edición, borrado y ordenación aún requieren inspeccionar los menús o realizar pruebas autorizadas.

## Múltiples entradas y orden

Inspección pasiva del 15 de octubre de 2026, posterior a la creación y guardado de una segunda entrada comunicados por el usuario. No se han abierto menús, arrastrado elementos, desplazado la página ni realizado otras interacciones. No se ha implementado nada.

- E5 — DOM y accesibilidad: `ev_bbd73f91845df602752efd759eb94e751ab7d45071835b2b5e483322d628247d`; ventana de 09:28:56.271 a 09:28:57.914 UTC, observación configurada de 1.5 segundos.
- E6 — Captura visual: `ev_3588cb4f401a16c41e6cb2582b6f68222b121f0adb3e161792db73392299cc72`; 09:29:03.238 UTC. Se consultó el viewport sin guardar la imagen como recurso.
- Misma URL y target. Sin truncamiento declarado del DOM o accesibilidad; metadatos sujetos al filtro de origen. Se compara con E3/E4, que mostraban solo Grado de prueba.

### 1. Hechos observados

**Cardinalidad y disposición.** Education & Training contiene ahora dos entradas simultáneas dentro de una misma tarjeta de sección, separadas por una línea horizontal. Queda confirmada la capacidad de representar al menos dos entradas. Esto actualiza la incertidumbre de la subsección anterior; no establece el máximo permitido. [E3–E6]

**Orden y contenido.** El orden visual es de arriba abajo el siguiente, coincidente con la secuencia de los bloques en la representación capturada. [E5, E6]

| Posición | Cualificación | Organización | Periodo mostrado | Ubicación mostrada |
| --- | --- | --- | --- | --- |
| 1 | Grado de prueba | Institucion de preba | 01/10/2020 – 03/10/2024 | Madrid Spain |
| 2 | Grado 2 | Institucion 2 | 11/10/2010 – 09/10/2021 | Madrid |

Cada entrada tiene título en negrita y encabezado accesible de nivel 3, organización y una línea de periodo y ubicación. La segunda no muestra país; no se conoce si no se introdujo o si existe otra razón de omisión. Las grafías ficticias se transcriben tal como aparecen. [E5, E6]

**Orden de creación conocido.** Grado de prueba ya estaba en E3/E4. Grado 2 aparece tras la segunda creación comunicada por el usuario y está debajo. Por tanto, el resultado coincide con conservar primero la entrada preexistente y colocar después la nueva. A la vez, la primera tiene tanto inicio como fin posteriores a los de la segunda: el resultado también coincide con cronología descendente por cualquiera de esas fechas. Esta pareja no permite discriminar entre ambas reglas. [E3–E6]

**Acciones propias y de sección.** Hay un menú Actions cerrado en la cabecera de Education & Training y un menú Actions cerrado en cada entrada, representados visualmente por tres puntos verticales. Se confirma la existencia de controles propios por registro, pero sus opciones siguen sin observarse. No hay acciones explícitas de editar, borrar o mover expuestas fuera de los menús. [E5, E6]

**Drag-and-drop y reordenación.** No se ve un asa de arrastre, flechas de movimiento ni una instrucción para reordenar en el viewport. El inventario DOM no enumera atributos cuyo nombre contenga drag o drop. Esto es una búsqueda limitada de indicios, no prueba de ausencia: podrían existir mecanismos basados en eventos, controles que aparecen al pasar el puntero u opciones dentro de menús cerrados. No se han probado. [E5, E6]

**Alcance de los menús.** Su ubicación distingue un control de cabecera y dos controles de entrada. No se puede afirmar todavía que sus funciones sean distintas: solo están observados sus ámbitos visuales y estructurales. Añadir otra entrada, eliminar la sección y reordenar siguen siendo opciones hipotéticas hasta abrir los menús. [E5, E6]

### 2. Inferencias

- El estado actual es compatible tanto con orden de creación ascendente como con cronología descendente. No hay evidencia suficiente para preferir una regla automática ni para afirmar que no exista ordenación.
- La repetición de menú por entrada sugiere operaciones independientes sobre cada registro, frente al control de cabecera para la sección. No se atribuyen opciones concretas.
- Para nuestra aplicación, la colección de entradas deja de ser una previsión basada solo en una tarjeta: ahora responde a una capacidad observada. La organización interna de Europass sigue sin conocerse.

#### Implicaciones para nuestro modelo de datos

Propuesta conceptual, sin implementación:

- Representar educación como una colección ordenada de registros, no como un único bloque de campos.
- Dar a cada registro un identificador propio y sus valores independientes: título, organización, fechas, estado en curso, ubicación, EQF y detalles opcionales según lo ya documentado. El identificador es una decisión de nuestra aplicación, no un dato recuperado de Europass.
- Conservar explícitamente la secuencia de presentación, mediante el orden de la colección o una posición propia. Evitar imponer cronología automática mientras no se valide la regla deseada.
- Mantener fechas como datos independientes del formato mostrado y no usarlas como identidad del registro.
- Distinguir estado de la sección, como visibilidad y expansión, de los datos de cada entrada. Su persistencia es una decisión pendiente.
- Si más adelante se ofrece reordenación, cambiar el orden sin alterar fechas o identificadores. La existencia de esa función en Europass aún no está comprobada.

### 3. Cuestiones pendientes

- Añadir, en una prueba autorizada, una entrada nueva más reciente que la primera: colocarla al principio distinguiría cronología descendente de simple inserción al final. Habría que controlar también posibles cambios manuales.
- Usar fechas de inicio y fin con órdenes relativos diferentes para distinguir qué fecha determina el orden; comprobar también entradas sin fecha o en curso.
- Editar fechas de una entrada existente y observar si cambia de posición sin intervención manual.
- Inspeccionar por separado el menú de sección y los dos menús de entrada para registrar sus opciones y diferencias reales.
- Determinar si existen arrastre, movimiento por menú, teclado o controles al pasar el puntero, sin asumirlos por la estructura del DOM.
- Verificar que un eventual orden manual se conserva al guardar, reabrir, previsualizar y exportar.

Resultado: están confirmadas múltiples entradas y acciones propias mediante menús cerrados. La secuencia observada es Grado de prueba → Grado 2, compatible con creación y cronología descendente; el criterio real de orden y la reordenación manual siguen pendientes.
