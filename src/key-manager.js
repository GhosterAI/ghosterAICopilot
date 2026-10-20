/*
 * GhosterAI local API-key manager.
 *
 * This module replaces the former Sentry bundle (assets/index-DJXE-m4X.js).
 * It is a side-effect ES module: importing it installs the key UI.  It also
 * exports no-op Sentry lookalikes because the old entry module still calls
 * init()/withScope()/captureException() from the error boundaries.
 *
 * Keys live only in localStorage, in plain text.  Never log configuration.
 */

const STORAGE_KEY = "ghoster_api_keys_v1";
const DISMISS_KEY = "ghoster_keys_dismissed_v1";
const M = (id, name, api) => ({ id, name: name || id, api: api || id });

const PRESETS = [
  {
    id: "openai", name: "OpenAI", cat: "Популярные",
    url: "https://api.openai.com/v1/chat/completions",
    hint: "sk-...", docs: "https://platform.openai.com/api-keys",
    models: [M("gpt-4.1", "GPT-4.1"), M("gpt-4.1-mini", "GPT-4.1 mini"), M("o4-mini", "o4-mini"), M("gpt-4o", "GPT-4o"), M("gpt-4o-mini", "GPT-4o mini")]
  },
  {
    id: "google", name: "Google Gemini", cat: "Популярные", gemini: true,
    url: "", hint: "AIza...", docs: "https://aistudio.google.com/app/apikey",
    models: [M("gemini-3.1-flash-lite", "Gemini 3.1 Flash Lite"), M("gemini-2.5-flash", "Gemini 2.5 Flash"), M("gemini-2.5-pro", "Gemini 2.5 Pro")]
  },
  {
    id: "openrouter", name: "OpenRouter", cat: "Популярные",
    url: "https://openrouter.ai/api/v1/chat/completions",
    hint: "sk-or-v1-...", docs: "https://openrouter.ai/keys",
    models: [
      M("google/gemma-4-26b-a4b-it:free", "Gemma 4 26B (free)"),
      M("google/gemma-4-31b-it:free", "Gemma 4 31B (free)"),
      M("nvidia/nemotron-3.5-lightning:free", "Nemotron 3.5 Lightning (free)"),
      M("nvidia/nemotron-3-nano-omni-30b-a3b-reasoning:free", "Nemotron 3 Nano Omni (free)"),
      M("qwen/qwen3.8-27b:free", "Qwen 3.8 27B (free)"),
      M("dots-studio/dots-3-note-preview:free", "Dots3 Note (free)"),
      M("thinkingmachines/inkling:free", "Inkling (free)"),
      M("openrouter/free", "Free Models Router"),
      M("openai/gpt-4.1", "GPT-4.1 via OpenRouter"),
      M("anthropic/claude-sonnet-4", "Claude Sonnet 4 via OpenRouter"),
      M("deepseek/deepseek-chat-v3-0324", "DeepSeek V3 via OpenRouter"),
      M("google/gemini-2.5-pro", "Gemini 2.5 Pro via OpenRouter")
    ]
  },
  {
    id: "deepseek", name: "DeepSeek", cat: "Популярные",
    url: "https://api.deepseek.com/v1/chat/completions",
    hint: "sk-...", docs: "https://platform.deepseek.com/api_keys",
    models: [M("deepseek-4.1-flash", "DeepSeek 4.1 Flash", "deepseek-chat"), M("deepseek-chat", "DeepSeek Chat", "deepseek-chat"), M("deepseek-reasoner", "DeepSeek Reasoner", "deepseek-reasoner")]
  },
  {
    id: "groq", name: "Groq", cat: "Популярные",
    url: "https://api.groq.com/openai/v1/chat/completions",
    hint: "gsk_...", docs: "https://console.groq.com/keys",
    models: [M("llama-3.3-70b-versatile", "Llama 3.3 70B"), M("qwen-2.5-32b", "Qwen 2.5 32B"), M("whisper-large-v3-turbo", "Whisper Large v3 Turbo (STT)")]
  },
  {
    id: "elevenlabs", name: "ElevenLabs (TTS)", cat: "Провайдеры", tts: true,
    url: "https://api.elevenlabs.io/v1/text-to-speech", hint: "sk_...", docs: "https://elevenlabs.io/app/settings/api-keys",
    models: [M("eleven_multilingual_v2", "Eleven Multilingual v2")]
  },
  {
    id: "fish", name: "Fish Audio (TTS)", cat: "Провайдеры", tts: true,
    url: "https://api.fish.audio/v1/tts", hint: "...", docs: "https://fish.audio/",
    models: [M("fish-speech-1.5", "Fish Speech 1.5")]
  },
  {
    id: "mistral", name: "Mistral AI", cat: "Популярные",
    url: "https://api.mistral.ai/v1/chat/completions",
    hint: "...", docs: "https://console.mistral.ai/api-keys/",
    models: [M("mistral-large-latest", "Mistral Large"), M("mistral-small-latest", "Mistral Small"), M("codestral-latest", "Codestral")]
  },
  {
    id: "x-ai", name: "xAI (Grok)", cat: "Популярные",
    url: "https://api.x.ai/v1/chat/completions",
    hint: "xai-...", docs: "https://console.x.ai/",
    models: [M("grok-4", "Grok 4"), M("grok-3", "Grok 3"), M("grok-3-mini", "Grok 3 mini")]
  },
  {
    id: "together", name: "Together AI", cat: "Популярные",
    url: "https://api.together.xyz/v1/chat/completions",
    hint: "...", docs: "https://api.together.ai/settings/api-keys",
    models: [M("meta-llama/Llama-3.3-70B-Instruct-Turbo", "Llama 3.3 70B Turbo"), M("Qwen/Qwen2.5-72B-Instruct-Turbo", "Qwen 2.5 72B Turbo"), M("deepseek-ai/DeepSeek-V3", "DeepSeek V3")]
  },
  {
    id: "perplexity", name: "Perplexity", cat: "Популярные",
    url: "https://api.perplexity.ai/chat/completions",
    hint: "pplx-...", docs: "https://www.perplexity.ai/settings/api",
    models: [M("sonar-pro", "Sonar Pro"), M("sonar", "Sonar"), M("sonar-reasoning", "Sonar Reasoning")]
  },
  {
    id: "fireworks", name: "Fireworks AI", cat: "Провайдеры",
    url: "https://api.fireworks.ai/inference/v1/chat/completions",
    hint: "...", docs: "https://fireworks.ai/account/api-keys",
    models: [M("accounts/fireworks/models/llama-v3p3-70b-instruct", "Llama 3.3 70B"), M("accounts/fireworks/models/qwen3-235b-a22b", "Qwen3 235B A22B")]
  },
  {
    id: "cohere", name: "Cohere", cat: "Провайдеры",
    url: "https://api.cohere.ai/compatibility/v1/chat/completions",
    hint: "...", docs: "https://dashboard.cohere.com/api-keys",
    models: [M("command-r-plus", "Command R+"), M("command-r", "Command R")]
  },
  {
    id: "cerebras", name: "Cerebras", cat: "Провайдеры",
    url: "https://api.cerebras.ai/v1/chat/completions",
    hint: "csk-...", docs: "https://cloud.cerebras.ai/",
    models: [M("llama-3.3-70b", "Llama 3.3 70B"), M("qwen-3-32b", "Qwen 3 32B")]
  },
  {
    id: "sambanova", name: "SambaNova", cat: "Провайдеры",
    url: "https://api.sambanova.ai/v1/chat/completions",
    hint: "...", docs: "https://cloud.sambanova.ai/apis",
    models: [M("Meta-Llama-3.3-70B-Instruct", "Llama 3.3 70B"), M("DeepSeek-R1", "DeepSeek R1")]
  },
  {
    id: "nebius", name: "Nebius AI Studio", cat: "Провайдеры",
    url: "https://api.studio.nebius.ai/v1/chat/completions",
    hint: "...", docs: "https://studio.nebius.ai/",
    models: [M("meta-llama/Llama-3.3-70B-Instruct", "Llama 3.3 70B"), M("Qwen/Qwen2.5-72B-Instruct", "Qwen 2.5 72B")]
  },
  {
    id: "hyperbolic", name: "Hyperbolic", cat: "Провайдеры",
    url: "https://api.hyperbolic.xyz/v1/chat/completions",
    hint: "...", docs: "https://app.hyperbolic.xyz/settings",
    models: [M("meta-llama/Llama-3.3-70B-Instruct", "Llama 3.3 70B"), M("Qwen/Qwen2.5-72B-Instruct", "Qwen 2.5 72B")]
  },
  {
    id: "novita", name: "Novita AI", cat: "Провайдеры",
    url: "https://api.novita.ai/v3/openai/chat/completions",
    hint: "sk_...", docs: "https://novita.ai/settings/key-management",
    models: [M("meta-llama/llama-3.3-70b-instruct", "Llama 3.3 70B"), M("qwen/qwen-2.5-72b-instruct", "Qwen 2.5 72B")]
  },
  {
    id: "deepinfra", name: "DeepInfra", cat: "Провайдеры",
    url: "https://api.deepinfra.com/v1/openai/chat/completions",
    hint: "...", docs: "https://deepinfra.com/dash/api_keys",
    models: [M("meta-llama/Llama-3.3-70B-Instruct", "Llama 3.3 70B"), M("Qwen/Qwen2.5-72B-Instruct", "Qwen 2.5 72B")]
  },
  {
    id: "lambda", name: "Lambda", cat: "Провайдеры",
    url: "https://api.lambdalabs.com/v1/chat/completions",
    hint: "...", docs: "https://cloud.lambdalabs.com/api-keys",
    models: [M("llama3.3-70b-instruct-fp8", "Llama 3.3 70B FP8"), M("qwen25-72b-instruct", "Qwen 2.5 72B")]
  },
  {
    id: "moonshotai", name: "Moonshot Kimi", cat: "Провайдеры",
    url: "https://api.moonshot.ai/v1/chat/completions",
    hint: "sk-...", docs: "https://platform.moonshot.ai/console/api-keys",
    models: [M("moonshot-v1-128k", "Moonshot v1 128K"), M("kimi-k2-0711-preview", "Kimi K2 Preview")]
  },
  {
    id: "zhipu", name: "Zhipu GLM", cat: "Провайдеры",
    url: "https://open.bigmodel.cn/api/paas/v4/chat/completions",
    hint: "...", docs: "https://open.bigmodel.cn/usercenter/apikeys",
    models: [M("glm-4-plus", "GLM-4 Plus"), M("glm-4-flash", "GLM-4 Flash")]
  },
  {
    id: "dashscope", name: "Alibaba Qwen", cat: "Провайдеры",
    url: "https://dashscope.aliyuncs.com/compatible-mode/v1/chat/completions",
    hint: "sk-...", docs: "https://dashscope.console.aliyun.com/apiKey",
    models: [M("qwen-max", "Qwen Max"), M("qwen-plus", "Qwen Plus"), M("qwen-turbo", "Qwen Turbo")]
  },
  {
    id: "qianfan", name: "Baidu Qianfan", cat: "Провайдеры",
    url: "https://qianfan.baidubce.com/v2/chat/completions",
    hint: "bce-v3/...", docs: "https://console.bce.baidu.com/qianfan/ais/console/applicationConsole/application",
    models: [M("ernie-4.5-8k-preview", "ERNIE 4.5 8K"), M("ernie-speed-128k", "ERNIE Speed 128K")]
  },
  {
    id: "siliconflow", name: "SiliconFlow", cat: "Провайдеры",
    url: "https://api.siliconflow.cn/v1/chat/completions",
    hint: "sk-...", docs: "https://cloud.siliconflow.cn/account/ak",
    models: [M("deepseek-ai/DeepSeek-V3", "DeepSeek V3"), M("Qwen/Qwen2.5-72B-Instruct", "Qwen 2.5 72B")]
  },
  {
    id: "tokenharbor", name: "TokenHarbor", cat: "Провайдеры",
    url: "https://tokenharbor.ai/v1/chat/completions",
    hint: "thk_live_...", docs: "https://tokenharbor.ai/",
    models: [M("deepseek-v4.1-flash:free", "DeepSeek V4.1 Flash (free)"), M("mimo-v2.6-flash:free", "MiMo V2.6 Flash (free)")]
  },
  {
    id: "aishko", name: "AIshko", cat: "Провайдеры",
    url: "https://api.reformboss.com/v1/chat/completions",
    hint: "sk-...", docs: "https://reformboss.com/",
    models: [M("glm-5.3", "GLM 5.3"), M("glm-5.3-flash", "GLM 5.3 Flash"), M("glm-5.3-prime", "GLM 5.3 Prime"), M("deepseek-v4.1-flash", "DeepSeek V4.1 Flash"), M("deepseek-v4-flash", "DeepSeek V4 Flash"), M("kimi-k3", "Kimi K3"), M("kimi-k2.7-code", "Kimi K2.7 Code"), M("grok-chat-fast", "Grok Chat Fast"), M("grok-4.7", "Grok 4.7"), M("qwen3.8-flash", "Qwen 3.8 Flash"), M("qwen-plus", "Qwen Plus"), M("qwen-turbo", "Qwen Turbo"), M("deepseek-v4-pro", "DeepSeek V4 Pro"), M("qwen3-vl-plus", "Qwen3 VL Plus"), M("qwen3.8-omni-flash", "Qwen 3.8 Omni Flash")]
  },
  {
    id: "lunaroute", name: "LunaRoute", cat: "Провайдеры",
    url: "https://gw.lunaroute.com/v1/chat/completions",
    hint: "lr_...", docs: "https://lunaroute.com/",
    models: [M("deepseek-4.1-flash", "DeepSeek 4.1 Flash"), M("beam", "Beam"), M("lunaroute/glm-5.3", "GLM 5.3", "glm-5.3"), M("lunaroute/glm-5.3-flash", "GLM 5.3 Flash", "glm-5.3-flash"), M("glm-5.3-vision", "GLM 5.3 Vision"), M("muse-spark-open", "Muse Spark Open")]
  },
  {
    id: "dphn", name: "DPHN AI", cat: "Провайдеры", native: true,
    url: "https://lighthouse.dphn.ai/run/text-v/v1/chat/completions",
    hint: "dp-...", docs: "https://dphn.ai/",
    models: [M("deepseek-ai/DeepSeek-V4.1-Flash", "DeepSeek V4.1 Flash"), M("unsloth/Qwen3.8-27B-NVFP4", "Qwen 3.8 27B")]
  },
  {
    id: "ollama", name: "Ollama (локально)", cat: "Локальные", local: true,
    url: "http://127.0.0.1:11434/v1/chat/completions",
    hint: "", docs: "https://ollama.com/download",
    models: [M("llama3.2", "Llama 3.2"), M("qwen2.5-coder", "Qwen 2.5 Coder"), M("deepseek-r1", "DeepSeek R1")]
  },
  {
    id: "lmstudio", name: "LM Studio (локально)", cat: "Локальные", local: true,
    url: "http://127.0.0.1:1234/v1/chat/completions",
    hint: "", docs: "https://lmstudio.ai/",
    models: [M("local-model", "Локальная модель")]
  },
  {
    id: "vllm", name: "vLLM (локально)", cat: "Локальные", local: true,
    url: "http://127.0.0.1:8000/v1/chat/completions",
    hint: "", docs: "https://docs.vllm.ai/",
    models: [M("local-model", "Локальная модель")]
  },
  {
    id: "custom", name: "Свой OpenAI-совместимый", cat: "Свой", custom: true,
    url: "", hint: "Ключ вашего провайдера", docs: "",
    models: [M("my-model", "Моя модель")]
  }
];

const PRESET_BY_ID = Object.fromEntries(PRESETS.map(p => [p.id, p]));

function readRaw() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch (e) {
    return null;
  }
}

function writeRaw(cfg) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(cfg));
}

function makePresetProvider(p) {
  return {
    id: p.id,
    name: p.name,
    url: p.url || "",
    keys: [],
    models: (p.models || []).map(m => ({ id: m.id, name: m.name || m.id, api: m.api || m.id })),
    local: !!p.local,
    native: !!p.native,
    gemini: !!p.gemini,
    tts: !!p.tts,
    custom: !!p.custom,
    enabled: false
  };
}

function defaultConfig() {
  const providers = {};
  for (const p of PRESETS) providers[p.id] = makePresetProvider(p);
  return { v: 1, savedAt: "", defaultModel: "deepseek-4.1-flash", providers };
}

function normalizeModelList(raw) {
  const seen = new Set();
  const out = [];
  const parts = String(raw || "").split(/[\n,]+/);
  for (const part of parts) {
    const id = part.trim();
    if (!id || seen.has(id)) continue;
    seen.add(id);
    out.push({ id, name: id, api: id });
    if (out.length >= 50) break;
  }
  return out;
}

function normalizeUrl(raw) {
  let u = String(raw || "").trim();
  if (!u) return "";
  if (!/^https?:\/\//i.test(u)) return "";
  u = u.replace(/\/+$/, "");
  if (/\/chat\/completions$/i.test(u)) return u;
  if (/\/v1$/i.test(u)) return u + "/chat/completions";
  return u + "/chat/completions";
}

function mergeConfig(cfg) {
  if (!cfg || typeof cfg !== "object" || !cfg.providers || typeof cfg.providers !== "object") {
    cfg = defaultConfig();
  }
  for (const p of PRESETS) {
    const cur = cfg.providers[p.id];
    if (!cur) {
      cfg.providers[p.id] = makePresetProvider(p);
      continue;
    }
    if (typeof cur.name !== "string" || !cur.name) cur.name = p.name;
    if (typeof cur.url !== "string") cur.url = p.url || "";
    if (!Array.isArray(cur.keys)) cur.keys = [];
    if (p.custom) cur.local = !!cur.local;
    else cur.local = !!p.local;
    cur.native = !!p.native;
    cur.gemini = !!p.gemini;
    cur.tts = !!p.tts;
    cur.custom = !!p.custom;
    if (!Array.isArray(cur.models) || !cur.models.length) {
      cur.models = (p.models || []).map(m => ({ id: m.id, name: m.name || m.id, api: m.api || m.id }));
    } else {
      cur.models = cur.models.map(m => {
        if (typeof m === "string") return { id: m, name: m, api: m };
        return { id: String(m.id || m.name || ""), name: String(m.name || m.id || ""), api: String(m.api || m.id || m.name || "") };
      }).filter(m => m.id);
    }
  }
  for (const id of Object.keys(cfg.providers)) {
    const p = cfg.providers[id];
    if (!p || typeof p !== "object") continue;
    if (!Array.isArray(p.keys)) p.keys = [];
    p.keys = p.keys.filter(k => typeof k === "string" && k.trim()).map(k => k.trim());
    if (!Array.isArray(p.models)) p.models = [];
    p.enabled = p.keys.length > 0 || (!!p.local && p.enabled === true);
  }
  cfg.v = 1;
  return cfg;
}

function loadConfig() {
  let cfg = readRaw();
  const existed = !!cfg;
  cfg = mergeConfig(cfg);
  if (!existed) writeRaw(cfg);
  return cfg;
}

function configuredProviders(cfg) {
  return Object.values(cfg.providers).filter(p => p && p.enabled && p.models.length > 0);
}

function hasAnyProvider(cfg) {
  return configuredProviders(cfg).length > 0;
}

function chooseDefault(cfg) {
  const current = cfg.defaultModel;
  if (current) {
    for (const p of configuredProviders(cfg)) {
      if (!p.tts && p.models.some(m => m.id === current)) return current;
    }
  }
  for (const p of PRESETS) {
    if (p.tts) continue;
    const cur = cfg.providers[p.id];
    if (cur && cur.enabled && cur.models.length) return cur.models[0].id;
  }
  return "deepseek-4.1-flash";
}

function saveConfig(cfg) {
  cfg.defaultModel = chooseDefault(cfg);
  cfg.savedAt = new Date().toISOString();
  writeRaw(cfg);
  try {
    localStorage.removeItem(DISMISS_KEY);
    const raw = localStorage.getItem("chat-state-store");
    const store = raw ? JSON.parse(raw) : { state: {}, version: 0 };
    if (store && typeof store === "object") {
      if (!store.state || typeof store.state !== "object") store.state = {};
      store.state.model = cfg.defaultModel;
      localStorage.setItem("chat-state-store", JSON.stringify(store));
    }
    if (window.__GHOSTER_KEY_STORE && window.__GHOSTER_KEY_STORE.reload) window.__GHOSTER_KEY_STORE.reload();
  } catch (e) {}
}

function esc(s) {
  return String(s == null ? "" : s).replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
}

function isMainWindow() {
  try {
    const label = window.__TAURI_INTERNALS__ && window.__TAURI_INTERNALS__.metadata
      && window.__TAURI_INTERNALS__.metadata.currentWindow
      && window.__TAURI_INTERNALS__.metadata.currentWindow.label;
    if (!label) return true;
    const s = String(label).toLowerCase();
    if (/(overlay|teleprompter|cursor|disguise|meeting|sound|settings-window)/.test(s)) return false;
    return true;
  } catch (e) {
    return true;
  }
}

const CSS = `
#ghoster-keys-root{--gk-bg:#111113;--gk-panel:#1a1a1e;--gk-panel2:#202026;--gk-text:#f4f4f5;--gk-muted:#a1a1aa;--gk-border:#303038;--gk-accent:var(--brand,#f97316);--gk-accent-text:#111;--gk-danger:#f87171;--gk-ok:#4ade80;--gk-warn-bg:#2a2110;--gk-warn-border:#7c5a17;--gk-warn-text:#fde68a;position:fixed;inset:0;z-index:2147483600;pointer-events:none;font-family:Inter,"Segoe UI",system-ui,-apple-system,sans-serif;color:var(--gk-text)}
html.light #ghoster-keys-root{--gk-bg:#f4f4f5;--gk-panel:#fff;--gk-panel2:#f4f4f5;--gk-text:#18181b;--gk-muted:#52525b;--gk-border:#e4e4e7;--gk-warn-bg:#fffbeb;--gk-warn-border:#f59e0b;--gk-warn-text:#78350f}
#ghoster-keys-root *{box-sizing:border-box}
#ghoster-keys-root button,#ghoster-keys-root input,#ghoster-keys-root textarea{font:inherit}
#ghoster-keys-fab{pointer-events:auto;position:fixed;right:16px;bottom:16px;display:inline-flex;align-items:center;gap:8px;min-height:44px;padding:0 14px;border:1px solid color-mix(in srgb,var(--gk-accent) 70%,#000 30%);border-radius:999px;background:var(--gk-accent);color:var(--gk-accent-text);font-weight:700;font-size:13px;letter-spacing:.01em;cursor:pointer;box-shadow:0 8px 24px rgba(0,0,0,.28);transition:transform .15s ease,filter .15s ease}
#ghoster-keys-fab:hover{filter:brightness(1.06);transform:translateY(-1px)}
#ghoster-keys-fab:active{transform:translateY(0)}
#ghoster-keys-fab svg{width:16px;height:16px}
#ghoster-keys-root :is(button,input,textarea,a):focus-visible{outline:2px solid var(--gk-accent);outline-offset:2px}
#ghoster-keys-banner{pointer-events:auto;position:fixed;left:50%;top:12px;transform:translateX(-50%);z-index:2147483500;display:none;align-items:center;gap:10px;max-width:min(92vw,720px);padding:10px 12px;border:1px solid var(--gk-warn-border);border-radius:12px;background:var(--gk-warn-bg);color:var(--gk-warn-text);font-size:13px;box-shadow:0 8px 24px rgba(0,0,0,.22)}
#ghoster-keys-banner.gk-show{display:flex}
#ghoster-keys-banner button{min-height:36px;padding:0 12px;border:1px solid color-mix(in srgb,var(--gk-warn-border) 65%,#000 35%);border-radius:8px;background:transparent;color:inherit;font-weight:700;cursor:pointer}
#ghoster-keys-banner .gk-banner-close{min-width:36px;padding:0;border-color:transparent}
.gk-backdrop{pointer-events:auto;position:fixed;inset:0;display:none;align-items:center;justify-content:center;padding:16px;background:rgba(0,0,0,.62);backdrop-filter:blur(4px)}
.gk-backdrop.gk-open{display:flex}
.gk-modal{width:min(900px,100%);max-height:min(88vh,820px);display:flex;flex-direction:column;background:var(--gk-panel);border:1px solid var(--gk-border);border-radius:18px;box-shadow:0 24px 80px rgba(0,0,0,.55);overflow:hidden}
.gk-head{display:flex;align-items:flex-start;justify-content:space-between;gap:14px;padding:18px 20px 14px;border-bottom:1px solid var(--gk-border)}
.gk-title{margin:0;font-size:19px;line-height:1.25;font-weight:800;letter-spacing:-.01em}
.gk-sub{margin:4px 0 0;color:var(--gk-muted);font-size:13px;line-height:1.45}
.gk-close{flex:0 0 auto;width:44px;height:44px;display:grid;place-items:center;border:1px solid var(--gk-border);border-radius:10px;background:var(--gk-panel2);color:var(--gk-text);cursor:pointer}
.gk-close svg{width:18px;height:18px}
.gk-body{padding:14px 20px 18px;overflow:auto;overscroll-behavior:contain}
.gk-warning{display:flex;gap:10px;align-items:flex-start;margin:0 0 14px;padding:12px 13px;border:1px solid var(--gk-warn-border);border-radius:12px;background:var(--gk-warn-bg);color:var(--gk-warn-text);font-size:12.5px;line-height:1.5}
.gk-warning svg{flex:0 0 auto;width:18px;height:18px;margin-top:1px}
.gk-toolbar{display:flex;gap:10px;align-items:center;flex-wrap:wrap;margin:0 0 12px}
.gk-search{flex:1 1 220px;min-height:44px;padding:0 12px;border:1px solid var(--gk-border);border-radius:10px;background:var(--gk-panel2);color:var(--gk-text)}
.gk-search::placeholder{color:var(--gk-muted)}
.gk-tabs{display:flex;gap:6px;flex-wrap:wrap}
.gk-tab{min-height:44px;padding:0 12px;border:1px solid var(--gk-border);border-radius:999px;background:transparent;color:var(--gk-muted);font-size:12.5px;font-weight:700;cursor:pointer}
.gk-tab.gk-active{background:var(--gk-accent);border-color:var(--gk-accent);color:var(--gk-accent-text)}
.gk-list{display:flex;flex-direction:column;gap:8px}
.gk-provider{border:1px solid var(--gk-border);border-radius:12px;background:var(--gk-panel2);overflow:hidden}
.gk-provider.gk-hidden{display:none}
.gk-provider-head{width:100%;min-height:52px;display:flex;align-items:center;gap:10px;padding:8px 12px;border:0;background:transparent;color:var(--gk-text);text-align:left;cursor:pointer}
.gk-dot{flex:0 0 auto;width:9px;height:9px;border-radius:50%;background:var(--gk-muted)}
.gk-dot.gk-on{background:var(--gk-ok);box-shadow:0 0 0 4px color-mix(in srgb,var(--gk-ok) 14%,transparent)}
.gk-name{flex:1 1 auto;font-size:13.5px;font-weight:750}
.gk-badge{flex:0 0 auto;padding:3px 8px;border:1px solid var(--gk-border);border-radius:999px;color:var(--gk-muted);font-size:11px;font-weight:700;white-space:nowrap}
.gk-badge.gk-on{color:var(--gk-ok);border-color:color-mix(in srgb,var(--gk-ok) 45%,var(--gk-border))}
.gk-chev{flex:0 0 auto;width:16px;height:16px;color:var(--gk-muted);transition:transform .15s ease}
.gk-provider-head[aria-expanded="true"] .gk-chev{transform:rotate(180deg)}
.gk-provider-body{padding:0 12px 12px;border-top:1px solid var(--gk-border)}
.gk-desc{margin:10px 0 8px;color:var(--gk-muted);font-size:12.5px;line-height:1.5}
.gk-models{display:flex;flex-wrap:wrap;gap:6px;margin:8px 0 10px}
.gk-chip{max-width:100%;padding:4px 8px;border:1px solid var(--gk-border);border-radius:6px;color:var(--gk-muted);font-size:11.5px;line-height:1.3;overflow-wrap:anywhere}
.gk-keys{display:flex;flex-direction:column;gap:8px;margin:8px 0}
.gk-key-row{display:flex;gap:8px;align-items:center}
.gk-key-row input{flex:1 1 auto;min-width:0;min-height:44px;padding:0 11px;border:1px solid var(--gk-border);border-radius:9px;background:var(--gk-panel);color:var(--gk-text)}
.gk-key-row input::placeholder{color:var(--gk-muted)}
.gk-mini{flex:0 0 auto;min-height:44px;padding:0 10px;border:1px solid var(--gk-border);border-radius:9px;background:transparent;color:var(--gk-muted);font-size:12px;cursor:pointer}
.gk-mini:hover{color:var(--gk-text)}
.gk-add{min-height:44px;padding:0 12px;border:1px dashed var(--gk-border);border-radius:9px;background:transparent;color:var(--gk-text);font-size:12.5px;font-weight:700;cursor:pointer}
.gk-add:hover{border-color:var(--gk-accent);color:var(--gk-accent)}
.gk-custom{display:grid;gap:8px;margin:10px 0}
.gk-custom label{display:grid;gap:5px;color:var(--gk-muted);font-size:12px;font-weight:700}
.gk-custom input[type=text],.gk-custom input[type=url],.gk-custom textarea{width:100%;min-height:44px;padding:9px 11px;border:1px solid var(--gk-border);border-radius:9px;background:var(--gk-panel);color:var(--gk-text)}
.gk-custom textarea{min-height:74px;resize:vertical}
.gk-check{display:flex!important;grid-template-columns:auto 1fr;align-items:center;gap:8px;color:var(--gk-text)!important;font-weight:600!important}
.gk-check input{width:18px;height:18px;accent-color:var(--gk-accent)}
.gk-docs{display:inline-flex;align-items:center;min-height:36px;margin-top:4px;color:var(--gk-accent);font-size:12px;font-weight:700;text-decoration:none}
.gk-docs:hover{text-decoration:underline}
.gk-note{margin:8px 0 0;color:var(--gk-muted);font-size:12px;line-height:1.45}
.gk-foot{display:flex;gap:10px;align-items:center;flex-wrap:wrap;justify-content:space-between;padding:14px 20px;border-top:1px solid var(--gk-border);background:var(--gk-panel)}
.gk-foot-left{flex:1 1 260px;min-width:0}
.gk-status{margin:0;color:var(--gk-muted);font-size:12px;line-height:1.4}
.gk-status.gk-error{color:var(--gk-danger)}
.gk-actions{display:flex;gap:8px;flex-wrap:wrap;justify-content:flex-end}
.gk-btn{min-height:44px;padding:0 15px;border:1px solid var(--gk-border);border-radius:10px;background:transparent;color:var(--gk-text);font-weight:750;font-size:13px;cursor:pointer}
.gk-btn:hover{border-color:var(--gk-muted)}
.gk-btn-primary{border-color:var(--gk-accent);background:var(--gk-accent);color:var(--gk-accent-text)}
.gk-btn-primary:hover{filter:brightness(1.06)}
.gk-btn:disabled{opacity:.55;cursor:not-allowed}
.gk-empty{padding:18px;border:1px dashed var(--gk-border);border-radius:12px;color:var(--gk-muted);text-align:center;font-size:13px}
@media (max-width:640px){
  .gk-backdrop{padding:0}
  .gk-modal{width:100%;max-height:100vh;height:100vh;border-radius:0;border:0}
  .gk-head,.gk-body,.gk-foot{padding-left:14px;padding-right:14px}
  .gk-key-row{flex-wrap:wrap}
  .gk-key-row input{flex:1 1 100%}
  .gk-foot{align-items:stretch}
  .gk-actions{width:100%}
  .gk-actions .gk-btn{flex:1 1 auto}
}
@media (prefers-reduced-motion:reduce){
  #ghoster-keys-root *{transition:none!important}
}
`;

const ICONS = {
  key: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="7.5" cy="15.5" r="4.5"/><path d="M11 12 21 2"/><path d="M16 7l2 2"/><path d="M18 5l2 2"/></svg>',
  close: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true"><path d="M18 6 6 18M6 6l12 12"/></svg>',
  chev: '<svg class="gk-chev" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="m6 9 6 6 6-6"/></svg>',
  warn: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M10.3 3.6 1.8 18a2 2 0 0 0 1.7 3h17a2 2 0 0 0 1.7-3L13.7 3.6a2 2 0 0 0-3.4 0Z"/><path d="M12 9v4"/><path d="M12 17h.01"/></svg>',
  plus: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true"><path d="M12 5v14M5 12h14"/></svg>'
};

let booted = false;
let modalOpen = false;
let wizardMode = false;
let cfg = null;
let lastFocus = null;
let filter = "Популярные";
let query = "";

function providerConfigured(p) {
  return !!p && ((Array.isArray(p.keys) && p.keys.some(k => k && k.trim())) || (p.local && p.enabled));
}

function statusText(p) {
  if (p.local && !p.enabled) return "Выключен";
  if (p.local) return "Локальный";
  const n = (p.keys || []).filter(k => k && k.trim()).length;
  return n ? (n > 1 ? n + " ключа" : "Настроен") : "Нет ключа";
}

function providerDesc(p) {
  if (p.custom) return "Свой OpenAI-совместимый endpoint. Укажите полный URL до /chat/completions и ID моделей через запятую.";
  if (p.gemini) return "Ключ Google AI Studio. Используется нативным Gemini-клиентом приложения; URL указывать не нужно.";
  if (p.local) return "Локальный сервер не требует ключа. Включите его ниже и запустите до начала работы. Если сервер требует ключ, добавьте его.";
  if (p.id === "groq") return "Groq используется также для распознавания речи Whisper. Ключ подходит для чата и STT.";
  if (p.id === "openrouter") return "Один ключ OpenRouter даёт доступ к бесплатным и платным моделям разных вендоров.";
  return "Ключ хранится только на этом компьютере. Можно добавить несколько ключей — приложение будет ротировать их при ошибках.";
}

function cardHtml(p) {
  const configured = providerConfigured(p);
  const bodyId = "gk-body-" + p.id;
  const models = (p.models || []).map(m => '<span class="gk-chip">' + esc(m.name || m.id) + "</span>").join("");
  const custom = p.custom ? `
    <div class="gk-custom">
      <label>Название<input type="text" data-gk-custom-name maxlength="80" value="${esc(p.name)}" autocomplete="off"></label>
      <label>URL до /chat/completions<input type="url" data-gk-custom-url placeholder="https://api.example.com/v1/chat/completions" value="${esc(p.url)}" autocomplete="off" spellcheck="false"></label>
      <label>ID моделей через запятую<textarea data-gk-custom-models placeholder="my-model, my-model-mini" spellcheck="false">${esc((p.models || []).map(m => m.id).join(", "))}</textarea></label>
      <label class="gk-check"><input type="checkbox" data-gk-custom-local ${p.local ? "checked" : ""}> Локальный сервер без ключа</label>
    </div>` : (p.local ? `<label class="gk-check"><input type="checkbox" data-gk-local ${p.enabled ? "checked" : ""}> Использовать этот локальный сервер</label>` : "");
  return `
    <div class="gk-provider" data-provider="${esc(p.id)}" data-cat="${esc(PRESET_BY_ID[p.id] ? PRESET_BY_ID[p.id].cat : (p.custom ? "Свой" : "Провайдеры"))}">
      <button type="button" class="gk-provider-head" aria-expanded="false" aria-controls="${bodyId}">
        <span class="gk-dot${configured ? " gk-on" : ""}" aria-hidden="true"></span>
        <span class="gk-name">${esc(p.name)}</span>
        <span class="gk-badge${configured ? " gk-on" : ""}">${esc(statusText(p))}</span>
        ${ICONS.chev}
      </button>
      <div class="gk-provider-body" id="${bodyId}" hidden>
        <p class="gk-desc">${esc(providerDesc(p))}</p>
        ${custom}
        <div class="gk-models" aria-label="Модели">${models}</div>
        <div class="gk-keys"></div>
        <button type="button" class="gk-add" data-gk-add>${ICONS.plus} Добавить ключ</button>
        <p class="gk-note">${p.local ? "Ключ не обязателен. " : ""}${p.id === "google" ? "Формат ключа: AIza…" : ""}</p>
        ${p.docs ? `<a class="gk-docs" href="${esc(p.docs)}" target="_blank" rel="noreferrer noopener">Где получить ключ</a>` : ""}
      </div>
    </div>`;
}

function keyRow(value, providerId) {
  const row = document.createElement("div");
  row.className = "gk-key-row";
  const input = document.createElement("input");
  input.type = "password";
  input.autocomplete = "off";
  input.spellcheck = false;
  input.placeholder = (PRESET_BY_ID[providerId] && PRESET_BY_ID[providerId].hint) || "API key";
  input.setAttribute("aria-label", "API-ключ " + (cfg.providers[providerId] ? cfg.providers[providerId].name : providerId));
  input.value = value || "";
  const toggle = document.createElement("button");
  toggle.type = "button";
  toggle.className = "gk-mini";
  toggle.textContent = "Показать";
  toggle.addEventListener("click", () => {
    const show = input.type === "password";
    input.type = show ? "text" : "password";
    toggle.textContent = show ? "Скрыть" : "Показать";
  });
  const remove = document.createElement("button");
  remove.type = "button";
  remove.className = "gk-mini";
  remove.textContent = "Удалить";
  remove.setAttribute("aria-label", "Удалить ключ");
  remove.addEventListener("click", () => {
    const parent = row.parentElement;
    row.remove();
    if (parent && !parent.querySelector(".gk-key-row")) parent.appendChild(keyRow("", providerId));
  });
  row.append(input, toggle, remove);
  return row;
}

function populateKeys(card, p) {
  const box = card.querySelector(".gk-keys");
  if (!box) return;
  box.textContent = "";
  const keys = (p.keys || []).filter(k => k && k.trim());
  if (keys.length) {
    for (const k of keys) box.appendChild(keyRow(k, p.id));
  } else {
    box.appendChild(keyRow("", p.id));
  }
}

function renderList() {
  const list = document.getElementById("gk-list");
  if (!list) return;
  list.textContent = "";
  for (const p of Object.values(cfg.providers)) {
    const wrap = document.createElement("div");
    wrap.innerHTML = cardHtml(p);
    const card = wrap.firstElementChild;
    list.appendChild(card);
    populateKeys(card, p);
    const head = card.querySelector(".gk-provider-head");
    const body = card.querySelector(".gk-provider-body");
    if (head && body) {
      head.addEventListener("click", () => {
        const open = head.getAttribute("aria-expanded") === "true";
        head.setAttribute("aria-expanded", String(!open));
        body.hidden = open;
      });
    }
    const add = card.querySelector("[data-gk-add]");
    if (add) {
      add.addEventListener("click", () => {
        const box = card.querySelector(".gk-keys");
        const row = keyRow("", p.id);
        box.appendChild(row);
        const input = row.querySelector("input");
        if (input) input.focus();
      });
    }
  }
  applyFilter();
  updateFooter();
}

function applyFilter() {
  const list = document.getElementById("gk-list");
  if (!list) return;
  const q = query.trim().toLowerCase();
  let visible = 0;
  for (const card of list.querySelectorAll(".gk-provider")) {
    const cat = card.getAttribute("data-cat") || "";
    const id = card.getAttribute("data-provider") || "";
    const p = cfg.providers[id];
    const text = ((p && p.name) || "") + " " + ((p && p.models || []).map(m => (m.name + " " + m.id)).join(" ")) + " " + id;
    const catOk = filter === "Все" || cat === filter || (filter === "Свой" && p && p.custom);
    const qOk = !q || text.toLowerCase().includes(q);
    const show = catOk && qOk;
    card.classList.toggle("gk-hidden", !show);
    if (show) visible++;
  }
  let empty = list.querySelector(".gk-empty");
  if (!visible) {
    if (!empty) {
      empty = document.createElement("div");
      empty.className = "gk-empty";
      empty.textContent = "Ничего не найдено. Измените фильтр или поисковый запрос.";
      list.appendChild(empty);
    }
  } else if (empty) {
    empty.remove();
  }
}

function setStatus(text, error) {
  const el = document.getElementById("gk-status");
  if (!el) return;
  el.textContent = text || "";
  el.classList.toggle("gk-error", !!error);
}

function collect() {
  const next = mergeConfig(JSON.parse(JSON.stringify(cfg)));
  const list = document.getElementById("gk-list");
  if (!list) return next;
  for (const card of list.querySelectorAll(".gk-provider")) {
    const id = card.getAttribute("data-provider");
    const p = next.providers[id];
    if (!p) continue;
    const inputs = Array.from(card.querySelectorAll(".gk-keys .gk-key-row input"));
    p.keys = inputs.map(i => String(i.value || "").trim()).filter(Boolean);
    if (p.custom) {
      const name = card.querySelector("[data-gk-custom-name]");
      const url = card.querySelector("[data-gk-custom-url]");
      const models = card.querySelector("[data-gk-custom-models]");
      const local = card.querySelector("[data-gk-custom-local]");
      p.name = (name && name.value.trim()) || "Свой провайдер";
      p.url = normalizeUrl(url && url.value);
      p.models = normalizeModelList(models && models.value);
      p.local = !!(local && local.checked);
      p.enabled = p.keys.length > 0 || p.local;
    } else if (p.local) {
      const local = card.querySelector("[data-gk-local]");
      p.enabled = p.keys.length > 0 || !!(local && local.checked);
    } else {
      p.enabled = p.keys.length > 0;
    }
  }
  return next;
}

function validate(next) {
  if (!hasAnyProvider(next)) return "Добавьте хотя бы один API-ключ или выберите локальный провайдер.";
  for (const p of Object.values(next.providers)) {
    if (!p.custom || (!p.keys.length && !p.local)) continue;
    if (!p.url) return "Для своего провайдера укажите полный URL до /chat/completions.";
    if (!p.models.length) return "Для своего провайдера укажите хотя бы один ID модели.";
  }
  return "";
}

function updateFooter() {
  const btn = document.getElementById("gk-save");
  if (!btn) return;
  const next = collect();
  const err = validate(next);
  btn.disabled = !!err;
  if (err && !document.getElementById("gk-status").textContent) setStatus(err, true);
  if (!err) setStatus("", false);
}

function openModal(wizard) {
  if (modalOpen) return;
  modalOpen = true;
  wizardMode = !!wizard;
  lastFocus = document.activeElement;
  const backdrop = document.getElementById("gk-backdrop");
  const title = document.getElementById("gk-title");
  const sub = document.getElementById("gk-sub");
  if (title) title.textContent = wizard ? "Настройка API-ключей" : "API-ключи";
  if (sub) sub.textContent = wizard
    ? "Добавьте ключи хотя бы одного провайдера. Без них приложение не сможет отвечать на вопросы."
    : "Ключи хранятся только в этом профиле. Изменения применяются после перезапуска окна.";
  setStatus("", false);
  backdrop.classList.add("gk-open");
  backdrop.setAttribute("aria-hidden", "false");
  document.getElementById("ghoster-keys-fab").setAttribute("aria-expanded", "true");
  renderList();
  setTimeout(() => {
    const first = backdrop.querySelector(".gk-provider-body:not([hidden]) input, .gk-search, .gk-provider-head");
    if (first) first.focus();
  }, 30);
}

function closeModal() {
  if (!modalOpen) return;
  modalOpen = false;
  const backdrop = document.getElementById("gk-backdrop");
  backdrop.classList.remove("gk-open");
  backdrop.setAttribute("aria-hidden", "true");
  const fab = document.getElementById("ghoster-keys-fab");
  if (fab) fab.setAttribute("aria-expanded", "false");
  if (lastFocus && lastFocus.focus) lastFocus.focus();
}

function saveAndReload() {
  const next = collect();
  const err = validate(next);
  if (err) {
    setStatus(err, true);
    return;
  }
  try {
    saveConfig(next);
    cfg = next;
    setStatus("Сохранено. Перезапуск…", false);
    const btn = document.getElementById("gk-save");
    if (btn) btn.disabled = true;
    setTimeout(() => {
      try { location.reload(); } catch (e) { window.location.href = window.location.href; }
    }, 450);
  } catch (e) {
    setStatus("Не удалось сохранить ключи: localStorage недоступен или переполнен.", true);
  }
}

function dismissWizard() {
  try { localStorage.setItem(DISMISS_KEY, "1"); } catch (e) {}
  closeModal();
  updateBanner();
}

function updateBanner() {
  const banner = document.getElementById("ghoster-keys-banner");
  if (!banner) return;
  const needed = !hasAnyProvider(cfg);
  banner.classList.toggle("gk-show", needed);
}

function buildUI() {
  if (document.getElementById("ghoster-keys-root")) return;
  const root = document.createElement("div");
  root.id = "ghoster-keys-root";
  const style = document.createElement("style");
  style.textContent = CSS;
  root.appendChild(style);

  const banner = document.createElement("div");
  banner.id = "ghoster-keys-banner";
  banner.setAttribute("role", "status");
  banner.innerHTML = '<span>API-ключи не настроены — приложение не сможет отвечать.</span><button type="button" id="gk-banner-open">Настроить</button><button type="button" class="gk-banner-close" id="gk-banner-close" aria-label="Скрыть">×</button>';
  root.appendChild(banner);

  const fab = document.createElement("button");
  fab.id = "ghoster-keys-fab";
  fab.type = "button";
  fab.setAttribute("aria-haspopup", "dialog");
  fab.setAttribute("aria-expanded", "false");
  fab.setAttribute("aria-label", "Настроить API-ключи");
  fab.innerHTML = ICONS.key + "<span>API</span>";
  root.appendChild(fab);

  const backdrop = document.createElement("div");
  backdrop.id = "gk-backdrop";
  backdrop.className = "gk-backdrop";
  backdrop.setAttribute("aria-hidden", "true");
  backdrop.innerHTML = `
    <div class="gk-modal" role="dialog" aria-modal="true" aria-labelledby="gk-title">
      <div class="gk-head">
        <div>
          <h2 class="gk-title" id="gk-title">API-ключи</h2>
          <p class="gk-sub" id="gk-sub"></p>
        </div>
        <button type="button" class="gk-close" id="gk-close" aria-label="Закрыть">${ICONS.close}</button>
      </div>
      <div class="gk-body">
        <div class="gk-warning" role="note">${ICONS.warn}<div><strong>Ключи не шифруются.</strong> Они лежат в localStorage профиля в открытом виде. Любой, у кого есть доступ к компьютеру или папке профиля, может их прочитать. Используйте отдельный профиль Windows, не используйте общий ПК и отзывайте ключи у провайдера, если они могли утечь.</div></div>
        <div class="gk-toolbar">
          <input class="gk-search" id="gk-search" type="search" placeholder="Поиск провайдера или модели" aria-label="Поиск провайдера или модели">
          <div class="gk-tabs" role="tablist" aria-label="Категории провайдеров">
            <button type="button" class="gk-tab" data-filter="Все" role="tab">Все</button>
            <button type="button" class="gk-tab gk-active" data-filter="Популярные" role="tab" aria-selected="true">Популярные</button>
            <button type="button" class="gk-tab" data-filter="Провайдеры" role="tab">Провайдеры</button>
            <button type="button" class="gk-tab" data-filter="Локальные" role="tab">Локальные</button>
            <button type="button" class="gk-tab" data-filter="Свой" role="tab">Свой</button>
          </div>
        </div>
        <div class="gk-list" id="gk-list"></div>
      </div>
      <div class="gk-foot">
        <div class="gk-foot-left"><p class="gk-status" id="gk-status"></p></div>
        <div class="gk-actions">
          <button type="button" class="gk-btn" id="gk-later">Позже</button>
          <button type="button" class="gk-btn gk-btn-primary" id="gk-save">Сохранить и перезапустить</button>
        </div>
      </div>
    </div>`;
  root.appendChild(backdrop);
  document.body.appendChild(root);

  fab.addEventListener("click", () => openModal(false));
  document.getElementById("gk-close").addEventListener("click", () => { if (wizardMode) dismissWizard(); else closeModal(); });
  document.getElementById("gk-later").addEventListener("click", dismissWizard);
  document.getElementById("gk-save").addEventListener("click", saveAndReload);
  document.getElementById("gk-banner-open").addEventListener("click", () => openModal(true));
  document.getElementById("gk-banner-close").addEventListener("click", () => banner.classList.remove("gk-show"));
  backdrop.addEventListener("mousedown", e => {
    if (e.target === backdrop) { if (wizardMode) dismissWizard(); else closeModal(); }
  });
  document.getElementById("gk-search").addEventListener("input", e => {
    query = e.target.value || "";
    applyFilter();
  });
  for (const tab of root.querySelectorAll(".gk-tab")) {
    tab.addEventListener("click", () => {
      filter = tab.getAttribute("data-filter") || "Все";
      for (const t of root.querySelectorAll(".gk-tab")) {
        const on = t === tab;
        t.classList.toggle("gk-active", on);
        t.setAttribute("aria-selected", String(on));
      }
      applyFilter();
    });
  }
  root.addEventListener("keydown", e => {
    if (e.key === "Escape" && modalOpen) {
      e.preventDefault();
      if (wizardMode) dismissWizard(); else closeModal();
    }
    if (e.key === "Tab" && modalOpen) {
      const focusables = Array.from(backdrop.querySelectorAll("button:not([disabled]), input:not([disabled]), textarea:not([disabled]), a[href]"))
        .filter(el => el.offsetParent !== null);
      if (!focusables.length) return;
      const first = focusables[0];
      const last = focusables[focusables.length - 1];
      if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
      else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
    }
  });
  // Re-validate as the user edits custom fields / keys.
  root.addEventListener("input", () => { if (modalOpen) updateFooter(); });
  root.addEventListener("change", () => { if (modalOpen) updateFooter(); });
}

/**
 * The original chat pipeline keeps messages only in the in-memory
 * Zustand store and posts them to the cloud API.  This build has no cloud,
 * so mirror the active subchat into localStorage.  The store is exposed by
 * the sanitizer as window.__GHOSTER_CHAT_STORE.
 */
function bootChatPersistence() {
  if (typeof window === "undefined" || window.__ghosterChatPersistenceStarted) return;
  window.__ghosterChatPersistenceStarted = true;
  const KEY = "ghoster_messages";
  const flush = () => {
    const store = window.__GHOSTER_CHAT_STORE;
    if (!store || typeof store.getState !== "function") return;
    const current = store.getState().messages;
    if (!Array.isArray(current) || !current.length) return;
    let saved = [];
    try {
      saved = JSON.parse(localStorage.getItem(KEY) || "[]");
    } catch (e) {
      saved = [];
    }
    if (!Array.isArray(saved)) saved = [];
    const scopes = new Map();
    for (const m of current) {
      if (!m || !m.id || !m.meetingId || !m.subchatId) continue;
      const key = `${m.meetingId}\u0000${m.subchatId}`;
      if (!scopes.has(key)) scopes.set(key, []);
      scopes.get(key).push(m);
    }
    if (!scopes.size) return;
    for (const [key, list] of scopes) {
      const [meetingId, subchatId] = key.split("\u0000");
      let keep = list;
      for (let i = list.length - 1; i >= 0; i--) {
        if (list[i] && list[i].from === "clear_context") {
          keep = list.slice(i);
          break;
        }
      }
      saved = saved.filter(m => !(m && m.meetingId === meetingId && m.subchatId === subchatId));
      saved.push(...keep.map(m => ({ ...m })));
    }
    saved.sort((a, b) => String((a && a.createdAt) || "").localeCompare(String((b && b.createdAt) || "")));
    const next = JSON.stringify(saved);
    if (localStorage.getItem(KEY) !== next) localStorage.setItem(KEY, next);
  };
  const start = () => {
    if (window.__ghosterChatPersistenceTimer) return;
    window.__ghosterChatPersistenceTimer = setInterval(flush, 700);
    window.addEventListener("beforeunload", flush);
  };
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", start, { once: true });
  else start();
}

function boot() {
  if (booted) return;
  booted = true;
  if (!isMainWindow()) return;
  try {
    cfg = loadConfig();
  } catch (e) {
    return;
  }
  const start = () => {
    buildUI();
    updateBanner();
    const dismissed = (() => { try { return localStorage.getItem(DISMISS_KEY) === "1"; } catch (e) { return false; } })();
    if (!hasAnyProvider(cfg) && !dismissed) {
      setTimeout(() => openModal(true), 250);
    }
  };
  if (document.body) start();
  else document.addEventListener("DOMContentLoaded", start, { once: true });
}

export function init() { boot(); }
export function withScope() { return { setTag() { return this; }, setExtra() { return this; }, captureException() { return this; } }; }
export function captureException() {}
export function addBreadcrumb() {}
export function setUser() {}
export function setTag() {}
export function setExtra() {}

boot();
bootChatPersistence();
