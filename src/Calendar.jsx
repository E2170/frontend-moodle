import { useEffect, useState, useCallback } from "react";
import { moodlePost } from "./moodleApi";
import { useNavigate } from "react-router-dom";

export default function Calendar() {
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  // Temel Durum Yönetimleri
      const [events, setEvents] = useState([]);

  // Navigasyon ve Tarih Yönetimi (Anlık tarih referans alınır)
  const [currentDate, setCurrentDate] = useState(new Date());
  const [viewType, setViewType] = useState("HAFTA"); // GÜN, HAFTA, AY

  // Aktivite Filtreleri
  const [filters, setFilters] = useState({
    sanalSinif: true,
    odev: true,
    sinav: true,
    video: true,
    forum: true,
    eDers: true,
    dokuman: true,
  });

  // Dinamik olarak seçili haftanın günlerini hesaplama fonksiyonu
  const getWeekDays = useCallback((baseDate) => {
    const currentDay = baseDate.getDay();
    const distanceToMonday = currentDay === 0 ? 6 : currentDay - 1;
    const monday = new Date(baseDate);
    monday.setDate(baseDate.getDate() - distanceToMonday);

    const week = [];
    for (let i = 0; i < 7; i++) {
      const clone = new Date(monday);
      clone.setDate(monday.getDate() + i);
      week.push({
        dayName: clone.toLocaleDateString("en-US", { weekday: "short" }),
        date: clone.getDate().toString().padStart(2, "0"),
        fullDate: clone,
        isCurrent: clone.toDateString() === new Date().toDateString(),
      });
    }
    return week;
  }, []);

  const [weekDays, setWeekDays] = useState([]);

  useEffect(() => {
    setWeekDays(getWeekDays(currentDate));
  }, [currentDate, getWeekDays]);

  const fetchCalendarData = useCallback(async () => {
    const token = localStorage.getItem("moodle_token");
    if (!token) {
      navigate("/");
      return;
    }

    try {


      const eventsData = await moodlePost(token, "core_calendar_get_action_events_by_timesort");

      if (eventsData && Array.isArray(eventsData.events)) {
        setEvents(eventsData.events);
      }
    } catch (error) {
      console.error("Takvim verileri entegrasyon hatası:", error);
    } finally {
      setLoading(false);
    }
  }, [navigate]);

  useEffect(() => {
    fetchCalendarData();
  }, [fetchCalendarData]);

  
  const toggleFilter = (key) => {
    setFilters((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const handlePrevWeek = () => {
    const newDate = new Date(currentDate);
    newDate.setDate(currentDate.getDate() - 7);
    setCurrentDate(newDate);
  };

  const handleNextWeek = () => {
    const newDate = new Date(currentDate);
    newDate.setDate(currentDate.getDate() + 7);
    setCurrentDate(newDate);
  };

  const handleToday = () => {
    setCurrentDate(new Date()); // Mocking today
  };

  const formatMonthYear = (date) => {
    const months = [
      "January", "February", "March", "April", "May", "June",
      "July", "August", "September", "October", "November", "December"
    ];
    return `${date.getDate()} ${months[date.getMonth()]} ${date.getFullYear()}`;
  };

  const hours = Array.from({ length: 17 }, (_, i) => {
    const h = i;
    const ampm = h < 12 ? "AM" : "PM";
    const hour = h % 12 === 0 ? 12 : h % 12;
    return `${hour}:00 ${ampm}`;
  });

  return (
    <div className="h-screen flex flex-col bg-[#f8fafc] font-sans text-[#495057] antialiased overflow-hidden">

      {/* Ana Gövde */}
      <div className="flex flex-col lg:flex-row flex-1 overflow-hidden h-full">
        {/* Sol Panel (Sidebar) */}
        <aside className="w-full lg:w-[280px] bg-[#2d3246] text-white flex flex-col shrink-0 overflow-y-auto max-h-[300px] lg:max-h-full">
          {/* Takvim Başlık */}
          <div className="h-[46px] border-b border-[#3e445a] flex items-center px-4 shrink-0">
            <span className="text-[15px] font-semibold text-white">Takvim</span>
          </div>

          {/* Mini Calendar */}
          <div className="p-4 border-b border-[#3e445a] shrink-0">
            <div className="flex items-center justify-between mb-4 text-[13px] font-semibold">
              <button className="text-gray-400 hover:text-white">&lt;</button>
              <div className="flex items-center gap-1">
                <span>July</span>
                <svg className="w-3 h-3 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path></svg>
                <span>{currentDate.getFullYear()}</span>
              </div>
              <button className="text-gray-400 hover:text-white">&gt;</button>
            </div>
            
            <div className="grid grid-cols-7 gap-1 text-center text-[12px]">
              <div className="text-white font-medium">Mon</div>
              <div className="text-white font-medium">Tue</div>
              <div className="text-white font-medium">Wed</div>
              <div className="text-white font-medium">Thu</div>
              <div className="text-white font-medium">Fri</div>
              <div className="text-[#f56565] font-medium">Sat</div>
              <div className="text-[#f56565] font-medium">Sun</div>
              
              <div className="text-gray-400">29</div>
              <div className="text-gray-400">30</div>
              <div className="text-white font-bold">1</div>
              <div className="text-white font-bold">2</div>
              <div className="text-white font-bold">3</div>
              <div className="text-white font-bold">4</div>
              <div className="text-white font-bold">5</div>
              
              <div className="text-[#f56565] font-bold">6</div>
              <div className="text-white font-bold">7</div>
              <div className="text-white font-bold">8</div>
              <div className="text-white font-bold">9</div>
              <div className="text-white font-bold">10</div>
              <div className="text-white font-bold">11</div>
              <div className="text-white font-bold">12</div>
              
              <div className="text-white font-bold">13</div>
              <div className="text-white font-bold">14</div>
              <div className="text-white font-bold">15</div>
              <div className="text-white font-bold">16</div>
              <div className="text-white font-bold">17</div>
              <div className="text-white font-bold">18</div>
              <div className="text-white font-bold">19</div>
              
              <div className="text-white font-bold">20</div>
              <div className="text-white font-bold">21</div>
              <div className="text-white font-bold">22</div>
              <div className="text-white font-bold">23</div>
              <div className="text-white font-bold">24</div>
              <div className="text-white font-bold">25</div>
              <div className="text-white font-bold">26</div>
              
              <div className="text-white font-bold">27</div>
              <div className="text-white font-bold">28</div>
              <div className="text-white font-bold">29</div>
              <div className="text-white font-bold">30</div>
              <div className="text-white font-bold">31</div>
              <div className="text-gray-400">1</div>
              <div className="text-gray-400">2</div>
              
              <div className="text-gray-400">3</div>
              <div className="text-gray-400">4</div>
              <div className="text-gray-400">5</div>
              <div className="text-gray-400">6</div>
              <div className="text-gray-400">7</div>
              <div className="text-gray-400">8</div>
              <div className="text-gray-400">9</div>
            </div>
          </div>

          {/* Aktivite Tipi Filtreleri */}
          <div className="p-4 flex-1">
            <h3 className="text-[13px] font-semibold mb-4 text-white">
              Aktivite Tipi
            </h3>
            <div className="space-y-3">
              {[
                { key: "sanalSinif", label: "Sanal Sınıf", color: "bg-[#2196f3]" },
                { key: "odev", label: "Ödev", color: "bg-[#4caf50]" },
                { key: "sinav", label: "Sınav", color: "bg-[#9c27b0]" },
                { key: "video", label: "Video", color: "bg-[#ff9800]" },
                { key: "forum", label: "Forum", color: "bg-[#f44336]" },
                { key: "eDers", label: "E-Ders", color: "bg-[#e91e63]" },
                { key: "dokuman", label: "Doküman", color: "bg-[#00bcd4]" },
              ].map((item) => (
                <label
                  key={item.key}
                  className="flex items-center gap-3 cursor-pointer"
                >
                  <input
                    type="checkbox"
                    checked={filters[item.key]}
                    onChange={() => toggleFilter(item.key)}
                    className="hidden"
                  />
                  <div
                    className={`w-[18px] h-[18px] rounded-sm flex items-center justify-center transition-colors ${filters[item.key] ? item.color : "bg-transparent border border-gray-500"}`}
                  >
                    {filters[item.key] && (
                      <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7"></path></svg>
                    )}
                  </div>
                  <span className="text-[13px] font-medium text-[#e2e8f0]">{item.label}</span>
                </label>
              ))}
            </div>
          </div>
        </aside>

        {/* Ana Takvim Alanı */}
        <main className="flex-1 flex flex-col bg-white overflow-x-auto overflow-y-hidden relative border-l border-gray-200">
          {/* Üst Araç Çubuğu */}
          <div className="flex items-center justify-between px-4 py-3 shrink-0 h-[60px] bg-white border-b border-gray-200">
            <div className="flex bg-[#f3f4f6] rounded-[20px] p-[2px]">
              {["GÜN", "HAFTA", "AY"].map((type) => (
                <button
                  key={type}
                  onClick={() => setViewType(type)}
                  className={`px-5 py-1.5 text-[11px] font-bold rounded-[18px] transition-all ${viewType === type ? "bg-white shadow-sm text-gray-800" : "text-gray-500 hover:text-gray-700"}`}
                >
                  {type}
                </button>
              ))}
            </div>

            <div className="text-[15px] font-normal text-gray-800">
              {formatMonthYear(currentDate)}
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={handleToday}
                className="px-4 py-[6px] border border-gray-200 rounded-[20px] bg-[#f9fafb] text-[11px] font-bold text-gray-600 hover:bg-gray-100 transition-colors"
              >
                BUGÜN
              </button>
              <div className="flex gap-1">
                <button
                  onClick={handlePrevWeek}
                  className="w-[34px] h-[34px] flex items-center justify-center border border-gray-200 rounded-[8px] bg-[#f9fafb] hover:bg-gray-100 text-gray-600 transition-colors"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7"></path></svg>
                </button>
                <button
                  onClick={handleNextWeek}
                  className="w-[34px] h-[34px] flex items-center justify-center border border-gray-200 rounded-[8px] bg-[#f9fafb] hover:bg-gray-100 text-gray-600 transition-colors"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7"></path></svg>
                </button>
              </div>
            </div>
          </div>

          {/* Izgara Başlıkları */}
          <div className="flex border-b border-gray-200 shrink-0 bg-white z-10 min-w-[700px]">
            <div className="w-[80px] shrink-0 border-r border-gray-200"></div>
            <div className="flex-1 grid grid-cols-7">
              {weekDays.map((day, idx) => (
                <div
                  key={idx}
                  className={`py-3 text-center border-r border-gray-200 last:border-r-0 flex flex-col items-center justify-center ${day.isCurrent ? "bg-[#eef5fd]" : ""}`}
                >
                  <span className={`text-[12px] font-medium ${day.isCurrent ? "text-gray-800" : "text-gray-600"}`}>
                    {day.dayName}
                  </span>
                  <span
                    className={`text-[20px] font-bold leading-tight mt-1 flex items-center justify-center ${day.isCurrent ? "bg-[#f44336] text-white rounded-[20px] px-3 py-0.5 min-w-[32px] min-h-[32px]" : "text-gray-800"}`}
                  >
                    {day.date}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Saat Izgarası */}
          <div className="flex-1 overflow-y-auto relative bg-white">
            <div className="flex min-w-[700px]">
              {/* Sol Saat Etiketleri */}
              <div className="w-[80px] shrink-0 flex flex-col bg-white z-10 sticky left-0 border-r border-gray-200">
                {hours.map((hour, idx) => (
                  <div
                    key={idx}
                    className="h-[48px] border-b border-transparent text-[11px] font-medium text-gray-400 text-right pr-3 py-1.5 select-none relative"
                  >
                    {/* Saat çizgisini ayarlamak için textin hizalaması tam üstte olmalı */}
                    <span className="relative -top-3">{hour}</span>
                  </div>
                ))}
              </div>

              {/* Gün Sütunları */}
              <div className="flex-1 grid grid-cols-7 relative">
                {/* Yatay Çizgiler */}
                <div className="absolute inset-0 pointer-events-none flex flex-col">
                  {hours.map((_, idx) => (
                    <div
                      key={idx}
                      className="h-[48px] border-t border-gray-200 w-full"
                    ></div>
                  ))}
                </div>

                {/* Sütun Veri Hücreleri */}
                {weekDays.map((day, colIdx) => (
                  <div
                    key={colIdx}
                    className={`border-r border-gray-200 last:border-r-0 h-full relative ${day.isCurrent ? "bg-[#eef5fd]" : ""}`}
                  >
                    {/* Eğer "Bugün" sütunuysa anlık zaman çizgisini göster (Mock olarak saat 10:30) */}
                    {day.isCurrent && (
                      <div className="absolute left-0 right-0 h-[2px] bg-[#4caf50] z-20" style={{ top: "420px" }}></div>
                    )}
                    
                    {/* Normalde etkinlikler buraya gelecek */}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
