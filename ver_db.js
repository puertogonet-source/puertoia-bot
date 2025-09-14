const sqlite3 = require('sqlite3').verbose();

// Conexión a la base de datos
const db = new sqlite3.Database('simon.db');

// Mostrar usuarios registrados
console.log('\n🧑‍💻 Usuarios registrados:');
db.all('SELECT id, nombre, email FROM usuarios', [], (err, rows) => {
  if (err) {
    console.error('❌ Error al leer usuarios:', err.message);
    return;
  }
  rows.forEach(row => {
    console.log(`- ID: ${row.id} | Nombre: ${row.nombre} | Email: ${row.email}`);
  });

  // Mostrar mensajes guardados
  console.log('\n💬 Historial de mensajes:');
  db.all('SELECT id, usuario_id, mensaje, respuesta FROM mensajes', [], (err, mensajes) => {
    if (err) {
      console.error('❌ Error al leer mensajes:', err.message);
      return;
    }
    mensajes.forEach(m => {
      console.log(`- Usuario ${m.usuario_id} dijo: "${m.mensaje}" → Respuesta: "${m.respuesta}"`);
    });

    db.close();
  });
});
