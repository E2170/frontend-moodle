import { useState } from "react";
import { moodlePost } from "./moodleApi";
import { useNavigate } from "react-router-dom";
import { useAuth } from "./AuthContext";

export default function LoginPage() {
  const navigate = useNavigate();
  const { login } = useAuth();
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
      const response = await fetch(`/api/login/token.php`, {
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
      } catch (parseError) {
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
              const loginPageRes = await fetch('/api/login/index.php');
              const loginHtml = await loginPageRes.text();
              const tokenMatch = loginHtml.match(/name="logintoken" value="([^"]+)"/);
              if (tokenMatch) {
                const logintoken = tokenMatch[1];
                const params = new URLSearchParams({ username, password, logintoken });
                await fetch('/api/login/index.php', {
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
        setErrorMsg(data.error);
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
      </div>

      <div className="w-full lg:w-2/5 flex items-center justify-center p-8 bg-white shadow-[-20px_0_40px_rgba(0,0,0,0.05)] z-10">
        <div className="w-full max-w-md">
          <div className="mb-8 text-center lg:text-left">
            <h1 className="text-3xl font-extrabold text-blue-800 tracking-tight mb-2">
              AKUZEM GİRİŞ
            </h1>
            <p className="text-sm text-gray-500">
              Sisteme erişim sağlamak için kimlik bilgilerinizi giriniz.
            </p>
          </div>

          {errorMsg && (
            <div className="mb-4 p-3 text-sm text-red-700 bg-red-100 rounded-lg border border-red-200">
              {errorMsg}
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-5">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">
                Kullanıcı adı
              </label>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
                className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all text-sm"
                placeholder="Kullanıcı adınızı giriniz"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">
                Şifre
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
              {loading ? "Sistem Sorgulanıyor..." : "Giriş yap"}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
