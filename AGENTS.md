# AGENTS.md

## Proyecto y estado

CVForge es una aplicación local para crear y gestionar CV, generar PDF profesionales e importar proyectos/CV existentes. La investigación funcional de Europass está terminada. La implementación está autorizada por el usuario y debe seguir las fases del roadmap.

Fase actual: **F9 — APROBADA técnicamente tras corregir startup, pendiente de nueva aprobación del usuario**, en `f9-mvp-acceptance` desde `main` `cc7cf0d6b4aa56689ec9d0dec22b6aa9e5cba28c`. F1–F8 y el pulido visual siguen integrados; no reabrirlos salvo regresión directa. Startup oficial p95 **1844,4 ms ≤3000**, Confirmar durable **228,4 ms ≤300**, mismo corpus de 100 CV/20 procesos; FUSE normal adicional p95 2339,4 ms/20 aperturas. 216 tests, 33 PDF, dos muestras privadas, TypeScript/build, AppImage 0.1.0 reproducible/offline PASS. Se conservan 2594,1 ms, regresión 3462,3 ms y Confirmar inicial 471,1 ms. [Matriz](docs/f9/ACCEPTANCE.md), [perfilado y garantías](docs/f9/STARTUP_PROFILING.md). Índice ligero desde estado completamente validado; caché solo por valores exactos e invariantes globales, FULL/WAL y revisión/borrador durables antes del ACK. Ventana e IPC esperan servicios; snapshot/PDF/formatos no cambian. No atribuir los 870 ms a un único commit sin prueba; la misma AppImage anterior varió entre mediciones. Perfil real sin presentación/documentLocale; materialización independiente. Traducción manual revisable vigente, sin motores nuevos. Datos privados nunca en Git/fixtures. **No fusionar, no hacer push a main ni comenzar F10. Esperar la nueva aprobación del usuario.**

Pulido visual independiente **aprobado por el usuario e integrado en `main` mediante merge commit desde `ui-visibility-polish`**, con base `8ff5e69`. Solo UI/CSS y validación: tema claro, contraste, modales y visor. No modifica el PDF Simple ni los contratos de F1–F7. [Alcance y validación](docs/ui/VISIBILITY_POLISH.md), [revisión completa de layout](docs/ui/LAYOUT_REVIEW.md). Mantener esa UI durante F9.

## Especificación vigente

Leer y mantener coherentes:

- [docs/REQUIREMENTS.md](docs/REQUIREMENTS.md)
- [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md)
- [docs/DATA_MODEL.md](docs/DATA_MODEL.md)
- [docs/ROADMAP.md](docs/ROADMAP.md)

Las decisiones finales del usuario prevalecen sobre propuestas anteriores. `docs/research/` es evidencia histórica: sus dudas, propuestas y referencias de fase no sustituyen la especificación actual. Separar hechos observados, decisiones nuestras y validaciones pendientes.

## Reglas de producto

- Perfil maestro y CV materializados independientes; transferencias siempre explícitas.
- Biblioteca local automática; `.cvproj` es el formato completo y fiable para backup, transferencia y continuidad, con las revisiones necesarias.
- Exportar → PDF ofrece un PDF normal. Sus datos internos, si existen, solo representan esa exportación: nunca ocultos, contenido excluido, historial, borradores, perfil, otros CV o alternativas lingüísticas no mostradas.
- Cambiar idioma traduce el CV realmente: A narrativa traducible, B nombres/identificadores protegidos, C términos sensibles revisados y reutilizables. Antes de aplicar, conservar una revisión recuperable; permitir duplicar antes. No guardar permanentemente toda variante narrativa por defecto.
- Detectar automáticamente `.cvproj`, PDF propio, Europass compatible y PDF normal; genéricos avanzados/OCR siguen en fases posteriores.
- Diseños y recursos propios o con licencia compatible. No copiar código, CSS, imágenes, fuentes, iconos o recursos propietarios de Europass.

## Arquitectura y trabajo por fases

- Mantener dominio y contratos separados de UI, Electron, persistencia, motor PDF y motor de traducción. Los adaptadores implementan puertos del dominio.
- Mantener funcionamiento local, durabilidad y privacidad; no enviar contenido a servicios externos de forma implícita.
- Seguir el orden/dependencias del ROADMAP. No avanzar de fase sin cumplir y documentar sus criterios de aceptación; investigar fallos y actualizar decisiones antes de extender una base no validada.
- El stack sigue propuesto hasta superar F1; no presentar decisiones técnicas ni funcionalidades sin probar como terminadas.
- Usar datos sintéticos propios en tests. No versionar CV personales, PDF privados, credenciales, bases locales, perfiles de navegador o artefactos temporales. Los guiones históricos de investigación no son dependencias de producción/tests.
- Revisar los cambios, ejecutar comprobaciones adecuadas y actualizar estos documentos cuando cambie una decisión arquitectónica, su motivo o su validación.
- No modificar evidencia histórica para que aparente demostrar una decisión de diseño nueva.
