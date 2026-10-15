# 16 — Guardado, exportación, importación y reedición de secciones

**Actualización de pendientes:** los informes [17](17-fechas-y-validaciones.md), [18](18-multiples-orden-y-visibilidad.md), [19](19-fotografia-firma-y-texto-enriquecido.md), [20](20-plantillas-paginacion-y-rendimiento.md), [21](21-importacion-generica-ocr-y-compatibilidad.md) y [22](22-borradores-salida-y-persistencia.md) completan los recorridos adicionales de esta investigación. [23](23-cierre-investigacion-y-criterios.md) distingue lo comprobado de los límites externos y la construcción futura.

## 1. Hechos observados

### Método y evidencias

Investigación activa con REA, 15 de octubre de 2026. Navegadores aislados, sin cuenta ni cambios en la pestaña o archivos originales del usuario. CV ficticio «Persona Ficticia REA». No se implementó la aplicación ni se extrajeron recursos para reutilizarlos.

| Evidencia REA | Prueba |
| --- | --- |
| `ev_271fa1eaac5d4339e16115436d1d17fb74a976e54e88bc5910c177e2bda2f453` | Primer recorrido: guardado y reimportación de recomendación, permiso B y declaración final; resto de entradas canceladas. |
| `ev_31aaae47f56c1a3cffa9816177da6597203c0a3cbd44698bfc9cd37e1413efa0` | Recorrido corregido: guardado de los 14 tipos, exportación y primera reimportación. |
| `ev_2f2297c8810649b2b6c5fe73f8d4de7027e7bfa32160205123e5c736c2248ede` | Edición confirmada de certificado importado; descarga posterior agotó 60 segundos. |
| `ev_e9898100437937236d53455fb8990608f3261f4d2530055578a3949cb02592f2` | Repetición de edición, espera de 3,5 segundos tras cambiar nombre del documento y descarga correcta. |
| `ev_12516f6cdad7d8274f49caa35ff71c578230933ae3fb003ca370e3a71ab67f7f` | Reimportación del PDF editado: título modificado recuperado. |

Los primeros intentos tenían problemas del guion: una expresión de localización incorrecta y consultas a campos antes de estabilizarse el formulario. Se corrigieron la localización, la espera del campo de título y la salida del campo con Tab. Los guardados deshabilitados de esos intentos no prueban un fallo de validación de Europass.

### Entradas confirmadas

Se guardó una entrada por tipo, incluyendo Certifications, Projects, Publications, Conferences & Seminars, Creative Works, Hobbies and Interests, Honours and Awards, Networks and Memberships, Recommendations, Social and Political Activities, Volunteering, Other, Driving Licence y Closing statement. En los 14 casos Save cerró el formulario y el resumen apareció en el editor. Tras exportar e importar en otro contexto del navegador, reaparecieron las 14 secciones con contenido.

Datos de prueba: título único por tipo, entidad/ubicación cuando existían, descripción con acentos y un enlace `https://example.invalid/rea-…` por cada tipo con ese campo. Certificación: modalidad Online. Publicación: año 2025, referencia libre, autores, revista, volumen/páginas, editorial y URL adicional. Recomendación: nombre, correo ficticio, rol y descripción. Permiso B. Declaración: texto y lugar. Other: nombre de sección y título de entrada distintos.

No se rellenaron fechas, teléfonos ni firma. Los formularios con fechas permitieron guardar esas entradas con las fechas vacías. Esto comprueba ese caso concreto; no valida fechas mal formadas ni todos los campos vacíos.

**Límite del texto de prueba:** varias descripciones guardadas incluyen texto de ejemplo previo del editor seguido del marcador REA. Se conservó en la exportación y reimportación. El guion no aisló por qué no se eliminó ese texto; no se presenta como prueba de que Europass añada ayudas a cualquier descripción real ni como un resultado de limpieza correcto.

### PDF y XML exportados

Archivo de investigación temporal: `/tmp/europass-pdf-research-b83cd0/all-sections.pdf`.

- SHA-256: `aa640f39dde7519240cd6827cf8e95beb2c42fe2b3d022014d3ae4a06792535c`.
- PDF 1.7, 63.577 bytes, dos páginas A4, texto extraíble, sin cifrado, campos de formulario ni JavaScript; no etiquetado como accesible.
- Ajustes del XML: Template1, color Default, tamaño Medium, logo FirstPage y numeración false.
- Un `attachment.xml` contiene los datos editables. Se inspeccionó con `pdfdetach` y ElementTree; se extrajo el texto y se renderizó/consultó la primera página con Poppler. Los recursos visuales no se copiaron al proyecto.

Mapeos presentes en este XML concreto:

| Función de UI | Nodo observado |
| --- | --- |
| Certifications | `CandidateProfile/CourseCertifications/CourseCertification` |
| Honours and Awards | `CandidateProfile/Certifications/Certification` |
| Publications | `PublicationHistory/Publication` |
| Recommendations | `EmploymentReferences` |
| Other | `Others` |
| Declaración final | `RenderingInformation/ClosingStatement` |

No confundir el nodo Certifications con el tipo de UI homónimo: en este archivo representa el premio, mientras la certificación formativa está en CourseCertifications.

La publicación conserva tanto el enlace añadido como su URL adicional en `DOI/Link`; el título es un enlace en el PDF renderizado. Que ambos sobrevivan no demuestra sincronización entre Reference y los campos individuales: se rellenaron con marcadores diferentes y se conservaron por separado. La modalidad de aprendizaje aparece como `online` en XML y Online en el PDF. Los enlaces y los acentos sobreviven en los valores inspeccionados.

### Orden y secciones vacías

En el primer recorrido se cancelaron varias entradas, dejando sus secciones vacías en el editor. Sus títulos seguían presentes en `RenderingInformation/Design/SectionsOrder`, pero esas secciones no reaparecieron en la UI importada. Es distinto de perder una entrada confirmada: ninguna de esas entradas se había guardado.

En el recorrido completo, Other se creó antes de Driving Licence. El PDF exportado y su SectionsOrder colocaban la sección personalizada antes del permiso. Al reimportar, la UI y su vista previa mostraban Driving Licence antes de Other. La reexportación posterior confirma ese orden modificado en el XML. No se ejecutaron acciones manuales de reordenación.

### Reedición del PDF importado

Se importó `all-sections.pdf`, se abrió el menú de la entrada Certifications (Edit Certifications / Delete Certifications), se cambió su título de «REA certifications» a «REA certifications EDITADO» y se pulsó Save. El formulario cerró y el título apareció en el encabezado del resumen.

La descarga inmediata posterior agotó su espera. La repetición con una espera de 3,5 segundos después del cambio de nombre del documento descargó correctamente. Esto no establece un umbral necesario ni identifica la causa del primer timeout.

PDF editado: `/tmp/europass-pdf-research-b83cd0/all-sections-edited.pdf`, SHA-256 `691fb4dfebca4180728eee1345f7ce4e226e028dcd3976e31cd4e026e19f7264`.

Comparación XML por rutas, atributos y textos de hojas, ignorando sangrado:

- Dentro de CandidateProfile solo cambia el título de CourseCertification esperado.
- Fuera de CandidateProfile cambia SectionsOrder: desaparecen las cuatro secciones principales vacías del CV de prueba y Driving Licence pasa delante de Other. Las diferencias posicionales del XML no representan 29 cambios de contenido independientes.
- Los demás valores comparados, incluidas descripciones, enlaces, modalidad, bibliografía, contacto, permiso y declaración, no cambian.

Se importó el PDF editado en un contexto nuevo. El encabezado «REA certifications EDITADO» reaparece, junto a las demás secciones. Queda demostrado este ciclo completo: crear → guardar → exportar → importar → editar → guardar → exportar → importar.

## 2. Inferencias y consecuencias para nuestra herramienta

La recuperación editable de un PDF estructurado es viable con estos ejemplos. El XML es la fuente de datos observada; los campos no son controles de formulario sobre el PDF. La arquitectura de producto todavía no se ha implementado.

Nuestra aplicación debería preservar por separado datos, orden y preferencias de visibilidad, y comprobar los tres durante una reimportación. Recuperar todos los títulos no garantiza que el documento mantenga su presentación. Los contenedores vacíos necesitan una decisión explícita: conservarlos como parte del proyecto editable o informar de su omisión.

La nomenclatura de compatibilidad necesita mapeo explícito por significado, no por coincidencia de nombres. También conviene separar vista previa lista para exportar de una vista todavía actualizándose; los timeouts intermitentes justifican medir ese flujo, sin atribuir una causa interna no observada.

## 3. Cuestiones pendientes

- Varias entradas por cada familia adicional: alta, edición, borrado y reordenación, y dos enlaces por entrada.
- Fechas válidas, inválidas y parciales; Ongoing; número y permiso personalizados; recomendación solo con descripción.
- Subida y retirada de firma ficticia, formatos permitidos y límites; revisar firma y fotografía en exportación/reimportación.
- Aislar sustitución del texto inicial del editor enriquecido y comprobar listas, enlaces y formato sin texto de ejemplo residual.
- Comparar las seis plantillas con el mismo contenido y con descripciones largas. La primera página renderizada permite comprobar jerarquía y enlaces, pero no valida exhaustivamente paginación ni todas las páginas/plantillas.
- Repetir la reedición sobre el PDF real del usuario: el ciclo ficticio sí está confirmado; la antigua prueba de educación importada sigue sin confirmación de guardado.
- PDF sin XML y PDF escaneados: definir y validar extracción asistida propia posteriormente. Europass ya rechazó el control sin XML, según 12-importacion-pdf-local.md.
- Rendimiento y recuperación tras recarga/cierre con evidencia controlada. No se ha medido un objetivo de latencia ni probado persistencia de todos estos tipos fuera del ciclo de archivo.

No se considera completa toda la investigación: queda demostrada la viabilidad funcional del ciclo de PDF estructurado con estas entradas, con diferencias concretas de orden documentadas.
