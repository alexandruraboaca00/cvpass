# AGENTS.md

## Proyecto y estado

CVForge es una aplicación local para crear y gestionar CV, generar PDF profesionales e importar proyectos/CV existentes. La investigación funcional de Europass está terminada. La implementación está autorizada por el usuario y debe seguir las fases del roadmap.

Fase actual: **F6 — importación estructurada y revisable, en implementación autorizada en `f6-structured-import`**. F1–F5 están aprobadas e integradas en `main` (`238dee3`). F1 permanece cerrada salvo regresión directa de sus invariantes. F6 cubre `.cvproj`, payload propio compatible y Europass estructurado PDF/XML, con propuesta sin guardado y confirmación transaccional. Datos y PDF privados solo para aceptación local, nunca fixtures ni contenido versionado. No reconstruir PDF por texto, no OCR ni F7. El contrato TranslationProvider y el flujo manual/offline F5 se conservan; motor automático definitivo y deuda anterior fuera de este alcance. No fusionar F6 sin aprobación del usuario.

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
