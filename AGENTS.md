# Estado vigente de preparación pública

Producto público: **CVPass 0.1.0**, autor Alexandru David Raboaca Neagu, GPL-3.0-only.
Rama `release-v0.1.0` desde main saneada `b22c2f9`. Rebranding visible únicamente;
conservar userData `CVForge`, IDs y formatos históricos para no ocultar bibliotecas.
F0–F9 aprobadas; **F10 no iniciada**. No fetch/push, force push, remoto público,
renombrado remoto, tag ni GitHub Release. El servidor aún contiene historia antigua.
No reescribir de nuevo historia. Los backups Git privados nunca se publican.
NF-05 y A/B/C conservados; deuda 50 revisiones/316,6 ms no se resuelve aquí.
Falta el maestro aprobado en `assets/branding/icon-master.png`: no inventar logo;
seguir [preparación](docs/release/PREPARATION.md) y esperar aprobación para publicar.

## Instrucciones e historial conservados

# AGENTS.md

## Proyecto y estado

CVForge es una aplicación local para crear y gestionar CV, generar PDF profesionales e importar proyectos/CV existentes. La investigación funcional de Europass está terminada. La implementación está autorizada por el usuario y debe seguir las fases del roadmap.

Fase actual: **F9 y MVP 0.1.0 APROBADOS definitivamente por el usuario e integrados en `main` mediante merge commit**, preservando todos los commits de `f9-mvp-acceptance`, incluido `36480d1`. **F10 no iniciada; no avanzar sin nueva autorización.** No crear todavía tag v0.1.0 ni GitHub Release. NF-05 vigente: startup p95 ≤3200 ms solo en equipo/corpus/método documentados; Confirmar durable ≤300 ms, restantes límites intactos. Campañas oficiales A/B/C conservadas: startup 3075,6/2995,8/2935,0 y Confirmar 284,2/280,3/275,1; combinado Confirmar 283,0 ms. No repetir para buscar números mejores. Mantener historial original y FAIL anteriores. Deuda pendiente: 50 revisiones, Confirmar p95 316,6 ms por lecturas/copias globales, fuera del corpus oficial; no resolver ahora. Mantener FULL/WAL, ACK durable, privacidad, offline y formatos/plantillas existentes. [Decisión y evidencia](docs/f9/NF05_STARTUP_REVIEW.md). La regresión post-merge debe pasar antes del push.

Estado histórico anterior a la integración: Fase actual: **F9 APROBADA técnicamente tras decisión explícita del usuario: NF-05 startup p95 ≤3200 ms**, revisión posterior a medición del objetivo inicial ≤3000. Tres campañas completas A/B/C: startup 3075,6/2995,8/2935,0 y Confirmar 284,2/280,3/275,1 PASS; Confirmar conserva ≤300 y ningún otro objetivo cambia. Método/muestras/binario intactos, todo el historial PASS/FAIL conservado. [Decisión, AC y evidencia](docs/f9/NF05_STARTUP_REVIEW.md). 222 tests, 33 PDF, GUI/AppImage/FUSE, TypeScript/build, offline y privacidad PASS en la misma candidata. Deuda pendiente: 50 revisiones, Confirmar p95 316,6 ms por crecimiento de lecturas/copias globales, fuera del corpus oficial; optimizar posteriormente sin abrir fase ahora ni debilitar FULL/WAL/ACK durable. Main/origin-main `cc7cf0d`; rama `f9-mvp-acceptance`. **No fusionar ni hacer push a main; no F10, nuevas funciones, tag ni Release. Esperar aprobación posterior para el merge.**

Estado histórico anterior a la revisión explícita: Fase actual: **F9 NO APROBADA: Confirmar reproducible PASS, arranque A FAIL**. Tres campañas independientes de 20 muestras: Confirmar p95 284,2/280,3/275,1 ms ≤300; combinado 60 solo informativo 283,0. Arranque p95 3075,6/2995,8/2935,0 ms: no reemplazar A ni declarar estable el conjunto. Original/candidato intercalados no demuestran una regresión de código; variación física no atribuida. [Método, perfilado y todas las muestras](docs/f9/CONFIRM_REPEATABILITY.md). Mantener FULL/WAL, revisión y borrador resueltos antes del ACK. Escritura acotada solo con prueba exacta bajo generación/data_version; cualquier operación no demostrada conserva la transacción completa. Lecturas/validación globales siguen creciendo con historial: diagnóstico 50 revisiones p95 316,6 ms, separado de aceptación. No bajar umbrales, mover marcadores, borrar FAIL ni modificar energía. 222 tests/UI y 33 PDF, TypeScript/build, AppImage reproducible, FUSE normal, offline/privacidad PASS. Main/origin-main siguen en `cc7cf0d`, rama `f9-mvp-acceptance`. **No fusionar, no push a main, no F10 ni funcionalidades nuevas; esperar aprobación.**

Estado anterior conservado: Fase actual: **F9/MVP 0.1.0 APROBADOS por el usuario en `7088c4c446bf8d8bb887a277065e494ef9aa645c`, integración bloqueada por el control previo**. Main/origin-main permanecen en `cc7cf0d6b4aa56689ec9d0dec22b6aa9e5cba28c`. Nueva medición oficial de 20 procesos/100 CV, mismo artefacto/equipo/corpus/método: arranque p95 **2469,1 ms PASS ≤3000**, Confirmar durable **359,7 ms FAIL >300**; comando exit 1. No se cambia energía, umbral, marcador, FULL/WAL ni producto; no repetir hasta obtener un PASS ni atribuir causalidad sin evidencia. Se conservan la aceptación 1844,4/228,4 ms, FUSE normal 2339,4 ms, Abrir CV 2819,1 ms informativo y los FAIL históricos 3462,3/471,1 ms. 216 tests, 33 PDF, GUI empaquetada/E2E, dos muestras privadas, TypeScript/build, offline/privacidad PASS. La interferencia temporal de `/tmp/.git` y un fallo de foco no atribuido se conservan; repetición original completa 10/10 sin sondas ni retries automáticos. [Control actual](docs/f9/MERGE_VALIDATION.md). F1–F8 y pulido visual siguen integrados; dominio/formatos/plantillas sin cambios. Índice desde estado validado, caché exacta e invariantes globales; revisión/borrador durables antes del ACK. Perfil real y materializaciones independientes. Datos privados nunca en Git/fixtures. **No fusionar ni hacer push a main mientras falle el control; F10 no iniciada. No crear tag ni GitHub Release.**

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
