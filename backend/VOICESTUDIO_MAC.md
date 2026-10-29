# Montar y probar la voz con emocion en la Mac (VoiceStudio + TalkLate)

Guia para el agente (o la persona) que prepara la demo en la **Mac M5 con 32 GB**. Al final se debe
poder hablarle a la burbuja en Expo Go y escuchar la traduccion con emocion (enojo, alegria, preocupacion)
generada **localmente** por VoiceStudio. Decision de arquitectura: ADR-016 en `arquitectura/decisiones.md`.

> Reglas del proyecto: textos y commits en espanol **sin tildes**. Trabajar en una rama
> `feature/...` y abrir PR a `develop` (ver `convenciones/git-versionamiento.md`).

## Como encaja

```
App (Expo Go) --audio--> backend :3000 --Whisper :9000--> texto --Qwen (Ollama :11434)--> traduccion + tono
                                    \--POST /api/v1/voz--> VoiceStudio :3900 (IndexTTS 2, vector de emocion) --> wav --> App
```

- Adaptador: `backend/src/adaptadores/sintesis/voicestudio.js`.
  - Con `VOICESTUDIO_MOTOR=indextts2` usa `POST /generate` (multipart) con `emo_vector` (8 pesos: alegre,
    enojado, triste, miedo, asco, melancolia, sorpresa, calma). Los vectores por tono estan en
    `backend/src/dominio/voz.js`.
  - Con otro motor (`cosyvoice`, `omnivoice`, `mlx-audio`...) usa `POST /v1/audio/speech` (compatible con
    OpenAI) y la emocion va como texto en `instruct`.
- Si VoiceStudio falla o tarda mas de `VOICESTUDIO_TIMEOUT_MS`, el backend prueba Azure/OpenAI (si hay
  claves) y si no, la app usa la voz del celular. La demo nunca se queda muda.

## 1. Requisitos

- macOS en Apple Silicon (M5), 32 GB de RAM, ~25 GB libres en disco (modelos).
- Homebrew, Node 22 (`brew install node@22`), Git, Python 3.11+.
- Celular con **Expo Go** en la misma red Wi-Fi que la Mac.

## 2. VoiceStudio (instalacion nativa, NO Docker)

En Mac se instala nativo: Docker en macOS **no** puede usar la GPU de Apple (Metal/MLX) y seria muy lento.

```bash
curl -fsSL https://voicestudio.sh/install | sh
```

1. Abrir VoiceStudio. La interfaz web queda en http://localhost:3900.
2. En el **Model Manager**, descargar **IndexTTS 2** (emocion graduada, habla espanol e ingles). Opcional:
   **CosyVoice 3** y **MLX-Audio (Kokoro)** como alternativas rapidas.
3. Confirmar los ids reales de los motores (la documentacion no es 100 % clara):

   ```bash
   curl -s http://127.0.0.1:3900/engines/tts | python3 -m json.tool
   ```

   Anotar el id exacto de IndexTTS (se espera `indextts2`; si sale otro, usarlo en `VOICESTUDIO_MOTOR`).
4. **Crear un perfil de voz** (IndexTTS clona voces y probablemente necesita una voz de referencia):
   - En la interfaz: Voices / Profiles -> nuevo perfil -> subir 10 a 20 s de audio limpio de una persona
     hablando en tono neutro (puede ser la voz de un integrante del equipo, con su permiso).
   - Copiar el **id** del perfil para `VOICESTUDIO_PERFIL`.
   - Si no se crea perfil, probar primero sin el; si `/generate` responde error pidiendo referencia, crearlo.
5. Prueba directa (debe generar `prueba.wav` con voz enojada):

   ```bash
   curl -s -X POST http://127.0.0.1:3900/generate \
     -F text="Te dije mil veces que no tocaras mis cosas" -F engine=indextts2 -F language=es \
     -F emo_vector='[0,0.85,0,0,0.1,0,0,0]' -F effect_preset=raw \
     -F profile_id=ID_DEL_PERFIL --output prueba.wav && afplay prueba.wav
   ```

   Si la respuesta no es audio, abrir `prueba.wav` como texto para ver el error y ajustar los nombres de
   campos en `voicestudio.js` (ver "Puntos a verificar").

Desde la misma Mac (127.0.0.1) VoiceStudio no pide clave. Si el backend corre en otra maquina, definir
`OMNIVOICE_API_KEY` en VoiceStudio y la misma clave en `VOICESTUDIO_API_KEY`.

## 3. Transcripcion (Whisper) y traduccion (Qwen)

```bash
# Whisper con aceleracion Metal, expuesto como API compatible con OpenAI en :9000
brew install whisper-cpp
mkdir -p ~/modelos && curl -L -o ~/modelos/ggml-small.bin \
  https://huggingface.co/ggerganov/whisper.cpp/resolve/main/ggml-small.bin
whisper-server -m ~/modelos/ggml-small.bin --host 127.0.0.1 --port 9000 \
  --inference-path /v1/audio/transcriptions --convert

# Qwen local para traducir
brew install ollama && ollama serve &
ollama pull qwen2.5:7b
```

Se usa el modelo `small` de Whisper: el `tiny` confunde jerga (oyo "parece" en vez de "parce").
Si `whisper-server` no acepta `--convert`, instalar `ffmpeg` (`brew install ffmpeg`) y volver a intentar.

## 4. Backend

```bash
cd backend
npm install
cp .env.example .env
```

Valores minimos en `backend/.env` para la demo local:

```
DB_DRIVER=sqlite
JWT_SECRET=pon-un-secreto-largo
TRADUCTOR=auto
OLLAMA_URL=http://127.0.0.1:11434
QWEN_MODEL=qwen2.5:7b
TRANSCRIPCION_URL=http://127.0.0.1:9000/v1/audio/transcriptions
TRANSCRIPCION_MODELO=small
VOZ_MOTOR=voicestudio
VOICESTUDIO_URL=http://127.0.0.1:3900
VOICESTUDIO_MOTOR=indextts2
VOICESTUDIO_PERFIL=ID_DEL_PERFIL
VOICESTUDIO_TIMEOUT_MS=60000
CORS_ORIGENES=*
```

(Para usar SurrealDB en vez de SQLite seguir `backend/README.md`; para la prueba de voz no hace falta.)

### Medir antes de la demo

```bash
npm run medir:voz
```

Manda 10 frases (5 en espanol, 5 en ingles, con enojo, alegria, preocupacion, amabilidad, formal/neutral),
muestra cuanto tardo cada una y guarda los audios en `backend/medicion-voz/` (no se suben a git).

- **Meta:** mediana de 5 s o menos por frase y que la emocion se note al escuchar.
- Si tarda mucho: probar `VOICESTUDIO_MOTOR=cosyvoice` o `mlx-audio` (mas rapidos, emocion por texto) y
  volver a medir.
- Si la emocion no se nota: subir los pesos en `EXPRESION[...].vector` de `src/dominio/voz.js` (maximo 1).

Luego levantar el API:

```bash
npm start
curl -s http://127.0.0.1:3000/health   # debe decir "voz_natural": ["voicestudio"] y "transcripcion_voz": true
```

## 5. App en el celular

```bash
cd frontend
npm install
EXPO_PUBLIC_API_URL=http://IP_DE_LA_MAC:3000/api/v1 npx expo start
```

(La IP se ve con `ipconfig getifaddr en0`.) Escanear el QR con Expo Go.

## 6. Prueba de punta a punta (checklist)

1. Iniciar sesion y crear una conversacion nueva (ej. traducir a Ingles, Miami). Debe abrir **en la burbuja**.
2. Tocar la burbuja: salen ondas (escuchando).
3. Decir con rabia: "Estoy harto de que siempre llegues tarde". Callarse 1.5 s.
4. La burbuja **gira** (traduciendo).
5. Suena la traduccion en ingles **con voz enojada** de VoiceStudio. La burbuja vuelve a quedar lista.
6. Repetir con alegria ("Que bien, nos ganamos la beca") y preocupacion ("No se donde deje el pasaporte").
7. Cambiar al chat con el icono de arriba: deben verse los mensajes con su tono.
8. Apagar VoiceStudio y repetir: la traduccion debe sonar con la voz del celular (respaldo), sin errores.

## 7. Puntos a verificar (la documentacion de VoiceStudio no los confirma)

| Punto | Que hacer si falla |
| --- | --- |
| Id del motor IndexTTS (`indextts2`) | Usar el id que muestre `GET /engines/tts` en `VOICESTUDIO_MOTOR`. |
| Nombres de campos de `POST /generate` (`text`, `engine`, `language`, `emo_vector`, `profile_id`, `speed`, `effect_preset`) | Revisar `backend/api/routers/generation.py` del repo de VoiceStudio y ajustar `porGenerate` en `voicestudio.js`. |
| IndexTTS necesita voz de referencia | Crear el perfil (paso 2.4) y ponerlo en `VOICESTUDIO_PERFIL`. |
| `/generate` devuelve `audio/wav` | Si devuelve otro formato, ajustar `tipo` en `porGenerate`. |
| CosyVoice 3 habla espanol | Si no, dejar IndexTTS para espanol. |

Cada ajuste debe pasar `npm test` (hay una prueba del adaptador en `test/motores.test.js`).

## 8. Al terminar

Registrar en `seguimiento/bitacora.md`:

- motor e id usados;
- mediana y p95 de `npm run medir:voz`;
- si la emocion se noto en espanol y en ingles;
- cualquier ajuste hecho al adaptador.

Subir en una rama `feature/...` con PR a `develop`.
