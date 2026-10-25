# F9 — Nuevo control previo al merge: FAIL en Confirmar durable

25/10/2026. El usuario aprueba F9/MVP 0.1.0 en `7088c4c` y autoriza el merge
condicionado a regresiones correctas. **No se realiza merge ni push**: la campaña
oficial nueva devuelve exit 1 por Confirmar p95 **359,7 ms >300**. No se inicia F10,
no se crea tag ni GitHub Release. No se modifica código de producto ni garantías.

## Estado y regresión funcional

F9 limpia al comenzar, HEAD exacto `7088c4c446bf8d8bb887a277065e494ef9aa645c`.
Main/origin-main `cc7cf0d6b4aa56689ec9d0dec22b6aa9e5cba28c`, fetch correcto.
216 tests PASS: F1 3, dominio/aplicación/SQLite 180, UI/layout 23, AppImage GUI 10.
33 casos PDF, Simple/Lateral, SHA preview/export, PDF portable y `.cvproj` PASS.
AC-01…AC-08/AC-10 PASS, incluidas GUI perfil/materialización/independencia y
workspace backup/restore. TypeScript/build, E2E empaquetado, offline y privacidad
PASS. AC-09 FAIL solo por Confirmar durable en esta medición.

Evidencia numérica: [benchmark completo](evidence/merge-recheck-performance.json),
[validación y entorno](evidence/merge-recheck-validation.json). Recibos locales en
`/tmp/cvforge-f9-integration/`; datos de pruebas en SSD fuera del repositorio.

La primera pasada se interrumpió durante GUI AppImage: una orden sandbox crea
temporalmente `/tmp/.git`; un observador externo detectó 40/160 muestras durante
una orden de dos segundos. La protección rechazó el perfil sintético bajo `/tmp`
como almacenamiento dentro de repositorio; ningún dato real se modificó.
Se repitió en SSD y Xvfb/Openbox, sin cambiar la protección. Una pasada aislada
tuvo 9/10 PASS y un fallo al recuperar el foco de Presentación. Tres diagnósticos
mostraron botón/ventana enfocados; la suite original posterior, sin sondas, pasó
10/10 sin skips/flaky/retries automáticos. No se atribuye concluyentemente la
causa del evento de foco. Se conserva esa pasada. Los recibos F1/180/UI23 y el SHA
exacto se verificaron antes de continuar normal-launch/PDF/privados
(`resumedAfterPackage=true`); no se omite ningún caso fallido.

## Rendimiento: 20 muestras, ninguna exclusión

Mismo script, equipo/versiones, SSD ext4, corpus de 100 CV y marcador.
Procesos/perfiles nuevos; cachés SO/runtime sin vaciar, como el método original.
AppImage extract-and-run en namespace offline, sin capacidades ni rutas externas;
Xvfb/Openbox/X11 y diagnóstico pw:browser. Sin tests/build concurrentes.

| Operación | p50 ms | p90 ms | p95 ms | Máximo ms | Resultado |
| --- | ---: | ---: | ---: | ---: | --- |
| Arranque | 2299.6 | 2442.4 | 2469.1 | 2744.3 | PASS ≤3000 |
| Confirmar durable | 296.1 | 345.8 | 359.7 | 369.1 | FAIL >300 |
| Abrir CV | 482.5 | 2046.8 | 2067.0 | 2121.5 | informativo, sin umbral |

El resto de presupuestos anteriores PASS. FULL/WAL, revisión, atomicidad y
resolución durable del borrador no cambian; no hay ACK anticipado. Se mantienen
startup histórico ~2594,1, regresión 3462,3, aceptación 1844,4, FUSE normal 2339,4;
Confirmar inicial 471,1 y aceptación 228,4; Abrir CV 2819,1 informativo.

El binario es **idéntico** al aprobado. No se puede atribuir la diferencia a un
commit nuevo de producto. Después del benchmark: governor `powersave`, EPP
`power`, alimentación AC online, carga moderada y temperaturas observadas ~43 °C.
La misma preferencia energética ya figura en el registro anterior. No hay dato
suficiente para demostrar causalidad; no se cambia energía ni se inventa un nuevo
requisito. No se repite el benchmark hasta lograr PASS ni se abre una campaña
de optimización: se conserva el FAIL y se detiene la integración condicional.

## Artefacto y límites del control

Candidata `CVForge-0.1.0-x86_64.AppImage`: **159760475 bytes**.
SHA-256 `16c0a4f77ac117b33a066b6c50a6ee75154552de2d485cf1fc9f8aa1974a14b3`.
Paridad de 105 archivos de producción/recursos, copia fuera del checkout,
sandbox Chromium activo. Se conserva la reproducibilidad anterior de dos builds
idénticos; **no se reconstruye desde main ni se ejecuta post-merge** porque no
se cumplen las condiciones para fusionar. Artefactos y PDF privados fuera de Git.

## Registro histórico anterior, conservado

> Registro histórico del intento de merge bloqueado. El arranque se ha corregido y revalidado en [STARTUP_PROFILING](STARTUP_PROFILING.md); la orden actual sigue prohibiendo merge/push y F10 hasta nueva aprobación.

# F9 — Control previo a la integración del MVP 0.1.0

24 de octubre de 2026. El usuario aprueba F9 y el MVP y autoriza el merge
condicionado a regresiones correctas. **La integración queda bloqueada por
NF-05 de arranque; no se realiza merge ni push. F10 no iniciada.**

## Estado comprobado

- `f9-mvp-acceptance` limpia antes del control, HEAD `c4203dacb9f748ac4010d38ee250df264a6c70cd`.
- `main` limpia, comprobada mediante cambio de rama; `git fetch origin` confirma
  `main` y `origin/main` en `cc7cf0d6b4aa56689ec9d0dec22b6aa9e5cba28c`.
- Sin cambios funcionales al producto ni al renderizador respecto al candidato aprobado.
- TypeScript y reconstrucción AppImage/build: PASS. Mismos 159703015 bytes y
  SHA-256 `6b984f6e96af918b815def7d0d12db28e5bf1920108beeaea9878e5a7d443d8c`.

## Regresión funcional previa

Ejecución completa: `/tmp/cvforge-f9-merge/pre/recheck-offline/`.
210 tests PASS: F1 3, dominio/aplicación/SQLite F2–F9 174,
UI F4–F8/pulido 23, aceptación GUI de la AppImage F9 10.
Sin casos omitidos, fallos ni reintentos en esta ejecución completa.

33 casos PDF PASS: Simple 7, corpus F8 26. Preview/export idénticos por SHA-256;
48 párrafos, glifos, enlaces, márgenes, Simple/Lateral y privacidad pasan.
La comparación con PDF de main recién generados verifica todos los bytes salvo
las dos fechas de reloj ya existentes; no confundirla con la identidad exacta
preview/export dentro de una generación.

| Caso | Control actual | Evidencia |
| --- | --- | --- |
| AC-01 | PASS, alcance parcial probado | Dos muestras privadas; valores, cantidades, contactos/foto, reapertura y originales intactos. Sin publicar datos privados. |
| AC-02 | PASS | GUI AppImage: Simple/Lateral → nuevas bibliotecas → comparación visible; `.cvproj` completo. |
| AC-03 | PASS | Confirmar/Cancelar y reapertura GUI; sin cambios cancelados ni borrador residual. |
| AC-04 | PASS | SIGKILL, recuperación/descartar y exportación de confirmado. |
| AC-05 | PASS, manual vigente | Original/traducción/ambos, aprobaciones reutilizadas y revisión obsoleta. |
| AC-06 | PASS por GUI | Ocho áreas del perfil, materialización selectiva A/B, independencia y reapertura. |
| AC-07 | PASS | 33 casos PDF y E2E AppImage; mismos bytes preview/export. |
| AC-08 | PASS por GUI | Workspace con perfil/CV/assets/historial, exportar/restaurar/reabrir; error real de escritura y Cancelar sin éxito falso. |
| AC-09 | FAIL de arranque | 20 procesos: arranque p95 3462,3 ms >3000. Confirmar durable p95 236,9 ms ≤300; restantes presupuestos PASS. |
| AC-10 | PASS en corpus probado | Límites/corrupción, payload sin privados, dos originales sin tracked/staged. |

Offline: namespace sin red, solo loopback, ninguna ruta externa,
conexión externa ENETUNREACH, capacidades efectivas cero y sandbox Chromium
activo. El paquete se ejecuta desde una copia fuera del repositorio; 95 archivos
de producción/recursos coinciden con dist. No contiene pruebas ni archivos privados.

## Intentos conservados y diagnóstico

La primera pasada (`pre/offline/`) falló una aserción de restauración de foco
después de varios ciclos Enter/Escape. AC-06/AC-08 y el E2E ya pasaban.
La prueba aislada pasó 5 veces y luego 20 veces con trazas habilitadas; se
repitió entonces toda la suite en `pre/recheck-offline/`, que pasó sin reintentos.
No se reprodujo la causa y no se alteró código ni la aserción para ocultarla.
Se conserva como fallo intermitente observado, no como corrección demostrada.

El primer benchmark (`pre/performance/`) se interrumpió después de 12 procesos:
`Target page, context or browser has been closed`. No se atribuye una causa
sin evidencia ni se declara ese intento como benchmark completo.

La siguiente ejecución (`pre/performance-recheck/`) completó exactamente 20
procesos y terminó con exit 1 por arranque. Mismo corpus SHA-256
`83ae157d013de8c0423655186059076407449db8217d08659e892016b4577380`,
100 CV, SSD ext4, i5-13420H, Electron 44.7.2, Node driver 26.12.1,
viewport 1180×860 y método IPC previo. Todas las muestras se conservan, sin
recortar valores lentos. [Resultados crudos](evidence/merge-performance.json),
[tabla y método](PERFORMANCE.md).

Confirmar: p50 207,4; p90 231,1; p95 236,9; máximo 245,7 ms.
Arranque: p50 2343,6; p90 2936,6; p95 3462,3; máximo 3731,1 ms.
Abrir CV: p95 1388,2 ms, informativo sin umbral previo.
No se cambió la configuración energética del equipo ni se demuestra que sea
la causa. No se relajan límites ni durabilidad para fusionar.

## Privacidad y decisión

Auditoría local previa: 662 blobs alcanzables, ningún PDF original por comparación
de bytes/hash, originales no tracked/staged y ningún artefacto de aceptación
versionado. La comprobación privada completa también pasa contra fuentes e
historial nuevo de F9. Permanece el antecedente de dos huellas antiguas ya
documentado en ACCEPTANCE, sin reescribir la historia compartida.

No se ejecutan regresiones posteriores a una fusión que no se ha realizado.
Main conserva su commit previo y no se hace push. Los únicos cambios posteriores
al control son documentación del resultado y de la aprobación del usuario.
La autorización queda vigente, pero la condición de regresiones PASS aún no se cumple.
