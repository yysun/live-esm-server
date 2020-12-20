const fs = require('fs');
const path = require('path');
const MagicString = require('magic-string');
const { Parser } = require('acorn');
const walk = require('estree-walker').walk;

function fix(module) {
  if (module.startsWith('http://') || module.startsWith('https://')) {
    return;
  } else if (module.startsWith('/') || module.startsWith('./') || module.startsWith('../')) {
    if (!module.endsWith('js')) return `'${module}.js'`;
    else return;
  } else {
    return `'https://unpkg.com/${module}?module'`;
  }
}

module.exports = (root, url) => {
  const file = path.join(root, url);
  if (!fs.existsSync(file)) return;
  let code = fs.readFileSync(file).toString();
  const ast = Parser.parse(code, { sourceType: 'module', ecmaVersion: 11 });
  const magicString = new MagicString(code);
  let hasFix;
  walk(ast, {
    enter(node, parent) {
      if (node.type === 'Literal' && parent.type === 'ImportDeclaration') {
        const esm = fix(node.value);
        if (esm) {
          magicString.overwrite(node.start, node.end, esm, {
            storeName: false
          });
          hasFix = true;
        }
        return node;
      }
    }
  });
  return hasFix ? magicString.toString() : code;

  // if (hasFix) {
  //   console.log('\t ...... ' + file)
  //   fs.writeFileSync(file, magicString.toString());
  //   // fs.writeFileSync(file + '.map', magicString.generateMap({
  //   //   file,
  //   //   includeContent: true,
  //   //   hires: true
  //   // }));
  // }
}