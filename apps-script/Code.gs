/**
 * RiverBulls — registro de contactos de la web.
 * La web manda cada contacto (POST, texto plano con JSON) y aquí se guarda en la hoja "Contactos".
 *
 * Uso:
 *   1) Pega este código en Extensiones › Apps Script del Google Sheet.
 *   2) Ejecuta configurar() una sola vez (crea las hojas, la lista de estados y el resumen).
 *   3) Implementar › Nueva implementación › Aplicación web
 *      Ejecutar como: Yo · Quién tiene acceso: Cualquier usuario.
 *   4) Copia la URL que termina en /exec y pégala en js/datos.js → CONFIG.apiContactos.
 */

const HOJA = 'Contactos';
const COLUMNAS = ['Fecha', 'Distrito', 'Provincia', 'Nombre', 'Celular', 'Cachorro', 'Origen', 'Estado', 'Notas'];
const ESTADOS = ['Nuevo', 'Escribió', 'Interesado', 'Separó', 'Compró', 'No respondió', 'Descartado'];

/* ---------- se ejecuta una vez a mano ---------- */
function configurar() {
  const ss = SpreadsheetApp.getActive();

  const sh = ss.getSheetByName(HOJA) || ss.insertSheet(HOJA);
  sh.getRange(1, 1, 1, COLUMNAS.length).setValues([COLUMNAS]).setFontWeight('bold');
  sh.setFrozenRows(1);
  sh.getRange('A:A').setNumberFormat('dd/mm/yyyy hh:mm');
  sh.getRange('E:E').setNumberFormat('@');                 // celular como texto
  const regla = SpreadsheetApp.newDataValidation().requireValueInList(ESTADOS, true).setAllowInvalid(false).build();
  sh.getRange(2, 8, sh.getMaxRows() - 1, 1).setDataValidation(regla);
  sh.setColumnWidths(1, COLUMNAS.length, 140);
  sh.setColumnWidth(9, 280);

  const r = ss.getSheetByName('Resumen') || ss.insertSheet('Resumen');
  r.clear();
  r.getRange('A1').setValue('Contactos y ventas por distrito').setFontWeight('bold').setFontSize(13);
  // A3:B → distrito y número de contactos, ordenado de mayor a menor
  r.getRange('A3').setFormula(
    '=IFERROR(QUERY(Contactos!A2:H, "select B, count(A) where B is not null group by B order by count(A) desc label B \'Distrito\', count(A) \'Contactos\'", 0), "Sin contactos todavía")');
  r.getRange('C3:E3').setValues([['Escribieron', 'Compraron', '% compra']]);
  r.getRange('C4').setFormula(
    '=ARRAYFORMULA(IF(A4:A="", "", COUNTIFS(Contactos!B2:B, A4:A, Contactos!H2:H, "Escribió") + COUNTIFS(Contactos!B2:B, A4:A, Contactos!H2:H, "Interesado") + COUNTIFS(Contactos!B2:B, A4:A, Contactos!H2:H, "Separó") + COUNTIFS(Contactos!B2:B, A4:A, Contactos!H2:H, "Compró")))');
  r.getRange('D4').setFormula('=ARRAYFORMULA(IF(A4:A="", "", COUNTIFS(Contactos!B2:B, A4:A, Contactos!H2:H, "Compró")))');
  r.getRange('E4').setFormula('=ARRAYFORMULA(IF(A4:A="", "", IFERROR(D4:D / B4:B, 0)))');
  r.getRange('E4:E').setNumberFormat('0%');
  r.getRange('A3:E3').setFontWeight('bold');
  r.setFrozenRows(3);
  r.setColumnWidths(1, 5, 150);
}

/* ---------- la web llama aquí ---------- */
function doPost(e) {
  try {
    const d = JSON.parse((e && e.postData && e.postData.contents) || '{}');
    if (d.web) return respuesta({ ok: true });            // campo trampa lleno = bot, se ignora en silencio

    const distrito = limpiar(d.distrito, 60);
    if (!distrito) return respuesta({ ok: false, error: 'Falta el distrito' });

    const fila = [
      new Date(),
      distrito,
      limpiar(d.provincia, 60),
      limpiar(d.nombre, 60),
      limpiar(d.celular, 16),
      limpiar(d.cachorro, 80),
      limpiar(d.origen, 40),
      'Nuevo',
      ''
    ];

    const lock = LockService.getScriptLock();
    lock.waitLock(10000);
    try {
      SpreadsheetApp.getActive().getSheetByName(HOJA).appendRow(fila);
    } finally {
      lock.releaseLock();
    }
    return respuesta({ ok: true });
  } catch (err) {
    return respuesta({ ok: false, error: 'No se pudo registrar' });
  }
}

function doGet() {
  return respuesta({ ok: true, servicio: 'contactos RiverBulls' });
}

/* texto corto, sin saltos de línea y sin fórmulas inyectadas (=, +, -, @) */
function limpiar(valor, max) {
  let s = String(valor == null ? '' : valor).replace(/[\r\n\t]+/g, ' ').trim().slice(0, max);
  if (/^[=+\-@]/.test(s)) s = "'" + s;
  return s;
}

function respuesta(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj)).setMimeType(ContentService.MimeType.JSON);
}
