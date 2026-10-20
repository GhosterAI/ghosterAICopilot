# API-ключи GhosterAI

В этой сборке **нет встроенных ключей**. Приложение не просит аккаунт Ghoster и
не отправляет ключи на серверы Ghoster. Ключ уходит только тому провайдеру,
которого вы выбрали, напрямую с вашего компьютера.

## Где хранятся ключи

Ключи лежат в `localStorage` профиля WebView2 в открытом виде:

```
%LOCALAPPDATA%\com.pers0na2.identityproxy\EBWebView\Default\Local Storage
```

Это сделано для простоты локальной сборки. Шифрования нет. Любой, у кого есть
доступ к вашему профилю Windows, может прочитать ключи. Поэтому:

- используйте отдельный профиль Windows для работы с ключами;
- не запускайте приложение на общем или чужом компьютере;
- отзывайте ключ в кабинете провайдера, если он мог утечь;
- не делайте скриншоты окна с ключами.

Предупреждение о незашифрованном хранении всегда показывается в окне
**API-ключи**.

## Как добавить ключ

1. Нажмите **API** в правом нижнем углу.
2. Найдите провайдера через поиск или выберите категорию.
3. Вставьте ключ в поле. Можно добавить несколько ключей одному провайдеру:
   они проверяются по порядку.
4. Для локального сервера включите **«использовать локальный сервер»**.
5. Нажмите **Сохранить и перезапустить**.

После перезапуска выберите модель в селекторе встречи. Для своего
OpenAI-совместимого провайдера укажите полный URL вида
`https://host/v1/chat/completions` и идентификатор модели.

## Готовые пресеты

| Провайдер | Где получить ключ | Базовый URL |
|---|---|---|
| OpenAI | https://platform.openai.com/api-keys | `https://api.openai.com/v1/chat/completions` |
| Google Gemini | https://aistudio.google.com/app/apikey | Gemini API |
| OpenRouter | https://openrouter.ai/keys | `https://openrouter.ai/api/v1/chat/completions` |
| DeepSeek | https://platform.deepseek.com/api_keys | `https://api.deepseek.com/v1/chat/completions` |
| Groq | https://console.groq.com/keys | `https://api.groq.com/openai/v1/chat/completions` |
| Mistral AI | https://console.mistral.ai/api-keys/ | `https://api.mistral.ai/v1/chat/completions` |
| xAI (Grok) | https://console.x.ai/ | `https://api.x.ai/v1/chat/completions` |
| Together AI | https://api.together.ai/settings/api-keys | `https://api.together.xyz/v1/chat/completions` |
| Perplexity | https://www.perplexity.ai/settings/api | `https://api.perplexity.ai/chat/completions` |
| Fireworks AI | https://fireworks.ai/account/api-keys | `https://api.fireworks.ai/inference/v1/chat/completions` |
| Cohere | https://dashboard.cohere.com/api-keys | `https://api.cohere.ai/compatibility/v1/chat/completions` |
| Cerebras | https://cloud.cerebras.ai/ | `https://api.cerebras.ai/v1/chat/completions` |
| SambaNova | https://cloud.sambanova.ai/apis | `https://api.sambanova.ai/v1/chat/completions` |
| Nebius AI Studio | https://studio.nebius.ai/ | `https://api.studio.nebius.ai/v1/chat/completions` |
| Hyperbolic | https://app.hyperbolic.xyz/settings | `https://api.hyperbolic.xyz/v1/chat/completions` |
| Novita AI | https://novita.ai/settings/key-management | `https://api.novita.ai/v3/openai/chat/completions` |
| DeepInfra | https://deepinfra.com/dash/api_keys | `https://api.deepinfra.com/v1/openai/chat/completions` |
| Lambda | https://cloud.lambdalabs.com/api-keys | `https://api.lambdalabs.com/v1/chat/completions` |
| Moonshot Kimi | https://platform.moonshot.ai/console/api-keys | `https://api.moonshot.ai/v1/chat/completions` |
| Zhipu GLM | https://open.bigmodel.cn/usercenter/apikeys | `https://open.bigmodel.cn/api/paas/v4/chat/completions` |
| Alibaba Qwen | https://dashscope.console.aliyun.com/apiKey | `https://dashscope.aliyuncs.com/compatible-mode/v1/chat/completions` |
| Baidu Qianfan | https://console.bce.baidu.com/qianfan/ais/console/applicationConsole/application | `https://qianfan.baidubce.com/v2/chat/completions` |
| SiliconFlow | https://cloud.siliconflow.cn/account/ak | `https://api.siliconflow.cn/v1/chat/completions` |
| TokenHarbor | https://tokenharbor.ai/ | `https://tokenharbor.ai/v1/chat/completions` |
| AIshko | https://reformboss.com/ | `https://api.reformboss.com/v1/chat/completions` |
| LunaRoute | https://lunaroute.com/ | `https://gw.lunaroute.com/v1/chat/completions` |
| DPHN AI | https://dphn.ai/ | `https://lighthouse.dphn.ai/run/text-v/v1/chat/completions` |
| ElevenLabs (TTS) | https://elevenlabs.io/app/settings/api-keys | `https://api.elevenlabs.io/v1/text-to-speech` |
| Fish Audio (TTS) | https://fish.audio/ | `https://api.fish.audio/v1/tts` |

Ссылки ведут на официальные страницы провайдеров. Проверяйте актуальность
тарифов и условий у провайдера: приложение не оплачивает запросы и не
гарантирует доступность сторонних API.

## Локальные модели

Для Ollama, LM Studio и vLLM ключ обычно не нужен. Включите чекбокс
**«использовать локальный сервер»** и проверьте URL:

| Сервер | URL по умолчанию |
|---|---|
| Ollama | `http://127.0.0.1:11434/v1/chat/completions` |
| LM Studio | `http://127.0.0.1:1234/v1/chat/completions` |
| vLLM | `http://127.0.0.1:8000/v1/chat/completions` |

Локальные пресеты по умолчанию выключены, чтобы приложение не пыталось
обращаться к не запущенному серверу. Включите только тот, который у вас
действительно работает.

## Свой OpenAI-совместимый провайдер

В категории **«Свой»** задайте:

- название;
- полный URL chat-completions;
- один или несколько ключей (или оставьте пусто для локального сервера);
- идентификаторы моделей.

Подходит для корпоративных шлюзов, LiteLLM, OpenWebUI, llama.cpp server и
других совместимых API. Если сервер не требует авторизации, ключ можно не
указывать.

## Ротация ключей

Если у провайдера несколько ключей, приложение использует первый, а при
ответе 401/403/404 переключается на следующий. Это не заменяет нормальную
ротацию: отзывайте скомпрометированные ключи в кабинете провайдера.

## Что не поддерживается

- Аккаунт Ghoster, подписка и облачная синхронизация.
- Встроенные ключи и «бесплатные» ключи от автора сборки.
- Скрытая отправка ключей на серверы Ghoster, в Supabase или Sentry.
- Автоматическая оплата запросов у провайдеров.

Если ключ не работает, проверьте: правильность ключа, баланс у провайдера,
доступность модели в вашем тарифе, URL и интернет-соединение. Ошибка
«не удалось подключиться к ИИ-сервису» означает, что запрос не дошёл до
провайдера или провайдер вернул ошибку.
