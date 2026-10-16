# Prueba técnica F1

**F1 aprobada con el alcance de cierre del 16 de octubre de 2026.**
Prueba aislada con datos sintéticos propios; no es el producto ni implementa F2.
Estado, evidencias y límites: [registro](../../docs/F1_VALIDATION.md).

Desde la raíz del repositorio, con Node/npm y una sesión gráfica Linux:

```bash
npm ci --prefix spikes/f1
# Recursos de la exploración anterior incluidos en la configuración del paquete:
node spikes/f1/prepare-models.mjs
npm run typecheck --prefix spikes/f1
npm run package --prefix spikes/f1
CVFORGE_F1_OUTPUT=/tmp/cvforge-f1-new \
  unshare --user --map-current-user --net node spikes/f1/offline-check.cjs
```

El directorio de salida debe ser nuevo. El runner comprueba ausencia de rutas e
interfaces externas y fallo de conexión TCP antes de arrancar Electron. Crea una
fila/imagen SQLite en worker y genera/visualiza/extrae los PDF. Cierra y reabre
SQLite y los seis PDF en otro proceso, después ejecuta todos los tests de cierre.
No desactiva el sandbox Electron. Se necesitan Poppler (`pdfinfo`, `pdffonts`,
`pdftotext`, `pdftoppm`, `pdfdetach`) y util-linux/unshare. En entornos que impidan
namespaces no debe sustituirse esta prueba por una afirmación de offline basada
únicamente en interceptar HTTP.

Para volver a ejecutar los tres tests sobre una ejecución completa:

```bash
CVFORGE_F1_OUTPUT=/tmp/cvforge-f1-new npm test --prefix spikes/f1
node spikes/f1/audit-direct.cjs
```

Los tests comprueban la auditoría negativa de un stream comprimido con datos
privados, la recuperación/lectura con PDF.js y Poppler y los renderizados idénticos
antes/después de adjuntar/retirar el payload. El código `closure*` es exclusivamente
un harness de validación; no es dominio F2 ni un limpiador general de PDF.

Los comandos del paquete que usa el runner son:

```bash
CVFORGE_F1_OUTPUT=/tmp/cvforge-f1-new spikes/f1/out/linux-unpacked/cvforge-f1-spike --closure --create
CVFORGE_F1_OUTPUT=/tmp/cvforge-f1-new spikes/f1/out/linux-unpacked/cvforge-f1-spike --closure
```

No ejecutar empaquetado mientras se modifican sus entradas. `.cache`, `out`,
`dist`, `node_modules`, PDF, SQLite, capturas y logs permanecen fuera de Git.
Solo se versionan fuentes, licencias, tests e informes/JSON de datos sintéticos.
Liberation Sans 2.1.5 se incluye sin modificar con su licencia OFL-1.1 en `assets`.

La traducción no es condición de cierre F1 y **no se ejecuta con `--closure`**.
Se mantienen sin ampliar `translation-probe.mjs`, `translation-worker.mjs` y la
sonda original para conservar la exploración previa. La configuración de paquete
aún incluye sus recursos; antes de redistribuirlos hay que cerrar su procedencia
y avisos, como registra [F1_LICENSES.md](../../docs/F1_LICENSES.md). No se publican
pesos ni ejecutables. `prepare-models.mjs` instala solo recursos públicos fijados
por revisión/SHA-256, sin enviar contenido del CV; es preparación explícita con
red, nunca una descarga al arrancar el flujo F1.
