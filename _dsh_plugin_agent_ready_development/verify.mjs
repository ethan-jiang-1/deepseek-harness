/** Self-contained integrity checks for the Agent-ready Development corpus. */

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
const dshExternalUrl = /^https:\/\/github\.com\/deepseek-ai\/deepseek-harness\/(?:blob|tree)\/dsh-v0\.2\.0-rc\.2(?:[/?#]|$)/

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

function checkMarkdown(path, source) {
  for (const forbidden of forbiddenResearchReferences) {
    if (source.includes(forbidden)) report(path, undefined, `references sibling research corpus ${JSON.stringify(forbidden)}`)
  }

  for (const { line, text } of activeMarkdownLines(source)) {
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

function checkSvg(path, source) {
  const stack = []
  let rootSeen = false
  let rootClosed = false
  let index = 0

  while (index < source.length) {
    const open = source.indexOf('<', index)
    const textEnd = open === -1 ? source.length : open
    const value = source.slice(index, textEnd)
    checkEntities(path, source, value, index)
    if (stack.length === 0 && value.trim() !== '') report(path, xmlLocation(source, index), 'text appears outside the root element')
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
      else if (stack.at(-1) !== name) report(path, xmlLocation(source, open), `closing </${name}> does not match <${stack.at(-1) ?? 'none'}>`)
      else {
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
    if (isRoot && attributes !== undefined) checkSvgRoot(path, source, attributes)
    if (!selfClosing) stack.push(name)
    else if (isRoot) rootClosed = true
    index = end + 1
  }

  if (!rootSeen) report(path, undefined, 'has no root <svg> element')
  if (stack.length > 0) report(path, undefined, `unclosed XML tag <${stack.at(-1)}>`)
}

const files = corpusFiles(corpusRoot)
const directories = corpusDirectories(corpusRoot)
let markdownCount = 0
let scriptCount = 0
let svgCount = 0

for (const directory of directories) {
  const readme = resolve(directory, 'README.md')
  if (!existsSync(readme) || !statSync(readme).isFile()) report(directory, undefined, 'directory must contain README.md')
}

for (const path of files) {
  const source = decodeText(path)
  if (source === undefined) continue
  checkFileEnding(path, source)
  if (extname(path) === '.md') {
    markdownCount += 1
    checkMarkdown(path, source)
  } else if (extname(path) === '.svg') {
    svgCount += 1
    checkSvg(path, source)
  } else {
    scriptCount += 1
  }
}

for (const path of files) {
  if (extname(path) === '.svg' && !referencedSvgPaths.has(path)) report(path, undefined, 'SVG is not referenced by Markdown')
}

if (failures.length > 0) {
  console.error(`_dsh_plugin_agent_ready_development verification failed with ${failures.length} problem(s):`)
  for (const failure of failures) console.error(`  ${failure}`)
  process.exitCode = 1
} else {
  console.log(`_dsh_plugin_agent_ready_development verification passed: ${markdownCount} Markdown files, ${scriptCount} scripts, ${svgCount} SVG files.`)
}
