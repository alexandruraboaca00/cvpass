// Source message IDs only; no native stacks, filenames or CV contents in errors.
const messages:Record<string,string>={
  EACCES:'No se pudo escribir en la carpeta elegida. El CV confirmado se conserva. Elige otra carpeta o revisa sus permisos.',
  EPERM:'No se pudo escribir en la carpeta elegida. El CV confirmado se conserva. Elige otra carpeta o revisa sus permisos.',
  ENOSPC:'No hay espacio disponible para completar el guardado. El CV confirmado se conserva. Libera espacio y vuelve a intentarlo.',
  SQLITE_FULL:'No hay espacio disponible para completar el guardado. El CV confirmado se conserva. Libera espacio y vuelve a intentarlo.',
  SQLITE_BUSY:'La biblioteca está ocupada por otra operación. El CV confirmado se conserva. Espera y vuelve a intentarlo.',
  SQLITE_LOCKED:'La biblioteca está ocupada por otra operación. El CV confirmado se conserva. Espera y vuelve a intentarlo.',
  RENDER_TEMPLATE_UNSUPPORTED:'Selecciona Simple o Lateral en Presentación y vuelve a generar la preview. El CV confirmado se conserva.',
};
export function operationErrorMessage(code:string,fallback:string):string{return messages[code]??fallback;}
