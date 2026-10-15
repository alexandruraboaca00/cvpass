# 11 — Menús, orden y visibilidad: pruebas activas

**Actualización:** [18-multiples-orden-y-visibilidad.md](18-multiples-orden-y-visibilidad.md) confirma movimiento de entradas múltiples, cancelación/confirmación de eliminación y retirada de secciones llenas y vacías. Los pendientes de esta captura inicial deben leerse junto a ese seguimiento.

## 1. Hechos observados

Pruebas REA aisladas del 15 de octubre de 2026. Se crea una entrada laboral con ocupación Investigador UX de prueba y empleador Empresa ficticia REA. No se usan datos ni pestañas del usuario. Evidencias: ev_4162c01bf8299f5c89a6ca4bc4a90200f54fb8dd21890ff1e1c8b6db698de075 y ev_00717ea427abb991df2538ed34b5282a4487309b1db07dd26ed53f8d6e5afd33.

| Menú | Opciones observadas |
| --- | --- |
| Cabecera de Work experience | Add Work experience; Move up; Move down; Remove section from CV. |
| Entrada laboral | Add new position; Edit Work experience; Delete Work experience. |

La opción de añadir otra posición tiene nombre accesible Add Work experience. Las opciones de mover se anuncian Move section up/down. Escape cerró el primer menú antes de abrir el de entrada.

Al ejecutar Move up, el orden de encabezados cambió de Personal Information → Education & Training → Work experience a Personal Information → Work experience → Education & Training. El contenido laboral se conservó. Al reabrir el menú laboral ya no aparecía Move up; sí Move down. Es un límite observado en esa posición, no una prueba de todas las restricciones.

Remove section from CV abrió Confirm remove section, que identifica Work experience y avisa de 1 registro contenido. Ofrece Cancel y Remove section. No se confirmó la retirada; el perfil temporal se cerró al terminar. No se borraron datos de la pestaña del usuario.

En el menú de una única entrada laboral no aparecen movimientos arriba/abajo. Eso no demuestra que no existan con varios registros. No se ha probado arrastre. Los controles Hide this section en secciones vacías ya se observaron en notas anteriores; su efecto real no se ha ensayado aquí.

## 2. Inferencias

Los menús tienen ámbitos funcionales distintos y la reordenación manual de secciones está comprobada. El modelo propio debería poder conservar un orden de secciones independiente de las fechas de sus entradas. No se ha observado el esquema interno de Europass.

La desaparición de Move up junto a Personal Information es compatible con una cabecera personal fija; requiere pruebas adicionales antes de convertirlo en regla general.

## 3. Cuestiones pendientes

Comparar menús de educación, Skills, idiomas y Other; probar añadir y ordenar varias entradas, retirar/restaurar secciones y comprobar el orden en preview/exportación. Distinguir ocultación de retirada y eliminación de datos. No atribuir a un botón una operación irreversible por su etiqueta sin comprobar el flujo.
