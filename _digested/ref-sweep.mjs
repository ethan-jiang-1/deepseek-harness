// 语料引用反查工具：扫描四个语料目录里指向仓库文件的全部 path:line 引用，
// 报告「路径不存在」「行号越界」「引文-锚点漂移」三类候选。
//
// 用法：
//   node _digested/ref-sweep.mjs            # 全量：四个语料目录的路径与行号核验
//   node _digested/ref-sweep.mjs --quotes   # 追加严格引文-锚点核对（只认纯 ASCII 引文）
//   node _digested/ref-sweep.mjs _digested  # 只扫指定语料目录
//
// 输出是报告不是门禁（恒退出 0）：带退役注记的历史路径、git show 式旧基线引用、
// 概念性 shorthand（如泛指的 cordis.yml）都是合法命中，需要人按 0009-independent-recheck.md
// 的三态口径（真失效 / 历史引用 / 误报）分诊。每次 upstream 同步后跑一遍。
import { readFileSync, existsSync, readdirSync } from 'node:fs'
import { join, relative, resolve, dirname, isAbsolute } from 'node:path'

const ROOT = resolve(import.meta.dirname, '..')
const CORPORA = ['_digested', '_faq_on_digested', '_dsh_plugin_agent_ready_development', '_misc']
const SKIP_DIRS = ['_misc/_references', '_misc/_scratch']
const inCorpora = (abs) => CORPORA.some((c) => abs === join(ROOT, c) || abs.startsWith(join(ROOT, c) + '/'))
const inSkip = (abs) => SKIP_DIRS.some((s) => abs === join(ROOT, s) || abs.startsWith(join(ROOT, s) + '/'))

function* walkMarkdown(dir) {
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const path = join(dir, entry.name)
    if (inSkip(path)) continue
    if (entry.isDirectory()) {
      if (entry.name !== 'node_modules' && entry.name !== '.git') yield* walkMarkdown(path)
    } else if (entry.name.endsWith('.md')) {
      yield path
    }
  }
}

// 指向仓库文件的 path:line 引用：只认仓库根前缀（packages/ docs/ …）与已知根级文件，
// 避免把语料内部不带 ./ 的相对 shorthand（如 runtime-profiles/00-map.md）误报成仓库路径。
const REF = /(?:^|[\s(`>【（,;])(?:\.\.\/)*((?:packages|docs|scripts|vendor|apps|python|native|snapshots|benchmarks|examples|\.agents|\.github)\/[A-Za-z0-9@._/-]+\.(?:ts|mts|cts|js|mjs|cjs|json|md|ya?ml|svg|sh|py|toml)|(?:AGENTS|CLAUDE|README|CONTRIBUTING)\.md|(?:package|tsconfig(?:\.base)?|pnpm-workspace)\.json|(?:Makefile|vitest\.config\.ts|cordis\.yml)):(\d+)(?:-(\d+))?/g
// Markdown 链接目标，可选 :line 后缀（语料的历史引用写法）。
const MD_LINK = /\[[^\]]*\]\(([^)\s]+)\)/g
// 与锚点同一物理行、且看起来是源码原文的引文（纯 ASCII，含代码标点或驼峰）。
const QUOTE = /[「"]([^」"]{6,120})[」"]/g

const argv = process.argv.slice(2)
const withQuotes = argv.includes('--quotes')
const requested = argv.filter((a) => !a.startsWith('--'))
const corpora = requested.length > 0 ? requested : CORPORA

const broken = []
const overflow = []
const quoteDrift = []
let pathHits = 0
let lineHits = 0

const resolveTarget = (raw, fromFile) => {
  const withoutAnchor = raw.split('#')[0].trim()
  if (!withoutAnchor || /^(https?:|mailto:|#)/.test(withoutAnchor)) return undefined
  const abs = isAbsolute(withoutAnchor) || !withoutAnchor.startsWith('.')
    ? resolve(ROOT, withoutAnchor)
    : resolve(dirname(fromFile), withoutAnchor)
  if (inCorpora(abs) || !abs.startsWith(ROOT)) return undefined
  return abs
}

for (const corpus of corpora) {
  for (const file of walkMarkdown(join(ROOT, corpus))) {
    if (inSkip(file)) continue
    const text = readFileSync(file, 'utf8')
    const rel = relative(ROOT, file)
    const check = (raw, linePart, sourceLine) => {
      const abs = resolveTarget(raw, file)
      if (abs === undefined) return
      const label = `${rel}:${sourceLine} → ${raw} [${relative(ROOT, abs)}]`
      if (!existsSync(abs)) {
        broken.push(label)
        return
      }
      if (linePart === undefined || linePart === '') {
        pathHits += 1
        return
      }
      const total = readFileSync(abs, 'utf8').split('\n').length
      const end = linePart.includes('-') ? parseInt(linePart.split('-')[1], 10) : parseInt(linePart, 10)
      if (end > total) {
        overflow.push(`${label} (file has ${total} lines)`)
        return
      }
      lineHits += 1
    }
    let match
    MD_LINK.lastIndex = 0
    while ((match = MD_LINK.exec(text))) {
      const sourceLine = text.slice(0, match.index).split('\n').length
      const withLine = /^(.*?)(?::(\d+(?:-\d+)?))?$/.exec(match[1])
      check(withLine[1], withLine[2], sourceLine)
    }
    REF.lastIndex = 0
    while ((match = REF.exec(text))) {
      const sourceLine = text.slice(0, match.index).split('\n').length
      check(match[1], match[2] === undefined ? undefined : match[2] + (match[3] ? `-${match[3]}` : ''), sourceLine)
    }
    if (!withQuotes) continue
    for (const line of text.split('\n')) {
      const quotes = [...line.matchAll(QUOTE)]
        .map((m) => m[1].replace(/[`*~]/g, ''))
        .filter((q) => {
          const ascii = (q.match(/[\x20-\x7e]/g) ?? []).length
          return ascii === q.length && /[_(){}:=>.<]|^[a-z]+([A-Z][a-z]+)+/.test(q)
        })
      if (quotes.length === 0) continue
      REF.lastIndex = 0
      while ((match = REF.exec(line))) {
        const abs = resolveTarget(match[1], file)
        if (abs === undefined || !existsSync(abs)) continue
        const all = readFileSync(abs, 'utf8').split('\n')
        const start = parseInt(match[2], 10)
        const end = match[3] ? parseInt(match[3], 10) : start
        const windowText = all.slice(Math.max(0, start - 6), Math.min(all.length, end + 6)).join('\n')
        const normalize = (s) => s.replace(/\s+/g, '')
        for (const quote of quotes) {
          if (normalize(windowText).includes(normalize(quote))) break
          if (quote === quotes[quotes.length - 1]) {
            quoteDrift.push(`${rel} → ${match[1]}:${start}-${end}  「${quote.slice(0, 70)}」±6 行未命中`)
          }
        }
      }
    }
  }
}

console.log(`语料：${corpora.join('、')}${withQuotes ? '（含引文核对）' : ''}`)
console.log(`路径命中 ${pathHits}，行号命中 ${lineHits}`)
console.log(`路径不存在 ${broken.length}，行号越界 ${overflow.length}，引文漂移 ${quoteDrift.length}`)
if (broken.length > 0) console.log(`\n[路径不存在]\n${broken.join('\n')}`)
if (overflow.length > 0) console.log(`\n[行号越界]\n${overflow.join('\n')}`)
if (quoteDrift.length > 0) console.log(`\n[引文漂移]\n${quoteDrift.join('\n')}`)
console.log('\n报告不判失败：候选按 _digested/_change_log/0009-independent-recheck.md 的三态口径人工分诊。')
