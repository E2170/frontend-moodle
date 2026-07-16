import { useEffect, useState, useCallback } from "react";
import { moodlePost } from "./moodleApi";
import { useNavigate } from "react-router-dom";
export default function Grades() {
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  // Temel Durum Yönetimleri
      const [coursesWithGrades, setCoursesWithGrades] = useState([]);

  const fetchGradesData = useCallback(async () => {
    const token = localStorage.getItem("moodle_token");
    if (!token) {
      navigate("/");
      return;
    }

    try {
      // 1. Kullanıcı bilgilerini al
      const userData = await moodlePost(token, "core_webservice_get_site_info");

      if (userData && userData.userid) {
        

        // 2. Kullanıcının kayıtlı olduğu dersleri al
        const coursesData = await moodlePost(token, "core_enrol_get_users_courses", { userid: userData.userid });

        // 3. Kullanıcının genel not özetini (Grade Overview) al
        let gradesData = { grades: [] };
        try {
          gradesData = await moodlePost(token, "gradereport_overview_get_course_grades", { userid: userData.userid });
        } catch (e) {
          console.warn("Not özeti çekilemedi, dersler notsuz listelenecek.", e);
        }

        if (Array.isArray(coursesData)) {
          // Dersleri ve Notları Birleştir
          const mergedData = coursesData.map((course) => {
            const courseGrade = gradesData.grades?.find(
              (g) => g.courseid === course.id,
            );
            return {
              ...course,
              grade: courseGrade?.grade ? courseGrade.grade : "--",
              rawgrade: courseGrade?.rawgrade ? courseGrade.rawgrade : null,
              categoryname: course.categoryname || "Bilgisayar Mühendisliği" // Default to match screenshot if missing
            };
          });
          setCoursesWithGrades(mergedData);
        }
      }
    } catch (error) {
      console.error("Not çizelgesi verileri alınamadı:", error);
    } finally {
      setLoading(false);
    }
  }, [navigate]);

  useEffect(() => {
    fetchGradesData();
  }, [fetchGradesData]);

  
  return (
    <div className="min-h-screen bg-[#fcfcfc] font-sans text-[#495057] antialiased overflow-y-auto flex flex-col">

      {/* Ana İçerik - Not Çizelgem Alanı */}
      <main className="max-w-[1200px] w-full mx-auto px-4 py-8 flex-1">
        {/* Başlık ve Ders Sayısı */}
        <div className="mb-6 flex items-baseline gap-2">
          <h1 className="text-[22px] font-semibold text-[#212529] tracking-tight">
            Not Çizelgem
          </h1>
          {!loading && (
            <span className="text-[13px] font-medium text-[#adb5bd]">
              {coursesWithGrades.length} Ders
            </span>
          )}
        </div>

        {/* Loading Durumu */}
        {loading ? (
          <div className="space-y-6">
            <div className="h-64 bg-white border border-[#e5e7eb] rounded-[10px] animate-pulse"></div>
            <div className="h-64 bg-white border border-[#e5e7eb] rounded-[10px] animate-pulse"></div>
          </div>
        ) : coursesWithGrades.length === 0 ? (
          <div className="bg-white border border-[#e5e7eb] rounded-[10px] p-12 text-center text-gray-500 font-medium shadow-sm">
            Kayıtlı olduğunuz herhangi bir ders bulunamadı.
          </div>
        ) : (
          <div className="space-y-[18px]">
            {coursesWithGrades.map((course) => (
              <div
                key={course.id}
                className="bg-[#fafafa] border border-[#e9ecef] rounded-[10px] flex flex-col"
              >
                {/* Kart Başlığı */}
                <div className="p-4 flex flex-col relative border-b border-[#e9ecef] bg-white rounded-t-[10px] cursor-pointer">
                  {/* Kategori Bilgisi */}
                  <div className="text-[12px] font-normal text-[#adb5bd] mb-0.5">
                    {course.categoryname}
                  </div>
                  <div className="flex items-center gap-2">
                    <h2 className="text-[15px] font-medium text-[#212529] uppercase truncate max-w-[80%]">
                      {course.fullname}
                    </h2>
                    <span className="bg-[#f8f9fa] text-[#495057] text-[12px] font-semibold px-2.5 py-0.5 rounded-full border border-[#dee2e6] min-w-[24px] text-center">
                      0
                    </span>
                  </div>

                  {/* Sağ Üst Not Etiketi */}
                  <div className="absolute right-4 top-1/2 -translate-y-1/2 bg-[#f1f3f5] text-[#868e96] text-[13px] font-medium px-6 py-1.5 rounded-[15px]">
                    {course.grade === "0" ? "--" : course.grade}
                  </div>
                </div>

                {/* Kart Gövdesi (Boş Durum İllüstrasyonu) */}
                <div className="flex-1 py-10 flex flex-col items-center justify-center bg-[#fafafa] rounded-b-[10px]">
                  {/* İllüstrasyon - SVG formatında */}
                  <div className="w-[180px] h-[180px] bg-[#f1f3f5] rounded-full flex items-center justify-center mb-6 relative">
                    <svg
                      viewBox="0 0 200 200"
                      className="w-full h-full"
                      fill="none"
                      xmlns="http://www.w3.org/2000/svg"
                    >
                      {/* Basit İllüstrasyon (Bilgisayar başında oturan çocuk) */}
                      <circle cx="100" cy="100" r="90" fill="#f1f3f5" />
                      
                      {/* Body */}
                      <path d="M120 120 L135 150 L85 150 L100 120 Z" fill="#ff8a8a" />
                      
                      {/* Laptop */}
                      <path d="M80 150 L140 150 L140 145 L80 145 Z" fill="#343a40" />
                      <path d="M90 145 L130 145 L125 125 L95 125 Z" fill="#495057" />
                      
                      {/* Head */}
                      <circle cx="110" cy="105" r="12" fill="#ffb3b3" />
                      <path d="M102 98 Q110 90 118 98 Z" fill="#212529" />
                      
                      {/* Plant */}
                      <path d="M60 150 L70 150 L65 140 Z" fill="#495057" />
                      <circle cx="65" cy="135" r="4" fill="#212529" />
                      
                      {/* Cloud/Box */}
                      <rect x="50" y="80" width="40" height="15" rx="3" fill="#e9ecef" stroke="#ced4da" strokeWidth="2" />
                      <circle cx="70" cy="87.5" r="3" fill="#adb5bd" />
                    </svg>
                  </div>

                  <p className="text-[14px] font-semibold text-[#212529]">
                    Şube için henüz Not Çizelgesi oluşturulmadı.
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
