import { useLanguage } from "./LanguageContext";
import { useEffect, useState, useCallback } from "react";
import { moodlePost } from "./moodleApi";
import { useNavigate } from "react-router-dom";

export default function TeacherFiles() {
  const { t } = useLanguage();
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  // Temel Durum Yönetimleri
  const [files, setFiles] = useState([]);
  const [courses, setCourses] = useState([]);
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [loadProgress, setLoadProgress] = useState({ loaded: 0, total: 0 });
  
  // Filtre ve Menü Durumları
  const [filters, setFilters] = useState({
    ara: "",
    yukleyen: "",
    tip: "",
  });
  

  // Moodle API Entegrasyonu
  const fetchFilesData = useCallback(async () => {
    const token = localStorage.getItem("moodle_token");
    if (!token) {
      navigate("/");
      return;
    }

    try {
      const userData = await moodlePost(token, "core_webservice_get_site_info");

      if (userData && userData.userid) {
        // Kullanıcı adını sakla (dosya yüklenirken kullanılır)
        if (userData.fullname) localStorage.setItem("moodle_fullname", userData.fullname);

        try {
          // 1. Önce hocanın derslerini al
          const courses = await moodlePost(token, "core_enrol_get_users_courses", { userid: userData.userid });
          
          let allFiles = [];

          // localStorage'dan kalıcı kaydedilmiş dosyaları yükle
          try {
            const saved = JSON.parse(localStorage.getItem("savedFiles") || "[]");
            allFiles = [...saved];
          } catch(e) { /* ignore */ }

          // İlk başlangıçta saved dosyaları hemen göster
          setFiles(allFiles);
          
          if (Array.isArray(courses)) {
             setCourses(courses);
             setLoadProgress({ loaded: 0, total: courses.length });
             
             // 2. Her dersin içeriğini çek (Chunk'lar halinde sunucuyu boğmamak için)
             const chunkSize = 5;
             let processedCount = 0;

             for (let i = 0; i < courses.length; i += chunkSize) {
                 const chunk = courses.slice(i, i + chunkSize);
                 const contentPromises = chunk.map(course => moodlePost(token, "core_course_get_contents", { courseid: course.id }));
                 const contentsResults = await Promise.all(contentPromises);
                 
                 let chunkFiles = [];
                 contentsResults.forEach((courseContent, index) => {
                    if (Array.isArray(courseContent)) {
                       const courseName = chunk[index].fullname;
                       
                       courseContent.forEach(section => {
                          if (Array.isArray(section.modules)) {
                             section.modules.forEach(mod => {
                                // "resource" (Dosya) veya "folder" (Klasör) modüllerinin içindeki dosyalar
                                if (mod.modname === "resource" || mod.modname === "folder" || mod.modname === "assign") {
                                   if (Array.isArray(mod.contents)) {
                                      mod.contents.forEach(file => {
                                         if (file.type === "file") {
                                            chunkFiles.push({
                                               id: file.filename + "_" + (file.timemodified || file.timecreated),
                                               name: file.filename,
                                               url: file.fileurl,
                                               ext: "." + file.filename.split('.').pop().toLowerCase(),
                                               date: new Date((file.timemodified || file.timecreated || Date.now() / 1000) * 1000).toLocaleString('tr-TR'),
                                               size: (file.filesize / 1024).toFixed(2) + " KB",
                                               course: courseName,
                                               uploader: file.author || userData.fullname || "Sistem"
                                            });
                                         }
                                      });
                                   }
                                }
                             });
                          }
                       });
                    }
                 });
                 
                 allFiles = [...allFiles, ...chunkFiles];

                 // localStorage'dan kaydedilmiş dosyalarla çakışmayı önle (aynı isimli dosyayı ikinci kez ekleme)
                 setFiles(() => {
                     const seenNames = new Set();
                     const merged = allFiles.filter(f => {
                       if (seenNames.has(f.name)) return false;
                       seenNames.add(f.name);
                       return true;
                     });
                     merged.sort((a, b) => {
                       const aTime = a.savedAt || 0;
                       const bTime = b.savedAt || 0;
                       if (bTime !== aTime) return bTime - aTime;
                       return b.id.localeCompare(a.id);
                     });
                     return merged;
                 });
                 
                 processedCount += chunk.length;
                 setLoadProgress({ loaded: processedCount, total: courses.length });
                 
                 // İlk chunk geldikten sonra genel loading'i kapat, sadece progress indicator kalsın
                 if (processedCount <= chunkSize) {
                     setLoading(false);
                 }
             }
          } else {
             setLoading(false);
          }
          
        } catch (error) {
          console.error("Dosyalar çekilirken hata oluştu:", error);
          setLoading(false);
        }
      }
    } catch (error) {
      console.error("Kullanıcı bilgisi alınırken hata:", error);
      setLoading(false);
    }
  }, [navigate]);

  useEffect(() => {
    fetchFilesData();
  }, [fetchFilesData]);

  
  
  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters((prev) => ({ ...prev, [name]: value }));
  };

  const getFileUrl = (url) => {
    const token = localStorage.getItem("moodle_token");
    const forceDownload = true;
    let newUrl = url;
    if (token) {
      newUrl += (newUrl.includes("?") ? "&" : "?") + "token=" + token;
    }
    if (forceDownload) {
      newUrl += "&forcedownload=1";
    }
    return newUrl;
  };

  const getFileIcon = (ext) => {
    switch (ext) {
      case ".pdf":
        return <span className="text-red-500 font-bold text-lg">📄</span>;
      case ".zip":
        return <span className="text-yellow-600 font-bold text-lg">🗜️</span>;
      case ".pptx":
        return <span className="text-orange-500 font-bold text-lg">📊</span>;
      default:
        return <span className="text-blue-500 font-bold text-lg">📁</span>;
    }
  };

  const uniqueUploaders = Array.from(new Set(files.map(f => f.uploader).filter(Boolean)));

  return (
    <div className="min-h-screen bg-[#f8fafc] font-sans text-gray-700 antialiased overflow-y-auto">

      {/* ANA İÇERİK - Dosyalarım */}
      <main className="max-w-350 mx-auto p-8">
        {/* Başlık ve Dosya Yükle Butonu */}
        <div className="flex justify-between items-center mb-6">
          <div className="flex items-center gap-4">
            <h1 className="text-2xl font-bold text-gray-800 tracking-tight">
              Dosyalarım
            </h1>
            {loadProgress.total > 0 && loadProgress.loaded < loadProgress.total && (
              <span className="bg-blue-50 text-blue-600 text-xs font-bold px-3 py-1 rounded-full border border-blue-100 flex items-center gap-2">
                <svg className="w-3 h-3 animate-spin" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
                Dosyalar Aranıyor... ({loadProgress.loaded} / {loadProgress.total})
              </span>
            )}
          </div>
          <button onClick={() => setIsUploadModalOpen(true)} className="bg-[#0b1b36] hover:bg-[#1a2b4c] text-white px-5 py-2.5 rounded-md text-sm font-semibold transition-colors flex items-center gap-2 shadow-sm">
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
                d="M12 4v16m8-8H4"
              />
            </svg>
            Dosya Yükle
          </button>
        </div>

        {/* Filtreleme Kartı */}
        <div className="bg-white border border-gray-200 rounded-t-xl p-6 shadow-sm border-b-0">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-5">
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1.5">
                Ara (Dosya İsmine Göre) <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                name="ara"
                value={filters.ara}
                onChange={handleFilterChange}
                placeholder="Dosya Adı Ara"
                className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm text-gray-700 focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1.5">{t.uploadedBy}</label>
              <select
                name="yukleyen"
                value={filters.yukleyen}
                onChange={handleFilterChange}
                className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm text-gray-700 focus:outline-none focus:ring-1 focus:ring-blue-500 appearance-none bg-white"
              >
                <option value="">Tümü</option>
                {uniqueUploaders.map(u => (
                  <option key={u} value={u}>{u}</option>
                ))}
              </select>
            </div>
          </div>
          <div className="flex justify-end">
            <button className="bg-[#0b1b36] hover:bg-[#1a2b4c] text-white px-8 py-2 rounded-md text-sm font-semibold transition-colors shadow-sm flex items-center gap-2">
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
                  d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                />
              </svg>
              Ara
            </button>
          </div>
        </div>

        {/* Veri Tablosu (DataGrid) */}
        <div className="bg-white border border-gray-200 rounded-b-xl shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-[#f1f5f9] border-b border-gray-200 text-xs text-gray-500 font-bold uppercase tracking-wider">
                  <th className="px-6 py-4">{t.fileName}</th>
                  <th className="px-6 py-4">{t.fileType}</th>
                  <th className="px-6 py-4">{t.uploadDate}</th>
                  <th className="px-6 py-4">{t.fileSize}</th>
                  <th className="px-6 py-4">{t.relatedCourse}</th>
                  <th className="px-6 py-4">{t.uploadedBy}</th>
                  <th className="px-6 py-4 text-right">{t.actions}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {loading ? (
                  <tr>
                    <td
                      colSpan="7"
                      className="px-6 py-8 text-center text-sm text-gray-400"
                    >
                      Yükleniyor...
                    </td>
                  </tr>
                ) : (() => {
                    const filteredFiles = files.filter(f => {
                       const matchAra = filters.ara === "" || (f.name && f.name.toLowerCase().includes(filters.ara.toLowerCase()));
                       const matchYukleyen = filters.yukleyen === "" || (f.uploader && f.uploader.toLowerCase().includes(filters.yukleyen.toLowerCase()));
                       return matchAra && matchYukleyen;
                    });
                    
                    if (filteredFiles.length === 0) {
                      return (
                        <tr>
                          <td colSpan="7" className="px-6 py-8 text-center text-sm text-gray-400">
                            Dosya bulunamadı.
                          </td>
                        </tr>
                      );
                    }
                    
                    return filteredFiles.map((file, index) => (
                    <tr
                      key={file.id}
                      className={`hover:bg-gray-50 transition-colors ${index % 2 === 1 ? "bg-[#fafafa]" : "bg-white"}`}
                    >
                      <td className="px-6 py-3 text-sm font-medium hover:text-blue-600 transition-colors">
                        <a 
                          href={getFileUrl(file.url, false)} 
                          target="_blank" 
                          rel="noreferrer" 
                          className="text-[#0b1b36] hover:underline block max-w-[250px] truncate"
                          title={file.name}
                        >
                          {file.name}
                        </a>
                      </td>
                      <td className="px-6 py-3 text-sm text-gray-600 flex items-center gap-2">
                        {getFileIcon(file.ext)}
                        {file.ext}
                      </td>
                      <td className="px-6 py-3 text-sm text-gray-600">
                        {file.date}
                      </td>
                      <td className="px-6 py-3 text-sm text-gray-600">
                        {file.size}
                      </td>
                      <td className="px-6 py-3 text-sm text-gray-600">
                        {file.course || file.type}
                      </td>
                      <td className="px-6 py-3 text-sm text-gray-600">
                        {file.uploader}
                      </td>
                      <td className="px-6 py-3 text-sm text-right">
                        <a 
                          href={getFileUrl(file.url, true)} 
                          download={file.name} 
                          title="İndir" 
                          className="inline-flex items-center justify-center bg-blue-50 hover:bg-blue-100 text-blue-600 p-2 rounded-lg transition-colors"
                        >
                           <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                           </svg>
                        </a>
                      </td>
                    </tr>
                  ))
                })()}
              </tbody>
            </table>
          </div>
        </div>
      </main>

      {/* Upload Modal */}
      {isUploadModalOpen && (
        <GlobalUploadModal
          onClose={() => setIsUploadModalOpen(false)}
          courses={courses}
          onSaved={() => {
            fetchFilesData();
            setIsUploadModalOpen(false);
          }}
        />
      )}
    </div>
  );
}

function GlobalUploadModal({ onClose, courses, onSaved }) {
  const { t } = useLanguage();
  const [file, setFile] = useState(null);
  const [selectedCourse, setSelectedCourse] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);

  const handleSubmit = async () => {
    if (!file) {
      setError("Lütfen bir dosya seçin.");
      return;
    }
    if (!selectedCourse) {
      setError("Lütfen bir ders seçin.");
      return;
    }

    setSubmitting(true);
    setError(null);

    try {
      const token = localStorage.getItem("moodle_token");
      const formData = new FormData();
      formData.append("wstoken", token);
      formData.append("courseid", selectedCourse);
      formData.append("section", 1); // Varsayılan olarak 1. haftaya ekler
      formData.append("name", file.name);
      formData.append("description", "");
      formData.append("file", file);

      const uploadRes = await fetch('/api/local/vueapi/upload_resource.php', {
        method: 'POST',
        body: formData
      });
      
      const rawText = await uploadRes.text();
      let uploadData;
      try {
        uploadData = JSON.parse(rawText);
      } catch {
        throw new Error("Sunucudan geçersiz yanıt alındı.");
      }

      if (!uploadData.status) throw new Error(uploadData.message || "Dosya yüklenemedi.");
      
      // Dosyayı kalıcı olarak sakla (aktivite silinse bile Dosyalarım'da kalsın)
      try {
        const saved = JSON.parse(localStorage.getItem("savedFiles") || "[]");
        const fileRecord = {
          id: "saved_" + (uploadData.cmid || Date.now()) + "_" + file.name,
          name: file.name,
          url: uploadData.fileurl || "",
          ext: "." + file.name.split(".").pop().toLowerCase(),
          date: new Date().toLocaleString("tr-TR"),
          size: (file.size / 1024).toFixed(2) + " KB",
          course: courses.find(c => String(c.id) === String(selectedCourse))?.fullname || selectedCourse,
          uploader: localStorage.getItem("moodle_fullname") || "Sistem",
          savedAt: Date.now()
        };
        saved.unshift(fileRecord);
        localStorage.setItem("savedFiles", JSON.stringify(saved));
      } catch(e) { console.warn("Dosya kaydedilemedi:", e); }

      if (onSaved) onSaved();
    } catch (e) {
      setError("Hata: " + e.message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg flex flex-col overflow-hidden">
        <div className="bg-[#1e293b] px-6 py-4 flex items-center justify-between">
          <h2 className="text-white font-semibold text-lg">{t.uploadFile}</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-white transition-colors">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        
        <div className="p-6 space-y-5">
          {error && <div className="p-3 bg-red-100 text-red-600 rounded-md text-sm">{error}</div>}
          
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1.5">{t.relatedCourse}<span className="text-red-500">*</span></label>
            <select
              value={selectedCourse}
              onChange={(e) => setSelectedCourse(e.target.value)}
              className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
            >
              <option value="">{t.selectCourse}</option>
              {courses.map(c => (
                <option key={c.id} value={c.id}>{c.fullname}</option>
              ))}
            </select>
          </div>
          
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1.5">Dosya <span className="text-red-500">*</span></label>
            <input
              type="file"
              onChange={(e) => setFile(e.target.files[0])}
              className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
          </div>
        </div>

        <div className="p-4 bg-gray-50 border-t border-gray-100 flex justify-end gap-3">
          <button onClick={onClose} className="px-5 py-2 text-sm font-semibold text-gray-600 hover:bg-gray-200 rounded-md transition-colors">
            İptal
          </button>
          <button
            onClick={handleSubmit}
            disabled={submitting || !file || !selectedCourse}
            className="px-5 py-2 text-sm font-semibold bg-blue-600 hover:bg-blue-700 text-white rounded-md transition-colors shadow-sm disabled:opacity-50"
          >
            {submitting ? "Yükleniyor..." : "Yükle"}
          </button>
        </div>
      </div>
    </div>
  );
}
