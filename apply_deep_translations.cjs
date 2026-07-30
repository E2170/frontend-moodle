const fs = require('fs');
const path = require('path');

const mapping = JSON.parse(fs.readFileSync('translations_mapping.json', 'utf8'));

// 1. Update translations.js
let transJs = fs.readFileSync('src/translations.js', 'utf8');

let trAppend = "";
let enAppend = "";
let arAppend = "";

mapping.forEach(m => {
  trAppend += `    ${m.key}: ${JSON.stringify(m.tr)},\n`;
  enAppend += `    ${m.key}: ${JSON.stringify(m.en)},\n`;
  arAppend += `    ${m.key}: ${JSON.stringify(m.ar)},\n`;
});

// Insert before the closing brace of each language object
transJs = transJs.replace(/(tr: \{[^}]+)(\},?\s*en:)/, `$1\n    // Deep Translations\n${trAppend}$2`);
transJs = transJs.replace(/(en: \{[^}]+)(\},?\s*ar:)/, `$1\n    // Deep Translations\n${enAppend}$2`);
transJs = transJs.replace(/(ar: \{[^}]+)(\}\s*\};)/, `$1\n    // Deep Translations\n${arAppend}$2`);

fs.writeFileSync('src/translations.js', transJs, 'utf8');

// 2. Replace in JSX files
const dir = './src';
const files = fs.readdirSync(dir).filter(f => f.endsWith('.jsx'));

for (const file of files) {
  if (['Header.jsx', 'LanguageContext.jsx', 'main.jsx', 'App.jsx'].includes(file)) continue;

  const filepath = path.join(dir, file);
  let content = fs.readFileSync(filepath, 'utf8');
  let changed = false;

  mapping.forEach(m => {
    // Escape string for regex
    const escapedSearch = m.tr.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const regex1 = new RegExp(`>${escapedSearch}<`, 'g');
    if (regex1.test(content)) {
      content = content.replace(regex1, `>{t.${m.key}}<`);
      changed = true;
    }
    
    // Also check for placeholder="..."
    const regex2 = new RegExp(`placeholder="${escapedSearch}"`, 'g');
    if (regex2.test(content)) {
      content = content.replace(regex2, `placeholder={t.${m.key}}`);
      changed = true;
    }
  });

  if (changed) {
    if (!content.includes('useLanguage')) {
      content = `import { useLanguage } from "./LanguageContext";\n` + content;
    }
    content = content.replace(/export default function (\w+)\([^)]*\) \{\n/, (match) => {
      if (content.includes('const { t } = useLanguage();')) return match;
      return match + `  const { t } = useLanguage();\n`;
    });
    fs.writeFileSync(filepath, content, 'utf8');
    console.log(`Updated ${file} with deep dictionary`);
  }
}
