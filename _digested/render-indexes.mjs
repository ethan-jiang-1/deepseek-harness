// Generate the coverage matrix from catalog.json.
//
// The catalog is the single source for the product baseline, the page
// inventory, and each page's last verification point. This script renders the
// matrix between the catalog markers; `verify.mjs` compares the rendered text
// with the committed block so a hand edit fails the gate.
//
// Usage:
//   node _digested/render-indexes.mjs          # write the coverage matrix
//   node _digested/render-indexes.mjs --check  # fail when it is stale
import { readFileSync, writeFileSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const corpusRoot = dirname(fileURLToPath(import.meta.url))
const catalogPath = resolve(corpusRoot, 'catalog.json')
const coveragePath = resolve(corpusRoot, '_coverage/00-index.md')
const startMarker = '<!-- catalog:coverage:start -->'
const endMarker = '<!-- catalog:coverage:end -->'

const statusLabels = {
  reverified: '已核验',
  carried: '沿用',
  unrecorded: '未登记',
  'needs-recheck': '需复核',
}
const sourceLabels = {
  page: '页面声明',
  topic: '专题声明',
  matrix: '矩阵沿用',
}
const roleLabels = {
  map: 'map',
  mechanism: 'mechanism',
  playbook: 'playbook',
  experiment: 'experiment',
  analysis: 'analysis',
}

/** Escape a value for a Markdown table cell. */
function cell(value) {
  return String(value).replaceAll('|', '\\|').replaceAll('\n', ' ')
}

/** Short commit label used in the generated tables. */
function shortCommit(commit) {
  return commit === null ? '—' : commit.slice(0, 10)
}

/** Derive a topic row's status counts from its pages. */
function statusCounts(pages) {
  const counts = { reverified: 0, carried: 0, unrecorded: 0, 'needs-recheck': 0 }
  for (const page of pages) counts[page.status] = (counts[page.status] ?? 0) + 1
  return counts
}

/**
 * Render the coverage matrix.
 * @param catalog - Parsed catalog.json.
 * @returns Markdown lines for the generated block.
 */
export function renderCoverage(catalog) {
  const baseline = catalog.baseline
  const lines = []
  lines.push(`产品源码基线：\`${baseline.commit}\`（\`${baseline.tag}\`）。本块由 [\`render-indexes.mjs\`](../render-indexes.mjs) 从 [\`catalog.json\`](../catalog.json) 生成；不要手改。`)
  lines.push('')
  lines.push('## 专题总览')
  lines.push('')
  lines.push('| 专题 | 范围 | 页数 | 已核验 | 沿用 | 未登记 |')
  lines.push('|---|---|---:|---:|---:|---:|')
  for (const topic of catalog.topics) {
    const counts = statusCounts(topic.pages)
    const pageCount = String(topic.pages.length)
    lines.push(`| [\`${topic.dir}/\`](../${topic.dir}/${topic.map}) | ${cell(topic.intent)} | ${pageCount} | ${counts.reverified} | ${counts.carried} | ${counts.unrecorded + counts['needs-recheck']} |`)
  }
  lines.push('')
  lines.push('## 页面明细')
  for (const topic of catalog.topics) {
    lines.push('')
    lines.push(`### \`${topic.dir}/\``)
    lines.push('')
    if (topic.pages.length === 0) {
      lines.push('（导航页；具体页面在三个子目录。）')
      continue
    }
    lines.push('| 页面 | 角色 | 状态 | 最近核验 | 来源 |')
    lines.push('|---|---|---|---|---|')
    for (const page of topic.pages) {
      const href = `../${topic.dir}/${page.file}`
      const label = page.file.replace(/\.md$/, '')
      const status = statusLabels[page.status] ?? page.status
      const source = page.verifiedAt === null ? '—' : (sourceLabels[page.source] ?? '—')
      lines.push(`| [\`${label}\`](${href}) | ${roleLabels[page.role] ?? page.role} | ${status} | ${shortCommit(page.verifiedAt)} | ${source} |`)
    }
  }
  return `${lines.join('\n')}\n`
}

/** Replace the generated block in the coverage page. */
export function applyCoverage(catalog, source) {
  const start = source.indexOf(startMarker)
  const end = source.indexOf(endMarker)
  if (start < 0 || end < 0 || end < start) {
    throw new Error(`coverage markers missing or out of order in ${coveragePath}`)
  }
  return `${source.slice(0, start + startMarker.length)}\n${renderCoverage(catalog)}${source.slice(end)}`
}

function main() {
  const check = process.argv.includes('--check')
  const catalog = JSON.parse(readFileSync(catalogPath, 'utf8'))
  const source = readFileSync(coveragePath, 'utf8')
  const next = applyCoverage(catalog, source)
  if (check) {
    if (next !== source) {
      console.error('coverage matrix is stale; run node _digested/render-indexes.mjs')
      process.exitCode = 1
    }
    return
  }
  writeFileSync(coveragePath, next)
  console.log(`rendered ${coveragePath} from ${catalogPath}`)
}

if (process.argv[1] === fileURLToPath(import.meta.url)) main()
