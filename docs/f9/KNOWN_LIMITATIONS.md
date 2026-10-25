> **Estado vigente, decisión explícita del usuario del 25/10/2026: F9 = APROBADA técnicamente.**
> NF-05 startup pasa de su objetivo inicial ≤3000 a **≤3200 ms p95**, después de
> las mediciones y solo para el equipo/corpus/método F9 documentado. Confirmar
> conserva **≤300 ms**; ningún otro objetivo cambia. Las tres campañas startup
> 3075,6/2995,8/2935,0 y Confirmar 284,2/280,3/275,1 son PASS; offline sigue PASS.
> [Decisión, justificación, AC-01…AC-10 y evidencia](NF05_STARTUP_REVIEW.md).
> Se conserva el historial original de 3000 ms y sus FAIL, sin modificar muestras
> ni método. Deuda pendiente: 50 revisiones, Confirmar p95 316,6 ms por lecturas/
> copias globales, fuera del corpus oficial. Sin merge/push a main ni F10.

## Registro anterior a la revisión explícita, conservado

# F9 — Límites vigentes de la investigación de repetibilidad

**F9 NO APROBADA**: Confirmar pasa las tres campañas oficiales; arranque A
falla. No se declara estabilidad de todos los presupuestos ni se seleccionan
solo B/C. No merge/push a main ni F10. [Evidencia](CONFIRM_REPEATABILITY.md).

- Confirmar cumple las tres campañas con margen de 15,8–24,9 ms frente a 300;
  no alcanza consistentemente el margen práctico deseable de 250 ms.
- La candidata reduce las escrituras ordinarias de Confirmar a una entidad, su
  checkpoint y draft, pero mantiene lecturas/copias y validación globales por el
  contrato vigente. No tiene coste constante respecto a workspace/historial.
- Diagnóstico con trazas y 50 revisiones en un proceso: p95 316,6 ms; primeras
  diez 302,6/últimas diez 322,1. No se oculta ni se equipara a aceptación sin
  trazas/procesos nuevos. La preparación del draft puede seguir usando la vía
  completa y checkpoints; no se ha rediseñado toda la persistencia.
- No se identifica retrospectivamente la causa física exacta de 228,4→359,7.
  El mismo binario y corpus pueden variar; no se certifica rendimiento universal,
  OS frío ni estado energético modificado.
- Abrir CV C p95 2100,6 ms sigue siendo informativo, sin umbral.

Los límites funcionales y resultados históricos siguientes se conservan; sus
estados de aprobación no sustituyen esta cabecera.

> **Control previo actual: integración bloqueada.** El usuario aprobó F9/MVP 0.1.0 en `7088c4c`; la regresión nueva conserva 216 tests, UI, 33 PDF, offline y privacidad PASS, pero Confirmar durable p95 **359,7 ms >300**. Arranque p95 2469,1 ms PASS. Sin merge/push a main ni F10. [Evidencia actual](MERGE_VALIDATION.md). La aceptación anterior y todos sus resultados se conservan como historia.

## Registro aprobado anterior, conservado

# F9 — Límites actuales de la candidata 0.1.0

Aceptación técnica PASS, pendiente de nueva aprobación; sin merge/push ni F10.
[Startup y seguridad](STARTUP_PROFILING.md), [métricas](PERFORMANCE.md).

- Proceso/perfil frío, sin vaciar cachés SO/runtime como en el método original.
  Oficial startup p95 1844,4 ms; FUSE normal adicional 2339,4 ms. No se certifica
  frío de SO, rendimiento universal, otras distribuciones ni otras plataformas.
- Abrir CV p95 2819,1 ms: cola más lenta que 1700,5 ms anteriores, sin umbral formal.
  La primera apertura sigue materializando snapshots completos; no se inició otra
  optimización. La escritura global de metadata sigue siendo transaccional.
- Linux x86_64/X11 de aceptación; Simple/Lateral. OCR/PDF genérico y tipos V1 futuros
  quedan fuera; no se inicia F10. PDF/UA/WCAG completos no certificados.
- Traducción manual/local revisable, sin proveedor automático de producción nuevo.
  Compatibilidad Europass parcial del subconjunto probado, revisión de URLs sin
  protocolo explícita. No se anuncian importaciones universales/completas.
- SQLite corrupto requiere error/restauración explícita, no reparación automática.
  `.cvproj` privado es la copia completa; PDF recupera solo su distribución visible.
- Crash tras escribir PDF y antes de ExportRecord puede dejar PDF sin receipt;
  CV intacto, ningún éxito falso, reintento explícito. Decisión anterior mantenida.
- FUSE debe funcionar para montaje normal; extract-and-run es la alternativa del
  runtime. AppImageLauncher del host puede mover el archivo. Icono Electron
  predeterminado, sin auto-update/cloud y sin ampliación de plataformas.
- Se conservan los resultados fallidos y el antecedente de dos huellas antiguas
  en historia compartida; no hay PDF privados ni sus bytes en Git y no se reescribe
  historia. Los recursos/pesos de pruebas anteriores no implican un motor de
  traducción integrado ni redistribución nueva.


## Registro histórico conservado

Las cifras y estados siguientes corresponden a evaluaciones anteriores; la cabecera actual y STARTUP_PROFILING gobiernan esta candidata.

## F9 — Limitaciones conocidas de la candidata

**F9 y MVP 0.1.0 aprobados por el usuario**, pendientes de integración.
El [control previo al merge](MERGE_VALIDATION.md) detecta arranque p95 3462,3 ms
frente al límite existente de 3000 ms; Confirmar pasa con p95 236,9 ms.
La causa de esa variación no está demostrada y no se modifica el umbral.
Los tres bloqueos iniciales se resolvieron: perfil/materialización GUI, workspace
GUI y Confirmar p95 261,3 ms frente a 300 ms. Se conserva el fallo inicial
471,1 ms en [aceptación](ACCEPTANCE.md) y [rendimiento](PERFORMANCE.md).

- La medición es de este equipo/corpus; arranque p95 2944,7 ms tiene poco margen
  respecto a 3000. Abrir CV p95 1700,5 ms sigue siendo perceptible y no tenía umbral.
  El adaptador conserva escritura global transaccional de metadata; no se declara
  persistencia diferencial ni rendimiento universal.
- Una pasada incompleta del benchmark terminó al cerrarse una instancia; causa
  no establecida. La repetición con diagnóstico completa 20/20 con salida 0 y no
  reproduce el cierre. No se declara una corrección de crash sin demostrarla.
- Linux x86_64 primero. No se valida universalidad de distribuciones, Windows/macOS,
  AUR/deb/rpm ni todos los portales gráficos.
- En el namespace de aceptación el montaje FUSE está denegado. La AppImage funciona
  con `APPIMAGE_EXTRACT_AND_RUN=1`, que debe utilizarse en ese entorno. El montaje
  normal no funciona dentro de ese namespace; fuera de él el arranque FUSE y
  reapertura de la AppImage final sí pasan. No se certifican todos los launchers.
  No se desactiva Chromium sandbox para pasar las pruebas nuevas.
- Solo Simple/Lateral v1. Puede quedar espacio libre al mantener bloques unidos;
  se prioriza no perder contenido.
- PDF/UA y accesibilidad completa no certificados. Poppler geométrico puede
  intercalar filas de columnas; la lectura raw/semántica se comprueba aparte.
- PDF genérico, OCR y tipos de sección V1 están fuera de esta entrega.
- Traducción automática de producción pendiente. Existe el flujo manual/revisable
  A/B/C con checkpoints. El último alcance F9 excluye introducir un motor grande;
  no se declara que ese requisito automático histórico esté implementado.
- Europass limitado a Candidate/HR-XML 4.0 y rutas probadas; importación parcial
  cuando hay campos sin correspondencia. No se copian diseños/recursos Europass.
- PNG limitado al subconjunto verificado. Los tests controlan el resultado de
  diálogos nativos y escriben archivos reales; no certifican todos los escritorios.
- La biblioteca de 100 CV se conserva y es seleccionable, pero no tiene buscador
  ni virtualización de lista. La lista larga exige desplazamiento; no se declara
  optimizada como una biblioteca grande definitiva.
- No hay auto-update, cuentas, cloud ni sincronización.
- Dos huellas de PDF privados aparecían en un informe de investigación de
  cc2db00. Se redactaron en el documento actual; el commit histórico conserva
  esas huellas. Los PDF, sus bytes y sus datos personales no están versionados.
  No se reescribe el historial compartido ni se afirma que carezca de metadata
  heredada. El escáner del árbol actual y de los blobs nuevos de F9 queda limpio.
- Se conservan los avisos anteriores de Vite/VA-API y herramientas de desarrollo.
  No se silencian ni se declaran reparados en esta fase.

Los huecos GUI y el p95 inicial permanecen documentados como resultado histórico;
no siguen siendo limitaciones actuales. [Perfil y backup](PROFILE_AND_BACKUP.md).

Un PDF escrito antes de un crash puede quedar sin ExportRecord. Es un archivo
válido que el usuario conserva; no se anuncia como registrado, el CV no cambia y
reexportar crea un recibo nuevo. No hay exploración de rutas ni reconciliación
automática de archivos externos. Véase la prueba de fallo en [ACCEPTANCE](ACCEPTANCE.md).
