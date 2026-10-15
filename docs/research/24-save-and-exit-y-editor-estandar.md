# 24 — Save and exit y finalización en el editor estándar

Fecha: 15 de octubre de 2026. Pruebas con REA, sin cuenta, en contextos de investigación. No se modificó la pestaña original del usuario.

## 1. Hechos observados

### Editor beta

Se amplió la comprobación de [22 — Persistencia](22-borradores-salida-y-persistencia.md). La evidencia `ev_f60616b5802f7d1ee8b67f03a9b436637a2be97583ba3c267c6c477c9c905b76` registra:

| Estado probado | Save and exit | Resultado adicional |
| --- | --- | --- |
| Importación del CV ficticio con secciones | Deshabilitado | Editor operativo. |
| Nombre del documento escrito con teclado y desenfoque | Deshabilitado | Valor presente y validez nativa positiva; sin inputs ng-invalid encontrados. |
| Modificación de un certificado y Save de su formulario | Deshabilitado | Formulario cerrado con el contenido confirmado. |
| Descarga del PDF completada | Deshabilitado | Archivo recibido sin fallo de descarga. |

No se forzó la activación del botón ni se ejecutó una ruta interna. Es un resultado sobre las condiciones probadas, no una explicación de por qué está deshabilitado.

### Editor estándar: recorrido completado

Desde Start from scratch se eligió **Use the standard CV builder**. La URL pasó a `legacy-cv-editor?lang=en`. Se guardó una identidad ficticia mínima y se avanzó por Edit → Select template → Save.

En Select template aparecen cuatro botones con etiquetas accesibles Select CV template 1–4 e identificadores `cv-formal`, `cv-semi-formal`, `cv-3`, `cv-4`. Coinciden con cuatro identificadores del beta, pero esta pantalla no mostró los nombres Classic, Modern, Progress, Timeline, Accent o Elegant. Hay color, tamaño Small/Medium/Large, logo, números de página y cierre.

En Save and share se observó esta secuencia:

1. Nombre vacío: Download, Save in My Europass Library y Finish deshabilitados.
2. Escribir `rea_control_estandar` y salir del campo: Download habilitado; Library y Finish siguen deshabilitados.
3. Descargar: PDF recibido, `download.failure()` nulo; Finish pasa a habilitado.
4. Pulsar Finish: aparece una invitación a registrarse con Register, Login here y Create your CV. No se inició sesión ni se creó una cuenta.

La descarga está en `/tmp/europass-seguimiento/estandar.pdf`. Evidencia del recorrido completo: `ev_4c285ee92590bd0e25091b55c49fe6b13d661c31f4bee8e2ea247549dc046c42`. Guiones: [34](scenarios/34-save-exit-matriz.mjs) y [35](scenarios/35-editor-estandar.mjs).

## 2. Inferencias y mejoras propuestas

El editor estándar proporciona una salida funcional como invitado mediante descarga seguida de Finish. Esto no demuestra que Save and exit del beta funcione igual ni que descargar cree una copia durable del proyecto en el navegador.

Nuestra herramienta debería comunicar por separado: cambios del formulario, proyecto guardado localmente y PDF exportado. Guardar y salir debería confirmar primero el guardado del proyecto; exportar debería seguir siendo una acción independiente. El usuario necesita conocer la ubicación del archivo y el resultado de cada operación.

Un botón deshabilitado debería explicar qué falta para habilitarse. El flujo debería permitir guardar localmente y finalizar sin exigir registro.

## 3. Cuestiones pendientes

- Ejecución real de Save and exit en el beta: sigue sin observarse porque permanece deshabilitado.
- Condiciones adicionales que lo habilitan y recorrido con cuenta: no comprobados; no se atribuye el estado a una causa interna.
- Guardado y recuperación desde My Europass Library: fuera de las pruebas sin cuenta.
- Durabilidad de un proyecto propio: requisito por construir y validar, no capacidad implementada.

La [FAQ oficial](https://europass.europa.eu/en/faq?page=2) distingue descarga local como invitado y almacenamiento en Library para usuarios registrados. Esa documentación respalda la distinción de destinos, sin resolver el estado del botón beta observado.
