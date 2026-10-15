# 02 — Información personal: estado observado

## Alcance y evidencia

Inspección pasiva con REA el 15 de octubre de 2026. La pantalla encontrada es el diálogo **Edit profile picture**, superpuesto a la sección Personal Information. No es un formulario de nombre, contacto o dirección. Este documento registra lo que estaba abierto, sin atribuirle campos que no se han observado.

No se ha hecho clic, escrito, seleccionado archivos, arrastrado contenido, desplazado la página, navegado ni evaluado JavaScript. No se han obtenido fuentes de scripts ni copiado código o recursos de Europass. No se ha implementado nada.

- Página: `https://europa.eu/europass/eportfolio/screen/cv-editor/compact-cv-editor?lang=en`.
- Target: `68B34A488D82A1D2E5B69A232F7EDA8D`.
- E1 — DOM y accesibilidad: `ev_d0ce5b780d9740d53b23acb00354abfaf5419e2f9f97fcec903f18311fd39944`; ventana de 08:16:22.186 a 08:16:23.797 UTC.
- E2 — Captura visual: `ev_a68e9b0814aa29798adb778f81ae7b6012924240a9e292339c89749744cffa08`; 08:16:29.123 UTC; viewport de 913 × 937 píxeles. Imagen consultada sin incorporarla como recurso al proyecto.

E1 no informa de truncamiento del DOM o la accesibilidad. La red solo cubre la ventana posterior a la conexión; algunos metadatos y recursos de otros orígenes se excluyen por el alcance de la captura. La imagen cubre únicamente el viewport actual.

## 1. Hechos observados

### Estructura y agrupación visual

Se muestra un diálogo centrado sobre el editor, cuyo fondo está atenuado. El árbol de accesibilidad declara el diálogo como modal. La URL sigue siendo la del editor compacto. [E1, E2]

La composición del diálogo, de arriba abajo, es:

1. Encabezado `Edit profile picture` y botón de cierre con icono de aspa.
2. Zona con borde discontinuo para seleccionar un archivo o arrastrarlo.
3. Información sobre formatos, tamaño y dimensiones recomendadas.
4. Separador y representación de un avatar genérico.
5. Pie de acciones: eliminación a la izquierda; cancelación y guardado a la derecha. [E2]

### Todos los campos visibles del diálogo

| Control o contenido | Tipo observado | Obligatoriedad y estado |
| --- | --- | --- |
| Select file | Botón de selección de archivo. | Habilitado; no presenta marca de obligatorio u opcional. No se muestra nombre de archivo seleccionado. |
| Drag and drop file here | Zona de carga con instrucción de arrastre. La accesibilidad expone también un botón con nombre que combina la selección y el arrastre. | No se ha probado; no hay marca de obligatoriedad. La exposición de dos botones no demuestra dos campos independientes. |
| Avatar | Representación visual genérica. | No es un campo de texto. No se muestra una fotografía personalizada en la captura. |

No se ven entradas de texto, selectores de fecha, casillas, campos de nombre, apellidos, correo, teléfono o dirección dentro del diálogo. Tampoco se ven controles de recorte, zoom o rotación en este estado. [E1, E2]

Los controles globales del CV visibles detrás, como idioma del documento y formato de fecha, pertenecen al editor de fondo; no son campos del diálogo de fotografía. [E2]

### Botones, acciones y navegación

| Acción | Estado observado | Alcance comprobado |
| --- | --- | --- |
| Close dialog | Habilitado; tiene el foco según accesibilidad. | Se identifica el control de cierre; no se ha ejecutado. |
| Select file | Habilitado. | No se ha abierto el selector del sistema. |
| Delete profile picture | Deshabilitado. | No se ha probado cuándo se habilita ni si requiere confirmación. |
| Cancel | Habilitado. | No se ha probado qué descarta o qué estado restaura. |
| Save | Deshabilitado. | No se ha probado qué guarda ni dónde persiste. |

No aparecen controles de anterior/siguiente, pestañas o navegación entre pasos dentro del diálogo. La captura confirma la superposición sobre el editor, pero no demuestra cómo se llegó a ella ni el resultado de cerrarla. [E1, E2]

### Validaciones y ayudas visibles

- La ayuda anuncia formatos PNG y JPG y límite de 20 MB. Son restricciones publicadas en la UI, sin validación comprobada mediante archivos. [E1, E2]
- Se recomienda subir imágenes menores de 1024 × 1024 para calidad ideal. El texto lo presenta como recomendación; no se ha observado rechazo por dimensiones. [E1, E2]
- No hay un mensaje visible de error, éxito o validación pendiente. Los botones expuestos declaran `invalid: false`; esto no prueba la validación de archivos. [E1, E2]
- No hay asterisco ni etiqueta de obligatorio u opcional en el área de fotografía. La instrucción sobre campos obligatorios pertenece a la página de fondo. [E1, E2]

### Campos repetibles o añadibles

Solo se observa un área de selección/arrastre y un avatar. No aparecen botones para añadir otra fotografía, listas de archivos ni filas repetibles. No se ha determinado si el selector admite varios archivos o si una carga sustituye a otra. [E1, E2]

### Guardado automático o manual

Existe una acción explícita `Save`, deshabilitada en el estado capturado, junto a `Cancel`. No se ve un indicador de guardado automático o de cambios pendientes en el diálogo. [E1, E2]

REA no registró peticiones de red durante los 1.5 segundos de observación, sin interacción. Esta ausencia no establece cómo se guarda una fotografía ni descarta guardado automático, almacenamiento local o actividad previa. [E1]

### Patrones observables que podrían compararse con otros formularios

Se observan encabezado con cierre, cuerpo con ayuda contextual, contenido de previsualización y pie con cancelar/guardar. También se distinguen acciones habilitadas y deshabilitadas. Estos elementos están comprobados en el diálogo de fotografía; todavía no se ha observado su reutilización en otros formularios. [E1, E2]

## 2. Inferencias

- La combinación de `Save` y `Cancel` sugiere una edición local al diálogo con confirmación explícita. No establece si hay una carga temporal previa ni si guardar la fotografía equivale a guardar el CV completo.
- `Save` deshabilitado, avatar genérico y ausencia de archivo seleccionado son compatibles con un estado inicial sin cambios. La causa exacta de la deshabilitación no está comprobada.
- `Delete profile picture` deshabilitado es compatible con la ausencia de fotografía eliminable. No demuestra el estado interno de los datos.
- La selección y el arrastre parecen dos vías hacia una misma carga de fotografía, por su agrupación en una sola zona.
- El diálogo modal parece destinado a editar una parte concreta sin abandonar la pantalla del CV. El foco inicial en el cierre puede formar parte de su gestión de accesibilidad; no se ha comprobado confinamiento del foco ni teclado.
- La estructura de encabezado, ayuda y pie de acciones es un patrón candidato para formularios propios, pendiente de comparar con formularios reales de datos personales, educación y experiencia. No se propone todavía una arquitectura.

## 3. Cuestiones pendientes

| Área | Qué falta determinar |
| --- | --- |
| Formulario de datos personales | Cómo se abre; todos sus campos, tipos, agrupaciones, obligatoriedad y validaciones. No está expuesto en la pantalla observada. |
| Contactos repetibles | Si pueden añadirse correos, teléfonos, direcciones, enlaces u otros elementos. |
| Archivo | Filtro del selector, selección múltiple, extensiones/MIME aceptados realmente y comportamiento ante archivos inválidos, vacíos o superiores al límite. |
| Dimensiones | Si 1024 × 1024 es solo recomendación o existe algún límite adicional. |
| Edición de imagen | Si al cargar aparecen recorte, zoom, rotación, sustitución o nuevos mensajes. |
| Obligatoriedad | Si la fotografía es opcional para completar o exportar el CV. La ausencia de asterisco no lo confirma. |
| Guardado | Cuándo se habilita Save, si hay carga temporal/automática, qué datos confirma y si persisten al recargar. |
| Cancelación y cierre | Si Cancel, el aspa, Escape o pulsar fuera del diálogo tienen el mismo efecto y si advierten de cambios pendientes. |
| Eliminación | Condiciones de habilitación, confirmación y reversibilidad. |
| Navegación y accesibilidad | Orden de tabulación, confinamiento del foco y devolución del foco al cerrar. |
| Reutilización | Qué partes del patrón aparecen realmente en los demás formularios del editor. |

La investigación de información personal queda parcial: se ha documentado el subdiálogo de fotografía que estaba abierto. El formulario de datos personales y las transiciones quedan pendientes de observación posterior.

## Estado antes de guardar

Segunda observación pasiva del 15 de octubre de 2026, después de que el usuario indicara haber modificado un único campo ficticio y no haber guardado. Esa secuencia es información aportada por el usuario; REA no presenció la escritura ni el instante del cambio. No se ha interactuado con la página ni implementado nada.

- E3 — DOM y accesibilidad: `ev_c244a713279627c1968eba1fc2b827c09eead311311b120cd0644c8290e98ae3`; observación de 10 segundos, de 08:20:41.836 a 08:20:52.032 UTC.
- E4 — Captura visual: `ev_a8719c292b0520d375836dfe21a92e30c2a8739bdbafdd52c4a73a2a5b717412`; 08:20:58.379 UTC. Solo viewport actual, sin desplazar la página ni guardar la imagen como recurso.
- Misma URL y target que en la inspección anterior. E3 no informa de truncamiento; conserva las limitaciones de filtrado por origen y de red posterior a la conexión.

### 1. Hechos observados

**Valor actual y reflejo en la interfaz.** Ahora está expuesto el formulario de datos personales dentro de la sección, sin el diálogo de fotografía anterior. El campo `First name` muestra `Test User` en la captura visual. El árbol de accesibilidad contiene también ese texto en un nodo editable, descendiente del control `First name`. Por tanto, el dato está reflejado en el estado de la interfaz capturado antes del guardado declarado por el usuario. El inventario DOM de REA no expone el valor de la propiedad del input: la evidencia del contenido procede de accesibilidad y de píxeles. No se ha medido si apareció inmediatamente al escribir. [E3, E4]

**Validación visible.** `First name` y `Last name` están marcados visualmente como obligatorios. `Last name` está vacío y debajo aparece un error rojo que pide introducir el apellido e indica que es obligatorio. Sin embargo, ambos controles declaran `required: false` e `invalid: false` en accesibilidad. Se observa una discrepancia entre los estados accesibles y la validación visual. No se ha determinado qué evento disparó el error. [E3, E4]

**Botones y mensajes.** En el formulario actual, `Cancel` está habilitado y `Save` está deshabilitado. También están deshabilitados los controles para añadir correo, teléfono y dirección en el estado capturado. No se identifica un mensaje explícito de cambios pendientes, guardando o guardado, ni un nodo accesible con rol `alert` o `status` en la captura. El error de apellido es una validación de campo; no es un indicador de cambios sin guardar. Esta búsqueda se limita a la accesibilidad recogida y al viewport mostrado. [E3, E4]

**Red y guardado automático.** Durante los 10 segundos pasivos, REA no registró peticiones de red ni conexiones WebSocket. La observación comenzó después de la edición declarada; no cubre la escritura ni posibles peticiones anteriores, tampoco establece si hubo escritura en almacenamiento local. No hay evidencia positiva de guardado automático en esta ventana. [E3]

**Comparación con la inspección anterior.** [E1–E4]

| Aspecto | Inspección anterior | Estado actual | Límite de comparación |
| --- | --- | --- | --- |
| Superficie editada | Diálogo de fotografía. | Formulario de datos personales en la sección. | Son superficies diferentes; no existe captura del mismo formulario antes de escribir. |
| Dato ficticio | No había campo First name expuesto. | First name muestra Test User. | Confirma el valor actual, no el valor anterior ni la latencia del cambio. |
| Save / Cancel | Save deshabilitado; Cancel habilitado en fotografía. | Save deshabilitado; Cancel habilitado en datos personales. | Son controles de contextos distintos; no se ha observado una transición de habilitación por la edición. |
| Mensajes | Ayudas de formatos de imagen; sin error visible. | Error visible de apellido obligatorio. | No permite atribuir el error exclusivamente al cambio de First name. |
| Cambios pendientes | Sin indicador identificado. | Sin indicador identificado. | Ausencia acotada a las capturas. |
| Red | Sin peticiones en 1.5 segundos. | Sin peticiones en 10 segundos. | Ninguna ventana cubre la edición del usuario ni prueba persistencia. |

### 2. Inferencias

- El valor visible mientras continúa abierto el formulario, junto a las acciones Save y Cancel, es compatible con un estado temporal de edición antes de confirmar. No demuestra un modelo interno concreto ni que los datos solo existan en memoria.
- Save deshabilitado y el error de apellido son compatibles con bloqueo del guardado por formulario incompleto. No se ha demostrado la relación causal: no se ha observado qué ocurre al completar ese campo.
- La mera modificación de First name no basta para que Save esté habilitado en el estado actual. Sin una captura anterior del mismo formulario, no puede concluirse que el botón haya cambiado o permanecido igual debido a esa edición.
- La ausencia de mensajes de guardado y de tráfico observado no permite afirmar que exista guardado automático, ni descartarlo.

### 3. Cuestiones pendientes

- Comparar este mismo formulario antes y durante una edición para determinar cuándo se refleja el valor y qué estados cambian.
- Observar si un formulario válido habilita Save y si aparece algún indicador explícito de cambios pendientes.
- Observar la ventana exacta de escritura para detectar posibles peticiones inmediatas o diferidas; esta captura posterior no las recupera.
- Determinar si el dato se incorpora a algún resumen o vista previa antes de guardar.
- Comprobar, en una fase con interacciones autorizadas, qué conserva Save y qué descartan Cancel o la salida; si hay persistencia local o remota y recuperación tras recarga.
- Identificar las condiciones reales de validación y corregir la incertidumbre que generan los atributos accesibles incoherentes con el error visible.

Conclusión de esta pasada: el dato ficticio está representado en la interfaz antes del guardado declarado, pero no se ha demostrado actualización inmediata, persistencia ni guardado automático. El estado temporal local es una inferencia compatible con lo observado.

## Comportamiento al guardar

Tercera observación pasiva del 15 de octubre de 2026, después de que el usuario indicara haber guardado y regresado al editor principal. REA no presenció el clic en Save ni los pasos intermedios. No se ha interactuado, recargado, navegado ni implementado nada.

- E5 — DOM y accesibilidad: `ev_7854333294d2e5c8b3f95992d270934e7aa8a0979c896be791f39eb8e7879e33`; ventana de 10 segundos, de 08:26:28.898 a 08:26:39.026 UTC.
- E6 — Captura visual: `ev_556f89f21f8928d4432e75806c68c91ff9cb8f7469dd109610507478e42b221d`; 08:26:44.194 UTC. Viewport actual, sin desplazamiento ni incorporación de la imagen como recurso al proyecto.
- Misma URL y target que en E3. No se informa de truncamiento en E5; persisten los límites de origen y de observación posterior a la conexión.

### 1. Hechos observados

**Reflejo en el editor principal.** La tarjeta Personal Information muestra ahora `Test User Test`. Ese texto aparece tanto en la imagen como en accesibilidad, donde es un encabezado de nivel 3 y texto estático. En E3/E4, `Test User` aparecía dentro del campo editable First name y Last name estaba vacío. El valor previo está contenido en el resumen actual, que incorpora además `Test`. No se ha observado cuándo ni mediante qué campo se añadió este último texto. [E3–E6]

**Cambios en la interfaz y su representación accesible.** Ya no se exponen los campos personales editables, sus botones Save/Cancel ni el error de apellido obligatorio. En su lugar se expone el resumen de nombre y un botón `My personal information`, con `expanded: true` y foco accesible. La tarjeta conserva avatar genérico, acción de fotografía y expansión de sección. Vuelven a exponerse controles generales como Add new section y los menús Actions. No se ha inspeccionado el contenido de esos menús. [E3–E6]

| Elemento | Antes de guardar, E3/E4 | Tras el guardado declarado, E5/E6 |
| --- | --- | --- |
| Nombre | First name editable: Test User. | Resumen estático: Test User Test. |
| Apellido | Vacío, con error de obligatoriedad. | No hay campo ni error expuestos; el resumen contiene texto adicional. |
| Edición | Campos de contacto y dirección, opciones adicionales. | Tarjeta de resumen del editor principal. |
| Acciones del formulario | Cancel habilitado y Save deshabilitado. | Save/Cancel del formulario no expuestos. |
| Acceso a datos personales | Formulario abierto. | Botón My personal information, anunciado como expandido. Su efecto no se ha probado. |
| Cambios pendientes | No se identificó indicador explícito. | No se identifica indicador explícito. No puede afirmarse que haya desaparecido uno. |

Esta comparación demuestra un cambio en la UI y en el árbol de accesibilidad, de edición a representación estática del contenido. El inventario DOM de REA describe estructura y nombres de atributos, pero no expone todos sus valores ni permite atribuir los cambios a un modelo de datos interno específico.

**Confirmación visible y mensajes.** El dato está representado fuera del formulario tras la acción de guardado comunicada por el usuario. Es evidencia de incorporación al resumen actual del editor. No se observa una notificación explícita de éxito, guardando, guardado o cambios pendientes en la accesibilidad recogida ni en el viewport. Una notificación transitoria anterior a la conexión podría no estar disponible. [E5, E6]

**Persistencia y red.** No se registraron peticiones de red ni conexiones WebSocket durante los 10 segundos posteriores a la conexión. El guardado ocurrió antes de esta ventana, por lo que no se conocen sus peticiones ni respuestas. La captura no solicitó claves ni valores de almacenamiento: las listas de claves vacías del resultado no son prueba de ausencia de almacenamiento. Tampoco la cuota o el uso agregado informado establecen dónde se guarda este CV. No se ha realizado ninguna prueba de recarga, cierre, nueva sesión o recuperación. No hay evidencia suficiente de persistencia más allá del estado actual de la página. [E5]

### 2. Inferencias

- La secuencia aportada por el usuario y los estados observados son compatibles con confirmar la edición de una sección y volver a un resumen actualizado. Esto respalda una confirmación funcional en la UI, sin demostrar una transacción interna ni guardado duradero.
- El texto adicional Test es compatible con haber completado el apellido requerido entre capturas. No puede afirmarse como hecho porque no se observó el formulario válido ni el momento en que Save pasó a estar habilitado.
- Como patrón de UX para nuestra aplicación, conviene reproducir una sección con resumen, entrada a edición, campos con validación, acciones explícitas de guardar/cancelar y actualización del resumen tras confirmar. Es una propuesta de diseño basada en lo observado, no una afirmación sobre la arquitectura de Europass.
- Separar un borrador editable del contenido confirmado sería una opción de diseño coherente con ese patrón. La semántica de cancelar y la persistencia deben decidirse y validarse expresamente; todavía no se han comprobado en Europass.
- No conviene interpretar Save de una sección como evidencia de guardado duradero del CV completo. La interfaz observada no establece esa equivalencia.

### 3. Cuestiones pendientes

- Observar el formulario válido y el instante de guardado para identificar habilitación de Save, mensajes, latencia y errores.
- Reabrir la edición en una fase autorizada para comprobar qué valores recupera y cómo los divide entre nombre y apellido.
- Comprobar Cancel con un borrador diferente y comparar si el resumen conserva el contenido confirmado.
- Determinar si existe guardado remoto, local, automático o un guardado global separado. La captura posterior al clic no resuelve estas posibilidades.
- Verificar persistencia tras recarga, cierre o nueva sesión mediante pruebas específicas, sin confundir permanencia en la página con persistencia duradera.
- Comprobar cómo afecta el contenido confirmado a vista previa y exportación.

Resultado: el cambio está reflejado en el resumen del editor y el formulario ya no está expuesto. La confirmación funcional es compatible con las evidencias; la durabilidad del guardado y su mecanismo siguen pendientes.

## Comportamiento al cancelar

Cuarta observación pasiva del 15 de octubre de 2026, después de que el usuario comunicara haber modificado un campo ficticio y salido sin guardar. No se conoce el campo ni el nuevo valor de ese borrador. REA no presenció la modificación, el control usado para salir ni posibles advertencias intermedias. Se compara el resultado actual con E5/E6, último estado observado tras guardar. No se ha interactuado ni implementado nada.

- E7 — DOM y accesibilidad: `ev_caaab40ad4a93ec226f893a48654c5063719eee6aa8690d2a421029ed8d8f992`; ventana de 10 segundos, de 08:34:49.161 a 08:34:59.340 UTC.
- E8 — Captura visual: `ev_2c233a14b6515bd9b69eaba84c345ea10aa32f536eaa04e8069ad1d3683c35b1`; 08:35:04.009 UTC. Viewport actual, sin desplazar la página ni guardar la imagen como recurso.
- Misma URL y target. E7 no informa de truncamiento; los metadatos están sujetos al filtro de origen y la red no incluye actividad anterior a la conexión.

### 1. Hechos observados

**Contenido conservado.** El editor principal vuelve a mostrar `Test User Test` como encabezado de nivel 3 y texto estático en Personal Information, exactamente igual que en el último estado guardado observado. El resumen visible no muestra una variación del nombre. Esto confirma la conservación del nombre mostrado; no comprueba todos los datos personales ni identifica el valor del borrador abandonado. [E5–E8]

**Estado de la interfaz.** No se exponen los campos de edición personal ni sus botones Save/Cancel. Se mantienen el avatar genérico, la edición de fotografía, el menú Actions cerrado y la sección Personal Information expandida. Las demás secciones siguen mostrando estados vacíos. [E7, E8]

| Aspecto | Tras guardar, E5/E6 | Tras salir sin guardar, E7/E8 |
| --- | --- | --- |
| Nombre del resumen | Test User Test. | Test User Test, sin diferencia observada. |
| Campos de edición y Save/Cancel | No expuestos. | No expuestos. |
| Expansión de Personal Information | `expanded: true`. | `expanded: true`. |
| My personal information | `expanded: true`, con foco accesible. | `expanded: false`, sin foco declarado. El chevrón visible apunta hacia abajo. |
| Advertencia o cambios pendientes | Sin indicador identificado en la captura. | Sin indicador identificado en la captura. |

Hay una diferencia concreta de estado accesible y presentación en My personal information: de expandido a contraído. No se ha observado qué acción la produjo; no puede atribuirse automáticamente a cancelar. Las capturas también muestran una posición de viewport ligeramente distinta, sin demostrar cambios de disposición propios del flujo. [E5–E8]

**Advertencias.** No se encuentra un diálogo de confirmación, un rol accesible alert/status ni un mensaje explícito de cambios pendientes en el estado actual. Esta observación posterior no permite determinar si apareció una advertencia al salir y fue cerrada. El usuario indicó salida sin guardar, pero no identificó si utilizó Cancel u otra vía. [E7, E8]

**DOM y alcance del descarte.** La representación accesible actual es nuevamente un resumen estático, como después de guardar, y no un formulario abierto. No se ha hecho una comprobación exhaustiva de igualdad del DOM ni una búsqueda literal del borrador: su valor no se conoce. Que un valor no aparezca en el resumen no demuestra su eliminación de memoria, almacenamiento, entradas ocultas u otras representaciones.

**Red.** No se registraron peticiones ni conexiones WebSocket durante los 10 segundos pasivos. La ventana comienza después de salir y no permite reconstruir la cancelación ni establecer persistencia o eliminación de datos. No se han consultado valores de almacenamiento. [E7]

### 2. Inferencias

- El resumen conservado después de la salida sin guardar es compatible con mantener un contenido confirmado y no sustituirlo por el borrador abandonado. La evidencia es más sólida para el nombre visible que para el conjunto de la información personal.
- En conjunto, las observaciones apoyan como hipótesis un ciclo de edición con estado temporal, confirmación mediante Save y retorno al contenido previamente confirmado al abandonar sin guardar. No establecen cómo se implementa internamente ni prueban que el borrador haya sido destruido completamente.
- Para nuestra aplicación, el patrón funcional candidato sería mantener el resumen confirmado mientras se edita un borrador, actualizarlo solo tras validar y guardar, y conservarlo al cancelar. Es una propuesta de diseño; todavía deben validarse el descarte del borrador, la reapertura del formulario y las advertencias de salida.
- La diferencia de expansión de My personal information debe tratarse como estado de presentación observado, separado de la confirmación de los datos. No demuestra una política general de guardar o cancelar.

### 3. Cuestiones pendientes

- Identificar el campo y el valor ficticio abandonado, y capturarlo antes de salir para poder comprobar su ausencia o restauración después.
- Reabrir el formulario en una fase autorizada para verificar si recupera los valores confirmados o conserva el borrador. Esta comprobación sigue pendiente aunque el resumen coincida.
- Observar la acción exacta de Cancel y otras vías de salida para determinar advertencias, condiciones y diferencias.
- Determinar si cancelar elimina completamente el borrador o solo evita incorporarlo al resumen, sin asumir una estructura interna.
- Comprobar todos los campos relevantes, no solo el nombre del resumen, y verificar su relación con vista previa y exportación.
- Observar si la expansión de My personal information depende de guardar, cancelar, foco u otra acción independiente.

Resultado: el nombre del resumen conserva el último valor guardado observado. El descarte completo y la presencia o ausencia de advertencia durante la salida no pueden confirmarse con esta captura posterior.

## Prueba de cancelación observada

Observación pasiva durante la secuencia anunciada por el usuario: abrir Personal Information, cambiar Email a un valor ficticio, pulsar Cancel y volver al editor. Se tomaron 20 muestras REA entre 09:18:41.105 y 09:20:13.111 UTC del 15 de octubre de 2026, en el mismo target y URL. No se ejecutaron acciones en la página, JavaScript, recargas ni implementación.

**Cobertura:** son capturas sucesivas de DOM/accesibilidad con ventanas de red de 4.5 y 2.5 segundos, no una grabación continua de teclado, clics o navegación. Hay intervalos entre llamadas, incluido uno de unos 11 segundos entre los dos bloques. Los timestamps de cada ventana no indican el instante exacto de cada cambio del DOM. No se capturaron píxeles durante esta prueba. La secuencia completa solicitada quedó **parcialmente observada**: no se obtuvo el valor temporal del correo ni un evento que identifique directamente el clic en Cancel.

### 1. Hechos observados

| Muestra y ventana UTC | Evidencia REA | Estado registrado |
| --- | --- | --- |
| 0, 09:18:41.105–09:18:45.728 | `ev_e4fc33fb36c512c1e812c4f79b2cc061ce169ebacce6a93f04858899d6615425` | Resumen Test User Test, My personal information contraído. |
| 8, 09:19:21.274–09:19:25.878 | `ev_7c21ed114ce6243e315fb692002d5d95ea92edd13c2c328b32698d83be31b8b7` | Menú abierto con Edit your Personal Information y foco en esa opción. |
| 9, 09:19:26.195–09:19:30.853 | `ev_d955a099d23030ff5ce35505ca6bd9152e6a2b5160ab1ab8a58c6b0096bc4b32` | Formulario con Email address, Cancel y Save habilitados. El contenido textual del correo no está expuesto. |
| 10, 09:19:41.937–09:19:44.676 | `ev_edc1d1455846071bc4aefe27498818d3d26c7959db70ef281ba5727aceb61b16` | Formulario abierto; Save deshabilitado y Cancel habilitado. |
| 11, 09:19:45.323–09:19:47.982 | `ev_f08a1841a59d494d8e18bc24e61f21f2015914a9d19766ff0da2889bec90d20f` | Formulario abierto; Save continúa deshabilitado. |
| 12, 09:19:48.670–09:19:51.333 | `ev_44f1f28a780dee8f111fcdd323f899155b09d6627a66a4a709813edd27a222b1` | Formulario abierto; Save vuelve a estar habilitado y Cancel permanece habilitado. |
| 13, 09:19:51.851–09:19:54.513 | `ev_4498354f766f981c5de06008b7bdb9dd884440f0497754147eb263b8771eea76` | Ya no hay Email address ni Save/Cancel expuestos; reaparece el resumen Test User Test. |
| 19, 09:20:10.523–09:20:13.111 | `ev_1311d06219e79f121c003ae0e133cf5dcd1da59eb3b31a31e157262ddb299c2a` | Se mantiene el resumen Test User Test, sin formulario de correo expuesto. |

**Valor temporal.** En las muestras del formulario, Email address aparece como textbox editable. Se revisaron sus descendientes accesibles: no contienen un texto de correo, tampoco uno sin arroba. El inventario DOM no entrega el valor de la propiedad del input. No se puede concluir que el campo estuviera vacío: solo que estas capturas no recuperan su contenido. Por ello no se ha verificado que el valor ficticio apareciera antes de cancelar.

**Cambio de estado y URL.** Se observa el paso de menú a formulario y después a resumen, sin cambio de la URL recogida en las 20 muestras. El formulario deja de estar expuesto; el resumen conserva el nombre confirmado. No se ha registrado un evento de clic ni una línea temporal de navegación: la asociación con Cancel procede del procedimiento anunciado por el usuario. No se descarta una navegación transitoria entre muestras.

**Advertencias.** No se encontraron diálogos, roles alert/status ni mensajes explícitos de descarte o cambios pendientes en la accesibilidad de las muestras. No se puede excluir un aviso breve entre capturas o un diálogo nativo no representado por este árbol.

**Red.** La muestra 13 recoge dos GET de recursos SVG del propio sitio, con respuesta 200. Son solicitudes de iconos, no evidencia de envío del correo o de guardado. No se recuperaron sus cuerpos ni recursos. Las demás ventanas no registran peticiones. Esta cobertura tiene huecos y no demuestra ausencia absoluta de tráfico ni de almacenamiento local.

### 2. Inferencias

- El retorno al mismo resumen sin el formulario es compatible con cancelar mediante un cambio de estado dentro del editor. No se necesita asumir una carga de página para explicar lo observado.
- El cambio de habilitación de Save indica que el formulario tiene estados diferentes durante la interacción. No puede atribuirse con certeza a validez, cambios pendientes o escritura del correo porque su valor y mensajes asociados no quedaron capturados.
- La secuencia apoya la hipótesis de edición temporal separada de una representación confirmada, pero no prueba el descarte del correo: el resumen de nombre no permite verificar un cambio en Email.
- La recomendación previa de usar borrador y contenido confirmado sigue siendo una propuesta coherente de UX, no una arquitectura interna demostrada de Europass.

### 3. Cuestiones pendientes

- Capturar el correo temporal mediante una imagen mientras el usuario mantiene el valor visible antes de pulsar Cancel; esta prueba no obtuvo ese dato esencial.
- Comprobar después el valor de Email reabriendo el formulario y comparándolo con un correo confirmado previamente conocido. Que el campo desaparezca de accesibilidad al cerrar no demuestra que su contenido se haya descartado.
- Registrar navegación con una herramienta de línea temporal si se necesita distinguir una navegación transitoria de un cambio de estado con mayor certeza.
- Observar el instante exacto de cancelación y cualquier diálogo, con cobertura visual adecuada, para determinar si exige confirmación.

Resultado de la prueba: se observó la apertura y el retorno al resumen durante la operación del usuario, pero no el valor temporal de Email. No se da por verificado su descarte ni la separación completa entre borrador y estado guardado.

## Prueba activa automatizada de cancelación

La autorización posterior del usuario permite acciones automatizadas. REA ejecutó esta prueba en un perfil temporal independiente, sin tocar la pestaña original. Evidencia: `ev_0b06a5123e9154c32b94a017f806b3f3f6c00f9e64fc6234d5ce15e4e80a34de`. Esta prueba resuelve parte de las dudas de las observaciones pasivas anteriores.

### 1. Hechos observados

Se inició un CV vacío, se guardaron Persona y Ficticia REA como nombre y apellido y se reabrió Personal Information. Después se ejecutó y capturó cada paso: escribir `borrador-rea@example.invalid` en Email address → pulsar Cancel → reabrir mediante el menú de información personal.

La captura posterior a escribir contiene el valor ficticio en el textbox. Tras Cancel desaparece el formulario y permanece el resumen Persona Ficticia REA. Al reabrir, Email address vuelve a estar vacío y nombre/apellido conservan sus valores confirmados. La URL de los pasos no cambia. No se observa un modal web de advertencia en las capturas; el flujo llegó a reabrir sin una acción adicional de confirmación. No se registró específicamente un evento de diálogo nativo, por lo que no se demuestra su ausencia por esta vía.

### 2. Inferencias

Para el campo y secuencia probados, cancelar impide que el valor temporal reaparezca al editar de nuevo, mientras mantiene los datos confirmados. Es evidencia funcional más fuerte de separación entre borrador y contenido confirmado que la simple ausencia del correo en un resumen. No prueba eliminación de toda copia interna ni todos los campos o rutas de salida.

### 3. Cuestiones pendientes

Repetir con un correo ya confirmado que deba restaurarse, comparar otras vías de salida y observar diálogos nativos explícitamente. La conservación tras recarga es una prueba distinta: se encontró un aviso de borrador automático, pero la reanudación ensayada produjo Discrepancies found y no recuperó los valores esperados. Véase 00-inspeccion-activa.md.
