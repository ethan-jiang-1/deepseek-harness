// TeamoRouter OpenAI 系 effort 全档探测（2026-09-24 GPT-6 首轮实测用脚本）
// 用法（仓库根目录）：node _faq_on_digested/03_model-vendors/TEAMOROUTER_openai_probe.mjs <model-id>...（例：gpt-6.1-sol gpt-6-luna）
// 凭据 TEAMOROUTER_API_KEY 只从 ~/.dsh/.credentials.yaml 的 refs 读取，仅用于请求，不打印不落盘。
// 协议 = 该 route 的 openai-completions：逐档发送 reasoning_effort: <值>；DEFAULT = 不发参数（DSH effort map 的 off: 空档）。
// 判读：200 = 参数被接受；rt = usage.reasoning_tokens，恒空表示中转不上报，不能据此宣称档位语义差异；
//       503「模型暂时不可用」是渠道错误，不等同于参数拒绝。每请求 60s 超时、失败重试 1 次。
import { parse } from 'yaml';
import { readFileSync } from 'node:fs';

const doc = parse(readFileSync(process.env.HOME + '/.dsh/.credentials.yaml', 'utf8'));
const key = doc?.refs?.TEAMOROUTER_API_KEY;
if (typeof key !== 'string' || key.length < 8) { console.error('NO_KEY_RESOLVED'); process.exit(2); }

const models = process.argv.slice(2);
if (models.length === 0) { console.error('usage: node TEAMOROUTER_openai_probe.mjs <model-id>...'); process.exit(1); }
const efforts = ['DEFAULT', 'none', 'minimal', 'low', 'medium', 'high', 'xhigh', 'max'];
const BASE = 'https://api.teamorouter.com/v1/chat/completions';

async function once(model, effort) {
  const body = { model, messages: [{ role: 'user', content: 'Reply with exactly: PONG' }], max_tokens: 256 };
  if (effort !== 'DEFAULT') body.reasoning_effort = effort;
  const res = await fetch(BASE, {
    method: 'POST',
    headers: { Authorization: 'Bearer ' + key, 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
    signal: AbortSignal.timeout(60_000),
  });
  return { status: res.status, j: await res.json() };
}

for (const model of models) {
  for (const effort of efforts) {
    let out = null;
    for (let attempt = 1; attempt <= 2; attempt++) {
      try { out = await once(model, effort); break; }
      catch (e) { out = { status: 'ERR', j: { name: e.name } }; }
    }
    const tag = `${model} / ${effort}`;
    if (out.status === 200) {
      const u = out.j.usage ?? {};
      const rt = u.completion_tokens_details?.reasoning_tokens;
      const text = String(out.j.choices?.[0]?.message?.content ?? '').slice(0, 10).trim();
      console.log(`${tag.padEnd(22)} 200 rt=${rt ?? '?'} out="${text}"`);
    } else {
      const err = out.j?.error ?? out.j;
      const msg = typeof err === 'object' ? (err.code ?? err.type ?? '') + ': ' + String(err.message ?? JSON.stringify(err)).slice(0, 110) : String(out.j.name ?? '');
      console.log(`${tag.padEnd(22)} HTTP ${out.status} ${msg}`);
    }
  }
}
