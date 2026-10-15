# 20 — Plantillas, paginación, ajustes y tiempos observados

Ampliación: [25 — Comparativa visual](25-comparativa-visual-formatos-pdf.md) añade el CV real en las seis plantillas, inspección de páginas, lectura y reimportación. Sus cifras de páginas corresponden a otro fixture y no sustituyen las del control largo de este informe.

## 1. Hechos observados

REA, 15 de octubre de 2026. Evidencia principal de contenido largo: `ev_c5beaffcbad318fe20dc7b78d1c4b845b588fb19f223c26742d5424ea7423201`. Ajustes de presentación: `ev_c28c75c9e373a6fb88cc67cae94c11a632375a6fe3285c126488f502c642377b`. Formatos de fecha: `ev_a233dc277178dee352b77918983279491c326f2855c12150bea137940b282651`.

### Mismo contenido en seis plantillas

El CV contiene los 14 tipos adicionales y una firma ficticia. Tres descripciones —Projects, Creative Works y Volunteering— se sustituyeron por textos de 3.509, 3.525 y 3.525 caracteres visibles. Cada una contiene 16 párrafos identificables, negrita y cursiva. Las tres se guardaron antes de exportar.

La primera tentativa de 75 párrafos en una sola descripción superó 4.000 caracteres y no se guardó. Sus exportaciones no prueban contenido largo. Los datos siguientes corresponden a la repetición corregida de 16 párrafos por descripción.

| Plantilla visible | Valor XML observado | Páginas A4 | Marcadores en texto PDF | Marcadores en XML |
| --- | --- | --- | --- | --- |
| Classic | DynamicTemplate1 | 4 | 48 | 48 |
| Modern | DynamicTemplate2 | 6 | 48 | 48 |
| Progress | Template1 | 5 | 48 | 48 |
| Timeline | Template2 | 5 | 48 | 48 |
| Accent | Template3 | 5 | 48 | 48 |
| Elegant | Template4 | 5 | 48 | 48 |

El hash del subárbol CandidateProfile serializado con ElementTree coincide en las seis exportaciones. Es evidencia de conservación de esos datos al cambiar plantilla; no de equivalencia visual. Al reimportar Accent, la descripción de Projects conserva sus 3.509 caracteres, sus 16 marcadores, strong y em.

Se renderizaron y consultaron Modern página 1, Classic página 4, Progress página 2 y Accent página 5. Además se inspeccionaron coordenadas de palabras de todas las páginas de los seis PDF mediante `pdftotext -bbox-layout`. No se detectan palabras fuera de los límites de página con esa comprobación. No es una prueba automática de ausencia de solapamientos ni de orden de lectura correcto.

### Problemas de cortes observados

- Accent deja VOLUNTEERING al final de la página 3 y empieza sus datos en la 4. La sección personalizada empieza al final de la 4 y su contenido sigue en la 5.
- La página 5 de Accent contiene solo 21 palabras extraídas, enlaces y la firma, con mucho espacio vacío. La imagen renderizada confirma esta distribución.
- Progress reserva una quinta página para la declaración final, lugar y nombre —9 palabras extraídas— además de la firma.
- Modern usa una columna lateral para el permiso de conducir y otra para el contenido principal. Se generan seis páginas y se cortan párrafos entre páginas.
- Elegant y Timeline también parten algunos párrafos. Que todos los marcadores estén presentes no garantiza que los bloques estén agrupados de forma conveniente.

Los PDF y las imágenes temporales se mantienen en `/tmp/europass-cierre-investigacion/`; no se incorporaron plantillas, logos, fuentes o capturas al código del proyecto.

### Ajustes comprobados

Se seleccionaron y exportaron las siete opciones de color: Default, Dark blue, Light blue, Dark green, Light green, Dark purple y Light purple. Las siete imágenes renderizadas de primera página tienen hashes distintos; el contenido CandidateProfile coincide entre ellas. Cambia la presentación, no esos datos.

Se probaron tamaños M en la matriz anterior y S/L en dos exportaciones adicionales. Con el CV corto, S produjo dos páginas y L tres. También se exportó sin logo y con logo en todas las páginas, y se activó numeración. El XML registra Small/Large, None/AllPages y PageNumbers=true; la reimportación de la variante L conserva tamaño, color, logo y numeración en los selectores.

La variante L se exportó con fechas yyyy/MM/dd y texto visible 2025/06/15–2025/06/16. Al reimportar, el selector de fechas vuelve a dd/MM/yyyy. El XML inspeccionado no contiene una preferencia de formato de fecha equivalente a los otros ajustes. Ver [17](17-fechas-y-validaciones.md) para los seis formatos probados.

### Tiempos y conexión

En las seis descargas largas, el tiempo entre pulsar Download y obtener el archivo fue de aproximadamente 1,0–1,3 segundos. El recorrido por plantilla empleó además una espera de renderizado y una espera tras asignar nombre, y duró aproximadamente 6,3–6,6 segundos. Los tiempos de importación observados incluyen navegación, carga de interfaz, subida y una espera explícita: no son mediciones aisladas del parser.

Son muestras de Chrome headless en Linux x64, viewport 1280 × 1000, con el estado de caché y red de esas ejecuciones. No se ejecutó un benchmark estadístico ni se garantizan esos tiempos en el equipo del usuario. Hubo timeouts de descarga en pruebas anteriores.

Evidencia de desconexión: `ev_2dc7f35a15d5440effbc99bc6d761c491162badbc8e5832c44088717547cf1c9`. Tras importar y cargar la interfaz, se bloqueó la red del contexto de navegador. Se pudo cambiar un título y guardar la entrada, pero Download no produjo un archivo en 35 segundos. No demuestra que toda exportación offline sea imposible ni identifica una petición concreta como causa. Sí impide dar por validado un flujo completo sin conexión de Europass.

## 2. Inferencias y criterios propios

La salida requiere un motor de paginación propio que conserve datos y controle agrupación de títulos con contenido, firma, viudas/huérfanas y espacio residual. Reproducir la clase de documento y sus jerarquías no obliga a reproducir esos cortes.

Nuestra aplicación debería guardar conjuntamente las preferencias de presentación, incluido formato de fecha, y poder arrancar, editar y exportar sin depender de Europass. La prueba con el sitio precargado no demuestra esa independencia: habrá que verificarla sobre la implementación propia.

La matriz permite definir pruebas de regresión con datos idénticos para todas las plantillas. No selecciona todavía una biblioteca PDF ni autoriza copiar sus diseños o recursos.

## 3. Cuestiones pendientes

No se han probado todas las combinaciones de seis plantillas, siete colores, tres tamaños, logos, idiomas y numeración. La matriz cubre cada opción principal y documentos largos, sin presentarse como exploración exhaustiva del producto.

Quedan para la aplicación propia las mediciones repetidas en equipos conocidos, el etiquetado accesible, la navegación por lector de pantalla y una comparación visual de sus plantillas originales frente a los requisitos. Los PDF inspeccionados no aparecen etiquetados como accesibles en pdfinfo.
