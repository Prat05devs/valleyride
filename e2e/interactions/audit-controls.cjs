const fs = require('node:fs');
const path = require('node:path');
const ts = require('../../node_modules/typescript');
const root = path.resolve(__dirname, '../..');
let files = 0;
let controls = 0;
const unwired = [];

function walk(dir) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const filename = path.join(dir, entry.name);
    if (entry.isDirectory()) { walk(filename); continue; }
    if (!filename.endsWith('.tsx')) continue;
    files++;
    const source = ts.createSourceFile(filename, fs.readFileSync(filename, 'utf8'), ts.ScriptTarget.Latest, true, ts.ScriptKind.TSX);
    function visit(node) {
      if (ts.isJsxOpeningElement(node) || ts.isJsxSelfClosingElement(node)) {
        const tag = node.tagName.getText(source);
        if (['Button', 'IconButton', 'Chip', 'Pressable', 'button'].includes(tag)) {
          controls++;
          const attrs = new Set(node.attributes.properties.filter(ts.isJsxAttribute).map((a) => a.name.getText(source)));
          const handler = filename.includes(`${path.sep}web${path.sep}`) ? 'onClick' : 'onPress';
          const hasSpread = node.attributes.properties.some(ts.isJsxSpreadAttribute);
          if (!hasSpread && ![handler, 'type', 'disabled', 'asChild'].some((a) => attrs.has(a))) {
            unwired.push({ file: path.relative(root, filename), line: source.getLineAndCharacterOfPosition(node.pos).line + 1, tag });
          }
        }
      }
      ts.forEachChild(node, visit);
    }
    visit(source);
  }
}

for (const dir of ['apps/mobile/src', 'apps/web/app', 'apps/web/components']) walk(path.join(root, dir));
console.log(JSON.stringify({ files, controls, unwiredControls: unwired }, null, 2));
if (unwired.length) process.exitCode = 1;
