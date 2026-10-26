> Historical CVForge MVP acceptance evidence. Current CVPass public-release preparation: [release notes](../release/v0.1.0.md) and [validation](../release/VALIDATION.md). Original measurements and artifact records below are preserved.

> **Integración definitiva del MVP 0.1.0 aprobada por el usuario:** F9 se integra
> en `main` mediante merge commit, sin squash ni reescribir historia. Las campañas
> A/B/C y NF-05 vigente (startup ≤3200, Confirmar ≤300) no cambian ni se repiten.
> Se conserva la deuda de 50 revisiones/316,6 ms y todo el historial siguiente.
> Regresión post-merge obligatoria antes de push. **F10 no iniciada; sin tag ni
> GitHub Release.** Las referencias siguientes a «pendiente de aprobación» o
> «sin fusionar» describen el estado histórico anterior a esta integración.

> **Estado vigente, decisión explícita del usuario del 25/10/2026: F9 = APROBADA técnicamente.**
> NF-05 startup pasa de su objetivo inicial ≤3000 a **≤3200 ms p95**, después de
> las mediciones y solo para el equipo/corpus/método F9 documentado. Confirmar
> conserva **≤300 ms**; ningún otro objetivo cambia. Las tres campañas startup
> 3075,6/2995,8/2935,0 y Confirmar 284,2/280,3/275,1 son PASS; offline sigue PASS.
> [Decisión, justificación, AC-01…AC-10 y evidencia](NF05_STARTUP_REVIEW.md).
> Se conserva el historial original de 3000 ms y sus FAIL, sin modificar muestras
> ni método. Deuda pendiente: 50 revisiones, Confirmar p95 316,6 ms por lecturas/
> copias globales, fuera del corpus oficial. Sin merge/push a main ni F10.

## Registro anterior a la revisión explícita, conservado

# CVForge 0.1.0 — candidata de repetibilidad, NO APROBADA

25/10/2026. No fusionar/publicar main, tag ni GitHub Release. F10 no iniciada.
Confirmar pasa tres campañas; arranque A p95 3075,6 ms falla 3000 y bloquea F9.
[Método y resultados](CONFIRM_REPEATABILITY.md), [aceptación](ACCEPTANCE.md).

- Artefacto: `out/f9/CVForge-0.1.0-x86_64.AppImage`.
- Tamaño: **159764395 bytes**.
- SHA-256: `6f07c8418392f00e98104b041885d20a1b1aa50653e9ce9dc6512451eec707f3`.
- Dos reconstrucciones byte-idénticas, SOURCE_DATE_EPOCH 1792756800, mismas
  versiones Electron/Node/builder que la candidata anterior.
- Sin nuevos recursos remotos ni cambios funcionales al PDF/formatos.
- Los hashes siguientes son históricos; no identifican esta candidata.

Regresión actual: 222 tests, 33 PDF, TypeScript/build, paquete Linux/offline/
privacidad PASS. Prueba FUSE normal crear/cerrar/reabrir PASS, sin extracción
ni switch userData, sandbox activo y XDG aislado; no es una campaña p95 nueva.
La candidata sigue bloqueada por el control de arranque, aunque su empaquetado
y flujo funcional sean correctos. [Recibos](evidence/confirm-validation.json).

## Historial de candidatas conservado

> **Control previo actual: integración bloqueada.** El usuario aprobó F9/MVP 0.1.0 en `7088c4c`; la regresión nueva conserva 216 tests, UI, 33 PDF, offline y privacidad PASS, pero Confirmar durable p95 **359,7 ms >300**. Arranque p95 2469,1 ms PASS. Sin merge/push a main ni F10. [Evidencia actual](MERGE_VALIDATION.md). La aceptación anterior y todos sus resultados se conservan como historia.

## Registro aprobado anterior, conservado

# CVForge 0.1.0 — candidata Linux revalidada

25/10/2026. **Aceptación técnica F9 PASS, pendiente de aprobación del usuario.**
Rama sin fusionar, sin push a main y F10 no iniciada. [Aceptación](ACCEPTANCE.md),
[perfilado](STARTUP_PROFILING.md), [compatibilidad](COMPATIBILITY.md).

## Artefacto actual

- `out/f9/CVForge-0.1.0-x86_64.AppImage`.
- **159760475 bytes**, aproximadamente 152.4 MiB.
- SHA-256: `16c0a4f77ac117b33a066b6c50a6ee75154552de2d485cf1fc9f8aa1974a14b3`.
- Electron 44.7.2 / runtime Node 24.21.0; builder 26.15.3,
  toolset AppImage 1.0.3; SOURCE_DATE_EPOCH 1792756800.
- Dos reconstrucciones idénticas, verificadas en
  `/tmp/cvforge-f9-startup/reproducibility.json`. Sin cambios de dependencias,
  formato de proyecto/payload ni versión de plantilla/renderer.
- Worker SQLite agrupado por Vite como compilador Node, en su URL original;
  SQLite nativo externo, incluido en el paquete. No existe servidor de producción.

La AppImage incluye runtime, native SQLite, fonts locales/licencias y PDF.js.
No necesita Node instalado, npm, VS Code ni dev server. Los modos y límites
funcionales 0.1.0 se mantienen. No hay auto-update, cloud ni motor automático nuevo.
El icono sigue siendo el predeterminado de Electron; no se certifica Linux universal.

## Uso normal y FUSE

```sh
chmod +x CVForge-0.1.0-x86_64.AppImage
./CVForge-0.1.0-x86_64.AppImage
```

También se puede permitir ejecución en propiedades y abrir con doble clic.
FUSE normal: 20 aperturas con montaje real comprobado, sin
`APPIMAGE_EXTRACT_AND_RUN`, p95 2339.4 ms; crear/cerrar/reabrir con
directorio por defecto también PASS, fuera del checkout y con sandbox activo.
El harness desactiva AppImageLauncher solo para impedir que mueva el archivo.
FUSE funcional es requisito de ese montaje; no se certifican todos los launchers.

Si un sistema no puede montar, el runtime admite la alternativa:

```sh
APPIMAGE_EXTRACT_AND_RUN=1 ./CVForge-0.1.0-x86_64.AppImage
```

La aceptación offline usa esta ruta porque el namespace no permite montar FUSE.
El método oficial ya la utilizaba antes de este trabajo: no se cambia para lograr
el PASS. El modo normal FUSE se prueba aparte, sin mezclar muestras.

Los datos normales siguen en `~/.config/CVForge/library` o su equivalente XDG.
Cerrar antes de copiar el directorio completo; usar `.cvproj` para backup privado
CV/workspace. El PDF recupera solo la distribución visible, no el proyecto completo.
No se publican artefactos ni bibliotecas privadas en Git. [Uso normal](../../README.md).

## Validación actual

216 tests, UI, 33 PDF, E2E AppImage, dos muestras privadas, TypeScript/build,
offline/privacidad y reapertura PASS. AppImage independiente del checkout,
105 archivos contrastados, sin `--no-sandbox` ni capacidades efectivas.
Oficial: startup p95 1844.4 ms y Confirmar 228.4 ms.
La versión conserva Linux/x86_64 y el entorno X11 de aceptación; no añade otras plataformas.

## Registro histórico conservado

Las cifras y estados siguientes corresponden a evaluaciones anteriores; la cabecera actual y STARTUP_PROFILING gobiernan esta candidata.

## CVForge 0.1.0 — MVP Linux

MVP **aprobado por el usuario** en `f9-mvp-acceptance`. La integración permanece
bloqueada: el [control previo al merge](MERGE_VALIDATION.md) falla el límite de
arranque. No se fusiona ni se publica main; F10 no se inicia. La AppImage se ha
reconstruido sin cambios de bytes; no se presenta como una entrega integrada.

## Artefacto

- `out/f9/CVForge-0.1.0-x86_64.AppImage`.
- 159 703 015 bytes, aproximadamente 152,3 MiB.
- SHA-256: `6b984f6e96af918b815def7d0d12db28e5bf1920108beeaea9878e5a7d443d8c`.
- Electron 44.7.2, electron-builder 26.15.3, toolset AppImage 1.0.3.
- Versión de aplicación y package metadata: 0.1.0, conservando la numeración
  existente. Recibos v1, payload v1, Simple/Lateral v1 y rendererVersion propios
  conservan sus contratos; no se inventa una migración por el número de release.

El archivo y su `.sha256`, `release.json` y metadatos de construcción quedan
fuera de Git. No se incluyen documentos privados, bases, pruebas ni fuentes TS.
El paquete contiene runtime, SQLite nativo, recursos locales, licencias de
dependencias/fuentes y worker PDF.js. El icono es el predeterminado de Electron;
no se afirma integración de marca ni compatibilidad universal de escritorios.

## Abrir sin herramientas de desarrollo

```sh
chmod +x CVForge-0.1.0-x86_64.AppImage
./CVForge-0.1.0-x86_64.AppImage
```

También se puede habilitar «Permitir ejecutar» y abrir con doble clic. El arranque
FUSE normal y la reapertura pasan fuera del namespace de aceptación, sin modo
de extracción y con sandbox activo. Node,
npm, VS Code y servidor de desarrollo no son requisitos del usuario.

En el entorno de aceptación el montaje FUSE dentro del namespace aislado devuelve
`Operation not permitted`; ese intento produjo el aviso «Cannot mount AppImage».
No se confunde con corrupción de SQLite ni con un fallo del artefacto: el
montaje normal sí se ha probado fuera de ese namespace, en este mismo host.
No se certifican todos los equipos/launchers. La ruta validada sin FUSE es:

```sh
APPIMAGE_EXTRACT_AND_RUN=1 ./CVForge-0.1.0-x86_64.AppImage
```

La extracción la realiza el runtime incluido, sin instalación ni descargas.
FUSE funcional es requisito del montaje normal; extract-and-run es una alternativa
del propio runtime, según la [documentación oficial AppImage](https://docs.appimage.org/user-guide/troubleshooting/fuse.html#extract-and-run-type-2-appimages).
Las pruebas nuevas mantienen el sandbox Chromium, comprueban que no existe
`--no-sandbox`, usan un cwd fuera del checkout y una biblioteca temporal.
El arranque sin `--user-data-dir` también se prueba con `XDG_CONFIG_HOME` aislado:
`CVForge/library/library.sqlite3`. Los datos normales viven en
`~/.config/CVForge/library`, o su equivalente bajo `$XDG_CONFIG_HOME`.

AppImageLauncher del host puede mover una AppImage a `~/Applications`; esto causó
un ENOENT del harness al reutilizar su ruta anterior. Las pruebas usan
`APPIMAGELAUNCHER_DISABLE=1`, sin modificar la configuración del equipo.
Es comportamiento de [integración AppImage](https://github.com/AppImage/docs.appimage.org/blob/master/source/user-guide/run-appimages.rst);
la variable está documentada por el [mantenedor de AppImageLauncher](https://github.com/TheAssassin/AppImageLauncher/discussions/679).

## Construcción reproducible

Con las dependencias bloqueadas y Electron ya instalado:

```sh
npm run package:appimage
```

`scripts/package-appimage.mjs` ejecuta TypeScript/Vite y electron-builder, no
publica y genera inventario de tamaño/hash. Fija por defecto
`SOURCE_DATE_EPOCH=1792756800` (23/10/2026, 12:00 UTC), sobreescribible por el
constructor. Dos builds independientes con el toolset 1.0.3 producen el SHA-256
anterior y el mismo tamaño. Evidencia actual: `/tmp/cvforge-f9/remediation-appimage-build.log`,
`remediation-reproducible-build.log` y `remediation/reproducibility.json`.
La aceptación empaquetada compara 95 archivos de código/recursos con dist; los
dos builds nuevos tienen exactamente el mismo SHA-256 y tamaño.

El toolset legacy incluía mksquashfs 4.3-git/2017, que no ofrece los controles
de fecha reproducible; dos builds diferían pese a SOURCE_DATE_EPOCH. Se sustituyó
por un toolset admitido y verificado por la versión bloqueada de electron-builder,
sin parchear node_modules ni introducir dependencias de producción.
La igualdad se demuestra en este equipo/lockfile, no entre distribuciones arbitrarias.

## Uso y copias

Crear CV → editar → Confirmar conserva los cambios automáticamente en la
biblioteca. Cancelar descarta el formulario. Importar siempre presenta revisión;
los PDF compatibles recuperan solo la salida visible. Presentación ofrece Simple
y Lateral; Exportar PDF guarda los bytes de la preview. Exportar proyecto guarda
el CV completo `.cvproj`.

**Perfil maestro** abre el contenido reutilizable de las ocho áreas. Crear CV
desde perfil permite seleccionar campos/secciones/entradas y crea un documento
independiente; no hay sincronización posterior.

**Exportar biblioteca (.cvproj)** usa el diálogo de archivo y scope workspace,
con el codec existente: perfil, CV, configuración, assets e historial declarado.
Resolver primero formularios/borradores pendientes; Cancelar selector o fallo de
escritura no anuncia éxito. Importar archivo permite restaurar en una biblioteca
vacía o sustituir con confirmación expresa y backup previo.

Para una copia de archivos locales, cerrar completamente CVForge y conservar
el directorio completo de datos. No hay auto-update, cuenta, telemetría ni cloud.

## Historial de la candidata

La primera evaluación NO APROBADA usó 159 690 709 bytes y SHA-256
`09325f4e4d2345238cae0bcf410977c37852e25fbaaf300bc887cbe5a453fdf0`.
Se conserva ese resultado en ACCEPTANCE/PERFORMANCE; la candidata actual regenera
0.1.0 tras resolver los tres bloqueos, sin cambiar formatos.

La comprobación host de FUSE se ejecuta una sola vez **fuera de namespaces de
usuario/red** mediante `scripts/f9-launch-check.mjs --host-fuse`; verifica el
mapping del host antes de intentar montar. Evidencia:
`/tmp/cvforge-f9/remediation/host-fuse/results.json`. El namespace offline conserva
la alternativa por extracción y no repite intentos FUSE que generen avisos.

AppImageLauncher estaba instalado, con su integración desactivada en el proceso
de prueba para conservar la ruta. La aplicación no depende de él; no se modifica
la configuración del sistema. No se atribuye la prueba a una distribución limpia
o a todos los launchers posibles.
