// Motor de traduccion local (espanol <-> ingles) para demostracion y uso sin internet.
// Traduce modismos y frases hechas por su equivalente cultural (con variantes por pais destino)
// y el resto palabra por palabra. Si quedan palabras sin traducir, marca la traduccion como aproximada.
// Para calidad real se usa motorClaude.js (ver traductor.js).
const { normalizar } = require('../../dominio/analisis');
const { restaurarAcentos } = require('./acentos');

// [original, traduccion o {default, CO, MX, ES, AR, US, GB}, nota cultural opcional]
const FRASES_ES_EN = [
  ['ponerse las pilas con', 'get cracking on', 'Expresion latinoamericana: "ponerse las pilas" es darse prisa o esforzarse; no se traduce literal (pilas = batteries).'],
  ['ponerse las pilas', 'get cracking', 'Expresion latinoamericana: "ponerse las pilas" es darse prisa o esforzarse; no se traduce literal.'],
  ['ponte las pilas', 'get a move on', 'Expresion latinoamericana: "ponte las pilas" es darse prisa o esforzarse.'],
  ['que chimba', "that's awesome", '"Chimba" es jerga colombiana para algo excelente.'],
  ['una chimba', 'awesome', '"Chimba" es jerga colombiana para algo excelente.'],
  ['que bacano', "that's cool", '"Bacano" es jerga colombiana para algo genial.'],
  ['que nota', "that's cool", '"Que nota" es una expresion colombiana de aprobacion.'],
  ['que padre', "that's cool", '"Que padre" es mexicano para algo genial.'],
  ['que chido', "that's cool", '"Chido" es jerga mexicana para algo genial.'],
  ['no manches', 'no way', '"No manches" es una exclamacion mexicana de sorpresa.'],
  ['que onda', "what's up", '"Que onda" es un saludo informal mexicano y argentino.'],
  ['que mas', "what's up", '"Que mas" es un saludo informal colombiano, no una pregunta literal.'],
  ['que hubo', "what's up", '"Que hubo" es un saludo informal colombiano.'],
  ['dar papaya', 'make yourself an easy target', '"Dar papaya" es colombiano: descuidarse y quedar expuesto a un abuso o robo.'],
  ['estar mamado', 'be fed up', '"Estar mamado" es colombiano: estar harto o cansado.'],
  ['estoy mamado', "i'm fed up", '"Estar mamado" es colombiano: estar harto o cansado.'],
  ['estoy mamada', "i'm fed up", '"Estar mamada" es colombiano: estar harta o cansada.'],
  ['a la orden', 'at your service', '"A la orden" es una cortesia colombiana al atender a alguien.'],
  ['que pena', 'sorry about that', '"Que pena" en Colombia es una disculpa o una forma cortes de pedir algo, no tristeza.'],
  ['echar los perros', 'hit on someone', '"Echar los perros" es coquetear.'],
  ['meter la pata', 'put your foot in it', 'Equivalente cultural de "meter la pata" (cometer un error).'],
  ['estar en las nubes', 'have your head in the clouds', null],
  ['costar un ojo de la cara', 'cost an arm and a leg', 'Equivalente cultural: en ingles se dice "un brazo y una pierna".'],
  ['cuesta un ojo de la cara', 'costs an arm and a leg', 'Equivalente cultural: en ingles se dice "un brazo y una pierna".'],
  ['es pan comido', "it's a piece of cake", 'Equivalente cultural: "pan comido" = "pedazo de pastel".'],
  ['pan comido', 'a piece of cake', 'Equivalente cultural: "pan comido" = "pedazo de pastel".'],
  ['llover a cantaros', 'rain cats and dogs', 'Equivalente cultural de lluvia fuerte.'],
  ['esta lloviendo a cantaros', "it's raining cats and dogs", 'Equivalente cultural de lluvia fuerte.'],
  ['tomar el pelo', "pull someone's leg", 'Equivalente cultural: bromear a alguien.'],
  ['me estas tomando el pelo', "you're pulling my leg", 'Equivalente cultural: bromear a alguien.'],
  ['al pie de la letra', 'word for word', null],
  ['no hay problema', 'no problem', null],
  ['no pasa nada', 'no worries', null],
  ['de una', 'right away', '"De una" es colombiano: de inmediato, sin pensarlo.'],
  ['hay que', 'we need to', null],
  ['vamos a', "let's", null],
  ['hagamos', "let's do", null],
  ['empecemos de una vez', "let's start right now", null],
  ['buenos dias', 'good morning', null],
  ['buenas tardes', 'good afternoon', null],
  ['buenas noches', 'good evening', null],
  ['hasta luego', 'see you later', null],
  ['hasta manana', 'see you tomorrow', null],
  ['como estas', 'how are you', null],
  ['como esta usted', 'how are you', null],
  ['como te va', "how's it going", null],
  ['mucho gusto', 'nice to meet you', null],
  ['muchas gracias', 'thank you very much', null],
  ['de nada', "you're welcome", null],
  ['con gusto', 'with pleasure', null],
  ['por favor', 'please', null],
  ['te quiero', 'i love you', null],
  ['te extrano', 'i miss you', null],
  ['cuanto cuesta', 'how much does it cost', null],
  ['donde esta el bano', 'where is the bathroom', null],
  ['no entiendo', "i don't understand", null],
  ['habla mas despacio', 'speak more slowly', null],
  ['necesito ayuda', 'i need help', null],
  ['tengo hambre', "i'm hungry", null],
  ['tengo sed', "i'm thirsty", null],
  ['tengo frio', "i'm cold", null],
  ['tengo calor', "i'm hot", null],
  ['tengo que', 'i have to', null],
  ['estoy de acuerdo', 'i agree', null],
  ['estoy cansado', "i'm tired", null],
  ['estoy cansada', "i'm tired", null],
  ['me da pena', "i'm embarrassed", '"Me da pena" en Latinoamerica es verguenza.'],
  ['ya casi', 'almost there', null],
  ['lo antes posible', 'as soon as possible', null],
  ['de todas formas', 'anyway', null],
  ['a lo mejor', 'maybe', null],
  ['en seguida', 'right away', null],
  ['por supuesto', 'of course', null],
  ['claro que si', 'of course', null],
  ['ahora mismo', 'right now', null],
  ['hoy en dia', 'nowadays', null],
  ['a veces', 'sometimes', null],
  ['de vez en cuando', 'once in a while', null],
  ['en realidad', 'actually', null],
  ['sin embargo', 'however', null],
  ['por eso', 'that is why', null],
  ['cada uno', 'each one', null],
];

const FRASES_EN_ES = [
  ['get cracking on', { default: 'ponerse manos a la obra con', CO: 'ponerse las pilas con' }, 'Modismo ingles: "get cracking" es empezar a trabajar con energia.'],
  ['get cracking', { default: 'manos a la obra', CO: 'ponerse las pilas' }, 'Modismo ingles: "get cracking" es empezar a trabajar con energia.'],
  ["let's get cracking", { default: 'manos a la obra', CO: 'pongamonos las pilas' }, 'Modismo ingles: empezar a trabajar con energia.'],
  ['piece of cake', 'pan comido', 'Equivalente cultural: "pedazo de pastel" = "pan comido".'],
  ["it's a piece of cake", 'es pan comido', 'Equivalente cultural: "pedazo de pastel" = "pan comido".'],
  ['break a leg', 'mucha suerte', 'En ingles se desea suerte a un artista diciendo "rompe una pierna"; no es literal.'],
  ['cost an arm and a leg', 'costar un ojo de la cara', 'Equivalente cultural: "un brazo y una pierna" = "un ojo de la cara".'],
  ['costs an arm and a leg', 'cuesta un ojo de la cara', 'Equivalente cultural: "un brazo y una pierna" = "un ojo de la cara".'],
  ["it's raining cats and dogs", 'esta lloviendo a cantaros', 'Equivalente cultural de lluvia fuerte.'],
  ['raining cats and dogs', 'lloviendo a cantaros', 'Equivalente cultural de lluvia fuerte.'],
  ['hit the sack', 'irse a dormir', 'Modismo: "hit the sack" es irse a la cama.'],
  ['spill the beans', 'soltar la sopa', 'Modismo: revelar un secreto.'],
  ['under the weather', 'maluco', 'Modismo: sentirse un poco enfermo.'],
  ['once in a blue moon', 'cada muerte de obispo', 'Equivalente cultural de "muy rara vez".'],
  ['the ball is in your court', 'te toca a ti', 'Modismo: ahora te toca decidir o actuar.'],
  ['bite the bullet', 'hacer de tripas corazon', 'Equivalente cultural: aguantar algo dificil.'],
  ['call it a day', 'dejarlo por hoy', 'Modismo: terminar el trabajo del dia.'],
  ['my bad', 'mi culpa', null],
  ["i'm down", 'me apunto', 'Modismo informal: estar de acuerdo con un plan.'],
  ['no worries', { default: 'no te preocupes', CO: 'todo bien', MX: 'no hay problema' }, null],
  ['you bet', 'claro que si', null],
  ["what's up", { default: 'que tal', CO: 'que mas', MX: 'que onda', AR: 'que onda', ES: 'que tal' }, '"What\'s up" es un saludo informal, no una pregunta literal.'],
  ['how are you', 'como estas', null],
  ["how's it going", 'como te va', null],
  ['nice to meet you', 'mucho gusto', null],
  ['thank you very much', 'muchas gracias', null],
  ['thank you', 'gracias', null],
  ["you're welcome", 'de nada', null],
  ['good morning', 'buenos dias', null],
  ['good afternoon', 'buenas tardes', null],
  ['good evening', 'buenas noches', null],
  ['good night', 'buenas noches', null],
  ['see you later', 'hasta luego', null],
  ['see you tomorrow', 'hasta manana', null],
  ['i love you', 'te quiero', null],
  ['i miss you', 'te extrano', null],
  ['how much does it cost', 'cuanto cuesta', null],
  ['where is the bathroom', 'donde esta el bano', null],
  ["i don't understand", 'no entiendo', null],
  ['i need help', 'necesito ayuda', null],
  ["i'm hungry", 'tengo hambre', null],
  ["i'm thirsty", 'tengo sed', null],
  ["i'm tired", 'estoy cansado', null],
  ["i'm fed up", { default: 'estoy harto', CO: 'estoy mamado' }, null],
  ['fed up', { default: 'harto', CO: 'mamado' }, null],
  ['i agree', 'estoy de acuerdo', null],
  ["let's start now", { default: 'empecemos de una vez', CO: 'empecemos de una' }, null],
  ["let's start", 'empecemos', null],
  ["let's go", { default: 'vamos', CO: 'vamonos' }, null],
  ["let's", 'vamos a', null],
  ['we need to', 'hay que', null],
  ['i have to', 'tengo que', null],
  ['as soon as possible', 'lo antes posible', null],
  ['right now', 'ahora mismo', null],
  ['of course', 'por supuesto', null],
  ['however', 'sin embargo', null],
  ['by the way', 'por cierto', null],
  ['for sure', { default: 'seguro', CO: 'de una' }, null],
  ['once in a while', 'de vez en cuando', null],
  ['at the moment', 'en este momento', null],
  ['a lot of', 'mucho', null],
  ['a little', 'un poco', null],
  ['no problem', 'no hay problema', null],
  ['please', 'por favor', null],
  ['awesome', { default: 'genial', CO: 'bacano', MX: 'padrisimo', ES: 'estupendo', AR: 'buenisimo' }, null],
  ['cool', { default: 'genial', CO: 'chevere', MX: 'padre', ES: 'guay', AR: 'copado' }, '"Cool" se adapta al regionalismo de la region destino.'],
  ['dude', { default: 'amigo', CO: 'parce', MX: 'wey', ES: 'tio', AR: 'che' }, '"Dude" se adapta al regionalismo de la region destino.'],
  ['buddy', { default: 'amigo', CO: 'parce', MX: 'cuate', ES: 'colega', AR: 'che' }, '"Buddy" se adapta al regionalismo de la region destino.'],
  ['hello', 'hola', null],
  ['hi', 'hola', null],
  ['hey', 'oye', null],
  ['bye', 'chao', null],
  ['goodbye', 'adios', null],
];

// Palabras sueltas (sin tildes en la clave). Cuando el destino es espanol se usan formas con acento donde corresponde.
const PALABRAS_ES_EN = Object.fromEntries(`
yo=i;tu=you;usted=you;el=the;ella=she;nosotros=we;ellos=they;ellas=they;mi=my;mis=my;su=your;sus=your;nuestro=our;nuestra=our;
el=the;la=the;los=the;las=the;un=a;una=a;unos=some;unas=some;y=and;o=or;pero=but;que=that;de=of;del=of the;al=to the;en=in;con=with;sin=without;
para=for;por=for;a=to;hacia=toward;desde=from;hasta=until;entre=between;sobre=about;como=like;cuando=when;donde=where;porque=because;si=if;no=not;
hola=hello;gracias=thanks;adios=goodbye;chao=bye;bien=well;mal=bad;muy=very;mas=more;menos=less;tambien=also;ya=already;aun=still;siempre=always;nunca=never;
hoy=today;manana=tomorrow;ayer=yesterday;ahora=now;despues=later;antes=before;luego=then;pronto=soon;tarde=late;temprano=early;
si=yes;claro=sure;listo=ready;vale=okay;ok=okay;bueno=good;buena=good;malo=bad;grande=big;pequeno=small;nuevo=new;viejo=old;rapido=fast;lento=slow;
casa=house;trabajo=work;dinero=money;tiempo=time;dia=day;noche=night;semana=week;mes=month;ano=year;hora=hour;minuto=minute;
amigo=friend;amiga=friend;familia=family;madre=mother;padre=father;hermano=brother;hermana=sister;hijo=son;hija=daughter;persona=person;gente=people;
comida=food;agua=water;cafe=coffee;cerveza=beer;pan=bread;carne=meat;fruta=fruit;desayuno=breakfast;almuerzo=lunch;cena=dinner;
ciudad=city;calle=street;pais=country;mundo=world;carro=car;bus=bus;avion=plane;tren=train;aeropuerto=airport;hotel=hotel;restaurante=restaurant;tienda=store;
telefono=phone;celular=phone;computador=computer;mensaje=message;correo=email;palabra=word;idioma=language;conversacion=conversation;reunion=meeting;proyecto=project;
problema=problem;ayuda=help;pregunta=question;respuesta=answer;idea=idea;cosa=thing;cosas=things;lugar=place;vez=time;
quiero=want;necesito=need;tengo=have;tiene=has;hay=there is;es=is;son=are;soy=am;eres=are;estoy=am;esta=is;estan=are;estamos=are;
voy=go;vas=go;va=goes;vamos=go;ir=go;venir=come;vengo=come;ver=see;veo=see;hacer=do;hago=do;hace=does;decir=say;digo=say;dice=says;
puedo=can;puede=can;podemos=can;saber=know;se=know;sabes=know;conozco=know;entiendo=understand;hablo=speak;hablar=speak;habla=speaks;
comer=eat;como=eat;beber=drink;dormir=sleep;trabajar=work;estudiar=study;leer=read;escribir=write;escuchar=listen;mirar=look;
comprar=buy;vender=sell;pagar=pay;llamar=call;llamo=call;esperar=wait;espero=wait;buscar=look for;encontrar=find;empezar=start;empiezo=start;terminar=finish;
traducir=translate;traduccion=translation;aprender=learn;ensenar=teach;entender=understand;necesitamos=need;queremos=want;
uno=one;dos=two;tres=three;cuatro=four;cinco=five;seis=six;siete=seven;ocho=eight;nueve=nine;diez=ten;cien=hundred;mil=thousand;
rojo=red;azul=blue;verde=green;amarillo=yellow;negro=black;blanco=white;
feliz=happy;triste=sad;cansado=tired;enojado=angry;contento=glad;
mucho=a lot;poco=a little;todo=everything;todos=everyone;nada=nothing;algo=something;alguien=someone;nadie=nobody;
este=this;esto=this;eso=that;ese=that;aqui=here;alli=there;ahi=there;
que=what;quien=who;cual=which;cuanto=how much;cuando=when;
nombre=name;llamas=are called;
`.trim().split(';').map((p) => p.trim()).filter(Boolean).map((p) => p.split('=')));

const PALABRAS_EN_ES = Object.fromEntries(`
i=yo;you=tu;he=el;she=ella;we=nosotros;they=ellos;my=mi;your=tu;his=su;her=su;our=nuestro;their=su;me=me;
the=el;a=un;an=un;some=algunos;and=y;or=o;but=pero;that=que;of=de;in=en;on=en;at=en;with=con;without=sin;for=para;to=a;from=desde;until=hasta;between=entre;about=sobre;
like=como;when=cuando;where=donde;because=porque;if=si;not=no;also=tambien;already=ya;still=aun;always=siempre;never=nunca;
today=hoy;tomorrow=manana;yesterday=ayer;now=ahora;later=despues;before=antes;then=luego;soon=pronto;late=tarde;early=temprano;
yes=si;no=no;sure=claro;ready=listo;okay=vale;good=bueno;bad=malo;big=grande;small=pequeno;new=nuevo;old=viejo;fast=rapido;slow=lento;
house=casa;home=casa;work=trabajo;money=dinero;time=tiempo;day=dia;night=noche;week=semana;month=mes;year=ano;hour=hora;minute=minuto;
friend=amigo;family=familia;mother=madre;father=padre;brother=hermano;sister=hermana;son=hijo;daughter=hija;person=persona;people=gente;
food=comida;water=agua;coffee=cafe;beer=cerveza;bread=pan;meat=carne;fruit=fruta;breakfast=desayuno;lunch=almuerzo;dinner=cena;
city=ciudad;street=calle;country=pais;world=mundo;car=carro;bus=bus;plane=avion;train=tren;airport=aeropuerto;hotel=hotel;restaurant=restaurante;store=tienda;
phone=telefono;computer=computador;message=mensaje;email=correo;word=palabra;language=idioma;conversation=conversacion;meeting=reunion;project=proyecto;
problem=problema;help=ayuda;question=pregunta;answer=respuesta;idea=idea;thing=cosa;things=cosas;place=lugar;
want=quiero;need=necesito;have=tengo;has=tiene;is=es;are=son;am=soy;was=era;were=eran;be=ser;
go=ir;goes=va;come=venir;see=ver;do=hacer;does=hace;say=decir;says=dice;can=puedo;know=saber;understand=entender;speak=hablar;
eat=comer;drink=beber;sleep=dormir;study=estudiar;read=leer;write=escribir;listen=escuchar;look=mirar;
buy=comprar;sell=vender;pay=pagar;call=llamar;wait=esperar;find=encontrar;start=empezar;finish=terminar;translate=traducir;translation=traduccion;learn=aprender;teach=ensenar;
one=uno;two=dos;three=tres;four=cuatro;five=cinco;six=seis;seven=siete;eight=ocho;nine=nueve;ten=diez;hundred=cien;thousand=mil;
red=rojo;blue=azul;green=verde;yellow=amarillo;black=negro;white=blanco;
happy=feliz;sad=triste;tired=cansado;angry=enojado;glad=contento;
much=mucho;many=muchos;little=poco;everything=todo;everyone=todos;nothing=nada;something=algo;someone=alguien;nobody=nadie;
this=esto;these=estos;those=esos;here=aqui;there=alli;
what=que;who=quien;which=cual;how=como;why=por que;
name=nombre;thanks=gracias;sorry=perdon;excuse=disculpa;
it=eso;its=su;
we're=estamos;you're=estas;they're=estan;don't=no;doesn't=no;can't=no puedo;won't=no voy a;
`.trim().split(';').map((p) => p.trim()).filter(Boolean).map((p) => p.split('=')));

// Palabras con acento al escribir en espanol destino (la clave es la forma sin acento)
const ACENTOS = { 'tu': 'tu', 'que': 'que' };

const MAX_FRASE = 7;

function indexar(frases) {
  const m = new Map();
  for (const [src, dest, nota] of frases) m.set(normalizar(src).replace(/'/g, "'"), { dest, nota: nota || null });
  return m;
}
const INDICE = { 'es>en': indexar(FRASES_ES_EN), 'en>es': indexar(FRASES_EN_ES) };
const PALABRAS = { 'es>en': new Map(Object.entries(PALABRAS_ES_EN)), 'en>es': new Map(Object.entries(PALABRAS_EN_ES)) };

const CODIGOS_PAIS = new Set(['CO', 'MX', 'ES', 'AR', 'US', 'GB']);

function elegirVariante(dest, paisCodigo) {
  if (typeof dest === 'string') return dest;
  return (paisCodigo && dest[paisCodigo]) || dest.default;
}

function separar(texto) {
  // Devuelve [{ palabra, norm, despues }] y el texto previo a la primera palabra
  const re = /[\p{L}\p{N}']+/gu;
  const tokens = [];
  let m, ultimo = 0, previo = '';
  while ((m = re.exec(texto)) !== null) {
    if (tokens.length === 0) previo = texto.slice(0, m.index);
    else tokens[tokens.length - 1].despues = texto.slice(ultimo, m.index);
    tokens.push({ palabra: m[0], norm: normalizar(m[0]).replace(/’/g, "'"), despues: '' });
    ultimo = m.index + m[0].length;
  }
  if (tokens.length) tokens[tokens.length - 1].despues = texto.slice(ultimo);
  return { previo, tokens };
}

// origen/destino: 'es' o 'en'. paisDestino: codigo ISO del pais de la region destino (ej. 'CO').
function traducirLocal(texto, origen, destino, paisDestino) {
  const par = `${origen}>${destino}`;
  const frases = INDICE[par];
  const palabras = PALABRAS[par];
  if (!frases) throw new Error(`El motor local no soporta el par ${par}`);
  const { previo, tokens } = separar(texto);
  const notas = [];
  const pais = CODIGOS_PAIS.has(paisDestino) ? paisDestino : null;
  let salida = previo;
  let sinTraducir = 0;
  let i = 0;
  while (i < tokens.length) {
    let usado = false;
    for (let n = Math.min(MAX_FRASE, tokens.length - i); n >= 1 && !usado; n -= 1) {
      const clave = tokens.slice(i, i + n).map((t) => t.norm).join(' ');
      const hallada = frases.get(clave);
      if (hallada) {
        salida += elegirVariante(hallada.dest, pais) + tokens[i + n - 1].despues;
        if (hallada.nota && !notas.includes(hallada.nota)) notas.push(hallada.nota);
        i += n;
        usado = true;
      }
    }
    if (usado) continue;
    const t = tokens[i];
    const w = palabras.get(t.norm);
    if (w) {
      salida += w + t.despues;
    }
    else if (/^\d+$/.test(t.norm)) salida += t.palabra + t.despues;
    else {
      sinTraducir += 1;
      salida += t.palabra + t.despues;
    }
    i += 1;
  }
  salida = salida.replace(/\s+([,.;:!?])/g, '$1').replace(/([.!?]\s+)(\p{Ll})/gu, (_, p, l) => p + l.toUpperCase());
  if (destino === 'en') salida = salida.replace(/\bi(?=\b|')/g, 'I');
  if (/^\p{Lu}/u.test(texto.trim())) salida = salida.replace(/^(\P{L}*)(\p{L})/u, (_, p, l) => p + l.toUpperCase());
  if (destino === 'es') {
    if (/\?\s*$/.test(salida) && !salida.includes('¿')) salida = '¿' + salida;
    if (/!\s*$/.test(salida) && !salida.includes('¡')) salida = '¡' + salida;
  }
  if (destino === 'es') salida = restaurarAcentos(salida);
  const nota = notas.join(' ') || null;
  return { traduccion: salida, nota: nota && restaurarAcentos(nota), aproximada: sinTraducir > 0 };
}

const PARES_LOCALES = ['es>en', 'en>es'];

// Adaptador del puerto MotorTraduccion (ver puertos/index.js): motor de reglas sin red, ultimo de la cadena.
function crearMotorReglas() {
  return {
    nombre: 'local',
    etiqueta: () => 'local',
    disponible: () => true,
    soportaPar: (origen, destino) => PARES_LOCALES.includes(`${origen}>${destino}`),
    async traducir(entrada) {
      const pais = entrada.regionDestino && entrada.regionDestino.paisCodigo;
      return traducirLocal(entrada.texto, entrada.origen.codigo, entrada.destino.codigo, pais);
    },
  };
}

module.exports = { traducirLocal, PARES_LOCALES, crearMotorReglas };
