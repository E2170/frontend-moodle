import { useEffect, useState, useCallback } from "react";
import { moodlePost } from "./moodleApi";
import { useNavigate } from "react-router-dom";

export default function TeacherFiles() {
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  // Temel Durum Yönetimleri
    const [files, setFiles] = useState([]);
  
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
        try {
          // 1. Önce hocanın derslerini al
          const courses = await moodlePost(token, "core_enrol_get_users_courses", { userid: userData.userid });
          
          let allFiles = [];
          
          if (Array.isArray(courses)) {
             // 2. Her dersin içeriğini çek
             const contentPromises = courses.map(course => moodlePost(token, "core_course_get_contents", { courseid: course.id }));
             const contentsResults = await Promise.all(contentPromises);
             
             contentsResults.forEach((courseContent, index) => {
                if (Array.isArray(courseContent)) {
                   const courseName = courses[index].fullname;
                   
                   courseContent.forEach(section => {
                      if (Array.isArray(section.modules)) {
                         section.modules.forEach(mod => {
                            // "resource" (Dosya) veya "folder" (Klasör) modüllerinin içindeki dosyalar
                            if (mod.modname === "resource" || mod.modname === "folder" || mod.modname === "assign") {
                               if (Array.isArray(mod.contents)) {
                                  mod.contents.forEach(file => {
                                     if (file.type === "file") {
                                        allFiles.push({
                                           id: file.filename + "_" + (file.timemodified || file.timecreated),
                                           name: file.filename,
                                           url: file.fileurl,
                                           ext: "." + file.filename.split('.').pop().toLowerCase(),
                                           date: new Date((file.timemodified || file.timecreated || Date.now() / 1000) * 1000).toLocaleString('tr-TR'),
                                           size: file.filesize ? (file.filesize / 1024 > 1024 ? (file.filesize / 1024 / 1024).toFixed(2) + " MB" : (file.filesize / 1024).toFixed(2) + " KB") : "Bilinmiyor",
                                           type: courseName,
                                           uploader: userData.fullname || "Sistem"
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
          }
          
          // Sort files by date descending (assuming newer first is better)
          // Since dates are strings, we can sort by id if id contains timestamp, or sort before stringifying.
          // Let's just set them.
          setFiles(allFiles);
          
        } catch (e) {
          console.error("Dosya servisine ulaşılamadı", e);
        }
      }
    } catch (error) {
      console.error("Kullanıcı verisi hatası:", error);
    } finally {
      setLoading(false);
    }
  }, [navigate]);

  useEffect(() => {
    const loadData = async () => {
      await fetchFilesData();
    };
    loadData();
  }, [fetchFilesData]);

  
  
  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters((prev) => ({ ...prev, [name]: value }));
  };

  const getFileUrl = (url, forceDownload = false) => {
    let newUrl = url.replace("https://moodle.argeyazilim.tr", "/api");
    if (newUrl.includes("/pluginfile.php/") && !newUrl.includes("/webservice/pluginfile.php/")) {
      newUrl = newUrl.replace("/pluginfile.php/", "/webservice/pluginfile.php/");
    }
    const token = localStorage.getItem("moodle_token");
    if (!newUrl.includes("token=")) {
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

  return (
    <div className="min-h-screen bg-[#f8fafc] font-sans text-gray-700 antialiased overflow-y-auto">

      {/* ANA İÇERİK - Dosyalarım */}
      <main className="max-w-350 mx-auto p-8">
        {/* Başlık ve Dosya Yükle Butonu */}
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold text-gray-800 tracking-tight">
            Dosyalarım
          </h1>
          <button className="bg-[#0b1b36] hover:bg-[#1a2b4c] text-white px-5 py-2.5 rounded-md text-sm font-semibold transition-colors flex items-center gap-2 shadow-sm">
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
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-5">
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1.5">
                Ara <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                name="ara"
                value={filters.ara}
                onChange={handleFilterChange}
                placeholder="Ara"
                className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm text-gray-700 focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1.5">
                Yükleyen Kullanıcı
              </label>
              <input
                type="text"
                name="yukleyen"
                value={filters.yukleyen}
                onChange={handleFilterChange}
                placeholder="Yükleyen Kullanıcı"
                className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm text-gray-700 focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1.5">
                Yükleme Tipi
              </label>
              <select
                name="tip"
                value={filters.tip}
                onChange={handleFilterChange}
                className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm text-gray-700 focus:outline-none focus:ring-1 focus:ring-blue-500 appearance-none bg-white"
              >
                <option value="">Yükleme Tipi</option>
                <option value="ozel">Özel Dosyalar</option>
                <option value="paylasilan">Paylaşılan Dosyalar</option>
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
                  <th className="px-6 py-4">Dosya Adı</th>
                  <th className="px-6 py-4">Dosya Tipi</th>
                  <th className="px-6 py-4">Yükleme Tarihi</th>
                  <th className="px-6 py-4">Dosya Boyutu</th>
                  <th className="px-6 py-4">İlişkili Ders</th>
                  <th className="px-6 py-4">Yükleyen Kullanıcı</th>
                  <th className="px-6 py-4 text-right">İşlemler</th>
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
                ) : files.length === 0 ? (
                  <tr>
                    <td
                      colSpan="7"
                      className="px-6 py-8 text-center text-sm text-gray-400"
                    >
                      Henüz dosya yüklenmemiş.
                    </td>
                  </tr>
                ) : (
                  files.map((file, index) => (
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
                        {file.type}
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
                )}
              </tbody>
            </table>
          </div>

          {/* Sayfalama (Pagination) */}
          <div className="px-6 py-4 border-t border-gray-200 bg-white flex items-center justify-center text-gray-400 text-sm font-medium gap-3">
            <button className="hover:text-gray-600 transition-colors">«</button>
            <button className="hover:text-gray-600 transition-colors">‹</button>
            <span>1 - 10 / 231</span>
            <button className="hover:text-gray-600 transition-colors">›</button>
            <button className="hover:text-gray-600 transition-colors">»</button>
          </div>
        </div>
      </main>
    </div>
  );
}
