import { useLanguage } from "./LanguageContext";
import { useEffect, useState, useCallback, useRef } from "react";
import { moodlePost } from "./moodleApi";
import { useAuth } from "./AuthContext";
import { useLocation } from "react-router-dom";

export default function Messages() {
  const { t } = useLanguage();
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
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const fetchMessages = useCallback(async () => {
    if (!token || !userInfo || !userInfo.userid) return;
    try {
      const res = await moodlePost(token, "core_message_get_conversations", { 
        userid: userInfo.userid,
        type: 1,
        limitnum: 100,
        limitfrom: 0
      });
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

  
  const loadConversation = useCallback(async (conv) => {
    const peer = conv.members?.find(m => m.id !== userInfo.userid);
    
    localStorage.setItem('lastOpenConvId', conv.id);
    if (peer) {
      localStorage.setItem('lastOpenUserId', peer.id);
    }
    setActiveConv(conv);
    setShowProfile(false);
    setOtherUser(peer || null);
    setOtherUserEmail("Yükleniyor...");
    
    // Fetch profile of the peer
    if (peer && peer.id) {
      moodlePost(token, "core_user_get_users_by_field", {
        field: "id",
        "values[0]": peer.id
      }).then(users => {
        if (users && users.length > 0) {
          setOtherUser(prev => ({ ...prev, ...users[0] }));
          if (users[0].email) {
            setOtherUserEmail(users[0].email);
          } else {
            setOtherUserEmail("Gizli / Bulunamadı");
          }
        } else {
          setOtherUserEmail("Gizli / Bulunamadı");
        }
      }).catch(() => setOtherUserEmail("Gizli / Bulunamadı"));
    }
    
    setLoadingMessages(true);
    try {
      let fetchedMessages = [];
      
      const res = await moodlePost(token, "core_message_get_conversation_messages", {
        currentuserid: userInfo.userid,
        convid: conv.id,
        limitnum: 100,
        limitfrom: 0,
        newest: 1,
        timefrom: 0
      });
      
      if (res && res.messages && res.messages.length > 0) {
        fetchedMessages = [...res.messages].reverse();
      } else {
        // Fallback for legacy messages (Moodle <3.6 or legacy instant messages)
        try {
          const peer = conv.members?.find(m => m.id !== userInfo.userid);
          if (peer) {
            const legacyRes = await moodlePost(token, "core_message_get_messages", {
              useridto: userInfo.userid,
              useridfrom: peer.id,
              type: 'conversations',
              read: 2,
              newestfirst: 1,
              limitnum: 50
            });
            const legacyResOut = await moodlePost(token, "core_message_get_messages", {
              useridto: peer.id,
              useridfrom: userInfo.userid,
              type: 'conversations',
              read: 2,
              newestfirst: 1,
              limitnum: 50
            });
            const allLegacy = [...(legacyRes?.messages || []), ...(legacyResOut?.messages || [])];
            if (allLegacy.length > 0) {
              allLegacy.sort((a, b) => a.timecreated - b.timecreated);
              fetchedMessages = allLegacy;
            }
          }
        } catch(fallbackErr) {
          console.error("Fallback fetch error:", fallbackErr);
        }
      }
      
      setMessages(fetchedMessages);
      
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
  }, [userInfo.userid, token]);

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
  }, [conversations, openConvId, activeConv, loadConversation, userInfo.userid]);

  const handleReply = async () => {
    if (!replyText.trim() || !activeConv) return;
    const sentText = replyText;
    setReplying(true);
    try {
      // Moodle 3.6+ yeni mesaj gönderme API'sini kullan
      const res = await moodlePost(token, "core_message_send_messages_to_conversation", {
        conversationid: activeConv.id,
        "messages[0][text]": sentText,
        "messages[0][textformat]": 1
      });
      
      const otherUserObj = activeConv.members.find(m => m.id !== userInfo.userid);
      
      // Eğer conversation bulunamazsa eski metoda (legacy) fallback yap
      let fallbackRes = null;
      if (!res || res.errorcode) {
        if (otherUserObj) {
          fallbackRes = await moodlePost(token, "core_message_send_instant_messages", {
            "messages[0][touserid]": otherUserObj.id,
            "messages[0][text]": sentText,
            "messages[0][textformat]": 1
          });
        }
      }
      
      const finalRes = (res && !res.errorcode) ? res : fallbackRes;
      
      if (finalRes && finalRes.length > 0 && (finalRes[0].msgid || finalRes[0].id)) {
        const generatedId = finalRes[0].msgid || finalRes[0].id;
        setReplyText("");
        
        // Append locally to instantly show the message
        const newMsg = {
          id: generatedId,
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
          newest: 1
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
            const updatedConv = convRes.conversations.find(c => c.members?.some(m => m.id === otherUserObj?.id));
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
          <h2 className="text-[22px] font-medium text-[#212529]">{t.myMessages}</h2>
        </div>
        
        {loading ? (
          <div className="text-center py-10 text-gray-500">{t.loadingData}</div>
        ) : (
          <div className="bg-white border border-[#e5e7eb] rounded-2xl shadow-[0_8px_30px_rgba(0,0,0,0.04)] flex flex-col md:flex-row h-[750px] overflow-hidden font-sans relative">
            
            {/* EN SOL: KONUŞMA LİSTESİ (Left Pane) */}
            <div className={`w-full md:w-[320px] shrink-0 md:border-r border-[#e5e7eb] flex-col bg-[#fcfcfc] ${activeConv ? 'hidden md:flex' : 'flex'}`}>
              <div className="p-5 border-b border-[#e5e7eb] bg-white flex items-center h-[80px]">
                <h3 className="font-bold text-gray-800 text-[18px] tracking-tight">Mesajlar</h3>
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
                        className={`text-[14px] p-4 border-b border-gray-100 cursor-pointer flex items-center gap-4 transition-all duration-200 group ${activeConv?.id === conv.id ? 'bg-blue-50/70 border-l-4 border-l-[#006cb5]' : 'bg-transparent border-l-4 border-l-transparent hover:bg-gray-50'}`}
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
                              className="text-gray-300 hover:text-red-500 transition-colors p-2 opacity-0 group-hover:opacity-100 rounded-full hover:bg-red-50"
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
              <div className={`flex flex-col flex-1 transition-all duration-300 ${showProfile ? 'md:border-r border-gray-100' : ''} bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] bg-white ${!activeConv ? 'hidden md:flex' : 'flex'}`}>
                {/* Chat Header */}
                <div className="px-4 md:px-6 py-4 flex justify-between items-center bg-white/95 backdrop-blur-md border-b border-gray-100 h-[80px] shadow-sm z-10 sticky top-0">
                  <div className="flex items-center gap-2 md:gap-4">
                    <button 
                      onClick={() => setActiveConv(null)} 
                      className="md:hidden p-2 text-gray-500 hover:text-gray-700 bg-gray-50 rounded-full transition-colors shrink-0"
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7" /></svg>
                    </button>
                    <div 
                      className="flex items-center gap-3 cursor-pointer group"
                      onClick={() => setShowProfile(!showProfile)}
                    >
                      <div className="relative">
                        {otherUser?.profileimageurl ? (
                          <img src={otherUser.profileimageurl} alt="Profil" className="w-11 h-11 rounded-full object-cover shadow-sm ring-2 ring-transparent group-hover:ring-blue-100 transition-all" />
                        ) : (
                          <div className="w-11 h-11 rounded-full bg-gradient-to-br from-blue-50 to-blue-100 flex items-center justify-center font-bold text-blue-600 shadow-sm ring-2 ring-transparent group-hover:ring-blue-100 transition-all">
                            {otherUser?.fullname?.slice(0,1) || "U"}
                          </div>
                        )}
                        <div className="absolute bottom-0 right-0 w-3.5 h-3.5 bg-[#10B981] rounded-full border-2 border-white shadow-sm"></div>
                      </div>
                      <div>
                        <div className="font-bold text-gray-800 text-[16px] group-hover:text-[#006cb5] transition-colors">
                          {otherUser?.fullname || "Kullanıcı"}
                        </div>
                        <div className="text-[12px] text-[#10B981] font-medium tracking-wide">
                          Çevrimiçi
                        </div>
                      </div>
                    </div>
                  </div>
                  <button 
                    onClick={() => setShowProfile(!showProfile)}
                    className="text-gray-400 hover:text-gray-700 hover:bg-gray-50 p-2 rounded-full transition-all"
                  >
                    <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24"><path d="M12 8c1.1 0 2-.9 2-2s-.9-2-2-2-2 .9-2 2 .9 2 2 2zm0 2c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2zm0 6c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2z"/></svg>
                  </button>
                </div>
                
                {/* Messages Area */}
                <div className="flex-1 overflow-y-auto p-6 space-y-6 bg-transparent">
                  {loadingMessages ? (
                    <div className="text-center text-gray-400 py-10 text-sm">Mesajlar yükleniyor...</div>
                  ) : messages.length === 0 ? (
                    <div className="text-center text-gray-400 py-10 text-sm bg-white/50 backdrop-blur rounded-lg">Sohbeti başlatın...</div>
                  ) : (
                    messages.map(msg => {
                      const isMe = msg.useridfrom === userInfo.userid;
                      const time = new Date(msg.timecreated * 1000).toLocaleString('tr-TR', { hour: 'numeric', minute: 'numeric', hour12: false }).toLowerCase();
                      
                      return (
                        <div key={msg.id} className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
                          <div className={`relative max-w-[70%] px-5 py-3 shadow-sm flex flex-col transition-all ${
                            isMe 
                              ? 'bg-gradient-to-r from-[#006cb5] to-[#1e88e5] text-white rounded-2xl rounded-tr-sm' 
                              : 'bg-white text-gray-800 rounded-2xl rounded-tl-sm border border-gray-100 shadow-[0_2px_10px_rgba(0,0,0,0.02)]'
                          }`}>
                            <div className="text-[14.5px] leading-relaxed break-words" dangerouslySetInnerHTML={{ __html: msg.text }}></div>
                            <div className={`text-[10px] mt-2 self-end font-medium tracking-wide ${isMe ? 'text-blue-100' : 'text-gray-400'}`}>
                              {time}
                            </div>
                          </div>
                        </div>
                      );
                    })
                  )}
                  <div ref={messagesEndRef} />
                </div>
                
                {/* Input Area */}
                <div className="p-4 border-t border-gray-100 bg-white flex items-center gap-3">
                  <div className="flex-1 relative flex items-center">
                    <button className="absolute left-3 text-gray-400 hover:text-gray-600 p-2 shrink-0 transition-colors">
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13"></path></svg>
                    </button>
                    <input 
                      type="text"
                      value={replyText}
                      onChange={e => setReplyText(e.target.value)}
                      onKeyDown={e => {
                        if (e.key === 'Enter') { handleReply(); }
                      }}
                      className="w-full bg-[#f4f5f7] px-12 py-3.5 rounded-full text-[14px] focus:outline-none focus:ring-2 focus:ring-[#006cb5]/20 placeholder-gray-400 text-gray-700 transition-all border border-transparent focus:bg-white"
                      placeholder="Bir mesaj yazın..."
                    />
                  </div>
                  <button 
                    onClick={handleReply}
                    disabled={replying || !replyText.trim()}
                    className="bg-[#006cb5] text-white w-12 h-12 rounded-full flex items-center justify-center hover:bg-[#0056b3] transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-[0_4px_14px_rgba(0,108,181,0.39)] shrink-0 group"
                  >
                    {replying ? (
                      <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                    ) : (
                      <svg className="w-5 h-5 ml-1 group-hover:translate-x-0.5 transition-transform" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8"></path></svg>
                    )}
                  </button>
                </div>
              </div>
            ) : (
              <div className="hidden md:flex flex-col flex-1 items-center justify-center bg-[#fbfcfd] border-l border-gray-100">
                <div className="w-[120px] h-[120px] bg-[#f1f3f5] rounded-full flex items-center justify-center mb-6">
                  <svg className="w-16 h-16 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"></path></svg>
                </div>
                <h3 className="text-[16px] font-semibold text-gray-700 mb-2">{t.startMessaging}</h3>
                <p className="text-[14px] text-gray-400">{t.selectConversationHelper}</p>
              </div>
            )}

            {/* SAĞ KISIM: PROFİL BİLGİLERİ (Right Pane) */}
            {(activeConv && showProfile) && (
              <div className="absolute md:relative right-0 top-0 w-full md:w-[320px] shrink-0 bg-white flex flex-col h-full md:border-l border-gray-100 animate-[fadeIn_0.2s_ease-out] z-20 md:z-auto shadow-xl md:shadow-none">
                <div className="p-5 flex justify-end h-[80px] items-center">
                  <button onClick={() => setShowProfile(false)} className="text-gray-400 hover:text-gray-700 bg-gray-50 hover:bg-gray-100 p-2 rounded-full transition-colors">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" /></svg>
                  </button>
                </div>
                
                <div className="flex-1 overflow-y-auto px-8 pb-8 flex flex-col items-center">
                  <div className="w-32 h-32 rounded-full mb-5 relative shadow-[0_8px_30px_rgba(0,0,0,0.08)]">
                    {otherUser?.profileimageurl ? (
                      <img src={otherUser.profileimageurl} alt="Profil" className="w-full h-full rounded-full object-cover border-[5px] border-white" />
                    ) : (
                      <div className="w-full h-full rounded-full bg-gradient-to-br from-[#006cb5] to-blue-400 flex items-center justify-center font-bold text-white text-4xl border-[5px] border-white">
                        {otherUser?.fullname?.slice(0,1) || "U"}
                      </div>
                    )}
                    <div className="absolute bottom-2 right-2 w-5 h-5 bg-[#10B981] rounded-full border-4 border-white shadow-sm"></div>
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
                      <div className="text-[13px] font-semibold text-gray-700 capitalize">
                        {otherUser?.roles && otherUser.roles.length > 0 
                          ? otherUser.roles[0].shortname 
                          : "Sistem Kullanıcısı"}
                      </div>
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
