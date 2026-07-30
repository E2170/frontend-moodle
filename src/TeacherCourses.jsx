import { useLanguage } from "./LanguageContext";
import { useEffect, useState, useCallback } from "react";
import { moodlePost, extractCourseImage } from "./moodleApi";
import { useNavigate } from "react-router-dom";

export default function TeacherCourses() {
  const { t } = useLanguage();
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  const [courses, setCourses] = useState([]);
  
  // Filtre durumları
  const [searchTerm, setSearchTerm] = useState("");
  const [termFilter, setTermFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");

  const fetchCoursesData = useCallback(async () => {
    const token = localStorage.getItem("moodle_token");
    if (!token) {
      navigate("/");
      return;
    }

    try {
      // Kullanıcı bilgilerini al
      const userData = await moodlePost(token, "core_webservice_get_site_info");

      if (userData && userData.userid) {
        // Kullanıcının kayıtlı olduğu dersleri al
        const coursesData = await moodlePost(token, "core_enrol_get_users_courses", { userid: userData.userid });

        if (Array.isArray(coursesData)) {
          const enrichedCourses = coursesData.map((course) => {
            course.calculatedProgress = course.progress || 0;
            course.courseimage = extractCourseImage(course, token);
            return course;
          });
          setCourses(enrichedCourses);
        }
      }
    } catch (error) {
      console.error("Ders verileri alınamadı:", error);
    } finally {
      setLoading(false);
    }
  }, [navigate]);

  useEffect(() => {
     
    fetchCoursesData();
  }, [fetchCoursesData]);

  const extractCourseTerm = (course) => {
    const match = course.fullname.match(/\([^|]+\|([^)]+)\)/);
    if (match && match[1]) {
        return match[1].trim();
    }
    if (course.startdate) {
        return new Date(course.startdate * 1000).getFullYear().toString();
    }
    return "Bilinmiyor";
  };

  const getCourseStatus = (course) => {
    const now = Date.now() / 1000;
    if (course.enddate === 0 || course.enddate > now) {
        return "Aktif";
    }
    return "Pasif";
  };

  const availableTerms = Array.from(new Set(courses.map(c => extractCourseTerm(c)))).sort().reverse();

  const filteredCourses = courses.filter((c) => {
    const matchName = c.fullname.toLowerCase().includes(searchTerm.toLowerCase());
    const matchTerm = termFilter === "" || extractCourseTerm(c) === termFilter;
    const matchStatus = statusFilter === "" || getCourseStatus(c) === statusFilter;
    return matchName && matchTerm && matchStatus;
  });

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

  return (
    <div className="min-h-screen bg-[#fcfcfc] font-sans text-[#495057] antialiased flex flex-col">

      {/* Ana İçerik */}
      <main className="max-w-[1200px] w-full mx-auto px-4 py-6 flex-1 mt-4">
        <div className="flex justify-between items-center mb-4 border-b border-[#e9ecef] pb-3">
          <h2 className="text-[24px] font-medium text-[#212529]">{t.myCourses}</h2>
        </div>

        {/* Filtre Alanı */}
        <div className="bg-white border border-[#e9ecef] rounded p-5 mb-8 shadow-sm flex gap-6 items-end flex-wrap mt-6">
          <div className="flex-1 min-w-[200px]">
            <label className="block text-[13px] font-medium text-[#495057] mb-2">Ders İsmi <span className="text-red-500">*</span></label>
            <input 
              type="text" 
              placeholder={t.courseNameLabel} 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full border border-[#ced4da] rounded-[4px] px-3 py-2 text-[14px] focus:outline-none focus:border-[#80bdff] focus:ring-1 focus:ring-[#80bdff] transition-shadow h-[38px]"
            />
          </div>
          <div className="flex-1 min-w-[200px]">
            <label className="block text-[13px] font-medium text-[#495057] mb-2">{t.term}</label>
            <select 
              value={termFilter}
              onChange={(e) => setTermFilter(e.target.value)}
              className="w-full border border-[#ced4da] rounded-[4px] px-3 py-2 text-[14px] focus:outline-none focus:border-[#80bdff] focus:ring-1 focus:ring-[#80bdff] text-[#495057] bg-white h-[38px]"
            >
              <option value="">Tümü</option>
              {availableTerms.map(term => (
                <option key={term} value={term}>{term}</option>
              ))}
            </select>
          </div>
          <div className="flex-1 min-w-[200px]">
            <label className="block text-[13px] font-medium text-[#495057] mb-2">{t.courseStatus}</label>
            <select 
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full border border-[#ced4da] rounded-[4px] px-3 py-2 text-[14px] focus:outline-none focus:border-[#80bdff] focus:ring-1 focus:ring-[#80bdff] text-[#495057] bg-white h-[38px]"
            >
              <option value="">Tümü</option>
              <option value="Aktif">{t.active}</option>
              <option value="Pasif">{t.passive}</option>
            </select>
          </div>
        </div>

        <h3 className="text-[16px] font-medium text-[#212529] mb-4 mt-8">{t.coursesList}</h3>

        {loading ? (
          <div className="text-center py-10 text-gray-500">{t.loadingData}</div>
        ) : filteredCourses.length === 0 ? (
          <div className="text-center py-10 text-gray-500 bg-white border border-[#e9ecef] rounded">{t.notFound}</div>
        ) : (
          <div className="flex flex-col gap-[10px]">
            {filteredCourses.map(course => {
               const courseNameOnly = extractCourseNameOnly(course.fullname);
               const courseCode = extractCourseCode(course.fullname) || course.shortname;
               
               return (
                  <div key={course.id} onClick={() => navigate(`/teacher-course/${course.id}`)} className="bg-white border border-l-4 border-l-[#1e88e5] border-[#e9ecef] rounded p-4 flex flex-col md:flex-row gap-4 items-center shadow-sm hover:shadow-md transition-shadow cursor-pointer">
                     <div className="w-16 h-16 bg-[#f1f3f5] rounded overflow-hidden flex items-center justify-center shrink-0">
                        {course.courseimage ? (
                          <img src={course.courseimage} alt={course.shortname} className="w-full h-full object-cover" />
                        ) : (
                          <svg className="w-8 h-8 text-[#adb5bd]" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"></path></svg>
                        )}
                     </div>
                     
                     <div className="flex-1">
                     <div className="flex items-center gap-2 mb-1 flex-wrap">
                        <span className="text-[12px] text-[#868e96] font-medium">{course.categoryname}</span>
                        <span className="bg-[#e9ecef] text-[#495057] text-[11px] px-2 py-0.5 rounded font-medium">{course.term}</span>
                     </div>
                     <h4 className="text-[15px] font-semibold text-[#212529] uppercase mb-1 cursor-pointer hover:text-[#1e88e5]">{courseNameOnly} ({courseCode})</h4>
                     <div className="text-[13px] text-[#495057] uppercase">{course.teacher}</div>
                     </div>

                     <div className="flex items-center gap-4 text-[#ced4da]">
                        <div className="flex flex-col items-center">
                           <span className="text-[12px] font-bold text-[#6c757d]">1</span>
                           <svg className="w-[18px] h-[18px] mt-1 hover:text-[#0056b3] transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path></svg>
                        </div>
                        <button className="hover:text-[#ffc107] transition-colors"><svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11.049 2.927c.3-.921 1.603-.921 1.898 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"></path></svg></button>
                        <button className="hover:text-[#dc3545] transition-colors"><svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"></path></svg></button>
                        <button className="hover:text-[#0056b3] transition-colors"><svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg></button>
                        <button className="hover:text-[#0056b3] transition-colors"><svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"></path></svg></button>
                        
                        <div className="relative w-[34px] h-[34px] flex items-center justify-center rounded-full border-[3px] border-[#28a745] ml-2">
                           <span className="text-[10px] font-bold text-[#212529]"><small className="font-normal">%</small>{course.progress}</span>
                        </div>
                     </div>
                  </div>
               )
            })}
          </div>
        )}
      </main>
    </div>
  );
}
