#!/usr/bin/env python3
"""Bootstrap OpenBB's supported system settings into project-local storage."""
from importlib.metadata import entry_points
from pathlib import Path
import sys

from openbb_core.app.service.system_service import SystemService

ROOT = Path(__file__).resolve().parents[1]
state = ROOT / ".local/stock-tools/state/openbb"
state.mkdir(parents=True, exist_ok=True)
SystemService(openbb_directory=str(state), user_settings_path=str(state / "user_settings.json"),
              system_settings_path=str(state / "system_settings.json"), headless=True)

command, *arguments = sys.argv[1:]
sys.argv = [command, *arguments]
if command == "openbb" and arguments and arguments[0] == "--python":
    sys.argv = ["python", *arguments[1:]]
    if len(sys.argv) >= 3 and sys.argv[1] == "-c":
        exec(compile(sys.argv[2], "<openbb-python>", "exec"))
    else:
        raise SystemExit("Use: research-tool.py openbb --python -c 'from openbb import obb; ...'")
else:
    match = list(entry_points(group="console_scripts", name=command))
    if len(match) != 1:
        raise SystemExit(f"Expected one installed {command} entry point, found {len(match)}")
    raise SystemExit(match[0].load()())
