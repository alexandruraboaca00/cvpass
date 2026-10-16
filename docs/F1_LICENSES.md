# F1 — Dependencias directas y recursos

Auditoría del 16 de octubre de 2026. Inventario obtenido de los paquetes instalados
y de sus ficheros LICENSE/NOTICE; versiones fijadas en package-lock.json.
La evidencia con hashes está en [f1-direct-licenses.json](validation/f1-direct-licenses.json).
Se reproduce con `node spikes/f1/audit-direct.cjs`.

| Paquete | Versión | Licencia declarada y comprobada | Propósito |
| --- | --- | --- | --- |
| `@huggingface/transformers` | 4.3.1 | Apache-2.0 | Exploración ES/EN previa; no ejecutada ni ampliada en el cierre |
| `better-sqlite3` | 13.0.3 | MIT | Persistencia SQLite en worker |
| `pdf-lib` | 1.17.1 | MIT | Adjuntar/retirar payload e inspección de objetos PDF |
| `pdfjs-dist` | 6.4.299 | Apache-2.0 | Visor, texto, etiquetas, anotaciones y extracción de payload |
| `react` | 19.3.1 | MIT | UI mínima de la prueba |
| `react-dom` | 19.3.1 | MIT | Montaje de UI |
| `@types/react` | 19.3.0 | MIT | Tipos de React para validación |
| `@types/react-dom` | 19.3.0 | MIT | Tipos de React DOM para validación |
| `electron` | 44.7.2 | MIT | Runtime Chromium/Node empaquetado |
| `electron-builder` | 26.15.3 | MIT | Empaquetado Linux y reconstrucción nativa |
| `typescript` | 7.0.2 | Apache-2.0 | Comprobación de TSX |
| `vite` | 8.3.4 | MIT | Bundle local de la UI |

No se han detectado licencias incompatibles o indeterminadas entre estas doce
dependencias directas. Se deben conservar sus textos de licencia y avisos al
redistribuirlas. MIT/Apache-2.0 se refieren a esos paquetes, no a cada componente
de terceros incluido en Chromium. Electron conserva en el paquete Linux su
LICENSE y LICENSES.chromium.html; este cierre no sustituye una revisión de
distribución de una futura versión del producto.

## Fuentes y activos

- Liberation Sans Regular y Bold **2.1.5**, sin modificar: **SIL OFL-1.1**.
  Los campos de copyright, versión y licencia del propio TTF coinciden con
  [la licencia oficial 2.1.5](https://github.com/liberationfonts/liberation-fonts/blob/2.1.5/LICENSE).
  Se incluye copia íntegra en `spikes/f1/assets/LIBERATION-LICENSE.txt`.
  Se usan solo estas dos fuentes; Poppler confirma incrustación, subconjunto y
  correspondencia Unicode en los seis PDF de cierre. No hay dependencia del
  fallback del sistema para los glifos comprobados.
- Imagen: píxeles azules/rojos sintéticos creados por la prueba; solo se exportan
  los cuatro píxeles azules del recorte. Textos y CSS de la prueba son propios.
  No se usa código, estilo, fuente, imagen ni recurso de Europass.
- Poppler 26.08.0 y util-linux/unshare 2.42.4 son herramientas del entorno de
  validación, no dependencias enlazadas ni incluidas en el paquete.

## Incidencias relevantes detectadas automáticamente

`npm audit --omit=dev`: **0 vulnerabilidades**. Auditoría completa: **8 avisos
moderados**, ninguno alto/crítico, propagados por la cadena de herramientas de
empaquetado hasta `sprintf-js` (precisión no acotada,
[GHSA-hp3w-g68c-fv3c](https://github.com/advisories/GHSA-hp3w-g68c-fv3c)).
Se usan configuración y datos sintéticos propios; el flujo empaquetado no
expone esa dependencia de desarrollo. No se ha aplicado una actualización
forzada ni ampliado la auditoría manual al ecosistema transitivo. Es un aviso
de seguridad de desarrollo, no una incompatibilidad de licencia ni un fallo
arquitectónico del flujo validado.

## Exploración de traducción previa, fuera del cierre

La licencia del paquete directo Transformers.js es Apache-2.0. Los pesos ONNX
usados en la exploración anterior tienen procedencia/avisos de redistribución
pendientes: los modelos base declaran Apache-2.0 y las fichas de conversión
Xenova no declaran licencia propia. Esa duda queda registrada; no se publican
pesos ni ejecutables y no se afirma resuelta su redistribución.
Por instrucción explícita del usuario, la traducción no es criterio de F1:
no se ha desarrollado ni ejecutado durante este cierre. Antes de distribuir
un producto que incluya esos pesos deberá cerrarse ese expediente.
