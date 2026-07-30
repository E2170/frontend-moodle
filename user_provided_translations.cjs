const fs = require('fs');
const path = require('path');

const manualTranslations = {
  "Herhangi bir duyuru bulunamadı.": { en: "No announcements found.", ar: "لم يتم العثور على إعلانات.", key: "noAnnouncementsFound" },
  "Mesajlarım": { en: "My Messages", ar: "رسائلي", key: "myMessages" },
  "Forumlar": { en: "Forums", ar: "المنتديات", key: "forumsTitle" },
  "Herhangi bir forum bulunmadı.": { en: "No forum found.", ar: "لم يتم العثور على منتدى.", key: "noForumsFound" },
  "Yaklaşan sanal sınıf aktiviteniz yoktur.": { en: "No upcoming virtual class activities.", ar: "لا توجد أنشطة فصول افتراضية قادمة.", key: "noUpcomingVirtualClass" },
  "Yaklaşan Etkinlikler": { en: "Upcoming Events", ar: "الأحداث القادمة", key: "upcomingEventsLabel" },
  "Yaklaşan etkinlik bulunmamaktadır.": { en: "No upcoming events.", ar: "لا توجد أحداث قادمة.", key: "noUpcomingEvents" },
  "Ders İsmi *": { en: "Course Name *", ar: "اسم الدورة *", key: "courseNameStar" },
  "Pasif Dersler": { en: "Passive Courses", ar: "دورات غير نشطة", key: "passiveCourses" },
  "Ders Raporları": { en: "Course Reports", ar: "تقارير الدورة", key: "courseReports" },
  "Raporlama": { en: "Reporting", ar: "الإبلاغ", key: "reporting" },
  "Raporu Gör": { en: "View Report", ar: "عرض التقرير", key: "viewReport" },
  "Yükleyen Kullanıcı": { en: "Uploaded By", ar: "تم الرفع بواسطة", key: "uploadedBy" },
  "Yükleme Tarihi": { en: "Upload Date", ar: "تاريخ الرفع", key: "uploadDate" },
  "İlişkili Ders": { en: "Related Course", ar: "الدورة ذات الصلة", key: "relatedCourse" },
  "İşlemler": { en: "Actions", ar: "إجراءات", key: "actions" },
  "Soru Bankası": { en: "Question Bank", ar: "بنك الأسئلة", key: "questionBankTitle" },
  "Çoklu Soru Ekle": { en: "Add Multiple Questions", ar: "إضافة أسئلة متعددة", key: "addMultipleQuestions" },
  "Konu / Kategori": { en: "Topic / Category", ar: "الموضوع / الفئة", key: "topicCategory" },
  "Dönem Seçiniz": { en: "Select Term", ar: "اختر الفصل", key: "selectTerm" },
  "Sınav Seçiniz": { en: "Select Exam", ar: "اختر الاختبار", key: "selectExam" },
  "Soru Metni": { en: "Question Text", ar: "نص السؤال", key: "questionText" },
  "Aranacak kelimeyi giriniz...": { en: "Enter word to search...", ar: "أدخل الكلمة للبحث...", key: "enterWordToSearch" },
  "Temizle": { en: "Clear", ar: "مسح", key: "clearBtn" },
  "Detaylı Arama": { en: "Detailed Search", ar: "بحث مفصل", key: "detailedSearchTitle" },
  "Filtreleme yaparak soruları listeleyebilirsiniz": { en: "You can list questions by filtering", ar: "يمكنك سرد الأسئلة عن طريق التصفية", key: "filterQuestionsHelper" },
  "Mesajlaşmaya Başlayın": { en: "Start Messaging", ar: "ابدأ المراسلة", key: "startMessaging" },
  "Görüntülemek veya mesaj göndermek için soldan bir konuşma seçin.": { en: "Select a conversation from the left to view or send a message.", ar: "حدد محادثة من اليسار لعرض رسالة أو إرسالها.", key: "selectConversationHelper" },
  "Henüz bir forum tartışması bulunmuyor.": { en: "No forum discussion yet.", ar: "لا يوجد نقاش في المنتدى بعد.", key: "noForumDiscussion" },
  "Size nasıl yardımcı olabiliriz?": { en: "How can we help you?", ar: "كيف يمكننا مساعدتك؟", key: "howCanWeHelp" },
  "Uzaktan eğitim sistemiyle ilgili sıkça sorulan sorulara göz atabilir veya aradığınız konuyu hızlıca bulabilirsiniz.": { en: "You can browse frequently asked questions about the distance education system or find the topic you are looking for quickly.", ar: "يمكنك تصفح الأسئلة الشائعة حول نظام التعليم عن بعد أو العثور على الموضوع الذي تبحث عنه بسرعة.", key: "faqIntro" },
  "Sorunuzu buraya yazın (Örn: Sınav, Canlı Ders, Şifre)...": { en: "Type your question here (e.g., Exam, Live Class, Password)...", ar: "اكتب سؤالك هنا (مثل: اختبار، فئة حية، كلمة مرور)...", key: "typeQuestionHere" },
  "Sıkça Sorulan Sorular (SSS)": { en: "Frequently Asked Questions (FAQ)", ar: "الأسئلة الشائعة (FAQ)", key: "faqTitle" },
  "Sisteme nasıl giriş yapabilirim?": { en: "How can I log in to the system?", ar: "كيف يمكنني تسجيل الدخول إلى النظام؟", key: "faq1_q" },
  "Uzaktan eğitim sistemine öğrenci numaranız ve OBS (Öğrenci Bilgi Sistemi) şifreniz ile giriş yapabilirsiniz. İlk girişte şifrenizi değiştirmeniz istenebilir.": { en: "You can log in to the distance education system with your student number and SIS (Student Information System) password. You may be prompted to change your password on first login.", ar: "يمكنك تسجيل الدخول إلى نظام التعليم عن بعد باستخدام رقم الطالب الخاص بك وكلمة مرور SIS (نظام معلومات الطلاب). قد يطلب منك تغيير كلمة المرور عند تسجيل الدخول لأول مرة.", key: "faq1_a" },
  "Canlı derslere nasıl katılırım?": { en: "How do I join live classes?", ar: "كيف أنضم إلى الفصول الحية؟", key: "faq2_q" },
  "Şifremi unuttum, ne yapmalıyım?": { en: "I forgot my password, what should I do?", ar: "نسيت كلمة المرور، ماذا أفعل؟", key: "faq3_q" },
  "Online sınav sırasında internetim koptu, ne olacak?": { en: "My internet disconnected during the online exam, what will happen?", ar: "انقطع اتصالي بالإنترنت أثناء الامتحان عبر الإنترنت، ماذا سيحدث؟", key: "faq4_q" },
  "Ödevimi (Dosya) nasıl yüklerim?": { en: "How do I upload my assignment (File)?", ar: "كيف أقوم بتحميل واجبي (ملف)؟", key: "faq5_q" },
  "Ders içeriklerini cihazıma indirebilir miyim?": { en: "Can I download course contents to my device?", ar: "هل يمكنني تنزيل محتويات الدورة على جهازي؟", key: "faq6_q" },
  "Destek İhtiyacınız mı var?": { en: "Need Support?", ar: "هل تحتاج إلى دعم؟", key: "needSupport" },
  "Eğer SSS bölümünde aradığınız cevabı bulamadıysanız veya teknik bir problem yaşıyorsanız doğrudan destek ekibimizle iletişime geçebilirsiniz.": { en: "If you cannot find the answer you are looking for in the FAQ section or if you are experiencing a technical problem, you can contact our support team directly.", ar: "إذا لم تتمكن من العثور على الإجابة التي تبحث عنها في قسم الأسئلة الشائعة أو إذا كنت تواجه مشكلة فنية، يمكنك الاتصال بفريق الدعم مباشرة.", key: "supportIntro" },
  "Öğrenci Kılavuzu": { en: "Student Guide", ar: "دليل الطالب", key: "studentGuide" }
};

let transJs = fs.readFileSync('src/translations.js', 'utf8');

let trAppend = "";
let enAppend = "";
let arAppend = "";

Object.entries(manualTranslations).forEach(([trStr, vals]) => {
  trAppend += `    ${vals.key}: ${JSON.stringify(trStr)},\n`;
  enAppend += `    ${vals.key}: ${JSON.stringify(vals.en)},\n`;
  arAppend += `    ${vals.key}: ${JSON.stringify(vals.ar)},\n`;
});

// Avoid duplicate keys by doing simple check
Object.entries(manualTranslations).forEach(([trStr, vals]) => {
    if (transJs.includes(`${vals.key}:`)) {
       // do nothing
    }
});

transJs = transJs.replace(/(tr: \{[^}]+)(\},?\s*en:)/, `$1\n    // User Provided Translations\n${trAppend}$2`);
transJs = transJs.replace(/(en: \{[^}]+)(\},?\s*ar:)/, `$1\n    // User Provided Translations\n${enAppend}$2`);
transJs = transJs.replace(/(ar: \{[^}]+)(\}\s*\};)/, `$1\n    // User Provided Translations\n${arAppend}$2`);

fs.writeFileSync('src/translations.js', transJs, 'utf8');

const dir = './src';
const files = fs.readdirSync(dir).filter(f => f.endsWith('.jsx'));

for (const file of files) {
  if (['Header.jsx', 'LanguageContext.jsx', 'main.jsx', 'App.jsx'].includes(file)) continue;

  const filepath = path.join(dir, file);
  let content = fs.readFileSync(filepath, 'utf8');
  let changed = false;

  Object.entries(manualTranslations).forEach(([trStr, vals]) => {
    const escapedSearch = trStr.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    
    // Check inside >Text<
    const regex1 = new RegExp(`>${escapedSearch}<`, 'g');
    if (regex1.test(content)) {
      content = content.replace(regex1, `>{t.${vals.key}}<`);
      changed = true;
    }
    
    // Check for placeholder="Text"
    const regex2 = new RegExp(`placeholder="${escapedSearch}"`, 'g');
    if (regex2.test(content)) {
      content = content.replace(regex2, `placeholder={t.${vals.key}}`);
      changed = true;
    }
    
    // Check for text inside jsx expressions without quotes e.g. defaultValue="Text"
    const regex3 = new RegExp(`="\\s*${escapedSearch}\\s*"`, 'g');
    if (regex3.test(content)) {
        content = content.replace(regex3, `={t.${vals.key}}`);
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
    console.log(`Updated ${file} with user provided translations`);
  }
}
