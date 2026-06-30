const fs = require('fs')
const path = require('path')
const root = path.join(__dirname, '..')

const markup = fs.readFileSync(path.join(__dirname, '_markup.html'), 'utf8')
const fdata = fs.readFileSync(path.join(__dirname, '_fdata.txt'), 'utf8')

const out =
  `// AUTO-GENERATED from claude.ai/design 원본 (design-system/landing-extracted.html)\n` +
  `// 수정 시 디자인이 1px 어긋날 수 있음. 원본을 갱신해 재추출하는 것을 권장.\n` +
  `export type HeroField = { w: string; l: string; r: string; i: string }\n\n` +
  `export const F: HeroField[] = [\n    ${fdata}\n]\n\n` +
  `export const MARKUP = ${JSON.stringify(markup)}\n`

fs.writeFileSync(path.join(root, 'src/components/landing/sofitLandingData.ts'), out, 'utf8')
console.log('wrote sofitLandingData.ts', out.length, 'bytes')
