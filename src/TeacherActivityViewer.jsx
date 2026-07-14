import React, { useState, useEffect, useRef } from "react";

// ─────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────
const moodlePost = async (token, wsfunction, extraParams = {}) => {
  const params = new URLSearchParams({ wstoken: token, wsfunction, moodlewsrestformat: "json" });
  for (const [key, value] of Object.entries(extraParams)) params.append(key, String(value));
  const res = await fetch("/api/webservice/rest/server.php", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: params.toString(),
  });
  return res.json();
};

const formatDate = (ts) => {
  if (!ts) return "-";
  return new Date(ts * 1000).toLocaleDateString("tr-TR", { day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit" });
};

const getFileUrl = (fileurl, token) => {
  if (!fileurl) return "";
  let url = fileurl.replace("https://moodle.argeyazilim.tr", "/api");
  if (url.includes("/pluginfile.php/") && !url.includes("/webservice/pluginfile.php/"))
    url = url.replace("/pluginfile.php/", "/webservice/pluginfile.php/");
  if (!url.includes("token=")) url += (url.includes("?") ? "&" : "?") + `token=${token}`;
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
    } finally { setGrading(false); }
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
  const [quiz, setQuiz] = useState(null);
  const [users, setUsers] = useState([]);
  const [attemptsData, setAttemptsData] = useState({});
  const [expandedUser, setExpandedUser] = useState(null);
  const [reviewData, setReviewData] = useState({});
  const [reviewLoading, setReviewLoading] = useState(false);
  const [loading, setLoading] = useState(false);

  const [quizSlots, setQuizSlots] = useState([]);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const [qr, ur, slotsRes] = await Promise.all([
          moodlePost(token, "mod_quiz_get_quizzes_by_courses", { "courseids[0]": courseId }),
          moodlePost(token, "core_enrol_get_enrolled_users", { courseid: courseId }),
          moodlePost(token, "local_vueapi_get_quiz_slots", { cmid: mod.id }).catch(() => null)
        ]);
        const found = qr.quizzes?.find(q => q.id === mod.instance || q.coursemodule === mod.id) || qr.quizzes?.[0];
        setQuiz(found);
        if (Array.isArray(slotsRes)) {
            setQuizSlots(slotsRes);
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
          <a href={`/mod/quiz/edit.php?cmid=${mod.id}`} target="_blank" rel="noreferrer" 
             className="px-3 py-1.5 bg-indigo-50 text-indigo-700 hover:bg-indigo-100 rounded-lg text-xs font-bold transition-colors">
            📝 Soruları İncele / Düzenle (Moodle)
          </a>
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
            <span>📝 Sınava Eklenmiş Sorular ({quizSlots.length})</span>
        </div>
        <div className="divide-y divide-gray-50">
            {quizSlots.length === 0 ? (
                <div className="p-6 text-center text-sm text-gray-400 font-medium">
                    Bu sınava henüz soru eklenmemiş. Soru Bankasından soru seçip aktarabilirsiniz.
                </div>
            ) : (
                quizSlots.map((slot, idx) => (
                    <div key={slot.id} className="p-4 hover:bg-gray-50 transition-colors">
                        <div className="flex items-center justify-between mb-2">
                            <span className="text-xs font-bold text-blue-600 bg-blue-50 px-2 py-0.5 rounded-md">Soru {slot.slot} ({slot.maxmark} Puan)</span>
                            <span className="text-[10px] font-bold text-gray-400 bg-gray-100 px-2 py-0.5 rounded uppercase">{slot.qtype}</span>
                        </div>
                        <div className="font-semibold text-sm text-gray-800 mb-1">{slot.name}</div>
                        <div className="text-xs text-gray-600 mt-2 p-3 bg-white border border-gray-100 rounded-lg shadow-sm" dangerouslySetInnerHTML={{ __html: slot.questiontext }} />
                    </div>
                ))
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
                    <a href={url} target="_blank" rel="noreferrer"
                      className="bg-gray-800 hover:bg-black text-white text-xs font-bold px-4 py-2 rounded-lg transition-colors">
                      {isImage ? "Görüntüle" : "İndir"}
                    </a>
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
      const r = await moodlePost(token, "mod_forum_get_forum_discussions", { forumid: mod.instance, sortby: "timemodified", sortdirection: "DESC" });
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
        messageformat: 1,
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
        postid: dis?.firstpostid || 0,
        subject: "Re: " + (dis?.subject || ""),
        message: replyText,
        messageformat: 1,
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
  const [loading, setLoading] = useState(true);
  const renderViewer = () => {
    switch (mod.modname) {
      case "assign":   return <TeacherAssignViewer   mod={mod} token={token} courseId={courseId} />;
      case "quiz":     return <TeacherQuizViewer     mod={mod} token={token} courseId={courseId} />;
      case "resource": return <TeacherResourceViewer mod={mod} token={token} />;
      case "url":      return <TeacherUrlViewer      mod={mod} />;
      case "forum":    return <TeacherForumViewer    mod={mod} token={token} />;
      case "page":     return <TeacherPageViewer     mod={mod} token={token} courseId={courseId} />;
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
