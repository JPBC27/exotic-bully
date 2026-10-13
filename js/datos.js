/* =========================================================
   EDITA AQUÍ — todo el contenido de la web sale de estos datos
   ========================================================= */
const CONFIG = {
  marca: 'RiverBulls',
  whatsapp: '',            // solo números con código de país, ej: '51987654321'
  instagram: '[@usuario]',
  tiktok: '[@usuario]',
  ubicacion: '[Distrito, ciudad]',

  /* Conexión con el Google Sheet: pega aquí la URL /exec del Apps Script.
     Con esto la web registra visitas (ciudad aproximada) y contactos, y lee los cachorros
     de la hoja "Cachorros". Vacío = no se registra nada y se usan los cachorros de abajo. */
  api: '',

  /* Panel de administración (admin.html): ID de cliente OAuth de Google.
     Es el mismo valor que va en CLIENT_ID dentro de apps-script/Code.gs. */
  googleClientId: '',

  /* PORTADA — usa UNA de estas dos opciones. Si las dos están vacías, se ve el perro estilizado.
     A) Modelo 3D realista (.glb) generado desde una foto del perro (Meshy, Tripo):  */
  modelo3d: '',        // ej: 'modelos/perro.glb'
  modelo3dGiro: 0,     // grados para corregir si aparece de espaldas o de lado: 90, 180 o -90
  /* B) Foto real del perro con el fondo quitado (.png con transparencia): */
  fotoPortada: ''      // ej: 'img/portada.png'
};

// RESPALDO: solo se usan si CONFIG.api está vacío o el Sheet no responde.
// Con el Sheet conectado, los cachorros se manejan en la hoja "Cachorros" (los vendidos desaparecen solos).
// fotos: lista de rutas, ej: ['img/rocky-1.jpg','img/rocky-2.jpg']. Vacío = hueco de foto.
const CACHORROS = [
  { id:'c1', nombre:'[Nombre 1]', sexo:'macho',  color:'[Color]', edad:'[Semanas]', precio:'[Precio]', estado:'disponible', fotos:[], nota:'[Detalle: carácter, estructura, lo que lo hace especial.]' },
  { id:'c2', nombre:'[Nombre 2]', sexo:'hembra', color:'[Color]', edad:'[Semanas]', precio:'[Precio]', estado:'disponible', fotos:[], nota:'[Detalle del cachorro.]' },
  { id:'c3', nombre:'[Nombre 3]', sexo:'macho',  color:'[Color]', edad:'[Semanas]', precio:'[Precio]', estado:'reservado',  fotos:[], nota:'[Detalle del cachorro.]' },
  { id:'c4', nombre:'[Nombre 4]', sexo:'hembra', color:'[Color]', edad:'[Semanas]', precio:'[Precio]', estado:'disponible', fotos:[], nota:'[Detalle del cachorro.]' }
];

const PADRES = [
  { rol:'Padre', nombre:'[Nombre]', meta:'[Color, peso, registro o pedigree si tiene]', foto:'' },
  { rol:'Madre', nombre:'[Nombre]', meta:'[Color, peso, registro o pedigree si tiene]', foto:'' }
];

// video: ruta a un .mp4 vertical, ej: 'videos/camada.mp4'. Vacío = hueco.
const VIDEOS = [
  { titulo:'Cachorros jugando', video:'' },
  { titulo:'Padres caminando', video:'' },
  { titulo:'Un cachorro de cerca', video:'' }
];
/* ========================================================= */
