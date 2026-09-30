// _misc 最小校验：与三个语料目录的 verify.mjs 同族的卫生检查。
// 检查严格 UTF-8（无 BOM）、无 CR、单个结尾换行、相对链接与锚点可解析。
// 跳过 _scratch/（git 不跟踪的可丢弃草稿）；http(s) 外链不做网络检查，
// 冻结存档 _references/ 只做卫生检查、不改内容。
// 用法：node _misc/verify.mjs
import { readFileSync, readdirSync, existsSync } from 'node:fs'
import { join, relative, resolve, dirname, isAbsolute } from 'node:path'

// 扫描边界是 _misc 本身；链接允许爬出到同仓库的兄弟语料目录（00-index 即如此引用 _digested）。
const WALK_ROOT = import.meta.dirname
const REPO_ROOT = resolve(WALK_ROOT, '..')
const failures = []

function* walk(dir) {
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const path = join(dir, entry.name)
    if (entry.isDirectory()) {
      if (entry.name === '_scratch' || entry.name === 'node_modules' || entry.name === '.git') continue
      yield* walk(path)
    } else if (entry.name.endsWith('.md') || entry.name.endsWith('.svg')) {
      yield path
    }
  }
}

const headingSlug = (text) =>
  text
    .toLowerCase()
    .replace(/[`*~[\]()]/g, '')
    .replace(/\s+/g, '-')
    .replace(/[^\p{L}\p{N}-]/gu, '')

function* headings(lines) {
  for (const line of lines) {
    const match = /^#{1,6}\s+(.*)$/.exec(line)
    if (match) yield headingSlug(match[1])
  }
}

for (const file of walk(WALK_ROOT)) {
  const rel = relative(WALK_ROOT, file)
  const buffer = readFileSync(file)
  if (buffer[0] === 0xef && buffer[1] === 0xbb && buffer[2] === 0xbf) failures.push(`${rel}: starts with a UTF-8 BOM`)
  const source = buffer.toString('utf8')
  if (source.includes('\r')) failures.push(`${rel}: contains CR characters; use LF line endings`)
  if (source.length > 0 && !source.endsWith('\n')) failures.push(`${rel}: must end with one trailing newline`)
  if (source.endsWith('\n\n')) failures.push(`${rel}: must end with exactly one trailing newline`)
  const lines = source.split('\n')
  const anchors = new Set([...headings(lines)])
  const checkLink = (rawTarget, lineNo) => {
    const target = rawTarget.startsWith('.') ? decodeURIComponent(rawTarget) : rawTarget
    const withoutAnchor = target.split('#')[0].trim()
    const anchor = target.includes('#') ? target.split('#')[1] : undefined
    if (!withoutAnchor && !anchor) return
    if (/^(https?:|mailto:)/.test(withoutAnchor)) return
    if (isAbsolute(withoutAnchor) || !withoutAnchor.startsWith('.')) return
    const abs = withoutAnchor ? resolve(dirname(file), withoutAnchor) : file
    if (!abs.startsWith(REPO_ROOT)) return
    if (withoutAnchor && !existsSync(abs)) {
      failures.push(`${rel}:${lineNo}: broken relative link ${target}`)
      return
    }
    if (anchor) {
      const anchorLines = readFileSync(abs, 'utf8').split('\n')
      if (![...headings(anchorLines)].includes(anchor)) failures.push(`${rel}:${lineNo}: unresolved anchor #${anchor}`)
    }
  }
  lines.forEach((line, index) => {
    for (const match of line.matchAll(/\[[^\]]*\]\(([^)\s]+)\)/g)) checkLink(match[1], index + 1)
  })
}

if (failures.length > 0) {
  console.error(`_misc verification failed with ${failures.length} problem(s):`)
  for (const failure of failures) console.error(`  ${failure}`)
  process.exit(1)
}
console.log('_misc verification passed.')
