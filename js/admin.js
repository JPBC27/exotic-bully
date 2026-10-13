/* Panel de administración de RiverBulls.
   Login con Google (ID token) → el Apps Script verifica el token y el rol en la hoja Admins. */
(function(){
  const $ = id => document.getElementById(id);
  const esc = s => String(s == null ? '' : s).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  let token = null, datos = null, moneda = 'S/ ', vendiendo = null;
  try { token = sessionStorage.getItem('rb-token'); } catch(e){}
  const dinero = n => moneda + Number(n || 0).toLocaleString('en-US');

  document.querySelectorAll('[data-marca]').forEach(el => el.textContent = CONFIG.marca);
  $('listaDistritos').innerHTML = Object.values(DISTRITOS).flat().map(d => `<option value="${esc(d)}">`).join('');

  function aviso(texto, tipo){
    const a = $('aviso');
    a.hidden = !texto; a.textContent = texto || ''; a.className = 'aviso' + (tipo ? ' ' + tipo : '');
    if (tipo === 'ok') setTimeout(() => { if (a.textContent === texto) a.hidden = true; }, 4000);
  }

  function llamar(accion, extra){
    return fetch(CONFIG.api, {
      method: 'POST',
      headers: { 'Content-Type': 'text/plain;charset=utf-8' },   // sin headers custom: Apps Script no soporta preflight
      redirect: 'follow',
      body: JSON.stringify(Object.assign({ accion, token }, extra || {}))
    })
      .then(r => r.json())
      .then(d => {
        if (!d.ok){
          if (d.codigo === 'auth' || d.codigo === 'sinacceso') cerrarSesion(d.error);
          const e = new Error(d.error || 'Algo falló. Intenta de nuevo.'); e.codigo = d.codigo; throw e;
        }
        return d;
      });
  }

  /* ---------- sesión ---------- */
  function mostrarLogin(){
    $('vistaPanel').hidden = true; $('sesion').hidden = true; $('vistaLogin').hidden = false;
    if (!window.google || !google.accounts) return;
    google.accounts.id.renderButton($('botonGoogle'), { theme: 'filled_black', size: 'large', shape: 'pill', text: 'signin_with', locale: 'es' });
  }
  function cerrarSesion(motivo){
    token = null; datos = null;
    try { sessionStorage.removeItem('rb-token'); } catch(e){}
    if (window.google && google.accounts) google.accounts.id.disableAutoSelect();
    mostrarLogin();
    if (motivo) aviso(motivo, 'mal');
  }
  $('salir').addEventListener('click', () => { cerrarSesion(); aviso('Sesión cerrada.', 'ok'); });

  function iniciar(){
    if (!CONFIG.api || !CONFIG.googleClientId){
      aviso('Falta configurar CONFIG.api y CONFIG.googleClientId en js/datos.js.', 'mal');
      return;
    }
    const s = document.createElement('script');
    s.src = 'https://accounts.google.com/gsi/client'; s.async = true;
    s.onload = () => {
      google.accounts.id.initialize({
        client_id: CONFIG.googleClientId,
        callback: r => { token = r.credential; try { sessionStorage.setItem('rb-token', token); } catch(e){} aviso(''); cargar(); },
        auto_select: true
      });
      if (token) cargar(); else mostrarLogin();
    };
    s.onerror = () => aviso('No se pudo cargar el inicio de sesión de Google. Revisa tu conexión.', 'mal');
    document.head.appendChild(s);
  }

  /* ---------- panel ---------- */
  function cargar(){
    $('vistaLogin').hidden = true;
    return llamar('admin.panel').then(d => {
      datos = d; moneda = d.moneda || moneda;
      $('quien').textContent = `${d.usuario.nombre} · ${d.usuario.rol}`;
      $('sesion').hidden = false; $('vistaPanel').hidden = false;
      pintar();
    }).catch(e => { if (e.codigo !== 'auth' && e.codigo !== 'sinacceso') aviso(e.message, 'mal'); });
  }

  function pintar(){
    const r = datos.resumen, admin = datos.usuario.rol === 'Admin';
    $('tarjetas').innerHTML =
      tarjeta('Visitas hoy', r.visitasHoy) + tarjeta('Contactos hoy', r.contactosHoy) +
      tarjeta('Vendidos este mes', r.vendidosMes) + (admin ? tarjeta('Ganancia del mes', dinero(r.gananciaMes), 'oro') : '');

    const max = Math.max(1, ...datos.visitasPorHora);
    $('horas').innerHTML = datos.visitasPorHora.map((n, h) => `
      <div class="hora" title="${h}:00 – ${n} visitas">
        ${n ? `<span>${n}</span>` : ''}
        <i class="${n ? '' : 'cero'}" style="height:${Math.round(n / max * 100)}%"></i>
        ${h % 3 === 0 ? `<em>${h}h</em>` : ''}
      </div>`).join('');

    const activos = datos.cachorros.filter(c => c.estado !== 'Vendido');
    const vendidos = datos.cachorros.filter(c => c.estado === 'Vendido').reverse();
    $('listaActivos').innerHTML = activos.length ? activos.map(itemActivo).join('')
      : '<p class="vacio-lista">No hay cachorros activos. Agrégalos en la hoja Cachorros del Sheet.</p>';
    $('listaVendidos').innerHTML = vendidos.length ? vendidos.map(c => `
      <div class="item vendido"><div class="item-info">
        <h3>${esc(c.nombre)}</h3>
        <p>${esc(c.id)} · ${c.sexo === 'hembra' ? 'Hembra' : 'Macho'} · vendido ${esc(c.fechaVenta || '')}</p>
      </div></div>`).join('') : '<p class="vacio-lista">Todavía no hay ventas registradas.</p>';
  }

  const tarjeta = (titulo, valor, clase) => `<div class="tarjeta ${clase || ''}"><p>${titulo}</p><b>${esc(valor)}</b></div>`;

  function itemActivo(c){
    const estados = ['Disponible', 'Reservado', 'Oculto'];
    return `
      <div class="item">
        <div class="item-info">
          <h3>${esc(c.nombre)}</h3>
          <p>${esc(c.id)} · ${c.sexo === 'hembra' ? 'Hembra' : 'Macho'} · ${esc(c.color)} · <span class="precio-item">${esc(c.precioTexto || 'Sin precio')}</span></p>
        </div>
        <div class="segmento" role="group" aria-label="Estado de ${esc(c.nombre)}">
          ${estados.map(e => `<button type="button" data-estado="${e}" data-id="${esc(c.id)}" aria-pressed="${c.estado === e}">${e}</button>`).join('')}
        </div>
        <button type="button" class="btn btn-oro" data-vender="${esc(c.id)}">Marcar vendido</button>
      </div>`;
  }

  $('listaActivos').addEventListener('click', e => {
    const b = e.target.closest('[data-estado]');
    if (b){
      if (b.getAttribute('aria-pressed') === 'true') return;
      const grupo = b.parentElement.querySelectorAll('button');
      grupo.forEach(x => x.disabled = true);
      llamar('admin.estado', { id: b.dataset.id, estado: b.dataset.estado })
        .then(() => { const c = datos.cachorros.find(x => x.id === b.dataset.id); if (c) c.estado = b.dataset.estado; pintar(); aviso(`Estado actualizado: ${b.dataset.estado}.`, 'ok'); })
        .catch(err => { grupo.forEach(x => x.disabled = false); if (err.codigo !== 'auth') aviso(err.message, 'mal'); });
      return;
    }
    const v = e.target.closest('[data-vender]');
    if (v) abrirVenta(v.dataset.vender);
  });

  /* ---------- venta ---------- */
  const dlg = $('dlgVenta');
  dlg.querySelector('[data-cerrar]').addEventListener('click', () => dlg.close());
  dlg.addEventListener('click', e => { if (e.target === dlg) dlg.close(); });

  function abrirVenta(id){
    vendiendo = datos.cachorros.find(c => c.id === id); if (!vendiendo) return;
    const admin = datos.usuario.rol === 'Admin';
    $('ventaCachorro').textContent = `${vendiendo.nombre} (${vendiendo.id})` + (vendiendo.precio ? ` · publicado en ${dinero(vendiendo.precio)}` : '');
    $('vPrecio').value = vendiendo.precio || '';
    $('lblCosto').hidden = !admin;
    $('vCosto').value = admin && vendiendo.costo != null ? vendiendo.costo : '';
    $('vGastos').value = 0;
    ['vComprador', 'vCelular', 'vDistrito', 'vNotas'].forEach(i => $(i).value = '');
    $('errPrecio').hidden = true; $('errVenta').hidden = true;
    $('vGuardar').disabled = false; $('vGuardar').textContent = 'Confirmar venta';
    calcular();
    dlg.showModal();
    $('vPrecio').focus(); $('vPrecio').select();
  }

  function calcular(){
    if (!vendiendo) return;
    const admin = datos.usuario.rol === 'Admin';
    const p = Number($('vPrecio').value) || 0, c = Number($('vCosto').value) || 0, g = Number($('vGastos').value) || 0;
    const partes = [];
    if (p && vendiendo.precio && p < vendiendo.precio) partes.push(`Descuento: <b>${esc(dinero(vendiendo.precio - p))}</b>`);
    if (p && admin) partes.push(`Ganancia: <b>${esc(dinero(p - c - g))}</b>`);
    $('vCalculo').innerHTML = partes.join(' · ');
  }
  ['vPrecio', 'vCosto', 'vGastos'].forEach(i => $(i).addEventListener('input', () => { $('errPrecio').hidden = true; calcular(); }));

  $('formVenta').addEventListener('submit', e => {
    e.preventDefault();
    const precio = Number($('vPrecio').value);
    if (!(precio > 0)){ $('errPrecio').hidden = false; $('vPrecio').focus(); return; }
    const admin = datos.usuario.rol === 'Admin';
    $('vGuardar').disabled = true; $('vGuardar').textContent = 'Guardando…'; $('errVenta').hidden = true;
    llamar('admin.vender', {
      id: vendiendo.id, precio,
      costo: admin ? $('vCosto').value : null,
      gastos: $('vGastos').value, comprador: $('vComprador').value.trim(),
      celular: $('vCelular').value.trim(), distrito: $('vDistrito').value.trim(), notas: $('vNotas').value.trim()
    })
      .then(() => { const nombre = vendiendo.nombre; dlg.close(); aviso(`Venta de ${nombre} registrada. Ya no aparece en la web.`, 'ok'); return cargar(); })
      .catch(err => {
        $('vGuardar').disabled = false; $('vGuardar').textContent = 'Confirmar venta';
        if (err.codigo === 'auth' || err.codigo === 'sinacceso'){ dlg.close(); return; }
        $('errVenta').textContent = err.message; $('errVenta').hidden = false;
      });
  });

  iniciar();
})();
