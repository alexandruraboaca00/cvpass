# CVForge 0.1.0 — MVP Linux

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
