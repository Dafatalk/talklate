const { abrir } = require('./db');
const { crearApp } = require('./app');
const traductor = require('./lib/traductor');

const db = abrir();
const puerto = Number(process.env.PORT) || 3000;
crearApp(db).listen(puerto, '0.0.0.0', () => {
  console.log(`TalkLate API escuchando en http://0.0.0.0:${puerto} (motor de traduccion: ${traductor.modo()})`);
});
