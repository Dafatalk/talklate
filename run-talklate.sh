#!/usr/bin/env bash
#
# run-talklate.sh - Levanta el stack de TalkLate con un solo comando.
#
# Uso:
#   ./run-talklate.sh          Backend (:3000) + Frontend Expo en LAN (:8081)
#   ./run-talklate.sh --full   Ademas levanta Ollama (:11434) y Whisper STT (:9000)
#   ./run-talklate.sh --help   Muestra esta ayuda
#
# Ctrl+C detiene el backend y el frontend. Los servicios de IA (Ollama/Whisper)
# se dejan corriendo aparte para no recargar los modelos en cada sesion.

set -uo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

# Puertos del stack (ver backend/.env y seguimiento/bitacora.md)
BACKEND_PORT=3000
EXPO_PORT=8081
OLLAMA_PORT=11434
WHISPER_PORT=9000

# Modelo de Whisper (sobreescribible: WHISPER_MODEL=... ./run-talklate.sh --full)
WHISPER_MODEL="${WHISPER_MODEL:-$HOME/modelos/ggml-small.bin}"
LOG_DIR="${TMPDIR:-/tmp}"

usage() {
  printf '%s\n' \
    "run-talklate.sh - Levanta el stack de TalkLate con un solo comando." \
    "" \
    "  ./run-talklate.sh          Backend (:${BACKEND_PORT}) + Frontend Expo LAN (:${EXPO_PORT})" \
    "  ./run-talklate.sh --full   Ademas levanta Ollama (:${OLLAMA_PORT}) y Whisper STT (:${WHISPER_PORT})" \
    "  ./run-talklate.sh --help   Muestra esta ayuda" \
    "" \
    "Ctrl+C detiene backend y frontend; Ollama/Whisper quedan corriendo aparte."
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

# 2) Estado de los servicios de IA local
echo "==> Servicios de IA local:"
ollama_down=0
whisper_down=0
estado_servicio "Ollama"      "$OLLAMA_PORT"  "arranca con: ollama serve"                 || ollama_down=1
estado_servicio "Whisper STT" "$WHISPER_PORT" "arranca con whisper-server en :9000"        || whisper_down=1
echo

# 3) Con --full, intenta levantar lo que falte (en segundo plano, persistente)
if [ "$FULL" -eq 1 ]; then
  if [ "$ollama_down" -eq 1 ] && command -v ollama >/dev/null 2>&1; then
    echo "==> Levantando Ollama en segundo plano (log: $LOG_DIR/talklate-ollama.log)"
    nohup ollama serve >"$LOG_DIR/talklate-ollama.log" 2>&1 </dev/null &
    disown 2>/dev/null || true
  fi
  if [ "$whisper_down" -eq 1 ]; then
    if command -v whisper-server >/dev/null 2>&1 && [ -f "$WHISPER_MODEL" ]; then
      echo "==> Levantando Whisper STT en segundo plano (log: $LOG_DIR/talklate-whisper.log)"
      nohup whisper-server -m "$WHISPER_MODEL" --host 127.0.0.1 --port "$WHISPER_PORT" \
        --inference-path /v1/audio/transcriptions --convert \
        >"$LOG_DIR/talklate-whisper.log" 2>&1 </dev/null &
      disown 2>/dev/null || true
    else
      echo "==> Whisper: falta el binario (brew install whisper-cpp) o el modelo ($WHISPER_MODEL). Se omite."
    fi
  fi
  echo
fi

# 4) Backend + Frontend (lo que Ctrl+C detiene)
pids=()

echo "==> Backend  -> http://localhost:$BACKEND_PORT   (health: GET /health)"
( cd "$ROOT/backend" && exec npm start ) &
pids+=("$!")

echo "==> Frontend -> Expo LAN (:$EXPO_PORT) - escanea el QR con Expo Go en la misma WiFi"
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
