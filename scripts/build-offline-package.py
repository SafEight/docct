#!/usr/bin/env python3
"""Create the downloadable, self-contained DOCCT offline ZIP."""

from pathlib import Path
import shutil
import stat
import zipfile

ROOT = Path(__file__).resolve().parents[1]
BUILD = ROOT / "build"
OFFLINE = ROOT / "offline"
STAGE_ROOT = ROOT / ".offline-package"
STAGE = STAGE_ROOT / "docct-offline"
OUTPUT = ROOT / "static" / "downloads" / "docct-offline.zip"

if not (BUILD / "index.html").exists():
    raise SystemExit("build/index.html is missing; run npm run build first")

shutil.rmtree(STAGE_ROOT, ignore_errors=True)
(STAGE / "site").mkdir(parents=True)

# Never embed a previous package inside the new package.
shutil.copytree(
    BUILD,
    STAGE / "site",
    dirs_exist_ok=True,
    ignore=shutil.ignore_patterns("downloads"),
)
for name in ("server.py", "Start DOCCT.bat", "Start DOCCT.command", "README.md"):
    shutil.copy2(OFFLINE / name, STAGE / name)

# The online app contains an optional community link. Disable it in the
# offline edition so every user-facing action remains local-only.
for bundle in (STAGE / "site").rglob("*.js"):
    data = bundle.read_bytes()
    updated = data.replace(b"https://discord.com/invite/brain", b"#offline")
    if updated != data:
        bundle.write_bytes(updated)

(STAGE / "server.py").chmod(0o755)
(STAGE / "Start DOCCT.command").chmod(0o755)
OUTPUT.parent.mkdir(parents=True, exist_ok=True)
OUTPUT.unlink(missing_ok=True)

with zipfile.ZipFile(OUTPUT, "w", compression=zipfile.ZIP_DEFLATED, compresslevel=9) as archive:
    for path in sorted(STAGE_ROOT.rglob("*")):
        if not path.is_file():
            continue
        arcname = path.relative_to(STAGE_ROOT)
        info = zipfile.ZipInfo.from_file(path, arcname)
        info.compress_type = zipfile.ZIP_DEFLATED
        if path.name in {"server.py", "Start DOCCT.command"}:
            info.external_attr = (stat.S_IFREG | 0o755) << 16
        with path.open("rb") as source:
            archive.writestr(info, source.read(), compress_type=zipfile.ZIP_DEFLATED, compresslevel=9)

print(f"Created {OUTPUT} ({OUTPUT.stat().st_size:,} bytes)")
