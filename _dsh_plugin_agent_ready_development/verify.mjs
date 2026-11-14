/** Self-contained integrity checks for the Agent-ready Development corpus. */

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
  sep,
} from 'node:path'
import { fileURLToPath } from 'node:url'

const corpusRoot = dirname(fileURLToPath(import.meta.url))
const repositoryRoot = dirname(corpusRoot)
const decoder = new TextDecoder('utf-8', { fatal: true })
const failures = []
const forbiddenResearchReferences = [
  '_change_log',
  '_digested',
  '_faq_on_digested',
]
// Corpus file links track the upstream default branch (`master`), never a release tag or branch SHA,
// while immutable event permalinks (`/commit/`, `/pull/`, `/issues/`, `/discussions/`) stay allowed per CORPUS-CHARTER.md.
const dshExternalUrl = /^https:\/\/github\.com\/deepseek-ai\/deepseek-harness\/(?:(?:blob|tree)\/master(?:[/?#]|$)|(?:commit|discussions|issues|pull)\/)/
const siblingCharterDirectories = ['_digested', '_faq_on_digested', '_misc']
const forbiddenContentPatterns = [
  { pattern: new RegExp(`${'prove'}${'nance'}`, 'i'), reason: 'contains banned origin label' },
  { pattern: /github\.com\/deepseek-harness\b/i, reason: 'uses wrong GitHub organization (expected deepseek-ai/deepseek-harness)' },
  { pattern: /该死的代码/u, reason: 'contains literal mistranslation of dead code ("该死的代码")' },
]
const readerAuditLeakagePatterns = [
  /\b00(?:0[7-9]|1\d)\s*(?:轮|复核|跨度|注记|独立反查)/u,
  /\brc\.\d+\s*轮复核/u,
  /(?:产品源码|专题|本页)基线\s*[：:]/u,
  /现行(?:源码与文档)?核验基线/u,
  /本轮已(?:逐一|完成|复核|核对)/u,
]
const readerVolatileCountPatterns = [
  /\b(?:[0-9]+|[一二三四五六七八九十百]+)\s*个\s*(?:rescoped\s+Cordis\s*包|子树|repository\s+development\s+Skills)/iu,
  /proposed\s*目录有\s*[0-9]+\s*篇/u,
  /implemented\s*[0-9]+.*archived\s*[0-9]+/iu,
]
const allowedInventoryRoles = new Set(['map', 'mechanism', 'playbook', 'experiment', 'governance'])
const allowedInventoryStatuses = new Set(['reverified', 'carried', 'unrecorded'])

function corpusFiles(directory) {
  const files = []
  for (const entry of readdirSync(directory, { withFileTypes: true })) {
    const path = resolve(directory, entry.name)
    if (entry.isDirectory()) files.push(...corpusFiles(path))
    else if (entry.isFile() && ['.md', '.mjs', '.svg'].includes(extname(entry.name))) files.push(path)
  }
  return files.sort()
}

function corpusDirectories(directory) {
  const directories = [directory]
  for (const entry of readdirSync(directory, { withFileTypes: true })) {
    if (entry.isDirectory()) directories.push(...corpusDirectories(resolve(directory, entry.name)))
  }
  return directories.sort()
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
  if (!source.endsWith('\n')) report(path, undefined, 'must end with one trailing newline')
  else if (source.endsWith('\n\n')) report(path, undefined, 'must end with exactly one trailing newline')
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
      url = inside.match(/^(?:\\.|\S)+/)?.[0]
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

function pathInsideCorpus(path) {
  const fromRoot = relative(corpusRoot, path)
  return fromRoot !== '..' && !fromRoot.startsWith(`..${sep}`) && !isAbsolute(fromRoot)
}

const referencedSvgPaths = new Set()

function owningFiguresDirectory(markdownPath) {
  const fromRoot = relative(corpusRoot, markdownPath).split(sep)
  if (fromRoot[0] === 'native-development-model') return resolve(corpusRoot, 'native-development-model/figures')
  if (fromRoot[0] === 'sdlc-reference') return resolve(corpusRoot, 'sdlc-reference/figures')
  if (fromRoot[0] === 'repo-harness') return resolve(corpusRoot, 'repo-harness/figures')
  return undefined
}

function parseTableCells(rawLine) {
  const stripped = rawLine.replace(/^ {0,3}(?:>\s*)*/, '').trim()
  if (!stripped.includes('|')) return undefined
  const masked = maskInlineCode(stripped)
  const pipePositions = []
  for (let index = 0; index < masked.length; index += 1) {
    if (masked[index] === '\\') {
      index += 1
      continue
    }
    if (masked[index] === '|') pipePositions.push(index)
  }
  if (pipePositions.length === 0) return undefined
  let start = 0
  let end = stripped.length
  if (pipePositions[0] === 0) start = 1
  if (pipePositions.at(-1) === stripped.length - 1 && pipePositions.at(-1) >= start) end = stripped.length - 1
  const cells = []
  let cellStart = start
  for (const pos of pipePositions) {
    if (pos < start || pos >= end) continue
    cells.push(stripped.slice(cellStart, pos).trim())
    cellStart = pos + 1
  }
  cells.push(stripped.slice(cellStart, end).trim())
  return cells
}

function isDelimiterRow(cells) {
  return cells !== undefined
    && cells.length > 0
    && cells.every(cell => /^:?-{1,}:?$/.test(cell))
}

function checkMarkdownTables(path, activeLines) {
  for (let index = 0; index < activeLines.length - 1; index += 1) {
    const header = activeLines[index]
    const next = activeLines[index + 1]
    if (next.line !== header.line + 1) continue
    const headerCells = parseTableCells(header.text)
    const delimiterCells = parseTableCells(next.text)
    if (headerCells === undefined || !isDelimiterRow(delimiterCells)) continue
    const expectedColumns = headerCells.length
    if (delimiterCells.length !== expectedColumns) {
      report(path, next.line, `Markdown table delimiter has ${delimiterCells.length} column(s), expected ${expectedColumns}`)
    }
    index += 2
    while (index < activeLines.length && activeLines[index].line === activeLines[index - 1].line + 1) {
      const rowCells = parseTableCells(activeLines[index].text)
      if (rowCells === undefined) break
      if (rowCells.length !== expectedColumns) {
        report(path, activeLines[index].line, `Markdown table row has ${rowCells.length} column(s), expected ${expectedColumns}`)
      }
      index += 1
    }
    index -= 1
  }
}

function isGovernanceOrCoverageMarkdown(path) {
  if (path === resolve(corpusRoot, 'CORPUS-CHARTER.md')) return true
  const fromRoot = relative(corpusRoot, path).split(sep)
  return fromRoot[0] === '_coverage'
}

function checkForbiddenContent(path, source) {
  const lines = source.split('\n')
  for (let index = 0; index < lines.length; index += 1) {
    const line = lines[index]
    for (const { pattern, reason } of forbiddenContentPatterns) {
      if (pattern.test(line)) report(path, index + 1, reason)
    }
  }
}

function checkMarkdown(path, source) {
  // The shared charter is governance, not corpus content: it is byte-identical in every
  // sibling corpus and names corpus-level conventions such as `_change_log/`. Content pages
  // must stay self-contained, so the sibling-name rule applies to them only.
  if (path !== resolve(corpusRoot, 'CORPUS-CHARTER.md')) {
    for (const forbidden of forbiddenResearchReferences) {
      if (source.includes(forbidden)) report(path, undefined, `references sibling research corpus ${JSON.stringify(forbidden)}`)
    }
  }
  checkForbiddenContent(path, source)

  const activeLines = activeMarkdownLines(source)
  checkMarkdownTables(path, activeLines)

  const checkReaderLeakage = !isGovernanceOrCoverageMarkdown(path)
  for (const { line, text } of activeLines) {
    if (checkReaderLeakage) {
      const proseOnly = maskInlineCode(text)
      for (const pattern of readerAuditLeakagePatterns) {
        const match = proseOnly.match(pattern) ?? text.match(pattern)
        if (match !== null) {
          report(path, line, `reader page leaks internal round/baseline audit note (${JSON.stringify(match[0])}); move maintenance history to _coverage/00-corpus-maintenance.md`)
          break
        }
      }
      for (const pattern of readerVolatileCountPatterns) {
        const match = proseOnly.match(pattern)
        if (match !== null) {
          report(path, line, `reader page hardcodes volatile master-repo count (${JSON.stringify(match[0])}); state invariant rules instead`)
          break
        }
      }
    }
    for (const url of markdownUrls(text)) {
      if (isExternal(url)) {
        if (!dshExternalUrl.test(url)) report(path, line, `external link must target the DSH repository: ${JSON.stringify(url)}`)
        continue
      }
      const parts = linkParts(url)
      if (parts.path === undefined || (url.includes('#') && parts.fragment === undefined)) {
        report(path, line, `malformed percent escape in link ${JSON.stringify(url)}`)
        continue
      }
      const target = parts.path === '' ? path : resolve(dirname(path), parts.path)
      if (!pathInsideCorpus(target)) {
        report(path, line, `relative link escapes the corpus; use a pinned DSH URL for DSH evidence: ${JSON.stringify(url)}`)
        continue
      }
      if (!existsSync(target)) {
        report(path, line, `relative link target does not exist: ${JSON.stringify(url)}`)
        continue
      }
      if (extname(target).toLowerCase() === '.svg') {
        referencedSvgPaths.add(target)
        const figuresDirectory = owningFiguresDirectory(path)
        if (figuresDirectory === undefined) {
          report(path, line, `Markdown outside a topic cannot reference SVGs: ${JSON.stringify(url)}`)
        } else if (dirname(target) !== figuresDirectory) {
          report(path, line, `SVG must come from this Markdown subtree's figures directory: ${JSON.stringify(url)}`)
        }
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
      return
    }
    index += name.length
    while (/\s/.test(body[index] ?? '')) index += 1
    if (body[index] !== '=') {
      report(path, xmlLocation(source, bodyOffset + index), `attribute ${JSON.stringify(name)} is missing =`)
      return
    }
    index += 1
    while (/\s/.test(body[index] ?? '')) index += 1
    const quote = body[index]
    if (quote !== '"' && quote !== "'") {
      report(path, xmlLocation(source, bodyOffset + index), `attribute ${JSON.stringify(name)} must use quotes`)
      return
    }
    const valueStart = index + 1
    const valueEnd = body.indexOf(quote, valueStart)
    if (valueEnd === -1) {
      report(path, xmlLocation(source, bodyOffset + index), `attribute ${JSON.stringify(name)} has no closing quote`)
      return
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

function checkSvgRoot(path, source, attributes) {
  const width = attributes.get('width')
  const height = attributes.get('height')
  const viewBox = attributes.get('viewBox')?.trim().split(/\s+/).map(Number)
  if (width === undefined || !/^\d+(?:\.\d+)?$/.test(width) || Number(width) <= 0) {
    report(path, 1, 'root <svg> must declare a positive numeric width')
  }
  if (height === undefined || !/^\d+(?:\.\d+)?$/.test(height) || Number(height) <= 0) {
    report(path, 1, 'root <svg> must declare a positive numeric height')
  }
  if (viewBox === undefined || viewBox.length !== 4 || viewBox.some(value => !Number.isFinite(value)) || viewBox[2] <= 0 || viewBox[3] <= 0) {
    report(path, 1, 'root <svg> must declare a valid viewBox')
  } else if (width !== undefined && height !== undefined && (Number(width) !== viewBox[2] || Number(height) !== viewBox[3])) {
    report(path, 1, 'root width and height must match the viewBox dimensions')
  }
  if (attributes.get('role') !== 'img') report(path, 1, 'root <svg> must declare role="img"')
  if (attributes.get('aria-labelledby') !== 'title desc') {
    report(path, 1, 'root <svg> must declare aria-labelledby="title desc"')
  }

  for (const name of ['title', 'desc']) {
    const element = source.match(new RegExp(`<${name}\\b([^>]*)>([^<]*)<\\/${name}>`))
    if (element === null || !new RegExp(`\\bid=(["'])${name}\\1`).test(element[1]) || element[2].trim() === '') {
      report(path, undefined, `<${name}> must be non-empty and declare id="${name}"`)
    }
  }
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

function decodeXmlEntities(text) {
  return text
    .replaceAll('&amp;', '&')
    .replaceAll('&lt;', '<')
    .replaceAll('&gt;', '>')
    .replaceAll('&quot;', '"')
    .replaceAll('&apos;', "'")
    .replace(/&#x([0-9a-fA-F]+);/g, (_, hex) => String.fromCodePoint(Number.parseInt(hex, 16)))
    .replace(/&#([0-9]+);/g, (_, dec) => String.fromCodePoint(Number.parseInt(dec, 10)))
}

function estimateSvgTextWidth(text, fontSize) {
  let units = 0
  for (const ch of text) {
    const cp = ch.codePointAt(0)
    if (
      (cp >= 0x2e80 && cp <= 0x9fff)
      || (cp >= 0xf900 && cp <= 0xfaff)
      || (cp >= 0xfe30 && cp <= 0xfe4f)
      || (cp >= 0xff01 && cp <= 0xff60)
      || (cp >= 0xffe0 && cp <= 0xffe6)
    ) {
      units += 1.0
    } else if ('mwMW@%'.includes(ch)) {
      units += 0.72
    } else if ('ilI1.,:;|!\'"`()[]{} '.includes(ch)) {
      units += 0.34
    } else {
      units += 0.54
    }
  }
  return units * fontSize
}

function parseTranslateOffset(transform) {
  if (!transform) return { dx: 0, dy: 0, nonTranslate: false }
  let dx = 0
  let dy = 0
  let stripped = transform
  for (const match of transform.matchAll(/translate\(\s*(-?\d+(?:\.\d+)?)(?:[\s,]+(-?\d+(?:\.\d+)?))?\s*\)/g)) {
    dx += Number(match[1])
    dy += Number(match[2] ?? 0)
    stripped = stripped.replace(match[0], '')
  }
  return { dx, dy, nonTranslate: stripped.trim() !== '' }
}

function checkSvgTextGeometry(path, viewBox, rects, texts) {
  if (viewBox === undefined || viewBox.length !== 4 || viewBox[2] <= 0 || viewBox[3] <= 0) return
  const [vbX, vbY, vbW, vbH] = viewBox
  const cardRects = rects.filter(rect => rect.w >= 90 && rect.h >= 20 && !(rect.w >= vbW * 0.95 && rect.h >= vbH * 0.95))

  for (const item of texts) {
    const content = decodeXmlEntities(item.rawText).replace(/\s+/g, ' ').trim()
    if (content === '') continue
    const width = estimateSvgTextWidth(content, item.fontSize)
    const rotateMatch = item.transform.match(/rotate\(\s*(-?90)\b/)
    if (rotateMatch !== null) {
      const top = item.anchor === 'middle' ? item.y - width / 2 : item.y - width
      const bottom = item.anchor === 'middle' ? item.y + width / 2 : item.y
      if (item.x - item.fontSize < vbX - 2 || item.x + item.fontSize > vbX + vbW + 2 || top < vbY - 2 || bottom > vbY + vbH + 2) {
        report(path, item.line, `rotated SVG <text> (${JSON.stringify(content)}) overflows viewBox bounds`)
      }
      continue
    }
    if (item.hasNonTranslate) continue

    const left = item.anchor === 'middle' ? item.x - width / 2 : item.anchor === 'end' ? item.x - width : item.x
    const right = item.anchor === 'middle' ? item.x + width / 2 : item.anchor === 'end' ? item.x : item.x + width
    if (left < vbX - 2 || right > vbX + vbW + 2 || item.y < vbY || item.y > vbY + vbH) {
      report(path, item.line, `SVG <text> (${JSON.stringify(content)}) overflows viewBox bounds [${vbX}, ${vbX + vbW}]`)
      continue
    }

    const enclosing = cardRects
      .filter(rect => item.x >= rect.x && item.x <= rect.x + rect.w && item.y >= rect.y && item.y <= rect.y + rect.h)
      .sort((a, b) => (a.w * a.h) - (b.w * b.h))[0]
    if (enclosing !== undefined && (left < enclosing.x - 2 || right > enclosing.x + enclosing.w + 2)) {
      report(path, item.line, `SVG <text> (${JSON.stringify(content)}) overflows enclosing <rect> [${enclosing.x}, ${enclosing.x + enclosing.w}]`)
    }
  }
}

function checkSvg(path, source) {
  for (const forbidden of forbiddenResearchReferences) {
    if (source.includes(forbidden)) report(path, undefined, `references sibling research corpus ${JSON.stringify(forbidden)}`)
  }
  checkForbiddenContent(path, source)

  const stack = []
  const rects = []
  const texts = []
  let activeText
  let rootViewBox
  let rootSeen = false
  let rootClosed = false
  let index = 0
  const nonRenderedContainers = new Set(['defs', 'clipPath', 'mask', 'marker', 'symbol'])

  while (index < source.length) {
    const open = source.indexOf('<', index)
    const textEnd = open === -1 ? source.length : open
    const value = source.slice(index, textEnd)
    checkEntities(path, source, value, index)
    if (stack.length === 0 && value.trim() !== '') report(path, xmlLocation(source, index), 'text appears outside the root element')
    if (activeText !== undefined) activeText.rawText += value
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
      if (name === undefined) report(path, xmlLocation(source, open), 'invalid XML closing tag')
      else if (stack.at(-1)?.name !== name) report(path, xmlLocation(source, open), `closing </${name}> does not match <${stack.at(-1)?.name ?? 'none'}>`)
      else {
        if (name === 'text' && activeText !== undefined) {
          texts.push(activeText)
          activeText = undefined
        }
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
    if (rootClosed) report(path, xmlLocation(source, open), 'more than one root element')
    const isRoot = !rootSeen
    if (isRoot) {
      rootSeen = true
      if (name !== 'svg') report(path, xmlLocation(source, open), `root element must be <svg>, got <${name}>`)
    }
    const attributes = parseAttributes(path, source, tag.slice(nameStart + name.length), open + 1 + nameStart + name.length, isRoot)
    if (isRoot && attributes !== undefined) {
      checkSvgRoot(path, source, attributes)
      const parsedVb = attributes.get('viewBox')?.trim().split(/\s+/).map(Number)
      if (parsedVb?.length === 4 && parsedVb.every(Number.isFinite)) rootViewBox = parsedVb
    }

    const parentState = stack.at(-1)
    const ownFontSize = Number(attributes?.get('font-size'))
    const effectiveFontSize = Number.isFinite(ownFontSize) && ownFontSize > 0 ? ownFontSize : (parentState?.fontSize ?? 14)
    const ownTransform = attributes?.get('transform') ?? ''
    const parsedTransform = parseTranslateOffset(ownTransform)
    const dx = (parentState?.dx ?? 0) + parsedTransform.dx
    const dy = (parentState?.dy ?? 0) + parsedTransform.dy
    const hasNonTranslate = Boolean(parentState?.hasNonTranslate || parsedTransform.nonTranslate)
    const combinedTransform = [parentState?.transform ?? '', ownTransform].filter(Boolean).join(' ')
    const inNonRendered = stack.some(entry => nonRenderedContainers.has(entry.name)) || nonRenderedContainers.has(name)

    if (!inNonRendered && attributes !== undefined) {
      if (name === 'rect') {
        const rx = Number(attributes.get('x') ?? 0)
        const ry = Number(attributes.get('y') ?? 0)
        const rw = Number(attributes.get('width') ?? NaN)
        const rh = Number(attributes.get('height') ?? NaN)
        if (Number.isFinite(rx) && Number.isFinite(ry) && Number.isFinite(rw) && Number.isFinite(rh) && !hasNonTranslate) {
          rects.push({ x: rx + dx, y: ry + dy, w: rw, h: rh })
        }
      } else if (name === 'text' && !selfClosing) {
        const tx = Number(attributes.get('x') ?? NaN)
        const ty = Number(attributes.get('y') ?? NaN)
        if (Number.isFinite(tx) && Number.isFinite(ty)) {
          activeText = {
            line: xmlLocation(source, open),
            x: tx + dx,
            y: ty + dy,
            fontSize: effectiveFontSize,
            anchor: attributes.get('text-anchor') ?? parentState?.anchor ?? 'start',
            transform: combinedTransform,
            hasNonTranslate,
            rawText: '',
          }
        }
      }
    }

    if (!selfClosing) {
      stack.push({
        name,
        fontSize: effectiveFontSize,
        anchor: attributes?.get('text-anchor') ?? parentState?.anchor ?? 'start',
        dx,
        dy,
        hasNonTranslate,
        transform: combinedTransform,
      })
    } else if (isRoot) {
      rootClosed = true
    }
    index = end + 1
  }

  if (!rootSeen) report(path, undefined, 'has no root <svg> element')
  if (stack.length > 0) report(path, undefined, `unclosed XML tag <${stack.at(-1).name}>`)
  else checkSvgTextGeometry(path, rootViewBox, rects, texts)
}

function checkMarkdownInventory(markdownPaths) {
  const maintenancePath = resolve(corpusRoot, '_coverage/00-corpus-maintenance.md')
  if (!existsSync(maintenancePath)) {
    report(maintenancePath, undefined, 'missing corpus maintenance ledger _coverage/00-corpus-maintenance.md')
    return
  }
  const source = decodeText(maintenancePath)
  if (source === undefined) return
  const activeLines = activeMarkdownLines(source)
  let tableFound = false
  const recordedPaths = new Map()
  const actualSet = new Set(markdownPaths)

  for (let index = 0; index < activeLines.length - 1; index += 1) {
    const header = activeLines[index]
    const next = activeLines[index + 1]
    if (next.line !== header.line + 1) continue
    const headerCells = parseTableCells(header.text)
    const delimiterCells = parseTableCells(next.text)
    if (
      headerCells === undefined
      || !isDelimiterRow(delimiterCells)
      || headerCells.length !== 4
      || headerCells[0] !== '页面路径'
      || headerCells[1] !== 'role'
      || headerCells[2] !== 'verifiedAt'
      || headerCells[3] !== 'status'
    ) {
      continue
    }
    tableFound = true
    index += 2
    while (index < activeLines.length && activeLines[index].line === activeLines[index - 1].line + 1) {
      const rowLine = activeLines[index].line
      const cells = parseTableCells(activeLines[index].text)
      if (cells === undefined) break
      if (cells.length === 4) {
        const rawRel = cells[0].replace(/^`+|`+$/g, '').trim()
        const role = cells[1].replace(/^`+|`+$/g, '').trim()
        const verifiedAt = cells[2].replace(/^`+|`+$/g, '').trim()
        const status = cells[3].replace(/^`+|`+$/g, '').trim()
        if (!allowedInventoryRoles.has(role)) {
          report(maintenancePath, rowLine, `invalid inventory role ${JSON.stringify(role)} for ${JSON.stringify(rawRel)}`)
        }
        if (!/^\d{4}-\d{2}-\d{2}$/.test(verifiedAt)) {
          report(maintenancePath, rowLine, `invalid inventory verifiedAt date ${JSON.stringify(verifiedAt)} for ${JSON.stringify(rawRel)}`)
        }
        if (!allowedInventoryStatuses.has(status)) {
          report(maintenancePath, rowLine, `invalid inventory status ${JSON.stringify(status)} for ${JSON.stringify(rawRel)}`)
        }
        const resolved = resolve(corpusRoot, rawRel)
        if (!pathInsideCorpus(resolved) || extname(resolved) !== '.md') {
          report(maintenancePath, rowLine, `inventory entry must name a corpus Markdown path: ${JSON.stringify(rawRel)}`)
        } else if (recordedPaths.has(resolved)) {
          report(maintenancePath, rowLine, `duplicate inventory entry for ${JSON.stringify(rawRel)}`)
        } else {
          recordedPaths.set(resolved, rowLine)
          if (!actualSet.has(resolved)) {
            report(maintenancePath, rowLine, `inventory entry does not exist on disk: ${JSON.stringify(rawRel)}`)
          }
        }
      }
      index += 1
    }
    break
  }

  if (!tableFound) {
    report(maintenancePath, undefined, 'missing canonical page inventory table (| 页面路径 | role | verifiedAt | status |)')
    return
  }

  for (const mdPath of markdownPaths) {
    if (!recordedPaths.has(mdPath)) {
      report(maintenancePath, undefined, `Markdown file is missing from _coverage/00-corpus-maintenance.md inventory: ${JSON.stringify(relative(corpusRoot, mdPath).replaceAll(sep, '/'))}`)
    }
  }
}

const files = corpusFiles(corpusRoot)
const directories = corpusDirectories(corpusRoot)
const markdownPaths = []
let markdownCount = 0
let scriptCount = 0
let svgCount = 0

// 落地页不用 README.md：仓库的 bilingual pairing 门禁把任意 README.md 当产品文档语料。
// 该目录已有 00-index.md（卷内容页）时，落地页退到 00-map.md。
const landingPageNames = ['00-index.md', '00-map.md']

for (const directory of directories) {
  const landing = landingPageNames
    .map(name => resolve(directory, name))
    .find(candidate => existsSync(candidate) && statSync(candidate).isFile())
  if (landing === undefined) report(directory, undefined, `directory must contain ${landingPageNames.join(' or ')}`)
}

for (const path of files) {
  const source = decodeText(path)
  if (source === undefined) continue
  checkFileEnding(path, source)
  if (extname(path) === '.md') {
    markdownCount += 1
    markdownPaths.push(path)
    checkMarkdown(path, source)
  } else if (extname(path) === '.svg') {
    svgCount += 1
    checkSvg(path, source)
  } else {
    scriptCount += 1
  }
}

checkMarkdownInventory(markdownPaths)

for (const path of files) {
  if (extname(path) === '.svg' && !referencedSvgPaths.has(path)) report(path, undefined, 'SVG is not referenced by Markdown')
}

const localCharterPath = resolve(corpusRoot, 'CORPUS-CHARTER.md')
if (existsSync(localCharterPath)) {
  const localCharterHash = createHash('sha256').update(readFileSync(localCharterPath)).digest('hex')
  for (const sibling of siblingCharterDirectories) {
    const siblingCharterPath = resolve(repositoryRoot, sibling, 'CORPUS-CHARTER.md')
    if (!existsSync(siblingCharterPath)) continue
    const siblingHash = createHash('sha256').update(readFileSync(siblingCharterPath)).digest('hex')
    if (siblingHash !== localCharterHash) {
      report(localCharterPath, undefined, `CORPUS-CHARTER.md diverges from ${sibling}/CORPUS-CHARTER.md`)
    }
  }
}

if (failures.length > 0) {
  console.error(`_dsh_plugin_agent_ready_development verification failed with ${failures.length} problem(s):`)
  for (const failure of failures) console.error(`  ${failure}`)
  process.exitCode = 1
} else {
  console.log(`_dsh_plugin_agent_ready_development verification passed: ${markdownCount} Markdown files, ${scriptCount} scripts, ${svgCount} SVG files.`)
}
