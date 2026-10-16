# CVForge

CVForge será una aplicación local para crear y gestionar CV, importar documentos compatibles y generar PDF profesionales con diseños propios. El objetivo es trabajar sin depender de Europass y conservar proyectos completos y recuperables.

## Estado actual

La investigación de Europass está terminada y las decisiones de producto están consolidadas. **F4 tiene el editor de datos personales, educación y experiencia en `f4-core-editor`, pendiente de aprobación e integración por el usuario**. [Implementación](docs/f4/EDITOR.md), [validación](docs/f4/VALIDATION.md). F1/F2/F3 están aprobadas e integradas en `main`; F1 permanece cerrada. F5 no se ha iniciado. El MVP completo sigue pendiente.

## Producto definido

- Un perfil maestro y múltiples CV independientes con contenido materializado; cambios y transferencias explícitos.
- Biblioteca local guardada automáticamente; `.cvproj` completo para backup, transferencia entre equipos y continuación del trabajo, incluidas decisiones lingüísticas y revisiones necesarias.
- Una exportación PDF normal. Puede incorporar semántica interna de lo representado, sin secciones ocultas, historial, borradores ni variantes lingüísticas no mostradas. El PDF no sustituye el backup `.cvproj`.
- Traducción real ES/EN: narrativa automática revisable, nombres protegidos y términos sensibles con aprobación reutilizable; recuperación del estado anterior y duplicación opcional.
- Importación con detección automática de proyecto, PDF propio y Europass compatible. PDF genérico avanzado y OCR vendrán después del MVP.

Esta lista describe el producto completo; las capacidades implementadas y sus límites se registran por fase.

## MVP previsto

Datos personales, educación, experiencia, habilidades, idiomas, certificaciones, proyectos y secciones personalizadas; dos plantillas originales; ES/EN con traducción real; biblioteca durable local; importación Europass estructurada; PDF y `.cvproj`.

## Stack y validación técnica F1

Electron, React, TypeScript y Vite; SQLite en worker mediante better-sqlite3; Zod y Tiptap para validación/edición. i18next sigue propuesto para las fases de idiomas. Chromium/PDF.js y el payload PDF tienen su validación técnica F1; su integración completa en el editor conserva las fases del roadmap. Zod está integrado desde F2 y Tiptap limitado al árbol del dominio desde F4. La traducción ES/EN conserva su exploración previa y queda fuera del criterio de cierre F1 por decisión final del usuario.

El resultado acotado y las versiones concretas del spike figuran en el registro F1. La integración del producto completo sigue el roadmap.

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

## Dominio y formato inicial F2

`src/domain` contiene entidades, fechas, idiomas A/B/C, revisiones y proyección
visible; `src/adapters` contiene el codec `.cvproj` CV/workspace versionado en
memoria. No depende del spike F1 ni ejecuta su traductor.

```bash
npm ci
npm test
npm run typecheck
npm run build
```

[Implementación y límites](docs/f2/IMPLEMENTATION.md), [formato](docs/f2/CVPROJ.md)
y [aceptación](docs/f2/VALIDATION.md). Las operaciones de guardado automático y
restauración de biblioteca están implementadas en F3 mediante puertos de aplicación
y un adaptador SQLite en worker, conservando los contratos F2.

## Persistencia F3

[Esquema, decisiones y límites](docs/f3/PERSISTENCE.md), [validación](docs/f3/VALIDATION.md).
`src/application` contiene los casos de biblioteca, borradores y checkpoints;
`src/host/local-library.ts` recibe exclusivamente la capacidad userData de Electron.
Los tests usan SQLite real y datos sintéticos fuera del repositorio.

```bash
npm run test:f2
npm run test:f3
CVFORGE_F1_OUTPUT=/tmp/cvforge-f3-f1-regression-final npm run test:f1
```

El harness opcional `npm run validate:f3:electron` reutiliza una copia del runtime
Linux ya instalado de F1, con otra aplicación técnica y sin modificar el spike.
No es una dependencia de producción. `scripts/f3-offline-check.mjs` requiere
iniciarse dentro de un namespace Linux sin red; procedimiento en el registro F3.

## Editor F4

```bash
npm run setup:electron
npm run build
npm start
```

La aplicación abre la biblioteca real bajo `userData` de Electron. No carga datos
sintéticos en producción. Confirmar/Cancelar, foto, periodos parciales, texto
enriquecido, inclusión y orden reutilizan dominio/persistencia F2/F3. Para probar:

```bash
npm run test:f4
npm run test:f4:ui
npm run validate:f4:offline
```

Las pruebas UI necesitan una sesión gráfica Linux. El ensayo offline usa
`unshare`, `ip` y loopback exclusivamente para CDP local. No ejecutar dos suites
de UI a la vez sobre el mismo escritorio si se quiere comprobar el foco.
El [registro F4](docs/f4/VALIDATION.md) detalla método, límites y resultados.
