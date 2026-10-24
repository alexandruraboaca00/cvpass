# Perfilado de Confirmar — corrección de bloqueos F9

El cierre inicial sigue registrado: Confirmar durable p95 **471,1 ms**, con 100 CV y 20 repeticiones oficiales. No cumplía NF-05 ≤300 ms. Este documento añade el diagnóstico y no sustituye aquella evidencia. El benchmark oficial posterior se registra en PERFORMANCE.md cuando se haya ejecutado.

Diagnóstico local: misma máquina/corpus sintético `f9Workspace(100)`, CV medio, Electron empaquetado, pantalla virtual X11, 10 confirmaciones por proceso. Antes de cronometrar se prepara y hace flush del borrador, igual que en el límite IPC oficial. Este diagnóstico permite iterar; no equivale a los 20 procesos nuevos del benchmark oficial.

| Iteración | p50 ms | p90 ms | p95/máximo ms | Evidencia local |
|---|---:|---:|---:|---|
| Instrumentación, sin optimizar | 401,9 | 443,7 | 463,0 | `/tmp/cvforge-f9/confirm-profile-before/results.json` |
| Evitar relecturas/respuesta global y recursos vacíos | 338,0 | 498,4 | 551,9 | `/tmp/cvforge-f9/confirm-profile-opt1/results.json` |
| Transporte interno V8 y JSON SQLite sin ordenar claves | 287,3 | 331,6 | 407,0 | `/tmp/cvforge-f9/confirm-profile-opt2/results.json` |
| Reutilización de validación local por valores exactos | 184,4 | 243,2 | 467,0 | `/tmp/cvforge-f9/confirm-profile-opt3/results.json` |
| Preparar la caché durante la apertura validada | 179,3 | 220,2 | 244,9 | `/tmp/cvforge-f9/confirm-profile-opt4/results.json` |

Se conservan los picos y las iteraciones fallidas. En la tercera iteración la primera confirmación aún inicializaba la caché: se trasladó esa preparación a la apertura. Ningún dato se considera confirmado antes de la transacción durable.

## Causa y límites de las medidas

Antes de optimizar, p95 por etapa: validación completa del almacenamiento 136,7 ms; copias acumuladas de lecturas 135,1 ms; preparar la respuesta mediante relecturas 78,1 ms; serialización canónica SQLite 41,6 ms; clon de envío 35,4 ms. Estas medidas se solapan jerárquicamente y sus p95 no se deben sumar. El coste exterior a la función transaccional de SQLite (BEGIN + COMMIT durable) fue 3,6 ms: no era el cuello de botella. No se afirma medir directamente cada llamada fsync del kernel.

La última iteración registra validación 102,9 ms, copia de lectura 20,3 ms, clon de envío 17,7 ms, serialización SQLite 12,1 ms, cuerpo de transacción 38,0 ms, BEGIN/COMMIT durable 5,2 ms y respuesta desde el resultado confirmado 0,1 ms.

Instrumentación optativa `CVFORGE_CONFIRM_TRACE`: solo nombres de etapas, duraciones y tiempos numéricos de los límites IPC, sin IDs, valores personales ni rutas de documentos. `scripts/f9-confirm-profile.mjs` conserva muestras y distribución por etapa. No está activada en uso normal. La medición de frame del diagnóstico es informativa; el recorrido de formulario real y el trabajo posterior de UI se comprueban adicionalmente mediante GUI.

## Cambios y garantías

- La lectura de biblioteca construye resumen/recuperación desde una sola instantánea.
- El autosaver expone únicamente la versión del borrador ya reconocida durablemente. Confirmar sigue comprobándola dentro de la operación de biblioteca.
- Confirmar devuelve el resultado confirmado y los bytes inmutables de foto de su sesión; no vuelve a leer los 100 CV para contestar.
- Si no llegan recursos, no se clona toda la biblioteca para comprobar una subida inexistente.
- Transporte V8 exclusivamente entre procesos locales: conserva Map, bytes, valores inválidos y ciclos para que el worker los rechace; no cambia formatos persistidos ni portables. Captura los valores antes del primer await.
- SQLite almacena JSON validado; ordenar sus claves no aporta integridad. Hashes/formatos públicos continúan usando sus contratos canónicos.
- La caché de validación local compara el valor JSON completo; nunca confía solo en ID/revisión. Conserva strings privados, devuelve copias y comprueba siempre límites del grafo, propietarios, unicidad global, divergencia de revisiones y cierre de recursos. Los bytes de assets siguen verificándose.
- WAL + `synchronous=FULL`, CAS, revisión previa, resolución del borrador y atomicidad permanecen. El reconocimiento sigue después de COMMIT. No hay escritura crítica diferida.

Pruebas específicas: cambios inválidos con el mismo ID/revisión, divergencia histórica, colisiones entre CV, fechas, recursos ausentes, accesores sin ejecutar, mutaciones del llamador, escrituras externas y valores que JSON podría coaccionar. Pendiente de completar la aceptación oficial y los otros dos bloqueos antes de repetir F9 completa.


## Desglose final A–K y aceptación oficial

AppImage final, SQLite en SSD ext4, red aislada/CapEff=0: diez confirmaciones
diagnósticas en el mismo proceso y un formulario GUI real adicional. No es el
benchmark de veinte procesos nuevos. Evidencia completa:
`/tmp/cvforge-f9/remediation/confirm-profile-final/{results.json,stages.ndjson,form-stages.json}`.
Las etapas internas tienen 11 muestras; IPC 10; el formulario/frame, una muestra.
Los tiempos jerárquicos se solapan y no se suman sus percentiles.

| Etapa solicitada | Medición y alcance | Resultado ms |
| --- | --- | ---: |
| A formulario | submit → petición IPC, preparación/espera de stages; muestra GUI. La validación del dominio está en C. | 3,5 |
| B renderer → main | IPC de entrada, p95; relojes monotónicos referidos a timeOrigin común. | 1,34 |
| C snapshot/validación | Candidato p95 6,57; scope/stage 6,46; validación global de almacenamiento 82,84. | ver detalle |
| D serialización | JSON SQLite p95; transporte al worker 1,85 adicional. | 8,93 |
| E preparación | Captura de envío p95 13,35; copia de lectura 15,76; recoger recursos 0,22. | ver detalle |
| F transacción | Cuerpo de transacción, incluye serialización/restricciones. | 26,32 |
| G durable | Tiempo exterior al cuerpo: BEGIN + COMMIT FULL/WAL, incluye fsync requerido; no se afirma aislar la llamada de kernel. | 10,28 |
| H drafts/revisions/assets | Revisión/aplicar 7,83; integridad bytes 0,37; flush ya preparado 0,07. Todos anteriores al reconocimiento. | ver detalle |
| I metadata/listado | Cero relecturas globales para responder Confirmar. Se actualiza desde su resultado y el listado se refresca después; listar aparte p95 oficial. | 52,73 aparte |
| J respuesta IPC | p95 de main listo → respuesta disponible en renderer. | 2,81 |
| K UI posterior | Respuesta → siguiente frame tras actualizar/cerrar formulario; muestra GUI. | 10,5 |

Confirmación diagnóstica estable: p50 136,9 / p90 161,0 / p95 y máximo 181,2 ms.
**La aceptación usa exclusivamente el benchmark oficial de 20 procesos nuevos:**
p50 **251,1**, p90 **260,9**, p95 **261,3**, máximo **271,5 ms**; ≤300 ms PASS.
No se sustituye por los 181,2 ms del diagnóstico ni se descuenta fsync. La diferencia
de método/caché explica por qué ambas distribuciones se publican por separado.
Véase [PERFORMANCE.md](PERFORMANCE.md) para todos los presupuestos y muestras.
