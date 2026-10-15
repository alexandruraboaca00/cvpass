# CVForge

CVForge será una aplicación local para crear y gestionar CV, importar documentos compatibles y generar PDF profesionales con diseños propios. El objetivo es trabajar sin depender de Europass y conservar proyectos completos y recuperables.

## Estado actual

La investigación de Europass está terminada y las decisiones de producto están consolidadas. La implementación está autorizada por fases. La siguiente fase es **F1: validación técnica**, todavía pendiente de ejecución. Esta consolidación solo actualiza documentación; no hay una aplicación implementada ni instrucciones de instalación/uso del producto.

## Producto definido

- Un perfil maestro y múltiples CV independientes con contenido materializado; cambios y transferencias explícitos.
- Biblioteca local guardada automáticamente; `.cvproj` completo para backup, transferencia entre equipos y continuación del trabajo, incluidas decisiones lingüísticas y revisiones necesarias.
- Una exportación PDF normal. Puede incorporar semántica interna de lo representado, sin secciones ocultas, historial, borradores ni variantes lingüísticas no mostradas. El PDF no sustituye el backup `.cvproj`.
- Traducción real ES/EN: narrativa automática revisable, nombres protegidos y términos sensibles con aprobación reutilizable; recuperación del estado anterior y duplicación opcional.
- Importación con detección automática de proyecto, PDF propio y Europass compatible. PDF genérico avanzado y OCR vendrán después del MVP.

Estas son funcionalidades previstas, no capacidades ya disponibles.

## MVP previsto

Datos personales, educación, experiencia, habilidades, idiomas, certificaciones, proyectos y secciones personalizadas; dos plantillas originales; ES/EN con traducción real; biblioteca durable local; importación Europass estructurada; PDF y `.cvproj`.

## Stack propuesto para validar en F1

Electron, React, TypeScript y Vite; SQLite en worker mediante better-sqlite3; Zod, Tiptap e i18next para validación/edición/interfaz; Chromium para componer PDF y PDF.js para visualizar/importar. pdf-lib es el primer candidato para adjuntos, con qpdf como alternativa si no conserva la calidad requerida. El motor local de traducción ES/EN y sus recursos se seleccionarán/validarán en F1. Linux es el entorno inicial de validación propuesto.

La fase comprobará persistencia, empaquetado, composición/lectura PDF, minimización de datos adjuntos y viabilidad de traducción local. Las dependencias y sus versiones no están todavía validadas como conjunto.

## Documentación vigente

| Documento | Contenido |
| --- | --- |
| [AGENTS.md](AGENTS.md) | Instrucciones y reglas actuales del proyecto. |
| [REQUIREMENTS](docs/REQUIREMENTS.md) | Objetivos, alcance y criterios funcionales/no funcionales. |
| [ARCHITECTURE](docs/ARCHITECTURE.md) | Arquitectura propuesta, límites y puertas técnicas. |
| [DATA_MODEL](docs/DATA_MODEL.md) | Proyecto privado completo, idiomas y modelo reducido de exportación. |
| [ROADMAP](docs/ROADMAP.md) | Fases pequeñas y criterios para avanzar. |
| [Investigación histórica](docs/research/) | Evidencia funcional de Europass, con sus límites y propuestas originales. |

Los diseños, código y recursos del producto serán propios o tendrán licencia compatible. Los CV personales y artefactos privados de investigación quedan fuera de Git; los tests usarán datos sintéticos.
