import { useEffect, useState, useCallback, useMemo } from "react";
import { moodlePost } from "./moodleApi";
import { useNavigate } from "react-router-dom";

export default function TeacherDashboard() {
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  const [courses, setCourses] = useState([]);
  const [timelineEvents, setTimelineEvents] = useState([]);
  const [announcements, setAnnouncements] = useState([]);
  const [conversations, setConversations] = useState([]);
  
  const fetchDashboardData = useCallback(async () => {
    const token = localStorage.getItem("moodle_token");

    if (!token) {
      navigate("/");
      return;
    }

    try {
      const userData = await moodlePost(token, "core_webservice_get_site_info");

      if (userData && userData.userid) {
        const [
          coursesResponse,
          timelineResponse,
          announcementsResponse,
          messagesResponse
        ] = await Promise.all([
          moodlePost(token, "core_enrol_get_users_courses", { userid: userData.userid }).catch(e => { console.error("courses error", e); return null; }),
          moodlePost(token, "core_calendar_get_action_events_by_timesort").catch(e => { console.error("timeline error", e); return null; }),
          moodlePost(token, "mod_forum_get_forum_discussions", { forumid: "2" }).catch(e => { console.error("forum error", e); return null; }),
          moodlePost(token, "core_message_get_conversations", { userid: userData.userid }).catch(e => { console.error("messages error", e); return null; })
        ]);

        const safeParse = async (res) => {
          return res ? res : null;
        };

        const coursesData = await safeParse(coursesResponse);
        const timelineData = await safeParse(timelineResponse);
        const announcementsData = await safeParse(announcementsResponse);
        const messagesData = await safeParse(messagesResponse);

          if (coursesData && Array.isArray(coursesData)) {
            setCourses(coursesData);
          }
        if (timelineData && Array.isArray(timelineData.events)) {
          setTimelineEvents(timelineData.events);
        }
        if (announcementsData && Array.isArray(announcementsData.discussions)) {
          setAnnouncements(announcementsData.discussions);
        }
        if (messagesData && Array.isArray(messagesData.conversations)) {
          setConversations(messagesData.conversations);
        }
      }
    } catch (error) {
      console.error("Moodle API Eğitmen Paneli Veri Hatası:", error);
    } finally {
      setLoading(false);
    }
  }, [navigate]);

  useEffect(() => {
     
    fetchDashboardData();
  }, [fetchDashboardData]);

  const [currentUnixTime] = useState(() => Math.floor(Date.now() / 1000));

  const activeCourses = useMemo(() => {
    return courses.filter(
      (c) => !c.enddate || c.enddate === 0 || c.enddate > currentUnixTime,
    );
  }, [courses, currentUnixTime]);

  const extractCourseCode = (fullname) => {
    const match = fullname.match(/\(([^|]+)\|([^)]+)\)/);
    if (match) {
        return `${match[1]}|${match[2]}`;
    }
    return "";
  };
  
  const extractCourseNameOnly = (fullname) => {
      const match = fullname.match(/^(.*?)\s*\(/);
      if (match) {
          return match[1].trim();
      }
      return fullname;
  };

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

  const unreadMessagesCount = conversations.reduce(
    (total, conv) => total + (conv.unreadcount || 0),
    0,
  );

  return (
    <div className="min-h-screen bg-[#fcfcfc] font-sans text-[#495057] antialiased flex flex-col">
      
      <main className="w-full flex-1" style={{ padding: "1.25em 8%" }}>
        <div className="flex flex-col lg:flex-row gap-6">
          <div className="flex-1 lg:w-2/3">
            {/* Derslerim Header */}
            <div className="flex justify-between student-course-header" style={{ padding: "2px 0px", marginBottom: "-7px", marginTop: "10px" }}>
              <div>
                <span className="text-[22px] font-medium text-[#212529]">Derslerim</span>
              </div>
              <div className="align-self-center flex items-center">
                <span className="text-[14px] font-medium text-[#495057] mr-1">Toplam Ders</span>
                <span className="bg-[#f8f9fa] border border-[#f8f9fa] text-[#212529] px-2 py-0.5 rounded-full text-[12px] font-semibold mx-1">
                  {loading ? "..." : activeCourses.length}
                </span>
                <button onClick={() => navigate("/teacher-courses")} className="text-[13px] font-semibold text-[#006cb5] bg-[#e9ecef] px-3 py-1.5 rounded-[4px] hover:bg-[#dde2e6] transition-colors ml-2 flex items-center">
                  Tümü <svg className="w-4 h-4 ml-1 text-[#646462]" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7"></path></svg>
                </button>
              </div>
            </div>

            {/* Course Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4" style={{ marginTop: "15px" }}>
              {loading ? (
                <div className="col-span-full text-center py-10 text-gray-500">Yükleniyor...</div>
              ) : activeCourses.map((course) => {
                const courseNameOnly = extractCourseNameOnly(course.fullname);
                const courseCode = extractCourseCode(course.fullname) || course.shortname;
                const progress = course.progress || 0;
                
                return (
                  <div key={course.id} onClick={() => navigate(`/teacher-course/${course.id}`)} className="bg-white border border-[#e9ecef] rounded-[10px] p-4 shadow-sm hover:shadow-md transition-shadow cursor-pointer relative flex flex-col justify-between h-[150px]">
                    
                    <div className="flex justify-between items-start">
                      <div className="flex flex-col gap-1 w-[80%]">
                        <span className="bg-[#e9ecef] text-[#6c757d] text-[10px] font-bold px-2 py-0.5 rounded-[4px] self-start mb-1">
                          20252026BAHAR
                        </span>
                        <h3 className="text-[13px] font-bold text-[#003d66] leading-tight line-clamp-2">
                          {courseNameOnly} ({courseCode})
                        </h3>
                      </div>
                      
                      {/* Progress Circle */}
                      <div className="relative w-8 h-8 rounded-full border-[3px] border-[#28a745] flex items-center justify-center shrink-0">
                        <span className="text-[10px] font-bold text-[#212529]"><small className="font-normal">%</small>{progress}</span>
                      </div>
                    </div>
                    
                    <div className="flex justify-between items-center mt-3">
                      <div className="w-[30px] h-[30px] bg-[#52496d] rounded-full flex items-center justify-center text-white text-[11px] font-bold">
                        AE
                      </div>
                      <div className="flex gap-2 text-gray-400">
                        <svg className="w-[18px] h-[18px]" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"></path></svg>
                        <svg className="w-[18px] h-[18px] opacity-30" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Bottom Widgets Row */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-4 mt-[46px]">
              
              {/* Duyurular */}
              <div className="bg-white border border-[#e9ecef] rounded-[10px] shadow-sm">
                <div className="flex justify-between items-center px-4 py-3 border-b border-[#e9ecef]">
                  <span className="text-[14px] font-medium text-[#212529]">
                    Duyurular
                    <span className="bg-[#f8f9fa] border border-[#f8f9fa] text-[#212529] px-2 py-0.5 rounded-full text-[12px] font-semibold ml-2">{announcements.length}</span>
                  </span>
                  <div className="flex items-center gap-2">
                    <svg className="w-5 h-5 text-[#212529] cursor-pointer" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"></path><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"></path></svg>
                    <button onClick={() => navigate("/announcements")} className="text-[13px] font-semibold text-[#006cb5] bg-[#e9ecef] px-2.5 py-1 rounded-[4px] hover:bg-[#dde2e6] transition-colors flex items-center">
                      Tümü <svg className="w-3.5 h-3.5 ml-1 text-[#646462]" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7"></path></svg>
                    </button>
                  </div>
                </div>
                <div className="p-4 min-h-[120px] text-[14px] text-[#212529]">
                  {announcements.length === 0 ? (
                    <p className="text-[13px] text-[#6c757d]">Herhangi bir duyuru bulunamadı.</p>
                  ) : (
                    announcements.map((item) => (
                      <div key={item.id} className="mb-4 pb-4 border-b border-[#f8f9fa] last:border-0 last:pb-0 last:mb-0">
                        <h4 className="text-[12px] font-bold text-[#212529] mb-1.5 leading-tight uppercase">📍 {item.name}</h4>
                        <p className="text-[12px] text-[#6c757d] leading-snug line-clamp-3">{stripHtmlTags(item.message)}</p>
                        <div className="text-[11px] text-[#adb5bd] mt-2 font-medium">{formatMoodleDate(item.timemodified)}</div>
                      </div>
                    ))
                  )}
                </div>
              </div>

              {/* Mesajlarım */}
              <div className="bg-white border border-[#e9ecef] rounded-[10px] shadow-sm">
                <div className="flex justify-between items-center px-4 py-3 border-b border-[#e9ecef]">
                  <span className="text-[14px] font-medium text-[#212529]">
                    Mesajlarım
                    <span className="bg-[#f8f9fa] border border-[#f8f9fa] text-[#212529] px-2 py-0.5 rounded-full text-[12px] font-semibold ml-2">{unreadMessagesCount}</span>
                  </span>
                  <div className="flex items-center gap-2">
                    <svg className="w-5 h-5 text-[#212529] cursor-pointer" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"></path><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"></path></svg>
                    <button onClick={() => navigate("/messages")} className="text-[13px] font-semibold text-[#006cb5] bg-[#e9ecef] px-2.5 py-1 rounded-[4px] hover:bg-[#dde2e6] transition-colors flex items-center">
                      Tümü <svg className="w-3.5 h-3.5 ml-1 text-[#646462]" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7"></path></svg>
                    </button>
                  </div>
                </div>
                <div className="p-4">
                  {conversations.length === 0 ? (
                    <p className="text-[13px] text-[#6c757d]">Herhangi bir mesajınız bulunamadı.</p>
                  ) : (
                    conversations.slice(0, 3).map((conv) => (
                      <div key={conv.id} className="flex gap-3 mb-4 cursor-pointer border-b border-[#f8f9fa] pb-3 last:border-0 last:pb-0 last:mb-0">
                        <div className="w-8 h-8 rounded-full bg-[#006cb5] flex items-center justify-center font-bold text-white shrink-0 text-[12px]">
                          {conv.members?.[0]?.fullname?.slice(0, 1) || "U"}
                        </div>
                        <div className="flex-1 overflow-hidden">
                          <h5 className="text-[14px] font-medium text-[#212529] mb-1 truncate">{conv.members?.[0]?.fullname}</h5>
                          <p className="text-[13px] text-[#495057] leading-tight line-clamp-2">{stripHtmlTags(conv.messages?.[0]?.text)}</p>
                          <span className="text-[11px] text-[#6c757d] italic mt-1 block">{formatMoodleDate(conv.messages?.[0]?.timecreated)}</span>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>

              {/* Forumlar */}
              <div className="bg-white border border-[#e9ecef] rounded-[10px] shadow-sm">
                <div className="flex justify-between items-center px-4 py-3 border-b border-[#e9ecef]">
                  <span className="text-[14px] font-medium text-[#212529]">
                    Forumlar
                    <span className="bg-[#f8f9fa] border border-[#f8f9fa] text-[#212529] px-2 py-0.5 rounded-full text-[12px] font-semibold ml-2">0</span>
                  </span>
                  <div className="flex items-center gap-2">
                    <svg className="w-5 h-5 text-[#212529] cursor-pointer" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"></path><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"></path></svg>
                    <button onClick={() => navigate("/forum")} className="text-[13px] font-semibold text-[#006cb5] bg-[#e9ecef] px-2.5 py-1 rounded-[4px] hover:bg-[#dde2e6] transition-colors flex items-center">
                      Tümü <svg className="w-3.5 h-3.5 ml-1 text-[#646462]" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7"></path></svg>
                    </button>
                  </div>
                </div>
                <div className="p-4 min-h-[120px] text-[14px] text-[#212529]">
                  Herhangi bir forum bulunmadı.
                </div>
              </div>

              {/* Sanal Sınıf */}
              <div className="bg-white border border-[#e9ecef] rounded-[10px] shadow-sm">
                <div className="flex justify-between items-center px-4 py-3 border-b border-[#e9ecef]">
                  <span className="text-[14px] font-medium text-[#212529]">
                    Sanal Sınıf
                    <span className="bg-[#f8f9fa] border border-[#f8f9fa] text-[#212529] px-2 py-0.5 rounded-full text-[12px] font-semibold ml-2">0</span>
                  </span>
                  <div className="flex items-center gap-2">
                    <svg className="w-5 h-5 text-[#212529] cursor-pointer" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"></path><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"></path></svg>
                    <button onClick={() => navigate("/teacher-calendar")} className="text-[13px] font-semibold text-[#006cb5] bg-[#e9ecef] px-2.5 py-1 rounded-[4px] hover:bg-[#dde2e6] transition-colors flex items-center">
                      Tümü <svg className="w-3.5 h-3.5 ml-1 text-[#646462]" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7"></path></svg>
                    </button>
                  </div>
                </div>
                <div className="p-4 min-h-[120px] text-[14px] text-[#212529]">
                  Yaklaşan sanal sınıf aktiviteniz yoktur.
                </div>
              </div>
            </div>

          </div>

          <div className="w-full lg:w-1/3">
            <div className="bg-white border border-[#e9ecef] rounded-[10px] shadow-sm" style={{ marginTop: "10px" }}>
              <div className="flex justify-between items-center px-4 py-3 border-b border-[#e9ecef]">
                <span className="text-[14px] font-medium text-[#212529]">
                  Zaman Çizelgesi
                </span>
                <button 
                  onClick={() => navigate("/teacher-calendar")} 
                  className="text-[13px] font-semibold text-[#006cb5] bg-[#e9ecef] px-2.5 py-1 rounded-[4px] hover:bg-[#dde2e6] transition-colors flex items-center"
                >
                  Tümü <svg className="w-3.5 h-3.5 ml-1 text-[#646462]" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7"></path></svg>
                </button>
              </div>
              <div className="p-4" style={{ minHeight: "300px" }}>
                <h4 className="text-[15px] font-bold text-[#e03a3c] border-b-2 border-[#e03a3c] inline-block pb-1 mb-4">Yaklaşan Etkinlikler</h4>
                {loading ? (
                  <div className="text-[12px] text-gray-500">Yükleniyor...</div>
                ) : timelineEvents.length === 0 ? (
                  <div className="text-[12px] text-gray-500">Yaklaşan etkinlik bulunmamaktadır.</div>
                ) : (
                  <ul className="list-none p-0 m-0 border-l-[3px] border-[#e03a3c] pl-4 space-y-4">
                    {timelineEvents.slice(0, 5).map((event) => (
                      <li key={event.id} className="relative">
                        <div className="absolute w-2 h-2 bg-[#e03a3c] rounded-full -left-[21px] top-1"></div>
                        <span className="text-[#a0a5aa] text-[11px] block">{formatMoodleDate(event.timesort)}</span>
                        <label className="text-[13px] text-[#212529] block mb-0 leading-tight">
                          <b className="font-bold">{event.name}</b>
                        </label>
                        <p className="text-[12px] text-[#6c757d] mb-1">{event.course?.fullname}</p>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}