import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "./AuthContext";

// ─────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────
import { moodlePost } from "./moodleApi";
// Removed local moodlePost

const formatDate = (ts) => {
  if (!ts) return "-";
  return new Date(ts * 1000).toLocaleDateString("tr-TR", { day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit" });
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

const formatBytes = (b) => {
  if (!b) return "";
  if (b < 1024) return b + " B";
  if (b < 1024 * 1024) return (b / 1024).toFixed(0) + " KB";
  return (b / (1024 * 1024)).toFixed(1) + " MB";
};

const Spinner = ({ text = "Yükleniyor..." }) => (
  <div className="flex items-center justify-center py-16 gap-3 flex-col">
    <div className="w-7 h-7 border-4 border-gray-200 border-t-blue-600 rounded-full animate-spin" />
    <span className="text-sm text-gray-400">{text}</span>
  </div>
);

// ─────────────────────────────────────────────
// ASSIGN — Öğrenci Gönderimleri + Not Verme
// ─────────────────────────────────────────────
function TeacherAssignViewer({ mod, token, courseId }) {
  const [assignment, setAssignment] = useState(null);
  const [submissions, setSubmissions] = useState([]);
  const [users, setUsers] = useState({});
  const [gradingId, setGradingId] = useState(null); // grading modal için userid
  const [loading, setLoading] = useState(false);
  const [gradeInput, setGradeInput] = useState("");
  const [feedbackInput, setFeedbackInput] = useState("");
  const [grading, setGrading] = useState(false);
  const [gradeMsg, setGradeMsg] = useState(null);

  const loadData = async () => {
    setLoading(true);
    try {
      const [ar, ur, sr] = await Promise.all([
        moodlePost(token, "mod_assign_get_assignments", { "assignmentids[0]": mod.instance }),
        moodlePost(token, "core_enrol_get_enrolled_users", { courseid: courseId }),
        moodlePost(token, "mod_assign_get_submissions", { "assignmentids[0]": mod.instance }),
      ]);
      if (ar.assignments?.length > 0) setAssignment(ar.assignments[0]);
      if (Array.isArray(ur)) {
        const m = {};
        ur.forEach(u => { m[u.id] = u; });
        setUsers(m);
      }
      if (sr.assignments?.length > 0) setSubmissions(sr.assignments[0].submissions || []);
    } catch (e) { console.error(e); }
    setLoading(false);
  };

  useEffect(() => { loadData(); }, [mod.instance, courseId]); // eslint-disable-line

  const handleGrade = async () => {
    if (!gradeInput && gradeInput !== 0) { setGradeMsg({ type: "error", text: "Lütfen bir not girin." }); return; }
    setGrading(true);
    setGradeMsg(null);
    try {
      const res = await moodlePost(token, "mod_assign_save_grade", {
        assignmentid: mod.instance,
        userid: gradingId,
        grade: parseFloat(gradeInput),
        attemptnumber: -1,
        addattempt: 0,
        workflowstate: "graded",
        applytoall: 0,
        "plugindata[assignfeedbackcomments_editor][text]": feedbackInput,
        "plugindata[assignfeedbackcomments_editor][format]": 1,
      });
      if (res?.exception) throw new Error(res.message);
      setGradeMsg({ type: "success", text: "✅ Not başarıyla kaydedildi!" });
      setTimeout(() => { setGradingId(null); setGradeInput(""); setFeedbackInput(""); setGradeMsg(null); loadData(); }, 1500);
    } catch (e) {
      setGradeMsg({ type: "error", text: "Hata: " + e.message });
    } finally { setGrading(false);    }
  };


  if (loading) return <Spinner />;

  const maxGrade = assignment?.grade || 100;

  return (
    <div className="space-y-4">
      <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm">
        <h2 className="text-lg font-bold text-gray-800 mb-1">{mod.name}</h2>
        <div className="flex gap-3 flex-wrap">
          {assignment?.duedate > 0 && <span className="text-xs font-semibold px-3 py-1 rounded-full bg-orange-100 text-orange-700">📅 Son Teslim: {formatDate(assignment.duedate)}</span>}
          <span className="text-xs font-semibold px-3 py-1 rounded-full bg-purple-100 text-purple-700">⭐ Maks: {maxGrade}</span>
          <span className="text-xs font-semibold px-3 py-1 rounded-full bg-blue-100 text-blue-700">📤 {submissions.filter(s => s.status === "submitted").length} gönderim</span>
        </div>
        {assignment?.intro && <div className="text-sm text-gray-600 mt-3 leading-relaxed" dangerouslySetInnerHTML={{ __html: assignment.intro }} />}
      </div>

      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        <div className="px-5 py-3 border-b border-gray-100 font-bold text-sm text-gray-700">👥 Öğrenci Gönderimleri</div>
        {submissions.length === 0 ? (
          <div className="text-center py-10 text-gray-400 text-sm">Henüz hiçbir öğrenci gönderim yapmamış.</div>
        ) : (
          <table className="w-full text-left text-sm">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-xs font-bold text-gray-500">Öğrenci</th>
                <th className="px-4 py-3 text-xs font-bold text-gray-500">Durum</th>
                <th className="px-4 py-3 text-xs font-bold text-gray-500">Tarih</th>
                <th className="px-4 py-3 text-xs font-bold text-gray-500">Dosyalar</th>
                <th className="px-4 py-3 text-xs font-bold text-gray-500">Not</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {submissions.map(sub => {
                const files = [];
                sub.plugins?.forEach(p => { if (p.type === "file") p.fileareas?.forEach(a => a.files?.forEach(f => files.push(f))); });
                const u = users[sub.userid];
                return (
                  <tr key={sub.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-4 py-3 font-semibold text-gray-800">{u?.fullname || `#${sub.userid}`}</td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${sub.status === "submitted" ? "bg-green-100 text-green-700" : "bg-yellow-100 text-yellow-700"}`}>
                        {sub.status === "submitted" ? "Gönderildi" : sub.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-xs text-gray-400">{formatDate(sub.timemodified)}</td>
                    <td className="px-4 py-3">
                      {files.length > 0 ? files.map((f, i) => (
                        <a key={i} href={getFileUrl(f.fileurl, token)} target="_blank" rel="noreferrer"
                          className="flex items-center gap-1 text-blue-600 hover:underline text-xs mb-1">
                          📄 {f.filename} <span className="text-gray-400">({formatBytes(f.filesize)})</span>
                        </a>
                      )) : <span className="text-xs text-gray-300 italic">Dosya yok</span>}
                    </td>
                    <td className="px-4 py-3">
                      <button onClick={() => { setGradingId(sub.userid); setGradeInput(""); setFeedbackInput(""); setGradeMsg(null); }}
                        className="bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold px-3 py-1.5 rounded-lg transition-colors">
                        Not Ver
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>

      {/* Not Verme Modal */}
      {gradingId && (
        <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6">
            <h3 className="text-base font-bold text-gray-800 mb-1">Not Ver</h3>
            <p className="text-sm text-gray-500 mb-5">{users[gradingId]?.fullname || `Öğrenci #${gradingId}`}</p>
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1">Not (0 – {maxGrade})</label>
                <input type="number" min={0} max={maxGrade} step={0.5}
                  value={gradeInput}
                  onChange={e => setGradeInput(e.target.value)}
                  className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm outline-none focus:border-blue-400"
                  placeholder={`0 - ${maxGrade}`} />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1">Geri Bildirim (isteğe bağlı)</label>
                <textarea rows={3}
                  value={feedbackInput}
                  onChange={e => setFeedbackInput(e.target.value)}
                  className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm outline-none focus:border-blue-400 resize-none"
                  placeholder="Öğrenciye geri bildirim..." />
              </div>
              {gradeMsg && (
                <div className={`p-3 rounded-xl text-sm font-medium border ${gradeMsg.type === "success" ? "bg-green-50 border-green-200 text-green-700" : "bg-red-50 border-red-200 text-red-700"}`}>
                  {gradeMsg.text}
                </div>
              )}
              <div className="flex gap-3">
                <button onClick={() => setGradingId(null)}
                  className="flex-1 py-2.5 border border-gray-200 rounded-xl text-sm font-semibold text-gray-600 hover:bg-gray-50 transition-colors">
                  İptal
                </button>
                <button onClick={handleGrade} disabled={grading}
                  className="flex-1 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-sm font-semibold transition-colors disabled:opacity-50 flex items-center justify-center gap-2">
                  {grading ? <><div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"/>Kaydediliyor...</> : "✅ Notu Kaydet"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────
// QUIZ — Sınav Sonuçları
// ─────────────────────────────────────────────
function TeacherQuizViewer({ mod, token, courseId }) {
  const navigate = useNavigate();
  const [quiz, setQuiz] = useState(null);
  const [users, setUsers] = useState([]);
  const [attemptsData, setAttemptsData] = useState({});
  const [expandedUser, setExpandedUser] = useState(null);
  const [reviewData, setReviewData] = useState({});
  const [reviewLoading, setReviewLoading] = useState(false);
  const [loading, setLoading] = useState(false);

  const [quizSlots, setQuizSlots] = useState([]);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const [qr, ur] = await Promise.all([
          moodlePost(token, "mod_quiz_get_quizzes_by_courses", { "courseids[0]": courseId }),
          moodlePost(token, "core_enrol_get_enrolled_users", { courseid: courseId })
        ]);
        const found = qr.quizzes?.find(q => q.id === mod.instance || q.coursemodule === mod.id) || qr.quizzes?.[0];
        setQuiz(found);
        
        // Backend'de local_vueapi_get_quiz_slots fonksiyonu yok! 
        // Frontend'de soru eklendiğinde cachelediğimiz verilere bakıyoruz.
        const cachedQuestions = JSON.parse(localStorage.getItem(`quiz_questions_cache_${mod.id}`) || "[]");
        
        if (cachedQuestions && cachedQuestions.length > 0) {
            setQuizSlots(cachedQuestions);
        } else if (found && (found.hasquestions === 1 || found.sumgrades > 0)) {
             setQuizSlots([{ id: "dummy", name: "Sınav Soruları Sisteme Yüklendi" }]);
        } else {
             setQuizSlots([]);
        }

        if (Array.isArray(ur)) {
          setUsers(ur);
          const attemptsMap = {};
          await Promise.all(ur.map(async u => {
            try {
              const res = await moodlePost(token, "mod_quiz_get_user_attempts", { quizid: mod.instance, userid: u.id, status: "all" });
              if (res.attempts?.length > 0) attemptsMap[u.id] = res.attempts[res.attempts.length - 1];
            } catch { /* ignore */ }
          }));
          setAttemptsData(attemptsMap);
        }
      } catch (e) { console.error(e); }
      setLoading(false);
    };
    load();
  }, [mod.instance, courseId, token]); // eslint-disable-line

  const loadReview = async (attemptId, userId) => {
    if (reviewData[attemptId]) { setExpandedUser(userId); return; }
    setReviewLoading(true);
    try {
      const r = await moodlePost(token, "mod_quiz_get_attempt_review", { attemptid: attemptId });
      setReviewData(prev => ({ ...prev, [attemptId]: r }));
    } catch { /* ignore */ }
    setReviewLoading(false);
    setExpandedUser(userId);
  };



  if (loading) return <Spinner text="Sınav sonuçları yükleniyor..." />;

  const participated = users.filter(u => attemptsData[u.id]);
  const notParticipated = users.filter(u => !attemptsData[u.id]);
  const avgGrade = participated.length > 0
    ? (participated.reduce((s, u) => s + parseFloat(attemptsData[u.id]?.sumgrades || 0), 0) / participated.length).toFixed(1)
    : "-";

  return (
    <div className="space-y-4">
      <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm">
        <div className="flex justify-between items-center mb-3">
          <h2 className="text-lg font-bold text-gray-800">📋 {mod.name}</h2>
          <button onClick={() => setIsEditModalOpen(true)}
             className="px-3 py-1.5 bg-indigo-50 text-indigo-700 hover:bg-indigo-100 rounded-lg text-xs font-bold transition-colors">
            📝 Soruları İncele / Düzenle
          </button>
        </div>
        <div className="grid grid-cols-3 gap-3">
          <div className="bg-blue-50 rounded-xl p-3 text-center">
            <div className="text-xl font-black text-blue-700">{participated.length}</div>
            <div className="text-xs text-blue-500 font-semibold">Katılan</div>
          </div>
          <div className="bg-gray-50 rounded-xl p-3 text-center">
            <div className="text-xl font-black text-gray-500">{notParticipated.length}</div>
            <div className="text-xs text-gray-400 font-semibold">Girmedi</div>
          </div>
          <div className="bg-green-50 rounded-xl p-3 text-center">
            <div className="text-xl font-black text-green-700">{avgGrade}</div>
            <div className="text-xs text-green-500 font-semibold">Ortalama</div>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden mb-4">
        <div className="px-5 py-3 border-b border-gray-100 font-bold text-sm text-gray-700 bg-gray-50 flex justify-between items-center">
            <span>📝 Sınav Durumu</span>
        </div>
        <div className="divide-y divide-gray-50">
            {quizSlots.length === 0 ? (
                <div className="p-8 text-center flex flex-col items-center justify-center bg-blue-50/30">
                    <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center text-3xl mb-4 shadow-inner">
                      ❓
                    </div>
                    <div className="text-base text-gray-700 font-bold mb-2">Bu sınava henüz soru eklenmemiş</div>
                    <div className="text-sm text-gray-500 mb-6 max-w-md">
                      Sınav başarıyla oluşturuldu. Ancak öğrencilerin sınava girebilmesi için soru bankasından soru seçip aktarmanız gerekmektedir.
                    </div>
                    <button onClick={() => navigate('/teacher-question-bank', { state: { courseId, cmid: mod.id } })}
                       className="px-6 py-3 bg-blue-600 text-white hover:bg-blue-700 rounded-lg text-sm font-bold shadow-md transition-all flex items-center gap-2 hover:-translate-y-0.5">
                      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
                      Soru Bankasından Soru Ekle
                    </button>
                </div>
            ) : (
                <div className="p-8 text-center flex flex-col items-center justify-center bg-green-50/30">
                    <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center text-3xl mb-4 shadow-inner text-green-600">
                      ✓
                    </div>
                    <div className="text-base text-gray-700 font-bold mb-2">Sorular Sınava Başarıyla Yüklendi</div>
                    <div className="text-sm text-gray-500 mb-6 max-w-md">
                      Öğrencileriniz artık bu sınava girebilir. Sınavdaki soruları incelemek isterseniz aşağıdaki butonu kullanabilirsiniz.
                    </div>
                    <div className="flex gap-3">
                        <button onClick={() => setIsEditModalOpen(true)}
                           className="px-6 py-3 bg-indigo-600 text-white hover:bg-indigo-700 rounded-lg text-sm font-bold shadow-md transition-all flex items-center gap-2 hover:-translate-y-0.5">
                          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>
                          Soruları İncele / Düzenle
                        </button>
                        <button onClick={() => navigate('/teacher-question-bank', { state: { courseId, cmid: mod.id } })}
                           className="px-6 py-3 bg-blue-600 text-white hover:bg-blue-700 rounded-lg text-sm font-bold shadow-md transition-all flex items-center gap-2 hover:-translate-y-0.5">
                          Soru Bankasından Ekle
                        </button>
                    </div>
                </div>
            )}
        </div>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        <div className="px-5 py-3 border-b border-gray-100 font-bold text-sm text-gray-700">👥 Öğrenci Sonuçları</div>
        <div className="divide-y divide-gray-50">
          {users.map(u => {
            const attempt = attemptsData[u.id];
            const grade = attempt?.sumgrades !== undefined && attempt.sumgrades !== null
              ? parseFloat(attempt.sumgrades).toFixed(1) : null;
            const isExpanded = expandedUser === u.id;
            const review = attempt ? reviewData[attempt.id] : null;

            return (
              <div key={u.id}>
                <div className="flex items-center justify-between px-5 py-3 hover:bg-gray-50 transition-colors">
                  <div className="flex items-center gap-3">
                    {u.profileimageurl
                      ? <img src={u.profileimageurl} alt="" className="w-8 h-8 rounded-full object-cover" />
                      : <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center text-gray-500 text-xs font-bold">{u.fullname?.[0]}</div>}
                    <span className="font-semibold text-sm text-gray-800">{u.fullname}</span>
                  </div>
                  <div className="flex items-center gap-3">
                    {attempt ? (
                      <>
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${attempt.state === "finished" ? "bg-green-100 text-green-700" : "bg-yellow-100 text-yellow-700"}`}>
                          {attempt.state === "finished" ? "Tamamlandı" : "Devam Ediyor"}
                        </span>
                        {grade !== null && (
                          <span className="font-bold text-sm text-blue-700 bg-blue-50 px-3 py-0.5 rounded-full">
                            {grade}{quiz?.sumgrades ? ` / ${quiz.sumgrades}` : ""}
                          </span>
                        )}
                        <button onClick={() => isExpanded ? setExpandedUser(null) : loadReview(attempt.id, u.id)}
                          className="text-xs font-semibold text-gray-400 hover:text-gray-700 transition-colors">
                          {isExpanded ? "Gizle ▲" : "Detay ▼"}
                        </button>
                      </>
                    ) : (
                      <span className="text-xs text-gray-300 italic">Girmedi</span>
                    )}
                  </div>
                </div>
                {isExpanded && (
                  <div className="bg-gray-50 border-t border-gray-100 px-5 py-4">
                    {reviewLoading && !review ? (
                      <div className="text-xs text-gray-400">Yükleniyor...</div>
                    ) : review?.questions?.length > 0 ? (
                      <div className="space-y-2">
                        {review.questions.map((q, qi) => (
                          <div key={q.slot} className="bg-white rounded-lg border border-gray-200 p-3">
                            <div className="flex items-center justify-between mb-1">
                              <span className="text-xs font-bold text-gray-500">Soru {q.number || qi + 1}</span>
                              <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                                q.state === "gradedright" ? "bg-green-100 text-green-700"
                                : q.state === "gradedwrong" ? "bg-red-100 text-red-700"
                                : "bg-gray-100 text-gray-500"}`}>
                                {q.state === "gradedright" ? `✓ ${q.mark}` : q.state === "gradedwrong" ? "✗ Yanlış" : q.status}
                              </span>
                            </div>
                            <div className="text-xs text-gray-600" dangerouslySetInnerHTML={{ __html: q.html }} />
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-xs text-gray-400">Soru detayları görüntülenemiyor.</div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Soru İnceleme Özel Modalı */}
      {isEditModalOpen && (
        <div className="fixed inset-0 z-[200] bg-black/60 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-4xl max-h-[85vh] flex flex-col overflow-hidden animate-fade-in-up">
            <div className="p-5 border-b border-gray-200 bg-gray-50 flex justify-between items-center shrink-0">
              <h3 className="text-lg font-bold text-gray-800 flex items-center gap-2">
                <svg className="w-6 h-6 text-indigo-600" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" /></svg>
                Sınava Eklenen Sorular
              </h3>
              <button onClick={() => setIsEditModalOpen(false)} className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-200 text-gray-600 transition-colors">
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            </div>
            <div className="flex-1 overflow-y-auto bg-gray-100 p-6">
                {quizSlots.length === 0 || (quizSlots.length === 1 && quizSlots[0].id === "dummy") ? (
                    <div className="bg-white rounded-xl p-10 text-center shadow-sm">
                        <div className="text-gray-400 mb-2">Henüz soru eklenmemiş veya veriler Moodle'dan alınamıyor.</div>
                    </div>
                ) : (
                    <div className="space-y-4">
                        {quizSlots.map((slot, idx) => (
                            <div key={idx} className="bg-white rounded-xl p-5 shadow-sm border border-gray-100 hover:border-indigo-100 transition-colors">
                                <div className="flex justify-between items-start mb-3">
                                    <div className="font-bold text-indigo-700 flex items-center gap-2">
                                        <span className="w-6 h-6 bg-indigo-100 text-indigo-700 rounded-full flex items-center justify-center text-xs">{idx + 1}</span>
                                        {slot.name || "İsimsiz Soru"}
                                    </div>
                                    <span className="text-[10px] font-bold text-gray-400 bg-gray-100 px-3 py-1 rounded-full uppercase">
                                        {slot.qtype || "Soru"}
                                    </span>
                                </div>
                                <div className="text-sm text-gray-700 prose prose-sm max-w-none" dangerouslySetInnerHTML={{ __html: slot.questiontext || slot.html || slot.text || "Soru metni bulunamadı." }} />
                            </div>
                        ))}
                    </div>
                )}
            </div>

            <div className="p-4 border-t border-gray-200 bg-white flex justify-between items-center shrink-0">
              <button onClick={() => navigate('/teacher-question-bank', { state: { courseId, cmid: mod.id } })} className="px-6 py-2 bg-gray-100 text-gray-700 font-bold rounded-lg hover:bg-gray-200 transition-colors">
                Yeni Soru Ekle
              </button>
              <button onClick={() => setIsEditModalOpen(false)} className="px-8 py-2.5 bg-indigo-600 text-white font-bold rounded-lg hover:bg-indigo-700 transition-colors shadow-md">
                Pencereyi Kapat
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────
// RESOURCE — Dosya görüntüle / güncelle
// ─────────────────────────────────────────────
function TeacherResourceViewer({ mod, token }) {
  const files = (mod.contents || []).filter(f => f.filename !== "index.html");

  return (
    <div className="space-y-4">
      <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm">
        <h2 className="text-lg font-bold text-gray-800 mb-4">📄 {mod.name}</h2>
        {files.length === 0 ? (
          <div className="text-center py-10 text-gray-400">Bu kaynağa ait dosya bulunamadı.</div>
        ) : (
          <div className="space-y-3">
            {files.map((f, i) => {
              const url = getFileUrl(f.fileurl, token);
              const isPdf = f.mimetype?.includes("pdf");
              const isImage = f.mimetype?.includes("image");
              return (
                <div key={i} className="border border-gray-200 rounded-xl p-4">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <span className="text-2xl">{isImage ? "🖼️" : isPdf ? "📕" : "📎"}</span>
                      <div>
                        <div className="font-bold text-sm text-gray-800">{f.filename}</div>
                        <div className="text-xs text-gray-400">{formatBytes(f.filesize)}{f.mimetype && ` · ${f.mimetype}`}</div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <a href={url} target="_blank" rel="noreferrer"
                        className="bg-gray-800 hover:bg-black text-white text-xs font-bold px-4 py-2 rounded-lg transition-colors">
                        {isImage ? "Görüntüle" : isPdf ? "Aç" : "Görüntüle"}
                      </a>
                      <a href={getFileUrl(f.fileurl, token, true)} download={f.filename} target="_blank" rel="noreferrer"
                        className="bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold px-4 py-2 rounded-lg transition-colors">
                        İndir
                      </a>
                    </div>
                  </div>
                  {isPdf && (
                    <div className="rounded-lg overflow-hidden border border-gray-100" style={{ height: 500 }}>
                      <iframe src={url} className="w-full h-full border-0" title={f.filename} />
                    </div>
                  )}
                  {isImage && (
                    <div className="rounded-lg overflow-hidden border border-gray-100 bg-gray-50">
                      <img src={url} alt={f.filename} className="max-h-96 w-full object-contain" />
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────
// URL
// ─────────────────────────────────────────────
function TeacherUrlViewer({ mod }) {
  const externalUrl = mod.contents?.[0]?.fileurl || mod.url || "";
  return (
    <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm space-y-4">
      <h2 className="text-lg font-bold text-gray-800">🔗 {mod.name}</h2>
      {mod.description && <div className="text-sm text-gray-600 leading-relaxed" dangerouslySetInnerHTML={{ __html: mod.description }} />}
      <div className="bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-sm text-gray-500 truncate">{externalUrl}</div>
      <a href={externalUrl} target="_blank" rel="noreferrer"
        className="flex items-center justify-center gap-2 bg-gray-800 hover:bg-black text-white font-bold py-3 rounded-xl transition-colors">
        🔗 Bağlantıyı Aç
      </a>
    </div>
  );
}

// ─────────────────────────────────────────────
// FORUM — Tartışma Yönetimi
// ─────────────────────────────────────────────
function TeacherForumViewer({ mod, token }) {
  const [discussions, setDiscussions] = useState([]);
  const [expanded, setExpanded] = useState(null);
  const [posts, setPosts] = useState({});
  const [newSubject, setNewSubject] = useState("");
  const [loading, setLoading] = useState(false);
  const [newMessage, setNewMessage] = useState("");
  const [posting, setPosting] = useState(false);
  const [postMsg, setPostMsg] = useState(null);
  const [replyTo, setReplyTo] = useState(null);
  const [replyText, setReplyText] = useState("");
  const [replying, setReplying] = useState(false);

  const loadDiscussions = async () => {
    setLoading(true);
    try {
      const r = await moodlePost(token, "mod_forum_get_forum_discussions", { forumid: mod.instance });
      setDiscussions(r.discussions || []);
    } catch (e) { console.error(e); }
    setLoading(false);
  };

  useEffect(() => { loadDiscussions(); }, [mod.instance]); // eslint-disable-line

  const toggleDiscussion = async (d) => {
    if (expanded === d.id) { setExpanded(null); return; }
    setExpanded(d.id);
    if (posts[d.id]) return;
    try {
      const r = await moodlePost(token, "mod_forum_get_discussion_posts", { discussionid: d.id });
      setPosts(prev => ({ ...prev, [d.id]: r.posts || [] }));
    } catch (e) { console.error(e); }
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

  if (loading) return <Spinner />;

  return (
    <div className="space-y-4">
      {/* Yeni Tartışma */}
      <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm">
        <h3 className="text-sm font-bold text-gray-700 mb-4">➕ Yeni Tartışma Konusu Aç</h3>
        <div className="space-y-3">
          <input type="text" value={newSubject} onChange={e => setNewSubject(e.target.value)}
            className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm outline-none focus:border-blue-400"
            placeholder="Konu başlığı..." />
          <textarea rows={4} value={newMessage} onChange={e => setNewMessage(e.target.value)}
            className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm outline-none focus:border-blue-400 resize-none"
            placeholder="Mesajınızı yazın..." />
          {postMsg && (
            <div className={`p-3 rounded-xl text-sm font-medium border ${postMsg.type === "success" ? "bg-green-50 border-green-200 text-green-700" : "bg-red-50 border-red-200 text-red-700"}`}>
              {postMsg.text}
            </div>
          )}
          <button onClick={handlePost} disabled={posting}
            className="w-full py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-sm font-semibold transition-colors disabled:opacity-50 flex items-center justify-center gap-2">
            {posting ? <><div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"/>Gönderiliyor...</> : "📢 Yayınla"}
          </button>
        </div>
      </div>

      {/* Tartışmalar Listesi */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        <div className="px-5 py-3 border-b border-gray-100 font-bold text-sm text-gray-700">💬 Tartışmalar ({discussions.length})</div>
        {discussions.length === 0 ? (
          <div className="text-center py-10 text-gray-400 text-sm">Henüz tartışma konusu yok.</div>
        ) : (
          <div className="divide-y divide-gray-100">
            {discussions.map(d => (
              <div key={d.id}>
                <div className="flex items-start gap-3 p-4 cursor-pointer hover:bg-gray-50 transition-colors" onClick={() => toggleDiscussion(d)}>
                  {d.userpictureurl
                    ? <img src={d.userpictureurl} alt="" className="w-8 h-8 rounded-full object-cover shrink-0" />
                    : <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center text-xs font-bold text-gray-500 shrink-0">👤</div>}
                  <div className="flex-1">
                    <div className="font-bold text-sm text-gray-800">{d.subject}</div>
                    <div className="text-xs text-gray-400 mt-0.5">{d.userfullname} · {formatDate(d.timemodified)} · {d.numreplies} yanıt</div>
                  </div>
                  <span className="text-gray-300 transition-transform" style={{ transform: expanded === d.id ? "rotate(90deg)" : "none" }}>▶</span>
                </div>
                {expanded === d.id && (
                  <div className="border-t border-gray-100 bg-gray-50">
                    {(posts[d.id] || []).map(p => (
                      <div key={p.id} className="p-4 border-b border-gray-100 last:border-0" style={{ paddingLeft: p.parent ? "3.5rem" : "1rem" }}>
                        <div className="flex items-start gap-2">
                          {p.author?.profileimageurl
                            ? <img src={p.author.profileimageurl} alt="" className="w-6 h-6 rounded-full object-cover shrink-0" />
                            : <div className="w-6 h-6 rounded-full bg-gray-200 text-xs flex items-center justify-center shrink-0">👤</div>}
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <span className="text-xs font-bold text-gray-700">{p.author?.fullname}</span>
                              <span className="text-[10px] text-gray-400">{formatDate(p.timecreated)}</span>
                            </div>
                            <div className="text-xs text-gray-600 leading-relaxed" dangerouslySetInnerHTML={{ __html: p.message }} />
                          </div>
                        </div>
                      </div>
                    ))}
                    {/* Reply */}
                    {replyTo === d.id ? (
                      <div className="p-4 border-t border-gray-100 space-y-2">
                        <textarea rows={2} value={replyText} onChange={e => setReplyText(e.target.value)}
                          className="w-full border border-gray-200 rounded-xl px-3 py-2 text-xs outline-none focus:border-blue-400 resize-none"
                          placeholder="Yanıt yazın..." />
                        <div className="flex gap-2">
                          <button onClick={() => setReplyTo(null)} className="text-xs text-gray-500 hover:text-gray-700">İptal</button>
                          <button onClick={() => handleReply(d.id)} disabled={replying}
                            className="bg-blue-600 text-white text-xs font-bold px-4 py-1.5 rounded-lg hover:bg-blue-700 disabled:opacity-50">
                            {replying ? "Gönderiliyor..." : "Yanıtla"}
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div className="p-3 border-t border-gray-100">
                        <button onClick={() => setReplyTo(d.id)} className="text-xs font-semibold text-blue-600 hover:text-blue-800">↩ Yanıt Yaz</button>
                      </div>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────
// PAGE — Sayfa İçeriği Görüntüle
// ─────────────────────────────────────────────
function TeacherPageViewer({ mod, token, courseId }) {
  const [content, setContent] = useState(null);
  const [loading, setLoading] = useState(true);
  
  useEffect(() => {
    moodlePost(token, "mod_page_get_pages_by_courses", { "courseids[0]": courseId })
      .then(r => { const p = r.pages?.find(p => p.coursemodule === mod.id); setContent(p?.content || null); })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [mod.id, courseId]); // eslint-disable-line

  if (loading) return <Spinner />;
  return (
    <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm space-y-3">
      <h2 className="text-lg font-bold text-gray-800">📃 {mod.name}</h2>
      {content
        ? <div className="text-sm text-gray-700 leading-relaxed" dangerouslySetInnerHTML={{ __html: content }} />
        : <div className="text-center py-10 text-gray-400">İçerik bulunamadı.</div>}
    </div>
  );
}

// ─────────────────────────────────────────────
// BigBlueButtonViewer
// ─────────────────────────────────────────────
function TeacherBigBlueButtonViewer({ mod, token }) {
  const { userInfo } = useAuth();
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
  
  // Öğretmenler için normalde bekleme olmaz, ama Moodle API canjoin false dönerse sebebi saat uyuşmazlığı veya bitmiş olmasıdır.
  const canJoin = meetingInfo ? (meetingInfo.canjoin && !hasEnded && !isHiddenOrError) : true;

  let errorMessage = "Bu oturuma şu anda giriş yapılamaz.";
  if (isHiddenOrError) errorMessage = "Bu oturum kapatılmış veya tamamlanmıştır.";
  else if (hasEnded) errorMessage = "Bu oturum sizin tarafınızdan sonlandırıldı ve katılım kapatıldı.";
  else if (isClosed) errorMessage = "Bu oturumun bitiş süresi geçmiş ve katılım kapatılmıştır.";
  else if (notStarted) errorMessage = "Bu oturumun başlangıç saati henüz gelmedi. (Not: Cihazınız ile sunucu saati arasında 1-2 dakikalık fark olabilir, lütfen biraz bekleyip sayfayı yenileyin).";
  else errorMessage += "\nDetay: Katılım şu anda mümkün değil.";


  return (
    <div className="bg-white rounded-xl border border-gray-200 p-10 shadow-sm flex flex-col items-center justify-center text-center">
      <div className="w-20 h-20 bg-indigo-50 rounded-full flex items-center justify-center text-4xl mb-6 shadow-inner">
        📹
      </div>
      <h3 className="text-xl font-extrabold text-[#495057] mb-2">{mod.name}</h3>
      <p className="text-sm text-gray-500 mb-8 max-w-md">
        {mod.description ? (
           <span dangerouslySetInnerHTML={{ __html: mod.description }} />
        ) : "Sanal sınıf oturumunu yönetebilir veya derse katılabilirsiniz."}
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
              {joining ? "Bağlanıyor..." : "Öğretmen Olarak Oturuma Katıl →"}
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
  );
}

// ─────────────────────────────────────────────
// CHOICE — Anket Sonuçları (Öğretmen)
// ─────────────────────────────────────────────
function TeacherChoiceViewer({ mod, token }) {
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState(null);
  const [expanded, setExpanded] = useState(null); // hangi seçeneğin öğrenci listesi açık

  useEffect(() => {
    const load = async () => {
      try {
        const res = await moodlePost(token, "local_vueapi_get_choice_results", { choiceid: mod.instance });
        setData(res);
      } catch (e) { console.error(e); }
      finally { setLoading(false); }
    };
    load();
  }, [mod.instance]); // eslint-disable-line

  if (loading) return <Spinner text="Anket sonuçları yükleniyor..." />;

  const options  = data?.options || [];
  const total    = data?.totalanswers || 0;

  // Renk paleti — her seçenek farklı renk
  const COLORS = [
    { bar: "bg-blue-500",   light: "bg-blue-50",   border: "border-blue-200",   text: "text-blue-700"   },
    { bar: "bg-emerald-500",light: "bg-emerald-50", border: "border-emerald-200",text: "text-emerald-700" },
    { bar: "bg-violet-500", light: "bg-violet-50",  border: "border-violet-200", text: "text-violet-700"  },
    { bar: "bg-amber-500",  light: "bg-amber-50",   border: "border-amber-200",  text: "text-amber-700"   },
    { bar: "bg-rose-500",   light: "bg-rose-50",    border: "border-rose-200",   text: "text-rose-700"    },
    { bar: "bg-cyan-500",   light: "bg-cyan-50",    border: "border-cyan-200",   text: "text-cyan-700"    },
    { bar: "bg-orange-500", light: "bg-orange-50",  border: "border-orange-200", text: "text-orange-700"  },
    { bar: "bg-pink-500",   light: "bg-pink-50",    border: "border-pink-200",   text: "text-pink-700"    },
  ];

  return (
    <div className="space-y-5">
      {/* Başlık */}
      <div className="bg-white rounded-2xl border border-gray-200 p-5 shadow-sm">
        <div className="flex items-center gap-3 mb-1">
          <span className="text-2xl">✅</span>
          <div>
            <h2 className="text-base font-bold text-gray-800">{mod.name}</h2>
            <p className="text-xs text-gray-400 mt-0.5">Seçim / Anket Aktivitesi</p>
          </div>
        </div>
        {mod.description && (
          <div className="mt-3 pt-3 border-t border-gray-100 text-sm text-gray-600 leading-relaxed"
            dangerouslySetInnerHTML={{ __html: mod.description }} />
        )}
      </div>

      {/* Özet Stat */}
      <div className="grid grid-cols-2 gap-4">
        <div className="bg-white rounded-2xl border border-gray-200 p-4 shadow-sm text-center">
          <div className="text-3xl font-black text-gray-800">{total}</div>
          <div className="text-xs text-gray-400 mt-1">Toplam Katılımcı</div>
        </div>
        <div className="bg-white rounded-2xl border border-gray-200 p-4 shadow-sm text-center">
          <div className="text-3xl font-black text-gray-800">{options.length}</div>
          <div className="text-xs text-gray-400 mt-1">Seçenek Sayısı</div>
        </div>
      </div>

      {/* Sonuç Grafik Kartı */}
      <div className="bg-white rounded-2xl border border-gray-200 p-5 shadow-sm">
        <h3 className="text-sm font-bold text-gray-700 mb-4">📊 Sonuçlar</h3>
        {options.length === 0 ? (
          <div className="text-center py-10 text-gray-400 text-sm">Seçenek bulunamadı.</div>
        ) : (
          <div className="space-y-4">
            {options.map((opt, idx) => {
              const clr = COLORS[idx % COLORS.length];
              const pct = opt.percentageamount || 0;
              const isOpen = expanded === opt.id;
              return (
                <div key={opt.id} className={`rounded-xl border ${clr.border} ${clr.light} overflow-hidden`}>
                  {/* Seçenek Satırı */}
                  <div className="px-4 pt-3 pb-2">
                    <div className="flex items-center justify-between mb-2">
                      <span className={`text-sm font-semibold ${clr.text}`}>{opt.text}</span>
                      <div className="flex items-center gap-2">
                        <span className={`text-sm font-black ${clr.text}`}>%{pct.toFixed(1)}</span>
                        <span className="text-xs text-gray-400">({opt.numberofuser} kişi)</span>
                      </div>
                    </div>
                    {/* Progress bar */}
                    <div className="h-2.5 bg-white/60 rounded-full overflow-hidden border border-white">
                      <div
                        className={`h-full ${clr.bar} rounded-full transition-all duration-700`}
                        style={{ width: pct + "%" }}
                      />
                    </div>
                  </div>
                  {/* Öğrenci listesi toggle */}
                  {opt.numberofuser > 0 && (
                    <div>
                      <button
                        onClick={() => setExpanded(isOpen ? null : opt.id)}
                        className={`w-full px-4 py-2 text-left text-xs font-semibold ${clr.text} hover:bg-white/40 transition-colors flex items-center gap-1`}
                      >
                        {isOpen ? "▲" : "▼"} {isOpen ? "Gizle" : `${opt.numberofuser} öğrenciyi göster`}
                      </button>
                      {isOpen && (
                        <div className="px-4 pb-3 grid grid-cols-1 gap-1 border-t border-white/50">
                          {opt.userresponses.map((u) => (
                            <div key={u.userid} className="flex items-center gap-2 py-1">
                              <div className={`w-7 h-7 rounded-full ${clr.bar} flex items-center justify-center text-white text-xs font-bold shrink-0`}>
                                {u.fullname.charAt(0).toUpperCase()}
                              </div>
                              <span className="text-xs text-gray-700 font-medium">{u.fullname}</span>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {total === 0 && (
        <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 text-sm text-amber-700 text-center">
          ⏳ Henüz hiçbir öğrenci oy kullanmamış.
        </div>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────
// GENERIC fallback — Moodle'a yönlendirme YOK
// ─────────────────────────────────────────────
function TeacherGenericViewer({ mod }) {
  return (
    <div className="bg-white rounded-xl border border-gray-200 p-8 shadow-sm text-center">
      <div className="text-5xl mb-4">📌</div>
      <h2 className="text-base font-bold text-gray-700 mb-2">{mod.name}</h2>
      <p className="text-sm text-gray-400">
        Bu aktivite türü ({mod.modname}) için şu an yönetim paneli hazırlanmaktadır.
      </p>
      {mod.description && (
        <div className="mt-4 text-sm text-gray-600 leading-relaxed text-left bg-gray-50 rounded-xl p-4"
          dangerouslySetInnerHTML={{ __html: mod.description }} />
      )}
    </div>
  );
}

// ─────────────────────────────────────────────
// ANA BİLEŞEN
// ─────────────────────────────────────────────
export default function TeacherActivityViewer({ mod, token, courseId, onBack }) {

  const renderViewer = () => {
    switch (mod.modname) {
      case "assign":   return <TeacherAssignViewer   mod={mod} token={token} courseId={courseId} />;
      case "quiz":     return <TeacherQuizViewer     mod={mod} token={token} courseId={courseId} />;
      case "resource": return <TeacherResourceViewer mod={mod} token={token} />;
      case "url":      return <TeacherUrlViewer      mod={mod} />;
      case "forum":    return <TeacherForumViewer    mod={mod} token={token} />;
      case "page":     return <TeacherPageViewer     mod={mod} token={token} courseId={courseId} />;
      case "bigbluebuttonbn": return <TeacherBigBlueButtonViewer mod={mod} token={token} />;
      case "choice":   return <TeacherChoiceViewer   mod={mod} token={token} />;
      default:         return <TeacherGenericViewer  mod={mod} />;
    }
  };

  return (
    <div className="w-full h-full flex flex-col pt-2">
      <button onClick={onBack} className="mb-5 flex items-center gap-2 text-sm font-bold text-gray-400 hover:text-gray-800 self-start transition-colors group">
        <span className="group-hover:-translate-x-1 transition-transform">←</span> Aktivite Listesine Dön
      </button>
      <div className="flex-1 overflow-y-auto">
        <div className="max-w-5xl mx-auto pb-10">
          {renderViewer()}
        </div>
      </div>
    </div>
  );
}
