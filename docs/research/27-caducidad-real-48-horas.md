# 27 — Caducidad real de 48 horas: prueba descartada por el usuario

Fecha de inicio y cierre: 15 de octubre de 2026. Estado: descartada por el usuario. **No se ha observado la caducidad real de 48 horas; no se considera necesaria para su objetivo.**

El usuario prioriza descargar e importar los archivos para reeditarlos y permite cerrar la conexión. A las 16:49:22 UTC se cerraron los dos contextos propios; la pestaña original seguía presente y no quedaban targets de la prueba. Evidencia REA: `ev_60004183fa2790efd98a15f1a0c7ab448ad3019f3da9f2f580e55fe6844f482a`. Véanse [cierre.json](scenarios/caducidad-48h/cierre.json) y [guion 45](scenarios/45-cerrar-control-caducidad.mjs).

Se completó por separado la [simulación acelerada](29-simulacion-caducidad-y-recuperacion.md): adelantar Date y temporizadores 49 horas mantiene la recuperación; fabricar respuestas 404/410 al GET oculta el enlace. Esto verifica comportamientos simulados, sin cambiar los controles reales ni demostrar el plazo de expiración del servicio.

## 1. Hechos observados

El [informe 22](22-borradores-salida-y-persistencia.md) ya distingue el aviso de recuperación de un CV iniciado en las últimas 48 horas del mensaje de salida que limita la conservación al cierre del navegador. Las recargas y el reinicio completo se probaron; esperar 48 horas es una prueba diferente.

Se crearon dos contextos anónimos propios en el Chrome conectado a `127.0.0.1:9222`, separados entre sí y de la pestaña original. Cada uno contiene un CV ficticio con nombre distintivo, confirmado mediante Save. Se verificó el marcador visible después de guardar.

Estos dos contextos se crearon con CDP `disposeOnDetach=false`. Durante la preparación permanecieron abiertos después de desconectar el cliente de investigación; una enumeración pasiva verificó ambos targets. Posteriormente se cerraron al descartarse la prueba.

| Control | Save confirmado, UTC | Comprobación prevista, UTC | Hora de Madrid | Antigüedad prevista |
| --- | --- | --- | --- | --- |
| Antes del umbral | 15/10/2026 15:11:48.555 | 17/10/2026 15:01:48.555 | 17/10, 17:01:48 | 47 h 50 min |
| Después del umbral | 15/10/2026 15:11:54.234 | Desde 17/10/2026 15:21:54.234 | 17/10, desde 17:21:54 | Al menos 48 h 10 min |

El control anterior tiene una ventana de cinco minutos: 17:01:48–17:06:48 de Madrid. Si se pierde esa ventana, el guion se niega a navegar porque ya no sería el control diseñado. El segundo control registra la edad real aunque se ejecute más tarde.

Evidencias:

- Preparación y dos marcadores confirmados: `ev_7908c6ab772bacd4b2e893541e4f3a0462056f835a8606f4912732006dd499c2`.
- Targets presentes tras terminar el proceso de preparación: `ev_4e0782991b3162584c607c764842a4af38af9510d648606e1bc516ae38f872da`.
- Verificación pasiva final, sin navegar: `ev_72118a602c41b24f0c9825b4793b95b3320dcf9ca9ee9f1a5512b91544273536`; siguen presentes los dos targets propios y la pestaña original.
- Estado y horas exactas: [manifest.json](scenarios/caducidad-48h/manifest.json).
- Procedimiento: [36-caducidad-real.mjs](scenarios/36-caducidad-real.mjs).

No hay un trabajo programado ni un proceso pendiente. El manifiesto está en `cancelled-by-user` y el guion 36 termina antes de conectar si detecta ese estado. No requiere mantener Chrome abierto ni efectuar las comprobaciones de la tabla, que conserva las horas originalmente previstas.

## 2. Inferencias y protocolo histórico de comprobación

El procedimiento siguiente documenta el diseño original de la prueba descartada. No es una instrucción pendiente ni debe ejecutarse como continuación de este estudio. Una nueva prueba necesitaría establecer un alcance y controles nuevos.

Para conservar la validez, debe permanecer abierto el mismo Chrome, sin cerrar esos contextos, limpiar datos ni editar sus CV. No se cambia el reloj del sistema ni se alteran fechas o almacenamiento del sitio. Tampoco se usa un salto artificial de tiempo como prueba de duración real.

El diseño original preveía ejecutar con REA `capture_process_scenario`:

```text
/usr/bin/node docs/research/scenarios/36-caducidad-real.mjs check-antes-48h
/usr/bin/node docs/research/scenarios/36-caducidad-real.mjs check-despues-48h
```

El guion comprueba el reloj antes de conectar. Si aún no corresponde, sale sin navegar. Cuando corresponde, localiza exclusivamente su target, recarga, busca el enlace de reanudación y, si existe, intenta recuperar el marcador ficticio. Registra hora, edad real, disponibilidad del enlace y recuperación efectiva.

| Resultado futuro | Interpretación admisible |
| --- | --- |
| Recuperación antes y ausencia después | Compatible con una expiración próxima al umbral en estas condiciones. No localiza el instante exacto. |
| Recuperación en ambos | No se observó pérdida al superar 48 horas en esa sesión; puede haber otra regla temporal o actividad de la propia página. |
| Ausencia en ambos | El control previo falla: no permite atribuir la pérdida a cumplir 48 horas. |
| Chrome/contexto cerrado o datos borrados | Prueba invalidada para la pregunta temporal. Registrar la causa y repetir con nuevos controles si se necesita. |

El producto propio debería evitar una dependencia de este tipo: proyecto local durable, estado de guardado explícito y recuperación comprobada tras cerrar la aplicación.

## 3. Cuestiones pendientes y límites

- El resultado real no se obtuvo porque se descartó la espera. Ningún informe lo marca como superado ni como trabajo necesario pendiente.
- Si el plazo anunciado se calcula desde creación, último Save, actividad u otro evento.
- Posibles temporizadores o peticiones de la propia página durante la espera: no se está capturando tráfico de forma continua.
- Caducidad exacta al segundo, efecto de suspensión del equipo y comportamiento con cuenta.
- Si se pierde la ventana previa, hay que registrar ese límite; no reinterpretar una comprobación tardía como realizada antes de las 48 horas.
