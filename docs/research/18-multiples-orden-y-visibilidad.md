# 18 — Múltiples entradas, orden, eliminación y visibilidad

## 1. Hechos observados

Pruebas activas REA sobre CV ficticio, 15 de octubre de 2026.

| Evidencia | Cobertura |
| --- | --- |
| `ev_28067ba7c957f2f95094fe53cbc5f8eca113cd7023e2ec30931e3136009f731f` | Segundas entradas, tres enlaces, orden de proyectos y reimportación. |
| `ev_c202ed729ef32fd7ff17f25a43ccb3f78b739a834471f72be8d202355f3642e2` | Segunda entrada de Other, cancelar/confirmar eliminación y retirar sección. |
| `ev_0438f18f0a7ad694d6db3c25e42250494f14bf25b1cf814c8f372b06b9a6c3a7` | Dos secciones personalizadas independientes y ocultación de sección vacía. |

### Cardinalidad

Se guardaron y reimportaron dos registros en cada una de estas once familias: Certifications, Projects, Publications, Conferences & Seminars, Creative Works, Hobbies and Interests, Honours and Awards, Networks and Memberships, Recommendations, Social and Political Activities y Volunteering. La inspección XML confirma dos elementos por contenedor, no solo repetición de texto en preview.

La primera tentativa de una segunda entrada de Other no cerró el formulario. Una prueba aislada con título y contenido ficticios sí cerró Save y exportó dos elementos Other dentro de la misma sección. También se creó una segunda sección Other con nombre distinto; ambas cabeceras y la entrada nueva reaparecieron al importar. Por tanto, hay dos cardinalidades: secciones personalizadas y entradas de cada sección.

En un CV con todos esos tipos ya representados, Add new section ofrece las cuatro secciones principales ausentes y Other. Tras retirar Projects, Projects vuelve al catálogo. Other permanece disponible aunque ya exista una sección personalizada. En este estado no se ofrecía crear otra sección estándar del mismo tipo; se añaden registros mediante su menú.

### Enlaces

El certificado original pasó de uno a tres enlaces válidos. Se guardaron en el XML exportado. Un valor sin formato de URL bloquea el guardado de la entrada y Add. La fila vacía que aparece al pulsar Add es un estado de edición distinto de un enlace confirmado.

### Orden

El primer proyecto tiene fechas 15–16 de junio de 2025. El segundo, creado después, tiene fechas 1–2 de enero de 2026. Inicialmente aparecen en orden de creación: primero el de 2025. No se aplica en esta prueba un orden descendente automático por fecha.

Con dos entradas, el menú de la segunda incluye Move up, además de Edit Projects y Delete Projects. Al pulsar Move up se invierte el orden. Exportar e importar conserva el proyecto de 2026 delante del de 2025. La presencia de movimientos en entradas múltiples queda comprobada; las antiguas capturas con una sola entrada no permitían concluirlo.

El recorrido no encontró elementos DOM con `draggable=true` ni botones etiquetados como drag/sort/reorder. Esto acota la búsqueda, no descarta arrastre mediante otros eventos o controles.

### Eliminar y ocultar

- Delete Projects abre una confirmación que identifica el título de la entrada. Cancel conserva ambas; Delete elimina solo la seleccionada.
- Remove section from CV abre una confirmación de sección y muestra un registro restante. Confirmar retira la sección. El XML exportado después no contiene Project; Other conserva sus dos entradas.
- Hide this section sobre una sección Work experience vacía también abre Confirm remove section. Tras confirmar Remove section, desaparece su cabecera. No se observó un interruptor reversible de visibilidad que mantuviera esa sección vacía en la UI.
- La diferencia previa de orden entre Driving Licence y Other al reimportar sigue documentada en [16](16-ciclo-secciones-pdf.md). El movimiento manual de proyectos no corrige ni explica ese caso distinto.

## 2. Inferencias y criterios propios

El modelo propio necesita identificadores y órdenes estables para secciones y entradas, independientes de las fechas y del título traducible. La sección personalizada exige conservar su nombre y una lista de entradas. Un único bloque genérico de texto no representa estos comportamientos.

Conviene separar explícitamente ocultar para exportar, eliminar una entrada y retirar una sección. Los botones observados de Europass no demuestran que haya un archivo de datos ocultos recuperable sin cuenta. Nuestra aplicación debería definir y comunicar esa diferencia.

## 3. Cuestiones pendientes

No se ha probado un límite máximo de registros, nombres duplicados de secciones personalizadas ni todas las combinaciones de movimiento entre tipos. Tampoco se afirma que Remove section borre datos de una cuenta Europass: las pruebas son anónimas y solo verifican el CV y el PDF resultantes.
