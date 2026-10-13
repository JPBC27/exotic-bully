const ICONO_FOTO = '<svg width="34" height="34" viewBox="0 0 24 24" fill="none" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M4 8h3l2-3h6l2 3h3v11H4z"/><circle cx="12" cy="13" r="3.5"/></svg>';
const ICONO_PLAY = '<svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="12" cy="12" r="10"/><path d="M10 8l6 4-6 4z"/></svg>';
const esc = s => String(s).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const hueco = (txt, icono = ICONO_FOTO) => `<div class="hueco">${icono}<span>${esc(txt)}</span></div>`;
const media = (src, alt, txt) => src ? `<img class="foto" src="${esc(src)}" alt="${esc(alt)}" loading="lazy">` : hueco(txt);
const sexoTxt = s => s === 'macho' ? 'Macho' : 'Hembra';

function linkWA(msg){
  if (!CONFIG.whatsapp) return '#contacto';
  return `https://wa.me/${CONFIG.whatsapp}?text=${encodeURIComponent(msg)}`;
}
function prepararWA(scope = document){
  scope.querySelectorAll('[data-wa]').forEach(a => {
    a.href = linkWA(a.dataset.wa);
    if (CONFIG.whatsapp){ a.target = '_blank'; a.rel = 'noopener'; }
  });
}

/* textos de configuración */
document.querySelectorAll('[data-marca]').forEach(el => el.textContent = CONFIG.marca);
document.querySelectorAll('[data-cfg]').forEach(el => el.textContent = CONFIG[el.dataset.cfg]);
document.getElementById('anio').textContent = new Date().getFullYear();
document.querySelectorAll('[data-hueco]').forEach(el => el.innerHTML = `${ICONO_FOTO}<span>${esc(el.dataset.hueco)}</span>`);

/* menú móvil */
const menuBtn = document.getElementById('menuBtn'), nav = document.getElementById('nav');
menuBtn.addEventListener('click', () => {
  const abierto = nav.classList.toggle('abierto');
  menuBtn.setAttribute('aria-expanded', abierto);
  menuBtn.setAttribute('aria-label', abierto ? 'Cerrar menú' : 'Abrir menú');
});
nav.addEventListener('click', e => { if (e.target.closest('a')){ nav.classList.remove('abierto'); menuBtn.setAttribute('aria-expanded', false); } });

/* cachorros */
let filtro = 'todos';
const grilla = document.getElementById('grilla');
function pintarCachorros(){
  const lista = CACHORROS.filter(c =>
    filtro === 'todos' ? true : filtro === 'disponible' ? c.estado === 'disponible' : c.sexo === filtro);
  if (!lista.length){ grilla.innerHTML = '<p class="vacio">No hay cachorros con ese filtro por ahora. Escríbenos y te avisamos de la próxima camada.</p>'; return; }
  grilla.innerHTML = lista.map(c => `
    <article class="card">
      <button class="card-foto" data-abrir="${c.id}" aria-label="Ver ficha de ${esc(c.nombre)}">
        ${media(c.fotos[0], c.nombre, 'Foto del cachorro')}
        <span class="estado ${c.estado}">${c.estado === 'disponible' ? 'Disponible' : 'Reservado'}</span>
      </button>
      <div class="card-cuerpo">
        <h3>${esc(c.nombre)}</h3>
        <dl class="datos">
          <dt>Sexo</dt><dd>${sexoTxt(c.sexo)}</dd>
          <dt>Color</dt><dd>${esc(c.color)}</dd>
          <dt>Edad</dt><dd>${esc(c.edad)}</dd>
          <dt>Precio</dt><dd class="precio">${esc(c.precio)}</dd>
        </dl>
        <div class="acciones">
          <button class="btn btn-linea" data-abrir="${c.id}">Ver ficha</button>
          <a class="btn btn-borde-oro" data-wa="Hola, me interesa ${esc(c.nombre)} (${sexoTxt(c.sexo).toLowerCase()}, ${esc(c.color)}). ¿Sigue disponible?" href="#">WhatsApp</a>
        </div>
      </div>
    </article>`).join('');
  prepararWA(grilla);
}
document.querySelectorAll('[data-filtro]').forEach(b => b.addEventListener('click', () => {
  filtro = b.dataset.filtro;
  document.querySelectorAll('[data-filtro]').forEach(x => x.setAttribute('aria-pressed', x === b));
  pintarCachorros();
}));

/* ficha del cachorro */
const dlg = document.getElementById('dlgCachorro');
function abrirFicha(id){
  const c = CACHORROS.find(x => x.id === id); if (!c) return;
  const fotos = c.fotos.length ? c.fotos : ['', '', '', ''];
  dlg.innerHTML = `
    <div class="modal">
      <div class="galeria">
        <div class="principal" id="fotoPrincipal">${media(fotos[0], c.nombre, 'Foto 1 del cachorro')}</div>
        <div class="miniaturas">
          ${fotos.slice(0,4).map((f,i) => `<button class="mini" data-i="${i}" aria-label="Ver foto ${i+1}" aria-current="${i===0}">${f ? `<img class="foto" src="${esc(f)}" alt="">` : 'Foto ' + (i+1)}</button>`).join('')}
        </div>
      </div>
      <div class="modal-info">
        <button class="cerrar" aria-label="Cerrar ficha"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true"><path d="M6 6l12 12M18 6L6 18"/></svg></button>
        <span class="estado ${c.estado}" style="position:static; align-self:flex-start">${c.estado === 'disponible' ? 'Disponible' : 'Reservado'}</span>
        <h3 id="dlgTitulo">${esc(c.nombre)}</h3>
        <dl class="datos">
          <dt>Sexo</dt><dd>${sexoTxt(c.sexo)}</dd>
          <dt>Color</dt><dd>${esc(c.color)}</dd>
          <dt>Edad</dt><dd>${esc(c.edad)}</dd>
          <dt>Precio</dt><dd class="precio">${esc(c.precio)}</dd>
        </dl>
        <p class="nota">${esc(c.nota)}</p>
        <a class="btn btn-oro" style="margin-top:auto" data-wa="Hola, me interesa ${esc(c.nombre)} (${sexoTxt(c.sexo).toLowerCase()}, ${esc(c.color)}). ¿Sigue disponible?" href="#">
          ${c.estado === 'disponible' ? 'Consultar por WhatsApp' : 'Avisarme si se libera'}
        </a>
      </div>
    </div>`;
  prepararWA(dlg);
  dlg.querySelector('.cerrar').addEventListener('click', () => dlg.close());
  dlg.querySelectorAll('.mini').forEach(m => m.addEventListener('click', () => {
    const i = +m.dataset.i;
    document.getElementById('fotoPrincipal').innerHTML = media(fotos[i], c.nombre, 'Foto ' + (i+1) + ' del cachorro');
    dlg.querySelectorAll('.mini').forEach(x => x.setAttribute('aria-current', x === m));
  }));
  dlg.showModal();
}
grilla.addEventListener('click', e => { const b = e.target.closest('[data-abrir]'); if (b) abrirFicha(b.dataset.abrir); });
[dlg, document.getElementById('dlgVideo')].forEach(d => d.addEventListener('click', e => { if (e.target === d) d.close(); }));

/* padres */
document.getElementById('padres-lista').innerHTML = PADRES.map(p => `
  <article class="padre">
    ${p.foto ? `<div style="aspect-ratio:4/3"><img class="foto" src="${esc(p.foto)}" alt="${esc(p.rol)}: ${esc(p.nombre)}" loading="lazy"></div>` : `<div class="hueco">${ICONO_FOTO}<span>Foto ${p.rol === 'Padre' ? 'del padre' : 'de la madre'}, de perfil</span></div>`}
    <div class="info"><p class="rol">${esc(p.rol)}</p><h3>${esc(p.nombre)}</h3><p class="meta">${esc(p.meta)}</p></div>
  </article>`).join('');

/* videos */
const dlgV = document.getElementById('dlgVideo');
document.getElementById('videos-lista').innerHTML = VIDEOS.map((v,i) => `
  <button class="video" data-v="${i}" aria-label="Ver video: ${esc(v.titulo)}">${hueco('Video vertical: ' + v.titulo, ICONO_PLAY)}</button>`).join('');
document.getElementById('videos-lista').addEventListener('click', e => {
  const b = e.target.closest('[data-v]'); if (!b) return;
  const v = VIDEOS[+b.dataset.v];
  dlgV.innerHTML = `<div class="modal-video">
      <button class="cerrar" aria-label="Cerrar video"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true"><path d="M6 6l12 12M18 6L6 18"/></svg></button>
      ${v.video ? `<video src="${esc(v.video)}" controls autoplay playsinline style="width:100%; max-height:75vh; border-radius:8px"></video>` : hueco('Aquí se reproducirá: ' + v.titulo, ICONO_PLAY)}
    </div>`;
  dlgV.querySelector('.cerrar').addEventListener('click', () => dlgV.close());
  dlgV.showModal();
});
dlgV.addEventListener('close', () => { const vid = dlgV.querySelector('video'); if (vid) vid.pause(); });

pintarCachorros();
prepararWA();
