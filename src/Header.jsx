import { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import akuzemLogo from "./assets/akuzem-lg.png";

export default function Header() {
  const navigate = useNavigate();
  const location = useLocation();

  const [userInfo, setUserInfo] = useState({
    fullname: "Yükleniyor...",
    userpictureurl: "",
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem("moodle_token");
    if (!token) return;

    fetch(`/api/webservice/rest/server.php`, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: `wstoken=${token}&wsfunction=core_webservice_get_site_info&moodlewsrestformat=json`
    })
      .then(res => res.json())
      .then(data => {
        if (data && data.userid) {
          setUserInfo(data);
        }
      })
      .catch(err => console.error(err))
      .finally(() => setLoading(false));
  }, []);

  const handleLogout = () => {
    localStorage.removeItem("moodle_token");
    navigate("/");
  };

  const [activeDropdown, setActiveDropdown] = useState(null);

  const isActive = (path) => {
    return location.pathname.startsWith(path);
  };

  useEffect(() => {
    const handleClickOutside = () => setActiveDropdown(null);
    document.addEventListener("click", handleClickOutside);
    return () => document.removeEventListener("click", handleClickOutside);
  }, []);

  const toggleDropdown = (dropdownName, e) => {
    e.stopPropagation();
    setActiveDropdown(prev => prev === dropdownName ? null : dropdownName);
  };

  const userRole = localStorage.getItem("user_role") || "student";

  return (
    <nav className="bg-[#19233e] text-white flex items-center justify-between px-4 h-[66px] shadow-sm relative z-50 shrink-0">
      <div className="flex items-center gap-8 h-full">
        <div className="flex items-center gap-5 h-full">
          <img
            onClick={() => navigate(userRole === "teacher" ? "/teacher-dashboard" : "/dashboard")}
            src={akuzemLogo}
            alt="AKUZEM"
            className="h-[50px] w-auto cursor-pointer p-0.5 object-contain"
          />
        </div>
        <div className="hidden lg:flex gap-6 text-[15px] font-medium h-full items-center">
          {userRole === "teacher" ? (
            <>
              <button onClick={() => navigate("/teacher-dashboard")} className={`h-full flex items-center px-4 font-semibold transition-colors ${isActive("/teacher-dashboard") ? "bg-[#2d3246] text-white" : "text-[#9ca3af] hover:text-white"}`}>
                Anasayfa
              </button>
              <button onClick={() => navigate("/teacher-courses")} className={`h-full flex items-center px-4 font-semibold transition-colors ${isActive("/teacher-courses") || isActive("/teacher-course") ? "bg-[#2d3246] text-white" : "text-[#9ca3af] hover:text-white"}`}>
                Derslerim
              </button>
              <button onClick={() => navigate("/teacher-reports")} className={`h-full flex items-center px-4 font-semibold transition-colors ${isActive("/teacher-reports") ? "bg-[#2d3246] text-white" : "text-[#9ca3af] hover:text-white"}`}>
                Raporlar
              </button>
              <button onClick={() => navigate("/teacher-files")} className={`h-full flex items-center px-4 font-semibold transition-colors ${isActive("/teacher-files") ? "bg-[#2d3246] text-white" : "text-[#9ca3af] hover:text-white"}`}>
                Dosyalarım
              </button>
              <button onClick={() => navigate("/teacher-calendar")} className={`h-full flex items-center px-4 font-semibold transition-colors ${isActive("/teacher-calendar") ? "bg-[#2d3246] text-white" : "text-[#9ca3af] hover:text-white"}`}>
                Takvim
              </button>
              <button onClick={() => navigate("/teacher-question-bank")} className={`h-full flex items-center px-4 font-semibold transition-colors ${isActive("/teacher-question-bank") ? "bg-[#2d3246] text-white" : "text-[#9ca3af] hover:text-white"}`}>
                Soru Bankası
              </button>
            </>
          ) : (
            <>
              <button onClick={() => navigate("/dashboard")} className={`h-full flex items-center px-4 font-semibold transition-colors ${isActive("/dashboard") ? "bg-[#2d3246] text-white" : "text-[#9ca3af] hover:text-white"}`}>
                Anasayfa
              </button>
              <button onClick={() => navigate("/mycourse")} className={`h-full flex items-center px-4 font-semibold transition-colors ${isActive("/mycourse") || isActive("/course") ? "bg-[#2d3246] text-white" : "text-[#9ca3af] hover:text-white"}`}>
                Derslerim
              </button>
              <button onClick={() => navigate("/grades")} className={`h-full flex items-center px-4 font-semibold transition-colors ${isActive("/grades") ? "bg-[#2d3246] text-white" : "text-[#9ca3af] hover:text-white"}`}>
                Not Çizelgem
              </button>
              <button onClick={() => navigate("/calendar")} className={`h-full flex items-center px-4 font-semibold transition-colors ${isActive("/calendar") ? "bg-[#2d3246] text-white" : "text-[#9ca3af] hover:text-white"}`}>
                Takvim
              </button>
            </>
          )}

          <div 
            onClick={(e) => toggleDropdown('communication', e)}
            className={`relative cursor-pointer h-full flex items-center px-4 font-semibold transition-colors ${(isActive("/messages") || isActive("/announcements") || isActive("/forum") || isActive("/help")) ? "bg-[#2d3246] text-white" : "text-[#9ca3af] hover:text-white"}`}
          >
            İletişim Araçları 
            <svg className={`w-4 h-4 ml-1 transition-transform ${activeDropdown === 'communication' ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path></svg>
            
            {activeDropdown === 'communication' && (
              <div 
                className="absolute top-[66px] left-0 bg-white text-[#495057] w-[200px] rounded-b-[14px] shadow-[0_5px_20px_rgba(0,0,0,0.15)] py-2 z-[100] border-x border-b border-gray-100 cursor-default" 
                onClick={(e) => e.stopPropagation()}
              >
                <div className="flex flex-col">
                  <button onClick={() => { navigate('/messages'); setActiveDropdown(null); }} className="text-left px-5 py-3 hover:bg-gray-50 text-[15px] font-normal transition-colors text-black w-full">Mesajlar</button>
                  <button onClick={() => { navigate('/announcements'); setActiveDropdown(null); }} className="text-left px-5 py-3 hover:bg-gray-50 text-[15px] font-normal transition-colors text-black w-full">Duyurular</button>
                  <button onClick={() => { navigate('/forum'); setActiveDropdown(null); }} className="text-left px-5 py-3 hover:bg-gray-50 text-[15px] font-normal transition-colors text-black w-full">Forum</button>
                  <button onClick={() => { navigate('/help'); setActiveDropdown(null); }} className="text-left px-5 py-3 hover:bg-gray-50 text-[15px] font-normal transition-colors text-black w-full">Yardım</button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="flex items-center gap-5 h-full">
        
        {/* Message Dropdown */}
        <div className="relative h-full flex items-center">
          <button onClick={(e) => toggleDropdown('messages', e)} className="text-[#9ca3af] hover:text-white relative text-lg transition-colors p-1">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"></path></svg>
          </button>
          {activeDropdown === 'messages' && (
            <div className="absolute top-[60px] -right-2 bg-white text-[#495057] w-[320px] rounded-[8px] shadow-[0_5px_20px_rgba(0,0,0,0.15)] z-[100] border border-gray-100 overflow-hidden cursor-default" onClick={(e) => e.stopPropagation()}>
              <div className="absolute -top-[7px] right-[10px] w-4 h-4 bg-[#e9ecef] rotate-45 border-l border-t border-gray-100"></div>
              {/* Header Toggles */}
              <div className="bg-[#e9ecef] p-1.5 flex relative z-10">
                <div className="flex-1 bg-white rounded-[6px] py-1.5 text-center text-[13px] font-semibold text-[#006cb5] shadow-sm cursor-pointer">Mesajlar</div>
                <div className="flex-1 rounded-[6px] py-1.5 text-center text-[13px] font-semibold text-[#6c757d] cursor-pointer hover:text-[#495057] transition-colors">Duyurular</div>
              </div>
              {/* Content */}
              <div className="p-8 flex flex-col items-center justify-center min-h-[220px] bg-white relative z-10 border-t border-gray-200">
                <img src="/almsp/static/media/announcement.bb29c147.svg" alt="Empty" className="w-24 h-24 mb-4 opacity-80" onError={(e) => e.target.style.display='none'} />
                <span className="text-[14px] font-medium text-[#495057]">Yeni mesajınız bulunmamaktadır.</span>
              </div>
            </div>
          )}
        </div>

        {/* Notification Dropdown */}
        <div className="relative h-full flex items-center">
          <button onClick={(e) => toggleDropdown('notifications', e)} className="text-[#9ca3af] hover:text-white transition-colors text-lg relative p-1">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"></path></svg>
          </button>
          {activeDropdown === 'notifications' && (
            <div className="absolute top-[60px] -right-2 bg-white text-[#495057] w-[320px] rounded-[8px] shadow-[0_5px_20px_rgba(0,0,0,0.15)] z-[100] border border-gray-100 overflow-hidden cursor-default" onClick={(e) => e.stopPropagation()}>
              <div className="absolute -top-[7px] right-[10px] w-4 h-4 bg-[#e9ecef] rotate-45 border-l border-t border-gray-100"></div>
              {/* Header Toggles */}
              <div className="bg-[#e9ecef] p-1.5 flex relative z-10">
                <div className="flex-1 rounded-[6px] py-1.5 text-center text-[13px] font-semibold text-[#6c757d] cursor-pointer hover:text-[#495057] transition-colors">Aktiviteler</div>
                <div className="flex-1 bg-white rounded-[6px] py-1.5 text-center text-[13px] font-semibold text-[#006cb5] shadow-sm cursor-pointer">Bildirimler</div>
              </div>
              {/* Content */}
              <div className="p-8 flex flex-col items-center justify-center min-h-[220px] bg-white relative z-10 border-t border-gray-200">
                <img src="/almsp/static/media/announcement.bb29c147.svg" alt="Empty" className="w-24 h-24 mb-4 opacity-80" onError={(e) => e.target.style.display='none'} />
                <span className="text-[14px] font-medium text-[#495057]">Yeni Bildirim Bulunamadı</span>
              </div>
              {/* Footer */}
              <div className="p-3 flex gap-2 bg-white relative z-10 border-t border-gray-100">
                <button className="flex-1 py-2.5 bg-[#f8f9fa] hover:bg-[#e2e6ea] text-[#adb5bd] text-[13px] font-semibold rounded-[6px] transition-colors">Okundu Olarak İşaretle</button>
                <button className="flex-1 py-2.5 bg-[#e9ecef] hover:bg-[#dde2e6] text-[#003d66] text-[13px] font-semibold rounded-[6px] transition-colors">Tüm Bildirimleri Görüntüle</button>
              </div>
            </div>
          )}
        </div>

        {/* Language Dropdown */}
        <div className="relative h-full flex items-center">
          <button onClick={(e) => toggleDropdown('language', e)} className="w-[28px] h-[28px] bg-[#d32f2f] rounded-full flex items-center justify-center text-[11px] font-bold border-[1.5px] border-white shadow-sm cursor-pointer uppercase text-white hover:opacity-90 transition-opacity">
            TR
          </button>
          {activeDropdown === 'language' && (
            <div className="absolute top-[60px] -right-2 bg-white text-[#495057] w-[180px] rounded-[14px] shadow-[0_5px_20px_rgba(0,0,0,0.15)] py-2 px-2 z-[100] border border-gray-100 cursor-default" onClick={(e) => e.stopPropagation()}>
              <div className="absolute -top-[6px] right-[14px] w-3 h-3 bg-[#e9ecef] rotate-45 border-l border-t border-gray-100"></div>
              
              <div className="flex flex-col gap-1 relative z-10">
                <button className="flex items-center gap-3 w-full bg-[#e9ecef] py-2 px-3 rounded-full transition-colors">
                  <div className="w-[22px] h-[22px] bg-[#d32f2f] rounded-full flex items-center justify-center text-[9px] text-white font-bold border border-white shadow-sm">TR</div>
                  <span className="text-[14px] font-medium text-[#495057]">Türkçe</span>
                </button>
                <button className="flex items-center gap-3 w-full hover:bg-gray-50 py-2 px-3 rounded-full transition-colors">
                  <div className="w-[22px] h-[22px] bg-[#1976d2] rounded-full flex items-center justify-center text-[9px] text-white font-bold border border-white shadow-sm">EN</div>
                  <span className="text-[14px] font-medium text-[#495057]">English</span>
                </button>
                <button className="flex items-center gap-3 w-full hover:bg-gray-50 py-2 px-3 rounded-full transition-colors">
                  <div className="w-[22px] h-[22px] bg-[#388e3c] rounded-full flex items-center justify-center text-[9px] text-white font-bold border border-white shadow-sm">AR</div>
                  <span className="text-[14px] font-medium text-[#495057]">عربي</span>
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Profile Dropdown */}
        <div 
          className="relative flex items-center gap-3 border-l border-white/20 pl-5 h-full cursor-pointer hover:bg-white/5 px-2 transition-colors select-none"
          onClick={(e) => toggleDropdown('profile', e)}
        >
          {userInfo?.userpictureurl ? (
            <img
              src={userInfo.userpictureurl.replace("https://moodle.argeyazilim.tr", "/api")}
              alt="Profil"
              className="w-9 h-9 rounded-full object-cover"
            />
          ) : (
            <div className="w-9 h-9 bg-gray-600 rounded-full"></div>
          )}
          <div className="text-left hidden sm:block">
            <div className="text-[13px] font-semibold leading-tight text-white uppercase">
              {loading ? "..." : userInfo?.fullname}
            </div>
            <div className="text-[11px] text-[#9ca3af]">{userRole === 'teacher' ? 'Eğitmen' : 'Öğrenci'}</div>
          </div>
          
          {/* Profile Dropdown Menu */}
          {activeDropdown === 'profile' && (
            <div 
              className="absolute top-[60px] right-2 bg-white text-[#495057] w-[280px] rounded-[14px] shadow-[0_5px_20px_rgba(0,0,0,0.15)] py-4 px-4 z-[100] border border-gray-100 cursor-default" 
              onClick={(e) => e.stopPropagation()}
            >
              {/* Triangle */}
              <div className="absolute -top-[7px] right-[40px] w-4 h-4 bg-white rotate-45 border-l border-t border-gray-100"></div>
              
              {/* Profile Info */}
              <div className="flex items-center gap-3 mb-5 cursor-pointer group">
                <div className="relative shrink-0">
                  {userInfo?.userpictureurl ? (
                    <img src={userInfo.userpictureurl.replace("https://moodle.argeyazilim.tr", "/api")} alt="Profile" className="w-[42px] h-[42px] rounded-full object-cover" />
                  ) : (
                    <div className="w-[42px] h-[42px] bg-gray-200 rounded-full"></div>
                  )}
                </div>
                <div className="flex flex-col flex-1 overflow-hidden">
                  <span className="text-[15px] font-medium text-[#495057] uppercase leading-tight group-hover:text-blue-600 transition-colors truncate">
                    {loading ? "..." : userInfo?.fullname}
                  </span>
                  <span className="text-[13px] text-gray-400 mt-0.5 font-medium">Profili Görüntüle</span>
                </div>
              </div>

              {/* App Buttons */}
              <div className="flex gap-2 mb-4">
                <div className="flex-1 bg-[#0074b6] text-white rounded-[6px] p-2 flex items-center justify-center gap-2 cursor-pointer hover:bg-[#005a96] transition-colors">
                  <svg className="w-5 h-5 fill-current shrink-0" viewBox="0 0 384 512"><path d="M318.7 268.7c-.2-36.7 16.4-64.4 50-84.8-18.8-26.9-47.2-41.7-84.7-44.6-35.5-2.8-74.3 20.7-88.5 20.7-15 0-49.4-19.7-76.4-19.7C63.3 141.2 4 184.8 4 273.5q0 39.3 14.4 81.2c12.8 36.7 59 126.7 107.2 125.2 25.2-.6 43-17.9 75.8-17.9 31.8 0 48.3 17.9 76.4 17.9 48.6-.7 90.4-82.5 102.6-119.3-65.2-30.7-61.7-90-61.7-91.9zm-56.6-164.2c27.3-32.4 24.8-61.9 24-72.5-24.1 1.4-52 16.4-67.9 34.9-17.5 19.8-27.8 44.3-25.6 71.9 26.1 2 49.9-11.4 69.5-34.3z"/></svg>
                  <div className="flex flex-col justify-center">
                    <span className="text-[8px] leading-tight text-white/80">Download on the</span>
                    <span className="text-[12px] font-bold leading-tight">App Store</span>
                  </div>
                </div>
                <div className="flex-1 bg-[#0074b6] text-white rounded-[6px] p-2 flex items-center justify-center gap-2 cursor-pointer hover:bg-[#005a96] transition-colors">
                  <svg className="w-5 h-5 fill-current shrink-0" viewBox="0 0 512 512"><path d="M325.3 234.3L104.6 13l280.8 161.2-60.1 60.1zM47 0C34 6.8 25.3 19.2 25.3 35.3v441.3c0 16.1 8.7 28.5 21.7 35.3l256.6-256L47 0zm425.2 225.6l-58.9-34.1-65.7 64.5 65.7 64.5 60.1-34.1c18-14.3 18-46.5-1.2-60.8zM104.6 499l280.8-161.2-60.1-60.1L104.6 499z"/></svg>
                  <div className="flex flex-col justify-center">
                    <span className="text-[8px] leading-tight text-white/80">GET IT ON</span>
                    <span className="text-[12px] font-bold leading-tight">Google Play</span>
                  </div>
                </div>
              </div>

              {/* Menu Buttons */}
              <div className="flex flex-col gap-2.5">
                <button className="flex items-center gap-3 w-full bg-[#e9ecef] hover:bg-[#dde2e6] py-2.5 px-4 rounded-full transition-colors group">
                  <div className="w-[22px] h-[22px] bg-black rounded-full flex items-center justify-center text-white text-[12px] font-bold shrink-0">?</div>
                  <span className="text-[15px] font-medium text-[#495057] group-hover:text-black">Yardım</span>
                </button>
                <button 
                  onClick={handleLogout}
                  className="flex items-center gap-3 w-full bg-[#e9ecef] hover:bg-[#dde2e6] py-2.5 px-4 rounded-full transition-colors group"
                >
                  <svg className="w-[22px] h-[22px] text-black shrink-0 ml-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" /></svg>
                  <span className="text-[15px] font-medium text-[#495057] group-hover:text-black">Oturumu Kapat</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </nav>
  );
}
