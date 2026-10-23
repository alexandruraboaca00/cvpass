# F9 — Aceptación del MVP

En ejecución, 23 de octubre de 2026, rama `f9-mvp-acceptance`, base
`cc7cf0d6b4aa56689ec9d0dec22b6aa9e5cba28c`. No fusionar ni iniciar F10.
F9 todavía no está aprobada.

Se han leído completos los diez documentos exigidos para esta fase. Main limpio,
origin/main comprobado con fetch/ls-remote. La regresión inmediatamente anterior
de este mismo commit pasa: F1 3/3, F2–F8 163/163, UI 23/23, 26 PDF F8 y 7 PDF
F7, TypeScript/build, ejecutable Linux 3/3, offline y ciclos/privacidad.
Evidencia local: `/tmp/cvforge-f8-recheck-20261023/`. Esto valida la base, no F9.

La aceptación nueva usa datos sintéticos reproducibles en la aplicación
empaquetada. Las muestras Europass privadas disponibles se comprueban aparte,
sin copiar valores a fixtures, documentación ni commits. Evidencia F9 bajo
`/tmp/cvforge-f9/`, excluida de Git.

| Caso | Estado F9 inicial | Prueba nueva requerida |
| --- | --- | --- |
| AC-01 | pendiente | Dos PDF privados y fixture sintético, cantidades y valores por bloque. |
| AC-02 | pendiente | Ambas plantillas → PDF → bibliotecas vacías → comparar tras reapertura. |
| AC-03 | pendiente | Email A/B, Cancelar, Confirmar, reiniciar, comparar. |
| AC-04 | pendiente | SIGKILL con borrador, recuperar/descartar, exportación del confirmado. |
| AC-05 | pendiente | Traducción manual real, checkpoint, B intacto, memoria C/modos/obsolescencia. |
| AC-06 | pendiente | Perfil y dos CV independientes, cambios sin propagación. |
| AC-07 | pendiente | Ambas plantillas, texto/listas/URL/glifos/foto, lectores y bytes. |
| AC-08 | pendiente | Workspace completo en biblioteca vacía, fallo de escritura sin éxito falso. |
| AC-09 | pendiente | Benchmark p95, 100 CV y E2E empaquetado sin red. |
| AC-10 | pendiente | Errores revisables, límites y payload inspeccionado por centinelas. |

Los objetivos previos son NF-05: arranque frío ≤3 s; escritura ≤100 ms;
confirmación durable ≤300 ms; preview hasta 3 páginas ≤2 s tras debounce de
400 ms; exportación 10 páginas ≤5 s; importación estructurada 3 páginas ≤3 s.
Otras métricas se registran sin inventar un umbral. Se distinguirá inicio de
proceso de caché fría del SO, y preparación/confirmación de importación.

Deuda a reproducir sin prometer transacción distribuida:
**Crash/reconciliation between successful PDF file write and durable ExportRecord**.
No se declarará resuelta sin una prueba de fallo y reapertura.
