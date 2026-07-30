import { useLanguage } from "./LanguageContext";
import { useEffect, useState, useCallback } from "react";
import { moodlePost, fetchUserAnnouncements } from "./moodleApi";
import { useAuth } from "./AuthContext";

export default function Announcements() {
  const { t } = useLanguage();
  const [announcements, setAnnouncements] = useState([]);
  const [loading, setLoading] = useState(true);
  const { token, userInfo } = useAuth();

  const fetchAnnouncements = useCallback(async () => {
    if (!token || !userInfo || !userInfo.userid) return;
    try {
      const res = await fetchUserAnnouncements(token, userInfo.userid);
      const staticAnnouncements = [
        {
          id: "static_ann_1",
          name: "Afyon Kocatepe Üniversitesi Uzaktan Eğitim Sistemi (Öğrenci)",
          message: `Afyon Kocatepe Üniversitesi Uzaktan Öğretim Sistemi kapsamında öğretim elemanlarının öğrencilere sunulan içerik (doküman, video, ses dosyası, forum kapsamında bulunan bilgiler, sorular vb.) ve Uzaktan Öğretim Sistemini (Akademik LMS) kullanarak elde edilen bilgiler; 5846 sayılı Fikir ve Sanat Eserleri Kanunu, 6769 sayılı Sınai Mülkiyet Kanunu ve ilgili mevzuat koruması altında olup Uzaktan Öğretim Sistemi kullanım şartları aşağıda belirtilmiştir.<br><br>
          Öğrenci, kullanım şartlarına uymayı kabul ve beyan eder.<br><br>
          <b>TANIMLAR</b><br>
          İçerik: Öğretim elemanı tarafından Uzaktan Öğretim Sisteminde öğrencinin istifadesine sunulan her türlü bilgi ve materyal (doküman, video, ses dosyası, forum kapsamında bulunan bilgiler, sorular vb.) ve Uzaktan Öğretim Sistemini (Akademik LMS) kullanarak elde edilen bilgiler.<br><br>
          Öğrenci: Üniversitemiz öğrencisi olup, OBS (Öğrenci Bilgi Sistemi) ve Uzaktan Öğretim Sistemine kullanıcı adı ve şifre ile giriş yetkisi bulunan kişiler.<br><br>
          Uzaktan Öğretim Sistemi (UÖS): Öğrencilerimizin OBS şifreleri ile giriş yaparak uzaktan öğretim yöntemi ile eğitim aldıkları sistem.<br><br>
          Forum: Öğrencilerin öğretim elemanları ile UÖS’de senkron veya asenkron olarak mesajlaşabildikleri ortam.<br><br>
          <b>KULLANIM ŞARTLARI</b><br>
          1. Öğrenciler, 5846 sayılı Fikir ve Sanat Eserleri Kanunu, 6769 sayılı Sınai Mülkiyet Kanunu ve sair T.C. kanunlarına uymak zorundadır.<br>
          2. Öğrenciler UÖS’de ve forum’da elektronik ortamdaki yazışmalarda etik/ahlak ve nezaket kurallarına uymak zorundadırlar. Genel ahlak kurallarına aykırı, saldırı ve hakarete yönelik bir dil kullanılması kabul edilemez. Dersin konusu dışında tartışmalar yapılamaz.<br>
          3. İçerikler, onları paylaşan öğretim elemanlarına aittir. Bu bilgiler sadece öğrencilerimizin kullanımına açıktır. İçerikler, diğer öğrenciler de dâhil olmak üzere üçüncü kişiler ile paylaşılamaz, ticari ve her türlü kazanç getirici faaliyet kapsamında kendi menfaati ve/veya üçüncü kişiler menfaatine kullanılamaz.<br>
          4. İçeriklerin kısmen veya tamamen üçüncü kişilere verilmesi, satılması, internet ortamında paylaşılması, elektronik ortamlarda ve sosyal medyada paylaşım yapılması, soru bankası vb. ortamlara içeriklerin aktarılması yasaktır.<br>
          5. Öğrencilerin UÖS’ne sadece kendilerine ait kullanıcı adı ve şifre ile girebilirler. Başkasına ait giriş bilgilerini kullanamazlar.<br>
          6. Öğrencilerin UÖS genel disiplin ve akışını bozucu davranışta bulunması, başkasına ait bilgiler ile sisteme girmeye çalışması, diğer öğrencilerin giriş bilgilerini elde etmeye çalışmaları yasaktır.<br>
          7. Öğrenci, UÖS üzerinde ticari sır olarak kabul edilebilecek, ekran tasarımı, program tasarımı ve fikri ürün niteliğindeki her türlü bilgiyi korumak için gerekli tedbiri alacaktır.`,
          timemodified: Math.floor(new Date('2024-02-26T18:18:00').getTime() / 1000)
        }
      ];
      
      let allAnns = [...staticAnnouncements];
      if (res && Array.isArray(res)) {
        allAnns = [...allAnns, ...res];
      }
      setAnnouncements(allAnns);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, [token, userInfo]);

  useEffect(() => {
    fetchAnnouncements();
  }, [fetchAnnouncements]);

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
          <h2 className="text-[22px] font-medium text-[#212529]">{t.announcements}</h2>
        </div>
        
        {loading ? (
          <div className="text-center py-10 text-gray-500">{t.loadingData}</div>
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
          <div className="grid gap-6">
            {announcements.map(item => (
              <div key={item.id} className="bg-white rounded-xl p-6 shadow-[0_4px_20px_-4px_rgba(0,0,0,0.05)] border border-gray-100 hover:shadow-[0_8px_30px_-4px_rgba(0,0,0,0.1)] transition-all duration-300 relative overflow-hidden group">
                <div className="absolute top-0 left-0 w-1.5 h-full bg-gradient-to-b from-[#d32f2f] to-[#f44336] opacity-80 group-hover:opacity-100 transition-opacity"></div>
                
                <div className="flex items-start gap-4 mb-4">
                  <div className="w-12 h-12 rounded-full bg-red-50 flex items-center justify-center shrink-0">
                    <svg className="w-6 h-6 text-[#d32f2f]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5.882V19.24a1.76 1.76 0 01-3.417.592l-2.147-6.15M18 13a3 3 0 100-6M5.436 13.683A4.001 4.001 0 017 6h1.832c4.1 0 7.625-1.234 9.168-3v14c-1.543-1.766-5.067-3-9.168-3H7a3.988 3.988 0 01-1.564-.317z" />
                    </svg>
                  </div>
                  <div className="flex-1 min-w-0 pt-1">
                    <h4 className="text-[17px] font-bold text-gray-900 m-0 leading-tight tracking-tight">{item.name}</h4>
                    <div className="text-[12px] text-gray-400 font-medium mt-1 flex items-center gap-1.5">
                      <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                      {formatMoodleDate(item.timemodified)}
                    </div>
                  </div>
                </div>

                <div className="pl-16">
                  <div className="text-[14px] text-gray-700 leading-relaxed font-medium [&>b]:text-gray-900 [&>b]:font-bold [&>br]:content-[''] [&>br]:block [&>br]:mt-2" dangerouslySetInnerHTML={{ __html: item.message }} />
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
