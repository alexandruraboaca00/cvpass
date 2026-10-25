# 21 — Importación de PDF genérico, escaneado, XML y documentos reales

> Redacción de privacidad, 23/10/2026 (F9): se retiran dos huellas SHA-256 de
> originales privados. Se mantienen las observaciones, cantidades y conclusiones
> históricas; no se reemplazan por evidencia de implementación nueva. El antecedente
> está en cc2db00; no se ha reescrito ese historial.

Ampliación: [26 — Compatibilidad de PDF](26-compatibilidad-ampliada-pdf.md) añade 25 archivos/variantes, incluyendo versiones de contenedor, adjuntos, codificaciones, contraseña y plantillas. Los rechazos no se atribuyen a columnas o Unicode cuando el control también carece de datos de CV compatibles.

## 1. Hechos observados

Evidencia REA `ev_04ff1c7af0c3d34da3a51702797f49d3d453a0c7319328aa30569d6fb308dbd2`: seis controles de importación en sesiones aisladas, 15 de octubre de 2026. Los archivos genérico y escaneado contienen exclusivamente un CV ficticio creado para investigar; no se utilizaron diseños ni datos ajenos.

| Archivo | Resultado en Europass |
| --- | --- |
| PDF genérico con texto, sin XML | Save inicialmente habilitado; tras pulsarlo, «The file is not Europass compliant». No entra al editor. |
| PDF compuesto de imagen, sin XML | Mismo rechazo. |
| Archivo de texto renombrado a .pdf | Mismo rechazo, sin diferenciar en el mensaje el motivo técnico. |
| PDF con relleno que supera 20 MB | Save deshabilitado y error de tamaño antes de importar. No se midió el umbral byte a byte. |
| XML del CV ficticio exportado previamente | Aceptado; abre el editor con las secciones. |
| PDF inglés del usuario | Aceptado; abre el editor. No se modificó el original. |

La prueba anterior de un PDF Europass sin XML también había sido rechazada; esta serie añade controles independientes. Se comprueba comportamiento de importación, no el algoritmo interno de identificación del archivo.

### Recuperación local del PDF genérico y el escaneado

El mismo CV ficticio se representó como PDF de texto y como PDF de imagen. `pdftotext` recupera 292 bytes del primero; del segundo obtiene solo dos caracteres de separación de página/línea, sin contenido del CV. Por tanto, no basta con extracción de texto para el segundo.

Se renderizó el PDF escaneado a PNG a 150 dpi y se ejecutó Tesseract con un modelo inglés ya instalado en `/opt/autopsy/autopsy/Tesseract-OCR/tessdata`. La primera tentativa con su ruta de datos predeterminada falló por ausencia del modelo; se corrigió la ruta sin instalar dependencias.

El OCR recuperó 284 bytes de contenido, con nombre ficticio, correo, puesto, periodo, educación y habilidades legibles. Hay errores concretos: «Educación» se convierte en «Educaci6n», «programación» en «programaci6n» y se pierden algunos acentos y separadores. No se calculó una tasa general de precisión ni se extrajo automáticamente un modelo de CV.

### Reedición confirmada del PDF real

Evidencia `ev_0f68bd3236f57936d5cb446d91c80dedd622c8e7489b527ea6d5f54d373a3af5`: se importó una copia del PDF original del usuario, se abrió la primera entrada educativa, se añadió un marcador de investigación al título, se guardó y se exportó. La reimportación recupera ese título modificado. Se cierra así la prueba que había quedado sin confirmación en 12 y 16.

La comparación del XML original con el editado detecta solo el título educativo cambiado y CandidateProfile/ID. No cambia ningún otro texto de hoja o atributo con el método aplicado. El PDF visible sigue usando la normalización de fechas observada anteriormente; conservar XML no equivale a conservar cada detalle visual.

Se verificaron los hashes de los dos PDF de entrada al finalizar: siguen siendo `[huella privada retirada en F9]` y `[huella privada retirada en F9]`, respectivamente. No se alteraron esos archivos ni la pestaña del usuario.

## 2. Inferencias y alcance propuesto

Conviene tratar tres recorridos distintos en nuestra herramienta:

1. PDF/XML con datos estructurados reconocidos: recuperar entradas y preferencias, con control de versiones y comparación de valores.
2. PDF de texto sin datos editables: proponer una extracción con revisión de campos y orden.
3. PDF de imagen: aplicar OCR y revisión, señalando dudas de lectura.

Las pruebas locales demuestran extracción de texto y OCR de un ejemplo sencillo. No demuestran recuperación automática fiel de columnas, tablas, fechas, estilos ni asociaciones de campos. «Editar un PDF importado» deberá significar revisar datos recuperados y generar un documento nuevo; no se ha validado modificar directamente cualquier maquetación PDF arbitraria.

## 3. Cuestiones pendientes

El importador de nuestra aplicación todavía no existe. Su validación requerirá un corpus más variado: otros generadores y versiones Europass, PDF con columnas, varias páginas, textos escaneados de menor calidad, distintos idiomas y documentos protegidos. No se promete reconstrucción exacta de esos casos a partir de las pruebas actuales.

No se necesita otra acción del usuario para cerrar la inspección de los dos PDF suministrados. Reunir ejemplos adicionales mejoraría la cobertura futura, sin convertirlos en un requisito para documentar lo ya observado.
