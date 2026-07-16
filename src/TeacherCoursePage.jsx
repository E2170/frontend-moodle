import { useEffect, useState, useCallback } from "react";
import { useLocation, useParams, useNavigate } from "react-router-dom";
import { showAlert } from "./AlertModal";
import TeacherActivityViewer from "./TeacherActivityViewer";
import { useAuth } from "./AuthContext";

// ─────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────
import { moodlePost } from "./moodleApi";
// Removed local moodlePost

// ─────────────────────────────────────────────
// ─────────────────────────────────────────────
// YouTube Özel Ekleme Modalı
// ─────────────────────────────────────────────
function YoutubeFormModal({ sectionNum, courseId, token, onClose, onSaved }) {
  const [url, setUrl] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!url.trim()) { setError("Lütfen bir YouTube URL'si girin."); return; }
    
    setLoading(true);
    setError(null);
    try {
      // noembed ile youtube video bilgilerini çek
      const noembedRes = await fetch(`https://noembed.com/embed?url=${encodeURIComponent(url)}`);
      const data = await noembedRes.json();
      
      let title = data.title || "YouTube Videosu";
      if (data.error) {
         title = "YouTube Videosu";
      }

      // Moodle API'ye url olarak kaydet
      const payload = {
        courseid: courseId,
        section: sectionNum,
        type: "url",
        name: title,
        description: "",
        externalurl: url,
        duedate: 0,
        timeopen: 0,
        timeclose: 0,
        maxbytes: 0,
        maxfiles: 0
      };

      const res = await moodlePost(token, "local_vueapi_add_activity", payload);

      if (res && res.exception) {
        throw new Error(res.message || "API hatası.");
      }
      if (Array.isArray(res) && res.length > 0 && res[0].error) {
        throw new Error(res[0].error);
      }

      if (res && (res.status === "success" || res.status === true || res.cmid || res.activityid || res.id)) {
        if (onSaved) onSaved();
        onClose();
      } else {
        throw new Error("Kayıt yapılamadı.");
      }

    } catch (err) {
      setError("Hata: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        <div className="bg-red-600 px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3 text-white">
            <span className="text-2xl">▶️</span>
            <span className="font-bold">YouTube Videosu Ekle</span>
          </div>
          <button onClick={onClose} className="text-red-200 hover:text-white font-bold text-xl">✕</button>
        </div>
        
        <form onSubmit={handleSubmit} className="p-6">
          {error && <div className="mb-4 text-red-600 text-sm bg-red-50 p-3 rounded-lg">{error}</div>}
          <div className="mb-6">
            <label className="block text-sm font-bold text-gray-700 mb-2">Video veya Playlist Linki</label>
            <input type="url" required value={url} onChange={e => setUrl(e.target.value)} 
                   placeholder="https://www.youtube.com/watch?v=..."
                   className="w-full border border-gray-300 p-3 rounded-xl focus:ring-2 focus:ring-red-500 outline-none transition-all" />
          </div>
          
          <div className="flex justify-end gap-3">
            <button type="button" onClick={onClose} className="px-5 py-2 text-gray-600 hover:bg-gray-100 rounded-xl font-bold transition-colors">İptal</button>
            <button type="submit" disabled={loading} className="px-5 py-2 bg-red-600 text-white rounded-xl hover:bg-red-700 font-bold disabled:opacity-50 transition-colors shadow-md shadow-red-200">
              {loading ? "Ekleniyor..." : "Ekle"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────
// Aktivite Ekleme — Arka Planda Parametre Çekme (Native UI)
// ─────────────────────────────────────────────
function ActivityFormModal({ actType, sectionNum, courseId, token, onClose, onSaved }) {
  const [form, setForm] = useState({ 
    name: "", 
    intro: "", 
    externalurl: "",
    // Assign fields
    allowsubmissionsfromdate: "",
    duedate: "",
    maxfiles: "5",
    maxsizebytes: "10485760", // 10MB
    // Quiz fields
    timelimit: "60",
    attempts: "1",
    timeopen: "",
    timeclose: ""
  });
  
  const [activeTab, setActiveTab] = useState("İÇERİK");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);

  const handleSubmit = async () => {
    if (!form.name.trim()) { setError("Lütfen bir aktivite adı girin."); return; }
    if (actType.id === "url" && !form.externalurl.trim()) { setError("Lütfen bir URL adresi girin."); return; }
    
    setSubmitting(true);
    setError(null);
    try {
      const toUnix = (str) => {
        if (!str) return 0;
        const ms = new Date(str).getTime();
        return isNaN(ms) ? 0 : Math.floor(ms / 1000);
      };

      const payload = {
        courseid: courseId,
        section: sectionNum,
        type: actType.id, // assign, quiz, url vb.
        name: form.name,
        description: form.intro || "",
        // Tüm aktiviteler için varsayılan olarak (0) integer gönderilir:
        duedate: toUnix(form.duedate),
        timeopen: toUnix(form.timeopen || form.allowsubmissionsfromdate),
        timeclose: toUnix(form.timeclose),
        maxbytes: parseInt(form.maxsizebytes || form.maxbytes, 10) || 0,
        maxfiles: parseInt(form.maxfiles, 10) || 0,
      };

      if (actType.id === "url") {
        payload.externalurl = form.externalurl || "";
      }

      // API isteği
      const res = await moodlePost(token, "local_vueapi_add_activity", payload);

      if (res && res.exception) {
        const dbg = res.debuginfo ? `\n(Detay: ${res.debuginfo})` : "";
        throw new Error((res.message || "API hatası: İstisna fırlatıldı.") + dbg);
      }

      if (Array.isArray(res) && res.length > 0 && res[0].error) {
        throw new Error(res[0].error);
      }

      // Eklenti yapısına göre status, success, cmid veya activityid dönebilir.
      if (res && (res.status === "success" || res.status === true || res.cmid || res.activityid || res.id)) {
        if (onSaved) onSaved(res.cmid || res.activityid || res.id);
        onClose();
      } else {
        // Hata vermiyordu ama eklemiyordu, çünkü yanıtı başarı sanıyorduk. Gerçek yanıtı ekrana basalım:
        throw new Error("Moodle Yanıtı (Lütfen bunu kopyalayıp bana gönderin): " + JSON.stringify(res));
      }

    } catch (e) {
      setError("Kaydedilirken hata oluştu: " + e.message);
    } finally {
      setSubmitting(false);
    }
  };


  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm(prev => ({ ...prev, [name]: value }));
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[95vh] flex flex-col overflow-hidden">
        
        {/* Header - Akuzem Tarzı */}
        <div className="bg-[#1e293b] px-6 py-4 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3 text-white">
            <div className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center text-lg">
              {actType.emoji}
            </div>
            <div>
              <div className="font-bold text-sm tracking-wide">{actType.label} Aktivitesi Ekle</div>
            </div>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-white flex flex-col items-center gap-1 transition-colors">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
            <span className="text-[10px] font-bold uppercase tracking-wider">Kapat</span>
          </button>
        </div>

        {/* Sekmeler */}
        <div className="flex px-6 border-b border-gray-200 shrink-0 bg-gray-50/50">
          {["İÇERİK", "AYARLAR"].map(tab => (
            <button key={tab} onClick={() => setActiveTab(tab)}
              className={`py-3 px-6 text-xs font-bold tracking-wider transition-colors border-b-2 ${
                activeTab === tab ? "border-blue-600 text-blue-700" : "border-transparent text-gray-500 hover:text-gray-700"
              }`}>
              {tab}
            </button>
          ))}
        </div>

        {/* İçerik Gövdesi */}
        <div className="flex-1 overflow-y-auto p-6 bg-white relative">
            <div className="space-y-6">
              {error && (
                <div className="bg-red-50 border border-red-200 text-red-700 p-4 rounded-xl text-sm font-medium flex items-center gap-3">
                  <span className="text-xl">⚠️</span> {error}
                </div>
              )}

              {activeTab === "İÇERİK" && (
                <div className="space-y-5 animate-in fade-in slide-in-from-right-4 duration-300">
                  <div>
                    <label className="block text-sm font-bold text-gray-700 mb-1">Aktivite İsmi *</label>
                    <p className="text-[11px] text-gray-400 mb-2">Aktivite listeleme sayfalarında ve Not Defterinde yazdığınız şekli ile görünecektir.</p>
                    <input type="text" name="name" value={form.name} onChange={handleChange}
                      className="w-full border border-gray-300 rounded-xl px-4 py-3 text-sm outline-none focus:border-blue-500 focus:ring-4 ring-blue-50 transition-all"
                      placeholder="Örn: Vize Sınavı" />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-bold text-gray-700 mb-1">Eğitmen Notu (Açıklama)</label>
                    <textarea name="intro" rows={4} value={form.intro} onChange={handleChange}
                      className="w-full border border-gray-300 rounded-xl px-4 py-3 text-sm outline-none focus:border-blue-500 focus:ring-4 ring-blue-50 transition-all resize-none"
                      placeholder="Öğrencilerin göreceği açıklama veya yönerge metni..." />
                  </div>

                  {actType.id === "url" && (
                    <div>
                      <label className="block text-sm font-bold text-gray-700 mb-1">URL Adresi *</label>
                      <input type="url" name="externalurl" value={form.externalurl} onChange={handleChange}
                        className="w-full border border-gray-300 rounded-xl px-4 py-3 text-sm outline-none focus:border-blue-500 focus:ring-4 ring-blue-50 transition-all"
                        placeholder="https://..." />
                    </div>
                  )}
                  
                  {actType.id === "resource" && (
                    <div className="bg-orange-50 border border-orange-200 p-4 rounded-xl text-sm text-orange-800">
                      <strong className="block mb-1 font-bold">⚠️ Dosya Yükleme Sınırı</strong>
                      Native arayüz üzerinden direkt dosya yüklemesi teknik kısıtlamalar nedeniyle kapalıdır. 
                      Sadece aktiviteyi oluşturup, dosyayı sonradan Moodle üzerinden yükleyebilirsiniz.
                    </div>
                  )}
                </div>
              )}

              {activeTab === "AYARLAR" && (
                <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
                  {actType.id === "assign" ? (
                    <>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-bold text-gray-700 mb-1">Aktivite Başlangıç Tarihi</label>
                          <input type="datetime-local" name="allowsubmissionsfromdate" value={form.allowsubmissionsfromdate} onChange={handleChange}
                            className="w-full border border-gray-300 rounded-xl px-4 py-2.5 text-sm outline-none focus:border-blue-500" />
                        </div>
                        <div>
                          <label className="block text-sm font-bold text-gray-700 mb-1">Son Teslim Tarihi</label>
                          <input type="datetime-local" name="duedate" value={form.duedate} onChange={handleChange}
                            className="w-full border border-gray-300 rounded-xl px-4 py-2.5 text-sm outline-none focus:border-blue-500" />
                        </div>
                      </div>
                      
                      <div className="border-t border-gray-100 pt-5 grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-bold text-gray-700 mb-1">Dosya Yükleme Hakkı</label>
                          <select name="maxfiles" value={form.maxfiles} onChange={handleChange}
                            className="w-full border border-gray-300 rounded-xl px-4 py-2.5 text-sm outline-none focus:border-blue-500">
                            {[1, 2, 3, 5, 10, 20].map(n => <option key={n} value={n}>{n}</option>)}
                          </select>
                        </div>
                        <div>
                          <label className="block text-sm font-bold text-gray-700 mb-1">Maksimum Dosya Boyutu</label>
                          <select name="maxsizebytes" value={form.maxsizebytes} onChange={handleChange}
                            className="w-full border border-gray-300 rounded-xl px-4 py-2.5 text-sm outline-none focus:border-blue-500">
                            <option value="1048576">1 MB</option>
                            <option value="5242880">5 MB</option>
                            <option value="10485760">10 MB</option>
                            <option value="52428800">50 MB</option>
                            <option value="104857600">100 MB</option>
                          </select>
                        </div>
                      </div>
                    </>
                  ) : actType.id === "quiz" ? (
                    <>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-bold text-gray-700 mb-1">Sınavın Açılacağı Tarih</label>
                          <input type="datetime-local" name="timeopen" value={form.timeopen} onChange={handleChange}
                            className="w-full border border-gray-300 rounded-xl px-4 py-2.5 text-sm outline-none focus:border-blue-500" />
                        </div>
                        <div>
                          <label className="block text-sm font-bold text-gray-700 mb-1">Sınavın Biteceği Tarih</label>
                          <input type="datetime-local" name="timeclose" value={form.timeclose} onChange={handleChange}
                            className="w-full border border-gray-300 rounded-xl px-4 py-2.5 text-sm outline-none focus:border-blue-500" />
                        </div>
                      </div>

                      <div className="border-t border-gray-100 pt-5 grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-bold text-gray-700 mb-1">Sınav Süresi (Dakika)</label>
                          <input type="number" name="timelimit" value={form.timelimit} onChange={handleChange} min="0"
                            className="w-full border border-gray-300 rounded-xl px-4 py-2.5 text-sm outline-none focus:border-blue-500" />
                        </div>
                        <div>
                          <label className="block text-sm font-bold text-gray-700 mb-1">Tekrar Sayısı (Deneme)</label>
                          <select name="attempts" value={form.attempts} onChange={handleChange}
                            className="w-full border border-gray-300 rounded-xl px-4 py-2.5 text-sm outline-none focus:border-blue-500">
                            <option value="0">Sınırsız</option>
                            {[1, 2, 3, 5, 10].map(n => <option key={n} value={n}>{n}</option>)}
                          </select>
                        </div>
                      </div>
                    </>
                  ) : (
                    <div className="text-center py-10 text-gray-400">
                      <div className="text-4xl mb-3">⚙️</div>
                      <p className="text-sm font-semibold">Bu aktivite türü için ek ayar bulunmuyor.</p>
                      <p className="text-xs mt-1">Sadece İçerik sekmesindeki bilgileri doldurmanız yeterlidir.</p>
                    </div>
                  )}
                </div>
              )}
            </div>
        </div>

        {/* Footer */}
          <div className="px-6 py-4 border-t border-gray-200 bg-gray-50 flex items-center justify-between shrink-0">
            <button onClick={onClose} className="px-6 py-2.5 text-sm font-bold text-gray-600 hover:text-gray-800 flex items-center gap-2">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
              İptal
            </button>
            <button onClick={handleSubmit} disabled={submitting}
              className="px-8 py-2.5 bg-[#1e293b] hover:bg-black text-white rounded-xl text-sm font-bold transition-all disabled:opacity-50 flex items-center justify-center gap-2 shadow-lg shadow-slate-200">
              {submitting
                ? <><div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> Yükleniyor...</>
                : <>Devam et <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" /></svg></>}
            </button>
          </div>
      </div>
    </div>
  );
}

import { AlmsQuizActivityModal, AlmsSessionWizard } from "./AlmsQuizFlow";

// ─────────────────────────────────────────────
// ANA SAYFA
// ─────────────────────────────────────────────
export default function TeacherCoursePage() {
  const { courseId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const { userInfo } = useAuth();

  const [editItemDetails, setEditItemDetails] = useState(null);

  // Aktivite Silme Onay Modalı için State
  const [activityToDelete, setActivityToDelete] = useState(null);
  const [courseDetail, setCourseDetail] = useState({ fullname: "Ders Yükleniyor..." });
  const [sections, setSections] = useState([]);
  const [activeTab, setActiveTab] = useState("Ders İçeriği");
  const [activeSectionId, setActiveSectionId] = useState(null);
  const [selectedModuleForView, setSelectedModuleForView] = useState(null);

  // Aktivite paneli
  const [isActivityPanelOpen, setIsActivityPanelOpen] = useState(false);
  const [activityFormModal, setActivityFormModal] = useState(null); // { actType, sectionNum }
  const [almsQuizActivity, setAlmsQuizActivity] = useState(null); 
  const [almsSessionWizard, setAlmsSessionWizard] = useState(null);
  const [youtubeModalOpen, setYoutubeModalOpen] = useState(null); // { sectionNum }

  const handleSelectActivityType = (actType) => {
    setIsActivityPanelOpen(false);
    
    // activeSectionId, Moodle veritabanındaki tablonun id'sidir, section numarası değildir!
    const activeSection = sections.find(s => s.id === activeSectionId);
    let sNum;
    if (activeSection && activeSection.section !== undefined) {
      sNum = activeSection.section;
    } else {
      const parsed = parseInt(activeSectionId?.toString().replace("default-", ""), 10);
      sNum = isNaN(parsed) ? 0 : parsed;
    }

    if (actType.id === "quiz") {
      setAlmsQuizActivity({ sectionNum: sNum });
    } else if (actType.id === "youtube") {
      setYoutubeModalOpen({ sectionNum: sNum });
    } else {
      setActivityFormModal({ actType, sectionNum: sNum });
    }
  };

  const fetchCourseData = useCallback(async () => {
    const token = localStorage.getItem("moodle_token");
    if (!token) { navigate("/"); return; }
    try {
      const sectionsData = await moodlePost(token, "core_course_get_contents", { courseid: courseId });

      if (Array.isArray(sectionsData)) {
        setSections(sectionsData);
        if (sectionsData.length > 0) {
          setCourseDetail({ fullname: sectionsData[0].coursedisplayname || "DERS İÇERİĞİ" });
          
          if (location.state?.openCmid) {
             let targetMod = null;
             let targetSecId = null;
             for (const sec of sectionsData) {
                const mod = sec.modules?.find(m => m.id == location.state.openCmid);
                if (mod) {
                   targetMod = mod;
                   targetSecId = sec.id;
                   break;
                }
             }
             if (targetMod) {
                setActiveSectionId(targetSecId);
                setSelectedModuleForView(targetMod);
             } else {
                setActiveSectionId(prev => prev || sectionsData[0].id);
             }
          } else {
             setActiveSectionId(prev => prev || sectionsData[0].id);
          }
        }
      }
    } catch (err) { console.error(err); }
  }, [courseId, navigate, location.state]);

  useEffect(() => { 
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchCourseData(); 
  }, [fetchCourseData]);

  // Moodle aktivite türü → bizim UI'ımız + Moodle'ın add parametresi
  const activityTypes = [
    { id: "forum",         moodleId: "forum",          label: "Forum",        iconColor: "#4a90e2", emoji: "💬", desc: "Tartışma ortamı oluşturun." },
    { id: "assign",        moodleId: "assign",          label: "Ödev",         iconColor: "#9b59b6", emoji: "📝", desc: "Öğrencilerden görev isteyin." },
    { id: "quiz",          moodleId: "quiz",            label: "Sınav",        iconColor: "#003399", emoji: "📋", desc: "Çevrimiçi test oluşturun." },
    { id: "youtube",       moodleId: "url",             label: "YouTube",      iconColor: "#ff0000", emoji: "▶️", desc: "Video veya playlist ekleyin." },
    { id: "resource",      moodleId: "resource",        label: "Doküman",      iconColor: "#f39c12", emoji: "📄", desc: "PDF, DOC dosya yükleyin." },
    { id: "url",           moodleId: "url",             label: "Link",         iconColor: "#00bcd4", emoji: "🔗", desc: "Dış kaynak URL paylaşın." },
    { id: "page",          moodleId: "page",            label: "Sayfa",        iconColor: "#27ae60", emoji: "📃", desc: "Zengin metin sayfası ekleyin." },
    { id: "label",         moodleId: "label",           label: "Etiket",       iconColor: "#95a5a6", emoji: "🏷️", desc: "Bölüme açıklama/başlık ekleyin." },
    { id: "folder",        moodleId: "folder",          label: "Klasör",       iconColor: "#e67e22", emoji: "📁", desc: "Dosyaları klasörde toplayın." },
    { id: "choice",        moodleId: "choice",          label: "Seçim",        iconColor: "#1abc9c", emoji: "✅", desc: "Anket/oylama oluşturun." },
    { id: "feedback",      moodleId: "feedback",        label: "Geri Bildirim",iconColor: "#e74c3c", emoji: "📊", desc: "Geri bildirim formu ekleyin." },
    { id: "glossary",      moodleId: "glossary",        label: "Sözlük",       iconColor: "#f39c12", emoji: "📚", desc: "Terimler sözlüğü oluşturun." },
    { id: "book",          moodleId: "book",            label: "Kitap",        iconColor: "#e74c3c", emoji: "📕", desc: "Bölümlü içerik kitabı ekleyin." },
    { id: "scorm",         moodleId: "scorm",           label: "SCORM",        iconColor: "#6c5ce7", emoji: "📦", desc: "SCORM paketi yükleyin." },
    { id: "bigbluebutton", moodleId: "bigbluebuttonbn", label: "Canlı Ders",   iconColor: "#27ae60", emoji: "📹", desc: "Canlı sanal sınıf başlatın." },
    { id: "lesson",        moodleId: "lesson",          label: "Ders",         iconColor: "#8e44ad", emoji: "🎓", desc: "İnteraktif ders materyali." },
    { id: "wiki",          moodleId: "wiki",            label: "Wiki",         iconColor: "#2ecc71", emoji: "📖", desc: "İşbirlikçi wiki sayfası." },
    { id: "survey",        moodleId: "survey",          label: "Anket",        iconColor: "#d35400", emoji: "📋", desc: "Standart anket uygulayın." },
    { id: "workshop",      moodleId: "workshop",        label: "Atölye",       iconColor: "#c0392b", emoji: "🔨", desc: "Akran değerlendirmesi." },
    { id: "h5pactivity",   moodleId: "h5pactivity",     label: "H5P",          iconColor: "#0099cc", emoji: "🎮", desc: "İnteraktif H5P içeriği." },
  ];

  const defaultWeeks = Array.from({ length: 16 }, (_, i) => ({ id: `default-${i}`, name: `HAFTA ${i + 1}`, modules: [] }));
  const displaySections = sections.length > 0 ? sections : defaultWeeks;
  const activeSection = displaySections.find(s => s.id === activeSectionId) || displaySections[0];

  const modMeta = {
    assign:         { icon: "📝", color: "bg-purple-50 text-purple-700 border-purple-100" },
    quiz:           { icon: "📋", color: "bg-blue-50 text-blue-700 border-blue-100" },
    resource:       { icon: "📄", color: "bg-orange-50 text-orange-700 border-orange-100" },
    url:            { icon: "🔗", color: "bg-cyan-50 text-cyan-700 border-cyan-100" },
    page:           { icon: "📃", color: "bg-green-50 text-green-700 border-green-100" },
    forum:          { icon: "💬", color: "bg-pink-50 text-pink-700 border-pink-100" },
    folder:         { icon: "📁", color: "bg-yellow-50 text-yellow-700 border-yellow-100" },
    label:          { icon: "🏷️", color: "bg-gray-50 text-gray-600 border-gray-100" },
    book:           { icon: "📕", color: "bg-rose-50 text-rose-700 border-rose-100" },
    wiki:           { icon: "📖", color: "bg-lime-50 text-lime-700 border-lime-100" },
    glossary:       { icon: "📚", color: "bg-amber-50 text-amber-700 border-amber-100" },
    scorm:          { icon: "📦", color: "bg-indigo-50 text-indigo-700 border-indigo-100" },
    choice:         { icon: "✅", color: "bg-teal-50 text-teal-700 border-teal-100" },
    feedback:       { icon: "📊", color: "bg-red-50 text-red-700 border-red-100" },
    bigbluebuttonbn:{ icon: "📹", color: "bg-emerald-50 text-emerald-700 border-emerald-100" },
    lesson:         { icon: "🎓", color: "bg-violet-50 text-violet-700 border-violet-100" },
    survey:         { icon: "📋", color: "bg-orange-50 text-orange-700 border-orange-100" },
    workshop:       { icon: "🔨", color: "bg-red-50 text-red-700 border-red-100" },
    h5pactivity:    { icon: "🎮", color: "bg-sky-50 text-sky-700 border-sky-100" },
  };

  const token = localStorage.getItem("moodle_token");

  const handleDeleteActivity = (mod) => {
    setActivityToDelete(mod);
  };

  const confirmDeleteActivity = async () => {
    if (!activityToDelete) return;
    const mod = activityToDelete;
    setActivityToDelete(null);

    try {
      // API üzerinden (token tabanlı) resmi silme işlemini yapıyoruz.
      // (Kullanıcı core_course_delete_modules yetkisine sahip olduğu için doğrudan çalışacaktır)
      const deleteRes = await moodlePost(token, "core_course_delete_modules", {
        "cmids[0]": mod.id
      });

      if (deleteRes?.exception) {
        throw new Error(deleteRes.message || "Aktivite silinirken erişim yetkisi hatası oluştu.");
      }

      showAlert("Aktivite başarıyla silindi.");
      fetchCourseData(); // Sayfayı yenile
    } catch (e) {
      showAlert("Hata: " + e.message);
    }
  };

  return (
    <div className="h-screen flex flex-col bg-[#f4f6f9] font-sans text-gray-800 overflow-hidden">

      {/* Üst Bar */}
      <div className="bg-white border-b border-gray-200 h-12 flex items-center px-6 shrink-0 z-30 shadow-sm">
        <div className="flex items-center w-1/3 gap-2">
          <span className="text-blue-600 font-black text-[10px] border border-blue-200 bg-blue-50 px-1 py-0.5 rounded tracking-tighter">C&gt;O</span>
          <span className="font-bold text-xs text-gray-700 uppercase truncate max-w-[220px]">{courseDetail.fullname}</span>
          <button onClick={() => setIsActivityPanelOpen(true)}
            className="ml-3 w-8 h-8 flex items-center justify-center bg-blue-600 hover:bg-blue-700 rounded-full text-white font-bold text-xl leading-none transition-all shadow-md shadow-blue-200"
            title="Aktivite Ekle">
            +
          </button>
        </div>
        <div className="flex-1 flex justify-center h-full">
          <div className="flex gap-8 text-xs font-bold text-gray-500 h-full">
            {["Ders İçeriği", "Duyurular", "Tartışma"].map(tab => (
              <button key={tab} onClick={() => setActiveTab(tab)}
                className={`h-full border-b-2 transition-colors ${activeTab === tab ? "border-blue-600 text-blue-800" : "border-transparent hover:text-gray-800"}`}>
                {tab}
              </button>
            ))}
          </div>
        </div>
        <div className="w-1/3 flex justify-end">
          <button onClick={fetchCourseData}
            className="bg-gray-100 hover:bg-gray-200 text-gray-600 text-xs font-bold px-4 py-1.5 rounded transition-colors">
            Yenile
          </button>
        </div>
      </div>

      <div className="flex-1 flex overflow-hidden">
        {/* Sol Panel — Hafta listesi */}
        <aside className="w-64 bg-white border-r border-gray-200 flex flex-col shrink-0">
          <div className="p-3 text-xs font-bold text-gray-700 border-b border-gray-100 bg-gray-50">Ders Programı</div>
          <div className="flex-1 overflow-y-auto divide-y divide-gray-50">
            {displaySections.map(sec => (
              <div key={sec.id}
                onClick={() => { setActiveSectionId(sec.id); setSelectedModuleForView(null); }}
                className={`p-3 flex items-center justify-between cursor-pointer border-l-4 transition-colors ${activeSectionId === sec.id ? "bg-blue-50 border-blue-600" : "hover:bg-gray-50 border-transparent"}`}>
                <div className="flex items-center gap-2">
                  <span className={`text-sm ${activeSectionId === sec.id ? "text-blue-600" : "text-gray-300"}`}>📁</span>
                  <div className={`text-[11px] font-bold uppercase ${activeSectionId === sec.id ? "text-blue-800" : "text-gray-600"}`}>{sec.name}</div>
                </div>
                <div className={`w-5 h-5 rounded-full border flex items-center justify-center text-[9px] font-bold ${activeSectionId === sec.id ? "border-blue-300 bg-blue-100 text-blue-700" : "border-gray-200 text-gray-400"}`}>
                  {sec.modules?.length || 0}
                </div>
              </div>
            ))}
          </div>
          <div className="p-3 bg-gray-50 border-t border-gray-200">
            <div className="text-[10px] font-bold text-gray-500 mb-1">Ders Tamamlama</div>
            <div className="h-1.5 bg-gray-200 rounded-full" />
          </div>
        </aside>

        {/* Ana İçerik */}
        <main className="flex-1 flex flex-col bg-[#f4f6f9] overflow-hidden">
          <div className="p-4 flex justify-between items-center bg-white border-b border-gray-200 shrink-0">
            <h2 className="text-sm font-extrabold text-gray-800 uppercase tracking-wide">
              {selectedModuleForView ? selectedModuleForView.name : (activeSection?.name || "Bölüm Seçiniz")}
            </h2>
            <button onClick={() => setIsActivityPanelOpen(true)}
              className="bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold px-4 py-1.5 rounded-lg transition-colors flex items-center gap-1">
              + Aktivite Ekle
            </button>
          </div>

          <div className="flex-1 overflow-y-auto p-6">
            {selectedModuleForView ? (
              <TeacherActivityViewer
                mod={selectedModuleForView}
                token={token}
                courseId={courseId}
                onBack={() => setSelectedModuleForView(null)}
              />
            ) : activeSection?.modules?.length > 0 ? (
              <div className="space-y-3 max-w-4xl mx-auto w-full">
                {activeSection.modules.map(mod => {
                  const meta = modMeta[mod.modname] || { icon: "📌", color: "bg-gray-50 text-gray-600 border-gray-100" };
                  return (
                    <div key={mod.id}
                      onClick={() => setSelectedModuleForView(mod)}
                      className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm flex items-center justify-between hover:shadow-md transition-all cursor-pointer group">
                      <div className="flex items-center gap-4">
                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-lg border ${meta.color}`}>
                          {meta.icon}
                        </div>
                        <div>
                          <span className="font-bold text-sm text-gray-800 block">{mod.name}</span>
                          <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">{mod.modname}</span>
                        </div>
                      </div>
                      <div className="flex items-center gap-3 opacity-0 group-hover:opacity-100 transition-opacity">
                        {mod.modname === "quiz" && (
                          <button 
                            onClick={(e) => {
                              e.stopPropagation();
                              navigate("/teacher-question-bank", { state: { courseId, quizId: mod.instance, cmid: mod.id } });
                            }}
                            className="text-[10px] font-bold text-white bg-indigo-600 hover:bg-indigo-700 px-3 py-1.5 rounded-lg shadow-sm"
                            title="Soru Bankasına Git"
                          >
                            Soru Bankasına Git
                          </button>
                        )}
                        <button 
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDeleteActivity(mod);
                          }}
                          className="text-[10px] font-bold text-white bg-red-500 hover:bg-red-600 px-3 py-1.5 rounded-lg shadow-sm"
                          title="Aktiviteyi Sil"
                        >
                          🗑 Sil
                        </button>
                        <span className="text-xs font-semibold text-gray-400 bg-gray-100 px-3 py-1.5 rounded-lg ml-2">
                          Görüntüle →
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center h-full text-center">
                <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center text-4xl mb-5">📭</div>
                <h2 className="text-sm font-bold text-gray-600 mb-3">Henüz bu haftaya aktivite eklenmemiş.</h2>
                <button onClick={() => setIsActivityPanelOpen(true)}
                  className="bg-blue-600 hover:bg-blue-700 text-white text-sm font-bold px-6 py-2.5 rounded-xl transition-colors">
                  + Aktivite Ekle
                </button>
              </div>
            )}
          </div>
        </main>

        {/* Sağ Panel */}
        <aside className="w-72 bg-white border-l border-gray-200 p-4 flex flex-col gap-4 shrink-0 overflow-y-auto">
          <div className="bg-white rounded-xl border border-gray-200 p-4 shadow-sm flex flex-col items-center text-center">
            <div className="w-14 h-14 bg-gray-100 border border-gray-200 rounded-full flex items-center justify-center text-gray-400 text-2xl mb-3">👤</div>
            <div className="text-xs font-bold text-gray-800 uppercase tracking-wide mb-3">{userInfo.fullname}</div>
            <button className="w-full bg-gray-800 hover:bg-black text-white text-xs font-bold py-2 rounded-lg transition-colors">
              ✉ Mesaj Gönder
            </button>
          </div>
          <div className="bg-white rounded-xl border border-gray-200 p-4 shadow-sm">
            <div className="flex justify-between items-center mb-3">
              <h3 className="text-xs font-bold text-gray-700">Duyurular</h3>
              <span className="w-5 h-5 bg-gray-100 rounded-full flex items-center justify-center text-[10px] font-bold text-gray-500 border">0</span>
            </div>
            <p className="text-[11px] text-gray-400 text-center py-2">Henüz duyuru bulunmamaktadır.</p>
          </div>
        </aside>
      </div>

      {/* ── Aktivite Seçim Paneli (sağdan açılır) ── */}
      {isActivityPanelOpen && !activityFormModal && (
        <div className="fixed inset-0 z-50 bg-black/30 flex justify-end" onClick={() => setIsActivityPanelOpen(false)}>
          <div className="w-[560px] bg-white h-full shadow-2xl flex flex-col border-l border-gray-200" onClick={e => e.stopPropagation()}>
            {/* Header */}
            <div className="h-14 px-6 border-b border-gray-100 flex items-center justify-between bg-white shrink-0">
              <div>
                <h2 className="text-[15px] font-bold text-gray-800">Aktivite Ekle</h2>
                <p className="text-[11px] text-gray-400">Eklemek istediğiniz türü seçin</p>
              </div>
              <button onClick={() => setIsActivityPanelOpen(false)} className="text-gray-400 hover:text-gray-700 text-xl font-bold w-8 h-8 flex items-center justify-center">✕</button>
            </div>

            {/* Aktivite listesi */}
            <div className="flex-1 overflow-y-auto p-5">
              <div className="grid grid-cols-2 gap-3">
                {activityTypes.map(act => (
                  <button key={act.id}
                    onClick={() => handleSelectActivityType(act)}
                    className="flex items-center gap-3 p-4 bg-white border border-gray-200 rounded-xl hover:border-gray-300 hover:shadow-md transition-all text-left group">
                    <div className="w-10 h-10 rounded-xl flex items-center justify-center text-xl shrink-0 transition-transform group-hover:scale-110"
                      style={{ backgroundColor: act.iconColor + "22" }}>
                      {act.emoji}
                    </div>
                    <div>
                      <div className="text-sm font-bold text-gray-700">{act.label}</div>
                      <div className="text-[11px] text-gray-400 leading-tight">{act.desc}</div>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── Moodle Form — Tam Ekran, Uygulama İçi ── */}
      {activityFormModal && (
        <ActivityFormModal
          actType={activityFormModal.actType}
          sectionNum={activityFormModal.sectionNum}
          courseId={courseId}
          token={token}
          onClose={() => setActivityFormModal(null)}
          onSaved={() => { setActivityFormModal(null); fetchCourseData(); }}
        />
      )}

      {youtubeModalOpen && (
        <YoutubeFormModal
          sectionNum={youtubeModalOpen.sectionNum}
          courseId={courseId}
          token={token}
          onClose={() => setYoutubeModalOpen(null)}
          onSaved={() => { setYoutubeModalOpen(null); fetchCourseData(); }}
        />
      )}

      {/* ── ALMS Sınav Oluşturma Akışı ── */}
      {almsQuizActivity && (
        <AlmsQuizActivityModal 
           onClose={() => setAlmsQuizActivity(null)}
           onSaveActivity={async (form) => {
              try {
                const toUnix = (str) => {
                  if (!str) return 0;
                  const ms = new Date(str).getTime();
                  return isNaN(ms) ? 0 : Math.floor(ms / 1000);
                };

                let fullIntro = form.intro || "";
                if (form.examNote) {
                  fullIntro += `<br><br><strong>Sınav Notu:</strong><br>${form.examNote}`;
                }

                const payload = {
                  courseid: courseId,
                  section: almsQuizActivity.sectionNum,
                  type: "quiz",
                  name: form.name || "Sınav",
                  description: fullIntro,
                  timeopen: toUnix(form.start),
                  timeclose: toUnix(form.end),
                  duedate: 0,
                  maxbytes: 0,
                  maxfiles: 0,
                };

                const res = await moodlePost(token, "local_vueapi_add_activity", payload);

                if (res && res.exception) {
                  const dbg = res.debuginfo ? `\n(Detay: ${res.debuginfo})` : "";
                  throw new Error((res.message || "API hatası: İstisna fırlatıldı.") + dbg);
                }

                if (Array.isArray(res) && res.length > 0 && res[0].error) {
                  throw new Error(res[0].error);
                }

                if (res && (res.status === "success" || res.status === true || res.cmid || res.activityid || res.id)) {
                  setAlmsQuizActivity(null);
                  fetchCourseData();
                  showAlert("Sınav başarıyla oluşturuldu ve yayımlandı!");
                } else {
                  throw new Error("Sınav kaydedilemedi: " + JSON.stringify(res));
                }
              } catch (e) {
                showAlert("Kaydedilirken hata oluştu: " + e.message);
              }
           }}
        />
      )}

      {/* Aktivite Silme Onay Modalı */}
      {activityToDelete && (
        <div className="fixed inset-0 z-[300] bg-black/60 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-sm flex flex-col overflow-hidden animate-zoom-in">
            <div className="p-5 flex items-center gap-3 border-b border-gray-100 bg-red-50/50">
              <div className="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center text-red-600 shrink-0">
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
              </div>
              <h3 className="font-bold text-gray-800 text-lg">Aktiviteyi Sil</h3>
            </div>
            <div className="p-6 text-gray-600 text-sm font-medium text-center">
              <span className="font-bold text-gray-800">'{activityToDelete.name}'</span> isimli aktiviteyi silmek istediğinize emin misiniz?
            </div>
            <div className="p-4 border-t border-gray-100 bg-gray-50 flex justify-end gap-3">
              <button 
                onClick={() => setActivityToDelete(null)} 
                className="px-5 py-2.5 bg-white border border-gray-300 text-gray-700 font-bold rounded-lg hover:bg-gray-100 transition-colors shadow-sm"
              >
                Vazgeç
              </button>
              <button 
                onClick={confirmDeleteActivity} 
                className="px-5 py-2.5 bg-red-600 text-white font-bold rounded-lg hover:bg-red-700 transition-colors shadow-md flex items-center gap-2"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                Evet, Sil
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
