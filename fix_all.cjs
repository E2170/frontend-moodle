const fs = require('fs');
const path = require('path');

const manualTranslations = {
  "Herhangi bir duyuru bulunamadı.": "noAnnouncementsFound",
  "Mesajlarım": "myMessages",
  "Forumlar": "forumsTitle",
  "Herhangi bir forum bulunmadı.": "noForumsFound",
  "Yaklaşan sanal sınıf aktiviteniz yoktur.": "noUpcomingVirtualClass",
  "Yaklaşan Etkinlikler": "upcomingEventsLabel",
  "Yaklaşan etkinlik bulunmamaktadır.": "noUpcomingEvents",
  "Ders İsmi *": "courseNameStar",
  "Pasif Dersler": "passiveCourses",
  "Ders Raporları": "courseReports",
  "Raporlama": "reporting",
  "Raporu Gör": "viewReport",
  "Yükleyen Kullanıcı": "uploadedBy",
  "Yükleme Tarihi": "uploadDate",
  "İlişkili Ders": "relatedCourse",
  "İşlemler": "actions",
  "Soru Bankası": "questionBankTitle",
  "Çoklu Soru Ekle": "addMultipleQuestions",
  "Konu / Kategori": "topicCategory",
  "Dönem Seçiniz": "selectTerm",
  "Sınav Seçiniz": "selectExam",
  "Soru Metni": "questionText",
  "Aranacak kelimeyi giriniz...": "enterWordToSearch",
  "Temizle": "clearBtn",
  "Detaylı Arama": "detailedSearchTitle",
  "Filtreleme yaparak soruları listeleyebilirsiniz": "filterQuestionsHelper",
  "Mesajlaşmaya Başlayın": "startMessaging",
  "Görüntülemek veya mesaj göndermek için soldan bir konuşma seçin.": "selectConversationHelper",
  "Henüz bir forum tartışması bulunmuyor.": "noForumDiscussion",
  "Size nasıl yardımcı olabiliriz?": "howCanWeHelp",
  "Uzaktan eğitim sistemiyle ilgili sıkça sorulan sorulara göz atabilir veya aradığınız konuyu hızlıca bulabilirsiniz.": "faqIntro",
  "Sorunuzu buraya yazın (Örn: Sınav, Canlı Ders, Şifre)...": "typeQuestionHere",
  "Sıkça Sorulan Sorular (SSS)": "faqTitle",
  "Sisteme nasıl giriş yapabilirim?": "faq1_q",
  "Uzaktan eğitim sistemine öğrenci numaranız ve OBS (Öğrenci Bilgi Sistemi) şifreniz ile giriş yapabilirsiniz. İlk girişte şifrenizi değiştirmeniz istenebilir.": "faq1_a",
  "Canlı derslere nasıl katılırım?": "faq2_q",
  "Şifremi unuttum, ne yapmalıyım?": "faq3_q",
  "Online sınav sırasında internetim koptu, ne olacak?": "faq4_q",
  "Ödevimi (Dosya) nasıl yüklerim?": "faq5_q",
  "Ders içeriklerini cihazıma indirebilir miyim?": "faq6_q",
  "Destek İhtiyacınız mı var?": "needSupport",
  "Eğer SSS bölümünde aradığınız cevabı bulamadıysanız veya teknik bir problem yaşıyorsanız doğrudan destek ekibimizle iletişime geçebilirsiniz.": "supportIntro",
  "Öğrenci Kılavuzu": "studentGuide"
};

const dir = './src';
const files = fs.readdirSync(dir).filter(f => f.endsWith('.jsx'));

for (const file of files) {
  if (['Header.jsx', 'LanguageContext.jsx', 'main.jsx', 'App.jsx'].includes(file)) continue;

  const filepath = path.join(dir, file);
  let content = fs.readFileSync(filepath, 'utf8');
  let changed = false;

  Object.entries(manualTranslations).forEach(([trStr, key]) => {
    const escapedSearch = trStr.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    
    // Check inside >Text< (with possible spaces/newlines)
    const regex1 = new RegExp(`>\\s*${escapedSearch}\\s*<`, 'g');
    if (regex1.test(content)) {
      content = content.replace(regex1, `>{t.${key}}<`);
      changed = true;
    }
    
    // Check for "Text" (Inside JS context, e.g. faqs array or props)
    const regex4 = new RegExp(`"\\s*${escapedSearch}\\s*"`, 'g');
    if (regex4.test(content)) {
        // If it's something like placeholder="Text", we need to replace with placeholder={t.key}
        // Let's do a smart replace
        content = content.replace(new RegExp(`(\\w+)="\\s*${escapedSearch}\\s*"`, 'g'), `$1={t.${key}}`);
        content = content.replace(regex4, `t.${key}`);
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
    console.log(`Updated ${file} with fix_all.cjs`);
  }
}
