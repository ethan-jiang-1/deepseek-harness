/** Exercise the standalone corpus verifier through its real Node entry. */
import assert from 'node:assert/strict'
import { execFileSync } from 'node:child_process'
import { cpSync, mkdtempSync, readFileSync, writeFileSync } from 'node:fs'
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

const currentUrl = 'https://github.com/deepseek-ai/deepseek-harness/tree/dsh-v0.2.0-rc.2'
for (const ref of ['main', 'dsh-v0.2.0-rc.1', 'a'.repeat(40), 'dsh-v0.2.0-rc.2-extra']) {
  reject(`unpinned or wrong reference ${ref}`, 'README.md',
    source => `${source}\n[invalid](${currentUrl.replace('dsh-v0.2.0-rc.2', ref)})\n`,
    /external link must target/)
}
reject('cross-volume SVG ownership', 'native-development-model/00-index.md',
  source => `${source}\n![invalid](../repo-harness/figures/two-harnesses.svg)\n`,
  /SVG must come from this Markdown subtree/)
reject('escaping relative link', 'README.md',
  source => `${source}\n[invalid](../outside.md)\n`, /relative link escapes the corpus/)
reject('missing local anchor', 'README.md',
  source => `${source}\n[invalid](#nonexistent-verifier-test-anchor)\n`, /Markdown fragment does not exist/)
reject('missing trailing newline', 'README.md', source => source.trimEnd(), /must end with one trailing newline/)
console.log(`Verifier acceptance tests passed; ${caseCount} isolated copies retained at ${testRoot}.`)
