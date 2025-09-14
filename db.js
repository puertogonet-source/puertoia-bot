const Database = require('better-sqlite3');
const path = require('path');

const db = new Database(path.join(__dirname, 'data/puertoia.db'));

db.exec(`
  CREATE TABLE IF NOT EXISTS usuarios (
    id TEXT PRIMARY KEY,
    nombre TEXT,
    telefono TEXT,
    creado_en TEXT DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS profesionales (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    nombre TEXT,
    categoria TEXT,
    descripcion TEXT,
    ubicacion TEXT,
    whatsapp TEXT,
    palabras_clave TEXT
  );

  CREATE TABLE IF NOT EXISTS conversaciones (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    timestamp TEXT,
    usuario_id TEXT,
    rol TEXT,
    mensaje TEXT,
    FOREIGN KEY (usuario_id) REFERENCES usuarios(id)
  );
`);

module.exports = db;
