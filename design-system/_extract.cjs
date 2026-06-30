const fs = require('fs')
const path = require('path')
const root = path.join(__dirname, '..')
const src = fs.readFileSync(path.join(__dirname, 'landing-extracted.html'), 'utf8')

// --- 1) second <style> block (design system) ---
const styles = [...src.matchAll(/<style>([\s\S]*?)<\/style>/g)].map((m) => m[1])
let css = styles[1] // [0] = @font-face(uuid, broken), [1] = design tokens/components
// scope body -> wrapper so it does not override the rest of the app
css = css.replace(/\bbody\{/, '.sofit-landing{')
const cssOut =
  '/* SOFIT 랜딩 — claude.ai/design 원본에서 추출. body{} -> .sofit-landing{} 외 무수정. */\n' +
  '@import url("https://cdn.jsdelivr.net/gh/orioncactus/pretendard@v1.3.9/dist/web/variable/pretendardvariable.min.css");\n' +
  css
fs.writeFileSync(path.join(root, 'src/app/landing.css'), cssOut, 'utf8')

// --- 2) body inner markup (between <body> and first <script>) ---
// 헤더는 별도 React 컴포넌트(LandingHeader)로 기능까지 구현하므로
// 디자인 원본의 정적 nav 블록은 마크업에서 제거한다.
let body = src.split('<body>')[1].split('<script>')[0]
body = body.replace(/<!-- ══ NAV ══ -->\s*<header class="nav"[\s\S]*?<\/header>/, '')
fs.writeFileSync(path.join(__dirname, '_markup.html'), body.trim(), 'utf8')

// --- 3) F array (rolling hero data) ---
const fm = src.match(/const F=\[([\s\S]*?)\];/)
fs.writeFileSync(path.join(__dirname, '_fdata.txt'), fm[1].trim(), 'utf8')

console.log('css bytes:', cssOut.length)
console.log('markup bytes:', body.trim().length)
console.log('F entries:', (fm[1].match(/\{w:/g) || []).length)
