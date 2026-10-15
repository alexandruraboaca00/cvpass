# 04 — Añadir una entrada de Work experience

## Alcance y evidencia

Inspección pasiva con REA el 15 de octubre de 2026. No se ha escrito, hecho clic, abierto selectores o calendarios, cambiado interruptores ni desplazado la página. No se han obtenido fuentes de scripts ni copiado código o recursos. No se ha implementado nada.

- URL: `https://europa.eu/europass/eportfolio/screen/cv-editor/compact-cv-editor?lang=en`.
- Target: `68B34A488D82A1D2E5B69A232F7EDA8D`.
- E1 — DOM y accesibilidad: `ev_f5f0e1f4cd63ff6c12f3d6dbb67f362b4e09d4eeab1b6001c8a3c90459b0313e`; ventana de 09:31:13.870 a 09:31:15.648 UTC, observación configurada de 1.5 segundos.
- E2 — Captura visual: `ev_e986aba233111205966b07a616d54622a4d93f4cfb83e77f07c012bdf1b5b9dd`; 09:31:20.179 UTC; viewport de 913 × 937 píxeles, consultado sin guardar la imagen como recurso.

La captura empieza a la altura del campo de ocupación y llega parcialmente a los botones de detalles adicionales. No incluye todo el formulario en píxeles: las acciones finales se identifican por accesibilidad. E1 no declara truncamiento del DOM o accesibilidad. Metadatos filtrados por origen y red limitada a la ventana posterior a la conexión.

## 1. Hechos observados

### Organización y campos

El formulario está dentro de Work experience en la página del editor, sin diálogo modal expuesto. La sección se anuncia expandida. En el viewport los campos se apilan en una columna: ocupación, empleador, ciudad, país, periodo, estado en curso, descripción y detalles adicionales. A diferencia de la captura de educación, City y Country no comparten fila. [E1, E2]

| Campo | Tipo y estado observado | Obligatoriedad visible |
| --- | --- | --- |
| Occupation or position held | Combobox editable, vacío, placeholder Occupation; autocompletado de lista y popup listbox cerrado. Tiene el foco accesible. | Marcado required y error de campo obligatorio. |
| Employer | Texto de una línea, vacío, placeholder Name of the employer. | Sin marca de obligatorio. |
| City | Texto de una línea, vacío, ejemplo e.g. Paris. | Sin marca de obligatorio. |
| Country | Selector cerrado con Select. | Sin marca de obligatorio. |
| Start date | Fecha vacía, DD-MM-YYYY y botón de calendario. | Sin marca de obligatorio. |
| End date | Fecha vacía, DD-MM-YYYY y botón de calendario. | Sin marca de obligatorio. |
| Ongoing | Interruptor desactivado; switch con checked false. Ayuda accesible que indica señalar si es el trabajo actual. | Sin marca de obligatorio. |
| Main activities and responsibilities | Área de edición de texto con barra de formato y región accesible con ese nombre. | Sin marca de obligatorio. |

Sin marca significa aparentemente opcional, no una regla validada. El control de ocupación declara required false e invalid false pese a la etiqueta y al error; se repite la discrepancia observada en educación y datos personales. [E1, E2]

### Fechas y ubicación

Inicio y fin muestran formato de entrada día-mes-año con guiones y sendos controles Choose date. Accesibilidad expone también nombres genéricos ecl.date-picker.aria-label y DD-MM-YYYY: no se consideran fechas adicionales. No se ha abierto el calendario ni activado Ongoing. No hay evidencia de restricciones entre fechas o del efecto del trabajo actual sobre la fecha final. [E1, E2]

Country expone en accesibilidad agrupaciones European Union, Europass y Non European Union. No representan un desplegable visualmente abierto. No se ha determinado el catálogo completo ni su búsqueda. City es una entrada de texto, no un selector observado. [E1]

### Tareas y responsabilidades

El área muestra texto orientativo en cursiva sobre mantenimiento de equipos, proveedores y entrenamiento deportivo. Su aspecto y el contenido editable vacío expuesto son compatibles con un placeholder; no se atribuyen esas tareas a una entrada creada por el usuario. [E1, E2]

La barra expone controles para:

- Negrita, cursiva y subrayado.
- Subíndice y superíndice.
- Opciones de alineación, con menú cerrado.
- Lista numerada y lista con viñetas.
- Reducir y aumentar sangría.
- Enlaces.
- Limpiar formato y eliminar todo el texto, como acciones separadas.
- Deshacer y rehacer. [E1, E2]

No se ha probado ninguna herramienta. Las listas y los ejemplos de tareas no equivalen a campos repetibles independientes. Se observa un tirador visual de tamaño en la esquina inferior del área, sin probar su funcionamiento. No se conocen límites, formatos persistidos ni el tratamiento de contenido pegado.

### Detalles adicionales y repetición

En Select additional information to fill in aparecen cuatro botones con signo más; el último queda parcialmente fuera del viewport pero está expuesto en accesibilidad. [E1, E2]

| Texto del botón | Nombre accesible o límite |
| --- | --- |
| Business / Sector | Mismo nombre accesible; no abierto. |
| Organisation Email | Nombre accesible basado en un ejemplo de correo; no abierto. |
| Organisation Website | Nombre accesible basado en un ejemplo de web; no abierto. |
| Link to file or video | Nombre accesible Add a link to a video; no demuestra una carga de archivos. |

No se conoce el tipo de los campos resultantes ni si admiten varias instancias. No se observan controles para repetir empleador, ubicación o periodo dentro de esta entrada. La capacidad de varias entradas laborales no se ha probado en esta inspección.

### Acciones, navegación y validación

Cancel está habilitado y Save deshabilitado en accesibilidad. Se expone el enlace Skip optional fields; no se ha probado su destino. La cabecera de Work experience mantiene su control de expansión. No se observó ninguna transición de navegación. [E1]

Hay un error rojo This field is mandatory bajo la ocupación vacía. No se conoce el evento que lo activó. No se muestran otros errores en el viewport. El catálogo sugerido por el autocompletado no está abierto; no se puede concluir que sea obligatorio escoger una ocupación de la lista en vez de escribir libremente. [E1, E2]

No se identifica un indicador de cambios pendientes, guardando o guardado. No se registraron peticiones ni conexiones WebSocket durante la breve ventana pasiva; no establece ausencia de guardado previo, diferido o local. No se han observado guardado, cancelación, ordenación ni persistencia de una entrada laboral. [E1]

### Comparación con Education & Training

Referencia: [03-educacion.md](03-educacion.md), formulario inicial.

| Aspecto | Educación | Experiencia laboral |
| --- | --- | --- |
| Campo principal requerido | Título de cualificación, texto de una línea. | Ocupación, combobox editable con autocompletado de lista. |
| Organización | Entidad educativa. | Empleador. |
| Nivel | Selector EQF básico. | No se observa EQF. |
| Ubicación | City y Country en la misma fila en aquella captura. | City y Country apilados en esta captura. |
| Periodo | Inicio, fin y Ongoing. | Mismos controles y formato visible; ayuda específica de trabajo actual. |
| Descripción | Main subject / Occupational skills covered como detalle aún no abierto. | Main activities and responsibilities ya abierto como editor con formato. No se ha demostrado equivalencia de sus editores. |
| Detalles adicionales | Once opciones académicas. | Cuatro opciones sobre sector y contacto/enlaces de la organización. |
| Acciones y ayuda | Save/Cancel y Skip optional fields. | Mismo patrón expuesto. |
| Validación inicial | Error de título y Save deshabilitado. | Error de ocupación y Save deshabilitado. |

## 2. Inferencias

- El formulario parece reutilizar el patrón funcional de entrada con campo principal requerido, organización, ubicación, periodo, detalles progresivos y confirmación/cancelación. La similitud de UX no demuestra que use el mismo componente interno.
- Fechas con calendario, interruptor Ongoing, selector de país, botones de añadir detalles y pie Save/Cancel son candidatos a componentes reutilizables de nuestra aplicación. No se propone todavía una implementación.
- El autocompletado de ocupación podría ofrecer un catálogo de puestos, pero no se conoce su proveedor, alcance ni si limita los valores permitidos.
- Save deshabilitado junto al error de ocupación es compatible con bloqueo por formulario incompleto. No demuestra que la ocupación sea la única condición necesaria para guardar.
- Ongoing probablemente representa el empleo actual y podría afectar a End date; el comportamiento sigue sin observarse.
- El editor de responsabilidades permite estructurar texto sin necesidad de un campo separado por tarea. La representación de datos y la persistencia del formato no están establecidas.

## 3. Cuestiones pendientes

- Comprobar opciones del autocompletado, búsqueda, aceptación de texto libre y condiciones de validación de ocupación.
- Determinar obligatoriedad real y límites del empleador, ubicación, fechas y responsabilidades.
- Abrir calendarios, probar formatos parciales, fechas inválidas y rangos; comprobar Ongoing.
- Abrir los cuatro detalles adicionales para conocer tipos, listas, repetición, eliminación y validaciones.
- Verificar las herramientas del editor, límites, enlaces y tratamiento del formato al guardar y exportar.
- Observar guardado y cancelación con datos ficticios conocidos; comparar resumen y valores reabiertos.
- Comprobar múltiples entradas, acciones por entrada, eliminación y criterio de orden sin extrapolar las funciones de educación.
- Validar navegación por teclado y Skip optional fields, y si la cabecera puede contraerse durante la edición.
- Determinar persistencia y guardado automático mediante evidencia durante la interacción y pruebas posteriores autorizadas.

La inspección establece los controles presentes y las similitudes de UX. Los efectos de selectores, validación, guardado y cancelación quedan pendientes.

## Continuación de la investigación autónoma

Nueva inspección pasiva: `ev_e5e5014b9e319b039ccddc5c7763a9c3955f73bca3d42986fac265107b04d8bc`.

### 1. Hechos observados

El formulario laboral continúa abierto. Ocupación no expone contenido, aparece el error de obligatoriedad, Save está deshabilitado y Cancel habilitado. Siguen presentes el editor de responsabilidades y los cuatro controles de información adicional. Las dos entradas educativas anteriores permanecen expuestas en la misma página.

La herramienta interactiva disponible de REA, capture_browser_scenario, exige start_url y navega antes de ejecutar acciones en modo connect. No ofrece en su esquema una opción para omitir esa navegación. Las herramientas de inspección pasiva no hacen clic. No se ha ejecutado un escenario ni recargado esta pestaña.

### 2. Inferencias

Una navegación inicial podría perder datos temporales de la página, incluida información confirmada solo en memoria. No se ha validado la persistencia del CV. Por ello esta herramienta no permite continuar mediante clics sobre el estado actual sin introducir una navegación previa cuyo efecto es desconocido.

### 3. Cuestiones pendientes

Para continuar desde esta sesión sin recargar, se requiere intervención manual en los controles. Siguiente paso concreto: abrir Business / Sector, Organisation Email, Organisation Website y Link to file or video, dejando el formulario abierto para inspeccionar los campos añadidos. Después se continuará con Skills, Language Skills, Add new section, menús de sección y entrada, vista previa, plantilla y descarga, documentando cada bloque. Los campos añadidos, las transiciones y los flujos posteriores todavía no están observados.

## Pruebas activas en perfil independiente

Autorización posterior del usuario: REA lanza un navegador temporal y recrea los estados, sin navegar la pestaña original. Esto supera la limitación operativa de la fase manual, sin afirmar que connect permita omitir su navegación inicial.

### 1. Hechos observados

- `ev_d98aa2fb8e0953d9af478893ee4a8f2d3822bc3c49a6ba8e172331c7281569ac`: REA expandió Work experience, abrió la entrada, escribió Investigador UX de prueba como ocupación libre y Empresa ficticia REA como empleador, y pulsó Save. El resultado es un resumen con ambos textos y menú propio. No se introdujeron fechas, país, ciudad ni responsabilidades. Se prueba esa combinación de guardado, sin escoger una ocupación sugerida.
- `ev_c99f31452881f44f672c959fe90f6465121f4bc5ae4bf9fc6d8e2daa7f577b8d`: REA abrió los cuatro detalles adicionales. Business / Sector revela un selector y Department como texto; Organisation Email y Organisation Website son campos de texto; Link to file or video muestra entrada de enlace y Add deshabilitado mientras está vacío. No es una carga de archivo observada.
- En esa segunda prueba REA activó Ongoing: el interruptor quedó marcado y la entrada End date y su botón Choose date quedaron deshabilitados. Start date siguió disponible.
- Los menús se inspeccionaron activamente en `ev_4162c01bf8299f5c89a6ca4bc4a90200f54fb8dd21890ff1e1c8b6db698de075`: sección con añadir/mover/retirar; entrada con añadir otro puesto/editar/eliminar. Véase 11-menus-orden-visibilidad.md.

### 2. Inferencias

La ocupación acepta al menos el texto libre probado sin escoger una sugerencia. Ongoing representa un estado que afecta operativamente a la fecha final. El guardado del registro y su resumen siguen el patrón funcional ya observado en otras secciones; no se deduce un mecanismo interno común.

### 3. Cuestiones pendientes

Catálogo de sectores, validaciones de correo/web/enlace, límites, varias entradas laborales y orden cronológico. No se ha comprobado si al desactivar Ongoing se restaura una fecha final anterior. La operación de guardado de entrada no establece por sí sola persistencia duradera.
