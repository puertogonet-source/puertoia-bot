// setup_db.js
const sqlite3 = require('sqlite3').verbose();
const db = new sqlite3.Database('simon.db');

db.serialize(() => {
  console.log('🧱 Iniciando creación de la base de datos...');

  // Tabla de usuarios
  db.run(`CREATE TABLE IF NOT EXISTS usuarios (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    nombre TEXT,
    email TEXT UNIQUE,
    password TEXT,
    rol TEXT DEFAULT 'usuario',
    creado_en TIMESTAMP DEFAULT CURRENT_TIMESTAMP
  )`);

  // Tabla de mensajes IA
  db.run(`CREATE TABLE IF NOT EXISTS mensajes (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    usuario_id INTEGER,
    mensaje TEXT,
    respuesta TEXT,
    modelo TEXT DEFAULT 'gpt-3.5-turbo',
    timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (usuario_id) REFERENCES usuarios(id)
  )`);

  // Sesiones activas
  db.run(`CREATE TABLE IF NOT EXISTS sesiones (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    usuario_id INTEGER,
    token TEXT,
    creado_en TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (usuario_id) REFERENCES usuarios(id)
  )`);

  // Logs de actividad
  db.run(`CREATE TABLE IF NOT EXISTS logs (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    usuario_id INTEGER,
    accion TEXT,
    detalle TEXT,
    fecha TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (usuario_id) REFERENCES usuarios(id)
  )`);

  // Planes de suscripción (para monetizar)
  db.run(`CREATE TABLE IF NOT EXISTS planes (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    nombre TEXT,
    descripcion TEXT,
    precio REAL,
    limite_mensual INTEGER,
    creado_en TIMESTAMP DEFAULT CURRENT_TIMESTAMP
  )`);

  // Suscripciones activas
  db.run(`CREATE TABLE IF NOT EXISTS suscripciones (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    usuario_id INTEGER,
    plan_id INTEGER,
    activo BOOLEAN DEFAULT 1,
    inicio DATE,
    fin DATE,
    FOREIGN KEY (usuario_id) REFERENCES usuarios(id),
    FOREIGN KEY (plan_id) REFERENCES planes(id)
  )`);

  console.log('✅ Base de datos creada correctamente como simon.db');
});

db.close();
