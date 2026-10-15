# 15 — Formularios de las 14 secciones adicionales

Seguimiento: [16-ciclo-secciones-pdf.md](16-ciclo-secciones-pdf.md) confirma una entrada guardada por cada tipo y su exportación/reimportación; también completa la reedición de una certificación importada. Los pendientes de este inventario se actualizan mediante ese informe.

Inspección activa con REA del 15 de octubre de 2026. Sin implementación del producto ni extracción de código o recursos propietarios. Sesiones aisladas de Chrome, CV nuevo vacío en inglés, sin cuenta; los PDF y la pestaña del usuario no se modificaron.

## 1. Hechos observados

### Evidencia y alcance

- E1: `ev_5e3c197a5abd6553609181dfa889b1ebf5ed5bfe4d719d2f0e6215ebe7bfbb93`: apertura del catálogo e inventario de opciones.
- E2: `ev_ff9dff0db17d4a1058211013ffa38de7ab3d2d85a330fd136e264d90242bcf38`: formularios iniciales de Certifications, Projects y Publications.
- E3: `ev_b294adc2684b63713f52186f062221530f83035c5292f4abf864aaaf8c7b6cdf`: recorrido de los 14 tipos, apertura de campos opcionales, inspección de controles y cancelación. El límite de salida truncó el final: se recuperan completos los registros ampliados de 13 tipos y el inicial de Closing statement.
- E4: `ev_5889b2c179a6cd0927c9ab85030d71a2d34dbf25d27580f0ccc8278bf0b47f31`: seguimiento completo de Recommendations, Driving Licence personalizado y Closing statement. Resuelve los campos omitidos al final de E3 y el opcional Role.

Método: REA `capture_process_scenario`, ejecutando un guion de investigación Playwright en `/tmp/europass-pdf-research-b83cd0/`. Solo navegación y controles del DOM: crear sección, revelar opcionales, leer campos y pulsar Cancel. No se guardaron entradas. Los primeros intentos de localizar Add new section por nombre accesible fallaron; localizar el botón por texto visible permitió continuar. No implican que el botón estuviera deshabilitado.

### Inventario comparativo

«Obligatorio» significa marca y mensaje visibles, no validación exhaustiva del guardado. «Inicial» no significa obligatorio. Los opcionales de esta tabla se desplegaron y sus controles se inspeccionaron. [E2–E4]

| Tipo | Campos iniciales | Campos que se pueden añadir | Obligatoriedad visible |
| --- | --- | --- | --- |
| Certifications | Title; Issuing organisation; Issue date | Description; Mode of Learning; Link to file or video | Title |
| Projects | Title; From; To; Ongoing | Description; Link to file or video | Title |
| Publications | Title; Reference | Year; URL; Authors; Journal/Conference name; Volume, Issue, Pages; Publisher; Description; Link to file or video | Title |
| Conferences & Seminars | Title; Location; From; To | Description; Link to file or video | Title |
| Creative Works | Title; From; To; Ongoing | Description; Link to file or video | Title |
| Driving Licence | Select Driving Licences | La opción Add custom driving licence revela Others y texto libre | Sin marca obligatoria observada |
| Hobbies and Interests | Title; Description | Link to file or video | Title; descripción sin marca obligatoria |
| Honours and Awards | Title; Awarding institution; Date of the award | Description; Link to file or video | Title |
| Networks and Memberships | Title; Location; From; To; Ongoing | Description; Link to file or video | Title |
| Recommendations | Name; Email; Phone con prefijo; Description | Role; Link to file or video | Description; no marca obligatoria observada en Name, Email o Phone |
| Social and Political Activities | Title; Location; From; To; Ongoing | Description; Link to file or video | Title |
| Volunteering | Title; Location; From; To; Ongoing | Description; Link to file or video | Title |
| Other | Título de sección en modal; Title de entrada en formulario | Date, que revela From/To/Ongoing; Content; Link to file or video | Título de sección y título de entrada |
| Closing statement | Statement; Place; Date; Signature image con Upload | No se observaron botones para campos opcionales adicionales | Sin marcas obligatorias; Save habilitado con el formulario vacío |

### Tipos de controles y detalles

**Texto:** los títulos, organización, institución, ubicación, referencia bibliográfica, autores, revista, volumen/páginas, editorial, rol y datos de contacto aparecen como inputs de texto de una línea. Statement también es un input de una línea, no un editor enriquecido. Los campos Email y enlaces son `type=text` en el DOM inspeccionado; su nombre no demuestra una validación HTML nativa de email/URL.

**Descripción y contenido:** las descripciones desplegadas y Content de Other exponen áreas `contenteditable`. Hobbies and Interests y Recommendations ya muestran su descripción al abrir. Recommendations muestra «Description (required)» y «This field is mandatory» con el editor vacío. No se probaron las herramientas de formato durante este recorrido.

**Fechas:** inputs de texto con placeholder `DD-MM-YYYY` y botón Choose date. Hay selectores de mes y año del calendario en el DOM; sus registros no se interpretan como campos adicionales del CV. Algunos controles de fecha exponen dos inputs con el mismo id: no son dos fechas semánticas distintas. No se introdujeron fechas ni se verificaron rangos inválidos. Conferences & Seminars no mostró Ongoing; Projects, Creative Works, Networks and Memberships, Social and Political Activities, Volunteering y Other sí. No se accionó Ongoing en esta prueba.

**Mode of Learning:** select de Certifications con Select y siete opciones: Work based, Project based, Presential, Online, Hybrid, Blended y Research-Lab based.

**Publications:** Reference es un campo libre cuyo placeholder menciona autoría, año, título, revista, volumen y páginas. Coexiste con campos bibliográficos individuales opcionales; no se comprobó sincronización entre ellos. Year es un select que en este estado contiene años de 2029 a 1927, además del vacío. URL es un input separado del campo Link to file or video. Aunque su id es `doi`, la etiqueta visible es URL: no se infiere soporte específico o validación de DOI.

**Enlaces:** al revelar Link to file or video aparece un input con ayuda de enlace válido y un botón Add, inicialmente deshabilitado mientras el input está vacío. El control pide una URL: no se observó subida de un archivo en esos campos. No se añadieron dos enlaces, por lo que su cardinalidad efectiva sigue pendiente.

**Recommendations:** Phone consta de select de prefijo internacional y un input de número. Role revela un input con placeholder «e.g: Partner». Name, Email, Phone y Role no se deben confundir con un título genérico de entrada.

**Driving Licence:** catálogo AM, A1, A2, A, B1, B, BE, C1, C1E, C, CE, D1, D1E, D, DE y Add custom driving licence. Elegir esta última revela Others, un input «Add here your driving licence», Delete y Add. Add está deshabilitado con texto vacío, pero Save está habilitado tras seleccionar custom, incluso con el texto libre vacío. No se pulsó Save: habilitado no demuestra que permita confirmar un valor vacío. El control Add se anuncia como Add additional licence; no se ha validado guardar varias categorías.

**Closing statement:** Upload anuncia subida de firma al CV, con límite visible de 1 MB. No se subió ninguna imagen ni se verificaron formatos, dimensiones o tratamiento de la firma. Statement, Place y Date están vacíos y Save aparece habilitado.

### Creación, cancelación y validación inicial

Crear cada sección abre su formulario dentro del editor. Los tipos de contenido con Title muestran de inmediato el error de obligatoriedad con el título vacío y Save deshabilitado. Los inputs inspeccionados declaran `required=false` incluso cuando el texto visible exige el campo: para reproducir el comportamiento no basta con copiar atributos HTML.

Cada formulario ofrece Cancel y Save. Después de cancelar, la sección recién creada permanece vacía y muestra «You have not added any…»; se pudo abrir Add new section y continuar con otro tipo. Por tanto, cancelar la entrada no elimina automáticamente el contenedor creado. Las secciones anteriores permanecieron en el orden de creación durante este recorrido.

Mientras un formulario está abierto, Save and exit global aparece deshabilitado en las capturas, aunque Download y Exit without saving aparecen habilitados. No se accionaron para comprobar si aceptarían o descartarían un borrador.

## 2. Inferencias para nuestra aplicación

Hay patrones funcionales aprovechables: título y descripción; periodo con estado en curso; entidad y fecha de concesión; referencia bibliográfica; contacto de recomendante; selección de categorías; y declaración final con firma. Son familias de UX observadas, no una afirmación sobre componentes o arquitectura internos de Europass.

Un formulario genérico de título y descripción sería insuficiente. La representación propia debe poder conservar los campos bibliográficos por separado, fechas únicas y periodos, modo de aprendizaje, contacto/rol del recomendante, categorías de permiso y firma. No se ha fijado todavía un esquema de implementación.

Conviene distinguir creación del contenedor, borrador de entrada y entrada confirmada, y decidir explícitamente si nuestra herramienta conservará una sección vacía tras cancelar. Las diferencias de obligatoriedad de Recommendations y Closing statement impiden aplicar la regla «todas las entradas requieren título».

## 3. Cuestiones pendientes

- Guardar entradas ficticias por familia y comprobar resumen, edición, eliminación y número de entradas admitidas.
- Exportar un CV de prueba con estas secciones, examinar su representación en PDF/XML y reimportarlo para detectar pérdidas.
- Validar obligatoriedad efectiva: título solo, fechas vacías, contacto sin descripción, declaración final vacía y permiso personalizado vacío.
- Comprobar fechas parciales, inicio posterior al fin, Ongoing y formato de fecha en salida.
- Añadir varios enlaces, permisos y entradas; comprobar límites, duplicados y orden.
- Determinar si References se genera o sincroniza con los campos bibliográficos individuales.
- Validar firma: formatos, límite de 1 MB, retirada y tamaño en PDF.
- Verificar secciones repetidas del mismo tipo, renombrado, visibilidad y plantillas. No extrapolar a estos tipos las pruebas previas de educación o experiencia.

La cobertura actual es un inventario de formularios y campos desplegables de los 14 tipos. No es una validación completa de guardado, exportación o persistencia de cada sección.
