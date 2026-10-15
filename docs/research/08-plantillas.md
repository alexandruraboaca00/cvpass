# 08 — Plantillas y presentación

**Actualización:** [20-plantillas-paginacion-y-rendimiento.md](20-plantillas-paginacion-y-rendimiento.md) prueba las seis plantillas con el mismo contenido largo, siete colores, tamaños y demás ajustes. [17](17-fechas-y-validaciones.md) completa los seis formatos de fecha. Las limitaciones siguientes corresponden a la inspección inicial.

**Comparación posterior:** [25 — Formatos y diseño de PDF](25-comparativa-visual-formatos-pdf.md) compara las seis salidas sobre el CV real, describe sus columnas/cabeceras y comprueba su reimportación. No se observó una opción llamada Simple en el catálogo actual.

## 1. Hechos observados

REA exploró activamente el editor beta en perfiles temporales independientes el 15 de octubre de 2026. Se inspeccionaron las opciones de los controles DOM, sin guardar HTML, scripts, imágenes o plantillas en el repositorio. Evidencia del catálogo y vista visual: ev_fcaf504711a2da3311acc8f990456a4179eb31b31eb4b12ab247db4a170e9d7a.

| Ajuste | Opciones presentes | Selección inicial de la prueba |
| --- | --- | --- |
| Template | Classic, Modern, Progress, Timeline, Accent, Elegant | Progress |
| Colour style | Default, Dark blue, Light blue, Dark green, Light green, Dark purple, Light purple | Default |
| Text size | S, M, L | M |
| Show logo on | No, First page only, Every page | First page only |
| Page number | Yes, No | No |

Los controles de idioma y formato de fecha permanecen en el DOM al abrir preview aunque no aparecen en la zona visible de ajustes. Se encontraron seis formatos de presentación de fecha: 23/04/2019, 23 Apr 2019, 23/4/2019, 23/4/19, 04/23/2019 y 2019/04/23.

REA seleccionó Classic y Dark green mediante sus selectores. Las opciones seleccionadas cambiaron; tras esperar renderizado, la representación accesible del contenido laboral se regeneró, conservando puesto y organización. Evidencia: ev_25a821ddea3ed13665b4b83ac4c6335b9973fe933075f3dcc94d4ff305bc2da5. No se conservaron diseños ni recursos para reproducirlos.

## 2. Inferencias

Los ajustes de presentación parecen separados de los datos del CV. Para nuestra aplicación conviene distinguir contenido y configuración de renderizado y crear plantillas propias. La regeneración observada no demuestra la tecnología ni el algoritmo de maquetación de Europass.

## 3. Cuestiones pendientes

Probar las otras plantillas y cada ajuste; confirmar efectos visuales del color con capturas comparables, persistencia, paginación, documentos largos, accesibilidad y equivalencia del PDF. Solo se han cambiado activamente Classic y Dark green; no se afirma que todas las combinaciones funcionen igual.
