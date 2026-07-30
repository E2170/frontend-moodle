const fs = require('fs');
const path = require('path');

const dir = './src';
const files = fs.readdirSync(dir).filter(f => f.endsWith('.jsx'));

// Known strings to replace
const replacements = [
  { search: />Derslerim</g, replace: '>{t.myCourses}<' },
  { search: />Takvim</g, replace: '>{t.calendar}<' },
  { search: />Raporlar</g, replace: '>{t.reports}<' },
  { search: />Dosyalarım</g, replace: '>{t.myFiles}<' },
  { search: />Soru Bankası</g, replace: '>{t.questionBank}<' },
  { search: />Aktif Dersler</g, replace: '>{t.activeCourses}<' },
  { search: />Toplam Ders</g, replace: '>{t.totalCourses}<' },
  { search: />Tümü /g, replace: '>{t.viewAll} ' },
  { search: />Zaman Çizelgesi</g, replace: '>{t.timeline}<' },
  { search: />Geçmiş</g, replace: '>{t.past}<' },
  { search: />Duyurular</g, replace: '>{t.announcements}<' },
  { search: />Sanal Sınıf</g, replace: '>{t.virtualClass}<' },
  { search: />Hiç duyuru yok\.</g, replace: '>Hiç duyuru yok.<' }, // Can add more
  { search: />Yükleniyor\.\.\.</g, replace: '>{t.loadingData}<' },
  { search: />Kayıtlı ders bulunamadı\.</g, replace: '>{t.noCourses}<' },
  { search: />Yaklaşan aktiviteniz yoktur\.</g, replace: '>{t.noUpcoming}<' }
];

for (const file of files) {
  if (['Header.jsx', 'Dashboard.jsx', 'LoginPage.jsx', 'App.jsx', 'main.jsx', 'LanguageContext.jsx'].includes(file)) continue;

  const filepath = path.join(dir, file);
  let content = fs.readFileSync(filepath, 'utf8');
  let changed = false;

  for (const r of replacements) {
    if (content.match(r.search)) {
      content = content.replace(r.search, r.replace);
      changed = true;
    }
  }

  if (changed) {
    if (!content.includes('useLanguage')) {
      // Inject import
      content = content.replace(/import.*?['"];?\n/g, (match, offset, full) => {
        if (full.substring(offset).indexOf('import ') > 10) return match; // skip non-first block? Actually just prepend
        return match;
      });
      content = `import { useLanguage } from "./LanguageContext";\n` + content;
    }
    
    // Inject const { t } = useLanguage(); inside component
    content = content.replace(/export default function (\w+)\([^)]*\) \{\n/, (match) => {
      if (content.includes('const { t } = useLanguage();')) return match;
      return match + `  const { t } = useLanguage();\n`;
    });
    
    fs.writeFileSync(filepath, content, 'utf8');
    console.log(`Updated ${file}`);
  }
}
