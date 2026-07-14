import { useEffect, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
export default function Forum() {
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

    
  // Moodle'dan API ile forum verilerini çekmek istersek diye boş fonksiyon bırakıldı
  const fetchForumData = useCallback(async () => {
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
        
      }
    } catch (error) {
      console.error("Forum verileri alınamadı:", error);
    } finally {
      setLoading(false);
    }
  }, [navigate]);

  useEffect(() => {
    fetchForumData();
  }, [fetchForumData]);

  
  return (
    <div className="min-h-screen bg-[#fcfcfc] font-sans text-[#495057] antialiased flex flex-col">

      {/* Ana İçerik */}
      <main className="max-w-[1200px] w-full mx-auto px-4 py-8 flex-1">
        <div className="mb-6">
          <h2 className="text-[22px] font-medium text-[#212529]">Forum</h2>
        </div>

        <div className="bg-white border border-[#e9ecef] rounded-[10px] p-12 text-center text-gray-500 font-medium shadow-sm flex flex-col items-center">
            <div className="w-[180px] h-[180px] bg-[#f1f3f5] rounded-full flex items-center justify-center mb-6 relative">
              <svg className="w-24 h-24 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1" d="M17 8h2a2 2 0 012 2v6a2 2 0 01-2 2h-2v4l-4-4H9a1.994 1.994 0 01-1.414-.586m0 0L11 14h4a2 2 0 002-2V6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2v4l.586-.586z"></path></svg>
            </div>
            <p className="text-[15px] font-semibold text-[#212529]">
              Henüz bir forum tartışması bulunmuyor.
            </p>
        </div>
      </main>
    </div>
  );
}
