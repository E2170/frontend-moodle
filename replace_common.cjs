const fs = require('fs');
const path = require('path');

const dir = './src';
const files = fs.readdirSync(dir).filter(f => f.endsWith('.jsx'));

const dictionary = {
  '>Aktivite / Modül Tipi<': '>{t.activityType}<',
  '>Aktivite Ekle<': '>{t.addActivity}<',
  '>Ders İsmi<': '>{t.courseName}<',
  '>Dönem<': '>{t.term}<',
  '>Ders Durumu<': '>{t.courseStatus}<',
  '>Yeni Ekle<': '>{t.addNew}<',
  '>Kaydet<': '>{t.save}<',
  '>İptal<': '>{t.cancel}<',
  '>Düzenle<': '>{t.edit}<',
  '>Sil<': '>{t.delete}<',
  '>Kapat<': '>{t.close}<',
  '>İleri<': '>{t.next}<',
  '>Geri<': '>{t.back}<',
  '>Tamam<': '>{t.ok}<',
  '>Dosya Seç<': '>{t.selectFile}<',
  '>Yükle<': '>{t.upload}<',
  '>Açıklama<': '>{t.description}<',
  '>Başlık<': '>{t.title}<',
  '>Tarih<': '>{t.date}<',
  '>Saat<': '>{t.time}<',
  '>Aktif<': '>{t.active}<',
  '>Pasif<': '>{t.passive}<',
  '>Sınav<': '>{t.exam}<',
  '>Ödev<': '>{t.assignment}<',
  '>Forum<': '>{t.forum}<',
  '>Duyuru<': '>{t.announcement}<',
  '>Detaylar<': '>{t.details}<',
  '>İçerik bulunamadı.<': '>{t.noContent}<',
  '>Bulunamadı.<': '>{t.notFound}<',
  '>Eğitmen<': '>{t.teacher}<',
  '>Öğrenci<': '>{t.student}<'
};

for (const file of files) {
  if (['Header.jsx', 'LanguageContext.jsx', 'main.jsx', 'App.jsx'].includes(file)) continue;

  const filepath = path.join(dir, file);
  let content = fs.readFileSync(filepath, 'utf8');
  let changed = false;

  for (const [search, replace] of Object.entries(dictionary)) {
    // using regex global replace
    const regex = new RegExp(search.replace(/([.<>])/g, '\\$1'), 'g');
    if (regex.test(content)) {
      content = content.replace(regex, replace);
      changed = true;
    }
  }

  if (changed) {
    if (!content.includes('useLanguage')) {
      content = `import { useLanguage } from "./LanguageContext";\n` + content;
    }
    
    // Inject const { t } = useLanguage(); inside component
    content = content.replace(/export default function (\w+)\([^)]*\) \{\n/, (match) => {
      if (content.includes('const { t } = useLanguage();')) return match;
      return match + `  const { t } = useLanguage();\n`;
    });
    
    fs.writeFileSync(filepath, content, 'utf8');
    console.log(`Updated ${file} with dictionary terms`);
  }
}
