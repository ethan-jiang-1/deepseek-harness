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
const failures = []
const warnings = []

function corpusFiles(directory) {
  const files = []
  for (const entry of readdirSync(directory, { withFileTypes: true })) {
    const path = resolve(directory, entry.name)
    if (entry.isDirectory()) files.push(...corpusFiles(path))
    else if (entry.isFile() && extname(entry.name) === '.md') files.push(path)
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
      if (isExternal(url)) continue
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

const files = corpusFiles(corpusRoot)
let markdownCount = 0

for (const path of files) {
  const source = decodeText(path)
  if (source === undefined) continue
  markdownCount += 1
  checkFileEnding(path, source)
  checkMarkdownLinks(path, source)
}

if (failures.length > 0) {
  console.error(`_faq_on_digested verification failed with ${failures.length} problem(s):`)
  for (const failure of failures) console.error(`  ${failure}`)
  process.exitCode = 1
} else {
  console.log(`_faq_on_digested verification passed: ${markdownCount} Markdown files, links and anchors resolve.`)
}
if (warnings.length > 0) {
  console.error(`${warnings.length} citation(s) resolve outside the repository (left unverified):`)
  for (const warning of warnings) console.error(`  ${warning}`)
}
