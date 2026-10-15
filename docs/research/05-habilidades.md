# 05 — Skills

## Alcance y evidencia

Inspección pasiva con REA el 15 de octubre de 2026, con Skills abierto por el usuario. No se ha interactuado, navegado, recargado ni implementado nada. No se han extraído fuentes de scripts ni copiado recursos propietarios.

- URL: `https://europa.eu/europass/eportfolio/screen/cv-editor/compact-cv-editor?lang=en`.
- Target: `68B34A488D82A1D2E5B69A232F7EDA8D`.
- E1 — DOM y accesibilidad: `ev_b7ba0ce6d5addb53f61c267e126af54c61f0c635079fb371a6d912e4dc1193e9`; 09:36:51.059–09:36:52.693 UTC, ventana configurada de 1.5 segundos.
- E2 — Captura visual: `ev_ab2d645226aa3778ca873af1f891b52df5f4037d4b088bb9be204763fc6eb423`; 09:36:57.187 UTC; viewport 913 × 937. Imagen consultada sin incorporarla al repositorio.

La tarjeta completa de Skills se ve en el viewport. E1 no declara truncamiento del DOM ni accesibilidad. Los metadatos se filtran por origen; la red solo cubre la conexión actual.

## 1. Hechos observados

### Organización y campos

Skills es una tarjeta expandida con formulario integrado en el editor, sin modal. Contiene, de arriba abajo: aviso informativo, entrada de habilidad con Add, sugerencias, área Added skills, información adicional y Cancel/Save. Debajo aparece Language Skills en estado vacío. [E1, E2]

| Elemento | Tipo y estado |
| --- | --- |
| Entrada de habilidad | Combobox editable con autocompletado de lista, popup cerrado y placeholder Select from list or enter free text. Nombre accesible Please fill in your skill. No muestra contenido introducido. |
| Add | Botón deshabilitado junto a la entrada. Nombre accesible Add the skill to your profile. |
| Suggestions | Seis sugerencias, cada una con acciones separadas de añadir y rechazar. |
| Added skills | Área vacía en la captura, sin habilidades seleccionadas visibles. |
| Add skill category | Botón con signo más en información adicional. No está abierto. |
| Cancel | Habilitado. |
| Save | Habilitado, aun sin habilidades visibles en Added skills. |

No se ven marcas de obligatorio ni errores de validación en Skills. El combobox declara required false e invalid false. No se observan fechas, ubicación, descripción con formato ni escalas de nivel. [E1, E2]

### Sugerencias y acciones

Las sugerencias presentes son Microsoft Office, Microsoft Word, Microsoft Excel, Microsoft Powerpoint, Social Media y Google Drive. Cada una muestra un signo más y un aspa circular; accesibilidad los identifica como añadir esa habilidad al perfil y rechazar la sugerencia. No se ha probado ninguna acción. No son habilidades ya añadidas. [E1, E2]

El placeholder anuncia selección de lista o texto libre. No se ha desplegado el catálogo ni confirmado que un texto arbitrario se pueda guardar. La existencia de varias sugerencias y de Added skills indica una UI de selección múltiple; todavía no se han añadido dos elementos para validar su comportamiento. [E1, E2]

### Categorías, navegación y guardado

Add skill category está disponible como detalle opcional. Su nombre accesible expone una clave sin traducir: `compact-cv-editor.cv-data-editor.profile-skills.edit-form.groups-aria-label`. No se conocen los campos que abre ni si admite categorías repetibles, nombres editables o movimiento de habilidades entre grupos. [E1, E2]

El enlace Skip optional fields aparece en accesibilidad pero no se distingue en la imagen. La cabecera mantiene control de expansión con estado verdadero. Cancel y Save se ven a la derecha del pie. No se ha observado su resultado, el guardado de una lista vacía ni advertencias al cancelar. [E1, E2]

No aparece indicador de cambios pendientes o guardado. No se registraron peticiones ni conexiones WebSocket en la breve ventana pasiva; no demuestra ausencia de guardado local, anterior o diferido. [E1]

### Aviso informativo

La UI anuncia que la página My Skills será retirada en los próximos meses y aclara que eso no afecta a Skills dentro del perfil. Es un mensaje observado en esta fecha; no se ha investigado su calendario ni implica que desaparezca esta sección del editor. [E1, E2]

### Comparación con los formularios anteriores

| Aspecto | Educación / experiencia | Skills |
| --- | --- | --- |
| Unidad de edición | Una entrada académica o laboral con varios campos. | Área de habilidades añadidas, sugerencias y categorías opcionales. |
| Campo principal | Título requerido, con error en las capturas iniciales. | Combobox sin marca de obligatorio ni error visible. |
| Fechas y ubicación | Presentes. | No presentes en el estado observado. |
| Save inicial observado | Deshabilitado. | Habilitado. |
| Patrón compartido | Tarjeta expandida, información opcional, Skip optional fields, Cancel/Save. | Los mismos elementos de UX, con contenido diferente. |

## 2. Inferencias

- La interfaz sugiere una colección de habilidades, potencialmente agrupable por categorías, en lugar de registros con fechas.
- Add deshabilitado con entrada vacía es compatible con exigir un valor para añadir una habilidad. Save habilitado no demuestra que guardar vacío sea válido o tenga efecto.
- Los controles de añadir y rechazar sugerencias parecen alimentar decisiones distintas: incorporar una habilidad frente a descartar una recomendación. No se conoce persistencia, reemplazo de sugerencias o efecto sobre el catálogo.
- El patrón de tarjeta, opcionales y acciones coincide visualmente con los formularios anteriores; no prueba reutilización del mismo componente interno.
- Para una aplicación propia son candidatos una entrada con autocompletado/texto libre, lista de selección y grupos opcionales. Su modelo y reglas deben esperar a observar habilidades añadidas y categorías.

## 3. Cuestiones pendientes

- Abrir Add skill category y observar sus campos, obligatoriedad, controles y relación con Added skills.
- Introducir una habilidad ficticia para inspeccionar lista de sugerencias, validación y habilitación de Add.
- Añadir varias habilidades y comprobar duplicados, eliminación, edición y orden.
- Probar rechazo de sugerencias y observar si se reemplazan o desaparecen y si el efecto persiste.
- Guardar y cancelar con una lista conocida, inspeccionar el resumen y reabrir para verificar los valores.
- Determinar si categorías pueden repetirse, eliminarse, reordenarse o contener habilidades compartidas.
- Comprobar persistencia, visibilidad en CV y formato en vista previa/exportación.

Siguiente paso de investigación: abrir únicamente Add skill category y dejar el formulario abierto para inspeccionarlo; las demás acciones quedan sin ejecutar.

## Añadir categoría de habilidades

El usuario abrió Add skill category. Inspección pasiva posterior, sin interacción ni implementación.

- E3 — DOM y accesibilidad: `ev_c3a47926ecf318b8bf606a38e2866d1eec0c65d32c155d43cf7416023e99a6af`; 15 de octubre de 2026, 09:39:04.081–09:39:05.193 UTC.
- E4 — Captura visual: `ev_be26a99dcd3975d276185456c0da18f6236b8e1a534694217bbbc5f686552d23`; 09:39:11.479 UTC. Imagen consultada sin incorporarla al repositorio.

### 1. Hechos observados

Se abre un diálogo modal centrado llamado Add skill category sobre Skills, cuyo formulario continúa visible con fondo atenuado. El diálogo tiene encabezado, aspa de cierre, un campo y pie de acciones. [E3, E4]

| Elemento | Estado observado |
| --- | --- |
| Category title | Texto editable de una línea, vacío, con el mismo texto como placeholder. Sin marca visible de obligatoriedad; accesibilidad required false e invalid false. |
| Close dialog | Botón de aspa habilitado, con foco según accesibilidad. |
| Cancel | Botón habilitado del diálogo. Distinto de Cancel del formulario de fondo. |
| Add category | Botón habilitado aunque el título esté vacío. No se ha pulsado. |

No se ve error de validación, selector de habilidades, descripción ni controles de repetición dentro del diálogo. Las seis sugerencias y la lista Added skills del formulario de fondo siguen representadas. No hay evidencia de que se haya creado una categoría por el mero hecho de abrir el diálogo. [E3, E4]

### 2. Inferencias

- La UI presenta dos niveles de acciones: añadir/cancelar una categoría en el modal y guardar/cancelar Skills en el formulario padre. Esto sugiere composición de una edición, pero no demuestra cuándo se confirma o persiste una categoría.
- El título parece ser el único dato inicial necesario para solicitar una categoría. Add category habilitado no prueba que se acepte un título vacío: podría validar al pulsar.
- Encabezado, cierre y pie de acciones reutilizan un patrón visual similar al diálogo de fotografía; no se atribuye identidad de componente interno.

### 3. Cuestiones pendientes

- Crear una categoría ficticia con título conocido y observar si aparece un grupo, dónde se sitúa y qué controles ofrece.
- Comprobar cómo se añaden habilidades a la categoría, si admite varias y si se pueden mover entre grupos.
- Determinar validación de título vacío, duplicados y límites.
- Comprobar si Cancel del formulario padre descarta categorías ya añadidas mediante el modal y si Save las conserva al reabrir.
- Verificar edición, eliminación, orden, visibilidad y representación en el CV.

Siguiente acción manual concreta: escribir Categoría de prueba en Category title y pulsar Add category; dejar Skills abierto, sin pulsar Save todavía. No se ha ejecutado esa acción desde REA.

## Categoría creada antes de guardar Skills

Inspección pasiva tras la acción manual del usuario. No se ha interactuado desde REA ni implementado nada.

- E5 — DOM y accesibilidad: `ev_b6f7e8fbade0137c1e170a3dae8b82b9fdc37fc39a75ac037293034e40aae452`; 15 de octubre de 2026, 09:40:07.178–09:40:08.283 UTC.
- E6 — Captura visual: `ev_de326ffdc5c1ba07bb6e46cb123d42055091d5cd5541a282bd1003c9dde4b394`; 09:40:13.376 UTC. Imagen consultada sin incorporarla al repositorio.

### 1. Hechos observados

El modal ya no está expuesto. Skills continúa en edición y ahora muestra un grupo llamado **Categoria de prueba**, sin tilde, tal como aparece en la captura. Se sitúa debajo de Added skills, que sigue sin habilidades visibles. [E5, E6]

| Elemento del grupo | Estado observado |
| --- | --- |
| Título | Texto Categoria de prueba. |
| Rename | Botón habilitado para renombrar. No se ha abierto. |
| Delete | Botón habilitado; nombre accesible Delete the group of skills. No se ha probado. |
| Zona de contenido | Recuadro vacío de borde discontinuo con la instrucción Drag and drop your skills here. |
| Add skills to this category | Botón habilitado dentro del recuadro. No se ha abierto. |

Add skill category sigue disponible debajo del grupo. Cancel y Save del formulario padre continúan habilitados. Las seis sugerencias permanecen visibles; el campo general sigue vacío y su Add deshabilitado. No aparece un mensaje explícito de guardado o cambios pendientes. [E5, E6]

Hay ahora un indicio explícito de arrastre para asignar habilidades al grupo: la instrucción dentro de la zona vacía. No demuestra que pueda reordenarse la categoría, que el arrastre funcione ni qué habilidades son arrastrables. [E5, E6]

### 2. Inferencias

- La creación del grupo se refleja dentro del formulario padre antes del Save que se indicó dejar pendiente. Es compatible con una composición temporal de Skills; no demuestra persistencia ni que Cancel descarte el grupo.
- El botón Add skill category que permanece disponible sugiere posibilidad de crear más grupos, todavía no probada.
- La zona de arrastre y Add skills to this category parecen dos vías para asignar habilidades a un grupo. Se desconoce si una habilidad puede pertenecer a varios grupos o cómo se mueve entre ellos.
- Para una aplicación propia, la UI sugiere habilidades y grupos con título, acciones independientes y asignación de miembros. Es una interpretación funcional, no un esquema interno recuperado.

### 3. Cuestiones pendientes

- Abrir Add skills to this category y observar si muestra buscador, lista, selección múltiple o un formulario diferente.
- Añadir una habilidad conocida y distinguir habilidades generales de miembros del grupo.
- Validar Rename, Delete, confirmaciones, arrastre y orden de grupos y habilidades.
- Guardar Skills, comparar el resumen y reabrir; probar por separado el descarte de una categoría temporal con Cancel.

Siguiente acción manual: pulsar únicamente Add skills to this category y dejar el estado resultante abierto, sin guardar todavía.

## Selección de habilidades para una categoría

Inspección pasiva del estado abierto por el usuario, sin interacciones desde REA ni implementación.

- E7 — DOM y accesibilidad: `ev_8489c6ca46952f3bcacf7f8689103306d18f3b619d034d55566d042bfd55f239`; 15 de octubre de 2026, 09:41:28.690–09:41:29.814 UTC.
- E8 — Captura visual: `ev_fab2287ee9979032593d06667b310dfc35a300fcf932b179c88d2ff3338210fb`; 09:41:36.608 UTC. Imagen consultada sin incorporarla al repositorio.

### 1. Hechos observados

Se muestra un modal titulado Add skills to the category "Categoria de prueba". El título visual se trunca con puntos suspensivos en este viewport, mientras accesibilidad conserva el nombre completo. La instrucción pide seleccionar habilidades ya añadidas para incluirlas en la categoría. [E7, E8]

| Control | Estado observado |
| --- | --- |
| Google Drive | Única habilidad listada en el modal, junto a una casilla desmarcada. |
| Casilla | Checked false y habilitada; su nombre accesible está compuesto por espacios, aunque Google Drive se ve al lado. |
| Close dialog | Habilitado, con foco según accesibilidad. |
| Cancel del modal | Habilitado. |
| Save del modal | Deshabilitado sin selección. |

No aparecen buscador ni entrada de texto libre dentro del modal. El formulario padre sigue abierto debajo, con su propio Save habilitado. No se ha probado la selección o el guardado del modal. [E7, E8]

Respecto a E5/E6, Google Drive aparece ahora en Added skills del formulario padre, con botón Delete Google Drive, y ya no figura entre las sugerencias. En su lugar aparece Zoom. Se observa el resultado, pero no se presenció qué acción añadió Google Drive ni cómo se eligió la nueva sugerencia. El grupo continúa vacío detrás del modal. [E5–E8]

### 2. Inferencias

- La asignación por modal parece partir del conjunto de habilidades ya añadidas, en lugar de crear habilidades directamente dentro de la categoría. Es compatible con una relación entre habilidades y grupos; no demuestra cardinalidad ni referencias internas.
- Save deshabilitado con la casilla desmarcada sugiere que seleccionar al menos una habilidad habilitaría la confirmación. Está pendiente de comprobar.
- La sustitución visible de una sugerencia por Zoom es compatible con reposición de recomendaciones al añadir una habilidad; no establece la regla de recomendación ni su origen.
- Existen dos niveles visibles de confirmación: asignación en el modal y Save del formulario Skills. Se desconoce qué descarta Cancel en cada nivel.

### 3. Cuestiones pendientes

- Seleccionar Google Drive y confirmar en el modal para comprobar su representación dentro del grupo y si permanece también en Added skills.
- Guardar el formulario padre y comparar la representación de Skills fuera de edición.
- Verificar pertenencia a varios grupos, desasignación, duplicados y posibilidad de seleccionar varias habilidades.
- Comprobar persistencia y cancelación de asignaciones y categorías.

Siguiente acción manual: marcar Google Drive, pulsar Save del modal y después Save del formulario Skills; dejar el editor principal visible. Son pasos para inspeccionar el resultado confirmado, todavía no ejecutados desde REA.

## Habilidad asignada y varias categorías

Inspección pasiva posterior al aviso del usuario; no se han realizado interacciones desde REA ni implementación.

- E9 — DOM y accesibilidad: `ev_e0e4bcf6378279d3b4d0a5de3ee2998749b11bc7a4275274499ba9a62196645c`; 15 de octubre de 2026, 09:43:45.708–09:43:46.847 UTC.
- E10 — Captura visual: `ev_05b46a04735da4e88d430131d824c98a3038573073999e31d5d58f1d74aa062d`; 09:43:51.181 UTC. Imagen consultada sin incorporarla al repositorio.

### 1. Hechos observados

- El modal de asignación ya no está expuesto. Google Drive aparece dentro de Categoria de prueba como una etiqueta con aspa y botón accesible Delete Google Drive. El área general Added skills no muestra esa etiqueta en la imagen. [E9, E10]
- Hay una segunda categoría, Prueba2, debajo de la primera. Está vacía y muestra la instrucción de arrastre. Las dos categorías tienen Rename, Delete y Add skills to this category. Se confirma la capacidad de mostrar al menos dos grupos; no se ha observado el acto de crear el segundo. [E9, E10]
- Skills sigue en modo formulario: buscador, sugerencias, controles de grupos y Cancel/Save permanecen expuestos y se ven en la imagen. Save está habilitado. No se observa un resumen fuera de edición ni confirmación de guardado. No se puede dar por ejecutado o completado Save del formulario padre a partir de esta captura. [E9, E10]
- Durante un segundo de observación no se registraron peticiones ni conexiones WebSocket. La captura no cubre las acciones anteriores ni permite establecer persistencia. [E9]

### 2. Inferencias

- La asignación parece trasladar visualmente la habilidad desde el área general al grupo seleccionado. No demuestra si internamente se mueve, referencia o duplica el dato, ni si puede pertenecer a otros grupos.
- El orden actual de grupos es compatible con el orden de creación comunicado previamente, pero no se ha probado reordenación ni una regla automática.
- La asignación confirmada en el modal se refleja en la edición padre; el guardado final de Skills sigue sin verificar.

### 3. Cuestiones pendientes

- Pulsar Save del formulario padre y observar si se cierra, valida o conserva la edición, especialmente con la segunda categoría vacía.
- Determinar qué hace el aspa de Google Drive dentro de la categoría: desasignación o eliminación completa.
- Comprobar el resumen confirmado, reapertura y persistencia antes de dar por terminado el flujo de guardado de Skills.

Siguiente acción manual: pulsar Save al final del formulario Skills. Si aparece un mensaje o el formulario no se cierra, mantener ese estado para inspección.

## Resumen después de guardar Skills

Inspección pasiva posterior a la acción manual del usuario, sin interacción desde REA ni implementación.

- E11 — DOM y accesibilidad: `ev_63f9371e37ce6d8f7f6169f85f47205ac1184ae92b81a6f5b68a54d2796bee57`; 15 de octubre de 2026, 09:44:39.897–09:44:41.027 UTC.
- E12 — Captura visual: `ev_c0b16ef3df7657c1032443f4f1d96f2152ab6361dc7bf5cb6b8f13dbdd30bf43`; 09:44:46.849 UTC. Imagen consultada sin incorporarla al repositorio.

### 1. Hechos observados

Skills aparece ahora como resumen en el editor principal: Categoria de prueba es un encabezado de nivel 3 y Google Drive una etiqueta estática debajo. No se muestran el buscador, sugerencias, Rename/Delete, zonas de asignación ni Save/Cancel del formulario. La etiqueta ya no tiene el aspa de eliminación visible en edición. La sección continúa expandida y tiene un menú Actions cerrado en su cabecera. [E11, E12]

Prueba2, que estaba vacía en E9/E10, no aparece en el resumen visual ni en la accesibilidad actual. Esto confirma su ausencia de la representación actual, no su eliminación de los datos. No se observan avisos de éxito o cambios pendientes. [E9–E12]

Language Skills permanece vacía y ofrece Add Language Skills y Hide this section. Work experience sigue vacía. El editor mantiene la misma URL. No se registraron peticiones ni conexiones WebSocket en el segundo observado después de guardar; no se capturó la petición o transición del guardado ni se verificó persistencia. [E11, E12]

### 2. Inferencias

- La desaparición del formulario y la representación estática del grupo con su habilidad respaldan una confirmación funcional en la UI tras Save, similar al resultado observado en información personal y educación.
- El resumen podría omitir categorías vacías o el guardado podría descartarlas; ambas explicaciones son compatibles con la ausencia de Prueba2. Reabrir edición permitiría distinguirlas.
- Se observan dos niveles de confirmación: la asignación del modal se reflejó antes en el formulario y el Save del padre conduce después al resumen. No demuestra dos operaciones de persistencia ni una arquitectura interna concreta.

### 3. Cuestiones pendientes

- Reabrir Skills para comprobar si Prueba2 sigue existiendo y si Google Drive recupera su asignación.
- Validar cancelación, eliminación, renombrado, arrastre, pertenencia a varios grupos y persistencia fuera de la página.
- Comprobar visibilidad y formato de grupos y habilidades en vista previa/exportación.

Siguiente bloque de investigación: abrir Add Language Skills y dejar su formulario inicial visible para documentarlo en 06-idiomas.md.
