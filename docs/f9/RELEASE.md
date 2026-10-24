# CVForge 0.1.0 — candidata Linux

Esta es una candidata de aceptación en `f9-mvp-acceptance`, no una publicación
del MVP aprobado. El [resultado de F9](ACCEPTANCE.md) gobierna su entrega. No se
fusiona la rama, no se publica automáticamente y F10 no se inicia.

## Artefacto

- `out/f9/CVForge-0.1.0-x86_64.AppImage`.
- 159 690 709 bytes, aproximadamente 152,3 MiB.
- SHA-256: `09325f4e4d2345238cae0bcf410977c37852e25fbaaf300bc887cbe5a453fdf0`.
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

También se puede habilitar «Permitir ejecutar» y abrir con doble clic. Node,
npm, VS Code y servidor de desarrollo no son requisitos del usuario.

En el entorno de aceptación el montaje FUSE dentro del namespace aislado devuelve
`Operation not permitted`; ese intento produjo el aviso «Cannot mount AppImage».
No se confunde con corrupción de SQLite ni se promete que el montaje esté probado
en cualquier equipo. La ruta validada sin FUSE es:

```sh
APPIMAGE_EXTRACT_AND_RUN=1 ./CVForge-0.1.0-x86_64.AppImage
```

La extracción la realiza el runtime incluido, sin instalación ni descargas.
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
anterior y el mismo tamaño. Evidencia: `/tmp/cvforge-f9/release-build-{1,2}.log`
y `release-reproducibility.json`.

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

Para una copia de archivos locales, cerrar completamente CVForge y conservar
el directorio completo de datos. La GUI aún no exporta workspace ni edita el
perfil maestro completo: son bloqueos de aceptación documentados, no funciones
entregadas. No hay auto-update, cuenta, telemetría ni servicios cloud.

La [matriz de compatibilidad](COMPATIBILITY.md), [límites](KNOWN_LIMITATIONS.md)
y [benchmark](PERFORMANCE.md) detallan qué está probado y qué falta.
