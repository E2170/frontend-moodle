import { useEffect, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import akuzemLogo from "./assets/akuzem-lg.png";
import Header from "./Header";
export default function Dashboard() {
  const navigate = useNavigate();

  // Durum Yönetimleri
  const [userInfo, setUserInfo] = useState({
    fullname: "Yükleniyor...",
    username: "...",
    userpictureurl: "",
  });
  const [courses, setCourses] = useState([]);
  const [timelineEvents, setTimelineEvents] = useState([]);
  const [announcements, setAnnouncements] = useState([]);
  const [conversations, setConversations] = useState([]);

  // Açılır Menü ve Sekme Durum Yönetimleri
  const [isCoursesOpen, setIsCoursesOpen] = useState(false);
  const [isNotificationOpen, setIsNotificationOpen] = useState(false);
  const [isLanguageOpen, setIsLanguageOpen] = useState(false);
  const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false); // EKLENDİ: Profil menüsü durumu
  const [notificationTab, setNotificationTab] = useState("bildirimler");
  const [currentLang, setCurrentLang] = useState("TR");
  const [menuTab, setMenuTab] = useState("active");

  const [activityStats, setActivityStats] = useState({
    pastDue: 0,
    upcoming: 0,
    ungraded: 0,
    completed: 0,
  });

  const [loading, setLoading] = useState(true);

  const fetchDashboardData = useCallback(async () => {
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

      if (userData && userData.fullname) {
        setUserInfo(userData);

        if (userData.userid) {
          const coursesResponse = await fetch(
            `/api/webservice/rest/server.php`, { method: "POST", headers: { "Content-Type": "application/x-www-form-urlencoded" }, body: `wstoken=${token}&wsfunction=core_enrol_get_users_courses&userid=${userData.userid}&moodlewsrestformat=json` },
          );
          const timelineResponse = await fetch(
            `/api/webservice/rest/server.php`, { method: "POST", headers: { "Content-Type": "application/x-www-form-urlencoded" }, body: `wstoken=${token}&wsfunction=core_calendar_get_action_events_by_timesort&moodlewsrestformat=json` },
          );
          const announcementsResponse = await fetch(
            `/api/webservice/rest/server.php`, { method: "POST", headers: { "Content-Type": "application/x-www-form-urlencoded" }, body: `wstoken=${token}&wsfunction=mod_forum_get_forum_discussions&forumid=2&moodlewsrestformat=json` },
          );
          const messagesResponse = await fetch(
            `/api/webservice/rest/server.php`, { method: "POST", headers: { "Content-Type": "application/x-www-form-urlencoded" }, body: `wstoken=${token}&wsfunction=core_message_get_conversations&userid=${userData.userid}&moodlewsrestformat=json` },
          );

          const safeParse = async (res) => {
            if (!res.ok) return null;
            try { return await res.json(); } catch (e) { return null; }
          };

          const coursesData = await safeParse(coursesResponse);
          const timelineData = await safeParse(timelineResponse);
          const announcementsData = await safeParse(announcementsResponse);
          const messagesData = await safeParse(messagesResponse);

          if (coursesData && Array.isArray(coursesData)) {
            // Derslerin ilerleme durumunu aktiviteler üzerinden dinamik olarak hesapla
            const coursesWithProgress = await Promise.all(
              coursesData.map(async (course) => {
                try {
                  const progRes = await fetch(`/api/webservice/rest/server.php`, {
                    method: "POST",
                    headers: { "Content-Type": "application/x-www-form-urlencoded" },
                    body: `wstoken=${token}&wsfunction=core_completion_get_activities_completion_status&courseid=${course.id}&userid=${userData.userid}&moodlewsrestformat=json`
                  });
                  const progData = await progRes.json();
                  if (progData && progData.statuses) {
                    // Sadece tamamlanma kriteri açık olan (veya tamamlanmış olan) aktiviteleri alalım
                    const trackable = progData.statuses.filter(s => s.hascompletion !== false && s.isautomatic !== undefined || s.tracking > 0 || s.modname === 'assign' || s.modname === 'quiz');
                    if (trackable.length > 0) {
                      const completed = trackable.filter(s => s.state === 1 || s.state === 2).length;
                      course.progress = Math.round((completed / trackable.length) * 100);
                    } else {
                      course.progress = course.progress || 0; 
                    }
                  } else {
                    course.progress = course.progress || 0;
                  }
                } catch (e) {
                  course.progress = course.progress || 0;
                }
                return course;
              })
            );
            setCourses(coursesWithProgress);
          }

          if (timelineData && Array.isArray(timelineData.events)) {
            setTimelineEvents(timelineData.events);

            const currentUnixTime = Math.floor(Date.now() / 1000);
            let past = 0;
            let up = 0;
            let ungr = 0;
            let comp = 0;

            timelineData.events.forEach((event) => {
              if (!event) return;

              if (event.timesort && event.timesort < currentUnixTime) {
                past++;
              } else {
                up++;
              }

              if (event.action && event.action.clickable === false) {
                comp++;
              } else {
                ungr++;
              }
            });

            setActivityStats({
              pastDue: past,
              upcoming: up,
              ungraded: ungr,
              completed: comp,
            });
          }

          if (
            announcementsData &&
            Array.isArray(announcementsData.discussions)
          ) {
            setAnnouncements(announcementsData.discussions);
          }

          if (messagesData && Array.isArray(messagesData.conversations)) {
            setConversations(messagesData.conversations);
          }
        }
      }
    } catch (error) {
      console.error("Moodle API entegrasyon hatası:", error);
    } finally {
      setLoading(false);
    }
  }, [navigate]);

  useEffect(() => {
    const loadData = async () => {
      await fetchDashboardData();
    };
    loadData();
  }, [fetchDashboardData]);

  const handleLogout = () => {
    localStorage.removeItem("moodle_token");
    localStorage.removeItem("user_role");
    navigate("/");
  };

  const getCourseInitials = (fullname) => {
    if (!fullname) return "DS";
    const words = fullname.split(" ");
    if (words.length >= 2) {
      return (words[0][0] + words[1][0]).toUpperCase();
    }
    return fullname.slice(0, 2).toUpperCase();
  };

  const getInitials = (name) => {
    if (!name || name === "Yükleniyor...") return "CK";
    const parts = name.trim().split(" ");
    if (parts.length >= 2) {
      return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
    }
    return name.slice(0, 2).toUpperCase();
  };

  const formatMoodleDate = (timestamp) => {
    if (!timestamp) return "";
    const date = new Date(timestamp * 1000);
    const months = [
      "Oca",
      "Şub",
      "Mar",
      "Nis",
      "May",
      "Haz",
      "Tem",
      "Ağu",
      "Eyl",
      "Eki",
      "Kas",
      "Ara",
    ];
    return `${date.getDate()} ${months[date.getMonth()]} ${date.getFullYear()}`;
  };

  const stripHtmlTags = (htmlString) => {
    if (!htmlString) return "";
    return htmlString.replace(/<[^>]*>/g, "");
  };

  const totalActivities = activityStats.pastDue + activityStats.upcoming;
  const unreadMessagesCount = conversations.reduce(
    (total, conv) => total + (conv.unreadcount || 0),
    0,
  );

  const [currentUnixTimeState] = useState(() => Math.floor(Date.now() / 1000));
  const examEvents = timelineEvents.filter(
    (e) => e?.modulename === "quiz" && e?.timesort >= currentUnixTimeState,
  );
  const assignEvents = timelineEvents.filter(
    (e) => e?.modulename === "assign" && e?.timesort >= currentUnixTimeState,
  );
  const virtualClassroomEvents = timelineEvents.filter(
    (e) =>
      ["bigbluebuttonbn", "zoom", "perculus", "adobeconnect"].includes(
        e?.modulename,
      ) && e?.timesort >= currentUnixTimeState,
  );

  const [currentUnixTime] = useState(() => Math.floor(Date.now() / 1000));
  const activeCourses = courses.filter(
    (c) => !c.enddate || c.enddate === 0 || c.enddate > currentUnixTime,
  );
  const archivedCourses = courses.filter(
    (c) => c.enddate && c.enddate !== 0 && c.enddate <= currentUnixTime,
  );
  const displayedCourses =
    menuTab === "active" ? activeCourses : archivedCourses;

  return (
    <div className="min-h-screen bg-white font-sans text-gray-800 antialiased overflow-hidden">
      {/* NAVBAR */}
      <Header />

      <main className="w-full max-w-[1400px] mx-auto px-4 sm:px-[6%] py-8 h-[calc(100vh-60px)] overflow-y-auto">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
          
          {/* DERSLERİM - 2 COLUMN */}
          <div className="lg:col-span-2">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-4 gap-3">
              <h2 className="text-[20px] font-medium text-[#212529]">Derslerim</h2>
              <div className="flex items-center gap-3">
                <span className="text-[13px] text-[#212529] font-medium">Toplam Ders</span>
                <span className="bg-[#f8f9fa] border border-[#dee2e6] text-[#212529] text-[11px] font-bold px-2 py-0.5 rounded-full">{activeCourses.length}</span>
                <button 
                  onClick={() => navigate("/mycourse")} 
                  className="text-[13px] text-[#212529] border border-[#dee2e6] bg-[#f8f9fa] px-3 py-1 rounded-md font-medium flex items-center hover:bg-[#e2e6ea] transition-colors ml-2"
                >
                  Tümü <span className="ml-1 text-[16px] text-gray-500 leading-none">→</span>
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-2 gap-4">
              {loading ? (
                <div className="col-span-2 text-center py-8 text-gray-500 text-sm">Veriler yükleniyor...</div>
              ) : activeCourses.length === 0 ? (
                <div className="col-span-2 text-center py-8 text-gray-500 text-sm border border-[#e9ecef] rounded-[8px] bg-white">Kayıtlı ders bulunamadı.</div>
              ) : (
                activeCourses.map((course) => (
                  <div key={course.id} onClick={() => navigate(`/course/${course.id}`)} className="bg-white rounded-[8px] border border-[#e9ecef] shadow-[0_1px_3px_rgba(0,0,0,0.02)] hover:shadow-md hover:border-[#ced4da] transition-all cursor-pointer h-[150px] flex flex-col justify-between overflow-hidden relative group">
                    <div className="p-4 flex-1">
                      <div className="flex justify-between items-start mb-2">
                        <span className="text-[10px] font-bold text-[#6c757d] bg-[#f8f9fa] px-1.5 py-0.5 rounded">
                          {course.shortname || "DERS"}
                        </span>
                        
                        <div className="relative">
                          <svg width="36" height="36" className="transform -rotate-90">
                            <circle cx="18" cy="18" r="16" stroke="#e9ecef" strokeWidth="3" fill="none" />
                            <circle cx="18" cy="18" r="16" stroke="#28a745" strokeWidth="3" fill="none" strokeDasharray="100.5" strokeDashoffset={100.5 - ((course.progress || 0) / 100) * 100.5} />
                          </svg>
                          <div className="absolute inset-0 flex items-center justify-center text-[9px] font-bold text-[#28a745]">
                            <span className="text-[7px]">%</span>{course.progress !== undefined ? Math.round(course.progress) : 0}
                          </div>
                        </div>

                      </div>
                      <h3 className="text-[13px] font-bold text-[#212529] leading-tight pr-10 line-clamp-2 mt-1">
                        {course.fullname}
                      </h3>
                    </div>
                    <div className="flex justify-between items-center px-4 pb-4 mt-auto">
                      <div className="w-[26px] h-[26px] rounded-full bg-[#945cbf] text-white flex items-center justify-center text-[10px] font-bold shadow-sm">
                        {getCourseInitials(course.fullname)}
                      </div>
                      <div className="flex gap-2 text-[#adb5bd] opacity-0 group-hover:opacity-100 transition-opacity">
                         <span className="text-[16px] hover:text-[#6c757d]">⚙</span>
                         <span className="text-[16px] hover:text-[#6c757d]">⏱</span>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* ZAMAN ÇİZELGESİ - 1 COLUMN */}
          <div className="lg:col-span-1 mt-6 lg:mt-0">
             <div className="bg-white rounded-[8px] border border-[#e9ecef] shadow-[0_1px_3px_rgba(0,0,0,0.02)] h-[100%] flex flex-col">
                <div className="flex items-center justify-between p-4 border-b border-[#e9ecef]">
                  <h2 className="text-[15px] font-medium text-[#212529]">Zaman Çizelgesi</h2>
                  <button 
                    onClick={() => navigate("/calendar")} 
                    className="text-[12px] text-[#212529] font-medium flex items-center hover:text-[#0056b3]"
                  >
                    Tümü <span className="ml-1 text-[16px] text-gray-500 leading-none">→</span>
                  </button>
                </div>
                <div className="p-5 flex-1 max-h-[300px] overflow-y-auto">
                  <h4 className="text-[13px] text-[#e83e8c] font-bold mb-4 border-b border-[#e83e8c] inline-block pb-0.5">Geçmiş</h4>
                  {loading ? (
                    <div className="text-[12px] text-gray-500">Yükleniyor...</div>
                  ) : timelineEvents.length === 0 ? (
                    <div className="text-[12px] text-gray-500">Yaklaşan aktiviteniz yoktur.</div>
                  ) : (
                    timelineEvents.slice(0, 4).map(event => (
                      <div key={event.id} className="border-l-[3px] border-[#dc3545] pl-3 py-1 mb-4">
                        <div className="text-[11px] text-[#e83e8c] font-medium mb-0.5 opacity-80">{formatMoodleDate(event.timesort)}</div>
                        <div className="text-[13px] font-bold text-[#212529] leading-tight">{event.name}</div>
                        <div className="text-[11px] text-[#6c757d] mt-1">{event.course?.fullname}</div>
                      </div>
                    ))
                  )}
                </div>
             </div>
          </div>
        </div>

        {/* 3 COLUMN GRID FOR THE REST */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 pb-12">
          
          {/* Sanal Sınıf */}
          <div className="bg-white rounded-[8px] border border-[#e9ecef] shadow-[0_1px_3px_rgba(0,0,0,0.02)] flex flex-col">
            <div className="flex items-center justify-between p-4 border-b border-[#e9ecef]">
               <div className="flex items-center gap-2">
                 <h2 className="text-[15px] font-medium text-[#212529]">Sanal Sınıf</h2>
                 <span className="bg-[#f8f9fa] border border-[#dee2e6] text-[#212529] text-[11px] font-bold px-2 py-0.5 rounded-full">{virtualClassroomEvents.length}</span>
               </div>
               <div className="flex items-center gap-3">
                 <span className="text-[#adb5bd] text-[16px] cursor-pointer hover:text-[#6c757d]">👁</span>
                 <button onClick={() => navigate("/calendar")} className="text-[12px] text-[#212529] font-medium flex items-center hover:text-[#0056b3]">Tümü <span className="ml-1 text-[16px] text-gray-500 leading-none">→</span></button>
               </div>
            </div>
            <div className="p-5 flex-1">
              {virtualClassroomEvents.length === 0 ? (
                <p className="text-[13px] text-[#6c757d]">Yaklaşan sanal sınıf aktiviteniz yoktur.</p>
              ) : (
                 virtualClassroomEvents.map(event => (
                   <div key={event.id} className="mb-3 border-b border-[#f8f9fa] pb-3 last:border-0 last:pb-0">
                     <div className="text-[13px] font-bold text-[#212529]">{event.name}</div>
                     <div className="text-[11px] text-[#6c757d] mt-0.5">{formatMoodleDate(event.timesort)}</div>
                   </div>
                 ))
              )}
            </div>
          </div>

          {/* Aktivitelerim */}
          <div className="bg-white rounded-[8px] border border-[#e9ecef] shadow-[0_1px_3px_rgba(0,0,0,0.02)] flex flex-col">
            <div className="flex items-center justify-between p-4 border-b border-[#e9ecef]">
               <div className="flex items-center gap-2">
                 <h2 className="text-[15px] font-medium text-[#212529]">Aktivitelerim</h2>
                 <span className="bg-[#f8f9fa] border border-[#dee2e6] text-[#212529] text-[11px] font-bold px-2 py-0.5 rounded-full">{totalActivities + activityStats.completed + activityStats.ungraded}</span>
               </div>
               <div className="flex items-center gap-3">
                 <span className="text-[#adb5bd] text-[16px] cursor-pointer hover:text-[#6c757d]">👁</span>
                 <button onClick={() => navigate("/calendar")} className="text-[12px] text-[#212529] font-medium flex items-center hover:text-[#0056b3]">Tümü <span className="ml-1 text-[16px] text-gray-500 leading-none">→</span></button>
               </div>
            </div>
            <div className="p-0 flex-1 flex flex-col">
               <div className="flex justify-between items-center p-3 border-b border-[#f8f9fa] px-4">
                 <span className="text-[13px] text-[#495057]">Teslim tarihi geçmiş</span>
                 <span className="bg-[#f8f9fa] border border-[#dee2e6] text-[#212529] text-[11px] font-bold px-2 py-0.5 rounded-full">{activityStats.pastDue}</span>
               </div>
               <div className="flex justify-between items-center p-3 border-b border-[#f8f9fa] px-4">
                 <span className="text-[13px] text-[#495057]">Teslim tarihi yaklaşan</span>
                 <span className="bg-[#f8f9fa] border border-[#dee2e6] text-[#212529] text-[11px] font-bold px-2 py-0.5 rounded-full">{activityStats.upcoming}</span>
               </div>
               <div className="flex justify-between items-center p-3 border-b border-[#f8f9fa] px-4">
                 <span className="text-[13px] text-[#495057]">Notlandırılmamış</span>
                 <span className="bg-[#f8f9fa] border border-[#dee2e6] text-[#212529] text-[11px] font-bold px-2 py-0.5 rounded-full">{activityStats.ungraded}</span>
               </div>
               <div className="flex justify-between items-center p-3 px-4">
                 <span className="text-[13px] text-[#495057]">Tamamlanan</span>
                 <span className="bg-[#f8f9fa] border border-[#dee2e6] text-[#212529] text-[11px] font-bold px-2 py-0.5 rounded-full">{activityStats.completed}</span>
               </div>
            </div>
          </div>

          {/* Mesajlarım */}
          <div className="bg-white rounded-[8px] border border-[#e9ecef] shadow-[0_1px_3px_rgba(0,0,0,0.02)] flex flex-col">
            <div className="flex items-center justify-between p-4 border-b border-[#e9ecef]">
               <div className="flex items-center gap-2">
                 <h2 className="text-[15px] font-medium text-[#212529]">Mesajlarım</h2>
                 <span className="bg-[#f8f9fa] border border-[#dee2e6] text-[#212529] text-[11px] font-bold px-2 py-0.5 rounded-full">{unreadMessagesCount}</span>
               </div>
               <div className="flex items-center gap-3">
                 <span className="text-[#adb5bd] text-[16px] cursor-pointer hover:text-[#6c757d]">👁</span>
                 <button onClick={() => navigate("/messages")} className="text-[12px] text-[#212529] font-medium flex items-center hover:text-[#0056b3]">Tümü <span className="ml-1 text-[16px] text-gray-500 leading-none">→</span></button>
               </div>
            </div>
            <div className="p-5 flex-1">
              {conversations.length === 0 ? (
                <p className="text-[13px] text-[#6c757d]">Herhangi bir mesajınız bulunamadı.</p>
              ) : (
                conversations.slice(0,3).map(conv => (
                   <div key={conv.id} className="text-[13px] text-[#212529] border-b border-[#f8f9fa] pb-3 mb-3 last:border-0 last:pb-0 last:mb-0 flex gap-3">
                      <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center font-bold text-blue-600 shrink-0">
                         {conv.members?.[0]?.fullname?.slice(0,1) || "U"}
                      </div>
                      <div className="overflow-hidden flex-1">
                        <div className="font-bold">{conv.members?.[0]?.fullname}</div>
                        <div className="text-[#6c757d] truncate text-[12px]">{stripHtmlTags(conv.messages?.[0]?.text)}</div>
                      </div>
                   </div>
                ))
              )}
            </div>
          </div>

          {/* Duyurular */}
          <div className="bg-white rounded-[8px] border border-[#e9ecef] shadow-[0_1px_3px_rgba(0,0,0,0.02)] flex flex-col">
            <div className="flex items-center justify-between p-4 border-b border-[#e9ecef]">
               <div className="flex items-center gap-2">
                 <h2 className="text-[15px] font-medium text-[#212529]">Duyurular</h2>
                 <span className="bg-[#f8f9fa] border border-[#dee2e6] text-[#212529] text-[11px] font-bold px-2 py-0.5 rounded-full">{announcements.length}</span>
               </div>
               <div className="flex items-center gap-3">
                 <span className="text-[#adb5bd] text-[16px] cursor-pointer hover:text-[#6c757d]">👁</span>
                 <button onClick={() => navigate("/announcements")} className="text-[12px] text-[#212529] font-medium flex items-center hover:text-[#0056b3]">Tümü <span className="ml-1 text-[16px] text-gray-500 leading-none">→</span></button>
               </div>
            </div>
            <div className="p-5 flex-1 max-h-[250px] overflow-auto">
               {announcements.length === 0 ? (
                 <p className="text-[13px] text-[#6c757d]">Duyurunuz bulunmamaktadır.</p>
               ) : (
                 announcements.map(item => (
                   <div key={item.id} className="mb-4 pb-4 border-b border-[#f8f9fa] last:border-0 last:pb-0 last:mb-0">
                     <h4 className="text-[12px] font-bold text-[#212529] mb-1.5 leading-tight uppercase">📍 {item.name}</h4>
                     <p className="text-[12px] text-[#6c757d] leading-snug line-clamp-3">{stripHtmlTags(item.message)}</p>
                     <div className="text-[11px] text-[#adb5bd] mt-2 font-medium">{formatMoodleDate(item.timemodified)}</div>
                   </div>
                 ))
               )}
            </div>
          </div>

          {/* Sınav */}
          <div className="bg-white rounded-[8px] border border-[#e9ecef] shadow-[0_1px_3px_rgba(0,0,0,0.02)] flex flex-col">
            <div className="flex items-center justify-between p-4 border-b border-[#e9ecef]">
               <div className="flex items-center gap-2">
                 <h2 className="text-[15px] font-medium text-[#212529]">Sınav</h2>
                 <span className="bg-[#f8f9fa] border border-[#dee2e6] text-[#212529] text-[11px] font-bold px-2 py-0.5 rounded-full">{examEvents.length}</span>
               </div>
               <div className="flex items-center gap-3">
                 <span className="text-[#adb5bd] text-[16px] cursor-pointer hover:text-[#6c757d]">👁</span>
                 <button className="text-[12px] text-[#212529] font-medium flex items-center hover:text-[#0056b3]">Tümü <span className="ml-1 text-[16px] text-gray-500 leading-none">→</span></button>
               </div>
            </div>
            <div className="p-5 flex-1">
              {examEvents.length === 0 ? (
                <p className="text-[13px] text-[#6c757d]">Yaklaşan sınav aktiviteniz yoktur.</p>
              ) : (
                 examEvents.map(event => (
                   <div key={event.id} className="mb-3 border-b border-[#f8f9fa] pb-3 last:border-0 last:pb-0">
                     <div className="text-[13px] font-bold text-[#212529]">{event.name}</div>
                     <div className="text-[11px] text-[#6c757d] mt-0.5">{formatMoodleDate(event.timesort)}</div>
                   </div>
                 ))
              )}
            </div>
          </div>

          {/* Ödev */}
          <div className="bg-white rounded-[8px] border border-[#e9ecef] shadow-[0_1px_3px_rgba(0,0,0,0.02)] flex flex-col">
            <div className="flex items-center justify-between p-4 border-b border-[#e9ecef]">
               <div className="flex items-center gap-2">
                 <h2 className="text-[15px] font-medium text-[#212529]">Ödev</h2>
                 <span className="bg-[#f8f9fa] border border-[#dee2e6] text-[#212529] text-[11px] font-bold px-2 py-0.5 rounded-full">{assignEvents.length}</span>
               </div>
               <div className="flex items-center gap-3">
                 <span className="text-[#adb5bd] text-[16px] cursor-pointer hover:text-[#6c757d]">👁</span>
                 <button className="text-[12px] text-[#212529] font-medium flex items-center hover:text-[#0056b3]">Tümü <span className="ml-1 text-[16px] text-gray-500 leading-none">→</span></button>
               </div>
            </div>
            <div className="p-5 flex-1">
              {assignEvents.length === 0 ? (
                <p className="text-[13px] text-[#6c757d]">Yaklaşan ödev aktiviteniz yoktur.</p>
              ) : (
                 assignEvents.map(event => (
                   <div key={event.id} className="mb-3 border-b border-[#f8f9fa] pb-3 last:border-0 last:pb-0">
                     <div className="text-[13px] font-bold text-[#212529]">{event.name}</div>
                     <div className="text-[11px] text-[#6c757d] mt-0.5">{formatMoodleDate(event.timesort)}</div>
                   </div>
                 ))
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
