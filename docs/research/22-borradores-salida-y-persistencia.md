# 22 — Borradores, salida y persistencia

Ampliación posterior del 15/10/2026: [24 — Save and exit y estándar](24-save-and-exit-y-editor-estandar.md) y [27 — Prueba real de 48 horas](27-caducidad-real-48-horas.md). El recorrido estándar ya se completó; el botón beta sigue deshabilitado. La espera de duración real se descartó por decisión del usuario y sus contextos se cerraron.

Evidencia posterior de mecanismo observado: [29 — Simulación y recuperación](29-simulacion-caducidad-y-recuperacion.md) registra una referencia backup-cv-id en sessionStorage y peticiones GET/PUT de CV a una API remota. Amplía la observación anterior, que no identificaba ese recorrido de red.

## 1. Hechos observados

Pruebas REA del 15 de octubre de 2026. Se utilizó un perfil persistente de Chrome creado para la investigación, reutilizando su misma carpeta al cerrar y relanzar. Sin cuenta Europass, con service workers bloqueados como en los otros escenarios.

| Evidencia | Cobertura |
| --- | --- |
| `ev_71b0c6f2d2b750c1bddc7756483d5d4af730b89f57d2a1574d3f7fee8593f5e6` | Guardado, edición sin confirmar, recarga, reanudación y reinicio de navegador. |
| `ev_bd18c0ad7452e2580788f751b83a977a12e16afdc261519db459048988a3184a` | Save and exit deshabilitado y aviso de salida. |
| `ev_2dc7f35a15d5440effbc99bc6d761c491162badbc8e5832c44088717547cf1c9` | Cancelar y confirmar salida; regreso al editor en la misma sesión. |

### Recarga y recuperación

1. Se importó el CV ficticio con 14 secciones adicionales.
2. Se cambió y guardó el título de un certificado a REA CONFIRMADO SESION. Save cerró el formulario.
3. Se volvió a editar a REA BORRADOR SIN GUARDAR, sin pulsar Save.
4. Tras recargar, el editor volvió a su pantalla de entrada y mostró el aviso de un CV iniciado en las últimas 48 horas, con enlace para reanudar el borrador guardado automáticamente.
5. Se pulsó ese enlace y, cuando correspondía, la opción del editor beta. Reaparecieron las secciones con REA CONFIRMADO SESION. No reapareció REA BORRADOR SIN GUARDAR.

Así queda comprobado que el borrador recuperable conserva el contenido confirmado en esta prueba, no el texto temporal del formulario abierto. No se deduce el mecanismo de almacenamiento utilizado.

Al cerrar por completo y relanzar Chrome con el mismo perfil, la pantalla de entrada no ofreció enlace de recuperación. No se restauró el contenido por esa ruta en las dos tentativas del recorrido. No demuestra pérdida de los archivos PDF exportados ni el comportamiento de usuarios con cuenta.

El primer guion buscaba incorrectamente un botón de reanudación. La prueba corregida usa el enlace observado; la ausencia de recuperación de aquel primer intento no se usa para inferir un fallo.

### Salida

Exit the wizard abre Exit steps. Su texto explica que el CV se conservará hasta cerrar el navegador, ofrece volver al último CV y recomienda Save and exit. Este alcance temporal anunciado no es una garantía demostrada de recuperación durante 48 horas después de cerrar el navegador.

- Cancel en el aviso mantiene el editor abierto.
- Confirmar Exit without saving abandona el editor y navega a `https://europass.europa.eu/en`.
- Volver al creador en el mismo contexto de navegador ofrece un enlace para reanudar.

Save and exit permaneció deshabilitado en las pruebas con archivo importado, contenido confirmado y nombre del documento escrito tanto con fill como con eventos de teclado. No se observaron inputs ng-invalid al comprobar ese estado. No se logró ejecutar ese flujo y no se ha demostrado que la causa sea carecer de cuenta; se registra el estado visible sin atribuir una regla interna.

La importación/exportación mediante Download sí está comprobada independientemente de ese botón, incluyendo reedición de los PDF ficticio y real.

## 2. Inferencias y criterios propios

Hay al menos tres estados funcionales que nuestra herramienta debería distinguir: cambios temporales de un formulario, contenido confirmado del proyecto y archivo exportado recuperable. Conviene que el proyecto local sobreviva a un cierre completo y que la interfaz comunique cuándo se guarda, dónde y qué se recuperará.

La información de Europass sobre recuperación depende del recorrido y estado observado. Nuestra aplicación debería ofrecer una política explícita y comprobable, evitando que un aviso de horas se interprete como una copia durable del proyecto.

## 3. Cuestiones pendientes y límites

No se ha esperado 48 horas ni probado expiración real, recuperación después de caída del sistema, sincronización entre dispositivos o guardado en una cuenta. Save and exit sigue sin ejecución confirmada por su estado deshabilitado; ningún informe lo marca como superado.

Esos límites no impiden definir una herramienta local independiente basada en archivos de proyecto y PDF editables propios. Su persistencia y recuperación deberán probarse cuando se implemente, sin asumir que la conducta de Europass las garantiza.
