# Validación F4 — editor principal

16 de octubre de 2026. **F4 = APROBADA técnicamente para el alcance solicitado.**
Pendiente de aprobación del usuario y de integración de `f4-core-editor`; no se
fusiona ni publica en `main`. F5 no iniciada. Implementación:
[EDITOR.md](EDITOR.md). Registro resumido de resultados: [evidence.json](evidence.json).

## Base y método

Antes de programar se leyeron completos AGENTS, REQUIREMENTS, ARCHITECTURE,
DATA_MODEL, ROADMAP y PERSISTENCE/VALIDATION de F3. `main` estaba limpio y
`HEAD = origin/main = ls-remote origin/main = c5392ec88ffd1df5d33bf02567fd8a561abd9b4c`.
F1 pasó 3/3, F2 30/30 y F3 39/39 antes de crear la rama. Los commits de fases
previas y la evidencia histórica se conservan.

Todas las entradas de prueba son sintéticas. Los tests de aplicación utilizan
SQLite y worker reales en directorios temporales externos. Los tests UI arrancan
el ejecutable Electron 44.7.2 con el build real, preload y almacenamiento F3;
no se sustituye el backend por mocks. Playwright 1.64.1 controla su Chromium por
CDP local y opera labels, formularios, teclado y botones visibles. Cada caso
cierra el proceso y crea nuevas instancias con el mismo `userData`, compara datos
confirmados y revisa `integrity_check = ok` y cero violaciones de claves foráneas.

El harness usa `--no-sandbox` únicamente en pruebas sobre este entorno Linux,
igual que el lanzamiento automatizado por defecto de Playwright. La aplicación
configura renderer aislado/sandbox y no añade ese flag en `npm start`; no se
declara validado aquí el aislamiento de procesos del kernel en todas las
distribuciones. Se comprueba en UI la ausencia de `require`, `process` e IPC
genérico. Las pruebas con foco se ejecutan sin otra suite gráfica simultánea.

## Criterios ejecutados

| Criterio | Estado | Evidencia |
| --- | --- | --- |
| Biblioteca real, sin datos de producción hardcodeados | PASS | Crear perfil/CV desde formulario, abrir desde biblioteca; tests de aplicación/UI. |
| 1. Confirmar/Cancelar email | PASS | `a@example.test` confirmado → editar B → Escape/Cancelar conserva A → confirmar B. |
| 2. Cancelar no cambia confirmado ni deja recuperación | PASS | Misma revisión/contenido en SQLite; cero borradores tras Cancelar y reapertura. |
| 3. Confirmar persiste tras reinicio | PASS | B reaparece al arrancar otro proceso; comparación de la biblioteca en nueva instancia. |
| 4. Editar una educación conserva las demás | PASS | A/B/C: editar solo B, igualdad profunda de A y C y resúmenes reales de las tres. |
| 5. Varias experiencias sobreviven | PASS | Tres en test de aplicación, dos en UI; igualdad tras reapertura. |
| 6. Fecha inválida permanece con error | PASS | `2020-02-31` sigue visible; Confirmar rechazado, `aria-invalid` y mensaje asociado. También se conserva durablemente. |
| 7. Cancelar fecha inválida restaura el anterior | PASS | Reapertura del formulario recupera la fecha confirmada, sin borrador cancelado. |
| 8. Ongoing/precisiones | PASS | `2020-02 → Actualmente`; año/mes/día, fin solo, bisiesto, inversión, número inválido y conflicto Currently/fin. No inventa componentes. |
| 9. Foto sobrevive | PASS | Bytes sintéticos y referencia del asset tras otra instancia SQLite/Electron. |
| 10. Cancelar sustitución conserva foto | PASS | Foto A → sustitución B → Cancelar → reabrir conserva exactamente bytes A; B no queda huérfana. |
| 11. Ocultar conserva contenido | PASS | Entrada y sección: datos intactos, `included=false`; datos personales permanecen en el proyecto. Proyección visible excluye el contenido. |
| 12. Mostrar recupera contenido | PASS | Revertir inclusión devuelve exactamente la entrada, sin reconstruirla. |
| 13. Contraer no cambia inclusión | PASS | Comparación completa del CV confirmado antes/después de contraer; sin nueva revisión ni propiedad `collapsed` exportable. |
| 14. Reordenar persiste | PASS | Teclado Enter/Espacio mueve C antes de A; Confirmar y reiniciar → C,A,B. También orden de secciones en SQLite y Cancelar del orden. |
| 15. Eliminar sin referencias inválidas | PASS | Cancelar eliminación conserva; confirmación específica elimina solo objetivo, mantiene historial y comprueba FKs/integridad. |
| 16. Teclado básico | PASS | Foco inicial, Tab nombre→nombre de pila, Escape, retorno al botón de edición, controles Subir/Bajar con Enter/Espacio. |
| Texto enriquecido semántico | PASS | Párrafos, saltos, marcas, links y ambas listas hacen round-trip al árbol F2; rechaza nodos/enlaces no permitidos; edición real en Tiptap. |
| Campos obligatorios/optativos y direcciones | PASS | Tipado/raw separados, validación F2; dirección vacía no confirma hasta completar dato o retirarla; proyección visible válida. |
| Independencia perfil/CV y edición acotada | PASS | Perfil/otro CV y memoria sensible intactos; rechazo de escrituras fuera del formulario y revisiones antiguas. |
| `.cvproj`, historial y assets | PASS | Exportar tras editar conserva el CV exacto y recursos/revisiones; suites F2/F3 completas. Sin cambio de formato. |
| Cierre inmediato con formulario abierto | PASS | Cierra sin esperar debounce; al abrir ofrece B y fecha inválida como borrador, mientras A sigue confirmado. |
| Cierre durante Confirmar | PASS | Espera la operación; siguiente proceso recupera B confirmado y fecha corregida, sin borrador residual. |
| Crash y recuperación explícita | PASS | SIGKILL del grupo de procesos después de borrador reconocido; nueva instancia ofrece recuperar; Cancelar no aplica sus datos. |
| Funcionamiento local/offline | PASS | Los cuatro flujos UI pasan en namespace sin red externa, incluido reinicio, foto, crash y recuperación. |
| TypeScript/build | PASS | Compilación estricta, preload CJS y bundle Vite de producción. Avisos descritos abajo. |

## Comandos y resultados finales

```bash
npm test
npm run typecheck
npm run build
npm run test:f4
npm run test:f4:ui
npm run validate:f4:offline
CVFORGE_F1_OUTPUT=/tmp/cvforge-f4-f1-regression npm run test:f1
```

| Comprobación | Resultado |
| --- | --- |
| F2 | 30/30 PASS dentro de la suite completa. |
| F3 | 39/39 PASS: SQLite real, reapertura, migraciones, fallos/transacciones, assets, checkpoints y `.cvproj`. |
| F4 aplicación/codec | 13/13 PASS: 11 de aplicación y 2 del adaptador enriquecido. |
| Suite conjunta de Node | 82/82 PASS; sin tests omitidos, pendientes o cancelados. |
| Electron con interfaz | 4/4 PASS; múltiples procesos reales, cero errores de renderer y cero solicitudes HTTP(S) observadas. |
| Electron offline | 4/4 PASS; mismas operaciones con red externa imposible. |
| F1 | 3/3 PASS sobre evidencia nueva de su paquete Linux con red deshabilitada; PDF/payload/lector externo y comparación de todas las páginas conservados. |
| TypeScript y build | PASS; recursos locales generados. |
| Integridad en reaperturas UI | PASS; `ok`, FKs = 0; fotos y contenido confirmados comprobados. |

La prueba F1 se regeneró sin modificar su código ni paquete:

```bash
CVFORGE_F1_OUTPUT=/tmp/cvforge-f4-f1-regression \
  unshare --user --map-current-user --net node spikes/f1/offline-check.cjs
```

Su test requiere `CVFORGE_F1_OUTPUT` con las recepciones generadas: una invocación
intermedia sin esa variable falló por ausencia de fixtures/evidencia, no por un
cambio del PDF. Se repitió correctamente contra la nueva evidencia 3/3.

## Ensayo sin red

`scripts/f4-offline-check.mjs` inicia un namespace de usuario y red mediante
`unshare --user --map-root-user --net`. Root está mapeado al usuario invocante
del host. Antes de ejecutar Node, `ip link set lo up` activa únicamente loopback
para CDP. No hay interfaz externa ni rutas de `/proc/net/route`; un TCP a
`1.1.1.1:443` falla con `ENETUNREACH`. El script verifica estas condiciones y
después ejecuta los cuatro tests reales de UI. No usa mocks de red ni simula un
estado offline de navegador con conectividad real disponible.

Se prueba arrancar, crear/abrir biblioteca, editar/confirmar/cancelar, guardar
imagen, texto enriquecido, ocultar/contraer/ordenar, cerrar/reabrir, cerrar durante
confirmación, SIGKILL y recuperación. Los artefactos UI y
`network-proof.json` quedan en `/tmp/cvforge-f4-offline-results`. El control con
red usa `/tmp/cvforge-f4-ui-results`; bases sintéticas temporales se eliminan al
finalizar. No se versionan DB, PNG, perfiles Electron ni CV de prueba exportados.

El primer intento con `--map-current-user` no pudo activar loopback después de
exec (`RTNETLINK: Operation not permitted`); el script falló sin comunicar PASS.
La variante de namespace con root mapeado descrita arriba sí pasó.

## Problemas investigados, límites y deuda

- Se corrigió un bloqueo de arranque ESM al esperar ready durante la carga del
  módulo. La aplicación inicializa asincrónicamente al estar lista.
- El cierre inmediato detectó una pérdida de los últimos inputs del borrador.
  Se corrigió interceptando unload y esperando la acción de UI en curso antes
  del flush/cierre. El test de cierre inmediato y durante Confirmar previene
  esa regresión. SQLite confirmado no se perdió en el ensayo fallido.
- Una dirección vacía podía alcanzar la proyección como literal vacío. La
  validación del formulario impide confirmarla; no corrige o inventa datos.
- El harness inicial de Electron con inspector Node retenía el proceso al salir.
  El harness final ejecuta el producto directamente y conecta CDP solo a
  Chromium. No se altera producción para permitir el test.
- Dos suites gráficas simultáneas interferían con el foco. La pasada final se
  ejecutó en solitario; `bringToFront` activa la ventana sin enfocar manualmente
  el botón cuya devolución de foco se comprueba.
- Siguen los avisos `use client`/chunk Vite y diagnóstico VA-API del entorno.
  No hay errores del renderer ni de SQLite en las pasadas aceptadas.
- Accesibilidad básica, no certificación/lector de pantalla completo. UI española;
  i18n completa, otras cinco áreas, traducción, importadores y preview/plantillas
  finales permanecen en sus fases posteriores.
- PNG limitado al subconjunto F2; sin recorte nuevo. Un campo sensible importado
  sin original se conserva como lectura. Revisar spans protegidos o aprobaciones
  obsoletas necesita los flujos posteriores, no un traductor oculto en F4.
- Se mantiene la deuda F3 (rendimiento de 100 CV, reparación de corrupción y
  plataformas), y las incidencias F1 (Poppler, VA-API, avisos dev y pesos ONNX).

No hay FAIL arquitectónico conocido pendiente para el alcance F4. La decisión
de aprobación del usuario, el merge y el comienzo de F5 quedan pendientes.
