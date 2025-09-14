// bot.js
require('dotenv').config();
const venom = require('venom-bot');
const axios = require('axios');
const chalk = require('chalk');

const FLASK_BASE = process.env.FLASK_BASE || 'http://localhost:5001';
const SESSION_NAME = 'puertoia';

venom
  .create({
    session: SESSION_NAME,
    headless: true,
    browserArgs: ['--no-sandbox', '--disable-setuid-sandbox'],
  })
  .then(client => start(client))
  .catch(err => console.error(chalk.red('❌ Error al iniciar Venom:'), err));

async function start(client) {
  console.log(chalk.green('🤖 PuertoIA bot activo y listo!'));

  client.onMessage(async message => {
    try {
      const from = message.from;
      const textRaw = message.body || '';
      const text = textRaw.toLowerCase().trim();

      // Comando: ayuda
      if (/^help$|^ayuda$|^clase$/.test(text)) {
        return client.sendText(
          from,
          `📚 *PuertoIA Bot* 📚

*Comandos disponibles*:
• *help* / *ayuda* ➔ Mostrar este menú  
• *clases nuevas* ➔ Listar clases marcadas como nuevas  
• *clase de [asignatura], [grado], profesor [nombre]* ➔ Buscar una clase específica  
\n_Ejemplo:_ clase de matemática, 4to año, profesor José Saez`
        );
      }

      // Comando: clases nuevas
      if (text === 'clases nuevas') {
        await client.sendText(from, '⏳ Buscando clases nuevas...');
        const resp = await axios.get(`${FLASK_BASE}/api/clases`);
        const clases = resp.data.clases || [];
        const nuevas = clases.filter(c => (c.tipo_actividad || '').trim() === '✅');
        if (nuevas.length === 0) {
          return client.sendText(from, 'ℹ️ No hay clases nuevas marcadas con ✅.');
        }
        // Enviar cada nueva
        for (const c of nuevas) {
          const msg =
            `📚 *Nueva Clase* 📚\n` +
            `🏫 ${c['Institución'] || c.institucion}\n` +
            `📅 ${c['Fecha de la clase'] || c.fecha_clase}\n` +
            `📖 ${c['Asignatura'] || c.asignatura}\n` +
            `👨‍🏫 ${c['Docente'] || c.docente || c.nombre_profesor}\n` +
            `🎓 ${c['Grado/Año'] || c.grado}\n` +
            `📝 ${c['Titulo de la clase'] || c.titulo_clase || c.titulo}\n` +
            `🔗 ${c['Enlace de la Clase'] || c.enlace_clase || c.enlace || '—'}\n` +
            `📎 ${c['Material de apoyo de la clase'] || c.material_apoyo || c.materialApoyo || 'Sin material'}`;
          await client.sendText(from, msg);
        }
        return;
      }

      // Comando: búsqueda libre que contenga 'clase'
      if (text.includes('clase de ') || text.startsWith('buscar clase')) {
        // Extraer query tras la palabra clave
        // Ejemplo: "clase de matematica, 4to, profesor saez"
        const query = textRaw.replace(/^(clase de|buscar clase)/i, '').trim();
        if (!query) {
          return client.sendText(from, '❓ Por favor indica la descripción. Ejemplo: clase de matemática, 4to año, profesor Pérez');
        }

        await client.sendText(from, '🔎 Buscando tu clase...');
        const resp = await axios.get(`${FLASK_BASE}/api/clases`, {
          params: { q: query }
        });
        const clases = resp.data.clases || [];
        if (clases.length === 0) {
          return client.sendText(from, '📭 No se encontraron clases con esa descripción.');
        }

        // Enviar top 1
        const c = clases[0];
        const msg =
          `📘 *Clase encontrada* 📘\n` +
          `🏫 ${c['Institución'] || c.institucion}\n` +
          `📖 ${c['Asignatura'] || c.asignatura}\n` +
          `👨‍🏫 ${c['Docente'] || c.docente || c.nombre_profesor}\n` +
          `🎓 ${c['Grado/Año'] || c.grado}\n` +
          `📝 ${c['Titulo de la clase'] || c.titulo_clase || c.titulo}\n` +
          `📅 ${c['Fecha de la clase'] || c.fecha_clase}\n` +
          `🔗 ${c['Enlace de la Clase'] || c.enlace_clase || c.enlace || '—'}\n` +
          `📎 ${c['Material de apoyo de la clase'] || c.material_apoyo || c.materialApoyo || 'Sin material'}`;
        return client.sendText(from, msg);
      }

      // Respuesta motivacional por defecto
      const frases = [
        "🚀 Sigue aprendiendo: cada día es una nueva oportunidad.",
        "¿Quieres ver clases nuevas? Escribe *clases nuevas*.",
        "Para buscar una clase: `clase de [asignatura], [grado], profesor [nombre]`",
        "📚 La educación es el arma más poderosa para cambiar el mundo.",
        "Estoy aquí para ayudarte. Pregunta por cualquier clase cuando quieras. 😉"
      ];
      const aleatoria = frases[Math.floor(Math.random() * frases.length)];
      return client.sendText(from, aleatoria);

    } catch (err) {
      console.error(chalk.red('❌ Error procesando mensaje:'), err);
      return client.sendText(message.from, '❌ Ocurrió un error interno. Inténtalo de nuevo.');
    }
  });
}
