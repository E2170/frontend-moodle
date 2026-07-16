import { useEffect, useState, useCallback } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { showAlert } from "./AlertModal";
import { moodlePost } from "./moodleApi";

// ─────────────────────────────────────────────
// Çoklu Soru Ekleme Paneli (Sağdan Açılan Modal)
// ─────────────────────────────────────────────
function BulkQuestionUploadPanel({ onClose, onUploadSuccess, courseId }) {
  const [file, setFile] = useState(null);
  const [stats, setStats] = useState({ total: 0, valid: 0, invalid: 0 });
  const [isUploading, setIsUploading] = useState(false);
  const [uploadSuccess, setUploadSuccess] = useState(false);

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      const selectedFile = e.target.files[0];
      setFile(selectedFile);
      // Dosya seçilince örnek bir okuma/analiz simülasyonu yapıyoruz
      setStats({
        total: 12,
        valid: 12,
        invalid: 0
      });
    }
  };

  const handleUpload = async () => {
    if (!file) {
      showAlert("Lütfen önce bir excel veya csv dosyası yükleyin.");
      return;
    }
    if (!courseId) {
      showAlert("Ders bilgisi bulunamadı. Lütfen ders sayfasından tekrar giriş yapın.");
      return;
    }
    setIsUploading(true);

    try {
      const text = await new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = (e) => resolve(e.target.result);
        reader.onerror = (e) => reject(e);
        reader.readAsText(file);
      });

      const rows = text.split("\n").filter(r => r.trim());
      let aikenText = "";
      const parsedQuestions = [];
      
      // Skip header row if exists
      let startIdx = 0;
      if (rows[0].toLowerCase().includes("soru metni")) {
         startIdx = 1;
      }

      for (let i = startIdx; i < rows.length; i++) {
        const cols = rows[i].split(",").map(c => c.replace(/^"|"$/g, "").trim());
        if (cols.length >= 7) {
            aikenText += cols[0] + "\n";
            aikenText += "A. " + cols[1] + "\n";
            aikenText += "B. " + cols[2] + "\n";
            aikenText += "C. " + cols[3] + "\n";
            aikenText += "D. " + cols[4] + "\n";
            aikenText += "E. " + cols[5] + "\n";
            aikenText += "ANSWER: " + cols[6].toUpperCase() + "\n\n";
            
            parsedQuestions.push({
               text: cols[0],
               type: "Çoktan Seçmeli"
            });
        }
      }

      const token = localStorage.getItem("moodle_token");
      const formData = new FormData();
      formData.append("wstoken", token);
      formData.append("courseid", courseId);
      formData.append("aiken", aikenText);

      const res = await fetch("/api/local/vueapi/import_csv.php", {
        method: "POST",
        body: formData
      });
      
      const data = await res.json();
      if (!res.ok || !data.status) {
         throw new Error(data.message || "Bilinmeyen bir hata oluştu.");
      }

      const qsWithIds = parsedQuestions.map((q, idx) => ({
        id: (data.question_ids && data.question_ids[idx]) ? data.question_ids[idx] : (Date.now() + Math.random()),
        text: q.text,
        type: q.type
      }));

      setUploadSuccess(true);
      setTimeout(() => {
        onClose();
        if (onUploadSuccess) onUploadSuccess(qsWithIds);
      }, 1500);

    } catch (e) {
       showAlert("Yükleme hatası: " + e.message);
    } finally {
       setIsUploading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      {/* Overlay */}
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm transition-opacity" onClick={onClose} />
      
      {/* Side Panel */}
      <div className="relative w-full max-w-[800px] bg-white h-full shadow-2xl flex flex-col animate-slide-in-right">
        {/* Header */}
        <div className="flex items-center justify-between px-8 py-6 border-b border-gray-100 bg-white">
          <div className="flex items-center gap-3">
            <svg className="w-6 h-6 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            <h2 className="text-xl font-bold text-gray-800">Çoklu Soru Ekle</h2>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-full transition-colors text-gray-500">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-10 space-y-12">
          
          {/* Step 1 */}
          <div className="flex gap-6 items-start">
            <div className="w-10 h-10 rounded-full border-2 border-gray-200 flex items-center justify-center font-bold text-gray-400 shrink-0 text-lg">1</div>
            <div className="flex-1 pt-1">
              <h3 className="text-base font-bold text-gray-800 mb-1">Soru Tipi Seçimi</h3>
              <p className="text-sm text-gray-500 mb-4">Çoklu şekilde oluşturmak istediğiniz soru tipini seçiniz.</p>
            </div>
            <div className="w-[300px]">
              <select className="w-full border-b-2 border-gray-200 py-2 text-sm text-gray-700 outline-none focus:border-[#0b1b36] bg-transparent font-medium transition-colors">
                <option>Çoktan Tek Seçmeli</option>
                <option>Doğru / Yanlış</option>
                <option>Eşleştirme</option>
              </select>
            </div>
          </div>

          {/* Step 2 */}
          <div className="flex gap-6 items-start">
            <div className="w-10 h-10 rounded-full border-2 border-green-500 flex items-center justify-center font-bold text-green-500 shrink-0 text-lg bg-green-50">2</div>
            <div className="flex-1 pt-1">
              <h3 className="text-base font-bold text-gray-800 mb-1">CSV Şablonu İndirme</h3>
              <p className="text-sm text-gray-500 mb-4">CSV şablon dosyasını bilgisayarınıza indiriniz ve sorularınızı içerecek şekilde güncelleyip kaydediniz. Sütunlar: Soru Metni, A, B, C, D, E, Doğru Cevap Şıkkı (Örn: A)</p>
            </div>
            <div className="w-[300px]">
              <a href="/QuestionTemplate.csv" download
                className="w-full inline-flex justify-center items-center gap-2 bg-gray-50 hover:bg-gray-100 text-gray-700 px-4 py-3 rounded-lg text-sm font-bold transition-colors border border-gray-200">
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                </svg>
                CSV şablon dosyasını indir
              </a>
            </div>
          </div>

          {/* Step 3 */}
          <div className="flex gap-6 items-start">
            <div className="w-10 h-10 rounded-full border-2 border-gray-200 flex items-center justify-center font-bold text-gray-400 shrink-0 text-lg">3</div>
            <div className="flex-1 pt-1">
              <h3 className="text-base font-bold text-gray-800 mb-1">CSV Dosyası Yükleme</h3>
              <p className="text-sm text-gray-500 mb-4">Kaydettiğiniz CSV dosyasını (UTF-8 formatında) yükleme alanından yükleyiniz.</p>
            </div>
            <div className="w-[300px]">
              <input type="file" id="excel-upload" accept=".csv" className="hidden" onChange={handleFileChange} />
              <label htmlFor="excel-upload" className={`border-2 ${file ? 'border-solid border-green-400 bg-green-50' : 'border-dashed border-gray-300 hover:bg-blue-50'} rounded-xl p-8 flex flex-col items-center justify-center text-center transition-colors cursor-pointer group`}>
                {file ? (
                  <>
                    <svg className="w-8 h-8 text-green-500 mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <span className="text-sm font-bold text-green-700">{file.name}</span>
                    <span className="text-xs text-green-600 mt-1">Başarıyla seçildi, analize hazır.</span>
                  </>
                ) : (
                  <span className="text-sm text-gray-500 group-hover:text-blue-600 transition-colors">Dosyaları buraya bırak / yapıştır veya <span className="text-blue-600 font-bold underline decoration-blue-200 underline-offset-4">Seç</span></span>
                )}
              </label>
            </div>
          </div>

          {/* Statistics */}
          <div className="mt-16 pt-10 border-t border-gray-100">
            <div className="grid grid-cols-3 gap-8">
              <div>
                <div className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-2">TOPLAM SORU</div>
                <div className="text-5xl font-bold text-gray-800">{stats.total}</div>
              </div>
              <div>
                <div className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-2">GEÇERLİ SORU</div>
                <div className="text-3xl font-bold text-green-600 mt-2">{stats.valid}</div>
              </div>
              <div>
                <div className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-2">GEÇERSİZ SORU</div>
                <div className="text-3xl font-bold text-red-500 mt-2">{stats.invalid}</div>
              </div>
            </div>
            <div className="mt-8">
               <div className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-2">SORU TİPİ DAĞILIMI</div>
               <div className="text-sm text-gray-400 font-medium">
                 {stats.total > 0 ? (
                   <span className="text-gray-700 font-bold bg-gray-100 px-3 py-1 rounded-md">{stats.total} Çoktan Seçmeli Soru</span>
                 ) : "Henüz dosya yüklenmedi."}
               </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-gray-100 bg-gray-50 flex justify-between items-center shrink-0">
          <button onClick={onClose} className="bg-white border border-gray-200 hover:bg-gray-50 text-gray-700 px-8 py-3 rounded-lg text-sm font-bold transition-colors flex items-center gap-2 shadow-sm">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
            İptal
          </button>
          {uploadSuccess ? (
            <button className="bg-green-600 text-white px-10 py-3 rounded-lg text-sm font-bold flex items-center gap-2 shadow-md">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
              Başarıyla Yüklendi!
            </button>
          ) : (
            <button onClick={handleUpload} disabled={isUploading || !file} className="bg-[#0b1b36] hover:bg-black text-white px-10 py-3 rounded-lg text-sm font-bold transition-all shadow-md hover:shadow-lg flex items-center gap-2 disabled:opacity-50">
              {isUploading ? (
                <>Yükleniyor...</>
              ) : (
                <>
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  Soruları Yükle
                </>
              )}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

export default function TeacherQuestionBank() {
  // const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const location = useLocation();
  const { courseId, cmid } = location.state || {};

  // Temel Durum Yönetimleri
    const [courses, setCourses] = useState([]);
  
  // Modal State
  const [isBulkAddOpen, setIsBulkAddOpen] = useState(false);

  // Arama / Sonuç State'leri
  const [isSearching, setIsSearching] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);
  
  // Pagination State
  const [currentPage, setCurrentPage] = useState(1);
  const [totalQuestions, setTotalQuestions] = useState(0);
  const QUESTIONS_PER_PAGE = 50;

  // Yüklenen Sorular ve Seçim State'leri
  const [uploadedQuestions, setUploadedQuestions] = useState([]);
  const [selectedQuestions, setSelectedQuestions] = useState([]);
  const [previewModalOpen, setPreviewModalOpen] = useState(false);
  const [previewQuestions, setPreviewQuestions] = useState([]);
  const [isTransferring, setIsTransferring] = useState(false);
  const [questionToDelete, setQuestionToDelete] = useState(null);

  // Filtre Form Durumları
  const [filters, setFilters] = useState({
    mainCourse: "",
    course: "",
    term: "",
    exam: "",
    questionText: "",
  });

  // Üst Menü Durumları
  

  // Moodle'dan Kullanıcı ve Ders Bilgilerini Çekme
  const fetchQuestionBankData = useCallback(async () => {
    const token = localStorage.getItem("moodle_token");
    if (!token) {
      navigate("/");
      return;
    }

    try {
      // Kullanıcı Bilgileri
      const userData = await moodlePost(token, "core_webservice_get_site_info");

      if (userData && userData.userid) {
        

        // Hocanın Derslerini Çekip Dropdown'a Aktarmak İçin
        const coursesData = await moodlePost(token, "core_enrol_get_users_courses", { userid: userData.userid });

        if (Array.isArray(coursesData)) {
          setCourses(coursesData);
        }
      }
    } catch (error) {
      console.error("Soru bankası veri çekme hatası:", error);
    }
  }, [navigate]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchQuestionBankData();
  }, [fetchQuestionBankData]);

  
  
  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters((prev) => ({ ...prev, [name]: value }));
  };

  const handleClearFilters = () => {
    setFilters({
      mainCourse: "",
      course: "",
      term: "",
      exam: "",
      questionText: "",
    });
    setHasSearched(false);
  };

  const handleSearch = async (pageNumber = 1) => {
    setIsSearching(true);
    const token = localStorage.getItem("moodle_token");
    
    const targetCourseId = courseId || filters.course;
    
    if (!targetCourseId) {
        showAlert("Lütfen Soru Bankasında arama yapabilmek için yukarıdaki filtrelerden bir 'Ders' seçiniz.");
        setIsSearching(false);
        return;
    }

    try {
        const limitfrom = (pageNumber - 1) * QUESTIONS_PER_PAGE;
        const data = await moodlePost(token, "local_vueapi_get_questions", {
            courseid: targetCourseId,
            limitfrom: limitfrom,
            limitnum: QUESTIONS_PER_PAGE
        });
        
        if (data.exception) {
            showAlert("Hata: " + data.message);
        } else if (data && data.questions) {
            setUploadedQuestions(data.questions);
            setTotalQuestions(data.totalcount || 0);
            setCurrentPage(pageNumber);
        } else if (Array.isArray(data)) {
            // Fallback for older plugin version
            setUploadedQuestions(data);
            setTotalQuestions(data.length);
            setCurrentPage(1);
        }
    } catch(e) {
        showAlert("Soru getirme hatası: " + e.message);
    }
    setIsSearching(false);
    setHasSearched(true);
  };

  const handleBulkUploadSuccess = () => {
    handleSearch(1);
  };

  const confirmDeleteQuestion = async () => {
    if (!questionToDelete) return;
    
    const idsToDelete = Array.isArray(questionToDelete) ? questionToDelete : [questionToDelete];
    setQuestionToDelete(null);

    // Optimistic Update: Hemen arayüzden sil ki kullanıcı hızı hissetsin
    setUploadedQuestions(prev => prev.filter(q => !idsToDelete.includes(q.id)));
    setSelectedQuestions(prev => prev.filter(id => !idsToDelete.includes(id)));

    try {
        const token = localStorage.getItem("moodle_token");
        for (const questionId of idsToDelete) {
            // Parametre isminin id mi questionid mi olduğunu garantiye almak için ikisini de gönderiyoruz
            const data = await moodlePost(token, "local_vueapi_delete_question", { questionid: questionId, id: questionId });
            
            if (data.exception) {
                console.warn("Moodle'dan silinirken hata:", data);
                showAlert(`Soru silinemedi. Moodle Hatası: ${data.message || data.errorcode}`);
                // Hata olduğu için arayüzü geri eski haline getir (yenile)
                await fetchQuestionBankData();
                return;
            }
        }
    } catch(e) {
        console.error("Silme ağ hatası:", e.message);
    }
  };

  const handleTransferToQuiz = async () => {
    if (selectedQuestions.length === 0) {
      showAlert("Lütfen sınava aktarmak için en az bir soru seçin!");
      return;
    }
    
    if (!cmid) {
       showAlert("Hata: Bu sayfaya bir sınav (quiz) üzerinden gelmediniz!");
       return;
    }

    setPreviewQuestions(selectedQuestions.map(id => uploadedQuestions.find(q => q.id == id)));
    setPreviewModalOpen(true);
  };

  const confirmTransfer = async () => {
    setIsTransferring(true);
    try {
        const token = localStorage.getItem("moodle_token");
        for (const q of previewQuestions) {
            const data = await moodlePost(token, "local_vueapi_add_quiz_question", {
                cmid: cmid,
                questionid: q.id,
                page: 1,
                maxmark: 1.0
            });
            if (data.exception || (data.status === false)) {
                console.error("Soru ekleme hatası:", data);
                throw new Error(data.message || data.exception || "Bilinmeyen bir Moodle hatası");
            }
        }
        
        // ÖNEMLİ: Backend'de get_quiz_slots eksik olduğu için eklenen soruları frontend'de cache'liyoruz!
        const cachedQuestions = JSON.parse(localStorage.getItem(`quiz_questions_cache_${cmid}`) || "[]");
        
        // Yeni eklenenleri sadece ID olarak değil tüm obje olarak cache'liyoruz
        const newQuestions = [...cachedQuestions];
        for (const q of previewQuestions) {
            // Soru zaten cache'de var mı kontrol et
            if (!newQuestions.find(cq => cq.id === q.id)) {
                newQuestions.push(q);
            }
        }
        localStorage.setItem(`quiz_questions_cache_${cmid}`, JSON.stringify(newQuestions));
        
        setSelectedQuestions([]);
        setPreviewModalOpen(false);
        navigate(`/teacher-course/${courseId}`, { state: { openCmid: cmid } });
    } catch(e) {
        showAlert("Aktarım sırasında bir hata oluştu: " + e.message);
    } finally {
        setIsTransferring(false);
    }
  };

  const handleClosePreview = () => {
      setPreviewModalOpen(false);
  };

  return (
    <div className="min-h-screen bg-[#f8fafc] font-sans text-gray-700 antialiased overflow-y-auto">

      {/* ANA İÇERİK - Soru Bankası */}
      <main className="max-w-350 mx-auto p-8 relative">
        {/* Başlık ve Üst Butonlar */}
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold text-gray-800 tracking-tight">
            Soru Bankası
          </h1>

          <div className="flex items-center gap-3">
            <button 
              onClick={() => setIsBulkAddOpen(true)}
              className="bg-gray-100 hover:bg-gray-200 text-gray-700 px-4 py-2 rounded-md text-sm font-semibold transition-colors flex items-center gap-2 border border-gray-200 shadow-sm"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-4 w-4"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 13h6m-3-3v6m5 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                />
              </svg>
              Çoklu Soru Ekle
            </button>
            <button 
              onClick={() => {
                showAlert("Soruları tek tek girmek yerine 'Çoklu Soru Ekle' panelini kullanarak Excel ile yükleme yapmanız önerilir.");
                setIsBulkAddOpen(true);
              }}
              className="bg-[#0b1b36] hover:bg-[#1a2b4c] text-white px-5 py-2 rounded-md text-sm font-semibold transition-colors flex items-center gap-2 shadow-sm"
            >
              + Yeni Soru
            </button>
          </div>
        </div>

        {/* Filtreleme Kartı */}
        <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm mb-2 relative">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-5">
            {/* Ana Ders */}
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1.5">
                Ana Ders
              </label>
              <select
                name="mainCourse"
                value={filters.mainCourse}
                onChange={handleFilterChange}
                className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm text-gray-700 focus:outline-none focus:ring-1 focus:ring-blue-500 appearance-none bg-white"
              >
                <option value="">Ana Ders Seçiniz</option>
                {/* Gelecekte kategori çekilirse buraya map edilecek */}
              </select>
            </div>

            {/* Ders (Moodle'dan Dinamik) */}
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1.5">
                Ders
              </label>
              <select
                name="course"
                value={filters.course}
                onChange={handleFilterChange}
                className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm text-gray-700 focus:outline-none focus:ring-1 focus:ring-blue-500 appearance-none bg-white"
              >
                <option value="">Ders Seçiniz</option>
                {courses.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.fullname}
                  </option>
                ))}
              </select>
            </div>

            {/* Dönem */}
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1.5">
                Dönem
              </label>
              <select
                name="term"
                value={filters.term}
                onChange={handleFilterChange}
                className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm text-gray-700 focus:outline-none focus:ring-1 focus:ring-blue-500 appearance-none bg-white"
              >
                <option value="">Dönem Seçiniz</option>
                <option value="guz_2026">2026-2027 Güz</option>
                <option value="bahar_2026">2025-2026 Bahar</option>
              </select>
            </div>

            {/* Sınav */}
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1.5">
                Sınav
              </label>
              <select
                name="exam"
                value={filters.exam}
                onChange={handleFilterChange}
                className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm text-gray-700 focus:outline-none focus:ring-1 focus:ring-blue-500 appearance-none bg-white"
              >
                <option value="">Sınav Seçiniz</option>
                <option value="vize">Vize</option>
                <option value="final">Final</option>
                <option value="butunleme">Bütünleme</option>
              </select>
            </div>
          </div>

          {/* Soru Metni Input */}
          <div className="mb-6">
            <label className="block text-xs font-semibold text-gray-600 mb-1.5">
              Soru Metni
            </label>
            <input
              type="text"
              name="questionText"
              value={filters.questionText}
              onChange={handleFilterChange}
              placeholder="Aranacak kelimeyi giriniz..."
              className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm text-gray-700 focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
          </div>

          {/* Aksiyon Butonları (Temizle ve Ara) */}
          <div className="flex justify-end gap-3">
            <button
              onClick={handleClearFilters}
              className="bg-[#0b1b36] hover:bg-[#1a2b4c] text-white px-6 py-2 rounded-md text-sm font-semibold transition-colors shadow-sm"
            >
              Temizle
            </button>
            <button
              onClick={() => handleSearch(1)}
              disabled={isSearching}
              className="bg-[#0b1b36] hover:bg-[#1a2b4c] text-white px-6 py-2 rounded-md text-sm font-semibold transition-colors shadow-sm flex items-center gap-2 disabled:opacity-50"
            >
              {isSearching ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  Aranıyor...
                </>
              ) : (
                <>
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                  Ara
                </>
              )}
            </button>
          </div>
        </div>

        {/* Detaylı Arama Etiketi */}
        <div className="flex justify-end mb-8">
          <button className="bg-gray-100 text-gray-500 text-xs font-medium px-4 py-1.5 rounded-b-lg border-x border-b border-gray-200 flex items-center gap-1 hover:bg-gray-200 transition-colors">
            Detaylı Arama <span className="font-bold">↓</span>
          </button>
        </div>

        {/* Sonuç Alanı */}
        {uploadedQuestions.length > 0 ? (
          <div className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden mb-12 animate-fade-in">
            <div className="p-5 bg-gray-50 border-b border-gray-200 flex justify-between items-center">
              <div className="flex items-center gap-3">
                <span className="font-bold text-gray-800 text-lg">{uploadedQuestions.length} Soru Listeleniyor</span>
                <span className="bg-blue-100 text-blue-800 text-xs font-bold px-2.5 py-0.5 rounded-full">{selectedQuestions.length} Seçili</span>
              </div>
              <div className="flex items-center gap-3">
                {selectedQuestions.length > 0 && (
                  <button 
                    onClick={() => setQuestionToDelete(selectedQuestions)}
                    className="bg-red-50 hover:bg-red-100 text-red-600 px-5 py-2.5 rounded-md text-sm font-bold shadow-sm flex items-center gap-2 transition-colors border border-red-200"
                  >
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                    Seçili Soruları Sil ({selectedQuestions.length})
                  </button>
                )}
                {cmid && (
                  <button 
                    onClick={handleTransferToQuiz}
                    className="bg-green-600 hover:bg-green-700 text-white px-5 py-2.5 rounded-md text-sm font-bold shadow-sm flex items-center gap-2 transition-colors"
                  >
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                    Seçili Soruları Sınava Aktar
                  </button>
                )}
              </div>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-gray-50 text-xs text-gray-500 uppercase tracking-wider border-b border-gray-200">
                    <th className="p-4 w-12 text-center">
                      <input 
                        type="checkbox" 
                        onChange={(e) => setSelectedQuestions(e.target.checked ? uploadedQuestions.map(q => q.id) : [])} 
                        checked={selectedQuestions.length > 0 && selectedQuestions.length === uploadedQuestions.length} 
                        className="w-4 h-4 text-blue-600 rounded border-gray-300 focus:ring-blue-500 cursor-pointer"
                      />
                    </th>
                    <th className="p-4 font-bold text-gray-700">Soru Metni</th>
                    <th className="p-4 w-32 font-bold text-gray-700">Soru Tipi</th>
                    <th className="p-4 w-24 text-center font-bold text-gray-700">İşlem</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 text-sm">
                  {uploadedQuestions.map(q => (
                    <tr key={q.id} className="hover:bg-blue-50 transition-colors cursor-pointer" onClick={() => {
                       if (selectedQuestions.includes(q.id)) setSelectedQuestions(selectedQuestions.filter(id => id !== q.id));
                       else setSelectedQuestions([...selectedQuestions, q.id]);
                    }}>
                      <td className="p-4 text-center">
                        <input 
                          type="checkbox" 
                          checked={selectedQuestions.includes(q.id)} 
                          readOnly
                          className="w-4 h-4 text-blue-600 rounded border-gray-300 focus:ring-blue-500 cursor-pointer"
                        />
                      </td>
                      <td className="p-4 text-gray-800 font-medium" dangerouslySetInnerHTML={{ __html: q.questiontext || q.text || "<i class='text-gray-400'>Soru metni yüklenemedi</i>" }}></td>
                      <td className="p-4">
                        <span className="bg-gray-100 text-gray-600 px-2 py-1 rounded text-xs font-semibold">{q.type}</span>
                      </td>
                      <td className="p-4 text-center">
                        <button 
                          onClick={(e) => { e.stopPropagation(); setQuestionToDelete(q.id); }}
                          className="w-8 h-8 inline-flex items-center justify-center rounded-full text-red-500 hover:text-white hover:bg-red-500 transition-colors shadow-sm"
                          title="Soruyu Sil"
                        >
                          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {totalQuestions > QUESTIONS_PER_PAGE && (
              <div className="flex items-center justify-between p-4 border-t border-gray-200 bg-gray-50 rounded-b-xl">
                <span className="text-sm text-gray-700">
                  Toplam <span className="font-bold">{totalQuestions}</span> sorudan <span className="font-bold">{(currentPage - 1) * QUESTIONS_PER_PAGE + 1}</span> - <span className="font-bold">{Math.min(currentPage * QUESTIONS_PER_PAGE, totalQuestions)}</span> arası gösteriliyor
                </span>
                <div className="flex items-center gap-2">
                  <button 
                    disabled={currentPage === 1}
                    onClick={() => handleSearch(currentPage - 1)}
                    className="px-3 py-1.5 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >Önceki</button>
                  <span className="text-sm font-bold text-gray-600">Sayfa {currentPage} / {Math.ceil(totalQuestions / QUESTIONS_PER_PAGE)}</span>
                  <button 
                    disabled={currentPage * QUESTIONS_PER_PAGE >= totalQuestions}
                    onClick={() => handleSearch(currentPage + 1)}
                    className="px-3 py-1.5 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >Sonraki</button>
                </div>
              </div>
            )}
          </div>
        ) : isSearching ? (
          <div className="flex flex-col items-center justify-center py-20 animate-fade-in">
            <div className="w-10 h-10 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mb-4"></div>
            <p className="text-gray-600 font-semibold">Sorular aranıyor, lütfen bekleyin...</p>
          </div>
        ) : hasSearched ? (
          <div className="flex flex-col items-center justify-center py-20 bg-white border border-gray-200 rounded-xl shadow-sm animate-fade-in">
            <div className="text-4xl mb-3">🔍</div>
            <p className="text-gray-700 font-semibold text-lg">Aradığınız kriterlere uygun soru bulunamadı.</p>
            <p className="text-gray-500 text-sm mt-1">Lütfen filtreleri değiştirerek tekrar deneyin veya yeni soru ekleyin.</p>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center opacity-90 animate-fade-in">
            <div className="w-32 h-32 bg-[#e5e7eb] rounded-full flex items-center justify-center relative mb-6">
              <svg viewBox="0 0 100 100" className="w-24 h-24 mt-2" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M45 80 L55 80 L52 50 L48 50 Z" fill="#475569" />
                <path d="M35 50 Q50 30 65 40 L50 60 Z" fill="#94a3b8" />
                <circle cx="45" cy="25" r="7" fill="#1e293b" />
                <path d="M50 35 L80 20 L80 35 Z" fill="#ef4444" />
                <path d="M85 15 L95 20 M88 25 L98 25 M85 35 L95 30" stroke="#cbd5e1" strokeWidth="2" strokeLinecap="round" />
              </svg>
            </div>
            <p className="text-gray-700 font-semibold text-lg">
              Filtreleme yaparak soruları listeleyebilirsiniz
            </p>
          </div>
        )}
      </main>

      {/* Çoklu Soru Ekle Modal */}
      {isBulkAddOpen && (
        <BulkQuestionUploadPanel 
          courseId={courseId || filters.course}
          onClose={() => setIsBulkAddOpen(false)}
          onUploadSuccess={handleBulkUploadSuccess}
        />
      )}

      {/* Önizleme ve Onay Modalı */}
      {previewModalOpen && (
          <div className="fixed inset-0 z-[100] bg-black/60 flex items-center justify-center p-4">
              <div className="bg-white rounded-2xl shadow-2xl w-full max-w-3xl flex flex-col max-h-[85vh] overflow-hidden">
                  <div className="p-6 border-b border-gray-100 bg-blue-50">
                      <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-blue-500 rounded-full flex items-center justify-center text-white text-xl font-bold">📋</div>
                          <div>
                              <h2 className="text-lg font-bold text-blue-800">Sınava Aktarılacak Sorular (Önizleme)</h2>
                              <p className="text-sm text-blue-600">Seçilen {previewQuestions.length} adet soruyu onaylamadan önce son kez kontrol edebilirsiniz.</p>
                          </div>
                      </div>
                  </div>
                  
                  <div className="p-6 flex-1 overflow-y-auto bg-gray-50">
                      <div className="space-y-4">
                          {previewQuestions.map((q, idx) => (
                              <div key={idx} className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm group relative">
                                  <div className="flex justify-between items-center mb-2">
                                      <span className="text-xs font-bold text-gray-400">Soru {idx + 1}</span>
                                      <span className="px-2 py-0.5 bg-blue-50 text-blue-600 rounded text-[10px] font-bold">{q?.qtype || 'Soru'}</span>
                                  </div>
                                  <div className="font-semibold text-sm text-gray-800 mb-1">{q?.name || "İsimsiz Soru"}</div>
                                  <div className="text-xs text-gray-600" dangerouslySetInnerHTML={{ __html: q?.questiontext || q?.text || "<i class='text-gray-400'>İçerik yüklenemedi</i>" }} />
                                  <button 
                                      onClick={() => setPreviewQuestions(previewQuestions.filter((_, i) => i !== idx))}
                                      className="absolute top-4 right-4 p-1.5 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-md transition-colors opacity-0 group-hover:opacity-100"
                                      title="Soruyu Listeden Çıkar"
                                  >
                                      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                                  </button>
                              </div>
                          ))}
                          {previewQuestions.length === 0 && (
                              <div className="text-center py-8 text-gray-500">
                                  Aktarılacak soru kalmadı. Lütfen geri dönüp soru seçin.
                              </div>
                          )}
                      </div>
                  </div>

                  <div className="p-5 border-t border-gray-100 bg-white flex justify-end gap-3">
                      <button onClick={handleClosePreview} disabled={isTransferring} className="px-6 py-2.5 border border-gray-200 hover:bg-gray-50 text-gray-600 rounded-xl text-sm font-bold transition-colors">
                          İptal Et
                      </button>
                      <button 
                          onClick={confirmTransfer} 
                          disabled={previewQuestions.length === 0 || isTransferring} 
                          className="px-6 py-2.5 bg-green-600 hover:bg-green-700 text-white rounded-xl text-sm font-bold transition-colors shadow-sm disabled:opacity-50 flex items-center gap-2"
                      >
                          {isTransferring ? "Aktarılıyor..." : `Evet, ${previewQuestions.length} Soruyu Sınava Aktar`}
                      </button>
                  </div>
              </div>
          </div>
      )}

      {/* Soru Silme Onay Modalı */}
      {questionToDelete && (
        <div className="fixed inset-0 z-[300] bg-black/60 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-sm flex flex-col overflow-hidden animate-zoom-in">
            <div className="p-5 flex items-center gap-3 border-b border-gray-100 bg-red-50/50">
              <div className="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center text-red-600 shrink-0">
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
              </div>
              <h3 className="font-bold text-gray-800 text-lg">Soruyu Sil</h3>
            </div>
            <div className="p-6 text-gray-600 text-sm font-medium text-center">
              {Array.isArray(questionToDelete) 
                ? `Seçili ${questionToDelete.length} soruyu kalıcı olarak silmek istediğinize emin misiniz? Bu işlem geri alınamaz.` 
                : "Bu soruyu kalıcı olarak silmek istediğinize emin misiniz? Bu işlem geri alınamaz."}
            </div>
            <div className="p-4 border-t border-gray-100 bg-gray-50 flex justify-end gap-3">
              <button 
                onClick={() => setQuestionToDelete(null)} 
                className="px-5 py-2.5 bg-white border border-gray-300 text-gray-700 font-bold rounded-lg hover:bg-gray-100 transition-colors shadow-sm"
              >
                Vazgeç
              </button>
              <button 
                onClick={confirmDeleteQuestion} 
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
