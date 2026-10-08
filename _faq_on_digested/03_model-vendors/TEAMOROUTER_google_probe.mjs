// TeamoRouter Google 系探测（gemini-nano-banana-2.1 为 2026-10-07 /models diff 新增 id 的首轮实测脚本）
// 用法（仓库根目录）：node _faq_on_digested/03_model-vendors/TEAMOROUTER_google_probe.mjs [model-id]（缺省 gemini-nano-banana-2.1，文本备选 gemini-3.8-flash）
// 缺省 id 属 nano-banana 图像线，文本 chat 请求可能 4xx——失败结果本身也是接入证据，换备选 id 复测即可。
// 凭据 TEAMOROUTER_API_KEY 只从 ~/.dsh/.credentials.yaml 的 refs 读取，仅用于请求，不打印不落盘。
// 两节：① DEFAULT + none + reasoning_effort 六档（rt = usage.reasoning_tokens，pt = prompt_tokens）；
//      ② calc 工具往返（tools + tool_choice: auto）。pt 异常偏大 = 后端疑似注入上下文，仅记录不据以宣称能力。
// 判读：200 = 参数被接受；503 是渠道错误不等同参数拒绝；每请求 60s 超时、失败重试 1 次。
import { parse } from 'yaml';
import { readFileSync } from 'node:fs';

const doc = parse(readFileSync(process.env.HOME + '/.dsh/.credentials.yaml', 'utf8'));
const key = doc?.refs?.TEAMOROUTER_API_KEY;
if (typeof key !== 'string' || key.length < 8) { console.error('NO_KEY_RESOLVED'); process.exit(2); }

const model = process.argv[2] ?? 'gemini-nano-banana-2.1';
const efforts = ['DEFAULT', 'none', 'minimal', 'low', 'medium', 'high', 'xhigh', 'max'];
const BASE = 'https://api.teamorouter.com/v1/chat/completions';

async function once(body) {
  const res = await fetch(BASE, {
    method: 'POST',
    headers: { Authorization: 'Bearer ' + key, 'Content-Type': 'application/json' },
    body: JSON.stringify({ model, ...body }),
    signal: AbortSignal.timeout(60_000),
  });
  return { status: res.status, j: await res.json() };
}

async function withRetry(body) {
  for (let attempt = 1; attempt <= 2; attempt++) {
    try { return await once(body); }
    catch (e) { if (attempt === 2) return { status: 'ERR', j: { name: e.name } }; }
  }
}

function print(tag, out) {
  if (out.status !== 200) {
    const err = out.j?.error ?? out.j;
    const msg = typeof err === 'object' ? (err.code ?? err.type ?? '') + ': ' + String(err.message ?? JSON.stringify(err)).slice(0, 110) : String(out.j.name ?? '');
    console.log(`${tag.padEnd(24)} HTTP ${out.status} ${msg}`);
    return;
  }
  const u = out.j.usage ?? {};
  const rt = u.completion_tokens_details?.reasoning_tokens;
  const text = String(out.j.choices?.[0]?.message?.content ?? '').slice(0, 10).trim();
  console.log(`${tag.padEnd(24)} 200 rt=${rt ?? '?'} pt=${u.prompt_tokens ?? '?'} out="${text}"`);
}

console.log(`== effort 扫描 / ${model} ==`);
for (const effort of efforts) {
  const body = { messages: [{ role: 'user', content: 'Reply with exactly: PONG' }], max_tokens: 256 };
  if (effort !== 'DEFAULT') body.reasoning_effort = effort;
  print(`${model} / ${effort}`, await withRetry(body));
}

console.log(`\n== tool 往返 / ${model} ==`);
const toolBody = {
  messages: [{ role: 'user', content: 'Use the calc tool to compute 2+2' }],
  max_tokens: 256,
  tools: [{ type: 'function', function: { name: 'calc', description: 'Add two integers', parameters: { type: 'object', properties: { a: { type: 'integer' }, b: { type: 'integer' } }, required: ['a', 'b'] } } }],
  tool_choice: 'auto',
};
const t = await withRetry(toolBody);
if (t.status !== 200) {
  print(`${model} / tool`, t);
} else {
  const c = t.j.choices?.[0];
  const call = c?.message?.tool_calls?.[0];
  console.log(`${model} / tool`.padEnd(24), `finish=${c?.finish_reason} call=${call ? call.function.name + ' ' + call.function.arguments : 'NONE'}`);
}
