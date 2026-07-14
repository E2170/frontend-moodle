import { useEffect, useState, useCallback } from "react";
import { useLocation, useNavigate } from "react-router-dom";

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
      alert("Lütfen önce bir excel veya csv dosyası yükleyin.");
      return;
    }
    if (!courseId) {
      alert("Ders bilgisi bulunamadı. Lütfen ders sayfasından tekrar giriş yapın.");
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
       alert("Yükleme hatası: " + e.message);
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

  // Yüklenen Sorular ve Seçim State'leri
  const [uploadedQuestions, setUploadedQuestions] = useState([]);
  const [selectedQuestions, setSelectedQuestions] = useState([]);
  // const [transferring, setTransferring] = useState(false);
  const [previewModalOpen, setPreviewModalOpen] = useState(false);
  const [previewQuestions, setPreviewQuestions] = useState([]);

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
      const userResponse = await fetch(
        `/api/webservice/rest/server.php`, { method: "POST", headers: { "Content-Type": "application/x-www-form-urlencoded" }, body: `wstoken=${token}&wsfunction=core_webservice_get_site_info&moodlewsrestformat=json` },
      );
      const userData = await userResponse.json();

      if (userData && userData.userid) {
        

        // Hocanın Derslerini Çekip Dropdown'a Aktarmak İçin
        const coursesResponse = await fetch(
          `/api/webservice/rest/server.php`, { method: "POST", headers: { "Content-Type": "application/x-www-form-urlencoded" }, body: `wstoken=${token}&wsfunction=core_enrol_get_users_courses&userid=${userData.userid}&moodlewsrestformat=json` },
        );
        const coursesData = await coursesResponse.json();

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

  const handleSearch = async () => {
    setIsSearching(true);
    const token = localStorage.getItem("moodle_token");
    try {
        const params = new URLSearchParams({
            wstoken: token,
            wsfunction: "local_vueapi_get_questions",
            moodlewsrestformat: "json",
            courseid: courseId
        });
        const res = await fetch("/api/webservice/rest/server.php", { method: "POST", body: params });
        const data = await res.json();
        if (data.exception) {
            alert("Hata: " + data.message);
        } else if (Array.isArray(data)) {
            setUploadedQuestions(data);
        }
    } catch(e) {
        alert("Soru getirme hatası: " + e.message);
    }
    setIsSearching(false);
    setHasSearched(true);
  };

  const handleBulkUploadSuccess = () => {
    handleSearch();
  };

  const handleTransferToQuiz = async () => {
    if (selectedQuestions.length === 0) {
      alert("Lütfen sınava aktarmak için en az bir soru seçin!");
      return;
    }
    
    if (!cmid) {
       alert("Hata: Bu sayfaya bir sınav (quiz) üzerinden gelmediniz!");
       return;
    }

    try {
        const token = localStorage.getItem("moodle_token");
        for (const qId of selectedQuestions) {
            const params = new URLSearchParams({
                wstoken: token,
                wsfunction: "local_vueapi_add_quiz_question",
                moodlewsrestformat: "json",
                cmid: cmid,
                questionid: qId,
                page: 1,
                maxmark: 1.0
            });
            const res = await fetch("/api/webservice/rest/server.php", { method: "POST", body: params });
            const data = await res.json();
            if (data.exception || (data.status === false)) {
                console.error("Soru ekleme hatası:", data);
                throw new Error(data.message || data.exception || "Bilinmeyen bir Moodle hatası");
            }
        }
        
        setPreviewQuestions(selectedQuestions.map(id => uploadedQuestions.find(q => q.id == id)));
        setSelectedQuestions([]);
        setPreviewModalOpen(true);
    } catch(e) {
        alert("Yönlendirme sırasında bir hata oluştu: " + e.message);
    }
  };

  const handleClosePreview = () => {
      setPreviewModalOpen(false);
      navigate(`/teacher/course/${courseId}`, { state: { openCmid: cmid } });
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
                alert("Soruları tek tek girmek yerine 'Çoklu Soru Ekle' panelini kullanarak Excel ile yükleme yapmanız önerilir.");
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
              onClick={handleSearch}
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
              <button 
                onClick={handleTransferToQuiz}
                className="bg-green-600 hover:bg-green-700 text-white px-5 py-2.5 rounded-md text-sm font-bold shadow-sm flex items-center gap-2 transition-colors"
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                Seçili Soruları Sınava Aktar
              </button>
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
                    <th className="p-4 w-48 font-bold text-gray-700">Soru Tipi</th>
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
                      <td className="p-4 text-gray-800 font-medium">{q.text}</td>
                      <td className="p-4">
                        <span className="bg-gray-100 text-gray-600 px-2 py-1 rounded text-xs font-semibold">{q.type}</span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
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
      {isBulkAddOpen && <BulkQuestionUploadPanel courseId={courseId} onClose={() => setIsBulkAddOpen(false)} onUploadSuccess={handleBulkUploadSuccess} />}

      {/* Başarı ve Önizleme Modalı */}
      {previewModalOpen && (
          <div className="fixed inset-0 z-[100] bg-black/60 flex items-center justify-center p-4">
              <div className="bg-white rounded-2xl shadow-2xl w-full max-w-3xl flex flex-col max-h-[85vh] overflow-hidden">
                  <div className="p-6 border-b border-gray-100 bg-green-50">
                      <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-green-500 rounded-full flex items-center justify-center text-white text-xl font-bold">✓</div>
                          <div>
                              <h2 className="text-lg font-bold text-green-800">Aktarım Başarılı!</h2>
                              <p className="text-sm text-green-600">Seçilen {previewQuestions.length} adet soru sınava eklendi.</p>
                          </div>
                      </div>
                  </div>
                  
                  <div className="p-6 flex-1 overflow-y-auto bg-gray-50">
                      <h3 className="text-sm font-bold text-gray-700 mb-4">Sınav Önizlemesi (Eklenen Sorular)</h3>
                      <div className="space-y-4">
                          {previewQuestions.map((q, idx) => (
                              <div key={idx} className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm">
                                  <div className="flex justify-between items-center mb-2">
                                      <span className="text-xs font-bold text-gray-400">Soru {idx + 1}</span>
                                      <span className="px-2 py-0.5 bg-blue-50 text-blue-600 rounded text-[10px] font-bold">{q?.qtype || 'Soru'}</span>
                                  </div>
                                  <div className="font-semibold text-sm text-gray-800 mb-1">{q?.name}</div>
                                  <div className="text-xs text-gray-600" dangerouslySetInnerHTML={{ __html: q?.questiontext || "İçerik yüklenemedi" }} />
                              </div>
                          ))}
                      </div>
                  </div>

                  <div className="p-5 border-t border-gray-100 bg-white flex justify-end">
                      <button onClick={handleClosePreview} className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-sm font-bold transition-colors">
                          Önizlemeyi Kapat ve Derse Dön
                      </button>
                  </div>
              </div>
          </div>
      )}
    </div>
  );
}
