// 本目录四份文档的自审脚本。用法：node _audit.mjs
// 覆盖：链接/锚点、维度栏目与探针、封顶规则（正文↔附录、轴与档位写法、附录分组）、
// 03 卡片栏位与验收红线、例证段数量、外链数量、引号一致性、旧标签残留、文件规范。
import { readFileSync, existsSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const dir = dirname(fileURLToPath(import.meta.url))
const files = ['README.md', '01-evaluate-development-harness.md', '02-evaluate-runtime-harness.md', '03-from-gaps-to-plan.md']
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
  ['01-evaluate-development-harness.md', 4, '[A-E]\\d', 17],
  ['02-evaluate-runtime-harness.md', 3, 'R\\d+', 11],
]) {
  const tag = file.slice(0, 2)
  const dims = dimensions(file, level, idPattern)
  const ids = Object.keys(dims)
  check(`${tag} 维度数 = ${expected}`, ids.length === expected, ids.length !== expected ? `实为 ${ids.length}` : '')

  const required = [/\*\*一句话\*\*/, /\*\*探针\*\*/, /\*\*覆盖面\*\*/, /\*\*约束力\*\*/, /\*\*封顶规则\*\*/, /\*\*常见伪证\*\*/, /\*\*走形症状\*\*/]
  const missing = ids.filter((id) => required.some((r) => !r.test(dims[id].join('\n'))))
  check(`${tag} 每维栏目齐备`, missing.length === 0, missing.join(' '))

  const thin = ids.filter((id) => dims[id].filter((l) => /^\| P\d /.test(l)).length < 5)
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

// —— 03 卡片 ——
{
  const lines = rd('03-from-gaps-to-plan.md').split('\n')
  const cards = []
  for (let i = 0; i < lines.length; i++) {
    const heading = /^#{3,4} ([A-E]\d|R\d+) .*处置卡/.exec(lines[i])
    if (!heading) continue
    const body = []
    for (let j = i + 1; j < lines.length && !/^#{3,4} /.test(lines[j]); j++) body.push(lines[j])
    cards.push({ id: heading[1], body })
  }
  check('03 卡片数 = 28', cards.length === 28, `实为 ${cards.length}`)

  const sections = (b) => b.filter((l) => /^\*\*/.test(l)).length
  const badShape = cards.filter((c) => (/^[A-E]/.test(c.id) ? sections(c.body) !== 8 && c.id !== 'A3' : sections(c.body) < 6))
  check('03 卡片栏位一致', badShape.length === 0, badShape.map((c) => c.id).join(' '))

  const withoutNegativeControl = cards.filter((c) => !/\*\*一次负例控制。\*\*/.test(c.body.join('\n')))
  check('03 每张卡都有负例控制', withoutNegativeControl.length === 0, withoutNegativeControl.map((c) => c.id).join(' '))

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
  check('03 每张卡 ≥2 条验收红线', thinRed.length === 0, thinRed.map((c) => c.id).join(' '))
}

// —— 文档级约定 ——
{
  const text = (f) => rd(f)
  const exemplars = (text('01-evaluate-development-harness.md').match(/^\*\*例证\*\*/gm) ?? []).length
  check('01 例证段 ≥7 条', exemplars >= 7, `实为 ${exemplars}`)

  for (const [f, min] of [['01-evaluate-development-harness.md', 10], ['02-evaluate-runtime-harness.md', 10]]) {
    const start = text(f).indexOf('## 附录 C · 常见伪证清单')
    const rows = start < 0 ? 0 : (text(f).slice(start).match(/^\| "/gm) ?? []).length
    check(`${f.slice(0, 2)} 附录 C 伪证清单 ≥${min} 句`, rows >= min, `实为 ${rows}`)
  }

  const external = files.reduce((n, f) => n + (text(f).match(/https?:\/\//g) ?? []).length, 0)
  check('外部链接恰为 1 条（01 §1 的原文引文）', external === 1, `实为 ${external}`)

  const curly = files.reduce((n, f) => n + (text(f).match(/[“”]/g) ?? []).length, 0)
  check('无弯引号（与全文直引号一致）', curly === 0, `实为 ${curly}`)

  const stale = ['A 层', 'B 层', 'C 层', 'E1 回放', 'E2 换后端', 'E3 加能力', 'E4 坏配置', 'E5 取消'].filter((s) => files.some((f) => text(f).includes(s)))
  check('无旧标签残留', stale.length === 0, stale.join(' '))

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

console.log(fails ? `\n${fails} 项未通过` : '\n全部通过')
process.exit(fails ? 1 : 0)
