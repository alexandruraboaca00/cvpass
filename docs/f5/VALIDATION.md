# F5 — Validación de áreas e idiomas

17 de octubre de 2026. Rama `f5-mvp-sections-languages`, sin fusionar.
**F5 = APROBADA técnicamente con el alcance autorizado.** Pendiente aprobación
del usuario para fusionar. Motor automático de producción pendiente según su
excepción explícita; no se declara terminado el MVP.
Alcance: [IMPLEMENTATION.md](IMPLEMENTATION.md). No se inicia F6.

## Base y procedimiento

Se leyeron completas las versiones actuales de AGENTS, REQUIREMENTS, ARCHITECTURE,
DATA_MODEL, ROADMAP y los documentos requeridos F2/F3/F4 antes de programar.
`main` limpio, una única worktree, `HEAD = main = origin/main = ls-remote origin/main`:
`a43e7f86a5af17a9b532a2c711c89dc0de4ce479`. F1 3/3, F2 30/30, F3 39/39,
F4 13/13 y UI F4 4/4 pasaron antes de crear la rama.

Exclusivamente datos sintéticos, SQLite real en worker y directorios de prueba
externos. Los tests Node comparan el CV completo después de cerrar el repositorio
y abrir otra instancia; no sustituyen SQLite por un mock. Los tests UI ejecutan
el build Electron real con preload/host, controlan formularios por labels,
botones y teclado mediante CDP y crean otro proceso con el mismo userData.
Finalmente abren otra conexión y revisan integridad/foreign keys/estado exacto.

El harness mantiene la elección F4: `--no-sandbox` solo para estas pruebas Linux,
CDP loopback, sin inspector Node. El producto no añade ese flag en `npm start`.
Las suites gráficas se ejecutan en secuencia. Se capturan errores de renderer,
solicitudes HTTP(S), logs de ciclo de vida sin contenido y screenshots sintéticos;
ninguna base, perfil Electron, imagen privada o proyecto de prueba va a Git.

## Los 32 criterios pedidos

Las referencias N-D/N-E/N-I designan `tests/f5-domain.test.ts`,
`f5-editor.test.ts`, `f5-i18n.test.ts`; U1–U4 corresponden en orden a los cuatro
casos de `tests/ui/f5.spec.ts`. Cada caso contiene varias aserciones.

| N.º | Criterio | Estado | Evidencia |
| --- | --- | --- | --- |
| 1 | Crear habilidades libres | PASS | N-D operaciones tipadas; N-E y U1 crean habilidades desde formulario. |
| 2 | Dos grupos con IDs propios | PASS | N-D/N-E, U1: nombres, mapas y `groupOrder` se conservan. |
| 3 | Mover habilidad entre grupos | PASS | N-D/N-E/U1: cambia pertenencia y listas en una operación, sin duplicar. |
| 4 | Desagrupar sin eliminar | PASS | U1 Python → Prácticas → Sin agrupar; ID/datos y cardinalidad conservados. |
| 5 | Eliminar grupo conserva habilidades | PASS | N-D/N-E/U1: al final de Sin agrupar en orden relativo, tras confirmación explícita. |
| 6 | Orden sobrevive al reinicio | PASS | N-E/U1: grupos/listas por ID iguales al reabrir; botones Enter; comparación completa del CV. |
| 7 | Varias lenguas maternas | PASS | N-E/U2: ES y RO como entradas distintas. |
| 8 | Cinco dimensiones independientes | PASS | N-E/U2: cinco valores distintos sin campo global. |
| 9 | Solo Listening B1, resto null | PASS | N-E/U2: igualdad exacta `{listening:'B1',reading:null,spokenInteraction:null,spokenProduction:null,writing:null}` después de otro proceso. |
| 10 | Materna no equivale a C2 | PASS | N-E/U2: ausencia de `proficiency` en nativas, sin C2 generado. |
| 11 | Varias certificaciones | PASS | N-E/U3: dos entradas independientes con emisor, fecha parcial y modalidad. |
| 12 | Original C intacto | PASS | N-D/N-E/U3/U4: aprobar/cambiar idioma no sustituye la fuente por una equivalencia. |
| 13 | Traducción C aprobada durable | PASS | N-E/U3: memoria privada y selección sobreviven a SQLite/reapertura. |
| 14 | Editar original marca aprobación obsoleta | PASS | N-D/N-E/U3: estado stale, valor aprobado anterior intacto; también dentro del mismo padre. |
| 15 | Varios proyectos | PASS | N-E/U3: dos proyectos con IDs propios, reapertura íntegra. |
| 16 | Periodo/Actualmente | PASS | N-E/U3 y regresión F4: año/mes/día, fin solo, Currently sin fecha inventada. |
| 17 | Enlaces | PASS | N-E/U3: URL válida literal y rechazo de javascript; árbol semántico/marcas conservados. |
| 18 | Dos secciones personalizadas | PASS | N-E/U3: Hackathons e Investigación coexisten. |
| 19 | Varias entradas por personalizada | PASS | N-E/U3: dos por sección sin reconstruir las otras. |
| 20 | IDs/órdenes independientes | PASS | N-E/U3: secciones/entradas distintas, inversión de una lista y comparación tras reiniciar. |
| 21 | Ocultar conserva datos | PASS | N-E/U3 y F2: included=false conserva datos, excluye de proyección visible; mostrar revierte. |
| 22 | Confirmar hijo + Cancelar padre | PASS | N-E/U1/U3: ni grupo/habilidad ni aprobación quedan confirmados o recuperables. |
| 23 | Interfaz ES / documento EN | PASS | N-E/U4: documento confirmado en inglés con etiquetas españolas. |
| 24 | Interfaz EN / documento ES | PASS | N-E/U4: interfaz inglesa persiste, restaurar CV español no cambia UI. |
| 25 | ES→EN prepara plan | PASS | N-D/N-E/U4: propuestas temporales, originales y lista B, antes de mutar. |
| 26 | Nombres/instituciones B se conservan | PASS | N-D/U4: Universidad Sintética, Microsoft, contacto/URL y OpenSynth protegido; fuente y estructura intactas. |
| 27 | Reutilizar variantes C aprobadas | PASS | N-D/N-E/U4: coincidencia exacta de fuente/revisión/contexto/destino; no nueva aprobación artificial. |
| 28 | Variantes obsoletas señaladas | PASS | N-D/N-E/U3: cambio de fuente/contexto no elimina aprobación; plan exige revisión. |
| 29 | Original / traducción / ambos | PASS | N-D comprueba los tres modos y orden; N-E minimización; U3/U4 revisión con traducción + original. |
| 30 | Checkpoint anterior al cambio | PASS | N-E/U4: snapshot español exacto, beforeTranslation/pinned en la misma transacción y `.cvproj`; restaurar crea revisión nueva. |
| 31 | Cancelar plan no cambia CV | PASS | N-E/U4: igualdad profunda de CV/idioma, sin checkpoint nuevo ni recuperación cancelada. |
| 32 | Reiniciar conserva resultado confirmado | PASS | N-E/U1–U4: nuevos procesos/conexiones, comparación exacta e integridad SQLite. |

## Invariantes adicionales

- Plan inmutable reconstruido en host: rechaza rutas/originales/B cambiados desde
  renderer, aprobación incompatible o base obsoleta. Conflicto no crea checkpoint.
- `TranslationProvider` de prueba solo recibe A elegida sin fragmentos B y C
  pendientes. No recibe nombres de organización de contexto, CV/IDs privados,
  perfil, otros CV, fotos, rutas o memorias completas. Respuesta incompleta,
  cancelación o error conserva todo y no filtra el mensaje del proveedor.
- A conserva solo texto/idioma activo; mantener fuente explícitamente conserva
  su locale real. No se inventa un original desconocido ni una aprobación.
- Spans UTF-16 y texto enriquecido: límites, marcas, listas, enlaces, nombres
  entre varios nodos, reubicación explícita tras editar, solapes/términos ausentes
  y falsos positivos por códigos/sílabas probados.
- Revisión sensible seleccionando original mantiene asociación válida y permite
  detectar después una modificación de fuente. Aprobaciones previas inmutables.
- Catálogo ES/EN con cobertura de mensajes estáticos/mapas y parámetros; cambiar
  UI con autosave pendiente espera el flush y no cambia el confirmado.
- Template v1 inmutable para historia; nueva capacidad v2 y `.cvproj` con ambas
  versiones cuando son necesarias. Ninguna plantilla final implementada.
- Ocultar/contraer/eliminar siguen separados; F4 comprueba que contraer no
  incrementa revisión ni cambia inclusión. Eliminar conserva historia F3.

## Comprobaciones y artefactos

```bash
npm test
npm run typecheck
npm run build
npm run test:f4:ui
npm run test:f5:ui
npm run validate:f5:offline
CVFORGE_F1_OUTPUT=/tmp/cvforge-f5-f1-regression npm run test:f1
```

| Comprobación | Resultado de cierre |
| --- | --- |
| Node F2 | 30/30 PASS. |
| Node F3 | 39/39 PASS, SQLite/transacciones/migraciones/crash/recursos/portabilidad reales. |
| Node F4 | 13/13 PASS. |
| Node F5 | 32/32 PASS, dominio/aplicación/i18n. |
| Node total | 114/114 PASS, cero omitidos/cancelados/pendientes. |
| TypeScript / build | PASS, compilación estricta y bundle local. |
| UI F4/F5 final | 4/4 + 4/4 PASS sobre `76ca0ad`, nuevos procesos reales y cero errores de renderer/HTTP(S). |
| Offline F4/F5 y Node F5 | 4/4 + 4/4 + 32/32 PASS, solo lo y TCP externo ENETUNREACH. |
| Paquete F1 / PDF / payload | 3/3 PASS, regeneración offline del paquete existente; 9 páginas Simple y 7 Lateral, plain/exported/stripped idénticos por página. Traducción no ejecutada. |
| Reapertura / SQLite | PASS en todas las reaperturas reales: integrity=ok y cero violaciones FK. |
| Motor automático de producción | pendiente de producto, sin bloquear F5 por la instrucción final del usuario. |

[evidence.json](evidence.json) conserva el resumen comprobado automáticamente
sobre código `76ca0ad9c6174f3ae4049773d78b48e2139f8027`. Logs e imágenes finales en
`/tmp/cvforge-f5-closure/revision-f4-ui` y `revision-f5-ui`; Node/build en
`node-source-locale.log`, TypeScript en `typecheck-source-locale.log`. Offline final
en `/tmp/cvforge-f5-closure/offline-final` y `offline-final.log`. La evidencia F1
regenerada está en `/tmp/cvforge-f5-f1-regression` con su offline-proof, recepciones
y PDFs sintéticos. El spike F1 y los registros históricos F1–F4 no se modifican. El código compartido
evoluciona con los cambios F5 descritos.

## Ensayo offline

El método de `scripts/f5-offline-check.mjs` es el namespace Linux real validado
en F4: `unshare --user --map-root-user --net`, con `ip link set lo up` antes
de exec. Solo se habilita loopback para CDP. Se exige una única interfaz lo,
tabla de rutas vacía y error ENETUNREACH al intentar TCP `1.1.1.1:443`.

El script ejecuta secuencialmente cuatro casos UI F4, cuatro UI F5 y los tests
Node F5. Escribe `network-proof.json` con salidas reales. Cualquier fallo detiene
el ensayo y no se declara PASS. Comprueba arranque, biblioteca, edición,
Confirmar/Cancelar, foto, grupos/CEFR, revisión sensible, traducción manual,
checkpoint, reapertura, crash/recuperación F4 e integridad, sin proveedor remoto.

**Resultado final: PASS.** Solo interfaz lo, ninguna ruta externa y TCP a
1.1.1.1:443 = ENETUNREACH. Ocho flujos UI y 32 tests Node F5 pasan; cero solicitudes
HTTP(S) observadas desde las aplicaciones. Esta prueba no valida un motor
automático que no está instalado. F5 usa traducción/revisión manual y recursos
locales. El control con red y el ensayo aislado se ejecutaron secuencialmente.

La regresión empaquetada F1 se regeneró sin alterar el spike:

```bash
CVFORGE_F1_OUTPUT=/tmp/cvforge-f5-f1-regression \
  unshare --user --map-current-user --net node spikes/f1/offline-check.cjs
```

Crear y reabrir terminaron con exit 0, networkAttempts=0, SQLite ok y los
tres tests F1 con exit 0. Su recibo indica `translationExecuted=false`.

## Problemas investigados y límites

- Un indicador C validaba el título vacío de una entrada nueva al renderizar.
  Se corrigió para admitir estado de borrador; Confirmar sigue validando. Crear
  educaciones/certificaciones desde campos vacíos está cubierto en UI.
- Las etiquetas de select contenían opciones y dificultaban su identificación
  exacta. Ahora son labels asociados separados; las pruebas realizan movimientos
  y CEFR por esos controles reales.
- Una aserción de test usaba Object.values para inferir orden de entradas; se
  cambió a `entryOrder`, que ya era la fuente de orden persistida del producto.
- Se corrigieron revisión de memoria dentro del mismo padre, coincidencias B
  por subcadena y la falsa asignación de locale destino a narrativa conservada.
- Pasadas intermedias compartían logs. La evidencia de cierre usa ejecuciones
  secuenciales sobre código fijo, rutas separadas y códigos de salida comprobados.
  Se cerraron dos procesos sintéticos huérfanos de los primeros timeouts; el
  harness añade limpieza al salir y límite por acción.
- La inspección visual detectó un contador de revisión obsoleto en la biblioteca tras restaurar. Se actualiza desde el resultado confirmado sin cambiar el CV ni hacer otra escritura. La prueba UI compara ahora ese contador con la revisión real.
- La reclasificación A/B/C conserva el idioma de la fuente aunque el CV ya esté en otro idioma; se comprueba en dominio y UI ES→EN.
- No hay motor automático de producción: selección, calidad, licencia de pesos,
  worker y empaquetado pendientes por la excepción explícita de F5. El puerto
  sintético no acredita esa capacidad ni el cumplimiento automático del MVP.
- Permanecen accesibilidad completa, PNG, rendimiento de bibliotecas grandes,
  reparación SQLite y otras plataformas, y avisos Vite/VA-API/Poppler/ONNX en sus
  fases. No se ampliaron importadores, PDF final, cloud, V1 ni F6.

Los 32 criterios solicitados están en PASS; no hay FAIL arquitectónico conocido
para el alcance autorizado. **F5 = APROBADA.** Se conserva la deuda indicada,
especialmente el motor automático de producto. La rama queda sin fusionar; la
autorización del usuario sigue pendiente. F6 no se ha iniciado.
