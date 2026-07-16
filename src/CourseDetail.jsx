import { useEffect, useState, useCallback } from "react";
import { moodlePost } from "./moodleApi";
import { useParams, useNavigate } from "react-router-dom";
import { useAuth } from "./AuthContext";
import akuzemLogo from "./assets/akuzem-lg.png";
import ActivityViewer from "./ActivityViewer";

export default function CourseDetail() {
  const [loading, setLoading] = useState(true);
  const { courseId } = useParams();
  const navigate = useNavigate();

  // Durum Yönetimleri
  const [userInfo, setUserInfo] = useState(null);
  const [courseInfo, setCourseInfo] = useState(null);
  const [courses, setCourses] = useState([]);
  const [sections, setSections] = useState([]);
  const [activeSection, setActiveSection] = useState(null);
  const [teacher, setTeacher] = useState(null);
  const [activeTab, setActiveTab] = useState("ders-icerigi");
  const [selectedActivity, setSelectedActivity] = useState(null);
  
  // Açılır Menü ve Sekme Durumları
  
  
  
  
  
   // "active" veya "archive"

  const [assignmentStats, setAssignmentStats] = useState({
    total: 0,
    completed: 0,
    percentage: 0,
  });

  const fetchCourseDetails = useCallback(async () => {
    const token = localStorage.getItem("moodle_token");
    if (!token) {
      navigate("/");
      return;
    }

    try {
      const safeParse = async (res) => {
        return res ? res : null;
      };

      // User bilgisini çekiyoruz
      const userData = await moodlePost(token, "core_webservice_get_site_info");
      setUserInfo(userData);

      if (userData && userData.userid) {
        const [
          coursesData,
          completionData,
          contentsData,
          courseFieldData
        ] = await Promise.all([
          moodlePost(token, "core_enrol_get_users_courses", { userid: userData.userid }).catch(e => null),
          moodlePost(token, "core_completion_get_activities_completion_status", { courseid: courseId, userid: userData.userid }).catch(e => null),
          moodlePost(token, "core_course_get_contents", { courseid: courseId }).catch(e => null),
          moodlePost(token, "core_course_get_courses_by_field", { field: "id", value: courseId }).catch(e => null)
        ]);

        if (Array.isArray(coursesData)) {
          setCourses(coursesData);
          const currentCourse = coursesData.find((c) => c.id === parseInt(courseId));
          setCourseInfo(currentCourse);
        }

        if (Array.isArray(contentsData)) {
          const validSections = contentsData; // Bütün bölümleri al (isim veya visible filtresi olmadan)
          setSections(validSections);
          if (validSections.length > 0) {
            setActiveSection((prev) => {
              if (prev) {
                const updated = validSections.find((s) => s.id === prev.id);
                return updated || validSections[0];
              }
              return validSections[0];
            });
          }
        } else {
          console.error("Ders içerikleri alınamadı veya hata döndü:", contentsData);
        }

        if (completionData && Array.isArray(completionData.statuses)) {
          const targetModules = completionData.statuses.filter(
            (s) => s.modname === "assign" || s.modname === "quiz",
          );
          let totalAssign = targetModules.length;
          let completedAssign = targetModules.filter(
            (s) => s.state === 1 || s.state === 2 || s.state === 3,
          ).length;
          const calculatedPercentage =
            totalAssign > 0
              ? Math.round((completedAssign / totalAssign) * 100)
              : 0;

          setAssignmentStats({
            total: totalAssign,
            completed: completedAssign,
            percentage: calculatedPercentage,
          });
        }

        if (
          courseFieldData &&
          Array.isArray(courseFieldData.courses) &&
          courseFieldData.courses.length > 0
        ) {
          const detailedCourse = courseFieldData.courses[0];
          if (
            Array.isArray(detailedCourse.contacts) &&
            detailedCourse.contacts.length > 0
          ) {
            setTeacher({
              fullname: detailedCourse.contacts[0].fullname,
              profileimageurl: detailedCourse.contacts[0].userpictureurl || "",
            });
          }
        }
      }
    } catch (error) {
      console.error("Ders verileri senkronizasyon hatası:", error);
    } finally {
      setLoading(false);
    }
  }, [courseId, navigate]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    const loadData = async () => {
      await fetchCourseDetails();
    };
    loadData();
  }, [fetchCourseDetails]);

  
  const unreadMessagesCount = 0;

  // const [currentUnixTime] = useState(() => Math.floor(Date.now() / 1000));

  return (
    <div className="min-h-screen bg-[#eeede9] font-sans text-[#495057] antialiased flex flex-col">

      {/* Ders Alt Navigasyon Çubuğu */}
      <div className="bg-white border-b-2 border-gray-300 w-full z-40 shrink-0">
        <div className="flex flex-col w-full">
          {/* Üst Kısmı: Ders Adı */}
          <div className="flex items-center h-[72px] px-6">
            <div className="flex items-center gap-4">
              <img
                src={akuzemLogo}
                alt="Course Logo"
                className="w-[45px] h-[45px] rounded-full object-contain bg-[#efefef]"
              />
              <h1 className="text-[14px] font-semibold text-[#495057] uppercase">
                {loading ? "Yükleniyor..." : courseInfo?.fullname}
              </h1>
            </div>
          </div>
          {/* Alt Kısmı: Sekmeler */}
          <div className="flex px-6 h-[40px] items-end border-t border-gray-100">
            <div className="flex gap-1 h-full">
              <button
                onClick={() => setActiveTab("ders-icerigi")}
                className={`px-4 h-full flex items-center text-[13px] font-semibold rounded-t-lg transition-colors ${
                  activeTab === "ders-icerigi"
                    ? "bg-[#eeede9] text-[#495057]"
                    : "text-gray-500 hover:text-gray-800"
                }`}
              >
                Ders İçeriği
              </button>
              <button
                onClick={() => setActiveTab("duyurular")}
                className={`px-4 h-full flex items-center text-[13px] font-semibold rounded-t-lg transition-colors ${
                  activeTab === "duyurular"
                    ? "bg-[#eeede9] text-[#495057]"
                    : "text-gray-500 hover:text-gray-800"
                }`}
              >
                Duyurular
              </button>
              <button
                onClick={() => setActiveTab("tartisma")}
                className={`px-4 h-full flex items-center text-[13px] font-semibold rounded-t-lg transition-colors ${
                  activeTab === "tartisma"
                    ? "bg-[#eeede9] text-[#495057]"
                    : "text-gray-500 hover:text-gray-800"
                }`}
              >
                Tartışma
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Ana İçerik Alanı */}
      <div className="flex-1 flex overflow-hidden">
        {/* SOL KOLON - Ders Programı */}
        <div className="w-[380px] bg-white border-r border-gray-200 flex flex-col shrink-0 overflow-y-auto">
          {/* Başlık ve Tamamlama Özeti */}
          <div className="flex items-center justify-between p-4 border-b border-gray-100 sticky top-0 bg-white z-10 shadow-sm">
            <span className="text-[16px] text-[#495057] font-bold">Ders Programı</span>
            <div className="flex items-center justify-center w-[29px] h-[29px] rounded-full border-2 border-gray-300 text-[12px] font-semibold">
              <span className="text-gray-500">{assignmentStats.completed}</span>
              <span className="text-gray-400 mx-0.5">/</span>
              <span className="text-gray-800">{assignmentStats.total}</span>
            </div>
          </div>

          {/* Haftalar Listesi */}
          <div className="flex-1 overflow-y-auto bg-white">
            <ul className="flex flex-col">
              {loading ? (
                <div className="p-4 space-y-3">
                  <div className="h-10 bg-gray-100 rounded animate-pulse w-full"></div>
                  <div className="h-10 bg-gray-100 rounded animate-pulse w-full"></div>
                </div>
              ) : (
                sections.map((section, index) => (
                  <li key={section.id} className="cursor-pointer border-b border-gray-50">
                    <div
                      onClick={() => {
                        setActiveSection(section);
                        setActiveTab("ders-icerigi");
                      }}
                      className={`flex items-center px-4 py-3 min-h-[50px] transition-colors ${
                        activeSection?.id === section.id && activeTab === "ders-icerigi"
                          ? "bg-gray-100 border-l-4 border-[#495057]"
                          : "hover:bg-gray-50 border-l-4 border-transparent"
                      }`}
                    >
                      <svg className="w-[18px] h-[18px] text-gray-400 mr-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 002-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" /></svg>
                      <div className="flex-1 flex flex-col justify-center">
                        <div className="flex items-center">
                          <label className="text-[13px] font-medium cursor-pointer text-[#495057] uppercase m-0">
                            {section.name || `HAFTA ${index + 1}`}
                          </label>
                        </div>
                      </div>
                      <span className="bg-[#d9dadc] text-black text-[10px] font-bold px-2 py-0.5 rounded-full min-w-[20px] text-center">
                        {section.modules?.length || 0}
                      </span>
                    </div>
                  </li>
                ))
              )}
            </ul>
          </div>

          {/* Tamamlama Yüzdesi Kutusu */}
          <div className="p-4 border-t border-gray-200 bg-[#e9ecef]/50">
            <div className="flex justify-between items-center mb-2">
              <span className="text-[12px] text-[#495057] font-semibold">Ders Tamamlama Yüzdesi</span>
              <div className="text-[12px] font-bold text-white bg-[#bfd500] px-2 py-0.5 rounded-full">
                {assignmentStats.percentage}%
              </div>
            </div>
            <p className="text-[11px] text-gray-500 leading-tight m-0">
              👋🏼 Biraz daha çaba göstermelisin. Çalışarak daha iyisini başarabilirsin.
            </p>
          </div>
        </div>

        {/* ORTA VE SAĞ ALAN - Scrollable */}
        <div className="flex-1 bg-white flex overflow-y-auto">
          {/* ORTA İÇERİK */}
          <div className="flex-1 p-6 flex flex-col border-r border-gray-100">
            {/* Top Toolbar */}
            <div className="flex justify-between items-center mb-4">
              <button
                onClick={fetchCourseDetails}
                className="bg-[#e9ecef] hover:bg-[#dde2e6] text-[#495057] text-[13px] font-semibold px-6 py-1.5 rounded transition-colors"
              >
                Yenile
              </button>
              <div className="flex gap-2 text-gray-500">
                <button className="p-1 hover:bg-gray-100 rounded">
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M4 4h6v6H4V4zm10 0h6v6h-6V4zM4 14h6v6H4v-6zm10 0h6v6h-6v-6z"/></svg>
                </button>
                <button className="p-1 hover:bg-gray-100 rounded">
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M4 6h16v2H4V6zm0 5h16v2H4v-2zm0 5h16v2H4v-2z"/></svg>
                </button>
              </div>
            </div>

            {/* İçerik */}
            <div className="flex-1 flex flex-col items-center pt-6">
              {activeTab === "ders-icerigi" &&
                (selectedActivity ? (
                  <div className="w-full pb-10">
                    <ActivityViewer
                      mod={selectedActivity}
                      token={localStorage.getItem("moodle_token")}
                      userId={userInfo?.userid}
                      courseId={parseInt(courseId)}
                      onBack={() => setSelectedActivity(null)}
                    />
                  </div>
                ) : activeSection?.modules?.length > 0 ? (
                  <div className="w-full space-y-3 self-start max-w-[800px] mx-auto">
                    {activeSection.modules.map((mod) => {
                      const modMeta = {
                        assign:         { icon: "📝", color: "bg-blue-100 text-blue-600",   label: "Ödev" },
                        quiz:           { icon: "📋", color: "bg-orange-100 text-orange-600",label: "Sınav" },
                        resource:       { icon: "📄", color: "bg-purple-100 text-purple-600",label: "Dosya" },
                        url:            { icon: "🔗", color: "bg-cyan-100 text-cyan-600",    label: "Bağlantı" },
                        page:           { icon: "📃", color: "bg-green-100 text-green-600",  label: "Sayfa" },
                        forum:          { icon: "💬", color: "bg-pink-100 text-pink-600",    label: "Forum" },
                        folder:         { icon: "📁", color: "bg-yellow-100 text-yellow-600",label: "Klasör" },
                        label:          { icon: "🏷️", color: "bg-gray-100 text-gray-600",    label: "Etiket" },
                        bigbluebuttonbn:{ icon: "📹", color: "bg-indigo-100 text-indigo-600",label: "Canlı Ders" },
                        scorm:          { icon: "📦", color: "bg-indigo-100 text-indigo-600",label: "SCORM" },
                        choice:         { icon: "✅", color: "bg-teal-100 text-teal-600",    label: "Seçim" },
                        feedback:       { icon: "📊", color: "bg-red-100 text-red-600",      label: "Geri Bildirim" },
                        glossary:       { icon: "📚", color: "bg-amber-100 text-amber-600",  label: "Sözlük" },
                        wiki:           { icon: "📖", color: "bg-lime-100 text-lime-600",    label: "Wiki" },
                        book:           { icon: "📕", color: "bg-rose-100 text-rose-600",    label: "Kitap" },
                      };
                      const meta = modMeta[mod.modname] || { icon: "📌", color: "bg-gray-100 text-gray-600", label: mod.modname };
                      const isClickable = mod.modname !== "bigbluebuttonbn";

                      return (
                        <div
                          key={mod.id}
                          onClick={() => isClickable && setSelectedActivity(mod)}
                          className={`flex items-center justify-between p-4 bg-white rounded-xl border border-gray-200 shadow-sm transition-all ${
                            isClickable ? "cursor-pointer hover:shadow-md hover:border-gray-300" : "opacity-60"
                          }`}
                        >
                          <div className="flex items-center gap-4">
                            <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-lg shrink-0 ${meta.color}`}>
                              {meta.icon}
                            </div>
                            <div>
                              <h4 className="text-[14px] font-semibold text-[#495057] m-0">
                                {mod.name}
                              </h4>
                              <p className="text-[11px] text-gray-400 mt-0.5 m-0">{meta.label}</p>
                            </div>
                          </div>
                          {isClickable && (
                            <span className="text-[12px] font-semibold text-[#495057] bg-[#e9ecef] px-3 py-1 rounded-lg shrink-0">
                              Görüntüle →
                            </span>
                          )}
                          {!isClickable && (
                            <span className="text-[11px] text-gray-400 shrink-0">Yakında</span>
                          )}
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="text-center flex flex-col items-center mt-[-100px]">
                    <img src="/almsp/static/media/announcement.bb29c147.svg" alt="" className="w-48 h-48 mb-6 opacity-80" onError={(e) => { e.target.style.display = 'none'; }} />
                    <h5 className="text-[16px] text-[#495057] font-medium">
                      Henüz eklenmiş bir aktivite bulunamadı.
                    </h5>
                  </div>
                ))}

              {activeTab === "duyurular" && (
                <div className="text-center flex flex-col items-center">
                  <h5 className="text-[16px] text-[#495057] font-medium">
                    Henüz eklenmiş bir duyuru bulunmamaktadır.
                  </h5>
                </div>
              )}

              {activeTab === "tartisma" && (
                <div className="text-center flex flex-col items-center">
                  <h5 className="text-[16px] text-[#495057] font-medium">
                    Henüz açılmış bir tartışma konusu bulunmamaktadır.
                  </h5>
                </div>
              )}
            </div>
          </div>

          {/* SAĞ KOLON */}
          <div className="w-[300px] shrink-0 bg-white p-6 overflow-y-auto space-y-6">
            {/* Hoca Bilgisi Kartı */}
            <div className="bg-white border border-gray-200 rounded-lg p-5 shadow-sm">
              <div className="flex flex-col items-center">
                <div className="w-[80px] h-[80px] rounded-full overflow-hidden bg-gray-100 mb-3 relative border border-gray-200">
                  {teacher?.profileimageurl ? (
                    <img
                      src={teacher.profileimageurl}
                      alt="Hoca"
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <svg className="w-full h-full text-gray-400 absolute top-2" fill="currentColor" viewBox="0 0 24 24"><path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/></svg>
                  )}
                </div>
                <span className="text-[14px] font-bold text-[#495057] uppercase text-center w-full truncate mb-3">
                  {teacher?.fullname || "Öğretim Elemanı Atanmadı"}
                </span>
                <button className="bg-[#e9ecef] hover:bg-[#dde2e6] text-[#495057] text-[13px] font-semibold py-1.5 px-4 rounded w-full flex items-center justify-center gap-2 transition-colors">
                  <svg className="w-[16px] h-[16px]" fill="currentColor" viewBox="0 0 24 24"><path d="M20 2H4c-1.1 0-2 .9-2 2v18l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2z"/></svg>
                  Mesaj gönder
                </button>
              </div>
            </div>

            {/* Duyurular Kartı */}
            <div className="bg-white border border-gray-200 rounded-lg p-5 shadow-sm min-h-[150px]">
              <div className="flex items-center gap-2 mb-4 cursor-pointer">
                <span className="text-[15px] font-bold text-[#495057]">Duyurular</span>
                <span className="bg-gray-200 text-gray-700 text-[10px] px-2 py-0.5 rounded-full font-bold">
                  0
                </span>
              </div>
              <div className="text-[13px] text-gray-500 font-medium">
                Henüz eklenmiş bir duyuru bulunmamaktadır.
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
