#!/usr/bin/env python3
"""Install the requested research sources and project-scoped Codex skills."""
from __future__ import annotations

import argparse
import hashlib
import json
import os
from pathlib import Path
import platform
import re
import shutil
import subprocess
import tarfile

ROOT = Path(__file__).resolve().parents[1]
LOCAL = ROOT / ".local" / "stock-tools"
CONFIG = json.loads((ROOT / "config/research-sources.json").read_text())


def run(*args: str, **kwargs) -> None:
    kwargs.setdefault("cwd", ROOT)
    subprocess.run(args, check=True, **kwargs)


def checkout(source: dict) -> Path:
    dest = LOCAL / "sources" / source["id"]
    if not dest.exists():
        dest.mkdir(parents=True)
        run("git", "init", "--quiet", str(dest))
        run("git", "-C", str(dest), "remote", "add", "origin",
            f"https://github.com/{source['repository']}.git")
        run("git", "-C", str(dest), "fetch", "--depth", "1", "origin", source["commit"])
        run("git", "-C", str(dest), "checkout", "--detach", "--quiet", "FETCH_HEAD")
    head = subprocess.check_output(
        ["git", "-C", str(dest), "rev-parse", "HEAD"], text=True).strip()
    if head != source["commit"]:
        raise RuntimeError(f"{dest}: unexpected HEAD; preserve and inspect it before updating")
    run("git", "-C", str(dest), "diff", "--quiet", "HEAD", "--")
    return dest


def skill_files(source: Path, spec: dict) -> dict[str, bytes]:
    entry = source / spec["path"]
    files = [entry] if spec["single_file"] else sorted(entry.parent.rglob("*"))
    result = {}
    for file in files:
        if file.is_symlink():
            raise RuntimeError(f"Refusing to copy a skill symlink: {file}")
        if not file.is_file() or "__pycache__" in file.parts:
            continue
        rel = str(file.relative_to(entry.parent))
        data = file.read_bytes()
        if rel == "SKILL.md":
            # Codex skill identifiers use hyphens; preserve the remaining upstream text.
            data = re.sub(rb"(?m)^name:.*$", ("name: " + spec["name"]).encode(), data, count=1)
        result[rel] = data
    return result


def install_skills(source: Path, spec: dict) -> None:
    dest = ROOT / ".agents/skills" / spec["name"]
    for rel, data in skill_files(source, spec).items():
        target = dest / rel
        if target.exists() and target.read_bytes() != data:
            raise RuntimeError(f"Preserving changed local skill: {target}")
        target.parent.mkdir(parents=True, exist_ok=True)
        target.write_bytes(data)


def download(url: str, dest: Path) -> None:
    run("curl", "--fail", "--silent", "--show-error", "--location",
        "--max-time", "120", "--output", str(dest), url)


def install_cli() -> None:
    system = platform.system().lower()
    arch = {"x86_64": "amd64", "arm64": "arm64", "aarch64": "arm64"}.get(platform.machine())
    if system not in {"linux", "darwin"} or arch is None:
        raise RuntimeError("Longbridge CLI installer supports Linux/macOS amd64/arm64")
    release_os = "darwin" if system == "darwin" else "linux-musl"
    archive = f"longbridge-terminal-{release_os}-{arch}.tar.gz"
    version = CONFIG["longbridge_cli_version"]
    base = f"https://github.com/longbridge/longbridge-terminal/releases/download/{version}"
    downloads = LOCAL / "downloads"
    downloads.mkdir(parents=True, exist_ok=True)
    target = downloads / archive
    checksum = downloads / (archive + ".sha256")
    if not checksum.exists():
        download(f"{base}/{archive}.sha256", checksum)
    expected = checksum.read_text().split()[0].lower()
    if not re.fullmatch(r"[0-9a-f]{64}", expected):
        raise RuntimeError("Invalid published CLI checksum")
    if not target.exists():
        download(f"{base}/{archive}", target)
    actual = hashlib.sha256(target.read_bytes()).hexdigest()
    if expected != actual:
        raise RuntimeError("CLI checksum mismatch: do not use this archive")
    with tarfile.open(target, "r:gz") as tar:
        members = [m for m in tar.getmembers() if m.isfile() and Path(m.name).name == "longbridge"]
        if len(members) != 1:
            raise RuntimeError("CLI archive must contain exactly one longbridge executable")
        binary = LOCAL / "bin/longbridge"
        binary.parent.mkdir(parents=True, exist_ok=True)
        with tar.extractfile(members[0]) as src:
            binary.write_bytes(src.read())
        binary.chmod(0o755)
    state = LOCAL / "state/longbridge"
    state.mkdir(parents=True, exist_ok=True)
    run(str(binary), "--version", cwd=state)


def install_python_tools() -> None:
    if shutil.which("uv") is None:
        raise RuntimeError("Install uv first; on macOS: brew install uv")
    env = os.environ.copy()
    env.update(UV_CACHE_DIR=str(LOCAL / "uv-cache"),
               UV_PYTHON_INSTALL_DIR=str(LOCAL / "python"))
    run("uv", "python", "install", "--no-bin", CONFIG["python"], env=env)
    requirements = {
        "longbridge": ["czsc", "smartmoneyconcepts", "statsmodels", "scipy", "arch", "scikit-learn", "pandas", "numpy"],
        "tradingagents": [str(LOCAL / "sources/tradingagents") + "[dev]"],
        "openbb": [str(LOCAL / "sources/openbb/openbb_platform") + "[routers]"],
        "daily-stock-analysis": ["-r", str(LOCAL / "sources/daily-stock-analysis/requirements.txt"), "pytest"],
        "ai-berkshire": ["beautifulsoup4", "markdown", "markdownify", "playwright", "pypinyin"],
    }
    for tool, req in requirements.items():
        venv = LOCAL / "venvs" / tool
        if not (venv / "bin/python").exists():
            run("uv", "venv", "--python", CONFIG["python"], str(venv), env=env)
        python = str(venv / "bin/python")
        lock = ROOT / "config/research-locks/linux-py311" / (tool + ".txt")
        if platform.system() == "Linux" and platform.machine() == "x86_64":
            run("uv", "pip", "install", "--python", python, "-r", str(lock), env=env)
            if tool in {"tradingagents", "openbb"}:
                run("uv", "pip", "install", "--python", python, "--no-deps", *req, env=env)
        else:
            # Native wheels/markers differ on macOS. Resolve upstream declarations there.
            run("uv", "pip", "install", "--python", python, *req, env=env)
        run("uv", "pip", "check", "--python", python, env=env)


def install_daily_frontend() -> None:
    if shutil.which("node") is None or shutil.which("npm") is None:
        raise RuntimeError("Daily Stock Analysis frontend requires Node >=20.19,<27 and npm >=10")
    env = os.environ.copy()
    env.setdefault("npm_config_cache", str(LOCAL / "npm-cache"))
    env.setdefault("npm_config_registry", "https://registry.npmjs.org")
    # The upstream lock also names npmmirror. npm's supported host replacement
    # uses the official registry while retaining every locked integrity hash.
    env.setdefault("npm_config_replace_registry_host", "always")
    env.setdefault("npm_config_audit", "false")
    env.setdefault("npm_config_fund", "false")
    run(str(LOCAL / "venvs/daily-stock-analysis/bin/python"), "-c",
        "from src.webui_frontend import prepare_webui_frontend_assets; "
        "raise SystemExit(0 if prepare_webui_frontend_assets() else 1)",
        cwd=LOCAL / "sources/daily-stock-analysis", env=env)


def main() -> None:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--skills-only", action="store_true", help="Fetch pinned sources and register native skills only")
    args = parser.parse_args()
    for source in CONFIG["sources"]:
        print(f"Checking {source['repository']} @ {source['commit'][:12]}", flush=True)
        path = checkout(source)
        for skill in source["skills"]:
            install_skills(path, skill)
    if not args.skills_only:
        install_python_tools()
        install_cli()
        install_daily_frontend()
    count = sum(len(s["skills"]) for s in CONFIG["sources"])
    print(f"Installed {count} upstream investment skills plus the project research-toolkit skill.")
    print("Open a new Codex session in this repository to discover project skills.")


if __name__ == "__main__":
    main()
