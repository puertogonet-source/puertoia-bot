const express = require('express');
const cors = require('cors');
const sqlite3 = require('sqlite3').verbose();
const bcrypt = require('bcrypt');
const { OpenAI } = require('openai');
require('dotenv').config();

const app = express();
app.use(cors());
app.use(express.json());

// ------------------ DB SETUP ------------------
const db = new sqlite3.Database('simon.db');

// Crear tabla de usuarios si no existe
db.run(`
  CREATE TABLE IF NOT EXISTS usuarios (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    nombre TEXT,
    email TEXT UNIQUE,
    password TEXT,
    whatsapp TEXT
)`);

// Crear tabla de mensajes si no existe
db.run(`
  CREATE TABLE IF NOT EXISTS mensajes (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    usuario_id INTEGER,
    mensaje TEXT,
    respuesta TEXT,
    fecha TIMESTAMP DEFAULT CURRENT_TIMESTAMP
)`);

// Asegurar que la columna whatsapp exista (por si viene de base anterior)
db.run(`ALTER TABLE usuarios ADD COLUMN whatsapp TEXT`, (err) => {
  if (err && !err.message.includes('duplicate column')) {
    console.error('❌ Error al agregar columna whatsapp:', err.message);
  } else {
    console.log('✅ Columna whatsapp lista');
  }
});

// ------------------ OpenAI ------------------
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

// ------------------ REGISTRO ------------------
app.post('/register', async (req, res) => {
  const { email, password, nombre, whatsapp } = req.body;
  if (!email || !password || !nombre || !whatsapp) {
    return res.status(400).json({ error: 'Faltan datos para el registro' });
  }

  const hash = await bcrypt.hash(password, 10);

  db.run(
    `INSERT INTO usuarios (nombre, email, password, whatsapp) VALUES (?, ?, ?, ?)`,
    [nombre, email, hash, whatsapp],
    function (err) {
      if (err) return res.status(400).json({ error: 'Correo ya registrado' });
      res.json({ message: '✅ Registro exitoso', userId: this.lastID });
    }
  );
});

// ------------------ LOGIN ------------------
app.post('/login', (req, res) => {
  const { email, password } = req.body;
  db.get(`SELECT * FROM usuarios WHERE email = ?`, [email], async (err, row) => {
    if (!row) return res.status(400).json({ error: 'Usuario no encontrado' });

    const match = await bcrypt.compare(password, row.password);
    if (!match) return res.status(401).json({ error: 'Contraseña incorrecta' });

    res.json({ message: '✅ Login exitoso', userId: row.id });
  });
});

// ------------------ CHAT IA ------------------
app.post('/chat', async (req, res) => {
  const { prompt, userId } = req.body;

  if (!prompt || !userId) {
    return res.status(400).json({ error: 'Faltan datos' });
  }

  try {
    const completion = await openai.chat.completions.create({
      model: 'gpt-3.5-turbo',
      messages: [{ role: 'user', content: prompt }],
    });

    const reply = completion.choices[0].message.content.trim();

    // Guardar en historial
    db.run(
      `INSERT INTO mensajes (usuario_id, mensaje, respuesta) VALUES (?, ?, ?)`,
      [userId, prompt, reply]
    );

    res.json({ reply });
  } catch (err) {
    console.error('❌ Error OpenAI:', err.message);
    res.status(500).json({ error: 'Fallo al generar respuesta' });
  }
});

// ------------------ INICIAR SERVIDOR ------------------
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`✅ Servidor corriendo en http://localhost:${PORT}`);
});
