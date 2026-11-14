/** Exercise the standalone corpus verifier through its real Node entry. */
import assert from 'node:assert/strict'
import { execFileSync } from 'node:child_process'
import { cpSync, mkdirSync, mkdtempSync, readFileSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const corpusRoot = dirname(fileURLToPath(import.meta.url))
const testRoot = mkdtempSync(join(tmpdir(), 'dsh-corpus-verifier-'))
let caseCount = 0

function fixture() {
  const root = join(testRoot, `case-${++caseCount}`)
  cpSync(corpusRoot, root, { recursive: true })
  return root
}

function run(root) {
  try {
    return { status: 0, output: execFileSync(process.execPath, [join(root, 'verify.mjs')], {
      cwd: testRoot,
      encoding: 'utf8',
      stdio: ['ignore', 'pipe', 'pipe'],
    }) }
  } catch (error) {
    return { status: error.status, output: `${error.stdout ?? ''}${error.stderr ?? ''}` }
  }
}

function reject(label, relativePath, change, diagnostic) {
  const root = fixture()
  const path = join(root, relativePath)
  writeFileSync(path, change(readFileSync(path, 'utf8')))
  const result = run(root)
  assert.equal(result.status, 1, `${label}: invalid input must exit 1\n${result.output}`)
  assert.match(result.output, diagnostic, `${label}: report the targeted rule`)
  console.log(`PASS reject: ${label}`)
}

const valid = run(fixture())
assert.equal(valid.status, 0, valid.output)
console.log('PASS accept: copied corpus runs outside its original repository and cwd')

{
  const root = fixture()
  const indexPath = join(root, '00-index.md')
  const immutableLinks = [
    '[pr](https://github.com/deepseek-ai/deepseek-harness/pull/5073)',
    '[issue](https://github.com/deepseek-ai/deepseek-harness/issues/1)',
    '[discussion](https://github.com/deepseek-ai/deepseek-harness/discussions/1)',
    '[commit](https://github.com/deepseek-ai/deepseek-harness/commit/b830ec950faba0a46dda564be3e2d854afed94f1)',
  ].join(' ')
  writeFileSync(indexPath, `${readFileSync(indexPath, 'utf8')}\n${immutableLinks}\n`)
  const result = run(root)
  assert.equal(result.status, 0, result.output)
  console.log('PASS accept: immutable event permalinks (/pull, /issues, /discussions, /commit) pass per CORPUS-CHARTER.md')
}

const currentUrl = 'https://github.com/deepseek-ai/deepseek-harness/tree/master'
for (const ref of ['main', 'dsh-v0.2.1-rc.2', 'dsh-v0.2.1-rc.5', 'a'.repeat(40), 'master-extra']) {
  reject(`unpinned or wrong reference ${ref}`, '00-index.md',
    source => `${source}\n[invalid](${currentUrl.replace('master', ref)})\n`,
    /external link must target/)
}
reject('cross-volume SVG ownership', '02-dsh-plugin-harness/00-index.md',
  source => `${source}\n![invalid](../01-general-repo-harness/figures/two-harnesses.svg)\n`,
  /SVG must come from this Markdown subtree/)
reject('sibling corpus reference in content', '02-dsh-plugin-harness/00-index.md',
  source => `${source}\nSee \`_digested/00-index.md\`.\n`,
  /references sibling research corpus/)
reject('mismatched Markdown table column count', '00-index.md',
  source => `${source}\n| A | B |\n|---|---|\n| only-one-cell |\n`,
  /Markdown table row has 1 column\(s\), expected 2/)
reject('round audit note leaked into reader page', '01-general-repo-harness/03-skills-as-procedural-memory.md',
  source => `${source}\n补充说明（0008 复核注记：旧版曾有差异）。\n`,
  /reader page leaks internal round\/baseline audit note/)
reject('session-vantage note leaked into reader page', '03-dsh-sdlc-reference/08-example-web-seam.md',
  source => `${source}\n本轮已逐一核对上述四个节点。\n`,
  /reader page leaks internal round\/baseline audit note/)
reject('page-level baseline header leaked into reader page', '01-general-repo-harness/00-index.md',
  source => `${source}\n产品源码基线：dsh-v0.2.1-rc.5\n`,
  /reader page leaks internal round\/baseline audit note/)
reject('hardcoded volatile master-repo count in reader page', '03-dsh-sdlc-reference/09-intake-and-work-items.md',
  source => `${source}\n当前 proposed 目录有 42 篇英文提案，并维护九个 rescoped Cordis 包。\n`,
  /reader page hardcodes volatile master-repo count/)
reject('banned origin label in Markdown', '00-index.md',
  source => `${source}\nTrack artifact ${'prove'}${'nance'} across builds.\n`,
  /contains banned origin label/)
reject('mistranslated dead code in SVG', '03-dsh-sdlc-reference/figures/three-red-cases.svg',
  source => source.replace('待删除的死代码', '该死的代码'),
  /contains literal mistranslation of dead code/)
reject('SVG text overflowing enclosing card rect', '03-dsh-sdlc-reference/figures/evidence-routing.svg',
  source => source.replace('build · snapshots · artifacts', 'build · snapshots · artifacts · extra-wide-card-overflow'),
  /SVG <text> .* overflows enclosing <rect>/)
reject('SVG text overflowing root viewBox', '01-general-repo-harness/figures/two-harnesses.svg',
  source => source.replace('</svg>', '  <text x="10" y="25" font-size="24">THIS UNBOUNDED HEADING INTENTIONALLY OVERFLOWS BEYOND VIEWBOX RIGHT EDGE BY FAR MORE THAN A THOUSAND PIXELS</text>\n</svg>'),
  /SVG <text> .* overflows viewBox bounds/)
{
  const root = fixture()
  writeFileSync(join(root, '01-general-repo-harness/99-unregistered.md'), '# Unregistered\n')
  const result = run(root)
  assert.equal(result.status, 1, `unregistered Markdown file must exit 1\n${result.output}`)
  assert.match(result.output, /Markdown file is missing from _coverage\/00-corpus-maintenance\.md inventory: "01-general-repo-harness\/99-unregistered\.md"/)
  console.log('PASS reject: unregistered Markdown file missing from maintenance inventory')
}
reject('stale non-existent file in maintenance inventory', '_coverage/00-corpus-maintenance.md',
  source => source.replace('| `00-index.md` | map | 2026-11-14 | reverified |', '| `00-index.md` | map | 2026-11-14 | reverified |\n| `01-general-repo-harness/98-ghost.md` | mechanism | 2026-11-14 | reverified |'),
  /inventory entry does not exist on disk: "01-general-repo-harness\/98-ghost\.md"/)
reject('invalid role in maintenance inventory', '_coverage/00-corpus-maintenance.md',
  source => source.replace('| `00-index.md` | map | 2026-11-14 | reverified |', '| `00-index.md` | unknown-role | 2026-11-14 | reverified |'),
  /invalid inventory role "unknown-role"/)
{
  const isolatedParent = mkdtempSync(join(tmpdir(), 'dsh-charter-parity-'))
  const root = join(isolatedParent, '_dsh_plugin_agent_ready_development')
  const sibling = join(isolatedParent, '_misc')
  cpSync(corpusRoot, root, { recursive: true })
  mkdirSync(sibling, { recursive: true })
  writeFileSync(join(sibling, 'CORPUS-CHARTER.md'), '# drifted charter\n')
  const result = run(root)
  assert.equal(result.status, 1, `divergent sibling charter must exit 1\n${result.output}`)
  assert.match(result.output, /CORPUS-CHARTER\.md diverges from _misc\/CORPUS-CHARTER\.md/)
  console.log('PASS reject: divergent sibling CORPUS-CHARTER.md')
}
reject('escaping relative link', '00-index.md',
  source => `${source}\n[invalid](../outside.md)\n`, /relative link escapes the corpus/)
reject('missing local anchor', '00-index.md',
  source => `${source}\n[invalid](#nonexistent-verifier-test-anchor)\n`, /Markdown fragment does not exist/)
reject('missing trailing newline', '00-index.md', source => source.trimEnd(), /must end with one trailing newline/)
console.log(`Verifier acceptance tests passed; ${caseCount} isolated copies retained at ${testRoot}.`)
