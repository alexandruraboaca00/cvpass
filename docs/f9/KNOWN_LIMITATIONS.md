# F9 — Límites y bloqueos de la versión candidata

**F9 = NO APROBADA.** Esta lista no convierte FAIL en PASS. Los bloqueos
de producto y rendimiento deben resolverse antes de aceptar la entrega del MVP.

- NF-05 falla con 100 CV: Confirmar durable p95 471,1 ms frente a 300 ms,
  en 20 repeticiones finales de la AppImage/SSD. Arranque 2594,1 ms sí cumple.
  Las mejoras de cache no convierten la confirmación global F3 en persistencia
  diferencial. [Método y todas las métricas](PERFORMANCE.md).
- Una pasada incompleta del benchmark terminó al cerrarse una instancia; causa
  no establecida. La repetición con diagnóstico completa 20/20 con salida 0 y no
  reproduce el cierre. No se declara una corrección de crash sin demostrarla.
- Linux x86_64 primero. No se valida universalidad de distribuciones, Windows/macOS,
  AUR/deb/rpm ni todos los portales gráficos.
- En el namespace de aceptación el montaje FUSE está denegado. La AppImage funciona
  con `APPIMAGE_EXTRACT_AND_RUN=1`, que debe utilizarse en ese entorno. El montaje
  normal con doble clic no se declara validado allí. No se desactiva Chromium
  sandbox para pasar las pruebas nuevas.
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
- La GUI crea CV independientes con los datos personales del perfil, pero no
  ofrece un editor completo del perfil maestro ni selección gráfica de sus secciones.
  La independencia completa se demuestra en aplicación/SQLite; eso no demuestra
  un recorrido de edición de perfil accesible al usuario final (AC-06).
- La GUI exporta proyectos CV y restaura workspace. La copia lógica de workspace
  existe en aplicación, pero no tiene una acción de exportación GUI (AC-08).
  Copiar el directorio completo con la aplicación cerrada es una alternativa
  documentada; no se presenta como el recorrido `.cvproj` workspace solicitado.
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

Los huecos de GUI anteriores deben figurar expresamente en la matriz de producto,
además de las pruebas API que sí pasan. No se improvisa un editor nuevo del perfil
ni una nueva política de copias para aparentar una aceptación completa.

Un PDF escrito antes de un crash puede quedar sin ExportRecord. Es un archivo
válido que el usuario conserva; no se anuncia como registrado, el CV no cambia y
reexportar crea un recibo nuevo. No hay exploración de rutas ni reconciliación
automática de archivos externos. Véase la prueba de fallo en [ACCEPTANCE](ACCEPTANCE.md).
