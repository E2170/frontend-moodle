import { useEffect, useState, useCallback } from "react";
import { moodlePost } from "./moodleApi";
import { useNavigate } from "react-router-dom";
import { useAuth } from "./AuthContext";
import CourseCard from "./components/CourseCard";

export default function Dashboard() {
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const { token, userInfo } = useAuth();

  // Durum Yönetimleri
  const [courses, setCourses] = useState([]);
  const [timelineEvents, setTimelineEvents] = useState([]);
  const [announcements, setAnnouncements] = useState([]);
  const [conversations, setConversations] = useState([]);
  const [error, setError] = useState(null);

  // Aktif/Arşiv Dersler Sekmesi
  // eslint-disable-next-line no-unused-vars
  const menuTab = "active";

  const [activityStats, setActivityStats] = useState({
    pastDue: 0,
    upcoming: 0,
    ungraded: 0,
    completed: 0,
  });

  
  const fetchDashboardData = useCallback(async () => {
    if (!token || !userInfo || !userInfo.userid) {
      setLoading(false);
      return;
    }

    try {
      const [
        coursesResponse,
        timelineResponse,
        announcementsResponse,
        messagesResponse
      ] = await Promise.all([
        moodlePost(token, "core_enrol_get_users_courses", { userid: userInfo.userid }).catch(e => { console.error("courses error", e); return null; }),
        moodlePost(token, "core_calendar_get_action_events_by_timesort").catch(e => { console.error("timeline error", e); return null; }),
        moodlePost(token, "mod_forum_get_forum_discussions", { forumid: "2" }).catch(e => { console.error("forum error", e); return null; }),
        moodlePost(token, "core_message_get_conversations", { userid: userInfo.userid }).catch(e => { console.error("messages error", e); return null; })
      ]);

      const safeParse = async (res) => {
        return res ? res : null;
      };

          const coursesData = await safeParse(coursesResponse);
          const timelineData = await safeParse(timelineResponse);
          const announcementsData = await safeParse(announcementsResponse);
          const messagesData = await safeParse(messagesResponse);

          if (coursesData && Array.isArray(coursesData)) {
            const enrichedCourses = await Promise.all(coursesData.map(async (course) => {
              try {
                // Moodle's native 'progress' is only updated during cron.
                // To show instant progress, we dynamically calculate it from module states.
                const contentsRes = await moodlePost(token, "core_course_get_contents", {
                  courseid: course.id
                });
                
                if (Array.isArray(contentsRes)) {
                  let totalActivities = 0;
                  let completedActivities = 0;
                  
                  contentsRes.forEach(sec => {
                    if (sec.modules) {
                      sec.modules.forEach(mod => {
                        // Count modules that have completion enabled (completion > 0)
                        if (mod.completion > 0) {
                          totalActivities++;
                          // state 1: completed, 2: completed passed, 3: completed failed
                          if (mod.completiondata && (mod.completiondata.state == 1 || mod.completiondata.state == 2 || mod.completiondata.state == 3)) {
                            completedActivities++;
                          }
                        }
                      });
                    }
                  });
                  
                  if (totalActivities > 0) {
                    course.calculatedProgress = Math.round((completedActivities / totalActivities) * 100);
                  } else {
                    course.calculatedProgress = course.progress || 0;
                  }
                } else {
                  course.calculatedProgress = course.progress || 0;
                }
              } catch (e) {
                course.calculatedProgress = course.progress || 0;
              }
              return course;
            }));
            
            setCourses(enrichedCourses);
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
    } catch (err) {
      console.error("Moodle API entegrasyon hatası:", err);
      setError("Veriler yüklenirken bir sorun oluştu. Moodle sunucusuna geçici olarak ulaşılamıyor olabilir.");
    } finally {
      setLoading(false);
    }
  }, [token, userInfo]);

  useEffect(() => {
    const loadData = async () => {
      await fetchDashboardData();
    };
    loadData();
  }, [fetchDashboardData]);

  const formatMoodleDate = (timestamp) => {
    if (!timestamp) return "";
    const date = new Date(timestamp * 1000);
    const months = [
      "Oca", "Şub", "Mar", "Nis", "May", "Haz",
      "Tem", "Ağu", "Eyl", "Eki", "Kas", "Ara",
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
  // eslint-disable-next-line no-unused-vars
  const archivedCourses = courses.filter(
    (c) => c.enddate && c.enddate !== 0 && c.enddate <= currentUnixTime,
  );


  return (
    <div className="bg-white font-sans text-gray-800 antialiased h-full">
      {/* NAVBAR */}

      <main className="w-full max-w-[1400px] mx-auto px-4 sm:px-[6%] py-8">
        
        {error && (
          <div className="bg-red-50 border border-red-200 p-4 mb-6 rounded-[8px] flex items-center gap-3">
            <svg className="w-6 h-6 text-red-500 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <div className="text-sm font-medium text-red-800">{error}</div>
          </div>
        )}

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
                  <CourseCard key={course.id} course={course} />
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
                <div className="p-5 flex-1">
                  <h4 className="text-[13px] text-[#e83e8c] font-bold mb-4 border-b border-[#e83e8c] inline-block pb-0.5">Geçmiş</h4>
                  {loading ? (
                    <div className="text-[12px] text-gray-500">Yükleniyor...</div>
                  ) : timelineEvents.length === 0 ? (
                    <div className="text-[12px] text-gray-500">Yaklaşan aktiviteniz yoktur.</div>
                  ) : (
                    timelineEvents.slice(0, 4).map(event => (
                      <div 
                        key={event.id} 
                        onClick={() => { if (event.course?.id) navigate(`/course/${event.course.id}`) }}
                        className="border-l-[3px] border-[#dc3545] pl-3 py-1 mb-4 cursor-pointer hover:bg-gray-50 transition-colors rounded-r-md"
                      >
                        <div className="text-[11px] text-[#e83e8c] font-medium mb-0.5 opacity-80">{formatMoodleDate(event.timesort)}</div>
                        <div className="text-[13px] font-bold text-[#212529] leading-tight group-hover:text-blue-600">{event.name}</div>
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

                 <button onClick={() => navigate("/calendar")} className="text-[12px] text-[#212529] font-medium flex items-center hover:text-[#0056b3]">Tümü <span className="ml-1 text-[16px] text-gray-500 leading-none">→</span></button>
               </div>
            </div>
            <div className="p-5 flex-1">
              {virtualClassroomEvents.length === 0 ? (
                <p className="text-[13px] text-[#6c757d]">Yaklaşan sanal sınıf aktiviteniz yoktur.</p>
              ) : (
                 virtualClassroomEvents.slice(0, 4).map(event => (
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

                 <button onClick={() => navigate("/announcements")} className="text-[12px] text-[#212529] font-medium flex items-center hover:text-[#0056b3]">Tümü <span className="ml-1 text-[16px] text-gray-500 leading-none">→</span></button>
               </div>
            </div>
            <div className="p-5 flex-1">
               {announcements.length === 0 ? (
                 <p className="text-[13px] text-[#6c757d]">Duyurunuz bulunmamaktadır.</p>
               ) : (
                 announcements.slice(0, 4).map(item => (
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

                 <button onClick={() => navigate("/calendar")} className="text-[12px] text-[#212529] font-medium flex items-center hover:text-[#0056b3]">Tümü <span className="ml-1 text-[16px] text-gray-500 leading-none">→</span></button>
               </div>
            </div>
            <div className="p-5 flex-1">
              {examEvents.length === 0 ? (
                <p className="text-[13px] text-[#6c757d]">Yaklaşan sınav aktiviteniz yoktur.</p>
              ) : (
                 examEvents.slice(0, 4).map(event => (
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

                 <button onClick={() => navigate("/calendar")} className="text-[12px] text-[#212529] font-medium flex items-center hover:text-[#0056b3]">Tümü <span className="ml-1 text-[16px] text-gray-500 leading-none">→</span></button>
               </div>
            </div>
            <div className="p-5 flex-1">
              {assignEvents.length === 0 ? (
                <p className="text-[13px] text-[#6c757d]">Yaklaşan ödev aktiviteniz yoktur.</p>
              ) : (
                 assignEvents.slice(0, 4).map(event => (
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
