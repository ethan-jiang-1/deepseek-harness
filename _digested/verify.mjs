/**
 * Self-contained integrity checks for the source-digestion corpus.
 *
 * Validates strict UTF-8 and one trailing LF for corpus text, relative
 * Markdown links and fragments, every SVG figure's XML and entities, and the
 * harness-idea claim register in harness-idea/claims.json.
 */

import {
  execFileSync,
} from 'node:child_process'
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

const corpusRoot = dirname(fileURLToPath(import.meta.url))
const repositoryRoot = dirname(corpusRoot)
const decoder = new TextDecoder('utf-8', { fatal: true })
const failures = []

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
      if (isExternal(url)) continue
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

const EXPECTED_BASELINE = '46a7f68b0922371ce7144b668b90e377d8e799f4'
const claimsPath = resolve(corpusRoot, 'harness-idea', 'claims.json')
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
  'invariant-total',
  'invariant-published',
  'invariant-omitted',
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

/**
 * Invariant companion owners split by publish / omit at a commit.
 * rc.1 起政策改为「只在有独立可观察关系时 publish ./invariant，否则省略」，
 * 带 "No runtime invariant:" 标记的空 companion 已被废除（见
 * .agents/notes/implemented/simplification/2026-08-28-omit-unneeded-invariant-companions.md）。
 * 空/忽略 reporter 由 verify-package-invariants 判 fail，因此 publish 即真实。
 */
function invariantCompanionCounts(commit) {
  const manifests = gitPackageOwners(commit)
  const publishedPaths = new Set(
    gitOutput(['ls-tree', '-r', '--name-only', commit, 'packages'])
      .split('\n')
      .filter(line => line.endsWith('/src/invariant.ts'))
  )
  const counts = { total: manifests.length, published: 0, omitted: 0 }
  for (const manifest of manifests) {
    const sourcePath = `${manifest.replace(/package\.json$/, '')}src/invariant.ts`
    if (publishedPaths.has(sourcePath)) counts.published += 1
    else counts.omitted += 1
  }
  return counts
}

function computeClaimMetric(metric) {
  if (metric === 'notes-md-total') {
    return gitTrackedLines(EXPECTED_BASELINE, '.agents/notes')
      .filter(line => line.endsWith('.md')).length
  }
  if (metric === 'notes-implemented-md') {
    return gitTrackedLines(EXPECTED_BASELINE, '.agents/notes/implemented')
      .filter(line => line.endsWith('.md')).length
  }
  if (metric === 'architecture-extension-rows') {
    const source = gitOutput(['show', `${EXPECTED_BASELINE}:docs/architecture.md`])
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
  if (metric === 'invariant-total'
    || metric === 'invariant-published'
    || metric === 'invariant-omitted') {
    const counts = invariantCompanionCounts(EXPECTED_BASELINE)
    return metric === 'invariant-total' ? counts.total
      : metric === 'invariant-published' ? counts.published
        : counts.omitted
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
    execFileSync('git', ['cat-file', '-e', `${EXPECTED_BASELINE}^{commit}`], {
      cwd: repositoryRoot,
      stdio: 'ignore',
    })
  } catch {
    report(claimsPath, undefined, `baseline commit does not exist in this checkout: ${EXPECTED_BASELINE}`)
  }

  if (register.baseline !== EXPECTED_BASELINE) {
    report(claimsPath, undefined, `baseline must be ${EXPECTED_BASELINE}, got ${JSON.stringify(register.baseline)}`)
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

claimRegister = checkClaimRegister()

if (failures.length > 0) {
  console.error(`_digested verification failed with ${failures.length} problem(s):`)
  for (const failure of failures) console.error(`  ${failure}`)
  process.exitCode = 1
} else {
  const claims = claimRegister === null ? 'no claim register' : `${claimRegister.claims} claims and ${claimRegister.metrics} computed metrics`
  console.log(`_digested verification passed: ${markdownCount} Markdown files, ${scriptCount} scripts, ${svgCount} SVG files, and ${claims}.`)
}
