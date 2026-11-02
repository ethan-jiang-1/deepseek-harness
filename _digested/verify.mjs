/**
 * Self-contained integrity checks for the source-digestion corpus.
 *
 * Validates strict UTF-8 and one trailing LF for corpus text, relative
 * Markdown links and fragments, every SVG figure's XML and entities, the
 * catalog/file-tree bijection and generated coverage matrix, Markdown table
 * shapes, charter-copy equality, and the harness-idea claim register in
 * harness-idea/claims.json.
 */

import { execFileSync } from 'node:child_process'
import { createHash } from 'node:crypto'
import {
  existsSync,
  readFileSync,
  readdirSync,
  statSync,
} from 'node:fs'
import {
  dirname,
  extname,
  isAbsolute,
  relative,
  resolve,
} from 'node:path'
import { fileURLToPath } from 'node:url'
import { applyCoverage, renderCoverage } from './render-indexes.mjs'

const corpusRoot = dirname(fileURLToPath(import.meta.url))
const repositoryRoot = dirname(corpusRoot)
const decoder = new TextDecoder('utf-8', { fatal: true })
// Corpus links track the upstream default branch, never a release tag or commit hash: a citation that
// carries a version stops pointing at maintained content once that version ages out, and re-pinning it
// edits every citing file on each synchronization. Edition facts belong in the sentence that states the
// verification baseline, not in the URL. Event and discussion permalinks are not content addressing.
const dshExternalUrl = /^https:\/\/github\.com\/deepseek-ai\/deepseek-harness\/(?:(?:blob|tree)\/master(?:[/?#]|$)|(?:commit|discussions|issues|pull)\/)/
const failures = []
const catalogPath = resolve(corpusRoot, 'catalog.json')
const coveragePath = resolve(corpusRoot, '_coverage', '00-index.md')
const catalog = loadCatalog()
const baselineCommit = catalog?.baseline?.commit ?? ''

/** Load the page/baseline catalog; a failure is recorded once and skips catalog checks. */
function loadCatalog() {
  try {
    const parsed = JSON.parse(readFileSync(catalogPath, 'utf8'))
    if (parsed === null || typeof parsed !== 'object' || Array.isArray(parsed)) {
      failures.push('catalog.json: root must be an object')
      return null
    }
    return parsed
  } catch (error) {
    failures.push(`catalog.json: ${error instanceof Error ? error.message : String(error)}`)
    return null
  }
}

function corpusFiles(directory) {
  const files = []
  for (const entry of readdirSync(directory, { withFileTypes: true })) {
    const path = resolve(directory, entry.name)
    if (entry.isDirectory()) files.push(...corpusFiles(path))
    else if (entry.isFile() && ['.md', '.mjs', '.svg'].includes(extname(entry.name))) files.push(path)
  }
  return files.sort()
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
  } catch (error) {
    report(path, undefined, `not valid UTF-8 (${error instanceof Error ? error.message : String(error)})`)
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
    for (const url of markdownUrls(text)) {
      if (isExternal(url)) {
        if (url.includes('github.com/deepseek-ai/deepseek-harness/') && !dshExternalUrl.test(url)) {
          report(path, line, `DSH link must target the default branch, not a tag or commit: ${JSON.stringify(url)}`)
        }
        continue
      }
      const parts = linkParts(url)
      if (parts.path === undefined || (url.includes('#') && parts.fragment === undefined)) {
        report(path, line, `malformed percent escape in link ${JSON.stringify(url)}`)
        continue
      }
      const target = parts.path === '' ? path : resolve(dirname(path), parts.path)
      if (!pathInsideRepository(target)) {
        report(path, line, `relative link escapes the repository: ${JSON.stringify(url)}`)
        continue
      }
      if (!existsSync(target)) {
        report(path, line, `relative link target does not exist: ${JSON.stringify(url)}`)
        continue
      }
      if (parts.fragment === undefined || extname(target).toLowerCase() !== '.md') continue
      if (!statSync(target).isFile() || !markdownAnchors(target).has(parts.fragment)) {
        report(path, line, `Markdown fragment does not exist: ${JSON.stringify(url)}`)
      }
    }
  }
}

function xmlLocation(source, index) {
  return source.slice(0, index).split('\n').length
}

function checkEntities(path, source, value, offset) {
  for (let index = 0; index < value.length; index += 1) {
    if (value[index] !== '&') continue
    const entity = value.slice(index).match(/^&(?:amp|lt|gt|quot|apos|#[0-9]+|#x[0-9a-fA-F]+);/)
    if (entity === null) {
      report(path, xmlLocation(source, offset + index), 'invalid or unterminated XML entity')
      return
    }
    index += entity[0].length - 1
  }
}

function parseAttributes(path, source, body, bodyOffset, root) {
  let index = 0
  const attributes = new Map()
  while (index < body.length) {
    while (/\s/.test(body[index] ?? '')) index += 1
    if (index >= body.length) break
    const name = body.slice(index).match(/^[A-Za-z_:][A-Za-z0-9_.:-]*/)?.[0]
    if (name === undefined) {
      report(path, xmlLocation(source, bodyOffset + index), 'invalid XML attribute name')
      return undefined
    }
    index += name.length
    while (/\s/.test(body[index] ?? '')) index += 1
    if (body[index] !== '=') {
      report(path, xmlLocation(source, bodyOffset + index), `attribute ${JSON.stringify(name)} is missing =`)
      return undefined
    }
    index += 1
    while (/\s/.test(body[index] ?? '')) index += 1
    const quote = body[index]
    if (quote !== '"' && quote !== "'") {
      report(path, xmlLocation(source, bodyOffset + index), `attribute ${JSON.stringify(name)} must use quotes`)
      return undefined
    }
    const valueStart = index + 1
    const valueEnd = body.indexOf(quote, valueStart)
    if (valueEnd === -1) {
      report(path, xmlLocation(source, bodyOffset + index), `attribute ${JSON.stringify(name)} has no closing quote`)
      return undefined
    }
    const value = body.slice(valueStart, valueEnd)
    if (value.includes('<')) report(path, xmlLocation(source, bodyOffset + valueStart), 'attribute value contains an unescaped <')
    checkEntities(path, source, value, bodyOffset + valueStart)
    if (attributes.has(name)) report(path, xmlLocation(source, bodyOffset + index), `duplicate attribute ${JSON.stringify(name)}`)
    attributes.set(name, value)
    index = valueEnd + 1
  }
  if (root && attributes.get('xmlns') !== 'http://www.w3.org/2000/svg') {
    report(path, xmlLocation(source, bodyOffset), 'root <svg> must declare xmlns="http://www.w3.org/2000/svg"')
  }
  return attributes
}

function findTagEnd(source, start) {
  let quote
  for (let index = start; index < source.length; index += 1) {
    const character = source[index]
    if (quote !== undefined) {
      if (character === quote) quote = undefined
      continue
    }
    if (character === '"' || character === "'") quote = character
    else if (character === '>') return index
  }
  return -1
}

function checkSvg(path, source) {
  const stack = []
  let rootSeen = false
  let rootClosed = false
  let index = 0

  while (index < source.length) {
    const open = source.indexOf('<', index)
    const textEnd = open === -1 ? source.length : open
    const text = source.slice(index, textEnd)
    checkEntities(path, source, text, index)
    if (stack.length === 0 && text.trim() !== '') report(path, xmlLocation(source, index), 'text appears outside the root element')
    if (open === -1) break

    if (source.startsWith('<!--', open)) {
      const end = source.indexOf('-->', open + 4)
      if (end === -1) {
        report(path, xmlLocation(source, open), 'unterminated XML comment')
        return
      }
      if (source.slice(open + 4, end).includes('--')) report(path, xmlLocation(source, open), 'XML comment contains --')
      index = end + 3
      continue
    }
    if (source.startsWith('<![CDATA[', open)) {
      const end = source.indexOf(']]>', open + 9)
      if (end === -1) {
        report(path, xmlLocation(source, open), 'unterminated CDATA section')
        return
      }
      if (stack.length === 0) report(path, xmlLocation(source, open), 'CDATA appears outside the root element')
      index = end + 3
      continue
    }
    if (source.startsWith('<?', open)) {
      const end = source.indexOf('?>', open + 2)
      if (end === -1) {
        report(path, xmlLocation(source, open), 'unterminated XML processing instruction')
        return
      }
      if (rootSeen) report(path, xmlLocation(source, open), 'processing instruction appears after the root element begins')
      index = end + 2
      continue
    }
    if (source.startsWith('<!', open)) {
      report(path, xmlLocation(source, open), 'DOCTYPE and other XML declarations are not allowed in corpus SVGs')
      return
    }

    const end = findTagEnd(source, open + 1)
    if (end === -1) {
      report(path, xmlLocation(source, open), 'unterminated XML tag')
      return
    }
    let tag = source.slice(open + 1, end)
    if (tag.startsWith('/')) {
      const name = tag.match(/^\/\s*([A-Za-z_:][A-Za-z0-9_.:-]*)\s*$/)?.[1]
      if (name === undefined) {
        report(path, xmlLocation(source, open), 'invalid XML closing tag')
      } else if (stack.at(-1) !== name) {
        report(path, xmlLocation(source, open), `closing </${name}> does not match <${stack.at(-1) ?? 'none'}>`)
      } else {
        stack.pop()
        if (stack.length === 0) rootClosed = true
      }
      index = end + 1
      continue
    }

    const selfClosing = /\/\s*$/.test(tag)
    if (selfClosing) tag = tag.replace(/\/\s*$/, '')
    const name = tag.match(/^\s*([A-Za-z_:][A-Za-z0-9_.:-]*)/)?.[1]
    if (name === undefined) {
      report(path, xmlLocation(source, open), 'invalid XML opening tag')
      index = end + 1
      continue
    }
    const nameStart = tag.indexOf(name)
    const attributes = tag.slice(nameStart + name.length)
    if (rootClosed) report(path, xmlLocation(source, open), 'more than one root element')
    const isRoot = !rootSeen
    if (isRoot) {
      rootSeen = true
      if (name !== 'svg') report(path, xmlLocation(source, open), `root element must be <svg>, got <${name}>`)
    }
    parseAttributes(path, source, attributes, open + 1 + nameStart + name.length, isRoot)
    if (!selfClosing) stack.push(name)
    else if (isRoot) rootClosed = true
    index = end + 1
  }

  if (!rootSeen) report(path, undefined, 'has no root <svg> element')
  if (stack.length > 0) report(path, undefined, `unclosed XML tag <${stack.at(-1)}>`)
}

const claimsPath = resolve(corpusRoot, 'harness-idea', 'claims.json')

/**
 * Content-freshness gates added after the 0008 independent recheck:
 * (1) orphan pages — a numbered mechanism page that no other corpus page or
 *     topic map links to can silently rot (the deletion wave left three);
 * (2) retired-term scan — a retired product name asserted in present tense
 *     without a retirement annotation nearby is the dominant staleness shape.
 */
const orphanExemptPrefixes = ['_change_log', '_coverage', 'figures']
const orphanExemptNames = new Set(['00-index.md', '00-map.md', 'README.md'])

function checkOrphanPages() {
  const files = corpusFiles(corpusRoot).filter(path => extname(path) === '.md')
  const sources = new Map(files.map(path => [path, readFileSync(path, 'utf8')]))
  for (const path of files) {
    const rel = relative(corpusRoot, path)
    const segments = rel.split('/')
    // Two levels for a flat topic, three for a topic that groups sub-axes
    // (e.g. plugin-system/lifecycle); deeper paths stay unenforced.
    if (segments.length !== 2 && segments.length !== 3) continue
    const topic = segments.length === 3 ? `${segments[0]}/${segments[1]}` : segments[0]
    const filename = segments[segments.length - 1]
    if (orphanExemptPrefixes.includes(segments[0]) || orphanExemptNames.has(filename)) continue
    if (!/^0[1-9]/.test(filename)) continue
    const basename = filename.replace(/\.md$/, '')
    let referenced = false
    for (const [other, source] of sources) {
      if (other === path) continue
      if (source.includes(basename)) { referenced = true; break }
    }
    if (!referenced) report(path, undefined, 'orphan page: no other corpus file references it (link it from the topic map or delete it)')
  }
}

/**
 * Terms whose product owners were retired by the 0008 span. A hit is only a
 * finding when the surrounding lines do not mark it as history (retirement
 * wording or strikethrough) — the corpus deliberately keeps annotated history.
 */
const retiredTerms = [
  'agent-presets',
  'code-runtime-python',
  'dsh-e2b',
  'fs-e2b',
  'subprocess-e2b',
  'ctx\\.e2b',
  'settings-file',
  'installSection',
  'settings\\.plugin\\.item',
  'cordis_define',
  'cordis_run',
  'cordis_stop',
  'cordis_undefine',
  'cordis_inspect_self',
  'followup_task',
  'session-persistence-sqlite',
  'composeLive',
  'watchUserPatches',
  'healProfilesModuleFallback',
  'agent/session-start',
]
const retirementMarkers = [
  /退役/,
  /已删/,
  /已随/,
  /改名/,
  /历史/,
  /旧基线/,
  /旧名/,
  /当时/,
  /保留为/,
  /已不存在/,
  /已随 0\.1\.7/,
  /~~/,
  /0008 复核/,
]

function checkRetiredTerms(files) {
  for (const path of files) {
    if (extname(path) !== '.md') continue
    const rel = relative(corpusRoot, path)
    if (rel.startsWith('_change_log') || rel.startsWith('_coverage')) continue
    const lines = readFileSync(path, 'utf8').split('\n')
    // A page whose head carries a 0008 状态注记 declaring the rename is
    // annotated for the whole page (mechanism pages keep pre-rename anchors).
    const pageAnnotated = lines.slice(0, 3).some(line => line.includes('状态注记') && line.includes('改名'))
    for (let index = 0; index < lines.length; index += 1) {
      const line = lines[index]
      for (const term of retiredTerms) {
        if (!new RegExp(term).test(line)) continue
        if (pageAnnotated) continue
        const window = lines.slice(Math.max(0, index - 2), index + 3).join('\n')
        if (retirementMarkers.some(marker => marker.test(window))) continue
        report(path, index + 1, `retired term ${term.replace(/\\\\/g, '')} asserted without a nearby retirement annotation`)
      }
    }
  }
}


// 出处标记与 08-judgement-discipline.md 的出处分级表一致：本专题不使用外部
// 资料作为证据，事实一律以 DSH 官方文件与基线为准。
const claimStatuses = new Set([
  '原文',
  '源码',
  '推断',
  '框架',
])
const claimMetrics = new Set([
  'notes-md-total',
  'notes-implemented-md',
  'architecture-extension-rows',
  'package-total',
  'package-group-total',
  'client-package-total',
  'experimental-package-total',
  'remote-import-count',
  'forwarded-event-count',
  'vendor-local-modification-count',
  'testing-doc-lines',
  'ctx-service-count',
  'notes-archived-md',
  'tool-package-count',
])

function gitOutput(args) {
  try {
    return execFileSync('git', args, {
      cwd: repositoryRoot,
      encoding: 'utf8',
      maxBuffer: 16 * 1024 * 1024,
    })
  } catch (error) {
    report(claimsPath, undefined, `git ${args[0]} failed: ${error instanceof Error ? error.message : String(error)}`)
    return ''
  }
}

function gitTrackedLines(commit, prefix) {
  return gitOutput(['ls-tree', '-r', '--name-only', commit, prefix])
    .split('\n')
    .filter(line => line.length > 0)
}

/** Every owner package (packages/<group>/<pkg>/package.json) at a commit. */
function gitPackageOwners(commit) {
  return gitOutput(['ls-tree', '-r', '--name-only', commit, 'packages'])
    .split('\n')
    .filter(line => /^packages\/[^/]+\/[^/]+\/package\.json$/.test(line))
}

function computeClaimMetric(metric) {
  if (metric === 'notes-md-total') {
    return gitTrackedLines(baselineCommit, '.agents/notes')
      .filter(line => line.endsWith('.md')).length
  }
  if (metric === 'notes-implemented-md') {
    return gitTrackedLines(baselineCommit, '.agents/notes/implemented')
      .filter(line => line.endsWith('.md')).length
  }
  if (metric === 'notes-archived-md') {
    return gitTrackedLines(baselineCommit, '.agents/notes/archived')
      .filter(line => line.endsWith('.md')).length
  }
  if (metric === 'architecture-extension-rows') {
    const source = gitOutput(['show', `${baselineCommit}:docs/architecture.md`])
    const lines = source.split(/\r?\n/)
    const header = lines.findIndex(line => line.startsWith('| Goal | Mechanism |'))
    if (header === -1) return null
    let count = 0
    for (let index = header + 2; index < lines.length; index += 1) {
      const line = lines[index]
      if (!line.startsWith('|')) break
      if (/^\|[\s:|-]+\|$/.test(line)) continue
      count += 1
    }
    return count
  }
  if (metric === 'package-total') return gitPackageOwners(baselineCommit).length
  if (metric === 'package-group-total') {
    return gitOutput(['ls-tree', '-d', '--name-only', baselineCommit, 'packages/'])
      .split('\n')
      .filter(line => /^packages\/[^/]+$/.test(line)).length
  }
  if (metric === 'client-package-total') {
    return gitPackageOwners(baselineCommit).filter(line => line.startsWith('packages/client/')).length
  }
  if (metric === 'experimental-package-total') {
    return gitPackageOwners(baselineCommit).filter(line => line.startsWith('packages/experimental/')).length
  }
  if (metric === 'remote-import-count') {
    return gitOutput(['show', `${baselineCommit}:packages/api/remotes/src/client/index.ts`])
      .split(/\r?\n/)
      .filter(line => /^import .* from '.*\/remote'/.test(line)).length
  }
  if (metric === 'forwarded-event-count') {
    const source = gitOutput(['show', `${baselineCommit}:packages/api/remotes/src/remote-events.ts`])
    const start = source.indexOf('API_REMOTE_FORWARDED_EVENTS = [')
    if (start === -1) return null
    const body = source.slice(start)
    const end = body.indexOf('\n]')
    if (end === -1) return null
    return body.slice(0, end).split(/\r?\n/).filter(line => /^\s{2}\{ event: /.test(line)).length
  }
  if (metric === 'vendor-local-modification-count') {
    const source = gitOutput(['show', `${baselineCommit}:vendor/README.md`])
    const start = source.indexOf('\n## Local modifications')
    if (start === -1) return null
    const rest = source.slice(start + 1)
    const next = rest.indexOf('\n## ', 1)
    const section = next === -1 ? rest : rest.slice(0, next)
    return section.split(/\r?\n/).filter(line => /^\d+\.\s/.test(line)).length
  }
  if (metric === 'testing-doc-lines') {
    const source = gitOutput(['show', `${baselineCommit}:docs/testing.md`])
    return source.endsWith('\n') ? source.split('\n').length - 1 : source.split('\n').length
  }
  if (metric === 'ctx-service-count') {
    return gitOutput(['show', `${baselineCommit}:docs/capability-seams.md`])
      .split(/\r?\n/).filter(line => /^\| `ctx\./.test(line)).length
  }
  if (metric === 'tool-package-count') {
    const source = gitOutput(['show', `${baselineCommit}:docs/tool-catalog.md`])
    const start = source.indexOf('## Tool Package Map')
    if (start === -1) return null
    const rest = source.slice(start + 1)
    const next = rest.indexOf('\n## ', 1)
    const section = next === -1 ? rest : rest.slice(0, next)
    return section.split(/\r?\n/).filter(line => /^\|/.test(line)).length - 2
  }
  return undefined
}

function checkClaimRegister() {
  if (!existsSync(claimsPath)) {
    report(claimsPath, undefined, 'harness-idea claim register is missing')
    return
  }
  const source = decodeText(claimsPath)
  if (source === undefined) return
  checkFileEnding(claimsPath, source)

  let register
  try {
    register = JSON.parse(source)
  } catch (error) {
    report(claimsPath, undefined, `not valid JSON (${error instanceof Error ? error.message : String(error)})`)
    return
  }
  if (register === null || typeof register !== 'object' || Array.isArray(register)) {
    report(claimsPath, undefined, 'claim register root must be a JSON object')
    return
  }

  try {
    execFileSync('git', ['cat-file', '-e', `${baselineCommit}^{commit}`], {
      cwd: repositoryRoot,
      stdio: 'ignore',
    })
  } catch {
    report(claimsPath, undefined, `baseline commit does not exist in this checkout: ${baselineCommit}`)
  }

  if (Object.hasOwn(register, 'baseline')) {
    report(claimsPath, undefined, 'baseline belongs to catalog.json; remove it from the claim register')
  }

  if (!Array.isArray(register.claims)) report(claimsPath, undefined, 'claims must be an array')
  if (!Array.isArray(register.metrics)) report(claimsPath, undefined, 'metrics must be an array')
  const entries = Array.isArray(register.claims) ? register.claims : []
  const metrics = Array.isArray(register.metrics) ? register.metrics : []
  const seen = new Set()

  for (const entry of entries) {
    const id = entry?.id
    if (typeof id !== 'string' || id.length === 0) {
      report(claimsPath, undefined, 'claim entry is missing a string id')
      continue
    }
    if (seen.has(id)) {
      report(claimsPath, undefined, `duplicate claim id ${JSON.stringify(id)}`)
      continue
    }
    seen.add(id)

    if (typeof entry.claim !== 'string' || entry.claim.trim().length === 0) {
      report(claimsPath, undefined, `${id}: claim must be a non-empty string`)
    }
    if (!claimStatuses.has(entry.status)) {
      report(claimsPath, undefined, `${id}: unknown status ${JSON.stringify(entry.status)}`)
    }
    if (typeof entry.falsified_by !== 'string' || entry.falsified_by.trim().length === 0) {
      report(claimsPath, undefined, `${id}: falsified_by must be a non-empty string`)
    }
    if (!Array.isArray(entry.sources) || entry.sources.length === 0) {
      report(claimsPath, undefined, `${id}: sources must be a non-empty array`)
      continue
    }
    for (const sourcePath of entry.sources) {
      if (typeof sourcePath !== 'string' || sourcePath.length === 0) {
        report(claimsPath, undefined, `${id}: source path must be a non-empty string`)
        continue
      }
      const target = resolve(repositoryRoot, sourcePath)
      if (!pathInsideRepository(target)) {
        report(claimsPath, undefined, `${id}: source escapes the repository: ${JSON.stringify(sourcePath)}`)
        continue
      }
      if (!existsSync(target) || !statSync(target).isFile()) {
        report(claimsPath, undefined, `${id}: source target does not exist: ${JSON.stringify(sourcePath)}`)
      }
    }
  }

  for (const metric of metrics) {
    const id = metric?.id
    if (typeof id !== 'string' || id.length === 0) {
      report(claimsPath, undefined, 'metric entry is missing a string id')
      continue
    }
    if (!claimMetrics.has(metric.metric)) {
      report(claimsPath, undefined, `${id}: unknown metric ${JSON.stringify(metric.metric)}`)
      continue
    }
    if (typeof metric.expected !== 'number') {
      report(claimsPath, undefined, `${id}: expected must be a number`)
      continue
    }
    const actual = computeClaimMetric(metric.metric)
    if (actual !== metric.expected) {
      report(claimsPath, undefined, `${id}: ${metric.metric} expected ${metric.expected}, computed ${String(actual)}`)
    }
  }

  return { claims: entries.length, metrics: metrics.length }
}

const catalogRoles = new Set(['map', 'mechanism', 'playbook', 'experiment', 'analysis'])
const catalogStatuses = new Set(['reverified', 'carried', 'unrecorded', 'needs-recheck'])
const catalogSources = new Set(['page', 'topic', 'matrix'])

/** Confirm an object name resolves as a commit in this checkout. */
function commitExists(commit) {
  try {
    execFileSync('git', ['cat-file', '-e', `${commit}^{commit}`], { cwd: repositoryRoot, stdio: 'ignore' })
    return true
  } catch {
    return false
  }
}

/**
 * Validate catalog.json and its bijection with the Markdown page tree. The
 * catalog is the single home for the baseline, the page inventory, and each
 * page's verification point; a page missing from it is not covered by any
 * regeneration path, and a stale entry fails closed.
 */
function checkCatalog(files) {
  if (catalog === null) return null
  const catalogSource = decodeText(catalogPath)
  if (catalogSource !== undefined) checkFileEnding(catalogPath, catalogSource)
  if (catalog.schemaVersion !== 1) report(catalogPath, undefined, 'schemaVersion must be 1')
  const baseline = catalog.baseline
  if (baseline === null || typeof baseline !== 'object' || Array.isArray(baseline)) {
    report(catalogPath, undefined, 'baseline must be an object')
  } else {
    if (typeof baseline.tag !== 'string' || baseline.tag.length === 0) report(catalogPath, undefined, 'baseline.tag must be a non-empty string')
    if (typeof baseline.commit !== 'string' || !/^[0-9a-f]{40}$/.test(baseline.commit)) {
      report(catalogPath, undefined, 'baseline.commit must be a 40-character lowercase commit id')
    } else if (!commitExists(baseline.commit)) {
      report(catalogPath, undefined, `baseline.commit does not exist: ${baseline.commit}`)
    }
    if (typeof baseline.tag === 'string' && typeof baseline.commit === 'string') {
      try {
        const resolved = execFileSync('git', ['rev-parse', `${baseline.tag}^{commit}`], { cwd: repositoryRoot, encoding: 'utf8' }).trim()
        if (resolved !== baseline.commit) report(catalogPath, undefined, `baseline.tag ${baseline.tag} resolves to ${resolved}, not ${baseline.commit}`)
      } catch {
        report(catalogPath, undefined, `baseline.tag does not resolve: ${baseline.tag}`)
      }
    }
  }
  if (!Array.isArray(catalog.topics)) {
    report(catalogPath, undefined, 'topics must be an array')
    return null
  }

  const seenDirs = new Set()
  const seenPages = new Map()
  let pageCount = 0
  for (const topic of catalog.topics) {
    if (topic === null || typeof topic !== 'object' || Array.isArray(topic)) {
      report(catalogPath, undefined, 'topic entry must be an object')
      continue
    }
    if (typeof topic.dir !== 'string' || topic.dir.length === 0) {
      report(catalogPath, undefined, 'topic.dir must be a non-empty string')
      continue
    }
    if (seenDirs.has(topic.dir)) report(catalogPath, undefined, `duplicate topic.dir ${topic.dir}`)
    seenDirs.add(topic.dir)
    const dir = resolve(corpusRoot, topic.dir)
    if (!pathInsideRepository(dir) || !existsSync(dir) || !statSync(dir).isDirectory()) {
      report(catalogPath, undefined, `topic.dir does not exist: ${topic.dir}`)
      continue
    }
    if (typeof topic.title !== 'string' || topic.title.trim().length === 0) report(catalogPath, undefined, `${topic.dir}: title must be a non-empty string`)
    if (typeof topic.intent !== 'string' || topic.intent.trim().length === 0) report(catalogPath, undefined, `${topic.dir}: intent must be a non-empty string`)
    if (topic.kind !== 'topic' && topic.kind !== 'group') report(catalogPath, undefined, `${topic.dir}: kind must be topic or group`)
    if (typeof topic.map !== 'string' || topic.map.length === 0) {
      report(catalogPath, undefined, `${topic.dir}: map must be a non-empty string`)
    } else if (!existsSync(resolve(dir, topic.map))) {
      report(catalogPath, undefined, `${topic.dir}: map does not exist: ${topic.map}`)
    }
    if (!Array.isArray(topic.pages)) {
      report(catalogPath, undefined, `${topic.dir}: pages must be an array`)
      continue
    }
    for (const page of topic.pages) {
      if (page === null || typeof page !== 'object' || Array.isArray(page)) {
        report(catalogPath, undefined, `${topic.dir}: page entry must be an object`)
        continue
      }
      if (typeof page.file !== 'string' || page.file.length === 0) {
        report(catalogPath, undefined, `${topic.dir}: page.file must be a non-empty string`)
        continue
      }
      const target = resolve(dir, page.file)
      const prefix = `${dir}${process.platform === 'win32' ? '\\' : '/'}`
      if (!pathInsideRepository(target) || !target.startsWith(prefix)) {
        report(catalogPath, undefined, `${topic.dir}: page escapes the topic directory: ${page.file}`)
        continue
      }
      if (!existsSync(target) || !statSync(target).isFile()) report(catalogPath, undefined, `${topic.dir}: page does not exist: ${page.file}`)
      if (seenPages.has(target)) report(catalogPath, undefined, `page appears twice: ${page.file} (${seenPages.get(target)} and ${topic.dir})`)
      seenPages.set(target, topic.dir)
      pageCount += 1
      if (!catalogRoles.has(page.role)) report(catalogPath, undefined, `${topic.dir}/${page.file}: unknown role ${JSON.stringify(page.role)}`)
      if (!catalogStatuses.has(page.status)) report(catalogPath, undefined, `${topic.dir}/${page.file}: unknown status ${JSON.stringify(page.status)}`)
      if (page.source !== null && !catalogSources.has(page.source)) report(catalogPath, undefined, `${topic.dir}/${page.file}: unknown source ${JSON.stringify(page.source)}`)
      if (page.verifiedAt !== null) {
        if (typeof page.verifiedAt !== 'string' || !/^[0-9a-f]{40}$/.test(page.verifiedAt)) {
          report(catalogPath, undefined, `${topic.dir}/${page.file}: verifiedAt must be null or a 40-character commit id`)
        } else if (!commitExists(page.verifiedAt)) {
          report(catalogPath, undefined, `${topic.dir}/${page.file}: verifiedAt does not exist: ${page.verifiedAt}`)
        }
      }
    }
  }

  const expected = new Map()
  for (const path of files) {
    if (extname(path) !== '.md') continue
    const rel = relative(corpusRoot, path)
    if (rel === '00-index.md' || rel === 'CORPUS-CHARTER.md') continue
    if (rel.startsWith('_change_log/') || rel.startsWith('_coverage/')) continue
    expected.set(path, rel)
  }
  for (const [path, rel] of expected) {
    if (!seenPages.has(path)) report(path, undefined, `page is not registered in catalog.json: ${rel}`)
  }
  for (const target of seenPages.keys()) {
    if (!expected.has(target)) report(catalogPath, undefined, `catalog page is not an inventory page: ${relative(corpusRoot, target)}`)
  }
  return { topics: catalog.topics.length, pages: pageCount }
}

/** The committed coverage matrix must equal the catalog rendering. */
function checkCoverage() {
  if (catalog === null) return
  const source = decodeText(coveragePath)
  if (source === undefined) return
  try {
    const rendered = applyCoverage(catalog, source)
    if (rendered !== source) report(coveragePath, undefined, 'generated coverage matrix is stale; run node _digested/render-indexes.mjs')
  } catch (error) {
    report(coveragePath, undefined, error instanceof Error ? error.message : String(error))
  }
}

/** Every page must be linked from its topic map. */
function checkMapLinks() {
  if (catalog === null) return
  for (const topic of catalog.topics) {
    if (!Array.isArray(topic.pages)) continue
    const mapPath = resolve(corpusRoot, topic.dir, topic.map)
    if (!existsSync(mapPath)) continue
    const source = readFileSync(mapPath, 'utf8')
    for (const page of topic.pages) {
      if (page.file === topic.map) continue
      const base = page.file.split('/').pop()
      if (!source.includes(page.file) && !source.includes(base)) {
        report(mapPath, undefined, `topic map does not link ${page.file}`)
      }
    }
  }
}

/** Every Markdown table row must have the same cell count as its header. */
function checkTables(files) {
  for (const path of files) {
    if (extname(path) !== '.md') continue
    const source = readFileSync(path, 'utf8')
    const lines = activeMarkdownLines(source)
    const count = (line) => line.replaceAll('\\|', '\u0000').split('|').length
    for (let index = 0; index + 1 < lines.length; index += 1) {
      const header = lines[index]
      if (!/^\s*\|/.test(header.text)) continue
      if (!/^\s*\|[\s:|-]+\|\s*$/.test(lines[index + 1].text)) continue
      const columns = count(header.text)
      if (count(lines[index + 1].text) !== columns) {
        report(path, lines[index + 1].line, `table delimiter has ${count(lines[index + 1].text) - 2} cells, header has ${columns - 2}`)
      }
      for (let row = index + 2; row < lines.length; row += 1) {
        if (!/^\s*\|/.test(lines[row].text)) break
        if (count(lines[row].text) !== columns) {
          report(path, lines[row].line, `table row has ${count(lines[row].text) - 2} cells, header has ${columns - 2}`)
        }
      }
    }
  }
}

/** The shared charter must be byte-identical in every sibling corpus present. */
function checkCharterCopies() {
  const charter = resolve(corpusRoot, 'CORPUS-CHARTER.md')
  if (!existsSync(charter)) return
  const expected = createHash('sha256').update(readFileSync(charter)).digest('hex')
  for (const sibling of ['_faq_on_digested', '_dsh_plugin_agent_ready_development', '_misc']) {
    const copy = resolve(repositoryRoot, sibling, 'CORPUS-CHARTER.md')
    if (!existsSync(copy)) continue
    const actual = createHash('sha256').update(readFileSync(copy)).digest('hex')
    if (actual !== expected) report(copy, undefined, 'charter copy differs from _digested/CORPUS-CHARTER.md')
  }
}

/** Page-level baseline declarations are retired; the catalog owns the baseline. */
function checkBaselineDeclarations(files) {
  for (const path of files) {
    if (extname(path) !== '.md') continue
    const rel = relative(corpusRoot, path)
    if (rel === '00-index.md' || rel === 'CORPUS-CHARTER.md') continue
    if (rel.startsWith('_change_log/') || rel.startsWith('_coverage/')) continue
    const lines = readFileSync(path, 'utf8').split('\n')
    for (let index = 0; index < lines.length; index += 1) {
      if (/(产品源码基线|专题基线)[：:]/.test(lines[index])) {
        report(path, index + 1, 'page-level baseline declaration is retired; register the page in catalog.json instead')
      }
    }
  }
}

const files = corpusFiles(corpusRoot)
let markdownCount = 0
let scriptCount = 0
let svgCount = 0
let claimRegister = null

for (const path of files) {
  const source = decodeText(path)
  if (source === undefined) continue
  checkFileEnding(path, source)
  if (extname(path) === '.md') {
    markdownCount += 1
    checkMarkdownLinks(path, source)
  } else if (extname(path) === '.svg') {
    svgCount += 1
    checkSvg(path, source)
  } else {
    scriptCount += 1
  }
}

const catalogSummary = checkCatalog(files)
checkCoverage()
checkMapLinks()
checkTables(files)
checkCharterCopies()
checkBaselineDeclarations(files)
claimRegister = checkClaimRegister()
checkOrphanPages()
checkRetiredTerms(files)

if (failures.length > 0) {
  console.error(`_digested verification failed with ${failures.length} problem(s):`)
  for (const failure of failures) console.error(`  ${failure}`)
  process.exitCode = 1
} else {
  const claims = claimRegister === null ? 'no claim register' : `${claimRegister.claims} claims and ${claimRegister.metrics} computed metrics`
  const inventory = catalogSummary === null ? '' : ` ${catalogSummary.topics} topics / ${catalogSummary.pages} catalog pages;`
  console.log(`_digested verification passed: ${markdownCount} Markdown files, ${scriptCount} scripts, ${svgCount} SVG files,${inventory} and ${claims}.`)
}
