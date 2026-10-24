# F9 — Limitaciones conocidas de la candidata

**F9 = APROBADA técnicamente**, pendiente de aprobación del usuario e integración.
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
