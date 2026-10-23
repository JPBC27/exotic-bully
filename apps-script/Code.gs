/**
 * RiverBulls — backend de la web en Google Sheets.
 *
 * Hojas:
 *   Visitas    → cada visita a la web (fecha y hora, ciudad aproximada, fuente, dispositivo). Automático.
 *   Contactos  → cada persona que toca WhatsApp (distrito, nombre, celular). Automático + estado manual.
 *   Cachorros  → el catálogo que muestra la web. "Vendido" u "Oculto" = desaparece de la web.
 *   Ventas     → cada venta con precio, descuento, costo y ganancia.
 *   Admins     → correos que pueden entrar a admin.html. Rol Admin (ve todo) o Vendedor (no ve costos ni ganancias).
 *   Resumen    → visitas por ciudad, hora y día; contactos por distrito; ventas y ganancia. Se calcula solo.
 *
 * Instalación y uso: ver LEEME.md.
 */

const SHEET_ID = '1NJJxItkdajb1KysfznUY3yKRJLe__xFlZhCX96bDj3I';
const CLIENT_ID = '348391653305-0jkl3q0b5ce0fq1vuf6i9huikte93snc.apps.googleusercontent.com';   // ID de cliente OAuth de Google. El mismo que va en datos.js
const MONEDA = 'S/ ';            // cambia a 'US$ ' si vendes en dólares
const ZONA = 'America/Lima';

const H = { visitas: 'Visitas', contactos: 'Contactos', cachorros: 'Cachorros', ventas: 'Ventas', admins: 'Admins', resumen: 'Resumen' };
const COL = {
  visitas:   ['Fecha', 'Ciudad', 'Región', 'País', 'Fuente', 'Dispositivo', 'Página'],
  contactos: ['Fecha', 'Distrito', 'Provincia', 'Nombre', 'Celular', 'Cachorro', 'Origen', 'Estado', 'Notas'],
  cachorros: ['ID', 'Nombre', 'Sexo', 'Color', 'Edad', 'Precio publicado', 'Estado', 'Fotos', 'Nota', 'Costo', 'Fecha de venta'],
  ventas:    ['Fecha', 'ID cachorro', 'Cachorro', 'Comprador', 'Celular', 'Distrito', 'Precio de venta', 'Costo', 'Otros gastos', 'Ganancia', 'Notas', 'Precio publicado', 'Descuento', 'Registrado por', 'Sexo', 'Color'],
  admins:    ['Correo', 'Nombre', 'Rol', 'Activo']
};
const ESTADOS_CONTACTO = ['Nuevo', 'Escribió', 'Interesado', 'Separó', 'Compró', 'No respondió', 'Descartado'];
const ESTADOS_CACHORRO = ['Disponible', 'Reservado', 'Vendido', 'Oculto'];

const libro = () => SpreadsheetApp.openById(SHEET_ID);
const hoja = nombre => libro().getSheetByName(nombre);

/* =================== menú en el Sheet =================== */
function onOpen() {
  SpreadsheetApp.getUi().createMenu('RiverBulls')
    .addItem('Registrar venta', 'abrirVenta')
    .addSeparator()
    .addItem('Configurar hojas', 'configurar')
    .addToUi();
}

/* cualquier cambio en "Cachorros" refresca el catálogo de la web al instante */
function onEdit(e) {
  if (e && e.range && e.range.getSheet().getName() === H.cachorros) CacheService.getScriptCache().remove('catalogo');
}

/* =================== configuración (se puede volver a ejecutar sin perder datos) =================== */
function configurar() {
  const ss = libro();
  ss.setSpreadsheetTimeZone(ZONA);
  const preparar = (nombre, columnas) => {
    const sh = ss.getSheetByName(nombre) || ss.insertSheet(nombre);
    sh.getRange(1, 1, 1, columnas.length).setValues([columnas]).setFontWeight('bold');
    sh.setFrozenRows(1);
    sh.setColumnWidths(1, columnas.length, 130);
    return sh;
  };
  const lista = valores => SpreadsheetApp.newDataValidation().requireValueInList(valores, true).setAllowInvalid(false).build();
  const formatoMoneda = '"' + MONEDA + '"#,##0';

  preparar(H.visitas, COL.visitas).getRange('A:A').setNumberFormat('dd/mm/yyyy hh:mm');

  const c = preparar(H.contactos, COL.contactos);
  c.getRange('A:A').setNumberFormat('dd/mm/yyyy hh:mm');
  c.getRange('E:E').setNumberFormat('@');
  c.getRange(2, 8, c.getMaxRows() - 1, 1).setDataValidation(lista(ESTADOS_CONTACTO));
  c.setColumnWidth(9, 260);

  const k = preparar(H.cachorros, COL.cachorros);
  k.getRange('A:A').setNumberFormat('@');
  k.getRange(2, 3, k.getMaxRows() - 1, 1).setDataValidation(lista(['Macho', 'Hembra']));
  k.getRange(2, 7, k.getMaxRows() - 1, 1).setDataValidation(lista(ESTADOS_CACHORRO));
  k.getRange('F:F').setNumberFormat(formatoMoneda);
  k.getRange('J:J').setNumberFormat(formatoMoneda);
  k.getRange('K:K').setNumberFormat('dd/mm/yyyy');
  k.setColumnWidth(8, 260); k.setColumnWidth(9, 260);
  k.getRange('J1').setNote('Lo que pagas por el cachorro. NO se muestra en la web ni a los vendedores.');
  k.getRange('H1').setNote('Rutas de fotos separadas por coma, ej: img/rocky-1.jpg, img/rocky-2.jpg');

  const ve = preparar(H.ventas, COL.ventas);
  ve.getRange('A:A').setNumberFormat('dd/mm/yyyy');
  ve.getRange('E:E').setNumberFormat('@');
  ve.getRange('G:J').setNumberFormat(formatoMoneda);
  ve.getRange('L:M').setNumberFormat(formatoMoneda);
  ve.getRange('J1').setNote('Precio de venta − Costo − Otros gastos. Si agregas una fila a mano, copia la fórmula de arriba.');

  const a = preparar(H.admins, COL.admins);
  a.getRange(2, 3, a.getMaxRows() - 1, 1).setDataValidation(lista(['Admin', 'Vendedor']));
  a.getRange(2, 4, a.getMaxRows() - 1, 1).setDataValidation(lista(['Sí', 'No']));
  a.setColumnWidth(1, 260);
  if (a.getLastRow() < 2) {
    const yo = Session.getEffectiveUser().getEmail();
    if (yo) a.getRange(2, 1, 1, 4).setValues([[yo, 'Jean Paul', 'Admin', 'Sí']]);
  }

  const r = ss.getSheetByName(H.resumen) || ss.insertSheet(H.resumen);
  r.clear();
  const titulo = (celda, texto) => r.getRange(celda).setValue(texto).setFontWeight('bold');

  titulo('A1', 'Visitas por ciudad');
  r.getRange('A2').setFormula('=IFERROR(QUERY(Visitas!A2:D, "select B, count(A) where B is not null and B <> \'\' group by B order by count(A) desc label B \'Ciudad\', count(A) \'Visitas\'", 0), "Sin visitas todavía")');

  titulo('D1', 'Contactos y compras por distrito');
  r.getRange('D2').setFormula('=IFERROR(QUERY(Contactos!A2:H, "select B, count(A) where B is not null group by B order by count(A) desc label B \'Distrito\', count(A) \'Contactos\'", 0), "Sin contactos todavía")');
  r.getRange('F2:G2').setValues([['Compraron', '% compra']]);
  r.getRange('F3').setFormula('=ARRAYFORMULA(IF(D3:D="", "", COUNTIFS(Contactos!B2:B, D3:D, Contactos!H2:H, "Compró")))');
  r.getRange('G3').setFormula('=ARRAYFORMULA(IF(D3:D="", "", IFERROR(F3:F / E3:E, 0)))');
  r.getRange('G3:G').setNumberFormat('0%');

  titulo('I1', 'Ventas');
  r.getRange('I2:J8').setValues([
    ['Cachorros vendidos', '=COUNTA(Ventas!A2:A)'],
    ['Total vendido', '=SUM(Ventas!G2:G)'],
    ['Descuentos dados', '=SUM(Ventas!M2:M)'],
    ['Costo total', '=SUM(Ventas!H2:H)'],
    ['Otros gastos', '=SUM(Ventas!I2:I)'],
    ['Ganancia', '=SUM(Ventas!J2:J)'],
    ['Ganancia promedio por cachorro', '=IFERROR(J7 / J2, 0)']
  ]);
  r.getRange('J3:J8').setNumberFormat(formatoMoneda);

  titulo('I11', 'Visitas por fuente');
  r.getRange('I12').setFormula('=IFERROR(QUERY(Visitas!A2:E, "select E, count(A) where E is not null group by E order by count(A) desc label E \'Fuente\', count(A) \'Visitas\'", 0), "Sin visitas todavía")');

  titulo('L1', 'Visitas por hora del día');
  r.getRange('L2').setFormula('=IFERROR(QUERY(Visitas!A2:A, "select hour(A), count(A) where A is not null group by hour(A) order by hour(A) label hour(A) \'Hora\', count(A) \'Visitas\'", 0), "Sin visitas todavía")');

  titulo('O1', 'Visitas por día de la semana');
  r.getRange('O2').setFormula('=IFERROR(QUERY(Visitas!A2:A, "select dayOfWeek(A), count(A) where A is not null group by dayOfWeek(A) order by dayOfWeek(A) label dayOfWeek(A) \'Día\', count(A) \'Visitas\'", 0), "Sin visitas todavía")');
  r.getRange('O1').setNote('Día: 1 = domingo, 2 = lunes … 7 = sábado');

  titulo('R1', 'Ventas por color');
  r.getRange('R2').setFormula('=IFERROR(QUERY(Ventas!A2:P, "select P, count(A), sum(G), avg(G), sum(J) where A is not null group by P order by count(A) desc label P \'Color\', count(A) \'Vendidos\', sum(G) \'Total vendido\', avg(G) \'Precio promedio\', sum(J) \'Ganancia\'", 0), "Sin ventas todavía")');
  r.getRange('T3:V').setNumberFormat(formatoMoneda);

  titulo('X1', 'Ventas por sexo');
  r.getRange('X2').setFormula('=IFERROR(QUERY(Ventas!A2:P, "select O, count(A), sum(G), avg(G), sum(J) where A is not null group by O order by count(A) desc label O \'Sexo\', count(A) \'Vendidos\', sum(G) \'Total vendido\', avg(G) \'Precio promedio\', sum(J) \'Ganancia\'", 0), "Sin ventas todavía")');
  r.getRange('Z3:AB').setNumberFormat(formatoMoneda);

  titulo('AD1', 'Ventas por mes');
  r.getRange('AD2').setFormula('=IFERROR(QUERY(Ventas!A2:P, "select year(A), month(A)+1, count(A), sum(G), sum(J) where A is not null group by year(A), month(A)+1 order by year(A), month(A)+1 label year(A) \'Año\', month(A)+1 \'Mes\', count(A) \'Vendidos\', sum(G) \'Total vendido\', sum(J) \'Ganancia\'", 0), "Sin ventas todavía")');
  r.getRange('AG3:AH').setNumberFormat(formatoMoneda);

  r.getRange('A2:AH2').setFontWeight('bold');
  r.setColumnWidths(1, 34, 120);
  r.setColumnWidth(9, 220);
}

/* =================== la web pública llama aquí =================== */
function doGet(e) {
  const accion = e && e.parameter && e.parameter.accion;
  if (accion === 'catalogo') return respuesta({ ok: true, cachorros: catalogo() });
  return respuesta({ ok: true, servicio: 'RiverBulls' });
}

function doPost(e) {
  let d;
  try { d = JSON.parse((e && e.postData && e.postData.contents) || '{}'); }
  catch (err) { return respuesta({ ok: false, error: 'Solicitud inválida' }); }

  if (d.accion && String(d.accion).indexOf('admin.') === 0) return panelAdmin(d);

  try {
    if (d.web) return respuesta({ ok: true });            // campo trampa lleno = bot, se ignora en silencio
    let nombreHoja, fila;
    if (d.tipo === 'visita') {
      nombreHoja = H.visitas;
      fila = [new Date(), limpiar(d.ciudad, 60) || 'Desconocida', limpiar(d.region, 60), limpiar(d.pais, 40),
              limpiar(d.fuente, 40), limpiar(d.dispositivo, 20), limpiar(d.pagina, 80)];
    } else {
      const distrito = limpiar(d.distrito, 60);
      if (!distrito) return respuesta({ ok: false, error: 'Falta el distrito' });
      nombreHoja = H.contactos;
      fila = [new Date(), distrito, limpiar(d.provincia, 60), limpiar(d.nombre, 60), limpiar(d.celular, 16),
              limpiar(d.cachorro, 80), limpiar(d.origen, 40), 'Nuevo', ''];
    }
    conCandado(() => hoja(nombreHoja).appendRow(fila));
    return respuesta({ ok: true });
  } catch (err) {
    return respuesta({ ok: false, error: 'No se pudo registrar' });
  }
}

/* disponibles y reservados; nunca expone el costo */
function catalogo() {
  const cache = CacheService.getScriptCache();
  const guardado = cache.get('catalogo');
  if (guardado) return JSON.parse(guardado);
  const lista = filasCachorros()
    .filter(c => c.estado === 'Disponible' || c.estado === 'Reservado')
    .map(c => ({
      id: c.id, nombre: c.nombre, sexo: c.sexo, color: c.color, edad: c.edad,
      precio: typeof c.precio === 'number' ? dinero(c.precio) : String(c.precio || 'Consultar'),
      estado: c.estado === 'Reservado' ? 'reservado' : 'disponible',
      fotos: c.fotos, nota: c.nota
    }));
  cache.put('catalogo', JSON.stringify(lista), 300);
  return lista;
}

function filasCachorros() {
  return hoja(H.cachorros).getDataRange().getValues().slice(1)
    .map((f, i) => ({
      fila: i + 2, id: String(f[0]).trim(), nombre: String(f[1]),
      sexo: String(f[2]).toLowerCase() === 'hembra' ? 'hembra' : 'macho',
      color: String(f[3]), edad: String(f[4]), precio: f[5], estado: String(f[6]),
      fotos: String(f[7] || '').split(',').map(s => s.trim()).filter(Boolean),
      nota: String(f[8] || ''), costo: f[9], fechaVenta: f[10]
    }))
    .filter(c => c.id && c.nombre);
}

/* =================== panel de administración (admin.html) =================== */
function panelAdmin(d) {
  try {
    const u = usuarioConAcceso(d.token);
    switch (d.accion) {
      case 'admin.panel':  return respuesta({ ok: true, usuario: u, ...datosPanel(u) });
      case 'admin.estado': cambiarEstado(d.id, d.estado); return respuesta({ ok: true });
      case 'admin.vender':
        venderCachorro({ ...d, costo: u.rol === 'Admin' ? d.costo : null }, u.correo);
        return respuesta({ ok: true });
      default: return respuesta({ ok: false, error: 'Acción desconocida' });
    }
  } catch (err) {
    return respuesta({ ok: false, error: err.message || 'Error', codigo: err.codigo || '' });
  }
}

/* verifica el ID token de Google y busca el correo en la hoja Admins */
function usuarioConAcceso(token) {
  const falla = (msg, codigo) => { const e = new Error(msg); e.codigo = codigo; return e; };
  if (!CLIENT_ID) throw falla('Falta configurar CLIENT_ID en Code.gs.', 'config');
  if (!token) throw falla('Inicia sesión para continuar.', 'auth');

  const cache = CacheService.getScriptCache();
  const clave = 'tk_' + Utilities.base64EncodeWebSafe(Utilities.computeDigest(Utilities.DigestAlgorithm.SHA_256, token)).slice(0, 40);
  let correo = cache.get(clave);
  if (!correo) {
    const r = UrlFetchApp.fetch('https://oauth2.googleapis.com/tokeninfo?id_token=' + encodeURIComponent(token), { muteHttpExceptions: true });
    if (r.getResponseCode() !== 200) throw falla('Tu sesión venció. Vuelve a iniciar sesión.', 'auth');
    const info = JSON.parse(r.getContentText());
    if (info.aud !== CLIENT_ID || String(info.email_verified) !== 'true' || Number(info.exp) * 1000 < Date.now())
      throw falla('Tu sesión no es válida. Vuelve a iniciar sesión.', 'auth');
    correo = normalizar(info.email);
    cache.put(clave, correo, 300);
  }
  const fila = hoja(H.admins).getDataRange().getValues().slice(1)
    .find(f => normalizar(f[0]) === correo && normalizar(f[3]) === 'sí');
  if (!fila) throw falla('El correo ' + correo + ' no tiene acceso. Pide que lo agreguen en la hoja Admins.', 'sinacceso');
  return { correo, nombre: String(fila[1] || correo), rol: String(fila[2]) === 'Admin' ? 'Admin' : 'Vendedor' };
}

function datosPanel(u) {
  const esAdmin = u.rol === 'Admin';
  const hoy = Utilities.formatDate(new Date(), ZONA, 'yyyy-MM-dd');
  const mes = hoy.slice(0, 7);
  const hace30 = Date.now() - 30 * 864e5;
  const dia = f => f instanceof Date ? Utilities.formatDate(f, ZONA, 'yyyy-MM-dd') : '';

  const visitas = hoja(H.visitas).getDataRange().getValues().slice(1);
  const porHora = new Array(24).fill(0);
  let visitasHoy = 0;
  visitas.forEach(f => {
    if (!(f[0] instanceof Date)) return;
    if (dia(f[0]) === hoy) visitasHoy++;
    if (f[0].getTime() >= hace30) porHora[Number(Utilities.formatDate(f[0], ZONA, 'H'))]++;
  });

  const contactosHoy = hoja(H.contactos).getDataRange().getValues().slice(1).filter(f => dia(f[0]) === hoy).length;

  const ventas = hoja(H.ventas).getDataRange().getValues().slice(1).filter(f => f[0] instanceof Date);
  const ventasMes = ventas.filter(f => dia(f[0]).slice(0, 7) === mes);
  const resumen = { visitasHoy, contactosHoy, vendidosMes: ventasMes.length };
  if (esAdmin) resumen.gananciaMes = ventasMes.reduce((s, f) => s + (Number(f[9]) || 0), 0);

  const cachorros = filasCachorros().map(c => {
    const x = { id: c.id, nombre: c.nombre, sexo: c.sexo, color: c.color, estado: c.estado,
                precio: typeof c.precio === 'number' ? c.precio : null, precioTexto: typeof c.precio === 'number' ? dinero(c.precio) : String(c.precio || '') };
    if (esAdmin) x.costo = typeof c.costo === 'number' ? c.costo : null;
    if (c.estado === 'Vendido') x.fechaVenta = c.fechaVenta instanceof Date ? Utilities.formatDate(c.fechaVenta, ZONA, 'dd/MM/yyyy') : '';
    return x;
  });

  return { moneda: MONEDA, resumen, visitasPorHora: porHora, cachorros };
}

function cambiarEstado(id, estado) {
  if (['Disponible', 'Reservado', 'Oculto'].indexOf(estado) < 0) throw new Error('Estado no válido.');
  conCandado(() => {
    const c = filasCachorros().find(x => x.id === String(id));
    if (!c) throw new Error('No encontré ese cachorro.');
    if (c.estado === 'Vendido') throw new Error('Ese cachorro ya está vendido.');
    hoja(H.cachorros).getRange(c.fila, 7).setValue(estado);
  });
  CacheService.getScriptCache().remove('catalogo');
}

/* una sola lógica de venta para el panel web y para el menú del Sheet.
   costo === null → se toma el de la hoja Cachorros (los vendedores no lo ven ni lo cambian) */
function venderCachorro(v, quien) {
  const id = String(v.id || '').trim();
  const precio = Number(v.precio), gastos = Math.max(0, Number(v.gastos) || 0);
  if (!id) throw new Error('Elige el cachorro vendido.');
  if (!(precio > 0)) throw new Error('Escribe el precio de venta.');

  conCandado(() => {
    const c = filasCachorros().find(x => x.id === id);
    if (!c) throw new Error('No encontré ese cachorro en la hoja Cachorros.');
    if (c.estado === 'Vendido') throw new Error(c.nombre + ' ya figura como vendido.');
    const costoHoja = Number(c.costo) || 0;
    const costo = (v.costo === null || v.costo === undefined || v.costo === '') ? costoHoja : Math.max(0, Number(v.costo) || 0);
    const publicado = typeof c.precio === 'number' ? c.precio : '';
    const descuento = publicado !== '' ? Math.max(0, publicado - precio) : '';

    const k = hoja(H.cachorros);
    k.getRange(c.fila, 7).setValue('Vendido');
    k.getRange(c.fila, 11).setValue(new Date());
    if (costo && !costoHoja) k.getRange(c.fila, 10).setValue(costo);

    const ve = hoja(H.ventas);
    const fila = ve.getLastRow() + 1;
    ve.getRange(fila, 1, 1, COL.ventas.length).setValues([[
      new Date(), id, c.nombre, limpiar(v.comprador, 60), limpiar(v.celular, 16), limpiar(v.distrito, 60),
      precio, costo, gastos, '=G' + fila + '-H' + fila + '-I' + fila, limpiar(v.notas, 200),
      publicado, descuento, limpiar(quien, 80),
      c.sexo === 'hembra' ? 'Hembra' : 'Macho', limpiar(c.color, 40)
    ]]);
  });
  CacheService.getScriptCache().remove('catalogo');
}

/* =================== registrar venta desde el menú del Sheet =================== */
function abrirVenta() {
  const html = HtmlService.createHtmlOutput(htmlVenta()).setWidth(430).setHeight(640);
  SpreadsheetApp.getUi().showModalDialog(html, 'Registrar venta');
}

function cachorrosParaVenta() {
  return filasCachorros().filter(c => c.estado !== 'Vendido')
    .map(c => ({ id: c.id, nombre: c.nombre, precio: Number(c.precio) || '', costo: Number(c.costo) || '' }));
}

function registrarVenta(v) {
  venderCachorro(v, Session.getActiveUser().getEmail() || 'Sheet');
  return true;
}

function htmlVenta() {
  return `<!doctype html><html><head><base target="_top"><style>
  body{font-family:Arial,sans-serif;font-size:14px;margin:0;padding:4px 2px;color:#222}
  label{display:block;margin:10px 0 4px;font-weight:bold}
  input,select,textarea{width:100%;box-sizing:border-box;padding:8px;border:1px solid #bbb;border-radius:4px;font-size:14px}
  .fila{display:flex;gap:8px}.fila>div{flex:1}
  button{margin-top:16px;width:100%;padding:10px;background:#C9A227;border:0;border-radius:4px;font-weight:bold;font-size:15px;cursor:pointer}
  .error{color:#b3261e;margin-top:10px;min-height:18px}.calc{margin-top:10px;font-weight:bold}
  </style></head><body>
  <label for="id">Cachorro vendido</label><select id="id"><option value="">Cargando…</option></select>
  <label for="comprador">Comprador</label><input id="comprador" maxlength="60">
  <div class="fila"><div><label for="celular">Celular</label><input id="celular" maxlength="16"></div>
  <div><label for="distrito">Distrito</label><input id="distrito" maxlength="60"></div></div>
  <div class="fila"><div><label for="precio">Precio de venta</label><input id="precio" type="number" min="0" step="1"></div>
  <div><label for="costo">Costo</label><input id="costo" type="number" min="0" step="1"></div></div>
  <label for="gastos">Otros gastos (traslado, vacunas, comisión…)</label><input id="gastos" type="number" min="0" step="1" value="0">
  <div class="calc" id="calc"></div>
  <label for="notas">Notas</label><textarea id="notas" rows="2" maxlength="200"></textarea>
  <button id="guardar">Registrar venta</button><div class="error" id="error"></div>
  <script>
  var lista = [], publicado = 0;
  var $ = function(i){ return document.getElementById(i); };
  var fmt = function(n){ return '${MONEDA}' + Number(n).toLocaleString('en-US'); };
  function calcular(){
    var p = Number($('precio').value) || 0, c = Number($('costo').value) || 0, g = Number($('gastos').value) || 0;
    var t = p ? 'Ganancia: ' + fmt(p - c - g) : '';
    if (p && publicado && p < publicado) t += ' · Descuento: ' + fmt(publicado - p);
    $('calc').textContent = t;
  }
  google.script.run.withSuccessHandler(function(l){
    lista = l;
    $('id').innerHTML = '<option value="">Elige el cachorro</option>' + l.map(function(x){
      return '<option value="' + x.id + '">' + x.nombre + ' (' + x.id + ')</option>'; }).join('');
    if (!l.length) $('error').textContent = 'No hay cachorros sin vender en la hoja Cachorros.';
  }).cachorrosParaVenta();
  $('id').addEventListener('change', function(){
    var x = lista.filter(function(y){ return y.id === $('id').value; })[0];
    publicado = x ? Number(x.precio) || 0 : 0;
    if (x){ $('precio').value = x.precio; $('costo').value = x.costo; }
    calcular(); $('error').textContent = '';
  });
  ['precio','costo','gastos'].forEach(function(i){ $(i).addEventListener('input', calcular); });
  $('guardar').addEventListener('click', function(){
    if (!$('id').value){ $('error').textContent = 'Elige el cachorro vendido.'; return; }
    if (!(Number($('precio').value) > 0)){ $('error').textContent = 'Escribe el precio de venta.'; return; }
    $('guardar').disabled = true; $('guardar').textContent = 'Guardando…';
    google.script.run
      .withSuccessHandler(function(){ google.script.host.close(); })
      .withFailureHandler(function(err){ $('error').textContent = err.message; $('guardar').disabled = false; $('guardar').textContent = 'Registrar venta'; })
      .registrarVenta({ id: $('id').value, comprador: $('comprador').value, celular: $('celular').value, distrito: $('distrito').value,
        precio: $('precio').value, costo: $('costo').value, gastos: $('gastos').value, notas: $('notas').value });
  });
  </script></body></html>`;
}

/* =================== utilidades =================== */
function conCandado(fn) {
  const lock = LockService.getScriptLock();
  lock.waitLock(10000);
  try { return fn(); } finally { lock.releaseLock(); }
}

function normalizar(s) { return String(s == null ? '' : s).trim().toLowerCase(); }

function dinero(n) { return MONEDA + Number(n).toLocaleString('en-US'); }

/* texto corto, sin saltos de línea y sin fórmulas inyectadas (=, +, -, @) */
function limpiar(valor, max) {
  let s = String(valor == null ? '' : valor).replace(/[\r\n\t]+/g, ' ').trim().slice(0, max);
  if (/^[=+\-@]/.test(s)) s = "'" + s;
  return s;
}

function respuesta(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj)).setMimeType(ContentService.MimeType.JSON);
}
