require('dotenv').config();
const venom = require('venom-bot');
const axios = require('axios');
const chalk = require('chalk');
const db = require('./db');
const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');

// Express config
const app = express();
app.use(cors());
app.use(bodyParser.json());

const SESSION_NAME = 'puertoia';
const OPENAI_API_KEY = process.env.OPENAI_API_KEY || 'TU_CLAVE_OPENAI_AQUI';

let globalClient = null;

// Registrar usuario
function registrarUsuario(id) {
  try {
    const stmt = db.prepare(
      'INSERT OR IGNORE INTO usuarios (id, nombre, telefono) VALUES (?, ?, ?)'
    );
    stmt.run(id, '', '');
  } catch (e) {
    console.error(chalk.red('❌ Error registrando usuario:'), e.message);
  }
}

// Guardar conversación
function logConversation(userId, role, message) {
  try {
    const stmt = db.prepare(
      'INSERT INTO conversaciones (timestamp, usuario_id, rol, mensaje) VALUES (?, ?, ?, ?)'
    );
    stmt.run(new Date().toISOString(), userId, role, message);
  } catch (e) {
    console.error(chalk.red('❌ Error guardando conversación:'), e.message);
  }
}

// Formatear fórmulas biológicas (LaTeX → texto plano)
function formatearFormulaBio(respuesta) {
  let texto = respuesta;
  texto = texto.replace(/\\\[/g, '').replace(/\\\]/g, '');
  texto = texto.replace(/\\text\{([^}]+)\}/g, '$1');
  texto = texto.replace(/\\rightarrow/g, '→');
  texto = texto.replace(/\\times/g, '×');
  const subIndices = {
    '0': '₀', '1': '₁', '2': '₂', '3': '₃',
    '4': '₄', '5': '₅', '6': '₆', '7': '₇',
    '8': '₈', '9': '₉'
  };
  texto = texto.replace(/_({)?(\d+)(})?/g, (_, __, num) =>
    [...num].map(n => subIndices[n] || n).join('')
  );
  return texto.trim();
}

function getSpecialists() {
  const stmt = db.prepare('SELECT * FROM profesionales');
  return stmt.all();
}

function findSpecialist(text) {
  const msg = text.toLowerCase();
  const specialists = getSpecialists();
  for (const s of specialists) {
    if (!s.palabras_clave) continue;
    const keywords = s.palabras_clave.split(',').map(k => k.trim().toLowerCase());
    for (const kw of keywords) {
      if (kw && msg.includes(kw)) {
        return s;
      }
    }
  }
  return null;
}

async function consultarChatGPT(prompt, userId) {
  try {
    const historial = db.prepare(
      'SELECT rol, mensaje FROM conversaciones WHERE usuario_id = ? ORDER BY timestamp DESC LIMIT 6'
    ).all(userId).reverse();

    const mensajes = [
      {
        role: 'system',
        content: `Eres *PuertoIA*, un super asistente educativo creado en Venezuela 🇻🇪...`
      },
      ...historial.map(row => ({
        role: row.rol === 'bot' ? 'assistant' : row.rol,
        content: row.mensaje
      })),
      { role: 'user', content: prompt }
    ];

    const resp = await axios.post(
      'https://api.openai.com/v1/chat/completions',
      {
        model: 'gpt-4o',
        messages: mensajes,
        temperature: 0.7
      },
      {
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${OPENAI_API_KEY}`
        }
      }
    );

    return resp.data.choices[0].message.content.trim();
  } catch (error) {
    console.error(chalk.red('❌ Error con OpenAI:'), error.response?.data || error.message);
    return '⚠️ PuertoIA no pudo responder en este momento. Intenta de nuevo más tarde.';
  }
}

// Envío de clase manual para La Salle San José
async function enviarClaseManual(client) {
  const numero = '56984848044@c.us';
  const nivel = '2do grado';
  const materia = 'Ciencias Sociales';
  const titulo = 'Valores lasallistas y la historia de nuestra escuela';
  const prompt = `Explica de forma clara, corta y con ejemplo el tema '${titulo}' para un niño de ${nivel}. Que también lo entienda su papá.`;

  const explicacion = await consultarChatGPT(prompt, numero);

  const mensaje = `📚 *¡Nueva clase disponible en PuertoIA para La Salle San José!*\n
🏫 *Institución:* Colegio La Salle San José  
👨‍🏫 *Director:* Prof. Leonardo López  
🔗 *www.delasalle.org.ve/ls-sj/*\n
📜 *Breve historia:* Fundado el 22 de mayo de 1932 y mixto desde 1969, La Salle San José es un referente educativo con décadas de legado.\n
👶 *Nivel:* ${nivel}  
📘 *Materia:* ${materia}  
📝 *Tema:* ${titulo}\n
🧠 *Explicación rápida:*\n${explicacion}\n
🚀 *PuertoIA: la primera plataforma 24/7 de clases personalizadas en Venezuela.*  
🌐 *Visítanos:* www.puertoia.com`;

  try {
    await client.sendText(numero, mensaje);
    logConversation(numero, 'bot', mensaje);
    console.log(chalk.green(`✅ Clase enviada con éxito al director de La Salle San José (${numero})`));
  } catch (err) {
    console.error(chalk.red('❌ Error al enviar clase:'), err);
  }
}

// Endpoint Flask
app.post('/notificar-clase', async (req, res) => {
  const { anio, materia, titulo, profesor, institucion, fecha, enlace } = req.body;
  const numerosPrueba = [
    '56984848044@c.us',
    '584141480492@c.us',
    '584124138910@c.us',
    '584124134010@c.us'
  ];
  const mensaje = `🎓 *¡Nueva clase disponible en PuertoIA!*  

📌 *Institución:* ${institucion}  
👨‍🏫 *Profesor:* ${profesor}  
📚 *Asignatura:* ${materia}  
🎯 *Grado/Año:* ${anio}  
📅 *Fecha:* ${fecha}  

📝 *Clase:* ${titulo}  

📲 *Accede ahora mismo:*  
${enlace}  

✨ PuertoIA transforma la educación con tecnología inteligente.  
Gracias por ser parte del futuro educativo de tu hijo. 🙌`;

  let enviados = 0;
  for (const numero of numerosPrueba) {
    try {
      await globalClient.sendText(numero, mensaje);
      enviados++;
    } catch (err) {
      console.error(chalk.red(`❌ No se pudo enviar a ${numero}:`), err.message);
    }
  }
  enviados > 0
    ? res.send(`✅ Clase enviada a ${enviados} de ${numerosPrueba.length} contactos`)
    : res.status(500).send('❌ No se pudo enviar la clase a ningún número');
});

// Iniciar Venom bot
venom
  .create({
    session: SESSION_NAME,
    headless: true,
    browserArgs: ['--no-sandbox', '--disable-setuid-sandbox']
  })
  .then(client => start(client))
  .catch(err => console.error(chalk.red('❌ Error al iniciar Venom:'), err));

// Lógica principal del bot
async function start(client) {
  console.log(chalk.green('🤖 PuertoIA bot activo con SQLite y ayuda educativa personalizada'));
  globalClient = client;

  // 📤 Enviar clase demo automáticamente al iniciar
  await enviarClaseManual(client);

  client.onMessage(async message => {
    try {
      const from = message.from;
      const texto = (message.body || '').trim();
      if (!texto) return;

      registrarUsuario(from);
      logConversation(from, 'user', texto);

      const textoLower = texto.toLowerCase();

      if (
        textoLower.includes('puertoia') ||
        textoLower.includes('explícame') ||
        textoLower.includes('ayúdame') ||
        textoLower.includes('no entendí')
      ) {
        if (from.endsWith('@c.us')) await client.startTyping(from);
        const prompt = `Una persona necesita ayuda con una clase. Dice: "${texto}".`;
        let respuesta = await consultarChatGPT(prompt, from);
        if (respuesta.includes('\\[') || respuesta.includes('_') || respuesta.includes('\\text')) {
          respuesta = formatearFormulaBio(respuesta);
        }
        logConversation(from, 'bot', respuesta);
        return client.sendText(from, respuesta);
      }

      if (from.endsWith('@c.us')) await client.startTyping(from);
      let respuesta = await consultarChatGPT(texto, from);

      const especialista = findSpecialist(texto);
      if (especialista) {
        respuesta += `\n\n🔎 *Especialista recomendado:*  
👤 ${especialista.nombre}  
📍 ${especialista.ubicacion}  
💼 ${especialista.descripcion}  
📱 ${especialista.whatsapp}`;
      }
      if (respuesta.includes('\\[') || respuesta.includes('_') || respuesta.includes('\\text')) {
        respuesta = formatearFormulaBio(respuesta);
      }
      logConversation(from, 'bot', respuesta);
      await client.sendText(from, respuesta);
    } catch (err) {
      console.error(chalk.red('❌ Error procesando mensaje:'), err);
      await client.sendText(message.from, '❌ Ocurrió un error interno. Inténtalo de nuevo.');
    }
  });
}

// PuertoIA escucha aquí
const PORT = 5005;
app.listen(PORT, () =>
  console.log(chalk.cyan(`🌐 Bot escuchando en http://localhost:${PORT}/notificar-clase`))
);
