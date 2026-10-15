# 23 — Estado de la investigación y criterios para continuar

Fecha: 15 de octubre de 2026. Alcance: creador de CV de Europass, UI y comportamiento con REA, PDF aportados por el usuario y archivos ficticios de prueba. Sin implementación de la aplicación propia. La investigación no copia código, plantillas, logos ni fuentes al proyecto.

Ampliación del mismo día: [24 — Save and exit y editor estándar](24-save-and-exit-y-editor-estandar.md), [25 — Comparativa visual de PDF](25-comparativa-visual-formatos-pdf.md), [26 — Compatibilidad ampliada](26-compatibilidad-ampliada-pdf.md), [27 — Prueba real de 48 horas](27-caducidad-real-48-horas.md) y [28 — Mejoras y aceptación](28-mejoras-necesarias-y-aceptacion.md). Estos informes actualizan los límites históricos sin convertir una prueba pendiente en un resultado observado.

Seguimiento: [29 — Simulación de caducidad y recuperación](29-simulacion-caducidad-y-recuperacion.md) completa pruebas aceleradas de reloj/temporizadores y respuestas de recurso no disponible, manteniendo separada la duración real.

**Cierre de alcance acordado:** el usuario descarta esperar la caducidad real y prioriza descargar, importar y volver a editar CV locales. Se cerraron los dos contextos de esa prueba y se mantuvo la pestaña original. No hace falta conservar la conexión para continuar el proyecto. La investigación funcional es suficiente para diseñar la primera versión; la aplicación propia todavía no está implementada.

## 1. Hechos observados y cobertura

| Bloque solicitado | Estado | Evidencia/documentación |
| --- | --- | --- |
| Estructura del editor y formularios principales | Inspeccionados; se mantienen los límites específicos de cada captura histórica. | 01 a 06 |
| Campos de los 14 tipos adicionales | Inventario inicial y opcionales inspeccionados. | 15 |
| Guardar una entrada por cada tipo | Completado, incluyendo exportación e importación. | 16 |
| Dos entradas por familia repetible | Completado en las doce familias de contenido adicional, incluida Other. | 18 |
| Varias secciones personalizadas | Dos secciones con nombres distintos recuperadas del PDF. | 18 |
| Varias URL y validación | Tres enlaces en certificado; valor inválido bloquea Add/Save. | 17 y 18 |
| Orden y eliminación | Move up de entrada conservado al importar; cancelar/confirmar borrado y retirar sección comprobados. | 18 |
| Ocultar sección vacía | Solicita confirmar retirada; desaparece al confirmar. | 18 |
| Fechas y validaciones | Periodo válido/invertido, texto parcial/imposible, Ongoing, título vacío/espacios y límite de descripción. | 17 |
| Permisos de conducir | B, A1 y uno personalizado; validez A1 2020-01-01–2030-01-01 conservada tras exportar/importar. | 19; evidencia adicional abajo |
| Foto y firma | PNG/JPG, límites de firma, exportación/importación y retirada comprobados. | 19 |
| Formato de texto | Sustitución limpia, negrita, cursiva y dos viñetas comprobadas. | 19 y 20 |
| Seis plantillas | Control largo: 48 párrafos conservados, cuatro a seis páginas. CV real: dos páginas en Classic/Modern/Progress/Timeline y tres en Accent/Elegant. Seis reimportaciones aceptadas. | 20 y 25 |
| Ajustes de presentación | S/M/L, siete colores, logo y numeración; seis formatos de fecha exportados. | 17 y 20 |
| PDF original del usuario editable | Educación modificada en copia, guardada, exportada e importada; originales intactos. | 21 |
| PDF inglés | Importación aceptada; diferencias manuales separadas del selector de idioma. | 14 y 21 |
| PDF sin XML, escaneado, corrupto y grande | Rechazo/validación de Europass comprobados; extracción local y OCR de ejemplo ficticio. | 21 |
| Compatibilidad ampliada | 25 archivos nuevos y variantes: 12 aceptados y 13 rechazados. Cabeceras 1.4/1.7/2.0, columnas, Unicode, AcroForm, cifrado, codificaciones y adjuntos. Corpus controlado, no 25 generadores distintos. | 26 |
| Recarga y salida | Recuperación del último contenido confirmado tras recarga; cancelación/confirmación de salida probadas. | 22 |
| Cierre completo y expiración | No se recuperó tras reiniciar. Espera real de 48 h descartada por el usuario; dos contextos de control cerrados. Caducidad no observada y fuera del alcance necesario. | 22 y 27 |
| Simulación de caducidad | +49 h de Date y temporizadores mantienen la recuperación. Se observó GET/PUT remoto. Respuestas locales 404/410 ocultan el enlace; volver a 200 real recupera el CV. No prueba TTL real. | 29 |
| Save and exit y finalización | Beta sigue deshabilitado tras nombre, Save y Download. Estándar: nombre habilita Download; descargar habilita Finish; Finish muestra invitación de registro. | 24 |
| Funcionamiento sin conexión | Edición/Save tras precarga comprobados; descarga no obtenida en 35 s. Arranque y ciclo offline completo sin validar. | 20 |

### Hallazgos adicionales de permisos

Evidencia `ev_0c4e057e2455d6f1bb456ab0a62e57d1ab56871227df76fbfe2b37a732a37939`: Dates abre un diálogo de validez por permiso con seis selectores —día, mes, año para Valid from y Valid until— y Save/Cancel propios, seguido del Save del formulario principal. Se guardó el periodo 2020-01-01–2030-01-01 de A1 y se recuperaron los seis valores al reimportar.

El XML usa `Licenses/License/LicenseTypeCode` y `FreeFormPeriod/StartDate/EndDate` con namespaces distintos. El nombre personalizado también se conserva. El primer guion dejó una fila de permiso vacía al pulsar Add; quedó un LicenseTypeCode vacío en esa exportación. La prueba final retiró esa fila y exportó tres permisos. No debe interpretarse toda fila de edición como un permiso válido confirmado.

### Registro y reproducibilidad

Los guiones propios están en [scenarios](scenarios/) y sus ejecuciones relevantes en [evidencias-cierre.json](scenarios/evidencias-cierre.json). [metricas-cierre.json](scenarios/metricas-cierre.json) conserva metadatos y hashes de los artefactos, sin incluir las imágenes o el contenido personal del PDF real. REA aporta los identificadores de evidencia; los análisis XML, texto, coordenadas y OCR se realizaron con herramientas locales.

Los guiones son instrumentos de investigación, no componentes del producto. Sus rutas y fixtures temporales se explican en [README](scenarios/README.md). Los fallos de localización, formularios colapsados, diálogos pendientes y salidas truncadas no se han convertido en afirmaciones de funcionamiento del sitio. Las pruebas posteriores corregidas son las que sustentan cada resultado confirmado.

La ampliación queda registrada en [evidencias-seguimiento.json](scenarios/evidencias-seguimiento.json) y [metricas-seguimiento.json](scenarios/metricas-seguimiento.json). Los dos PDF originales mantienen sus hashes de referencia. La pestaña original permanece ajena a las pruebas. Los contextos de caducidad, creados para investigar, ya están cerrados; véase [registro de cierre](scenarios/caducidad-48h/cierre.json).

## 2. Inferencias y requisitos propuestos para nuestra herramienta

La evidencia es suficiente para pasar a especificación y diseño de una primera versión centrada en PDF editable e importación, sin prolongar indefinidamente la inspección de Europass. Es una valoración de alcance, no una afirmación de cobertura exhaustiva.

| Prioridad | Requisito funcional propuesto | Criterio de aceptación futuro |
| --- | --- | --- |
| Principal | Abrir PDF Europass con datos incrustados y editarlo localmente. | Recuperar entradas, contactos, idiomas, enlaces y fotos; cambiar un campo y mantener los demás valores. |
| Principal | Exportar PDF propio con datos editables versionados. | Importar el PDF propio y recuperar el proyecto sin Europass, incluidos orden y preferencias. |
| Principal | Proyecto local durable. | Cerrar y reabrir aplicación/equipo sin perder el último estado confirmado; recuperación de borrador comunicada de forma explícita. |
| Principal | Original y traducciones independientes. | Cambiar idioma de UI o salida sin sobrescribir textos; revisar traducciones y conservar títulos originales de certificados. |
| Principal | PDF legible y paginación cuidada. | Títulos unidos a su primer contenido, firma agrupada, márgenes consistentes y pruebas con documentos largos. |
| Alta | Importación asistida de PDF genérico. | Extraer propuestas de datos, indicar dudas y permitir corrección antes de crear un CV nuevo. |
| Alta | OCR de escaneados. | Presentar texto y dudas de reconocimiento; no prometer recuperación fiel de la maquetación. |
| Alta | Modelo completo de secciones y entradas. | Varias entradas, secciones personalizadas, enlaces y permisos; orden independiente de fechas y textos traducidos. |
| Alta | Validación sin pérdida silenciosa. | Rechazar títulos en blanco; conservar textos de fecha inválidos hasta corrección; hacer explícita la precisión de fecha admitida. |
| Alta | Rendimiento y autonomía. | Medir arranque, edición, preview, importación/exportación y memoria en equipos conocidos; verificar funcionamiento sin servicios de Europass. |

No se ha elegido una biblioteca PDF, stack, formato propio definitivo ni arquitectura de implementación. Esas decisiones deben evaluarse con pruebas propias autorizadas en la fase de construcción, especialmente paginación, recuperación de datos y rendimiento.

Los requisitos se concretan por comportamiento y criterio de aceptación en [28 — Mejoras necesarias](28-mejoras-necesarias-y-aceptacion.md), incluyendo originales/traducciones por campo, importación asistida, recuperación local y salida sin registro.

## 3. Lo que queda por hacer

### Construcción y validación de la aplicación propia

Definir el modelo y formato versionado, diseñar componentes y plantillas originales, construir importador y exportador, y ejecutar los criterios anteriores sobre el programa real. Estas tareas requieren implementación y siguen fuera de la fase actual; los scripts de investigación no las sustituyen.

### Ampliaciones opcionales de investigación o límites externos

- Muestras históricas genuinas de Europass online con datos incrustados y documentos de distintos generadores. Los controles ampliados no sustituyen ese corpus de uso real.
- La caducidad real de 48 horas se ha descartado a petición del usuario. No hay comprobaciones futuras que ejecutar ni obligación de mantener Chrome abierto; no se marca como un resultado superado. Véase 27.
- Save and exit del beta sigue sin ejecución por su estado deshabilitado. El recorrido alternativo estándar sí está completado. No se solicitan credenciales ni se atribuye la causa a carecer de cuenta.
- Causa de la foto no visible en el render de Elegant y pruebas de lector de pantalla, otros lectores PDF e idiomas complejos. Son límites documentados, no una afirmación de pérdida de los datos incrustados.
- Validación exhaustiva de calendario, pegado externo, dispositivos, accesibilidad y combinaciones de presentación. Son pruebas futuras de cobertura, no hallazgos ya observados.

No quedan acciones manuales ni esperas necesarias en Europass para empezar la primera versión. La importación, modificación, exportación y reimportación ya están comprobadas en Europass con archivos locales y sesiones de prueba nuevas; deberá construirse y validarse ese ciclo en la aplicación propia. La compatibilidad de PDF genéricos o escaneados requiere su ruta de importación asistida/OCR y no se presume idéntica a la de PDF con XML compatible.
