import { useEffect, useCallback } from "react";
import { moodlePost } from "./moodleApi";
import { useNavigate } from "react-router-dom";

export default function TeacherReports() {
  const navigate = useNavigate();

  // Temel Durum Yönetimleri
    
  // Menü Durumları
  
  
  const fetchReportsData = useCallback(async () => {
    const token = localStorage.getItem("moodle_token");
    if (!token) {
      navigate("/");
      return;
    }

    try {

    } catch (error) {
      console.error("Raporlar kullanıcı verisi hatası:", error);
    }
  }, [navigate]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchReportsData();
  }, [fetchReportsData]);

  
  
  return (
    <div className="min-h-screen bg-[#f8fafc] font-sans text-gray-700 antialiased overflow-y-auto">

      {/* ANA İÇERİK - Raporlar */}
      <main className="max-w-350 mx-auto p-8">
        {/* Başlık ve Arama */}
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold text-gray-800 tracking-tight">
            Raporlar
          </h1>
          <div className="flex items-center gap-2 text-gray-400 cursor-text">
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
            <span className="text-sm font-medium">Ara</span>
          </div>
        </div>

        {/* Ana Rapor Konteyneri */}
        <div className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden">
          {/* Konteyner Başlığı */}
          <div className="p-6 border-b border-gray-100 flex justify-between items-center">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-red-100 text-red-500 rounded-full flex items-center justify-center text-xl shadow-inner">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-6 w-6"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M4 6h16M4 10h16M4 14h16M4 18h16"
                  />
                </svg>
              </div>
              <div>
                <h2 className="text-lg font-bold text-gray-800">
                  Aktivite Raporları
                </h2>
                <p className="text-xs font-medium text-gray-400 mt-0.5">
                  Aktivite Raporları
                </p>
              </div>
            </div>
            <div className="bg-gray-100 text-gray-600 text-[10px] font-black px-3 py-1 rounded-full uppercase tracking-wider">
              AKTIVITE
            </div>
          </div>

          {/* Rapor Kartları Grid Alanı */}
          <div className="p-6 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {/* Kart 1: Standart Genel Aktivite Raporu */}
            <div className="border border-gray-200 rounded-xl p-6 flex flex-col items-center justify-center text-center hover:shadow-md transition-shadow">
              <div className="w-20 h-20 bg-red-100 text-red-600 rounded-full flex items-center justify-center mb-5 shadow-inner">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-8 w-8"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M4 6h16M4 10h16M4 14h16M4 18h16"
                  />
                </svg>
              </div>
              <h3 className="text-sm font-bold text-gray-800 mb-1">
                Genel Aktivite Raporu
              </h3>
              <p className="text-xs text-gray-400 font-medium mb-6">
                Standart Genel Aktivite Raporu
              </p>
              <button className="text-blue-500 hover:text-blue-700 text-sm font-semibold hover:underline">
                Raporu görüntüle
              </button>
            </div>

            {/* Kart 2: Düzenlenebilir Rapor */}
            <div className="border border-gray-200 rounded-xl p-6 flex flex-col items-center justify-center text-center hover:shadow-md transition-shadow">
              <div className="w-20 h-20 bg-red-100 text-red-600 rounded-full flex items-center justify-center mb-5 shadow-inner">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-8 w-8"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M4 6h16M4 10h16M4 14h16M4 18h16"
                  />
                </svg>
              </div>
              <h3 className="text-sm font-bold text-gray-800 mb-1">
                Genel Aktivite Raporu
              </h3>
              <p className="text-xs text-gray-400 font-medium mb-6">
                Düzenlenebilir Rapor
              </p>
              <button className="text-blue-500 hover:text-blue-700 text-sm font-semibold hover:underline">
                Raporu görüntüle
              </button>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
