# 9. Diagramas C4 - TalkLate

**Fase 3 - Arquitectura**

**Version:** 1.0 (29/10/2026)

La arquitectura de TalkLate en notacion C4:

- **Nivel 1 - Contexto:** quien usa TalkLate y con que sistemas externos habla.
- **Nivel 2 - Contenedores:** las piezas que forman TalkLate y como se comunican.
- **Nivel 3 - Componentes:** el interior de la API TalkLate, en `10_componentes.md`.

Fuentes editables en `diagramas/` (`c4_contexto.drawio`, `c4_contenedores.drawio`). Vista general interactiva con el flujo de voz: `diagramas/arquitectura_talklate.html`. La justificacion de cada vista esta en `07_arquitectura.md`.

---

## Nivel 1 - Contexto del sistema

```mermaid
flowchart LR
    cliente["<b>Cliente Traductor</b><br/>[Persona]<br/>Dueno del celular. Usa la app."]
    interlocutor["<b>Interlocutor</b><br/>[Persona]<br/>No instala la app. Responde con el celular del Cliente Traductor."]
    admin["<b>Administrador</b><br/>[Persona]<br/>Catalogo de idiomas y reportes."]

    talklate["<b>TalkLate</b><br/>[Sistema]<br/>Traduccion en tiempo real con matices culturales y emocion."]

    ollama["<b>Ollama + modelo Qwen</b><br/>[Sistema externo]<br/>En el servidor de TalkLate. Motor de traduccion principal."]
    claude["<b>API de Anthropic - Claude Sonnet</b><br/>[Sistema externo]<br/>Respaldo de traduccion, solo si hay clave."]
    whisper["<b>Whisper</b><br/>[Sistema externo]<br/>En el servidor de TalkLate. Voz a texto."]
    vstudio["<b>VoiceStudio</b><br/>[Sistema externo]<br/>En el servidor de TalkLate. Voz con emocion (IndexTTS 2)."]
    nube["<b>Azure Speech / OpenAI</b><br/>[Sistema externo]<br/>Voz con emocion de respaldo, solo si hay clave."]
    correo["<b>Servicio de correo</b><br/>[Sistema externo]<br/>Codigo de recuperacion."]
    voz["<b>Microfono y voz del dispositivo</b><br/>[Sistema externo - en el cliente]<br/>Grabacion (expo-audio) y voz de respaldo (expo-speech)."]

    cliente -->|Habla o escribe y escucha traducciones| talklate
    interlocutor -->|Responde con el celular del Cliente Traductor| talklate
    admin -->|Gestiona idiomas y consulta reportes| talklate
    talklate -->|Traduce - HTTP local| ollama
    talklate -->|Traduce de respaldo - HTTPS, solo el texto| claude
    talklate -->|Transcribe el audio - HTTP local| whisper
    talklate -->|Sintetiza la voz con emocion - HTTP local| vstudio
    talklate -.->|Voz de respaldo - HTTPS| nube
    talklate -->|Envia codigo de recuperacion| correo
    talklate -->|Graba y reproduce| voz

    classDef persona fill:#08427B,stroke:#073B6F,color:#FFFFFF
    classDef sistema fill:#1168BD,stroke:#0B4884,color:#FFFFFF
    classDef externo fill:#999999,stroke:#6B6B6B,color:#FFFFFF
    class cliente,interlocutor,admin persona
    class talklate sistema
    class ollama,claude,whisper,vstudio,nube,correo,voz externo
```

---

## Nivel 2 - Contenedores

```mermaid
flowchart LR
    cliente["<b>Cliente Traductor</b><br/>[Persona]"]
    interlocutor["<b>Interlocutor</b><br/>[Persona]"]
    admin["<b>Administrador</b><br/>[Persona]"]

    subgraph talklate["Sistema TalkLate"]
        app["<b>App movil</b><br/>[Expo / React Native]<br/>iOS, Android y web. Burbuja de voz y chat."]
        api["<b>API TalkLate</b><br/>[Node.js 22 + Express, hexagonal]<br/>Cuentas, conversaciones y mensajes, voz, catalogo, reportes."]
        db[("<b>Base de datos</b><br/>[SurrealDB 3.x]<br/>Mensajes cifrados AES-256-GCM.")]
    end

    voz["<b>Microfono y voz del dispositivo</b><br/>[en el cliente]<br/>expo-audio y expo-speech."]
    ollama["<b>Ollama + Qwen</b><br/>[Servidor de TalkLate]"]
    whisper["<b>Whisper</b><br/>[Servidor de TalkLate]"]
    vstudio["<b>VoiceStudio</b><br/>[Servidor de TalkLate]"]
    claude["<b>Claude Sonnet</b><br/>[Anthropic]"]
    nube["<b>Azure Speech / OpenAI</b><br/>[Nube]"]
    correo["<b>Servicio de correo</b>"]

    cliente -->|Usa| app
    interlocutor -->|Responde con el mismo celular| app
    admin -->|Gestiona idiomas y reportes| app
    app -->|Graba y reproduce| voz
    app -->|HTTPS/JSON REST /api/v1<br/>JWT acceso 15 min + token de refresco| api
    api -->|Lee y escribe| db
    api -->|Traduce - /api/chat| ollama
    api -->|Transcribe - /v1/audio/transcriptions| whisper
    api -->|Voz con emocion - /generate| vstudio
    api -.->|Traduce si Qwen falla - HTTPS| claude
    api -.->|Voz si VoiceStudio falla - HTTPS| nube
    api -->|Envia codigo| correo

    classDef persona fill:#08427B,stroke:#073B6F,color:#FFFFFF
    classDef contenedor fill:#438DD5,stroke:#3C7FC0,color:#FFFFFF
    classDef externo fill:#999999,stroke:#6B6B6B,color:#FFFFFF
    class cliente,interlocutor,admin persona
    class app,api,db contenedor
    class voz,ollama,whisper,vstudio,claude,nube,correo externo
```

---

## Tabla de elementos

| Elemento | Tipo | Tecnologia | Descripcion |
| --- | --- | --- | --- |
| Cliente Traductor | Persona | - | Dueno del celular. Usa la app para traducir sus conversaciones. |
| Interlocutor | Persona | - | La otra persona de la conversacion. No instala la app; responde con el celular del Cliente Traductor. |
| Administrador | Persona | - | Gestiona el catalogo de idiomas y revisa reportes. |
| TalkLate | Sistema | - | Traduccion en tiempo real que considera contexto, emociones, jerga e intencion. |
| App movil | Contenedor | Expo / React Native (iOS, Android y web) | Burbuja de voz animada y modo chat. Graba la voz, muestra y reproduce traducciones. |
| API TalkLate | Contenedor | Node.js 22 + Express, arquitectura hexagonal | REST en `/api/v1`. Transcribe, estima la entonacion, traduce y sintetiza la voz con emocion. |
| Base de datos | Contenedor | SurrealDB 3.x (SQLite solo en pruebas) | Usuarios, conversaciones, catalogo y reportes. Mensajes cifrados con AES-256-GCM. |
| Ollama + Qwen | Sistema externo | Ollama, HTTP local `/api/chat` | Motor de traduccion principal, en el servidor de TalkLate. |
| Whisper | Sistema externo | whisper.cpp o faster-whisper, API compatible con OpenAI | Pasa el audio a texto, en el servidor de TalkLate. |
| VoiceStudio | Sistema externo | IndexTTS 2 (`/generate` con vector de emocion) | Voz neuronal con emocion, en el servidor de TalkLate. |
| Claude Sonnet | Sistema externo | HTTPS | Respaldo de traduccion; solo con clave y solo recibe el texto. |
| Azure Speech / OpenAI | Sistema externo | HTTPS (SSML con estilos / `gpt-4o-mini-tts`) | Respaldo de la voz con emocion; solo con clave. |
| Servicio de correo | Sistema externo | Puerto `Notificador` | Envia el codigo de recuperacion de cuenta. |
| Microfono y voz del dispositivo | Sistema externo (en el cliente) | expo-audio, expo-speech | Graba el mensaje y reproduce la voz de respaldo. |

## Comunicaciones principales

| Origen | Destino | Protocolo | Detalle |
| --- | --- | --- | --- |
| App movil | API TalkLate | HTTPS/JSON REST `/api/v1` | JWT de acceso de 15 min + token de refresco. El audio viaja en base64 (hasta 10 MB). |
| API TalkLate | Base de datos | HTTP `/sql` con token de sesion | Lectura y escritura; mensajes cifrados AES-256-GCM. |
| API TalkLate | Whisper | HTTP local multipart `/v1/audio/transcriptions` | Transcripcion del mensaje hablado con pista de idioma. |
| API TalkLate | Ollama + Qwen | HTTP local `/api/chat` | Primer intento de traduccion. |
| API TalkLate | Claude Sonnet | HTTPS | Segundo intento si Qwen falla y hay clave. |
| API TalkLate | Motor de reglas | En proceso | Ultimo recurso de traduccion. |
| API TalkLate | VoiceStudio | HTTP local `/generate` | Voz con el vector de emocion del tono detectado. |
| API TalkLate | Azure Speech / OpenAI | HTTPS | Respaldo de la voz si VoiceStudio falla. |
| App movil | API TalkLate | HTTPS `GET /voz/audio/:id` | Descarga el audio sintetizado (vence en 5 minutos). |
| API TalkLate | Servicio de correo | Puerto `Notificador` | Envio del codigo de recuperacion. |
