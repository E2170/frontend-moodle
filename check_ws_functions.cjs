// Moodle web servisinde mevcut fonksiyonları tara
// Kullanım: node check_ws_functions.cjs

const TOKEN = process.argv[2];
if (!TOKEN) {
  console.error("Kullanım: node check_ws_functions.cjs <token>");
  process.exit(1);
}

const BASE = "https://moodle.argeyazilim.tr";

const post = async (wsfunction, extra = {}) => {
  const params = new URLSearchParams({
    wstoken: TOKEN,
    wsfunction,
    moodlewsrestformat: "json",
    ...extra,
  });
  const res = await fetch(`${BASE}/webservice/rest/server.php`, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: params.toString(),
  });
  return res.json();
};

// Test edilecek aktivite oluşturma fonksiyonları
const candidates = [
  // assign
  "mod_assign_create_assignments",
  // quiz
  "mod_quiz_create_quizzes",
  "mod_quiz_add_random_questions",
  // forum
  "mod_forum_create_forums",
  "mod_forum_add_discussion",
  // resource
  "mod_resource_create_resources",
  "core_files_upload",
  // url
  "mod_url_create_urls",
  // page
  "mod_page_create_pages",
  // label
  "mod_label_create_labels",
  // choice
  "mod_choice_create_choices",
  // genel kurs modülü
  "core_course_create_modules",
  "core_course_edit_module",
  "core_course_get_module",
  // book
  "mod_book_create_books",
  "mod_book_add_chapter",
  // glossary
  "mod_glossary_create_entries",
  "mod_glossary_add_entry",
  // wiki
  "mod_wiki_new_page",
  // feedback
  "mod_feedback_create_feedbacks",
  // lesson
  "mod_lesson_create_lessons",
  // scorm
  "mod_scorm_create_scorms",
];

async function main() {
  console.log("🔍 Moodle Web Servisi Fonksiyon Taraması\n");
  console.log(`📡 Sunucu: ${BASE}`);
  console.log(`🔑 Token: ${TOKEN.slice(0, 8)}...\n`);
  console.log("─".repeat(60));

  const available = [];
  const missing = [];

  for (const fn of candidates) {
    try {
      const r = await post(fn, {});
      // Eğer "invalidrecord" veya "accessexception" değilse, fonksiyon var demektir
      if (
        r?.exception === "moodle_exception" &&
        r?.errorcode === "invalidrecord"
      ) {
        missing.push({ fn, reason: "Fonksiyon kayıtlı değil" });
      } else if (r?.exception === "webservice_access_exception") {
        missing.push({ fn, reason: "Token izni yok" });
      } else if (r?.exception === "accessexception") {
        available.push({ fn, status: "✅ Mevcut (yetki hatası - normal)" });
      } else if (r?.exception === "invalid_parameter_exception") {
        available.push({ fn, status: "✅ Mevcut (parametre hatası - normal)" });
      } else if (r?.exception === "required_capability_exception") {
        available.push({ fn, status: "✅ Mevcut (yetki gerekli)" });
      } else if (r?.exception) {
        // Diğer exception'lar — fonksiyon büyük ihtimalle mevcut
        available.push({
          fn,
          status: `⚠️  Mevcut (${r.errorcode || r.exception})`,
        });
      } else {
        available.push({ fn, status: "✅ Mevcut ve çalışıyor" });
      }
    } catch (e) {
      missing.push({ fn, reason: "Bağlantı hatası: " + e.message });
    }
  }

  console.log("\n✅ KULLANILABILIR FONKSİYONLAR:");
  if (available.length === 0) {
    console.log("   Hiçbiri bulunamadı.");
  } else {
    available.forEach(({ fn, status }) => console.log(`   ${status}: ${fn}`));
  }

  console.log("\n❌ BULUNAMAYAN FONKSİYONLAR:");
  if (missing.length === 0) {
    console.log("   Hepsi mevcut!");
  } else {
    missing.forEach(({ fn, reason }) => console.log(`   ✗ ${fn}  (${reason})`));
  }

  console.log("\n─".repeat(60));
  console.log(
    `\n📊 Özet: ${available.length} mevcut / ${missing.length} eksik`,
  );
}

main().catch(console.error);
