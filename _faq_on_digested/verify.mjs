/**
 * Self-contained integrity checks for the FAQ-on-digested research corpus.
 * A minimal mirror of `_digested/verify.mjs`: strict UTF-8, LF line endings
 * with exactly one trailing newline, and relative Markdown links and anchors
 * that resolve to a target inside the repository.
 *
 * Citation conventions this corpus accumulates:
 * - `file.md:47` — the trailing `:47` line suffix is stripped before resolving.
 * - `docs/architecture.md` — a bare path resolves from the repository root.
 * - `cordis-primer.md` — a bare link excerpted from DSH docs resolves from `docs/`.
 * - `node_modules/…` and out-of-repository paths (e.g. sibling research repos)
 *   are reported as warnings, not failures: no local check can verify them.
 * - Links into `_digested/` fail: this corpus is self-contained and must not
 *   depend on another research corpus.
 *
 * The directory has no generated catalogs or claim register, so freshness of
 * numbers and baseline-sync review stay a documented manual step (00-index.md).
 */

import {
  existsSync,
  readFileSync,
  readdirSync,
  statSync,
} from 'node:fs'
import { execFileSync } from 'node:child_process'
import {
  dirname,
  extname,
  isAbsolute,
  relative,
  resolve,
  sep,
} from 'node:path'
import { fileURLToPath } from 'node:url'

const corpusRoot = dirname(fileURLToPath(import.meta.url))
const repositoryRoot = dirname(corpusRoot)
const decoder = new TextDecoder('utf-8', { fatal: true })
// Corpus links track the upstream default branch, never a release tag or commit hash: a citation that
// carries a version stops pointing at maintained content once that version ages out, and re-pinning it
// edits every citing file on each synchronization. Edition facts belong in the sentence that states the
// verification baseline, not in the URL. Event and discussion permalinks are not content addressing:
// a commit or discussion identifier names one immutable event, so those stay allowed.
const dshExternalUrl = /^https:\/\/github\.com\/deepseek-ai\/deepseek-harness\/(?:(?:blob|tree)\/master(?:[/?#]|$)|(?:commit|discussions|issues|pull)\/)/
const failures = []
const warnings = []

function corpusFiles(directory, extensions = ['.md']) {
  const files = []
  for (const entry of readdirSync(directory, { withFileTypes: true })) {
    const path = resolve(directory, entry.name)
    if (entry.isDirectory()) {
      // The corpus verifies the content it publishes. Local research scratch ignored by
      // `.gitignore` cites outside paths and private notes, so it is not a corpus artifact.
      if (isIgnored(path)) continue
      files.push(...corpusFiles(path, extensions))
    } else if (entry.isFile() && extensions.includes(extname(entry.name))) files.push(path)
  }
  return files.sort()
}

function isIgnored(path) {
  try {
    execFileSync('git', ['check-ignore', '-q', path], { cwd: corpusRoot, stdio: 'ignore' })
    return true
  } catch {
    return false
  }
}

function displayPath(path) {
  return relative(repositoryRoot, path)
}

function report(path, line, message) {
  failures.push(`${displayPath(path)}${line === undefined ? '' : `:${line}`}: ${message}`)
}

function decodeText(path) {
  try {
    return decoder.decode(readFileSync(path))
  } catch {
    report(path, undefined, 'file is not valid UTF-8')
    return undefined
  }
}

function checkFileEnding(path, source) {
  if (source.includes('\r')) report(path, undefined, 'contains CR characters; use LF line endings')
  if (!source.endsWith('\n')) {
    report(path, undefined, 'must end with one trailing newline')
  } else if (source.endsWith('\n\n')) {
    report(path, undefined, 'must end with exactly one trailing newline')
  }
}

function activeMarkdownLines(source) {
  const active = []
  let fence
  let inComment = false
  const lines = source.split('\n')

  for (let index = 0; index < lines.length; index += 1) {
    const original = lines[index]
    if (fence !== undefined) {
      const closing = original.match(/^ {0,3}(`+|~+)\s*$/)
      if (closing && closing[1][0] === fence.marker && closing[1].length >= fence.length) fence = undefined
      continue
    }

    let cursor = 0
    let line = ''
    while (cursor < original.length) {
      if (inComment) {
        const end = original.indexOf('-->', cursor)
        if (end === -1) {
          cursor = original.length
          continue
        }
        inComment = false
        cursor = end + 3
        continue
      }
      const start = original.indexOf('<!--', cursor)
      if (start === -1) {
        line += original.slice(cursor)
        break
      }
      line += original.slice(cursor, start)
      inComment = true
      cursor = start + 4
    }

    const opening = line.match(/^ {0,3}(`{3,}|~{3,})/)
    if (opening) {
      fence = { marker: opening[1][0], length: opening[1].length }
      continue
    }
    active.push({ line: index + 1, text: line })
  }
  return active
}

function maskInlineCode(line) {
  const chars = [...line]
  for (let index = 0; index < chars.length;) {
    if (chars[index] !== '`') {
      index += 1
      continue
    }
    let runEnd = index
    while (chars[runEnd] === '`') runEnd += 1
    const marker = '`'.repeat(runEnd - index)
    const closing = line.indexOf(marker, runEnd)
    if (closing === -1) {
      index = runEnd
      continue
    }
    for (let masked = index; masked < closing + marker.length; masked += 1) chars[masked] = ' '
    index = closing + marker.length
  }
  return chars.join('')
}

function markdownUrls(line) {
  const urls = []
  const source = maskInlineCode(line)

  for (let index = 0; index < source.length; index += 1) {
    if (source[index] !== '[' || (index > 0 && source[index - 1] === '\\')) continue
    let bracketDepth = 1
    let labelEnd = index + 1
    for (; labelEnd < source.length && bracketDepth > 0; labelEnd += 1) {
      if (source[labelEnd] === '\\') {
        labelEnd += 1
        continue
      }
      if (source[labelEnd] === '[') bracketDepth += 1
      if (source[labelEnd] === ']') bracketDepth -= 1
    }
    if (bracketDepth !== 0 || source[labelEnd] !== '(') continue

    let parenthesisDepth = 1
    let targetEnd = labelEnd + 1
    let inAngle = false
    for (; targetEnd < source.length && parenthesisDepth > 0; targetEnd += 1) {
      const character = source[targetEnd]
      if (character === '\\') {
        targetEnd += 1
        continue
      }
      if (character === '<' && parenthesisDepth === 1) inAngle = true
      if (character === '>' && inAngle) inAngle = false
      if (!inAngle && character === '(') parenthesisDepth += 1
      if (!inAngle && character === ')') parenthesisDepth -= 1
    }
    if (parenthesisDepth !== 0) continue

    const inside = source.slice(labelEnd + 1, targetEnd - 1).trim()
    let url
    if (inside.startsWith('<')) {
      const close = inside.indexOf('>')
      if (close !== -1) url = inside.slice(1, close)
    } else {
      const match = inside.match(/^(?:\\.|\S)+/)
      url = match?.[0]
    }
    if (url !== undefined) urls.push(url.replace(/\\([() ])/g, '$1'))
    index = targetEnd - 1
  }

  const definition = source.match(/^ {0,3}\[[^\]]+\]:\s*(?:<([^>]+)>|([^\s]+))/)
  const definitionUrl = definition?.[1] ?? definition?.[2]
  if (definitionUrl !== undefined) urls.push(definitionUrl)
  return urls
}

function isExternal(url) {
  return url.startsWith('//')
    || url.startsWith('/')
    || /^[a-zA-Z][a-zA-Z0-9+.-]*:/.test(url)
}

function decodedPart(raw) {
  try {
    return decodeURIComponent(raw)
  } catch {
    return undefined
  }
}

function linkParts(url) {
  const hash = url.indexOf('#')
  const beforeHash = hash === -1 ? url : url.slice(0, hash)
  const rawPath = beforeHash.replace(/\?.*$/, '')
  const rawFragment = hash === -1 ? undefined : url.slice(hash + 1).replace(/\?.*$/, '')
  return {
    path: decodedPart(rawPath),
    fragment: rawFragment === undefined ? undefined : decodedPart(rawFragment),
  }
}

function renderedHeading(markdown) {
  return markdown
    .replace(/\s+#+\s*$/, '')
    .replace(/!\[([^\]]*)\]\([^)]*\)/g, '$1')
    .replace(/\[([^\]]+)\]\([^)]*\)/g, '$1')
    .replace(/`+([^`]*)`+/g, '$1')
    .replace(/<[^>]+>/g, '')
    .replace(/[~*_]/g, '')
    .replace(/\\([\\`*_[\]{}()#+.!-])/g, '$1')
    .replaceAll('&amp;', '&')
    .replaceAll('&lt;', '<')
    .replaceAll('&gt;', '>')
    .replaceAll('&quot;', '"')
    .replaceAll('&#39;', "'")
    .trim()
}

function githubSlug(heading) {
  return heading.toLowerCase().replace(/[^\p{L}\p{N}_ -]/gu, '').replaceAll(' ', '-')
}

const anchorCache = new Map()

function markdownAnchors(path) {
  const cached = anchorCache.get(path)
  if (cached !== undefined) return cached
  const source = decodeText(path)
  const anchors = new Set()
  anchorCache.set(path, anchors)
  if (source === undefined) return anchors

  const occurrences = new Map()
  const lines = activeMarkdownLines(source)
  for (let index = 0; index < lines.length; index += 1) {
    const current = lines[index]
    const atx = current.text.match(/^ {0,3}#{1,6}\s+(.+?)\s*$/)
    let heading = atx?.[1]
    if (heading === undefined && index + 1 < lines.length && lines[index + 1].line === current.line + 1) {
      if (/^ {0,3}(?:=+|-+)\s*$/.test(lines[index + 1].text) && current.text.trim() !== '') heading = current.text
    }
    if (heading === undefined) continue
    const base = githubSlug(renderedHeading(heading))
    let anchor = base
    let suffix = occurrences.get(base) ?? 0
    while (anchors.has(anchor)) {
      suffix += 1
      anchor = `${base}-${suffix}`
    }
    occurrences.set(base, suffix)
    anchors.add(anchor)
  }

  for (const { text } of lines) {
    for (const match of text.matchAll(/<a\s+[^>]*\bid="([^"]+)"[^>]*>/g)) anchors.add(match[1])
  }
  return anchors
}

function pathInsideRepository(path) {
  const fromRoot = relative(repositoryRoot, path)
  return fromRoot !== '..' && !fromRoot.startsWith(`..${process.platform === 'win32' ? '\\' : '/'}`) && !isAbsolute(fromRoot)
}

function checkMarkdownLinks(path, source) {
  for (const { line, text } of activeMarkdownLines(source)) {
    for (const rawUrl of markdownUrls(text)) {
      // Older entries cite sources as `file.md:47`; the line suffix is a
      // citation, not part of the path, so strip it before resolving.
      const lineSuffix = rawUrl.match(/^(.+):(\d+)$/)
      const url = lineSuffix === null ? rawUrl : lineSuffix[1]
      if (isExternal(url)) {
        if (url.includes('github.com/deepseek-ai/deepseek-harness/') && !dshExternalUrl.test(url)) {
          report(path, line, `DSH link must target the default branch, not a tag or commit: ${JSON.stringify(rawUrl)}`)
        }
        continue
      }
      const parts = linkParts(url)
      if (parts.path === undefined || (url.includes('#') && parts.fragment === undefined)) {
        report(path, line, `malformed percent escape in link ${JSON.stringify(rawUrl)}`)
        continue
      }
      let target = parts.path === '' ? path : resolve(dirname(path), parts.path)
      // Bare citations like `docs/architecture.md` are repository-root-relative;
      // bare links excerpted from DSH docs (e.g. `cordis-primer.md` inside a
      // quoted architecture.md sentence) resolve against `docs/`.
      if (parts.path !== '' && !parts.path.startsWith('./') && !parts.path.startsWith('../')) {
        const fromRoot = resolve(repositoryRoot, parts.path)
        if (existsSync(fromRoot)) target = fromRoot
        else {
          const fromDocs = resolve(repositoryRoot, 'docs', parts.path)
          if (existsSync(fromDocs)) target = fromDocs
        }
      }
      if (target.split(sep).includes('_digested')) {
        report(path, line, `link must not depend on _digested/: ${JSON.stringify(rawUrl)}`)
        continue
      }
      if (target.includes(`${sep}node_modules${sep}`)) {
        warnings.push(`${displayPath(path)}${line === undefined ? '' : `:${line}`}: citation resolves into node_modules (left unverified): ${JSON.stringify(rawUrl)}`)
        continue
      }
      if (!pathInsideRepository(target)) {
        warnings.push(`${displayPath(path)}${line === undefined ? '' : `:${line}`}: citation resolves outside the repository: ${JSON.stringify(rawUrl)}`)
        continue
      }
      if (!existsSync(target) || !statSync(target).isFile()) {
        report(path, line, `relative link target does not exist: ${JSON.stringify(rawUrl)}`)
        continue
      }
      if (parts.fragment !== undefined && extname(target) === '.md') {
        const anchors = markdownAnchors(target)
        if (!anchors.has(parts.fragment)) {
          report(path, line, `relative link anchor does not exist on target: ${JSON.stringify(rawUrl)}`)
        }
      }
    }
  }
}

// Retired vocabulary: words this corpus replaced with repo-defined terms. The list lives here, not only
// in prose, so a later rewrite cannot reintroduce them without failing. `term-policy` marks the lines
// that register them; the audit log is frozen by the corpus charter and records what a round did.
// `one home per fact` (一个事实一个家) is repo vocabulary, not a coinage, so it is not listed.
const retiredTerms = [
  '五个家',
  '四个空间',
  '四空间',
  '内容家',
  '历史家',
  '状态家',
  '派生家',
  '客户端家',
  '数据家',
  '原生家',
  '持久消息家',
  '状态的家',
  '产品型插件',
  '产品 profile',
  '产品 bundle',
  '产品 project',
  '入口 profile',
]
// Ambiguous only where the corpus defines its own distribution word: the topic that does says
// `发行版` for a delivered Harness, so a second variant there reads as a third concept.
const topicRetiredTerms = new Map([['26_harness-release', ['DSH 发行版']]])
const termPolicyMarker = 'term-policy'
const topicScope = resolve(corpusRoot, '26_harness-release')
const frozenTerminology = new Set(['26_harness-release/40-evidence/quality-review.md'])
// Every coined label must stay registered in the one ledger page, so a reader can tell a repo term
// from a corpus-local one without searching the whole directory.
const ledgerPage = resolve(corpusRoot, '00-index.md')
const registeredTerms = [
  '发行版',
  '发行方',
  '六轴',
  '五类存储',
  '资产 owner',
  '平面',
  '门禁',
  '载体',
  '可见面',
  '参与阶梯',
  '证据阶梯',
  '供给侧',
  '可替换率',
  '数据卡',
]

function checkTerminology(path, source) {
  const localPath = relative(corpusRoot, path)
  if (frozenTerminology.has(localPath)) return
  const retired = [...retiredTerms]
  for (const [prefix, terms] of topicRetiredTerms) {
    if (localPath.startsWith(`${prefix}${sep}`)) retired.push(...terms)
  }
  source.split('\n').forEach((line, index) => {
    if (line.includes(termPolicyMarker)) return
    for (const term of retired) {
      if (line.includes(term)) report(path, index + 1, `retired term ${JSON.stringify(term)}`)
    }
  })
}

function checkTermRegistry() {
  const ledger = decodeText(ledgerPage)
  if (ledger === undefined) return
  for (const term of registeredTerms) {
    if (!ledger.includes(term)) {
      report(ledgerPage, undefined, `term ledger does not register ${JSON.stringify(term)}`)
    }
  }
}

const files = corpusFiles(corpusRoot)
let markdownCount = 0

for (const path of files) {
  const source = decodeText(path)
  if (source === undefined) continue
  markdownCount += 1
  checkFileEnding(path, source)
  checkMarkdownLinks(path, source)
  checkTerminology(path, source)
}
checkTermRegistry()

// Figure labels are prose too: a renamed concept must not survive in an SVG caption.
for (const path of corpusFiles(corpusRoot, ['.svg'])) {
  const source = decodeText(path)
  if (source !== undefined) checkTerminology(path, source)
}

if (failures.length > 0) {
  console.error(`_faq_on_digested verification failed with ${failures.length} problem(s):`)
  for (const failure of failures) console.error(`  ${failure}`)
  process.exitCode = 1
} else {
  console.log(`_faq_on_digested verification passed: ${markdownCount} Markdown files, links, anchors and terminology resolve.`)
}
if (warnings.length > 0) {
  console.error(`${warnings.length} citation(s) resolve outside the repository (left unverified):`)
  for (const warning of warnings) console.error(`  ${warning}`)
}
