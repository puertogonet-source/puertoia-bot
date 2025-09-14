const db = require('./db');

// Agrega múltiples especialistas
function agregarEspecialista(nombre, descripcion, ubicacion, whatsapp, palabras_clave) {
  const stmt = db.prepare(`
    INSERT INTO profesionales (nombre, descripcion, ubicacion, whatsapp, palabras_clave)
    VALUES (?, ?, ?, ?, ?)
  `);
  stmt.run(nombre, descripcion, ubicacion, whatsapp, palabras_clave);
}

// Lista de especialistas de prueba
const especialistas = [
  {
    nombre: 'Dra. María Ortega',
    descripcion: 'Odontóloga especialista en ortodoncia y estética dental',
    ubicacion: 'Puerto Cabello',
    whatsapp: '+584141234567',
    palabras_clave: 'odontologo,dientes,brackets,dental,caries'
  },
  {
    nombre: 'Lic. Pedro Pérez',
    descripcion: 'Abogado civil y mercantil con 10 años de experiencia',
    ubicacion: 'Valencia',
    whatsapp: '+584126789012',
    palabras_clave: 'abogado,legal,divorcio,demanda'
  },
  {
    nombre: 'Ing. Carolina Rojas',
    descripcion: 'Técnico en computación, reparación de PCs y redes',
    ubicacion: 'Morón',
    whatsapp: '+584245432198',
    palabras_clave: 'computadora,tecnico,reparacion,pc,redes'
  },
  {
    nombre: 'Prof. Luis Castillo',
    descripcion: 'Profesor de matemáticas a domicilio y online',
    ubicacion: 'Naguanagua',
    whatsapp: '+584146781234',
    palabras_clave: 'matematica,tareas,clases,numeros,algebra'
  },
  {
    nombre: 'Chef Ana Morales',
    descripcion: 'Repostera especializada en pasapalos y tortas personalizadas',
    ubicacion: 'Puerto Cabello',
    whatsapp: '+584126541897',
    palabras_clave: 'torta,pasapalos,reposteria,comida,postre'
  }
];

// Insertar todos
especialistas.forEach(e => {
  agregarEspecialista(e.nombre, e.descripcion, e.ubicacion, e.whatsapp, e.palabras_clave);
});

console.log('✅ 5 especialistas agregados con éxito');
