"""
SoftVerse MCP Orchestrator Server
Framework de orquestación de desarrollo independiente para proyectos de software.
"""

import json
from datetime import datetime, timezone
from pathlib import Path
from fastmcp import FastMCP

mcp = FastMCP("SoftVerse-Orchestrator")

PROJECT_ROOT = Path(__file__).parent.parent.parent.resolve()
STATE_FILE = PROJECT_ROOT / ".softverse" / "estado_fases.json"

# Dependencias entre fases (qué fases deben estar "completada" para desbloquear cada una).
DEPENDENCIES = {
    "F0": [],
    "F1": ["F0"],
    "F2": ["F1"],
    "F3": ["F2"],
    "F4": ["F3"],
    "F5": ["F3"],
    "F6": ["F4", "F5"],
    "F7": ["F6"],
    "F8": ["F6"],
    "F9": ["F7", "F8"],
    "F10": ["F9"],
}


def _now() -> str:
    return datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ")


def _load() -> dict:
    with open(STATE_FILE, "r", encoding="utf-8") as f:
        return json.load(f)


def _save(data: dict) -> None:
    with open(STATE_FILE, "w", encoding="utf-8") as f:
        json.dump(data, f, indent=2, ensure_ascii=False)


def _refresh_blocks(fases: dict) -> None:
    """Recalcula qué fases bloqueadas ya pueden desbloquearse según sus dependencias."""
    for fase_id, deps in DEPENDENCIES.items():
        info = fases.get(fase_id)
        if not info or info.get("estado") == "completada":
            continue
        pendientes = [dep for dep in deps if fases.get(dep, {}).get("estado") != "completada"]
        if pendientes:
            info["estado"] = "bloqueada"
            info["bloqueo"] = f"Requiere completar: {', '.join(pendientes)}"
        elif info.get("estado") != "desbloqueada":
            info["estado"] = "desbloqueada"
            info["bloqueo"] = None


@mcp.tool()
def softverse_get_status() -> str:
    """Retorna el estado actual de las fases del proyecto en SoftVerse."""
    if not STATE_FILE.exists():
        return f"Error: No se encontró el archivo de estado en {STATE_FILE}"

    data = _load()

    summary = [f"=== Estado del Proyecto: {data.get('proyecto')} (Framework {data.get('framework')}) ==="]
    for fase_id, info in data.get("fases", {}).items():
        estado = info.get("estado").upper()
        nombre = info.get("nombre", "")
        bloqueo = info.get("bloqueo")
        linea = f"[{fase_id}] {nombre}: {estado}"
        if bloqueo:
            linea += f" ({bloqueo})"
        summary.append(linea)

    return "\n".join(summary)


@mcp.tool()
def softverse_advance_phase(phase_id: str) -> str:
    """Marca una fase como completada en el archivo de estado de SoftVerse y desbloquea las fases dependientes."""
    if not STATE_FILE.exists():
        return f"Error: No se encontró el archivo de estado en {STATE_FILE}"

    data = _load()
    fases = data.get("fases", {})
    if phase_id not in fases:
        return f"Error: La fase '{phase_id}' no existe en la definición de SoftVerse."

    fases[phase_id]["estado"] = "completada"
    fases[phase_id]["bloqueo"] = None
    fases[phase_id]["timestamp"] = _now()

    _refresh_blocks(fases)
    _save(data)

    return f"Éxito: La fase '{phase_id}' fue marcada como COMPLETADA. Fases dependientes recalculadas."


if __name__ == "__main__":
    mcp.run(transport="stdio")
