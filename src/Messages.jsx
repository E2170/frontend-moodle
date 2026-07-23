import { useEffect, useState, useCallback, useRef } from "react";
import { moodlePost } from "./moodleApi";
import { useAuth } from "./AuthContext";
import { useLocation } from "react-router-dom";

export default function Messages() {
  const [conversations, setConversations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeConv, setActiveConv] = useState(null);
  const [messages, setMessages] = useState([]);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [replyText, setReplyText] = useState("");
  const [replying, setReplying] = useState(false);
  const [showProfile, setShowProfile] = useState(false);
  const [otherUser, setOtherUser] = useState(null);
  const [otherUserEmail, setOtherUserEmail] = useState("Yükleniyor...");
  
  const { token, userInfo, userRole } = useAuth();
  const [deleteConfirmId, setDeleteConfirmId] = useState(null);
  const location = useLocation();
  const openConvId = location.state?.openConvId;
  const autoOpened = useRef(false);

  const fetchMessages = useCallback(async () => {
    if (!token || !userInfo || !userInfo.userid) return;
    try {
      const res = await moodlePost(token, "core_message_get_conversations", { userid: userInfo.userid });
      if (res && Array.isArray(res.conversations)) {
        // Filter out conversations that don't have another member (e.g. self-chats that show as 'Kullanıcı')
        const validConvs = res.conversations.filter(c => c.members?.some(m => m.id !== userInfo.userid));
        setConversations(validConvs);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, [token, userInfo]);

  const handleDeleteConversation = async (convId, e) => {
    e.stopPropagation();
    try {
      await moodlePost(token, "core_message_delete_conversations_by_id", {
        userid: userInfo.userid,
        "conversationids[0]": convId
      });
      setConversations(prev => prev.filter(c => c.id !== convId));
      if (activeConv?.id === convId) {
        setActiveConv(null);
        localStorage.removeItem('lastOpenConvId');
      }
      setDeleteConfirmId(null);
    } catch (err) {
      console.error(err);
      alert("Silinirken hata oluştu.");
    }
  };

  useEffect(() => {
    fetchMessages();
  }, [fetchMessages]);

  useEffect(() => {
    if (conversations.length > 0 && !autoOpened.current && !activeConv) {
      const targetUserId = openConvId || localStorage.getItem('lastOpenUserId');
      if (targetUserId) {
        const conv = conversations.find(c => c.members?.some(m => m.id == targetUserId && m.id !== userInfo.userid));
        if (conv) {
          loadConversation(conv);
          autoOpened.current = true;
        } else {
          // If the conversation was deleted previously but they sent a new message,
          // it might not appear in core_message_get_conversations immediately.
          // Try to fetch it directly:
          const token = localStorage.getItem("moodle_token");
          moodlePost(token, "core_message_get_conversation_between_users", {
            userid: userInfo.userid,
            otheruserid: targetUserId,
            includecontactrequests: 0,
            includeprivacyinfo: 0
          }).then(res => {
            if (res && res.id) {
              loadConversation(res);
              autoOpened.current = true;
            }
          }).catch(err => console.error("Could not fetch conversation between users", err));
        }
      }
    }
  }, [conversations, openConvId]);

  async function loadConversation(conv) {
    localStorage.setItem('lastOpenConvId', conv.id);
    const peer = conv.members?.find(m => m.id !== userInfo.userid);
    if (peer) {
      localStorage.setItem('lastOpenUserId', peer.id);
    }
    setActiveConv(conv);
    setShowProfile(false);
    setOtherUser(peer || null);
    setOtherUserEmail("Yükleniyor...");
    
    // Fetch email of the peer
    if (peer && peer.id) {
      moodlePost(token, "core_user_get_users_by_field", {
        field: "id",
        "values[0]": peer.id
      }).then(users => {
        if (users && users.length > 0 && users[0].email) {
          setOtherUserEmail(users[0].email);
        } else {
          setOtherUserEmail("Gizli / Bulunamadı");
        }
      }).catch(() => setOtherUserEmail("Gizli / Bulunamadı"));
    }
    
    setLoadingMessages(true);
    try {
      const res = await moodlePost(token, "core_message_get_conversation_messages", {
        currentuserid: userInfo.userid,
        convid: conv.id,
        limitnum: 100,
        limitfrom: 0,
        newestfirst: 1
      });
      if (res && res.messages) {
        setMessages([...res.messages].reverse());
      }
      
      // Mark as read
      if (conv.unreadcount > 0) {
        await moodlePost(token, "core_message_mark_all_conversation_messages_as_read", {
          userid: userInfo.userid,
          conversationid: conv.id
        });
        // Remove unread count locally to update UI
        setConversations(prev => prev.map(c => c.id === conv.id ? { ...c, unreadcount: 0 } : c));
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoadingMessages(false);
    }
  };

  const handleReply = async () => {
    if (!replyText.trim() || !activeConv) return;
    const sentText = replyText;
    setReplying(true);
    try {
      // Find the other member's id
      const otherUserObj = activeConv.members.find(m => m.id !== userInfo.userid);
      if (!otherUserObj) throw new Error("Other user not found");
      const res = await moodlePost(token, "core_message_send_instant_messages", {
        "messages[0][touserid]": otherUserObj.id,
        "messages[0][text]": sentText,
        "messages[0][textformat]": 1
      });
      if (res && res.length > 0 && res[0].msgid) {
        setReplyText("");
        
        // Append locally to instantly show the message
        const newMsg = {
          id: res[0].msgid,
          useridfrom: userInfo.userid,
          text: sentText,
          timecreated: Math.floor(Date.now() / 1000)
        };
        
        setMessages(prev => [...prev, newMsg]);
        
        // Also fetch in background to ensure sync, but without resetting UI
        moodlePost(token, "core_message_get_conversation_messages", {
          currentuserid: userInfo.userid,
          convid: activeConv.id,
          limitnum: 100,
          limitfrom: 0,
          newestfirst: 1
        }).then(syncRes => {
          if (syncRes && syncRes.messages) {
            setMessages([...syncRes.messages].reverse());
          }
        }).catch(e => console.error("Sync error:", e));

        // Re-fetch conversations to get the actual valid/active conversation ID
        // (This fixes the Moodle bug where sending a message to a deleted conversation creates a new ID but the frontend keeps the old one)
        moodlePost(token, "core_message_get_conversations", {
          userid: userInfo.userid,
          limitnum: 200,
          limitfrom: 0,
          type: 1
        }).then(convRes => {
          if (convRes && convRes.conversations) {
            setConversations(convRes.conversations);
            const updatedConv = convRes.conversations.find(c => c.members?.some(m => m.id === otherUserObj.id));
            if (updatedConv) {
              setActiveConv(updatedConv);
              localStorage.setItem('lastOpenConvId', updatedConv.id);
            }
          }
        }).catch(err => console.error("Conversations sync error:", err));
      }
    } catch (e) {
      console.error(e);
      alert("Mesaj gönderilemedi: " + e.message);
    } finally {
      setReplying(false);
    }
  };

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
        ) : (
          <div className="bg-white border border-[#e9ecef] rounded-lg shadow-sm flex h-[700px] overflow-hidden font-sans">
            
            {/* EN SOL: KONUŞMA LİSTESİ (Left Pane) */}
            <div className="w-[320px] shrink-0 border-r border-[#e9ecef] flex flex-col bg-white">
              <div className="p-4 border-b border-[#e9ecef] bg-gray-50 flex items-center h-[73px]">
                <h3 className="font-bold text-gray-800 text-[16px]">Mesajlar</h3>
              </div>
              <div className="flex-1 overflow-y-auto">
                {conversations.length === 0 ? (
                  <div className="p-6 text-center text-gray-400 text-[14px]">
                    Hiç mesajınız yok.
                  </div>
                ) : (
                  conversations.map(conv => {
                    const isDeleting = deleteConfirmId === conv.id;
                    return (
                      <div 
                        key={conv.id} 
                        onClick={() => !isDeleting && loadConversation(conv)}
                        className={`text-[14px] border-b border-[#f8f9fa] p-4 last:border-0 cursor-pointer flex items-center gap-3 transition-colors group ${activeConv?.id === conv.id ? 'bg-blue-50/50' : 'hover:bg-gray-50'}`}
                      >
                        {isDeleting ? (
                          <div className="flex-1 flex flex-col items-center justify-center animate-[fadeIn_0.2s_ease-out]">
                            <p className="text-[13px] font-semibold text-gray-700 mb-2">Silinsin mi?</p>
                            <div className="flex gap-2">
                              <button 
                                onClick={(e) => handleDeleteConversation(conv.id, e)}
                                className="bg-red-500 hover:bg-red-600 text-white px-3 py-1.5 rounded text-[12px] font-medium transition-colors"
                              >
                                Evet, Sil
                              </button>
                              <button 
                                onClick={(e) => { e.stopPropagation(); setDeleteConfirmId(null); }}
                                className="bg-gray-200 hover:bg-gray-300 text-gray-700 px-3 py-1.5 rounded text-[12px] font-medium transition-colors"
                              >
                                İptal
                              </button>
                            </div>
                          </div>
                        ) : (
                          <>
                            <div className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center font-bold text-blue-600 shrink-0 text-lg">
                              {conv.members?.find(m => m.id !== userInfo.userid)?.fullname?.slice(0,1) || "U"}
                            </div>
                            <div className="flex-1 flex flex-col justify-center min-w-0">
                              <div className="font-bold text-[14px] text-gray-800 truncate">
                                {conv.members?.find(m => m.id !== userInfo.userid)?.fullname || "Kullanıcı"}
                              </div>
                              <div className="text-gray-500 text-[13px] truncate">
                                {stripHtmlTags(conv.messages?.[0]?.text) || "Mesaj yok"}
                              </div>
                            </div>
                            <button 
                              onClick={(e) => { e.stopPropagation(); setDeleteConfirmId(conv.id); }}
                              className="text-gray-300 hover:text-red-500 transition-colors p-1.5 opacity-0 group-hover:opacity-100 rounded-md hover:bg-red-50"
                              title="Sohbeti Sil"
                            >
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                            </button>
                          </>
                        )}
                      </div>
                    );
                  })
                )}
              </div>
            </div>

            {/* ORTA: SOHBET ALANI (Middle Pane) */}
            {activeConv ? (
              <div className={`flex flex-col flex-1 transition-all duration-300 ${showProfile ? 'border-r border-gray-100' : ''}`}>
                {/* Chat Header */}
                <div className="px-6 py-4 flex justify-between items-center bg-white border-b border-gray-50/50 h-[73px]">
                  <div className="flex items-center gap-4">
                    <div 
                      className="flex items-center gap-3 cursor-pointer group"
                      onClick={() => setShowProfile(!showProfile)}
                    >
                      <div className="relative">
                        {otherUser?.profileimageurl ? (
                          <img src={otherUser.profileimageurl} alt="Profil" className="w-10 h-10 rounded-full object-cover" />
                        ) : (
                          <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center font-bold text-gray-500 shadow-sm">
                            {otherUser?.fullname?.slice(0,1) || "U"}
                          </div>
                        )}
                        <div className="absolute bottom-0 right-0 w-3 h-3 bg-[#4CAF50] rounded-full border-2 border-white"></div>
                      </div>
                      <div>
                        <div className="font-bold text-gray-800 text-[15px] group-hover:text-blue-600 transition-colors">
                          {otherUser?.fullname || "Kullanıcı"}
                        </div>
                        <div className="text-[12px] text-[#4ea0d6] font-medium tracking-wide">
                          Online
                        </div>
                      </div>
                    </div>
                  </div>
                  <button 
                    onClick={() => setShowProfile(!showProfile)}
                    className="text-gray-400 hover:text-gray-700 p-2"
                  >
                    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M12 8c1.1 0 2-.9 2-2s-.9-2-2-2-2 .9-2 2 .9 2 2 2zm0 2c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2zm0 6c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2z"/></svg>
                  </button>
                </div>
                
                {/* Messages Area */}
                <div className="flex-1 overflow-y-auto p-6 space-y-5 bg-white">
                  {loadingMessages ? (
                    <div className="text-center text-gray-400 py-10 text-sm">Mesajlar yükleniyor...</div>
                  ) : messages.length === 0 ? (
                    <div className="text-center text-gray-400 py-10 text-sm">Sohbeti başlatın...</div>
                  ) : (
                    messages.map(msg => {
                      const isMe = msg.useridfrom === userInfo.userid;
                      const time = new Date(msg.timecreated * 1000).toLocaleString('en-US', { hour: 'numeric', minute: 'numeric', hour12: true }).toLowerCase();
                      
                      return (
                        <div key={msg.id} className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
                          <div className={`relative max-w-[75%] px-5 py-3 shadow-sm flex flex-col ${
                            isMe 
                              ? 'bg-[#58c6b6] text-white rounded-tl-[16px] rounded-tr-[16px] rounded-bl-[16px] rounded-br-sm' 
                              : 'bg-[#f4f5f7] text-[#4a4a4a] rounded-tr-[16px] rounded-br-[16px] rounded-bl-[16px] rounded-tl-sm'
                          }`}>
                            <div className="text-[14px] leading-relaxed" dangerouslySetInnerHTML={{ __html: msg.text }}></div>
                            <div className={`text-[10px] mt-1.5 self-end ${isMe ? 'text-white/80' : 'text-gray-400'}`}>
                              {time}
                            </div>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
                
                {/* Input Area */}
                <div className="p-4 border-t border-[#f4f5f7] bg-white flex items-center gap-3">
                  <button className="text-gray-400 hover:text-gray-600 p-2 shrink-0 transform -rotate-45">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13"></path></svg>
                  </button>
                  <input 
                    type="text"
                    value={replyText}
                    onChange={e => setReplyText(e.target.value)}
                    onKeyDown={e => {
                      if (e.key === 'Enter') { handleReply(); }
                    }}
                    className="flex-1 bg-transparent px-2 py-2 text-[14px] focus:outline-none placeholder-gray-300 text-gray-700"
                    placeholder="Type something..."
                  />
                  <button 
                    onClick={handleReply}
                    disabled={replying || !replyText.trim()}
                    className="bg-[#2c3238] text-white px-8 py-3 rounded-md text-[13px] font-semibold tracking-wide hover:bg-[#1a1f24] transition-colors disabled:opacity-70 shadow-sm shrink-0"
                  >
                    {replying ? "..." : "Send"}
                  </button>
                </div>
              </div>
            ) : (
              <div className="flex flex-col flex-1 items-center justify-center bg-[#fbfcfd] border-l border-gray-100">
                <div className="w-[120px] h-[120px] bg-[#f1f3f5] rounded-full flex items-center justify-center mb-6">
                  <svg className="w-16 h-16 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"></path></svg>
                </div>
                <h3 className="text-[16px] font-semibold text-gray-700 mb-2">Mesajlaşmaya Başlayın</h3>
                <p className="text-[14px] text-gray-400">Görüntülemek veya mesaj göndermek için soldan bir konuşma seçin.</p>
              </div>
            )}

            {/* SAĞ KISIM: PROFİL BİLGİLERİ (Right Pane) */}
            {(activeConv && showProfile) && (
              <div className="w-[300px] shrink-0 bg-[#fbfcfd] flex flex-col h-full border-l border-gray-100 animate-[fadeIn_0.2s_ease-out]">
                <div className="p-5 flex justify-end">
                  <button onClick={() => setShowProfile(false)} className="text-gray-400 hover:text-gray-700">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" /></svg>
                  </button>
                </div>
                
                <div className="flex-1 overflow-y-auto px-6 pb-6 flex flex-col items-center">
                  <div className="w-28 h-28 rounded-full mb-4 relative shadow-lg">
                    {otherUser?.profileimageurl ? (
                      <img src={otherUser.profileimageurl} alt="Profil" className="w-full h-full rounded-full object-cover border-4 border-white" />
                    ) : (
                      <div className="w-full h-full rounded-full bg-gradient-to-br from-blue-100 to-blue-200 flex items-center justify-center font-bold text-blue-600 text-4xl border-4 border-white">
                        {otherUser?.fullname?.slice(0,1) || "U"}
                      </div>
                    )}
                    <div className="absolute bottom-2 right-2 w-5 h-5 bg-[#4CAF50] rounded-full border-4 border-white"></div>
                  </div>
                  
                  <h2 className="text-[18px] font-bold text-gray-800 text-center mb-1">
                    {otherUser?.fullname || "Kullanıcı"}
                  </h2>
                  <div className="text-[13px] text-[#4ea0d6] font-medium mb-6">
                    {userRole === "teacher" ? "Öğrenci" : "Eğitmen"}
                  </div>

                  <div className="w-full space-y-4">
                    <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm">
                      <div className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1.5">E-Posta Adresi</div>
                      <div className="text-[13px] font-semibold text-gray-700 break-all">{otherUserEmail}</div>
                    </div>
                    
                    <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm">
                      <div className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1.5">Durum</div>
                      <div className="text-[13px] font-semibold text-gray-700">Aktif Öğrenci</div>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
}
