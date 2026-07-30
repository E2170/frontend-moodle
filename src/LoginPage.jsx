import { useState } from "react";
import { moodlePost } from "./moodleApi";
import { useNavigate } from "react-router-dom";
import { useAuth } from "./AuthContext";
import { useLanguage } from "./LanguageContext";

export default function LoginPage() {
  const navigate = useNavigate();
  const { login } = useAuth();
  const { t, language, setLanguage } = useLanguage();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg("");

    const params = new URLSearchParams({
      username: username,
      password: password,
      service: "akuzem_react",
    });

    try {
      const apiBase = import.meta.env.VITE_API_URL || "/api";
      const response = await fetch(`${apiBase}/login/token.php`, {
        method: "POST",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
        },
        body: params.toString(),
      });

      // Ham yanıtı oku
      const rawText = await response.text();
      console.log(`[Login] HTTP ${response.status} yanıtı:`, rawText.substring(0, 500));

      if (!response.ok) {
        throw new Error(`Sunucu hatası (HTTP ${response.status}). Moodle servisi geçici olarak kullanılamıyor olabilir.`);
      }

      let data;
      try {
        data = JSON.parse(rawText);
      } catch {
        console.error("[Login] JSON parse hatası. Gelen yanıt:", rawText.substring(0, 500));
        throw new Error(`Sunucu geçersiz bir yanıt döndürdü (HTTP ${response.status}). Lütfen daha sonra tekrar deneyin.`);
      }

      if (data.token) {
        if (data.privatetoken) {
          localStorage.setItem("moodle_privatetoken", data.privatetoken);
        }

        // Moodle web arayüzü çerezlerini (cookie) almak için arkaplanda Moodle'ın login sayfasını açıp formu otomatik dolduruyoruz.
        // Bu sayede Moodle'ın istediği "logintoken" (CSRF) güvenliğini de aşmış oluyoruz.
        const finishLogin = async () => {
          try {
            // Gerçek web oturumu almak için arkaplanda web login yap
            try {
              const loginPageRes = await fetch(`${apiBase}/login/index.php`);
              const loginHtml = await loginPageRes.text();
              const tokenMatch = loginHtml.match(/name="logintoken" value="([^"]+)"/);
              if (tokenMatch) {
                const logintoken = tokenMatch[1];
                const params = new URLSearchParams({ username, password, logintoken });
                await fetch(`${apiBase}/login/index.php`, {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
                  body: params.toString()
                });
                console.log("Arkaplan web girişi başarılı, gerçek oturum çerezi alındı.");
              }
            } catch (webLoginErr) {
              console.error("Web girişi sırasında hata:", webLoginErr);
            }

            // 1. Kullanıcının temel site bilgilerini al (userid tespiti için)
            const siteInfo = await moodlePost(data.token, "core_webservice_get_site_info");

            let isTeacher = false;

            // Global yönetici kontrolü
            if (siteInfo.userissiteadmin) {
              isTeacher = true;
            }
            // Ders bazlı yetki kontrolü
            else if (siteInfo.userid) {
              const courses = await moodlePost(data.token, "core_enrol_get_users_courses", { userid: siteInfo.userid });

              if (Array.isArray(courses) && courses.length > 0) {
                // Öğretmen olup olmadığını anlamak için, öğrencinin normalde erişemediği "Katılımcı Listesi" (core_enrol_get_enrolled_users) fonksiyonunu deneriz.
                // İlk 10 dersi eşzamanlı olarak kontrol ediyoruz.
                const coursesToCheck = courses.slice(0, 10);
                const accessPromises = coursesToCheck.map(course => 
                  moodlePost(data.token, "core_enrol_get_enrolled_users", { courseid: course.id })
                  .catch(() => ({}))
                );
                
                const accessResults = await Promise.all(accessPromises);
                
                // Eğer dönen sonuç bir Array ise (yani hata mesajı/exception değilse), bu kişi o dersin katılımcı listesini görebiliyordur (Eğitmendir).
                isTeacher = accessResults.some(result => Array.isArray(result) && result.length > 0);
              }
            }

            if (isTeacher) {
              login(data.token, "teacher");
              navigate("/teacher-dashboard");
            } else {
              login(data.token, "student");
              navigate("/dashboard");
            }
          } catch (roleError) {
            console.error("Rol analiz aşamasında sistem hatası:", roleError);
            login(data.token, "student");
            navigate("/dashboard");
          }
        };

        // Token API yeterli, iframe CSRF sorunu yarattığı için direkt devam ediyoruz
        finishLogin();
      } else if (data.error) {
        if (data.error.toLowerCase().includes("invalid login") || data.error.toLowerCase().includes("hatalı")) {
          setErrorMsg("Hatalı kullanıcı adı veya şifre girdiniz. Lütfen kontrol edip tekrar deneyiniz.");
        } else {
          setErrorMsg(data.error);
        }
      } else {
        setErrorMsg(
          "Sunucu doğrulama işlemi sırasında bilinmeyen bir hata oluştu.",
        );
      }
    } catch (err) {
      console.error("Giriş işlemi sırasında hata:", err);
      setErrorMsg(
        err.message || "Sunucu bağlantısı kurulamadı. Lütfen ağ yapılandırmanızı kontrol ediniz.",
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen bg-gray-50">
      <div
        className="hidden lg:flex lg:w-4/5 bg-cover bg-center relative"
        style={{
          backgroundImage:
            "url('https://haber.aku.edu.tr/wp-content/uploads/sites/5/2025/01/09ocak2507.jpeg')",
        }}
      >
        <div className="absolute inset-0 bg-black/20"></div>

        {/* Language Switcher in top right for Login Page */}
        <div className="absolute top-6 right-8 flex gap-3 z-20">
          <button onClick={() => setLanguage('tr')} className={`w-[36px] h-[36px] bg-[#d32f2f] rounded-full flex items-center justify-center text-[12px] font-bold border-[2px] shadow-lg cursor-pointer uppercase text-white transition-all ${language === 'tr' ? 'border-white opacity-100 scale-110' : 'border-transparent opacity-60 hover:opacity-100 scale-100'}`}>TR</button>
          <button onClick={() => setLanguage('en')} className={`w-[36px] h-[36px] bg-[#1976d2] rounded-full flex items-center justify-center text-[12px] font-bold border-[2px] shadow-lg cursor-pointer uppercase text-white transition-all ${language === 'en' ? 'border-white opacity-100 scale-110' : 'border-transparent opacity-60 hover:opacity-100 scale-100'}`}>EN</button>
          <button onClick={() => setLanguage('ar')} className={`w-[36px] h-[36px] bg-[#388e3c] rounded-full flex items-center justify-center text-[12px] font-bold border-[2px] shadow-lg cursor-pointer uppercase text-white transition-all ${language === 'ar' ? 'border-white opacity-100 scale-110' : 'border-transparent opacity-60 hover:opacity-100 scale-100'}`}>AR</button>
        </div>
      </div>

      {/* Tam Ekran Yükleniyor Overlay */}
      {loading && (
        <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-black/70 backdrop-blur-sm animate-fade-in">
          <svg className="animate-spin h-14 w-14 text-blue-500 mb-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
          <div className="text-white text-2xl font-bold tracking-wide shadow-black drop-shadow-lg">
            {t.verifying}
          </div>
          <div className="text-blue-200 mt-2 text-base font-medium">
            {t.pleaseWait}
          </div>
        </div>
      )}

      <div className="w-full lg:w-2/5 flex items-center justify-center p-8 bg-white shadow-[-20px_0_40px_rgba(0,0,0,0.05)] z-10 relative">
        {/* Mobile Language Switcher for Login Page */}
        <div className="absolute top-4 right-4 flex lg:hidden gap-2 z-20">
          <button onClick={() => setLanguage('tr')} className={`w-[28px] h-[28px] bg-[#d32f2f] rounded-full flex items-center justify-center text-[10px] font-bold border-[1.5px] shadow-sm cursor-pointer uppercase text-white transition-opacity ${language === 'tr' ? 'border-gray-800 opacity-100' : 'border-transparent opacity-70 hover:opacity-100'}`}>TR</button>
          <button onClick={() => setLanguage('en')} className={`w-[28px] h-[28px] bg-[#1976d2] rounded-full flex items-center justify-center text-[10px] font-bold border-[1.5px] shadow-sm cursor-pointer uppercase text-white transition-opacity ${language === 'en' ? 'border-gray-800 opacity-100' : 'border-transparent opacity-70 hover:opacity-100'}`}>EN</button>
          <button onClick={() => setLanguage('ar')} className={`w-[28px] h-[28px] bg-[#388e3c] rounded-full flex items-center justify-center text-[10px] font-bold border-[1.5px] shadow-sm cursor-pointer uppercase text-white transition-opacity ${language === 'ar' ? 'border-gray-800 opacity-100' : 'border-transparent opacity-70 hover:opacity-100'}`}>AR</button>
        </div>
        <div className="w-full max-w-md">
          <div className="mb-8 text-center lg:text-left mt-8 lg:mt-0">
            <h1 className="text-3xl font-extrabold text-blue-800 tracking-tight mb-2">
              {t.loginTitle}
            </h1>
            <p className="text-sm text-gray-500">
              {t.loginDesc}
            </p>
          </div>

          {errorMsg && !loading && (
            <div className="mb-4 p-3 text-sm text-red-700 bg-red-100 rounded-lg border border-red-200">
              {errorMsg}
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-5">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">
                {t.username}
              </label>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
                className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all text-sm"
                placeholder={t.usernamePlaceholder}
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">
                {t.password}
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all text-sm"
                placeholder="••••••••"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3.5 bg-blue-700 text-white font-bold rounded-lg hover:bg-blue-800 transition-all disabled:opacity-70"
            >
              {loading ? t.loggingIn : t.loginBtn}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
