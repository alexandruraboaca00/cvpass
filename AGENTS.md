# AGENTS.md

## Proyecto y estado

CVForge es una aplicación local para crear y gestionar CV, generar PDF profesionales e importar proyectos/CV existentes. La investigación funcional de Europass está terminada. La implementación está autorizada por el usuario y debe seguir las fases del roadmap.

Fase actual: **F7 — plantilla Simple y preview PDF.js, aprobada por el usuario e integrada en `main` mediante merge commit desde `f7-simple-template-preview`**, con base `7230814`. F1–F7 permanecen aprobadas e integradas. F1 cerrada salvo regresión directa. La preview y la exportación usan los mismos bytes PDF finales desde RenderSnapshot congelado; una columna, recursos locales y contenido visible. No Lateral, dos columnas, OCR, PDF genérico, motor automático definitivo ni F8. Datos privados nunca en fixtures/Git. F8 no iniciada; no comenzarla sin nueva autorización del usuario.

Trabajo actual: **pulido visual independiente `ui-visibility-polish`**, desde main `8ff5e69`, sin fusionar hasta aprobación. Solo UI/CSS y validación: tema claro, contraste, modales y visor. No modifica el PDF Simple ni los contratos de F1–F7. [Alcance y validación](docs/ui/VISIBILITY_POLISH.md). F8 no iniciada.

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
