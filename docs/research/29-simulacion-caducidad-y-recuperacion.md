# 29 — Simulación acelerada de caducidad y recuperación

Fecha: 15 de octubre de 2026. REA, sesiones nuevas con identidad ficticia y sin cuenta. La simulación está completada; la espera real del [informe 27](27-caducidad-real-48-horas.md) sigue siendo una prueba independiente.

Decisión posterior del usuario: se prescinde de la espera real y se cierran sus contextos. Los resultados y hashes siguientes describen el estado al terminar la simulación, anterior a ese cierre; no constituyen una tarea temporal todavía activa.

## 1. Hechos observados

### Reloj del navegador y temporizadores

Se creó y guardó un CV mínimo en cada contexto de prueba. Antes de simular tiempo se verificó la recuperación del nombre ficticio mediante recarga y reanudación. Después se adelantó el reloj únicamente dentro de ese contexto, se recargó y se repitió la recuperación.

| Control ejecutado | Manipulación | Reloj comprobado | Enlace de reanudación | Nombre ficticio recuperado |
| --- | --- | --- | --- | --- |
| Sin avance | Date fijada al instante inicial | Sí | Presente | Sí |
| +49 horas | Date.now/new Date mediante setFixedTime | Sí; diferencia exacta de 49 h | Presente | Sí |
| +49 horas con temporizadores | install + fastForward | Sí; salto de 49 h más el tiempo normal de recarga | Presente | Sí |

Las pruebas se ejecutaron en decenas de segundos reales. El reloj del sistema y el tiempo del servidor no se cambiaron. Restaurar el reloj del contexto también permitió recuperar el CV. No se registraron errores JavaScript de página en estos tres casos.

En los snapshots de Web Storage del origen se observó la clave `backup-cv-id` en sessionStorage y ninguna entrada en localStorage. Su hash permaneció estable durante cada prueba de reloj. Esto describe esos dos almacenes en el momento inspeccionado; no constituye un inventario de IndexedDB, cachés o toda la persistencia del navegador.

La [API Clock de Playwright](https://playwright.dev/docs/api/class-clock) distingue fijar Date de avanzar los temporizadores. fastForward hace saltar el tiempo y ejecuta los temporizadores vencidos como máximo una vez; no reproduce cada callback que se ejecutaría durante 49 horas de actividad continua. El reloj simulado afecta al contexto de prueba, incluidos sus frames.

### Recuperación por red observada

Se observó por separado un recorrido normal de un CV ficticio, sin modificar respuestas. Entre las peticiones se registraron:

| Momento | Petición observada | Respuesta |
| --- | --- | --- |
| Creación | POST `/europass/eportfolio/api/eprofile/cv` | 201; objeto con id. |
| Actualización | PUT `/europass/eportfolio/api/eprofile/cv/{id}` | 200; objeto con id. |
| Recarga | GET `/europass/eportfolio/api/eprofile/cv/{id}` | 200; campos id, profile, profilePicture, template y errors. |
| Recarga/reanudación | Nuevas PUT del mismo recurso | 200. |

El identificador real se ha omitido del registro. No se copiaron cuerpos de perfil, credenciales, código, traducciones o recursos de la web al proyecto. No se observaron campos de caducidad entre las claves y fechas examinadas; no se afirma que no existan en otra respuesta o profundidad.

Este recorrido demuestra que la recuperación probada utiliza una API remota. El guardado observado no puede describirse únicamente como persistencia local de los campos en sessionStorage.

### Borrador no disponible: respuestas fabricadas en el cliente

En otra sesión propia se conservó la referencia del CV ficticio y se interceptó exclusivamente su GET. La secuencia fue respuesta real 200 → respuesta local 404 → respuesta local 410 → respuesta real 200.

Las respuestas 404 y 410 con cuerpo JSON vacío fueron fabricadas por Playwright. **No fueron respuestas del servidor ni se ha establecido que sean el contrato real de caducidad de Europass.** Antes de cada caso se repuso la referencia propia inicial para que las comprobaciones usaran el mismo CV.

| Respuesta al GET | Procedencia | Enlace de reanudación | Clave backup-cv-id presente | Recuperación |
| --- | --- | --- | --- | --- |
| 200 | Servicio real | Sí | Sí | Nombre ficticio recuperado. |
| 404 | Intercepción local; un GET interceptado | No | Sí | No se ofrece reanudación. |
| 410 | Intercepción local; un GET interceptado | No | Sí | No se ofrece reanudación. |
| 200 tras retirar la intercepción | Servicio real | Sí | Sí | Mismo nombre ficticio recuperado. |

En los dos casos simulados no apareció un mensaje explícito de error o caducidad en el texto del body inspeccionado tras la carga. La presencia de la clave no verifica por sí sola su valor; el guion no registró ese identificador. No se eliminó ni se hizo caducar el recurso remoto para obtener estos resultados.

### Evidencia y reproducibilidad

- Date fija/control: `ev_f86ad812cbcd418b93dc283ca755144d94508e0a9eb149e0bc4ff6e7e5fdde04`.
- Temporizadores: `ev_095ab65debc2116cd6832e3ab3592e773e459ca35f6dd58beca4eed0a6d02e55`.
- Metadatos de red reales: `ev_c5215776b5b08c3cf5c072df07aade3edd85133a67136a3edcb73a86eecae598`.
- Respuestas fabricadas y restauración: `ev_ad22a142e5803ef2625274ffd7b12256cc86290dd134b74298d6b690d2839dea`.
- Guiones propios: [42](scenarios/42-simulacion-caducidad.mjs), [43](scenarios/43-recuperacion-red-observada.mjs) y [44](scenarios/44-recuperacion-no-disponible-simulada.mjs).
- Resultados derivados sin identificadores del CV: [resultados.json](scenarios/caducidad-simulada/resultados.json). Registro REA: [evidencias.json](scenarios/caducidad-simulada/evidencias.json).

Los procesos utilizaron un Chrome temporal propio y lo cerraron al terminar. No conectaron con las pestañas reales del puerto 9222. Al terminar aquella simulación, el manifiesto real mantenía su hash `5b7c9f47e458032ed9503aed273a973ecbd236edf8609011032a2f5f63b75cb0` y su estado de espera. Posteriormente se canceló y se actualizó el manifiesto, como documenta el informe 27. No se ha implementado la aplicación de CV.

## 2. Inferencias y mejoras propuestas

Sí es posible simular el paso del tiempo y la indisponibilidad de un borrador. En estas pruebas, ni el salto de Date ni el de temporizadores provocó la desaparición del CV. Es compatible con que la disponibilidad dependa del servicio remoto o de otras condiciones, pero no establece una política interna concreta de borrado o renovación.

La presencia del enlace respondió a la disponibilidad del recurso en el recorrido observado: al fabricar fallos del GET desapareció y al recuperar el servicio volvió. Esto permite estudiar la UX de pérdida de recuperación sin esperar dos días, separándola de la expiración real.

Para nuestra herramienta se propone conservar un proyecto local durable y mostrar estados de recuperación comprensibles. Una copia no disponible debería distinguirse de un proyecto vacío o nuevo. La simulación de fallos y reloj permitirá validar esos comportamientos durante la implementación.

Las PUT observadas al recargar/reanudar hacen pertinente comprobar si la actividad renueva el plazo. No se ha demostrado que lo haga. Los dos controles reales son independientes para que consultar el anterior al umbral no consulte también el posterior.

## 3. Cuestiones pendientes

- Expiración efectiva al cumplir 48 horas reales: no observada; espera descartada y fuera del alcance necesario por decisión del usuario.
- Si hay eliminación, caducidad lógica, renovación por actividad o un proceso periódico; momento inicial del cómputo y reloj que usa el servicio.
- Código y cuerpo HTTP que devuelve realmente un borrador caducado. 404/410 son escenarios de prueba, no hallazgos del backend.
- Actividad continua durante dos días, suspensión del equipo y expiración real de cookies/sesiones. Los saltos de Playwright no envejecen esos mecanismos del servidor.
- No se ha ejecutado una comprobación de límite exacto a 47:59/48:00/48:01 ni se declara un umbral confirmado. La simulación de 49 horas no produjo ese cambio.
