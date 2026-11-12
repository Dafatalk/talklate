#!/usr/bin/env bash
#
# run-talklate.sh - Levanta el stack de TalkLate con un solo comando.
#
# Uso:
#   ./run-talklate.sh          Backend (:3000) + Frontend Expo en LAN (:8081) + QR
#   ./run-talklate.sh --full   Ademas levanta Whisper STT (:9000)
#   ./run-talklate.sh --help   Muestra esta ayuda
#
# Traduccion por Claude (Sonnet) en Google Vertex AI; ya no se usa Ollama/Qwen.
# El backend arranca con TRADUCTOR=claude (Vertex -> reglas). Requiere en el entorno:
# ANTHROPIC_USE_VERTEX=1, ANTHROPIC_VERTEX_PROJECT_ID, CLOUD_ML_REGION y credenciales ADC de Google.
#
# Ctrl+C detiene el backend y el frontend. Whisper (si se levanta con --full) queda
# corriendo aparte para no recargar el modelo en cada sesion.

set -uo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

# Puertos del stack (ver backend/.env y seguimiento/bitacora.md)
BACKEND_PORT=3000
EXPO_PORT=8081
WHISPER_PORT=9000

# Motor de traduccion: Claude via Vertex (Vertex -> reglas), sin Qwen/Ollama. Sobreescribible.
export TRADUCTOR="${TRADUCTOR:-claude}"

# Modelo de Whisper (sobreescribible: WHISPER_MODEL=... ./run-talklate.sh --full)
WHISPER_MODEL="${WHISPER_MODEL:-$HOME/modelos/ggml-small.bin}"
LOG_DIR="${TMPDIR:-/tmp}"

usage() {
  printf '%s\n' \
    "run-talklate.sh - Levanta el stack de TalkLate con un solo comando." \
    "" \
    "  ./run-talklate.sh          Backend (:${BACKEND_PORT}) + Frontend Expo LAN (:${EXPO_PORT}) + QR" \
    "  ./run-talklate.sh --full   Ademas levanta Whisper STT (:${WHISPER_PORT})" \
    "  ./run-talklate.sh --help   Muestra esta ayuda" \
    "" \
    "Traduccion por Claude en Vertex AI (sin Ollama). Ctrl+C detiene backend y frontend."
}

FULL=0
for arg in "$@"; do
  case "$arg" in
    --full|-f) FULL=1 ;;
    -h|--help) usage; exit 0 ;;
    *) echo "Opcion desconocida: $arg" >&2; usage; exit 1 ;;
  esac
done

puerto_ocupado() { lsof -iTCP:"$1" -sTCP:LISTEN -n -P >/dev/null 2>&1; }

estado_servicio() {
  local nombre="$1" puerto="$2" pista="$3"
  if puerto_ocupado "$puerto"; then
    printf '  [ok]   %-12s activo (:%s)\n' "$nombre" "$puerto"
    return 0
  fi
  printf '  [--]   %-12s apagado (:%s) - %s\n' "$nombre" "$puerto" "$pista"
  return 1
}

# IP de la LAN para armar la URL de Expo (Expo Go en la misma WiFi)
lan_ip() {
  local ip
  for iface in en0 en1 en2 en3; do
    ip="$(ipconfig getifaddr "$iface" 2>/dev/null)" && [ -n "$ip" ] && { echo "$ip"; return 0; }
  done
  return 1
}

# Entrega el QR al levantar: lo imprime en la terminal y lo guarda como PNG que se abre solo.
mostrar_qr() {
  local url="$1"
  echo "==> QR para abrir en Expo Go (misma WiFi):  $url"
  if command -v qrencode >/dev/null 2>&1; then
    qrencode -t ANSIUTF8 "$url"
    if qrencode -o "$ROOT/talklate-qr.png" "$url" 2>/dev/null; then
      echo "   QR guardado en: $ROOT/talklate-qr.png"
      command -v open >/dev/null 2>&1 && open "$ROOT/talklate-qr.png" >/dev/null 2>&1 || true
    fi
  else
    echo "   (instala 'qrencode' con: brew install qrencode para ver el QR aqui; Expo tambien lo imprimira abajo)"
  fi
}

echo "==> TalkLate - arranque local"
echo

# 1) Dependencias (solo si faltan)
if [ ! -d "$ROOT/backend/node_modules" ]; then
  echo "==> Instalando dependencias del backend..."
  ( cd "$ROOT/backend" && npm install )
fi
if [ ! -d "$ROOT/frontend/node_modules" ]; then
  echo "==> Instalando dependencias del frontend (--legacy-peer-deps)..."
  ( cd "$ROOT/frontend" && npm install --legacy-peer-deps )
fi

# 2) Estado de Whisper STT (transcripcion de voz)
echo "==> Servicios de IA local:"
whisper_down=0
estado_servicio "Whisper STT" "$WHISPER_PORT" "arranca con whisper-server en :9000 (o usa --full)" || whisper_down=1
echo

# 3) Con --full, intenta levantar Whisper si falta (en segundo plano, persistente)
if [ "$FULL" -eq 1 ] && [ "$whisper_down" -eq 1 ]; then
  if command -v whisper-server >/dev/null 2>&1 && [ -f "$WHISPER_MODEL" ]; then
    echo "==> Levantando Whisper STT en segundo plano (log: $LOG_DIR/talklate-whisper.log)"
    nohup whisper-server -m "$WHISPER_MODEL" --host 127.0.0.1 --port "$WHISPER_PORT" \
      --inference-path /v1/audio/transcriptions --convert \
      >"$LOG_DIR/talklate-whisper.log" 2>&1 </dev/null &
    disown 2>/dev/null || true
  else
    echo "==> Whisper: falta el binario (brew install whisper-cpp) o el modelo ($WHISPER_MODEL). Se omite."
  fi
  echo
fi

# 4) QR del frontend (se entrega antes de que los logs tapen la pantalla)
if IP="$(lan_ip)"; then
  mostrar_qr "exp://$IP:$EXPO_PORT"
else
  echo "==> No pude detectar la IP de la LAN; Expo imprimira su propio QR abajo."
fi
echo

# 5) Backend + Frontend (lo que Ctrl+C detiene)
pids=()

echo "==> Backend  -> http://localhost:$BACKEND_PORT   (health: GET /health, traductor: $TRADUCTOR)"
( cd "$ROOT/backend" && exec npm start ) &
pids+=("$!")

echo "==> Frontend -> Expo LAN (:$EXPO_PORT) - escanea el QR de arriba con Expo Go en la misma WiFi"
( cd "$ROOT/frontend" && exec npm start -- --lan ) &
pids+=("$!")

cleanup() {
  trap - INT TERM EXIT
  echo
  echo "==> Deteniendo backend y frontend..."
  for pid in "${pids[@]}"; do kill "$pid" 2>/dev/null || true; done
  wait "${pids[@]}" 2>/dev/null || true
}
trap cleanup INT TERM EXIT

echo
echo "==> TalkLate corriendo. Ctrl+C para detener backend y frontend."
wait "${pids[@]}"
