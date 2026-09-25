// 本目录四份文档的自审脚本。用法：node _audit.mjs
// 覆盖：链接/锚点、维度栏目与探针、封顶规则（正文↔附录、轴与档位写法、附录分组）、
// 20 卡片栏位与验收红线、例证段数量、外链数量、引号一致性、旧标签残留、文件规范。
import { readFileSync, existsSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const dir = dirname(fileURLToPath(import.meta.url))
const files = ['README.md', '01-evaluate-development-harness-coarse.md', '02-evaluate-development-harness-fine.md', '11-evaluate-runtime-harness.md', '12-evaluate-runtime-harness-fine.md', '20-from-gaps-to-plan.md']
const rd = (f) => readFileSync(resolve(dir, f), 'utf8')
const slug = (h) => h.toLowerCase().trim().replace(/[^\p{L}\p{N}\s-]/gu, '').replace(/ /g, '-')

let fails = 0
const check = (name, ok, detail = '') => {
  console.log(`${ok ? '  ok  ' : '  FAIL'} ${name}${detail ? ' — ' + detail : ''}`)
  if (!ok) fails++
}

/** 维度正文按标题切块。 */
const dimensions = (file, level, idPattern) => {
  const out = {}
  let cur = null
  for (const line of rd(file).split('\n')) {
    const heading = new RegExp(`^#{${level}} (${idPattern}) `).exec(line)
    if (heading) { cur = heading[1]; out[cur] = []; continue }
    if (new RegExp(`^#{1,${level}} `).test(line)) { cur = null; continue }
    if (cur) out[cur].push(line)
  }
  return out
}

/** 一个维度块里的封顶规则行。 */
const capsOf = (lines) => {
  const start = lines.findIndex((l) => /^\*\*封顶规则\*\*/.test(l))
  const caps = []
  for (let i = start + 1; start >= 0 && i < lines.length; i++) {
    if (lines[i].startsWith('- ')) caps.push(lines[i])
    else if (lines[i].trim() !== '') break
  }
  return caps
}

// —— 链接与锚点 ——
{
  const anchorsOf = (t) => new Set(t.split('\n').flatMap((l) => {
    const m = /^(#{1,6})\s+(.*)$/.exec(l)
    return m ? [slug(m[2])] : []
  }))
  const cache = new Map()
  const get = (p) => { if (!cache.has(p)) cache.set(p, readFileSync(resolve(dir, p), 'utf8')); return cache.get(p) }
  let bad = 0, total = 0
  for (const f of files) {
    const own = anchorsOf(get(f))
    for (const link of [...get(f).matchAll(/\]\(([^)]+)\)/g)].map((m) => m[1])) {
      total++
      if (/^https?:/.test(link)) continue
      const [path, fragment] = link.split('#')
      const target = path ? resolve(dir, dirname(f), path) : resolve(dir, f)
      if (!existsSync(target)) { console.log(`       失效文件 ${f} → ${link}`); bad++; continue }
      const anchorSet = target === resolve(dir, f) ? own : anchorsOf(get(path ? resolve(dirname(f), path) : f))
      if (fragment && !anchorSet.has(fragment)) { console.log(`       失效锚点 ${f} → ${link}`); bad++ }
    }
  }
  check(`链接与锚点（${total} 条）`, bad === 0)
}

// —— 01 / 02 维度与封顶 ——
for (const [file, level, idPattern, expected] of [
  ['02-evaluate-development-harness-fine.md', 4, '(?:KN|CP|EV|ST|MT)\\d+', 17],
  ['12-evaluate-runtime-harness-fine.md', 3, 'RT\\d+', 11],
]) {
  const tag = file.slice(0, 2)
  const dims = dimensions(file, level, idPattern)
  const ids = Object.keys(dims)
  check(`${tag} 维度数 = ${expected}`, ids.length === expected, ids.length !== expected ? `实为 ${ids.length}` : '')

  const required = [/\*\*一句话\*\*/, /\*\*探针\*\*/, /\*\*覆盖面\*\*/, /\*\*约束力\*\*/, /\*\*封顶规则\*\*/, /\*\*常见伪证\*\*/, /\*\*走形症状\*\*/]
  const missing = ids.filter((id) => required.some((r) => !r.test(dims[id].join('\n'))))
  check(`${tag} 每维栏目齐备`, missing.length === 0, missing.join(' '))

  const thin = ids.filter((id) => dims[id].filter((l) => /^\| PB\d /.test(l)).length < 5)
  check(`${tag} 每维 ≥5 个探针`, thin.length === 0, thin.join(' '))

  const appendix = {}
  for (const line of rd(file).split('\n')) {
    const m = new RegExp(`^\\| (${idPattern}) \\|`).exec(line)
    if (m) (appendix[m[1]] ??= []).push(line)
  }
  const body = Object.fromEntries(ids.map((id) => [id, capsOf(dims[id])]))
  const mismatch = ids.filter((id) => body[id].length !== (appendix[id] ?? []).length)
  check(`${tag} 封顶正文=附录（${ids.reduce((n, id) => n + body[id].length, 0)} 条）`, mismatch.length === 0, mismatch.join(' '))

  const axisless = ids.flatMap((id) => body[id].filter((c) => !/(覆盖面|约束力)封顶 [0-3]/.test(c)).map((c) => `${id}: ${c.slice(0, 40)}`))
  check(`${tag} 每条封顶都写明轴与档位`, axisless.length === 0, axisless.slice(0, 3).join(' | '))

  const seq = [...rd(file).matchAll(new RegExp(`^\\| (${idPattern}) \\|`, 'gm'))].map((m) => m[1])
  const seen = [...new Set(seq)]
  const grouped = seq.every((id, i) => i === 0 || seq[i - 1] === id || seen.indexOf(id) === seen.indexOf(seq[i - 1]) + 1)
  check(`${tag} 附录按维度连续分组`, grouped)
}

// —— 维度编号 ↔ 名称 对应（防止改名或搬运时张冠李戴）——
{
  const canonical = {}
  for (const [file, level, idPattern] of [
    ['02-evaluate-development-harness-fine.md', 4, '(?:KN|CP|EV|ST|MT)\\d+'],
    ['12-evaluate-runtime-harness-fine.md', 3, 'RT\\d+'],
  ]) {
    for (const m of rd(file).matchAll(new RegExp(`^#{${level}} (${idPattern}) (.+?) · `, 'gm'))) canonical[m[1]] = m[2].trim()
  }
  const variantToTokens = new Map()
  for (const [tok, name] of Object.entries(canonical)) {
    const parts = name.split('与')
    const variants = new Set([name.replace(/\s/g, '')])
    for (let i = 1; i < parts.length; i++) variants.add(parts.slice(i).join('与').replace(/\s/g, ''))
    for (const v of variants) {
      if (v.length < 3) continue
      variantToTokens.set(v, [...(variantToTokens.get(v) ?? []), tok])
    }
  }
  const variants = [...variantToTokens.keys()].sort((a, b) => b.length - a.length)
  const mismatches = []
  for (const f of files) {
    for (const m of rd(f).matchAll(/\b((?:KN|CP|EV|ST|MT|RT)\d+)[ ]*([\u4e00-\u9fa5]{3,})/g)) {
      const [, tok, run] = m
      for (const v of variants) {
        if (!run.startsWith(v)) continue
        const owners = [...new Set(variantToTokens.get(v))]
        if (owners.length === 1 && owners[0] !== tok) mismatches.push(`${f}: ${tok} → ${v}（属 ${owners[0]}）`)
        break
      }
    }
  }
  check(`维度编号与名称对应（${Object.keys(canonical).length} 维）`, mismatches.length === 0, mismatches.slice(0, 3).join(' | '))
}

// —— 20 卡片 ——
{
  const lines = rd('20-from-gaps-to-plan.md').split('\n')
  const cards = []
  for (let i = 0; i < lines.length; i++) {
    const heading = /^#{3,4} ((?:KN|CP|EV|ST|MT)\d+|RT\d+) .*处置卡/.exec(lines[i])
    if (!heading) continue
    const body = []
    for (let j = i + 1; j < lines.length && !/^#{3,4} /.test(lines[j]); j++) body.push(lines[j])
    cards.push({ id: heading[1], body })
  }
  check('20 卡片数 = 28', cards.length === 28, `实为 ${cards.length}`)

  const sections = (b) => b.filter((l) => /^\*\*/.test(l)).length
  const badShape = cards.filter((c) => (/^(?:KN|CP|EV|ST|MT)/.test(c.id) ? sections(c.body) !== 8 && c.id !== 'KN3' : sections(c.body) < 6))
  check('20 卡片栏位一致', badShape.length === 0, badShape.map((c) => c.id).join(' '))

  const withoutNegativeControl = cards.filter((c) => !/\*\*一次负例控制。\*\*/.test(c.body.join('\n')))
  check('20 每张卡都有负例控制', withoutNegativeControl.length === 0, withoutNegativeControl.map((c) => c.id).join(' '))

  const redLines = (b) => {
    const start = b.findIndex((l) => /^\*\*验收红线。\*\*/.test(l))
    let n = 0
    for (let i = start + 1; start >= 0 && i < b.length; i++) {
      if (b[i].startsWith('- ')) n++
      else if (/^\*\*/.test(b[i])) break
    }
    return n
  }
  const thinRed = cards.filter((c) => redLines(c.body) < 2)
  check('20 每张卡 ≥2 条验收红线', thinRed.length === 0, thinRed.map((c) => c.id).join(' '))
}

// —— 文档级约定 ——
{
  const text = (f) => rd(f)
  const exemplars = (text('02-evaluate-development-harness-fine.md').match(/^\*\*例证\*\*/gm) ?? []).length
  check('02 例证段 ≥7 条', exemplars >= 7, `实为 ${exemplars}`)

  for (const [f, min] of [['01-evaluate-development-harness-coarse.md', 10], ['11-evaluate-runtime-harness.md', 10]]) {
    const start = text(f).indexOf('## 附录 B · 常见伪证清单')
    const rows = start < 0 ? 0 : (text(f).slice(start).match(/^\| "/gm) ?? []).length
    check(`${f.slice(0, 2)} 附录 B 伪证清单 ≥${min} 句`, rows >= min, `实为 ${rows}`)
  }

  const external = files.reduce((n, f) => n + (text(f).match(/https?:\/\//g) ?? []).length, 0)
  check('外部链接恰为 1 条（01 §1 的原文引文）', external === 1, `实为 ${external}`)

  const curly = files.reduce((n, f) => n + (text(f).match(/[“”]/g) ?? []).length, 0)
  check('无弯引号（与全文直引号一致）', curly === 0, `实为 ${curly}`)

  // 「标识符约定」一节按设计引用旧形态（说明为什么不用），检查时跳过该节
  const withoutConvention = (t) => {
    const start = t.indexOf('### 标识符约定（token）')
    if (start < 0) return t
    const end = t.indexOf('\n---\n', start)
    return t.slice(0, start) + (end < 0 ? '' : t.slice(end))
  }
  const scan = files.map((f) => [f, withoutConvention(text(f))])
  const staleWords = ['A 层', 'B 层', 'C 层'].filter((s) => scan.some(([, t]) => t.includes(s)))
  // 旧 token 形态：单字母+数字（A1/B2/C3/D4/E5/R6/L7/M8/P9/X1/G2），新方案一律两字母+数字
  const legacyPatterns = [/\b[A-E]\d\b/, /\bP\d\b/, /\bX\d\b/, /\bG\d\b/, /\b[LM]\d\b/, /\bR\d+\b/]
  const legacy = []
  for (const [f, body] of scan) for (const re of legacyPatterns) {
    const m = body.match(new RegExp(re.source, 'g'))
    if (m) legacy.push(`${f}: ${[...new Set(m)].join(',')}`)
  }
  check('无旧标签残留', staleWords.length === 0 && legacy.length === 0, [...staleWords, ...legacy].slice(0, 3).join(' | '))

  // 每张 Markdown 表的表头、分隔行与数据行列数必须一致
  const tableProblems = []
  for (const f of files) {
    const lines = text(f).split('\n')
    const cells = (l) => l.split('|').length - 2
    for (let i = 0; i + 1 < lines.length; i++) {
      if (!/^\|/.test(lines[i]) || !/^\|[\s:|-]+\|$/.test(lines[i + 1])) continue
      const width = cells(lines[i])
      if (cells(lines[i + 1]) !== width) tableProblems.push(`${f}:${i + 2} 分隔行列数 ${cells(lines[i + 1])} ≠ 表头 ${width}`)
      for (let j = i + 2; j < lines.length && /^\|/.test(lines[j]); j++) {
        if (cells(lines[j]) !== width) tableProblems.push(`${f}:${j + 1} 数据行列数 ${cells(lines[j])} ≠ 表头 ${width}`)
      }
    }
  }
  check('所有表格列数一致', tableProblems.length === 0, tableProblems.slice(0, 5).join(' | '))

  const badEnding = files.filter((f) => !text(f).endsWith('\n') || text(f).endsWith('\n\n'))
  check('每份文件恰好一个结尾换行', badEnding.length === 0, badEnding.join(' '))

  const trailing = files.filter((f) => text(f).split('\n').some((l) => /[ \t]+$/.test(l)))
  check('无行尾空白', trailing.length === 0, trailing.join(' '))
}

// —— 小节编号与引用自洽（拆分/搬运最容易在这里劈叉）——
{
  const docNum = {
    '01': '01-evaluate-development-harness-coarse.md',
    '02': '02-evaluate-development-harness-fine.md',
    '11': '11-evaluate-runtime-harness.md',
    '12': '12-evaluate-runtime-harness-fine.md',
    '20': '20-from-gaps-to-plan.md',
  }
  const secsOf = (f) => (rd(f).match(/^## (\d+) · /gm) ?? []).map((s) => Number(/## (\d+)/.exec(s)[1]))
  const appsOf = (f) => (rd(f).match(/^## 附录 ([A-C])/gm) ?? []).map((s) => /附录 ([A-C])/.exec(s)[1])
  const secs = {}, apps = {}
  for (const [n, f] of Object.entries(docNum)) { secs[n] = secsOf(f); apps[n] = appsOf(f) }

  const notSeq = Object.entries(secs).filter(([, list]) => {
    const want = list.map((_, i) => (list[0] === 0 ? i : i + 1))
    return list.join(',') !== want.join(',')
  })
  check('小节编号连续且无重复', notSeq.length === 0, notSeq.map(([n, l]) => `${n}: ${l.join(',')}`).join(' | '))

  const tocBad = []
  for (const [n, f] of Object.entries(docNum)) {
    const body = rd(f), from = body.indexOf('## 目录')
    const toc = from < 0 ? '' : body.slice(from, body.indexOf('\n---', from))
    const inToc = [...toc.matchAll(/^\s*- \[(\d+) · /gm)].map((m) => Number(m[1]))
    if (inToc.join(',') !== secs[n].join(',')) tocBad.push(`${n}: 目录 ${inToc.join(',')} vs 正文 ${secs[n].join(',')}`)
  }
  check('目录覆盖且仅覆盖本文小节', tocBad.length === 0, tocBad.slice(0, 2).join(' | '))

  const secRefBad = []
  for (const [n, f] of Object.entries(docNum)) {
    for (const m of rd(f).matchAll(/第 (\d+) 节/g)) if (!secs[n].includes(Number(m[1]))) secRefBad.push(`${n} 第 ${m[1]} 节`)
  }
  check('文内「第 N 节」都存在', secRefBad.length === 0, secRefBad.slice(0, 3).join(' | '))

  const crossBad = []
  for (const [n, f] of Object.entries(docNum)) {
    for (const m of rd(f).matchAll(/\b(0[12]|1[12]|20) (§|第 )(\d+)/g)) {
      const target = m[1], num = Number(m[3])
      if (!secs[target].includes(num)) crossBad.push(`${n} → ${target} §${num}`)
    }
  }
  check('跨文档小节引用都指向存在的小节', crossBad.length === 0, crossBad.slice(0, 3).join(' | '))

  const appBad = []
  for (const [n, f] of Object.entries(docNum)) {
    for (const m of rd(f).matchAll(/(?:(\d\d) )?(?:的)?附录 ([A-C])/g)) {
      const target = m[1] ?? n
      if (!apps[target].includes(m[2])) appBad.push(`${n} → ${target} 附录 ${m[2]}`)
    }
  }
  check('附录引用都指向存在的附录', appBad.length === 0, appBad.slice(0, 3).join(' | '))
}

console.log(fails ? `\n${fails} 项未通过` : '\n全部通过')
process.exit(fails ? 1 : 0)
