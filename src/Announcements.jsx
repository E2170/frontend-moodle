import React, { useEffect, useState, useCallback } from "react";
import { moodlePost } from "./moodleApi";
import { useAuth } from "./AuthContext";

export default function Announcements() {
  const [announcements, setAnnouncements] = useState([]);
  const [loading, setLoading] = useState(true);
  const { token } = useAuth();

  const fetchAnnouncements = useCallback(async () => {
    if (!token) return;
    try {
      const res = await moodlePost(token, "mod_forum_get_forum_discussions", { forumid: "2" });
      if (res && Array.isArray(res.discussions)) {
        setAnnouncements(res.discussions);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    fetchAnnouncements();
  }, [fetchAnnouncements]);

  const stripHtmlTags = (htmlString) => {
    if (!htmlString) return "";
    return htmlString.replace(/<[^>]*>/g, "");
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

  return (
    <div className="min-h-screen bg-[#fcfcfc] font-sans text-[#495057] antialiased flex flex-col">
      <main className="max-w-[1200px] w-full mx-auto px-4 py-8 flex-1">
        <div className="mb-6">
          <h2 className="text-[22px] font-medium text-[#212529]">Duyurular</h2>
        </div>
        
        {loading ? (
          <div className="text-center py-10 text-gray-500">Yükleniyor...</div>
        ) : announcements.length === 0 ? (
          <div className="bg-white border border-[#e9ecef] rounded-[10px] p-12 text-center text-gray-500 font-medium shadow-sm flex flex-col items-center">
            <div className="w-[180px] h-[180px] bg-[#f1f3f5] rounded-full flex items-center justify-center mb-6 relative">
              <svg className="w-24 h-24 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1" d="M11 5.882V19.24a1.76 1.76 0 01-3.417.592l-2.147-6.15M18 13a3 3 0 100-6M5.436 13.683A4.001 4.001 0 017 6h1.832c4.1 0 7.625-1.234 9.168-3v14c-1.543-1.766-5.067-3-9.168-3H7a3.988 3.988 0 01-1.564-.317z"></path></svg>
            </div>
            <p className="text-[15px] font-semibold text-[#212529]">
              Yeni bir duyuru bulunmuyor.
            </p>
          </div>
        ) : (
          <div className="bg-white border border-[#e9ecef] rounded-[10px] p-6 shadow-sm flex flex-col gap-4">
            {announcements.map(item => (
              <div key={item.id} className="text-[14px] text-[#212529] border-b border-[#f8f9fa] pb-4 last:border-0 last:pb-0 flex flex-col gap-2">
                <h4 className="text-[15px] font-bold text-[#212529] m-0 uppercase">📍 {item.name}</h4>
                <p className="text-[#6c757d] leading-snug m-0">{stripHtmlTags(item.message)}</p>
                <div className="text-[12px] text-[#adb5bd] font-medium">{formatMoodleDate(item.timemodified)}</div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
