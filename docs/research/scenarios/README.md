# Guiones de investigación REA

Estos archivos automatizan observación de UI en sesiones de prueba. No implementan la herramienta de CV ni contienen código de Europass.

## Entorno observado

- Linux x64; Node v26.11.1; Google Chrome 153.0.8010.52.
- Playwright Core ya instalado en la ruta indicada en `cierre-helpers.mjs`.
- Poppler para PDF/XML, texto, coordenadas y renderizado.
- Tesseract con un modelo inglés existente de Autopsy para el control OCR.
- Java y Apache PDFBox 3.0.3 ya presentes en `/opt/autopsy/autopsy/modules/ext/`, utilizados para generar controles ficticios de contenedor PDF.
- Las pruebas abren contextos aislados sin cuenta y bloquean service workers. Una usa un perfil temporal persistente para probar recarga y reinicio.

## Fixtures y ejecución

`cierre-helpers.mjs` apunta a `/tmp/europass-pdf-research-b83cd0/all-sections.pdf`, el CV ficticio exportado en la investigación 16. El resto de artefactos se escribe en `/tmp/europass-cierre-investigacion/`. Los guiones encadenados requieren que existan los PDF e imágenes de la prueba anterior; no son una suite portable ni garantizan repetición exacta frente a una web cambiante.

Las imágenes de firma y foto son sintéticas y propias. Los PDF y capturas de Europass se conservan solo como artefactos temporales de observación, sin incorporarlos al código del proyecto. Para repetir tras limpiar `/tmp`, hay que regenerar los fixtures y adaptar las rutas locales; no copiar recursos del sitio a la aplicación.

Se ejecutaron mediante REA `capture_process_scenario` con Node como comando explícito. REA registra salida y límites del proceso; los guiones realizan los clics, entradas y navegación con Playwright. No se modifica la pestaña original del usuario conectada al puerto 9222.

La ampliación 34–40 utiliza también `/tmp/europass-seguimiento/`. El guion 37 exporta las seis plantillas sobre una copia del CV real; 38–40 prueban variantes de importación. `PdfCompatibilityFixtures.java` genera 13 controles en su modo normal y otros cuatro con el argumento `extended`. No contiene un motor de la aplicación propia.

El guion 36 dejó dos contextos propios en el Chrome externo para esperar tiempo real. **La prueba fue descartada por el usuario y el guion 45 cerró ambos contextos**, preservando la pestaña original. Estado e historial: [manifest.json](caducidad-48h/manifest.json) y [cierre.json](caducidad-48h/cierre.json). El guion 36 detecta la cancelación y sale antes de conectar o crear otros contextos. No hay temporizador ni comprobación futura que ejecutar; no es necesario mantener Chrome abierto. Véase el [informe 27](../27-caducidad-real-48-horas.md).

## Registro

- `evidencias-cierre.json`: identificadores REA, etapas, estado de salida y truncamiento. Un guion con error puede contener etapas anteriores confirmadas; el informe distingue ambas cosas.
- `metricas-cierre.json`: datos derivados de PDF/XML y paginación; no contiene datos personales, imágenes ni plantillas.
- Los informes 17–23 explican qué conclusiones sustentan las etapas y cuáles siguen sin demostrarse.
- `evidencias-seguimiento.json`: ejecuciones nuevas 34–40; conserva la distinción entre tanda parcial por timeout y repeticiones completas.
- `metricas-seguimiento.json`: corpus de 25 archivos/variantes, estados de importación y comparación de seis plantillas. Se calcula con `41-analisis-seguimiento.py`, herramientas locales y los resultados temporales. No contiene el texto personal extraído.
- Los informes 24–28 actualizan Save and exit, formatos, compatibilidad, espera de 48 horas y mejoras propuestas.
- Los guiones 42–44 y [caducidad-simulada](caducidad-simulada/) documentan simulaciones completadas de Date, temporizadores y respuestas GET 404/410 fabricadas en el navegador. Utilizan Chrome temporal propio, no los contextos del control real. El informe 29 explica los límites; no equivalen a esperar 48 horas de servidor.

Los guiones muestran la última versión corregida de cada escenario. Los registros anteriores conservan los fallos e identificadores de sus propias ejecuciones; no se afirma que el archivo actual sea idéntico byte a byte al usado en todas ellas.
