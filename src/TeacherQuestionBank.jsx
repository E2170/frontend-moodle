import { useEffect, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import akuzemLogo from "./assets/akuzem-lg.png";
import Header from "./Header";

// ─────────────────────────────────────────────
// Çoklu Soru Ekleme Paneli (Sağdan Açılan Modal)
// ─────────────────────────────────────────────
function BulkQuestionUploadPanel({ onClose, onUploadSuccess }) {
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

  const handleUpload = () => {
    if (!file) {
      alert("Lütfen önce bir excel dosyası yükleyin.");
      return;
    }
    setIsUploading(true);
    // Yükleme simülasyonu
    setTimeout(() => {
      setIsUploading(false);
      setUploadSuccess(true);
      setTimeout(() => {
        onClose();
        if (onUploadSuccess) onUploadSuccess();
      }, 1500);
    }, 1500);
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
              <h3 className="text-base font-bold text-gray-800 mb-1">Excel Şablonu İndirme</h3>
              <p className="text-sm text-gray-500 mb-4">Excel şablon dosyasını bilgisayarınıza indiriniz ve sorularınızı içerecek şekilde güncelleyip kaydediniz.</p>
            </div>
            <div className="w-[300px]">
              <a href="/ALMS-QuestionImportTemplate.xlsx" download
                className="w-full inline-flex justify-center items-center gap-2 bg-gray-50 hover:bg-gray-100 text-gray-700 px-4 py-3 rounded-lg text-sm font-bold transition-colors border border-gray-200">
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                </svg>
                Excel şablon dosyasını indir
              </a>
            </div>
          </div>

          {/* Step 3 */}
          <div className="flex gap-6 items-start">
            <div className="w-10 h-10 rounded-full border-2 border-gray-200 flex items-center justify-center font-bold text-gray-400 shrink-0 text-lg">3</div>
            <div className="flex-1 pt-1">
              <h3 className="text-base font-bold text-gray-800 mb-1">Excel Şablonu Yükleme</h3>
              <p className="text-sm text-gray-500 mb-4">Kaydettiğiniz excel şablonunu dosya yükleme alanından yükleyiniz.</p>
            </div>
            <div className="w-[300px]">
              <input type="file" id="excel-upload" accept=".xlsx, .xls" className="hidden" onChange={handleFileChange} />
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
  const navigate = useNavigate();

  // Temel Durum Yönetimleri
  const [userInfo, setUserInfo] = useState({
    fullname: "Yükleniyor...",
    userpictureurl: "",
  });
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);

  // Modal State
  const [isBulkAddOpen, setIsBulkAddOpen] = useState(false);

  // Arama / Sonuç State'leri
  const [isSearching, setIsSearching] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);

  // Yüklenen Sorular ve Seçim State'leri
  const [uploadedQuestions, setUploadedQuestions] = useState([]);
  const [selectedQuestions, setSelectedQuestions] = useState([]);

  // Filtre Form Durumları
  const [filters, setFilters] = useState({
    mainCourse: "",
    course: "",
    term: "",
    exam: "",
    questionText: "",
  });

  // Üst Menü Durumları
  const [isCoursesOpen, setIsCoursesOpen] = useState(false);

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
        setUserInfo(userData);

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
    } finally {
      setLoading(false);
    }
  }, [navigate]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchQuestionBankData();
  }, [fetchQuestionBankData]);

  const handleLogout = () => {
    localStorage.removeItem("moodle_token");
    localStorage.removeItem("user_role");
    navigate("/");
  };

  const getInitials = (name) => {
    if (!name || name === "Yükleniyor...") return "AE";
    const parts = name.trim().split(" ");
    if (parts.length >= 2)
      return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
    return name.slice(0, 2).toUpperCase();
  };

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

  const handleSearch = () => {
    if (!filters.course && !filters.questionText) {
      alert("Lütfen arama yapmak için en az bir ders veya soru metni kriteri giriniz.");
      return;
    }
    setIsSearching(true);
    setHasSearched(false);

    // Simüle Edilmiş Arama Gecikmesi
    setTimeout(() => {
      setIsSearching(false);
      setHasSearched(true);
    }, 1200);
  };

  const handleBulkUploadSuccess = () => {
    // Örnek Excel simülasyon soruları
    const newQuestions = [
      { id: Date.now() + 1, text: "Aşağıdakilerden hangisi React'ta bir bileşen yaşam döngüsü metodudur?", type: "Çoktan Seçmeli" },
      { id: Date.now() + 2, text: "CSS Flexbox yapısında elemanları dikey ortalamak için hangi özellik kullanılır?", type: "Çoktan Seçmeli" },
      { id: Date.now() + 3, text: "Moodle REST API aracılığıyla soru eklerken hangi servisten yararlanılır?", type: "Çoktan Seçmeli" },
      { id: Date.now() + 4, text: "Aşağıdakilerden hangisi modern JavaScript'te değişken tanımlamak için önerilmez?", type: "Çoktan Seçmeli" },
      { id: Date.now() + 5, text: "Tailwind CSS'te bir elemanı gizlemek için hangi sınıf kullanılır?", type: "Çoktan Seçmeli" }
    ];
    setUploadedQuestions(prev => [...newQuestions, ...prev]);
  };

  const handleTransferToQuiz = () => {
    if (selectedQuestions.length === 0) {
      alert("Lütfen sınava aktarmak için en az bir soru seçin!");
      return;
    }
    
    // Moodle API tarafı (Simülasyon)
    alert(`Seçilen ${selectedQuestions.length} adet soru başarıyla ilgili sınava aktarıldı! Artık ders sayfasından soruları görebilirsiniz.`);
    
    // Aktarılanları listeden temizleyebilir veya seçimi kaldırabiliriz
    setSelectedQuestions([]);
  };

  return (
    <div className="min-h-screen bg-[#f8fafc] font-sans text-gray-700 antialiased overflow-y-auto">
      <Header />

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
      {isBulkAddOpen && <BulkQuestionUploadPanel onClose={() => setIsBulkAddOpen(false)} onUploadSuccess={handleBulkUploadSuccess} />}
    </div>
  );
}
