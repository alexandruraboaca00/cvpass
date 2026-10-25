> **Integración definitiva del MVP 0.1.0 aprobada por el usuario:** F9 se integra
> en `main` mediante merge commit, sin squash ni reescribir historia. Las campañas
> A/B/C y NF-05 vigente (startup ≤3200, Confirmar ≤300) no cambian ni se repiten.
> Se conserva la deuda de 50 revisiones/316,6 ms y todo el historial siguiente.
> Regresión post-merge obligatoria antes de push. **F10 no iniciada; sin tag ni
> GitHub Release.** Las referencias siguientes a «pendiente de aprobación» o
> «sin fusionar» describen el estado histórico anterior a esta integración.

# F9 — Revisión explícita del objetivo NF-05 de startup

25/10/2026. **F9 = APROBADA técnicamente con la especificación revisada por el
usuario.** Rama `f9-mvp-acceptance`, sin fusionar ni hacer push a main. F10 no
iniciada. Hace falta aprobación posterior para integrar; no se crea tag/Release.

## Decisión posterior a medición real

| Objetivo | Inicial | Vigente para el MVP |
| --- | --- | --- |
| Startup p95 | ≤3000 ms | **≤3200 ms**, equipo/corpus/método de referencia F9 |
| Confirmar durable p95 | ≤300 ms | **≤300 ms, sin cambios** |
| Resto de NF-05 | Valores iniciales | Sin cambios |

3000 ms era un objetivo inicial fijado antes de disponer de mediciones. La
aceptación de F9 en ROADMAP permite corregir o revisar explícitamente objetivos
no alcanzados antes de aceptar el MVP. El usuario toma esta decisión después
de revisar las tres campañas completas, no antes de medir ni modificando su
método para obtener un resultado favorable.

La variación observada no pudo atribuirse a una regresión concreta. Un mismo
binario produjo campañas a ambos lados de 3000 ms. Las optimizaciones relevantes
ya se realizaron y se validaron. El usuario considera desproporcionado el riesgo
de seguir modificando arquitectura para arañar los **75,6 ms** que excede el peor
p95 final, frente al impacto real de producto. **3200 ms mantiene prácticamente
la intención original**, sin cambiar durabilidad ni el límite de Confirmar.

No es el objetivo original. Se conserva íntegramente su historial: startup
~2594 ms; FAIL 3462,3; PASS 1844,4/2469,1; las campañas A/B/C y sus clasificaciones
originales. El FAIL 3462,3 también excede 3200. Confirmar conserva 471,1 FAIL,
261,3/236,9/228,4 PASS, 359,7 FAIL y las tres campañas finales. No se reescriben
los recibos antiguos, sus códigos de salida o sus conclusiones de aquel momento.

## Reevaluación de AC-09: PASS

[Evidencia principal original](evidence/confirm-repeatability.json),
[reevaluación separada y versionada](evidence/nf05-startup-review.json),
[método congelado](CONFIRM_REPEATABILITY.md). Se recalcula nearest-rank desde
las muestras sin excluir ninguna. Mismo equipo, binario, corpus y método, veinte
procesos/perfiles nuevos en cada campaña. No se ejecuta otra campaña ni se
sustituyen resultados. Cachés SO/runtime sin vaciar, exactamente como antes.

| Campaña | n | Startup p95 ms | ≤3200 | Confirmar p95 ms | ≤300 |
| --- | ---: | ---: | --- | ---: | --- |
| A | 20 | 3075,6 | PASS | 284,2 | PASS |
| B | 20 | 2995,8 | PASS | 280,3 | PASS |
| C | 20 | 2935,0 | PASS | 275,1 | PASS |

Confirmar combinado de 60: p95 **283,0 ms**, solo informativo. La aceptación
requiere las tres campañas individuales, no el combinado. Todos los demás
presupuestos medidos mantienen sus límites y resultados PASS. Offline PASS:
namespace sin rutas externas, solo loopback/CDP, ENETUNREACH externo, CapEff=0,
sandbox Chromium activo y flujos sin peticiones externas.

El runner congelado y `f9-campaign-summary.mjs` conservan su criterio histórico
3000 y el SHA original. Su resultado antiguo no se presenta como si hubiera
usado 3200. La evaluación vigente es una capa posterior explícita sobre las
mismas muestras: únicamente sustituye el presupuesto **startup** por 3200;
comprueba que el resto no cambia. Para reproducir una evaluación futura hay
que aplicar esta política versionada a la salida del método congelado; no usar
su clasificación histórica de startup como si fuese el requisito vigente.

La comprobación documental verifica identidad de runner/corpus/equipo/binario,
20 muestras por campaña, p95 recalculados, presupuestos restantes, offline,
AppImage y recibos funcionales. Comprueba además que la parte de la fila NF-05
desde «respuesta al escribir» permanece byte-idéntica a `fa2d509`.

## AC-01…AC-10 y regresión

Se reevalúan los diez AC sobre la misma candidata y sus recibos completos
[evidencia funcional](evidence/confirm-validation.json); no se afirma haber
repetido en esta decisión las suites GUI/PDF ni la campaña privada.

| AC | Resultado final | Evidencia |
| --- | --- | --- |
| AC-01 | PASS, subconjunto probado | Dos Europass privados: cantidades/valores, contactos/foto y reapertura; originales intactos. |
| AC-02 | PASS | Simple/Lateral → bibliotecas vacías; PDF visible y `.cvproj` completo declarado. |
| AC-03 | PASS | GUI Confirmar/Cancelar A/B, persistencia y ausencia de draft cancelado. |
| AC-04 | PASS | SIGKILL, recuperar/descartar y separación confirmado/borrador. |
| AC-05 | PASS, manual vigente | Original/traducción/ambos, revisión y obsolescencia sin perder el original. |
| AC-06 | PASS GUI | Perfil maestro, materialización selectiva independiente A/B y reapertura. |
| AC-07 | PASS | 33 PDF, Simple/Lateral, 48 párrafos, glifos/enlaces/foto; SHA preview/export idéntico. |
| AC-08 | PASS GUI | Workspace exportar/restaurar/reabrir, assets/revisiones; Cancelar y fallo de disco sin éxito falso. |
| AC-09 | **PASS, criterio revisado** | Tres startup ≤3200, tres Confirmar ≤300 y offline; método intacto. |
| AC-10 | PASS en corpus probado | Límites/corruptos/futuros y privacidad del payload/fuentes. |

Última regresión completa sobre el mismo binario: **222 tests PASS** (F1 3,
dominio/aplicación/SQLite 186, UI/layout 23 y GUI AppImage 10), 33 PDF, TypeScript/
build, E2E empaquetado, FUSE normal, offline y privacidad PASS. En esta revisión
solo se modifican documentos y un recibo derivado; se repiten los 186 tests de
dominio/aplicación/SQLite y las comprobaciones documentales. No se toca el código
de producto ni se reconstruye innecesariamente la candidata byte-idéntica.

## Deuda de historial conservada, sin abrir otra fase

**50 revisiones acumuladas: Confirmar p95 316,6 ms.** Diagnóstico con trazas y
proceso reutilizado, fuera del corpus oficial de aceptación MVP. Lecturas/copias
y validación globales crecen con el historial; las escrituras de Confirmar están
acotadas, pero no todo su coste. **Debe optimizarse posteriormente.** No se
resuelve ahora, no se oculta, no se amplía el límite de Confirmar y no se declara
NF-05 para cualquier tamaño de historial. [Muestras](evidence/confirm-history-profile.json).
Abrir CV C p95 2100,6 ms sigue informativo, sin inventar umbral.

## Candidata sin cambios

`out/f9/CVForge-0.1.0-x86_64.AppImage`, **159764395 bytes**.
SHA-256: `6f07c8418392f00e98104b041885d20a1b1aa50653e9ce9dc6512451eec707f3`.
Las dos reconstrucciones idénticas y su validación previa siguen vigentes. La
verificación actual confirma bytes/hash sin cambios. No hay merge/push a main,
F10, nueva funcionalidad, tag ni GitHub Release.
