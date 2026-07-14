import { useEffect, useState, useCallback } from "react";
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
      const userResponse = await fetch(
        `/api/webservice/rest/server.php`, { method: "POST", headers: { "Content-Type": "application/x-www-form-urlencoded" }, body: `wstoken=${token}&wsfunction=core_webservice_get_site_info&moodlewsrestformat=json` },
      );
      const userData = await userResponse.json();

      if (userData && userData.userid) {
        

        try {
          const filesResponse = await fetch(
            `/api/webservice/rest/server.php`, { method: "POST", headers: { "Content-Type": "application/x-www-form-urlencoded" }, body: `wstoken=${token}&wsfunction=core_user_get_private_files&userid=${userData.userid}&moodlewsrestformat=json` },
          );
          const filesData = await filesResponse.json();

          if (Array.isArray(filesData) && filesData.length > 0) {
            setFiles(filesData);
          } else {
            // Arayüz testi için statik veri (Moodle API aktif olana kadar)
            setFiles([
              {
                id: 1,
                name: "Turk_Anayas...",
                ext: ".pptx",
                date: "02.06.2026 20:13",
                size: "16 MB",
                type: "Paylaşılan Dosyalar",
                uploader: "TUBA AYKA...",
              },
              {
                id: 2,
                name: "BakininHaza...",
                ext: ".pdf",
                date: "18.05.2026 11:59",
                size: "209 KB",
                type: "Paylaşılan Dosyalar",
                uploader: "ALİ İRFAN AY...",
              },
              {
                id: 3,
                name: "Proje4.pdf",
                ext: ".pdf",
                date: "06.05.2026 13:13",
                size: "87 KB",
                type: "Özel Dosyalar",
                uploader: "AHMET ERT...",
              },
              {
                id: 4,
                name: "Proje4.zip",
                ext: ".zip",
                date: "06.05.2026 13:13",
                size: "62 KB",
                type: "Özel Dosyalar",
                uploader: "AHMET ERT...",
              },
              {
                id: 5,
                name: "Proje3.pdf",
                ext: ".pdf",
                date: "29.04.2026 13:15",
                size: "87 KB",
                type: "Özel Dosyalar",
                uploader: "AHMET ERT...",
              },
              {
                id: 6,
                name: "Proje3.zip",
                ext: ".zip",
                date: "29.04.2026 13:15",
                size: "59 KB",
                type: "Özel Dosyalar",
                uploader: "AHMET ERT...",
              },
              {
                id: 7,
                name: "BILGI_GUVE...",
                ext: ".pdf",
                date: "25.04.2026 15:14",
                size: "66 KB",
                type: "Özel Dosyalar",
                uploader: "AHMET ERT...",
              },
              {
                id: 8,
                name: "SEO_FINAL_...",
                ext: ".pdf",
                date: "25.04.2026 14:57",
                size: "79 KB",
                type: "Özel Dosyalar",
                uploader: "AHMET ERT...",
              },
            ]);
          }
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
                  <th className="px-6 py-4">Yükleme Tipi</th>
                  <th className="px-6 py-4">Yükleyen Kullanıcı</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {loading ? (
                  <tr>
                    <td
                      colSpan="6"
                      className="px-6 py-8 text-center text-sm text-gray-400"
                    >
                      Yükleniyor...
                    </td>
                  </tr>
                ) : files.length === 0 ? (
                  <tr>
                    <td
                      colSpan="6"
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
                      <td className="px-6 py-3 text-sm text-gray-700 font-medium">
                        {file.name}
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
