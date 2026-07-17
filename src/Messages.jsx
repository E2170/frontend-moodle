import { useEffect, useState, useCallback } from "react";
import { moodlePost } from "./moodleApi";
import { useAuth } from "./AuthContext";

export default function Messages() {
  const [conversations, setConversations] = useState([]);
  const [loading, setLoading] = useState(true);
  const { token, userInfo } = useAuth();

  const fetchMessages = useCallback(async () => {
    if (!token || !userInfo || !userInfo.userid) return;
    try {
      const res = await moodlePost(token, "core_message_get_conversations", { userid: userInfo.userid });
      if (res && Array.isArray(res.conversations)) {
        setConversations(res.conversations);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, [token, userInfo]);

  useEffect(() => {
    fetchMessages();
  }, [fetchMessages]);

  const stripHtmlTags = (htmlString) => {
    if (!htmlString) return "";
    return htmlString.replace(/<[^>]*>/g, "");
  };

  return (
    <div className="min-h-screen bg-[#fcfcfc] font-sans text-[#495057] antialiased flex flex-col">
      <main className="max-w-[1200px] w-full mx-auto px-4 py-8 flex-1">
        <div className="mb-6">
          <h2 className="text-[22px] font-medium text-[#212529]">Mesajlarım</h2>
        </div>
        
        {loading ? (
          <div className="text-center py-10 text-gray-500">Yükleniyor...</div>
        ) : conversations.length === 0 ? (
          <div className="bg-white border border-[#e9ecef] rounded-[10px] p-12 text-center text-gray-500 font-medium shadow-sm flex flex-col items-center">
            <div className="w-[180px] h-[180px] bg-[#f1f3f5] rounded-full flex items-center justify-center mb-6 relative">
              <svg className="w-24 h-24 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"></path></svg>
            </div>
            <p className="text-[15px] font-semibold text-[#212529]">
              Şu an hiç mesajınız bulunmuyor.
            </p>
          </div>
        ) : (
          <div className="bg-white border border-[#e9ecef] rounded-[10px] p-6 shadow-sm flex flex-col gap-4">
            {conversations.map(conv => (
              <div key={conv.id} className="text-[14px] text-[#212529] border-b border-[#f8f9fa] pb-4 last:border-0 last:pb-0 flex gap-4">
                <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center font-bold text-blue-600 shrink-0">
                  {conv.members?.[0]?.fullname?.slice(0,1) || "U"}
                </div>
                <div className="flex-1">
                  <div className="font-bold mb-1">{conv.members?.[0]?.fullname}</div>
                  <div className="text-[#6c757d]">{stripHtmlTags(conv.messages?.[0]?.text)}</div>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
