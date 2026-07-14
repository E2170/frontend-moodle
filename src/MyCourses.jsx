import { useEffect, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
export default function MyCourses() {
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
    fetchCoursesData();
  }, [fetchCoursesData]);

  
  const filteredCourses = courses.filter((c) =>
    c.fullname.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-[#fcfcfc] font-sans text-[#495057] antialiased flex flex-col">

      {/* Ana İçerik */}
      <main className="max-w-[1200px] w-full mx-auto px-4 py-6 flex-1">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-[24px] font-medium text-[#212529]">Derslerim</h2>
          <button className="bg-[#1e88e5] hover:bg-[#1565c0] text-white px-4 py-2 rounded text-[14px] font-medium transition-colors flex items-center gap-2">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z"></path></svg>
            Filtrele
          </button>
        </div>

        {/* Filtre Alanı */}
        <div className="bg-white border border-[#e9ecef] rounded p-4 mb-8 shadow-sm flex gap-4 items-end flex-wrap">
          <div className="flex-1 min-w-[200px]">
            <label className="block text-[13px] font-medium text-[#495057] mb-1">Ders İsmi <span className="text-red-500">*</span></label>
            <input 
              type="text" 
              placeholder="Ders İsmi" 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full border border-[#ced4da] rounded px-3 py-2 text-[14px] focus:outline-none focus:border-[#1e88e5] transition-colors"
            />
          </div>
          <div className="flex-1 min-w-[200px]">
            <label className="block text-[13px] font-medium text-[#495057] mb-1">Dönem</label>
            <select className="w-full border border-[#ced4da] rounded px-3 py-2 text-[14px] focus:outline-none focus:border-[#1e88e5] text-[#495057] bg-white appearance-none">
              <option value="">Dönem</option>
            </select>
          </div>
          <div className="flex-1 min-w-[200px]">
            <label className="block text-[13px] font-medium text-[#495057] mb-1">Ders Durumu</label>
            <select className="w-full border border-[#ced4da] rounded px-3 py-2 text-[14px] focus:outline-none focus:border-[#1e88e5] text-[#495057] bg-white appearance-none">
              <option value="">Ders Durumu</option>
            </select>
          </div>
          <div className="mt-4 w-full flex justify-end">
             <button className="bg-[#1e88e5] hover:bg-[#1565c0] text-white px-5 py-2 rounded text-[14px] font-medium transition-colors flex items-center gap-2">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path></svg>
                Ara
              </button>
          </div>
        </div>

        <h3 className="text-[16px] font-medium text-[#212529] mb-4">Dersler</h3>

        {loading ? (
          <div className="text-center py-10 text-gray-500">Yükleniyor...</div>
        ) : filteredCourses.length === 0 ? (
          <div className="text-center py-10 text-gray-500 bg-white border border-[#e9ecef] rounded">Bulunamadı.</div>
        ) : (
          <div className="flex flex-col gap-3">
            {filteredCourses.map(course => (
              <div 
                key={course.id} 
                onClick={() => navigate(`/course/${course.id}`)}
                className="bg-white border border-l-4 border-l-[#1e88e5] border-[#e9ecef] rounded p-4 flex flex-col md:flex-row gap-4 items-center shadow-sm hover:shadow-md transition-shadow cursor-pointer"
              >
                <div className="w-16 h-16 bg-[#f1f3f5] rounded flex items-center justify-center shrink-0">
                  <svg className="w-8 h-8 text-[#adb5bd]" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"></path></svg>
                </div>
                
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1 flex-wrap">
                    <span className="text-[12px] text-[#868e96] font-medium">{course.categoryname}</span>
                    <span className="bg-[#e9ecef] text-[#495057] text-[11px] px-2 py-0.5 rounded font-medium">{course.term}</span>
                  </div>
                  <h4 className="text-[15px] font-semibold text-[#212529] uppercase mb-1 cursor-pointer hover:text-[#1e88e5]">{course.fullname}</h4>
                  <div className="text-[13px] text-[#495057] uppercase">{course.teacher}</div>
                </div>

                <div className="flex items-center gap-4">
                  <button className="text-[#adb5bd] hover:text-[#f59f00] transition-colors"><svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11.049 2.927c.3-.921 1.603-.921 1.898 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"></path></svg></button>
                  <button className="text-[#adb5bd] hover:text-[#e03131] transition-colors"><svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"></path></svg></button>
                  <button className="text-[#adb5bd] hover:text-[#1e88e5] transition-colors"><svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg></button>
                  <button className="text-[#adb5bd] hover:text-[#1e88e5] transition-colors"><svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 8h2a2 2 0 012 2v6a2 2 0 01-2 2h-2v4l-4-4H9a1.994 1.994 0 01-1.414-.586m0 0L11 14h4a2 2 0 002-2V6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2v4l.586-.586z"></path></svg></button>
                  
                  {/* Dairesel İlerleme Çubuğu */}
                  <div className="relative w-12 h-12 flex items-center justify-center">
                    <svg className="w-12 h-12 transform -rotate-90">
                      <circle cx="24" cy="24" r="20" stroke="#e9ecef" strokeWidth="4" fill="none" />
                      <circle cx="24" cy="24" r="20" stroke="#40c057" strokeWidth="4" fill="none" strokeDasharray="125.6" strokeDashoffset={125.6 - (125.6 * course.progress) / 100} />
                    </svg>
                    <span className="absolute text-[11px] font-bold text-[#495057]">% {course.progress}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
