#!/usr/bin/env python3
"""Create a local-only, key-free copy of the web assets.

The source directory contains the original application build, including the
provider keys that were embedded by the upstream build.  This script never
prints key material.  It copies the source to GhosterAI/src/web-dist, removes
all embedded keys and remote-service integrations, and writes a small runtime
key-store helper used by the patched application.

Usage:
    python GhosterAI/scripts/sanitize_assets.py
"""

from __future__ import annotations

import hashlib
import json
import re
import shutil
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
SOURCE = ROOT.parent / "App" / "web-dist"
DEST = ROOT / "src" / "web-dist"
BUNDLE = ROOT / "build" / "key-manager.bundle.mjs"
MANIFEST = ROOT / "build" / "changed_assets.json"

KEY_STORE_HELPER = r"""/*ghoster-key-store-v1*/;(()=>{const K="ghoster_api_keys_v1";const rd=()=>{try{const r=localStorage.getItem(K);return r?JSON.parse(r):null}catch(e){return null}};let cache=rd();const cfg=()=>cache||(cache=rd())||{providers:{}};const ks=id=>{const p=cfg().providers&&cfg().providers[id];return p&&Array.isArray(p.keys)?p.keys.filter(k=>typeof k=="string"&&k.trim()):[]};const route=m=>{const c=cfg();for(const id in c.providers||{}){const p=c.providers[id];if(!p||p.gemini||p.tts)continue;const k=Array.isArray(p.keys)?p.keys.filter(x=>x&&x.trim()):[];if(!p.enabled&&!k.length)continue;const ms=Array.isArray(p.models)?p.models:[];for(const x of ms){const mid=typeof x=="string"?x:x.id;if(mid!==m)continue;const r={u:p.url,p:id};if(x&&typeof x=="object"&&x.api&&x.api!==mid)r.m=x.api;if(p.native)r.n=1;if(p.local)r.local=1;return r}}return null};const all=()=>{const c=cfg();const out=[];const skip={google:1,openrouter:1,tokenharbor:1,aishko:1,lunaroute:1,dphn:1,nvidia:1,qwen:1,"dots-studio":1,thinkingmachines:1};for(const id in c.providers||{}){if(skip[id])continue;const p=c.providers[id];if(!p||p.gemini||p.tts)continue;const k=Array.isArray(p.keys)?p.keys.filter(x=>x&&x.trim()):[];if(!p.enabled&&!k.length)continue;const ms=(Array.isArray(p.models)?p.models:[]).map(x=>{const mid=typeof x=="string"?x:x.id;return{name:mid,displayName:(x&&x.name)||mid,family:"custom",contextLength:128000,tokensPerSecond:50,features:[],latency:400,latencyByEffort:{none:400},minReasoningEffort:"none",vision:false,effort:"none",supportedEfforts:["none"],description:""}});if(!ms.length)continue;out.push({name:id,displayName:p.name||id,icon:"",models:ms})}return out};const def=()=>cfg().defaultModel||"deepseek-4.1-flash";window.__GHOSTER_KEY_STORE={read:()=>cfg(),reload:()=>{cache=rd()},keys:ks,route,all,defaultModel:def};window.__GHOSTER_KEYS=ks;window.__GHOSTER_ROUTE=route;window.__GHOSTER_PROVIDERS=all;window.__GHOSTER_DEFAULT_MODEL=def();window.__GHOSTER_PROVIDER_NAME=id=>{const p=cfg().providers&&cfg().providers[id];return p&&p.name||id};window.__GHOSTER_KEY_COUNT=id=>ks(id).length;window.__GHOSTER_NEXT_KEY=id=>{const a=ks(id);if(!a.length)return"";const c=window.__GHOSTER_KEY_IDX||(window.__GHOSTER_KEY_IDX={});c[id]=(c[id]||0)%a.length;const k=a[c[id]];c[id]=(c[id]+1)%a.length;return k};})();"""

EXT_ROUTES_PROXY = 'const _EXT_ROUTES = new Proxy({}, { get(t, p) { return (typeof p === "string" && window.__GHOSTER_ROUTE) ? window.__GHOSTER_ROUTE(p) : undefined; }, has(t, p) { return !!(typeof p === "string" && window.__GHOSTER_ROUTE && window.__GHOSTER_ROUTE(p)); } }); '


def read_text(path: Path) -> str:
    return path.read_text(encoding="utf-8", errors="ignore")


def write_text(path: Path, text: str) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(text, encoding="utf-8", newline="")


def must_replace(s: str, old: str, new: str, label: str, count: int = 1) -> str:
    found = s.count(old)
    if found != count:
        raise SystemExit(f"{label}: expected {count} occurrence(s), found {found}")
    return s.replace(old, new)


def must_sub(s: str, pattern: str, replacement, label: str, count: int = 1, flags: int = 0) -> str:
    out, found = re.subn(pattern, replacement, s, count=count, flags=flags)
    if found != count:
        raise SystemExit(f"{label}: expected {count} occurrence(s), found {found}")
    return out


def replace_array_decl(s: str, var: str, provider: str) -> str:
    pattern = r"(?:(?:const|let|var)\s+" + re.escape(var) + r"\s*=\s*)\[[^\]]*\]"
    return must_sub(
        s,
        pattern,
        f'const {var}=window.__GHOSTER_KEYS("{provider}");',
        f"replace {var}",
    )


def find_matching_bracket(s: str, open_pos: int) -> int:
    """Return the index of the matching ] for the [ at open_pos."""
    assert s[open_pos] == "["
    depth = 0
    quote = None
    escaped = False
    i = open_pos
    while i < len(s):
        ch = s[i]
        if quote:
            if escaped:
                escaped = False
            elif ch == "\\":
                escaped = True
            elif ch == quote:
                quote = None
        else:
            if ch in "\"'`":
                quote = ch
            elif ch == "[":
                depth += 1
            elif ch == "]":
                depth -= 1
                if depth == 0:
                    return i
        i += 1
    raise SystemExit("unterminated provider array")


def add_provider_spread(s: str) -> str:
    marker = "providers:["
    pos = s.find(marker)
    if pos < 0:
        raise SystemExit("providers array not found")
    if s.count(marker) != 1:
        raise SystemExit("expected exactly one providers array")
    open_pos = pos + len(marker) - 1
    close_pos = find_matching_bracket(s, open_pos)
    spread = ",...(window.__GHOSTER_PROVIDERS?window.__GHOSTER_PROVIDERS():[])"
    return s[:close_pos] + spread + s[close_pos:]


def main() -> None:
    if not SOURCE.is_dir():
        raise SystemExit(f"source not found: {SOURCE}")
    if not BUNDLE.is_file():
        raise SystemExit(f"key manager bundle not found: {BUNDLE}")

    if DEST.exists():
        shutil.rmtree(DEST)
    shutil.copytree(SOURCE, DEST)

    changed: list[str] = []

    # ---------------------------------------------------------------- entry
    path = DEST / "assets" / "index-D-8kMdIr.js"
    s = read_text(path)
    s = replace_array_decl(s, "_gKeys", "google")
    s = replace_array_decl(s, "_GROQ_STT_KEYS", "groq")
    s = must_sub(s, r'_sbUrl="[^"]*"', '_sbUrl=""', "supabase URL")
    s = must_sub(s, r'_sbKey="[^"]*"', '_sbKey=""', "supabase key")

    sb_start = s.find("const _sbReq=async")
    sb_marker = 'if(typeof window<"u")window.__ghosterSbReq=_sbReq;'
    sb_end = s.find(sb_marker, sb_start)
    if sb_start < 0 or sb_end < 0:
        raise SystemExit("supabase request helper not found")
    sb_end += len(sb_marker)
    s = s[:sb_start] + 'const _sbReq=async()=>null;if(typeof window<"u")window.__ghosterSbReq=_sbReq;' + s[sb_end:]

    s = must_sub(
        s,
        r'https://[^"\']*sentry\.io[^"\']*',
        '',
        "sentry DSN",
    )
    s = must_sub(
        s,
        r'if\(s\.startsWith\("/api/"\).*?return Xb\(inp,ini\);',
        'if(false)return Xb(inp,ini);',
        "remote api fetch branch",
        flags=re.S,
    )
    # Keep the API client on the local Tauri origin.  Eden builds absolute
    # URLs from this base, and the local mock branch only recognises requests
    # whose origin matches it.  An empty base produced "https://api/meeting".
    s = must_replace(
        s,
        'Ub=Ob("https://backend.ghoster.ai")',
        'Ub=Ob(typeof window<"u"?window.location.origin:"http://tauri.localhost")',
        "backend base",
    )
    s = must_replace(
        s,
        'm9=H2("wss://ws.ghoster.ai/connection/websocket")',
        'm9=H2("")',
        "backend websocket",
    )
    s = must_replace(
        s,
        'Fb=H2("https://ghoster.ai/")',
        'Fb=H2("http://127.0.0.1/")',
        "app base URL",
    )

    s = must_replace(s, "https://ghoster.ai)", "https://example.invalid)", "sample brand links", count=2)

    # Any URL-shaped brand host that is left is a dead link.  Keep it local.
    s, _ = re.subn(r"https://(?:[A-Za-z0-9-]+\.)*ghoster\.ai", "https://example.invalid", s)
    s, _ = re.subn(r"https://ghosterai\.vercel\.app[^\"'\s)]*", "https://example.invalid", s)

    # Remaining plain-text brand references are safe to rename.
    s = s.replace("ghoster.ai", "Ghoster AI")
    if "ghoster.ai" in s:
        raise SystemExit("plain brand host remains in entry module")
    if re.search(r"https?://[^\"'\s)]*ghoster", s):
        raise SystemExit("ghoster URL remains in entry module")

    # Local-only build: there is no Ghoster account service.  Treat the app as
    # authenticated and provide a local account object so account-dependent UI
    # does not fall back to the sign-in screen or crash on a null account.
    s = must_replace(
        s,
        "V2=()=>l.useContext(T2);",
        'V2=()=>{const c=l.useContext(T2)||{};return c&&c.token?c:{...c,token:"local-only",tokenLoaded:!0,account:c.account||{id:"local",name:"Local user",email:"",image:null,subscription:null,wss:"",telegramUnreachable:false}}};',
        "local auth context",
    )

    # Do not create or send a persistent account cookie in the local build.
    # The local API mock does not need it and the app never talks to a cloud.
    s = must_replace(
        s,
        'C2=()=>m0||tv()',
        'C2=()=>""',
        "local auth token reader",
    )
    cookie_line = (
        'typeof document<"u"&&(p?document.cookie=`token=${p}; path=/; max-age=31536000; SameSite=Lax`'
        ':document.cookie="token=; path=/; max-age=0; SameSite=Lax")'
    )
    s = must_replace(
        s,
        cookie_line,
        'typeof document<"u"&&(document.cookie="token=; path=/; max-age=0; SameSite=Lax")',
        "local auth cookie writer",
    )

    # Remove the synthetic demo meeting/subchat.  A new profile should show an
    # empty meeting list until the user creates a real session.
    demo_meeting = (
        'meets=[{id:"default-meeting",title:"Главное собеседование",'
        'accountId:"ghoster-admin",mode:"interview",createdAt:new Date().toISOString(),'
        'voiceCredits:0,usageCount:0,summary:null,summaryStatus:"idle"}]'
    )
    if demo_meeting not in s:
        raise SystemExit("demo meeting seed not found")
    s = s.replace(demo_meeting, "meets=[]")
    demo_subchat = (
        'subchats=[{id:"default-subchat",meetingId:"default-meeting",'
        'title:"Основной чат",createdAt:new Date().toISOString()}]'
    )
    if demo_subchat not in s:
        raise SystemExit("demo subchat seed not found")
    s = s.replace(demo_subchat, "subchats=[]")

    s = add_provider_spread(s)
    if "__GHOSTER_PROVIDERS" not in s:
        raise SystemExit("provider spread was not inserted")
    s = KEY_STORE_HELPER + "\n" + s
    write_text(path, s)
    changed.append("assets/index-D-8kMdIr.js")

    # ---------------------------------------------------------------- chat
    path = DEST / "assets" / "index-CMdkLZfh.js"
    s = read_text(path)
    s = replace_array_decl(s, "_GEMINI_KEYS", "google")
    s = replace_array_decl(s, "_OR_KEYS", "openrouter")

    ext_start = s.find("const _EXT_ROUTES =")
    ext_end = s.find("const _tauriFetch", ext_start)
    if ext_start < 0 or ext_end < 0:
        raise SystemExit("EXT_ROUTES block not found")
    s = s[:ext_start] + EXT_ROUTES_PROXY + s[ext_end:]

    s = must_sub(
        s,
        r'const chosenModel = \(g && g\.model\) \|\| \(typeof useChatStore !== "undefined" && useChatStore\.getState\(\)\.model\) \|\| "deepseek-4\.1-flash";',
        'const chosenModel = (g && g.model) || (typeof useChatStore !== "undefined" && useChatStore.getState().model) || (window.__GHOSTER_DEFAULT_MODEL||"deepseek-4.1-flash");',
        "chosenModel fallback",
    )
    s = must_sub(
        s,
        r'const displayModel = \(chosenModel === "auto" \|\| chosenModel === "pareto-code" \|\| chosenModel === "gpt-6-luna" \|\| chosenModel === "gpt-4\.1"\) \? "deepseek-4\.1-flash" : chosenModel;',
        'const displayModel = (chosenModel === "auto" || chosenModel === "pareto-code" || chosenModel === "gpt-6-luna") ? (window.__GHOSTER_DEFAULT_MODEL||"deepseek-4.1-flash") : chosenModel;',
        "displayModel alias",
    )
    s = must_sub(
        s,
        r'const targetOrModel = \(displayModel && \(displayModel\.includes\("/"\) \|\| !!_EXT_ROUTES\[displayModel\]\)\) \? displayModel : "nvidia/nemotron-3\.5-lightning:free";',
        'const targetOrModel = (displayModel && (displayModel.includes("/") || !!_EXT_ROUTES[displayModel])) ? displayModel : (window.__GHOSTER_DEFAULT_MODEL||"deepseek-4.1-flash");',
        "target model fallback",
    )

    s = must_replace(
        s,
        "for (let attempt = 0; attempt < _OR_KEYS.length; attempt++) {",
        "for (let attempt = 0; attempt < Math.max(5, _OR_KEYS.length); attempt++) {",
        "OpenRouter retry count",
    )
    s = must_replace(
        s,
        "const curKey = _OR_KEYS[_orKeyIdx];",
        'const curKey = _OR_KEYS.length ? _OR_KEYS[_orKeyIdx % _OR_KEYS.length] : "";',
        "OpenRouter key read",
    )
    s = must_replace(
        s,
        "_orKeyIdx = (_orKeyIdx + 1) % _OR_KEYS.length;",
        "if (_OR_KEYS.length) _orKeyIdx = (_orKeyIdx + 1) % _OR_KEYS.length;",
        "OpenRouter key advance",
    )
    s = must_replace(
        s,
        "if (_EXT_ROUTES[displayModel] && (res.status === 401 || res.status === 403 || res.status === 404)) break;",
        "if (_EXT_ROUTES[displayModel] && (res.status === 401 || res.status === 403 || res.status === 404)) continue;",
        "OpenRouter retry on auth",
    )
    s = must_sub(
        s,
        r',\s*"HTTP-Referer":\s*"https://ghoster\.ai",\s*"X-Title":\s*"Ghoster AI"',
        "",
        "OpenRouter brand headers",
        flags=re.S,
    )
    s = must_replace(
        s,
        'h.Authorization = "Bearer " + r.k;',
        'const _gk = (typeof window !== "undefined" && window.__GHOSTER_NEXT_KEY) ? window.__GHOSTER_NEXT_KEY(r.p) : r.k; if (_gk) h.Authorization = "Bearer " + _gk; else delete h.Authorization;',
        "provider auth header",
    )
    s = must_sub(s, r'w\.name!=="ghoster\.ai"', 'w.name!==""', "provider icon comparison")
    s, _ = re.subn(r'\|\|\s*"deepseek-4\.1-flash"', '|| window.__GHOSTER_DEFAULT_MODEL || "deepseek-4.1-flash"', s)
    if "ghoster.ai" in s:
        raise SystemExit("brand host remains in chat module")
    write_text(path, s)
    changed.append("assets/index-CMdkLZfh.js")

    # ---------------------------------------------------------------- TTS
    path = DEST / "assets" / "use-soniox-realtime-tts-DtBzzmLd.js"
    s = read_text(path)
    s = replace_array_decl(s, "_ELEVEN_KEYS", "elevenlabs")
    s = replace_array_decl(s, "_FISH_KEYS", "fish")
    write_text(path, s)
    changed.append("assets/use-soniox-realtime-tts-DtBzzmLd.js")

    # ---------------------------------------------------------------- Sentry / key UI
    path = DEST / "assets" / "index-DJXE-m4X.js"
    write_text(path, read_text(BUNDLE))
    changed.append("assets/index-DJXE-m4X.js")

    # ---------------------------------------------------------------- diagrams
    path = DEST / "assets" / "markdown-Bv7kq_yw.js"
    s = read_text(path)
    s = must_replace(
        s,
        'ti(`https://kroki.ghoster.ai/${s}/svg`,{method:"POST",headers:{"Content-Type":"text/plain"},body:r})',
        'Promise.reject(o("markdown.failedToRenderDiagram"))',
        "remote Kroki call",
    )
    write_text(path, s)
    changed.append("assets/markdown-Bv7kq_yw.js")

    # ---------------------------------------------------------------- runtime model merge
    path = DEST / "assets" / "meeting-store-CojOqpen.js"
    s = read_text(path)
    s = must_replace(
        s,
        '["gpt-6-luna","gpt-4.1","auto","pareto-code","gemini-3.1-flash-lite","gemini-3.1-flash-lite-preview"]',
        '["auto","pareto-code"]',
        "persisted model allow-list",
    )
    # Expose the in-memory chat store so the local persistence bridge in the
    # key-manager can mirror messages into localStorage.
    s += '\n/*ghoster-chat-store-v1*/;if(typeof window<"u")window.__GHOSTER_CHAT_STORE=G;\n'
    write_text(path, s)
    changed.append("assets/meeting-store-CojOqpen.js")

    # ---------------------------------------------------------------- provider icon map
    path = DEST / "assets" / "model-selector-CRt-qod_.js"
    s = read_text(path)
    s = s.replace('"ghoster.ai"', '""')
    if '"ghoster.ai"' in s:
        raise SystemExit("brand host remains in model selector")
    write_text(path, s)
    changed.append("assets/model-selector-CRt-qod_.js")

    # ---------------------------------------------------------------- dead links / old logo
    path = DEST / "assets" / "index-BEs0nAY4.js"
    s = read_text(path)
    s = must_replace(
        s,
        "https://ghosterai.vercel.app/client-auth",
        "data:,",
        "client auth URL",
    )
    s = must_replace(s, 'children:"ghoster.ai"', 'children:"Ghoster AI"', "auth brand")
    write_text(path, s)
    changed.append("assets/index-BEs0nAY4.js")

    path = DEST / "assets" / "sidebar-Bz0u3HA5.js"
    s = read_text(path)
    s = must_replace(
        s,
        "https://ghosterai.vercel.app/test-compatibility",
        "data:,",
        "compatibility URL",
    )
    s = must_replace(s, 'children:"ghoster.ai"', 'children:"Ghoster AI"', "sidebar brand")
    # The local build must not send users to the upstream Telegram bots.
    s, _ = re.subn(r"https://t\.me/[^\"']*ghoster[^\"']*", "data:,", s)
    write_text(path, s)
    changed.append("assets/sidebar-Bz0u3HA5.js")

    # Same Telegram bot link appears in the subscriber chat entry point.
    path = DEST / "assets" / "subscribers-chat-DhUCw7lf.js"
    s = read_text(path)
    s, _ = re.subn(r"https://t\.me/[^\"']*ghoster[^\"']*", "data:,", s)
    write_text(path, s)
    changed.append("assets/subscribers-chat-DhUCw7lf.js")

    path = DEST / "assets" / "index-R8XrW70g.js"
    s = read_text(path)
    s = must_replace(s, "https://docs.ghoster.ai", "data:,", "docs URL")
    write_text(path, s)
    changed.append("assets/index-R8XrW70g.js")

    for name in ("index-C0j3hIpc.js", "index-Nql2swnJ.js"):
        path = DEST / "assets" / name
        s = read_text(path)
        s = must_replace(s, "https://ghoster.ai/logo.svg", "data:,", f"logo URL {name}")
        write_text(path, s)
        changed.append(f"assets/{name}")

    # ---------------------------------------------------------------- fonts
    path = DEST / "index.html"
    s = read_text(path)
    s = must_sub(
        s,
        r'<link[^>]*fonts\.googleapis\.com[^>]*>',
        "",
        "Google Fonts link",
    )
    write_text(path, s)
    changed.append("index.html")

    path = DEST / "assets" / "index-mit6QEVn.css"
    s = read_text(path)
    s = must_sub(
        s,
        r'@import"https://fonts\.googleapis\.com[^"]*";',
        "",
        "Google Fonts import",
    )
    write_text(path, s)
    changed.append("assets/index-mit6QEVn.css")

    # ---------------------------------------------------------------- verify
    forbidden_hosts = (
        "backend.ghoster.ai",
        "ws.ghoster.ai",
        "supabase.co",
        "sentry.io",
        "fonts.googleapis.com",
        "kroki.ghoster.ai",
        "ghosterai.vercel.app",
        "t.me/ghoster",
    )
    for path in DEST.rglob("*"):
        if not path.is_file():
            continue
        try:
            text = read_text(path)
        except Exception:
            continue
        for host in forbidden_hosts:
            if host in text:
                raise SystemExit(f"forbidden host {host} remains in {path.relative_to(DEST)}")

    manifest = []
    for rel in changed:
        path = DEST / rel
        data = path.read_bytes()
        manifest.append({
            "path": rel,
            "bytes": len(data),
            "sha256": hashlib.sha256(data).hexdigest(),
        })
    MANIFEST.parent.mkdir(parents=True, exist_ok=True)
    MANIFEST.write_text(json.dumps(manifest, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    print(f"sanitized {len(changed)} assets into {DEST}")
    print(f"wrote {MANIFEST}")


if __name__ == "__main__":
    main()
