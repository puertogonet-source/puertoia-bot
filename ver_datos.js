const db = require('./db');

// Ver usuarios
console.log('👥 Usuarios:');
const usuarios = db.prepare('SELECT * FROM usuarios').all();
console.table(usuarios);

// Ver especialistas
console.log('👨‍⚕️ Especialistas:');
const especialistas = db.prepare('SELECT * FROM profesionales').all();
console.table(especialistas);

// Ver conversaciones
console.log('💬 Conversaciones:');
const conversaciones = db.prepare('SELECT * FROM conversaciones ORDER BY timestamp DESC').all();
console.table(conversaciones);
