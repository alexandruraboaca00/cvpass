# 06 — Language Skills

## Alcance y evidencia

Inspección pasiva con REA el 15 de octubre de 2026, después de que el usuario abriera Add Language Skills. Sin interacción desde REA, navegación, recarga, extracción de código o recursos ni implementación.

- URL: `https://europa.eu/europass/eportfolio/screen/cv-editor/compact-cv-editor?lang=en`.
- Target: `68B34A488D82A1D2E5B69A232F7EDA8D`.
- E1 — DOM y accesibilidad: `ev_b95eb6cb90c62b24ca4f058dd49e5e27872e23e3bfeb588be462261ab8b144a4`; 09:45:44.281–09:45:45.407 UTC.
- E2 — Captura visual: `ev_8adb16acfd6d5f61a493db6fec7cbe998f2ddc5d484f1bb4370036d4c9c4a103`; 09:45:52.763 UTC; viewport 913 × 937, consultado sin guardar la imagen en el repositorio.

La imagen muestra toda la tarjeta de idiomas. El alcance de red empieza al conectar, y no reconstruye la apertura previa del formulario.

## 1. Hechos observados

Language Skills es un formulario dentro de una tarjeta expandida, sin diálogo modal. Tiene dos bloques verticales separados por líneas: Mother tongue y Other language; después aparecen Cancel y Save. [E1, E2]

| Elemento | Tipo y estado |
| --- | --- |
| Mother tongue | Combobox editable con autocompletado de lista, cerrado y vacío. Placeholder visual Select from list; nombre accesible Type a language or select from the list. |
| Add another mother tongue | Botón deshabilitado debajo del primer bloque. |
| Other language | Otro combobox editable, cerrado y vacío, con el mismo placeholder y nombre accesible. |
| Información de Other language | Icono informativo; botón accesible cuya ayuda describe autoevaluación y el Common European Framework of Reference for Languages. No se ha activado. |
| Add another language | Botón deshabilitado debajo del segundo bloque. |
| Cancel | Habilitado. |
| Save | Habilitado, aun con ambos selectores sin contenido visible. |

No se ven marcas de obligatorio ni errores de validación. Los dos combobox declaran required false e invalid false. No se han abierto sus catálogos ni probado texto libre. No aparecen fechas, ubicación o descripciones con formato. [E1, E2]

Las acciones Add another indican vías para añadir más elementos, pero todavía no se han observado varias filas. En este estado no se ve una tabla de niveles, controles de comprensión/expresión ni carga de certificados. La ayuda anuncia autoevaluación, sin demostrar su formulario real. [E1, E2]

No se observa indicador de cambios pendientes o guardado. Durante el segundo pasivo no se registraron peticiones ni conexiones WebSocket. No se ha probado guardar vacío, cancelar, persistencia ni representación de idiomas confirmados. [E1, E2]

Comparado con Skills, mantiene tarjeta expandida y Save/Cancel habilitados, pero organiza la edición en lengua materna y otros idiomas, en vez de sugerencias de habilidades y categorías. Comparado con educación y experiencia, no presenta un campo inicial marcado obligatorio ni un periodo. La similitud visual no demuestra componentes internos compartidos.

## 2. Inferencias

- La separación entre lengua materna y otros idiomas sugiere tratamientos distintos; la ayuda de autoevaluación asociada al segundo bloque podría explicar controles adicionales al seleccionar otro idioma. No se han observado todavía.
- Los botones Add another deshabilitados con campos vacíos son compatibles con exigir completar la fila actual antes de añadir otra. No se ha probado su condición exacta.
- Save habilitado no demuestra que se acepte una sección vacía ni que guardar produzca cambios.
- Para nuestra aplicación son candidatos dos colecciones diferenciadas de idiomas y, posiblemente, una evaluación por idioma adicional. El catálogo, las dimensiones y la escala siguen por determinar mediante UI.

## 3. Cuestiones pendientes

- Seleccionar una lengua materna y otro idioma para observar controles que aparecen, validación y habilitación de Add another.
- Abrir las listas y comprobar búsqueda, valores libres, duplicados y restricciones entre los dos bloques.
- Inspeccionar dimensiones y niveles de autoevaluación si aparecen; no asumir una escala concreta solo por la ayuda.
- Determinar si existe vinculación de certificados, sus campos y si implica enlaces o archivos.
- Probar varias filas, eliminación y orden.
- Guardar, inspeccionar el resumen y reabrir; comprobar cancelación con valores temporales conocidos y persistencia.

Siguiente acción manual: seleccionar Spanish como Mother tongue y English como Other language, dejando el formulario abierto sin pulsar Save, para inspeccionar su estado ampliado.

## Idiomas seleccionados y autoevaluación

Inspección pasiva después de la selección manual del usuario, sin interacción desde REA ni implementación.

- E3 — DOM y accesibilidad: `ev_14eedc404c1f0e54c5bf513c11dbab54fe9327ac65dca836b7cddabfa218a759`; 15 de octubre de 2026, 09:47:58.005–09:47:59.161 UTC.
- E4 — Captura visual: `ev_14a5d0c598b52b3ce564138d065a948a3b5a17ed546bc92817aa706a5125837a`; 09:48:04.252 UTC. Imagen consultada sin incorporarla al repositorio.

### 1. Hechos observados

Mother tongue muestra Spanish y Other language muestra English, tanto visualmente como en texto editable de accesibilidad. El formulario sigue abierto, sin resumen confirmado. [E3, E4]

Los botones Add another mother tongue y Add another language están ahora habilitados. Cada idioma dispone de Delete, con nombres accesibles distintos para eliminar lengua materna u otro idioma. No se ha ejecutado eliminación ni añadido una segunda fila. [E3, E4]

Debajo de English aparecen cinco selectores de autoevaluación, distribuidos en tres grupos:

| Grupo visual | Dimensión | Estado |
| --- | --- | --- |
| Understanding | Listening | Selector cerrado, Select. |
| Understanding | Reading | Selector cerrado, Select. |
| Speaking | Spoken interaction | Selector cerrado, Select. |
| Speaking | Spoken production | Selector cerrado, Select. |
| Writing | Writing | Selector cerrado, Select. |

Los selectores se anuncian como combobox con popup listbox y required false. Listening/Reading comparten fila; Spoken interaction/Spoken production comparten otra; Writing ocupa una posición en su grupo. No se han abierto las opciones: todavía no se conoce la escala ofrecida. [E3, E4]

No hay autoevaluación expuesta bajo Spanish. No se observan controles de certificados ni marcas de obligatoriedad o errores en esta pantalla. Save y Cancel permanecen habilitados, aun sin niveles elegidos. No se ha probado guardar así. [E3, E4]

### 2. Inferencias

- La comparación con E1/E2 respalda que seleccionar otro idioma revela sus dimensiones de autoevaluación; no se ha capturado el instante de aparición ni comprobado si todos los idiomas producen lo mismo.
- La habilitación de Add another tras la selección es compatible con requerir un idioma en la fila antes de crear otra. No demuestra reglas de duplicados o límites.
- Para una aplicación propia, el patrón sugiere lenguas maternas sin evaluación visible y otros idiomas con cinco niveles independientes. No debe reducirse a un único nivel global, ni fijarse una escala sin observar las opciones.
- Save habilitado y required false sugieren que los niveles podrían ser opcionales, pero esa validación debe comprobarse mediante guardado.

### 3. Cuestiones pendientes

- Abrir Listening para registrar opciones, descripciones, escala y posibilidad de dejarlo sin valorar.
- Comprobar si los otros cuatro selectores comparten catálogo o presentan descripciones específicas.
- Validar varias filas, eliminación, duplicados, orden y recuperación al reabrir.
- Guardar niveles conocidos y comparar resumen y posterior exportación.

Siguiente acción manual: abrir únicamente el selector Listening de English y dejar la lista desplegada, sin seleccionar todavía.

## Escala de Listening

Inspección pasiva del desplegable abierto por el usuario. No se ha seleccionado ninguna opción desde REA ni implementado nada.

- E5 — DOM y accesibilidad: `ev_3c1286b7509dc298a11aa7d250e905ff978e84554c258e6e290d3f5ffd27fd40`; 15 de octubre de 2026, 09:49:15.505–09:49:16.615 UTC.
- E6 — Captura visual: `ev_ca25b31810c84c584c97adcb09489929c85024cc72f235a61047f9480526aa40`; 09:49:21.314 UTC. Imagen consultada sin incorporarla al repositorio.

### 1. Hechos observados

Listening está expandido y tiene el foco. El popup se anuncia como listbox vertical de selección única. Accesibilidad expone seis opciones, todas sin seleccionar: A1, A2, B1, B2, C1 y C2. [E5]

Cada opción incluye el código, una agrupación de nivel y una descripción de comprensión oral. Resumen funcional de las descripciones, sin reproducirlas literalmente:

| Código | Grupo mostrado | Orientación de la ayuda |
| --- | --- | --- |
| A1 | Basic User | Palabras familiares y frases muy básicas con habla lenta y clara. |
| A2 | Basic User | Vocabulario cotidiano y sentido principal de mensajes breves y sencillos. |
| B1 | Independent user | Puntos principales de habla clara sobre temas conocidos y contenidos de medios relativamente lentos. |
| B2 | Independent user | Discurso extenso sobre temas familiares y buena parte de noticias y películas en lengua estándar. |
| C1 | Proficient user | Discurso extenso incluso poco estructurado y comprensión de medios con menor esfuerzo. |
| C2 | Proficient user | Habla diversa, incluso rápida, con adaptación al acento. |

La imagen muestra un popup estrecho con desplazamiento interno, superpuesto al formulario; se ve la primera descripción y la barra de desplazamiento. Las seis opciones proceden de accesibilidad, no de haber desplazado la lista. No se muestra una opción adicional de vacío o no evaluado en el inventario recogido; el control sigue mostrando Select. [E5, E6]

### 2. Inferencias

- La escala A1–C2 queda confirmada para Listening y la UI ayuda a autoevaluarse mediante descripciones, además del código.
- Es razonable esperar un patrón parecido en las otras dimensiones, pero sus opciones y descripciones no se han inspeccionado; no se da por demostrada su identidad.
- Para nuestra aplicación, un selector de nivel con explicación específica por dimensión sería un patrón funcional candidato. Las ayudas deberían redactarse o licenciarse de forma propia; esta investigación no incorpora recursos ni código de Europass.

### 3. Cuestiones pendientes

- Inspeccionar las opciones de las otras dimensiones y cómo se limpia una selección.
- Guardar un nivel conocido dejando otras dimensiones sin valorar para comprobar validación y resumen.
- Verificar si los niveles pueden cambiarse o eliminarse al reabrir y cómo aparecen en vista previa/exportación.

Siguiente acción manual: seleccionar B1 en Listening, dejar los otros cuatro niveles sin seleccionar y pulsar Save del formulario Language Skills. Mantener visible el resultado o cualquier error que aparezca.

## Resultado del guardado con evaluación parcial

Inspección pasiva posterior a la acción manual indicada al usuario. No se ha interactuado desde REA ni implementado nada.

- E7 — DOM y accesibilidad: `ev_5716be7c82cd5142c0df8dbeddfec4dfbb16e23246931a682f5ec2a8400e49cc`; 15 de octubre de 2026, 09:50:23.051–09:50:24.199 UTC.
- E8 — Captura visual: `ev_525c086d02a6096a3601c4fb97184f6f1d64106c5c26e9ef23308fcbe3eb42ec`; 09:50:28.607 UTC. Imagen consultada sin incorporarla al repositorio.

### 1. Hechos observados

El formulario ya no está expuesto y Language Skills muestra un resumen. No aparecen sus selectores de edición ni Save/Cancel. La sección está expandida y tiene un menú Actions cerrado. [E7, E8]

- Mother tongue contiene una tarjeta con Spanish y la indicación Mother tongue.
- Other language(s) muestra una tabla: English en la cabecera de datos y cinco filas de dimensiones.
- Listening muestra B1 - Independent user.
- Reading, Spoken interaction, Spoken production y Writing conservan sus etiquetas y tienen celdas de nivel vacías. [E7, E8]

Se confirma que, en este caso, el guardado comunicado desemboca en un resumen con evaluación parcial: no fue necesario observar valores en las otras cuatro dimensiones para obtener este resultado. Esto no establece reglas para otras combinaciones de datos ni persistencia fuera de la página.

Debajo aparece una opción de presentación: Display language proficiency level guidance in the CV, con casilla desmarcada. La ayuda muestra las agrupaciones A1/A2, B1/B2 y C1/C2. La casilla accesible tiene un nombre compuesto por espacios, aunque la etiqueta se lee visualmente. No se ha cambiado su estado ni comprobado su efecto en el CV. [E7, E8]

No se observa mensaje de éxito, error o cambios pendientes. No se registraron peticiones ni conexiones WebSocket en el segundo posterior a la conexión; no se presenció el clic de guardado ni su tráfico. [E7]

### 2. Inferencias

- Para representar esta UI conviene admitir niveles ausentes por dimensión; un único nivel global o cinco niveles siempre obligatorios no reproducirían el resultado observado.
- La opción de mostrar la guía parece afectar a la presentación del CV y no a los niveles introducidos. Su alcance real requiere vista previa/exportación.
- El cambio de formulario a resumen coincide funcionalmente con los guardados observados en Skills, educación e información personal; no demuestra un mecanismo interno común ni persistencia duradera.

### 3. Cuestiones pendientes

- Reabrir y comprobar recuperación de los idiomas y del nivel parcial.
- Validar varios idiomas, catálogos de las demás dimensiones, eliminación y orden.
- Cambiar la casilla de guía y comprobar cuándo se confirma, si persiste y cómo afecta a vista previa/exportación.
- Inspeccionar certificados si existe una vía concreta; no han aparecido en este flujo.

Siguiente bloque: abrir Add new section y dejar visible su selector o diálogo, sin elegir todavía una sección, para documentarlo en 07-secciones-personalizadas.md.
