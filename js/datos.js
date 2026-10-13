/* =========================================================
   EDITA AQUÍ — todo el contenido de la web sale de estos datos
   ========================================================= */
const CONFIG = {
  marca: '[Nombre del criadero]',
  whatsapp: '',            // solo números con código de país, ej: '51987654321'
  instagram: '[@usuario]',
  tiktok: '[@usuario]',
  ubicacion: '[Distrito, ciudad]'
};

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
