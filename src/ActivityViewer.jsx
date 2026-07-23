import { useState, useEffect, useRef } from "react";

// ─────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────
import { moodlePost } from "./moodleApi";
// Removed local moodlePost


const formatBytes = (bytes) => {
  if (!bytes || bytes === 0) return "0 B";
  if (bytes < 1024) return bytes + " B";
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(0) + " KB";
  return (bytes / (1024 * 1024)).toFixed(1) + " MB";
};

const formatDate = (ts) => {
  if (!ts) return null;
  return new Date(ts * 1000).toLocaleDateString("tr-TR", {
    day: "2-digit", month: "long", year: "numeric",
    hour: "2-digit", minute: "2-digit",
  });
};

const getFileUrl = (fileurl, token, forceDownload = false) => {
  if (!fileurl) return "";
  let url = fileurl.replace("https://moodle.argeyazilim.tr", "/api");
  if (url.includes("/pluginfile.php/") && !url.includes("/webservice/pluginfile.php/")) {
    url = url.replace("/pluginfile.php/", "/webservice/pluginfile.php/");
  }
  if (!url.includes("token=")) {
    url += (url.includes("?") ? "&" : "?") + `token=${token}`;
  }
  if (forceDownload) {
    url += "&forcedownload=1";
  }
  return url;
};

const getMimeIcon = (mime) => {
  if (!mime) return "📄";
  if (mime.includes("pdf")) return "📕";
  if (mime.includes("image")) return "🖼️";
  if (mime.includes("video")) return "🎬";
  if (mime.includes("audio")) return "🎵";
  if (mime.includes("word") || mime.includes("document")) return "📝";
  if (mime.includes("excel") || mime.includes("spreadsheet")) return "📊";
  if (mime.includes("powerpoint") || mime.includes("presentation")) return "📊";
  if (mime.includes("zip") || mime.includes("compressed")) return "📦";
  return "📄";
};

// ─────────────────────────────────────────────
// Shared UI
// ─────────────────────────────────────────────
const LoadingSpinner = () => (
  <div className="flex flex-col items-center justify-center py-20 gap-3">
    <div className="w-8 h-8 border-4 border-gray-200 border-t-[#495057] rounded-full animate-spin" />
    <span className="text-[13px] text-gray-400">Yükleniyor...</span>
  </div>
);

const modMeta = {
  assign:         { icon: "📝", bg: "bg-blue-100",   text: "text-blue-600",   label: "Ödev" },
  quiz:           { icon: "📋", bg: "bg-orange-100",  text: "text-orange-600", label: "Sınav" },
  resource:       { icon: "📄", bg: "bg-purple-100",  text: "text-purple-600", label: "Dosya" },
  url:            { icon: "🔗", bg: "bg-cyan-100",    text: "text-cyan-600",   label: "Bağlantı" },
  page:           { icon: "📃", bg: "bg-green-100",   text: "text-green-600",  label: "Sayfa" },
  forum:          { icon: "💬", bg: "bg-pink-100",    text: "text-pink-600",   label: "Forum" },
  folder:         { icon: "📁", bg: "bg-yellow-100",  text: "text-yellow-600", label: "Klasör" },
  label:          { icon: "🏷️", bg: "bg-gray-100",    text: "text-gray-600",   label: "Etiket" },
  scorm:          { icon: "📦", bg: "bg-indigo-100",  text: "text-indigo-600", label: "SCORM" },
  choice:         { icon: "✅", bg: "bg-teal-100",    text: "text-teal-600",   label: "Seçim" },
  feedback:       { icon: "📊", bg: "bg-red-100",     text: "text-red-600",    label: "Geri Bildirim" },
  glossary:       { icon: "📚", bg: "bg-amber-100",   text: "text-amber-600",  label: "Sözlük" },
  wiki:           { icon: "📖", bg: "bg-lime-100",    text: "text-lime-600",   label: "Wiki" },
  book:           { icon: "📕", bg: "bg-rose-100",    text: "text-rose-600",   label: "Kitap" },
};

const SectionHeader = ({ mod }) => {
  const m = modMeta[mod.modname] || { icon: "📌", bg: "bg-gray-100", text: "text-gray-600", label: mod.modname };
  return (
    <div className="flex items-center gap-3 mb-5">
      <div className={`w-11 h-11 rounded-xl flex items-center justify-center text-2xl shrink-0 ${m.bg}`}>
        {m.icon}
      </div>
      <div>
        <div className={`text-[11px] font-bold uppercase tracking-widest ${m.text}`}>{m.label}</div>
        <h2 className="text-[17px] font-bold text-[#495057] m-0 leading-snug">{mod.name}</h2>
      </div>
    </div>
  );
};

// ─────────────────────────────────────────────
// ASSIGN (Ödev)
// ─────────────────────────────────────────────
function AssignViewer({ mod, token }) {
  const [loading, setLoading] = useState(true);
  const [assignment, setAssignment] = useState(null);
  const [status, setStatus] = useState(null);
    const [file, setFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [msg, setMsg] = useState(null);
  const [nowSec] = useState(() => Date.now() / 1000);
  const fileRef = useRef(null);

  const loadData = async () => {
    setLoading(true);
    try {
      const [ar, sr] = await Promise.all([
        moodlePost(token, "mod_assign_get_assignments", { "assignmentids[0]": mod.instance }),
        moodlePost(token, "mod_assign_get_submission_status", { assignid: mod.instance }),
      ]);
      if (ar.assignments?.length > 0) setAssignment(ar.assignments[0]);
      setStatus(sr);
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  };

  useEffect(() => { loadData(); }, [mod.instance]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleSubmit = async () => {
    if (!file) { setMsg({ type: "error", text: "Lütfen önce bir dosya seçin." }); return; }
    setUploading(true);
    setMsg(null);
    try {
      // Moodle'ın standart multipart upload endpoint'i
      // core_files_upload'dan farklı olarak servis izni gerektirmez
      const formData = new FormData();
      formData.append("token", token);
      formData.append("file_0", file, file.name);

      const uploadRes = await fetch("/api/webservice/upload.php", {
        method: "POST",
        body: formData,
      });
      const uploadData = await uploadRes.json();

      if (!Array.isArray(uploadData) || !uploadData[0]?.itemid) {
        throw new Error(uploadData?.error || uploadData?.message || "Dosya sunucuya yüklenemedi.");
      }
      const itemid = uploadData[0].itemid;

      // Ödevi kaydet
      const save = await moodlePost(token, "mod_assign_save_submission", {
        assignmentid: mod.instance,
        "plugindata[files_filemanager]": itemid,
        "plugindata[onlinetext_editor][text]": "",
        "plugindata[onlinetext_editor][format]": 1,
        "plugindata[onlinetext_editor][itemid]": 0,
      });
      if (save?.exception) throw new Error("SAVE HATA: " + (save.message || "Kaydetme hatası.") + (save.debuginfo ? ` (Detay: ${save.debuginfo})` : ""));

      // Notlandırmaya gönder
      const gradeRes = await moodlePost(token, "mod_assign_submit_for_grading", {
        assignmentid: mod.instance,
        acceptsubmissionstatement: 1,
      });
      if (gradeRes?.exception) throw new Error("GRADING HATA: " + gradeRes.message);

      setMsg({ type: "success", text: "🎉 Ödeviniz başarıyla gönderildi!" });
      setFile(null);
      await loadData();
    } catch (e) {
      setMsg({ type: "error", text: "Hata: " + e.message });
    } finally { setUploading(false); }
  };

  if (loading) return <LoadingSpinner />;

  const sub = status?.lastattempt?.submission;
  const fb  = status?.feedback;
  const subStatus = sub?.status; // new | draft | submitted
  const gradeInfo = fb?.grade;
  const isGraded   = gradeInfo && parseFloat(gradeInfo.grade) >= 0;
  const isSubmitted = subStatus === "submitted";
  const isDraft     = subStatus === "draft";
  const dueTs = assignment?.duedate;
  const maxGrade = assignment?.grade;

  const badge = isGraded
    ? { bg: "bg-green-50 border-green-200",  icon: "✅", label: "Notlandırıldı",                     color: "text-green-700" }
    : isSubmitted
    ? { bg: "bg-blue-50 border-blue-200",    icon: "⏳", label: "Gönderildi · Değerlendirme Bekleniyor", color: "text-blue-700" }
    : isDraft
    ? { bg: "bg-yellow-50 border-yellow-200",icon: "✏️", label: "Taslak Kaydedildi",                  color: "text-yellow-700" }
    : { bg: "bg-red-50 border-red-200",      icon: "⚠️", label: "Henüz Gönderilmedi",                 color: "text-red-700" };

  // Submitted file list
  const submittedFiles = [];
  (sub?.plugins || []).forEach(p => {
    if (p.type === "file") {
      (p.fileareas || []).forEach(area => {
        (area.files || []).forEach(f => submittedFiles.push(f));
      });
    }
  });

  // Teacher comment
  const teacherComment = fb?.plugins?.find(p => p.type === "comments")?.editorfields?.[0]?.text;

  return (
    <div className="space-y-4">
      <SectionHeader mod={mod} />

      {/* Info card */}
      <div className="bg-white rounded-2xl border border-gray-200 p-5 shadow-sm">
        <div className="flex flex-wrap gap-2 mb-4">
          {dueTs ? (
            <span className={`text-[12px] font-semibold px-3 py-1 rounded-full ${dueTs < nowSec ? "bg-red-100 text-red-700" : "bg-emerald-100 text-emerald-700"}`}>
              📅 Son Teslim: {formatDate(dueTs)}
            </span>
          ) : (
            <span className="text-[12px] font-semibold px-3 py-1 rounded-full bg-gray-100 text-gray-500">📅 Son teslim tarihi yok</span>
          )}
          {maxGrade > 0 && (
            <span className="text-[12px] font-semibold px-3 py-1 rounded-full bg-purple-100 text-purple-700">⭐ Maks. Puan: {maxGrade}</span>
          )}
        </div>
        {assignment?.intro && (
          <div className="text-[13px] text-gray-600 leading-relaxed" dangerouslySetInnerHTML={{ __html: assignment.intro }} />
        )}
      </div>

      {/* Status badge */}
      <div className={`rounded-2xl border p-4 ${badge.bg}`}>
        <div className="flex items-start gap-3">
          <span className="text-xl mt-0.5">{badge.icon}</span>
          <div className="flex-1">
            <div className={`text-[13px] font-bold ${badge.color}`}>{badge.label}</div>
            {isGraded && (
              <div className="text-[13px] text-green-700 mt-1">
                Puanınız: <strong>{parseFloat(gradeInfo.grade).toFixed(1)}</strong>{maxGrade > 0 && ` / ${maxGrade}`}
              </div>
            )}
            {(isSubmitted || isDraft) && sub?.timemodified && (
              <div className="text-[12px] text-gray-500 mt-0.5">{isSubmitted ? "Gönderildi" : "Kaydedildi"}: {formatDate(sub.timemodified)}</div>
            )}
          </div>
        </div>

        {/* Submitted files */}
        {submittedFiles.length > 0 && (
          <div className="mt-3 space-y-2">
            {submittedFiles.map((f, i) => (
              <div key={i} className="flex items-center gap-3 bg-white/60 rounded-xl p-3 border border-white">
                <span className="text-lg">{getMimeIcon(f.mimetype)}</span>
                <div className="flex-1 min-w-0">
                  <div className="text-[13px] font-semibold text-[#495057] truncate">{f.filename}</div>
                  <div className="text-[11px] text-gray-400">{formatBytes(f.filesize)}</div>
                </div>
                <a href={getFileUrl(f.fileurl, token)} target="_blank" rel="noreferrer"
                  className="text-[12px] font-semibold text-blue-600 hover:underline shrink-0">
                  İndir
                </a>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Teacher feedback */}
      {isGraded && teacherComment && (
        <div className="bg-white rounded-2xl border border-gray-200 p-5 shadow-sm">
          <h3 className="text-[14px] font-bold text-[#495057] mb-3">💬 Öğretmen Geri Bildirimi</h3>
          <div className="text-[13px] text-gray-600 leading-relaxed" dangerouslySetInnerHTML={{ __html: teacherComment }} />
        </div>
      )}

      {/* Upload section */}
      {!isSubmitted && (
        <div className="bg-white rounded-2xl border border-gray-200 p-5 shadow-sm">
          <h3 className="text-[14px] font-bold text-[#495057] mb-4">
            📤 {isDraft ? "Taslağı Güncelle / Gönder" : "Ödev Gönder"}
          </h3>

          {/* Drop zone */}
          <div
            className={`border-2 border-dashed rounded-2xl p-8 text-center cursor-pointer transition-all ${
              file ? "border-blue-400 bg-blue-50" : "border-gray-300 hover:border-[#495057] hover:bg-gray-50"
            }`}
            onClick={() => fileRef.current?.click()}
            onDragOver={(e) => e.preventDefault()}
            onDrop={(e) => { e.preventDefault(); const f = e.dataTransfer.files[0]; if (f) setFile(f); }}
          >
            <input ref={fileRef} type="file" className="hidden" onChange={(e) => setFile(e.target.files[0])} />
            {file ? (
              <div className="flex flex-col items-center gap-2">
                <span className="text-4xl">{getMimeIcon(file.type)}</span>
                <span className="text-[14px] font-semibold text-blue-700">{file.name}</span>
                <span className="text-[12px] text-gray-400">{formatBytes(file.size)}</span>
                <button onClick={(e) => { e.stopPropagation(); setFile(null); }}
                  className="text-[12px] text-red-500 hover:underline mt-1">Kaldır</button>
              </div>
            ) : (
              <div className="flex flex-col items-center gap-2 text-gray-400">
                <span className="text-4xl">📂</span>
                <span className="text-[14px] font-medium text-gray-500">Dosya seçmek için tıklayın veya sürükleyin</span>
                <span className="text-[12px]">Tüm dosya türleri desteklenir</span>
              </div>
            )}
          </div>

          {msg && (
            <div className={`mt-3 p-3 rounded-xl text-[13px] font-medium border ${
              msg.type === "success" ? "bg-green-50 border-green-200 text-green-700" : "bg-red-50 border-red-200 text-red-700"
            }`}>{msg.text}</div>
          )}

          <button onClick={handleSubmit} disabled={!file || uploading}
            className="mt-4 w-full py-3 rounded-2xl text-[14px] font-semibold text-white flex items-center justify-center gap-2 transition-all
              bg-[#495057] hover:bg-[#343a40] disabled:bg-gray-300 disabled:cursor-not-allowed">
            {uploading
              ? <><div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />Gönderiliyor...</>
              : <>📤 Ödevi Gönder</>}
          </button>
        </div>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────
// QUIZ (Sınav) — Native tam uygulama
// ─────────────────────────────────────────────
function QuizViewer({ mod, token, userId, courseId }) {
  const [loading, setLoading] = useState(true);
  const [quiz, setQuiz] = useState(null);
  const [attempts, setAttempts] = useState([]);
    const [mode, setMode] = useState("info"); // info | taking | finished
  const [currentAttempt, setCurrentAttempt] = useState(null);
  const [questions, setQuestions] = useState([]);
  const [quizLoading, setQuizLoading] = useState(false);
  // eslint-disable-next-line no-unused-vars
  const [reviewLoading, setReviewLoading] = useState(false);

  // Özel Onay Penceresi Modalı
  const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);
  const [submitLoading, setSubmitLoading] = useState(false);
  const [error, setError] = useState(null);
  const [timeLeft, setTimeLeft] = useState(null);
  const [reviewData, setReviewData] = useState(null);
  
  // Pagination states
  const [currentPage, setCurrentPage] = useState(0);
  const [nextPage, setNextPage] = useState(-1);
  const [isNavigating, setIsNavigating] = useState(false);

  const containerRef = useRef(null);
  const timerRef = useRef(null);

  const loadData = async () => {
    setLoading(true);
    try {
      const [qr, ar] = await Promise.all([
        moodlePost(token, "mod_quiz_get_quizzes_by_courses", { "courseids[0]": courseId }),
        moodlePost(token, "mod_quiz_get_user_attempts", { quizid: mod.instance, userid: userId, status: "all" }),
      ]);
      const found = qr.quizzes?.find(q => q.id === mod.instance || q.coursemodule === mod.id) || qr.quizzes?.[0];
      setQuiz(found);
      setAttempts(ar.attempts || []);
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  };

  const collectAnswers = () => {
    const container = containerRef.current;
    if (!container) return [];
    const formData = [];
    const radioGroups = {};
    container.querySelectorAll('input[type="radio"]').forEach(r => {
      if (r.checked) radioGroups[r.name] = r.value;
    });
    Object.entries(radioGroups).forEach(([name, value]) => formData.push({ name, value }));
    container.querySelectorAll('input[type="checkbox"]').forEach(cb => {
      formData.push({ name: cb.name, value: cb.checked ? cb.value : "0" });
    });
    container.querySelectorAll('input[type="text"],input[type="number"],input[type="hidden"],select,textarea').forEach(el => {
      if (el.name && !el.name.startsWith('_:')) formData.push({ name: el.name, value: el.value });
    });
    return formData;
  };

  const handleSubmit = async (finish = true) => {
    setSubmitLoading(true);
    setError(null);
    if (finish) clearInterval(timerRef.current);
    try {
      const formData = collectAnswers();
      const params = { attemptid: currentAttempt?.id, finishattempt: finish ? 1 : 0, timeup: timeLeft === 0 ? 1 : 0 };
      formData.forEach((d, i) => { params[`data[${i}][name]`] = d.name; params[`data[${i}][value]`] = d.value; });
      const resData = await moodlePost(token, "mod_quiz_process_attempt", params);
      if (resData.exception) throw new Error(resData.message || "Gönderim hatası.");
      
      if (finish) {
        const review = await moodlePost(token, "mod_quiz_get_attempt_review", { attemptid: currentAttempt?.id });
        setReviewData(review);
        setMode("finished");
        await loadData();
      } else {
        setError("Cevaplar başarıyla kaydedildi."); 
        setTimeout(() => setError(null), 3000);
      }
    } catch (e) {
      setError("Hata: " + e.message);
    } finally { setSubmitLoading(false); }
  };

  useEffect(() => { loadData(); }, [mod.instance, courseId, userId]); // eslint-disable-line

  // Geri sayım
  useEffect(() => {
    if (mode !== "taking" || timeLeft === null || timeLeft <= 0) return;
    timerRef.current = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) { clearInterval(timerRef.current); handleSubmit(true); return 0; }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timerRef.current);
  }, [mode]); // eslint-disable-line

  const formatTimer = (secs) => {
    if (secs === null) return null;
    const m = Math.floor(secs / 60), s = secs % 60;
    return `${String(m).padStart(2,"0")}:${String(s).padStart(2,"0")}`;
  };

  const fetchPage = async (attemptId, pageNum) => {
    const qRes = await moodlePost(token, "mod_quiz_get_attempt_data", {
      attemptid: attemptId,
      page: pageNum,
    });
    if (qRes.exception) throw new Error(qRes.message);
    setQuestions(qRes.questions || []);
    setNextPage(qRes.nextpage !== undefined ? qRes.nextpage : -1);
    setCurrentPage(pageNum);
  };

  const startOrResume = async () => {
    setError(null);
    setQuizLoading(true);
    try {
      const ongoing = attempts.find(a => a.state === "inprogress");
      let attemptObj;
      if (ongoing) {
        attemptObj = ongoing;
      } else {
        const res = await moodlePost(token, "mod_quiz_start_attempt", {
          quizid: mod.instance,
          "preflightdata[0][name]": "quizpassword",
          "preflightdata[0][value]": "",
        });
        if (res.exception) throw new Error((res.message || "Sınav başlatılamadı.") + (res.debuginfo ? `\n(Detay: ${res.debuginfo})` : ""));
        if (!res.attempt) throw new Error(res.warnings?.[0]?.message || "Sınav başlatılamadı.");
        attemptObj = res.attempt;
      }
      if (!attemptObj || !attemptObj.id) {
          console.error("Geçersiz attemptObj:", attemptObj);
          throw new Error("Sınav başlatıldı ancak attempt kimliği (id) alınamadı. Lütfen sayfayı yenileyip tekrar deneyin.");
      }

      setCurrentAttempt(attemptObj);
      await fetchPage(attemptObj.id, attemptObj.currentpage || 0);

      if (quiz?.timelimit > 0 && attemptObj.timestart) {
        const elapsed = Math.floor(Date.now() / 1000) - attemptObj.timestart;
        const remaining = quiz.timelimit - elapsed;
        setTimeLeft(remaining > 0 ? remaining : 0);
      }
      setMode("taking");
    } catch (e) {
      setError("Hata: " + e.message);
    } finally { setQuizLoading(false); }
  };

  const navigatePage = async (targetPage) => {
    setIsNavigating(true);
    setError(null);
    try {
      const formData = collectAnswers();
      const params = { attemptid: currentAttempt.id, finishattempt: 0, timeup: 0 };
      formData.forEach((d, i) => { params[`data[${i}][name]`] = d.name; params[`data[${i}][value]`] = d.value; });
      const resData = await moodlePost(token, "mod_quiz_process_attempt", params);
      if (resData.exception) throw new Error(resData.message || "Cevaplar kaydedilemedi.");
      
      await fetchPage(currentAttempt.id, targetPage);
    } catch (e) {
      setError("Hata: " + e.message);
    } finally {
      setIsNavigating(false);
    }
  };

  if (loading) return <LoadingSpinner />;

  const finished = attempts.filter(a => a.state === "finished");
  const ongoing  = attempts.find(a => a.state === "inprogress");
  const calculateScaledGrade = (sumgrades) => {
    if (!quiz?.sumgrades || !quiz?.grade || parseFloat(quiz.sumgrades) === 0) return parseFloat(sumgrades || 0);
    return (parseFloat(sumgrades || 0) / parseFloat(quiz.sumgrades)) * parseFloat(quiz.grade);
  };
  const bestSumGrade = finished.reduce((b, a) => Math.max(b, parseFloat(a.sumgrades || 0)), 0);
  const bestGrade = calculateScaledGrade(bestSumGrade);
  const gradeSystemMax = quiz?.grade > 0 ? quiz.grade : quiz?.sumgrades;
  const maxAttempts = quiz?.attempts || 0;
  const canAttempt = maxAttempts === 0 || finished.length < maxAttempts || !!ongoing;

  // BİTTİ EKRANI
  if (mode === "finished") {
    const grade = parseFloat(reviewData?.grade || 0);
    const passed = quiz?.gradepass > 0 ? grade >= quiz.gradepass : true;
    return (
      <div className="space-y-4">
        <SectionHeader mod={mod} />
        <div className={`rounded-2xl border p-6 text-center ${passed ? "bg-green-50 border-green-200" : "bg-red-50 border-red-200"}`}>
          <div className="text-5xl mb-3">{passed ? "🎉" : "😔"}</div>
          <div className={`text-[22px] font-bold mb-1 ${passed ? "text-green-700" : "text-red-700"}`}>{passed ? "Tebrikler!" : "Başarısız"}</div>
          <div className="text-[15px] text-gray-600 mb-4">Puanınız: <strong>{calculateScaledGrade(reviewData?.grade || 0).toFixed(1)}</strong>{gradeSystemMax ? ` / ${gradeSystemMax}` : ""}</div>
          <button onClick={() => { setMode("info"); setReviewData(null); setQuestions([]); }}
            className="bg-[#495057] hover:bg-[#343a40] text-white text-[13px] font-semibold px-6 py-2 rounded-xl transition-colors">
            ← Sınav Bilgisine Dön
          </button>
        </div>
        {reviewData?.questions?.length > 0 && (
          <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
            <div className="px-5 py-3 border-b border-gray-100 font-bold text-[14px] text-[#495057]">📝 Soru İncelemesi</div>
            <style>{`.qrw .que{background:#fff;border-radius:12px;border:1px solid #e5e7eb;padding:16px;}.qrw .info{display:none;}.qrw .qtext{font-size:14px;font-weight:600;color:#374151;margin-bottom:10px;}.qrw .answer{font-size:13px;color:#495057;}.qrw input[type=radio],.qrw input[type=checkbox]{pointer-events:none;}`}</style>
            <div className="divide-y divide-gray-100">
              {reviewData.questions.map((q, i) => (
                <div key={q.slot} className="p-5">
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-[12px] font-bold text-gray-400">Soru {q.number || i+1}</span>
                    <span className={`text-[11px] font-bold px-2 py-0.5 rounded-full ${
                      q.state==="gradedright" ? "bg-green-100 text-green-700"
                      : q.state==="gradedwrong" ? "bg-red-100 text-red-700"
                      : q.state==="gradedpartial" ? "bg-yellow-100 text-yellow-700"
                      : "bg-gray-100 text-gray-500"}`}>
                      {q.state==="gradedright" ? `✓ ${q.mark} puan` : q.state==="gradedwrong" ? "✗ Yanlış" : q.state==="gradedpartial" ? `~ ${q.mark} puan` : q.status}
                    </span>
                  </div>
                  <div className="qrw" dangerouslySetInnerHTML={{ __html: q.html }} />
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    );
  }

  // SINAV EKRANI
  if (mode === "taking") {
    const timerWarning = timeLeft !== null && timeLeft < 300;
    return (
      <div className="space-y-4">
        <style>{`.qw .que{background:#fff;border-radius:16px;border:1px solid #e5e7eb;padding:20px;box-shadow:0 1px 3px rgba(0,0,0,.06);}.qw .info{display:none;}.qw .qtext{font-size:14px;font-weight:600;color:#374151;margin-bottom:12px;line-height:1.6;}.qw .answer{font-size:13px;color:#495057;}.qw .answer .r0,.qw .answer .r1,.qw .answer .r2,.qw .answer .r3,.qw .answer .r4{display:flex;align-items:center;gap:8px;padding:8px 12px;border-radius:10px;margin:4px 0;cursor:pointer;border:1px solid #e5e7eb;transition:background .15s;}.qw .answer .r0:hover,.qw .answer .r1:hover,.qw .answer .r2:hover,.qw .answer .r3:hover,.qw .answer .r4:hover{background:#f3f4f6;}.qw input[type=radio],.qw input[type=checkbox]{width:16px;height:16px;cursor:pointer;}.qw input[type=text],.qw textarea{width:100%;border:1px solid #d1d5db;border-radius:8px;padding:8px 12px;font-size:13px;outline:none;}.qw input[type=text]:focus,.qw textarea:focus{border-color:#495057;}.qw label{cursor:pointer;flex:1;}.qw .ablock{margin-top:12px;}.qw select{border:1px solid #d1d5db;border-radius:8px;padding:6px 10px;font-size:13px;}`}</style>
        <div className="flex items-center justify-between bg-white rounded-2xl border border-gray-200 px-5 py-3 shadow-sm sticky top-0 z-10">
          <div className="flex items-center gap-3">
            <span className="text-xl">📋</span>
            <span className="text-[14px] font-bold text-[#495057] truncate max-w-[200px]">{mod.name}</span>
          </div>
          <div className="flex items-center gap-3">
            {timeLeft !== null && (
              <div className={`text-[13px] font-bold px-3 py-1.5 rounded-xl border ${timerWarning ? "text-red-600 bg-red-50 border-red-200 animate-pulse" : "text-[#495057] bg-gray-50 border-gray-200"}`}>
                ⏱️ {formatTimer(timeLeft)}
              </div>
            )}
            <span className="text-[12px] text-gray-400">{questions.length} soru</span>
          </div>
        </div>
        {error && <div className="bg-red-50 border border-red-200 text-red-700 text-[13px] font-medium p-3 rounded-xl">{error}</div>}
        <div ref={containerRef} className="qw space-y-3">
          {questions.length === 0
            ? <div className="text-center py-10 text-gray-400 bg-white rounded-2xl border border-gray-200">Soru bulunamadı.</div>
            : questions.map((q, i) => (
              <div key={q.slot} className="bg-white rounded-2xl border border-gray-200 p-5 shadow-sm">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-[12px] font-bold text-gray-400 uppercase tracking-wide">Soru {q.number || i+1}</span>
                  {q.maxmark > 0 && <span className="text-[11px] text-gray-400">{q.maxmark} puan</span>}
                </div>
                <div dangerouslySetInnerHTML={{ __html: q.html }} />
              </div>
            ))}
        </div>
        <div className="bg-white rounded-2xl border border-gray-200 p-4 shadow-sm flex items-center gap-3">
          {currentPage > 0 && (
            <button onClick={() => navigatePage(currentPage - 1)} disabled={submitLoading || isNavigating}
              className="px-4 py-3 rounded-xl text-[13px] font-semibold border border-gray-300 text-[#495057] hover:bg-gray-50 transition-colors disabled:opacity-50">
              ← Geri
            </button>
          )}

          <button onClick={() => handleSubmit(false)} disabled={submitLoading || isNavigating}
            className="flex-1 py-3 rounded-xl text-[13px] font-semibold border border-gray-300 text-[#495057] hover:bg-gray-50 transition-colors disabled:opacity-50">
            💾 Kaydet
          </button>

          {nextPage !== -1 ? (
            <button onClick={() => navigatePage(nextPage)} disabled={submitLoading || isNavigating}
              className="px-6 py-3 rounded-xl text-[13px] font-semibold text-white bg-blue-600 hover:bg-blue-700 transition-colors disabled:opacity-50">
              İleri →
            </button>
          ) : (
            <button
              onClick={() => setIsConfirmModalOpen(true)}
              disabled={submitLoading || isNavigating}
              className="flex-[2] py-3 rounded-xl text-[14px] font-semibold text-white bg-[#495057] hover:bg-[#343a40] transition-colors flex items-center justify-center gap-2 disabled:opacity-50">
              {submitLoading ? <><div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"/>Gönderiliyor...</> : "✅ Sınavı Bitir ve Gönder"}
            </button>
          )}
        </div>

        {/* Sınav Bitirme Onay Modalı */}
        {isConfirmModalOpen && (
          <div className="fixed inset-0 z-[300] bg-black/60 flex items-center justify-center p-4">
            <div className="bg-white rounded-xl shadow-2xl w-full max-w-sm flex flex-col overflow-hidden animate-zoom-in">
              <div className="p-5 flex items-center gap-3 border-b border-gray-100 bg-orange-50/50">
                <div className="w-10 h-10 rounded-full bg-orange-100 flex items-center justify-center text-orange-600 shrink-0">
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
                </div>
                <h3 className="font-bold text-gray-800 text-lg">Sınavı Bitir</h3>
              </div>
              <div className="p-6 text-gray-600 text-sm font-medium text-center">
                Sınavı bitirmek ve cevaplarınızı göndermek istediğinizden emin misiniz? Bu işlem geri alınamaz ve sınavınız sonlandırılır.
              </div>
              <div className="p-4 border-t border-gray-100 bg-gray-50 flex justify-end gap-3">
                <button 
                  onClick={() => setIsConfirmModalOpen(false)} 
                  className="px-5 py-2.5 bg-white border border-gray-300 text-gray-700 font-bold rounded-lg hover:bg-gray-100 transition-colors shadow-sm"
                >
                  Vazgeç
                </button>
                <button 
                  onClick={() => {
                    setIsConfirmModalOpen(false);
                    handleSubmit(true);
                  }} 
                  className="px-5 py-2.5 bg-blue-600 text-white font-bold rounded-lg hover:bg-blue-700 transition-colors shadow-md flex items-center gap-2"
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                  Evet, Sınavı Bitir
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  // BİLGİ EKRANI
  return (
    <div className="space-y-4">
      <SectionHeader mod={mod} />
      <div className="bg-white rounded-2xl border border-gray-200 p-5 shadow-sm">
        <div className="flex flex-wrap gap-2 mb-4">
          {quiz?.timelimit > 0 && <span className="text-[12px] font-semibold px-3 py-1 rounded-full bg-orange-100 text-orange-700">⏱️ Süre: {Math.floor(quiz.timelimit/60)} dk</span>}
          {maxAttempts > 0 && <span className="text-[12px] font-semibold px-3 py-1 rounded-full bg-blue-100 text-blue-700">🔁 İzin verilen deneme: {maxAttempts}</span>}
          {quiz?.grade > 0 && <span className="text-[12px] font-semibold px-3 py-1 rounded-full bg-purple-100 text-purple-700">⭐ Maks. Puan: {quiz.grade}</span>}
          {finished.length > 0 && <span className="text-[12px] font-semibold px-3 py-1 rounded-full bg-green-100 text-green-700">✅ {finished.length} deneme tamamlandı</span>}
        </div>
        {quiz?.intro && <div className="text-[13px] text-gray-600 leading-relaxed" dangerouslySetInnerHTML={{ __html: quiz.intro }} />}
      </div>
      {finished.length > 0 && (
        <div className="bg-green-50 border border-green-200 rounded-2xl p-4 flex items-center gap-3">
          <span className="text-2xl">🏆</span>
          <div>
            <div className="text-[13px] font-bold text-green-800">En İyi Puanınız</div>
            <div className="text-[20px] font-bold text-green-700">{bestGrade.toFixed(1)}{gradeSystemMax ? ` / ${gradeSystemMax}` : ""}</div>
          </div>
        </div>
      )}
      {attempts.length > 0 && (
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
          <div className="px-5 py-3 border-b border-gray-100 text-[14px] font-bold text-[#495057]">📊 Deneme Geçmişi</div>
          <div className="divide-y divide-gray-50">
            {attempts.map((a, i) => (
              <div key={a.id} className="flex items-center justify-between px-5 py-3">
                <div>
                  <div className="text-[13px] font-semibold text-[#495057]">Deneme {i+1}</div>
                  <div className="text-[11px] text-gray-400">{formatDate(a.timestart)}</div>
                </div>
                <div className="flex items-center gap-3">
                  {a.state === "finished" && a.sumgrades !== null && (
                    <div className="text-[13px] font-bold bg-green-100 text-green-700 px-3 py-1 rounded-full">{calculateScaledGrade(a.sumgrades).toFixed(1)}{gradeSystemMax ? ` / ${gradeSystemMax}` : ""}</div>
                  )}
                  <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-full ${a.state==="finished" ? "bg-green-100 text-green-700" : "bg-yellow-100 text-yellow-700"}`}>
                    {a.state === "finished" ? "Tamamlandı" : "Devam Ediyor"}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
      {error && <div className="bg-red-50 border border-red-200 text-red-700 text-[13px] font-medium p-3 rounded-xl">{error}</div>}
      {canAttempt ? (
        <button onClick={startOrResume} disabled={quizLoading}
          className="w-full py-3 rounded-2xl text-[14px] font-semibold text-white bg-[#495057] hover:bg-[#343a40] transition-colors flex items-center justify-center gap-2 disabled:opacity-50">
          {quizLoading ? <><div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"/>Yükleniyor...</> : ongoing ? "▶️ Devam Et" : attempts.length > 0 ? "🔁 Tekrar Dene" : "📋 Sınava Başla"}
        </button>
      ) : (
        <div className="text-center py-3 text-[13px] text-gray-400 bg-gray-50 rounded-2xl border border-gray-200">Maksimum deneme sayısına ulaşıldı.</div>
      )}
    </div>
  );
}


// ─────────────────────────────────────────────
// RESOURCE (Dosya)
// ─────────────────────────────────────────────
function ResourceViewer({ mod, token }) {
  const files = (mod.contents || []).filter(f => f.filename !== "index.html");

  return (
    <div className="space-y-4">
      <SectionHeader mod={mod} />
      {files.length === 0 ? (
        <div className="text-center py-10 text-gray-400 bg-white rounded-2xl border border-gray-200">
          Bu dokümana şu an erişilemiyor. Dokümanın erişim süresi dolmuş veya dosya henüz yüklenmemiş olabilir.
        </div>
      ) : (
        files.map((f, i) => {
          const url = getFileUrl(f.fileurl, token);
          const isImage = f.mimetype?.includes("image");
          const isPdf   = f.mimetype?.includes("pdf");
          return (
            <div key={i} className="bg-white rounded-2xl border border-gray-200 p-5 shadow-sm">
              <div className="flex items-center gap-4">
                <span className="text-4xl">{getMimeIcon(f.mimetype)}</span>
                <div className="flex-1 min-w-0">
                  <div className="text-[15px] font-bold text-[#495057] truncate">{f.filename}</div>
                  <div className="flex gap-3 mt-1 text-[12px] text-gray-400">
                    {f.filesize > 0 && <span>{formatBytes(f.filesize)}</span>}
                    {f.mimetype && <span>{f.mimetype}</span>}
                  </div>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <a href={url} target="_blank" rel="noreferrer"
                    className="flex items-center gap-1.5 bg-[#495057] hover:bg-[#343a40] text-white text-[13px] font-semibold px-4 py-2 rounded-xl transition-colors">
                    {isImage ? "🔍 Görüntüle" : isPdf ? "📖 Aç" : "🔍 Görüntüle"}
                  </a>
                  <a href={getFileUrl(f.fileurl, token, true)} download={f.filename} target="_blank" rel="noreferrer"
                    className="flex items-center gap-1.5 bg-blue-600 hover:bg-blue-700 text-white text-[13px] font-semibold px-4 py-2 rounded-xl transition-colors">
                    ⬇️ İndir
                  </a>
                </div>
              </div>

              {isImage && (
                <div className="mt-4 rounded-xl overflow-hidden border border-gray-200 bg-gray-50">
                  <img src={url} alt={f.filename} className="w-full max-h-96 object-contain" />
                </div>
              )}
              {isPdf && (
                <div className="mt-4 rounded-xl overflow-hidden border border-gray-200" style={{ height: 540 }}>
                  <iframe src={url} className="w-full h-full border-0" title={f.filename} />
                </div>
              )}
            </div>
          );
        })
      )}
    </div>
  );
}

// ─────────────────────────────────────────────
// URL (Bağlantı)
// ─────────────────────────────────────────────
function UrlViewer({ mod }) {
  const externalUrl = mod.contents?.[0]?.fileurl || mod.url || "";
  return (
    <div className="space-y-4">
      <SectionHeader mod={mod} />
      <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm">
        {mod.description && (
          <div className="text-[13px] text-gray-600 mb-5 pb-5 border-b border-gray-100 leading-relaxed"
            dangerouslySetInnerHTML={{ __html: mod.description }} />
        )}
        <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl mb-5 border border-gray-200">
          <span className="text-lg">🔗</span>
          <span className="text-[12px] text-gray-500 truncate flex-1">{externalUrl}</span>
        </div>
        <a href={externalUrl} target="_blank" rel="noreferrer"
          className="flex items-center justify-center gap-2 bg-[#495057] hover:bg-[#343a40] text-white text-[14px] font-semibold py-3 rounded-2xl transition-colors">
          🔗 Bağlantıyı Aç
        </a>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────
// PAGE (Sayfa)
// ─────────────────────────────────────────────
function PageViewer({ mod, token, courseId }) {
  const [loading, setLoading] = useState(true);
  const [content, setContent] = useState(null);
  
  useEffect(() => {
    moodlePost(token, "mod_page_get_pages_by_courses", { "courseids[0]": courseId })
      .then((r) => {
        const p = r.pages?.find(p => p.coursemodule === mod.id);
        setContent(p?.content || null);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [mod.id, courseId]); // eslint-disable-line react-hooks/exhaustive-deps

  if (loading) return <LoadingSpinner />;
  return (
    <div className="space-y-4">
      <SectionHeader mod={mod} />
      <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm">
        {content
          ? <div className="text-[14px] text-gray-700 leading-relaxed" dangerouslySetInnerHTML={{ __html: content }} />
          : <div className="text-center py-8 text-gray-400">İçerik bulunamadı.</div>}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────
// LABEL (Etiket)
// ─────────────────────────────────────────────
function LabelViewer({ mod }) {
  return (
    <div className="space-y-4">
      <SectionHeader mod={mod} />
      <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm">
        {mod.description
          ? <div className="text-[14px] text-gray-700 leading-relaxed" dangerouslySetInnerHTML={{ __html: mod.description }} />
          : <div className="text-center py-8 text-gray-400">İçerik bulunamadı.</div>}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────
// FOLDER (Klasör)
// ─────────────────────────────────────────────
function FolderViewer({ mod, token }) {
  const files = (mod.contents || []).filter(f => f.type === "file");
  return (
    <div className="space-y-4">
      <SectionHeader mod={mod} />
      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
        {files.length === 0
          ? <div className="text-center py-10 text-gray-400">Klasör boş.</div>
          : <div className="divide-y divide-gray-100">
              {files.map((f, i) => (
                <div key={i} className="flex items-center gap-3 px-5 py-4 hover:bg-gray-50 transition-colors">
                  <span className="text-2xl">{getMimeIcon(f.mimetype)}</span>
                  <div className="flex-1 min-w-0">
                    <div className="text-[13px] font-semibold text-[#495057] truncate">{f.filename}</div>
                    {f.filesize > 0 && <div className="text-[11px] text-gray-400">{formatBytes(f.filesize)}</div>}
                  </div>
                  <a href={getFileUrl(f.fileurl, token)} target="_blank" rel="noreferrer"
                    className="flex items-center gap-1 text-[13px] font-semibold text-blue-600 hover:text-blue-700 hover:underline shrink-0">
                    ⬇️ İndir
                  </a>
                </div>
              ))}
            </div>
        }
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────
// FORUM
// ─────────────────────────────────────────────
function ForumViewer({ mod, token }) {
  const [loading, setLoading] = useState(true);
  const [discussions, setDiscussions] = useState([]);
  const [expanded, setExpanded] = useState(null);
  const [posts, setPosts] = useState({});
  const [postsLoading, setPostsLoading] = useState(false);

  const [newSubject, setNewSubject] = useState("");
  const [newMessage, setNewMessage] = useState("");
  const [posting, setPosting] = useState(false);
  const [postMsg, setPostMsg] = useState(null);
  const [replyTo, setReplyTo] = useState(null);
  const [replyText, setReplyText] = useState("");
  const [replying, setReplying] = useState(false);

  const loadDiscussions = async () => {
    try {
      const r = await moodlePost(token, "mod_forum_get_forum_discussions", { forumid: mod.instance });
      setDiscussions(r.discussions || []);
    } catch (e) { console.error(e); }
    setLoading(false);
  };

  useEffect(() => {
    loadDiscussions();
  }, [mod.instance]); // eslint-disable-line react-hooks/exhaustive-deps

  const toggleDiscussion = async (d) => {
    if (expanded === d.id) { setExpanded(null); return; }
    setExpanded(d.id);
    if (posts[d.id]) return;
    setPostsLoading(true);
    try {
      const r = await moodlePost(token, "mod_forum_get_discussion_posts", { discussionid: d.id });
      setPosts(prev => ({ ...prev, [d.id]: r.posts || [] }));
    } catch (e) { console.error(e); }
    finally { setPostsLoading(false); }
  };

  const handlePost = async () => {
    if (!newSubject.trim() || !newMessage.trim()) { setPostMsg({ type: "error", text: "Konu ve mesaj gereklidir." }); return; }
    setPosting(true);
    setPostMsg(null);
    try {
      const res = await moodlePost(token, "mod_forum_add_discussion", {
        forumid: mod.instance,
        subject: newSubject,
        message: newMessage,
      });
      if (res.exception) throw new Error(res.message);
      setPostMsg({ type: "success", text: "✅ Tartışma konusu açıldı!" });
      setNewSubject(""); setNewMessage("");
      await loadDiscussions();
    } catch (e) { setPostMsg({ type: "error", text: "Hata: " + e.message }); }
    setPosting(false);
  };

  const handleReply = async (discussionId) => {
    if (!replyText.trim()) return;
    setReplying(true);
    try {
      const dis = discussions.find(d => d.id === discussionId);
      await moodlePost(token, "mod_forum_add_discussion_post", {
        postid: dis?.id || 0,
        subject: "Re: " + (dis?.subject || ""),
        message: replyText,
      });
      setReplyTo(null); setReplyText("");
      const r = await moodlePost(token, "mod_forum_get_discussion_posts", { discussionid: discussionId });
      setPosts(prev => ({ ...prev, [discussionId]: r.posts || [] }));
    } catch (e) { console.error(e); }
    setReplying(false);
  };

  if (loading) return <LoadingSpinner />;
  return (
    <div className="space-y-4">
      <SectionHeader mod={mod} />
      
      {discussions.length === 0
        ? <div className="bg-white rounded-2xl border border-gray-200 p-10 text-center text-gray-400">Henüz tartışma konusu yok.</div>
        : <div className="space-y-3">
            {discussions.map(d => (
              <div key={d.id} className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
                <div className="flex items-start gap-3 p-4 cursor-pointer hover:bg-gray-50 transition-colors" onClick={() => toggleDiscussion(d)}>
                  {d.userpictureurl
                    ? <img src={d.userpictureurl} alt="" className="w-9 h-9 rounded-full object-cover shrink-0" />
                    : <div className="w-9 h-9 rounded-full bg-gray-200 flex items-center justify-center text-gray-500 text-sm shrink-0">👤</div>
                  }
                  <div className="flex-1 min-w-0">
                    <div className="text-[14px] font-bold text-[#495057]">{d.subject}</div>
                    <div className="flex flex-wrap items-center gap-2 mt-0.5">
                      <span className="text-[12px] text-gray-400">{d.userfullname}</span>
                      <span className="text-[11px] text-gray-300">•</span>
                      <span className="text-[12px] text-gray-400">{formatDate(d.timemodified)}</span>
                      {d.numreplies > 0 && (
                        <span className="text-[11px] font-semibold text-blue-600 bg-blue-50 px-2 py-0.5 rounded-full">{d.numreplies} yanıt</span>
                      )}
                    </div>
                  </div>
                  <span className="text-gray-300 shrink-0 transition-transform" style={{ transform: expanded === d.id ? "rotate(90deg)" : "none" }}>▶</span>
                </div>

                {expanded === d.id && (
                  <div className="border-t border-gray-100">
                    {postsLoading && !posts[d.id] ? (
                      <div className="flex justify-center py-4"><div className="w-5 h-5 border-2 border-gray-300 border-t-[#495057] rounded-full animate-spin" /></div>
                    ) : (
                      <>
                        {(posts[d.id] || []).map(p => (
                          <div key={p.id} className="p-4 border-b border-gray-50 last:border-0"
                            style={{ paddingLeft: p.parent ? "3.5rem" : "1rem" }}>
                            <div className="flex items-start gap-3">
                              {p.author?.profileimageurl || p.userpictureurl
                                ? <img src={p.author?.profileimageurl || p.userpictureurl} alt="" className="w-7 h-7 rounded-full object-cover shrink-0" />
                                : <div className="w-7 h-7 rounded-full bg-gray-200 flex items-center justify-center text-gray-400 text-xs shrink-0">👤</div>
                              }
                              <div className="flex-1">
                                <div className="flex items-center gap-2 mb-1">
                                  <span className="text-[12px] font-bold text-[#495057]">{p.author?.fullname || p.userfullname}</span>
                                  <span className="text-[11px] text-gray-400">{formatDate(p.timecreated)}</span>
                                </div>
                                <div className="text-[13px] text-gray-600 leading-relaxed"
                                  dangerouslySetInnerHTML={{ __html: p.message || "" }} />
                              </div>
                            </div>
                          </div>
                        ))}
                        {replyTo === d.id ? (
                          <div className="p-4 border-t border-gray-100 bg-gray-50 space-y-2">
                            <textarea rows={2} value={replyText} onChange={e => setReplyText(e.target.value)}
                              className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm outline-none focus:border-blue-400 resize-none"
                              placeholder="Yanıt yazın..." />
                            <div className="flex gap-2">
                              <button onClick={() => setReplyTo(null)} className="text-sm font-semibold text-gray-500 hover:text-gray-700">İptal</button>
                              <button onClick={() => handleReply(d.id)} disabled={replying}
                                className="bg-blue-600 text-white text-sm font-bold px-5 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50">
                                {replying ? "Gönderiliyor..." : "Yanıtla"}
                              </button>
                            </div>
                          </div>
                        ) : (
                          <div className="p-4 border-t border-gray-100 bg-gray-50">
                            <button onClick={() => setReplyTo(d.id)} className="text-sm font-bold text-blue-600 hover:text-blue-800">↩ Yanıt Yaz</button>
                          </div>
                        )}
                      </>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
      }
    </div>
  );
}

// ─────────────────────────────────────────────
// CHOICE (Seçim / Anket)
// ─────────────────────────────────────────────
function ChoiceViewer({ mod, token }) {
  const [loading, setLoading] = useState(true);
  const [choice, setChoice] = useState(null);
    const [selected, setSelected] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [msg, setMsg] = useState(null);
  const [results, setResults] = useState(null);

  const loadData = async () => {
    setLoading(true);
    // mod_choice_get_choice_options ve mod_choice_get_choice_results ayrı ayrı
    // çekilmeli; results öğrencide yetki hatası verebileceğinden biri başarısız
    // olsa dahi diğeri çalışmaya devam etsin.
    let cr = null;
    let rr = null;
    try {
      cr = await moodlePost(token, "mod_choice_get_choice_options", { choiceid: mod.instance });
      console.debug("[ChoiceViewer] get_choice_options raw:", cr);
    } catch (e) { console.error("[ChoiceViewer] get_choice_options hatası:", e); }

    try {
      rr = await moodlePost(token, "mod_choice_get_choice_results", { choiceid: mod.instance });
      console.debug("[ChoiceViewer] get_choice_results raw:", rr);
    } catch (e) { console.warn("[ChoiceViewer] get_choice_results erişilemedi (yetki?):", e); }

    // API yanıtı bazen doğrudan dizi, bazen { options: [] } şeklinde olabilir
    const normalizeOptions = (data) => {
      if (!data) return null;
      if (Array.isArray(data)) return { options: data };
      if (data.options && Array.isArray(data.options)) return data;
      // Bazen { 0: {...}, 1: {...} } gibi numerik key'li obje gelir
      const keys = Object.keys(data);
      if (keys.length && !isNaN(keys[0])) return { options: Object.values(data) };
      return data;
    };

    const normalizedCr = normalizeOptions(cr);
    const normalizedRr = normalizeOptions(rr);

    setChoice(normalizedCr);
    setResults(normalizedRr);

    // Önceki seçimi bul: önce get_choice_options'daki checked alanına bak
    // (get_choice_results erişilemeyen durumlarda fallback olarak kullanılır)
    const crOpts = normalizedCr?.options || [];
    const resOpts = normalizedRr?.options || [];

    let prevSelected = null;
    // get_choice_options: checked=true olan seçenek
    crOpts.forEach(opt => { if (opt.checked) prevSelected = opt.id ?? null; });
    // get_choice_results: userresponded olan seçenek (öncelikli)
    resOpts.forEach(opt => { if (opt.userresponded) prevSelected = opt.id ?? null; });
    if (prevSelected !== null) setSelected(prevSelected);

    setLoading(false);
  };

  useEffect(() => { loadData(); }, [mod.instance]); // eslint-disable-line

  const handleSubmit = async () => {
    if (selected === null) { setMsg({ type: "error", text: "Lütfen bir seçenek seçin." }); return; }
    setSubmitting(true);
    setMsg(null);
    try {
      const res = await moodlePost(token, "mod_choice_submit_choice_response", {
        choiceid: mod.instance,
        "responses[0]": selected,
      });
      if (res.exception) throw new Error(res.message);
      setMsg({ type: "success", text: "✅ Yanıtınız kaydedildi!" });
      await loadData();
    } catch (e) {
      if (e.message && e.message.includes("allowupdate")) {
        setMsg({ type: "error", text: "Anket sadece 1 kere cevaplanabilir." });
      } else {
        setMsg({ type: "error", text: "Hata: " + e.message });
      }
    } finally { setSubmitting(false); }
  };

  if (loading) return <LoadingSpinner />;

  const options = choice?.options || results?.options || [];
  // Moodle API: countanswers (get_choice_options) veya numberresponses (get_choice_results)
  const totalResponses = options.reduce((s, o) => s + (o.countanswers ?? o.numberresponses ?? o.numberofuser ?? 0), 0);

  return (
    <div className="space-y-4">
      <SectionHeader mod={mod} />
      {mod.description && (
        <div className="bg-white rounded-2xl border border-gray-200 p-5 shadow-sm">
          <div className="text-[13px] text-gray-600 leading-relaxed" dangerouslySetInnerHTML={{ __html: mod.description }} />
        </div>
      )}
      <div className="bg-white rounded-2xl border border-gray-200 p-5 shadow-sm space-y-3">
        <h3 className="text-[14px] font-bold text-[#495057] mb-4">Seçeneğinizi İşaretleyin</h3>
        {options.length === 0 ? (
          <div className="text-center py-8 text-gray-400 text-[13px]">
            <div className="text-3xl mb-2">📋</div>
            Anket seçenekleri yüklenemedi. Lütfen sayfayı yenileyin veya yöneticinize başvurun.
          </div>
        ) : options.map((opt, idx) => {
          const optText = opt.text || opt.name || opt.label || `Seçenek ${idx + 1}`;
          const optId   = opt.id ?? idx;
          const respCount = opt.countanswers ?? opt.numberresponses ?? opt.numberofuser ?? 0;
          const pct = totalResponses > 0 ? Math.round(respCount / totalResponses * 100) : 0;
          return (
            <div key={optId}
              onClick={() => !opt.disabled && setSelected(optId)}
              className={`border-2 rounded-xl p-4 cursor-pointer transition-all ${
                selected === optId ? "border-[#495057] bg-[#495057]/5" : "border-gray-200 hover:border-gray-300"
              } ${opt.disabled ? "opacity-50 cursor-not-allowed" : ""}`}>
              <div className="flex items-center gap-3">
                <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 transition-colors ${
                  selected === optId ? "border-[#495057] bg-[#495057]" : "border-gray-300"
                }`}>
                  {selected === optId && <div className="w-2 h-2 rounded-full bg-white" />}
                </div>
                <span className="text-[14px] font-medium text-[#495057] flex-1">{optText}</span>
                {totalResponses > 0 && (
                  <span className="text-[12px] font-bold text-gray-400">{respCount} kişi ({pct}%)</span>
                )}
              </div>
              {totalResponses > 0 && (
                <div className="mt-2 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                  <div className="h-full bg-[#495057] rounded-full transition-all" style={{ width: pct + "%" }} />
                </div>
              )}
            </div>
          );
        })}
        {msg && (
          <div className={`p-3 rounded-xl text-[13px] font-medium border ${
            msg.type === "success" ? "bg-green-50 border-green-200 text-green-700" : "bg-red-50 border-red-200 text-red-700"
          }`}>{msg.text}</div>
        )}
        {options.length > 0 && (
          <button onClick={handleSubmit} disabled={submitting || selected === null}
            className="w-full py-3 rounded-2xl text-[14px] font-semibold text-white bg-[#495057] hover:bg-[#343a40] disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2">
            {submitting ? <><div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />Kaydediliyor...</> : "✅ Yanıtı Gönder"}
          </button>
        )}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────
// FEEDBACK (Geri Bildirim)
// ─────────────────────────────────────────────
function FeedbackViewer({ mod, token }) {
  const [loading, setLoading] = useState(true);
  const [items, setItems] = useState([]);
    const [answers, setAnswers] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [msg, setMsg] = useState(null);
  const [completed, setCompleted] = useState(false);

  useEffect(() => {
    const load = async () => {
      try {
        const [ir, cr] = await Promise.all([
          moodlePost(token, "mod_feedback_get_items", { feedbackid: mod.instance }),
          moodlePost(token, "mod_feedback_get_last_completed", { feedbackid: mod.instance }),
        ]);
        setItems(ir.items || []);
        if (cr?.completed) setCompleted(true);
      } catch (e) { console.error(e); }
      finally { setLoading(false); }
    };
    load();
  }, [mod.instance]); // eslint-disable-line

  const handleSubmit = async () => {
    setSubmitting(true);
    setMsg(null);
    try {
      const responses = items.map((item) => ({
        name: `${item.typ}_${item.id}`,
        value: answers[item.id] ?? "",
      }));
      const params = { feedbackid: mod.instance };
      responses.forEach((r, i) => { params[`responses[${i}][name]`] = r.name; params[`responses[${i}][value]`] = r.value; });
      const res = await moodlePost(token, "mod_feedback_process_page", params);
      if (res.exception) throw new Error(res.message);
      setMsg({ type: "success", text: "✅ Geri bildiriminiz gönderildi!" });
      setCompleted(true);
    } catch (e) {
      setMsg({ type: "error", text: "Hata: " + e.message });
    } finally { setSubmitting(false); }
  };

  if (loading) return <LoadingSpinner />;

  if (completed) return (
    <div className="space-y-4">
      <SectionHeader mod={mod} />
      <div className="bg-green-50 border border-green-200 rounded-2xl p-8 text-center">
        <div className="text-4xl mb-3">✅</div>
        <div className="text-[16px] font-bold text-green-700">Geri bildiriminiz alındı!</div>
        <div className="text-[13px] text-green-600 mt-1">Katıldığınız için teşekkürler.</div>
      </div>
    </div>
  );

  return (
    <div className="space-y-4">
      <SectionHeader mod={mod} />
      {mod.description && (
        <div className="bg-white rounded-2xl border border-gray-200 p-5 shadow-sm">
          <div className="text-[13px] text-gray-600 leading-relaxed" dangerouslySetInnerHTML={{ __html: mod.description }} />
        </div>
      )}
      <div className="bg-white rounded-2xl border border-gray-200 p-5 shadow-sm space-y-5">
        {items.length === 0 ? (
          <div className="text-center py-10 text-gray-400">Bu geri bildirim formu henüz yapılandırılmamış.</div>
        ) : items.map((item, idx) => (
          <div key={item.id} className="border-b border-gray-100 pb-5 last:border-0 last:pb-0">
            <label className="block text-[14px] font-semibold text-[#495057] mb-3">
              {idx + 1}. {item.label || item.name}
              {item.required ? <span className="text-red-500 ml-1">*</span> : null}
            </label>
            {item.typ === "textarea" || item.typ === "essay" ? (
              <textarea
                rows={4}
                className="w-full border border-gray-200 rounded-xl p-3 text-[13px] outline-none focus:border-[#495057] resize-none"
                placeholder="Yanıtınızı buraya yazın..."
                value={answers[item.id] || ""}
                onChange={e => setAnswers(prev => ({ ...prev, [item.id]: e.target.value }))}
              />
            ) : item.typ === "textfield" ? (
              <input
                type="text"
                className="w-full border border-gray-200 rounded-xl p-3 text-[13px] outline-none focus:border-[#495057]"
                placeholder="Yanıtınız..."
                value={answers[item.id] || ""}
                onChange={e => setAnswers(prev => ({ ...prev, [item.id]: e.target.value }))}
              />
            ) : (item.typ === "multichoice" || item.typ === "multichoicerated") && item.options ? (
              <div className="space-y-2">
                {item.options.filter(Boolean).map((opt, oi) => (
                  <label key={oi} className="flex items-center gap-3 p-3 border border-gray-200 rounded-xl cursor-pointer hover:bg-gray-50">
                    <input
                      type={item.subtype === "c" ? "checkbox" : "radio"}
                      name={`feedback_${item.id}`}
                      value={opt}
                      checked={item.subtype === "c" ? (answers[item.id] || []).includes(opt) : answers[item.id] === opt}
                      onChange={() => {
                        if (item.subtype === "c") {
                          setAnswers(prev => {
                            const cur = prev[item.id] || [];
                            return { ...prev, [item.id]: cur.includes(opt) ? cur.filter(x => x !== opt) : [...cur, opt] };
                          });
                        } else {
                          setAnswers(prev => ({ ...prev, [item.id]: opt }));
                        }
                      }}
                      className="w-4 h-4"
                    />
                    <span className="text-[13px] text-[#495057]">{opt}</span>
                  </label>
                ))}
              </div>
            ) : item.typ === "numeric" ? (
              <input
                type="number"
                className="w-full border border-gray-200 rounded-xl p-3 text-[13px] outline-none focus:border-[#495057]"
                placeholder={`${item.rangefrom ?? 0} - ${item.rangeto ?? 10}`}
                min={item.rangefrom}
                max={item.rangeto}
                value={answers[item.id] || ""}
                onChange={e => setAnswers(prev => ({ ...prev, [item.id]: e.target.value }))}
              />
            ) : (
              <input
                type="text"
                className="w-full border border-gray-200 rounded-xl p-3 text-[13px] outline-none focus:border-[#495057]"
                placeholder="Yanıtınız..."
                value={answers[item.id] || ""}
                onChange={e => setAnswers(prev => ({ ...prev, [item.id]: e.target.value }))}
              />
            )}
          </div>
        ))}
        {msg && (
          <div className={`p-3 rounded-xl text-[13px] font-medium border ${
            msg.type === "success" ? "bg-green-50 border-green-200 text-green-700" : "bg-red-50 border-red-200 text-red-700"
          }`}>{msg.text}</div>
        )}
        {items.length > 0 && (
          <button onClick={handleSubmit} disabled={submitting}
            className="w-full py-3 rounded-2xl text-[14px] font-semibold text-white bg-[#495057] hover:bg-[#343a40] disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2">
            {submitting ? <><div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />Gönderiliyor...</> : "📤 Geri Bildirimi Gönder"}
          </button>
        )}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────
// SCORM
// ─────────────────────────────────────────────
function ScormViewer({ mod, token }) {
  const [loading, setLoading] = useState(true);
  const [scorm, setScorm] = useState(null);
  
  useEffect(() => {
    moodlePost(token, "mod_scorm_get_scorms_by_courses", { "courseids[0]": mod.course || 0 })
      .then(r => {
        const found = r.scorms?.find(s => s.coursemodule === mod.id || s.id === mod.instance);
        setScorm(found || null);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [mod.id]); // eslint-disable-line

  if (loading) return <LoadingSpinner />;

  // SCORM'u iframe içinde aç
  const scormUrl = `/api/mod/scorm/player.php?a=${mod.instance}&scoid=0&display=popup&mode=normal&token=${token}`;

  return (
    <div className="space-y-4">
      <SectionHeader mod={mod} />
      <div className="bg-white rounded-2xl border border-gray-200 p-5 shadow-sm">
        {scorm?.intro && (
          <div className="text-[13px] text-gray-600 leading-relaxed mb-5" dangerouslySetInnerHTML={{ __html: scorm.intro }} />
        )}
        <div className="flex flex-wrap gap-3 mb-5">
          {scorm?.maxgrade > 0 && <span className="text-[12px] font-semibold px-3 py-1 rounded-full bg-purple-100 text-purple-700">⭐ Maks. Puan: {scorm.maxgrade}</span>}
          {scorm?.maxattempt > 0 && <span className="text-[12px] font-semibold px-3 py-1 rounded-full bg-blue-100 text-blue-700">🔁 Maks. Deneme: {scorm.maxattempt}</span>}
        </div>
        <div className="rounded-xl overflow-hidden border border-gray-200 bg-gray-50" style={{ height: 600 }}>
          <iframe
            src={scormUrl}
            className="w-full h-full border-0"
            title={mod.name}
            allow="fullscreen"
          />
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────
// GLOSSARY (Sözlük)
// ─────────────────────────────────────────────
function GlossaryViewer({ mod, token }) {
  const [loading, setLoading] = useState(true);
  const [entries, setEntries] = useState([]);
    const [search, setSearch] = useState("");
  const [expanded, setExpanded] = useState(null);

  useEffect(() => {
    moodlePost(token, "mod_glossary_get_entries_by_search", {
      id: mod.instance, query: "", fullsearch: 1, sortkey: "CONCEPT", sortorder: "ASC", limit: 100, from: 0
    })
      .then(r => setEntries(r.entries || []))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [mod.instance]); // eslint-disable-line

  if (loading) return <LoadingSpinner />;

  const filtered = entries.filter(e =>
    !search || e.concept?.toLowerCase().includes(search.toLowerCase()) || e.definition?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-4">
      <SectionHeader mod={mod} />
      <div className="bg-white rounded-2xl border border-gray-200 p-4 shadow-sm">
        <input
          type="text"
          placeholder="Terim ara..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-[13px] outline-none focus:border-[#495057]"
        />
      </div>
      {filtered.length === 0 ? (
        <div className="bg-white rounded-2xl border border-gray-200 p-10 text-center text-gray-400">
          {search ? "Arama sonucu bulunamadı." : "Henüz terim eklenmemiş."}
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
          <div className="divide-y divide-gray-100">
            {filtered.map(e => (
              <div key={e.id}>
                <button
                  onClick={() => setExpanded(expanded === e.id ? null : e.id)}
                  className="w-full flex items-center justify-between px-5 py-4 hover:bg-gray-50 transition-colors text-left">
                  <div className="flex items-center gap-3">
                    <span className="text-[14px] font-bold text-[#495057]">{e.concept}</span>
                    {e.tags?.length > 0 && (
                      <div className="flex gap-1">
                        {e.tags.map((t, ti) => (
                          <span key={ti} className="text-[10px] font-semibold bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full">{t.rawname}</span>
                        ))}
                      </div>
                    )}
                  </div>
                  <span className="text-gray-300 transition-transform" style={{ transform: expanded === e.id ? "rotate(90deg)" : "none" }}>▶</span>
                </button>
                {expanded === e.id && (
                  <div className="px-5 pb-4 border-t border-gray-50">
                    <div className="text-[13px] text-gray-600 leading-relaxed mt-3" dangerouslySetInnerHTML={{ __html: e.definition }} />
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────
// BOOK (Kitap)
// ─────────────────────────────────────────────
function BookViewer({ mod, token, courseId }) {
  const [loading, setLoading] = useState(true);
  const [chapters, setChapters] = useState([]);
  const [activeChapter, setActiveChapter] = useState(null);
  
  useEffect(() => {
    moodlePost(token, "mod_book_get_books_by_courses", { "courseids[0]": courseId })
      .then(r => {
        const book = r.books?.find(b => b.coursemodule === mod.id || b.id === mod.instance);
        const chs = book?.chapters || [];
        setChapters(chs);
        if (chs.length > 0) setActiveChapter(chs[0]);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [mod.id, courseId]); // eslint-disable-line

  if (loading) return <LoadingSpinner />;

  if (chapters.length === 0) return (
    <div className="space-y-4">
      <SectionHeader mod={mod} />
      <div className="bg-white rounded-2xl border border-gray-200 p-10 text-center text-gray-400">Bölüm bulunamadı.</div>
    </div>
  );

  return (
    <div className="space-y-4">
      <SectionHeader mod={mod} />
      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden flex" style={{ minHeight: 500 }}>
        {/* Chapters sidebar */}
        <div className="w-56 shrink-0 border-r border-gray-100 overflow-y-auto">
          {chapters.map((ch, idx) => (
            <button
              key={ch.id}
              onClick={() => setActiveChapter(ch)}
              className={`w-full text-left px-4 py-3 text-[12px] border-b border-gray-50 transition-colors ${
                activeChapter?.id === ch.id ? "bg-[#495057] text-white font-semibold" : "hover:bg-gray-50 text-[#495057]"
              } ${ch.subchapter ? "pl-8" : ""}`}>
              <div className="flex items-center gap-2">
                {!ch.subchapter && <span className="font-bold text-[11px] opacity-60">{idx + 1}.</span>}
                {ch.subchapter && <span className="text-[10px] opacity-40">└</span>}
                <span className="truncate">{ch.title}</span>
              </div>
            </button>
          ))}
        </div>
        {/* Chapter content */}
        <div className="flex-1 p-6 overflow-y-auto">
          {activeChapter && (
            <>
              <h2 className="text-[18px] font-bold text-[#495057] mb-4">{activeChapter.title}</h2>
              <div className="text-[14px] text-gray-700 leading-relaxed" dangerouslySetInnerHTML={{ __html: activeChapter.content }} />
            </>
          )}
        </div>
      </div>
      {/* Navigation */}
      <div className="flex gap-3">
        <button
          onClick={() => {
            const i = chapters.findIndex(c => c.id === activeChapter?.id);
            if (i > 0) setActiveChapter(chapters[i - 1]);
          }}
          disabled={chapters[0]?.id === activeChapter?.id}
          className="flex-1 py-3 rounded-2xl border border-gray-200 text-[13px] font-semibold text-[#495057] hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors">
          ← Önceki Bölüm
        </button>
        <button
          onClick={() => {
            const i = chapters.findIndex(c => c.id === activeChapter?.id);
            if (i < chapters.length - 1) setActiveChapter(chapters[i + 1]);
          }}
          disabled={chapters[chapters.length - 1]?.id === activeChapter?.id}
          className="flex-1 py-3 rounded-2xl border border-gray-200 text-[13px] font-semibold text-[#495057] hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors">
          Sonraki Bölüm →
        </button>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────
// WIKI
// ─────────────────────────────────────────────
function WikiViewer({ mod, token, courseId }) {
  const [loading, setLoading] = useState(true);
  const [pages, setPages] = useState([]);
  const [activePage, setActivePage] = useState(null);
  const [pageContent, setPageContent] = useState(null);
  const [contentLoading, setContentLoading] = useState(false);

  const loadPageContent = async (pageId) => {
    setContentLoading(true);
    try {
      const r = await moodlePost(token, "mod_wiki_get_page_contents", { pageid: pageId });
      setPageContent(r.page?.cachedcontent || r.page?.content || null);
    } catch (e) { console.error(e); }
    finally { setContentLoading(false); }
  };

  useEffect(() => {
    const load = async () => {
      try {
        const wr = await moodlePost(token, "mod_wiki_get_wikis_by_courses", { "courseids[0]": courseId });
        const wiki = wr.wikis?.find(w => w.coursemodule === mod.id || w.id === mod.instance);
        if (!wiki) { setLoading(false); return; }
        const pr = await moodlePost(token, "mod_wiki_get_subwiki_pages", { wikiid: wiki.id, groupid: 0, userid: 0 });
        const ps = pr.pages || [];
        setPages(ps);
        if (ps.length > 0) {
          setActivePage(ps[0]);
          loadPageContent(ps[0].id);
        }
      } catch (e) { console.error(e); }
      finally { setLoading(false); }
    };
    load();
  }, [mod.id, courseId]); // eslint-disable-line


  if (loading) return <LoadingSpinner />;

  if (pages.length === 0) return (
    <div className="space-y-4">
      <SectionHeader mod={mod} />
      <div className="bg-white rounded-2xl border border-gray-200 p-10 text-center text-gray-400">Wiki sayfası bulunamadı.</div>
    </div>
  );

  return (
    <div className="space-y-4">
      <SectionHeader mod={mod} />
      {pages.length > 1 && (
        <div className="bg-white rounded-2xl border border-gray-200 p-3 shadow-sm flex gap-2 flex-wrap">
          {pages.map(p => (
            <button key={p.id}
              onClick={() => { setActivePage(p); loadPageContent(p.id); }}
              className={`px-3 py-1.5 rounded-xl text-[12px] font-semibold transition-colors ${
                activePage?.id === p.id ? "bg-[#495057] text-white" : "bg-gray-100 text-[#495057] hover:bg-gray-200"
              }`}>
              {p.title}
            </button>
          ))}
        </div>
      )}
      <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm">
        <div className="flex items-center gap-3 mb-4">
          <button
            onClick={() => window.history.back()}
            className="w-8 h-8 flex items-center justify-center rounded-lg bg-gray-100 hover:bg-gray-200 text-gray-600 transition-colors"
            title="Geri Dön"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
          </button>
          <h2 className="text-[18px] font-bold text-[#495057] m-0">Aktivite Görüntüleyici v1.1</h2>
        </div>
        {contentLoading ? <LoadingSpinner /> : (
          pageContent
            ? <div className="text-[14px] text-gray-700 leading-relaxed" dangerouslySetInnerHTML={{ __html: pageContent }} />
            : <div className="text-center py-8 text-gray-400">İçerik bulunamadı.</div>
        )}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────
// BigBlueButtonViewer
// ─────────────────────────────────────────────
function BigBlueButtonViewer({ mod, token, userId }) {
  const [joining, setJoining] = useState(false);
  const [meetingInfo, setMeetingInfo] = useState(null);
  const [recordings, setRecordings] = useState([]);
  const [loadingBBB, setLoadingBBB] = useState(true);

  useEffect(() => {
    async function fetchBBBData() {
      try {
        const info = await moodlePost(token, "mod_bigbluebuttonbn_meeting_info", {
          bigbluebuttonbnid: mod.instance,
          groupid: 0
        });
        setMeetingInfo(info);

        let recs = null;
        try {
          const res = await fetch(`/api/local/vueapi/get_recordings.php?token=${token}&cmid=${mod.id}&bbbid=${mod.instance}`);
          if (res.ok) {
            recs = await res.json();
          }
        } catch(e) {
          console.error("Custom recording fetch error", e);
        }
        
        if (recs && recs.tabledata && recs.tabledata.data) {
          try {
            const parsed = JSON.parse(recs.tabledata.data);
            setRecordings(parsed);
          } catch(e) {}
        }
      } catch(e) {
        console.error(e);
      } finally {
        setLoadingBBB(false);
      }
    }
    fetchBBBData();
  }, [mod.instance, token]);

  const handleJoin = async () => {
    setJoining(true);
    try {
      // Proxy veya autologin sorunlarını (IP mismatch) aşmak için Moodle'a özel hazırladığımız
      // login_and_join.php scriptine token ile istek atıp doğrudan BBB'ye giriyoruz.
      const targetUrl = `https://moodle.argeyazilim.tr/local/vueapi/login_and_join.php?token=${token}&cmid=${mod.id}`;
      window.open(targetUrl, '_blank');
    } catch(e) {
      console.error(e);
    }
    setJoining(false);
  };

  const hasEnded = meetingInfo && meetingInfo.startedat > 0 && !meetingInfo.statusrunning;
  const isClosed = meetingInfo && meetingInfo.statusclosed;
  const isHiddenOrError = meetingInfo && meetingInfo.exception;
  const notStarted = meetingInfo && !meetingInfo.statusopen && !meetingInfo.statusrunning && !isClosed && !isHiddenOrError;
  const waitingForModerator = meetingInfo && meetingInfo.statusopen && !meetingInfo.statusrunning && !meetingInfo.canjoin;
  
  const canJoin = meetingInfo ? (meetingInfo.canjoin && !hasEnded && !isHiddenOrError) : true;

  let errorMessage = "Bu oturuma şu anda giriş yapılamaz.";
  if (isHiddenOrError) errorMessage = "Bu oturumun canlı yayın süresi dolmuş veya erişime kapatılmıştır. Aşağıdan (varsa) geçmiş ders kayıtlarını izleyebilirsiniz.";
  else if (hasEnded) errorMessage = "Bu oturum hoca tarafından sonlandırılmış ve katılım kapatılmıştır.";
  else if (isClosed) errorMessage = "Bu oturumun bitiş süresi geçmiş ve katılım kapatılmıştır.";
  else if (notStarted) errorMessage = "Bu oturumun başlangıç saati henüz gelmedi. (Not: Cihazınız ile sunucu saati arasında 1-2 dakikalık fark olabilir, lütfen biraz bekleyip sayfayı yenileyin).";
  else if (waitingForModerator) errorMessage = "Oturum hazır, ancak öğretmenin derse girip oturumu başlatması bekleniyor.";
  else errorMessage += "\nDetay: Katılım şu anda mümkün değil.";


  
  return (
    <div className="space-y-4">
      <SectionHeader mod={mod} />
      <div className="bg-white rounded-2xl border border-gray-200 p-10 shadow-sm flex flex-col items-center justify-center text-center">
        <div className="w-20 h-20 bg-indigo-50 rounded-full flex items-center justify-center text-4xl mb-6 shadow-inner">
          📹
        </div>
        <h3 className="text-xl font-extrabold text-[#495057] mb-2">{mod.name}</h3>
        <p className="text-sm text-gray-500 mb-8 max-w-md">
          {mod.description ? (
             <span dangerouslySetInnerHTML={{ __html: mod.description }} />
          ) : "Sanal sınıf oturumu. Kameranızı ve mikrofonunuzu kontrol ederek derse katılabilirsiniz."}
        </p>

        {loadingBBB ? (
          <div className="text-sm text-gray-400">Oturum durumu kontrol ediliyor...</div>
        ) : (
          <>
            {canJoin ? (
              <button 
                onClick={handleJoin}
                disabled={joining}
                className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-[15px] px-8 py-3.5 rounded-xl transition-all shadow-lg shadow-indigo-200 flex items-center gap-2 disabled:opacity-50 mb-6"
              >
                {joining ? "Bağlanıyor..." : "Oturuma Katıl →"}
              </button>
            ) : (
              <div className="mb-6 p-4 bg-blue-50 text-blue-700 rounded-xl font-medium border border-blue-100 text-sm flex items-start gap-3">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-blue-500 shrink-0 mt-0.5" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                </svg>
                <div>{errorMessage}</div>
              </div>
            )}
            
            {recordings && recordings.length > 0 && (
              <div className="w-full max-w-2xl mt-8">
                <h4 className="text-lg font-bold text-gray-700 mb-4 text-left border-b pb-2">Geçmiş Ders Kayıtları</h4>
                <div className="space-y-3">
                  {recordings.map((rec, i) => {
                     // The recording URL is usually inside the presentation/video object or the playback string.
                     // Extract the href from the play button HTML if it's rendered as HTML.
                     let href = "";
                     if (rec.playback && rec.playback.includes('href=')) {
                       const match = rec.playback.match(/href="([^"]+)"/);
                       if (match) {
                         const rawHref = match[1];
                         try {
                           const urlObj = new URL(rawHref);
                           const action = urlObj.searchParams.get("action");
                           const bn = urlObj.searchParams.get("bn");
                           const rid = urlObj.searchParams.get("rid");
                           
                           if (action === 'play' && rid) {
                             href = `https://moodle.argeyazilim.tr/local/vueapi/login_and_join.php?token=${token}&action=play&rid=${rid}`;
                             if (bn) href += `&bn=${bn}`;
                             else href += `&cmid=${mod.id}`;
                           } else {
                             href = rawHref;
                           }
                         } catch(e) {
                           href = rawHref;
                         }
                       }
                     }
                     
                     // Parse name from rec.recording HTML (Moodle 4.x returns HTML in this field)
                     let recName = "Ders Kaydı";
                     if (rec.recording) {
                       const div = document.createElement('div');
                       div.innerHTML = rec.recording;
                       const text = div.textContent || div.innerText || "";
                       if (text.trim()) recName = text.trim();
                     } else if (rec.name) {
                       recName = rec.name;
                     }
                     
                     // Format date
                     let formattedDate = "";
                     if (rec.date) {
                       const d = new Date(Number(rec.date));
                       if (!isNaN(d.getTime())) {
                         formattedDate = d.toLocaleDateString("tr-TR", { day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit" });
                       }
                     }

                     return (
                      <div key={i} className="flex justify-between items-center p-4 bg-gray-50 rounded-xl border border-gray-100 hover:shadow-sm transition-shadow">
                        <div className="text-left">
                          <div className="font-semibold text-gray-800">{recName}</div>
                          <div className="text-xs text-gray-500 mt-1">{formattedDate} • {rec.duration || "0"} dk</div>
                        </div>
                        {href ? (
                          <a href={href} target="_blank" rel="noreferrer" className="text-sm font-bold text-indigo-600 bg-indigo-50 px-4 py-2 rounded-lg hover:bg-indigo-100 transition-colors">
                            Kaydı İzle ▶
                          </a>
                        ) : (
                          <div className="text-sm text-gray-400">İzleme linki bulunamadı</div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────
// GENERIC fallback (Moodle'a yönlendirmez)
// ─────────────────────────────────────────────
function GenericViewer({ mod }) {
  return (
    <div className="space-y-4">
      <SectionHeader mod={mod} />
      <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm">
        {mod.description && (
          <div className="text-[14px] text-gray-700 leading-relaxed mb-5"
            dangerouslySetInnerHTML={{ __html: mod.description }} />
        )}
        {!mod.description && (
          <div className="text-center py-10 text-gray-400">
            <div className="text-4xl mb-3">📌</div>
            <div className="text-[15px] font-medium text-gray-500">{mod.name}</div>
            <div className="text-[13px] text-gray-400 mt-1">Bu aktivite türü desteklenmektedir ama içerik bulunamadı.</div>
          </div>
        )}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────
// MAIN EXPORT
// ─────────────────────────────────────────────
export default function ActivityViewer({ mod, token, userId, courseId, onBack }) {
  
  const renderViewer = () => {
    switch (mod.modname) {
      case "assign":    return <AssignViewer    mod={mod} token={token} userId={userId} />;
      case "quiz":      return <QuizViewer      mod={mod} token={token} userId={userId} courseId={courseId} />;
      case "resource":  return <ResourceViewer  mod={mod} token={token} />;
      case "url":       return <UrlViewer       mod={mod} />;
      case "page":      return <PageViewer      mod={mod} token={token} courseId={courseId} />;
      case "bigbluebuttonbn": return <BigBlueButtonViewer mod={mod} token={token} userId={userId} />;
      case "label":     return <LabelViewer     mod={mod} />;
      case "folder":    return <FolderViewer    mod={mod} token={token} />;
      case "forum":     return <ForumViewer     mod={mod} token={token} />;
      case "choice":    return <ChoiceViewer    mod={mod} token={token} userId={userId} />;
      case "feedback":  return <FeedbackViewer  mod={mod} token={token} />;
      case "scorm":     return <ScormViewer     mod={mod} token={token} />;
      case "glossary":  return <GlossaryViewer  mod={mod} token={token} />;
      case "book":      return <BookViewer      mod={mod} token={token} courseId={courseId} />;
      case "wiki":      return <WikiViewer      mod={mod} token={token} courseId={courseId} />;
      default:          return <GenericViewer   mod={mod} />;
    }
  };

  return (
    <div className="w-full max-w-3xl mx-auto">
      <button onClick={onBack}
        className="mb-5 flex items-center gap-2 text-[13px] font-semibold text-gray-500 hover:text-[#495057] transition-colors group">
        <svg className="w-4 h-4 group-hover:-translate-x-0.5 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
        </svg>
        İçerik Listesine Dön
      </button>
      {renderViewer()}
    </div>
  );
}
