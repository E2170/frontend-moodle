const fs = require('fs');
const path = require('path');
const parser = require('@babel/parser');
const traverse = require('@babel/traverse').default;

const dir = './src';
const files = fs.readdirSync(dir).filter(f => f.endsWith('.jsx'));

let texts = new Set();

const isTurkishText = (str) => {
  str = str.trim();
  if (str.length < 2) return false;
  if (/^[0-9\s\W]+$/.test(str)) return false; // Only symbols/numbers
  if (/^[A-Za-z0-9_]+$/.test(str) && !/[A-Z]/.test(str)) return false; // Likely a variable/class name if lowercase
  if (str.includes('=>') || str.includes('()')) return false; // Code snippet
  return true;
};

for (const file of files) {
  if (['LanguageContext.jsx', 'main.jsx', 'App.jsx'].includes(file)) continue;

  const code = fs.readFileSync(path.join(dir, file), 'utf8');
  try {
    const ast = parser.parse(code, {
      sourceType: 'module',
      plugins: ['jsx']
    });

    traverse(ast, {
      JSXText(path) {
        const val = path.node.value.replace(/\s+/g, ' ').trim();
        if (isTurkishText(val)) texts.add(val);
      },
      JSXAttribute(path) {
        if (path.node.name && (path.node.name.name === 'placeholder' || path.node.name.name === 'title' || path.node.name.name === 'label')) {
          if (path.node.value && path.node.value.type === 'StringLiteral') {
             const val = path.node.value.value.trim();
             if (isTurkishText(val)) texts.add(val);
          }
        }
      }
    });
  } catch (e) {
    console.error(`Error parsing ${file}: ${e.message}`);
  }
}

const arr = Array.from(texts).sort();
fs.writeFileSync('extracted_texts.json', JSON.stringify(arr, null, 2));
console.log(`Extracted ${arr.length} texts.`);
