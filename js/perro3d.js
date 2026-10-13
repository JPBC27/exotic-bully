/* Portada interactiva: sigue el cursor (o el dedo en celular).
   Elige el modo según CONFIG en datos.js:
   1) fotoPortada -> foto real sin fondo con efecto 3D
   2) modelo3d    -> modelo .glb realista
   3) ninguno     -> perro estilizado hecho con formas */
(function(){
  const cont = document.getElementById('escena');
  const canvas = document.getElementById('canvas3d');
  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
  const reducido = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ---- seguimiento del cursor (compartido por los tres modos) ---- */
  let tx = 0, ty = 0, ultimo = 0, cx = 0, cy = 0;
  window.addEventListener('pointermove', e => {
    const r = cont.getBoundingClientRect();
    tx = clamp((e.clientX - (r.left + r.width / 2)) / (window.innerWidth / 2), -1, 1);
    ty = clamp((e.clientY - (r.top + r.height * 0.35)) / (window.innerHeight / 2), -1, 1);
    ultimo = performance.now();
    cont.style.setProperty('--mx', clamp((e.clientX - r.left) / r.width * 100, 0, 100) + '%');
    cont.style.setProperty('--my', clamp((e.clientY - r.top) / r.height * 100, 0, 100) + '%');
  }, { passive:true });
  function suavizar(t){
    let ox = tx, oy = ty;
    if (!reducido && performance.now() - ultimo > 3500){ ox = Math.sin(t * 0.5) * 0.45; oy = Math.sin(t * 0.8) * 0.12; }
    cx += (ox - cx) * 0.08; cy += (oy - cy) * 0.08;
  }
  let visible = true;
  new IntersectionObserver(([en]) => { visible = en.isIntersecting; }).observe(cont);

  /* ================= MODO 1: foto real sin fondo ================= */
  if (CONFIG.fotoPortada){
    cont.classList.add('con-foto');
    const sombra = document.createElement('div'); sombra.className = 'sombra-piso';
    const img = document.createElement('img');
    img.className = 'foto-3d'; img.src = CONFIG.fotoPortada; img.alt = '';
    img.onerror = () => { cont.classList.remove('con-foto'); img.remove(); sombra.remove(); iniciar3D(); };
    cont.append(sombra, img);
    const t0 = performance.now();
    (function animar(){
      requestAnimationFrame(animar);
      if (!visible) return;
      const t = (performance.now() - t0) / 1000;
      suavizar(t);
      const resp = reducido ? 0 : Math.sin(t * 2.2) * 0.006;
      img.style.transform = `perspective(1100px) rotateY(${(cx * 14).toFixed(2)}deg) rotateX(${(-cy * 7).toFixed(2)}deg) translateX(${(cx * 10).toFixed(1)}px) scale(${(1 + resp).toFixed(4)})`;
      sombra.style.transform = `translateX(${(cx * 22).toFixed(1)}px) scaleX(${(1 - Math.abs(cx) * 0.12).toFixed(3)})`;
    })();
    return;
  }

  iniciar3D();

  function iniciar3D(){
    if (!window.THREE){ cont.classList.add('sin3d'); return; }
    let renderer;
    try { renderer = new THREE.WebGLRenderer({ canvas, antialias:true, alpha:true }); }
    catch(e){ cont.classList.add('sin3d'); return; }
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    renderer.outputEncoding = THREE.sRGBEncoding;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.05;

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(30, 1, 0.1, 100);
    camera.position.set(0, 2.3, 9.4);
    camera.lookAt(0, 1.45, 0);

    scene.add(new THREE.HemisphereLight(0xfff2d6, 0x2a1d14, 0.85));
    const key = new THREE.DirectionalLight(0xffffff, 1.25); key.position.set(3, 5, 6); scene.add(key);
    const rim = new THREE.DirectionalLight(0xE3C04A, 1.1); rim.position.set(-4, 3, -5); scene.add(rim);
    const fill = new THREE.PointLight(0xC9A227, 0.6, 20); fill.position.set(-3, 1, 4); scene.add(fill);

    function ajustar(){
      const w = cont.clientWidth, h = cont.clientHeight; if (!w || !h) return;
      renderer.setSize(w, h, false); camera.aspect = w / h;
      camera.fov = w / h < 0.9 ? 36 : 30; camera.updateProjectionMatrix();
    }
    new ResizeObserver(ajustar).observe(cont); ajustar();

    const BASE = -0.38;
    let actualizar = () => {};

    function sombraPiso(ancho, largo){
      const sc = document.createElement('canvas'); sc.width = sc.height = 128;
      const g = sc.getContext('2d'); const grad = g.createRadialGradient(64, 64, 4, 64, 64, 64);
      grad.addColorStop(0, 'rgba(0,0,0,.55)'); grad.addColorStop(1, 'rgba(0,0,0,0)');
      g.fillStyle = grad; g.fillRect(0, 0, 128, 128);
      const m = new THREE.Mesh(new THREE.PlaneGeometry(ancho, largo), new THREE.MeshBasicMaterial({ map:new THREE.CanvasTexture(sc), transparent:true, depthWrite:false }));
      m.rotation.x = -Math.PI / 2; m.position.y = 0.01; return m;
    }

    /* ================= MODO 2: modelo .glb realista ================= */
    function cargarModelo(){
      const aviso = document.createElement('div'); aviso.className = 'cargando'; aviso.textContent = 'Cargando…';
      cont.appendChild(aviso);
      const listo = window.THREE.GLTFLoader ? Promise.resolve() : new Promise((ok, mal) => {
        const s = document.createElement('script');
        s.src = 'https://cdn.jsdelivr.net/npm/three@0.128.0/examples/js/loaders/GLTFLoader.js';
        s.onload = ok; s.onerror = mal; document.head.appendChild(s);
      });
      listo.then(() => new Promise((ok, mal) => new THREE.GLTFLoader().load(CONFIG.modelo3d, ok, undefined, mal)))
        .then(gltf => {
          aviso.remove();
          const interior = new THREE.Group();
          interior.add(gltf.scene);
          interior.rotation.y = (CONFIG.modelo3dGiro || 0) * Math.PI / 180;
          interior.updateMatrixWorld(true);
          const caja = new THREE.Box3().setFromObject(interior);
          const tam = caja.getSize(new THREE.Vector3());
          const escala = 2.7 / Math.max(tam.y, tam.x * 0.75, 0.0001);
          interior.scale.setScalar(escala);
          interior.updateMatrixWorld(true);
          caja.setFromObject(interior);
          const centro = caja.getCenter(new THREE.Vector3());
          interior.position.set(-centro.x, -caja.min.y, -centro.z);
          const pivote = new THREE.Group();
          pivote.add(interior);
          pivote.add(sombraPiso(tam.x * escala * 1.3 + 1, tam.z * escala * 1.3 + 1));
          scene.add(pivote);
          gltf.scene.traverse(o => { if (o.isMesh && o.material && o.material.map) o.material.map.anisotropy = 4; });
          actualizar = (t) => {
            pivote.rotation.y = BASE * 0.5 + cx * 0.6;
            pivote.rotation.x = clamp(cy * 0.08, -0.06, 0.08);
            if (!reducido) pivote.position.y = Math.sin(t * 2.2) * 0.008;
          };
        })
        .catch(() => { aviso.remove(); perroEstilizado(); });
    }

    /* ================= MODO 3: perro estilizado ================= */
    function perroEstilizado(){
      /* colores del perro: cambia estos hex para otro color de pelaje */
      const PELAJE = new THREE.MeshStandardMaterial({ color:0xC8874A, metalness:0, roughness:0.7 });
      const BLANCO = new THREE.MeshStandardMaterial({ color:0xF1E6D8, metalness:0, roughness:0.75 });
      const LENGUA = new THREE.MeshStandardMaterial({ color:0xE07583, metalness:0, roughness:0.45 });
      const NARIZ = new THREE.MeshStandardMaterial({ color:0x4A302A, metalness:0.1, roughness:0.35 });
      const OSCURO = new THREE.MeshStandardMaterial({ color:0x1a1210, metalness:0.2, roughness:0.2 });
      const esfera = (sx, sy, sz, mat) => { const m = new THREE.Mesh(new THREE.SphereGeometry(1, 40, 28), mat || PELAJE); m.scale.set(sx, sy, sz); return m; };
      const cil = (rt, rb, h) => new THREE.Mesh(new THREE.CylinderGeometry(rt, rb, h, 28), PELAJE);
      const at = (m, x, y, z, parent) => { m.position.set(x, y, z); parent.add(m); return m; };

      const perro = new THREE.Group(); scene.add(perro);
      const pecho = at(esfera(1.22, 1.0, 1.0), 0, 1.3, 0.45, perro);
      at(esfera(0.78, 0.72, 0.42, BLANCO), 0, 1.12, 1.08, perro);
      at(esfera(0.95, 0.82, 1.05), 0, 1.25, -0.55, perro);
      [-1, 1].forEach(s => {
        at(esfera(0.52, 0.62, 0.52), 0.72 * s, 1.35, 0.55, perro);
        at(esfera(0.46, 0.58, 0.55), 0.6 * s, 1.05, -0.9, perro);
        const pata = at(cil(0.25, 0.2, 0.95), 0.78 * s, 0.55, 0.62, perro); pata.rotation.z = s * 0.1;
        at(cil(0.21, 0.18, 0.75), 0.64 * s, 0.42, -1.05, perro);
        at(esfera(0.27, 0.15, 0.34), 0.84 * s, 0.1, 0.72, perro);
        at(esfera(0.23, 0.14, 0.3), 0.66 * s, 0.09, -0.98, perro);
      });
      const cuello = at(cil(0.62, 0.8, 0.8), 0, 1.98, 0.78, perro); cuello.rotation.x = 0.45;
      const colaPivote = at(new THREE.Group(), 0, 1.5, -1.5, perro);
      const cola = at(new THREE.Mesh(new THREE.ConeGeometry(0.12, 0.55, 16), PELAJE), 0, 0.2, -0.12, colaPivote); cola.rotation.x = -0.9;
      const cabeza = at(new THREE.Group(), 0, 2.32, 1.02, perro);
      at(esfera(0.84, 0.72, 0.76), 0, 0.2, 0.12, cabeza);
      [-1, 1].forEach(s => {
        at(esfera(0.44, 0.4, 0.4), 0.44 * s, -0.04, 0.38, cabeza);
        at(esfera(0.09, 0.09, 0.055, OSCURO), 0.3 * s, 0.3, 0.8, cabeza);
        const oreja = at(esfera(0.24, 0.07, 0.19), 0.62 * s, 0.6, 0.02, cabeza); oreja.rotation.z = s * 0.65; oreja.rotation.x = 0.25;
      });
      at(esfera(0.5, 0.31, 0.38, BLANCO), 0, -0.12, 0.74, cabeza);
      at(esfera(0.34, 0.15, 0.25, BLANCO), 0, -0.42, 0.62, cabeza);
      const raya = at(esfera(0.1, 0.36, 0.08, BLANCO), 0, 0.42, 0.82, cabeza); raya.rotation.x = -0.35;
      const lengua = at(esfera(0.17, 0.05, 0.22, LENGUA), 0, -0.36, 0.92, cabeza); lengua.rotation.x = 0.55;
      at(esfera(0.17, 0.11, 0.1, NARIZ), 0, 0.03, 1.09, cabeza);
      perro.add(sombraPiso(4.2, 3.4));

      actualizar = (t) => {
        const yaw = BASE + cx * 0.22;
        perro.rotation.y = yaw;
        cabeza.rotation.y = clamp(cx * 0.85 - yaw, -1.0, 1.0);
        cabeza.rotation.x = clamp(cy * 0.45, -0.3, 0.4);
        if (!reducido){ pecho.scale.y = 1.0 + Math.sin(t * 2.2) * 0.018; colaPivote.rotation.y = Math.sin(t * 9) * 0.45; }
      };
    }

    if (CONFIG.modelo3d) cargarModelo(); else perroEstilizado();

    const reloj = new THREE.Clock();
    (function animar(){
      requestAnimationFrame(animar);
      if (!visible) return;
      const t = reloj.getElapsedTime();
      suavizar(t);
      actualizar(t);
      renderer.render(scene, camera);
    })();
  }
})();
