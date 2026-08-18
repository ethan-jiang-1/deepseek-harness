# DeepSeek Research: Official API and a Same-Name Relay

## Conclusion

This is supported by configuration alone when the relay accepts one of DSH's hand-declared protocols: `openai-completions`, `openai-responses`, or `anthropic-messages`. Give the relay a new provider route such as `deepseek-relay`; keep the official route unchanged. DSH identifies a model by its provider route and model id, so `deepseek-relay / <model-id>` and `deepseek / <model-id>` are distinct selections even when `<model-id>` is byte-for-byte identical.

Do not repoint the existing `deepseek` route by changing its `baseURL` or `apiKeyEnv`. That would make every selection and session record under that route refer to the relay, concealing whether a request used the official service or the relay. A separate route keeps credentials, model selection, retry policy, and recorded provider identity independent.

The installed `dsh-llm-pi-ai` configuration treats the `providers` map key as the provider route [configuration](../../packages/llm/llm-pi-ai/src/config.ts:64). Unknown route keys are intentional: they are built from their configured protocol, endpoint, model list, and credential reference [provider construction](../../packages/llm/llm-pi-ai/src/provider.ts:150). The route registry accepts the same model id on different routes; the model lookup always receives both provider and model [dynamic configuration test](../../packages/llm/llm-pi-ai/tests/dynamic-config.spec.ts:78).

## Recommended Configuration

Start with a new entry in `/Users/bowhead/.dsh/settings.yaml` only. The web bundle's dormant `llm-pi-ai` adapter reads that settings section on the next request; adding a separate route does not require modifying `/Users/bowhead/.dsh/profiles/web/cordis.patch.yml` [adapter behavior](../../packages/llm/llm-pi-ai/README.md:106). Replace the placeholders only after the relay supplies its exact endpoint, protocol, and model ids.

```yaml
llm-pi-ai:
  providers:
    deepseek-relay:
      displayName: DeepSeek Relay
      apiKeyEnv: DEEPSEEK_RELAY_API_KEY
      api: openai-completions
      baseURL: https://relay.example/v1
      models:
        - id: <the-relay-model-id>
```

The example deliberately omits `reasoningEfforts`. A hand-declared model with no validated effort map exposes no fabricated effort choices. Add that map only after the relay has accepted each advertised wire value; an official model name does not prove that the relay forwards its reasoning fields correctly [reasoning resolution](../../packages/llm/llm-pi-ai/src/catalog.ts:302).

`apiKeyEnv` is a credential reference, not a key value. Store `DEEPSEEK_RELAY_API_KEY` through the DSH Models page or the DSH credentials service, not in `settings.yaml` or a `headers.Authorization` entry. DSH resolves the reference for every request and fails before network I/O when it is absent [credential resolution](../../packages/llm/llm-pi-ai/src/index.ts:184).

## What Must Be Supplied and Verified

The relay must provide all of the following before its route can be called working:

1. The complete base URL, including any required `/v1` or other path prefix. DSH preserves that prefix when it forms `GET <baseURL>/models` [listing URL](../../packages/llm/llm-pi-ai/src/discovery.ts:84).
2. Its wire protocol. Most DeepSeek relays use OpenAI Chat Completions, which means `api: openai-completions`; do not infer this from a matching model name. A relay that exposes `/v1/responses` instead needs `api: openai-responses`.
3. Its authentication method. The template assumes `Authorization: Bearer <key>`, which is the API-key behavior of DSH's OpenAI-compatible provider. A relay needing a different signing scheme cannot be represented by this configuration alone.
4. The exact model ids from its own `GET /models` response or documentation. Do not copy the official catalog merely because names overlap.
5. For every reasoning model, a text request with no effort, every effort intended for the selector, a streaming request, one tool call plus its result, and a second turn using the recorded history.

DSH can interrogate a hand-declared OpenAI-compatible route with `GET /models`, but that only lists candidates. It does not prove streaming, tool calls, replay, context size, output limits, data handling, or reasoning-field compatibility [discovery scope](../../packages/llm/llm-pi-ai/src/discovery.ts:1).

## When Configuration Is Not Enough

A new DSH LLM adapter is required only if the relay fails both OpenAI-compatible protocol options because of a non-Bearer authentication method, custom streaming events, incompatible tool/history messages, or a vendor-specific required request signature. Automatic fallback from the official DeepSeek route to the relay is also not a configuration feature: DSH retries the selected route and does not silently change the recorded provider identity [retry behavior](../../packages/llm/llm-retry/README.md:5).

## Safe Adoption

Before adding the route, make a dated `0600` backup of `settings.yaml`. Add only the new `deepseek-relay` key, then use `dsh web --dump-config` and an isolated minimal request to validate it. A rejected settings update leaves the last working route set registered, but an external invalid YAML edit can still prevent the new value from loading; the backup remains the explicit rollback path [settings validation](../../packages/llm/llm-pi-ai/README.md:108).

No relay URL or relay key was provided for this investigation. This record establishes the supported design and the exact inputs required for a real connectivity test; it does not claim that any third-party DeepSeek relay has passed one.

## Endpoint Mapping Supplied for the Relay

The relay's advertised endpoints map directly to DSH protocols:

| Relay endpoint | DSH `api` value | Route consequence |
|---|---|---|
| `POST /v1/chat/completions` | `openai-completions` | Use a route whose `baseURL` is the relay origin plus `/v1`. |
| `POST /v1/messages` | `anthropic-messages` | Use a separate route whose `baseURL` is the relay origin plus `/v1`. |

The route's `baseURL` is a prefix; the adapter appends the protocol request path. Do not put `/chat/completions` or `/messages` into `baseURL`, or the path will be duplicated. If the relay supports both APIs and exposes the same model ids through both, create two route keys when both are needed, for example `deepseek-relay-openai` and `deepseek-relay-anthropic`. For the first implementation, choose the API whose streaming, tools, history, and reasoning behavior has been verified; OpenAI Chat Completions is the simpler match for the supplied `/v1/chat/completions` endpoint.

For the OpenAI endpoint, the configuration therefore has this protocol-specific core:

```yaml
deepseek-relay-openai:
  displayName: DeepSeek Relay (OpenAI)
  apiKeyEnv: DEEPSEEK_RELAY_API_KEY
  api: openai-completions
  baseURL: https://relay.example/v1
  models:
    - id: <exact-model-id-from-the-relay>
```

The Anthropic variant changes only the route key, display name, `api`, and the credential reference if it uses a different key:

```yaml
deepseek-relay-anthropic:
  displayName: DeepSeek Relay (Anthropic)
  apiKeyEnv: DEEPSEEK_RELAY_ANTHROPIC_API_KEY
  api: anthropic-messages
  baseURL: https://relay.example/v1
  models:
    - id: <exact-model-id-from-the-relay>
```

## MICU DeepSeek Relay Probe

The supplied MICU endpoint `https://www.micuapi.ai` passed the following probes on 2026-08-18. The key was used only in the request process and was not written to this repository or any DSH configuration file.

| Probe | Result |
|---|---|
| `GET /v1/models` with Bearer authentication | HTTP 200; advertised `deepseek-v4-flash-0731` and `deepseek-v4-pro-0813`; both rows advertise `openai` and `anthropic`. |
| `POST /v1/chat/completions` with `deepseek-v4-flash-0731` | HTTP 200; non-streaming response contained `OK`. The response's normalized model label was `deepseek/deepseek-v4-flash`. |
| `POST /v1/messages` with `deepseek-v4-flash-0731` | HTTP 200; `x-api-key` plus `anthropic-version: 2023-06-01` returned `OK` with `stop_reason: end_turn`. |

This proves endpoint reachability and both wire formats for a short text request. It does not yet prove streaming, tool calls, multi-turn replay, context capacity, or reasoning controls. The route should therefore begin with the exact two ids from `/v1/models`, no `reasoningEfforts` declaration, and the OpenAI route as the default. Add the Anthropic route only if that protocol is needed independently.

The corresponding safe settings entries are:

```yaml
llm-pi-ai:
  providers:
    deepseek-relay-openai:
      displayName: MICU DeepSeek (OpenAI)
      apiKeyEnv: DEEPSEEK_RELAY_API_KEY
      api: openai-completions
      baseURL: https://www.micuapi.ai/v1
      models:
        - id: deepseek-v4-flash-0731
        - id: deepseek-v4-pro-0813
    deepseek-relay-anthropic:
      displayName: MICU DeepSeek (Anthropic)
      apiKeyEnv: DEEPSEEK_RELAY_API_KEY
      api: anthropic-messages
      baseURL: https://www.micuapi.ai/v1
      models:
        - id: deepseek-v4-flash-0731
        - id: deepseek-v4-pro-0813
```

These are configuration candidates, not an instruction to write them yet. Before applying them, store the key under `DEEPSEEK_RELAY_API_KEY` in DSH's credentials service, back up `settings.yaml`, and validate each route through the DSH request path. The same key reference may be shared because the two protocol implementations choose their respective authentication headers; separate references are preferable if MICU issues protocol-specific keys.

## Applied DSH Web Configuration

The DSH Web profile uses `MICU_DEEPSEEK_API_KEY` as the credential reference and the route name `micu-deepseek-openai`. It preserves the MICU base URL, lists only the two model ids returned by the MICU catalog, and declares the DeepSeek `off`, `high`, and `max` effort map. The route is written identically to `/Users/bowhead/.dsh/settings.yaml` and `/Users/bowhead/.dsh/profiles/web/cordis.patch.yml`; existing MICU GPT, Z.ai, Kimi, and official DeepSeek configuration remains unchanged. The credential is stored in DSH's credentials service under the referenced name.

The pre-change `0600` backups are `/Users/bowhead/.dsh/settings.yaml.bak-20260818-110242-before-micu-deepseek`, `/Users/bowhead/.dsh/profiles/web/cordis.patch.yml.bak-20260818-110242-before-micu-deepseek`, and `/Users/bowhead/.dsh/.credentials.yaml.bak-20260818-110242-before-micu-deepseek`. Store the credential only in DSH's `0600` credentials file, never in either configuration file or this record. Restoring both configuration backups removes the routes; restoring the credential backup removes the associated key.

## Credential Location

`~/.zshenv` currently exports `ZAI_API_KEY` and `KIMI_CN_API_KEY`; `~/.zshrc` has no configured provider key. Although `.zshenv` is read by Zsh in both interactive and non-interactive modes, it is not a reliable source for an already-running DSH Web server. The existing MICU GPT configuration records that the Web process did not inherit a key exported in another terminal. DSH's local credential provider watches `/Users/bowhead/.dsh/.credentials.yaml`, allowing a running server to resolve the named key without relying on shell startup.

Use `MICU_DEEPSEEK_API_KEY` in that managed credentials file. Do not duplicate this key in `.zshenv` or `.zshrc`; duplication adds a second secret location without improving DSH Web reliability.

## DeepSeek Effort Verification

MICU accepted all three DeepSeek effort requests for `deepseek-v4-flash-0731`: `thinking: { type: disabled }` for `off`, and `thinking: { type: enabled }` with `reasoning_effort: high` or `max`. Each returned HTTP 200 and a completed text response. The OpenAI route therefore exposes exactly `off`, `high`, and `max`, using `compat.thinkingFormat: deepseek` and `compat.supportsReasoningEffort: true`; these settings make DSH send those fields. MICU returned reasoning-token usage even for the disabled probe and did not return `reasoning_content`, so the tests prove parameter acceptance, not a measurable difference in service-side reasoning behavior.

The effort change is recoverable from the `0600` backups `/Users/bowhead/.dsh/settings.yaml.bak-20260818-111529-before-micu-deepseek-efforts` and `/Users/bowhead/.dsh/profiles/web/cordis.patch.yml.bak-20260818-111529-before-micu-deepseek-efforts`.

## Final DSH Web State

The active MICU DeepSeek configuration contains one route only: `micu-deepseek-openai`, displayed as `MICU DeepSeek (OpenAI)`. It is an independent MICU vendor route, not the official `deepseek` route, and uses `https://www.micuapi.ai/v1`, `openai-completions`, and the credential reference `MICU_DEEPSEEK_API_KEY`.

The configured models are `deepseek-v4-flash-0731` and `deepseek-v4-pro-0813`. Both expose exactly `off`, `high`, and `max`; the DeepSeek compatibility settings send `thinking: { type: disabled }` for `off` and `thinking: { type: enabled }` with the corresponding `reasoning_effort` for the other two levels. No official DeepSeek model directory, credentials, or route configuration is modified.

MICU's Anthropic endpoint passed a minimal request probe, but `micu-deepseek-anthropic` was removed from both DSH configuration layers because it is not needed. The MICU credential remains because the OpenAI route uses it.

The current `settings.yaml` and Web patch both parse as YAML and remain `0600`. The removal has its own `0600` rollback snapshots: `/Users/bowhead/.dsh/settings.yaml.bak-20260818-112407-before-remove-micu-deepseek-anthropic` and `/Users/bowhead/.dsh/profiles/web/cordis.patch.yml.bak-20260818-112407-before-remove-micu-deepseek-anthropic`.
