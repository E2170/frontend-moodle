import { useEffect, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";

export default function TeacherCourses() {
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  const [courses, setCourses] = useState([]);
  
  // Filtre durumları
  const [searchTerm, setSearchTerm] = useState("");

  const fetchCoursesData = useCallback(async () => {
    const token = localStorage.getItem("moodle_token");
    if (!token) {
      navigate("/");
      return;
    }

    try {
      // Kullanıcı bilgilerini al
      const userResponse = await fetch(
        `/api/webservice/rest/server.php`, { method: "POST", headers: { "Content-Type": "application/x-www-form-urlencoded" }, body: `wstoken=${token}&wsfunction=core_webservice_get_site_info&moodlewsrestformat=json` },
      );
      const userData = await userResponse.json();

      if (userData && userData.userid) {
        // Kullanıcının kayıtlı olduğu dersleri al
        const coursesResponse = await fetch(
          `/api/webservice/rest/server.php`, { method: "POST", headers: { "Content-Type": "application/x-www-form-urlencoded" }, body: `wstoken=${token}&wsfunction=core_enrol_get_users_courses&userid=${userData.userid}&moodlewsrestformat=json` },
        );
        const coursesData = await coursesResponse.json();

        if (Array.isArray(coursesData)) {
          setCourses(coursesData);
        }
      }
    } catch (error) {
      console.error("Ders verileri alınamadı:", error);
    } finally {
      setLoading(false);
    }
  }, [navigate]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchCoursesData();
  }, [fetchCoursesData]);

  const filteredCourses = courses.filter((c) =>
    c.fullname.toLowerCase().includes(searchTerm.toLowerCase())
  );

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
          <h2 className="text-[24px] font-medium text-[#212529]">Derslerim</h2>
          <button className="bg-[#002f4b] hover:bg-[#001f33] text-white px-4 py-2 rounded text-[14px] font-medium transition-colors flex items-center gap-2 shadow-sm">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z"></path></svg>
            Filtrele
          </button>
        </div>

        {/* Filtre Alanı */}
        <div className="bg-white border border-[#e9ecef] rounded p-5 mb-8 shadow-sm flex gap-6 items-end flex-wrap mt-6">
          <div className="flex-1 min-w-[200px]">
            <label className="block text-[13px] font-medium text-[#495057] mb-2">Ders İsmi <span className="text-red-500">*</span></label>
            <input 
              type="text" 
              placeholder="Ders İsmi" 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full border border-[#ced4da] rounded-[4px] px-3 py-2 text-[14px] focus:outline-none focus:border-[#80bdff] focus:ring-1 focus:ring-[#80bdff] transition-shadow h-[38px]"
            />
          </div>
          <div className="flex-1 min-w-[200px]">
            <label className="block text-[13px] font-medium text-[#495057] mb-2">Dönem</label>
            <select className="w-full border border-[#ced4da] rounded-[4px] px-3 py-2 text-[14px] focus:outline-none focus:border-[#80bdff] focus:ring-1 focus:ring-[#80bdff] text-[#495057] bg-white h-[38px]">
              <option value="">Dönem</option>
            </select>
          </div>
          <div className="flex-1 min-w-[200px]">
            <label className="block text-[13px] font-medium text-[#495057] mb-2">Ders Durumu</label>
            <select className="w-full border border-[#ced4da] rounded-[4px] px-3 py-2 text-[14px] focus:outline-none focus:border-[#80bdff] focus:ring-1 focus:ring-[#80bdff] text-[#495057] bg-white h-[38px]">
              <option value="">Ders Durumu</option>
            </select>
          </div>
          <div className="w-[100px] flex justify-end">
             <button className="bg-[#002f4b] hover:bg-[#001f33] text-white px-5 py-2 rounded-[4px] text-[14px] font-medium transition-colors flex items-center justify-center gap-2 h-[38px] w-full shadow-sm">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path></svg>
                Ara
              </button>
          </div>
        </div>

        <h3 className="text-[16px] font-medium text-[#212529] mb-4 mt-8">Pasif Dersler</h3>

        {loading ? (
          <div className="text-center py-10 text-gray-500">Yükleniyor...</div>
        ) : filteredCourses.length === 0 ? (
          <div className="text-center py-10 text-gray-500 bg-white border border-[#e9ecef] rounded">Bulunamadı.</div>
        ) : (
          <div className="flex flex-col gap-[10px]">
            {filteredCourses.map(course => {
               const courseNameOnly = extractCourseNameOnly(course.fullname);
               const courseCode = extractCourseCode(course.fullname) || course.shortname;
               
               return (
                  <div key={course.id} onClick={() => navigate(`/teacher-course/${course.id}`)} className="bg-transparent border-b border-[#e9ecef] py-4 flex flex-col md:flex-row gap-4 items-center hover:bg-[#f8f9fa] transition-colors cursor-pointer px-4">
                     <div className="w-12 h-12 rounded-full bg-[#e9ecef] flex items-center justify-center text-[12px] font-bold text-[#495057] border border-[#dee2e6] shrink-0">
                        C&gt;O
                     </div>
                     
                     <div className="flex-1">
                     <div className="flex items-center gap-2 mb-0.5 flex-wrap">
                        <span className="text-[12px] text-[#ced4da] font-light">{course.categoryname}</span>
                        <span className="bg-[#e2e3e5] text-[#383d41] text-[10px] px-2 py-0.5 rounded-[4px] font-bold tracking-wide">{course.term}</span>
                     </div>
                     <h4 className="text-[15px] font-semibold text-[#212529] uppercase mb-0.5 leading-tight">{courseNameOnly} ({courseCode})</h4>
                     <div className="text-[13px] text-[#adb5bd] uppercase font-medium">{course.teacher}</div>
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
