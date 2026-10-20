#!/usr/bin/env python3
"""Release gate: fail if a secret or a forbidden backend host is present.

Scans the sanitized sources and the patched executable. Provider API hosts and
provider documentation links are intentional; only actual credentials and the
old Ghoster/Supabase/Sentry/Google-Fonts/Kroki endpoints are rejected.
"""
from __future__ import annotations

import re
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
EXE = ROOT / "build" / "GhosterAI-patched.exe"

TEXT_ROOTS = (ROOT / "src", ROOT / "docs", ROOT / "installer", ROOT / "scripts")

PATTERNS = {
    "openai-like key": re.compile(r"sk-(?:proj-)?[A-Za-z0-9]{20,}"),
    "openrouter key": re.compile(r"sk-or-v1-[A-Za-z0-9]{20,}"),
    "groq key": re.compile(r"gsk_[A-Za-z0-9]{20,}"),
    "xai key": re.compile(r"xai-[A-Za-z0-9]{20,}"),
    "perplexity key": re.compile(r"pplx-[A-Za-z0-9]{20,}"),
    "google api key": re.compile(r"AIza[0-9A-Za-z_-]{30,}"),
    "jwt": re.compile(r"eyJ[A-Za-z0-9_-]{10,}\.[A-Za-z0-9_-]{10,}\.[A-Za-z0-9_-]{10,}"),
    "supabase url": re.compile(r"https?://[a-z0-9]+\.supabase\.co[^\"'\s]*"),
    "sentry dsn": re.compile(r"https?://[a-f0-9]+@[^/\"'\s]+/[0-9]+"),
    "ghoster host": re.compile(r"(?i)https?://[^\"'\s]*ghoster\.ai[^\"'\s]*"),
    "vercel host": re.compile(r"https?://[^\"'\s]*vercel\.app[^\"'\s]*"),
    "google fonts": re.compile(r"https?://fonts\.(?:googleapis|gstatic)\.com[^\"'\s]*"),
    "kroki host": re.compile(r"https?://[^\"'\s]*kroki\.ghoster\.ai[^\"'\s]*"),
    "telegram ghoster": re.compile(r"https?://t\.me/[^\"'\s]*ghoster[^\"'\s]*"),
    "websocket": re.compile(r"wss?://[^\"'\s]+"),
}

ALLOWED_WEBSOCKETS = (
    "wss://api.deepgram.com/",
    "wss://stt-rt.soniox.com/",
    "wss://api.inworld.ai/",
    "ws://127.0.0.1",
    "ws://localhost",
    "ws://tauri.localhost",
)


def scan(text: str, label: str, findings: list[str]) -> None:
    for name, pat in PATTERNS.items():
        for m in pat.finditer(text):
            value = m.group(0)
            if name == "websocket" and value.startswith(ALLOWED_WEBSOCKETS):
                continue
            if name in {"openai-like key", "openrouter key", "groq key", "xai key",
                        "perplexity key", "google api key", "jwt"}:
                findings.append(f"{label}: {name}: {value[:20]}...")
            else:
                findings.append(f"{label}: {name}: {value[:180]}")


def main() -> None:
    findings: list[str] = []
    for base in TEXT_ROOTS:
        for path in sorted(base.rglob("*")):
            if not path.is_file():
                continue
            if path.suffix.lower() in {".png", ".jpg", ".jpeg", ".ico", ".exe", ".zip"}:
                continue
            # The sanitizer necessarily contains the patterns it removes.
            if path.name == "sanitize_assets.py":
                continue
            text = path.read_text(encoding="utf-8", errors="ignore")
            scan(text, str(path.relative_to(ROOT)), findings)

    readme = ROOT / "README.md"
    if readme.exists():
        scan(readme.read_text(encoding="utf-8", errors="ignore"), readme.name, findings)

    if EXE.exists():
        scan(EXE.read_bytes().decode("latin-1", errors="ignore"), EXE.name, findings)

    if findings:
        print("FINDINGS:")
        for line in findings:
            print(line)
        print(f"\n{len(findings)} finding(s)")
        sys.exit(1)
    print("clean: no credential or forbidden-backend findings")


if __name__ == "__main__":
    main()
