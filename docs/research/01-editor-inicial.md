# 01 — Pantalla inicial del editor de CV

## Alcance y evidencia

Inspección pasiva con REA realizada el 15 de octubre de 2026. No se ha hecho clic, escrito, desplazado la página, abierto menús ni ejecutado JavaScript en ella. No se han descargado fuentes de scripts ni copiado código o recursos de Europass. No se ha implementado nada.

- Endpoint CDP: `http://127.0.0.1:9222`.
- Página: `https://europa.eu/europass/eportfolio/screen/cv-editor/compact-cv-editor?lang=en`.
- Título: `CV editor | Europass`.
- Target: `68B34A488D82A1D2E5B69A232F7EDA8D`.
- E1 — Descubrimiento: `ev_0f263f40c3e7fc3fb1e53f7453f503a23f02ac63031b9ef8722bd428ac749f35`.
- E2 — DOM y accesibilidad: `ev_478bfb89cb315519f475e861da5ff227bd6ef2f351eee6a535b86468c5a62b3a`; ventana de 08:10:59.584 a 08:11:01.229 UTC.
- E3 — Captura del viewport: `ev_dc9b6440d890e073ee6932abbcfcf83bb7e01bd175fdb143f22fb2e58f590a11`; 08:11:18.838 UTC; 913 × 937 píxeles. Se ha inspeccionado la imagen sin guardarla como recurso del proyecto.

La captura visual cubre únicamente el viewport inicial. El árbol de accesibilidad permite identificar contenido adicional, pero no demuestra su posición visual ni que todos los controles del documento estén expuestos. E2 no informa de truncamiento del DOM o de accesibilidad. Los metadatos de otros orígenes están filtrados; la red solo cubre la ventana posterior a la conexión.

## 1. Hechos observados

### Estructura general

La página corresponde al editor real, con encabezado «Create your CV». En el viewport aparece una columna central: instrucciones, campos globales, botón para añadir sección y primera tarjeta de contenido. La página tiene desplazamiento vertical. No aparece una vista previa junto al formulario en este viewport. [E1, E2, E3]

El encabezado institucional incluye acceso «Login» y selector del idioma de interfaz, anunciado como inglés. La presencia de «Login» no demuestra por sí sola el estado de autenticación. [E2, E3]

### Campos globales del CV

| Campo | Estado observado | Límites de lo observado |
| --- | --- | --- |
| Name | Entrada de texto vacía en la captura, con ejemplo `firstname_lastname_cv` y marca visual `(required)`. | La accesibilidad declara `required: false`: hay discrepancia con la indicación visual. No se ha probado validación. |
| Document language | Selector cerrado; muestra `English`. | No se ha abierto su lista de opciones. |
| Format for displaying dates | Selector cerrado; muestra `23/04/2019`. | Es la presentación del formato; no demuestra una fecha introducida en el CV. No se conocen los demás formatos. |

La página explica que los campos con asterisco son obligatorios. El idioma de interfaz está en el encabezado y el idioma del documento tiene su propio control. [E2, E3]

### Secciones y acciones

El orden siguiente procede de la secuencia de bloques en el DOM, corroborada por los encabezados de accesibilidad. Solo la primera tarjeta aparece en la captura visual. [E2, E3]

| Orden | Sección | Contenido expuesto | Acciones expuestas |
| --- | --- | --- | --- |
| 1 | Personal Information | Avatar genérico y texto `Edit`; no hay campos personales editables expuestos en este estado. | Menú `Actions`, control de expansión y botón con nombre accesible `Edit profile picture`. También aparece un botón denominado `Personal Information`; su función no está determinada. |
| 2 | Education & Training | Estado vacío y texto orientativo sobre experiencias de aprendizaje. | `Actions`, expansión, `Hide this section` y `Add Education & Training`. |
| 3 | Work experience | Estado vacío y texto que menciona trabajo remunerado, voluntariado, prácticas, aprendizaje y actividad autónoma. | `Actions`, expansión, `Hide this section` y `Add Work experience`. |
| 4 | Skills | Estado vacío; la ayuda menciona herramientas, software, proyectos, logros y organización de capacidades en grupos. | `Actions`, expansión, `Hide this section` y `Add Skills`. |
| 5 | Language Skills | Estado vacío; la ayuda describe autoevaluación mediante tabla y posibilidad de adjuntar certificados. | `Actions`, expansión, `Hide this section` y `Add Language Skills`. |

Los textos de ayuda anuncian posibilidades; no se han observado los formularios, la tabla de idiomas ni la carga de certificados. No se ha identificado una acción de ocultar información personal entre los controles expuestos. [E2]

### Expandir, contraer y ocultar

- Las cinco secciones exponen un botón con `expanded: true`. En la tarjeta de información personal se ve un chevrón hacia arriba. [E2, E3]
- Cada sección tiene un menú `Actions` cerrado, anunciado como menú emergente y con `expanded: false`. No se conocen sus opciones. [E2]
- Educación, experiencia, capacidades e idiomas exponen botones independientes `Hide this section`, además de sus controles de expansión. Su efecto no se ha probado. [E2]
- El nombre accesible de los cinco controles de expansión es el genérico `expanded`; no incluye el nombre de la sección en ese botón. [E2]

### Botones y controles globales

Hay dos controles `Add new section` en la accesibilidad y en la secuencia del DOM: uno antes de las tarjetas y otro después. El primero se ve como botón de ancho completo. REA anuncia ambos botones con el nombre accesible `Please add a description here`, mientras su texto es `Add new section`. [E2, E3]

En los controles accesibles recogidos no se identifican botones denominados guardar, salir o vista previa. Tampoco se ve ninguno en el viewport capturado. Esto no demuestra que esas funciones no existan en otras condiciones o zonas no expuestas. [E2, E3]

### Orden y reordenación

Se observa la secuencia de cinco secciones indicada en la tabla. No se identifican controles accesibles de mover arriba/abajo ni un asa de arrastre visible en la primera tarjeta. El inventario del DOM no enumera atributos con nombres que contengan `drag` o `drop`; esta comprobación no excluye otros mecanismos de reordenación. Los menús `Actions` permanecen cerrados. [E2, E3]

### Guardado, salida y vista previa

No se observa una confirmación accesible de guardado ni un estado accesible de cambios pendientes. Durante los 1.5 segundos de observación, REA no registró peticiones de red. No se ha editado nada ni se dispone de la actividad anterior a la conexión: estos datos no permiten concluir si hay guardado automático, local o remoto. [E2]

No se ha intentado salir ni generar una vista previa, y no se ha observado su comportamiento. [E2, E3]

## 2. Inferencias

- La pantalla sugiere un editor por tarjetas con ajustes del documento al principio y acciones específicas por sección. La captura no establece cómo cambia esta disposición en otras anchuras.
- Los botones con estado expandido probablemente permiten contraer y volver a expandir cada sección. No se ha observado la transición.
- La separación entre expansión y `Hide this section` sugiere dos operaciones diferentes. Queda por comprobar si ocultar afecta a la edición, al documento exportado o a ambos.
- La repetición de `Add new section` probablemente facilita añadir contenido desde ambos extremos de la lista. Se desconoce el catálogo disponible.
- Los menús `Actions` podrían agrupar operaciones adicionales. No hay evidencia suficiente para atribuirles reordenación, borrado, duplicación o cambio de título.
- Como inventario funcional preliminar para una aplicación propia, esta pantalla apunta a ajustes globales del CV, tarjetas de sección, estados vacíos, acciones para añadir contenido, controles de expansión, ocultación y edición de fotografía. Es un inventario de UX observado, no una arquitectura ni una decisión de implementación.

## 3. Cuestiones pendientes

| Área | Qué falta determinar |
| --- | --- |
| Nombre del CV | Si es obligatorio realmente, cuándo se valida y qué restricciones tiene. |
| Idiomas y fechas | Opciones disponibles y efecto de cambiar idioma de documento, idioma de interfaz o formato de fecha. |
| Información personal | Campos, obligatoriedad, acción para editar datos y relación con la edición de fotografía. |
| Formularios por sección | Campos, validaciones, guardado/cancelación, edición y eliminación de entradas. |
| Menús Actions | Opciones exactas y diferencias entre secciones. |
| Expansión | Efecto de contraer, persistencia del estado y posibilidad de controles globales. |
| Ocultación | Diferencia respecto a eliminar, efecto en vista previa/exportación y modo de restaurar una sección. |
| Secciones adicionales | Catálogo, secciones personalizadas, duplicados y ubicación de nuevas secciones. |
| Reordenación | Si existe y si opera sobre secciones, entradas o ambas; controles y restricciones. |
| Guardado | Si hay borradores, guardado automático/manual, destino, requisitos de cuenta y recuperación tras recargar. |
| Salida | Dónde está la acción, destino y advertencias ante cambios pendientes. |
| Vista previa | Cómo se abre, cuándo se actualiza y cómo se vuelve al editor. |
| Botones globales | Si existen controles adicionales en estados o zonas no expuestos en esta captura. |

Esta primera pasada documenta el estado inicial. La validación de comportamientos queda pendiente de una fase posterior con interacciones autorizadas.
