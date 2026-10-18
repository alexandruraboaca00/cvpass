# F7 — Simple y preview PDF.js

En implementación en `f7-simple-template-preview`, desde main `7230814`.
F7 todavía no aprobada; no se inicia F8.

La base pasó F1 3/3, F2–F6 139/139, TypeScript/build y UI F4/F5/F6 13/13 sin red,
además de los 25 tests F6 repetidos en namespace aislado. Evidencia sintética local
en `/tmp/cvforge-f7-baseline`. Los siete documentos actuales se leyeron completos.

## Instantánea y recursos

`RenderSnapshotFactory` lee el estado confirmado, comprueba revisión/plantilla y
construye ExportProjection por la lista permitida existente. Las variantes C se
resuelven antes de componer; fechas no ganan precisión. Copia bytes necesarios
antes de esperar la preparación de imágenes. La instantánea contiene identidad
privada de CV/revisión, fingerprint de proyección/motor/recursos, fuentes y solo
la proyección visible, congeladas. Ni paginación ni render modifican el dominio.

Simple v1 declara los siete tipos de sección del dominio (datos personales son
cabecera), una columna, Liberation Sans 2.1.5 regular/negrita/cursiva/ambas y su
licencia SIL OFL 1.1. Son recursos locales propios de la distribución, con hashes
pinned; no se copia ningún recurso Europass. Los cuatro TTF y licencia se conservan
también en el cierre privado de dependencias de plantilla para SQLite/cvproj.

`PresentationService` confirma solo ajustes de presentación y plantilla mediante
una revisión durable, sin modificar contenido. Su cancelación será local al
formulario de UI. Un recurso ausente/alterado o versión no soportada da error,
sin una sustitución silenciosa. El normalizador Electron materializa el recorte
y elimina chunks PNG ajenos a píxeles; la representación exacta se valida con el
verificador de imágenes de exportación F2.

## Pipeline previsto, aún pendiente de validación

CV confirmado → RenderSnapshot → HTML/CSS semántico Simple en Chromium aislado →
PDF → payload visible compatible (codec existente) → bytes finales inmutables →
PDF.js y exportación de esos mismos bytes. No hay preview HTML alternativa.
La cola de PDF estará separada de escrituras del editor; generaciones obsoletas
no podrán publicar una preview nueva. Sin render de borradores ni traducción.

Pendiente: composición/paginación, render real, visor, diálogo de exportación,
pruebas externas, mediciones, empaquetado y cierre. Ninguno se declara probado aún.
