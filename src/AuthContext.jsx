import { createContext, useContext, useState, useEffect, useCallback } from "react";
import { moodlePost } from "./moodleApi";
import { useNavigate } from "react-router-dom";

const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [token, setToken] = useState(localStorage.getItem("moodle_token") || null);
  const [userRole, setUserRole] = useState(localStorage.getItem("user_role") || "student");
  const [userInfo, setUserInfo] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const logout = useCallback(() => {
    localStorage.removeItem("moodle_token");
    localStorage.removeItem("user_role");
    setToken(null);
    setUserRole("student");
    setUserInfo(null);
  }, []);

  useEffect(() => {
    const handleTokenExpired = () => {
      logout();
      window.dispatchEvent(new CustomEvent("show_alert", {
        detail: {
          title: "Oturum Süresi Doldu",
          message: "Güvenliğiniz için oturumunuz sonlandırıldı. Lütfen tekrar giriş yapın.",
          type: "error"
        }
      }));
    };
    window.addEventListener("moodle_token_expired", handleTokenExpired);
    return () => window.removeEventListener("moodle_token_expired", handleTokenExpired);
  }, [logout]);

  useEffect(() => {
    if (!token) {
      setLoading(false);
      return;
    }

    const fetchUserInfo = async () => {
      try {
        const data = await moodlePost(token, "core_webservice_get_site_info");
        
        if (data.errorcode) {
          throw new Error(data.message || "Oturum süresi dolmuş veya geçersiz.");
        }

        if (data && data.userid) {
          setUserInfo(data);
          setError(null);
        } else {
          throw new Error("Kullanıcı bilgisi alınamadı.");
        }
      } catch (err) {
        console.error("AuthContext Error:", err);
        setError(err.message);
        // İsteğe bağlı: Token geçersizse çıkış yaptırabiliriz
        if (err.message.includes("Oturum") || err.message.includes("token")) {
           logout();
        }
      } finally {
        setLoading(false);
      }
    };

    fetchUserInfo();
  }, [token]);

  const login = (newToken, role) => {
    localStorage.setItem("moodle_token", newToken);
    localStorage.setItem("user_role", role);
    setToken(newToken);
    setUserRole(role);
  };



  return (
    <AuthContext.Provider value={{ token, userRole, userInfo, loading, error, login, logout, setUserRole }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
